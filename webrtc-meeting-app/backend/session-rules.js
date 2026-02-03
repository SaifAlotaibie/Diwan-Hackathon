/**
 * شروط الجلسات المرئية القضائية — للتحقق والذكاء الاصطناعي/تدريب النماذج
 * Court Visual Session Rules — for validation and AI/model training
 */

const SESSION_RULES = {
  title: 'شروط الجلسات المرئية القضائية',
  version: '1.0',
  rules: [
    {
      id: 'many-to-many',
      category: 'نوع الجلسة',
      text: 'تشترط الجلسات المرئية القضائية أن تكون جلسات متعددة الأطراف (Many-to-Many Session)، يحضرها رئيس الجلسة وأمين السر والأطراف المعنية.',
      validation: 'session_has_chair_secretary_parties'
    },
    {
      id: 'camera-mandatory',
      category: 'التزام الحضور',
      text: 'التزام جميع الحضور بفتح الكاميرا طوال مدة الجلسة وعدم إغلاقها.',
      validation: 'camera_on_throughout'
    },
    {
      id: 'name-arabic',
      category: 'الدخول للجلسة',
      text: 'يلزم الدخول إلى الجلسة بتسجيل الاسم الكامل باللغة العربية فقط.',
      validation: 'full_name_arabic_only'
    },
    {
      id: 'national-id-verification',
      category: 'التحقق من الهوية',
      text: 'إدخال رقم الهوية الوطنية السعودية كشرط أساسي للتحقق من هوية المشارك، حيث يتم إرسال رمز تحقق عبر رسالة نصية (SMS Verification Code) إلى الرقم المدخل، ولا يُسمح بالدخول إلى الجلسة إلا بعد إدخال الرمز بشكل صحيح.',
      validation: 'national_id_and_sms_verified'
    },
    {
      id: 'venue-dress',
      category: 'مكان الحضور والزي',
      text: 'حضور الجلسة من مكان مهيأ يليق بسياق الجلسات القضائية، والالتزام بالزي الرسمي المعتمد لكل فئة.',
      validation: 'appropriate_venue_and_dress'
    },
    {
      id: 'no-distraction',
      category: 'الانضباط',
      text: 'عدم الانشغال بأي نشاط خارج إطار الجلسة.',
      validation: 'no_off_topic_activity'
    },
    {
      id: 'chair-only-control',
      category: 'إدارة الجلسة',
      text: 'تدار الجلسة بالكامل من قبل رئيسها فقط، بما في ذلك افتتاحها وختامها ومناقشة الأطراف.',
      validation: 'chair_controls_session'
    },
    {
      id: 'minutes-before-close',
      category: 'إنهاء الجلسة',
      text: 'لا يجوز إنهاء الجلسة أو إيقاف التسجيل إلا بعد تثبيت جميع المحاضر النظامية اللازمة، مع الالتزام بمشاركة محاضر الجلسة المسموح بها على شاشة الاجتماع وفق الضوابط المعتمدة.',
      validation: 'minutes_finalized_before_end'
    }
  ],
  roles: [
    { value: 'chair', labelAr: 'رئيس الجلسة', canEndSession: true, canOpenClose: true },
    { value: 'secretary', labelAr: 'أمين السر', canEndSession: false, canOpenClose: false },
    { value: 'party', labelAr: 'طرف معني', canEndSession: false, canOpenClose: false }
  ]
};

const ARABIC_NAME_REGEX = /^[\u0600-\u06FF\s]+$/;
const SAUDI_NATIONAL_ID_REGEX = /^[12]\d{8}$/;
const SAUDI_MOBILE_REGEX = /^05\d{8}$/;

function validateArabicName(name) {
  if (!name || typeof name !== 'string') return { valid: false, message: 'الاسم مطلوب' };
  const trimmed = name.trim();
  if (trimmed.length < 3) return { valid: false, message: 'الاسم الكامل يجب أن يكون ثلاثة أحرف على الأقل' };
  if (!ARABIC_NAME_REGEX.test(trimmed)) return { valid: false, message: 'الاسم يجب أن يكون باللغة العربية فقط' };
  return { valid: true };
}

function validateNationalId(id) {
  if (!id || typeof id !== 'string') return { valid: false, message: 'رقم الهوية الوطنية مطلوب' };
  const digits = id.replace(/\D/g, '');
  if (digits.length !== 10) return { valid: false, message: 'رقم الهوية الوطنية يتكون من 10 أرقام' };
  if (!SAUDI_NATIONAL_ID_REGEX.test(digits)) return { valid: false, message: 'صيغة رقم الهوية غير صحيحة' };
  return { valid: true };
}

function validateMobile(mobile) {
  if (!mobile || typeof mobile !== 'string') return { valid: false, message: 'رقم الجوال مطلوب لإرسال رمز التحقق' };
  const digits = mobile.replace(/\D/g, '');
  if (digits.length !== 10) return { valid: false, message: 'رقم الجوال يتكون من 10 أرقام (مثال: 05xxxxxxxx)' };
  if (!SAUDI_MOBILE_REGEX.test(digits)) return { valid: false, message: 'صيغة رقم الجوال غير صحيحة' };
  return { valid: true };
}

function getRoleByValue(value) {
  return SESSION_RULES.roles.find(r => r.value === value) || null;
}

module.exports = {
  SESSION_RULES,
  validateArabicName,
  validateNationalId,
  validateMobile,
  getRoleByValue,
  ARABIC_NAME_REGEX,
  SAUDI_NATIONAL_ID_REGEX,
  SAUDI_MOBILE_REGEX
};
