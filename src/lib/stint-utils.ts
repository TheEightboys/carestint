// CareStint Stint Utilities
// =========================
// Helpers for stint status display, filtering, and role-based actions

import { StintStatus } from './types';

// ===== Status Display Configuration =====

export interface StatusDisplayConfig {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
    description: string;
}

export const STINT_STATUS_DISPLAY: Record<StintStatus, StatusDisplayConfig> = {
    pending: {
        label: 'Pending',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        icon: 'Clock',
        description: 'Stint posted but no professional confirmed'
    },
    confirmed: {
        label: 'Confirmed',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        icon: 'CheckCircle',
        description: 'Professional selected and accepted, upcoming'
    },
    in_progress: {
        label: 'In Progress',
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        icon: 'Play',
        description: 'Professional clocked in, shift started'
    },
    completed: {
        label: 'Completed',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        icon: 'CheckCircle2',
        description: 'Shift ended, hours confirmed'
    },
    cancelled: {
        label: 'Cancelled',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100 dark:bg-gray-900/30',
        icon: 'XCircle',
        description: 'Cancelled by employer or professional'
    },
    expired: {
        label: 'Expired',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        icon: 'Clock',
        description: 'Not filled in time'
    },
    no_show: {
        label: 'No-Show',
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        icon: 'UserX',
        description: 'Professional did not attend'
    },
    disputed: {
        label: 'Disputed',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        icon: 'AlertTriangle',
        description: 'Hours or payment dispute opened'
    },
    under_review: {
        label: 'Under Review',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        icon: 'Eye',
        description: 'SuperAdmin reviewing this stint'
    },
    closed: {
        label: 'Closed',
        color: 'text-slate-600',
        bgColor: 'bg-slate-100 dark:bg-slate-900/30',
        icon: 'Archive',
        description: 'Rating done, archived'
    }
};

// ===== Tab Configuration for Each Role =====

export type TabId = string;

export interface TabConfig {
    id: TabId;
    label: string;
    description: string;
    statuses: StintStatus[];
    icon: string;
    emptyMessage: string;
}

// SuperAdmin sees ALL statuses with full control
export const SUPERADMIN_TABS: TabConfig[] = [
    {
        id: 'all',
        label: 'All Stints',
        description: 'View all stints across the platform',
        statuses: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'expired', 'no_show', 'disputed', 'under_review', 'closed'],
        icon: 'Briefcase',
        emptyMessage: 'No stints found'
    },
    {
        id: 'pending',
        label: 'Pending',
        description: 'Stints waiting for a professional',
        statuses: ['pending'],
        icon: 'Clock',
        emptyMessage: 'No pending stints'
    },
    {
        id: 'active',
        label: 'Active',
        description: 'Confirmed and in-progress stints',
        statuses: ['confirmed', 'in_progress'],
        icon: 'Zap',
        emptyMessage: 'No active stints'
    },
    {
        id: 'issues',
        label: 'Issues',
        description: 'Disputed, no-show, or under review',
        statuses: ['disputed', 'no_show', 'under_review'],
        icon: 'AlertTriangle',
        emptyMessage: 'No stints with issues'
    },
    {
        id: 'completed',
        label: 'Completed',
        description: 'Successfully completed stints',
        statuses: ['completed', 'closed'],
        icon: 'CheckCircle2',
        emptyMessage: 'No completed stints'
    },
    {
        id: 'cancelled',
        label: 'Cancelled & Expired',
        description: 'Cancelled or expired stints',
        statuses: ['cancelled', 'expired'],
        icon: 'XCircle',
        emptyMessage: 'No cancelled or expired stints'
    }
];

// Employer tabs - focused on their own stints
export const EMPLOYER_TABS: TabConfig[] = [
    {
        id: 'open',
        label: 'Open',
        description: 'Shifts posted that are not yet filled',
        statuses: ['pending'],
        icon: 'Plus',
        emptyMessage: 'No open shifts. Post a new stint!'
    },
    {
        id: 'upcoming',
        label: 'Upcoming',
        description: 'Filled shifts that haven\'t started yet',
        statuses: ['confirmed'],
        icon: 'Calendar',
        emptyMessage: 'No upcoming shifts scheduled'
    },
    {
        id: 'today',
        label: 'Today / In Progress',
        description: 'Shifts happening now',
        statuses: ['in_progress'],
        icon: 'Play',
        emptyMessage: 'No shifts in progress right now'
    },
    {
        id: 'completed',
        label: 'Completed',
        description: 'Finished shifts that went smoothly',
        statuses: ['completed', 'closed'],
        icon: 'CheckCircle2',
        emptyMessage: 'No completed shifts yet'
    },
    {
        id: 'cancelled',
        label: 'Cancelled & Expired',
        description: 'Shifts that didn\'t happen',
        statuses: ['cancelled', 'expired'],
        icon: 'XCircle',
        emptyMessage: 'No cancelled or expired shifts'
    },
    {
        id: 'issues',
        label: 'Issues',
        description: 'Shifts with disputes or no-shows',
        statuses: ['disputed', 'no_show', 'under_review'],
        icon: 'AlertTriangle',
        emptyMessage: 'No issues to review - great!'
    }
];

