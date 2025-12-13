import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { getStintsByEmployer, getApplicationsForEmployer, getInvoicesByEmployer } from '../../services/firestore';
import { Button, RoleSwitcher } from '../../components';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Stint, StintApplication, Invoice } from '../../types';

export default function EmployerAccountScreen() {
    const router = useRouter();
    const { user, employerData, dualRoleInfo, canAddSecondRole, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalStints: 0,
        activeStints: 0,
        completedStints: 0,
        pendingApplications: 0,
        totalSpent: 0,
    });
    const [recentActivity, setRecentActivity] = useState<{
        stints: Stint[];
        applications: StintApplication[];
    }>({ stints: [], applications: [] });

    const employerId = employerData?.id || user?.uid || '';

    const loadData = async () => {
        if (!employerId) return;

        try {
            const [stints, applications, invoices] = await Promise.all([
                getStintsByEmployer(employerId),
                getApplicationsForEmployer(employerId),
                getInvoicesByEmployer(employerId),
            ]);

            const activeStints = stints.filter(s =>
                s.status === 'open' || s.status === 'accepted' || s.status === 'in_progress'
            );
            const completedStints = stints.filter(s => s.status === 'completed' || s.status === 'settled');
            const totalSpent = invoices
                .filter(i => i.status === 'paid')
                .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

            setStats({
                totalStints: stints.length,
                activeStints: activeStints.length,
                completedStints: completedStints.length,
                pendingApplications: applications.filter(a => a.status === 'pending').length,
                totalSpent,
            });

            setRecentActivity({
                stints: stints.slice(0, 5),
                applications: applications.filter(a => a.status === 'pending').slice(0, 5),
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
    }, [employerId]);

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
            case 'open': return Colors.info;
            case 'accepted': case 'in_progress': return Colors.primary;
            case 'completed': case 'settled': return Colors.success;
            case 'cancelled': return Colors.error;
            default: return Colors.textMuted;
        }
    };

    const formatDate = (date: Date | undefined) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
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

                {/* Facility Card */}
                <View style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="business" size={32} color={Colors.textMuted} />
                            </View>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.facilityName}>{employerData?.facilityName || 'Your Facility'}</Text>
                            <Text style={styles.contactPerson}>{employerData?.contactPerson || user?.email}</Text>
                            <Text style={styles.location}>
                                <Ionicons name="location" size={12} color={Colors.textMuted} /> {employerData?.city || 'Location'}
                            </Text>
                        </View>
                    </View>

                    {/* Role Switcher */}
                    {(dualRoleInfo?.hasProfessionalRole || canAddSecondRole()) && (
                        <View style={styles.roleSwitcherContainer}>
                            <RoleSwitcher variant="compact" />
                        </View>
                    )}
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Ionicons name="briefcase" size={24} color={Colors.primary} />
                        <Text style={styles.statValue}>{stats.totalStints}</Text>
                        <Text style={styles.statLabel}>Total Stints</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="time" size={24} color={Colors.info} />
                        <Text style={styles.statValue}>{stats.activeStints}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                        <Text style={styles.statValue}>{stats.completedStints}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="document-text" size={24} color={Colors.warning} />
                        <Text style={styles.statValue}>{stats.pendingApplications}</Text>
                        <Text style={styles.statLabel}>Pending Apps</Text>
                    </View>
                </View>

                {/* Total Spent */}
                <View style={styles.totalSpentCard}>
                    <View>
                        <Text style={styles.totalSpentLabel}>Total Spent</Text>
                        <Text style={styles.totalSpentValue}>KSh {stats.totalSpent.toLocaleString()}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.viewInvoicesButton}
                        onPress={() => router.push('/(employer)/posted-jobs' as any)}
                    >
                        <Text style={styles.viewInvoicesText}>View All</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Pending Applications */}
                {recentActivity.applications.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Pending Applications</Text>
                            <TouchableOpacity onPress={() => router.push('/(employer)/posted-jobs' as any)}>
                                <Text style={styles.seeAll}>Review All</Text>
                            </TouchableOpacity>
                        </View>
                        {recentActivity.applications.map((app, index) => (
                            <View key={app.id || index} style={styles.activityItem}>
                                <View style={styles.activityIcon}>
                                    <Ionicons name="person" size={20} color={Colors.primary} />
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityTitle}>{app.professionalName}</Text>
                                    <Text style={styles.activitySubtitle}>{app.professionalRole}</Text>
                                </View>
                                <TouchableOpacity style={styles.reviewButton}>
                                    <Text style={styles.reviewButtonText}>Review</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* Recent Stints */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Stints</Text>
                        <TouchableOpacity onPress={() => router.push('/(employer)/posted-jobs' as any)}>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    {recentActivity.stints.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="briefcase-outline" size={40} color={Colors.textMuted} />
                            <Text style={styles.emptyText}>No stints posted yet</Text>
                            <Text style={styles.emptySubtext}>Post your first stint to find professionals</Text>
                        </View>
                    ) : (
                        recentActivity.stints.map((stint, index) => (
                            <View key={stint.id || index} style={styles.activityItem}>
                                <View style={[styles.activityIcon, { backgroundColor: getStatusColor(stint.status) + '20' }]}>
                                    <Ionicons
                                        name={stint.status === 'completed' ? 'checkmark' : 'briefcase'}
                                        size={20}
                                        color={getStatusColor(stint.status)}
                                    />
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityTitle}>{stint.profession}</Text>
                                    <Text style={styles.activitySubtitle}>{formatDate(stint.shiftDate as any)}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(stint.status) + '20' }]}>
                                    <Text style={[styles.statusText, { color: getStatusColor(stint.status) }]}>
                                        {stint.status}
                                    </Text>
                                </View>
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
                            onPress={() => router.push('/(employer)/post-stint' as any)}
                        >
                            <Ionicons name="add-circle" size={22} color={Colors.primary} />
                            <Text style={styles.quickActionText}>Post Stint</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() => router.push('/(employer)/posted-jobs' as any)}
                        >
                            <Ionicons name="list" size={22} color={Colors.primary} />
                            <Text style={styles.quickActionText}>My Stints</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() => router.push('/(employer)/profile' as any)}
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
        borderRadius: 12,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    facilityName: {
        fontSize: Typography.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    contactPerson: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    location: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        marginTop: Spacing.xs,
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
        marginBottom: Spacing.base,
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
    totalSpentCard: {
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
        backgroundColor: Colors.primary + '10',
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalSpentLabel: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    totalSpentValue: {
        fontSize: Typography.xl,
        fontWeight: '700',
        color: Colors.primary,
        marginTop: 2,
    },
    viewInvoicesButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewInvoicesText: {
        fontSize: Typography.sm,
        color: Colors.primary,
        fontWeight: '500',
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
    activitySubtitle: {
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
    reviewButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 6,
        borderRadius: BorderRadius.md,
    },
    reviewButtonText: {
        fontSize: Typography.xs,
        color: '#fff',
        fontWeight: '500',
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
