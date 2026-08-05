"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import WhatsAppOrderBtn from "@/components/WhatsAppOrderBtn";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Send, MessageSquare, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BUSINESS } from "@/lib/businessConfig";

const ease = [0.16, 1, 0.3, 1] as const;

// ── FAQ Data ────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: "What are your delivery areas?",
    a: "We currently deliver across Palitana, Bhavnagar, and select Gujarat pincodes. WhatsApp us your pincode to confirm availability.",
  },
  {
    q: "Do you offer bulk / corporate gifting?",
    a: "Yes! We craft custom sweet hampers and corporate gift boxes starting from 10 boxes. Contact us via WhatsApp or email for a quote.",
  },
  {
    q: "How fresh are your sweets?",
    a: "All sweets are prepared fresh daily in small batches. Shelf life varies — milk sweets: 2–3 days; ghee sweets: 7–10 days; farsan: 15–20 days.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept UPI, all credit/debit cards, net banking via Razorpay. Cash on Delivery available for local Palitana orders.",
  },
  {
    q: "Can I cancel or modify my order?",
    a: "Orders can be modified within 2 hours of placement. WhatsApp us immediately for fastest response.",
  },
];

// ── Contact Info Rows ────────────────────────────────────────────────────────
const contactInfo = [
  {
    Icon: MapPin,
    label: "Store Address",
    value: BUSINESS.address.full,
    href: BUSINESS.googleMapsUrl,
    color: "text-[#D46D2D]",
    bg: "bg-[#D46D2D]/10",
  },
  {
    Icon: Phone,
    label: "Customer Care",
    value: BUSINESS.phone,
    href: `tel:${BUSINESS.phoneTel}`,
    color: "text-[#D46D2D]",
    bg: "bg-[#D46D2D]/10",
  },
  {
    Icon: MessageSquare,
    label: "WhatsApp",
    value: "Chat on WhatsApp",
    href: BUSINESS.whatsappUrl("Hello Mehta Dairy!"),
    color: "text-[#25D366]",
    bg: "bg-[#25D366]/10",
  },
  {
    Icon: Mail,
    label: "Email",
    value: BUSINESS.email,
    href: `mailto:${BUSINESS.email}`,
    color: "text-[#4285F4]",
    bg: "bg-[#4285F4]/10",
  },
  {
    Icon: Clock,
    label: "Store Hours",
    value: BUSINESS.storeHours,
    href: null,
    color: "text-[#D4AF37]",
    bg: "bg-[#D4AF37]/10",
  },
];

