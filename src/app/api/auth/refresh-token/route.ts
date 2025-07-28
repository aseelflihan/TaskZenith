import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('🔄 Forcing token refresh for user:', session.user.email);

    // This will trigger the refresh token logic in the JWT callback
    // by checking if the access token has "expired" (we force it to be expired)
    const forceRefresh = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Cookie': req.headers.get('cookie') || ''
      }
    });

    if (!forceRefresh.ok) {
      throw new Error('Failed to refresh session');
    }

    const refreshedSession = await forceRefresh.json();

    return NextResponse.json({ 
      message: 'Token refresh attempted',
      hasAccessToken: !!refreshedSession?.accessToken,
      sessionError: refreshedSession?.error
    });

  } catch (error: any) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh token',
      details: error.message 
    }, { status: 500 });
  }
}
