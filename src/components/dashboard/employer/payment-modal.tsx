"use client";

import { useState } from 'react';
import { Loader2, Smartphone, CreditCard, CheckCircle, AlertCircle, X, Receipt } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { processPayment, generateReceipt, type PaymentDetails, type PaymentResult } from '@/lib/payment-service';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    description?: string;
}

interface PaymentModalProps {
    invoice: Invoice | null;
    isOpen: boolean;
    onClose: () => void;
    onPaymentSuccess: () => void;
}

export function PaymentModal({ invoice, isOpen, onClose, onPaymentSuccess }: PaymentModalProps) {
    const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

    // M-Pesa fields
    const [phoneNumber, setPhoneNumber] = useState('');

    // Card fields
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cardHolderName, setCardHolderName] = useState('');

    const { toast } = useToast();

    const resetForm = () => {
        setPhoneNumber('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        setCardHolderName('');
        setPaymentResult(null);
        setIsProcessing(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        const groups = cleaned.match(/.{1,4}/g);
        return groups ? groups.join(' ').substr(0, 19) : cleaned;
    };

    const formatExpiry = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return cleaned.substr(0, 2) + '/' + cleaned.substr(2, 2);
        }
        return cleaned;
    };

    const handlePayment = async () => {
        if (!invoice) return;

        setIsProcessing(true);
        setPaymentResult(null);

        const paymentDetails: PaymentDetails = {
            invoiceId: invoice.id,
            amount: invoice.amount,
            currency: invoice.currency,
            paymentMethod,
            ...(paymentMethod === 'mpesa' ? { phoneNumber } : {
                cardNumber: cardNumber.replace(/\s/g, ''),
                cardExpiry,
                cardCvv,
                cardHolderName,
            }),
        };

        try {
            const result = await processPayment(paymentDetails);
            setPaymentResult(result);

            if (result.success) {
                toast({
                    title: "Payment Successful! ✓",
                    description: `Transaction ID: ${result.transactionId}`,
                });
                onPaymentSuccess();
            } else {
                toast({
                    variant: "destructive",
                    title: "Payment Failed",
                    description: result.message,
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Payment Error",
                description: "An unexpected error occurred. Please try again.",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadReceipt = () => {
        if (invoice && paymentResult?.success && paymentResult.transactionId) {
            generateReceipt(
                invoice.invoiceNumber,
                paymentResult.transactionId,
                invoice.amount,
                invoice.currency,
                paymentMethod,
                paymentResult.timestamp || new Date()
            );
        }
    };

    // Calculate amounts
    const platformFee = invoice ? Math.round(invoice.amount * 0.15) : 0;
    const totalAmount = invoice ? invoice.amount : 0;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-accent" />
                        Pay Invoice
                    </DialogTitle>
                    <DialogDescription>
                        {invoice ? `Invoice #${invoice.invoiceNumber}` : 'Select payment method'}
                    </DialogDescription>
                </DialogHeader>

                {/* Success State */}
                {paymentResult?.success ? (
                    <div className="py-8 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="h-10 w-10 text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-green-600">Payment Successful!</h3>
                            <p className="text-sm text-muted-foreground mt-1">{paymentResult.message}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Transaction ID</span>
                                <span className="font-mono font-medium">{paymentResult.transactionId}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" className="flex-1" onClick={handleDownloadReceipt}>
                                <Receipt className="h-4 w-4 mr-2" />
                                Download Receipt
                            </Button>
                            <Button className="flex-1" onClick={handleClose}>
                                Done
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Amount Summary */}
                        <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg p-4 mb-4">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">Amount to Pay</p>
                                <p className="text-3xl font-bold gradient-text">
                                    {invoice?.currency || 'KES'} {totalAmount.toLocaleString()}
                                </p>
                            </div>
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

                            {/* M-Pesa Payment Form */}
                            <TabsContent value="mpesa" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">M-Pesa Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="07XX XXX XXX"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        disabled={isProcessing}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        You will receive an STK push on this number
                                    </p>
                                </div>
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-600 dark:text-yellow-400">
                                    <p className="font-medium">How M-Pesa Payment Works:</p>
                                    <ol className="list-decimal ml-4 mt-1 space-y-1 text-xs">
                                        <li>Enter your M-Pesa registered phone number</li>
                                        <li>Click "Pay Now" to initiate payment</li>
                                        <li>Enter your M-Pesa PIN when prompted on your phone</li>
                                        <li>Wait for confirmation</li>
                                    </ol>
                                </div>
                            </TabsContent>

                            {/* Card Payment Form */}
                            <TabsContent value="card" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cardHolder">Cardholder Name</Label>
                                    <Input
                                        id="cardHolder"
                                        placeholder="John Doe"
                                        value={cardHolderName}
                                        onChange={(e) => setCardHolderName(e.target.value)}
                                        disabled={isProcessing}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cardNumber">Card Number</Label>
                                    <Input
                                        id="cardNumber"
                                        placeholder="1234 5678 9012 3456"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                        maxLength={19}
                                        disabled={isProcessing}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="expiry">Expiry Date</Label>
                                        <Input
                                            id="expiry"
                                            placeholder="MM/YY"
                                            value={cardExpiry}
                                            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                            maxLength={5}
                                            disabled={isProcessing}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cvv">CVV</Label>
                                        <Input
                                            id="cvv"
                                            type="password"
                                            placeholder="123"
                                            value={cardCvv}
                                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                            maxLength={4}
                                            disabled={isProcessing}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    Your payment is secure and encrypted
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Error Message */}
                        {paymentResult && !paymentResult.success && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-destructive">Payment Failed</p>
                                    <p className="text-xs text-muted-foreground">{paymentResult.message}</p>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handlePayment}
                                disabled={isProcessing || (paymentMethod === 'mpesa' && !phoneNumber) ||
                                    (paymentMethod === 'card' && (!cardNumber || !cardExpiry || !cardCvv))}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Pay {invoice?.currency || 'KES'} {totalAmount.toLocaleString()}
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
