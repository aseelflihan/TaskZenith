// src/lib/firebase-admin.ts

import * as admin from 'firebase-admin';

// هذا الجزء يتحقق من وجود المتغيرات قبل محاولة استخدامها
// مما يمنع الأخطاء غير الواضحة في المستقبل.
if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  // هذا الخطأ سيوقف التطبيق ويخبرك بالضبط ما هي المشكلة
  throw new Error(
    'Firebase Admin credentials are not set in .env.local. Please provide FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
  );
}

// هذا الشرط يمنع تهيئة التطبيق أكثر من مرة، وهو أمر مهم في بيئة التطوير
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // هذا السطر هو الأهم: يقوم بإصلاح تنسيق المفتاح الخاص
        // عن طريق استبدال السلسلة النصية '\\n' بأسطر جديدة حقيقية '\n'
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin SDK initialized successfully from environment variables.');
  } catch (error) {
    console.error('🔥🔥🔥 Firebase Admin SDK initialization failed:', error);
  }
}

// تصدير الخدمات التي تحتاجها في باقي أجزاء التطبيق
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();