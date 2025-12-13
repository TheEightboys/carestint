import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { ActiveRole } from '../types';

interface RoleSwitcherProps {
    variant?: 'header' | 'compact' | 'full';
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ variant = 'header' }) => {
    const router = useRouter();
    const { role, dualRoleInfo, switchRole, canAddSecondRole, isLoading } = useAuth();
    const [isSwitching, setIsSwitching] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Don't show for admins or if no dual role info
    if (role === 'admin' || !dualRoleInfo) {
        return null;
    }

    const hasBothRoles = dualRoleInfo.hasEmployerRole && dualRoleInfo.hasProfessionalRole;
    const currentRole = dualRoleInfo.activeRole;
    const otherRole: ActiveRole = currentRole === 'employer' ? 'professional' : 'employer';

    const handleSwitchRole = async () => {
        if (!hasBothRoles) return;

        setIsSwitching(true);
        setShowModal(false);
        try {
            const success = await switchRole(otherRole);
            if (success) {
                // Navigate to the appropriate dashboard
                const newDashboard = otherRole === 'employer'
                    ? '/(employer)/home'
                    : '/(professional)/home';
                router.replace(newDashboard as any);
            }
        } catch (error) {
            console.error('Error switching role:', error);
        } finally {
            setIsSwitching(false);
        }
    };

    const handleAddRole = () => {
        setShowModal(false);
        const roleToAdd = dualRoleInfo.hasEmployerRole ? 'professional' : 'employer';
        router.push(`/onboarding/${roleToAdd}?addRole=true` as any);
    };

    const getRoleIcon = (roleType: ActiveRole): string => {
        return roleType === 'employer' ? 'business' : 'medkit';
    };

    const getRoleLabel = (roleType: ActiveRole): string => {
        return roleType === 'employer' ? 'Employer' : 'Professional';
    };

    const getStatusColor = (status?: string): string => {
        switch (status) {
            case 'active':
                return '#22c55e';
            case 'pending_validation':
            case 'needs_manual_review':
                return '#f59e0b';
            case 'suspended':
            case 'rejected':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    // Compact variant - just a button
    if (variant === 'compact') {
        if (!hasBothRoles) {
            if (canAddSecondRole()) {
                return (
                    <TouchableOpacity
                        style={styles.compactButton}
                        onPress={handleAddRole}
                    >
                        <Ionicons name="add" size={18} color="#6366f1" />
                        <Text style={styles.compactButtonText}>
                            Add {dualRoleInfo.hasEmployerRole ? 'Pro' : 'Employer'}
                        </Text>
                    </TouchableOpacity>
                );
            }
            return null;
        }

        return (
            <TouchableOpacity
                style={styles.compactButton}
                onPress={handleSwitchRole}
                disabled={isSwitching}
            >
                {isSwitching ? (
                    <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                    <>
                        <Ionicons name="swap-horizontal" size={18} color="#6366f1" />
                        <Text style={styles.compactButtonText}>
                            {getRoleLabel(otherRole)}
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        );
    }

    // Header variant - icon button that opens modal
    return (
        <>
            <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowModal(true)}
            >
                <Ionicons
                    name={getRoleIcon(currentRole) as any}
                    size={20}
                    color="#fff"
                />
                {hasBothRoles && (
                    <View style={styles.badge}>
                        <Ionicons name="swap-horizontal" size={10} color="#fff" />
                    </View>
                )}
            </TouchableOpacity>

            <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowModal(false)}
                >
                    <Pressable style={styles.modalContent} onPress={() => { }}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Switch Role</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Current Role */}
                        <View style={styles.currentRole}>
                            <View style={[styles.roleIcon, { backgroundColor: '#6366f120' }]}>
                                <Ionicons
                                    name={getRoleIcon(currentRole) as any}
                                    size={24}
                                    color="#6366f1"
                                />
                            </View>
                            <View style={styles.roleInfo}>
                                <Text style={styles.roleLabel}>{getRoleLabel(currentRole)} Mode</Text>
                                <Text style={styles.roleStatus}>Currently active</Text>
                            </View>
                            <View style={[styles.statusBadge, {
                                backgroundColor: getStatusColor(
                                    currentRole === 'employer'
                                        ? dualRoleInfo.employerStatus
                                        : dualRoleInfo.professionalStatus
                                ) + '20'
                            }]}>
                                <Text style={[styles.statusText, {
                                    color: getStatusColor(
                                        currentRole === 'employer'
                                            ? dualRoleInfo.employerStatus
                                            : dualRoleInfo.professionalStatus
                                    )
                                }]}>
                                    {currentRole === 'employer'
                                        ? dualRoleInfo.employerStatus
                                        : dualRoleInfo.professionalStatus}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Switch or Add Role */}
                        {hasBothRoles ? (
                            <TouchableOpacity
                                style={styles.switchButton}
                                onPress={handleSwitchRole}
                                disabled={isSwitching}
                            >
                                {isSwitching ? (
                                    <ActivityIndicator size="small" color="#6366f1" />
                                ) : (
                                    <>
                                        <View style={[styles.roleIcon, { backgroundColor: '#9ca3af20' }]}>
                                            <Ionicons
                                                name={getRoleIcon(otherRole) as any}
                                                size={24}
                                                color="#6b7280"
                                            />
                                        </View>
                                        <View style={styles.roleInfo}>
                                            <Text style={styles.switchLabel}>
                                                Switch to {getRoleLabel(otherRole)}
                                            </Text>
                                            <Text style={styles.switchHint}>
                                                {otherRole === 'employer'
                                                    ? 'Post and manage stints'
                                                    : 'Find and apply for stints'}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                                    </>
                                )}
                            </TouchableOpacity>
                        ) : canAddSecondRole() ? (
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={handleAddRole}
                            >
                                <View style={styles.addIcon}>
                                    <Ionicons name="add" size={24} color="#6b7280" />
                                </View>
                                <View style={styles.roleInfo}>
                                    <Text style={styles.switchLabel}>
                                        Become a {dualRoleInfo.hasEmployerRole ? 'Professional' : 'Employer'}
                                    </Text>
                                    <Text style={styles.switchHint}>
                                        {dualRoleInfo.hasEmployerRole
                                            ? 'Start finding and applying for stints'
                                            : 'Start posting stints for your facility'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ) : null}

                        {hasBothRoles && (
                            <Text style={styles.tipText}>
                                💡 Tip: You can switch roles anytime from here
                            </Text>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#22c55e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    compactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#6366f110',
        gap: 6,
    },
    compactButtonText: {
        color: '#6366f1',
        fontSize: 14,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    currentRole: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        gap: 12,
    },
    roleIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleInfo: {
        flex: 1,
    },
    roleLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    roleStatus: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 16,
    },
    switchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 12,
    },
    switchLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
    },
    switchHint: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#d1d5db',
        gap: 12,
    },
    addIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#6b7280',
        marginTop: 16,
    },
});

export default RoleSwitcher;
