import { useState } from 'react'

function JudicialTerms({ onAccept, onCancel }) {
  const [accepted, setAccepted] = useState(false)

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px'
    }}>
      {/* Header with Logo */}
      <div style={{
        background: 'linear-gradient(135deg, #216147 0%, #2d7a5c 100%)',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        borderBottom: '4px solid #C1E328',
        textAlign: 'center'
      }}>
        <img 
          src="/BOG_Logo.svg" 
          alt="شعار ديوان المظالم" 
          style={{ height: '70px', marginBottom: '16px', filter: 'brightness(0) invert(1)' }} 
        />
        <h1 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '2rem', 
          fontWeight: '700', 
          color: 'white',
          lineHeight: '1.3'
        }}>
          ضوابط الجلسات القضائية الإلكترونية
        </h1>
        <p style={{ 
          margin: 0, 
          fontSize: '1rem', 
          color: 'rgba(255,255,255,0.95)',
          fontWeight: '500'
        }}>
          منصة معين الرقمية — ديوان المظالم
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          border: '2px solid rgba(193, 227, 40, 0.2)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#216147',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            شروط وضوابط حضور الجلسات القضائية الإلكترونية
          </h2>
          <p style={{
            fontSize: '0.95rem',
            color: '#6c757d',
            marginBottom: '28px',
            textAlign: 'center',
            lineHeight: '1.6'
          }}>
            يُرجى قراءة الشروط التالية بعناية. جميع الشروط إلزامية ويجب الالتزام بها طوال الجلسة.
          </p>

          {/* Terms List */}
          <div style={{ marginBottom: '24px' }}>
            {/* Term 1 */}
            <div style={{
              marginBottom: '20px',
              padding: '18px',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
              borderRight: '4px solid #216147',
              borderRadius: '8px'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#216147',
                marginBottom: '10px'
              }}>
                ١. سياسة الكاميرا
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: '#495057',
                lineHeight: '1.7',
                margin: 0
              }}>
                يجب على جميع المشاركين (القضاة، أمين السر، الأطراف، المحامين) <strong>إبقاء الكاميرا مفتوحة طوال الجلسة</strong>. عند إيقافها، سيتم إشعار رئيس الجلسة فوراً وإصدار تنبيه رسمي.
              </p>
            </div>

            {/* Term 2 */}
            <div style={{
              marginBottom: '20px',
              padding: '18px',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
              borderRight: '4px solid #216147',
              borderRadius: '8px'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#216147',
                marginBottom: '10px'
              }}>
                ٢. سياسة الهوية والتسمية
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: '#495057',
                lineHeight: '1.7',
                margin: 0
              }}>
                يجب إدخال <strong>الاسم الثلاثي الكامل بالعربي</strong> (مثال: محمد أحمد عبدالله). سيتم <strong>التحقق من الهوية عبر الذكاء الاصطناعي</strong> قبل الدخول للجلسة.
              </p>
            </div>

            {/* Term 3 */}
            <div style={{
              marginBottom: '20px',
              padding: '18px',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
              borderRight: '4px solid #216147',
              borderRadius: '8px'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#216147',
                marginBottom: '10px'
              }}>
                ٣. ملاءمة بيئة الحضور
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: '#495057',
                lineHeight: '1.7',
                margin: 0
              }}>
                يجب الحضور من <strong>بيئة رسمية ومهنية</strong>. يُمنع الحضور أثناء القيادة أو المشي أو في الأماكن العامة. النظام يراقب البيئة بالذكاء الاصطناعي وينبه رئيس الجلسة عند اكتشاف أي مخالفة.
              </p>
            </div>

            {/* Term 4 */}
            <div style={{
              marginBottom: '20px',
              padding: '18px',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
              borderRight: '4px solid #216147',
              borderRadius: '8px'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#216147',
                marginBottom: '10px'
              }}>
                ٤. الزي الرسمي
              </h3>
              <div style={{
                fontSize: '0.95rem',
                color: '#495057',
                lineHeight: '1.7'
              }}>
                <p style={{ margin: '0 0 8px 0' }}>
                  <strong>• القضاة والمحامون:</strong> الزي القضائي الرسمي (البشت الأسود)
                </p>
                <p style={{ margin: 0 }}>
                  <strong>• المشاركون:</strong> الزي السعودي الرسمي (ثوب + شماغ أو غترة مع العقال)
                </p>
              </div>
            </div>

            {/* Term 5 */}
            <div style={{
              marginBottom: '20px',
              padding: '18px',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
              borderRight: '4px solid #216147',
              borderRadius: '8px'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#216147',
                marginBottom: '10px'
              }}>
                ٥. صلاحيات رئيس الجلسة
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: '#495057',
                lineHeight: '1.7',
                margin: 0
              }}>
                <strong>رئيس الجلسة فقط</strong> له صلاحية إدارة الجلسة، فتحها وإغلاقها، توجيه النقاش، وإدارة المحاضر. الأعضاء الآخرون يمكنهم طرح الأسئلة فقط عند التفويض.
              </p>
            </div>

            {/* Term 6 */}
            <div style={{
              marginBottom: '20px',
              padding: '18px',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
              borderRight: '4px solid #216147',
              borderRadius: '8px'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#216147',
                marginBottom: '10px'
              }}>
                ٦. تسجيل الجلسة
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: '#495057',
                lineHeight: '1.7',
                margin: 0
              }}>
                التسجيل <strong>نشط تلقائياً</strong> ولا يمكن إيقافه حتى حفظ المحضر وتأكيد رئيس الجلسة. رئيس الجلسة لا يمكنه المغادرة قبل حفظ وتأكيد المحضر.
              </p>
            </div>
          </div>

          {/* Warning Box */}
          <div style={{
            padding: '18px',
            background: 'linear-gradient(135deg, #fff3cd 0%, #fff8e1 100%)',
            border: '2px solid #ffc107',
            borderRadius: '10px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ fontSize: '24px', flexShrink: 0 }}>⚠️</span>
              <div>
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '1rem', 
                  fontWeight: '700', 
                  color: '#856404' 
                }}>
                  تنبيه مهم:
                </h4>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.9rem', 
                  color: '#856404', 
                  lineHeight: '1.6' 
                }}>
                  جميع الشروط المذكورة أعلاه <strong>إلزامية وغير قابلة للتفاوض</strong>. أي مخالفة سيتم رصدها تلقائياً وإبلاغ رئيس الجلسة بها.
                </p>
              </div>
            </div>
          </div>

          {/* Checkbox */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: 'rgba(193, 227, 40, 0.08)',
            border: '2px solid rgba(193, 227, 40, 0.3)',
            borderRadius: '10px',
            cursor: 'pointer',
            marginBottom: '20px',
            transition: 'all 0.3s'
          }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              style={{ 
                width: '20px', 
                height: '20px', 
                cursor: 'pointer',
                flexShrink: 0
              }}
            />
            <span style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#216147',
              lineHeight: '1.5'
            }}>
              ✅ قرأت وأوافق على جميع الشروط
            </span>
          </label>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={onAccept}
              disabled={!accepted}
              style={{
                padding: '14px 36px',
                fontSize: '1.05rem',
                fontWeight: '700',
                background: accepted 
                  ? 'linear-gradient(135deg, #216147 0%, #2d7a5c 100%)'
                  : '#e0e0e0',
                color: accepted ? 'white' : '#9e9e9e',
                border: accepted ? '2px solid #C1E328' : '2px solid #bdbdbd',
                borderRadius: '10px',
                cursor: accepted ? 'pointer' : 'not-allowed',
                boxShadow: accepted ? '0 4px 12px rgba(33, 97, 71, 0.3)' : 'none',
                transition: 'all 0.3s'
              }}
            >
              المتابعة للانضمام
            </button>
            {onCancel && (
              <button 
                onClick={onCancel}
                style={{
                  padding: '14px 36px',
                  fontSize: '1.05rem',
                  fontWeight: '600',
                  background: 'white',
                  color: '#216147',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                رجوع
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default JudicialTerms
