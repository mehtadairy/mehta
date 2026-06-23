"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Truck
} from "lucide-react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminAnalytics() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
        }));
        setOrders(formattedOrders);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ordersToday = orders.filter(o => new Date(o.createdAt) >= today).length;
  
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const ordersThisMonth = orders.filter(o => new Date(o.createdAt) >= firstDayOfMonth).length;

  const uniqueCustomers = new Set(orders.map(o => o.userPhone || o.userEmail || o.userName)).size;

  // Chart Data (Last 7 Days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0,0,0,0);
    return d;
  });

  const chartData = last7Days.map(date => {
    const dayOrders = orders.filter(o => {
      const oDate = new Date(o.createdAt);
      return oDate.getDate() === date.getDate() && oDate.getMonth() === date.getMonth();
    });
    const rev = dayOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: rev
    };
  });

  const maxRev = Math.max(...chartData.map(d => d.revenue), 1000); // Ensure at least some height

  // Status Distribution
  const statuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
  const statusCounts = statuses.map(s => ({
    name: s,
    count: orders.filter(o => o.status === s).length,
    color: s === "Pending" ? "#f59e0b" : 
           s === "Processing" ? "#d97706" : 
           s === "Shipped" ? "#3b82f6" : 
           s === "Delivered" ? "#10b981" : "#ef4444"
  })).filter(s => s.count > 0);
  
  const totalValidOrders = statusCounts.reduce((sum, s) => sum + s.count, 0);

  // Helper for Donut Chart
  let currentAngle = -90;
  const renderDonutSlice = (count: number, total: number, color: string) => {
    if (total === 0) return null;
    const percentage = count / total;
    const angle = percentage * 360;
    
    // SVG arc math
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
    return <path d={d} fill={color} />;
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Processing": return "bg-orange-100 text-orange-800";
      case "Shipped": return "bg-blue-100 text-blue-800";
      case "Delivered": return "bg-green-100 text-green-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Dashboard & Analytics Report", 14, 22);
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    // KPIs
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Revenue: Rs. ${totalRevenue.toLocaleString()}`, 14, 45);
    doc.text(`Orders Today: ${ordersToday}`, 14, 52);
    doc.text(`Orders This Month: ${ordersThisMonth}`, 14, 59);
    doc.text(`Total Customers: ${uniqueCustomers}`, 14, 66);

    // Table
    autoTable(doc, {
      startY: 75,
      head: [['Order ID', 'Date', 'Customer', 'Status', 'Total']],
      body: orders.slice(0, 100).map(o => [
        `ORD-${o.id.substring(0, 6).toUpperCase()}`,
        new Date(o.createdAt).toLocaleDateString(),
        o.userName,
        o.status,
        `Rs. ${o.total.toLocaleString()}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] } // brand orange
    });

    doc.save("Dashboard_Analytics_Report.pdf");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-brand-charcoal">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-brand-beige pb-3 gap-3">
        <h3 className="font-serif text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-brand-orange" />
          Dashboard & Analytics
        </h3>
        <button 
          onClick={exportPDF}
          className="flex items-center gap-2 bg-[#2a241f] hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
        >
          <Download className="h-4 w-4" />
          Export Report (PDF)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-brand-beige shadow-sm flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-brand-charcoal">TOTAL REVENUE</p>
            <IndianRupee className="h-4 w-4 text-brand-orange" />
          </div>
          <h4 className="text-4xl font-serif font-bold text-brand-charcoal mt-2">₹{totalRevenue.toLocaleString()}</h4>
        </div>
        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-brand-beige shadow-sm flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-brand-charcoal">ORDERS TODAY</p>
            <Calendar className="h-4 w-4 text-brand-orange" />
          </div>
          <h4 className="text-4xl font-serif font-bold text-brand-charcoal mt-2">{ordersToday}</h4>
        </div>
        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-brand-beige shadow-sm flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-brand-charcoal">ORDERS THIS MONTH</p>
            <TrendingUp className="h-4 w-4 text-brand-orange" />
          </div>
          <h4 className="text-4xl font-serif font-bold text-brand-charcoal mt-2">{ordersThisMonth}</h4>
        </div>
        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-brand-beige shadow-sm flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-brand-charcoal">TOTAL CUSTOMERS</p>
            <Users className="h-4 w-4 text-brand-orange" />
          </div>
          <h4 className="text-4xl font-serif font-bold text-brand-charcoal mt-2">{uniqueCustomers}</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart Area */}
        <div className="lg:col-span-2 bg-white border border-brand-beige rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="mb-6 border-b border-brand-beige pb-4">
            <h4 className="font-serif font-bold text-brand-charcoal text-sm tracking-wide uppercase">WEEKLY REVENUE TREND</h4>
            <p className="text-xs text-muted-foreground mt-1">Daily order values for the last 7 days</p>
          </div>
          <div className="relative flex-grow min-h-[250px] w-full">
            {/* Y Axis Labels */}
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[0.6rem] font-bold text-muted-foreground">
              <span>₹{(maxRev).toLocaleString(undefined, { maximumSignificantDigits: 3 })}</span>
              <span>₹{(maxRev * 0.66).toLocaleString(undefined, { maximumSignificantDigits: 3 })}</span>
              <span>₹{(maxRev * 0.33).toLocaleString(undefined, { maximumSignificantDigits: 3 })}</span>
              <span>₹0</span>
            </div>
            
            {/* Grid Lines */}
            <div className="absolute left-10 right-0 top-1.5 bottom-8 flex flex-col justify-between">
              {[1,2,3,4].map((i) => (
                <div key={i} className="w-full border-t border-dashed border-brand-beige/60"></div>
              ))}
            </div>

            {/* Animated HTML Bar Chart */}
            <div className="absolute left-10 right-4 top-1.5 bottom-8 flex justify-between items-end z-10">
              {chartData.map((d, i) => {
                const heightPercent = maxRev > 0 ? (d.revenue / maxRev) * 100 : 0;
                return (
                  <div key={i} className="relative flex flex-col items-center justify-end w-full h-full group px-1 sm:px-2 md:px-4">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-brand-charcoal text-white text-xs font-bold py-1 px-2 rounded transition-opacity whitespace-nowrap pointer-events-none shadow-md">
                      ₹{d.revenue.toLocaleString()}
                    </div>
                    {/* Bar */}
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                      className="w-full max-w-[32px] sm:max-w-[40px] bg-brand-orange/30 group-hover:bg-brand-orange transition-colors duration-300 rounded-t-md relative"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-orange rounded-t-md"></div>
                    </motion.div>
                  </div>
                );
              })}
            </div>

            {/* X Axis Labels */}
            <div className="absolute left-10 right-0 bottom-0 flex justify-between text-[0.65rem] font-bold text-brand-charcoal">
              {chartData.map((d, i) => (
                <span key={i} className="-translate-x-1/2" style={{ left: `${(i / (chartData.length - 1)) * 100}%`, position: 'absolute' }}>
                  {d.date.split(" ")[0]} {d.date.split(" ")[1]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Donut Chart Area */}
        <div className="bg-white border border-brand-beige rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="mb-6 border-b border-brand-beige pb-4">
            <h4 className="font-serif font-bold text-brand-charcoal text-sm tracking-wide uppercase">STATUS DISTRIBUTION</h4>
            <p className="text-xs text-muted-foreground mt-1">Ratio of orders across statuses</p>
          </div>
          
          <div className="flex-grow flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {statusCounts.map((s, i) => {
                  const slice = renderDonutSlice(s.count, totalValidOrders, s.color);
                  return <g key={i}>{slice}</g>;
                })}
                {/* Inner white circle for Donut effect */}
                <circle cx="50" cy="50" r="32" fill="white" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-serif font-bold">{orders.length}</span>
                <span className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest">ORDERS</span>
              </div>
            </div>

            <div className="w-full space-y-3">
              {statusCounts.map((s, i) => (
                <div key={i} className="flex justify-between items-center text-xs font-bold text-brand-charcoal">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                    <span>{s.name}</span>
                  </div>
                  <span>{s.count} ({Math.round((s.count/totalValidOrders)*100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white border border-brand-beige rounded-2xl p-6 shadow-sm">
        <h4 className="font-serif font-bold text-brand-charcoal text-sm tracking-wide uppercase border-b border-brand-beige pb-4 mb-4">
          Recent Activity
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-brand-beige text-brand-charcoal font-bold tracking-wider uppercase">
                <th className="py-3">ORDER</th>
                <th className="py-3">CUSTOMER</th>
                <th className="py-3">STATUS</th>
                <th className="py-3">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id} className="border-b border-brand-beige/40">
                  <td className="py-4 font-semibold">ORD-{o.id.substring(0, 6).toUpperCase()}</td>
                  <td className="py-4 font-semibold">{o.userName}</td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[0.65rem] ${getStatusBadgeColor(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-4 font-bold">₹{o.total.toLocaleString()}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground font-semibold">
                    No recent activity found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
