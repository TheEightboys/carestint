"use client";

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Ban, AlertTriangle } from "lucide-react";

interface SuspensionModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (days: number | null, reason: string) => void;
    entityType: 'employer' | 'professional';
    entityName: string;
    isLoading: boolean;
}

export function SuspensionModal({
    open,
    onClose,
    onConfirm,
    entityType,
    entityName,
    isLoading,
}: SuspensionModalProps) {
    const [suspensionType, setSuspensionType] = useState<'temporary' | 'permanent'>('temporary');
    const [days, setDays] = useState<number>(7);
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (!reason.trim()) return;
        onConfirm(suspensionType === 'temporary' ? days : null, reason);
    };

    const handleClose = () => {
        setSuspensionType('temporary');
        setDays(7);
        setReason('');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Ban className="h-5 w-5" />
                        Suspend {entityType === 'employer' ? 'Employer' : 'Professional'}
                    </DialogTitle>
                    <DialogDescription>
                        You are about to suspend <span className="font-semibold">{entityName}</span>.
                        This will prevent them from using the platform.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Suspension Type */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Suspension Type</Label>
                        <RadioGroup
                            value={suspensionType}
                            onValueChange={(value) => setSuspensionType(value as 'temporary' | 'permanent')}
                            className="flex flex-col gap-3"
                        >
                            <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value="temporary" id="temporary" />
                                <Label htmlFor="temporary" className="flex-1 cursor-pointer">
                                    <div className="font-medium">Temporary Suspension</div>
                                    <div className="text-sm text-muted-foreground">Account will be automatically reactivated after the specified period</div>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-3 rounded-lg border border-destructive/30 p-3 cursor-pointer hover:bg-destructive/5 transition-colors">
                                <RadioGroupItem value="permanent" id="permanent" />
                                <Label htmlFor="permanent" className="flex-1 cursor-pointer">
                                    <div className="font-medium text-destructive">Permanent Suspension</div>
                                    <div className="text-sm text-muted-foreground">Account will remain suspended until manually reactivated</div>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Days Input (only for temporary) */}
                    {suspensionType === 'temporary' && (
                        <div className="space-y-2">
                            <Label htmlFor="days">Suspension Duration (days)</Label>
                            <Input
                                id="days"
                                type="number"
                                min={1}
                                max={365}
                                value={days}
                                onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
                                placeholder="Enter number of days"
                            />
                            <p className="text-xs text-muted-foreground">
                                Account will be automatically reactivated on {new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString()}
                            </p>
                        </div>
                    )}

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Suspension *</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter the reason for this suspension..."
                            rows={3}
                        />
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            The {entityType} will be notified about this suspension and will not be able to access the platform until {suspensionType === 'temporary' ? 'the suspension period ends' : 'you manually unsuspend them'}.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isLoading || !reason.trim()}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Ban className="h-4 w-4 mr-2" />
                        )}
                        Confirm Suspension
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
