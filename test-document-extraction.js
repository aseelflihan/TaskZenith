const fs = require('fs');

// Test improved PDF extraction
async function testPDFExtraction() {
  try {
    console.log('🔍 Testing PDF extraction with PDF.js...');
    
    // Dynamic import for pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');
    console.log('✅ pdfjs-dist imported successfully');
    
    // Test with a minimal valid PDF buffer (will fail but shows import works)
    const minimalPDF = Buffer.from([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, // %PDF-1.4
      0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a, 0x0a  // Header
    ]);
    
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(minimalPDF),
        useSystemFonts: true,
      });
      await loadingTask.promise;
    } catch (error) {
      console.log('Expected error with minimal PDF buffer:', error.message.substring(0, 100));
    }
    
  } catch (error) {
    console.error('❌ PDF extraction error:', error);
  }
}

// Test improved Word extraction
async function testWordExtraction() {
  try {
    console.log('🔍 Testing Word extraction with enhanced mammoth...');
    
    // Dynamic import for mammoth
    const mammoth = await import('mammoth');
    console.log('✅ mammoth imported successfully');
    
    // Test parallel extraction methods
    try {
      const testBuffer = Buffer.from('dummy content');
      const [rawResult, htmlResult] = await Promise.allSettled([
        mammoth.extractRawText({ buffer: testBuffer }),
        mammoth.convertToHtml({ buffer: testBuffer })
      ]);
      
      console.log('Raw extraction result:', rawResult.status);
      console.log('HTML extraction result:', htmlResult.status);
    } catch (error) {
      console.log('Expected error with dummy buffer');
    }
    
  } catch (error) {
    console.error('❌ Word extraction error:', error);
  }
}

// Test improved Excel extraction
async function testExcelExtraction() {
  try {
    console.log('🔍 Testing Excel extraction with enhanced xlsx...');
    
    const xlsx = await import('xlsx');
    console.log('✅ xlsx imported successfully');
    
    // Create a simple test workbook
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet([['Hello', 'World'], ['Test', 'Data']]);
    xlsx.utils.book_append_sheet(wb, ws, 'TestSheet');
    
    // Convert to buffer and back
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const testBook = xlsx.read(buffer, { type: 'buffer' });
    
    console.log('✅ Excel processing test successful');
    console.log('Sheet names:', testBook.SheetNames);
    
  } catch (error) {
    console.error('❌ Excel extraction error:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting document processing tests...\n');
  
  await testPDFExtraction();
  console.log('');
  
  await testWordExtraction();
  console.log('');
  
  await testExcelExtraction();
  
  console.log('\n✅ All tests completed!');
}

runAllTests();
