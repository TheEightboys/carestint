import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { StatusBadge, Badge } from '../../components';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Stint } from '../../types';

const FILTERS = ['All', 'Open', 'In Progress', 'Completed', 'Disputed'];

export default function StintsManagement() {
    const [stints, setStints] = useState<Stint[]>([]);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        const stintsRef = collection(db, 'stints');
        const q = query(stintsRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Stint[];
            setStints(data);
        });
        return () => unsubscribe();
    }, []);

    const filteredStints = stints.filter((stint) => {
        if (filter === 'All') return true;
        return stint.status.toLowerCase().includes(filter.toLowerCase().replace(' ', '_'));
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>All Stints</Text>
                <Text style={styles.subtitle}>{stints.length} total</Text>
            </View>

            <View style={styles.filterRow}>
                {FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterPill, filter === f && styles.filterPillActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredStints}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.stintCard}>
                        <View style={styles.cardHeader}>
                            <View style={styles.cardInfo}>
                                <Text style={styles.stintRole}>{item.profession}</Text>
                                <Text style={styles.stintClinic}>{item.employerName}</Text>
                            </View>
                            <StatusBadge status={item.status} />
                        </View>
                        <View style={styles.cardDetails}>
                            <View style={styles.detailItem}>
                                <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                                <Text style={styles.detailText}>{item.city}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Ionicons name="cash-outline" size={14} color={Colors.textMuted} />
                                <Text style={styles.detailText}>KSh {item.offeredRate?.toLocaleString()}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Ionicons name="receipt-outline" size={14} color={Colors.textMuted} />
                                <Text style={styles.detailText}>Fee: KSh {item.bookingFee?.toLocaleString()}</Text>
                            </View>
                        </View>
                        {item.isFlagged && (
                            <View style={styles.flaggedBanner}>
                                <Ionicons name="warning" size={16} color={Colors.warning} />
                                <Text style={styles.flaggedText}>Flagged: {item.flagReason || 'Review needed'}</Text>
                            </View>
                        )}
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No stints found</Text>
                }
            />
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
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
        marginBottom: Spacing.base,
        flexWrap: 'wrap',
    },
    filterPill: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.backgroundCard,
        marginBottom: Spacing.xs,
    },
    filterPillActive: {
        backgroundColor: Colors.primary,
    },
    filterText: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    filterTextActive: {
        color: Colors.textPrimary,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing['2xl'],
    },
    stintCard: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        marginBottom: Spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardInfo: {
        flex: 1,
    },
    stintRole: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    stintClinic: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
        marginTop: Spacing.xs,
    },
    cardDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    detailText: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    flaggedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.md,
        padding: Spacing.sm,
        backgroundColor: Colors.warning + '20',
        borderRadius: BorderRadius.md,
    },
    flaggedText: {
        fontSize: Typography.sm,
        color: Colors.warning,
    },
    emptyText: {
        fontSize: Typography.base,
        color: Colors.textMuted,
        textAlign: 'center',
        paddingVertical: Spacing['2xl'],
    },
});
