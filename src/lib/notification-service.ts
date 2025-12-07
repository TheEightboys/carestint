/**
 * Notification Service
 * Handles notification templates and event-based triggers
 * Note: Actual SMS/Email sending requires backend integration
 */

// Notification channels
export type NotificationChannel = 'sms' | 'email' | 'push' | 'in_app';

// Notification types
export type NotificationType =
    | 'account_approved'
    | 'account_rejected'
    | 'account_suspended'
    | 'license_expiring'
    | 'license_expired'
    | 'stint_posted'
    | 'application_received'
    | 'application_accepted'
    | 'application_rejected'
    | 'stint_reminder'
    | 'clock_in_reminder'
    | 'stint_completed'
    | 'dispute_opened'
    | 'dispute_resolved'
    | 'payout_scheduled'
    | 'payout_completed'
    | 'payout_failed'
    | 'invoice_generated'
    | 'invoice_overdue';

// Notification recipient types
export type RecipientType = 'employer' | 'professional' | 'superadmin';

interface NotificationData {
    type: NotificationType;
    recipientId: string;
    recipientType: RecipientType;
    recipientPhone?: string;
    recipientEmail?: string;
    channels: NotificationChannel[];
    title: string;
    message: string;
    metadata?: Record<string, any>;
    createdAt?: Date;
    sentAt?: Date;
    status?: 'pending' | 'sent' | 'failed' | 'read';
}

// Notification templates
const NOTIFICATION_TEMPLATES: Record<
    NotificationType,
    { title: string; message: string }
> = {
    account_approved: {
        title: 'Account Approved! 🎉',
        message:
            'Congratulations! Your CareStint account has been approved. You can now start {{action}}.',
    },
    account_rejected: {
        title: 'Account Application Update',
        message:
            'Your CareStint account application was not approved. Reason: {{reason}}. Please contact support for assistance.',
    },
    account_suspended: {
        title: 'Account Suspended',
        message:
            'Your CareStint account has been suspended. Reason: {{reason}}. Please contact support.',
    },
    license_expiring: {
        title: 'License Expiring Soon ⚠️',
        message:
            'Your {{licenseType}} license will expire in {{daysLeft}} days. Please update your credentials.',
    },
    license_expired: {
        title: 'License Expired',
        message:
            'Your {{licenseType}} license has expired. Your account has been paused until updated.',
    },
    stint_posted: {
        title: 'New Stint Posted',
        message:
            'A new {{role}} stint is available in {{city}} for KES {{rate}}. Apply now!',
    },
    application_received: {
        title: 'New Application',
        message:
            '{{professionalName}} has applied for your {{role}} stint on {{date}}.',
    },
    application_accepted: {
        title: 'Application Accepted! 🎉',
        message:
            'Great news! Your application for {{role}} at {{facility}} has been accepted. Report time: {{startTime}}.',
    },
    application_rejected: {
        title: 'Application Update',
        message:
            'Your application for {{role}} at {{facility}} was not accepted. Keep applying to other stints!',
    },
    stint_reminder: {
        title: 'Stint Tomorrow 📅',
        message:
            'Reminder: You have a {{role}} stint at {{facility}} tomorrow at {{startTime}}.',
    },
    clock_in_reminder: {
        title: 'Time to Clock In ⏰',
        message:
            'Your stint at {{facility}} starts in 30 minutes. Open the app to clock in.',
    },
    stint_completed: {
        title: 'Stint Completed 🙌',
        message:
            'Great job! Your {{role}} stint has been completed. Your payout of KES {{netAmount}} will be processed within 24 hours.',
    },
    dispute_opened: {
        title: 'Dispute Opened',
        message:
            'A dispute has been opened for stint #{{stintId}}. Funds have been frozen pending resolution.',
    },
    dispute_resolved: {
        title: 'Dispute Resolved',
        message:
            'The dispute for stint #{{stintId}} has been resolved. {{resolution}}',
    },
    payout_scheduled: {
        title: 'Payout Scheduled',
        message:
            'Your payout of KES {{amount}} has been scheduled for {{date}}.',
    },
    payout_completed: {
        title: 'Payout Sent! 💰',
        message:
            'KES {{amount}} has been sent to your {{method}}. Transaction ID: {{transactionId}}.',
    },
    payout_failed: {
        title: 'Payout Failed',
        message:
            'Your payout of KES {{amount}} failed. We will retry automatically. Please check your payment details.',
    },
    invoice_generated: {
        title: 'New Invoice',
        message:
            'Invoice #{{invoiceNumber}} for KES {{amount}} has been generated. Due date: {{dueDate}}.',
    },
    invoice_overdue: {
        title: 'Invoice Overdue ⚠️',
        message:
            'Invoice #{{invoiceNumber}} for KES {{amount}} is overdue. Please make payment to avoid service interruption.',
    },
};

