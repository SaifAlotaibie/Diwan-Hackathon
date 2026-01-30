# 🏗️ Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    WebRTC P2P Connection                     │
│                                                              │
│   ┌──────────────┐                      ┌──────────────┐   │
│   │  Browser 1   │◄────────────────────►│  Browser 2   │   │
│   │              │   Direct Media Path   │              │   │
│   │  (React App) │      Audio/Video      │  (React App) │   │
│   └───────┬──────┘                      └──────┬───────┘   │
│           │                                     │            │
└───────────┼─────────────────────────────────────┼───────────┘
            │                                     │
            │         Signaling Only              │
            │     (Socket.IO for setup)           │
            └──────────────┬──────────────────────┘
                           │
                  ┌────────▼─────────┐
                  │   Backend Server │
                  │   (Node.js)      │
                  │                  │
                  │  • Socket.IO     │
                  │  • Express REST  │
                  │  • File Upload   │
                  └────────┬─────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
         ┌──────▼──────┐      ┌──────▼──────┐
         │   Whisper   │      │   Ollama    │
         │   (Python)  │      │   (LLM)     │
         │             │      │             │
         │  • STT      │      │  • Summary  │
         │  • Local    │      │  • Analysis │
         └─────────────┘      └─────────────┘
```

## Data Flow

### 1. Meeting Setup
```
Browser 1                Backend              Browser 2
   │                        │                     │
   ├──join-room(roomId)────►│                     │
   │                        ├──room-ok───────────►│
   │◄──user-joined──────────┤                     │
   │                        │                     │
```

### 2. WebRTC Negotiation
```
Browser 1                Backend              Browser 2
   │                        │                     │
   ├──offer────────────────►│────offer───────────►│
   │                        │                     │
   │◄──answer────────────────┤◄──answer───────────┤
   │                        │                     │
   ├──ICE candidate────────►│──ICE candidate─────►│
   │◄──ICE candidate────────┤◄──ICE candidate────┤
   │                        │                     │
```

### 3. Direct P2P Media
```
Browser 1 ◄══════════════════════════════════► Browser 2
          Direct RTP/RTCP (Audio/Video)
          No server involvement!
```

### 4. Meeting End & Analysis
```
Browser 1                Backend              AI Services
   │                        │                     │
   ├──upload-audio(blob)───►│                     │
   │                        ├──transcribe─────────►Whisper
   │                        │◄──text──────────────┤
   │                        │                     │
   │                        ├──analyze────────────►Ollama
   │                        │◄──summary───────────┤
   │                        │                     │
   │◄──analysis results─────┤                     │
   │                        │                     │
```

## Components

### Frontend (React)

**App.jsx**
- Main application component
- Lobby screen (room join)
- Results screen (analysis display)

**WebRTC.jsx**
- WebRTC connection logic
- Media stream handling
- Recording management
- Socket.IO integration

**index.css**
- Responsive styling
- Mobile-friendly UI

### Backend (Node.js)

**server.js**
- Express HTTP server
- Socket.IO signaling
- REST API endpoints
- File upload handling

**ai.js**
- Whisper integration (STT)
- Ollama integration (LLM)
- Audio file processing

## Key Technologies

### WebRTC APIs Used
- `getUserMedia()` - Access camera/mic
- `RTCPeerConnection` - P2P connection
- `MediaRecorder` - Audio recording
- ICE/STUN - NAT traversal

### Socket.IO Events
- `join-room` - Join a room
- `offer` - WebRTC offer
- `answer` - WebRTC answer
- `ice-candidate` - ICE candidates
- `user-joined` - Peer joined
- `user-left` - Peer left

### REST Endpoints
- `POST /upload-audio` - Upload recorded audio
- `POST /analyze` - Transcribe & analyze
- `GET /health` - Health check
- `GET /rooms` - Active rooms

## Security Model

### What's Local
✅ All media (video/audio) - P2P between browsers  
✅ Audio files - Stored temporarily on server  
✅ Whisper STT - Runs locally  
✅ Ollama LLM - Runs locally  

### What's Not Local
⚠️ STUN servers - Google servers (only for NAT info)  
⚠️ Signaling - Through local server  

### Data Privacy
- No data sent to cloud
- Audio files deleted after processing
- Everything runs on localhost

## Performance Considerations

### Optimization Points
- Video quality: Auto-negotiated by WebRTC
- Audio recording: WebM format (compressed)
- Whisper: Using "base" model (fastest)
- Ollama: Limited to 500 tokens (fast response)

### Resource Usage
- CPU: Moderate (Whisper + Ollama)
- RAM: ~2GB (Node + Python + Models)
- Network: Minimal (only P2P video)
- Disk: Minimal (temp audio files)

## Scalability

### Current Limitations
- ❌ Only 2 participants
- ❌ One room at a time (for AI processing)
- ❌ No persistent storage

### Why These Limits?
- Hackathon MVP scope
- P2P architecture (2 peers only)
- Local AI processing (sequential)
- Simplicity over features

## Testing Strategy

### Unit Testing
- Socket.IO events
- WebRTC connection states
- File upload/download

### Integration Testing
- Full call flow (join → talk → end)
- AI pipeline (record → transcribe → analyze)

### Device Testing
- Desktop: Chrome, Firefox, Edge
- Mobile: Safari iOS, Chrome Android
- Cross-platform: PC ↔ Mobile

---

Built with ❤️ for hackathon
