import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { getVerifiedCustomerSession } from '@/lib/auth-utils';
import EmailLinkVerificationTemplate from '@/emails/EmailLinkVerificationTemplate';
import React from 'react';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const COOLDOWN_SECONDS = 60;

export async function POST(request: Request) {
  try {
    // 1. Authenticate Customer Server-Side
    const session = await getVerifiedCustomerSession(request);
    if (!session || !session.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const customerId = session.id;

    // 2. Fetch current email & verification status
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('email, email_verified')
      .eq('id', customerId)
      .single();

    if (fetchError || !customer) {
      return NextResponse.json({ success: false, error: 'Profile not found.' }, { status: 404 });
    }

    if (!customer.email) {
      return NextResponse.json({ success: false, error: 'No email address registered. Please add an email first.' }, { status: 400 });
    }

    if (customer.email_verified) {
      return NextResponse.json({ success: false, error: 'Email address is already verified.' }, { status: 400 });
    }

    const emailNormalized = customer.email.trim().toLowerCase();

    // 3. Rate Limiting Check (60 seconds cooldown)
    const { data: recentToken } = await supabase
      .from('customer_email_verifications')
      .select('created_at')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentToken) {
      const elapsed = Date.now() - new Date(recentToken.created_at).getTime();
      if (elapsed < COOLDOWN_SECONDS * 1000) {
        const remaining = Math.ceil((COOLDOWN_SECONDS * 1000 - elapsed) / 1000);
        return NextResponse.json({
          success: false,
          error: `Please wait ${remaining} seconds before requesting another verification email.`
        }, { status: 429 });
      }
    }

    // 4. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour expiry

    // 5. Invalidate previous tokens
    await supabase
      .from('customer_email_verifications')
      .delete()
      .eq('customer_id', customerId);

    // 6. Insert New Verification Token
    const { error: tokenInsertError } = await supabase
      .from('customer_email_verifications')
      .insert([
        {
          customer_id: customerId,
          email: emailNormalized,
          token,
          expires_at: expiresAt
        }
      ]);

    if (tokenInsertError) {
      console.error('Failed to insert verification token in resend:', tokenInsertError);
      return NextResponse.json({ success: false, error: 'Verification token creation failed.' }, { status: 500 });
    }

    // 7. Send Email via Resend
    if (!resend) {
      console.warn("Resend email gateway is not configured.");
      return NextResponse.json({ success: false, error: 'Email service is not configured' }, { status: 500 });
    }

    const host = request.headers.get('host') || 'mehtadairy.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const verificationUrl = `${protocol}://${host}/account/verify-email?token=${token}`;

    const senderEmail = process.env.SENDER_EMAIL || 'orders@mehtadairy.com';
    const { error: mailError } = await resend.emails.send({
      from: `Mehta Dairy <${senderEmail}>`,
      to: [emailNormalized],
      subject: 'Verify your email address for Mehta Dairy',
      react: React.createElement(EmailLinkVerificationTemplate, {
        verificationUrl,
        name: session.name || 'Valued Customer'
      })
    });

    if (mailError) {
      console.error('Failed to resend verification email via Resend:', mailError);
      return NextResponse.json({ success: false, error: 'Failed to send verification email. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });

  } catch (error: any) {
    console.error('Resend email API error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
