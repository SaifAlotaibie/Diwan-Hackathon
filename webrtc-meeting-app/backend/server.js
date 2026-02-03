console.log("========================================");
console.log("🚀 DIWAN BACKEND STARTING...");
console.log("========================================");
console.log("Node version:", process.version);
console.log("Platform:", process.platform);
console.log("Working directory:", process.cwd());
console.log("========================================");

console.log("🚀 Backend process started");
console.log("📍 Current directory:", __dirname);
console.log("🔑 Environment check:");
console.log("  - NODE_ENV:", process.env.NODE_ENV || "not set");
console.log("  - PORT:", process.env.PORT || "not set (will use 3001)");
console.log("  - OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ SET" : "❌ NOT SET");

// Load environment variables
require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

console.log("✅ Core modules loaded");

const { SESSION_RULES, validateArabicName, validateNationalId, validateMobile } = require('./session-rules');

// Check for required environment variables BEFORE requiring modules that need them
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ CRITICAL: OPENAI_API_KEY is not set in environment variables');
  console.error('   The server will start but AI features (reports, dress code) will not work.');
  console.error('   Please set OPENAI_API_KEY in your deployment environment.');
}

// Session Content Report module (with error handling)
let initializeSessionMetadata, generateSessionContentReport;
try {
  const sessionReport = require('./sessionReport');
  initializeSessionMetadata = sessionReport.initializeSessionMetadata;
  generateSessionContentReport = sessionReport.generateSessionContentReport;
  console.log("✅ Session report module loaded");
} catch (error) {
  console.error("❌ Failed to load session report module:", error.message);
  // Provide dummy functions so server can still start
  initializeSessionMetadata = () => ({});
  generateSessionContentReport = async () => ({ error: "Module not loaded" });
}

// Dress Code Check module (MVP feature, with error handling)
let checkDressCode;
try {
  const dressCodeModule = require('./dressCodeCheck');
  checkDressCode = dressCodeModule.checkDressCode;
  console.log("✅ Dress code module loaded");
} catch (error) {
  console.error("❌ Failed to load dress code module:", error.message);
  // Provide dummy function so server can still start
  checkDressCode = async () => ({ compliant: true });
}

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

// Store active sessions metadata (in-memory for current sessions)
const activeSessions = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id);

  socket.on('join-room', ({ roomId, participantId, role }) => {
    console.log(`📞 ${socket.id} joining room: ${roomId} as ${role || 'participant'}`);
    
    // Check if room exists
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
      
      // Initialize session metadata
      const sessionMetadata = initializeSessionMetadata(roomId, []);
      activeSessions.set(roomId, sessionMetadata);
      console.log(`📋 Session metadata initialized for room: ${roomId}`);
    }
    
    const room = rooms.get(roomId);

    // Many-to-many: NO LIMIT on participants
    socket.join(roomId);

    // Store participant info in room Map
    room.set(socket.id, {
      socketId: socket.id,
      participantId: participantId,
      role: role || 'participant',
      joinedAt: new Date().toISOString()
    });

    socket.roomId = roomId;
    socket.participantId = participantId;
    socket.role = role || 'participant';

    // Add participant to session metadata
    const sessionMetadata = activeSessions.get(roomId);
    if (sessionMetadata) {
      sessionMetadata.participants.push({
        participantId: participantId,
        role: role || 'participant',
        joined_at: new Date().toISOString(),
        socketId: socket.id
      });
    }
    
    // Get list of all participants with their info
    const participants = Array.from(room.values());
    
    // Notify others in room about new participant
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      participantId: participantId,
      role: role || 'participant'
    });
    
    // Send current room participants to new joiner
    socket.emit('room-users', participants);
    
    console.log(`✅ ${socket.id} joined ${roomId}. Total: ${room.size}`);
  });

  socket.on('offer', ({ offer, roomId, to }) => {
    console.log(`📤 Offer from ${socket.id} to ${to} in ${roomId}`);
    socket.to(to).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ answer, roomId, to }) => {
    console.log(`📥 Answer from ${socket.id} to ${to} in ${roomId}`);
    socket.to(to).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, roomId, to }) => {
    console.log(`🧊 ICE candidate from ${socket.id} to ${to}`);
    socket.to(to).emit('ice-candidate', { candidate, from: socket.id });
  });

  // Active speaker detection
  socket.on('active-speaker', ({ roomId, participantId, role }) => {
    socket.to(roomId).emit('active-speaker', {
      socketId: socket.id,
      participantId,
      role
    });
  });

  // Unified session termination
  socket.on('end-session', ({ roomId }) => {
    console.log(`🛑 Session ended by ${socket.id} in room: ${roomId}`);
    
    // Broadcast to ALL participants in the room
    io.to(roomId).emit('session-ended', {
      endedBy: socket.participantId || 'Unknown',
      role: socket.role || 'participant',
      timestamp: new Date().toISOString()
    });
    
    // Clean up room after a short delay (allow clients to process)
    setTimeout(() => {
      const room = rooms.get(roomId);
      if (room) {
        room.clear();
        rooms.delete(roomId);
        console.log(`🗑️ Room ${roomId} cleared after session end`);
      }
    }, 2000);
  });

  // Active speaker detection
  socket.on('active-speaker', ({ roomId, participantId, role }) => {
    socket.to(roomId).emit('active-speaker', {
      socketId: socket.id,
      participantId,
      role
    });
  });

  socket.on('disconnect', () => {
    console.log('👋 Client disconnected:', socket.id);
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.delete(socket.id);
        io.to(socket.roomId).emit('user-left', {
          socketId: socket.id,
          participantId: socket.participantId,
          role: socket.role
        });
        
        if (room.size === 0) {
          rooms.delete(socket.roomId);
          
          // Clean up session metadata when room is empty
          if (activeSessions.has(socket.roomId)) {
            activeSessions.delete(socket.roomId);
            console.log(`🗑️ Session metadata deleted for room: ${socket.roomId}`);
          }
          
          console.log(`🗑️ Room ${socket.roomId} deleted`);
        }
      }
    }
  });
});