// Professional tabs - personal and earnings focused
export const PROFESSIONAL_TABS: TabConfig[] = [
    {
        id: 'available',
        label: 'Available',
        description: 'Open stints you can apply for',
        statuses: ['pending'],
        icon: 'Search',
        emptyMessage: 'No available stints right now. Check back soon!'
    },
    {
        id: 'upcoming',
        label: 'Upcoming',
        description: 'Shifts you\'ve been confirmed for',
        statuses: ['confirmed'],
        icon: 'Calendar',
        emptyMessage: 'No upcoming shifts. Apply for available stints!'
    },
    {
        id: 'today',
        label: 'Today / In Progress',
        description: 'Shifts you\'re currently working',
        statuses: ['in_progress'],
        icon: 'Play',
        emptyMessage: 'No shifts in progress'
    },
    {
        id: 'completed',
        label: 'Completed',
        description: 'Your past shifts with earnings',
        statuses: ['completed', 'closed'],
        icon: 'Wallet',
        emptyMessage: 'No completed shifts yet. Start earning today!'
    },
    {
        id: 'cancelled',
        label: 'Cancelled / Missed',
        description: 'Cancelled or missed shifts',
        statuses: ['cancelled', 'no_show'],
        icon: 'XCircle',
        emptyMessage: 'No cancelled or missed shifts'
    },
    {
        id: 'issues',
        label: 'Issues',
        description: 'Shifts under dispute or review',
        statuses: ['disputed', 'under_review'],
        icon: 'AlertCircle',
        emptyMessage: 'No disputes or issues'
    }
];

// ===== Actions Available per Status per Role =====

export interface ActionConfig {
    id: string;
    label: string;
    icon: string;
    variant: 'default' | 'destructive' | 'outline' | 'secondary';
    requiresConfirmation?: boolean;
    confirmationMessage?: string;
}

// Employer actions per status
export const EMPLOYER_ACTIONS: Record<StintStatus, ActionConfig[]> = {
    pending: [
        { id: 'edit', label: 'Edit Stint', icon: 'Edit', variant: 'outline' },
        { id: 'view_applicants', label: 'View Applicants', icon: 'Users', variant: 'default' },
        { id: 'cancel', label: 'Cancel Stint', icon: 'XCircle', variant: 'destructive', requiresConfirmation: true, confirmationMessage: 'Are you sure you want to cancel this stint?' }
    ],
    confirmed: [
        { id: 'view_pro', label: 'View Professional', icon: 'User', variant: 'outline' },
        { id: 'message', label: 'Message Pro', icon: 'MessageSquare', variant: 'outline' },
        { id: 'cancel', label: 'Cancel Stint', icon: 'XCircle', variant: 'destructive', requiresConfirmation: true, confirmationMessage: 'Cancelling may incur a penalty fee. Continue?' }
    ],
    in_progress: [
        { id: 'view_times', label: 'View Clock Times', icon: 'Clock', variant: 'outline' },
        { id: 'contact_support', label: 'Contact Support', icon: 'HelpCircle', variant: 'secondary' },
        { id: 'report_issue', label: 'Report Issue', icon: 'AlertTriangle', variant: 'destructive' }
    ],
    completed: [
        { id: 'confirm_hours', label: 'Confirm Hours', icon: 'CheckCircle', variant: 'default' },
        { id: 'rate_pro', label: 'Rate Professional', icon: 'Star', variant: 'outline' },
        { id: 'download_invoice', label: 'Download Invoice', icon: 'Download', variant: 'secondary' }
    ],
    cancelled: [
        { id: 'repost', label: 'Repost Stint', icon: 'RefreshCw', variant: 'default' },
        { id: 'view_reason', label: 'View Reason', icon: 'Info', variant: 'outline' }
    ],
    expired: [
        { id: 'repost', label: 'Repost Stint', icon: 'RefreshCw', variant: 'default' },
        { id: 'view_details', label: 'View Details', icon: 'Info', variant: 'outline' }
    ],
    no_show: [
        { id: 'add_evidence', label: 'Add Evidence', icon: 'FileText', variant: 'outline' },
        { id: 'view_status', label: 'View Review Status', icon: 'Eye', variant: 'secondary' },
        { id: 'repost', label: 'Repost Stint', icon: 'RefreshCw', variant: 'default' }
    ],
    disputed: [
        { id: 'add_evidence', label: 'Add Evidence', icon: 'FileText', variant: 'outline' },
        { id: 'view_status', label: 'Review Status', icon: 'Eye', variant: 'secondary' },
        { id: 'view_credits', label: 'View Credits/Refunds', icon: 'CreditCard', variant: 'outline' }
    ],
    under_review: [
        { id: 'view_status', label: 'View Review Status', icon: 'Eye', variant: 'secondary' },
        { id: 'contact_support', label: 'Contact Support', icon: 'HelpCircle', variant: 'outline' }
    ],
    closed: [
        { id: 'view_details', label: 'View Details', icon: 'Info', variant: 'outline' },
        { id: 'download_invoice', label: 'Download Invoice', icon: 'Download', variant: 'secondary' }
    ]
};

