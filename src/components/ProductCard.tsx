"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getOptimizedImageUrl, BLUR_PLACEHOLDER } from "@/lib/image-utils";
import { ShoppingBasket, Heart, Eye, X, Check, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product, generateSlug } from "@/lib/types";
import { animateFlyToCart } from "@/lib/animations";
import { useLanguage } from "@/lib/context/LanguageContext";
import { HighlightText } from "@/components/HighlightText";

interface ProductCardProps {
  product: Product;
  searchQuery?: string;
  activeWeights?: string[];
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

import { sortWeights } from "@/lib/types";

export default function ProductCard({ product, searchQuery, activeWeights }: ProductCardProps) {
  const weights = sortWeights(Object.keys(product.prices));
  console.log("HELLO FROM PRODUCT CARD:", product.name);

  const getInitialWeight = () => {
    if (activeWeights && activeWeights.length > 0) {
      for (const w of activeWeights) {
        const target = w.toLowerCase().replace(/\s+/g, '');
        const matched = weights.find(k => {
          const keyNorm = k.toLowerCase().replace(/\s+/g, '');
          if (target === '250g') return keyNorm.includes('250');
          if (target === '500g') return keyNorm.includes('500');
          if (target === '1kg') return keyNorm.includes('1k') || keyNorm.includes('1000') || (keyNorm.includes('1') && !keyNorm.includes('250') && !keyNorm.includes('500') && !keyNorm.includes('2.5') && !keyNorm.includes('25'));
          return keyNorm === target;
        });
        if (matched) return matched;
      }
    }
    return weights[0];
  };

  const [selectedWeight, setSelectedWeight] = useState(getInitialWeight());
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const { t } = useLanguage();

  // Sync selectedWeight if activeWeights filter changes
  useEffect(() => {
    if (activeWeights && activeWeights.length > 0) {
      for (const w of activeWeights) {
        const target = w.toLowerCase().replace(/\s+/g, '');
        const matched = weights.find(k => {
          const keyNorm = k.toLowerCase().replace(/\s+/g, '');
          if (target === '250g') return keyNorm.includes('250');
          if (target === '500g') return keyNorm.includes('500');
          if (target === '1kg') return keyNorm.includes('1k') || keyNorm.includes('1000') || (keyNorm.includes('1') && !keyNorm.includes('250') && !keyNorm.includes('500') && !keyNorm.includes('2.5') && !keyNorm.includes('25'));
          return keyNorm === target;
        });
        if (matched) {
          setSelectedWeight(matched);
          break;
        }
      }
    }
  }, [activeWeights]);

  // Sync wishlist status on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const wishlist = JSON.parse(localStorage.getItem("mehta_wishlist") || "[]");
    setIsWishlisted(wishlist.includes(product.id));
  }, [product.id]);

  const price = product.prices[selectedWeight];

  // Extract variant original price if meta badge is present
  const metaBadge = product.badges?.find(b => b.startsWith("PRICES_META:"));
  let originalPrice = 0;
  let discountPercent = 0;
  if (metaBadge) {
    try {
      const parsed = JSON.parse(metaBadge.replace("PRICES_META:", ""));
      const match = parsed.find((v: any) => v.weight === selectedWeight);
      if (match && Number(match.originalPrice) > 0) {
        originalPrice = Number(match.originalPrice);
        discountPercent = Number(match.offPercent) || 0;
      }
    } catch(e) {}
  }

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
    if (window.innerWidth < 1024) window.dispatchEvent(new Event("openCartDrawer"));

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
            <span className="rounded-md bg-[#D46D2D] px-2 py-0.5 text-[0.62rem] font-bold text-white uppercase tracking-wider shadow-sm">
              Best Seller
            </span>
          )}
          {product.festivalSpecial && !product.popular && (
            <span className="rounded-md bg-[#D46D2D] px-2 py-0.5 text-[0.62rem] font-bold text-white uppercase tracking-wider shadow-sm animate-pulse">
              Festive
            </span>
          )}
          {product.badges && product.badges.filter(b => !b.startsWith("PRICES_META:")).map((badge, idx) => (
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

        {/* Quick View - Stacked vertically below Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQuickView(true); }}
          className="absolute right-2.5 top-11 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-[#EAE0D3] shadow-sm transition-all hover:bg-white hover:text-[#D46D2D] active:scale-95 cursor-pointer text-[#7E6B5A]"
          aria-label="Quick View"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>

        {/* Image — square with skeleton */}
        <Link 
          href={`/product/${generateSlug(product.name)}`}
          className="relative overflow-hidden bg-[#FAF6EE] rounded-t-2xl flex items-center justify-center p-3.5 flex-shrink-0"
          style={{ display: 'flex', aspectRatio: '1 / 1', width: '100%', height: 'auto', flexGrow: 0, flexShrink: 0 }}
        >
          {/* Skeleton shimmer while loading */}
          {!imageLoaded && <ImageSkeleton />}
 
          <img
            src={getOptimizedImageUrl(product.images[0], 300, 75, 300)}
            alt={product.name}
            loading="lazy"
            className={`product-card-image w-full h-full object-contain rounded-full transition-all duration-700 group-hover:animate-[spin_18s_linear_infinite] ${
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            onLoad={() => setImageLoaded(true)}
          />
        </Link>

        {/* Info body */}
        <div className="flex flex-grow flex-col p-3.5 sm:p-4 relative z-10">
          <span className="font-sans text-[10px] sm:text-[11px] font-bold text-[#C88A1A] uppercase tracking-[1.5px] mb-1.5 block">
            {t(product.category)}
          </span>

          <Link href={`/product/${generateSlug(product.name)}`}>
            <h3 className="font-sans text-sm sm:text-base font-bold text-[#2A1E17] hover:text-[#D46D2D] transition-colors line-clamp-1 leading-snug mb-1.5">
              <HighlightText text={t(product.name)} query={searchQuery} />
            </h3>
          </Link>
          <p className="font-sans text-[11px] sm:text-xs text-[#7E6B5A] line-clamp-2 leading-relaxed mb-3 flex-grow">
            <HighlightText text={t(product.description)} query={searchQuery} />
          </p>

          {/* Weight selector — compact on mobile */}
          <div className="flex flex-wrap gap-2 mb-3">
            {weights.map((w) => (
              <button
                key={w}
                onClick={() => setSelectedWeight(w)}
                className={`rounded-[10px] border px-3 py-1.5 text-[13px] font-semibold transition-all cursor-pointer ${
                  selectedWeight === w
                    ? "bg-[#D46D2D] text-white border-[#D46D2D] shadow-sm"
                    : "bg-[#FAF6EE] text-[#2A1E17] border-[#EAE0D3]/80 hover:border-[#D4AF37]"
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          {/* Price + Add to Cart */}
          <div className="flex items-center justify-between border-t border-[#EAE0D3]/60 pt-3 mt-auto">
            <div className="flex flex-col gap-0.5">
              <span className="font-sans text-[9px] font-bold text-[#9A8E84] uppercase tracking-wider leading-none">
                Price
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-sans tabular-nums text-base sm:text-lg font-bold text-[#2A1E17] leading-none">
                  ₹{price}
                </span>
                {originalPrice > price && (
                  <span className="font-sans text-[10px] text-[#9A8E84] line-through font-medium">
                    ₹{originalPrice}
                  </span>
                )}
              </div>
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
                  src={getOptimizedImageUrl(product.images[0], 500, 80, 500)}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <span className="font-sans text-[10px] sm:text-[11px] font-bold text-[#C88A1A] uppercase tracking-[1.5px] block mb-1.5">
                    {t(product.category)}
                  </span>
                  <h3 className="font-sans text-sm sm:text-base font-bold text-[#2A1E17] leading-snug mb-1.5">
                    {t(product.name)}
                  </h3>
                  <p className="font-sans text-[11px] sm:text-xs text-[#7E6B5A] leading-relaxed mb-3">
                    {t(product.description)}
                  </p>

                  <span className="font-sans text-[9px] font-bold text-[#9A8E84] uppercase tracking-wider leading-none block mb-2">
                    Select Weight
                  </span>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {weights.map((w) => (
                      <button
                        key={w}
                        onClick={() => setSelectedWeight(w)}
                        className={`rounded-[10px] border px-3 py-1.5 text-[13px] font-semibold transition-all cursor-pointer ${
                          selectedWeight === w
                            ? "bg-[#D46D2D] text-white border-[#D46D2D] shadow-sm"
                            : "bg-[#FAF6EE] text-[#2A1E17] border-[#EAE0D3]/80 hover:border-[#D4AF37]"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#EAE0D3]/60 pt-3 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-sans text-[9px] font-bold text-[#9A8E84] uppercase tracking-wider leading-none block">Price</span>
                    <span className="font-sans tabular-nums text-base sm:text-lg font-bold text-[#2A1E17] leading-none">₹{price}</span>
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
