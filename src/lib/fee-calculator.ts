// CareStint Fee Calculator
// =========================
// All fee calculations for the platform

import { DEFAULT_PLATFORM_CONFIG, type UrgencyType, type PlatformConfig } from './types';

/**
 * Calculate booking fee for a stint
 * - Normal notice (24h+): 15%
 * - Urgent (<24h): 20%
 */
export function calculateBookingFee(
    offeredRate: number,
    urgency: UrgencyType,
    config: PlatformConfig = DEFAULT_PLATFORM_CONFIG
): { percent: number; amount: number } {
    const percent = urgency === 'urgent'
        ? config.urgentBookingFeePercent
        : config.normalBookingFeePercent;

    const amount = Math.round((offeredRate * percent) / 100);

    return { percent, amount };
}

/**
 * Calculate professional platform/service fee
 * - Always 5% of offered rate
 */
export function calculateProfessionalFee(
    offeredRate: number,
    config: PlatformConfig = DEFAULT_PLATFORM_CONFIG
): { percent: number; amount: number } {
    const percent = config.professionalFeePercent;
    const amount = Math.round((offeredRate * percent) / 100);

    return { percent, amount };
}

/**
 * Calculate net payout for professional
 * Payout = offered_rate - platform_fee - M-Pesa_cost
 */
export function calculatePayout(
    offeredRate: number,
    mpesaCost: number = 0,
    config: PlatformConfig = DEFAULT_PLATFORM_CONFIG
): {
    grossAmount: number;
    platformFeePercent: number;
    platformFeeAmount: number;
    mpesaCost: number;
    netAmount: number;
} {
    const platformFee = calculateProfessionalFee(offeredRate, config);
    const netAmount = offeredRate - platformFee.amount - mpesaCost;

    return {
        grossAmount: offeredRate,
        platformFeePercent: platformFee.percent,
        platformFeeAmount: platformFee.amount,
        mpesaCost,
        netAmount: Math.max(0, netAmount),
    };
}

/**
 * Calculate cancellation fee for clinic
 * - KSh 1,000 or 20% of offered rate (whichever is higher)
 */
export function calculateCancellationFee(
    offeredRate: number,
    config: PlatformConfig = DEFAULT_PLATFORM_CONFIG
): number {
    const percentAmount = Math.round((offeredRate * config.cancellationFeePercent) / 100);
    return Math.max(config.minCancellationFee, percentAmount);
}

/**
 * Calculate permanent hire fee
 * - 35% of first month's salary
 */
export function calculatePermanentHireFee(
    monthlySalary: number,
    config: PlatformConfig = DEFAULT_PLATFORM_CONFIG
): number {
    return Math.round((monthlySalary * config.permanentHireFeePercent) / 100);
}

/**
 * Determine urgency based on hours until shift
 */
export function determineUrgency(
    shiftDate: Date,
    currentDate: Date = new Date()
): UrgencyType {
    const hoursUntilShift = (shiftDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60);
    return hoursUntilShift < 24 ? 'urgent' : 'normal';
}

/**
 * Calculate total clinic cost for a stint
 * Total = offered_rate + booking_fee
 */
export function calculateTotalClinicCost(
    offeredRate: number,
    urgency: UrgencyType,
    config: PlatformConfig = DEFAULT_PLATFORM_CONFIG
): {
    offeredRate: number;
    bookingFee: { percent: number; amount: number };
    totalCost: number;
} {
    const bookingFee = calculateBookingFee(offeredRate, urgency, config);

    return {
        offeredRate,
        bookingFee,
        totalCost: offeredRate + bookingFee.amount,
    };
}

/**
 * Get a breakdown of all fees for display purposes
 */
export function getFeeBreakdown(
    offeredRate: number,
    urgency: UrgencyType,
    mpesaCost: number = 35, // Default M-Pesa transaction cost
    config: PlatformConfig = DEFAULT_PLATFORM_CONFIG
): {
    // Clinic side
    clinicOfferedRate: number;
    clinicBookingFee: { percent: number; amount: number };
    clinicTotalCost: number;
    // Professional side
    proGrossAmount: number;
    proPlatformFee: { percent: number; amount: number };
    proMpesaCost: number;
    proNetPayout: number;
    // Platform
    platformRevenue: number;
} {
    const bookingFee = calculateBookingFee(offeredRate, urgency, config);
    const payout = calculatePayout(offeredRate, mpesaCost, config);

    return {
        // Clinic side
        clinicOfferedRate: offeredRate,
        clinicBookingFee: bookingFee,
        clinicTotalCost: offeredRate + bookingFee.amount,
        // Professional side
        proGrossAmount: payout.grossAmount,
        proPlatformFee: { percent: payout.platformFeePercent, amount: payout.platformFeeAmount },
        proMpesaCost: payout.mpesaCost,
        proNetPayout: payout.netAmount,
        // Platform revenue = booking fee + platform fee
        platformRevenue: bookingFee.amount + payout.platformFeeAmount,
    };
}

/**
 * Format currency for display
 */
export function formatCurrency(
    amount: number,
    currency: string = 'KSh'
): string {
    return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Estimate M-Pesa transaction cost based on amount
 * This is a simplified model - real costs vary by amount tier
 */
export function estimateMpesaCost(amount: number): number {
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
    return 108; // Max charge
}
