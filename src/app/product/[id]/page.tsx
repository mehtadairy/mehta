"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { Product } from "@/lib/types";
import { fetchProducts } from "@/lib/supabaseClient";
import { Heart, Check, Plus, Minus, Star, Leaf, ShieldCheck, ChevronDown, ArrowLeft, Phone, Info, AlertTriangle, Sparkles, Calendar, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

const getIngredients = (name: string, category: string) => {
  const n = name.toLowerCase();
  if (n.includes("kaju")) {
    return "Cashew Nut, Pharma Grade Sugar, 100 % vegetarian Silver Leaf(Varakh)";
  }
  if (n.includes("penda") || n.includes("peda")) {
    return "Milk Solids (Khoya), Sugar, Cardamom, Saffron Threads";
  }
  if (n.includes("ladu") || n.includes("laddoo")) {
    return "Gram Flour (Besan), Pure Cow Ghee, Sugar, Cardamom, Almonds, Pistachios";
  }
  if (n.includes("barfi")) {
    return "Milk Solids (Khoya), Sugar, Cardamom, Rose Water, Pistachios";
  }
  if (category === "milk-sweets" || category === "ghee-sweets") {
    return "Milk Solids (Khoya), Pure Cow Ghee, Sugar, Cardamom, Dry Fruits";
  }
  return "Gram Flour, Pure Edible Oil, Iodized Salt, Black Pepper, Spices and Condiments";
};

const INGREDIENTS_MAP: { [key: string]: { name: string; icon: React.ReactNode } } = {
  dryfruits: {
    name: "Dry Fruits",
    icon: (
      <svg className="w-7 h-7 text-brand-gold mb-1" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 38 C 14 30, 20 22, 28 24 C 34 25, 36 32, 30 38 C 24 44, 18 42, 16 38 Z" />
        <path d="M36 28 C 42 22, 50 26, 48 34 C 46 40, 38 42, 34 36 C 30 32, 32 30, 36 28 Z" />
        <path d="M22 32 L 26 30 M 40 32 L 44 34" />
      </svg>
    )
  },
  garlic: {
    name: "Garlic",
    icon: (
      <svg className="w-7 h-7 text-brand-gold mb-1" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 12 C 26 22, 16 28, 16 42 C 16 50, 23 54, 32 54 C 41 54, 48 50, 48 42 C 48 28, 38 22, 32 12 Z" />
        <path d="M32 12 C 32 25, 26 38, 26 54 M 32 12 C 32 25, 38 38, 38 54 M 20 44 C 24 48, 28 50, 32 50 C 36 50, 40 48, 44 44" />
      </svg>
    )
  },
  gramflour: {
    name: "Gram Flour",
    icon: (
      <svg className="w-7 h-7 text-brand-gold mb-1" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 30 C 12 18, 52 18, 52 30 C 52 46, 42 52, 32 52 C 22 52, 12 46, 12 30 Z" />
        <path d="M16 30 C 22 22, 42 22, 48 30" />
        <circle cx="28" cy="26" r="0.5" fill="currentColor" />
        <circle cx="34" cy="24" r="0.5" fill="currentColor" />
        <circle cx="30" cy="28" r="0.5" fill="currentColor" />
      </svg>
    )
  },
  groundnutoil: {
    name: "Groundnut Oil",
    icon: (
      <svg className="w-7 h-7 text-brand-gold mb-1" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 16 L 40 16 L 38 24 L 46 32 L 46 54 L 18 54 L 18 32 L 26 24 Z" />
        <rect x="26" y="10" width="12" height="6" rx="1" />
        <path d="M22 36 L 42 36 M 22 44 L 42 44" />
        <path d="M32 38 C 30 40, 30 43, 32 45 C 34 43, 34 40, 32 38 Z" fill="currentColor" />
      </svg>
    )
  },
  iodisedsalt: {
    name: "Iodised Salt",
    icon: (
      <svg className="w-7 h-7 text-brand-gold mb-1" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 24 L 42 24 L 40 54 L 24 54 Z" />
        <path d="M24 24 L 26 14 L 38 14 L 40 24" />
        <circle cx="30" cy="18" r="0.5" fill="currentColor" />
        <circle cx="32" cy="16" r="0.5" fill="currentColor" />
        <circle cx="34" cy="18" r="0.5" fill="currentColor" />
        <rect x="26" y="34" width="12" height="12" rx="1" />
        <path d="M28 40 L 36 40" />
      </svg>
    )
  },
  wheatflour: {
    name: "Wheat Flour",
    icon: (
      <svg className="w-7 h-7 text-brand-gold mb-1" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 24 C 18 18, 46 18, 46 24 C 48 38, 44 54, 32 54 C 20 54, 16 38, 18 24 Z" />
        <path d="M16 26 Q 32 30 48 26" />
        <path d="M32 32 L 32 46 M 28 36 L 32 38 L 36 36 M 28 40 L 32 42 L 36 40" />
      </svg>
    )
  },
  whiteflour: {
    name: "White Flour",
    icon: (
      <svg className="w-7 h-7 text-brand-gold mb-1" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 24 C 18 18, 46 18, 46 24 C 48 38, 44 54, 32 54 C 20 54, 16 38, 18 24 Z" strokeDasharray="3 3" />
        <path d="M18 24 C 18 18, 46 18, 46 24 C 48 38, 44 54, 32 54 C 20 54, 16 38, 18 24 Z" fill="none" />
        <path d="M16 26 Q 32 30 48 26" />
        <path d="M26 34 L 38 42 M 38 34 L 26 42" />
      </svg>
    )
  }
};

const getPiecesText = (name: string, weight: string) => {
  const n = name.toLowerCase();
  if (n.includes("katri") || n.includes("katli") || n.includes("roll")) {
    return weight === "1kg" ? "80 PIECES" : weight === "500g" ? "40 PIECES" : "20 PIECES";
  }
  if (
    n.includes("penda") || 
    n.includes("peda") || 
    n.includes("ladu") || 
    n.includes("laddoo") || 
    n.includes("barfi") || 
    n.includes("halvo") || 
    n.includes("kalakand") || 
    n.includes("jambu") || 
    n.includes("sata") || 
    n.includes("mohanthal")
  ) {
    return weight === "1kg" ? "36 PIECES" : weight === "500g" ? "18 PIECES" : "9 PIECES";
  }
  return weight === "1kg" ? "FAMILY PACK" : weight === "500g" ? "STANDARD PACK" : "TRIAL PACK";
};

export default function ProductDetails() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedWeight, setSelectedWeight] = useState("");
  const [quantity, setQuantity] = useState(1);
  // Loading state for product fetch
  const [loading, setLoading] = useState(true);
  
  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Add to cart feedback
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      const allProducts = await fetchProducts();
      const found = allProducts.find(p => p.id === productId);
      
      if (found) {
        setProduct(found);
        setSelectedWeight(Object.keys(found.prices)[0]);
        setQuantity(1);
        
        // Load related items (same category, excluding current)
        const related = allProducts
          .filter(p => p.category === found.category && p.id !== found.id)
          .slice(0, 4);
        setRelatedProducts(related);

        // Wishlist check
        const wishlist = JSON.parse(localStorage.getItem("mehta_wishlist") || "[]");
        setIsWishlisted(wishlist.includes(found.id));
      }
      // Loading finished irrespective of result
      setLoading(false);
    };
    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="h-96 flex flex-col items-center justify-center text-center gap-4">
          {/* Skeleton placeholders */}
          <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <p className="mt-2 text-sm text-muted-foreground">Loading product...</p>
        </div>
        <Footer />
      </>
    );
  }
  if (!product) {
    return (
      <>
        <Header />
        <div className="h-96 flex flex-col items-center justify-center text-center">
          <h3 className="font-serif text-xl font-bold text-brand-charcoal mb-2">Product Not Found</h3>
          <p className="text-xs text-muted-foreground mb-4">The sweet plate you are looking for does not exist or has been deleted.</p>
          <button onClick={() => router.push("/shop")} className="rounded-lg bg-brand-orange px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-orange-hover">
            Back to Shop
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const price = product.prices[selectedWeight] || Object.values(product.prices)[0];
  const productLife = product.category === "farsan" ? "30 Days" : "12 Days";

  const handleAddToCart = () => {
    if (typeof window === "undefined") return;

    const storedCart = localStorage.getItem("mehta_cart");
    const cart = storedCart ? JSON.parse(storedCart) : [];

    const existingIndex = cart.findIndex(
      (item: any) => item.productId === product.id && item.weight === selectedWeight
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        productId: product.id,
        productName: product.name,
        image: product.images[0],
        weight: selectedWeight,
        price: price,
        quantity: quantity,
      });
    }

    localStorage.setItem("mehta_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    
    // Add success feedback
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleToggleWishlist = () => {
    if (typeof window === "undefined") return;

    const wishlist = JSON.parse(localStorage.getItem("mehta_wishlist") || "[]");
    let updated = [];

    if (wishlist.includes(product.id)) {
      updated = wishlist.filter((id: string) => id !== product.id);
      setIsWishlisted(false);
    } else {
      updated = [...wishlist, product.id];
      setIsWishlisted(true);
    }

    localStorage.setItem("mehta_wishlist", JSON.stringify(updated));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `Check out this delicious sweet: ${product.name} from Mehta Sweet Mart!`;

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };
  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
  };
  const shareOnPinterest = () => {
    window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}`, "_blank");
  };
  const shareOnWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6 } }}
      className="min-h-screen flex flex-col"
    >
      <Header />
      <WhatsAppFloat />

      {/* --- TITLE & BREADCRUMBS HEADER --- */}
      <div className="bg-[#fdfaf2] border-y border-[#e8dcc4] py-8 mt-20 sm:mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-charcoal uppercase tracking-wide">
            {product.name}
          </h1>
          <div className="text-xs text-muted-foreground font-sans flex items-center gap-1">
            <span className="hover:text-brand-orange cursor-pointer transition-colors" onClick={() => router.push("/")}>Home</span>
            <span>/</span>
            <span className="hover:text-brand-orange cursor-pointer transition-colors" onClick={() => router.push(`/shop?category=${product.category}`)}>
              {product.category === "milk-sweets" ? "Milk Sweets" : product.category === "ghee-sweets" ? "Ghee Sweets" : "Farsan"}
            </span>
            <span>/</span>
            <span className="text-brand-charcoal font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      {/* --- PRODUCT PROFILE DETAILS --- */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 items-start">
            
            {/* Left Column: Image Platter */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 90, damping: 15 }}
              className="md:col-span-5 flex flex-col gap-4"
            >
              <div className="aspect-square w-full rounded-full border border-brand-beige overflow-hidden bg-brand-cream shadow-xs p-8 flex items-center justify-center relative group">
                <img 
                  src={product.images[0]} 
                  alt={product.name} 
                  className="max-h-full max-w-full object-contain rounded-full transition-all duration-700 group-hover:scale-105 group-hover:animate-[spin_20s_linear_infinite]"
                />
              </div>
            </motion.div>

            {/* Right Column: Details & Variants */}
            <div className="md:col-span-7 flex flex-col gap-5">
              
              {/* Product Title and Category */}
              <div>
                <span className="text-[0.68rem] font-bold text-brand-gold uppercase tracking-widest mb-1.5 block">
                  {product.category === "milk-sweets" ? "Sweets of Pure Milk" : product.category === "ghee-sweets" ? "Sweets of Pure Ghee" : "Tasty & Chat-Patta Farsan"}
                </span>
                <h2 className="font-serif text-3xl font-bold text-brand-charcoal mb-2">
                  {product.name}
                </h2>
              </div>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 pb-2">
                <span className="font-sans text-3xl font-extrabold text-brand-orange">
                  ₹{price.toFixed(2)}
                </span>
                <span className="font-sans text-lg text-muted-foreground line-through font-medium">
                  ₹{(price * 1.15).toFixed(2)}
                </span>
                <span className="text-[0.68rem] font-bold text-brand-charcoal uppercase bg-[#fdfaf2] px-3 py-1 rounded-full border border-[#e8dcc4] ml-auto">
                  Product Life: {productLife}
                </span>
              </div>

              {/* Selector */}
              <div>
                <span className="text-xs font-bold text-brand-charcoal uppercase block mb-3 tracking-wider">
                  Select Packing :
                </span>
                <div className="flex flex-wrap gap-3">
                  {Object.keys(product.prices).map((w) => {
                    const wPrice = product.prices[w];
                    const labelWeight = w === "1kg" ? "1 KG" : w === "500g" ? "500 GM" : "250 GM";
                    const pieces = getPiecesText(product.name, w);
                    return (
                      <motion.button
                        key={w}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedWeight(w)}
                        className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-xl border text-xs relative overflow-hidden transition-all duration-200 min-w-[90px] ${
                          selectedWeight === w
                            ? "border-brand-orange bg-brand-orange/5 text-brand-orange"
                            : "border-brand-beige hover:border-brand-orange bg-white text-brand-charcoal"
                        }`}
                      >
                        {selectedWeight === w && (
                          <motion.span 
                            layoutId="activeWeightGlow"
                            className="absolute inset-0 bg-brand-orange/2 pointer-events-none"
                            transition={{ type: "spring", stiffness: 150, damping: 20 }}
                          />
                        )}
                        <span className="font-semibold relative z-10">{labelWeight} ( ₹{wPrice.toFixed(2)} )</span>
                        <span className="text-[0.62rem] text-muted-foreground font-normal mt-0.5 tracking-wider relative z-10">{pieces}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Stepper & Add to Cart & Buy Now Wrapper */}
              <div className="flex flex-col gap-3.5 py-4 border-t border-brand-beige">
                
                {/* Qty Row */}
                <div className="flex items-center">
                  <span className="text-xs font-bold text-brand-charcoal mr-3 uppercase tracking-wider">Qty :</span>
                  <div className="flex items-center border border-brand-beige rounded-lg overflow-hidden bg-brand-cream/35">
                    <motion.button 
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-3 py-1.5 text-brand-charcoal font-bold hover:bg-brand-cream transition-colors flex items-center justify-center"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </motion.button>
                    <span className="px-4 text-xs font-bold text-brand-charcoal min-w-[24px] text-center">
                      {quantity}
                    </span>
                    <motion.button 
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setQuantity(q => q + 1)}
                      className="px-3 py-1.5 text-brand-charcoal font-bold hover:bg-brand-cream transition-colors flex items-center justify-center"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>

                <div className="border-t border-brand-beige/60 my-1"></div>

                {/* ADD TO CART */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleAddToCart}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-lg py-3.5 text-xs font-bold text-white shadow-sm transition-all uppercase tracking-wider cursor-pointer ${
                    addedFeedback 
                      ? "bg-emerald-600 hover:bg-emerald-700" 
                      : "bg-brand-orange hover:bg-brand-orange-hover"
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" /> {addedFeedback ? "Added!" : "Add to Cart"}
                </motion.button>

                {/* BUY NOW */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    handleAddToCart();
                    router.push("/checkout");
                  }}
                  className="w-full inline-flex items-center justify-center rounded-lg border border-brand-orange py-3.5 text-xs font-bold text-brand-orange bg-white shadow-sm transition-all uppercase tracking-wider cursor-pointer hover:bg-brand-orange/5"
                >
                  Buy Now
                </motion.button>

              </div>

              {/* --- NEW FOOD PRODUCT INFORMATION PANEL --- */}
              <div className="border-t border-brand-beige pt-6 flex flex-col gap-5">
                
                {/* Product Highlights Feature Cards */}
                {product.highlights && product.highlights.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {product.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 bg-[#fdfaf2] border border-[#e8dcc4] rounded-xl p-3 shadow-3xs">
                        <Sparkles className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                        <span className="text-[0.7rem] font-bold text-brand-charcoal leading-tight">{highlight}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dietary Tags badges */}
                {product.dietaryTags && product.dietaryTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.dietaryTags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 bg-brand-cream text-brand-charcoal border border-[#e8dcc4] rounded-full px-3 py-1 text-[0.62rem] font-bold shadow-3xs uppercase tracking-wider">
                        <Leaf className="w-3 h-3 text-[#d4af37]" /> {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Allergen Warning badges */}
                {product.allergens && product.allergens.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.allergens.map((allergen, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-2.5 py-1 text-[0.65rem] font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> {allergen}
                      </span>
                    ))}
                  </div>
                )}

                {/* Shelf Life & Storage Instructions Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 bg-white border border-[#e8dcc4] p-3.5 rounded-xl shadow-3xs">
                    <Calendar className="w-5 h-5 text-brand-orange mt-0.5" />
                    <div>
                      <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wide block">🕒 Shelf Life</span>
                      <span className="text-xs font-bold text-brand-charcoal">{product.shelfLife || 12} Days</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white border border-[#e8dcc4] p-3.5 rounded-xl shadow-3xs">
                    <Info className="w-5 h-5 text-brand-orange mt-0.5" />
                    <div>
                      <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wide block">Storage Instructions</span>
                      <span className="text-[0.7rem] font-semibold text-brand-charcoal leading-snug">{product.storageInstructions || "Store in a cool and dry place."}</span>
                    </div>
                  </div>
                </div>

                {/* Ingredients section */}
                <div className="bg-[#fdfaf2] border border-[#e8dcc4] rounded-xl p-4.5 shadow-3xs">
                  <span className="text-xs font-bold text-brand-charcoal uppercase tracking-wider block mb-3">Ingredients Details :</span>
                  {product.ingredients && product.ingredients.length > 0 ? (
                    <div className="flex flex-wrap gap-3.5 mb-3">
                      {product.ingredients.map((ingName, idx) => {
                        const lowerName = ingName.toLowerCase();
                        let emoji = "🥛";
                        if (lowerName.includes("cashew") || lowerName.includes("kaju") || lowerName.includes("nut") || lowerName.includes("almond") || lowerName.includes("pistachio")) emoji = "🥜";
                        else if (lowerName.includes("sugar")) emoji = "🍬";
                        else if (lowerName.includes("cardamom") || lowerName.includes("elaichi")) emoji = "🌱";
                        else if (lowerName.includes("saffron") || lowerName.includes("kesar")) emoji = "🍂";
                        else if (lowerName.includes("besan") || lowerName.includes("flour") || lowerName.includes("wheat")) emoji = "🌾";
                        else if (lowerName.includes("silver") || lowerName.includes("varakh")) emoji = "✨";
                        else if (lowerName.includes("ghee") || lowerName.includes("oil")) emoji = "🛢️";
                        else if (lowerName.includes("salt")) emoji = "🧂";
                        else if (lowerName.includes("coconut")) emoji = "🥥";
                        else if (lowerName.includes("banana")) emoji = "🍌";
                        else if (lowerName.includes("honey")) emoji = "🍯";

                        return (
                          <div key={idx} className="flex flex-col items-center justify-center p-2 border border-[#e8dcc4] bg-white rounded-lg text-center w-16 h-16 shadow-4xs">
                            <span className="text-xl mb-0.5">{emoji}</span>
                            <span className="text-[0.55rem] font-bold text-brand-charcoal leading-none line-clamp-2">{ingName}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic mb-2">No ingredients specified.</div>
                  )}
                  
                  {/* Detailed list view */}
                  <div className="flex items-start text-xs text-muted-foreground gap-1.5 leading-relaxed border-t border-[#e8dcc4] pt-2.5">
                    <span className="text-[#0a4d8c] font-bold text-[0.65rem] mt-0.5">▶</span>
                    <span>
                      {product.ingredients && product.ingredients.length > 0 
                        ? product.ingredients.join(", ") 
                        : getIngredients(product.name, product.category)}
                    </span>
                  </div>
                </div>

              </div>

              {/* Shipping/Delivery Terms */}
              <div className="border-t border-brand-beige pt-4">
                <span className="text-xs font-bold text-brand-charcoal block mb-2">Terms :</span>
                <div className="flex items-start text-[0.7rem] text-muted-foreground gap-1.5 leading-relaxed">
                  <span className="text-[#0a4d8c] font-bold text-[0.65rem] mt-0.5">▶</span>
                  <span>
                    Prices are Inclusive of Taxes & Exclusive of Shipping Charges. Make Sure it takes 3 to 4 Days to Reach the Delivery Address after Dispatching Your Order. It depends on the State, City & Location of your Delivery Address.
                  </span>
                </div>
              </div>

              {/* Share and Wishlist Panel */}
              <div className="border-t border-brand-beige pt-4 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-charcoal">Share:</span>
                  <div className="flex gap-1.5">
                    <button onClick={shareOnTwitter} className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center text-[0.68rem] hover:opacity-80 font-sans font-bold cursor-pointer" title="Share on X (Twitter)">𝕏</button>
                    <button onClick={shareOnFacebook} className="w-7 h-7 bg-[#3b5998] text-white rounded-full flex items-center justify-center text-[0.68rem] hover:opacity-80 font-bold cursor-pointer" title="Share on Facebook">f</button>
                    <button onClick={shareOnPinterest} className="w-7 h-7 bg-[#bd081c] text-white rounded-full flex items-center justify-center text-[0.68rem] hover:opacity-80 font-bold cursor-pointer" title="Share on Pinterest">p</button>
                    <button onClick={shareOnWhatsApp} className="w-7 h-7 bg-[#25d366] text-white rounded-full flex items-center justify-center text-[0.68rem] hover:opacity-80 font-bold cursor-pointer" title="Share on WhatsApp">w</button>
                  </div>
                </div>

                <button
                  onClick={handleToggleWishlist}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold transition-all border px-4 py-1.5 rounded-full hover:bg-brand-cream ${
                    isWishlisted 
                      ? "text-red-500 bg-red-50/20 border-red-200" 
                      : "text-muted-foreground border-brand-beige"
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                  <span>{isWishlisted ? "Wishlisted" : "Add to Wishlist"}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* --- DESCRIPTION PANEL --- */}
      <section className="py-12 bg-[#fbfbfb] border-t border-brand-beige">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-4 uppercase tracking-wider">
            Product Description
          </h3>
          <div className="bg-white border border-brand-beige rounded-2xl p-6 md:p-8 shadow-2xs">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-brand-charcoal">
              <div className="flex items-center gap-2">
                <span className="text-[#d4af37] font-bold">✔</span> 100% Vegetarian Sweets & Snacks
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#d4af37] font-bold">✔</span> Prepared in Fully Hygienic Facilities
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#d4af37] font-bold">✔</span> Rich Traditional Heritage Recipes since 1952
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#d4af37] font-bold">✔</span> Premium Quality Sourced Ingredients
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- YOU MAY ALSO LIKE RELATED PRODUCTS --- */}
      {relatedProducts.length > 0 && (
        <section className="py-20 bg-white border-t border-brand-beige">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-brand-charcoal text-center mb-4">
              You May Also Like
            </h3>
            <div className="h-0.5 w-16 bg-brand-gold mx-auto mb-16"></div>
            
            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.08 } }
              }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center"
            >
              {relatedProducts.map((p) => {
                const firstWeight = Object.keys(p.prices)[0];
                const firstPrice = p.prices[firstWeight];
                const labelWeight = firstWeight === "1kg" ? "1 KG" : firstWeight === "500g" ? "500 GM" : "250 GM";
                return (
                  <motion.div 
                    key={p.id} 
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
                    }}
                    className="w-full flex flex-col items-center"
                  >
                    <Link href={`/product/${p.id}`} className="group flex flex-col items-center text-center">
                      <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-white border border-brand-beige flex items-center justify-center p-4 relative shadow-2xs overflow-hidden mb-4 transition-transform duration-500 group-hover:scale-105">
                        <img 
                          src={p.images[0]} 
                          alt={p.name} 
                          className="max-h-full max-w-full object-contain rounded-full transition-all duration-700 group-hover:animate-[spin_12s_linear_infinite]"
                        />
                      </div>
                      
                      <h4 className="font-serif text-xs sm:text-sm font-bold text-brand-charcoal hover:text-[#0a4d8c] transition-colors leading-tight mb-1 line-clamp-1 max-w-[180px]">
                        {p.name}
                      </h4>
                      
                      <span className="text-xs font-bold text-[#0a4d8c]">
                        ₹{firstPrice.toFixed(2)} - {labelWeight}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      )}

      <Footer />
    </motion.div>
  );
}
