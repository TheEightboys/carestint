/**
 * Flutterwave Payment Service for CareStint
 * 
 * Handles:
 * - M-Pesa STK Push payments
 * - Card payments (Visa/Mastercard)
 * - Payment verification
 * - Refunds
 * - Professional payouts (transfers)
 * 
 * Documentation: https://developer.flutterwave.com/docs
 */

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase/clientApp';
import type {
    PaymentIntent,
    PaymentIntentStatus,
    PayoutRecord,
    PayoutStatus,
    LedgerEntry,
    LedgerEntryType
} from './types';
import { createNotification, type NotificationType, type RecipientType } from './notification-service';

// ===== CONFIGURATION =====

const FLUTTERWAVE_CONFIG = {
    baseUrl: process.env.NEXT_PUBLIC_FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3',
    publicKey: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '',
    secretKey: process.env.FLUTTERWAVE_SECRET_KEY || '',
    encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY || '',
    webhookSecret: process.env.FLUTTERWAVE_WEBHOOK_SECRET || '',
    // Payment settings
    paymentExpiryMinutes: 15,
    payoutDelayHours: 24,
    // Fee configuration
    platformFeePercent: 0.15, // 15% platform fee
    mpesaTransferFee: 30,     // KES 30 per M-Pesa transfer
    bankTransferFee: 50,      // KES 50 per bank transfer
};

// ===== TYPES =====

interface FlutterwaveResponse<T = any> {
    status: 'success' | 'error';
    message: string;
    data?: T;
}

interface MpesaChargeRequest {
    tx_ref: string;
    amount: number;
    currency: string;
    phone_number: string;
    email: string;
    fullname?: string;
    meta?: Record<string, any>;
}

interface CardChargeRequest {
    tx_ref: string;
    amount: number;
    currency: string;
    email: string;
    fullname?: string;
    redirect_url: string;
    meta?: Record<string, any>;
}

interface TransferRequest {
    account_bank: string;
    account_number: string;
    amount: number;
    currency: string;
    narration: string;
    reference: string;
    beneficiary_name?: string;
    meta?: Record<string, any>;
}

// ===== HELPER FUNCTIONS =====

/**
 * Generate unique transaction reference
 */
