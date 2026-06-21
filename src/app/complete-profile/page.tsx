"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, ShieldCheck, Mail, User } from 'lucide-react';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Load User Data & MSG91 Widget SDK
  useEffect(() => {
    // Check if they came from Google Auth
    const isPending = localStorage.getItem("mehta_pending_phone_verification");
    if (!isPending && !localStorage.getItem("mehta_user_email")) {
      router.push("/login");
      return;
    }

    setName(localStorage.getItem("mehta_user_name") || "");
    setEmail(localStorage.getItem("mehta_user_email") || "");

    const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
    const tokenAuth = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH;
    
    if (!widgetId || !tokenAuth) return;

    const scriptId = 'msg91-widget-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://verify.msg91.com/otp-provider.js';
      script.async = true;
      script.onload = () => {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.initSendOTP) {
          // @ts-ignore
          window.initSendOTP({
            widgetId: widgetId,
            tokenAuth: tokenAuth,
            exposeMethods: true,
            success: (data: any) => console.log('OTP verified from global success', data),
            failure: (err: any) => console.log('OTP global failure', err)
          });
        }
      };
      document.body.appendChild(script);
    }
  }, [router]);

  const handleSendOTP = () => {
    setError('');
    
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
    if (!widgetId) {
      // Mock flow
      setStep('OTP');
      return;
    }

    setIsLoading(true);
    // @ts-ignore
    if (typeof window !== 'undefined' && window.sendOtp) {
      // @ts-ignore
      window.sendOtp(
        `91${phone}`,
        (data: any) => {
          setIsLoading(false);
          setStep('OTP');
        },
        (err: any) => {
          setIsLoading(false);
          setError(err?.message || 'Failed to send OTP. Please try again.');
        }
      );
    } else {
      setIsLoading(false);
      setError("OTP Service is not fully loaded. Please wait a moment or refresh.");
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    
    if (otp.length < 4) {
      setError('Please enter a valid OTP.');
      return;
    }

    const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
    
    if (!widgetId) {
      // Mock flow
      await handleSuccess({ message: "Mock OTP Success" });
      return;
    }

    setIsLoading(true);
    // @ts-ignore
    if (typeof window !== 'undefined' && window.verifyOtp) {
      // @ts-ignore
      window.verifyOtp(
        otp,
        async (data: any) => {
          await handleSuccess(data);
        },
        (err: any) => {
          setIsLoading(false);
          setError(err?.message || 'Invalid OTP. Please try again.');
        }
      );
    }
  };

  const handleSuccess = async (data: any) => {
    try {
      const mobileNumber = phone.replace(/\D/g, '').slice(-10);
      const userId = localStorage.getItem("mehta_user_id");
      
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, phone: mobileNumber, authData: data })
      });
      
      const result = await res.json();
      
      if (result.success) {
        localStorage.setItem("mehta_user_phone", mobileNumber);
        localStorage.removeItem("mehta_pending_phone_verification");
        window.dispatchEvent(new Event("authUpdated"));
        router.push("/account");
      } else {
        setError(result.error || "Failed to link phone to account.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  const handleResendOTP = () => {
    setError('');
    setIsLoading(true);
    // @ts-ignore
    if (typeof window !== 'undefined' && window.retryOtp) {
      // @ts-ignore
      window.retryOtp(
        null,
        (data: any) => {
          setIsLoading(false);
          setError("OTP Resent successfully!");
        },
        (err: any) => {
          setIsLoading(false);
          setError(err?.message || 'Failed to resend OTP.');
        }
      );
    } else {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] flex flex-col pt-16 sm:pt-20">
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 max-w-md mx-auto w-full mb-12">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 w-full"
        >
          <div className="w-20 h-20 bg-[#4A2F1F] rounded-full mx-auto flex items-center justify-center shadow-lg border-4 border-white mb-6">
            <span className="font-serif text-3xl font-bold text-[#FAF6EE]">M</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A2F1F] tracking-tight">
            Complete Profile
          </h1>
          <p className="text-[#8B7355] text-sm mt-3 font-medium">
            Please verify your mobile number to complete your registration.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white w-full rounded-3xl shadow-xl shadow-[#4A2F1F]/5 p-6 sm:p-8 border border-[#EAE0D3]/50 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D97706] to-[#F59E0B]" />

          {/* Read-only Google Info */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-[#8B7355]" />
              </div>
              <input
                type="text"
                value={name}
                className="block w-full pl-11 pr-4 py-3 border border-[#EAE0D3] rounded-xl text-sm font-bold text-[#8B7355] bg-gray-50/50"
                disabled
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-[#8B7355]" />
              </div>
              <input
                type="email"
                value={email}
                className="block w-full pl-11 pr-4 py-3 border border-[#EAE0D3] rounded-xl text-sm font-bold text-[#8B7355] bg-gray-50/50"
                disabled
              />
            </div>
          </div>

          {step === 'PHONE' ? (
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-[#4A2F1F] uppercase tracking-wider mb-2">
                  Mobile Number *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-[#4A2F1F] font-bold text-base">+91</span>
                    <div className="h-5 w-px bg-[#EAE0D3] mx-3" />
                    <Phone className="h-5 w-5 text-[#8B7355] group-focus-within:text-[#D97706] transition-colors" />
                  </div>
                  <input
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
                onClick={handleSendOTP}
                disabled={isLoading || phone.length !== 10}
                className="w-full bg-[#4A2F1F] hover:bg-black text-white rounded-2xl py-4 px-6 font-bold text-base flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
              >
                {isLoading ? (
                  <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    Send OTP Verification
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
