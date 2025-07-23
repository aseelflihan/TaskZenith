# 🖼️ OCR Text Extraction Feature

## 📋 Overview
تم تطوير ميزة استخراج النص من الصور باستخدام تقنيات OCR المتقدمة مع تحسينات AI.

## ✨ Features
- **🔧 OCR متعدد المستويات**: نظام احتياطي مع عدة طرق OCR
- **🤖 تحسين بالذكاء الاصطناعي**: تصحيح وتحسين النص المستخرج
- **🌍 دعم متعدد اللغات**: العربية والإنجليزية
- **📊 معاينة الصور**: عرض الصور قبل المعالجة
- **⚡ معالجة محسنة**: تحسين الصور قبل OCR
- **🛡️ معالجة الأخطاء**: نظام احتياطي قوي

## 🔧 Technical Implementation

### OCR Methods
1. **Advanced Tesseract.js**: OCR رئيسي مع دعم العربية والإنجليزية
2. **Basic Detection**: نظام احتياطي للنصوص البسيطة
3. **Future: Google Vision**: دعم مستقبلي لـ Google Cloud Vision

### Image Processing Pipeline
```typescript
Image Upload → Preprocessing → OCR → AI Enhancement → Result
```

### Image Preprocessing
- تغيير الحجم (max 1200px)
- تحسين التباين
- تحديد الوضوح
- تحويل للرمادي
- ضغط PNG

### AI Enhancement
- تصحيح الأخطاء الإملائية
- تحسين تنسيق النص
- كشف اللغة
- تحسين علامات الترقيم

## 📱 User Interface

### Upload Panel
- معاينة الصور مع إشارة "OCR Ready"
- شريط تقدم المعالجة
- رسائل حالة مفصلة

### Results Display
- معدل الثقة (Confidence Level)
- الطريقة المستخدمة
- اللغة المكتشفة
- التحسينات المطبقة
- النص المستخرج والمحسن

## 🚀 Usage

### For Users
1. اختر صورة تحتوي على نص
2. اسحب وأفلت أو اضغط "Upload File"
3. شاهد المعاينة والتقييم
4. انتظر معالجة OCR
5. راجع النص المستخرج والمحسن

### Best Practices for Images
- ✅ استخدم صور عالية الجودة
- ✅ تأكد من وضوح النص
- ✅ تجنب الخطوط المائلة
- ✅ تباين جيد بين النص والخلفية
- ❌ تجنب الصور الضبابية
- ❌ لا تستخدم صور أكبر من 5MB

## 🔧 Configuration

### Environment Variables
```env
# OCR Settings
OCR_MAX_FILE_SIZE=5242880  # 5MB
OCR_TIMEOUT=30000          # 30 seconds
OCR_LANGUAGES=ara+eng      # Arabic + English
```

### Supported Formats
- PNG
- JPG/JPEG
- GIF
- WebP
- BMP
- TIFF

## 📊 Performance

### Processing Times
- Small images (< 1MB): 3-10 seconds
- Medium images (1-3MB): 10-20 seconds
- Large images (3-5MB): 20-30 seconds

### Accuracy Rates
- High-contrast text: 90-95%
- Normal quality: 70-85%
- Low quality/handwriting: 40-60%

## 🛠️ Troubleshooting

### Common Issues
1. **"Module not found" errors**: إعادة تشغيل الخادم
2. **Memory allocation failed**: تقليل حجم الصورة
3. **OCR timeout**: تحسين جودة الصورة
4. **Poor text quality**: استخدام صور أعلى تباين

### Error Messages
- `Array buffer allocation failed`: الصورة كبيرة جداً
- `OCR timeout`: انتظار طويل، جرب صورة أصغر
- `Worker not found`: مشكلة في Tesseract.js

## 🔄 Updates & Maintenance

### Recent Changes
- ✅ إصلاح مشاكل Tesseract.js worker
- ✅ إضافة نظام OCR احتياطي
- ✅ تحسين معالجة الأخطاء
- ✅ تحسين واجهة المستخدم
- ✅ إضافة تحسينات AI

### Future Enhancements
- 🔮 دعم Google Cloud Vision API
- 🔮 معالجة PDFs مصورة
- 🔮 OCR للغات إضافية
- 🔮 تحسين دقة النصوص العربية
- 🔮 معالجة دفعية للصور

## 📝 API Documentation

### Upload Endpoint
```typescript
POST /api/knowledge/upload
Content-Type: multipart/form-data

Body: FormData with 'file' field
Response: {
  id: string;
  title: string;
  summary: string;
  originalContent: string; // OCR result
  // ... other fields
}
```

### OCR Result Format
```typescript
interface OCRResult {
  method: string;           // OCR method used
  confidence: number;       // 0-100
  text: string;            // Extracted text
  language: string;        // Detected language
  improvements: string[];  // AI improvements
}
```

## 🎯 Success Metrics
- **استخراج النص**: ✅ يعمل للصور عالية الجودة
- **تحسين AI**: ✅ يصحح الأخطاء الشائعة
- **دعم العربية**: ✅ يدعم النصوص العربية
- **معالجة الأخطاء**: ✅ نظام احتياطي قوي
- **واجهة المستخدم**: ✅ معاينة وتقدم واضح
