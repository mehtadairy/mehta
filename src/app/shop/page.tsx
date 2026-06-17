"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { Product, CATEGORIES } from "@/lib/types";
import { fetchProducts, fetchCategories } from "@/lib/supabaseClient";
import { Search, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/ProductCard";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring" as const, 
      stiffness: 100, 
      damping: 15 
    } 
  }
} as const;

const getCategoryBanner = (catId: string) => {
  switch (catId) {
    case "milk-sweets":
      return {
        title: "Sweets of Pure Milk",
        description: "Exquisite and rich delicacies prepared from fresh thickened milk solids (khoya), mawa, and pure malai, crafted to perfection since 1952.",
        bgClass: "from-[#0a4d8c] via-[#05294c] to-[#020e1a]",
        bgImage: "/mix_sweet_rolls_1781172915749.png"
      };
    case "ghee-sweets":
      return {
        title: "Sweets of Pure Ghee",
        description: "Timeless traditional Gujarati sweets slow-cooked and fried in 100% pure premium desi cow ghee.",
        bgClass: "from-[#5d4615] via-[#33260c] to-[#120e04]",
        bgImage: "/prod_ghari_1781172844424.png"
      };
    case "farsan":
      return {
        title: "Tasty & Chat-Patta Farsan",
        description: "Crispy, savory Gujarati snacks, gathiyas, wafers, and dry kachoris prepared daily with authentic legacy spice blends.",
        bgClass: "from-[#1a2e40] via-[#0d1721] to-[#05090d]",
        bgImage: "/dry_fruit_kachori_1781172416985.png"
      };
    default:
      return {
        title: "Mehta Sweets & Namkeens",
        description: "Explore our premium selection of authentic sweets, savory farsan, and premium gift boxes. Prepared fresh and packaged with care since 1952.",
        bgClass: "from-[#0a4d8c] via-[#05294c] to-[#020e1a]",
        bgImage: "/mix_sweet_rolls_1781172915749.png"
      };
  }
};

