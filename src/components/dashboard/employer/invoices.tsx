"use client";

import { useState, useEffect } from 'react';
import { Receipt, Download, CreditCard, Clock, CheckCircle, AlertCircle, Filter, FileText } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface Invoice {
    id: string;
    invoiceNumber: string;
    invoiceType: 'booking_fee' | 'cancellation_fee' | 'permanent_hire_fee';
    stintId?: string;
    professionalName?: string;
    amount: number;
    currency: string;
    description: string;
    isPaid: boolean;
    paidAt?: Date;
    issuedAt: Date;
    dueAt: Date;
}

const mockInvoices: Invoice[] = [
    {
        id: '1',
        invoiceNumber: 'INV-2024-001234',
        invoiceType: 'booking_fee',
        stintId: 'stint1',
        professionalName: 'Dr. Sarah Wanjiku',
        amount: 1500,
        currency: 'KES',
        description: 'Booking fee for RN Stint on Dec 5, 2024',
        isPaid: true,
        paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        issuedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dueAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
        id: '2',
        invoiceNumber: 'INV-2024-001235',
        invoiceType: 'booking_fee',
        stintId: 'stint2',
        professionalName: 'James Ochieng',
        amount: 2000,
        currency: 'KES',
        description: 'Booking fee for Clinical Officer Stint on Dec 7, 2024',
        isPaid: false,
        issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    },
    {
        id: '3',
        invoiceNumber: 'INV-2024-001236',
        invoiceType: 'cancellation_fee',
        stintId: 'stint3',
        amount: 500,
        currency: 'KES',
        description: 'Late cancellation fee for Dentist Stint',
        isPaid: false,
        issuedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        dueAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
    },
    {
        id: '4',
        invoiceNumber: 'INV-2024-001230',
        invoiceType: 'booking_fee',
        stintId: 'stint4',
        professionalName: 'Grace Muthoni',
        amount: 1800,
        currency: 'KES',
        description: 'Booking fee for Lab Tech Stint on Nov 28, 2024',
        isPaid: true,
        paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        issuedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        dueAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
];

const getInvoiceTypeBadge = (type: Invoice['invoiceType']) => {
    switch (type) {
        case 'booking_fee':
            return <Badge variant="outline" className="text-blue-500 border-blue-500/20">Booking Fee</Badge>;
        case 'cancellation_fee':
            return <Badge variant="outline" className="text-orange-500 border-orange-500/20">Cancellation Fee</Badge>;
        case 'permanent_hire_fee':
            return <Badge variant="outline" className="text-purple-500 border-purple-500/20">Permanent Hire</Badge>;
    }
};

interface InvoicesProps {
    employerId: string;
}

export function Invoices({ employerId }: InvoicesProps) {
    const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
    const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'booking_fee' | 'cancellation_fee' | 'permanent_hire_fee'>('all');

    const filteredInvoices = invoices.filter(inv => {
        if (filter === 'paid' && !inv.isPaid) return false;
        if (filter === 'unpaid' && inv.isPaid) return false;
        if (typeFilter !== 'all' && inv.invoiceType !== typeFilter) return false;
        return true;
    });

    const totalUnpaid = invoices.filter(i => !i.isPaid).reduce((sum, i) => sum + i.amount, 0);
    const totalPaid = invoices.filter(i => i.isPaid).reduce((sum, i) => sum + i.amount, 0);

    const downloadInvoice = (invoice: Invoice) => {
        // In production, this would generate and download a PDF
        console.log('Downloading invoice:', invoice.invoiceNumber);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            Invoices
                        </CardTitle>
                        <CardDescription>
                            View and manage your billing history.
                        </CardDescription>
                    </div>
                    <div className="flex gap-4 text-center">
                        <div className="px-4 py-2 rounded-lg bg-destructive/10">
                            <p className="text-xl font-bold text-destructive">KES {totalUnpaid.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Unpaid</p>
                        </div>
                        <div className="px-4 py-2 rounded-lg bg-green-500/10">
                            <p className="text-xl font-bold text-green-600">KES {totalPaid.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Paid</p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-4">
                    <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                        <SelectTrigger className="w-[130px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                        <SelectTrigger className="w-[160px]">
                            <FileText className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="booking_fee">Booking Fees</SelectItem>
                            <SelectItem value="cancellation_fee">Cancellation Fees</SelectItem>
                            <SelectItem value="permanent_hire_fee">Permanent Hire</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInvoices.map((invoice) => {
                                const isOverdue = !invoice.isPaid && new Date() > invoice.dueAt;
                                return (
                                    <TableRow key={invoice.id} className={cn(
                                        isOverdue && "bg-destructive/5"
                                    )}>
                                        <TableCell>
                                            <div>
                                                <code className="text-xs font-medium">{invoice.invoiceNumber}</code>
                                                <p className="text-xs text-muted-foreground">
                                                    Issued {invoice.issuedAt.toLocaleDateString()}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getInvoiceTypeBadge(invoice.invoiceType)}
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm max-w-[200px] truncate">{invoice.description}</p>
                                            {invoice.professionalName && (
                                                <p className="text-xs text-muted-foreground">{invoice.professionalName}</p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold">
                                                {invoice.currency} {invoice.amount.toLocaleString()}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {invoice.isPaid ? (
                                                <Badge className="bg-green-500/10 text-green-600">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Paid
                                                </Badge>
                                            ) : isOverdue ? (
                                                <Badge variant="destructive">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    Overdue
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Due {invoice.dueAt.toLocaleDateString()}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => downloadInvoice(invoice)}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                {!invoice.isPaid && (
                                                    <Button size="sm">
                                                        <CreditCard className="h-4 w-4 mr-1" />
                                                        Pay Now
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {filteredInvoices.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No invoices found</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
