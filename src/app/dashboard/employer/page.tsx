
"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Building, LogOut, PlusCircle, Briefcase, User, Wallet, BarChart3, Loader2, Receipt, FileText, Settings, Calculator, MessageCircle, Home } from "lucide-react";
import { RoleSwitcher } from "@/components/role-switcher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostStintForm } from "@/components/dashboard/employer/post-stint-form";
import { TodaysStints } from "@/components/dashboard/employer/todays-stints";
import { FacilityProfile } from "@/components/dashboard/employer/facility-profile";
import { Invoices } from "@/components/dashboard/employer/invoices";
import { EmployerFeeCalculator } from "@/components/dashboard/employer/employer-fee-calculator";
import { Chat } from "@/components/chat/chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getEmployerByEmail, getStintsByEmployer, getPendingApplicationsCount } from "@/lib/firebase/firestore";
import { useUser } from "@/lib/user-context";
import { auth } from "@/lib/firebase/clientApp";
import { signOut } from "firebase/auth";
import Link from "next/link";

interface EmployerData {
    id: string;
    facilityName: string;
    contactPerson: string;
    email: string;
    phone: string;
    city: string;
    operatingDays?: string;
    staffSize?: string;
    licenseNumber?: string;
    licenseExpiryDate?: string;
    billingEmail?: string;
    status: string;
}

export default function EmployerDashboardPage() {
    const { user, isLoading: authLoading } = useUser();
    const [employer, setEmployer] = useState<EmployerData | null>(null);
    const [stats, setStats] = useState({ totalStints: 0, activeStints: 0, completedStints: 0, pendingApplications: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEmployerData = async () => {
            if (authLoading) return;

            // If no user, redirect to home
            if (!user || !user.email) {
                window.location.href = '/';
                return;
            }

            try {
                const employerData = await getEmployerByEmail(user.email) as any;

                // If no employer profile found, user hasn't completed onboarding
                if (!employerData) {
                    window.location.href = `/onboarding/employer?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.displayName || '')}`;
                    return;
                }

                setEmployer(employerData);

                // Load stats including pending applications count
                const [stints, pendingAppsCount] = await Promise.all([
                    getStintsByEmployer(employerData.id),
                    getPendingApplicationsCount(employerData.id),
                ]);

                setStats({
                    totalStints: stints.length,
                    activeStints: stints.filter((s: any) => ['open', 'accepted', 'in_progress'].includes(s.status)).length,
                    completedStints: stints.filter((s: any) => s.status === 'completed').length,
                    pendingApplications: pendingAppsCount,
                });
            } catch (error) {
                console.error('Error loading employer data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadEmployerData();
    }, [user, authLoading]);

    const handleLogout = async () => {
        try {
            if (auth) {
                await signOut(auth);
            }
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Show loading while checking auth and data
    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // If no employer data after loading, show error
    if (!employer) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <p className="text-destructive">Unable to load employer data</p>
                    <Button onClick={() => window.location.href = '/'}>Return Home</Button>
                </div>
            </div>
        );
    }

    const employerId = employer.id;
    const employerName = employer.facilityName;

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6">
                <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Home className="h-5 w-5" />
                    <span className="hidden sm:inline text-sm">Home</span>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="font-headline text-lg font-semibold">{employerName}</h1>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            Employer Dashboard
                            <Badge variant={employer.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                {employer.status}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <RoleSwitcher variant="compact" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${employerName}`} alt={employerName} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {employerName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{employerName}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {employer?.email || user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/employer/settings" className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/employer?tab=profile" className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Facility Profile</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/employer/orders" className="cursor-pointer">
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>Order History</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Sign out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-4 md:gap-6 safe-area-x">
                {/* Stats Cards */}
                <div className="grid gap-3 grid-cols-2 sm:gap-4 md:grid-cols-4">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Stints</CardTitle>
                            <Briefcase className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalStints}</div>
                            <p className="text-xs text-muted-foreground">All time</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Stints</CardTitle>
                            <BarChart3 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeStints}</div>
                            <p className="text-xs text-muted-foreground">Open or in progress</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <Wallet className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.completedStints}</div>
                            <p className="text-xs text-muted-foreground">Successfully filled</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Applications</CardTitle>
                            <FileText className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pendingApplications}</div>
                            <p className="text-xs text-muted-foreground">Pending review</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="overview">
                    <div className="flex items-center overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                        <TabsList className="inline-flex h-auto min-w-max gap-1 p-1 sm:grid sm:w-full sm:grid-cols-5 lg:w-auto">
                            <TabsTrigger value="overview" className="touch-target px-3 py-2.5 text-xs sm:text-sm">
                                <PlusCircle className="mr-1.5 h-4 w-4 sm:mr-2" />
                                <span className="whitespace-nowrap">Post & Manage</span>
                            </TabsTrigger>
                            <TabsTrigger value="messages" className="touch-target px-3 py-2.5 text-xs sm:text-sm">
                                <MessageCircle className="mr-1.5 h-4 w-4 sm:mr-2" />
                                <span className="whitespace-nowrap">Messages</span>
                            </TabsTrigger>
                            <TabsTrigger value="calculator" className="touch-target px-3 py-2.5 text-xs sm:text-sm">
                                <Calculator className="mr-1.5 h-4 w-4 sm:mr-2" />
                                <span className="whitespace-nowrap">Calculator</span>
                            </TabsTrigger>
                            <TabsTrigger value="invoices" className="touch-target px-3 py-2.5 text-xs sm:text-sm">
                                <Receipt className="mr-1.5 h-4 w-4 sm:mr-2" />
                                <span className="whitespace-nowrap">Invoices</span>
                            </TabsTrigger>
                            <TabsTrigger value="profile" className="touch-target px-3 py-2.5 text-xs sm:text-sm">
                                <User className="mr-1.5 h-4 w-4 sm:mr-2" />
                                <span className="whitespace-nowrap">Profile</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                            <div className="lg:col-span-4">
                                <PostStintForm employerId={employerId} employerName={employerName} />
                            </div>
                            <div className="lg:col-span-3">
                                <TodaysStints employerId={employerId} />
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="messages" className="space-y-4">
                        <Chat userId={employerId} userName={employerName} userType="employer" />
                    </TabsContent>
                    <TabsContent value="calculator" className="space-y-4">
                        <div className="max-w-2xl mx-auto">
                            <EmployerFeeCalculator />
                        </div>
                    </TabsContent>
                    <TabsContent value="invoices" className="space-y-4">
                        <Invoices employerId={employerId} />
                    </TabsContent>
                    <TabsContent value="profile" className="space-y-4">
                        <FacilityProfile employer={employer} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

