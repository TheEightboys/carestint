"use client";

import { useState, useEffect } from 'react';
import { UserCheck, Clock, MessageSquare, Star, CheckCircle, XCircle, Loader2, User, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getApplicationsByStint, updateApplicationStatus } from '@/lib/firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Application {
    id: string;
    stintId: string;
    professionalId: string;
    professionalName: string;
    professionalRole: string;
    appliedAt: any;
    isBid: boolean;
    bidAmount?: number;
    message?: string;
    status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
    // Extended info (would come from professional profile)
    rating?: number;
    completedStints?: number;
    experience?: number;
}

interface ApplicationsManagerProps {
    stintId: string;
    stintRole: string;
    offeredRate: number;
    onApplicationAccepted?: () => void;
    // NEW: Callback to initiate payment flow - required for proper workflow
    onInitiatePayment?: (application: Application) => void;
}

export function ApplicationsManager({ stintId, stintRole, offeredRate, onApplicationAccepted, onInitiatePayment }: ApplicationsManagerProps) {

    const { toast } = useToast();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        loadApplications();
    }, [stintId]);

    const loadApplications = async () => {
        try {
            setLoading(true);
            const apps = await getApplicationsByStint(stintId);
            // Use real data from professional profile or application
            const enrichedApps = apps.map((app: any) => ({
                ...app,
                rating: app.professionalRating || app.averageRating || 4.5,
                completedStints: app.completedStints || 0,
                experience: app.yearsOfExperience || 1
            }));
            setApplications(enrichedApps);
        } catch (error) {
            console.error('Error loading applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (app: Application) => {
        // If payment callback is provided, use proper payment flow
        if (onInitiatePayment) {
            onInitiatePayment(app);
            return;
        }

        // Fallback: Show warning that payment is required
        toast({
            variant: 'destructive',
            title: 'Payment Required',
            description: 'Please accept applicants through the Stints page to complete payment.',
        });
    };


    const handleReject = async () => {
        if (!selectedApp) return;
        setProcessingId(selectedApp.id);
        try {
            await updateApplicationStatus(selectedApp.id, 'rejected', rejectionReason || undefined);
            toast({
                title: 'Application Rejected',
                description: 'The applicant has been notified.',
            });
            setRejectDialogOpen(false);
            setSelectedApp(null);
            setRejectionReason('');
            loadApplications();
        } catch (error) {
            console.error('Error rejecting application:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to reject application. Please try again.',
            });
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectDialog = (app: Application) => {
        setSelectedApp(app);
        setRejectDialogOpen(true);
    };

    const pendingApps = applications.filter(a => a.status === 'pending');
    const processedApps = applications.filter(a => a.status !== 'pending');

    if (loading) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Loading applications...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        Applications ({applications.length})
                    </CardTitle>
                    <CardDescription>
                        Review and manage applications for this stint.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {applications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No applications yet</p>
                            <p className="text-sm">Applications will appear here once professionals apply.</p>
                        </div>
                    ) : (
                        <ScrollArea className="max-h-[500px]">
                            <div className="space-y-4">
                                {/* Pending Applications */}
                                {pendingApps.length > 0 && (
                                    <>
                                        <h4 className="text-sm font-semibold text-muted-foreground">
                                            Pending ({pendingApps.length})
                                        </h4>
                                        {pendingApps.map((app) => (
                                            <div
                                                key={app.id}
                                                className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-3">
                                                        <Avatar className="h-12 w-12">
                                                            <AvatarImage src={`https://picsum.photos/seed/${app.professionalId}/48/48`} />
                                                            <AvatarFallback>{app.professionalName.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <h4 className="font-semibold">{app.professionalName}</h4>
                                                            <p className="text-sm text-muted-foreground capitalize">
                                                                {app.professionalRole.replace('-', ' ')}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                                    {app.rating?.toFixed(1)}
                                                                </span>
                                                                <span>{app.completedStints} stints</span>
                                                                <span>{app.experience} yrs exp</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        {app.isBid && app.bidAmount ? (
                                                            <div>
                                                                <Badge variant={app.bidAmount <= offeredRate ? 'default' : 'secondary'}>
                                                                    Bid: KES {app.bidAmount.toLocaleString()}
                                                                </Badge>
                                                                {app.bidAmount > offeredRate && (
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        +{Math.round(((app.bidAmount - offeredRate) / offeredRate) * 100)}% above offer
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <Badge variant="outline">At offered rate</Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {app.message && (
                                                    <div className="mt-3 p-3 rounded bg-secondary/50 text-sm">
                                                        <MessageSquare className="h-3 w-3 inline mr-2 text-muted-foreground" />
                                                        {app.message}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mt-4">
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Applied {app.appliedAt?.toDate?.()?.toLocaleDateString?.() || 'recently'}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openRejectDialog(app)}
                                                            disabled={processingId === app.id}
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAccept(app)}
                                                            disabled={processingId === app.id}
                                                            className="bg-accent hover:bg-accent/90"
                                                        >
                                                            {processingId === app.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                            ) : (
                                                                <Wallet className="h-4 w-4 mr-1" />
                                                            )}
                                                            Accept & Pay
                                                        </Button>

                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {/* Processed Applications */}
                                {processedApps.length > 0 && (
                                    <>
                                        <h4 className="text-sm font-semibold text-muted-foreground mt-6">
                                            Processed ({processedApps.length})
                                        </h4>
                                        {processedApps.map((app) => (
                                            <div
                                                key={app.id}
                                                className={cn(
                                                    "p-4 rounded-lg border",
                                                    app.status === 'accepted' ? 'bg-green-500/5 border-green-500/20' : 'bg-secondary/30'
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={`https://picsum.photos/seed/${app.professionalId}/40/40`} />
                                                            <AvatarFallback>{app.professionalName.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <h4 className="font-medium">{app.professionalName}</h4>
                                                            <p className="text-xs text-muted-foreground capitalize">
                                                                {app.professionalRole.replace('-', ' ')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant={app.status === 'accepted' ? 'default' : 'secondary'}
                                                        className={app.status === 'accepted' ? 'bg-green-500' : ''}
                                                    >
                                                        {app.status === 'accepted' ? 'Assigned' : 'Rejected'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Application</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject {selectedApp?.professionalName}'s application?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Reason for rejection (optional)"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={processingId !== null}>
                            {processingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Reject Application
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
