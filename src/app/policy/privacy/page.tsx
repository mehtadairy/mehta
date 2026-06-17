"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { motion } from "framer-motion";
import { Eye, Shield, Lock, Phone, MapPin } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <>
      <Header />
      <WhatsAppFloat />

      <main className="bg-brand-cream/35 min-h-screen py-24 mt-20 sm:mt-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-brand-beige relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-orange to-brand-gold"></div>

            <div className="flex items-center gap-3.5 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-brand-orange/5 text-brand-orange flex items-center justify-center">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-black text-brand-charcoal">
                  Privacy Policy
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">Last updated: June 2026</p>
              </div>
            </div>

            <div className="prose prose-sm sm:prose-base max-w-none text-brand-charcoal/90 leading-relaxed flex flex-col gap-6">
              
              <p className="text-xs text-muted-foreground">
                At Mehta Sweet Mart, we respect your privacy and are committed to protecting the personal details you share with us. This policy details how we collect, store, and utilize your information across our website and mobile checkout portal.
              </p>

              <div>
                <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-2 flex items-center gap-2">
                  <Shield className="h-4.5 w-4.5 text-brand-orange" /> 1. Information We Collect
                </h3>
                <p className="text-xs text-muted-foreground">
                  To complete your online orders and deliver products fresh to your doorstep, we collect:
                </p>
                <ul className="list-disc list-inside text-xs text-muted-foreground mt-2 flex flex-col gap-1.5 pl-2">
                  <li><strong>Account Profile:</strong> Full name, phone number, email address, and login credentials (when you register via OTP or Google Authentication).</li>
                  <li><strong>Delivery Addresses:</strong> Street, landmarks, city, state, and pincode where your sweets and farsan will be shipped.</li>
                  <li><strong>Order History:</strong> Product names, quantities, payment status, and generated invoice records.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-2 flex items-center gap-2">
                  <Lock className="h-4.5 w-4.5 text-brand-orange" /> 2. Secure Payment Processing
                </h3>
                <p className="text-xs text-muted-foreground">
                  We integrate directly with **Razorpay Secure Checkout Gateways** for all online transactions. 
                  Mehta Sweet Mart **does not collect, store, or process** credit card numbers, CVVs, net banking credentials, or UPI PINs. All financial inputs are encrypted directly by Razorpay according to PCI-DSS standards.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-2">3. Storage & Security</h3>
                <p className="text-xs text-muted-foreground">
                  Your customer details are stored securely using Supabase database instances. We implement industry-standard security protocols to prevent unauthorized access, alteration, or disclosure of your account records.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-2">4. Third-Party Sharing</h3>
                <p className="text-xs text-muted-foreground">
                  We do not sell, rent, or distribute your email or phone number to any marketing lists. Your address and phone are shared only with our trusted local delivery executives or domestic courier partners (like Blue Dart / Delhivery) strictly to dispatch your orders.
                </p>
              </div>

              <div className="border-t border-brand-beige/50 pt-8 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-muted-foreground">
                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-brand-cream/20 border border-brand-beige/35">
                  <span className="font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-brand-orange" /> Phone Support
                  </span>
                  <span>Contact Customer Relations:</span>
                  <a href="tel:+919913252232" className="text-brand-orange font-bold hover:underline">+91 99132 52232</a>
                </div>

                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-brand-cream/20 border border-brand-beige/35">
                  <span className="font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-brand-orange" /> Main Outlet Address
                  </span>
                  <span>Near Stadium Circle, Off CG Road,<br />Navrangpura, Ahmedabad - 380009</span>
                  <a href="https://share.google/5x2FPvCFeEAeFtI3N" target="_blank" rel="noreferrer" className="text-brand-orange font-bold hover:underline">View on Google Maps</a>
                </div>
              </div>

            </div>

          </motion.div>

        </div>
      </main>

      <Footer />
    </>
  );
}
