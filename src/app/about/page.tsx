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

export default function About() {
  return (
    <div className="bg-[#FAF6EE] min-h-screen text-[#2C2C2C] selection:bg-[#D97706]/20">
      <Header />
      <WhatsAppFloat />

      {/* --- SECTION 1: HERO --- */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background Image: Storefront Outside */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/store_outside.jpeg')" }}
        ></div>

        {/* Subtle dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"></div>

        <div className="relative z-10 text-center max-w-4xl px-4 flex flex-col items-center gap-4">
          <span className="text-[0.7rem] font-bold text-[#C9A227] uppercase tracking-[0.3em] block">
            Palitana, Gujarat
          </span>
          <h1 className="font-serif text-5xl sm:text-6xl font-bold text-white tracking-wide uppercase">
            MEHTA DAIRY
          </h1>
          <p className="font-serif text-xl sm:text-2xl italic text-[#FAF6EE]/90">
            Serving Palitana Since 1972
          </p>
          <div className="h-0.5 w-16 bg-[#C9A227]"></div>
          <p className="text-xs sm:text-sm text-white/80 uppercase tracking-widest max-w-lg leading-relaxed">
            More Than 50 Years of Trust, Tradition & Quality
          </p>
          <div className="mt-4">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-xl bg-[#FAF6EE] text-[#4A2F1F] hover:bg-[#FAF6EE]/90 px-8 py-3.5 text-xs font-bold uppercase tracking-wider shadow-md transition-all hover:-translate-y-0.5"
            >
              Explore Products
            </Link>
          </div>
        </div>
      </section>

      {/* --- SECTION 2: OUR STORY --- */}
      <section className="py-24 bg-white border-b border-[#4A2F1F]/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Story Content Left */}
            <div className="flex flex-col gap-6">
              <span className="text-[0.68rem] font-bold text-[#D97706] uppercase tracking-[0.25em] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#C9A227]" /> Since 1972 Legacy
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A2F1F] leading-tight">
                Our Story
              </h2>
              <div className="h-0.5 w-16 bg-[#C9A227]"></div>

              <p className="text-xs sm:text-sm text-[#555] leading-relaxed">
                Founded in 1972 by <strong className="text-[#4A2F1F]">Shri Khantilal Tribhovandas Mehta</strong>, Mehta Dairy began with a simple vision: serving fresh sweets and authentic flavors to the people of Palitana.
              </p>

              <p className="text-xs sm:text-sm text-[#555] leading-relaxed">
                Over the decades, the business has become a trusted destination for families, visitors, and Jain pilgrims seeking quality sweets, namkeen, sharbat, and traditional delicacies.
              </p>

              <p className="text-xs sm:text-sm text-[#555] leading-relaxed font-semibold text-[#4A2F1F]">
                Today, under the leadership of <strong className="text-[#4A2F1F]">Shri Jaydeepbhai Bhaveshbhai Mehta</strong>, Mehta Dairy continues its commitment to quality while embracing modern technology and online ordering.
              </p>
            </div>

            {/* Mehta Dairy Branding Wall Image Right */}
            <div className="relative rounded-2xl overflow-hidden border border-[#4A2F1F]/10 bg-[#FAF6EE] p-3 shadow-md group">
              <img
                src="/store_entry_image.jpeg"
                alt="Mehta Dairy Branding Wall Inside"
                className="w-full h-auto rounded-xl object-cover transition-transform duration-700 group-hover:scale-103"
              />
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 3: FOUNDER & LEADERSHIP --- */}
      <section className="py-24 bg-[#FAF6EE] border-b border-[#4A2F1F]/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[0.65rem] font-bold text-[#D97706] uppercase tracking-[0.2em]">Our Leaders</span>
            <h2 className="font-serif text-3xl font-bold text-[#4A2F1F] mt-1 uppercase">Founder & Leadership</h2>
            <div className="h-0.5 w-16 bg-[#C9A227] mx-auto mt-3"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* Card 1: Founder */}
            <div className="bg-white rounded-2xl border border-[#4A2F1F]/10 p-8 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-3">
                <span className="text-[0.62rem] font-bold text-[#C9A227] uppercase tracking-widest">The Roots</span>
                <h4 className="font-serif text-xl font-bold text-[#4A2F1F]">Shri Khantilal Tribhovandas Mehta</h4>
                <p className="text-xs text-[#D97706] font-semibold uppercase tracking-wider">Founder of Mehta Dairy</p>
                <div className="h-px bg-[#4A2F1F]/10 my-1"></div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Established the business in 1972 with a vision of quality and trust, serving original milk formulations to Palitana's visitors and residents.
                </p>
              </div>
            </div>

            {/* Card 2: Current Leadership */}
            <div className="bg-white rounded-2xl border border-[#4A2F1F]/10 p-8 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-3">
                <span className="text-[0.62rem] font-bold text-[#D97706] uppercase tracking-widest">Next Generation</span>
                <h4 className="font-serif text-xl font-bold text-[#4A2F1F]">Shri Jaydeepbhai Bhaveshbhai Mehta</h4>
                <p className="text-xs text-[#D97706] font-semibold uppercase tracking-wider">Current CEO</p>
                <div className="h-px bg-[#4A2F1F]/10 my-1"></div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Leading the next generation while preserving the values and traditional recipes of Mehta Dairy, integrating safe digital checkout experiences.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 4: OUR JOURNEY (Timeline) --- */}
      <section className="py-24 bg-white border-b border-[#4A2F1F]/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[0.65rem] font-bold text-[#D97706] uppercase tracking-[0.2em]">Our History</span>
            <h2 className="font-serif text-3xl font-bold text-[#4A2F1F] mt-1 uppercase">Our Journey</h2>
            <div className="h-0.5 w-16 bg-[#C9A227] mx-auto mt-3"></div>
          </div>

          <div className="relative border-l-2 border-[#C9A227]/30 ml-4 pl-8 flex flex-col gap-12">

            <div className="relative group">
              <div className="absolute -left-[41px] top-1 bg-[#4A2F1F] text-white rounded-full w-5 h-5 border-4 border-white shadow-sm transition-transform group-hover:scale-110"></div>
              <h4 className="font-serif text-base font-bold text-[#4A2F1F]">1972</h4>
              <h5 className="text-xs font-semibold text-[#D97706] uppercase tracking-wider mt-0.5">Mehta Dairy Founded</h5>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Started serving pure, fresh, authentic sweets to the people of Palitana.
              </p>
            </div>

            <div className="relative group">
              <div className="absolute -left-[41px] top-1 bg-[#C9A227] text-white rounded-full w-5 h-5 border-4 border-white shadow-sm transition-transform group-hover:scale-110"></div>
              <h4 className="font-serif text-base font-bold text-[#4A2F1F]">1980s</h4>
              <h5 className="text-xs font-semibold text-[#D97706] uppercase tracking-wider mt-0.5">Expanded Product Offerings</h5>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Introduced crunchy farsans, premium namkeens, and refreshing custom sharbats.
              </p>
            </div>

            <div className="relative group">
              <div className="absolute -left-[41px] top-1 bg-[#4A2F1F] text-white rounded-full w-5 h-5 border-4 border-white shadow-sm transition-transform group-hover:scale-110"></div>
              <h4 className="font-serif text-base font-bold text-[#4A2F1F]">2000s</h4>
              <h5 className="text-xs font-semibold text-[#D97706] uppercase tracking-wider mt-0.5">Trusted By Generations</h5>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Established as the premier destination for visitors, pilgrims, and local Gujarati families.
              </p>
            </div>

            <div className="relative group">
              <div className="absolute -left-[41px] top-1 bg-[#C9A227] text-white rounded-full w-5 h-5 border-4 border-white shadow-sm transition-transform group-hover:scale-110"></div>
              <h4 className="font-serif text-base font-bold text-[#4A2F1F]">2020s</h4>
              <h5 className="text-xs font-semibold text-[#D97706] uppercase tracking-wider mt-0.5">Modern Store Renovation</h5>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Renovated our physical store layouts to integrate beautiful modern glass displays and checkouts.
              </p>
            </div>

            <div className="relative group">
              <div className="absolute -left-[41px] top-1 bg-[#4A2F1F] text-white rounded-full w-5 h-5 border-4 border-white shadow-sm transition-transform group-hover:scale-110"></div>
              <h4 className="font-serif text-base font-bold text-[#4A2F1F]">2026</h4>
              <h5 className="text-xs font-semibold text-[#D97706] uppercase tracking-wider mt-0.5">Online Store Launch</h5>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Launched our digital e-commerce web platform to deliver authentic Palitana flavors directly to doorsteps.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 5: INSIDE MEHTA DAIRY (Gallery) --- */}
      <section className="py-24 bg-[#FAF6EE] border-b border-[#4A2F1F]/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[0.65rem] font-bold text-[#D97706] uppercase tracking-[0.2em]">Our Store Experience</span>
            <h2 className="font-serif text-3xl font-bold text-[#4A2F1F] mt-1">Inside Mehta Dairy</h2>
            <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest font-semibold text-[#C9A227]">
              A modern sweet shop built on traditional values.
            </p>
            <div className="h-0.5 w-16 bg-[#C9A227] mx-auto mt-3.5"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gallery Item 1: Counter displays */}
            <div className="group overflow-hidden rounded-2xl border border-[#4A2F1F]/10 bg-white p-2.5 shadow-sm">
              <div className="overflow-hidden rounded-xl aspect-[4/3] relative">
                <img
                  src="/store_inside_counter.jpeg"
                  alt="Sweet counters and Display case inside Mehta Dairy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-3 text-center">
                <h5 className="font-serif text-xs font-bold text-[#4A2F1F] uppercase tracking-wider">Premium Counter Displays</h5>
              </div>
            </div>

            {/* Gallery Item 2: Display Shelves */}
            <div className="group overflow-hidden rounded-2xl border border-[#4A2F1F]/10 bg-white p-2.5 shadow-sm">
              <div className="overflow-hidden rounded-xl aspect-[4/3] relative">
                <img
                  src="/store_products_storage.jpeg"
                  alt="Product shelves filled with fresh snacks and boxes inside Mehta Dairy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-3 text-center">
                <h5 className="font-serif text-xs font-bold text-[#4A2F1F] uppercase tracking-wider">Aromatic Savory Shelves</h5>
              </div>
            </div>

            {/* Gallery Item 3: Front door welcome */}
            <div className="group overflow-hidden rounded-2xl border border-[#4A2F1F]/10 bg-white p-2.5 shadow-sm">
              <div className="overflow-hidden rounded-xl aspect-[4/3] relative">
                <img
                  src="/store_outside.jpeg"
                  alt="Welcome glass entry door storefront of Mehta Dairy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-3 text-center">
                <h5 className="font-serif text-xs font-bold text-[#4A2F1F] uppercase tracking-wider">Welcoming Store Entry</h5>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 6: WHY CUSTOMERS TRUST US --- */}
      <section className="py-24 bg-white border-b border-[#4A2F1F]/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[0.65rem] font-bold text-[#D97706] uppercase tracking-[0.2em]">Our Commitments</span>
            <h2 className="font-serif text-3xl font-bold text-[#4A2F1F] mt-1">Why Customers Trust Us</h2>
            <div className="h-0.5 w-16 bg-[#C9A227] mx-auto mt-3"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

            <div className="flex gap-4 p-6 rounded-2xl border border-[#4A2F1F]/10 hover:bg-[#FAF6EE]/50 transition-colors">
              <CheckCircle2 className="h-6 w-6 text-[#D97706] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">Since 1972</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Serving the finest authentic taste formulations since our first day of opening.</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl border border-[#4A2F1F]/10 hover:bg-[#FAF6EE]/50 transition-colors">
              <CheckCircle2 className="h-6 w-6 text-[#C9A227] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">50+ Years Legacy</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Handmade sweet-making processes preserved across three generations of leadership.</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl border border-[#4A2F1F]/10 hover:bg-[#FAF6EE]/50 transition-colors">
              <CheckCircle2 className="h-6 w-6 text-[#D97706] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">Fresh Daily Production</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Prepared in small controlled batches daily to retain moisture and authentic aroma.</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl border border-[#4A2F1F]/10 hover:bg-[#FAF6EE]/50 transition-colors">
              <CheckCircle2 className="h-6 w-6 text-[#C9A227] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">Premium Ingredients</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Made using pure cow ghee, Californian almonds, Goan cashews, and zero artificial colors.</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl border border-[#4A2F1F]/10 hover:bg-[#FAF6EE]/50 transition-colors">
              <CheckCircle2 className="h-6 w-6 text-[#D97706] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">Traditional Recipes</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Taste that reminds you of home. Secret spice blends maintained with pride.</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl border border-[#4A2F1F]/10 hover:bg-[#FAF6EE]/50 transition-colors">
              <CheckCircle2 className="h-6 w-6 text-[#C9A227] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">Secure Online Ordering</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Encrypted Razorpay integrations and direct fast WhatsApp assistance channels.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 7: CONTACT --- */}
      <section className="py-24 bg-[#FAF6EE]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-[#4A2F1F]/10 p-8 sm:p-12 shadow-sm flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="flex flex-col gap-4 max-w-md">
              <span className="text-[0.62rem] font-bold text-[#D97706] uppercase tracking-widest">Connect With Us</span>
              <h3 className="font-serif text-3xl font-bold text-[#4A2F1F] leading-tight">Mehta Dairy</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Visit our physical store in Palitana to browse sweets, namkeens, and premium gifting sets, or request delivery over WhatsApp/Call.
              </p>

              <div className="flex flex-col gap-2.5 text-xs font-semibold text-[#4A2F1F] mt-2">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4.5 w-4.5 text-[#C9A227]" /> Palitana, Gujarat, India.
                </span>
                <span className="flex items-center gap-2">
                  <Phone className="h-4.5 w-4.5 text-[#C9A227]" /> +91 98989 81952
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-[#C9A227]" /> 9:00 AM - 10:00 PM (Daily)
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto min-w-[240px]">
              <a
                href="https://wa.me/919898981952?text=Hello%20Mehta%20Dairy"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white hover:bg-[#1ebd57] py-3 text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 fill-current" /> WhatsApp Chat
              </a>

              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#4A2F1F] text-[#4A2F1F] hover:bg-[#4A2F1F]/5 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <MapPin className="h-4 w-4" /> Google Maps Link
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
