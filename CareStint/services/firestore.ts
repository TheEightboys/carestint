/**
 * CareStint Mobile - Firestore Service
 * Comprehensive data layer with real-time sync matching web app functionality
 * Optimized queries to work without requiring custom indexes
 */

import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
    User,
    Employer,
    Professional,
    Stint,
    StintApplication,
    Dispute,
    Payout,
    Invoice,
    Notification,
    AuditLog,
    StintStatus,
    UserStatus,
} from '../types';

// =============================================
// HELPER FUNCTIONS
// =============================================

const convertTimestamp = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
};

const formatDocument = <T>(doc: any): T => {
    const data = doc.data();
    return {
        ...data,
        id: doc.id,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        shiftDate: data.shiftDate ? convertTimestamp(data.shiftDate) : undefined,
        appliedAt: data.appliedAt ? convertTimestamp(data.appliedAt) : undefined,
        completedAt: data.completedAt ? convertTimestamp(data.completedAt) : undefined,
    } as T;
};

// Sort helper - sort by createdAt descending
const sortByCreatedAtDesc = <T extends { createdAt?: Date }>(items: T[]): T[] => {
    return items.sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
    });
};

// =============================================
// USER SERVICES
// =============================================

export const getUserById = async (userId: string): Promise<User | null> => {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return formatDocument<User>(docSnap);
        }
        return null;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
};

export const createUser = async (userId: string, userData: Partial<User>): Promise<void> => {
    try {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, {
            ...userData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

// Get user by email to check registered role
export const getUserByEmail = async (email: string): Promise<User | null> => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return formatDocument<User>(snapshot.docs[0]);
        }
        return null;
    } catch (error) {
        console.error('Error getting user by email:', error);
        return null;
    }
};

// =============================================
// EMPLOYER SERVICES
// =============================================

