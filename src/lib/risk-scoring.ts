'use client';

import { db } from './firebase/clientApp';
import { collection, getDocs, query, where, updateDoc, doc, Timestamp } from 'firebase/firestore';

// Risk level thresholds
const RISK_THRESHOLDS = {
    LOW: { min: 0, max: 30 },
    MEDIUM: { min: 31, max: 60 },
    HIGH: { min: 61, max: 100 },
};

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface RiskFactors {
    cancellationRate: number;
    disputeCount: number;
    latePayments: number;
    noShows: number;
    lateClockIns: number;
    averageRating: number;
    recentActivitySpike: boolean;
    verificationStatus: string;
    documentsExpired: boolean;
}

export interface RiskScore {
    score: number;
    level: RiskLevel;
    factors: string[];
    lastCalculated: Date;
}

// Calculate employer risk score
export function calculateEmployerRiskScore(factors: Partial<RiskFactors>): RiskScore {
    let score = 0;
    const riskFactors: string[] = [];

    // Cancellation rate (0-30 points)
    const cancellationRate = factors.cancellationRate || 0;
    if (cancellationRate > 20) {
        score += 30;
        riskFactors.push('High cancellation rate (>20%)');
    } else if (cancellationRate > 10) {
        score += 15;
        riskFactors.push('Moderate cancellation rate (>10%)');
    } else if (cancellationRate > 5) {
        score += 5;
    }

    // Disputes (0-25 points)
    const disputeCount = factors.disputeCount || 0;
    if (disputeCount >= 5) {
        score += 25;
        riskFactors.push('Multiple disputes (5+)');
    } else if (disputeCount >= 2) {
        score += 10;
        riskFactors.push('Some disputes opened');
    }

    // Late payments (0-20 points)
    const latePayments = factors.latePayments || 0;
    if (latePayments >= 3) {
        score += 20;
        riskFactors.push('Recurring late payments');
    } else if (latePayments >= 1) {
        score += 8;
    }

    // Verification status (0-15 points)
    if (factors.verificationStatus === 'pending_validation') {
        score += 15;
        riskFactors.push('Pending verification');
    } else if (factors.verificationStatus === 'needs_manual_review') {
        score += 10;
        riskFactors.push('Needs manual review');
    }

    // Expired documents (0-10 points)
    if (factors.documentsExpired) {
        score += 10;
        riskFactors.push('Documents expired');
    }

    // Cap at 100
    score = Math.min(score, 100);

    // Determine level
    let level: RiskLevel = 'Low';
    if (score > RISK_THRESHOLDS.HIGH.min) {
        level = 'High';
    } else if (score > RISK_THRESHOLDS.MEDIUM.min) {
        level = 'Medium';
    }

    return {
        score,
        level,
        factors: riskFactors,
        lastCalculated: new Date(),
    };
}

// Calculate professional risk score
export function calculateProfessionalRiskScore(factors: Partial<RiskFactors>): RiskScore {
    let score = 0;
    const riskFactors: string[] = [];

    // No-shows (0-30 points)
    const noShows = factors.noShows || 0;
    if (noShows >= 3) {
        score += 30;
        riskFactors.push('Multiple no-shows (3+)');
    } else if (noShows >= 1) {
        score += 15;
        riskFactors.push('Has no-show history');
    }

    // Late clock-ins (0-20 points)
    const lateClockIns = factors.lateClockIns || 0;
    if (lateClockIns >= 5) {
        score += 20;
        riskFactors.push('Frequent late arrivals');
    } else if (lateClockIns >= 2) {
        score += 8;
    }

    // Low ratings (0-25 points)
    const avgRating = factors.averageRating || 5;
    if (avgRating < 3.0) {
        score += 25;
        riskFactors.push('Low average rating (<3.0)');
    } else if (avgRating < 4.0) {
        score += 10;
        riskFactors.push('Below average rating (<4.0)');
    }

    // Disputes (0-15 points)
    const disputeCount = factors.disputeCount || 0;
    if (disputeCount >= 3) {
        score += 15;
        riskFactors.push('Multiple disputes');
    } else if (disputeCount >= 1) {
        score += 5;
    }

    // Verification status (0-10 points)
    if (factors.verificationStatus === 'pending_validation') {
        score += 10;
        riskFactors.push('Pending verification');
    }

    // Recent activity spike
    if (factors.recentActivitySpike) {
        score += 5;
        riskFactors.push('Unusual activity pattern');
    }

    // Cap at 100
    score = Math.min(score, 100);

    // Determine level
    let level: RiskLevel = 'Low';
    if (score > RISK_THRESHOLDS.HIGH.min) {
        level = 'High';
    } else if (score > RISK_THRESHOLDS.MEDIUM.min) {
        level = 'Medium';
    }

    return {
        score,
        level,
        factors: riskFactors,
        lastCalculated: new Date(),
    };
}

