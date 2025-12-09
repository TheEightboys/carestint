"use client";

import { useState, useEffect } from 'react';
import { Receipt, Download, CreditCard, Clock, CheckCircle, AlertCircle, Filter, FileText, Loader2 } from 'lucide-react';
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
import { getInvoicesByEmployer } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PaymentModal } from './payment-modal';

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
    paidAt?: any;
    issuedAt: any;
    dueAt: any;
}

const getInvoiceTypeBadge = (type: Invoice['invoiceType']) => {
    switch (type) {
        case 'booking_fee':
            return <Badge variant="outline" className="text-blue-500 border-blue-500/20">Booking Fee</Badge>;
        case 'cancellation_fee':
            return <Badge variant="outline" className="text-orange-500 border-orange-500/20">Cancellation Fee</Badge>;
        case 'permanent_hire_fee':
            return <Badge variant="outline" className="text-purple-500 border-purple-500/20">Permanent Hire</Badge>;
        default:
            return <Badge variant="outline">Fee</Badge>;
    }
};

interface InvoicesProps {
    employerId: string;
}

export function Invoices({ employerId }: InvoicesProps) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'booking_fee' | 'cancellation_fee' | 'permanent_hire_fee'>('all');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const { toast } = useToast();

    const handlePayNow = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setPaymentModalOpen(true);
    };

    const handlePaymentSuccess = () => {
        loadInvoices(); // Refresh invoices after successful payment
        setPaymentModalOpen(false);
        setSelectedInvoice(null);
    };

    useEffect(() => {
        loadInvoices();
    }, [employerId]);

    const loadInvoices = async () => {
        setIsLoading(true);
        try {
            const data = await getInvoicesByEmployer(employerId);
            setInvoices(data as Invoice[]);
        } catch (error) {
            console.error("Error loading invoices:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load invoices. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        if (filter === 'paid' && !inv.isPaid) return false;
        if (filter === 'unpaid' && inv.isPaid) return false;
        if (typeFilter !== 'all' && inv.invoiceType !== typeFilter) return false;
        return true;
    });

    const totalUnpaid = invoices.filter(i => !i.isPaid).reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalPaid = invoices.filter(i => i.isPaid).reduce((sum, i) => sum + (i.amount || 0), 0);

    // Generate and download invoice as PDF (simple HTML-to-PDF approach)
    const downloadInvoice = (invoice: Invoice) => {
        // Create invoice content
        const invoiceContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #14b8a6; }
        .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .invoice-number { font-size: 20px; font-weight: bold; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .table th { background: #f5f5f5; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        .status { padding: 4px 12px; border-radius: 4px; display: inline-block; }
        .paid { background: #dcfce7; color: #16a34a; }
        .unpaid { background: #fef3c7; color: #d97706; }
        .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">CareStint</div>
        <p>Healthcare Staffing Platform</p>
    </div>
    <div class="invoice-info">
        <div>
            <div class="invoice-number">${invoice.invoiceNumber}</div>
            <p>Issued: ${formatDate(invoice.issuedAt)}</p>
            <p>Due: ${formatDate(invoice.dueAt)}</p>
        </div>
        <div>
            <span class="status ${invoice.isPaid ? 'paid' : 'unpaid'}">
                ${invoice.isPaid ? 'PAID' : 'UNPAID'}
            </span>
        </div>
    </div>
    <table class="table">
        <thead>
            <tr>
                <th>Description</th>
                <th>Type</th>
                <th style="text-align: right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>${invoice.description || 'Service Fee'}${invoice.professionalName ? `<br><small>${invoice.professionalName}</small>` : ''}</td>
                <td>${invoice.invoiceType?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Fee'}</td>
                <td style="text-align: right;">${invoice.currency || 'KES'} ${(invoice.amount || 0).toLocaleString()}</td>
            </tr>
        </tbody>
    </table>
    <div class="total">
        Total: ${invoice.currency || 'KES'} ${(invoice.amount || 0).toLocaleString()}
    </div>
    <div class="footer">
        <p>Thank you for using CareStint</p>
        <p>For questions, contact billing@carestint.com</p>
    </div>
</body>
</html>
        `;

        // Create blob and download
        const blob = new Blob([invoiceContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${invoice.invoiceNumber}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
            title: "Invoice Downloaded",
            description: `${invoice.invoiceNumber} has been downloaded.`,
        });
    };

    // Format date from Firestore timestamp
    const formatDate = (date: any): string => {
        if (!date) return 'N/A';
        const d = date.toDate?.() || new Date(date);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Check if invoice is overdue
    const isOverdue = (invoice: Invoice): boolean => {
        if (invoice.isPaid) return false;
        const dueDate = invoice.dueAt?.toDate?.() || new Date(invoice.dueAt);
        return new Date() > dueDate;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
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

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
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
                                        const overdue = isOverdue(invoice);
                                        return (
                                            <TableRow key={invoice.id} className={cn(
                                                overdue && "bg-destructive/5"
                                            )}>
                                                <TableCell>
                                                    <div>
                                                        <code className="text-xs font-medium">{invoice.invoiceNumber || 'N/A'}</code>
                                                        <p className="text-xs text-muted-foreground">
                                                            Issued {formatDate(invoice.issuedAt)}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getInvoiceTypeBadge(invoice.invoiceType)}
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm max-w-[200px] truncate">{invoice.description || 'Service Fee'}</p>
                                                    {invoice.professionalName && (
                                                        <p className="text-xs text-muted-foreground">{invoice.professionalName}</p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold">
                                                        {invoice.currency || 'KES'} {(invoice.amount || 0).toLocaleString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {invoice.isPaid ? (
                                                        <Badge className="bg-green-500/10 text-green-600">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Paid
                                                        </Badge>
                                                    ) : overdue ? (
                                                        <Badge variant="destructive">
                                                            <AlertCircle className="h-3 w-3 mr-1" />
                                                            Overdue
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            Due {formatDate(invoice.dueAt)}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => downloadInvoice(invoice)}
                                                            title="Download Invoice"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        {!invoice.isPaid && (
                                                            <Button size="sm" onClick={() => handlePayNow(invoice)}>
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
                                <p className="text-sm">Invoices will appear here when stints are completed.</p>
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            {/* Payment Modal */}
            <PaymentModal
                invoice={selectedInvoice}
                isOpen={paymentModalOpen}
                onClose={() => {
                    setPaymentModalOpen(false);
                    setSelectedInvoice(null);
                }}
                onPaymentSuccess={handlePaymentSuccess}
            />
        </Card>
    );
}
