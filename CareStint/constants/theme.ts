// Theme colors for CareStint - Material 3 / Google Pixel inspired design system
export const Colors = {
    // Primary palette - Material 3 inspired
    primary: '#1A73E8',           // Google Blue
    primaryDark: '#1557B0',
    primaryLight: '#4285F4',
    primaryContainer: '#D3E3FD',
    onPrimaryContainer: '#041E49',

    // Secondary palette
    secondary: '#5F6368',         // Google Gray
    secondaryLight: '#80868B',
    onSecondary: '#FFFFFF',

    // Tertiary / Accent
    accent: '#9334E6',            // Purple accent
    accentLight: '#A855F7',
    tertiary: '#007B83',          // Teal

    // Background colors - Material 3 dark surface levels
    background: '#0F1419',        // Surface Container Lowest
    backgroundSecondary: '#181C20', // Surface Container Low
    backgroundCard: '#1E2228',    // Surface Container
    backgroundElevated: '#262B32', // Surface Container High
    surface: '#1E2228',
    surfaceVariant: '#262B32',

    // Text colors - Material 3
    textPrimary: '#E8EAED',       // On Surface
    textSecondary: '#9AA0A6',     // On Surface Variant
    textMuted: '#5F6368',         // Outline
    onSurface: '#E8EAED',
    onSurfaceVariant: '#9AA0A6',

    // Status colors - Material 3 semantic
    success: '#34A853',           // Google Green
    successLight: '#81C995',
    successContainer: '#C4EED0',
    warning: '#F9AB00',           // Google Yellow
    warningLight: '#FDD663',
    warningContainer: '#FEEFC3',
    error: '#EA4335',             // Google Red
    errorLight: '#F28B82',
    errorContainer: '#F9DEDC',
    info: '#4285F4',

    // Border colors
    border: '#3C4043',            // Outline
    borderLight: '#5F6368',       // Outline Variant
    outline: '#3C4043',
    outlineVariant: '#5F6368',

    // Gradient colors
    gradientStart: '#1A73E8',
    gradientMid: '#4285F4',
    gradientEnd: '#9334E6',

    // Special surfaces
    scrim: 'rgba(0, 0, 0, 0.32)',
    inverseSurface: '#E8EAED',
    inverseOnSurface: '#0F1419',
};

// Typography - Material 3 type scale
export const Typography = {
    // Display
    displayLarge: 57,
    displayMedium: 45,
    displaySmall: 36,

    // Headline
    headlineLarge: 32,
    headlineMedium: 28,
    headlineSmall: 24,

    // Title
    titleLarge: 22,
    titleMedium: 16,
    titleSmall: 14,

    // Body
    bodyLarge: 16,
    bodyMedium: 14,
    bodySmall: 12,

    // Label
    labelLarge: 14,
    labelMedium: 12,
    labelSmall: 11,

    // Legacy support
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,

    // Font weights
    regular: '400' as '400',
    medium: '500' as '500',
    semibold: '600' as '600',
    bold: '700' as '700',
};

// Spacing - Material 3 uses 4dp grid
export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 56,
    '6xl': 64,
};

// Border radius - Material 3 shape scale
export const BorderRadius = {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    full: 9999,
    // Material 3 shape tokens
    extraSmall: 4,
    small: 8,
    medium: 12,
    large: 16,
    extraLarge: 28,
};

// Shadows - Material 3 elevation
export const Shadows = {
    level0: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    level1: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 1,
    },
    level2: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    level3: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    level4: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    level5: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 12,
    },
    // Legacy support
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
};

// State layers - Material 3 interactions
export const StateLayer = {
    hover: 0.08,
    focus: 0.12,
    pressed: 0.12,
    dragged: 0.16,
};

// Motion - Material 3 easing
export const Motion = {
    duration: {
        short1: 50,
        short2: 100,
        short3: 150,
        short4: 200,
        medium1: 250,
        medium2: 300,
        medium3: 350,
        medium4: 400,
        long1: 450,
        long2: 500,
        long3: 550,
        long4: 600,
    },
    easing: {
        emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
        emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
        emphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
        standardDecelerate: 'cubic-bezier(0, 0, 0, 1)',
        standardAccelerate: 'cubic-bezier(0.3, 0, 1, 1)',
    },
};

