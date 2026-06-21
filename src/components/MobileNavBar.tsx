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

  // Exclude bottom navigation bar from distraction-heavy or admin/auth flows
  if (
    !pathname ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/product/") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/complete-profile") ||
    pathname.startsWith("/api")
  ) {
    return null;
  }

  // Check if a path is active (with parent highlighting support)
  const isHomeActive = pathname === "/";
  const isShopActive = pathname.startsWith("/shop") || pathname.startsWith("/product");
  const isProfileActive = pathname.startsWith("/account");
  const isCartActive = pathname.startsWith("/cart");

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-[#EAE0D3] shadow-[0_10px_30px_rgba(0,0,0,0.08)] h-[65px] rounded-full flex items-center justify-around lg:hidden px-2">
      {/* Home Tab */}
      <Link 
        href="/" 
        className="flex flex-col items-center justify-center h-full flex-1"
      >
        <div className={`px-4 py-1.5 rounded-full flex items-center justify-center transition-all duration-300 ${
          isHomeActive ? "bg-[#FDF2EC] text-[#D46D2D]" : "text-[#7E6B5A]"
        }`}>
          <Home className="w-5 h-5" strokeWidth={isHomeActive ? 2.5 : 2} />
        </div>
        <span className={`text-[0.58rem] font-bold tracking-wider uppercase mt-1 transition-colors duration-300 ${
          isHomeActive ? "text-[#D46D2D]" : "text-[#7E6B5A]"
        }`}>Home</span>
      </Link>

      {/* Shop Tab */}
      <Link 
        href="/shop" 
        className="flex flex-col items-center justify-center h-full flex-1"
      >
        <div className={`px-4 py-1.5 rounded-full flex items-center justify-center transition-all duration-300 ${
          isShopActive ? "bg-[#FDF2EC] text-[#D46D2D]" : "text-[#7E6B5A]"
        }`}>
          <ShoppingBag className="w-5 h-5" strokeWidth={isShopActive ? 2.5 : 2} />
        </div>
        <span className={`text-[0.58rem] font-bold tracking-wider uppercase mt-1 transition-colors duration-300 ${
          isShopActive ? "text-[#D46D2D]" : "text-[#7E6B5A]"
        }`}>Shop</span>
      </Link>

      {/* Cart Tab */}
      <button 
        onClick={triggerCartOpen}
        className="flex flex-col items-center justify-center h-full flex-1 cursor-pointer group"
      >
        <div className={`relative px-4 py-1.5 rounded-full flex items-center justify-center transition-all duration-300 ${
          isCartActive ? "bg-[#FDF2EC] text-[#D46D2D]" : "text-[#7E6B5A] group-hover:text-[#D46D2D]"
        }`}>
          <ShoppingCart className="w-5 h-5" strokeWidth={isCartActive ? 2.5 : 2} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-0.5 bg-[#D46D2D] text-white text-[0.55rem] font-bold min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-0.5 shadow-sm border border-white">
              {cartCount}
            </span>
          )}
        </div>
        <span className={`text-[0.58rem] font-bold tracking-wider uppercase mt-1 transition-colors duration-300 ${
          isCartActive ? "text-[#D46D2D]" : "text-[#7E6B5A] group-hover:text-[#D46D2D]"
        }`}>Cart</span>
      </button>

      {/* Search Tab */}
      <button 
        onClick={triggerSearchOpen}
        className="flex flex-col items-center justify-center h-full flex-1 cursor-pointer group"
      >
        <div className="px-4 py-1.5 rounded-full flex items-center justify-center transition-all duration-300 text-[#7E6B5A] group-hover:text-[#D46D2D] group-hover:bg-[#FDF2EC]">
          <Search className="w-5 h-5" strokeWidth={2} />
        </div>
        <span className="text-[0.58rem] font-bold tracking-wider uppercase mt-1 text-[#7E6B5A] group-hover:text-[#D46D2D] transition-colors duration-300">Search</span>
      </button>

      {/* Profile/Account Tab */}
      <Link 
        href="/account" 
        className="flex flex-col items-center justify-center h-full flex-1"
      >
        <div className={`px-4 py-1.5 rounded-full flex items-center justify-center transition-all duration-300 ${
          isProfileActive ? "bg-[#FDF2EC] text-[#D46D2D]" : "text-[#7E6B5A]"
        }`}>
          <User className="w-5 h-5" strokeWidth={isProfileActive ? 2.5 : 2} />
        </div>
        <span className={`text-[0.58rem] font-bold tracking-wider uppercase mt-1 transition-colors duration-300 ${
          isProfileActive ? "text-[#D46D2D]" : "text-[#7E6B5A]"
        }`}>Account</span>
      </Link>
    </div>
  );
}
