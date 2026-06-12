"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getProducts, Product } from "@/lib/mockData";
import { Heart, Check, Plus, Minus } from "lucide-react";
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
  if (category === "traditional") {
    return "Milk Solids (Khoya), Pure Cow Ghee, Sugar, Cardamom, Dry Fruits";
  }
  return "Gram Flour, Pure Edible Oil, Iodized Salt, Black Pepper, Spices and Condiments";
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
  
  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Add to cart feedback
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    const allProducts = getProducts();
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
  }, [productId]);

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
  const productLife = product.category === "traditional" ? "12 Days" : "30 Days";

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

  return (
    <>
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
              {product.category === "traditional" ? "Sweets" : "Namkeen"}
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
                  {product.category === "traditional" ? "Traditional Specialty" : "Premium Farsan & Namkeen"}
                </span>
                <h2 className="font-serif text-3xl font-bold text-brand-charcoal mb-2">
                  {product.name}
                </h2>
              </div>

              {/* Price Row */}
              <div className="flex items-center gap-4 border-b border-brand-beige pb-4">
                <span className="font-serif text-3xl font-extrabold text-[#1abc9c]">
                  ₹{price.toFixed(2)}
                </span>
                <span className="text-[0.68rem] font-bold text-brand-charcoal uppercase bg-[#fdfaf2] px-3 py-1 rounded-full border border-[#e8dcc4]">
                  Product Life: {productLife}
                </span>
                <div className="ml-auto text-[#0a4d8c]" title="Premium Traditional Recipe">
                  <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
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
                        className={`border px-4 py-2.5 text-xs font-bold transition-all text-left flex flex-col min-w-[150px] rounded-lg relative overflow-hidden ${
                          selectedWeight === w
                            ? "border-[#1abc9c] bg-[#1abc9c]/5 text-[#1abc9c]"
                            : "border-[#e0e0e0] hover:border-[#1abc9c] bg-white text-brand-charcoal"
                        }`}
                      >
                        {selectedWeight === w && (
                          <motion.span 
                            layoutId="activeWeightGlow"
                            className="absolute inset-0 bg-[#1abc9c]/2 pointer-events-none"
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

              {/* Quantity Stepper & Add to Cart */}
              <div className="flex flex-wrap items-center gap-4 py-4 border-t border-brand-beige">
                <div className="flex items-center">
                  <span className="text-xs font-bold text-brand-charcoal mr-3">Qty :</span>
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

                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 4px 12px rgba(26, 188, 156, 0.3)" }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleAddToCart}
                  className={`flex-grow sm:flex-grow-0 rounded-lg px-8 py-3 text-xs font-bold text-white shadow-md transition-all uppercase tracking-wider ${
                    addedFeedback 
                      ? "bg-emerald-600 hover:bg-emerald-700" 
                      : "bg-[#1abc9c] hover:bg-[#16a085]"
                  }`}
                >
                  {addedFeedback ? "Added to Cart!" : "Add to Cart"}
                </motion.button>
              </div>

              {/* Ingredients Details */}
              <div className="border-t border-brand-beige pt-4">
                <span className="text-xs font-bold text-brand-charcoal block mb-3">Ingredients :</span>
                <div className="flex gap-4 mb-3">
                  <div className="flex flex-col items-center p-2.5 border border-[#e8dcc4] bg-[#fdfaf2] rounded-lg text-center w-20 shadow-2xs">
                    <svg className="w-6 h-6 text-brand-gold mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[0.62rem] font-bold text-brand-charcoal leading-none">Purity</span>
                  </div>
                  <div className="flex flex-col items-center p-2.5 border border-[#e8dcc4] bg-[#fdfaf2] rounded-lg text-center w-20 shadow-2xs">
                    <svg className="w-6 h-6 text-brand-gold mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="text-[0.62rem] font-bold text-brand-charcoal leading-none">Sugar</span>
                  </div>
                </div>
                <div className="flex items-start text-xs text-muted-foreground gap-1.5 leading-relaxed">
                  <span className="text-[#0a4d8c] font-bold text-[0.65rem] mt-0.5">▶</span>
                  <span>{getIngredients(product.name, product.category)}</span>
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
                    <button className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center text-[0.68rem] hover:opacity-80 font-sans font-bold">𝕏</button>
                    <button className="w-7 h-7 bg-[#3b5998] text-white rounded-full flex items-center justify-center text-[0.68rem] hover:opacity-80 font-bold">f</button>
                    <button className="w-7 h-7 bg-[#bd081c] text-white rounded-full flex items-center justify-center text-[0.68rem] hover:opacity-80 font-bold">p</button>
                    <button className="w-7 h-7 bg-[#25d366] text-white rounded-full flex items-center justify-center text-[0.68rem] hover:opacity-80 font-bold">w</button>
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
                <span className="text-[#1abc9c] font-bold">✔</span> 100% Vegetarian Sweets & Snacks
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#1abc9c] font-bold">✔</span> Prepared in Fully Hygienic Facilities
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#1abc9c] font-bold">✔</span> Rich Traditional Heritage Recipes since 1972
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#1abc9c] font-bold">✔</span> Premium Quality Sourced Ingredients
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
                      
                      <h4 className="font-serif text-xs sm:text-sm font-bold text-brand-charcoal hover:text-[#1abc9c] transition-colors leading-tight mb-1 line-clamp-1 max-w-[180px]">
                        {p.name}
                      </h4>
                      
                      <span className="text-xs font-bold text-[#1abc9c]">
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
    </>
  );
}
