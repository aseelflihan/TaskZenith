import { NextRequest, NextResponse } from 'next/server';
import { addItem } from '../db';
import { summarizeAndExtractTasksFlow } from '@/ai/flows/summarize-and-extract-tasks';
import { enhanceOcrTextFlow } from '@/ai/flows/enhance-ocr-text';
import { freeRobustOCR } from '@/lib/alternative-ocr';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Utility function to extract text content from different file types
async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Handle different file types
  if (file.type === 'text/plain') {
    return buffer.toString('utf-8');
  }
  
  if (file.type === 'application/pdf') {
    return await extractTextFromPDF(buffer);
  }
  
  if (file.type.startsWith('image/')) {
    return await extractTextFromImage(buffer, file.type);
  }
  
  if (file.name.endsWith('.docx')) {
    return await extractTextFromDocument(buffer);
  }
  
  if (file.name.endsWith('.doc')) {
    return `File: ${file.name}\nType: ${file.type}\n\nText extraction for legacy .doc files is not supported. The file has been uploaded and can be downloaded manually.`;
  }
  
  if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    return await extractTextFromSpreadsheet(buffer);
  }
  
  // For other file types, return basic file information
  return `File: ${file.name}\nType: ${file.type}\nSize: ${(file.size / 1024).toFixed(2)} KB\n\nThis file has been uploaded to the Knowledge Hub. The AI will analyze any available metadata and provide insights based on the file properties.`;
}

