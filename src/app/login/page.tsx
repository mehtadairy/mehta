"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reqId, setReqId] = useState('');

  // Load MSG91 Widget SDK and Initialize
  useEffect(() => {
    const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
    const tokenAuth = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH;
    
    if (!widgetId || !tokenAuth) return;

    const scriptId = 'msg91-widget-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://verify.msg91.com/otp-provider.js'; // Using updated URL from user docs
      script.async = true;
      script.onload = () => {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.initSendOTP) {
          // @ts-ignore
          window.initSendOTP({
            widgetId: widgetId,
            tokenAuth: tokenAuth,
            exposeMethods: true,
            success: (data: any) => {
              console.log('OTP verified from global success', data);
            },
            failure: (error: any) => {
              console.log('OTP global failure', error);
            }
          });
        }
      };
      document.body.appendChild(script);
    }
  }, []);

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
          redirectTo: `${window.location.origin}/auth/callback${searchParams.get("redirect") ? `?redirect=${searchParams.get("redirect")}` : ''}`
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    setError('');
    
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
    const tokenAuth = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH;

    if (!widgetId || !tokenAuth) {
      // Mock flow if no keys provided
      console.warn("MSG91 Keys missing, simulating successful auth");
      setStep('OTP');
      return;
    }

    setIsLoading(true);
    // @ts-ignore
    if (typeof window !== 'undefined' && window.sendOtp) {
      // @ts-ignore
      window.sendOtp(
        `91${phone}`, // Country code + mobile number
        (data: any) => {
          setIsLoading(false);
          const resolvedReqId = typeof data === 'string' ? data : (data?.reqId || data?.requestId || '');
          setReqId(resolvedReqId);
          setStep('OTP');
        },
        (err: any) => {
          setIsLoading(false);
          let errMsg = (typeof err === 'string') ? err : (err?.message || 'Failed to send OTP. Please try again.');
          if (typeof errMsg === 'string' && errMsg.includes('IPBlocked')) {
            errMsg = 'Too many attempts. Your IP has been temporarily blocked by the OTP provider. Please use Google Login.';
          }
          setError(errMsg);
        }
      );
    } else {
      setIsLoading(false);
      setError("OTP Service is not fully loaded. Please wait a moment or refresh.");
    }
  };

  const handleVerifyOTP = () => {
    setError('');
    
    if (otp.length < 4) {
      setError('Please enter a valid OTP.');
      return;
    }

    const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
    
    if (!widgetId) {
      // Mock flow
      handleSuccess({ message: "Mock OTP Success", mobile: `91${phone}` });
      return;
    }

    setIsLoading(true);
    // @ts-ignore
    if (typeof window !== 'undefined' && window.verifyOtp) {
      // @ts-ignore
      window.verifyOtp(
        otp,
        (data: any) => {
          handleSuccess(data);
        },
        (err: any) => {
          setIsLoading(false);
          let errMsg = (typeof err === 'string') ? err : (err?.message || 'Invalid OTP. Please try again.');
          if (typeof errMsg === 'string' && errMsg.includes('IPBlocked')) {
            errMsg = 'Too many attempts. Your IP has been temporarily blocked by the OTP provider. Please use Google Login.';
          }
          setError(errMsg);
        },
        reqId
      );
    }
  };

  const handleResendOTP = () => {
    setError('');
    setIsLoading(true);
    // @ts-ignore
    if (typeof window !== 'undefined' && window.retryOtp) {
      // @ts-ignore
      window.retryOtp(
        null, // Default channel
        (data: any) => {
          setIsLoading(false);
          const resolvedReqId = typeof data === 'string' ? data : (data?.reqId || data?.requestId || '');
          if (resolvedReqId) setReqId(resolvedReqId);
          setError("OTP Resent successfully!");
        },
        (err: any) => {
          setIsLoading(false);
          let errMsg = (typeof err === 'string') ? err : (err?.message || 'Failed to resend OTP.');
          if (typeof errMsg === 'string' && errMsg.includes('IPBlocked')) {
            errMsg = 'Too many attempts. Your IP has been temporarily blocked by the OTP provider. Please use Google Login.';
          }
          setError(errMsg);
        }
      );
    } else {
      setIsLoading(false);
    }
  };

  const handleSuccess = async (data: any) => {
    setIsLoading(true);
    try {
      // Clean phone to exactly 10 digits
      const mobileNumber = phone.replace(/\D/g, '').slice(-10);
      
      const res = await fetch('/api/auth/sync-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: mobileNumber, authData: data })
      });
      
      const result = await res.json();
      
      if (result.success) {
        localStorage.setItem("mehta_logged_in", "true");
        localStorage.setItem("mehta_user_phone", mobileNumber);
        
        if (result.customer) {
          localStorage.setItem("mehta_user_id", result.customer.id);
          if (result.customer.name) localStorage.setItem("mehta_user_name", result.customer.name);
          if (result.customer.email) localStorage.setItem("mehta_user_email", result.customer.email);
        }
        
        window.dispatchEvent(new Event("authUpdated"));
        
        const redirectUrl = searchParams.get("redirect") || "/account";
        router.push(redirectUrl);
      } else {
        setError(result.error || "Failed to sync account.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
      setIsLoading(false);
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
          <div className="w-20 h-20 bg-[#4A2F1F] rounded-full mx-auto flex items-center justify-center shadow-lg border-4 border-white mb-6">
            <span className="font-serif text-3xl font-bold text-[#FAF6EE]">M</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A2F1F] tracking-tight">
            Welcome Back
          </h1>
          <p className="text-[#8B7355] text-sm mt-3 font-medium">
            Login or create an account to track your orders and checkout faster.
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
            Secured by MSG91 Bank-Grade Authentication
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
