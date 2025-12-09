'use client';

/**
 * Payment Service for CareStint
 * Handles M-Pesa and card payment processing with Firestore integration
 */

import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase/clientApp';

export interface PaymentDetails {
    invoiceId: string;
    amount: number;
    currency: string;
    paymentMethod: 'mpesa' | 'card';
    // M-Pesa specific
    phoneNumber?: string;
    // Card specific
    cardNumber?: string;
    cardExpiry?: string;
    cardCvv?: string;
    cardHolderName?: string;
}

export interface PaymentResult {
    success: boolean;
    transactionId?: string;
    message: string;
    receiptUrl?: string;
    timestamp?: Date;
}

export interface PaymentRecord {
    invoiceId: string;
    transactionId: string;
    amount: number;
    currency: string;
    paymentMethod: 'mpesa' | 'card';
    status: 'success' | 'failed' | 'pending';
    phoneNumber?: string;
    cardLast4?: string;
    createdAt: any;
    metadata?: Record<string, any>;
}

/**
 * Main payment processor
 */
export async function processPayment(details: PaymentDetails): Promise<PaymentResult> {
    try {
        let result: PaymentResult;

        if (details.paymentMethod === 'mpesa') {
            result = await simulateMpesaPayment(details);
        } else {
            result = await simulateCardPayment(details);
        }

        if (result.success && result.transactionId) {
            // Update invoice status in Firestore
            await updateInvoicePaymentStatus(details.invoiceId, result.transactionId);

            // Add payment record
            await addPaymentRecord({
                invoiceId: details.invoiceId,
                transactionId: result.transactionId,
                amount: details.amount,
                currency: details.currency,
                paymentMethod: details.paymentMethod,
                status: 'success',
                phoneNumber: details.phoneNumber,
                cardLast4: details.cardNumber?.slice(-4),
                createdAt: serverTimestamp(),
            });

            // Log audit trail
            await logPaymentAudit(details.invoiceId, result.transactionId, 'payment_success', details.amount);
        }

        return result;
    } catch (error) {
        console.error('Payment processing error:', error);
        return {
            success: false,
            message: 'Payment processing failed. Please try again.',
        };
    }
}

/**
 * Simulate M-Pesa STK Push payment
 * In production, this would integrate with Safaricom M-Pesa API
 */
async function simulateMpesaPayment(details: PaymentDetails): Promise<PaymentResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Validate phone number format (Kenya: 07xx or 01xx)
    const phoneRegex = /^(07|01|2547|2541)\d{8}$/;
    const cleanPhone = details.phoneNumber?.replace(/\s/g, '') || '';

    if (!phoneRegex.test(cleanPhone)) {
        return {
            success: false,
            message: 'Invalid phone number format. Please use 07XXXXXXXX or 01XXXXXXXX.',
        };
    }

    // Simulate successful payment (in production, this would be real M-Pesa integration)
    const transactionId = `MPESA${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    return {
        success: true,
        transactionId,
        message: 'M-Pesa payment successful! You will receive a confirmation SMS.',
        timestamp: new Date(),
    };
}

/**
 * Simulate card payment
 * In production, this would integrate with Flutterwave, Stripe, or similar
 */
async function simulateCardPayment(details: PaymentDetails): Promise<PaymentResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Basic card validation
    const cardNumber = details.cardNumber?.replace(/\s/g, '') || '';

    if (cardNumber.length < 13 || cardNumber.length > 19) {
        return {
            success: false,
            message: 'Invalid card number. Please check and try again.',
        };
    }

    // Validate expiry (MM/YY format)
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(details.cardExpiry || '')) {
        return {
            success: false,
            message: 'Invalid expiry date. Please use MM/YY format.',
        };
    }

    // Validate CVV
    if (!details.cardCvv || details.cardCvv.length < 3 || details.cardCvv.length > 4) {
        return {
            success: false,
            message: 'Invalid CVV. Please enter 3 or 4 digits.',
        };
    }

    // Simulate successful payment
    const transactionId = `CARD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    return {
        success: true,
        transactionId,
        message: 'Card payment successful!',
        timestamp: new Date(),
    };
}

/**
 * Update invoice payment status in Firestore
 */
async function updateInvoicePaymentStatus(invoiceId: string, transactionId: string): Promise<void> {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    await updateDoc(invoiceRef, {
        isPaid: true,
        paidAt: serverTimestamp(),
        transactionId,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Add payment record to Firestore
 */
async function addPaymentRecord(record: PaymentRecord): Promise<string> {
    const docRef = await addDoc(collection(db, 'payments'), record);
    return docRef.id;
}

/**
 * Log payment audit trail
 */
async function logPaymentAudit(
    invoiceId: string,
    transactionId: string,
    action: string,
    amount: number
): Promise<void> {
    await addDoc(collection(db, 'auditLogs'), {
        entityType: 'invoice',
        entityId: invoiceId,
        action,
        actorType: 'employer',
        metadata: {
            transactionId,
            amount,
        },
        timestamp: serverTimestamp(),
    });
}

/**
 * Generate and download payment receipt
 */
export function generateReceipt(
    invoiceNumber: string,
    transactionId: string,
    amount: number,
    currency: string,
    paymentMethod: string,
    paidAt: Date,
    facilityName?: string
): void {
    const receiptContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Payment Receipt - ${transactionId}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; background: #f5f5f5; }
        .receipt { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #14b8a6; padding-bottom: 20px; }
        .logo { font-size: 28px; font-weight: bold; color: #14b8a6; }
        .tagline { font-size: 12px; color: #666; margin-top: 5px; }
        .success-badge { display: inline-block; background: #dcfce7; color: #16a34a; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 20px 0; }
        .details { margin: 30px 0; }
        .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
        .label { color: #666; }
        .value { font-weight: 600; color: #333; }
        .amount-row { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .amount { font-size: 32px; font-weight: bold; color: #16a34a; text-align: center; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="logo">CareStint</div>
            <div class="tagline">Healthcare Staffing Platform</div>
        </div>
        
        <div style="text-align: center;">
            <div class="success-badge">✓ Payment Successful</div>
        </div>
        
        <div class="amount-row">
            <div class="amount">${currency} ${amount.toLocaleString()}</div>
        </div>
        
        <div class="details">
            <div class="row">
                <span class="label">Transaction ID</span>
                <span class="value">${transactionId}</span>
            </div>
            <div class="row">
                <span class="label">Invoice Number</span>
                <span class="value">${invoiceNumber}</span>
            </div>
            <div class="row">
                <span class="label">Payment Method</span>
                <span class="value">${paymentMethod === 'mpesa' ? 'M-Pesa' : 'Card Payment'}</span>
            </div>
            <div class="row">
                <span class="label">Date & Time</span>
                <span class="value">${paidAt.toLocaleString()}</span>
            </div>
            ${facilityName ? `
            <div class="row">
                <span class="label">Facility</span>
                <span class="value">${facilityName}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>Thank you for your payment!</p>
            <p>For questions, contact billing@carestint.com</p>
            <p style="margin-top: 10px;">This is an automatically generated receipt.</p>
        </div>
    </div>
</body>
</html>
    `;

    // Create and download receipt
    const blob = new Blob([receiptContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt-${transactionId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'KES'): string {
    return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Mask card number for display
 */
export function maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length < 4) return cleaned;
    return `**** **** **** ${cleaned.slice(-4)}`;
}
