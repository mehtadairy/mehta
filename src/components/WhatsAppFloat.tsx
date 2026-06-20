"use client";

import React from "react";

export default function WhatsAppFloat() {
  const phone = "919999999999"; // Custom placeholder phone
  const message = "Hello Mehta Sweet Mart, I would like to inquire about your sweets and gift boxes.";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 md:bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-emerald-500/30"
      aria-label="Contact us on WhatsApp"
    >
      {/* Real WhatsApp Logo */}
      <img 
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
        alt="WhatsApp" 
        className="h-8 w-8 object-contain"
      />
    </a>
  );
}
