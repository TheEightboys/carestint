import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function LandingScreen() {
    const router = useRouter();

    const handleEmployerLogin = () => {
        router.push('/(auth)/login?role=employer');
    };

    const handleProfessionalLogin = () => {
        router.push('/(auth)/login?role=professional');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.content}>
                {/* Logo Section */}
                <View style={styles.logoSection}>
                    <LinearGradient
                        colors={[Colors.primary, Colors.gradientEnd]}
                        style={styles.logoBox}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="medical" size={40} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.appName}>CareStint</Text>
                    <Text style={styles.tagline}>Smart healthcare staffing</Text>
                </View>

                {/* Hero Text */}
                <View style={styles.heroSection}>
                    <Text style={styles.heroTitle}>
                        Find or fill your next{'\n'}healthcare stint
                    </Text>
                    <Text style={styles.heroSubtitle}>
                        Connecting clinics with verified professionals across East & Central Africa
                    </Text>
                </View>

                {/* Login Buttons */}
                <View style={styles.buttonSection}>
                    <Button
                        title="Sign in as Employer"
                        onPress={handleEmployerLogin}
                        fullWidth
                        icon={<Ionicons name="business" size={20} color="#fff" />}
                        style={styles.button}
                    />
                    <Button
                        title="Sign in as Professional"
                        onPress={handleProfessionalLogin}
                        variant="outline"
                        fullWidth
                        icon={<Ionicons name="person" size={20} color={Colors.primary} />}
                        style={styles.button}
                    />
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Available in Kenya, Uganda & Tanzania
                    </Text>
                    <Text style={styles.copyright}>© 2024 CareStint</Text>
                </View>
            </View>
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
        justifyContent: 'space-between',
    },
    logoSection: {
        alignItems: 'center',
        marginTop: height * 0.08,
    },
    logoBox: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    appName: {
        fontSize: Typography['3xl'],
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    tagline: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    heroSection: {
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
    },
    heroTitle: {
        fontSize: Typography['2xl'],
        fontWeight: '700',
        color: Colors.textPrimary,
        textAlign: 'center',
        lineHeight: 36,
    },
    heroSubtitle: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: Spacing.md,
        lineHeight: 24,
    },
    buttonSection: {
        gap: Spacing.md,
    },
    button: {
        marginBottom: 0,
    },
    footer: {
        alignItems: 'center',
        paddingBottom: Spacing.xl,
    },
    footerText: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
        marginBottom: Spacing.xs,
    },
    copyright: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
    },
});
