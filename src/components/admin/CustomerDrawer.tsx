"use client";

import React from "react";
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  ShoppingBag, 
  TrendingUp, 
  Award, 
  MapPin, 
  MessageCircle, 
  Send, 
  ExternalLink,
  ShieldCheck,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CustomerDrawerProps {
  customer: any | null;
  orders: any[];
  onClose: () => void;
  onSendPush: (phone: string, name: string) => void;
}

export function CustomerDrawer({
  customer,
  orders,
  onClose,
  onSendPush,
}: CustomerDrawerProps) {
  if (!customer) return null;

  const customerOrders = orders.filter(
    (o) =>
      (customer.phone && o.userPhone === customer.phone) ||
      (customer.email && o.userEmail === customer.email) ||
      (o.userName && o.userName.toLowerCase() === (customer.name || "").toLowerCase())
  );

  const lifetimeSpend = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgOrderVal = customerOrders.length > 0 ? Math.round(lifetimeSpend / customerOrders.length) : 0;

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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden font-sans">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs cursor-pointer"
        />

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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-700 text-white font-extrabold text-sm flex items-center justify-center shadow-2xs">
                  {initials}
                </div>
                <div>
                  <h4 className="font-serif font-extrabold text-base text-gray-900 flex items-center gap-2">
                    {customer.name || "Guest Customer"}
                    {isVIP && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded font-bold">
                        ⭐ VIP
                      </span>
                    )}
                  </h4>
                  <span className="text-xs text-gray-500 font-medium">{customer.email || "No Email"}</span>
                </div>
              </div>

              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Lifetime Spend</span>
                  <span className="text-base font-extrabold text-amber-800 font-serif mt-1">₹{lifetimeSpend.toLocaleString()}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Total Orders</span>
                  <span className="text-base font-extrabold text-gray-900 mt-1">{customerOrders.length}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Avg Order</span>
                  <span className="text-base font-extrabold text-gray-900 font-serif mt-1">₹{avgOrderVal}</span>
                </div>
              </div>

              {/* Customer Analytics Progress Bars */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block border-b border-gray-100 pb-2">
                  CRM Insight & Scores
                </span>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-gray-500">Spending Tier</span>
                      <span className="font-bold text-amber-800">{isVIP ? "High Value (VIP)" : "Standard Tier"}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-700 h-1.5 rounded-full" style={{ width: `${Math.min((lifetimeSpend / 10000) * 100, 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-gray-500">Loyalty Score</span>
                      <span className="font-bold text-emerald-700">{customerOrders.length >= 5 ? "⭐⭐⭐⭐⭐ High" : "⭐⭐⭐ Regular"}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${Math.min((customerOrders.length / 10) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Contact Details */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3 text-xs">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block border-b border-gray-100 pb-2">
                  Contact Information
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-amber-700" /> Phone:</span>
                    <span className="font-bold text-gray-900">{customer.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-amber-700" /> Email:</span>
                    <span className="font-semibold text-gray-800 truncate max-w-[200px]">{customer.email || "N/A"}</span>
                  </div>
                  {customer.created_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-amber-700" /> Member Since:</span>
                      <span className="font-semibold text-gray-800">{new Date(customer.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order History Preview */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                  Recent Orders ({customerOrders.length})
                </span>
                {customerOrders.length > 0 ? (
                  <div className="space-y-2">
                    {customerOrders.slice(0, 5).map((o) => (
                      <div key={o.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="font-bold font-mono text-gray-900">{o.orderNumber}</span>
                          <span className="text-[10px] text-gray-400">{o.date}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-amber-800 font-serif">₹{o.total}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-xl border border-gray-200 text-center">
                    No orders linked to this profile.
                  </p>
                )}
              </div>
            </div>

            {/* Footer Quick Actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50/50 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {cleanPhone && (
                  <a
                    href={`https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(customer.name || '')},%20greetings%20from%20Mehta%20Dairy!`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Chat
                  </a>
                )}
                <button
                  onClick={() => onSendPush(customer.phone, customer.name)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Push Alert
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
