"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle, Phone, Mail } from "lucide-react";

const FAQS = [
  {
    category: "Orders & Delivery",
    items: [
      {
        q: "How long does delivery take?",
        a: "We deliver across India within 3–7 business days depending on your location. Ahmedabad orders are delivered within 1–2 days. All orders are shipped via trusted courier partners with tracking.",
      },
      {
        q: "Do you offer same-day delivery?",
        a: "Same-day delivery is available for select Ahmedabad pin codes. Contact us on WhatsApp to check availability for your area before placing the order.",
      },
      {
        q: "Can I track my order?",
        a: "Yes! Once your order is dispatched, you will receive a tracking link via WhatsApp and email. You can also track your order from the My Account section on our website.",
      },
      {
        q: "What are the shipping charges?",
        a: "Shipping charges are calculated at checkout based on your delivery location and order weight. Orders above ₹999 enjoy free delivery across India.",
      },
    ],
  },
  {
    category: "Products & Freshness",
    items: [
      {
        q: "How fresh are your sweets?",
        a: "All our sweets are made fresh daily in small batches using traditional methods. We maintain strict hygiene standards and vacuum-seal our products for maximum freshness during transit.",
      },
      {
        q: "What is the shelf life of your products?",
        a: "Shelf life varies by product. Most dry sweets and farsan last 15–30 days when stored in a cool, dry place. Milk-based sweets should be refrigerated and consumed within 5–7 days. Each product page shows the shelf life.",
      },
      {
        q: "Do your products contain preservatives?",
        a: "Absolutely not. We use 100% pure, natural ingredients with zero preservatives. This is our founding promise since 1972 — pure ingredients, authentic taste.",
      },
      {
        q: "Do you offer sugar-free or diabetic-friendly options?",
        a: "We are working on introducing sugar-free variants. Currently, please check individual product descriptions. You can also contact us to discuss custom orders for special dietary needs.",
      },
    ],
  },
  {
    category: "Payments & Returns",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept all major payment methods — UPI (PhonePe, GPay, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery for select locations. All online payments are secured by Razorpay.",
      },
      {
        q: "Is online payment safe?",
        a: "Yes, completely. Our checkout is integrated with Razorpay, which uses bank-grade 256-bit SSL encryption. We never store your card details on our servers.",
      },
      {
        q: "Can I cancel or modify my order?",
        a: "Orders can be cancelled or modified within 2 hours of placing them. After that, the order enters preparation. Please contact us immediately via WhatsApp (+91 99132 52232) if you need to make changes.",
      },
      {
        q: "What is your return or refund policy?",
        a: "Since our products are perishable food items, we do not accept returns. However, if you receive a damaged or incorrect order, please contact us within 24 hours with photos and we will arrange a full replacement or refund.",
      },
    ],
  },
  {
    category: "Gift & Bulk Orders",
    items: [
      {
        q: "Do you offer gift packaging?",
        a: "Yes! We offer premium gift boxes perfect for Diwali, weddings, Raksha Bandhan, and corporate gifting. You can add a personalized message card. Contact us or select gift packaging during checkout.",
      },
      {
        q: "Can I place bulk / corporate orders?",
        a: "Absolutely. We offer special pricing for bulk orders of 5 kg or more. Contact us on WhatsApp or email at info@mehtadairy.com with your requirements and we'll send you a custom quote within 24 hours.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggle = (id: string) => setOpenItem(openItem === id ? null : id);

  return (
    <div className="bg-[#FAF6EE] min-h-screen text-[#2C2C2C]">
      <Header />

      {/* Hero */}
      <section className="bg-[#4A2F1F] pt-28 pb-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#C9A22712_1.5px,transparent_1.5px)] [background-size:28px_28px]" />
        <div className="relative z-10 mx-auto max-w-3xl px-4">
          <span className="text-[0.65rem] font-bold text-[#C9A227] uppercase tracking-[0.25em]">Help Center</span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mt-3">
            Frequently Asked Questions
          </h1>
          <p className="text-white/70 text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed">
            Everything you need to know about Mehta Dairy & Sweet Mart. Can't find your answer? We're here to help.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {FAQS.map((section, si) => (
            <div key={section.category} className="mb-10 sm:mb-14">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#4A2F1F] mb-5 flex items-center gap-3">
                <span className="h-px flex-grow bg-[#4A2F1F]/15" />
                {section.category}
                <span className="h-px flex-grow bg-[#4A2F1F]/15" />
              </h2>

              <div className="flex flex-col gap-3">
                {section.items.map((item, qi) => {
                  const id = `${si}-${qi}`;
                  const isOpen = openItem === id;
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: qi * 0.07 }}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isOpen
                          ? "border-[#D46D2D]/40 bg-white shadow-md"
                          : "border-[#4A2F1F]/10 bg-white hover:border-[#D46D2D]/25 hover:shadow-sm"
                      }`}
                    >
                      <button
                        onClick={() => toggle(id)}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
                        aria-expanded={isOpen}
                      >
                        <span className="font-serif text-sm sm:text-base font-bold text-[#4A2F1F] leading-snug">
                          {item.q}
                        </span>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.25 }}
                          className="flex-shrink-0 w-7 h-7 rounded-full bg-[#FAF6EE] flex items-center justify-center"
                        >
                          <ChevronDown className="h-4 w-4 text-[#D46D2D]" />
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key="answer"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <div className="px-5 pb-5 text-sm text-[#6B5744] leading-relaxed border-t border-[#4A2F1F]/8 pt-3">
                              {item.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still have questions */}
      <section className="pb-16 sm:pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="rounded-3xl bg-[#4A2F1F] p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#C9A22710_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
            <div className="relative z-10">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">Still have questions?</h2>
              <p className="text-white/70 text-sm mb-8 max-w-sm mx-auto">
                Our team is available 9am–8pm, 7 days a week. Reach us via WhatsApp, phone, or email.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <a
                  href="https://wa.me/919913252232"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-[#1ebe57] transition-all shadow"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp Us
                </a>
                <a
                  href="tel:+919913252232"
                  className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-white/15 transition-all"
                >
                  <Phone className="h-4 w-4" /> Call Us
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-[#C9A227] text-[#2A1209] font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-[#C9A227]/85 transition-all"
                >
                  <Mail className="h-4 w-4" /> Contact Form
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
