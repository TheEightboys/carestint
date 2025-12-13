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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Input, Card } from '../../../components';
import { Colors, Typography, Spacing, BorderRadius, Regions } from '../../../constants/theme';
import { EmployerOnboardingData } from '../../../types';

const STEPS = ['Facility Details', 'License Info', 'Billing', 'Review'];

const OPERATING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STAFF_SIZES = ['1-10', '11-50', '51-200', '200+'];

export default function EmployerOnboardingScreen() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<EmployerOnboardingData>({
        facilityName: '',
        contactPerson: '',
        email: '',
        phone: '',
        city: '',
        country: 'Kenya',
        operatingDays: [],
        staffSize: '',
        licenseNumber: '',
        payoutMethod: 'mpesa',
        billingEmail: '',
    });

    const updateField = (field: keyof EmployerOnboardingData, value: any) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    const toggleDay = (day: string) => {
        const days = formData.operatingDays.includes(day)
            ? formData.operatingDays.filter((d) => d !== day)
            : [...formData.operatingDays, day];
        updateField('operatingDays', days);
    };

    const validateStep = () => {
        const newErrors: Record<string, string> = {};

        if (currentStep === 0) {
            if (!formData.facilityName) newErrors.facilityName = 'Facility name is required';
            if (!formData.contactPerson) newErrors.contactPerson = 'Contact person is required';
            if (!formData.email) newErrors.email = 'Email is required';
            if (!formData.city) newErrors.city = 'City is required';
            if (formData.operatingDays.length === 0) newErrors.operatingDays = 'Select at least one day';
            if (!formData.staffSize) newErrors.staffSize = 'Select staff size';
        } else if (currentStep === 1) {
            if (!formData.licenseNumber) newErrors.licenseNumber = 'License number is required';
        } else if (currentStep === 2) {
            if (!formData.billingEmail) newErrors.billingEmail = 'Billing email is required';
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
        setLoading(true);
        try {
            // DEMO MODE: Store data locally using AsyncStorage
            const employerId = `employer_${formData.phone?.replace(/\D/g, '') || 'demo'}`;

            const employerData = {
                id: employerId,
                userId: employerId,
                ...formData,
                status: 'pending_validation',
                riskScore: 0,
                riskLabel: 'Low',
                stintsCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Store in AsyncStorage for demo
            await AsyncStorage.setItem('employerData', JSON.stringify(employerData));
            await AsyncStorage.setItem(`onboarded_${employerId}`, 'true');
            await AsyncStorage.setItem('userRole', 'employer');

            // Navigate to employer dashboard
            router.replace('/(employer)');
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
                            label="Facility Name"
                            placeholder="e.g., City Medical Center"
                            value={formData.facilityName}
                            onChangeText={(v) => updateField('facilityName', v)}
                            error={errors.facilityName}
                            leftIcon="business-outline"
                        />
                        <Input
                            label="Contact Person"
                            placeholder="Full name"
                            value={formData.contactPerson}
                            onChangeText={(v) => updateField('contactPerson', v)}
                            error={errors.contactPerson}
                            leftIcon="person-outline"
                        />
                        <Input
                            label="Email"
                            placeholder="clinic@example.com"
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
                            leftIcon="call-outline"
                        />

                        <Text style={styles.fieldLabel}>Country</Text>
                        <View style={styles.chipRow}>
                            {Regions.map((r) => (
                                <TouchableOpacity
                                    key={r.country}
                                    style={[
                                        styles.chip,
                                        formData.country === r.country && styles.chipActive,
                                    ]}
                                    onPress={() => updateField('country', r.country)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            formData.country === r.country && styles.chipTextActive,
                                        ]}
                                    >
                                        {r.country}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Input
                            label="City / Town"
                            placeholder="e.g., Nairobi"
                            value={formData.city}
                            onChangeText={(v) => updateField('city', v)}
                            error={errors.city}
                            leftIcon="location-outline"
                        />

                        <Text style={styles.fieldLabel}>Operating Days</Text>
                        {errors.operatingDays && (
                            <Text style={styles.fieldError}>{errors.operatingDays}</Text>
                        )}
                        <View style={styles.chipRow}>
                            {OPERATING_DAYS.map((day) => (
                                <TouchableOpacity
                                    key={day}
                                    style={[
                                        styles.dayChip,
                                        formData.operatingDays.includes(day) && styles.chipActive,
                                    ]}
                                    onPress={() => toggleDay(day)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            formData.operatingDays.includes(day) && styles.chipTextActive,
                                        ]}
                                    >
                                        {day}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.fieldLabel}>Staff Size</Text>
                        {errors.staffSize && <Text style={styles.fieldError}>{errors.staffSize}</Text>}
                        <View style={styles.chipRow}>
                            {STAFF_SIZES.map((size) => (
                                <TouchableOpacity
                                    key={size}
                                    style={[
                                        styles.chip,
                                        formData.staffSize === size && styles.chipActive,
                                    ]}
                                    onPress={() => updateField('staffSize', size)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            formData.staffSize === size && styles.chipTextActive,
                                        ]}
                                    >
                                        {size}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 1:
                return (
                    <View style={styles.stepContent}>
                        <Input
                            label="Facility License Number"
                            placeholder="e.g., KEN-MED-2024-12345"
                            value={formData.licenseNumber}
                            onChangeText={(v) => updateField('licenseNumber', v)}
                            error={errors.licenseNumber}
                            leftIcon="document-outline"
                        />
                        <Text style={styles.hint}>
                            Enter your official medical facility license number. This will be verified
                            before your account is activated.
                        </Text>

                        <View style={styles.uploadSection}>
                            <TouchableOpacity style={styles.uploadButton}>
                                <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
                                <Text style={styles.uploadText}>Upload License Document</Text>
                                <Text style={styles.uploadHint}>PDF, JPG, or PNG (max 5MB)</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 2:
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.fieldLabel}>Payout Method</Text>
                        <View style={styles.payoutOptions}>
                            <TouchableOpacity
                                style={[
                                    styles.payoutOption,
                                    formData.payoutMethod === 'mpesa' && styles.payoutOptionActive,
                                ]}
                                onPress={() => updateField('payoutMethod', 'mpesa')}
                            >
                                <Ionicons
                                    name="phone-portrait-outline"
                                    size={24}
                                    color={formData.payoutMethod === 'mpesa' ? Colors.primary : Colors.textMuted}
                                />
                                <Text
                                    style={[
                                        styles.payoutOptionText,
                                        formData.payoutMethod === 'mpesa' && styles.payoutOptionTextActive,
                                    ]}
                                >
                                    M-Pesa
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.payoutOption,
                                    formData.payoutMethod === 'bank' && styles.payoutOptionActive,
                                ]}
                                onPress={() => updateField('payoutMethod', 'bank')}
                            >
                                <Ionicons
                                    name="card-outline"
                                    size={24}
                                    color={formData.payoutMethod === 'bank' ? Colors.primary : Colors.textMuted}
                                />
                                <Text
                                    style={[
                                        styles.payoutOptionText,
                                        formData.payoutMethod === 'bank' && styles.payoutOptionTextActive,
                                    ]}
                                >
                                    Bank Transfer
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Input
                            label="Billing Email"
                            placeholder="billing@yourfacility.com"
                            value={formData.billingEmail}
                            onChangeText={(v) => updateField('billingEmail', v)}
                            keyboardType="email-address"
                            error={errors.billingEmail}
                            leftIcon="mail-outline"
                        />
                        <Text style={styles.hint}>
                            Invoices and payment receipts will be sent to this email.
                        </Text>
                    </View>
                );

            case 3:
                return (
                    <View style={styles.stepContent}>
                        <Card title="Facility Details" style={styles.reviewCard}>
                            <View style={styles.reviewRow}>
                                <Text style={styles.reviewLabel}>Name</Text>
                                <Text style={styles.reviewValue}>{formData.facilityName}</Text>
                            </View>
                            <View style={styles.reviewRow}>
                                <Text style={styles.reviewLabel}>Contact</Text>
                                <Text style={styles.reviewValue}>{formData.contactPerson}</Text>
                            </View>
                            <View style={styles.reviewRow}>
                                <Text style={styles.reviewLabel}>Location</Text>
                                <Text style={styles.reviewValue}>{formData.city}, {formData.country}</Text>
                            </View>
                            <View style={styles.reviewRow}>
                                <Text style={styles.reviewLabel}>Operating</Text>
                                <Text style={styles.reviewValue}>{formData.operatingDays.join(', ')}</Text>
                            </View>
                        </Card>

                        <Card title="License & Billing" style={styles.reviewCard}>
                            <View style={styles.reviewRow}>
                                <Text style={styles.reviewLabel}>License</Text>
                                <Text style={styles.reviewValue}>{formData.licenseNumber}</Text>
                            </View>
                            <View style={styles.reviewRow}>
                                <Text style={styles.reviewLabel}>Payout</Text>
                                <Text style={styles.reviewValue}>
                                    {formData.payoutMethod === 'mpesa' ? 'M-Pesa' : 'Bank'}
                                </Text>
                            </View>
                            <View style={styles.reviewRow}>
                                <Text style={styles.reviewLabel}>Billing Email</Text>
                                <Text style={styles.reviewValue}>{formData.billingEmail}</Text>
                            </View>
                        </Card>

                        <View style={styles.reviewNote}>
                            <Ionicons name="information-circle" size={20} color={Colors.info} />
                            <Text style={styles.reviewNoteText}>
                                Your account will be reviewed within 24h. You can start posting shifts
                                once approved.
                            </Text>
                        </View>
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
                    <Text style={styles.headerTitle}>Clinic Onboarding</Text>
                    <Text style={styles.stepIndicator}>
                        {currentStep + 1}/{STEPS.length}
                    </Text>
                </View>

                {/* Progress Bar */}
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
                            title="Submit for Review"
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
        fontSize: Typography.xs,
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
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.base,
    },
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.backgroundCard,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    dayChip: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: Colors.backgroundCard,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
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
    payoutOptions: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    payoutOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.base,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.backgroundCard,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    payoutOptionActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '10',
    },
    payoutOptionText: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
    },
    payoutOptionTextActive: {
        color: Colors.primary,
        fontWeight: '600',
    },
    reviewCard: {
        marginBottom: Spacing.base,
    },
    reviewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    reviewLabel: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
    },
    reviewValue: {
        fontSize: Typography.sm,
        color: Colors.textPrimary,
        fontWeight: '500',
    },
    reviewNote: {
        flexDirection: 'row',
        gap: Spacing.sm,
        padding: Spacing.base,
        backgroundColor: Colors.info + '10',
        borderRadius: BorderRadius.lg,
        marginTop: Spacing.base,
    },
    reviewNoteText: {
        flex: 1,
        fontSize: Typography.sm,
        color: Colors.info,
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.base,
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
});
