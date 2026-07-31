"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'PHONE_OTP'>('PHONE');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reqId, setReqId] = useState('');
  const [truecallerNonce, setTruecallerNonce] = useState('');
  const [isTruecallerPolling, setIsTruecallerPolling] = useState(false);

  const [pollingTimeout, setPollingTimeout] = useState<any>(null);

  useEffect(() => {
    let pollInterval: any;
    if (isTruecallerPolling && truecallerNonce) {
      const startTime = Date.now();
      pollInterval = setInterval(async () => {
        // 60 seconds timeout
        if (Date.now() - startTime > 60000) {
           setIsTruecallerPolling(false);
           clearInterval(pollInterval);
           setError("Truecaller login timed out. Please ensure you are on a mobile device with Truecaller installed, or try OTP.");
           return;
        }

        try {
          const res = await fetch(`/api/auth/truecaller/status?nonce=${truecallerNonce}&intent=login`);
          const data = await res.json();
          
          if (!data.success && data.error) {
            setIsTruecallerPolling(false);
            clearInterval(pollInterval);
            setError(data.error);
            return;
          }

          if (data.success && data.status === 'successful') {
            setIsTruecallerPolling(false);
            clearInterval(pollInterval);
            
            // Sync with new API approach instead of just local storage
            await fetch('/api/auth/me'); // Trigger AuthSync logic implicitly if needed, or just let next page load do it
            window.dispatchEvent(new Event("storage"));
            
            const redirectUrl = searchParams.get("redirect") || "/";
            router.push(redirectUrl);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 2000);
    }
    return () => clearInterval(pollInterval);
  }, [isTruecallerPolling, truecallerNonce, router, searchParams]);

  // ----------------------------------------------------
  // WhatsApp OTP Authentication
  // ----------------------------------------------------
  // Replaced MSG91 Widget initialization with backend WhatsApp OTP service.


  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      // Clear any existing stale sessions before initiating a new Google login
      await supabase.auth.signOut();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/auth/callback?intent=login${searchParams.get("redirect") ? `&redirect=${searchParams.get("redirect")}` : ''}`
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const generateNonce = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleTruecallerLogin = () => {
    setError('');
    const nonce = generateNonce();
    setTruecallerNonce(nonce);
    
    const appKey = process.env.NEXT_PUBLIC_TRUECALLER_APP_KEY;
    const appName = "Mehta Dairy";
    
    if (!appKey) {
       setError("Truecaller is not configured. Please use OTP or Google Login.");
       return;
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
       setError('Truecaller login is only available on mobile devices with the app installed.');
       return;
    }

    // Construct the deep link URL with required parameters
    const baseUrl = "truecallersdk://truesdk/web_verify";
    const truecallerUrl = `${baseUrl}?requestNonce=${nonce}&partnerKey=${appKey}&partnerName=${encodeURIComponent(appName)}&lang=en&skipOption=truesdk_skip_otp&type=4`;
    
    // Redirect to Truecaller app
    window.location.href = truecallerUrl;
    
    // Start polling the backend for status updates
    setIsTruecallerPolling(true);
  };

  const cancelTruecaller = () => {
    setIsTruecallerPolling(false);
    setError('');
  };

  const handleContinue = async () => {
    setError('');
    
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }



    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      
      setIsLoading(false);
      if (data.success) {
        setStep('PHONE_OTP');
      } else if (res.status === 404 || (data.error && (data.error.includes('No account') || data.error.includes('sign up')))) {
        const redirectUrl = searchParams.get("redirect");
        router.push(`/signup?phone=${encodeURIComponent(phone.replace(/\D/g, ''))}${redirectUrl ? `&redirect=${encodeURIComponent(redirectUrl)}` : ''}&reason=not_registered`);
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
      const res = await fetch('/api/auth/login/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
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
        
        if (data.isNewCustomer) {
          router.push('/complete-profile');
        } else {
          const redirectUrl = searchParams.get("redirect") || "/";
          router.push(redirectUrl);
        }
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
      const res = await fetch('/api/auth/login/send-otp', {
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

  // `handleSuccess` is no longer needed as logic is moved to `handleVerifyOTP`

  return (
    <div className="min-h-screen bg-[#FAF6EE] flex flex-col pt-16 sm:pt-20 relative">
      <button 
        onClick={() => router.back()}
        className="absolute top-6 left-6 flex items-center gap-2 text-[#8B7355] hover:text-[#4A2F1F] font-bold text-sm transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
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
            Welcome Back
          </h1>
          <p className="text-[#8B7355] text-sm mt-3 font-medium">
            Login to track your orders and checkout faster.
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white w-full rounded-3xl shadow-xl shadow-[#4A2F1F]/5 p-6 sm:p-8 border border-[#EAE0D3]/50 relative overflow-hidden"
        >
          {/* Decorative Top Border */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D97706] to-[#F59E0B]" />

          {step === 'PHONE' ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2 mb-2">
                <Link
                  href="/signup"
                  className="w-full bg-[#FAF6EE] hover:bg-[#EAE0D3] text-[#4A2F1F] border border-[#EAE0D3] rounded-2xl py-4 px-6 font-bold text-base flex justify-center items-center shadow-sm transition-all active:scale-95"
                >
                  New to Mehta Dairy? Sign Up
                </Link>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white border border-[#EAE0D3] hover:bg-[#FAF6EE] text-[#4A2F1F] rounded-2xl py-4 px-6 font-bold text-base flex justify-center items-center gap-3 shadow-sm hover:shadow-md transition-all group active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
                Continue with Google
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-[#EAE0D3]"></div>
                <span className="flex-shrink-0 mx-4 text-[#8B7355] text-xs font-bold uppercase tracking-wider">Or</span>
                <div className="flex-grow border-t border-[#EAE0D3]"></div>
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
                    id="login_phone_input"
                    type="tel"
                    placeholder="Enter 10 digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="block w-full pl-24 pr-4 py-4 border-2 border-[#EAE0D3] rounded-2xl text-base font-bold text-[#4A2F1F] placeholder:text-[#8B7355]/50 focus:ring-0 focus:border-[#D97706] transition-all bg-[#FAF6EE]/30 focus:bg-white"
                    disabled={isLoading}
                    autoFocus
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
                disabled={isLoading || phone.length !== 10}
                className="w-full bg-[#4A2F1F] hover:bg-black text-white rounded-2xl py-4 px-6 font-bold text-base flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
              >
                {isLoading ? (
                  <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    Continue Securely
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
                    Verify OTP
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#EAE0D3] border-t-[#D97706] rounded-full animate-spin"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
