"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  FileText, 
  Download, 
  Mail, 
  RefreshCw, 
  Search, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Loader2,
  ListRestart,
  MessageCircle,
  Plus,
  TrendingUp,
  IndianRupee,
  Send,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckSquare,
  Square
} from "lucide-react";
import { showToast } from "@/components/Toast";
import ManualInvoiceForm from "./ManualInvoiceForm";
import { OrdersSkeleton } from "@/components/admin/OrdersSkeleton";
import { InvoiceDrawer } from "@/components/admin/InvoiceDrawer";
import { motion, AnimatePresence } from "framer-motion";

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_id: string | null;
  pdf_url: string | null;
  created_at: string;
  metadata: any;
  orders: {
    order_number: string;
    total: number;
    user_name: string;
    user_email: string;
    user_phone: string;
    payment_method: string;
    payment_status: string;
  } | null;
  invoice_email_logs: Array<{
    id: string;
    customer_email: string;
    email_sent: boolean;
    email_sent_at: string | null;
    email_status: string;
    error_message: string | null;
    retry_count: number;
    created_at: string;
  }>;
}

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterChannel, setFilterChannel] = useState<string>("all");

  // Selection state for Bulk Actions
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  
  // Drawer Preview State
  const [activeDrawerInvoice, setActiveDrawerInvoice] = useState<Invoice | null>(null);

  // Resend or retry loading states per invoice id
  const [processingInvoices, setProcessingInvoices] = useState<Record<string, boolean>>({});
  const [isRetryingAll, setIsRetryingAll] = useState(false);

  // Manual Invoice Modal
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          orders (
            order_number,
            total,
            user_name,
            user_email,
            user_phone,
            payment_method,
            payment_status
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices((data || []) as any[]);
    } catch (err: any) {
      console.error("Error fetching invoices:", err);
      showToast("Failed to fetch invoices: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async (invoice: Invoice) => {
    const targetEmail = invoice.metadata?.user_email || invoice.orders?.user_email;
    if (!targetEmail) {
      showToast("No customer email registered for this invoice", "error");
      return;
    }

    setProcessingInvoices(prev => ({ ...prev, [invoice.id]: true }));
    try {
      const res = await fetch("/api/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, email: targetEmail })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Invoice email dispatched to ${targetEmail}`, "success");
        await fetchInvoices();
      } else {
        throw new Error(data.error || "Failed to send email");
      }
    } catch (err: any) {
      console.error("Resend error:", err);
      showToast(err.message || "Failed to dispatch email", "error");
      await fetchInvoices();
    } finally {
      setProcessingInvoices(prev => ({ ...prev, [invoice.id]: false }));
    }
  };

  const handleResendWhatsApp = async (invoice: Invoice) => {
    const targetPhone = invoice.metadata?.user_phone || invoice.orders?.user_phone;
    if (!targetPhone) {
      showToast("No customer phone number registered for this invoice", "error");
      return;
    }

    setProcessingInvoices(prev => ({ ...prev, [invoice.id]: true }));
    try {
      const res = await fetch("/api/invoices/resend-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: invoice.order_id })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Invoice WhatsApp dispatched to ${targetPhone}`, "success");
        await fetchInvoices();
      } else {
        throw new Error(data.error || "Failed to send WhatsApp message");
      }
    } catch (err: any) {
      console.error("Resend WhatsApp error:", err);
      showToast(err.message || "Failed to dispatch WhatsApp message", "error");
      await fetchInvoices();
    } finally {
      setProcessingInvoices(prev => ({ ...prev, [invoice.id]: false }));
    }
  };

  const handleRetryAllFailed = async () => {
    setIsRetryingAll(true);
    try {
      const res = await fetch("/api/invoices/retry", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Retried ${data.retriedCount || 0} invoice email(s)!`, "success");
        await fetchInvoices();
      } else {
        throw new Error(data.error || "Retry action failed");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to retry deliveries", "error");
    } finally {
      setIsRetryingAll(false);
    }
  };

  const getInvoiceEmailStatus = (invoice: Invoice) => {
    const meta = invoice.metadata || {};
    if (meta.delivery_status === "sent" || meta.email_sent === true) {
      return { status: "sent", label: "Sent", bg: "bg-emerald-50 text-emerald-800 border-emerald-300" };
    }
    if (meta.delivery_status === "failed") {
      return { status: "failed", label: "Failed", bg: "bg-rose-50 text-rose-800 border-rose-300" };
    }
    return { status: "pending", label: "Pending", bg: "bg-amber-50 text-amber-800 border-amber-300" };
  };

  // Compute KPI Statistics
  const stats = useMemo(() => {
    const totalRev = invoices.reduce((sum, inv) => sum + Number(inv.metadata?.total || inv.orders?.total || 0), 0);
    const sentCount = invoices.filter(inv => getInvoiceEmailStatus(inv).status === "sent").length;
    const failedCount = invoices.filter(inv => getInvoiceEmailStatus(inv).status === "failed").length;
    const pendingCount = invoices.filter(inv => getInvoiceEmailStatus(inv).status === "pending").length;
    const manualCount = invoices.filter(inv => inv.metadata?.is_manual).length;
    const successRate = invoices.length > 0 ? Math.round((sentCount / invoices.length) * 100) : 100;

    return {
      totalRev,
      totalInvoices: invoices.length,
      sentCount,
      failedCount,
      pendingCount,
      manualCount,
      successRate
    };
  }, [invoices]);

  // Filtered List
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const orderNum = inv.orders?.order_number || "";
      const invoiceNum = inv.invoice_number || "";
      const customerEmail = inv.metadata?.user_email || inv.orders?.user_email || "";
      const customerName = inv.metadata?.user_name || inv.orders?.user_name || "";
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        invoiceNum.toLowerCase().includes(query) ||
        orderNum.toLowerCase().includes(query) ||
        customerEmail.toLowerCase().includes(query) ||
        customerName.toLowerCase().includes(query);

      const emailStatusInfo = getInvoiceEmailStatus(inv);
      const matchesStatus = filterStatus === "all" || emailStatusInfo.status === filterStatus ||
        (filterStatus === "manual" && inv.metadata?.is_manual) ||
        (filterStatus === "auto" && !inv.metadata?.is_manual);

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, filterStatus]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredInvoices.length / rowsPerPage) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredInvoices.slice(start, start + rowsPerPage);
  }, [filteredInvoices, currentPage, rowsPerPage]);

  // Bulk Selection Helpers
  const isAllSelected = paginatedInvoices.length > 0 && paginatedInvoices.every(inv => selectedInvoiceIds.includes(inv.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(paginatedInvoices.map(inv => inv.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in text-gray-900 font-sans">
      {/* ── 1. ENTERPRISE PAGE HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h3 className="font-serif text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-700" />
            Invoice & Resend Management
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Manage invoices, resend notifications, and monitor real-time email delivery logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchInvoices}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 rounded-xl transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => setIsManualFormOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Manual Invoice
          </button>

          {stats.failedCount > 0 && (
            <button
              onClick={handleRetryAllFailed}
              disabled={isRetryingAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {isRetryingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ListRestart className="w-3.5 h-3.5" />}
              Retry Failed ({stats.failedCount})
            </button>
          )}
        </div>
      </div>

      {/* ── 2. KPI ANALYTICS GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">TOTAL REVENUE</span>
          <div className="text-lg font-extrabold text-amber-800 font-serif mt-1">₹{stats.totalRev.toLocaleString()}</div>
          <span className="text-[10px] text-gray-500 font-medium mt-0.5">Gross Invoiced</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">TOTAL INVOICES</span>
          <div className="text-lg font-extrabold text-gray-900 mt-1">{stats.totalInvoices}</div>
          <span className="text-[10px] text-gray-500 font-medium mt-0.5">All Time</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">EMAIL SENT</span>
          <div className="text-lg font-extrabold text-emerald-700 mt-1">{stats.sentCount}</div>
          <span className="text-[10px] text-emerald-600 font-medium mt-0.5">Dispatched</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">MANUAL INVOICES</span>
          <div className="text-lg font-extrabold text-amber-700 mt-1">{stats.manualCount}</div>
          <span className="text-[10px] text-amber-600 font-medium mt-0.5">Custom Drafts</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">FAILED LOGS</span>
          <div className="text-lg font-extrabold text-rose-700 mt-1">{stats.failedCount}</div>
          <span className="text-[10px] text-rose-600 font-medium mt-0.5">Need Attention</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">PENDING LOGS</span>
          <div className="text-lg font-extrabold text-orange-600 mt-1">{stats.pendingCount}</div>
          <span className="text-[10px] text-gray-500 font-medium mt-0.5">In Queue</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between col-span-2">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">DELIVERY SUCCESS RATE</span>
          <div className="text-lg font-extrabold text-emerald-700 mt-1">{stats.successRate}%</div>
          <span className="text-[10px] text-gray-500 font-medium mt-0.5">Overall Performance</span>
        </div>
      </div>

      {/* ── 3. SEARCH & QUICK FILTER TOOLBAR ── */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus-within:border-amber-700 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search Invoice #, Order Ref, Customer Name, Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-700 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5 border-t border-gray-100">
          {[
            { id: "all", label: "All Invoices" },
            { id: "sent", label: "Sent" },
            { id: "failed", label: "Failed" },
            { id: "pending", label: "Pending" },
            { id: "manual", label: "Manual Drafts" },
            { id: "auto", label: "Auto Generated" },
          ].map((chip) => {
            const isActive = filterStatus === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => { setFilterStatus(chip.id); setCurrentPage(1); }}
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

      {/* ── 4. STICKY BULK ACTION BAR ── */}
      <AnimatePresence>
        {selectedInvoiceIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="sticky top-16 z-30 bg-gray-900 text-white p-3 rounded-xl shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="bg-amber-600 px-2 py-0.5 rounded text-[11px]">
                {selectedInvoiceIds.length} Selected
              </span>
              <span>Bulk Actions Available</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  showToast(`Dispatching bulk email for ${selectedInvoiceIds.length} invoices...`, "info");
                  setSelectedInvoiceIds([]);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-700 hover:bg-amber-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" /> Send Emails
              </button>
              <button
                onClick={() => setSelectedInvoiceIds([])}
                className="text-xs font-semibold text-gray-400 hover:text-white px-2 py-1"
              >
                Deselect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 5. ENTERPRISE TABLE LISTING ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <OrdersSkeleton count={6} />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <FileText className="w-12 h-12 text-gray-300 mb-3" />
            <h4 className="font-serif font-bold text-base text-gray-900">No Invoices Found</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">No invoice records matched your search or status filter selection.</p>
            <button
              onClick={() => { setSearchQuery(""); setFilterStatus("all"); }}
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
                  <th className="p-3.5 w-10 text-center">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-700">
                      {isAllSelected ? <CheckSquare className="w-4 h-4 text-amber-700" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="p-3.5">Invoice No</th>
                  <th className="p-3.5">Order Ref</th>
                  <th className="p-3.5">Customer Details</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedInvoices.map((inv) => {
                  const emailStatusInfo = getInvoiceEmailStatus(inv);
                  const displayEmail = inv.metadata?.user_email || inv.orders?.user_email || "N/A";
                  const displayName = inv.metadata?.user_name || inv.orders?.user_name || "Valued Customer";
                  const displayPhone = inv.metadata?.user_phone || inv.orders?.user_phone || "N/A";
                  const total = Number(inv.metadata?.total || inv.orders?.total || 0);
                  const isSelected = selectedInvoiceIds.includes(inv.id);

                  const initials = displayName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setActiveDrawerInvoice(inv)}
                      className={`hover:bg-amber-50/30 transition-colors cursor-pointer ${
                        isSelected ? "bg-amber-50/50" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => toggleSelectRow(inv.id)} className="text-gray-400 hover:text-gray-700">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-amber-700" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Invoice No */}
                      <td className="p-3.5 font-bold font-mono text-gray-900">
                        {inv.invoice_number}
                      </td>

                      {/* Order Ref */}
                      <td className="p-3.5">
                        {inv.metadata?.is_manual ? (
                          <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded">
                            MANUAL
                          </span>
                        ) : (
                          <span className="font-semibold text-gray-700">
                            {inv.orders?.order_number || "N/A"}
                          </span>
                        )}
                      </td>

                      {/* Customer Column with Avatar */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-amber-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 truncate max-w-[150px]">{displayName}</span>
                            <span className="text-[10px] text-gray-400 truncate max-w-[170px]">{displayEmail}</span>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="p-3.5 text-right font-extrabold font-serif text-amber-700 text-sm">
                        ₹{total.toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${emailStatusInfo.bg}`}>
                          {emailStatusInfo.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-3.5 text-gray-500 font-medium">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setActiveDrawerInvoice(inv)}
                            className="p-1.5 text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded border border-gray-200 transition-colors"
                            title="Preview Details Drawer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleResendEmail(inv)}
                            disabled={processingInvoices[inv.id]}
                            className="p-1.5 text-amber-700 hover:bg-amber-50 rounded border border-amber-200 transition-colors disabled:opacity-50"
                            title="Resend Email"
                          >
                            {processingInvoices[inv.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleResendWhatsApp(inv)}
                            disabled={processingInvoices[inv.id]}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200 transition-colors disabled:opacity-50"
                            title="Resend WhatsApp"
                          >
                            {processingInvoices[inv.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
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

        {/* ── 6. PAGINATION TOOLBAR ── */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs font-semibold text-gray-600">
          <div>
            Showing <span className="font-bold text-gray-900">{paginatedInvoices.length}</span> of{" "}
            <span className="font-bold text-gray-900">{filteredInvoices.length}</span> Invoices
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-40 border border-gray-200 rounded hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page <span className="font-bold text-gray-900">{currentPage}</span> of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-40 border border-gray-200 rounded hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 7. SLIDE-OVER DRAWER PREVIEW ── */}
      <InvoiceDrawer
        invoice={activeDrawerInvoice}
        onClose={() => setActiveDrawerInvoice(null)}
        onResendEmail={handleResendEmail}
        onResendWhatsApp={handleResendWhatsApp}
      />

      {/* ── 8. MANUAL INVOICE MODAL ── */}
      {isManualFormOpen && (
        <ManualInvoiceForm
          onClose={() => setIsManualFormOpen(false)}
          onSuccess={() => {
            setIsManualFormOpen(false);
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
}
