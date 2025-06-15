// D:\applications\tasks\4\src\app\auth\verify-email\page.tsx

"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { signIn } from 'next-auth/react';
import { app } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

function VerifyEmailComponent() {
  const router = useRouter();
  const [message, setMessage] = useState('Verifying your email, please wait...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeSignIn = async () => {
      const auth = getAuth(app);
      const email = window.localStorage.getItem('emailForSignIn');

      if (!isSignInWithEmailLink(auth, window.location.href)) {
        setError("Invalid or expired link. Please request a new one.");
        return;
      }
      
      if (!email) {
        setError("Could not find your email. Please try signing in from the same browser you used to request the link.");
        return;
      }

      try {
        const result = await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem('emailForSignIn');

        if (result.user) {
          setMessage("Firebase sign-in successful. Creating application session...");
          const idToken = await result.user.getIdToken();

          const nextAuthResponse = await signIn('credentials', {
            idToken,
            redirect: false,
          });
          
          if (nextAuthResponse?.ok) {
            setMessage("Session created. Redirecting...");
            router.push('/');
          } else {
            setError(nextAuthResponse?.error || "Failed to create an application session.");
          }
        }
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
      }
    };

    completeSignIn();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      {!error && <Loader2 className="w-12 h-12 animate-spin mb-4" />}
      <h1 className="text-xl font-semibold">{error ? "Sign-in Error" : "Verifying..."}</h1>
      <p className="text-muted-foreground mt-2">{error || message}</p>
    </div>
  );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailComponent />
        </Suspense>
    );
}