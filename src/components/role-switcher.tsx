"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/user-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Building,
    Stethoscope,
    ArrowLeftRight,
    ChevronDown,
    Plus,
    Loader2,
    CheckCircle2,
    Clock,
    AlertCircle,
} from 'lucide-react';
import type { ActiveRole } from '@/lib/types';

interface RoleSwitcherProps {
    variant?: 'header' | 'sidebar' | 'compact';
    showAddRole?: boolean;
}

export function RoleSwitcher({ variant = 'header', showAddRole = true }: RoleSwitcherProps) {
    const router = useRouter();
    const { userRole, dualRoleInfo, switchRole, canAddSecondRole, isLoading } = useUser();
    const [isSwitching, setIsSwitching] = React.useState(false);

    // Don't show for superadmins or if no dual role info
    if (userRole === 'superadmin' || !dualRoleInfo) {
        return null;
    }

    const hasBothRoles = dualRoleInfo.hasEmployerRole && dualRoleInfo.hasProfessionalRole;
    const currentRole = dualRoleInfo.activeRole;
    const otherRole: ActiveRole = currentRole === 'employer' ? 'professional' : 'employer';

    const handleSwitchRole = async () => {
        if (!hasBothRoles) return;

        setIsSwitching(true);
        try {
            const success = await switchRole(otherRole);
            if (success) {
                // Navigate to the appropriate dashboard
                const newDashboard = otherRole === 'employer'
                    ? '/dashboard/employer'
                    : '/dashboard/professional';
                router.push(newDashboard);
            }
        } catch (error) {
            console.error('Error switching role:', error);
        } finally {
            setIsSwitching(false);
        }
    };

    const handleAddRole = () => {
        const roleToAdd = dualRoleInfo.hasEmployerRole ? 'professional' : 'employer';
        router.push(`/onboarding/${roleToAdd}?addRole=true`);
    };

    const getStatusBadge = (status?: string) => {
        if (!status) return null;

        switch (status) {
            case 'active':
                return (
                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                    </Badge>
                );
            case 'pending_validation':
            case 'needs_manual_review':
                return (
                    <Badge variant="outline" className="text-amber-600 border-amber-600 text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                    </Badge>
                );
            case 'suspended':
            case 'rejected':
                return (
                    <Badge variant="outline" className="text-red-600 border-red-600 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {status === 'suspended' ? 'Suspended' : 'Rejected'}
                    </Badge>
                );
            default:
                return null;
        }
    };

    const getRoleIcon = (role: ActiveRole) => {
        return role === 'employer'
            ? <Building className="h-4 w-4" />
            : <Stethoscope className="h-4 w-4" />;
    };

    const getRoleLabel = (role: ActiveRole) => {
        return role === 'employer' ? 'Employer' : 'Professional';
    };

    // Compact variant - just a button
    if (variant === 'compact') {
        if (!hasBothRoles) {
            if (canAddSecondRole() && showAddRole) {
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddRole}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add {dualRoleInfo.hasEmployerRole ? 'Professional' : 'Employer'} Role
                    </Button>
                );
            }
            return null;
        }

        return (
            <Button
                variant="outline"
                size="sm"
                onClick={handleSwitchRole}
                disabled={isSwitching}
                className="gap-2"
            >
                {isSwitching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <ArrowLeftRight className="h-4 w-4" />
                )}
                Switch to {getRoleLabel(otherRole)}
            </Button>
        );
    }

    // Header/Sidebar variant - dropdown menu
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    {getRoleIcon(currentRole)}
                    <span className="hidden sm:inline">{getRoleLabel(currentRole)} Mode</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                {/* Current Role */}
                <div className="px-2 py-2">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                            {getRoleIcon(currentRole)}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">{getRoleLabel(currentRole)} Mode</p>
                            <p className="text-xs text-muted-foreground">Currently active</p>
                        </div>
                        {getStatusBadge(
                            currentRole === 'employer'
                                ? dualRoleInfo.employerStatus
                                : dualRoleInfo.professionalStatus
                        )}
                    </div>
                </div>

                <DropdownMenuSeparator />

                {/* Other Role / Add Role */}
                {hasBothRoles ? (
                    <DropdownMenuItem
                        onClick={handleSwitchRole}
                        disabled={isSwitching}
                        className="cursor-pointer"
                    >
                        <div className="flex items-center gap-2 py-1 w-full">
                            {isSwitching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                                    {getRoleIcon(otherRole)}
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="text-sm font-medium">Switch to {getRoleLabel(otherRole)}</p>
                                <p className="text-xs text-muted-foreground">
                                    {otherRole === 'employer' ? 'Post and manage stints' : 'Find and apply for stints'}
                                </p>
                            </div>
                            {getStatusBadge(
                                otherRole === 'employer'
                                    ? dualRoleInfo.employerStatus
                                    : dualRoleInfo.professionalStatus
                            )}
                        </div>
                    </DropdownMenuItem>
                ) : showAddRole && canAddSecondRole() ? (
                    <DropdownMenuItem
                        onClick={handleAddRole}
                        className="cursor-pointer"
                    >
                        <div className="flex items-center gap-2 py-1 w-full">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted border-2 border-dashed border-muted-foreground/30">
                                <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    Become a {dualRoleInfo.hasEmployerRole ? 'Professional' : 'Employer'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {dualRoleInfo.hasEmployerRole
                                        ? 'Start finding and applying for stints'
                                        : 'Start posting stints for your facility'}
                                </p>
                            </div>
                        </div>
                    </DropdownMenuItem>
                ) : null}

                {hasBothRoles && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-2">
                            <p className="text-xs text-muted-foreground text-center">
                                💡 Tip: You can switch roles anytime from here
                            </p>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default RoleSwitcher;
