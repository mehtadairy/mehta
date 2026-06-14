"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TrendingUp, ShoppingBag, Users, IndianRupee, Download } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    ordersToday: 0,
    ordersThisMonth: 0,
    totalCustomers: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-brand-beige pb-3">
        <h3 className="font-serif text-lg font-bold text-brand-charcoal flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-orange" />
          Dashboard & Analytics
        </h3>
        <button 
          onClick={exportPDFReport}
          className="flex items-center gap-2 px-4 py-2 bg-brand-charcoal text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors"
        >
          <Download className="w-4 h-4" /> Export Report (PDF)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-brand-beige p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <IndianRupee className="w-4 h-4" />
          </div>
          <span className="font-serif text-3xl font-black text-brand-charcoal">₹{stats.totalRevenue.toLocaleString()}</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-brand-beige p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Orders Today</span>
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="font-serif text-3xl font-black text-brand-charcoal">{stats.ordersToday}</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-brand-beige p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Orders This Month</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="font-serif text-3xl font-black text-brand-charcoal">{stats.ordersThisMonth}</span>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-brand-beige p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Total Customers</span>
            <Users className="w-4 h-4" />
          </div>
          <span className="font-serif text-3xl font-black text-brand-charcoal">{stats.totalCustomers}</span>
        </div>
      </div>

      {/* Recent Orders Preview */}
      <div className="bg-white border border-brand-beige rounded-2xl shadow-sm overflow-hidden">
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
