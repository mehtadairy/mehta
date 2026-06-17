"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { fetchProducts, fetchCategories } from "@/lib/supabaseClient";
import { Product } from "@/lib/types";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
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

// Count-up counter component for trust strip
const AnimatedNumber = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      const duration = 1500; // 1.5 seconds
      const end = value;
      const startTime = performance.now();

      const updateCount = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const easeProgress = progress * (2 - progress); // Ease out quad
        const currentCount = Math.floor(easeProgress * end);
        setCount(currentCount);

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        } else {
          setCount(end);
        }
      };

      requestAnimationFrame(updateCount);
    }
  }, [isInView, value]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const getCategoryFallbackImage = (slug: string) => {
  if (slug === "milk-sweets") return "/mix_sweet_rolls_1781172915749.png";
  if (slug === "ghee-sweets") return "/prod_ghari_1781172844424.png";
  if (slug === "farsan") return "/dry_fruit_kachori_1781172416985.png";
  return "/assorted_sweets_1781172431124.png";
};

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Weights selectors per product
  const [selectedWeights, setSelectedWeights] = useState<{ [productId: string]: string }>({});

  // Hero Slider State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Mobile viewport detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Parallax effects (disabled on mobile)
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 600], [0, isMobile ? 0 : 80]);
  const yText = useTransform(scrollY, [0, 600], [0, isMobile ? 0 : -60]);
  const yImage = useTransform(scrollY, [0, 600], [0, isMobile ? 0 : -20]);

  useEffect(() => {
    async function loadProducts() {
      const allProducts = await fetchProducts();
      setProducts(allProducts);
      
      const cats = await fetchCategories();
      setCategories(cats);
      
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
    }, 8000); // 8 seconds for a more cinematic feel
    return () => clearInterval(timer);
  }, []);

  // Slider Slides Data (Premium Modern E-commerce)
  const slides = [
    {
      id: "slide-0",
      title: "Handcrafted Luxury",
      boldTitle: "Dryfruit Kachori",
      subtitle: "AUTHENTIC PALITANA HERITAGE SINCE 1972",
      descriptionLines: [
        "Our legendary crisp pastry stuffed with select almonds, cashews, pistachios,",
        "and saffron, slow-fried in 100% pure cow ghee.",
        "An unforgettable taste enjoyed for generations."
      ],
      image: "/hero_kachori_bowl_1781172813990.png",
      link: "/shop?category=dryfruit",
      buttonText: "Shop Kachori Special"
    },
    {
      id: "slide-1",
      title: "Melt-In-Your-Mouth Fudge",
      boldTitle: "Premium Kaju Katli",
      subtitle: "100% PURE INGREDIENTS GUARANTEE",
      descriptionLines: [
        "Crafted using premium California cashews and clean sugar,",
        "finished with delicate traditional silver leaf.",
        "Pure, fresh, and exceptionally delicious."
      ],
      image: "/prod_kaju_katli_1781172877393.png",
      link: "/product/t1",
      buttonText: "Order Kaju Katli"
    }
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

  // Buy Now action
  const handleBuyNow = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const weight = selectedWeights[product.id] || Object.keys(product.prices)[0];
    const price = product.prices[weight];
    
    if (typeof window === "undefined") return;

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
    router.push("/checkout");
  };

  return (
    <div className="bg-[#FAF6EE] min-h-screen text-[#2C2C2C] selection:bg-[#D97706]/20">
      <Header />
      <WhatsAppFloat />

      {/* --- 1. HERO SECTION (Warm Ivory, Deep Brown, & Gold Aesthetic) --- */}
      <section className="relative overflow-hidden bg-[#FAF6EE] min-h-[580px] lg:min-h-[700px] flex items-center pt-24 pb-12">
        {/* Background Image: smooth fade-in and scale-down (1.05 to 1.0) over 1.2s */}
        <motion.div
          key={`hero-bg-${currentSlide}`}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ y: yBg }}
          className="absolute inset-0 bg-[url('/hero_background_texture.png')] bg-cover bg-center pointer-events-none"
        />
        <div className="absolute inset-0 bg-[radial-gradient(#C9A22712_1.5px,transparent_1.5px)] [background-size:32px_32px] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
            >
              {/* Left Side Details */}
              <motion.div
                style={{ y: yText }}
                className="lg:col-span-6 flex flex-col gap-4 text-left select-none"
              >
                <motion.span
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-flex max-w-fit items-center gap-1.5 rounded-full bg-[#4A2F1F]/5 border border-[#4A2F1F]/15 px-3.5 py-1 text-[0.68rem] font-bold text-[#4A2F1F] uppercase tracking-widest"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#C9A227]" /> Since 1972 Legacy
                </motion.span>
                
                <h1 className="leading-tight">
                  <span className="block font-serif text-3xl sm:text-4xl md:text-5xl font-light italic tracking-wide text-[#C9A227] overflow-hidden py-1">
                    {slides[currentSlide].title.split(" ").map((word, i) => (
                      <motion.span
                        key={`title-word-${i}`}
                        className="inline-block mr-3"
                        initial={{ opacity: 0, y: 25, letterSpacing: "0.15em" }}
                        animate={{ opacity: 1, y: 0, letterSpacing: "0.02em" }}
                        transition={{
                          duration: 0.8,
                          delay: 0.3 + i * 0.15,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                      >
                        {word}
                      </motion.span>
                    ))}
                  </span>
                  <span className="block font-serif text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mt-1 text-[#4A2F1F] overflow-hidden py-1">
                    {slides[currentSlide].boldTitle.split(" ").map((word, i) => (
                      <motion.span
                        key={`bold-word-${i}`}
                        className="inline-block mr-4"
                        initial={{ opacity: 0, y: 40, letterSpacing: "0.1em" }}
                        animate={{ opacity: 1, y: 0, letterSpacing: "0.01em" }}
                        transition={{
                          duration: 0.9,
                          delay: 0.3 + (slides[currentSlide].title.split(" ").length * 0.15) + i * 0.18,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                      >
                        {word}
                      </motion.span>
                    ))}
                  </span>
                </h1>

                <motion.p
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.3 + (slides[currentSlide].title.split(" ").length + slides[currentSlide].boldTitle.split(" ").length) * 0.18 + 0.1,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  className="text-sm font-semibold text-[#D97706] uppercase tracking-[0.2em] mt-1"
                >
                  {slides[currentSlide].subtitle}
                </motion.p>

                <div className="flex flex-col gap-1.5 mt-1">
                  {slides[currentSlide].descriptionLines.map((line, i) => (
                    <div key={`desc-line-${i}`} className="overflow-hidden">
                      <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.3 + (slides[currentSlide].title.split(" ").length + slides[currentSlide].boldTitle.split(" ").length) * 0.18 + 0.3 + i * 0.15,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        className="text-xs sm:text-sm text-[#555] leading-relaxed max-w-lg"
                      >
                        {line}
                      </motion.p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-4 items-center">
                  {/* Primary CTA — Shop Now */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.3 + (slides[currentSlide].title.split(" ").length + slides[currentSlide].boldTitle.split(" ").length) * 0.18 + 0.3 + slides[currentSlide].descriptionLines.length * 0.15 + 0.1,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    whileHover={{ scale: 1.05, boxShadow: "0 12px 32px rgba(74,47,31,0.30)" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Link
                      href={slides[currentSlide].link}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4A2F1F] text-white hover:bg-[#4A2F1F]/90 px-7 py-3.5 text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer"
                    >
                      {slides[currentSlide].buttonText}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.div>
                  
                  {/* Premium Explore Collection CTA */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.3 + (slides[currentSlide].title.split(" ").length + slides[currentSlide].boldTitle.split(" ").length) * 0.18 + 0.3 + slides[currentSlide].descriptionLines.length * 0.15 + 0.25,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.96 }}
                    style={{ position: "relative" }}
                  >
                    <Link
                      href="/shop"
                      className="group relative inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white overflow-hidden cursor-pointer animate-glow-pulse"
                      style={{
                        background: "linear-gradient(135deg, #D46D2D 0%, #D4AF37 100%)",
                        boxShadow: "0 4px 24px rgba(212,109,45,0.35), 0 1px 4px rgba(0,0,0,0.1)"
                      }}
                    >
                      {/* Shimmer overlay */}
                      <span
                        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
                      />
                      <span>Explore Collection</span>
                      <motion.span
                        className="flex items-center"
                        initial={{ x: 0 }}
                        whileHover={{ x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                      </motion.span>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>

              {/* Right Side Platter Image */}
              <motion.div
                style={{ y: yImage }}
                className="lg:col-span-6 flex justify-center lg:justify-end"
              >
                <motion.div
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                  className="relative w-64 h-64 sm:w-96 sm:h-96 md:w-[440px] md:h-[440px] flex items-center justify-center"
                >
                  {/* Rotating Gold Accent Ring */}
                  <div className="absolute inset-0 rounded-full border border-[#C9A227]/20 animate-[spin_40s_linear_infinite]"></div>
                  
                  <motion.img
                    animate={{ y: [-8, 8, -8] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                    src={slides[currentSlide].image}
                    alt={slides[currentSlide].boldTitle}
                    className="w-full h-full object-contain filter drop-shadow-xl select-none relative z-10"
                  />
                </motion.div>
              </motion.div>
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
              <span className="text-xs font-bold uppercase tracking-wider text-[#4A2F1F]">
                <AnimatedNumber value={50} suffix="+" /> Years of Trust
              </span>
            </div>

            <div className="flex flex-col items-center justify-center gap-1.5 px-2 group">
              <Clock className="h-5 w-5 text-[#C9A227] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#4A2F1F]">
                <AnimatedNumber value={100} suffix="%" /> Fresh Daily
              </span>
            </div>

            <div className="flex flex-col items-center justify-center gap-1.5 px-2 group">
              <Sparkles className="h-5 w-5 text-[#D97706] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#4A2F1F]">
                <AnimatedNumber value={100} suffix="%" /> Pure Ingredients
              </span>
            </div>

            <div className="flex flex-col items-center justify-center gap-1.5 px-2 group">
              <ShieldCheck className="h-5 w-5 text-[#C9A227] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#4A2F1F]">
                <AnimatedNumber value={100} suffix="%" /> Secure Payments
              </span>
            </div>

            <div className="flex flex-col items-center justify-center gap-1.5 px-2 group col-span-2 md:col-span-1">
              <Truck className="h-5 w-5 text-[#D97706] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#4A2F1F]">
                <AnimatedNumber value={25} suffix="K+" /> Deliveries
              </span>
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

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center max-w-4xl mx-auto"
          >
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                }}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="w-full aspect-[4/5] relative overflow-hidden rounded-2xl bg-[#4A2F1F] shadow-md flex flex-col justify-end p-5 group"
              >
                <Link
                  href={`/shop?category=${cat.slug}`}
                  className="absolute inset-0 z-20"
                  aria-label={`Explore ${cat.name}`}
                />
                <img
                  src={cat.image_url || getCategoryFallbackImage(cat.slug)}
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
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- 4. BEST SELLERS (Conversion-focused Grid) --- */}
      <section className="py-20 bg-white overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.15
              }
            }
          }}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
            }}
            className="text-center max-w-xl mx-auto mb-14"
          >
            <span className="text-[0.65rem] font-bold text-[#D97706] uppercase tracking-[0.2em]">Customer Favorites</span>
            <h2 className="font-serif text-3xl font-bold text-[#4A2F1F] mt-1">Our Best Sellers</h2>
            <div className="h-0.5 w-16 bg-[#C9A227] mx-auto mt-3"></div>
          </motion.div>

          {/* Continuous infinite marquee container */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: { opacity: 1, y: 0, transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] } }
            }}
            className="relative w-full overflow-hidden pb-6 pt-2"
          >
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
                          onClick={(e) => handleBuyNow(product, e)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#D97706] text-white hover:bg-[#D97706]/90 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Buy Now
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
                          onClick={(e) => handleBuyNow(product, e)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#D97706] text-white hover:bg-[#D97706]/90 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Buy Now
                        </button>
                      </div>

                    </div>
                  </article>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* --- 5. SINCE 1972 HERITAGE SECTION (Split Layout) --- */}
      <section className="py-24 bg-[#FAF6EE] border-t border-b border-[#4A2F1F]/10 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Concise Story (Entering from Left) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-150px" }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col gap-5 lg:order-first"
            >
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
            </motion.div>

            {/* Right: Images side-by-side representing growth (Entering from Right) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-150px" }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 grid grid-cols-2 gap-4 lg:order-last"
            >
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
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- 6. WHY CHOOSE MEHTA DAIRY (Modern Grid) --- */}
      <section className="py-20 bg-white overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.08
              }
            }
          }}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
            }}
            className="text-center max-w-xl mx-auto mb-16"
          >
            <span className="text-[0.65rem] font-bold text-[#D97706] uppercase tracking-[0.2em]">Why Shop With Us</span>
            <h2 className="font-serif text-3xl font-bold text-[#4A2F1F] mt-1">Uncompromising Standards</h2>
            <div className="h-0.5 w-16 bg-[#C9A227] mx-auto mt-3"></div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="flex gap-4 p-5 rounded-xl hover:bg-[#FAF6EE]/50 transition-colors"
            >
              <CheckCircle className="h-6 w-6 text-[#D97706] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">Since 1972 Legacy</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Over 50 years of family-owned recipes passed down through master karigars.</p>
              </div>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="flex gap-4 p-5 rounded-xl hover:bg-[#FAF6EE]/50 transition-colors"
            >
              <CheckCircle className="h-6 w-6 text-[#C9A227] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">Trusted by Thousands</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Delivering joy and sweet memories to thousands of regular households in India & overseas.</p>
              </div>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="flex gap-4 p-5 rounded-xl hover:bg-[#FAF6EE]/50 transition-colors"
            >
              <CheckCircle className="h-6 w-6 text-[#D97706] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">Fresh Daily Production</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Every sweet is slow-churned and made in small batches daily to ensure freshness.</p>
              </div>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="flex gap-4 p-5 rounded-xl hover:bg-[#FAF6EE]/50 transition-colors"
            >
              <CheckCircle className="h-6 w-6 text-[#C9A227] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">Secure Online Payments</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Fully encrypted checkout integrated with Razorpay for worry-free card & UPI transactions.</p>
              </div>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="flex gap-4 p-5 rounded-xl hover:bg-[#FAF6EE]/50 transition-colors"
            >
              <CheckCircle className="h-6 w-6 text-[#D97706] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">Quality Ingredients</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Premium dryfruits, fresh direct cow milk, and authentic Kashmiri saffron only.</p>
              </div>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="flex gap-4 p-5 rounded-xl hover:bg-[#FAF6EE]/50 transition-colors"
            >
              <CheckCircle className="h-6 w-6 text-[#C9A227] flex-shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#4A2F1F] mb-1">Fast Delivery</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Express courier shipping with moisture-lock vacuum sealed packing.</p>
              </div>
            </motion.div>

          </div>
        </motion.div>
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

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {featuredProducts.map((product) => {
              const weights = Object.keys(product.prices);
              const currentWeight = selectedWeights[product.id] || weights[0];
              const currentPrice = product.prices[currentWeight];

              return (
                <motion.div
                  key={product.id}
                  variants={{
                    hidden: { opacity: 0, scale: 0.95 },
                    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
                  }}
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
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* --- 8. FOOTER --- */}
      <Footer />
    </div>
  );
}