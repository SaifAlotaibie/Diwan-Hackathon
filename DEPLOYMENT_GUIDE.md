# 🚀 Diwan Hackathon - Deployment Guide

## 📦 Project Structure

```
Diwan-Hackathon/
├── hackathon-site/bog-frontend/    ← Frontend (Deploy this)
└── webrtc-meeting-app/backend/     ← Backend (Deploy this)
```

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

## 🎨 Frontend Deployment (cranL)

### Build Path
```
hackathon-site/bog-frontend
```

### Environment Variables
```
VITE_API_BASE_URL=https://your-backend-domain.cranl.net
```

**⚠️ IMPORTANT:** Replace `your-backend-domain.cranl.net` with your actual backend URL from cranL!

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
9. **Copy the backend URL** (e.g., `https://diwan-backend-xxx.cranl.net`)

### 2️⃣ Deploy Frontend

1. Create new app in cranL
2. Name: `diwan-frontend`
3. Type: **Static Site / Frontend**
4. Repository: `SaifAlotaibie/Diwan-Hackathon`
5. Branch: `main`
6. Build Path: `hackathon-site/bog-frontend` ← **NO** leading `/`
7. Environment Variables:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://diwan-backend-xxx.cranl.net` ← **Use your actual backend URL from step 1**
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
| **Frontend** | `hackathon-site/bog-frontend` | `VITE_API_BASE_URL` | `https://[backend-url]` |

---

## 📌 Important Notes

1. **Deploy Backend FIRST**, then Frontend
2. **NO leading `/`** in Build Paths
3. **DO NOT** set `PORT` variable - cranL manages this automatically
4. Frontend **MUST** have backend URL in `VITE_API_BASE_URL`
5. All changes to `.env` require **redeploy** to take effect

---

## 🔐 Security

- Never commit `.env` files
- Never commit API keys
- Use environment variables for all secrets
- `.gitignore` already configured correctly

---

✅ **Ready to deploy!**
