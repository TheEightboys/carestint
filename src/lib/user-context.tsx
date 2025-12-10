"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth } from '@/lib/firebase/clientApp';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import {
    getEmployerByEmail,
    getProfessionalByEmail,
    getSuperadminByEmail,
    getUserAccountByUid,
    createOrUpdateUserAccount,
    switchActiveRole as switchActiveRoleInDb,
    getDualRoleInfo as getDualRoleInfoFromDb,
    getEmployerById,
    getProfessionalById,
} from '@/lib/firebase/firestore';
import type { DualRoleInfo, ActiveRole } from '@/lib/types';

export type UserRole = 'employer' | 'professional' | 'superadmin' | null;

interface UserProfile {
    id: string;
    email: string;
    phone?: string;
    status: string;
    photoURL?: string;
    emailVerified?: boolean;
    // Employer-specific
    facilityName?: string;
    contactPerson?: string;
    // Professional-specific
    fullName?: string;
    primaryRole?: string;
    // Common
    city?: string;
}

interface UserContextType {
    user: User | null;
    userProfile: UserProfile | null;
    userRole: UserRole;
    dualRoleInfo: DualRoleInfo | null;
    isLoading: boolean;
    error: string | null;
    setUserRole: (role: UserRole) => void;
    setUserProfile: (profile: UserProfile | null) => void;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    switchRole: (role: ActiveRole) => Promise<boolean>;
    canAddSecondRole: () => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [dualRoleInfo, setDualRoleInfo] = useState<DualRoleInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load profile for the specified role
    const loadProfileForRole = useCallback(async (
        email: string,
        role: ActiveRole,
        roleInfo: DualRoleInfo
    ) => {
        try {
            if (role === 'employer' && roleInfo.employerId) {
                const employer = await getEmployerById(roleInfo.employerId) as any;
                if (employer) {
                    setUserProfile({
                        id: employer.id,
                        email,
                        phone: employer.phone,
                        status: employer.status as string,
                        photoURL: employer.photoURL as string,
                        facilityName: employer.facilityName as string,
                        contactPerson: employer.contactPerson as string,
                        city: employer.city as string,
                    });
                    setUserRole('employer');
                }
            } else if (role === 'professional' && roleInfo.professionalId) {
                const professional = await getProfessionalById(roleInfo.professionalId) as any;
                if (professional) {
                    setUserProfile({
                        id: professional.id,
                        email,
                        phone: professional.phone,
                        status: professional.status as string,
                        photoURL: professional.photoURL as string,
                        fullName: professional.fullName as string,
                        primaryRole: professional.primaryRole as string,
                        city: professional.locations as string,
                    });
                    setUserRole('professional');
                }
            }
        } catch (err) {
            console.error('Error loading profile for role:', err);
            setError('Failed to load profile');
        }
    }, []);

