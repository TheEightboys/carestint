/**
 * Expire Stale Payments Cron Job
 * 
 * POST /api/cron/expire-payments
 * Expires payment intents that have passed their 15-minute window
 * 
 * Should be called by Vercel Cron or external scheduler every 5 minutes
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/expire-payments",
 *     "schedule": "0/5 * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { expireStalePaymentIntents } from '@/lib/flutterwave-service';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
    const cronSecret = process.env.CRON_SECRET;

    // Skip verification in development
    if (process.env.NODE_ENV === 'development') {
        return true;
    }

    // No secret configured - allow (but log warning)
    if (!cronSecret) {
        console.warn('CRON_SECRET not configured - allowing request');
        return true;
    }

    // Check Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader === `Bearer ${cronSecret}`) {
        return true;
    }

    // Check Vercel cron secret header
    const vercelCron = request.headers.get('x-vercel-cron-auth');
    if (vercelCron === cronSecret) {
        return true;
    }

    return false;
}

export async function POST(request: NextRequest) {
    // Verify authorization
    if (!verifyCronSecret(request)) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        console.log('Starting payment expiry job...');
        const startTime = Date.now();

        const expired = await expireStalePaymentIntents();

        const duration = Date.now() - startTime;
        console.log(`Payment expiry job completed in ${duration}ms: ${expired} expired`);

        return NextResponse.json({
            success: true,
            expired,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Payment expiry error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Payment expiry failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Also allow GET for Vercel Cron
export async function GET(request: NextRequest) {
    return POST(request);
}
