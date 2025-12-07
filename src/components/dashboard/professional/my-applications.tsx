
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
import { Clock, CheckCircle, XCircle, MoreVertical, Loader2, RefreshCw, DollarSign, MapPin, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getApplicationsByProfessional, getStintById } from "@/lib/firebase/firestore";
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

    return (
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
                                            <DropdownMenuItem>View Stint Details</DropdownMenuItem>
                                            {app.status === 'pending' && (
                                                <DropdownMenuItem className="text-destructive">
                                                    Withdraw Application
                                                </DropdownMenuItem>
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
    )
}