// ── FAQ Accordion Item ───────────────────────────────────────────────────────
function FaqItem({ q, a, idx }: { q: string; a: string; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: idx * 0.08, ease }}
      className="border border-[#EAE0D3] rounded-2xl overflow-hidden bg-white"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left group cursor-pointer"
        aria-expanded={open}
      >
        <span className="font-serif text-sm font-bold text-[#2A1E17] pr-4 group-hover:text-[#D46D2D] transition-colors">
          {q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0 h-7 w-7 rounded-full bg-[#FAF6EE] flex items-center justify-center"
        >
          <ChevronDown className="h-4 w-4 text-[#D46D2D]" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="faq-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-xs text-[#7E6B5A] leading-relaxed border-t border-[#EAE0D3] pt-4">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inquiryType, setInquiryType] = useState("order");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name || !email || !phone || !message) {
      setError("All fields are required.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, inquiryType, message })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccess(true);
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
        setInquiryType("order");
        setTimeout(() => setSuccess(false), 8000);
      } else {
        setError(data.error || "Unable to send your message. Please try again later or contact us directly.");
      }
    } catch (err) {
      setError("Unable to send your message. Please try again later or contact us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    const text = `Hello ${BUSINESS.shortName}, I have a query regarding ${inquiryType}.`;
    window.open(BUSINESS.whatsappUrl(text), "_blank");
  };

  // Now: determine open status
  const hour = new Date().getHours();
  const isOpen = hour >= 9 && hour < 22;

  return (
    <div className="bg-[#FAF6EE] min-h-screen text-[#2A1E17]">
      <Header />
      <WhatsAppFloat />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 sm:pt-36 pb-20 text-center">
        {/* Dot grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#D4AF3718_1.5px,transparent_1.5px)] [background-size:28px_28px] pointer-events-none" />
        {/* Warm gradient blob */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.18, 0.28, 0.18] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#D46D2D]/15 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <motion.span
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-2 rounded-full bg-[#D46D2D]/8 border border-[#D46D2D]/20 px-4 py-1.5 text-[0.65rem] font-bold text-[#D46D2D] uppercase tracking-widest mb-5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#D46D2D] animate-pulse" />
            We're Here For You
          </motion.span>

          <h1 className="font-serif text-5xl sm:text-6xl font-bold text-[#2A1E17] leading-tight overflow-hidden">
            {"Let's Connect".split(" ").map((word, i) => (
              <motion.span
                key={i}
                className="inline-block mr-4"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.15 + i * 0.14, ease }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Gold divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.55, ease }}
            className="h-0.5 w-16 bg-[#D4AF37] mx-auto my-5 origin-center"
          />

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65, ease }}
            className="text-sm text-[#7E6B5A] max-w-md mx-auto leading-relaxed"
          >
            Have questions about orders, custom hampers, or corporate gifting?
            Our team responds within 24 hours — or chat with us instantly on WhatsApp.
          </motion.p>

          {/* Store open badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.85, ease }}
            className="inline-flex items-center gap-2 mt-6 bg-white border border-[#EAE0D3] rounded-full px-4 py-2 shadow-sm"
          >
            <span className={`h-2 w-2 rounded-full ${isOpen ? "bg-green-500 animate-pulse" : "bg-red-400"}`} />
            <span className="text-[0.68rem] font-bold text-[#2A1E17]">
              {isOpen ? "Store Open Now" : "Store Closed"} · 9 AM – 10 PM Daily
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 1: DETAILS & MAP GRID ────────────────────────────────── */}
      <section className="pb-12 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left: Contact Info Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease }}
              className="lg:col-span-5 flex flex-col gap-4"
            >
              {/* White Card Container */}
              <div className="bg-white rounded-3xl border border-[#EAE0D3]/80 p-6 sm:p-8 shadow-[0_8px_30px_rgba(74,47,31,0.04)] flex flex-col gap-5 relative h-full justify-between">
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-[#4A2F1F] leading-none mb-1">Mehta Dairy</h2>
                      <span className="text-xs text-[#7E6B5A] font-semibold">Palitana, Gujarat</span>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase bg-[#FAF6EE] text-[#C9A227] px-2.5 py-1 rounded-full tracking-wider border border-[#C9A227]/20 shadow-xs select-none">
                      Since 1972
                    </span>
                  </div>

                  <div className="h-px bg-[#EAE0D3]/80 mb-5" />

                  {/* Details List */}
                  <div className="flex flex-col gap-4">
                    {/* Address */}
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#FAF6EE] border border-[#EAE0D3]/60 flex items-center justify-center shrink-0">
                        <MapPin className="h-4.5 w-4.5 text-[#4A2F1F] stroke-[2]" />
                      </div>
                      <div>
                        <span className="block text-[8px] font-extrabold uppercase text-[#7E6B5A] tracking-wider leading-none mb-1">Store Address</span>
                        <span className="text-xs font-semibold text-[#4A2F1F] leading-relaxed">
                          Taleti Rd, Navagadh, Palitana, Gujarat 364270
                        </span>
                      </div>
                    </div>

                    {/* Customer Care */}
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#FAF6EE] border border-[#EAE0D3]/60 flex items-center justify-center shrink-0">
                        <Phone className="h-4.5 w-4.5 text-[#D46D2D] stroke-[2]" />
                      </div>
                      <div>
                        <span className="block text-[8px] font-extrabold uppercase text-[#7E6B5A] tracking-wider leading-none mb-1">Customer Care</span>
                        <a href={`tel:${BUSINESS.phoneTel}`} className="text-xs font-bold text-[#4A2F1F] hover:text-[#D46D2D] transition-colors leading-relaxed">
                          +91 99132 52232
                        </a>
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#FAF6EE] border border-[#EAE0D3]/60 flex items-center justify-center shrink-0">
                        <MessageSquare className="h-4.5 w-4.5 text-[#25D366] stroke-[2]" />
                      </div>
                      <div>
                        <span className="block text-[8px] font-extrabold uppercase text-[#7E6B5A] tracking-wider leading-none mb-1">WhatsApp</span>
                        <a 
                          href={BUSINESS.whatsappUrl("Hello Mehta Dairy")}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-[#25D366] hover:underline transition-all leading-relaxed"
                        >
                          Chat on WhatsApp
                        </a>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#FAF6EE] border border-[#EAE0D3]/60 flex items-center justify-center shrink-0">
                        <Mail className="h-4.5 w-4.5 text-[#4285F4] stroke-[2]" />
                      </div>
                      <div>
                        <span className="block text-[8px] font-extrabold uppercase text-[#7E6B5A] tracking-wider leading-none mb-1">Email</span>
                        <a href={`mailto:${BUSINESS.email}`} className="text-xs font-bold text-[#4285F4] hover:underline transition-all leading-relaxed">
                          {BUSINESS.email}
                        </a>
                      </div>
                    </div>

                    {/* Store Hours */}
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#FAF6EE] border border-[#EAE0D3]/60 flex items-center justify-center shrink-0">
                        <Clock className="h-4.5 w-4.5 text-[#D4AF37] stroke-[2]" />
                      </div>
                      <div>
                        <span className="block text-[8px] font-extrabold uppercase text-[#7E6B5A] tracking-wider leading-none mb-1">Store Hours</span>
                        <span className="text-xs font-semibold text-[#4A2F1F] leading-relaxed">
                          Daily: 9:00 AM – 10:00 PM IST
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Button inside Card container footer */}
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={BUSINESS.whatsappUrl("Hello Mehta Dairy")}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-white hover:bg-[#1ebd57] py-3.5 text-xs font-extrabold uppercase tracking-widest shadow-sm transition-colors cursor-pointer mt-4"
                >
                  <MessageSquare className="h-4 w-4 fill-current" /> Order on WhatsApp
                </motion.a>
              </div>
            </motion.div>

            {/* Right: Map */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1, ease }}
              className="lg:col-span-7 min-h-[400px] rounded-3xl overflow-hidden border border-[#EAE0D3]/80 shadow-[0_8px_30px_rgba(74,47,31,0.04)] relative"
            >
              <iframe
                title="Mehta Dairy Taleti Road Map"
                src={BUSINESS.googleMapsEmbedUrl}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── SECTION 2: FORM & FAQS GRID ─────────────────────────────────── */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease }}
              className="lg:col-span-6 bg-white rounded-3xl border border-[#EAE0D3]/80 p-6 sm:p-8 shadow-[0_8px_30px_rgba(74,47,31,0.04)]"
            >
              <h3 className="font-serif text-2xl font-bold text-[#4A2F1F] mb-1">Send us a message</h3>
              <p className="text-xs text-[#7E6B5A] mb-6">We'll reply within 24 hours via email or phone.</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Row 1: Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Floating label - Name */}
                  <div className="relative">
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      className="peer w-full rounded-xl border border-[#EAE0D3] bg-[#FAF6EE]/50 px-4 pt-6 pb-2 text-sm text-[#4A2F1F] placeholder-transparent focus:outline-none focus:border-[#4A2F1F] focus:bg-white focus:ring-4 focus:ring-[#4A2F1F]/5 transition-all"
                      placeholder="Full Name"
                      required
                    />
                    <label
                      htmlFor="contact-name"
                      className="absolute left-4 top-2 text-[0.62rem] font-bold text-[#7E6B5A] uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#7E6B5A]/60 peer-focus:top-2 peer-focus:text-[0.62rem] peer-focus:text-[#4A2F1F]"
                    >
                      Full Name *
                    </label>
                  </div>

                  {/* Floating label - Email */}
                  <div className="relative">
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      className="peer w-full rounded-xl border border-[#EAE0D3] bg-[#FAF6EE]/50 px-4 pt-6 pb-2 text-sm text-[#4A2F1F] placeholder-transparent focus:outline-none focus:border-[#4A2F1F] focus:bg-white focus:ring-4 focus:ring-[#4A2F1F]/5 transition-all"
                      placeholder="Email Address"
                      required
                    />
                    <label
                      htmlFor="contact-email"
                      className="absolute left-4 top-2 text-[0.62rem] font-bold text-[#7E6B5A] uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#7E6B5A]/60 peer-focus:top-2 peer-focus:text-[0.62rem] peer-focus:text-[#4A2F1F]"
                    >
                      Email Address *
                    </label>
                  </div>
                </div>

                {/* Row 2: Phone + Inquiry Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      id="contact-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                      className="peer w-full rounded-xl border border-[#EAE0D3] bg-[#FAF6EE]/50 px-4 pt-6 pb-2 text-sm text-[#4A2F1F] placeholder-transparent focus:outline-none focus:border-[#4A2F1F] focus:bg-white focus:ring-4 focus:ring-[#4A2F1F]/5 transition-all"
                      placeholder="Phone"
                      required
                    />
                    <label
                      htmlFor="contact-phone"
                      className="absolute left-4 top-2 text-[0.62rem] font-bold text-[#7E6B5A] uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#7E6B5A]/60 peer-focus:top-2 peer-focus:text-[0.62rem] peer-focus:text-[#4A2F1F]"
                    >
                      Phone Number *
                    </label>
                  </div>

                  <div className="relative">
                    <select
                      id="contact-inquiry"
                      value={inquiryType}
                      onChange={(e) => setInquiryType(e.target.value)}
                      className="w-full rounded-xl border border-[#EAE0D3] bg-[#FAF6EE]/50 px-4 pt-6 pb-2 text-sm text-[#4A2F1F] focus:outline-none focus:border-[#4A2F1F] focus:bg-white focus:ring-4 focus:ring-[#4A2F1F]/5 transition-all cursor-pointer appearance-none"
                    >
                      <option value="order">Online Order Issue</option>
                      <option value="bulk">Bulk / Corporate Gifting</option>
                      <option value="custom">Custom Sweet Recipe</option>
                      <option value="other">General Feedback</option>
                    </select>
                    <label className="absolute left-4 top-2 text-[0.62rem] font-bold text-[#7E6B5A] uppercase tracking-wider pointer-events-none">
                      Inquiry Type
                    </label>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7E6B5A] pointer-events-none" />
                  </div>
                </div>

                {/* Message */}
                <div className="relative">
                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onFocus={() => setFocusedField("message")}
                    onBlur={() => setFocusedField(null)}
                    rows={4}
                    className="peer w-full rounded-xl border border-[#EAE0D3] bg-[#FAF6EE]/50 px-4 pt-6 pb-3 text-sm text-[#4A2F1F] placeholder-transparent focus:outline-none focus:border-[#4A2F1F] focus:bg-white focus:ring-4 focus:ring-[#4A2F1F]/5 transition-all resize-none"
                    placeholder="Message"
                    required
                  />
                  <label
                    htmlFor="contact-message"
                    className="absolute left-4 top-2 text-[0.62rem] font-bold text-[#7E6B5A] uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#7E6B5A]/60 peer-focus:top-2 peer-focus:text-[0.62rem] peer-focus:text-[#4A2F1F]"
                  >
                    Message Details *
                  </label>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(74,47,31,0.15)" }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2.5 bg-[#4A2F1F] hover:bg-[#3d2619] disabled:bg-[#4A2F1F]/60 text-white font-bold text-xs uppercase tracking-widest rounded-xl py-4 shadow-md transition-all cursor-pointer min-h-[52px]"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                      />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </motion.button>

                {/* Success state */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4, ease }}
                      className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl px-5 py-4 text-sm font-semibold"
                    >
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div>
                        Your message has been sent successfully. <br/>
                        <span className="font-normal opacity-90">We will contact you within 24 hours.</span>
                      </div>
                    </motion.div>
                  )}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4, ease }}
                      className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl px-5 py-4 text-sm font-semibold"
                    >
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>

            {/* Right: FAQs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1, ease }}
              className="lg:col-span-6 bg-white rounded-3xl border border-[#EAE0D3]/80 p-6 sm:p-8 shadow-[0_8px_30px_rgba(74,47,31,0.04)]"
            >
              <h3 className="font-serif text-2xl font-bold text-[#4A2F1F] mb-1">Frequently Asked Questions</h3>
              <p className="text-xs text-[#7E6B5A] mb-6">Quick answers to common inquiries about our sweets and orders.</p>
              <div className="flex flex-col gap-3">
                {faqs.map((item, idx) => (
                  <FaqItem key={idx} q={item.q} a={item.a} idx={idx} />
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
