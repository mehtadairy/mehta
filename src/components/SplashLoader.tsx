"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashLoader() {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Show splash on every page load/refresh as requested
    setIsVisible(true);
    document.body.style.overflow = "hidden";

    // Progress bar animation
    const duration = 2200; // 2.2 seconds for full animation
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
        }, 300);
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
    hidden: { opacity: 0, y: 30, scale: 0.5 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        damping: 10,
        stiffness: 150,
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

          {/* Luxury Floating Decorative Stars */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[
              { top: "25%", left: "15%", delay: 0.3, size: 12 },
              { top: "20%", left: "80%", delay: 0.6, size: 16 },
              { top: "72%", left: "22%", delay: 0.9, size: 14 },
              { top: "65%", left: "75%", delay: 0.5, size: 18 },
              { top: "35%", left: "85%", delay: 1.1, size: 10 },
            ].map((star, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 0.5, 0], 
                  scale: [0, 1.2, 0],
                  y: [0, -20, 0] 
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: star.delay,
                  ease: "easeInOut"
                }}
                className="absolute text-brand-gold font-bold"
                style={{
                  top: star.top,
                  left: star.left,
                  fontSize: `${star.size}px`
                }}
              >
                ★
              </motion.span>
            ))}
          </div>

          <div className="relative flex flex-col items-center z-10">
            {/* Animated Cursive Brand Logo (Mehta Dairy) with thick outline */}
            <motion.div
              variants={textContainer}
              initial="hidden"
              animate="visible"
              className="flex items-center justify-center flex-wrap"
            >
              {/* "Mehta" */}
              <div className="flex">
                {"Mehta".split("").map((char, idx) => (
                  <motion.span
                    key={`mehta-${idx}`}
                    variants={letterVariants}
                    className="inline-block text-5xl sm:text-7xl md:text-8xl text-white font-bold tracking-tight"
                    style={{
                      fontFamily: "'Pacifico', cursive",
                      textShadow: `
                        -3px -3px 0 #5A3E2B,
                         3px -3px 0 #5A3E2B,
                        -3px  3px 0 #5A3E2B,
                         3px  3px 0 #5A3E2B,
                        -4px  0px 0 #5A3E2B,
                         4px  0px 0 #5A3E2B,
                         0px -4px 0 #5A3E2B,
                         0px  4px 0 #5A3E2B,
                         0px  8px 16px rgba(0,0,0,0.15)
                      `,
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>

              {/* Spacing between words */}
              <span className="w-4 sm:w-6" />

              {/* "Dairy" with dotless 'i' and custom star dot */}
              <div className="flex">
                {"Dairy".split("").map((char, idx) => {
                  const isI = char.toLowerCase() === "i";
                  return (
                    <motion.span
                      key={`dairy-${idx}`}
                      variants={letterVariants}
                      className="inline-block text-5xl sm:text-7xl md:text-8xl text-white font-bold tracking-tight"
                      style={{
                        fontFamily: "'Pacifico', cursive",
                        textShadow: `
                          -3px -3px 0 #5A3E2B,
                           3px -3px 0 #5A3E2B,
                          -3px  3px 0 #5A3E2B,
                           3px  3px 0 #5A3E2B,
                          -4px  0px 0 #5A3E2B,
                           4px  0px 0 #5A3E2B,
                           0px -4px 0 #5A3E2B,
                           0px  4px 0 #5A3E2B,
                           0px  8px 16px rgba(0,0,0,0.15)
                        `,
                      }}
                    >
                      {isI ? (
                        <span className="relative inline-block">
                          ı
                          <motion.span
                            initial={{ scale: 0, rotate: -45, y: -10, opacity: 0 }}
                            animate={{ scale: 1, rotate: 15, y: 0, opacity: 1 }}
                            transition={{ 
                              delay: 1.1, 
                              type: "spring", 
                              stiffness: 250,
                              damping: 10
                            }}
                            className="absolute -top-3 sm:-top-4 left-[2px] text-white"
                            style={{
                              textShadow: `
                                -2px -2px 0 #5A3E2B,
                                 2px -2px 0 #5A3E2B,
                                -2px  2px 0 #5A3E2B,
                                 2px  2px 0 #5A3E2B
                              `,
                            }}
                          >
                            ★
                          </motion.span>
                        </span>
                      ) : (
                        char
                      )}
                    </motion.span>
                  );
                })}
              </div>
            </motion.div>

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
