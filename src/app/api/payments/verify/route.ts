/**
 * Verify Payment Status API
 * 
 * GET /api/payments/verify?ref=XXXX
 * Verifies payment status from Flutterwave
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment, getPaymentIntent } from '@/lib/flutterwave-service';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const ref = searchParams.get('ref');
        const intentId = searchParams.get('intent');

        if (!ref && !intentId) {
            return NextResponse.json(
                { success: false, error: 'Missing ref or intent parameter' },
                { status: 400 }
            );
        }

        let flutterwaveRef = ref;
        let paymentIntent = null;

        // If intentId provided, get the payment intent first
        if (intentId) {
            paymentIntent = await getPaymentIntent(intentId);
            if (!paymentIntent) {
                return NextResponse.json(
                    { success: false, error: 'Payment intent not found' },
                    { status: 404 }
                );
            }
            flutterwaveRef = paymentIntent.flutterwaveRef || ref;
        }

        // Verify with Flutterwave
        if (flutterwaveRef) {
            const verification = await verifyPayment(flutterwaveRef);
            return NextResponse.json({
                success: true,
                paymentIntent,
                verification,
            });
        }

        // Return just the payment intent status if no ref
        return NextResponse.json({
            success: true,
            paymentIntent,
            status: paymentIntent?.status,
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to verify payment' },
            { status: 500 }
        );
    }
}
