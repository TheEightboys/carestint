"use client";

/**
 * SuperAdmin Payments Dashboard
 * 
 * Manages:
 * - All employer payments
 * - Payout queue (scheduled, processing, failed, paid)
 * - Refunds and disputes
 */

import { useState, useEffect } from 'react';
import {
    CreditCard,
    Banknote,
    RefreshCw,
    Search,
    Filter,
    Download,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    MoreVertical,
    Eye,
    RotateCcw,
    Ban,
    Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import {
    retryPayout,
    issueRefund,
    getLedgerEntriesByStint,
    processEligiblePayouts
} from '@/lib/flutterwave-service';
import type { PaymentIntent, PayoutRecord, LedgerEntry } from '@/lib/types';

// Status badges
const paymentStatusBadge = (status: string) => {
    const styles: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
        initiated: { variant: 'outline', className: 'border-blue-500 text-blue-500' },
        pending: { variant: 'secondary', className: 'bg-yellow-500/20 text-yellow-600' },
        success: { variant: 'default', className: 'bg-green-500' },
        failed: { variant: 'destructive', className: '' },
        expired: { variant: 'outline', className: 'border-gray-500 text-gray-500' },
        cancelled: { variant: 'outline', className: 'border-gray-500 text-gray-500' },
        refunded: { variant: 'secondary', className: 'bg-purple-500/20 text-purple-600' },
        partially_refunded: { variant: 'secondary', className: 'bg-purple-500/20 text-purple-600' },
    };
    const config = styles[status] || styles.pending;
    return <Badge variant={config.variant} className={config.className}>{status.replace('_', ' ')}</Badge>;
};

const payoutStatusBadge = (status: string) => {
    const styles: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
        scheduled: { variant: 'outline', className: 'border-blue-500 text-blue-500' },
        ready_for_settlement: { variant: 'secondary', className: 'bg-yellow-500/20 text-yellow-600' },
        processing: { variant: 'secondary', className: 'bg-blue-500/20 text-blue-600' },
        completed: { variant: 'default', className: 'bg-green-500' },
        failed: { variant: 'destructive', className: '' },
        held: { variant: 'outline', className: 'border-orange-500 text-orange-500' },
    };
    const config = styles[status] || styles.scheduled;
    return <Badge variant={config.variant} className={config.className}>{status.replace('_', ' ')}</Badge>;
};

