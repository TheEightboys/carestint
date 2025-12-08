"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, LogOut, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { useUser } from '@/lib/user-context';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface DashboardNavProps {
    title?: string;
    showBack?: boolean;
    backHref?: string;
    backLabel?: string;
}

export function DashboardNav({
    title,
    showBack = true,
    backHref,
    backLabel = "Back"
}: DashboardNavProps) {
    const router = useRouter();
    const { user, userProfile, userRole, logout } = useUser();

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const handleBack = () => {
        if (backHref) {
            router.push(backHref);
        } else {
            router.back();
        }
    };

    const getUserInitials = () => {
        if (userProfile?.fullName) {
            return userProfile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        if (userProfile?.facilityName) {
            return userProfile.facilityName.slice(0, 2).toUpperCase();
        }
        if (user?.email) {
            return user.email.slice(0, 2).toUpperCase();
        }
        return 'U';
    };

    const getDashboardUrl = () => {
        switch (userRole) {
            case 'superadmin':
                return '/dashboard/superadmin';
            case 'employer':
                return '/dashboard/employer';
            case 'professional':
                return '/dashboard/professional';
            default:
                return '/';
        }
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
            <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center gap-4">
                    {showBack && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">{backLabel}</span>
                        </Button>
                    )}

                    <Link href={getDashboardUrl()} className="flex items-center gap-2">
                        <Logo className="h-5 w-auto" />
                        {title && (
                            <>
                                <span className="text-muted-foreground">/</span>
                                <span className="font-medium">{title}</span>
                            </>
                        )}
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(getDashboardUrl())}
                        className="gap-2"
                    >
                        <Home className="h-4 w-4" />
                        <span className="hidden sm:inline">Dashboard</span>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                                        {getUserInitials()}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="px-2 py-1.5">
                                <p className="text-sm font-medium">
                                    {userProfile?.fullName || userProfile?.facilityName || 'User'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(getDashboardUrl())}>
                                <Home className="mr-2 h-4 w-4" />
                                Dashboard
                            </DropdownMenuItem>
                            {userRole !== 'superadmin' && (
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/${userRole}/settings`)}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </nav>
    );
}
