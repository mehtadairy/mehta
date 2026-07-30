"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Product } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { 
  Package, 
  Star, 
  Sparkles, 
  AlertTriangle, 
  IndianRupee, 
  TrendingUp, 
  Plus, 
  Download, 
  Upload, 
  RefreshCw, 
  Search, 
  X, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  UploadCloud, 
  CheckCircle2, 
  Loader2,
  Tag,
  Clock,
  ShieldAlert,
  Layers,
  GripVertical,
  ArrowUpDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "@/components/Toast";

interface AdminProductsProps {
  products: Product[];
  categories: any[];
  onAddProduct: (e: React.FormEvent) => void;
  onDeleteProduct: (id: string) => void;
  onEditProduct: (p: Product | string | null) => void;
  editingProduct: Product | null;
  showProductForm: boolean;
  setShowProductForm: (show: boolean) => void;
  // Form State Props
  prodName: string;
  setProdName: (v: string) => void;
  prodCat: string;
  setProdCat: (v: string) => void;
  prodDesc: string;
  setProdDesc: (v: string) => void;
  prodStock: string;
  setProdStock: (v: string) => void;
  prodPosition: string;
  setProdPosition: (v: string) => void;
  prodPopular: boolean;
  setProdPopular: (v: boolean) => void;
  prodFestive: boolean;
  setProdFestive: (v: boolean) => void;
  prodImage: string;
  setProdImage: (v: string) => void;
  variants: any[];
  setVariants: React.Dispatch<React.SetStateAction<any[]>>;
  prodAllergens: string[];
  setProdAllergens: React.Dispatch<React.SetStateAction<string[]>>;
  prodShelfLife: string;
  setProdShelfLife: (v: string) => void;
  prodStorageInstructions: string;
  setProdStorageInstructions: (v: string) => void;
  prodBadges: string[];
  setProdBadges: React.Dispatch<React.SetStateAction<string[]>>;
  isUploadingImage: boolean;
  uploadError: string;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGenerateAiDescription: () => void;
  isGeneratingAi: boolean;
  // Search state
  prodSearchQuery: string;
  setProdSearchQuery: (q: string) => void;
  prodSubTab: string;
  setProdSubTab: (tab: string) => void;
}

