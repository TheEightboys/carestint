import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../../components';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

const OTP_LENGTH = 6;
const MOCK_OTP = '123456';

export default function OTPScreen() {
    const router = useRouter();
    const { phone, role } = useLocalSearchParams<{
        phone: string;
        role: 'employer' | 'professional';
    }>();

    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(30);

    const inputRefs = useRef<TextInput[]>([]);

    useEffect(() => {
        // Focus first input on mount
        inputRefs.current[0]?.focus();

        // Resend timer countdown
        const interval = setInterval(() => {
            setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
            // Handle paste
            const pastedOtp = value.slice(0, OTP_LENGTH).split('');
            const newOtp = [...otp];
            pastedOtp.forEach((char, i) => {
                if (index + i < OTP_LENGTH) {
                    newOtp[index + i] = char;
                }
            });
            setOtp(newOtp);
            inputRefs.current[Math.min(index + pastedOtp.length, OTP_LENGTH - 1)]?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');

        if (otpString.length !== OTP_LENGTH) {
            setError('Please enter the complete OTP');
            return;
        }

        // Mock OTP verification for demo
        if (otpString !== MOCK_OTP) {
            setError('Invalid OTP. Use 123456 for demo.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // DEMO MODE: Store user info locally and navigate directly
            // In production, this would use Firebase Phone Auth
            const mockUserId = `${role}_${phone?.replace(/\D/g, '') || 'demo'}`;

            // Store demo user data in AsyncStorage
            const demoUserData = {
                id: mockUserId,
                phone: phone || '+254000000000',
                role: role || 'employer',
                status: 'pending_validation',
                createdAt: new Date().toISOString(),
                isDemo: true,
            };

            await AsyncStorage.setItem('demoUser', JSON.stringify(demoUserData));
            await AsyncStorage.setItem('userRole', role || 'employer');

            // Check if user has completed onboarding before
            const hasOnboarded = await AsyncStorage.getItem(`onboarded_${mockUserId}`);

            if (hasOnboarded) {
                // Existing user - go to dashboard
                if (role === 'employer') {
                    router.replace('/(employer)');
                } else if (role === 'professional') {
                    router.replace('/(professional)');
                }
            } else {
                // New user - go to onboarding
                if (role === 'employer') {
                    router.replace('/(onboarding)/employer');
                } else {
                    router.replace('/(onboarding)/professional');
                }
            }
        } catch (err) {
            console.error('Verification error:', err);
            setError('Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = () => {
        setResendTimer(30);
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        // In production, trigger actual resend
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                {/* Back Button */}
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Verify your number</Text>
                    <Text style={styles.subtitle}>
                        Enter the 6-digit code sent to{'\n'}
                        <Text style={styles.phoneText}>{phone}</Text>
                    </Text>
                </View>

                {/* OTP Inputs */}
                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => {
                                if (ref) inputRefs.current[index] = ref;
                            }}
                            style={[
                                styles.otpInput,
                                digit && styles.otpInputFilled,
                                error && styles.otpInputError,
                            ]}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                            keyboardType="number-pad"
                            maxLength={OTP_LENGTH}
                            selectTextOnFocus
                        />
                    ))}
                </View>

                {error && <Text style={styles.error}>{error}</Text>}

                <Text style={styles.demoHint}>💡 Demo OTP: 123456</Text>

                {/* Verify Button */}
                <Button
                    title="Verify & Continue"
                    onPress={handleVerify}
                    loading={loading}
                    fullWidth
                    style={styles.button}
                />

                {/* Resend */}
                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive the code? </Text>
                    {resendTimer > 0 ? (
                        <Text style={styles.countdownText}>Resend in {resendTimer}s</Text>
                    ) : (
                        <TouchableOpacity onPress={handleResend}>
                            <Text style={styles.resendLink}>Resend</Text>
                        </TouchableOpacity>
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
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
    },
    backButton: {
        marginTop: Spacing.base,
        width: 44,
        height: 44,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        marginTop: Spacing['3xl'],
        marginBottom: Spacing['2xl'],
    },
    title: {
        fontSize: Typography['2xl'],
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    subtitle: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        marginTop: Spacing.sm,
        lineHeight: 24,
    },
    phoneText: {
        color: Colors.primary,
        fontWeight: '600',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.base,
    },
    otpInput: {
        width: 50,
        height: 56,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.backgroundCard,
        borderWidth: 1,
        borderColor: Colors.border,
        fontSize: Typography.xl,
        fontWeight: '700',
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    otpInputFilled: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '10',
    },
    otpInputError: {
        borderColor: Colors.error,
    },
    error: {
        fontSize: Typography.sm,
        color: Colors.error,
        marginBottom: Spacing.base,
    },
    demoHint: {
        fontSize: Typography.sm,
        color: Colors.info,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        padding: Spacing.sm,
        backgroundColor: Colors.info + '10',
        borderRadius: BorderRadius.md,
    },
    button: {
        marginBottom: Spacing.xl,
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resendText: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    countdownText: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
    },
    resendLink: {
        fontSize: Typography.sm,
        color: Colors.primary,
        fontWeight: '600',
    },
});
