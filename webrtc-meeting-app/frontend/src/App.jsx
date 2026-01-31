import { useState } from 'react'
import WebRTCMeeting from './WebRTC'
import './index.css'

function App() {
  const [roomId, setRoomId] = useState('')
  const [joined, setJoined] = useState(false)
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState('participant')

  const handleJoin = () => {
    if (roomId.trim() && userName.trim()) {
      setJoined(true)
    }
  }

  if (!joined) {
    return (
      <div className="app">
        <div className="header">
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '10px'}}>
            <img src="/bog-logo.svg" alt="شعار ديوان المظالم" style={{height: '60px', filter: 'brightness(0) invert(1)'}} />
            <h1 style={{margin: 0}}>الجلسات القضائية الإلكترونية</h1>
          </div>
          <p>نظام الجلسات عن بُعد - ديوان المظالم</p>
        </div>
        
        <div className="lobby">
          <h2>الانضمام للجلسة</h2>
          
          <input
            type="text"
            placeholder="الاسم الكامل"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
          />
          
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            style={{
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              marginBottom: '15px',
              width: '100%',
              textAlign: 'right',
              direction: 'rtl'
            }}
          >
            <option value="judge">قاضي</option>
            <option value="lawyer">محامي</option>
            <option value="party">طرف في القضية</option>
            <option value="participant">مشارك</option>
          </select>
          
          <input
            type="text"
            placeholder="رقم الجلسة (مثال: session123)"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
          />
          
          <button 
            onClick={handleJoin}
            disabled={!roomId.trim() || !userName.trim()}
          >
            الانضمام للجلسة
          </button>
          
          <div style={{marginTop: '20px', fontSize: '14px', color: '#666', textAlign: 'center'}}>
            <p>💡 <strong>تنبيه:</strong> استخدم نفس رقم الجلسة على كلا الجهازين</p>
            <p>🔒 آمن ومحلي | لا يتم تخزين البيانات</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <WebRTCMeeting 
      roomId={roomId} 
      userName={userName}
      userRole={userRole}
      onLeave={() => setJoined(false)}
    />
  )
}

export default App
