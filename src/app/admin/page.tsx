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
import { fetchProducts, fetchIngredients, addIngredient, updateProductIngredients, supabase } from "@/lib/supabaseClient";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";
import AdminCategories from "@/components/AdminCategories";
import AdminBanners from "@/components/AdminBanners";
import AdminNotifications from "@/components/AdminNotifications";
import AdminPayments from "@/components/AdminPayments";
import AdminAnalytics from "@/components/AdminAnalytics";
import AdminBackups from "@/components/AdminBackups";
import AdminIngredients from "@/components/AdminIngredients";
import AdminDeliveryZones from "@/components/AdminDeliveryZones";
import { 
  LayoutDashboard, 
  Dessert, 
  ShoppingBag, 
  Users, 
  Tag, 
  MapPin,
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
  Database,
  Search
} from "lucide-react";

export default function AdminPanel() {
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "orders" | "customers" | "categories" | "banners" | "notifications" | "payments" | "backups" | "ingredients" | "zones">("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [dbCustomers, setDbCustomers] = useState<any[]>([]);

  // Product CRUD states
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodIngredients, setProdIngredients] = useState<string[]>([]); // stores selected ingredient UUIDs
  const [prodSubTab, setProdSubTab] = useState<"all" | "milk-sweets" | "ghee-sweets" | "farsan">("all");
  const [prodSearchQuery, setProdSearchQuery] = useState("");
  
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

  // Ingredients and Food states
  const [allIngredients, setAllIngredients] = useState<any[]>([]);
  const [ingSearchQuery, setIngSearchQuery] = useState("");
  const [prodShelfLife, setProdShelfLife] = useState("12");
  const [prodStorageInstructions, setProdStorageInstructions] = useState("Store in a cool and dry place.");
  const [prodAllergens, setProdAllergens] = useState<string[]>([]);
  const [prodDietaryTags, setProdDietaryTags] = useState<string[]>([]);
  const [prodHighlights, setProdHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const handleGenerateAiDescription = async () => {
    if (!prodName) {
      alert("Please enter a product name first.");
      return;
    }
    
    setIsGeneratingAi(true);
    try {
      const selectedIngNames = allIngredients
        .filter(ing => prodIngredients.includes(ing.id))
        .map(ing => ing.name);

      const weights = [];
      if (prodPrice250) weights.push("250g");
      if (prodPrice500) weights.push("500g");
      if (prodPrice1kg) weights.push("1kg");
      
      const res = await fetch("/api/admin/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: prodName,
          category: prodCat,
          ingredients: selectedIngNames,
          weight: weights.join(", "),
          shelfLife: prodShelfLife,
          storageInstructions: prodStorageInstructions
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const info = data.data;
        // Autofill description (append Why Choose Mehta Dairy)
        const combinedDesc = `${info.description}\n\nWhy Choose Mehta Dairy:\n${info.whyChoose}`;
        setProdDesc(combinedDesc);
        
        // Autofill highlights (key features)
        if (info.keyFeatures && info.keyFeatures.length > 0) {
          setProdHighlights(info.keyFeatures);
        }
        
        // Autofill shelf life & storage
        if (info.shelfLife) setProdShelfLife(info.shelfLife.toString());
        if (info.storageInstructions) setProdStorageInstructions(info.storageInstructions);
      } else {
        alert(data.error || "Failed to generate AI description.");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating AI description.");
    } finally {
      setIsGeneratingAi(false);
    }
  };
  
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
           userEmail: o.user_email,
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

      const { data: customerList } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (customerList) setDbCustomers(customerList);

      const dbIngredients = await fetchIngredients();
      setAllIngredients(dbIngredients);
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
        images: [prodImage],
        shelf_life: Number(prodShelfLife) || 12,
        storage_instructions: prodStorageInstructions,
        allergens: prodAllergens,
        dietary_tags: prodDietaryTags,
        highlights: prodHighlights
      }).eq('id', editingProduct.id);
      
      if (!error) {
        await updateProductIngredients(editingProduct.id, prodIngredients);
        const updatedIngredientNames = allIngredients
          .filter(ing => prodIngredients.includes(ing.id))
          .map(ing => ing.name);

        setProducts(products.map(p => p.id === editingProduct.id ? {
          ...p,
          name: prodName,
          description: prodDesc,
          category: prodCat,
          prices: parsedPrices,
          stock: Number(prodStock),
          popular: prodPopular,
          festivalSpecial: prodFestive,
          images: [prodImage],
          ingredients: updatedIngredientNames,
          ingredientIds: prodIngredients,
          shelfLife: Number(prodShelfLife) || 12,
          storageInstructions: prodStorageInstructions,
          allergens: prodAllergens,
          dietaryTags: prodDietaryTags,
          highlights: prodHighlights
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
        reviews_count: 0,
        shelf_life: Number(prodShelfLife) || 12,
        storage_instructions: prodStorageInstructions,
        allergens: prodAllergens,
        dietary_tags: prodDietaryTags,
        highlights: prodHighlights
      }]).select();

      if (!error && data) {
        const newP = data[0];
        await updateProductIngredients(newP.id, prodIngredients);
        const updatedIngredientNames = allIngredients
          .filter(ing => prodIngredients.includes(ing.id))
          .map(ing => ing.name);

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
          images: newP.images,
          ingredients: updatedIngredientNames,
          ingredientIds: prodIngredients,
          shelfLife: newP.shelf_life,
          storageInstructions: newP.storage_instructions,
          allergens: newP.allergens || [],
          dietaryTags: newP.dietary_tags || [],
          highlights: newP.highlights || []
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
    setProdIngredients([]);
    setProdShelfLife("12");
    setProdStorageInstructions("Store in a cool and dry place.");
    setProdAllergens([]);
    setProdDietaryTags([]);
    setProdHighlights([]);
    setNewHighlight("");
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
    setProdIngredients(product.ingredientIds || []);
    setProdShelfLife(product.shelfLife?.toString() || "12");
    setProdStorageInstructions(product.storageInstructions || "Store in a cool and dry place.");
    setProdAllergens(product.allergens || []);
    setProdDietaryTags(product.dietaryTags || []);
    setProdHighlights(product.highlights || []);
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
                onClick={() => setActiveTab("ingredients")}
                className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "ingredients" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
              >
                <Tag className="h-4 w-4" /> Ingredients Management
              </button>
              <button 
                onClick={() => setActiveTab("zones")}
                className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "zones" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
              >
                <MapPin className="h-4 w-4" /> Delivery Zones
              </button>
              <button 
                onClick={() => setActiveTab("banners")}
                className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "banners" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
              >
                <UploadCloud className="h-4 w-4" /> Homepage Banners
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

                  {/* Product Form Modal Popup */}
                  <AnimatePresence>
                    {showProductForm && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setShowProductForm(false)}
                          className="absolute inset-0 bg-black/50 backdrop-blur-xs"
                        ></motion.div>
                        
                        {/* Modal Container */}
                        <motion.div 
                          initial={{ scale: 0.95, y: 15, opacity: 0 }}
                          animate={{ scale: 1, y: 0, opacity: 1 }}
                          exit={{ scale: 0.95, y: 15, opacity: 0 }}
                          className="relative z-10 w-full max-w-2xl bg-white border border-brand-beige rounded-2xl p-6 sm:p-8 flex flex-col gap-4 shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                          <form onSubmit={handleAddProduct} className="flex flex-col gap-4 w-full">
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
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.slug}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Description Details *</label>
                          <button
                            type="button"
                            onClick={handleGenerateAiDescription}
                            disabled={isGeneratingAi}
                            className="bg-brand-orange/15 hover:bg-brand-orange/25 text-brand-orange px-2.5 py-1 text-[0.65rem] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {isGeneratingAi ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" /> Generating...
                              </>
                            ) : (
                              "Generate with AI"
                            )}
                          </button>
                        </div>
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

                      {/* Upgraded Ingredients Selector */}
                      <div className="flex flex-col gap-1.5 mt-2 border-t border-brand-beige pt-4">
                        <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Ingredients Selection</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Search or add ingredient..." 
                            value={ingSearchQuery}
                            onChange={(e) => setIngSearchQuery(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none flex-grow"
                          />
                          {ingSearchQuery.trim() && !allIngredients.some(i => i.name.toLowerCase() === ingSearchQuery.trim().toLowerCase()) && (
                            <button
                              type="button"
                              onClick={async () => {
                                const newIngName = ingSearchQuery.trim();
                                const added = await addIngredient(newIngName);
                                if (added) {
                                  setAllIngredients([...allIngredients, added].sort((a,b) => a.name.localeCompare(b.name)));
                                  setProdIngredients([...prodIngredients, added.id]);
                                  setIngSearchQuery("");
                                }
                              }}
                              className="bg-brand-orange text-white px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-brand-orange-hover"
                            >
                              + Create & Add "{ingSearchQuery.trim()}"
                            </button>
                          )}
                        </div>

                        <div className="max-h-[140px] overflow-y-auto border border-brand-beige rounded-lg p-3 bg-brand-cream/10 mt-2">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {allIngredients
                              .filter(ing => ing.name.toLowerCase().includes(ingSearchQuery.toLowerCase()))
                              .map(ing => {
                                const isChecked = prodIngredients.includes(ing.id);
                                return (
                                  <label key={ing.id} className="flex items-center gap-2 text-xs font-semibold text-brand-charcoal cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          setProdIngredients(prodIngredients.filter(x => x !== ing.id));
                                        } else {
                                          setProdIngredients([...prodIngredients, ing.id]);
                                        }
                                      }}
                                      className="accent-brand-orange h-4 w-4"
                                    />
                                    <span>{ing.icon} {ing.name}</span>
                                  </label>
                                );
                              })}
                          </div>
                        </div>
                      </div>

                      {/* Shelf Life & Storage Instructions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-brand-beige pt-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Shelf Life (Days)</label>
                          <input 
                            type="number" 
                            value={prodShelfLife}
                            onChange={(e) => setProdShelfLife(e.target.value)}
                            placeholder="e.g. 12"
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Storage Instructions</label>
                          <input 
                            type="text" 
                            value={prodStorageInstructions}
                            onChange={(e) => setProdStorageInstructions(e.target.value)}
                            placeholder="e.g. Keep refrigerated after opening."
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Allergen Information */}
                      <div className="flex flex-col gap-1.5 border-t border-brand-beige pt-4">
                        <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Allergen Information</label>
                        <div className="flex flex-wrap gap-4 bg-white p-3 border border-brand-beige rounded-lg">
                          {["Contains Milk", "Contains Cashew", "Contains Almond", "Contains Pistachio", "Contains Gluten"].map(allergen => {
                            const isChecked = prodAllergens.includes(allergen);
                            return (
                              <label key={allergen} className="flex items-center gap-2 text-xs font-semibold text-brand-charcoal cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setProdAllergens(prodAllergens.filter(x => x !== allergen));
                                    } else {
                                      setProdAllergens([...prodAllergens, allergen]);
                                    }
                                  }}
                                  className="accent-brand-orange h-4 w-4"
                                />
                                <span>{allergen}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dietary Tags */}
                      <div className="flex flex-col gap-1.5 border-t border-brand-beige pt-4">
                        <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Dietary Tags</label>
                        <div className="flex flex-wrap gap-4 bg-white p-3 border border-brand-beige rounded-lg">
                          {[
                            "100% Vegetarian",
                            "Premium Quality",
                            "Freshly Prepared",
                            "No Artificial Colors",
                            "Traditional Recipe",
                            "Made From Pure Milk"
                          ].map(tag => {
                            const isChecked = prodDietaryTags.includes(tag);
                            return (
                              <label key={tag} className="flex items-center gap-2 text-xs font-semibold text-brand-charcoal cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setProdDietaryTags(prodDietaryTags.filter(x => x !== tag));
                                    } else {
                                      setProdDietaryTags([...prodDietaryTags, tag]);
                                    }
                                  }}
                                  className="accent-brand-orange h-4 w-4"
                                />
                                <span>{tag}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Product Highlights */}
                      <div className="flex flex-col gap-1.5 border-t border-brand-beige pt-4">
                        <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Product Highlights</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Add short highlight (e.g. Prepared Fresh Daily)..." 
                            value={newHighlight}
                            onChange={(e) => setNewHighlight(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none flex-grow"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newHighlight.trim()) {
                                setProdHighlights([...prodHighlights, newHighlight.trim()]);
                                setNewHighlight("");
                              }
                            }}
                            className="bg-brand-charcoal text-white px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-black"
                          >
                            Add
                          </button>
                        </div>
                        {prodHighlights.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {prodHighlights.map((hl, idx) => (
                              <span key={idx} className="bg-brand-cream text-brand-charcoal border border-brand-beige rounded-md px-2 py-1 text-[0.65rem] font-semibold flex items-center gap-1">
                                {hl}
                                <button
                                  type="button"
                                  onClick={() => setProdHighlights(prodHighlights.filter((_, i) => i !== idx))}
                                  className="text-red-500 hover:text-red-700 font-bold"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 mt-2 border-t border-brand-beige pt-4">
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
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

                  {/* Search and Category Sub-tabs */}
                  {!showProductForm && (
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-brand-cream/20 p-4 rounded-xl border border-brand-beige">
                      {/* Search Bar */}
                      <div className="w-full sm:max-w-xs relative flex items-center border border-brand-beige rounded-lg bg-white px-3 py-1.5 focus-within:border-brand-orange transition-all">
                        <Search className="h-4 w-4 text-muted-foreground mr-2" />
                        <input 
                          type="text" 
                          placeholder="Search product name..."
                          value={prodSearchQuery}
                          onChange={(e) => setProdSearchQuery(e.target.value)}
                          className="w-full text-xs bg-transparent border-none outline-none text-brand-charcoal"
                        />
                        {prodSearchQuery && (
                          <button onClick={() => setProdSearchQuery("")} className="text-muted-foreground hover:text-brand-charcoal">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Sub-tabs */}
                      <div className="flex flex-wrap gap-1.5 border border-brand-beige bg-white p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setProdSubTab("all")}
                          className={`px-3 py-1.5 text-[0.68rem] font-bold rounded-md uppercase tracking-wider transition-colors ${
                            prodSubTab === "all" 
                              ? "bg-brand-orange text-white" 
                              : "text-brand-charcoal hover:bg-brand-cream"
                          }`}
                        >
                          All Items
                        </button>
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setProdSubTab(cat.slug)}
                            className={`px-3 py-1.5 text-[0.68rem] font-bold rounded-md uppercase tracking-wider transition-colors ${
                              prodSubTab === cat.slug 
                                ? "bg-brand-orange text-white" 
                                : "text-brand-charcoal hover:bg-brand-cream"
                            }`}
                          >
                            {cat.name.replace("Sweets of ", "").replace("Tasty & ", "").replace("Chat-Patta ", "")}
                          </button>
                        ))}
                      </div>
                    </div>
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
                        {products.filter(p => {
                          const matchesSearch = p.name.toLowerCase().includes(prodSearchQuery.toLowerCase()) || 
                                                p.description.toLowerCase().includes(prodSearchQuery.toLowerCase());
                          const matchesSubTab = prodSubTab === "all" || p.category === prodSubTab;
                          return matchesSearch && matchesSubTab;
                        }).map((p) => (
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

                  {dbCustomers.length === 0 && orders.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-12">No registered customer transactions found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-brand-beige text-muted-foreground font-semibold">
                            <th className="py-2.5">Customer Name</th>
                            <th className="py-2.5">Email</th>
                            <th className="py-2.5">Mobile Phone</th>
                            <th className="py-2.5">Total Orders placed</th>
                            <th className="py-2.5 text-right">Lifetime purchase value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dbCustomers.length > 0 ? (
                            dbCustomers.map((customer, idx) => {
                              const customerOrders = orders.filter(
                                o => 
                                  (customer.phone && o.userPhone === customer.phone) || 
                                  (customer.email && o.userEmail === customer.email) ||
                                  (o.userName && o.userName.toLowerCase() === customer.name.toLowerCase())
                              );
                              const lifetimeSpend = customerOrders.reduce((sum, o) => sum + o.total, 0);

                              return (
                                <tr key={customer.id || idx} className="border-b border-brand-beige/50">
                                  <td className="py-3 font-bold text-brand-charcoal">{customer.name || "N/A"}</td>
                                  <td className="py-3 font-semibold text-muted-foreground">{customer.email || "N/A"}</td>
                                  <td className="py-3 font-semibold">{customer.phone || "N/A"}</td>
                                  <td className="py-3 font-semibold">{customerOrders.length} order(s)</td>
                                  <td className="py-3 text-right font-serif font-bold text-brand-orange">₹{lifetimeSpend}</td>
                                </tr>
                              );
                            })
                          ) : (
                            Array.from(new Set(orders.map(o => o.userName))).map((name, idx) => {
                              const customerOrders = orders.filter(o => o.userName === name);
                              const customerPhone = customerOrders[0]?.userPhone || "N/A";
                              const lifetimeSpend = customerOrders.reduce((sum, o) => sum + o.total, 0);

                              return (
                                <tr key={idx} className="border-b border-brand-beige/50">
                                  <td className="py-3 font-bold text-brand-charcoal">{name}</td>
                                  <td className="py-3 font-semibold text-muted-foreground">N/A</td>
                                  <td className="py-3 font-semibold">{customerPhone}</td>
                                  <td className="py-3 font-semibold">{customerOrders.length} order(s)</td>
                                  <td className="py-3 text-right font-serif font-bold text-brand-orange">₹{lifetimeSpend}</td>
                                </tr>
                              );
                            })
                          )}
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

              {/* ==================== TAB 8: INGREDIENTS ==================== */}
              {activeTab === "ingredients" && (
                <AdminIngredients />
              )}

              {/* ==================== TAB 8.5: DELIVERY ZONES ==================== */}
              {activeTab === "zones" && (
                <AdminDeliveryZones />
              )}

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
