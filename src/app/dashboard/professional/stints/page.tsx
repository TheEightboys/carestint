"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
    ArrowLeft, Briefcase, Clock, Banknote, MapPin, Loader2,
    Calendar, CheckCircle2, XCircle, Play, AlertTriangle, Search,
    Eye, Star, Download, MessageSquare, Building, Wallet, Send,
    Info, FileText, LogIn, LogOut, Bookmark, AlertCircle, Upload
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
import { Progress } from "@/components/ui/progress";

import { getStintsByProfessional, getOpenStints, getApplicationsByProfessional, updateStint, addStintApplication, clockInStint, clockOutStint } from "@/lib/firebase/firestore";
import { useUser } from "@/lib/user-context";
import {
    PROFESSIONAL_TABS,
    PROFESSIONAL_ACTIONS,
    getStatusDisplay,
    filterStintsByTab,
    getStintCountByTab,
    isStintToday
} from "@/lib/stint-utils";
import type { StintStatus } from "@/lib/types";

export default function ProfessionalStintsPage() {
    const { user, userProfile, dualRoleInfo } = useUser();
    const professionalId = dualRoleInfo?.professionalId || userProfile?.id;
    const professionalData = userProfile;
    const [stints, setStints] = useState<any[]>([]);
    const [availableStints, setAvailableStints] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("available");

    // Dialog states
    const [applyDialogOpen, setApplyDialogOpen] = useState(false);
    const [selectedStint, setSelectedStint] = useState<any>(null);
    const [applicationMessage, setApplicationMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");

    // Rate Clinic Dialog State
    const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [ratingComment, setRatingComment] = useState("");

    // View Clinic Details Dialog State
    const [clinicDialogOpen, setClinicDialogOpen] = useState(false);

    // Upload Notes Dialog State
    const [uploadNotesDialogOpen, setUploadNotesDialogOpen] = useState(false);
    const [clarificationNotes, setClarificationNotes] = useState("");

    // View Policy Dialog State
    const [policyDialogOpen, setPolicyDialogOpen] = useState(false);

    // Report Issue Dialog State
    const [reportIssueDialogOpen, setReportIssueDialogOpen] = useState(false);
    const [issueType, setIssueType] = useState("");
    const [issueDescription, setIssueDescription] = useState("");

    // Appeal Dialog State
    const [appealDialogOpen, setAppealDialogOpen] = useState(false);
    const [appealReason, setAppealReason] = useState("");
    const [appealEvidence, setAppealEvidence] = useState("");

    // Earnings summary
    const [earnings, setEarnings] = useState({ total: 0, thisMonth: 0, pending: 0 });

    useEffect(() => {
        if (professionalId) {
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [professionalId, userProfile?.primaryRole]);

    const loadData = async () => {
        if (!professionalId) return;

        try {
            const [myStints, openStints, myApps] = await Promise.all([
                getStintsByProfessional(professionalId),
                getOpenStints(),
                getApplicationsByProfessional(professionalId)
            ]);

            setStints(myStints);

            // ROLE ENFORCEMENT: Filter stints to only show those matching professional's verified role
            const professionalRole = userProfile?.primaryRole;
            console.log('🔒 Role Filter Debug:', {
                professionalRole,
                totalOpenStints: openStints.length,
                openStintRoles: openStints.map((s: any) => s.role)
            });

            const roleFilteredStints = professionalRole
                ? openStints.filter((s: any) => {
                    // Case-insensitive comparison and handle hyphenated roles
                    const stintRole = (s.role || '').toLowerCase().replace(/\s+/g, '-');
                    const profRole = professionalRole.toLowerCase().replace(/\s+/g, '-');
                    return stintRole === profRole;
                })
                : []; // Show none if no role defined - forces profile completion

            console.log('🔒 Filtered to:', roleFilteredStints.length, 'stints');
            setAvailableStints(roleFilteredStints);
            setApplications(myApps);

            // Calculate earnings from completed stints
            const completedStints = myStints.filter((s: any) => s.status === 'completed' || s.status === 'closed');
            const totalEarnings = completedStints.reduce((sum: number, s: any) => {
                const rate = s.offeredRate || 0;
                const fee = rate * 0.05; // 5% platform fee
                return sum + (rate - fee);
            }, 0);

            const thisMonth = new Date();
            const monthlyStints = completedStints.filter((s: any) => {
                const stintDate = s.completedAt?.toDate ? s.completedAt.toDate() : new Date(s.completedAt);
                return stintDate.getMonth() === thisMonth.getMonth() && stintDate.getFullYear() === thisMonth.getFullYear();
            });
            const monthlyEarnings = monthlyStints.reduce((sum: number, s: any) => {
                const rate = s.offeredRate || 0;
                const fee = rate * 0.05;
                return sum + (rate - fee);
            }, 0);

            setEarnings({
                total: totalEarnings,
                thisMonth: monthlyEarnings,
                pending: 0
            });
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getDisplayStints = useMemo(() => {
        if (activeTab === 'available') {
            // Filter out stints the user has already applied to
            const appliedStintIds = applications.map((a: any) => a.stintId);
            return availableStints.filter(stint => !appliedStintIds.includes(stint.id));
        }

        let filtered = filterStintsByTab(stints, activeTab, 'professional');

        // For "today" tab, also filter by today's date
        if (activeTab === 'today') {
            filtered = filtered.filter(stint => {
                const stintDate = stint.shiftDate?.toDate ? stint.shiftDate.toDate() : new Date(stint.shiftDate);
                return isStintToday(stintDate);
            });
        }

        return filtered;
    }, [stints, availableStints, applications, activeTab]);

    const tabCounts = useMemo(() => {
        const counts = getStintCountByTab(stints, 'professional');
        // Override available count
        const appliedStintIds = applications.map((a: any) => a.stintId);
        counts['available'] = availableStints.filter(stint => !appliedStintIds.includes(stint.id)).length;
        return counts;
    }, [stints, availableStints, applications]);

    const handleAction = async (actionId: string, stint: any) => {
        switch (actionId) {
            case 'apply':
                setSelectedStint(stint);
                setApplicationMessage("");
                setApplyDialogOpen(true);
                break;
            case 'cancel':
                setSelectedStint(stint);
                setCancelReason("");
                setCancelDialogOpen(true);
                break;
            case 'clock_in':
                await handleClockIn(stint);
                break;
            case 'clock_out':
                await handleClockOut(stint);
                break;
            case 'view_clinic':
                setSelectedStint(stint);
                setClinicDialogOpen(true);
                break;
            case 'rate_clinic':
                setSelectedStint(stint);
                setRating(0);
                setRatingComment("");
                setRatingDialogOpen(true);
                break;
            case 'upload_notes':
                setSelectedStint(stint);
                setClarificationNotes("");
                setUploadNotesDialogOpen(true);
                break;
            case 'view_policy':
            case 'view_reason':
                setSelectedStint(stint);
                setPolicyDialogOpen(true);
                break;
            case 'report_issue':
                setSelectedStint(stint);
                setIssueType("");
                setIssueDescription("");
                setReportIssueDialogOpen(true);
                break;
            case 'appeal':
                setSelectedStint(stint);
                setAppealReason("");
                setAppealEvidence("");
                setAppealDialogOpen(true);
                break;
            case 'add_calendar':
                addToCalendar(stint);
                break;
            case 'download_statement':
                downloadStatement(stint);
                break;
            case 'view_earnings':
            case 'view_shift':
            case 'view_details':
                setSelectedStint(stint);
                setClinicDialogOpen(true);
                break;
        }
    };

    const addToCalendar = (stint: any) => {
        const stintDate = stint.shiftDate?.toDate ? stint.shiftDate.toDate() : new Date(stint.shiftDate);
        const startDate = new Date(stintDate);
        const [startHour, startMin] = (stint.startTime || "09:00").split(':');
        startDate.setHours(parseInt(startHour), parseInt(startMin), 0);

        const endDate = new Date(stintDate);
        const [endHour, endMin] = (stint.endTime || "17:00").split(':');
        endDate.setHours(parseInt(endHour), parseInt(endMin), 0);

        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:CareStint Shift - ${stint.role?.replace('-', ' ')}
DESCRIPTION:Shift at ${stint.employerName}. Address: ${stint.address || 'See details in app'}
LOCATION:${stint.city || 'N/A'}
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `carestint-shift-${stint.id?.slice(0, 8)}.ics`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const downloadStatement = (stint: any) => {
        const netEarnings = calculateNetEarnings(stint.offeredRate || 0);
        const statement = `
CARESTINT EARNINGS STATEMENT
============================

Statement ID: STMT-${stint.id?.slice(0, 8)?.toUpperCase()}
Date: ${new Date().toLocaleDateString()}

Shift Details:
- Role: ${stint.role?.replace('-', ' ') || 'N/A'}
- Employer: ${stint.employerName}
- Date: ${stint.shiftDate ? new Date(stint.shiftDate.toDate ? stint.shiftDate.toDate() : stint.shiftDate).toLocaleDateString() : 'N/A'}
- Time: ${stint.startTime} - ${stint.endTime}

Earnings Breakdown:
- Gross Rate: KES ${stint.offeredRate?.toLocaleString() || 0}
- Platform Fee (5%): KES ${Math.round((stint.offeredRate || 0) * 0.05).toLocaleString()}
- Net Earnings: KES ${netEarnings.toLocaleString()}

Status: ${stint.status?.toUpperCase()}
${stint.paidAt ? `Paid on: ${new Date(stint.paidAt.toDate ? stint.paidAt.toDate() : stint.paidAt).toLocaleDateString()}` : 'Payment pending'}

Thank you for working with CareStint!
        `.trim();

        const blob = new Blob([statement], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statement-${stint.id?.slice(0, 8)}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const submitRating = async () => {
        if (!selectedStint || rating === 0) return;

        setIsSubmitting(true);
        try {
            await updateStint(selectedStint.id, {
                professionalRating: rating,
                professionalRatingComment: ratingComment,
                ratedByProfessionalAt: new Date()
            });
            await loadData();
            setRatingDialogOpen(false);
        } catch (error) {
            console.error("Error submitting rating:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitAppeal = async () => {
        if (!selectedStint || !appealReason) return;

        setIsSubmitting(true);
        try {
            await updateStint(selectedStint.id, {
                appealSubmitted: true,
                appealReason,
                appealEvidence,
                appealSubmittedAt: new Date(),
                status: 'under_review' as StintStatus
            });
            await loadData();
            setAppealDialogOpen(false);
        } catch (error) {
            console.error("Error submitting appeal:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitClarification = async () => {
        if (!selectedStint || !clarificationNotes) return;

        setIsSubmitting(true);
        try {
            await updateStint(selectedStint.id, {
                professionalClarification: clarificationNotes,
                clarificationSubmittedAt: new Date()
            });
            await loadData();
            setUploadNotesDialogOpen(false);
        } catch (error) {
            console.error("Error submitting clarification:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitIssueReport = async () => {
        if (!selectedStint || !issueType || !issueDescription) return;

        setIsSubmitting(true);
        try {
            await updateStint(selectedStint.id, {
                reportedIssue: {
                    type: issueType,
                    description: issueDescription,
                    reportedAt: new Date()
                }
            });
            await loadData();
            setReportIssueDialogOpen(false);
        } catch (error) {
            console.error("Error reporting issue:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClockIn = async (stint: any) => {
        try {
            await clockInStint(stint.id);
            await loadData();
        } catch (error) {
            console.error("Error clocking in:", error);
        }
    };

    const handleClockOut = async (stint: any) => {
        try {
            await clockOutStint(stint.id);
            await loadData();
        } catch (error) {
            console.error("Error clocking out:", error);
        }
    };

    const submitApplication = async () => {
        if (!selectedStint || !professionalId || !userProfile) return;

        setIsSubmitting(true);
        try {
            await addStintApplication({
                stintId: selectedStint.id,
                professionalId,
                professionalName: userProfile?.fullName || 'Professional',
                professionalRole: (userProfile?.primaryRole || 'other') as any,
                isBid: false,
                message: applicationMessage
            });

            await loadData();
            setApplyDialogOpen(false);
        } catch (error: any) {
            console.error("Error applying:", error);
            // Show user-friendly error for role mismatch
            if (error?.message?.includes('ROLE_MISMATCH')) {
                alert('This stint requires a different professional role. You can only apply to stints matching your verified profession.');
            }
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
            Info, Send, Bookmark, Building, Calendar, XCircle, LogIn, LogOut, Clock, AlertTriangle,
            Wallet, Star, Download, FileText, Eye, Upload, MessageSquare
        };
        const Icon = icons[iconName] || Info;
        return <Icon className="h-4 w-4 mr-2" />;
    };

    const calculateNetEarnings = (rate: number) => {
        const fee = rate * 0.05;
        return rate - fee;
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
                        <h1 className="font-headline text-xl font-semibold">My Stints</h1>
                        <p className="text-sm text-muted-foreground">Find opportunities and track your earnings</p>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 flex-col gap-6 p-4 sm:px-6 md:py-6">
                {/* Earnings Summary */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                    <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                                    <Wallet className="h-5 w-5 text-accent" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                                    <p className="text-2xl font-bold text-accent">KES {earnings.total.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                                    <Banknote className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">This Month</p>
                                    <p className="text-2xl font-bold">KES {earnings.thisMonth.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                                    <Briefcase className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Completed Shifts</p>
                                    <p className="text-2xl font-bold">{stints.filter(s => s.status === 'completed' || s.status === 'closed').length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs and Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/50 p-1 h-auto">
                        {PROFESSIONAL_TABS.map(tab => (
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
                                    {PROFESSIONAL_TABS.find(t => t.id === activeTab)?.label}
                                </CardTitle>
                                <CardDescription>
                                    {PROFESSIONAL_TABS.find(t => t.id === activeTab)?.description}
                                </CardDescription>

                                {/* Role Indicator for Available Stints Tab */}
                                {activeTab === 'available' && userProfile?.primaryRole && (
                                    <div className="mt-3 p-3 bg-accent/10 border border-accent/20 rounded-lg flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-accent" />
                                        <span className="text-sm">
                                            <strong>Role:</strong>{' '}
                                            <span className="capitalize">{userProfile.primaryRole.replace('-', ' ')}</span>
                                            {' '}
                                            <span className="text-muted-foreground">(based on your verified profile)</span>
                                        </span>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                {getDisplayStints.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                        <p className="font-medium">{PROFESSIONAL_TABS.find(t => t.id === activeTab)?.emptyMessage}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {getDisplayStints.map((stint) => (
                                            <div
                                                key={stint.id}
                                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors ${stint.status === 'disputed' || stint.status === 'under_review' ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10' : ''} ${stint.status === 'no_show' ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10' : ''}`}
                                            >
                                                {/* Stint Info */}
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="font-semibold capitalize">
                                                            {stint.role?.replace('-', ' ') || 'Unknown Role'}
                                                        </h3>
                                                        {stint.status && getStatusBadge(stint.status)}
                                                        <Badge variant="outline" className="text-xs">
                                                            {stint.shiftType}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Building className="h-3.5 w-3.5" />
                                                            {stint.employerName}
                                                        </span>
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
                                                    </div>
                                                    {/* Review Status Indicator for Issues */}
                                                    {(stint.status === 'disputed' || stint.status === 'under_review') && (
                                                        <div className="mt-2 p-2 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <AlertCircle className="h-4 w-4" />
                                                                <span className="font-medium">
                                                                    {stint.disputeResolved ? 'Resolved – see final earnings' : 'Under review by CareStint'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* No-Show Policy Warning */}
                                                    {stint.status === 'no_show' && (
                                                        <div className="mt-2 p-2 rounded-md bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <AlertCircle className="h-4 w-4" />
                                                                <span className="font-medium">No-show recorded</span>
                                                            </div>
                                                            <p className="text-xs mt-1">Multiple no-shows may affect your reliability score and booking eligibility.</p>
                                                        </div>
                                                    )}
                                                    {/* Cancellation reason display */}
                                                    {stint.status === 'cancelled' && stint.cancellationReason && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Cancelled: {stint.cancellationReason}
                                                        </p>
                                                    )}
                                                    {/* Earnings Display */}
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-lg font-bold text-accent flex items-center gap-1">
                                                            <Wallet className="h-4 w-4" />
                                                            KES {calculateNetEarnings(stint.offeredRate || 0).toLocaleString()}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            (after 5% fee)
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2">
                                                    {activeTab === 'available' ? (
                                                        <Button
                                                            onClick={() => handleAction('apply', stint)}
                                                            className="bg-accent hover:bg-accent/90"
                                                        >
                                                            <Send className="h-4 w-4 mr-2" />
                                                            Apply Now
                                                        </Button>
                                                    ) : (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" size="sm">
                                                                    Actions
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {PROFESSIONAL_ACTIONS[stint.status as StintStatus]?.map(action => (
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
                                                    )}
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

            {/* Apply Dialog */}
            <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-accent" />
                            Apply for Stint
                        </DialogTitle>
                        <DialogDescription>
                            Submit your application for this shift opportunity
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedStint && (
                            <div className="p-4 bg-muted rounded-lg space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold capitalize">{selectedStint.role?.replace('-', ' ')}</p>
                                        <p className="text-sm text-muted-foreground">{selectedStint.employerName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-accent">
                                            KES {calculateNetEarnings(selectedStint.offeredRate || 0).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Your earnings (after 5% fee)</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground pt-2 border-t">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {selectedStint.shiftDate ? new Date(selectedStint.shiftDate.toDate ? selectedStint.shiftDate.toDate() : selectedStint.shiftDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {selectedStint.startTime} - {selectedStint.endTime}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {selectedStint.city}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Message to employer (optional)</label>
                            <Textarea
                                placeholder="Introduce yourself or mention relevant experience..."
                                value={applicationMessage}
                                onChange={(e) => setApplicationMessage(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={submitApplication}
                            disabled={isSubmitting}
                            className="bg-accent hover:bg-accent/90"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Submit Application
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Cancel Confirmed Shift
                        </DialogTitle>
                        <DialogDescription>
                            Cancelling a confirmed shift may affect your reliability score and future booking opportunities.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                                <strong>Important:</strong> Multiple cancellations may result in temporary restrictions on your account.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reason for cancellation (required)</label>
                            <Textarea
                                placeholder="Please explain why you need to cancel..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                            Keep Shift
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={!cancelReason.trim() || isSubmitting}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Shift
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rate Clinic Dialog */}
            <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Rate Your Experience
                        </DialogTitle>
                        <DialogDescription>
                            Share your experience working at this facility
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {selectedStint && (
                            <div className="p-3 bg-muted rounded-lg text-sm">
                                <p><span className="font-medium">Facility:</span> {selectedStint.employerName}</p>
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

            {/* View Clinic Details Dialog */}
            <Dialog open={clinicDialogOpen} onOpenChange={setClinicDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Facility Details
                        </DialogTitle>
                        <DialogDescription>
                            Information about this facility and your shift
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {selectedStint && (
                            <div className="space-y-4">
                                <div className="p-4 bg-muted rounded-lg space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Facility</span>
                                        <span className="font-medium">{selectedStint.employerName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Location</span>
                                        <span className="font-medium">{selectedStint.city || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Address</span>
                                        <span className="font-medium text-right max-w-[200px]">{selectedStint.address || 'Address on file'}</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-accent/10 rounded-lg space-y-3">
                                    <h4 className="font-medium">Shift Details</h4>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Role</span>
                                        <span className="font-medium capitalize">{selectedStint.role?.replace('-', ' ')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Date</span>
                                        <span className="font-medium">{selectedStint.shiftDate ? new Date(selectedStint.shiftDate.toDate ? selectedStint.shiftDate.toDate() : selectedStint.shiftDate).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Time</span>
                                        <span className="font-medium">{selectedStint.startTime} - {selectedStint.endTime}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                        <span className="text-muted-foreground">Your Earnings</span>
                                        <span className="font-bold text-lg text-green-600">KES {calculateNetEarnings(selectedStint.offeredRate || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                {selectedStint.description && (
                                    <div className="p-3 bg-muted rounded-lg">
                                        <h4 className="font-medium mb-1">Special Instructions</h4>
                                        <p className="text-sm text-muted-foreground">{selectedStint.description}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setClinicDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upload Notes/Clarification Dialog */}
            <Dialog open={uploadNotesDialogOpen} onOpenChange={setUploadNotesDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Submit Clarification
                        </DialogTitle>
                        <DialogDescription>
                            Provide additional notes or clarification for this disputed shift
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {selectedStint && (
                            <div className="p-3 bg-muted rounded-lg text-sm">
                                <p><span className="font-medium">Shift:</span> {selectedStint.role?.replace('-', ' ')} at {selectedStint.employerName}</p>
                                <p><span className="font-medium">Status:</span> {formatStatus(selectedStint.status)}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Your Clarification</label>
                            <Textarea
                                placeholder="Explain your side of the situation, provide any relevant details..."
                                value={clarificationNotes}
                                onChange={(e) => setClarificationNotes(e.target.value)}
                                rows={5}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Your response will be reviewed by CareStint support team along with any evidence from the employer.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadNotesDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={submitClarification}
                            disabled={!clarificationNotes.trim() || isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                            Submit Clarification
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Policy Dialog */}
            <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            CareStint Policies
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div className="space-y-3">
                            <h4 className="font-semibold">No-Show Policy</h4>
                            <p className="text-sm text-muted-foreground">
                                A no-show occurs when a professional fails to appear for a confirmed shift without prior cancellation (at least 4 hours before the scheduled start time).
                            </p>
                            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                                <li>First no-show: Warning + reliability score impact</li>
                                <li>Second no-show within 30 days: 7-day suspension</li>
                                <li>Third no-show within 90 days: 30-day suspension</li>
                                <li>Continued violations: Account review and potential deactivation</li>
                            </ul>
                        </div>
                        <div className="border-t pt-3 space-y-3">
                            <h4 className="font-semibold">Cancellation Policy</h4>
                            <p className="text-sm text-muted-foreground">
                                We understand emergencies happen. Please cancel as early as possible:
                            </p>
                            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                                <li>24+ hours notice: No penalty</li>
                                <li>4-24 hours notice: Minor reliability impact</li>
                                <li>Less than 4 hours: Moderate reliability impact</li>
                                <li>No notice (no-show): See no-show policy above</li>
                            </ul>
                        </div>
                        <div className="border-t pt-3 space-y-3">
                            <h4 className="font-semibold">Dispute Resolution</h4>
                            <p className="text-sm text-muted-foreground">
                                If you believe a penalty was incorrectly applied, you can submit a clarification through the Issues tab. Our team reviews all disputes within 24-48 hours.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setPolicyDialogOpen(false)}>I Understand</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Report Issue Dialog */}
            <Dialog open={reportIssueDialogOpen} onOpenChange={setReportIssueDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Report an Issue
                        </DialogTitle>
                        <DialogDescription>
                            Let us know about any problems during your shift
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {selectedStint && (
                            <div className="p-3 bg-muted rounded-lg text-sm">
                                <p><span className="font-medium">Shift:</span> {selectedStint.role?.replace('-', ' ')} at {selectedStint.employerName}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Issue Type</label>
                            <Select value={issueType} onValueChange={setIssueType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select issue type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="safety">Safety Concern</SelectItem>
                                    <SelectItem value="harassment">Harassment/Misconduct</SelectItem>
                                    <SelectItem value="equipment">Equipment Problem</SelectItem>
                                    <SelectItem value="hours">Hours/Time Dispute</SelectItem>
                                    <SelectItem value="payment">Payment Issue</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                placeholder="Describe the issue in detail..."
                                value={issueDescription}
                                onChange={(e) => setIssueDescription(e.target.value)}
                                rows={4}
                            />
                        </div>
                        {issueType === 'safety' || issueType === 'harassment' ? (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-800 dark:text-red-300">
                                    <strong>Your safety matters.</strong> If you are in immediate danger, please contact emergency services first. Our support team will prioritize your report.
                                </p>
                            </div>
                        ) : null}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReportIssueDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={submitIssueReport}
                            disabled={!issueType || !issueDescription.trim() || isSubmitting}
                            variant="destructive"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                            Submit Report
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Appeal Dialog */}
            <Dialog open={appealDialogOpen} onOpenChange={setAppealDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-amber-600" />
                            Appeal Decision
                        </DialogTitle>
                        <DialogDescription>
                            Submit an appeal if you believe this no-show was recorded in error
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedStint && (
                            <div className="p-3 bg-muted rounded-lg text-sm">
                                <p><span className="font-medium">Stint:</span> {selectedStint.role?.replace('-', ' ')} at {selectedStint.employerName}</p>
                                <p><span className="font-medium">Date:</span> {selectedStint.shiftDate ? new Date(selectedStint.shiftDate.toDate ? selectedStint.shiftDate.toDate() : selectedStint.shiftDate).toLocaleDateString() : 'N/A'}</p>
                                <p><span className="font-medium">Status:</span> {selectedStint.status}</p>
                            </div>
                        )}
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                                <strong>Note:</strong> Appeals are reviewed by CareStint within 48 hours. Frequent no-shows may affect your booking eligibility.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reason for Appeal <span className="text-destructive">*</span></label>
                            <Textarea
                                placeholder="Explain why you believe this no-show was recorded in error..."
                                value={appealReason}
                                onChange={(e) => setAppealReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Supporting Evidence (optional)</label>
                            <Textarea
                                placeholder="Provide any additional details or evidence (e.g., communication with employer, traffic issues, medical emergency)..."
                                value={appealEvidence}
                                onChange={(e) => setAppealEvidence(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAppealDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={submitAppeal}
                            disabled={!appealReason.trim() || isSubmitting}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                            Submit Appeal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
