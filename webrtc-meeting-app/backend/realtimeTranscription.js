/**
 * OpenAI Realtime Speech-to-Text Handler
 * 
 * FEATURES:
 * - Streaming audio input
 * - Real-time transcription
 * - Arabic language optimized
 * - Timestamped segments
 * - Speaker attribution
 * - Memory-only storage (no disk writes)
 * - Immediate cleanup after processing
 */

const WebSocket = require('ws');
const { EventEmitter } = require('events');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * In-memory storage for active sessions
 * Structure: Map<sessionId, SessionTranscripts>
 */
const activeTranscripts = new Map();

/**
 * Session Transcript Storage
 */
class SessionTranscripts {
  constructor(sessionId, sessionMetadata) {
    this.sessionId = sessionId;
    this.sessionMetadata = sessionMetadata;
    this.segments = []; // Array of {timestamp, speaker, role, text, duration}
    this.startTime = new Date();
    this.activeSpeaker = null; // Current speaker info
  }

  addSegment(speaker, role, text) {
    const timestamp = new Date();
    const segment = {
      timestamp: timestamp.toISOString(),
      offset_ms: timestamp - this.startTime,
      speaker: speaker,
      role: role,
      text: text.trim(),
      duration: 0 // Will be calculated later
    };
    
    // Calculate duration from previous segment
    if (this.segments.length > 0 && this.segments[this.segments.length - 1].speaker === speaker) {
      const prevSegment = this.segments[this.segments.length - 1];
      prevSegment.duration = Math.floor((timestamp - new Date(prevSegment.timestamp)) / 1000);
    }
    
    this.segments.push(segment);
    console.log(`📝 Added segment from ${speaker}: "${text.substring(0, 50)}..."`);
  }

  setActiveSpeaker(speaker, role) {
    this.activeSpeaker = { speaker, role };
    console.log(`🎤 Active speaker: ${speaker} (${role})`);
  }

  getSegments() {
    return this.segments;
  }

  clear() {
    console.log(`🗑️ Clearing ${this.segments.length} segments from memory`);
    this.segments = [];
    this.activeSpeaker = null;
  }
}

/**
 * OpenAI Realtime Transcription Client
 */
class RealtimeTranscriptionClient extends EventEmitter {
  constructor(sessionId, participantId, role) {
    super();
    this.sessionId = sessionId;
    this.participantId = participantId;
    this.role = role;
    this.ws = null;
    this.connected = false;
    this.buffer = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log(`🔌 Connecting to OpenAI Realtime API for ${this.participantId}`);
      
      // OpenAI Realtime API WebSocket endpoint
      const wsUrl = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';
      
      this.ws = new WebSocket(wsUrl, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      });

