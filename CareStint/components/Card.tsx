import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../constants/theme';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    supportingText?: string;
    rightHeader?: React.ReactNode;
    actions?: React.ReactNode;
    variant?: 'filled' | 'elevated' | 'outlined';
    onPress?: () => void;
    style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
    children,
    title,
    subtitle,
    supportingText,
    rightHeader,
    actions,
    variant = 'filled',
    onPress,
    style,
}) => {
    const getVariantStyles = (): ViewStyle => {
        switch (variant) {
            case 'elevated':
                return {
                    backgroundColor: Colors.surface,
                    ...Shadows.level1,
                };
            case 'outlined':
                return {
                    backgroundColor: Colors.surface,
                    borderWidth: 1,
                    borderColor: Colors.outline,
                };
            case 'filled':
            default:
                return {
                    backgroundColor: Colors.surfaceVariant,
                };
        }
    };

    const CardContainer = onPress ? Pressable : View;

    return (
        <CardContainer
            style={({ pressed }: any) => [
                styles.card,
                getVariantStyles(),
                onPress && pressed && styles.pressed,
                style
            ]}
            onPress={onPress}
        >
            {(title || rightHeader) && (
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        {title && <Text style={styles.title}>{title}</Text>}
                        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                    </View>
                    {rightHeader}
                </View>
            )}
            {supportingText && (
                <Text style={styles.supportingText}>{supportingText}</Text>
            )}
            {children}
            {actions && (
                <View style={styles.actions}>{actions}</View>
            )}
        </CardContainer>
    );
};

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    iconBackgroundColor?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: 'filled' | 'elevated' | 'outlined';
    onPress?: () => void;
    style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    iconBackgroundColor,
    trend,
    variant = 'filled',
    onPress,
    style,
}) => {
    const getVariantStyles = (): ViewStyle => {
        switch (variant) {
            case 'elevated':
                return {
                    backgroundColor: Colors.surface,
                    ...Shadows.level1,
                };
            case 'outlined':
                return {
                    backgroundColor: Colors.surface,
                    borderWidth: 1,
                    borderColor: Colors.outline,
                };
            case 'filled':
            default:
                return {
                    backgroundColor: Colors.surfaceVariant,
                };
        }
    };

    const CardContainer = onPress ? Pressable : View;

    return (
        <CardContainer
            style={({ pressed }: any) => [
                styles.statCard,
                getVariantStyles(),
                onPress && pressed && styles.pressed,
                style
            ]}
            onPress={onPress}
        >
            <View style={styles.statHeader}>
                {icon && (
                    <View style={[
                        styles.statIconContainer,
                        { backgroundColor: iconBackgroundColor || Colors.primary + '20' }
                    ]}>
                        {icon}
                    </View>
                )}
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
            <View style={styles.statFooter}>
                {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
                {trend && (
                    <View style={[
                        styles.trendBadge,
                        { backgroundColor: trend.isPositive ? Colors.success + '20' : Colors.error + '20' }
                    ]}>
                        <Text
                            style={[
                                styles.statTrend,
                                { color: trend.isPositive ? Colors.success : Colors.error },
                            ]}
                        >
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                        </Text>
                    </View>
                )}
            </View>
        </CardContainer>
    );
};

// Horizontal Card for list items - Material 3 style
interface ListCardProps {
    leading?: React.ReactNode;
    headline: string;
    supportingText?: string;
    trailing?: React.ReactNode;
    onPress?: () => void;
    style?: ViewStyle;
}

export const ListCard: React.FC<ListCardProps> = ({
    leading,
    headline,
    supportingText,
    trailing,
    onPress,
    style,
}) => {
    const CardContainer = onPress ? Pressable : View;

    return (
        <CardContainer
            style={({ pressed }: any) => [
                styles.listCard,
                onPress && pressed && styles.pressed,
                style
            ]}
            onPress={onPress}
        >
            {leading && <View style={styles.listLeading}>{leading}</View>}
            <View style={styles.listContent}>
                <Text style={styles.listHeadline} numberOfLines={1}>{headline}</Text>
                {supportingText && (
                    <Text style={styles.listSupportingText} numberOfLines={2}>{supportingText}</Text>
                )}
            </View>
            {trailing && <View style={styles.listTrailing}>{trailing}</View>}
        </CardContainer>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.large,
        padding: Spacing.base,
        overflow: 'hidden',
    },
    pressed: {
        opacity: 0.88,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: Typography.titleMedium,
        fontWeight: '500',
        color: Colors.onSurface,
        letterSpacing: 0.15,
    },
    subtitle: {
        fontSize: Typography.bodyMedium,
        color: Colors.onSurfaceVariant,
        marginTop: Spacing.xs,
        letterSpacing: 0.25,
    },
    supportingText: {
        fontSize: Typography.bodyMedium,
        color: Colors.onSurfaceVariant,
        marginBottom: Spacing.md,
        letterSpacing: 0.25,
        lineHeight: Typography.bodyMedium * 1.43,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing.sm,
        marginTop: Spacing.md,
        paddingTop: Spacing.sm,
    },
    // Stat Card Styles
    statCard: {
        borderRadius: BorderRadius.large,
        padding: Spacing.base,
        minWidth: 140,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.medium,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statTitle: {
        fontSize: Typography.bodySmall,
        color: Colors.onSurfaceVariant,
        letterSpacing: 0.4,
        marginTop: Spacing.xs,
    },
    statValue: {
        fontSize: Typography.headlineMedium,
        fontWeight: '500',
        color: Colors.onSurface,
        letterSpacing: 0,
    },
    statFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    statSubtitle: {
        fontSize: Typography.labelSmall,
        color: Colors.onSurfaceVariant,
        letterSpacing: 0.5,
    },
    trendBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    statTrend: {
        fontSize: Typography.labelSmall,
        fontWeight: '500',
    },
    // List Card Styles
    listCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceVariant,
        borderRadius: BorderRadius.medium,
        padding: Spacing.base,
        minHeight: 72,
    },
    listLeading: {
        marginRight: Spacing.base,
    },
    listContent: {
        flex: 1,
    },
    listHeadline: {
        fontSize: Typography.bodyLarge,
        fontWeight: '400',
        color: Colors.onSurface,
        letterSpacing: 0.5,
    },
    listSupportingText: {
        fontSize: Typography.bodyMedium,
        color: Colors.onSurfaceVariant,
        marginTop: 2,
        letterSpacing: 0.25,
    },
    listTrailing: {
        marginLeft: Spacing.base,
    },
});

export default Card;
