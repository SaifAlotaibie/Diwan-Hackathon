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

// Validate API key but don't throw - let server start
if (!OPENAI_API_KEY) {
  console.warn('⚠️ WARNING: OPENAI_API_KEY is not set. Dress code checks will fail.');
}

/**
 * Analyze frame using OpenAI Vision API
 * Detects presence of required clothing items
 */
async function analyzeDressCode(imageBase64) {
  try {
    console.log('👔 Analyzing dress code with OpenAI Vision...');
    
    // Check if API key is available
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    
    // ✅ Enhanced prompt focusing on Saudi traditional attire
    const prompt = `You are an automated Saudi judicial dress code verification system.

ANALYZE the image and detect ONLY these items:

1. THOBE (Saudi traditional robe):
   - White, beige, gray, or light-colored long robe
   - Must be visible
   - Return TRUE if present, FALSE if not

2. BISHT (Black/brown cloak):
   - Black or dark brown cloak worn over thobe
   - Only for judges and lawyers
   - Return TRUE if present, FALSE if not

3. SHEMAGH or GHUTRA (Saudi headwear) - CRITICAL:
   - Shemagh: Red/white checkered headscarf
   - Ghutra: White plain headscarf
   - Agal: Black cord/rope on top of headwear
   - ANY Saudi traditional headwear = TRUE
   - Bare head or NO headwear = FALSE
   - Hair visible WITHOUT headcover = FALSE

⚠️ IMPORTANT:
- Focus ESPECIALLY on headwear detection
- If you see ANY traditional Saudi head covering = shemagh_or_ghutra: true
- If head is uncovered/bare = shemagh_or_ghutra: false

RULES:
- Return ONLY JSON
- NO descriptions
- NO names
- FOCUS on clothing presence

REQUIRED FORMAT (strict JSON):
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
        temperature: 0, // Deterministic output
        response_format: { type: "json_object" } // ✅ Force JSON response
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
    console.log('📊 Vision API raw response:', content);
    
    // Try to parse JSON directly (should work with response_format)
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseErr) {
      console.log('⚠️ Direct parse failed, trying to extract JSON...');
      // Fallback: Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        console.error('❌ No JSON found in response');
      throw new Error('Invalid response format from Vision API');
      }
      result = JSON.parse(jsonMatch[0]);
    }
    
    // Validate result has required fields
    if (typeof result.thobe !== 'boolean' || 
        typeof result.bisht !== 'boolean' || 
        typeof result.shemagh_or_ghutra !== 'boolean') {
      console.error('❌ Invalid result structure:', result);
      throw new Error('Response missing required boolean fields');
    }
    
    console.log('✅ Dress code analysis complete:', JSON.stringify(result));
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
  console.log(`   Vision result:`, JSON.stringify(visionResult, null, 2));
  
  // ✅ قواعد الزي حسب الدور مع تنبيهات منفصلة
  const { thobe, bisht, shemagh_or_ghutra } = visionResult;
  const warnings = [];
  
  // القضاة والمحامون: بشت + ثوب + شماغ/غترة
  if (role === 'judge' || role === 'chair' || role === 'lawyer') {
    
    // ✅ تنبيه خاص للبشت
    if (!bisht) {
      warnings.push({
        type: 'bisht',
        message: 'تنبيه هام: البشت القضائي مطلوب\n\nيجب ارتداء البشت (العباءة القضائية) السوداء فوق الثوب\n\nهذا جزء أساسي من الزي القضائي الرسمي',
        severity: 'high',
        item: 'بشت/عباءة قضائية'
      });
    }
    
    // ✅ تنبيه خاص للشماغ
    if (!shemagh_or_ghutra) {
      warnings.push({
        type: 'headwear',
        message: 'تنبيه: غطاء الرأس مطلوب\n\nيجب ارتداء الشماغ (أحمر/أبيض) أو الغترة (بيضاء) مع العقال\n\nوفقاً لقواعد الجلسات القضائية',
        severity: 'high',
        item: 'شماغ أو غترة'
      });
    }
    
    // تنبيه الثوب
    if (!thobe) {
      warnings.push({
        type: 'thobe',
        message: 'تنبيه: الثوب الرسمي مطلوب',
        severity: 'high',
        item: 'ثوب'
      });
    }
    
    if (warnings.length > 0) {
      console.log('⚠️ Dress code not compliant. Warnings:', warnings.length);
    return {
        compliant: false,
        warnings: warnings, // ✅ إرجاع تنبيهات متعددة
        warning: warnings[0].message, // للتوافق مع الكود القديم
        missingItems: warnings.map(w => w.item),
        reason: 'missing_judicial_attire'
      };
    }
  }
  
  // الأطراف والمشاركون: ثوب + شماغ/غترة فقط (بدون بشت)
  else if (role === 'party' || role === 'participant' || role === 'secretary') {
    
    // ✅ تنبيه خاص للشماغ
    if (!shemagh_or_ghutra) {
      warnings.push({
        type: 'headwear',
        message: 'تنبيه: غطاء الرأس مطلوب\n\nيجب ارتداء الشماغ (أحمر/أبيض) أو الغترة (بيضاء) مع العقال\n\nالزي السعودي الرسمي إلزامي في الجلسات القضائية',
        severity: 'high',
        item: 'شماغ أو غترة'
      });
    }
    
    // تنبيه الثوب
    if (!thobe) {
      warnings.push({
        type: 'thobe',
        message: 'تنبيه: الثوب السعودي الرسمي مطلوب\n\nيجب ارتداء الثوب الأبيض أو البيج',
        severity: 'high',
        item: 'ثوب'
      });
    }
    
    if (warnings.length > 0) {
      console.log('⚠️ Dress code not compliant. Warnings:', warnings.length);
    return {
      compliant: false,
        warnings: warnings, // ✅ إرجاع تنبيهات متعددة
        warning: warnings[0].message, // للتوافق مع الكود القديم
        missingItems: warnings.map(w => w.item),
        reason: 'missing_formal_attire'
      };
    }
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
