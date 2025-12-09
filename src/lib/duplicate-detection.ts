'use client';

import { db } from './firebase/clientApp';
import { collection, getDocs, addDoc, Timestamp, query, where } from 'firebase/firestore';

export interface DuplicateGroup {
    id?: string;
    type: 'employer' | 'professional';
    matchType: 'phone' | 'email' | 'id_number' | 'license' | 'ip_address';
    entities: {
        id: string;
        name: string;
        matchValue: string;
    }[];
    severity: 'low' | 'medium' | 'high';
    status: 'pending' | 'reviewed' | 'resolved' | 'false_positive';
    detectedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    notes?: string;
}

// Detect duplicate accounts based on various criteria
export async function detectDuplicates(): Promise<{
    employers: DuplicateGroup[];
    professionals: DuplicateGroup[];
}> {
    const result = {
        employers: [] as DuplicateGroup[],
        professionals: [] as DuplicateGroup[],
    };

    if (!db) return result;

    try {
        // Detect employer duplicates
        const employersSnapshot = await getDocs(collection(db, 'employers'));
        const employers = employersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Check for duplicate phones
        const employerPhoneMap = new Map<string, typeof employers>();
        employers.forEach(emp => {
            const phone = (emp as any).phone?.trim();
            if (phone) {
                if (!employerPhoneMap.has(phone)) {
                    employerPhoneMap.set(phone, []);
                }
                employerPhoneMap.get(phone)!.push(emp);
            }
        });

        employerPhoneMap.forEach((matches, phone) => {
            if (matches.length > 1) {
                result.employers.push({
                    type: 'employer',
                    matchType: 'phone',
                    entities: matches.map(m => ({
                        id: m.id,
                        name: (m as any).facilityName || 'Unknown',
                        matchValue: phone,
                    })),
                    severity: 'high',
                    status: 'pending',
                    detectedAt: new Date(),
                });
            }
        });

        // Check for duplicate emails
        const employerEmailMap = new Map<string, typeof employers>();
        employers.forEach(emp => {
            const email = (emp as any).email?.trim().toLowerCase();
            if (email) {
                if (!employerEmailMap.has(email)) {
                    employerEmailMap.set(email, []);
                }
                employerEmailMap.get(email)!.push(emp);
            }
        });

        employerEmailMap.forEach((matches, email) => {
            if (matches.length > 1) {
                result.employers.push({
                    type: 'employer',
                    matchType: 'email',
                    entities: matches.map(m => ({
                        id: m.id,
                        name: (m as any).facilityName || 'Unknown',
                        matchValue: email,
                    })),
                    severity: 'medium',
                    status: 'pending',
                    detectedAt: new Date(),
                });
            }
        });

        // Detect professional duplicates
        const professionalsSnapshot = await getDocs(collection(db, 'professionals'));
        const professionals = professionalsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Check for duplicate phones
        const proPhoneMap = new Map<string, typeof professionals>();
        professionals.forEach(pro => {
            const phone = (pro as any).phone?.trim();
            if (phone) {
                if (!proPhoneMap.has(phone)) {
                    proPhoneMap.set(phone, []);
                }
                proPhoneMap.get(phone)!.push(pro);
            }
        });

        proPhoneMap.forEach((matches, phone) => {
            if (matches.length > 1) {
                result.professionals.push({
                    type: 'professional',
                    matchType: 'phone',
                    entities: matches.map(m => ({
                        id: m.id,
                        name: (m as any).fullName || 'Unknown',
                        matchValue: phone,
                    })),
                    severity: 'high',
                    status: 'pending',
                    detectedAt: new Date(),
                });
            }
        });

        // Check for duplicate license numbers
        const proLicenseMap = new Map<string, typeof professionals>();
        professionals.forEach(pro => {
            const license = (pro as any).licenseNumber?.trim();
            if (license) {
                if (!proLicenseMap.has(license)) {
                    proLicenseMap.set(license, []);
                }
                proLicenseMap.get(license)!.push(pro);
            }
        });

        proLicenseMap.forEach((matches, license) => {
            if (matches.length > 1) {
                result.professionals.push({
                    type: 'professional',
                    matchType: 'license',
                    entities: matches.map(m => ({
                        id: m.id,
                        name: (m as any).fullName || 'Unknown',
                        matchValue: license,
                    })),
                    severity: 'high',
                    status: 'pending',
                    detectedAt: new Date(),
                });
            }
        });

        // Check for duplicate emails
        const proEmailMap = new Map<string, typeof professionals>();
        professionals.forEach(pro => {
            const email = (pro as any).email?.trim().toLowerCase();
            if (email) {
                if (!proEmailMap.has(email)) {
                    proEmailMap.set(email, []);
                }
                proEmailMap.get(email)!.push(pro);
            }
        });

        proEmailMap.forEach((matches, email) => {
            if (matches.length > 1) {
                result.professionals.push({
                    type: 'professional',
                    matchType: 'email',
                    entities: matches.map(m => ({
                        id: m.id,
                        name: (m as any).fullName || 'Unknown',
                        matchValue: email,
                    })),
                    severity: 'medium',
                    status: 'pending',
                    detectedAt: new Date(),
                });
            }
        });

    } catch (error) {
        console.error('Error detecting duplicates:', error);
    }

    return result;
}

// Save detected duplicates to database
export async function saveDuplicateAlerts(groups: DuplicateGroup[]): Promise<number> {
    if (!db || groups.length === 0) return 0;

    let saved = 0;

    try {
        for (const group of groups) {
            // Check if similar alert already exists
            const existingQuery = query(
                collection(db, 'duplicateAlerts'),
                where('matchType', '==', group.matchType),
                where('status', '==', 'pending')
            );
            const existing = await getDocs(existingQuery);

            // Simple deduplication - check if same entities
            let alreadyExists = false;
            existing.forEach(doc => {
                const data = doc.data();
                const existingIds = data.entities?.map((e: any) => e.id).sort().join(',');
                const newIds = group.entities.map(e => e.id).sort().join(',');
                if (existingIds === newIds) {
                    alreadyExists = true;
                }
            });

            if (!alreadyExists) {
                await addDoc(collection(db, 'duplicateAlerts'), {
                    ...group,
                    detectedAt: Timestamp.now(),
                });
                saved++;
            }
        }
    } catch (error) {
        console.error('Error saving duplicate alerts:', error);
    }

    return saved;
}

// Get pending duplicate alerts
export async function getPendingDuplicateAlerts(): Promise<DuplicateGroup[]> {
    if (!db) return [];

    try {
        const alertsQuery = query(
            collection(db, 'duplicateAlerts'),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(alertsQuery);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            detectedAt: doc.data().detectedAt?.toDate() || new Date(),
        } as DuplicateGroup));
    } catch (error) {
        console.error('Error getting duplicate alerts:', error);
        return [];
    }
}

// Get duplicate alert statistics
export async function getDuplicateStats(): Promise<{
    pendingAlerts: number;
    resolvedAlerts: number;
    totalDuplicateAccounts: number;
}> {
    const stats = {
        pendingAlerts: 0,
        resolvedAlerts: 0,
        totalDuplicateAccounts: 0,
    };

    if (!db) return stats;

    try {
        const alertsSnapshot = await getDocs(collection(db, 'duplicateAlerts'));

        alertsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'pending') {
                stats.pendingAlerts++;
                stats.totalDuplicateAccounts += data.entities?.length || 0;
            } else if (data.status === 'resolved') {
                stats.resolvedAlerts++;
            }
        });
    } catch (error) {
        console.error('Error getting duplicate stats:', error);
    }

    return stats;
}
