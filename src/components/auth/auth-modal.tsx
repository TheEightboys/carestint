"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, Mail, Lock, User, CheckCircle2, RefreshCw } from 'lucide-react';
import { auth } from '@/lib/firebase/clientApp';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { getEmployerByEmail, getProfessionalByEmail, getUserAccountByEmail } from '@/lib/firebase/firestore';

export type UserType = 'employer' | 'professional';
type AuthMode = 'signin' | 'signup' | 'verification-pending';

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userType: UserType;
  defaultMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onOpenChange, userType, defaultMode = 'signin' }: AuthModalProps) {
  const { toast } = useToast();
  const [authMode, setAuthMode] = useState<AuthMode>(defaultMode);
  const [pendingEmail, setPendingEmail] = useState('');

  // Update authMode when defaultMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setAuthMode(defaultMode);
    }
  }, [defaultMode, isOpen]);

  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Email/Password Sign Up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if email is already registered with a different role
      const existingUser = await getUserAccountByEmail(email);

      if (existingUser) {
        // Determine the existing user's role from their profiles
        const hasEmployerRole = !!existingUser.employerId;
        const hasProfessionalRole = !!existingUser.professionalId;
        const existingRole = hasEmployerRole ? 'employer' : (hasProfessionalRole ? 'professional' : existingUser.activeRole);

        if (existingRole && existingRole !== userType) {
          const roleLabel = existingRole === 'employer' ? 'an Employer' : 'a Healthcare Professional';
          toast({
            variant: 'destructive',
            title: 'Email already registered',
            description: `This email is already registered as ${roleLabel}. Please sign in as ${roleLabel} instead, or use a different email.`,
          });
          setIsLoading(false);
          return;
        } else {
          // Same role - they should login instead
          toast({
            variant: 'destructive',
            title: 'Account exists',
            description: 'An account with this email already exists. Please sign in instead.',
          });
          setIsLoading(false);
          return;
        }
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with display name
      if (fullName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName: fullName });
      }

      // Send email verification
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
      }

      // Show verification pending state
      setPendingEmail(email);
      setAuthMode('verification-pending');

      toast({
        title: 'Verification email sent!',
        description: 'Please check your inbox (and spam/junk folder) and verify your email to continue.',
      });
    } catch (error: any) {
      console.error('Sign up error:', error);
      let message = 'Failed to create account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (error.code === 'auth/configuration-not-found') {
        message = 'Firebase Email/Password auth is not enabled. Please enable it in the Firebase Console → Authentication → Sign-in method.';
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Email/Password sign-in is not enabled. Please enable it in Firebase Console.';
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

  // Email Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if user is registered with a different role before sign-in
      const existingUser = await getUserAccountByEmail(email);

      if (existingUser) {
        const hasEmployerRole = !!existingUser.employerId;
        const hasProfessionalRole = !!existingUser.professionalId;
        const existingRole = hasEmployerRole ? 'employer' : (hasProfessionalRole ? 'professional' : existingUser.activeRole);

        if (existingRole && existingRole !== userType) {
          const roleLabel = existingRole === 'employer' ? 'an Employer' : 'a Healthcare Professional';
          toast({
            variant: 'destructive',
            title: 'Wrong account type',
            description: `This email is registered as ${roleLabel}. Please sign in as ${roleLabel} instead.`,
          });
          setIsLoading(false);
          return;
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        setPendingEmail(email);
        setAuthMode('verification-pending');
        toast({
          variant: 'destructive',
          title: 'Email not verified',
          description: 'Please verify your email before signing in.',
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: 'Welcome back!',
        description: 'Redirecting to your dashboard...',
      });

      window.location.href = `/dashboard/${userType}`;
    } catch (error: any) {
      console.error('Sign in error:', error);
      let message = 'Failed to sign in. Please try again.';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Please check and try again.';
      } else if (error.code === 'auth/configuration-not-found') {
        message = 'Firebase Email/Password auth is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method.';
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Email/Password sign-in is not enabled. Please enable it in Firebase Console.';
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

  // Resend Verification Email
  const handleResendVerification = async () => {
    if (!auth.currentUser) {
      // Try to sign in first to get the user object
      try {
        setIsResending(true);
        const userCredential = await signInWithEmailAndPassword(auth, pendingEmail, password);
        await sendEmailVerification(userCredential.user);
        toast({
          title: 'Verification email sent!',
          description: 'Please check your inbox.',
        });
      } catch {
        toast({
          variant: 'destructive',
          title: 'Could not resend',
          description: 'Please try signing in again.',
        });
      } finally {
        setIsResending(false);
      }
      return;
    }

    try {
      setIsResending(true);
      await sendEmailVerification(auth.currentUser);
      toast({
        title: 'Verification email sent!',
        description: 'Please check your inbox.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to send email',
        description: 'Please wait a moment and try again.',
      });
    } finally {
      setIsResending(false);
    }
  };

  // Check verification and continue
  const handleContinueAfterVerification = async () => {
    setIsLoading(true);
    try {
      // Reload user to get fresh emailVerified status
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          // Check if user already has a profile in Firestore
          const userEmail = auth.currentUser.email || pendingEmail;

          if (userType === 'employer') {
            const existingEmployer = await getEmployerByEmail(userEmail);
            if (existingEmployer) {
              toast({
                title: 'Welcome back!',
                description: 'Redirecting to your dashboard...',
              });
              window.location.href = '/dashboard/employer';
              return;
            }
          } else {
            const existingProfessional = await getProfessionalByEmail(userEmail);
            if (existingProfessional) {
              toast({
                title: 'Welcome back!',
                description: 'Redirecting to your dashboard...',
              });
              window.location.href = '/dashboard/professional';
              return;
            }
          }

          // No existing profile, redirect to onboarding
          toast({
            title: 'Email verified!',
            description: 'Redirecting to complete your profile...',
          });
          const redirectUrl = `/onboarding/${userType}?email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(fullName || auth.currentUser.displayName || '')}`;
          window.location.href = redirectUrl;
          return;
        }
      }

      toast({
        variant: 'destructive',
        title: 'Email not verified yet',
        description: 'Please click the verification link in your email.',
      });
    } catch (error) {
      console.error('Verification check error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please try signing in again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Password Reset
  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Email required',
        description: 'Please enter your email address first.',
      });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Reset email sent',
        description: 'Check your inbox for password reset instructions.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send reset email. Please check your email address.',
      });
    }
  };

  const handleModalClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setTimeout(() => {
        setEmail('');
        setPassword('');
        setFullName('');
        setPendingEmail('');
        setAuthMode(defaultMode);
      }, 300);
    }
  };

  const userTypeName = userType === 'employer' ? 'Employer / Facility' : 'Professional';
  const userTypeIcon = userType === 'employer' ? '🏥' : '👨‍⚕️';

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-md">
        {authMode === 'verification-pending' ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl flex items-center gap-2">
                <span>📧</span> Verify Your Email
              </DialogTitle>
              <DialogDescription>
                We've sent a verification link to <strong>{pendingEmail}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-6">
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Check your inbox</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Click the verification link in your email, then come back here and click "Continue" to complete your profile.
                </p>
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 max-w-xs">
                  <p className="text-xs font-medium">
                    📌 Can't find the email? Check your <strong>Spam</strong> or <strong>Junk</strong> folder!
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleContinueAfterVerification}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? 'Checking...' : 'I\'ve Verified - Continue'}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleResendVerification}
                  className="w-full"
                  disabled={isResending}
                >
                  {isResending ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Wrong email?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className="text-accent hover:underline"
                  >
                    Go back
                  </button>
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl flex items-center gap-2">
                <span>{userTypeIcon}</span>
                {authMode === 'signin' ? 'Sign in' : 'Sign up'} as {userTypeName}
              </DialogTitle>
              <DialogDescription>
                {authMode === 'signin'
                  ? 'Enter your email and password to continue.'
                  : 'Create a new account to get started.'}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              {authMode === 'signin' ? (
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
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
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                  <div className="flex flex-col gap-2 text-center text-sm">
                    <button type="button" onClick={handleForgotPassword} className="text-accent hover:underline">
                      Forgot password?
                    </button>
                    <p className="text-muted-foreground">
                      Don't have an account?{' '}
                      <button type="button" onClick={() => setAuthMode('signup')} className="text-accent hover:underline">
                        Sign up
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signupEmail" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signupPassword" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <Input
                      id="signupPassword"
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <User className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <button type="button" onClick={() => setAuthMode('signin')} className="text-accent hover:underline">
                      Sign in
                    </button>
                  </p>
                </form>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
