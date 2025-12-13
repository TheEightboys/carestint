import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing } from '../constants/theme';

interface BadgeProps {
    text: string;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
    size?: 'sm' | 'md';
    style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
    text,
    variant = 'default',
    size = 'md',
    style,
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'success':
                return { backgroundColor: Colors.success + '20', borderColor: Colors.success };
            case 'warning':
                return { backgroundColor: Colors.warning + '20', borderColor: Colors.warning };
            case 'error':
                return { backgroundColor: Colors.error + '20', borderColor: Colors.error };
            case 'info':
                return { backgroundColor: Colors.info + '20', borderColor: Colors.info };
            case 'primary':
                return { backgroundColor: Colors.primary + '20', borderColor: Colors.primary };
            default:
                return { backgroundColor: Colors.backgroundElevated, borderColor: Colors.border };
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'success':
                return Colors.success;
            case 'warning':
                return Colors.warning;
            case 'error':
                return Colors.error;
            case 'info':
                return Colors.info;
            case 'primary':
                return Colors.primary;
            default:
                return Colors.textSecondary;
        }
    };

    return (
        <View
            style={[
                styles.badge,
                getVariantStyles(),
                size === 'sm' && styles.badgeSm,
                style,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    { color: getTextColor() },
                    size === 'sm' && styles.textSm,
                ]}
            >
                {text}
            </Text>
        </View>
    );
};

interface StatusBadgeProps {
    status: string;
    style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
    const getVariant = () => {
        switch (status.toLowerCase()) {
            case 'active':
            case 'completed':
            case 'verified':
            case 'settled':
            case 'auto_approved':
                return 'success';
            case 'pending':
            case 'pending_validation':
            case 'needs_manual_review':
            case 'in_progress':
                return 'warning';
            case 'suspended':
            case 'rejected':
            case 'disputed':
            case 'failed':
            case 'cancelled':
                return 'error';
            case 'open':
                return 'info';
            default:
                return 'default';
        }
    };

    const formatStatus = (s: string) => {
        return s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    return <Badge text={formatStatus(status)} variant={getVariant()} style={style} />;
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    badgeSm: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
    },
    text: {
        fontSize: Typography.sm,
        fontWeight: '500',
    },
    textSm: {
        fontSize: Typography.xs,
    },
});

export default Badge;
