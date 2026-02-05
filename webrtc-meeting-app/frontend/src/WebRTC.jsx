import { useEffect, useRef, useState, useCallback } from 'react'
import io from 'socket.io-client'
import axios from 'axios'

// Server URL configuration
const getServerURL = () => {
  // In production, use environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // In development, always use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001'
  }
  
  // For local network access (e.g., from mobile device on same network)
  // If accessing via IP address, use that IP for the backend
  if (/^192\.168\.\d+\.\d+$/.test(window.location.hostname) || /^10\.\d+\.\d+\.\d+$/.test(window.location.hostname)) {
    return `http://${window.location.hostname}:3001`
  }
  
  // Fallback to localhost
  return 'http://localhost:3001'
}

const SOCKET_SERVER = getServerURL()
const API_SERVER = getServerURL()

// STUN servers for NAT traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
}

function WebRTCMeeting({ roomId, userName, userRole = 'party', isChair = false, onLeave }) {
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [participants, setParticipants] = useState([])
  const [remoteStreamsReady, setRemoteStreamsReady] = useState({})
  const [activeSpeaker, setActiveSpeaker] = useState(null)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [sessionReport, setSessionReport] = useState(null)
  const [error, setError] = useState(null)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  
  // Dress Code Check state (MVP feature - lawyers only)
  const [dressCodeWarning, setDressCodeWarning] = useState(null)
  const [lastDressCodeCheck, setLastDressCodeCheck] = useState(0)
  
  // Camera Off Warning state
  const [cameraOffWarning, setCameraOffWarning] = useState(false)
  
  // Refs
  const socket = useRef(null)
  const localStream = useRef(null)
  const peerConnections = useRef(new Map()) // socketId -> RTCPeerConnection
  const remoteStreams = useRef(new Map()) // socketId -> MediaStream
  const mediaRecorder = useRef(null)
  const audioChunks = useRef([])
  const audioContext = useRef(null)
  const audioAnalysers = useRef(new Map()) // socketId -> AnalyserNode
  const activeSpeakerTimeout = useRef(null)
  const dressCodeCheckInterval = useRef(null)
  
  const localVideoRef = useRef(null)

  // Initialize WebRTC and Socket
  useEffect(() => {
    console.log('🚀 Initializing Many-to-Many WebRTC Meeting...')
    initializeMedia()
    initializeSocket()
    
    // Start dress code checking for ALL participants (judicial requirement)
    console.log('👔 Starting dress code monitoring for', userRole)
      startDressCodeMonitoring()
    
    return () => {
      cleanup()
      // Stop dress code monitoring
      if (dressCodeCheckInterval.current) {
        clearInterval(dressCodeCheckInterval.current)
      }
    }
  }, [])

  // Debug: Track participants changes
  useEffect(() => {
    console.log('👥 Participants state updated:', participants.length)
    console.log('👥 Participants:', participants.map(p => ({
      id: p.socketId,
      name: p.participantId,
      role: p.role
    })))
  }, [participants])

  // Debug: Track remote streams changes
  useEffect(() => {
    console.log('📺 Remote streams ready:', remoteStreamsReady)
    console.log('📺 Remote streams count:', remoteStreams.current.size)
  }, [remoteStreamsReady])

  const initializeMedia = async () => {
    try {
      console.log('📹 Requesting camera and microphone access...')
      
      alert('⚠️ للانضمام للجلسة، يرجى السماح باستخدام الكاميرا والمايكروفون.\n\nسيظهر طلب الإذن في المتصفح الآن.')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      localStream.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      
      // Start recording audio
      startRecording(stream)
      
      // Setup active speaker detection for local user
      setupActiveSpeakerDetection(stream, 'local')
      
      console.log('✅ Media initialized successfully')
      
    } catch (err) {
      console.error('❌ Media error:', err)
      let errorMessage = ''
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = '⚠️ لم يتم منح الإذن باستخدام الكاميرا والمايكروفون.\n\nيُرجى السماح بالأذونات في المتصفح وتحديث الصفحة للانضمام إلى الجلسة.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = '⚠️ لم يتم العثور على كاميرا أو مايكروفون متصل بالجهاز.\n\nتحقق من توصيل الأجهزة وحاول مرة أخرى.'
      } else {
        errorMessage = '⚠️ حدث خطأ في الوصول إلى الكاميرا أو المايكروفون.\n\nيُرجى التحقق من إعدادات الجهاز والمتصفح.'
      }
      
      setError(errorMessage)
      alert(errorMessage)
    }
  }

  const startRecording = (stream) => {
    try {
      const audioStream = new MediaStream(stream.getAudioTracks())
      
      // Choose best audio format available
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm'
      }
      
      mediaRecorder.current = new MediaRecorder(audioStream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000 // Higher bitrate for better quality (128 kbps)
      })
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data)
        }
      }
      
      mediaRecorder.current.start()
      console.log('🎙️ Recording started with', mimeType, 'at 128kbps')
    } catch (err) {
      console.error('❌ Recording error:', err)
    }
  }

  // Active Speaker Detection using Web Audio API
  const setupActiveSpeakerDetection = (stream, socketId) => {
    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      
      const source = audioContext.current.createMediaStreamSource(stream)
      const analyser = audioContext.current.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.8
      
      source.connect(analyser)
      audioAnalysers.current.set(socketId, analyser)
      
      // Start monitoring audio levels
      monitorAudioLevels(socketId, analyser)
      
    } catch (err) {
      console.error('❌ Active speaker detection error:', err)
    }
  }

  const monitorAudioLevels = (socketId, analyser) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const SPEAKING_THRESHOLD = 40 // Adjust as needed
    
    const checkLevel = () => {
      if (!analyser) return
      
      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      
      if (average > SPEAKING_THRESHOLD) {
        handleActiveSpeaker(socketId)
      }
      
      requestAnimationFrame(checkLevel)
    }
    
    checkLevel()
  }

  const handleActiveSpeaker = useCallback((socketId) => {
    // Clear previous timeout
    if (activeSpeakerTimeout.current) {
      clearTimeout(activeSpeakerTimeout.current)
    }
    
    // Set new active speaker
    setActiveSpeaker(socketId)
    
    // Emit to others if it's local user
    if (socketId === 'local' && socket.current) {
      socket.current.emit('active-speaker', {
        roomId,
        participantId: userName,
        role: userRole
      })
    }
    
    // Clear active speaker after 1.5 seconds of silence
    activeSpeakerTimeout.current = setTimeout(() => {
      setActiveSpeaker(null)
    }, 1500)
  }, [roomId, userName, userRole])

  const initializeSocket = () => {
    socket.current = io(SOCKET_SERVER)
    
    socket.current.on('connect', () => {
      console.log('🔌 Socket connected')
      socket.current.emit('join-room', { 
        roomId, 
        participantId: userName,
        role: userRole 
      })
    })
    
    // Receive list of existing participants when joining
    socket.current.on('room-users', (existingParticipants) => {
      console.log('👥 Existing participants:', existingParticipants)
      console.log('📊 My socket ID:', socket.current.id)
      console.log('📊 Number of existing participants:', existingParticipants.length)

      const others = existingParticipants.filter(p => p.socketId !== socket.current.id)
      console.log('📊 Other participants (excluding me):', others.length)
      console.log('📊 Other participants details:', others)

      setParticipants(others)

      // NO peer connections created here - we wait for existing users to send offers
      console.log('⏳ Waiting for offers from existing participants...')
    })
    
    // New user joined
    socket.current.on('user-joined', (newParticipant) => {
      console.log('👋 User joined:', newParticipant)
      console.log(`📊 New participant: ${newParticipant.participantId} (${newParticipant.socketId})`)
      
      setParticipants(prev => {
        console.log('📊 Previous participants:', prev.length)
        const updated = [...prev, newParticipant]
        console.log('📊 Updated participants:', updated.length)
        return updated
      })
      
      // EXISTING USER: Create connection and send offer immediately
      console.log(`🔗 I (existing user) will create connection with new user and send offer`)
      createPeerConnection(newParticipant.socketId, newParticipant, true)
    })
    
    // Handle WebRTC signaling
    socket.current.on('offer', async ({ offer, from }) => {
      console.log('📥 Received offer from:', from)
      console.log('📊 Offer SDP type:', offer.type)
      
      let pc = peerConnections.current.get(from)
      
      if (!pc) {
        console.warn('⚠️ No peer connection exists for:', from)
        console.log('🔧 Creating peer connection NOW to receive offer')
        
        // Create a peer connection to handle this offer
        const participant = {
          socketId: from,
          participantId: from,
          role: 'participant'
        }
        
        // Create peer connection WITHOUT sending offer
        const newPc = new RTCPeerConnection(ICE_SERVERS)
        peerConnections.current.set(from, newPc)
        console.log('✅ New peer connection created for:', from)
        
        // Add local stream tracks
        if (localStream.current) {
          localStream.current.getTracks().forEach(track => {
            console.log(`➕ Adding local ${track.kind} track to peer ${from}`)
            newPc.addTrack(track, localStream.current)
          })
        }
        
        // Handle incoming tracks
        newPc.ontrack = (event) => {
          console.log('📺 Remote track from:', from, event.track.kind)
          
          if (event.streams && event.streams[0]) {
            const stream = event.streams[0]
            console.log('📺 Stream tracks:', stream.getTracks().map(t => `${t.kind} (${t.readyState})`))
            
            remoteStreams.current.set(from, stream)
            console.log('✅ Remote stream stored for:', from)
            
            // Setup speaker detection for remote stream
            if (event.track.kind === 'audio') {
              setupActiveSpeakerDetection(stream, from)
            }
            
            // Mark this remote stream as ready and trigger re-render
            setRemoteStreamsReady(prev => {
              const updated = {
                ...prev,
                [from]: true
              }
              console.log('📊 Remote streams ready:', updated)
              return updated
            })
            
            console.log(`✅ Remote stream ready for ${from}`)
          }
        }
        
        // Handle ICE candidates
        newPc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.current.emit('ice-candidate', {
              candidate: event.candidate,
              roomId,
              to: from
            })
          }
        }
        
        // Monitor connection state
        newPc.onconnectionstatechange = () => {
          console.log(`🔗 Connection state with ${from}:`, newPc.connectionState)
        }
        
        pc = newPc
      }
      
      try {
        console.log('📝 Setting remote description...')
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        console.log('✅ Remote description set')
        
        console.log('📝 Creating answer...')
        const answer = await pc.createAnswer()
        console.log('✅ Answer created')
        
        console.log('📝 Setting local description...')
        await pc.setLocalDescription(answer)
        console.log('✅ Local description set')
        
        console.log('📤 Sending answer to:', from)
        socket.current.emit('answer', { answer, roomId, to: from })
        console.log('✅ Answer sent successfully')
      } catch (err) {
        console.error('❌ Offer handling error:', err)
        console.error('❌ Error details:', err.message)
      }
    })
    
    socket.current.on('answer', async ({ answer, from }) => {
      console.log('📥 Received answer from:', from)
      
      const pc = peerConnections.current.get(from)
      if (!pc) {
        console.error('❌ No peer connection for:', from)
        return
      }
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
        console.log('✅ Connection established with:', from)
      } catch (err) {
        console.error('❌ Answer handling error:', err)
      }
    })
    
    socket.current.on('ice-candidate', async ({ candidate, from }) => {
      console.log('🧊 Received ICE candidate from:', from)
      
      const pc = peerConnections.current.get(from)
      if (!pc) return
      
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) {
        console.error('❌ ICE candidate error:', err)
      }
    })
    
    // User left
    socket.current.on('user-left', ({ socketId }) => {
      console.log('👋 User left:', socketId)
      setParticipants(prev => prev.filter(p => p.socketId !== socketId))
      
      // Close and remove peer connection
      const pc = peerConnections.current.get(socketId)
      if (pc) {
        pc.close()
        peerConnections.current.delete(socketId)
      }
      
      // Remove remote stream
      remoteStreams.current.delete(socketId)
      
      // Remove audio analyser
      audioAnalysers.current.delete(socketId)
    })
    
    // Active speaker from remote
    socket.current.on('active-speaker', ({ socketId }) => {
      setActiveSpeaker(socketId)
      
      // Clear after timeout
      if (activeSpeakerTimeout.current) {
        clearTimeout(activeSpeakerTimeout.current)
      }
      activeSpeakerTimeout.current = setTimeout(() => {
        setActiveSpeaker(null)
      }, 1500)
    })
    
    // Session ended by someone
    socket.current.on('session-ended', ({ endedBy, role }) => {
      console.log(`🛑 Session ended by ${endedBy} (${role})`)
      
      // IMMEDIATELY stop all media tracks
      stopAllMedia()
      
      setSessionEnded(true)
      setError(`تم إنهاء الجلسة من قبل ${endedBy}`)
      
      // Close connections after media stopped
      setTimeout(() => {
        cleanup()
      }, 500)
    })
  }

  const createPeerConnection = (socketId, participant, shouldOffer) => {
    console.log(`🔗 Creating peer connection with ${socketId} (offer: ${shouldOffer})`)
    console.log('📊 Participant info:', participant)
    console.log('📊 Local stream available:', !!localStream.current)
    
    if (localStream.current) {
      const tracks = localStream.current.getTracks()
      console.log('📊 Local stream tracks:', tracks.map(t => `${t.kind} (enabled: ${t.enabled}, state: ${t.readyState})`))
    }
    
    const pc = new RTCPeerConnection(ICE_SERVERS)
    peerConnections.current.set(socketId, pc)
    console.log('✅ Peer connection created and stored')
    
    // Add local stream tracks
    if (localStream.current) {
      const addedTracks = []
      localStream.current.getTracks().forEach(track => {
        console.log(`➕ Adding local ${track.kind} track to peer ${socketId}`)
        const sender = pc.addTrack(track, localStream.current)
        addedTracks.push({kind: track.kind, senderId: sender.id})
      })
      console.log('✅ Added tracks:', addedTracks)
    } else {
      console.error('❌ No local stream available to add tracks!')
    }
    
    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('📺 Remote track from:', socketId, event.track.kind)
      console.log('📺 Track details:', {
        kind: event.track.kind,
        id: event.track.id,
        enabled: event.track.enabled,
        readyState: event.track.readyState,
        muted: event.track.muted
      })
      console.log('📺 Streams count:', event.streams.length)
      
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0]
        const streamTracks = stream.getTracks()
        console.log('📺 Stream tracks:', streamTracks.map(t => `${t.kind} (${t.readyState})`))
        
        remoteStreams.current.set(socketId, stream)
        console.log('✅ Remote stream stored for:', socketId)
        
        // Setup speaker detection for remote stream
        if (event.track.kind === 'audio') {
          setupActiveSpeakerDetection(stream, socketId)
        }
        
        // Mark this remote stream as ready and trigger re-render
        setRemoteStreamsReady(prev => {
          const updated = {
            ...prev,
            [socketId]: true
          }
          console.log('📊 Remote streams ready:', updated)
          return updated
        })
        
        console.log(`✅ Remote stream ready for ${socketId}`)
      } else {
        console.warn('⚠️ No streams in ontrack event for:', socketId)
      }
    }
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit('ice-candidate', {
          candidate: event.candidate,
          roomId,
          to: socketId
        })
      }
    }
    
    // Monitor connection state
    pc.onconnectionstatechange = () => {
      console.log(`🔗 Connection state with ${socketId}:`, pc.connectionState)
    }
    
    // If we should create offer (we're the existing user)
    if (shouldOffer) {
      createOffer(socketId)
    }
  }

  const createOffer = async (socketId) => {
    console.log('📤 Creating offer for:', socketId)
    const pc = peerConnections.current.get(socketId)
    
    if (!pc) {
      console.error('❌ No peer connection found for:', socketId)
      return
    }
    
    console.log('📊 Peer connection state:', pc.connectionState)
    console.log('📊 Signaling state:', pc.signalingState)
    
    try {
      console.log('📝 Creating offer...')
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })
      console.log('✅ Offer created')
      
      console.log('📝 Setting local description...')
      await pc.setLocalDescription(offer)
      console.log('✅ Local description set')
      
      console.log('📤 Sending offer to:', socketId)
      socket.current.emit('offer', { offer, roomId, to: socketId })
      console.log('✅ Offer sent successfully')
    } catch (err) {
      console.error('❌ Create offer error:', err)
      console.error('❌ Error details:', err.message)
    }
  }

  const toggleCamera = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0]
      if (videoTrack) {
        // Toggle camera state (allow user to turn off)
        videoTrack.enabled = !videoTrack.enabled
        setIsCameraOn(videoTrack.enabled)
        
        console.log(`📹 Camera ${videoTrack.enabled ? 'ON' : 'OFF'}`)
        
        // If camera is turned OFF, show violation warning
        if (!videoTrack.enabled) {
          // Show warning banner
          setCameraOffWarning(true)
          
          // Emit socket event to notify all participants
          if (socket.current) {
            socket.current.emit('camera-off-detected', {
              roomId,
              participantId: userName,
              role: userRole,
              timestamp: new Date().toISOString()
            })
            console.log('🚨 Camera turned OFF - violation emitted')
          }
        } else {
          // Camera turned back ON - hide warning
          setCameraOffWarning(false)
        }
      } else {
        console.warn('⚠️ No video track found')
      }
    } else {
      console.warn('⚠️ No local stream')
    }
  }

  const toggleMic = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMicOn(audioTrack.enabled)
        console.log(`🎤 Microphone ${audioTrack.enabled ? 'ON' : 'OFF'}`)
      } else {
        console.warn('⚠️ No audio track found')
      }
    } else {
      console.warn('⚠️ No local stream')
    }
  }

  // Stop all media immediately (camera + mic)
  const stopAllMedia = () => {
    console.log('🛑 Stopping all media tracks...')

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        console.log(`⏹️ Stopping ${track.kind} track`)
        track.stop()
        track.enabled = false
      })
    }

    remoteStreams.current.forEach((stream) => {
      stream.getTracks().forEach(track => {
        track.stop()
        track.enabled = false
      })
    })

    setIsCameraOn(false)
    setIsMicOn(false)
    console.log('✅ All media stopped')
  }

  const endSession = () => {
    if (confirm('هل أنت متأكد من إنهاء الجلسة؟\nسيتم إنهاء الجلسة لجميع المشاركين.')) {
      console.log('🛑 Ending session for everyone')
      stopAllMedia()
      socket.current.emit('end-session', { roomId })
      setTimeout(() => {
        analyzeSession()
      }, 1000)
    }
  }

  const endMeeting = () => {
    if (!isChair) {
      alert('وفق شروط الجلسات القضائية: لا يجوز إنهاء الجلسة أو إيقاف التسجيل إلا من قبل رئيس الجلسة فقط.')
      return
    }
    endSession()
  }

  const analyzeSession = async () => {
    setIsAnalyzing(true)
    
    // Stop recording
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop()
      
      await new Promise(resolve => {
        mediaRecorder.current.onstop = resolve
      })
    }
    
    // Upload and analyze
    await uploadAndAnalyze()
    
    // Cleanup
    cleanup()
  }

  const uploadAndAnalyze = async () => {
    try {
      if (audioChunks.current.length === 0) {
        setError('لم يتم تسجيل صوت')
        return
      }
      
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
      
      // Upload audio
      const formData = new FormData()
      formData.append('audio', audioBlob, `${userName}-${Date.now()}.webm`)
      formData.append('participantId', userName)
      formData.append('roomId', roomId)
      
      console.log('📤 Uploading audio...')
      const uploadResponse = await axios.post(`${API_SERVER}/upload-audio`, formData)
      
      const audioFile = {
        ...uploadResponse.data,
        role: userRole
      }
      
      // Generate Session Content Report
      console.log('📊 Generating Session Content Report...')
      const reportResponse = await axios.post(`${API_SERVER}/generate-session-report`, {
        audioFiles: [audioFile],
        roomId: roomId
      })
      
      if (reportResponse.data.success) {
        setSessionReport(reportResponse.data.report)
        console.log('✅ Session Content Report generated')
      } else {
        throw new Error(reportResponse.data.error || 'Report generation failed')
      }
      
    } catch (err) {
      console.error('❌ Report generation error:', err)
      setError('فشل إنشاء تقرير الجلسة: ' + (err.response?.data?.error || err.message))
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Dress Code Monitoring (MVP - Lawyers Only)
  const startDressCodeMonitoring = () => {
    // Check every 15 seconds
    dressCodeCheckInterval.current = setInterval(() => {
      performDressCodeCheck()
    }, 15000)
    
    // Initial check after 5 seconds
    setTimeout(() => {
      performDressCodeCheck()
    }, 5000)
  }

  const performDressCodeCheck = async () => {
    // Check for ALL participants (judicial requirement)
    console.log('👔 performDressCodeCheck called for role:', userRole)
    
    // Don't spam checks (minimum 20 seconds between warnings)
    const now = Date.now()
    if (now - lastDressCodeCheck < 20000) {
      return
    }
    
    try {
      // Capture frame from local video
      const frame = captureVideoFrame()
      if (!frame) return
      
      console.log('👔 Checking dress code...')
      
      // Send to backend
      const response = await axios.post(`${API_SERVER}/check-dress-code`, {
        imageBase64: frame,
        role: userRole
      })
      
      if (response.data.success && response.data.result) {
        const { compliant, warning } = response.data.result
        
        if (!compliant && warning) {
          // Show warning
          setDressCodeWarning(warning)
          setLastDressCodeCheck(now)
          
          // Auto-hide after 10 seconds
          setTimeout(() => {
            setDressCodeWarning(null)
          }, 10000)
          
          console.log('⚠️ Dress code warning:', warning)
        } else if (compliant) {
          // Hide warning if now compliant
          setDressCodeWarning(null)
          console.log('✅ Dress code compliant')
        }
      }
      
    } catch (err) {
      console.error('❌ Dress code check error:', err)
      // Silently fail - don't disturb the session
    }
  }

  const captureVideoFrame = () => {
    try {
      if (!localVideoRef.current) return null
      
      // Create canvas
      const canvas = document.createElement('canvas')
      const video = localVideoRef.current
      
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convert to base64 (JPEG for smaller size)
      const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
      
      return base64
      
    } catch (err) {
      console.error('❌ Frame capture error:', err)
      return null
    }
  }

  const cleanup = () => {
    console.log('🧹 Cleaning up resources...')
    
    // Stop all media tracks if not already stopped
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop()
        }
      })
      localStream.current = null
    }
    
    // Close all peer connections
    peerConnections.current.forEach((pc, socketId) => {
      console.log(`🔌 Closing connection with ${socketId}`)
      pc.close()
    })
    peerConnections.current.clear()
    
    // Clear remote streams
    remoteStreams.current.forEach((stream, socketId) => {
      stream.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop()
        }
      })
    })
    remoteStreams.current.clear()
    
    // Clear audio analysers
    audioAnalysers.current.clear()
    
    // Close audio context
    if (audioContext.current && audioContext.current.state !== 'closed') {
      audioContext.current.close()
    }
    
    // Disconnect socket
    if (socket.current) {
      socket.current.disconnect()
    }
    
    console.log('✅ Cleanup complete')
  }

  // Render functions
  const getRoleLabel = (role) => {
    const roleLabels = {
      'chair': 'رئيس الجلسة',
      'secretary': 'أمين السر',
      'judge': 'القاضي',
      'lawyer': 'المحامي',
      'party': 'طرف معني',
      'participant': 'مشارك'
    };
    return roleLabels[role] || role;
  };

  // Loading/Analyzing screen
  if (isAnalyzing) {
    return (
      <div className="app">
        <div className="loading">
          <div className="loading-spinner"></div>
          <h2>جاري إنشاء تقرير محتوى الجلسة...</h2>
          <p>جاري نسخ الصوت وإنشاء الملخص المحايد</p>
          <p style={{fontSize: '14px', marginTop: '10px', color: '#666'}}>قد يستغرق هذا دقيقة...</p>
          <p style={{fontSize: '12px', marginTop: '5px', color: '#999'}}>سيتم حذف التسجيلات الصوتية فوراً بعد المعالجة</p>
        </div>
      </div>
    )
  }

  // Session Report screen
  if (sessionReport) {
    return (
      <div className="app">
        <div className="header">
          <h1>📊 تقرير محتوى الجلسة</h1>
          <p style={{fontSize: '14px', opacity: 0.8}}>Session Content Report</p>
        </div>
        
        <div className="analysis">
          {error && <div className="error">{error}</div>}
          
          {/* Disclaimer */}
          <div style={{
            background: '#fff3cd',
            border: '2px solid #ffc107',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{margin: 0, fontSize: '14px', color: '#856404'}}>
              <strong>⚖️ إخلاء مسؤولية:</strong> {sessionReport.metadata?.disclaimer}
            </p>
            <p style={{margin: '5px 0 0 0', fontSize: '12px', color: '#856404'}}>
              {sessionReport.metadata?.processing_note}
            </p>
          </div>

          {/* Session Info */}
          <div className="analysis-section">
            <h3>📋 معلومات الجلسة</h3>
            <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '8px'}}>
              <p><strong>رقم الجلسة:</strong> {sessionReport.session_info?.room_id}</p>
              <p><strong>تاريخ البداية:</strong> {new Date(sessionReport.session_info?.start_time).toLocaleString('ar-SA')}</p>
              <p><strong>تاريخ النهاية:</strong> {new Date(sessionReport.session_info?.end_time).toLocaleString('ar-SA')}</p>
              <p><strong>المدة:</strong> {Math.floor(sessionReport.session_info?.duration_seconds / 60)} دقيقة و {sessionReport.session_info?.duration_seconds % 60} ثانية</p>
              <p><strong>عدد المشاركين:</strong> {sessionReport.session_info?.participants?.length}</p>
            </div>
          </div>
          
          {/* Executive Summary */}
          <div className="analysis-section">
            <h3>📝 الملخص التنفيذي</h3>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '20px',
              borderRadius: '8px',
              lineHeight: '1.8'
            }}>
              <p style={{margin: 0}}>{sessionReport.executive_summary}</p>
            </div>
          </div>

          {/* Timeline */}
          {sessionReport.timeline && sessionReport.timeline.length > 0 && (
            <div className="analysis-section">
              <h3>📅 الجدول الزمني للأحداث</h3>
              <div style={{position: 'relative', paddingRight: '30px'}}>
                {sessionReport.timeline.map((event, i) => (
                  <div key={i} style={{
                    position: 'relative',
                    paddingBottom: '20px',
                    borderRight: i < sessionReport.timeline.length - 1 ? '2px solid #667eea' : 'none'
                  }}>
                    <div style={{
                      position: 'absolute',
                      right: '-7px',
                      top: '5px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#667eea',
                      border: '2px solid white',
                      boxShadow: '0 0 0 2px #667eea'
                    }}></div>
                    <div style={{
                      background: '#f8f9fa',
                      padding: '10px 15px',
                      borderRadius: '8px',
                      marginRight: '20px'
                    }}>
                      <div style={{fontSize: '12px', color: '#666', marginBottom: '5px'}}>
                        {new Date(event.timestamp).toLocaleTimeString('ar-SA')}
                      </div>
                      <div style={{fontWeight: 'bold', color: '#667eea', marginBottom: '3px'}}>
                        {getRoleLabel(event.role)}
                      </div>
                      <div>{event.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NEW: Detailed Speech Log - من قال ماذا */}
          {sessionReport.detailed_speech_log && sessionReport.detailed_speech_log.length > 0 && (
            <div className="analysis-section">
              <h3>🗣️ سجل الكلام التفصيلي - من قال ماذا</h3>
              <div style={{
                background: '#e3f2fd',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <p style={{margin: 0, fontSize: '14px', color: '#1565c0'}}>
                  <strong>📝 ملاحظة:</strong> {sessionReport.metadata?.speech_log_note}
                </p>
                <p style={{margin: '5px 0 0 0', fontSize: '12px', color: '#1976d2'}}>
                  إجمالي عدد المداخلات: {sessionReport.detailed_speech_log.length}
                </p>
              </div>
              
              <div style={{maxHeight: '600px', overflowY: 'auto', padding: '10px'}}>
                {sessionReport.detailed_speech_log.map((entry, i) => {
                  const roleColors = {
                    'judge': '#1976d2',
                    'lawyer': '#388e3c',
                    'party': '#f57c00',
                    'participant': '#5e35b1'
                  };
                  const color = roleColors[entry.role] || '#666';
                  
                  return (
                    <div key={i} style={{
                      background: '#ffffff',
                      border: `2px solid ${color}`,
                      borderRadius: '12px',
                      padding: '15px',
                      marginBottom: '15px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {/* Header */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                        paddingBottom: '10px',
                        borderBottom: `1px solid ${color}40`
                      }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                          <div style={{
                            background: color,
                            color: 'white',
                            padding: '5px 12px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 'bold'
                          }}>
                            {getRoleLabel(entry.role)}
                          </div>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#333'
                          }}>
                            {entry.speaker}
                          </div>
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#666',
                          direction: 'ltr'
                        }}>
                          {new Date(entry.timestamp).toLocaleTimeString('ar-SA')}
                          {entry.duration_seconds > 0 && (
                            <span style={{marginLeft: '10px'}}>
                              ({entry.duration_seconds}s)
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Speech Content */}
                      <div style={{
                        fontSize: '15px',
                        lineHeight: '1.7',
                        color: '#333',
                        padding: '10px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        direction: 'rtl',
                        textAlign: 'right'
                      }}>
                        "{entry.speech}"
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Role Summaries */}
          {sessionReport.role_summaries && sessionReport.role_summaries.length > 0 && (
            <div className="analysis-section">
              <h3>👥 ملخصات حسب الدور</h3>
              {sessionReport.role_summaries.map((roleSummary, i) => (
                <div key={i} style={{
                  background: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  borderRight: '4px solid #667eea'
                }}>
                  <h4 style={{color: '#667eea', marginBottom: '10px', marginTop: 0}}>
                    {getRoleLabel(roleSummary.role)}
                  </h4>
                  <p style={{margin: 0}}>{roleSummary.summary}</p>
                  <p style={{margin: '10px 0 0 0', fontSize: '12px', color: '#666'}}>
                    عدد البيانات: {roleSummary.statement_count}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Report metadata */}
          <div style={{
            background: '#e9ecef',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#666',
            textAlign: 'center',
            marginTop: '20px'
          }}>
            <p style={{margin: 0}}>
              تم إنشاء التقرير في: {new Date(sessionReport.generated_at).toLocaleString('ar-SA')}
            </p>
            <p style={{margin: '5px 0 0 0'}}>
              معرف التقرير: {sessionReport.session_info?.session_id}
            </p>
          </div>
          
          <button 
            className="control-btn"
            style={{background: '#667eea', color: 'white', marginTop: '20px', width: '100%'}}
            onClick={onLeave}
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    )
  }

  // Session ended screen
  if (sessionEnded) {
    return (
      <div className="app">
        <div className="header">
          <h1>🛑 تم إنهاء الجلسة</h1>
        </div>
        <div className="loading">
          <div style={{
            background: '#fff3cd',
            border: '2px solid #ffc107',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <h2 style={{margin: '0 0 10px 0', color: '#856404'}}>تم إنهاء الجلسة من قبل أحد الأطراف</h2>
            <p style={{margin: '10px 0', fontSize: '16px', color: '#856404'}}>{error}</p>
            <div style={{
              background: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '6px',
              padding: '15px',
              marginTop: '15px'
            }}>
              <p style={{margin: 0, fontSize: '14px', color: '#155724'}}>
                ✅ تم إيقاف الكاميرا والمايكروفون تلقائياً
              </p>
              <p style={{margin: '5px 0 0 0', fontSize: '12px', color: '#155724'}}>
                Camera and microphone have been stopped
              </p>
            </div>
          </div>
          <button 
            className="control-btn"
            style={{background: '#667eea', color: 'white', padding: '15px 30px', fontSize: '16px'}}
            onClick={onLeave}
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    )
  }

  // Main meeting screen - Many-to-Many
  return (
    <div className="app">
      <div className="header" style={{
        background: 'linear-gradient(135deg, #216147 0%, #2d7a5c 100%)',
        padding: '25px',
        borderRadius: '0',
        marginBottom: '0',
        boxShadow: 'none',
        borderBottom: '3px solid #C1E328'
      }}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '10px'}}>
          <img src="/bog-logo.svg" alt="شعار ديوان المظالم" style={{height: '55px', filter: 'brightness(0) invert(1)'}} />
          <h1 style={{margin: 0, fontSize: '2rem', fontWeight: '700'}}>الجلسة القضائية الإلكترونية</h1>
        </div>
        <p style={{margin: 0, opacity: 0.95, fontSize: '1rem'}}>رقم الجلسة: {roomId} | عدد المشاركين: {participants.length + 1}</p>
      </div>
      
      <div className="meeting">
        {error && <div className="error">{error}</div>}
        
        {/* Camera Off Warning (Judicial Violation) */}
        {cameraOffWarning && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '4px solid #dc2626',
            borderRadius: '16px',
            padding: '20px 25px',
            boxShadow: '0 8px 30px rgba(220, 38, 38, 0.5)',
            zIndex: 2001,
            maxWidth: '500px',
            width: '90%',
            animation: 'slideDown 0.3s ease-out'
          }}>
            <div style={{textAlign: 'right'}}>
              <div style={{fontWeight: '800', fontSize: '18px', marginBottom: '12px', color: '#991b1b'}}>
                مخالفة: الكاميرا مغلقة
              </div>
              <div style={{fontSize: '15px', lineHeight: '1.8', color: '#991b1b', fontWeight: '600'}}>
                تنبيه: يجب إبقاء الكاميرا مفتوحة طوال مدة الجلسة
              </div>
              <div style={{
                marginTop: '15px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#991b1b',
                fontWeight: '700'
              }}>
                وفقاً لشروط الجلسات القضائية الإلكترونية
              </div>
            </div>
          </div>
        )}

        {/* Dress Code Warning (ALL Participants - Judicial Requirement) */}
        {dressCodeWarning && (
          <div style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)',
            border: '4px solid #ffc107',
            borderRadius: '16px',
            padding: '20px 25px',
            boxShadow: '0 8px 30px rgba(255, 193, 7, 0.5)',
            zIndex: 2000,
            maxWidth: '500px',
            width: '90%',
            animation: 'slideDown 0.3s ease-out'
          }}>
              <div style={{textAlign: 'right'}}>
              <div style={{fontWeight: '800', fontSize: '18px', marginBottom: '12px', color: '#856404'}}>
                مخالفة اللباس الرسمي
                </div>
              <div style={{fontSize: '15px', lineHeight: '1.8', color: '#856404', fontWeight: '600'}}>
                {Array.isArray(dressCodeWarning) ? (
                  dressCodeWarning.map((warning, index) => (
                    <div key={index} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: index < dressCodeWarning.length - 1 ? '1px solid rgba(133, 100, 4, 0.2)' : 'none' }}>
                      {warning.message}
                </div>
                  ))
                ) : (
                  <div>{dressCodeWarning}</div>
                )}
              </div>
              <div style={{
                marginTop: '15px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#856404',
                fontWeight: '700'
              }}>
                يرجى الالتزام باللباس الرسمي المطلوب للجلسات القضائية
              </div>
            </div>
          </div>
        )}
        
        {/* Video Grid - Dynamic based on participant count */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: participants.length === 0 ? '1fr' : 
                               participants.length === 1 ? 'repeat(2, 1fr)' :
                               participants.length <= 3 ? 'repeat(2, 1fr)' :
                               'repeat(3, 1fr)',
          gap: '15px',
          padding: '20px',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {/* Local video */}
          <div style={{
            position: 'relative',
            backgroundColor: '#000',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: activeSpeaker === 'local' ? '0 0 0 5px #C1E328, 0 12px 32px rgba(0,0,0,0.25)' : '0 8px 24px rgba(0,0,0,0.15)',
            border: activeSpeaker === 'local' ? '3px solid #C1E328' : '3px solid rgba(193, 227, 40, 0.3)',
            transition: 'all 0.3s ease'
          }}>
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)'}}
            />
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              background: 'linear-gradient(135deg, rgba(33, 97, 71, 0.95) 0%, rgba(45, 122, 92, 0.95) 100%)',
              color: 'white',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              border: '1px solid rgba(193, 227, 40, 0.3)'
            }}>
              {userName} (أنت)
            </div>
            {activeSpeaker === 'local' && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'linear-gradient(135deg, #C1E328 0%, #a8c625 100%)',
                color: '#216147',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                animation: 'pulse 2s infinite'
              }}>
                يتحدث الآن
              </div>
            )}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'linear-gradient(135deg, #216147 0%, #2d7a5c 100%)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              border: '1px solid rgba(193, 227, 40, 0.5)'
            }}>
              {getRoleLabel(userRole)}
            </div>
          </div>

          {/* Remote videos */}
          {participants.map((participant) => {
            const stream = remoteStreams.current.get(participant.socketId)
            const isStreamReady = remoteStreamsReady[participant.socketId]
            const isActive = activeSpeaker === participant.socketId
            
            return (
              <div key={participant.socketId} style={{
                position: 'relative',
                backgroundColor: '#000',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: isActive ? '0 0 0 5px #C1E328, 0 12px 32px rgba(0,0,0,0.25)' : '0 8px 24px rgba(0,0,0,0.15)',
                border: isActive ? '3px solid #C1E328' : '3px solid rgba(193, 227, 40, 0.3)',
                transition: 'all 0.3s ease',
                minHeight: '300px'
              }}>
                {stream && isStreamReady ? (
                  <video 
                    autoPlay 
                    playsInline 
                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    ref={(el) => {
                      if (el && stream && !el.srcObject) {
                        el.srcObject = stream
                      }
                    }}
                  />
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '300px',
                    color: '#fff',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div className="loading-spinner"></div>
                    <div>⏳ جاري الاتصال...</div>
                  </div>
                )}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  background: 'linear-gradient(135deg, rgba(33, 97, 71, 0.95) 0%, rgba(45, 122, 92, 0.95) 100%)',
                  color: 'white',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(193, 227, 40, 0.3)'
                }}>
                  {participant.participantId}
                </div>
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'linear-gradient(135deg, #C1E328 0%, #a8c625 100%)',
                    color: '#216147',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    animation: 'pulse 2s infinite'
                  }}>
                    يتحدث الآن
                  </div>
                )}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'linear-gradient(135deg, #216147 0%, #2d7a5c 100%)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(193, 227, 40, 0.5)'
                }}>
                  {getRoleLabel(participant.role)}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          padding: '22px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          border: '2px solid rgba(193, 227, 40, 0.25)',
          flexWrap: 'wrap',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          <button 
            className={`control-btn ${isCameraOn ? 'active' : 'inactive'}`}
            onClick={toggleCamera}
            title="شروط الجلسة: الكاميرا مطلوبة طوال الجلسة ولا يُسمح بإغلاقها"
            style={{
              background: isCameraOn 
                ? 'linear-gradient(135deg, #216147 0%, #2d7a5c 100%)' 
                : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: 'white',
              padding: '13px 26px',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '14px',
              border: isCameraOn ? '2px solid rgba(193, 227, 40, 0.4)' : '2px solid #991b1b',
              boxShadow: isCameraOn 
                ? '0 4px 14px rgba(33, 97, 71, 0.3)' 
                : '0 4px 14px rgba(220, 38, 38, 0.3)',
              transition: 'all 0.3s'
            }}
          >
            الكاميرا {isCameraOn ? 'مفتوحة' : 'مغلقة'} (مطلوبة)
          </button>
          
          <button 
            className={`control-btn ${isMicOn ? 'active' : 'inactive'}`}
            onClick={toggleMic}
            style={{
              background: isMicOn 
                ? 'linear-gradient(135deg, #216147 0%, #2d7a5c 100%)' 
                : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: 'white',
              padding: '13px 26px',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '14px',
              border: isMicOn ? '2px solid rgba(193, 227, 40, 0.4)' : '2px solid #991b1b',
              boxShadow: isMicOn 
                ? '0 4px 14px rgba(33, 97, 71, 0.3)' 
                : '0 4px 14px rgba(220, 38, 38, 0.3)',
              transition: 'all 0.3s'
            }}
          >
            الميكروفون {isMicOn ? 'مفتوح' : 'مغلق'}
          </button>
          
          <button 
            className="control-btn end"
            onClick={endMeeting}
            title={isChair ? 'إنهاء الجلسة وتحليل المحاضر (رئيس الجلسة فقط)' : 'إنهاء الجلسة مسموح لرئيس الجلسة فقط'}
            style={{
              background: 'linear-gradient(135deg, #dc3545 0%, #b91c1c 100%)',
              color: 'white',
              padding: '13px 26px',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '14px',
              border: '2px solid #991b1b',
              boxShadow: '0 4px 14px rgba(220, 53, 69, 0.35)',
              transition: 'all 0.3s'
            }}
          >
            إنهاء الجلسة {!isChair && '(رئيس الجلسة فقط)'}
          </button>
        </div>

        {/* Participants list */}
        <div style={{
          maxWidth: '700px',
          margin: '20px auto',
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)',
          borderRadius: '15px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
          border: '2px solid rgba(193, 227, 40, 0.2)'
        }}>
          <h4 style={{
            margin: '0 0 15px 0',
            textAlign: 'center',
            color: '#216147',
            fontSize: '18px',
            fontWeight: '700',
            borderBottom: '2px solid rgba(193, 227, 40, 0.3)',
            paddingBottom: '10px'
          }}>
            المشاركون ({participants.length + 1})
          </h4>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #216147 0%, #2d7a5c 100%)',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(33, 97, 71, 0.3)',
              border: '2px solid rgba(193, 227, 40, 0.4)'
            }}>
              {userName} (أنت) — {getRoleLabel(userRole)}
            </div>
            {participants.map(p => (
              <div key={p.socketId} style={{
                padding: '12px 16px',
                background: 'white',
                borderRadius: '10px',
                fontWeight: '500',
                color: '#216147',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                border: '2px solid rgba(33, 97, 71, 0.15)'
              }}>
                {p.participantId} — {getRoleLabel(p.role)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WebRTCMeeting
