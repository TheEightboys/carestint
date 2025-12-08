
"use client";

import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, MoreVertical, Loader2, RefreshCw, DollarSign, MapPin, FileText, Calendar, Building, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { getApplicationsByProfessional, getStintById, withdrawApplication } from "@/lib/firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface Application {
    id: string;
    stintId: string;
    professionalId: string;
    isBid: boolean;
    bidAmount?: number;
    status: string;
    appliedAt?: any;
    stintDetails?: any;
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case "accepted":
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        case "rejected":
            return <XCircle className="h-4 w-4 text-destructive" />;
        case "withdrawn":
            return <XCircle className="h-4 w-4 text-muted-foreground" />;
        case "pending":
        default:
            return <Clock className="h-4 w-4 text-yellow-500" />;
    }
}

const getStatusClass = (status: string): string => {
    switch (status) {
        case "accepted":
            return "bg-green-500/20 text-green-500 border-green-500/30";
        case "rejected":
            return "bg-destructive/20 text-destructive border-destructive/30";
        case "withdrawn":
            return "bg-muted text-muted-foreground border-muted-foreground/30";
        case "pending":
        default:
            return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
    }
}

interface MyApplicationsProps {
    professionalId?: string;
}

export function MyApplications({ professionalId = "demo-professional" }: MyApplicationsProps) {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingApp, setViewingApp] = useState<Application | null>(null);
    const [withdrawingApp, setWithdrawingApp] = useState<Application | null>(null);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const { toast } = useToast();

    const loadApplications = async () => {
        setIsLoading(true);
        try {
            const apps = await getApplicationsByProfessional(professionalId) as Application[];

            // Fetch stint details for each application
            const appsWithDetails = await Promise.all(
                apps.map(async (app) => {
                    try {
                        const stint = await getStintById(app.stintId);
                        return { ...app, stintDetails: stint };
                    } catch {
                        return app;
                    }
                })
            );

            setApplications(appsWithDetails);
        } catch (error) {
            console.error("Error loading applications:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load your applications.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadApplications();
    }, [professionalId]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "Just now";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatShiftDate = (timestamp: any) => {
        if (!timestamp) return "TBD";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    };

    const handleWithdrawConfirm = async () => {
        if (!withdrawingApp) return;

        setIsWithdrawing(true);
        try {
            await withdrawApplication(withdrawingApp.id);
            toast({
                title: "Application Withdrawn",
                description: "Your application has been withdrawn successfully.",
            });
            setWithdrawingApp(null);
            loadApplications();
        } catch (error) {
            console.error("Error withdrawing application:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to withdraw application. Please try again.",
            });
        } finally {
            setIsWithdrawing(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>My Applications</CardTitle>
                        <CardDescription>
                            Track the status of your stint applications here.
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={loadApplications} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 text-center p-12">
                            <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">You haven't applied for any stints yet.</p>
                            <p className="text-sm text-muted-foreground/80">Use the "Find Stints" tab to get started.</p>
                        </div>
                    ) : (
                        applications.map((app) => (
                            <Card key={app.id} className="bg-secondary/50">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="grid gap-2">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold capitalize">
                                                    {app.stintDetails?.role?.replace('-', ' ') || 'Healthcare Role'}
                                                </p>
                                                {getStatusIcon(app.status)}
                                                <Badge variant="outline" className={cn("text-xs", getStatusClass(app.status))}>
                                                    {app.status?.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                                <span>{app.stintDetails?.employerName || 'Healthcare Facility'}</span>
                                                {app.stintDetails?.city && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        <span>{app.stintDetails.city}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    <span>Applied {formatDate(app.appliedAt)}</span>
                                                </div>
                                                {app.isBid && app.bidAmount && (
                                                    <div className="flex items-center gap-1 text-accent">
                                                        <DollarSign className="h-3 w-3" />
                                                        <span>Bid: KES {app.bidAmount.toLocaleString()}</span>
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
                                                <DropdownMenuItem onSelect={() => setViewingApp(app)}>
                                                    View Stint Details
                                                </DropdownMenuItem>
                                                {app.status === 'pending' && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onSelect={() => setWithdrawingApp(app)}
                                                        >
                                                            Withdraw Application
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* View Stint Details - Using a simple modal overlay */}
            {viewingApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="fixed inset-0 bg-black/50"
                        onClick={() => setViewingApp(null)}
                    />
                    <div className="relative z-50 w-full max-w-lg mx-4 bg-background border rounded-lg shadow-lg p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Building className="h-5 w-5 text-accent" />
                                <h3 className="font-semibold text-lg">Stint Details</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewingApp(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Facility</p>
                                    <p className="font-medium">{viewingApp.stintDetails?.employerName || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Role</p>
                                    <p className="font-medium capitalize">{viewingApp.stintDetails?.role?.replace('-', ' ') || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Location</p>
                                    <p className="font-medium">{viewingApp.stintDetails?.city || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Shift Type</p>
                                    <p className="font-medium capitalize">{viewingApp.stintDetails?.shiftType?.replace('-', ' ') || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Shift Date</p>
                                <p className="font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-accent" />
                                    {formatShiftDate(viewingApp.stintDetails?.shiftDate)}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Offered Rate</p>
                                    <p className="font-bold text-lg text-accent">
                                        KES {viewingApp.stintDetails?.offeredRate?.toLocaleString() || '0'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Your Application</p>
                                    <p className="font-medium">
                                        {viewingApp.isBid ? `Bid: KES ${viewingApp.bidAmount?.toLocaleString()}` : 'Applied at posted rate'}
                                    </p>
                                </div>
                            </div>

                            {viewingApp.stintDetails?.description && (
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Description</p>
                                    <p className="text-sm">{viewingApp.stintDetails.description}</p>
                                </div>
                            )}

                            <div className="pt-2 border-t">
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(viewingApp.status)}
                                    <span className="text-sm">Application Status: </span>
                                    <Badge variant="outline" className={cn("text-xs", getStatusClass(viewingApp.status))}>
                                        {viewingApp.status?.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <Button variant="outline" onClick={() => setViewingApp(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Withdraw Confirmation Modal */}
            {withdrawingApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="fixed inset-0 bg-black/50"
                        onClick={() => !isWithdrawing && setWithdrawingApp(null)}
                    />
                    <div className="relative z-50 w-full max-w-md mx-4 bg-background border rounded-lg shadow-lg p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="font-semibold text-lg mb-2">Withdraw Application?</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Are you sure you want to withdraw your application for{' '}
                            <strong>{withdrawingApp.stintDetails?.role?.replace('-', ' ')}</strong> at{' '}
                            <strong>{withdrawingApp.stintDetails?.employerName}</strong>?
                        </p>
                        <p className="text-sm text-muted-foreground mb-6">
                            This action cannot be undone. You can apply again later if the position is still available.
                        </p>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setWithdrawingApp(null)}
                                disabled={isWithdrawing}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleWithdrawConfirm}
                                disabled={isWithdrawing}
                            >
                                {isWithdrawing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Withdrawing...
                                    </>
                                ) : (
                                    'Yes, Withdraw'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
