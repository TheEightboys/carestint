'use client';

import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc, updateDoc, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from './clientApp';
import type { StintStatus, ApplicationStatus, DisputeStatus, PayoutStatus, AuditAction, ActorType, EntityType, ProfessionalRole, ShiftType, UrgencyType } from '@/lib/types';

// Helper function to get the Firestore instance
const getDb = () => {
    if (!db) {
        throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    }
    return db;
}

// =============================================
// EMPLOYER SERVICES
// =============================================

export const addEmployer = async (employerData: any) => {
    const firestore = getDb();
    try {
        const docRef = await addDoc(collection(firestore, 'employers'), {
            ...employerData,
            status: 'pending_validation',
            riskScore: 0,
            riskLevel: 'Low',
            verificationScore: 0,
            documentQuality: 'ok',
            suspicionScore: 0,
            stintsPostedThisMonth: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        // Create audit log
        await addAuditLog({
            actorType: 'system',
            entityType: 'employer',
            entityId: docRef.id,
            action: 'EMPLOYER_CREATED',
            description: `New employer "${employerData.facilityName}" submitted for review`,
        });
        return docRef.id;
    } catch (e) {
        console.error('Error adding employer: ', e);
        throw e;
    }
};

export const getPendingEmployers = async () => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'employers'), where('status', '==', 'pending_validation'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting pending employers:", error);
        return [];
    }
}

export const getAllEmployers = async () => {
    const firestore = getDb();
    try {
        const querySnapshot = await getDocs(collection(firestore, 'employers'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting all employers:", error);
        return [];
    }
}

export const getEmployerById = async (id: string) => {
    const firestore = getDb();
    try {
        const docRef = doc(firestore, 'employers', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error getting employer by ID:", error);
        return null;
    }
}

export const getEmployerByPhone = async (phone: string) => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'employers'), where('phone', '==', phone));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error("Error getting employer by phone:", error);
        return null;
    }
}

export const getEmployerByEmail = async (email: string) => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'employers'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error("Error getting employer by email:", error);
        return null;
    }
}

export const updateEmployerStatus = async (id: string, status: string, actorId?: string) => {
    const firestore = getDb();
    try {
        const docRef = doc(firestore, 'employers', id);
        const updates: any = { status, updatedAt: serverTimestamp() };
        if (status === 'active') {
            updates.approvedAt = serverTimestamp();
        } else if (status === 'suspended') {
            updates.suspendedAt = serverTimestamp();
        }
        await updateDoc(docRef, updates);

        // Audit log
        const actionMap: Record<string, AuditAction> = {
            'active': 'EMPLOYER_APPROVED',
            'rejected': 'EMPLOYER_REJECTED',
            'suspended': 'EMPLOYER_SUSPENDED',
        };
        if (actionMap[status]) {
            await addAuditLog({
                actorType: actorId ? 'superadmin' : 'system',
                actorId,
                entityType: 'employer',
                entityId: id,
                action: actionMap[status],
                description: `Employer status updated to ${status}`,
            });
        }
        return true;
    } catch (error) {
        console.error("Error updating employer status:", error);
        return false;
    }
}

export const getEmployersByStatus = async (status: string) => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'employers'), where('status', '==', status));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting employers by status:", error);
        return [];
    }
}

// =============================================
// PROFESSIONAL SERVICES
// =============================================

export const addProfessional = async (professionalData: any) => {
    const firestore = getDb();
    try {
        const docRef = await addDoc(collection(firestore, 'professionals'), {
            ...professionalData,
            status: 'pending_validation',
            riskScore: 0,
            riskLevel: 'Low',
            verificationScore: 0,
            documentQuality: 'ok',
            suspicionScore: 0,
            averageRating: 0,
            totalRatings: 0,
            completedStints: 0,
            noShows: 0,
            lateClockIns: 0,
            isTopProfessional: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        await addAuditLog({
            actorType: 'system',
            entityType: 'professional',
            entityId: docRef.id,
            action: 'PROFESSIONAL_CREATED',
            description: `New professional "${professionalData.fullName}" submitted for review`,
        });
        return docRef.id;
    } catch (e) {
        console.error('Error adding professional: ', e);
        throw e;
    }
};

export const getPendingProfessionals = async () => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'professionals'), where('status', '==', 'pending_validation'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting pending professionals:", error);
        return [];
    }
}

