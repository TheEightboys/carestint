import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Input, Card } from '../../../components';
import { Colors, Typography, Spacing, BorderRadius, ProfessionalRoles, Regions } from '../../../constants/theme';
import { ProfessionalOnboardingData } from '../../../types';

const STEPS = ['Profile', 'Credentials', 'Role & Experience', 'Payout'];
const SHIFT_TYPES = [
    { value: 'half_day', label: 'Half-day' },
    { value: 'full_day', label: 'Full-day' },
];

export default function ProfessionalOnboardingScreen() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<ProfessionalOnboardingData>({
        fullName: '',
        email: '',
        phone: '',
        preferredLocations: [],
        licenseNumber: '',
        licenseIssuingBody: '',
        licenseCountry: 'Kenya',
        primaryRole: '',
        yearsOfExperience: 0,
        typicalDailyRate: 0,
        availableShiftTypes: [],
        mpesaPhone: '',
        bankAccount: '',
    });

    const updateField = (field: keyof ProfessionalOnboardingData, value: any) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    const toggleLocation = (city: string) => {
        const locations = formData.preferredLocations.includes(city)
            ? formData.preferredLocations.filter((l) => l !== city)
            : [...formData.preferredLocations, city];
        updateField('preferredLocations', locations);
    };

    const toggleShiftType = (type: 'half_day' | 'full_day') => {
        const types = formData.availableShiftTypes.includes(type)
            ? formData.availableShiftTypes.filter((t) => t !== type)
            : [...formData.availableShiftTypes, type];
        updateField('availableShiftTypes', types);
    };

    const validateStep = () => {
        const newErrors: Record<string, string> = {};

        if (currentStep === 0) {
            if (!formData.fullName) newErrors.fullName = 'Full name is required';
            if (!formData.email) newErrors.email = 'Email is required';
            if (!formData.phone) newErrors.phone = 'Phone is required';
            if (formData.preferredLocations.length === 0) newErrors.preferredLocations = 'Select at least one location';
        } else if (currentStep === 1) {
            if (!formData.licenseNumber) newErrors.licenseNumber = 'License number is required';
            if (!formData.licenseIssuingBody) newErrors.licenseIssuingBody = 'Issuing body is required';
        } else if (currentStep === 2) {
            if (!formData.primaryRole) newErrors.primaryRole = 'Select your primary role';
            if (formData.typicalDailyRate <= 0) newErrors.typicalDailyRate = 'Enter your daily rate';
            if (formData.availableShiftTypes.length === 0) newErrors.availableShiftTypes = 'Select at least one shift type';
        } else if (currentStep === 3) {
            if (!formData.mpesaPhone) newErrors.mpesaPhone = 'M-Pesa phone is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) {
            if (currentStep < STEPS.length - 1) {
                setCurrentStep(currentStep + 1);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        } else {
            // At step 0, go back to login
            router.back();
        }
    };

    const goToStep = (step: number) => {
        // Only allow navigating to completed or current step
        if (step <= currentStep) {
            setCurrentStep(step);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setLoading(true);
        try {
            // DEMO MODE: Store data locally using AsyncStorage
            const proId = `professional_${formData.phone?.replace(/\D/g, '') || 'demo'}`;

            const professionalData = {
                id: proId,
                userId: proId,
                ...formData,
                status: 'pending_validation',
                riskScore: 0,
                riskLabel: 'Low',
                averageRating: 0,
                totalStints: 0,
                noShowCount: 0,
                isTopProfessional: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Store in AsyncStorage for demo
            await AsyncStorage.setItem('professionalData', JSON.stringify(professionalData));
            await AsyncStorage.setItem(`onboarded_${proId}`, 'true');
            await AsyncStorage.setItem('userRole', 'professional');

            router.replace('/(professional)');
        } catch (error) {
            console.error('Onboarding error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <View style={styles.stepContent}>
                        <Input
                            label="Full Name"
                            placeholder="e.g., John Kamau"
                            value={formData.fullName}
                            onChangeText={(v) => updateField('fullName', v)}
                            error={errors.fullName}
                            leftIcon="person-outline"
                        />
                        <Input
                            label="Email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChangeText={(v) => updateField('email', v)}
                            keyboardType="email-address"
                            error={errors.email}
                            leftIcon="mail-outline"
                        />
                        <Input
                            label="Phone"
                            placeholder="254712345678"
                            value={formData.phone}
                            onChangeText={(v) => updateField('phone', v)}
                            keyboardType="phone-pad"
                            error={errors.phone}
                            leftIcon="call-outline"
                        />

                        <Text style={styles.fieldLabel}>Preferred Locations</Text>
                        {errors.preferredLocations && (
                            <Text style={styles.fieldError}>{errors.preferredLocations}</Text>
                        )}
                        {Regions.map((region) => (
                            <View key={region.country} style={styles.regionGroup}>
                                <Text style={styles.regionLabel}>{region.country}</Text>
                                <View style={styles.chipRow}>
                                    {region.cities.map((city) => (
                                        <TouchableOpacity
                                            key={city}
                                            style={[
                                                styles.chip,
                                                formData.preferredLocations.includes(city) && styles.chipActive,
                                            ]}
                                            onPress={() => toggleLocation(city)}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    formData.preferredLocations.includes(city) && styles.chipTextActive,
                                                ]}
                                            >
                                                {city}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                );

            case 1:
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.fieldLabel}>Country of License</Text>
                        <View style={styles.chipRow}>
                            {Regions.map((r) => (
                                <TouchableOpacity
                                    key={r.country}
                                    style={[
                                        styles.chip,
                                        formData.licenseCountry === r.country && styles.chipActive,
                                    ]}
                                    onPress={() => updateField('licenseCountry', r.country)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            formData.licenseCountry === r.country && styles.chipTextActive,
                                        ]}
                                    >
                                        {r.country}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Input
                            label="License Number"
                            placeholder="e.g., RN/KEN/12345"
                            value={formData.licenseNumber}
                            onChangeText={(v) => updateField('licenseNumber', v)}
                            error={errors.licenseNumber}
                            leftIcon="document-outline"
                        />
                        <Input
                            label="Issuing Body"
                            placeholder="e.g., Nursing Council of Kenya"
                            value={formData.licenseIssuingBody}
                            onChangeText={(v) => updateField('licenseIssuingBody', v)}
                            error={errors.licenseIssuingBody}
                            leftIcon="shield-checkmark-outline"
                        />

                        <View style={styles.uploadSection}>
                            <TouchableOpacity style={styles.uploadButton}>
                                <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
                                <Text style={styles.uploadText}>Upload License & ID</Text>
                                <Text style={styles.uploadHint}>We'll verify your credentials</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 2:
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.fieldLabel}>Primary Role</Text>
                        {errors.primaryRole && <Text style={styles.fieldError}>{errors.primaryRole}</Text>}
                        <View style={styles.roleGrid}>
                            {ProfessionalRoles.map((role) => (
                                <TouchableOpacity
                                    key={role}
                                    style={[
                                        styles.roleChip,
                                        formData.primaryRole === role && styles.chipActive,
                                    ]}
                                    onPress={() => updateField('primaryRole', role)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            formData.primaryRole === role && styles.chipTextActive,
                                        ]}
                                    >
                                        {role}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Input
                            label="Years of Experience"
                            placeholder="e.g., 5"
                            value={formData.yearsOfExperience > 0 ? String(formData.yearsOfExperience) : ''}
                            onChangeText={(v) => updateField('yearsOfExperience', parseInt(v) || 0)}
                            keyboardType="number-pad"
                            leftIcon="time-outline"
                        />

                        <Input
                            label="Typical Daily Rate (KSh)"
                            placeholder="e.g., 8000"
                            value={formData.typicalDailyRate > 0 ? String(formData.typicalDailyRate) : ''}
                            onChangeText={(v) => updateField('typicalDailyRate', parseInt(v) || 0)}
                            keyboardType="number-pad"
                            error={errors.typicalDailyRate}
                            leftIcon="cash-outline"
                        />

                        <Text style={styles.fieldLabel}>Available Shift Types</Text>
                        {errors.availableShiftTypes && (
                            <Text style={styles.fieldError}>{errors.availableShiftTypes}</Text>
                        )}
                        <View style={styles.chipRow}>
                            {SHIFT_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.chip,
                                        formData.availableShiftTypes.includes(type.value as any) && styles.chipActive,
                                    ]}
                                    onPress={() => toggleShiftType(type.value as any)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            formData.availableShiftTypes.includes(type.value as any) &&
                                            styles.chipTextActive,
                                        ]}
                                    >
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 3:
                return (
                    <View style={styles.stepContent}>
                        <Input
                            label="M-Pesa Phone Number"
                            placeholder="254712345678"
                            value={formData.mpesaPhone}
                            onChangeText={(v) => updateField('mpesaPhone', v)}
                            keyboardType="phone-pad"
                            error={errors.mpesaPhone}
                            leftIcon="phone-portrait-outline"
                        />
                        <Text style={styles.hint}>
                            This is where we'll send your payouts after completed shifts.
                        </Text>

                        <Input
                            label="Bank Account (Optional)"
                            placeholder="e.g., 1234567890"
                            value={formData.bankAccount}
                            onChangeText={(v) => updateField('bankAccount', v)}
                            leftIcon="card-outline"
                        />

                        <Card title="Payout Summary" style={styles.payoutCard}>
                            <View style={styles.payoutRow}>
                                <Text style={styles.payoutLabel}>Platform Fee</Text>
                                <Text style={styles.payoutValue}>5%</Text>
                            </View>
                            <View style={styles.payoutRow}>
                                <Text style={styles.payoutLabel}>M-Pesa Cost</Text>
                                <Text style={styles.payoutValue}>~KSh 30-100</Text>
                            </View>
                            <View style={styles.payoutDivider} />
                            <Text style={styles.payoutNote}>
                                Your payout = Offered Rate - 5% - M-Pesa cost
                            </Text>
                        </Card>
                    </View>
                );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} disabled={currentStep === 0}>
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color={currentStep === 0 ? Colors.textMuted : Colors.textPrimary}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Professional Profile</Text>
                    <Text style={styles.stepIndicator}>
                        {currentStep + 1}/{STEPS.length}
                    </Text>
                </View>

                {/* Progress */}
                <View style={styles.progressContainer}>
                    {STEPS.map((step, index) => (
                        <TouchableOpacity
                            key={step}
                            style={styles.progressItem}
                            onPress={() => goToStep(index)}
                            disabled={index > currentStep}
                        >
                            <View
                                style={[
                                    styles.progressDot,
                                    index <= currentStep && styles.progressDotActive,
                                    index < currentStep && styles.progressDotComplete,
                                ]}
                            >
                                {index < currentStep && (
                                    <Ionicons name="checkmark" size={12} color="#fff" />
                                )}
                            </View>
                            <Text
                                style={[
                                    styles.progressLabel,
                                    index <= currentStep && styles.progressLabelActive,
                                ]}
                                numberOfLines={1}
                            >
                                {step}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <Text style={styles.stepTitle}>{STEPS[currentStep]}</Text>
                    {renderStep()}
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    {currentStep < STEPS.length - 1 ? (
                        <Button title="Continue" onPress={handleNext} fullWidth />
                    ) : (
                        <Button
                            title="Submit for Verification"
                            onPress={handleSubmit}
                            loading={loading}
                            fullWidth
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.base,
    },
    headerTitle: {
        fontSize: Typography.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    stepIndicator: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.base,
    },
    progressItem: {
        alignItems: 'center',
        flex: 1,
    },
    progressDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.backgroundCard,
        borderWidth: 2,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressDotActive: {
        borderColor: Colors.primary,
    },
    progressDotComplete: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    progressLabel: {
        fontSize: 10,
        color: Colors.textMuted,
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
    progressLabelActive: {
        color: Colors.textSecondary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing['2xl'],
    },
    stepTitle: {
        fontSize: Typography.xl,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: Spacing.lg,
    },
    stepContent: {},
    fieldLabel: {
        fontSize: Typography.sm,
        fontWeight: '500',
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        marginTop: Spacing.sm,
    },
    fieldError: {
        fontSize: Typography.xs,
        color: Colors.error,
        marginBottom: Spacing.xs,
    },
    regionGroup: {
        marginBottom: Spacing.md,
    },
    regionLabel: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        marginBottom: Spacing.xs,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.backgroundCard,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    chipActive: {
        backgroundColor: Colors.primary + '20',
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    chipTextActive: {
        color: Colors.primary,
        fontWeight: '600',
    },
    roleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.base,
    },
    roleChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.backgroundCard,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    hint: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
        marginTop: Spacing.sm,
        lineHeight: 20,
    },
    uploadSection: {
        marginTop: Spacing.xl,
    },
    uploadButton: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: Colors.border,
        borderRadius: BorderRadius.xl,
        padding: Spacing['2xl'],
        alignItems: 'center',
    },
    uploadText: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.primary,
        marginTop: Spacing.md,
    },
    uploadHint: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
        marginTop: Spacing.xs,
    },
    payoutCard: {
        marginTop: Spacing.lg,
    },
    payoutRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
    },
    payoutLabel: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    payoutValue: {
        fontSize: Typography.sm,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    payoutDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.sm,
    },
    payoutNote: {
        fontSize: Typography.sm,
        color: Colors.success,
        fontWeight: '500',
    },
    footer: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.base,
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
});
