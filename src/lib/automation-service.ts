// CareStint Automation Services
// Client-side automation logic for KYC verification, risk scoring, and moderation

import { DEFAULT_PLATFORM_CONFIG, type RiskLevel, type ProfessionalRole } from '@/lib/types';

// =============================================
// KYC VERIFICATION SERVICE
// =============================================

interface KYCResult {
    isAutoApproved: boolean;
    needsManualReview: boolean;
    verificationScore: number;
    suspicionScore: number;
    flags: string[];
}

// License number patterns by country
const LICENSE_PATTERNS: Record<string, RegExp> = {
    'Kenya': /^[A-Z]{2,3}\d{4,8}$/i,
    'Uganda': /^[A-Z]{1,3}\/\d{4,6}$/i,
    'Tanzania': /^MCT\/\d{4,8}$/i,
};

export function verifyEmployerKYC(employerData: {
    licenseNumber: string;
    country?: string;
    phone?: string;
    email?: string;
    city?: string;
    licenseDocument?: string;
}): KYCResult {
    const flags: string[] = [];
    let verificationScore = 50; // Start at 50
    let suspicionScore = 0;

    // Check license number format
    const country = employerData.country || 'Kenya';
    const pattern = LICENSE_PATTERNS[country] || LICENSE_PATTERNS['Kenya'];

    if (pattern.test(employerData.licenseNumber)) {
        verificationScore += 20;
    } else {
        verificationScore -= 10;
        flags.push('License number format does not match expected pattern');
    }

    // Check if document was uploaded
    if (employerData.licenseDocument) {
        verificationScore += 15;
    } else {
        flags.push('License document not uploaded');
    }

    // Check phone/email domain consistency
    if (employerData.email && employerData.phone) {
        // Check for common suspicious patterns
        if (employerData.email.includes('test') || employerData.email.includes('temp')) {
            suspicionScore += 20;
            flags.push('Suspicious email pattern detected');
        }
    }

    // Normalize scores
    verificationScore = Math.max(0, Math.min(100, verificationScore));
    suspicionScore = Math.max(0, Math.min(100, suspicionScore));

    return {
        isAutoApproved: verificationScore >= 80 && suspicionScore < 20 && flags.length === 0,
        needsManualReview: verificationScore < 80 || suspicionScore >= 20 || flags.length > 0,
        verificationScore,
        suspicionScore,
        flags,
    };
}

export function verifyProfessionalKYC(professionalData: {
    licenseNumber: string;
    issuingBody?: string;
    phone?: string;
    email?: string;
    locations?: string;
    licenseDocument?: string;
    idDocument?: string;
}): KYCResult {
    const flags: string[] = [];
    let verificationScore = 50;
    let suspicionScore = 0;

    // Check license number
    if (professionalData.licenseNumber && professionalData.licenseNumber.length >= 5) {
        verificationScore += 15;
    } else {
        verificationScore -= 10;
        flags.push('License number too short or missing');
    }

    // Check issuing body
    if (professionalData.issuingBody) {
        verificationScore += 10;
    }

    // Check documents
    if (professionalData.licenseDocument) {
        verificationScore += 15;
    } else {
        flags.push('License document not uploaded');
    }

    if (professionalData.idDocument) {
        verificationScore += 10;
    } else {
        flags.push('ID document not uploaded');
    }

    // Normalize
    verificationScore = Math.max(0, Math.min(100, verificationScore));
    suspicionScore = Math.max(0, Math.min(100, suspicionScore));

    return {
        isAutoApproved: verificationScore >= 80 && suspicionScore < 20 && flags.length <= 1,
        needsManualReview: verificationScore < 80 || suspicionScore >= 20 || flags.length > 1,
        verificationScore,
        suspicionScore,
        flags,
    };
}

// =============================================
// RISK SCORING SERVICE
// =============================================

interface RiskScoreResult {
    score: number;
    level: RiskLevel;
    factors: string[];
}

