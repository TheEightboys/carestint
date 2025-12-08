"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { auth } from '@/lib/firebase/clientApp';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getSuperadminByEmail, addSuperadmin } from '@/lib/firebase/firestore';

type AuthMode = 'signin' | 'signup';

export default function SuperAdminLoginPage() {
    const { toast } = useToast();
    const [authMode, setAuthMode] = useState<AuthMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Super admin secret key for signup (should be environment variable in production)
    const SUPER_ADMIN_SECRET = 'carestint-superadmin-2024';

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // First check if user is a superadmin
            const superadmin = await getSuperadminByEmail(email);
            if (!superadmin) {
                toast({
                    variant: 'destructive',
                    title: 'Access Denied',
                    description: 'This account does not have SuperAdmin privileges.',
                });
                setIsLoading(false);
                return;
            }

            // Sign in with Firebase
            await signInWithEmailAndPassword(auth, email, password);

            toast({
                title: 'Welcome, SuperAdmin!',
                description: 'Redirecting to dashboard...',
            });

            window.location.href = '/dashboard/superadmin';
        } catch (error: any) {
            console.error('Sign in error:', error);
            let message = 'Failed to sign in. Please try again.';
            if (error.code === 'auth/user-not-found') {
                message = 'No account found with this email.';
            } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = 'Invalid email or password.';
            }
            toast({
                variant: 'destructive',
                title: 'Sign in failed',
                description: message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Validate secret key
        if (secretKey !== SUPER_ADMIN_SECRET) {
            toast({
                variant: 'destructive',
                title: 'Invalid Secret Key',
                description: 'The SuperAdmin secret key is incorrect.',
            });
            setIsLoading(false);
            return;
        }

        // Validate passwords match
        if (password !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Passwords do not match',
                description: 'Please ensure both passwords are the same.',
            });
            setIsLoading(false);
            return;
        }

        try {
            // Create Firebase auth account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Add to superadmins collection
            await addSuperadmin({
                email,
                uid: userCredential.user.uid,
                role: 'superadmin',
            });

            toast({
                title: 'SuperAdmin account created!',
                description: 'Redirecting to dashboard...',
            });

            window.location.href = '/dashboard/superadmin';
        } catch (error: any) {
            console.error('Sign up error:', error);
            let message = 'Failed to create account. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                message = 'This email is already registered.';
            } else if (error.code === 'auth/weak-password') {
                message = 'Password should be at least 6 characters.';
            }
            toast({
                variant: 'destructive',
                title: 'Sign up failed',
                description: message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
            <Card className="w-full max-w-md relative z-10 border-accent/20 bg-card/95 backdrop-blur">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 border border-accent/20">
                        <ShieldCheck className="h-8 w-8 text-accent" />
                    </div>
                    <div>
                        <CardTitle className="font-headline text-2xl">
                            {authMode === 'signin' ? 'SuperAdmin Access' : 'Create SuperAdmin'}
                        </CardTitle>
                        <CardDescription className="mt-2">
                            {authMode === 'signin'
                                ? 'Sign in to access the CareStint admin panel'
                                : 'Create a new SuperAdmin account'}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@carestint.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {authMode === 'signup' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="secretKey" className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4" />
                                        SuperAdmin Secret Key
                                    </Label>
                                    <Input
                                        id="secretKey"
                                        type="password"
                                        placeholder="Enter the secret key"
                                        value={secretKey}
                                        onChange={(e) => setSecretKey(e.target.value)}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Contact platform owner for the secret key
                                    </p>
                                </div>
                            </>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                    {authMode === 'signin' ? 'Signing in...' : 'Creating account...'}
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    {authMode === 'signin' ? 'Sign In as SuperAdmin' : 'Create SuperAdmin Account'}
                                </>
                            )}
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
                            {authMode === 'signin' ? (
                                <p>
                                    Need a SuperAdmin account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setAuthMode('signup')}
                                        className="text-accent hover:underline"
                                    >
                                        Sign up
                                    </button>
                                </p>
                            ) : (
                                <p>
                                    Already have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setAuthMode('signin')}
                                        className="text-accent hover:underline"
                                    >
                                        Sign in
                                    </button>
                                </p>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
