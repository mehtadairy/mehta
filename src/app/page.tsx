"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { fetchProducts, fetchCategories, fetchBanners } from "@/lib/supabaseClient";
import { Product, generateSlug, sortCategories, sortWeights } from "@/lib/types";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
  type Variants,
} from "framer-motion";
import {
  Sparkles,
  Award,
  Clock,
  Star,
  ArrowRight,
  CheckCircle,
  Truck,
  ShieldCheck,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  Phone,
  MessageCircle,
  Gift,
  Leaf,
  Zap,
  Heart,
  Package,
  Quote,
  MapPin
} from "lucide-react";
import { useLocation } from "@/lib/context/LocationContext";
import { useLanguage } from "@/lib/context/LanguageContext";

/* ─── Helpers ──────────────────────────────────────────────────── */
const AnimatedNumber = ({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  useEffect(() => {
    if (!isInView) return;
    const duration = 1800;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      setCount(Math.floor(ease * value));
      if (p < 1) requestAnimationFrame(tick);
      else setCount(value);
    };
    requestAnimationFrame(tick);
  }, [isInView, value]);
  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
};

const getCategoryFallbackImage = (slug: string) => {
  if (slug === "milk-sweets") return "/category_milk_sweets.jpg";
  if (slug === "ghee-sweets") return "/category_ghee_sweets.jpg";
  if (slug === "farsan") return "/category_farsan.jpg";
  if (slug === "chikki") return "/category_chikki.jpg";
  if (slug === "gulkand") return "/category_gulkand.jpg";
  if (slug === "masala") return "/category_masala.jpg";
  if (slug === "khakhra") return "/category_khakhra.jpg";
  if (slug === "chatni") return "/category_chatni.jpg";
  return "/assorted_sweets_1781172431124.png";
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.12,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
};

/* ─── Testimonials data ────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    id: 1,
    name: "Priya Sharma",
    city: "Ahmedabad",
    rating: 5,
    text: "The Kaju Katli is absolutely divine — melt-in-the-mouth perfection. My family orders every Diwali and now online delivery is so convenient!",
    avatar: "PS",
  },
  {
    id: 2,
    name: "Rajesh Patel",
    city: "Surat",
    rating: 5,
    text: "Best dryfruit kachori I've ever had. The ghee aroma is so authentic — reminds me of my childhood trips to Palitana.",
    avatar: "RP",
  },
  {
    id: 3,
    name: "Meera Joshi",
    city: "Vadodara",
    rating: 5,
    text: "Premium quality, hygienic packaging, and super fast delivery. The milk sweets are incredibly fresh — you can taste the purity.",
    avatar: "MJ",
  },
  {
    id: 4,
    name: "Arjun Mehta",
    city: "Mumbai",
    rating: 5,
    text: "Ordered ghari for a special occasion — it was a huge hit! Everyone was asking where I ordered from. Will definitely order again.",
    avatar: "AM",
  },
];

/* ─── Hero slides ──────────────────────────────────────────────── */
const SLIDES = [
  {
    id: 0,
    badge: "Since 1972 · Palitana Heritage",
    headline: "Handcrafted",
    boldline: "Dryfruit Kachori",
    sub: "Slow-fried in 100% pure cow ghee with select almonds, cashews & saffron.",
    cta: { label: "Shop Kachori", href: "/shop?category=farsan" },
    image: "/hero_kachori_bowl_1781172813990.png",
    accent: "#D46D2D",
  },
  {
    id: 1,
    badge: "100% Pure · No Preservatives",
    headline: "Melt-In-Mouth",
    boldline: "Premium Kaju Katli",
    sub: "Crafted with California cashews and finished with traditional silver leaf.",
    cta: { label: "Order Now", href: "/product/kaju-katri" },
    image: "/prod_kaju_katli_1781172877393.png",
    accent: "#C9A227",
  },
  {
    id: 2,
    badge: "Traditional Recipe · Pure Milk",
    headline: "Rich & Saffron-Infused",
    boldline: "Authentic Kesar Penda",
    sub: "Slow-cooked milk fudge enriched with aromatic saffron and premium cardamoms.",
    cta: { label: "Shop Penda", href: "/product/kesar-penda" },
    image: "/mix_sweet_rolls_1781172915749.png",
    accent: "#C9A227",
  },
];

