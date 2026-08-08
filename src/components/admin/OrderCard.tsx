"use client";

import React, { useState } from "react";
import { Order } from "@/lib/types";
import { 
  User, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Package, 
  XCircle, 
  FileText, 
  Printer, 
  Bell, 
  ChevronDown, 
  ChevronUp, 
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, status: string) => void;
  onResendNotification: (orderId: string, type: string) => void;
  onReprint: (orderId: string) => void;
}

const STAGES = ["Placed", "Confirmed", "Processing", "Packed", "Shipped", "Delivered"];

export function OrderCard({
  order,
  onUpdateStatus,
  onResendNotification,
  onReprint,
}: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Status Badge Styling (Strict WCAG AA High Contrast)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
      case "Processing":
        return { bg: "bg-amber-50 text-amber-800 border-amber-300", label: status };
      case "Packed":
        return { bg: "bg-purple-50 text-purple-800 border-purple-300", label: "Packed" };
      case "Shipped":
        return { bg: "bg-blue-50 text-blue-800 border-blue-300", label: "Shipped" };
      case "Delivered":
        return { bg: "bg-emerald-50 text-emerald-800 border-emerald-300", label: "Delivered" };
      case "Cancelled":
      case "Cancellation Requested":
        return { bg: "bg-rose-50 text-rose-800 border-rose-300", label: status };
      default:
        return { bg: "bg-gray-50 text-gray-800 border-gray-300", label: status };
    }
  };

  const getPaymentBadge = (payStatus: string, payMethod?: string) => {
    const isPaid = payStatus === "Paid";
    return {
      bg: isPaid ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-amber-50 text-amber-800 border-amber-300",
      text: `${payMethod || 'Online'} • ${payStatus}`
    };
  };

  const currentStageIndex = (() => {
    switch (order.status) {
      case "Pending": return 0;
      case "Confirmed": return 1;
      case "Processing": return 2;
      case "Packed": return 3;
      case "Shipped": return 4;
      case "Delivered": return 5;
      default: return 0;
    }
  })();

  const statusBadge = getStatusBadge(order.status);
  const paymentBadge = getPaymentBadge(order.paymentStatus, order.paymentMethod);

  const visibleItems = order.items.slice(0, 2);
  const remainingCount = order.items.length - 2;

  const addressObj = typeof order.shippingAddress === 'object' ? (order.shippingAddress as any) : null;
  const addressText = typeof order.shippingAddress === 'string'
    ? order.shippingAddress
    : addressObj?.id === 'pickup'
      ? `Pickup @ ${addressObj.pickup_store === 'taleti' ? 'Taleti Branch' : 'Navagadh Branch'}`
      : `${addressObj?.street || ''}${addressObj?.city ? `, ${addressObj.city}` : ''}${addressObj?.pincode ? ` - ${addressObj.pincode}` : ''}`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-2xs hover:border-amber-400 transition-all duration-150 flex flex-col gap-2">
      {/* ── ULTRA-COMPACT SINGLE ROW HEADER & MAIN INFO ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left Column: Order #, Date, Customer & Phone */}
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <span className="font-mono text-xs font-bold text-gray-900 tracking-tight shrink-0">
            {order.orderNumber || `ORD-${order.id.substring(0, 6).toUpperCase()}`}
          </span>
          <span className="text-[11px] text-gray-400 shrink-0">
            {order.date}
          </span>
          <div className="h-3 w-px bg-gray-200 shrink-0 hidden sm:block" />
          <div className="flex items-center gap-1 text-xs font-bold text-gray-800 shrink-0">
            <User className="w-3 h-3 text-amber-700 shrink-0" />
            <span className="truncate max-w-[120px] sm:max-w-[160px]">{order.userName || "Guest"}</span>
          </div>
          <span className="text-[11px] font-semibold text-gray-500 shrink-0">
            ({order.userPhone || "N/A"})
          </span>
          <span className="text-[11px] text-gray-500 truncate max-w-[180px] hidden lg:block" title={addressText}>
            📍 {addressText}
          </span>
        </div>

        {/* Right Column: Status Badges, Prominent Total & Actions */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Payment Status Pill */}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${paymentBadge.bg}`}>
            {paymentBadge.text}
          </span>

          {/* Order Status Pill */}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusBadge.bg}`}>
            {statusBadge.label}
          </span>

          {/* Prominent Order Total */}
          <span className="text-sm font-extrabold text-amber-700 font-serif ml-1">
            ₹{order.total}
          </span>

          {/* Compact Icon Buttons */}
          {order.invoiceUrl && (
            <a
              href={order.invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1 text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded border border-gray-200 transition-colors"
              title="View Invoice"
            >
              <FileText className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => onResendNotification(order.id, order.status)}
            className="p-1 text-amber-700 hover:bg-amber-50 rounded border border-amber-200 transition-colors"
            title="Resend WhatsApp Notification"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onReprint(order.id)}
            className="p-1 text-gray-800 hover:bg-gray-100 rounded border border-gray-300 transition-colors"
            title="Reprint Receipt"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 hover:bg-gray-100 px-2 py-1 rounded border border-gray-200 transition-colors cursor-pointer"
          >
            {isExpanded ? "Hide" : "View Details"}
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* ── CANCELLATION APPROVAL BANNER (High Visibility) ── */}
      {order.status === 'Cancellation Requested' && (
        <div className="bg-rose-50 border border-rose-300 rounded-lg p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 my-1">
          <div className="flex items-center gap-2 text-rose-900">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">Customer Cancellation Request</span>
              <span className="text-[11px] text-rose-700 font-medium">Reason: {order.cancellationReason || "Customer requested order cancellation"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              onClick={() => onUpdateStatus(order.id, 'Cancelled')}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded shadow-xs flex items-center gap-1 cursor-pointer"
            >
              ✓ Approve Cancellation
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, 'Processing')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3 py-1 rounded border border-gray-300 cursor-pointer"
            >
              Reject Request
            </button>
          </div>
        </div>
      )}

      {/* ── SECOND ROW: PRODUCT CHIPS (Visible by default) ── */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Items:</span>
        {visibleItems.map((item, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-gray-800"
          >
            <span className="font-bold">{item.productName}</span>
            <span className="text-gray-500 text-[10px]">({item.weight})</span>
            <span className="bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-bold text-[10px]">
              ×{item.quantity}
            </span>
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            +{remainingCount} More
          </span>
        )}
      </div>

      {/* ── EXPANDED DETAILS & COMPACT TIMELINE ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden border-t border-gray-200 pt-3 mt-1 flex flex-col gap-3"
          >
            {/* Horizontal Timeline Visualizer */}
            {order.status !== 'Cancelled' && (
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between relative px-2">
                  <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-gray-300 z-0" />
                  {STAGES.map((stage, idx) => {
                    const isCompleted = idx <= currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    return (
                      <div key={stage} className="flex flex-col items-center gap-0.5 z-10">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                            isCurrent
                              ? "bg-amber-700 text-white ring-2 ring-amber-200"
                              : isCompleted
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {isCompleted ? <Check className="w-2.5 h-2.5" /> : idx + 1}
                        </div>
                        <span className={`text-[10px] font-semibold ${isCurrent ? "text-amber-800 font-bold" : "text-gray-500"}`}>
                          {stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Customer & Delivery Info */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer Info</span>
                <span className="text-xs font-bold text-gray-900">{order.userName || "Guest"}</span>
                <span className="text-xs text-gray-700 font-medium">📞 {order.userPhone || "N/A"}</span>
              </div>
              <div className="flex flex-col gap-1 sm:text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Delivery Address</span>
                <span className="text-xs text-gray-800 font-semibold max-w-md whitespace-normal leading-relaxed">
                  📍 {addressText}
                </span>
              </div>
            </div>

            {/* Distinct Timestamps (Only shown if they exist) */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col sm:flex-row flex-wrap gap-4 text-[11px]">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-gray-400 uppercase tracking-wider text-[9px]">Order Placed</span>
                <span className="font-semibold text-gray-800">{order.date}</span>
              </div>
              {order.paymentCompletedAt && (
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-emerald-600 uppercase tracking-wider text-[9px]">Payment Completed</span>
                  <span className="font-semibold text-emerald-900">
                    {new Date(order.paymentCompletedAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' })} • {new Date(order.paymentCompletedAt).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                </div>
              )}
              {order.cancelledAt && (
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-rose-600 uppercase tracking-wider text-[9px]">Cancelled At</span>
                  <span className="font-semibold text-rose-900">
                    {new Date(order.cancelledAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' })} • {new Date(order.cancelledAt).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                </div>
              )}
            </div>

            {/* Complete Items Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200 text-xs">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">{item.productName}</span>
                    <span className="text-[10px] text-gray-500">{item.weight}</span>
                  </div>
                  <span className="font-bold text-amber-700">₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Quick Status Update Selector */}
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600">Update Status:</span>
                <select
                  value={order.status}
                  onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-bold text-gray-900 outline-none cursor-pointer"
                >
                  <option value="Processing">Processing</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Packed">Packed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancellation Requested">Cancellation Requested</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
