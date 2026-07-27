"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, KeyRound } from "lucide-react";

interface AnimatedOTPProps {
  delay?: number;
  cardTitle?: string;
  cardDescription?: string;
}

export default function AnimatedOTP({
  delay = 3500,
  cardTitle = "Secure Access",
  cardDescription = "Protect accounts with a one-time password, auto-applied during every user login for enhanced security."
}: AnimatedOTPProps) {
  const code = ["4", "8", "9", "2", "3", "5"];
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [status, setStatus] = useState<"typing" | "success">("typing");

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    const startAnimation = () => {
      setStatus("typing");
      setDigits(["", "", "", "", "", ""]);
      setActiveIdx(0);

      // Type each digit sequentially
      code.forEach((char, idx) => {
        const t = setTimeout(() => {
          setDigits(prev => {
            const next = [...prev];
            next[idx] = char;
            return next;
          });
          setActiveIdx(idx + 1);

          // Once last digit is entered, trigger success
          if (idx === code.length - 1) {
            const tSuccess = setTimeout(() => {
              setStatus("success");
            }, 300);
            timers.push(tSuccess);
          }
        }, (idx + 1) * 350);
        timers.push(t);
      });
    };

    startAnimation();

    // Reset loop
    const totalTypingTime = code.length * 350 + 600;
    const interval = totalTypingTime + delay;

    const mainInterval = setInterval(() => {
      startAnimation();
    }, interval);

    return () => {
      timers.forEach(t => clearTimeout(t));
      clearInterval(mainInterval);
    };
  }, [delay]);

  return (
    <div className="w-full max-w-md bg-white/70 backdrop-blur-md border border-brand-beige rounded-2xl p-6 shadow-xl flex flex-col gap-6 items-center">
      {/* Icon Badge */}
      <div className="h-12 w-12 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange">
        <KeyRound className="h-6 w-6" />
      </div>

      {/* Title & Description */}
      <div className="text-center flex flex-col gap-1.5">
        <h3 className="font-serif text-base font-bold text-brand-charcoal">
          {cardTitle}
        </h3>
        <p className="text-[0.7rem] text-muted-foreground leading-relaxed max-w-sm">
          {cardDescription}
        </p>
      </div>

      {/* OTP Grid */}
      <div className="flex gap-2.5 justify-center items-center py-2">
        {Array.from({ length: 6 }).map((_, idx) => {
          const char = digits[idx];
          const isActive = idx === activeIdx && status === "typing";
          const isFilled = char !== "";
          const isVerifying = status === "success";

          return (
            <div
              key={idx}
              className={`relative h-11 w-9 rounded-xl border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                isVerifying
                  ? "border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                  : isActive
                  ? "border-brand-orange bg-brand-orange/5 shadow-[0_0_8px_rgba(212,109,45,0.25)] scale-105"
                  : isFilled
                  ? "border-brand-charcoal bg-brand-cream/10 text-brand-charcoal"
                  : "border-brand-beige bg-white text-muted-foreground"
              }`}
            >
              <AnimatePresence mode="popLayout">
                {char && (
                  <motion.span
                    initial={{ scale: 0.5, y: 5, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="font-mono text-base font-black"
                  >
                    {char}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Blinking Cursor */}
              {isActive && (
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute h-5 w-[2px] bg-brand-orange rounded-full"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Status Bar */}
      <div className="h-6 w-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-1 text-[0.68rem] text-emerald-600 font-bold"
            >
              <ShieldCheck className="h-4 w-4 animate-bounce" /> Verified Secure Access
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold"
            >
              Autofilling code...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
