"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IdentityVerification } from '@/components/onboarding/identity-verification';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { updateProfessionalVerificationPacket, getProfessionalByVerificationToken } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function VerificationPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const token = params.token as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [professional, setProfessional] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setError('Invalid verification link');
                setIsLoading(false);
                return;
            }

            try {
                const prof = await getProfessionalByVerificationToken(token) as any;
                if (prof) {
                    setProfessional(prof);
                    // Check if already verified
                    if (prof.verificationPacket) {
                        setIsSubmitted(true);
                    }
                } else {
                    setError('This verification link is invalid or has expired');
                }
            } catch (err) {
                console.error('Error validating token:', err);
                setError('Failed to validate verification link');
            } finally {
                setIsLoading(false);
            }
        };

        validateToken();
    }, [token]);

    const handleVerificationComplete = async (imageData: string) => {
        if (!professional) return;

        setIsSubmitting(true);
        try {
            const success = await updateProfessionalVerificationPacket(professional.id, imageData);

            if (success) {
                setIsSubmitted(true);
                toast({
                    title: 'Verification submitted!',
                    description: 'Your identity verification has been submitted for review.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Submission failed',
                    description: 'Failed to submit verification. Please try again.',
                });
            }
        } catch (err) {
            console.error('Error submitting verification:', err);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'An error occurred. Please try again later.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-accent" />
                    <p className="text-muted-foreground">Validating verification link...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <CardTitle>Verification Link Invalid</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground mb-4">
                            If you believe this is an error, please contact support or request a new verification link.
                        </p>
                        <Link href="/">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Go to Homepage
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Already submitted state
    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <CardTitle>Verification Complete!</CardTitle>
                        <CardDescription>
                            Your identity verification has been submitted successfully.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Our team will review your verification as part of your account approval process.
                            You will be notified once your account is approved.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Link href="/dashboard/professional">
                                <Button className="w-full">Go to Dashboard</Button>
                            </Link>
                            <Link href="/">
                                <Button variant="outline" className="w-full">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Go to Homepage
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Verification form
    return (
        <div className="min-h-screen bg-background p-4 py-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="font-headline text-3xl font-bold">CareStint</h1>
                    <p className="text-muted-foreground">
                        Welcome, {professional?.fullName}! Please complete your identity verification.
                    </p>
                </div>

                {/* Verification Component */}
                <IdentityVerification
                    onComplete={handleVerificationComplete}
                    isLoading={isSubmitting}
                />

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground">
                    Having trouble? Contact our support team at{' '}
                    <a href="mailto:support@carestint.com" className="text-accent hover:underline">
                        support@carestint.com
                    </a>
                </p>
            </div>
        </div>
    );
}
