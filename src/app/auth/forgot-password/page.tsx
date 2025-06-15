// D:\applications\tasks\4\src\app\auth\forgot-password\page.tsx

"use client";

import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, KeyRound, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const auth = getAuth(app);
    const actionCodeSettings = {
      url: `${window.location.origin}/auth/reset-password`,
      handleCodeInApp: true,
    };
    
    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setSuccess("A password reset link has been sent to your email. Please check your inbox and spam folder.");
    } catch (err: any) {
      // Provide user-friendly error messages
      if (err.code === 'auth/user-not-found') {
        setError("No account found with that email address.");
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg border-gray-200 dark:border-gray-800">
        <CardHeader className="text-center p-6">
          <CardTitle className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
            <KeyRound className="h-8 w-8" />
            Forgot Password
          </CardTitle>
          <CardDescription className="text-muted-foreground pt-2">
            No worries, we'll send you reset instructions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {error && <Alert variant="destructive" className="mb-4"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          {success && <Alert variant="default" className="mb-4"><AlertTitle>Success!</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>}
          
          <form className="space-y-4" onSubmit={handlePasswordReset}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                disabled={isLoading || !!success} // Disable after success
                placeholder="m@example.com"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !!success}>
              {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              Send Reset Link
            </Button>
          </form>
        </CardContent>
        <CardFooter className="p-6 justify-center">
            <Link href="/auth/signin" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}