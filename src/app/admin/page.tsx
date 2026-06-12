"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { 
  getProducts, 
  saveProducts, 
  getOrders, 
  saveOrders, 
  getCoupons, 
  saveCoupons,
  Product, 
  Order, 
  Coupon 
} from "@/lib/mockData";
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
  X
} from "lucide-react";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "orders" | "customers" | "marketing">("dashboard");

  // Core Database Arrays
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Product CRUD states
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Product Form states
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodCat, setProdCat] = useState("traditional");
  const [prodPrice250, setProdPrice250] = useState("");
  const [prodPrice500, setProdPrice500] = useState("");
  const [prodPrice1kg, setProdPrice1kg] = useState("");
  const [prodStock, setProdStock] = useState("100");
  const [prodPopular, setProdPopular] = useState(false);
  const [prodFestive, setProdFestive] = useState(false);
  const [prodImage, setProdImage] = useState("https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80");
  
  // Coupon Form states
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [cpCode, setCpCode] = useState("");
  const [cpType, setCpType] = useState<"percentage" | "fixed">("percentage");
  const [cpVal, setCpVal] = useState("");
  const [cpMin, setCpMin] = useState("");
  const [cpDesc, setCpDesc] = useState("");

  // Load Admin Data
  useEffect(() => {
    setProducts(getProducts());
    setOrders(getOrders());
    setCoupons(getCoupons());
  }, [activeTab]);

  // Calculations for Stats Card
  const totalRevenue = orders
    .filter(o => o.paymentStatus === "Paid")
    .reduce((sum, o) => sum + o.total, 0);

  const totalCustomers = Array.from(new Set(orders.map(o => o.userName))).length || 1;

  // --- PRODUCT CRUD ACTIONS ---
  const handleAddProduct = (e: React.FormEvent) => {
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
      const updated = products.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            name: prodName,
            description: prodDesc,
            category: prodCat,
            prices: parsedPrices,
            stock: Number(prodStock),
            popular: prodPopular,
            festivalSpecial: prodFestive,
            images: [prodImage]
          };
        }
        return p;
      });
      setProducts(updated);
      saveProducts(updated);
      setEditingProduct(null);
    } else {
      // ADD MODE
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: prodName,
        description: prodDesc,
        category: prodCat,
        prices: parsedPrices,
        popular: prodPopular,
        festivalSpecial: prodFestive,
        rating: 5.0,
        reviewsCount: 0,
        stock: Number(prodStock),
        images: [prodImage]
      };
      const updated = [newProd, ...products];
      setProducts(updated);
      saveProducts(updated);
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

  const handleDeleteProduct = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      saveProducts(updated);
    }
  };

  // --- ORDER MANAGEMENT ACTIONS ---
  const handleUpdateOrderStatus = (orderId: string, newStatus: any) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        // Auto mark as paid if delivered
        const payStatus = newStatus === 'Delivered' ? 'Paid' : o.paymentStatus;
        return { ...o, status: newStatus, paymentStatus: payStatus };
      }
      return o;
    });
    setOrders(updated);
    saveOrders(updated);
  };

  // --- MARKETING MARKETING ACTIONS ---
  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpCode || !cpVal) return;

    const newCoupon: Coupon = {
      code: cpCode.toUpperCase().trim(),
      discountType: cpType,
      value: Number(cpVal),
      minOrderValue: Number(cpMin) || 0,
      description: cpDesc || `Get flat/percentage discount off orders.`
    };

    const updated = [newCoupon, ...coupons];
    setCoupons(updated);
    saveCoupons(updated);

    // Reset Form
    setCpCode("");
    setCpVal("");
    setCpMin("");
    setCpDesc("");
    setShowCouponForm(false);
  };

  const handleDeleteCoupon = (code: string) => {
    if (confirm(`Delete coupon code ${code}?`)) {
      const updated = coupons.filter(c => c.code !== code);
      setCoupons(updated);
      saveCoupons(updated);
    }
  };

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
                onClick={() => setActiveTab("marketing")}
                className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "marketing" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
              >
                <Tag className="h-4 w-4" /> Marketing Coupon Codes
              </button>
            </aside>

            {/* Main Tabs Container */}
            <main className="lg:col-span-9 bg-white border border-brand-beige rounded-2xl p-6 sm:p-8 shadow-xs min-h-[450px]">
              
              {/* ==================== TAB 1: OVERVIEW ==================== */}
              {activeTab === "dashboard" && (
                <div className="flex flex-col gap-8 animate-fade-in">
                  <h3 className="font-serif text-lg font-bold text-brand-charcoal border-b border-brand-beige pb-3">
                    Administrative Overview
                  </h3>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                    <div className="border border-brand-beige rounded-xl p-5 bg-brand-cream/10">
                      <div className="flex items-center justify-between text-muted-foreground mb-3 text-xs">
                        <span>Total Revenue</span>
                        <IndianRupee className="h-4 w-4 text-brand-orange" />
                      </div>
                      <span className="font-serif text-2xl font-bold text-brand-charcoal">₹{totalRevenue}</span>
                    </div>

                    <div className="border border-brand-beige rounded-xl p-5 bg-brand-cream/10">
                      <div className="flex items-center justify-between text-muted-foreground mb-3 text-xs">
                        <span>Total Invoices</span>
                        <ShoppingBag className="h-4 w-4 text-brand-gold" />
                      </div>
                      <span className="font-serif text-2xl font-bold text-brand-charcoal">{orders.length}</span>
                    </div>

                    <div className="border border-brand-beige rounded-xl p-5 bg-brand-cream/10">
                      <div className="flex items-center justify-between text-muted-foreground mb-3 text-xs">
                        <span>Buyer Base</span>
                        <Users className="h-4 w-4 text-brand-orange" />
                      </div>
                      <span className="font-serif text-2xl font-bold text-brand-charcoal">{totalCustomers}</span>
                    </div>

                    <div className="border border-brand-beige rounded-xl p-5 bg-brand-cream/10">
                      <div className="flex items-center justify-between text-muted-foreground mb-3 text-xs">
                        <span>Catalog Sweets</span>
                        <Dessert className="h-4 w-4 text-brand-gold" />
                      </div>
                      <span className="font-serif text-2xl font-bold text-brand-charcoal">{products.length}</span>
                    </div>
                  </div>

                  {/* Recent Invoices list */}
                  <div>
                    <h4 className="font-serif text-sm font-bold text-brand-charcoal mb-4 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-brand-orange" /> Recent Orders Placed
                    </h4>
                    {orders.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-6 text-center border rounded-xl border-dashed border-brand-beige">No invoices recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-brand-beige text-muted-foreground font-semibold">
                              <th className="py-2.5">Invoice ID</th>
                              <th className="py-2.5">Customer</th>
                              <th className="py-2.5">Date</th>
                              <th className="py-2.5">Paid Total</th>
                              <th className="py-2.5 text-right">Progress Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.slice(0, 5).map((order) => (
                              <tr key={order.id} className="border-b border-brand-beige/50">
                                <td className="py-3 font-semibold text-brand-charcoal">{order.orderNumber}</td>
                                <td className="py-3">{order.userName}</td>
                                <td className="py-3">{order.date}</td>
                                <td className="py-3 font-serif font-bold text-brand-orange">₹{order.total}</td>
                                <td className="py-3 text-right">
                                  <span className="inline-block bg-brand-cream px-2.5 py-0.5 rounded-full font-semibold text-[0.62rem] uppercase tracking-wider text-brand-gold-dark">
                                    {order.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
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
                            <option value="traditional">Traditional Sweets</option>
                            <option value="dryfruit">Dry Fruit Sweets</option>
                            <option value="bengali">Bengali Sweets</option>
                            <option value="farsan">Premium Farsan</option>
                            <option value="namkeen">Crispy Namkeen</option>
                            <option value="gifts">Gift Boxes</option>
                            <option value="specials">Festival Specials</option>
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
                        <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Product Photo Placeholder URL</label>
                        <input 
                          type="text" 
                          value={prodImage}
                          onChange={(e) => setProdImage(e.target.value)}
                          className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white"
                        />
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

              {/* ==================== TAB 5: COUPON CODES ==================== */}
              {activeTab === "marketing" && (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-brand-beige pb-3">
                    <h3 className="font-serif text-lg font-bold text-brand-charcoal">
                      Marketing Coupons Configurations
                    </h3>
                    {!showCouponForm && (
                      <button 
                        onClick={() => setShowCouponForm(true)}
                        className="inline-flex items-center gap-1 text-xs font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg px-4 py-2 transition-colors shadow-xs"
                      >
                        <Plus className="h-4 w-4" /> Create Coupon
                      </button>
                    )}
                  </div>

                  {/* Coupon Form modal */}
                  {showCouponForm && (
                    <form onSubmit={handleAddCoupon} className="bg-brand-cream/35 border border-brand-beige rounded-2xl p-6 flex flex-col gap-4 animate-fade-in-up">
                      <div className="flex items-center justify-between border-b border-brand-beige pb-3 mb-2">
                        <h4 className="font-serif text-sm font-bold text-brand-charcoal">Create Coupon Code</h4>
                        <button type="button" onClick={() => setShowCouponForm(false)} className="p-1 hover:bg-brand-cream rounded-full"><X className="h-4.5 w-4.5" /></button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Coupon Code Name *</label>
                          <input 
                            type="text" 
                            placeholder="e.g. MITHAI20"
                            value={cpCode}
                            onChange={(e) => setCpCode(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none uppercase font-bold"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Discount type</label>
                          <select 
                            value={cpType}
                            onChange={(e) => setCpType(e.target.value as any)}
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white cursor-pointer font-semibold"
                          >
                            <option value="percentage">Percentage (%) Discount</option>
                            <option value="fixed">Fixed Flat (₹) Discount</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Discount Value *</label>
                          <input 
                            type="number" 
                            placeholder="e.g. 10 or 150"
                            value={cpVal}
                            onChange={(e) => setCpVal(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Minimum Order Threshold (₹)</label>
                          <input 
                            type="number" 
                            placeholder="e.g. 500"
                            value={cpMin}
                            onChange={(e) => setCpMin(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Short Description *</label>
                        <input 
                          type="text" 
                          placeholder="Get 10% off your next sweet box above ₹500"
                          value={cpDesc}
                          onChange={(e) => setCpDesc(e.target.value)}
                          className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                          required
                        />
                      </div>

                      <div className="flex justify-end gap-3 mt-4 border-t border-brand-beige pt-4">
                        <button 
                          type="button" 
                          onClick={() => setShowCouponForm(false)}
                          className="px-4 py-2 border border-brand-beige rounded-lg text-xs font-bold text-brand-charcoal"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="px-5 py-2 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg text-xs font-bold"
                        >
                          Create Coupon
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Coupons checklist directory */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {coupons.map((c) => (
                      <div key={c.code} className="border border-brand-beige rounded-xl p-4 flex justify-between items-start bg-brand-cream/10">
                        <div>
                          <h4 className="font-serif text-sm font-bold text-brand-charcoal flex items-center gap-2">
                            <span className="bg-brand-orange/10 border border-brand-orange/20 text-brand-orange px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider font-bold">{c.code}</span>
                          </h4>
                          <p className="text-[0.7rem] text-muted-foreground mt-2 leading-relaxed font-semibold">
                            {c.description}
                          </p>
                          <span className="text-[0.65rem] text-brand-gold font-bold block mt-1.5">
                            Min Order Requirement: ₹{c.minOrderValue}
                          </span>
                        </div>
                        
                        <button 
                          onClick={() => handleDeleteCoupon(c.code)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          aria-label="Delete Coupon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </main>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
