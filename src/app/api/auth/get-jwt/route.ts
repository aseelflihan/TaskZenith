// src/app/api/auth/get-jwt/route.ts
import { adminAuth } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const firebaseUser = await adminAuth.getUserByEmail(email);
    return NextResponse.json({ id: firebaseUser.uid });

  } catch (error) {
    console.error('Error fetching firebase user in API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}