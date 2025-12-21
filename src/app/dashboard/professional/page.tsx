
"use client"

import { useState, useEffect } from "react";
import { Stethoscope, LogOut, Briefcase, FileText, User, Timer, Wallet, Star, TrendingUp, Loader2, Calendar, Settings, Calculator, MessageCircle, Home, ArrowLeft } from "lucide-react";
import { RoleSwitcher } from "@/components/role-switcher";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvailableStints } from "@/components/dashboard/professional/available-stints";
import { MyApplications } from "@/components/dashboard/professional/my-applications";
import { ProfessionalProfile } from "@/components/dashboard/professional/professional-profile";
import { ActiveStint } from "@/components/dashboard/professional/active-stint";
import { EarningsHistory } from "@/components/dashboard/professional/earnings-history";
import { AvailabilityCalendar } from "@/components/dashboard/professional/availability-calendar";
import { ProfessionalFeeCalculator } from "@/components/dashboard/professional/professional-fee-calculator";
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
import { getProfessionalByEmail, getApplicationsByProfessional, getStintsByProfessional } from "@/lib/firebase/firestore";
import { useUser } from "@/lib/user-context";
import { auth } from "@/lib/firebase/clientApp";
import { signOut } from "firebase/auth";
import Link from "next/link";

interface ProfessionalData {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    primaryRole?: string;
    locations?: string;
    licenseNumber?: string;
    licenseExpiryDate?: string;
    experience?: string;
    averageRating?: number;
    completedStints?: number;
    status: string;
    issuingBody?: string;
}

