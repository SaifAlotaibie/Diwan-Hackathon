import { useState } from 'react'
import WebRTCMeeting from './WebRTC'
import './index.css'

function App() {
  const [sessionCode, setSessionCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [userRole, setUserRole] = useState('participant')
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState('')

  const handleJoin = () => {
    const code = sessionCode.replace(/\D/g, '').slice(0, 6)
    if (code.length !== 6) {
      setError('أدخل كود الجلسة (6 أرقام)')
      return
    }
    setError('')
    setJoined(true)
  }

  if (joined) {
    const roomId = sessionCode.replace(/\D/g, '').slice(0, 6)
    const userName = displayName.trim() || 'مشارك-' + Math.floor(1000 + Math.random() * 9000)
    return (
      <WebRTCMeeting
        roomId={roomId}
        userName={userName}
        userRole={userRole}
        isChair={userRole === 'chair'}
        onLeave={() => setJoined(false)}
      />
    )
  }

  return (
    <div className="app">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '10px' }}>
          <img src="/bog-logo.svg" alt="شعار ديوان المظالم" style={{ height: '60px', filter: 'brightness(0) invert(1)' }} />
          <h1 style={{ margin: 0 }}>الجلسات القضائية الإلكترونية</h1>
        </div>
        <p>أدخل كود الجلسة للانضمام — نفس الكود يربط الجميع بنفس الجلسة</p>
      </div>
      <div className="lobby">
        <h2>الدخول للجلسة</h2>
        <input
          type="text"
          placeholder="كود الجلسة (6 أرقام)"
          value={sessionCode}
          onChange={e => setSessionCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          onKeyPress={e => e.key === 'Enter' && handleJoin()}
          style={{ textAlign: 'center', letterSpacing: '0.4em', fontSize: '1.1rem' }}
        />
        <input
          type="text"
          placeholder="الاسم للعرض (اختياري)"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleJoin()}
          dir="rtl"
        />
        <select
          value={userRole}
          onChange={e => setUserRole(e.target.value)}
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
          <option value="chair">رئيس الجلسة</option>
          <option value="secretary">أمين السر</option>
          <option value="party">طرف معني</option>
          <option value="participant">مشارك</option>
        </select>
        {error && <div className="error" style={{ marginTop: '0.5rem' }}>{error}</div>}
        <button onClick={handleJoin}>
          الدخول للجلسة
        </button>
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
          <p>💡 شارك كود الجلسة (6 أرقام) مع المشاركين — من يدخل نفس الكود ينضم لنفس الجلسة</p>
        </div>
      </div>
    </div>
  )
}

export default App
