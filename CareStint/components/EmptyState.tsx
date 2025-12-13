/**
 * CareStint Mobile - Empty State Components
 * Beautiful illustrated empty states for enhanced UX
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from './Button';
import { Colors, Typography, BorderRadius, Spacing } from '../constants/theme';

// ============================================
// EMPTY STATE
// ============================================
interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    variant?: 'default' | 'compact' | 'large';
    style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'folder-open-outline',
    title,
    description,
    actionLabel,
    onAction,
    variant = 'default',
    style,
}) => {
    const getIconSize = () => {
        switch (variant) {
            case 'compact': return 40;
            case 'large': return 80;
            default: return 56;
        }
    };

    return (
        <View style={[styles.container, styles[`${variant}Container`], style]}>
            {/* Icon with gradient background */}
            <View style={styles.iconContainer}>
                <LinearGradient
                    colors={[Colors.primary + '20', Colors.accent + '10']}
                    style={styles.iconBackground}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons
                        name={icon as any}
                        size={getIconSize()}
                        color={Colors.primary}
                    />
                </LinearGradient>
            </View>

            {/* Text content */}
            <Text style={[styles.title, styles[`${variant}Title`]]}>{title}</Text>
            {description && (
                <Text style={[styles.description, styles[`${variant}Description`]]}>
                    {description}
                </Text>
            )}

            {/* Action button */}
            {actionLabel && onAction && (
                <Button
                    title={actionLabel}
                    onPress={onAction}
                    variant="primary"
                    size="md"
                    style={{ marginTop: Spacing.lg }}
                />
            )}
        </View>
    );
};

// ============================================
// NO STINTS EMPTY STATE
// ============================================
interface NoStintsEmptyStateProps {
    userType: 'professional' | 'employer';
    onAction?: () => void;
    style?: ViewStyle;
}

export const NoStintsEmptyState: React.FC<NoStintsEmptyStateProps> = ({
    userType,
    onAction,
    style,
}) => {
    const isProfessional = userType === 'professional';

    return (
        <EmptyState
            icon={isProfessional ? 'search-outline' : 'calendar-outline'}
            title={isProfessional ? 'No stints available' : 'No stints posted yet'}
            description={
                isProfessional
                    ? 'Check back soon for new opportunities in your area'
                    : 'Post your first stint to start finding healthcare professionals'
            }
            actionLabel={isProfessional ? 'Browse All Stints' : 'Post a Stint'}
            onAction={onAction}
            style={style}
        />
    );
};

// ============================================
// NO APPLICATIONS EMPTY STATE
// ============================================
export const NoApplicationsEmptyState: React.FC<{ style?: ViewStyle }> = ({ style }) => {
    return (
        <EmptyState
            icon="document-text-outline"
            title="No applications yet"
            description="When professionals apply to your stints, they will appear here"
            style={style}
        />
    );
};

// ============================================
// NO EARNINGS EMPTY STATE
// ============================================
interface NoEarningsEmptyStateProps {
    onFindStints?: () => void;
    style?: ViewStyle;
}

export const NoEarningsEmptyState: React.FC<NoEarningsEmptyStateProps> = ({
    onFindStints,
    style,
}) => {
    return (
        <EmptyState
            icon="wallet-outline"
            title="No earnings yet"
            description="Complete your first stint to start earning"
            actionLabel="Find Stints"
            onAction={onFindStints}
            style={style}
        />
    );
};

// ============================================
// NO NOTIFICATIONS EMPTY STATE
// ============================================
export const NoNotificationsEmptyState: React.FC<{ style?: ViewStyle }> = ({ style }) => {
    return (
        <EmptyState
            icon="notifications-outline"
            title="No notifications"
            description="You're all caught up! Notifications will appear here"
            variant="compact"
            style={style}
        />
    );
};

// ============================================
// ERROR STATE
// ============================================
interface ErrorStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
    style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
    title = 'Something went wrong',
    description = "We couldn't load the data. Please try again.",
    onRetry,
    style,
}) => {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.errorIconContainer}>
                <Ionicons
                    name="warning-outline"
                    size={56}
                    color={Colors.error}
                />
            </View>
            <Text style={styles.errorTitle}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            {onRetry && (
                <Button
                    title="Try Again"
                    onPress={onRetry}
                    variant="outline"
                    style={{ marginTop: Spacing.lg }}
                />
            )}
        </View>
    );
};

// ============================================
// OFFLINE STATE
// ============================================
interface OfflineStateProps {
    onRetry?: () => void;
    style?: ViewStyle;
}

export const OfflineState: React.FC<OfflineStateProps> = ({
    onRetry,
    style,
}) => {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.offlineIconContainer}>
                <Ionicons
                    name="cloud-offline-outline"
                    size={56}
                    color={Colors.textMuted}
                />
            </View>
            <Text style={styles.title}>You're offline</Text>
            <Text style={styles.description}>
                Check your internet connection and try again
            </Text>
            {onRetry && (
                <Button
                    title="Retry"
                    onPress={onRetry}
                    variant="secondary"
                    style={{ marginTop: Spacing.lg }}
                />
            )}
        </View>
    );
};

// ============================================
// COMING SOON STATE
// ============================================
interface ComingSoonStateProps {
    feature: string;
    style?: ViewStyle;
}

export const ComingSoonState: React.FC<ComingSoonStateProps> = ({
    feature,
    style,
}) => {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.comingSoonIconContainer}>
                <LinearGradient
                    colors={[Colors.accent + '30', Colors.primary + '20']}
                    style={styles.iconBackground}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons
                        name="rocket-outline"
                        size={56}
                        color={Colors.accent}
                    />
                </LinearGradient>
            </View>
            <Text style={styles.title}>Coming Soon</Text>
            <Text style={styles.description}>
                {feature} is under development and will be available soon!
            </Text>
        </View>
    );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: Spacing['2xl'],
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
    },
    compactContainer: {
        padding: Spacing.lg,
    },
    largeContainer: {
        padding: Spacing['3xl'],
    },
    defaultContainer: {},
    iconContainer: {
        marginBottom: Spacing.lg,
    },
    iconBackground: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: Typography.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    compactTitle: {
        fontSize: Typography.base,
    },
    largeTitle: {
        fontSize: Typography['2xl'],
    },
    defaultTitle: {},
    description: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: Spacing.sm,
        maxWidth: 280,
        lineHeight: 20,
    },
    compactDescription: {
        fontSize: Typography.xs,
    },
    largeDescription: {
        fontSize: Typography.base,
        maxWidth: 320,
    },
    defaultDescription: {},
    errorIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.error + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    errorTitle: {
        fontSize: Typography.lg,
        fontWeight: '600',
        color: Colors.error,
        textAlign: 'center',
    },
    offlineIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.backgroundElevated,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    comingSoonIconContainer: {
        marginBottom: Spacing.lg,
    },
});
