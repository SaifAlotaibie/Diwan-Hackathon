# 🚀 Diwan Hackathon - Deployment Guide

## 📦 Project Structure

```
Diwan-Hackathon/
├── hackathon-site/                      ← Static Frontend (services.html, moen.html, etc.)
├── webrtc-meeting-app/
│   ├── frontend/                        ← WebRTC Meeting App (React/Vite)
│   └── backend/                         ← Backend API + Socket.IO
```

**3 Components to Deploy:**
1. **Static Site** (`hackathon-site/`) - الصفحات الرئيسية
2. **WebRTC Frontend** (`webrtc-meeting-app/frontend/`) - تطبيق الجلسات
3. **Backend** (`webrtc-meeting-app/backend/`) - الخادم والـ API

---

## 🔧 Backend Deployment (cranL)

### Build Path
```
webrtc-meeting-app/backend
```

### Environment Variables
```
OPENAI_API_KEY=sk-proj-xxx...
```

### Start Command
```
npm start
```
(Or leave empty - Nixpacks auto-detects)

### Health Check
- Path: `/health`
- Expected Response: `{"status":"ok","timestamp":"..."}`

### Backend Endpoints
- `GET /health` - Health check
- `GET /rooms` - Active rooms
- `POST /upload-audio` - Upload audio
- `POST /generate-session-report` - Generate report
- `POST /check-dress-code` - Dress code check
- Socket.IO - Real-time WebRTC signaling

---

## 🎨 Static Site Deployment (cranL)

### Build Path
```
hackathon-site
```

### Type
**Static Site** - no build needed (pure HTML/CSS/JS)

### ⚠️ Important Configuration
قبل الـ deployment، حدث ملف `hackathon-site/maeen-sessions.html`:
```html
<!-- غير من localhost إلى URL الـ WebRTC Frontend -->
<iframe src="https://your-webrtc-frontend.cranl.net" ...>
```

---

## 🖥️ WebRTC Frontend Deployment (cranL)

### Build Path
```
webrtc-meeting-app/frontend
```

### Environment Variables
```
VITE_API_BASE_URL=https://your-backend-domain.cranl.net
```

**⚠️ IMPORTANT:** Replace with actual backend URL!

### Build Command
```
npm run build
```

### Output Directory
```
dist
```

---

## 📝 Step-by-Step Deployment

### 1️⃣ Deploy Backend First

1. Create new app in cranL
2. Name: `diwan-backend`
3. Type: **Backend / Web Service**
4. Repository: `SaifAlotaibie/Diwan-Hackathon`
5. Branch: `main`
6. Build Path: `webrtc-meeting-app/backend` ← **NO** leading `/`
7. Environment Variables:
   - Key: `OPENAI_API_KEY`
   - Value: `[Your OpenAI API Key]`
8. Deploy!
9. **📋 Copy the backend URL** (e.g., `https://diwan-backend-xxx.cranl.net`)

### 2️⃣ Deploy WebRTC Frontend

1. Create new app in cranL
2. Name: `diwan-webrtc-frontend`
3. Type: **Static Site / Frontend**
4. Repository: `SaifAlotaibie/Diwan-Hackathon`
5. Branch: `main`
6. Build Path: `webrtc-meeting-app/frontend` ← **NO** leading `/`
7. Environment Variables:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://diwan-backend-xxx.cranl.net` ← **Use backend URL from step 1**
8. Deploy!
9. **📋 Copy the WebRTC frontend URL** (e.g., `https://diwan-webrtc-xxx.cranl.net`)

### 3️⃣ Update and Deploy Static Site

**قبل الـ deployment:**

1. افتح ملف: `hackathon-site/maeen-sessions.html`
2. حدث السطر:
   ```html
   <!-- من: -->
   <iframe src="http://localhost:5173" ...>
   
   <!-- إلى: -->
   <iframe src="https://diwan-webrtc-xxx.cranl.net" ...>
   ```
3. احفظ التغيير و push للـ repository

**ثم Deploy:**

1. Create new app in cranL
2. Name: `diwan-static-site`
3. Type: **Static Site**
4. Repository: `SaifAlotaibie/Diwan-Hackathon`
5. Branch: `main`
6. Build Path: `hackathon-site` ← **NO** leading `/`
7. No environment variables needed
8. Deploy!

---

## ✅ Testing

### Backend Test
```bash
curl https://your-backend-url.cranl.net/health
```
Expected: `{"status":"ok","timestamp":"..."}`

### Frontend Test
Open: `https://your-frontend-url.cranl.net`
- Should see Diwan portal homepage
- Navigate to "الخدمات الإلكترونية" → "خدمة الجلسات القضائية الإلكترونية"
- WebRTC meeting should work

---

## 🔍 Troubleshooting

### Backend Returns 502
- Check Runtime Logs in cranL (not Build Logs!)
- Verify `OPENAI_API_KEY` is set
- Verify Build Path is `webrtc-meeting-app/backend` (no leading `/`)
- Check that `npm start` command works

### Frontend Can't Connect to Backend
- Check browser console for errors
- Verify `VITE_API_BASE_URL` points to correct backend URL
- Make sure backend is running first
- Check CORS settings (backend allows all origins: `*`)

### Socket.IO Connection Issues
- Frontend must use WebSocket: `wss://`
- Backend allows both websocket and polling transports
- Check browser console for connection errors

---

## 🎯 Quick Reference

| Component | Build Path | Env Variable | Value |
|-----------|-----------|--------------|-------|
| **Backend** | `webrtc-meeting-app/backend` | `OPENAI_API_KEY` | `sk-proj-xxx...` |
| **WebRTC Frontend** | `webrtc-meeting-app/frontend` | `VITE_API_BASE_URL` | `https://[backend-url]` |
| **Static Site** | `hackathon-site` | - | - |

**⚠️ Deployment Order:**
1. Backend FIRST
2. WebRTC Frontend SECOND (needs backend URL)
3. Static Site LAST (needs WebRTC frontend URL in iframe)

---

## 📌 Important Notes

1. **Deployment Order:** Backend → WebRTC Frontend → Static Site
2. **NO leading `/`** in Build Paths
3. **DO NOT** set `PORT` variable - cranL manages this automatically
4. WebRTC Frontend **MUST** have backend URL in `VITE_API_BASE_URL`
5. Static Site iframe **MUST** point to deployed WebRTC Frontend URL
6. All changes to `.env` or iframe URLs require **redeploy** to take effect

### رحلة المستخدم بعد الـ Deployment:
```
https://diwan-static-xxx.cranl.net/services.html
  ↓ (اضغط منصة معين)
https://diwan-static-xxx.cranl.net/moen.html
  ↓ (اضغط الجلسات القضائية)
https://diwan-static-xxx.cranl.net/maeen-sessions.html
  ↓ (iframe يحمل)
https://diwan-webrtc-xxx.cranl.net (WebRTC App)
  ↓ (يتصل بـ)
https://diwan-backend-xxx.cranl.net (Backend API)
```

---

## 🔐 Security

- Never commit `.env` files
- Never commit API keys
- Use environment variables for all secrets
- `.gitignore` already configured correctly

---

✅ **Ready to deploy!**
