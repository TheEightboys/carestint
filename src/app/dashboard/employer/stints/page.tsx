"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
    ArrowLeft, Briefcase, Clock, DollarSign, MapPin, User, Loader2,
    Calendar, CheckCircle2, XCircle, Play, AlertTriangle, Plus,
    Eye, Edit, Users, Star, Download, RefreshCw, MessageSquare,
    Info, HelpCircle, FileText, CreditCard, Building, Wallet
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

import { getStintsByEmployer, updateStint, getApplicationsByStint } from "@/lib/firebase/firestore";
import { useUser } from "@/lib/user-context";
import {
    EMPLOYER_TABS,
    EMPLOYER_ACTIONS,
    getStatusDisplay,
    filterStintsByTab,
    getStintCountByTab,
    isStintToday
} from "@/lib/stint-utils";
import type { StintStatus } from "@/lib/types";
import { AcceptancePaymentModal } from "@/components/dashboard/employer/acceptance-payment-modal";
import { useToast } from "@/hooks/use-toast";

export default function EmployerStintsPage() {
    const { user, userProfile, dualRoleInfo } = useUser();
    const employerId = dualRoleInfo?.employerId || userProfile?.id;
    const [stints, setStints] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("open");

    // Dialog states
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedStint, setSelectedStint] = useState<any>(null);
    const [cancelReason, setCancelReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [applicantsDialogOpen, setApplicantsDialogOpen] = useState(false);
    const [applicants, setApplicants] = useState<any[]>([]);
    const [loadingApplicants, setLoadingApplicants] = useState(false);

    // Rating Dialog State
    const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [ratingComment, setRatingComment] = useState("");

    // Confirm Hours Dialog State
    const [confirmHoursDialogOpen, setConfirmHoursDialogOpen] = useState(false);
    const [hoursConfirmed, setHoursConfirmed] = useState(false);

    // View Times Dialog State
    const [timesDialogOpen, setTimesDialogOpen] = useState(false);

    // View Credits Dialog State
    const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);

    // Add Evidence Dialog State
    const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
    const [evidenceNotes, setEvidenceNotes] = useState("");

    // View Review Status Dialog State
    const [reviewStatusDialogOpen, setReviewStatusDialogOpen] = useState(false);

    // Payment Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedApplicant, setSelectedApplicant] = useState<any>(null);

    const { toast } = useToast();

    useEffect(() => {
        if (employerId) {
            loadStints();
        }
    }, [employerId]);

    const loadStints = async () => {
        if (!employerId) return;

        try {
            const stintsData = await getStintsByEmployer(employerId);
            setStints(stintsData);
        } catch (error) {
            console.error("Error loading stints:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredStints = useMemo(() => {
        let filtered = filterStintsByTab(stints, activeTab, 'employer');

        // For "today" tab, also filter by today's date
        if (activeTab === 'today') {
            filtered = filtered.filter(stint => {
                const stintDate = stint.shiftDate?.toDate ? stint.shiftDate.toDate() : new Date(stint.shiftDate);
                return isStintToday(stintDate);
            });
        }

        return filtered;
    }, [stints, activeTab]);

    const tabCounts = useMemo(() => getStintCountByTab(stints, 'employer'), [stints]);

    const handleAction = async (actionId: string, stint: any) => {
        switch (actionId) {
            case 'cancel':
                setSelectedStint(stint);
                setCancelReason("");
                setCancelDialogOpen(true);
                break;
            case 'view_applicants':
                setSelectedStint(stint);
                setLoadingApplicants(true);
                setApplicantsDialogOpen(true);
                try {
                    const apps = await getApplicationsByStint(stint.id);
                    setApplicants(apps);
                } catch (error) {
                    console.error("Error loading applicants:", error);
                } finally {
                    setLoadingApplicants(false);
                }
                break;
            case 'view_pro':
                // Navigate to professional profile or open modal
                if (stint.acceptedProfessionalId) {
                    window.open(`/dashboard/professional/profile/${stint.acceptedProfessionalId}`, '_blank');
                }
                break;
            case 'rate_pro':
                setSelectedStint(stint);
                setRating(0);
                setRatingComment("");
                setRatingDialogOpen(true);
                break;
            case 'confirm_hours':
                setSelectedStint(stint);
                setHoursConfirmed(false);
                setConfirmHoursDialogOpen(true);
                break;
            case 'view_times':
                setSelectedStint(stint);
                setTimesDialogOpen(true);
                break;
            case 'view_credits':
                setSelectedStint(stint);
                setCreditsDialogOpen(true);
                break;
            case 'repost':
                // Create a repost by navigating to post form with prefilled data
                const repostData = encodeURIComponent(JSON.stringify({
                    role: stint.role,
                    shiftType: stint.shiftType,
                    offeredRate: stint.offeredRate,
                    startTime: stint.startTime,
                    endTime: stint.endTime,
                    city: stint.city,
                    description: stint.description
                }));
                window.location.href = `/dashboard/employer?repost=${repostData}`;
                break;
            case 'download_invoice':
                // Generate and download invoice
                generateInvoice(stint);
                break;
            case 'add_evidence':
                setSelectedStint(stint);
                setEvidenceNotes("");
                setEvidenceDialogOpen(true);
                break;
            case 'view_status':
                setSelectedStint(stint);
                setReviewStatusDialogOpen(true);
                break;
            case 'view_reason':
                setSelectedStint(stint);
                setReviewStatusDialogOpen(true);
                break;
        }
    };

    const generateInvoice = (stint: any) => {
        // Create a simple invoice document
        const invoiceContent = `
CARESTINT INVOICE
==================

Invoice ID: INV-${stint.id?.slice(0, 8)?.toUpperCase()}
Date: ${new Date().toLocaleDateString()}

Shift Details:
- Role: ${stint.role?.replace('-', ' ') || 'N/A'}
- Date: ${stint.shiftDate ? new Date(stint.shiftDate.toDate ? stint.shiftDate.toDate() : stint.shiftDate).toLocaleDateString() : 'N/A'}
- Time: ${stint.startTime} - ${stint.endTime}
- Professional: ${stint.acceptedProfessionalName || 'N/A'}

Cost Breakdown:
- Base Rate: KES ${stint.offeredRate?.toLocaleString() || 0}
- Platform Fee (${stint.bookingFeePercent || 10}%): KES ${Math.round((stint.offeredRate || 0) * ((stint.bookingFeePercent || 10) / 100)).toLocaleString()}
- Total: KES ${Math.round((stint.offeredRate || 0) * (1 + (stint.bookingFeePercent || 10) / 100)).toLocaleString()}

Status: ${stint.status?.toUpperCase()}

Thank you for using CareStint!
        `.trim();

        // Create download
        const blob = new Blob([invoiceContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${stint.id?.slice(0, 8)}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const submitRating = async () => {
        if (!selectedStint || rating === 0) return;

        setIsSubmitting(true);
        try {
            await updateStint(selectedStint.id, {
                employerRating: rating,
                employerRatingComment: ratingComment,
                ratedByEmployerAt: new Date()
            });
            await loadStints();
            setRatingDialogOpen(false);
        } catch (error) {
            console.error("Error submitting rating:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitConfirmHours = async () => {
        if (!selectedStint) return;

        setIsSubmitting(true);
        try {
            await updateStint(selectedStint.id, {
                hoursConfirmedByEmployer: true,
                hoursConfirmedAt: new Date(),
                status: 'closed' as StintStatus
            });
            await loadStints();
            setConfirmHoursDialogOpen(false);
        } catch (error) {
            console.error("Error confirming hours:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitEvidence = async () => {
        if (!selectedStint || !evidenceNotes) return;

        setIsSubmitting(true);
        try {
            await updateStint(selectedStint.id, {
                employerEvidence: evidenceNotes,
                evidenceSubmittedAt: new Date()
            });
            await loadStints();
            setEvidenceDialogOpen(false);
        } catch (error) {
            console.error("Error submitting evidence:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitCancel = async () => {
        if (!selectedStint) return;

        setIsSubmitting(true);
        try {
            await updateStint(selectedStint.id, {
                status: 'cancelled' as StintStatus,
                cancellationReason: cancelReason,
                cancelledAt: new Date(),
            });

            await loadStints();
            setCancelDialogOpen(false);
        } catch (error) {
            console.error("Error cancelling stint:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: StintStatus) => {
        const config = getStatusDisplay(status);
        return (
            <Badge className={`${config.bgColor} ${config.color} border-0`}>
                {config.label}
            </Badge>
        );
    };

    const getActionIcon = (iconName: string) => {
        const icons: Record<string, any> = {
            Edit, Users, XCircle, User, MessageSquare, Clock, HelpCircle, AlertTriangle,
            CheckCircle: CheckCircle2, Star, Download, RefreshCw, Info, FileText, Eye, CreditCard
        };
        const Icon = icons[iconName] || Info;
        return <Icon className="h-4 w-4 mr-2" />;
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
                        <Link href="/dashboard/employer">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Dashboard
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-headline text-xl font-semibold">My Stints</h1>
                        <p className="text-sm text-muted-foreground">Manage all your posted shifts</p>
                    </div>
                </div>
                <Button asChild>
                    <Link href="/dashboard/employer">
                        <Plus className="h-4 w-4 mr-2" />
                        Post New Stint
                    </Link>
                </Button>
            </header>

            <main className="flex flex-1 flex-col gap-6 p-4 sm:px-6 md:py-6">
                {/* Stats Summary */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                    {EMPLOYER_TABS.map(tab => (
                        <Card
                            key={tab.id}
                            className={`cursor-pointer transition-all hover:border-accent ${activeTab === tab.id ? 'border-accent bg-accent/5' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <CardContent className="p-4">
                                <div className="text-2xl font-bold">{tabCounts[tab.id] || 0}</div>
                                <p className="text-xs text-muted-foreground">{tab.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tabs and Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/50 p-1 h-auto">
                        {EMPLOYER_TABS.map(tab => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-background px-4 py-2"
                            >
                                {tab.label}
                                <Badge variant="secondary" className="ml-1 text-xs">
                                    {tabCounts[tab.id] || 0}
                                </Badge>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* Tab Content */}
                    <div className="mt-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">
                                    {EMPLOYER_TABS.find(t => t.id === activeTab)?.label}
                                </CardTitle>
                                <CardDescription>
                                    {EMPLOYER_TABS.find(t => t.id === activeTab)?.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {filteredStints.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                        <p className="font-medium">{EMPLOYER_TABS.find(t => t.id === activeTab)?.emptyMessage}</p>
                                        {activeTab === 'open' && (
                                            <Button asChild className="mt-4">
                                                <Link href="/dashboard/employer">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Post Your First Stint
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredStints.map((stint) => (
                                            <div
                                                key={stint.id}
                                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors ${stint.status === 'disputed' || stint.status === 'under_review' ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
                                            >
                                                {/* Stint Info */}
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="font-semibold capitalize">
                                                            {stint.role?.replace('-', ' ') || 'Unknown Role'}
                                                        </h3>
                                                        {getStatusBadge(stint.status)}
                                                        <Badge variant="outline" className="text-xs">
                                                            {stint.shiftType}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {stint.shiftDate ? new Date(stint.shiftDate.toDate ? stint.shiftDate.toDate() : stint.shiftDate).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {stint.startTime} - {stint.endTime}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            {stint.city}
                                                        </span>
                                                        <span className="flex items-center gap-1 font-medium text-foreground">
                                                            <DollarSign className="h-3.5 w-3.5" />
                                                            KES {stint.offeredRate?.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {stint.acceptedProfessionalName && (
                                                        <p className="text-sm flex items-center gap-1 text-accent">
                                                            <User className="h-3.5 w-3.5" />
                                                            Assigned to: {stint.acceptedProfessionalName}
                                                        </p>
                                                    )}
                                                    {/* Review Status Indicator for Issues */}
                                                    {(stint.status === 'disputed' || stint.status === 'under_review' || stint.status === 'no_show') && (
                                                        <div className="mt-2 p-2 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <AlertTriangle className="h-4 w-4" />
                                                                <span className="font-medium">
                                                                    {stint.disputeResolved ? 'Resolved – adjustment applied' : 'CareStint reviewing'}
                                                                </span>
                                                            </div>
                                                            {stint.refundAmount && (
                                                                <p className="text-xs mt-1">Credit issued: KES {stint.refundAmount?.toLocaleString()}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* Cancellation reason display */}
                                                    {stint.status === 'cancelled' && stint.cancellationReason && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Cancelled: {stint.cancellationReason}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm">
                                                                Actions
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {EMPLOYER_ACTIONS[stint.status as StintStatus]?.map(action => (
                                                                <DropdownMenuItem
                                                                    key={action.id}
                                                                    onClick={() => handleAction(action.id, stint)}
                                                                    className={action.variant === 'destructive' ? 'text-destructive' : ''}
                                                                >
                                                                    {getActionIcon(action.icon)}
                                                                    {action.label}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </Tabs>
            </main>

            {/* Cancel Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-destructive" />
                            Cancel Stint
                        </DialogTitle>
                        <DialogDescription>
                            {selectedStint?.status === 'confirmed'
                                ? "Cancelling after confirmation may incur a penalty. The professional will be notified."
                                : "Are you sure you want to cancel this stint? This action cannot be undone."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedStint && (
                            <div className="p-3 bg-muted rounded-lg text-sm">
                                <p><span className="font-medium">Role:</span> {selectedStint.role}</p>
                                <p><span className="font-medium">Date:</span> {selectedStint.shiftDate ? new Date(selectedStint.shiftDate.toDate ? selectedStint.shiftDate.toDate() : selectedStint.shiftDate).toLocaleDateString() : 'N/A'}</p>
                                <p><span className="font-medium">Rate:</span> KES {selectedStint.offeredRate?.toLocaleString()}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reason for cancellation</label>
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
                            onClick={submitCancel}
                            disabled={!cancelReason.trim() || isSubmitting}
                        >
                            {isSubmitting ? (
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

            {/* Applicants Dialog */}
            <Dialog open={applicantsDialogOpen} onOpenChange={setApplicantsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-accent" />
                            Applicants
                        </DialogTitle>
                        <DialogDescription>
                            View and manage applicants for this stint
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {loadingApplicants ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : applicants.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>No applicants yet</p>
                                <p className="text-sm">Applicants will appear here once professionals apply</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {applicants.map((applicant: any) => (
                                    <div
                                        key={applicant.id}
                                        className="flex items-center justify-between p-4 border rounded-lg"
                                    >
                                        <div>
                                            <p className="font-medium">{applicant.professionalName}</p>
                                            <p className="text-sm text-muted-foreground capitalize">
                                                {applicant.professionalRole?.replace('-', ' ')}
                                            </p>
                                            {applicant.isBid && (
                                                <p className="text-sm text-accent font-medium">
                                                    Bid: KES {applicant.bidAmount?.toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={
                                                applicant.status === 'accepted' ? 'default' :
                                                    applicant.status === 'rejected' ? 'destructive' :
                                                        'secondary'
                                            }>
                                                {applicant.status}
                                            </Badge>
                                            {applicant.status === 'pending' && (
                                                <>
                                                    <Button size="sm" variant="outline">
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        View
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedApplicant(applicant);
                                                            setApplicantsDialogOpen(false);
                                                            setPaymentModalOpen(true);
                                                        }}
                                                    >
                                                        <Wallet className="h-4 w-4 mr-1" />
                                                        Accept & Pay
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Rate Professional Dialog */}
            <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Rate Professional
                        </DialogTitle>
                        <DialogDescription>
                            Share your experience working with this professional
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {selectedStint && (
                            <div className="p-3 bg-muted rounded-lg text-sm">
                                <p><span className="font-medium">Professional:</span> {selectedStint.acceptedProfessionalName}</p>
                                <p><span className="font-medium">Shift:</span> {selectedStint.role?.replace('-', ' ')} on {selectedStint.shiftDate ? new Date(selectedStint.shiftDate.toDate ? selectedStint.shiftDate.toDate() : selectedStint.shiftDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Rating</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`p-1 rounded transition-colors ${rating >= star ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-300'}`}
                                    >
                                        <Star className="h-8 w-8 fill-current" />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Comment (optional)</label>
                            <Textarea
                                placeholder="Share your experience..."
                                value={ratingComment}
                                onChange={(e) => setRatingComment(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRatingDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={submitRating}
                            disabled={rating === 0 || isSubmitting}
                            className="bg-yellow-500 hover:bg-yellow-600"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Star className="h-4 w-4 mr-2" />}
                            Submit Rating
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Hours Dialog */}
            <Dialog open={confirmHoursDialogOpen} onOpenChange={setConfirmHoursDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            Confirm Hours
                        </DialogTitle>
                        <DialogDescription>
                            Review and confirm the hours worked for this shift
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {selectedStint && (
                            <div className="p-4 bg-muted rounded-lg space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Shift Date</span>
                                    <span className="font-medium">{selectedStint.shiftDate ? new Date(selectedStint.shiftDate.toDate ? selectedStint.shiftDate.toDate() : selectedStint.shiftDate).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Scheduled Time</span>
                                    <span className="font-medium">{selectedStint.startTime} - {selectedStint.endTime}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Clock In</span>
                                    <span className="font-medium">{selectedStint.clockInTime ? new Date(selectedStint.clockInTime.toDate ? selectedStint.clockInTime.toDate() : selectedStint.clockInTime).toLocaleTimeString() : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Clock Out</span>
                                    <span className="font-medium">{selectedStint.clockOutTime ? new Date(selectedStint.clockOutTime.toDate ? selectedStint.clockOutTime.toDate() : selectedStint.clockOutTime).toLocaleTimeString() : 'N/A'}</span>
                                </div>
                                <div className="border-t pt-2 flex justify-between">
                                    <span className="text-muted-foreground">Rate</span>
                                    <span className="font-bold text-lg">KES {selectedStint.offeredRate?.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm text-green-800 dark:text-green-300">
                                By confirming, you acknowledge that the hours worked are accurate and the professional completed the shift successfully.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmHoursDialogOpen(false)}>Dispute Hours</Button>
                        <Button
                            onClick={submitConfirmHours}
                            disabled={isSubmitting}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            Confirm Hours
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Times Dialog */}
            <Dialog open={timesDialogOpen} onOpenChange={setTimesDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Clock Times
                        </DialogTitle>
                        <DialogDescription>
                            View the clock-in and clock-out times for this shift
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {selectedStint && (
                            <div className="space-y-4">
                                <div className="p-4 bg-muted rounded-lg space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Scheduled Start</span>
                                        <span className="font-medium">{selectedStint.startTime}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Clock In</span>
                                        <span className="font-medium">
                                            {selectedStint.clockInTime ? new Date(selectedStint.clockInTime.toDate ? selectedStint.clockInTime.toDate() : selectedStint.clockInTime).toLocaleTimeString() : 'Not clocked in'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Scheduled End</span>
                                        <span className="font-medium">{selectedStint.endTime}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Clock Out</span>
                                        <span className="font-medium">
                                            {selectedStint.clockOutTime ? new Date(selectedStint.clockOutTime.toDate ? selectedStint.clockOutTime.toDate() : selectedStint.clockOutTime).toLocaleTimeString() : 'Not clocked out'}
                                        </span>
                                    </div>
                                </div>
                                {selectedStint.wasLate && (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                        <p className="text-sm text-amber-800 dark:text-amber-300">
                                            <strong>Note:</strong> The professional clocked in late for this shift.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setTimesDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Credits/Refunds Dialog */}
            <Dialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Credits & Refunds
                        </DialogTitle>
                        <DialogDescription>
                            View any credits or refunds issued for this stint
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {selectedStint && (
                            <div className="space-y-4">
                                {selectedStint.refundAmount ? (
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="text-green-800 dark:text-green-300 font-medium">Refund Issued</span>
                                            <span className="text-xl font-bold text-green-600">KES {selectedStint.refundAmount?.toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-green-700 dark:text-green-400 mt-2">
                                            Refund was processed on {selectedStint.refundedAt ? new Date(selectedStint.refundedAt.toDate ? selectedStint.refundedAt.toDate() : selectedStint.refundedAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-muted rounded-lg text-center">
                                        <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                        <p className="text-muted-foreground">No credits or refunds for this stint</p>
                                    </div>
                                )}
                                <div className="text-sm text-muted-foreground">
                                    <p>For questions about refunds, please contact CareStint support.</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreditsDialogOpen(false)}>Close</Button>
                        <Button asChild>
                            <a href="mailto:support@carestint.com">Contact Support</a>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Evidence Dialog */}
            <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-amber-600" />
                            Add Evidence / Comment
                        </DialogTitle>
                        <DialogDescription>
                            Provide evidence or comments to support your dispute or no-show claim
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedStint && (
                            <div className="p-3 bg-muted rounded-lg text-sm">
                                <p><span className="font-medium">Stint:</span> {selectedStint.role?.replace('-', ' ')}</p>
                                <p><span className="font-medium">Professional:</span> {selectedStint.acceptedProfessionalName || 'N/A'}</p>
                                <p><span className="font-medium">Date:</span> {selectedStint.shiftDate ? new Date(selectedStint.shiftDate.toDate ? selectedStint.shiftDate.toDate() : selectedStint.shiftDate).toLocaleDateString() : 'N/A'}</p>
                                <p><span className="font-medium">Status:</span> {selectedStint.status}</p>
                            </div>
                        )}
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                <strong>Tip:</strong> Include details like communication logs, screenshots, or other relevant information to support your case.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Evidence / Comments <span className="text-destructive">*</span></label>
                            <Textarea
                                placeholder="Describe the situation and provide any relevant details or evidence..."
                                value={evidenceNotes}
                                onChange={(e) => setEvidenceNotes(e.target.value)}
                                rows={5}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEvidenceDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={submitEvidence}
                            disabled={!evidenceNotes.trim() || isSubmitting}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                            Submit Evidence
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Review Status Dialog */}
            <Dialog open={reviewStatusDialogOpen} onOpenChange={setReviewStatusDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Review Status
                        </DialogTitle>
                        <DialogDescription>
                            Current status and resolution details for this stint
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {selectedStint && (
                            <>
                                <div className="p-4 rounded-lg bg-muted space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Current Status</span>
                                        <Badge className={`${getStatusDisplay(selectedStint.status).bgColor} ${getStatusDisplay(selectedStint.status).color}`}>
                                            {getStatusDisplay(selectedStint.status).label}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Review Stage</span>
                                        <span className="font-medium">
                                            {selectedStint.disputeResolved ? '✅ Resolved' : selectedStint.status === 'under_review' ? '🔍 Under Review' : '⏳ Pending'}
                                        </span>
                                    </div>
                                    {selectedStint.cancellationReason && (
                                        <div className="border-t pt-2">
                                            <p className="text-sm text-muted-foreground">Cancellation Reason:</p>
                                            <p className="text-sm">{selectedStint.cancellationReason}</p>
                                        </div>
                                    )}
                                </div>
                                {selectedStint.disputeResolved && (
                                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                        <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Resolution</h4>
                                        <p className="text-sm text-green-700 dark:text-green-400">
                                            {selectedStint.resolutionNotes || 'This issue has been resolved by CareStint.'}
                                        </p>
                                        {selectedStint.refundAmount > 0 && (
                                            <p className="text-sm font-medium mt-2">
                                                Credit issued: KES {selectedStint.refundAmount?.toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {!selectedStint.disputeResolved && (selectedStint.status === 'disputed' || selectedStint.status === 'under_review') && (
                                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                        <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">CareStint Reviewing</h4>
                                        <p className="text-sm text-amber-700 dark:text-amber-400">
                                            Our team is reviewing this issue. You will be notified once a resolution is reached. This typically takes 24-48 hours.
                                        </p>
                                    </div>
                                )}
                                <div className="text-sm text-muted-foreground">
                                    <p>Questions? <a href="mailto:support@carestint.com" className="text-accent hover:underline">Contact support</a></p>
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setReviewStatusDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Acceptance Payment Modal */}
            <AcceptancePaymentModal
                isOpen={paymentModalOpen}
                onClose={() => {
                    setPaymentModalOpen(false);
                    setSelectedApplicant(null);
                }}
                onPaymentSuccess={() => {
                    setPaymentModalOpen(false);
                    setSelectedApplicant(null);
                    loadStints();
                    toast({
                        title: "Shift Confirmed!",
                        description: "Payment successful. The professional has been notified.",
                    });
                }}
                stint={selectedStint ? {
                    id: selectedStint.id,
                    role: selectedStint.role,
                    shiftDate: selectedStint.shiftDate?.toDate ? selectedStint.shiftDate.toDate() : new Date(selectedStint.shiftDate),
                    startTime: selectedStint.startTime,
                    endTime: selectedStint.endTime,
                    city: selectedStint.city,
                    offeredRate: selectedApplicant?.bidAmount || selectedStint.offeredRate,
                    currency: selectedStint.currency || 'KES',
                    employerName: userProfile?.facilityName || 'Employer',
                } : null}
                application={selectedApplicant ? {
                    id: selectedApplicant.id,
                    professionalId: selectedApplicant.professionalId,
                    professionalName: selectedApplicant.professionalName,
                    bidAmount: selectedApplicant.bidAmount,
                } : null}
                employerId={employerId || ''}
                employerEmail={user?.email || ''}
            />
        </div>
    );
}
