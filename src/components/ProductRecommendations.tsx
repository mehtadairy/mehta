"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Product, Order, generateSlug } from "@/lib/types";
import { supabase, fetchProducts } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ShoppingBag, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";

interface ProductRecommendationsProps {
  currentProductId?: string;
  category?: string;
  type: "also_bought" | "bought_together" | "may_like";
  limit?: number;
}

export default function ProductRecommendations({ currentProductId, category, type, limit = 4 }: ProductRecommendationsProps) {
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWeights, setSelectedWeights] = useState<{ [id: string]: string }>({});
  
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function getRecommendations() {
      setIsLoading(true);
      try {
        const allProducts = await fetchProducts();
        let results: Product[] = [];

        if (type === "also_bought" || type === "bought_together") {
          if (currentProductId) {
            // Attempt to fetch from recent orders to find co-occurring products
            const { data: recentOrders } = await supabase
              .from("orders")
              .select("order_items")
              .order("created_at", { ascending: false })
              .limit(100);

            if (recentOrders) {
              const productCounts: Record<string, number> = {};
              recentOrders.forEach(order => {
                const items = typeof order.order_items === 'string' ? JSON.parse(order.order_items) : order.order_items;
                const hasCurrent = items.some((item: any) => item.productId === currentProductId);
                if (hasCurrent) {
                  items.forEach((item: any) => {
                    if (item.productId !== currentProductId) {
                      productCounts[item.productId] = (productCounts[item.productId] || 0) + 1;
                    }
                  });
                }
              });

              // Sort by highest co-occurrence
              const sortedIds = Object.entries(productCounts)
                .sort((a, b) => b[1] - a[1])
                .map(entry => entry[0]);

              results = sortedIds.map(id => allProducts.find(p => p.id === id)).filter(Boolean) as Product[];
            }
          }
        }

        // Fallback: Same category or popular products
        if (results.length < limit) {
          const fallbackPool = allProducts.filter(p => 
            p.id !== currentProductId && 
            !results.some(r => r.id === p.id) &&
            (category ? p.category === category : p.popular)
          );
          
          // Shuffle fallback
          const shuffled = fallbackPool.sort(() => 0.5 - Math.random());
          results = [...results, ...shuffled].slice(0, limit);
        }

        // Ultimate fallback
        if (results.length < limit) {
           const ultimateFallback = allProducts.filter(p => p.id !== currentProductId && !results.some(r => r.id === p.id));
           results = [...results, ...ultimateFallback].slice(0, limit);
        }

        setRecommendedProducts(results);

        const initW: Record<string, string> = {};
        results.forEach(p => {
          const w = Object.keys(p.prices);
          if (w.length) initW[p.id] = w[0];
        });
        setSelectedWeights(initW);

      } catch (e) {
        console.error("Recommendations error:", e);
      } finally {
        setIsLoading(false);
      }
    }
    
    getRecommendations();
  }, [currentProductId, category, type, limit]);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window === "undefined") return;
    const weight = selectedWeights[product.id] || Object.keys(product.prices)[0];
    const price = product.prices[weight];
    const cart = JSON.parse(localStorage.getItem("mehta_cart") || "[]");
    const idx = cart.findIndex((i: any) => i.productId === product.id && i.weight === weight);
    if (idx > -1) cart[idx].quantity += 1;
    else cart.push({ productId: product.id, productName: product.name, image: product.images[0], weight, price, quantity: 1 });
    localStorage.setItem("mehta_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    
    const btn = e.currentTarget as HTMLButtonElement;
    const orig = btn.innerHTML;
    btn.innerHTML = "Added ✓";
    btn.disabled = true;
    setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 1000);
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -250, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 250, behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-beige border-t-brand-orange rounded-full animate-spin"></div>
      </div>
    );
  }

  if (recommendedProducts.length === 0) return null;

  const titles = {
    "also_bought": "Customers Also Bought",
    "bought_together": "Frequently Bought Together",
    "may_like": "You May Also Like"
  };

  return (
    <div className="py-12 mt-8">
      <div className="flex flex-col items-center mb-10 text-center">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2A1E17] mb-3">
          {titles[type]}
        </h2>
        <div className="h-0.5 w-16 bg-[#D4AF37]"></div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
