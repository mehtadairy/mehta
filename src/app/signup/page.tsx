"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import WhatsAppOTPLayout from '@/components/WhatsAppOTPLayout';
import { useCustomerAuth } from '@/lib/context/CustomerAuthContext';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isLoading: isAuthChecking } = useCustomerAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'PHONE_OTP'>('PHONE');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reqId, setReqId] = useState('');

  const redirectUrl = searchParams.get('redirect') || '/account';

  useEffect(() => {
    if (!isAuthChecking && isLoggedIn) {
      router.replace(redirectUrl);
    }
  }, [isLoggedIn, isAuthChecking, redirectUrl, router]);

  const handleContinue = async () => {
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!phone || phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/whatsapp-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `91${phone}`, intent: 'signup' }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      setReqId(data.reqId || '');
      setStep('PHONE_OTP');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/whatsapp-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `91${phone}`,
          otp,
          reqId,
          intent: 'signup',
          fullName: name,
          email,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Invalid OTP');
      }

      if (data.sessionToken) {
        document.cookie = `mehta_customer_session=${data.sessionToken}; path=/; max-age=2592000; SameSite=Lax`;
      }
      if (data.customer) {
        localStorage.setItem('mehta_customer_user', JSON.stringify(data.customer));
      }
      window.dispatchEvent(new Event('customerAuthChanged'));

      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/whatsapp-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `91${phone}`, intent: 'signup' }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to resend OTP');
      }
      setError('Resent OTP successfully on WhatsApp!');
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'PHONE_OTP') {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 sm:p-6 py-12">
        <WhatsAppOTPLayout
          phone={phone}
          otp={otp}
          setOtp={setOtp}
          onVerify={handleVerifyOTP}
          onChangeNumber={() => {
            setStep('PHONE');
            setOtp('');
            setError('');
          }}
          onResend={handleResendOTP}
          isLoading={isLoading}
          error={error}
          title="Create Account"
          subtitle="Verify your mobile number to complete registration."
          buttonText="Verify OTP & Register"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 w-full flex flex-col items-center"
        >
          <div className="inline-flex items-center justify-center p-1 rounded-full border-2 border-[#D4AF37]/80 bg-[#FAF5EE] shadow-xs mb-4">
            <img src="/logo.png" alt="Mehta Dairy" className="h-12 w-auto object-contain px-2 py-0.5" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2A1E17] tracking-tight">
            Create Account
          </h1>
          <p className="text-[#7E6B5A] text-xs sm:text-sm mt-2 font-medium">
            Join Mehta Dairy family for fresh delivery.
          </p>
        </motion.div>

        {/* Signup Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white w-full rounded-[32px] shadow-2xl shadow-[#4A2F1F]/5 p-6 sm:p-8 border border-[#EFE9DF] relative overflow-hidden"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 mb-1">
              <Link
                href="/login"
                className="w-full bg-[#FAF6EE] hover:bg-[#EAE0D3] text-[#4A2F1F] border border-[#EAE0D3] rounded-2xl py-3.5 px-6 font-bold text-sm flex justify-center items-center shadow-xs transition-all active:scale-95"
              >
                Already have an account? Log In
              </Link>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2F1F] uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-4 py-3.5 border-2 border-[#EAE0D3] rounded-2xl text-base font-bold text-[#4A2F1F] placeholder:text-[#8B7355]/50 focus:ring-0 focus:border-[#D97706] transition-all bg-[#FAF6EE]/30 focus:bg-white"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2F1F] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3.5 border-2 border-[#EAE0D3] rounded-2xl text-base font-bold text-[#4A2F1F] placeholder:text-[#8B7355]/50 focus:ring-0 focus:border-[#D97706] transition-all bg-[#FAF6EE]/30 focus:bg-white"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2F1F] uppercase tracking-wider mb-1.5">
                Mobile Number
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-[#4A2F1F] font-bold text-base">+91</span>
                  <div className="h-5 w-px bg-[#EAE0D3] mx-3" />
                  <Phone className="h-5 w-5 text-[#8B7355] group-focus-within:text-[#D97706] transition-colors" />
                </div>
                <input
                  id="signup_phone_input"
                  type="tel"
                  placeholder="Enter 10 digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="block w-full pl-24 pr-4 py-3.5 border-2 border-[#EAE0D3] rounded-2xl text-base font-bold text-[#4A2F1F] placeholder:text-[#8B7355]/50 focus:ring-0 focus:border-[#D97706] transition-all bg-[#FAF6EE]/30 focus:bg-white"
                  disabled={isLoading}
                />
              </div>
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs font-bold mt-2 ml-1">
                  {error}
                </motion.p>
              )}
            </div>

            <button
              onClick={handleContinue}
              disabled={isLoading || phone.length !== 10 || !name || !email}
              className="w-full bg-[#4A2F1F] hover:bg-black text-white rounded-2xl py-4 px-6 font-bold text-base flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95 cursor-pointer mt-1"
            >
              {isLoading ? (
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  Sign Up Securely
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-[#EAE0D3] flex items-center justify-center gap-2 text-xs font-semibold text-[#2E7D32]">
            <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
            Secured by WhatsApp
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#EAE0D3] border-t-[#D97706] rounded-full animate-spin"></div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
