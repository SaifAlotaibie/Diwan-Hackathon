import { useState } from 'react'
import WebRTCMeeting from './WebRTC'
import './index.css'

function App() {
  const [roomId, setRoomId] = useState('')
  const [joined, setJoined] = useState(false)
  const [userName, setUserName] = useState('')

  const handleJoin = () => {
    if (roomId.trim() && userName.trim()) {
      setJoined(true)
    }
  }

  if (!joined) {
    return (
      <div className="app">
        <div className="header">
          <h1>🎥 WebRTC Meeting</h1>
          <p>1-to-1 Video Call with AI Analysis</p>
        </div>
        
        <div className="lobby">
          <h2>Join Meeting</h2>
          
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
          />
          
          <input
            type="text"
            placeholder="Room ID (e.g., room123)"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
          />
          
          <button 
            onClick={handleJoin}
            disabled={!roomId.trim() || !userName.trim()}
          >
            Join Room
          </button>
          
          <div style={{marginTop: '20px', fontSize: '14px', color: '#666', textAlign: 'center'}}>
            <p>💡 <strong>Tip:</strong> Use the same Room ID on both devices</p>
            <p>🔒 Local-only | No cloud services</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <WebRTCMeeting 
      roomId={roomId} 
      userName={userName}
      onLeave={() => setJoined(false)}
    />
  )
}

export default App
