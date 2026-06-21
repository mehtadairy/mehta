"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import WhatsAppOrderBtn from "@/components/WhatsAppOrderBtn";
import { getCoupons, Coupon, generateSlug } from "@/lib/types";
import { 
  ShoppingBasket, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft, 
  ArrowRight, 
  Tag, 
  ShoppingBag, 
  CreditCard 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Cart() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  
  // Sync state on load
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Sync cart
    const storedCart = localStorage.getItem("mehta_cart");
    if (storedCart) setCart(JSON.parse(storedCart));
  }, []);

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);



  // Cart actions
  const updateQuantity = (productId: string, weight: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.productId === productId && item.weight === weight) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    });
    setCart(updated);
    localStorage.setItem("mehta_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const removeItem = (productId: string, weight: string) => {
    const updated = cart.filter(item => !(item.productId === productId && item.weight === weight));
    setCart(updated);
    localStorage.setItem("mehta_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const deliveryCharge = cartSubtotal > 0 ? (cartSubtotal >= 750 ? 0 : 60) : 0;
  const totalPayable = Math.max(0, cartSubtotal + deliveryCharge);

  return (
    <>
      <Header />
      <WhatsAppFloat />

      {/* --- PAGE HEADER --- */}
      <section className="bg-brand-cream border-b border-brand-beige py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-bold text-brand-charcoal text-center">
            Shopping Cart Summary
          </h2>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Review your sweets selection before checking out.
          </p>
        </div>
      </section>

      {/* --- CART WORKSPACE --- */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-[#EAE0D3] rounded-3xl p-8 max-w-lg mx-auto shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="w-24 h-24 bg-[#FAF6EE] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-[#EAE0D3]">
                  <ShoppingBag className="h-10 w-10 text-brand-orange" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-brand-charcoal">Your Cart is Empty</h3>
                <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto leading-relaxed">
                  Looks like you haven't added any sweet delicacies or savory farsan to your basket yet.
                </p>
                <Link 
                  href="/shop"
                  className="mt-8 inline-flex items-center justify-center rounded-xl bg-brand-charcoal px-8 py-4 min-h-[44px] text-sm font-bold text-white transition-all hover:bg-black hover:scale-105 active:scale-95 shadow-md"
                >
                  Explore Our Best Sellers
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Cart Items Checklist */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <AnimatePresence mode="popLayout">
                  {cart.map((item, idx) => (
                    <motion.div 
                      key={`${item.productId}-${item.weight}`}
                      layout
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -150 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="bg-white rounded-2xl border border-brand-beige p-4 sm:p-5 flex flex-row items-start gap-4 shadow-xs relative"
                    >
                      <img 
                        src={item.image} 
                        alt={item.productName} 
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover bg-brand-cream border border-brand-beige flex-shrink-0"
                      />
                      
                      <div className="flex-grow flex flex-col justify-start">
                        <Link href={`/product/${generateSlug(item.productName)}`}>
                          <h4 className="font-serif text-sm sm:text-base font-bold text-brand-charcoal hover:text-brand-orange transition-colors pr-8">
                            {item.productName}
                          </h4>
                        </Link>
                        <span className="text-[0.65rem] font-bold text-brand-gold uppercase tracking-wider block mt-1 mb-2.5">
                          {item.weight} • ₹{item.price} each
                        </span>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-3 sm:gap-6 mt-auto">
                          {/* Quantity Counter */}
                          <div className="flex items-center border border-brand-beige rounded-lg overflow-hidden bg-brand-cream h-10 sm:h-11 w-max">
                            <button 
                              onClick={() => updateQuantity(item.productId, item.weight, -1)}
                              className="p-1 px-4 hover:bg-brand-beige text-brand-charcoal transition-colors h-full flex items-center justify-center"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-3 text-xs font-bold">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.productId, item.weight, 1)}
                              className="p-1 px-4 hover:bg-brand-beige text-brand-charcoal transition-colors h-full flex items-center justify-center"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Remove item button */}
                          <button 
                            onClick={() => removeItem(item.productId, item.weight)}
                            className="absolute top-3 right-3 sm:static text-red-500 hover:text-red-700 flex items-center justify-center p-2 rounded-full hover:bg-red-50 transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4.5 w-4.5" /> <span className="hidden sm:inline ml-1 text-xs font-semibold">Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Dynamic line item total */}
                      <div className="font-serif font-bold text-base sm:text-lg text-brand-charcoal absolute bottom-4 right-4 sm:static sm:min-w-[80px] sm:text-right w-auto">
                        ₹{item.price * item.quantity}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Back to shopping hook */}
                <div className="mt-4">
                  <Link 
                    href="/shop"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:underline"
                  >
                    <ArrowLeft className="h-4 w-4" /> Continue Gifting Shopping
                  </Link>
                </div>
              </div>

              {/* Right Column: Order Summary */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Summary totals details */}
                <div className="bg-white border border-brand-beige rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                  <h3 className="font-serif text-base font-bold text-brand-charcoal border-b border-brand-beige pb-3">
                    Order Summary
                  </h3>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Sweets Subtotal</span>
                    <span className="font-bold text-brand-charcoal">₹{cartSubtotal}</span>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Delivery Charge</span>
                    {deliveryCharge === 0 ? (
                      <span className="text-emerald-600 font-bold uppercase text-[0.68rem] tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">Free Shipping</span>
                    ) : (
                      <span className="font-bold text-brand-charcoal">₹{deliveryCharge}</span>
                    )}
                  </div>
                  
                  {deliveryCharge > 0 && (
                    <p className="text-[0.68rem] text-brand-gold font-medium leading-normal">
                      💡 Tip: Add sweets worth ₹{750 - cartSubtotal} more to unlock <strong>FREE DELIVERY</strong>!
                    </p>
                  )}

                  <div className="h-px bg-brand-beige"></div>

                  <div className="flex justify-between text-sm font-bold text-brand-charcoal">
                    <span>Total Payable</span>
                    <span className="font-serif text-lg text-brand-orange">₹{totalPayable}</span>
                  </div>

                  <button 
                    onClick={() => {
                      const isLoggedIn = localStorage.getItem("mehta_logged_in") === "true";
                      if (!isLoggedIn) {
                        router.push("/account?redirect=/checkout");
                      } else {
                        router.push("/checkout");
                      }
                    }}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-brand-orange py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-hover shadow-md mt-2 cursor-pointer"
                  >
                    Proceed to Payment <ArrowRight className="ml-1.5 h-4.5 w-4.5" />
                  </button>

                  <div className="relative flex items-center my-1">
                    <div className="flex-grow h-px bg-brand-beige"></div>
                    <span className="flex-shrink-0 mx-3 text-[0.62rem] font-bold text-muted-foreground uppercase tracking-wider">or</span>
                    <div className="flex-grow h-px bg-brand-beige"></div>
                  </div>

                  <WhatsAppOrderBtn 
                    messagePrefix={`Hello Mehta Dairy,\n\nI want to place an order for the items in my cart.\nCart Total: ₹${totalPayable}`}
                    className="w-full text-sm py-3.5"
                  />
                </div>

              </div>

            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
