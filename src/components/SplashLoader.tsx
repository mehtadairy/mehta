"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashLoader() {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if intro has already been shown in this session
    const hasShown = sessionStorage.getItem("mehta_splash_shown") === "true";
    if (hasShown) {
      setIsVisible(false);
      return;
    }

    // Show splash
    setIsVisible(true);
    document.body.style.overflow = "hidden";

    // Progress bar animation
    const duration = 2000; // 2 seconds
    const intervalTime = 30;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const nextProgress = Math.min(100, Math.floor((currentStep / steps) * 100));
      setProgress(nextProgress);

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          setIsVisible(false);
          document.body.style.overflow = "";
          sessionStorage.setItem("mehta_splash_shown", "true");
        }, 300);
      }
    }, intervalTime);

    return () => {
      clearInterval(timer);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            y: -100,
            scale: 1.05,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#2A1E17] text-[#FCF9F2]"
        >
          {/* Shimmering Gold Radial Background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

          {/* Luxury Circular Logo Animation */}
          <div className="relative flex flex-col items-center z-10">
            {/* Pulsing Outer Ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.95, 1.05, 0.95],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{ 
                scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute h-36 w-36 sm:h-44 sm:w-44 rounded-full border border-[#d4af37]/30"
            />

            {/* Main Circular Badge */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 70, 
                damping: 15,
                delay: 0.1 
              }}
              className="relative flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-full bg-[#0a4d8c] border-3 border-[#d4af37] shadow-[0_0_35px_rgba(212,175,55,0.4)] text-center flex-col p-2 select-none"
            >
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-[0.45rem] sm:text-[0.55rem] font-bold text-white tracking-[0.15em] uppercase"
              >
                Since 1952
              </motion.span>
              <motion.span 
                initial={{ letterSpacing: "0.05em", opacity: 0 }}
                animate={{ letterSpacing: "0.15em", opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="font-serif text-sm sm:text-lg font-black text-[#f3efe7] tracking-widest my-1 sm:my-1.5"
              >
                MEHTA
              </motion.span>
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-[0.4rem] sm:text-[0.45rem] font-bold text-[#d4af37] uppercase tracking-[0.08em] leading-tight"
              >
                Sweet Mart
              </motion.span>
            </motion.div>

            {/* Glowing Brand Tagline */}
            <div className="mt-8 text-center px-4">
              <motion.h2
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-[0.62rem] sm:text-[0.68rem] tracking-[0.25em] font-bold text-[#d4af37] uppercase mb-1"
              >
                Crafting Luxury Delicacies
              </motion.h2>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 0.6 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className="text-[0.55rem] sm:text-[0.6rem] tracking-widest text-[#FCF9F2]/75 uppercase"
              >
                A Legacy of Pure Taste & Heritage
              </motion.p>
            </div>

            {/* Minimalist Shimmering Loading bar */}
            <div className="mt-10 w-48 sm:w-56 h-[2px] bg-[#FCF9F2]/10 rounded-full overflow-hidden relative">
              <motion.div
                className="h-full bg-[linear-gradient(90deg,#d4af37,#e8cc74,#d4af37)]"
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeInOut" }}
              />
            </div>
            
            {/* Loading text percentage */}
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              className="text-[0.55rem] font-mono mt-2 tracking-widest text-[#FCF9F2]"
            >
              {progress}%
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
