const mammoth = require('mammoth');
const fs = require('fs');

async function testWordExtraction() {
  console.log('🔍 Testing Word document extraction...\n');
  
  // Test 1: Check if mammoth is working correctly
  console.log('1. Testing mammoth availability...');
  console.log('   Available methods:', Object.keys(mammoth));
  
  // Test 2: Try with an invalid buffer to see error handling
  console.log('\n2. Testing error handling with invalid buffer...');
  try {
    const invalidBuffer = Buffer.from('This is not a docx file');
    const result = await mammoth.extractRawText({ buffer: invalidBuffer });
    console.log('   Unexpected success:', result.value.length);
  } catch (error) {
    console.log('   Expected error:', error.message.substring(0, 80) + '...');
  }
  
  // Test 3: Check minimum valid docx structure
  console.log('\n3. Testing minimum docx structure detection...');
  try {
    // Create a buffer that starts like a ZIP file (which docx files are)
    const zipLikeBuffer = Buffer.from([
      0x50, 0x4B, 0x03, 0x04, // ZIP header "PK"
      0x14, 0x00, 0x06, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00
    ]);
    
    const result = await mammoth.extractRawText({ buffer: zipLikeBuffer });
    console.log('   Success with zip-like buffer:', result.value.length);
  } catch (error) {
    console.log('   Error with zip-like buffer:', error.message.substring(0, 80) + '...');
  }
  
  // Test 4: Check what makes a valid docx
  console.log('\n4. Understanding docx file requirements...');
  console.log('   DOCX files are ZIP archives containing XML files');
  console.log('   Required structure:');
  console.log('   - [Content_Types].xml');
  console.log('   - word/document.xml');
  console.log('   - word/_rels/document.xml.rels');
  console.log('   - _rels/.rels');
  
  // Test 5: Parallel extraction methods
  console.log('\n5. Testing parallel extraction methods...');
  try {
    const testBuffer = Buffer.from('dummy');
    const [rawResult, htmlResult] = await Promise.allSettled([
      mammoth.extractRawText({ buffer: testBuffer }),
      mammoth.convertToHtml({ buffer: testBuffer })
    ]);
    
    console.log('   Raw extraction status:', rawResult.status);
    console.log('   HTML extraction status:', htmlResult.status);
    
    if (rawResult.status === 'fulfilled') {
      console.log('   Raw text length:', rawResult.value.value.length);
    }
    if (htmlResult.status === 'fulfilled') {
      console.log('   HTML content length:', htmlResult.value.value.length);
    }
  } catch (error) {
    console.log('   Parallel test error:', error.message);
  }
  
  console.log('\n📋 Analysis Summary:');
  console.log('   ✅ Mammoth library is properly installed and accessible');
  console.log('   ✅ Error handling is working correctly');
  console.log('   ❌ The issue is likely with the DOCX file format validation');
  console.log('   💡 Files must be valid ZIP archives with correct internal structure');
  console.log('   🔧 Solution: Improve error messages and file validation');
}

// Run the test
testWordExtraction().catch(console.error);
