"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Wallet,
    TrendingUp,
    Calendar,
    Download,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Phone,
    Building,
    CreditCard,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/lib/user-context";
import { getStintsByProfessional, updateProfessional, getProfessionalById } from "@/lib/firebase/firestore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface EarningsRecord {
    id: string;
    stintId: string;
    employerName: string;
    role: string;
    shiftDate: Date;
    shiftAmount: number;
    platformFee: number;
    netEarnings: number;
    status: 'pending' | 'processing' | 'paid' | 'failed';
    paidAt?: Date;
    paymentRef?: string;
}

// Kenya Bank List
const KENYA_BANKS = [
    { code: "01", name: "Kenya Commercial Bank" },
    { code: "02", name: "Standard Chartered Bank" },
    { code: "03", name: "Barclays Bank of Kenya" },
    { code: "07", name: "Commercial Bank of Africa" },
    { code: "10", name: "Prime Bank" },
    { code: "11", name: "Co-operative Bank of Kenya" },
    { code: "12", name: "National Bank of Kenya" },
    { code: "14", name: "Oriental Commercial Bank" },
    { code: "16", name: "Citibank N.A Kenya" },
    { code: "18", name: "Middle East Bank (K)" },
    { code: "19", name: "Bank of Africa Kenya" },
    { code: "23", name: "Consolidated Bank of Kenya" },
    { code: "25", name: "Credit Bank" },
    { code: "26", name: "Trans-National Bank" },
    { code: "31", name: "ABC Bank" },
    { code: "35", name: "Paramount Universal Bank" },
    { code: "39", name: "Equity Bank" },
    { code: "41", name: "Imperial Bank Kenya" },
    { code: "43", name: "NIC Bank" },
    { code: "49", name: "Bank of Baroda (K)" },
    { code: "54", name: "Victoria Commercial Bank" },
    { code: "57", name: "I&M Bank" },
    { code: "61", name: "First Community Bank" },
    { code: "63", name: "Diamond Trust Bank" },
    { code: "66", name: "Sidian Bank" },
    { code: "68", name: "Ecobank Kenya" },
    { code: "70", name: "Family Bank" },
    { code: "72", name: "Gulf African Bank" },
    { code: "74", name: "Spire Bank" },
    { code: "76", name: "Mayfair Bank" },
    { code: "78", name: "DIB Bank Kenya" },
    { code: "80", name: "M-Oriental Bank" },
];

