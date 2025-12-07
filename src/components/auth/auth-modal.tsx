
"use client";

import { useState } from 'react';
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
import { Loader2, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { auth } from '@/lib/firebase/clientApp';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

export type UserType = 'employer' | 'professional';
type AuthMode = 'signin' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userType: UserType;
}

export function AuthModal({ isOpen, onOpenChange, userType }: AuthModalProps) {
  const { toast } = useToast();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');

  // Email auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  // Email/Password Sign Up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with display name
      if (fullName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName: fullName });
      }

      toast({
        title: 'Account created!',
        description: 'Redirecting to complete your profile...',
      });

      const redirectUrl = `/onboarding/${userType}?email=${encodeURIComponent(email)}&name=${encodeURIComponent(fullName)}`;
      window.location.href = redirectUrl;
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

  // Email/Password Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

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
    } catch (error: any) {
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
        setAuthMode('signin');
      }, 300);
    }
  };

  const userTypeName = userType === 'employer' ? 'Employer / Facility' : 'Professional';
  const userTypeIcon = userType === 'employer' ? '🏥' : '👨‍⚕️';

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <span>{userTypeIcon}</span>
            {authMode === 'signin' ? 'Sign in' : 'Sign up'} as {userTypeName}
          </DialogTitle>
          <DialogDescription>
            {authMode === 'signin' ? 'Enter your email and password to continue.' : 'Create a new account to get started.'}
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
      </DialogContent>
    </Dialog>
  );
}
