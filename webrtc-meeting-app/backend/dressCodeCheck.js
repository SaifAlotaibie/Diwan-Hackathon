/**
 * Dress Code Check (MVP Feature - Lawyers Only)
 * 
 * PURPOSE: Real-time detection of required Saudi attire for lawyers
 * 
 * CONSTRAINTS:
 * - Lawyers only (not judges or other participants)
 * - Uses OpenAI Vision API for detection only
 * - No face recognition
 * - No identity inference
 * - No image storage
 * - No persistent logging
 */

const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1';

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is not set in environment variables');
  throw new Error('OPENAI_API_KEY environment variable is required');
}

/**
 * Analyze frame using OpenAI Vision API
 * Detects presence of required clothing items
 */
async function analyzeDressCode(imageBase64) {
  try {
    console.log('👔 Analyzing dress code with OpenAI Vision...');
    
    // Strict prompt for clothing detection only
    const prompt = `Analyze this image and return ONLY a JSON object indicating whether the following clothing items are present on the person:
- thobe (traditional white/beige Saudi robe)
- bisht (black cloak worn over thobe)
- shemagh_or_ghutra (traditional Saudi headscarf, can be red/white checkered or white)

Rules:
- Return booleans only (true/false)
- Do NOT describe the person
- Do NOT identify the person
- Do NOT include opinions
- Focus only on clothing presence

Return format:
{
  "thobe": true/false,
  "bisht": true/false,
  "shemagh_or_ghutra": true/false
}`;

    const response = await axios.post(
      `${OPENAI_API_URL}/chat/completions`,
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: 'low' // Lower cost, sufficient for clothing detection
                }
              }
            ]
          }
        ],
        max_tokens: 150,
        temperature: 0 // Deterministic output
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Parse Vision API response
    const content = response.data.choices[0].message.content;
    console.log('📊 Vision API response:', content);
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Vision API');
    }
    
    const result = JSON.parse(jsonMatch[0]);
    
    console.log('✅ Dress code analysis complete:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Dress code analysis error:', error.response?.data || error.message);
    throw new Error(`Dress code analysis failed: ${error.message}`);
  }
}

/**
 * Apply dress code rule for lawyers
 * Returns warning if any required item is missing
 */
function applyDressCodeRule(visionResult, role) {
  console.log('📋 Applying dress code rule...');
  console.log(`   Role: ${role}`);
  console.log(`   Vision result:`, visionResult);
  
  // Rule only applies to lawyers
  if (role !== 'lawyer') {
    console.log('ℹ️ Not a lawyer, no dress code check needed');
    return {
      compliant: true,
      warning: null,
      reason: 'rule_not_applicable'
    };
  }
  
  // Check if all required items are present
  const { thobe, bisht, shemagh_or_ghutra } = visionResult;
  
  const missingItems = [];
  if (!thobe) missingItems.push('ثوب');
  if (!bisht) missingItems.push('بشت');
  if (!shemagh_or_ghutra) missingItems.push('شماغ أو غترة');
  
  if (missingItems.length > 0) {
    console.log('⚠️ Dress code not compliant. Missing:', missingItems);
    return {
      compliant: false,
      warning: 'تنبيه: يرجى الالتزام باللباس النظامي المعتمد أثناء الجلسة القضائية',
      missingItems: missingItems,
      reason: 'missing_items'
    };
  }
  
  console.log('✅ Dress code compliant');
  return {
    compliant: true,
    warning: null,
    reason: 'all_items_present'
  };
}

/**
 * Main dress code check function
 */
async function checkDressCode(imageBase64, role) {
  try {
    // Step 1: Analyze image with Vision API
    const visionResult = await analyzeDressCode(imageBase64);
    
    // Step 2: Apply dress code rule
    const ruleResult = applyDressCodeRule(visionResult, role);
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      role: role,
      detection: visionResult,
      result: ruleResult
    };
    
  } catch (error) {
    console.error('❌ Dress code check failed:', error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  checkDressCode
};
