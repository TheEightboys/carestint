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
  TrendingUp,
  Wallet,
  AlertOctagon,
  RefreshCw,
  Target,
  Zap,
  Copy,
  CheckCircle2,
  BarChart3,
  Calendar,
  Pencil,
  Home,
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
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

import { GrossVolumeChart } from "@/components/dashboard/superadmin/gross-volume-chart"
import {
  getPendingEmployers,
  getPendingProfessionals,
  getDashboardStats,
  getOpenDisputes,
  getRecentAuditLogs,
} from "@/lib/firebase/firestore"
import { getRiskDistribution, recalculateAllRiskScores } from "@/lib/risk-scoring"
import { getSettlementStats, processReadySettlements } from "@/lib/settlement-engine"
import { detectDuplicates, getDuplicateStats } from "@/lib/duplicate-detection"
import { getAutomationSettings, updateAutomationSetting, type AutomationSettings } from "@/lib/firebase/automationSettings"
import { submitModuleRequest } from "@/lib/firebase/chat"

export default function SuperAdminDashboardPage() {
  const { toast } = useToast();
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

  // NEW: Enhanced stats
  const [riskDistribution, setRiskDistribution] = useState({
    employers: { low: 0, medium: 0, high: 0 },
    professionals: { low: 0, medium: 0, high: 0 },
  });
  const [settlementStats, setSettlementStats] = useState({
    pendingPayouts: 0,
    completedPayouts: 0,
    totalPaidOut: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
  });
  const [duplicateStats, setDuplicateStats] = useState({
    pendingAlerts: 0,
    resolvedAlerts: 0,
    totalDuplicateAccounts: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Date range state for platform volume
  const [volumeStartDate, setVolumeStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 5);
    date.setDate(1);
    return date;
  });
  const [volumeEndDate, setVolumeEndDate] = useState<Date>(new Date());

  // Automation settings state
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>({
    riskScoring: true,
    settlementEngine: true,
    duplicateDetection: true,
    autoUnsuspension: false,
  });

  // Handle automation toggle
  const handleAutomationToggle = async (key: keyof Omit<AutomationSettings, 'updatedAt'>, value: boolean) => {
    setAutomationSettings(prev => ({ ...prev, [key]: value }));
    const success = await updateAutomationSetting(key, value);
    if (success) {
      toast({
        title: value ? "Module Enabled" : "Module Disabled",
        description: `${key.replace(/([A-Z])/g, ' $1').trim()} has been ${value ? 'enabled' : 'disabled'}.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save setting. Please try again.",
      });
      // Revert on error
      setAutomationSettings(prev => ({ ...prev, [key]: !value }));
    }
  };

  // Handle Request New Module
  const handleRequestNewModule = async () => {
    const moduleName = prompt("Enter the name of the automation module you'd like to request:");
    if (!moduleName) return;

    const description = prompt("Please describe what this module should do:") || '';

    const requestId = await submitModuleRequest({
      requestedBy: 'superadmin',
      moduleName,
      description,
      priority: 'medium',
    });

    if (requestId) {
      toast({
        title: "Request Submitted!",
        description: `Your request for "${moduleName}" has been logged (ID: ${requestId.slice(0, 8)}). The development team will review it.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit request. Please try again.",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [professionals, employers, statsData, disputes, logs, riskData, settleData, dupData, autoSettings] = await Promise.all([
          getPendingProfessionals(),
          getPendingEmployers(),
          getDashboardStats(),
          getOpenDisputes(),
          getRecentAuditLogs(10),
          getRiskDistribution(),
          getSettlementStats(),
          getDuplicateStats(),
          getAutomationSettings(),
        ]);
        setNewProfessionals(professionals);
        setNewEmployers(employers);
        setStats(statsData);
        setOpenDisputes(disputes);
        setRecentLogs(logs);
        setRiskDistribution(riskData);
        setSettlementStats(settleData);
        setDuplicateStats(dupData);
        setAutomationSettings(autoSettings);
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
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <Home className="h-5 w-5" />
          <span className="hidden sm:inline text-sm">Home</span>
        </Link>
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
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto min-w-full md:grid md:grid-cols-7 md:w-full">
              <TabsTrigger value="overview" className="whitespace-nowrap">Overview</TabsTrigger>
              <TabsTrigger value="employers" asChild className="whitespace-nowrap">
                <Link href="/dashboard/superadmin/employers">Employers</Link>
              </TabsTrigger>
              <TabsTrigger value="professionals" asChild className="whitespace-nowrap">
                <Link href="/dashboard/superadmin/professionals">Professionals</Link>
              </TabsTrigger>
              <TabsTrigger value="stints" asChild className="whitespace-nowrap">
                <Link href="/dashboard/superadmin/stints">Stints</Link>
              </TabsTrigger>
              <TabsTrigger value="finance" asChild className="whitespace-nowrap">
                <Link href="/dashboard/superadmin/finance">Finance</Link>
              </TabsTrigger>
              <TabsTrigger value="promotions" asChild className="whitespace-nowrap">
                <Link href="/dashboard/superadmin/promotions">Promotions</Link>
              </TabsTrigger>
              <TabsTrigger value="audit" asChild className="whitespace-nowrap">
                <Link href="/dashboard/superadmin/audit">Audit</Link>
              </TabsTrigger>
            </TabsList>
          </div>

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

            {/* Enhanced Stats Row */}
            <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
              {/* Risk Overview Card */}
              <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Risk Overview</CardTitle>
                  <AlertOctagon className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">High Risk</span>
                      <Badge variant="destructive" className="text-xs">
                        {riskDistribution.employers.high + riskDistribution.professionals.high}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Medium Risk</span>
                      <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-600">
                        {riskDistribution.employers.medium + riskDistribution.professionals.medium}
                      </Badge>
                    </div>
                    <Progress
                      value={((riskDistribution.employers.high + riskDistribution.professionals.high) / Math.max(stats.totalEmployers + stats.totalProfessionals, 1)) * 100}
                      className="h-1.5 mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Settlement Stats Card */}
              <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Settlements</CardTitle>
                  <Wallet className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    KES {settlementStats.totalPaidOut.toLocaleString()}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {settlementStats.pendingPayouts} pending
                    </Badge>
                    <Badge variant="outline" className="text-xs text-green-600 border-green-500/30">
                      {settlementStats.completedPayouts} done
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Duplicate Alerts Card */}
              <Card className={`${duplicateStats.pendingAlerts > 0 ? 'border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Duplicate Alerts</CardTitle>
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {duplicateStats.pendingAlerts}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {duplicateStats.totalDuplicateAccounts} accounts flagged
                  </p>
                  {duplicateStats.pendingAlerts > 0 && (
                    <Badge variant="destructive" className="mt-2 text-xs">
                      Needs Review
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Automation Status Card */}
              <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Automation</CardTitle>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-4">
                          <div>
                            <div className="font-medium">Manage Automation Modules</div>
                            <p className="text-xs text-muted-foreground">Toggle modules on/off or request new ones</p>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 rounded-lg border">
                              <div>
                                <div className="font-medium text-sm">Risk Scoring</div>
                                <p className="text-xs text-muted-foreground">Auto-flag high-risk accounts</p>
                              </div>
                              <Switch
                                checked={automationSettings.riskScoring}
                                onCheckedChange={(v) => handleAutomationToggle('riskScoring', v)}
                              />
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg border">
                              <div>
                                <div className="font-medium text-sm">Settlement Engine</div>
                                <p className="text-xs text-muted-foreground">Auto-process payouts after 24h</p>
                              </div>
                              <Switch
                                checked={automationSettings.settlementEngine}
                                onCheckedChange={(v) => handleAutomationToggle('settlementEngine', v)}
                              />
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg border">
                              <div>
                                <div className="font-medium text-sm">Duplicate Detection</div>
                                <p className="text-xs text-muted-foreground">Flag duplicate accounts by phone/email</p>
                              </div>
                              <Switch
                                checked={automationSettings.duplicateDetection}
                                onCheckedChange={(v) => handleAutomationToggle('duplicateDetection', v)}
                              />
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg border border-dashed">
                              <div>
                                <div className="font-medium text-sm text-muted-foreground">Auto Unsuspension</div>
                                <p className="text-xs text-muted-foreground">Coming soon</p>
                              </div>
                              <Switch disabled checked={automationSettings.autoUnsuspension} />
                            </div>
                          </div>
                          <div className="pt-2 border-t">
                            <Button variant="outline" size="sm" className="w-full" onClick={handleRequestNewModule}>
                              <Zap className="h-3 w-3 mr-2" />
                              Request New Module
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Zap className="h-4 w-4 text-accent" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span>Risk Scoring Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span>Settlement Engine Ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span>Duplicate Detection On</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader className="flex flex-row items-center">
                  <div className="grid gap-2">
                    <CardTitle>Platform Volume</CardTitle>
                    <CardDescription>
                      Gross transaction volume for selected date range.
                    </CardDescription>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Calendar className="h-4 w-4" />
                          Date Range
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-4">
                          <div className="font-medium">Select Date Range</div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="startDate">From</Label>
                              <Input
                                id="startDate"
                                type="date"
                                value={volumeStartDate.toISOString().split('T')[0]}
                                onChange={(e) => setVolumeStartDate(new Date(e.target.value))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="endDate">To</Label>
                              <Input
                                id="endDate"
                                type="date"
                                value={volumeEndDate.toISOString().split('T')[0]}
                                onChange={(e) => setVolumeEndDate(new Date(e.target.value))}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Showing data from {volumeStartDate.toLocaleDateString()} to {volumeEndDate.toLocaleDateString()}
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button asChild size="sm" className="gap-1">
                      <Link href="/dashboard/superadmin/finance">
                        View All
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <GrossVolumeChart startDate={volumeStartDate} endDate={volumeEndDate} />
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
