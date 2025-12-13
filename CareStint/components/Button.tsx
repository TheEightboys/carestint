import React, { useRef } from 'react';
import {
    TouchableOpacity,
    Pressable,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    Animated,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'filled',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    icon,
    iconPosition = 'left',
    style,
    textStyle,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const isDisabled = disabled || loading;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const getSizeStyles = (): ViewStyle => {
        switch (size) {
            case 'sm':
                return {
                    height: 36,
                    paddingHorizontal: 16,
                    borderRadius: BorderRadius.full,
                };
            case 'lg':
                return {
                    height: 56,
                    paddingHorizontal: 32,
                    borderRadius: BorderRadius.full,
                };
            default:
                return {
                    height: 44,
                    paddingHorizontal: 24,
                    borderRadius: BorderRadius.full,
                };
        }
    };

    const getTextSize = () => {
        switch (size) {
            case 'sm':
                return Typography.labelMedium;
            case 'lg':
                return Typography.labelLarge + 2;
            default:
                return Typography.labelLarge;
        }
    };

    const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
        // Map legacy variants to Material 3
        const mappedVariant = variant === 'primary' ? 'filled' :
            variant === 'secondary' ? 'tonal' :
                variant === 'outline' ? 'outlined' :
                    variant === 'ghost' ? 'text' :
                        variant;

        switch (mappedVariant) {
            case 'filled':
                return {
                    container: {
                        backgroundColor: isDisabled ? Colors.surfaceVariant : Colors.primary,
                    },
                    text: {
                        color: isDisabled ? Colors.textMuted : '#FFFFFF',
                    },
                };
            case 'tonal':
                return {
                    container: {
                        backgroundColor: isDisabled ? Colors.surfaceVariant : Colors.primary + '20',
                    },
                    text: {
                        color: isDisabled ? Colors.textMuted : Colors.primary,
                    },
                };
            case 'outlined':
                return {
                    container: {
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderColor: isDisabled ? Colors.outline : Colors.outline,
                    },
                    text: {
                        color: isDisabled ? Colors.textMuted : Colors.primary,
                    },
                };
            case 'text':
                return {
                    container: {
                        backgroundColor: 'transparent',
                    },
                    text: {
                        color: isDisabled ? Colors.textMuted : Colors.primary,
                    },
                };
            case 'elevated':
                return {
                    container: {
                        backgroundColor: isDisabled ? Colors.surfaceVariant : Colors.surface,
                        ...Shadows.level1,
                    },
                    text: {
                        color: isDisabled ? Colors.textMuted : Colors.primary,
                    },
                };
            case 'danger':
                return {
                    container: {
                        backgroundColor: isDisabled ? Colors.surfaceVariant : Colors.error,
                    },
                    text: {
                        color: isDisabled ? Colors.textMuted : '#FFFFFF',
                    },
                };
            default:
                return {
                    container: {
                        backgroundColor: Colors.primary,
                    },
                    text: {
                        color: '#FFFFFF',
                    },
                };
        }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    // Use gradient for filled variant
    const isGradient = (variant === 'filled' || variant === 'primary') && !isDisabled;

    const renderContent = () => (
        <>
            {loading ? (
                <ActivityIndicator color={variantStyles.text.color} size="small" />
            ) : (
                <View style={styles.contentRow}>
                    {icon && iconPosition === 'left' && (
                        <View style={styles.iconLeft}>{icon}</View>
                    )}
                    <Text
                        style={[
                            styles.buttonText,
                            { fontSize: getTextSize() },
                            variantStyles.text,
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                    {icon && iconPosition === 'right' && (
                        <View style={styles.iconRight}>{icon}</View>
                    )}
                </View>
            )}
        </>
    );

    if (isGradient) {
        return (
            <Animated.View style={[
                fullWidth && styles.fullWidth,
                { transform: [{ scale: scaleAnim }] },
                style,
            ]}>
                <Pressable
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={isDisabled}
                >
                    <LinearGradient
                        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                            styles.button,
                            sizeStyles,
                            isDisabled && styles.disabled,
                        ]}
                    >
                        {renderContent()}
                    </LinearGradient>
                </Pressable>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[
            fullWidth && styles.fullWidth,
            { transform: [{ scale: scaleAnim }] },
            style,
        ]}>
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isDisabled}
                style={({ pressed }) => [
                    styles.button,
                    sizeStyles,
                    variantStyles.container,
                    isDisabled && styles.disabled,
                    pressed && !isDisabled && styles.pressed,
                ]}
            >
                {renderContent()}
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontWeight: '500',
        textAlign: 'center',
        letterSpacing: 0.1,
    },
    iconLeft: {
        marginRight: Spacing.sm,
    },
    iconRight: {
        marginLeft: Spacing.sm,
    },
    disabled: {
        opacity: 0.38,
    },
    pressed: {
        opacity: 0.88,
    },
    fullWidth: {
        width: '100%',
    },
});

export default Button;
