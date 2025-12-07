"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/firebase/clientApp';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getEmployerByEmail, getProfessionalByEmail } from '@/lib/firebase/firestore';

export type UserRole = 'employer' | 'professional' | 'superadmin' | null;

interface UserProfile {
    id: string;
    email: string;
    phone?: string; // Phone comes from profile data, not auth
    status: string;
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
    isLoading: boolean;
    error: string | null;
    setUserRole: (role: UserRole) => void;
    setUserProfile: (profile: UserProfile | null) => void;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Listen to auth state changes
    useEffect(() => {
        if (!auth) {
            setIsLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser && firebaseUser.email) {
                // Try to find existing profile by email
                await loadUserProfile(firebaseUser.email);
            } else {
                setUserProfile(null);
                setUserRole(null);
            }

            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loadUserProfile = async (email: string) => {
        try {
            // Check for employer profile first
            const employer = await getEmployerByEmail(email) as any;
            if (employer) {
                setUserProfile({
                    id: employer.id,
                    email,
                    phone: employer.phone,
                    status: employer.status as string,
                    facilityName: employer.facilityName as string,
                    contactPerson: employer.contactPerson as string,
                    city: employer.city as string,
                });
                setUserRole('employer');
                return;
            }

            // Check for professional profile
            const professional = await getProfessionalByEmail(email) as any;
            if (professional) {
                setUserProfile({
                    id: professional.id,
                    email,
                    phone: professional.phone,
                    status: professional.status as string,
                    fullName: professional.fullName as string,
                    primaryRole: professional.primaryRole as string,
                    city: professional.locations as string,
                });
                setUserRole('professional');
                return;
            }

            // No profile found - user needs to onboard
            setUserProfile(null);
            setUserRole(null);
        } catch (err) {
            console.error('Error loading user profile:', err);
            setError('Failed to load user profile');
        }
    };

    const refreshProfile = async () => {
        if (user?.email) {
            await loadUserProfile(user.email);
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
                isLoading,
                error,
                setUserRole,
                setUserProfile,
                logout,
                refreshProfile,
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
