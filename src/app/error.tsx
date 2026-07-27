"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error("Global App Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-6 text-center relative overflow-hidden pt-20 pb-32">
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-red-500/5 rounded-full blur-3xl" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-md w-full bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-brand-beige"
      >
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="font-serif text-2xl md:text-3xl font-bold text-brand-charcoal mb-4">
          Something went wrong!
        </h1>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          We apologize for the inconvenience. Our technical team has been notified. Please try again in a moment.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 bg-brand-charcoal hover:bg-black text-white px-6 py-4 rounded-xl font-bold transition-all active:scale-95 shadow-md"
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>
          <Link 
            href="/"
            className="w-full flex items-center justify-center gap-2 bg-brand-cream hover:bg-[#EAE0D3] text-brand-charcoal px-6 py-4 rounded-xl font-bold transition-all active:scale-95 border border-brand-beige"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
