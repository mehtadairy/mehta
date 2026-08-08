"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBasket,
  Search,
  Menu,
  X,
  User,
  Trash2,
  Plus,
  Minus,
  LogOut,
  Settings,
  Heart,
  ChevronDown,
  Globe
} from "lucide-react";
import { useLanguage } from "@/lib/context/LanguageContext";
import LanguageDropdown from "./LanguageDropdown";
import {
  Coupon,
  Product
} from "@/lib/types";
import { supabase, fetchCategories, fetchProducts } from "@/lib/supabaseClient";
import { useCustomerAuth } from "@/lib/context/CustomerAuthContext";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn: isAuthContextLoggedIn, profile: contextProfile, logout: authLogout } = useCustomerAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const { t, language, setLanguage } = useLanguage();

  // Custom states for premium navigation animations
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isProductsHovered, setIsProductsHovered] = useState(false);
  const [badgeAnimated, setBadgeAnimated] = useState(false);

  useEffect(() => {
    const handleBadgeAnimate = () => {
      setBadgeAnimated(true);
      setTimeout(() => setBadgeAnimated(false), 500);
    };
    window.addEventListener("cartBadgeAnimate", handleBadgeAnimate);
    return () => window.removeEventListener("cartBadgeAnimate", handleBadgeAnimate);
  }, []);

  useEffect(() => {
    if (searchOpen && allProducts.length === 0) {
      fetchProducts().then(data => setAllProducts(data));
    }
  }, [searchOpen, allProducts.length]);

  useEffect(() => {
    // Request notification and location after 5 seconds
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && 'Notification' in window && navigator.geolocation) {
        if (Notification.permission === 'default') {
          Notification.requestPermission().then(async (permission) => {
            if (permission === 'granted') {
              try {
                const reg = await navigator.serviceWorker.register('/sw.js');
                let sub = await reg.pushManager.getSubscription();
                if (!sub) {
                  const res = await fetch('/api/vapidPublicKey');
                  const { publicKey } = await res.json();
                  if (publicKey) {
                    const padding = '='.repeat((4 - publicKey.length % 4) % 4);
                    const base64 = (publicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
                    const rawData = window.atob(base64);
                    const outputArray = new Uint8Array(rawData.length);
                    for (let i = 0; i < rawData.length; ++i) {
                      outputArray[i] = rawData.charCodeAt(i);
                    }
                    sub = await reg.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: outputArray
                    });
                  }
                }
                const phone = localStorage.getItem("mehta_user_phone");
                if (sub && phone) {
                  await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subscription: sub, location: null, phone })
                  });
                }
              } catch (e) {
                console.error("Push registration failed", e);
              }
            }
          });
        }
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 30);

      if (currentScrollY > 150) {
        if (currentScrollY > lastScrollY) {
          setVisible(false); // scrolling down
        } else {
          setVisible(true); // scrolling up
        }
      } else {
        setVisible(true);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cart & Auth state synced from localStorage
  const [cart, setCart] = useState<any[]>([]);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Aarya Mehta");
  const [wishlistCount, setWishlistCount] = useState(0);



  // Sync state on load and periodic storage check
  useEffect(() => {
    const syncState = () => {
      if (typeof window === 'undefined') return;

      // Sync Cart
      const storedCart = localStorage.getItem("mehta_cart");
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      } else {
        setCart([]);
      }

      // Sync Auth from CustomerAuthContext
      setUserLoggedIn(isAuthContextLoggedIn);
      if (isAuthContextLoggedIn) {
        const name = contextProfile?.name || localStorage.getItem("mehta_user_name");
        setUserName(name || "Customer");
      }

      // Sync Wishlist
      const storedWishlist = localStorage.getItem("mehta_wishlist");
      if (storedWishlist) {
        setWishlistCount(JSON.parse(storedWishlist).length);
      } else {
        setWishlistCount(0);
      }
    };

    const loadData = async () => {
      const cats = await fetchCategories();
      setCategories(cats);
    };
    loadData();

    syncState();

    const handleOpenCart = () => setCartOpen(true);
    const handleOpenSearch = () => {
      setSearchOpen(true);
      setTimeout(() => {
        const input = document.getElementById("header-search-input");
        if (input) input.focus();
      }, 100);
    };

    // Listen for storage events or dispatch events
    window.addEventListener("storage", syncState);
    window.addEventListener("cartUpdated", syncState);
    window.addEventListener("wishlistUpdated", syncState);
    window.addEventListener("authUpdated", syncState);
    window.addEventListener("openCartDrawer", handleOpenCart);
    window.addEventListener("openHeaderSearch", handleOpenSearch);

    return () => {
      window.removeEventListener("storage", syncState);
      window.removeEventListener("cartUpdated", syncState);
      window.removeEventListener("wishlistUpdated", syncState);
      window.removeEventListener("authUpdated", syncState);
      window.removeEventListener("openCartDrawer", handleOpenCart);
      window.removeEventListener("openHeaderSearch", handleOpenSearch);
    };
  }, []);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const totalPayable = Math.max(0, cartSubtotal);

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

  // Search logic
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  // Auth Logout
  const handleLogout = async () => {
    await authLogout();
    setUserLoggedIn(false);
    window.dispatchEvent(new Event("authUpdated"));
    router.push("/");
  };

  const isHomepage = pathname === "/";
  
  // Keep the header fixed at the top with solid cream/white background
  const headerClass = "fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full bg-white shadow-xs border-b border-[#EAE0D3] flex flex-col";

  return (
    <>
      <header className={headerClass}>
        {/* --- MAIN HEADER CONTENT --- */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-3.5 flex items-center justify-between relative">

          {/* Logo */}
          <Link href="/" className="shrink-0 z-10 flex items-center transition-transform hover:scale-103">
            <img 
              src="/logo.png" 
              alt="Mehta Dairy" 
              className="w-auto h-11 sm:h-12 object-contain drop-shadow-xs" 
            />
          </Link>

          {/* Desktop Capsule Navigation Bar */}
          <div className="hidden lg:flex items-center bg-white/95 backdrop-blur-md border border-[#EAE0D3] rounded-full shadow-sm py-2 px-6 gap-6 relative z-10">
            {/* Home Link */}
            <div className="relative py-1">
              <Link
                href="/"
                className={`text-[10px] font-extrabold uppercase tracking-wider transition-colors hover:text-[#D46D2D] font-sans ${pathname === "/" ? "text-[#D46D2D]" : "text-[#2A1E17]"}`}
              >
                {t("header.home")}
              </Link>
            </div>

            {/* About us Link */}
            <div className="relative py-1">
              <Link
                href="/about"
                className={`text-[10px] font-extrabold uppercase tracking-wider transition-colors hover:text-[#D46D2D] font-sans ${pathname === "/about" ? "text-[#D46D2D]" : "text-[#2A1E17]"}`}
              >
                {t("header.about")}
              </Link>
            </div>

            {/* Shop dropdown link */}
            <div
              className="relative py-1"
              onMouseEnter={() => setIsProductsHovered(true)}
              onMouseLeave={() => setIsProductsHovered(false)}
            >
              <button 
                onClick={() => router.push("/shop")}
                className={`flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider transition-colors hover:text-[#D46D2D] font-sans cursor-pointer ${pathname.startsWith("/shop") ? "text-[#D46D2D]" : "text-[#2A1E17]"}`}
              >
                Shop Categories <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
              <AnimatePresence>
                {isProductsHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute left-0 top-full w-52 rounded-xl border border-[#EAE0D3] bg-white p-2 shadow-xl z-50 mt-1"
                  >
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/shop?category=${cat.slug}`}
                        className="block rounded-lg px-3 py-2 text-[10px] font-bold text-[#2A1E17] hover:bg-brand-cream hover:text-[#D46D2D] uppercase tracking-wider transition-colors"
                      >
                        {t(`cat.${cat.slug}`)}
                      </Link>
                    ))}
                    <div className="h-px bg-brand-beige my-1"></div>
                    <Link
                      href="/shop"
                      className="block rounded-lg px-3 py-2 text-[10px] font-bold text-[#D46D2D] hover:bg-brand-cream uppercase tracking-wider transition-colors"
                    >
                      All Products
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Blogs Link */}
            <div className="relative py-1">
              <Link
                href="/blogs"
                className={`text-[10px] font-extrabold uppercase tracking-wider transition-colors hover:text-[#D46D2D] font-sans ${pathname === "/blogs" ? "text-[#D46D2D]" : "text-[#2A1E17]"}`}
              >
                Blogs
              </Link>
            </div>

            {/* Contact Us Link */}
            <div className="relative py-1">
              <Link
                href="/contact"
                className={`text-[10px] font-extrabold uppercase tracking-wider transition-colors hover:text-[#D46D2D] font-sans ${pathname === "/contact" ? "text-[#D46D2D]" : "text-[#2A1E17]"}`}
              >
                {t("header.contact")}
              </Link>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-[#EAE0D3]/80" />

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-1 text-[#2A1E17] hover:text-[#D46D2D] transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="h-4 w-4 stroke-[2.5]" />
            </button>

            {/* Cart Icon with badge */}
            <button
              onClick={() => setCartOpen(true)}
              className="p-1 text-[#2A1E17] hover:text-[#D46D2D] transition-colors relative cursor-pointer"
              aria-label="Cart"
            >
              <ShoppingBasket className="h-4 w-4 stroke-[2.5]" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#D46D2D] text-white text-[8px] font-bold shadow-xs">
                  {totalCartItems}
                </span>
              )}
            </button>

            {/* Profile / Account */}
            {userLoggedIn ? (
              <div className="relative group">
                <button className="p-1 text-[#2A1E17] hover:text-[#D46D2D] transition-colors cursor-pointer">
                  <User className="h-4 w-4 stroke-[2.5]" />
                </button>
                <div className="absolute right-0 top-full hidden group-hover:block w-44 rounded-xl border border-[#EAE0D3] bg-white p-2 shadow-xl z-50 mt-1 before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3">
                  <Link href="/account" className="flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-bold text-[#2A1E17] hover:bg-brand-cream hover:text-[#D46D2D] uppercase tracking-wider transition-colors">
                    My Account
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-bold text-red-600 hover:bg-red-50 uppercase tracking-wider transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/account" className="p-1 text-[#2A1E17] hover:text-[#D46D2D] transition-colors" aria-label="Login">
                <User className="h-4 w-4 stroke-[2.5]" />
              </Link>
            )}

            {/* Language Switcher */}
            <LanguageDropdown />
          </div>

          {/* Mobile Actions and Hamburger Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Language Switcher for Mobile */}
            <LanguageDropdown
              buttonClassName="flex items-center gap-1 p-2 text-brand-charcoal hover:text-[#D46D2D] transition-colors rounded-full border border-[#EAE0D3] bg-white cursor-pointer active:scale-95 shadow-xs"
              iconClassName="h-4 w-4 stroke-[2]"
              labelClassName="text-[9px] font-extrabold uppercase"
            />

            {/* Account for Mobile */}
            <Link 
              href="/account" 
              className="p-2 text-brand-charcoal hover:text-[#D46D2D] transition-colors bg-white border border-[#EAE0D3] rounded-full shadow-xs flex items-center justify-center active:scale-95" 
              aria-label="Account"
            >
              <User className="h-4 w-4 stroke-[2]" />
            </Link>

            {/* Menu toggle for Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-brand-charcoal hover:text-[#D46D2D] transition-colors bg-white border border-[#EAE0D3] rounded-full shadow-xs flex items-center justify-center active:scale-95"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[45] lg:hidden flex flex-col items-center pt-[90px] px-6"
          >
            {/* Backdrop */}
            <div
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-sm"
            />

            {/* Floating Modal Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut", delay: 0.05 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl flex flex-col overflow-hidden max-h-[calc(100vh-110px)]"
            >
              {/* Scrollable nav body */}
              <nav className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`font-serif text-[0.85rem] font-bold uppercase tracking-wider ${pathname === '/' ? 'text-[#D46D2D]' : 'text-[#4A2F1F]'}`}
                >
                  HOME
                </Link>
                <Link
                  href="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`font-serif text-[0.85rem] font-bold uppercase tracking-wider ${pathname === '/about' ? 'text-[#D46D2D]' : 'text-[#4A2F1F]'}`}
                >
                  ABOUT US
                </Link>

                <div className="flex flex-col gap-4">
                  <span className="font-serif text-[0.85rem] font-bold uppercase tracking-wider text-[#4A2F1F]">
                    SHOP CATEGORIES
                  </span>
                  <div className="flex flex-col gap-3 pl-4 border-l-2 border-[#EAE0D3]/60 ml-1">
                    {categories.map((cat: any) => (
                      <Link
                        key={cat.id}
                        href={`/shop?category=${cat.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="font-serif text-[0.8rem] font-bold text-[#2A1E17] hover:text-[#D46D2D] transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                    <Link
                      href="/shop"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="font-serif text-[0.8rem] font-bold text-[#2A1E17] hover:text-[#D46D2D] transition-colors"
                    >
                      All Sweets & Farsan
                    </Link>
                  </div>
                </div>

                <Link
                  href="/blogs"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`font-serif text-[0.85rem] font-bold uppercase tracking-wider ${pathname === '/blogs' ? 'text-[#D46D2D]' : 'text-[#4A2F1F]'}`}
                >
                  BLOGS
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`font-serif text-[0.85rem] font-bold uppercase tracking-wider ${pathname === '/contact' ? 'text-[#D46D2D]' : 'text-[#4A2F1F]'}`}
                >
                  CONTACT US
                </Link>

                <div className="h-px w-full bg-[#EAE0D3] my-2"></div>

                {userLoggedIn ? (
                  <div className="flex flex-col gap-6">
                    <Link
                      href="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="font-serif text-[0.85rem] font-bold uppercase tracking-wider text-[#4A2F1F]"
                    >
                      MY ACCOUNT
                    </Link>
                    <button
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      className="font-serif text-[0.85rem] font-bold uppercase tracking-wider text-[#4A2F1F] text-left"
                    >
                      LOGOUT
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-serif text-[0.85rem] font-bold uppercase tracking-wider text-[#4A2F1F]"
                  >
                    LOGIN / REGISTER
                  </Link>
                )}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- COLLAPSIBLE FULL-WIDTH SEARCH OVERLAY --- */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-charcoal/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-full max-w-2xl rounded-xl shadow-xl border border-brand-beige overflow-hidden"
            >
              <form onSubmit={handleSearchSubmit} className="flex items-center p-4 gap-3 border-b border-brand-beige">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  id="header-search-input"
                  type="text"
                  placeholder={t("header.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-grow border-none outline-none font-sans text-brand-charcoal text-base"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="p-1 rounded-full hover:bg-brand-cream text-muted-foreground hover:text-brand-charcoal"
                >
                  <X className="h-5 w-5" />
                </button>
              </form>

              {/* Quick Results Panel */}
              <div className="p-5 flex flex-col gap-4 bg-[#FCF9F2]/30">
                <div className="flex items-center justify-between">
                  <span className="text-[0.7rem] font-bold text-brand-gold uppercase tracking-wider">
                    Quick Results
                  </span>
                </div>

                {searchQuery.trim().length === 0 ? (
                  <div className="py-4">
                    <h4 className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-widest mb-3">Popular Searches</h4>
                    <div className="flex flex-wrap gap-2">
                      {["Kesar Penda", "Kaju Katri", "Dry Fruit Kachori", "White Kalakand", "Bhavnagari Ganthia", "Namkeen"].map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => setSearchQuery(term)}
                          className="px-3 py-1.5 rounded-full border border-brand-beige text-xs font-bold text-brand-charcoal hover:border-brand-orange hover:text-brand-orange hover:bg-[#FAF6EE] transition-all cursor-pointer"
                        >
                          <Search className="w-3 h-3 inline-block mr-1.5 opacity-50" />
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (() => {
                  const q = searchQuery.toLowerCase().trim();
                  const filtered = allProducts.filter(prod => {
                    const name = prod.name.toLowerCase();
                    const desc = prod.description.toLowerCase();
                    const category = prod.category.toLowerCase();
                    
                    // Direct matches
                    if (name.includes(q) || desc.includes(q) || category.includes(q)) {
                      return true;
                    }
                    
                    // Smart keyword maps
                    if (q === 'namkeen') {
                      return category === 'farsan';
                    }
                    if (q === 'sweets' || q === 'sweet') {
                      return category.includes('sweet');
                    }
                    if (q === 'khakhra') {
                      return category === 'khakhra';
                    }
                    if (q === 'chikki') {
                      return category === 'chikki';
                    }
                    if (q === 'gulkand') {
                      return category === 'gulkand';
                    }
                    
                    return false;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-8 text-center text-xs font-bold text-muted-foreground/60 tracking-wider">
                        NO PRODUCTS FOUND
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
                      {filtered.slice(0, 5).map((prod) => {
                        const firstPrice = Object.values(prod.prices)[0];
                        const firstWeight = Object.keys(prod.prices)[0];
                        const labelWeight = firstWeight === "1kg" ? "1 KG" : firstWeight === "500g" ? "500 GM" : "250 GM";

                        return (
                          <Link
                            key={prod.id}
                            href={`/product/${prod.id}`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-brand-cream border border-transparent hover:border-brand-beige/50 transition-all group"
                          >
                            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-brand-cream border border-brand-beige flex-shrink-0 flex items-center justify-center p-1">
                              <img
                                src={prod.images[0]}
                                alt={prod.name}
                                className="w-full h-full object-contain rounded-full"
                              />
                            </div>
                            <div className="flex-grow">
                              <h4 className="font-serif text-sm font-bold text-brand-charcoal group-hover:text-brand-orange transition-colors line-clamp-1">
                                {prod.name}
                              </h4>
                              <span className="text-[0.62rem] text-brand-gold uppercase tracking-wider font-bold">
                                {prod.category.includes("milk") ? "Pure Milk Sweet" : prod.category.includes("ghee") ? "Pure Ghee Sweet" : prod.category.replace(/-/g, " ")}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-sans text-xs font-bold text-brand-charcoal block">
                                ₹{firstPrice.toFixed(2)}
                              </span>
                              <span className="text-[0.6rem] text-muted-foreground font-semibold">
                                {labelWeight}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* View All Results Button */}
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="w-full py-3 bg-[#0a4d8c] hover:bg-[#073866] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer text-center mt-1"
                >
                  View All Results
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SLIDING CART DRAWER --- */}
      <AnimatePresence>
        {cartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            ></motion.div>

            {/* Drawer Body */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-brand-beige px-6 py-5">
                <h3 className="font-serif text-lg font-bold text-brand-charcoal flex items-center gap-2">
                  <ShoppingBasket className="h-5 w-5 text-brand-orange" /> Shopping Cart
                </h3>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-2 hover:bg-brand-cream rounded-full transition-colors text-muted-foreground hover:text-brand-charcoal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-80 text-center">
                    <ShoppingBasket className="h-16 w-16 text-brand-beige mb-4" />
                    <p className="font-medium text-brand-charcoal">Your shopping cart is empty.</p>
                    <Link
                      href="/shop"
                      onClick={() => setCartOpen(false)}
                      className="mt-4 inline-flex items-center justify-center rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-hover"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={`${item.productId}-${item.weight}-${idx}`} className="flex items-start gap-4 border-b border-brand-beige pb-4">
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="h-16 w-16 rounded-lg object-cover bg-brand-cream border border-brand-beige flex-shrink-0"
                      />
                      <div className="flex-grow">
                        <h4 className="font-serif text-[0.95rem] font-bold text-brand-charcoal">
                          {item.productName}
                        </h4>
                        <div className="text-[0.78rem] text-brand-gold font-bold uppercase tracking-wider mb-2">
                          {item.weight} • ₹{item.price} each
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center border border-brand-beige rounded-md overflow-hidden bg-brand-cream h-7">
                            <button
                              onClick={() => updateQuantity(item.productId, item.weight, -1)}
                              className="p-1 px-2 hover:bg-brand-beige text-brand-charcoal transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 text-xs font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.weight, 1)}
                              className="p-1 px-2 hover:bg-brand-beige text-brand-charcoal transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.productId, item.weight)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="font-sans font-bold text-sm text-brand-charcoal text-right">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer Summary */}
              {cart.length > 0 && (
                <div className="border-t border-brand-beige bg-brand-cream p-6">
                  <div className="flex flex-col gap-3 mb-6">
                    {/* Subtotal */}
                    <div className="flex justify-between text-sm text-brand-charcoal">
                      <span>Subtotal</span>
                      <span className="font-semibold">₹{cartSubtotal}</span>
                    </div>

                    <div className="h-px bg-brand-beige my-1"></div>

                    {/* Total payable */}
                    <div className="flex justify-between text-base font-bold text-brand-charcoal">
                      <span>Total Order Value</span>
                      <span className="font-sans tabular-nums text-lg text-brand-orange font-bold">₹{totalPayable}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link
                      href="/checkout"
                      onClick={() => setCartOpen(false)}
                      className="w-full inline-flex items-center justify-center rounded-lg bg-brand-orange py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-hover shadow-md"
                    >
                      Proceed to Checkout
                    </Link>
                    <Link
                      href="/cart"
                      onClick={() => setCartOpen(false)}
                      className="w-full inline-flex items-center justify-center rounded-lg border border-brand-gold text-brand-charcoal py-2 text-xs font-semibold hover:bg-white transition-colors"
                    >
                      View Shopping Cart Details
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
