import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, StatusBadge, Badge } from '../../components';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

export default function ProfessionalProfileScreen() {
    const router = useRouter();

    // Mock profile data
    const profile = {
        fullName: 'John Kamau',
        role: 'Registered Nurse (RN)',
        email: 'john.kamau@email.com',
        phone: '+254 712 345 678',
        locations: ['Nairobi', 'Kiambu', 'Machakos'],
        licenseNumber: 'RN/KEN/12345',
        licenseExpiry: '2025-06-30',
        status: 'active',
        rating: 4.8,
        totalStints: 42,
        yearsExperience: 5,
        dailyRate: 8000,
        isTopProfessional: true,
        earnings: {
            thisMonth: 64000,
            total: 420000,
        },
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => router.replace('/') },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>JK</Text>
                    </View>
                    <Text style={styles.name}>{profile.fullName}</Text>
                    <Text style={styles.role}>{profile.role}</Text>
                    <View style={styles.badgeRow}>
                        <StatusBadge status={profile.status} />
                        {profile.isTopProfessional && (
                            <Badge text="⭐ Top Professional" variant="success" />
                        )}
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Ionicons name="star" size={20} color={Colors.warning} />
                        <Text style={styles.statValue}>{profile.rating}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                        <Text style={styles.statValue}>{profile.totalStints}</Text>
                        <Text style={styles.statLabel}>Stints</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={20} color={Colors.info} />
                        <Text style={styles.statValue}>{profile.yearsExperience}y</Text>
                        <Text style={styles.statLabel}>Experience</Text>
                    </View>
                </View>

                {/* Earnings Card */}
                <Card title="Earnings" style={styles.card}>
                    <View style={styles.earningsRow}>
                        <View style={styles.earningsItem}>
                            <Text style={styles.earningsLabel}>This Month</Text>
                            <Text style={styles.earningsValue}>
                                KSh {profile.earnings.thisMonth.toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.earningsItem}>
                            <Text style={styles.earningsLabel}>All Time</Text>
                            <Text style={styles.earningsValue}>
                                KSh {profile.earnings.total.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Personal Info */}
                <Card title="Personal Information" style={styles.card}>
                    <View style={styles.infoRow}>
                        <Ionicons name="mail-outline" size={20} color={Colors.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{profile.email}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={20} color={Colors.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Phone</Text>
                            <Text style={styles.infoValue}>{profile.phone}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={20} color={Colors.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Preferred Locations</Text>
                            <Text style={styles.infoValue}>{profile.locations.join(', ')}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="cash-outline" size={20} color={Colors.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Daily Rate</Text>
                            <Text style={styles.infoValue}>KSh {profile.dailyRate.toLocaleString()}</Text>
                        </View>
                    </View>
                </Card>

                {/* License Info */}
                <Card title="License & Verification" style={styles.card}>
                    <View style={styles.infoRow}>
                        <Ionicons name="document-outline" size={20} color={Colors.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>License Number</Text>
                            <Text style={styles.infoValue}>{profile.licenseNumber}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={20} color={Colors.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Expires</Text>
                            <Text style={[styles.infoValue, { color: Colors.warning }]}>
                                {profile.licenseExpiry}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="create-outline" size={20} color={Colors.primary} />
                        <Text style={styles.actionText}>Request Profile Update</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                        <Text style={styles.actionText}>Payout History</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="help-circle-outline" size={20} color={Colors.primary} />
                        <Text style={styles.actionText}>Help & Support</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                        <Text style={[styles.actionText, { color: Colors.error }]}>Logout</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        alignItems: 'center',
        paddingTop: Spacing['2xl'],
        paddingBottom: Spacing.lg,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.base,
    },
    avatarText: {
        fontSize: Typography['2xl'],
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    name: {
        fontSize: Typography.xl,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    role: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: Colors.backgroundCard,
        marginHorizontal: Spacing.xl,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: Typography.xl,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginTop: Spacing.xs,
    },
    statLabel: {
        fontSize: Typography.xs,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    statDivider: {
        width: 1,
        backgroundColor: Colors.border,
    },
    card: {
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.base,
    },
    earningsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    earningsItem: {
        alignItems: 'center',
    },
    earningsLabel: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    earningsValue: {
        fontSize: Typography.lg,
        fontWeight: '700',
        color: Colors.success,
        marginTop: Spacing.xs,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
    },
    infoValue: {
        fontSize: Typography.sm,
        color: Colors.textPrimary,
        fontWeight: '500',
        marginTop: Spacing.xs,
    },
    actions: {
        marginHorizontal: Spacing.xl,
        marginTop: Spacing.base,
        marginBottom: Spacing['2xl'],
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.backgroundCard,
        padding: Spacing.base,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.sm,
    },
    actionText: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.textPrimary,
    },
});
