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
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const headline = "MEHTA DAIRY";

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
                <>Founded in 1972 by <strong className="text-[#4A2F1F]">Shri Khantilal Tribhovandas Mehta</strong>, Mehta Dairy began with a simple vision: serving fresh sweets and authentic flavors to the people of Palitana.</>,
                <>Over the decades, the business has become a trusted destination for families, visitors, and Jain pilgrims seeking quality sweets, namkeen, sharbat, and traditional delicacies.</>,
                <>Today, under the leadership of <strong className="text-[#4A2F1F]">Shri Jaydeepbhai Bhaveshbhai Mehta</strong>, Mehta Dairy continues its commitment to quality while embracing modern technology and online ordering.</>,
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
                alt="Mehta Dairy Branding Wall Inside"
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
                role: "Founder of Mehta Dairy",
                desc: "Established the business in 1972 with a vision of quality and trust, serving original milk formulations to Palitana's visitors and residents.",
              },
              {
                tag: "Next Generation",
                tagColor: "text-[#D97706]",
                name: "Shri Jaydeepbhai Bhaveshbhai Mehta",
                role: "Current CEO",
                desc: "Leading the next generation while preserving the values and traditional recipes of Mehta Dairy, integrating safe digital checkout experiences.",
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
              { year: "1972", title: "Mehta Dairy Founded", desc: "Started serving pure, fresh, authentic sweets to the people of Palitana.", dot: "bg-[#4A2F1F]" },
              { year: "1980s", title: "Expanded Product Offerings", desc: "Introduced crunchy farsans, premium namkeens, and refreshing custom sharbats.", dot: "bg-[#C9A227]" },
              { year: "2000s", title: "Trusted By Generations", desc: "Established as the premier destination for visitors, pilgrims, and local Gujarati families.", dot: "bg-[#4A2F1F]" },
              { year: "2020s", title: "Modern Store Renovation", desc: "Renovated our physical store layouts to integrate beautiful modern glass displays and checkouts.", dot: "bg-[#C9A227]" },
              { year: "2026", title: "Online Store Launch", desc: "Launched our digital e-commerce web platform to deliver authentic Palitana flavors directly to doorsteps.", dot: "bg-[#4A2F1F]" },
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
            <h2 className="font-serif text-3xl font-bold text-[#4A2F1F] mt-1">Inside Mehta Dairy</h2>
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
                  { Icon: Phone, text: "+91 98989 81952" },
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3, ease }}
              className="flex flex-col gap-3 w-full md:w-auto min-w-[240px]"
            >
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="https://wa.me/919898981952?text=Hello%20Mehta%20Dairy"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white hover:bg-[#1ebd57] py-3 text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 fill-current" /> WhatsApp Chat
              </motion.a>

              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#4A2F1F] text-[#4A2F1F] hover:bg-[#4A2F1F]/5 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <MapPin className="h-4 w-4" /> Google Maps Link
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