export const addEmployer = async (employerData: Partial<Employer>): Promise<string> => {
    try {
        const employersRef = collection(db, 'employers');
        const docRef = await addDoc(employersRef, {
            ...employerData,
            status: 'pending_validation',
            riskScore: 0,
            riskLabel: 'Low',
            stintsCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding employer:', error);
        throw error;
    }
};

export const getEmployerById = async (employerId: string): Promise<Employer | null> => {
    try {
        const docRef = doc(db, 'employers', employerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return formatDocument<Employer>(docSnap);
        }
        return null;
    } catch (error) {
        console.error('Error getting employer:', error);
        return null;
    }
};

export const getEmployerByEmail = async (email: string): Promise<Employer | null> => {
    try {
        const employersRef = collection(db, 'employers');
        const q = query(employersRef, where('email', '==', email), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return formatDocument<Employer>(snapshot.docs[0]);
        }
        return null;
    } catch (error) {
        console.error('Error getting employer by email:', error);
        return null;
    }
};

export const getAllEmployers = async (): Promise<Employer[]> => {
    try {
        const employersRef = collection(db, 'employers');
        const snapshot = await getDocs(employersRef);
        const employers = snapshot.docs.map(doc => formatDocument<Employer>(doc));
        return sortByCreatedAtDesc(employers);
    } catch (error) {
        console.error('Error getting employers:', error);
        return [];
    }
};

export const getPendingEmployers = async (): Promise<Employer[]> => {
    try {
        const employersRef = collection(db, 'employers');
        const q = query(employersRef, where('status', '==', 'pending_validation'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => formatDocument<Employer>(doc));
    } catch (error) {
        console.error('Error getting pending employers:', error);
        return [];
    }
};

export const updateEmployerStatus = async (
    employerId: string,
    status: UserStatus
): Promise<void> => {
    try {
        const docRef = doc(db, 'employers', employerId);
        await updateDoc(docRef, {
            status,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating employer status:', error);
        throw error;
    }
};

export const updateEmployer = async (
    employerId: string,
    data: Partial<Employer>
): Promise<void> => {
    try {
        const docRef = doc(db, 'employers', employerId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating employer:', error);
        throw error;
    }
};

// Real-time employer listener
export const subscribeToEmployer = (
    employerId: string,
    callback: (employer: Employer | null) => void
): Unsubscribe => {
    const docRef = doc(db, 'employers', employerId);
    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            callback(formatDocument<Employer>(doc));
        } else {
            callback(null);
        }
    }, (error) => {
        console.error('Error in employer subscription:', error);
        callback(null);
    });
};

// =============================================
// PROFESSIONAL SERVICES
// =============================================

export const addProfessional = async (professionalData: Partial<Professional>): Promise<string> => {
    try {
        const professionalsRef = collection(db, 'professionals');
        const docRef = await addDoc(professionalsRef, {
            ...professionalData,
            status: 'pending_validation',
            riskScore: 0,
            riskLabel: 'Low',
            averageRating: 0,
            totalStints: 0,
            noShowCount: 0,
            isTopProfessional: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding professional:', error);
        throw error;
    }
};

export const getProfessionalById = async (professionalId: string): Promise<Professional | null> => {
    try {
        const docRef = doc(db, 'professionals', professionalId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return formatDocument<Professional>(docSnap);
        }
        return null;
    } catch (error) {
        console.error('Error getting professional:', error);
        return null;
    }
};

export const getProfessionalByEmail = async (email: string): Promise<Professional | null> => {
    try {
        const professionalsRef = collection(db, 'professionals');
        const q = query(professionalsRef, where('email', '==', email), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return formatDocument<Professional>(snapshot.docs[0]);
        }
        return null;
    } catch (error) {
        console.error('Error getting professional by email:', error);
        return null;
    }
};

export const getAllProfessionals = async (): Promise<Professional[]> => {
    try {
        const professionalsRef = collection(db, 'professionals');
        const snapshot = await getDocs(professionalsRef);
        const professionals = snapshot.docs.map(doc => formatDocument<Professional>(doc));
        return sortByCreatedAtDesc(professionals);
    } catch (error) {
        console.error('Error getting professionals:', error);
        return [];
    }
};

export const getPendingProfessionals = async (): Promise<Professional[]> => {
    try {
        const professionalsRef = collection(db, 'professionals');
        const q = query(professionalsRef, where('status', '==', 'pending_validation'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => formatDocument<Professional>(doc));
    } catch (error) {
        console.error('Error getting pending professionals:', error);
        return [];
    }
};

export const updateProfessionalStatus = async (
    professionalId: string,
    status: UserStatus
): Promise<void> => {
    try {
        const docRef = doc(db, 'professionals', professionalId);
        await updateDoc(docRef, {
            status,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating professional status:', error);
        throw error;
    }
};

export const updateProfessional = async (
    professionalId: string,
    data: Partial<Professional>
): Promise<void> => {
    try {
        const docRef = doc(db, 'professionals', professionalId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating professional:', error);
        throw error;
    }
};

// Real-time professional listener
export const subscribeToProfessional = (
    professionalId: string,
    callback: (professional: Professional | null) => void
): Unsubscribe => {
    const docRef = doc(db, 'professionals', professionalId);
    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            callback(formatDocument<Professional>(doc));
        } else {
            callback(null);
        }
    }, (error) => {
        console.error('Error in professional subscription:', error);
        callback(null);
    });
};

// =============================================
// STINT SERVICES
// =============================================

export const addStint = async (stintData: {
    employerId: string;
    employerName: string;
    profession: string;
    shiftType: 'half_day' | 'full_day';
    shiftDate: Date;
    startTime?: string;
    endTime?: string;
    offeredRate: number;
    currency: string;
    city: string;
    country: string;
    allowBids: boolean;
    isUrgent: boolean;
    description?: string;
}): Promise<string> => {
    try {
        const bookingFeeRate = stintData.isUrgent ? 0.20 : 0.15;
        const bookingFee = stintData.offeredRate * bookingFeeRate;

        const stintsRef = collection(db, 'stints');
        const docRef = await addDoc(stintsRef, {
            ...stintData,
            shiftDate: Timestamp.fromDate(stintData.shiftDate),
            bookingFee,
            status: 'open',
            readyForSettlement: false,
            isFlagged: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding stint:', error);
        throw error;
    }
};

export const getStintById = async (stintId: string): Promise<Stint | null> => {
    try {
        const docRef = doc(db, 'stints', stintId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return formatDocument<Stint>(docSnap);
        }
        return null;
    } catch (error) {
        console.error('Error getting stint:', error);
        return null;
    }
};

export const getAllStints = async (): Promise<Stint[]> => {
    try {
        const stintsRef = collection(db, 'stints');
        const snapshot = await getDocs(stintsRef);
        const stints = snapshot.docs.map(doc => formatDocument<Stint>(doc));
        return sortByCreatedAtDesc(stints);
    } catch (error) {
        console.error('Error getting stints:', error);
        return [];
    }
};

export const getOpenStints = async (): Promise<Stint[]> => {
    try {
        const stintsRef = collection(db, 'stints');
        const q = query(stintsRef, where('status', '==', 'open'));
        const snapshot = await getDocs(q);
        const stints = snapshot.docs.map(doc => formatDocument<Stint>(doc));
        return sortByCreatedAtDesc(stints);
    } catch (error) {
        console.error('Error getting open stints:', error);
        return [];
    }
};

export const getStintsByEmployer = async (employerId: string): Promise<Stint[]> => {
    try {
        const stintsRef = collection(db, 'stints');
        const q = query(stintsRef, where('employerId', '==', employerId));
        const snapshot = await getDocs(q);
        const stints = snapshot.docs.map(doc => formatDocument<Stint>(doc));
        return sortByCreatedAtDesc(stints);
    } catch (error) {
        console.error('Error getting employer stints:', error);
        return [];
    }
};

export const getStintsByProfessional = async (professionalId: string): Promise<Stint[]> => {
    try {
        const stintsRef = collection(db, 'stints');
        const q = query(stintsRef, where('confirmedProfessionalId', '==', professionalId));
        const snapshot = await getDocs(q);
        const stints = snapshot.docs.map(doc => formatDocument<Stint>(doc));
        return sortByCreatedAtDesc(stints);
    } catch (error) {
        console.error('Error getting professional stints:', error);
        return [];
    }
};

export const updateStintStatus = async (
    stintId: string,
    status: StintStatus,
    additionalData?: Partial<Stint>
): Promise<void> => {
    try {
        const docRef = doc(db, 'stints', stintId);
        await updateDoc(docRef, {
            status,
            ...additionalData,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating stint status:', error);
        throw error;
    }
};

export const acceptStint = async (
    stintId: string,
    professionalId: string,
    professionalName: string
): Promise<void> => {
    try {
        const docRef = doc(db, 'stints', stintId);
        await updateDoc(docRef, {
            status: 'accepted',
            confirmedProfessionalId: professionalId,
            confirmedProfessionalName: professionalName,
            acceptedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error accepting stint:', error);
        throw error;
    }
};

export const clockInStint = async (stintId: string): Promise<void> => {
    try {
        const docRef = doc(db, 'stints', stintId);
        await updateDoc(docRef, {
            status: 'in_progress',
            clockInTime: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error clocking in:', error);
        throw error;
    }
};

export const clockOutStint = async (stintId: string): Promise<void> => {
    try {
        const now = new Date();
        const disputeWindowEnds = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const docRef = doc(db, 'stints', stintId);
        await updateDoc(docRef, {
            status: 'completed',
            clockOutTime: serverTimestamp(),
            completedAt: serverTimestamp(),
            disputeWindowEnds: Timestamp.fromDate(disputeWindowEnds),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error clocking out:', error);
        throw error;
    }
};

export const cancelStint = async (stintId: string, reason?: string): Promise<void> => {
    try {
        const docRef = doc(db, 'stints', stintId);
        await updateDoc(docRef, {
            status: 'cancelled',
            cancelledAt: serverTimestamp(),
            cancellationReason: reason || 'Cancelled by employer',
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error cancelling stint:', error);
        throw error;
    }
};

// Real-time stint subscriptions - simplified without orderBy to avoid index requirements
export const subscribeToOpenStints = (
    callback: (stints: Stint[]) => void
): Unsubscribe => {
    const stintsRef = collection(db, 'stints');
    const q = query(stintsRef, where('status', '==', 'open'));
    return onSnapshot(q, (snapshot) => {
        const stints = snapshot.docs.map(doc => formatDocument<Stint>(doc));
        callback(sortByCreatedAtDesc(stints));
    }, (error) => {
        console.error('Error in open stints subscription:', error);
        callback([]);
    });
};

export const subscribeToEmployerStints = (
    employerId: string,
    callback: (stints: Stint[]) => void
): Unsubscribe => {
    const stintsRef = collection(db, 'stints');
    const q = query(stintsRef, where('employerId', '==', employerId));
    return onSnapshot(q, (snapshot) => {
        const stints = snapshot.docs.map(doc => formatDocument<Stint>(doc));
        callback(sortByCreatedAtDesc(stints));
    }, (error) => {
        console.error('Error in employer stints subscription:', error);
        callback([]);
    });
};

export const subscribeToProfessionalStints = (
    professionalId: string,
    callback: (stints: Stint[]) => void
): Unsubscribe => {
    const stintsRef = collection(db, 'stints');
    const q = query(stintsRef, where('confirmedProfessionalId', '==', professionalId));
    return onSnapshot(q, (snapshot) => {
        const stints = snapshot.docs.map(doc => formatDocument<Stint>(doc));
        callback(sortByCreatedAtDesc(stints));
    }, (error) => {
        console.error('Error in professional stints subscription:', error);
        callback([]);
    });
};

// =============================================
// STINT APPLICATION SERVICES
// =============================================

export const addStintApplication = async (applicationData: {
    stintId: string;
    professionalId: string;
    professionalName: string;
    professionalRole: string;
    professionalRating?: number;
    bidAmount?: number;
    message?: string;
}): Promise<string> => {
    try {
        // Build clean data object without undefined values
        const cleanData: Record<string, any> = {
            stintId: applicationData.stintId,
            professionalId: applicationData.professionalId,
            professionalName: applicationData.professionalName,
            professionalRole: applicationData.professionalRole,
            status: 'pending',
            appliedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // Only add optional fields if they have actual values
        if (applicationData.professionalRating !== undefined && applicationData.professionalRating !== null) {
            cleanData.professionalRating = applicationData.professionalRating;
        }
        if (applicationData.bidAmount !== undefined && applicationData.bidAmount !== null && applicationData.bidAmount > 0) {
            cleanData.bidAmount = applicationData.bidAmount;
        }
        if (applicationData.message !== undefined && applicationData.message !== null && applicationData.message.trim() !== '') {
            cleanData.message = applicationData.message;
        }

        const applicationsRef = collection(db, 'stintApplications');
        const docRef = await addDoc(applicationsRef, cleanData);
        return docRef.id;
    } catch (error) {
        console.error('Error adding application:', error);
        throw error;
    }
};

export const getApplicationsByStint = async (stintId: string): Promise<StintApplication[]> => {
    try {
        const applicationsRef = collection(db, 'stintApplications');
        const q = query(applicationsRef, where('stintId', '==', stintId));
        const snapshot = await getDocs(q);
        const applications = snapshot.docs.map(doc => formatDocument<StintApplication>(doc));
        return applications.sort((a, b) => {
            const aTime = a.appliedAt?.getTime() || 0;
            const bTime = b.appliedAt?.getTime() || 0;
            return bTime - aTime;
        });
    } catch (error) {
        console.error('Error getting applications by stint:', error);
        return [];
    }
};

export const getApplicationsByProfessional = async (professionalId: string): Promise<StintApplication[]> => {
    try {
        const applicationsRef = collection(db, 'stintApplications');
        const q = query(applicationsRef, where('professionalId', '==', professionalId));
        const snapshot = await getDocs(q);
        const applications = snapshot.docs.map(doc => formatDocument<StintApplication>(doc));
        return applications.sort((a, b) => {
            const aTime = a.appliedAt?.getTime() || 0;
            const bTime = b.appliedAt?.getTime() || 0;
            return bTime - aTime;
        });
    } catch (error) {
        console.error('Error getting applications by professional:', error);
        return [];
    }
};

// Get all applications for an employer's stints
export const getApplicationsForEmployer = async (employerId: string): Promise<StintApplication[]> => {
    try {
        // First get all stints for this employer
        const employerStints = await getStintsByEmployer(employerId);
        const stintIds = employerStints.map(s => s.id);

        if (stintIds.length === 0) return [];

        // Get applications for these stints
        const allApplications: StintApplication[] = [];
        for (const stintId of stintIds) {
            const apps = await getApplicationsByStint(stintId);
            allApplications.push(...apps);
        }

        return allApplications.sort((a, b) => {
            const aTime = a.appliedAt?.getTime() || 0;
            const bTime = b.appliedAt?.getTime() || 0;
            return bTime - aTime;
        });
    } catch (error) {
        console.error('Error getting applications for employer:', error);
        return [];
    }
};

export const checkExistingApplication = async (
    stintId: string,
    professionalId: string
): Promise<boolean> => {
    try {
        const applicationsRef = collection(db, 'stintApplications');
        const q = query(
            applicationsRef,
            where('stintId', '==', stintId),
            where('professionalId', '==', professionalId),
            limit(1)
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking existing application:', error);
        return false;
    }
};

export const updateApplicationStatus = async (
    applicationId: string,
    status: 'pending' | 'accepted' | 'declined' | 'withdrawn'
): Promise<void> => {
    try {
        const docRef = doc(db, 'stintApplications', applicationId);
        await updateDoc(docRef, {
            status,
            respondedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating application status:', error);
        throw error;
    }
};

export const withdrawApplication = async (applicationId: string): Promise<void> => {
    try {
        const docRef = doc(db, 'stintApplications', applicationId);
        await updateDoc(docRef, {
            status: 'withdrawn',
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error withdrawing application:', error);
        throw error;
    }
};

// Real-time application subscriptions - simplified without orderBy
export const subscribeToStintApplications = (
    stintId: string,
    callback: (applications: StintApplication[]) => void
): Unsubscribe => {
    const applicationsRef = collection(db, 'stintApplications');
    const q = query(applicationsRef, where('stintId', '==', stintId));
    return onSnapshot(q, (snapshot) => {
        const applications = snapshot.docs.map(doc => formatDocument<StintApplication>(doc));
        callback(applications.sort((a, b) => {
            const aTime = a.appliedAt?.getTime() || 0;
            const bTime = b.appliedAt?.getTime() || 0;
            return bTime - aTime;
        }));
    }, (error) => {
        console.error('Error in stint applications subscription:', error);
        callback([]);
    });
};

export const subscribeToProfessionalApplications = (
    professionalId: string,
    callback: (applications: StintApplication[]) => void
): Unsubscribe => {
    const applicationsRef = collection(db, 'stintApplications');
    const q = query(applicationsRef, where('professionalId', '==', professionalId));
    return onSnapshot(q, (snapshot) => {
        const applications = snapshot.docs.map(doc => formatDocument<StintApplication>(doc));
        callback(applications.sort((a, b) => {
            const aTime = a.appliedAt?.getTime() || 0;
            const bTime = b.appliedAt?.getTime() || 0;
            return bTime - aTime;
        }));
    }, (error) => {
        console.error('Error in professional applications subscription:', error);
        callback([]);
    });
};

// =============================================
// NOTIFICATION SERVICES
// =============================================

export const getNotifications = async (userId: string): Promise<Notification[]> => {
    try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(notificationsRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const notifications = snapshot.docs.map(doc => formatDocument<Notification>(doc));
        return sortByCreatedAtDesc(notifications).slice(0, 50);
    } catch (error) {
        console.error('Error getting notifications:', error);
        return [];
    }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    try {
        const docRef = doc(db, 'notifications', notificationId);
        await updateDoc(docRef, {
            isRead: true,
            readAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

export const subscribeToNotifications = (
    userId: string,
    callback: (notifications: Notification[]) => void
): Unsubscribe => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => formatDocument<Notification>(doc));
        callback(sortByCreatedAtDesc(notifications).slice(0, 50));
    }, (error) => {
        console.error('Error in notifications subscription:', error);
        callback([]);
    });
};

// =============================================
// INVOICE SERVICES
// =============================================

export const getInvoicesByEmployer = async (employerId: string): Promise<Invoice[]> => {
    try {
        const invoicesRef = collection(db, 'invoices');
        const q = query(invoicesRef, where('employerId', '==', employerId));
        const snapshot = await getDocs(q);
        const invoices = snapshot.docs.map(doc => formatDocument<Invoice>(doc));
        return sortByCreatedAtDesc(invoices);
    } catch (error) {
        console.error('Error getting invoices:', error);
        return [];
    }
};

// =============================================
// PAYOUT SERVICES
// =============================================

export const getPayoutsByProfessional = async (professionalId: string): Promise<Payout[]> => {
    try {
        const payoutsRef = collection(db, 'payouts');
        const q = query(payoutsRef, where('professionalId', '==', professionalId));
        const snapshot = await getDocs(q);
        const payouts = snapshot.docs.map(doc => formatDocument<Payout>(doc));
        return sortByCreatedAtDesc(payouts);
    } catch (error) {
        console.error('Error getting payouts:', error);
        return [];
    }
};

// =============================================
// AUDIT LOG SERVICES
// =============================================

export const getRecentAuditLogs = async (limitCount: number = 50): Promise<AuditLog[]> => {
    try {
        const logsRef = collection(db, 'auditLogs');
        const snapshot = await getDocs(logsRef);
        const logs = snapshot.docs.map(doc => formatDocument<AuditLog>(doc));
        return logs.sort((a, b) => {
            const aTime = (a as any).timestamp?.getTime() || 0;
            const bTime = (b as any).timestamp?.getTime() || 0;
            return bTime - aTime;
        }).slice(0, limitCount);
    } catch (error) {
        console.error('Error getting audit logs:', error);
        return [];
    }
};

// =============================================
// DASHBOARD STATS
// =============================================

export const getEmployerStats = async (employerId: string) => {
    try {
        const stints = await getStintsByEmployer(employerId);
        const total = stints.length;
        const active = stints.filter(s => s.status === 'open' || s.status === 'in_progress' || s.status === 'accepted').length;
        const completed = stints.filter(s => s.status === 'completed' || s.status === 'settled').length;
        const totalSpent = stints
            .filter(s => s.status === 'completed' || s.status === 'settled')
            .reduce((sum, s) => sum + (s.offeredRate || 0), 0);

        return { total, active, completed, totalSpent };
    } catch (error) {
        console.error('Error getting employer stats:', error);
        return { total: 0, active: 0, completed: 0, totalSpent: 0 };
    }
};

export const getProfessionalStats = async (professionalId: string) => {
    try {
        const stints = await getStintsByProfessional(professionalId);
        const applications = await getApplicationsByProfessional(professionalId);

        const completedCount = stints.filter(s => s.status === 'completed' || s.status === 'settled').length;
        const activeStints = stints.filter(s => s.status === 'accepted' || s.status === 'in_progress');
        const totalEarnings = stints
            .filter(s => s.status === 'completed' || s.status === 'settled')
            .reduce((sum, s) => sum + (s.offeredRate || 0) * 0.95, 0); // 5% platform fee

        const pendingApplications = applications.filter(a => a.status === 'pending').length;

        return {
            completedCount,
            activeStints,
            totalEarnings,
            pendingApplications,
            applicationsCount: applications.length,
        };
    } catch (error) {
        console.error('Error getting professional stats:', error);
        return { completedCount: 0, activeStints: [], totalEarnings: 0, pendingApplications: 0, applicationsCount: 0 };
    }
};

export const getAdminStats = async () => {
    try {
        const [employers, professionals, stints] = await Promise.all([
            getAllEmployers(),
            getAllProfessionals(),
            getAllStints(),
        ]);

        const pendingEmployers = employers.filter(e => e.status === 'pending_validation').length;
        const pendingProfessionals = professionals.filter(p => p.status === 'pending_validation').length;
        const activeStints = stints.filter(s => s.status === 'open' || s.status === 'in_progress').length;
        const completedStints = stints.filter(s => s.status === 'completed' || s.status === 'settled').length;

        return {
            totalEmployers: employers.length,
            pendingEmployers,
            activeEmployers: employers.filter(e => e.status === 'active').length,
            totalProfessionals: professionals.length,
            pendingProfessionals,
            activeProfessionals: professionals.filter(p => p.status === 'active').length,
            totalStints: stints.length,
            activeStints,
            completedStints,
        };
    } catch (error) {
        console.error('Error getting admin stats:', error);
        return {
            totalEmployers: 0,
            pendingEmployers: 0,
            activeEmployers: 0,
            totalProfessionals: 0,
            pendingProfessionals: 0,
            activeProfessionals: 0,
            totalStints: 0,
            activeStints: 0,
            completedStints: 0,
        };
    }
};

// =============================================
// RATING SERVICES
// =============================================

export const submitStintRating = async (
    stintId: string,
    rating: number,
    review?: string
): Promise<void> => {
    try {
        // Get the stint to find employer and professional IDs
        const stint = await getStintById(stintId);
        if (!stint) {
            throw new Error('Stint not found');
        }

        // Add rating to ratings collection
        const ratingsRef = collection(db, 'ratings');
        await addDoc(ratingsRef, {
            stintId,
            employerId: stint.employerId,
            professionalId: stint.confirmedProfessionalId,
            rating,
            review: review || '',
            ratedBy: 'professional', // Professional rating the employer
            createdAt: serverTimestamp(),
        });

        // Update stint with rating info
        const stintRef = doc(db, 'stints', stintId);
        await updateDoc(stintRef, {
            professionalRating: rating,
            professionalReview: review || '',
            ratedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error submitting rating:', error);
        throw error;
    }
};
