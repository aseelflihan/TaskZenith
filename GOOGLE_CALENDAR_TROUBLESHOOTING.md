# 🔧 دليل إصلاح مشكلة Google Calendar في TaskZenith

## 📋 المشكلة
عندما يضغط المستخدم على "Add to Google Calendar" في Knowledge Hub، المهام لا تظهر في Google Calendar.

## 🔍 التشخيص والحلول

### 1. التحقق من Google Cloud Console
```bash
# تأكد من تفعيل Google Calendar API
1. اذهب إلى: https://console.cloud.google.com/
2. اختر مشروعك
3. في APIs & Services > Library
4. ابحث عن "Google Calendar API"
5. تأكد من أنه مُفعّل (Enabled)
```

### 2. التحقق من OAuth Scopes
```typescript
// في src/lib/auth.ts - تأكد من وجود scope:
scope: "openid profile email https://www.googleapis.com/auth/calendar.events"
```

### 3. التحقق من متغيرات البيئة
```bash
# في .env.local
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
```

### 4. خطوات التشخيص التفاعلي

#### في بيئة Development:
1. **افتح Knowledge Hub**
2. **اختر أي مهمة**
3. **اضغط على "🔍 Test Calendar"** (الزر سيظهر فقط في development mode)
4. **افحص console logs** للتشخيص التفصيلي

#### في Production:
1. **افتح Developer Tools (F12)**
2. **اذهب إلى Console tab**
3. **حاول إضافة مهمة للكالندر**
4. **افحص الرسائل المطبوعة**

### 5. الحلول حسب نوع المشكلة

#### مشكلة 401 (Unauthorized):
```typescript
// الحل: إعادة المصادقة
- اضغط على "Sign Out" 
- اضغط على "Sign In with Google"
- تأكد من منح permissions للكالندر
```

#### مشكلة 403 (Forbidden):
```typescript
// الحل: تحقق من API Settings
1. Google Calendar API غير مُفعّل
2. OAuth consent screen غير مُعدّ بشكل صحيح
3. المشروع غير مُعدّ للاستخدام الخارجي
```

#### مشكلة 400 (Bad Request):
```typescript
// الحل: تحقق من تنسيق البيانات
- تاريخ المهمة غير صحيح
- صيغة ISO 8601 مطلوبة
- التوقيت المحلي vs UTC
```

### 6. إصلاحات متقدمة

#### إعادة تعيين Token:
```typescript
// استخدم API route الجديد
fetch('/api/auth/refresh-token', { method: 'POST' })
```

#### فحص Session State:
```typescript
// في console
console.log('Session:', await fetch('/api/auth/session').then(r => r.json()));
```

#### اختبار API مباشرة:
```typescript
// اختبار calendar diagnostic
fetch('/api/calendar/diagnostic').then(r => r.json()).then(console.log);
```

### 7. التحقق من النتائج

#### نجح الإصلاح إذا:
- ✅ ظهرت رسالة "Event Added to Calendar"
- ✅ تغير لون الزر إلى "Added"
- ✅ ظهرت المهمة في Google Calendar خلال دقائق قليلة

#### فشل الإصلاح إذا:
- ❌ ظهرت رسالة خطأ
- ❌ لا تظهر المهمة في Google Calendar
- ❌ يظهر خطأ 401/403/400 في console

### 8. تشخيص اللحظة الآنية

```javascript
// نسخ والصق في console لتشخيص فوري
(async () => {
  console.log('🔍 تشخيص Google Calendar');
  
  // فحص Session
  const session = await fetch('/api/auth/session').then(r => r.json());
  console.log('Session:', session);
  
  // فحص Calendar API
  const diagnostic = await fetch('/api/calendar/diagnostic').then(r => r.json());
  console.log('Calendar Diagnostic:', diagnostic);
  
  // النتيجة
  const hasToken = !!session?.accessToken;
  const apiWorks = diagnostic?.apiTest?.success;
  
  console.log('📊 النتيجة:');
  console.log('✓ Token موجود:', hasToken);
  console.log('✓ API يعمل:', apiWorks);
  console.log('✓ جاهز للاستخدام:', hasToken && apiWorks);
})();
```

### 9. إعادة تعيين كاملة (آخر حل)

```bash
# إذا لم ينجح شيء:
1. احذف كل cookies المتعلقة بالموقع
2. Sign out كاملاً
3. أعد تشغيل الخادم
4. Sign in مرة أخرى مع Google
5. امنح permissions للكالندر مرة أخرى
```

## 📞 الدعم
إذا استمرت المشكلة بعد تطبيق جميع الحلول:
1. راجع logs الخادم
2. تحقق من Google Cloud Console errors
3. تأكد من صحة OAuth settings
4. اتصل بفريق الدعم مع تفاصيل الخطأ
