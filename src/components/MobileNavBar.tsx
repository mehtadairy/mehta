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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-beige shadow-[0_-4px_12px_rgba(0,0,0,0.05)] h-16 flex items-center justify-around md:hidden px-4">
      {/* Home Tab */}
      <Link 
        href="/" 
        className={`flex flex-col items-center justify-center w-14 h-full transition-colors ${
          isHomeActive ? "text-brand-orange" : "text-brand-charcoal/60"
        }`}
      >
        <Home className="w-5.5 h-5.5" strokeWidth={isHomeActive ? 2.5 : 2} />
        <span className="text-[0.62rem] font-bold tracking-wider uppercase mt-1">Home</span>
      </Link>

      {/* Shop Tab */}
      <Link 
        href="/shop" 
        className={`flex flex-col items-center justify-center w-14 h-full transition-colors ${
          isShopActive ? "text-brand-orange" : "text-brand-charcoal/60"
        }`}
      >
        <ShoppingBag className="w-5.5 h-5.5" strokeWidth={isShopActive ? 2.5 : 2} />
        <span className="text-[0.62rem] font-bold tracking-wider uppercase mt-1">Shop</span>
      </Link>

      {/* Center Floating Cart Button */}
      <div className="relative -top-5 flex flex-col items-center justify-center">
        <button 
          onClick={triggerCartOpen}
          className="w-14 h-14 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer relative"
        >
          <ShoppingCart className="w-6 h-6" strokeWidth={2.5} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#f59e0b] text-white text-[0.65rem] font-bold min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Tab */}
      <button 
        onClick={triggerSearchOpen}
        className="flex flex-col items-center justify-center w-14 h-full text-brand-charcoal/60 hover:text-brand-orange transition-colors cursor-pointer"
      >
        <Search className="w-5.5 h-5.5" strokeWidth={2} />
        <span className="text-[0.62rem] font-bold tracking-wider uppercase mt-1">Search</span>
      </button>

      {/* Profile/Account Tab */}
      <Link 
        href="/account" 
        className={`flex flex-col items-center justify-center w-14 h-full transition-colors ${
          isProfileActive ? "text-brand-orange" : "text-brand-charcoal/60"
        }`}
      >
        <User className="w-5.5 h-5.5" strokeWidth={isProfileActive ? 2.5 : 2} />
        <span className="text-[0.62rem] font-bold tracking-wider uppercase mt-1">Profile</span>
      </Link>
    </div>
  );
}
