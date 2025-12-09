'use client';

import { db } from './firebase/clientApp';
import {
    collection,
    getDocs,
    query,
    where,
    updateDoc,
    doc,
    addDoc,
    Timestamp,
    orderBy,
    limit
} from 'firebase/firestore';

// Settlement status types
export type SettlementStatus = 'pending' | 'ready_for_settlement' | 'processing' | 'completed' | 'failed';

export interface SettlementRecord {
    id?: string;
    stintId: string;
    employerId: string;
    professionalId: string;
    grossAmount: number;
    employerFee: number;
    employerFeePercent: number;
    professionalFee: number;
    professionalFeePercent: number;
    mpesaCost: number;
    netPayoutAmount: number;
    platformRevenue: number;
    currency: string;
    status: SettlementStatus;
    scheduledAt: Date;
    processedAt?: Date;
    failureReason?: string;
    retryCount: number;
    externalTransactionId?: string;
}

// M-Pesa cost calculation (simplified)
export function calculateMpesaCost(amount: number): number {
    // Simplified M-Pesa cost structure
    if (amount <= 100) return 0;
    if (amount <= 500) return 7;
    if (amount <= 1000) return 13;
    if (amount <= 1500) return 23;
    if (amount <= 2500) return 33;
    if (amount <= 3500) return 53;
    if (amount <= 5000) return 57;
    if (amount <= 7500) return 78;
    if (amount <= 10000) return 90;
    if (amount <= 15000) return 100;
    if (amount <= 20000) return 105;
    if (amount <= 35000) return 108;
    if (amount <= 50000) return 108;
    return 110; // Max
}

// Calculate settlement amounts
export function calculateSettlement(
    offeredRate: number,
    urgency: 'normal' | 'urgent',
    currency: string = 'KSh'
): {
    employerFeePercent: number;
    employerFee: number;
    totalEmployerCharge: number;
    professionalFeePercent: number;
    professionalFee: number;
    mpesaCost: number;
    netPayout: number;
    platformRevenue: number;
} {
    // Fee percentages
    const employerFeePercent = urgency === 'urgent' ? 20 : 15;
    const professionalFeePercent = 5;

    // Calculate fees
    const employerFee = Math.round(offeredRate * (employerFeePercent / 100));
    const totalEmployerCharge = offeredRate + employerFee;

    const professionalFee = Math.round(offeredRate * (professionalFeePercent / 100));
    const mpesaCost = calculateMpesaCost(offeredRate - professionalFee);
    const netPayout = offeredRate - professionalFee - mpesaCost;

    const platformRevenue = employerFee + professionalFee;

    return {
        employerFeePercent,
        employerFee,
        totalEmployerCharge,
        professionalFeePercent,
        professionalFee,
        mpesaCost,
        netPayout,
        platformRevenue,
    };
}

// Check if stint is ready for settlement (24h dispute window passed)
export function isReadyForSettlement(completedAt: Date): boolean {
    const now = new Date();
    const disputeWindowHours = 24;
    const windowEnd = new Date(completedAt.getTime() + disputeWindowHours * 60 * 60 * 1000);
    return now >= windowEnd;
}

// Process settlements for completed stints
export async function processReadySettlements(): Promise<{ processed: number; failed: number }> {
    if (!db) return { processed: 0, failed: 0 };

    let processed = 0;
    let failed = 0;

    try {
        // Get completed stints that are ready for settlement
        const stintsQuery = query(
            collection(db, 'stints'),
            where('status', '==', 'completed'),
            where('isReadyForSettlement', '==', true)
        );

        const stintsSnapshot = await getDocs(stintsQuery);

        for (const stintDoc of stintsSnapshot.docs) {
            const stint = stintDoc.data();

            // Check if payout already exists
            const existingPayoutQuery = query(
                collection(db, 'payouts'),
                where('stintId', '==', stintDoc.id)
            );
            const existingPayout = await getDocs(existingPayoutQuery);

            if (!existingPayout.empty) continue; // Already processed

            try {
                // Calculate settlement
                const settlement = calculateSettlement(
                    stint.offeredRate,
                    stint.urgency || 'normal',
                    stint.currency || 'KSh'
                );

                // Create payout record
                await addDoc(collection(db, 'payouts'), {
                    stintId: stintDoc.id,
                    professionalId: stint.acceptedProfessionalId,
                    employerId: stint.employerId,
                    grossAmount: stint.offeredRate,
                    platformFeePercent: settlement.professionalFeePercent,
                    platformFeeAmount: settlement.professionalFee,
                    mpesaCost: settlement.mpesaCost,
                    netAmount: settlement.netPayout,
                    currency: stint.currency || 'KSh',
                    payoutMethod: 'mpesa',
                    status: 'pending',
                    retryCount: 0,
                    scheduledAt: Timestamp.now(),
                    createdAt: Timestamp.now(),
                });

                // Create invoice for employer
                await addDoc(collection(db, 'invoices'), {
                    stintId: stintDoc.id,
                    employerId: stint.employerId,
                    type: 'booking_fee',
                    amount: settlement.employerFee,
                    feePercent: settlement.employerFeePercent,
                    stintAmount: stint.offeredRate,
                    totalCharge: settlement.totalEmployerCharge,
                    currency: stint.currency || 'KSh',
                    status: 'pending',
                    createdAt: Timestamp.now(),
                });

                // Update stint status
                await updateDoc(doc(db, 'stints', stintDoc.id), {
                    status: 'settled',
                    settledAt: Timestamp.now(),
                });

                processed++;
            } catch (error) {
                console.error(`Failed to process settlement for stint ${stintDoc.id}:`, error);
                failed++;
            }
        }
    } catch (error) {
        console.error('Error processing settlements:', error);
    }

    return { processed, failed };
}

