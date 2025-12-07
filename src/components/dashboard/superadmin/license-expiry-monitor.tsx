"use client";

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Calendar, Building, User, Mail, Bell, Filter } from 'lucide-react';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';

interface ExpiringLicense {
    id: string;
    entityType: 'employer' | 'professional';
    name: string;
    email: string;
    licenseNumber: string;
    expiryDate: Date;
    daysUntilExpiry: number;
    status: 'active' | 'warning' | 'critical' | 'expired';
    notificationSent: boolean;
}

const mockExpiringLicenses: ExpiringLicense[] = [
    {
        id: '1',
        entityType: 'employer',
        name: 'Nairobi Premier Clinic',
        email: 'admin@nairobipremier.co.ke',
        licenseNumber: 'KE-MED-2024-1234',
        expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        daysUntilExpiry: 3,
        status: 'critical',
        notificationSent: true
    },
    {
        id: '2',
        entityType: 'professional',
        name: 'Dr. Sarah Wanjiku',
        email: 'sarah.wanjiku@gmail.com',
        licenseNumber: 'KN/2020/5678',
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        daysUntilExpiry: 7,
        status: 'critical',
        notificationSent: true
    },
    {
        id: '3',
        entityType: 'employer',
        name: 'Mombasa Health Center',
        email: 'contact@mombasahealth.co.ke',
        licenseNumber: 'KE-MED-2024-5678',
        expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        daysUntilExpiry: 14,
        status: 'warning',
        notificationSent: true
    },
    {
        id: '4',
        entityType: 'professional',
        name: 'James Ochieng',
        email: 'james.ochieng@yahoo.com',
        licenseNumber: 'KN/2019/9012',
        expiryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        daysUntilExpiry: 21,
        status: 'warning',
        notificationSent: false
    },
    {
        id: '5',
        entityType: 'employer',
        name: 'Kisumu General Hospital',
        email: 'info@kisumugeneral.co.ke',
        licenseNumber: 'KE-MED-2024-3456',
        expiryDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        daysUntilExpiry: 28,
        status: 'active',
        notificationSent: false
    },
    {
        id: '6',
        entityType: 'professional',
        name: 'Grace Muthoni',
        email: 'grace.m@outlook.com',
        licenseNumber: 'KN/2021/7890',
        expiryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        daysUntilExpiry: -2,
        status: 'expired',
        notificationSent: true
    }
];

const getStatusBadge = (status: ExpiringLicense['status'], days: number) => {
    switch (status) {
        case 'expired':
            return <Badge variant="destructive">Expired {Math.abs(days)} days ago</Badge>;
        case 'critical':
            return <Badge variant="destructive">{days} days left</Badge>;
        case 'warning':
            return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">{days} days left</Badge>;
        default:
            return <Badge variant="outline">{days} days left</Badge>;
    }
};

export function LicenseExpiryMonitor() {
    const [licenses, setLicenses] = useState<ExpiringLicense[]>(mockExpiringLicenses);
    const [filter, setFilter] = useState<'all' | 'employer' | 'professional'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'expired' | 'critical' | 'warning'>('all');

    const filteredLicenses = licenses.filter(license => {
        if (filter !== 'all' && license.entityType !== filter) return false;
        if (statusFilter !== 'all' && license.status !== statusFilter) return false;
        return true;
    });

    const expiredCount = licenses.filter(l => l.status === 'expired').length;
    const criticalCount = licenses.filter(l => l.status === 'critical').length;
    const warningCount = licenses.filter(l => l.status === 'warning').length;

    const sendReminder = (id: string) => {
        setLicenses(prev =>
            prev.map(l => l.id === id ? { ...l, notificationSent: true } : l)
        );
    };

    const suspendEntity = (id: string) => {
        // In production, this would call the API
        console.log('Suspending entity:', id);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            License Expiry Monitor
                        </CardTitle>
                        <CardDescription>
                            Track and manage expiring licenses for employers and professionals.
                        </CardDescription>
                    </div>
                    <div className="flex gap-4 text-center">
                        <div className="px-4 py-2 rounded-lg bg-destructive/10">
                            <p className="text-2xl font-bold text-destructive">{expiredCount}</p>
                            <p className="text-xs text-muted-foreground">Expired</p>
                        </div>
                        <div className="px-4 py-2 rounded-lg bg-yellow-500/10">
                            <p className="text-2xl font-bold text-yellow-600">{criticalCount}</p>
                            <p className="text-xs text-muted-foreground">Critical</p>
                        </div>
                        <div className="px-4 py-2 rounded-lg bg-secondary">
                            <p className="text-2xl font-bold">{warningCount}</p>
                            <p className="text-xs text-muted-foreground">Warning</p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-4">
                    <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                        <SelectTrigger className="w-[150px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Entity Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="employer">Employers</SelectItem>
                            <SelectItem value="professional">Professionals</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                        <SelectTrigger className="w-[150px]">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="critical">Critical (≤7 days)</SelectItem>
                            <SelectItem value="warning">Warning (≤30 days)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Entity</TableHead>
                                <TableHead>License</TableHead>
                                <TableHead>Expiry Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLicenses.map((license) => (
                                <TableRow key={license.id} className={cn(
                                    license.status === 'expired' && "bg-destructive/5"
                                )}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {license.entityType === 'employer' ? (
                                                <Building className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <User className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <div>
                                                <p className="font-medium">{license.name}</p>
                                                <p className="text-xs text-muted-foreground">{license.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-xs bg-secondary px-2 py-1 rounded">
                                            {license.licenseNumber}
                                        </code>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {license.expiryDate.toLocaleDateString()}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(license.status, license.daysUntilExpiry)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {!license.notificationSent && license.status !== 'expired' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => sendReminder(license.id)}
                                                >
                                                    <Bell className="h-3 w-3 mr-1" />
                                                    Remind
                                                </Button>
                                            )}
                                            {license.notificationSent && license.status !== 'expired' && (
                                                <Badge variant="outline" className="text-xs">
                                                    <Mail className="h-3 w-3 mr-1" />
                                                    Notified
                                                </Badge>
                                            )}
                                            {license.status === 'expired' && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => suspendEntity(license.id)}
                                                >
                                                    Suspend
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {filteredLicenses.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No licenses matching the selected filters.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
