import { useState } from 'react'
import WebRTCMeeting from './WebRTC'
import IdentityVerification from './IdentityVerification'
import JudicialTerms from './JudicialTerms'
import './index.css'

function App() {
  const [sessionCode, setSessionCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [userRole, setUserRole] = useState('participant')
  const [joined, setJoined] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [showTermsPage, setShowTermsPage] = useState(true) // ALWAYS show terms first
  const [error, setError] = useState('')

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
    
    setError('')
    // Show identity verification after data validation
    setShowVerification(true)
  }

  // Show Terms & Conditions Page First
  if (showTermsPage) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #216147 0%, #2d7a5c 100%)',
          padding: '24px 20px',
          borderBottom: '4px solid #C1E328',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '12px' }}>
              <img src="/BOG_Logo.svg" alt="شعار ديوان المظالم" style={{ height: '50px', filter: 'brightness(0) invert(1)' }} />
              <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'white' }}>ضوابط الجلسات القضائية الإلكترونية</h1>
            </div>
            <p style={{ margin: 0, fontSize: '1rem', color: 'rgba(255,255,255,0.95)', fontWeight: '500' }}>منصة معين الرقمية — ديوان المظالم</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          maxWidth: '900px', 
          margin: '0 auto', 
          padding: '30px 20px',
          width: '100%'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            border: '3px solid #C1E328'
          }}>
            {/* Introduction */}
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '35px',
              paddingBottom: '25px',
              borderBottom: '2px solid #e0e0e0'
            }}>
              <h2 style={{ 
                fontSize: '1.8rem', 
                fontWeight: '800', 
                color: '#216147',
                marginBottom: '12px'
              }}>
                شروط وضوابط حضور الجلسات القضائية الإلكترونية
              </h2>
              <p style={{ 
                fontSize: '1.05rem', 
                color: '#6c757d', 
                lineHeight: '1.7',
                maxWidth: '700px',
                margin: '0 auto'
              }}>
                يُرجى قراءة الشروط التالية بعناية. <strong style={{ color: '#216147' }}>جميع الشروط إلزامية</strong> ويجب الالتزام بها طوال الجلسة.
              </p>
            </div>

            {/* Terms Grid */}
            <div style={{ display: 'grid', gap: '20px', marginBottom: '35px' }}>
              {/* Term 1: Camera */}
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                padding: '24px',
                transition: 'all 0.3s'
              }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#216147', margin: '0 0 10px 0' }}>
                  ١. سياسة الكاميرا
                </h3>
                <p style={{ fontSize: '1rem', color: '#495057', lineHeight: '1.7', margin: 0 }}>
                  يجب على <strong>جميع المشاركين</strong> (القضاة، أمين السر، الأطراف، المحامين) إبقاء الكاميرا <strong style={{ color: '#d32f2f' }}>مفتوحة طوال الجلسة</strong>. عند إيقافها، سيتم إشعار رئيس الجلسة فوراً وإصدار تنبيه رسمي.
                </p>
              </div>

              {/* Term 2: Identity */}
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                padding: '24px',
                transition: 'all 0.3s'
              }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#216147', margin: '0 0 10px 0' }}>
                  ٢. سياسة الهوية والتسمية
                </h3>
                <p style={{ fontSize: '1rem', color: '#495057', lineHeight: '1.7', margin: 0 }}>
                  يجب إدخال <strong>الاسم الثلاثي الكامل بالعربي</strong> (مثال: محمد أحمد عبدالله). سيتم التحقق من الهوية عبر <strong style={{ color: '#216147' }}>الذكاء الاصطناعي</strong> قبل الدخول للجلسة.
                </p>
              </div>

              {/* Term 3: Environment */}
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                padding: '24px',
                transition: 'all 0.3s'
              }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#216147', margin: '0 0 10px 0' }}>
                  ٣. ملاءمة بيئة الحضور
                </h3>
                <p style={{ fontSize: '1rem', color: '#495057', lineHeight: '1.7', margin: 0 }}>
                  يجب الحضور من <strong>بيئة رسمية ومهنية</strong>. يُمنع الحضور أثناء القيادة أو المشي أو في الأماكن العامة. النظام يراقب البيئة بالذكاء الاصطناعي وينبه رئيس الجلسة عند اكتشاف أي مخالفة.
                </p>
              </div>

              {/* Term 4: Dress Code */}
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                padding: '24px',
                transition: 'all 0.3s'
              }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#216147', margin: '0 0 10px 0' }}>
                  ٤. الزي الرسمي
                </h3>
                <p style={{ fontSize: '1rem', color: '#495057', lineHeight: '1.7', margin: '0 0 10px 0' }}>
                  <strong>• القضاة والمحامون:</strong> الزي القضائي الرسمي (البشت الأسود)
                </p>
                <p style={{ fontSize: '1rem', color: '#495057', lineHeight: '1.7', margin: 0 }}>
                  <strong>• المشاركون:</strong> الزي السعودي الرسمي (ثوب + شماغ أو غترة مع العقال)
                </p>
              </div>

              {/* Term 5: Authority */}
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                padding: '24px',
                transition: 'all 0.3s'
              }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#216147', margin: '0 0 10px 0' }}>
                  ٥. صلاحيات رئيس الجلسة
                </h3>
                <p style={{ fontSize: '1rem', color: '#495057', lineHeight: '1.7', margin: 0 }}>
                  <strong>رئيس الجلسة فقط</strong> له صلاحية إدارة الجلسة، فتحها وإغلاقها، توجيه النقاش، وإدارة المحاضر. الأعضاء الآخرون يمكنهم طرح الأسئلة <strong>فقط عند التفويض</strong>.
                </p>
              </div>

              {/* Term 6: Recording */}
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                padding: '24px',
                transition: 'all 0.3s'
              }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#216147', margin: '0 0 10px 0' }}>
                  ٦. تسجيل الجلسة
                </h3>
                <p style={{ fontSize: '1rem', color: '#495057', lineHeight: '1.7', margin: 0 }}>
                  التسجيل <strong style={{ color: '#d32f2f' }}>نشط تلقائياً</strong> ولا يمكن إيقافه حتى حفظ المحضر وتأكيد رئيس الجلسة. رئيس الجلسة <strong>لا يمكنه المغادرة</strong> قبل حفظ وتأكيد المحضر.
                </p>
              </div>
            </div>

            {/* Warning Box */}
            <div style={{
              background: 'linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)',
              border: '3px solid #ffc107',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '25px'
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: '1.05rem', 
                color: '#856404', 
                textAlign: 'center',
                lineHeight: '1.7',
                fontWeight: '600'
              }}>
                ⚠️ <strong>تنبيه مهم:</strong> جميع الشروط المذكورة أعلاه <strong>إلزامية وغير قابلة للتفاوض</strong>. أي مخالفة سيتم رصدها تلقائياً وإبلاغ رئيس الجلسة بها.
              </p>
            </div>

            {/* Accept Button */}
            <button 
              onClick={() => {
                setShowTermsPage(false)
                // Go to lobby to fill data first
              }}
              style={{
                width: '100%',
                fontSize: '1.2rem',
                fontWeight: '800',
                padding: '18px',
                background: 'linear-gradient(135deg, #216147 0%, #2d7a5c 100%)',
                color: 'white',
                border: '3px solid #C1E328',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(33, 97, 71, 0.4)',
                transition: 'all 0.3s',
                fontFamily: 'Tajawal, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 8px 25px rgba(33, 97, 71, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 6px 20px rgba(33, 97, 71, 0.4)'
              }}
            >
              ✅ قرأت وأوافق على جميع الشروط - المتابعة للانضمام
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show identity verification screen (Demo mode for presentation)
  if (showVerification && !joined) {
    return (
      <IdentityVerification
        userName={displayName || 'مشارك'}
        nationalId={nationalId || '1000000000'}
        userRole={userRole}
        onVerified={() => {
          setShowVerification(false)
          setJoined(true) // Go directly to session after successful verification
        }}
        onCancel={() => {
          setShowVerification(false)
          // Go back to lobby (data entry page) if cancelled
        }}
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
        padding: window.innerWidth <= 768 ? '12px 15px' : '18px 20px',
        borderRadius: '0',
        marginBottom: '0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderBottom: '3px solid #C1E328'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: window.innerWidth <= 768 ? '8px' : '12px', marginBottom: window.innerWidth <= 768 ? '4px' : '8px', flexWrap: 'wrap' }}>
          <img src="/BOG_Logo.svg" alt="شعار ديوان المظالم" style={{ height: window.innerWidth <= 768 ? '32px' : '42px', filter: 'brightness(0) invert(1)' }} />
          <h1 style={{ margin: 0, fontSize: window.innerWidth <= 768 ? '1.1rem' : '1.5rem', fontWeight: '700', textAlign: 'center' }}>الجلسات القضائية الإلكترونية</h1>
        </div>
        <p style={{ margin: 0, opacity: 0.95, fontSize: window.innerWidth <= 768 ? '0.75rem' : '0.85rem', textAlign: 'center' }}>منصة معين الرقمية — ديوان المظالم</p>
      </div>
      <div className="lobby" style={{ maxWidth: '520px', margin: '0 auto', padding: window.innerWidth <= 768 ? '10px 15px' : '15px 20px', flex: 1, display: 'flex', alignItems: 'center' }}>
        <div style={{
          background: 'white',
          borderRadius: window.innerWidth <= 768 ? '10px' : '12px',
          padding: window.innerWidth <= 768 ? '16px' : '22px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          border: '2px solid rgba(193, 227, 40, 0.2)',
          width: '100%'
        }}>
        <div style={{ textAlign: 'center', marginBottom: window.innerWidth <= 768 ? '14px' : '18px' }}>
          <h2 style={{ fontSize: window.innerWidth <= 768 ? '1.2rem' : '1.4rem', fontWeight: '700', marginBottom: '6px', color: '#216147' }}>الانضمام إلى الجلسة</h2>
          <p style={{ color: '#6c757d', fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.85rem', margin: 0 }}>أدخل بيانات الجلسة للانضمام</p>
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
            <option value="judge">قاضي</option>
            <option value="lawyer">محامي</option>
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
            gap: '10px',
            marginBottom: '14px'
          }}>
            {/* Card 1: Camera */}
            <div className="term-card" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
              transition: 'all 0.3s',
              cursor: 'default'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#216147', marginBottom: '6px' }}>الكاميرا</div>
              <div style={{ fontSize: '13px', color: '#6c757d', lineHeight: '1.4' }}>مفتوحة طوال الجلسة</div>
            </div>

            {/* Card 2: Identity */}
            <div className="term-card" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
              transition: 'all 0.3s',
              cursor: 'default'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#216147', marginBottom: '6px' }}>الهوية</div>
              <div style={{ fontSize: '13px', color: '#6c757d', lineHeight: '1.4' }}>الاسم الكامل الحقيقي</div>
            </div>

            {/* Card 3: Environment */}
            <div className="term-card" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
              transition: 'all 0.3s',
              cursor: 'default'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#216147', marginBottom: '6px' }}>البيئة المناسبة</div>
              <div style={{ fontSize: '13px', color: '#6c757d', lineHeight: '1.4' }}>رسمية ومهنية</div>
            </div>

            {/* Card 4: Dress Code */}
            <div className="term-card" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
              transition: 'all 0.3s',
              cursor: 'default'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#216147', marginBottom: '6px' }}>اللباس الرسمي</div>
              <div style={{ fontSize: '13px', color: '#6c757d', lineHeight: '1.4' }}>الزي المناسب</div>
            </div>

            {/* Card 5: Authority */}
            <div className="term-card" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
              transition: 'all 0.3s',
              cursor: 'default'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#216147', marginBottom: '6px' }}>الصلاحيات</div>
              <div style={{ fontSize: '13px', color: '#6c757d', lineHeight: '1.4' }}>حسب الدور</div>
            </div>

            {/* Card 6: Recording */}
            <div className="term-card" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
              transition: 'all 0.3s',
              cursor: 'default'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#216147', marginBottom: '6px' }}>التسجيل</div>
              <div style={{ fontSize: '13px', color: '#6c757d', lineHeight: '1.4' }}>نشط حتى الإنهاء</div>
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
