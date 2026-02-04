import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API_SERVER = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

function IdentityVerification({ userName, nationalId, userRole, onVerified, onCancel }) {
  const [status, setStatus] = useState('ready') // ready, capturing, verifying, verified, failed
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    initializeCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      setMessage('الكاميرا جاهزة للتحقق من الهوية')
    } catch (err) {
      setError('لا يمكن الوصول للكاميرا. يرجى السماح بالأذونات.')
    }
  }

  const captureAndVerify = async () => {
    setStatus('capturing')
    setMessage('جاري التقاط الصورة...')
    
    // Wait 3 seconds for user to position properly
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    try {
      // Capture frame
      const canvas = canvasRef.current
      const video = videoRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
      
      setStatus('verifying')
      setMessage('جاري التحقق من الهوية وتطابق الصورة...')
      
      // Call backend for verification
      const response = await axios.post(`${API_SERVER}/verify-identity`, {
        imageBase64,
        nationalId,
        userName,
        userRole
      })
      
      if (response.data.success && response.data.verified) {
        setStatus('verified')
        setMessage('✅ تم التحقق من الهوية بنجاح')
        
        // Stop camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
        
        // Proceed to session after 1.5 seconds
        setTimeout(() => {
          onVerified()
        }, 1500)
      } else {
        setStatus('failed')
        setError(response.data.message || 'فشل التحقق من الهوية. يرجى المحاولة مرة أخرى.')
        setTimeout(() => {
          setStatus('ready')
          setError('')
        }, 3000)
      }
      
    } catch (err) {
      setStatus('failed')
      setError('حدث خطأ في التحقق. يرجى المحاولة مرة أخرى.')
      setTimeout(() => {
        setStatus('ready')
        setError('')
      }, 3000)
    }
  }

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
        padding: '18px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderBottom: '3px solid #C1E328'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
          <img src="/bog-logo.svg" alt="شعار ديوان المظالم" style={{ height: '42px', filter: 'brightness(0) invert(1)' }} />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'white' }}>التحقق من الهوية</h1>
        </div>
        <p style={{ margin: 0, opacity: 0.95, fontSize: '0.85rem', textAlign: 'center', color: 'white' }}>منصة معين الرقمية — ديوان المظالم</p>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ 
          maxWidth: '600px', 
          width: '100%',
          background: 'white',
          borderRadius: '12px',
          padding: '28px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: '2px solid rgba(193, 227, 40, 0.2)'
        }}>
          {/* User Info */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#216147', marginBottom: '8px' }}>
              التحقق من هوية المشارك
            </h2>
            <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', marginTop: '12px' }}>
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#495057' }}>
                <strong>الاسم:</strong> {userName}
              </p>
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#495057' }}>
                <strong>رقم الهوية:</strong> {nationalId}
              </p>
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#495057' }}>
                <strong>الصفة:</strong> {userRole === 'chair' ? 'رئيس الجلسة' : userRole === 'secretary' ? 'أمين السر' : userRole === 'party' ? 'طرف معني' : 'مشارك'}
              </p>
            </div>
          </div>

          {/* Video Feed */}
          <div style={{ 
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '20px',
            background: '#000',
            border: '3px solid #216147'
          }}>
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', display: 'block' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {/* Overlay Guide */}
            {status === 'ready' && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '200px',
                height: '250px',
                border: '3px dashed #C1E328',
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                pointerEvents: 'none'
              }} />
            )}
          </div>

          {/* Status Message */}
          {message && (
            <div style={{
              padding: '14px',
              background: status === 'verified' 
                ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'
                : status === 'failed'
                ? 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)'
                : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              borderRadius: '10px',
              marginBottom: '16px',
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: '600',
              color: status === 'verified' ? '#155724' : status === 'failed' ? '#721c24' : '#0d47a1',
              border: `2px solid ${status === 'verified' ? '#c3e6cb' : status === 'failed' ? '#f5c6cb' : '#90caf9'}`
            }}>
              {message}
            </div>
          )}

          {error && (
            <div style={{
              padding: '14px',
              background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
              borderRadius: '10px',
              marginBottom: '16px',
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: '600',
              color: '#721c24',
              border: '2px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}

          {/* Instructions */}
          <div style={{ 
            background: 'linear-gradient(135deg, #fff3cd 0%, #fff8e1 100%)',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '2px solid #ffc107',
            fontSize: '12px',
            lineHeight: '1.6'
          }}>
            <p style={{ margin: '0 0 6px 0', fontWeight: '700', color: '#856404' }}>📋 تعليمات التحقق:</p>
            <ul style={{ margin: 0, paddingRight: '20px', color: '#856404' }}>
              <li>تأكد من وضوح وجهك في الإطار المحدد</li>
              <li>أزل النظارات الشمسية والأقنعة</li>
              <li>اجلس في مكان بإضاءة جيدة</li>
              <li>انظر مباشرة للكاميرا</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {status === 'ready' && (
              <>
                <button 
                  onClick={captureAndVerify}
                  style={{
                    padding: '12px 28px',
                    background: 'linear-gradient(135deg, #216147 0%, #2d7a5c 100%)',
                    color: 'white',
                    border: '2px solid #C1E328',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(33, 97, 71, 0.3)',
                    transition: 'all 0.3s'
                  }}
                >
                  بدء التحقق من الهوية
                </button>
                <button 
                  onClick={onCancel}
                  style={{
                    padding: '12px 28px',
                    background: 'white',
                    color: '#216147',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  رجوع
                </button>
              </>
            )}
            
            {(status === 'capturing' || status === 'verifying') && (
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #216147',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IdentityVerification
