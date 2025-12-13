import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Card, StatusBadge, Button, Badge } from '../../components';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Employer } from '../../types';

const FILTERS = ['All', 'Pending', 'Active', 'Suspended'];

export default function EmployersManagement() {
    const [employers, setEmployers] = useState<Employer[]>([]);
    const [filter, setFilter] = useState('All');
    const [selectedEmployer, setSelectedEmployer] = useState<Employer | null>(null);

    useEffect(() => {
        const employersRef = collection(db, 'employers');
        const unsubscribe = onSnapshot(employersRef, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Employer[];
            setEmployers(data);
        });
        return () => unsubscribe();
    }, []);

    const filteredEmployers = employers.filter((emp) => {
        if (filter === 'All') return true;
        return emp.status.toLowerCase().includes(filter.toLowerCase());
    });

    const handleApprove = async (employer: Employer) => {
        try {
            await updateDoc(doc(db, 'employers', employer.id), {
                status: 'active',
                updatedAt: serverTimestamp(),
            });
            await addDoc(collection(db, 'auditLogs'), {
                actorType: 'admin',
                actorId: 'admin_demo',
                entityType: 'employer',
                entityId: employer.id,
                action: 'EMPLOYER_APPROVED',
                metadata: { facilityName: employer.facilityName },
                timestamp: serverTimestamp(),
            });
            Alert.alert('Success', 'Employer approved successfully');
            setSelectedEmployer(null);
        } catch (error) {
            Alert.alert('Error', 'Failed to approve employer');
        }
    };

    const handleSuspend = async (employer: Employer) => {
        Alert.alert('Suspend Employer', `Suspend ${employer.facilityName}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Suspend',
                style: 'destructive',
                onPress: async () => {
                    await updateDoc(doc(db, 'employers', employer.id), {
                        status: 'suspended',
                        updatedAt: serverTimestamp(),
                    });
                    await addDoc(collection(db, 'auditLogs'), {
                        actorType: 'admin',
                        actorId: 'admin_demo',
                        entityType: 'employer',
                        entityId: employer.id,
                        action: 'EMPLOYER_SUSPENDED',
                        timestamp: serverTimestamp(),
                    });
                    setSelectedEmployer(null);
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Employers</Text>
                <Text style={styles.subtitle}>{employers.length} total</Text>
            </View>

            {/* Filters */}
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
                data={filteredEmployers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.employerCard}
                        onPress={() => setSelectedEmployer(item)}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.cardInfo}>
                                <Text style={styles.facilityName}>{item.facilityName || 'Unknown'}</Text>
                                <Text style={styles.location}>{item.city}, {item.country}</Text>
                            </View>
                            <StatusBadge status={item.status} />
                        </View>
                        <View style={styles.cardMeta}>
                            <View style={styles.metaItem}>
                                <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                                <Text style={styles.metaText}>{item.stintsCount || 0} stints</Text>
                            </View>
                            <Badge
                                text={`Risk: ${item.riskLabel || 'Low'}`}
                                variant={item.riskLabel === 'High' ? 'error' : item.riskLabel === 'Medium' ? 'warning' : 'success'}
                                size="sm"
                            />
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No employers found</Text>
                }
            />

            {/* Detail Panel */}
            {selectedEmployer && (
                <View style={styles.detailPanel}>
                    <View style={styles.detailHeader}>
                        <Text style={styles.detailTitle}>{selectedEmployer.facilityName}</Text>
                        <TouchableOpacity onPress={() => setSelectedEmployer(null)}>
                            <Ionicons name="close" size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.detailContent}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Contact</Text>
                            <Text style={styles.detailValue}>{selectedEmployer.contactPerson}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Email</Text>
                            <Text style={styles.detailValue}>{selectedEmployer.email}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Phone</Text>
                            <Text style={styles.detailValue}>{selectedEmployer.phone}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>License</Text>
                            <Text style={styles.detailValue}>{selectedEmployer.licenseNumber}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Status</Text>
                            <StatusBadge status={selectedEmployer.status} />
                        </View>
                    </View>
                    <View style={styles.detailActions}>
                        {selectedEmployer.status === 'pending_validation' && (
                            <Button
                                title="Approve & Activate"
                                onPress={() => handleApprove(selectedEmployer)}
                                fullWidth
                            />
                        )}
                        {selectedEmployer.status !== 'suspended' && (
                            <Button
                                title="Suspend Account"
                                variant="danger"
                                onPress={() => handleSuspend(selectedEmployer)}
                                fullWidth
                                style={{ marginTop: Spacing.sm }}
                            />
                        )}
                    </View>
                </View>
            )}
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
    },
    filterPill: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.backgroundCard,
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
        paddingBottom: 200,
    },
    employerCard: {
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
    facilityName: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    location: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
        marginTop: Spacing.xs,
    },
    cardMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    metaText: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    emptyText: {
        fontSize: Typography.base,
        color: Colors.textMuted,
        textAlign: 'center',
        paddingVertical: Spacing['2xl'],
    },
    detailPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.backgroundSecondary,
        borderTopLeftRadius: BorderRadius['2xl'],
        borderTopRightRadius: BorderRadius['2xl'],
        padding: Spacing.xl,
        maxHeight: '60%',
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    detailTitle: {
        fontSize: Typography.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    detailContent: {},
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    detailLabel: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    detailValue: {
        fontSize: Typography.sm,
        color: Colors.textPrimary,
        fontWeight: '500',
    },
    detailActions: {
        marginTop: Spacing.lg,
    },
});
