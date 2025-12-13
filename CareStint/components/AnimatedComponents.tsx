/**
 * CareStint Mobile - Animated Components
 * Premium animated UI components for enhanced user experience
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    ViewStyle,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, BorderRadius, Spacing } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animation timing presets
export const AnimationTiming = {
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 800,
};

// ============================================
// ANIMATED CARD - Fade in with scale effect
// ============================================
interface AnimatedCardProps {
    children: React.ReactNode;
    delay?: number;
    style?: ViewStyle;
    glassmorphism?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
    children,
    delay = 0,
    style,
    glassmorphism = false,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: AnimationTiming.normal,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 10,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: AnimationTiming.normal,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
        }, delay);

        return () => clearTimeout(timeout);
    }, [delay]);

    return (
        <Animated.View
            style={[
                glassmorphism ? styles.glassmorphismCard : styles.animatedCard,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }, { translateY }],
                },
                style,
            ]}
        >
            {children}
        </Animated.View>
    );
};

// ============================================
// ANIMATED LIST - Staggered fade in
// ============================================
interface AnimatedListProps {
    children: React.ReactNode[];
    staggerDelay?: number;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
    children,
    staggerDelay = 100,
}) => {
    return (
        <View>
            {React.Children.map(children, (child, index) => (
                <AnimatedCard key={index} delay={index * staggerDelay}>
                    {child}
                </AnimatedCard>
            ))}
        </View>
    );
};

// ============================================
// ANIMATED NUMBER - Counting animation
// ============================================
interface AnimatedNumberProps {
    value: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
    style?: any;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
    value,
    prefix = '',
    suffix = '',
    duration = 1000,
    style,
}) => {
    const [displayValue, setDisplayValue] = useState(0);
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        animValue.setValue(0);

        Animated.timing(animValue, {
            toValue: value,
            duration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();

        const listener = animValue.addListener(({ value: v }) => {
            setDisplayValue(Math.round(v));
        });

        return () => animValue.removeListener(listener);
    }, [value, duration]);

    return (
        <Text style={[styles.animatedNumber, style]}>
            {prefix}{displayValue.toLocaleString()}{suffix}
        </Text>
    );
};

// ============================================
// PULSING DOT - Status indicator
// ============================================
interface PulsingDotProps {
    color?: string;
    size?: number;
    active?: boolean;
}

export const PulsingDot: React.FC<PulsingDotProps> = ({
    color = Colors.success,
    size = 8,
    active = true,
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (active) {
            Animated.loop(
                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(pulseAnim, {
                            toValue: 1.8,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(pulseAnim, {
                            toValue: 1,
                            duration: 0,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.sequence([
                        Animated.timing(opacityAnim, {
                            toValue: 0,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacityAnim, {
                            toValue: 1,
                            duration: 0,
                            useNativeDriver: true,
                        }),
                    ]),
                ])
            ).start();
        }
    }, [active]);

    return (
        <View style={styles.pulsingDotContainer}>
            <Animated.View
                style={[
                    styles.pulsingRing,
                    {
                        width: size * 2,
                        height: size * 2,
                        borderRadius: size,
                        borderColor: color,
                        transform: [{ scale: pulseAnim }],
                        opacity: opacityAnim,
                    },
                ]}
            />
            <View
                style={[
                    styles.pulsingDotCore,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: color,
                    },
                ]}
            />
        </View>
    );
};

// ============================================
// GRADIENT BORDER CARD
// ============================================
interface GradientBorderCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    gradientColors?: readonly [string, string, ...string[]];
}

export const GradientBorderCard: React.FC<GradientBorderCardProps> = ({
    children,
    style,
    gradientColors = [Colors.gradientStart, Colors.gradientEnd],
}) => {
    return (
        <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientBorderOuter, style]}
        >
            <View style={styles.gradientBorderInner}>
                {children}
            </View>
        </LinearGradient>
    );
};

// ============================================
// SHIMMER EFFECT - For loading states
// ============================================
interface ShimmerProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Shimmer: React.FC<ShimmerProps> = ({
    width = '100%',
    height = 20,
    borderRadius = BorderRadius.md,
    style,
}) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    return (
        <View
            style={[
                styles.shimmerContainer,
                { width: width as any, height, borderRadius },
                style,
            ]}
        >
            <Animated.View
                style={[
                    styles.shimmerGradient,
                    { transform: [{ translateX }] },
                ]}
            >
                <LinearGradient
                    colors={[
                        'transparent',
                        'rgba(255,255,255,0.15)',
                        'transparent',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
};

// ============================================
// PROGRESS BAR - Animated progress
// ============================================
interface ProgressBarProps {
    progress: number; // 0-100
    color?: string;
    height?: number;
    animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    color = Colors.primary,
    height = 6,
    animated = true,
}) => {
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (animated) {
            Animated.spring(progressAnim, {
                toValue: progress,
                tension: 40,
                friction: 10,
                useNativeDriver: false,
            }).start();
        } else {
            progressAnim.setValue(progress);
        }
    }, [progress, animated]);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={[styles.progressBarContainer, { height }]}>
            <Animated.View
                style={[
                    styles.progressBarFill,
                    {
                        width: progressWidth,
                        backgroundColor: color,
                    },
                ]}
            />
        </View>
    );
};

// ============================================
// FLOATING ACTION BUTTON
// ============================================
interface FloatingButtonProps {
    onPress: () => void;
    icon: React.ReactNode;
    style?: ViewStyle;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
    onPress,
    icon,
    style,
}) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.floatingButton,
                { transform: [{ scale: scaleAnim }] },
                style,
            ]}
        >
            <LinearGradient
                colors={[Colors.gradientStart, Colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.floatingButtonGradient}
            >
                {icon}
            </LinearGradient>
        </Animated.View>
    );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
    animatedCard: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
    },
    glassmorphismCard: {
        backgroundColor: 'rgba(26, 41, 66, 0.7)',
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    animatedNumber: {
        fontSize: Typography['2xl'],
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    pulsingDotContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulsingRing: {
        position: 'absolute',
        borderWidth: 2,
    },
    pulsingDotCore: {},
    gradientBorderOuter: {
        padding: 2,
        borderRadius: BorderRadius.xl + 2,
    },
    gradientBorderInner: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
    },
    shimmerContainer: {
        backgroundColor: Colors.backgroundCard,
        overflow: 'hidden',
    },
    shimmerGradient: {
        ...StyleSheet.absoluteFillObject,
        width: SCREEN_WIDTH,
    },
    progressBarContainer: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: BorderRadius.full,
    },
    floatingButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    floatingButtonGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
