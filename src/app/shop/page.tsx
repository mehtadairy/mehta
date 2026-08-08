"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { Product, CATEGORIES, sortCategories } from "@/lib/types";
import { fetchProducts, fetchCategories } from "@/lib/supabaseClient";
import { Search, SlidersHorizontal, ArrowUpDown, X, ArrowLeft, Clock, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import { HighlightText } from "@/components/HighlightText";
import { useLanguage } from "@/lib/context/LanguageContext";
import { img } from "@/lib/image-utils";

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
  const defaultBannerImage = "/shop_hero_banner.jpg";
  switch (catId) {
    case "milk-sweets":
      return {
        title: "Sweets of Pure Milk",
        description: "Exquisite and rich delicacies prepared from fresh thickened milk solids (khoya), mawa, and pure malai, crafted to perfection since 1952.",
        bgClass: "from-[#0a4d8c] via-[#05294c] to-[#020e1a]",
        bgImage: defaultBannerImage
      };
    case "ghee-sweets":
      return {
        title: "Sweets of Pure Ghee",
        description: "Timeless traditional Gujarati sweets slow-cooked and fried in 100% pure premium desi cow ghee.",
        bgClass: "from-[#5d4615] via-[#33260c] to-[#120e04]",
        bgImage: defaultBannerImage
      };
    case "farsan":
      return {
        title: "Tasty & Chat-Patta Farsan",
        description: "Crispy, savory Gujarati snacks, gathiyas, wafers, and dry kachoris prepared daily with authentic legacy spice blends.",
        bgClass: "from-[#1a2e40] via-[#0d1721] to-[#05090d]",
        bgImage: defaultBannerImage
      };
    default:
      return {
        title: "Mehta Sweets & Namkeens",
        description: "Explore our premium selection of authentic sweets, savory farsan, and premium gift boxes. Prepared fresh and packaged with care since 1952.",
        bgClass: "from-[#0a4d8c] via-[#05294c] to-[#020e1a]",
        bgImage: defaultBannerImage
      };
  }
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
          {/* Snacking bowl / pretzels representational icon */}
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h18M5 12a7 7 0 0014 0" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 8c.5-1.5 2-2.5 4-2.5s3.5 1 4 2.5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 9c.5-.7 1.5-1.2 2.5-1.2s2 .5 2.5 1.2" />
        </svg>
      );
    case "gulkand":
      return (
        <svg className="w-7 h-7 mb-1.5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {/* Rose/flower shape */}
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10a2 2 0 100-4 2 2 0 000 4z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14a2 2 0 100 4 2 2 0 000-4z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 12a2 2 0 10-4 0 2 2 0 004 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 12a2 2 0 104 0 2 2 0 00-4 0z" />
          <circle cx="12" cy="12" r="2" strokeWidth={1.5} />
        </svg>
      );
    case "masala":
      return (
        <svg className="w-7 h-7 mb-1.5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {/* Flame / spicy icon */}
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1014.12 11.88" />
        </svg>
      );
    case "chatni":
      return (
        <svg className="w-7 h-7 mb-1.5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {/* Droplet representing chatni dip */}
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16a6 6 0 100-12c-2.4 3-6 4.8-6 8a6 6 0 006 6z" />
        </svg>
      );
    case "chikki":
      return (
        <svg className="w-7 h-7 mb-1.5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {/* Brittle / grid squares block */}
          <rect x="4" y="4" width="6" height="6" rx="1" strokeWidth={1.5} />
          <rect x="14" y="4" width="6" height="6" rx="1" strokeWidth={1.5} />
          <rect x="4" y="14" width="6" height="6" rx="1" strokeWidth={1.5} />
          <rect x="14" y="14" width="6" height="6" rx="1" strokeWidth={1.5} />
        </svg>
      );
    case "khakhra":
      return (
        <svg className="w-7 h-7 mb-1.5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {/* Circular flatbread representational design */}
          <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
          <circle cx="12" cy="12" r="5" strokeWidth={1.5} strokeDasharray="3 3" />
          <circle cx="12" cy="12" r="2" strokeWidth={1.5} />
        </svg>
      );
    case "winter-specials":
      return (
        <svg className="w-7 h-7 mb-1.5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {/* Snowflake / star icon */}
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18M3 12h18m-3-6L6 18M6 6l12 12" />
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

const getCategoryCircularIcon = (id: string, active: boolean) => {
  const iconColor = active ? "text-white" : "text-[#7E6B5A]";
  if (id === "all") {
    return (
      <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  } else if (id.includes("milk")) {
    return (
      <svg className={`w-6 h-6 ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5C8.13 5 5 8.13 5 12c0 2.53 1.34 4.74 3.34 6h7.32C17.66 16.74 19 14.53 19 12c0-3.87-3.13-7-7-7z" />
        <path d="M8 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm8 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
        <path d="M12 15c-1.66 0-3-.54-3-1.2v-1.6c0-.66 1.34-1.2 3-1.2s3 .54 3 1.2v1.6c0 .66-1.34 1.2-3 1.2z" />
        <path d="M3 5c1 1 1 3 1 3m16-3c-1 1-1 3-1 3" />
      </svg>
    );
  } else if (id.includes("ghee")) {
    return (
      <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16a6 6 0 100-12c-2.4 3-6 4.8-6 8a6 6 0 006 6z" />
      </svg>
    );
  } else if (id.includes("farsan") || id.includes("namkeen")) {
    return (
      <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M5 12a7 7 0 0014 0" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 8c.5-1.5 2-2.5 4-2.5s3.5 1 4 2.5" />
      </svg>
    );
  } else if (id.includes("gulkand")) {
    return (
      <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="8" width="12" height="12" rx="2" />
        <path d="M9 8V5a1 1 0 011-1h4a1 1 0 011 1v3" strokeLinecap="round" />
        <circle cx="12" cy="14" r="2" />
      </svg>
    );
  } else if (id.includes("masala") || id.includes("spice")) {
    return (
      <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3v18M3 12h18m-3-6L6 18M6 6l12 12" strokeLinecap="round" />
      </svg>
    );
  } else {
    return (
      <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    );
  }
};

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get("category") || "all";
  const initialSearch = searchParams.get("search") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>(CATEGORIES.map(c => ({ ...c, slug: c.id })));

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(initialSearch);
  const [searchPillFilter, setSearchPillFilter] = useState<string>("all");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);

  const POPULAR_SEARCHES = [
    "Kesar Penda",
    "Kaju Katli",
    "Mohanthal",
    "Mari Gathiya",
    "Dry Kachori"
  ];

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mehta_recent_searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (e) {}
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    try {
      const existing = JSON.parse(localStorage.getItem("mehta_recent_searches") || "[]");
      const updated = [clean, ...existing.filter((item: string) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
      localStorage.setItem("mehta_recent_searches", JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (e) {}
  };

  // 250ms Debounce effect on searchQuery
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      if (searchQuery.trim()) {
        saveRecentSearch(searchQuery);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Instant Suggestions for Search Dropdown
  const searchSuggestions = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)).slice(0, 5);
  }, [products, searchQuery]);

  const [maxPrice, setMaxPrice] = useState(1500);
  const [selectedWeights, setSelectedWeights] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  // Loading indicators
  const [pageLoading, setPageLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);

  const { t } = useLanguage();

  const handleCategoryChange = (catSlug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (catSlug === "all") {
      params.delete("category");
    } else {
      params.set("category", catSlug);
    }
    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  // Ref on the products grid section for scroll-into-view on filter change
  const productsRef = useRef<HTMLDivElement>(null);

  // Ref to scroll product grid into view on category/filter change
  const productsGridRef = useRef<HTMLElement>(null);

  // Ref to track first load
  const isFirstRender = useRef(true);

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
          setCategories(sortCategories(cats));
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
    setSelectedWeights([]);
    setSelectedOccasions([]);
    setCurrentPage(1);
    setCategoryLoading(true);

    // Removed auto-scroll logic to prevent page jumping
  }, [searchParams]);

  // Removed auto-scroll on filter changes to prevent page jumping
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, [selectedCategory, searchQuery, sortBy, maxPrice, selectedWeights, selectedOccasions]);

  // Apply filters & sorting with loading feedback
  useEffect(() => {
    if (pageLoading) {
      setCategoryLoading(true);
      return;
    }

    setCategoryLoading(true);

    let result = [...products];

    // GLOBAL CATALOG SEARCH OVERRIDE (Requirements 1, 2, 13, 15)
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const name = (p.name || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const category = (p.category || "").toLowerCase();
        const badges = (p.badges || []).map(b => b.toLowerCase());
        
        // Direct matches across name, description, category, and badges
        if (name.includes(q) || desc.includes(q) || category.includes(q) || badges.some(b => b.includes(q))) {
          return true;
        }
        
        // Smart keyword maps
        if (q === 'namkeen') return category === 'farsan' || category.includes('namkeen');
        if (q === 'sweets' || q === 'sweet') return category.includes('sweet') || category.includes('penda') || category.includes('katli');
        if (q === 'farsan') return category === 'farsan' || category.includes('snack');
        if (q === 'khakhra') return category === 'khakhra';
        if (q === 'chikki') return category === 'chikki';
        if (q === 'gulkand') return category === 'gulkand';
        
        return false;
      });

      // Search Category Pill filter (Requirement 13)
      if (searchPillFilter !== "all") {
        result = result.filter(p => {
          if (!p.category) return false;
          const cat = String(p.category).toLowerCase();
          if (searchPillFilter === "sweets") return cat.includes("sweet") || cat.includes("milk") || cat.includes("ghee") || cat.includes("mawa");
          if (searchPillFilter === "farsan" || searchPillFilter === "namkeen" || searchPillFilter === "snacks") return cat.includes("farsan") || cat.includes("namkeen") || cat.includes("snack");
          return cat === searchPillFilter;
        });
      }
    } else {
      // Standard Category filter (active ONLY when search is empty)
      if (selectedCategory !== "all") {
        result = result.filter(p => {
           if (!p.category) return false;
           const cat = String(p.category).toLowerCase();
           if (selectedCategory === "milk-sweets" && (cat.includes("milk") || cat.includes("mawa"))) return true;
           if (selectedCategory === "ghee-sweets" && (cat.includes("ghee") || cat.includes("traditional"))) return true;
           if (selectedCategory === "farsan" && (cat.includes("farsan") || cat.includes("namkeen") || cat.includes("snacks"))) return true;
           return p.category === selectedCategory;
        });
      }
    }

    // Combined Weight & Price filter
    result = result.filter(p => {
      let matchesWeight = true;
      let matchingPrices: number[] = [];
      const priceKeys = Object.keys(p.prices || {});

      if (selectedWeights.length > 0) {
        matchesWeight = false;
        selectedWeights.forEach(w => {
          const target = w.toLowerCase().replace(/\s+/g, '');
          priceKeys.forEach(k => {
            const keyNorm = k.toLowerCase().replace(/\s+/g, '');
            let isMatch = false;

            if (target === '250g') isMatch = keyNorm.includes('250');
            else if (target === '500g') isMatch = keyNorm.includes('500');
            else if (target === '1kg') isMatch = keyNorm.includes('1k') || keyNorm.includes('1000') || (keyNorm.includes('1') && !keyNorm.includes('250') && !keyNorm.includes('500') && !keyNorm.includes('2.5') && !keyNorm.includes('25'));
            else isMatch = (keyNorm === target);

            if (isMatch) {
              matchesWeight = true;
              matchingPrices.push(p.prices[k]);
            }
          });
        });
      } else {
        // No weight filter selected, all variant prices are candidates
        matchingPrices = Object.values(p.prices || {});
      }

      if (!matchesWeight) return false;

      // Check if candidate variant price falls within maxPrice
      if (matchingPrices.length > 0) {
        const minCandidatePrice = Math.min(...matchingPrices);
        return minCandidatePrice <= maxPrice;
      }

      return false;
    });

    // Occasion filter
    if (selectedOccasions.length > 0) {
      result = result.filter(p => {
        return selectedOccasions.some(occ => {
          if (occ === 'Festive') return p.festivalSpecial;
          if (occ === 'Other') return p.category === 'gift-boxes' || p.name.toLowerCase().includes('box') || p.name.toLowerCase().includes('pack');
          if (occ === 'Everyday') return !p.festivalSpecial && p.category !== 'gift-boxes';
          return true;
        });
      });
    }

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
    } else {
      // Default / Relevance: sort by position (ascending), then name
      result.sort((a, b) => {
        const posA = typeof a.position === 'number' ? a.position : 0;
        const posB = typeof b.position === 'number' ? b.position : 0;
        if (posA !== posB) return posA - posB;
        return a.name.localeCompare(b.name);
      });
    }

    setFilteredProducts(result);
    setCurrentPage(1);

    // Smooth timeout to prevent flash of content
    const timer = setTimeout(() => {
      setCategoryLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [products, selectedCategory, searchQuery, debouncedSearchQuery, searchPillFilter, maxPrice, selectedWeights, selectedOccasions, sortBy, pageLoading]);

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

  const getCategoryCount = (catSlug: string) => {
    if (catSlug === "all") return products.length;
    return products.filter(p => p.category === catSlug).length;
  };

  const getCategoryIconSvg = (id: string, active: boolean) => {
    const color = active ? "text-[#D46D2D]" : "text-[#7E6B5A]";
    switch (id) {
      case "milk-sweets":
        return (
          <svg className={`w-4 h-4 ${color}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        );
      case "ghee-sweets":
        return (
          <svg className={`w-4 h-4 ${color}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3v1m0 16a6 6 0 100-12c-2.4 3-6 4.8-6 8a6 6 0 006 6z" />
          </svg>
        );
      case "farsan":
        return (
          <svg className={`w-4 h-4 ${color}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12h18M5 12a7 7 0 0014 0" />
          </svg>
        );
      case "gulkand":
        return (
          <svg className={`w-4 h-4 ${color}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="8" width="12" height="12" rx="2" />
            <path d="M9 8V5a1 1 0 011-1h4a1 1 0 011 1v3" />
          </svg>
        );
      case "masala":
        return (
          <svg className={`w-4 h-4 ${color}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3v18M3 12h18" />
          </svg>
        );
      default:
        return (
          <svg className={`w-4 h-4 ${color}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 11V7a4 4 0 00-8 0v4" strokeLinecap="round" />
            <rect x="4" y="11" width="16" height="10" rx="2" />
          </svg>
        );
    }
  };

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
            {t(banner.title)}
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
      <section className="py-10 bg-[#FAF9F6] overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ── 1. LEFT COLUMN: FILTERS (Desktop Only) ── */}
            <aside className="hidden lg:flex lg:col-span-2 flex-col gap-6 sticky top-28">
              <div className="bg-white border border-[#EAE0D3] rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center gap-2 border-b border-[#EAE0D3]/80 pb-3 mb-5">
                  <SlidersHorizontal className="h-4 w-4 text-[#D46D2D]" />
                  <h3 className="font-serif text-xs font-bold text-[#2A1E17] uppercase tracking-wider">
                    Filters
                  </h3>
                </div>

                {/* Price range selector */}
                <div className="mb-6">
                  <h4 className="text-[0.65rem] font-bold text-[#7E6B5A] uppercase tracking-wider mb-3">
                    Price Range
                  </h4>
                  <input
                    type="range"
                    min="50"
                    max="1500"
                    step="50"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#EAE0D3] rounded-lg appearance-none cursor-pointer accent-[#D46D2D]"
                  />
                  <div className="flex justify-between text-[11px] font-semibold text-[#2A1E17] mt-2">
                    <span>₹0</span>
                    <span>₹{maxPrice}</span>
                  </div>
                </div>

                {/* Weight selector checkboxes */}
                <div className="mb-6 border-t border-[#EAE0D3]/40 pt-4">
                  <h4 className="text-[0.65rem] font-bold text-[#7E6B5A] uppercase tracking-wider mb-3">
                    Weight
                  </h4>
                  <div className="flex flex-col gap-2">
                    {['250g', '500g', '1kg'].map((w) => {
                      const isChecked = selectedWeights.includes(w);
                      return (
                        <label key={w} className="flex items-center gap-2 text-xs text-[#2A1E17] cursor-pointer selection:bg-transparent">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedWeights(prev =>
                                prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]
                              );
                            }}
                            className="rounded border-[#EAE0D3] text-[#D46D2D] focus:ring-[#D46D2D] h-3.5 w-3.5 cursor-pointer"
                          />
                          <span>{w}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Occasions checkboxes */}
                <div className="mb-6 border-t border-[#EAE0D3]/40 pt-4">
                  <h4 className="text-[0.65rem] font-bold text-[#7E6B5A] uppercase tracking-wider mb-3">
                    Occasion
                  </h4>
                  <div className="flex flex-col gap-2">
                    {['Festive', 'Other', 'Everyday'].map((occ) => {
                      const isChecked = selectedOccasions.includes(occ);
                      return (
                        <label key={occ} className="flex items-center gap-2 text-xs text-[#2A1E17] cursor-pointer selection:bg-transparent">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedOccasions(prev =>
                                prev.includes(occ) ? prev.filter(x => x !== occ) : [...prev, occ]
                              );
                            }}
                            className="rounded border-[#EAE0D3] text-[#D46D2D] focus:ring-[#D46D2D] h-3.5 w-3.5 cursor-pointer"
                          />
                          <span>{occ}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Clear All button */}
                <button
                  onClick={() => {
                    setSelectedWeights([]);
                    setSelectedOccasions([]);
                    setMaxPrice(1500);
                  }}
                  className="w-full py-2.5 border border-[#EAE0D3] hover:border-[#D46D2D] rounded-xl text-[0.68rem] font-bold text-[#7E6B5A] hover:text-[#D46D2D] transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </aside>

            {/* ── 2. MIDDLE COLUMN: PRODUCTS LIST — spans 8 cols ── */}
            <main ref={productsGridRef} className="lg:col-span-8 flex flex-col gap-5 scroll-mt-28">

              {/* Breadcrumbs (Desktop Only) */}
              <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-[#7E6B5A] font-semibold uppercase tracking-wider mb-1">
                <Link href="/" className="hover:text-[#D46D2D]">Home</Link>
                <span>&gt;</span>
                <span className="hover:text-[#D46D2D] cursor-pointer">Shop Categories</span>
                <span>&gt;</span>
                <span className="text-[#D46D2D]">{selectedCategory === 'all' ? 'All Items' : (categories.find(c => c.slug === selectedCategory || c.id === selectedCategory)?.name || t('cat.' + selectedCategory))}</span>
              </div>

              {/* Category Page Title / Search Results Header (Requirements 2, 3) */}
              <div>
                {debouncedSearchQuery.trim() ? (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-brand-cream/30 p-4 sm:p-5 rounded-2xl border border-[#EAE0D3] shadow-2xs">
                    <div>
                      <h3 className="font-serif text-2xl font-extrabold text-[#2A1E17] flex items-center gap-2">
                        <span className="text-xl">🔍</span> Search Results
                      </h3>
                      <p className="text-xs font-semibold text-[#7E6B5A] mt-1">
                        {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found for "{debouncedSearchQuery}"
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setDebouncedSearchQuery("");
                        setSearchPillFilter("all");
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#EAE0D3] bg-white hover:bg-brand-cream text-xs font-bold text-brand-charcoal transition-all cursor-pointer shadow-3xs hover:border-[#D46D2D]"
                    >
                      ← Back to Category
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-serif text-2xl font-extrabold text-[#2A1E17]">
                      {selectedCategory === 'all' ? 'All Items' : (categories.find(c => c.slug === selectedCategory || c.id === selectedCategory)?.name || t('cat.' + selectedCategory))}{' '}
                      <span className="text-sm font-sans font-normal text-[#7E6B5A]">({filteredProducts.length} items)</span>
                    </h3>
                    <p className="text-[11px] text-[#7E6B5A] mt-1 leading-relaxed max-w-xl">
                      {selectedCategory === 'all'
                        ? 'Explore our premium selection of authentic sweets, savory farsan, and premium gift boxes. Prepared fresh and packaged with care since 1972.'
                        : banner.description
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* ── SEARCH CATEGORY PILLS (Requirement 13) ── */}
              {debouncedSearchQuery.trim() && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                  <span className="text-[10px] font-bold text-[#7E6B5A] uppercase tracking-wider whitespace-nowrap">
                    Filter Search:
                  </span>
                  {[
                    { id: "all", label: "All" },
                    { id: "sweets", label: "Sweets" },
                    { id: "farsan", label: "Farsan" },
                    { id: "namkeen", label: "Namkeen" },
                    { id: "snacks", label: "Snacks" }
                  ].map(pill => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setSearchPillFilter(pill.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                        searchPillFilter === pill.id
                          ? "bg-[#D46D2D] text-white border-[#D46D2D] shadow-xs font-extrabold"
                          : "bg-white text-brand-charcoal border-[#EAE0D3] hover:border-brand-gold hover:bg-brand-cream"
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              )}

              {/* ── MOBILE HORIZONTAL CATEGORY CARDS (matching Homepage Shop By Category) ── */}
              {!debouncedSearchQuery.trim() && (
                <div className="lg:hidden flex gap-3 overflow-x-auto scrollbar-none py-3 -mx-4 px-4 bg-white/50 backdrop-blur-xs">
                  {/* All Items Card */}
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("all")}
                    className={`w-24 flex flex-col items-center rounded-2xl p-3 border-2 transition-all duration-300 text-center shrink-0 cursor-pointer ${
                      selectedCategory === "all"
                        ? "bg-[#FAF6EE] border-[#C9A227] shadow-[0_4px_12px_rgba(201,162,39,0.15)] scale-102"
                        : "bg-white border-[#EAE0D3]/80 hover:border-[#D46D2D] shadow-[0_4px_12px_rgba(74,47,31,0.02)]"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-1.5 border border-[#EAE0D3]/60 shadow-xs">
                      <svg className="w-6 h-6 text-[#4A2F1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </div>
                    <span className="font-serif text-[10px] font-extrabold text-[#4A2F1F] tracking-wide whitespace-nowrap mt-1">
                      {t('category.all_items')}
                    </span>
                  </button>

                  {/* Categories Cards */}
                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat.slug;
                    const catImage = cat.image_url || getCategoryFallbackImage(cat.slug);
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => handleCategoryChange(cat.slug)}
                        className={`w-24 flex flex-col items-center rounded-2xl p-3 border-2 transition-all duration-300 text-center shrink-0 cursor-pointer ${
                          isActive
                            ? "bg-[#FAF6EE] border-[#C9A227] shadow-[0_4px_12px_rgba(201,162,39,0.15)] scale-102"
                            : "bg-white border-[#EAE0D3]/80 hover:border-[#D46D2D] shadow-[0_4px_12px_rgba(74,47,31,0.02)]"
                        }`}
                      >
                        <div className="relative w-14 h-14 rounded-full overflow-hidden mb-1.5 bg-[#FAF6EE] border border-[#EAE0D3]/40 shadow-xs flex items-center justify-center">
                          <img
                            src={catImage}
                            alt={cat.name || cat.slug}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-serif text-[10px] font-extrabold text-[#4A2F1F] tracking-wide line-clamp-1 mt-1">
                          {t(`cat.${cat.slug}`) || cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── STICKY FLOATING SEARCH TOOLBAR (Requirements 4, 5, 8, 10, 11, 12, 14) ── */}
              <div className="sticky top-16 sm:top-20 z-40 bg-white/95 backdrop-blur-md border border-[#EAE0D3]/80 rounded-2xl p-3 shadow-xs transition-all duration-300">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  
                  {/* Search input container */}
                  <div className="relative w-full">
                    <div className={`relative flex items-center border rounded-xl bg-white px-3.5 py-2 transition-all duration-300 ${
                      isSearchFocused ? 'border-[#D46D2D] ring-2 ring-[#D46D2D]/20 shadow-md w-full sm:max-w-xl' : 'border-[#EAE0D3] w-full sm:max-w-md'
                    }`}>
                      <Search className={`h-4 w-4 text-[#7E6B5A] mr-2 flex-shrink-0 transition-transform duration-300 ${isSearchFocused ? 'scale-110 text-[#D46D2D]' : ''}`} />
                      <input
                        type="text"
                        placeholder="Search sweets, farsan, gift boxes..."
                        value={searchQuery}
                        onFocus={() => setIsSearchFocused(true)}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs bg-transparent border-none outline-none text-[#2A1E17] font-medium"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setDebouncedSearchQuery("");
                          }}
                          className="p-1 rounded-full text-[#7E6B5A] hover:text-[#2A1E17] hover:bg-brand-cream transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Search suggestions & Popular/Recent Searches dropdown */}
                    <AnimatePresence>
                      {isSearchFocused && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setIsSearchFocused(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 right-0 sm:max-w-xl z-40 mt-2 bg-white rounded-2xl border border-[#EAE0D3] shadow-xl overflow-hidden p-4 flex flex-col gap-4"
                          >
                            {searchQuery.trim().length === 0 ? (
                              <div className="flex flex-col gap-4">
                                {/* Popular Searches (Requirement 11) */}
                                <div>
                                  <h4 className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                                    <span>🔥</span> Popular Searches
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {POPULAR_SEARCHES.map((term) => (
                                      <button
                                        key={term}
                                        type="button"
                                        onClick={() => {
                                          setSearchQuery(term);
                                          setDebouncedSearchQuery(term);
                                          saveRecentSearch(term);
                                          setIsSearchFocused(false);
                                        }}
                                        className="px-3 py-1.5 rounded-full border border-[#EAE0D3] bg-white text-xs font-bold text-brand-charcoal hover:border-[#D46D2D] hover:text-[#D46D2D] hover:bg-[#FAF6EE] transition-all cursor-pointer flex items-center gap-1"
                                      >
                                        <span className="text-amber-500">⭐</span> {term}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Recent Searches (Requirement 12) */}
                                {recentSearches.length > 0 && (
                                  <div className="border-t border-[#EAE0D3]/60 pt-3">
                                    <div className="flex justify-between items-center mb-2">
                                      <h4 className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" /> Recent Searches
                                      </h4>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          localStorage.removeItem("mehta_recent_searches");
                                          setRecentSearches([]);
                                        }}
                                        className="text-[0.62rem] text-brand-orange hover:underline font-bold"
                                      >
                                        Clear History
                                      </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {recentSearches.map((term, idx) => (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={() => {
                                            setSearchQuery(term);
                                            setDebouncedSearchQuery(term);
                                            setIsSearchFocused(false);
                                          }}
                                          className="px-3 py-1.5 rounded-lg bg-brand-cream/40 border border-[#EAE0D3] text-xs font-semibold text-brand-charcoal hover:border-brand-gold transition-all cursor-pointer flex items-center gap-1.5"
                                        >
                                          <Clock className="w-3 h-3 text-muted-foreground" /> {term}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Search Suggestions (Requirement 10) */
                              <div>
                                <h4 className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                                  Matching Suggestions ({searchSuggestions.length})
                                </h4>
                                {searchSuggestions.length === 0 ? (
                                  <p className="text-xs text-muted-foreground py-2">No direct product suggestions match your query.</p>
                                ) : (
                                  <div className="flex flex-col divide-y divide-[#EAE0D3]/50">
                                    {searchSuggestions.map((p) => (
                                      <div
                                        key={p.id}
                                        onClick={() => {
                                          setSearchQuery(p.name);
                                          setDebouncedSearchQuery(p.name);
                                          saveRecentSearch(p.name);
                                          setIsSearchFocused(false);
                                        }}
                                        className="py-2.5 px-2 hover:bg-[#FAF6EE] rounded-lg transition-colors cursor-pointer flex items-center justify-between"
                                      >
                                        <div className="flex items-center gap-3">
                                          <img src={img.thumbnail(p.images?.[0]) || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=100'} alt={p.name} className="w-8 h-8 object-cover rounded-md border border-[#EAE0D3]" />
                                          <div>
                                            <h5 className="text-xs font-bold text-brand-charcoal">
                                              <HighlightText text={p.name} query={searchQuery} />
                                            </h5>
                                            <span className="text-[0.65rem] text-muted-foreground capitalize">{p.category}</span>
                                          </div>
                                        </div>
                                        <span className="text-xs font-serif font-bold text-[#D46D2D]">
                                          ₹{Math.min(...Object.values(p.prices || { def: 0 }))}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {/* Mobile filter button */}
                    <button
                      onClick={() => setShowFiltersMobile(true)}
                      className="lg:hidden flex items-center gap-1.5 border border-[#EAE0D3] rounded-xl px-4 py-2 text-xs font-semibold hover:bg-brand-cream transition-colors text-brand-charcoal cursor-pointer"
                    >
                      <SlidersHorizontal className="h-4 w-4" /> Filters
                    </button>

                    {/* Sort selection */}
                    <div className="flex items-center border border-[#EAE0D3] rounded-xl px-3 py-1.5 bg-white">
                      <span className="text-[10px] font-bold text-[#7E6B5A] uppercase mr-1">Sort by:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="border-none outline-none text-xs font-bold bg-white text-[#2A1E17] cursor-pointer"
                      >
                        <option value="relevance">Relevance</option>
                        <option value="popular">Best Sellers</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid content — fade transition wrapper */}
              <div
                ref={productsRef}
                key={`grid-${selectedCategory}-${sortBy}-${debouncedSearchQuery}-${searchPillFilter}-${maxPrice}`}
                className="transition-opacity duration-300"
                style={{ scrollMarginTop: "7rem" }}
              >
                {categoryLoading || pageLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex flex-col items-center text-center w-full">
                        <div className="aspect-square w-full rounded-full bg-brand-beige/20 border border-brand-beige/40 flex items-center justify-center p-4 relative shadow-2xs overflow-hidden mb-4">
                          <div className="w-4/5 h-4/5 rounded-full bg-brand-cream/50"></div>
                        </div>
                        <div className="h-4 w-32 bg-brand-beige/30 rounded mb-2"></div>
                        <div className="h-3.5 w-20 bg-brand-orange/15 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : currentItems.length === 0 ? (
                  /* Premium Empty State Illustration (Requirement 7) */
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-[#EAE0D3] rounded-2xl p-8 shadow-xs my-4">
                    <div className="w-16 h-16 rounded-full bg-brand-cream flex items-center justify-center text-3xl mb-3 shadow-2xs border border-[#EAE0D3]">
                      🔍
                    </div>
                    <h3 className="font-serif text-lg font-bold text-brand-charcoal">No products found</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1.5 leading-relaxed">
                      Try checking for spelling errors, using simpler keywords, or clear search to browse full catalog.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setDebouncedSearchQuery("");
                        setSearchPillFilter("all");
                        handleCategoryChange("all");
                        setMaxPrice(1500);
                        setSelectedWeights([]);
                        setSelectedOccasions([]);
                      }}
                      className="mt-5 rounded-xl bg-[#D46D2D] px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-[#BF5E23] shadow-xs cursor-pointer"
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  /* Smooth Framer Motion Staggered Grid (Requirement 9) */
                  <motion.div
                    key={`${selectedCategory}-${currentPage}-${sortBy}-${debouncedSearchQuery}-${searchPillFilter}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                  >
                    {currentItems.map((p, index) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.04 }}
                        layout
                        className="w-full"
                      >
                        <ProductCard product={p} searchQuery={debouncedSearchQuery} activeWeights={selectedWeights} />
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
                    className="px-4 py-2.5 rounded-lg border border-brand-beige hover:border-brand-gold text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white text-brand-charcoal transition-all cursor-pointer"
                  >
                    Prev
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`min-w-[44px] h-11 rounded-lg text-xs font-bold transition-all border cursor-pointer ${currentPage === i + 1 ? "bg-[#D46D2D] border-[#D46D2D] text-white" : "border-brand-beige hover:border-brand-gold bg-white text-brand-charcoal hover:bg-brand-cream"}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="px-4 py-2.5 rounded-lg border border-brand-beige hover:border-brand-gold text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white text-brand-charcoal transition-all cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </main>

            {/* ── 3. RIGHT COLUMN: CATEGORIES & BANNER — spans 2 cols ── */}
            <aside className="hidden lg:flex lg:col-span-2 flex-col gap-6 sticky top-28">

              {/* Categories list */}
              <div className="bg-[#FAF8F5] border border-[#EAE0D3] rounded-2xl overflow-hidden shadow-2xs">
                <div className="bg-[#D46D2D] px-5 py-4">
                  <h3 className="font-serif text-[11px] font-bold text-white uppercase tracking-wider">
                    Product Categories
                  </h3>
                </div>

                <div className="flex flex-col py-1">
                  {/* All Items Row */}
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className={`flex items-center justify-between px-5 py-3 text-xs font-bold transition-all text-left border-b border-[#EAE0D3]/20 cursor-pointer ${selectedCategory === "all"
                      ? "bg-[#FAF5ED] text-[#D46D2D]"
                      : "text-[#2A1E17] hover:bg-[#FAF5ED]"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      </svg>
                      <span>All Items</span>
                    </div>
                    <span className="text-[9px] bg-[#EAE0D3]/50 text-[#7E6B5A] px-2 py-0.5 rounded-full font-bold">
                      {getCategoryCount("all")}
                    </span>
                  </button>

                  {/* Categories Rows */}
                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat.slug;
                    const catImage = cat.image_url || getCategoryFallbackImage(cat.slug);
                    return (
                      <button
                        key={cat.slug}
                        onClick={() => handleCategoryChange(cat.slug)}
                        className={`flex items-center justify-between px-5 py-3 text-xs font-bold transition-all text-left border-b border-[#EAE0D3]/20 cursor-pointer ${isActive
                          ? "bg-[#FAF5ED] text-[#D46D2D]"
                          : "text-[#2A1E17] hover:bg-[#FAF5ED]"
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-[#EAE0D3]/60 bg-[#FAF6EE]">
                            <img src={img.thumbnail(catImage)} alt={cat.name || cat.slug} className="w-full h-full object-cover" />
                          </div>
                          <span>{t(`cat.${cat.slug}`) || cat.name}</span>
                        </div>
                        <span className="text-[9px] bg-[#EAE0D3]/50 text-[#7E6B5A] px-2 py-0.5 rounded-full font-bold">
                          {getCategoryCount(cat.slug)}
                        </span>
                      </button>
                    );
                  })}

                  {/* View All Categories Link */}
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className="px-5 py-3 text-[10px] font-bold text-[#D46D2D] hover:text-[#BF5E23] transition-colors text-left flex items-center gap-1 cursor-pointer"
                  >
                    View All Categories →
                  </button>
                </div>
              </div>

              {/* Banner card */}
              <div
                className="relative rounded-2xl overflow-hidden bg-cover bg-center p-6 text-white min-h-[220px] flex flex-col justify-between shadow-2xs group"
                style={{ backgroundImage: `url('/shop_hero_banner.jpg')` }}
              >
                <div className="absolute inset-0 bg-[#2A1E17]/65 transition-colors group-hover:bg-[#2A1E17]/55" />
                <div className="relative z-10 flex flex-col gap-1.5">
                  <h4 className="font-serif text-lg font-bold leading-tight">Pure Ghee Delights</h4>
                  <p className="text-[10px] text-brand-cream/80 max-w-[150px]">Made with 100% premium cow ghee & love</p>
                </div>
                <div className="relative z-10 mt-6">
                  <Link
                    href="/shop?category=ghee-sweets"
                    className="inline-block bg-[#D4AF37] hover:bg-[#B89324] text-[#2A1E17] font-bold text-[10px] px-4 py-2.5 rounded-lg uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Explore Ghee Sweets →
                  </Link>
                </div>
              </div>

              {/* Badges Box */}
              <div className="bg-white border border-[#EAE0D3] rounded-2xl p-4.5 flex flex-col gap-3.5 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[#D46D2D]/8 flex items-center justify-center text-[#D46D2D]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-bold text-[#2A1E17]">Freshly Made</span>
                    <span className="text-[9px] text-[#7E6B5A]">Every Day</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[#D46D2D]/8 flex items-center justify-center text-[#D46D2D]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-bold text-[#2A1E17]">Hygienically Packed</span>
                    <span className="text-[9px] text-[#7E6B5A]">With Care</span>
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
                        onClick={() => { handleCategoryChange(cat.slug); }}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${selectedCategory === cat.slug
                          ? "bg-[#D46D2D] text-white border-[#D46D2D]"
                          : "bg-white text-[#2A1E17] border-[#EAE0D3]"
                          }`}
                      >
                        {cat.slug === "all" ? t('category.all_items') : t(`cat.${cat.slug}`)}
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

                {/* Weight selection */}
                <div>
                  <h4 className="text-[0.65rem] font-bold text-[#7E6B5A] uppercase tracking-widest mb-3">Weight</h4>
                  <div className="flex flex-wrap gap-2">
                    {['250g', '500g', '1kg'].map((w) => {
                      const isChecked = selectedWeights.includes(w);
                      return (
                        <button
                          key={w}
                          onClick={() => {
                            setSelectedWeights(prev =>
                              prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]
                            );
                          }}
                          className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${isChecked
                            ? "bg-[#D46D2D] text-white border-[#D46D2D]"
                            : "bg-white text-[#2A1E17] border-[#EAE0D3]"
                            }`}
                        >
                          {w}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Occasion selection */}
                <div>
                  <h4 className="text-[0.65rem] font-bold text-[#7E6B5A] uppercase tracking-widest mb-3">Occasion</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Festive', 'Other', 'Everyday'].map((occ) => {
                      const isChecked = selectedOccasions.includes(occ);
                      return (
                        <button
                          key={occ}
                          onClick={() => {
                            setSelectedOccasions(prev =>
                              prev.includes(occ) ? prev.filter(x => x !== occ) : [...prev, occ]
                            );
                          }}
                          className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${isChecked
                            ? "bg-[#D46D2D] text-white border-[#D46D2D]"
                            : "bg-white text-[#2A1E17] border-[#EAE0D3]"
                            }`}
                        >
                          {occ}
                        </button>
                      );
                    })}
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

      {/* --- BOTTOM TRUST BADGES BAR --- */}
      <section className="bg-white border-t border-[#EAE0D3] py-8 select-none">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-center">

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#FAF5ED] flex items-center justify-center text-[#D4AF37] flex-shrink-0">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16a6 6 0 100-12c-2.4 3-6 4.8-6 8a6 6 0 006 6z" />
                </svg>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-bold text-[#2A1E17] uppercase tracking-wider">100% Desi Cow Ghee</span>
                <span className="text-[10px] text-[#7E6B5A]">No compromise on quality</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#FAF5ED] flex items-center justify-center text-[#D4AF37] flex-shrink-0">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-bold text-[#2A1E17] uppercase tracking-wider">Freshly Made</span>
                <span className="text-[10px] text-[#7E6B5A]">Made in small batches</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#FAF5ED] flex items-center justify-center text-[#D4AF37] flex-shrink-0">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-bold text-[#2A1E17] uppercase tracking-wider">Hygienically Packed</span>
                <span className="text-[10px] text-[#7E6B5A]">Safe & premium packaging</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#FAF5ED] flex items-center justify-center text-[#D4AF37] flex-shrink-0">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V14a1 1 0 01-1 1h-1m-5.333-7H17M15 16h1a1 1 0 001-1v-4a1 1 0 00-1-1h-2" />
                </svg>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-bold text-[#2A1E17] uppercase tracking-wider">Pan India Delivery</span>
                <span className="text-[10px] text-[#7E6B5A]">Fast & reliable delivery</span>
              </div>
            </div>

          </div>
        </div>
      </section>

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
