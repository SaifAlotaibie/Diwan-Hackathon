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
    <div className="app" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
      <div className="header" style={{
        background: 'linear-gradient(135deg, #216147 0%, #2d7a5c 100%)',
        padding: '30px 20px',
        borderRadius: '0',
        marginBottom: '0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderBottom: '4px solid #C1E328'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '12px' }}>
          <img src="/bog-logo.svg" alt="شعار ديوان المظالم" style={{ height: '55px', filter: 'brightness(0) invert(1)' }} />
          <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: '700' }}>الجلسات القضائية الإلكترونية</h1>
        </div>
        <p style={{ margin: 0, opacity: 0.95, fontSize: '1rem', textAlign: 'center' }}>منصة معين الرقمية — ديوان المظالم</p>
      </div>
      <div className="lobby" style={{ maxWidth: '550px', margin: '0 auto', padding: '20px 20px' }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '28px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          border: '2px solid rgba(193, 227, 40, 0.2)'
        }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '8px', color: '#216147' }}>الانضمام إلى الجلسة</h2>
          <p style={{ color: '#6c757d', fontSize: '0.9rem', margin: 0 }}>أدخل بيانات الجلسة للانضمام</p>
        </div>
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#216147', fontSize: '0.9rem' }}>
            رقم الجلسة
          </label>
          <input
            type="text"
            placeholder="000000"
            value={sessionCode}
            onChange={e => setSessionCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            onKeyPress={e => e.key === 'Enter' && handleJoin()}
            style={{
              textAlign: 'center',
              letterSpacing: '0.4em',
              fontSize: '1.3rem',
              fontWeight: '700',
              padding: '14px',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              width: '100%',
              transition: 'all 0.3s',
              background: '#f8f9fa'
            }}
          />
        </div>
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#216147', fontSize: '0.9rem' }}>
            الاسم الكامل
          </label>
          <input
            type="text"
            placeholder="أدخل اسمك الكامل"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleJoin()}
            dir="rtl"
            style={{
              padding: '12px',
              fontSize: '15px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              width: '100%',
              fontWeight: '500'
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#216147', fontSize: '0.9rem' }}>
            الصفة في الجلسة
          </label>
          <select
            value={userRole}
            onChange={e => setUserRole(e.target.value)}
            style={{
              padding: '12px',
              fontSize: '15px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              width: '100%',
              textAlign: 'right',
              direction: 'rtl',
              fontWeight: '500',
              background: 'white',
              cursor: 'pointer',
              fontFamily: 'Tajawal, sans-serif'
            }}
          >
            <option value="chair">رئيس الجلسة</option>
            <option value="secretary">أمين السر</option>
            <option value="party">طرف معني</option>
            <option value="participant">مشارك</option>
          </select>
        </div>
        {error && <div className="error" style={{ marginTop: '0', marginBottom: '16px' }}>{error}</div>}
        <button onClick={handleJoin} style={{
          fontSize: '1rem',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #216147 0%, #2d7a5c 100%)',
          padding: '14px 28px',
          borderRadius: '10px',
          border: '2px solid #C1E328',
          boxShadow: '0 4px 12px rgba(33, 97, 71, 0.3)',
          transition: 'all 0.3s'
        }}>
          الانضمام إلى الجلسة
        </button>
        <div style={{ marginTop: '20px', padding: '14px', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', borderRadius: '10px', border: '2px solid #90caf9' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#0d47a1', textAlign: 'center', lineHeight: '1.6', fontWeight: '500' }}>
            <strong style={{ fontSize: '14px' }}>تنبيه:</strong> سيطلب المتصفح الإذن باستخدام الكاميرا والمايكروفون عند الانضمام للجلسة
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}

export default App
