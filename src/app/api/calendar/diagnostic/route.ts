import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  console.log('🔍 Google Calendar API Diagnostic - Starting');
  
  try {
    const session = await getServerSession(authOptions);
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      session: {
        exists: !!session,
        hasUser: !!session?.user,
        hasAccessToken: !!session?.accessToken,
        userEmail: session?.user?.email || null,
        error: session?.error || null
      },
      environment: {
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL || null
      },
      apiTest: null as any
    };

    if (session?.accessToken) {
      try {
        // Test Google Calendar API access
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: session.accessToken });
        
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        // Try to list calendars to test API access
        const calendarsResponse = await calendar.calendarList.list();
        
        diagnostics.apiTest = {
          success: true,
          calendarsCount: calendarsResponse.data.items?.length || 0,
          primaryCalendar: calendarsResponse.data.items?.find(cal => cal.primary),
          error: null
        };
        
      } catch (apiError: any) {
        diagnostics.apiTest = {
          success: false,
          error: {
            message: apiError.message,
            code: apiError.code,
            status: apiError.response?.status,
            details: apiError.response?.data?.error
          }
        };
      }
    }

    return NextResponse.json(diagnostics, { status: 200 });
    
  } catch (error: any) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({ 
      error: 'Diagnostic failed',
      details: error.message 
    }, { status: 500 });
  }
}
