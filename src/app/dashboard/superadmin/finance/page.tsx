"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Banknote, Receipt, TrendingUp, Wallet, Loader2, RefreshCw, AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

import { getDashboardStats, getAllPayouts } from "@/lib/firebase/firestore";

export default function FinancePage() {
    const [stats, setStats] = useState({ grossVolume: 0, platformRevenue: 0 });
    const [payouts, setPayouts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [statsData, payoutsData] = await Promise.all([
                getDashboardStats().catch(() => ({ grossVolume: 0, platformRevenue: 0 })),
                getAllPayouts().catch(() => []),
            ]);
            setStats(statsData || { grossVolume: 0, platformRevenue: 0 });
            setPayouts(payoutsData || []);
        } catch (err) {
            console.error("Error loading finance data:", err);
            setError("Failed to load finance data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center flex-col gap-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <p className="text-destructive">{error}</p>
                <Button onClick={loadData}>Try Again</Button>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/superadmin">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Overview
                    </Link>
                </Button>
                <h1 className="font-headline text-xl font-semibold">
                    Finance & Billing
                </h1>
                <div className="ml-auto">
                    <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </header>

            <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Banknote className="h-4 w-4 text-muted-foreground" />
                                Gross Volume
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">KES {stats.grossVolume.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Total value of completed stints</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                Platform Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">KES {stats.platformRevenue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Booking fees collected</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-blue-500" />
                                Pending Payouts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{payouts.filter((p: any) => p.status === 'pending').length}</div>
                            <p className="text-xs text-muted-foreground">Awaiting settlement</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-purple-500" />
                                Completed Payouts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{payouts.filter((p: any) => p.status === 'completed').length}</div>
                            <p className="text-xs text-muted-foreground">Successfully processed</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Placeholder for Future Integration */}
                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            Payment Integration
                        </CardTitle>
                        <CardDescription>
                            M-Pesa and Flutterwave integration coming soon
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                            <Banknote className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p className="font-medium">Payment Gateway Integration</p>
                            <p className="text-sm mt-2">
                                This section will include real-time payment processing via M-Pesa and Flutterwave
                                once API credentials are configured.
                            </p>
                            <div className="flex justify-center gap-4 mt-6">
                                <Badge variant="outline" className="text-sm px-4 py-2">
                                    M-Pesa Ready
                                </Badge>
                                <Badge variant="outline" className="text-sm px-4 py-2">
                                    Flutterwave Ready
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payouts Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Payouts</CardTitle>
                        <CardDescription>
                            Track all professional payouts and their status.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Stint</TableHead>
                                    <TableHead>Gross</TableHead>
                                    <TableHead>Platform Fee</TableHead>
                                    <TableHead>Net Payout</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payouts.slice(0, 10).map((payout: any) => (
                                    <TableRow key={payout.id}>
                                        <TableCell className="font-mono text-xs">
                                            {payout.id.slice(0, 8)}...
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {payout.stintId?.slice(0, 8) || 'N/A'}...
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            KES {payout.grossAmount?.toLocaleString() || 0}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            KES {payout.platformFeeAmount?.toLocaleString() || 0}
                                        </TableCell>
                                        <TableCell className="font-medium text-green-600">
                                            KES {payout.netAmount?.toLocaleString() || 0}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="uppercase text-xs">
                                                {payout.payoutMethod || 'M-Pesa'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={payout.status === 'completed' ? 'default' : payout.status === 'failed' ? 'destructive' : 'secondary'}
                                                className="capitalize text-xs"
                                            >
                                                {payout.status || 'Pending'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {payouts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>No payouts yet</p>
                                            <p className="text-sm">Payouts will appear here after stints are completed.</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
