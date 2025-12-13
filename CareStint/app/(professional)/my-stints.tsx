import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
    subscribeToProfessionalStints,
    clockInStint,
    clockOutStint,
    submitStintRating,
} from '../../services/firestore';
import { Button, Card } from '../../components';
import { Colors, Typography, Spacing, BorderRadius, Fees } from '../../constants/theme';
import { Stint } from '../../types';

// Status badge component with pulsing animation for active states
const StatusBadge = ({ status }: { status: string }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (status === 'in_progress') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                ])
            ).start();
        }
    }, [status]);

    const getStatusColor = () => {
        switch (status) {
            case 'accepted': return Colors.warning;
            case 'in_progress': return Colors.success;
            case 'completed': return Colors.info;
            case 'cancelled': return Colors.error;
            default: return Colors.textMuted;
        }
    };

    const getStatusLabel = () => {
        switch (status) {
            case 'accepted': return 'Upcoming';
            case 'in_progress': return 'In Progress';
            case 'completed': return 'Completed';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    return (
        <Animated.View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor() + '20' },
            status === 'in_progress' && { transform: [{ scale: pulseAnim }] }
        ]}>
            {status === 'in_progress' && (
                <View style={[styles.pulseDot, { backgroundColor: getStatusColor() }]} />
            )}
            <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusLabel()}</Text>
        </Animated.View>
    );
};

// Late badge component
const LateBadge = () => (
    <View style={styles.lateBadge}>
        <Ionicons name="alert-circle" size={12} color={Colors.error} />
        <Text style={styles.lateText}>Late</Text>
    </View>
);

