"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getOptimizedImageUrl, BLUR_PLACEHOLDER } from "@/lib/image-utils";
import { ShoppingBasket, Heart, Eye, X, Check, Star, Truck, Shield, Sparkles } from "lucide-react";
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
    <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: '20px' }}>
      <div
        className="h-full w-full"
        style={{
          background: 'linear-gradient(90deg, #F5EDE3 0%, #FFFDF8 50%, #F5EDE3 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.6s ease-in-out infinite',
        }}
      />
    </div>
  );
}

import { sortWeights } from "@/lib/types";

export default function ProductCard({ product, searchQuery, activeWeights }: ProductCardProps) {
  const weights = sortWeights(Object.keys(product.prices));

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
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="group relative flex flex-col overflow-hidden"
        style={{
          borderRadius: '24px',
          border: '1px solid rgba(212,175,55,0.18)',
          backgroundColor: '#FFFDF8',
          boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.3s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(212,175,55,0.15), 0 8px 24px rgba(0,0,0,0.08)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.06)';
        }}
      >

        {/* ── BADGES ── */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5 items-start">
          {product.popular && (
            <span
              className="flex items-center gap-1 px-2.5 py-1 text-[0.6rem] font-bold text-white uppercase tracking-wider"
              style={{
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
                boxShadow: '0 2px 8px rgba(212,175,55,0.35)',
                letterSpacing: '0.08em',
              }}
            >
              <Star className="h-2.5 w-2.5 fill-white" strokeWidth={0} /> Best Seller
            </span>
          )}
          {product.festivalSpecial && !product.popular && (
            <span
              className="flex items-center gap-1 px-2.5 py-1 text-[0.6rem] font-bold text-white uppercase tracking-wider"
              style={{
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                boxShadow: '0 2px 8px rgba(217,119,6,0.3)',
                letterSpacing: '0.08em',
              }}
            >
              <Sparkles className="h-2.5 w-2.5" /> Festive
            </span>
          )}
          {discountPercent > 0 && (
            <span
              className="px-2 py-0.5 text-[0.58rem] font-bold text-white uppercase tracking-wider"
              style={{
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
              }}
            >
              {discountPercent}% Off
            </span>
          )}
          {product.badges && product.badges.filter(b => !b.startsWith("PRICES_META:")).map((badge, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider"
              style={{
                borderRadius: '20px',
                background: '#2F241C',
                color: '#FFFDF8',
                boxShadow: '0 2px 8px rgba(47,36,28,0.2)',
              }}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* ── FLOATING ACTION BUTTONS (Glass) ── */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
          {/* Wishlist */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.1 }}
            onClick={handleToggleWishlist}
            className="flex items-center justify-center cursor-pointer"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(255,253,248,0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: isWishlisted ? '1.5px solid #D4AF37' : '1px solid rgba(212,175,55,0.2)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#D4AF37';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(212,175,55,0.25)';
            }}
            onMouseLeave={(e) => {
              if (!isWishlisted) {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.2)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              }
            }}
            aria-label="Toggle Wishlist"
          >
            <Heart
              className={`h-[15px] w-[15px] transition-colors duration-300 ${isWishlisted ? "fill-[#D4AF37] text-[#D4AF37]" : "text-[#7A6A5D]"}`}
              strokeWidth={isWishlisted ? 0 : 1.8}
            />
          </motion.button>

          {/* Quick View */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.1 }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQuickView(true); }}
            className="flex items-center justify-center cursor-pointer"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(255,253,248,0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(212,175,55,0.2)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#D4AF37';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(212,175,55,0.25)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.2)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            }}
            aria-label="Quick View"
          >
            <Eye className="h-[15px] w-[15px] text-[#7A6A5D]" strokeWidth={1.8} />
          </motion.button>
        </div>

        {/* ── IMAGE AREA ── */}
        <Link
          href={`/product/${generateSlug(product.name)}`}
          className="relative overflow-hidden flex items-center justify-center flex-shrink-0"
          style={{
            aspectRatio: '1 / 1',
            width: '100%',
            borderRadius: '24px 24px 0 0',
            background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.06) 0%, rgba(250,246,238,0.8) 50%, #FFFDF8 100%)',
            padding: '16px',
          }}
        >
          {/* Radial glow behind product */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: '70%',
              height: '70%',
              top: '15%',
              left: '15%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
              filter: 'blur(20px)',
            }}
          />

          {/* Skeleton shimmer while loading */}
          {!imageLoaded && <ImageSkeleton />}

          <img
            src={getOptimizedImageUrl(product.images[0], 300, 75, 300)}
            alt={product.name}
            loading="lazy"
            className={`product-card-image w-full h-full object-contain relative z-[1] transition-all duration-700 ${
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            style={{
              borderRadius: '50%',
              transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease',
            }}
            onLoad={() => setImageLoaded(true)}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          />
        </Link>

        {/* ── INFO BODY ── */}
        <div className="flex flex-grow flex-col relative z-10" style={{ padding: '16px 18px 18px' }}>
          {/* Category */}
          <span
            className="block mb-1"
            style={{
              fontFamily: 'inherit',
              fontSize: '0.6rem',
              fontWeight: 700,
              color: '#D4AF37',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.16em',
            }}
          >
            {t(product.category)}
          </span>

          {/* Title */}
          <Link href={`/product/${generateSlug(product.name)}`}>
            <h3
              className="line-clamp-2 leading-snug mb-1.5 transition-colors duration-200"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: '1rem',
                fontWeight: 700,
                color: '#2F241C',
                lineHeight: 1.3,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#D97706'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#2F241C'; }}
            >
              <HighlightText text={t(product.name)} query={searchQuery} />
            </h3>
          </Link>

          {/* Description */}
          {product.description && (
            <div className="relative mb-3" style={{ maxHeight: '2.8em', overflow: 'hidden' }}>
              <p
                className="leading-relaxed"
                style={{ fontSize: '0.72rem', color: '#7A6A5D', lineHeight: 1.55 }}
              >
                <HighlightText text={t(product.description)} query={searchQuery} />
              </p>
              {/* Fade overflow */}
              <div
                className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none"
                style={{ background: 'linear-gradient(transparent, #FFFDF8)' }}
              />
            </div>
          )}

          {/* ── WEIGHT SELECTOR (Segmented Pills) ── */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {weights.map((w) => (
              <motion.button
                key={w}
                whileTap={{ scale: 0.93 }}
                onClick={() => setSelectedWeight(w)}
                className="cursor-pointer flex items-center gap-1 transition-all duration-200"
                style={{
                  borderRadius: '12px',
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: selectedWeight === w ? 'none' : '1px solid rgba(212,175,55,0.2)',
                  background: selectedWeight === w
                    ? 'linear-gradient(135deg, #D97706 0%, #B45309 100%)'
                    : '#FFFFFF',
                  color: selectedWeight === w ? '#FFFFFF' : '#2F241C',
                  boxShadow: selectedWeight === w
                    ? '0 3px 10px rgba(217,119,6,0.3)'
                    : '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {selectedWeight === w && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                {w}
              </motion.button>
            ))}
          </div>

          {/* ── PRICE SECTION ── */}
          <div
            className="pt-3 mb-3"
            style={{ borderTop: '1px solid rgba(212,175,55,0.12)' }}
          >
            <div className="flex items-baseline gap-2">
              <span
                className="tabular-nums"
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: '#2F241C',
                  lineHeight: 1,
                }}
              >
                ₹{price}
              </span>
              {originalPrice > price && (
                <span style={{ fontSize: '0.7rem', color: '#9A8E84', textDecoration: 'line-through', fontWeight: 500 }}>
                  ₹{originalPrice}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span style={{ fontSize: '0.58rem', color: '#7A6A5D', fontWeight: 500 }}>
                Inclusive of GST
              </span>
              <span style={{ fontSize: '0.58rem', color: '#D4AF37', fontWeight: 600 }}>
                •  Freshly Prepared
              </span>
            </div>
          </div>

          {/* ── TRUST CHIPS ── */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {[
              { icon: Truck, label: 'Same Day' },
              { icon: Shield, label: '100% Pure' },
            ].map((chip) => (
              <span
                key={chip.label}
                className="flex items-center gap-1"
                style={{
                  fontSize: '0.55rem',
                  fontWeight: 600,
                  color: '#7A6A5D',
                  background: 'rgba(212,175,55,0.06)',
                  border: '1px solid rgba(212,175,55,0.12)',
                  borderRadius: '8px',
                  padding: '3px 8px',
                }}
              >
                <chip.icon className="h-2.5 w-2.5" style={{ color: '#D4AF37' }} strokeWidth={2} />
                {chip.label}
              </span>
            ))}
          </div>

          {/* ── ADD TO CART BUTTON ── */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleAddToCart}
            className="w-full flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 mt-auto"
            style={{
              height: '44px',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: '#FFFFFF',
              background: cartAdded
                ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                : 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
              boxShadow: cartAdded
                ? '0 4px 14px rgba(22,163,74,0.3)'
                : '0 4px 14px rgba(217,119,6,0.3)',
              letterSpacing: '0.03em',
              transition: 'background 0.3s ease, box-shadow 0.3s ease, transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!cartAdded) {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(217,119,6,0.4)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = cartAdded
                ? '0 4px 14px rgba(22,163,74,0.3)'
                : '0 4px 14px rgba(217,119,6,0.3)';
            }}
          >
            <AnimatePresence mode="wait">
              {cartAdded ? (
                <motion.span
                  key="added"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" strokeWidth={2.5} /> Added to Cart
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <ShoppingBasket className="h-4 w-4" strokeWidth={2} /> Add to Cart
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.article>

      {/* ── QUICK VIEW MODAL ──────────────────────────────────────── */}
      <AnimatePresence>
        {showQuickView && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#2F241C]/40 backdrop-blur-sm">
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
              className="relative z-10 w-full sm:max-w-2xl overflow-hidden flex flex-col sm:flex-row gap-5 max-h-[92dvh] sm:max-h-none overflow-y-auto sm:overflow-visible"
              style={{
                background: '#FFFDF8',
                borderRadius: '24px',
                border: '1px solid rgba(212,175,55,0.18)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
                padding: '24px',
              }}
            >
              {/* Drag handle (mobile) */}
              <div className="sm:hidden flex justify-center mb-1">
                <div className="h-1 w-10 rounded-full" style={{ background: 'rgba(212,175,55,0.2)' }} />
              </div>

              <button
                onClick={() => setShowQuickView(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full transition-colors z-10 cursor-pointer"
                style={{ color: '#7A6A5D', background: 'transparent' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.08)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <X className="h-4.5 w-4.5" />
              </button>

              {/* Image */}
              <div
                className="w-full sm:w-5/12 aspect-square flex items-center justify-center flex-shrink-0"
                style={{
                  borderRadius: '20px',
                  background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.06) 0%, #FAF6EE 100%)',
                  padding: '16px',
                }}
              >
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
                  <span
                    className="block mb-1.5"
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: '#D4AF37',
                      textTransform: 'uppercase',
                      letterSpacing: '0.16em',
                    }}
                  >
                    {t(product.category)}
                  </span>
                  <h3
                    className="leading-snug mb-1.5"
                    style={{
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: '#2F241C',
                    }}
                  >
                    {t(product.name)}
                  </h3>
                  {product.description && (
                    <p style={{ fontSize: '0.72rem', color: '#7A6A5D', lineHeight: 1.6, marginBottom: '12px' }}>
                      {t(product.description)}
                    </p>
                  )}

                  <span
                    className="block mb-2"
                    style={{ fontSize: '0.58rem', fontWeight: 700, color: '#7A6A5D', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  >
                    Select Weight
                  </span>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {weights.map((w) => (
                      <button
                        key={w}
                        onClick={() => setSelectedWeight(w)}
                        className="cursor-pointer flex items-center gap-1 transition-all duration-200"
                        style={{
                          borderRadius: '12px',
                          padding: '6px 14px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          border: selectedWeight === w ? 'none' : '1px solid rgba(212,175,55,0.2)',
                          background: selectedWeight === w
                            ? 'linear-gradient(135deg, #D97706 0%, #B45309 100%)'
                            : '#FFFFFF',
                          color: selectedWeight === w ? '#FFFFFF' : '#2F241C',
                          boxShadow: selectedWeight === w
                            ? '0 3px 10px rgba(217,119,6,0.3)'
                            : '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                      >
                        {selectedWeight === w && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="pt-3 flex items-center justify-between"
                  style={{ borderTop: '1px solid rgba(212,175,55,0.12)' }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#7A6A5D', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price</span>
                    <span
                      className="tabular-nums"
                      style={{
                        fontFamily: "'Georgia', 'Times New Roman', serif",
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: '#2F241C',
                        lineHeight: 1,
                      }}
                    >
                      ₹{price}
                    </span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      handleAddToCart(e);
                      setTimeout(() => setShowQuickView(false), 900);
                    }}
                    className="flex items-center justify-center cursor-pointer"
                    style={{
                      height: '44px',
                      borderRadius: '14px',
                      padding: '0 24px',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      color: '#FFFFFF',
                      background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                      boxShadow: '0 4px 14px rgba(217,119,6,0.3)',
                    }}
                  >
                    <ShoppingBasket className="h-4 w-4 mr-2" strokeWidth={2} /> Add to Cart
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
