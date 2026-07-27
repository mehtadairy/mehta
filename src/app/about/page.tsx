"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import {
  Sparkles,
  Award,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Mail
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BUSINESS } from "@/lib/businessConfig";
import Image from "next/image";

// Shared easing curve — premium, no bounce
const ease = [0.16, 1, 0.3, 1] as const;

// Reusable fade-up variant factory
const fadeUp = (delay = 0, distance = 30) => ({
  initial: { opacity: 0, y: distance },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 as const },
  transition: { duration: 0.9, ease, delay },
});

// Stagger container helper
const staggerContainer = (staggerChildren = 0.1) => ({
  initial: "hidden",
  whileInView: "visible",
  viewport: { once: true, amount: 0.15 as const },
  variants: {
    hidden: {},
    visible: { transition: { staggerChildren } },
  },
});

// Stagger child card
const staggerCard = {
  hidden: { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

export default function About() {
  // Split headline into individual letters for animation
  const headline = BUSINESS.shortName.toUpperCase();

  return (
    <div className="bg-[#FAF6EE] min-h-screen text-[#2C2C2C] selection:bg-[#D97706]/20">
      <Header />
      <WhatsAppFloat />

      {/* --- SECTION 1: HERO (cinematic entry) --- */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background image: scale-in on load */}
        <motion.div
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/store_outside.jpeg')" }}
        />

        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.0, delay: 0.3 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
        />

        <div className="relative z-10 text-center max-w-4xl px-4 flex flex-col items-center gap-4">
          {/* Tag: fade in first */}
          <motion.span
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease }}
            className="text-[0.7rem] font-bold text-[#C9A227] uppercase tracking-[0.3em] block"
          >
            Palitana, Gujarat
          </motion.span>

          {/* Headline: letter-by-letter reveal inside word groups */}
          <h1 className="font-serif text-5xl sm:text-6xl font-bold text-white tracking-wide uppercase overflow-hidden">
            {headline.split(" ").map((word, wordIdx) => (
              <span key={wordIdx} className="inline-block whitespace-nowrap mr-[0.3em]">
                {word.split("").map((char, charIdx) => {
                  const globalIdx = wordIdx * 10 + charIdx; // Approximate index for delay
                  return (
                    <motion.span
                      key={globalIdx}
                      className="inline-block"
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.6 + globalIdx * 0.045,
                        ease,
                      }}
                    >
                      {char}
                    </motion.span>
                  );
                })}
              </span>
            ))}
          </h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, ease }}
            className="font-serif text-xl sm:text-2xl italic text-[#FAF6EE]/90"
          >
            Serving Palitana Since 1972
          </motion.p>

          {/* Gold Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 1.4, ease }}
            className="h-0.5 w-16 bg-[#C9A227] origin-left"
          />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.6 }}
            className="text-xs sm:text-sm text-white/80 uppercase tracking-widest max-w-lg leading-relaxed"
          >
            More Than 50 Years of Trust, Tradition &amp; Quality
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.8, ease }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="mt-4"
          >
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-xl bg-[#FAF6EE] text-[#4A2F1F] hover:bg-[#FAF6EE]/90 px-8 py-3.5 text-xs font-bold uppercase tracking-wider shadow-md transition-all"
            >
              Explore Products
            </Link>
          </motion.div>
        </div>
      </section>

      {/* --- SECTION 2: OUR STORY (slide-in from sides) --- */}
      <section className="py-24 bg-white border-b border-[#4A2F1F]/10 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Story Content Left — slides from left */}
            <motion.div
              initial={{ opacity: 0, x: -70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.0, ease }}
              className="flex flex-col gap-6"
            >
              {/* Badge */}
              <motion.span
                {...fadeUp(0.05)}
                className="text-[0.68rem] font-bold text-[#D97706] uppercase tracking-[0.25em] flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-[#C9A227]" /> Since 1972 Legacy
              </motion.span>

              {/* "Our Story" — word-by-word */}
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A2F1F] leading-tight overflow-hidden">
                {"Our Story".split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    className="inline-block mr-3"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.7, delay: 0.1 + i * 0.12, ease }}
                  >
                    {word}
                  </motion.span>
                ))}
              </h2>

              {/* Divider draw */}
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3, ease }}
                className="h-0.5 w-16 bg-[#C9A227] origin-left"
              />

              {/* Paragraphs stagger */}
              {[
                <>Established in {BUSINESS.foundedYear} in the sacred hills of Palitana, <strong className="text-[#4A2F1F]">{BUSINESS.name}</strong> was born out of a simple promise: to craft sweets that carry the warmth of home. Founded by <strong className="text-[#4A2F1F]">Shri Khantilal Tribhovandas Mehta</strong>, we began by serving authentic, pure delicacies to pilgrims and families.</>,
                <>For over five decades, we have honored traditional family recipes passed down through generations. By utilizing only the purest ingredients and handcrafted care, our sweets have become a symbol of family trust, purity, and authentic taste.</>,
                <>Today, under the leadership of <strong className="text-[#4A2F1F]">Shri Jaydeepbhai Bhaveshbhai Mehta</strong>, we continue to keep our heritage alive in every bite, preserving our timeless culinary tradition while embracing modern convenience and clean online ordering.</>,
              ].map((para, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.15, ease }}
                  className={`text-xs sm:text-sm leading-relaxed ${i === 2 ? "font-semibold text-[#4A2F1F]" : "text-[#555]"}`}
                >
                  {para}
                </motion.p>
              ))}
            </motion.div>

            {/* Right Image — slides from right, scale-in */}
            <motion.div
              initial={{ opacity: 0, x: 70, scale: 0.95 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.0, ease, delay: 0.1 }}
              className="relative rounded-2xl overflow-hidden border border-[#4A2F1F]/10 bg-[#FAF6EE] p-3 shadow-md group"
            >
              <img
                src="/store_entry_image.jpeg"
                alt={`${BUSINESS.shortName} Branding Wall Inside`}
                className="w-full h-auto rounded-xl object-cover transition-transform duration-700 group-hover:scale-103"
              />
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- SECTION 3: FOUNDER & LEADERSHIP --- */}
      <section className="py-24 bg-[#FAF6EE] border-b border-[#4A2F1F]/10 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <motion.div
            {...fadeUp(0)}
            className="text-center max-w-xl mx-auto mb-16"
          >
            <span className="text-[0.65rem] font-bold text-[#D97706] uppercase tracking-[0.2em]">Our Leaders</span>
            <h2 className="font-serif text-3xl font-bold text-[#4A2F1F] mt-1 uppercase">Founder &amp; Leadership</h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
              className="h-0.5 w-16 bg-[#C9A227] mx-auto mt-3 origin-center"
            />
          </motion.div>

          {/* Cards with stagger */}
          <motion.div
            {...staggerContainer(0.15)}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            {[
              {
                tag: "The Roots",
                tagColor: "text-[#C9A227]",
                name: "Shri Khantilal Tribhovandas Mehta",
                role: `Founder of ${BUSINESS.shortName}`,
                desc: `Established the business in ${BUSINESS.foundedYear} with a vision of quality and trust, serving original milk formulations to Palitana's visitors and residents.`,
              },
              {
                tag: "Next Generation",
                tagColor: "text-[#D97706]",
                name: "Shri Jaydeepbhai Khantilal Mehta",
                role: "Current CEO",
                desc: `Leading the next generation while preserving the values and traditional recipes of ${BUSINESS.shortName}, integrating safe digital checkout experiences.`,
              },
            ].map((leader) => (
              <motion.div
                key={leader.name}
                variants={staggerCard}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="bg-white rounded-2xl border border-[#4A2F1F]/10 p-8 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-3">
                  <span className={`text-[0.62rem] font-bold ${leader.tagColor} uppercase tracking-widest`}>
                    {leader.tag}
                  </span>
                  <h4 className="font-serif text-xl font-bold text-[#4A2F1F]">{leader.name}</h4>
                  <p className="text-xs text-[#D97706] font-semibold uppercase tracking-wider">{leader.role}</p>
                  <div className="h-px bg-[#4A2F1F]/10 my-1" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{leader.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- SECTION 4: OUR JOURNEY (Animated Timeline) --- */}
      <section className="py-24 bg-white border-b border-[#4A2F1F]/10 overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <motion.div
            {...fadeUp(0)}
            className="text-center max-w-xl mx-auto mb-16"
          >
            <span className="text-[0.65rem] font-bold text-[#D97706] uppercase tracking-[0.2em]">Our History</span>
            <h2 className="font-serif text-3xl font-bold text-[#4A2F1F] mt-1 uppercase">Our Journey</h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
              className="h-0.5 w-16 bg-[#C9A227] mx-auto mt-3 origin-center"
            />
          </motion.div>

          {/* Timeline: vertical line draws down, then milestones stagger in */}
          <div className="relative ml-4 pl-8 flex flex-col gap-12">
            {/* Animated vertical line */}
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 1.2, ease, delay: 0.2 }}
              className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#C9A227]/40 origin-top"
            />

            {[
              { year: "1972", title: "Founded in Palitana", desc: "Started as a humble sweet shop serving the pilgrim town of Palitana, Gujarat.", dot: "bg-[#4A2F1F]" },
              { year: "2006", title: "New Branch Expansion", desc: "Expanded operations by opening a new branch to serve more sweet lovers.", dot: "bg-[#C9A227]" },
              { year: "2023", title: "Store Renovation", desc: "Completely renovated our flagship store to offer a modern, premium shopping experience.", dot: "bg-[#4A2F1F]" },
              { year: "2026", title: "Online Store", desc: "Launched our premium online store, delivering authentic sweets pan-India.", dot: "bg-[#C9A227]" },
            ].map((item, i) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.75, delay: 0.1 + i * 0.12, ease }}
                className="relative group"
              >
                {/* Dot */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.12, ease: [0.34, 1.56, 0.64, 1] }}
                  className={`absolute -left-[41px] top-1 ${item.dot} text-white rounded-full w-5 h-5 border-4 border-white shadow-sm group-hover:scale-110 transition-transform`}
                />
                <h4 className="font-serif text-base font-bold text-[#4A2F1F]">{item.year}</h4>
                <h5 className="text-xs font-semibold text-[#D97706] uppercase tracking-wider mt-0.5">{item.title}</h5>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 5: INSIDE MEHTA DAIRY (Gallery Stagger) --- */}
      <section className="py-24 bg-[#FAF6EE] border-b border-[#4A2F1F]/10 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <motion.div
            {...fadeUp(0)}
            className="text-center max-w-xl mx-auto mb-16"
          >
            <span className="text-[0.65rem] font-bold text-[#D97706] uppercase tracking-[0.2em]">Our Store Experience</span>
            <h2 className="font-serif text-3xl font-bold text-[#4A2F1F] mt-1">Inside {BUSINESS.shortName}</h2>
            <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest font-semibold text-[#C9A227]">
              A modern sweet shop built on traditional values.
            </p>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
              className="h-0.5 w-16 bg-[#C9A227] mx-auto mt-3.5 origin-center"
            />
          </motion.div>

          <motion.div
            {...staggerContainer(0.12)}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { src: "/store_inside_counter.jpeg", alt: "Sweet counters and Display case inside Mehta Dairy", label: "Premium Counter Displays" },
              { src: "/store_products_storage.jpeg", alt: "Product shelves filled with fresh snacks and boxes inside Mehta Dairy", label: "Aromatic Savory Shelves" },
              { src: "/store_outside.jpeg", alt: "Welcome glass entry door storefront of Mehta Dairy", label: "Welcoming Store Entry" },
            ].map((item) => (
              <motion.div
                key={item.src}
                variants={{
                  hidden: { opacity: 0, y: 40, scale: 0.96 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease } },
                }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="group overflow-hidden rounded-2xl border border-[#4A2F1F]/10 bg-white p-2.5 shadow-sm"
              >
                <div className="overflow-hidden rounded-xl aspect-[4/3] relative">
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-3 text-center">
                  <h5 className="font-serif text-xs font-bold text-[#4A2F1F] uppercase tracking-wider">{item.label}</h5>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- SECTION 6: WHY CUSTOMERS TRUST US (Stagger cards) --- */}
      <section className="py-24 bg-white border-b border-[#4A2F1F]/10 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <motion.div
            {...fadeUp(0)}
            className="text-center max-w-xl mx-auto mb-16"
          >
            <span className="text-[0.65rem] font-bold text-[#D97706] uppercase tracking-[0.2em]">Our Commitments</span>
            <h2 className="font-serif text-3xl font-bold text-[#4A2F1F] mt-1">Why Customers Trust Us</h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
              className="h-0.5 w-16 bg-[#C9A227] mx-auto mt-3 origin-center"
            />
          </motion.div>

          <motion.div
            {...staggerContainer(0.09)}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { icon: CheckCircle2, color: "text-[#D97706]", title: "Since 1972", desc: "Serving the finest authentic taste formulations since our first day of opening." },
              { icon: CheckCircle2, color: "text-[#C9A227]", title: "50+ Years Legacy", desc: "Handmade sweet-making processes preserved across three generations of leadership." },
              { icon: CheckCircle2, color: "text-[#D97706]", title: "Fresh Daily Production", desc: "Prepared in small controlled batches daily to retain moisture and authentic aroma." },
              { icon: CheckCircle2, color: "text-[#C9A227]", title: "Premium Ingredients", desc: "Made using pure cow ghee, Californian almonds, Goan cashews, and zero artificial colors." },
              { icon: CheckCircle2, color: "text-[#D97706]", title: "Traditional Recipes", desc: "Taste that reminds you of home. Secret spice blends maintained with pride." },
              { icon: CheckCircle2, color: "text-[#C9A227]", title: "Secure Online Ordering", desc: "Encrypted Razorpay integrations and direct fast WhatsApp assistance channels." },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
                }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                className="flex gap-4 p-6 rounded-2xl border border-[#4A2F1F]/10 hover:bg-[#FAF6EE]/50 transition-colors"
              >
                <item.icon className={`h-6 w-6 ${item.color} flex-shrink-0`} />
                <div>
                  <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      {/* --- SECTION: OUR BRANCHES --- */}
      <section className="py-16 bg-white border-b border-[#4A2F1F]/10 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeUp(0)}
            className="text-center max-w-xl mx-auto mb-12"
          >
            <span className="text-[0.65rem] font-bold text-[#D97706] uppercase tracking-[0.2em]">Store Locations</span>
            <h2 className="font-serif text-3xl font-bold text-[#4A2F1F] mt-1">Our Branches</h2>
            <p className="text-xs text-muted-foreground mt-2">
              We serve you from two beautiful locations in Palitana.
            </p>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
              className="h-0.5 w-16 bg-[#C9A227] mx-auto mt-3 origin-center"
            />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Navagadh Branch */}
            <motion.div
              {...fadeUp(0.1)}
              className="bg-white rounded-[2.5rem] border border-[#EAE0D3] shadow-[0_8px_30px_-12px_rgba(74,47,31,0.1)] flex flex-col relative overflow-hidden group hover:shadow-[0_15px_40px_-15px_rgba(74,47,31,0.15)] transition-all duration-500"
            >
              <div className="h-48 w-full bg-[#FAF6EE] relative overflow-hidden">
                 <img src="/store_outside.jpeg" alt="Navagadh Main Branch" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                 <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500"></div>
              </div>
              <div className="p-8 sm:p-10 flex-1 flex flex-col gap-4">
                  <div>
                    <span className="inline-block px-3.5 py-1.5 bg-[#FAF6EE] text-[#D46D2D] text-[0.65rem] font-bold rounded-full uppercase tracking-widest mb-3 border border-[#EAE0D3]">Main Branch</span>
                    <h3 className="font-serif text-2xl font-bold text-[#2A1E17]">Navagadh Branch</h3>
                  </div>
                  <p className="text-sm text-[#7E6B5A] leading-relaxed flex-1 mt-2">
                    Our main store and administrative headquarters, offering our complete signature collection of fresh sweets, namkeens, and daily dairy items.
                  </p>
                  <a href={BUSINESS.branches.navagadh.googleMapsUrl} target="_blank" rel="noreferrer" className="flex items-start gap-4 mt-6 pt-6 border-t border-[#EAE0D3] group/link cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-[#FAF5ED] flex items-center justify-center flex-shrink-0 border border-[#D46D2D]/20 group-hover/link:bg-[#D46D2D] transition-colors">
                      <MapPin className="h-4 w-4 text-[#D46D2D] group-hover/link:text-white transition-colors" />
                    </div>
                    <span className="text-sm font-semibold text-[#2A1E17] leading-tight pt-0.5 group-hover/link:text-[#D46D2D] transition-colors">Navagadh, Palitana, <br/>Gujarat 364270</span>
                  </a>
              </div>
            </motion.div>

            {/* Taleti Branch */}
            <motion.div
              {...fadeUp(0.2)}
              className="bg-white rounded-[2.5rem] border border-[#EAE0D3] shadow-[0_8px_30px_-12px_rgba(74,47,31,0.1)] flex flex-col relative overflow-hidden group hover:shadow-[0_15px_40px_-15px_rgba(74,47,31,0.15)] transition-all duration-500"
            >
              <div className="h-48 w-full bg-[#FAF6EE] relative overflow-hidden">
                 <img src="/store_inside_counter.jpeg" alt="Taleti Branch" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                 <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500"></div>
              </div>
              <div className="p-8 sm:p-10 flex-1 flex flex-col gap-4">
                  <div>
                    <span className="inline-block px-3.5 py-1.5 bg-[#FAF6EE] text-[#7E6B5A] text-[0.65rem] font-bold rounded-full uppercase tracking-widest mb-3 border border-[#EAE0D3]">Second Branch</span>
                    <h3 className="font-serif text-2xl font-bold text-[#2A1E17]">Taleti Branch</h3>
                  </div>
                  <p className="text-sm text-[#7E6B5A] leading-relaxed flex-1 mt-2">
                    Located near the sacred hills path, perfect for pilgrims and visitors looking to taste authentic Palitana sweets on their journey.
                  </p>
                  <a href={BUSINESS.branches.taleti.googleMapsUrl} target="_blank" rel="noreferrer" className="flex items-start gap-4 mt-6 pt-6 border-t border-[#EAE0D3] group/link cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-[#FAF5ED] flex items-center justify-center flex-shrink-0 border border-[#D46D2D]/20 group-hover/link:bg-[#D46D2D] transition-colors">
                      <MapPin className="h-4 w-4 text-[#D46D2D] group-hover/link:text-white transition-colors" />
                    </div>
                    <span className="text-sm font-semibold text-[#2A1E17] leading-tight pt-0.5 group-hover/link:text-[#D46D2D] transition-colors">Taleti Road, Palitana, <br/>Gujarat 364270</span>
                  </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- SECTION 7: CONTACT CTA --- */}
      <section className="py-24 bg-[#FAF6EE] overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.0, ease }}
            className="bg-white rounded-3xl border border-[#4A2F1F]/10 p-8 sm:p-12 shadow-sm flex flex-col md:flex-row gap-8 items-center justify-between"
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease }}
              className="flex flex-col gap-4 max-w-md"
            >
              <span className="text-[0.62rem] font-bold text-[#D97706] uppercase tracking-widest">Connect With Us</span>
              <h3 className="font-serif text-3xl font-bold text-[#4A2F1F] leading-tight">Mehta Dairy</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Visit our physical store in Palitana to browse sweets, namkeens, and premium gifting sets, or request delivery over WhatsApp/Call.
              </p>

              <div className="flex flex-col gap-2.5 text-xs font-semibold text-[#4A2F1F] mt-2">
                {[
                  { Icon: MapPin, text: "Palitana, Gujarat, India." },
                  { Icon: Phone, text: BUSINESS.phone },
                  { Icon: Clock, text: "9:00 AM - 10:00 PM (Daily)" },
                ].map(({ Icon, text }, i) => (
                  <motion.span
                    key={text}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 + i * 0.1, ease }}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4 text-[#C9A227]" /> {text}
                  </motion.span>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3, ease }}
                className="flex flex-row gap-3 w-full md:w-auto min-w-[240px]"
              >
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  href={BUSINESS.whatsappUrl("Hello " + BUSINESS.shortName)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white hover:bg-[#1ebd57] py-3 text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4 fill-current" /> WHATSAPP CHAT
                </motion.a>

                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  href="https://maps.google.com/?q=Taleti+Rd,+Navagadh,+Palitana,+Gujarat+364270"
                  target="_blank"
                  rel="noreferrer"
                  className="w-fit inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#4A2F1F] text-[#4A2F1F] hover:bg-[#4A2F1F]/5 py-3 px-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <MapPin className="h-4 w-4" />
                </motion.a>
              </motion.div>
            </motion.div>

            {/* Google Map Embed */}
            <div className="w-full md:w-[450px] lg:w-[500px] h-[300px] md:h-[350px] rounded-2xl overflow-hidden border border-[#EAE0D3]/80 shadow-xs relative shrink-0">
              <iframe
                title="Mehta Dairy Palitana Map"
                src="https://maps.google.com/maps?q=Mehta%20Dairy%2C%20Taleti%20Road%2C%20Palitana%2C%20Gujarat&t=&z=16&ie=UTF8&iwloc=&output=embed"
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
