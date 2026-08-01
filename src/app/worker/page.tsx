"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAudio } from "@/lib/hooks/useAudio";
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
  Lock,
  Volume2,
  VolumeX,
  Sliders
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminPrinters from "@/components/AdminPrinters";
import AdminInvoices from "@/components/AdminInvoices";
import { AdminCustomers } from "@/components/admin/AdminCustomers";
import { OrderCard } from "@/components/admin/OrderCard";
import { WAOrderCard } from "@/components/admin/WAOrderCard";
import { SearchToolbar } from "@/components/admin/SearchToolbar";
import { AnalyticsCards } from "@/components/admin/AnalyticsCards";
import { OrdersSkeleton } from "@/components/admin/OrdersSkeleton";
import { MessageCircle } from "lucide-react";

export default function WorkerPanel() {
  // --- AUTH STATE ---
  const [isAuth, setIsAuth] = useState(false);
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [workerInfo, setWorkerInfo] = useState<any>(null);

  // --- UI NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState<string>("orders");
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
  
  // --- WA ORDER STATES ---
  const [waStatusFilter, setWaStatusFilter] = useState("All");
  const [waDateFilter, setWaDateFilter] = useState("All");
  const [waSearchQuery, setWaSearchQuery] = useState("");
  const [waSelectedOrder, setWaSelectedOrder] = useState<any>(null);

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

  // --- NOTIFICATION ENGINE STATES ---
  const [settings, setSettings] = useState({
    enableSound: true,
    enableDesktop: true,
    repeatSound: true,
    volume: 0.8,
    duration: 10
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [alarmOrders, setAlarmOrders] = useState<any[]>([]);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Shared audio manager (singleton — preloaded, unlock-on-gesture, dedup)
  const audio = useAudio();

  // Check login state and settings on mount
  useEffect(() => {
    const stored = localStorage.getItem("mehta_worker_auth");
    const storedUser = localStorage.getItem("mehta_worker_user") || localStorage.getItem("mehta_worker_info");
    if (stored === "true" || storedUser) {
      setIsAuth(true);
      if (storedUser) {
        try {
          setWorkerInfo(JSON.parse(storedUser));
        } catch (e) {}
      }
    }

    const storedSettings = localStorage.getItem("mehta_worker_notif_settings");
    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch (e) {}
    }
  }, []);

  // Request browser notification permissions
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default' && settings.enableDesktop) {
        Notification.requestPermission();
      }
    }
  }, [settings.enableDesktop]);

  // Online/Offline Connection State
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => {
      setIsOnline(true);
      loadPanelData(); // Fetch missed data
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- REALTIME NOTIFICATIONS ---
  const [newOrderAlert, setNewOrderAlert] = useState<any>(null);
  const [fullscreenOrderAlert, setFullscreenOrderAlert] = useState<any>(null);

  // Helpers — guards settings.enableSound before delegating to AudioManager
  const playStandardSound = () => {
    if (!settings.enableSound) return;
    audio.setVolume(settings.volume);
    audio.play();
  };

  const playErrorSound = () => {
    if (!settings.enableSound) return;
    audio.setVolume(settings.volume);
    audio.play();
  };

  // Sound Repeat loop (alarm) until order is acknowledged
  useEffect(() => {
    if (alarmOrders.length > 0 && settings.repeatSound && !audio.isMuted) {
      if (!alarmIntervalRef.current) {
        // Play immediately
        playStandardSound();
        alarmIntervalRef.current = setInterval(() => {
          playStandardSound();
        }, 5000);
      }
    } else {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    }
    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    };
  }, [alarmOrders, settings.repeatSound, audio.isMuted, settings.volume, settings.enableSound]);

  const showDesktopNotification = (order: any) => {
    if (!settings.enableDesktop || typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      const title = `🍬 New Order Received (#${order.orderNumber || order.id.substring(0, 6)})`;
      const body = `Customer: ${order.userName || 'Guest'}\nAmount: ₹${order.total}\nType: ${order.source === 'whatsapp' ? 'WhatsApp' : 'Website'}`;
      const notif = new Notification(title, {
        body,
        icon: '/logo.png'
      });
      notif.onclick = () => {
        window.focus();
        setSelectedOrder(order);
        setAlarmOrders(prev => prev.filter(o => o.id !== order.id));
      };
    }
  };

  useEffect(() => {
    if (!isAuth) return;

    const channel = supabase
      .channel("live-worker-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          console.log("New order detected realtime:", payload.new);
          // Format new order obj
          const o = payload.new;
          const formatted = {
            id: o.id,
            orderNumber: o.order_number,
            date: new Date(o.created_at).toLocaleDateString(),
            createdAtRaw: o.created_at,
            status: o.status,
            total: o.total,
            paymentStatus: o.payment_status,
            userName: o.user_name,
            userPhone: o.user_phone,
            userEmail: o.user_email,
            shippingAddress: o.shipping_address,
            printed: o.printed,
            printStatus: o.print_status || 'pending',
            source: String(o.source || 'website').toLowerCase(),
            deliveryType: o.delivery_type,
            items: []
          };
          
          playStandardSound();
          setAlarmOrders(prev => {
            if (prev.some(x => x.id === formatted.id)) return prev;
            return [...prev, formatted];
          });
          setFullscreenOrderAlert(formatted);
          showDesktopNotification(formatted);
          loadPanelData();
          // Auto-scroll only if worker is already near the top
          if (typeof window !== 'undefined' && window.scrollY < 200) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          console.log("New notification detected realtime:", payload.new);
          const notif = payload.new;
          if (notif.type === 'print_failed') {
            playErrorSound();
          } else {
            playStandardSound();
          }
          setNewOrderAlert({
            title: notif.title,
            message: notif.message
          });
          loadPanelData();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          console.log("Order updated detected realtime:", payload.new);
          // Update printed/printStatus if changed
          loadPanelData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuth, settings, isMuted]);

  // Fetch data on activeTab change or auth success
  useEffect(() => {
    if (!isAuth) return;
    loadPanelData();
  }, [isAuth, activeTab]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: any) => {
    const payStatus = newStatus === 'Delivered' ? 'Paid' : orders.find(o => o.id === orderId)?.paymentStatus;

    if (newStatus === 'Delivered') {
        const order = orders.find(o => o.id === orderId);
        if (order?.userPhone) {
            try {
                await fetch('/api/notifications/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: order.userPhone,
                        title: 'Order Delivered! 🚀',
                        body: `Your order #${order.orderNumber || order.id.substring(0,6)} has been delivered. Enjoy!`,
                        url: '/account'
                    })
                });
            } catch (e) {
                console.error("Failed to push notification", e);
            }
        }
    }

    try {
        const res = await fetch('/api/admin/update-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId,
                newStatus,
                paymentStatus: payStatus
            })
        });
        const data = await res.json();
        
        if (data.success) {
            const updated = orders.map(o => {
                if (o.id === orderId) {
                    return { ...o, status: newStatus, paymentStatus: payStatus as string };
                }
                return o;
            });
            setOrders(updated as any);
        } else {
            alert("Failed to update order: " + data.error);
        }
    } catch (e) {
        console.error("Error updating order via API:", e);
    }
  };

  const handleResendNotification = async (orderId: string, notificationType: string) => {
    try {
        const res = await fetch('/api/admin/resend-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, notificationType })
        });
        const data = await res.json();
        if (data.success) {
            alert(`Successfully resent ${notificationType} WhatsApp notification.`);
        } else {
            alert(`Failed to resend notification: ${data.error}`);
        }
    } catch (e) {
        console.error("Error resending notification:", e);
    }
  };

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
            createdAtRaw: o.created_at,
            status: o.status,
            total: o.total,
            paymentStatus: o.payment_status,
            userName: o.user_name,
            userPhone: o.user_phone,
            userEmail: o.user_email,
            shippingAddress: o.shipping_address,
            printed: o.printed,
            printStatus: o.print_status || 'pending',
            source: String(o.source || 'website').toLowerCase(),
            deliveryType: o.delivery_type,
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
    // Unlock audio immediately using this login click as the user gesture.
    // Must be called BEFORE any await so the browser gesture context is still active.
    audio.unlock();
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

  const handleMarkNotifRead = async (id: string) => {
    try {
      await fetch(`/api/notifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch(e) {}
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await fetch(`/api/notifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readAll: true })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch(e) {}
  };

  const handleClearAllNotifs = async () => {
    try {
      await fetch(`/api/notifications?clearAll=true`, {
        method: "DELETE"
      });
      setNotifications([]);
    } catch(e) {}
  };

  const [reprintingOrderId, setReprintingOrderId] = useState<string | null>(null);

  const handleReprintOrder = async (orderId: string) => {
    if (reprintingOrderId === orderId) return;
    setReprintingOrderId(orderId);
    try {
      const res = await fetch("/api/print/reprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (data.success) {
        window.dispatchEvent(new CustomEvent("showToast", { detail: { message: "Reprint queued successfully!", type: "success" } }));
        loadPanelData();
      } else {
        throw new Error(data.error || "Failed to reprint order");
      }
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent("showToast", { detail: { message: err.message || "Failed to reprint", type: "error" } }));
    } finally {
      setReprintingOrderId(null);
    }
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
      if (!o.createdAtRaw) return false;
      const today = new Date().toDateString();
      return new Date(o.createdAtRaw).toDateString() === today;
    }).length,
    pending: orders.filter(o => o.status === "Pending" || o.status === "Confirmed").length,
    preparing: orders.filter(o => o.status === "Preparing").length,
    ready: orders.filter(o => o.status === "Ready" || o.status === "Packed").length,
    delivered: orders.filter(o => o.status === "Delivered").length,
    delivery: orders.filter(o => o.deliveryType === "Home Delivery").length,
    todayRevenue: orders
      .filter(o => {
        if (!o.createdAtRaw) return false;
        const today = new Date().toDateString();
        return new Date(o.createdAtRaw).toDateString() === today && (o.paymentStatus === "Paid" || o.status === "Delivered");
      })
      .reduce((sum, o) => sum + (o.total || 0), 0),
    pendingPayments: orders.filter(o => o.paymentStatus === "Pending" || o.paymentStatus === "Unpaid").length
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
    { id: "orders", label: "Order Tracking", icon: ShoppingBag },
    { id: "whatsapp_orders", label: "🟢 WhatsApp Orders", icon: MessageCircle },
    { id: "invoices", label: "Invoice Management", icon: FileText },
    { id: "customers", label: "Customer Directory", icon: Users },
    { id: "printers", label: "Print Agent Settings", icon: Printer },
    { id: "settings", label: "Notification Settings", icon: Lock }
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
              className="p-1.5 rounded-lg border border-[#EAE0D3] hover:bg-[#FCF9F2] text-[#2A1E17] cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>
            <h1 className="font-serif text-sm font-bold text-[#2A1E17] uppercase tracking-wider">
              {MENU_ITEMS.find(m => m.id === activeTab)?.label}
            </h1>
            
            {/* Live Connection Badge */}
            {!isOnline ? (
              <span className="text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                🔴 Offline
              </span>
            ) : (
              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                🟢 Online
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Alarm orders alert flash */}
            {alarmOrders.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg font-bold animate-pulse">
                🚨 {alarmOrders.length} Unacknowledged Orders
              </span>
            )}

            {/* Mute/Unmute Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Unmute terminal sound" : "Mute terminal sound"}
              className="p-1.5 rounded-lg border border-[#EAE0D3] hover:bg-[#FCF9F2] text-[#7E6B5A] cursor-pointer transition-all"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-600" /> : <Volume2 className="h-4 w-4 text-emerald-600" />}
            </button>

            {/* Bell notification badge */}
            <button
              onClick={() => setIsNotificationDrawerOpen(true)}
              title="Open Notification Drawer"
              className="relative p-1.5 rounded-lg border border-[#EAE0D3] hover:bg-[#FCF9F2] text-[#2A1E17] cursor-pointer transition-all"
            >
              <Bell className="h-4 w-4" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

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
          {newOrderAlert && (
            <div className="bg-[#D46D2D] text-white border border-[#B45309] rounded-xl p-4 flex justify-between items-center mb-6 shadow-md animate-bounce">
              <div className="flex items-center gap-3">
                <span className="text-xl">🧁</span>
                <div>
                  <h4 className="font-bold text-[0.65rem] uppercase tracking-wider text-white/95">{newOrderAlert.title}</h4>
                  <p className="text-sm font-black mt-0.5">{newOrderAlert.message}</p>
                </div>
              </div>
              <button 
                onClick={() => setNewOrderAlert(null)}
                className="text-white hover:text-[#FCF9F2] bg-white/20 hover:bg-white/35 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex-shrink-0"
              >
                Acknowledge
              </button>
            </div>
          )}

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
                  <div className="flex flex-col gap-6 animate-fade-in text-gray-900 font-sans">
                    {/* Stat Cards - Replaced with robust Admin-style AnalyticsCards */}
                    <AnalyticsCards orders={orders} />

                    {/* Lower grid: Recent orders, activities, quick actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Column 1 & 2: Recent Orders */}
                      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-2xs flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                          <h3 className="font-serif text-sm font-extrabold text-gray-900 flex items-center gap-2">
                            Recent Live Orders
                          </h3>
                          <button onClick={() => setActiveTab("orders")} className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-0.5">
                            View All <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-col gap-2.5">
                          {orders.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-500 font-medium">No recent orders available.</div>
                          ) : (
                            orders.slice(0, 5).map(o => (
                              <OrderCard 
                                key={o.id} 
                                order={o} 
                                onUpdateStatus={handleUpdateOrderStatus} 
                                onResendNotification={handleResendNotification} 
                                onReprint={handleReprintOrder}
                              />
                            ))
                          )}
                        </div>
                      </div>

                      {/* Column 3: Quick Actions & Timeline */}
                      <div className="flex flex-col gap-6">
                        {/* Quick Actions */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs flex flex-col gap-4">
                          <h3 className="font-serif text-sm font-extrabold text-gray-900 border-b border-gray-200 pb-3">Quick Actions</h3>
                          <div className="grid grid-cols-1 gap-2.5">
                            <button onClick={() => { setActiveTab("invoices"); }} className="w-full flex items-center justify-between p-3.5 rounded-lg border border-gray-200 hover:border-amber-500 hover:bg-amber-50/50 text-sm font-bold text-gray-800 transition-all cursor-pointer">
                              <span>Generate Invoice</span>
                              <FileText className="h-4 w-4 text-amber-600" />
                            </button>
                            <button onClick={() => { setActiveTab("whatsapp_orders"); }} className="w-full flex items-center justify-between p-3.5 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-sm font-bold text-gray-800 transition-all cursor-pointer">
                              <span>WhatsApp Orders Live</span>
                              <MessageCircle className="h-4 w-4 text-emerald-600" />
                            </button>
                          </div>
                        </div>

                        {/* Activity Timeline */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs flex flex-col gap-4">
                          <h3 className="font-serif text-sm font-extrabold text-gray-900 border-b border-gray-200 pb-3">Activity Timeline</h3>
                          <div className="pl-3 border-l-2 border-gray-100 flex flex-col gap-4 py-2">
                            {notifications.length > 0 ? (
                              notifications.slice(0, 3).map((n, i) => (
                                <div key={i} className="relative">
                                  <div className="absolute -left-[1.15rem] top-1 h-2 w-2 rounded-full bg-amber-500 ring-4 ring-white" />
                                  <p className="text-xs font-semibold text-gray-800">{n.title || "Notification"}</p>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{new Date(n.created_at).toLocaleTimeString()}</p>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-gray-400 font-medium">No recent terminal activities.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB: ORDERS ── */}
                {activeTab === "orders" && (
                    <div className="flex flex-col gap-6 animate-fade-in">
                        {/* KPI Analytics Grid */}
                        <AnalyticsCards orders={orders.filter(o => (o as any).source !== 'whatsapp')} />

                        {/* Search Toolbar */}
                        <SearchToolbar
                            searchQuery={orderSearch}
                            onSearchChange={setOrderSearch}
                            statusFilter={orderFilter}
                            onStatusChange={setOrderFilter}
                            ordersCount={orders.filter(o => (o as any).source !== 'whatsapp').length}
                            onResetFilters={() => {
                                setOrderSearch("");
                                setOrderFilter("All");
                            }}
                        />

                        {/* Orders List / Loading Skeleton */}
                        {isLoading ? (
                            <OrdersSkeleton count={6} />
                        ) : orders.filter(o => (o as any).source !== 'whatsapp').length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-white border border-[#EAE0D3] rounded-2xl text-center">
                                <ShoppingBag className="w-12 h-12 text-[#D97706]/40 mb-3" />
                                <h4 className="font-serif font-bold text-base text-[#3B2416]">No Orders Found</h4>
                                <p className="text-xs text-muted-foreground mt-1 max-w-sm">No orders have been recorded in the database matching your criteria.</p>
                                <button
                                    onClick={() => {
                                        setOrderSearch("");
                                        setOrderFilter("All");
                                    }}
                                    className="mt-4 px-4 py-2 bg-[#3B2416] text-white text-xs font-bold rounded-xl hover:bg-black transition-colors"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            (() => {
                                const filteredOrders = orders.filter((o) => {
                                    const sourceStr = String((o as any).source || '').toLowerCase();
                                    const matchesSource = sourceStr !== 'whatsapp';
                                    const matchesStatus = orderFilter === "All" ||
                                        (orderFilter === "Processing" && (o.status === "Processing" || o.status === "Pending" || o.status === "Confirmed" || o.status === "Paid")) ||
                                        o.status === orderFilter;
                                    const query = orderSearch.toLowerCase();
                                    const orderNumStr = String(o.orderNumber || o.id || '').toLowerCase();
                                    const matchesSearch =
                                        orderNumStr.includes(query) ||
                                        (o.userName && o.userName.toLowerCase().includes(query)) ||
                                        (o.userPhone && o.userPhone.includes(query)) ||
                                        ((o as any).userEmail && (o as any).userEmail.toLowerCase().includes(query));
                                    return matchesSource && matchesStatus && matchesSearch;
                                });

                                if (filteredOrders.length === 0) {
                                    return (
                                        <div className="flex flex-col items-center justify-center p-12 bg-white border border-[#EAE0D3] rounded-2xl text-center">
                                            <Search className="w-10 h-10 text-muted-foreground/40 mb-3" />
                                            <h4 className="font-serif font-bold text-sm text-[#3B2416]">No Matching Orders</h4>
                                            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search terms or status filters.</p>
                                            <button
                                                onClick={() => {
                                                    setOrderSearch("");
                                                    setOrderFilter("All");
                                                }}
                                                className="mt-4 px-4 py-2 bg-[#D97706] text-white text-xs font-bold rounded-xl hover:bg-[#b46003] transition-colors"
                                            >
                                                Clear Search & Filters
                                            </button>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="flex flex-col gap-3">
                                        {filteredOrders.map((o) => (
                                            <OrderCard
                                                key={o.id}
                                                order={o}
                                                onUpdateStatus={handleUpdateOrderStatus}
                                                onResendNotification={handleResendNotification}
                                                onReprint={handleReprintOrder}
                                            />
                                        ))}
                                    </div>
                                );
                            })()
                        )}
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
                                    o.status === "Delivered" ? "bg-green-50 text-green-700" :
                                    (o.status === "Cancelled" || o.status === "Cancellation Requested") ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                                  }`}>
                                    {o.status}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {o.status === "Cancellation Requested" ? (
                                      <div className="flex items-center gap-1">
                                        <button 
                                          onClick={() => setShowStatusConfirm({ orderId: o.id, nextStatus: "Cancelled" })}
                                          className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded text-[0.65rem] font-black uppercase tracking-wider cursor-pointer shadow-2xs"
                                          title="Approve Customer Cancellation Request"
                                        >
                                          ✓ Approve Cancel
                                        </button>
                                        <button 
                                          onClick={() => setShowStatusConfirm({ orderId: o.id, nextStatus: "Processing" })}
                                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-[0.65rem] font-bold cursor-pointer"
                                          title="Reject Request & Resume Order"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    ) : o.status === "Cancelled" ? (
                                      <span className="px-3 py-1.5 bg-red-600 text-white text-[0.62rem] font-black rounded-lg uppercase tracking-wider">
                                        CANCELLED
                                      </span>
                                    ) : o.status !== "Delivered" ? (
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
                                    ) : null}
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
                  <div className="bg-white border border-[#EAE0D3] rounded-xl shadow-2xs overflow-hidden p-4">
                    <AdminInvoices />
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
                  <div className="bg-white border border-[#EAE0D3] rounded-xl shadow-2xs overflow-hidden p-4">
                    <AdminCustomers
                      dbCustomers={customers}
                      orders={orders}
                      customerSearchQuery={customerSearch}
                      setCustomerSearchQuery={setCustomerSearch}
                      handleSendAdminPush={async () => {}}
                    />
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

                {/* ── TAB: WHATSAPP ORDERS ── */}
                {activeTab === "whatsapp_orders" && (
                    <div className="flex flex-col gap-5 animate-fade-in text-gray-900 font-sans">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                            <div>
                                <h3 className="font-serif text-lg font-extrabold text-gray-900 flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                                    WhatsApp Orders Management
                                </h3>
                                <p className="text-xs text-gray-500 font-medium">
                                    Monitor, manage and process orders received through WhatsApp in real-time.
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg px-2.5 py-1 font-bold">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                WhatsApp Live Portal
                            </span>
                        </div>

                        {/* Analytics KPIs */}
                        <AnalyticsCards orders={orders.filter(o => (o as any).source === 'whatsapp')} />

                        {/* Search & Filters */}
                        <SearchToolbar
                            searchQuery={waSearchQuery}
                            onSearchChange={setWaSearchQuery}
                            statusFilter={waStatusFilter}
                            onStatusChange={setWaStatusFilter}
                            ordersCount={orders.filter(o => (o as any).source === 'whatsapp').length}
                            onResetFilters={() => {
                                setWaSearchQuery("");
                                setWaStatusFilter("All");
                                setWaDateFilter("All");
                            }}
                        />

                        {/* WhatsApp Orders List */}
                        {isLoading ? (
                            <OrdersSkeleton count={6} />
                        ) : orders.filter(o => (o as any).source === 'whatsapp').length === 0 ? (
                            <div className="p-12 bg-white rounded-xl border border-gray-200 text-center flex flex-col items-center justify-center">
                                <MessageCircle className="w-12 h-12 text-emerald-300 mb-3" />
                                <h4 className="font-serif font-bold text-base text-gray-900">No WhatsApp Orders Recorded</h4>
                                <p className="text-xs text-gray-500 mt-1 max-w-sm">No incoming WhatsApp orders have been registered in the database.</p>
                            </div>
                        ) : (
                            (() => {
                                const filtered = orders.filter((o) => {
                                    if (String((o as any).source || '').toLowerCase() !== 'whatsapp') return false;

                                    const matchesStatus = (() => {
                                        if (waStatusFilter === "All") return true;
                                        if (waStatusFilter === "Pending") return o.paymentStatus === "Pending" && o.status !== "Cancelled";
                                        if (waStatusFilter === "Paid") return o.paymentStatus === "Paid";
                                        if (waStatusFilter === "Failed") return o.paymentStatus === "Failed";
                                        if (waStatusFilter === "Cancelled") return o.status === "Cancelled";
                                        if (waStatusFilter === "Delivered") return o.status === "Delivered";
                                        if (waStatusFilter === "Processing") return o.status === "Processing";
                                        return true;
                                    })();

                                    const matchesDate = (() => {
                                        if (waDateFilter === "All") return true;
                                        const orderDate = (o as any).createdAtRaw ? new Date((o as any).createdAtRaw) : new Date();
                                        if (waDateFilter === "Today") {
                                            return orderDate.toDateString() === new Date().toDateString();
                                        }
                                        if (waDateFilter === "This Week") {
                                            const oneWeekAgo = new Date();
                                            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                                            return orderDate >= oneWeekAgo;
                                        }
                                        return true;
                                    })();

                                    const query = waSearchQuery.toLowerCase();
                                    const matchesSearch =
                                        (o.orderNumber && o.orderNumber.toLowerCase().includes(query)) ||
                                        (o.userName && o.userName.toLowerCase().includes(query)) ||
                                        (o.userPhone && o.userPhone.includes(query)) ||
                                        (o.id && o.id.toLowerCase().includes(query));

                                    return matchesStatus && matchesDate && matchesSearch;
                                });

                                if (filtered.length === 0) {
                                    return (
                                        <div className="p-12 bg-white rounded-xl border border-gray-200 text-center flex flex-col items-center justify-center">
                                            <Search className="w-10 h-10 text-gray-300 mb-3" />
                                            <h4 className="font-serif font-bold text-sm text-gray-900">No Matching WhatsApp Orders</h4>
                                            <p className="text-xs text-gray-500 mt-1">Try adjusting your search terms or status filters.</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="flex flex-col gap-2.5">
                                        {filtered.map((o) => (
                                            <WAOrderCard
                                                key={o.id}
                                                order={o}
                                                onUpdateStatus={handleUpdateOrderStatus}
                                                onResendNotification={handleResendNotification}
                                                onReprint={handleReprintOrder}
                                                onViewDetails={(ord) => setWaSelectedOrder(ord)}
                                            />
                                        ))}
                                    </div>
                                );
                            })()
                        )}
                    </div>
                )}

                {/* ── TAB: PRINTERS ── */}
                {activeTab === "printers" && (
                  <div className="bg-white border border-[#EAE0D3] rounded-xl shadow-2xs overflow-hidden p-4">
                    <AdminPrinters />
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

                {/* ── TAB: SETTINGS ── */}
                {activeTab === "settings" && (
                  <div className="bg-white border border-[#EAE0D3] rounded-xl p-5 shadow-2xs flex flex-col gap-6 max-w-2xl">
                    <div>
                      <h3 className="font-serif text-sm font-bold uppercase tracking-wider border-b border-[#EAE0D3]/50 pb-2 flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-[#D46D2D]" /> Notification & Alarm Settings
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 font-medium">Configure how this terminal responds to incoming orders.</p>
                    </div>

                    <div className="flex flex-col gap-5 text-xs font-bold text-gray-700">
                      {/* Enable Sound */}
                      <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-150 rounded-xl cursor-pointer">
                        <div className="flex flex-col gap-0.5">
                          <span>Enable Sound Alerts</span>
                          <span className="text-[10px] text-gray-400 font-medium">Play chime sounds on new order arrival.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.enableSound}
                          onChange={(e) => {
                            const updated = { ...settings, enableSound: e.target.checked };
                            setSettings(updated);
                            localStorage.setItem("mehta_worker_notif_settings", JSON.stringify(updated));
                          }}
                          className="accent-[#D46D2D] w-4.5 h-4.5"
                        />
                      </label>

                      {/* Enable Desktop Alerts */}
                      <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-150 rounded-xl cursor-pointer">
                        <div className="flex flex-col gap-0.5">
                          <span>Desktop Push Notifications</span>
                          <span className="text-[10px] text-gray-400 font-medium">Show system alerts even when the browser is in the background.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.enableDesktop}
                          onChange={(e) => {
                            const updated = { ...settings, enableDesktop: e.target.checked };
                            setSettings(updated);
                            localStorage.setItem("mehta_worker_notif_settings", JSON.stringify(updated));
                          }}
                          className="accent-[#D46D2D] w-4.5 h-4.5"
                        />
                      </label>

                      {/* Repeat Alarm */}
                      <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-150 rounded-xl cursor-pointer">
                        <div className="flex flex-col gap-0.5">
                          <span>Repeat Alarm Sound</span>
                          <span className="text-[10px] text-gray-400 font-medium">Repeat the chime every 5 seconds until you acknowledge or accept the order.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.repeatSound}
                          onChange={(e) => {
                            const updated = { ...settings, repeatSound: e.target.checked };
                            setSettings(updated);
                            localStorage.setItem("mehta_worker_notif_settings", JSON.stringify(updated));
                          }}
                          className="accent-[#D46D2D] w-4.5 h-4.5"
                        />
                      </label>

                      {/* Volume Slider */}
                      <div className="flex flex-col gap-2 p-3.5 bg-gray-50 border border-gray-150 rounded-xl">
                        <div className="flex justify-between items-center">
                          <span>Terminal Alarm Volume</span>
                          <span className="text-amber-700">{Math.round(settings.volume * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <VolumeX className="h-4 w-4 text-gray-400" />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={settings.volume}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              const updated = { ...settings, volume: v };
                              setSettings(updated);
                              audio.setVolume(v);
                              localStorage.setItem("mehta_worker_notif_settings", JSON.stringify(updated));
                            }}
                            className="flex-1 accent-[#D46D2D] h-1 bg-gray-200 rounded-lg cursor-pointer"
                          />
                          <Volume2 className="h-4 w-4 text-amber-600" />
                        </div>
                      </div>

                      {/* Notification Alert Duration */}
                      <div className="flex flex-col gap-1.5 p-3.5 bg-gray-50 border border-gray-150 rounded-xl">
                        <label className="block">Banner Auto-Dismiss Duration (seconds)</label>
                        <input
                          type="number"
                          min="3"
                          max="60"
                          value={settings.duration}
                          onChange={(e) => {
                            const updated = { ...settings, duration: parseInt(e.target.value) || 10 };
                            setSettings(updated);
                            localStorage.setItem("mehta_worker_notif_settings", JSON.stringify(updated));
                          }}
                          className="w-full mt-1 border border-[#EAE0D3] rounded-lg p-2 bg-white text-xs focus:outline-none focus:border-[#D46D2D]"
                        />
                      </div>

                      {/* Mute Toggle */}
                      <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-150 rounded-xl cursor-pointer">
                        <div className="flex flex-col gap-0.5">
                          <span>Mute All Sounds</span>
                          <span className="text-[10px] text-gray-400 font-medium">Silence all notification chimes. Volume and other settings are preserved.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => audio.toggleMute()}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${audio.isMuted ? 'bg-red-400' : 'bg-[#D46D2D]'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${audio.isMuted ? 'translate-x-1' : 'translate-x-4.5'}`} />
                        </button>
                      </label>

                      {/* Test Sound Button */}
                      <button
                        type="button"
                        id="worker-test-sound-btn"
                        onClick={() => {
                          audio.setVolume(settings.volume);
                          audio.play();
                        }}
                        className="flex items-center justify-center gap-2 w-full p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 font-bold text-xs hover:bg-amber-100 active:scale-95 transition-all cursor-pointer"
                      >
                        <Volume2 className="h-4 w-4" />
                        Test Notification Sound
                      </button>
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

      {/* ── FULL-SCREEN REALTIME ORDER ALERT ── */}
      {fullscreenOrderAlert && (
        <div className="fixed inset-0 bg-[#2A1E17]/95 backdrop-blur-md flex items-center justify-center z-9999 animate-fade-in p-4 text-white">
          <div className="bg-[#3D2C21] border-2 border-[#D46D2D] rounded-3xl p-8 md:p-12 max-w-lg w-full text-center relative shadow-[0_0_50px_rgba(212,109,45,0.3)] animate-scale-up flex flex-col items-center gap-6">
            
            {/* Animated bouncing bell */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#D46D2D]/20 animate-ping" />
              <div className="w-20 h-20 rounded-full bg-[#D46D2D] flex items-center justify-center shadow-lg relative">
                <Bell className="w-10 h-10 text-white animate-bounce" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#D46D2D] uppercase tracking-[0.2em] animate-pulse">🔔 DING DONG!</span>
              <h2 className="font-serif text-3xl md:text-4xl font-extrabold tracking-tight">New Order Received</h2>
            </div>

            {/* Order Number Box */}
            <div className="bg-black/30 border border-white/10 rounded-2xl py-4 px-6 w-full flex flex-col gap-1">
              <span className="text-[0.68rem] font-bold text-white/50 uppercase tracking-widest">Order ID</span>
              <span className="text-2xl font-mono font-black text-[#D46D2D]">
                {fullscreenOrderAlert.order_number || `MD-${fullscreenOrderAlert.id?.substring(0, 6).toUpperCase()}`}
              </span>
            </div>

            {/* Order Amount Box */}
            <div className="flex justify-between items-center w-full px-6 py-2 border-t border-b border-white/10">
              <span className="text-xs font-bold text-white/70 uppercase">Total Amount</span>
              <span className="text-3xl font-black text-[#D46D2D]">₹{fullscreenOrderAlert.total}</span>
            </div>

            {/* Print Status */}
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-4 py-2 rounded-full animate-pulse mt-2">
              <Printer className="w-4 h-4 animate-pulse" />
              <span>Print started...</span>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => setFullscreenOrderAlert(null)}
              className="mt-4 w-full bg-[#D46D2D] hover:bg-[#BF5E23] text-white py-3.5 px-6 rounded-xl font-bold uppercase tracking-wider transition-all hover:scale-102 active:scale-98 shadow-md"
            >
              Acknowledge & Dismiss
            </button>
          </div>
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

      {/* ── NOTIFICATION DRAWER / CENTER ── */}
      <AnimatePresence>
        {isNotificationDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden font-sans select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationDrawerOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Drawer Container */}
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="w-screen max-w-md bg-white shadow-2xl flex flex-col"
              >
                {/* Header */}
                <div className="p-4 border-b border-[#EAE0D3] bg-[#FCF9F2]/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-[#D46D2D]" />
                    <span className="font-serif text-sm font-bold uppercase tracking-wider text-[#2A1E17]">Notification Hub</span>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        {notifications.filter(n => !n.read).length} New
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsNotificationDrawerOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Bulk Action Controls */}
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-150 flex items-center justify-between text-[11px] font-bold text-gray-500">
                  <button
                    onClick={handleMarkAllNotifsRead}
                    disabled={notifications.length === 0}
                    className="hover:text-[#D46D2D] disabled:opacity-40 cursor-pointer"
                  >
                    ✓ Mark all as read
                  </button>
                  <button
                    onClick={handleClearAllNotifs}
                    disabled={notifications.length === 0}
                    className="hover:text-red-600 disabled:opacity-40 cursor-pointer"
                  >
                    🗑 Clear all history
                  </button>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {notifications.map((n) => {
                    let typeBadgeColor = "bg-gray-100 text-gray-700";
                    if (n.type === "website") typeBadgeColor = "bg-blue-50 text-blue-700 border border-blue-150";
                    if (n.type === "whatsapp") typeBadgeColor = "bg-emerald-50 text-emerald-700 border border-emerald-150";
                    if (n.type === "print_failed") typeBadgeColor = "bg-rose-50 text-rose-700 border border-rose-150";
                    if (n.type === "print_success") typeBadgeColor = "bg-green-50 text-green-700 border border-green-150";

                    return (
                      <div
                        key={n.id}
                        onClick={async () => {
                          await handleMarkNotifRead(n.id);
                          if (n.order_id) {
                            const foundOrder = orders.find(o => o.id === n.order_id);
                            if (foundOrder) {
                              setSelectedOrder(foundOrder);
                              setActiveTab("orders");
                            }
                          }
                          setIsNotificationDrawerOpen(false);
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                          n.read
                            ? "bg-white border-gray-100 hover:border-gray-200 opacity-75"
                            : "bg-amber-50/30 border-amber-100 hover:border-amber-200 shadow-3xs"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${typeBadgeColor}`}>
                            {n.type || "System"}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <h4 className={`text-xs font-bold ${n.read ? "text-[#2A1E17]/85" : "text-[#2A1E17]"}`}>
                            {n.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                      <Bell className="h-10 w-10 text-gray-200 mb-3" />
                      <h4 className="font-serif font-bold text-xs text-[#2A1E17]">No Notifications yet</h4>
                      <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">New updates and orders will appear here in real-time.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── WORKER DOWNSIZE MOBILE BOTTOM NAVBAR ── */}
      {isAuth && MENU_ITEMS.length > 1 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-[#EAE0D3] shadow-[0_10px_30px_rgba(0,0,0,0.08)] h-[65px] rounded-full flex items-center justify-around md:hidden px-2">
          {MENU_ITEMS.map(item => {
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
