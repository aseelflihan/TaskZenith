"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError(null);
    const result = await signIn("google", { callbackUrl: "/", redirect: false });
    if (result?.error) {
      setError("Google sign in failed. Please try again.");
      setIsLoading(false);
    } else if (result?.url) {
      window.open(result.url, "_blank", "width=500,height=600,noopener,noreferrer");
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Account creation failed.");
      setSuccess("Account created successfully! A verification email has been sent to your email address.");
      setName(""); setEmail(""); setPassword(""); setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <UserPlus className="w-6 h-6" />
            Create Account
          </CardTitle>
          <CardDescription>
            You can create a new account using your email or Google account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="default" className="mb-4">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <form className="space-y-4" onSubmit={handleEmailSignup}>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : null}
              Create Account
            </Button>
          </form>
          <div className="my-4 text-center text-muted-foreground">or</div>
          <Button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-2"
            disabled={isLoading}
            variant="outline"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" className="inline-block"><g><path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303C33.962 32.083 29.418 35 24 35c-6.065 0-11-4.935-11-11s4.935-11 11-11c2.507 0 4.813.857 6.661 2.278l6.366-6.366C33.527 6.527 28.977 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20c11.045 0 19.799-8.955 19.799-20 0-1.341-.138-2.651-.388-3.917z"/><path fill="#34A853" d="M6.306 14.691l6.571 4.819C14.655 16.108 19.004 13 24 13c2.507 0 4.813.857 6.661 2.278l6.366-6.366C33.527 6.527 28.977 4 24 4c-7.732 0-14.313 4.41-17.694 10.691z"/><path fill="#FBBC05" d="M24 44c5.318 0 10.13-1.824 13.885-4.965l-6.415-5.26C29.418 35 24 35 18.697 32.083l-6.391 5.228C13.87 42.176 18.682 44 24 44z"/><path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303c-1.937 4.083-6.481 7-11.303 7-6.065 0-11-4.935-11-11s4.935-11 11-11c2.507 0 4.813.857 6.661 2.278l6.366-6.366C33.527 6.527 28.977 4 24 4c-7.732 0-14.313 4.41-17.694 10.691z"/></g></svg>
            Sign up with Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-center text-sm space-y-2">
          <p>
            Already have an account? {" "}
            <Link href="/auth/signin" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}