"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, ShoppingCart, Search, User } from "lucide-react";

export default function MobileNavBar() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const syncCartCount = () => {
      const storedCart = localStorage.getItem("mehta_cart");
      if (storedCart) {
        try {
          const cart = JSON.parse(storedCart);
          const total = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);
          setCartCount(total);
        } catch (e) {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    syncCartCount();

    window.addEventListener("storage", syncCartCount);
    window.addEventListener("cartUpdated", syncCartCount);

    return () => {
      window.removeEventListener("storage", syncCartCount);
      window.removeEventListener("cartUpdated", syncCartCount);
    };
  }, []);

  const triggerCartOpen = () => {
    window.dispatchEvent(new Event("openCartDrawer"));
  };

  const triggerSearchOpen = () => {
    window.dispatchEvent(new Event("openHeaderSearch"));
  };

  // Check if a path is active
  const isHomeActive = pathname === "/";
  const isShopActive = pathname.startsWith("/shop");
  const isProfileActive = pathname.startsWith("/account") || pathname.startsWith("/admin");

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-[#e8dcc4]/60 shadow-[0_10px_30px_rgba(0,0,0,0.08)] h-[60px] rounded-full flex items-center justify-around lg:hidden px-2">
      {/* Home Tab */}
      <Link 
        href="/" 
        className="flex flex-col items-center justify-center h-full"
      >
        <div className={`px-4.5 py-1 rounded-full flex items-center justify-center transition-all duration-300 ${
          isHomeActive ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal/60"
        }`}>
          <Home className="w-5.5 h-5.5" strokeWidth={isHomeActive ? 2.5 : 2} />
        </div>
        <span className={`text-[0.58rem] font-bold tracking-wider uppercase mt-0.5 ${
          isHomeActive ? "text-brand-orange" : "text-brand-charcoal/60"
        }`}>Home</span>
      </Link>

      {/* Shop Tab */}
      <Link 
        href="/shop" 
        className="flex flex-col items-center justify-center h-full"
      >
        <div className={`px-4.5 py-1 rounded-full flex items-center justify-center transition-all duration-300 ${
          isShopActive ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal/60"
        }`}>
          <ShoppingBag className="w-5.5 h-5.5" strokeWidth={isShopActive ? 2.5 : 2} />
        </div>
        <span className={`text-[0.58rem] font-bold tracking-wider uppercase mt-0.5 ${
          isShopActive ? "text-brand-orange" : "text-brand-charcoal/60"
        }`}>Shop</span>
      </Link>

      {/* Cart Tab */}
      <button 
        onClick={triggerCartOpen}
        className="flex flex-col items-center justify-center h-full cursor-pointer group"
      >
        <div className="relative px-4.5 py-1 rounded-full flex items-center justify-center transition-all duration-300 text-brand-charcoal/60 group-hover:text-brand-orange">
          <ShoppingCart className="w-5.5 h-5.5" strokeWidth={2} />
          {cartCount > 0 && (
            <span className="absolute top-0 right-2.5 bg-brand-orange text-white text-[0.55rem] font-bold min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-0.5 shadow-sm border border-white">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[0.58rem] font-bold tracking-wider uppercase mt-0.5 text-brand-charcoal/60 group-hover:text-brand-orange">Cart</span>
      </button>

      {/* Search Tab */}
      <button 
        onClick={triggerSearchOpen}
        className="flex flex-col items-center justify-center h-full cursor-pointer group"
      >
        <div className="px-4.5 py-1 rounded-full flex items-center justify-center transition-all duration-300 text-brand-charcoal/60 group-hover:text-brand-orange">
          <Search className="w-5.5 h-5.5" strokeWidth={2} />
        </div>
        <span className="text-[0.58rem] font-bold tracking-wider uppercase mt-0.5 text-brand-charcoal/60 group-hover:text-brand-orange">Search</span>
      </button>

      {/* Profile/Account Tab */}
      <Link 
        href="/account" 
        className="flex flex-col items-center justify-center h-full"
      >
        <div className={`px-4.5 py-1 rounded-full flex items-center justify-center transition-all duration-300 ${
          isProfileActive ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal/60"
        }`}>
          <User className="w-5.5 h-5.5" strokeWidth={isProfileActive ? 2.5 : 2} />
        </div>
        <span className={`text-[0.58rem] font-bold tracking-wider uppercase mt-0.5 ${
          isProfileActive ? "text-brand-orange" : "text-brand-charcoal/60"
        }`}>Account</span>
      </Link>
    </div>
  );
}
