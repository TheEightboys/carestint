
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Clock, MoreVertical, Users, MapPin, DollarSign, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getStintsByEmployer, getApplicationsByStint } from "@/lib/firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Stint {
    id: string;
    role: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    city: string;
    offeredRate: number;
    status: string;
    shiftDate?: any;
}

interface Application {
    id: string;
    professionalName: string;
    professionalRole: string;
    isBid: boolean;
    bidAmount?: number;
    status: string;
}

const getStatusClass = (status: string): string => {
    switch (status) {
        case "open":
            return "bg-green-500/20 text-green-500 border-green-500/30";
        case "accepted":
            return "bg-blue-500/20 text-blue-500 border-blue-500/30";
        case "in_progress":
            return "bg-purple-500/20 text-purple-500 border-purple-500/30";
        case "completed":
            return "bg-green-600/20 text-green-600 border-green-600/30";
        case "disputed":
            return "bg-red-500/20 text-red-500 border-red-500/30";
        default:
            return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
    }
}

interface TodaysStintsProps {
    employerId?: string;
}

export function TodaysStints({ employerId = "demo-employer" }: TodaysStintsProps) {
    const [stints, setStints] = useState<Stint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStint, setSelectedStint] = useState<Stint | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoadingApplications, setIsLoadingApplications] = useState(false);
    const { toast } = useToast();

    const fetchStints = async () => {
        setIsLoading(true);
        try {
            const data = await getStintsByEmployer(employerId);
            setStints(data as Stint[]);
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

    const fetchApplications = async (stintId: string) => {
        setIsLoadingApplications(true);
        try {
            const data = await getApplicationsByStint(stintId);
            setApplications(data as Application[]);
        } catch (error) {
            console.error("Error fetching applications:", error);
        } finally {
            setIsLoadingApplications(false);
        }
    };

    useEffect(() => {
        fetchStints();
    }, [employerId]);

    const handleViewApplicants = async (stint: Stint) => {
        setSelectedStint(stint);
        await fetchApplications(stint.id);
    };

    const formatShiftDate = (shiftDate: any) => {
        if (!shiftDate) return "Today";
        const date = shiftDate.toDate?.() || new Date(shiftDate);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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
                        stints.slice(0, 5).map((stint) => (
                            <Card key={stint.id} className="bg-secondary/50">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="grid gap-2">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold capitalize">{stint.role?.replace('-', ' ')}</p>
                                                <Badge variant="outline" className={cn("text-xs", getStatusClass(stint.status))}>
                                                    {stint.status?.replace('_', ' ')}
                                                </Badge>
                                            </div>
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
                                                    <DollarSign className="h-3 w-3" />
                                                    <span>KES {stint.offeredRate?.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {formatShiftDate(stint.shiftDate)} • {stint.shiftType?.replace('-', ' ')}
                                            </p>
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
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">
                                                    Cancel Stint
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                    {stints.length > 5 && (
                        <p className="text-sm text-center text-muted-foreground">
                            + {stints.length - 5} more stints
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Applicants Dialog */}
            <Dialog open={!!selectedStint} onOpenChange={() => setSelectedStint(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Applicants for {selectedStint?.role?.replace('-', ' ')}
                        </DialogTitle>
                        <DialogDescription>
                            Review and accept applicants for this stint.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {isLoadingApplications ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : applications.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p>No applicants yet</p>
                                <p className="text-sm">Applications will appear here when professionals apply.</p>
                            </div>
                        ) : (
                            applications.map((app) => (
                                <Card key={app.id} className="bg-secondary/50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{app.professionalName}</p>
                                                <p className="text-sm text-muted-foreground capitalize">
                                                    {app.professionalRole?.replace('-', ' ')}
                                                </p>
                                                {app.isBid && (
                                                    <Badge variant="outline" className="mt-1 text-xs">
                                                        Bid: KES {app.bidAmount?.toLocaleString()}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline">Decline</Button>
                                                <Button size="sm">Accept</Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

