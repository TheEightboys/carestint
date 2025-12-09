"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { Loader2, ShieldX, ShieldCheck, Lock, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/clientApp";

// SuperAdmin password (in production, this should be handled by Firebase Auth)
const SUPERADMIN_PIN = "CareStint@2024";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, userRole, isLoading: authLoading } = useUser();
    const [isVerified, setIsVerified] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [adminPin, setAdminPin] = useState("");
    const [error, setError] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [step, setStep] = useState<"login" | "pin">("login");

    useEffect(() => {
        // If user is logged in and is superadmin, go to PIN step
        if (!authLoading && user && userRole === "superadmin") {
            setStep("pin");
        } else if (!authLoading && user && userRole !== "superadmin" && userRole !== null) {
            // User is logged in but not superadmin - redirect
            setError("Access denied. SuperAdmin privileges required.");
        }
    }, [user, userRole, authLoading]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoggingIn(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Auth state change will be handled by useUser hook
        } catch (err: any) {
            console.error("Login error:", err);
            if (err.code === "auth/invalid-credential") {
                setError("Invalid email or password");
            } else if (err.code === "auth/user-not-found") {
                setError("No account found with this email");
            } else {
                setError("Login failed. Please try again.");
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handlePinVerification = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminPin === SUPERADMIN_PIN) {
            setIsVerified(true);
        } else {
            setError("Invalid admin PIN. Access denied.");
        }
    };

    // Loading state
    if (authLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-accent" />
                    <p className="text-muted-foreground">Verifying credentials...</p>
                </div>
            </div>
        );
    }

    // Not logged in - show login form
    if (!user) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
                <Card className="w-full max-w-md glass-card border-accent/20">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                            <ShieldCheck className="h-8 w-8 text-accent" />
                        </div>
                        <CardTitle className="font-headline text-2xl">SuperAdmin Login</CardTitle>
                        <CardDescription>
                            Enter your admin credentials to access the dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@carestint.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoggingIn}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoggingIn}
                                />
                            </div>
                            {error && (
                                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                                    <ShieldX className="h-4 w-4" />
                                    {error}
                                </div>
                            )}
                            <Button type="submit" className="w-full" disabled={isLoggingIn}>
                                {isLoggingIn ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Sign In
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Logged in but not superadmin
    if (userRole !== "superadmin") {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
                <Card className="w-full max-w-md border-destructive/50">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
                            <ShieldX className="h-8 w-8 text-destructive" />
                        </div>
                        <CardTitle className="font-headline text-2xl text-destructive">
                            Access Denied
                        </CardTitle>
                        <CardDescription>
                            You don&apos;t have SuperAdmin privileges to access this area.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">
                            Please sign in with a SuperAdmin account or contact your administrator.
                        </p>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push("/")}
                        >
                            Return to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // SuperAdmin needs to verify with PIN
    if (!isVerified) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
                <Card className="w-full max-w-md glass-card border-accent/20">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                            <KeyRound className="h-8 w-8 text-accent" />
                        </div>
                        <CardTitle className="font-headline text-2xl">Admin Verification</CardTitle>
                        <CardDescription>
                            Enter your admin PIN to continue to the dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePinVerification} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="pin">Admin PIN</Label>
                                <Input
                                    id="pin"
                                    type="password"
                                    placeholder="Enter admin PIN"
                                    value={adminPin}
                                    onChange={(e) => setAdminPin(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            {error && (
                                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                                    <ShieldX className="h-4 w-4" />
                                    {error}
                                </div>
                            )}
                            <Button type="submit" className="w-full">
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Verify & Continue
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                Logged in as: {user.email}
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Verified - show children
    return <>{children}</>;
}