const getCategoryIcon = (id: string) => {
  switch (id) {
    case "milk-sweets":
      return (
        <svg className="w-7 h-7 mb-1.5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4M4 19h4m10-16v4m-2-2h4m-3 10v4m-2-2h4" />
        </svg>
      );
    case "ghee-sweets":
      return (
        <svg className="w-7 h-7 mb-1.5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v8m-4-4h8" />
        </svg>
      );
    case "farsan":
      return (
        <svg className="w-7 h-7 mb-1.5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-7 h-7 mb-1.5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      );
  }
};

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialSearch = searchParams.get("search") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>(CATEGORIES.map(c => ({ ...c, slug: c.id })));
  
  // Filters state
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [maxPrice, setMaxPrice] = useState(1500);
  const [sortBy, setSortBy] = useState("relevance");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  // Loading indicators
  const [pageLoading, setPageLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);

  // Ref on the products grid section for scroll-into-view on filter change
  const productsRef = useRef<HTMLDivElement>(null);

  // Ref to scroll product grid into view on category/filter change
  const productsGridRef = useRef<HTMLElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Load products & categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setPageLoading(true);
        const allProducts = await fetchProducts();
        setProducts(allProducts);
        
        const cats = await fetchCategories();
        if (cats && cats.length > 0) {
          setCategories(cats);
        }
      } catch (error) {
        console.error("Failed to load shop data:", error);
      } finally {
        setPageLoading(false);
      }
    };
    loadData();
  }, []);

  // Sync parameters from url if changed
  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "all");
    setSearchQuery(searchParams.get("search") || "");
    setCurrentPage(1);
    setCategoryLoading(true);
    // Scroll grid into view smoothly when URL params change
    productsGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchParams]);

  // Scroll to products grid on every filter change (category, search, sort, price)
  useEffect(() => {
    // Small delay so the new products are rendered before we scroll
    const t = setTimeout(() => {
      productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => clearTimeout(t);
  }, [selectedCategory, searchQuery, sortBy, maxPrice]);

  // Apply filters & sorting with loading feedback
  useEffect(() => {
    if (pageLoading) {
      setCategoryLoading(true);
      return;
    }

    setCategoryLoading(true);

    let result = [...products];

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );
    }

    // Price filter (Checking minimum weight price)
    result = result.filter(p => {
      const prices = Object.values(p.prices);
      const minPrice = Math.min(...prices);
      return minPrice <= maxPrice;
    });

    // Sorting
    if (sortBy === "price-low") {
      result.sort((a, b) => {
        const minA = Math.min(...Object.values(a.prices));
        const minB = Math.min(...Object.values(b.prices));
        return minA - minB;
      });
    } else if (sortBy === "price-high") {
      result.sort((a, b) => {
        const minA = Math.min(...Object.values(a.prices));
        const minB = Math.min(...Object.values(b.prices));
        return minB - minA;
      });
    } else if (sortBy === "popular") {
      result.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    }

    setFilteredProducts(result);
    setCurrentPage(1);

    // Smooth timeout to prevent flash of content
    const timer = setTimeout(() => {
      setCategoryLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [products, selectedCategory, searchQuery, maxPrice, sortBy, pageLoading]);

  // Pagination variables
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll back to the top of the products grid (not the full page)
    productsGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const banner = getCategoryBanner(selectedCategory);

  return (
    <>
      <Header />
      <WhatsAppFloat />

      {/* --- PREMIUM DYNAMIC HERO BANNER --- */}
      <section 
        className="relative text-white overflow-hidden bg-cover bg-center pt-28 sm:pt-36 pb-16 transition-all duration-500"
        style={{ backgroundImage: `url('${banner.bgImage}')` }}
      >
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"></div>
        {/* Background check overlay grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-30"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10 flex flex-col items-center">
          <motion.h2 
            key={banner.title}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="font-serif text-3xl sm:text-5xl font-extrabold tracking-wide drop-shadow-sm uppercase"
          >
            {banner.title}
          </motion.h2>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="h-0.5 w-16 bg-brand-gold my-4 origin-center"
          ></motion.div>
          <motion.p 
            key={banner.description}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-xs sm:text-sm text-brand-cream/80 max-w-2xl leading-relaxed text-center drop-shadow-xs"
          >
            {banner.description}
          </motion.p>
        </div>
      </section>

      {/* --- CONTENT WORKSPACE --- */}
      <section className="py-12 bg-[#faf9f6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* --- PRODUCTS GRID PANEL (LEFT COLUMN) --- */}
            <main ref={productsGridRef} className="lg:col-span-9 flex flex-col gap-6 scroll-mt-28">

              {/* ── MOBILE HORIZONTAL CATEGORY CHIPS (hidden on desktop) ── */}
              <div className="lg:hidden flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-[0.68rem] font-bold border transition-all cursor-pointer ${
                    selectedCategory === "all"
                      ? "bg-[#D46D2D] text-white border-[#D46D2D] shadow-sm"
                      : "bg-white text-[#2A1E17] border-[#EAE0D3] hover:border-[#D46D2D]"
                  }`}
                >
                  All Items
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-[0.68rem] font-bold border transition-all cursor-pointer ${
                      selectedCategory === cat.slug
                        ? "bg-[#D46D2D] text-white border-[#D46D2D] shadow-sm"
                        : "bg-white text-[#2A1E17] border-[#EAE0D3] hover:border-[#D46D2D]"
                    }`}
                  >
                    {cat.name.replace("Sweets of ", "").replace("Tasty & ", "").replace("Chat-Patta ", "")}
                  </button>
                ))}
              </div>

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border border-brand-beige rounded-xl p-3.5 bg-white shadow-2xs">
                {/* Search bar */}
                <div className="w-full sm:max-w-xs relative flex items-center border border-brand-beige rounded-lg bg-brand-cream/20 px-3 py-2 focus-within:border-brand-orange focus-within:bg-white transition-all">
                  <Search className="h-4.5 w-4.5 text-muted-foreground mr-2" />
                  <input 
                    type="text" 
                    placeholder="Search sweets, farsan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs bg-transparent border-none outline-none text-brand-charcoal font-sans"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {/* Mobile filter button */}
                  <button 
                    onClick={() => setShowFiltersMobile(true)}
                    className="lg:hidden flex items-center gap-1.5 border border-brand-beige rounded-lg px-3.5 py-2 text-xs font-semibold hover:bg-brand-cream transition-colors text-brand-charcoal"
                  >
                    <SlidersHorizontal className="h-4 w-4" /> Filters
                  </button>

                  {/* Sort selection */}
                  <div className="flex items-center border border-brand-beige rounded-lg px-2 bg-white">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground mr-1.5" />
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="border-none outline-none text-xs font-semibold py-2 pr-6 pl-1 bg-white text-brand-charcoal cursor-pointer"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="popular">Best Sellers</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grid content — fade transition wrapper */}
              <div
                ref={productsRef}
                key={`grid-${selectedCategory}-${sortBy}-${searchQuery}-${maxPrice}`}
                className="transition-opacity duration-300"
                style={{ scrollMarginTop: "7rem" }}
              >
              {categoryLoading || pageLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center text-center w-full">
                      {/* Circular placeholder mimicking the product card platter */}
                      <div className="aspect-square w-full rounded-full bg-brand-beige/20 border border-brand-beige/40 flex items-center justify-center p-4 relative shadow-2xs overflow-hidden mb-4">
                        <div className="w-4/5 h-4/5 rounded-full bg-brand-cream/50"></div>
                      </div>
                      {/* Title placeholder */}
                      <div className="h-4 w-32 bg-brand-beige/30 rounded mb-2"></div>
                      {/* Price placeholder */}
                      <div className="h-3.5 w-20 bg-brand-orange/15 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : currentItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-brand-beige rounded-2xl p-8">
                  <Search className="h-16 w-16 text-brand-beige mb-4" />
                  <h3 className="font-serif text-lg font-bold text-brand-charcoal">No Products Found</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mt-2">
                    We couldn't find any products matching your select criteria. Try modifying your search query or reset filter bars.
                  </p>
                  <button 
                    onClick={() => { setSelectedCategory("all"); setSearchQuery(""); setMaxPrice(1500); }}
                    className="mt-5 rounded-lg bg-brand-orange px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-orange-hover"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <motion.div 
                  key={`${selectedCategory}-${currentPage}-${sortBy}-${searchQuery}`}
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                >
                  {currentItems.map((p) => (
                    <motion.div
                      key={p.id}
                      variants={itemVariants}
                      layout
                      className="w-full"
                    >
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              </div>{/* end grid content fade wrapper */}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="px-3 py-1.5 rounded-lg border border-brand-beige hover:border-brand-gold text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white text-brand-charcoal transition-all"
                  >
                    Prev
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${currentPage === i + 1 ? "bg-brand-orange border-brand-orange text-white" : "border-brand-beige hover:border-brand-gold bg-white text-brand-charcoal hover:bg-brand-cream"}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="px-3 py-1.5 rounded-lg border border-brand-beige hover:border-brand-gold text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white text-brand-charcoal transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </main>

            {/* --- FILTERS & CATEGORIES SIDEBAR (RIGHT COLUMN) --- */}
            <aside className="hidden lg:col-span-3 lg:flex flex-col gap-6 sticky top-24">
              
              {/* Product Categories Square Tiles Grid */}
              <div className="bg-[#fdfaf2] border border-[#e8dcc4] rounded-2xl p-5 shadow-2xs">
                <h3 className="font-serif text-xs font-bold text-brand-charcoal border-b border-[#e8dcc4] pb-2.5 mb-4 uppercase tracking-wider">
                  Product Categories
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* All products tile */}
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory("all")}
                    className={`flex flex-col items-center justify-center p-3 border rounded-xl transition-all aspect-square text-center relative overflow-hidden ${
                      selectedCategory === "all"
                        ? "border-brand-orange bg-brand-orange/5 text-brand-orange font-bold shadow-3xs"
                        : "border-[#e8dcc4] hover:border-brand-orange bg-white text-brand-charcoal"
                    }`}
                  >
                    <svg className="w-7 h-7 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <span className="text-[0.62rem] leading-none uppercase tracking-wider font-semibold">All Items</span>
                  </motion.button>
                  
                  {/* Dynamic category tiles */}
                  {categories.map(cat => {
                    const isActive = selectedCategory === cat.slug;
                    return (
                      <motion.button
                        key={cat.slug}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCategory(cat.slug)}
                        className={`flex flex-col items-center justify-center p-3 border rounded-xl transition-all aspect-square text-center relative overflow-hidden ${
                          isActive
                            ? "border-brand-orange bg-brand-orange/5 text-brand-orange font-bold shadow-3xs"
                            : "border-[#e8dcc4] hover:border-brand-orange bg-white text-brand-charcoal"
                        }`}
                      >
                        {getCategoryIcon(cat.slug)}
                        <span className="text-[0.62rem] leading-none uppercase tracking-wider mt-1">{cat.name.replace("Sweets of ", "").replace("Tasty & ", "").replace("Chat-Patta ", "")}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Price range selector */}
              <div className="bg-[#fdfaf2] border border-[#e8dcc4] rounded-2xl p-5 shadow-2xs">
                <h3 className="font-serif text-xs font-bold text-brand-charcoal border-b border-[#e8dcc4] pb-2.5 mb-4 uppercase tracking-wider">
                  Price Limit (Min size)
                </h3>
                <div className="flex flex-col gap-3">
                  <input 
                    type="range" 
                    min="50" 
                    max="1500" 
                    step="50"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full h-1.5 bg-brand-beige rounded-lg appearance-none cursor-pointer accent-brand-orange"
                  />
                  <div className="flex justify-between text-xs font-semibold text-brand-charcoal">
                    <span>Under ₹{maxPrice}</span>
                    <span className="text-muted-foreground">Max ₹1500</span>
                  </div>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </section>

      {/* ── MOBILE FILTERS BOTTOM SHEET ──────────────────────────── */}
      <AnimatePresence>
        {showFiltersMobile && (
          <div className="fixed inset-0 z-50 flex items-end lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFiltersMobile(false)}
              className="absolute inset-0 bg-[#2A1E17]/40 backdrop-blur-sm"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 250 }}
              className="relative z-10 w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85dvh]"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-[#EAE0D3]" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 border-b border-[#EAE0D3]">
                <h3 className="font-serif text-base font-bold text-[#2A1E17]">Filters</h3>
                <button
                  onClick={() => setShowFiltersMobile(false)}
                  className="p-1.5 hover:bg-[#FAF6EE] rounded-full transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5 text-[#7E6B5A]" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-6">
                {/* Categories */}
                <div>
                  <h4 className="text-[0.65rem] font-bold text-[#7E6B5A] uppercase tracking-widest mb-3">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    {[{ slug: "all", name: "All Items" }, ...categories].map((cat: any) => (
                      <button
                        key={cat.slug}
                        onClick={() => { setSelectedCategory(cat.slug); }}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                          selectedCategory === cat.slug
                            ? "bg-[#D46D2D] text-white border-[#D46D2D]"
                            : "bg-white text-[#2A1E17] border-[#EAE0D3] hover:border-[#D46D2D]"
                        }`}
                      >
                        {cat.name.replace("Sweets of ", "").replace("Tasty & ", "").replace("Chat-Patta ", "")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="text-[0.65rem] font-bold text-[#7E6B5A] uppercase tracking-widest mb-3">Max Price</h4>
                  <input
                    type="range"
                    min="50"
                    max="1500"
                    step="50"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#EAE0D3] rounded-lg appearance-none cursor-pointer accent-[#D46D2D]"
                  />
                  <div className="flex justify-between text-xs font-semibold text-[#2A1E17] mt-2">
                    <span>Under ₹{maxPrice}</span>
                    <span className="text-[#7E6B5A]">Max ₹1500</span>
                  </div>
                </div>
              </div>

              {/* Apply CTA */}
              <div className="px-5 py-4 border-t border-[#EAE0D3] safe-bottom">
                <button
                  onClick={() => setShowFiltersMobile(false)}
                  className="w-full bg-[#D46D2D] hover:bg-[#BF5E23] text-white font-bold text-sm rounded-2xl py-3.5 transition-colors cursor-pointer"
                >
                  Show Results
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-brand-cream">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-orange"></div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
