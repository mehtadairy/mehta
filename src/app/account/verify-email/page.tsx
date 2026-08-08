import React from 'react';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;

  let success = false;
  let errorMessage = '';

  if (!token) {
    errorMessage = 'Verification token is missing. Please use the link sent to your email.';
  } else {
    try {
      // 1. Fetch token details
      const { data: verification, error: fetchError } = await supabase
        .from('customer_email_verifications')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (fetchError || !verification) {
        errorMessage = 'Invalid or expired verification link. Please request a new link from your profile settings.';
      } else {
        const isExpired = new Date(verification.expires_at).getTime() < Date.now();
        if (isExpired) {
          errorMessage = 'The verification link has expired. Please request a new link from your profile settings.';
          
          // Delete expired token
          await supabase
            .from('customer_email_verifications')
            .delete()
            .eq('id', verification.id);
        } else {
          // 2. Mark email as verified in customers table
          const { error: customerUpdateError } = await supabase
            .from('customers')
            .update({
              email: verification.email,
              email_verified: true,
              email_verified_at: new Date().toISOString()
            })
            .eq('id', verification.customer_id);

          if (customerUpdateError) {
            console.error('Verify email update error:', customerUpdateError);
            errorMessage = 'Failed to update your profile verification status. Please try again.';
          } else {
            success = true;

            // 3. Delete used token (ensure single-use)
            await supabase
              .from('customer_email_verifications')
              .delete()
              .eq('id', verification.id);
          }
        }
      }
    } catch (err) {
      console.error('Verify email page error:', err);
      errorMessage = 'An unexpected error occurred. Please try again.';
    }
  }

  return (
    <>
      <Header />
      <main className="bg-brand-cream/35 min-h-screen py-32 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-brand-beige relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-orange to-brand-gold"></div>
          
          {success ? (
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-serif text-2xl font-black text-brand-charcoal mb-3">
                Email Verified Successfully!
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                Your email address has been successfully verified. You will be redirected back to your account profile settings in a few seconds...
              </p>
              <a 
                href="/account" 
                className="w-full inline-flex justify-center items-center py-3.5 px-6 border border-transparent rounded-2xl text-sm font-bold text-white bg-brand-orange hover:bg-brand-gold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange"
              >
                Go to Account settings
              </a>
              
              {/* Auto Redirect Script */}
              <script 
                dangerouslySetInnerHTML={{
                  __html: `
                    setTimeout(function() {
                      window.location.href = '/account';
                    }, 3000);
                  `
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-100">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="font-serif text-2xl font-black text-brand-charcoal mb-3">
                Verification Failed
              </h1>
              <p className="text-sm text-red-600 leading-relaxed mb-8">
                {errorMessage}
              </p>
              <a 
                href="/account" 
                className="w-full inline-flex justify-center items-center py-3.5 px-6 border border-brand-beige hover:border-brand-gold rounded-2xl text-sm font-bold text-brand-charcoal hover:bg-brand-cream/10 transition-colors focus:outline-none"
              >
                Return to Account settings
              </a>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
