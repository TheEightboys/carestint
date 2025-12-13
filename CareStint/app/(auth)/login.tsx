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
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { getUserByEmail, getEmployerByEmail, getProfessionalByEmail } from '../../services/firestore';
import { Button, Input } from '../../components';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

export default function LoginScreen() {
    const router = useRouter();
    const { role } = useLocalSearchParams<{ role: 'employer' | 'professional' | 'admin' }>();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const isEmployer = role === 'employer';
    const isAdmin = role === 'admin';

    const validateInputs = () => {
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address');
            return false;
        }
        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        return true;
    };

    const handleLogin = async () => {
        if (!validateInputs()) return;

        setLoading(true);
        setError('');

        try {
            // Check user's registered role in the users collection (source of truth) BEFORE sign-in
            const existingUser = await getUserByEmail(email);

            // If user exists and has a different role, block login immediately
            if (existingUser && existingUser.role && existingUser.role !== role && role !== 'admin') {
                const roleLabel = existingUser.role === 'employer' ? 'an Employer' :
                    existingUser.role === 'professional' ? 'a Healthcare Professional' :
                        existingUser.role;
                setError(`This email is registered as ${roleLabel}. Please go back and login as ${roleLabel}.`);
                setLoading(false);
                return;
            }

            // Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Determine where to navigate based on role-specific profile data
            if (role === 'employer') {
                const employer = await getEmployerByEmail(email);
                if (!employer) {
                    // Has user account but no employer profile, redirect to onboarding
                    router.replace('/(onboarding)/employer' as any);
                    return;
                }
                router.replace('/(employer)' as any);
            } else if (role === 'professional') {
                const professional = await getProfessionalByEmail(email);
                if (!professional) {
                    // Has user account but no professional profile, redirect to onboarding
                    router.replace('/(onboarding)/professional' as any);
                    return;
                }
                router.replace('/(professional)' as any);
            } else if (role === 'admin') {
                router.replace('/(admin)' as any);
            }
        } catch (err: any) {
            console.error('Login error:', err);

            // Handle specific Firebase errors
            if (err.code === 'auth/user-not-found') {
                setError('No account found with this email. Please sign up first.');
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Incorrect email or password. Please try again.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address format.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again later.');
            } else {
                setError('Failed to sign in. Please check your credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = () => {
        router.push({
            pathname: '/(auth)/signup' as any,
            params: { role },
        });
    };

    const getRoleDescription = () => {
        if (isAdmin) return 'Access the admin dashboard to manage the platform';
        if (isEmployer) return 'Post stints and find verified healthcare professionals';
        return 'Find healthcare shifts and get paid securely';
    };

    const getRoleIcon = () => {
        if (isAdmin) return 'shield';
        if (isEmployer) return 'business';
        return 'person';
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
                            <Ionicons name={getRoleIcon() as any} size={32} color="#fff" />
                        </LinearGradient>

                        <Text style={styles.title}>
                            Sign in as {isAdmin ? 'Admin' : isEmployer ? 'Employer' : 'Professional'}
                        </Text>
                        <Text style={styles.subtitle}>{getRoleDescription()}</Text>
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
                                placeholder="Enter your password"
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

                        {error && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            loading={loading}
                            fullWidth
                            style={styles.button}
                        />

                        {!isAdmin && (
                            <View style={styles.signupContainer}>
                                <Text style={styles.signupText}>Don't have an account?</Text>
                                <TouchableOpacity onPress={handleSignUp}>
                                    <Text style={styles.signupLink}>Sign Up</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        By continuing, you agree to our Terms of Service and Privacy Policy
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
        marginTop: Spacing['2xl'],
        marginBottom: Spacing['2xl'],
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
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.xl,
        gap: Spacing.xs,
    },
    signupText: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    signupLink: {
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