function generateTxRef(prefix: string = 'CS'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Make authenticated request to Flutterwave API
 */
async function flutterwaveRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: any
): Promise<FlutterwaveResponse<T>> {
    try {
        const response = await fetch(`${FLUTTERWAVE_CONFIG.baseUrl}${endpoint}`, {
            method,
            headers: {
                'Authorization': `Bearer ${FLUTTERWAVE_CONFIG.secretKey}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Flutterwave API error:', error);
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'API request failed',
        };
    }
}

/**
 * Calculate platform fees
 * 
 * According to PRD:
 * - employer_fee = shift_amount * (urgent ? 0.20 : 0.15)
 * - employer_total = shift_amount + employer_fee
 * - professional_fee = shift_amount * 0.05
 * - professional_payout = shift_amount - professional_fee
 * - platform_revenue = employer_fee + professional_fee
 */
export function calculateFees(amount: number, currency: string = 'KES', isUrgent: boolean = false) {
    // Use 20% for urgent, 15% for normal
    const bookingFeePercent = isUrgent ? 0.20 : 0.15;
    const professionalFeePercent = 0.05;

    // Employer pays: shift amount + booking fee
    const bookingFee = Math.round(amount * bookingFeePercent);
    const totalAmount = amount + bookingFee;

    // Professional receives: shift amount - 5% fee
    const professionalFee = Math.round(amount * professionalFeePercent);
    const professionalPayout = amount - professionalFee;

    // Platform revenue = booking fee + professional fee
    const platformRevenue = bookingFee + professionalFee;

    return {
        // What employer pays
        shiftAmount: amount,
        bookingFee,
        totalAmount,  // This is what employer pays

        // What professional receives
        professionalFee,
        professionalPayout,  // This is what professional gets

        // Platform revenue
        platformFee: bookingFee,  // For backward compatibility
        platformRevenue,

        processingFee: 0,  // Absorbed by platform
        currency,
    };
}


// ===== PAYMENT INTENT FUNCTIONS =====

/**
 * Create a new payment intent when employer accepts a professional
 */
export async function createPaymentIntent(params: {
    stintId: string;
    applicationId: string;
    employerId: string;
    professionalId: string;
    professionalName: string;
    amount: number;
    currency: string;
}): Promise<PaymentIntent> {
    const fees = calculateFees(params.amount, params.currency);
    const expiresAt = new Date(Date.now() + FLUTTERWAVE_CONFIG.paymentExpiryMinutes * 60 * 1000);

    const paymentIntent: Omit<PaymentIntent, 'id'> = {
        stintId: params.stintId,
        applicationId: params.applicationId,
        employerId: params.employerId,
        professionalId: params.professionalId,
        professionalName: params.professionalName,
        amount: fees.totalAmount,
        currency: params.currency,
        offeredRate: params.amount,
        platformFee: fees.platformFee,
        processingFee: fees.processingFee,
        paymentMethod: 'mpesa', // Default, will be updated
        status: 'initiated',
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt,
    };

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'paymentIntents'), {
        ...paymentIntent,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
    });

    // Update stint status to payment_required
    await updateDoc(doc(db, 'stints', params.stintId), {
        status: 'payment_required',
        pendingPaymentIntentId: docRef.id,
        selectedProfessionalId: params.professionalId,
        selectedProfessionalName: params.professionalName,
        updatedAt: serverTimestamp(),
    });

    return { ...paymentIntent, id: docRef.id };
}

/**
 * Get payment intent by ID
 */
export async function getPaymentIntent(id: string): Promise<PaymentIntent | null> {
    const docSnap = await getDoc(doc(db, 'paymentIntents', id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as PaymentIntent;
}

/**
 * Get payment intent by stint ID
 */
export async function getPaymentIntentByStint(stintId: string): Promise<PaymentIntent | null> {
    const q = query(
        collection(db, 'paymentIntents'),
        where('stintId', '==', stintId),
        where('status', 'in', ['initiated', 'pending'])
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as PaymentIntent;
}

/**
 * Update payment intent status
 */
export async function updatePaymentIntentStatus(
    id: string,
    status: PaymentIntentStatus,
    additionalData?: Partial<PaymentIntent>
): Promise<void> {
    await updateDoc(doc(db, 'paymentIntents', id), {
        status,
        ...additionalData,
        updatedAt: serverTimestamp(),
    });
}

// ===== M-PESA STK PUSH =====

/**
 * Initiate M-Pesa STK Push payment
 */
export async function initiateMpesaPayment(
    paymentIntentId: string,
    phoneNumber: string,
    email: string,
    fullname?: string
): Promise<{ success: boolean; message: string; flutterwaveRef?: string }> {
    const paymentIntent = await getPaymentIntent(paymentIntentId);
    if (!paymentIntent) {
        return { success: false, message: 'Payment intent not found' };
    }

    if (paymentIntent.status !== 'initiated' && paymentIntent.status !== 'failed') {
        return { success: false, message: 'Payment already in progress or completed' };
    }

    // Check if expired
    if (new Date() > paymentIntent.expiresAt) {
        await updatePaymentIntentStatus(paymentIntentId, 'expired');
        return { success: false, message: 'Payment session expired. Please try again.' };
    }

    const txRef = generateTxRef('MPESA');

    // Update payment intent with method and pending status
    await updatePaymentIntentStatus(paymentIntentId, 'pending', {
        paymentMethod: 'mpesa',
        phoneNumber,
        flutterwaveRef: txRef,
    });

    // Call Flutterwave M-Pesa API
    const chargeRequest: MpesaChargeRequest = {
        tx_ref: txRef,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        phone_number: phoneNumber,
        email,
        fullname,
        meta: {
            paymentIntentId,
            stintId: paymentIntent.stintId,
            professionalId: paymentIntent.professionalId,
        },
    };

    const response = await flutterwaveRequest<any>('/charges?type=mpesa', 'POST', chargeRequest);

    if (response.status === 'success') {
        return {
            success: true,
            message: 'STK Push sent. Please enter your M-Pesa PIN.',
            flutterwaveRef: txRef,
        };
    } else {
        await updatePaymentIntentStatus(paymentIntentId, 'failed', {
            failureReason: response.message,
            failedAt: new Date(),
            retryCount: paymentIntent.retryCount + 1,
        });
        return {
            success: false,
            message: response.message || 'Failed to initiate M-Pesa payment',
        };
    }
}

// ===== CARD PAYMENT =====

/**
 * Initialize card payment (redirect flow)
 */
export async function initiateCardPayment(
    paymentIntentId: string,
    email: string,
    redirectUrl: string,
    fullname?: string
): Promise<{ success: boolean; message: string; paymentLink?: string }> {
    const paymentIntent = await getPaymentIntent(paymentIntentId);
    if (!paymentIntent) {
        return { success: false, message: 'Payment intent not found' };
    }

    if (paymentIntent.status !== 'initiated' && paymentIntent.status !== 'failed') {
        return { success: false, message: 'Payment already in progress or completed' };
    }

    // Check if expired
    if (new Date() > paymentIntent.expiresAt) {
        await updatePaymentIntentStatus(paymentIntentId, 'expired');
        return { success: false, message: 'Payment session expired. Please try again.' };
    }

    const txRef = generateTxRef('CARD');

    // Update payment intent
    await updatePaymentIntentStatus(paymentIntentId, 'pending', {
        paymentMethod: 'card',
        flutterwaveRef: txRef,
    });

    // Create standard payment link
    const paymentData = {
        tx_ref: txRef,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        redirect_url: redirectUrl,
        payment_options: 'card',
        customer: {
            email,
            name: fullname,
        },
        meta: {
            paymentIntentId,
            stintId: paymentIntent.stintId,
            professionalId: paymentIntent.professionalId,
        },
        customizations: {
            title: 'CareStint Shift Payment',
            description: `Payment for shift with ${paymentIntent.professionalName}`,
            logo: 'https://carestint.com/logo.png',
        },
    };

    const response = await flutterwaveRequest<{ link: string }>('/payments', 'POST', paymentData);

    if (response.status === 'success' && response.data?.link) {
        return {
            success: true,
            message: 'Redirecting to payment page...',
            paymentLink: response.data.link,
        };
    } else {
        await updatePaymentIntentStatus(paymentIntentId, 'failed', {
            failureReason: response.message,
            failedAt: new Date(),
            retryCount: paymentIntent.retryCount + 1,
        });
        return {
            success: false,
            message: response.message || 'Failed to create payment link',
        };
    }
}

// ===== PAYMENT VERIFICATION =====

/**
 * Verify payment status from Flutterwave
 */
export async function verifyPayment(
    flutterwaveRef: string
): Promise<{ success: boolean; status: string; data?: any }> {
    const response = await flutterwaveRequest<any>(
        `/transactions/verify_by_reference?tx_ref=${flutterwaveRef}`,
        'GET'
    );

    if (response.status === 'success' && response.data) {
        return {
            success: true,
            status: response.data.status,
            data: response.data,
        };
    }

    return {
        success: false,
        status: 'unknown',
    };
}

// ===== WEBHOOK HANDLER =====

/**
 * Process Flutterwave webhook callback
 */
export async function processWebhook(payload: any): Promise<{ success: boolean; message: string }> {
    try {
        const { event, data } = payload;

        // Extract payment intent ID from meta
        const paymentIntentId = data?.meta?.paymentIntentId;
        if (!paymentIntentId) {
            return { success: false, message: 'Missing paymentIntentId in webhook' };
        }

        const paymentIntent = await getPaymentIntent(paymentIntentId);
        if (!paymentIntent) {
            return { success: false, message: 'Payment intent not found' };
        }

        if (event === 'charge.completed') {
            if (data.status === 'successful') {
                // Payment successful
                await handlePaymentSuccess(paymentIntent, data);
                return { success: true, message: 'Payment confirmed' };
            } else {
                // Payment failed
                await updatePaymentIntentStatus(paymentIntentId, 'failed', {
                    failureReason: data.processor_response || 'Payment failed',
                    failedAt: new Date(),
                });
                return { success: true, message: 'Payment failed recorded' };
            }
        }

        return { success: true, message: 'Webhook processed' };
    } catch (error) {
        console.error('Webhook processing error:', error);
        return { success: false, message: 'Webhook processing failed' };
    }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent: PaymentIntent, flutterwaveData: any): Promise<void> {
    // Update payment intent
    await updatePaymentIntentStatus(paymentIntent.id, 'success', {
        flutterwaveTxId: flutterwaveData.id,
        completedAt: new Date(),
        cardLast4: flutterwaveData.card?.last_4digits,
        cardBrand: flutterwaveData.card?.issuer,
    });

    // Confirm the stint
    await updateDoc(doc(db, 'stints', paymentIntent.stintId), {
        status: 'confirmed',
        acceptedProfessionalId: paymentIntent.professionalId,
        acceptedProfessionalName: paymentIntent.professionalName,
        acceptedAt: serverTimestamp(),
        confirmedAt: serverTimestamp(),
        paymentIntentId: paymentIntent.id,
        updatedAt: serverTimestamp(),
    });

    // Update application status
    await updateDoc(doc(db, 'stintApplications', paymentIntent.applicationId), {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // Create ledger entries
    await createLedgerEntry({
        stintId: paymentIntent.stintId,
        paymentIntentId: paymentIntent.id,
        type: 'payment_received',
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        description: `Payment received from employer for shift`,
        actorType: 'system',
    });

    await createLedgerEntry({
        stintId: paymentIntent.stintId,
        paymentIntentId: paymentIntent.id,
        type: 'platform_fee_earned',
        amount: paymentIntent.platformFee,
        currency: paymentIntent.currency,
        description: `Platform fee earned (${FLUTTERWAVE_CONFIG.platformFeePercent * 100}%)`,
        actorType: 'system',
    });

    await createLedgerEntry({
        stintId: paymentIntent.stintId,
        paymentIntentId: paymentIntent.id,
        type: 'professional_payout_held',
        amount: paymentIntent.offeredRate - paymentIntent.platformFee,
        currency: paymentIntent.currency,
        description: `Professional payout held pending shift completion`,
        actorType: 'system',
    });

    // Generate receipt
    await generatePaymentReceipt(paymentIntent);

    // Send notifications
    await sendPaymentNotifications(paymentIntent, 'success');
}

// ===== REFUNDS =====

/**
 * Issue full refund
 */
export async function issueRefund(
    paymentIntentId: string,
    reason: string
): Promise<{ success: boolean; message: string }> {
    const paymentIntent = await getPaymentIntent(paymentIntentId);
    if (!paymentIntent) {
        return { success: false, message: 'Payment intent not found' };
    }

    if (paymentIntent.status !== 'success') {
        return { success: false, message: 'Can only refund successful payments' };
    }

    if (!paymentIntent.flutterwaveTxId) {
        return { success: false, message: 'Missing Flutterwave transaction ID' };
    }

    const response = await flutterwaveRequest<any>(
        `/transactions/${paymentIntent.flutterwaveTxId}/refund`,
        'POST',
        { amount: paymentIntent.amount }
    );

    if (response.status === 'success') {
        await updatePaymentIntentStatus(paymentIntentId, 'refunded', {
            refundedAmount: paymentIntent.amount,
            refundReason: reason,
            refundRef: response.data?.id?.toString(),
            refundedAt: new Date(),
        });

        // Update stint status
        await updateDoc(doc(db, 'stints', paymentIntent.stintId), {
            status: 'cancelled',
            cancellationReason: reason,
            cancelledAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // Create ledger entry
        await createLedgerEntry({
            stintId: paymentIntent.stintId,
            paymentIntentId: paymentIntent.id,
            type: 'refund_issued',
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            description: `Full refund issued: ${reason}`,
            actorType: 'system',
        });

        return { success: true, message: 'Refund processed successfully' };
    }

    return { success: false, message: response.message || 'Refund failed' };
}

// ===== PAYOUTS =====

/**
 * Create payout record when shift is completed
 */
export async function createPayoutRecord(params: {
    stintId: string;
    paymentIntentId: string;
    professionalId: string;
    professionalName: string;
    employerId: string;
    grossAmount: number;
    platformFee: number;
    currency: string;
    payoutMethod: 'mpesa' | 'bank';
    accountNumber: string;
    bankCode?: string;
    bankName?: string;
    shiftCompletedAt: Date;
}): Promise<PayoutRecord> {
    const eligibleAt = new Date(params.shiftCompletedAt.getTime() + FLUTTERWAVE_CONFIG.payoutDelayHours * 60 * 60 * 1000);
    const transferFee = params.payoutMethod === 'mpesa'
        ? FLUTTERWAVE_CONFIG.mpesaTransferFee
        : FLUTTERWAVE_CONFIG.bankTransferFee;
    const netAmount = params.grossAmount - params.platformFee - transferFee;

    const payoutRecord: Omit<PayoutRecord, 'id'> = {
        stintId: params.stintId,
        paymentIntentId: params.paymentIntentId,
        professionalId: params.professionalId,
        professionalName: params.professionalName,
        employerId: params.employerId,
        grossAmount: params.grossAmount,
        platformFee: params.platformFee,
        transferFee,
        netAmount,
        currency: params.currency,
        payoutMethod: params.payoutMethod,
        accountNumber: params.accountNumber,
        bankCode: params.bankCode,
        bankName: params.bankName,
        status: 'scheduled',
        retryCount: 0,
        shiftCompletedAt: params.shiftCompletedAt,
        eligibleAt,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'payoutRecords'), {
        ...payoutRecord,
        shiftCompletedAt: Timestamp.fromDate(params.shiftCompletedAt),
        eligibleAt: Timestamp.fromDate(eligibleAt),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return { ...payoutRecord, id: docRef.id };
}

/**
 * Process eligible payouts (called by cron job)
 */
export async function processEligiblePayouts(): Promise<{ processed: number; failed: number }> {
    const now = new Date();
    let processed = 0;
    let failed = 0;

    // Get all scheduled payouts that are now eligible
    const q = query(
        collection(db, 'payoutRecords'),
        where('status', '==', 'scheduled'),
        where('eligibleAt', '<=', Timestamp.fromDate(now))
    );

    const snapshot = await getDocs(q);

    for (const payoutDoc of snapshot.docs) {
        const payout = { id: payoutDoc.id, ...payoutDoc.data() } as PayoutRecord;

        // Check for disputes or no-shows
        const stintDoc = await getDoc(doc(db, 'stints', payout.stintId));
        const stint = stintDoc.data();

        if (stint?.status === 'disputed' || stint?.status === 'no_show') {
            // Hold payout
            await updateDoc(doc(db, 'payoutRecords', payout.id), {
                status: 'held',
                updatedAt: serverTimestamp(),
            });
            continue;
        }

        // Process payout
        const result = await processIndividualPayout(payout);
        if (result.success) {
            processed++;
        } else {
            failed++;
        }
    }

    return { processed, failed };
}

/**
 * Process individual payout via Flutterwave Transfer
 */
async function processIndividualPayout(payout: PayoutRecord): Promise<{ success: boolean; message: string }> {
    // Update status to processing
    await updateDoc(doc(db, 'payoutRecords', payout.id), {
        status: 'processing',
        updatedAt: serverTimestamp(),
    });

    const reference = generateTxRef('PAYOUT');
    const bankCode = payout.payoutMethod === 'mpesa' ? 'MPS' : payout.bankCode || '';

    const transferRequest: TransferRequest = {
        account_bank: bankCode,
        account_number: payout.accountNumber,
        amount: payout.netAmount,
        currency: payout.currency,
        narration: `CareStint payout for shift ${payout.stintId}`,
        reference,
        beneficiary_name: payout.professionalName,
        meta: {
            payoutRecordId: payout.id,
            stintId: payout.stintId,
        },
    };

    const response = await flutterwaveRequest<any>('/transfers', 'POST', transferRequest);

    if (response.status === 'success') {
        await updateDoc(doc(db, 'payoutRecords', payout.id), {
            status: 'completed',
            flutterwaveTransferId: response.data?.id,
            flutterwaveRef: reference,
            processedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // Update stint status
        await updateDoc(doc(db, 'stints', payout.stintId), {
            status: 'paid_out',
            paidOutAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // Create ledger entry
        await createLedgerEntry({
            stintId: payout.stintId,
            payoutRecordId: payout.id,
            type: 'professional_payout_sent',
            amount: payout.netAmount,
            currency: payout.currency,
            description: `Payout sent to ${payout.professionalName} via ${payout.payoutMethod}`,
            actorType: 'system',
        });

        return { success: true, message: 'Payout completed' };
    } else {
        await updateDoc(doc(db, 'payoutRecords', payout.id), {
            status: 'failed',
            failureReason: response.message,
            retryCount: payout.retryCount + 1,
            updatedAt: serverTimestamp(),
        });

        return { success: false, message: response.message || 'Transfer failed' };
    }
}

/**
 * Retry failed payout
 */
export async function retryPayout(payoutId: string): Promise<{ success: boolean; message: string }> {
    const payoutDoc = await getDoc(doc(db, 'payoutRecords', payoutId));
    if (!payoutDoc.exists()) {
        return { success: false, message: 'Payout not found' };
    }

    const payout = { id: payoutDoc.id, ...payoutDoc.data() } as PayoutRecord;
    if (payout.status !== 'failed') {
        return { success: false, message: 'Can only retry failed payouts' };
    }

    return processIndividualPayout(payout);
}

// ===== LEDGER =====

/**
 * Create ledger entry
 */
async function createLedgerEntry(params: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<LedgerEntry> {
    const docRef = await addDoc(collection(db, 'ledgerEntries'), {
        ...params,
        createdAt: serverTimestamp(),
    });

    return { ...params, id: docRef.id, createdAt: new Date() };
}

/**
 * Get ledger entries for a stint
 */
export async function getLedgerEntriesByStint(stintId: string): Promise<LedgerEntry[]> {
    const q = query(collection(db, 'ledgerEntries'), where('stintId', '==', stintId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as LedgerEntry);
}

// ===== CANCEL PAYMENT =====

/**
 * Cancel pending payment intent (before completion)
 */
export async function cancelPaymentIntent(
    paymentIntentId: string
): Promise<{ success: boolean; message: string }> {
    const paymentIntent = await getPaymentIntent(paymentIntentId);
    if (!paymentIntent) {
        return { success: false, message: 'Payment intent not found' };
    }

    if (!['initiated', 'pending'].includes(paymentIntent.status)) {
        return { success: false, message: 'Cannot cancel - payment already processed' };
    }

    await updatePaymentIntentStatus(paymentIntentId, 'cancelled');

    // Revert stint to open
    await updateDoc(doc(db, 'stints', paymentIntent.stintId), {
        status: 'open',
        pendingPaymentIntentId: null,
        selectedProfessionalId: null,
        selectedProfessionalName: null,
        updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Payment cancelled' };
}

// ===== EXPIRY CHECK =====

/**
 * Expire stale payment intents (called by cron)
 */
export async function expireStalePaymentIntents(): Promise<number> {
    const now = new Date();
    let expired = 0;

    const q = query(
        collection(db, 'paymentIntents'),
        where('status', 'in', ['initiated', 'pending']),
        where('expiresAt', '<', Timestamp.fromDate(now))
    );

    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
        await cancelPaymentIntent(docSnap.id);
        // Notify professional that they were not confirmed
        const intent = docSnap.data() as PaymentIntent;
        await sendPaymentNotifications({ ...intent, id: docSnap.id } as PaymentIntent, 'expired');
        expired++;
    }

    return expired;
}

// ===== RECEIPT GENERATION =====

/**
 * Generate and store payment receipt
 */
async function generatePaymentReceipt(paymentIntent: PaymentIntent): Promise<string> {
    const receiptId = `RCP-${Date.now()}-${paymentIntent.id.slice(0, 6).toUpperCase()}`;

    const receipt = {
        id: receiptId,
        paymentIntentId: paymentIntent.id,
        stintId: paymentIntent.stintId,
        employerId: paymentIntent.employerId,
        professionalId: paymentIntent.professionalId,
        professionalName: paymentIntent.professionalName,
        // Amount details
        totalAmount: paymentIntent.amount,
        platformFee: paymentIntent.platformFee,
        professionalPayout: paymentIntent.offeredRate - paymentIntent.platformFee,
        currency: paymentIntent.currency,
        // Payment details
        paymentMethod: paymentIntent.paymentMethod,
        transactionRef: paymentIntent.flutterwaveRef,
        // Status
        status: 'paid',
        // Timestamps
        paidAt: new Date(),
        createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'receipts'), receipt);

    // Update payment intent with receipt ID
    await updateDoc(doc(db, 'paymentIntents', paymentIntent.id), {
        receiptId,
    });

    return receiptId;
}

// ===== NOTIFICATIONS =====

/**
 * Send payment notifications to employer and professional
 */
async function sendPaymentNotifications(
    paymentIntent: PaymentIntent,
    outcome: 'success' | 'failed' | 'expired'
): Promise<void> {
    try {
        // Get stint details for notification context
        const stintDoc = await getDoc(doc(db, 'stints', paymentIntent.stintId));
        const stint = stintDoc.data();

        if (outcome === 'success') {
            // Notify employer - "Payment successful. Your shift is confirmed."
            await addDoc(collection(db, 'notifications'), {
                recipientId: paymentIntent.employerId,
                recipientType: 'employer',
                type: 'payment_success',
                title: 'Payment Successful! ✅',
                message: `Payment of ${paymentIntent.currency} ${paymentIntent.amount.toLocaleString()} successful. ${paymentIntent.professionalName} is confirmed for your shift.`,
                metadata: {
                    paymentIntentId: paymentIntent.id,
                    stintId: paymentIntent.stintId,
                    amount: paymentIntent.amount,
                },
                channels: ['in_app', 'email'],
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            // Notify professional - "Confirmed! You're booked for {date/time}."
            await addDoc(collection(db, 'notifications'), {
                recipientId: paymentIntent.professionalId,
                recipientType: 'professional',
                type: 'shift_confirmed',
                title: 'Confirmed! You\'re Booked 🎉',
                message: `Great news! You're confirmed for ${stint?.role?.replace('-', ' ')} at ${stint?.city} on ${stint?.shiftDate ? new Date(stint.shiftDate.toDate ? stint.shiftDate.toDate() : stint.shiftDate).toLocaleDateString() : 'upcoming date'}. Report time: ${stint?.startTime}.`,
                metadata: {
                    paymentIntentId: paymentIntent.id,
                    stintId: paymentIntent.stintId,
                    role: stint?.role,
                    shiftDate: stint?.shiftDate,
                },
                channels: ['in_app', 'sms'],
                status: 'pending',
                createdAt: serverTimestamp(),
            });
        } else if (outcome === 'failed') {
            // Notify employer - "Payment failed. Please try again."
            await addDoc(collection(db, 'notifications'), {
                recipientId: paymentIntent.employerId,
                recipientType: 'employer',
                type: 'payment_failed',
                title: 'Payment Failed',
                message: `Payment of ${paymentIntent.currency} ${paymentIntent.amount.toLocaleString()} failed. ${paymentIntent.failureReason || 'Please try again.'}`,
                metadata: {
                    paymentIntentId: paymentIntent.id,
                    stintId: paymentIntent.stintId,
                    failureReason: paymentIntent.failureReason,
                },
                channels: ['in_app'],
                status: 'pending',
                createdAt: serverTimestamp(),
            });
        } else if (outcome === 'expired') {
            // Notify professional - selection expired
            await addDoc(collection(db, 'notifications'), {
                recipientId: paymentIntent.professionalId,
                recipientType: 'professional',
                type: 'selection_expired',
                title: 'Selection Expired',
                message: `The employer's payment for ${stint?.role?.replace('-', ' ')} shift expired. The shift is now open for other applicants.`,
                metadata: {
                    stintId: paymentIntent.stintId,
                },
                channels: ['in_app'],
                status: 'pending',
                createdAt: serverTimestamp(),
            });
        }
    } catch (error) {
        console.error('Error sending payment notifications:', error);
    }
}

