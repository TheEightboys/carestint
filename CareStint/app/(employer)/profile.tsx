import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, StatusBadge, Button } from '../../components';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

export default function EmployerProfileScreen() {
    const router = useRouter();

    // Mock data - in production, fetch from Firebase
    const profile = {
        facilityName: 'City Medical Center',
        contactPerson: 'Dr. Jane Wanjiku',
        email: 'clinic@citymedical.co.ke',
        phone: '+254 712 345 678',
        city: 'Nairobi',
        country: 'Kenya',
        licenseNumber: 'KEN-MED-2024-12345',
        licenseExpiry: '2025-12-31',
        status: 'active',
        operatingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        staffSize: '11-50',
        payoutMethod: 'M-Pesa',
        stintsPosted: 24,
        stintsCompleted: 18,
        totalSpent: 250000,
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
                        <Ionicons name="business" size={32} color={Colors.primary} />
                    </View>
                    <Text style={styles.facilityName}>{profile.facilityName}</Text>
                    <StatusBadge status={profile.status} />
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{profile.stintsPosted}</Text>
                        <Text style={styles.statLabel}>Posted</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{profile.stintsCompleted}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>KSh {(profile.totalSpent / 1000).toFixed(0)}K</Text>
                        <Text style={styles.statLabel}>Spent</Text>
                    </View>
                </View>

                {/* Facility Info */}
                <Card title="Facility Information" style={styles.card}>
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={20} color={Colors.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Contact Person</Text>
                            <Text style={styles.infoValue}>{profile.contactPerson}</Text>
                        </View>
                    </View>
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
                            <Text style={styles.infoLabel}>Location</Text>
                            <Text style={styles.infoValue}>{profile.city}, {profile.country}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Operating Days</Text>
                            <Text style={styles.infoValue}>{profile.operatingDays.join(', ')}</Text>
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

                {/* Billing */}
                <Card title="Billing & Payout" style={styles.card}>
                    <View style={styles.infoRow}>
                        <Ionicons name="card-outline" size={20} color={Colors.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Payout Method</Text>
                            <Text style={styles.infoValue}>{profile.payoutMethod}</Text>
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
        backgroundColor: Colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.base,
    },
    facilityName: {
        fontSize: Typography.xl,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
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
    },
    statLabel: {
        fontSize: Typography.sm,
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
