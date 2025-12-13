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
    subscribeToOpenStints,
    subscribeToProfessionalStints,
    getProfessionalStats
} from '../../services/firestore';
import {
    Button,
    AnimatedCard,
    AnimatedNumber,
    PulsingDot,
    GradientBorderCard,
    SkeletonDashboard,
    NoStintsEmptyState,
} from '../../components';
import { Colors, Typography, Spacing, BorderRadius, Fees } from '../../constants/theme';
import { Stint } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Enhanced Glassmorphism Stat Card
const GlassmorphismStatCard = ({
    title,
    value,
    subtitle,
    icon,
    delay = 0,
    trend,
    accentColor = Colors.primary
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
                {trend && (
                    <View style={[
                        styles.trendBadge,
                        { backgroundColor: trend.isPositive ? Colors.success + '20' : Colors.error + '20' }
                    ]}>
                        <Ionicons
                            name={trend.isPositive ? 'trending-up' : 'trending-down'}
                            size={12}
                            color={trend.isPositive ? Colors.success : Colors.error}
                        />
                        <Text style={[
                            styles.trendText,
                            { color: trend.isPositive ? Colors.success : Colors.error }
                        ]}>
                            {trend.value}%
                        </Text>
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

// Enhanced Status Badge
const StatusBadge = ({ status }: { status: string }) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'in_progress':
                return { color: Colors.success, label: 'In Progress', showPulse: true };
            case 'open':
                return { color: Colors.primary, label: 'Open', showPulse: false };
            case 'accepted':
                return { color: Colors.warning, label: 'Accepted', showPulse: true };
            case 'completed':
                return { color: Colors.info, label: 'Completed', showPulse: false };
            default:
                return { color: Colors.textMuted, label: status, showPulse: false };
        }
    };

    const config = getStatusConfig();

    return (
        <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
            {config.showPulse && <PulsingDot color={config.color} size={6} />}
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>
    );
};

// Hero Action Card
const HeroActionCard = ({ onPress, stuntsCount }: { onPress: () => void; stuntsCount: number }) => {
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
                            <Text style={styles.heroCardTitle}>Find Your Next Stint</Text>
                            <Text style={styles.heroCardSubtitle}>
                                {stuntsCount > 0
                                    ? `${stuntsCount} shifts available near you`
                                    : 'Browse available shifts nearby'}
                            </Text>
                        </View>
                        <View style={styles.heroCardIcon}>
                            <Ionicons name="search" size={32} color="#fff" />
                        </View>
                    </View>
                    <View style={styles.heroCardIndicator}>
                        <Text style={styles.heroCardIndicatorText}>Tap to explore</Text>
                        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

// Enhanced Stint Card
const StintCard = ({ stint, onPress, delay = 0 }: { stint: Stint; onPress: () => void; delay?: number }) => {
    const calculatePayout = (rate: number) => {
        const platformFee = rate * Fees.professionalService;
        const mpesaCost = 50;
        return rate - platformFee - mpesaCost;
    };

    return (
        <AnimatedCard delay={delay} style={styles.stintCard}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                <View style={styles.stintHeader}>
                    <View style={styles.stintInfo}>
                        <Text style={styles.stintRole}>{stint.profession}</Text>
                        <Text style={styles.stintClinic}>{stint.employerName}</Text>
                    </View>
                    <View style={styles.stintRate}>
                        <Text style={styles.rateValue}>
                            KSh {stint.offeredRate?.toLocaleString()}
                        </Text>
                        <Text style={styles.rateType}>
                            {stint.shiftType === 'half_day' ? 'Half-day' : 'Full-day'}
                        </Text>
                    </View>
                </View>

                <View style={styles.stintMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                        <Text style={styles.metaText}>{stint.city}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                        <Text style={styles.metaText}>
                            {stint.shiftDate ? new Date(stint.shiftDate).toLocaleDateString() : 'TBD'}
                        </Text>
                    </View>
                </View>

                <View style={styles.badgeRow}>
                    {stint.isUrgent && (
                        <View style={styles.urgentBadge}>
                            <Ionicons name="flash" size={12} color={Colors.warning} />
                            <Text style={styles.urgentText}>Urgent</Text>
                        </View>
                    )}
                    {stint.allowBids && (
                        <View style={styles.bidBadge}>
                            <Ionicons name="pricetag-outline" size={12} color={Colors.primary} />
                            <Text style={styles.bidText}>Bids allowed</Text>
                        </View>
                    )}
                </View>

                <View style={styles.payoutRow}>
                    <View style={styles.payoutInfo}>
                        <Text style={styles.payoutLabel}>Your payout</Text>
                        <Text style={styles.payoutValue}>
                            ~KSh {calculatePayout(stint.offeredRate || 0).toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.applyBtn}>
                        <Text style={styles.applyBtnText}>Apply</Text>
                        <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
                    </View>
                </View>
            </TouchableOpacity>
        </AnimatedCard>
    );
};

export default function ProfessionalDashboard() {
    const router = useRouter();
    const { user, professionalData, isLoading: authLoading } = useAuth();

    const [refreshing, setRefreshing] = useState(false);
    const [suggestedStints, setSuggestedStints] = useState<Stint[]>([]);
    const [activeStints, setActiveStints] = useState<Stint[]>([]);
    const [stats, setStats] = useState({
        completedThisMonth: 0,
        earnings: 0,
        rating: 0,
        pendingPayouts: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [elapsedTime, setElapsedTime] = useState(0);

    const professionalId = user?.uid || professionalData?.id;

    const fetchStats = useCallback(async () => {
        if (!professionalId) return;

        try {
            const statsData = await getProfessionalStats(professionalId);
            setStats({
                completedThisMonth: statsData.completedCount,
                earnings: Math.round(statsData.totalEarnings),
                rating: professionalData?.averageRating || 0,
                pendingPayouts: 0,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, [professionalId, professionalData]);

    useEffect(() => {
        const unsubscribe = subscribeToOpenStints((stints) => {
            const filtered = stints.filter(stint => {
                if (!professionalData?.primaryRole) return true;
                return stint.profession === professionalData.primaryRole;
            }).slice(0, 5);
            setSuggestedStints(filtered);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [professionalData]);

    useEffect(() => {
        if (!professionalId) return;

        const unsubscribe = subscribeToProfessionalStints(professionalId, (stints) => {
            const active = stints.filter(s =>
                s.status === 'accepted' || s.status === 'in_progress'
            );
            setActiveStints(active);
        });

        return () => unsubscribe();
    }, [professionalId]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Timer for active stint
    useEffect(() => {
        const currentActiveStint = activeStints.find(s => s.status === 'in_progress');
        if (!currentActiveStint?.clockInTime) {
            setElapsedTime(0);
            return;
        }

        const clockIn = currentActiveStint.clockInTime instanceof Date
            ? currentActiveStint.clockInTime
            : new Date(currentActiveStint.clockInTime);

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - clockIn.getTime()) / 1000);
            setElapsedTime(elapsed);
        }, 1000);

        return () => clearInterval(interval);
    }, [activeStints]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchStats();
        setRefreshing(false);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 1000) {
            return `KSh ${(amount / 1000).toFixed(0)}K`;
        }
        return `KSh ${amount.toLocaleString()}`;
    };

    // Format elapsed time as HH:MM:SS
    const formatElapsedTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (authLoading || isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <SkeletonDashboard />
            </SafeAreaView>
        );
    }

    const currentActiveStint = activeStints.find(s => s.status === 'in_progress');
    const displayName = professionalData?.fullName?.split(' ')[0] || 'Professional';
    const displayRole = professionalData?.primaryRole || '';

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
                        <Text style={styles.userName}>{displayName}</Text>
                        {displayRole && (
                            <View style={styles.roleTag}>
                                <Text style={styles.roleText}>{displayRole}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.headerRight}>
                        {stats.rating > 0 && (
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={14} color={Colors.warning} />
                                <Text style={styles.ratingText}>{stats.rating.toFixed(1)}</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={styles.notifButton}
                            onPress={() => router.push('/notifications' as any)}
                        >
                            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
                            <View style={styles.notifDot} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Active Stint Card (if in progress) */}
                {currentActiveStint ? (
                    <GradientBorderCard style={styles.activeStintWrapper}>
                        <View style={styles.activeStintCard}>
                            <View style={styles.activeHeader}>
                                <StatusBadge status="in_progress" />
                                <Text style={styles.activeTime}>
                                    {currentActiveStint.clockInTime
                                        ? `Started ${new Date(currentActiveStint.clockInTime).toLocaleTimeString()}`
                                        : 'In Progress'}
                                </Text>
                            </View>
                            <Text style={styles.activeRole}>{currentActiveStint.profession}</Text>
                            <Text style={styles.activeClinic}>{currentActiveStint.employerName}</Text>
                            <Text style={styles.activeLocation}>
                                <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                                {' '}{currentActiveStint.city}
                            </Text>

                            {/* Live Elapsed Timer */}
                            <View style={styles.activeTimerSection}>
                                <Text style={styles.activeTimerLabel}>Time Elapsed</Text>
                                <Text style={styles.activeTimerValue}>{formatElapsedTime(elapsedTime)}</Text>
                            </View>

                            <Button
                                title="Clock Out"
                                variant="danger"
                                onPress={() => router.push('/(professional)/my-stints' as any)}
                                fullWidth
                                style={{ marginTop: Spacing.base }}
                            />
                        </View>
                    </GradientBorderCard>
                ) : (
                    <View style={styles.heroWrapper}>
                        <HeroActionCard
                            onPress={() => router.push('/(professional)/find-stints' as any)}
                            stuntsCount={suggestedStints.length}
                        />
                    </View>
                )}

                {/* Stats Row */}
                <View style={styles.statsSection}>
                    <GlassmorphismStatCard
                        title="Completed"
                        value={stats.completedThisMonth}
                        subtitle="Total stints"
                        delay={0}
                        accentColor={Colors.success}
                        icon={<Ionicons name="checkmark-circle" size={20} color={Colors.success} />}
                    />
                    <GlassmorphismStatCard
                        title="Earnings"
                        value={formatCurrency(stats.earnings)}
                        subtitle="All time"
                        delay={100}
                        accentColor={Colors.primary}
                        icon={<Ionicons name="wallet" size={20} color={Colors.primary} />}
                    />
                </View>
                <View style={styles.statsSection}>
                    <GlassmorphismStatCard
                        title="Rating"
                        value={stats.rating > 0 ? stats.rating.toFixed(1) : 'N/A'}
                        subtitle="Avg rating"
                        delay={200}
                        accentColor={Colors.warning}
                        icon={<Ionicons name="star" size={20} color={Colors.warning} />}
                    />
                    <GlassmorphismStatCard
                        title="Active"
                        value={activeStints.length}
                        subtitle="Upcoming stints"
                        delay={300}
                        accentColor={Colors.accent}
                        icon={<Ionicons name="calendar" size={20} color={Colors.accent} />}
                    />
                </View>

                {/* Payout Info Card */}
                <AnimatedCard delay={400} glassmorphism style={styles.payoutInfoCard}>
                    <View style={styles.payoutInfoHeader}>
                        <Ionicons name="information-circle" size={20} color={Colors.info} />
                        <Text style={styles.payoutInfoTitle}>Your Payout</Text>
                    </View>
                    <Text style={styles.payoutInfoDesc}>
                        Offered Rate - 5% platform fee - M-Pesa cost
                    </Text>
                </AnimatedCard>

                {/* Available Stints */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Available Stints</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(professional)/find-stints' as any)}
                            style={styles.seeAllBtn}
                        >
                            <Text style={styles.seeAll}>See all</Text>
                            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {suggestedStints.length === 0 ? (
                        <NoStintsEmptyState
                            userType="professional"
                            onAction={() => router.push('/(professional)/find-stints' as any)}
                        />
                    ) : (
                        suggestedStints.map((stint, index) => (
                            <StintCard
                                key={stint.id}
                                stint={stint}
                                delay={500 + index * 100}
                                onPress={() => router.push('/(professional)/find-stints' as any)}
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
    userName: {
        fontSize: Typography['2xl'],
        fontWeight: '700',
        color: Colors.textPrimary,
        marginTop: 2,
    },
    roleTag: {
        backgroundColor: Colors.primary + '20',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
        alignSelf: 'flex-start',
        marginTop: Spacing.xs,
    },
    roleText: {
        fontSize: Typography.xs,
        color: Colors.primary,
        fontWeight: '500',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.warning + '20',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
    },
    ratingText: {
        fontSize: Typography.sm,
        fontWeight: '600',
        color: Colors.warning,
    },
    notifButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.error,
    },
    heroWrapper: {
        paddingHorizontal: Spacing.xl,
        marginVertical: Spacing.base,
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
    heroCardIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroCardIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: Spacing.md,
        gap: 4,
    },
    heroCardIndicatorText: {
        fontSize: Typography.xs,
        color: 'rgba(255,255,255,0.7)',
    },
    activeStintWrapper: {
        marginHorizontal: Spacing.xl,
        marginVertical: Spacing.base,
    },
    activeStintCard: {
        padding: Spacing.sm,
    },
    activeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    activeTime: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
    },
    activeRole: {
        fontSize: Typography.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    activeClinic: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    activeLocation: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
        marginTop: Spacing.xs,
    },
    activeTimerSection: {
        marginTop: Spacing.md,
        padding: Spacing.base,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    activeTimerLabel: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        marginBottom: Spacing.xs,
    },
    activeTimerValue: {
        fontSize: Typography['2xl'],
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        color: Colors.textPrimary,
        letterSpacing: 2,
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
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    trendText: {
        fontSize: 10,
        fontWeight: '600',
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
    payoutInfoCard: {
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    payoutInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    payoutInfoTitle: {
        fontSize: Typography.sm,
        fontWeight: '600',
        color: Colors.info,
    },
    payoutInfoDesc: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    section: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing['2xl'],
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.base,
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
    stintInfo: {
        flex: 1,
    },
    stintRole: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    stintClinic: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    stintRate: {
        alignItems: 'flex-end',
    },
    rateValue: {
        fontSize: Typography.lg,
        fontWeight: '700',
        color: Colors.success,
    },
    rateType: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
    },
    stintMeta: {
        flexDirection: 'row',
        gap: Spacing.lg,
        marginTop: Spacing.md,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    urgentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.warning + '20',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    urgentText: {
        fontSize: Typography.xs,
        color: Colors.warning,
        fontWeight: '500',
    },
    bidBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primary + '20',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    bidText: {
        fontSize: Typography.xs,
        color: Colors.primary,
        fontWeight: '500',
    },
    payoutRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    payoutInfo: {},
    payoutLabel: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
    },
    payoutValue: {
        fontSize: Typography.sm,
        fontWeight: '600',
        color: Colors.success,
    },
    applyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primary + '15',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    applyBtnText: {
        fontSize: Typography.sm,
        fontWeight: '600',
        color: Colors.primary,
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
