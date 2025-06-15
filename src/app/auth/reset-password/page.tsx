// D:\applications\tasks\4\src\app\auth\reset-password\page.tsx

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [oobCode, setOobCode] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get('oobCode');
        if (!code) {
            setError("Invalid password reset link. The code is missing.");
            setIsLoading(false);
            return;
        }

        const auth = getAuth(app);
        verifyPasswordResetCode(auth, code)
            .then(() => {
                setOobCode(code);
                setIsLoading(false);
            })
            .catch((err) => {
                setError("The link is invalid or has expired. Please request a new one.");
                setIsLoading(false);
            });
    }, [searchParams]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!oobCode) {
            setError("An error occurred. Missing reset code.");
            return;
        }

        setIsLoading(true);
        setError(null);
        
        const auth = getAuth(app);
        try {
            await confirmPasswordReset(auth, oobCode, password);
            setSuccess("Your password has been reset successfully! You can now sign in.");
            setTimeout(() => router.push('/auth/signin'), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    if (error && !oobCode) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <form onSubmit={handleReset} className="space-y-4">
            {success && <div className="text-green-600">{success}</div>}
            {error && <div className="text-red-500">{error}</div>}
            
            {!success && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Reset Password"}
                    </Button>
                </>
            )}
        </form>
    );
}


export default function ResetPasswordPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold">Set a New Password</CardTitle>
                    <CardDescription>Enter and confirm your new password below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div className="flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                      <ResetPasswordForm />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}