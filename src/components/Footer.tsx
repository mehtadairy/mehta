"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Send, ChevronUp, Award, Heart, Droplet, ShieldCheck, Truck, Clock, Leaf } from "lucide-react";
import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

const colVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.1, ease },
  }),
};

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const socialLinks = [
    {
      href: "https://facebook.com",
      label: "Facebook",
      bg: "bg-[#3b5998] hover:bg-[#2d4373]",
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
        </svg>
      ),
    },
    {
      href: "https://instagram.com",
      label: "Instagram",
      bg: "bg-[#c13584] hover:bg-[#9c276a]",
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
    },
    {
      href: "https://whatsapp.com",
      label: "WhatsApp",
      bg: "bg-[#25d366] hover:bg-[#1ebe57]",
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.216 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-brand-cream border-t border-brand-beige text-brand-charcoal overflow-hidden pb-20">


      {/* Upper Footer: Cream background */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Col 1: About */}
          <motion.div
            custom={0}
            variants={colVariants}
            className="flex flex-col gap-4"
          >
            <h4 className="font-serif text-sm font-bold text-brand-charcoal uppercase tracking-wider">
              About Mehta Sweet Mart
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              One taste stays unforgettable — Ahmedabad&apos;s legendary sweets. Mehta Sweet Mart is the best place to visit in Gujarat. Now delivering globally. Savor the premium sweets crafted in Gujarat, proudly known as India&apos;s &ldquo;City of Sweets&rdquo;, delivered fresh to your world.
            </p>
          </motion.div>

          {/* Col 2: Explore */}
          <motion.div
            custom={1}
            variants={colVariants}
            className="flex flex-col gap-4"
          >
            <h4 className="font-serif text-sm font-bold text-brand-charcoal uppercase tracking-wider">
              Explore
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-muted-foreground font-semibold">
              {[
                { href: "/shop", label: "Products" },
                { href: "/about", label: "About Us" },
                { href: "/blogs", label: "Blogs" },
                { href: "/contact", label: "Contact Us" },
                { href: "/faq", label: "FAQ" },
              ].map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.07, ease }}
                >
                  <Link href={link.href} className="hover:text-brand-orange transition-colors">
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Col 3: Policies */}
          <motion.div
            custom={2}
            variants={colVariants}
            className="flex flex-col gap-4"
          >
            <h4 className="font-serif text-sm font-bold text-brand-charcoal uppercase tracking-wider">
              Policies
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-muted-foreground font-semibold">
              {[
                { href: "/policy/refund", label: "Refund Policy" },
                { href: "/policy/privacy", label: "Privacy Policy" },
                { href: "/policy/terms", label: "Terms" },
                { href: "/policy/payment", label: "Online Payment" },
              ].map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.07, ease }}
                >
                  <Link href={link.href} className="hover:text-brand-orange transition-colors">
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Col 4: Contact */}
          <motion.div
            custom={3}
            variants={colVariants}
            className="flex flex-col gap-4"
          >
            <h4 className="font-serif text-sm font-bold text-brand-charcoal uppercase tracking-wider">
              Contact
            </h4>
            <div className="flex flex-col gap-3 text-xs text-muted-foreground">
              <a
                href="https://share.google/5x2FPvCFeEAeFtI3N"
                target="_blank"
                rel="noreferrer"
                className="leading-relaxed hover:text-brand-orange transition-colors"
              >
                Bhidbhanjan Road, Taleti Road, Navagadh, Palitana, Gujarat 364270
              </a>
              <div>
                <span className="block font-bold text-brand-charcoal text-[0.7rem] uppercase mt-1">Customer Care</span>
                <a href="tel:+919913252232" className="block text-brand-orange font-bold mt-0.5 hover:underline">+91 99132 52232</a>
                <span className="block text-brand-orange font-bold">+91 79 2640 1952</span>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>

      {/* Bottom Footer: Navy blue */}
      <div className="bg-[#0a4d8c] text-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-xs font-semibold select-none text-white/80"
          >
            &copy; 2026 All Rights Reserved By Mehta Sweet Mart
          </motion.div>
          <motion.a
            href="https://optenary.tech"
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center text-xs text-white hover:underline"
          >
            <img src="/optenary.jpeg" alt="Optenary Tech" className="h-5 w-auto mr-2" />
            Developed by Optenary Tech
          </motion.a>

          <div className="flex items-center gap-4">
            {/* Social icons stagger */}
            <div className="flex items-center gap-2">
              {socialLinks.map((s, i) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease }}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  className={`h-8 w-8 rounded ${s.bg} flex items-center justify-center text-white transition-colors`}
                >
                  {s.icon}
                </motion.a>
              ))}
            </div>

            {/* Scroll-to-top */}
            <motion.button
              onClick={scrollToTop}
              initial={{ opacity: 0, scale: 0.7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.35, ease }}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              className="h-8 w-8 rounded bg-[#073663] hover:bg-[#05294c] flex items-center justify-center text-white transition-colors cursor-pointer border border-[#0a4d8c]"
              aria-label="Scroll to top"
            >
              <ChevronUp className="h-5 w-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
}
