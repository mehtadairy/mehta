"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { fetchProducts } from "@/lib/supabaseClient";
import { Product } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Award,
  Globe,
  HeartHandshake,
  ChevronRight,
  ChevronLeft,
  Star,
  MapPin,
  Clock,
  Phone,
  ArrowRight,
  Gift,
  CheckCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  ShoppingBag,
  MessageSquare
} from "lucide-react";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  
  // Weights selectors per product
  const [selectedWeights, setSelectedWeights] = useState<{ [productId: string]: string }>({});

  // Hero Slider State
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    async function loadProducts() {
      const allProducts = await fetchProducts();
      setProducts(allProducts);
      
      // Best Sellers (Popular products)
      const popular = allProducts.filter(p => p.popular);
      setBestSellers(popular.length >= 8 ? popular.slice(0, 12) : allProducts.slice(0, 10));
      
      // Featured Products (Discovery grid)
      const featured = allProducts.filter(p => !p.popular);
      setFeaturedProducts(featured.length > 0 ? featured.slice(0, 6) : allProducts.slice(4, 10));

      // Set default weights
      const initialWeights: { [productId: string]: string } = {};
      allProducts.forEach(p => {
        const weights = Object.keys(p.prices);
        if (weights.length > 0) {
          initialWeights[p.id] = weights[0];
        }
      });
      setSelectedWeights(initialWeights);
    }
    loadProducts();
  }, []);

  // Auto-play slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev === 0 ? 1 : 0));
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Slider Slides Data (Premium Modern E-commerce)
  const slides = [
    {
      id: "slide-0",
      title: "Handcrafted Luxury",
      boldTitle: "Dryfruit Kachori",
      subtitle: "AUTHENTIC PALITANA HERITAGE SINCE 1972",
      description: "Our legendary crisp pastry stuffed with select almonds, cashews, pistachios, and saffron, slow-fried in 100% pure cow ghee. An unforgettable taste enjoyed for generations.",
      image: "/hero_kachori_bowl_1781172813990.png",
      link: "/shop?category=dryfruit",
      buttonText: "Shop Kachori Special"
    },
    {
      id: "slide-1",
      title: "Melt-In-Your-Mouth Fudge",
      boldTitle: "Premium Kaju Katli",
      subtitle: "100% PURE INGREDIENTS GUARANTEE",
      description: "Crafted using premium California cashews and clean sugar, finished with delicate traditional silver leaf. Pure, fresh, and exceptionally delicious.",
      image: "/prod_kaju_katli_1781172877393.png",
      link: "/product/t1",
      buttonText: "Order Kaju Katli"
    }
  ];

  // Category list (Sweets, Namkeen, Dry Kachori, Sharbat, Gulkand)
  const categories = [
    { id: "traditional", name: "Traditional Sweets", image: "/assorted_sweets_1781172431124.png", link: "/shop?category=traditional" },
    { id: "namkeen", name: "Premium Namkeen", image: "/namkeen_ganthia_1781172443622.png", link: "/shop?category=namkeen" },
    { id: "dryfruit", name: "Dry Kachori Special", image: "/dry_fruit_kachori_1781172416985.png", link: "/shop?category=dryfruit" },
    { id: "sharbat", name: "Gourmet Sharbat", image: "/milkshake_mix_1781172899700.png", link: "/shop?category=farsan" },
    { id: "gulkand", name: "Heritage Gulkand", image: "/mix_sweet_rolls_1781172915749.png", link: "/shop?category=gifts" }
  ];

  // Cart action
  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof window === "undefined") return;

    const weight = selectedWeights[product.id] || Object.keys(product.prices)[0];
    const price = product.prices[weight];
    const storedCart = localStorage.getItem("mehta_cart");
    const cart = storedCart ? JSON.parse(storedCart) : [];

    const existingIndex = cart.findIndex(
      (item: any) => item.productId === product.id && item.weight === weight
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        productId: product.id,
        productName: product.name,
        image: product.images[0],
        weight: weight,
        price: price,
        quantity: 1,
      });
    }

    localStorage.setItem("mehta_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));

    // Quick add feedback
    const btn = e.currentTarget as HTMLButtonElement;
    const originalText = btn.innerHTML;
    btn.innerHTML = `Added!`;
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }, 1000);
  };

  // WhatsApp Order action
  const handleWhatsAppOrder = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const weight = selectedWeights[product.id] || Object.keys(product.prices)[0];
    const price = product.prices[weight];
    const message = `Hello Mehta Dairy, I want to order "${product.name}" (${weight}) for ₹${price}. Please confirm availability.`;
    const waUrl = `https://wa.me/919898981952?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="bg-[#FAF6EE] min-h-screen text-[#2C2C2C] selection:bg-[#D97706]/20">
      <Header />
      <WhatsAppFloat />

      {/* --- 1. HERO SECTION (Warm Ivory, Deep Brown, & Gold Aesthetic) --- */}
      <section className="relative overflow-hidden bg-[#FAF6EE] min-h-[580px] lg:min-h-[700px] flex items-center pt-24 pb-12">
        <div className="absolute inset-0 bg-[radial-gradient(#C9A22712_1.5px,transparent_1.5px)] [background-size:32px_32px] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
            >
              {/* Left Side Details */}
              <div className="lg:col-span-6 flex flex-col gap-4 text-left select-none">
                <span className="inline-flex max-w-fit items-center gap-1.5 rounded-full bg-[#4A2F1F]/5 border border-[#4A2F1F]/15 px-3.5 py-1 text-[0.68rem] font-bold text-[#4A2F1F] uppercase tracking-widest">
                  <Sparkles className="h-3.5 w-3.5 text-[#C9A227]" /> Since 1972 Legacy
                </span>
                
                <h1 className="leading-tight">
                  <span className="block font-serif text-3xl sm:text-4xl md:text-5xl font-light italic tracking-wide text-[#C9A227]">
                    {slides[currentSlide].title}
                  </span>
                  <span className="block font-serif text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mt-1 text-[#4A2F1F]">
                    {slides[currentSlide].boldTitle}
                  </span>
                </h1>

                <p className="text-sm font-semibold text-[#D97706] uppercase tracking-[0.2em] mt-1">
                  {slides[currentSlide].subtitle}
                </p>

                <p className="text-xs sm:text-sm text-[#555] leading-relaxed max-w-lg mt-1">
                  {slides[currentSlide].description}
                </p>

                <div className="mt-6 flex flex-wrap gap-4">
                  <Link
                    href={slides[currentSlide].link}
                    className="inline-flex items-center justify-center rounded-xl bg-[#4A2F1F] text-white hover:bg-[#4A2F1F]/90 px-7 py-3.5 text-xs font-bold uppercase tracking-wider shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    Shop Now
                  </Link>
                  <Link
                    href="/shop"
                    className="inline-flex items-center justify-center rounded-xl border-2 border-[#4A2F1F] hover:bg-[#4A2F1F]/5 text-[#4A2F1F] px-7 py-3.2 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Explore Products
                  </Link>
                </div>
              </div>

              {/* Right Side Platter Image */}
              <div className="lg:col-span-6 flex justify-center lg:justify-end">
                <div className="relative w-64 h-64 sm:w-96 sm:h-96 md:w-[440px] md:h-[440px] flex items-center justify-center">
                  {/* Rotating Gold Accent Ring */}
                  <div className="absolute inset-0 rounded-full border border-[#C9A227]/20 animate-[spin_40s_linear_infinite]"></div>
                  
                  <motion.img
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                    src={slides[currentSlide].image}
                    alt={slides[currentSlide].boldTitle}
                    className="w-full h-full object-contain filter drop-shadow-xl select-none relative z-10"
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel buttons */}
        <button
          onClick={() => setCurrentSlide(prev => (prev === 0 ? 1 : 0))}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-[#4A2F1F]/15 bg-white/80 hover:bg-white text-[#4A2F1F] flex items-center justify-center cursor-pointer transition-all z-20 shadow-xs"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => setCurrentSlide(prev => (prev === 0 ? 1 : 0))}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-[#4A2F1F]/15 bg-white/80 hover:bg-white text-[#4A2F1F] flex items-center justify-center cursor-pointer transition-all z-20 shadow-xs"
          aria-label="Next Slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </section>

      {/* --- 2. TRUST STRIP (NEW) --- */}
      <section className="bg-white border-y border-[#4A2F1F]/10 py-5 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center divide-x divide-none md:divide-[#4A2F1F]/10">
            
            <div className="flex flex-col items-center justify-center gap-1.5 px-2 group">
              <Award className="h-5 w-5 text-[#D97706] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#4A2F1F]">50+ Years of Trust</span>
            </div>

            <div className="flex flex-col items-center justify-center gap-1.5 px-2 group">
              <Clock className="h-5 w-5 text-[#C9A227] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#4A2F1F]">Fresh Daily Production</span>
            </div>

            <div className="flex flex-col items-center justify-center gap-1.5 px-2 group">
              <Sparkles className="h-5 w-5 text-[#D97706] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#4A2F1F]">Premium Ingredients</span>
            </div>

            <div className="flex flex-col items-center justify-center gap-1.5 px-2 group">
              <ShieldCheck className="h-5 w-5 text-[#C9A227] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#4A2F1F]">Secure Payments</span>
            </div>

            <div className="flex flex-col items-center justify-center gap-1.5 px-2 group col-span-2 md:col-span-1">
              <Truck className="h-5 w-5 text-[#D97706] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#4A2F1F]">Pan India Delivery</span>
            </div>

          </div>
        </div>
      </section>

      {/* --- 3. SHOP BY CATEGORY --- */}
      <section className="py-20 bg-[#FAF6EE]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-[0.65rem] font-bold text-[#D97706] uppercase tracking-[0.2em]">Crafted Collections</span>
            <h2 className="font-serif text-3xl font-bold text-[#4A2F1F] mt-1">Shop By Category</h2>
            <div className="h-0.5 w-16 bg-[#C9A227] mx-auto mt-3"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={cat.link}
                className="group relative overflow-hidden rounded-2xl aspect-[4/5] bg-[#4A2F1F] shadow-md transition-all duration-500 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-end p-5"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Elegant Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#4A2F1F] via-[#4A2F1F]/20 to-transparent opacity-85"></div>
                
                <div className="relative z-10 flex flex-col gap-1">
                  <h4 className="font-serif text-lg font-bold text-white tracking-wide">
                    {cat.name}
                  </h4>
                  <span className="text-[0.62rem] font-bold text-[#C9A227] uppercase tracking-widest inline-flex items-center gap-1 group-hover:text-white transition-colors">
                    Explore <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --- 4. BEST SELLERS (Conversion-focused Grid) --- */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-[0.65rem] font-bold text-[#D97706] uppercase tracking-[0.2em]">Customer Favorites</span>
            <h2 className="font-serif text-3xl font-bold text-[#4A2F1F] mt-1">Our Best Sellers</h2>
            <div className="h-0.5 w-16 bg-[#C9A227] mx-auto mt-3"></div>
          </div>

          {/* Continuous infinite marquee container */}
          <div className="relative w-full overflow-hidden pb-6 pt-2">
            {/* Fade overlays for soft edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
            
            <div className="animate-marquee flex gap-6">
              {/* First loop of products */}
              {bestSellers.map((product) => {
                const weights = Object.keys(product.prices);
                const currentWeight = selectedWeights[product.id] || weights[0];
                const currentPrice = product.prices[currentWeight];

                return (
                  <article
                    key={`bestseller-1-${product.id}`}
                    className="group relative flex flex-col bg-white border border-[#4A2F1F]/10 rounded-2xl overflow-hidden shadow-xs hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 w-72 flex-shrink-0"
                  >
                    {/* Badge */}
                    {product.popular && (
                      <span className="absolute left-3 top-3 z-10 rounded-md bg-[#C9A227] px-2.5 py-1 text-[0.62rem] font-bold text-[#4A2F1F] uppercase tracking-wider">
                        Best Seller
                      </span>
                    )}

                    {/* Image Container */}
                    <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-[#FAF6EE] p-3">
                      <div className="w-full h-full relative flex items-center justify-center">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-contain rounded-full transition-transform duration-700 group-hover:scale-103"
                        />
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="p-5 flex flex-col flex-grow">
                      <span className="text-[0.62rem] font-bold text-[#C9A227] uppercase tracking-widest mb-1.5">
                        {product.category}
                      </span>

                      <Link href={`/product/${product.id}`}>
                        <h3 className="font-serif text-base font-bold text-[#4A2F1F] hover:text-[#D97706] transition-colors line-clamp-1 leading-snug">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed flex-grow">
                        {product.description}
                      </p>

                      {/* Weight selector */}
                      <div className="flex gap-1.5 my-4">
                        {weights.map((w) => (
                          <button
                            key={w}
                            onClick={() => setSelectedWeights(prev => ({ ...prev, [product.id]: w }))}
                            className={`rounded-lg border px-2.5 py-1 text-[0.68rem] font-bold transition-all ${
                              currentWeight === w
                                ? "border-[#D97706] bg-[#D97706]/10 text-[#D97706]"
                                : "border-[#4A2F1F]/15 hover:border-[#C9A227] text-[#4A2F1F]"
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between border-t border-[#4A2F1F]/10 pt-3.5 mt-auto">
                        <div className="flex flex-col">
                          <span className="text-[0.62rem] text-muted-foreground uppercase leading-none mb-0.5">Price</span>
                          <span className="font-serif text-lg font-bold text-[#4A2F1F]">
                            ₹{currentPrice}
                          </span>
                        </div>
                      </div>

                      {/* Quick E-commerce CTAs */}
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#4A2F1F] text-white hover:bg-[#4A2F1F]/90 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" /> Add
                        </button>
                        
                        <button
                          onClick={(e) => handleWhatsAppOrder(product, e)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-[#25D366]" /> WhatsApp
                        </button>
                      </div>

                    </div>
                  </article>
                );
              })}

              {/* Duplicate loop of products for seamless infinite scrolling */}
              {bestSellers.map((product) => {
                const weights = Object.keys(product.prices);
                const currentWeight = selectedWeights[product.id] || weights[0];
                const currentPrice = product.prices[currentWeight];

                return (
                  <article
                    key={`bestseller-2-${product.id}`}
                    className="group relative flex flex-col bg-white border border-[#4A2F1F]/10 rounded-2xl overflow-hidden shadow-xs hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 w-72 flex-shrink-0"
                  >
                    {/* Badge */}
                    {product.popular && (
                      <span className="absolute left-3 top-3 z-10 rounded-md bg-[#C9A227] px-2.5 py-1 text-[0.62rem] font-bold text-[#4A2F1F] uppercase tracking-wider">
                        Best Seller
                      </span>
                    )}

                    {/* Image Container */}
                    <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-[#FAF6EE] p-3">
                      <div className="w-full h-full relative flex items-center justify-center">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-contain rounded-full transition-transform duration-700 group-hover:scale-103"
                        />
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="p-5 flex flex-col flex-grow">
                      <span className="text-[0.62rem] font-bold text-[#C9A227] uppercase tracking-widest mb-1.5">
                        {product.category}
                      </span>

                      <Link href={`/product/${product.id}`}>
                        <h3 className="font-serif text-base font-bold text-[#4A2F1F] hover:text-[#D97706] transition-colors line-clamp-1 leading-snug">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed flex-grow">
                        {product.description}
                      </p>

                      {/* Weight selector */}
                      <div className="flex gap-1.5 my-4">
                        {weights.map((w) => (
                          <button
                            key={w}
                            onClick={() => setSelectedWeights(prev => ({ ...prev, [product.id]: w }))}
                            className={`rounded-lg border px-2.5 py-1 text-[0.68rem] font-bold transition-all ${
                              currentWeight === w
                                ? "border-[#D97706] bg-[#D97706]/10 text-[#D97706]"
                                : "border-[#4A2F1F]/15 hover:border-[#C9A227] text-[#4A2F1F]"
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between border-t border-[#4A2F1F]/10 pt-3.5 mt-auto">
                        <div className="flex flex-col">
                          <span className="text-[0.62rem] text-muted-foreground uppercase leading-none mb-0.5">Price</span>
                          <span className="font-serif text-lg font-bold text-[#4A2F1F]">
                            ₹{currentPrice}
                          </span>
                        </div>
                      </div>

                      {/* Quick E-commerce CTAs */}
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#4A2F1F] text-white hover:bg-[#4A2F1F]/90 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" /> Add
                        </button>
                        
                        <button
                          onClick={(e) => handleWhatsAppOrder(product, e)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-[#25D366]" /> WhatsApp
                        </button>
                      </div>

                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* --- 5. SINCE 1972 HERITAGE SECTION (Split Layout) --- */}
      <section className="py-24 bg-[#FAF6EE] border-t border-b border-[#4A2F1F]/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Images side-by-side representing growth */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl overflow-hidden aspect-square border border-[#4A2F1F]/10 bg-white p-2">
                  <img
                    src="https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&auto=format&fit=crop&q=80"
                    alt="Mehta Dairy Old Sweet Shop Crafting"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <span className="text-[0.62rem] font-bold text-center uppercase tracking-widest text-[#4A2F1F]">Palitana Origins</span>
              </div>
              <div className="flex flex-col gap-4 mt-6">
                <div className="rounded-2xl overflow-hidden aspect-square border border-[#4A2F1F]/10 bg-white p-2">
                  <img
                    src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop&q=80"
                    alt="Modern Mehta Dairy Showcase"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <span className="text-[0.62rem] font-bold text-center uppercase tracking-widest text-[#4A2F1F]">Modern Flagship</span>
              </div>
            </div>

            {/* Right: Concise Story */}
            <div className="lg:col-span-6 flex flex-col gap-5">
              <span className="text-[0.68rem] font-bold text-[#D97706] uppercase tracking-[0.25em]">Our Story</span>
              <h2 className="font-serif text-3xl font-bold text-[#4A2F1F] leading-tight">
                Established In 1972, Famous In Palitana & Navrangpura
              </h2>
              <div className="h-0.5 w-16 bg-[#C9A227]"></div>

              <p className="text-xs sm:text-sm text-[#555] leading-relaxed">
                Mehta Dairy and Sweet Mart started its journey back in 1972, serving sweet food lovers with handmade pedas and cow-fat sweets. Established first in the religious town of Palitana, the fame of our pure ingredients quickly grew, leading us to Navrangpura, Ahmedabad.
              </p>
              <p className="text-xs sm:text-sm text-[#555] leading-relaxed font-semibold text-[#4A2F1F]">
                Our core formula remains unchanged: 100% pure daily dairy collection, zero compromise on hygiene, and original flavors trusted by three generations of families.
              </p>

              <div className="mt-4">
                <Link
                  href="/about"
                  className="inline-flex items-center text-xs font-bold text-[#D97706] hover:text-[#D97706]/90 uppercase tracking-widest group"
                >
                  Our Detailed Journey <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- 6. WHY CHOOSE MEHTA DAIRY (Modern Grid) --- */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[0.65rem] font-bold text-[#D97706] uppercase tracking-[0.2em]">Why Shop With Us</span>
            <h2 className="font-serif text-3xl font-bold text-[#4A2F1F] mt-1">Uncompromising Standards</h2>
            <div className="h-0.5 w-16 bg-[#C9A227] mx-auto mt-3"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="flex gap-4 p-5 rounded-xl hover:bg-[#FAF6EE]/50 transition-colors">
              <CheckCircle className="h-6 w-6 text-[#D97706] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">Since 1972 Legacy</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Over 50 years of family-owned recipes passed down through master karigars.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-xl hover:bg-[#FAF6EE]/50 transition-colors">
              <CheckCircle className="h-6 w-6 text-[#C9A227] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">Trusted by Thousands</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Delivering joy and sweet memories to thousands of regular households in India & overseas.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-xl hover:bg-[#FAF6EE]/50 transition-colors">
              <CheckCircle className="h-6 w-6 text-[#D97706] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">Fresh Daily Production</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Every sweet is slow-churned and made in small batches daily to ensure freshness.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-xl hover:bg-[#FAF6EE]/50 transition-colors">
              <CheckCircle className="h-6 w-6 text-[#C9A227] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">Secure Online Payments</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Fully encrypted checkout integrated with Razorpay for worry-free card & UPI transactions.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-xl hover:bg-[#FAF6EE]/50 transition-colors">
              <CheckCircle className="h-6 w-6 text-[#D97706] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">Quality Ingredients</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Premium dryfruits, fresh direct cow milk, and authentic Kashmiri saffron only.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-xl hover:bg-[#FAF6EE]/50 transition-colors">
              <CheckCircle className="h-6 w-6 text-[#C9A227] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">Fast Delivery</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Express courier shipping with moisture-lock vacuum sealed packing.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- 7. FEATURED PRODUCTS (Secondary Grid) --- */}
      <section className="py-20 bg-[#FAF6EE]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <span className="text-[0.65rem] font-bold text-[#D97706] uppercase tracking-[0.2em]">Explore More</span>
              <h2 className="font-serif text-3xl font-bold text-[#4A2F1F] mt-1">Featured Specialties</h2>
              <div className="h-0.5 w-16 bg-[#C9A227] mt-3"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => {
              const weights = Object.keys(product.prices);
              const currentWeight = selectedWeights[product.id] || weights[0];
              const currentPrice = product.prices[currentWeight];

              return (
                <div
                  key={product.id}
                  className="bg-white border border-[#4A2F1F]/10 rounded-2xl p-5 flex gap-4.5 items-center hover:shadow-md transition-shadow relative group"
                >
                  <Link href={`/product/${product.id}`} className="h-20 w-20 bg-[#FAF6EE] rounded-lg overflow-hidden flex-shrink-0 relative p-1">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-contain rounded-full transition-transform group-hover:scale-105"
                    />
                  </Link>

                  <div className="flex-grow flex flex-col justify-between h-full">
                    <div>
                      <span className="text-[0.58rem] font-bold text-[#C9A227] uppercase tracking-widest mb-0.5 block">
                        {product.category}
                      </span>
                      <Link href={`/product/${product.id}`}>
                        <h4 className="font-serif text-sm font-bold text-[#4A2F1F] hover:text-[#D97706] transition-colors leading-tight line-clamp-1">
                          {product.name}
                        </h4>
                      </Link>
                      <p className="text-[0.7rem] text-muted-foreground line-clamp-1 mt-0.5 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-bold text-[#4A2F1F]">₹{currentPrice}</span>
                      
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        className="inline-flex items-center justify-center rounded-lg bg-[#4A2F1F] text-white hover:bg-[#4A2F1F]/90 px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Quick Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- 8. FOOTER --- */}
      <Footer />
    </div>
  );
}