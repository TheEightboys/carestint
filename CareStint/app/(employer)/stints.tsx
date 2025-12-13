import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    Alert,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
    subscribeToEmployerStints,
    subscribeToStintApplications,
    updateApplicationStatus,
    acceptStint,
    updateStintStatus,
} from '../../services/firestore';
import { Button, Card } from '../../components';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Stint, StintApplication } from '../../types';

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'pending': return Colors.warning;
            case 'accepted': return Colors.success;
            case 'declined': return Colors.error;
            case 'withdrawn': return Colors.textMuted;
            default: return Colors.textMuted;
        }
    };

    return (
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
        </View>
    );
};

export default function StintsManagementScreen() {
    const router = useRouter();
    const { user, employerData } = useAuth();

    const [stints, setStints] = useState<Stint[]>([]);
    const [selectedStint, setSelectedStint] = useState<Stint | null>(null);
    const [applications, setApplications] = useState<StintApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingApps, setLoadingApps] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const employerId = user?.uid || employerData?.id || '';

    // Subscribe to employer's stints
    useEffect(() => {
        if (!employerId) {
            setIsLoading(false);
            return;
        }

        const unsubscribe = subscribeToEmployerStints(employerId, (stintsData) => {
            // Only show open or accepted stints that need management
            const manageableStints = stintsData.filter(s =>
                ['open', 'accepted'].includes(s.status)
            );
            setStints(manageableStints);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [employerId]);

    // Subscribe to applications when a stint is selected
    useEffect(() => {
        if (!selectedStint) {
            setApplications([]);
            return;
        }

        setLoadingApps(true);
        const unsubscribe = subscribeToStintApplications(selectedStint.id, (apps) => {
            setApplications(apps);
            setLoadingApps(false);
        });

        return () => unsubscribe();
    }, [selectedStint]);

    const handleAcceptApplication = async (application: StintApplication) => {
        if (!selectedStint) return;

        Alert.alert(
            'Accept Application',
            `Accept ${application.professionalName} for this stint?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Accept',
                    onPress: async () => {
                        setActionLoading(application.id);
                        try {
                            // Update application status
                            await updateApplicationStatus(application.id, 'accepted');

                            // Update stint with assigned professional
                            await acceptStint(
                                selectedStint.id,
                                application.professionalId,
                                application.professionalName
                            );

                            // Decline other pending applications
                            const otherApps = applications.filter(a =>
                                a.id !== application.id && a.status === 'pending'
                            );
                            for (const app of otherApps) {
                                await updateApplicationStatus(app.id, 'declined');
                            }

                            Alert.alert('Success', 'Application accepted!');
                            setSelectedStint(null);
                        } catch (error) {
                            console.error('Error accepting application:', error);
                            Alert.alert('Error', 'Failed to accept application.');
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        );
    };

    const handleDeclineApplication = async (application: StintApplication) => {
        Alert.alert(
            'Decline Application',
            `Are you sure you want to decline ${application.professionalName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Decline',
                    style: 'destructive',
                    onPress: async () => {
                        setActionLoading(application.id);
                        try {
                            await updateApplicationStatus(application.id, 'declined');
                            Alert.alert('Done', 'Application declined.');
                        } catch (error) {
                            console.error('Error declining application:', error);
                            Alert.alert('Error', 'Failed to decline application.');
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        );
    };

    const renderStintCard = ({ item }: { item: Stint }) => {
        const pendingCount = 0; // Would be from applications

        return (
            <TouchableOpacity
                style={styles.stintCard}
                onPress={() => setSelectedStint(item)}
            >
                <View style={styles.stintHeader}>
                    <Text style={styles.stintRole}>{item.profession}</Text>
                    <View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: item.status === 'open' ? Colors.primary + '20' : Colors.success + '20' }
                        ]}
                    >
                        <Text
                            style={[
                                styles.statusText,
                                { color: item.status === 'open' ? Colors.primary : Colors.success }
                            ]}
                        >
                            {item.status === 'open' ? 'Open' : 'Accepted'}
                        </Text>
                    </View>
                </View>
                <View style={styles.stintDetails}>
                    <View style={styles.detailItem}>
                        <Ionicons name="cash-outline" size={16} color={Colors.textMuted} />
                        <Text style={styles.detailText}>KSh {item.offeredRate?.toLocaleString()}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
                        <Text style={styles.detailText}>{item.city}</Text>
                    </View>
                </View>
                {item.confirmedProfessionalName ? (
                    <View style={styles.assignedPro}>
                        <Ionicons name="person-circle" size={16} color={Colors.success} />
                        <Text style={styles.assignedText}>{item.confirmedProfessionalName}</Text>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.viewAppsButton}>
                        <Text style={styles.viewAppsText}>View Applications</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
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
                <Text style={styles.title}>Manage Stints</Text>
                <Text style={styles.subtitle}>Review and accept applications</Text>
            </View>

            {/* Stints List */}
            <FlatList
                data={stints}
                keyExtractor={(item) => item.id}
                renderItem={renderStintCard}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="briefcase-outline" size={64} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>No stints to manage</Text>
                        <Text style={styles.emptySubtext}>
                            Post a stint to start receiving applications
                        </Text>
                        <Button
                            title="Post New Stint"
                            onPress={() => router.push('/(employer)/post-stint' as any)}
                            style={{ marginTop: Spacing.lg }}
                        />
                    </View>
                }
            />

            {/* Applications Modal */}
            <Modal
                visible={!!selectedStint}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedStint(null)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Applications</Text>
                        <TouchableOpacity onPress={() => setSelectedStint(null)}>
                            <Ionicons name="close" size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {selectedStint && (
                        <View style={styles.stintSummary}>
                            <Text style={styles.summaryRole}>{selectedStint.profession}</Text>
                            <Text style={styles.summaryDetails}>
                                {selectedStint.shiftType === 'full_day' ? 'Full Day' : 'Half Day'} •
                                KSh {selectedStint.offeredRate?.toLocaleString()}
                            </Text>
                        </View>
                    )}

                    {loadingApps ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    ) : (
                        <ScrollView style={styles.applicationsScroll}>
                            {applications.length === 0 ? (
                                <View style={styles.emptyApps}>
                                    <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
                                    <Text style={styles.emptyAppsText}>No applications yet</Text>
                                </View>
                            ) : (
                                applications.map((app) => (
                                    <Card key={app.id} style={styles.applicationCard}>
                                        <View style={styles.appHeader}>
                                            <View style={styles.appInfo}>
                                                <Text style={styles.appName}>{app.professionalName}</Text>
                                                <Text style={styles.appRole}>{app.professionalRole}</Text>
                                            </View>
                                            <StatusBadge status={app.status} />
                                        </View>

                                        {app.professionalRating && app.professionalRating > 0 && (
                                            <View style={styles.ratingRow}>
                                                <Ionicons name="star" size={14} color={Colors.warning} />
                                                <Text style={styles.ratingText}>
                                                    {app.professionalRating.toFixed(1)} rating
                                                </Text>
                                            </View>
                                        )}

                                        {app.bidAmount && (
                                            <View style={styles.bidRow}>
                                                <Ionicons name="cash" size={14} color={Colors.success} />
                                                <Text style={styles.bidText}>
                                                    Bid: KSh {app.bidAmount.toLocaleString()}
                                                </Text>
                                            </View>
                                        )}

                                        {app.message && (
                                            <Text style={styles.appMessage}>{app.message}</Text>
                                        )}

                                        {app.status === 'pending' && (
                                            <View style={styles.appActions}>
                                                <Button
                                                    title="Accept"
                                                    onPress={() => handleAcceptApplication(app)}
                                                    loading={actionLoading === app.id}
                                                    style={{ flex: 1, marginRight: Spacing.sm }}
                                                />
                                                <Button
                                                    title="Decline"
                                                    variant="outline"
                                                    onPress={() => handleDeclineApplication(app)}
                                                    loading={actionLoading === app.id}
                                                    style={{ flex: 1 }}
                                                />
                                            </View>
                                        )}
                                    </Card>
                                ))
                            )}
                        </ScrollView>
                    )}
                </SafeAreaView>
            </Modal>
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
    listContent: {
        padding: Spacing.xl,
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
        alignItems: 'center',
    },
    stintRole: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    stintDetails: {
        flexDirection: 'row',
        gap: Spacing.lg,
        marginTop: Spacing.md,
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
    assignedPro: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.md,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    assignedText: {
        fontSize: Typography.sm,
        fontWeight: '500',
        color: Colors.success,
    },
    viewAppsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.md,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    viewAppsText: {
        fontSize: Typography.sm,
        fontWeight: '500',
        color: Colors.primary,
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
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: Typography.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    stintSummary: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.backgroundCard,
    },
    summaryRole: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    summaryDetails: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    applicationsScroll: {
        flex: 1,
        padding: Spacing.xl,
    },
    emptyApps: {
        alignItems: 'center',
        paddingVertical: Spacing['2xl'],
    },
    emptyAppsText: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        marginTop: Spacing.md,
    },
    applicationCard: {
        marginBottom: Spacing.md,
        padding: Spacing.base,
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
    },
    appHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    appInfo: {
        flex: 1,
    },
    appName: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    appRole: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.sm,
    },
    ratingText: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    bidRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.sm,
    },
    bidText: {
        fontSize: Typography.sm,
        fontWeight: '500',
        color: Colors.success,
    },
    appMessage: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.sm,
        fontStyle: 'italic',
    },
    appActions: {
        flexDirection: 'row',
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
});
