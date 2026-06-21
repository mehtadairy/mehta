"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashLoader() {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Skip splash on repeat visits for better performance
    if (localStorage.getItem('splash_seen')) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    document.body.style.overflow = "hidden";

    // Progress bar animation (1.2 seconds for full animation)
    const duration = 1200; 
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
          localStorage.setItem('splash_seen', 'true');
        }, 150);
      }
    }, intervalTime);

    return () => {
      clearInterval(timer);
      document.body.style.overflow = "";
    };
  }, []);

  // Framer Motion Variants for Staggered Letter Entrance
  const textContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

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
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#FCF9F2] overflow-hidden select-none"
        >
          {/* Load external Google Font Pacifico self-contained */}
          <style dangerouslySetInnerHTML={{ __html: `
            @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');
          `}} />

          {/* Shimmering Gold Radial Background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,155,60,0.08)_0%,rgba(0,0,0,0)_75%)] pointer-events-none" />

          <div className="relative flex flex-col items-center z-10">
            {/* Static Brand Logo (Mehta Dairy) for better mobile performance */}
            <div className="flex items-center justify-center flex-wrap">
              <span
                className="inline-block text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight"
                style={{
                  fontFamily: "'Pacifico', cursive",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
                  color: "#5A3E2B",
                }}
              >
                Mehta
              </span>

              <span className="w-4 sm:w-6" />

              <span
                className="inline-block text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight"
                style={{
                  fontFamily: "'Pacifico', cursive",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
                  color: "#5A3E2B",
                }}
              >
                Dairy
              </span>
            </div>

            {/* Glowing Brand Tagline */}
            <div className="mt-8 text-center px-4">
              <motion.h2
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="text-[0.62rem] sm:text-[0.68rem] tracking-[0.25em] font-bold text-[#C89B3C] uppercase mb-1"
              >
                Since 1972 • Premium Heritage
              </motion.h2>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 0.6 }}
                transition={{ delay: 1.4, duration: 0.5 }}
                className="text-[0.55rem] sm:text-[0.6rem] tracking-widest text-[#5A3E2B] uppercase font-bold"
              >
                A Legacy of Pure Taste & Heritage
              </motion.p>
            </div>

            {/* Minimalist Shimmering Loading bar */}
            <div className="mt-12 w-48 sm:w-56 h-[3px] bg-[#5A3E2B]/10 rounded-full overflow-hidden relative">
              <motion.div
                className="h-full bg-[linear-gradient(90deg,#5A3E2B,#C89B3C,#5A3E2B)]"
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeInOut" }}
              />
            </div>
            
            {/* Loading text percentage */}
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              className="text-[0.6rem] font-mono mt-3 tracking-widest text-[#5A3E2B] font-bold"
            >
              {progress}%
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
