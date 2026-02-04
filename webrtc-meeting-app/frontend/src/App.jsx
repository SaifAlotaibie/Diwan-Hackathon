import { useState } from 'react'
import WebRTCMeeting from './WebRTC'
import IdentityVerification from './IdentityVerification'
import './index.css'

function App() {
  const [sessionCode, setSessionCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [userRole, setUserRole] = useState('participant')
  const [joined, setJoined] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [error, setError] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  // Validate Arabic name (at least 3 parts)
  const validateArabicName = (name) => {
    const arabicRegex = /^[\u0600-\u06FF\s]+$/
    const parts = name.trim().split(/\s+/)
    return arabicRegex.test(name) && parts.length >= 3
  }

  // Validate National ID (10 digits starting with 1 or 2)
  const validateNationalId = (id) => {
    const idRegex = /^[12]\d{9}$/
    return idRegex.test(id)
  }

  const handleJoin = () => {
    const code = sessionCode.replace(/\D/g, '').slice(0, 6)
    
    // Validate session code
    if (code.length !== 6) {
      setError('⚠️ أدخل رقم الجلسة (6 أرقام)')
      return
    }
    
    // Validate national ID
    if (!validateNationalId(nationalId)) {
      setError('⚠️ رقم الهوية غير صحيح (يجب أن يبدأ بـ 1 أو 2 ويتكون من 10 أرقام)')
      return
    }
    
    // Validate Arabic full name
    if (!validateArabicName(displayName)) {
      setError('⚠️ يجب إدخال الاسم الثلاثي كاملاً بالعربي (مثال: محمد أحمد عبدالله)')
      return
    }
    
    // Validate terms acceptance
    if (!acceptedTerms) {
      setError('⚠️ يجب الموافقة على شروط الجلسات القضائية للمتابعة')
      return
    }
    
    setError('')
    setShowVerification(true)
  }

  // Show identity verification screen
  if (showVerification && !joined) {
    return (
      <IdentityVerification
        userName={displayName}
        nationalId={nationalId}
        userRole={userRole}
        onVerified={() => setJoined(true)}
        onCancel={() => setShowVerification(false)}
      />
    )
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
    <div className="app" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="header" style={{
        background: 'linear-gradient(135deg, #216147 0%, #2d7a5c 100%)',
        padding: '18px 20px',
        borderRadius: '0',
        marginBottom: '0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderBottom: '3px solid #C1E328'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
          <img src="/bog-logo.svg" alt="شعار ديوان المظالم" style={{ height: '42px', filter: 'brightness(0) invert(1)' }} />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>الجلسات القضائية الإلكترونية</h1>
        </div>
        <p style={{ margin: 0, opacity: 0.95, fontSize: '0.85rem', textAlign: 'center' }}>منصة معين الرقمية — ديوان المظالم</p>
      </div>
      <div className="lobby" style={{ maxWidth: '520px', margin: '0 auto', padding: '15px 20px', flex: 1, display: 'flex', alignItems: 'center' }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '22px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          border: '2px solid rgba(193, 227, 40, 0.2)',
          width: '100%'
        }}>
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '6px', color: '#216147' }}>الانضمام إلى الجلسة</h2>
          <p style={{ color: '#6c757d', fontSize: '0.85rem', margin: 0 }}>أدخل بيانات الجلسة للانضمام</p>
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#216147', fontSize: '0.85rem' }}>
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
              letterSpacing: '0.35em',
              fontSize: '1.15rem',
              fontWeight: '700',
              padding: '11px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              width: '100%',
              transition: 'all 0.3s',
              background: '#f8f9fa'
            }}
          />
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#216147', fontSize: '0.85rem' }}>
            رقم الهوية الوطنية
          </label>
          <input
            type="text"
            placeholder="1234567890"
            value={nationalId}
            onChange={e => setNationalId(e.target.value.replace(/\D/g, '').slice(0, 10))}
            maxLength={10}
            style={{
              padding: '10px',
              fontSize: '14px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              width: '100%',
              fontWeight: '500',
              textAlign: 'center',
              letterSpacing: '0.1em'
            }}
          />
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#216147', fontSize: '0.85rem' }}>
            الاسم الثلاثي بالعربي
          </label>
          <input
            type="text"
            placeholder="محمد أحمد عبدالله"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleJoin()}
            dir="rtl"
            style={{
              padding: '10px',
              fontSize: '14px',
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
        {/* Judicial Session Terms - Card Grid */}
        <div style={{ marginBottom: '14px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#216147', fontSize: '0.9rem', fontWeight: '700', textAlign: 'center' }}>
            شروط الجلسات القضائية
          </h4>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '8px',
            marginBottom: '12px'
          }}>
            {/* Card 1: Camera */}
            <div className="term-card" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center',
              transition: 'all 0.3s',
              cursor: 'default'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#216147', marginBottom: '4px' }}>الكاميرا</div>
              <div style={{ fontSize: '11px', color: '#6c757d', lineHeight: '1.4' }}>مفتوحة طوال الجلسة</div>
            </div>

            {/* Card 2: Identity */}
            <div className="term-card" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center',
              transition: 'all 0.3s',
              cursor: 'default'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#216147', marginBottom: '4px' }}>الهوية</div>
              <div style={{ fontSize: '11px', color: '#6c757d', lineHeight: '1.4' }}>الاسم الكامل الحقيقي</div>
            </div>

            {/* Card 3: Environment */}
            <div className="term-card" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center',
              transition: 'all 0.3s',
              cursor: 'default'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#216147', marginBottom: '4px' }}>البيئة المناسبة</div>
              <div style={{ fontSize: '11px', color: '#6c757d', lineHeight: '1.4' }}>رسمية ومهنية</div>
            </div>

            {/* Card 4: Dress Code */}
            <div className="term-card" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center',
              transition: 'all 0.3s',
              cursor: 'default'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#216147', marginBottom: '4px' }}>اللباس الرسمي</div>
              <div style={{ fontSize: '11px', color: '#6c757d', lineHeight: '1.4' }}>الزي المناسب</div>
            </div>

            {/* Card 5: Authority */}
            <div className="term-card" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center',
              transition: 'all 0.3s',
              cursor: 'default'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#216147', marginBottom: '4px' }}>الصلاحيات</div>
              <div style={{ fontSize: '11px', color: '#6c757d', lineHeight: '1.4' }}>حسب الدور</div>
            </div>

            {/* Card 6: Recording */}
            <div className="term-card" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center',
              transition: 'all 0.3s',
              cursor: 'default'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#216147', marginBottom: '4px' }}>التسجيل</div>
              <div style={{ fontSize: '11px', color: '#6c757d', lineHeight: '1.4' }}>نشط حتى الإنهاء</div>
            </div>
          </div>

          {/* Terms Checkbox */}
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            cursor: 'pointer', 
            fontSize: '11px',
            padding: '10px',
            background: 'rgba(193, 227, 40, 0.08)',
            borderRadius: '8px',
            border: '2px solid rgba(193, 227, 40, 0.3)',
            transition: 'all 0.3s'
          }}>
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={e => setAcceptedTerms(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
            />
            <span style={{ fontWeight: '600', color: '#216147' }}>أوافق على جميع شروط الجلسات القضائية المذكورة أعلاه</span>
          </label>
        </div>
        
        {error && <div className="error" style={{ marginTop: '0', marginBottom: '12px', padding: '12px', fontSize: '12px' }}>{error}</div>}
        <button onClick={handleJoin} style={{
          fontSize: '0.95rem',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #216147 0%, #2d7a5c 100%)',
          padding: '12px 24px',
          borderRadius: '8px',
          border: '2px solid #C1E328',
          boxShadow: '0 4px 12px rgba(33, 97, 71, 0.3)',
          transition: 'all 0.3s'
        }}>
          الانضمام إلى الجلسة
        </button>
        <div style={{ marginTop: '14px', padding: '10px', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', borderRadius: '8px', border: '2px solid #90caf9' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#0d47a1', textAlign: 'center', lineHeight: '1.5', fontWeight: '500' }}>
            <strong style={{ fontSize: '12.5px' }}>تنبيه:</strong> سيطلب المتصفح الإذن باستخدام الكاميرا والمايكروفون عند الانضمام للجلسة
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}

export default App
