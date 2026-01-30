const { exec } = require('child_process');
const util = require('util');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const execPromise = util.promisify(exec);

/**
 * Transcribe audio using faster-whisper (Python)
 * Make sure faster-whisper is installed: pip install faster-whisper
 */
async function transcribeAudio(audioPath) {
  try {
    console.log(`🎙️  Transcribing: ${audioPath}`);
    
    // Create a Python script to use faster-whisper
    const pythonScript = `
import sys
from faster_whisper import WhisperModel

model = WhisperModel("base", device="cpu", compute_type="int8")

segments, info = model.transcribe("${audioPath.replace(/\\/g, '/')}", beam_size=5)

text = ""
for segment in segments:
    text += segment.text + " "

print(text.strip())
`;
    
    // Save Python script temporarily
    const scriptPath = path.join(__dirname, 'transcribe_temp.py');
    fs.writeFileSync(scriptPath, pythonScript);
    
    // Execute Python script
    const { stdout, stderr } = await execPromise(`python ${scriptPath}`);
    
    // Cleanup
    if (fs.existsSync(scriptPath)) {
      fs.unlinkSync(scriptPath);
    }
    
    if (stderr && !stderr.includes('FP16')) {
      console.warn('⚠️  Transcription warning:', stderr);
    }
    
    const transcript = stdout.trim();
    
    if (!transcript || transcript.length === 0) {
      return '[No speech detected]';
    }
    
    console.log(`✅ Transcription complete: ${transcript.substring(0, 50)}...`);
    return transcript;
    
  } catch (error) {
    console.error('❌ Transcription error:', error.message);
    
    // Fallback: Return placeholder
    return `[Transcription unavailable: ${error.message}]`;
  }
}

/**
 * Analyze transcripts using local Ollama LLM
 * Make sure Ollama is running: ollama serve
 * and model is pulled: ollama pull llama2
 */
async function analyzeTranscript(transcriptions) {
  try {
    console.log('🧠 Analyzing with Ollama...');
    
    // Prepare prompt
    const transcriptText = transcriptions
      .map(t => `${t.participantId}: ${t.text}`)
      .join('\n\n');
    
    const prompt = `You are an AI assistant analyzing a meeting transcript.

Meeting Transcript:
${transcriptText}

Please analyze this meeting and provide:
1. A brief summary (2-3 sentences)
2. Key points mentioned by each participant

Respond in JSON format:
{
  "summary": "Brief meeting summary here",
  "keyPoints": [
    {
      "participant": "Participant 1",
      "points": ["point 1", "point 2"]
    },
    {
      "participant": "Participant 2", 
      "points": ["point 1", "point 2"]
    }
  ]
}

JSON:`;

    // Call Ollama API
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama2',
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 500
      }
    }, {
      timeout: 60000 // 60 second timeout
    });
    
    const generatedText = response.data.response;
    console.log('✅ LLM response received');
    
    // Try to parse JSON from response
    try {
      // Extract JSON from response (sometimes LLM adds extra text)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return analysis;
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.warn('⚠️  Could not parse LLM JSON, using fallback');
      
      // Fallback structure
      return {
        summary: generatedText.substring(0, 200) + '...',
        keyPoints: transcriptions.map(t => ({
          participant: t.participantId,
          points: [t.text.substring(0, 100) + '...']
        }))
      };
    }
    
  } catch (error) {
    console.error('❌ LLM analysis error:', error.message);
    
    // Return basic fallback
    return {
      summary: 'Meeting analysis unavailable. Please ensure Ollama is running (ollama serve) and llama2 model is installed (ollama pull llama2).',
      keyPoints: transcriptions.map(t => ({
        participant: t.participantId,
        points: ['Transcription available but analysis failed']
      }))
    };
  }
}

module.exports = {
  transcribeAudio,
  analyzeTranscript
};
