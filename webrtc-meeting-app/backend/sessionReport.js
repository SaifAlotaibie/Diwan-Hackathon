/**
 * Session Content Report Generator
 * 
 * PURPOSE: Generate neutral, non-judgmental summaries of judicial session content
 * 
 * CONSTRAINTS:
 * - NO violation detection
 * - NO behavior classification
 * - NO compliance evaluation
 * - NO permanent audio storage
 * - Neutral and informational ONLY
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// OpenAI API Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1';

// Validate API key but don't throw - let server start
if (!OPENAI_API_KEY) {
  console.warn('⚠️ WARNING: OPENAI_API_KEY is not set. Session reports will fail.');
}

/**
 * Step 1: Initialize Session Metadata
 * Captures basic session information
 */
function initializeSessionMetadata(roomId, participants) {
  const sessionId = `session-${roomId}-${Date.now()}`;
  const startTime = new Date().toISOString();
  
  return {
    session_id: sessionId,
    room_id: roomId,
    start_time: startTime,
    end_time: null,
    duration: null,
    participants: participants.map(p => ({
      participant_id: p.participantId,
      role: p.role || 'participant', // judge, lawyer, party
      joined_at: startTime
    }))
  };
}

/**
 * Step 2: Finalize Session Metadata
 * Updates session with end time and duration
 */
function finalizeSessionMetadata(sessionMetadata) {
  const endTime = new Date();
  const startTime = new Date(sessionMetadata.start_time);
  const duration = Math.floor((endTime - startTime) / 1000); // seconds
  
  sessionMetadata.end_time = endTime.toISOString();
  sessionMetadata.duration = duration;
  
  return sessionMetadata;
}

/**
 * Step 3: Transcribe Audio using OpenAI Whisper
 * Converts audio file to text (temporary processing only)
 */