// Update employer risk score in Firestore
export async function updateEmployerRiskScore(employerId: string): Promise<RiskScore | null> {
    if (!db) return null;

    try {
        // Get employer data
        const employerDoc = await getDocs(query(collection(db, 'employers'), where('__name__', '==', employerId)));
        if (employerDoc.empty) return null;

        const employer = employerDoc.docs[0].data();

        // Get disputes count
        const disputesQuery = query(collection(db, 'disputes'), where('employerId', '==', employerId));
        const disputesSnapshot = await getDocs(disputesQuery);

        // Calculate risk
        const riskScore = calculateEmployerRiskScore({
            cancellationRate: employer.cancellationRate || 0,
            disputeCount: disputesSnapshot.size,
            latePayments: employer.latePayments || 0,
            verificationStatus: employer.status,
            documentsExpired: employer.permitExpiryDate ? new Date(employer.permitExpiryDate) < new Date() : false,
        });

        // Update employer document
        const docRef = doc(db, 'employers', employerId);
        await updateDoc(docRef, {
            riskScore: riskScore.score,
            riskLevel: riskScore.level,
            riskFactors: riskScore.factors,
            riskCalculatedAt: Timestamp.now(),
        });

        return riskScore;
    } catch (error) {
        console.error('Error updating employer risk score:', error);
        return null;
    }
}

// Update professional risk score in Firestore
export async function updateProfessionalRiskScore(professionalId: string): Promise<RiskScore | null> {
    if (!db) return null;

    try {
        // Get professional data
        const professionalDoc = await getDocs(query(collection(db, 'professionals'), where('__name__', '==', professionalId)));
        if (professionalDoc.empty) return null;

        const professional = professionalDoc.docs[0].data();

        // Get disputes count
        const disputesQuery = query(collection(db, 'disputes'), where('professionalId', '==', professionalId));
        const disputesSnapshot = await getDocs(disputesQuery);

        // Calculate risk
        const riskScore = calculateProfessionalRiskScore({
            noShows: professional.noShows || 0,
            lateClockIns: professional.lateClockIns || 0,
            averageRating: professional.averageRating || 5,
            disputeCount: disputesSnapshot.size,
            verificationStatus: professional.status,
            recentActivitySpike: false, // Would require more complex calculation
        });

        // Update professional document
        const docRef = doc(db, 'professionals', professionalId);
        await updateDoc(docRef, {
            riskScore: riskScore.score,
            riskLevel: riskScore.level,
            riskFactors: riskScore.factors,
            riskCalculatedAt: Timestamp.now(),
        });

        return riskScore;
    } catch (error) {
        console.error('Error updating professional risk score:', error);
        return null;
    }
}

// Batch update all risk scores
export async function recalculateAllRiskScores(): Promise<{ employers: number; professionals: number }> {
    if (!db) return { employers: 0, professionals: 0 };

    let employersUpdated = 0;
    let professionalsUpdated = 0;

    try {
        // Update all employers
        const employersSnapshot = await getDocs(collection(db, 'employers'));
        for (const employerDoc of employersSnapshot.docs) {
            const result = await updateEmployerRiskScore(employerDoc.id);
            if (result) employersUpdated++;
        }

        // Update all professionals
        const professionalsSnapshot = await getDocs(collection(db, 'professionals'));
        for (const professionalDoc of professionalsSnapshot.docs) {
            const result = await updateProfessionalRiskScore(professionalDoc.id);
            if (result) professionalsUpdated++;
        }
    } catch (error) {
        console.error('Error in batch risk score update:', error);
    }

    return { employers: employersUpdated, professionals: professionalsUpdated };
}

// Get risk distribution for analytics
export async function getRiskDistribution(): Promise<{
    employers: { low: number; medium: number; high: number };
    professionals: { low: number; medium: number; high: number };
}> {
    const result = {
        employers: { low: 0, medium: 0, high: 0 },
        professionals: { low: 0, medium: 0, high: 0 },
    };

    if (!db) return result;

    try {
        // Count employers by risk level
        const employersSnapshot = await getDocs(collection(db, 'employers'));
        employersSnapshot.forEach(doc => {
            const data = doc.data();
            const level = (data.riskLevel || 'Low').toLowerCase();
            if (level === 'low') result.employers.low++;
            else if (level === 'medium') result.employers.medium++;
            else if (level === 'high') result.employers.high++;
        });

        // Count professionals by risk level
        const professionalsSnapshot = await getDocs(collection(db, 'professionals'));
        professionalsSnapshot.forEach(doc => {
            const data = doc.data();
            const level = (data.riskLevel || 'Low').toLowerCase();
            if (level === 'low') result.professionals.low++;
            else if (level === 'medium') result.professionals.medium++;
            else if (level === 'high') result.professionals.high++;
        });
    } catch (error) {
        console.error('Error getting risk distribution:', error);
    }

    return result;
}
