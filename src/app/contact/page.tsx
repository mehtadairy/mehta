"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { MapPin, Phone, Mail, Clock, Send, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inquiryType, setInquiryType] = useState("order");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !message) return;

    // Simulate sending inquiry
    setSuccess(true);
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setTimeout(() => setSuccess(false), 4500);
  };

  const handleWhatsAppInquiry = () => {
    const waNumber = "919999999999";
    const text = `Hello Mehta Sweet Mart, I have a query regarding ${inquiryType} and would like to contact your support.`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <>
      <Header />
      <WhatsAppFloat />

      {/* --- PAGE HEADER --- */}
      <section className="bg-brand-cream border-b border-brand-beige py-12 text-center mt-20 sm:mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h2 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-serif text-3xl font-bold text-brand-charcoal"
          >
            Connect With Us
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md mx-auto"
          >
            Have queries about custom bulk orders, delivery timeframes, or corporate hampers? Get in touch with our helpdesk.
          </motion.p>
        </div>
      </section>

      {/* --- WORKSPACE --- */}
      <section className="py-16 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column Contact Cards */}
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 90, damping: 15 }}
              className="lg:col-span-5 flex flex-col gap-6"
            >
              
              {/* Outlet details */}
              <div className="bg-white border border-brand-beige rounded-2xl p-6 shadow-xs flex flex-col gap-5">
                <h3 className="font-serif text-lg font-bold text-brand-charcoal border-b border-brand-beige pb-3 mb-1">
                  Stadium Road Outlet
                </h3>
                
                <div className="flex gap-3 text-xs text-brand-charcoal">
                  <MapPin className="h-5 w-5 text-brand-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-serif font-bold text-xs uppercase text-muted-foreground mb-1">Address</h4>
                    <p className="leading-relaxed">
                      Mehta Sweet Mart, 102, Mithai Palace,<br />
                      Opposite Stadium Grounds, Stadium Road,<br />
                      Ahmedabad - 380009, Gujarat, India
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 text-xs text-brand-charcoal">
                  <Phone className="h-5 w-5 text-brand-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-serif font-bold text-xs uppercase text-muted-foreground mb-1">Customer Care Phone</h4>
                    <p className="leading-relaxed font-semibold">
                      +91 79 2640 1952<br />
                      +91 98989 81952
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 text-xs text-brand-charcoal">
                  <Mail className="h-5 w-5 text-brand-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-serif font-bold text-xs uppercase text-muted-foreground mb-1">Email Address</h4>
                    <p className="leading-relaxed font-semibold hover:text-brand-orange transition-colors">
                      support@mehtasweetmart.com<br />
                      bulkorders@mehtasweetmart.com
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 text-xs text-brand-charcoal">
                  <Clock className="h-5 w-5 text-brand-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-serif font-bold text-xs uppercase text-muted-foreground mb-1">Store Hours</h4>
                    <p className="leading-relaxed">
                      Monday to Sunday: 9:00 AM - 10:00 PM IST
                    </p>
                  </div>
                </div>
              </div>

              {/* Instant WhatsApp card */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl p-6 flex flex-col gap-4 text-brand-charcoal"
              >
                <h4 className="font-serif text-sm font-bold flex items-center gap-1.5 text-emerald-800">
                  <MessageSquare className="h-5 w-5 text-[#25D366]" /> Chat Instantly
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Connect directly with our support executive on WhatsApp to place orders, check custom package options, or get pricing.
                </p>
                <motion.button 
                  whileHover={{ scale: 1.03, boxShadow: "0 4px 15px rgba(37, 211, 102, 0.3)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleWhatsAppInquiry}
                  className="rounded-xl bg-[#25D366] hover:bg-[#1EBE57] text-white font-bold py-2.8 text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" /> Start WhatsApp Chat
                </motion.button>
              </motion.div>

            </motion.div>

            {/* Right Column Inquiry Form & Maps */}
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 90, damping: 15 }}
              className="lg:col-span-7 flex flex-col gap-6"
            >
              
              {/* Inquiry Form */}
              <div className="bg-white border border-brand-beige rounded-2xl p-6 sm:p-8 shadow-xs">
                <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-5">
                  Send Us a Message
                </h3>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Full Name *</label>
                      <input 
                        type="text" 
                        placeholder="Enter name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border border-brand-beige rounded-lg px-3 py-2.2 text-xs bg-brand-cream/35 focus:outline-none focus:border-brand-orange focus:bg-white transition-all duration-300 focus:scale-[1.01] focus:shadow-xs focus:ring-1 focus:ring-brand-orange"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Email Address *</label>
                      <input 
                        type="email" 
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border border-brand-beige rounded-lg px-3 py-2.2 text-xs bg-brand-cream/35 focus:outline-none focus:border-brand-orange focus:bg-white transition-all duration-300 focus:scale-[1.01] focus:shadow-xs focus:ring-1 focus:ring-brand-orange"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Phone Number *</label>
                      <input 
                        type="tel" 
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="border border-brand-beige rounded-lg px-3 py-2.2 text-xs bg-brand-cream/35 focus:outline-none focus:border-brand-orange focus:bg-white transition-all duration-300 focus:scale-[1.01] focus:shadow-xs focus:ring-1 focus:ring-brand-orange"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Inquiry Category</label>
                      <select 
                        value={inquiryType}
                        onChange={(e) => setInquiryType(e.target.value)}
                        className="border border-brand-beige rounded-lg px-3 py-2.2 text-xs bg-brand-cream/35 focus:outline-none focus:border-brand-orange focus:bg-white cursor-pointer font-semibold transition-all duration-300 focus:scale-[1.01] focus:shadow-xs"
                      >
                        <option value="order">Online Order Issue</option>
                        <option value="bulk">Bulk / Corporate Gifting</option>
                        <option value="custom">Custom Sweet Recipe</option>
                        <option value="other">General Feedback</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Message Details *</label>
                    <textarea 
                      placeholder="Detail your requirements, bulk sizes, date of event..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="border border-brand-beige rounded-lg px-3 py-2.2 text-xs bg-brand-cream/35 focus:outline-none focus:border-brand-orange focus:bg-white min-h-[120px] resize-y transition-all duration-300 focus:scale-[1.01] focus:shadow-xs focus:ring-1 focus:ring-brand-orange"
                      required
                    ></textarea>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="rounded-lg bg-brand-orange hover:bg-brand-orange-hover py-3 text-xs font-bold text-white shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="h-4 w-4" /> Send Inquiry Message
                  </motion.button>

                  <AnimatePresence>
                    {success && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-medium text-center"
                      >
                        ✓ Inquiry submitted successfully! Our helpdesk will contact you via email or phone within 24 hours.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>

              {/* Google Maps Mockup Panel */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-brand-beige rounded-2xl overflow-hidden shadow-xs h-72 relative flex flex-col justify-end group"
              >
                <div className="absolute inset-0 bg-brand-cream/50 z-0 overflow-hidden">
                  {/* Google maps placeholder styled visually */}
                  <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center bg-[radial-gradient(#E8DFD3_1.5px,transparent_1.5px)] [background-size:16px_16px]">
                    <div className="h-10 w-10 bg-brand-orange/15 rounded-full flex items-center justify-center mb-2 animate-bounce">
                      <MapPin className="h-5 w-5 text-brand-orange" />
                    </div>
                    <h4 className="font-serif text-sm font-bold text-brand-charcoal">Stadium Road Branch</h4>
                    <p className="text-[0.65rem] text-muted-foreground max-w-xs mt-1">
                      102, Mithai Palace, Stadium Road, Ahmedabad
                    </p>
                  </div>
                </div>
                
                {/* Bottom directions link */}
                <motion.a 
                  whileHover={{ backgroundColor: "#d9531e" }}
                  href="https://maps.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="relative z-10 w-full text-center bg-brand-charcoal text-white py-3 text-xs font-bold transition-colors"
                >
                  View Route Directions on Google Maps
                </motion.a>
              </motion.div>

            </motion.div>

          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