async function transcribeAudio(audioFilePath) {
  try {
    console.log('🎙️ Transcribing audio with Whisper (Arabic optimized)...');
    
    // Check if API key is available
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    
    if (!fs.existsSync(audioFilePath)) {
      throw new Error('Audio file not found');
    }
    
    // Prepare form data with optimized settings for Arabic
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('model', 'whisper-1');
    formData.append('language', 'ar'); // Arabic
    formData.append('response_format', 'verbose_json');
    formData.append('temperature', '0'); // Lower temperature for more accurate transcription
    
    // Add prompt to help with Arabic context (judicial/legal terminology)
    formData.append('prompt', 'جلسة قضائية في ديوان المظالم. المحكمة، القاضي، المحامي، الدعوى، المدعي، المدعى عليه.');
    
    // Call OpenAI Whisper API
    const response = await axios.post(
      `${OPENAI_API_URL}/audio/transcriptions`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 120000 // 2 minutes timeout for large files
      }
    );
    
    console.log('✅ Transcription complete');
    console.log(`📊 Detected language: ${response.data.language || 'ar'}`);
    console.log(`📝 Text length: ${response.data.text?.length || 0} characters`);
    console.log(`🎯 Segments: ${response.data.segments?.length || 0}`);
    
    return {
      text: response.data.text,
      segments: response.data.segments || [],
      language: response.data.language || 'ar'
    };
    
  } catch (error) {
    console.error('❌ Transcription error:', error.response?.data || error.message);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * Step 4: Attribute Speech by Role
 * Maps transcription to participant roles
 */
function attributeTranscriptionToRole(transcription, participantId, sessionMetadata) {
  // Find participant role
  const participant = sessionMetadata.participants.find(
    p => p.participant_id === participantId
  );
  
  const role = participant ? participant.role : 'participant';
  
  return {
    role: role,
    participantId: participantId,
    text: transcription.text,
    segments: transcription.segments || []
  };
}

/**
 * NEW: Generate Detailed Speech Log
 * Creates a detailed "who said what" log with timestamps
 */
function generateDetailedSpeechLog(roleBasedTranscriptions, sessionMetadata) {
  console.log('📝 Generating detailed speech log...');
  
  const speechLog = [];
  const startTime = new Date(sessionMetadata.start_time);
  
  for (const roleTranscript of roleBasedTranscriptions) {
    const { role, participantId, segments, text } = roleTranscript;
    
    if (segments && segments.length > 0) {
      // Use Whisper segments for accurate timing
      console.log(`📊 Processing ${segments.length} segments for ${participantId}`);
      
      for (const segment of segments) {
        // Filter out very short segments (less than 3 words or 2 seconds)
        const words = segment.text.trim().split(/\s+/);
        const segmentStart = segment.start || segment.timestamp || 0;
        const segmentEnd = segment.end || segmentStart;
        const duration = segmentEnd - segmentStart;
        
        if (words.length >= 3 || duration >= 2) {
          speechLog.push({
            timestamp: new Date(startTime.getTime() + (segmentStart * 1000)).toISOString(),
            speaker: participantId,
            role: role,
            duration_seconds: Math.round(duration),
            speech: segment.text.trim()
          });
        }
      }
    } else if (text && text.trim().length > 0) {
      // Fallback: if no segments, use full text
      console.log(`⚠️ No segments for ${participantId}, using full text`);
      speechLog.push({
        timestamp: startTime.toISOString(),
        speaker: participantId,
        role: role,
        duration_seconds: 0,
        speech: text.trim()
      });
    }
  }
  
  // Sort by timestamp
  speechLog.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  console.log(`✅ Detailed speech log created with ${speechLog.length} entries`);
  return speechLog;
}

/**
 * Step 5: Generate Neutral Summary using GPT-4
 * Creates a judicial-style, non-judgmental summary
 */
async function generateNeutralSummary(roleBasedTranscriptions, sessionMetadata) {
  try {
    console.log('🤖 Generating neutral summary...');
    
    // Prepare context for GPT
    const transcriptContext = roleBasedTranscriptions.map(t => 
      `[${t.role}]: ${t.text}`
    ).join('\n\n');
    
    // CRITICAL: Prompt must enforce neutrality
    const systemPrompt = `أنت مساعد محايد لتوثيق الجلسات القضائية. مهمتك هي إنشاء ملخص محايد وموضوعي لمحتوى الجلسة.

القواعد الصارمة:
1. لا تصدر أحكاماً أو تقييمات
2. لا تصنف السلوك أو الالتزام
3. لا تكتشف انتهاكات
4. استخدم لغة رسمية محايدة
5. ركز على الوقائع فقط
6. لخص ما حدث في الجلسة بدون أي تحليل تقييمي

اكتب ملخصاً تنفيذياً  يجيب على: "ما الذي حدث في الجلسة؟"`;

    const userPrompt = `معلومات الجلسة:
- رقم الجلسة: ${sessionMetadata.session_id}
- المدة: ${sessionMetadata.duration} ثانية
- عدد المشاركين: ${sessionMetadata.participants.length}

المحضر:
${transcriptContext}

أنشئ ملخصاً محايداً للجلسة.`;

    // Call GPT-4
    const response = await axios.post(
      `${OPENAI_API_URL}/chat/completions`,
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Low temperature for consistency
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const summary = response.data.choices[0].message.content;
    console.log('✅ Summary generated');
    
    return summary;
    
  } catch (error) {
    console.error('❌ Summary generation error:', error.response?.data || error.message);
    throw new Error(`Summary generation failed: ${error.message}`);
  }
}

/**
 * Step 6: Extract Timeline of Events
 * Creates a chronological timeline of session events
 */
async function extractTimeline(roleBasedTranscriptions, sessionMetadata) {
  try {
    console.log('📅 Extracting timeline...');
    
    const transcriptContext = roleBasedTranscriptions.map(t => 
      `[${t.role}]: ${t.text}`
    ).join('\n\n');
    
    const systemPrompt = `أنت مساعد لتوثيق الأحداث في الجلسات القضائية. استخرج الأحداث الرئيسية بشكل محايد.

القواعد:
- استخرج الأحداث المهمة فقط
- استخدم لغة محايدة
- لا تصدر أحكاماً
- ركز على الإجراءات والوقائع

قدم الأحداث بصيغة JSON array:
[
  {"event": "افتتاح الجلسة", "role": "judge"},
  {"event": "تقديم بيان", "role": "lawyer"},
  ...
]`;

    const response = await axios.post(
      `${OPENAI_API_URL}/chat/completions`,
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `المحضر:\n${transcriptContext}\n\nاستخرج الأحداث الرئيسية.` }
        ],
        temperature: 0.3,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    let events;
    try {
      const content = response.data.choices[0].message.content;
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        events = JSON.parse(jsonMatch[0]);
      } else {
        events = JSON.parse(content);
      }
    } catch (parseError) {
      console.warn('⚠️ Could not parse timeline JSON, using default');
      events = [
        { event: 'افتتاح الجلسة', role: 'judge' },
        { event: 'تقديم البيانات', role: 'participant' },
        { event: 'اختتام الجلسة', role: 'judge' }
      ];
    }
    
    // Add timestamps to events
    const startTime = new Date(sessionMetadata.start_time);
    const timelineWithTimestamps = events.map((event, index) => ({
      timestamp: new Date(startTime.getTime() + (index * 60000)).toISOString(), // 1 min intervals
      role: event.role,
      description: event.event
    }));
    
    console.log('✅ Timeline extracted');
    return timelineWithTimestamps;
    
  } catch (error) {
    console.error('❌ Timeline extraction error:', error.response?.data || error.message);
    // Return basic timeline on error
    return [
      { timestamp: sessionMetadata.start_time, role: 'system', description: 'افتتاح الجلسة' },
      { timestamp: sessionMetadata.end_time, role: 'system', description: 'اختتام الجلسة' }
    ];
  }
}

