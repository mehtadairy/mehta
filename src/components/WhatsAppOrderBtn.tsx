"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

interface WhatsAppOrderBtnProps {
  productName?: string;
  quantity?: number;
  messagePrefix?: string;
  className?: string;
  phoneNumber?: string; // Default mehta dairy phone
}

export default function WhatsAppOrderBtn({
  productName,
  quantity = 1,
  messagePrefix = "Hello Mehta Dairy,\n\nI would like to order/inquire about:",
  className = "",
  phoneNumber = "919876543210" // Default phone number
}: WhatsAppOrderBtnProps) {
  
  const handleWhatsAppClick = () => {
    let message = messagePrefix;
    if (productName) {
      message += `\n\nProduct: ${productName}`;
      message += `\nQuantity: ${quantity}`;
    }
    message += `\n\nPlease assist me.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleWhatsAppClick}
      className={`flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-[0_4px_14px_rgba(37,211,102,0.3)] active:shadow-none ${className}`}
    >
      <MessageCircle className="w-5 h-5 fill-current" />
      <span>Order on WhatsApp</span>
    </motion.button>
  );
}
