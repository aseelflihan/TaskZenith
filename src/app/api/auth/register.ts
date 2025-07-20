import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { sendVerificationEmail } from "@/lib/email";

// قاعدة بيانات وهمية (استبدلها بقاعدة بياناتك الفعلية)
const users: any[] = [];

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ message: "جميع الحقول مطلوبة." }, { status: 400 });
    }
    // تحقق إذا كان المستخدم موجود مسبقًا
    if (users.find((u) => u.email === email)) {
      return NextResponse.json({ message: "البريد الإلكتروني مستخدم بالفعل." }, { status: 400 });
    }
    // تشفير كلمة المرور
    const hashedPassword = await hash(password, 10);
    // إنشاء المستخدم (في قاعدة البيانات)
    const user = { name, email, password: hashedPassword, verified: false };
    users.push(user);
    // إرسال رسالة التحقق
    await sendVerificationEmail(email);
    return NextResponse.json({ message: "تم إنشاء الحساب بنجاح! تم إرسال رسالة تأكيد إلى بريدك الإلكتروني." });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "حدث خطأ أثناء إنشاء الحساب." }, { status: 500 });
  }
}
