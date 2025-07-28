import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { google } from 'googleapis';
import { z } from 'zod';

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  startTime: z.string().datetime("Invalid start time format"),
  endTime: z.string().datetime("Invalid end time format"),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  console.log('🗓️ =============================================================');
  console.log('🗓️ Google Calendar Event Creation - Starting');
  console.log('🗓️ =============================================================');
  
  try {
    const session = await getServerSession(authOptions);
    console.log('🔐 Session check:', {
      hasSession: !!session,
      hasAccessToken: !!session?.accessToken,
      hasUser: !!session?.user,
      userEmail: session?.user?.email
    });

    if (!session || !session.accessToken) {
      console.error('❌ Authentication failed - No session or access token');
      return NextResponse.json({ 
        error: 'Not authenticated or access token missing',
        details: 'Please sign in with Google and grant calendar permissions'
      }, { status: 401 });
    }

    const body = await req.json();
    console.log('📝 Request body received:', {
      title: body.title,
      startTime: body.startTime,
      endTime: body.endTime,
      hasNotes: !!body.notes
    });
    
    const validation = createEventSchema.safeParse(body);

    if (!validation.success) {
      console.error('❌ Validation failed:', validation.error.flatten());
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validation.error.flatten() 
      }, { status: 400 });
    }

    const { title, startTime, endTime, notes } = validation.data;

    console.log('🔧 Setting up OAuth2 client...');
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });

    console.log('📅 Initializing Google Calendar API...');
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Parse and validate dates
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);
    
    console.log('📅 Event details:', {
      title,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      duration: (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60), // minutes
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    const event = {
      summary: title,
      description: notes || 'Event created from TaskZenith Knowledge Hub.',
      start: {
        dateTime: startTime,
        timeZone: 'UTC', // Explicitly set timezone
      },
      end: {
        dateTime: endTime,
        timeZone: 'UTC', // Explicitly set timezone
      },
    };

    console.log('🚀 Creating calendar event...');
    const { data } = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    
    console.log('✅ Event created successfully:', {
      eventId: data.id,
      htmlLink: data.htmlLink,
      created: data.created
    });

    return NextResponse.json({ 
      message: 'Event created successfully', 
      event: data,
      eventUrl: data.htmlLink 
    }, { status: 201 });

  } catch (error: any) {
    console.error('💥 =============================================================');
    console.error('💥 Google Calendar Event Creation - ERROR');
    console.error('💥 =============================================================');
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data
    });
    
    // Check for specific Google API errors
    if (error.response?.data?.error) {
        const googleError = error.response.data.error;
        console.error('Google API Error:', {
          code: googleError.code,
          message: googleError.message,
          status: googleError.status
        });
        
        // Handle specific error codes
        if (googleError.code === 403) {
          return NextResponse.json({ 
            error: 'Calendar Access Denied', 
            details: 'Please ensure Google Calendar API is enabled and you have granted calendar permissions.',
            code: googleError.code,
            action: 'reauth'
          }, { status: 403 });
        }
        
        if (googleError.code === 401) {
          return NextResponse.json({ 
            error: 'Authentication Token Invalid', 
            details: 'Your Google authentication has expired. Please sign in again.',
            code: googleError.code,
            action: 'reauth'
          }, { status: 401 });
        }
        
        return NextResponse.json({
            error: 'Google API Error',
            details: googleError.message,
            code: googleError.code
        }, { status: googleError.code || 500 });
    }

    return NextResponse.json({ 
      error: 'Failed to create event', 
      details: error instanceof Error ? error.message : 'An unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}