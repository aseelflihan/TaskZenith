// src/app/api/auth/handle-signin/route.ts
import { adminAuth } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { user } = await request.json();
    if (!user || !user.email) {
      return NextResponse.json({ error: 'User data is required' }, { status: 400 });
    }

    try {
      await adminAuth.getUserByEmail(user.email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        await adminAuth.createUser({
          uid: user.id,
          email: user.email,
          displayName: user.name,
          photoURL: user.image,
          emailVerified: true,
        });
      } else {
        throw error; // Re-throw other errors
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SignIn handling error in API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}