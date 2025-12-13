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
import { StatusBadge, Button, Badge } from '../../components';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Professional } from '../../types';

const FILTERS = ['All', 'Pending', 'Active', 'Suspended'];

export default function ProfessionalsManagement() {
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [filter, setFilter] = useState('All');
    const [selectedPro, setSelectedPro] = useState<Professional | null>(null);

    useEffect(() => {
        const prosRef = collection(db, 'professionals');
        const unsubscribe = onSnapshot(prosRef, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Professional[];
            setProfessionals(data);
        });
        return () => unsubscribe();
    }, []);

    const filteredPros = professionals.filter((pro) => {
        if (filter === 'All') return true;
        return pro.status.toLowerCase().includes(filter.toLowerCase());
    });

    const handleApprove = async (pro: Professional) => {
        try {
            await updateDoc(doc(db, 'professionals', pro.id), {
                status: 'active',
                updatedAt: serverTimestamp(),
            });
            await addDoc(collection(db, 'auditLogs'), {
                actorType: 'admin',
                actorId: 'admin_demo',
                entityType: 'professional',
                entityId: pro.id,
                action: 'PROFESSIONAL_APPROVED',
                metadata: { fullName: pro.fullName },
                timestamp: serverTimestamp(),
            });
            Alert.alert('Success', 'Professional approved successfully');
            setSelectedPro(null);
        } catch (error) {
            Alert.alert('Error', 'Failed to approve professional');
        }
    };

    const handleSuspend = async (pro: Professional) => {
        Alert.alert('Suspend Professional', `Suspend ${pro.fullName}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Suspend',
                style: 'destructive',
                onPress: async () => {
                    await updateDoc(doc(db, 'professionals', pro.id), {
                        status: 'suspended',
                        updatedAt: serverTimestamp(),
                    });
                    await addDoc(collection(db, 'auditLogs'), {
                        actorType: 'admin',
                        actorId: 'admin_demo',
                        entityType: 'professional',
                        entityId: pro.id,
                        action: 'PROFESSIONAL_SUSPENDED',
                        timestamp: serverTimestamp(),
                    });
                    setSelectedPro(null);
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Professionals</Text>
                <Text style={styles.subtitle}>{professionals.length} total</Text>
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
                data={filteredPros}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.proCard}
                        onPress={() => setSelectedPro(item)}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.avatarContainer}>
                                <Text style={styles.avatarText}>
                                    {(item.fullName || 'U')[0].toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.cardInfo}>
                                <Text style={styles.proName}>{item.fullName || 'Unknown'}</Text>
                                <Text style={styles.proRole}>{item.primaryRole}</Text>
                            </View>
                            <StatusBadge status={item.status} />
                        </View>
                        <View style={styles.cardMeta}>
                            <View style={styles.metaItem}>
                                <Ionicons name="star" size={14} color={Colors.warning} />
                                <Text style={styles.metaText}>{item.averageRating?.toFixed(1) || '0.0'}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="calendar" size={14} color={Colors.textMuted} />
                                <Text style={styles.metaText}>{item.totalStints || 0} stints</Text>
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
                    <Text style={styles.emptyText}>No professionals found</Text>
                }
            />

            {selectedPro && (
                <View style={styles.detailPanel}>
                    <View style={styles.detailHeader}>
                        <Text style={styles.detailTitle}>{selectedPro.fullName}</Text>
                        <TouchableOpacity onPress={() => setSelectedPro(null)}>
                            <Ionicons name="close" size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.detailContent}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Role</Text>
                            <Text style={styles.detailValue}>{selectedPro.primaryRole}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Email</Text>
                            <Text style={styles.detailValue}>{selectedPro.email}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Phone</Text>
                            <Text style={styles.detailValue}>{selectedPro.phone}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>License</Text>
                            <Text style={styles.detailValue}>{selectedPro.licenseNumber}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Experience</Text>
                            <Text style={styles.detailValue}>{selectedPro.yearsOfExperience} years</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Status</Text>
                            <StatusBadge status={selectedPro.status} />
                        </View>
                    </View>
                    <View style={styles.detailActions}>
                        {selectedPro.status === 'pending_validation' && (
                            <Button
                                title="Approve & Activate"
                                onPress={() => handleApprove(selectedPro)}
                                fullWidth
                            />
                        )}
                        {selectedPro.status !== 'suspended' && (
                            <Button
                                title="Suspend Account"
                                variant="danger"
                                onPress={() => handleSuspend(selectedPro)}
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
    proCard: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        marginBottom: Spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    avatarText: {
        fontSize: Typography.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    cardInfo: {
        flex: 1,
    },
    proName: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    proRole: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
    },
    cardMeta: {
        flexDirection: 'row',
        gap: Spacing.lg,
        marginTop: Spacing.md,
        alignItems: 'center',
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
