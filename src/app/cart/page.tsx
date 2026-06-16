"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getCoupons, Coupon } from "@/lib/types";
import { ShoppingBasket, Trash2, Plus, Minus, ArrowLeft, ArrowRight, Tag } from "lucide-react";

export default function Cart() {
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
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-brand-beige rounded-2xl p-8 max-w-md mx-auto">
              <ShoppingBasket className="h-16 w-16 text-brand-beige mb-4" />
              <h3 className="font-serif text-lg font-bold text-brand-charcoal">Your Cart is Empty</h3>
              <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                Looks like you haven't added any sweet delicacies or savory farsan to your basket yet.
              </p>
              <Link 
                href="/shop"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-orange px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-orange-hover shadow-sm"
              >
                Go to Shop Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Cart Items Checklist */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                {cart.map((item, idx) => (
                  <div 
                    key={`${item.productId}-${item.weight}-${idx}`}
                    className="bg-white rounded-2xl border border-brand-beige p-5 flex flex-col sm:flex-row items-center gap-5 shadow-xs"
                  >
                    <img 
                      src={item.image} 
                      alt={item.productName} 
                      className="h-20 w-20 rounded-xl object-cover bg-brand-cream border border-brand-beige flex-shrink-0"
                    />
                    
                    <div className="flex-grow text-center sm:text-left">
                      <Link href={`/product/${item.productId}`}>
                        <h4 className="font-serif text-base font-bold text-brand-charcoal hover:text-brand-orange transition-colors">
                          {item.productName}
                        </h4>
                      </Link>
                      <span className="text-[0.7rem] font-bold text-brand-gold uppercase tracking-wider block mt-1.5 mb-3">
                        {item.weight} • ₹{item.price} each
                      </span>

                      <div className="flex items-center justify-center sm:justify-start gap-6">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-brand-beige rounded-lg overflow-hidden bg-brand-cream h-8.5">
                          <button 
                            onClick={() => updateQuantity(item.productId, item.weight, -1)}
                            className="p-1 px-3 hover:bg-brand-beige text-brand-charcoal transition-colors h-full"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-3 text-xs font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.productId, item.weight, 1)}
                            className="p-1 px-3 hover:bg-brand-beige text-brand-charcoal transition-colors h-full"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Remove item button */}
                        <button 
                          onClick={() => removeItem(item.productId, item.weight)}
                          className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs font-semibold hover:underline"
                        >
                          <Trash2 className="h-4 w-4" /> Remove
                        </button>
                      </div>
                    </div>

                    {/* Dynamic line item total */}
                    <div className="font-serif font-bold text-lg text-brand-charcoal min-w-[80px] text-center sm:text-right border-t sm:border-t-0 border-brand-beige pt-3 sm:pt-0 w-full sm:w-auto">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))}

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

                  <Link 
                    href="/checkout"
                    className="w-full inline-flex items-center justify-center rounded-xl bg-brand-orange py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-hover shadow-md mt-2"
                  >
                    Proceed to Payment <ArrowRight className="ml-1.5 h-4.5 w-4.5" />
                  </Link>
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
