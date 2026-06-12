"use client";

import React, { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { Award, ShieldCheck, HelpCircle, UtensilsCrossed, Sparkles } from "lucide-react";
import { motion, useInView } from "framer-motion";

function Counter({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = value;
    if (start === end) return;

    const totalMiliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 16);
    
    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMiliseconds / incrementTime));
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration, isInView]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function About() {
  return (
    <>
      <Header />
      <WhatsAppFloat />

      {/* --- HERO BANNER --- */}
      <section className="bg-brand-cream border-b border-brand-beige py-16 text-center mt-20 sm:mt-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="inline-flex max-w-fit items-center gap-1.5 rounded-full bg-brand-gold/15 border border-brand-gold px-3.5 py-1 text-[0.68rem] font-bold text-brand-gold uppercase tracking-wider mx-auto"
          >
            <Sparkles className="h-3.5 w-3.5" /> Established 1952
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-brand-charcoal"
          >
            The Story of Mehta Sweet Mart
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto"
          >
            A journey of pure cow ghee, handcrafted delicacies, and traditional values uniting families across India and overseas for over seven decades.
          </motion.p>
        </div>
      </section>

      {/* --- OUR LEGACY STORY --- */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Visual block left */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 90, damping: 15 }}
              className="lg:col-span-5 aspect-4/3 overflow-hidden rounded-2xl border border-brand-beige bg-brand-cream shadow-md"
            >
              <img 
                src="https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&auto=format&fit=crop&q=80" 
                alt="Karigar crafting traditional Indian sweets" 
                className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
              />
            </motion.div>
            {/* Text details right */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 90, damping: 15 }}
              className="lg:col-span-7 flex flex-col gap-5"
            >
              <h3 className="font-serif text-2xl font-bold text-brand-charcoal">Our Heritage Journey</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Mehta Sweet Mart started in 1952 as a tiny sweet shop in the historic streets of old Ahmedabad. Founded by Shri Hariprasad Mehta, the shop quickly became a popular neighborhood spot, famous for its rich Kesar Peda and hot, crispy Fafda-Jalebi served fresh every morning.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Hariprasadji believed in a simple philosophy: "Purity is the highest virtue of sweet-making." He insisted on sourcing fresh milk directly from local dairy farmers and slow-churning pure cow ghee. This commitment to raw material quality became the foundation of our brand.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Today, his grandchildren carry forward this legacy, blending traditional sweet-making processes with state-of-the-art hygiene standards. We ship our sweets worldwide, allowing families abroad to taste the authentic flavors of home.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- STATS BAND --- */}
      <section className="bg-gradient-to-r from-[#800c0c] to-[#4d0707] py-12 text-white border-y border-brand-gold/20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col gap-1">
              <span className="font-serif text-3xl sm:text-4xl font-extrabold text-brand-gold">
                <Counter value={74} suffix="+" />
              </span>
              <span className="text-[0.62rem] tracking-widest text-brand-cream/70 uppercase font-semibold">Years of Legacy</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-serif text-3xl sm:text-4xl font-extrabold text-brand-gold">
                <Counter value={50000} suffix="+" />
              </span>
              <span className="text-[0.62rem] tracking-widest text-brand-cream/70 uppercase font-semibold">Happy Customers</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-serif text-3xl sm:text-4xl font-extrabold text-brand-gold">
                <Counter value={150} suffix="+" />
              </span>
              <span className="text-[0.62rem] tracking-widest text-brand-cream/70 uppercase font-semibold">Sweet Varieties</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-serif text-3xl sm:text-4xl font-extrabold text-brand-gold">
                <Counter value={50} suffix="+" />
              </span>
              <span className="text-[0.62rem] tracking-widest text-brand-cream/70 uppercase font-semibold">Legacy Recipes</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- QUALITY & HYGIENE COMMITMENT --- */}
      <section className="py-20 bg-brand-cream/35 border-y border-brand-beige">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-3xl font-bold tracking-tight text-brand-charcoal mb-4"
            >
              Commitment to Excellence
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-sm text-muted-foreground"
            >
              We understand that sweet-making is an art that requires absolute precision and hygiene control.
            </motion.p>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 90, damping: 15 } }
              }}
              whileHover={{ y: -6, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.02)" }}
              className="bg-white rounded-2xl border border-brand-beige p-6.5 text-center flex flex-col items-center transition-shadow duration-300"
            >
              <div className="h-12 w-12 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange mb-4 border border-brand-orange/20">
                <UtensilsCrossed className="h-6 w-6" />
              </div>
              <h4 className="font-serif text-base font-bold text-brand-charcoal mb-2.5">Sourcing & Ingredients</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We use premium Kashmiri saffron, Goan cashews, Californian almonds, and fresh milk fat. No synthetic colors or thickeners are ever used in our kitchen.
              </p>
            </motion.div>

            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 90, damping: 15 } }
              }}
              whileHover={{ y: -6, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.02)" }}
              className="bg-white rounded-2xl border border-brand-beige p-6.5 text-center flex flex-col items-center transition-shadow duration-300"
            >
              <div className="h-12 w-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-4 border border-brand-gold/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h4 className="font-serif text-base font-bold text-brand-charcoal mb-2.5">Hygiene & Safety</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our manufacturing plant is completely certified. Our staff follow strict sanitization codes, wearing masks and gloves while hand-packing boxes.
              </p>
            </motion.div>

            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 90, damping: 15 } }
              }}
              whileHover={{ y: -6, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.02)" }}
              className="bg-white rounded-2xl border border-brand-beige p-6.5 text-center flex flex-col items-center transition-shadow duration-300"
            >
              <div className="h-12 w-12 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange mb-4 border border-brand-orange/20">
                <Award className="h-6 w-6" />
              </div>
              <h4 className="font-serif text-base font-bold text-brand-charcoal mb-2.5">Authentic Karigars</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our sweets are crafted by master chefs who have worked with us for over three decades, ensuring consistent taste and authentic textures.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- MANUFACTURING TIMELINE --- */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.h3 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-2xl font-bold text-brand-charcoal text-center mb-14"
          >
            How We Make Sweets
          </motion.h3>
          
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.15 } }
            }}
            className="flex flex-col gap-8"
          >
            <motion.div 
              variants={{
                hidden: { opacity: 0, x: -30 },
                show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100, damping: 16 } }
              }}
              className="flex gap-6 items-start"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange text-white font-bold text-xs flex-shrink-0 shadow-sm mt-0.5">1</div>
              <div>
                <h4 className="font-serif text-sm font-bold text-brand-charcoal mb-1">Slow Roasting & Boiling</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We slow-roast chickpea flour and nuts in brass kadhais over a low flame to bring out rich aromas, and boil fresh whole milk to prepare dense khoya solids daily.
                </p>
              </div>
            </motion.div>

            <motion.div 
              variants={{
                hidden: { opacity: 0, x: -30 },
                show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100, damping: 16 } }
              }}
              className="flex gap-6 items-start"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold text-white font-bold text-xs flex-shrink-0 shadow-sm mt-0.5">2</div>
              <div>
                <h4 className="font-serif text-sm font-bold text-brand-charcoal mb-1">Traditional Shuffling & Shaping</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Our sweets are mixed, layered, and shaped by hand. Delicate items like Cham Cham and Sandesh are kneaded by hand to retain air pockets and moisture.
                </p>
              </div>
            </motion.div>

            <motion.div 
              variants={{
                hidden: { opacity: 0, x: -30 },
                show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100, damping: 16 } }
              }}
              className="flex gap-6 items-start"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange text-white font-bold text-xs flex-shrink-0 shadow-sm mt-0.5">3</div>
              <div>
                <h4 className="font-serif text-sm font-bold text-brand-charcoal mb-1">Vacuum Packing & Logistics</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Every order is vacuum packed in airtight trays to lock in freshness. We pack with food-grade silica gel and ship via express air couriers.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}
