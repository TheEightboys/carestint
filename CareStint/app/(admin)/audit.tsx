import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Badge } from '../../components';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { AuditLog } from '../../types';

const ACTION_ICONS: Record<string, string> = {
    EMPLOYER_APPROVED: 'checkmark-circle',
    EMPLOYER_SUSPENDED: 'close-circle',
    PROFESSIONAL_APPROVED: 'checkmark-circle',
    PROFESSIONAL_SUSPENDED: 'close-circle',
    STINT_CREATED: 'add-circle',
    PAYOUT_PROCESSED: 'cash',
    CONFIG_UPDATED: 'settings',
};

const ACTION_COLORS: Record<string, string> = {
    EMPLOYER_APPROVED: Colors.success,
    PROFESSIONAL_APPROVED: Colors.success,
    EMPLOYER_SUSPENDED: Colors.error,
    PROFESSIONAL_SUSPENDED: Colors.error,
    STINT_CREATED: Colors.info,
    PAYOUT_PROCESSED: Colors.warning,
    CONFIG_UPDATED: Colors.primary,
};

export default function AuditLogScreen() {
    const [logs, setLogs] = useState<AuditLog[]>([]);

    useEffect(() => {
        const logsRef = collection(db, 'auditLogs');
        const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as AuditLog[];
            setLogs(data);
        });
        return () => unsubscribe();
    }, []);

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Audit Log</Text>
                <Text style={styles.subtitle}>{logs.length} recent actions</Text>
            </View>

            <FlatList
                data={logs}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.logItem}>
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: (ACTION_COLORS[item.action] || Colors.primary) + '20' },
                            ]}
                        >
                            <Ionicons
                                name={(ACTION_ICONS[item.action] || 'ellipse') as any}
                                size={20}
                                color={ACTION_COLORS[item.action] || Colors.primary}
                            />
                        </View>
                        <View style={styles.logContent}>
                            <Text style={styles.logAction}>{formatAction(item.action)}</Text>
                            <Text style={styles.logMeta}>
                                {item.entityType} • {item.actorType === 'system' ? 'System' : 'Admin'}
                            </Text>
                            <Text style={styles.logTime}>{formatTime(item.timestamp)}</Text>
                        </View>
                        <Badge
                            text={item.entityType}
                            variant={item.entityType === 'employer' ? 'primary' : item.entityType === 'professional' ? 'success' : 'info'}
                            size="sm"
                        />
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>No audit logs yet</Text>
                        <Text style={styles.emptySubtext}>Actions will appear here</Text>
                    </View>
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
    listContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing['2xl'],
    },
    logItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        marginBottom: Spacing.sm,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    logContent: {
        flex: 1,
    },
    logAction: {
        fontSize: Typography.sm,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    logMeta: {
        fontSize: Typography.xs,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    logTime: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        marginTop: Spacing.xs,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: Spacing['4xl'],
    },
    emptyText: {
        fontSize: Typography.lg,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginTop: Spacing.lg,
    },
    emptySubtext: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
        marginTop: Spacing.xs,
    },
});
