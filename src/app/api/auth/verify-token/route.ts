// src/app/api/auth/verify-token/route.ts
import { adminAuth } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (!decodedToken?.uid) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userRecord = await adminAuth.getUser(decodedToken.uid);

    return NextResponse.json({
      id: userRecord.uid,
      name: userRecord.displayName,
      email: userRecord.email,
      image: userRecord.photoURL,
    });
  } catch (error) {
    console.error('Firebase ID Token validation error in API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}