// Fee configuration (matching web app)
export const Fees = {
    normalBooking: 0.15,
    urgentBooking: 0.20,
    professionalService: 0.05,
    lateCancellation: {
        minAmount: 1000,
        percentage: 0.20,
    },
    permanentHire: 0.35,
};

// Status options
export const Status = {
    user: {
        PENDING_VALIDATION: 'pending_validation',
        AUTO_APPROVED: 'auto_approved',
        NEEDS_MANUAL_REVIEW: 'needs_manual_review',
        REJECTED: 'rejected',
        ACTIVE: 'active',
        SUSPENDED: 'suspended',
    },
    stint: {
        OPEN: 'open',
        ACCEPTED: 'accepted',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        DISPUTED: 'disputed',
        SETTLED: 'settled',
        CANCELLED: 'cancelled',
    },
    dispute: {
        OPEN: 'open',
        UNDER_REVIEW: 'under_review',
        RESOLVED: 'resolved',
        ESCALATED: 'escalated',
        CLOSED_NO_RESPONSE: 'closed_no_response',
    },
    payout: {
        PENDING: 'pending',
        PROCESSING: 'processing',
        COMPLETED: 'completed',
        FAILED: 'failed',
    },
};

// Shift types
export const ShiftTypes = {
    HALF_DAY: 'half_day',
    FULL_DAY: 'full_day',
};

// Professional roles
export const ProfessionalRoles = [
    'Dentist',
    'Registered Nurse (RN)',
    'Clinical Officer',
    'Lab Technician',
    'Pharmacist',
    'Physiotherapist',
    'Radiologist',
    'Medical Officer',
    'Midwife',
    'Anesthetist',
];

// Regions
export const Regions = [
    { country: 'Kenya', cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Homabay'] },
    { country: 'Uganda', cities: ['Kampala', 'Entebbe', 'Jinja', 'Gulu', 'Mbarara'] },
    { country: 'Tanzania', cities: ['Dar es Salaam', 'Dodoma', 'Arusha', 'Mwanza', 'Zanzibar'] },
];

// Material 3 Icon names for common actions (using Material Symbols / Ionicons)
export const Icons = {
    // Navigation
    home: 'home',
    homeFilled: 'home',
    search: 'search',
    searchFilled: 'search',
    notifications: 'notifications-outline',
    notificationsFilled: 'notifications',
    account: 'person-circle-outline',
    accountFilled: 'person-circle',
    settings: 'settings-outline',
    settingsFilled: 'settings',

    // Actions
    add: 'add',
    edit: 'create-outline',
    delete: 'trash-outline',
    close: 'close',
    check: 'checkmark',
    share: 'share-outline',
    copy: 'copy-outline',
    refresh: 'refresh',
    filter: 'options-outline',
    sort: 'swap-vertical-outline',

    // Common
    calendar: 'calendar-outline',
    calendarFilled: 'calendar',
    time: 'time-outline',
    timeFilled: 'time',
    location: 'location-outline',
    locationFilled: 'location',
    money: 'wallet-outline',
    moneyFilled: 'wallet',
    document: 'document-text-outline',
    documentFilled: 'document-text',

    // Medical
    medical: 'medical-outline',
    medicalFilled: 'medical',
    heart: 'heart-outline',
    heartFilled: 'heart',

    // Status
    success: 'checkmark-circle',
    warning: 'warning',
    error: 'close-circle',
    info: 'information-circle',
    pending: 'hourglass-outline',

    // Navigation arrows
    back: 'arrow-back',
    forward: 'arrow-forward',
    up: 'chevron-up',
    down: 'chevron-down',
    chevronRight: 'chevron-forward',
    chevronLeft: 'chevron-back',

    // User
    person: 'person-outline',
    personFilled: 'person',
    people: 'people-outline',
    peopleFilled: 'people',
    business: 'business-outline',
    businessFilled: 'business',

    // Communication
    mail: 'mail-outline',
    mailFilled: 'mail',
    call: 'call-outline',
    callFilled: 'call',
    chat: 'chatbubble-outline',
    chatFilled: 'chatbubble',

    // Other
    star: 'star',
    starOutline: 'star-outline',
    flash: 'flash-outline',
    flashFilled: 'flash',
    logout: 'log-out-outline',
    help: 'help-circle-outline',
    helpFilled: 'help-circle',
};
