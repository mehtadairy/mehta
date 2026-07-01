"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Store, 
  Truck, 
  FileText, 
  CreditCard, 
  Users, 
  Bell, 
  User, 
  Search, 
  Menu, 
  X, 
  ChevronRight, 
  LogOut, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Printer, 
  Download, 
  RefreshCw, 
  UserCheck, 
  ShieldAlert, 
  DollarSign, 
  TrendingUp, 
  Loader2, 
  AlertTriangle,
  ChevronDown,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WorkerPanel() {
  // --- AUTH STATE ---
  const [isAuth, setIsAuth] = useState(false);
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [workerInfo, setWorkerInfo] = useState<any>(null);

  // --- UI NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "orders" | "pickup" | "delivery" | "invoices" | "payments" | "customers" | "notifications" | "profile"
  >("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- DATA STATES ---
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- FILTER STATES ---
  const [orderFilter, setOrderFilter] = useState("All");
  const [orderSearch, setOrderSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");

  // --- DETAIL DRAWER/MODAL STATES ---
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [invoicePreview, setInvoicePreview] = useState<any>(null);
  const [showStatusConfirm, setShowStatusConfirm] = useState<{ orderId: string; nextStatus: string } | null>(null);

  // --- PROFILE UPDATE STATES ---
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);

  // --- INVOICE GENERATION STATES ---
  const [manualInvoiceOrder, setManualInvoiceOrder] = useState<string>("");
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  // Check login state on mount
  useEffect(() => {
    const stored = localStorage.getItem("mehta_worker_auth");
    const storedInfo = localStorage.getItem("mehta_worker_info");
    if (stored === "true" && storedInfo) {
      setIsAuth(true);
      setWorkerInfo(JSON.parse(storedInfo));
    }
  }, []);

  // --- REALTIME NOTIFICATIONS ---
  const [newOrderAlert, setNewOrderAlert] = useState<any>(null);

  useEffect(() => {
    if (!isAuth) return;

    const playNotificationSound = () => {
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav");
        audio.play().catch(err => console.log("Autoplay blocked by browser until user interaction:", err));
      } catch (e) {
        console.error("Audio error:", e);
      }
    };

    const channel = supabase
      .channel("live-order-chimes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          console.log("New order detected realtime:", payload.new);
          playNotificationSound();
          setNewOrderAlert(payload.new);
          loadPanelData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuth]);

  // Fetch data on activeTab change or auth success
  useEffect(() => {
    if (!isAuth) return;
    loadPanelData();
  }, [isAuth, activeTab]);

  const loadPanelData = async () => {
    setIsLoading(true);
    try {
      // Fetch all protected data via secure API route
      const res = await fetch("/api/worker/data");
      if (res.ok) {
        const { data } = await res.json();
        
        // 1. Set Orders
        if (data.orders) {
          const formattedOrders = data.orders.map((o: any) => ({
            id: o.id,
            orderNumber: o.order_number,
            date: new Date(o.created_at).toLocaleDateString(),
            status: o.status,
            total: o.total,
            paymentStatus: o.payment_status,
            userName: o.user_name,
            userPhone: o.user_phone,
            userEmail: o.user_email,
            shippingAddress: o.shipping_address,
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
        }

        // 2. Set Payments
        if (data.payments) {
          setPayments(data.payments);
        }

        // 3. Set Invoices
        if (data.invoices) {
          setInvoices(data.invoices);
        }

        // 4. Set Customers
        if (data.customers) {
          setCustomers(data.customers);
        }

        // 5. Set Notifications
        if (data.notifications) {
          setNotifications(data.notifications);
        }
      }
    } catch (e) {
      console.error("Error loading panel data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS & API CALLS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/worker/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: empId, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuth(true);
        setWorkerInfo(data.worker);
        localStorage.setItem("mehta_worker_auth", "true");
        localStorage.setItem("mehta_worker_info", JSON.stringify(data.worker));
      } else {
        setLoginError(data.error || "Authentication failed. Please verify credentials.");
      }
    } catch (e) {
      setLoginError("Network connection error. Try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuth(false);
    setWorkerInfo(null);
    localStorage.removeItem("mehta_worker_auth");
    localStorage.removeItem("mehta_worker_info");
  };

  const handleStatusUpdate = async () => {
    if (!showStatusConfirm) return;
    const { orderId, nextStatus } = showStatusConfirm;

    try {
      const res = await fetch("/api/worker/update-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          nextStatus,
          workerName: workerInfo?.name
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update order");
      }

      // Update locally
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: nextStatus }));
      }

      setShowStatusConfirm(null);
      alert(`Order status updated successfully to ${nextStatus}.`);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    if (!confirm("Are you sure you want to verify and complete this payment?")) return;

    try {
      const res = await fetch("/api/worker/update-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, status: "paid" })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to verify payment");
      }

      setPayments(prev =>
        prev.map(p => (p.id === paymentId ? { ...p, status: "paid" } : p))
      );
      alert("Payment status verified successfully as Paid.");
    } catch (err: any) {
      alert(`Failed to verify payment: ${err.message}`);
    }
  };

  const handleGenerateInvoice = async (orderId: string) => {
    setIsGeneratingInvoice(true);
    try {
      const res = await fetch("/api/invoices/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Invoice created and emailed successfully!");
        loadPanelData();
      } else {
        throw new Error(data.error || "Failed to create invoice");
      }
    } catch (err: any) {
      alert(err.message || "Error generating invoice.");
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    setIsChangingPass(true);

    if (newPassword.length < 6) {
      setPasswordError("Password pin must be at least 6 characters.");
      setIsChangingPass(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("workers")
        .update({ password: newPassword })
        .eq("employee_id", workerInfo.employeeId)
        .eq("password", oldPassword);

      if (error) throw error;

      setPasswordSuccess("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPasswordError("Failed to update password. Please check your old password.");
    } finally {
      setIsChangingPass(false);
    }
  };

  // --- STATS CALCULATIONS ---
  const stats = {
    todayOrders: orders.filter(o => {
      const today = new Date().toDateString();
      return new Date(o.created_at).toDateString() === today;
    }).length,
    pending: orders.filter(o => o.status === "Pending" || o.status === "Confirmed").length,
    preparing: orders.filter(o => o.status === "Preparing").length,
    ready: orders.filter(o => o.status === "Ready" || o.status === "Packed").length,
    delivered: orders.filter(o => o.status === "Delivered").length,
    pickup: orders.filter(o => o.delivery_type === "Pickup").length,
    delivery: orders.filter(o => o.delivery_type === "Home Delivery").length,
    todayRevenue: payments
      .filter(p => {
        const today = new Date().toDateString();
        return new Date(p.created_at).toDateString() === today && p.status === "Paid";
      })
      .reduce((sum, p) => sum + (p.amount || p.total || 0), 0),
    pendingPayments: payments.filter(p => p.status === "Pending" || p.status === "Unpaid").length
  };

  // Render Login Panel
  if (!isAuth) {
    return (
      <div className="min-h-screen bg-[#FCF9F2] flex items-center justify-center p-4 select-none">
        <div className="absolute inset-0 bg-[radial-gradient(#d46d2d10_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40"></div>
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white border border-[#EAE0D3] rounded-2xl p-6 sm:p-8 shadow-xl relative z-10"
        >
          <div className="flex flex-col items-center gap-2.5 mb-6 text-center">
            <div className="h-12 w-12 rounded-full bg-[#D46D2D] flex items-center justify-center text-white font-serif text-xl font-bold shadow-md shadow-[#d46d2d30]">
              M
            </div>
            <h2 className="font-serif text-lg font-bold text-[#2A1E17] tracking-wide uppercase">Mehta Dairy (Since 1972)</h2>
            <p className="text-xs text-[#7E6B5A]">Store Worker Operations & Terminal Panel</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-bold text-[#2A1E17] uppercase tracking-wider">Employee ID</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 h-4 w-4 text-[#7E6B5A]" />
                <input
                  type="text"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  placeholder="e.g. worker01"
                  className="w-full border border-[#EAE0D3] rounded-lg pl-9 pr-3 py-2.5 text-xs bg-[#FCF9F2]/20 focus:outline-none focus:border-[#D46D2D] transition-colors"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-bold text-[#2A1E17] uppercase tracking-wider">Security Password PIN</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-4 w-4 text-[#7E6B5A]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-[#EAE0D3] rounded-lg pl-9 pr-3 py-2.5 text-xs bg-[#FCF9F2]/20 focus:outline-none focus:border-[#D46D2D] transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="mt-2 w-full bg-[#D46D2D] hover:bg-[#BF5E23] text-white py-2.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer flex justify-center items-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Verifying Terminal...
                </>
              ) : (
                "Authorize Login"
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Define sidebar menu options
  const MENU_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "pickup", label: "Pickup Orders", icon: Store },
    { id: "delivery", label: "Home Delivery", icon: Truck },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "customers", label: "Customers", icon: Users },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profile Settings", icon: User }
  ];

  return (
    <div className="min-h-screen bg-[#FCF9F2] text-[#2A1E17] flex font-sans antialiased overflow-x-hidden pb-20 md:pb-0">
      {/* --- SIDEBAR PANEL --- */}
      <aside 
        className={`bg-white border-r border-[#EAE0D3] transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-30 ${
          isSidebarOpen ? "w-64" : "w-16"
        } md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-[#EAE0D3] bg-[#FCF9F2]/20">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-[#D46D2D] flex items-center justify-center text-white font-serif text-sm font-bold flex-shrink-0">
              M
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="font-serif text-[0.68rem] font-bold tracking-wider text-[#2A1E17]">MEHTA DAIRY</span>
                <span className="text-[0.58rem] font-bold text-[#D4AF37] uppercase">Worker Terminal</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg border border-[#EAE0D3] hover:bg-[#FCF9F2]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  isActive 
                    ? "bg-[#D46D2D]/10 text-[#D46D2D] font-bold border-l-3 border-[#D46D2D]"
                    : "text-[#7E6B5A] hover:bg-[#FCF9F2]/60 hover:text-[#2A1E17]"
                } ${isSidebarOpen ? "gap-3" : "justify-center"}`}
              >
                <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                {isSidebarOpen && <span className="text-xs truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#EAE0D3] bg-[#FCF9F2]/20">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer ${
              isSidebarOpen ? "gap-3" : "justify-center"
            }`}
          >
            <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
            {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-wider">Terminal Exit</span>}
          </button>
        </div>
      </aside>

      {/* --- CONTENT CONTAINER --- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Content Header */}
        <header className="sticky top-0 bg-white border-b border-[#EAE0D3] z-20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg border border-[#EAE0D3] hover:bg-[#FCF9F2] text-[#2A1E17]"
            >
              <Menu className="h-4 w-4" />
            </button>
            <h1 className="font-serif text-sm font-bold text-[#2A1E17] uppercase tracking-wider">
              {MENU_ITEMS.find(m => m.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Worker metadata badge */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-[#2A1E17]">{workerInfo?.name}</span>
              <span className="text-[0.62rem] text-[#7E6B5A] font-semibold">{workerInfo?.role} • {workerInfo?.branch}</span>
            </div>
            <div className="h-8 w-8 rounded-full border border-[#D4AF37] bg-[#FCF9F2] flex items-center justify-center text-[#D46D2D] font-bold text-xs">
              {workerInfo?.name?.substring(0, 1)}
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#D46D2D]" />
            </div>
          )}

          {!isLoading && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* ── TAB: DASHBOARD ── */}
                {activeTab === "dashboard" && (
                  <div className="flex flex-col gap-6">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Today's Orders */}
                      <div className="bg-white border border-[#EAE0D3] rounded-xl p-4 flex flex-col gap-1.5 shadow-2xs">
                        <span className="text-[0.68rem] font-bold text-[#7E6B5A] uppercase tracking-wider">Today's Orders</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold">{stats.todayOrders}</span>
                          <span className="text-[0.62rem] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <TrendingUp className="h-3 w-3" /> Live
                          </span>
                        </div>
                      </div>

                      {/* Pending Orders */}
                      <div className="bg-white border border-[#EAE0D3] rounded-xl p-4 flex flex-col gap-1.5 shadow-2xs">
                        <span className="text-[0.68rem] font-bold text-[#7E6B5A] uppercase tracking-wider">Pending Orders</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-amber-600">{stats.pending}</span>
                          <span className="text-[0.62rem] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold">Awaiting Action</span>
                        </div>
                      </div>

                      {/* Ready Orders */}
                      <div className="bg-white border border-[#EAE0D3] rounded-xl p-4 flex flex-col gap-1.5 shadow-2xs">
                        <span className="text-[0.68rem] font-bold text-[#7E6B5A] uppercase tracking-wider">Ready / Packed</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-green-700">{stats.ready}</span>
                          <span className="text-[0.62rem] text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-bold">To Dispatch</span>
                        </div>
                      </div>

                      {/* Today's Revenue */}
                      <div className="bg-white border border-[#EAE0D3] rounded-xl p-4 flex flex-col gap-1.5 shadow-2xs">
                        <span className="text-[0.68rem] font-bold text-[#7E6B5A] uppercase tracking-wider">Today's Revenue</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-[#D46D2D]">₹{stats.todayRevenue}</span>
                          <span className="text-[0.62rem] text-[#D46D2D] bg-[#D46D2D]/5 px-1.5 py-0.5 rounded font-bold">Received</span>
                        </div>
                      </div>
                    </div>

                    {/* Lower grid: Recent orders, activities, quick actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Column 1 & 2: Recent Orders */}
                      <div className="lg:col-span-2 bg-white border border-[#EAE0D3] rounded-xl p-5 shadow-2xs flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-[#EAE0D3]/50 pb-3">
                          <h3 className="font-serif text-xs font-bold uppercase tracking-wider">Recent Live Orders</h3>
                          <button onClick={() => setActiveTab("orders")} className="text-[0.68rem] text-[#D46D2D] font-bold hover:underline flex items-center gap-0.5">
                            View All <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-[#EAE0D3] text-[#7E6B5A] font-semibold">
                                <th className="py-2">Order ID</th>
                                <th className="py-2">Customer</th>
                                <th className="py-2">Delivery</th>
                                <th className="py-2">Amount</th>
                                <th className="py-2 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orders.slice(0, 5).map((o) => (
                                <tr key={o.id} className="border-b border-[#EAE0D3]/40 hover:bg-[#FCF9F2]/20">
                                  <td className="py-3 font-semibold text-[#D46D2D]">#{o.order_number || o.id.substring(0, 8)}</td>
                                  <td className="py-3 font-bold">{o.user_name || "Guest"}</td>
                                  <td className="py-3 font-semibold text-[#7E6B5A]">{o.delivery_type}</td>
                                  <td className="py-3 font-bold">₹{o.total}</td>
                                  <td className="py-3 text-right">
                                    <span className={`px-2 py-0.5 rounded-full text-[0.62rem] font-bold ${
                                      o.status === "Delivered" ? "bg-green-50 text-green-700" :
                                      o.status === "Cancelled" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                                    }`}>
                                      {o.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              {orders.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="py-8 text-center text-[#7E6B5A]">No orders available today.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Column 3: Quick Actions & Timeline */}
                      <div className="flex flex-col gap-6">
                        {/* Quick Actions */}
                        <div className="bg-white border border-[#EAE0D3] rounded-xl p-5 shadow-2xs flex flex-col gap-4">
                          <h3 className="font-serif text-xs font-bold uppercase tracking-wider border-b border-[#EAE0D3]/50 pb-2">Quick Actions</h3>
                          <div className="grid grid-cols-1 gap-2">
                            <button onClick={() => { setActiveTab("invoices"); }} className="w-full flex items-center justify-between p-3 rounded-lg border border-[#EAE0D3] hover:border-[#D46D2D] hover:bg-[#FCF9F2]/30 text-xs font-bold transition-all cursor-pointer">
                              <span>Generate Invoice</span>
                              <FileText className="h-4.5 w-4.5 text-[#D46D2D]" />
                            </button>
                            <button onClick={() => { setActiveTab("pickup"); }} className="w-full flex items-center justify-between p-3 rounded-lg border border-[#EAE0D3] hover:border-[#D46D2D] hover:bg-[#FCF9F2]/30 text-xs font-bold transition-all cursor-pointer">
                              <span>Verify Store Pickups</span>
                              <Store className="h-4.5 w-4.5 text-[#D46D2D]" />
                            </button>
                            <button onClick={() => { setActiveTab("delivery"); }} className="w-full flex items-center justify-between p-3 rounded-lg border border-[#EAE0D3] hover:border-[#D46D2D] hover:bg-[#FCF9F2]/30 text-xs font-bold transition-all cursor-pointer">
                              <span>Assigned Home Deliveries</span>
                              <Truck className="h-4.5 w-4.5 text-[#D46D2D]" />
                            </button>
                          </div>
                        </div>

                        {/* Activity Timeline */}
                        <div className="bg-white border border-[#EAE0D3] rounded-xl p-5 shadow-2xs flex flex-col gap-4 flex-1">
                          <h3 className="font-serif text-xs font-bold uppercase tracking-wider border-b border-[#EAE0D3]/50 pb-2">Activity Timeline</h3>
                          <div className="flex flex-col gap-3.5 pl-3 border-l border-[#EAE0D3] relative">
                            {notifications.slice(0, 4).map((n) => (
                              <div key={n.id} className="relative flex flex-col gap-0.5">
                                <span className="absolute -left-[16px] top-1 w-2 h-2 rounded-full bg-[#D46D2D] border border-white"></span>
                                <span className="text-[0.62rem] text-[#7E6B5A] font-bold">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="text-xs font-bold text-[#2A1E17]">{n.title}</span>
                                <span className="text-[0.68rem] text-[#7E6B5A] line-clamp-1">{n.message}</span>
                              </div>
                            ))}
                            {notifications.length === 0 && (
                              <span className="text-xs text-[#7E6B5A]">No recent terminal activities.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB: ORDERS ── */}
                {activeTab === "orders" && (
                  <div className="bg-white border border-[#EAE0D3] rounded-xl p-5 shadow-2xs flex flex-col gap-5">
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Search Bar */}
                      <div className="w-full md:max-w-xs relative flex items-center border border-[#EAE0D3] rounded-lg bg-white px-3 py-1.5 focus-within:border-[#D46D2D] transition-colors">
                        <Search className="h-4 w-4 text-[#7E6B5A] mr-2" />
                        <input
                          type="text"
                          placeholder="Search Customer/Number..."
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                          className="w-full text-xs outline-none bg-transparent"
                        />
                        {orderSearch && (
                          <button onClick={() => setOrderSearch("")} className="text-[#7E6B5A] hover:text-[#2A1E17]">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Filters */}
                      <div className="flex flex-wrap gap-1.5">
                        {["All", "Pending", "Confirmed", "Preparing", "Packed", "Ready", "Delivered", "Cancelled"].map(tab => (
                          <button
                            key={tab}
                            onClick={() => setOrderFilter(tab)}
                            className={`px-3 py-1.5 rounded-lg text-[0.68rem] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                              orderFilter === tab 
                                ? "bg-[#D46D2D] text-white" 
                                : "border border-[#EAE0D3] text-[#7E6B5A] hover:bg-[#FCF9F2]/40"
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Table List */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#EAE0D3] text-[#7E6B5A] font-semibold uppercase tracking-wider">
                            <th className="py-3">Order No</th>
                            <th className="py-3">Customer Details</th>
                            <th className="py-3">Created At</th>
                            <th className="py-3">Delivery Type</th>
                            <th className="py-3">Total amount</th>
                            <th className="py-3">Order Status</th>
                            <th className="py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders
                            .filter(o => {
                              const matchesSearch = 
                                (o.user_name || "").toLowerCase().includes(orderSearch.toLowerCase()) ||
                                (o.user_phone || "").toLowerCase().includes(orderSearch.toLowerCase()) ||
                                (o.order_number || o.id).toLowerCase().includes(orderSearch.toLowerCase());
                              const matchesFilter = orderFilter === "All" || o.status === orderFilter;
                              return matchesSearch && matchesFilter;
                            })
                            .map((o) => (
                              <tr key={o.id} className="border-b border-[#EAE0D3]/40 hover:bg-[#FCF9F2]/10 transition-colors">
                                <td className="py-4 font-bold text-[#D46D2D]">#{o.order_number || o.id.substring(0, 8)}</td>
                                <td className="py-4">
                                  <div className="flex flex-col">
                                    <span className="font-bold">{o.user_name || "Guest"}</span>
                                    <span className="text-[0.68rem] text-[#7E6B5A]">{o.user_phone}</span>
                                  </div>
                                </td>
                                <td className="py-4 text-[#7E6B5A] font-semibold">
                                  {new Date(o.created_at).toLocaleDateString("en-IN")} <br />
                                  <span className="text-[0.62rem]">{new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </td>
                                <td className="py-4 font-semibold text-[#D4AF37] uppercase text-[0.65rem]">{o.delivery_type}</td>
                                <td className="py-4 font-bold">₹{o.total}</td>
                                <td className="py-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[0.62rem] font-bold ${
                                    o.status === "Delivered" ? "bg-green-50 text-green-700" :
                                    o.status === "Cancelled" ? "bg-red-50 text-red-700" :
                                    o.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                                  }`}>
                                    {o.status}
                                  </span>
                                </td>
                                <td className="py-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button 
                                      onClick={() => setSelectedOrder(o)}
                                      className="p-1.5 rounded-lg border border-[#EAE0D3] hover:border-[#D46D2D] text-[#7E6B5A] hover:text-[#D46D2D]"
                                      title="View Details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    
                                    <select
                                      value={o.status}
                                      onChange={(e) => setShowStatusConfirm({ orderId: o.id, nextStatus: e.target.value })}
                                      className="text-[0.68rem] font-bold border border-[#EAE0D3] rounded px-1.5 py-1 cursor-pointer bg-white"
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Confirmed">Confirmed</option>
                                      <option value="Preparing">Preparing</option>
                                      <option value="Packed">Packed</option>
                                      <option value="Ready">Ready</option>
                                      <option value="Delivered">Delivered</option>
                                      <option value="Cancelled">Cancelled</option>
                                    </select>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          {orders.length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-[#7E6B5A]">No orders match the selected filters.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── TAB: PICKUP ORDERS ── */}
                {activeTab === "pickup" && (
                  <div className="flex flex-col gap-6">
                    <div className="bg-white border border-[#EAE0D3] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                      <h3 className="font-serif text-xs font-bold uppercase tracking-wider">Store Pickups Board</h3>
                      <span className="text-xs text-[#7E6B5A] font-bold">Total: {orders.filter(o => o.delivery_type === "Pickup").length} orders</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Column 1: Preparing */}
                      <div className="bg-white border border-[#EAE0D3] rounded-xl p-4 flex flex-col gap-4 shadow-2xs">
                        <div className="flex justify-between items-center border-b border-[#EAE0D3] pb-2 text-amber-700">
                          <span className="text-xs font-bold uppercase">Preparing / Pending</span>
                          <span className="text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                            {orders.filter(o => o.delivery_type === "Pickup" && (o.status === "Pending" || o.status === "Confirmed" || o.status === "Preparing")).length}
                          </span>
                        </div>

                        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                          {orders
                            .filter(o => o.delivery_type === "Pickup" && (o.status === "Pending" || o.status === "Confirmed" || o.status === "Preparing"))
                            .map(o => (
                              <div key={o.id} className="p-3 border border-[#EAE0D3] rounded-lg flex flex-col gap-2 bg-[#FCF9F2]/20">
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-[#D46D2D]">#{o.order_number || o.id.substring(0, 8)}</span>
                                  <span className="text-[0.62rem] text-[#7E6B5A] font-bold">{new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="text-xs font-bold">{o.user_name || "Guest"}</div>
                                <div className="text-[0.68rem] text-[#7E6B5A]">{o.user_phone}</div>
                                <button 
                                  onClick={() => setShowStatusConfirm({ orderId: o.id, nextStatus: "Ready" })}
                                  className="mt-1 w-full bg-[#D4AF37] hover:bg-[#B89324] text-white py-1 rounded text-[0.68rem] font-bold transition-all cursor-pointer"
                                >
                                  Mark Ready
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Column 2: Ready for Pickup */}
                      <div className="bg-white border border-[#EAE0D3] rounded-xl p-4 flex flex-col gap-4 shadow-2xs">
                        <div className="flex justify-between items-center border-b border-[#EAE0D3] pb-2 text-blue-700">
                          <span className="text-xs font-bold uppercase">Ready for Pickup</span>
                          <span className="text-xs font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                            {orders.filter(o => o.delivery_type === "Pickup" && (o.status === "Ready" || o.status === "Packed")).length}
                          </span>
                        </div>

                        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                          {orders
                            .filter(o => o.delivery_type === "Pickup" && (o.status === "Ready" || o.status === "Packed"))
                            .map(o => (
                              <div key={o.id} className="p-3 border border-[#EAE0D3] rounded-lg flex flex-col gap-2 bg-[#FCF9F2]/20">
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-[#D46D2D]">#{o.order_number || o.id.substring(0, 8)}</span>
                                  <span className="text-[0.62rem] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded">READY</span>
                                </div>
                                <div className="text-xs font-bold">{o.user_name || "Guest"}</div>
                                <div className="text-[0.68rem] text-[#7E6B5A]">{o.user_phone}</div>
                                <button 
                                  onClick={() => setShowStatusConfirm({ orderId: o.id, nextStatus: "Delivered" })}
                                  className="mt-1 w-full bg-green-600 hover:bg-green-700 text-white py-1 rounded text-[0.68rem] font-bold transition-all cursor-pointer"
                                >
                                  Verify & Complete Pickup
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Column 3: Picked Up */}
                      <div className="bg-white border border-[#EAE0D3] rounded-xl p-4 flex flex-col gap-4 shadow-2xs">
                        <div className="flex justify-between items-center border-b border-[#EAE0D3] pb-2 text-green-700">
                          <span className="text-xs font-bold uppercase">Picked Up / Completed</span>
                          <span className="text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full">
                            {orders.filter(o => o.delivery_type === "Pickup" && o.status === "Delivered").length}
                          </span>
                        </div>

                        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                          {orders
                            .filter(o => o.delivery_type === "Pickup" && o.status === "Delivered")
                            .map(o => (
                              <div key={o.id} className="p-3 border border-[#EAE0D3] rounded-lg flex flex-col gap-1.5 bg-[#FCF9F2]/10 opacity-75">
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-[#7E6B5A]">#{o.order_number || o.id.substring(0, 8)}</span>
                                  <span className="text-[0.62rem] text-green-600 font-bold bg-green-50 px-1.5 py-0.2 rounded">COMPLETED</span>
                                </div>
                                <div className="text-xs font-semibold">{o.user_name || "Guest"}</div>
                                <div className="text-[0.62rem] text-[#7E6B5A]">Amt: ₹{o.total}</div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB: HOME DELIVERY ── */}
                {activeTab === "delivery" && (
                  <div className="bg-white border border-[#EAE0D3] rounded-xl p-5 shadow-2xs flex flex-col gap-5">
                    <h3 className="font-serif text-xs font-bold uppercase tracking-wider border-b border-[#EAE0D3]/50 pb-2">Home Deliveries Terminal</h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#EAE0D3] text-[#7E6B5A] font-semibold">
                            <th className="py-2.5">Order</th>
                            <th className="py-2.5">Customer & Phone</th>
                            <th className="py-2.5">Shipping Address</th>
                            <th className="py-2.5">Zone/Area</th>
                            <th className="py-2.5">Delivery Partner</th>
                            <th className="py-2.5">Status</th>
                            <th className="py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders
                            .filter(o => o.delivery_type === "Home Delivery")
                            .map((o) => (
                              <tr key={o.id} className="border-b border-[#EAE0D3]/40">
                                <td className="py-3 font-bold text-[#D46D2D]">#{o.order_number || o.id.substring(0, 8)}</td>
                                <td className="py-3">
                                  <div className="flex flex-col font-bold">
                                    <span>{o.user_name}</span>
                                    <span className="text-[0.65rem] text-[#7E6B5A]">{o.user_phone}</span>
                                  </div>
                                </td>
                                <td className="py-3 max-w-[200px] truncate text-[#7E6B5A] font-semibold">{o.shipping_address || "No address details"}</td>
                                <td className="py-3 font-bold text-[#D4AF37]">{o.delivery_zone_id || "Standard Zone"}</td>
                                <td className="py-3 text-[#7E6B5A] font-bold">{o.delivery_partner || "Unassigned"}</td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[0.62rem] font-bold ${
                                    o.status === "Delivered" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                                  }`}>
                                    {o.status}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {o.status !== "Delivered" && (
                                      <>
                                        <button 
                                          onClick={() => setShowStatusConfirm({ orderId: o.id, nextStatus: "Preparing" })}
                                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-1 rounded text-[0.68rem] font-bold cursor-pointer"
                                        >
                                          Dispatch Out
                                        </button>
                                        <button 
                                          onClick={() => setShowStatusConfirm({ orderId: o.id, nextStatus: "Delivered" })}
                                          className="bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded text-[0.68rem] font-bold cursor-pointer"
                                        >
                                          Complete
                                        </button>
                                      </>
                                    )}
                                    {o.status === "Delivered" && (
                                      <span className="text-[0.65rem] text-green-600 font-bold">✔ Delivered</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          {orders.filter(o => o.delivery_type === "Home Delivery").length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-[#7E6B5A]">No delivery orders scheduled.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── TAB: INVOICES ── */}
                {activeTab === "invoices" && (
                  <div className="flex flex-col gap-6">
                    {/* Manual Generation Box */}
                    <div className="bg-white border border-[#EAE0D3] rounded-xl p-5 shadow-2xs flex flex-col gap-4">
                      <h3 className="font-serif text-xs font-bold uppercase tracking-wider border-b border-[#EAE0D3]/50 pb-2">Generate Invoice Manually</h3>
                      <div className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex flex-col gap-1.5 flex-grow">
                          <label className="text-[0.68rem] font-bold text-[#2A1E17] uppercase tracking-wider">Select Order Number *</label>
                          <select 
                            value={manualInvoiceOrder} 
                            onChange={(e) => setManualInvoiceOrder(e.target.value)}
                            className="border border-[#EAE0D3] rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                          >
                            <option value="">-- Choose Order --</option>
                            {orders.map(o => (
                              <option key={o.id} value={o.id}>Order #{o.order_number || o.id.substring(0, 8)} - {o.user_name} (₹{o.total})</option>
                            ))}
                          </select>
                        </div>
                        <button 
                          onClick={() => handleGenerateInvoice(manualInvoiceOrder)}
                          disabled={!manualInvoiceOrder || isGeneratingInvoice}
                          className="bg-[#D46D2D] hover:bg-[#BF5E23] text-white px-5 py-2.5 rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          {isGeneratingInvoice ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                            </>
                          ) : (
                            "Generate Invoice PDF"
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Invoice History list */}
                    <div className="bg-white border border-[#EAE0D3] rounded-xl p-5 shadow-2xs flex flex-col gap-4">
                      <div className="flex justify-between items-center border-b border-[#EAE0D3]/50 pb-2">
                        <h3 className="font-serif text-xs font-bold uppercase tracking-wider">Invoice History</h3>
                        <div className="relative flex items-center border border-[#EAE0D3] rounded bg-white px-2 py-1">
                          <Search className="h-3.5 w-3.5 text-[#7E6B5A] mr-1.5" />
                          <input 
                            type="text" 
                            placeholder="Search invoice no..." 
                            value={invoiceSearch}
                            onChange={(e) => setInvoiceSearch(e.target.value)}
                            className="text-[0.68rem] outline-none"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[#EAE0D3] text-[#7E6B5A] font-semibold uppercase tracking-wider">
                              <th className="py-2.5">Invoice No</th>
                              <th className="py-2.5">Order ID</th>
                              <th className="py-2.5">Issue Date</th>
                              <th className="py-2.5">Customer details</th>
                              <th className="py-2.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoices
                              .filter(inv => inv.invoice_number.toLowerCase().includes(invoiceSearch.toLowerCase()))
                              .map(inv => (
                                <tr key={inv.id} className="border-b border-[#EAE0D3]/40">
                                  <td className="py-3.5 font-bold text-[#D46D2D]">{inv.invoice_number}</td>
                                  <td className="py-3.5 font-semibold text-[#7E6B5A]">#{inv.orders?.order_number || inv.order_id?.substring(0, 8)}</td>
                                  <td className="py-3.5 font-semibold text-[#7E6B5A]">{new Date(inv.created_at).toLocaleDateString("en-IN")}</td>
                                  <td className="py-3.5 font-bold">{inv.orders?.user_name || "Customer"}</td>
                                  <td className="py-3.5 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <a 
                                        href={`/api/invoices/download?invoiceId=${inv.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1.5 rounded-lg border border-[#EAE0D3] hover:border-[#D46D2D] text-[#7E6B5A] hover:text-[#D46D2D]"
                                        title="Download PDF"
                                      >
                                        <Download className="h-4 w-4" />
                                      </a>
                                      <button 
                                        onClick={() => handleGenerateInvoice(inv.order_id)}
                                        className="p-1.5 rounded-lg border border-[#EAE0D3] hover:border-[#D46D2D] text-[#7E6B5A] hover:text-[#D46D2D]"
                                        title="Regenerate & Re-email"
                                      >
                                        <RefreshCw className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            {invoices.length === 0 && (
                              <tr>
                                <td colSpan={5} className="py-12 text-center text-[#7E6B5A]">No invoice history available.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB: PAYMENTS ── */}
                {activeTab === "payments" && (
                  <div className="bg-white border border-[#EAE0D3] rounded-xl p-5 shadow-2xs flex flex-col gap-5">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-[#EAE0D3]/50 pb-3">
                      <h3 className="font-serif text-xs font-bold uppercase tracking-wider">Payments Ledger</h3>
                      <div className="flex gap-1">
                        {["All", "Paid", "Pending", "COD", "Online"].map(mode => (
                          <button
                            key={mode}
                            onClick={() => setPaymentFilter(mode)}
                            className={`px-3 py-1.5 rounded text-[0.68rem] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                              paymentFilter === mode 
                                ? "bg-[#D46D2D] text-white" 
                                : "border border-[#EAE0D3] text-[#7E6B5A] hover:bg-[#FCF9F2]/40"
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#EAE0D3] text-[#7E6B5A] font-semibold">
                            <th className="py-2.5">Payment ID</th>
                            <th className="py-2.5">Order ID</th>
                            <th className="py-2.5">Payment Method</th>
                            <th className="py-2.5">Amount</th>
                            <th className="py-2.5">Payment Date</th>
                            <th className="py-2.5">Status</th>
                            <th className="py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments
                            .filter(p => {
                              const s = p.status?.toLowerCase();
                              const m = (p.method || p.payment_method)?.toLowerCase();
                              if (paymentFilter === "Paid") return s === "paid" || s === "completed";
                              if (paymentFilter === "Pending") return s === "pending" || s === "unpaid" || !s;
                              if (paymentFilter === "COD") return m === "cod";
                              if (paymentFilter === "Online") return m !== "cod";
                              return true;
                            })
                            .map((p) => (
                              <tr key={p.id} className="border-b border-[#EAE0D3]/40">
                                <td className="py-3.5 font-semibold text-[#7E6B5A]">
                                  {p.payment_id || p.razorpay_payment_id || (p.id ? `${p.id.substring(0, 10)}...` : "N/A")}
                                </td>
                                <td className="py-3.5 font-bold text-[#D46D2D]">#{p.order_number || p.order_id?.substring(0, 8)}</td>
                                <td className="py-3.5 font-bold text-[#D4AF37] uppercase text-[0.65rem]">{p.method || p.payment_method || "Online"}</td>
                                <td className="py-3.5 font-bold text-[#2A1E17]">₹{p.amount || p.total || 0}</td>
                                <td className="py-3.5 font-semibold text-[#7E6B5A]">
                                  {new Date(p.created_at).toLocaleDateString("en-IN")}
                                </td>
                                <td className="py-3.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[0.62rem] font-bold uppercase ${
                                    p.status?.toLowerCase() === "paid" || p.status?.toLowerCase() === "completed" 
                                      ? "bg-green-50 text-green-700" 
                                      : "bg-amber-50 text-amber-700"
                                  }`}>
                                    {p.status || "Pending"}
                                  </span>
                                </td>
                                <td className="py-3.5 text-right">
                                  {(p.status?.toLowerCase() === "pending" || p.status?.toLowerCase() === "unpaid" || !p.status) && (
                                    <button 
                                      onClick={() => handleVerifyPayment(p.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-[0.68rem] font-bold transition-all cursor-pointer"
                                    >
                                      Verify Paid
                                    </button>
                                  )}
                                  {(p.status?.toLowerCase() === "paid" || p.status?.toLowerCase() === "completed") && (
                                    <span className="text-[0.65rem] text-green-600 font-bold">Verified ✔</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          {payments.length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-[#7E6B5A]">No payment logs match selection parameters.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── TAB: CUSTOMERS ── */}
                {activeTab === "customers" && (
                  <div className="bg-white border border-[#EAE0D3] rounded-xl p-5 shadow-2xs flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-[#EAE0D3]/50 pb-3">
                      <h3 className="font-serif text-xs font-bold uppercase tracking-wider">Customers Database</h3>
                      <div className="relative flex items-center border border-[#EAE0D3] rounded bg-white px-3 py-1.5">
                        <Search className="h-4 w-4 text-[#7E6B5A] mr-2" />
                        <input
                          type="text"
                          placeholder="Search Customers..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="text-xs outline-none bg-transparent"
                        />
                        {customerSearch && (
                          <button onClick={() => setCustomerSearch("")} className="text-[#7E6B5A] hover:text-[#2A1E17]">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#EAE0D3] text-[#7E6B5A] font-semibold uppercase tracking-wider">
                            <th className="py-2.5">Customer Name</th>
                            <th className="py-2.5">Phone Number</th>
                            <th className="py-2.5">Registered Email</th>
                            <th className="py-2.5">Status</th>
                            <th className="py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customers
                            .filter(c => 
                              (c.name || "").toLowerCase().includes(customerSearch.toLowerCase()) ||
                              (c.phone || "").toLowerCase().includes(customerSearch.toLowerCase()) ||
                              (c.email || "").toLowerCase().includes(customerSearch.toLowerCase())
                            )
                            .map(c => (
                              <tr key={c.id} className="border-b border-[#EAE0D3]/40">
                                <td className="py-3 font-bold">{c.name || "N/A"}</td>
                                <td className="py-3 font-semibold text-[#7E6B5A]">{c.phone || "No phone record"}</td>
                                <td className="py-3 text-[#7E6B5A]">{c.email || "No email record"}</td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[0.62rem] font-bold ${
                                    c.status !== "inactive" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                  }`}>
                                    {c.status || "Active"}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <button 
                                    onClick={() => setSelectedCustomer(c)}
                                    className="p-1.5 rounded-lg border border-[#EAE0D3] hover:border-[#D46D2D] text-[#7E6B5A] hover:text-[#D46D2D] cursor-pointer"
                                    title="View Profile"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          {customers.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-[#7E6B5A]">No customer records available.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── TAB: NOTIFICATIONS ── */}
                {activeTab === "notifications" && (
                  <div className="bg-white border border-[#EAE0D3] rounded-xl p-5 shadow-2xs flex flex-col gap-4">
                    <h3 className="font-serif text-xs font-bold uppercase tracking-wider border-b border-[#EAE0D3]/50 pb-2">Terminal notifications</h3>
                    <div className="flex flex-col gap-3">
                      {notifications.map(n => (
                        <div key={n.id} className="p-3 border border-[#EAE0D3] rounded-lg bg-[#FCF9F2]/20 flex justify-between items-start gap-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-[#2A1E17]">{n.title}</span>
                            <span className="text-[0.68rem] text-[#7E6B5A]">{n.message}</span>
                          </div>
                          <span className="text-[0.62rem] text-[#7E6B5A] font-bold whitespace-nowrap">
                            {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <div className="py-12 text-center text-[#7E6B5A] text-xs font-bold">No active notifications today.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── TAB: PROFILE ── */}
                {activeTab === "profile" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Info Card */}
                    <div className="bg-white border border-[#EAE0D3] rounded-xl p-5 shadow-2xs flex flex-col gap-4">
                      <h3 className="font-serif text-xs font-bold uppercase tracking-wider border-b border-[#EAE0D3]/50 pb-2">Employee Terminal Information</h3>
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between border-b border-[#FCF9F2] pb-2 text-xs">
                          <span className="font-bold text-[#7E6B5A]">Employee ID:</span>
                          <span className="font-bold">{workerInfo?.employeeId}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#FCF9F2] pb-2 text-xs">
                          <span className="font-bold text-[#7E6B5A]">Full Name:</span>
                          <span className="font-bold">{workerInfo?.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#FCF9F2] pb-2 text-xs">
                          <span className="font-bold text-[#7E6B5A]">Assigned Role:</span>
                          <span className="font-bold text-[#D4AF37]">{workerInfo?.role}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#FCF9F2] pb-2 text-xs">
                          <span className="font-bold text-[#7E6B5A]">Assigned Branch:</span>
                          <span className="font-bold text-[#D46D2D]">{workerInfo?.branch}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#FCF9F2] pb-2 text-xs">
                          <span className="font-bold text-[#7E6B5A]">Phone Number:</span>
                          <span className="font-bold">{workerInfo?.phone || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#FCF9F2] pb-2 text-xs">
                          <span className="font-bold text-[#7E6B5A]">Terminal Status:</span>
                          <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full text-[0.62rem]">Active</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Security Pin Form */}
                    <div className="bg-white border border-[#EAE0D3] rounded-xl p-5 shadow-2xs flex flex-col gap-4">
                      <h3 className="font-serif text-xs font-bold uppercase tracking-wider border-b border-[#EAE0D3]/50 pb-2">Change Password PIN</h3>
                      <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
                        {passwordError && <span className="text-red-500 text-[0.65rem] font-bold">{passwordError}</span>}
                        {passwordSuccess && <span className="text-green-600 text-[0.65rem] font-bold">{passwordSuccess}</span>}

                        <div className="flex flex-col gap-1">
                          <label className="text-[0.65rem] font-bold text-[#2A1E17] uppercase tracking-wider">Current Password</label>
                          <input 
                            type="password" 
                            value={oldPassword} 
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="border border-[#EAE0D3] rounded-lg px-3 py-2 text-xs bg-[#FCF9F2]/20 focus:outline-none focus:border-[#D46D2D]"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[0.65rem] font-bold text-[#2A1E17] uppercase tracking-wider">New Password PIN</label>
                          <input 
                            type="password" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="border border-[#EAE0D3] rounded-lg px-3 py-2 text-xs bg-[#FCF9F2]/20 focus:outline-none focus:border-[#D46D2D]"
                            required
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={isChangingPass}
                          className="bg-[#D46D2D] hover:bg-[#BF5E23] text-white py-2 rounded-lg text-xs font-bold transition-all cursor-pointer mt-1 flex justify-center items-center gap-1.5"
                        >
                          {isChangingPass ? (
                            <>
                              <Loader2 className="h-4.5 w-4.5 animate-spin" /> Updating...
                            </>
                          ) : (
                            "Update Password PIN"
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* ── MODAL: STATUS UPDATE CONFIRMATION ── */}
      {showStatusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs select-none">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="w-full max-w-sm bg-white border border-[#EAE0D3] rounded-2xl p-5 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <AlertTriangle className="h-5 w-5" />
              <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#2A1E17]">Confirm Status Change</h4>
            </div>
            <p className="text-xs text-[#7E6B5A]">
              Are you sure you want to change the status of this order to <strong>{showStatusConfirm.nextStatus}</strong>? This action updates the ledger immediately.
            </p>
            <div className="flex justify-end gap-2.5 mt-2">
              <button 
                onClick={() => setShowStatusConfirm(null)}
                className="px-4 py-2 border border-[#EAE0D3] rounded-lg text-xs font-bold text-[#7E6B5A] hover:bg-[#FCF9F2]/40 cursor-pointer"
              >
                Abort
              </button>
              <button 
                onClick={handleStatusUpdate}
                className="px-5 py-2 bg-[#D46D2D] hover:bg-[#BF5E23] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Confirm Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── MODAL: ORDER DETAILS VIEW ── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.95, y: 10, opacity: 0 }} 
            animate={{ scale: 1, y: 0, opacity: 1 }} 
            className="w-full max-w-2xl bg-white border border-[#EAE0D3] rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#EAE0D3] pb-3 mb-2">
              <h4 className="font-serif text-sm font-bold text-[#2A1E17]">
                Order Details: #{selectedOrder.order_number || selectedOrder.id.substring(0, 8)}
              </h4>
              <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-[#FCF9F2] rounded-full">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-[#7E6B5A] font-bold">Customer Name:</span>
                <span className="font-bold text-[#2A1E17]">{selectedOrder.user_name || "Guest"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#7E6B5A] font-bold">Phone Number:</span>
                <span className="font-bold text-[#2A1E17]">{selectedOrder.user_phone}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#7E6B5A] font-bold">Delivery Type:</span>
                <span className="font-bold text-[#D4AF37] uppercase">{selectedOrder.delivery_type}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#7E6B5A] font-bold">Payment Method:</span>
                <span className="font-bold text-[#2A1E17]">{selectedOrder.payment_method || "Online"}</span>
              </div>
              {selectedOrder.delivery_type === "Home Delivery" && (
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <span className="text-[#7E6B5A] font-bold">Shipping Address:</span>
                  <span className="font-semibold text-[#2A1E17] bg-[#FCF9F2]/30 p-2 border border-[#EAE0D3]/50 rounded">
                    {selectedOrder.shipping_address || "No address given"}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-[#EAE0D3]/80 pt-4 flex flex-col gap-3">
              <h5 className="font-serif text-xs font-bold uppercase tracking-wider">Ordered Products</h5>
              <div className="flex flex-col gap-2 bg-[#FCF9F2]/20 border border-[#EAE0D3]/40 rounded-xl p-3">
                {selectedOrder.order_items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-[#EAE0D3]/20 last:border-none">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#2A1E17]">{item.product_name}</span>
                      <span className="text-[0.68rem] text-[#7E6B5A]">Qty: {item.quantity} • {item.weight}</span>
                    </div>
                    <span className="font-bold text-[#2A1E17]">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-[#EAE0D3]/80 pt-4 mt-2">
              <div className="flex flex-col">
                <span className="text-[#7E6B5A] text-[0.68rem] font-bold uppercase">Total Amount Due</span>
                <span className="text-base font-bold text-[#D46D2D]">₹{selectedOrder.total}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { handleGenerateInvoice(selectedOrder.id); setSelectedOrder(null); }}
                  className="bg-[#D46D2D] hover:bg-[#BF5E23] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="h-4 w-4" /> Print / Email Invoice
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── MODAL: CUSTOMER PROFILE VIEW ── */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.95, y: 10, opacity: 0 }} 
            animate={{ scale: 1, y: 0, opacity: 1 }} 
            className="w-full max-w-lg bg-white border border-[#EAE0D3] rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#EAE0D3] pb-3 mb-2">
              <h4 className="font-serif text-sm font-bold text-[#2A1E17]">Customer Profile: {selectedCustomer.name}</h4>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-[#FCF9F2] rounded-full">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs border-b border-[#EAE0D3] pb-4">
              <div className="flex justify-between py-1 border-b border-[#FCF9F2]">
                <span className="font-bold text-[#7E6B5A]">Mobile Phone:</span>
                <span className="font-bold">{selectedCustomer.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#FCF9F2]">
                <span className="font-bold text-[#7E6B5A]">Email Address:</span>
                <span className="font-bold text-slate-800">{selectedCustomer.email || "N/A"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#FCF9F2]">
                <span className="font-bold text-[#7E6B5A]">Status:</span>
                <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-[0.62rem]">{selectedCustomer.status || "Active"}</span>
              </div>
            </div>

            {/* View customer past orders */}
            <div className="flex flex-col gap-3">
              <h5 className="font-serif text-xs font-bold uppercase tracking-wider">Purchase History</h5>
              <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1">
                {orders
                  .filter(o => o.user_phone === selectedCustomer.phone)
                  .map(o => (
                    <div key={o.id} className="p-3 border border-[#EAE0D3]/60 rounded-lg flex justify-between items-center text-xs hover:bg-[#FCF9F2]/20 transition-colors">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-[#D46D2D]">#{o.order_number || o.id.substring(0, 8)}</span>
                        <span className="text-[0.62rem] text-[#7E6B5A]">{new Date(o.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-col text-right gap-0.5">
                        <span className="font-bold">₹{o.total}</span>
                        <span className="text-[0.62rem] text-slate-500 font-bold uppercase">{o.delivery_type}</span>
                      </div>
                    </div>
                  ))}
                {orders.filter(o => o.user_phone === selectedCustomer.phone).length === 0 && (
                  <span className="text-xs text-[#7E6B5A] py-4 text-center">No past orders registered.</span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── LIVE NEW ORDER ALERT TOAST ── */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 20, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 inset-x-0 mx-auto w-full max-w-sm bg-white border-2 border-[#D46D2D] rounded-xl p-4 shadow-2xl z-55 flex flex-col gap-2.5"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-[#D46D2D]">
                <Bell className="h-5 w-5 animate-bounce" />
                <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#2A1E17]">NEW ORDER RECEIVED!</span>
              </div>
              <button 
                onClick={() => setNewOrderAlert(null)}
                className="p-1 hover:bg-[#FCF9F2] rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-[#7E6B5A]">
              Order <strong>#{newOrderAlert.order_number || newOrderAlert.id.substring(0, 8)}</strong> has been placed by <strong>{newOrderAlert.user_name || "Guest"}</strong> for <strong>₹{newOrderAlert.total}</strong>.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setSelectedOrder(newOrderAlert);
                  setNewOrderAlert(null);
                  setActiveTab("orders");
                }}
                className="bg-[#D46D2D] hover:bg-[#BF5E23] text-white px-3 py-1.5 rounded text-[0.68rem] font-bold cursor-pointer"
              >
                View Details
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── WORKER DOWNSIZE MOBILE BOTTOM NAVBAR ── */}
      {isAuth && (
        <div className="fixed bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-[#EAE0D3] shadow-[0_10px_30px_rgba(0,0,0,0.08)] h-[65px] rounded-full flex items-center justify-around md:hidden px-2">
          {[
            { id: "dashboard", label: "Stats", icon: LayoutDashboard },
            { id: "orders", label: "Orders", icon: ShoppingBag },
            { id: "delivery", label: "Delivery", icon: Truck },
            { id: "invoices", label: "Invoices", icon: FileText },
            { id: "payments", label: "Payments", icon: CreditCard }
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className="flex flex-col items-center justify-center h-full flex-1 cursor-pointer"
              >
                <div className={`px-4 py-1.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive ? "bg-[#FDF2EC] text-[#D46D2D]" : "text-[#7E6B5A]"
                }`}>
                  <Icon className="w-4.5 h-4.5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[0.55rem] font-bold tracking-wider uppercase mt-1 transition-colors duration-300 ${
                  isActive ? "text-[#D46D2D]" : "text-[#7E6B5A]"
                }`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
