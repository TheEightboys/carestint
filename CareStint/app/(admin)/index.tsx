import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getAdminStats } from '../../services/firestore';
import {
    AnimatedCard,
    AnimatedNumber,
    PulsingDot,
    SkeletonDashboard,
} from '../../components';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

// Animated Stat Card with glassmorphism
const AnimatedStatCard = ({
    title,
    value,
    icon,
    color = Colors.primary,
    onPress,
    delay = 0,
    badge,
}: {
    title: string;
    value: number | string;
    icon: string;
    color?: string;
    onPress?: () => void;
    delay?: number;
    badge?: number;
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    tension: 80,
                    friction: 10,
                    useNativeDriver: true,
                }),
            ]).start();
        }, delay);
        return () => clearTimeout(timeout);
    }, [delay]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Animated.View
            style={[
                styles.statCard,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY }, { scale: scaleAnim }],
                    borderLeftColor: color,
                }
            ]}
        >
            <TouchableOpacity
                style={styles.statCardInner}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={!onPress}
                activeOpacity={1}
            >
                <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon as any} size={22} color={color} />
                    {badge !== undefined && badge > 0 && (
                        <View style={styles.statBadge}>
                            <Text style={styles.statBadgeText}>{badge}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.statContent}>
                    {typeof value === 'number' ? (
                        <AnimatedNumber value={value} style={styles.statValue} duration={1000} />
                    ) : (
                        <Text style={styles.statValue}>{value}</Text>
                    )}
                    <Text style={styles.statTitle}>{title}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// Quick Action Card
const QuickActionCard = ({
    title,
    icon,
    color,
    onPress,
    delay = 0,
    badge,
}: any) => (
    <AnimatedCard delay={delay} style={styles.actionCard}>
        <TouchableOpacity
            style={styles.actionCardInner}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
                {badge !== undefined && badge > 0 && (
                    <View style={[styles.actionBadge, { backgroundColor: Colors.error }]}>
                        <Text style={styles.actionBadgeText}>{badge}</Text>
                    </View>
                )}
            </View>
            <Text style={styles.actionTitle}>{title}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
    </AnimatedCard>
);

export default function AdminDashboard() {
    const router = useRouter();
    const { isLoading: authLoading } = useAuth();

    const [stats, setStats] = useState({
        totalEmployers: 0,
        pendingEmployers: 0,
        activeEmployers: 0,
        totalProfessionals: 0,
        pendingProfessionals: 0,
        activeProfessionals: 0,
        totalStints: 0,
        activeStints: 0,
        completedStints: 0,
    });
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const statsData = await getAdminStats();
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchStats();
        setRefreshing(false);
    };

    if (authLoading || isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <SkeletonDashboard />
            </SafeAreaView>
        );
    }

    const totalPending = stats.pendingEmployers + stats.pendingProfessionals;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Admin Dashboard</Text>
                        <Text style={styles.subtitle}>CareStint Platform Overview</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.notificationBtn}
                        onPress={() => router.push('/notifications' as any)}
                    >
                        <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
                        {totalPending > 0 && (
                            <View style={styles.notifBadge}>
                                <Text style={styles.notifBadgeText}>
                                    {totalPending > 9 ? '9+' : totalPending}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Pending Approvals Alert */}
                {totalPending > 0 && (
                    <TouchableOpacity
                        style={styles.alertCard}
                        onPress={() => router.push('/(admin)/employers' as any)}
                    >
                        <LinearGradient
                            colors={[Colors.warning, '#E0A800']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.alertGradient}
                        >
                            <View style={styles.alertIconBg}>
                                <Ionicons name="alert-circle" size={24} color={Colors.warning} />
                            </View>
                            <View style={styles.alertContent}>
                                <Text style={styles.alertTitle}>Pending Approvals</Text>
                                <Text style={styles.alertText}>
                                    {stats.pendingEmployers} employers, {stats.pendingProfessionals} professionals
                                </Text>
                            </View>
                            <View style={styles.alertArrow}>
                                <Ionicons name="chevron-forward" size={20} color="#fff" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Stats Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Platform Statistics</Text>

                    <View style={styles.statsRow}>
                        <AnimatedStatCard
                            title="Total Employers"
                            value={stats.totalEmployers}
                            icon="business"
                            color={Colors.primary}
                            delay={0}
                            onPress={() => router.push('/(admin)/employers' as any)}
                        />
                        <AnimatedStatCard
                            title="Pending"
                            value={stats.pendingEmployers}
                            icon="hourglass"
                            color={Colors.warning}
                            delay={100}
                            badge={stats.pendingEmployers}
                            onPress={() => router.push('/(admin)/employers' as any)}
                        />
                    </View>
                    <View style={styles.statsRow}>
                        <AnimatedStatCard
                            title="Total Professionals"
                            value={stats.totalProfessionals}
                            icon="people"
                            color={Colors.success}
                            delay={200}
                            onPress={() => router.push('/(admin)/professionals' as any)}
                        />
                        <AnimatedStatCard
                            title="Pending"
                            value={stats.pendingProfessionals}
                            icon="hourglass"
                            color={Colors.warning}
                            delay={300}
                            badge={stats.pendingProfessionals}
                            onPress={() => router.push('/(admin)/professionals' as any)}
                        />
                    </View>
                    <View style={styles.statsRow}>
                        <AnimatedStatCard
                            title="Total Stints"
                            value={stats.totalStints}
                            icon="briefcase"
                            color={Colors.info}
                            delay={400}
                            onPress={() => router.push('/(admin)/stints' as any)}
                        />
                        <AnimatedStatCard
                            title="Active"
                            value={stats.activeStints}
                            icon="pulse"
                            color={Colors.success}
                            delay={500}
                            onPress={() => router.push('/(admin)/stints' as any)}
                        />
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <QuickActionCard
                        title="Manage Employers"
                        icon="business"
                        color={Colors.primary}
                        delay={600}
                        badge={stats.pendingEmployers}
                        onPress={() => router.push('/(admin)/employers' as any)}
                    />
                    <QuickActionCard
                        title="Manage Professionals"
                        icon="people"
                        color={Colors.success}
                        delay={700}
                        badge={stats.pendingProfessionals}
                        onPress={() => router.push('/(admin)/professionals' as any)}
                    />
                    <QuickActionCard
                        title="View All Stints"
                        icon="briefcase"
                        color={Colors.info}
                        delay={800}
                        onPress={() => router.push('/(admin)/stints' as any)}
                    />
                    <QuickActionCard
                        title="Audit Logs"
                        icon="document-text"
                        color={Colors.accent}
                        delay={900}
                        onPress={() => router.push('/(admin)/audit' as any)}
                    />
                </View>

                {/* Summary */}
                <AnimatedCard delay={1000} glassmorphism style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Platform Summary</Text>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <PulsingDot color={Colors.success} size={8} />
                            <Text style={styles.summaryLabel}>Active Employers</Text>
                        </View>
                        <Text style={styles.summaryValue}>{stats.activeEmployers}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <PulsingDot color={Colors.success} size={8} />
                            <Text style={styles.summaryLabel}>Active Professionals</Text>
                        </View>
                        <Text style={styles.summaryValue}>{stats.activeProfessionals}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Completed Stints</Text>
                        <Text style={styles.summaryValue}>{stats.completedStints}</Text>
                    </View>
                </AnimatedCard>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.base,
    },
    greeting: {
        fontSize: Typography['2xl'],
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    subtitle: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: Colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    notifBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
    alertCard: {
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
    alertGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.base,
        gap: Spacing.md,
    },
    alertIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: '#fff',
    },
    alertText: {
        fontSize: Typography.sm,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },
    alertArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(26, 41, 66, 0.7)',
        borderRadius: BorderRadius.xl,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
    },
    statCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.base,
        gap: Spacing.sm,
    },
    statIconContainer: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: Colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    statBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#fff',
    },
    statContent: {
        flex: 1,
    },
    statValue: {
        fontSize: Typography.xl,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    statTitle: {
        fontSize: Typography.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    actionCard: {
        marginBottom: Spacing.sm,
    },
    actionCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    actionBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#fff',
    },
    actionTitle: {
        flex: 1,
        fontSize: Typography.base,
        fontWeight: '500',
        color: Colors.textPrimary,
    },
    summaryCard: {
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing['2xl'],
    },
    summaryTitle: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    summaryLabel: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    summaryValue: {
        fontSize: Typography.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: Colors.border,
    },
});
