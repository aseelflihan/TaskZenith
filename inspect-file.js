const fs = require('fs');
const path = require('path');

async function inspectCorruptedDocx() {
  console.log('🔍 Deep inspection of the problematic DOCX file...\n');
  
  try {
    const knowledgeFile = './data/knowledge.json';
    const knowledgeData = JSON.parse(fs.readFileSync(knowledgeFile, 'utf8'));
    
    const docxEntry = knowledgeData.find(item => 
      item.fileName && item.fileName.endsWith('.docx')
    );
    
    if (!docxEntry) {
      console.log('No DOCX file found');
      return;
    }
    
    console.log(`Inspecting: ${docxEntry.fileName}`);
    console.log(`File size: ${docxEntry.fileSize} bytes`);
    
    // Decode the file
    const fileBuffer = Buffer.from(docxEntry.fileData, 'base64');
    
    // Examine first 50 bytes
    console.log('\n📊 File Header Analysis:');
    console.log('First 50 bytes (hex):', fileBuffer.slice(0, 50).toString('hex'));
    console.log('First 50 bytes (ascii):', fileBuffer.slice(0, 50).toString('ascii'));
    
    // Check for common file signatures
    const header = fileBuffer.slice(0, 10);
    console.log('\n🔍 File Type Detection:');
    
    if (header[0] === 0x50 && header[1] === 0x4B) {
      console.log('✅ ZIP/DOCX signature (PK) detected');
    } else if (header[0] === 0x2F && header[1] === 0x2A) {
      console.log('❌ CSS comment signature (/*) detected - This is NOT a DOCX file!');
    } else if (header.toString('ascii').startsWith('<!DOCTYPE')) {
      console.log('❌ HTML signature detected - This is NOT a DOCX file!');
    } else if (header.toString('ascii').startsWith('{')) {
      console.log('❌ JSON signature detected - This is NOT a DOCX file!');
    } else {
      console.log(`❌ Unknown signature: ${header.toString('hex')}`);
    }
    
    // Try to read as text to see what it actually contains
    console.log('\n📄 File Content Analysis:');
    try {
      const textContent = fileBuffer.toString('utf8');
      if (textContent.length > 0 && textContent.length < 2000) {
        console.log('File appears to be text-based:');
        console.log('---START OF FILE---');
        console.log(textContent);
        console.log('---END OF FILE---');
      } else {
        console.log('File is either binary or too large to display as text');
        console.log('First 200 characters:');
        console.log(textContent.substring(0, 200));
      }
    } catch (error) {
      console.log('Cannot read as UTF-8 text');
    }
    
    console.log('\n💡 Analysis Results:');
    console.log('The file has a .docx extension but is NOT actually a Microsoft Word document.');
    console.log('This explains why mammoth (DOCX parser) fails to extract text from it.');
    
    console.log('\n🔧 Solutions:');
    console.log('1. Add file type validation before processing');
    console.log('2. Implement fallback text extraction for misnamed files');
    console.log('3. Provide better error messages to users');
    console.log('4. Add file signature verification');
    
  } catch (error) {
    console.log('❌ Error during inspection:', error.message);
  }
}

inspectCorruptedDocx();
