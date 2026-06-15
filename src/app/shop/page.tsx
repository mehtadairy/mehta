"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { Product, CATEGORIES } from "@/lib/types";
import { fetchProducts, fetchCategories } from "@/lib/supabaseClient";
import { Search, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  // Loading indicator for category changes
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Load products & categories
  useEffect(() => {
    const loadData = async () => {
      const allProducts = await fetchProducts();
      setProducts(allProducts);
      
      const cats = await fetchCategories();
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    };
    loadData();
  }, []);

  // Sync parameters from url if changed
  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "all");
    setSearchQuery(searchParams.get("search") || "");
    setCurrentPage(1);
  }, [searchParams]);

  // Apply filters & sorting with loading feedback
  useEffect(() => {
    // Start loading when filter computation begins
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
    // Loading complete
    setCategoryLoading(false);
  }, [products, selectedCategory, searchQuery, maxPrice, sortBy]);

  // Pagination variables
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 320, behavior: "smooth" });
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
            <main className="lg:col-span-9 flex flex-col gap-8">
              
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border border-brand-beige rounded-xl p-4 bg-white shadow-2xs">
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

              {/* Grid content */}
              {categoryLoading ? (
                 <div className="flex flex-col items-center justify-center py-20 text-center">
                   <motion.div
                     className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"
                     initial={{ rotate: 0 }}
                     animate={{ rotate: 360 }}
                     transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                   />
                   <p className="mt-4 text-sm text-muted-foreground">Loading products...</p>
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
                  className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10"
                >
                  {currentItems.map((p) => {
                    const firstWeight = Object.keys(p.prices)[0];
                    const firstPrice = p.prices[firstWeight];
                    const labelWeight = firstWeight === "1kg" ? "1 KG" : firstWeight === "500g" ? "500 GM" : "250 GM";
                    return (
                      <motion.div
                        key={p.id}
                        variants={itemVariants}
                        layout
                        className="w-full"
                      >
                        <Link href={`/product/${p.id}`} className="group flex flex-col items-center text-center">
                          {/* Circular Platter container with Hover Circular Spin Animation */}
                          <div className="aspect-square w-full rounded-full bg-white border border-brand-beige flex items-center justify-center p-4 relative shadow-2xs overflow-hidden mb-4 transition-transform duration-500 group-hover:scale-105">
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="max-h-full max-w-full object-contain rounded-full transition-all duration-700 group-hover:animate-[spin_12s_linear_infinite]"
                              loading="lazy"
                            />
                          </div>

                          {/* Title */}
                          <h4 className="font-serif text-xs sm:text-sm font-bold text-brand-charcoal group-hover:text-brand-orange transition-colors leading-tight mb-1 line-clamp-1 max-w-[200px]">
                            {p.name}
                          </h4>

                          {/* Price and Weight in Brand Orange */}
                          <span className="text-xs font-bold text-brand-orange">
                            ₹{firstPrice.toFixed(2)} - {labelWeight}
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

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

      {/* --- MOBILE FILTERS PANEL MODAL --- */}
      <AnimatePresence>
        {showFiltersMobile && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFiltersMobile(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            ></motion.div>
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative z-10 w-full max-w-xs bg-white h-full shadow-xl flex flex-col p-6 ml-auto"
            >
              <div className="flex items-center justify-between border-b border-brand-beige pb-4 mb-6">
                <h3 className="font-serif text-base font-bold text-brand-charcoal">Catalog Filters</h3>
                <button onClick={() => setShowFiltersMobile(false)} className="p-1 hover:bg-brand-cream rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto flex flex-col gap-6">
                {/* Category selector grid */}
                <div>
                  <h4 className="font-serif text-sm font-bold text-brand-charcoal border-b border-brand-beige pb-2 mb-3">Categories</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => { setSelectedCategory("all"); setShowFiltersMobile(false); }}
                      className={`flex flex-col items-center justify-center p-2.5 border rounded-lg transition-all aspect-square text-center ${
                        selectedCategory === "all"
                          ? "border-brand-orange bg-brand-orange/5 text-brand-orange font-bold"
                          : "border-[#e8dcc4] bg-white text-brand-charcoal"
                      }`}
                    >
                      <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      <span className="text-[0.58rem] leading-none uppercase tracking-wider">All Items</span>
                    </button>

                     {categories.map(cat => {
                      const isActive = selectedCategory === cat.slug;
                      return (
                        <button
                          key={cat.slug}
                          onClick={() => { setSelectedCategory(cat.slug); setShowFiltersMobile(false); }}
                          className={`flex flex-col items-center justify-center p-2.5 border rounded-lg transition-all aspect-square text-center ${
                            isActive
                              ? "border-brand-orange bg-brand-orange/5 text-brand-orange font-bold"
                              : "border-[#e8dcc4] bg-white text-brand-charcoal"
                          }`}
                        >
                          {getCategoryIcon(cat.slug)}
                          <span className="text-[0.58rem] leading-none uppercase tracking-wider mt-0.5">{cat.name.replace("Sweets of ", "").replace("Tasty & ", "").replace("Chat-Patta ", "")}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile price selector */}
                <div>
                  <h4 className="font-serif text-sm font-bold text-brand-charcoal border-b border-brand-beige pb-2 mb-3">Price Limit</h4>
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