export function calculateEmployerRiskScore(metrics: {
    totalStints: number;
    cancelledStints: number;
    disputeCount: number;
    latePayments: number;
    completedStints: number;
}): RiskScoreResult {
    const factors: string[] = [];
    let score = 0;

    // Cancellation rate
    if (metrics.totalStints > 0) {
        const cancellationRate = (metrics.cancelledStints / metrics.totalStints) * 100;
        if (cancellationRate > 30) {
            score += 30;
            factors.push(`High cancellation rate: ${cancellationRate.toFixed(1)}%`);
        } else if (cancellationRate > 15) {
            score += 15;
            factors.push(`Moderate cancellation rate: ${cancellationRate.toFixed(1)}%`);
        }
    }

    // Dispute count
    if (metrics.disputeCount >= 5) {
        score += 30;
        factors.push(`High dispute count: ${metrics.disputeCount}`);
    } else if (metrics.disputeCount >= 2) {
        score += 15;
        factors.push(`Multiple disputes: ${metrics.disputeCount}`);
    }

    // Late payments
    if (metrics.latePayments >= 3) {
        score += 25;
        factors.push(`Multiple late payments: ${metrics.latePayments}`);
    } else if (metrics.latePayments >= 1) {
        score += 10;
        factors.push(`Late payment recorded`);
    }

    // Normalize score
    score = Math.min(100, score);

    // Determine level
    let level: RiskLevel = 'Low';
    if (score >= DEFAULT_PLATFORM_CONFIG.highRiskThreshold) {
        level = 'High';
    } else if (score >= DEFAULT_PLATFORM_CONFIG.mediumRiskThreshold) {
        level = 'Medium';
    }

    return { score, level, factors };
}

export function calculateProfessionalRiskScore(metrics: {
    totalStints: number;
    noShows: number;
    lateClockIns: number;
    lowRatings: number;
    averageRating: number;
    recentStintSpike: boolean;
}): RiskScoreResult {
    const factors: string[] = [];
    let score = 0;

    // No-show rate
    if (metrics.totalStints > 0) {
        const noShowRate = (metrics.noShows / metrics.totalStints) * 100;
        if (noShowRate > 20) {
            score += 35;
            factors.push(`High no-show rate: ${noShowRate.toFixed(1)}%`);
        } else if (noShowRate > 10) {
            score += 20;
            factors.push(`Moderate no-show rate: ${noShowRate.toFixed(1)}%`);
        }
    }

    // Late clock-ins
    if (metrics.lateClockIns >= 5) {
        score += 20;
        factors.push(`Frequent late clock-ins: ${metrics.lateClockIns}`);
    } else if (metrics.lateClockIns >= 2) {
        score += 10;
        factors.push(`Some late clock-ins: ${metrics.lateClockIns}`);
    }

    // Low ratings
    if (metrics.averageRating < 3.0 && metrics.lowRatings >= 3) {
        score += 25;
        factors.push(`Low average rating: ${metrics.averageRating.toFixed(1)}`);
    } else if (metrics.averageRating < 3.5) {
        score += 10;
        factors.push(`Below average rating: ${metrics.averageRating.toFixed(1)}`);
    }

    // Stint spike (potential fraud indicator)
    if (metrics.recentStintSpike) {
        score += 15;
        factors.push('Unusual spike in stint activity');
    }

    // Normalize
    score = Math.min(100, score);

    let level: RiskLevel = 'Low';
    if (score >= DEFAULT_PLATFORM_CONFIG.highRiskThreshold) {
        level = 'High';
    } else if (score >= DEFAULT_PLATFORM_CONFIG.mediumRiskThreshold) {
        level = 'Medium';
    }

    return { score, level, factors };
}

// =============================================
// STINT MODERATION SERVICE
// =============================================

interface ModerationResult {
    isFlagged: boolean;
    flagReasons: string[];
    autoReject: boolean;
}

// Minimum rates by role (in KES)
const MINIMUM_RATES: Record<ProfessionalRole, number> = {
    'dentist': 3000,
    'rn': 2000,
    'clinical-officer': 2500,
    'lab-tech': 2000,
    'pharmacist': 2500,
    'radiographer': 2500,
    'physiotherapist': 2500,
    'midwife': 2000,
    'other': 1500,
};

