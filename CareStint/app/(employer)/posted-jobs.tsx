import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
    subscribeToEmployerStints,
    getApplicationsByStint,
    cancelStint,
} from '../../services/firestore';
import { Card, Button } from '../../components';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Stint, StintApplication } from '../../types';

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'open': return Colors.primary;
            case 'accepted': return Colors.warning;
            case 'in_progress': return Colors.success;
            case 'completed': return Colors.info;
            case 'cancelled': return Colors.error;
            case 'settled': return Colors.success;
            default: return Colors.textMuted;
        }
    };

    const getStatusLabel = () => {
        switch (status) {
            case 'open': return 'Open';
            case 'accepted': return 'Accepted';
            case 'in_progress': return 'In Progress';
            case 'completed': return 'Completed';
            case 'cancelled': return 'Cancelled';
            case 'settled': return 'Settled';
            default: return status;
        }
    };

    return (
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusLabel()}</Text>
        </View>
    );
};

export default function PostedJobsScreen() {
    const router = useRouter();
    const { user, employerData } = useAuth();

    const [stints, setStints] = useState<Stint[]>([]);
    const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<string>('all');

    const employerId = user?.uid || employerData?.id || '';

    // Subscribe to employer's stints
    useEffect(() => {
        if (!employerId) {
            setIsLoading(false);
            return;
        }

        const unsubscribe = subscribeToEmployerStints(employerId, async (stintsData) => {
            setStints(stintsData);
            setIsLoading(false);

            // Fetch application counts for each stint
            const counts: Record<string, number> = {};
            for (const stint of stintsData) {
                try {
                    const applications = await getApplicationsByStint(stint.id);
                    counts[stint.id] = applications.filter(a => a.status === 'pending').length;
                } catch (e) {
                    counts[stint.id] = 0;
                }
            }
            setApplicationCounts(counts);
        });

        return () => unsubscribe();
    }, [employerId]);

    const onRefresh = async () => {
        setRefreshing(true);
        // Data will refresh automatically via subscription
        setTimeout(() => setRefreshing(false), 1000);
    };

    const handleCancelStint = (stint: Stint) => {
        if (stint.status !== 'open') {
            Alert.alert('Cannot Cancel', 'Only open stints can be cancelled.');
            return;
        }

        Alert.alert(
            'Cancel Stint',
            'Are you sure you want to cancel this stint? This action cannot be undone.',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await cancelStint(stint.id, 'Cancelled by employer');
                            Alert.alert('Success', 'Stint has been cancelled.');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to cancel stint.');
                        }
                    },
                },
            ]
        );
    };

    const filteredStints = stints.filter(stint => {
        if (filter === 'all') return true;
        if (filter === 'active') return ['open', 'accepted', 'in_progress'].includes(stint.status);
        if (filter === 'completed') return ['completed', 'settled'].includes(stint.status);
        if (filter === 'cancelled') return stint.status === 'cancelled';
        return true;
    });

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

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading stints...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Posted Stints</Text>
                <Text style={styles.subtitle}>{stints.length} total stints</Text>
            </View>

            {/* Filter Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterRow}
                contentContainerStyle={styles.filterRowContent}
            >
                {['all', 'active', 'completed', 'cancelled'].map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterTab, filter === f && styles.filterTabActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Stints List */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
                contentContainerStyle={styles.listContent}
            >
                {filteredStints.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="briefcase-outline" size={64} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>No stints found</Text>
                        <Text style={styles.emptySubtext}>
                            {filter !== 'all' ? 'Try a different filter' : 'Post your first stint'}
                        </Text>
                        {filter === 'all' && (
                            <Button
                                title="Post New Stint"
                                onPress={() => router.push('/(employer)/post-stint' as any)}
                                style={{ marginTop: Spacing.lg }}
                            />
                        )}
                    </View>
                ) : (
                    filteredStints.map((stint) => (
                        <TouchableOpacity
                            key={stint.id}
                            style={styles.stintCard}
                            onPress={() => router.push('/(employer)/stints' as any)}
                        >
                            <View style={styles.stintHeader}>
                                <View style={styles.stintInfo}>
                                    <Text style={styles.stintRole}>{stint.profession}</Text>
                                    <Text style={styles.stintDate}>{formatDate(stint.shiftDate)}</Text>
                                </View>
                                <StatusBadge status={stint.status} />
                            </View>

                            <View style={styles.stintDetails}>
                                <View style={styles.detailRow}>
                                    <View style={styles.detailItem}>
                                        <Ionicons name="cash-outline" size={16} color={Colors.textMuted} />
                                        <Text style={styles.detailText}>
                                            KSh {stint.offeredRate?.toLocaleString()}
                                        </Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                                        <Text style={styles.detailText}>
                                            {stint.shiftType === 'full_day' ? 'Full Day' : 'Half Day'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.detailRow}>
                                    <View style={styles.detailItem}>
                                        <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
                                        <Text style={styles.detailText}>{stint.city}</Text>
                                    </View>
                                    {(applicationCounts[stint.id] || 0) > 0 && (
                                        <View style={styles.applicationsBadge}>
                                            <Ionicons name="people-outline" size={14} color={Colors.warning} />
                                            <Text style={styles.applicationsText}>
                                                {applicationCounts[stint.id]} pending
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {stint.confirmedProfessionalName && (
                                <View style={styles.assignedPro}>
                                    <Ionicons name="person-circle-outline" size={16} color={Colors.success} />
                                    <Text style={styles.assignedProText}>
                                        Assigned: {stint.confirmedProfessionalName}
                                    </Text>
                                </View>
                            )}

                            {stint.status === 'open' && (
                                <View style={styles.cardActions}>
                                    <Button
                                        title="View Applications"
                                        variant="outline"
                                        onPress={() => router.push('/(employer)/stints' as any)}
                                        style={{ flex: 1, marginRight: Spacing.sm }}
                                    />
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => handleCancelStint(stint)}
                                    >
                                        <Ionicons name="close-circle" size={24} color={Colors.error} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/(employer)/post-stint' as any)}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
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
    filterRow: {
        marginBottom: Spacing.base,
    },
    filterRowContent: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
    },
    filterTab: {
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.full,
        marginRight: Spacing.sm,
    },
    filterTabActive: {
        backgroundColor: Colors.primary,
    },
    filterTabText: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    filterTabTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 100,
    },
    stintCard: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
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
    stintDate: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
        marginTop: Spacing.xs,
    },
    stintDetails: {
        marginTop: Spacing.md,
        gap: Spacing.sm,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    detailText: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    applicationsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: Colors.warning + '20',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    applicationsText: {
        fontSize: Typography.xs,
        color: Colors.warning,
        fontWeight: '500',
    },
    assignedPro: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.md,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    assignedProText: {
        fontSize: Typography.sm,
        color: Colors.success,
        fontWeight: '500',
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.md,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    cancelButton: {
        padding: Spacing.xs,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing['4xl'],
    },
    emptyText: {
        fontSize: Typography.lg,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginTop: Spacing.lg,
    },
    emptySubtext: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
        marginTop: Spacing.xs,
    },
    statusBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    statusText: {
        fontSize: Typography.xs,
        fontWeight: '500',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