// Professional actions per status
export const PROFESSIONAL_ACTIONS: Record<StintStatus, ActionConfig[]> = {
    pending: [
        { id: 'view_details', label: 'View Details', icon: 'Info', variant: 'outline' },
        { id: 'apply', label: 'Apply Now', icon: 'Send', variant: 'default' },
        { id: 'save', label: 'Save for Later', icon: 'Bookmark', variant: 'secondary' }
    ],
    confirmed: [
        { id: 'view_clinic', label: 'View Clinic Details', icon: 'Building', variant: 'outline' },
        { id: 'add_calendar', label: 'Add to Calendar', icon: 'Calendar', variant: 'secondary' },
        { id: 'cancel', label: 'Cancel', icon: 'XCircle', variant: 'destructive', requiresConfirmation: true, confirmationMessage: 'Cancelling may affect your reliability score. Continue?' }
    ],
    in_progress: [
        { id: 'clock_in', label: 'Clock In', icon: 'LogIn', variant: 'default' },
        { id: 'clock_out', label: 'Clock Out', icon: 'LogOut', variant: 'default' },
        { id: 'view_shift', label: 'View Shift Details', icon: 'Clock', variant: 'outline' },
        { id: 'report_issue', label: 'Report Issue', icon: 'AlertTriangle', variant: 'destructive' }
    ],
    completed: [
        { id: 'view_earnings', label: 'View Earnings', icon: 'Wallet', variant: 'default' },
        { id: 'rate_clinic', label: 'Rate Clinic', icon: 'Star', variant: 'outline' },
        { id: 'download_statement', label: 'Download Statement', icon: 'Download', variant: 'secondary' }
    ],
    cancelled: [
        { id: 'view_reason', label: 'See Reason', icon: 'Info', variant: 'outline' },
        { id: 'view_policy', label: 'Read Policy', icon: 'FileText', variant: 'secondary' }
    ],
    expired: [
        { id: 'view_details', label: 'View Details', icon: 'Info', variant: 'outline' }
    ],
    no_show: [
        { id: 'view_reason', label: 'See Reason', icon: 'Info', variant: 'outline' },
        { id: 'view_policy', label: 'Read No-Show Policy', icon: 'FileText', variant: 'secondary' },
        { id: 'appeal', label: 'Appeal Decision', icon: 'MessageSquare', variant: 'outline' }
    ],
    disputed: [
        { id: 'upload_notes', label: 'Upload Notes', icon: 'Upload', variant: 'outline' },
        { id: 'view_status', label: 'Review Status', icon: 'Eye', variant: 'secondary' }
    ],
    under_review: [
        { id: 'view_status', label: 'View Review Status', icon: 'Eye', variant: 'secondary' },
        { id: 'upload_notes', label: 'Add Clarification', icon: 'Upload', variant: 'outline' }
    ],
    closed: [
        { id: 'view_details', label: 'View Details', icon: 'Info', variant: 'outline' },
        { id: 'view_earnings', label: 'View Earnings', icon: 'Wallet', variant: 'secondary' }
    ]
};