// ===== EMPLOYER CANCELLATION WITH 24-HOUR REFUND RULE =====

/**
 * Handle employer cancellation with time-based refund logic
 * Per PRD: >= 24 hours before shift = full refund, < 24 hours = no refund
 */
export async function handleEmployerCancellation(
    stintId: string,
    reason: string
): Promise<{ success: boolean; message: string; refundAmount?: number }> {
    const stintDoc = await getDoc(doc(db, 'stints', stintId));
    if (!stintDoc.exists()) {
        return { success: false, message: 'Stint not found' };
    }

    const stint = stintDoc.data();

    if (stint.status !== 'confirmed') {
        return { success: false, message: 'Can only cancel confirmed shifts' };
    }

    // Get payment intent
    const paymentIntentId = stint.paymentIntentId;
    if (!paymentIntentId) {
        return { success: false, message: 'No payment found for this shift' };
    }

    const paymentIntent = await getPaymentIntent(paymentIntentId);
    if (!paymentIntent || paymentIntent.status !== 'success') {
        return { success: false, message: 'Payment not found or not successful' };
    }

    // Calculate time until shift
    const shiftDate = stint.shiftDate?.toDate ? stint.shiftDate.toDate() : new Date(stint.shiftDate);
    const hoursUntilShift = (shiftDate.getTime() - Date.now()) / (1000 * 60 * 60);

    let refundAmount = 0;
    let refundType: 'full' | 'none' = 'none';

    // 24-hour refund policy
    if (hoursUntilShift >= 24) {
        refundAmount = paymentIntent.amount;
        refundType = 'full';
    } else {
        // Less than 24 hours - no refund per MVP policy
        refundAmount = 0;
        refundType = 'none';
    }

    // Update stint status
    await updateDoc(doc(db, 'stints', stintId), {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: serverTimestamp(),
        cancelledBy: 'employer',
        refundAmount,
        refundType,
        updatedAt: serverTimestamp(),
    });

    // Process refund if applicable
    if (refundAmount > 0 && paymentIntent.flutterwaveTxId) {
        const refundResult = await flutterwaveRequest<any>(
            `/transactions/${paymentIntent.flutterwaveTxId}/refund`,
            'POST',
            { amount: refundAmount }
        );

        if (refundResult.status === 'success') {
            await updatePaymentIntentStatus(paymentIntentId, 'refunded', {
                refundedAmount: refundAmount,
                refundReason: reason,
                refundRef: refundResult.data?.id?.toString(),
                refundedAt: new Date(),
            });

            // Ledger entry for refund
            await createLedgerEntry({
                stintId,
                paymentIntentId,
                type: 'refund_issued',
                amount: refundAmount,
                currency: paymentIntent.currency,
                description: `Full refund issued: Cancelled ${hoursUntilShift.toFixed(0)} hours before shift`,
                actorType: 'employer',
                actorId: paymentIntent.employerId,
            });
        }
    } else if (refundAmount === 0) {
        // No refund - create ledger entry noting cancellation without refund
        await createLedgerEntry({
            stintId,
            paymentIntentId,
            type: 'cancellation_fee',
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            description: `Cancellation within 24 hours - no refund per policy`,
            actorType: 'employer',
            actorId: paymentIntent.employerId,
        });
    }

    // Notify professional about cancellation
    await addDoc(collection(db, 'notifications'), {
        recipientId: paymentIntent.professionalId,
        recipientType: 'professional',
        type: 'shift_cancelled',
        title: 'Shift Cancelled',
        message: `The ${stint.role?.replace('-', ' ')} shift on ${shiftDate.toLocaleDateString()} has been cancelled by the employer.`,
        metadata: { stintId },
        channels: ['in_app', 'sms'],
        status: 'pending',
        createdAt: serverTimestamp(),
    });

    const message = refundAmount > 0
        ? `Shift cancelled. Full refund of ${paymentIntent.currency} ${refundAmount.toLocaleString()} processing.`
        : `Shift cancelled. No refund issued (cancelled less than 24 hours before shift).`;

    return { success: true, message, refundAmount };
}

