import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

// Initialize Firebase for server-side
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getServerDb() {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return getFirestore(app);
}

/**
 * Seed promotional codes in Firestore
 * GET /api/seed-promos
 */
export async function GET() {
    try {
        const db = getServerDb();
        const promotionsRef = collection(db, 'promotions');
        const seeded: string[] = [];

        // Define promos to seed
        const promosToSeed = [
            {
                name: "Welcome1000",
                creditAmount: 1000,
                appliesTo: "first_shift",
                expiryDays: 30,
                useLimitPerEmployer: 1,
                isActive: true,
                description: "Get KSh 1,000 off your first posted shift!",
            },
            {
                name: "FIRST50",
                creditAmount: 500,
                appliesTo: "first_shift",
                expiryDays: 60,
                useLimitPerEmployer: 1,
                isActive: true,
                description: "KSh 500 off your first shift",
            },
            {
                name: "CARESTINT500",
                creditAmount: 500,
                appliesTo: "any_shift",
                expiryDays: 90,
                useLimitPerEmployer: 3,
                isActive: true,
                description: "KSh 500 off any shift (up to 3 times)",
            },
        ];

        for (const promo of promosToSeed) {
            // Check if exists
            const existingQuery = query(promotionsRef, where("name", "==", promo.name));
            const existingDocs = await getDocs(existingQuery);

            if (existingDocs.empty) {
                await addDoc(promotionsRef, {
                    ...promo,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                seeded.push(promo.name);
            }
        }

        return NextResponse.json({
            success: true,
            message: seeded.length > 0
                ? `✅ Seeded: ${seeded.join(', ')}`
                : '✓ All promo codes already exist',
            codes: [
                { code: 'Welcome1000', discount: 'KSh 1,000 off first shift' },
                { code: 'FIRST50', discount: 'KSh 500 off first shift' },
                { code: 'CARESTINT500', discount: 'KSh 500 off any shift (3 uses)' },
            ]
        });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json({
            error: 'Failed to seed promos',
            details: error?.message || 'Unknown error'
        }, { status: 500 });
    }
}
