import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "./clientApp";

// Promotion data model
export interface Promotion {
    id?: string;
    name: string;                    // e.g., "Welcome1000"
    creditAmount: number;            // e.g., 1000
    appliesTo: 'first_shift' | 'any_shift';
    expiryDays: number;              // Days after employer sign-up
    useLimitPerEmployer: number;     // Max uses per employer
    isActive: boolean;
    description?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Promotion usage tracking
export interface PromotionUsage {
    id?: string;
    promotionId: string;
    employerId: string;
    stintId: string;
    usedAt: Timestamp;
    creditApplied: number;
}

const PROMOTIONS_COLLECTION = "promotions";
const PROMOTION_USAGE_COLLECTION = "promotionUsage";

/**
 * Get all promotions
 */
export async function getAllPromotions(): Promise<Promotion[]> {
    const promotionsRef = collection(db, PROMOTIONS_COLLECTION);
    const q = query(promotionsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Promotion[];
}

/**
 * Get active promotions only
 */
export async function getActivePromotions(): Promise<Promotion[]> {
    const promotionsRef = collection(db, PROMOTIONS_COLLECTION);
    const q = query(
        promotionsRef,
        where("isActive", "==", true),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Promotion[];
}

/**
 * Get a single promotion by ID
 */
export async function getPromotionById(promotionId: string): Promise<Promotion | null> {
    const docRef = doc(db, PROMOTIONS_COLLECTION, promotionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Promotion;
    }
    return null;
}

/**
 * Create a new promotion
 */
export async function createPromotion(promotion: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const promotionsRef = collection(db, PROMOTIONS_COLLECTION);
    const docRef = await addDoc(promotionsRef, {
        ...promotion,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

/**
 * Update an existing promotion
 */
export async function updatePromotion(promotionId: string, updates: Partial<Promotion>): Promise<void> {
    const docRef = doc(db, PROMOTIONS_COLLECTION, promotionId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Delete a promotion
 */
export async function deletePromotion(promotionId: string): Promise<void> {
    const docRef = doc(db, PROMOTIONS_COLLECTION, promotionId);
    await deleteDoc(docRef);
}

/**
 * Check if employer has used a specific promotion
 */
export async function getEmployerPromoUsage(
    promotionId: string,
    employerId: string
): Promise<PromotionUsage[]> {
    const usageRef = collection(db, PROMOTION_USAGE_COLLECTION);
    const q = query(
        usageRef,
        where("promotionId", "==", promotionId),
        where("employerId", "==", employerId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as PromotionUsage[];
}

/**
 * Check if employer can use a promotion
 */
export async function canEmployerUsePromotion(
    promotionId: string,
    employerId: string,
    employerSignUpDate: Date
): Promise<{ canUse: boolean; reason?: string }> {
    const promotion = await getPromotionById(promotionId);

    if (!promotion) {
        return { canUse: false, reason: "Promotion not found" };
    }

    if (!promotion.isActive) {
        return { canUse: false, reason: "Promotion is no longer active" };
    }

    // Check expiry
    const expiryDate = new Date(employerSignUpDate);
    expiryDate.setDate(expiryDate.getDate() + promotion.expiryDays);
    if (new Date() > expiryDate) {
        return { canUse: false, reason: "Promotion has expired" };
    }

    // Check usage limit
    const usages = await getEmployerPromoUsage(promotionId, employerId);
    if (usages.length >= promotion.useLimitPerEmployer) {
        return { canUse: false, reason: "Usage limit reached" };
    }

    return { canUse: true };
}

/**
 * Record promotion usage
 */
export async function recordPromotionUsage(usage: Omit<PromotionUsage, 'id'>): Promise<string> {
    const usageRef = collection(db, PROMOTION_USAGE_COLLECTION);
    const docRef = await addDoc(usageRef, usage);
    return docRef.id;
}

/**
 * Seed the Welcome1000 promotion if it doesn't exist
 */
export async function seedWelcome1000Promotion(): Promise<void> {
    const promotionsRef = collection(db, PROMOTIONS_COLLECTION);
    const q = query(promotionsRef, where("name", "==", "Welcome1000"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        await createPromotion({
            name: "Welcome1000",
            creditAmount: 1000,
            appliesTo: "first_shift",
            expiryDays: 30,
            useLimitPerEmployer: 1,
            isActive: true,
            description: "Get KSh 1,000 off your first posted shift! Available for new employers for 30 days after sign-up.",
        });
        console.log("Welcome1000 promotion seeded successfully");
    }
}