export default function PaymentsDashboardPage() {
    const { toast } = useToast();

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [payments, setPayments] = useState<PaymentIntent[]>([]);
    const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPayment, setSelectedPayment] = useState<PaymentIntent | null>(null);
    const [selectedPayout, setSelectedPayout] = useState<PayoutRecord | null>(null);
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [isProcessingPayouts, setIsProcessingPayouts] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        totalPayments: 0,
        successfulPayments: 0,
        pendingPayouts: 0,
        completedPayouts: 0,
        totalRevenue: 0,
        totalPaidOut: 0,
    });

    // Fetch data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch payments
            const paymentsQuery = query(
                collection(db, 'paymentIntents'),
                orderBy('createdAt', 'desc'),
                limit(100)
            );
            const paymentsSnapshot = await getDocs(paymentsQuery);
            const paymentsData = paymentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                expiresAt: doc.data().expiresAt?.toDate?.() || new Date(),
                completedAt: doc.data().completedAt?.toDate?.(),
            })) as PaymentIntent[];
            setPayments(paymentsData);

            // Fetch payouts
            const payoutsQuery = query(
                collection(db, 'payoutRecords'),
                orderBy('createdAt', 'desc'),
                limit(100)
            );
            const payoutsSnapshot = await getDocs(payoutsQuery);
            const payoutsData = payoutsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                eligibleAt: doc.data().eligibleAt?.toDate?.() || new Date(),
                shiftCompletedAt: doc.data().shiftCompletedAt?.toDate?.() || new Date(),
            })) as PayoutRecord[];
            setPayouts(payoutsData);

            // Calculate stats
            const successful = paymentsData.filter(p => p.status === 'success');
            const pendingPayouts = payoutsData.filter(p => ['scheduled', 'ready_for_settlement', 'processing'].includes(p.status));
            const completedPayouts = payoutsData.filter(p => p.status === 'completed');

            setStats({
                totalPayments: paymentsData.length,
                successfulPayments: successful.length,
                pendingPayouts: pendingPayouts.length,
                completedPayouts: completedPayouts.length,
                totalRevenue: successful.reduce((sum, p) => sum + p.platformFee, 0),
                totalPaidOut: completedPayouts.reduce((sum, p) => sum + p.netAmount, 0),
            });
        } catch (error) {
            console.error('Error fetching payment data:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load payment data' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewPaymentDetails = async (payment: PaymentIntent) => {
        setSelectedPayment(payment);
        // Fetch ledger entries
        const entries = await getLedgerEntriesByStint(payment.stintId);
        setLedgerEntries(entries);
    };

    const handleRefund = async (paymentId: string) => {
        const reason = prompt('Enter refund reason:');
        if (!reason) return;

        try {
            const result = await issueRefund(paymentId, reason);
            if (result.success) {
                toast({ title: 'Refund Processed', description: result.message });
                fetchData();
            } else {
                toast({ variant: 'destructive', title: 'Refund Failed', description: result.message });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to process refund' });
        }
    };

    const handleRetryPayout = async (payoutId: string) => {
        try {
            const result = await retryPayout(payoutId);
            if (result.success) {
                toast({ title: 'Payout Retried', description: result.message });
                fetchData();
            } else {
                toast({ variant: 'destructive', title: 'Retry Failed', description: result.message });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to retry payout' });
        }
    };

    const handleProcessPayouts = async () => {
        setIsProcessingPayouts(true);
        try {
            const result = await processEligiblePayouts();
            toast({
                title: 'Payouts Processed',
                description: `${result.processed} completed, ${result.failed} failed`,
            });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to process payouts' });
        } finally {
            setIsProcessingPayouts(false);
        }
    };

    // Filter payments
    const filteredPayments = payments.filter(p =>
        p.professionalName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.flutterwaveRef?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.stintId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Payments & Payouts</h1>
                    <p className="text-muted-foreground">Manage all payment transactions and professional payouts</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={handleProcessPayouts} disabled={isProcessingPayouts}>
                        {isProcessingPayouts ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Banknote className="h-4 w-4 mr-2" />
                        )}
                        Run Payout Job
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Total Payments</p>
                        </div>
                        <p className="text-2xl font-bold">{stats.totalPayments}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <p className="text-sm text-muted-foreground">Successful</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{stats.successfulPayments}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <p className="text-sm text-muted-foreground">Pending Payouts</p>
                        </div>
                        <p className="text-2xl font-bold text-yellow-600">{stats.pendingPayouts}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-blue-500" />
                            <p className="text-sm text-muted-foreground">Paid Out</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{stats.completedPayouts}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                            <p className="text-sm text-muted-foreground">Revenue</p>
                        </div>
                        <p className="text-2xl font-bold">KES {stats.totalRevenue.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <ArrowDownRight className="h-4 w-4 text-purple-500" />
                            <p className="text-sm text-muted-foreground">Paid to Pros</p>
                        </div>
                        <p className="text-2xl font-bold">KES {stats.totalPaidOut.toLocaleString()}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="payments" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                    <TabsTrigger value="payouts">Payouts Queue</TabsTrigger>
                </TabsList>

                {/* Payments Table */}
                <TabsContent value="payments" className="space-y-4">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by professional, reference, or stint..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Professional</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-mono text-xs">
                                            {payment.flutterwaveRef || payment.id.slice(0, 12)}
                                        </TableCell>
                                        <TableCell>{payment.professionalName}</TableCell>
                                        <TableCell className="font-semibold">
                                            {payment.currency} {payment.amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {payment.paymentMethod}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{paymentStatusBadge(payment.status)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(payment.createdAt, 'PP p')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleViewPaymentDetails(payment)}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    {payment.status === 'success' && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleRefund(payment.id)}
                                                            className="text-destructive"
                                                        >
                                                            <RotateCcw className="h-4 w-4 mr-2" />
                                                            Issue Refund
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredPayments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No payments found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* Payouts Table */}
                <TabsContent value="payouts" className="space-y-4">
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">All</Button>
                        <Button variant="ghost" size="sm">Scheduled</Button>
                        <Button variant="ghost" size="sm">Processing</Button>
                        <Button variant="ghost" size="sm">Failed</Button>
                        <Button variant="ghost" size="sm">Held</Button>
                        <Button variant="ghost" size="sm">Completed</Button>
                    </div>

                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Professional</TableHead>
                                    <TableHead>Gross</TableHead>
                                    <TableHead>Platform Fee</TableHead>
                                    <TableHead>Net Payout</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Eligible At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payouts.map((payout) => (
                                    <TableRow key={payout.id}>
                                        <TableCell>{payout.professionalName}</TableCell>
                                        <TableCell>
                                            {payout.currency} {payout.grossAmount.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            -{payout.currency} {payout.platformFee.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="font-semibold text-green-600">
                                            {payout.currency} {payout.netAmount.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {payout.payoutMethod}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{payoutStatusBadge(payout.status)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(payout.eligibleAt, 'PP p')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setSelectedPayout(payout)}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    {payout.status === 'failed' && (
                                                        <DropdownMenuItem onClick={() => handleRetryPayout(payout.id)}>
                                                            <RotateCcw className="h-4 w-4 mr-2" />
                                                            Retry Payout
                                                        </DropdownMenuItem>
                                                    )}
                                                    {payout.status === 'held' && (
                                                        <DropdownMenuItem>
                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                            Release Payout
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {payouts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            No payouts found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Payment Details Dialog */}
            <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            Payment Details
                        </DialogTitle>
                        <DialogDescription>
                            Reference: {selectedPayment?.flutterwaveRef || selectedPayment?.id}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPayment && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Professional</p>
                                    <p className="font-medium">{selectedPayment.professionalName}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Status</p>
                                    {paymentStatusBadge(selectedPayment.status)}
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Total Amount</p>
                                    <p className="font-medium">{selectedPayment.currency} {selectedPayment.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Platform Fee</p>
                                    <p className="font-medium">{selectedPayment.currency} {selectedPayment.platformFee.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Payment Method</p>
                                    <p className="font-medium capitalize">{selectedPayment.paymentMethod}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Date</p>
                                    <p className="font-medium">{format(selectedPayment.createdAt, 'PPP p')}</p>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h4 className="font-medium mb-2">Ledger Entries</h4>
                                <div className="space-y-2">
                                    {ledgerEntries.map((entry) => (
                                        <div key={entry.id} className="flex justify-between text-sm p-2 rounded bg-muted/50">
                                            <span>{entry.description}</span>
                                            <span className="font-mono">{entry.currency} {entry.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    {ledgerEntries.length === 0 && (
                                        <p className="text-sm text-muted-foreground">No ledger entries</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
