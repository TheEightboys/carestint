/**
 * Process Payouts Cron Job
 * 
 * POST /api/cron/process-payouts
 * Processes all eligible payouts (24+ hours after shift completion)
 * 
 * Should be called by Vercel Cron or external scheduler every hour
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-payouts",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { processEligiblePayouts } from '@/lib/flutterwave-service';

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
        console.log('Starting payout processing job...');
        const startTime = Date.now();

        const result = await processEligiblePayouts();

        const duration = Date.now() - startTime;
        console.log(`Payout job completed in ${duration}ms:`, result);

        return NextResponse.json({
            success: true,
            ...result,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Payout processing error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Payout processing failed',
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
