"use client";

import React, { useState } from "react";
import { 
  FileText, 
  X, 
  Download, 
  Mail, 
  MessageCircle, 
  Printer, 
  User, 
  Phone, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InvoiceDrawerProps {
  invoice: any | null;
  onClose: () => void;
  onResendEmail: (invoice: any) => void;
  onResendWhatsApp: (invoice: any) => void;
}

export function InvoiceDrawer({
  invoice,
  onClose,
  onResendEmail,
  onResendWhatsApp,
}: InvoiceDrawerProps) {
  if (!invoice) return null;

  const displayEmail = invoice.metadata?.user_email || invoice.orders?.user_email || "N/A";
  const displayName = invoice.metadata?.user_name || invoice.orders?.user_name || "Valued Customer";
  const displayPhone = invoice.metadata?.user_phone || invoice.orders?.user_phone || "N/A";
  const total = Number(invoice.metadata?.total || invoice.orders?.total || 0);

  const getStatusBadge = () => {
    const meta = invoice.metadata || {};
    if (meta.delivery_status === "sent" || meta.email_sent === true) {
      return { label: "Sent", bg: "bg-emerald-50 text-emerald-800 border-emerald-300", icon: CheckCircle2 };
    }
    if (meta.delivery_status === "failed") {
      return { label: "Failed", bg: "bg-rose-50 text-rose-800 border-rose-300", icon: AlertCircle };
    }
    return { label: "Pending", bg: "bg-amber-50 text-amber-800 border-amber-300", icon: Clock };
  };

  const statusInfo = getStatusBadge();
  const StatusIcon = statusInfo.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs cursor-pointer"
        />

        {/* Drawer Panel */}
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-screen max-w-md bg-white border-l border-gray-200 shadow-2xl flex flex-col justify-between"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-800">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-extrabold text-base text-gray-900">
                    {invoice.invoice_number}
                  </h4>
                  <span className="text-[11px] font-medium text-gray-500">
                    Ref: {invoice.orders?.order_number || (invoice.metadata?.is_manual ? "Manual Invoice" : "N/A")}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Total Amount</span>
                  <span className="text-xl font-extrabold text-amber-800 font-serif mt-1">₹{total.toFixed(2)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Delivery Status</span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border mt-1 w-max ${statusInfo.bg}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block border-b border-gray-100 pb-2">
                  Customer Details
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-700" /> Name:
                    </span>
                    <span className="font-bold text-gray-900">{displayName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-700" /> Email:
                    </span>
                    <span className="font-semibold text-gray-800 truncate max-w-[200px]" title={displayEmail}>{displayEmail}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-700" /> Phone:
                    </span>
                    <span className="font-semibold text-gray-800">{displayPhone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-700" /> Created:
                    </span>
                    <span className="font-semibold text-gray-800">{new Date(invoice.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Email Dispatch History Logs */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                  Email Dispatch Attempts ({invoice.invoice_email_logs?.length || 0})
                </span>
                {invoice.invoice_email_logs && invoice.invoice_email_logs.length > 0 ? (
                  <div className="space-y-2">
                    {invoice.invoice_email_logs.map((log: any, idx: number) => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800">Attempt #{invoice.invoice_email_logs.length - idx}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.email_status === 'sent' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-300'}`}>
                            {log.email_status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          {log.email_sent_at ? new Date(log.email_sent_at).toLocaleString() : new Date(log.created_at).toLocaleString()}
                        </p>
                        {log.error_message && (
                          <p className="text-[10px] font-mono text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-200">
                            {log.error_message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-xl border border-gray-200 text-center">
                    No email log attempts recorded.
                  </p>
                )}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50/50 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {invoice.pdf_url && (
                  <a
                    href={invoice.pdf_url}
                    download={`Invoice_${invoice.invoice_number}.pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF Download
                  </a>
                )}
                {invoice.invoice_number && (
                  <a
                    href={`/invoice/${invoice.invoice_number}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-900 text-xs font-bold rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-700" /> View & Print
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onResendEmail(invoice)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" /> Resend Email
                </button>
                <button
                  onClick={() => onResendWhatsApp(invoice)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Send WhatsApp
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