/* ─── WHY features ─────────────────────────────────────────────── */
const WHY_FEATURES = [
  {
    icon: Leaf,
    title: "100% Pure Ingredients",
    desc: "Premium cashews, fresh cow milk, Kashmiri saffron. Zero preservatives, zero compromise.",
    color: "#4A9C6D",
  },
  {
    icon: Clock,
    title: "Fresh Daily Production",
    desc: "Every sweet is slow-churned in small batches each morning for unmatched freshness.",
    color: "#D46D2D",
  },
  {
    icon: Award,
    title: "50+ Year Legacy",
    desc: "Family-owned recipes passed through master karigars since 1972 in Palitana.",
    color: "#C9A227",
  },
  {
    icon: Truck,
    title: "Pan-India Delivery",
    desc: "Vacuum-sealed, moisture-lock packing with fast courier shipping across India.",
    color: "#3B82F6",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    desc: "Fully encrypted checkout with Razorpay — UPI, cards, net banking all supported.",
    color: "#8B5CF6",
  },
  {
    icon: Gift,
    title: "Gift-Ready Packaging",
    desc: "Elegant premium gift boxes perfect for weddings, festivals, and corporate gifting.",
    color: "#EC4899",
  },
];

const TIMELINE = [
  { year: "1972", label: "Founded in Palitana", desc: "Started as a humble sweet shop serving the pilgrim town of Palitana, Gujarat." },
  { year: "2006", label: "New Branch Expansion", desc: "Expanded operations by opening a new branch to serve more sweet lovers." },
  { year: "2023", label: "Store Renovation", desc: "Completely renovated our flagship store to offer a modern, premium shopping experience." },
  { year: "2026", label: "Online Store", desc: "Launched our premium online store, delivering authentic sweets pan-India." },
];

