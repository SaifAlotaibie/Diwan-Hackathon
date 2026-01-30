# WebRTC 1-to-1 Meeting App with Local AI

A simple peer-to-peer video meeting application with local AI-powered transcription and analysis.

## 🎯 Features

- ✅ 1-to-1 video calling
- ✅ Real-time audio/video (WebRTC P2P)
- ✅ Camera/Microphone controls
- ✅ Local audio recording per participant
- ✅ AI transcription (Whisper)
- ✅ Meeting summary & key points (Local LLM)
- ✅ Speaker identification

## 🏗️ Architecture

```
┌─────────────┐         ┌─────────────┐
│  Browser 1  │◄───────►│  Browser 2  │
│ (React App) │   P2P   │ (React App) │
└──────┬──────┘ WebRTC  └──────┬──────┘
       │                        │
       │      Signaling         │
       └────►┌──────────┐◄──────┘
             │ Socket.IO│
             │  Server  │
             └────┬─────┘
                  │
             ┌────▼─────┐
             │ Backend  │
             │ (Node.js)│
             └────┬─────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼────┐      ┌─────▼────┐
    │ Whisper │      │  Ollama  │
    │  (STT)  │      │  (LLM)   │
    └─────────┘      └──────────┘
```

## 📋 Prerequisites

1. **Node.js** (v18+)
   ```bash
   node --version
   ```

2. **Python 3.8+** (for Whisper)
   ```bash
   python --version
   ```

3. **Ollama** (for local LLM)
   - Download: https://ollama.ai/download
   - Install llama2:
   ```bash
   ollama pull llama2
   ```

4. **Whisper.cpp** or **faster-whisper**
   ```bash
   pip install faster-whisper
   ```

## 🚀 Quick Start

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
Server runs on: `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
App runs on: `http://localhost:5173`

### 3. Start Ollama (Terminal 3)
```bash
ollama serve
```

## 🧪 Testing

### Desktop Testing
1. Open `http://localhost:5173` in Chrome
2. Open another tab: `http://localhost:5173`
3. Enter same room ID in both
4. Click "Join Room"

### Mobile Testing (Same Network)
1. Find your PC's local IP:
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```
2. On mobile browser: `http://YOUR_IP:5173`
3. On PC browser: `http://localhost:5173`
4. Use same room ID

## 📱 Usage Flow

1. **Join Room**
   - Enter room ID (e.g., "room123")
   - Click "Join Room"
   - Allow camera/microphone access

2. **During Call**
   - Toggle camera on/off
   - Toggle microphone on/off
   - Chat with peer

3. **End Meeting**
   - Click "End Meeting"
   - Audio automatically uploaded
   - Wait for AI analysis

4. **View Results**
   - Transcription per speaker
   - Meeting summary
   - Key points

## 🔧 Troubleshooting

### Camera/Mic not working
- Check browser permissions
- Use HTTPS or localhost only
- Restart browser

### Peer connection fails
- Check firewall settings
- Verify STUN server accessibility
- Check console for errors

### AI processing fails
- Ensure Ollama is running: `ollama list`
- Verify faster-whisper: `pip list | grep faster-whisper`
- Check backend logs

## 📂 Project Structure

```
webrtc-meeting-app/
├── frontend/           # React + Vite app
│   ├── src/
│   │   ├── App.jsx    # Main component
│   │   ├── WebRTC.jsx # WebRTC logic
│   │   └── main.jsx
│   └── package.json
├── backend/            # Node.js server
│   ├── server.js      # Express + Socket.IO
│   ├── ai.js          # Whisper + LLM
│   └── package.json
└── README.md
```

## 🎨 UI Features

- Clean, minimal interface
- Real-time connection status
- Audio level indicators
- Participant badges
- Meeting analytics display

## 🔒 Security Notes

- **Local only** - no data sent to cloud
- WebRTC P2P - direct browser connection
- Audio files stored temporarily
- STUN servers used only for NAT traversal

## 📝 API Endpoints

### WebSocket (Socket.IO)
- `join-room` - Join a meeting room
- `offer` - Send WebRTC offer
- `answer` - Send WebRTC answer
- `ice-candidate` - Exchange ICE candidates

### REST API
- `POST /upload-audio` - Upload recorded audio
- `POST /analyze` - Process meeting data

## 🚧 Limitations

- Maximum 2 participants per room
- No chat feature
- No screen sharing
- No recording playback
- Requires modern browser with WebRTC support

## 📊 Browser Compatibility

✅ Chrome/Edge 90+  
✅ Firefox 88+  
✅ Safari 15+  
✅ Mobile browsers (iOS Safari, Chrome Android)

## 🔄 Future Enhancements (Out of Scope)

- ❌ Multi-party calls
- ❌ Screen sharing
- ❌ Chat
- ❌ Recording playback
- ❌ Cloud deployment

## 📞 Support

For issues:
1. Check browser console
2. Verify all services running
3. Test with simple room ID
4. Check network connectivity

---

**Built for Hackathon** | **MVP Version** | **Local AI Powered** 🚀
