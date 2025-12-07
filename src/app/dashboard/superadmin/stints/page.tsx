"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, Clock, DollarSign, Filter, MapPin, Search, User, Loader2 } from "lucide-react";

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

import { getAllStints, getDashboardStats } from "@/lib/firebase/firestore";

export default function StintsPage() {
    const [stints, setStints] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalStints: 0,
        activeStints: 0,
        disputedStints: 0,
        flaggedStints: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [stintsData, statsData] = await Promise.all([
                    getAllStints(),
                    getDashboardStats(),
                ]);
                setStints(stintsData);
                setStats(statsData);
            } catch (error) {
                console.error("Error loading stints data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'open':
                return 'default';
            case 'accepted':
                return 'secondary';
            case 'in_progress':
                return 'default';
            case 'completed':
                return 'outline';
            case 'disputed':
                return 'destructive';
            case 'settled':
                return 'outline';
            case 'cancelled':
                return 'secondary';
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

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/superadmin">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Overview
                    </Link>
                </Button>
                <h1 className="font-headline text-xl font-semibold">
                    All Stints
                </h1>
            </header>

            <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
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

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filter Stints</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search by clinic, role..." className="w-[200px]" />
                            </div>
                            <Select defaultValue="all">
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="accepted">Accepted</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="disputed">Disputed</SelectItem>
                                    <SelectItem value="settled">Settled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select defaultValue="all">
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="rn">Nurse (RN)</SelectItem>
                                    <SelectItem value="dentist">Dentist</SelectItem>
                                    <SelectItem value="clinical-officer">Clinical Officer</SelectItem>
                                    <SelectItem value="pharmacist">Pharmacist</SelectItem>
                                    <SelectItem value="lab-tech">Lab Tech</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Stints Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stints List</CardTitle>
                        <CardDescription>
                            View and manage all stints on the platform.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Clinic</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            City
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            <DollarSign className="h-3 w-3" />
                                            Rate
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Shift
                                        </div>
                                    </TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Fees</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stints.map((stint: any) => (
                                    <TableRow key={stint.id} className="group">
                                        <TableCell className="font-mono text-xs">
                                            {stint.id.slice(0, 8)}...
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
                                        <TableCell className="font-medium">
                                            KES {stint.offeredRate?.toLocaleString() || 0}
                                        </TableCell>
                                        <TableCell className="capitalize text-xs">
                                            {stint.shiftType?.replace('-', ' ') || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(stint.status)} className="capitalize text-xs">
                                                {stint.status?.replace('_', ' ') || 'Unknown'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="text-xs text-muted-foreground">
                                                    <div>Clinic: +{stint.bookingFeePercent || 15}%</div>
                                                    <div>Pro: -5%</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {stints.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>No stints found</p>
                                            <p className="text-sm">Stints will appear here once employers start posting.</p>
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
