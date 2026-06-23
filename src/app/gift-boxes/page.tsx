"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Gift, Building2, Heart, Star, ChevronRight } from "lucide-react";
import WhatsAppOrderBtn from "@/components/WhatsAppOrderBtn";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BUSINESS } from "@/lib/businessConfig";

const GIFT_CATEGORIES = [
  {
    id: "festival",
    title: "Festival Gift Boxes",
    description: "Curated assortments of premium sweets for Diwali, Raksha Bandhan, and festive celebrations.",
    icon: Star,
    priceRange: "₹850 - ₹2500",
    color: "from-orange-100 to-amber-50"
  },
  {
    id: "wedding",
    title: "Wedding Gift Packs",
    description: "Elegant, personalized hampers to share your joy with friends and family on your special day.",
    icon: Heart,
    priceRange: "₹1200 - ₹5000",
    color: "from-pink-100 to-rose-50"
  },
  {
    id: "corporate",
    title: "Corporate Gifts",
    description: "Sophisticated packaging with bulk-order discounts for your employees and business partners.",
    icon: Building2,
    priceRange: "Custom Pricing",
    color: "from-blue-100 to-indigo-50"
  },
  {
    id: "jain",
    title: "Jain Pilgrim Packs",
    description: "Specially prepared following strict Jain dietary guidelines for religious trips and pilgrimages.",
    icon: Gift,
    priceRange: "₹500 - ₹1500",
    color: "from-emerald-100 to-teal-50"
  }
];

export default function GiftBoxesPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <Header />
      
      <main className="pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-brand-charcoal text-white py-20 lg:py-32 rounded-b-[40px] shadow-2xl mb-16 mx-2 lg:mx-4">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-orange/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>
          
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block py-1.5 px-4 rounded-full bg-brand-gold/20 border border-brand-gold/40 text-brand-gold text-xs font-bold uppercase tracking-widest mb-6">
                Premium Collection
              </span>
              <h1 className="font-serif text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                The Art of Gifting <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-brand-orange">
                  by {BUSINESS.shortName}
                </span>
              </h1>
              <p className="text-white/80 max-w-2xl mx-auto text-sm lg:text-base leading-relaxed mb-10">
                Share the sweetness of our 50-year legacy with your loved ones. Our premium gift boxes are meticulously crafted for every occasion, blending traditional taste with modern luxury.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <a href="#collections" className="bg-brand-gold hover:bg-yellow-600 text-brand-charcoal px-8 py-4 rounded-full font-bold transition-all w-full sm:w-auto text-sm">
                  Explore Collections
                </a>
                <WhatsAppOrderBtn 
                  messagePrefix={`Hello ${BUSINESS.shortName}, I'm interested in bulk corporate gifting.`}
                  className="w-full sm:w-auto"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Collections Grid */}
        <section id="collections" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-charcoal mb-4">Curated for Every Occasion</h2>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">From intimate weddings to large corporate events, our bespoke gift boxes make every celebration sweeter.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {GIFT_CATEGORIES.map((cat, idx) => (
              <motion.div 
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-gradient-to-br ${cat.color} rounded-3xl p-8 lg:p-10 border border-white/50 shadow-xl overflow-hidden relative group`}
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <cat.icon className="w-40 h-40" />
                </div>
                
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                    <cat.icon className="w-7 h-7 text-brand-charcoal" />
                  </div>
                  
                  <h3 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">{cat.title}</h3>
                  <p className="text-brand-charcoal/70 text-sm leading-relaxed mb-6 max-w-sm">
                    {cat.description}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-8">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/50">Starts from</span>
                    <span className="text-brand-charcoal font-black">{cat.priceRange}</span>
                  </div>

                  <WhatsAppOrderBtn 
                    messagePrefix={`Hello ${BUSINESS.shortName}, I want to inquire about the ${cat.title}.`}
                    className="w-full sm:w-max !bg-brand-charcoal hover:!bg-black !text-white !shadow-none"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Customization Banner */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-3xl p-8 lg:p-12 border border-brand-beige shadow-sm flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <span className="text-brand-orange text-xs font-bold uppercase tracking-widest mb-2 block">Make It Yours</span>
              <h2 className="font-serif text-3xl font-bold text-brand-charcoal mb-4">100% Customizable</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Want to mix and match? Add your company logo? Include a personalized note? Our gifting experts are here to help you design the perfect box that fits your budget and taste.
              </p>
              <ul className="flex flex-col gap-3 mb-8">
                {['Custom branding & sleeves', 'Choice of sweets & dry fruits', 'Personalized greeting cards', 'Pan-India direct delivery'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-brand-charcoal font-medium">
                    <div className="w-5 h-5 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">✓</div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <div className="bg-brand-cream p-6 rounded-2xl text-center border border-brand-beige">
                <h4 className="font-serif font-bold text-brand-charcoal mb-2">Speak to our Gifting Expert</h4>
                <p className="text-xs text-muted-foreground mb-4">Get a customized quote within 24 hours.</p>
                <a href={`tel:${BUSINESS.phoneTel}`} className="bg-white border border-brand-beige text-brand-charcoal hover:border-brand-orange font-bold py-3 px-6 rounded-xl block w-full transition-colors text-sm mb-3">
                  Call {BUSINESS.phone}
                </a>
                <WhatsAppOrderBtn 
                  messagePrefix="Hello, I need help customizing a gift box order."
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