export default function ProfessionalEarningsPage() {
    const { user, userProfile, dualRoleInfo } = useUser();
    const professionalId = dualRoleInfo?.professionalId || userProfile?.id;
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [earnings, setEarnings] = useState<EarningsRecord[]>([]);
    const [activeTab, setActiveTab] = useState("history");

    // Payment Details State
    const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'bank'>('mpesa');
    const [mpesaPhone, setMpesaPhone] = useState('');
    const [bankCode, setBankCode] = useState('');
    const [bankAccountNumber, setBankAccountNumber] = useState('');
    const [bankAccountName, setBankAccountName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Summary Stats
    const [totalEarned, setTotalEarned] = useState(0);
    const [pendingPayout, setPendingPayout] = useState(0);
    const [shiftsCompleted, setShiftsCompleted] = useState(0);

    useEffect(() => {
        if (professionalId) {
            loadEarningsData();
            loadPaymentDetails();
        }
    }, [professionalId]);

    const loadPaymentDetails = async () => {
        if (!professionalId) return;
        try {
            const professional = await getProfessionalById(professionalId);
            if (professional) {
                setMpesaPhone(professional.mpesaPhone || '');
                setBankCode(professional.bankCode || '');
                setBankAccountNumber(professional.bankAccount || '');
                setBankAccountName(professional.bankAccountName || '');
                setPaymentMethod(professional.preferredPayoutMethod || 'mpesa');
            }
        } catch (error) {
            console.error('Error loading payment details:', error);
        }
    };

    const loadEarningsData = async () => {
        if (!professionalId) return;

        try {
            setIsLoading(true);
            // Get completed stints
            const stints = await getStintsByProfessional(professionalId);
            const completedStints = stints.filter((s: any) =>
                s.status === 'completed' || s.status === 'closed'
            );

            // Convert to earnings records
            const earningsRecords: EarningsRecord[] = completedStints.map((stint: any) => {
                const shiftAmount = stint.offeredRate || 0;
                const platformFee = Math.round(shiftAmount * 0.05); // 5% professional fee
                const netEarnings = shiftAmount - platformFee;

                return {
                    id: stint.id,
                    stintId: stint.id,
                    employerName: stint.employerName || 'Unknown Employer',
                    role: stint.role || 'Unknown Role',
                    shiftDate: stint.shiftDate?.toDate ? stint.shiftDate.toDate() : new Date(stint.shiftDate),
                    shiftAmount,
                    platformFee,
                    netEarnings,
                    status: stint.payoutStatus || 'pending',
                    paidAt: stint.paidAt?.toDate ? stint.paidAt.toDate() : undefined,
                    paymentRef: stint.paymentRef,
                };
            });

            setEarnings(earningsRecords);

            // Calculate summaries
            const total = earningsRecords.reduce((sum, e) => sum + e.netEarnings, 0);
            const pending = earningsRecords.filter(e => e.status === 'pending' || e.status === 'processing')
                .reduce((sum, e) => sum + e.netEarnings, 0);

            setTotalEarned(total);
            setPendingPayout(pending);
            setShiftsCompleted(completedStints.length);
        } catch (error) {
            console.error('Error loading earnings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSavePaymentDetails = async () => {
        if (!professionalId) return;

        // Validation
        if (paymentMethod === 'mpesa' && (!mpesaPhone || mpesaPhone.replace(/\s/g, '').length < 10)) {
            toast({
                variant: 'destructive',
                title: 'Invalid Phone Number',
                description: 'Please enter a valid M-Pesa phone number',
            });
            return;
        }

        if (paymentMethod === 'bank' && (!bankCode || !bankAccountNumber || !bankAccountName)) {
            toast({
                variant: 'destructive',
                title: 'Missing Bank Details',
                description: 'Please fill in all bank account fields',
            });
            return;
        }

        setIsSaving(true);
        try {
            await updateProfessional(professionalId, {
                preferredPayoutMethod: paymentMethod,
                mpesaPhone: paymentMethod === 'mpesa' ? mpesaPhone.replace(/\s/g, '') : undefined,
                bankCode: paymentMethod === 'bank' ? bankCode : undefined,
                bankAccount: paymentMethod === 'bank' ? bankAccountNumber : undefined,
                bankAccountName: paymentMethod === 'bank' ? bankAccountName : undefined,
            });

            toast({
                title: 'Payment Details Saved',
                description: 'Your payout details have been updated successfully.',
            });
        } catch (error) {
            console.error('Error saving payment details:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save payment details. Please try again.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const formatPhoneNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length <= 4) return cleaned;
        if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)}`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Paid</Badge>;
            case 'processing':
                return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Processing</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pending</Badge>;
            case 'failed':
                return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Failed</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            {/* Header */}
            <header className="sticky top-0 z-30 flex h-auto items-center justify-between gap-4 border-b bg-background px-4 py-4 sm:px-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard/professional">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Dashboard
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-headline text-xl font-semibold flex items-center gap-2">
                            <Wallet className="h-5 w-5" />
                            Earnings & Payouts
                        </h1>
                        <p className="text-sm text-muted-foreground">Track your income and manage payment details</p>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 flex-col gap-6 p-4 sm:px-6 md:py-6">
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                KSh {totalEarned.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                From {shiftsCompleted} completed shifts
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                KSh {pendingPayout.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Payouts are processed within 24 hours
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Shifts Completed</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{shiftsCompleted}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Keep it up!
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            Earnings History
                        </TabsTrigger>
                        <TabsTrigger value="payment-details" className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Payment Details
                        </TabsTrigger>
                    </TabsList>

                    {/* Earnings History Tab */}
                    <TabsContent value="history" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Earnings History</CardTitle>
                                <CardDescription>
                                    Your income from completed shifts
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {earnings.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Wallet className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                        <p className="font-medium">No earnings yet</p>
                                        <p className="text-sm">Complete shifts to start earning!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {earnings.map((earning) => (
                                            <div
                                                key={earning.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium capitalize">
                                                            {earning.role.replace('-', ' ')}
                                                        </h4>
                                                        {getStatusBadge(earning.status)}
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Building className="h-3.5 w-3.5" />
                                                            {earning.employerName}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {format(earning.shiftDate, 'PP')}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-green-600">
                                                        KSh {earning.netEarnings.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Shift: KSh {earning.shiftAmount.toLocaleString()}
                                                        <span className="ml-1">(-{earning.platformFee.toLocaleString()} fee)</span>
                                                    </div>
                                                    {earning.paidAt && (
                                                        <p className="text-xs text-green-600 mt-1">
                                                            Paid on {format(earning.paidAt, 'PP')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Payment Details Tab */}
                    <TabsContent value="payment-details" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Details</CardTitle>
                                <CardDescription>
                                    Set up how you want to receive your earnings. Employers will see these details.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Payment Method Selection */}
                                <div className="space-y-3">
                                    <Label>Preferred Payment Method</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            onClick={() => setPaymentMethod('mpesa')}
                                            className={`p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'mpesa'
                                                    ? 'border-accent bg-accent/10'
                                                    : 'hover:border-muted-foreground/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Phone className="h-5 w-5 text-green-600" />
                                                <div>
                                                    <p className="font-medium">M-Pesa</p>
                                                    <p className="text-xs text-muted-foreground">Instant payout</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            onClick={() => setPaymentMethod('bank')}
                                            className={`p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'bank'
                                                    ? 'border-accent bg-accent/10'
                                                    : 'hover:border-muted-foreground/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Building className="h-5 w-5 text-blue-600" />
                                                <div>
                                                    <p className="font-medium">Bank Transfer</p>
                                                    <p className="text-xs text-muted-foreground">1-2 business days</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* M-Pesa Details */}
                                {paymentMethod === 'mpesa' && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="mpesa-phone">M-Pesa Phone Number</Label>
                                            <Input
                                                id="mpesa-phone"
                                                type="tel"
                                                placeholder="0712 345 678"
                                                value={mpesaPhone}
                                                onChange={(e) => setMpesaPhone(formatPhoneNumber(e.target.value))}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Enter the phone number registered with M-Pesa
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                                            <p className="text-sm text-green-600 dark:text-green-400">
                                                <strong>Fast & Easy:</strong> Payouts via M-Pesa are processed automatically
                                                and usually arrive within minutes of approval.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Bank Details */}
                                {paymentMethod === 'bank' && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="bank">Bank</Label>
                                            <Select value={bankCode} onValueChange={setBankCode}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select your bank" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {KENYA_BANKS.map((bank) => (
                                                        <SelectItem key={bank.code} value={bank.code}>
                                                            {bank.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="account-number">Account Number</Label>
                                            <Input
                                                id="account-number"
                                                placeholder="Enter your account number"
                                                value={bankAccountNumber}
                                                onChange={(e) => setBankAccountNumber(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="account-name">Account Holder Name</Label>
                                            <Input
                                                id="account-name"
                                                placeholder="Enter name as on bank account"
                                                value={bankAccountName}
                                                onChange={(e) => setBankAccountName(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Must match your bank account exactly
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                                <strong>Bank Transfer:</strong> Payouts are processed within 1-2 business days.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Save Button */}
                                <Button
                                    onClick={handleSavePaymentDetails}
                                    disabled={isSaving}
                                    className="w-full"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Payment Details'
                                    )}
                                </Button>

                                {/* Info Note */}
                                <div className="p-4 rounded-lg bg-muted border text-sm">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium">Important</p>
                                            <p className="text-muted-foreground mt-1">
                                                Your payment details are visible to employers after you complete a shift.
                                                They can pay you directly via M-Pesa or bank transfer.
                                                Make sure your details are accurate to avoid payment issues.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
