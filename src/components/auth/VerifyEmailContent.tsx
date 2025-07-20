"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailCheck, AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { auth } from '@/lib/firebase'; // Firebase client SDK
import { sendEmailVerification, type AuthError, type User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const { toast } = useToast();
  const [displayEmail, setDisplayEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (email) {
      setDisplayEmail(decodeURIComponent(email));
    } else if (!user) {
      const timer = setTimeout(() => {
        // router.push('/auth/signin');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [email, user, router]);

  const handleResendVerificationEmail = async () => {
    if (!user) {
      setResendError("You need to be logged in to resend the verification email. Please sign in and try again if your email is not verified.");
      toast({
        title: "Error",
        description: "No user currently signed in.",
        variant: "destructive",
      });
      return;
    }
    if (user.emailVerified) {
        toast({
            title: "Email Already Verified",
            description: "Your email address is already verified.",
        });
        return;
    }

    setIsResending(true);
    setResendError(null);
    try {
      await sendEmailVerification(user);
      toast({
        title: "Verification Email Resent",
        description: `A new verification email has been sent to ${user.email}.`,
      });
    } catch (e) {
      const firebaseError = e as AuthError;
      console.error("Error resending verification email:", firebaseError);
      const errorMessage = firebaseError.message || "Failed to resend verification email. Please try again.";
      setResendError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-xl text-center">
        <CardHeader>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
            <MailCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to{" "}
            <span className="font-semibold text-foreground">
              {displayEmail || user?.email || "your email address"}
            </span>.
            Please click the link in that email to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            If you don't see the email, please check your spam folder.
            Once verified, you can sign in.
          </p>
           {resendError && (
            <Alert variant="destructive" className="mt-4 text-left">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Resend Failed</AlertTitle>
              <AlertDescription>{resendError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button onClick={handleResendVerificationEmail} disabled={isResending || !user || user.emailVerified} className="w-full" variant="outline">
            {isResending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MailCheck className="mr-2 h-4 w-4" />
            )}
            Resend Verification Email
          </Button>
          <Button asChild className="w-full">
            <Link href="/auth/signin">Go to Sign In</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Wrong email? <Link href="/auth/signup" className="underline hover:text-primary">Sign up again</Link>.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}