const fs = require('fs');
const path = require('path');

// Test PDF extraction
async function testPDFExtraction() {
  try {
    console.log('Testing PDF extraction...');
    
    // Dynamic import for pdf-parse
    const pdfParse = (await import('pdf-parse')).default;
    console.log('✅ pdf-parse imported successfully');
    
    // Test with a simple buffer (this will fail but shows the import works)
    try {
      const testBuffer = Buffer.from('dummy content');
      await pdfParse(testBuffer);
    } catch (error) {
      console.log('Expected error with dummy buffer:', error.message.substring(0, 100));
    }
    
  } catch (error) {
    console.error('❌ PDF extraction error:', error);
  }
}

// Test Word extraction
async function testWordExtraction() {
  try {
    console.log('Testing Word extraction...');
    
    // Dynamic import for mammoth
    const mammoth = await import('mammoth');
    console.log('✅ mammoth imported successfully');
    
    // Test with a simple buffer (this will fail but shows the import works)
    try {
      const testBuffer = Buffer.from('dummy content');
      await mammoth.extractRawText({ buffer: testBuffer });
    } catch (error) {
      console.log('Expected error with dummy buffer:', error.message.substring(0, 100));
    }
    
  } catch (error) {
    console.error('❌ Word extraction error:', error);
  }
}

// Run tests
async function runTests() {
  await testPDFExtraction();
  console.log('---');
  await testWordExtraction();
}

runTests();
