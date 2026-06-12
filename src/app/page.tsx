"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getProducts, Product } from "@/lib/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Award, 
  Globe, 
  HeartHandshake, 
  ChevronRight, 
  ChevronLeft,
  Star, 
  ArrowRight,
  Gift
} from "lucide-react";

const getCategoryIcon = (id: string) => {
  switch (id) {
    case "dryfruit":
      return (
        <svg className="w-5 h-5 text-brand-charcoal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="2.5" />
          <circle cx="9.5" cy="13" r="2.5" />
          <circle cx="14.5" cy="13" r="2.5" />
          <path d="M6 17h12" />
        </svg>
      );
    case "traditional":
      return (
        <svg className="w-5 h-5 text-brand-charcoal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
    case "namkeen":
      return (
        <svg className="w-5 h-5 text-brand-charcoal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 10a9 9 0 0018 0H3z" />
          <circle cx="8" cy="7" r="1" />
          <circle cx="12" cy="6" r="1" />
          <circle cx="16" cy="7" r="1" />
        </svg>
      );
    case "farsan":
      return (
        <svg className="w-5 h-5 text-brand-charcoal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 3h10v14a4 4 0 01-4 4h-2a4 4 0 01-4-4V3z" />
          <path d="M11 3l4-2" />
        </svg>
      );
    case "gifts":
      return (
        <svg className="w-5 h-5 text-brand-charcoal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="6" y="9" width="12" height="6" rx="2" />
          <path d="M6 12L2 9v6zM18 12l4-3v6z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5 text-brand-charcoal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [festivalSpecials, setFestivalSpecials] = useState<Product[]>([]);
  
  // Hero Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Category Accordion State
  const [activeCategory, setActiveCategory] = useState(1); // Default to Sweets (Index 1)

  useEffect(() => {
    const allProducts = getProducts();
    setProducts(allProducts);
    // Featured are items flagged popular
    setFeaturedProducts(allProducts.filter(p => p.popular).slice(0, 4));
    // Festival specials
    setFestivalSpecials(allProducts.filter(p => p.festivalSpecial).slice(0, 4));
  }, []);

  // Auto-play slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev === 0 ? 1 : 0));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Slider Slides Data
  const slides = [
    {
      id: "slide-0",
      title: "Dryfruit",
      boldTitle: "Kachori",
      description: "Our signature dryfruit kachori stuffed with rich premium almonds, cashews, pistachios, and aromatic spices, fried to a golden crisp in pure cow ghee. A heritage recipe since 1952.",
      image: "/hero_kachori_bowl_1781172813990.png",
      link: "/shop?search=kachori",
      buttonText: "Shop Kachori Special"
    },
    {
      id: "slide-1",
      title: "Premium",
      boldTitle: "Kaju Katli",
      description: "Experience the ultimate melt-in-your-mouth cashew fudge diamond shapes, prepared using premium cashews and pure sugar, garnished with traditional silver leaf.",
      image: "/prod_kaju_katli_1781172877393.png",
      link: "/product/t1",
      buttonText: "Order Kaju Katli"
    }
  ];

  // Category Accordion Data
  const categoryAccordions = [
    { id: "dryfruit", name: "Dryfruit Kachori", image: "/dry_fruit_kachori_1781172416985.png", link: "/shop?category=dryfruit" },
    { id: "traditional", name: "Sweets", image: "/assorted_sweets_1781172431124.png", link: "/shop?category=traditional" },
    { id: "namkeen", name: "Namkeen", image: "/namkeen_ganthia_1781172443622.png", link: "/shop?category=namkeen" },
    { id: "farsan", name: "Milkshake Mix", image: "/milkshake_mix_1781172899700.png", link: "/shop?category=farsan" },
    { id: "gifts", name: "Mix Sweet Rolls", image: "/mix_sweet_rolls_1781172915749.png", link: "/shop?category=gifts" }
  ];

  // Best Sellers Grid IDs
  const bestSellerIds = ["t2", "t6", "f5", "n1", "n2", "t1"];
  const bestSellers = bestSellerIds.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
  const displayedBestSellers = bestSellers.length === 6 ? bestSellers : products.slice(0, 6);

  // Simple testimonial list
  const testimonials = [
    { name: "Vikas Patel", role: "Delhi", rating: 5, comment: "Mehta Sweet Mart has been sending kaju rolls to our family in Delhi for years. The vacuum packaging keeps it completely fresh!" },
    { name: "Priyal Shah", role: "Mumbai", rating: 5, comment: "The purity of cow ghee in their laddoos is unbeatable. No artificial coloring, genuine traditional sweets!" },
    { name: "Ramesh Mehta", role: "Ahmedabad", rating: 5, comment: "Extremely helpful customer service. We customized 200 corporate boxes for Rakhi, and they arrived perfectly ahead of schedule." }
  ];

  return (
    <>
      <Header />
      <WhatsAppFloat />

      {/* --- HERO BANNER SLIDER --- */}
      <section className="relative overflow-hidden bg-[#cc1616] min-h-[520px] sm:min-h-[580px] lg:min-h-[660px] flex items-center pt-28 sm:pt-32 pb-16 transition-all duration-500">
        
        {/* SVG Checkers Pattern Top-Right (Rotated 45deg) */}
        <div className="absolute top-0 right-0 h-64 w-64 sm:h-96 sm:w-96 rotate-45 translate-x-20 -translate-y-20 text-white/10 opacity-70 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="currentColor">
            <pattern id="checkers-white" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill="currentColor" />
              <rect x="10" y="10" width="10" height="10" fill="currentColor" />
            </pattern>
            <rect width="100" height="100" fill="url(#checkers-white)" />
          </svg>
        </div>

        {/* SVG Checkers Pattern Bottom-Left (Rotated 45deg, Blue color) */}
        <div className="absolute bottom-0 left-0 h-64 w-64 sm:h-96 sm:w-96 rotate-45 -translate-x-20 translate-y-20 text-[#05294c]/15 opacity-70 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="currentColor">
            <pattern id="checkers-blue" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill="currentColor" />
              <rect x="10" y="10" width="10" height="10" fill="currentColor" />
            </pattern>
            <rect width="100" height="100" fill="url(#checkers-blue)" />
          </svg>
        </div>

        {/* Half-Tone Dots Pattern Left */}
        <div className="absolute left-4 top-1/4 h-32 w-32 text-white/5 opacity-50 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="currentColor">
            <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="5" r="2.2" fill="currentColor" />
            </pattern>
            <rect width="100" height="100" fill="url(#dots)" />
          </svg>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Column: Bold Text */}
              <div className="lg:col-span-6 flex flex-col gap-5 text-left select-none">
                <motion.h2 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="text-white leading-none"
                >
                  <span className="block font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light italic tracking-wide">
                    {slides[currentSlide].title}
                  </span>
                  <span className="block font-serif text-6xl sm:text-8xl md:text-9xl font-black tracking-tight mt-1 sm:mt-3">
                    {slides[currentSlide].boldTitle}
                  </span>
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.5 }}
                  className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-lg mt-2"
                >
                  {slides[currentSlide].description}
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  className="mt-4"
                >
                  <Link
                    href={slides[currentSlide].link}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-xs font-bold text-[#cc1616] shadow-md hover:bg-brand-cream transition-all hover:-translate-y-0.5 hover:shadow-lg hover:scale-103"
                  >
                    {slides[currentSlide].buttonText} &rarr;
                  </Link>
                </motion.div>
              </div>

              {/* Right Column: Circular Platter with slow rotation and zoom */}
              <div className="lg:col-span-6 flex justify-center lg:justify-end">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 15 }}
                  className="relative w-64 h-64 sm:w-96 sm:h-96 md:w-[460px] md:h-[460px] flex items-center justify-center"
                >
                  <motion.img
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                    src={slides[currentSlide].image}
                    alt={slides[currentSlide].title}
                    className="w-full h-full object-contain filter drop-shadow-2xl select-none"
                  />
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Left/Right Green Circle Nav Indicators */}
        <button 
          onClick={() => setCurrentSlide(prev => (prev === 0 ? 1 : 0))}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded bg-[#1abc9c]/80 hover:bg-[#16a085] text-white flex items-center justify-center cursor-pointer transition-colors z-20 shadow-md"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button 
          onClick={() => setCurrentSlide(prev => (prev === 0 ? 1 : 0))}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded bg-[#1abc9c]/80 hover:bg-[#16a085] text-white flex items-center justify-center cursor-pointer transition-colors z-20 shadow-md"
          aria-label="Next Slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

      </section>

      {/* --- NAMASTE EVERYONE INTRO BANNER --- */}
      <motion.section 
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-20 bg-white border-b border-brand-beige"
      >
        <div className="mx-auto max-w-3xl px-4 text-center flex flex-col gap-5">
          <h2 className="font-serif text-3xl sm:text-4xl font-black text-brand-charcoal uppercase tracking-wider">
            NAMASTE EVERYONE
          </h2>
          <div className="h-0.5 w-16 bg-brand-gold mx-auto"></div>
          
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-2">
            Picture yourself savoring the most exquisite sweets, no matter where your adventures take you. From bustling cities to quiet countryside retreats, whether you're in Tokyo, Sydney, Rio de Janeiro, Cape Town, or Toronto, you can now relish the premium sweets from the 'City of Sweets', Ahmedabad, Gujarat, India. It sounds too good to be true, doesn't it?
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Since 1952, Mehta Sweet Mart has been synonymous with exceptional quality in sweet manufacturing. Our commitment to our customers' health and satisfaction ensures that every product meets the highest standards of purity and taste. If you ever have concerns about your order's taste, quality, or quantity, we back our products with a money-back guarantee.
          </p>
        </div>
      </motion.section>

      {/* --- BROWSE BY CATEGORY INTERACTIVE ACCORDION --- */}
      <motion.section 
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-20 bg-brand-cream/35 border-b border-brand-beige"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="font-serif text-2xl sm:text-3xl font-black text-brand-charcoal uppercase tracking-wider">
              Browse by Category
            </h2>
            <div className="h-0.5 w-16 bg-brand-gold mx-auto mt-2.5"></div>
          </div>

          {/* Desktop Accordion Layout (visible on tablet and desktop) */}
          <div className="hidden md:flex flex-col md:flex-row justify-center gap-4 max-w-5xl mx-auto items-center">
            {categoryAccordions.map((cat, idx) => {
              const isActive = activeCategory === idx;
              return (
                <div 
                  key={cat.id}
                  onMouseEnter={() => setActiveCategory(idx)}
                  className={`relative overflow-hidden transition-all duration-500 ease-in-out cursor-pointer shadow-md ${
                    isActive 
                      ? "w-full md:w-80 h-96 rounded-3xl" 
                      : "w-14 sm:w-16 md:w-[76px] h-96 rounded-full border border-brand-beige bg-white hover:bg-brand-cream/60"
                  }`}
                >
                  {isActive ? (
                    /* Active Accordion Card Layout */
                    <Link href={cat.link} className="block w-full h-full relative group">
                      <img 
                        src={cat.image} 
                        alt={cat.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                      
                      {/* Name & Circle Icon */}
                      <div className="absolute bottom-5 left-5 right-5 flex justify-between items-center text-white">
                        <div>
                          <span className="text-[0.62rem] font-bold text-brand-gold uppercase tracking-widest block mb-1">Explore category</span>
                          <h4 className="font-serif text-lg font-black uppercase tracking-wide leading-none">{cat.name}</h4>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-orange shadow-md">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      </div>
                    </Link>
                  ) : (
                    /* Inactive Vertical Pill Layout */
                    <div 
                      onClick={() => setActiveCategory(idx)}
                      className="w-full h-full flex flex-col justify-between py-6 items-center select-none group"
                    >
                      {/* Top indicator dot */}
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-beige group-hover:bg-brand-orange transition-colors"></div>
                      
                      {/* Rotated Vertical Name */}
                      <span className="font-serif text-[0.7rem] sm:text-[0.75rem] font-black tracking-[0.2em] text-brand-charcoal uppercase [writing-mode:vertical-lr] rotate-180 transition-colors group-hover:text-brand-orange whitespace-nowrap">
                        {cat.name}
                      </span>
                      
                      {/* Bottom circular pill tag */}
                      <div className="w-8 h-8 rounded-full bg-brand-cream border border-brand-beige flex items-center justify-center text-brand-charcoal font-bold font-serif text-[0.68rem] shadow-xs group-hover:bg-brand-orange group-hover:text-white group-hover:border-brand-orange transition-all">
                        M
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Categories list (visible on mobile only, matching Image 1) */}
          <div className="flex flex-col gap-4.5 md:hidden max-w-md mx-auto w-full px-2">
            {categoryAccordions.map((cat) => {
              return (
                <Link 
                  key={cat.id} 
                  href={cat.link} 
                  className="relative overflow-hidden w-full h-20 rounded-full shadow-xs flex items-center justify-center group active:scale-[0.98] transition-transform"
                >
                  <img 
                    src={cat.image} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    alt={cat.name} 
                  />
                  <div className="absolute inset-0 bg-black/45"></div>
                  <div className="relative z-10 flex items-center gap-3 text-white">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 text-brand-charcoal shadow-sm">
                      {getCategoryIcon(cat.id)}
                    </div>
                    <span className="font-sans text-xs font-black tracking-widest uppercase">{cat.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* --- BEST SELLERS SPLIT LAYOUT --- */}
      <motion.section 
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-20 bg-white"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left/Top Column: Dark promotional banner (Mobile Banner on Top matching Image 2) */}
            <div className="lg:col-span-3">
              <div 
                className="w-full h-48 lg:h-full lg:min-h-[420px] rounded-3xl overflow-hidden relative shadow-md group flex flex-col items-center justify-center lg:justify-end lg:items-start p-6 border-4 border-brand-cream bg-cover bg-center select-none"
                style={{ backgroundImage: "url('/dry_fruit_kachori_1781172416985.png')" }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/80 lg:from-black lg:via-black/55 lg:to-transparent"></div>
                <div className="relative z-10 flex flex-col items-center lg:items-start gap-4 text-center lg:text-left">
                  <h4 className="font-serif text-3xl sm:text-4xl font-black text-white leading-tight">
                    Best<br className="hidden lg:block" /> Seller
                  </h4>
                  <Link 
                    href="/shop" 
                    className="inline-flex items-center justify-center rounded-full bg-white hover:bg-brand-orange text-brand-charcoal hover:text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider shadow-md transition-colors"
                  >
                    View All
                  </Link>
                </div>
              </div>
            </div>

            {/* Right/Bottom Column: Clean circular plate product grid (2 columns on mobile matching Image 2) */}
            <div className="lg:col-span-9">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 border-t border-l border-brand-beige/80 bg-white rounded-3xl overflow-hidden shadow-xs">
                {displayedBestSellers.map((product) => (
                  <Link 
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="border-r border-b border-brand-beige/80 p-4 sm:p-6 flex flex-col items-center justify-between text-center transition-all duration-300 hover:bg-brand-cream/15 group relative"
                  >
                    <div className="flex flex-col items-center w-full">
                      {/* Top-down circular sweet plate */}
                      <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-34 md:h-34 rounded-full overflow-hidden bg-[#fbf9f6] border border-brand-beige/50 p-1.5 sm:p-2 shadow-xs group-hover:scale-105 transition-transform duration-300 flex items-center justify-center mx-auto mb-3 sm:mb-4 select-none">
                        <img 
                          src={product.images[0]} 
                          alt={product.name} 
                          className="w-full h-full object-cover rounded-full transition-all duration-700 group-hover:animate-[spin_12s_linear_infinite]" 
                        />
                      </div>
                      
                      {/* Title */}
                      <h4 className="font-serif text-[0.7rem] sm:text-xs md:text-sm font-black text-brand-charcoal group-hover:text-brand-orange transition-colors line-clamp-2 min-h-[32px] px-0.5 mb-1 leading-tight uppercase tracking-wide">
                        {product.name}
                      </h4>
                      
                      {/* Price & Weight (Teal/Green style matching Image 2) */}
                      <div className="text-[0.62rem] sm:text-[0.68rem] md:text-[0.72rem] font-bold text-[#0a7a8c] uppercase tracking-wider select-none mb-1 sm:mb-3">
                        ₹{Object.values(product.prices)[0]}.00 - {Object.keys(product.prices)[0].toUpperCase()}
                      </div>
                    </div>

                    <span className="text-[0.58rem] sm:text-[0.62rem] font-bold text-brand-orange uppercase tracking-wider opacity-0 lg:group-hover:opacity-100 transition-opacity mt-1">
                      View Details &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            </div>

          </div>

        </div>
      </motion.section>

      {/* --- WHY CHOOSE US VALUES --- */}
      <motion.section 
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-20 bg-brand-cream/25 border-t border-brand-beige"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="font-serif text-2xl sm:text-3xl font-black text-brand-charcoal uppercase tracking-wider">
              Commitment to Quality & Purity
            </h2>
            <div className="h-0.5 w-16 bg-brand-gold mx-auto mt-2.5"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-brand-beige shadow-xs">
              <div className="h-12 w-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-4 border border-brand-gold/20">
                <Award className="h-6 w-6" />
              </div>
              <h4 className="font-serif text-base font-bold text-brand-charcoal mb-2">100% Pure Ghee</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every sweet is crafted using 100% pure cow ghee without adding any hydrogenated oils or coloring agents.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-brand-beige shadow-xs">
              <div className="h-12 w-12 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange mb-4 border border-brand-orange/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <h4 className="font-serif text-base font-bold text-brand-charcoal mb-2">Heritage Recipes</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Secret spice mixes and recipes preserved and handed down since 1952 for an unmatched nostalgia taste.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-brand-beige shadow-xs">
              <div className="h-12 w-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-4 border border-brand-gold/20">
                <Globe className="h-6 w-6" />
              </div>
              <h4 className="font-serif text-base font-bold text-brand-charcoal mb-2">Worldwide Air Delivery</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Vacuum sealed boxes shipped via express air freight to retain original freshness all the way to USA, UK, Canada.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-brand-beige shadow-xs">
              <div className="h-12 w-12 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange mb-4 border border-brand-orange/20">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h4 className="font-serif text-base font-bold text-brand-charcoal mb-2">Purity Guarantee</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No compromise on quality. If you ever have a concern with taste or weight, we back it with a money-back policy.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* --- FESTIVAL SPECIALS BANNER --- */}
      {festivalSpecials.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="py-20 bg-brand-charcoal text-[#F3EFE7] overflow-hidden relative border-y-4 border-brand-gold"
        >
          <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-brand-orange/10 blur-3xl"></div>
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Text details */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                <span className="inline-flex max-w-fit items-center gap-1.5 rounded-full bg-brand-gold/25 border border-brand-gold px-3.5 py-1 text-[0.68rem] font-bold text-brand-gold uppercase tracking-wider">
                  <Gift className="h-3.5 w-3.5" /> Festive Celebrations Special
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2 leading-tight">
                  Festival Special Sweet Platters & Modaks
                </h2>
                <p className="text-xs sm:text-sm text-[#C5B8B0] leading-relaxed">
                  Handcrafted specials made during traditional festive seasons. Enjoy limited-time specialties like Kesar Gujiya, traditional Ghevar, and dry fruit Modaks.
                </p>
                <div className="mt-4">
                  <Link
                    href="/shop?category=specials"
                    className="inline-flex items-center justify-center rounded-xl bg-brand-orange px-5 py-3 text-xs font-semibold text-white shadow-md transition-colors hover:bg-brand-orange-hover"
                  >
                    Shop Festival Specials <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Horizontal specials items scroll */}
              <div className="lg:col-span-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {festivalSpecials.slice(0, 2).map((product) => (
                    <div key={product.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 items-center">
                      <img src={product.images[0]} alt={product.name} className="h-16 w-16 object-cover rounded-lg bg-white/10 flex-shrink-0" />
                      <div>
                        <h4 className="font-serif text-sm font-bold text-white mb-1">{product.name}</h4>
                        <p className="text-[0.65rem] text-[#C5B8B0] line-clamp-1 mb-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-brand-gold font-serif font-bold text-sm">₹{Object.values(product.prices)[0]}</span>
                          <Link href={`/product/${product.id}`} className="text-[0.7rem] font-semibold text-brand-orange hover:underline">
                            View details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* --- CUSTOMER TESTIMONIALS --- */}
      <motion.section 
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-20 bg-white border-b border-brand-beige"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="font-serif text-2xl sm:text-3xl font-black text-brand-charcoal uppercase tracking-wider">
              Loved by Sweet Enthusiasts
            </h2>
            <div className="h-0.5 w-16 bg-brand-gold mx-auto mt-2.5"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-brand-cream/30 rounded-2xl p-6 border border-brand-beige flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic mb-6">
                    "{t.comment}"
                  </p>
                </div>
                <div className="flex items-center gap-3 border-t border-brand-beige/50 pt-4">
                  <div className="h-9 w-9 rounded-full bg-brand-gold text-white font-bold flex items-center justify-center text-sm uppercase">
                    {t.name[0]}
                  </div>
                  <div>
                    <h4 className="font-serif text-xs font-bold text-brand-charcoal leading-none mb-1">{t.name}</h4>
                    <span className="text-[0.62rem] text-muted-foreground">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* --- CALL TO ACTION --- */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="py-20 bg-brand-cream border-b border-brand-beige"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-6">
          <h2 className="font-serif text-3xl font-bold text-brand-charcoal tracking-tight">
            Send Festive Gifting Hampers To Loved Ones
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Want to arrange bulk custom platters, corporate sweet tokens, or overseas deliveries? Contact our corporate orders helpdesk for special pricing.
          </p>
          <div className="flex gap-4 mt-2">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-brand-orange px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-brand-orange-hover transition-colors"
            >
              Get Custom Quote
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-xl border border-brand-gold bg-white px-6 py-3.5 text-sm font-semibold text-brand-charcoal hover:bg-brand-cream transition-colors"
            >
              Shop Single Platters
            </Link>
          </div>
        </div>
      </motion.section>

      <Footer />
    </>
  );
}
