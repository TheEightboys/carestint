import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    Alert,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
    subscribeToOpenStints,
    addStintApplication,
    checkExistingApplication,
    getApplicationsByProfessional,
} from '../../services/firestore';
import { Card, Button, Input } from '../../components';
import { Colors, Typography, Spacing, BorderRadius, Fees, ProfessionalRoles, Regions } from '../../constants/theme';
import { Stint, StintApplication } from '../../types';

// Filter type
interface Filters {
    profession: string;
    city: string;
    minRate: number;
    shiftType: string;
}

export default function FindStintsScreen() {
    const { user, professionalData } = useAuth();
    const [stints, setStints] = useState<Stint[]>([]);
    const [filteredStints, setFilteredStints] = useState<Stint[]>([]);
    const [selectedStint, setSelectedStint] = useState<Stint | null>(null);
    const [bidAmount, setBidAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [appliedStintIds, setAppliedStintIds] = useState<Set<string>>(new Set());
    const [filters, setFilters] = useState<Filters>({
        profession: '',
        city: '',
        minRate: 0,
        shiftType: '',
    });

    const professionalId = user?.uid || professionalData?.id || '';
    const professionalName = professionalData?.fullName || '';
    const professionalRole = professionalData?.primaryRole || '';

    // Subscribe to open stints
    useEffect(() => {
        const unsubscribe = subscribeToOpenStints((stintsData) => {
            setStints(stintsData);
            setIsInitialLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch user's existing applications to show "Applied" status
    useEffect(() => {
        if (!professionalId) return;

        const fetchApplications = async () => {
            try {
                const applications = await getApplicationsByProfessional(professionalId);
                const appliedIds = new Set(applications.map(app => app.stintId));
                setAppliedStintIds(appliedIds);
            } catch (error) {
                console.error('Error fetching applications:', error);
            }
        };

        fetchApplications();
    }, [professionalId]);

    // Apply filters
    useEffect(() => {
        let result = [...stints];

        if (filters.profession) {
            result = result.filter(s =>
                s.profession?.toLowerCase().includes(filters.profession.toLowerCase())
            );
        }

        if (filters.city) {
            result = result.filter(s =>
                s.city?.toLowerCase().includes(filters.city.toLowerCase())
            );
        }

        if (filters.minRate > 0) {
            result = result.filter(s => (s.offeredRate || 0) >= filters.minRate);
        }

        if (filters.shiftType) {
            result = result.filter(s => s.shiftType === filters.shiftType);
        }

        setFilteredStints(result);
    }, [stints, filters]);

    const handleApply = async (stint: Stint, withBid: boolean = false) => {
        if (!professionalId) {
            Alert.alert('Error', 'Please log in to apply for stints');
            return;
        }

        // Check if already applied
        if (appliedStintIds.has(stint.id)) {
            Alert.alert('Already Applied', 'You have already applied to this stint.');
            return;
        }

        setLoading(true);
        try {
            // Double-check on server
            const alreadyApplied = await checkExistingApplication(stint.id, professionalId);
            if (alreadyApplied) {
                Alert.alert('Already Applied', 'You have already applied to this stint.');
                setAppliedStintIds(prev => new Set([...prev, stint.id]));
                setSelectedStint(null);
                return;
            }

            await addStintApplication({
                stintId: stint.id,
                professionalId: professionalId,
                professionalName: professionalName || 'Professional',
                professionalRole: professionalRole || 'Healthcare Professional',
                professionalRating: professionalData?.averageRating || 0,
                bidAmount: withBid && bidAmount ? parseInt(bidAmount) : undefined,
            });

            // Add to local set
            setAppliedStintIds(prev => new Set([...prev, stint.id]));

            Alert.alert('Success', 'Your application has been submitted!');
            setSelectedStint(null);
            setBidAmount('');
        } catch (error) {
            console.error('Application error:', error);
            Alert.alert('Error', 'Failed to submit application. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const calculatePayout = (rate: number) => {
        const platformFee = rate * Fees.professionalService;
        const mpesaCost = 50;
        return rate - platformFee - mpesaCost;
    };

    const clearFilters = () => {
        setFilters({
            profession: '',
            city: '',
            minRate: 0,
            shiftType: '',
        });
    };

    const hasActiveFilters = filters.profession || filters.city || filters.minRate > 0 || filters.shiftType;

    const renderStintCard = ({ item }: { item: Stint }) => {
        const hasApplied = appliedStintIds.has(item.id);

        return (
            <TouchableOpacity
                style={[styles.stintCard, hasApplied && styles.stintCardApplied]}
                onPress={() => !hasApplied && setSelectedStint(item)}
                disabled={hasApplied}
            >
                <View style={styles.stintHeader}>
                    <View style={styles.stintInfo}>
                        <Text style={styles.stintRole}>{item.profession}</Text>
                        <Text style={styles.stintClinic}>{item.employerName}</Text>
                    </View>
                    <View style={styles.stintRate}>
                        <Text style={styles.rateValue}>KSh {item.offeredRate?.toLocaleString()}</Text>
                        <Text style={styles.rateType}>
                            {item.shiftType === 'half_day' ? 'Half-day' : 'Full-day'}
                        </Text>
                    </View>
                </View>

                <View style={styles.stintDetails}>
                    <View style={styles.detailItem}>
                        <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                        <Text style={styles.detailText}>{item.city}</Text>
                    </View>
                    {item.isUrgent && (
                        <View style={styles.urgentBadge}>
                            <Ionicons name="flash" size={12} color={Colors.warning} />
                            <Text style={styles.urgentText}>Urgent</Text>
                        </View>
                    )}
                    {item.allowBids && (
                        <View style={styles.bidBadge}>
                            <Text style={styles.bidText}>Bids allowed</Text>
                        </View>
                    )}
                    {hasApplied && (
                        <View style={styles.appliedBadge}>
                            <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                            <Text style={styles.appliedText}>Applied</Text>
                        </View>
                    )}
                </View>

                <View style={styles.payoutPreview}>
                    <Text style={styles.payoutLabel}>Your payout:</Text>
                    <Text style={styles.payoutValue}>
                        ~KSh {calculatePayout(item.offeredRate || 0).toLocaleString()}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (isInitialLoading) {
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
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Find Stints</Text>
                    <Text style={styles.subtitle}>{filteredStints.length} available shifts</Text>
                </View>
                <TouchableOpacity
                    style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
                    onPress={() => setShowFilters(true)}
                >
                    <Ionicons
                        name="filter"
                        size={20}
                        color={hasActiveFilters ? Colors.primary : Colors.textPrimary}
                    />
                </TouchableOpacity>
            </View>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <View style={styles.activeFiltersRow}>
                    <Text style={styles.activeFiltersLabel}>Filters:</Text>
                    {filters.profession && (
                        <View style={styles.filterChip}>
                            <Text style={styles.filterChipText}>{filters.profession}</Text>
                        </View>
                    )}
                    {filters.city && (
                        <View style={styles.filterChip}>
                            <Text style={styles.filterChipText}>{filters.city}</Text>
                        </View>
                    )}
                    {filters.minRate > 0 && (
                        <View style={styles.filterChip}>
                            <Text style={styles.filterChipText}>Min: KSh {filters.minRate}</Text>
                        </View>
                    )}
                    {filters.shiftType && (
                        <View style={styles.filterChip}>
                            <Text style={styles.filterChipText}>
                                {filters.shiftType === 'half_day' ? 'Half-day' : 'Full-day'}
                            </Text>
                        </View>
                    )}
                    <TouchableOpacity onPress={clearFilters}>
                        <Text style={styles.clearFilters}>Clear</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Stints List */}
            <FlatList
                data={filteredStints}
                keyExtractor={(item) => item.id}
                renderItem={renderStintCard}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="search-outline" size={64} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>No stints available</Text>
                        <Text style={styles.emptySubtext}>
                            {hasActiveFilters
                                ? 'Try adjusting your filters'
                                : 'New opportunities will appear here'}
                        </Text>
                    </View>
                }
            />

            {/* Filter Modal */}
            <Modal
                visible={showFilters}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowFilters(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Filter Stints</Text>
                        <TouchableOpacity onPress={() => setShowFilters(false)}>
                            <Ionicons name="close" size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalContent}>
                        <Text style={styles.filterLabel}>Profession</Text>
                        <View style={styles.filterOptions}>
                            {['', ...ProfessionalRoles.slice(0, 6)].map((role) => (
                                <TouchableOpacity
                                    key={role || 'all'}
                                    style={[
                                        styles.filterOption,
                                        filters.profession === role && styles.filterOptionActive,
                                    ]}
                                    onPress={() => setFilters({ ...filters, profession: role })}
                                >
                                    <Text style={[
                                        styles.filterOptionText,
                                        filters.profession === role && styles.filterOptionTextActive,
                                    ]}>
                                        {role || 'All'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.filterLabel}>Shift Type</Text>
                        <View style={styles.filterOptions}>
                            {['', 'half_day', 'full_day'].map((type) => (
                                <TouchableOpacity
                                    key={type || 'all'}
                                    style={[
                                        styles.filterOption,
                                        filters.shiftType === type && styles.filterOptionActive,
                                    ]}
                                    onPress={() => setFilters({ ...filters, shiftType: type })}
                                >
                                    <Text style={[
                                        styles.filterOptionText,
                                        filters.shiftType === type && styles.filterOptionTextActive,
                                    ]}>
                                        {type === 'half_day' ? 'Half-day' : type === 'full_day' ? 'Full-day' : 'All'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.filterLabel}>Minimum Rate (KSh)</Text>
                        <TextInput
                            style={styles.filterInput}
                            placeholder="e.g., 5000"
                            placeholderTextColor={Colors.textMuted}
                            value={filters.minRate > 0 ? String(filters.minRate) : ''}
                            onChangeText={(v) => setFilters({ ...filters, minRate: parseInt(v) || 0 })}
                            keyboardType="number-pad"
                        />

                        <Text style={styles.filterLabel}>City</Text>
                        <TextInput
                            style={styles.filterInput}
                            placeholder="e.g., Nairobi"
                            placeholderTextColor={Colors.textMuted}
                            value={filters.city}
                            onChangeText={(v) => setFilters({ ...filters, city: v })}
                        />

                        <View style={styles.filterActions}>
                            <Button
                                title="Clear All"
                                variant="outline"
                                onPress={clearFilters}
                                style={{ flex: 1, marginRight: Spacing.sm }}
                            />
                            <Button
                                title="Apply Filters"
                                onPress={() => setShowFilters(false)}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Stint Detail Modal */}
            <Modal
                visible={!!selectedStint}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedStint(null)}
            >
                {selectedStint && (
                    <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Stint Details</Text>
                            <TouchableOpacity onPress={() => setSelectedStint(null)}>
                                <Ionicons name="close" size={24} color={Colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalContent}>
                            <Text style={styles.modalRole}>{selectedStint.profession}</Text>
                            <Text style={styles.modalClinic}>{selectedStint.employerName}</Text>

                            <Card style={styles.detailCard}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Shift Type</Text>
                                    <Text style={styles.detailValue}>
                                        {selectedStint.shiftType === 'half_day' ? 'Half-day' : 'Full-day'}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Location</Text>
                                    <Text style={styles.detailValue}>{selectedStint.city}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Offered Rate</Text>
                                    <Text style={styles.detailValue}>
                                        KSh {selectedStint.offeredRate?.toLocaleString()}
                                    </Text>
                                </View>
                                {selectedStint.description && (
                                    <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                                        <Text style={styles.detailLabel}>Description</Text>
                                        <Text style={[styles.detailValue, { marginTop: Spacing.xs }]}>
                                            {selectedStint.description}
                                        </Text>
                                    </View>
                                )}
                            </Card>

                            {/* Payout Calculator */}
                            <Card style={styles.payoutCard}>
                                <Text style={styles.payoutCardTitle}>Your Payout</Text>
                                <View style={styles.payoutRow}>
                                    <Text style={styles.payoutRowLabel}>Offered Rate</Text>
                                    <Text style={styles.payoutRowValue}>
                                        KSh {selectedStint.offeredRate?.toLocaleString()}
                                    </Text>
                                </View>
                                <View style={styles.payoutRow}>
                                    <Text style={styles.payoutRowLabel}>Platform Fee (5%)</Text>
                                    <Text style={[styles.payoutRowValue, { color: Colors.error }]}>
                                        -KSh {((selectedStint.offeredRate || 0) * Fees.professionalService).toLocaleString()}
                                    </Text>
                                </View>
                                <View style={styles.payoutRow}>
                                    <Text style={styles.payoutRowLabel}>M-Pesa Cost</Text>
                                    <Text style={[styles.payoutRowValue, { color: Colors.error }]}>~-KSh 50</Text>
                                </View>
                                <View style={styles.payoutDivider} />
                                <View style={styles.payoutRow}>
                                    <Text style={styles.payoutTotalLabel}>You Receive</Text>
                                    <Text style={styles.payoutTotalValue}>
                                        ~KSh {calculatePayout(selectedStint.offeredRate || 0).toLocaleString()}
                                    </Text>
                                </View>
                            </Card>

                            {/* Bid Option */}
                            {selectedStint.allowBids && (
                                <View style={styles.bidSection}>
                                    <Text style={styles.bidTitle}>Or Submit a Bid</Text>
                                    <Input
                                        label="Your Bid Amount (KSh)"
                                        placeholder="e.g., 9000"
                                        value={bidAmount}
                                        onChangeText={setBidAmount}
                                        keyboardType="number-pad"
                                        leftIcon="cash-outline"
                                    />
                                </View>
                            )}

                            {/* Actions */}
                            <View style={styles.actions}>
                                <Button
                                    title="Apply at Posted Rate"
                                    onPress={() => handleApply(selectedStint, false)}
                                    loading={loading && !bidAmount}
                                    fullWidth
                                />
                                {selectedStint.allowBids && bidAmount && (
                                    <Button
                                        title={`Submit Bid (KSh ${bidAmount})`}
                                        onPress={() => handleApply(selectedStint, true)}
                                        variant="outline"
                                        loading={loading && !!bidAmount}
                                        fullWidth
                                        style={{ marginTop: Spacing.sm }}
                                    />
                                )}
                            </View>
                        </View>
                    </SafeAreaView>
                )}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: Colors.primary + '20',
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    activeFiltersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.sm,
        flexWrap: 'wrap',
        gap: Spacing.xs,
    },
    activeFiltersLabel: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
        marginRight: Spacing.xs,
    },
    filterChip: {
        backgroundColor: Colors.primary + '20',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    filterChipText: {
        fontSize: Typography.xs,
        color: Colors.primary,
    },
    clearFilters: {
        fontSize: Typography.sm,
        color: Colors.error,
        marginLeft: Spacing.sm,
    },
    listContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing['2xl'],
    },
    stintCard: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        marginBottom: Spacing.md,
    },
    stintCardApplied: {
        opacity: 0.7,
        borderWidth: 1,
        borderColor: Colors.success + '50',
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
        marginTop: Spacing.xs,
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
    stintDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
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
    urgentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: Colors.warning + '20',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    urgentText: {
        fontSize: Typography.xs,
        color: Colors.warning,
        fontWeight: '500',
    },
    bidBadge: {
        backgroundColor: Colors.primary + '20',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    bidText: {
        fontSize: Typography.xs,
        color: Colors.primary,
    },
    appliedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: Colors.success + '20',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    appliedText: {
        fontSize: Typography.xs,
        color: Colors.success,
        fontWeight: '500',
    },
    payoutPreview: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing.sm,
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    payoutLabel: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    payoutValue: {
        fontSize: Typography.sm,
        fontWeight: '600',
        color: Colors.success,
    },
    emptyContainer: {
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
    modalContent: {
        padding: Spacing.xl,
    },
    modalRole: {
        fontSize: Typography.xl,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    modalClinic: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
        marginBottom: Spacing.lg,
    },
    detailCard: {
        marginBottom: Spacing.base,
        padding: Spacing.base,
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    detailLabel: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    detailValue: {
        fontSize: Typography.sm,
        fontWeight: '500',
        color: Colors.textPrimary,
    },
    payoutCard: {
        marginBottom: Spacing.lg,
        padding: Spacing.base,
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
    },
    payoutCardTitle: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    payoutRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
    },
    payoutRowLabel: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    payoutRowValue: {
        fontSize: Typography.sm,
        fontWeight: '500',
        color: Colors.textPrimary,
    },
    payoutDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.sm,
    },
    payoutTotalLabel: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    payoutTotalValue: {
        fontSize: Typography.lg,
        fontWeight: '700',
        color: Colors.success,
    },
    bidSection: {
        marginBottom: Spacing.lg,
    },
    bidTitle: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    actions: {},
    filterLabel: {
        fontSize: Typography.sm,
        fontWeight: '500',
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        marginTop: Spacing.lg,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    filterOption: {
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterOptionActive: {
        backgroundColor: Colors.primary + '20',
        borderColor: Colors.primary,
    },
    filterOptionText: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    filterOptionTextActive: {
        color: Colors.primary,
        fontWeight: '600',
    },
    filterInput: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.base,
        fontSize: Typography.base,
        color: Colors.textPrimary,
    },
    filterActions: {
        flexDirection: 'row',
        marginTop: Spacing['2xl'],
    },
});
