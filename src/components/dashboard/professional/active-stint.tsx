"use client";

import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Clock,
    Play,
    Square,
    MapPin,
    Banknote,
    Building,
    Loader2,
    CheckCircle2,
    Star,
    Timer,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
    getStintById,
    clockInStint,
    clockOutStint,
    getApplicationsByProfessional,
} from "@/lib/firebase/firestore";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ActiveStintProps {
    professionalId?: string;
}

interface StintData {
    id: string;
    role: string;
    employerName: string;
    city: string;
    startTime: string;
    endTime: string;
    offeredRate: number;
    shiftType: string;
    status: string;
    clockInTime?: any;
    clockOutTime?: any;
    shiftDate?: any;
}

export function ActiveStint({ professionalId = "demo-professional" }: ActiveStintProps) {
    const [activeStint, setActiveStint] = useState<StintData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isClockingIn, setIsClockingIn] = useState(false);
    const [isClockingOut, setIsClockingOut] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showRatingDialog, setShowRatingDialog] = useState(false);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");
    const { toast } = useToast();

    const loadActiveStint = async () => {
        setIsLoading(true);
        try {
            // Find accepted application to get the active stint
            const applications = await getApplicationsByProfessional(professionalId) as any[];
            const acceptedApp = applications.find(
                (app) => app.status === "accepted"
            );

            if (acceptedApp) {
                const stint = (await getStintById(acceptedApp.stintId)) as StintData;
                // Show stint if it's confirmed (paid), accepted, or in_progress
                if (stint && ["confirmed", "accepted", "in_progress"].includes(stint.status)) {
                    setActiveStint(stint);
                }
            }

        } catch (error) {
            console.error("Error loading active stint:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadActiveStint();
    }, [professionalId]);

    // Timer for in-progress stints
    useEffect(() => {
        if (activeStint?.status === "in_progress" && activeStint.clockInTime) {
            const clockIn = activeStint.clockInTime.toDate
                ? activeStint.clockInTime.toDate()
                : new Date(activeStint.clockInTime);

            const interval = setInterval(() => {
                const now = new Date();
                const diff = Math.floor((now.getTime() - clockIn.getTime()) / 1000);
                setElapsedTime(diff);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [activeStint]);

    const formatElapsedTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, "0")}:${mins
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleClockIn = async () => {
        if (!activeStint) return;
        setIsClockingIn(true);
        try {
            const success = await clockInStint(activeStint.id);
            if (success) {
                toast({
                    title: "Clocked In!",
                    description: "Your shift has started. Good luck!",
                });
                await loadActiveStint();
            } else {
                throw new Error("Failed to clock in");
            }
        } catch (error) {
            console.error("Error clocking in:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to clock in. Please try again.",
            });
        } finally {
            setIsClockingIn(false);
        }
    };

    const handleClockOut = async () => {
        if (!activeStint) return;
        setIsClockingOut(true);
        try {
            const success = await clockOutStint(activeStint.id);
            if (success) {
                // Clear the active stint immediately so UI updates
                setActiveStint(null);

                toast({
                    title: "🎉 Shift Completed!",
                    description: "Great work! Your earnings will be processed within 24 hours.",
                });

                // Show rating dialog
                setShowRatingDialog(true);
            } else {
                throw new Error("Failed to clock out");
            }
        } catch (error) {
            console.error("Error clocking out:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to clock out. Please try again.",
            });
        } finally {
            setIsClockingOut(false);
        }
    };


    const handleSubmitRating = async () => {
        // TODO: Submit rating to Firestore
        toast({
            title: "Thank you!",
            description: "Your feedback has been submitted.",
        });
        setShowRatingDialog(false);
        setRating(0);
        setReview("");
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!activeStint) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Timer className="h-6 w-6" />
                        Active Stint
                    </CardTitle>
                    <CardDescription>
                        Your currently active stint will appear here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 text-center p-12">
                        <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">No active stint right now</p>
                        <p className="text-sm text-muted-foreground/80">
                            Once an employer accepts your application, you can clock in here.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isInProgress = activeStint.status === "in_progress";

    return (
        <>
            <Card className={cn(isInProgress && "border-green-500/50 bg-green-500/5")}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Timer className="h-6 w-6" />
                                Active Stint
                            </CardTitle>
                            <CardDescription>
                                {isInProgress
                                    ? "You're currently on shift"
                                    : "Ready to start your shift"}
                            </CardDescription>
                        </div>
                        <Badge
                            variant={isInProgress ? "default" : "secondary"}
                            className={cn(
                                "text-sm px-3 py-1",
                                isInProgress && "bg-green-500 text-white"
                            )}
                        >
                            {isInProgress ? "In Progress" : "Ready"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Stint Details */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                    <Building className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold capitalize text-lg">
                                        {activeStint.role?.replace("-", " ")}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {activeStint.employerName}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{activeStint.city}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                                    {activeStint.startTime} - {activeStint.endTime}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Banknote className="h-4 w-4 text-green-600" />
                                <span className="font-semibold text-green-600">
                                    KES {activeStint.offeredRate?.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Badge variant="outline" className="capitalize">
                                    {activeStint.shiftType?.replace("-", " ")}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Timer (if in progress) */}
                    {isInProgress && (
                        <div className="rounded-xl bg-secondary p-6 text-center">
                            <p className="text-sm text-muted-foreground mb-2">Time Elapsed</p>
                            <p className="text-4xl font-mono font-bold text-foreground">
                                {formatElapsedTime(elapsedTime)}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {!isInProgress ? (
                            <Button
                                size="lg"
                                className="flex-1 h-14 text-lg"
                                onClick={handleClockIn}
                                disabled={isClockingIn}
                            >
                                {isClockingIn ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <Play className="mr-2 h-5 w-5" />
                                )}
                                {isClockingIn ? "Clocking In..." : "Clock In"}
                            </Button>
                        ) : (
                            <Button
                                size="lg"
                                variant="destructive"
                                className="flex-1 h-14 text-lg"
                                onClick={handleClockOut}
                                disabled={isClockingOut}
                            >
                                {isClockingOut ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <Square className="mr-2 h-5 w-5" />
                                )}
                                {isClockingOut ? "Clocking Out..." : "Clock Out"}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Rating Dialog */}
            <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rate Your Experience</DialogTitle>
                        <DialogDescription>
                            How was your experience working with {activeStint?.employerName}?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={cn(
                                            "h-10 w-10",
                                            star <= rating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-muted-foreground/30"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <Label>Review (Optional)</Label>
                            <Textarea
                                placeholder="Share your experience..."
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRatingDialog(false)}>
                            Skip
                        </Button>
                        <Button onClick={handleSubmitRating}>Submit Rating</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
