// اختبار مشاكل OCR API والتحقق من سبب التوقف

async function testOCRIssues() {
  console.log('🔍 Testing OCR.space API issues...\n');
  
  // Test 1: Check API availability
  console.log('1. Testing OCR.space API availability...');
  try {
    const response = await fetch('https://api.ocr.space/', {
      method: 'GET'
    });
    console.log(`   API endpoint status: ${response.status}`);
    if (response.ok) {
      console.log('   ✅ OCR.space API is reachable');
    } else {
      console.log('   ❌ OCR.space API returned error:', response.status);
    }
  } catch (error) {
    console.log('   ❌ Cannot reach OCR.space API:', error.message);
  }
  
  // Test 2: Check valid language codes
  console.log('\n2. Testing language parameter issues...');
  const validLanguages = ['eng', 'ara', 'chi_sim', 'fre', 'ger', 'jpn', 'kor', 'spa'];
  console.log('   Valid language codes:', validLanguages.join(', '));
  console.log('   Current usage: "eng" and "ara"');
  
  // Test 3: Check API key limitations
  console.log('\n3. Testing API key limitations...');
  console.log('   Current API key: "helloworld" (free test key)');
  console.log('   Possible issues:');
  console.log('   - Rate limiting (requests per minute/hour)');
  console.log('   - Quota exhaustion');
  console.log('   - Test key may have restrictions');
  
  // Test 4: Test with minimal request
  console.log('\n4. Testing minimal OCR request...');
  try {
    // Create a tiny 1x1 white pixel image
    const tinyImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    const formData = new FormData();
    formData.append('base64Image', `data:image/png;base64,${tinyImageBase64}`);
    formData.append('language', 'eng');
    formData.append('apikey', 'helloworld');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');
    
    console.log('   Sending minimal OCR request...');
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    });
    
    console.log(`   Response status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ API call successful');
      console.log('   Response structure:', Object.keys(result));
      
      if (result.IsErroredOnProcessing) {
        console.log('   ❌ OCR processing error:', result.ErrorMessage);
      } else {
        console.log('   ✅ OCR processing successful');
        console.log('   Results count:', result.ParsedResults?.length || 0);
      }
    } else {
      const errorText = await response.text();
      console.log('   ❌ API request failed:', errorText.substring(0, 200));
    }
    
  } catch (error) {
    console.log('   ❌ Test request failed:', error.message);
  }
  
  // Test 5: Check timeout settings
  console.log('\n5. Analyzing timeout issues...');
  console.log('   Error seen: "E101: Timed out waiting for results"');
  console.log('   This suggests:');
  console.log('   - OCR.space server is overloaded');
  console.log('   - Image processing is taking too long');
  console.log('   - API timeout settings are too strict');
  
  console.log('\n📋 Recommendations:');
  console.log('   1. Add retry mechanism with exponential backoff');
  console.log('   2. Implement multiple OCR service fallbacks');
  console.log('   3. Add image preprocessing to reduce processing time');
  console.log('   4. Consider using local OCR libraries as backup');
  console.log('   5. Add better error handling for timeout scenarios');
}

// Test AI API issues
async function testAIIssues() {
  console.log('\n🤖 Testing AI API issues...\n');
  
  console.log('1. Google Gemini API status...');
  console.log('   Error seen: "[503 Service Unavailable] The model is overloaded"');
  console.log('   This indicates:');
  console.log('   - Gemini API is experiencing high load');
  console.log('   - Temporary service unavailability');
  console.log('   - Need for retry logic');
  
  console.log('\n📋 AI API Recommendations:');
  console.log('   1. Add retry logic with exponential backoff');
  console.log('   2. Implement multiple AI model fallbacks');
  console.log('   3. Add timeout handling');
  console.log('   4. Consider request queuing during peak times');
}

// Run all tests
async function runDiagnostics() {
  console.log('🚀 OCR and AI Diagnostics\n');
  console.log('========================================\n');
  
  await testOCRIssues();
  await testAIIssues();
  
  console.log('\n✅ Diagnostics completed!');
}

runDiagnostics().catch(console.error);
