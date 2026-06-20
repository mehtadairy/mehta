"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-6 text-center relative overflow-hidden pt-20 pb-32">
      {/* Decorative Background Elements */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-brand-gold/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-md w-full"
      >
        <div className="mb-8 relative inline-block">
          <div className="text-[150px] md:text-[200px] font-black text-brand-beige/40 leading-none select-none tracking-tighter">
            404
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-full shadow-2xl border-4 border-brand-cream"
          >
            <span className="text-4xl">🍬</span>
          </motion.div>
        </div>

        <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-charcoal mb-4">
          Oops!
        </h1>
        <p className="text-muted-foreground text-sm md:text-base mb-10 leading-relaxed max-w-sm mx-auto">
          This sweet could not be found. It seems you've wandered into an empty box. Let's get you back to the fresh ones!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/shop"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orange-hover text-white px-8 py-4 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-orange/20"
          >
            <ShoppingBag className="w-5 h-5" />
            Back To Shop
          </Link>
          <Link 
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-brand-cream text-brand-charcoal px-8 py-4 rounded-full font-bold transition-all border border-brand-beige hover:border-brand-gold active:scale-95"
          >
            <Home className="w-5 h-5" />
            Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
