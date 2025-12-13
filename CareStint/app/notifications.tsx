import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToNotifications, markNotificationAsRead } from '../services/firestore';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { Notification } from '../types';

export default function NotificationsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!user?.uid) {
            setIsLoading(false);
            return;
        }

        const unsubscribe = subscribeToNotifications(user.uid, (notifs) => {
            setNotifications(notifs);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        // Subscription will auto-update
        setTimeout(() => setRefreshing(false), 1000);
    };

    const handleNotificationPress = async (notification: Notification) => {
        // Mark as read
        if (!notification.isRead) {
            try {
                await markNotificationAsRead(notification.id);
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }

        // Navigate based on notification type
        if (notification.link) {
            // Parse the link and navigate
            router.push(notification.link as any);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'stint_posted': return 'briefcase';
            case 'application_received': return 'person-add';
            case 'application_accepted': return 'checkmark-circle';
            case 'application_declined': return 'close-circle';
            case 'stint_started': return 'play-circle';
            case 'stint_completed': return 'trophy';
            case 'payment': return 'cash';
            case 'system': return 'information-circle';
            default: return 'notifications';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'application_accepted':
            case 'stint_completed':
            case 'payment': return Colors.success;
            case 'application_declined': return Colors.error;
            case 'stint_started': return Colors.primary;
            case 'application_received': return Colors.warning;
            default: return Colors.info;
        }
    };

    const formatTime = (date: Date | undefined) => {
        if (!date) return '';
        const now = new Date();
        const notifDate = new Date(date);
        const diff = now.getTime() - notifDate.getTime();

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return notifDate.toLocaleDateString();
    };

    const renderNotification = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[
                styles.notificationCard,
                !item.isRead && styles.unreadCard,
            ]}
            onPress={() => handleNotificationPress(item)}
        >
            <View
                style={[
                    styles.iconContainer,
                    { backgroundColor: getNotificationColor(item.type) + '20' }
                ]}
            >
                <Ionicons
                    name={getNotificationIcon(item.type) as any}
                    size={24}
                    color={getNotificationColor(item.type)}
                />
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Notifications List */}
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotification}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={64} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                        <Text style={styles.emptySubtext}>
                            You'll receive updates about your stints and applications here
                        </Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: Spacing.base,
        color: Colors.textSecondary,
        fontSize: Typography.base,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: Typography.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    placeholder: {
        width: 44,
    },
    listContent: {
        padding: Spacing.xl,
    },
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        marginBottom: Spacing.md,
    },
    unreadCard: {
        backgroundColor: Colors.primary + '08',
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    message: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    time: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        marginTop: Spacing.sm,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        marginLeft: Spacing.sm,
        marginTop: Spacing.xs,
    },
    emptyState: {
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
        textAlign: 'center',
        marginTop: Spacing.sm,
        paddingHorizontal: Spacing['2xl'],
    },
});
