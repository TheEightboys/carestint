"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Clock, MessageSquare, Banknote, CheckCircle2, XCircle, User, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

import { getAllDisputes, getDashboardStats } from "@/lib/firebase/firestore";

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const disputesData = await getAllDisputes();
        setDisputes(disputesData);
      } catch (error) {
        console.error("Error loading disputes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'under_review':
        return 'default';
      case 'resolved':
        return 'outline';
      case 'escalated':
        return 'secondary';
      case 'closed_no_response':
        return 'outline';
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
        <h1 className="font-headline text-xl font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Disputes Center
        </h1>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Open Disputes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {disputes.filter((d: any) => d.status === 'open').length}
              </div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Under Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {disputes.filter((d: any) => d.status === 'under_review').length}
              </div>
              <p className="text-xs text-muted-foreground">Being investigated</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {disputes.filter((d: any) => d.status === 'resolved').length}
              </div>
              <p className="text-xs text-muted-foreground">Successfully closed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Banknote className="h-4 w-4 text-blue-500" />
                Frozen Funds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {disputes.filter((d: any) => d.fundsAreFrozen).length}
              </div>
              <p className="text-xs text-muted-foreground">Pending resolution</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Disputes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Opened By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="employer">Employer</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Disputes Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Disputes</CardTitle>
            <CardDescription>
              Review and resolve disputes between employers and professionals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Opened By
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Opened
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Banknote className="h-3 w-3" />
                      Funds
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((dispute: any) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-mono text-xs">
                      {dispute.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{dispute.issueType || 'General'}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {dispute.description || 'No description'}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      <Badge variant="outline" className="text-xs">
                        {dispute.openedBy || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {dispute.openedAt?.toDate?.()?.toLocaleDateString?.() || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(dispute.status)} className="capitalize text-xs">
                        {dispute.status?.replace('_', ' ') || 'Open'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {dispute.fundsAreFrozen ? (
                        <Badge variant="secondary" className="text-xs">
                          Frozen
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Released</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {dispute.status === 'open' && (
                          <Button variant="default" size="sm">
                            Resolve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {disputes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-30 text-green-500" />
                      <p className="font-medium text-lg">No disputes!</p>
                      <p className="text-sm mt-1">
                        All stints are running smoothly. Disputes will appear here when opened.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Resolution Guidelines */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Resolution Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  Professional No-Show
                </div>
                <p className="text-muted-foreground text-xs">
                  Full refund to clinic. Strike added to professional's record.
                </p>
              </div>
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  Late Cancellation
                </div>
                <p className="text-muted-foreground text-xs">
                  Apply cancellation fee per policy. KSh 1,000 or 20%.
                </p>
              </div>
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  Quality Issue
                </div>
                <p className="text-muted-foreground text-xs">
                  Investigate evidence. Partial payout may be appropriate.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
