import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
    getPayoutsByProfessional,
    getStintsByProfessional,
} from '../../services/firestore';
import {
    AnimatedCard,
    AnimatedNumber,
    ProgressBar,
    SkeletonStats,
    SkeletonList,
    NoEarningsEmptyState,
} from '../../components';
import { Colors, Typography, Spacing, BorderRadius, Fees } from '../../constants/theme';
import { Payout, Stint } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animated Stat Card
const EarningsStatCard = ({
    icon,
    label,
    value,
    color,
    delay = 0,
}: any) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

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
                styles.statCard,
                { opacity: fadeAnim, transform: [{ translateY }] }
            ]}
        >
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={styles.statLabel}>{label}</Text>
            {typeof value === 'number' ? (
                <AnimatedNumber
                    value={value}
                    prefix="KSh "
                    style={styles.statValue}
                    duration={1200}
                />
            ) : (
                <Text style={styles.statValue}>{value}</Text>
            )}
        </Animated.View>
    );
};

// Simple Bar Chart for Monthly Earnings
const EarningsChart = ({ data }: { data: { month: string; amount: number }[] }) => {
    const maxAmount = Math.max(...data.map(d => d.amount), 1);

    return (
        <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Monthly Earnings</Text>
            <View style={styles.chartBars}>
                {data.map((item, index) => {
                    const height = (item.amount / maxAmount) * 100;
                    return (
                        <View key={index} style={styles.chartBarWrapper}>
                            <View style={styles.chartBarContainer}>
                                <LinearGradient
                                    colors={[Colors.gradientStart, Colors.gradientEnd]}
                                    style={[styles.chartBar, { height: `${Math.max(height, 5)}%` }]}
                                />
                            </View>
                            <Text style={styles.chartLabel}>{item.month}</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

// Enhanced Payout Card
const PayoutCard = ({ payout, delay }: { payout: Payout; delay: number }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return Colors.success;
            case 'pending': return Colors.warning;
            case 'failed': return Colors.error;
            default: return Colors.textMuted;
        }
    };

    const formatDate = (date: Date | undefined) => {
        if (!date) return 'N/A';
        try {
            return new Date(date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return 'N/A';
        }
    };

    const statusColor = getStatusColor(payout.status);

    return (
        <AnimatedCard delay={delay} style={styles.payoutCard}>
            <View style={styles.payoutHeader}>
                <View style={styles.payoutLeft}>
                    <View style={[styles.payoutIconBg, { backgroundColor: statusColor + '15' }]}>
                        <Ionicons
                            name={payout.status === 'completed' ? 'checkmark-circle' : 'time'}
                            size={20}
                            color={statusColor}
                        />
                    </View>
                    <View style={styles.payoutInfo}>
                        <Text style={styles.payoutAmount}>
                            KSh {payout.netAmount.toLocaleString()}
                        </Text>
                        <Text style={styles.payoutDate}>
                            {formatDate(payout.processedAt || payout.createdAt)}
                        </Text>
                    </View>
                </View>
                <View style={[styles.payoutStatus, { backgroundColor: statusColor + '15' }]}>
                    <Text style={[styles.payoutStatusText, { color: statusColor }]}>
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    </Text>
                </View>
            </View>
            {payout.transactionId && (
                <Text style={styles.transactionId}>
                    Ref: {payout.transactionId}
                </Text>
            )}
        </AnimatedCard>
    );
};

// Stint Earnings Card
const StintEarningsCard = ({ stint, delay }: { stint: Stint; delay: number }) => {
    const rate = stint.offeredRate || 0;
    const platformFee = rate * Fees.professionalService;
    const mpesaCost = 50;
    const payout = rate - platformFee - mpesaCost;

    const formatDate = (date: Date | undefined) => {
        if (!date) return 'N/A';
        try {
            return new Date(date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
            });
        } catch {
            return 'N/A';
        }
    };

    return (
        <AnimatedCard delay={delay} style={styles.stintCard}>
            <View style={styles.stintHeader}>
                <View style={styles.stintInfo}>
                    <Text style={styles.stintRole}>{stint.profession}</Text>
                    <Text style={styles.stintClinic}>{stint.employerName}</Text>
                </View>
                <View style={styles.stintBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                    <Text style={styles.stintBadgeText}>Completed</Text>
                </View>
            </View>

            <View style={styles.stintMeta}>
                <View style={styles.stintMetaItem}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.stintMetaText}>{formatDate(stint.completedAt)}</Text>
                </View>
                <View style={styles.stintMetaItem}>
                    <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.stintMetaText}>{stint.city}</Text>
                </View>
            </View>

            <View style={styles.earningsBreakdown}>
                <View style={styles.earningsRow}>
                    <Text style={styles.earningsLabel}>Offered Rate</Text>
                    <Text style={styles.earningsValue}>KSh {rate.toLocaleString()}</Text>
                </View>
                <View style={styles.earningsRow}>
                    <Text style={styles.earningsLabel}>Platform Fee (5%)</Text>
                    <Text style={[styles.earningsValue, styles.deduction]}>
                        -KSh {platformFee.toLocaleString()}
                    </Text>
                </View>
                <View style={styles.earningsRow}>
                    <Text style={styles.earningsLabel}>M-Pesa Cost</Text>
                    <Text style={[styles.earningsValue, styles.deduction]}>-KSh 50</Text>
                </View>
                <View style={styles.earningsDivider} />
                <View style={styles.earningsRow}>
                    <Text style={styles.payoutLabelText}>Your Payout</Text>
                    <Text style={styles.payoutValueText}>KSh {payout.toLocaleString()}</Text>
                </View>
            </View>
        </AnimatedCard>
    );
};

export default function EarningsScreen() {
    const { user, professionalData } = useAuth();

    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [completedStints, setCompletedStints] = useState<Stint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const professionalId = user?.uid || professionalData?.id || '';

    const fetchData = async () => {
        if (!professionalId) {
            setIsLoading(false);
            return;
        }

        try {
            const [payoutsData, stintsData] = await Promise.all([
                getPayoutsByProfessional(professionalId),
                getStintsByProfessional(professionalId),
            ]);

            setPayouts(payoutsData);
            setCompletedStints(stintsData.filter(s =>
                s.status === 'completed' || s.status === 'settled'
            ));
        } catch (error) {
            console.error('Error fetching earnings data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [professionalId]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    // Calculate totals
    const totalEarnings = completedStints.reduce((sum, stint) => {
        const rate = stint.offeredRate || 0;
        const platformFee = rate * Fees.professionalService;
        const mpesaCost = 50;
        return sum + (rate - platformFee - mpesaCost);
    }, 0);

    const pendingPayouts = payouts
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.netAmount, 0);

    const completedPayoutsTotal = payouts
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.netAmount, 0);

    // Generate monthly earnings data for chart (last 6 months)
    const getMonthlyData = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const chartData = [];

        for (let i = 5; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStints = completedStints.filter(s => {
                if (!s.completedAt) return false;
                const completedDate = new Date(s.completedAt);
                return completedDate.getMonth() === month.getMonth() &&
                    completedDate.getFullYear() === month.getFullYear();
            });

            const monthlyTotal = monthStints.reduce((sum, stint) => {
                const rate = stint.offeredRate || 0;
                return sum + (rate - rate * Fees.professionalService - 50);
            }, 0);

            chartData.push({
                month: months[month.getMonth()],
                amount: monthlyTotal,
            });
        }

        return chartData;
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.title}>Earnings</Text>
                    <Text style={styles.subtitle}>Track your income from stints</Text>
                </View>
                <SkeletonStats count={2} style={{ marginHorizontal: Spacing.xl }} />
                <SkeletonList count={3} showAvatar={false} style={{ marginHorizontal: Spacing.xl, marginTop: Spacing.lg }} />
            </SafeAreaView>
        );
    }

    const monthlyData = getMonthlyData();
    const hasData = completedStints.length > 0 || payouts.length > 0;

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
                    <Text style={styles.title}>Earnings</Text>
                    <Text style={styles.subtitle}>Track your income from stints</Text>
                </View>

                {/* Summary Stats */}
                <View style={styles.statsRow}>
                    <EarningsStatCard
                        icon="wallet"
                        label="Total Earned"
                        value={totalEarnings}
                        color={Colors.success}
                        delay={0}
                    />
                    <EarningsStatCard
                        icon="hourglass"
                        label="Pending"
                        value={pendingPayouts}
                        color={Colors.warning}
                        delay={100}
                    />
                </View>

                <View style={styles.statsRow}>
                    <EarningsStatCard
                        icon="checkmark-done"
                        label="Paid Out"
                        value={completedPayoutsTotal}
                        color={Colors.primary}
                        delay={200}
                    />
                    <EarningsStatCard
                        icon="briefcase"
                        label="Stints Done"
                        value={`${completedStints.length}`}
                        color={Colors.info}
                        delay={300}
                    />
                </View>

                {!hasData ? (
                    <View style={styles.emptyWrapper}>
                        <NoEarningsEmptyState />
                    </View>
                ) : (
                    <>
                        {/* Monthly Earnings Chart */}
                        <AnimatedCard delay={400} style={styles.chartCard}>
                            <EarningsChart data={monthlyData} />
                        </AnimatedCard>

                        {/* Fee Info */}
                        <AnimatedCard delay={500} glassmorphism style={styles.feeInfoCard}>
                            <View style={styles.feeInfoHeader}>
                                <Ionicons name="information-circle" size={20} color={Colors.info} />
                                <Text style={styles.feeInfoTitle}>How Payouts Work</Text>
                            </View>
                            <Text style={styles.feeInfoText}>
                                Your payout = Offered Rate - 5% platform fee - ~KSh 50 M-Pesa cost
                            </Text>
                            <View style={styles.feeProgress}>
                                <View style={styles.feeProgressItem}>
                                    <Text style={styles.feeProgressLabel}>You Keep</Text>
                                    <ProgressBar progress={95} color={Colors.success} height={4} />
                                    <Text style={styles.feeProgressValue}>~95%</Text>
                                </View>
                            </View>
                        </AnimatedCard>

                        {/* Recent Completed Stints */}
                        {completedStints.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Recent Completed Stints</Text>
                                {completedStints.slice(0, 5).map((stint, index) => (
                                    <StintEarningsCard
                                        key={stint.id}
                                        stint={stint}
                                        delay={600 + index * 80}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Payout History */}
                        {payouts.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Payout History</Text>
                                {payouts.slice(0, 10).map((payout, index) => (
                                    <PayoutCard
                                        key={payout.id}
                                        payout={payout}
                                        delay={800 + index * 80}
                                    />
                                ))}
                            </View>
                        )}
                    </>
                )}
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
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.base,
    },
    title: {
        fontSize: Typography['2xl'],
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    subtitle: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(26, 41, 66, 0.7)',
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    statLabel: {
        fontSize: Typography.xs,
        color: Colors.textSecondary,
    },
    statValue: {
        fontSize: Typography.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginTop: Spacing.xs,
    },
    emptyWrapper: {
        marginHorizontal: Spacing.xl,
        marginTop: Spacing.lg,
    },
    chartCard: {
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    chartContainer: {},
    chartTitle: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    chartBars: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 120,
    },
    chartBarWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    chartBarContainer: {
        width: 24,
        height: 100,
        justifyContent: 'flex-end',
        backgroundColor: Colors.border,
        borderRadius: BorderRadius.sm,
        overflow: 'hidden',
    },
    chartBar: {
        width: '100%',
        borderRadius: BorderRadius.sm,
    },
    chartLabel: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        marginTop: Spacing.xs,
    },
    feeInfoCard: {
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    feeInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    feeInfoTitle: {
        fontSize: Typography.sm,
        fontWeight: '600',
        color: Colors.info,
    },
    feeInfoText: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    feeProgress: {
        marginTop: Spacing.md,
    },
    feeProgressItem: {},
    feeProgressLabel: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        marginBottom: Spacing.xs,
    },
    feeProgressValue: {
        fontSize: Typography.xs,
        color: Colors.success,
        marginTop: Spacing.xs,
    },
    section: {
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: Typography.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
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
    stintBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.success + '15',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    stintBadgeText: {
        fontSize: Typography.xs,
        color: Colors.success,
        fontWeight: '500',
    },
    stintMeta: {
        flexDirection: 'row',
        gap: Spacing.lg,
        marginTop: Spacing.sm,
        marginBottom: Spacing.md,
    },
    stintMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    stintMetaText: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
    },
    earningsBreakdown: {
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    earningsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.xs,
    },
    earningsLabel: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    earningsValue: {
        fontSize: Typography.sm,
        color: Colors.textPrimary,
    },
    deduction: {
        color: Colors.error,
    },
    earningsDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.sm,
    },
    payoutLabelText: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    payoutValueText: {
        fontSize: Typography.lg,
        fontWeight: '700',
        color: Colors.success,
    },
    payoutCard: {
        marginBottom: Spacing.md,
    },
    payoutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    payoutLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    payoutIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    payoutInfo: {},
    payoutAmount: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    payoutDate: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
        marginTop: 2,
    },
    payoutStatus: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    payoutStatusText: {
        fontSize: Typography.xs,
        fontWeight: '500',
    },
    transactionId: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        marginTop: Spacing.sm,
    },
});
