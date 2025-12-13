// CareStint Core Types
// =====================

// ===== Status Enums =====

export type EmployerStatus =
    | 'pending_validation'
    | 'auto_approved'
    | 'needs_manual_review'
    | 'active'
    | 'suspended'
    | 'suspended_due_to_expiry'
    | 'rejected';

export type ProfessionalStatus =
    | 'pending_validation'
    | 'auto_approved'
    | 'needs_manual_review'
    | 'active'
    | 'suspended'
    | 'suspended_due_to_expiry'
    | 'rejected';

export type StintStatus =
    | 'pending'        // Stint posted but no pro confirmed
    | 'confirmed'      // Pro selected + accepted, upcoming
    | 'in_progress'    // Pro clocked in / shift started
    | 'completed'      // Shift ended, hours confirmed
    | 'cancelled'      // Cancelled (with sub-reason metadata)
    | 'expired'        // Not filled in time
    | 'no_show'        // Pro didn't attend
    | 'disputed'       // Hours or payment dispute
    | 'under_review'   // SuperAdmin flagged for review
    | 'closed';        // Rating done, archived

export type ApplicationStatus =
    | 'pending'
    | 'accepted'
    | 'rejected'
    | 'withdrawn';

export type DisputeStatus =
    | 'open'
    | 'under_review'
    | 'resolved'
    | 'escalated'
    | 'closed_no_response';

export type PayoutStatus =
    | 'pending'
    | 'ready_for_settlement'
    | 'processing'
    | 'completed'
    | 'failed';

export type DocumentQuality = 'ok' | 'low' | 'unreadable';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export type ShiftType = 'half-day' | 'full-day';

export type UrgencyType = 'normal' | 'urgent';

export type PayoutMethod = 'mpesa' | 'bank';

export type AuditAction =
    | 'EMPLOYER_CREATED'
    | 'EMPLOYER_APPROVED'
    | 'EMPLOYER_REJECTED'
    | 'EMPLOYER_SUSPENDED'
    | 'PROFESSIONAL_CREATED'
    | 'PROFESSIONAL_APPROVED'
    | 'PROFESSIONAL_REJECTED'
    | 'PROFESSIONAL_SUSPENDED'
    | 'STINT_CREATED'
    | 'STINT_ACCEPTED'
    | 'STINT_COMPLETED'
    | 'STINT_CANCELLED'
    | 'STINT_FLAGGED'
    | 'APPLICATION_SUBMITTED'
    | 'APPLICATION_ACCEPTED'
    | 'APPLICATION_REJECTED'
    | 'DISPUTE_OPENED'
    | 'DISPUTE_RESOLVED'
    | 'DISPUTE_ESCALATED'
    | 'PAYOUT_INITIATED'
    | 'PAYOUT_COMPLETED'
    | 'PAYOUT_FAILED'
    | 'KYC_AUTO_APPROVED'
    | 'KYC_FLAGGED'
    | 'LICENSE_VERIFIED'
    | 'LICENSE_EXPIRED'
    | 'RISK_SCORE_UPDATED'
    | 'CONFIG_UPDATED'
    | 'SUPERADMIN_CREATED'
    | 'APPLICATION_WITHDRAWN';

export type ActorType = 'superadmin' | 'system' | 'employer' | 'professional';

export type EntityType =
    | 'employer'
    | 'professional'
    | 'stint'
    | 'application'
    | 'dispute'
    | 'payout'
    | 'config'
    | 'superadmin';

// ===== Dual Role System =====

export type ActiveRole = 'employer' | 'professional';

export interface UserAccount {
    id: string;                          // Firebase UID
    email: string;
    phone?: string;
    employerId?: string;                 // Reference to employers collection
    professionalId?: string;             // Reference to professionals collection
    activeRole: ActiveRole;              // Current active mode
    createdAt: Date;
    updatedAt: Date;
}

export interface DualRoleInfo {
    hasEmployerRole: boolean;
    hasProfessionalRole: boolean;
    employerId?: string;
    professionalId?: string;
    employerStatus?: EmployerStatus;
    professionalStatus?: ProfessionalStatus;
    activeRole: ActiveRole;
}

// ===== Primary Roles =====

export type ProfessionalRole =
    | 'dentist'
    | 'rn'
    | 'clinical-officer'
    | 'lab-tech'
    | 'pharmacist'
    | 'radiographer'
    | 'physiotherapist'
    | 'midwife'
    | 'other';

export const PROFESSIONAL_ROLE_LABELS: Record<ProfessionalRole, string> = {
    'dentist': 'Dentist',
    'rn': 'Registered Nurse (RN)',
    'clinical-officer': 'Clinical Officer',
    'lab-tech': 'Lab Technician',
    'pharmacist': 'Pharmacist',
    'radiographer': 'Radiographer',
    'physiotherapist': 'Physiotherapist',
    'midwife': 'Midwife',
    'other': 'Other'
};

// ===== Core Entities =====