export const getAllProfessionals = async () => {
    const firestore = getDb();
    try {
        const querySnapshot = await getDocs(collection(firestore, 'professionals'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting all professionals:", error);
        return [];
    }
}

export const getProfessionalById = async (id: string) => {
    const firestore = getDb();
    try {
        const docRef = doc(firestore, 'professionals', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error getting professional by ID:", error);
        return null;
    }
}

export const getProfessionalByPhone = async (phone: string) => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'professionals'), where('phone', '==', phone));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error("Error getting professional by phone:", error);
        return null;
    }
}

export const getProfessionalByEmail = async (email: string) => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'professionals'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error("Error getting professional by email:", error);
        return null;
    }
}

export const updateProfessionalStatus = async (id: string, status: string, actorId?: string) => {
    const firestore = getDb();
    try {
        const docRef = doc(firestore, 'professionals', id);
        const updates: any = { status, updatedAt: serverTimestamp() };
        if (status === 'active') {
            updates.approvedAt = serverTimestamp();
        } else if (status === 'suspended') {
            updates.suspendedAt = serverTimestamp();
        }
        await updateDoc(docRef, updates);

        const actionMap: Record<string, AuditAction> = {
            'active': 'PROFESSIONAL_APPROVED',
            'rejected': 'PROFESSIONAL_REJECTED',
            'suspended': 'PROFESSIONAL_SUSPENDED',
        };
        if (actionMap[status]) {
            await addAuditLog({
                actorType: actorId ? 'superadmin' : 'system',
                actorId,
                entityType: 'professional',
                entityId: id,
                action: actionMap[status],
                description: `Professional status updated to ${status}`,
            });
        }
        return true;
    } catch (error) {
        console.error("Error updating professional status:", error);
        return false;
    }
}

export const getProfessionalsByStatus = async (status: string) => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'professionals'), where('status', '==', status));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting professionals by status:", error);
        return [];
    }
}

// =============================================
// STINT SERVICES
// =============================================

export const addStint = async (stintData: {
    employerId: string;
    employerName: string;
    role: ProfessionalRole;
    shiftType: ShiftType;
    shiftDate: Date;
    startTime: string;
    endTime: string;
    description?: string;
    city: string;
    address?: string;
    offeredRate: number;
    currency: string;
    allowBids: boolean;
    minBid?: number;
    maxBid?: number;
    urgency: UrgencyType;
}) => {
    const firestore = getDb();
    try {
        // Calculate booking fee
        const bookingFeePercent = stintData.urgency === 'urgent' ? 20 : 15;
        const bookingFeeAmount = Math.round(stintData.offeredRate * (bookingFeePercent / 100));

        const docRef = await addDoc(collection(firestore, 'stints'), {
            ...stintData,
            shiftDate: Timestamp.fromDate(stintData.shiftDate),
            status: 'open' as StintStatus,
            bookingFeePercent,
            bookingFeeAmount,
            isFlagged: false,
            isReadyForSettlement: false,
            cancellationFeeApplied: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        await addAuditLog({
            actorType: 'employer',
            actorId: stintData.employerId,
            entityType: 'stint',
            entityId: docRef.id,
            action: 'STINT_CREATED',
            description: `Stint created for ${stintData.role} at ${stintData.city}`,
        });

        return docRef.id;
    } catch (error) {
        console.error("Error adding stint:", error);
        throw error;
    }
}

export const getAllStints = async () => {
    const firestore = getDb();
    try {
        const querySnapshot = await getDocs(collection(firestore, 'stints'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting all stints:", error);
        return [];
    }
}

export const getStintById = async (id: string) => {
    const firestore = getDb();
    try {
        const docRef = doc(firestore, 'stints', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error getting stint by ID:", error);
        return null;
    }
}

export const getStintsByEmployer = async (employerId: string) => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'stints'), where('employerId', '==', employerId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting stints by employer:", error);
        return [];
    }
}

export const getStintsByStatus = async (status: StintStatus) => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'stints'), where('status', '==', status));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting stints by status:", error);
        return [];
    }
}

export const getOpenStints = async () => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'stints'), where('status', '==', 'open'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting open stints:", error);
        return [];
    }
}