// ===== NO-SHOW HANDLING =====

/**
 * Handle professional no-show reported by employer
 * Per PRD: Refund employer, block payout, impact reliability score
 */
export async function handleNoShow(
    stintId: string,
    reportedBy: string
): Promise<{ success: boolean; message: string }> {
    const stintDoc = await getDoc(doc(db, 'stints', stintId));
    if (!stintDoc.exists()) {
        return { success: false, message: 'Stint not found' };
    }

    const stint = stintDoc.data();

    if (!['confirmed', 'in_progress'].includes(stint.status)) {
        return { success: false, message: 'Can only report no-show for confirmed or in-progress shifts' };
    }

    // Get payment intent
    const paymentIntentId = stint.paymentIntentId;
    const paymentIntent = paymentIntentId ? await getPaymentIntent(paymentIntentId) : null;

    // Update stint status to no_show
    await updateDoc(doc(db, 'stints', stintId), {
        status: 'no_show',
        noShowReportedAt: serverTimestamp(),
        noShowReportedBy: reportedBy,
        updatedAt: serverTimestamp(),
    });

    // Block any scheduled payout
    const payoutsQuery = query(
        collection(db, 'payoutRecords'),
        where('stintId', '==', stintId),
        where('status', 'in', ['scheduled', 'ready_for_settlement'])
    );
    const payoutsSnapshot = await getDocs(payoutsQuery);
    for (const payoutDoc of payoutsSnapshot.docs) {
        await updateDoc(doc(db, 'payoutRecords', payoutDoc.id), {
            status: 'held',
            holdReason: 'No-show reported',
            updatedAt: serverTimestamp(),
        });
    }

    // Create dispute record for audit
    await addDoc(collection(db, 'disputes'), {
        stintId,
        type: 'no_show',
        status: 'open',
        reportedBy,
        reportedAt: serverTimestamp(),
        professionalId: stint.acceptedProfessionalId,
        employerId: stint.employerId,
        createdAt: serverTimestamp(),
    });

    // Issue refund to employer
    if (paymentIntent && paymentIntent.status === 'success' && paymentIntent.flutterwaveTxId) {
        const refundResult = await flutterwaveRequest<any>(
            `/transactions/${paymentIntent.flutterwaveTxId}/refund`,
            'POST',
            { amount: paymentIntent.amount }
        );

        if (refundResult.status === 'success') {
            await updatePaymentIntentStatus(paymentIntentId!, 'refunded', {
                refundedAmount: paymentIntent.amount,
                refundReason: 'Professional no-show',
                refundRef: refundResult.data?.id?.toString(),
                refundedAt: new Date(),
            });

            // Ledger entry
            await createLedgerEntry({
                stintId,
                paymentIntentId: paymentIntentId!,
                type: 'no_show_refund',
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                description: 'Full refund issued due to professional no-show',
                actorType: 'system',
            });
        }
    }

    // Notify parties
    if (stint.acceptedProfessionalId) {
        await addDoc(collection(db, 'notifications'), {
            recipientId: stint.acceptedProfessionalId,
            recipientType: 'professional',
            type: 'no_show_reported',
            title: 'No-Show Reported ⚠️',
            message: 'A no-show has been reported for your scheduled shift. This impacts your reliability score. Contact support if you believe this is an error.',
            metadata: { stintId },
            channels: ['in_app', 'sms'],
            status: 'pending',
            createdAt: serverTimestamp(),
        });
    }

    // TODO: Impact professional reliability score
    // await updateProfessionalReliabilityScore(stint.acceptedProfessionalId, 'no_show');

    return { success: true, message: 'No-show reported. Employer refund processing. Dispute created for audit.' };
}

