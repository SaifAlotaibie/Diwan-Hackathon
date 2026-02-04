# 🚀 خطوات النشر - دليل سريع

## الترتيب المطلوب:

### 1️⃣ Backend أولاً
- المسار: `webrtc-meeting-app/backend`
- متغيرات البيئة: `OPENAI_API_KEY`
- احفظ الـ URL بعد النشر

### 2️⃣ WebRTC Frontend ثانياً  
- المسار: `webrtc-meeting-app/frontend`
- متغيرات البيئة: `VITE_API_BASE_URL` (URL الـ Backend)
- احفظ الـ URL بعد النشر

### 3️⃣ Static Site ثالثاً

**⚠️ قبل النشر - خطوة مهمة:**

افتح ملف: `hackathon-site/maeen-sessions.html`  
السطر **51**:
```html
<!-- غير من: -->
<iframe src="http://localhost:5173" ...>

<!-- إلى: -->
<iframe src="https://your-webrtc-frontend.cranl.net" ...>
```
استخدم URL الـ WebRTC Frontend من الخطوة 2️⃣

**ثم:**
- المسار: `hackathon-site`
- لا يحتاج متغيرات بيئة
- انشر!

---

## ✅ رحلة المستخدم النهائية:

```
https://your-static-site.cranl.net/services.html
  ↓
https://your-static-site.cranl.net/moen.html
  ↓
https://your-static-site.cranl.net/maeen-sessions.html
  ↓ (iframe)
https://your-webrtc-frontend.cranl.net
  ↓ (API calls)
https://your-backend.cranl.net
```

---

## 📝 ملاحظات مهمة:

1. **كل المميزات شغالة:**
   - ✅ Session Reports (تقارير الجلسات)
   - ✅ Dress Code Check (فحص الملابس للمحامين)
   - ✅ WebRTC Video/Audio
   - ✅ Real-time communication

2. **الملفات النظيفة:**
   - حذفنا كل الملفات القديمة
   - باقي فقط الملفات المستخدمة

3. **التصميم موحد:**
   - خط Tajawal في كل مكان
   - ألوان ديوان المظالم
   - تصميم رسمي واحترافي

---

## 🔧 التعديل السريع:

إذا تبي تحدث URL الـ iframe بعد النشر:
```bash
# عدل السطر 51 في maeen-sessions.html
# ثم push للـ repository
git add hackathon-site/maeen-sessions.html
git commit -m "Update iframe URL for production"
git push
# cranL بيعمل redeploy تلقائي
```
