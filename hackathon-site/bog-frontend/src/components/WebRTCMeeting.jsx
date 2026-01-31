import { useEffect, useRef, useState, useCallback } from 'react'
import io from 'socket.io-client'
import axios from 'axios'

// Environment-based backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const SOCKET_SERVER = API_BASE_URL
const API_SERVER = API_BASE_URL

// STUN servers for NAT traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
}

function WebRTCMeeting({ roomId, userName, userRole, onLeave }) {
  // State for participants and connections
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
  
  // Refs
  const socket = useRef(null)
  const localStream = useRef(null)
  const peerConnections = useRef(new Map())
  const remoteStreams = useRef(new Map())
  const mediaRecorder = useRef(null)
  const audioChunks = useRef([])
  const audioContext = useRef(null)
  const audioAnalysers = useRef(new Map())
  const activeSpeakerTimeout = useRef(null)
  const dressCodeCheckInterval = useRef(null)
  
  const localVideoRef = useRef(null)

  // Initialize WebRTC and Socket
  useEffect(() => {
    console.log('🚀 Initializing Many-to-Many WebRTC Meeting...')
    console.log('📡 Backend URL:', API_BASE_URL)
    initializeMedia()
    initializeSocket()
    
    // Start dress code checking for lawyers only
    if (userRole === 'lawyer') {
      console.log('👔 Starting dress code monitoring for lawyer')
      startDressCodeMonitoring()
    }
    
    return () => {
      cleanup()
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
      
      alert('⚠️ للانضمام للجلسة، يرجى السماح باستخدام الكاميرا والمايكروفون.\\n\\nسيظهر طلب الإذن في المتصفح الآن.')
      
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
      let errorMessage = 'لا يمكن الوصول للكاميرا أو المايكروفون. '
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'يرجى السماح بالأذونات وتحديث الصفحة.'
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'لم يتم العثور على كاميرا أو مايكروفون.'
      } else {
        errorMessage += 'يرجى التحقق من إعدادات الجهاز.'
      }
      
      setError(errorMessage)
      alert(errorMessage)
    }
  }

  const startRecording = (stream) => {
    try {
      const audioStream = new MediaStream(stream.getAudioTracks())
      
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm'
      }
      
      mediaRecorder.current = new MediaRecorder(audioStream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
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
      
      monitorAudioLevels(socketId, analyser)
      
    } catch (err) {
      console.error('❌ Active speaker detection error:', err)
    }
  }

  const monitorAudioLevels = (socketId, analyser) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const SPEAKING_THRESHOLD = 40
    
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
    if (activeSpeakerTimeout.current) {
      clearTimeout(activeSpeakerTimeout.current)
    }
    
    setActiveSpeaker(socketId)
    
    if (socketId === 'local' && socket.current) {
      socket.current.emit('active-speaker', {
        roomId,
        participantId: userName,
        role: userRole
      })
    }
    
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
    
    socket.current.on('room-users', (existingParticipants) => {
      console.log('👥 Existing participants:', existingParticipants)
      const others = existingParticipants.filter(p => p.socketId !== socket.current.id)
      setParticipants(others)
      console.log('⏳ Waiting for offers from existing participants...')
    })
    
    socket.current.on('user-joined', (newParticipant) => {
      console.log('👋 User joined:', newParticipant)
      setParticipants(prev => [...prev, newParticipant])
      createPeerConnection(newParticipant.socketId, newParticipant, true)
    })
    
    socket.current.on('offer', async ({ offer, from }) => {
      console.log('📥 Received offer from:', from)
      
      let pc = peerConnections.current.get(from)
      
      if (!pc) {
        console.warn('⚠️ No peer connection exists for:', from)
        const newPc = new RTCPeerConnection(ICE_SERVERS)
        peerConnections.current.set(from, newPc)
        
        if (localStream.current) {
          localStream.current.getTracks().forEach(track => {
            newPc.addTrack(track, localStream.current)
          })
        }
        
        newPc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            const stream = event.streams[0]
            remoteStreams.current.set(from, stream)
            
            if (event.track.kind === 'audio') {
              setupActiveSpeakerDetection(stream, from)
            }
            
            setRemoteStreamsReady(prev => ({
              ...prev,
              [from]: true
            }))
          }
        }
        
        newPc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.current.emit('ice-candidate', {
              candidate: event.candidate,
              roomId,
              to: from
            })
          }
        }
        
        newPc.onconnectionstatechange = () => {
          console.log(`🔗 Connection state with ${from}:`, newPc.connectionState)
        }
        
        pc = newPc
      }
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.current.emit('answer', { answer, roomId, to: from })
      } catch (err) {
        console.error('❌ Offer handling error:', err)
      }
    })
    
    socket.current.on('answer', async ({ answer, from }) => {
      const pc = peerConnections.current.get(from)
      if (!pc) return
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
      } catch (err) {
        console.error('❌ Answer handling error:', err)
      }
    })
    
    socket.current.on('ice-candidate', async ({ candidate, from }) => {
      const pc = peerConnections.current.get(from)
      if (!pc) return
      
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) {
        console.error('❌ ICE candidate error:', err)
      }
    })
    
    socket.current.on('user-left', ({ socketId }) => {
      console.log('👋 User left:', socketId)
      setParticipants(prev => prev.filter(p => p.socketId !== socketId))
      
      const pc = peerConnections.current.get(socketId)
      if (pc) {
        pc.close()
        peerConnections.current.delete(socketId)
      }
      
      remoteStreams.current.delete(socketId)
      audioAnalysers.current.delete(socketId)
    })
    
    socket.current.on('active-speaker', ({ socketId }) => {
      setActiveSpeaker(socketId)
      
      if (activeSpeakerTimeout.current) {
        clearTimeout(activeSpeakerTimeout.current)
      }
      activeSpeakerTimeout.current = setTimeout(() => {
        setActiveSpeaker(null)
      }, 1500)
    })
    
    socket.current.on('session-ended', ({ endedBy, role }) => {
      console.log(`🛑 Session ended by ${endedBy} (${role})`)
      stopAllMedia()
      setSessionEnded(true)
      setError(`تم إنهاء الجلسة من قبل ${endedBy}`)
      
      setTimeout(() => {
        cleanup()
      }, 500)
    })
  }

  const createPeerConnection = (socketId, participant, shouldOffer) => {
    console.log(`🔗 Creating peer connection with ${socketId} (offer: ${shouldOffer})`)
    
    const pc = new RTCPeerConnection(ICE_SERVERS)
    peerConnections.current.set(socketId, pc)
    
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current)
      })
    }
    
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0]
        remoteStreams.current.set(socketId, stream)
        
        if (event.track.kind === 'audio') {
          setupActiveSpeakerDetection(stream, socketId)
        }
        
        setRemoteStreamsReady(prev => ({
          ...prev,
          [socketId]: true
        }))
      }
    }
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit('ice-candidate', {
          candidate: event.candidate,
          roomId,
          to: socketId
        })
      }
    }
    
    pc.onconnectionstatechange = () => {
      console.log(`🔗 Connection state with ${socketId}:`, pc.connectionState)
    }
    
    if (shouldOffer) {
      createOffer(socketId)
    }
  }

  const createOffer = async (socketId) => {
    const pc = peerConnections.current.get(socketId)
    if (!pc) return
    
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })
      await pc.setLocalDescription(offer)
      socket.current.emit('offer', { offer, roomId, to: socketId })
    } catch (err) {
      console.error('❌ Create offer error:', err)
    }
  }

  const toggleCamera = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsCameraOn(videoTrack.enabled)
      }
    }
  }

  const toggleMic = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMicOn(audioTrack.enabled)
      }
    }
  }

  const stopAllMedia = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
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
  }

  const endSession = () => {
    if (confirm('هل أنت متأكد من إنهاء الجلسة؟\\nسيتم إنهاء الجلسة لجميع المشاركين.')) {
      stopAllMedia()
      socket.current.emit('end-session', { roomId })
      
      setTimeout(() => {
        analyzeSession()
      }, 1000)
    }
  }

  const analyzeSession = async () => {
    setIsAnalyzing(true)
    
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop()
      
      await new Promise(resolve => {
        mediaRecorder.current.onstop = resolve
      })
    }
    
    await uploadAndAnalyze()
    cleanup()
  }

  const uploadAndAnalyze = async () => {
    try {
      if (audioChunks.current.length === 0) {
        setError('لم يتم تسجيل صوت')
        return
      }
      
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
      
      const formData = new FormData()
      formData.append('audio', audioBlob, `${userName}-${Date.now()}.webm`)
      formData.append('participantId', userName)
      formData.append('roomId', roomId)
      
      const uploadResponse = await axios.post(`${API_SERVER}/upload-audio`, formData)
      
      const audioFile = {
        ...uploadResponse.data,
        role: userRole
      }
      
      const reportResponse = await axios.post(`${API_SERVER}/generate-session-report`, {
        audioFiles: [audioFile],
        roomId: roomId
      })
      
      if (reportResponse.data.success) {
        setSessionReport(reportResponse.data.report)
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
    dressCodeCheckInterval.current = setInterval(() => {
      performDressCodeCheck()
    }, 15000)
    
    setTimeout(() => {
      performDressCodeCheck()
    }, 5000)
  }

  const performDressCodeCheck = async () => {
    if (userRole !== 'lawyer') return
    
    const now = Date.now()
    if (now - lastDressCodeCheck < 60000) {
      return
    }
    
    try {
      const frame = captureVideoFrame()
      if (!frame) return
      
      const response = await axios.post(`${API_SERVER}/check-dress-code`, {
        imageBase64: frame,
        role: userRole
      })
      
      if (response.data.success && response.data.result) {
        const { compliant, warning } = response.data.result
        
        if (!compliant && warning) {
          setDressCodeWarning(warning)
          setLastDressCodeCheck(now)
          
          setTimeout(() => {
            setDressCodeWarning(null)
          }, 10000)
        } else if (compliant) {
          setDressCodeWarning(null)
        }
      }
      
    } catch (err) {
      console.error('❌ Dress code check error:', err)
    }
  }

  const captureVideoFrame = () => {
    try {
      if (!localVideoRef.current) return null
      
      const canvas = document.createElement('canvas')
      const video = localVideoRef.current
      
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
      
      return base64
      
    } catch (err) {
      console.error('❌ Frame capture error:', err)
      return null
    }
  }

  const cleanup = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop()
        }
      })
      localStream.current = null
    }
    
    peerConnections.current.forEach((pc) => {
      pc.close()
    })
    peerConnections.current.clear()
    
    remoteStreams.current.forEach((stream) => {
      stream.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop()
        }
      })
    })
    remoteStreams.current.clear()
    
    audioAnalysers.current.clear()
    
    if (audioContext.current && audioContext.current.state !== 'closed') {
      audioContext.current.close()
    }
    
    if (socket.current) {
      socket.current.disconnect()
    }
  }

  const getRoleLabel = (role) => {
    const roleLabels = {
      'judge': 'القاضي',
      'lawyer': 'المحامي',
      'party': 'طرف في القضية',
      'participant': 'مشارك'
    };
    return roleLabels[role] || role;
  };

  // Loading/Analyzing screen
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">جاري إنشاء تقرير محتوى الجلسة...</h2>
          <p className="text-gray-600 mb-2">جاري نسخ الصوت وإنشاء الملخص المحايد</p>
          <p className="text-sm text-gray-500">قد يستغرق هذا دقيقة...</p>
          <p className="text-xs text-gray-400 mt-2">سيتم حذف التسجيلات الصوتية فوراً بعد المعالجة</p>
        </div>
      </div>
    )
  }

  // Session Report screen
  if (sessionReport) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-primary mb-2">📊 تقرير محتوى الجلسة</h1>
              <p className="text-sm text-gray-600">Session Content Report</p>
            </div>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            {/* Disclaimer */}
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-yellow-800">
                <strong>⚖️ إخلاء مسؤولية:</strong> {sessionReport.metadata?.disclaimer}
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                {sessionReport.metadata?.processing_note}
              </p>
            </div>

            {/* Session Info */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">📋 معلومات الجلسة</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p><strong>رقم الجلسة:</strong> {sessionReport.session_info?.room_id}</p>
                <p><strong>تاريخ البداية:</strong> {new Date(sessionReport.session_info?.start_time).toLocaleString('ar-SA')}</p>
                <p><strong>تاريخ النهاية:</strong> {new Date(sessionReport.session_info?.end_time).toLocaleString('ar-SA')}</p>
                <p><strong>المدة:</strong> {Math.floor(sessionReport.session_info?.duration_seconds / 60)} دقيقة و {sessionReport.session_info?.duration_seconds % 60} ثانية</p>
                <p><strong>عدد المشاركين:</strong> {sessionReport.session_info?.participants?.length}</p>
              </div>
            </div>
            
            {/* Executive Summary */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">📝 الملخص التنفيذي</h3>
              <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg p-6 leading-relaxed">
                <p>{sessionReport.executive_summary}</p>
              </div>
            </div>

            {/* Detailed Speech Log */}
            {sessionReport.detailed_speech_log && sessionReport.detailed_speech_log.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">🗣️ سجل الكلام التفصيلي - من قال ماذا</h3>
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>📝 ملاحظة:</strong> {sessionReport.metadata?.speech_log_note}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    إجمالي عدد المداخلات: {sessionReport.detailed_speech_log.length}
                  </p>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {sessionReport.detailed_speech_log.map((entry, i) => {
                    const roleColors = {
                      'judge': 'border-blue-500 bg-blue-50',
                      'lawyer': 'border-green-500 bg-green-50',
                      'party': 'border-orange-500 bg-orange-50',
                      'participant': 'border-purple-500 bg-purple-50'
                    };
                    const colorClass = roleColors[entry.role] || 'border-gray-500 bg-gray-50';
                    
                    return (
                      <div key={i} className={`border-2 rounded-lg p-4 ${colorClass}`}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-white rounded-full text-sm font-bold">
                              {getRoleLabel(entry.role)}
                            </span>
                            <span className="font-bold">{entry.speaker}</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {new Date(entry.timestamp).toLocaleTimeString('ar-SA')}
                            {entry.duration_seconds > 0 && ` (${entry.duration_seconds}s)`}
                          </span>
                        </div>
                        <div className="bg-white rounded p-3 text-gray-800">
                          "{entry.speech}"
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Report metadata */}
            <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-gray-600 mt-6">
              <p>تم إنشاء التقرير في: {new Date(sessionReport.generated_at).toLocaleString('ar-SA')}</p>
              <p className="mt-1">معرف التقرير: {sessionReport.session_info?.session_id}</p>
            </div>
            
            <button 
              className="w-full mt-6 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-colors"
              onClick={onLeave}
            >
              العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Session ended screen
  if (sessionEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">🛑 تم إنهاء الجلسة</h1>
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-yellow-800 mb-3">تم إنهاء الجلسة من قبل أحد الأطراف</h2>
            <p className="text-yellow-700 mb-4">{error}</p>
            <div className="bg-green-50 border border-green-300 rounded-lg p-4">
              <p className="text-sm text-green-800 font-semibold">
                ✅ تم إيقاف الكاميرا والمايكروفون تلقائياً
              </p>
              <p className="text-xs text-green-700 mt-1">
                Camera and microphone have been stopped
              </p>
            </div>
          </div>
          <button 
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-colors"
            onClick={onLeave}
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    )
  }

  // Main meeting screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center text-white mb-6">
          <h1 className="text-3xl font-bold">🎥 الجلسة القضائية الإلكترونية</h1>
          <p className="text-lg">الجلسة: {roomId} | المشاركون: {participants.length + 1}</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 max-w-2xl mx-auto">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {/* Dress Code Warning */}
        {dressCodeWarning && userRole === 'lawyer' && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-xl shadow-2xl p-4 border-2 border-yellow-600">
              <div className="flex items-center gap-3 justify-center">
                <span className="text-2xl">👔</span>
                <div className="text-right">
                  <div className="font-bold text-sm mb-1">تنبيه اللباس النظامي</div>
                  <div className="text-sm">{dressCodeWarning}</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Video Grid */}
        <div className={`grid gap-4 mb-6 ${
          participants.length === 0 ? 'grid-cols-1' : 
          participants.length === 1 ? 'grid-cols-2' :
          participants.length <= 3 ? 'grid-cols-2' :
          'grid-cols-3'
        }`}>
          {/* Local video */}
          <div className={`relative bg-black rounded-xl overflow-hidden ${
            activeSpeaker === 'local' ? 'ring-4 ring-green-500' : 'shadow-lg'
          } transition-all`}>
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
              👤 {userName} (أنت)
            </div>
            {activeSpeaker === 'local' && (
              <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold">
                🎤 يتحدث الآن
              </div>
            )}
            <div className="absolute top-3 left-3 bg-primary bg-opacity-90 text-white px-2 py-1 rounded text-xs">
              {getRoleLabel(userRole)}
            </div>
          </div>

          {/* Remote videos */}
          {participants.map((participant) => {
            const stream = remoteStreams.current.get(participant.socketId)
            const isStreamReady = remoteStreamsReady[participant.socketId]
            const isActive = activeSpeaker === participant.socketId
            
            return (
              <div key={participant.socketId} className={`relative bg-black rounded-xl overflow-hidden min-h-[300px] ${
                isActive ? 'ring-4 ring-green-500' : 'shadow-lg'
              } transition-all`}>
                {stream && isStreamReady ? (
                  <video 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                    ref={(el) => {
                      if (el && stream && !el.srcObject) {
                        el.srcObject = stream
                      }
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-white mb-3"></div>
                    <div>⏳ جاري الاتصال...</div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
                  👤 {participant.participantId}
                </div>
                {isActive && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold">
                    🎤 يتحدث الآن
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-primary bg-opacity-90 text-white px-2 py-1 rounded text-xs">
                  {getRoleLabel(participant.role)}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
          <button 
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              isCameraOn ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
            } text-white`}
            onClick={toggleCamera}
          >
            {isCameraOn ? '📹' : '📹❌'} الكاميرا
          </button>
          
          <button 
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              isMicOn ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
            } text-white`}
            onClick={toggleMic}
          >
            {isMicOn ? '🎤' : '🎤❌'} المايكروفون
          </button>
          
          <button 
            className="px-6 py-3 rounded-lg font-bold bg-red-600 hover:bg-red-700 text-white transition-all"
            onClick={endSession}
          >
            🛑 إنهاء الجلسة للجميع
          </button>
        </div>

        {/* Participants list */}
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-xl font-bold text-center text-gray-800 mb-4">👥 المشاركون ({participants.length + 1})</h4>
          <div className="space-y-2">
            <div className="bg-gray-100 p-3 rounded-lg">
              ✓ {userName} (أنت) - {getRoleLabel(userRole)}
            </div>
            {participants.map(p => (
              <div key={p.socketId} className="bg-gray-100 p-3 rounded-lg">
                ✓ {p.participantId} - {getRoleLabel(p.role)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WebRTCMeeting
