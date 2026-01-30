# ⚡ QUICK START - 3 Minutes Setup

## 🎯 Prerequisites (Install Once)

1. **Node.js**: https://nodejs.org/
2. **Python 3.8+**: https://python.org/
3. **Ollama**: https://ollama.ai/download
4. **faster-whisper**: `pip install faster-whisper`
5. **llama2 model**: `ollama pull llama2`

---

## 🚀 Run the App (Every Time)

### Option 1: PowerShell Script (Windows)

```powershell
# From webrtc-meeting-app/ directory:
.\start.ps1
```

### Option 2: Manual (3 Terminals)

**Terminal 1:**
```bash
ollama serve
```

**Terminal 2:**
```bash
cd backend
npm install  # First time only
npm start
```

**Terminal 3:**
```bash
cd frontend
npm install  # First time only
npm run dev
```

---

## 🧪 Test It

1. Open: `http://localhost:5173`
2. Open another tab: `http://localhost:5173`
3. Both:
   - Name: `User1` / `User2`
   - Room: `test123`
   - Click "Join Room"
4. Allow camera/mic
5. Talk for 10-20 seconds
6. Click "End & Analyze"
7. Wait for AI analysis

---

## 📱 Test on Mobile

1. Find PC IP: `ipconfig` → Look for IPv4 (e.g., 192.168.1.100)
2. Mobile browser: `http://192.168.1.100:5173`
3. PC browser: `http://localhost:5173`
4. Same room ID on both

---

## ✅ Expected Result

- See 2 video streams
- Hear audio from both sides
- After ending: transcription + summary

---

## 🆘 Not Working?

### Check Services Running:
```bash
# Ollama
ollama list

# Backend
# Should see: "🚀 WebRTC Meeting Server Running"

# Frontend  
# Should see: "Local: http://localhost:5173/"
```

### Check Browser Console (F12)
Look for WebRTC/Socket errors

---

That's it! 🎉
