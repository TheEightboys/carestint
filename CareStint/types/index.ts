// CareStint Data Types

// ===== Dual Role System =====

export type ActiveRole = 'employer' | 'professional';

export interface DualRoleInfo {
    hasEmployerRole: boolean;
    hasProfessionalRole: boolean;
    employerId?: string;
    professionalId?: string;
    employerStatus?: UserStatus;
    professionalStatus?: UserStatus;
    activeRole: ActiveRole;
}

// User authentication base
export interface User {
    id: string;
    email: string;
    phone: string;
    role: 'employer' | 'professional' | 'admin';
    // Dual role support
    employerId?: string;
    professionalId?: string;
    activeRole?: ActiveRole;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
}

export type UserStatus =
    | 'pending_validation'
    | 'auto_approved'
    | 'needs_manual_review'
    | 'rejected'
    | 'active'
    | 'suspended'
    | 'suspended_due_to_expiry';

// Employer / Clinic
export interface Employer {
    id: string;
    userId: string;
    facilityName: string;
    contactPerson: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    operatingDays: string[];
    staffSize: string;
    licenseNumber: string;
    licenseExpiry?: Date;
    payoutMethod: 'mpesa' | 'bank';
    billingEmail: string;
    status: UserStatus;
    riskScore: number;
    riskLabel: 'Low' | 'Medium' | 'High';
    stintsCount: number;
    subscriptionPlan?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface EmployerDocument {
    id: string;
    employerId: string;
    type: 'license' | 'registration' | 'permit';
    url: string;
    status: 'pending' | 'verified' | 'rejected';
    quality: 'ok' | 'low';
    uploadedAt: Date;
    verifiedAt?: Date;
}

// Professional
export interface Professional {
    id: string;
    userId: string;
    fullName: string;
    email: string;
    phone: string;
    preferredLocations: string[];
    licenseNumber: string;
    licenseIssuingBody: string;
    licenseCountry: string;
    licenseExpiry?: Date;
    primaryRole: string;
    yearsOfExperience: number;
    typicalDailyRate: number;
    availableShiftTypes: ('half_day' | 'full_day')[];
    mpesaPhone: string;
    bankAccount?: string;
    status: UserStatus;
    riskScore: number;
    riskLabel: 'Low' | 'Medium' | 'High';
    averageRating: number;
    totalStints: number;
    noShowCount: number;
    isTopProfessional: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProfessionalDocument {
    id: string;
    professionalId: string;
    type: 'license' | 'id' | 'certificate';
    url: string;
    status: 'pending' | 'verified' | 'rejected';
    quality: 'ok' | 'low';
    uploadedAt: Date;
    verifiedAt?: Date;
}

// Stint
export interface Stint {
    id: string;
    employerId: string;
    employerName: string;
    city: string;
    country: string;
    profession: string;
    shiftType: 'half_day' | 'full_day';
    shiftDate: Date;
    startTime?: string;
    endTime?: string;
    offeredRate: number;
    currency: 'KSh' | 'UGx' | 'TZs';
    allowBids: boolean;
    isUrgent: boolean;
    bookingFee: number;
    description?: string;
    status: StintStatus;
    confirmedProfessionalId?: string;
    confirmedProfessionalName?: string;
    clockInTime?: Date;
    clockOutTime?: Date;
    completedAt?: Date;
    disputeWindowEnds?: Date;
    readyForSettlement: boolean;
    isFlagged: boolean;
    flagReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type StintStatus =
    | 'open'
    | 'accepted'
    | 'in_progress'
    | 'completed'
    | 'disputed'
    | 'settled'
    | 'cancelled';

export interface StintApplication {
    id: string;
    stintId: string;
    professionalId: string;
    professionalName: string;
    professionalRole: string;
    professionalRating?: number;
    bidAmount?: number;
    message?: string;
    status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
    appliedAt: Date;
    respondedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

// Dispute
export interface Dispute {
    id: string;
    stintId: string;
    raisedBy: 'employer' | 'professional';
    raiserId: string;
    reason: string;
    description: string;
    status: DisputeStatus;
    resolution?: string;
    suggestedResolution?: string;
    resolvedAt?: Date;
    createdAt: Date;
}

export type DisputeStatus =
    | 'open'
    | 'under_review'
    | 'resolved'
    | 'escalated'
    | 'closed_no_response';

// Payout
export interface Payout {
    id: string;
    stintId: string;
    professionalId: string;
    offeredRate: number;
    platformFee: number;
    mpesaCost: number;
    netAmount: number;
    currency: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    transactionId?: string;
    failureReason?: string;
    processedAt?: Date;
    createdAt: Date;
}

// Invoice
export interface Invoice {
    id: string;
    employerId: string;
    stintId?: string;
    type: 'booking_fee' | 'cancellation_fee' | 'permanent_hire';
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'overdue';
    dueDate: Date;
    paidAt?: Date;
    createdAt: Date;
}

// Notification
export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    link?: string;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
}

// Audit Log
export interface AuditLog {
    id: string;
    actorType: 'admin' | 'system' | 'employer' | 'professional';
    actorId: string;
    entityType: 'employer' | 'professional' | 'stint' | 'payout' | 'config' | 'dispute';
    entityId: string;
    action: string;
    metadata?: Record<string, any>;
    timestamp: Date;
}

// Risk Score
export interface RiskScore {
    id: string;
    entityType: 'employer' | 'professional';
    entityId: string;
    score: number;
    label: 'Low' | 'Medium' | 'High';
    factors: {
        name: string;
        impact: number;
        description: string;
    }[];
    calculatedAt: Date;
}

// Marketplace Insight
export interface MarketplaceInsight {
    id: string;
    region: string;
    role: string;
    metric: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
    period: 'daily' | 'weekly' | 'monthly';
    calculatedAt: Date;
}

// Onboarding form types
export interface EmployerOnboardingData {
    // Step 1 - Facility details
    facilityName: string;
    contactPerson: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    operatingDays: string[];
    staffSize: string;
    // Step 2 - License
    licenseNumber: string;
    // Step 3 - Billing
    payoutMethod: 'mpesa' | 'bank';
    billingEmail: string;
}

export interface ProfessionalOnboardingData {
    // Step 1 - Profile
    fullName: string;
    email: string;
    phone: string;
    preferredLocations: string[];
    // Step 2 - Credentials
    licenseNumber: string;
    licenseIssuingBody: string;
    licenseCountry: string;
    // Step 3 - Role & Experience
    primaryRole: string;
    yearsOfExperience: number;
    typicalDailyRate: number;
    availableShiftTypes: ('half_day' | 'full_day')[];
    // Step 4 - Payout
    mpesaPhone: string;
    bankAccount?: string;
}

// Stint posting form
export interface StintPostingData {
    profession: string;
    shiftType: 'half_day' | 'full_day';
    shiftDate: Date;
    offeredRate: number;
    allowBids: boolean;
    isUrgent: boolean;
    description?: string;
}