// Check and mark stints as ready for settlement
export async function checkDisputeWindows(): Promise<number> {
    if (!db) return 0;

    let marked = 0;

    try {
        // Get completed stints not yet marked as ready
        const stintsQuery = query(
            collection(db, 'stints'),
            where('status', '==', 'completed'),
            where('isReadyForSettlement', '==', false)
        );

        const stintsSnapshot = await getDocs(stintsQuery);

        for (const stintDoc of stintsSnapshot.docs) {
            const stint = stintDoc.data();
            const completedAt = stint.completedAt?.toDate() || new Date();

            if (isReadyForSettlement(completedAt)) {
                await updateDoc(doc(db, 'stints', stintDoc.id), {
                    isReadyForSettlement: true,
                });
                marked++;
            }
        }
    } catch (error) {
        console.error('Error checking dispute windows:', error);
    }

    return marked;
}

// Get settlement statistics
export async function getSettlementStats(): Promise<{
    pendingPayouts: number;
    completedPayouts: number;
    totalPaidOut: number;
    totalRevenue: number;
    pendingInvoices: number;
}> {
    const stats = {
        pendingPayouts: 0,
        completedPayouts: 0,
        totalPaidOut: 0,
        totalRevenue: 0,
        pendingInvoices: 0,
    };

    if (!db) return stats;

    try {
        // Get payouts
        const payoutsSnapshot = await getDocs(collection(db, 'payouts'));
        payoutsSnapshot.forEach(doc => {
            const payout = doc.data();
            if (payout.status === 'pending') {
                stats.pendingPayouts++;
            } else if (payout.status === 'completed') {
                stats.completedPayouts++;
                stats.totalPaidOut += payout.netAmount || 0;
            }
            stats.totalRevenue += payout.platformFeeAmount || 0;
        });

        // Get invoices
        const invoicesQuery = query(collection(db, 'invoices'), where('status', '==', 'pending'));
        const invoicesSnapshot = await getDocs(invoicesQuery);
        stats.pendingInvoices = invoicesSnapshot.size;

        // Add employer fees to revenue
        const allInvoicesSnapshot = await getDocs(collection(db, 'invoices'));
        allInvoicesSnapshot.forEach(doc => {
            const invoice = doc.data();
            if (invoice.status === 'paid') {
                stats.totalRevenue += invoice.amount || 0;
            }
        });
    } catch (error) {
        console.error('Error getting settlement stats:', error);
    }

    return stats;
}

// Get recent transactions for finance dashboard
export async function getRecentTransactions(limitCount: number = 20): Promise<any[]> {
    if (!db) return [];

    const transactions: any[] = [];

    try {
        // Get recent payouts
        const payoutsQuery = query(
            collection(db, 'payouts'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const payoutsSnapshot = await getDocs(payoutsQuery);

        payoutsSnapshot.forEach(doc => {
            const payout = doc.data();
            transactions.push({
                id: doc.id,
                type: 'payout',
                amount: payout.netAmount,
                grossAmount: payout.grossAmount,
                fee: payout.platformFeeAmount,
                status: payout.status,
                entityId: payout.professionalId,
                stintId: payout.stintId,
                createdAt: payout.createdAt?.toDate(),
            });
        });

        // Get recent invoices
        const invoicesQuery = query(
            collection(db, 'invoices'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const invoicesSnapshot = await getDocs(invoicesQuery);

        invoicesSnapshot.forEach(doc => {
            const invoice = doc.data();
            transactions.push({
                id: doc.id,
                type: 'invoice',
                amount: invoice.amount,
                totalCharge: invoice.totalCharge,
                status: invoice.status,
                entityId: invoice.employerId,
                stintId: invoice.stintId,
                createdAt: invoice.createdAt?.toDate(),
            });
        });

        // Sort by date
        transactions.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

        return transactions.slice(0, limitCount);
    } catch (error) {
        console.error('Error getting recent transactions:', error);
        return [];
    }
}
