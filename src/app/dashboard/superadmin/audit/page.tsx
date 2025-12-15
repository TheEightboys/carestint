"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Filter, Search, User, Clock, FileText, Loader2, RefreshCw, AlertTriangle } from "lucide-react";

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

import { getRecentAuditLogs } from "@/lib/firebase/firestore";

export default function AuditPage() {
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const logs = await getRecentAuditLogs(100);
            setAuditLogs(logs || []);
        } catch (err) {
            console.error("Error loading audit logs:", err);
            setError("Failed to load audit logs. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getActionColor = (action: string) => {
        if (action?.includes('APPROVED') || action?.includes('CREATED')) return 'text-green-600';
        if (action?.includes('REJECTED') || action?.includes('SUSPENDED')) return 'text-destructive';
        if (action?.includes('DISPUTE')) return 'text-yellow-600';
        return 'text-foreground';
    };

    const getEntityBadgeVariant = (entityType: string) => {
        switch (entityType) {
            case 'employer':
                return 'default';
            case 'professional':
                return 'secondary';
            case 'stint':
                return 'outline';
            case 'dispute':
                return 'destructive';
            case 'payout':
                return 'default';
            default:
                return 'outline';
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center flex-col gap-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <p className="text-destructive">{error}</p>
                <Button onClick={loadData}>Try Again</Button>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/superadmin">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Overview
                    </Link>
                </Button>
                <h1 className="font-headline text-xl font-semibold flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Audit Log
                </h1>
                <div className="ml-auto">
                    <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </header>

            <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                {/* Stats Summary */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{auditLogs.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">System Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{auditLogs.filter((l: any) => l.actorType === 'system').length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{auditLogs.filter((l: any) => l.actorType === 'superadmin').length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">User Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{auditLogs.filter((l: any) => ['employer', 'professional'].includes(l.actorType)).length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filter Audit Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search by description..." className="w-[250px]" />
                            </div>
                            <Select defaultValue="all">
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Entity Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Entities</SelectItem>
                                    <SelectItem value="employer">Employer</SelectItem>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="stint">Stint</SelectItem>
                                    <SelectItem value="dispute">Dispute</SelectItem>
                                    <SelectItem value="payout">Payout</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select defaultValue="all">
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Actor Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actors</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                    <SelectItem value="superadmin">SuperAdmin</SelectItem>
                                    <SelectItem value="employer">Employer</SelectItem>
                                    <SelectItem value="professional">Professional</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Audit Log Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Activity Log</CardTitle>
                        <CardDescription>
                            Complete history of all actions and system events on the platform.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Timestamp
                                        </div>
                                    </TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Entity</TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            Actor
                                        </div>
                                    </TableHead>
                                    <TableHead>Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {auditLogs.map((log: any) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {log.timestamp?.toDate?.()?.toLocaleString?.() || 'Just now'}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`font-medium text-xs ${getActionColor(log.action)}`}>
                                                {log.action?.replace(/_/g, ' ') || 'Unknown'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getEntityBadgeVariant(log.entityType)} className="capitalize text-xs">
                                                {log.entityType || 'Unknown'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="capitalize text-xs">
                                            <div className="flex items-center gap-1">
                                                {log.actorType === 'system' ? (
                                                    <FileText className="h-3 w-3 text-muted-foreground" />
                                                ) : (
                                                    <User className="h-3 w-3 text-muted-foreground" />
                                                )}
                                                {log.actorType || 'Unknown'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm max-w-[300px] truncate">
                                            {log.description || 'No description'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {auditLogs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>No audit entries yet</p>
                                            <p className="text-sm">Activity will be logged as users interact with the platform.</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