export function AdminProducts({
  products,
  categories,
  onAddProduct,
  onDeleteProduct,
  onEditProduct,
  editingProduct,
  showProductForm,
  setShowProductForm,
  prodName,
  setProdName,
  prodCat,
  setProdCat,
  prodDesc,
  setProdDesc,
  prodStock,
  setProdStock,
  prodPosition,
  setProdPosition,
  prodPopular,
  setProdPopular,
  prodFestive,
  setProdFestive,
  prodImage,
  setProdImage,
  variants,
  setVariants,
  prodAllergens,
  setProdAllergens,
  prodShelfLife,
  setProdShelfLife,
  prodStorageInstructions,
  setProdStorageInstructions,
  prodBadges,
  setProdBadges,
  isUploadingImage,
  uploadError,
  handleImageUpload,
  handleGenerateAiDescription,
  isGeneratingAi,
  prodSearchQuery,
  setProdSearchQuery,
  prodSubTab,
  setProdSubTab,
}: AdminProductsProps) {
  // Drawer Active Form Tab State
  const [activeFormTab, setActiveFormTab] = useState<"general" | "pricing" | "inventory" | "details" | "media">("general");

  // Reorder Bulk Manager Drawer State
  const [showReorderDrawer, setShowReorderDrawer] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Variant helper input state
  const [newVarWeight, setNewVarWeight] = useState("500g");
  const [newVarPrice, setNewVarPrice] = useState("250");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 1. Lock background page scroll when form or reorder drawer is open
  useEffect(() => {
    if (showProductForm || showReorderDrawer) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showProductForm, showReorderDrawer]);

  useEffect(() => {
    if (showProductForm) {
      setActiveFormTab("general");
    }
  }, [showProductForm, editingProduct]);

  // Calculate Product KPIs
  const stats = useMemo(() => {
    const totalCount = products.length;
    const bestSellersCount = products.filter((p) => p.popular).length;
    const festiveCount = products.filter((p) => p.festivalSpecial).length;
    const lowStockCount = products.filter((p) => p.stock <= 10).length;

    let totalPriceSum = 0;
    let priceCount = 0;
    let totalInvValue = 0;

    products.forEach((p) => {
      if (p.prices) {
        Object.values(p.prices).forEach((pr) => {
          totalPriceSum += Number(pr) || 0;
          priceCount++;
        });
      }
      const firstPrice = p.prices ? Object.values(p.prices)[0] || 0 : 0;
      totalInvValue += (p.stock || 0) * (Number(firstPrice) || 0);
    });

    const avgPrice = priceCount > 0 ? Math.round(totalPriceSum / priceCount) : 0;

    return {
      totalCount,
      bestSellersCount,
      festiveCount,
      lowStockCount,
      avgPrice,
      totalInvValue,
    };
  }, [products]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filtered Products List sorted by Position
  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      const q = prodSearchQuery.toLowerCase();
      const matchesSearch =
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q));

      const matchesCat = (() => {
        if (prodSubTab === "all") return true;
        if (prodSubTab === "popular") return p.popular;
        if (prodSubTab === "festive") return p.festivalSpecial;
        if (prodSubTab === "lowstock") return p.stock <= 10;
        return p.category === prodSubTab;
      })();

      return matchesSearch && matchesCat;
    });

    return list.sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [products, prodSearchQuery, prodSubTab, refreshTrigger]);

  // Drag & Drop Handlers for Table & Drawer
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const list = [...filteredProducts];
    
    // Extract exact positions currently occupied by this filtered list
    // and sort them ascending so we re-distribute the same slots.
    const availablePositions = list.map(p => p.position || 0).sort((a, b) => a - b);
    
    const [draggedItem] = list.splice(draggedIndex, 1);
    list.splice(dropIndex, 0, draggedItem);

    setDraggedIndex(null);

    try {
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const newPos = availablePositions[i];
        
        // Mutate original object so changes reflect instantly
        item.position = newPos;
        
        await supabase.from("products").update({ position: newPos }).eq("id", item.id);
      }
      setRefreshTrigger(prev => prev + 1);
      showToast("✅ Product order updated successfully.", "success");
    } catch (err) {
      console.error("Failed to reorder products:", err);
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Name", "Category", "Stock", "BestSeller", "Festive", "Prices"];
    const rows = filteredProducts.map((p) => [
      p.id,
      p.name,
      p.category,
      p.stock,
      p.popular ? "YES" : "NO",
      p.festivalSpecial ? "YES" : "NO",
      JSON.stringify(p.prices || {}),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Mehta_Dairy_Products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Product catalog exported to CSV!", "success");
  };

  const handleAddVariant = () => {
    if (!newVarWeight || !newVarPrice) return;
    const exists = (variants || []).some((v) => v.weight === newVarWeight);
    if (exists) {
      showToast("Variant weight already exists!", "error");
      return;
    }
    const priceNum = Number(newVarPrice) || 0;
    setVariants([...(variants || []), { weight: newVarWeight, originalPrice: priceNum, offPercent: 0, finalPrice: priceNum }]);
    showToast(`Added ${newVarWeight} variant`, "success");
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in text-gray-900 font-sans">
      {/* ── 1. HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h3 className="font-serif text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-700" />
            🍬 Product Management CMS
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Manage sweet & farsan catalog items, pricing variants, stock inventories, and promotional tags.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowReorderDrawer(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs font-bold text-amber-900 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <GripVertical className="w-4 h-4 text-amber-700" />
            Manage Category Order
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-700" />
            Export CSV
          </button>

          <button
            onClick={() => onEditProduct(null)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Product Item
          </button>
        </div>
      </div>

      {/* ── 2. KPI ANALYTICS GRID (6 CARDS) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">TOTAL PRODUCTS</span>
          <div className="text-xl font-extrabold text-gray-900 mt-1">{stats.totalCount}</div>
          <span className="text-[10px] text-gray-500 font-medium mt-0.5">Active Catalog</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">BEST SELLERS</span>
          <div className="text-xl font-extrabold text-amber-700 mt-1">⭐ {stats.bestSellersCount}</div>
          <span className="text-[10px] text-amber-600 font-medium mt-0.5">Popular Sweets</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">FESTIVE ITEMS</span>
          <div className="text-xl font-extrabold text-orange-600 mt-1">🎉 {stats.festiveCount}</div>
          <span className="text-[10px] text-orange-500 font-medium mt-0.5">Festival Specials</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">LOW STOCK ALERTS</span>
          <div className="text-xl font-extrabold text-rose-700 mt-1">{stats.lowStockCount}</div>
          <span className="text-[10px] text-rose-600 font-medium mt-0.5">&le; 10 Units Remaining</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">AVERAGE PRICE</span>
          <div className="text-xl font-extrabold text-amber-800 font-serif mt-1">₹{stats.avgPrice}</div>
          <span className="text-[10px] text-gray-500 font-medium mt-0.5">Across Variants</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">INVENTORY VALUE</span>
          <div className="text-xl font-extrabold text-emerald-700 font-serif mt-1">₹{stats.totalInvValue.toLocaleString()}</div>
          <span className="text-[10px] text-emerald-600 font-medium mt-0.5">Estimated Stock</span>
        </div>
      </div>

      {/* ── 3. SEARCH BAR & SEGMENT FILTERS ── */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus-within:border-amber-700 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search by Product Name, Category, Description, Tags..."
              value={prodSearchQuery}
              onChange={(e) => setProdSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 font-medium"
            />
            {prodSearchQuery && (
              <button onClick={() => setProdSearchQuery("")} className="text-gray-400 hover:text-gray-700 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5 border-t border-gray-100">
          <button
            onClick={() => setProdSubTab("all")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-all cursor-pointer ${
              prodSubTab === "all" ? "bg-amber-700 text-white font-bold shadow-2xs" : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setProdSubTab("popular")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-all cursor-pointer ${
              prodSubTab === "popular" ? "bg-amber-700 text-white font-bold shadow-2xs" : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            ⭐ Best Sellers
          </button>
          <button
            onClick={() => setProdSubTab("festive")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-all cursor-pointer ${
              prodSubTab === "festive" ? "bg-amber-700 text-white font-bold shadow-2xs" : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            🎉 Festive Specials
          </button>
          <button
            onClick={() => setProdSubTab("lowstock")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-all cursor-pointer ${
              prodSubTab === "lowstock" ? "bg-amber-700 text-white font-bold shadow-2xs" : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            ⚠ Low Stock (&le;10)
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setProdSubTab(cat.slug)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-all cursor-pointer ${
                prodSubTab === cat.slug ? "bg-amber-700 text-white font-bold shadow-2xs" : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. PRODUCT LISTING TABLE WITH DRAG & DROP ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Package className="w-12 h-12 text-gray-300 mb-3" />
            <h4 className="font-serif font-bold text-base text-gray-900">No Products Found</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">No items matched your search criteria or category filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5 w-10 text-center">Sort</th>
                  <th className="p-3.5">Item</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Price Variants</th>
                  <th className="p-3.5">Stock Progress</th>
                  <th className="p-3.5">Badges</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredProducts.map((p, idx) => {
                  const isLowStock = p.stock <= 10;
                  const isOutOfStock = p.stock === 0;

                  return (
                    <tr
                      key={p.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, idx)}
                      className={`hover:bg-amber-50/30 transition-colors ${
                        draggedIndex === idx ? "opacity-40 bg-amber-100/50" : ""
                      }`}
                    >
                      {/* Drag Handle */}
                      <td className="p-3.5 text-center cursor-grab active:cursor-grabbing text-gray-400 hover:text-amber-700">
                        <GripVertical className="w-4 h-4 mx-auto" />
                      </td>

                      {/* Product Name & Thumbnail */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0] || "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=100"}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                          />
                          <div className="flex flex-col">
                            <span className="font-extrabold text-gray-900">{p.name}</span>
                            <span className="text-[10px] text-gray-400 line-clamp-1 max-w-[200px]">{p.description}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5 font-semibold text-gray-700 capitalize">
                        {p.category}
                      </td>

                      {/* Variants */}
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(p.prices || {}).map(([w, price]) => (
                            <span key={w} className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                              {w}: ₹{price}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Stock Progress Indicator */}
                      <td className="p-3.5 min-w-[130px]">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className={isOutOfStock ? "text-rose-700" : isLowStock ? "text-amber-700" : "text-emerald-700"}>
                              {p.stock} Units
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                isOutOfStock ? "bg-rose-600" : isLowStock ? "bg-amber-600" : "bg-emerald-600"
                              }`}
                              style={{ width: `${Math.min((p.stock / 100) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Badges */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1">
                          {p.popular && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.5 rounded uppercase">
                              ⭐ Best Seller
                            </span>
                          )}
                          {p.festivalSpecial && (
                            <span className="text-[9px] bg-orange-100 text-orange-800 border border-orange-300 font-bold px-1.5 py-0.5 rounded uppercase">
                              🎉 Festive
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditProduct(p.id)}
                            className="p-1.5 text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded border border-gray-200 transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. BULK REORDER CATEGORY DRAWER ── */}
      {mounted ? createPortal(
      <AnimatePresence>
        {showReorderDrawer && (
          <div className="fixed inset-0 z-50 overflow-hidden font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReorderDrawer(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
            />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-screen max-w-lg bg-white border-l border-gray-200 shadow-2xl flex flex-col justify-between"
              >
                {/* Header */}
                <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                  <div>
                    <h4 className="font-serif font-black text-lg text-gray-900 flex items-center gap-2">
                      <GripVertical className="w-5 h-5 text-amber-700" />
                      Manage Category Sort Order
                    </h4>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      Drag products to reorder. Sort order updates automatically.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowReorderDrawer(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                  {filteredProducts.map((p, idx) => (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, idx)}
                      className={`p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between shadow-2xs hover:border-amber-400 transition-all ${
                        draggedIndex === idx ? "opacity-40 bg-amber-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing hover:text-amber-700" />
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <img
                          src={p.images?.[0] || "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=100"}
                          alt={p.name}
                          className="w-9 h-9 rounded-lg object-cover border border-gray-200 shrink-0"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-gray-900">{p.name}</span>
                          <span className="text-[10px] text-gray-400 capitalize">{p.category}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 text-right">
                  <button
                    onClick={() => setShowReorderDrawer(false)}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-2xs cursor-pointer"
                  >
                    Done Reordering
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>,
      document.body
      ) : null}

      {/* ── 6. FULLSCREEN DRAWER TABBED MODAL (ADD / EDIT PRODUCT) ── */}
      {mounted ? createPortal(
      <AnimatePresence>
        {showProductForm && (
          <div className="fixed inset-0 z-50 overflow-hidden font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProductForm(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
            />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-screen max-w-2xl bg-white border-l border-gray-200 shadow-2xl flex flex-col justify-between"
              >
                {/* Form Drawer Header */}
                <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                  <div>
                    <h4 className="font-serif font-black text-lg text-gray-900">
                      {editingProduct ? `Edit Details: ${editingProduct.name}` : "Create Sweet Catalog Product"}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      {editingProduct ? `ID: ${editingProduct.id}` : "Configure pricing variants, allergens, and inventory."}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowProductForm(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Tabs Bar */}
                <div className="flex border-b border-gray-200 bg-gray-50 px-5 text-xs font-bold text-gray-600 gap-2 overflow-x-auto">
                  {[
                    { id: "general", label: "General" },
                    { id: "pricing", label: "Pricing & Variants" },
                    { id: "inventory", label: "Inventory" },
                    { id: "details", label: "Details & Allergens" },
                    { id: "media", label: "Media Upload" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFormTab(tab.id as any)}
                      className={`py-2.5 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                        activeFormTab === tab.id
                          ? "border-amber-700 text-amber-800 font-extrabold"
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Form Content Body */}
                <form onSubmit={onAddProduct} className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* TAB 1: GENERAL */}
                  {activeFormTab === "general" && (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase">Product Name *</label>
                        <input
                          type="text"
                          value={prodName}
                          onChange={(e) => setProdName(e.target.value)}
                          placeholder="e.g. Dry Fruit Kesar Mesub"
                          className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white font-medium outline-none focus:border-amber-700"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase">Category *</label>
                        <select
                          value={prodCat}
                          onChange={(e) => setProdCat(e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white font-bold outline-none cursor-pointer"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-gray-700 uppercase">Product Description *</label>
                          <button
                            type="button"
                            onClick={handleGenerateAiDescription}
                            disabled={isGeneratingAi}
                            className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-amber-700" />
                            {isGeneratingAi ? "Generating..." : "Generate AI Copy"}
                          </button>
                        </div>
                        <textarea
                          value={prodDesc}
                          onChange={(e) => setProdDesc(e.target.value)}
                          rows={4}
                          placeholder="Crafted with pure desi cow ghee and crushed badam..."
                          className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white font-medium outline-none focus:border-amber-700"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PRICING & VARIANTS */}
                  {activeFormTab === "pricing" && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                        <span className="text-xs font-bold text-gray-900 uppercase block">Add Weight & Price Variant</span>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Weight (e.g. 500g)"
                            value={newVarWeight}
                            onChange={(e) => setNewVarWeight(e.target.value)}
                            className="text-xs p-2 border border-gray-200 rounded-lg bg-white font-semibold"
                          />
                          <input
                            type="number"
                            placeholder="Price (₹)"
                            value={newVarPrice}
                            onChange={(e) => setNewVarPrice(e.target.value)}
                            className="text-xs p-2 border border-gray-200 rounded-lg bg-white font-semibold"
                          />
                          <button
                            type="button"
                            onClick={handleAddVariant}
                            className="px-3 py-2 bg-amber-700 text-white font-bold text-xs rounded-lg hover:bg-amber-800 transition-colors cursor-pointer"
                          >
                            + Add Variant
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-bold text-gray-700 uppercase">Configured Price Variants</span>
                        {(Array.isArray(variants) ? variants : []).map((v, idx) => {
                          if (!v || typeof v !== "object") return null;
                          const weightStr = v.weight || "Variant";
                          const priceVal = v.finalPrice ?? v.price ?? v.originalPrice ?? 0;
                          return (
                            <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-xl text-xs">
                              <span className="font-bold text-gray-900">{weightStr}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-extrabold font-serif text-amber-800 text-sm">₹{priceVal}</span>
                                <button
                                  type="button"
                                  onClick={() => setVariants((Array.isArray(variants) ? variants : []).filter((_, i) => i !== idx))}
                                  className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: INVENTORY */}
                  {activeFormTab === "inventory" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-700 uppercase">Stock Units *</label>
                          <input
                            type="number"
                            value={prodStock}
                            onChange={(e) => setProdStock(e.target.value)}
                            className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white font-bold"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-700 uppercase">Position (Sort Order)</label>
                          <input
                            type="number"
                            value={prodPosition}
                            onChange={(e) => setProdPosition(e.target.value)}
                            className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                          <span className="text-xs font-bold text-gray-900">⭐ Mark as Best Seller</span>
                          <input type="checkbox" checked={prodPopular} onChange={(e) => setProdPopular(e.target.checked)} className="w-4 h-4 accent-amber-700 cursor-pointer" />
                        </label>

                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                          <span className="text-xs font-bold text-gray-900">🎉 Mark as Festive Special</span>
                          <input type="checkbox" checked={prodFestive} onChange={(e) => setProdFestive(e.target.checked)} className="w-4 h-4 accent-amber-700 cursor-pointer" />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: DETAILS & ALLERGENS */}
                  {activeFormTab === "details" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-700 uppercase">Shelf Life (Days)</label>
                          <input
                            type="number"
                            value={prodShelfLife}
                            onChange={(e) => setProdShelfLife(e.target.value)}
                            placeholder="e.g. 15"
                            className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white font-semibold"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-700 uppercase">Storage Instructions</label>
                          <input
                            type="text"
                            value={prodStorageInstructions}
                            onChange={(e) => setProdStorageInstructions(e.target.value)}
                            placeholder="Refrigerate after opening"
                            className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white font-semibold"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-bold text-gray-700 uppercase">Allergen Information</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {["Contains Milk", "Contains Cashew", "Contains Almond", "Contains Pistachio", "Contains Gluten"].map((allergen) => {
                            const safeAllergens = Array.isArray(prodAllergens) ? prodAllergens : [];
                            const checked = safeAllergens.includes(allergen);
                            return (
                              <label key={allergen} className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer font-semibold">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    if (checked) setProdAllergens(safeAllergens.filter((a) => a !== allergen));
                                    else setProdAllergens([...safeAllergens, allergen]);
                                  }}
                                  className="w-4 h-4 accent-amber-700 cursor-pointer"
                                />
                                <span>{allergen}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: MEDIA */}
                  {activeFormTab === "media" && (
                    <div className="space-y-4">
                      <span className="text-xs font-bold text-gray-700 uppercase block">Product Cover Image (Upload or Paste Link)</span>
                      <div className="flex flex-col gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center shrink-0">
                            {prodImage ? (
                              <img src={prodImage} alt="Product Preview" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-8 h-8 text-gray-300" />
                            )}
                          </div>
                          <div className="space-y-2 flex-1">
                            <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl cursor-pointer">
                              <UploadCloud className="w-4 h-4" />
                              {isUploadingImage ? "Uploading to Storage..." : "Upload Image File"}
                              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                            </label>
                            <p className="text-[10px] text-gray-500">Max size 5MB. Optimized for web catalog.</p>
                            {uploadError && <span className="text-xs text-rose-600 font-bold block">{uploadError}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 items-center pt-2 border-t border-gray-200/60">
                          <input 
                            type="text" 
                            placeholder="Or paste direct product image URL link..."
                            value={prodImage}
                            onChange={(e) => setProdImage(e.target.value)}
                            className="flex-1 min-h-[38px] px-3 text-xs border border-gray-200 bg-white rounded-xl focus:border-amber-700 focus:ring-1 focus:ring-amber-700 outline-none"
                          />
                          {prodImage && (
                            <button
                              type="button"
                              onClick={() => setProdImage("")}
                              className="px-3 min-h-[38px] border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sticky Footer Actions */}
                  <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowProductForm(false)}
                      className="px-4 py-2 border border-gray-200 text-xs font-bold text-gray-700 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                    >
                      {editingProduct ? "Save Changes" : "Create Product"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>,
      document.body
      ) : null}
    </div>
  );
}
