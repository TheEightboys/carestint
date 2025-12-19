"use client";

/**
 * Acceptance Payment Modal
 * 
 * Shows when employer clicks "Accept Professional" on a stint.
 * Requires payment (M-Pesa or Card) before confirming the shift.
 */

import { useState, useEffect } from 'react';
import {
    Loader2,
    Smartphone,
    CreditCard,
    CheckCircle,
    AlertCircle,
    Clock,
    User,
    MapPin,
    Calendar,
    Receipt,
    X,
    FlaskConical
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
    createPaymentIntent,
    initiateMpesaPayment,
    initiateCardPayment,
    cancelPaymentIntent,
    calculateFees,
    getPaymentIntent,
} from '@/lib/flutterwave-service';
import type { PaymentIntent } from '@/lib/types';

interface StintDetails {
    id: string;
    role: string;
    shiftDate: Date;
    startTime: string;
    endTime: string;
    city: string;
    offeredRate: number;
    currency: string;
    employerName: string;
}

interface ApplicationDetails {
    id: string;
    professionalId: string;
    professionalName: string;
    bidAmount?: number;
}

interface AcceptancePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPaymentSuccess: () => void;
    stint: StintDetails | null;
    application: ApplicationDetails | null;
    employerId: string;
    employerEmail: string;
}

type PaymentStep = 'confirm' | 'payment' | 'processing' | 'success' | 'error';

