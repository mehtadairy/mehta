"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, ShieldCheck, Mail, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

function CompleteProfileContent() {
  const router = useRouter();
  
  const [isGoogleFlow, setIsGoogleFlow] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'DETAILS' | 'PHONE' | 'PHONE_OTP'>('DETAILS');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Check if they came from Google Auth
    const isPending = localStorage.getItem("mehta_pending_phone_verification");
    if (isPending) {
      setIsGoogleFlow(true);
      setStep('PHONE');
      setName(localStorage.getItem("mehta_user_name") || "");
      setEmail(localStorage.getItem("mehta_user_email") || "");
    } else {
      // It's a standard OTP login where they just need to complete their profile
      const loggedInPhone = localStorage.getItem("mehta_user_phone");
      if (!loggedInPhone && !localStorage.getItem("mehta_user_email")) {
        router.push("/login");
        return;
      }
      setPhone(loggedInPhone || '');

      const storedName = localStorage.getItem("mehta_user_name");
      const storedEmail = localStorage.getItem("mehta_user_email");

      if (storedName && storedName !== "null" && storedName.trim() !== "") {
        // If they already have a name, they don't need to complete profile
        router.push("/account");
        return;
      }

      setName(storedName && storedName !== "null" ? storedName : "");
      setEmail(storedEmail && storedEmail !== "null" ? storedEmail : "");
      setStep('DETAILS');
    }
  }, [router]);

  const handleNextToPhone = () => {
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    setError('');
    setStep('PHONE');
  };

  const handleSendOTP = async () => {
    setError('');
    setOtp('');
    
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      
      setIsLoading(false);
      if (data.success) {
        setStep('PHONE_OTP');
      } else {
        setError(data.error || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Failed to send OTP.');
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
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });
      const data = await res.json();
      
      if (data.success) {
        await handleSuccess();
      } else {
        setIsLoading(false);
        setError(data.error || 'Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Invalid OTP. Please try again.');
    }
  };

  const handleSuccess = async () => {
    try {
      const mobileNumber = phone.replace(/\D/g, '').slice(-10);
      const userId = localStorage.getItem("mehta_user_id");
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          userId, 
          email, 
          phone: mobileNumber,
          name: name.trim() 
        })
      });
      
      const result = await res.json();
      
      if (result.success) {
        if (mobileNumber) localStorage.setItem("mehta_user_phone", mobileNumber);
        if (name) localStorage.setItem("mehta_user_name", name);
        localStorage.removeItem("mehta_pending_phone_verification");
        window.dispatchEvent(new Event("authUpdated"));
        router.push("/account");
      } else {
        setError(result.error || "Failed to update profile.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  const handleSaveDetails = async () => {
    setError('');
    if (!otp || otp.length < 6) {
      setError("Please enter complete 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/whatsapp-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `91${phone}`,
          otp,
          reqId,
          intent: "signup",
          fullName: name,
          email,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Invalid OTP");
      }

      if (data.sessionToken) {
        document.cookie = `mehta_customer_session=${data.sessionToken}; path=/; max-age=2592000; SameSite=Lax`;
      }
      if (data.customer) {
        localStorage.setItem("mehta_customer_user", JSON.stringify(data.customer));
      }
      window.dispatchEvent(new Event("customerAuthChanged"));

      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || "Verification failed. Please check the OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/whatsapp-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `91${phone}`, intent: "signup" }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to resend OTP");
      }
      setError("Resent OTP successfully on WhatsApp!");
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "OTP") {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 sm:p-6 py-12">
        <WhatsAppOTPLayout
          phone={phone}
          otp={otp}
          setOtp={setOtp}
          onVerify={handleVerifyOTP}
          onChangeNumber={() => {
            setStep("PHONE");
            setOtp("");
            setError("");
          }}
          onResend={handleResendOTP}
          isLoading={isLoading}
          error={error}
          title="Complete Profile"
          subtitle="Verify your phone number to complete your account profile."
          buttonText="Verify OTP & Complete"
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
            Complete Profile
          </h1>
          <p className="text-[#7E6B5A] text-xs sm:text-sm mt-2 font-medium">
            Please enter your details to finalize registration.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white w-full rounded-[32px] shadow-2xl shadow-[#4A2F1F]/5 p-6 sm:p-8 border border-[#EFE9DF] relative overflow-hidden"
        >
          {step === "DETAILS" ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A2F1F] uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-[#8B7355]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 border-2 border-[#EAE0D3] rounded-2xl text-base font-bold text-[#4A2F1F] placeholder:text-[#8B7355]/50 focus:ring-0 focus:border-[#D97706] transition-all bg-[#FAF6EE]/30 focus:bg-white"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2F1F] uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-[#8B7355]" />
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 border-2 border-[#EAE0D3] rounded-2xl text-base font-bold text-[#4A2F1F] placeholder:text-[#8B7355]/50 focus:ring-0 focus:border-[#D97706] transition-all bg-[#FAF6EE]/30 focus:bg-white"
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
                onClick={handleNextToPhone}
                disabled={isLoading || !name || !email}
                className="w-full bg-[#4A2F1F] hover:bg-black text-white rounded-2xl py-4 px-6 font-bold text-base flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95 cursor-pointer mt-2"
              >
                Continue to Phone Verification
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A2F1F] uppercase tracking-wider mb-1.5">
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
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="block w-full pl-24 pr-4 py-3.5 border-2 border-[#EAE0D3] rounded-2xl text-base font-bold text-[#4A2F1F] placeholder:text-[#8B7355]/50 focus:ring-0 focus:border-[#D97706] transition-all bg-[#FAF6EE]/30 focus:bg-white"
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
                className="w-full bg-[#4A2F1F] hover:bg-black text-white rounded-2xl py-4 px-6 font-bold text-base flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95 cursor-pointer mt-2"
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
          )}

          <div className="mt-6 pt-5 border-t border-[#EAE0D3] flex items-center justify-center gap-2 text-xs font-semibold text-[#2E7D32]">
            <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
            Secured by WhatsApp
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#EAE0D3] border-t-[#D97706] rounded-full animate-spin"></div>
      </div>
    }>
      <CompleteProfileContent />
    </Suspense>
  );
}
