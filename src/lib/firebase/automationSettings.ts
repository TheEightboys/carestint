'use client';

import { db } from './clientApp';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

export interface AutomationSettings {
    riskScoring: boolean;
    settlementEngine: boolean;
    duplicateDetection: boolean;
    autoUnsuspension: boolean;
    updatedAt?: Date;
}

const DEFAULT_SETTINGS: AutomationSettings = {
    riskScoring: true,
    settlementEngine: true,
    duplicateDetection: true,
    autoUnsuspension: false, // Coming soon
};

const SETTINGS_DOC_ID = 'automation_modules';

/**
 * Get automation settings from Firestore
 */
export async function getAutomationSettings(): Promise<AutomationSettings> {
    if (!db) return DEFAULT_SETTINGS;

    try {
        const docRef = doc(db, 'platformConfig', SETTINGS_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                riskScoring: data.riskScoring ?? DEFAULT_SETTINGS.riskScoring,
                settlementEngine: data.settlementEngine ?? DEFAULT_SETTINGS.settlementEngine,
                duplicateDetection: data.duplicateDetection ?? DEFAULT_SETTINGS.duplicateDetection,
                autoUnsuspension: data.autoUnsuspension ?? DEFAULT_SETTINGS.autoUnsuspension,
                updatedAt: data.updatedAt?.toDate?.() || new Date(),
            };
        }

        // Create default settings if not exists
        await setDoc(docRef, {
            ...DEFAULT_SETTINGS,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        return DEFAULT_SETTINGS;
    } catch (error) {
        console.error('Error getting automation settings:', error);
        return DEFAULT_SETTINGS;
    }
}

/**
 * Update a single automation setting
 */
export async function updateAutomationSetting(
    key: keyof Omit<AutomationSettings, 'updatedAt'>,
    value: boolean
): Promise<boolean> {
    if (!db) return false;

    try {
        const docRef = doc(db, 'platformConfig', SETTINGS_DOC_ID);
        await setDoc(docRef, {
            [key]: value,
            updatedAt: Timestamp.now(),
        }, { merge: true });

        return true;
    } catch (error) {
        console.error('Error updating automation setting:', error);
        return false;
    }
}

/**
 * Update all automation settings at once
 */
export async function updateAllAutomationSettings(
    settings: Partial<Omit<AutomationSettings, 'updatedAt'>>
): Promise<boolean> {
    if (!db) return false;

    try {
        const docRef = doc(db, 'platformConfig', SETTINGS_DOC_ID);
        await setDoc(docRef, {
            ...settings,
            updatedAt: Timestamp.now(),
        }, { merge: true });

        return true;
    } catch (error) {
        console.error('Error updating automation settings:', error);
        return false;
    }
}
