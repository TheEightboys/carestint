/**
 * Settlement Service
 * Handles automated settlement calculations and payout scheduling
 */

import type { PayoutStatus } from '@/lib/types';

interface SettlementInput {
    stintId: string;
    professionalId: string;
    employerId: string;
    grossAmount: number;
    urgency: 'normal' | 'urgent';
    currency?: string;
    payoutMethod?: 'mpesa' | 'bank';
}

interface SettlementResult {
    grossAmount: number;
    bookingFeePercent: number;
    bookingFeeAmount: number;
    professionalFeePercent: number;
    professionalFeeAmount: number;
    mpesaCost: number;
    netPayout: number;
    platformRevenue: number;
    scheduledPayoutDate: Date;
}

// Fee configuration
const FEE_CONFIG = {
    normalBookingFee: 0.15, // 15%
    urgentBookingFee: 0.20, // 20%
    professionalFee: 0.05, // 5%
    mpesaFlatCost: 30, // KES 30 per transaction
    mpesaPercentCost: 0.01, // 1% up to a cap
    mpesaMaxCost: 100, // Max KES 100 per transaction
    disputeWindowHours: 24,
};

/**
 * Calculate settlement amounts for a completed stint
 */
export function calculateSettlementAmounts(
    grossAmount: number,
    isUrgent: boolean = false
): SettlementResult {
    // Booking fee (charged to employer)
    const bookingFeePercent = isUrgent
        ? FEE_CONFIG.urgentBookingFee
        : FEE_CONFIG.normalBookingFee;
    const bookingFeeAmount = Math.round(grossAmount * bookingFeePercent);

    // Professional service fee (deducted from payout)
    const professionalFeePercent = FEE_CONFIG.professionalFee;
    const professionalFeeAmount = Math.round(grossAmount * professionalFeePercent);

    // M-Pesa cost calculation
    const mpesaPercentAmount = Math.round(grossAmount * FEE_CONFIG.mpesaPercentCost);
    const mpesaCost = Math.min(
        FEE_CONFIG.mpesaFlatCost + mpesaPercentAmount,
        FEE_CONFIG.mpesaMaxCost
    );

    // Net payout to professional
    const netPayout = grossAmount - professionalFeeAmount - mpesaCost;

    // Platform revenue (booking fee + professional fee)
    const platformRevenue = bookingFeeAmount + professionalFeeAmount;

    // Scheduled payout date (24 hours after settlement)
    const scheduledPayoutDate = new Date();
    scheduledPayoutDate.setHours(
        scheduledPayoutDate.getHours() + FEE_CONFIG.disputeWindowHours
    );

    return {
        grossAmount,
        bookingFeePercent,
        bookingFeeAmount,
        professionalFeePercent,
        professionalFeeAmount,
        mpesaCost,
        netPayout,
        platformRevenue,
        scheduledPayoutDate,
    };
}

/**
 * Check if a stint is ready for settlement (dispute window closed)
 */
export function isReadyForSettlement(disputeWindowEndsAt: Date): boolean {
    return new Date() > new Date(disputeWindowEndsAt);
}

/**
 * Create a payout record from settlement data
 */
export function createPayoutRecord(
    input: SettlementInput,
    settlement: SettlementResult
) {
    return {
        stintId: input.stintId,
        professionalId: input.professionalId,
        employerId: input.employerId,
        grossAmount: settlement.grossAmount,
        platformFeePercent: settlement.professionalFeePercent * 100,
        platformFeeAmount: settlement.professionalFeeAmount,
        mpesaCost: settlement.mpesaCost,
        netAmount: settlement.netPayout,
        currency: input.currency || 'KES',
        payoutMethod: input.payoutMethod || 'mpesa',
        status: 'pending' as PayoutStatus,
        scheduledAt: settlement.scheduledPayoutDate,
        retryCount: 0,
    };
}

/**
 * Process automatic settlement for completed stints
 * This would typically be called by a scheduled job/Cloud Function
 */
export async function processAutoSettlement(stint: any) {
    // Only process completed stints that are past the dispute window
    if (stint.status !== 'completed') {
        return { success: false, reason: 'Stint not completed' };
    }

    if (!stint.disputeWindowEndsAt) {
        return { success: false, reason: 'No dispute window set' };
    }

    if (!isReadyForSettlement(stint.disputeWindowEndsAt)) {
        return { success: false, reason: 'Dispute window still open' };
    }

    if (stint.isReadyForSettlement) {
        return { success: false, reason: 'Already marked for settlement' };
    }

    // Calculate settlement
    const isUrgent = stint.urgency === 'urgent';
    const settlement = calculateSettlementAmounts(stint.offeredRate, isUrgent);

    // Create payout record
    const payoutData = createPayoutRecord(
        {
            stintId: stint.id,
            professionalId: stint.acceptedProfessionalId,
            employerId: stint.employerId,
            grossAmount: stint.offeredRate,
            urgency: stint.urgency,
        },
        settlement
    );

    return {
        success: true,
        settlement,
        payoutData,
    };
}

/**
 * Handle payout retry logic
 */
export function shouldRetryPayout(payout: any): boolean {
    const MAX_RETRIES = 3;
    return payout.status === 'failed' && payout.retryCount < MAX_RETRIES;
}

/**
 * Calculate retry delay with exponential backoff
 */
export function getRetryDelay(retryCount: number): number {
    // 5 min, 15 min, 45 min
    const baseDelay = 5 * 60 * 1000; // 5 minutes
    return baseDelay * Math.pow(3, retryCount);
}

/**
 * Generate invoice for employer
 */
export function generateInvoiceData(stint: any, settlement: SettlementResult) {
    const invoiceNumber = `INV-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

    return {
        invoiceNumber,
        employerId: stint.employerId,
        stintId: stint.id,
        invoiceType: 'booking_fee' as const,
        amount: settlement.bookingFeeAmount,
        currency: 'KES',
        description: `Booking fee for ${stint.role} stint on ${new Date(
            stint.shiftDate?.toDate?.() || stint.shiftDate
        ).toLocaleDateString()}`,
        dueAt: dueDate,
        isPaid: false,
        lineItems: [
            {
                description: `${stint.role} - ${stint.shiftType} shift`,
                rate: stint.offeredRate,
                quantity: 1,
                amount: stint.offeredRate,
            },
            {
                description: `Platform Booking Fee (${settlement.bookingFeePercent * 100}%)`,
                rate: settlement.bookingFeePercent * 100,
                quantity: 1,
                amount: settlement.bookingFeeAmount,
            },
        ],
    };
}
