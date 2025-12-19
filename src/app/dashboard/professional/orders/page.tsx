"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    FileText,
    Loader2,
    Filter,
    Search,
    RefreshCw,
    Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/lib/user-context";
import { getStintsByProfessional, getProfessionalByEmail } from "@/lib/firebase/firestore";
import { OrderDetailCard, OrderDetails } from "@/components/shared/order-detail-card";

export default function ProfessionalOrdersPage() {
    const { user, dualRoleInfo } = useUser();
    const [professionalId, setProfessionalId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [orders, setOrders] = useState<OrderDetails[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Stats
    const [totalEarned, setTotalEarned] = useState(0);
    const [pendingPayout, setPendingPayout] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);

    useEffect(() => {
        const loadProfessional = async () => {
            if (dualRoleInfo?.professionalId) {
                setProfessionalId(dualRoleInfo.professionalId);
            } else if (user?.email) {
                const professional = await getProfessionalByEmail(user.email);
                if (professional) {
                    setProfessionalId((professional as any).id);
                }
            }
        };
        loadProfessional();
    }, [user, dualRoleInfo]);

    useEffect(() => {
        if (professionalId) {
            loadOrders();
        }
    }, [professionalId]);

    const loadOrders = async () => {
        if (!professionalId) return;

        setIsLoading(true);
        try {
            const stints = await getStintsByProfessional(professionalId);

            // Filter to assigned stints only
            const assignedStints = stints.filter((s: any) =>
                s.acceptedProfessionalId === professionalId
            );

            const formattedOrders: OrderDetails[] = assignedStints.map((stint: any) => {
                const shiftAmount = stint.offeredRate || 0;
                const platformFee = Math.round(shiftAmount * 0.05); // 5% professional fee
                const netPayout = shiftAmount - platformFee;

                // Determine payment status
                let paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' = 'pending';
                if (stint.status === 'paid_out' || stint.payoutStatus === 'completed') {
                    paymentStatus = 'completed';
                } else if (stint.payoutStatus === 'processing') {
                    paymentStatus = 'processing';
                }

                return {
                    id: stint.id,
                    role: stint.role || 'healthcare-professional',
                    employerName: stint.employerName || 'Unknown Employer',
                    professionalName: stint.acceptedProfessionalName,
                    city: stint.city || 'Unknown',
                    address: stint.address,
                    shiftDate: stint.shiftDate?.toDate?.() || new Date(stint.shiftDate),
                    startTime: stint.startTime || '09:00',
                    endTime: stint.endTime || '17:00',
                    shiftType: stint.shiftType || 'full-day',
                    status: stint.status,
                    createdAt: stint.createdAt?.toDate?.() || undefined,
                    confirmedAt: stint.confirmedAt?.toDate?.() || undefined,
                    clockInTime: stint.clockInTime?.toDate?.() || undefined,
                    clockOutTime: stint.clockOutTime?.toDate?.() || undefined,
                    completedAt: stint.completedAt?.toDate?.() || undefined,
                    paidAt: stint.paidAt?.toDate?.() || undefined,
                    shiftAmount,
                    platformFee,
                    netPayout,
                    currency: stint.currency || 'KES',
                    paymentStatus,
                    transactionRef: stint.paymentRef,
                    description: stint.description,
                    cancelledAt: stint.cancelledAt?.toDate?.() || undefined,
                    cancellationReason: stint.cancellationReason,
                };
            });

            // Sort by date descending (newest first)
            formattedOrders.sort((a, b) => b.shiftDate.getTime() - a.shiftDate.getTime());

            setOrders(formattedOrders);

            // Calculate stats
            const completedOrders = formattedOrders.filter(o =>
                ['completed', 'paid_out', 'closed'].includes(o.status)
            );
            const paidOrders = formattedOrders.filter(o => o.paymentStatus === 'completed');
            const pendingOrders = completedOrders.filter(o => o.paymentStatus !== 'completed');

            setTotalOrders(completedOrders.length);
            setTotalEarned(completedOrders.reduce((sum, o) => sum + (o.netPayout || 0), 0));
            setPendingPayout(pendingOrders.reduce((sum, o) => sum + (o.netPayout || 0), 0));
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter orders
    const filteredOrders = orders.filter(order => {
        if (statusFilter !== 'all' && order.status !== statusFilter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                order.role.toLowerCase().includes(query) ||
                order.employerName.toLowerCase().includes(query) ||
                order.city.toLowerCase().includes(query)
            );
        }
        return true;
    });

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
                            <FileText className="h-5 w-5" />
                            Work History
                        </h1>
                        <p className="text-sm text-muted-foreground">View all your completed shifts and earnings</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/dashboard/professional/earnings">
                            <Wallet className="h-4 w-4 mr-2" />
                            Earnings
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={loadOrders}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </header>

            <main className="flex flex-1 flex-col gap-6 p-4 sm:px-6 md:py-6">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">KES {totalEarned.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payout</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">KES {pendingPayout.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Shifts Completed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{totalOrders}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Work History</CardTitle>
                        <CardDescription>
                            Your completed shifts with full details
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4 mb-6">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by employer, role, city..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[160px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="confirmed">Upcoming</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="paid_out">Paid</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Orders List */}
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p className="font-medium">No work history found</p>
                                <p className="text-sm">
                                    {orders.length === 0
                                        ? "Complete your first shift to see it here"
                                        : "Try adjusting your filters"
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredOrders.map((order) => (
                                    <OrderDetailCard
                                        key={order.id}
                                        order={order}
                                        viewType="professional"
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
