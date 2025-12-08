import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { email, name, userType } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not configured - skipping email send');
            return NextResponse.json({
                success: true,
                message: 'Email skipped (API key not configured)'
            });
        }

        const appName = userType === 'professional' ? 'CareStint Pro' : 'CareStint Hire';
        const greeting = name ? `Hi ${name}` : 'Hi there';

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to CareStint Waitlist</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 16px 32px; border-radius: 50px; margin-bottom: 24px;">
                                <span style="color: #ffffff; font-size: 24px; font-weight: bold;">CareStint</span>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0 0 16px; text-align: center;">
                                You're on the list! 🎉
                            </h1>
                            <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                                ${greeting}, thanks for joining the <strong style="color: #14b8a6;">${appName}</strong> waitlist!
                            </p>
                        </td>
                    </tr>
                    
                    <!-- What's Next -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <div style="background: rgba(20, 184, 166, 0.1); border: 1px solid rgba(20, 184, 166, 0.2); border-radius: 12px; padding: 24px;">
                                <h3 style="color: #14b8a6; font-size: 16px; font-weight: 600; margin: 0 0 12px;">What happens next?</h3>
                                <ul style="color: #cbd5e1; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                    <li>We'll notify you as soon as our mobile apps launch</li>
                                    <li>Get early access before the general public</li>
                                    <li>No spam – just one email when we're ready</li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- App Preview -->
                    <tr>
                        <td style="padding: 0 40px 30px; text-align: center;">
                            <p style="color: #64748b; font-size: 14px; margin: 0 0 16px;">
                                ${userType === 'professional'
                ? '🩺 Find healthcare shifts, manage your schedule, and get paid faster.'
                : '🏥 Post shifts, find verified professionals, and manage your facility staff.'}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- CTA -->
                    <tr>
                        <td style="padding: 0 40px 40px; text-align: center;">
                            <a href="https://carestint.com" style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                                Visit CareStint
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background: rgba(0,0,0,0.2); border-top: 1px solid #334155;">
                            <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
                                © ${new Date().getFullYear()} CareStint. Smart, automated healthcare staffing.
                            </p>
                            <p style="color: #64748b; font-size: 11px; text-align: center; margin: 8px 0 0;">
                                You received this email because you signed up for the CareStint waitlist.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        // Send email via Resend SDK
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: `🎉 You're on the ${appName} Waitlist!`,
            html: emailHtml,
        });

        if (error) {
            console.error('Resend error:', error);
            throw new Error(error.message);
        }

        console.log('Email sent successfully:', data?.id);

        return NextResponse.json({
            success: true,
            messageId: data?.id
        });
    } catch (error: any) {
        console.error('Email sending error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}
