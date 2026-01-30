# 🚀 Setup Guide - WebRTC Meeting App

## Step-by-Step Installation

### 1️⃣ Install Prerequisites

#### Node.js (Required)
```bash
# Check if installed
node --version

# If not installed, download from:
# https://nodejs.org/ (LTS version)
```

#### Python (Required for Whisper)
```bash
# Check if installed
python --version

# Must be 3.8 or higher
```

#### Ollama (Required for LLM)
```bash
# Download and install from:
# https://ollama.ai/download

# After installation, pull the model:
ollama pull llama2

# Verify:
ollama list
```

#### faster-whisper (Required for STT)
```bash
pip install faster-whisper
```

---

### 2️⃣ Install Project Dependencies

**Terminal 1 - Backend:**
```bash
cd webrtc-meeting-app/backend
npm install
```

**Terminal 2 - Frontend:**
```bash
cd webrtc-meeting-app/frontend
npm install
```

---

### 3️⃣ Start All Services

You need **3 terminals**:

#### Terminal 1 - Ollama Server
```bash
ollama serve
```
Keep this running. You should see: `Ollama is running`

#### Terminal 2 - Backend Server
```bash
cd webrtc-meeting-app/backend
npm start
```
You should see: `🚀 WebRTC Meeting Server Running`

#### Terminal 3 - Frontend Dev Server
```bash
cd webrtc-meeting-app/frontend
npm run dev
```
You should see: `Local: http://localhost:5173/`

---

### 4️⃣ Test the Application

#### Desktop Testing (Same PC)
1. Open Chrome: `http://localhost:5173`
2. Open another Chrome tab/window: `http://localhost:5173`
3. Both tabs:
   - Enter your name
   - Enter same room ID (e.g., `room123`)
   - Click "Join Room"
4. Allow camera/microphone access
5. You should see yourself and the other tab

#### Mobile Testing (Same WiFi Network)
1. Find your PC's local IP address:
   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   
   # Mac/Linux
   ifconfig
   # Look for "inet" address
   ```

2. On mobile browser:
   - Open: `http://YOUR_IP:5173` (e.g., `http://192.168.1.100:5173`)
   - Enter name and room ID

3. On PC browser:
   - Open: `http://localhost:5173`
   - Enter same room ID

4. Both should connect!

---

### 5️⃣ Using the App

1. **Join Room**
   - Enter your name
   - Enter a room ID (any text, e.g., "meeting123")
   - Click "Join Room"
   - Allow camera/mic when prompted

2. **During Meeting**
   - See yourself and peer
   - Toggle camera on/off
   - Toggle microphone on/off
   - Audio is being recorded automatically

3. **End Meeting**
   - Click "End & Analyze"
   - Wait for AI processing (30-60 seconds)
   - View transcription and summary

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Change ports in:
# - backend/server.js (change PORT = 3001)
# - frontend/src/WebRTC.jsx (change SOCKET_SERVER URL)
```

### Ollama Not Found
```bash
# Start Ollama manually
ollama serve

# Check if running
curl http://localhost:11434/api/tags
```

### Whisper Not Found
```bash
# Install faster-whisper
pip install faster-whisper

# Or try alternative:
pip install openai-whisper
```

### Camera/Mic Access Denied
- Check browser settings
- Must use HTTPS or localhost
- Try different browser
- Check Windows privacy settings

### Peer Connection Fails
- Both devices must be on same network (for mobile)
- Check firewall settings
- Verify STUN servers are accessible
- Check browser console for errors

---

## 📋 Requirements Checklist

Before testing, verify:
- [ ] Node.js installed
- [ ] Python 3.8+ installed
- [ ] Ollama installed and running
- [ ] faster-whisper installed
- [ ] Backend dependencies installed (`npm install`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] All 3 services running (Ollama, Backend, Frontend)

---

## 🎯 Testing Checklist

- [ ] Join room from two browsers
- [ ] See both video streams
- [ ] Toggle camera works
- [ ] Toggle microphone works
- [ ] End meeting triggers analysis
- [ ] Transcription appears
- [ ] Summary generated

---

## 📊 Expected Output

After ending meeting, you should see:

```
Meeting Analysis
├── Summary
│   └── Brief description of conversation
├── Transcriptions
│   ├── Participant 1: "Hello, how are you?"
│   └── Participant 2: "I'm good, thanks!"
└── Key Points
    ├── Participant 1
    │   └── • Greeted
    └── Participant 2
        └── • Responded positively
```

---

## 🚨 Common Issues

### "Room is full"
- Only 2 participants allowed
- Leave and rejoin, or use different room ID

### "Could not access camera/microphone"
- Click allow in browser prompt
- Check privacy settings
- Restart browser

### "Analysis failed"
- Verify Ollama is running: `ollama list`
- Check Python installation: `python --version`
- Check backend logs for errors

---

## 🔍 Debugging

### Check Backend Logs
Look for:
- `✅ Audio uploaded`
- `📝 Transcribing...`
- `🧠 Analyzing with Ollama...`
- `✅ Analysis complete`

### Check Browser Console
Press F12 and look for:
- WebRTC connection logs
- Socket.IO events
- Media errors

### Check Ollama
```bash
# Test Ollama API
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "Hello"
}'
```

---

## 🎉 Success Criteria

The app works if:
1. ✅ Both participants see each other's video
2. ✅ Audio is clear on both sides
3. ✅ Camera/mic controls work
4. ✅ After ending, transcription appears
5. ✅ Summary is generated

---

Ready to test! 🚀