export function AcceptancePaymentModal({
    isOpen,
    onClose,
    onPaymentSuccess,
    stint,
    application,
    employerId,
    employerEmail,
}: AcceptancePaymentModalProps) {
    const { toast } = useToast();

    // State
    const [step, setStep] = useState<PaymentStep>('confirm');
    const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
    const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);

    // M-Pesa fields
    const [phoneNumber, setPhoneNumber] = useState('');

    // Calculate fees
    const amount = application?.bidAmount || stint?.offeredRate || 0;
    const fees = calculateFees(amount, stint?.currency || 'KES');

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setStep('confirm');
            setPaymentIntent(null);
            setError(null);
            setPhoneNumber('');
            setCountdown(0);
        }
    }, [isOpen]);

    // Countdown timer for pending M-Pesa
    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (step === 'processing' && paymentMethod === 'mpesa' && countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [step, paymentMethod, countdown]);

    // Poll for payment status during M-Pesa
    useEffect(() => {
        let pollTimer: ReturnType<typeof setInterval>;
        if (step === 'processing' && paymentIntent && paymentMethod === 'mpesa') {
            pollTimer = setInterval(async () => {
                const updated = await getPaymentIntent(paymentIntent.id);
                if (updated?.status === 'success') {
                    setStep('success');
                    clearInterval(pollTimer);
                } else if (updated?.status === 'failed') {
                    setError(updated.failureReason || 'Payment failed');
                    setStep('error');
                    clearInterval(pollTimer);
                }
            }, 3000);
        }
        return () => clearInterval(pollTimer);
    }, [step, paymentIntent, paymentMethod]);

    const handleProceedToPayment = async () => {
        if (!stint || !application) return;

        setIsProcessing(true);
        setError(null);

        try {
            // Create payment intent
            const intent = await createPaymentIntent({
                stintId: stint.id,
                applicationId: application.id,
                employerId,
                professionalId: application.professionalId,
                professionalName: application.professionalName,
                amount: fees.totalAmount,
                currency: stint.currency,
            });

            setPaymentIntent(intent);
            setStep('payment');
        } catch (err) {
            console.error('Error creating payment intent:', err);
            setError('Failed to initialize payment. Please try again.');
            setStep('error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMpesaPayment = async () => {
        if (!paymentIntent || !phoneNumber) return;

        setIsProcessing(true);
        setError(null);

        try {
            const result = await initiateMpesaPayment(
                paymentIntent.id,
                phoneNumber,
                employerEmail
            );

            if (result.success) {
                setStep('processing');
                setCountdown(120); // 2 minutes to enter PIN
                toast({
                    title: "STK Push Sent",
                    description: "Check your phone and enter your M-Pesa PIN",
                });
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Failed to initiate M-Pesa payment');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCardPayment = async () => {
        if (!paymentIntent) return;

        setIsProcessing(true);
        setError(null);

        try {
            const redirectUrl = `${window.location.origin}/dashboard/employer/payment-callback?intent=${paymentIntent.id}`;
            const result = await initiateCardPayment(
                paymentIntent.id,
                employerEmail,
                redirectUrl
            );

            if (result.success && result.paymentLink) {
                // Redirect to Flutterwave payment page
                window.location.href = result.paymentLink;
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Failed to initiate card payment');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = async () => {
        if (paymentIntent && ['initiated', 'pending'].includes(paymentIntent.status)) {
            await cancelPaymentIntent(paymentIntent.id);
        }
        onClose();
    };

    const handleClose = () => {
        if (step === 'success') {
            onPaymentSuccess();
        }
        onClose();
    };

    // TEST MODE: Simulate successful payment for testing
    const handleTestPayment = async () => {
        if (!stint || !application) return;

        setIsProcessing(true);
        setError(null);

        try {
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Import firestore functions for direct stint update
            const { updateStint, updateApplicationStatus, acceptStint } = await import('@/lib/firebase/firestore');

            // Update application status to accepted
            await updateApplicationStatus(application.id, 'accepted');

            // Accept the stint with this professional
            await acceptStint(stint.id, application.professionalId, application.professionalName);

            // Update stint to confirmed status
            await updateStint(stint.id, {
                status: 'confirmed',
                confirmedAt: new Date(),
            });

            toast({
                title: "✅ Test Payment Successful",
                description: "Shift confirmed! (Test Mode - No real payment made)",
            });

            setStep('success');
        } catch (err) {
            console.error('Test payment error:', err);
            setError('Test payment simulation failed');
            setStep('error');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatPhoneNumber = (value: string) => {
        // Remove non-digits
        const cleaned = value.replace(/\D/g, '');
        // Format for Kenya (07XX XXX XXX)
        if (cleaned.length <= 4) return cleaned;
        if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)}`;
    };

    if (!stint || !application) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {step === 'success' ? (
                            <>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                Payment Successful
                            </>
                        ) : (
                            <>
                                <Receipt className="h-5 w-5 text-accent" />
                                Pay to Confirm Shift
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'confirm' && 'Review and confirm your selection'}
                        {step === 'payment' && 'Choose your payment method'}
                        {step === 'processing' && 'Processing your payment...'}
                        {step === 'success' && 'Your shift has been confirmed!'}
                        {step === 'error' && 'There was an issue with your payment'}
                    </DialogDescription>
                </DialogHeader>

                {/* Step 1: Confirm Selection */}
                {step === 'confirm' && (
                    <div className="space-y-4">
                        {/* Professional Info */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                            <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                                <User className="h-6 w-6 text-accent" />
                            </div>
                            <div>
                                <p className="font-semibold">{application.professionalName}</p>
                                <p className="text-sm text-muted-foreground">{stint.role}</p>
                            </div>
                            <Badge className="ml-auto">Selected</Badge>
                        </div>

                        {/* Shift Details */}
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {format(stint.shiftDate, 'EEEE, MMMM d, yyyy')}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {stint.startTime} - {stint.endTime}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                {stint.city}
                            </div>
                        </div>

                        <Separator />

                        {/* Cost Breakdown */}
                        <div className="space-y-2">
                            <p className="font-medium">Cost Breakdown</p>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Shift Amount</span>
                                    <span>{stint.currency} {fees.shiftAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Booking Fee (15%)</span>
                                    <span>{stint.currency} {fees.bookingFee.toLocaleString()}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-semibold text-base">
                                    <span>You Pay</span>
                                    <span className="text-accent">{stint.currency} {fees.totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-green-600 text-xs">
                                    <span>Professional Receives (~)</span>
                                    <span>{stint.currency} {fees.professionalPayout.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>


                        {/* Important Notice */}
                        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
                            <p className="text-yellow-600 dark:text-yellow-400">
                                <strong>Important:</strong> The shift will only be confirmed after successful payment.
                                The professional will be notified once payment is complete.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={onClose} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={handleProceedToPayment} disabled={isProcessing} className="flex-1">
                                {isProcessing ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...</>
                                ) : (
                                    <>Proceed to Payment</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Payment Method */}
                {step === 'payment' && (
                    <div className="space-y-4">
                        {/* Amount Display */}
                        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10">
                            <p className="text-sm text-muted-foreground">Amount to Pay</p>
                            <p className="text-3xl font-bold gradient-text">
                                {stint.currency} {fees.totalAmount.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Payment expires in 15 minutes
                            </p>
                        </div>

                        {/* Payment Method Tabs */}
                        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'mpesa' | 'card')}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="mpesa" className="flex items-center gap-2">
                                    <Smartphone className="h-4 w-4" />
                                    M-Pesa
                                </TabsTrigger>
                                <TabsTrigger value="card" className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Card
                                </TabsTrigger>
                            </TabsList>

                            {/* M-Pesa Form */}
                            <TabsContent value="mpesa" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">M-Pesa Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="0712 345 678"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                                        disabled={isProcessing}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        You will receive an STK push on this number
                                    </p>
                                </div>

                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
                                    <p className="font-medium text-green-600 dark:text-green-400 mb-1">
                                        How it works:
                                    </p>
                                    <ol className="list-decimal ml-4 space-y-1 text-muted-foreground text-xs">
                                        <li>Enter your M-Pesa number and click "Pay Now"</li>
                                        <li>Check your phone for the STK Push prompt</li>
                                        <li>Enter your M-Pesa PIN to confirm</li>
                                        <li>Wait for confirmation</li>
                                    </ol>
                                </div>

                                <Button
                                    className="w-full"
                                    onClick={handleMpesaPayment}
                                    disabled={isProcessing || phoneNumber.replace(/\s/g, '').length < 10}
                                >
                                    {isProcessing ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending STK Push...</>
                                    ) : (
                                        <>Pay {stint.currency} {fees.totalAmount.toLocaleString()} with M-Pesa</>
                                    )}
                                </Button>
                            </TabsContent>

                            {/* Card Form */}
                            <TabsContent value="card" className="space-y-4 mt-4">
                                <div className="p-4 rounded-lg bg-muted/50 border text-center">
                                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        You will be redirected to a secure payment page
                                    </p>
                                </div>

                                <Button
                                    className="w-full"
                                    onClick={handleCardPayment}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting...</>
                                    ) : (
                                        <>Pay {stint.currency} {fees.totalAmount.toLocaleString()} with Card</>
                                    )}
                                </Button>
                            </TabsContent>
                        </Tabs>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-destructive">Payment Error</p>
                                    <p className="text-xs text-muted-foreground">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Cancel Button */}
                        <Button variant="outline" onClick={handleCancel} className="w-full">
                            Cancel
                        </Button>

                        {/* TEST MODE SECTION */}
                        <div className="mt-4 p-4 rounded-lg border-2 border-dashed border-orange-500/50 bg-orange-500/5">
                            <div className="flex items-center gap-2 mb-2">
                                <FlaskConical className="h-4 w-4 text-orange-500" />
                                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                    Test Mode (No API Keys)
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                                Use this to test the payment flow without real Flutterwave integration.
                                This will confirm the shift without actual payment.
                            </p>
                            <Button
                                variant="outline"
                                onClick={handleTestPayment}
                                disabled={isProcessing}
                                className="w-full border-orange-500/50 text-orange-600 hover:bg-orange-500/10"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                                ) : (
                                    <><FlaskConical className="mr-2 h-4 w-4" /> Simulate Successful Payment</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}


                {/* Step 3: Processing (M-Pesa) */}
                {step === 'processing' && (
                    <div className="py-8 text-center space-y-6">
                        <div className="relative mx-auto w-20 h-20">
                            <div className="absolute inset-0 rounded-full border-4 border-accent/20 animate-pulse" />
                            <div className="absolute inset-2 rounded-full bg-accent/10 flex items-center justify-center">
                                <Smartphone className="h-8 w-8 text-accent" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold">Check Your Phone</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Enter your M-Pesa PIN when prompted
                            </p>
                        </div>

                        {countdown > 0 && (
                            <div className="text-2xl font-mono font-bold text-accent">
                                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Waiting for payment confirmation...
                        </div>

                        <Button variant="outline" onClick={handleCancel}>
                            Cancel Payment
                        </Button>
                    </div>
                )}

                {/* Step 4: Success */}
                {step === 'success' && (
                    <div className="py-8 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="h-10 w-10 text-green-500" />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-green-600">Shift Confirmed!</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {application.professionalName} has been notified
                            </p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Transaction ID</span>
                                <span className="font-mono">{paymentIntent?.flutterwaveRef || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Amount Paid</span>
                                <span className="font-semibold">{stint.currency} {fees.totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Shift Date</span>
                                <span>{format(stint.shiftDate, 'PP')}</span>
                            </div>
                        </div>

                        <Button onClick={handleClose} className="w-full">
                            Done
                        </Button>
                    </div>
                )}

                {/* Step 5: Error */}
                {step === 'error' && (
                    <div className="py-8 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                            <AlertCircle className="h-10 w-10 text-destructive" />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-destructive">Payment Failed</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {error || 'Something went wrong with your payment'}
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={handleCancel} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={() => setStep('payment')} className="flex-1">
                                Try Again
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