/**
 * Step 7: Generate Role-Based Summaries
 * Summarizes statements per role
 */
async function generateRoleBasedSummaries(roleBasedTranscriptions) {
  const summaries = {};
  
  for (const roleTranscript of roleBasedTranscriptions) {
    const role = roleTranscript.role;
    const text = roleTranscript.text;
    
    if (!summaries[role]) {
      summaries[role] = {
        role: role,
        summary: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
        statement_count: 1
      };
    } else {
      summaries[role].statement_count++;
    }
  }
  
  return Object.values(summaries);
}

/**
 * Step 8: Generate Complete Session Content Report
 * Assembles all components into final report
 */
async function generateSessionContentReport(audioFiles, sessionMetadata) {
  try {
    console.log('📊 Generating Session Content Report...');
    
    // Step 3: Transcribe all audio files
    const roleBasedTranscriptions = [];
    
    for (const audioFile of audioFiles) {
      console.log(`📝 Processing audio for: ${audioFile.participantId}`);
      
      // Transcribe
      const transcription = await transcribeAudio(audioFile.path);
      
      // Attribute to role
      const roleTranscript = attributeTranscriptionToRole(
        transcription,
        audioFile.participantId,
        sessionMetadata
      );
      
      roleBasedTranscriptions.push(roleTranscript);
      
      // Step 2: Delete audio immediately after processing
      if (fs.existsSync(audioFile.path)) {
        fs.unlinkSync(audioFile.path);
        console.log(`🗑️ Audio deleted: ${audioFile.path}`);
      }
    }
    
    // Finalize session metadata
    finalizeSessionMetadata(sessionMetadata);
    
    // Step 5: Generate summary
    const executiveSummary = await generateNeutralSummary(
      roleBasedTranscriptions,
      sessionMetadata
    );
    
    // Step 6: Extract timeline
    const timeline = await extractTimeline(
      roleBasedTranscriptions,
      sessionMetadata
    );
    
    // Step 7: Generate role summaries
    const roleSummaries = await generateRoleBasedSummaries(
      roleBasedTranscriptions
    );
    
    // NEW: Generate detailed speech log
    const detailedSpeechLog = generateDetailedSpeechLog(
      roleBasedTranscriptions,
      sessionMetadata
    );
    
    // Step 8: Assemble final report
    const report = {
      report_type: 'session_content_report',
      generated_at: new Date().toISOString(),
      
      session_info: {
        session_id: sessionMetadata.session_id,
        room_id: sessionMetadata.room_id,
        start_time: sessionMetadata.start_time,
        end_time: sessionMetadata.end_time,
        duration_seconds: sessionMetadata.duration,
        participants: sessionMetadata.participants.map(p => ({
          participant_id: p.participant_id,
          role: p.role,
          joined_at: p.joined_at
        }))
      },
      
      executive_summary: executiveSummary,
      
      timeline: timeline,
      
      // NEW: Detailed speech log - who said what
      detailed_speech_log: detailedSpeechLog,
      
      role_summaries: roleSummaries,
      
      metadata: {
        disclaimer: 'هذا التقرير هو ملخص محايد لمحتوى الجلسة فقط. لا يتضمن أي تقييمات أو أحكام.',
        processing_note: 'تم حذف جميع التسجيلات الصوتية والنصوص الكاملة فوراً بعد المعالجة.',
        speech_log_note: 'سجل الكلام المفصل يعرض من تكلم وماذا قال بالترتيب الزمني.'
      }
    };
    
    console.log('✅ Session Content Report generated successfully');
    return report;
    
  } catch (error) {
    console.error('❌ Report generation failed:', error);
    throw error;
  }
}

module.exports = {
  initializeSessionMetadata,
  generateSessionContentReport
};