export const updateStintStatus = async (id: string, status: StintStatus, additionalData?: any) => {
    const firestore = getDb();
    try {
        const docRef = doc(firestore, 'stints', id);
        await updateDoc(docRef, {
            status,
            ...additionalData,
            updatedAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error("Error updating stint status:", error);
        return false;
    }
}

export const acceptStint = async (stintId: string, professionalId: string, professionalName: string) => {
    const firestore = getDb();
    try {
        const docRef = doc(firestore, 'stints', stintId);
        await updateDoc(docRef, {
            status: 'accepted' as StintStatus,
            acceptedProfessionalId: professionalId,
            acceptedProfessionalName: professionalName,
            acceptedAt: serverTimestamp(),
            confirmedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        await addAuditLog({
            actorType: 'employer',
            entityType: 'stint',
            entityId: stintId,
            action: 'STINT_ACCEPTED',
            description: `Stint accepted by ${professionalName}`,
        });

        return true;
    } catch (error) {
        console.error("Error accepting stint:", error);
        return false;
    }
}

export const clockInStint = async (stintId: string) => {
    const firestore = getDb();
    try {
        const docRef = doc(firestore, 'stints', stintId);
        await updateDoc(docRef, {
            status: 'in_progress' as StintStatus,
            clockInTime: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error("Error clocking in stint:", error);
        return false;
    }
}

export const clockOutStint = async (stintId: string) => {
    const firestore = getDb();
    try {
        const now = new Date();
        const disputeWindowEnds = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

        const docRef = doc(firestore, 'stints', stintId);
        await updateDoc(docRef, {
            status: 'completed' as StintStatus,
            clockOutTime: serverTimestamp(),
            completedAt: serverTimestamp(),
            disputeWindowEndsAt: Timestamp.fromDate(disputeWindowEnds),
            updatedAt: serverTimestamp(),
        });

        await addAuditLog({
            actorType: 'system',
            entityType: 'stint',
            entityId: stintId,
            action: 'STINT_COMPLETED',
            description: `Stint completed. Dispute window ends in 24 hours.`,
        });

        return true;
    } catch (error) {
        console.error("Error clocking out stint:", error);
        return false;
    }
}

// =============================================
// STINT APPLICATION SERVICES
// =============================================

export const addStintApplication = async (applicationData: {
    stintId: string;
    professionalId: string;
    professionalName: string;
    professionalRole: ProfessionalRole;
    isBid: boolean;
    bidAmount?: number;
    message?: string;
}) => {
    const firestore = getDb();
    try {
        // Filter out undefined values to avoid Firestore errors
        const cleanData: Record<string, any> = {
            stintId: applicationData.stintId,
            professionalId: applicationData.professionalId,
            professionalName: applicationData.professionalName,
            professionalRole: applicationData.professionalRole,
            isBid: applicationData.isBid,
            status: 'pending' as ApplicationStatus,
            appliedAt: serverTimestamp(),
        };

        // Only add optional fields if they have values
        if (applicationData.bidAmount !== undefined && applicationData.bidAmount !== null) {
            cleanData.bidAmount = applicationData.bidAmount;
        }
        if (applicationData.message !== undefined && applicationData.message !== null && applicationData.message.trim() !== '') {
            cleanData.message = applicationData.message;
        }

        const docRef = await addDoc(collection(firestore, 'stintApplications'), cleanData);

        await addAuditLog({
            actorType: 'professional',
            actorId: applicationData.professionalId,
            entityType: 'application',
            entityId: docRef.id,
            action: 'APPLICATION_SUBMITTED',
            description: `${applicationData.professionalName} applied for stint`,
        });

        return docRef.id;
    } catch (error) {
        console.error("Error adding stint application:", error);
        throw error;
    }
}


export const getApplicationsByStint = async (stintId: string) => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'stintApplications'), where('stintId', '==', stintId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting applications by stint:", error);
        return [];
    }
}

export const getApplicationsByProfessional = async (professionalId: string) => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'stintApplications'), where('professionalId', '==', professionalId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting applications by professional:", error);
        return [];
    }
}

export const updateApplicationStatus = async (id: string, status: ApplicationStatus, rejectionReason?: string) => {
    const firestore = getDb();
    try {
        const docRef = doc(firestore, 'stintApplications', id);
        const updates: any = {
            status,
            respondedAt: serverTimestamp(),
        };
        if (rejectionReason) {
            updates.rejectionReason = rejectionReason;
        }
        await updateDoc(docRef, updates);
        return true;
    } catch (error) {
        console.error("Error updating application status:", error);
        return false;
    }
}

export const withdrawApplication = async (applicationId: string) => {
    const firestore = getDb();
    try {
        const docRef = doc(firestore, 'stintApplications', applicationId);
        await updateDoc(docRef, {
            status: 'withdrawn',
            withdrawnAt: serverTimestamp(),
        });

        await addAuditLog({
            actorType: 'professional',
            actorId: 'system',
            entityType: 'application',
            entityId: applicationId,
            action: 'APPLICATION_WITHDRAWN',
            description: 'Application withdrawn by professional',
        });

        return true;
    } catch (error) {
        console.error("Error withdrawing application:", error);
        throw error;
    }
}

// =============================================
// DISPUTE SERVICES
// =============================================

export const addDispute = async (disputeData: {
    stintId: string;
    employerId: string;
    professionalId: string;
    openedBy: 'employer' | 'professional';
    issueType: string;
    description: string;
}) => {
    const firestore = getDb();
    try {
        const docRef = await addDoc(collection(firestore, 'disputes'), {
            ...disputeData,
            status: 'open' as DisputeStatus,
            fundsAreFrozen: true,
            openedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // Update stint status
        await updateStintStatus(disputeData.stintId, 'disputed');

        await addAuditLog({
            actorType: disputeData.openedBy,
            actorId: disputeData.openedBy === 'employer' ? disputeData.employerId : disputeData.professionalId,
            entityType: 'dispute',
            entityId: docRef.id,
            action: 'DISPUTE_OPENED',
            description: `Dispute opened: ${disputeData.issueType}`,
        });

        return docRef.id;
    } catch (error) {
        console.error("Error adding dispute:", error);
        throw error;
    }
}

export const getAllDisputes = async () => {
    const firestore = getDb();
    try {
        const querySnapshot = await getDocs(collection(firestore, 'disputes'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting all disputes:", error);
        return [];
    }
}

export const getOpenDisputes = async () => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'disputes'), where('status', '==', 'open'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting open disputes:", error);
        return [];
    }
}

export const updateDisputeStatus = async (id: string, status: DisputeStatus, resolution?: string, finalPayoutAmount?: number) => {
    const firestore = getDb();
    try {
        const docRef = doc(firestore, 'disputes', id);
        const updates: any = {
            status,
            updatedAt: serverTimestamp(),
        };
        if (status === 'resolved') {
            updates.resolvedAt = serverTimestamp();
            updates.fundsAreFrozen = false;
            if (resolution) updates.resolution = resolution;
            if (finalPayoutAmount !== undefined) updates.finalPayoutAmount = finalPayoutAmount;
        }
        await updateDoc(docRef, updates);

        if (status === 'resolved') {
            await addAuditLog({
                actorType: 'superadmin',
                entityType: 'dispute',
                entityId: id,
                action: 'DISPUTE_RESOLVED',
                description: `Dispute resolved: ${resolution || 'No details'}`,
            });
        }

        return true;
    } catch (error) {
        console.error("Error updating dispute status:", error);
        return false;
    }
}

// =============================================
// PAYOUT SERVICES
// =============================================

export const addPayout = async (payoutData: {
    stintId: string;
    professionalId: string;
    employerId: string;
    grossAmount: number;
    platformFeePercent: number;
    platformFeeAmount: number;
    mpesaCost: number;
    netAmount: number;
    currency: string;
    payoutMethod: 'mpesa' | 'bank';
}) => {
    const firestore = getDb();
    try {
        const docRef = await addDoc(collection(firestore, 'payouts'), {
            ...payoutData,
            status: 'pending' as PayoutStatus,
            retryCount: 0,
            scheduledAt: serverTimestamp(),
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding payout:", error);
        throw error;
    }
}

export const getAllPayouts = async () => {
    const firestore = getDb();
    try {
        const querySnapshot = await getDocs(collection(firestore, 'payouts'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting all payouts:", error);
        return [];
    }
}

export const getPayoutsByProfessional = async (professionalId: string) => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'payouts'), where('professionalId', '==', professionalId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting payouts by professional:", error);
        return [];
    }
}


export const updatePayoutStatus = async (id: string, status: PayoutStatus, externalTransactionId?: string) => {
    const firestore = getDb();
    try {
        const docRef = doc(firestore, 'payouts', id);
        const updates: any = { status };
        if (status === 'completed') {
            updates.processedAt = serverTimestamp();
            if (externalTransactionId) updates.externalTransactionId = externalTransactionId;
        } else if (status === 'failed') {
            updates.failedAt = serverTimestamp();
        }
        await updateDoc(docRef, updates);
        return true;
    } catch (error) {
        console.error("Error updating payout status:", error);
        return false;
    }
}

// =============================================
// INVOICE SERVICES
// =============================================

export const addInvoice = async (invoiceData: {
    employerId: string;
    stintId?: string;
    invoiceType: 'booking_fee' | 'cancellation_fee' | 'permanent_hire_fee';
    amount: number;
    currency: string;
    description: string;
}) => {
    const firestore = getDb();
    try {
        // Generate invoice number
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

        const docRef = await addDoc(collection(firestore, 'invoices'), {
            ...invoiceData,
            invoiceNumber,
            isPaid: false,
            issuedAt: serverTimestamp(),
            dueAt: Timestamp.fromDate(dueDate),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding invoice:", error);
        throw error;
    }
}

export const getInvoicesByEmployer = async (employerId: string) => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'invoices'), where('employerId', '==', employerId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting invoices by employer:", error);
        return [];
    }
}

// =============================================
// AUDIT LOG SERVICES
// =============================================

export const addAuditLog = async (logData: {
    actorType: ActorType;
    actorId?: string;
    actorName?: string;
    entityType: EntityType;
    entityId: string;
    action: AuditAction;
    description: string;
    previousValue?: Record<string, any>;
    newValue?: Record<string, any>;
    metadata?: Record<string, any>;
}) => {
    const firestore = getDb();
    try {
        const docRef = await addDoc(collection(firestore, 'auditLogs'), {
            ...logData,
            timestamp: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding audit log:", error);
        // Don't throw - audit logs shouldn't break main operations
        return null;
    }
}

export const getRecentAuditLogs = async (limitCount: number = 50) => {
    const firestore = getDb();
    try {
        const q = query(
            collection(firestore, 'auditLogs'),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting recent audit logs:", error);
        return [];
    }
}

export const getAuditLogsByEntity = async (entityType: EntityType, entityId: string) => {
    const firestore = getDb();
    try {
        const q = query(
            collection(firestore, 'auditLogs'),
            where('entityType', '==', entityType),
            where('entityId', '==', entityId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting audit logs by entity:", error);
        return [];
    }
}

// =============================================
// NOTIFICATION SERVICES
// =============================================

export const addNotification = async (notificationData: {
    recipientId: string;
    recipientType: 'employer' | 'professional' | 'superadmin';
    templateId: string;
    title: string;
    message: string;
    channel: 'email' | 'sms' | 'push' | 'in_app';
    metadata?: Record<string, any>;
}) => {
    const firestore = getDb();
    try {
        const docRef = await addDoc(collection(firestore, 'notifications'), {
            ...notificationData,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding notification:", error);
        throw error;
    }
}

export const getNotificationsByRecipient = async (recipientId: string) => {
    const firestore = getDb();
    try {
        const q = query(
            collection(firestore, 'notifications'),
            where('recipientId', '==', recipientId),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting notifications:", error);
        return [];
    }
}

export const markNotificationRead = async (id: string) => {
    const firestore = getDb();
    try {
        const docRef = doc(firestore, 'notifications', id);
        await updateDoc(docRef, {
            readAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return false;
    }
}

// =============================================
// STATISTICS SERVICES
// =============================================

export const getDashboardStats = async () => {
    const firestore = getDb();
    try {
        const [employers, professionals, stints, disputes] = await Promise.all([
            getDocs(collection(firestore, 'employers')),
            getDocs(collection(firestore, 'professionals')),
            getDocs(collection(firestore, 'stints')),
            getDocs(collection(firestore, 'disputes')),
        ]);

        const employerData = employers.docs.map(d => d.data());
        const professionalData = professionals.docs.map(d => d.data());
        const stintData = stints.docs.map(d => d.data());
        const disputeData = disputes.docs.map(d => d.data());

        // Calculate GMV from completed stints
        const completedStints = stintData.filter(s => s.status === 'completed' || s.status === 'settled');
        const grossVolume = completedStints.reduce((sum, s) => sum + (s.offeredRate || 0), 0);
        const platformRevenue = completedStints.reduce((sum, s) => sum + (s.bookingFeeAmount || 0), 0);

        return {
            totalEmployers: employerData.length,
            pendingEmployers: employerData.filter(e => e.status === 'pending_validation').length,
            activeEmployers: employerData.filter(e => e.status === 'active').length,
            totalProfessionals: professionalData.length,
            pendingProfessionals: professionalData.filter(p => p.status === 'pending_validation').length,
            activeProfessionals: professionalData.filter(p => p.status === 'active').length,
            totalStints: stintData.length,
            activeStints: stintData.filter(s => s.status === 'open' || s.status === 'accepted' || s.status === 'in_progress').length,
            disputedStints: stintData.filter(s => s.status === 'disputed').length,
            grossVolume,
            platformRevenue,
            openDisputes: disputeData.filter(d => d.status === 'open').length,
            flaggedStints: stintData.filter(s => s.isFlagged).length,
            expiringLicenses: 0, // Would need date comparison logic
        };
    } catch (error) {
        console.error("Error getting dashboard stats:", error);
        return {
            totalEmployers: 0,
            pendingEmployers: 0,
            activeEmployers: 0,
            totalProfessionals: 0,
            pendingProfessionals: 0,
            activeProfessionals: 0,
            totalStints: 0,
            activeStints: 0,
            disputedStints: 0,
            grossVolume: 0,
            platformRevenue: 0,
            openDisputes: 0,
            flaggedStints: 0,
            expiringLicenses: 0,
        };
    }
}

// =============================================
// SUPERADMIN SERVICES
// =============================================

export const addSuperadmin = async (superadminData: {
    email: string;
    uid: string;
    role: string;
}) => {
    const firestore = getDb();
    try {
        const docRef = await addDoc(collection(firestore, 'superadmins'), {
            ...superadminData,
            createdAt: serverTimestamp(),
        });

        await addAuditLog({
            actorType: 'system',
            entityType: 'superadmin',
            entityId: docRef.id,
            action: 'SUPERADMIN_CREATED',
            description: `SuperAdmin account created for ${superadminData.email}`,
        });

        return docRef.id;
    } catch (error) {
        console.error('Error adding superadmin:', error);
        throw error;
    }
};

export const getSuperadminByEmail = async (email: string) => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'superadmins'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error getting superadmin by email:', error);
        return null;
    }
};

export const getSuperadminByUid = async (uid: string) => {
    const firestore = getDb();
    try {
        const q = query(collection(firestore, 'superadmins'), where('uid', '==', uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error getting superadmin by UID:', error);
        return null;
    }
};

export const getAllSuperadmins = async () => {
    const firestore = getDb();
    try {
        const querySnapshot = await getDocs(collection(firestore, 'superadmins'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting all superadmins:', error);
        return [];
    }
};

// =============================================
// WAITLIST SERVICES
// =============================================

export const addWaitlistEntry = async (data: {
    email: string;
    name?: string;
    userType: 'professional' | 'employer';
}) => {
    const firestore = getDb();
    try {
        // Check if email already exists
        const existingQuery = query(
            collection(firestore, 'waitlist'),
            where('email', '==', data.email.toLowerCase())
        );
        const existing = await getDocs(existingQuery);

        if (!existing.empty) {
            throw new Error('This email is already on the waitlist!');
        }

        const docRef = await addDoc(collection(firestore, 'waitlist'), {
            email: data.email.toLowerCase(),
            name: data.name || null,
            userType: data.userType,
            source: 'landing_page',
            notified: false,
            createdAt: serverTimestamp(),
        });

        return docRef.id;
    } catch (error) {
        console.error('Error adding waitlist entry:', error);
        throw error;
    }
};

export const getWaitlistEntries = async () => {
    const firestore = getDb();
    try {
        const q = query(
            collection(firestore, 'waitlist'),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting waitlist entries:', error);
        return [];
    }
};

export const getWaitlistCount = async () => {
    const firestore = getDb();
    try {
        const querySnapshot = await getDocs(collection(firestore, 'waitlist'));
        return querySnapshot.size;
    } catch (error) {
        console.error('Error getting waitlist count:', error);
        return 0;
    }
};