export default function ProfessionalDashboardPage() {
    const { user, isLoading: authLoading } = useUser();
    const [professional, setProfessional] = useState<ProfessionalData | null>(null);
    const [stats, setStats] = useState({
        applications: 0,
        accepted: 0,
        pending: 0,
        completedStints: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfessionalData = async () => {
            if (authLoading) return;

            // If no user, redirect to home
            if (!user || !user.email) {
                window.location.href = '/';
                return;
            }

            try {
                const proData = await getProfessionalByEmail(user.email) as any;

                // If no professional profile found, user hasn't completed onboarding
                if (!proData) {
                    window.location.href = `/onboarding/professional?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.displayName || '')}`;
                    return;
                }

                setProfessional(proData);

                // Load application stats AND actual stint data for consistency
                const [applications, stints] = await Promise.all([
                    getApplicationsByProfessional(proData.id),
                    getStintsByProfessional(proData.id)
                ]);

                // Count completed stints from actual stint data (status: completed OR closed)
                const completedStintCount = stints.filter((s: any) =>
                    s.status === 'completed' || s.status === 'closed'
                ).length;

                setStats({
                    applications: applications.length,
                    accepted: applications.filter((a: any) => a.status === 'accepted').length,
                    pending: applications.filter((a: any) => a.status === 'pending').length,
                    completedStints: completedStintCount, // Use actual stint data, not profile field
                });
            } catch (error) {
                console.error('Error loading professional data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProfessionalData();
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
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-accent" />
                    <p className="text-muted-foreground">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // If no professional data after loading, show error
    if (!professional) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <p className="text-destructive">Unable to load professional data</p>
                    <Button onClick={() => window.location.href = '/'}>Return Home</Button>
                </div>
            </div>
        );
    }

    const professionalId = professional.id;
    const professionalName = professional.fullName;
    const professionalRole = professional.primaryRole || 'rn';

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Home className="h-5 w-5" />
                        <span className="hidden sm:inline text-sm">Home</span>
                    </Link>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                        <Stethoscope className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                        <h1 className="font-headline text-lg font-semibold">{professionalName}</h1>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="capitalize">{professionalRole?.replace('-', ' ')}</span>
                            <Badge variant={professional.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                {professional.status}
                            </Badge>
                            {professional.averageRating && professional.averageRating > 0 && (
                                <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    {professional.averageRating.toFixed(1)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <RoleSwitcher variant="compact" showAddRole={false} />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${professionalName}`} alt={professionalName} />
                                    <AvatarFallback className="bg-accent/10 text-accent">
                                        {professionalName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{professionalName}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {professional?.email || user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/professional/settings" className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/professional?tab=profile" className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/professional/earnings" className="cursor-pointer">
                                    <Wallet className="mr-2 h-4 w-4" />
                                    <span>Earnings & Payouts</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/professional/orders" className="cursor-pointer">
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>Work History</span>
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
            <main className="flex flex-1 flex-col gap-3 p-4 sm:px-6 sm:py-4 sm:gap-4 md:gap-6 safe-area-x">
                {/* Stats Cards */}
                <div className="grid gap-3 grid-cols-2 sm:gap-4 md:grid-cols-4">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Applications</CardTitle>
                            <FileText className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.applications}</div>
                            <p className="text-xs text-muted-foreground">Total sent</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.accepted}</div>
                            <p className="text-xs text-muted-foreground">Confirmed stints</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Timer className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pending}</div>
                            <p className="text-xs text-muted-foreground">Awaiting response</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <Wallet className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.completedStints}</div>
                            <p className="text-xs text-muted-foreground">Stints worked</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="active-stint">
                    <div className="flex items-center overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
                        <TabsList className="inline-flex h-auto min-w-max gap-1 p-1 sm:grid sm:w-full sm:grid-cols-8 lg:w-auto">
                            <TabsTrigger value="active-stint" className="touch-target px-3 py-2 text-xs sm:text-sm">
                                <Timer className="mr-1.5 h-4 w-4" />
                                <span className="whitespace-nowrap">Active</span>
                            </TabsTrigger>
                            <TabsTrigger value="find-stints" className="touch-target px-3 py-2 text-xs sm:text-sm">
                                <Briefcase className="mr-1.5 h-4 w-4" />
                                <span className="whitespace-nowrap">Find</span>
                            </TabsTrigger>
                            <TabsTrigger value="applications" className="touch-target px-3 py-2 text-xs sm:text-sm">
                                <FileText className="mr-1.5 h-4 w-4" />
                                <span className="whitespace-nowrap">Applied</span>
                            </TabsTrigger>
                            <TabsTrigger value="calculator" className="touch-target px-3 py-2 text-xs sm:text-sm">
                                <Calculator className="mr-1.5 h-4 w-4" />
                                <span className="whitespace-nowrap">Calc</span>
                            </TabsTrigger>
                            <TabsTrigger value="earnings" className="touch-target px-3 py-2 text-xs sm:text-sm">
                                <Wallet className="mr-1.5 h-4 w-4" />
                                <span className="whitespace-nowrap">Earnings</span>
                            </TabsTrigger>
                            <TabsTrigger value="availability" className="touch-target px-3 py-2 text-xs sm:text-sm">
                                <Calendar className="mr-1.5 h-4 w-4" />
                                <span className="whitespace-nowrap">Avail</span>
                            </TabsTrigger>
                            <TabsTrigger value="messages" className="touch-target px-3 py-2 text-xs sm:text-sm">
                                <MessageCircle className="mr-1.5 h-4 w-4" />
                                <span className="whitespace-nowrap">Msgs</span>
                            </TabsTrigger>
                            <TabsTrigger value="profile" className="touch-target px-3 py-2 text-xs sm:text-sm">
                                <User className="mr-1.5 h-4 w-4" />
                                <span className="whitespace-nowrap">Profile</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="active-stint" className="space-y-4">
                        <ActiveStint professionalId={professionalId} />
                    </TabsContent>
                    <TabsContent value="find-stints" className="space-y-4">
                        <AvailableStints
                            professionalId={professionalId}
                            professionalName={professionalName}
                            professionalRole={professionalRole}
                            professionalIssuingBody={professional.issuingBody}
                            professionalPreferredLocation={professional.locations}
                        />
                    </TabsContent>
                    <TabsContent value="applications" className="space-y-4">
                        <MyApplications professionalId={professionalId} />
                    </TabsContent>
                    <TabsContent value="calculator" className="space-y-4">
                        <div className="max-w-2xl mx-auto">
                            <ProfessionalFeeCalculator />
                        </div>
                    </TabsContent>
                    <TabsContent value="earnings" className="space-y-4">
                        <EarningsHistory professionalId={professionalId} />
                    </TabsContent>
                    <TabsContent value="availability" className="space-y-4">
                        <AvailabilityCalendar professionalId={professionalId} />
                    </TabsContent>
                    <TabsContent value="messages" className="space-y-4">
                        <Chat userId={professionalId} userName={professionalName} userType="professional" />
                    </TabsContent>
                    <TabsContent value="profile" className="space-y-4">
                        <ProfessionalProfile professional={professional} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

