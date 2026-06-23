"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { fetchProducts, fetchCategories } from "@/lib/supabaseClient";
import { Product, generateSlug } from "@/lib/types";
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
  if (slug === "milk-sweets") return "/mix_sweet_rolls_1781172915749.png";
  if (slug === "ghee-sweets") return "/prod_ghari_1781172844424.png";
  if (slug === "farsan") return "/dry_fruit_kachori_1781172416985.png";
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
    cta: { label: "Order Now", href: "/product/t1" },
    image: "/prod_kaju_katli_1781172877393.png",
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

/* ─── Timeline ─────────────────────────────────────────────────── */
const TIMELINE = [
  { year: "1972", label: "Founded in Palitana", desc: "Started as a humble sweet shop serving the pilgrim town of Palitana, Gujarat." },
  { year: "1995", label: "Legacy Expanded", desc: "Grew to serve thousands of families across Bhavnagar district." },
  { year: "2010", label: "Ahmedabad Presence", desc: "Opened flagship store bringing Palitana taste to the city." },
  { year: "2026", label: "Online Store", desc: "Now delivering authentic sweets pan-India through our premium online store." },
];

/* ════════════════════════════════════════════════════════════════ */
export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedWeights, setSelectedWeights] = useState<{ [id: string]: string }>({});
  const [currentSlide, setCurrentSlide] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
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
      const all = await fetchProducts();
      setProducts(all);
      const cats = await fetchCategories();
      setCategories(cats);
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
    }
    load();
  }, []);

  // Auto-advance hero slider
  useEffect(() => {
    const t = setInterval(() => setCurrentSlide((p) => (p === 0 ? 1 : 0)), 7000);
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

  const slide = SLIDES[currentSlide];

  return (
    <div className="bg-[#FAF6EE] min-h-screen text-[#2C2C2C] overflow-x-hidden selection:bg-[#D46D2D]/20">
      <Header />
      <WhatsAppFloat />



      {/* ═══════════════════════════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#FAF6EE] min-h-[75svh] md:min-h-[100svh] flex items-center">
        {/* Subtle dot grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#C9A22715_1.5px,transparent_1.5px)] [background-size:28px_28px] pointer-events-none" />

        {/* Warm gradient blob - hidden on mobile for performance */}
        <motion.div
          style={{ y: yBg }}
          className="hidden md:block absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#D46D2D]/10 to-[#C9A227]/5 blur-3xl pointer-events-none"
        />
        <div className="hidden md:block absolute -bottom-20 -left-20 w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-[#4A2F1F]/5 to-transparent blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-16 pb-8 md:pt-28 md:pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
            >
              {/* ── Left: Text ── */}
              <div className="flex flex-col gap-4 order-2 lg:order-1">
                {/* Trust badge */}
                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="inline-flex items-center gap-2 self-start rounded-full bg-[#4A2F1F]/8 border border-[#4A2F1F]/15 px-4 py-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#C9A227]" />
                  <span className="text-[0.68rem] font-bold text-[#4A2F1F] uppercase tracking-widest">
                    {t(`home.hero.badge_${slide.id + 1}`)}
                  </span>
                </motion.div>

                {/* Headline */}
                <h1 className="leading-[1.08]">
                  <motion.span
                    key={`italic-${currentSlide}`}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="block font-serif text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-light italic text-[#C9A227]"
                  >
                    {t(`home.hero.headline_${slide.id + 1}`)}
                  </motion.span>
                  <motion.span
                    key={`bold-${currentSlide}`}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="block font-serif text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-[#4A2F1F] mt-1"
                  >
                    {t(`home.hero.boldline_${slide.id + 1}`)}
                  </motion.span>
                </h1>

                <motion.p
                  key={`sub-${currentSlide}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.42 }}
                  className="text-sm sm:text-base text-[#6B5744] leading-relaxed max-w-md"
                >
                  {t(`home.hero.sub_${slide.id + 1}`)}
                </motion.p>

                {/* CTAs */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.55 }}
                  className="flex flex-wrap gap-3 mt-2"
                >
                  <Link
                    href={slide.cta.href}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#4A2F1F] text-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-[#4A2F1F]/85 transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-md"
                  >
                    {t(`home.hero.cta_${slide.id + 1}`)}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-[#4A2F1F]/25 bg-white/60 backdrop-blur-sm text-[#4A2F1F] px-6 py-3.5 text-xs font-bold uppercase tracking-wider hover:border-[#D46D2D] hover:text-[#D46D2D] transition-all hover:-translate-y-0.5"
                  >
                    {t('home.hero.explore')}
                  </Link>
                </motion.div>

                {/* Trust micro-indicators */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-wrap gap-4 mt-1"
                >
                  {[t('home.hero.trust_1'), t('home.hero.trust_2'), t('home.hero.trust_3')].map((text) => (
                    <span key={text} className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-[#6B5744]">
                      <CheckCircle className="h-3.5 w-3.5 text-[#4A9C6D]" /> {text}
                    </span>
                  ))}
                </motion.div>
              </div>

              {/* ── Right: Product Image ── */}
              <div className="flex justify-center lg:justify-end order-1 lg:order-2">
                <div className="relative">
                  {/* Outer glow ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-20px] rounded-full border border-dashed border-[#C9A227]/30"
                  />
                  {/* Inner glow */}
                  <div className="absolute inset-[-4px] rounded-full bg-gradient-to-br from-[#D46D2D]/15 to-[#C9A227]/10 blur-2xl" />

                  <motion.div
                    key={`img-${currentSlide}`}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10"
                  >
                    <motion.img
                      animate={{ y: [-10, 10, -10] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                      src={slide.image}
                      alt={slide.boldline}
                      className="w-52 h-52 sm:w-72 sm:h-72 lg:w-[400px] lg:h-[400px] object-contain drop-shadow-2xl select-none"
                    />
                  </motion.div>

                  {/* Floating accent badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute -bottom-2 -left-4 sm:bottom-4 sm:-left-8 bg-white/90 backdrop-blur-md border border-[#4A2F1F]/10 rounded-2xl px-4 py-2.5 shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⭐</span>
                      <div>
                        <div className="text-xs font-bold text-[#4A2F1F]">4.9 / 5.0</div>
                        <div className="text-[0.6rem] text-[#6B5744]">{t('home.hero.reviews')}</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Floating "Fresh Today" badge */}
                  <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -top-2 -right-2 sm:top-4 sm:-right-6 bg-[#4A2F1F] text-white rounded-full px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-wider shadow-lg"
                  >
                    {t('home.hero.fresh')}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Slide dots */}
          <div className="flex gap-2 mt-8 lg:mt-12">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? "w-8 bg-[#D46D2D]" : "w-2 bg-[#4A2F1F]/20"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Carousel nav arrows */}
        <button
          onClick={() => setCurrentSlide((p) => (p === 0 ? 1 : 0))}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm border border-[#4A2F1F]/12 text-[#4A2F1F] flex items-center justify-center z-20 hover:bg-white transition-all shadow-sm"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setCurrentSlide((p) => (p === 0 ? 1 : 0))}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm border border-[#4A2F1F]/12 text-[#4A2F1F] flex items-center justify-center z-20 hover:bg-white transition-all shadow-sm"
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. TRUST STATS STRIP
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#4A2F1F] py-8 relative z-10 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 text-center">
            {[
              { icon: Award, value: "50+", label: t('home.stats.years'), sub: t('home.stats.years_sub') },
              { icon: Truck, value: "25K+", label: t('home.stats.orders'), sub: t('home.stats.orders_sub') },
              { icon: Leaf, value: "100%", label: t('home.stats.pure'), sub: t('home.stats.pure_sub') },
              { icon: Clock, value: "100%", label: t('home.stats.fresh'), sub: t('home.stats.fresh_sub') }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                className="flex flex-col items-center justify-center gap-1 group"
              >
                <div className="h-10 w-10 rounded-full bg-white/10 border border-white/5 flex items-center justify-center mb-1 group-hover:bg-white/15 transition-colors shrink-0">
                  <item.icon className="h-5 w-5 text-[#C9A227]" strokeWidth={1.5} />
                </div>
                <span className="font-serif text-2xl font-bold text-white leading-tight">
                  {item.value}
                </span>
                <span className="text-[0.65rem] font-bold text-[#C9A227] uppercase tracking-wider leading-tight">
                  {item.label}
                </span>
                <span className="text-[0.55rem] text-white/60 leading-tight">
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
      <section className="py-10 md:py-16 lg:py-24 bg-[#FAF6EE]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-14"
          >
            <span className="text-[0.65rem] font-bold text-[#D46D2D] uppercase tracking-[0.25em]">{t('home.category.badge')}</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A2F1F] mt-2">{t('home.category.title')}</h2>
            <p className="text-sm text-[#6B5744] mt-2 max-w-md mx-auto">{t('home.category.sub')}</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Link
                  href={`/shop?category=${cat.slug}`}
                  className="group block relative rounded-xl overflow-hidden aspect-[2/3] sm:aspect-[3/4] bg-[#4A2F1F] shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  <img
                    src={cat.image_url || getCategoryFallbackImage(cat.slug)}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Premium gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2A1209]/90 via-[#2A1209]/30 to-transparent" />

                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#D46D2D]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                    <span className="block text-[0.58rem] font-bold text-[#C9A227] uppercase tracking-widest mb-1">{t('home.category.collection')}</span>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-white leading-tight">{cat.name}</h3>
                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                      <span className="text-[0.65rem] text-white/80 font-medium">{t('home.category.explore')}</span>
                      <ArrowRight className="h-3 w-3 text-white/80" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. BEST SELLERS — Responsive grid (mobile: 2-col, desk: 4-col)
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-10 md:py-16 lg:py-24 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14"
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
            {bestSellers.map((product, i) => {
              const weights = Object.keys(product.prices);
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
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>

                  {/* Body */}
                  <div className="p-3 sm:p-4 flex flex-col flex-grow">
                    <span className="text-[0.58rem] font-bold text-[#C9A227] uppercase tracking-widest">{product.category}</span>
                    <Link href={`/product/${generateSlug(product.name)}`}>
                      <h3 className="font-serif text-sm sm:text-base font-bold text-[#4A2F1F] hover:text-[#D46D2D] transition-colors line-clamp-1 mt-0.5 leading-snug">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Stars */}
                    <div className="flex gap-0.5 mt-1">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-2.5 w-2.5 fill-[#C9A227] text-[#C9A227]" />
                      ))}
                    </div>

                    {/* Weight selector */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {weights.map((w) => (
                        <button
                          key={w}
                          onClick={() => setSelectedWeights((prev) => ({ ...prev, [product.id]: w }))}
                          className={`rounded-md border px-2 py-0.5 text-[0.62rem] font-bold transition-all ${cw === w
                              ? "border-[#D46D2D] bg-[#D46D2D]/10 text-[#D46D2D]"
                              : "border-[#4A2F1F]/15 text-[#4A2F1F] hover:border-[#C9A227]"
                            }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#4A2F1F]/8">
                      <span className="font-sans tabular-nums text-base sm:text-lg font-bold text-[#4A2F1F]">₹{cp}</span>
                    </div>

                    {/* CTAs */}
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        className="flex items-center justify-center gap-1 rounded-lg bg-[#4A2F1F] text-white py-2 text-[0.62rem] font-bold uppercase tracking-wide hover:bg-[#4A2F1F]/85 transition-colors cursor-pointer"
                      >
                        <ShoppingBag className="h-3 w-3" /> Add
                      </button>
                      <button
                        onClick={(e) => handleBuyNow(product, e)}
                        className="flex items-center justify-center gap-1 rounded-lg bg-[#D46D2D] text-white py-2 text-[0.62rem] font-bold uppercase tracking-wide hover:bg-[#D46D2D]/85 transition-colors cursor-pointer"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. WHATSAPP ORDER BANNER
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#25D366] py-5 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(#FFFFFF12_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">{t('home.whatsapp.title')}</p>
                <p className="text-white/80 text-xs">{t('home.whatsapp.sub')}</p>
              </div>
            </div>
            <a
              href="https://wa.me/919825XXXXXX?text=Hello%20Mehta%20Dairy!%20I%20want%20to%20place%20an%20order"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-[#25D366] font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-white/90 transition-all hover:-translate-y-0.5 shadow-md whitespace-nowrap"
            >
              <Phone className="h-3.5 w-3.5" /> {t('home.whatsapp.cta')}
            </a>
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
      {featuredProducts.length > 0 && (
        <section className="py-16 sm:py-24 bg-[#FAF6EE]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14"
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
              {featuredProducts.map((product, i) => {
                const weights = Object.keys(product.prices);
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
                    <Link href={`/product/${generateSlug(product.name)}`} className="h-20 w-20 rounded-xl bg-[#FAF6EE] overflow-hidden flex-shrink-0">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-contain p-1.5 transition-transform group-hover:scale-105"
                      />
                    </Link>
                    <div className="flex-grow min-w-0">
                      <span className="text-[0.58rem] font-bold text-[#C9A227] uppercase tracking-widest">{product.category}</span>
                      <Link href={`/product/${generateSlug(product.name)}`}>
                        <h4 className="font-serif text-sm font-bold text-[#4A2F1F] hover:text-[#D46D2D] transition-colors line-clamp-1 mt-0.5">{product.name}</h4>
                      </Link>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-sm text-[#4A2F1F]">₹{cp}</span>
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          className="rounded-lg bg-[#4A2F1F] text-white px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-wide hover:bg-[#D46D2D] transition-colors cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

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