// PDF text extraction using pdf-parse-fork (stable version)
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log('Extracting text from PDF...');
    
    // Dynamic import for pdf2json
    const PDFParser = (await import('pdf2json')).default;
    
    
    return new Promise((resolve, reject) => {
      const pdfParser = new (PDFParser as any)();
      
      // Set up event handlers
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('PDF parsing error:', errData);
        const errorMsg = `PDF processing failed: ${errData.parserError || 'Unknown error'}

❌ PDF Processing Error:
• The PDF file could not be processed
• File might be corrupted, password protected, or use an unsupported format

🔧 Troubleshooting Steps:
• Verify the PDF opens correctly in a PDF viewer
• Check if the PDF is password protected
• Try saving the PDF in a different format
• Convert to Word document and upload that instead

📁 File Status: PDF has been stored and can be downloaded from the Original tab.`;
        resolve(errorMsg);
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          let fullText = '';
          let pageCount = 0;
          
          // Extract text from all pages
          if (pdfData.Pages && pdfData.Pages.length > 0) {
            pageCount = pdfData.Pages.length;
            
            pdfData.Pages.forEach((page: any, pageIndex: number) => {
              let pageText = '';
              
              if (page.Texts && page.Texts.length > 0) {
                page.Texts.forEach((textObj: any) => {
                  if (textObj.R && textObj.R.length > 0) {
                    textObj.R.forEach((textRun: any) => {
                      if (textRun.T) {
                        // Decode URI component to handle special characters
                        try {
                          pageText += decodeURIComponent(textRun.T) + ' ';
                        } catch (e) {
                          pageText += textRun.T + ' ';
                        }
                      }
                    });
                  }
                });
              }
              
              if (pageText.trim()) {
                fullText += `Page ${pageIndex + 1}:\n${pageText.trim()}\n\n`;
              }
            });
          }
          
          console.log(`PDF processed: ${pageCount} pages, ${fullText.length} characters extracted`);
          
          if (!fullText.trim() || fullText.trim().length < 10) {
            resolve(`PDF processed but minimal text content found.

📄 PDF Analysis:
• File Type: PDF Document
• Number of Pages: ${pageCount}
• Text Extracted: ${fullText.length} characters
• Processing: Completed successfully

💡 Possible Reasons for Limited Text:
• PDF contains mainly images or scanned content
• PDF uses complex formatting that's difficult to extract
• PDF contains mostly graphics, charts, or drawings
• Text might be embedded as images (requires OCR)

🔧 Suggested Solutions:
• If this is a scanned document, convert to images and use OCR
• Try selecting and copying text directly from a PDF viewer
• Use specialized PDF text extraction tools
• Convert to Word document format first

📁 File Status: PDF has been stored and can be downloaded from the Original tab.`);
          } else {
            // Clean and format the extracted text
            const cleanedText = fullText
              .replace(/\s+/g, ' ') // Normalize whitespace
              .replace(/\n\s*\n/g, '\n\n') // Clean up multiple newlines
              .trim();
            
            // Return formatted version for display in Original tab
            const formattedForDisplay = `PDF Document processed successfully

📄 PDF Information:
• Number of Pages: ${pageCount}
• Text Length: ${cleanedText.length} characters
• Processing: Text extraction completed

📖 Extracted Content:
${cleanedText}`;

            resolve(formattedForDisplay);
          }
          
        } catch (processingError) {
          console.error('Error processing PDF data:', processingError);
          resolve(`PDF data processing failed.

❌ Processing Error:
• An error occurred while extracting text from the PDF
• The PDF structure might be complex or non-standard

📁 File Status: PDF has been stored and can be downloaded from the Original tab.`);
        }
      });
      
      // Parse the PDF buffer
      try {
        pdfParser.parseBuffer(buffer);
      } catch (parseError) {
        console.error('Error starting PDF parse:', parseError);
        resolve(`Unable to start PDF processing.

❌ Parse Error:
• Could not initiate PDF text extraction
• File might be corrupted or in an unsupported format

📁 File Status: PDF has been stored and can be downloaded from the Original tab.`);
      }
    });
    
  } catch (error) {
    console.error('PDF parsing error:', error);
    
    // Provide detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return `Unable to extract text from PDF file.

❌ PDF Processing Error:
• Error: ${errorMessage}
• File appears to be a PDF but text extraction failed
• The file has been uploaded and can be processed manually

� Troubleshooting Steps:
• Ensure the PDF is not password protected
• Try opening the PDF in a PDF viewer to verify it's valid
• Check if the PDF contains selectable text
• If it's a scanned document, consider using OCR tools

💡 Alternative Solutions:
• Convert PDF pages to images and upload for OCR processing
• Copy and paste text directly from PDF viewer
• Use online PDF to text conversion tools
• Save the PDF as a Word document and upload that instead

📁 File Status: PDF has been stored and can be downloaded from the Original tab.`;
  }
}

// Image text extraction using robust OCR with multiple fallbacks
async function extractTextFromImage(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    console.log(`Processing image: ${mimeType}, size: ${buffer.length} bytes`);
    
    // Check file size limit for OCR processing (max 5MB for images)
    if (buffer.length > 5 * 1024 * 1024) {
      return `Image file detected (${mimeType})

📊 OCR Analysis Results:
• File Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB
• Status: File too large for OCR processing
• Limit: Maximum 5MB for image OCR

💡 Suggestions:
• Compress the image to reduce file size
• Use online image compression tools
• Split large images into smaller sections

📁 File Status: Image has been stored and can be viewed in the Original tab.`;
    }

    // Preprocess image for better OCR results
    let preprocessedBuffer = buffer;
    try {
      const sharp = await import('sharp');
      preprocessedBuffer = await sharp.default(buffer)
        .resize(1200, 1200, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .normalize() // Improve contrast
        .sharpen() // Enhance text clarity
        .grayscale() // Convert to grayscale for better OCR
        .png({ quality: 80, compressionLevel: 6 })
        .toBuffer();
        
      console.log(`Image preprocessed: ${preprocessedBuffer.length} bytes`);
    } catch (sharpError) {
      console.log('Image preprocessing failed, using original buffer:', sharpError);
      preprocessedBuffer = buffer;
    }

    // Use free robust OCR with multiple fallback methods
    const { text, confidence, method } = await freeRobustOCR(preprocessedBuffer, mimeType);

    console.log(`OCR completed using ${method} with confidence: ${confidence}%`);

    // Enhanced text cleaning and formatting
    const cleanedText = text
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .join('\n')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanedText || cleanedText.length < 3) {
      return `Image processed (${mimeType})
      
📊 OCR Analysis Results:
• Method Used: ${method}
• Confidence Level: ${Math.round(confidence)}%
• Text Found: No readable text detected
• Languages: Arabic & English supported
• Status: Image stored successfully

💡 Note: The image might contain non-text content, handwriting, or low-quality text that's difficult to recognize.`;
    }

    // AI Enhancement: Improve and correct the extracted text
    let enhancedText = cleanedText;
    let improvements: string[] = [];
    let detectedLanguage = 'Mixed';
    
    try {
      console.log('Enhancing text with AI...');
      const enhancement = await enhanceOcrTextFlow({
        rawText: cleanedText,
        confidence: confidence
      });
      
      enhancedText = enhancement.correctedText;
      improvements = enhancement.improvements;
      detectedLanguage = enhancement.language;
      
      console.log(`AI enhancement completed. Improvements: ${improvements.length}`);
    } catch (aiError) {
      console.log('AI enhancement failed, using original OCR text:', aiError);
      // Continue with cleaned text if AI enhancement fails
    }

    // Return formatted result with metadata
    return `Image processed (${mimeType})

📊 OCR Analysis Results:
• Method Used: ${method}
• Confidence Level: ${Math.round(confidence)}%
• Text Found: Yes (${enhancedText.length} characters)
• Language Detected: ${detectedLanguage}
• AI Enhancements: ${improvements.length > 0 ? improvements.length + ' improvements applied' : 'Original text preserved'}
• Status: Text extraction successful

${improvements.length > 0 ? `🔧 AI Improvements Applied:
${improvements.map((imp: string) => `• ${imp}`).join('\n')}

