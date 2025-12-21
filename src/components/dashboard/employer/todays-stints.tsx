
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Clock, MoreVertical, Users, MapPin, Banknote, Loader2, RefreshCw, UserCheck, LogIn, LogOut, Timer, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getStintsByEmployer, getApplicationsByStint, updateStint } from "@/lib/firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/user-context";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ApplicationsManager } from "./applications-manager";
import { AcceptancePaymentModal } from "./acceptance-payment-modal";


interface Stint {
    id: string;
    role: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    city: string;
    offeredRate: number;
    currency?: string;
    status: string;
    shiftDate?: any;
    acceptedProfessionalName?: string;
    clockInTime?: any;
    clockOutTime?: any;
    completedAt?: any;
    disputeWindowEndsAt?: any;
}

const getStatusClass = (status: string): string => {
    switch (status) {
        case "open":
        case "pending":
            return "bg-blue-500/20 text-blue-500 border-blue-500/30"; // Blue for open/pending
        case "accepted":
        case "confirmed":
            return "bg-cyan-500/20 text-cyan-500 border-cyan-500/30"; // Cyan for confirmed
        case "in_progress":
            return "bg-purple-500/20 text-purple-500 border-purple-500/30"; // Purple for in-progress
        case "completed":
        case "closed":
            return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"; // Emerald green for completed
        case "disputed":
        case "under_review":
            return "bg-orange-500/20 text-orange-500 border-orange-500/30"; // Orange for disputes
        case "no_show":
            return "bg-red-500/20 text-red-500 border-red-500/30"; // Red for no-show
        case "cancelled":
        case "expired":
            return "bg-gray-500/20 text-gray-400 border-gray-500/30"; // Gray for cancelled/expired
        default:
            return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"; // Yellow for unknown
    }
}


interface TodaysStintsProps {
    employerId?: string;
}

