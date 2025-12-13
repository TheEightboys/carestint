import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
    subscribeToEmployerStints,
    getEmployerStats,
    getApplicationsForEmployer,
} from '../../services/firestore';
import {
    Button,
    AnimatedCard,
    AnimatedNumber,
    PulsingDot,
    SkeletonDashboard,
    NoStintsEmptyState,
} from '../../components';
import { Colors, Typography, Spacing, BorderRadius, Fees } from '../../constants/theme';
import { Stint, StintApplication } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Enhanced Glassmorphism Stat Card with Animation
const GlassmorphismStatCard = ({
    title,
    value,
    subtitle,
    icon,
    delay = 0,
    accentColor = Colors.primary,
    badge,
}: any) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(30)).current;

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

    return (
        <Animated.View
            style={[
                styles.glassStatCard,
                { opacity: fadeAnim, transform: [{ translateY }] }
            ]}
        >
            <View style={styles.glassStatHeader}>
                <View style={[styles.glassStatIcon, { backgroundColor: accentColor + '20' }]}>
                    {icon}
                </View>
                {badge !== undefined && badge > 0 && (
                    <View style={styles.statBadge}>
                        <Text style={styles.statBadgeText}>{badge}</Text>
                    </View>
                )}
            </View>
            <Text style={styles.glassStatTitle}>{title}</Text>
            {typeof value === 'number' ? (
                <AnimatedNumber value={value} style={styles.glassStatValue} />
            ) : (
                <Text style={styles.glassStatValue}>{value}</Text>
            )}
            {subtitle && <Text style={styles.glassStatSubtitle}>{subtitle}</Text>}
        </Animated.View>
    );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'open':
                return { color: Colors.primary, label: 'Open' };
            case 'accepted':
                return { color: Colors.warning, label: 'Accepted' };
            case 'in_progress':
                return { color: Colors.success, label: 'In Progress' };
            case 'completed':
                return { color: Colors.info, label: 'Completed' };
            case 'cancelled':
                return { color: Colors.error, label: 'Cancelled' };
            case 'settled':
                return { color: Colors.textMuted, label: 'Settled' };
            default:
                return { color: Colors.textMuted, label: status };
        }
    };

    const config = getStatusConfig();

    return (
        <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
            {(status === 'in_progress' || status === 'open') && (
                <PulsingDot color={config.color} size={6} />
            )}
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>
    );
};

