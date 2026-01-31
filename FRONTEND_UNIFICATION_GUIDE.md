# 🚀 Frontend Unification - Deployment Guide

**Date:** 2026-01-31  
**Status:** ✅ Complete and Pushed

---

## 📋 What Changed

### ✅ Unified Frontend Architecture

**Before:**
- 2 separate frontends (bog-frontend + webrtc-meeting-app/frontend)
- WebRTC served on port 5173
- Portal iframe'd the WebRTC app from `http://192.168.100.3:5173`
- Hardcoded IPs and ports everywhere

**After:**
- 1 unified frontend (bog-frontend only)
- WebRTC is an internal component
- No iframe - renders directly in portal
- All backend communication uses environment variables

---

## 🎯 Key Changes

### 1. WebRTC Component Integration

**New File:** `hackathon-site/bog-frontend/src/components/WebRTCMeeting.jsx`

- Complete WebRTC component copied from standalone app
- Rewritten with Tailwind CSS (matches portal design)
- Uses `import.meta.env.VITE_API_BASE_URL` for backend communication
- No hardcoded URLs

**Updated:** `hackathon-site/bog-frontend/src/pages/MaeenSessions.jsx`

- Removed iframe
- Now renders WebRTCMeeting component internally
- Added join form (room ID, name, role)
- User stays inside portal experience

### 2. Environment Variable Configuration

**Backend URL is now configured via environment variable:**

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
```

**New Files Created:**

1. `.env.development` - Local development
   ```env
   VITE_API_BASE_URL=http://localhost:3001
   ```

2. `.env.production` - Production (placeholder)
   ```env
   VITE_API_BASE_URL=https://your-backend-url.cranl.io
   ```

3. `.env.example` - Template for developers
   ```env
   VITE_API_BASE_URL=your_backend_url_here
   ```

### 3. Dependencies Added

**Portal (bog-frontend) now includes:**
- `socket.io-client` - WebRTC signaling
- `axios` - HTTP requests

**Updated:** `package.json` and `package-lock.json`

### 4. Security Improvements

**Updated:** `.gitignore`
- Added `.env` files to exclusion list
- Prevents accidental commit of environment variables

---

## 📦 Deployment Targets

### Backend Deployment

**Path:** `webrtc-meeting-app/backend`

**Required Environment Variables:**
```env
OPENAI_API_KEY=your_actual_openai_key
```

**Optional (managed by cranL):**
```env
PORT=auto_assigned_by_cranl
NODE_ENV=production
```

**Command:** `npm start`

---

### Frontend Deployment (ONLY THIS ONE)

**Path:** `hackathon-site/bog-frontend`

**Required Environment Variables:**
```env
VITE_API_BASE_URL=https://your-backend-url.cranl.io
```

**Build Command:** `npm run build`  
**Output:** `dist/` folder

**Important:** Update `.env.production` with actual backend URL before deploying

---

## 🔧 Configuration Steps for cranL

### Step 1: Deploy Backend

1. Deploy path: `webrtc-meeting-app/backend`
2. Set environment variable in cranL dashboard:
   - Key: `OPENAI_API_KEY`
   - Value: `[your actual OpenAI API key]`
3. Do NOT set `PORT` (cranL manages automatically)
4. Note the backend URL assigned by cranL (e.g., `https://backend-xyz.cranl.io`)

### Step 2: Deploy Frontend

1. **Before deploying**, update `.env.production`:
   ```env
   VITE_API_BASE_URL=https://backend-xyz.cranl.io
   ```
   *(Replace with actual backend URL from Step 1)*

2. Deploy path: `hackathon-site/bog-frontend`
3. Set environment variable in cranL dashboard:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://backend-xyz.cranl.io`
4. cranL will run `npm run build` and serve `dist/`

---

## ✅ What's Removed

### ❌ No Longer Needed

