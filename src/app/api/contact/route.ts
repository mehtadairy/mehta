import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { BUSINESS } from '@/lib/businessConfig';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || '');

export async function POST(req: Request) {
  try {
    // 1. Rate limiting or basic anti-spam check could go here if we had an IP or token.
    // For now, we enforce strict server-side validation.

    // 2. Parse request
    const body = await req.json();
    const { name, email, phone, inquiryType, message } = body;

    // 3. Validate Required Fields
    if (!name || !email || !phone || !inquiryType || !message) {
      return NextResponse.json({ success: false, error: 'All fields are required.' }, { status: 400 });
    }

    // 4. Sanitize and Validate Formats
    const sanitizedName = name.trim();
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPhone = phone.replace(/\D/g, '').slice(0, 10);
    const sanitizedMessage = message.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json({ success: false, error: 'Invalid email address.' }, { status: 400 });
    }

    if (sanitizedPhone.length < 10) {
      return NextResponse.json({ success: false, error: 'Invalid phone number.' }, { status: 400 });
    }

    if (sanitizedMessage.length < 10) {
      return NextResponse.json({ success: false, error: 'Message is too short (minimum 10 characters).' }, { status: 400 });
    }

    if (sanitizedMessage.length > 2000) {
      return NextResponse.json({ success: false, error: 'Message is too long (maximum 2000 characters).' }, { status: 400 });
    }

    // 5. Check API Key
    if (!process.env.RESEND_API_KEY) {
      console.error('Contact API Error: RESEND_API_KEY is missing.');
      return NextResponse.json({ success: false, error: 'Server configuration error.' }, { status: 500 });
    }

    // 6. Formatting Data
    const formattedDateTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const formattedInquiryType = inquiryType.charAt(0).toUpperCase() + inquiryType.slice(1).replace('-', ' ');

    // 7. Admin Email Content
    const adminSubject = `New Contact Inquiry - ${formattedInquiryType}`;
    const adminTextBody = `----------------------------------
New Contact Form Submission

Name:
${sanitizedName}

Email:
${sanitizedEmail}

Phone:
${sanitizedPhone}

Inquiry Type:
${formattedInquiryType}

Message:
${sanitizedMessage}

Submitted At:
${formattedDateTime}
----------------------------------`;

    // 8. Customer Auto Reply Content
    const customerSubject = `We received your message - ${BUSINESS.shortName}`;
    const customerTextBody = `Hello ${sanitizedName},

Thank you for contacting ${BUSINESS.shortName}.

We have successfully received your message.

Our team will review your inquiry and get back to you within 24 hours.

If your inquiry is urgent, you may contact us directly:

Phone:
${BUSINESS.phone}

Email:
${BUSINESS.email}

Thank you,
${BUSINESS.name}
${BUSINESS.tagline}`;

    // 9. Send Emails using Resend
    // Send to Admin
    const adminEmailPromise = resend.emails.send({
      from: `Mehta Dairy Contact <no-reply@mehtadairy.com>`,
      to: [BUSINESS.email],
      replyTo: sanitizedEmail,
      subject: adminSubject,
      text: adminTextBody,
    });

    // Send to Customer
    const customerEmailPromise = resend.emails.send({
      from: `Mehta Dairy <no-reply@mehtadairy.com>`,
      to: [sanitizedEmail],
      subject: customerSubject,
      text: customerTextBody,
    });

    // Await both dispatches
    const [adminResponse, customerResponse] = await Promise.all([adminEmailPromise, customerEmailPromise]);

    if (adminResponse.error || customerResponse.error) {
      console.error('Failed to send contact emails:', adminResponse.error || customerResponse.error);
      return NextResponse.json({ success: false, error: 'Failed to dispatch email. Please try again later.' }, { status: 500 });
    }

    // 10. Return Success
    return NextResponse.json({ success: true, message: 'Message sent successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Contact Form Submission Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
