import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard, StatusBadge } from '../../components';
import { Colors, Typography, Spacing, BorderRadius, Fees } from '../../constants/theme';

interface PaymentRecord {
    id: string;
    stintId: string;
    profession: string;
    amount: number;
    fee: number;
    status: 'pending' | 'completed' | 'failed';
    createdAt: any;
}

export default function PaymentScreen() {
    const { user } = useAuth();
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, thisMonth: 0 });

    useEffect(() => {
        if (!user) return;

        // Simplified query - just filter by employerId, no orderBy to avoid index requirement
        const stintsRef = collection(db, 'stints');
        const q = query(
            stintsRef,
            where('employerId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const paymentData: PaymentRecord[] = snapshot.docs
                .filter(doc => {
                    const status = doc.data().status;
                    return status === 'completed' || status === 'in_progress';
                })
                .map((doc) => {
                    const stint = doc.data();
                    const fee = stint.bookingFee || stint.offeredRate * (stint.isUrgent ? Fees.urgentBooking : Fees.normalBooking);
                    return {
                        id: doc.id,
                        stintId: doc.id,
                        profession: stint.profession,
                        amount: stint.offeredRate,
                        fee: fee,
                        status: stint.status === 'completed' ? 'completed' : 'pending',
                        createdAt: stint.createdAt,
                    };
                })
                // Sort client-side to avoid index requirement
                .sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(0);
                    const dateB = b.createdAt?.toDate?.() || new Date(0);
                    return dateB.getTime() - dateA.getTime();
                });
            setPayments(paymentData);
            setStats({
                total: paymentData.reduce((sum, p) => sum + p.fee, 0),
                pending: paymentData.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.fee, 0),
                thisMonth: paymentData.filter((p) => p.status === 'completed').reduce((sum, p) => sum + p.fee, 0),
            });
        }, (error) => {
            console.error('Payment query error:', error);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Payments</Text>
                <Text style={styles.subtitle}>Booking fees & transactions</Text>
            </View>

            {/* Stats */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
                <StatCard
                    title="Total Fees"
                    value={`KSh ${stats.total.toLocaleString()}`}
                    style={styles.statCard}
                    icon={<Ionicons name="cash" size={20} color={Colors.success} />}
                />
                <StatCard
                    title="Pending"
                    value={`KSh ${stats.pending.toLocaleString()}`}
                    style={styles.statCard}
                    icon={<Ionicons name="time" size={20} color={Colors.warning} />}
                />
                <StatCard
                    title="This Month"
                    value={`KSh ${stats.thisMonth.toLocaleString()}`}
                    style={styles.statCard}
                    icon={<Ionicons name="calendar" size={20} color={Colors.info} />}
                />
            </ScrollView>

            {/* Fee Info */}
            <View style={styles.feeInfo}>
                <Text style={styles.feeInfoTitle}>Fee Structure</Text>
                <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Normal booking (24h+ notice)</Text>
                    <Text style={styles.feeValue}>{Fees.normalBooking * 100}%</Text>
                </View>
                <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Urgent booking (&lt;24h notice)</Text>
                    <Text style={styles.feeValue}>{Fees.urgentBooking * 100}%</Text>
                </View>
            </View>

            {/* Payment History */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Transaction History</Text>
                {payments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={64} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>No transactions yet</Text>
                    </View>
                ) : (
                    <FlatList
                        data={payments}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                        renderItem={({ item }) => (
                            <View style={styles.paymentCard}>
                                <View style={styles.paymentLeft}>
                                    <View style={[styles.paymentIcon, { backgroundColor: item.status === 'completed' ? Colors.success + '20' : Colors.warning + '20' }]}>
                                        <Ionicons
                                            name={item.status === 'completed' ? 'checkmark-circle' : 'time'}
                                            size={20}
                                            color={item.status === 'completed' ? Colors.success : Colors.warning}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.paymentProfession}>{item.profession}</Text>
                                        <Text style={styles.paymentStatus}>{item.status === 'completed' ? 'Paid' : 'Pending'}</Text>
                                    </View>
                                </View>
                                <Text style={styles.paymentAmount}>KSh {item.fee.toLocaleString()}</Text>
                            </View>
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.base,
    },
    title: {
        fontSize: Typography['2xl'],
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    subtitle: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    statsRow: {
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    statCard: {
        marginRight: Spacing.md,
        minWidth: 140,
    },
    feeInfo: {
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.xl,
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
    },
    feeInfoTitle: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
    },
    feeLabel: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    feeValue: {
        fontSize: Typography.sm,
        fontWeight: '600',
        color: Colors.primary,
    },
    section: {
        paddingHorizontal: Spacing.xl,
        flex: 1,
    },
    sectionTitle: {
        fontSize: Typography.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing['4xl'],
    },
    emptyText: {
        fontSize: Typography.lg,
        color: Colors.textMuted,
        marginTop: Spacing.md,
    },
    paymentCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        marginBottom: Spacing.sm,
    },
    paymentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    paymentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentProfession: {
        fontSize: Typography.sm,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    paymentStatus: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        marginTop: 2,
    },
    paymentAmount: {
        fontSize: Typography.base,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
});