    // Main profile loading function
    const loadUserProfile = useCallback(async (firebaseUser: User) => {
        const email = firebaseUser.email;
        if (!email) return;

        try {
            // Check for superadmin first (superadmins don't have dual roles)
            const superadmin = await getSuperadminByEmail(email) as any;
            if (superadmin) {
                setUserProfile({
                    id: superadmin.id,
                    email,
                    status: 'active',
                    fullName: 'SuperAdmin',
                });
                setUserRole('superadmin');
                setDualRoleInfo(null);
                return;
            }

            // Check for user account in the new users collection
            let userAccount = await getUserAccountByUid(firebaseUser.uid);

            if (userAccount) {
                // User has a user account - load dual role info
                const roleInfo = await getDualRoleInfoFromDb(firebaseUser.uid);
                if (roleInfo) {
                    setDualRoleInfo(roleInfo);
                    await loadProfileForRole(email, roleInfo.activeRole, roleInfo);
                    return;
                }
            }

            // Legacy: Check by email if no user account exists
            // This handles existing users who registered before the dual role system
            const employer = await getEmployerByEmail(email) as any;
            const professional = await getProfessionalByEmail(email) as any;

            // If user has both profiles in the old system, create a user account
            if (employer && professional) {
                // Create user account for existing dual-role user
                await createOrUpdateUserAccount({
                    uid: firebaseUser.uid,
                    email,
                    phone: employer.phone || professional.phone,
                    employerId: employer.id,
                    professionalId: professional.id,
                    activeRole: 'professional', // Default to professional
                });

                const roleInfo: DualRoleInfo = {
                    hasEmployerRole: true,
                    hasProfessionalRole: true,
                    employerId: employer.id,
                    professionalId: professional.id,
                    employerStatus: employer.status,
                    professionalStatus: professional.status,
                    activeRole: 'professional',
                };
                setDualRoleInfo(roleInfo);
                await loadProfileForRole(email, 'professional', roleInfo);
                return;
            }

            // Single role - employer only
            if (employer) {
                // Create user account for employer
                await createOrUpdateUserAccount({
                    uid: firebaseUser.uid,
                    email,
                    phone: employer.phone,
                    employerId: employer.id,
                    activeRole: 'employer',
                });

                setUserProfile({
                    id: employer.id,
                    email,
                    phone: employer.phone,
                    status: employer.status as string,
                    photoURL: employer.photoURL as string,
                    facilityName: employer.facilityName as string,
                    contactPerson: employer.contactPerson as string,
                    city: employer.city as string,
                });
                setUserRole('employer');
                setDualRoleInfo({
                    hasEmployerRole: true,
                    hasProfessionalRole: false,
                    employerId: employer.id,
                    employerStatus: employer.status,
                    activeRole: 'employer',
                });
                return;
            }

            // Single role - professional only
            if (professional) {
                // Create user account for professional
                await createOrUpdateUserAccount({
                    uid: firebaseUser.uid,
                    email,
                    phone: professional.phone,
                    professionalId: professional.id,
                    activeRole: 'professional',
                });

                setUserProfile({
                    id: professional.id,
                    email,
                    phone: professional.phone,
                    status: professional.status as string,
                    photoURL: professional.photoURL as string,
                    fullName: professional.fullName as string,
                    primaryRole: professional.primaryRole as string,
                    city: professional.locations as string,
                });
                setUserRole('professional');
                setDualRoleInfo({
                    hasEmployerRole: false,
                    hasProfessionalRole: true,
                    professionalId: professional.id,
                    professionalStatus: professional.status,
                    activeRole: 'professional',
                });
                return;
            }

            // No profile found - user needs to onboard
            setUserProfile(null);
            setUserRole(null);
            setDualRoleInfo(null);
        } catch (err) {
            console.error('Error loading user profile:', err);
            setError('Failed to load user profile');
        }
    }, [loadProfileForRole]);

    // Listen to auth state changes
    useEffect(() => {
        if (!auth) {
            setIsLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                await loadUserProfile(firebaseUser);
            } else {
                setUserProfile(null);
                setUserRole(null);
                setDualRoleInfo(null);
            }

            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [loadUserProfile]);

    // Switch between roles
    const switchRole = async (newRole: ActiveRole): Promise<boolean> => {
        if (!user || !dualRoleInfo) return false;

        // Check if user has the role they're trying to switch to
        if (newRole === 'employer' && !dualRoleInfo.hasEmployerRole) {
            setError('You do not have an employer profile');
            return false;
        }
        if (newRole === 'professional' && !dualRoleInfo.hasProfessionalRole) {
            setError('You do not have a professional profile');
            return false;
        }

        // Check if role is active/approved
        if (newRole === 'employer' && dualRoleInfo.employerStatus !== 'active') {
            setError('Your employer profile is not yet active');
            return false;
        }
        if (newRole === 'professional' && dualRoleInfo.professionalStatus !== 'active') {
            setError('Your professional profile is not yet active');
            return false;
        }

        try {
            // Update in database
            const success = await switchActiveRoleInDb(user.uid, newRole);
            if (!success) return false;

            // Update local state
            const newDualRoleInfo = { ...dualRoleInfo, activeRole: newRole };
            setDualRoleInfo(newDualRoleInfo);

            // Load the new profile
            if (user.email) {
                await loadProfileForRole(user.email, newRole, newDualRoleInfo);
            }

            return true;
        } catch (err) {
            console.error('Error switching role:', err);
            setError('Failed to switch role');
            return false;
        }
    };

    // Check if user can add a second role
    const canAddSecondRole = (): boolean => {
        if (!dualRoleInfo) return false;
        return (dualRoleInfo.hasEmployerRole && !dualRoleInfo.hasProfessionalRole) ||
            (!dualRoleInfo.hasEmployerRole && dualRoleInfo.hasProfessionalRole);
    };

    const refreshProfile = async () => {
        if (user) {
            await loadUserProfile(user);
        }
    };

    const logout = async () => {
        try {
            if (auth) {
                await signOut(auth);
            }
            setUser(null);
            setUserProfile(null);
            setUserRole(null);
            setDualRoleInfo(null);
        } catch (err) {
            console.error('Error signing out:', err);
            setError('Failed to sign out');
        }
    };

    return (
        <UserContext.Provider
            value={{
                user,
                userProfile,
                userRole,
                dualRoleInfo,
                isLoading,
                error,
                setUserRole,
                setUserProfile,
                logout,
                refreshProfile,
                switchRole,
                canAddSecondRole,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
