import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { getApplicationsByProfessional, getStintsByProfessional, getPayoutsByProfessional } from '../../services/firestore';
import { Button, RoleSwitcher } from '../../components';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { StintApplication, Stint, Payout } from '../../types';

export default function ProfessionalAccountScreen() {
    const router = useRouter();
    const { user, professionalData, dualRoleInfo, canAddSecondRole, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalApplications: 0,
        acceptedApplications: 0,
        completedStints: 0,
        totalEarnings: 0,
    });
    const [recentActivity, setRecentActivity] = useState<{
        applications: StintApplication[];
        completedStints: Stint[];
    }>({ applications: [], completedStints: [] });

    const professionalId = professionalData?.id || user?.uid || '';

    const loadData = async () => {
        if (!professionalId) return;

        try {
            const [applications, stints, payouts] = await Promise.all([
                getApplicationsByProfessional(professionalId),
                getStintsByProfessional(professionalId),
                getPayoutsByProfessional(professionalId),
            ]);

            const completedStints = stints.filter(s => s.status === 'completed' || s.status === 'settled');
            const totalEarnings = payouts.reduce((sum, p) => sum + (p.netAmount || 0), 0);

            setStats({
                totalApplications: applications.length,
                acceptedApplications: applications.filter(a => a.status === 'accepted').length,
                completedStints: completedStints.length,
                totalEarnings,
            });

            setRecentActivity({
                applications: applications.slice(0, 5),
                completedStints: completedStints.slice(0, 5),
            });
        } catch (error) {
            console.error('Error loading account data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [professionalId]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await AsyncStorage.clear();
                        await logout();
                    } catch (e) {
                        console.log('Logout error:', e);
                    }
                    router.dismissAll();
                    router.replace('/');
                },
            },
        ]);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'accepted': return Colors.success;
            case 'pending': return Colors.warning;
            case 'declined': case 'withdrawn': return Colors.error;
            default: return Colors.textMuted;
        }
    };

    const formatDate = (date: Date | undefined) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading your account...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Account</Text>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={32} color={Colors.textMuted} />
                            </View>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.userName}>{professionalData?.fullName || 'Professional'}</Text>
                            <Text style={styles.userRole}>{professionalData?.primaryRole || 'Healthcare Professional'}</Text>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={14} color={Colors.warning} />
                                <Text style={styles.ratingText}>
                                    {professionalData?.averageRating?.toFixed(1) || '0.0'} rating
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Role Switcher */}
                    {(dualRoleInfo?.hasEmployerRole || canAddSecondRole()) && (
                        <View style={styles.roleSwitcherContainer}>
                            <RoleSwitcher variant="compact" />
                        </View>
                    )}
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Ionicons name="document-text" size={24} color={Colors.primary} />
                        <Text style={styles.statValue}>{stats.totalApplications}</Text>
                        <Text style={styles.statLabel}>Applications</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                        <Text style={styles.statValue}>{stats.acceptedApplications}</Text>
                        <Text style={styles.statLabel}>Accepted</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="medical" size={24} color={Colors.accent} />
                        <Text style={styles.statValue}>{stats.completedStints}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="wallet" size={24} color={Colors.success} />
                        <Text style={styles.statValue}>KSh {stats.totalEarnings.toLocaleString()}</Text>
                        <Text style={styles.statLabel}>Total Earned</Text>
                    </View>
                </View>

                {/* Recent Applications */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Applications</Text>
                        <TouchableOpacity onPress={() => router.push('/(professional)/my-stints' as any)}>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    {recentActivity.applications.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="document-text-outline" size={40} color={Colors.textMuted} />
                            <Text style={styles.emptyText}>No applications yet</Text>
                            <Text style={styles.emptySubtext}>Start applying for stints to see your history</Text>
                        </View>
                    ) : (
                        recentActivity.applications.map((app, index) => (
                            <View key={app.id || index} style={styles.activityItem}>
                                <View style={styles.activityIcon}>
                                    <Ionicons name="document-text" size={20} color={Colors.primary} />
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityTitle}>Application</Text>
                                    <Text style={styles.activityDate}>{formatDate(app.appliedAt)}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(app.status) + '20' }]}>
                                    <Text style={[styles.statusText, { color: getStatusColor(app.status) }]}>
                                        {app.status}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Completed Stints History */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Stint History</Text>
                        <TouchableOpacity onPress={() => router.push('/(professional)/my-stints' as any)}>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    {recentActivity.completedStints.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="time-outline" size={40} color={Colors.textMuted} />
                            <Text style={styles.emptyText}>No completed stints</Text>
                            <Text style={styles.emptySubtext}>Your completed stints will appear here</Text>
                        </View>
                    ) : (
                        recentActivity.completedStints.map((stint, index) => (
                            <View key={stint.id || index} style={styles.activityItem}>
                                <View style={[styles.activityIcon, { backgroundColor: Colors.success + '20' }]}>
                                    <Ionicons name="checkmark" size={20} color={Colors.success} />
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityTitle}>{stint.profession || 'Stint'}</Text>
                                    <Text style={styles.activityDate}>{stint.employerName}</Text>
                                </View>
                                <Text style={styles.earningsText}>
                                    KSh {((stint.offeredRate || 0) * 0.95).toLocaleString()}
                                </Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() => router.push('/(professional)/find-stints' as any)}
                        >
                            <Ionicons name="search" size={22} color={Colors.primary} />
                            <Text style={styles.quickActionText}>Find Stints</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() => router.push('/(professional)/earnings' as any)}
                        >
                            <Ionicons name="wallet" size={22} color={Colors.primary} />
                            <Text style={styles.quickActionText}>Earnings</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() => router.push('/(professional)/profile' as any)}
                        >
                            <Ionicons name="settings" size={22} color={Colors.primary} />
                            <Text style={styles.quickActionText}>Settings</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Logout */}
                <View style={styles.logoutSection}>
                    <Button
                        title="Logout"
                        variant="outline"
                        onPress={handleLogout}
                        fullWidth
                        icon={<Ionicons name="log-out-outline" size={20} color={Colors.error} />}
                    />
                </View>

                <Text style={styles.version}>Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: Spacing.base,
        color: Colors.textSecondary,
        fontSize: Typography.base,
    },
    header: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.base,
    },
    title: {
        fontSize: Typography['2xl'],
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    profileCard: {
        marginHorizontal: Spacing.xl,
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        marginBottom: Spacing.base,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        marginRight: Spacing.base,
    },
    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        fontSize: Typography.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    userRole: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: Spacing.xs,
    },
    ratingText: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
    },
    roleSwitcherContainer: {
        marginTop: Spacing.base,
        paddingTop: Spacing.base,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        alignItems: 'center',
    },
    statValue: {
        fontSize: Typography.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginTop: Spacing.xs,
    },
    statLabel: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        marginTop: 2,
    },
    section: {
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    sectionTitle: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    seeAll: {
        fontSize: Typography.sm,
        color: Colors.primary,
    },
    emptyCard: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: Typography.base,
        fontWeight: '500',
        color: Colors.textSecondary,
        marginTop: Spacing.sm,
    },
    emptySubtext: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        marginBottom: Spacing.xs,
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: Typography.sm,
        fontWeight: '500',
        color: Colors.textPrimary,
    },
    activityDate: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    statusText: {
        fontSize: Typography.xs,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    earningsText: {
        fontSize: Typography.sm,
        fontWeight: '600',
        color: Colors.success,
    },
    quickActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    quickActionButton: {
        flex: 1,
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        alignItems: 'center',
        gap: Spacing.xs,
    },
    quickActionText: {
        fontSize: Typography.xs,
        color: Colors.primary,
        fontWeight: '500',
    },
    logoutSection: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.base,
    },
    version: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        textAlign: 'center',
        paddingBottom: Spacing.xl,
    },
});
