"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/context/LanguageContext";
import { trackLanguageChange } from "@/lib/gtag";

interface LanguageDropdownProps {
  buttonClassName?: string;
  iconClassName?: string;
  labelClassName?: string;
  alignRight?: boolean;
}

const LANGUAGES = [
  { code: "en" as const, label: "English", nativeName: "English" },
  { code: "gu" as const, label: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "hi" as const, label: "Hindi", nativeName: "हिंदी" },
];

export default function LanguageDropdown({
  buttonClassName = "flex items-center gap-1.5 p-1.5 px-3 text-[#2A1E17] hover:text-[#D46D2D] transition-colors rounded-full border border-[#EAE0D3] cursor-pointer bg-white/60 shadow-2xs hover:bg-white active:scale-95",
  iconClassName = "h-4 w-4 stroke-[2.2]",
  labelClassName = "text-[9px] font-extrabold uppercase tracking-wider",
  alignRight = true,
}: LanguageDropdownProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Clear timeout helper
  const clearCloseTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // 1. Mouse Enter (Desktop Hover): Open immediately & cancel any pending close timeout
  const handleMouseEnter = () => {
    clearCloseTimeout();
    setIsOpen(true);
  };

  // 2. Mouse Leave (Desktop Hover): Delay close by 200ms so cursor can cross gap safely
  const handleMouseLeave = () => {
    clearCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200); // 200ms buffer delay
  };

  // 3. Toggle button click (Mobile Tap & Desktop Click support)
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearCloseTimeout();
    setIsOpen((prev) => !prev);
  };

  // 4. Select language option
  const handleSelectLanguage = (langCode: "en" | "gu" | "hi") => {
    clearCloseTimeout();
    trackLanguageChange(langCode);
    setLanguage(langCode);
    setIsOpen(false);
  };

  // 5. Outside Click and Escape key handlers
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative inline-block text-left"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Toggle Button */}
      <button
        type="button"
        onClick={handleButtonClick}
        aria-expanded={isOpen}
        aria-label="Select Language"
        className={buttonClassName}
      >
        <Globe className={iconClassName} />
        <span className={labelClassName}>{language}</span>
      </button>

      {/* Dropdown Menu Container */}
      <AnimatePresence>
        {isOpen && (
          <div
            className={`absolute top-full ${
              alignRight ? "right-0" : "left-0"
            } pt-2 z-[100] min-w-[140px]`}
          >
            {/* Invisible hover bridge to eliminate gap causing mouseleave */}
            <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full rounded-2xl border border-[#EAE0D3] bg-white shadow-xl shadow-[#4A2F1F]/10 overflow-hidden py-1.5 backdrop-blur-md"
            >
              <div className="px-3 py-1.5 border-b border-[#FAF6EE] text-[10px] font-bold text-[#8B7355] uppercase tracking-wider">
                Select Language
              </div>

              {LANGUAGES.map((lang) => {
                const isActive = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#FAF6EE] text-[#D46D2D] font-extrabold"
                        : "text-[#4A2F1F] hover:bg-[#FAF6EE]/60 hover:text-[#D46D2D]"
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    {isActive && <Check className="h-3.5 w-3.5 text-[#D46D2D] stroke-[3]" />}
                  </button>
                );
              })}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