// Hero Action Card
const HeroActionCard = ({ onPress }: { onPress: () => void }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
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
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
            >
                <LinearGradient
                    colors={[Colors.gradientStart, Colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.heroCardContent}>
                        <View style={styles.heroCardText}>
                            <Text style={styles.heroCardTitle}>Post New Stint</Text>
                            <Text style={styles.heroCardSubtitle}>
                                Find qualified healthcare professionals fast
                            </Text>
                        </View>
                        <View style={styles.heroCardIconCircle}>
                            <Ionicons name="add" size={32} color="#fff" />
                        </View>
                    </View>
                    <View style={styles.feeHint}>
                        <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.feeHintText}>
                            {Fees.normalBooking * 100}% fee (24h+) • {Fees.urgentBooking * 100}% urgent
                        </Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

// Enhanced Stint Card
const StintCard = ({
    stint,
    applications,
    onPress,
    delay = 0
}: {
    stint: Stint;
    applications: number;
    onPress: () => void;
    delay?: number;
}) => {
    return (
        <AnimatedCard delay={delay} style={styles.stintCard}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                <View style={styles.stintHeader}>
                    <View style={styles.stintInfo}>
                        <Text style={styles.stintRole}>{stint.profession}</Text>
                        <View style={styles.stintDateRow}>
                            <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                            <Text style={styles.stintDate}>
                                {stint.shiftDate
                                    ? new Date(stint.shiftDate).toLocaleDateString()
                                    : 'Date TBD'}
                            </Text>
                        </View>
                    </View>
                    <StatusBadge status={stint.status} />
                </View>

                <View style={styles.stintDetails}>
                    <View style={styles.stintDetail}>
                        <Ionicons name="cash-outline" size={16} color={Colors.success} />
                        <Text style={styles.stintDetailValue}>
                            KSh {stint.offeredRate?.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.stintDetail}>
                        <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                        <Text style={styles.stintDetailText}>
                            {stint.shiftType === 'full_day' ? 'Full Day' : 'Half Day'}
                        </Text>
                    </View>
                    <View style={styles.stintDetail}>
                        <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
                        <Text style={styles.stintDetailText}>{stint.city}</Text>
                    </View>
                </View>

                {stint.status === 'open' && applications > 0 && (
                    <View style={styles.applicationsRow}>
                        <View style={styles.applicationsInfo}>
                            <Ionicons name="people" size={16} color={Colors.primary} />
                            <Text style={styles.applicationsText}>
                                {applications} application{applications !== 1 ? 's' : ''}
                            </Text>
                        </View>
                        <View style={styles.reviewBtn}>
                            <Text style={styles.reviewBtnText}>Review</Text>
                            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                        </View>
                    </View>
                )}

                {stint.confirmedProfessionalName && (
                    <View style={styles.assignedPro}>
                        <Ionicons name="person-circle" size={20} color={Colors.success} />
                        <View style={styles.assignedProInfo}>
                            <Text style={styles.assignedProLabel}>Assigned to</Text>
                            <Text style={styles.assignedProName}>
                                {stint.confirmedProfessionalName}
                            </Text>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </AnimatedCard>
    );
};

export default function EmployerDashboard() {
    const router = useRouter();
    const { user, employerData, isLoading: authLoading } = useAuth();

    const [stints, setStints] = useState<Stint[]>([]);
    const [applications, setApplications] = useState<{ [key: string]: number }>({});
    const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, totalSpent: 0 });
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingApplications, setPendingApplications] = useState(0);

    const employerId = user?.uid || employerData?.id || '';

    // Fetch stats
    const fetchStats = useCallback(async () => {
        if (!employerId) return;

        try {
            const statsData = await getEmployerStats(employerId);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, [employerId]);

    // Fetch applications count
    const fetchApplications = useCallback(async () => {
        if (!employerId) return;

        try {
            const apps = await getApplicationsForEmployer(employerId);
            const pendingCount = apps.filter(a => a.status === 'pending').length;
            setPendingApplications(pendingCount);

            // Group by stint
            const appsByStint: { [key: string]: number } = {};
            apps.forEach(app => {
                if (app.status === 'pending') {
                    appsByStint[app.stintId] = (appsByStint[app.stintId] || 0) + 1;
                }
            });
            setApplications(appsByStint);
        } catch (error) {
            console.error('Error fetching applications:', error);
        }
    }, [employerId]);

    // Subscribe to employer's stints
    useEffect(() => {
        if (!employerId) {
            setIsLoading(false);
            return;
        }

        const unsubscribe = subscribeToEmployerStints(employerId, (stintsData) => {
            setStints(stintsData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [employerId]);

    // Fetch stats and applications on mount
    useEffect(() => {
        fetchStats();
        fetchApplications();
    }, [fetchStats, fetchApplications]);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchStats(), fetchApplications()]);
        setRefreshing(false);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    if (authLoading || isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <SkeletonDashboard />
            </SafeAreaView>
        );
    }

    const facilityName = employerData?.facilityName || 'Employer';
    const recentStints = stints.slice(0, 5);

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
                        <Text style={styles.greeting}>{getGreeting()},</Text>
                        <Text style={styles.facilityName}>{facilityName}</Text>
                        {employerData?.city && (
                            <View style={styles.locationTag}>
                                <Ionicons name="location" size={12} color={Colors.textMuted} />
                                <Text style={styles.locationText}>{employerData.city}</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.notificationBtn}
                        onPress={() => router.push('/notifications' as any)}
                    >
                        <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
                        {pendingApplications > 0 && (
                            <View style={styles.notifBadge}>
                                <Text style={styles.notifBadgeText}>
                                    {pendingApplications > 9 ? '9+' : pendingApplications}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={styles.statsSection}>
                    <GlassmorphismStatCard
                        title="Total Stints"
                        value={stats.total}
                        delay={0}
                        accentColor={Colors.primary}
                        icon={<Ionicons name="calendar" size={20} color={Colors.primary} />}
                    />
                    <GlassmorphismStatCard
                        title="Active"
                        value={stats.active}
                        delay={100}
                        accentColor={Colors.success}
                        badge={pendingApplications}
                        icon={<Ionicons name="flash" size={20} color={Colors.success} />}
                    />
                </View>
                <View style={styles.statsSection}>
                    <GlassmorphismStatCard
                        title="Completed"
                        value={stats.completed}
                        delay={200}
                        accentColor={Colors.info}
                        icon={<Ionicons name="checkmark-circle" size={20} color={Colors.info} />}
                    />
                    <GlassmorphismStatCard
                        title="Total Spent"
                        value={`KSh ${(stats.totalSpent / 1000).toFixed(0)}K`}
                        delay={300}
                        accentColor={Colors.accent}
                        icon={<Ionicons name="wallet" size={20} color={Colors.accent} />}
                    />
                </View>

                {/* Quick Action - Post New Stint */}
                <View style={styles.heroWrapper}>
                    <HeroActionCard onPress={() => router.push('/(employer)/post-stint' as any)} />
                </View>

                {/* Applications Alert */}
                {pendingApplications > 0 && (
                    <TouchableOpacity
                        style={styles.applicationsAlert}
                        onPress={() => router.push('/(employer)/stints' as any)}
                    >
                        <View style={styles.applicationsAlertLeft}>
                            <View style={styles.applicationsAlertIcon}>
                                <Ionicons name="people" size={20} color={Colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.applicationsAlertTitle}>
                                    {pendingApplications} Pending Application{pendingApplications !== 1 ? 's' : ''}
                                </Text>
                                <Text style={styles.applicationsAlertSubtitle}>
                                    Review and accept professionals
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                )}

                {/* Recent Stints */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Stints</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(employer)/posted-jobs' as any)}
                            style={styles.seeAllBtn}
                        >
                            <Text style={styles.seeAll}>See All</Text>
                            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {recentStints.length === 0 ? (
                        <NoStintsEmptyState
                            userType="employer"
                            onAction={() => router.push('/(employer)/post-stint' as any)}
                        />
                    ) : (
                        recentStints.map((stint, index) => (
                            <StintCard
                                key={stint.id}
                                stint={stint}
                                applications={applications[stint.id] || 0}
                                delay={400 + index * 100}
                                onPress={() => router.push('/(employer)/stints' as any)}
                            />
                        ))
                    )}
                </View>
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
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.base,
    },
    greeting: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    facilityName: {
        fontSize: Typography['2xl'],
        fontWeight: '700',
        color: Colors.textPrimary,
        marginTop: 2,
    },
    locationTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: Spacing.xs,
    },
    locationText: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
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
    statsSection: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    glassStatCard: {
        flex: 1,
        backgroundColor: 'rgba(26, 41, 66, 0.7)',
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    glassStatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    glassStatIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statBadge: {
        backgroundColor: Colors.error,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    statBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
    glassStatTitle: {
        fontSize: Typography.xs,
        color: Colors.textSecondary,
    },
    glassStatValue: {
        fontSize: Typography.xl,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginTop: 2,
    },
    glassStatSubtitle: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        marginTop: 2,
    },
    heroWrapper: {
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    heroCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        overflow: 'hidden',
    },
    heroCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    heroCardText: {
        flex: 1,
    },
    heroCardTitle: {
        fontSize: Typography.xl,
        fontWeight: '700',
        color: '#fff',
    },
    heroCardSubtitle: {
        fontSize: Typography.sm,
        color: 'rgba(255,255,255,0.8)',
        marginTop: Spacing.xs,
    },
    heroCardIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    feeHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: Spacing.md,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    feeHintText: {
        fontSize: Typography.xs,
        color: 'rgba(255,255,255,0.7)',
    },
    applicationsAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
        padding: Spacing.base,
        backgroundColor: Colors.primary + '15',
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    applicationsAlertLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    applicationsAlertIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    applicationsAlertTitle: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    applicationsAlertSubtitle: {
        fontSize: Typography.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    section: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing['2xl'],
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    seeAll: {
        fontSize: Typography.sm,
        color: Colors.primary,
        fontWeight: '500',
    },
    stintCard: {
        marginBottom: Spacing.md,
    },
    stintHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    stintInfo: {},
    stintRole: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    stintDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    stintDate: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
    },
    stintDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.lg,
        marginTop: Spacing.md,
    },
    stintDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    stintDetailValue: {
        fontSize: Typography.sm,
        color: Colors.success,
        fontWeight: '600',
    },
    stintDetailText: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    applicationsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    applicationsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    applicationsText: {
        fontSize: Typography.sm,
        color: Colors.primary,
        fontWeight: '500',
    },
    reviewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primary + '15',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    reviewBtnText: {
        fontSize: Typography.sm,
        fontWeight: '600',
        color: Colors.primary,
    },
    assignedPro: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    assignedProInfo: {},
    assignedProLabel: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
    },
    assignedProName: {
        fontSize: Typography.sm,
        color: Colors.success,
        fontWeight: '500',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    statusText: {
        fontSize: Typography.xs,
        fontWeight: '500',
    },
});
