"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  ArrowUpRight,
  Building,
  DollarSign,
  ShieldCheck,
  Users,
  AlertTriangle,
  Briefcase,
  FileText,
  Settings,
  ClipboardList,
  Loader2,
} from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { GrossVolumeChart } from "@/components/dashboard/superadmin/gross-volume-chart"
import {
  getPendingEmployers,
  getPendingProfessionals,
  getDashboardStats,
  getOpenDisputes,
  getRecentAuditLogs,
} from "@/lib/firebase/firestore"

export default function SuperAdminDashboardPage() {
  const [newProfessionals, setNewProfessionals] = useState<any[]>([]);
  const [newEmployers, setNewEmployers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    grossVolume: 0,
    platformRevenue: 0,
    totalEmployers: 0,
    pendingEmployers: 0,
    totalProfessionals: 0,
    pendingProfessionals: 0,
    activeStints: 0,
    disputedStints: 0,
  });
  const [openDisputes, setOpenDisputes] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [professionals, employers, statsData, disputes, logs] = await Promise.all([
          getPendingProfessionals(),
          getPendingEmployers(),
          getDashboardStats(),
          getOpenDisputes(),
          getRecentAuditLogs(10),
        ]);
        setNewProfessionals(professionals);
        setNewEmployers(employers);
        setStats(statsData);
        setOpenDisputes(disputes);
        setRecentLogs(logs);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

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
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" />
          <h1 className="font-headline text-xl font-semibold">
            SuperAdmin Dashboard
          </h1>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        {/* Navigation Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employers" asChild>
              <Link href="/dashboard/superadmin/employers">Employers</Link>
            </TabsTrigger>
            <TabsTrigger value="professionals" asChild>
              <Link href="/dashboard/superadmin/professionals">Professionals</Link>
            </TabsTrigger>
            <TabsTrigger value="stints" asChild>
              <Link href="/dashboard/superadmin/stints">Stints</Link>
            </TabsTrigger>
            <TabsTrigger value="finance" asChild>
              <Link href="/dashboard/superadmin/finance">Finance</Link>
            </TabsTrigger>
            <TabsTrigger value="audit" asChild>
              <Link href="/dashboard/superadmin/audit">Audit</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Gross Volume
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">KES {stats.grossVolume.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Platform Revenue: KES {stats.platformRevenue.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Employers
                  </CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalEmployers}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats.pendingEmployers} awaiting validation
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Professionals</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProfessionals}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats.pendingProfessionals} awaiting validation
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Stints</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeStints}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.disputedStints > 0 ? `${stats.disputedStints} in dispute` : 'No disputes'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader className="flex flex-row items-center">
                  <div className="grid gap-2">
                    <CardTitle>Platform Volume</CardTitle>
                    <CardDescription>
                      Gross transaction volume over the last 6 months.
                    </CardDescription>
                  </div>
                  <Button asChild size="sm" className="ml-auto gap-1">
                    <Link href="/dashboard/superadmin/finance">
                      View All
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <GrossVolumeChart />
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>New Professionals</CardTitle>
                    <CardDescription>
                      Awaiting review and license verification.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    {newProfessionals.slice(0, 5).map((pro: any) => (
                      <div className="flex items-center gap-4" key={pro.id}>
                        <Avatar className="hidden h-9 w-9 sm:flex">
                          <AvatarImage src={`https://picsum.photos/seed/${pro.id}/40/40`} alt="Avatar" />
                          <AvatarFallback>{pro.fullName?.charAt(0) || 'P'}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1 flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none truncate">{pro.fullName}</p>
                          <p className="text-sm text-muted-foreground truncate">{pro.email}</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/superadmin/professionals?reviewId=${pro.id}`}>Review</Link>
                        </Button>
                      </div>
                    ))}
                    {newProfessionals.length === 0 && (
                      <p className="text-sm text-muted-foreground">No new professionals awaiting verification.</p>
                    )}
                    {newProfessionals.length > 5 && (
                      <Button variant="link" size="sm" asChild className="w-full">
                        <Link href="/dashboard/superadmin/professionals">View all {newProfessionals.length} pending</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>New Employers</CardTitle>
                    <CardDescription>
                      New facilities awaiting KYC and activation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    {newEmployers.slice(0, 5).map((emp: any) => (
                      <div className="flex items-center gap-4" key={emp.id}>
                        <Avatar className="hidden h-9 w-9 sm:flex">
                          <AvatarImage src={`https://picsum.photos/seed/${emp.id}/40/40`} alt="Avatar" />
                          <AvatarFallback>{emp.facilityName?.charAt(0) || 'E'}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1 flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none truncate">{emp.facilityName}</p>
                          <p className="text-sm text-muted-foreground truncate">{emp.email}</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/superadmin/employers?reviewId=${emp.id}`}>Review</Link>
                        </Button>
                      </div>
                    ))}
                    {newEmployers.length === 0 && (
                      <p className="text-sm text-muted-foreground">No new employers awaiting verification.</p>
                    )}
                    {newEmployers.length > 5 && (
                      <Button variant="link" size="sm" asChild className="w-full">
                        <Link href="/dashboard/superadmin/employers">View all {newEmployers.length} pending</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Open Disputes & Risk
                  </CardTitle>
                  <CardDescription>Disputes that require manual review and resolution.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Issue</TableHead>
                        <TableHead>Opened By</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {openDisputes.slice(0, 5).map((dispute: any) => (
                        <TableRow key={dispute.id}>
                          <TableCell>
                            <div className="font-medium truncate max-w-[150px]">{dispute.issueType}</div>
                          </TableCell>
                          <TableCell className="capitalize">{dispute.openedBy}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="destructive" className="text-xs">
                              Open
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {openDisputes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No open disputes
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <Button asChild size="sm" className="mt-4 w-full">
                    <Link href="/dashboard/superadmin/disputes">
                      Go to Disputes Center
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest actions and system events.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead className="text-right">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentLogs.slice(0, 6).map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="font-medium text-xs">{log.action?.replace(/_/g, ' ')}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">
                              {log.entityType}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize text-xs">{log.actorType}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {log.timestamp?.toDate?.()?.toLocaleDateString?.() || 'Just now'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {recentLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No recent activity
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                    <Link href="/dashboard/superadmin/audit">
                      View Full Audit Log
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
