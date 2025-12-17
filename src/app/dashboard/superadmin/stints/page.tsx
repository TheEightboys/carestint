"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
    ArrowLeft, Briefcase, Clock, DollarSign, Filter, MapPin, Search, User, Loader2,
    ChevronDown, ChevronUp, Eye, AlertTriangle, CheckCircle2, XCircle, Calendar,
    Building, FileText, CreditCard, RefreshCw, Flag, MessageSquare, ArrowUp,
    Ban, UserX, Gavel, StickyNote, RotateCcw, Star
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { getAllStints, getDashboardStats, updateStint, getAuditLogsForEntity, getPayoutsForStint, getAllEmployers } from "@/lib/firebase/firestore";
import {
    SUPERADMIN_TABS,
    SUPERADMIN_ACTIONS,
    getStatusDisplay,
    filterStintsByTab,
    getStintCountByTab,
    formatStatus
} from "@/lib/stint-utils";
import type { StintStatus, Stint, AuditLog, Payout } from "@/lib/types";

export default function StintsPage() {
    const [stints, setStints] = useState<any[]>([]);
    const [employers, setEmployers] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalStints: 0,
        activeStints: 0,
        disputedStints: 0,
        flaggedStints: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("all");

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [roleFilter, setRoleFilter] = useState("all");
    const [tenantFilter, setTenantFilter] = useState("all");
    const [cityFilter, setCityFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [dateRangeStart, setDateRangeStart] = useState("");
    const [dateRangeEnd, setDateRangeEnd] = useState("");

    // Expanded row state
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [rowDetails, setRowDetails] = useState<{
        auditLogs: any[];
        payouts: any[];
    } | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Under Review Dialog
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [selectedStint, setSelectedStint] = useState<any>(null);
    const [reviewNotes, setReviewNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Apply Penalty Dialog
    const [penaltyDialogOpen, setPenaltyDialogOpen] = useState(false);
    const [penaltyAmount, setPenaltyAmount] = useState("");
    const [penaltyReason, setPenaltyReason] = useState("");
    const [penaltyTarget, setPenaltyTarget] = useState<"employer" | "professional">("professional");

    // Suspend Professional Dialog
    const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
    const [suspendDuration, setSuspendDuration] = useState("7");
    const [suspendReason, setSuspendReason] = useState("");

    // Resolve Dispute Dialog
    const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
    const [resolutionType, setResolutionType] = useState<"employer" | "professional" | "split">("split");
    const [resolutionNotes, setResolutionNotes] = useState("");
    const [refundAmount, setRefundAmount] = useState("");

    // Add Internal Notes Dialog
    const [notesDialogOpen, setNotesDialogOpen] = useState(false);
    const [internalNote, setInternalNote] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoadError(null);
        try {
            const [stintsData, statsData, employersData] = await Promise.all([
                getAllStints().catch(() => []),
                getDashboardStats().catch(() => ({
                    totalStints: 0,
                    activeStints: 0,
                    disputedStints: 0,
                    flaggedStints: 0,
                })),
                getAllEmployers().catch(() => []),
            ]);
            setStints(stintsData || []);
            setStats(statsData || {
                totalStints: 0,
                activeStints: 0,
                disputedStints: 0,
                flaggedStints: 0,
            });
            setEmployers(employersData || []);
        } catch (error) {
            console.error("Error loading stints data:", error);
            setLoadError("Failed to load stints data. Please try refreshing the page.");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredStints = useMemo(() => {
        if (!stints || !Array.isArray(stints)) return [];
        let filtered = filterStintsByTab(stints, activeTab, 'superadmin');

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(stint =>
                stint.employerName?.toLowerCase().includes(query) ||
                stint.role?.toLowerCase().includes(query) ||
                stint.city?.toLowerCase().includes(query) ||
                stint.id?.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(stint => stint.status === statusFilter);
        }

        // Apply role filter
        if (roleFilter !== "all") {
            filtered = filtered.filter(stint => stint.role === roleFilter);
        }

        // Apply city filter
        if (cityFilter) {
            filtered = filtered.filter(stint =>
                stint.city?.toLowerCase().includes(cityFilter.toLowerCase())
            );
        }

        // Apply tenant/employer filter
        if (tenantFilter !== "all") {
            filtered = filtered.filter(stint => stint.employerId === tenantFilter);
        }

        // Apply date filter (single date)
        if (dateFilter) {
            filtered = filtered.filter(stint => {
                const stintDate = stint.shiftDate?.toDate ? stint.shiftDate.toDate() : new Date(stint.shiftDate);
                const filterDate = new Date(dateFilter);
                return stintDate.toDateString() === filterDate.toDateString();
            });
        }

        // Apply date range filter
        if (dateRangeStart || dateRangeEnd) {
            filtered = filtered.filter(stint => {
                const stintDate = stint.shiftDate?.toDate ? stint.shiftDate.toDate() : new Date(stint.shiftDate);
                if (dateRangeStart && stintDate < new Date(dateRangeStart)) return false;
                if (dateRangeEnd && stintDate > new Date(dateRangeEnd + 'T23:59:59')) return false;
                return true;
            });
        }

        return filtered;
    }, [stints, activeTab, searchQuery, statusFilter, roleFilter, cityFilter, tenantFilter, dateFilter, dateRangeStart, dateRangeEnd]);

    // Unique cities for filter dropdown
    const uniqueCities = useMemo(() => {
        if (!stints || !Array.isArray(stints)) return [];
        const cities = new Set(stints.map(s => s.city).filter(Boolean));
        return Array.from(cities).sort();
    }, [stints]);

    const tabCounts = useMemo(() => {
        if (!stints || !Array.isArray(stints)) return {};
        return getStintCountByTab(stints, 'superadmin');
    }, [stints]);

    const handleExpandRow = async (stintId: string) => {
        if (expandedRowId === stintId) {
            setExpandedRowId(null);
            setRowDetails(null);
            return;
        }

        setExpandedRowId(stintId);
        setLoadingDetails(true);

        try {
            const [auditLogs, payouts] = await Promise.all([
                getAuditLogsForEntity('stint', stintId).catch(() => []),
                getPayoutsForStint(stintId).catch(() => [])
            ]);
            setRowDetails({ auditLogs, payouts });
        } catch (error) {
            console.error("Error loading details:", error);
            setRowDetails({ auditLogs: [], payouts: [] });
        } finally {
            setLoadingDetails(false);
        }
    };

    const handlePlaceUnderReview = (stint: any) => {
        setSelectedStint(stint);
        setReviewNotes("");
        setReviewDialogOpen(true);
    };

    const submitUnderReview = async () => {
        if (!selectedStint) return;

        setIsSubmitting(true);
        try {
            await updateStint(selectedStint.id, {
                status: 'under_review' as StintStatus,
                internalNotes: reviewNotes,
                reviewedAt: new Date(),
                isFlagged: true,
                flagReason: reviewNotes
            });

            // Refresh data
            await loadData();
            setReviewDialogOpen(false);
        } catch (error) {
            console.error("Error updating stint:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Apply Penalty Handler
    const handleApplyPenalty = (stint: any) => {
        setSelectedStint(stint);
        setPenaltyAmount("");
        setPenaltyReason("");
        setPenaltyTarget("professional");
        setPenaltyDialogOpen(true);
    };

    const submitPenalty = async () => {
        if (!selectedStint || !penaltyAmount || !penaltyReason) return;

        setIsSubmitting(true);
        try {
            await updateStint(selectedStint.id, {
                penaltyAmount: parseFloat(penaltyAmount),
                penaltyReason,
                penaltyTarget,
                penaltyAppliedAt: new Date(),
                internalNotes: (selectedStint.internalNotes || '') + `\n[${new Date().toLocaleString()}] Penalty applied: KES ${penaltyAmount} to ${penaltyTarget}. Reason: ${penaltyReason}`
            });
            await loadData();
            setPenaltyDialogOpen(false);
        } catch (error) {
            console.error("Error applying penalty:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Suspend Professional Handler
    const handleSuspendPro = (stint: any) => {
        setSelectedStint(stint);
        setSuspendDuration("7");
        setSuspendReason("");
        setSuspendDialogOpen(true);
    };

    const submitSuspension = async () => {
        if (!selectedStint || !suspendReason) return;

        setIsSubmitting(true);
        try {
            // This would update the professional's account status
            await updateStint(selectedStint.id, {
                professionalSuspended: true,
                suspensionDuration: parseInt(suspendDuration),
                suspensionReason: suspendReason,
                suspendedAt: new Date(),
                internalNotes: (selectedStint.internalNotes || '') + `\n[${new Date().toLocaleString()}] Professional suspended for ${suspendDuration} days. Reason: ${suspendReason}`
            });
            await loadData();
            setSuspendDialogOpen(false);
        } catch (error) {
            console.error("Error suspending professional:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Resolve Dispute Handler
    const handleResolveDispute = (stint: any) => {
        setSelectedStint(stint);
        setResolutionType("split");
        setResolutionNotes("");
        setRefundAmount("");
        setResolveDialogOpen(true);
    };

    const submitResolution = async () => {
        if (!selectedStint || !resolutionNotes) return;

        setIsSubmitting(true);
        try {
            await updateStint(selectedStint.id, {
                status: 'closed' as StintStatus,
                disputeResolved: true,
                resolutionType,
                resolutionNotes,
                refundAmount: refundAmount ? parseFloat(refundAmount) : 0,
                resolvedAt: new Date(),
                internalNotes: (selectedStint.internalNotes || '') + `\n[${new Date().toLocaleString()}] Dispute resolved: ${resolutionType}. ${refundAmount ? `Refund: KES ${refundAmount}.` : ''} Notes: ${resolutionNotes}`
            });
            await loadData();
            setResolveDialogOpen(false);
        } catch (error) {
            console.error("Error resolving dispute:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Add Internal Notes Handler
    const handleAddNotes = (stint: any) => {
        setSelectedStint(stint);
        setInternalNote("");
        setNotesDialogOpen(true);
    };

    const submitInternalNote = async () => {
        if (!selectedStint || !internalNote) return;

        setIsSubmitting(true);
        try {
            await updateStint(selectedStint.id, {
                internalNotes: (selectedStint.internalNotes || '') + `\n[${new Date().toLocaleString()}] ${internalNote}`
            });
            await loadData();
            setNotesDialogOpen(false);
        } catch (error) {
            console.error("Error adding note:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Escalate Handler
    const handleEscalate = async (stint: any) => {
        if (!confirm("Escalate this stint to senior management? This action will be logged.")) return;

        try {
            await updateStint(stint.id, {
                isEscalated: true,
                escalatedAt: new Date(),
                internalNotes: (stint.internalNotes || '') + `\n[${new Date().toLocaleString()}] ESCALATED to senior management.`
            });
            await loadData();
        } catch (error) {
            console.error("Error escalating:", error);
        }
    };

    // Reopen Handler
    const handleReopen = async (stint: any) => {
        if (!confirm("Reopen this closed stint? This will require further review.")) return;

        try {
            await updateStint(stint.id, {
                status: 'under_review' as StintStatus,
                reopenedAt: new Date(),
                internalNotes: (stint.internalNotes || '') + `\n[${new Date().toLocaleString()}] Stint reopened for further review.`
            });
            await loadData();
        } catch (error) {
            console.error("Error reopening:", error);
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

    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center flex-col gap-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <p className="text-destructive">{loadError}</p>
                <Button onClick={loadData}>Try Again</Button>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/superadmin">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Overview
                    </Link>
                </Button>
                <h1 className="font-headline text-xl font-semibold">
                    All Stints Management
                </h1>
            </header>

            <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-6">
                {/* Stats Cards */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Stints</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalStints}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Active</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.activeStints}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Disputed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">{stats.disputedStints}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.flaggedStints}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/50 p-1 h-auto">
                        {SUPERADMIN_TABS.map(tab => (
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

                    {/* Filters Card */}
                    <Card className="mt-4">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Advanced Filters
                            </CardTitle>
                            <CardDescription>Filter stints by tenant, city, specialty, date, and more</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <div className="flex items-center gap-2">
                                    <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <Input
                                        placeholder="Search clinic, role, ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <Select value={tenantFilter} onValueChange={setTenantFilter}>
                                    <SelectTrigger>
                                        <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                                        <SelectValue placeholder="Tenant/Employer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Employers</SelectItem>
                                        {employers.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id}>
                                                {emp.facilityName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                        <SelectItem value="expired">Expired</SelectItem>
                                        <SelectItem value="no_show">No-Show</SelectItem>
                                        <SelectItem value="disputed">Disputed</SelectItem>
                                        <SelectItem value="under_review">Under Review</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={roleFilter} onValueChange={setRoleFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Specialty/Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Specialties</SelectItem>
                                        <SelectItem value="rn">Nurse (RN)</SelectItem>
                                        <SelectItem value="dentist">Dentist</SelectItem>
                                        <SelectItem value="clinical-officer">Clinical Officer</SelectItem>
                                        <SelectItem value="pharmacist">Pharmacist</SelectItem>
                                        <SelectItem value="lab-tech">Lab Tech</SelectItem>
                                        <SelectItem value="radiographer">Radiographer</SelectItem>
                                        <SelectItem value="physiotherapist">Physiotherapist</SelectItem>
                                        <SelectItem value="midwife">Midwife</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <Select value={cityFilter || "all"} onValueChange={(v) => setCityFilter(v === "all" ? "" : v)}>
                                    <SelectTrigger>
                                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                        <SelectValue placeholder="City" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Cities</SelectItem>
                                        {uniqueCities.map((city) => (
                                            <SelectItem key={city} value={city}>
                                                {city}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">From:</span>
                                    <Input
                                        type="date"
                                        value={dateRangeStart}
                                        onChange={(e) => setDateRangeStart(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">To:</span>
                                    <Input
                                        type="date"
                                        value={dateRangeEnd}
                                        onChange={(e) => setDateRangeEnd(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <Input
                                    type="date"
                                    placeholder="Specific date"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            {(searchQuery || statusFilter !== "all" || roleFilter !== "all" || tenantFilter !== "all" || cityFilter || dateFilter || dateRangeStart || dateRangeEnd) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-3"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setStatusFilter("all");
                                        setRoleFilter("all");
                                        setTenantFilter("all");
                                        setCityFilter("");
                                        setDateFilter("");
                                        setDateRangeStart("");
                                        setDateRangeEnd("");
                                    }}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Clear Filters
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stints Table */}
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Stints List</CardTitle>
                            <CardDescription>
                                Showing {filteredStints.length} of {stints.length} stints
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40px]"></TableHead>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Employer</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                City
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Date
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="h-3 w-3" />
                                                Rate
                                            </div>
                                        </TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStints.map((stint: any) => (
                                        <Collapsible key={stint.id} asChild open={expandedRowId === stint.id}>
                                            <>
                                                <TableRow className="group hover:bg-muted/50">
                                                    <TableCell>
                                                        <CollapsibleTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => handleExpandRow(stint.id)}
                                                            >
                                                                {expandedRowId === stint.id ? (
                                                                    <ChevronUp className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </CollapsibleTrigger>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">
                                                        {stint.id?.slice(0, 8)}...
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{stint.employerName || 'Unknown'}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize text-xs">
                                                            {stint.role?.replace('-', ' ') || 'N/A'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{stint.city || 'N/A'}</TableCell>
                                                    <TableCell className="text-sm">
                                                        {stint.shiftDate ? new Date(stint.shiftDate.toDate ? stint.shiftDate.toDate() : stint.shiftDate).toLocaleDateString() : 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        KES {stint.offeredRate?.toLocaleString() || 0}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(stint.status)}
                                                        {stint.isFlagged && (
                                                            <Badge variant="destructive" className="ml-1">
                                                                <Flag className="h-3 w-3 mr-1" />
                                                                Flagged
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1 flex-wrap">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                title="View Details"
                                                                onClick={() => handleExpandRow(stint.id)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            {stint.status !== 'under_review' && stint.status !== 'closed' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-amber-600 hover:text-amber-700"
                                                                    title="Place Under Review"
                                                                    onClick={() => handlePlaceUnderReview(stint)}
                                                                >
                                                                    <AlertTriangle className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {(stint.status === 'cancelled' || stint.status === 'no_show') && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-600 hover:text-red-700"
                                                                    title="Apply Penalty"
                                                                    onClick={() => handleApplyPenalty(stint)}
                                                                >
                                                                    <Ban className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {stint.status === 'no_show' && stint.acceptedProfessionalId && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-600 hover:text-red-700"
                                                                    title="Suspend Professional"
                                                                    onClick={() => handleSuspendPro(stint)}
                                                                >
                                                                    <UserX className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {stint.status === 'disputed' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-green-600 hover:text-green-700"
                                                                    title="Resolve Dispute"
                                                                    onClick={() => handleResolveDispute(stint)}
                                                                >
                                                                    <Gavel className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {stint.status === 'under_review' && (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        title="Add Internal Notes"
                                                                        onClick={() => handleAddNotes(stint)}
                                                                    >
                                                                        <StickyNote className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-green-600 hover:text-green-700"
                                                                        title="Mark Resolved"
                                                                        onClick={() => handleResolveDispute(stint)}
                                                                    >
                                                                        <CheckCircle2 className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-red-600 hover:text-red-700"
                                                                        title="Escalate"
                                                                        onClick={() => handleEscalate(stint)}
                                                                    >
                                                                        <ArrowUp className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {stint.status === 'closed' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    title="Reopen"
                                                                    onClick={() => handleReopen(stint)}
                                                                >
                                                                    <RotateCcw className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                <CollapsibleContent asChild>
                                                    <TableRow className="bg-muted/30">
                                                        <TableCell colSpan={9} className="p-4">
                                                            {loadingDetails && expandedRowId === stint.id ? (
                                                                <div className="flex items-center justify-center py-8">
                                                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                                </div>
                                                            ) : (
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                    {/* Stint Details */}
                                                                    <div className="space-y-3">
                                                                        <h4 className="font-semibold flex items-center gap-2">
                                                                            <FileText className="h-4 w-4" />
                                                                            Stint Details
                                                                        </h4>
                                                                        <div className="text-sm space-y-1">
                                                                            <p><span className="text-muted-foreground">Shift Type:</span> {stint.shiftType || 'N/A'}</p>
                                                                            <p><span className="text-muted-foreground">Time:</span> {stint.startTime} - {stint.endTime}</p>
                                                                            <p><span className="text-muted-foreground">Professional:</span> {stint.acceptedProfessionalName || 'Not assigned'}</p>
                                                                            <p><span className="text-muted-foreground">Booking Fee:</span> {stint.bookingFeePercent}%</p>
                                                                            {stint.internalNotes && (
                                                                                <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-amber-800 dark:text-amber-300">
                                                                                    <p className="font-medium text-xs uppercase">Internal Notes:</p>
                                                                                    <p className="text-sm">{stint.internalNotes}</p>
                                                                                </div>
                                                                            )}
                                                                            {stint.penaltyAmount && (
                                                                                <p><span className="text-muted-foreground">Penalty:</span> <span className="text-destructive">KES {stint.penaltyAmount}</span></p>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Payout Logs */}
                                                                    <div className="space-y-3">
                                                                        <h4 className="font-semibold flex items-center gap-2">
                                                                            <CreditCard className="h-4 w-4" />
                                                                            Payout Logs
                                                                        </h4>
                                                                        {rowDetails?.payouts && rowDetails.payouts.length > 0 ? (
                                                                            <div className="text-sm space-y-2">
                                                                                {rowDetails.payouts.map((payout: any, idx: number) => (
                                                                                    <div key={idx} className="p-2 bg-muted rounded">
                                                                                        <p><span className="text-muted-foreground">Amount:</span> KES {payout.netAmount}</p>
                                                                                        <p><span className="text-muted-foreground">Status:</span> {payout.status}</p>
                                                                                        <p><span className="text-muted-foreground">Method:</span> {payout.payoutMethod}</p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-sm text-muted-foreground">No payout records</p>
                                                                        )}
                                                                    </div>

                                                                    {/* Audit Trail */}
                                                                    <div className="space-y-3">
                                                                        <h4 className="font-semibold flex items-center gap-2">
                                                                            <Clock className="h-4 w-4" />
                                                                            Audit Trail
                                                                        </h4>
                                                                        {rowDetails?.auditLogs && rowDetails.auditLogs.length > 0 ? (
                                                                            <div className="text-sm space-y-2 max-h-[200px] overflow-y-auto">
                                                                                {rowDetails.auditLogs.slice(0, 5).map((log: any, idx: number) => (
                                                                                    <div key={idx} className="p-2 bg-muted rounded text-xs">
                                                                                        <p className="font-medium">{log.action}</p>
                                                                                        <p className="text-muted-foreground">{log.description}</p>
                                                                                        <p className="text-muted-foreground">
                                                                                            {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString() : 'N/A'}
                                                                                        </p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-sm text-muted-foreground">No audit logs</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                </CollapsibleContent>
                                            </>
                                        </Collapsible>
                                    ))}
                                    {filteredStints.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                                <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p>No stints found</p>
                                                <p className="text-sm">Try adjusting your filters</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Tabs>
            </main>

            {/* Under Review Dialog */}
            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            Place Stint Under Review
                        </DialogTitle>
                        <DialogDescription>
                            This will flag the stint for internal review. The employer and professional will not be notified immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedStint && (
                            <div className="p-3 bg-muted rounded-lg text-sm">
                                <p><span className="font-medium">Stint:</span> {selectedStint.role} at {selectedStint.employerName}</p>
                                <p><span className="font-medium">Current Status:</span> {formatStatus(selectedStint.status)}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Internal Notes (required)</label>
                            <Textarea
                                placeholder="Describe the reason for placing this stint under review..."
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={submitUnderReview}
                            disabled={!reviewNotes.trim() || isSubmitting}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Flag className="h-4 w-4 mr-2" />
                                    Place Under Review
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Apply Penalty Dialog */}
            <Dialog open={penaltyDialogOpen} onOpenChange={setPenaltyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Ban className="h-5 w-5 text-red-600" />
                            Apply Penalty
                        </DialogTitle>
                        <DialogDescription>
                            Apply a financial penalty for cancelled or no-show stints.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedStint && (
                            <div className="p-3 bg-muted rounded-lg text-sm">
                                <p><span className="font-medium">Stint:</span> {selectedStint.role} at {selectedStint.employerName}</p>
                                <p><span className="font-medium">Status:</span> {formatStatus(selectedStint.status)}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Apply penalty to</label>
                            <Select value={penaltyTarget} onValueChange={(v: "employer" | "professional") => setPenaltyTarget(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="employer">Employer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Penalty Amount (KES)</label>
                            <Input
                                type="number"
                                placeholder="Enter amount..."
                                value={penaltyAmount}
                                onChange={(e) => setPenaltyAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reason (required)</label>
                            <Textarea
                                placeholder="Explain the reason for this penalty..."
                                value={penaltyReason}
                                onChange={(e) => setPenaltyReason(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPenaltyDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={submitPenalty}
                            disabled={!penaltyAmount || !penaltyReason.trim() || isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Ban className="h-4 w-4 mr-2" />}
                            Apply Penalty
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Suspend Professional Dialog */}
            <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserX className="h-5 w-5 text-red-600" />
                            Suspend Professional
                        </DialogTitle>
                        <DialogDescription>
                            Temporarily suspend this professional from accepting stints.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedStint && (
                            <div className="p-3 bg-muted rounded-lg text-sm">
                                <p><span className="font-medium">Professional:</span> {selectedStint.acceptedProfessionalName}</p>
                                <p><span className="font-medium">Stint:</span> {selectedStint.role} at {selectedStint.employerName}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Suspension Duration</label>
                            <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3">3 days</SelectItem>
                                    <SelectItem value="7">7 days</SelectItem>
                                    <SelectItem value="14">14 days</SelectItem>
                                    <SelectItem value="30">30 days</SelectItem>
                                    <SelectItem value="90">90 days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reason (required)</label>
                            <Textarea
                                placeholder="Explain the reason for suspension..."
                                value={suspendReason}
                                onChange={(e) => setSuspendReason(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-300">
                                <strong>Warning:</strong> The professional will be notified and unable to accept new stints during suspension.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={submitSuspension}
                            disabled={!suspendReason.trim() || isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserX className="h-4 w-4 mr-2" />}
                            Suspend Professional
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Resolve Dispute Dialog */}
            <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Gavel className="h-5 w-5 text-green-600" />
                            Resolve Dispute / Mark as Resolved
                        </DialogTitle>
                        <DialogDescription>
                            Provide resolution details and close this dispute or review.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedStint && (
                            <div className="p-3 bg-muted rounded-lg text-sm">
                                <p><span className="font-medium">Stint:</span> {selectedStint.role}</p>
                                <p><span className="font-medium">Employer:</span> {selectedStint.employerName}</p>
                                <p><span className="font-medium">Professional:</span> {selectedStint.acceptedProfessionalName || 'N/A'}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Resolution Decision</label>
                            <Select value={resolutionType} onValueChange={(v: "employer" | "professional" | "split") => setResolutionType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="employer">In favor of Employer</SelectItem>
                                    <SelectItem value="professional">In favor of Professional</SelectItem>
                                    <SelectItem value="split">Split / Compromise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Refund Amount (KES) - Optional</label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Resolution Notes (required)</label>
                            <Textarea
                                placeholder="Explain the resolution decision and any actions taken..."
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={submitResolution}
                            disabled={!resolutionNotes.trim() || isSubmitting}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            Resolve & Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Internal Notes Dialog */}
            <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <StickyNote className="h-5 w-5" />
                            Add Internal Notes
                        </DialogTitle>
                        <DialogDescription>
                            Add notes that are only visible to SuperAdmin users.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedStint && (
                            <div className="p-3 bg-muted rounded-lg text-sm">
                                <p><span className="font-medium">Stint:</span> {selectedStint.role} at {selectedStint.employerName}</p>
                                {selectedStint.internalNotes && (
                                    <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-xs max-h-32 overflow-y-auto">
                                        <p className="font-medium text-amber-800 dark:text-amber-300">Existing Notes:</p>
                                        <pre className="whitespace-pre-wrap text-amber-700 dark:text-amber-400">{selectedStint.internalNotes}</pre>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Note</label>
                            <Textarea
                                placeholder="Add your internal note here..."
                                value={internalNote}
                                onChange={(e) => setInternalNote(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={submitInternalNote}
                            disabled={!internalNote.trim() || isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <StickyNote className="h-4 w-4 mr-2" />}
                            Add Note
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
