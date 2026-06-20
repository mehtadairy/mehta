"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBasket, Heart, Eye, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/lib/types";
import { animateFlyToCart } from "@/lib/animations";

interface ProductCardProps {
  product: Product;
}

/** Shimmer skeleton for image placeholder */
function ImageSkeleton() {
  return (
    <div className="absolute inset-0 rounded-full overflow-hidden">
      <div
        className="h-full w-full bg-gradient-to-r from-[#EAE0D3] via-[#FAF6EE] to-[#EAE0D3] bg-[length:200%_100%]"
        style={{ animation: "shimmer 1.6s ease-in-out infinite" }}
      />
    </div>
  );
}

export default function ProductCard({ product }: ProductCardProps) {
  const weights = Object.keys(product.prices);
  const [selectedWeight, setSelectedWeight] = useState(weights[0]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

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

    // Fly-to-cart animation
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
    window.dispatchEvent(new Event("cartUpdated"));

    // Success feedback
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 1400);
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
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#EAE0D3] bg-white shadow-sm hover:shadow-xl hover:border-[#D46D2D]/30 transition-shadow duration-300"
      >
        {/* Subtle glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-b from-[#D46D2D]/4 to-transparent" />

        {/* Badges Stack */}
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1.5 items-start">
          {product.popular && (
            <span className="rounded-md bg-[#D4AF37] px-2 py-0.5 text-[0.62rem] font-bold text-[#2A1E17] uppercase tracking-wider shadow-sm">
              Best Seller
            </span>
          )}
          {product.festivalSpecial && !product.popular && (
            <span className="rounded-md bg-[#D46D2D] px-2 py-0.5 text-[0.62rem] font-bold text-white uppercase tracking-wider shadow-sm animate-pulse">
              Festive
            </span>
          )}
          {product.badges && product.badges.map((badge, idx) => (
            <span key={idx} className="rounded-md bg-brand-charcoal px-2 py-0.5 text-[0.62rem] font-bold text-white uppercase tracking-wider shadow-sm">
              {badge}
            </span>
          ))}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleToggleWishlist}
          className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-[#EAE0D3] shadow-sm transition-colors hover:bg-white cursor-pointer"
          aria-label="Toggle Wishlist"
        >
          <Heart className={`h-3.5 w-3.5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-[#7E6B5A]"}`} />
        </button>

        {/* Image — square with skeleton */}
        <div className="relative aspect-square overflow-hidden bg-[#FAF6EE] rounded-t-2xl flex items-center justify-center">
          {/* Skeleton shimmer while loading */}
          {!imageLoaded && <ImageSkeleton />}

          <Link href={`/product/${product.id}`} className="block w-full h-full relative p-2">
            <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
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

          {/* Quick View overlay */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQuickView(true); }}
            className="absolute inset-0 m-auto h-9 w-28 rounded-full bg-white/95 backdrop-blur-md border border-[#EAE0D3] text-[#2A1E17] text-[0.65rem] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-[#2A1E17] hover:text-white cursor-pointer z-10"
          >
            <Eye className="h-3.5 w-3.5" /> Quick View
          </button>
        </div>

        {/* Info body */}
        <div className="flex flex-grow flex-col p-3.5 sm:p-4 relative z-10">
          <span className="text-[0.6rem] font-bold text-[#D4AF37] uppercase tracking-wider mb-0.5">
            {product.category}
          </span>

          <Link href={`/product/${product.id}`}>
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#2A1E17] hover:text-[#D46D2D] transition-colors line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          <p className="text-[0.68rem] sm:text-xs text-[#7E6B5A] line-clamp-2 leading-relaxed mt-1 mb-3 flex-grow">
            {product.description}
          </p>

          {/* Weight selector — compact on mobile */}
          <div className="flex flex-wrap gap-1 mb-3">
            {weights.map((w) => (
              <button
                key={w}
                onClick={() => setSelectedWeight(w)}
                className={`rounded-md border px-2 py-0.5 text-[0.62rem] sm:text-[0.7rem] font-bold transition-all cursor-pointer ${
                  selectedWeight === w
                    ? "border-[#D46D2D] bg-[#D46D2D]/10 text-[#D46D2D]"
                    : "border-[#EAE0D3] hover:border-[#D4AF37] bg-white text-[#2A1E17]"
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          {/* Price + Add to Cart */}
          <div className="flex items-center justify-between border-t border-[#EAE0D3]/60 pt-3 mt-auto">
            <div className="flex flex-col">
              <span className="text-[0.55rem] text-[#7E6B5A] uppercase leading-none mb-0.5">Price</span>
              <span className="font-serif text-base sm:text-lg font-bold text-[#2A1E17] leading-none">
                ₹{price}
              </span>
            </div>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleAddToCart}
              className={`inline-flex h-8 sm:h-9 items-center justify-center rounded-lg px-2.5 sm:px-3.5 text-[0.65rem] sm:text-xs font-semibold text-white shadow-sm transition-all cursor-pointer ${
                cartAdded
                  ? "bg-green-600"
                  : "bg-[#D46D2D] hover:bg-[#BF5E23]"
              }`}
            >
              <AnimatePresence mode="wait">
                {cartAdded ? (
                  <motion.span
                    key="added"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" /> Added
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-1"
                  >
                    <ShoppingBasket className="h-3.5 w-3.5" /> Add
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.article>

      {/* ── QUICK VIEW MODAL ──────────────────────────────────────── */}
      <AnimatePresence>
        {showQuickView && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#2A1E17]/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickView(false)}
              className="absolute inset-0"
            />

            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 250 }}
              className="relative z-10 w-full sm:max-w-2xl bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl border border-[#EAE0D3] overflow-hidden flex flex-col sm:flex-row p-5 sm:p-8 gap-5 max-h-[92dvh] sm:max-h-none overflow-y-auto sm:overflow-visible"
            >
              {/* Drag handle (mobile) */}
              <div className="sm:hidden flex justify-center mb-1">
                <div className="h-1 w-10 rounded-full bg-[#EAE0D3]" />
              </div>

              <button
                onClick={() => setShowQuickView(false)}
                className="absolute right-4 top-4 p-1.5 hover:bg-[#FAF6EE] rounded-full transition-colors text-[#7E6B5A] hover:text-[#2A1E17] z-10 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              {/* Image */}
              <div className="w-full sm:w-5/12 aspect-square bg-[#FAF6EE] rounded-2xl flex items-center justify-center p-4 flex-shrink-0">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <span className="text-[0.6rem] font-bold text-[#D4AF37] uppercase tracking-wider block mb-1">
                    {product.category}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-[#2A1E17] mb-1.5">
                    {product.name}
                  </h3>
                  <p className="text-xs text-[#7E6B5A] leading-relaxed mb-4">
                    {product.description}
                  </p>

                  <span className="text-[0.65rem] font-bold text-[#2A1E17] uppercase tracking-wider block mb-2">
                    Select Weight
                  </span>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {weights.map((w) => (
                      <button
                        key={w}
                        onClick={() => setSelectedWeight(w)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          selectedWeight === w
                            ? "border-[#D46D2D] bg-[#D46D2D]/10 text-[#D46D2D]"
                            : "border-[#EAE0D3] hover:border-[#D4AF37] bg-white text-[#2A1E17]"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#EAE0D3]/60 pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[0.6rem] text-[#7E6B5A] uppercase leading-none block mb-1">Price</span>
                    <span className="font-serif text-2xl font-bold text-[#D46D2D]">₹{price}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      handleAddToCart(e);
                      setTimeout(() => setShowQuickView(false), 900);
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#D46D2D] px-5 text-xs font-bold text-white shadow-md transition-colors hover:bg-[#BF5E23] cursor-pointer"
                  >
                    <ShoppingBasket className="h-4 w-4 mr-2" /> Add to Cart
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
