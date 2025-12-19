"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Clock,
    MapPin,
    Building,
    User,
    Calendar,
    ChevronDown,
    ChevronUp,
    DollarSign,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Play,
    LogIn,
    LogOut,
    Wallet,
    FileText,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface OrderDetails {
    id: string;
    // Basic info
    role: string;
    employerName: string;
    professionalName?: string;
    city: string;
    address?: string;
    shiftDate: Date;
    startTime: string;
    endTime: string;
    shiftType: string;
    // Status
    status: string;
    // Times
    createdAt?: Date;
    confirmedAt?: Date;
    clockInTime?: Date;
    clockOutTime?: Date;
    completedAt?: Date;
    paidAt?: Date;
    // Payment
    shiftAmount: number;
    bookingFee?: number;
    platformFee?: number;
    netPayout?: number;
    currency?: string;
    paymentStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    transactionRef?: string;
    // Additional
    description?: string;
    cancelledAt?: Date;
    cancellationReason?: string;
}

interface OrderDetailCardProps {
    order: OrderDetails;
    viewType: 'employer' | 'professional' | 'admin';
    defaultExpanded?: boolean;
}

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'pending':
        case 'open':
            return { color: 'bg-blue-500/20 text-blue-600 border-blue-500/30', label: 'Open' };
        case 'confirmed':
            return { color: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30', label: 'Confirmed' };
        case 'in_progress':
            return { color: 'bg-purple-500/20 text-purple-600 border-purple-500/30', label: 'In Progress' };
        case 'completed':
            return { color: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30', label: 'Completed' };
        case 'paid_out':
            return { color: 'bg-green-500/20 text-green-600 border-green-500/30', label: 'Paid' };
        case 'cancelled':
            return { color: 'bg-gray-500/20 text-gray-500 border-gray-500/30', label: 'Cancelled' };
        case 'disputed':
            return { color: 'bg-orange-500/20 text-orange-600 border-orange-500/30', label: 'Disputed' };
        case 'no_show':
            return { color: 'bg-red-500/20 text-red-600 border-red-500/30', label: 'No-Show' };
        default:
            return { color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30', label: status };
    }
};

export function OrderDetailCard({ order, viewType, defaultExpanded = false }: OrderDetailCardProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const statusConfig = getStatusConfig(order.status);
    const currency = order.currency || 'KES';

    // Calculate duration if clocked in/out
    const calculateDuration = () => {
        if (order.clockInTime && order.clockOutTime) {
            const diff = order.clockOutTime.getTime() - order.clockInTime.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${mins}m`;
        }
        return null;
    };

    const duration = calculateDuration();

    // Timeline steps
    const timelineSteps = [
        { key: 'posted', label: 'Posted', icon: FileText, time: order.createdAt, done: true },
        { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2, time: order.confirmedAt, done: !!order.confirmedAt },
        { key: 'clockIn', label: 'Clock In', icon: LogIn, time: order.clockInTime, done: !!order.clockInTime },
        { key: 'clockOut', label: 'Clock Out', icon: LogOut, time: order.clockOutTime, done: !!order.clockOutTime },
        { key: 'completed', label: 'Completed', icon: CheckCircle2, time: order.completedAt, done: ['completed', 'paid_out', 'closed'].includes(order.status) },
        { key: 'paid', label: 'Paid Out', icon: Wallet, time: order.paidAt, done: order.status === 'paid_out' || order.paymentStatus === 'completed' },
    ];

    return (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <div className="border rounded-lg overflow-hidden hover:border-accent/50 transition-colors">
                {/* Summary Row */}
                <CollapsibleTrigger asChild>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                                <Building className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="font-semibold capitalize">
                                    {order.role?.replace('-', ' ')}
                                </div>
                                <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                                    {viewType === 'professional' ? (
                                        <span className="flex items-center gap-1">
                                            <Building className="h-3.5 w-3.5" />
                                            {order.employerName}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <User className="h-3.5 w-3.5" />
                                            {order.professionalName || 'Not assigned'}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {format(order.shiftDate, 'MMM d, yyyy')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {order.city}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 sm:gap-6">
                            <div className="text-right">
                                <div className="font-bold text-lg">
                                    {currency} {(order.netPayout || order.shiftAmount).toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {order.startTime} - {order.endTime}
                                </div>
                            </div>
                            <Badge className={cn("border", statusConfig.color)}>
                                {statusConfig.label}
                            </Badge>
                            {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                        </div>
                    </div>
                </CollapsibleTrigger>

                {/* Expanded Details */}
                <CollapsibleContent>
                    <Separator />
                    <div className="p-4 bg-muted/30 space-y-6">
                        {/* Timeline */}
                        <div>
                            <h4 className="text-sm font-semibold mb-3">Order Timeline</h4>
                            <div className="flex flex-wrap gap-2">
                                {timelineSteps.map((step, idx) => (
                                    <div
                                        key={step.key}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                                            step.done
                                                ? "bg-green-500/10 text-green-600 border border-green-500/30"
                                                : "bg-muted text-muted-foreground border border-transparent"
                                        )}
                                    >
                                        <step.icon className="h-4 w-4" />
                                        <span>{step.label}</span>
                                        {step.time && (
                                            <span className="text-xs opacity-80">
                                                {format(step.time, 'HH:mm')}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Shift Details */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Shift Details</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Order ID</span>
                                        <span className="font-mono text-xs">{order.id.slice(0, 8)}...</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Date</span>
                                        <span>{format(order.shiftDate, 'PPP')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Scheduled Time</span>
                                        <span>{order.startTime} - {order.endTime}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Shift Type</span>
                                        <span className="capitalize">{order.shiftType?.replace('-', ' ')}</span>
                                    </div>
                                    {duration && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Actual Duration</span>
                                            <span className="font-semibold text-green-600">{duration}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Clock Times */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Clock Times</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Clock In</span>
                                        <span>
                                            {order.clockInTime
                                                ? format(order.clockInTime, 'PPp')
                                                : <span className="text-muted-foreground">—</span>
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Clock Out</span>
                                        <span>
                                            {order.clockOutTime
                                                ? format(order.clockOutTime, 'PPp')
                                                : <span className="text-muted-foreground">—</span>
                                            }
                                        </span>
                                    </div>
                                    {order.confirmedAt && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Confirmed At</span>
                                            <span>{format(order.confirmedAt, 'PPp')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Payment Details</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Shift Rate</span>
                                        <span>{currency} {order.shiftAmount.toLocaleString()}</span>
                                    </div>
                                    {viewType === 'employer' && order.bookingFee && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Booking Fee</span>
                                            <span>+ {currency} {order.bookingFee.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {viewType === 'professional' && order.platformFee && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Platform Fee (5%)</span>
                                            <span>- {currency} {order.platformFee.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-semibold">
                                        <span>{viewType === 'employer' ? 'Total Paid' : 'Net Payout'}</span>
                                        <span className={viewType === 'professional' ? 'text-green-600' : ''}>
                                            {currency} {(order.netPayout || order.shiftAmount).toLocaleString()}
                                        </span>
                                    </div>
                                    {order.paymentStatus && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Payout Status</span>
                                            <Badge variant="outline" className={cn(
                                                order.paymentStatus === 'completed' && 'text-green-600',
                                                order.paymentStatus === 'pending' && 'text-yellow-600',
                                                order.paymentStatus === 'processing' && 'text-blue-600',
                                            )}>
                                                {order.paymentStatus}
                                            </Badge>
                                        </div>
                                    )}
                                    {order.transactionRef && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tx Ref</span>
                                            <span className="font-mono text-xs">{order.transactionRef}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {order.description && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Description</h4>
                                <p className="text-sm text-muted-foreground bg-background p-3 rounded-lg border">
                                    {order.description}
                                </p>
                            </div>
                        )}

                        {/* Cancellation */}
                        {order.status === 'cancelled' && order.cancellationReason && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                <div className="flex items-start gap-2">
                                    <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-red-600">Cancelled</p>
                                        <p className="text-sm text-muted-foreground">{order.cancellationReason}</p>
                                        {order.cancelledAt && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                On {format(order.cancelledAt, 'PPp')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
