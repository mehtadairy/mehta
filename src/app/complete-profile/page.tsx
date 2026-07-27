"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, ShieldCheck, Mail, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function CompleteProfilePage() {
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
    if (!name || name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    setIsLoading(true);
    await handleSuccess();
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
            {isGoogleFlow 
              ? "Please verify your mobile number to complete your registration." 
              : "Just a few more details to set up your account."}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white w-full rounded-3xl shadow-xl shadow-[#4A2F1F]/5 p-6 sm:p-8 border border-[#EAE0D3]/50 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D97706] to-[#F59E0B]" />

          {step === 'DETAILS' ? (
             <div className="flex flex-col gap-5">
               <div>
                 <label className="block text-xs font-bold text-[#4A2F1F] uppercase tracking-wider mb-2">
                   Full Name *
                 </label>
                 <div className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <User className="h-5 w-5 text-[#8B7355] group-focus-within:text-[#D97706] transition-colors" />
                   </div>
                   <input
                     type="text"
                     placeholder="Enter your name"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     className="block w-full pl-12 pr-4 py-4 border-2 border-[#EAE0D3] rounded-2xl text-base font-bold text-[#4A2F1F] placeholder:text-[#8B7355]/50 focus:ring-0 focus:border-[#D97706] transition-all bg-[#FAF6EE]/30 focus:bg-white"
                     disabled={isLoading}
                   />
                 </div>
               </div>
               
               <div>
                 <label className="block text-xs font-bold text-[#4A2F1F] uppercase tracking-wider mb-2">
                   Email Address (Optional)
                 </label>
                 <div className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <Mail className="h-5 w-5 text-[#8B7355] group-focus-within:text-[#D97706] transition-colors" />
                   </div>
                   <input
                     type="email"
                     placeholder="Enter your email"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="block w-full pl-12 pr-4 py-4 border-2 border-[#EAE0D3] rounded-2xl text-base font-bold text-[#4A2F1F] placeholder:text-[#8B7355]/50 focus:ring-0 focus:border-[#D97706] transition-all bg-[#FAF6EE]/30 focus:bg-white"
                     disabled={isLoading}
                   />
                 </div>
               </div>

               {error && (
                 <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs font-bold mt-2 ml-1">
                   {error}
                 </motion.p>
               )}

               <button
                 onClick={handleSaveDetails}
                 disabled={isLoading || !name}
                 className="w-full bg-[#4A2F1F] hover:bg-black text-white rounded-2xl py-4 px-6 font-bold text-base flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
               >
                 {isLoading ? (
                   <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                 ) : (
                   <>
                     Save Profile
                     <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                   </>
                 )}
               </button>
             </div>
          ) : step === 'PHONE' ? (
            <div className="flex flex-col gap-5">
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
                  onClick={handleSendOTP}
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
            Secured by WhatsApp & AiSensy
          </div>
        </motion.div>
      </div>
    </div>
  );
}
