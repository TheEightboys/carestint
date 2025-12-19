"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    FileText,
    Loader2,
    Filter,
    Calendar,
    Search,
    RefreshCw,
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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/lib/user-context";
import { getStintsByEmployer, getEmployerByEmail } from "@/lib/firebase/firestore";
import { OrderDetailCard, OrderDetails } from "@/components/shared/order-detail-card";

export default function EmployerOrdersPage() {
    const { user, userProfile } = useUser();
    const [employerId, setEmployerId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [orders, setOrders] = useState<OrderDetails[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Stats
    const [totalSpent, setTotalSpent] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);
    const [completedOrders, setCompletedOrders] = useState(0);

    useEffect(() => {
        const loadEmployer = async () => {
            if (user?.email) {
                const employer = await getEmployerByEmail(user.email);
                if (employer) {
                    setEmployerId((employer as any).id);
                }
            }
        };
        loadEmployer();
    }, [user]);

    useEffect(() => {
        if (employerId) {
            loadOrders();
        }
    }, [employerId]);

    const loadOrders = async () => {
        if (!employerId) return;

        setIsLoading(true);
        try {
            const stints = await getStintsByEmployer(employerId);

            const formattedOrders: OrderDetails[] = stints.map((stint: any) => {
                const shiftAmount = stint.offeredRate || 0;
                const bookingFee = stint.bookingFeeAmount || Math.round(shiftAmount * 0.15);
                const totalPaid = shiftAmount + bookingFee;

                return {
                    id: stint.id,
                    role: stint.role || 'healthcare-professional',
                    employerName: stint.employerName || userProfile?.facilityName || 'Your Facility',
                    professionalName: stint.acceptedProfessionalName || undefined,
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
                    bookingFee,
                    netPayout: totalPaid,
                    currency: stint.currency || 'KES',
                    paymentStatus: stint.paymentStatus || (stint.status === 'confirmed' ? 'completed' : 'pending'),
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
            const completed = formattedOrders.filter(o => ['completed', 'paid_out', 'closed'].includes(o.status));
            setTotalOrders(formattedOrders.length);
            setCompletedOrders(completed.length);
            setTotalSpent(formattedOrders
                .filter(o => ['confirmed', 'in_progress', 'completed', 'paid_out', 'closed'].includes(o.status))
                .reduce((sum, o) => sum + (o.netPayout || 0), 0)
            );
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
                order.professionalName?.toLowerCase().includes(query) ||
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
                        <Link href="/dashboard/employer">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Dashboard
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-headline text-xl font-semibold flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Order History
                        </h1>
                        <p className="text-sm text-muted-foreground">View all your stint bookings and payments</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={loadOrders}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </header>

            <main className="flex flex-1 flex-col gap-6 p-4 sm:px-6 md:py-6">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">KES {totalSpent.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalOrders}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{completedOrders}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Orders</CardTitle>
                        <CardDescription>
                            Browse and filter your stint history
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4 mb-6">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by role, professional, city..."
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
                                    <SelectItem value="pending">Open</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Orders List */}
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p className="font-medium">No orders found</p>
                                <p className="text-sm">
                                    {orders.length === 0
                                        ? "You haven't posted any stints yet"
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
                                        viewType="employer"
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
