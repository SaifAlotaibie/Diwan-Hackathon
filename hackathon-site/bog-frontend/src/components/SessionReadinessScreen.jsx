import { useState } from 'react';

export default function SessionReadinessScreen({ onProceed, sessionData }) {
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [officialAccountId, setOfficialAccountId] = useState('');
  const [errors, setErrors] = useState({});

  // Validation functions
  const isArabicName = (name) => {
    const arabicPattern = /^[\u0600-\u06FF\s]+$/;
    return arabicPattern.test(name);
  };

  const isFullName = (name) => {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 3; // At least 3 parts (first, father, last)
  };

  const validateNationalId = (id) => {
    // Saudi National ID validation (10 digits, starts with 1 or 2)
    const idPattern = /^[12]\d{9}$/;
    return idPattern.test(id);
  };

  const handleProceed = () => {
    const newErrors = {};

    // Validate full name
    if (!fullName.trim()) {
      newErrors.fullName = 'يرجى إدخال الاسم الكامل';
    } else if (!isArabicName(fullName)) {
      newErrors.fullName = 'يجب أن يكون الاسم باللغة العربية فقط';
    } else if (!isFullName(fullName)) {
      newErrors.fullName = 'يجب إدخال الاسم الكامل (الاسم الأول + اسم الأب + اسم العائلة على الأقل)';
    }

    // Validate national ID
    if (!nationalId.trim()) {
      newErrors.nationalId = 'يرجى إدخال رقم الهوية الوطنية';
    } else if (!validateNationalId(nationalId)) {
      newErrors.nationalId = 'رقم الهوية غير صحيح (يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2)';
    }

    // Validate official account for secretary
    if (sessionData.userRole === 'secretary') {
      if (!officialAccountId.trim()) {
        newErrors.officialAccountId = 'يجب على أمين السر إدخال رقم الحساب الرسمي';
      }
    }

    // Check rules agreement
    if (!agreedToRules) {
      newErrors.rules = 'يجب الموافقة على قواعد الجلسة للمتابعة';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // All validations passed
    onProceed({
      fullName,
      nationalId,
      officialAccountId: sessionData.userRole === 'secretary' ? officialAccountId : null
    });
  };

  const judicialRules = [
    {
      icon: '📹',
      title: 'سياسة الكاميرا',
      rules: [
        'يجب إبقاء الكاميرا مفعّلة طوال مدة الجلسة',
        'لا يسمح بإغلاق الكاميرا تحت أي ظرف',
        'سيتم تنبيه رئيس الجلسة فوراً عند محاولة إغلاق الكاميرا'
      ]
    },
    {
      icon: '👔',
      title: 'الزي الرسمي',
      rules: [
        'القضاة والمحامون: الزي القضائي الرسمي',
        'المشاركون الذكور: الزي السعودي الرسمي (ثوب + شماغ أو غترة)',
        'يجب الالتزام بالزي الرسمي من بداية الجلسة'
      ]
    },
    {
      icon: '🏛️',
      title: 'البيئة المناسبة',
      rules: [
        'الحضور من مكان رسمي مناسب',
        'لا يسمح بالحضور من السيارة أو الأماكن العامة',
        'يجب توفر بيئة هادئة وخالية من الضوضاء'
      ]
    },
    {
      icon: '⚖️',
      title: 'صلاحيات رئيس الجلسة',
      rules: [
        'رئيس الجلسة فقط يمكنه فتح وإغلاق الجلسة',
        'رئيس الجلسة فقط يمكنه إدارة النقاش',
        'الأعضاء الآخرون لا يمكنهم التحدث إلا بإذن صريح'
      ]
    },
    {
      icon: '📝',
      title: 'المحاضر والسجلات',
      rules: [
        'لا يمكن إنهاء الجلسة قبل حفظ جميع المحاضر',
        'التسجيل يستمر حتى حفظ وإتمام المحاضر',
        'محاضر المداولة خاصة ولا يمكن مشاركتها'
      ]
    },
    {
      icon: '🎯',
      title: 'الانتباه والسلوك',
      rules: [
        'يجب الانتباه الكامل طوال الجلسة',
        'ممنوع استخدام الهاتف الجوال',
        'ممنوع الأكل أو الشرب أثناء الجلسة'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-6">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header with Saudi Branding */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-6xl">⚖️</div>
              <div>
                <h1 className="text-3xl font-bold">ديوان المظالم</h1>
                <p className="text-green-100 text-lg">المملكة العربية السعودية</p>
              </div>
            </div>
            <div className="text-6xl">🇸🇦</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h2 className="text-xl font-bold mb-2">🎥 الجلسة القضائية الإلكترونية</h2>
            <p className="text-green-50">رقم الجلسة: {sessionData.roomId}</p>
            <p className="text-green-50">الدور: {getRoleLabel(sessionData.userRole)}</p>
          </div>
        </div>

        <div className="p-8">
          {/* Identity Verification Section */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🆔</span>
              <span>التحقق من الهوية</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  الاسم الكامل بالعربية (الاسم الأول + اسم الأب + اسم العائلة) *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setErrors(prev => ({ ...prev, fullName: null }));
                  }}
                  placeholder="مثال: محمد بن عبدالله الأحمد"
                  className={`w-full px-4 py-3 border-2 ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right`}
                  dir="rtl"
                />
                {errors.fullName && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  رقم الهوية الوطنية *
                </label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => {
                    setNationalId(e.target.value.replace(/\D/g, ''));
                    setErrors(prev => ({ ...prev, nationalId: null }));
                  }}
                  placeholder="1234567890"
                  maxLength={10}
                  className={`w-full px-4 py-3 border-2 ${errors.nationalId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500`}
                  dir="ltr"
                />
                {errors.nationalId && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{errors.nationalId}</span>
                  </p>
                )}
              </div>

              {sessionData.userRole === 'secretary' && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    رقم الحساب الرسمي (أمين السر) *
                  </label>
                  <input
                    type="text"
                    value={officialAccountId}
                    onChange={(e) => {
                      setOfficialAccountId(e.target.value);
                      setErrors(prev => ({ ...prev, officialAccountId: null }));
                    }}
                    placeholder="رقم الحساب الرسمي"
                    className={`w-full px-4 py-3 border-2 ${errors.officialAccountId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500`}
                  />
                  {errors.officialAccountId && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>{errors.officialAccountId}</span>
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    ⚠️ يجب على أمين السر تسجيل الدخول باستخدام حسابه الرسمي فقط
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Judicial Rules Section */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span>
              <span>قواعد الجلسة القضائية</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {judicialRules.map((section, idx) => (
                <div key={idx} className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{section.icon}</span>
                    <h4 className="font-bold text-gray-800 text-lg">{section.title}</h4>
                  </div>
                  <ul className="space-y-2">
                    {section.rules.map((rule, ruleIdx) => (
                      <li key={ruleIdx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Dress Code Visual Guide */}
          <div className="mb-8 bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>👔</span>
              <span>دليل الزي الرسمي المطلوب</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-4">
                <div className="text-5xl mb-2">⚖️</div>
                <h4 className="font-bold text-gray-800 mb-2">القضاة</h4>
                <p className="text-sm text-gray-600">الزي القضائي الرسمي الكامل</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-5xl mb-2">👨‍⚖️</div>
                <h4 className="font-bold text-gray-800 mb-2">المحامون</h4>
                <p className="text-sm text-gray-600">العباءة القضائية الرسمية</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-5xl mb-2">🕴️</div>
                <h4 className="font-bold text-gray-800 mb-2">الأطراف المعنية</h4>
                <p className="text-sm text-gray-600">الزي السعودي الرسمي (ثوب + شماغ/غترة)</p>
              </div>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <input
                type="checkbox"
                checked={agreedToRules}
                onChange={(e) => {
                  setAgreedToRules(e.target.checked);
                  setErrors(prev => ({ ...prev, rules: null }));
                }}
                className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-gray-800 font-semibold">
                أقر بأنني قرأت وفهمت جميع قواعد الجلسة القضائية المذكورة أعلاه، وأتعهد بالالتزام الكامل بها طوال مدة الجلسة. 
                أدرك أن أي مخالفة لهذه القواعد قد تؤدي إلى اتخاذ إجراءات قانونية بحقي.
              </span>
            </label>
            {errors.rules && (
              <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                <span>⚠️</span>
                <span>{errors.rules}</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleProceed}
              disabled={!agreedToRules}
              className={`flex-1 py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                agreedToRules
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {agreedToRules ? '✅ المتابعة إلى الجلسة' : '⚠️ يجب الموافقة على القواعد أولاً'}
            </button>
          </div>

          {/* Footer Notice */}
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>📌 تنويه هام:</strong> هذه جلسة قضائية رسمية تخضع لنظام المرافعات أمام ديوان المظالم. 
              سيتم تسجيل الجلسة بالكامل وحفظها في السجلات الرسمية.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getRoleLabel(role) {
  const roleLabels = {
    'chair': 'رئيس الجلسة',
    'judge': 'القاضي',
    'secretary': 'أمين السر',
    'lawyer': 'المحامي',
    'party': 'طرف معني',
    'participant': 'مشارك'
  };
  return roleLabels[role] || role;
}