// Progress bar component
const ProgressBar = ({ progress }: { progress: number }) => (
    <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${Math.min(100, progress)}%` }]} />
    </View>
);

// Rating Dialog component
const RatingDialog = ({
    visible,
    onClose,
    onSubmit,
    employerName
}: {
    visible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, review: string) => void;
    employerName: string;
}) => {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');

    const handleSubmit = () => {
        onSubmit(rating, review);
        setRating(0);
        setReview('');
    };

    const handleSkip = () => {
        onClose();
        setRating(0);
        setReview('');
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Rate Your Experience</Text>
                    <Text style={styles.modalSubtitle}>
                        How was your experience working with {employerName}?
                    </Text>

                    {/* Star Rating */}
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => setRating(star)}
                                style={styles.starButton}
                            >
                                <Ionicons
                                    name={star <= rating ? 'star' : 'star-outline'}
                                    size={36}
                                    color={star <= rating ? Colors.warning : Colors.textMuted}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Review Text */}
                    <View style={styles.reviewContainer}>
                        <Text style={styles.reviewLabel}>Review (Optional)</Text>
                        <TextInput
                            style={styles.reviewInput}
                            placeholder="Share your experience..."
                            placeholderTextColor={Colors.textMuted}
                            multiline
                            numberOfLines={3}
                            value={review}
                            onChangeText={setReview}
                        />
                    </View>

                    {/* Buttons */}
                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                            <Text style={styles.skipButtonText}>Skip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitButton, !rating && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={!rating}
                        >
                            <Text style={styles.submitButtonText}>Submit Rating</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default function MyStintsScreen() {
    const router = useRouter();
    const { user, professionalData } = useAuth();

    const [stints, setStints] = useState<Stint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('active');

    // Timer state for elapsed time
    const [elapsedTimes, setElapsedTimes] = useState<Record<string, number>>({});

    // Rating dialog state
    const [showRatingDialog, setShowRatingDialog] = useState(false);
    const [completedStint, setCompletedStint] = useState<Stint | null>(null);

    const professionalId = user?.uid || professionalData?.id || '';

    // Subscribe to professional's stints
    useEffect(() => {
        if (!professionalId) {
            setIsLoading(false);
            return;
        }

        const unsubscribe = subscribeToProfessionalStints(professionalId, (stintsData) => {
            setStints(stintsData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [professionalId]);

    // Timer effect for in-progress stints
    useEffect(() => {
        const inProgressStints = stints.filter(s => s.status === 'in_progress' && s.clockInTime);

        if (inProgressStints.length === 0) return;

        const interval = setInterval(() => {
            const newTimes: Record<string, number> = {};
            inProgressStints.forEach(stint => {
                if (stint.clockInTime) {
                    const clockIn = stint.clockInTime instanceof Date
                        ? stint.clockInTime
                        : new Date(stint.clockInTime);
                    const elapsed = Math.floor((Date.now() - clockIn.getTime()) / 1000);
                    newTimes[stint.id] = elapsed;
                }
            });
            setElapsedTimes(newTimes);
        }, 1000);

        return () => clearInterval(interval);
    }, [stints]);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Format elapsed time as HH:MM:SS
    const formatElapsedTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Check if late for clock-in
    const isLateForShift = (stint: Stint) => {
        if (stint.status !== 'accepted' || !stint.startTime) return false;
        const now = new Date();
        const [hours, minutes] = stint.startTime.split(':').map(Number);
        const shiftStart = new Date();
        shiftStart.setHours(hours, minutes, 0, 0);
        return now > shiftStart;
    };

    // Calculate shift progress
    const getShiftProgress = (stint: Stint) => {
        if (stint.status !== 'in_progress' || !stint.startTime || !stint.endTime) return 0;
        const [startH, startM] = stint.startTime.split(':').map(Number);
        const [endH, endM] = stint.endTime.split(':').map(Number);
        const shiftDurationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        const elapsedMinutes = (elapsedTimes[stint.id] || 0) / 60;
        return Math.min(100, (elapsedMinutes / shiftDurationMinutes) * 100);
    };

    const handleClockIn = async (stint: Stint) => {
        const isLate = isLateForShift(stint);
        Alert.alert(
            'Confirm Clock In',
            `Are you at ${stint.employerName} and ready to start your shift?${isLate ? '\n\n⚠️ Note: You are clocking in late.' : ''}\n\nYour location will be recorded for verification.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clock In',
                    onPress: async () => {
                        setActionLoading(stint.id);
                        try {
                            await clockInStint(stint.id);
                            Alert.alert('Clocked In Successfully', `You are now working at ${stint.employerName}.`);
                        } catch (error) {
                            console.error('Clock in error:', error);
                            Alert.alert('Error', 'Failed to clock in. Please try again.');
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        );
    };

    const handleClockOut = async (stint: Stint) => {
        Alert.alert(
            'Confirm Clock Out',
            `Are you sure you want to end your shift?\n\nMake sure all your duties are completed. Payment processes after 24h dispute window.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clock Out',
                    style: 'destructive',
                    onPress: async () => {
                        setActionLoading(stint.id);
                        try {
                            await clockOutStint(stint.id);
                            setCompletedStint(stint);
                            setShowRatingDialog(true);
                        } catch (error) {
                            console.error('Clock out error:', error);
                            Alert.alert('Error', 'Failed to clock out. Please try again.');
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        );
    };

    const handleRatingSubmit = async (rating: number, review: string) => {
        if (completedStint) {
            try {
                await submitStintRating(completedStint.id, rating, review);
                Alert.alert('Thank You!', 'Your feedback has been submitted.');
            } catch (error) {
                console.error('Rating submit error:', error);
            }
        }
        setShowRatingDialog(false);
        setCompletedStint(null);
    };

    const calculatePayout = (rate: number) => {
        const platformFee = rate * Fees.professionalService;
        const mpesaCost = 50;
        return rate - platformFee - mpesaCost;
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

    const formatTime = (date: Date | undefined) => {
        if (!date) return '';
        try {
            return new Date(date).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return '';
        }
    };

    const filteredStints = stints.filter(stint => {
        if (filter === 'active') return ['accepted', 'in_progress'].includes(stint.status);
        if (filter === 'completed') return ['completed', 'settled'].includes(stint.status);
        return true;
    });

    const renderStintCard = ({ item }: { item: Stint }) => {
        const isInProgress = item.status === 'in_progress';
        const isLate = isLateForShift(item);
        const progress = getShiftProgress(item);
        const elapsed = elapsedTimes[item.id] || 0;

        return (
            <Card style={{
                ...styles.stintCard,
                ...(isInProgress ? styles.stintCardActive : {})
            }}>
                <View style={styles.stintHeader}>
                    <View style={styles.stintInfo}>
                        <View style={styles.stintTitleRow}>
                            <Text style={styles.stintRole}>{item.profession}</Text>
                            {isLate && item.status === 'accepted' && <LateBadge />}
                        </View>
                        <Text style={styles.stintClinic}>{item.employerName}</Text>
                    </View>
                    <StatusBadge status={item.status} />
                </View>

                <View style={styles.stintDetails}>
                    <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                            <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
                            <Text style={styles.detailText}>{formatDate(item.shiftDate)}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                            <Text style={styles.detailText}>
                                {item.shiftType === 'full_day' ? 'Full Day' : 'Half Day'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                            <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
                            <Text style={styles.detailText}>{item.city}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Ionicons name="cash-outline" size={16} color={Colors.textMuted} />
                            <Text style={styles.detailText}>
                                KSh {item.offeredRate?.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Live Timer Display for In-Progress Stints */}
                {isInProgress && (
                    <View style={styles.timerSection}>
                        <View style={styles.timerDisplay}>
                            <Text style={styles.timerLabel}>Time Elapsed</Text>
                            <Text style={styles.timerValue}>{formatElapsedTime(elapsed)}</Text>
                        </View>
                        <ProgressBar progress={progress} />
                    </View>
                )}

                {/* Clock Times */}
                {item.clockInTime && (
                    <View style={styles.clockInfo}>
                        <View style={styles.clockRow}>
                            <Ionicons name="enter-outline" size={16} color={Colors.success} />
                            <Text style={styles.clockText}>
                                Clocked in: {formatTime(item.clockInTime)}
                            </Text>
                        </View>
                        {item.clockOutTime && (
                            <View style={styles.clockRow}>
                                <Ionicons name="exit-outline" size={16} color={Colors.info} />
                                <Text style={styles.clockText}>
                                    Clocked out: {formatTime(item.clockOutTime)}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Payout Info */}
                <View style={styles.payoutInfo}>
                    <Text style={styles.payoutLabel}>Your Payout:</Text>
                    <Text style={styles.payoutValue}>
                        KSh {calculatePayout(item.offeredRate || 0).toLocaleString()}
                    </Text>
                </View>

                {/* Instructions */}
                {item.status === 'accepted' && (
                    <Text style={styles.instructions}>
                        Clock in when you arrive at the facility. Location will be recorded.
                    </Text>
                )}
                {isInProgress && (
                    <Text style={styles.instructions}>
                        Clock out when your shift is complete. Payment processes after 24h dispute window.
                    </Text>
                )}

                {/* Actions */}
                {item.status === 'accepted' && (
                    <Button
                        title="Clock In"
                        onPress={() => handleClockIn(item)}
                        loading={actionLoading === item.id}
                        fullWidth
                        style={{ ...styles.actionButton, ...styles.clockInButton }}
                        icon={<Ionicons name="play" size={20} color="#fff" />}
                    />
                )}

                {isInProgress && (
                    <Button
                        title="Clock Out"
                        variant="danger"
                        onPress={() => handleClockOut(item)}
                        loading={actionLoading === item.id}
                        fullWidth
                        style={styles.actionButton}
                        icon={<Ionicons name="stop" size={20} color="#fff" />}
                    />
                )}
            </Card>
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
                <Text style={styles.title}>My Stints</Text>
                <Text style={styles.subtitle}>
                    {stints.filter(s => s.status === 'in_progress').length > 0
                        ? 'You have an active stint'
                        : `${stints.filter(s => s.status === 'accepted').length} upcoming stints`}
                </Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterRow}>
                {['active', 'completed', 'all'].map((f) => (
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
            </View>

            {/* Stints List */}
            <FlatList
                data={filteredStints}
                keyExtractor={(item) => item.id}
                renderItem={renderStintCard}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={64} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>No stints found</Text>
                        <Text style={styles.emptySubtext}>
                            {filter === 'active'
                                ? 'Apply to stints to get started'
                                : 'No stints in this category'}
                        </Text>
                        {filter === 'active' && (
                            <Button
                                title="Find Stints"
                                onPress={() => router.push('/(professional)/find-stints' as any)}
                                style={{ marginTop: Spacing.lg }}
                            />
                        )}
                    </View>
                }
            />

            {/* Rating Dialog */}
            <RatingDialog
                visible={showRatingDialog}
                onClose={() => {
                    setShowRatingDialog(false);
                    setCompletedStint(null);
                }}
                onSubmit={handleRatingSubmit}
                employerName={completedStint?.employerName || ''}
            />
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
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.base,
        gap: Spacing.sm,
    },
    filterTab: {
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.full,
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
        paddingBottom: Spacing['2xl'],
    },
    stintCard: {
        marginBottom: Spacing.md,
        padding: Spacing.base,
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
    },
    stintCardActive: {
        borderWidth: 1,
        borderColor: Colors.success + '50',
        backgroundColor: Colors.success + '08',
    },
    stintHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    stintInfo: {
        flex: 1,
    },
    stintTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    stintRole: {
        fontSize: Typography.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    stintClinic: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    stintDetails: {
        marginTop: Spacing.md,
        gap: Spacing.sm,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    timerSection: {
        marginTop: Spacing.md,
        padding: Spacing.base,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
    },
    timerDisplay: {
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    timerLabel: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        marginBottom: Spacing.xs,
    },
    timerValue: {
        fontSize: Typography['3xl'],
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        color: Colors.textPrimary,
        letterSpacing: 2,
    },
    progressContainer: {
        height: 6,
        backgroundColor: Colors.backgroundCard,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.success,
        borderRadius: 3,
    },
    clockInfo: {
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        gap: Spacing.sm,
    },
    clockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    clockText: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    payoutInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
        fontSize: Typography.lg,
        fontWeight: '700',
        color: Colors.success,
    },
    instructions: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        textAlign: 'center',
        marginTop: Spacing.md,
        fontStyle: 'italic',
    },
    actionButton: {
        marginTop: Spacing.md,
    },
    clockInButton: {
        backgroundColor: Colors.success,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: Typography.xs,
        fontWeight: '500',
    },
    lateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.error + '20',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    lateText: {
        fontSize: Typography.xs,
        color: Colors.error,
        fontWeight: '500',
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
        textAlign: 'center',
        marginTop: Spacing.xs,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    modalContent: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: Typography.xl,
        fontWeight: '700',
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.xl,
    },
    starButton: {
        padding: Spacing.xs,
    },
    reviewContainer: {
        marginTop: Spacing.xl,
    },
    reviewLabel: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    reviewInput: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        fontSize: Typography.base,
        color: Colors.textPrimary,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.xl,
    },
    skipButton: {
        flex: 1,
        paddingVertical: Spacing.base,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    skipButtonText: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
    },
    submitButton: {
        flex: 1,
        paddingVertical: Spacing.base,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.primary,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: Typography.base,
        color: '#fff',
        fontWeight: '600',
    },
});