// REST API Endpoints

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Diwan WebRTC Backend',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      rooms: 'GET /rooms',
      uploadAudio: 'POST /upload-audio',
      generateReport: 'POST /generate-session-report',
      checkDressCode: 'POST /check-dress-code',
      analyze: 'POST /analyze'
    },
    socketIO: 'ws://[domain]/socket.io',
    timestamp: new Date().toISOString()
  });
});

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

// Generate Session Content Report (NEW FEATURE)
app.post('/generate-session-report', async (req, res) => {
  try {
    const { audioFiles, roomId } = req.body;
    
    console.log('📊 Generating Session Content Report...');
    console.log(`   Room: ${roomId}`);
    console.log(`   Audio files: ${audioFiles.length}`);
    
    // Get session metadata
    let sessionMetadata = activeSessions.get(roomId);
    
    if (!sessionMetadata) {
      // If session not found, create basic metadata
      console.warn(`⚠️ Session metadata not found for room: ${roomId}, creating basic metadata`);
      sessionMetadata = initializeSessionMetadata(roomId, audioFiles.map(f => ({
        participantId: f.participantId,
        role: f.role || 'participant'
      })));
    }
    
    // Generate the report using batch audio files
    const report = await generateSessionContentReport(audioFiles, sessionMetadata);
    
    // Clean up: Delete audio files after processing
    console.log('🗑️ Cleaning up audio files...');
    for (const audioFile of audioFiles) {
      try {
        if (fs.existsSync(audioFile.path)) {
          fs.unlinkSync(audioFile.path);
          console.log(`   ✅ Deleted: ${audioFile.path}`);
        }
      } catch (err) {
        console.error(`   ❌ Failed to delete ${audioFile.path}:`, err.message);
      }
    }
    
    // Clean up session metadata after report generation
    if (activeSessions.has(roomId)) {
      activeSessions.delete(roomId);
      console.log(`🗑️ Session metadata cleaned up for room: ${roomId}`);
    }
    
    res.json({
      success: true,
      report: report
    });
    
  } catch (error) {
    console.error('❌ Session report generation error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Analyze meeting (transcribe + summarize) - LEGACY ENDPOINT
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

// Dress Code Check (MVP Feature - Lawyers Only)
app.post('/check-dress-code', async (req, res) => {
  try {
    const { imageBase64, role } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ 
        success: false,
        error: 'Image data is required' 
      });
    }
    
    if (!role) {
      return res.status(400).json({ 
        success: false,
        error: 'Role is required' 
      });
    }
    
    console.log('👔 Dress code check request received');
    console.log(`   Role: ${role}`);
    
    // Perform dress code check
    const result = await checkDressCode(imageBase64, role);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Dress code check error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
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
const PORT_TO_USE = process.env.PORT || 3001;
console.log(`📡 Attempting to start server on port ${PORT_TO_USE}...`);

server.listen(PORT_TO_USE, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
  
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🚀 WebRTC Meeting Server Running      ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running on port ${PORT_TO_USE}`);
  console.log(`📡 Health check: http://localhost:${PORT_TO_USE}/health`);
  console.log(`🌍 Listening on: 0.0.0.0:${PORT_TO_USE}`);
  console.log('');
  console.log('🔌 Socket.IO ready for connections');
  console.log('');
  console.log('Endpoints:');
  console.log(`  GET  /health                    - Health check`);
  console.log(`  GET  /rooms                     - Active rooms`);
  console.log(`  POST /upload-audio              - Upload audio`);
  console.log(`  POST /generate-session-report   - Generate Session Content Report`);
  console.log(`  POST /check-dress-code          - Dress code check (lawyers only)`);
  console.log(`  POST /analyze                   - Analyze meeting (legacy)`);
  console.log('');
  console.log('✅ Server is ready to accept requests');
});

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

server.on('error', (error) => {
  console.error('❌ Server Error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT_TO_USE} is already in use`);
    process.exit(1);
  }
});

// Keep-alive heartbeat (log every 30 seconds to show server is alive)
setInterval(() => {
  console.log(`💓 Server heartbeat - Running on port ${PORT_TO_USE} - Active connections: ${io.engine.clientsCount}`);
}, 30000);
