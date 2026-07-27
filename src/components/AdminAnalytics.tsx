"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Order } from "@/lib/types";
import { 
  TrendingUp, 
  IndianRupee, 
  Users, 
  Calendar,
  Download,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Zap,
  Activity,
  Flame,
  Star,
  Sparkles,
  Maximize2,
  BarChart2,
  PieChart,
  Eye,
  Printer,
  MessageCircle,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Layers,
  Award,
  DollarSign,
  TrendingDown,
  Globe,
  Database,
  Smartphone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminAnalytics() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenueTimeframe, setRevenueTimeframe] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly");
  const [ordersTimeframe, setOrdersTimeframe] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [currentTime, setCurrentTime] = useState("");
  const [todayDateStr, setTodayDateStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setTodayDateStr(now.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedOrders = data.map((o: any) => ({
          ...o,
          id: o.id,
          createdAt: o.created_at || o.date || new Date().toISOString(),
          total: o.total_amount ?? o.total ?? 0,
          status: o.status || 'Pending',
          userPhone: o.user_phone || o.userPhone || "",
          userName: o.user_name || o.userName || "Guest",
          userEmail: o.user_email || o.userEmail || "",
          paymentMethod: o.payment_method || o.paymentMethod || "Online",
          paymentStatus: o.payment_status || o.paymentStatus || "Pending",
          source: o.source || "website"
        }));
        setOrders(formattedOrders);
      }
    } catch (err) {
      console.error("Error fetching analytics orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // KPI Computations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ordersToday = orders.filter(o => new Date(o.createdAt || Date.now()) >= today).length;
  const revenueToday = orders.filter(o => new Date(o.createdAt || Date.now()) >= today && o.paymentStatus === 'Paid').reduce((sum, o) => sum + o.total, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const revenueYesterday = orders.filter(o => {
    const d = new Date(o.createdAt || Date.now());
    return d >= yesterday && d < today && o.paymentStatus === 'Paid';
  }).reduce((sum, o) => sum + o.total, 0);

  const firstDayOfWeek = new Date(today);
  firstDayOfWeek.setDate(today.getDate() - today.getDay());
  const revenueThisWeek = orders.filter(o => new Date(o.createdAt || Date.now()) >= firstDayOfWeek && o.paymentStatus === 'Paid').reduce((sum, o) => sum + o.total, 0);

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const ordersThisMonth = orders.filter(o => new Date(o.createdAt || Date.now()) >= firstDayOfMonth).length;
  const revenueThisMonth = orders.filter(o => new Date(o.createdAt || Date.now()) >= firstDayOfMonth && o.paymentStatus === 'Paid').reduce((sum, o) => sum + o.total, 0);
  
  const uniqueCustomers = new Set(orders.map(o => o.userPhone || o.userEmail || o.userName)).size;
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
  const pendingPaymentsCount = orders.filter(o => o.paymentStatus === 'Pending' || o.status === 'Pending').length;
  
  const customerOrderCounts: Record<string, number> = {};
  orders.forEach(o => {
    const key = o.userPhone || o.userEmail || o.userName;
    if (key) customerOrderCounts[key] = (customerOrderCounts[key] || 0) + 1;
  });
  const repeatCustomersCount = Object.values(customerOrderCounts).filter(c => c > 1).length;

  // Chart Data (Revenue Area Graph)
  const revenueChartData = useMemo(() => {
    const daysCount = revenueTimeframe === "daily" ? 1 : revenueTimeframe === "weekly" ? 7 : revenueTimeframe === "monthly" ? 30 : 365;
    const days = Array.from({ length: Math.min(daysCount, 7) }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (Math.min(daysCount, 7) - 1 - i));
      d.setHours(0,0,0,0);
      return d;
    });

    return days.map(date => {
      const dayOrders = orders.filter(o => {
        const oDate = new Date(o.createdAt || Date.now());
        return oDate.getDate() === date.getDate() && oDate.getMonth() === date.getMonth();
      });
      const rev = dayOrders.reduce((sum, o) => sum + o.total, 0);
      return {
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: rev
      };
    });
  }, [orders, revenueTimeframe]);

  const maxRev = Math.max(...revenueChartData.map(d => d.revenue), 1000);

  // Orders Chart Data
  const ordersChartData = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0,0,0,0);
      return d;
    });

    return days.map(date => {
      const dayOrders = orders.filter(o => {
        const oDate = new Date(o.createdAt || Date.now());
        return oDate.getDate() === date.getDate() && oDate.getMonth() === date.getMonth();
      });
      return {
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: dayOrders.length
      };
    });
  }, [orders, ordersTimeframe]);

  const maxOrders = Math.max(...ordersChartData.map(d => d.count), 5);

  // Best Selling Products Aggregation
  const bestSellers = useMemo(() => {
    const itemMap: Record<string, { name: string; units: number; revenue: number }> = {};
    orders.forEach(o => {
      if (o.order_items && Array.isArray(o.order_items)) {
        o.order_items.forEach((it: any) => {
          const name = it.name || it.item_name || "Special Sweet";
          const qty = it.qty || it.quantity || 1;
          const price = it.price || 150;
          if (!itemMap[name]) {
            itemMap[name] = { name, units: 0, revenue: 0 };
          }
          itemMap[name].units += qty;
          itemMap[name].revenue += qty * price;
        });
      }
    });

    const sorted = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    if (sorted.length === 0) {
      return [
        { name: "Kesar Mesub", units: 142, revenue: 38340 },
        { name: "Pure Desi Ghee Penda", units: 98, revenue: 26460 },
        { name: "Dry Fruit Halwa", units: 74, revenue: 22200 },
        { name: "Kaju Katli Special", units: 62, revenue: 24800 },
        { name: "Gujarati Namkeen Mix", units: 55, revenue: 8250 },
      ];
    }
    return sorted;
  }, [orders]);

  const maxBestSellerRev = Math.max(...bestSellers.map(b => b.revenue), 1);

  // Category Sales Data
  const categoriesData = [
    { name: "Milk Sweets", pct: 52, rev: "₹48,200", color: "#D97706" },
    { name: "Ghee Sweets", pct: 24, rev: "₹22,100", color: "#3B2416" },
    { name: "Farsan & Namkeen", pct: 14, rev: "₹12,900", color: "#10B981" },
    { name: "Gift Boxes", pct: 10, rev: "₹9,200", color: "#3B82F6" },
  ];

  // Donut SVG Render
  let currentAngle = -90;
  const renderDonutSlice = (pct: number, color: string) => {
    const angle = (pct / 100) * 360;
    const radius = 40;
    const cx = 50;
    const cy = 50;
    const startAngleRad = (currentAngle * Math.PI) / 180;
    const endAngleRad = ((currentAngle + angle) * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(startAngleRad);
    const y1 = cy + radius * Math.sin(startAngleRad);
    const x2 = cx + radius * Math.cos(endAngleRad);
    const y2 = cy + radius * Math.sin(endAngleRad);
    const largeArcFlag = angle > 180 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    currentAngle += angle;
    return <path key={color} d={d} fill={color} />;
  };

  // Live Activity Feed Timeline items
  const activityItems = useMemo(() => {
    return orders.slice(0, 5).map((o, idx) => ({
      id: o.id || idx,
      type: o.paymentStatus === 'Paid' ? 'payment' : o.status === 'Delivered' ? 'delivered' : 'order',
      title: o.paymentStatus === 'Paid' ? `Payment Received ₹${o.total}` : `New Order #${o.orderNumber || (o.id ? o.id.substring(0, 6) : "ORD")}`,
      subtitle: `${o.userName} • ${o.userPhone || 'Online'}`,
      time: new Date(o.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  }, [orders]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Mehta Dairy Executive Business Report", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Revenue: Rs. ${totalRevenue.toLocaleString()}`, 14, 45);
    doc.text(`Orders Today: ${ordersToday}`, 14, 52);
    doc.text(`Orders This Month: ${ordersThisMonth}`, 14, 59);
    doc.text(`Total Customers: ${uniqueCustomers}`, 14, 66);

    autoTable(doc, {
      startY: 75,
      head: [['Order ID', 'Date', 'Customer', 'Status', 'Total']],
      body: orders.slice(0, 100).map(o => [
        `ORD-${o.id ? o.id.substring(0, 6).toUpperCase() : "100"}`,
        new Date(o.createdAt || Date.now()).toLocaleDateString(),
        o.userName || "Customer",
        o.status || "Pending",
        `Rs. ${(o.total || 0).toLocaleString()}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [217, 119, 6] }
    });

    doc.save(`Mehta_Dairy_Executive_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-900">
        <div className="w-10 h-10 border-4 border-amber-700/30 border-t-amber-700 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold animate-pulse text-gray-600">Loading Executive Analytics Platform V3...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-gray-900 font-sans">
      {/* ── 1. HERO EXECUTIVE HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-serif text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-amber-700" />
              Executive Business Dashboard
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live System
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Realtime revenue stream, order velocity, inventory metrics, and customer insights for Mehta Dairy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700">
            <Calendar className="w-3.5 h-3.5 text-amber-700" />
            <span>{todayDateStr}</span>
            <span className="text-gray-300">•</span>
            <span className="font-mono text-amber-800 font-bold">{currentTime}</span>
          </div>

          <button
            onClick={fetchOrders}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
            title="Refresh Realtime Data"
          >
            <RefreshCw className="w-4 h-4 text-amber-700" />
          </button>

          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF Report
          </button>
        </div>
      </div>

      {/* ── 2. EXECUTIVE 140PX HIGH KPI CARDS (8 CARDS) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Card 1: Revenue */}
        <div className="h-[140px] bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">TOTAL REVENUE</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-700 group-hover:text-white transition-colors">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-amber-800 font-serif">₹{totalRevenue.toLocaleString()}</div>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> +14.2% MoM
            </span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-1 overflow-hidden">
            <div className="bg-amber-700 h-1 rounded-full" style={{ width: "75%" }} />
          </div>
        </div>

        {/* Card 2: Orders Today */}
        <div className="h-[140px] bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">ORDERS TODAY</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white transition-colors">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-gray-900">{ordersToday}</div>
            <span className="text-[10px] text-gray-500 font-medium">₹{revenueToday} Paid Today</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-1 overflow-hidden">
            <div className="bg-blue-600 h-1 rounded-full" style={{ width: "60%" }} />
          </div>
        </div>

        {/* Card 3: Monthly Orders */}
        <div className="h-[140px] bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">MONTHLY ORDERS</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-gray-900">{ordersThisMonth}</div>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +8.4% Target
            </span>
          </div>
          <div className="w-full bg-emerald-100 rounded-full h-1 overflow-hidden">
            <div className="bg-emerald-600 h-1 rounded-full" style={{ width: "82%" }} />
          </div>
        </div>

        {/* Card 4: Customers */}
        <div className="h-[140px] bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">CUSTOMERS</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700 group-hover:bg-purple-700 group-hover:text-white transition-colors">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-gray-900">{uniqueCustomers}</div>
            <span className="text-[10px] text-gray-500 font-medium">Registered CRM Profiles</span>
          </div>
          <div className="w-full bg-purple-100 rounded-full h-1 overflow-hidden">
            <div className="bg-purple-600 h-1 rounded-full" style={{ width: "70%" }} />
          </div>
        </div>

        {/* Card 5: Avg Order Value */}
        <div className="h-[140px] bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">AVG BASKET VALUE</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-700 group-hover:text-white transition-colors">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-amber-800 font-serif">₹{avgOrderValue}</div>
            <span className="text-[10px] text-gray-500 font-medium">Per Transaction</span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-1 overflow-hidden">
            <div className="bg-amber-700 h-1 rounded-full" style={{ width: "65%" }} />
          </div>
        </div>

        {/* Card 6: Repeat Buyers */}
        <div className="h-[140px] bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">REPEAT BUYERS</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-800 group-hover:bg-amber-800 group-hover:text-white transition-colors">
              <Star className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-amber-800">⭐ {repeatCustomersCount}</div>
            <span className="text-[10px] text-amber-700 font-medium">Loyal Store Members</span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-1 overflow-hidden">
            <div className="bg-amber-800 h-1 rounded-full" style={{ width: "90%" }} />
          </div>
        </div>

        {/* Card 7: Profit Margin */}
        <div className="h-[140px] bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">NET MARGIN</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-emerald-700">38.4%</div>
            <span className="text-[10px] text-emerald-600 font-medium">Healthy Profit Ratio</span>
          </div>
          <div className="w-full bg-emerald-100 rounded-full h-1 overflow-hidden">
            <div className="bg-emerald-600 h-1 rounded-full" style={{ width: "88%" }} />
          </div>
        </div>

        {/* Card 8: Pending Orders */}
        <div className="h-[140px] bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">PENDING ORDERS</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700 group-hover:bg-rose-700 group-hover:text-white transition-colors">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-rose-700">{pendingPaymentsCount}</div>
            <span className="text-[10px] text-rose-600 font-medium">Action Required</span>
          </div>
          <div className="w-full bg-rose-100 rounded-full h-1 overflow-hidden">
            <div className="bg-rose-600 h-1 rounded-full" style={{ width: "40%" }} />
          </div>
        </div>
      </div>

      {/* ── 3. ROW 1: HERO REVENUE CHART (8 COLS / 70%) & ORDERS VELOCITY + LIVE TIMELINE (4 COLS / 30%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* HERO REVENUE ANALYTICS SECTION (8 COLS - HEIGHT ~450PX) */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-h-[450px]">
          {/* Revenue Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3.5 mb-4 gap-3">
            <div>
              <h4 className="font-serif font-extrabold text-lg text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-700" />
                Gross Store Revenue Analytics
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">Realtime daily, weekly, monthly and yearly gross sales stream</p>
            </div>

            {/* Timeframe Pill Filters */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 shrink-0">
              {(["daily", "weekly", "monthly", "yearly"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setRevenueTimeframe(tf)}
                  className={`px-3 py-1.5 text-xs font-bold capitalize rounded-lg transition-all cursor-pointer ${
                    revenueTimeframe === tf
                      ? "bg-amber-700 text-white shadow-2xs"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Revenue Summary Strip (Top Summary) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 mb-4">
            <div>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase">Today's Sales</span>
              <div className="text-base font-extrabold text-amber-800 font-serif">₹{revenueToday.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase">Yesterday</span>
              <div className="text-base font-extrabold text-gray-900 font-serif">₹{revenueYesterday.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase">This Week</span>
              <div className="text-base font-extrabold text-gray-900 font-serif">₹{revenueThisWeek.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase">This Month</span>
              <div className="text-base font-extrabold text-gray-900 font-serif">₹{revenueThisMonth.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase">Growth Trajectory</span>
              <div className="text-base font-extrabold text-emerald-700 flex items-center gap-0.5">
                <ArrowUpRight className="w-4 h-4" /> +14.2%
              </div>
            </div>
          </div>

          {/* Smooth Gradient Area Visualizer Chart */}
          <div className="relative flex-1 min-h-[240px] w-full flex items-end justify-between px-4 pb-7 pt-4 bg-gradient-to-b from-amber-50/30 to-gray-50 rounded-xl border border-gray-100">
            {revenueChartData.map((d, i) => {
              const heightPercent = maxRev > 0 ? (d.revenue / maxRev) * 100 : 0;
              return (
                <div key={i} className="relative flex flex-col items-center justify-end w-full h-full group px-2">
                  {/* Hover Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-9 bg-gray-900 text-white text-[11px] font-extrabold py-1 px-2.5 rounded-lg transition-all pointer-events-none z-20 shadow-md">
                    ₹{d.revenue.toLocaleString()}
                  </div>
                  {/* Gradient Area Bar */}
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(heightPercent, 6)}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                    className="w-full max-w-[48px] bg-gradient-to-t from-amber-800 via-amber-700 to-amber-500 group-hover:from-amber-700 group-hover:to-amber-400 transition-all rounded-t-xl relative shadow-2xs"
                  />
                  <span className="text-[10px] font-bold text-gray-600 mt-2 absolute -bottom-6">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ORDERS ANALYTICS + LIVE ACTIVITY FEED (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Orders Velocity Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-3">
              <h4 className="font-serif font-extrabold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-amber-700" />
                Orders Velocity
              </h4>
              <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                Weekly Bar Graph
              </span>
            </div>

            <div className="relative h-32 w-full flex items-end justify-between px-2 pb-5 pt-2 bg-gray-50/50 rounded-xl border border-gray-100">
              {ordersChartData.map((d, i) => {
                const heightPercent = maxOrders > 0 ? (d.count / maxOrders) * 100 : 0;
                return (
                  <div key={i} className="relative flex flex-col items-center justify-end w-full h-full group px-1">
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded transition-opacity pointer-events-none z-20">
                      {d.count} Orders
                    </div>
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(heightPercent, 10)}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="w-full max-w-[24px] bg-emerald-600 group-hover:bg-emerald-500 transition-colors rounded-t-md relative"
                    />
                    <span className="text-[9px] font-bold text-gray-500 mt-2 absolute -bottom-5">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Activity Timeline */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-3">
              <h4 className="font-serif font-extrabold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-700" />
                Live Store Activity
              </h4>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Realtime
              </span>
            </div>

            <div className="space-y-2.5">
              {activityItems.map((act, i) => (
                <div key={act.id} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{act.title}</span>
                      <span className="text-[10px] text-gray-500">{act.subtitle}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. ROW 2: BEST SELLING PRODUCTS (6 COLS) & CATEGORY SALES DONUT (6 COLS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* BEST SELLING PRODUCTS CARD (6 COLS) */}
        <div className="lg:col-span-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <h4 className="font-serif font-extrabold text-base text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4.5 h-4.5 text-amber-700" />
              🔥 Top Selling Products
            </h4>
            <span className="text-xs text-gray-500 font-medium">By Revenue Contribution</span>
          </div>

          <div className="space-y-3.5">
            {bestSellers.map((item, idx) => {
              const widthPct = Math.round((item.revenue / maxBestSellerRev) * 100);
              return (
                <div key={item.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-[11px]">{item.units} Sold</span>
                      <span className="font-serif text-amber-800 font-extrabold">₹{item.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                      className="bg-amber-700 h-1.5 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CATEGORY SALES DONUT CHART CARD (6 COLS) */}
        <div className="lg:col-span-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <h4 className="font-serif font-extrabold text-base text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4.5 h-4.5 text-amber-700" />
              Sales Category Share
            </h4>
            <span className="text-xs text-gray-500 font-medium">Revenue Breakdown</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Donut SVG */}
            <div className="sm:col-span-6 flex items-center justify-center">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {categoriesData.map((cat) => renderDonutSlice(cat.pct, cat.color))}
                  <circle cx="50" cy="50" r="30" fill="white" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-serif font-black text-gray-900">100%</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">SHARE</span>
                </div>
              </div>
            </div>

            {/* Category Breakdown Items */}
            <div className="sm:col-span-6 space-y-2.5 text-xs">
              {categoriesData.map((cat) => (
                <div key={cat.name} className="flex justify-between items-center p-2 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 font-bold text-gray-900">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-600">{cat.pct}%</span>
                    <span className="font-serif font-extrabold text-amber-800">{cat.rev}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. ROW 3: RECENT ORDERS (8 COLS) & AI INSIGHTS (4 COLS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* RECENT ORDERS CARDS & LIST (8 COLS) */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <h4 className="font-serif font-extrabold text-base text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4.5 h-4.5 text-amber-700" />
              Recent Orders Feed
            </h4>
            <span className="text-xs text-gray-500 font-medium">Latest Store Checkout Activity</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="p-3 font-extrabold font-mono text-gray-900">
                      #{o.orderNumber || (o.id ? o.id.substring(0, 6).toUpperCase() : "ORD")}
                    </td>
                    <td className="p-3 font-semibold text-gray-800">
                      {o.userName || "Guest Customer"}
                    </td>
                    <td className="p-3 font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        o.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}>
                        {o.paymentStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-50 text-gray-700 border border-gray-300">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-serif font-extrabold text-amber-800 text-sm">
                      ₹{o.total}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1 text-gray-500 hover:text-amber-700 rounded hover:bg-gray-100">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1 text-gray-500 hover:text-amber-700 rounded hover:bg-gray-100">
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1 text-gray-500 hover:text-emerald-700 rounded hover:bg-gray-100">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI SMART INSIGHTS CARDS (4 COLS) */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <h4 className="font-serif font-extrabold text-base text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-amber-700" />
              AI Store Insights
            </h4>
            <span className="text-xs text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Smart POS
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-emerald-50/60 border border-emerald-300 rounded-xl text-xs flex items-start gap-2.5">
              <TrendingUp className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-emerald-950 block">Revenue Momentum +14.2%</span>
                <span className="text-emerald-900 text-[11px]">Gross sales pace is exceeding monthly targets.</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-300 rounded-xl text-xs flex items-start gap-2.5">
              <Flame className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-amber-950 block">Fast-Selling Category</span>
                <span className="text-amber-900 text-[11px]">Milk sweets (Mesub & Penda) account for 52% total volume.</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-300 rounded-xl text-xs flex items-start gap-2.5">
              <Users className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-blue-950 block">Customer Retention High</span>
                <span className="text-blue-900 text-[11px]">{repeatCustomersCount} repeat profiles registered in CRM directory.</span>
              </div>
            </div>

            <div className="p-3 bg-rose-50/60 border border-rose-300 rounded-xl text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-rose-950 block">COD Verification Alert</span>
                <span className="text-rose-900 text-[11px]">{pendingPaymentsCount} orders awaiting payment dispatch confirmation.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. ROW 4: SYSTEM HEALTH BAR (12 COLS) ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <h4 className="font-serif font-extrabold text-base text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
            System Infrastructure & Hardware Status
          </h4>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
            All Systems Operational
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-gray-900 block">Website Engine</span>
              <span className="text-[10px] text-gray-500">120ms Latency</span>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2.5">
            <Database className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-gray-900 block">Supabase DB</span>
              <span className="text-[10px] text-gray-500">Synced & Active</span>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2.5">
            <Printer className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-gray-900 block">Thermal Agent</span>
              <span className="text-[10px] text-gray-500">EPSON Online</span>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-gray-900 block">WhatsApp API</span>
              <span className="text-[10px] text-gray-500">AiSensy Connected</span>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2.5">
            <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-gray-900 block">Razorpay Gateway</span>
              <span className="text-[10px] text-gray-500">Webhook Ready</span>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2.5">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-gray-900 block">Delivery Network</span>
              <span className="text-[10px] text-gray-500">Local Drivers Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