export function moderateStintPosting(stintData: {
    role: ProfessionalRole;
    offeredRate: number;
    shiftType: 'half-day' | 'full-day';
    description?: string;
    employerId: string;
    recentPostCount?: number; // Posts in last 24h
}): ModerationResult {
    const flagReasons: string[] = [];
    let autoReject = false;

    // Check minimum rate
    const minRate = MINIMUM_RATES[stintData.role] || MINIMUM_RATES['other'];
    const adjustedMin = stintData.shiftType === 'half-day' ? minRate * 0.5 : minRate;

    if (stintData.offeredRate < adjustedMin) {
        flagReasons.push(`Rate below regional minimum for ${stintData.role}: KES ${adjustedMin}`);
    }

    // Check for duplicate/spam posting
    if (stintData.recentPostCount && stintData.recentPostCount > 7) {
        flagReasons.push('Excessive posting frequency detected');
    }

    // Check for suspicious patterns in description
    if (stintData.description) {
        const lowerDesc = stintData.description.toLowerCase();
        const suspiciousTerms = ['cash only', 'no questions', 'urgent money', 'personal number'];
        for (const term of suspiciousTerms) {
            if (lowerDesc.includes(term)) {
                flagReasons.push(`Suspicious content in description: "${term}"`);
            }
        }
    }

    // Check for unusually high rates (potential scam)
    if (stintData.offeredRate > minRate * 5) {
        flagReasons.push('Unusually high rate - possible fraud');
    }

    return {
        isFlagged: flagReasons.length > 0,
        flagReasons,
        autoReject: autoReject || flagReasons.length >= 3,
    };
}

// =============================================
// SETTLEMENT CALCULATIONS
// =============================================

interface SettlementCalculation {
    clinicCharge: number;
    bookingFee: number;
    professionalGross: number;
    platformFee: number;
    mpesaCost: number;
    professionalNet: number;
}

export function calculateSettlement(
    offeredRate: number,
    isUrgent: boolean,
    payoutMethod: 'mpesa' | 'bank' = 'mpesa'
): SettlementCalculation {
    const bookingFeePercent = isUrgent
        ? DEFAULT_PLATFORM_CONFIG.urgentBookingFeePercent
        : DEFAULT_PLATFORM_CONFIG.normalBookingFeePercent;

    const bookingFee = Math.round(offeredRate * (bookingFeePercent / 100));
    const clinicCharge = offeredRate + bookingFee;

    const platformFee = Math.round(offeredRate * (DEFAULT_PLATFORM_CONFIG.professionalFeePercent / 100));

    // M-Pesa cost estimate (simplified)
    const mpesaCost = payoutMethod === 'mpesa'
        ? Math.min(60, Math.round(offeredRate * 0.01)) // ~1% with cap
        : 0;

    const professionalNet = offeredRate - platformFee - mpesaCost;

    return {
        clinicCharge,
        bookingFee,
        professionalGross: offeredRate,
        platformFee,
        mpesaCost,
        professionalNet,
    };
}

export function calculateCancellationFee(
    offeredRate: number,
    hoursBeforeShift: number
): { feeApplies: boolean; feeAmount: number; reason: string } {
    if (hoursBeforeShift >= DEFAULT_PLATFORM_CONFIG.cancellationWindowHours) {
        return {
            feeApplies: false,
            feeAmount: 0,
            reason: 'Cancelled within allowed window',
        };
    }

    const percentFee = Math.round(offeredRate * (DEFAULT_PLATFORM_CONFIG.cancellationFeePercent / 100));
    const feeAmount = Math.max(DEFAULT_PLATFORM_CONFIG.minCancellationFee, percentFee);

    return {
        feeApplies: true,
        feeAmount,
        reason: `Cancelled less than ${DEFAULT_PLATFORM_CONFIG.cancellationWindowHours} hours before shift`,
    };
}
