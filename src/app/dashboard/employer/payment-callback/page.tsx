"use client";

/**
 * Payment Callback Page
 * 
 * Handles redirect after card payment completion.
 * Verifies payment status and shows result.
 */

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPaymentIntent, verifyPayment } from '@/lib/flutterwave-service';
import type { PaymentIntent } from '@/lib/types';

function PaymentCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const intentId = searchParams.get('intent');
    const status = searchParams.get('status');
    const txRef = searchParams.get('tx_ref');
    const transactionId = searchParams.get('transaction_id');

    const [isLoading, setIsLoading] = useState(true);
    const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending'>('pending');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function verifyPaymentStatus() {
            if (!intentId) {
                setError('Missing payment information');
                setIsLoading(false);
                return;
            }

            try {
                // Get payment intent
                const intent = await getPaymentIntent(intentId);
                if (!intent) {
                    setError('Payment not found');
                    setIsLoading(false);
                    return;
                }
                setPaymentIntent(intent);

                // Check if already completed
                if (intent.status === 'success') {
                    setPaymentStatus('success');
                    setIsLoading(false);
                    return;
                }

                if (intent.status === 'failed') {
                    setPaymentStatus('failed');
                    setError(intent.failureReason || 'Payment failed');
                    setIsLoading(false);
                    return;
                }

                // Verify with Flutterwave if we have a reference
                if (txRef || intent.flutterwaveRef) {
                    const verification = await verifyPayment(txRef || intent.flutterwaveRef || '');

                    if (verification.success && verification.status === 'successful') {
                        setPaymentStatus('success');
                    } else {
                        setPaymentStatus('failed');
                        setError('Payment verification failed');
                    }
                } else {
                    // Check status from URL params
                    if (status === 'successful' || status === 'completed') {
                        setPaymentStatus('success');
                    } else if (status === 'failed' || status === 'cancelled') {
                        setPaymentStatus('failed');
                        setError('Payment was ' + status);
                    } else {
                        setPaymentStatus('pending');
                    }
                }
            } catch (err) {
                console.error('Error verifying payment:', err);
                setError('Failed to verify payment status');
            } finally {
                setIsLoading(false);
            }
        }

        verifyPaymentStatus();
    }, [intentId, status, txRef]);

    const handleGoToDashboard = () => {
        router.push('/dashboard/employer/stints');
    };

    const handleRetryPayment = () => {
        // Go back to stints page where they can try again
        router.push('/dashboard/employer/stints');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin mx-auto text-accent" />
                            <div>
                                <h2 className="text-xl font-semibold">Verifying Payment</h2>
                                <p className="text-sm text-muted-foreground">Please wait...</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    {paymentStatus === 'success' ? (
                        <>
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                <CheckCircle className="h-10 w-10 text-green-500" />
                            </div>
                            <CardTitle className="text-green-600">Payment Successful!</CardTitle>
                            <CardDescription>Your shift has been confirmed</CardDescription>
                        </>
                    ) : (
                        <>
                            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                                <XCircle className="h-10 w-10 text-destructive" />
                            </div>
                            <CardTitle className="text-destructive">Payment Failed</CardTitle>
                            <CardDescription>{error || 'Something went wrong'}</CardDescription>
                        </>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {paymentIntent && paymentStatus === 'success' && (
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Amount Paid</span>
                                <span className="font-semibold">
                                    {paymentIntent.currency} {paymentIntent.amount.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Professional</span>
                                <span>{paymentIntent.professionalName}</span>
                            </div>
                            {paymentIntent.flutterwaveRef && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Reference</span>
                                    <span className="font-mono text-xs">{paymentIntent.flutterwaveRef}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {paymentStatus === 'success' ? (
                        <Button onClick={handleGoToDashboard} className="w-full">
                            Go to My Stints
                        </Button>
                    ) : (
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleGoToDashboard} className="flex-1">
                                Back to Dashboard
                            </Button>
                            <Button onClick={handleRetryPayment} className="flex-1">
                                Try Again
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Loading fallback for Suspense
function PaymentCallbackLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto text-accent" />
                        <div>
                            <h2 className="text-xl font-semibold">Loading...</h2>
                            <p className="text-sm text-muted-foreground">Please wait</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Main page component with Suspense boundary
export default function PaymentCallbackPage() {
    return (
        <Suspense fallback={<PaymentCallbackLoading />}>
            <PaymentCallbackContent />
        </Suspense>
    );
}
