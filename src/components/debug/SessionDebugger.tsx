// Debug helper to monitor session state
"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function SessionDebugger() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('🔐 Session Debug:', {
      status,
      hasSession: !!session,
      hasUser: !!session?.user,
      hasAccessToken: !!session?.accessToken,
      userEmail: session?.user?.email,
      sessionError: session?.error,
      sessionKeys: session ? Object.keys(session) : []
    });

    if (session?.error) {
      console.warn('🚨 Session has error:', session.error);
    }

    if (session?.accessToken) {
      console.log('✅ Access token present in session');
    } else {
      console.warn('⚠️ No access token in session');
    }
  }, [session, status]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white text-xs p-2 rounded opacity-50 z-50">
      Session: {status} | Token: {session?.accessToken ? '✅' : '❌'}
    </div>
  );
}
