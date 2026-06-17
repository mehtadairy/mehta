"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TrendingUp, ShoppingBag, Users, IndianRupee, Download } from "lucide-react";
import jsPDF from "jspdf";
import 'jspdf-autotable';
import { motion } from "framer-motion";

const AnimatedCounter = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) {
      setCount(0);
      return;
    }
    const increment = Math.ceil(end / 40);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return <>{count}</>;
};

interface DailyRevenue {
  label: string;
  value: number;
  count: number;
}

interface StatusDist {
  status: string;
  count: number;
  color: string;
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    ordersToday: 0,
    ordersThisMonth: 0,
    totalCustomers: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [statusDist, setStatusDist] = useState<StatusDist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDataPoint, setActiveDataPoint] = useState<DailyRevenue | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    
    // Fetch recent orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch customers
    const { count: customersCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (orders) {
      setRecentOrders(orders.slice(0, 10));
      
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      let rev = 0;
      let today = 0;
      let month = 0;

      orders.forEach(o => {
        if (o.payment_status === 'Paid' || o.payment_status === 'COD') {
          rev += Number(o.total || 0);
        }
        
        const d = new Date(o.created_at).getTime();
        if (d >= startOfDay) today++;
        if (d >= startOfMonth) month++;
      });

      setStats({
        totalRevenue: rev,
        ordersToday: today,
        ordersThisMonth: month,
        totalCustomers: customersCount || 0
      });

      // 1. Calculate Daily Revenue Trend for the last 7 days
      const dailyRevenueMap: { [key: string]: { value: number; count: number } } = {};
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const labelStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        dailyRevenueMap[labelStr] = { value: 0, count: 0 };
      }

      orders.forEach(o => {
        const dateLabel = new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (dateLabel in dailyRevenueMap) {
          if (o.payment_status === 'Paid' || o.payment_status === 'COD') {
            dailyRevenueMap[dateLabel].value += Number(o.total || 0);
          }
          dailyRevenueMap[dateLabel].count += 1;
        }
      });

      const formattedDailyRevenue = Object.keys(dailyRevenueMap).map(key => ({
        label: key,
        value: dailyRevenueMap[key].value,
        count: dailyRevenueMap[key].count
      }));
      
      setDailyRevenue(formattedDailyRevenue);

      // 2. Calculate Order Status Distribution
      const statusCounts: { [key: string]: { count: number; color: string } } = {
        'Pending': { count: 0, color: '#F59E0B' },      // Amber
        'Processing': { count: 0, color: '#D46D2D' },   // Brand Orange
        'Shipped': { count: 0, color: '#8B5CF6' },      // Purple
        'Delivered': { count: 0, color: '#10B981' },    // Emerald Green
        'Cancelled': { count: 0, color: '#EF4444' }     // Red
      };

      orders.forEach(o => {
        const status = o.status || 'Pending';
        // Normalize casing
        const normalized = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        if (normalized in statusCounts) {
          statusCounts[normalized].count += 1;
        } else if (status in statusCounts) {
          statusCounts[status].count += 1;
        }
      });

      const formattedStatusDist = Object.keys(statusCounts).map(key => ({
        status: key,
        count: statusCounts[key].count,
        color: statusCounts[key].color
      })).filter(s => s.count > 0);

      setStatusDist(formattedStatusDist);
    }

    setIsLoading(false);
  };

  const exportPDFReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Mehta Sweet Mart - Business Report", 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    // Summary
    doc.text(`Total Revenue: Rs ${stats.totalRevenue.toLocaleString()}`, 14, 45);
    doc.text(`Orders This Month: ${stats.ordersThisMonth}`, 14, 52);
    doc.text(`Orders Today: ${stats.ordersToday}`, 14, 59);
    doc.text(`Total Registered Customers: ${stats.totalCustomers}`, 14, 66);
    
    // Recent Orders Table
    const tableColumn = ["Order ID", "Customer", "Date", "Status", "Total"];
    const tableRows: any[] = [];

    recentOrders.forEach(o => {
      const rowData = [
        o.order_number,
        o.user_name || "Guest",
        new Date(o.created_at).toLocaleDateString(),
        o.status,
        `Rs ${o.total}`
      ];
      tableRows.push(rowData);
    });

    // Fix prototype autoTable call to direct function invocation
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [212, 109, 45] }
    });

    doc.save(`Mehta_Business_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // SVG Chart Computations
  const maxRevenue = Math.max(...dailyRevenue.map(d => d.value), 1000);
  const chartWidth = 500;
  const chartHeight = 220;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const points = dailyRevenue.map((d, i) => {
    const x = paddingLeft + (i * plotWidth) / (dailyRevenue.length - 1 || 1);
    const y = paddingTop + plotHeight - (d.value * plotHeight) / maxRevenue;
    return { x, y, data: d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z`
    : '';

  // Donut Chart Computations
  const totalDistCount = statusDist.reduce((sum, s) => sum + s.count, 0);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-brand-beige pb-3">
        <h3 className="font-serif text-lg font-bold text-brand-charcoal flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-orange" />
          Dashboard & Analytics
        </h3>
        <button 
          onClick={exportPDFReport}
          className="flex items-center gap-2 px-4 py-2 bg-brand-charcoal text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Report (PDF)
        </button>
      </div>

      {/* Metrics Cards */}
      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.05 } }
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Metric 1 */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 15 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 150, damping: 20 } }
          }}
          className="bg-white/70 backdrop-blur-md border border-brand-beige p-5 rounded-2xl shadow-xs hover:shadow-lg hover:border-brand-orange/30 transition-all duration-300"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Total Revenue</span>
            <IndianRupee className="w-4 h-4 text-brand-orange" />
          </div>
          <span className="font-serif text-3xl font-black text-brand-charcoal">
            ₹<AnimatedCounter value={stats.totalRevenue} />
          </span>
        </motion.div>

        {/* Metric 2 */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 15 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 150, damping: 20 } }
          }}
          className="bg-white/70 backdrop-blur-md border border-brand-beige p-5 rounded-2xl shadow-xs hover:shadow-lg hover:border-brand-orange/30 transition-all duration-300"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Orders Today</span>
            <ShoppingBag className="w-4 h-4 text-brand-orange" />
          </div>
          <span className="font-serif text-3xl font-black text-brand-charcoal">
            <AnimatedCounter value={stats.ordersToday} />
          </span>
        </motion.div>

        {/* Metric 3 */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 15 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 150, damping: 20 } }
          }}
          className="bg-white/70 backdrop-blur-md border border-brand-beige p-5 rounded-2xl shadow-xs hover:shadow-lg hover:border-brand-orange/30 transition-all duration-300"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Orders This Month</span>
            <TrendingUp className="w-4 h-4 text-brand-orange" />
          </div>
          <span className="font-serif text-3xl font-black text-brand-charcoal">
            <AnimatedCounter value={stats.ordersThisMonth} />
          </span>
        </motion.div>

        {/* Metric 4 */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 15 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 150, damping: 20 } }
          }}
          className="bg-white/70 backdrop-blur-md border border-brand-beige p-5 rounded-2xl shadow-xs hover:shadow-lg hover:border-brand-orange/30 transition-all duration-300"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Total Customers</span>
            <Users className="w-4 h-4 text-brand-orange" />
          </div>
          <span className="font-serif text-3xl font-black text-brand-charcoal">
            <AnimatedCounter value={stats.totalCustomers} />
          </span>
        </motion.div>
      </motion.div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Trend Line Chart */}
        <div className="lg:col-span-2 bg-white border border-brand-beige p-5 rounded-2xl shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-brand-beige pb-2">
            <div>
              <h4 className="font-serif text-xs font-bold text-brand-charcoal uppercase tracking-wider">Weekly Revenue Trend</h4>
              <p className="text-[0.65rem] text-muted-foreground mt-0.5">Daily order values for the last 7 days</p>
            </div>
            {activeDataPoint && (
              <div className="text-right text-[0.7rem] bg-brand-cream/50 px-2 py-1 rounded border border-brand-beige">
                <span className="font-bold text-brand-charcoal">{activeDataPoint.label}: </span>
                <span className="font-extrabold text-brand-orange">₹{activeDataPoint.value}</span>
                <span className="text-muted-foreground"> ({activeDataPoint.count} orders)</span>
              </div>
            )}
          </div>
          
          {isLoading ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
          ) : dailyRevenue.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">No transaction data available</div>
          ) : (
            <div className="relative w-full overflow-hidden select-none">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D46D2D" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#D46D2D" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines */}
                {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                  const yVal = paddingTop + plotHeight * (1 - ratio);
                  const labelVal = Math.round(maxRevenue * ratio);
                  return (
                    <g key={idx}>
                      <line 
                        x1={paddingLeft} 
                        y1={yVal} 
                        x2={chartWidth - paddingRight} 
                        y2={yVal} 
                        stroke="#EADEC9" 
                        strokeWidth="0.8"
                        strokeDasharray="4 4" 
                      />
                      <text 
                        x={paddingLeft - 8} 
                        y={yVal + 3} 
                        textAnchor="end" 
                        fontSize="9" 
                        className="fill-muted-foreground font-bold font-mono"
                      >
                        ₹{labelVal >= 1000 ? `${(labelVal / 1000).toFixed(1)}k` : labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis labels */}
                {points.map((p, idx) => (
                  <text 
                    key={idx}
                    x={p.x} 
                    y={chartHeight - 12} 
                    textAnchor="middle" 
                    fontSize="9" 
                    className="fill-muted-foreground font-bold"
                  >
                    {p.data.label}
                  </text>
                ))}

                {/* Area under the line */}
                {areaPath && (
                  <motion.path 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    d={areaPath} 
                    fill="url(#chartGradient)" 
                  />
                )}

                {/* Line Path */}
                {linePath && (
                  <motion.path 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.4, ease: "easeInOut" }}
                    d={linePath} 
                    fill="none" 
                    stroke="#D46D2D" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                )}

                {/* Data Points / Interaction dots */}
                {points.map((p, idx) => (
                  <g 
                    key={idx} 
                    className="cursor-pointer group"
                    onMouseEnter={() => setActiveDataPoint(p.data)}
                    onMouseLeave={() => setActiveDataPoint(null)}
                  >
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="7" 
                      fill="transparent" 
                    />
                    <motion.circle 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 * idx + 0.5, type: "spring", stiffness: 200 }}
                      cx={p.x} 
                      cy={p.y} 
                      r="4" 
                      fill="#D46D2D" 
                      stroke="#FFFFFF" 
                      strokeWidth="1.5" 
                      className="transition-all duration-200 group-hover:scale-150 group-hover:fill-brand-charcoal"
                    />
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>

        {/* Order Status Distribution Donut Chart */}
        <div className="bg-white border border-brand-beige p-5 rounded-2xl shadow-xs flex flex-col gap-4">
          <div>
            <h4 className="font-serif text-xs font-bold text-brand-charcoal uppercase tracking-wider">Status Distribution</h4>
            <p className="text-[0.65rem] text-muted-foreground mt-0.5">Ratio of orders across statuses</p>
          </div>

          {isLoading ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
          ) : totalDistCount === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">No status distribution data</div>
          ) : (
            <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-6 py-2">
              <div className="relative h-28 w-28 flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                  {/* Background Circle */}
                  <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#F4EFE6" strokeWidth="12" />
                  
                  {/* Segments */}
                  {statusDist.map((item, idx) => {
                    const percent = item.count / totalDistCount;
                    const segmentSize = percent * circumference;
                    const offset = accumulatedPercent * circumference;
                    accumulatedPercent += percent;
                    
                    return (
                      <motion.circle
                        key={idx}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth="12"
                        strokeDasharray={`${segmentSize} ${circumference - segmentSize}`}
                        strokeDashoffset={-offset}
                        strokeLinecap="round"
                        className="transition-all duration-500 hover:stroke-[14px]"
                      />
                    );
                  })}
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-black text-brand-charcoal">{totalDistCount}</span>
                  <span className="text-[0.55rem] text-muted-foreground font-bold uppercase">Orders</span>
                </div>
              </div>

              {/* Legends */}
              <div className="flex flex-col gap-1.5 w-full">
                {statusDist.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[0.7rem] font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-brand-charcoal">{item.status}</span>
                    </div>
                    <span className="text-muted-foreground">{item.count} ({Math.round((item.count / totalDistCount) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Preview */}
      <div className="bg-white border border-brand-beige rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-beige bg-brand-cream/50">
          <h4 className="font-serif text-sm font-bold text-brand-charcoal">Recent Activity</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-cream text-brand-charcoal text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">Order</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-beige text-xs">
              {recentOrders.map(o => (
                <tr key={o.id} className="hover:bg-brand-cream/30">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{o.order_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{o.user_name || "Guest"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      o.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                      o.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">₹{o.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
