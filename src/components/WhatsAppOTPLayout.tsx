"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Clock, RotateCcw } from "lucide-react";

interface WhatsAppOTPLayoutProps {
  phone: string;
  otp: string;
  setOtp: (val: string) => void;
  onVerify: () => void;
  onChangeNumber: () => void;
  onResend: () => void;
  isLoading?: boolean;
  error?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  expirySeconds?: number;
  resendCooldownSeconds?: number;
}

export default function WhatsAppOTPLayout({
  phone,
  otp,
  setOtp,
  onVerify,
  onChangeNumber,
  onResend,
  isLoading = false,
  error = "",
  title = "Welcome Back",
  subtitle = "Login to track your orders and checkout faster.",
  buttonText = "Verify OTP",
  expirySeconds = 120,
  resendCooldownSeconds = 30,
}: WhatsAppOTPLayoutProps) {
  const [expiryTimer, setExpiryTimer] = useState(expirySeconds);
  const [resendTimer, setResendTimer] = useState(resendCooldownSeconds);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Expiry Timer countdown
  useEffect(() => {
    setExpiryTimer(expirySeconds);
    const interval = setInterval(() => {
      setExpiryTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [expirySeconds]);

  // Resend Timer countdown
  useEffect(() => {
    setResendTimer(resendCooldownSeconds);
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldownSeconds]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const formattedPhone = phone.startsWith("+91")
    ? phone
    : `+91 ${phone.replace(/\D/g, "").slice(-10)}`;

  const otpDigits = Array.from({ length: 6 }).map((_, i) => otp[i] || "");

  const handleDigitChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/\D/g, "");
    
    // Handle paste of multiple digits
    if (cleanDigit.length > 1) {
      const pastedOtp = cleanDigit.slice(0, 6);
      setOtp(pastedOtp);
      const nextFocus = Math.min(pastedOtp.length, 5);
      inputRefs.current[nextFocus]?.focus();
      setFocusedIndex(nextFocus);
      return;
    }

    const newOtpArr = [...otpDigits];
    newOtpArr[index] = cleanDigit.slice(-1);
    const newOtp = newOtpArr.join("").trim();
    setOtp(newOtp);

    // Auto-advance focus
    if (cleanDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        // Move back and delete previous
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
        const newOtpArr = [...otpDigits];
        newOtpArr[index - 1] = "";
        setOtp(newOtpArr.join("").trim());
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleResendClick = () => {
    if (resendTimer > 0 || isLoading) return;
    setResendTimer(resendCooldownSeconds);
    setExpiryTimer(expirySeconds);
    onResend();
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      {/* Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 flex flex-col items-center"
      >
        {/* Mehta Dairy Gold Badge Header */}
        <div className="inline-flex items-center justify-center p-1 rounded-full border-2 border-[#D4AF37]/80 bg-[#FAF5EE] shadow-xs mb-4">
          <img
            src="/logo.png"
            alt="Mehta Dairy"
            className="h-12 w-auto object-contain px-2 py-0.5"
          />
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2A1E17] tracking-tight">
          {title}
        </h1>
        <p className="text-[#7E6B5A] text-xs sm:text-sm mt-2 font-medium">
          {subtitle}
        </p>
      </motion.div>

      {/* Main White Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08 }}
        className="bg-white w-full rounded-[32px] shadow-2xl shadow-[#4A2F1F]/5 p-6 sm:p-8 border border-[#EFE9DF] relative overflow-hidden flex flex-col gap-5"
      >
        {/* Header Row: Whatsapp Icon + Phone Number + Change Number Button */}
        <div className="flex items-center justify-between gap-3 pb-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#E8F5E9] rounded-full flex items-center justify-center shrink-0 border border-[#C8E6C9]">
              <svg className="w-6 h-6 fill-[#25D366]" viewBox="0 0 24 24">
                <path d="M12.031 0C5.398 0 0 5.397 0 12.03c0 2.124.553 4.197 1.608 6.023L0 24l6.168-1.577a11.968 11.968 0 005.863 1.536h.005c6.632 0 12.03-5.398 12.03-12.03C24.066 5.397 18.664 0 12.031 0zm5.993 17.073c-.25.7-.992 1.34-1.637 1.488-.445.1-.986.185-3.037-.626-2.585-1.02-4.25-3.666-4.38-3.834-.127-.168-1.037-1.38-1.037-2.634 0-1.253.655-1.868.892-2.122.247-.253.54-.316.719-.316.18 0 .359.002.518.01.168.008.397-.064.62.472.23.547.78 1.905.848 2.043.068.138.113.298.02.483-.092.185-.138.298-.276.462-.138.164-.29.367-.413.493-.138.138-.283.29-.122.566.162.276.718 1.185 1.542 1.92 1.06.945 1.954 1.238 2.23 1.376.276.138.437.115.598-.069.162-.185.69-0.806.874-1.082.184-.276.368-.23.621-.138.253.092 1.61.76 1.886.897.276.138.46.207.529.322.069.115.069.667-.18 1.367z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#8C7A6B] tracking-wider uppercase">
                ENTER OTP SENT TO
              </span>
              <span className="text-base sm:text-lg font-bold text-[#2A1E17] tracking-tight">
                {formattedPhone}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onChangeNumber}
            disabled={isLoading}
            className="rounded-full border border-[#E5C3A5] bg-white text-[#C86A28] text-xs font-bold px-3.5 py-1.5 hover:bg-[#FAF5EF] transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            Change Number
          </button>
        </div>

        {/* OTP Input Section */}
        <div className="flex flex-col items-center w-full">
          <label className="text-xs sm:text-sm font-bold text-[#7A6757] mb-3">
            Enter 6-digit OTP
          </label>

          {/* 6 Grid Box Inputs */}
          <div className="flex justify-between items-center w-full gap-1.5 sm:gap-2 my-1">
            {Array.from({ length: 6 }).map((_, idx) => {
              const digit = otpDigits[idx];
              const isFocused = focusedIndex === idx;

              return (
                <div key={idx} className="relative flex-1">
                  <input
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={6}
                    value={digit ? "*" : ""}
                    onFocus={() => setFocusedIndex(idx)}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={isLoading}
                    className={`w-full h-14 sm:h-16 rounded-xl sm:rounded-2xl text-center text-xl sm:text-2xl font-bold bg-[#FCFBF8] transition-all cursor-text text-[#2A1E17] ${
                      isFocused
                        ? "border-2 border-[#D97706] ring-2 ring-[#D97706]/15 bg-white"
                        : digit
                        ? "border border-[#D4A066]/60 bg-white"
                        : "border border-[#EAE2D5]"
                    }`}
                  />
                  {/* Overlay text showing asterisk * or value */}
                  <div
                    onClick={() => inputRefs.current[idx]?.focus()}
                    className="absolute inset-0 flex items-center justify-center text-xl sm:text-2xl font-bold text-[#2A1E17] pointer-events-none"
                  >
                    {digit ? "*" : ""}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expiry Timer */}
          <div className="flex items-center gap-1.5 text-xs text-[#7A6757] font-medium mt-3">
            <Clock className="w-4 h-4 text-[#7A6757]" />
            <span>
              OTP expires in{" "}
              <strong className="text-[#D46D2D] font-bold">
                {formatTimer(expiryTimer)}
              </strong>
            </span>
          </div>

          {/* Error / Success message */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-xs font-bold mt-2 text-center ${
                error.toLowerCase().includes("sent") || error.toLowerCase().includes("resent")
                  ? "text-emerald-600"
                  : "text-red-500"
              }`}
            >
              {error}
            </motion.p>
          )}
        </div>

        {/* Primary Verify Button */}
        <button
          type="button"
          onClick={onVerify}
          disabled={isLoading || otp.length < 6}
          className="w-full bg-[#D97706] hover:bg-[#C86200] active:scale-[0.99] text-white rounded-2xl sm:rounded-3xl py-4 px-6 font-bold text-base flex justify-center items-center gap-2 shadow-md shadow-[#D97706]/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <>
              <span>{buttonText}</span>
              <ShieldCheck className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Separator */}
        <div className="relative flex items-center justify-center my-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#EAE2D5]" />
          </div>
          <span className="relative bg-white px-3 text-xs text-[#8C7A6B] font-medium">
            or
          </span>
        </div>

        {/* Resend Section */}
        <div className="flex flex-col items-center gap-1 text-center">
          <button
            type="button"
            onClick={handleResendClick}
            disabled={resendTimer > 0 || isLoading}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#D46D2D] hover:text-[#B8571B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resend OTP</span>
          </button>
          <span className="text-xs text-[#7A6757] font-medium">
            {resendTimer > 0
              ? `You can resend OTP in ${formatTimer(resendTimer)}`
              : "Didn't receive OTP? Click above to resend"}
          </span>
        </div>

        {/* Card Footer */}
        <div className="pt-4 border-t border-[#EAE2D5] -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 mt-2 p-4 bg-[#FAF7F2] rounded-b-[32px] flex items-center justify-center gap-2 text-xs font-semibold text-[#2E7D32]">
          <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
          <span>Secured by WhatsApp</span>
        </div>
      </motion.div>
    </div>
  );
}
