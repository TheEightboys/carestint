/**
 * Payment Initiation API
 * 
 * POST /api/payments/initiate
 * Creates a payment intent when employer accepts a professional
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent, calculateFees } from '@/lib/flutterwave-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            stintId,
            applicationId,
            employerId,
            professionalId,
            professionalName,
            amount,
            currency = 'KES',
            isUrgent = false
        } = body;

        // Validate required fields
        if (!stintId || !applicationId || !employerId || !professionalId || !professionalName || !amount) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Calculate fees for display
        const fees = calculateFees(amount, currency, isUrgent);

        // Create payment intent
        const paymentIntent = await createPaymentIntent({
            stintId,
            applicationId,
            employerId,
            professionalId,
            professionalName,
            amount,
            currency,
        });

        return NextResponse.json({
            success: true,
            paymentIntent,
            fees,
            message: 'Payment intent created. Proceed to payment.',
        });
    } catch (error) {
        console.error('Payment initiation error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create payment intent' },
            { status: 500 }
        );
    }
}
