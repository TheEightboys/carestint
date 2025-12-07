
"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Building, LogOut, PlusCircle, Briefcase, User, Wallet, BarChart3, Loader2, Receipt, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostStintForm } from "@/components/dashboard/employer/post-stint-form";
import { TodaysStints } from "@/components/dashboard/employer/todays-stints";
import { FacilityProfile } from "@/components/dashboard/employer/facility-profile";
import { Invoices } from "@/components/dashboard/employer/invoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEmployerByEmail, getStintsByEmployer } from "@/lib/firebase/firestore";
import { useUser } from "@/lib/user-context";
import { auth } from "@/lib/firebase/clientApp";
import { signOut } from "firebase/auth";

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

                // Load stats
                const stints = await getStintsByEmployer(employerData.id);
                setStats({
                    totalStints: stints.length,
                    activeStints: stints.filter((s: any) => ['open', 'accepted', 'in_progress'].includes(s.status)).length,
                    completedStints: stints.filter((s: any) => s.status === 'completed').length,
                    pendingApplications: 0, // Would be loaded from applications
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
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-4 md:gap-6">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
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
                    <div className="flex items-center overflow-x-auto">
                        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
                            <TabsTrigger value="overview">
                                <PlusCircle className="mr-2 h-4 w-4 hidden sm:block" />
                                Post & Manage
                            </TabsTrigger>
                            <TabsTrigger value="invoices">
                                <Receipt className="mr-2 h-4 w-4 hidden sm:block" />
                                Invoices
                            </TabsTrigger>
                            <TabsTrigger value="profile">
                                <User className="mr-2 h-4 w-4 hidden sm:block" />
                                Profile
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

