"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag } from "lucide-react";

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "info" | "error";
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const prevCartRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load initial cart state to compare against future updates
    const initialCart = localStorage.getItem("mehta_cart");
    if (initialCart) {
      try {
        prevCartRef.current = JSON.parse(initialCart);
      } catch (e) {
        prevCartRef.current = [];
      }
    }

    const handleCartUpdated = () => {
      const storedCart = localStorage.getItem("mehta_cart");
      let currentCart: any[] = [];
      try {
        currentCart = storedCart ? JSON.parse(storedCart) : [];
      } catch (e) {
        currentCart = [];
      }
      
      const prevCart = prevCartRef.current;

      // Detect if an item was added or quantity increased
      let addedItem: any = null;
      let diffQty = 0;

      for (const item of currentCart) {
        const prevItem = prevCart.find(
          (p) => p.productId === item.productId && p.weight === item.weight
        );
        if (!prevItem) {
          addedItem = item;
          diffQty = item.quantity;
          break;
        } else if (item.quantity > prevItem.quantity) {
          addedItem = item;
          diffQty = item.quantity - prevItem.quantity;
          break;
        }
      }

      if (addedItem && diffQty > 0) {
        const msg = `Added ${addedItem.productName} (${addedItem.weight}) to Cart!`;
        const id = Math.random().toString(36).substring(2, 9);
        
        setToasts((prev) => [...prev, { id, message: msg, type: "success" }]);

        // Auto-remove toast after 3 seconds
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
      }

      prevCartRef.current = currentCart;
    };

    const handleShowToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: "success" | "info" | "error" }>;
      const { message, type = "success" } = customEvent.detail;
      const id = Math.random().toString(36).substring(2, 9);
      
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    window.addEventListener("cartUpdated", handleCartUpdated);
    window.addEventListener("showToast" as any, handleShowToast);
    
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
      window.removeEventListener("showToast" as any, handleShowToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
            className="pointer-events-auto w-full bg-white/95 backdrop-blur-md rounded-2xl border border-brand-beige shadow-lg p-4 flex items-center justify-between gap-3.5 relative overflow-hidden"
          >
            {/* Saffron side line */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-orange" />
            
            <div className="flex items-center gap-3 pl-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange/10 text-brand-orange flex-shrink-0">
                <ShoppingBag className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[0.62rem] text-brand-gold uppercase tracking-wider font-bold">Cart Update</span>
                <p className="text-xs font-bold text-brand-charcoal leading-tight">
                  {toast.message}
                </p>
              </div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1.5 text-muted-foreground hover:text-brand-charcoal hover:bg-brand-cream rounded-full transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Helper function to show generic toasts manually if needed
export function showToast(message: string, type: "success" | "info" | "error" = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("showToast", {
      detail: { message, type },
    })
  );
}
