/**
 * Flutterwave Webhook Handler
 * 
 * Receives payment callbacks from Flutterwave for:
 * - M-Pesa STK Push completions
 * - Card payment completions
 * - Transfer (payout) completions
 * 
 * POST /api/webhooks/flutterwave
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { processWebhook } from '@/lib/flutterwave-service';

// Verify Flutterwave webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const hash = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    return hash === signature;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('verif-hash') || '';
        const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET || '';

        // Verify signature in production
        if (process.env.NODE_ENV === 'production' && webhookSecret) {
            if (signature !== webhookSecret) {
                console.error('Invalid webhook signature');
                return NextResponse.json(
                    { error: 'Invalid signature' },
                    { status: 401 }
                );
            }
        }

        const payload = JSON.parse(body);
        console.log('Flutterwave webhook received:', payload.event);

        // Process the webhook
        const result = await processWebhook(payload);

        if (result.success) {
            return NextResponse.json({ status: 'ok', message: result.message });
        } else {
            console.error('Webhook processing failed:', result.message);
            return NextResponse.json(
                { error: result.message },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Flutterwave may send GET to verify endpoint
export async function GET() {
    return NextResponse.json({ status: 'ok', endpoint: 'Flutterwave webhook' });
}
