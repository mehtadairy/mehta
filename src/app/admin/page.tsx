"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { 
  saveProducts, 
  getOrders, 
  saveOrders, 
  getCoupons, 
  saveCoupons,
  Product, 
  Order, 
  Coupon 
} from "@/lib/types";
import { fetchProducts, supabase } from "@/lib/supabaseClient";
import imageCompression from "browser-image-compression";
import AdminCategories from "@/components/AdminCategories";
import AdminBanners from "@/components/AdminBanners";
import AdminCMS from "@/components/AdminCMS";
import AdminNotifications from "@/components/AdminNotifications";
import AdminPayments from "@/components/AdminPayments";
import AdminAnalytics from "@/components/AdminAnalytics";
import AdminBackups from "@/components/AdminBackups";
import { 
  LayoutDashboard, 
  Dessert, 
  ShoppingBag, 
  Users, 
  Tag, 
  Plus, 
  Trash2, 
  Edit, 
  TrendingUp, 
  IndianRupee, 
  Check,
  X,
  UploadCloud,
  Loader2,
  Phone,
  FileText,
  Bell,
  Database
} from "lucide-react";

export default function AdminPanel() {
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "orders" | "customers" | "categories" | "banners" | "cms" | "notifications" | "payments" | "backups">("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);

  // Product CRUD states
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Product Form states
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodCat, setProdCat] = useState("milk-sweets");
  const [prodPrice250, setProdPrice250] = useState("");
  const [prodPrice500, setProdPrice500] = useState("");
  const [prodPrice1kg, setProdPrice1kg] = useState("");
  const [prodStock, setProdStock] = useState("100");
  const [prodPopular, setProdPopular] = useState(false);
  const [prodFestive, setProdFestive] = useState(false);
  const [prodImage, setProdImage] = useState("https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  
  // Load Admin Data
  useEffect(() => {
    if (!isAdminAuth) {
      const stored = localStorage.getItem("mehta_admin_auth");
      if (stored === "true") setIsAdminAuth(true);
      return;
    }

    const loadData = async () => {
      const allProducts = await fetchProducts();
      setProducts(allProducts);
      
      const { data: userOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (!ordersError && userOrders) {
         const formattedOrders = userOrders.map((o: any) => ({
           id: o.id,
           orderNumber: o.order_number,
           date: new Date(o.created_at).toLocaleDateString(),
           status: o.status,
           total: o.total,
           paymentStatus: o.payment_status,
           userName: o.user_name,
           userPhone: o.user_phone,
           items: o.order_items ? o.order_items.map((i: any) => ({
              productId: i.product_id,
              productName: i.product_name,
              weight: i.weight,
              quantity: i.quantity,
              price: i.price,
              image: i.image
           })) : []
         }));
         setOrders(formattedOrders as any);
      } else {
         setOrders(getOrders());
      }
      
      
      const { data: cats } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
      if (cats) setCategories(cats);

      const { data: bans } = await supabase.from('banners').select('*').order('sort_order', { ascending: true });
      if (bans) setBanners(bans);

    };
    if (isAdminAuth) loadData();
  }, [activeTab, isAdminAuth]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      if (res.ok) {
        setIsAdminAuth(true);
        localStorage.setItem("mehta_admin_auth", "true");
      } else {
        const data = await res.json();
        setLoginError(data.error || "Login failed");
      }
    } catch (e) {
      setLoginError("Network error");
    }
  };

  // Calculations for Stats Card
  const totalRevenue = orders
    .filter(o => o.paymentStatus === "Paid")
    .reduce((sum, o) => sum + o.total, 0);

  const totalCustomers = Array.from(new Set(orders.map(o => o.userName))).length || 1;

  // --- PRODUCT CRUD ACTIONS ---
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodDesc) return;

    // Price size parser
    const parsedPrices: { [weight: string]: number } = {};
    if (prodPrice250) parsedPrices["250g"] = Number(prodPrice250);
    if (prodPrice500) parsedPrices["500g"] = Number(prodPrice500);
    if (prodPrice1kg) parsedPrices["1kg"] = Number(prodPrice1kg);

    if (Object.keys(parsedPrices).length === 0) {
      // Default fallback pricing
      parsedPrices["500g"] = 400;
    }

    if (editingProduct) {
      // EDIT MODE
      const { error } = await supabase.from('products').update({
        name: prodName,
        description: prodDesc,
        category_slug: prodCat,
        prices: parsedPrices,
        stock: Number(prodStock),
        popular: prodPopular,
        festival_special: prodFestive,
        images: [prodImage]
      }).eq('id', editingProduct.id);
      
      if (!error) {
        setProducts(products.map(p => p.id === editingProduct.id ? {
          ...p,
          name: prodName,
          description: prodDesc,
          category: prodCat,
          prices: parsedPrices,
          stock: Number(prodStock),
          popular: prodPopular,
          festivalSpecial: prodFestive,
          images: [prodImage]
        } : p));
        setEditingProduct(null);
      } else {
        console.error("Failed to update product:", error);
      }
    } else {
      // ADD MODE
      const { data, error } = await supabase.from('products').insert([{
        name: prodName,
        description: prodDesc,
        category_slug: prodCat,
        prices: parsedPrices,
        stock: Number(prodStock),
        popular: prodPopular,
        festival_special: prodFestive,
        images: [prodImage],
        rating: 5.0,
        reviews_count: 0
      }]).select();

      if (!error && data) {
        const newP = data[0];
        const newProd: Product = {
          id: newP.id,
          name: newP.name,
          description: newP.description,
          category: newP.category_slug,
          prices: newP.prices,
          popular: newP.popular,
          festivalSpecial: newP.festival_special,
          rating: newP.rating || 5.0,
          reviewsCount: newP.reviews_count || 0,
          stock: newP.stock,
          images: newP.images
        };
        setProducts([newProd, ...products]);
      } else {
        console.error("Failed to insert product:", error);
      }
    }

    // Reset fields
    setProdName("");
    setProdDesc("");
    setProdPrice250("");
    setProdPrice500("");
    setProdPrice1kg("");
    setProdStock("100");
    setProdPopular(false);
    setProdFestive(false);
    setShowProductForm(false);
  };

  const handleEditProductClick = (product: Product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdDesc(product.description);
    setProdCat(product.category);
    setProdPrice250(product.prices["250g"]?.toString() || "");
    setProdPrice500(product.prices["500g"]?.toString() || "");
    setProdPrice1kg(product.prices["1kg"]?.toString() || "");
    setProdStock(product.stock.toString());
    setProdPopular(product.popular);
    setProdFestive(product.festivalSpecial);
    setProdImage(product.images[0]);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        console.error("Failed to delete product:", error);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5MB");
      return;
    }

    // Validate type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please select a valid image file (JPG, PNG, WEBP)");
      return;
    }

    setUploadError("");
    setIsUploadingImage(true);

    try {
      // 1. Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: "image/webp"
      };
      
      const compressedFile = await imageCompression(file, options);
      
      // 2. Generate unique filename
      const fileExt = "webp";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      // 3. Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/webp'
        });

      if (error) {
        throw error;
      }

      // 4. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setProdImage(publicUrlData.publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // --- ORDER MANAGEMENT ACTIONS ---
  const handleUpdateOrderStatus = async (orderId: string, newStatus: any) => {
    const payStatus = newStatus === 'Delivered' ? 'Paid' : orders.find(o => o.id === orderId)?.paymentStatus;

    const { error } = await supabase.from('orders').update({
      status: newStatus,
      payment_status: payStatus
    }).eq('id', orderId);

    if (!error) {
      const updated = orders.map(o => {
        if (o.id === orderId) {
          return { ...o, status: newStatus, paymentStatus: payStatus as string };
        }
        return o;
      });
      setOrders(updated as any);
    } else {
      console.error("Failed to update order:", error);
    }
  };

  if (!isAdminAuth) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
          <div>
            <h2 className="mt-6 text-center text-3xl font-serif font-bold text-brand-charcoal">
              Admin Portal
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleAdminLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-brand-beige placeholder-gray-500 text-brand-charcoal focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm mb-4"
                  placeholder="Admin Email address"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-brand-beige placeholder-gray-500 text-brand-charcoal focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>
            {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-brand-orange hover:bg-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange transition-colors shadow-lg"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <WhatsAppFloat />

      {/* --- PAGE HEADER --- */}
      <section className="bg-brand-cream border-b border-brand-beige py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-bold text-brand-charcoal text-center font-bold">
            Mehta Sweet Mart Management Panel
          </h2>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Update inventory catalogs, check order invoices, view buyers directories, and configure marketing coupons.
          </p>
        </div>
      </section>

      {/* --- ADMIN SHELL WORKSPACE --- */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-3 flex flex-col gap-1.5 bg-white border border-brand-beige p-5 rounded-2xl shadow-xs">
              <button 
                onClick={() => setActiveTab("dashboard")}
                className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "dashboard" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
              >
                <LayoutDashboard className="h-4 w-4" /> Administrative Overview
              </button>
              <button 
                onClick={() => setActiveTab("products")}
                className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "products" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
              >
                <Dessert className="h-4 w-4" /> Sweet Inventory ({products.length})
              </button>
              <button 
                onClick={() => setActiveTab("orders")}
                className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "orders" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
              >
                <ShoppingBag className="h-4 w-4" /> Invoices Tracking ({orders.length})
              </button>
              <button 
                onClick={() => setActiveTab("customers")}
                className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "customers" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
              >
                <Users className="h-4 w-4" /> Customers Directory
              </button>
              <button 
                onClick={() => setActiveTab("categories")}
                className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "categories" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
              >
                <Dessert className="h-4 w-4" /> Category Management
              </button>
              <button 
                onClick={() => setActiveTab("banners")}
                className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "banners" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
              >
                <UploadCloud className="h-4 w-4" /> Homepage Banners
              </button>
              <button 
                onClick={() => setActiveTab("cms")}
                className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "cms" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
              >
                <FileText className="h-4 w-4" /> CMS Pages
              </button>
              <button 
                onClick={() => setActiveTab("notifications")}
                className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "notifications" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
              >
                <Bell className="h-4 w-4" /> Notifications
              </button>
              <button 
                onClick={() => setActiveTab("payments")}
                className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "payments" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
              >
                <IndianRupee className="h-4 w-4" /> Payments
              </button>
              <button 
                onClick={() => setActiveTab("backups")}
                className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "backups" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
              >
                <Database className="h-4 w-4" /> Backups
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem("mehta_admin_auth");
                  setIsAdminAuth(false);
                }}
                className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-red-500 hover:bg-red-50`}
              >
                Logout
              </button>
            </aside>

            {/* Main Tabs Container */}
            <main className="lg:col-span-9 bg-white border border-brand-beige rounded-2xl p-6 sm:p-8 shadow-xs min-h-[450px]">
              
              {/* ==================== TAB 1: DASHBOARD ANALYTICS ==================== */}
              {activeTab === "dashboard" && (
                <AdminAnalytics />
              )}

              {/* ==================== TAB 2: PRODUCTS CRUD ==================== */}
              {activeTab === "products" && (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-brand-beige pb-3">
                    <h3 className="font-serif text-lg font-bold text-brand-charcoal">
                      Sweet Catalog Management
                    </h3>
                    {!showProductForm && (
                      <button 
                        onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
                        className="inline-flex items-center gap-1 text-xs font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg px-4 py-2 transition-colors shadow-xs"
                      >
                        <Plus className="h-4 w-4" /> Add Product Item
                      </button>
                    )}
                  </div>

                  {/* Product Form Modal/Panel */}
                  {showProductForm && (
                    <form onSubmit={handleAddProduct} className="bg-brand-cream/35 border border-brand-beige rounded-2xl p-6 flex flex-col gap-4 animate-fade-in-up">
                      <div className="flex items-center justify-between border-b border-brand-beige pb-3 mb-2">
                        <h4 className="font-serif text-sm font-bold text-brand-charcoal">
                          {editingProduct ? `Edit Details: ${editingProduct.name}` : "Create Sweet / Savior Item"}
                        </h4>
                        <button type="button" onClick={() => setShowProductForm(false)} className="p-1 hover:bg-brand-cream rounded-full"><X className="h-4.5 w-4.5" /></button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Product Name *</label>
                          <input 
                            type="text" 
                            value={prodName}
                            onChange={(e) => setProdName(e.target.value)}
                            placeholder="e.g. Dry Fruit Halwa"
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Product Category</label>
                          <select 
                            value={prodCat}
                            onChange={(e) => setProdCat(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white cursor-pointer font-semibold"
                          >
                            <option value="milk-sweets">Sweets of Pure Milk</option>
                            <option value="ghee-sweets">Sweets of Pure Ghee</option>
                            <option value="farsan">Tasty & Chat-Patta Farsan</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Description Details *</label>
                        <textarea 
                          value={prodDesc}
                          onChange={(e) => setProdDesc(e.target.value)}
                          placeholder="Crafted with pure cow ghee and filled with crushed badam..."
                          className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none min-h-[80px]"
                          required
                        ></textarea>
                      </div>

                      {/* Pricing weights */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-brand-beige pt-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Price: 250g Box (₹)</label>
                          <input 
                            type="number" 
                            value={prodPrice250}
                            onChange={(e) => setProdPrice250(e.target.value)}
                            placeholder="e.g. 200"
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Price: 500g Box (₹)</label>
                          <input 
                            type="number" 
                            value={prodPrice500}
                            onChange={(e) => setProdPrice500(e.target.value)}
                            placeholder="e.g. 400"
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Price: 1kg Box (₹)</label>
                          <input 
                            type="number" 
                            value={prodPrice1kg}
                            onChange={(e) => setProdPrice1kg(e.target.value)}
                            placeholder="e.g. 780"
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Stock & Flags */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Stock units</label>
                          <input 
                            type="number" 
                            value={prodStock}
                            onChange={(e) => setProdStock(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white"
                          />
                        </div>
                        
                        <label className="flex items-center gap-2 text-xs font-semibold text-brand-charcoal mt-5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={prodPopular}
                            onChange={() => setProdPopular(!prodPopular)}
                            className="accent-brand-orange h-4 w-4"
                          />
                          <span>Best Seller Tag</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-semibold text-brand-charcoal mt-5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={prodFestive}
                            onChange={() => setProdFestive(!prodFestive)}
                            className="accent-brand-orange h-4 w-4"
                          />
                          <span>Festive Special Flag</span>
                        </label>
                      </div>

                      <div className="flex flex-col gap-1.5 mt-2">
                        <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Product Image (Supabase Storage)</label>
                        
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                          {/* Image Preview */}
                          <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-brand-beige bg-brand-cream/50 flex-shrink-0 flex justify-center items-center">
                            {isUploadingImage ? (
                              <Loader2 className="h-6 w-6 text-brand-orange animate-spin" />
                            ) : prodImage ? (
                              <img src={prodImage} alt="Product Preview" className="h-full w-full object-cover" />
                            ) : (
                              <Dessert className="h-8 w-8 text-brand-beige" />
                            )}
                          </div>
                          
                          {/* Upload Controls */}
                          <div className="flex flex-col gap-2 flex-grow">
                            <label className={`cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors border ${isUploadingImage ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-brand-charcoal border-brand-beige hover:border-brand-orange hover:text-brand-orange shadow-sm'}`}>
                              <UploadCloud className="h-4 w-4" />
                              {isUploadingImage ? 'Uploading to Supabase...' : 'Select Image File'}
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/jpeg, image/png, image/webp"
                                onChange={handleImageUpload}
                                disabled={isUploadingImage}
                              />
                            </label>
                            
                            <p className="text-[0.65rem] text-muted-foreground">
                              Max 5MB. Formats: JPG, PNG, WEBP. Images are auto-optimized.
                            </p>
                            
                            {uploadError && (
                              <p className="text-[0.65rem] text-red-500 font-bold">{uploadError}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-4 border-t border-brand-beige pt-4">
                        <button 
                          type="button" 
                          onClick={() => setShowProductForm(false)}
                          className="px-4 py-2 border border-brand-beige hover:border-brand-gold rounded-lg text-xs font-bold text-brand-charcoal"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="px-5 py-2 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg text-xs font-bold"
                        >
                          {editingProduct ? "Save Changes" : "Create Product"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Products catalog list table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-brand-beige text-muted-foreground font-semibold">
                          <th className="py-2.5">Item Details</th>
                          <th className="py-2.5">Category</th>
                          <th className="py-2.5">Sizes Available</th>
                          <th className="py-2.5">Stock</th>
                          <th className="py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.id} className="border-b border-brand-beige/50">
                            <td className="py-3">
                              <div className="flex gap-2.5 items-center">
                                <img src={p.images[0]} alt={p.name} className="h-9 w-9 object-cover rounded bg-brand-cream" />
                                <span className="font-bold text-brand-charcoal">{p.name}</span>
                              </div>
                            </td>
                            <td className="py-3 uppercase text-[0.65rem] font-bold text-brand-gold">{p.category}</td>
                            <td className="py-3 font-semibold">{Object.keys(p.prices).join(", ")}</td>
                            <td className="py-3 font-semibold">{p.stock} units</td>
                            <td className="py-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <button 
                                  onClick={() => handleEditProductClick(p)}
                                  className="h-8 w-8 rounded-lg border border-brand-beige hover:border-brand-gold flex items-center justify-center text-brand-charcoal hover:bg-brand-cream transition-colors"
                                  title="Edit details"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="h-8 w-8 rounded-lg border border-red-200 hover:border-red-500 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                                  title="Delete item"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== TAB 3: INVOICES ==================== */}
              {activeTab === "orders" && (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <h3 className="font-serif text-lg font-bold text-brand-charcoal border-b border-brand-beige pb-3">
                    Order Invoices Management
                  </h3>

                  {orders.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-12">No orders recorded in system databases.</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {orders.map((o) => (
                        <div key={o.id} className="border border-brand-beige rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start gap-4 shadow-xs bg-brand-cream/10">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-serif text-sm font-bold text-brand-charcoal">{o.orderNumber}</span>
                              <span className="text-[0.68rem] text-muted-foreground">• {o.date}</span>
                              <span className="text-[0.68rem] bg-emerald-50 text-emerald-800 border border-emerald-200 rounded px-1.5 py-0.2 font-semibold">
                                {o.paymentStatus}
                              </span>
                            </div>
                            
                            <p className="text-xs text-brand-charcoal font-semibold mt-2.5">
                              Buyer: {o.userName} ({o.userPhone})
                            </p>
                            
                            <ul className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
                              {o.items.map((item, idx) => (
                                <li key={idx}>• {item.productName} ({item.weight}) x {item.quantity}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex flex-col items-start sm:items-end gap-3.5 w-full sm:w-auto border-t sm:border-t-0 border-brand-beige pt-3 sm:pt-0">
                            <span className="font-serif font-bold text-brand-orange text-base leading-none">
                              Total: ₹{o.total}
                            </span>
                            
                            {/* Status Changer */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[0.68rem] text-muted-foreground font-bold uppercase">Status:</span>
                              <select 
                                value={o.status}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                className="border border-brand-beige rounded-md px-2 py-1 text-xs bg-white text-brand-charcoal cursor-pointer font-bold"
                              >
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ==================== TAB 4: CUSTOMERS ==================== */}
              {activeTab === "customers" && (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <h3 className="font-serif text-lg font-bold text-brand-charcoal border-b border-brand-beige pb-3">
                    Customer Database Directory
                  </h3>

                  {orders.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-12">No registered customer transactions found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-brand-beige text-muted-foreground font-semibold">
                            <th className="py-2.5">Customer Name</th>
                            <th className="py-2.5">Mobile Phone</th>
                            <th className="py-2.5">Total Orders placed</th>
                            <th className="py-2.5 text-right">Lifetime purchase value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from(new Set(orders.map(o => o.userName))).map((name, idx) => {
                            const customerOrders = orders.filter(o => o.userName === name);
                            const customerPhone = customerOrders[0]?.userPhone || "N/A";
                            const lifetimeSpend = customerOrders.reduce((sum, o) => sum + o.total, 0);

                            return (
                              <tr key={idx} className="border-b border-brand-beige/50">
                                <td className="py-3 font-bold text-brand-charcoal">{name}</td>
                                <td className="py-3 font-semibold">{customerPhone}</td>
                                <td className="py-3 font-semibold">{customerOrders.length} order(s)</td>
                                <td className="py-3 text-right font-serif font-bold text-brand-orange">₹{lifetimeSpend}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {/* ==================== TAB 6: CATEGORIES ==================== */}
              {activeTab === "categories" && (
                <AdminCategories categories={categories} setCategories={setCategories} />
              )}

              {/* ==================== TAB 7: BANNERS ==================== */}
              {activeTab === "banners" && (
                <AdminBanners banners={banners} setBanners={setBanners} />
              )}

              {/* ==================== TAB 8: CMS PAGES ==================== */}
              {activeTab === "cms" && <AdminCMS />}
              
              {/* ==================== TAB 9: NOTIFICATIONS ==================== */}
              {activeTab === "notifications" && <AdminNotifications />}
              
              {/* ==================== TAB 10: PAYMENTS ==================== */}
              {activeTab === "payments" && <AdminPayments />}
              
              {/* ==================== TAB 11: BACKUPS ==================== */}
              {activeTab === "backups" && <AdminBackups />}

            </main>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
