const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { SESSION_RULES, validateArabicName, validateNationalId, validateMobile } = require('./session-rules');
// const { transcribeAudio, analyzeTranscript } = require('./ai'); // Disabled for now

const verificationCodes = new Map();
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Store active rooms
const rooms = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id);

  socket.on('join-room', (roomId) => {
    console.log(`📞 ${socket.id} joining room: ${roomId}`);
    
    // Check if room exists
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    
    const room = rooms.get(roomId);
    
    const MAX_PARTICIPANTS = 10;
    if (room.size >= MAX_PARTICIPANTS) {
      socket.emit('room-full');
      console.log(`❌ Room ${roomId} is full`);
      return;
    }
    
    socket.join(roomId);
    room.add(socket.id);
    socket.roomId = roomId;
    
    // Notify others in room
    socket.to(roomId).emit('user-joined', socket.id);
    
    // Send current room participants
    socket.emit('room-users', Array.from(room));
    
    console.log(`✅ ${socket.id} joined ${roomId}. Total: ${room.size}`);
  });

  socket.on('offer', ({ offer, roomId }) => {
    console.log(`📤 Offer from ${socket.id} in ${roomId}`);
    socket.to(roomId).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ answer, roomId }) => {
    console.log(`📥 Answer from ${socket.id} in ${roomId}`);
    socket.to(roomId).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, roomId }) => {
    console.log(`🧊 ICE candidate from ${socket.id}`);
    socket.to(roomId).emit('ice-candidate', { candidate, from: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('👋 Client disconnected:', socket.id);
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.delete(socket.id);
        io.to(socket.roomId).emit('user-left', socket.id);
        
        if (room.size === 0) {
          rooms.delete(socket.roomId);
          console.log(`🗑️  Room ${socket.roomId} deleted`);
        }
      }
    }
  });
});

// REST API Endpoints

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// شروط الجلسات المرئية القضائية — للواجهة والذكاء الاصطناعي/تدريب النماذج
app.get('/session-rules', (req, res) => {
  res.json(SESSION_RULES);
});

// التحقق من صحة بيانات الدخول (اسم عربي، هوية، جوال)
app.post('/validate-join', (req, res) => {
  const { fullName, nationalId, mobile } = req.body || {};
  const nameResult = validateArabicName(fullName);
  const idResult = validateNationalId(nationalId);
  const mobileResult = validateMobile(mobile);
  const valid = nameResult.valid && idResult.valid && mobileResult.valid;
  res.json({
    valid,
    fullName: nameResult,
    nationalId: idResult,
    mobile: mobileResult
  });
});

// إرسال رمز التحقق (محاكاة — للإنتاج ربط خدمة SMS حقيقية)
app.post('/send-verification-code', (req, res) => {
  const { mobile } = req.body || {};
  const mobileResult = validateMobile(mobile);
  if (!mobileResult.valid) {
    return res.status(400).json({ success: false, message: mobileResult.message });
  }
  const code = generateCode();
  const key = mobile.replace(/\D/g, '');
  verificationCodes.set(key, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  console.log(`[SMS Mock] رمز التحقق لـ ${key}: ${code}`);
  res.json({ success: true, message: 'تم إرسال رمز التحقق إلى جوالك (محاكاة)' });
});

// التحقق من رمز SMS
app.post('/verify-code', (req, res) => {
  const { mobile, code } = req.body || {};
  const key = (mobile || '').replace(/\D/g, '');
  const stored = verificationCodes.get(key);
  if (!stored) {
    return res.status(400).json({ success: false, message: 'لم يتم إرسال رمز لهذا الرقم أو انتهت صلاحية الطلب' });
  }
  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(key);
    return res.status(400).json({ success: false, message: 'انتهت صلاحية رمز التحقق' });
  }
  if (String(code).trim() !== stored.code) {
    return res.status(400).json({ success: false, message: 'رمز التحقق غير صحيح' });
  }
  verificationCodes.delete(key);
  res.json({ success: true, message: 'تم التحقق بنجاح' });
});

// Upload audio file
app.post('/upload-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const { participantId, roomId } = req.body;
    
    console.log(`🎙️  Audio uploaded: ${req.file.filename} from ${participantId}`);
    
    res.json({
      success: true,
      filename: req.file.filename,
      path: req.file.path,
      participantId,
      roomId
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze meeting (transcribe + summarize)
app.post('/analyze', async (req, res) => {
  try {
    const { audioFiles } = req.body; // Array of {path, participantId}
    
    console.log(`🤖 Analyzing ${audioFiles.length} audio files...`);
    
    // Transcribe each audio file
    const transcriptions = [];
    
    for (const audioFile of audioFiles) {
      console.log(`📝 Transcribing ${audioFile.participantId}...`);
      
      try {
        // const transcript = await transcribeAudio(audioFile.path);
        const transcript = `[محاكاة] نص محاضر الجلسة من ${audioFile.participantId}`;
        transcriptions.push({
          participantId: audioFile.participantId,
          text: transcript
        });
        console.log(`✅ Transcribed ${audioFile.participantId}`);
      } catch (error) {
        console.error(`❌ Transcription failed for ${audioFile.participantId}:`, error.message);
        transcriptions.push({
          participantId: audioFile.participantId,
          text: `[Transcription failed: ${error.message}]`
        });
      }
    }
    
    // Generate summary and key points
    console.log('🧠 Generating meeting summary...');
    let analysis = null;
    
    try {
      // analysis = await analyzeTranscript(transcriptions);
      analysis = {
        summary: 'ملخص الجلسة القضائية: تمت مناقشة القضية بحضور الأطراف وتم الاستماع للمرافعات',
        keyPoints: transcriptions.map(t => ({
          participant: t.participantId,
          points: ['تم تسجيل الحضور', 'المشاركة في الجلسة']
        }))
      };
      console.log('✅ Analysis complete');
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      analysis = {
        summary: 'Analysis unavailable - LLM service error',
        keyPoints: transcriptions.map(t => ({
          participant: t.participantId,
          points: ['Transcription available but analysis failed']
        }))
      };
    }
    
    // Cleanup uploaded files
    for (const audioFile of audioFiles) {
      try {
        if (fs.existsSync(audioFile.path)) {
          fs.unlinkSync(audioFile.path);
          console.log(`🗑️  Deleted: ${audioFile.path}`);
        }
      } catch (err) {
        console.error(`⚠️  Could not delete ${audioFile.path}:`, err.message);
      }
    }
    
    res.json({
      success: true,
      transcriptions,
      analysis
    });
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active rooms (for debugging)
app.get('/rooms', (req, res) => {
  const roomList = Array.from(rooms.entries()).map(([roomId, participants]) => ({
    roomId,
    participants: Array.from(participants),
    count: participants.size
  }));
  
  res.json({ rooms: roomList });
});

// Start server on all interfaces (0.0.0.0)
server.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🚀 WebRTC Meeting Server Running      ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  console.log(`📡 Local:   http://localhost:${PORT}`);
  addresses.forEach(addr => {
    console.log(`📱 Network: http://${addr}:${PORT}`);
  });
  console.log('');
  console.log('🔌 Socket.IO ready for connections');
  console.log('');
  console.log('Endpoints:');
  console.log(`  GET  /health          - Health check`);
  console.log(`  GET  /rooms           - Active rooms`);
  console.log(`  POST /upload-audio    - Upload audio`);
  console.log(`  POST /analyze         - Analyze meeting`);
  console.log('');
});
