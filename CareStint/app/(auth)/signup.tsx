import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getUserByEmail } from '../../services/firestore';
import { Button, Input } from '../../components';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

export default function SignupScreen() {
    const router = useRouter();
    const { role } = useLocalSearchParams<{ role: 'employer' | 'professional' }>();
    const { signUp } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const isEmployer = role === 'employer';

    const validateInputs = () => {
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address');
            return false;
        }
        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleSignUp = async () => {
        if (!validateInputs()) return;

        setLoading(true);
        setError('');

        try {
            // Check user's registered role in users collection (source of truth)
            const existingUser = await getUserByEmail(email);

            // If user already exists with a different role, block signup
            if (existingUser && existingUser.role) {
                if (existingUser.role !== role) {
                    const roleLabel = existingUser.role === 'employer' ? 'an Employer' :
                        existingUser.role === 'professional' ? 'a Healthcare Professional' :
                            existingUser.role;
                    setError(`This email is already registered as ${roleLabel}. Please login as ${roleLabel} instead.`);
                    setLoading(false);
                    return;
                } else {
                    // Same role - they should login instead
                    setError('An account with this email already exists. Please sign in instead.');
                    setLoading(false);
                    return;
                }
            }

            // Create account
            await signUp(email, password, role || 'professional');

            // Redirect to onboarding
            if (role === 'employer') {
                router.replace('/(onboarding)/employer' as any);
            } else {
                router.replace('/(onboarding)/professional' as any);
            }
        } catch (err: any) {
            console.error('Signup error:', err);

            if (err.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists. Please sign in instead.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak. Please use a stronger password.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address format.');
            } else {
                setError('Failed to create account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <LinearGradient
                            colors={[Colors.gradientStart, Colors.gradientEnd]}
                            style={styles.iconContainer}
                        >
                            <Ionicons
                                name={isEmployer ? 'business' : 'person'}
                                size={32}
                                color="#fff"
                            />
                        </LinearGradient>

                        <Text style={styles.title}>
                            Create {isEmployer ? 'Employer' : 'Professional'} Account
                        </Text>
                        <Text style={styles.subtitle}>
                            {isEmployer
                                ? 'Start posting stints and finding professionals'
                                : 'Start finding healthcare stints near you'}
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <Input
                            label="Email Address"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setError('');
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            leftIcon="mail-outline"
                        />

                        <View style={styles.passwordContainer}>
                            <Input
                                label="Password"
                                placeholder="Create a password"
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    setError('');
                                }}
                                secureTextEntry={!showPassword}
                                leftIcon="lock-closed-outline"
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={Colors.textMuted}
                                />
                            </TouchableOpacity>
                        </View>

                        <Input
                            label="Confirm Password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                setError('');
                            }}
                            secureTextEntry={!showPassword}
                            leftIcon="lock-closed-outline"
                        />

                        {error && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <Button
                            title="Create Account"
                            onPress={handleSignUp}
                            loading={loading}
                            fullWidth
                            style={styles.button}
                        />

                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account?</Text>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        By creating an account, you agree to our Terms of Service and Privacy Policy
                    </Text>
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
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
        alignItems: 'center',
        marginTop: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: BorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: Typography['2xl'],
        fontWeight: '700',
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: Spacing.sm,
        lineHeight: 22,
        paddingHorizontal: Spacing.md,
    },
    form: {
        flex: 1,
    },
    passwordContainer: {
        position: 'relative',
    },
    eyeButton: {
        position: 'absolute',
        right: 16,
        top: 42,
        padding: 4,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.base,
        padding: Spacing.sm,
        backgroundColor: Colors.error + '15',
        borderRadius: BorderRadius.lg,
    },
    errorText: {
        fontSize: Typography.sm,
        color: Colors.error,
        flex: 1,
    },
    button: {
        marginTop: Spacing.base,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.xl,
        gap: Spacing.xs,
    },
    loginText: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    loginLink: {
        fontSize: Typography.sm,
        color: Colors.primary,
        fontWeight: '600',
    },
    footer: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.background,
    },
    footerText: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: 18,
    },
});
