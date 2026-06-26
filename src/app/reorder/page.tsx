"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ProductRecommendations from "@/components/ProductRecommendations";
import ProductCard from "@/components/ProductCard";
import { supabase, fetchProducts } from "@/lib/supabaseClient";
import { Order, OrderItem, Product } from "@/lib/types";
import { 
  Search, Package, FileText, Download, ShoppingBag, 
  RefreshCw, CheckCircle, Clock, Truck, MapPin, 
  MessageCircle, Info, Phone, ArrowRight, X, Heart, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

function OrderDetailsDrawer({ 
  order, 
  isOpen, 
  onClose,
  onAddToCart,
  onReorderAll
}: { 
  order: Order | null, 
  isOpen: boolean, 
  onClose: () => void,
  onAddToCart: (item: OrderItem) => void,
  onReorderAll: (order: Order) => void
}) {
  if (!order) return null;

  const getStatusStep = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('pending')) return 0;
    if (s.includes('confirm') || s.includes('process') || s.includes('prepar')) return 1;
    if (s.includes('ship') || s.includes('transit')) return 2;
    if (s.includes('deliver') || s.includes('complet')) return 3;
    return 0; // Default
  };

  const currentStep = getStatusStep(order.status || 'Pending');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-xl bg-[#faf9f8] z-[101] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="bg-white px-6 py-4 border-b border-brand-beige flex justify-between items-center shadow-sm z-10">
              <div>
                <h2 className="font-bold text-xl text-brand-charcoal flex items-center gap-2">
                  <Package className="text-brand-orange w-5 h-5" />
                  Order #{order.order_number || order.id?.substring(0,8)}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Placed on {new Date(order.created_at || new Date()).toLocaleDateString('en-IN', { dateStyle: 'medium'})}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-brand-cream rounded-full transition-colors">
                <X className="w-6 h-6 text-brand-charcoal" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Timeline */}
              <div className="bg-white p-6 rounded-2xl border border-brand-beige shadow-sm">
                <h3 className="font-bold text-brand-charcoal mb-6 border-b border-brand-beige pb-2">Order Status</h3>
                <div className="relative flex justify-between px-2">
                  <div className="absolute top-4 left-4 right-4 h-1 bg-brand-cream -z-10"></div>
                  <div className={`absolute top-4 left-4 h-1 bg-brand-orange transition-all duration-500 -z-10`} style={{ width: `${(currentStep / 3) * 100}%` }}></div>
                  
                  {[
                    { label: "Placed", icon: ShoppingBag },
                    { label: "Preparing", icon: Package },
                    { label: "Shipped", icon: Truck },
                    { label: "Delivered", icon: CheckCircle }
                  ].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 bg-white px-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= idx ? 'bg-brand-orange border-brand-orange text-white' : 'bg-white border-brand-beige text-muted-foreground'}`}>
                        <step.icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${currentStep >= idx ? 'text-brand-charcoal' : 'text-muted-foreground'}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-bold text-brand-charcoal mb-4">Products Purchased</h3>
                <div className="space-y-3">
                  {order.items?.map((item: OrderItem, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-white border border-brand-beige/50 rounded-xl shadow-sm">
                      <div className="w-16 h-16 bg-brand-cream rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="w-6 h-6"/></div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-brand-charcoal text-sm leading-tight">{item.productName}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.weight} &times; {item.quantity}</p>
                        <p className="font-bold text-brand-orange text-sm mt-1">₹{item.price}</p>
                      </div>
                      <button 
                        onClick={() => onAddToCart(item)}
                        className="p-2 bg-brand-cream hover:bg-brand-orange hover:text-white text-brand-orange rounded-full transition-colors flex-shrink-0"
                        title="Add to Cart"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-brand-beige shadow-sm">
                  <h3 className="font-bold text-brand-charcoal mb-3 text-sm flex items-center gap-1.5"><MapPin className="w-4 h-4 text-brand-orange"/> Delivery</h3>
                  <p className="text-xs font-medium text-brand-charcoal">{order.user_name || order.shippingAddress?.name || "Customer"}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {order.shippingAddress?.street ? `${order.shippingAddress.street}, ${order.shippingAddress.city}` : "Store Pickup"}
                  </p>
                  {order.branch && <p className="text-[10px] mt-2 bg-brand-cream text-brand-orange font-bold px-2 py-1 inline-block rounded">Branch: {order.branch}</p>}
                </div>
                
                <div className="bg-white p-5 rounded-xl border border-brand-beige shadow-sm">
                  <h3 className="font-bold text-brand-charcoal mb-3 text-sm flex items-center gap-1.5"><FileText className="w-4 h-4 text-brand-orange"/> Summary</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₹{order.subtotal || 0}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>₹{order.delivery_charge || 0}</span></div>
                    {Number(order.discount) > 0 && (
                      <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount}</span></div>
                    )}
                    <div className="flex justify-between font-bold text-brand-charcoal pt-2 border-t border-brand-beige mt-2">
                      <span>Total</span><span className="text-brand-orange">₹{order.total || 0}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-brand-beige flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{order.payment_method || "Payment"}</span>
                    <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${order.payment_status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {order.payment_status || "PENDING"}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Drawer Footer Actions */}
            <div className="bg-white p-6 border-t border-brand-beige shadow-[0_-4px_20px_rgba(0,0,0,0.02)] space-y-3 z-10">
              <button 
                onClick={() => onReorderAll(order)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-orange text-white font-bold rounded-xl hover:bg-brand-orange-hover transition-colors shadow-lg shadow-brand-orange/20"
              >
                <RefreshCw className="w-5 h-5" /> Reorder Entire Order
              </button>
              <div className="grid grid-cols-2 gap-3">
                {order.invoices && order.invoices.length > 0 ? (
                  <a 
                    href={`/api/invoices/download?invoiceId=${order.invoices[0].id}`}
                    target="_blank"
                    className="flex items-center justify-center gap-2 py-2.5 border-2 border-brand-beige text-brand-charcoal font-bold rounded-xl hover:border-brand-orange hover:text-brand-orange transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" /> Invoice
                  </a>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-2.5 border-2 border-brand-beige/50 text-muted-foreground font-bold rounded-xl text-sm bg-gray-50 cursor-not-allowed">
                    <Download className="w-4 h-4" /> No Invoice
                  </div>
                )}
                <a 
                  href="https://wa.me/919913252232" 
                  target="_blank"
                  className="flex items-center justify-center gap-2 py-2.5 border-2 border-brand-beige text-brand-charcoal font-bold rounded-xl hover:border-[#25D366] hover:text-[#25D366] transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4" /> Support
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ReorderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryId = searchParams.get("id");

  const [session, setSession] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Search State (Logged Out)
  const [searchInput, setSearchInput] = useState(queryId || "");
  const [searchOrder, setSearchOrder] = useState<Order | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Dashboard State (Logged In)
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [customerName, setCustomerName] = useState("Customer");
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // 1. Check Auth & Handle QR code redirects
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let finalCustomerId = null;
      let finalUserPhone = null;
      let finalUserName = "Customer";

      if (user) {
        // Logged in with Google or Supabase Auth
        const { data: customer } = await supabase.from('customers').select('id, phone, name').eq('auth_user_id', user.id).single();
        if (customer) {
           finalCustomerId = customer.id;
           finalUserPhone = customer.phone;
           finalUserName = customer.name || user.user_metadata?.full_name || "Customer";
           setAuthChecked(true);
           setSession({ user });
        }
      } else {
        // Fallback for OTP users
        const phone = localStorage.getItem("mehta_user_phone");
        if (phone && phone !== 'null') {
          try {
            const res = await fetch(`/api/user/profile?phone=${phone}`);
            const data = await res.json();
            if (data.success && data.profile) {
              finalCustomerId = data.profile.id;
              finalUserPhone = data.profile.phone;
              finalUserName = data.profile.name || "Customer";
              setAuthChecked(true);
              setSession({ user: { phone: finalUserPhone } }); // mock session for UI
            }
          } catch (err) {
            console.error("Error fetching OTP profile:", err);
          }
        }
      }

      if (finalCustomerId || finalUserPhone) {
        setCustomerName(finalUserName);
        fetchDashboardData(finalCustomerId, finalUserPhone);
        
        if (queryId) {
          fetchSpecificOrder(queryId, true);
        }
      } else {
        // Not logged in
        setSession(null);
        setAuthChecked(true);
        if (queryId) {
          router.push(`/login?redirect=/reorder?id=${queryId}`);
        }
      }
    };
    checkAuth();
  }, [queryId, router]);

  // 2. Fetch Logged-In Dashboard Data
  const fetchDashboardData = async (customerId: string | null, phone: string | null) => {
    try {
      // Fetch Orders
      let query = supabase.from('orders').select('*, invoices(*), order_items(*)').order('created_at', { ascending: false });
      
      if (customerId) {
        query = query.eq('customer_id', customerId);
      } else if (phone) {
        query = query.eq('user_phone', phone);
      }
      
      const { data: ordersData } = await query;
      
      if (ordersData) {
        const formattedOrders = ordersData.map((o: any) => ({
          ...o,
          items: o.order_items || [],
        }));
        setMyOrders(formattedOrders);
      }

      // Fetch All Products for mapping
      const products = await fetchProducts();
      setAllProducts(products);

      // Fetch Wishlist
      const wIds = JSON.parse(localStorage.getItem("mehta_wishlist") || "[]");
      const wProducts = wIds.map((id: string) => products.find(p => p.id === id)).filter(Boolean);
      setWishlistProducts(wProducts);

    } catch (err) {
      console.error("Failed to load dashboard", err);
    }
    setLoadingDashboard(false);
  };

  // 3. Fetch specific order by ID (QR code or Search)
  const fetchSpecificOrder = async (idToSearch: string, isFromQRAuth = false) => {
    setLoadingSearch(true);
    setSearchError("");
    setSearchOrder(null);

    try {
      const cleanSearch = idToSearch.trim();
      
      // Try by invoice number (case insensitive)
      const { data: invoiceData, error: invError } = await supabase
        .from('invoices')
        .select('*, orders(*, order_items(*))')
        .ilike('invoice_number', cleanSearch)
        .limit(1)
        .maybeSingle();

      if (invError) console.error("Invoice search error:", invError);

      if (invoiceData && invoiceData.orders) {
        // If orders is an array (hasMany instead of belongsTo), pick the first one
        const orderRecord = Array.isArray(invoiceData.orders) ? invoiceData.orders[0] : invoiceData.orders;
        const o = { ...orderRecord, items: orderRecord.order_items || [], invoices: [invoiceData] };
        if (session || isFromQRAuth) setSelectedOrder(o);
        else setSearchOrder(o);
        setLoadingSearch(false);
        return;
      }

      // Try by order number or phone
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSearch);
      const orQuery = isUUID 
        ? `order_number.ilike.${cleanSearch},user_phone.eq.${cleanSearch},id.eq.${cleanSearch}`
        : `order_number.ilike.${cleanSearch},user_phone.eq.${cleanSearch}`;

      const { data: orderData, error: ordError } = await supabase
        .from('orders')
        .select('*, order_items(*), invoices(*)')
        .or(orQuery)
        .limit(1)
        .maybeSingle();

      if (ordError) console.error("Order search error:", ordError.message || ordError);

      if (orderData) {
        const o = { ...orderData, items: orderData.order_items || [] };
        if (session || isFromQRAuth) setSelectedOrder(o);
        else setSearchOrder(o);
        setLoadingSearch(false);
        return;
      }
      
      setSearchError("Order not found. Please check your number.");
    } catch (err: any) {
      setSearchError(err.message || "Error searching for order.");
    }
    setLoadingSearch(false);
  };

  const handleAddToCart = (item: OrderItem) => {
    const cart = JSON.parse(localStorage.getItem("mehta_cart") || "[]");
    const idx = cart.findIndex((i: any) => i.productId === item.productId && i.weight === item.weight);
    if (idx > -1) {
      cart[idx].quantity += 1;
    } else {
      cart.push({ ...item, quantity: item.quantity || 1 });
    }
    localStorage.setItem("mehta_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    window.dispatchEvent(new CustomEvent('cartItemAdded', { detail: { productName: item.productName } }));
  };

  const handleReorderAll = (orderToReorder: Order) => {
    const cart = JSON.parse(localStorage.getItem("mehta_cart") || "[]");
    orderToReorder.items?.forEach((item: OrderItem) => {
      const idx = cart.findIndex((i: any) => i.productId === item.productId && i.weight === item.weight);
      if (idx > -1) cart[idx].quantity += item.quantity || 1;
      else cart.push({ ...item, quantity: item.quantity || 1 });
    });
    localStorage.setItem("mehta_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    alert("Entire order added to cart!");
  };

  // Extract unique previously bought products for "Buy Again"
  const buyAgainProductIds = Array.from(new Set(myOrders.flatMap(o => o.items?.map((i:any) => i.product_id || i.productId)).filter(Boolean)));
  const buyAgainProducts = buyAgainProductIds.map(id => allProducts.find(p => p.id === id)).filter(Boolean) as Product[];

  // Recommend products from same categories
  const boughtCategories = Array.from(new Set(buyAgainProducts.map(p => p.category)));
  const recommendedProducts = allProducts.filter(p => boughtCategories.includes(p.category) && !buyAgainProductIds.includes(p.id)).slice(0, 4);

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center bg-[#faf9f8]"><RefreshCw className="animate-spin text-brand-orange w-8 h-8" /></div>;
  }

  // ==========================================
  // LOGGED OUT STATE (Search UI)
  // ==========================================
  if (!session) {
    return (
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-8 md:py-16 mt-20">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-charcoal mb-3">Find Your Order</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Enter your Invoice Number, Order ID, or Mobile Number to track or reorder your favorite sweets.</p>
        </div>

        <div className="max-w-xl mx-auto mb-12">
          <div className="flex relative shadow-sm">
            <input 
              type="text" 
              placeholder="e.g. INV-1234, ORD-5678, or 99132..."
              className="w-full pl-12 pr-4 py-4 rounded-l-xl border-2 border-r-0 border-brand-beige focus:border-brand-orange outline-none transition-colors"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchSpecificOrder(searchInput)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <button 
              onClick={() => fetchSpecificOrder(searchInput)}
              disabled={loadingSearch || !searchInput}
              className="bg-brand-charcoal hover:bg-black text-white px-8 font-bold rounded-r-xl transition-colors disabled:opacity-70 flex items-center"
            >
              {loadingSearch ? <RefreshCw className="animate-spin w-5 h-5" /> : "Search"}
            </button>
          </div>
          {searchError && <p className="text-red-500 mt-3 text-sm flex items-center justify-center gap-2 font-medium"><Info className="w-4 h-4" /> {searchError}</p>}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Want a personalized experience?</p>
            <Link href={`/login?redirect=/reorder${queryId ? '?id='+queryId : ''}`} className="text-brand-orange font-bold hover:underline flex items-center justify-center gap-1">
              Log In to your Account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Unauthenticated Order Result Inline */}
        {searchOrder && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl shadow-brand-charcoal/5 border border-brand-beige overflow-hidden">
            <div className="p-6 bg-brand-cream border-b border-brand-beige flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl text-brand-charcoal">Order #{searchOrder.order_number || searchOrder.id.substring(0,8)}</h3>
                <p className="text-sm text-muted-foreground">{new Date(searchOrder.created_at).toLocaleDateString()}</p>
              </div>
              <span className="px-3 py-1 bg-white border border-brand-beige rounded-full text-xs font-bold uppercase">{searchOrder.status || "PENDING"}</span>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                {searchOrder.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center border-b border-brand-beige/50 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-bold text-brand-charcoal">{item.product_name || item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.weight} &times; {item.quantity}</p>
                    </div>
                    <p className="font-bold text-brand-orange">₹{item.price}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-6 border-t border-brand-beige">
                <button onClick={() => handleReorderAll(searchOrder)} className="flex-1 bg-brand-orange text-white py-3 rounded-xl font-bold hover:bg-brand-orange-hover transition">
                  Reorder Entire Order
                </button>
                {searchOrder.invoices && searchOrder.invoices.length > 0 ? (
                  <a href={`/api/invoices/download?invoiceId=${searchOrder.invoices[0].id}`} target="_blank" className="px-6 py-3 border-2 border-brand-beige rounded-xl font-bold hover:border-brand-orange hover:text-brand-orange transition flex items-center justify-center">
                    <Download className="w-5 h-5" />
                  </a>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    );
  }

  // ==========================================
  // LOGGED IN STATE (Dashboard UI)
  // ==========================================
  return (
    <>
      <main className="flex-grow max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8 md:py-12 mt-20">
        
        {/* SECTION 1 - Welcome */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-beige/50 pb-8">
          <div>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-brand-charcoal mb-2">
              Welcome back, {customerName.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground text-lg">Reorder your favorite sweets, view previous invoices, and track your orders.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/shop" className="px-6 py-3 bg-brand-charcoal text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg shadow-brand-charcoal/10">
              Continue Shopping
            </Link>
          </div>
        </div>

        {loadingDashboard ? (
          <div className="flex flex-col items-center justify-center py-20"><RefreshCw className="animate-spin text-brand-orange w-10 h-10 mb-4" /><p className="text-muted-foreground">Loading your personalized dashboard...</p></div>
        ) : myOrders.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-white rounded-3xl border border-brand-beige/50 shadow-sm">
            <div className="w-24 h-24 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-brand-orange" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">Looks like you haven't placed any orders yet.</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">Discover the authentic taste of Palitana's finest sweets and farsan. Your delicious journey begins here.</p>
            <Link href="/shop" className="inline-flex px-8 py-4 bg-brand-orange text-white font-bold rounded-xl hover:bg-brand-orange-hover transition-colors shadow-xl shadow-brand-orange/20 text-lg">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-10">
            
            {/* Main Content Column */}
            <div className="lg:col-span-8 space-y-16">
              
              {/* SECTION 2 - Recent Orders */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-2xl font-bold text-brand-charcoal flex items-center gap-2">
                    <Clock className="w-6 h-6 text-brand-orange" /> Recent Orders
                  </h2>
                </div>
                
                <div className="space-y-5">
                  {myOrders.slice(0, 3).map((o: any, idx: number) => {
                    const st = (o.status || "").toLowerCase();
                    const badgeColor = st.includes('deliver') ? 'bg-green-100 text-green-700 border-green-200' : 
                                       st.includes('cancel') ? 'bg-red-100 text-red-700 border-red-200' : 
                                       'bg-orange-100 text-orange-700 border-orange-200';

                    return (
                      <div key={idx} className="bg-white p-5 md:p-6 rounded-2xl border border-brand-beige hover:border-brand-orange/30 transition-colors shadow-sm group">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <span className="font-bold text-brand-charcoal text-lg">#{o.order_number || o.id.substring(0,8)}</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeColor}`}>
                                {o.status || "PENDING"}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-4">
                              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> {new Date(o.created_at).toLocaleDateString()}</span>
                              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> {o.shipping_address?.city || o.branch || "Store"}</span>
                              <span className="flex items-center gap-1.5"><FileText className="w-4 h-4"/> ₹{o.total}</span>
                            </div>

                            <div className="flex -space-x-3">
                              {o.items?.slice(0, 4).map((i:any, j:number) => (
                                <div key={j} className="w-10 h-10 rounded-full border-2 border-white bg-brand-cream overflow-hidden shadow-sm relative group/img">
                                  {i.image || i.image_url ? <img src={i.image || i.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 m-auto mt-2 text-muted-foreground" />}
                                </div>
                              ))}
                              {o.items?.length > 4 && (
                                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                                  +{o.items.length - 4}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 min-w-[200px] justify-center">
                            <button onClick={() => setSelectedOrder(o)} className="w-full py-2.5 bg-brand-cream hover:bg-brand-orange hover:text-white text-brand-orange font-bold rounded-xl transition-colors">
                              View Order Details
                            </button>
                            <button onClick={() => handleReorderAll(o)} className="w-full py-2.5 border-2 border-brand-orange text-brand-orange font-bold rounded-xl hover:bg-brand-orange/5 transition-colors">
                              Reorder Entire Order
                            </button>
                            {o.invoices?.length > 0 && (
                              <a href={`/api/invoices/download?invoiceId=${o.invoices[0].id}`} target="_blank" className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-brand-charcoal transition-colors">
                                <Download className="w-4 h-4"/> Download Invoice
                              </a>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                  {myOrders.length > 3 && (
                    <button className="w-full py-4 border-2 border-dashed border-brand-beige rounded-2xl text-muted-foreground font-bold hover:border-brand-orange hover:text-brand-orange transition-colors">
                      View All {myOrders.length} Orders
                    </button>
                  )}
                </div>
              </section>

              {/* SECTION 3 - Buy Again */}
              {buyAgainProducts.length > 0 && (
                <section>
                  <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-6 flex items-center gap-2">
                    <RefreshCw className="w-6 h-6 text-brand-orange" /> Buy Again
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {buyAgainProducts.slice(0, 3).map(p => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </section>
              )}

              {/* SECTION 4 - Recommended For You */}
              {recommendedProducts.length > 0 && (
                <section>
                  <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-6 flex items-center gap-2">
                    <Star className="w-6 h-6 text-brand-orange" /> Recommended For You
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {recommendedProducts.map(p => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </section>
              )}

            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* SECTION 8 - Quick Actions */}
              <div className="bg-white p-6 rounded-3xl border border-brand-beige shadow-sm">
                <h3 className="font-bold text-lg text-brand-charcoal mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button onClick={() => handleReorderAll(myOrders[0])} className="w-full flex items-center justify-between p-4 rounded-xl bg-brand-cream hover:bg-brand-orange hover:text-white transition-colors group">
                    <span className="font-bold text-brand-orange group-hover:text-white">Reorder Last Order</span>
                    <RefreshCw className="w-5 h-5 text-brand-orange group-hover:text-white" />
                  </button>
                  <button onClick={() => setSelectedOrder(myOrders[0])} className="w-full flex items-center justify-between p-4 rounded-xl border border-brand-beige hover:border-brand-orange transition-colors group">
                    <span className="font-medium text-brand-charcoal">Track Current Order</span>
                    <Truck className="w-5 h-5 text-muted-foreground group-hover:text-brand-orange" />
                  </button>
                  <Link href="/shop" className="w-full flex items-center justify-between p-4 rounded-xl border border-brand-beige hover:border-brand-charcoal transition-colors group">
                    <span className="font-medium text-brand-charcoal">Explore New Sweets</span>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-brand-charcoal" />
                  </Link>
                </div>
              </div>

              {/* SECTION 5 - Favorites */}
              <div className="bg-white p-6 rounded-3xl border border-brand-beige shadow-sm">
                <h3 className="font-bold text-lg text-brand-charcoal mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" /> Favorites
                </h3>
                {wishlistProducts.length > 0 ? (
                  <div className="space-y-4">
                    {wishlistProducts.slice(0, 3).map(p => (
                      <div key={p.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-brand-cream rounded-lg overflow-hidden shrink-0">
                          <img src={p.images[0]} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow overflow-hidden">
                          <p className="font-bold text-sm text-brand-charcoal truncate">{p.name}</p>
                          <p className="text-xs text-brand-orange font-bold">₹{Object.values(p.prices)[0]}</p>
                        </div>
                        <Link href={`/product/${p.slug || p.id}`} className="p-2 bg-brand-cream rounded-full text-brand-orange hover:bg-brand-orange hover:text-white transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ))}
                    {wishlistProducts.length > 3 && <Link href="/account?tab=wishlist" className="block text-center text-sm font-bold text-brand-orange hover:underline pt-2">View all {wishlistProducts.length}</Link>}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">You haven't saved any products yet. Tap the heart icon on any product to save it here!</p>
                )}
              </div>

              {/* SECTION 6 - Need Help */}
              <div className="bg-[#fcfaf8] p-6 rounded-3xl border border-brand-beige shadow-sm">
                <h3 className="font-bold text-lg text-brand-charcoal mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-brand-orange" /> Need Help?
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <a href="https://wa.me/919913252232" target="_blank" className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-brand-beige hover:border-[#25D366] hover:shadow-md transition-all group">
                    <MessageCircle className="w-6 h-6 text-[#25D366] mb-2" />
                    <span className="text-xs font-bold text-brand-charcoal">WhatsApp</span>
                  </a>
                  <a href="tel:+919913252232" className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-brand-beige hover:border-brand-charcoal hover:shadow-md transition-all group">
                    <Phone className="w-6 h-6 text-brand-charcoal mb-2" />
                    <span className="text-xs font-bold text-brand-charcoal">Call Us</span>
                  </a>
                  <a href="mailto:support@mehtadairy.com" className="col-span-2 flex items-center justify-center gap-2 p-3 bg-white rounded-xl border border-brand-beige hover:border-brand-orange transition-all text-sm font-bold text-brand-charcoal">
                    Email Support
                  </a>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      <OrderDetailsDrawer 
        order={selectedOrder} 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        onAddToCart={handleAddToCart}
        onReorderAll={handleReorderAll}
      />
    </>
  );
}

export default function ReorderPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f8]">
      <Header />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-brand-orange w-8 h-8" /></div>}>
        <ReorderContent />
      </Suspense>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
