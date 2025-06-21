// D:\applications\tasks\TaskZenith\src\app\auth\signin\page.tsx
// -- ADDED AUTO-REDIRECT LOGIC WITHOUT REMOVING ANY EXISTING FEATURES --

"use client";

import { useState, useEffect } from "react"; // 1. useEffect is imported
import { getAuth, signInWithEmailAndPassword, sendSignInLinkToEmail } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession, signIn } from "next-auth/react"; // 2. useSession is imported
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadingOverlay } from "@/components/auth/LoadingOverlay";

export default function SignInPage() {
  // --- All your existing logic is preserved ---
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // --- NEW LOGIC FOR AUTO-REDIRECT ---
  // 3. Get the session status
  const { status } = useSession();

  // 4. useEffect to watch for status changes
  useEffect(() => {
    // If the session is confirmed to be authenticated, redirect to dashboard
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);
  // --- END OF NEW LOGIC ---

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPasswordLoading(true);
    setError(null);
    setSuccess(null);
    const auth = getAuth(app);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        const idToken = await userCredential.user.getIdToken();
        const nextAuthResponse = await signIn('credentials', { idToken, redirect: false });
        if (nextAuthResponse?.ok) {
          router.push('/dashboard');
        } else {
          setError(nextAuthResponse?.error || "Failed to create an application session.");
          setIsPasswordLoading(false);
        }
      }
    } catch (err: any) {
      setError(err.message);
      setIsPasswordLoading(false);
    }
  };
  
  const handleMagicLinkSignIn = async () => {
    if (!email) { setError("Please enter your email to receive a magic link."); return; }
    setIsMagicLinkLoading(true);
    setError(null); setSuccess(null);
    const auth = getAuth(app);
    const actionCodeSettings = { url: `${window.location.origin}/auth/verify-email`, handleCodeInApp: true };
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setSuccess("A sign-in link has been sent to your email.");
    } catch (err: any) { setError(err.message); } finally { setIsMagicLinkLoading(false); }
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const isFormDisabled = isPasswordLoading || isMagicLinkLoading || isGoogleLoading;
  const isOverlayVisible = isPasswordLoading || isGoogleLoading;
  // --- End of preserved logic ---


  // 5. While session status is loading, show a full-page loader to prevent form flash
  if (status === 'loading') {
    return <LoadingOverlay isLoading={true} text="Verifying session..." />;
  }
  
  // 6. Only if the user is unauthenticated, show the sign-in form.
  //    If authenticated, the useEffect above will redirect them.
  if (status === 'unauthenticated') {
    return (
      <>
        <LoadingOverlay isLoading={isOverlayVisible} text="Signing in, please wait..." />
        <Card className="w-full max-w-md bg-black/40 backdrop-blur-lg border-white/10 text-white shadow-2xl shadow-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-white/80 pt-1">
              Sign in to reach your productivity zenith.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <Alert variant="destructive" className="mb-4 bg-red-900/50 border-red-500/50 text-white"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert variant="default" className="mb-4 bg-green-900/50 border-green-500/50 text-white"><AlertTitle>Success</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>}
            
            <form className="space-y-4" onSubmit={handlePasswordSignIn}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isFormDisabled} placeholder="m@example.com" className="bg-black/30 border-white/20 placeholder:text-white/50 focus:border-primary focus:ring-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white/90">Password</Label>
                  <Link href="/auth/forgot-password" className="text-sm font-medium text-white/70 hover:text-white hover:underline">Forgot password?</Link>
                </div>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={isFormDisabled} className="bg-black/30 border-white/20 focus:border-primary focus:ring-primary" />
              </div>
              <Button type="submit" className="w-full" disabled={isFormDisabled || !password}>
                {isPasswordLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                Sign In with Password
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/20" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-black/40 px-2 text-white/60">Or continue with</span></div>
            </div>
            
            <div className="space-y-3">
              <Button onClick={handleGoogleSignIn} className="w-full bg-white/90 text-black hover:bg-white" variant="outline" disabled={isFormDisabled}>
                {isGoogleLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                {!isGoogleLoading && <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path><path fill="#E94235" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path></svg>}
                Sign In with Google
              </Button>
              <Button onClick={handleMagicLinkSignIn} className="w-full bg-transparent border border-white/20 hover:bg-white/10" variant="secondary" disabled={isFormDisabled}>
                {isMagicLinkLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Mail className="mr-2 h-4 w-4" />}
                Send Magic Link
              </Button>
            </div>
          </CardContent>
          <CardFooter className="justify-center pb-6">
            <p className="text-sm text-white/70">
                Don't have an account? <Link href="/auth/signup" className="font-semibold text-white hover:underline">Sign up</Link>
            </p>
          </CardFooter>
        </Card>
      </>
    );
  }

  // If status is not 'unauthenticated' (i.e., it's 'loading' or 'authenticated'),
  // show a loader. The useEffect will handle the redirect for the 'authenticated' case.
  return <LoadingOverlay isLoading={true} text="Verifying session..." />;
}