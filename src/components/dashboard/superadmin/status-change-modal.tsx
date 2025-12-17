"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle, Clock, XCircle, Ban, ArrowRight } from "lucide-react";

interface StatusChangeModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (newStatus: string, reason?: string) => Promise<void>;
    entityType: "employer" | "professional";
    entityName: string;
    currentStatus: string;
    isLoading: boolean;
}

const STATUS_OPTIONS = [
    { value: "pending_validation", label: "Pending Review", icon: Clock, color: "bg-yellow-500/20 text-yellow-500" },
    { value: "active", label: "Active (Approved)", icon: CheckCircle, color: "bg-green-500/20 text-green-500" },
    { value: "rejected", label: "Rejected", icon: XCircle, color: "bg-destructive/20 text-destructive" },
    { value: "suspended", label: "Suspended", icon: Ban, color: "bg-orange-500/20 text-orange-500" },
];

export function StatusChangeModal({
    open,
    onClose,
    onConfirm,
    entityType,
    entityName,
    currentStatus,
    isLoading,
}: StatusChangeModalProps) {
    const [newStatus, setNewStatus] = useState<string>("");
    const [reason, setReason] = useState("");

    const handleConfirm = async () => {
        if (!newStatus || newStatus === currentStatus) return;
        await onConfirm(newStatus, reason || undefined);
        setNewStatus("");
        setReason("");
    };

    const handleClose = () => {
        setNewStatus("");
        setReason("");
        onClose();
    };

    const getCurrentStatusLabel = () => {
        return STATUS_OPTIONS.find(s => s.value === currentStatus)?.label || currentStatus.replace(/_/g, ' ');
    };

    const getNewStatusLabel = () => {
        return STATUS_OPTIONS.find(s => s.value === newStatus)?.label || newStatus.replace(/_/g, ' ');
    };

    const requiresReason = newStatus === "rejected" || newStatus === "suspended";

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-accent" />
                        Change Status
                    </DialogTitle>
                    <DialogDescription>
                        Update the status for <strong>{entityName}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Current Status Display */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <span className="text-sm text-muted-foreground">Current Status:</span>
                        <Badge variant="outline" className={STATUS_OPTIONS.find(s => s.value === currentStatus)?.color}>
                            {getCurrentStatusLabel()}
                        </Badge>
                    </div>

                    {/* New Status Selection */}
                    <div className="space-y-2">
                        <Label>New Status</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select new status..." />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.filter(s => s.value !== currentStatus).map((status) => {
                                    const Icon = status.icon;
                                    return (
                                        <SelectItem key={status.value} value={status.value}>
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4" />
                                                {status.label}
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Change Preview */}
                    {newStatus && (
                        <div className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed">
                            <Badge variant="outline" className={STATUS_OPTIONS.find(s => s.value === currentStatus)?.color}>
                                {getCurrentStatusLabel()}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline" className={STATUS_OPTIONS.find(s => s.value === newStatus)?.color}>
                                {getNewStatusLabel()}
                            </Badge>
                        </div>
                    )}

                    {/* Reason Input (for rejection/suspension) */}
                    {requiresReason && (
                        <div className="space-y-2">
                            <Label>
                                Reason {newStatus === "suspended" ? "(for suspension)" : "(for rejection)"}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                placeholder={`Enter the reason for ${newStatus === 'suspended' ? 'suspension' : 'rejection'}...`}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || !newStatus || (requiresReason && !reason.trim())}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Confirm Change"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