/**
 * Create a notification from a template
 */
export function createNotification(
    type: NotificationType,
    recipientId: string,
    recipientType: RecipientType,
    templateData: Record<string, string | number>,
    options?: {
        channels?: NotificationChannel[];
        recipientPhone?: string;
        recipientEmail?: string;
    }
): NotificationData {
    const template = NOTIFICATION_TEMPLATES[type];

    // Replace template placeholders
    let title = template.title;
    let message = template.message;

    Object.entries(templateData).forEach(([key, value]) => {
        title = title.replace(`{{${key}}}`, String(value));
        message = message.replace(`{{${key}}}`, String(value));
    });

    return {
        type,
        recipientId,
        recipientType,
        recipientPhone: options?.recipientPhone,
        recipientEmail: options?.recipientEmail,
        channels: options?.channels || ['in_app'],
        title,
        message,
        metadata: templateData,
        createdAt: new Date(),
        status: 'pending',
    };
}

/**
 * Notification triggers for various events
 */
export const NotificationTriggers = {
    // Employer approved
    onEmployerApproved: (employer: any) =>
        createNotification(
            'account_approved',
            employer.id,
            'employer',
            { action: 'posting stints and finding professionals' },
            { recipientPhone: employer.phone, recipientEmail: employer.billingEmail }
        ),

    // Professional approved
    onProfessionalApproved: (professional: any) =>
        createNotification(
            'account_approved',
            professional.id,
            'professional',
            { action: 'applying for stints in your area' },
            { recipientPhone: professional.phone, recipientEmail: professional.email }
        ),

    // Application accepted
    onApplicationAccepted: (
        professional: any,
        stint: any,
        employer: any
    ) =>
        createNotification(
            'application_accepted',
            professional.id,
            'professional',
            {
                role: stint.role?.replace('-', ' '),
                facility: employer.facilityName,
                startTime: stint.startTime,
            },
            { recipientPhone: professional.phone, channels: ['sms', 'in_app'] }
        ),

    // New application received
    onApplicationReceived: (employer: any, professional: any, stint: any) =>
        createNotification(
            'application_received',
            employer.id,
            'employer',
            {
                professionalName: professional.fullName,
                role: stint.role?.replace('-', ' '),
                date: new Date(stint.shiftDate?.toDate?.() || stint.shiftDate).toLocaleDateString(),
            },
            { recipientEmail: employer.billingEmail, channels: ['email', 'in_app'] }
        ),

    // Stint completed
    onStintCompleted: (professional: any, settlement: any) =>
        createNotification(
            'stint_completed',
            professional.id,
            'professional',
            {
                role: settlement.role?.replace('-', ' ') || 'Healthcare',
                netAmount: settlement.netPayout.toLocaleString(),
            },
            { recipientPhone: professional.phone, channels: ['sms', 'in_app'] }
        ),

    // Payout completed
    onPayoutCompleted: (professional: any, payout: any) =>
        createNotification(
            'payout_completed',
            professional.id,
            'professional',
            {
                amount: payout.netAmount.toLocaleString(),
                method: payout.payoutMethod === 'mpesa' ? 'M-Pesa' : 'bank account',
                transactionId: payout.externalTransactionId || 'N/A',
            },
            { recipientPhone: professional.phone, channels: ['sms', 'in_app'] }
        ),

    // License expiring
    onLicenseExpiring: (professional: any, daysLeft: number) =>
        createNotification(
            'license_expiring',
            professional.id,
            'professional',
            {
                licenseType: professional.primaryRole?.replace('-', ' ') || 'professional',
                daysLeft: daysLeft,
            },
            { recipientPhone: professional.phone, channels: ['sms', 'email', 'in_app'] }
        ),

    // Dispute opened
    onDisputeOpened: (recipientId: string, recipientType: RecipientType, stintId: string) =>
        createNotification(
            'dispute_opened',
            recipientId,
            recipientType,
            { stintId: stintId.slice(0, 8) },
            { channels: ['email', 'in_app'] }
        ),
};

/**
 * Log notification to Firestore (for tracking)
 * Actual sending would be handled by Cloud Functions
 */
export function prepareNotificationForSending(notification: NotificationData) {
    return {
        ...notification,
        createdAt: new Date(),
        status: 'pending',
        retryCount: 0,
    };
}

/**
 * Check if notification should be sent based on frequency limits
 */
export function shouldSendNotification(
    lastSentAt: Date | null,
    minIntervalMinutes: number = 60
): boolean {
    if (!lastSentAt) return true;
    const now = new Date();
    const diffMs = now.getTime() - lastSentAt.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    return diffMinutes >= minIntervalMinutes;
}
