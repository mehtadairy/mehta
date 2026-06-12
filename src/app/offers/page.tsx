"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { Copy, Check, Clock, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CouponOffer {
  code: string;
  discountType: "percentage" | "fixed";
  value: number;
  minOrderValue: number;
  description: string;
  badge: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring" as const, 
      stiffness: 90, 
      damping: 15 
    } 
  }
} as const;

export default function OffersPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState("05h 23m 44s");

  const couponOffers: CouponOffer[] = [
    {
      code: "WELCOME50",
      discountType: "fixed",
      value: 50,
      minOrderValue: 300,
      description: "Get flat ₹50 off on your first order above ₹300. Welcome to the family!",
      badge: "NEW CUSTOMER"
    },
    {
      code: "FESTIVE15",
      discountType: "percentage",
      value: 15,
      minOrderValue: 1000,
      description: "Get 15% off on orders above ₹1000. Celebrate local festivals with premium sweets.",
      badge: "FESTIVE DEAL"
    },
    {
      code: "MEHTASWEET",
      discountType: "percentage",
      value: 10,
      minOrderValue: 500,
      description: "Get 10% off on your sweet orders above ₹500. Handcrafted with pure ghee.",
      badge: "SWEETS SPECIAL"
    }
  ];

  useEffect(() => {
    const target = new Date();
    target.setHours(23, 59, 59, 999);

    const timer = setInterval(() => {
      const now = new Date();
      let diff = target.getTime() - now.getTime();
      
      if (diff <= 0) {
        target.setDate(target.getDate() + 1);
        diff = target.getTime() - now.getTime();
      }

      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      
      const format = (n: number) => String(n).padStart(2, "0");
      setTimeLeft(`${format(hrs)}h ${format(mins)}m ${format(secs)}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <>
      <Header />
      <WhatsAppFloat />

      {/* --- TITLE HEADER WITH SLOW SCALE AND TRANSITION --- */}
      <section className="relative text-white overflow-hidden bg-gradient-to-r from-[#800c0c] via-[#4d0707] to-[#240303] pt-28 sm:pt-36 pb-16">
        {/* Decorative Grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40"></div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10 flex flex-col items-center">
          <motion.h2 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-serif text-3xl sm:text-5xl font-extrabold tracking-wide drop-shadow-sm uppercase"
          >
            Exclusive Offers & Coupons
          </motion.h2>
          
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="h-0.5 w-16 bg-brand-gold my-4 origin-center"
          ></motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xs sm:text-sm text-brand-cream/80 max-w-2xl leading-relaxed text-center drop-shadow-xs"
          >
            Savor Ahmedabad's legendary sweet and farsan delicacies with active discounts and seasonal promo codes.
          </motion.p>

          {/* Premium Countdown Clock */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
            className="mt-8 flex items-center gap-3 bg-black/45 backdrop-blur-md border border-[#e8dcc4]/20 rounded-full px-5 py-2.5 text-xs font-semibold text-brand-cream tracking-wide shadow-lg"
          >
            <Clock className="w-4 h-4 text-brand-gold animate-spin-[20s_linear_infinite]" />
            <span>DEALS EXPIRE IN:</span>
            <span className="font-mono text-brand-gold font-bold bg-white/10 px-3 py-1 rounded-full text-sm">
              {timeLeft}
            </span>
          </motion.div>
        </div>
      </section>

      {/* --- CONTENT AREA --- */}
      <section className="py-16 bg-[#faf9f6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Coupons Section */}
          <div className="mb-16">
            <motion.h3 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-xl sm:text-2xl font-bold text-brand-charcoal text-center mb-2"
            >
              Active Coupon Codes
            </motion.h3>
            
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xs text-muted-foreground text-center mb-12 max-w-md mx-auto"
            >
              Copy any of the discount codes below and paste them at the checkout billing page to claim your savings.
            </motion.p>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {couponOffers.map((offer) => (
                <motion.div 
                  key={offer.code} 
                  variants={cardVariants}
                  whileHover={{ y: -6, boxShadow: "0 10px 25px -5px rgba(166, 28, 28, 0.08), 0 8px 10px -6px rgba(166, 28, 28, 0.08)" }}
                  className="bg-white border border-brand-beige rounded-2xl p-6 shadow-2xs relative flex flex-col justify-between transition-shadow duration-300"
                >
                  <motion.span 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    className="absolute top-4 right-4 text-[0.62rem] font-bold text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-full border border-brand-orange/20 tracking-wider font-sans"
                  >
                    {offer.badge}
                  </motion.span>

                  <div className="mt-4">
                    <div className="flex items-center gap-1.5 text-brand-gold">
                      <Sparkles className="w-4 h-4 fill-brand-gold/10" />
                      <span className="text-[0.65rem] font-extrabold uppercase tracking-widest font-sans">Special Offer</span>
                    </div>
                    <h4 className="font-serif text-3xl font-black text-brand-charcoal mt-1">
                      {offer.discountType === "percentage" ? `${offer.value}% OFF` : `₹${offer.value} OFF`}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed min-h-[40px]">
                      {offer.description}
                    </p>
                    <span className="text-[0.68rem] text-brand-gold font-bold block mt-3 uppercase tracking-wider font-sans">
                      Min. Order: ₹{offer.minOrderValue}
                    </span>
                  </div>

                  <div className="mt-6 pt-4 border-t border-brand-beige flex items-center justify-between gap-4">
                    <div className="bg-brand-cream border border-[#e8dcc4] rounded-lg px-3.5 py-2.5 font-mono text-xs font-bold text-brand-charcoal select-all">
                      {offer.code}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCopyCode(offer.code)}
                      className={`inline-flex items-center justify-center rounded-lg px-4.5 py-2.5 text-xs font-bold transition-all uppercase tracking-wider ${
                        copiedCode === offer.code
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-brand-charcoal text-white hover:bg-brand-orange shadow-xs"
                      }`}
                    >
                      {copiedCode === offer.code ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1" /> Copy Code
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Bulk Deals Segment with Scroll animation */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="bg-[#fdfaf2] border border-[#e8dcc4] rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-3xs"
          >
            <div className="max-w-xl">
              <span className="text-[0.68rem] font-bold text-brand-gold uppercase tracking-widest block mb-2 font-sans">
                BULK ORDERING / CORPORATE
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-charcoal mb-3">
                Planning a Festive Event or Corporate Gifting?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Get custom assortments, vacuum-sealed premium boxes, and flat **20% off** on bulk purchases above ₹5,000. Perfect for Rakhi, Diwali, corporate rewards, and family events.
              </p>
            </div>
            
            <motion.a 
              whileHover={{ scale: 1.05, boxShadow: "0 4px 15px rgba(37, 211, 102, 0.35)" }}
              whileTap={{ scale: 0.95 }}
              href="https://wa.me/919876543210?text=Hi,%20I'm%20interested%20in%20placing%20a%20bulk/corporate%20order."
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-[#25d366] hover:bg-[#20ba56] text-white font-bold text-xs uppercase px-6 py-3.5 shadow-sm transition-all tracking-wider shrink-0 text-center"
            >
              Enquire on WhatsApp
            </motion.a>
          </motion.div>

        </div>
      </section>

      <Footer />
    </>
  );
}
