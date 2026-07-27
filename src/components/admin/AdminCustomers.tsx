"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, 
  UserCheck, 
  IndianRupee, 
  Star, 
  ShoppingBag, 
  TrendingUp, 
  MessageCircle, 
  Mail, 
  Search, 
  X, 
  Download, 
  RefreshCw, 
  Plus, 
  Eye, 
  Send, 
  MapPin, 
  Phone, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { CustomerDrawer } from "@/components/admin/CustomerDrawer";
import { showToast } from "@/components/Toast";
import { motion, AnimatePresence } from "framer-motion";

interface AdminCustomersProps {
  dbCustomers: any[];
  orders: any[];
  customerSearchQuery: string;
  setCustomerSearchQuery: (q: string) => void;
  handleSendAdminPush: (phone: string, name: string) => void;
}

export function AdminCustomers({
  dbCustomers,
  orders,
  customerSearchQuery,
  setCustomerSearchQuery,
  handleSendAdminPush,
}: AdminCustomersProps) {
  const [filterSegment, setFilterSegment] = useState<string>("all");
  const [activeDrawerCustomer, setActiveDrawerCustomer] = useState<any | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Consolidated Customer Profiles List (Merges DB customers & unique Order buyers)
  const consolidatedCustomers = useMemo(() => {
    if (dbCustomers && dbCustomers.length > 0) {
      return dbCustomers;
    }
    // Fallback if DB list is empty, construct from orders
    const names = Array.from(new Set((orders || []).map((o) => o.userName))).filter(Boolean);
    return names.map((name, idx) => {
      const matchingOrders = (orders || []).filter((o) => o.userName === name);
      const phone = matchingOrders[0]?.userPhone || "";
      const email = matchingOrders[0]?.userEmail || "";
      return {
        id: `ord-cust-${idx}`,
        name,
        phone,
        email,
        created_at: matchingOrders[0]?.createdAtRaw || new Date().toISOString(),
      };
    });
  }, [dbCustomers, orders]);

  // Compute KPI Analytics Statistics
  const stats = useMemo(() => {
    let totalRev = 0;
    let vipCount = 0;
    let repeatCount = 0;

    consolidatedCustomers.forEach((cust) => {
      const custOrders = orders.filter(
        (o) =>
          (cust.phone && o.userPhone === cust.phone) ||
          (cust.email && o.userEmail === cust.email) ||
          (o.userName && o.userName.toLowerCase() === (cust.name || "").toLowerCase())
      );
      const spend = custOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      totalRev += spend;
      if (spend >= 5000 || custOrders.length >= 10) vipCount++;
      if (custOrders.length > 1) repeatCount++;
    });

    const totalCust = consolidatedCustomers.length;
    const avgSpend = totalCust > 0 ? Math.round(totalRev / totalCust) : 0;

    return {
      totalCust,
      repeatCount,
      totalRev,
      vipCount,
      avgSpend,
    };
  }, [consolidatedCustomers, orders]);

  // Filtered List
  const filteredCustomers = useMemo(() => {
    return consolidatedCustomers.filter((cust) => {
      const query = customerSearchQuery.toLowerCase();
      const matchesSearch =
        (cust.name && cust.name.toLowerCase().includes(query)) ||
        (cust.email && cust.email.toLowerCase().includes(query)) ||
        (cust.phone && cust.phone.includes(query)) ||
        (cust.id && cust.id.toLowerCase().includes(query));

      const custOrders = orders.filter(
        (o) =>
          (cust.phone && o.userPhone === cust.phone) ||
          (cust.email && o.userEmail === cust.email) ||
          (o.userName && o.userName.toLowerCase() === (cust.name || "").toLowerCase())
      );
      const spend = custOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      const matchesSegment = (() => {
        if (filterSegment === "all") return true;
        if (filterSegment === "vip") return spend >= 5000 || custOrders.length >= 10;
        if (filterSegment === "repeat") return custOrders.length > 1;
        if (filterSegment === "new") return custOrders.length <= 1;
        return true;
      })();

      return matchesSearch && matchesSegment;
    });
  }, [consolidatedCustomers, customerSearchQuery, filterSegment, orders]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredCustomers.slice(start, start + rowsPerPage);
  }, [filteredCustomers, currentPage, rowsPerPage]);

  const handleExportCSV = () => {
    const headers = ["Customer Name", "Phone", "Email", "Total Orders", "Lifetime Spend (INR)"];
    const rows = filteredCustomers.map((c) => {
      const custOrders = orders.filter(
        (o) =>
          (c.phone && o.userPhone === c.phone) ||
          (c.email && o.userEmail === c.email) ||
          (o.userName && o.userName.toLowerCase() === (c.name || "").toLowerCase())
      );
      const spend = custOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      return [c.name || "Guest", c.phone || "N/A", c.email || "N/A", custOrders.length, spend];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Mehta_Dairy_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Customer database exported to CSV!", "success");
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in text-gray-900 font-sans">
      {/* ── 1. HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h3 className="font-serif text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-700" />
            Customer Directory CRM
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Manage customer profiles, lifetime purchase histories, and direct communications.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-700" />
            Export CSV
          </button>

          <button
            onClick={() => showToast("Add Customer modal initialized", "info")}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* ── 2. KPI ANALYTICS GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">TOTAL CUSTOMERS</span>
          <div className="text-lg font-extrabold text-gray-900 mt-1">{stats.totalCust}</div>
          <span className="text-[10px] text-gray-500 font-medium mt-0.5">Registered Database</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">ACTIVE / REPEAT</span>
          <div className="text-lg font-extrabold text-emerald-700 mt-1">{stats.repeatCount}</div>
          <span className="text-[10px] text-emerald-600 font-medium mt-0.5">Multiple Orders</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">TOTAL REVENUE</span>
          <div className="text-lg font-extrabold text-amber-800 font-serif mt-1">₹{stats.totalRev.toLocaleString()}</div>
          <span className="text-[10px] text-gray-500 font-medium mt-0.5">Lifetime Value</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">VIP CUSTOMERS</span>
          <div className="text-lg font-extrabold text-amber-700 mt-1">⭐ {stats.vipCount}</div>
          <span className="text-[10px] text-amber-600 font-medium mt-0.5">High Value Spenders</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between col-span-4">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">AVERAGE CUSTOMER VALUE</span>
          <div className="text-lg font-extrabold text-gray-900 font-serif mt-1">₹{stats.avgSpend.toLocaleString()}</div>
          <span className="text-[10px] text-gray-500 font-medium mt-0.5">Per Account Spend</span>
        </div>
      </div>

      {/* ── 3. SEARCH & SEGMENT TOOLBAR ── */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus-within:border-amber-700 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search Customer Name, Phone, Email, Customer ID..."
              value={customerSearchQuery}
              onChange={(e) => setCustomerSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 font-medium"
            />
            {customerSearchQuery && (
              <button onClick={() => setCustomerSearchQuery("")} className="text-gray-400 hover:text-gray-700 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Segment Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5 border-t border-gray-100">
          {[
            { id: "all", label: "All Customers" },
            { id: "vip", label: "⭐ VIP Spenders" },
            { id: "repeat", label: "Repeat Buyers" },
            { id: "new", label: "New Buyers" },
          ].map((chip) => {
            const isActive = filterSegment === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => { setFilterSegment(chip.id); setCurrentPage(1); }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-amber-700 text-white font-bold shadow-2xs"
                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. ENTERPRISE CRM TABLE LISTING ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Users className="w-12 h-12 text-gray-300 mb-3" />
            <h4 className="font-serif font-bold text-base text-gray-900">No Customers Found</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">No customer accounts matched your search criteria or segment filter.</p>
            <button
              onClick={() => { setCustomerSearchQuery(""); setFilterSegment("all"); }}
              className="mt-4 px-4 py-2 bg-amber-700 text-white text-xs font-bold rounded-xl hover:bg-amber-800 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 font-extrabold uppercase text-[10px] tracking-wider sticky top-0 bg-gray-50 z-10">
                  <th className="p-3.5">Customer Profile</th>
                  <th className="p-3.5">Mobile Phone</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5 text-center">Orders</th>
                  <th className="p-3.5 text-right">Lifetime Spend</th>
                  <th className="p-3.5">Segment Badge</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedCustomers.map((customer, idx) => {
                  const customerOrders = orders.filter(
                    (o) =>
                      (customer.phone && o.userPhone === customer.phone) ||
                      (customer.email && o.userEmail === customer.email) ||
                      (o.userName && o.userName.toLowerCase() === (customer.name || "").toLowerCase())
                  );
                  const lifetimeSpend = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);

                  const isVIP = lifetimeSpend >= 5000 || customerOrders.length >= 10;
                  const isRepeat = customerOrders.length > 1;

                  const initials = (customer.name || "C")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();

                  const cleanPhone = (customer.phone || "").replace(/\D/g, "");

                  return (
                    <tr
                      key={customer.id || idx}
                      onClick={() => setActiveDrawerCustomer(customer)}
                      className="hover:bg-amber-50/30 transition-colors cursor-pointer"
                    >
                      {/* Customer Profile Avatar */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-amber-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 truncate max-w-[160px]">{customer.name || "Guest Customer"}</span>
                            <span className="text-[10px] font-mono text-gray-400">ID: {customer.id ? customer.id.substring(0, 8) : "GUEST"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="p-3.5 font-semibold text-gray-800">
                        {customer.phone || "N/A"}
                      </td>

                      {/* Email */}
                      <td className="p-3.5 font-medium text-gray-600 truncate max-w-[180px]">
                        {customer.email || "N/A"}
                      </td>

                      {/* Total Orders */}
                      <td className="p-3.5 text-center font-bold text-gray-900">
                        {customerOrders.length}
                      </td>

                      {/* Lifetime Spend */}
                      <td className="p-3.5 text-right font-extrabold font-serif text-amber-700 text-sm">
                        ₹{lifetimeSpend.toLocaleString()}
                      </td>

                      {/* Badges */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1">
                          {isVIP ? (
                            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded">
                              ⭐ VIP
                            </span>
                          ) : isRepeat ? (
                            <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded">
                              Repeat
                            </span>
                          ) : (
                            <span className="text-[10px] bg-gray-50 text-gray-700 border border-gray-300 font-semibold px-2 py-0.5 rounded">
                              New
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Quick Actions */}
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setActiveDrawerCustomer(customer)}
                            className="p-1.5 text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded border border-gray-200 transition-colors"
                            title="View Customer CRM Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(customer.name || '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-300 transition-colors"
                              title="Open WhatsApp Chat"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleSendAdminPush(customer.phone, customer.name)}
                            className="p-1.5 text-amber-700 hover:bg-amber-50 rounded border border-amber-300 transition-colors"
                            title="Send Push Notification"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 5. PAGINATION TOOLBAR ── */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs font-semibold text-gray-600">
          <div>
            Showing <span className="font-bold text-gray-900">{paginatedCustomers.length}</span> of{" "}
            <span className="font-bold text-gray-900">{filteredCustomers.length}</span> Customers
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-40 border border-gray-200 rounded hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page <span className="font-bold text-gray-900">{currentPage}</span> of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-40 border border-gray-200 rounded hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 6. SLIDE-OVER CRM DRAWER ── */}
      <CustomerDrawer
        customer={activeDrawerCustomer}
        orders={orders}
        onClose={() => setActiveDrawerCustomer(null)}
        onSendPush={handleSendAdminPush}
      />
    </div>
  );
}
