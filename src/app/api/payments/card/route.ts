/**
 * Card Payment API
 * 
 * POST /api/payments/card
 * Initiates card payment and returns Flutterwave hosted payment link
 */

import { NextRequest, NextResponse } from 'next/server';
import { initiateCardPayment } from '@/lib/flutterwave-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { paymentIntentId, email, fullname } = body;

        // Validate required fields
        if (!paymentIntentId || !email) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: paymentIntentId, email' },
                { status: 400 }
            );
        }

        // Build redirect URL
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const redirectUrl = `${origin}/dashboard/employer/payment-callback?intent=${paymentIntentId}`;

        // Initiate card payment
        const result = await initiateCardPayment(
            paymentIntentId,
            email,
            redirectUrl,
            fullname
        );

        if (result.success && result.paymentLink) {
            return NextResponse.json({
                success: true,
                message: result.message,
                paymentLink: result.paymentLink,
            });
        } else {
            return NextResponse.json(
                { success: false, error: result.message },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Card payment error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to initiate card payment' },
            { status: 500 }
        );
    }
}
