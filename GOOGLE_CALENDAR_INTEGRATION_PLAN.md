# خطة تنفيذ تكامل تقويم جوجل (Google Calendar)

## 1. الهدف

إضافة خاصية تسمح للمستخدمين بإضافة المهام المستخرجة من `SmartTaskGenerator` مباشرة إلى تقويم جوجل الخاص بهم. يجب أن تتضمن العملية طلب المصادقة لمرة واحدة وحفظ الجلسة للاستخدامات المستقبلية.

## 2. نظرة عامة على الحل

سيتم تنفيذ الحل على ثلاث مراحل رئيسية:

1.  **إعداد الواجهة الخلفية (Backend):** تعديل إعدادات `NextAuth.js` لطلب صلاحيات الوصول إلى تقويم جوجل والتعامل مع `access_token` و `refresh_token`.
2.  **إنشاء نقطة نهاية API:** بناء واجهة برمجة تطبيقات (API endpoint) آمنة تكون مسؤولة عن إنشاء الأحداث في تقويم جوجل نيابة عن المستخدم.
3.  **تطوير واجهة المستخدم (Frontend):** إضافة زر "إضافة إلى تقويم جوجل" في المكون `TaskPreviewModal` وربطه بالـ API الجديدة.

---

## 3. مخطط سير العمل المقترح

```mermaid
graph TD
    subgraph Frontend (TaskPreviewModal)
        A[المستخدم يرى مهمة مع تاريخ] --> B[الضغط على زر "Add to Google Calendar"];
        B --> C{هل المستخدم متصل ومصادق عليه للتقويم؟};
        C -- لا --> D[استدعاء signIn('google')];
        C -- نعم --> E[استدعاء دالة handleAddToCalendar];
        E --> F[إرسال طلب POST إلى /api/calendar/create-event];
        F --> G[إظهار حالة التحميل];
        G --> H{تم إنشاء الحدث؟};
        H -- نعم --> I[إظهار رسالة نجاح Toast];
        H -- لا --> J[إظهار رسالة خطأ Toast];
    end

    subgraph Authentication (NextAuth.js)
        D --> K[إعادة توجيه المستخدم إلى صفحة موافقة جوجل];
        K --> L[المستخدم يمنح صلاحية الوصول للتقويم];
        L --> M[NextAuth يستقبل access_token و refresh_token];
        M --> N[تخزين التوكنز في JWT الخاص بالمستخدم];
    end

    subgraph Backend API
        F --> O[POST /api/calendar/create-event];
        O --> P[التحقق من جلسة المستخدم (Session)];
        P --> Q[الحصول على access_token من الجلسة];
        Q --> R[استخدام مكتبة googleapis لإنشاء حدث];
        R --> S[إرجاع استجابة نجاح أو خطأ];
        S --> H;
    end

    style Frontend fill:#E3F2FD,stroke:#333,stroke-width:2px
    style Authentication fill:#FFF3E0,stroke:#333,stroke-width:2px
    style "Backend API" fill:#E8F5E9,stroke:#333,stroke-width:2px
```

---

## 4. خطوات التنفيذ التفصيلية

### الخطوة الأولى: إعداد الواجهة الخلفية (Backend)

**الملف المستهدف:** [`src/lib/auth.ts`](src/lib/auth.ts)

1.  **تحديث صلاحيات Google Provider:**
    -   سنضيف صلاحية الوصول إلى التقويم (`calendar.events`) إلى قائمة الصلاحيات المطلوبة.
    -   سنقوم بتعيين `access_type: "offline"` و `prompt: "consent"` لضمان الحصول على `refresh_token` في المرة الأولى التي يوافق فيها المستخدم، مما يسمح للتطبيق بالوصول إلى التقويم دون الحاجة إلى إعادة المصادقة في كل مرة.

2.  **تعديل `jwt` Callback:**
    -   سيتم تعديل هذا الـ callback لحفظ `accessToken`, `refreshToken`, و `accessTokenExpires` في الـ JWT token.
    -   سيتم إضافة منطق للتحقق من صلاحية `accessToken`. إذا كان منتهي الصلاحية، سيتم استخدام `refreshToken` للحصول على `accessToken` جديد من جوجل تلقائيًا (Token Rotation).

3.  **تعديل `session` Callback:**
    -   سيتم تعديل هذا الـ callback لإرفاق `accessToken` بكائن الجلسة (session object)، مما يجعله متاحًا للاستخدام في نقاط نهاية الـ API المحمية.

### الخطوة الثانية: إنشاء نقطة نهاية API للتقويم

**ملف جديد:** [`src/app/api/calendar/create-event/route.ts`](src/app/api/calendar/create-event/route.ts)

1.  **إنشاء `POST` Route:**
    -   سيتم إنشاء دالة `POST` محمية تتحقق من وجود جلسة مستخدم صالحة.
2.  **استقبال بيانات المهمة:**
    -   ستستقبل الدالة `title`, `startTime`, `endTime` من جسم الطلب (request body).
3.  **التفاعل مع Google Calendar API:**
    -   سيتم استخدام مكتبة `googleapis` الرسمية.
    -   سيتم تهيئة عميل OAuth2 باستخدام `accessToken` الخاص بالمستخدم (المأخوذ من الجلسة).
    -   سيتم استدعاء دالة `calendar.events.insert` لإنشاء الحدث في التقويم الأساسي للمستخدم.
4.  **معالجة الأخطاء:**
    -   سيتم إرجاع استجابة خطأ واضحة في حالة فشل إنشاء الحدث.

### الخطوة الثالثة: تطوير واجهة المستخدم (Frontend)

**الملف المستهدف:** [`src/components/knowledge-hub/TaskPreviewModal.tsx`](src/components/knowledge-hub/TaskPreviewModal.tsx)

1.  **إضافة زر "Add to Google Calendar":**
    -   سيتم إضافة زر جديد بجوار كل مهمة تحتوي على تاريخ.
    -   سيتم استخدام أيقونة تقويم جوجل لتمييز الزر.
2.  **التحقق من حالة المصادقة:**
    -   سيتم استخدام `useSession` hook من `next-auth/react` للتحقق مما إذا كان المستخدم قد سجل دخوله عبر جوجل.
    -   سيظهر الزر فقط إذا كان المستخدم مسجلاً دخوله عبر جوجل.
3.  **إنشاء دالة `handleAddToCalendar`:**
    -   عند النقر على الزر، سيتم استدعاء هذه الدالة.
    -   ستقوم الدالة بتنسيق بيانات المهمة (العنوان، وقت البدء، وقت الانتهاء).
    -   ستقوم بإجراء طلب `fetch` إلى نقطة النهاية `/api/calendar/create-event`.
    -   ستعرض رسالة `toast` للمستخدم لإعلامه بنجاح العملية أو فشلها.

## 5. المتطلبات البيئية

-   يجب إضافة `GOOGLE_CLIENT_ID` و `GOOGLE_CLIENT_SECRET` إلى متغيرات البيئة (`.env.local`). (موجودة بالفعل ولكن يجب التأكد من تفعيل Google Calendar API في Google Cloud Console لنفس المشروع).

بهذه الخطة، نضمن تنفيذ الميزة بشكل آمن وفعال، مع توفير تجربة مستخدم سلسة.