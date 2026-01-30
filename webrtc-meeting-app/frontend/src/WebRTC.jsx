import { useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'
import axios from 'axios'

// Use the current hostname (works for both localhost and IP)
const getServerURL = () => {
  const hostname = window.location.hostname
  return `http://${hostname}:3001`
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

function WebRTCMeeting({ roomId, userName, onLeave }) {
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [peerName, setPeerName] = useState('Waiting...')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)
  
  const socket = useRef(null)
  const peerConnection = useRef(null)
  const localStream = useRef(null)
  const remoteStream = useRef(null)
  const mediaRecorder = useRef(null)
  const audioChunks = useRef([])
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  // Initialize WebRTC and Socket
  useEffect(() => {
    console.log('🚀 Initializing WebRTC Meeting...')
    initializeMedia()
    initializeSocket()
    
    return () => {
      cleanup()
    }
  }, [])

  const initializeMedia = async () => {
    try {
      console.log('📹 Requesting camera and microphone access...')
      
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
      
      console.log('✅ Media initialized successfully')
      console.log(`📹 Video tracks: ${stream.getVideoTracks().length}`)
      console.log(`🎤 Audio tracks: ${stream.getAudioTracks().length}`)
      
    } catch (err) {
      console.error('❌ Media error:', err)
      let errorMessage = 'Could not access camera/microphone. '
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow permissions and refresh the page.'
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera or microphone found.'
      } else {
        errorMessage += 'Please check your device settings.'
      }
      
      setError(errorMessage)
      alert(errorMessage) // Show alert to user
    }
  }

  const startRecording = (stream) => {
    try {
      // Record only audio
      const audioStream = new MediaStream(
        stream.getAudioTracks()
      )
      
      mediaRecorder.current = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm'
      })
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data)
        }
      }
      
      mediaRecorder.current.start()
      console.log('🎙️ Recording started')
    } catch (err) {
      console.error('❌ Recording error:', err)
    }
  }

  const initializeSocket = () => {
    socket.current = io(SOCKET_SERVER)
    
    socket.current.on('connect', () => {
      console.log('🔌 Socket connected')
      socket.current.emit('join-room', roomId)
    })
    
    socket.current.on('room-full', () => {
      const errorMsg = '❌ Room is full! Maximum 2 participants allowed. Please use a different room ID.'
      setError(errorMsg)
      setConnectionStatus('disconnected')
      alert(errorMsg)
      console.error(errorMsg)
    })
    
    socket.current.on('user-joined', (socketId) => {
      console.log('👋 User joined:', socketId)
      setPeerName('Participant 2')
      setConnectionStatus('connecting')
      createPeerConnection()
      createOffer()
      console.log('📤 Creating offer for peer...')
    })
    
    socket.current.on('offer', async ({ offer, from }) => {
      console.log('📥 Received offer from:', from)
      setPeerName('Participant 2')
      setConnectionStatus('connecting')
      createPeerConnection()
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await peerConnection.current.createAnswer()
      await peerConnection.current.setLocalDescription(answer)
      socket.current.emit('answer', { answer, roomId })
      console.log('📤 Sent answer back')
    })
    
    socket.current.on('answer', async ({ answer }) => {
      console.log('📥 Received answer')
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer))
      console.log('✅ WebRTC connection established')
    })
    
    socket.current.on('ice-candidate', async ({ candidate }) => {
      console.log('🧊 Received ICE candidate')
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) {
        console.error('ICE candidate error:', err)
      }
    })
    
    socket.current.on('user-left', () => {
      console.log('👋 User left')
      setPeerName('Waiting...')
      setConnectionStatus('connecting')
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }
    })
  }

  const createPeerConnection = () => {
    peerConnection.current = new RTCPeerConnection(ICE_SERVERS)
    
    // Add local stream tracks
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, localStream.current)
      })
    }
    
    // Handle remote stream
    remoteStream.current = new MediaStream()
    peerConnection.current.ontrack = (event) => {
      console.log('📺 Remote track received')
      event.streams[0].getTracks().forEach(track => {
        remoteStream.current.addTrack(track)
      })
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream.current
      }
    }
    
    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit('ice-candidate', {
          candidate: event.candidate,
          roomId
        })
      }
    }
    
    // Monitor connection state
    peerConnection.current.onconnectionstatechange = () => {
      const state = peerConnection.current.connectionState
      console.log('🔗 Connection state:', state)
      
      if (state === 'connected') {
        setConnectionStatus('connected')
        console.log('🎉 Peer connected successfully!')
      } else if (state === 'connecting') {
        setConnectionStatus('connecting')
      } else if (state === 'disconnected' || state === 'failed') {
        setConnectionStatus('disconnected')
        console.error('❌ Connection failed or disconnected')
      }
    }
    
    // Monitor ICE connection state
    peerConnection.current.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', peerConnection.current.iceConnectionState)
    }
  }

  const createOffer = async () => {
    const offer = await peerConnection.current.createOffer()
    await peerConnection.current.setLocalDescription(offer)
    socket.current.emit('offer', { offer, roomId })
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

  const endMeeting = async () => {
    setIsAnalyzing(true)
    
    // Stop recording
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop()
      
      // Wait for recording to finish
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
        setError('No audio recorded')
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
      
      const audioFile = uploadResponse.data
      
      // Analyze
      console.log('🤖 Analyzing...')
      const analysisResponse = await axios.post(`${API_SERVER}/analyze`, {
        audioFiles: [audioFile]
      })
      
      setAnalysis(analysisResponse.data)
      console.log('✅ Analysis complete')
      
    } catch (err) {
      console.error('❌ Analysis error:', err)
      setError('Failed to analyze meeting: ' + err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const cleanup = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop())
    }
    if (peerConnection.current) {
      peerConnection.current.close()
    }
    if (socket.current) {
      socket.current.disconnect()
    }
  }

  if (isAnalyzing) {
    return (
      <div className="app">
        <div className="loading">
          <div className="loading-spinner"></div>
          <h2>Analyzing Meeting...</h2>
          <p>Transcribing audio and generating summary</p>
          <p style={{fontSize: '14px', marginTop: '10px', color: '#666'}}>This may take a minute...</p>
        </div>
      </div>
    )
  }

  if (analysis) {
    return (
      <div className="app">
        <div className="header">
          <h1>📊 Meeting Analysis</h1>
        </div>
        
        <div className="analysis">
          <h2>Meeting Summary</h2>
          
          {error && <div className="error">{error}</div>}
          
          <div className="analysis-section">
            <h3>📝 Summary</h3>
            <p>{analysis.analysis?.summary || 'No summary available'}</p>
          </div>
          
          <div className="analysis-section">
            <h3>🎤 Transcriptions</h3>
            {analysis.transcriptions?.map((t, i) => (
              <div key={i} className="transcript-item">
                <div className="participant-name">{t.participantId}</div>
                <div>{t.text}</div>
              </div>
            ))}
          </div>
          
          <div className="analysis-section">
            <h3>🔑 Key Points</h3>
            {analysis.analysis?.keyPoints?.map((kp, i) => (
              <div key={i} style={{marginBottom: '20px'}}>
                <h4 style={{color: '#667eea', marginBottom: '10px'}}>{kp.participant}</h4>
                <ul className="key-points">
                  {kp.points?.map((point, j) => (
                    <li key={j}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <button 
            className="control-btn"
            style={{background: '#667eea', color: 'white', marginTop: '20px'}}
            onClick={onLeave}
          >
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="header">
        <h1>🎥 WebRTC Meeting</h1>
        <p>Room: {roomId}</p>
      </div>
      
      <div className="meeting">
        {error && <div className="error">{error}</div>}
        
        <div className="status-bar">
          <div className="status-info">
            <div className={`status-badge ${connectionStatus}`}>
              {connectionStatus === 'connected' && '✅ Connected'}
              {connectionStatus === 'connecting' && '⏳ Connecting...'}
              {connectionStatus === 'disconnected' && '❌ Disconnected'}
            </div>
            <span>Room: <strong>{roomId}</strong></span>
          </div>
        </div>
        
        <div className="video-grid">
          <div className="video-container">
            <video ref={localVideoRef} autoPlay muted playsInline />
            <div className="video-label">👤 {userName} (You)</div>
          </div>
          
          <div className="video-container">
            <video ref={remoteVideoRef} autoPlay playsInline />
            <div className="video-label">👤 {peerName}</div>
          </div>
        </div>
        
        <div className="controls">
          <button 
            className={`control-btn ${isCameraOn ? 'active' : 'inactive'}`}
            onClick={toggleCamera}
          >
            {isCameraOn ? '📹' : '📹❌'} Camera
          </button>
          
          <button 
            className={`control-btn ${isMicOn ? 'active' : 'inactive'}`}
            onClick={toggleMic}
          >
            {isMicOn ? '🎤' : '🎤❌'} Microphone
          </button>
          
          <button 
            className="control-btn end"
            onClick={endMeeting}
          >
            📞 End & Analyze
          </button>
        </div>
      </div>
    </div>
  )
}

export default WebRTCMeeting
