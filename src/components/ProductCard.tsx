"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBasket, Heart } from "lucide-react";
import { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const weights = Object.keys(product.prices);
  const [selectedWeight, setSelectedWeight] = useState(weights[0]);
  const [isWishlisted, setIsWishlisted] = useState(false);

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
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-brand-beige bg-white shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-brand-orange/15">
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
      <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-brand-cream rounded-t-2xl">
        <div className="w-full h-full transition-transform duration-500 group-hover:scale-105 flex items-center justify-center p-2">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain rounded-full transition-all duration-700 group-hover:animate-[spin_12s_linear_infinite]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </Link>

      {/* Info card body */}
      <div className="flex flex-grow flex-col p-4.5">
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
    </article>
  );
}