` : ''}📄 Extracted Text:
${enhancedText}

✨ This text has been automatically extracted, cleaned, and enhanced using AI for better readability and accuracy.`;

  } catch (error) {
    console.error('OCR processing error:', error);
    
    // Fallback error message with helpful information
    return `Image file detected (${mimeType})

❌ OCR Processing Error: ${error instanceof Error ? error.message : 'Unknown error'}

🔧 Troubleshooting Tips:
• Ensure image quality is good and text is clear
• Supported formats: PNG, JPG, JPEG, GIF, WebP
• For best results, use high-contrast images
• Text should be horizontal and not skewed
• Try reducing image size if it's very large

📁 File Status: Image has been stored and can be viewed in the Original tab.

🔄 You can try re-uploading the image or use a clearer version for better text extraction.

💡 Alternative Solutions:
• Use Google Lens or other OCR apps on your phone
• Convert image to PDF and try uploading as PDF
• Type the text manually if it's short`;
  }
}

// Document text extraction using mammoth for DOCX files
// Document text extraction using mammoth for DOCX files
async function extractTextFromDocument(buffer: Buffer): Promise<string> {
  try {
    console.log('Extracting text from Word document...');
    
    // First, validate that this is actually a DOCX file (ZIP format)
    const isValidDocx = buffer.length > 4 && 
                       buffer[0] === 0x50 && 
                       buffer[1] === 0x4B; // ZIP header "PK"
    
    if (!isValidDocx) {
      console.log('Invalid DOCX file format detected, attempting text fallback...');
      
      // Try to read as plain text (might be a misnamed file)
      try {
        const textContent = buffer.toString('utf8');
        if (textContent.length > 10 && textContent.includes('Word document processed')) {
          // This appears to be an error message that was saved as file content
          return `❌ ملف تالف أو غير صحيح

📄 تحليل الملف:
• نوع الملف: يحمل امتداد .docx لكنه ليس ملف Word صحيح
• المحتوى: يحتوي على نص بدلاً من بيانات Word
• الحجم: ${buffer.length} بايت

🔧 الحلول المقترحة:
• تأكد من حفظ الملف من Microsoft Word مباشرة
• استخدم "حفظ باسم" واختر تنسيق Word Document (.docx)
• تحقق من أن الملف ليس تالفاً بفتحه في Word
• جرب تحويل الملف إلى PDF أولاً ثم رفعه

💡 نصيحة: إذا كان النص قصيراً، يمكنك نسخه ولصقه مباشرة في Knowledge Hub.

📁 حالة الملف: تم حفظ الملف ويمكن تحميله من تبويب Original.`;
        } else if (textContent.length > 10) {
          // File seems to contain readable text
          return `📄 محتوى نصي مستخرج من ملف بامتداد .docx

⚠️ تنبيه: الملف يحمل امتداد .docx لكنه يحتوي على نص عادي.

📖 المحتوى المستخرج:
${textContent.trim()}

💡 ملاحظة: للحصول على أفضل النتائج، احفظ الملف من Microsoft Word بتنسيق .docx صحيح.`;
        }
      } catch (textError) {
        console.log('Could not read as text either:', textError);
      }
      
      return `❌ ملف Word غير صالح

📄 مشكلة في تنسيق الملف:
• الملف لا يحتوي على التوقيع الصحيح لملف Word (.docx)
• ملفات .docx يجب أن تكون أرشيف ZIP يحتوي على XML

🔧 طرق الإصلاح:
• افتح الملف في Microsoft Word
• احفظه مرة أخرى باستخدام "حفظ باسم" → Word Document (.docx)
• تأكد من أن الملف غير محمي بكلمة مرور
• جرب استخدام Google Docs لتحويل الملف

💾 البدائل:
• انسخ النص والصقه مباشرة في Knowledge Hub
• احفظ الملف كـ PDF ثم ارفعه
• استخدم أدوات تحويل الملفات عبر الإنترنت

📁 حالة الملف: تم حفظ الملف ويمكن تحميله من تبويب Original.`;
    }
    
    // Dynamic import to handle the package properly
    const mammoth = await import('mammoth');
    
    // Extract raw text (faster) and HTML (more detailed) in parallel
    const [rawResult, htmlResult] = await Promise.allSettled([
      mammoth.extractRawText({ buffer }),
      mammoth.convertToHtml({ buffer })
    ]);
    
    let extractedText = '';
    let messages: string[] = [];
    
    // Process raw text result
    if (rawResult.status === 'fulfilled') {
      extractedText = rawResult.value.value || '';
      // Handle messages property safely
      const resultValue = rawResult.value as any;
      messages = resultValue.messages?.map((msg: any) => msg.message) || [];
      console.log(`Raw text extracted: ${extractedText.length} characters`);
    }
    
    // If raw text extraction failed, try HTML conversion
    if (!extractedText && htmlResult.status === 'fulfilled') {
      const htmlContent = htmlResult.value.value || '';
      // Simple HTML to text conversion
      extractedText = htmlContent
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
        .replace(/&/g, '&') // Replace HTML entities
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .trim();
      
      console.log(`Text extracted from HTML conversion: ${extractedText.length} characters`);
    }
    
    if (!extractedText.trim() || extractedText.length < 10) {
      return `📄 تم معالجة ملف Word لكن لم يتم العثور على محتوى نصي كافي

� تحليل الملف:
• نوع الملف: Microsoft Word (.docx)
• استخراج النص: تم بنجاح
• المحتوى الموجود: قليل أو معدوم
• رسائل المعالجة: ${messages.length > 0 ? messages.join(', ') : 'لا توجد'}

💡 الأسباب المحتملة:
• الملف يحتوي بشكل أساسي على صور أو مخططات
• الملف يحتوي على جداول منسقة معقدة
• الملف يستخدم تنسيقاً معقداً يتطلب مراجعة يدوية
• الملف قد يكون تالفاً أو بتنسيق غير مدعوم

🔧 اقتراحات للحل:
• افتح الملف في Word وتحقق من وجود نص قابل للتحديد
• جرب نسخ النص مباشرة من Word ولصقه في Knowledge Hub
• إذا كان يحتوي على صور مع نص، جرب حفظها كصور منفصلة للـ OCR
• فكر في تحويل المحتوى إلى نص عادي أولاً

📁 حالة الملف: تم حفظ الملف ويمكن تحميله من تبويب Original.`;
    }
    
    // Add processing information if there were any messages
    let result = extractedText;
    if (messages.length > 0) {
      result += `\n\n📋 Processing Notes:\n${messages.map(msg => `• ${msg}`).join('\n')}`;
    }
    
    console.log(`Document processing completed successfully: ${extractedText.length} characters extracted`);
    return result;
    
  } catch (error: any) {
    console.error('Document processing error:', error);
    
    // Provide specific error handling
    if (error.message.includes("Can't find end of central directory")) {
      console.warn('Warning: The uploaded .docx file appears to be invalid or corrupted. It might be a .doc file with a .docx extension.');
      return `❌ ملف Word تالف أو غير صالح

🔍 تحليل المشكلة:
• نوع الخطأ: تنسيق ملف غير صحيح
• التفاصيل: الملف يبدو تالفاً أو قد يكون ملف .doc قديم بامتداد .docx
• الإجراء المقترح: إعادة حفظ الملف بتنسيق .docx الصحيح

🔧 خطوات الحل:
• افتح الملف في Microsoft Word
• اختر "حفظ باسم" → "Word Document (.docx)"
• تأكد من أن الملف غير محمي بكلمة مرور
• جرب الرفع مرة أخرى

💡 حلول بديلة:
• انسخ النص والصقه مباشرة
• احفظ كـ PDF أولاً ثم ارفعه
• استخدم Google Docs لتحويل الملف

📁 حالة الملف: تم حفظ الملف ويمكن تحميله من تبويب Original.`;
    }
    
    if (error.message.includes("zip file")) {
      return `❌ مشكلة في تنسيق ملف Word

� تشخيص المشكلة:
• الملف لا يتبع هيكل ملف Word الصحيح
• ملفات .docx يجب أن تكون أرشيف ZIP
• الملف قد يكون تالفاً أو بتنسيق خاطئ

🛠️ الحلول الموصى بها:
• افتح الملف في Microsoft Word وتحقق من عمله
• احفظ الملف مرة أخرى بتنسيق .docx
• تأكد من أن الملف الأصلي سليم

🔄 خطوات بديلة:
• جرب نسخ النص من Word ولصقه مباشرة
• احفظ كـ PDF واستخدمه بدلاً من ذلك
• استخدم خدمات تحويل الملفات عبر الإنترنت

📁 حالة الملف: تم حفظ الملف ويمكن تحميله من تبويب Original.`;
    }
    
    const errorMessage = error.message || 'Unknown error occurred';
    return `❌ فشل في استخراج النص من ملف Word

🔍 خطأ في معالجة الملف:
• نوع الخطأ: ${errorMessage}
• تم رفع الملف لكن استخراج النص فشل

🔧 الحلول الممكنة:
• قد يكون الملف محمياً بكلمة مرور
• قد يكون الملف يستخدم تنسيق Word غير مدعوم
• جرب تحويل الملف إلى تنسيق آخر (PDF، نص عادي)
• تأكد من أن الملف غير تالف

� بدائل موصى بها:
• انسخ النص من Word والصقه مباشرة
• احفظ الملف كـ PDF وارفعه
• استخدم Google Docs لتحويل الملف
• جرب أدوات تحويل الملفات عبر الإنترنت

📁 حالة الملف: تم حفظ الملف ويمكن تحميله من تبويب Original.`;
  }
}
// Spreadsheet text extraction using xlsx
async function extractTextFromSpreadsheet(buffer: Buffer): Promise<string> {
  try {
    console.log('Extracting data from spreadsheet...');
    
    const xlsx = await import('xlsx');
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    let extractedText = '';
    let totalCells = 0;
    
    console.log(`Spreadsheet loaded. Sheets: ${workbook.SheetNames.join(', ')}`);
    
    workbook.SheetNames.forEach((sheetName: string, index: number) => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Get the range of the worksheet
      const range = xlsx.utils.decode_range(worksheet['!ref'] || 'A1:A1');
      const sheetCells = (range.e.r - range.s.r + 1) * (range.e.c - range.s.c + 1);
      totalCells += sheetCells;
      
      // Convert to CSV for better text representation
      const sheetData = xlsx.utils.sheet_to_csv(worksheet);
      
      if (sheetData.trim()) {
        extractedText += `=== Sheet ${index + 1}: ${sheetName} ===\n`;
        extractedText += `Dimensions: ${range.e.r - range.s.r + 1} rows × ${range.e.c - range.s.c + 1} columns\n\n`;
        extractedText += sheetData;
        extractedText += '\n\n';
        
        console.log(`Sheet "${sheetName}": ${sheetData.length} characters extracted`);
      } else {
        extractedText += `=== Sheet ${index + 1}: ${sheetName} ===\n`;
        extractedText += 'No data found in this sheet\n\n';
      }
    });
    
    if (!extractedText.trim()) {
      return `Spreadsheet processed but no data found.

📊 Spreadsheet Analysis:
• File Type: Excel Spreadsheet
• Sheets Found: ${workbook.SheetNames.length}
• Sheet Names: ${workbook.SheetNames.join(', ')}
• Total Cells: ${totalCells}
• Data Extracted: None

💡 Possible Reasons:
• All sheets are empty
• Data might be in hidden rows/columns
• File might contain only formatting without actual data
• Charts or images without text data

📁 File Status: Spreadsheet has been stored and can be downloaded from the Original tab.`;
    }
    
    // Add summary information
    const summary = `📊 Spreadsheet Summary:
• Total Sheets: ${workbook.SheetNames.length}
• Sheet Names: ${workbook.SheetNames.join(', ')}
• Total Data Length: ${extractedText.length} characters
• Processing: Successfully completed

`;
    
    console.log(`Spreadsheet processing completed: ${workbook.SheetNames.length} sheets, ${extractedText.length} characters`);
    
    return summary + extractedText;
    
  } catch (error) {
    console.error('Spreadsheet processing error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return `Unable to extract data from spreadsheet file.

❌ Spreadsheet Processing Error:
• Error: ${errorMessage}
• The file has been uploaded but data extraction failed

🔧 Possible Solutions:
• The file might be password protected
• The file might be corrupted
• Try saving as a different Excel format (.xlsx recommended)
• Ensure the file contains actual data, not just formatting

💡 Alternative Approaches:
• Copy and paste data directly from Excel
• Save as CSV format and upload
• Export as PDF and upload

📁 File Status: Spreadsheet has been stored and can be downloaded from the Original tab.`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Extract text content from the file
    const extractedContent = await extractTextFromFile(file);
    
    // Create file content for AI processing
    let contentForAI: string;
    
    if (file.type.startsWith('image/')) {
      // For images, extract just the actual text content for AI analysis
      const textLines = extractedContent.split('\n');
      let actualText = '';
      
      // Find the extracted text section
      const extractedTextIndex = textLines.findIndex(line => line.includes('📄 Extracted Text:'));
      if (extractedTextIndex !== -1 && extractedTextIndex + 1 < textLines.length) {
        // Get everything after "📄 Extracted Text:" until the end or next section
        actualText = textLines.slice(extractedTextIndex + 1)
          .join('\n')
          .replace(/✨[\s\S]*$/, '') // Remove the final AI enhancement note
          .trim();
      }
      
      // If we found actual text, use it for AI analysis
      if (actualText && actualText.length > 10) {
        contentForAI = `File Name: ${file.name}
File Type: Image (${file.type})
File Size: ${(file.size / 1024).toFixed(2)} KB

Content extracted from image:
${actualText}

Note: This text was extracted from an image using OCR technology.`;
      } else {
        // Fallback to original method if no text was extracted
        contentForAI = `File Name: ${file.name}
File Type: ${file.type}
File Size: ${(file.size / 1024).toFixed(2)} KB

Extracted Content:
${extractedContent}`;
      }
    } else if (file.type === 'application/pdf') {
      // For PDF files, extract just the actual content for AI analysis
      const textLines = extractedContent.split('\n');
      let actualText = '';
      
      // Find the extracted content section
      const extractedContentIndex = textLines.findIndex(line => line.includes('📖 Extracted Content:'));
      if (extractedContentIndex !== -1 && extractedContentIndex + 1 < textLines.length) {
        // Get everything after "📖 Extracted Content:" 
        actualText = textLines.slice(extractedContentIndex + 1)
          .join('\n')
          .trim();
      }
      
      // If we found actual text, use it for AI analysis, otherwise use full content
      if (actualText && actualText.length > 10) {
        contentForAI = `File Name: ${file.name}
File Type: PDF Document
File Size: ${(file.size / 1024).toFixed(2)} KB

Extracted text content:
${actualText}

Note: This text was extracted from a PDF document.`;
      } else {
        // Fallback for PDFs with minimal content
        contentForAI = `File Name: ${file.name}
File Type: ${file.type}
File Size: ${(file.size / 1024).toFixed(2)} KB

Extracted Content:
${extractedContent}`;
      }
    } else {
      // For other file types, use the original method
      contentForAI = `File Name: ${file.name}
File Type: ${file.type}
File Size: ${(file.size / 1024).toFixed(2)} KB

Extracted Content:
${extractedContent}`;
    }

    // Run the AI flow on the extracted content
    const aiResult = await summarizeAndExtractTasksFlow(contentForAI);
    
    let thumbnail: string | null = null;
    let attribution: string | null = null;

    for (const tag of aiResult.tags) {
      try {
        const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(tag)}&per_page=1&client_id=gimrSzEa49LqETfxKS2vN1GBYLkpAUO60pdkl5IfPQ8`);
        if (response.ok) {
          const data = await response.json();
          if (data.results.length > 0) {
            const image = data.results[0];
            thumbnail = image.urls.regular;
            attribution = `Photo by <a href="${image.user.links.html}" target="_blank" rel="noopener noreferrer">${image.user.name}</a> on <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>`;
            break; // Found an image, so stop searching
          }
        }
      } catch (error) {
        console.error(`Failed to fetch image for tag "${tag}" from Unsplash`, error);
      }
    }

    // Create the knowledge item
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const newItem = {
      id: new Date().toISOString(),
      ...aiResult,
      tasks: aiResult.tasks.map((task: { text: string }) => ({
        ...task,
        id: crypto.randomUUID(),
        completed: false
      })),
      thumbnail: thumbnail || 'https://source.unsplash.com/400x200/?abstract,pattern',
      attribution: attribution || `File uploaded: ${file.name}`,
      source: 'File Upload',
      originalContent: extractedContent,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      createdAt: new Date().toISOString(),
      userEmail: session.user.email,
      fileData: buffer.toString('base64'),
    };
    
    addItem(newItem);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error processing uploaded file:', error);
    return NextResponse.json({ 
      error: 'Failed to process uploaded file', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

