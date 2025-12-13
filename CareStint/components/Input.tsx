import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TextInput as RNTextInput,
    Text,
    StyleSheet,
    ViewStyle,
    TextInputProps,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing } from '../constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    supportingText?: string;
    hint?: string;
    leadingIcon?: string;
    leftIcon?: string;  // Legacy support
    trailingIcon?: string;
    rightIcon?: string;  // Legacy support
    onTrailingIconPress?: () => void;
    onRightIconPress?: () => void;  // Legacy support
    variant?: 'filled' | 'outlined';
    containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    supportingText,
    hint,
    leadingIcon,
    leftIcon,
    trailingIcon,
    rightIcon,
    onTrailingIconPress,
    onRightIconPress,
    variant = 'filled',
    containerStyle,
    secureTextEntry,
    value,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

    const isPassword = secureTextEntry;
    const actualSecureEntry = isPassword && !showPassword;
    const actualLeadingIcon = leadingIcon || leftIcon;
    const actualTrailingIcon = trailingIcon || rightIcon;
    const actualOnTrailingPress = onTrailingIconPress || onRightIconPress;

    const hasValue = value && value.length > 0;
    const isActive = isFocused || hasValue;

    useEffect(() => {
        Animated.timing(labelAnim, {
            toValue: isActive ? 1 : 0,
            duration: 150,
            useNativeDriver: false,
        }).start();
    }, [isActive]);

    const labelTop = labelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [16, 4],
    });

    const labelSize = labelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [Typography.bodyLarge, Typography.bodySmall],
    });

    const getContainerStyles = (): ViewStyle => {
        const baseStyles: ViewStyle = {
            borderRadius: variant === 'filled' ? BorderRadius.extraSmall : BorderRadius.extraSmall,
        };

        if (variant === 'filled') {
            return {
                ...baseStyles,
                backgroundColor: Colors.surfaceVariant,
                borderBottomWidth: isFocused ? 2 : 1,
                borderBottomColor: error ? Colors.error : isFocused ? Colors.primary : Colors.outline,
                borderTopLeftRadius: BorderRadius.extraSmall,
                borderTopRightRadius: BorderRadius.extraSmall,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
            };
        } else {
            return {
                ...baseStyles,
                backgroundColor: 'transparent',
                borderWidth: isFocused ? 2 : 1,
                borderColor: error ? Colors.error : isFocused ? Colors.primary : Colors.outline,
            };
        }
    };

    return (
        <View style={[styles.container, containerStyle]}>
            <View style={[styles.inputContainer, getContainerStyles()]}>
                {actualLeadingIcon && (
                    <View style={styles.leadingIcon}>
                        <Ionicons
                            name={actualLeadingIcon as any}
                            size={24}
                            color={error ? Colors.error : isFocused ? Colors.primary : Colors.onSurfaceVariant}
                        />
                    </View>
                )}

                <View style={styles.inputWrapper}>
                    {label && (
                        <Animated.Text
                            style={[
                                styles.floatingLabel,
                                {
                                    top: labelTop,
                                    fontSize: labelSize,
                                    color: error ? Colors.error : isFocused ? Colors.primary : Colors.onSurfaceVariant,
                                },
                            ]}
                        >
                            {label}
                        </Animated.Text>
                    )}
                    <RNTextInput
                        style={[
                            styles.input,
                            label && styles.inputWithLabel,
                        ]}
                        placeholderTextColor={Colors.onSurfaceVariant}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        secureTextEntry={actualSecureEntry}
                        value={value}
                        {...props}
                    />
                </View>

                {isPassword && (
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.trailingIcon}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={24}
                            color={Colors.onSurfaceVariant}
                        />
                    </TouchableOpacity>
                )}

                {actualTrailingIcon && !isPassword && (
                    <TouchableOpacity
                        onPress={actualOnTrailingPress}
                        style={styles.trailingIcon}
                        disabled={!actualOnTrailingPress}
                    >
                        <Ionicons
                            name={actualTrailingIcon as any}
                            size={24}
                            color={Colors.onSurfaceVariant}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {(error || supportingText || hint) && (
                <View style={styles.supportingContainer}>
                    {error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : (
                        <Text style={styles.supportingText}>{supportingText || hint}</Text>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.base,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
    },
    inputWrapper: {
        flex: 1,
        position: 'relative',
        justifyContent: 'center',
    },
    floatingLabel: {
        position: 'absolute',
        left: Spacing.base,
        backgroundColor: 'transparent',
        letterSpacing: 0.5,
    },
    input: {
        flex: 1,
        height: 56,
        paddingHorizontal: Spacing.base,
        paddingTop: Spacing.base,
        paddingBottom: Spacing.sm,
        fontSize: Typography.bodyLarge,
        color: Colors.onSurface,
        letterSpacing: 0.5,
    },
    inputWithLabel: {
        paddingTop: 24,
        paddingBottom: 8,
    },
    leadingIcon: {
        paddingLeft: Spacing.md,
    },
    trailingIcon: {
        padding: Spacing.md,
    },
    supportingContainer: {
        paddingHorizontal: Spacing.base,
        paddingTop: Spacing.xs,
    },
    errorText: {
        fontSize: Typography.bodySmall,
        color: Colors.error,
        letterSpacing: 0.4,
    },
    supportingText: {
        fontSize: Typography.bodySmall,
        color: Colors.onSurfaceVariant,
        letterSpacing: 0.4,
    },
});

export default Input;
