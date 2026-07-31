"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'PHONE_OTP'>('PHONE');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const googlePicture = searchParams ? searchParams.get('picture') : null;
  const reason = searchParams ? searchParams.get('reason') : null;

  React.useEffect(() => {
    if (!searchParams) return;
    const pName = searchParams.get('name');
    const pEmail = searchParams.get('email');
    const pPhone = searchParams.get('phone');
    if (pName) setName(pName);
    if (pEmail) setEmail(pEmail);
    if (pPhone) setPhone(pPhone.replace(/\D/g, '').slice(-10));
  }, [searchParams]);

  const handleContinue = async () => {
    setError('');
    
    if (!name || name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      
      setIsLoading(false);
      if (data.success) {
        setStep('PHONE_OTP');
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    
    if (otp.length < 4) {
      setError('Please enter a valid OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          otp,
          name: name.trim(),
          email: email.trim()
        })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem("mehta_logged_in", "true");
        localStorage.setItem("mehta_user_phone", phone.replace(/\D/g, '').slice(-10));
        
        if (data.customer) {
          localStorage.setItem("mehta_user_id", data.customer.id);
          if (data.customer.name) localStorage.setItem("mehta_user_name", data.customer.name);
          if (data.customer.email) localStorage.setItem("mehta_user_email", data.customer.email);
        }
        
        window.dispatchEvent(new Event("authUpdated"));
        
        const redirectUrl = searchParams.get("redirect") || "/";
        router.push(redirectUrl);
      } else {
        setIsLoading(false);
        setError(data.error || 'Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Invalid OTP. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setOtp('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      
      setIsLoading(false);
      if (data.success) {
        setError("OTP Resent successfully via WhatsApp!");
      } else {
        setError(data.error || 'Failed to resend OTP.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Failed to resend OTP.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] flex flex-col pt-16 sm:pt-20">
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 max-w-md mx-auto w-full mb-12">
        
        {/* Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 w-full"
        >
          <div className="mx-auto flex items-center justify-center mb-6">
            <img src="/logo.png" alt="Mehta Dairy" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A2F1F] tracking-tight">
            Create an Account
          </h1>
          <p className="text-[#8B7355] text-sm mt-3 font-medium">
            Join Mehta Dairy for exclusive deals and faster checkout.
          </p>
        </motion.div>

        {/* Signup Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white w-full rounded-3xl shadow-xl shadow-[#4A2F1F]/5 p-6 sm:p-8 border border-[#EAE0D3]/50 relative overflow-hidden"
        >
          {/* Decorative Top Border */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D97706] to-[#F59E0B]" />

          {/* Reason Notification Banner */}
          {reason === 'google_not_found' && (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-xs font-bold shadow-2xs">
              {googlePicture ? (
                <img src={googlePicture} alt="Google Profile" className="w-9 h-9 rounded-full border border-amber-300 shrink-0 object-cover" />
              ) : (
                <span className="text-xl">⚠️</span>
              )}
              <div>
                <p className="font-extrabold text-amber-950">Google Account Not Registered</p>
                <p className="text-[11px] text-amber-800 font-medium mt-0.5">No account was found for this Google account. Please complete your signup.</p>
              </div>
            </div>
          )}

          {reason === 'not_registered' && (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-xs font-bold shadow-2xs">
              <span className="text-xl">📱</span>
              <div>
                <p className="font-extrabold text-amber-950">Mobile Number Not Registered</p>
                <p className="text-[11px] text-amber-800 font-medium mt-0.5">This mobile number isn't registered yet. Please create your account.</p>
              </div>
            </div>
          )}

          {step === 'PHONE' ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2 mb-2">
                <Link
                  href="/login"
                  className="w-full bg-[#FAF6EE] hover:bg-[#EAE0D3] text-[#4A2F1F] border border-[#EAE0D3] rounded-2xl py-4 px-6 font-bold text-base flex justify-center items-center shadow-sm transition-all active:scale-95"
                >
                  Already have an account? Log In
                </Link>
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-[#EAE0D3]"></div>
                <span className="flex-shrink-0 mx-4 text-[#8B7355] text-xs font-bold uppercase tracking-wider">Sign Up</span>
                <div className="flex-grow border-t border-[#EAE0D3]"></div>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#4A2F1F] uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full px-4 py-4 border-2 border-[#EAE0D3] rounded-2xl text-base font-bold text-[#4A2F1F] placeholder:text-[#8B7355]/50 focus:ring-0 focus:border-[#D97706] transition-all bg-[#FAF6EE]/30 focus:bg-white"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A2F1F] uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-4 py-4 border-2 border-[#EAE0D3] rounded-2xl text-base font-bold text-[#4A2F1F] placeholder:text-[#8B7355]/50 focus:ring-0 focus:border-[#D97706] transition-all bg-[#FAF6EE]/30 focus:bg-white"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2F1F] uppercase tracking-wider mb-2">
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
                    className="block w-full pl-24 pr-4 py-4 border-2 border-[#EAE0D3] rounded-2xl text-base font-bold text-[#4A2F1F] placeholder:text-[#8B7355]/50 focus:ring-0 focus:border-[#D97706] transition-all bg-[#FAF6EE]/30 focus:bg-white"
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
                className="w-full bg-[#4A2F1F] hover:bg-black text-white rounded-2xl py-4 px-6 font-bold text-base flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
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
          ) : (
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-[#4A2F1F] uppercase tracking-wider mb-2">
                  Enter OTP sent to +91 {phone}
                </label>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="block w-full px-4 py-4 border-2 border-[#EAE0D3] rounded-2xl text-base font-bold text-[#4A2F1F] text-center tracking-[0.5em] focus:ring-0 focus:border-[#D97706] transition-all bg-[#FAF6EE]/30 focus:bg-white"
                  disabled={isLoading}
                  autoFocus
                />
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-xs font-bold mt-2 ml-1 text-center ${error.includes('Resent') ? 'text-green-600' : 'text-red-500'}`}>
                    {error}
                  </motion.p>
                )}
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={isLoading || otp.length < 4}
                className="w-full bg-[#D97706] hover:bg-[#B45309] text-white rounded-2xl py-4 px-6 font-bold text-base flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
              >
                {isLoading ? (
                  <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    Verify OTP & Register
                    <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>

              <div className="flex justify-between items-center px-1 mt-2">
                <button
                  onClick={() => {
                    setStep('PHONE');
                    setOtp('');
                    setError('');
                  }}
                  className="text-xs font-bold text-[#8B7355] hover:text-[#4A2F1F] transition-colors"
                  disabled={isLoading}
                >
                  Change Number
                </button>
                <button
                  onClick={handleResendOTP}
                  className="text-xs font-bold text-[#D97706] hover:text-[#B45309] transition-colors"
                  disabled={isLoading}
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[#EAE0D3] flex items-center justify-center gap-2 text-xs font-medium text-[#8B7355]">
            <ShieldCheck className="w-4 h-4 text-green-600" />
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
