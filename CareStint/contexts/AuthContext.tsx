import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User, Employer, Professional, DualRoleInfo, ActiveRole, UserStatus } from '../types';

interface AuthContextType {
    user: FirebaseUser | null;
    userData: User | null;
    employerData: Employer | null;
    professionalData: Professional | null;
    dualRoleInfo: DualRoleInfo | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    role: ActiveRole | 'admin' | null;
    logout: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, role: 'employer' | 'professional') => Promise<FirebaseUser>;
    refreshUserData: () => Promise<void>;
    switchRole: (newRole: ActiveRole) => Promise<boolean>;
    canAddSecondRole: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    employerData: null,
    professionalData: null,
    dualRoleInfo: null,
    isLoading: true,
    isAuthenticated: false,
    role: null,
    logout: async () => { },
    signIn: async () => { },
    signUp: async () => { throw new Error('Not implemented'); },
    refreshUserData: async () => { },
    switchRole: async () => false,
    canAddSecondRole: () => false,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [employerData, setEmployerData] = useState<Employer | null>(null);
    const [professionalData, setProfessionalData] = useState<Professional | null>(null);
    const [dualRoleInfo, setDualRoleInfo] = useState<DualRoleInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const unsubscribeFnsRef = useRef<(() => void)[]>([]);

    const cleanupSubscriptions = () => {
        unsubscribeFnsRef.current.forEach(unsub => {
            try {
                unsub();
            } catch (e) {
                console.warn('Error unsubscribing:', e);
            }
        });
        unsubscribeFnsRef.current = [];
    };

    // Load profile for a specific role
    const loadProfileForRole = useCallback(async (roleType: ActiveRole, roleId: string) => {
        if (roleType === 'employer') {
            const employerDocRef = doc(db, 'employers', roleId);
            const unsubEmployer = onSnapshot(employerDocRef, (docSnapshot) => {
                if (docSnapshot.exists()) {
                    setEmployerData({ ...docSnapshot.data(), id: docSnapshot.id } as Employer);
                } else {
                    setEmployerData(null);
                }
            }, (error) => {
                console.error('Employer subscription error:', error);
            });
            unsubscribeFnsRef.current.push(unsubEmployer);
        } else if (roleType === 'professional') {
            const proDocRef = doc(db, 'professionals', roleId);
            const unsubPro = onSnapshot(proDocRef, (docSnapshot) => {
                if (docSnapshot.exists()) {
                    setProfessionalData({ ...docSnapshot.data(), id: docSnapshot.id } as Professional);
                } else {
                    setProfessionalData(null);
                }
            }, (error) => {
                console.error('Professional subscription error:', error);
            });
            unsubscribeFnsRef.current.push(unsubPro);
        }
    }, []);

    // Find existing profiles by email (for web-registered users)
    const findExistingProfilesByEmail = async (email: string): Promise<{
        employerId?: string;
        professionalId?: string;
        employerStatus?: UserStatus;
        professionalStatus?: UserStatus;
    }> => {
        const result: any = {};

        try {
            // Check for existing employer profile by email
            const employersRef = collection(db, 'employers');
            const empQuery = query(employersRef, where('email', '==', email), limit(1));
            const empSnapshot = await getDocs(empQuery);
            if (!empSnapshot.empty) {
                const empDoc = empSnapshot.docs[0];
                result.employerId = empDoc.id;
                result.employerStatus = empDoc.data()?.status as UserStatus;
            }

            // Check for existing professional profile by email
            const professionalsRef = collection(db, 'professionals');
            const proQuery = query(professionalsRef, where('email', '==', email), limit(1));
            const proSnapshot = await getDocs(proQuery);
            if (!proSnapshot.empty) {
                const proDoc = proSnapshot.docs[0];
                result.professionalId = proDoc.id;
                result.professionalStatus = proDoc.data()?.status as UserStatus;
            }
        } catch (error) {
            console.error('Error finding profiles by email:', error);
        }

        return result;
    };

    // Create or update user document to link profiles
    const ensureUserDocument = async (firebaseUser: FirebaseUser, existingProfiles: any) => {
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        // Determine the active role
        let activeRole: ActiveRole = 'professional';
        if (existingProfiles.employerId && !existingProfiles.professionalId) {
            activeRole = 'employer';
        } else if (existingProfiles.professionalId) {
            activeRole = 'professional';
        } else if (existingProfiles.employerId) {
            activeRole = 'employer';
        }

        // Create or update user document
        await setDoc(userDocRef, {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            phone: firebaseUser.phoneNumber || '',
            role: activeRole,
            activeRole: activeRole,
            employerId: existingProfiles.employerId || null,
            professionalId: existingProfiles.professionalId || null,
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }, { merge: true });

        return {
            ...existingProfiles,
            activeRole,
        };
    };

    const fetchUserData = useCallback(async (firebaseUser: FirebaseUser) => {
        try {
            cleanupSubscriptions();

            const userDocRef = doc(db, 'users', firebaseUser.uid);
            let userDoc = await getDoc(userDocRef);

            let data: User | null = null;

            if (userDoc.exists()) {
                data = { ...userDoc.data(), id: userDoc.id } as User;

                // Check if we have linked profiles, if not, try to find them by email
                if (!data.employerId && !data.professionalId && firebaseUser.email) {
                    const existingProfiles = await findExistingProfilesByEmail(firebaseUser.email);
                    if (existingProfiles.employerId || existingProfiles.professionalId) {
                        // Update user document with found profiles
                        await ensureUserDocument(firebaseUser, existingProfiles);
                        // Refetch updated user document
                        userDoc = await getDoc(userDocRef);
                        data = { ...userDoc.data(), id: userDoc.id } as User;
                    }
                }
            } else {
                // User document doesn't exist - check for existing profiles by email
                if (firebaseUser.email) {
                    const existingProfiles = await findExistingProfilesByEmail(firebaseUser.email);

                    if (existingProfiles.employerId || existingProfiles.professionalId) {
                        // Create user document with linked profiles
                        await ensureUserDocument(firebaseUser, existingProfiles);
                        // Fetch the newly created user document
                        userDoc = await getDoc(userDocRef);
                        data = userDoc.exists() ? { ...userDoc.data(), id: userDoc.id } as User : null;
                    }
                }
            }

            if (data) {
                setUserData(data);

                // Build dual role info
                const dualInfo: DualRoleInfo = {
                    hasEmployerRole: !!data.employerId,
                    hasProfessionalRole: !!data.professionalId,
                    employerId: data.employerId,
                    professionalId: data.professionalId,
                    activeRole: data.activeRole || data.role as ActiveRole,
                };

                // Get statuses if not already available
                if (data.employerId && !dualInfo.employerStatus) {
                    const empDoc = await getDoc(doc(db, 'employers', data.employerId));
                    if (empDoc.exists()) {
                        dualInfo.employerStatus = empDoc.data()?.status as UserStatus;
                    }
                }
                if (data.professionalId && !dualInfo.professionalStatus) {
                    const proDoc = await getDoc(doc(db, 'professionals', data.professionalId));
                    if (proDoc.exists()) {
                        dualInfo.professionalStatus = proDoc.data()?.status as UserStatus;
                    }
                }

                setDualRoleInfo(dualInfo);

                // Setup real-time subscription for the active role's data
                const activeRole = data.activeRole || data.role;
                if (activeRole === 'employer' && data.employerId) {
                    await loadProfileForRole('employer', data.employerId);
                } else if (activeRole === 'professional' && data.professionalId) {
                    await loadProfileForRole('professional', data.professionalId);
                }
            } else {
                // New user - needs onboarding
                console.log('No existing profile found, user needs onboarding');
                setUserData(null);
                setDualRoleInfo(null);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }, [loadProfileForRole]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                await fetchUserData(firebaseUser);
            } else {
                cleanupSubscriptions();
                setUserData(null);
                setEmployerData(null);
                setProfessionalData(null);
                setDualRoleInfo(null);
            }

            setIsLoading(false);
        });

        return () => {
            unsubscribeAuth();
            cleanupSubscriptions();
        };
    }, [fetchUserData]);

    const logout = async () => {
        try {
            cleanupSubscriptions();
            await signOut(auth);
            setUser(null);
            setUserData(null);
            setEmployerData(null);
            setProfessionalData(null);
            setDualRoleInfo(null);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signUp = async (email: string, password: string, role: 'employer' | 'professional'): Promise<FirebaseUser> => {
        try {
            setIsLoading(true);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Create user document with dual role support
            const userDocRef = doc(db, 'users', userCredential.user.uid);
            await setDoc(userDocRef, {
                id: userCredential.user.uid,
                email: email,
                phone: '',
                role: role,
                activeRole: role,
                employerId: null,
                professionalId: null,
                status: 'pending_validation',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            return userCredential.user;
        } catch (error) {
            console.error('Sign up error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const switchRole = async (newRole: ActiveRole): Promise<boolean> => {
        if (!user || !userData || !dualRoleInfo) return false;

        if (newRole === 'employer' && !dualRoleInfo.hasEmployerRole) {
            console.error('User does not have an employer profile');
            return false;
        }
        if (newRole === 'professional' && !dualRoleInfo.hasProfessionalRole) {
            console.error('User does not have a professional profile');
            return false;
        }

        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                activeRole: newRole,
                updatedAt: serverTimestamp(),
            });

            setUserData(prev => prev ? { ...prev, activeRole: newRole } : null);
            setDualRoleInfo(prev => prev ? { ...prev, activeRole: newRole } : null);

            cleanupSubscriptions();
            if (newRole === 'employer' && dualRoleInfo.employerId) {
                await loadProfileForRole('employer', dualRoleInfo.employerId);
            } else if (newRole === 'professional' && dualRoleInfo.professionalId) {
                await loadProfileForRole('professional', dualRoleInfo.professionalId);
            }

            return true;
        } catch (error) {
            console.error('Error switching role:', error);
            return false;
        }
    };

    const canAddSecondRole = (): boolean => {
        if (!dualRoleInfo) return false;
        return (dualRoleInfo.hasEmployerRole && !dualRoleInfo.hasProfessionalRole) ||
            (!dualRoleInfo.hasEmployerRole && dualRoleInfo.hasProfessionalRole);
    };

    const refreshUserData = async () => {
        if (user) {
            await fetchUserData(user);
        }
    };

    const value: AuthContextType = {
        user,
        userData,
        employerData,
        professionalData,
        dualRoleInfo,
        isLoading,
        isAuthenticated: !!user && (!!userData || !!employerData || !!professionalData),
        role: userData?.activeRole || userData?.role || null,
        logout,
        signIn,
        signUp,
        refreshUserData,
        switchRole,
        canAddSecondRole,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