// SuperAdmin actions per status
export const SUPERADMIN_ACTIONS: Record<StintStatus, ActionConfig[]> = {
    pending: [
        { id: 'view_details', label: 'View Details', icon: 'Info', variant: 'outline' },
        { id: 'flag', label: 'Flag for Review', icon: 'Flag', variant: 'destructive' },
        { id: 'view_employer', label: 'View Employer', icon: 'Building', variant: 'secondary' }
    ],
    confirmed: [
        { id: 'view_details', label: 'View Details', icon: 'Info', variant: 'outline' },
        { id: 'view_pro', label: 'View Professional', icon: 'User', variant: 'secondary' },
        { id: 'under_review', label: 'Place Under Review', icon: 'Eye', variant: 'destructive' }
    ],
    in_progress: [
        { id: 'view_details', label: 'View Details', icon: 'Info', variant: 'outline' },
        { id: 'view_times', label: 'View Clock Times', icon: 'Clock', variant: 'secondary' },
        { id: 'under_review', label: 'Place Under Review', icon: 'Eye', variant: 'destructive' }
    ],
    completed: [
        { id: 'view_details', label: 'View Details', icon: 'Info', variant: 'outline' },
        { id: 'view_payout', label: 'View Payout', icon: 'CreditCard', variant: 'secondary' },
        { id: 'view_audit', label: 'View Audit Trail', icon: 'FileText', variant: 'secondary' }
    ],
    cancelled: [
        { id: 'view_details', label: 'View Details', icon: 'Info', variant: 'outline' },
        { id: 'view_reason', label: 'View Reason', icon: 'Info', variant: 'secondary' },
        { id: 'apply_penalty', label: 'Apply Penalty', icon: 'AlertTriangle', variant: 'destructive' }
    ],
    expired: [
        { id: 'view_details', label: 'View Details', icon: 'Info', variant: 'outline' },
        { id: 'view_audit', label: 'View Audit Trail', icon: 'FileText', variant: 'secondary' }
    ],
    no_show: [
        { id: 'view_details', label: 'View Details', icon: 'Info', variant: 'outline' },
        { id: 'apply_penalty', label: 'Apply Penalty', icon: 'AlertTriangle', variant: 'destructive' },
        { id: 'suspend_pro', label: 'Suspend Professional', icon: 'UserX', variant: 'destructive' }
    ],
    disputed: [
        { id: 'view_details', label: 'View Details', icon: 'Info', variant: 'outline' },
        { id: 'view_dispute', label: 'View Dispute', icon: 'AlertCircle', variant: 'default' },
        { id: 'resolve', label: 'Resolve Dispute', icon: 'CheckCircle', variant: 'default' }
    ],
    under_review: [
        { id: 'view_details', label: 'View Details', icon: 'Info', variant: 'outline' },
        { id: 'add_notes', label: 'Add Internal Notes', icon: 'FileText', variant: 'secondary' },
        { id: 'resolve', label: 'Mark Resolved', icon: 'CheckCircle', variant: 'default' },
        { id: 'escalate', label: 'Escalate', icon: 'ArrowUp', variant: 'destructive' }
    ],
    closed: [
        { id: 'view_details', label: 'View Details', icon: 'Info', variant: 'outline' },
        { id: 'view_audit', label: 'View Full Audit', icon: 'FileText', variant: 'secondary' },
        { id: 'reopen', label: 'Reopen', icon: 'RefreshCw', variant: 'outline' }
    ]
};

// ===== Utility Functions =====

export function getStatusDisplay(status: StintStatus): StatusDisplayConfig {
    return STINT_STATUS_DISPLAY[status] || STINT_STATUS_DISPLAY.pending;
}

export function getTabsForRole(role: 'superadmin' | 'employer' | 'professional'): TabConfig[] {
    switch (role) {
        case 'superadmin':
            return SUPERADMIN_TABS;
        case 'employer':
            return EMPLOYER_TABS;
        case 'professional':
            return PROFESSIONAL_TABS;
        default:
            return [];
    }
}

export function getActionsForStatus(
    status: StintStatus,
    role: 'superadmin' | 'employer' | 'professional'
): ActionConfig[] {
    switch (role) {
        case 'superadmin':
            return SUPERADMIN_ACTIONS[status] || [];
        case 'employer':
            return EMPLOYER_ACTIONS[status] || [];
        case 'professional':
            return PROFESSIONAL_ACTIONS[status] || [];
        default:
            return [];
    }
}

export function filterStintsByTab(stints: any[], tabId: TabId, role: 'superadmin' | 'employer' | 'professional'): any[] {
    const tabs = getTabsForRole(role);
    const tab = tabs.find(t => t.id === tabId);

    if (!tab || tabId === 'all') {
        return stints;
    }

    return stints.filter(stint => tab.statuses.includes(stint.status));
}

export function getStintCountByTab(stints: any[], role: 'superadmin' | 'employer' | 'professional'): Record<TabId, number> {
    const tabs = getTabsForRole(role);
    const counts: Record<TabId, number> = {};

    for (const tab of tabs) {
        if (tab.id === 'all') {
            counts[tab.id] = stints.length;
        } else {
            counts[tab.id] = stints.filter(stint => tab.statuses.includes(stint.status)).length;
        }
    }

    return counts;
}

// Check if today's date matches the stint's shift date
export function isStintToday(stintDate: Date): boolean {
    const today = new Date();
    const stintDay = new Date(stintDate);
    return (
        today.getFullYear() === stintDay.getFullYear() &&
        today.getMonth() === stintDay.getMonth() &&
        today.getDate() === stintDay.getDate()
    );
}

// Format status for display (snake_case to Title Case)
export function formatStatus(status: StintStatus): string {
    return status
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
