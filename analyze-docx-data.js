const fs = require('fs');
const path = require('path');

// Find any existing docx files in the project
const dataPath = './data';
const knowledgeFile = path.join(dataPath, 'knowledge.json');

async function analyzeExistingDocxFile() {
  console.log('🔍 Analyzing existing DOCX file from Knowledge Hub data...\n');
  
  try {
    // Read the knowledge.json file
    if (fs.existsSync(knowledgeFile)) {
      const knowledgeData = JSON.parse(fs.readFileSync(knowledgeFile, 'utf8'));
      
      // Find DOCX entries
      const docxEntries = knowledgeData.filter(item => 
        item.fileName && item.fileName.endsWith('.docx')
      );
      
      console.log(`Found ${docxEntries.length} DOCX entries in knowledge hub:`);
      
      docxEntries.forEach((entry, index) => {
        console.log(`\n${index + 1}. ${entry.fileName}`);
        console.log(`   File Type: ${entry.fileType}`);
        console.log(`   File Size: ${entry.fileSize} bytes`);
        console.log(`   Created: ${entry.createdAt}`);
        console.log(`   Original Content Preview:`);
        console.log(`   ${entry.originalContent.substring(0, 200)}...`);
        
        // Check if there's base64 file data
        if (entry.fileData) {
          console.log(`   ✅ File data available (${entry.fileData.length} base64 chars)`);
          
          // Decode and analyze the actual file
          try {
            const fileBuffer = Buffer.from(entry.fileData, 'base64');
            console.log(`   File buffer size: ${fileBuffer.length} bytes`);
            
            // Check ZIP header (DOCX files are ZIP archives)
            const zipHeader = fileBuffer.slice(0, 4);
            if (zipHeader[0] === 0x50 && zipHeader[1] === 0x4B) {
              console.log(`   ✅ Valid ZIP header detected (PK)`);
            } else {
              console.log(`   ❌ Invalid ZIP header: ${zipHeader.toString('hex')}`);
            }
            
            // Try to extract text with mammoth
            const mammoth = require('mammoth');
            mammoth.extractRawText({ buffer: fileBuffer })
              .then(result => {
                console.log(`   ✅ Mammoth extraction successful!`);
                console.log(`   Text length: ${result.value.length} characters`);
                console.log(`   Messages: ${result.messages.length}`);
                if (result.value.length > 0) {
                  console.log(`   Extracted text preview: "${result.value.substring(0, 100)}..."`);
                } else {
                  console.log(`   No text content found in document`);
                }
              })
              .catch(error => {
                console.log(`   ❌ Mammoth extraction failed: ${error.message.substring(0, 100)}...`);
              });
            
          } catch (decodeError) {
            console.log(`   ❌ Error decoding file data: ${decodeError.message}`);
          }
        } else {
          console.log(`   ❌ No file data available`);
        }
      });
      
      if (docxEntries.length === 0) {
        console.log('No DOCX files found in knowledge hub data.');
        console.log('This suggests the file upload is working but text extraction is failing.');
      }
      
    } else {
      console.log('❌ knowledge.json file not found');
    }
    
  } catch (error) {
    console.log('❌ Error analyzing knowledge data:', error.message);
  }
}

// Run the analysis
analyzeExistingDocxFile();
