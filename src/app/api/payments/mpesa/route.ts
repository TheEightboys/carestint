/**
 * M-Pesa STK Push API
 * 
 * POST /api/payments/mpesa
 * Initiates M-Pesa STK Push for payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { initiateMpesaPayment } from '@/lib/flutterwave-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { paymentIntentId, phoneNumber, email, fullname } = body;

        // Validate required fields
        if (!paymentIntentId || !phoneNumber || !email) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: paymentIntentId, phoneNumber, email' },
                { status: 400 }
            );
        }

        // Validate phone number format (Kenyan)
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (cleanPhone.length < 9 || cleanPhone.length > 12) {
            return NextResponse.json(
                { success: false, error: 'Invalid phone number format' },
                { status: 400 }
            );
        }

        // Format phone number to E.164 format
        let formattedPhone = cleanPhone;
        if (cleanPhone.startsWith('0')) {
            formattedPhone = '254' + cleanPhone.slice(1);
        } else if (!cleanPhone.startsWith('254')) {
            formattedPhone = '254' + cleanPhone;
        }

        // Initiate M-Pesa payment
        const result = await initiateMpesaPayment(
            paymentIntentId,
            formattedPhone,
            email,
            fullname
        );

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: result.message,
                flutterwaveRef: result.flutterwaveRef,
            });
        } else {
            return NextResponse.json(
                { success: false, error: result.message },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('M-Pesa payment error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to initiate M-Pesa payment' },
            { status: 500 }
        );
    }
}
