"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Send, ChevronUp } from "lucide-react";

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

  return (
    <footer className="bg-brand-cream border-t border-brand-beige text-brand-charcoal">
      {/* Upper Footer: Cream background */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* About Mehta Sweet Mart */}
          <div className="flex flex-col gap-4">
            <h4 className="font-serif text-sm font-bold text-brand-charcoal uppercase tracking-wider">
              About Mehta Sweet Mart
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              One taste stays unforgettable — Ahmedabad's legendary sweets. Mehta Sweet Mart is the best place to visit in Gujarat. Now delivering globally. Savor the premium sweets crafted in Gujarat, proudly known as India's "City of Sweets", delivered fresh to your world.
            </p>
          </div>

          {/* Explore Links */}
          <div className="flex flex-col gap-4">
            <h4 className="font-serif text-sm font-bold text-brand-charcoal uppercase tracking-wider">
              Explore
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-muted-foreground font-semibold">
              <li><Link href="/shop" className="hover:text-brand-orange transition-colors">Products</Link></li>

              <li><Link href="/about" className="hover:text-brand-orange transition-colors">About Us</Link></li>
              <li><Link href="/blogs" className="hover:text-brand-orange transition-colors">Blogs</Link></li>
              <li><Link href="/contact" className="hover:text-brand-orange transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Policies */}
          <div className="flex flex-col gap-4">
            <h4 className="font-serif text-sm font-bold text-brand-charcoal uppercase tracking-wider">
              Policies
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-muted-foreground font-semibold">
              <li><a href="/about" className="hover:text-brand-orange transition-colors">Refund Policy</a></li>
              <li><a href="/about" className="hover:text-brand-orange transition-colors">Privacy Policy</a></li>
              <li><a href="/about" className="hover:text-brand-orange transition-colors">Terms</a></li>
              <li><a href="/about" className="hover:text-brand-orange transition-colors">Online Payment</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col gap-4">
            <h4 className="font-serif text-sm font-bold text-brand-charcoal uppercase tracking-wider">
              Contact
            </h4>
            <div className="flex flex-col gap-3 text-xs text-muted-foreground">
              <p className="leading-relaxed">
                Near Stadium Circle, Off CG Road, Navrangpura, Ahmedabad-380009, Gujarat, India.
              </p>
              <div>
                <span className="block font-bold text-brand-charcoal text-[0.7rem] uppercase mt-1">Customer Care</span>
                <span className="block text-brand-orange font-bold mt-0.5">+91 79 2640 1952</span>
                <span className="block text-brand-orange font-bold">+91 98989 81952</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Footer Copyright: Navy Blue background */}
      <div className="bg-[#0a4d8c] text-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-semibold select-none text-white/80">
            &copy; 2026 All Rights Reserved By Mehta Sweet Mart
          </div>
          
          <div className="flex items-center gap-4">
            {/* Social Media Rounded Buttons */}
            <div className="flex items-center gap-2">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer"
                className="h-8 w-8 rounded bg-[#3b5998] hover:bg-[#2d4373] flex items-center justify-center text-white transition-colors"
                aria-label="Facebook"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                </svg>
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer"
                className="h-8 w-8 rounded bg-[#c13584] hover:bg-[#9c276a] flex items-center justify-center text-white transition-colors"
                aria-label="Instagram"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a 
                href="https://whatsapp.com" 
                target="_blank" 
                rel="noreferrer"
                className="h-8 w-8 rounded bg-[#25d366] hover:bg-[#1ebe57] flex items-center justify-center text-white transition-colors"
                aria-label="WhatsApp"
              >
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.216 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
            
            {/* Scroll-to-top button */}
            <button 
              onClick={scrollToTop}
              className="h-8 w-8 rounded bg-[#073663] hover:bg-[#05294c] flex items-center justify-center text-white transition-colors cursor-pointer border border-[#0a4d8c]"
              aria-label="Scroll to top"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
