/**
 * CareStint Mobile - Skeleton Loader Components
 * Premium shimmer loading states for enhanced UX
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Shimmer } from './AnimatedComponents';
import { Colors, BorderRadius, Spacing } from '../constants/theme';

// ============================================
// SKELETON CARD
// ============================================
interface SkeletonCardProps {
    style?: ViewStyle;
    lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
    style,
    lines = 3,
}) => {
    return (
        <View style={[styles.card, style]}>
            <View style={styles.cardHeader}>
                <Shimmer width={60} height={60} borderRadius={BorderRadius.lg} />
                <View style={styles.cardHeaderText}>
                    <Shimmer width="70%" height={18} />
                    <Shimmer width="50%" height={14} style={{ marginTop: 8 }} />
                </View>
            </View>
            {Array.from({ length: lines }).map((_, index) => (
                <Shimmer
                    key={index}
                    width={index === lines - 1 ? '60%' : '100%'}
                    height={14}
                    style={{ marginTop: 12 }}
                />
            ))}
        </View>
    );
};

// ============================================
// SKELETON STATS ROW
// ============================================
interface SkeletonStatsProps {
    count?: number;
    style?: ViewStyle;
}

export const SkeletonStats: React.FC<SkeletonStatsProps> = ({
    count = 4,
    style,
}) => {
    return (
        <View style={[styles.statsRow, style]}>
            {Array.from({ length: count }).map((_, index) => (
                <View key={index} style={styles.statItem}>
                    <Shimmer width={40} height={12} />
                    <Shimmer width={60} height={24} style={{ marginTop: 8 }} />
                    <Shimmer width={50} height={10} style={{ marginTop: 4 }} />
                </View>
            ))}
        </View>
    );
};

// ============================================
// SKELETON LIST ITEM
// ============================================
interface SkeletonListItemProps {
    showAvatar?: boolean;
    showAction?: boolean;
    style?: ViewStyle;
}

export const SkeletonListItem: React.FC<SkeletonListItemProps> = ({
    showAvatar = true,
    showAction = true,
    style,
}) => {
    return (
        <View style={[styles.listItem, style]}>
            {showAvatar && (
                <Shimmer width={48} height={48} borderRadius={24} />
            )}
            <View style={styles.listItemContent}>
                <Shimmer width="80%" height={16} />
                <Shimmer width="60%" height={12} style={{ marginTop: 6 }} />
            </View>
            {showAction && (
                <Shimmer width={70} height={32} borderRadius={BorderRadius.md} />
            )}
        </View>
    );
};

// ============================================
// SKELETON LIST
// ============================================
interface SkeletonListProps {
    count?: number;
    showAvatar?: boolean;
    showAction?: boolean;
    style?: ViewStyle;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
    count = 5,
    showAvatar = true,
    showAction = true,
    style,
}) => {
    return (
        <View style={style}>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonListItem
                    key={index}
                    showAvatar={showAvatar}
                    showAction={showAction}
                    style={{ marginBottom: Spacing.md }}
                />
            ))}
        </View>
    );
};

// ============================================
// SKELETON PROFILE
// ============================================
export const SkeletonProfile: React.FC<{ style?: ViewStyle }> = ({ style }) => {
    return (
        <View style={[styles.profile, style]}>
            <Shimmer width={100} height={100} borderRadius={50} />
            <Shimmer width={180} height={24} style={{ marginTop: 16 }} />
            <Shimmer width={120} height={14} style={{ marginTop: 8 }} />
            <View style={styles.profileBadges}>
                <Shimmer width={80} height={28} borderRadius={BorderRadius.full} />
                <Shimmer width={60} height={28} borderRadius={BorderRadius.full} />
            </View>
        </View>
    );
};

// ============================================
// SKELETON STINT CARD
// ============================================
export const SkeletonStintCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
    return (
        <View style={[styles.stintCard, style]}>
            <View style={styles.stintCardHeader}>
                <View style={{ flex: 1 }}>
                    <Shimmer width="70%" height={18} />
                    <Shimmer width="50%" height={14} style={{ marginTop: 6 }} />
                </View>
                <Shimmer width={80} height={28} borderRadius={BorderRadius.full} />
            </View>
            <View style={styles.stintCardDetails}>
                <Shimmer width={100} height={14} />
                <Shimmer width={80} height={14} />
                <Shimmer width={90} height={14} />
            </View>
            <View style={styles.stintCardFooter}>
                <Shimmer width="100%" height={44} borderRadius={BorderRadius.lg} />
            </View>
        </View>
    );
};

// ============================================
// SKELETON DASHBOARD
// ============================================
export const SkeletonDashboard: React.FC = () => {
    return (
        <View style={styles.dashboard}>
            {/* Header */}
            <View style={styles.dashboardHeader}>
                <View>
                    <Shimmer width={100} height={14} />
                    <Shimmer width={180} height={28} style={{ marginTop: 8 }} />
                </View>
                <Shimmer width={44} height={44} borderRadius={22} />
            </View>

            {/* Stats */}
            <SkeletonStats style={{ marginTop: 20 }} />

            {/* Action Card */}
            <Shimmer
                width="100%"
                height={100}
                borderRadius={BorderRadius.xl}
                style={{ marginTop: 20 }}
            />

            {/* List Section */}
            <View style={{ marginTop: 24 }}>
                <Shimmer width={120} height={20} style={{ marginBottom: 16 }} />
                <SkeletonStintCard />
                <SkeletonStintCard style={{ marginTop: 12 }} />
            </View>
        </View>
    );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardHeaderText: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        flex: 1,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
    },
    listItemContent: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    profile: {
        alignItems: 'center',
        padding: Spacing.xl,
    },
    profileBadges: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    stintCard: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
    },
    stintCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    stintCardDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.md,
    },
    stintCardFooter: {
        marginTop: Spacing.md,
    },
    dashboard: {
        padding: Spacing.xl,
    },
    dashboardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});
