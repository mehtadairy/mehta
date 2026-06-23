"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { motion } from "framer-motion";
import { FileText, Award, Truck, AlertCircle, Phone, MapPin } from "lucide-react";
import { BUSINESS } from "@/lib/businessConfig";

export default function TermsAndConditions() {
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
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-black text-brand-charcoal">
                  Terms & Conditions
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">Last updated: June 2026</p>
              </div>
            </div>

            <div className="prose prose-sm sm:prose-base max-w-none text-brand-charcoal/90 leading-relaxed flex flex-col gap-6">

              <p className="text-xs text-muted-foreground">
                Welcome to {BUSINESS.name} online checkout catalog. By visiting our portal, placing an order, or checking out with our payment gateway, you agree to comply with the terms and conditions outlined below.
              </p>

              <div>
                <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-2 flex items-center gap-2">
                  <Award className="h-4.5 w-4.5 text-brand-orange" /> 1. Product Quality & Ingredients
                </h3>
                <ul className="list-disc list-inside text-xs text-muted-foreground flex flex-col gap-1.5 pl-2">
                  <li>All our sweets, dry-fruit delicacies, and namkeen farsan are <strong>100% vegetarian</strong>.</li>
                  <li>We prepare items in completely hygienic, dairy-compliant facilities matching regulatory standards.</li>
                  <li>Sweets may contain allergens such as nuts, dairy solids (Khoya), gluten, or sesame. Please inspect the ingredient panel on the product details page carefully before checking out.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-2 flex items-center gap-2">
                  <Truck className="h-4.5 w-4.5 text-brand-orange" /> 2. Delivery & Pincode Serviceability
                </h3>
                <p className="text-xs text-muted-foreground">
                  Our delivery zones are calculated automatically based on input pincodes:
                </p>
                <ul className="list-disc list-inside text-xs text-muted-foreground mt-2 flex flex-col gap-1.5 pl-2">
                  <li><strong>Gujarat Deliveries:</strong> Usually reach within <strong>1 to 2 days</strong> after dispatch.</li>
                  <li><strong>Out of State Deliveries:</strong> Take approximately <strong>3 to 5 days</strong> depending on express courier operations.</li>
                  <li>In case of incorrect pincodes or wrong delivery addresses provided by the customer, {BUSINESS.name} is not liable for delayed arrivals or spoiled sweets.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5 text-brand-orange" /> 3. Pricing & Taxes
                </h3>
                <p className="text-xs text-muted-foreground">
                  All prices listed on the sweet catalog are inclusive of applicable GST. Delivery fees apply to orders below free-shipping thresholds set for each delivery region. Promotional coupon discounts must be applied successfully before checkout.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-2">4. User Account Obligations</h3>
                <p className="text-xs text-muted-foreground">
                  Customers must provide a valid Indian mobile number and email to receive digital invoices, Razorpay receipts, and SMS order tracking updates. We reserve the right to suspend accounts or cancel transactions suspected of fraudulent activity.
                </p>
              </div>

              <div className="border-t border-brand-beige/50 pt-8 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-muted-foreground">
                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-brand-cream/20 border border-brand-beige/35">
                  <span className="font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-brand-orange" /> Phone Support
                  </span>
                  <span>Contact Customer Relations:</span>
                  <a href={`tel:${BUSINESS.phoneTel}`} className="text-brand-orange font-bold hover:underline">{BUSINESS.phone}</a>
                </div>

                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-brand-cream/20 border border-brand-beige/35">
                  <span className="font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-brand-orange" /> Main Outlet Address
                  </span>
                  <span>{BUSINESS.address.full}</span>
                  <a href={BUSINESS.googleMapsUrl} target="_blank" rel="noreferrer" className="text-brand-orange font-bold hover:underline">View on Google Maps</a>
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
