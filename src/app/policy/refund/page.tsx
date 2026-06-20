"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { motion } from "framer-motion";
import { ShieldAlert, RefreshCw, Mail, Phone, MapPin } from "lucide-react";

export default function RefundPolicy() {
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
                <RefreshCw className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-black text-brand-charcoal">
                  Cancellation & Refund Policy
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">Last updated: June 2026</p>
              </div>
            </div>

            <div className="prose prose-sm sm:prose-base max-w-none text-brand-charcoal/90 leading-relaxed flex flex-col gap-6">

              <section className="bg-amber-50/55 border border-amber-100 rounded-2xl p-5 flex gap-3 text-amber-950 items-start">
                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-serif text-xs font-bold uppercase tracking-wider">Perishable Goods Policy</h4>
                  <p className="text-[0.7rem] text-amber-800 mt-1 leading-relaxed">
                    Due to the highly perishable nature of our luxury dairy sweets, premium bakery items, and farsan products, we strictly do not accept returns or offer refunds once the products have been prepared and dispatched from our kitchen.
                  </p>
                </div>
              </section>

              <div>
                <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-2">1. Damaged or Incorrect Shipments</h3>
                <p className="text-xs text-muted-foreground">
                  We take utmost care in packaging our heritage delicacies to withstand transit. However, if you receive a damaged box, spoiled product, or incorrect items, please contact our support team within <strong>24 hours of delivery</strong>.
                </p>
                <ul className="list-disc list-inside text-xs text-muted-foreground mt-2 flex flex-col gap-1.5 pl-2">
                  <li>Please take clear photographs of the package box and the damaged product.</li>
                  <li>Email or message the photos to our customer relations team at <strong className="text-brand-charcoal">+91 99132 52232</strong>.</li>
                  <li>Upon verification, we will promptly arrange a replacement shipment or issue a store refund back to your payment source.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-2">2. Cancellation Guidelines</h3>
                <p className="text-xs text-muted-foreground">
                  Orders once placed cannot be cancelled as they enter the preparation and sorting stage immediately to ensure same-day freshness. For pre-booked party orders or festival bulk catering, cancellations must be requested at least <strong>48 hours prior</strong> to the scheduled dispatch time.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-2">3. Refund Processing</h3>
                <p className="text-xs text-muted-foreground">
                  Verified refunds are processed back to the original source (Razorpay online gateways or direct UPI) within <strong>5 to 7 working days</strong> depending on your bank's settlements.
                </p>
              </div>

              <div className="border-t border-brand-beige/50 pt-8 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-muted-foreground">
                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-brand-cream/20 border border-brand-beige/35">
                  <span className="font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-brand-orange" /> Phone Support
                  </span>
                  <span>Call or WhatsApp:</span>
                  <a href="tel:+919913252232" className="text-brand-orange font-bold hover:underline">+91 99132 52232</a>
                </div>

                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-brand-cream/20 border border-brand-beige/35">
                  <span className="font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-brand-orange" /> Main Outlet Address
                  </span>
                  <span>Bhidbhanjan Road, Taleti Road, Navagadh,<br />Palitana, Gujarat 364270</span>
                  <a href="https://maps.app.goo.gl/C4a16R63uQ2j4jWq7" target="_blank" rel="noreferrer" className="text-brand-orange font-bold hover:underline">View on Google Maps</a>
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