// ===== SHIFT COMPLETION PAYOUT SCHEDULING =====

/**
 * Schedule payout when shift is marked as completed
 * Called when professional clocks out or employer confirms hours
 */
export async function schedulePayoutOnCompletion(stintId: string): Promise<{ success: boolean; message: string }> {
    const stintDoc = await getDoc(doc(db, 'stints', stintId));
    if (!stintDoc.exists()) {
        return { success: false, message: 'Stint not found' };
    }

    const stint = stintDoc.data();

    if (stint.status !== 'completed') {
        return { success: false, message: 'Stint must be completed to schedule payout' };
    }

    // Get payment intent
    const paymentIntentId = stint.paymentIntentId;
    if (!paymentIntentId) {
        return { success: false, message: 'No payment found for this shift' };
    }

    const paymentIntent = await getPaymentIntent(paymentIntentId);
    if (!paymentIntent || paymentIntent.status !== 'success') {
        return { success: false, message: 'Payment not found or not successful' };
    }

    // Get professional details for payout method
    const professionalDoc = await getDoc(doc(db, 'professionals', stint.acceptedProfessionalId));
    if (!professionalDoc.exists()) {
        return { success: false, message: 'Professional not found' };
    }

    const professional = professionalDoc.data();
    const payoutMethod = professional.payoutMethod || 'mpesa';
    const accountNumber = payoutMethod === 'mpesa'
        ? professional.mpesaNumber || professional.phone
        : professional.bankAccountNumber;

    if (!accountNumber) {
        return { success: false, message: 'Professional payout details not configured' };
    }

    const shiftCompletedAt = stint.completedAt?.toDate
        ? stint.completedAt.toDate()
        : new Date(stint.completedAt || Date.now());

    // Create payout record
    await createPayoutRecord({
        stintId,
        paymentIntentId,
        professionalId: stint.acceptedProfessionalId,
        professionalName: stint.acceptedProfessionalName,
        employerId: stint.employerId,
        grossAmount: paymentIntent.offeredRate,
        platformFee: paymentIntent.platformFee,
        currency: paymentIntent.currency,
        payoutMethod,
        accountNumber,
        bankCode: professional.bankCode,
        bankName: professional.bankName,
        shiftCompletedAt,
    });

    // Notify professional
    await addDoc(collection(db, 'notifications'), {
        recipientId: stint.acceptedProfessionalId,
        recipientType: 'professional',
        type: 'payout_scheduled',
        title: 'Payout Scheduled 💰',
        message: `Shift completed! Your payout of ${paymentIntent.currency} ${(paymentIntent.offeredRate - paymentIntent.platformFee).toLocaleString()} will be processed within 24 hours.`,
        metadata: { stintId, amount: paymentIntent.offeredRate - paymentIntent.platformFee },
        channels: ['in_app', 'sms'],
        status: 'pending',
        createdAt: serverTimestamp(),
    });

    return { success: true, message: 'Payout scheduled for 24 hours after completion' };
}