export interface Employer {
    id: string;
    // Basic info
    facilityName: string;
    contactPerson: string;
    email: string;
    phone: string;
    city: string;
    region?: string;
    country: string;
    operatingDays: string;
    staffSize: string;
    // License
    licenseNumber: string;
    licenseDocument?: string;
    licenseExpiryDate?: Date;
    // Billing
    payoutMethod: PayoutMethod;
    billingEmail: string;
    mpesaPhone?: string;
    bankAccount?: string;
    // Platform status
    status: EmployerStatus;
    riskScore: number;
    riskLevel: RiskLevel;
    verificationScore: number;
    documentQuality: DocumentQuality;
    suspicionScore: number;
    // Subscription (future)
    subscriptionPlanId?: string;
    monthlyStintQuota?: number;
    stintsPostedThisMonth: number;
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    approvedAt?: Date;
    suspendedAt?: Date;
    // Suspension details
    suspensionDays?: number | null;
    suspensionEndDate?: Date | null;
    suspensionReason?: string | null;
}

export interface Professional {
    id: string;
    // Basic info
    fullName: string;
    email: string;
    phone: string;
    locations: string;
    preferredRegions: string[];
    // License & credentials
    licenseNumber: string;
    issuingBody: string;
    licenseDocument?: string;
    idDocument?: string;
    licenseExpiryDate?: Date;
    // Role & experience
    primaryRole: ProfessionalRole;
    experience: number;
    dailyRate: number;
    shiftTypes: ShiftType[];
    // Payout
    mpesaPhone: string;
    bankAccount?: string;
    // Platform status
    status: ProfessionalStatus;
    riskScore: number;
    riskLevel: RiskLevel;
    verificationScore: number;
    documentQuality: DocumentQuality;
    suspicionScore: number;
    // Performance
    averageRating: number;
    totalRatings: number;
    completedStints: number;
    noShows: number;
    lateClockIns: number;
    isTopProfessional: boolean;
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    approvedAt?: Date;
    suspendedAt?: Date;
    lastActiveAt?: Date;
    // Suspension details
    suspensionDays?: number | null;
    suspensionEndDate?: Date | null;
    suspensionReason?: string | null;
}

