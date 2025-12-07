"use client";

import { useState, useEffect } from 'react';
import { Clock, MapPin, Play, Square, AlertTriangle, CheckCircle2, Timer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { clockInStint, clockOutStint } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ClockInOutProps {
    stintId: string;
    employerName: string;
    shiftStartTime: string;
    shiftEndTime: string;
    address?: string;
    isClockable: boolean;
    currentStatus: 'accepted' | 'in_progress';
    clockInTime?: Date;
    onStatusChange?: () => void;
}

export function ClockInOut({
    stintId,
    employerName,
    shiftStartTime,
    shiftEndTime,
    address,
    isClockable,
    currentStatus,
    clockInTime,
    onStatusChange
}: ClockInOutProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [dialogAction, setDialogAction] = useState<'clock_in' | 'clock_out'>('clock_in');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    // Timer for elapsed time when clocked in
    useEffect(() => {
        if (currentStatus !== 'in_progress' || !clockInTime) return;

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - new Date(clockInTime).getTime()) / 1000);
            setElapsedTime(elapsed);
        }, 1000);

        return () => clearInterval(interval);
    }, [currentStatus, clockInTime]);

    const formatElapsedTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getLocation = async (): Promise<{ lat: number; lng: number } | null> => {
        setIsGettingLocation(true);
        setLocationError(null);

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const loc = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            setLocation(loc);
            return loc;
        } catch (error: any) {
            let errorMessage = 'Unable to get location';
            if (error.code === 1) {
                errorMessage = 'Location permission denied. Please enable location access.';
            } else if (error.code === 2) {
                errorMessage = 'Location unavailable. Please try again.';
            } else if (error.code === 3) {
                errorMessage = 'Location request timed out.';
            }
            setLocationError(errorMessage);
            return null;
        } finally {
            setIsGettingLocation(false);
        }
    };

    const handleClockIn = async () => {
        setDialogAction('clock_in');
        setShowConfirmDialog(true);
    };

    const handleClockOut = async () => {
        setDialogAction('clock_out');
        setShowConfirmDialog(true);
    };

    const confirmAction = async () => {
        setShowConfirmDialog(false);
        setIsLoading(true);

        try {
            // Get location
            const loc = await getLocation();

            if (dialogAction === 'clock_in') {
                await clockInStint(stintId);
                toast({
                    title: 'Clocked In Successfully',
                    description: `You are now working at ${employerName}${loc ? '. Location recorded.' : ''}`,
                });
            } else {
                await clockOutStint(stintId);
                toast({
                    title: 'Clocked Out Successfully',
                    description: 'Your shift has been completed. Payment will be processed after the dispute window.',
                });
            }

            onStatusChange?.();
        } catch (error) {
            console.error(`Error ${dialogAction}:`, error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: `Failed to ${dialogAction.replace('_', ' ')}. Please try again.`,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Check if late for clock-in
    const isLate = () => {
        const now = new Date();
        const [hours, minutes] = shiftStartTime.split(':').map(Number);
        const shiftStart = new Date();
        shiftStart.setHours(hours, minutes, 0, 0);
        return now > shiftStart && currentStatus === 'accepted';
    };

    // Calculate shift progress
    const getShiftProgress = () => {
        if (currentStatus !== 'in_progress') return 0;
        const [startH, startM] = shiftStartTime.split(':').map(Number);
        const [endH, endM] = shiftEndTime.split(':').map(Number);
        const shiftDuration = (endH * 60 + endM) - (startH * 60 + startM);
        const elapsed = elapsedTime / 60;
        return Math.min(100, (elapsed / shiftDuration) * 100);
    };

    return (
        <>
            <Card className={cn(
                "transition-all",
                currentStatus === 'in_progress' && "border-green-500/50 bg-green-500/5"
            )}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Timer className="h-5 w-5" />
                            {currentStatus === 'in_progress' ? 'Currently Working' : 'Ready to Clock In'}
                        </CardTitle>
                        {isLate() && (
                            <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Late
                            </Badge>
                        )}
                    </div>
                    <CardDescription>
                        {employerName} • {shiftStartTime} - {shiftEndTime}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Location Info */}
                    {address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <MapPin className="h-4 w-4" />
                            <span>{address}</span>
                        </div>
                    )}

                    {/* Timer Display */}
                    {currentStatus === 'in_progress' && (
                        <div className="text-center py-6 mb-4 rounded-lg bg-secondary/50">
                            <p className="text-5xl font-mono font-bold tracking-wider">
                                {formatElapsedTime(elapsedTime)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">Time Elapsed</p>
                            <Progress value={getShiftProgress()} className="h-2 mt-4 max-w-xs mx-auto" />
                        </div>
                    )}

                    {/* Location Status */}
                    {locationError && (
                        <div className="flex items-center gap-2 text-sm text-destructive mb-4 p-3 rounded-lg bg-destructive/10">
                            <AlertTriangle className="h-4 w-4" />
                            {locationError}
                        </div>
                    )}

                    {location && (
                        <div className="flex items-center gap-2 text-sm text-green-600 mb-4 p-3 rounded-lg bg-green-500/10">
                            <CheckCircle2 className="h-4 w-4" />
                            Location verified
                        </div>
                    )}

                    {/* Clock In/Out Buttons */}
                    <div className="flex flex-col gap-3">
                        {currentStatus === 'accepted' && (
                            <Button
                                size="lg"
                                className="w-full gap-2 bg-green-600 hover:bg-green-700"
                                onClick={handleClockIn}
                                disabled={!isClockable || isLoading || isGettingLocation}
                            >
                                {isLoading || isGettingLocation ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Play className="h-5 w-5" />
                                )}
                                Clock In
                            </Button>
                        )}

                        {currentStatus === 'in_progress' && (
                            <Button
                                size="lg"
                                variant="destructive"
                                className="w-full gap-2"
                                onClick={handleClockOut}
                                disabled={isLoading || isGettingLocation}
                            >
                                {isLoading || isGettingLocation ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Square className="h-5 w-5" />
                                )}
                                Clock Out
                            </Button>
                        )}
                    </div>

                    {/* Instructions */}
                    <p className="text-xs text-muted-foreground text-center mt-4">
                        {currentStatus === 'accepted'
                            ? 'Clock in when you arrive at the facility. Location will be recorded.'
                            : 'Clock out when your shift is complete. Payment processes after 24h dispute window.'
                        }
                    </p>
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {dialogAction === 'clock_in' ? 'Confirm Clock In' : 'Confirm Clock Out'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {dialogAction === 'clock_in'
                                ? `Are you at ${employerName} and ready to start your shift? Your location will be recorded for verification.`
                                : 'Are you sure you want to end your shift? Make sure all your duties are completed.'
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmAction}>
                            {dialogAction === 'clock_in' ? 'Clock In' : 'Clock Out'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