/* ════════════════════════════════════════════════════════════════ */
export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [selectedWeights, setSelectedWeights] = useState<{ [id: string]: string }>({});
  const [currentSlide, setCurrentSlide] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { nearestBranch, distanceKm } = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 600], [0, isMobile ? 0 : 60]);

  useEffect(() => {
    async function load() {
      try {
        const [all, cats, bans] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchBanners()
        ]);
        
        setProducts(all);
        setCategories(sortCategories(cats));
        setBanners(bans);
        
        const popular = all.filter((p) => p.popular);
        setBestSellers(popular);
        
        const feat = all.filter((p) => !p.popular);
        setFeaturedProducts(feat.length > 0 ? feat.slice(0, 6) : all.slice(4, 10));
        
        const init: { [id: string]: string } = {};
        all.forEach((p) => {
          const w = Object.keys(p.prices);
          if (w.length) init[p.id] = w[0];
        });
        setSelectedWeights(init);
      } catch (err) {
        console.error("Failed to load homepage data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const slideCount = banners.length > 0 ? banners.length : SLIDES.length;
  const slideCountRef = useRef(slideCount);
  useEffect(() => {
    slideCountRef.current = slideCount;
  }, [slideCount]);

  // Auto-advance hero slider
  useEffect(() => {
    const t = setInterval(() => {
      setCurrentSlide((p) => (p + 1) % slideCountRef.current);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  // Auto-advance testimonials
  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx((p) => (p + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window === "undefined") return;
    const weight = selectedWeights[product.id] || Object.keys(product.prices)[0];
    const price = product.prices[weight];
    const cart = JSON.parse(localStorage.getItem("mehta_cart") || "[]");
    const idx = cart.findIndex((i: any) => i.productId === product.id && i.weight === weight);
    if (idx > -1) cart[idx].quantity += 1;
    else cart.push({ productId: product.id, productName: product.name, image: product.images[0], weight, price, quantity: 1 });
    localStorage.setItem("mehta_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    if (window.innerWidth < 1024) window.dispatchEvent(new Event("openCartDrawer"));
    const btn = e.currentTarget as HTMLButtonElement;
    const orig = btn.innerHTML;
    btn.innerHTML = "Added ✓";
    btn.disabled = true;
    setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 1000);
  };

  const handleBuyNow = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window === "undefined") return;
    const weight = selectedWeights[product.id] || Object.keys(product.prices)[0];
    const price = product.prices[weight];
    const cart = JSON.parse(localStorage.getItem("mehta_cart") || "[]");
    const idx = cart.findIndex((i: any) => i.productId === product.id && i.weight === weight);
    if (idx > -1) cart[idx].quantity += 1;
    else cart.push({ productId: product.id, productName: product.name, image: product.images[0], weight, price, quantity: 1 });
    localStorage.setItem("mehta_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    router.push("/checkout");
  };

  const activeSlides = banners.length > 0
    ? banners.map((b, i) => {
      const isGraphic = b.is_graphic_only !== false;
      return {
        id: i,
        badge: b.badge || "MEHTA DAIRY SPECIALS",
        headline: b.headline || "",
        boldline: b.boldline || "",
        sub: b.sub || "",
        cta: { label: b.cta_label || "Shop Now", href: b.link || "/shop" },
        image: b.image_url,
        accent: "#C9A227",
        isGraphicOnly: isGraphic
      }
    })
    : SLIDES;

  const slide = activeSlides[currentSlide % activeSlides.length];

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  return (
    <div className="bg-[#FAF6EE] min-h-screen text-[#2C2C2C] overflow-x-hidden selection:bg-[#D46D2D]/20">
      
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF6EE]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            >
              {/* Official 3D Metallic Gold Logo Badge */}
              <div className="relative flex items-center justify-center p-2">
                <img
                  src="/logo.png"
                  alt="Mehta Dairy"
                  className="h-28 sm:h-36 max-w-[85vw] w-auto object-contain drop-shadow-[0_12px_30px_rgba(200,155,60,0.35)]"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header />
      <WhatsAppFloat />



      {/* ═══════════════════════════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#FAF6EE] min-h-[55svh] md:min-h-[100svh] flex items-center">
        {/* Subtle dot grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#C9A22715_1.5px,transparent_1.5px)] [background-size:28px_28px] pointer-events-none" />

        {/* Carousel Nav Buttons */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/60 hover:bg-white rounded-full flex items-center justify-center shadow-md border border-[#4A2F1F]/10 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#4A2F1F]" />
        </button>
        <button
          onClick={handleNextSlide}
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/60 hover:bg-white rounded-full flex items-center justify-center shadow-md border border-[#4A2F1F]/10 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-[#4A2F1F]" />
        </button>

        <div className="mx-auto max-w-7xl px-4 sm:px-12 lg:px-16 relative z-10 w-full pt-24 pb-8 sm:pt-28 lg:pt-36 lg:pb-16">
          <AnimatePresence mode="wait">
            {slide.isGraphicOnly ? (
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.5 }}
                className="w-full relative z-10"
              >
                <Link href={slide.cta.href} className="block w-full cursor-pointer overflow-hidden rounded-2xl shadow-lg border border-[#C9A227]/25 bg-white aspect-[21/9] sm:aspect-[24/9] md:aspect-[32/10] relative group">
                  <Image
                    src={slide.image}
                    alt="Mehta Dairy Banner"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 85vw, 1200px"
                    priority
                    className="w-full h-full object-cover group-hover:scale-[1.005] transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-300" />
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 items-center"
              >
                {/* ── Left: Text ── */}
                <div className="flex flex-col gap-3 lg:gap-4 text-center lg:text-left order-1 lg:order-1">
                  {/* Trust badge */}
                  <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="inline-flex items-center gap-2 self-center lg:self-start rounded-full bg-[#FAF6EE] border border-[#C9A227]/30 px-4 py-1.5 shadow-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#C9A227]" />
                    <span className="text-[0.65rem] font-bold text-[#4A2F1F] uppercase tracking-[0.15em]">
                      {slide.badge || t(`home.hero.badge_${slide.id + 1}`)}
                    </span>
                  </motion.div>

                  {/* Headline */}
                  <h1 className="leading-tight lg:leading-[1.05]">
                    {/* Desktop Heading (hidden on mobile) */}
                    <span className="hidden lg:block">
                      <motion.span
                        key={`italic-des-${currentSlide}`}
                        initial={{ opacity: 0, x: -24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="block font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-medium italic text-[#C9A227]"
                      >
                        {slide.headline || t(`home.hero.headline_${slide.id + 1}`)}
                      </motion.span>
                      <motion.span
                        key={`bold-des-${currentSlide}`}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="block font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-bold text-[#4A2F1F] mt-1"
                      >
                        {slide.boldline || t(`home.hero.boldline_${slide.id + 1}`)}
                      </motion.span>
                    </span>

                    {/* Mobile/Tablet Single Line Heading (hidden on desktop) */}
                    <span className="lg:hidden block font-serif text-xl sm:text-2xl md:text-3xl font-bold text-[#4A2F1F] tracking-tight">
                      <span className="italic font-medium text-[#C9A227] mr-1.5">
                        {slide.headline || t(`home.hero.headline_${slide.id + 1}`)}
                      </span>
                      {slide.boldline || t(`home.hero.boldline_${slide.id + 1}`)}
                    </span>
                  </h1>

                  <motion.p
                    key={`sub-${currentSlide}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.42 }}
                    className="text-xs sm:text-base text-[#6B5744] leading-relaxed max-w-md mx-auto lg:mx-0 mt-1"
                  >
                    {slide.sub || t(`home.hero.sub_${slide.id + 1}`)}
                  </motion.p>

                  {/* CTAs */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.55 }}
                    className="flex flex-wrap justify-center lg:justify-start gap-3 mt-3"
                  >
                    <Link
                      href={slide.cta.href}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#4A2F1F] text-white px-6 py-2.5 lg:px-8 lg:py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-[#3A2215] transition-all hover:-translate-y-0.5 shadow-md"
                    >
                      {slide.cta.label}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-2 rounded-xl border border-[#4A2F1F]/20 bg-transparent text-[#4A2F1F] px-6 py-2.5 lg:px-8 lg:py-3.5 text-xs font-bold uppercase tracking-widest hover:border-[#4A2F1F] hover:bg-white/50 transition-all hover:-translate-y-0.5"
                    >
                      Explore All
                    </Link>
                  </motion.div>

                  {/* Trust micro-indicators */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="flex flex-wrap justify-center lg:justify-start gap-4 mt-3"
                  >
                    {[t('home.hero.trust_1'), t('home.hero.trust_2'), t('home.hero.trust_3')].map((text) => (
                      <span key={text} className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-[#4A2F1F]/70">
                        <CheckCircle className="h-3.5 w-3.5 text-[#4A9C6D]" /> {text}
                      </span>
                    ))}
                  </motion.div>
                </div>

                {/* ── Right: Product Image ── */}
                <div className="flex justify-center lg:justify-end order-2 lg:order-2 mt-6 lg:mt-0">
                  <div className="relative">
                    {/* Subtle circle background (Image 1 style) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full border border-dashed border-[#C9A227]/40 pointer-events-none" />

                    {/* Square Image Container wrapped in link */}
                    <Link href={slide.cta.href || "/shop"} className="cursor-pointer block relative z-10">
                      <motion.div
                        key={`img-${currentSlide}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-[480px] lg:h-[480px] rounded-full overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-300"
                      >
                        <Image
                          src={slide.image}
                          alt={slide.boldline || "Mehta Dairy Featured Product"}
                          fill
                          sizes="(max-width: 640px) 200px, (max-width: 1024px) 300px, 480px"
                          priority
                          className="w-full h-full object-cover hover:scale-102 transition-transform duration-700"
                        />
                      </motion.div>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Slide dots */}
          <div className="flex gap-2 mt-8 lg:mt-12 w-full max-w-7xl mx-auto">
            {activeSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? "w-8 bg-[#D46D2D]" : "w-2 bg-[#4A2F1F]/20"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>


      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. TRUST STATS STRIP
      ═══════════════════════════════════════════════════════════ */}
      <section
        className="py-8 relative z-10"
        style={{
          backgroundColor: '#FCF8F2',
          borderTop: '2px solid #D4AF37',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.04)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 gap-2 sm:gap-6 lg:gap-8 text-center">
            {[
              { icon: Award, value: "50+", label: t('home.stats.years'), sub: t('home.stats.years_sub') },
              { icon: Truck, value: "25K+", label: t('home.stats.orders'), sub: t('home.stats.orders_sub') },
              { icon: Leaf, value: "100%", label: t('home.stats.pure'), sub: t('home.stats.pure_sub') },
              { icon: Clock, value: "100%", label: t('home.stats.fresh'), sub: t('home.stats.fresh_sub') }
            ].map((item, idx, arr) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                className="flex flex-col items-center justify-center gap-1 group cursor-default"
                style={{
                  borderRight: idx < arr.length - 1 ? '1px solid rgba(212,175,55,0.15)' : 'none',
                  transition: 'transform 0.3s ease',
                }}
                whileHover={{ y: -4 }}
              >
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center mb-1 shrink-0 border transition-colors"
                  style={{ backgroundColor: 'rgba(212,175,55,0.08)', borderColor: 'rgba(212,175,55,0.2)' }}
                >
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.5} style={{ color: '#D4AF37' }} />
                </div>
                <span className="font-serif text-lg sm:text-2xl font-bold leading-tight" style={{ color: '#3D2B1F' }}>
                  {item.value}
                </span>
                <span className="text-[0.5rem] sm:text-[0.65rem] font-bold uppercase tracking-wider leading-tight" style={{ color: '#D4AF37' }}>
                  {item.label}
                </span>
                <span className="text-[0.45rem] sm:text-[0.55rem] leading-tight" style={{ color: '#6B5A4A' }}>
                  {item.sub}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. SHOP BY CATEGORY
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-6 md:py-16 lg:py-24 bg-[#FAF6EE]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-5 sm:mb-14"
          >
            <span className="text-[0.65rem] font-bold text-[#D46D2D] uppercase tracking-[0.25em]">{t('home.category.badge')}</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A2F1F] mt-2">{t('home.category.title')}</h2>
            <p className="text-sm text-[#6B5744] mt-2 max-w-md mx-auto">{t('home.category.sub')}</p>
          </motion.div>

          {/* Universal Category Horizontal Slider */}
          <div className="flex overflow-x-auto gap-4 md:gap-5 px-4 lg:px-0 py-4 scrollbar-none snap-x snap-mandatory scroll-smooth justify-start lg:justify-center">
            {/* All Items Card - highlighted with gold border by default on homepage */}
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="snap-start shrink-0 animate-fade-in"
            >
              <Link
                href="/shop"
                className="w-24 md:w-32 flex flex-col items-center bg-[#FAF6EE] rounded-2xl p-3.5 md:p-5 border-2 border-[#C9A227] transition-all duration-300 text-center shadow-[0_4px_12px_rgba(74,47,31,0.03)]"
              >
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-white flex items-center justify-center mb-2 border border-[#EAE0D3]/60 shadow-xs">
                  <svg className="w-5 h-5 md:w-7 md:h-7 text-[#4A2F1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <span className="font-serif text-[10px] md:text-xs font-bold text-[#4A2F1F] tracking-wide whitespace-nowrap mt-1">
                  All Items
                </span>
              </Link>
            </motion.div>

            {/* Other Categories */}
            {categories.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-24 md:w-32 flex flex-col items-center bg-white rounded-2xl p-3.5 md:p-5 border border-[#EAE0D3]/80 animate-pulse snap-start shrink-0">
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-[#EAE0D3]/40" />
                  <div className="h-3 w-16 bg-[#EAE0D3]/40 rounded mt-3" />
                </div>
              ))
            ) : (
              categories.map((cat) => (
                <motion.div
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                className="snap-start shrink-0"
              >
                <Link
                  href={`/shop?category=${cat.slug}`}
                  className="w-24 md:w-32 flex flex-col items-center bg-white rounded-2xl p-3.5 md:p-5 border border-[#EAE0D3]/80 transition-all duration-300 text-center shadow-[0_4px_12px_rgba(74,47,31,0.02)] hover:border-[#D46D2D]"
                >
                  <div className="relative w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden mb-2 bg-[#FAF6EE] border border-[#EAE0D3]/40 shadow-xs flex items-center justify-center">
                    <Image
                      src={cat.image_url || getCategoryFallbackImage(cat.slug)}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 768px) 56px, 80px"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-serif text-[10px] md:text-xs font-extrabold text-[#4A2F1F] tracking-wide line-clamp-1 mt-1">
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            ))
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. BEST SELLERS — Responsive grid (mobile: 2-col, desk: 4-col)
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-6 md:py-16 lg:py-24 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5 sm:mb-14"
          >
            <div>
              <span className="text-[0.65rem] font-bold text-[#D46D2D] uppercase tracking-[0.25em]">{t('home.bestseller.badge')}</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A2F1F] mt-2">{t('home.bestseller.title')}</h2>
            </div>
            <Link href="/shop" className="inline-flex items-center gap-2 text-xs font-bold text-[#D46D2D] uppercase tracking-wider hover:gap-3 transition-all">
              {t('home.bestseller.view_all')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {bestSellers.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[#FAF6EE] rounded-2xl p-4 border border-[#4A2F1F]/8 flex flex-col gap-3 animate-pulse">
                  <div className="aspect-square w-full rounded-xl bg-[#EAE0D3]/40" />
                  <div className="h-4 w-1/3 bg-[#EAE0D3]/40 rounded mt-2" />
                  <div className="h-4 w-2/3 bg-[#EAE0D3]/40 rounded" />
                  <div className="flex gap-2 mt-2">
                    <div className="h-8 w-12 bg-[#EAE0D3]/30 rounded-lg" />
                    <div className="h-8 w-12 bg-[#EAE0D3]/30 rounded-lg" />
                  </div>
                  <div className="h-9 w-full bg-[#EAE0D3]/40 rounded-lg mt-3" />
                </div>
              ))
            ) : (
              bestSellers.map((product, i) => {
                const weights = sortWeights(Object.keys(product.prices));
                const cw = selectedWeights[product.id] || weights[0];
                const cp = product.prices[cw];
                return (
                  <motion.article
                  key={product.id}
                  variants={fadeUp}
                  custom={i * 0.5}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="group bg-[#FAF6EE] rounded-2xl overflow-hidden border border-[#4A2F1F]/8 hover:shadow-xl transition-shadow duration-300 flex flex-col"
                >
                  {/* Image */}
                  <Link href={`/product/${generateSlug(product.name)}`} className="block relative aspect-square overflow-hidden bg-white">
                    {product.popular && (
                      <span className="absolute left-2 top-2 z-10 rounded-md bg-[#C9A227] px-2 py-0.5 text-[0.58rem] font-bold text-[#4A2F1F] uppercase tracking-wider shadow">
                        {t('home.bestseller.best_seller')}
                      </span>
                    )}
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 150px, (max-width: 1024px) 250px, 300px"
                      loading="lazy"
                      className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>

                  {/* Body */}
                  <div className="p-3 sm:p-4 flex flex-col flex-grow">
                    <span className="font-sans text-[10px] sm:text-[11px] font-bold text-[#C88A1A] uppercase tracking-[1.5px] mb-1.5 block">{product.category}</span>
                    <Link href={`/product/${generateSlug(product.name)}`}>
                      <h3 className="font-sans text-sm sm:text-base font-bold text-[#2A1E17] hover:text-[#D46D2D] transition-colors line-clamp-1 leading-snug mb-1.5">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Weight selector */}
                    <div className="flex flex-wrap gap-2 mb-3 mt-2">
                      {weights.map((w) => (
                        <button
                          key={w}
                          onClick={() => setSelectedWeights((prev) => ({ ...prev, [product.id]: w }))}
                          className={`rounded-[10px] border px-3 py-1.5 text-[13px] font-semibold transition-all cursor-pointer ${cw === w
                            ? "bg-[#D46D2D] text-white border-[#D46D2D] shadow-sm"
                            : "bg-[#FAF6EE] text-[#2A1E17] border-[#EAE0D3]/80 hover:border-[#D4AF37]"
                            }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#EAE0D3]/60 w-full">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-sans text-[9px] font-bold text-[#9A8E84] uppercase tracking-wider leading-none">
                          Price
                        </span>
                        <span className="font-sans tabular-nums text-base sm:text-lg font-bold text-[#2A1E17] leading-none">
                          ₹{cp}
                        </span>
                      </div>
                    </div>

                    {/* Universal CTAs (90% / 10% layout) */}
                    <div className="flex gap-1.5 mt-2.5 w-full">
                      <button
                        onClick={(e) => handleBuyNow(product, e)}
                        className="flex-[9] flex items-center justify-center rounded-lg bg-[#4A2F1F] text-white py-2.5 text-[0.68rem] font-extrabold uppercase tracking-widest hover:bg-[#3D2619] transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
                      >
                        BUY NOW
                      </button>
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        className="flex-[1.2] aspect-square flex items-center justify-center rounded-lg border border-[#EAE0D3] bg-white text-[#4A2F1F] py-2.5 transition-all duration-200 active:scale-95 shadow-sm cursor-pointer hover:bg-[#FAF6EE]"
                        title="Add to Cart"
                      >
                        <ShoppingBag className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          6. OUR STORY — Magazine timeline layout
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-[#FAF6EE] border-t border-b border-[#4A2F1F]/8 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">

            {/* Left: story text */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 flex flex-col gap-6"
            >
              <div>
                <span className="text-[0.65rem] font-bold text-[#D46D2D] uppercase tracking-[0.25em]">{t('home.story.badge')}</span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A2F1F] mt-2 leading-tight">
                  {t('home.story.title')}
                </h2>
                <div className="h-0.5 w-16 bg-[#C9A227] mt-4" />
              </div>
              <p className="text-sm text-[#6B5744] leading-relaxed">
                {t('home.story.p1')}
              </p>
              <p className="text-sm text-[#4A2F1F] font-semibold leading-relaxed">
                {t('home.story.p2')}
              </p>

              {/* Timeline */}
              <div className="flex flex-col gap-0 mt-2">
                {TIMELINE.map((item, i) => (
                  <motion.div
                    key={item.year}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex gap-4 group"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[#4A2F1F] text-white flex items-center justify-center text-[0.58rem] font-bold shrink-0 group-hover:bg-[#D46D2D] transition-colors">
                        {item.year.slice(2)}
                      </div>
                      {i < TIMELINE.length - 1 && (
                        <div className="w-0.5 h-8 bg-[#4A2F1F]/15 mt-1" />
                      )}
                    </div>
                    <div className="pb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[0.65rem] font-bold text-[#C9A227] uppercase tracking-wider">{item.year}</span>
                        <span className="font-serif text-sm font-bold text-[#4A2F1F]">{item.label}</span>
                      </div>
                      <p className="text-xs text-[#6B5744] mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#D46D2D] uppercase tracking-widest hover:gap-3 transition-all self-start"
              >
                Read Full Story <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>

            {/* Right: images collage */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="lg:col-span-7 grid grid-cols-2 gap-4"
            >
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl overflow-hidden aspect-[4/5] border border-[#4A2F1F]/10 shadow-lg">
                  <img
                    src="/store_entry_image.jpeg"
                    alt="Mehta Dairy Store Entrance"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden aspect-square border border-[#4A2F1F]/10 shadow-md">
                  <img
                    src="/store_products_storage.jpeg"
                    alt="Mehta Dairy Products"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4 mt-8">
                <div className="rounded-2xl overflow-hidden aspect-square border border-[#4A2F1F]/10 shadow-md">
                  <img
                    src="/store_inside_counter.jpeg"
                    alt="Inside Mehta Dairy"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden aspect-[4/5] border border-[#4A2F1F]/10 shadow-lg">
                  <img
                    src="/store_outside.jpeg"
                    alt="Mehta Dairy Outside"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>



      {/* ═══════════════════════════════════════════════════════════
          8. FEATURED PRODUCTS
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-8 sm:py-24 bg-[#FAF6EE]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5 sm:mb-14"
          >
            <div>
              <span className="text-[0.65rem] font-bold text-[#D46D2D] uppercase tracking-[0.25em]">Explore More</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A2F1F] mt-2">Featured Specialties</h2>
            </div>
            <Link href="/shop" className="inline-flex items-center gap-2 text-xs font-bold text-[#D46D2D] uppercase tracking-wider hover:gap-3 transition-all">
              Browse All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {featuredProducts.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white border border-[#4A2F1F]/8 rounded-2xl p-4 flex gap-4 items-center animate-pulse">
                  <div className="h-20 w-20 rounded-xl bg-[#EAE0D3]/40 shrink-0" />
                  <div className="flex-grow flex flex-col gap-2">
                    <div className="h-3 w-1/4 bg-[#EAE0D3]/40 rounded" />
                    <div className="h-4 w-3/4 bg-[#EAE0D3]/40 rounded" />
                    <div className="h-3 w-1/3 bg-[#EAE0D3]/40 rounded mt-1" />
                  </div>
                </div>
              ))
            ) : (
              featuredProducts.map((product, i) => {
                const weights = sortWeights(Object.keys(product.prices));
                const cw = selectedWeights[product.id] || weights[0];
                const cp = product.prices[cw];
                return (
                  <motion.div
                    key={product.id}
                    variants={fadeUp}
                    custom={i * 0.4}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    whileHover={{ y: -3 }}
                    className="group bg-white border border-[#4A2F1F]/8 rounded-2xl p-4 flex gap-4 items-center hover:shadow-md transition-shadow"
                  >
                    <Link href={`/product/${generateSlug(product.name)}`} className="relative h-20 w-20 rounded-xl bg-[#FAF6EE] overflow-hidden flex-shrink-0">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="80px"
                        loading="lazy"
                        className="w-full h-full object-contain p-1.5 transition-transform group-hover:scale-105"
                      />
                    </Link>
                    <div className="flex-grow min-w-0">
                      <span className="font-sans text-[10px] sm:text-[11px] font-bold text-[#C88A1A] uppercase tracking-[1.5px] mb-1.5 block">{product.category}</span>
                      <Link href={`/product/${generateSlug(product.name)}`}>
                        <h4 className="font-sans text-sm sm:text-base font-bold text-[#2A1E17] hover:text-[#D46D2D] transition-colors line-clamp-1 leading-snug mb-1.5">{product.name}</h4>
                      </Link>
                      {/* Universal CTA (90% / 10% layout) */}
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex items-baseline justify-between gap-1 border-t border-[#EAE0D3]/60 pt-2 mt-1 mb-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-sans text-[9px] font-bold text-[#9A8E84] uppercase tracking-wider leading-none">Price</span>
                            <span className="font-sans tabular-nums text-base sm:text-lg font-bold text-[#2A1E17] leading-none">₹{cp}</span>
                          </div>
                          <span className="font-sans text-[13px] font-semibold text-[#6F6257] bg-[#FAF6EE] px-2.5 py-1 rounded-[10px] border border-[#EAE0D3]/80">{cw}</span>
                        </div>
                        <div className="flex gap-1.5 w-full">
                          <button
                            onClick={(e) => handleBuyNow(product, e)}
                            className="flex-[9] flex items-center justify-center rounded-lg bg-[#4A2F1F] text-white py-2.5 text-[0.68rem] font-extrabold uppercase tracking-widest hover:bg-[#3D2619] transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
                          >
                            BUY NOW
                          </button>
                          <button
                            onClick={(e) => handleAddToCart(product, e)}
                            className="flex-[1.2] aspect-square flex items-center justify-center rounded-lg border border-[#EAE0D3] bg-white text-[#4A2F1F] py-2.5 transition-all duration-200 active:scale-95 shadow-sm cursor-pointer hover:bg-[#FAF6EE]"
                            title="Add to Cart"
                          >
                            <ShoppingBag className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
              )}
            </div>
          </div>
        </section>

      {/* FOOTER follows */}
      {false && <section className="py-16 sm:py-24 bg-[#4A2F1F] overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(#C9A22710_1.5px,transparent_1.5px)] [background-size:28px_28px]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-14"
          >
            <span className="text-[0.65rem] font-bold text-[#C9A227] uppercase tracking-[0.25em]">Customer Love</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-2">What Our Customers Say</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.id}
                variants={fadeUp}
                custom={i * 0.5}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-white/6 backdrop-blur-sm border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col gap-3 hover:bg-white/10 transition-colors"
              >
                <Quote className="h-5 w-5 text-[#C9A227]/60" />
                <p className="text-white/85 text-xs sm:text-sm leading-relaxed flex-grow">{t.text}</p>
                <div className="flex gap-0.5 mb-1">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="h-3 w-3 fill-[#C9A227] text-[#C9A227]" />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#C9A227]/20 flex items-center justify-center text-[0.65rem] font-bold text-[#C9A227]">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{t.name}</div>
                    <div className="text-[0.62rem] text-white/50">{t.city}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>}

      {false && <section className="py-16 sm:py-24 bg-[#FAF6EE]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#4A2F1F] to-[#2A1209] p-8 sm:p-12 text-center"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#C9A22712_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-[#C9A227]/10 blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#C9A227]/15 border border-[#C9A227]/25 px-4 py-1.5 mb-6">
                <Sparkles className="h-3.5 w-3.5 text-[#C9A227]" />
                <span className="text-[0.65rem] font-bold text-[#C9A227] uppercase tracking-widest">Festival & Gift Season</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                Gift the Taste of <br />
                <span className="text-[#C9A227] italic">Pure Tradition</span>
              </h2>
              <p className="text-white/70 text-sm sm:text-base max-w-md mx-auto mb-8">
                Explore our curated festival hampers — perfect for Diwali, weddings, and corporate gifting. Delivered pan-India with elegant packaging.
              </p>

              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#C9A227] text-[#2A1209] px-7 py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-[#C9A227]/85 transition-all hover:-translate-y-0.5 shadow-lg"
                >
                  <Gift className="h-3.5 w-3.5" /> Shop Gift Hampers
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 text-white px-7 py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-white/15 transition-all hover:-translate-y-0.5"
                >
                  Contact for Bulk Orders
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>}

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════ */}
      <Footer />
    </div>
  );
}