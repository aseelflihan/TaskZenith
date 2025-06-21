// D:\applications\tasks\TaskZenith\src\app\auth\signin\page.tsx
// -- FINAL CORRECTED CODE FOR LOADING SYNC --

"use client";

import { useState } from "react";
import { getAuth, signInWithEmailAndPassword, sendSignInLinkToEmail } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadingOverlay } from "@/components/auth/LoadingOverlay";

export default function SignInPage() {
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

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
        const nextAuthResponse = await signIn('credentials', {
          idToken,
          redirect: false,
        });

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
    if (!email) {
      setError("Please enter your email to receive a magic link.");
      return;
    }
    setIsMagicLinkLoading(true);
    setError(null);
    setSuccess(null);

    const auth = getAuth(app);
    const actionCodeSettings = {
      url: `${window.location.origin}/auth/verify-email`,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setSuccess("A sign-in link has been sent to your email.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsMagicLinkLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const isFormDisabled = isPasswordLoading || isMagicLinkLoading || isGoogleLoading;
  const isOverlayVisible = isPasswordLoading || isGoogleLoading;

  return (
    <>
      <LoadingOverlay 
        isLoading={isOverlayVisible} 
        text="Signing in, please wait..."
      />
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md shadow-lg border-gray-200 dark:border-gray-800">
          <CardHeader className="text-center p-6">
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground pt-2">Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {error && <Alert variant="destructive" className="mb-4"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert variant="default" className="mb-4"><AlertTitle>Success</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>}
            
            <form className="space-y-4" onSubmit={handlePasswordSignIn}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isFormDisabled} placeholder="m@example.com" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/auth/forgot-password" className="text-sm font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={isFormDisabled} />
              </div>
              <Button type="submit" className="w-full" disabled={isFormDisabled || !password}>
                {isPasswordLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                Sign In with Password
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
            </div>
            
            <div className="space-y-3">
              <Button onClick={handleMagicLinkSignIn} className="w-full" variant="secondary" disabled={isFormDisabled}>
                {isMagicLinkLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Mail className="mr-2 h-4 w-4" />}
                Send Magic Link
              </Button>
              <Button onClick={handleGoogleSignIn} className="w-full" variant="outline" disabled={isFormDisabled}>
                {isGoogleLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                {!isGoogleLoading && 
                  <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#E94235"></path>
                      <path fill="none" d="M1 1h22v22H1z"></path>
                  </svg>
                }
                Sign In with Google
              </Button>
            </div>
          </CardContent>
          <CardFooter className="p-6 justify-center">
              <p className="text-sm text-muted-foreground">
                  Don't have an account? <Link href="/auth/signup" className="font-semibold text-primary hover:underline">Sign up</Link>
              </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}