      this.ws.on('open', () => {
        console.log(`✅ Connected to OpenAI Realtime for ${this.participantId}`);
        this.connected = true;
        
        // Configure session for Arabic STT
        this.ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'You are a speech-to-text system. Transcribe Arabic speech accurately with timestamps.',
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1',
              language: 'ar'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            }
          }
        }));
        
        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(JSON.parse(data.toString()));
      });

      this.ws.on('error', (error) => {
        console.error(`❌ WebSocket error for ${this.participantId}:`, error.message);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log(`🔌 Disconnected from OpenAI Realtime for ${this.participantId}`);
        this.connected = false;
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case 'session.created':
        console.log(`📋 Session created for ${this.participantId}`);
        break;

      case 'session.updated':
        console.log(`📋 Session updated for ${this.participantId}`);
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // Transcription completed
        const transcript = message.transcript;
        console.log(`📝 Transcription from ${this.participantId}: "${transcript}"`);
        
        // Emit transcript event
        this.emit('transcript', {
          participantId: this.participantId,
          role: this.role,
          text: transcript,
          timestamp: new Date().toISOString()
        });
        break;

      case 'conversation.item.input_audio_transcription.failed':
        console.error(`❌ Transcription failed for ${this.participantId}:`, message.error);
        break;

      case 'error':
        console.error(`❌ OpenAI error for ${this.participantId}:`, message.error);
        break;

      default:
        // Ignore other message types
        break;
    }
  }

  sendAudio(audioData) {
    if (!this.connected || !this.ws) {
      console.warn(`⚠️ Not connected, buffering audio for ${this.participantId}`);
      this.buffer.push(audioData);
      return;
    }

    // Send buffered audio first
    if (this.buffer.length > 0) {
      console.log(`📤 Sending ${this.buffer.length} buffered chunks for ${this.participantId}`);
      this.buffer.forEach(chunk => this.sendAudioChunk(chunk));
      this.buffer = [];
    }

    // Send current audio
    this.sendAudioChunk(audioData);
  }

  sendAudioChunk(audioData) {
    try {
      // Convert to base64 if it's a Buffer
      const base64Audio = Buffer.isBuffer(audioData) 
        ? audioData.toString('base64')
        : audioData;

      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio
      }));

      // Commit the audio buffer to trigger transcription
      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer.commit'
      }));
    } catch (error) {
      console.error(`❌ Error sending audio for ${this.participantId}:`, error.message);
    }
  }

  disconnect() {
    if (this.ws) {
      console.log(`🔌 Disconnecting ${this.participantId}`);
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }
}

/**
 * Initialize session transcripts
 */
function initializeSessionTranscripts(sessionId, sessionMetadata) {
  if (!activeTranscripts.has(sessionId)) {
    const transcripts = new SessionTranscripts(sessionId, sessionMetadata);
    activeTranscripts.set(sessionId, transcripts);
    console.log(`📋 Initialized transcripts for session: ${sessionId}`);
    return transcripts;
  }
  return activeTranscripts.get(sessionId);
}

/**
 * Get session transcripts
 */
function getSessionTranscripts(sessionId) {
  return activeTranscripts.get(sessionId);
}

/**
 * Update active speaker
 */
function updateActiveSpeaker(sessionId, speaker, role) {
  const transcripts = activeTranscripts.get(sessionId);
  if (transcripts) {
    transcripts.setActiveSpeaker(speaker, role);
  }
}

/**
 * Add transcript segment
 */
function addTranscriptSegment(sessionId, speaker, role, text) {
  const transcripts = activeTranscripts.get(sessionId);
  if (transcripts) {
    transcripts.addSegment(speaker, role, text);
  } else {
    console.warn(`⚠️ No session found for ${sessionId}`);
  }
}

/**
 * Generate detailed speech log from in-memory segments
 */
function generateDetailedSpeechLog(sessionId) {
  const transcripts = activeTranscripts.get(sessionId);
  if (!transcripts) {
    console.warn(`⚠️ No transcripts found for session: ${sessionId}`);
    return [];
  }

  const segments = transcripts.getSegments();
  console.log(`📊 Generating speech log from ${segments.length} segments`);

  // Filter out very short segments (less than 3 words)
  const filteredSegments = segments.filter(seg => {
    const wordCount = seg.text.trim().split(/\s+/).length;
    return wordCount >= 3;
  });

  console.log(`✅ Filtered to ${filteredSegments.length} substantial segments`);
  return filteredSegments;
}

/**
 * Clear session transcripts from memory
 */
function clearSessionTranscripts(sessionId) {
  const transcripts = activeTranscripts.get(sessionId);
  if (transcripts) {
    transcripts.clear();
    activeTranscripts.delete(sessionId);
    console.log(`🗑️ Cleared transcripts for session: ${sessionId}`);
  }
}

/**
 * Get all active sessions
 */
function getActiveSessions() {
  return Array.from(activeTranscripts.keys());
}

module.exports = {
  RealtimeTranscriptionClient,
  initializeSessionTranscripts,
  getSessionTranscripts,
  updateActiveSpeaker,
  addTranscriptSegment,
  generateDetailedSpeechLog,
  clearSessionTranscripts,
  getActiveSessions
};
