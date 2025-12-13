import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Image,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
    onAnimationComplete?: () => void;
}

export default function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const taglineTranslate = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        // Initial logo fade in and scale
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]),
                { iterations: 2 }
            ).start();

            // Tagline animation
            Animated.parallel([
                Animated.timing(taglineOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(taglineTranslate, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]).start();

            // Complete after animations
            setTimeout(() => {
                if (onAnimationComplete) {
                    onAnimationComplete();
                }
            }, 2500);
        });
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F3EF" />

            {/* Background */}
            <LinearGradient
                colors={['#F5F3EF', '#EAE7E1', '#F5F3EF']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Decorative circles */}
            <Animated.View
                style={[
                    styles.decorativeCircle,
                    styles.circle1,
                    { opacity: fadeAnim }
                ]}
            />
            <Animated.View
                style={[
                    styles.decorativeCircle,
                    styles.circle2,
                    { opacity: fadeAnim }
                ]}
            />

            {/* Logo Container */}
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { scale: Animated.multiply(scaleAnim, pulseAnim) },
                        ],
                    },
                ]}
            >
                <Image
                    source={require('../assets/logo.jpg')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Tagline */}
            <Animated.View
                style={[
                    styles.taglineContainer,
                    {
                        opacity: taglineOpacity,
                        transform: [{ translateY: taglineTranslate }],
                    },
                ]}
            >
                <Text style={styles.tagline}>Healthcare Staffing Made Simple</Text>
            </Animated.View>

            {/* Loading indicator */}
            <Animated.View style={[styles.loadingContainer, { opacity: taglineOpacity }]}>
                <View style={styles.loadingDots}>
                    <LoadingDot delay={0} />
                    <LoadingDot delay={200} />
                    <LoadingDot delay={400} />
                </View>
            </Animated.View>
        </View>
    );
}

// Animated loading dot component
function LoadingDot({ delay }: { delay: number }) {
    const bounceAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bounceAnim, {
                        toValue: -8,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(bounceAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }, delay);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <Animated.View
            style={[
                styles.dot,
                { transform: [{ translateY: bounceAnim }] },
            ]}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F3EF',
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    decorativeCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(26, 54, 93, 0.03)',
    },
    circle1: {
        width: width * 1.5,
        height: width * 1.5,
        top: -width * 0.5,
        right: -width * 0.5,
    },
    circle2: {
        width: width,
        height: width,
        bottom: -width * 0.3,
        left: -width * 0.3,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: width * 0.7,
        height: width * 0.35,
    },
    taglineContainer: {
        marginTop: 24,
        paddingHorizontal: 40,
    },
    tagline: {
        fontSize: 16,
        color: '#1A365D',
        textAlign: 'center',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    loadingContainer: {
        position: 'absolute',
        bottom: 100,
    },
    loadingDots: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#1A365D',
    },
});
