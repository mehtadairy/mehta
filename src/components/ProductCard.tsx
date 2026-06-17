"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBasket, Heart, Eye, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/lib/types";
import { animateFlyToCart } from "@/lib/animations";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const weights = Object.keys(product.prices);
  const [selectedWeight, setSelectedWeight] = useState(weights[0]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Sync wishlist status on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const wishlist = JSON.parse(localStorage.getItem("mehta_wishlist") || "[]");
    setIsWishlisted(wishlist.includes(product.id));
  }, [product.id]);

  const price = product.prices[selectedWeight];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof window === "undefined") return;

    // Trigger Fly to Cart animation using product image
    const cardEl = e.currentTarget.closest("article");
    const imageEl = cardEl?.querySelector(".product-card-image") as HTMLElement;
    if (imageEl) {
      animateFlyToCart(imageEl, "header-cart-icon");
    }

    const storedCart = localStorage.getItem("mehta_cart");
    const cart = storedCart ? JSON.parse(storedCart) : [];

    const existingIndex = cart.findIndex(
      (item: any) => item.productId === product.id && item.weight === selectedWeight
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        productId: product.id,
        productName: product.name,
        image: product.images[0],
        weight: selectedWeight,
        price: price,
        quantity: 1,
      });
    }

    localStorage.setItem("mehta_cart", JSON.stringify(cart));
    // Trigger custom event to let Header know cart updated
    window.dispatchEvent(new Event("cartUpdated"));

    // Toast/Feedback simulation
    const btn = e.currentTarget as HTMLButtonElement;
    const originalText = btn.innerHTML;
    btn.innerHTML = `<svg class="h-4 w-4 animate-ping" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle></svg> Added!`;
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }, 1200);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof window === "undefined") return;

    const wishlist = JSON.parse(localStorage.getItem("mehta_wishlist") || "[]");
    let updatedWishlist = [];

    if (wishlist.includes(product.id)) {
      updatedWishlist = wishlist.filter((id: string) => id !== product.id);
      setIsWishlisted(false);
    } else {
      updatedWishlist = [...wishlist, product.id];
      setIsWishlisted(true);
    }

    localStorage.setItem("mehta_wishlist", JSON.stringify(updatedWishlist));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  return (
    <>
      <motion.article 
        whileHover={{ y: -8, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-brand-beige bg-white shadow-xs hover:shadow-xl hover:border-brand-orange/30 transition-shadow duration-300"
      >
        {/* Glow overlay on hover */}
        <div className="absolute inset-0 bg-radial-gradient from-brand-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Product Tag Badge */}
        {product.popular && (
          <span className="absolute left-3 top-3 z-10 rounded-md bg-brand-gold px-2.5 py-1 text-[0.68rem] font-bold text-brand-charcoal uppercase tracking-wider shadow-sm">
            Best Seller
          </span>
        )}
        {product.festivalSpecial && !product.popular && (
          <span className="absolute left-3 top-3 z-10 rounded-md bg-brand-orange px-2.5 py-1 text-[0.68rem] font-bold text-white uppercase tracking-wider shadow-sm animate-pulse">
            Festive Special
          </span>
        )}

        {/* Wishlist Icon */}
        <button
          onClick={handleToggleWishlist}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-xs border border-brand-beige shadow-xs transition-colors hover:bg-white text-muted-foreground hover:text-red-500"
          aria-label="Add to Wishlist"
        >
          <Heart className={`h-4.5 w-4.5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
        </button>

        {/* Image container with Hover Circular Spin Animation */}
        <div className="relative aspect-square overflow-hidden bg-brand-cream rounded-t-2xl group/image flex items-center justify-center">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-brand-cream/60 animate-pulse rounded-t-2xl" />
          )}
          <Link href={`/product/${product.id}`} className="block w-full h-full relative p-2">
            <div className="w-full h-full transition-transform duration-500 group-hover:scale-105 flex items-center justify-center">
              <img
                src={product.images[0]}
                alt={product.name}
                loading="lazy"
                className={`product-card-image w-full h-full object-contain rounded-full transition-all duration-700 group-hover:animate-[spin_18s_linear_infinite] ${
                  imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          </Link>
          
          {/* Quick View overlay button */}
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQuickView(true); }}
            className="absolute inset-0 m-auto h-10 w-32 rounded-full bg-white/95 backdrop-blur-md border border-brand-beige text-brand-charcoal text-[0.68rem] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg opacity-0 translate-y-3 group-hover/image:opacity-100 group-hover/image:translate-y-0 transition-all duration-300 hover:bg-[#0a4d8c] hover:text-white hover:border-[#0a4d8c] cursor-pointer z-10"
          >
            <Eye className="h-4 w-4" /> Quick View
          </button>
        </div>

        {/* Info card body */}
        <div className="flex flex-grow flex-col p-4.5 relative z-10">
          <span className="text-[0.68rem] font-bold text-brand-gold uppercase tracking-wider mb-1">
            {product.category}
          </span>
          
          <Link href={`/product/${product.id}`}>
            <h3 className="font-serif text-base font-bold text-brand-charcoal hover:text-brand-orange transition-colors line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4 flex-grow">
            {product.description}
          </p>

          {/* Weight Selector */}
          <div className="flex flex-wrap gap-1.5 mb-4.5">
            {weights.map((w) => (
              <button
                key={w}
                onClick={() => setSelectedWeight(w)}
                className={`rounded-md border px-2.5 py-1 text-[0.7rem] font-bold transition-all ${
                  selectedWeight === w
                    ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                    : "border-brand-beige hover:border-brand-gold bg-white text-brand-charcoal"
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          {/* Card Footer */}
          <div className="flex items-center justify-between border-t border-brand-beige/50 pt-3.5 mt-auto">
            <div className="flex flex-col">
              <span className="text-[0.62rem] text-muted-foreground uppercase leading-none mb-0.5">Price</span>
              <span className="font-serif text-lg font-bold text-brand-charcoal leading-none">
                ₹{price}
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-brand-orange px-3.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-orange-hover cursor-pointer"
            >
              <ShoppingBasket className="h-4 w-4 mr-1.5" /> Add
            </button>
          </div>
        </div>
      </motion.article>

      {/* --- QUICK VIEW LIGHTBOX MODAL --- */}
      <AnimatePresence>
        {showQuickView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/40 backdrop-blur-xs">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickView(false)}
              className="absolute inset-0"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-brand-beige overflow-hidden flex flex-col md:flex-row p-6 md:p-8 gap-6"
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowQuickView(false)}
                className="absolute right-4 top-4 p-2 hover:bg-brand-cream rounded-full transition-colors text-muted-foreground hover:text-brand-charcoal z-10"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Product Image Section */}
              <div className="w-full md:w-1/2 aspect-square bg-brand-cream rounded-xl flex items-center justify-center p-4">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-contain p-4 rounded-full"
                />
              </div>

              {/* Product Info Section */}
              <div className="w-full md:w-1/2 flex flex-col justify-between">
                <div>
                  <span className="text-[0.62rem] font-bold text-brand-gold uppercase tracking-wider block mb-1">
                    {product.category}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-brand-charcoal mb-2">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {product.description}
                  </p>

                  {/* Weight Options */}
                  <div className="mb-4">
                    <span className="text-[0.65rem] font-bold text-brand-charcoal uppercase tracking-wider block mb-2">
                      Select Weight
                    </span>
                    <div className="flex gap-2">
                      {weights.map((w) => (
                        <button
                          key={w}
                          onClick={() => setSelectedWeight(w)}
                          className={`rounded-md border px-3 py-1.5 text-xs font-bold transition-all ${
                            selectedWeight === w
                              ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                              : "border-brand-beige hover:border-brand-gold bg-white text-brand-charcoal"
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Price and Cart Action */}
                <div className="border-t border-brand-beige/50 pt-4 mt-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[0.62rem] text-muted-foreground uppercase leading-none mb-1">Price</span>
                    <span className="font-serif text-2xl font-bold text-brand-orange">
                      ₹{price}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      handleAddToCart(e);
                      setTimeout(() => setShowQuickView(false), 800);
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-orange px-6 text-xs font-bold text-white shadow-md transition-colors hover:bg-brand-orange-hover cursor-pointer"
                  >
                    <ShoppingBasket className="h-4.5 w-4.5 mr-2" /> Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
