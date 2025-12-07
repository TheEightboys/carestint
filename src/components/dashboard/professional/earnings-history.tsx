"use client";

import { useState, useEffect } from 'react';
import { Wallet, Download, Calendar, Filter, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getPayoutsByProfessional } from '@/lib/firebase/firestore';

interface Earning {
    id: string;
    stintId: string;
    employerName: string;
    role: string;
    shiftDate: Date;
    grossAmount: number;
    platformFee: number;
    mpesaCost: number;
    netAmount: number;
    currency: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    paidAt?: Date;
    transactionId?: string;
}

const getStatusBadge = (status: Earning['status']) => {
    switch (status) {
        case 'completed':
            return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
        case 'processing':
            return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Processing</Badge>;
        case 'pending':
            return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
        case 'failed':
            return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    }
};

interface EarningsHistoryProps {
    professionalId: string;
}

export function EarningsHistory({ professionalId }: EarningsHistoryProps) {
    const [earnings, setEarnings] = useState<Earning[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'processing'>('all');
    const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');

    useEffect(() => {
        loadEarnings();
    }, [professionalId]);

    const loadEarnings = async () => {
        if (!professionalId || professionalId === 'demo-professional') {
            // No real data for demo user
            setEarnings([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const payouts = await getPayoutsByProfessional(professionalId);
            const formattedEarnings: Earning[] = payouts.map((p: any) => ({
                id: p.id,
                stintId: p.stintId || '',
                employerName: p.employerName || 'Unknown Employer',
                role: p.role || 'Healthcare Professional',
                shiftDate: p.shiftDate?.toDate?.() || new Date(p.shiftDate) || new Date(),
                grossAmount: p.grossAmount || p.amount || 0,
                platformFee: p.platformFee || 0,
                mpesaCost: p.mpesaCost || 35,
                netAmount: p.netAmount || p.amount || 0,
                currency: p.currency || 'KES',
                status: p.status || 'pending',
                paidAt: p.paidAt?.toDate?.() || (p.paidAt ? new Date(p.paidAt) : undefined),
                transactionId: p.transactionId,
            }));
            setEarnings(formattedEarnings);
        } catch (error) {
            console.error("Error loading earnings:", error);
            setEarnings([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredEarnings = earnings.filter(e => {
        if (filter !== 'all' && e.status !== filter) return false;
        return true;
    });

    const totalEarned = earnings.filter(e => e.status === 'completed').reduce((sum, e) => sum + e.netAmount, 0);
    const pendingAmount = earnings.filter(e => e.status !== 'completed').reduce((sum, e) => sum + e.netAmount, 0);
    const totalStints = earnings.filter(e => e.status === 'completed').length;
    const avgPerStint = totalStints > 0 ? totalEarned / totalStints : 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5" />
                            Earnings History
                        </CardTitle>
                        <CardDescription>
                            Track your earnings and payout history.
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-2xl font-bold text-green-600">KES {totalEarned.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Total Earned</p>
                    </div>
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-2xl font-bold text-yellow-600">KES {pendingAmount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Pending Payout</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-2xl font-bold text-blue-600">{totalStints}</p>
                        <p className="text-xs text-muted-foreground">Stints Completed</p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <p className="text-2xl font-bold text-purple-600">KES {Math.round(avgPerStint).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Avg Per Stint</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-4">
                    <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                        <SelectTrigger className="w-[140px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="completed">Paid</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                        <SelectTrigger className="w-[140px]">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {/* Table */}
                        {filteredEarnings.length > 0 ? (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Stint</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Gross</TableHead>
                                            <TableHead>Fees</TableHead>
                                            <TableHead>Net Payout</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredEarnings.map((earning) => (
                                            <TableRow key={earning.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{earning.employerName}</p>
                                                        <p className="text-xs text-muted-foreground">{earning.role}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">{earning.shiftDate.toLocaleDateString()}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-medium">KES {earning.grossAmount.toLocaleString()}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p className="text-muted-foreground">-{earning.platformFee} (platform)</p>
                                                        <p className="text-muted-foreground">-{earning.mpesaCost} (M-Pesa)</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-green-600">KES {earning.netAmount.toLocaleString()}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        {getStatusBadge(earning.status)}
                                                        {earning.transactionId && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {earning.transactionId}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>No earnings yet</p>
                                <p className="text-sm">Complete stints to start earning!</p>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