export interface Stint {
    id: string;
    employerId: string;
    employerName: string;
    // Shift details
    role: ProfessionalRole;
    shiftType: ShiftType;
    shiftDate: Date;
    startTime: string;
    endTime: string;
    description?: string;
    // Location
    city: string;
    address?: string;
    // Pricing
    offeredRate: number;
    currency: string;
    allowBids: boolean;
    minBid?: number;
    maxBid?: number;
    // Urgency & fees
    urgency: UrgencyType;
    bookingFeePercent: number;
    bookingFeeAmount: number;
    // Status
    status: StintStatus;
    isFlagged: boolean;
    flagReason?: string;
    // Assigned professional
    acceptedProfessionalId?: string;
    acceptedProfessionalName?: string;
    acceptedAt?: Date;
    // Confirmation
    confirmedAt?: Date;
    // Clock in/out
    clockInTime?: Date;
    clockOutTime?: Date;
    // Completion
    completedAt?: Date;
    disputeWindowEndsAt?: Date;
    isReadyForSettlement: boolean;
    settledAt?: Date;
    // Cancellation
    cancelledAt?: Date;
    cancellationReason?: string;
    cancellationSubReason?: string;  // Detailed metadata for cancellation
    cancellationFeeApplied: boolean;
    cancellationFeeAmount?: number;
    // SuperAdmin fields
    internalNotes?: string;          // SuperAdmin only - internal notes
    penaltyAmount?: number;          // For no-shows/cancellations
    reliabilityImpact?: number;      // Impact on pro's reliability score
    reviewedBy?: string;             // SuperAdmin who reviewed
    reviewedAt?: Date;               // When it was reviewed
    // Expiry
    expiresAt?: Date;                // When stint auto-expires if not filled
    expiredAt?: Date;                // When stint actually expired
    // Closure
    closedAt?: Date;                 // When stint was archived
    employerRating?: number;         // Rating given by employer
    professionalRating?: number;     // Rating given by professional
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface StintApplication {
    id: string;
    stintId: string;
    professionalId: string;
    professionalName: string;
    professionalRole: ProfessionalRole;
    // Application details
    appliedAt: Date;
    isBid: boolean;
    bidAmount?: number;
    message?: string;
    // Status
    status: ApplicationStatus;
    respondedAt?: Date;
    rejectionReason?: string;
}

export interface Dispute {
    id: string;
    stintId: string;
    employerId: string;
    professionalId: string;
    // Dispute details
    openedBy: 'employer' | 'professional';
    openedAt: Date;
    issueType: string;
    description: string;
    // Evidence
    employerEvidence?: string;
    professionalEvidence?: string;
    // Resolution
    status: DisputeStatus;
    resolvedAt?: Date;
    resolution?: string;
    suggestedResolution?: string;
    // Payout impact
    fundsAreFrozen: boolean;
    finalPayoutAmount?: number;
    // Timestamps
    updatedAt: Date;
}

export interface Payout {
    id: string;
    stintId: string;
    professionalId: string;
    employerId: string;
    // Amounts
    grossAmount: number;
    platformFeePercent: number;
    platformFeeAmount: number;
    mpesaCost: number;
    netAmount: number;
    currency: string;
    // Status
    status: PayoutStatus;
    payoutMethod: PayoutMethod;
    // External reference
    externalTransactionId?: string;
    externalStatus?: string;
    // Timestamps
    scheduledAt: Date;
    processedAt?: Date;
    failedAt?: Date;
    failureReason?: string;
    retryCount: number;
    createdAt: Date;
}

export interface Invoice {
    id: string;
    employerId: string;
    stintId?: string;
    // Invoice details
    invoiceNumber: string;
    invoiceType: 'booking_fee' | 'cancellation_fee' | 'permanent_hire_fee';
    // Amounts
    amount: number;
    currency: string;
    description: string;
    // Status
    isPaid: boolean;
    paidAt?: Date;
    // Timestamps
    issuedAt: Date;
    dueAt: Date;
}

export interface Notification {
    id: string;
    recipientId: string;
    recipientType: 'employer' | 'professional' | 'superadmin';
    // Content
    templateId: string;
    title: string;
    message: string;
    // Delivery
    channel: 'email' | 'sms' | 'push' | 'in_app';
    sentAt?: Date;
    deliveredAt?: Date;
    readAt?: Date;
    // Metadata
    metadata?: Record<string, any>;
    createdAt: Date;
}

export interface AuditLog {
    id: string;
    timestamp: Date;
    // Actor
    actorType: ActorType;
    actorId?: string;
    actorName?: string;
    // Entity
    entityType: EntityType;
    entityId: string;
    // Action
    action: AuditAction;
    description: string;
    // Changes
    previousValue?: Record<string, any>;
    newValue?: Record<string, any>;
    metadata?: Record<string, any>;
    // IP & context
    ipAddress?: string;
    userAgent?: string;
}

export interface RiskScore {
    id: string;
    entityType: 'employer' | 'professional';
    entityId: string;
    // Scores
    overallScore: number;
    riskLevel: RiskLevel;
    // Factors (for employers)
    cancellationRate?: number;
    disputeCount?: number;
    latePaymentCount?: number;
    // Factors (for professionals)
    noShowCount?: number;
    lateClockInCount?: number;
    lowRatingCount?: number;
    stintSpike?: boolean;
    // Timestamps
    calculatedAt: Date;
    previousScore?: number;
}

export interface MarketplaceInsight {
    id: string;
    insightType: 'demand' | 'supply' | 'fill_rate' | 'cancellation';
    // Dimensions
    role?: ProfessionalRole;
    region?: string;
    city?: string;
    // Metrics
    value: number;
    previousValue?: number;
    percentChange?: number;
    period: 'daily' | 'weekly' | 'monthly';
    periodStart: Date;
    periodEnd: Date;
    // Timestamp
    calculatedAt: Date;
}

// ===== Platform Configuration =====

export interface PlatformConfig {
    // Fee structure
    normalBookingFeePercent: number;
    urgentBookingFeePercent: number;
    professionalFeePercent: number;
    permanentHireFeePercent: number;
    // Cancellation
    minCancellationFee: number;
    cancellationFeePercent: number;
    cancellationWindowHours: number;
    // Dispute
    disputeWindowHours: number;
    autoCloseDisputeHours: number;
    // Risk thresholds
    highRiskThreshold: number;
    mediumRiskThreshold: number;
    // License expiry
    licenseExpiryWarningDays: number;
    // Inactive
    inactiveWarningDays: number;
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
    normalBookingFeePercent: 15,
    urgentBookingFeePercent: 20,
    professionalFeePercent: 5,
    permanentHireFeePercent: 35,
    minCancellationFee: 1000, // KSh
    cancellationFeePercent: 20,
    cancellationWindowHours: 12,
    disputeWindowHours: 24,
    autoCloseDisputeHours: 48,
    highRiskThreshold: 70,
    mediumRiskThreshold: 40,
    licenseExpiryWarningDays: 30,
    inactiveWarningDays: 7,
};

// ===== API Response Types =====

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

// ===== Dashboard Stats =====

export interface SuperAdminStats {
    totalEmployers: number;
    pendingEmployers: number;
    activeEmployers: number;
    totalProfessionals: number;
    pendingProfessionals: number;
    activeProfessionals: number;
    totalStints: number;
    activeStints: number;
    disputedStints: number;
    grossVolume: number;
    platformRevenue: number;
    expiringLicenses: number;
    flaggedStints: number;
    openDisputes: number;
}

export interface EmployerDashboardStats {
    totalStintsPosted: number;
    activeStints: number;
    completedStints: number;
    pendingApplications: number;
    totalSpent: number;
    averageRating: number;
}

export interface ProfessionalDashboardStats {
    totalApplications: number;
    acceptedApplications: number;
    completedStints: number;
    totalEarnings: number;
    averageRating: number;
    upcomingStints: number;
}