- `webrtc-meeting-app/frontend` - Standalone frontend (keep code but don't deploy)
- Hardcoded IP: `http://192.168.100.3:5173` (removed)
- `window.location.hostname` logic (removed)
- iframe in MaeenSessions (removed)

---

## 🧪 Testing Locally

### Start Backend

```bash
cd webrtc-meeting-app/backend
npm start
```

Backend runs on `http://localhost:3001`

### Start Frontend Portal

```bash
cd hackathon-site/bog-frontend
npm run dev
```

Portal runs on `http://localhost:8000` (or auto-assigned)

**Access WebRTC:**
1. Navigate to portal
2. Click "الخدمات الإلكترونية"
3. Click "منصة معين الرقمية"
4. Click "خدمة الجلسات القضائية الإلكترونية"
5. Fill in form and join session

---

## 📊 Environment Variable Summary

### Frontend (bog-frontend)

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `VITE_API_BASE_URL` | ✅ YES | Backend API base URL | `https://backend.cranl.io` |

### Backend (webrtc-meeting-app/backend)

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `OPENAI_API_KEY` | ✅ YES | OpenAI API authentication | `sk-proj-...` |
| `PORT` | ⚠️ Auto | Server port (cranL manages) | Auto-assigned |
| `NODE_ENV` | ⚠️ Optional | Environment identifier | `production` |

---

## 🚨 Critical Notes

### ⚠️ BEFORE DEPLOYING FRONTEND

1. **Get backend URL first** from cranL after backend deployment
2. **Update `.env.production`** with actual backend URL
3. **Set `VITE_API_BASE_URL`** in cranL environment variables
4. **Test build locally:** `npm run build` should succeed

### ⚠️ SECURITY

- ❌ **NEVER** commit `.env` files with actual secrets
- ✅ **ALWAYS** use `.env.example` for templates
- ✅ **ALWAYS** set secrets in deployment platform (cranL)
- ❌ **DO NOT** include API keys in source code

### ⚠️ PORT CONFIGURATION

- Backend: Let cranL assign `PORT` automatically
- Frontend: Not applicable (static build)

---

## 🎯 Deployment Checklist

### Backend Deployment

- [ ] Deploy `webrtc-meeting-app/backend` on cranL
- [ ] Set `OPENAI_API_KEY` in cranL environment variables
- [ ] Verify backend starts successfully
- [ ] Test `/health` endpoint returns 200 OK
- [ ] Note the backend URL assigned by cranL

### Frontend Deployment

- [ ] Update `.env.production` with backend URL
- [ ] Test build locally: `npm run build`
- [ ] Deploy `hackathon-site/bog-frontend` on cranL
- [ ] Set `VITE_API_BASE_URL` in cranL environment variables
- [ ] Verify frontend loads correctly
- [ ] Test WebRTC session join flow
- [ ] Verify backend connectivity
- [ ] Test camera/microphone permissions
- [ ] Test session creation and termination

---

## 🔍 Verification Steps

### After Deployment

1. **Frontend loads:**
   - Navigate to portal URL
   - All pages load without errors

2. **WebRTC integration works:**
   - Navigate to Maeen Services → Sessions
   - Join form appears
   - Fill form and join session
   - Camera/mic permissions prompt appears

3. **Backend connectivity:**
   - Check browser console for WebSocket connection
   - Should see: `🔌 Socket connected`
   - Should see: `📡 Backend URL: https://...`

4. **Session functionality:**
   - Video streams work
   - Audio recording works
   - Session can be ended
   - Report generation works

---

## 📝 File Structure After Changes

```
hackathon-site/bog-frontend/
├── src/
│   ├── components/
│   │   ├── WebRTCMeeting.jsx     [NEW - WebRTC component]
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   ├── pages/
│   │   ├── MaeenSessions.jsx     [UPDATED - no iframe]
│   │   ├── Home.jsx
│   │   └── ...
│   └── ...
├── .env.development               [NEW]
├── .env.production                [NEW - update before deploy]
├── .env.example                   [NEW]
├── .gitignore                     [UPDATED - excludes .env]
├── package.json                   [UPDATED - new deps]
└── ...
```

---

## 🎉 Benefits of This Architecture

### ✅ Advantages

1. **Single Deployment:** Only one frontend to deploy and maintain
2. **Unified UX:** User never leaves portal experience
3. **Environment-Based:** Easy to configure for different environments
4. **No Hardcoding:** All URLs configurable via environment variables
5. **Security:** No secrets in source code
6. **Scalability:** Easy to add more services to portal

### ✅ Developer Experience

1. **Clear separation:** Frontend vs Backend
2. **Standard patterns:** Environment variables for configuration
3. **Easy testing:** Local development works out of the box
4. **Git-safe:** No secrets committed accidentally

---

## 🆘 Troubleshooting

### Frontend can't connect to backend

**Symptom:** Console shows connection errors

**Solution:**
1. Check `VITE_API_BASE_URL` is set correctly
2. Verify backend is running and accessible
3. Check CORS settings in backend
4. Ensure backend URL doesn't have trailing slash

### Build fails

**Symptom:** `npm run build` fails

**Solution:**
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install`
3. Run `npm run build` again

### WebRTC doesn't load

**Symptom:** Maeen Sessions page is blank

**Solution:**
1. Check browser console for errors
2. Verify `WebRTCMeeting.jsx` exists in `src/components/`
3. Verify import statement in `MaeenSessions.jsx`

---

## 📞 Support

If issues persist:
1. Check browser console for errors
2. Check network tab for failed requests
3. Verify all environment variables are set
4. Test locally first before deploying

---

**End of Guide**