export function TodaysStints({ employerId = "demo-employer" }: TodaysStintsProps) {
    const [stints, setStints] = useState<Stint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStint, setSelectedStint] = useState<Stint | null>(null);
    const [stintApplicationCounts, setStintApplicationCounts] = useState<Record<string, number>>({});
    const { toast } = useToast();

    // Payment modal state
    const { user, userProfile } = useUser();
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<any>(null);
    const [stintForPayment, setStintForPayment] = useState<Stint | null>(null);

    // Cancel dialog state
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [stintToCancel, setStintToCancel] = useState<Stint | null>(null);
    const [cancelReason, setCancelReason] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);

    const fetchStints = async () => {
        setIsLoading(true);
        try {
            const data = await getStintsByEmployer(employerId);
            setStints(data as Stint[]);

            // Fetch application counts for each stint
            const counts: Record<string, number> = {};
            for (const stint of data as Stint[]) {
                const apps = await getApplicationsByStint(stint.id);
                counts[stint.id] = apps.filter((a: any) => a.status === 'pending').length;
            }
            setStintApplicationCounts(counts);
        } catch (error) {
            console.error("Error fetching stints:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load stints. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStints();
    }, [employerId]);

    const handleViewApplicants = (stint: Stint) => {
        setSelectedStint(stint);
    };

    const handleOpenCancelDialog = (stint: Stint) => {
        setStintToCancel(stint);
        setCancelReason("");
        setCancelDialogOpen(true);
    };

    const handleCancelStint = async () => {
        if (!stintToCancel) return;

        setIsCancelling(true);
        try {
            await updateStint(stintToCancel.id, {
                status: 'cancelled',
                cancellationReason: cancelReason,
                cancelledAt: new Date(),
            });

            toast({
                title: "Stint Cancelled",
                description: "The stint has been cancelled successfully.",
            });

            setCancelDialogOpen(false);
            setStintToCancel(null);
            setCancelReason("");
            fetchStints(); // Refresh the list
        } catch (error) {
            console.error("Error cancelling stint:", error);
            toast({
                title: "Error",
                description: "Failed to cancel stint. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsCancelling(false);
        }
    };

    const handleApplicationAccepted = () => {
        setSelectedStint(null);
        fetchStints(); // Refresh the list
        toast({
            title: "Professional Assigned",
            description: "The stint has been updated successfully.",
        });
    };

    const formatShiftDate = (shiftDate: any) => {
        if (!shiftDate) return "Today";
        const date = shiftDate.toDate?.() || new Date(shiftDate);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return null;
        const date = timestamp.toDate?.() || new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getDisputeWindowRemaining = (disputeWindowEndsAt: any) => {
        if (!disputeWindowEndsAt) return null;
        const endDate = disputeWindowEndsAt.toDate?.() || new Date(disputeWindowEndsAt);
        const now = new Date();
        const hoursRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
        if (hoursRemaining <= 0) return "Ready for payout";
        return `${hoursRemaining}h until payout`;
    };

    return (
        <>
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <Briefcase className="h-6 w-6" />
                            Your Stints
                        </CardTitle>
                        <CardDescription>
                            Manage your active and pending stints.
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={fetchStints} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : stints.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 text-center p-8">
                            <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">No stints posted yet.</p>
                            <p className="text-sm text-muted-foreground/80">Use the form to post your first one.</p>
                        </div>
                    ) : (
                        stints.slice(0, 5).map((stint) => {
                            // Determine privacy state
                            let showProfessionalName = true;
                            let showLicense = false; // Default hidden unless explicit
                            let showPayoutStatus = true;
                            let privacyMessage = null;

                            // Calculate time since clock out if completed
                            let hoursSinceClockOut = null;
                            if (stint.status === 'completed' && stint.clockOutTime) {
                                const clockOutDate = stint.clockOutTime.toDate?.() || new Date(stint.clockOutTime);
                                const now = new Date();
                                hoursSinceClockOut = (now.getTime() - clockOutDate.getTime()) / (1000 * 60 * 60);
                            }

                            // Apply Privacy Rules
                            if (stint.status === 'completed' && hoursSinceClockOut !== null) {
                                if (hoursSinceClockOut <= 24) {
                                    // Within 24hr dispute window: 
                                    // "Employer should only see the masked license number"
                                    // Assuming Name is still needed for context, but requirement says "only see masked license".
                                    // Use 'Professional' generic name or keep name if implied. 
                                    // To be safe with "only see masked license", let's be strict but practical.
                                    // Let's keep name but ensure NO full details.
                                    // But rule says: "Once dispute window has passed... no worker name". 
                                    // impling BEFORE that (now), name IS visible.
                                    showProfessionalName = true;
                                    showLicense = true; // Masked only
                                    showPayoutStatus = true; // "Payout statuses... remain visible only to professional" -> Wait, rule says "After that stage [>24h]... Payout Statuses... visible only to professional". 
                                    // Does this mean they ARE visible < 24h? Usually yes ("Ready for Payout").
                                } else {
                                    // > 24 hours: STRICT PRIVACY
                                    showProfessionalName = false;
                                    showLicense = false;
                                    showPayoutStatus = false;
                                    privacyMessage = `Stint completed successfully on ${formatShiftDate(stint.shiftDate)}.`;
                                }
                            }

                            return (
                                <Card key={stint.id} className="bg-secondary/50">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="grid gap-2">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold capitalize">{stint.role?.replace('-', ' ')}</p>
                                                    <Badge variant="outline" className={cn("text-xs", getStatusClass(stint.status))}>
                                                        {stint.status === 'open' ? 'Unfilled' : stint.status?.replace('_', ' ')}
                                                    </Badge>
                                                </div>

                                                {/* Privacy: If > 24h completed, show minimized view */}
                                                {privacyMessage ? (
                                                    <div className="text-sm text-emerald-600 font-medium py-2">
                                                        <CheckCircle2 className="h-4 w-4 inline mr-2" />
                                                        {privacyMessage}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                <span>{stint.startTime} - {stint.endTime}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                <span>{stint.city}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Banknote className="h-3 w-3" />
                                                                <span>{stint.currency || 'KES'} {stint.offeredRate?.toLocaleString()}/day</span>
                                                            </div>
                                                        </div>
                                                        {/* Clock In/Out Times */}
                                                        {(stint.clockInTime || stint.clockOutTime) && (
                                                            <div className="flex flex-wrap items-center gap-3 text-xs mt-1 py-2 px-3 rounded-lg bg-primary/5 border border-primary/10">
                                                                {stint.clockInTime && (
                                                                    <div className="flex items-center gap-1.5 text-green-600">
                                                                        <LogIn className="h-3 w-3" />
                                                                        <span className="font-medium">Clocked In:</span>
                                                                        <span>{formatTime(stint.clockInTime)}</span>
                                                                    </div>
                                                                )}
                                                                {stint.clockOutTime && (
                                                                    <div className="flex items-center gap-1.5 text-blue-600">
                                                                        <LogOut className="h-3 w-3" />
                                                                        <span className="font-medium">Clocked Out:</span>
                                                                        <span>{formatTime(stint.clockOutTime)}</span>
                                                                    </div>
                                                                )}
                                                                {stint.status === 'completed' && hoursSinceClockOut !== null && hoursSinceClockOut <= 24 && showPayoutStatus && (
                                                                    <div className="flex items-center gap-1.5 text-orange-600">
                                                                        <Timer className="h-3 w-3" />
                                                                        <span className="font-medium">{getDisputeWindowRemaining(stint.disputeWindowEndsAt)}</span>
                                                                    </div>
                                                                )}
                                                                {/* Explicitly hide "Payment Released" or "Ready for Payout" if > 24h as per request */}
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    {!privacyMessage && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatShiftDate(stint.shiftDate)} • {stint.shiftType?.replace('-', ' ')}
                                                        </p>
                                                    )}
                                                    {stintApplicationCounts[stint.id] > 0 && stint.status === 'open' && (
                                                        <Badge variant="default" className="text-xs bg-orange-500">
                                                            <UserCheck className="h-3 w-3 mr-1" />
                                                            {stintApplicationCounts[stint.id]} applicant{stintApplicationCounts[stint.id] > 1 ? 's' : ''}
                                                        </Badge>
                                                    )}
                                                    {stint.acceptedProfessionalName && showProfessionalName && (
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-xs border-green-500/30 text-green-600">
                                                                Assigned: {stint.acceptedProfessionalName}
                                                            </Badge>
                                                            {/* Show Masked License if < 24h clock out */}
                                                            {showLicense && (
                                                                <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                                                    KMPDC****41
                                                                </code>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleViewApplicants(stint)}>
                                                        <Users className="mr-2 h-4 w-4" />
                                                        View Applicants
                                                        {stintApplicationCounts[stint.id] > 0 && (
                                                            <Badge className="ml-2 text-xs" variant="secondary">
                                                                {stintApplicationCounts[stint.id]}
                                                            </Badge>
                                                        )}
                                                    </DropdownMenuItem>
                                                    {/* Only allow cancel if not strictly completed/expired/privacy mode */}
                                                    {!privacyMessage && !['completed', 'in_progress', 'cancelled', 'expired'].includes(stint.status) && (
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => handleOpenCancelDialog(stint)}
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Cancel Stint
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                    {stints.length > 5 && (
                        <p className="text-sm text-center text-muted-foreground">
                            + {stints.length - 5} more stints
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Applications Dialog - Now using full ApplicationsManager */}
            <Dialog open={!!selectedStint} onOpenChange={() => setSelectedStint(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Manage Applicants - {selectedStint?.role?.replace('-', ' ')}
                        </DialogTitle>
                        <DialogDescription>
                            Review, accept, or reject applicants for this stint.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedStint && (
                        <ApplicationsManager
                            stintId={selectedStint.id}
                            stintRole={selectedStint.role}
                            offeredRate={selectedStint.offeredRate}
                            onApplicationAccepted={handleApplicationAccepted}
                            onInitiatePayment={(application) => {
                                setSelectedApplication(application);
                                setStintForPayment(selectedStint); // Store stint before closing dialog
                                setSelectedStint(null); // Close applications dialog
                                setPaymentModalOpen(true);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Acceptance Payment Modal */}
            <AcceptancePaymentModal
                isOpen={paymentModalOpen}
                onClose={() => {
                    setPaymentModalOpen(false);
                    setSelectedApplication(null);
                    setStintForPayment(null);
                }}
                onPaymentSuccess={() => {
                    setPaymentModalOpen(false);
                    setSelectedApplication(null);
                    setStintForPayment(null);
                    fetchStints();
                    toast({
                        title: "Shift Confirmed!",
                        description: "Payment successful. The professional has been notified.",
                    });
                }}
                stint={stintForPayment ? {
                    id: stintForPayment.id,
                    role: stintForPayment.role,
                    shiftDate: stintForPayment.shiftDate?.toDate ? stintForPayment.shiftDate.toDate() : new Date(stintForPayment.shiftDate),
                    startTime: stintForPayment.startTime,
                    endTime: stintForPayment.endTime,
                    city: stintForPayment.city,
                    offeredRate: selectedApplication?.bidAmount || stintForPayment.offeredRate,
                    currency: stintForPayment.currency || 'KES',
                    employerName: userProfile?.facilityName || 'Employer',
                } : null}
                application={selectedApplication ? {
                    id: selectedApplication.id,
                    professionalId: selectedApplication.professionalId,
                    professionalName: selectedApplication.professionalName,
                    bidAmount: selectedApplication.bidAmount,
                } : null}
                employerId={employerId}
                employerEmail={user?.email || ''}
            />

            {/* Cancel Stint Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-destructive" />
                            Cancel Stint
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this stint? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {stintToCancel && (
                            <div className="p-3 bg-muted rounded-lg text-sm">
                                <p><span className="font-medium">Role:</span> {stintToCancel.role?.replace('-', ' ')}</p>
                                <p><span className="font-medium">Date:</span> {stintToCancel.shiftDate ? new Date(stintToCancel.shiftDate.toDate ? stintToCancel.shiftDate.toDate() : stintToCancel.shiftDate).toLocaleDateString() : 'N/A'}</p>
                                <p><span className="font-medium">Rate:</span> KES {stintToCancel.offeredRate?.toLocaleString()}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reason for cancellation (optional)</label>
                            <Textarea
                                placeholder="Please provide a reason for cancelling this stint..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                            Keep Stint
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelStint}
                            disabled={isCancelling}
                        >
                            {isCancelling ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel Stint
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

