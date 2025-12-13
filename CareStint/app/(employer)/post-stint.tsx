import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { addStint } from '../../services/firestore';
import { Button, Input, Card } from '../../components';
import { Colors, Typography, Spacing, BorderRadius, Fees, ProfessionalRoles, Regions } from '../../constants/theme';
import { StintPostingData } from '../../types';

const SHIFT_TYPES = [
    { value: 'half_day', label: 'Half-day', icon: 'sunny-outline' },
    { value: 'full_day', label: 'Full-day', icon: 'time-outline' },
];

export default function PostStintScreen() {
    const router = useRouter();
    const { user, employerData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showRoles, setShowRoles] = useState(false);
    const [showCities, setShowCities] = useState(false);

    const [formData, setFormData] = useState<StintPostingData>({
        profession: '',
        shiftType: 'full_day',
        shiftDate: new Date(),
        offeredRate: 0,
        allowBids: true,
        isUrgent: false,
        description: '',
    });

    const [city, setCity] = useState(employerData?.city || '');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('17:00');

    const updateField = (field: keyof StintPostingData, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const bookingFeeRate = formData.isUrgent ? Fees.urgentBooking : Fees.normalBooking;
    const bookingFee = formData.offeredRate * bookingFeeRate;
    const totalCost = formData.offeredRate + bookingFee;

    // Get all cities from regions
    const allCities = Regions.flatMap(region => region.cities);

    const handleSubmit = async () => {
        if (!formData.profession) {
            Alert.alert('Error', 'Please select a profession');
            return;
        }
        if (formData.offeredRate <= 0) {
            Alert.alert('Error', 'Please enter a valid offered rate');
            return;
        }
        if (!city) {
            Alert.alert('Error', 'Please select a city');
            return;
        }

        const employerId = user?.uid || employerData?.id;
        if (!employerId) {
            Alert.alert('Error', 'You must be logged in to post a stint');
            return;
        }

        setLoading(true);
        try {
            // Save to Firestore with real data
            await addStint({
                employerId: employerId,
                employerName: employerData?.facilityName || 'Employer',
                profession: formData.profession,
                shiftType: formData.shiftType as 'half_day' | 'full_day',
                shiftDate: formData.shiftDate,
                startTime: startTime,
                endTime: endTime,
                offeredRate: formData.offeredRate,
                currency: 'KSh',
                city: city,
                country: employerData?.country || 'Kenya',
                allowBids: formData.allowBids,
                isUrgent: formData.isUrgent,
                description: formData.description,
            });

            Alert.alert('Success', 'Stint posted successfully!', [
                {
                    text: 'View Posted Jobs',
                    onPress: () => router.push('/(employer)/posted-jobs' as any)
                },
                {
                    text: 'Post Another',
                    onPress: () => {
                        setFormData({
                            profession: '',
                            shiftType: 'full_day',
                            shiftDate: new Date(),
                            offeredRate: 0,
                            allowBids: true,
                            isUrgent: false,
                            description: '',
                        });
                        setCity(employerData?.city || '');
                    }
                },
            ]);
        } catch (error) {
            console.error('Error posting stint:', error);
            Alert.alert('Error', 'Failed to post stint. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Post a Stint</Text>
                    <Text style={styles.subtitle}>Find verified healthcare professionals</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Profession Select */}
                    <Text style={styles.label}>Profession Needed</Text>
                    <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => setShowRoles(!showRoles)}
                    >
                        <Ionicons name="medical-outline" size={20} color={Colors.textMuted} />
                        <Text style={[styles.selectText, formData.profession && styles.selectTextActive]}>
                            {formData.profession || 'Select a profession'}
                        </Text>
                        <Ionicons
                            name={showRoles ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={Colors.textMuted}
                        />
                    </TouchableOpacity>

                    {showRoles && (
                        <ScrollView style={styles.dropdown} nestedScrollEnabled>
                            {ProfessionalRoles.map((role) => (
                                <TouchableOpacity
                                    key={role}
                                    style={[
                                        styles.dropdownOption,
                                        formData.profession === role && styles.dropdownOptionActive,
                                    ]}
                                    onPress={() => {
                                        updateField('profession', role);
                                        setShowRoles(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.dropdownOptionText,
                                            formData.profession === role && styles.dropdownOptionTextActive,
                                        ]}
                                    >
                                        {role}
                                    </Text>
                                    {formData.profession === role && (
                                        <Ionicons name="checkmark" size={20} color={Colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {/* City Select */}
                    <Text style={styles.label}>Location</Text>
                    <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => setShowCities(!showCities)}
                    >
                        <Ionicons name="location-outline" size={20} color={Colors.textMuted} />
                        <Text style={[styles.selectText, city && styles.selectTextActive]}>
                            {city || 'Select a city'}
                        </Text>
                        <Ionicons
                            name={showCities ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={Colors.textMuted}
                        />
                    </TouchableOpacity>

                    {showCities && (
                        <ScrollView style={styles.dropdown} nestedScrollEnabled>
                            {allCities.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        styles.dropdownOption,
                                        city === c && styles.dropdownOptionActive,
                                    ]}
                                    onPress={() => {
                                        setCity(c);
                                        setShowCities(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.dropdownOptionText,
                                            city === c && styles.dropdownOptionTextActive,
                                        ]}
                                    >
                                        {c}
                                    </Text>
                                    {city === c && (
                                        <Ionicons name="checkmark" size={20} color={Colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {/* Shift Type */}
                    <Text style={styles.label}>Shift Type</Text>
                    <View style={styles.shiftTypeRow}>
                        {SHIFT_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.value}
                                style={[
                                    styles.shiftTypeButton,
                                    formData.shiftType === type.value && styles.shiftTypeButtonActive,
                                ]}
                                onPress={() => updateField('shiftType', type.value)}
                            >
                                <Ionicons
                                    name={type.icon as any}
                                    size={24}
                                    color={formData.shiftType === type.value ? Colors.primary : Colors.textMuted}
                                />
                                <Text
                                    style={[
                                        styles.shiftTypeText,
                                        formData.shiftType === type.value && styles.shiftTypeTextActive,
                                    ]}
                                >
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Time Inputs */}
                    <View style={styles.timeRow}>
                        <View style={styles.timeInput}>
                            <Text style={styles.label}>Start Time</Text>
                            <Input
                                placeholder="08:00"
                                value={startTime}
                                onChangeText={setStartTime}
                                leftIcon="time-outline"
                            />
                        </View>
                        <View style={styles.timeInput}>
                            <Text style={styles.label}>End Time</Text>
                            <Input
                                placeholder="17:00"
                                value={endTime}
                                onChangeText={setEndTime}
                                leftIcon="time-outline"
                            />
                        </View>
                    </View>

                    {/* Offered Rate */}
                    <Input
                        label="Offered Rate (KSh)"
                        placeholder="e.g., 8000"
                        value={formData.offeredRate > 0 ? String(formData.offeredRate) : ''}
                        onChangeText={(v) => updateField('offeredRate', parseInt(v) || 0)}
                        keyboardType="number-pad"
                        leftIcon="cash-outline"
                    />

                    {/* Urgency Toggle */}
                    <Card style={styles.toggleCard}>
                        <View style={styles.toggleRow}>
                            <View style={styles.toggleInfo}>
                                <Text style={styles.toggleLabel}>Urgent Shift</Text>
                                <Text style={styles.toggleHint}>Less than 24h notice • 20% fee</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.toggle, formData.isUrgent && styles.toggleActive]}
                                onPress={() => updateField('isUrgent', !formData.isUrgent)}
                            >
                                <View style={[styles.toggleDot, formData.isUrgent && styles.toggleDotActive]} />
                            </TouchableOpacity>
                        </View>
                    </Card>

                    {/* Allow Bids Toggle */}
                    <Card style={styles.toggleCard}>
                        <View style={styles.toggleRow}>
                            <View style={styles.toggleInfo}>
                                <Text style={styles.toggleLabel}>Allow Bids</Text>
                                <Text style={styles.toggleHint}>Professionals can counter-offer</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.toggle, formData.allowBids && styles.toggleActive]}
                                onPress={() => updateField('allowBids', !formData.allowBids)}
                            >
                                <View style={[styles.toggleDot, formData.allowBids && styles.toggleDotActive]} />
                            </TouchableOpacity>
                        </View>
                    </Card>

                    {/* Description */}
                    <Input
                        label="Additional Details (Optional)"
                        placeholder="Any specific requirements..."
                        value={formData.description}
                        onChangeText={(v) => updateField('description', v)}
                        multiline
                        numberOfLines={3}
                    />

                    {/* Fee Calculator */}
                    {formData.offeredRate > 0 && (
                        <Card style={styles.feeCard}>
                            <Text style={styles.feeCardTitle}>Cost Breakdown</Text>
                            <View style={styles.feeRow}>
                                <Text style={styles.feeLabel}>Offered Rate</Text>
                                <Text style={styles.feeValue}>
                                    KSh {formData.offeredRate.toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.feeRow}>
                                <Text style={styles.feeLabel}>
                                    Booking Fee ({(bookingFeeRate * 100).toFixed(0)}%)
                                </Text>
                                <Text style={[styles.feeValue, { color: Colors.warning }]}>
                                    KSh {bookingFee.toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.feeDivider} />
                            <View style={styles.feeRow}>
                                <Text style={styles.feeTotalLabel}>Total Cost</Text>
                                <Text style={styles.feeTotalValue}>
                                    KSh {totalCost.toLocaleString()}
                                </Text>
                            </View>
                        </Card>
                    )}
                </View>
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.footer}>
                <Button
                    title="Post Stint"
                    onPress={handleSubmit}
                    loading={loading}
                    fullWidth
                    disabled={!formData.profession || formData.offeredRate <= 0 || !city}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingBottom: Spacing.xl,
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
    subtitle: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    form: {
        paddingHorizontal: Spacing.xl,
    },
    label: {
        fontSize: Typography.sm,
        fontWeight: '500',
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        marginTop: Spacing.lg,
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.base,
        gap: Spacing.sm,
    },
    selectText: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.textMuted,
    },
    selectTextActive: {
        color: Colors.textPrimary,
    },
    dropdown: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        marginTop: Spacing.sm,
        maxHeight: 200,
    },
    dropdownOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    dropdownOptionActive: {
        backgroundColor: Colors.primary + '10',
    },
    dropdownOptionText: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
    },
    dropdownOptionTextActive: {
        color: Colors.primary,
        fontWeight: '600',
    },
    shiftTypeRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    shiftTypeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.base,
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    shiftTypeButtonActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '10',
    },
    shiftTypeText: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
    },
    shiftTypeTextActive: {
        color: Colors.primary,
        fontWeight: '600',
    },
    timeRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    timeInput: {
        flex: 1,
    },
    toggleCard: {
        marginTop: Spacing.md,
        padding: 0,
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.base,
    },
    toggleInfo: {
        flex: 1,
        marginRight: Spacing.md,
    },
    toggleLabel: {
        fontSize: Typography.base,
        fontWeight: '500',
        color: Colors.textPrimary,
    },
    toggleHint: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
        marginTop: 2,
    },
    toggle: {
        width: 52,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.border,
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    toggleActive: {
        backgroundColor: Colors.primary,
    },
    toggleDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.textPrimary,
    },
    toggleDotActive: {
        alignSelf: 'flex-end',
    },
    feeCard: {
        marginTop: Spacing.lg,
        padding: Spacing.base,
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
    },
    feeCardTitle: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
    },
    feeLabel: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    feeValue: {
        fontSize: Typography.sm,
        fontWeight: '500',
        color: Colors.textPrimary,
    },
    feeDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.sm,
    },
    feeTotalLabel: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    feeTotalValue: {
        fontSize: Typography.lg,
        fontWeight: '700',
        color: Colors.success,
    },
    footer: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.base,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.background,
    },
});
