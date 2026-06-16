"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  FileText, 
  Download, 
  Mail, 
  RefreshCw, 
  Search, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Loader2,
  ListRestart
} from "lucide-react";
import { showToast } from "@/components/Toast";

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
  const [filterStatus, setFilterStatus] = useState<"all" | "sent" | "failed" | "pending">("all");
  
  // Resend or retry loading states per invoice id
  const [processingInvoices, setProcessingInvoices] = useState<Record<string, boolean>>({});
  const [isRetryingAll, setIsRetryingAll] = useState(false);
  
  // Modal state to view email logs for a specific invoice
  const [selectedInvoiceForLogs, setSelectedInvoiceForLogs] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      // Query invoices with order details and email logs
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
          ),
          invoice_email_logs (
            id,
            customer_email,
            email_sent,
            email_sent_at,
            email_status,
            error_message,
            retry_count,
            created_at
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setInvoices((data || []) as any[]);
    } catch (err: any) {
      console.error("Error fetching invoices:", err);
      showToast("Failed to fetch invoices: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger manual resend email for a specific invoice
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
        // Refresh database state
        await fetchInvoices();
      } else {
        throw new Error(data.error || "Failed to send email");
      }
    } catch (err: any) {
      console.error("Resend error:", err);
      showToast(err.message || "Failed to dispatch email", "error");
      // Refresh list to show the updated failed logs
      await fetchInvoices();
    } finally {
      setProcessingInvoices(prev => ({ ...prev, [invoice.id]: false }));
    }
  };

  // Trigger retry of all failed emails (limited to max 3 attempts)
  const handleRetryAllFailed = async () => {
    setIsRetryingAll(true);
    try {
      const res = await fetch("/api/invoices/retry", {
        method: "POST"
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const count = data.retriedCount || 0;
        if (count > 0) {
          showToast(`Successfully retried and sent ${count} invoice email(s)!`, "success");
        } else {
          showToast("No pending failed logs eligible for retry (limit of 3 attempts)", "info");
        }
        await fetchInvoices();
      } else {
        throw new Error(data.error || "Retry action failed");
      }
    } catch (err: any) {
      console.error("Retry all error:", err);
      showToast(err.message || "Failed to retry deliveries", "error");
    } finally {
      setIsRetryingAll(false);
    }
  };

  // Helper to determine the consolidated email status for an invoice
  const getInvoiceEmailStatus = (invoice: Invoice): { status: string; label: string; bgClass: string; textClass: string } => {
    const logs = invoice.invoice_email_logs || [];
    if (logs.length === 0) {
      return { status: "pending", label: "No Logs", bgClass: "bg-gray-100", textClass: "text-gray-600" };
    }
    
    // Sort logs by created_at desc to find latest
    const sorted = [...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latest = sorted[0];

    if (latest.email_status === "sent") {
      return { status: "sent", label: "Sent", bgClass: "bg-emerald-50 text-emerald-800 border-emerald-200 border", textClass: "text-emerald-700" };
    }
    if (latest.email_status === "failed") {
      return { status: "failed", label: `Failed (Attempt ${latest.retry_count})`, bgClass: "bg-red-50 text-red-800 border-red-200 border", textClass: "text-red-700" };
    }
    
    return { status: "pending", label: "Pending", bgClass: "bg-yellow-50 text-yellow-800 border-yellow-200 border", textClass: "text-yellow-700" };
  };

  // Stats computation
  const totalInvoicesCount = invoices.length;
  const failedEmailCount = invoices.filter(inv => getInvoiceEmailStatus(inv).status === "failed").length;
  const sentEmailCount = invoices.filter(inv => getInvoiceEmailStatus(inv).status === "sent").length;

  // Search and status filtering logic
  const filteredInvoices = invoices.filter(inv => {
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
    const matchesStatus = filterStatus === "all" || emailStatusInfo.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-beige pb-3 gap-3">
        <h3 className="font-serif text-lg font-bold text-brand-charcoal flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-orange" />
          Invoice & Resend Log Management
        </h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchInvoices} 
            className="text-xs text-brand-orange hover:underline font-semibold flex items-center gap-1"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          
          {failedEmailCount > 0 && (
            <button 
              onClick={handleRetryAllFailed} 
              disabled={isRetryingAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-orange hover:bg-brand-orange-hover text-white text-[0.7rem] font-bold rounded-lg transition-all shadow-xs disabled:opacity-50"
            >
              {isRetryingAll ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> Retrying...
                </>
              ) : (
                <>
                  <ListRestart className="w-3.5 h-3.5" /> Retry Failed Deliveries
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-brand-beige p-5 rounded-2xl shadow-xs flex flex-col justify-center items-center">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">Total Invoices Generated</span>
          <span className="font-serif text-3xl font-black text-brand-charcoal mt-2">{totalInvoicesCount}</span>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl shadow-xs flex flex-col justify-center items-center text-emerald-800">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider">Successful Emails</span>
          <span className="font-serif text-3xl font-black mt-2 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-emerald-600" /> {sentEmailCount}
          </span>
        </div>
        <div className="bg-red-50/50 border border-red-100 p-5 rounded-2xl shadow-xs flex flex-col justify-center items-center text-red-800">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider">Failed Email Deliveries</span>
          <span className="font-serif text-3xl font-black mt-2 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-600" /> {failedEmailCount}
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-brand-cream/10 p-4 rounded-xl border border-brand-beige">
        {/* Search Bar */}
        <div className="w-full sm:max-w-xs relative flex items-center border border-brand-beige rounded-lg bg-white px-3 py-1.5 focus-within:border-brand-orange transition-all">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <input 
            type="text" 
            placeholder="Search invoice number, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-transparent border-none outline-none text-brand-charcoal"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-brand-charcoal">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Tab filters */}
        <div className="flex flex-wrap gap-1.5 border border-brand-beige bg-white p-1 rounded-lg">
          {(["all", "sent", "failed", "pending"] as const).map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-[0.68rem] font-bold rounded-md uppercase tracking-wider transition-colors ${
                filterStatus === status 
                  ? "bg-brand-orange text-white" 
                  : "text-brand-charcoal hover:bg-brand-cream"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table listing */}
      <div className="bg-white border border-brand-beige rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
            <span>Loading Invoices and Dispatch Logs...</span>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No invoices found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-beige bg-brand-cream/35 text-muted-foreground font-semibold">
                  <th className="px-5 py-3.5">Invoice No</th>
                  <th className="px-5 py-3.5">Order Ref</th>
                  <th className="px-5 py-3.5">Customer & Email</th>
                  <th className="px-5 py-3.5">Total Value</th>
                  <th className="px-5 py-3.5">Email Status</th>
                  <th className="px-5 py-3.5">Generated At</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/50">
                {filteredInvoices.map((inv) => {
                  const emailStatusInfo = getInvoiceEmailStatus(inv);
                  const displayEmail = inv.metadata?.user_email || inv.orders?.user_email || "N/A";
                  const displayName = inv.metadata?.user_name || inv.orders?.user_name || "Valued Customer";
                  const total = inv.metadata?.total || inv.orders?.total || 0;
                  
                  return (
                    <tr key={inv.id} className="hover:bg-brand-cream/10 transition-colors">
                      <td className="px-5 py-4 font-bold text-brand-charcoal">
                        {inv.invoice_number}
                      </td>
                      <td className="px-5 py-4 font-semibold text-muted-foreground font-mono">
                        {inv.orders?.order_number || "Deleted"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-brand-charcoal">{displayName}</span>
                          <span className="text-[0.68rem] text-muted-foreground">{displayEmail}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-serif font-bold text-brand-orange">
                        ₹{Number(total).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceForLogs(inv)}
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[0.65rem] font-bold cursor-pointer hover:opacity-80 transition-all ${emailStatusInfo.bgClass}`}
                          title="Click to view detailed dispatch logs"
                        >
                          {emailStatusInfo.label}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          {inv.pdf_url && (
                            <a
                              href={`/api/invoices/download?invoiceId=${inv.id}`}
                              className="h-7 w-7 rounded-lg border border-brand-beige hover:border-brand-gold flex items-center justify-center text-brand-charcoal hover:bg-brand-cream transition-colors"
                              title="Download invoice PDF"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleResendEmail(inv)}
                            disabled={processingInvoices[inv.id]}
                            className="h-7 w-7 rounded-lg border border-brand-beige hover:border-brand-orange flex items-center justify-center text-brand-charcoal hover:text-brand-orange hover:bg-brand-cream transition-colors disabled:opacity-50"
                            title="Resend invoice PDF via Resend"
                          >
                            {processingInvoices[inv.id] ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-orange" />
                            ) : (
                              <Mail className="h-3.5 w-3.5" />
                            )}
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
      </div>

      {/* Logs viewing modal */}
      {selectedInvoiceForLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setSelectedInvoiceForLogs(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
          />
          
          <div className="relative z-10 w-full max-w-2xl bg-white border border-brand-beige rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-beige pb-3">
              <div className="flex flex-col">
                <h4 className="font-serif text-sm font-bold text-brand-charcoal">
                  Email Dispatch Logs: {selectedInvoiceForLogs.invoice_number}
                </h4>
                <p className="text-[0.65rem] text-muted-foreground mt-0.5">
                  Order Reference: {selectedInvoiceForLogs.orders?.order_number}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedInvoiceForLogs(null)} 
                className="p-1 hover:bg-brand-cream rounded-full"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {selectedInvoiceForLogs.invoice_email_logs.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-brand-beige rounded-xl">
                  No email attempts recorded yet for this invoice.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {[...selectedInvoiceForLogs.invoice_email_logs]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((log, index) => (
                      <div key={log.id} className="border border-brand-beige rounded-xl p-4 bg-brand-cream/5 text-xs flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-brand-charcoal">Attempt #{selectedInvoiceForLogs.invoice_email_logs.length - index}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold ${
                            log.email_status === "sent" 
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 border" 
                              : "bg-red-50 text-red-800 border-red-200 border"
                          }`}>
                            {log.email_status.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1.5 border-t border-brand-beige/50">
                          <div>
                            <span className="font-bold text-brand-charcoal">Recipient Email:</span> {log.customer_email}
                          </div>
                          <div>
                            <span className="font-bold text-brand-charcoal">Dispatched At:</span> {log.email_sent_at ? new Date(log.email_sent_at).toLocaleString() : "N/A"}
                          </div>
                          <div>
                            <span className="font-bold text-brand-charcoal">System Retries:</span> {log.retry_count} / 3
                          </div>
                          <div>
                            <span className="font-bold text-brand-charcoal">Log Created:</span> {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                        {log.error_message && (
                          <div className="mt-1.5 p-2 bg-red-50 border border-red-100 text-red-800 rounded-lg font-mono text-[0.65rem]">
                            <strong>Error Response:</strong> {log.error_message}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-2 border-t border-brand-beige pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForLogs(null)}
                  className="px-4 py-2 border border-brand-beige hover:border-brand-gold rounded-lg text-xs font-bold text-brand-charcoal"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const inv = selectedInvoiceForLogs;
                    setSelectedInvoiceForLogs(null);
                    handleResendEmail(inv);
                  }}
                  className="px-4 py-2 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg text-xs font-bold"
                >
                  Dispatch Email Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
