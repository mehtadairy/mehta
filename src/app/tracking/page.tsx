"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  CreditCard,
  Search,
  Box,
  ChevronRight,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { BUSINESS } from "@/lib/businessConfig";
import CancelOrderDialog from "@/components/CancelOrderDialog";

// Types
type TrackingStatus = "Confirmed" | "Preparing" | "Packed" | "Shipped" | "Delivered";

interface OrderTrackingDetails {
  id: string;
  trackingId: string;
  status: TrackingStatus;
  date: string;
  estDelivery: string;
  address: string;
  paymentStatus: "Paid" | "Pending" | "Failed";
  items: Array<{ name: string; weight: string; qty: number; img: string }>;
}

// Remove MOCK_ORDER as we will fetch real data

const STATUS_STEPS: { id: TrackingStatus; label: string; icon: any; date?: string }[] = [
  { id: "Confirmed", label: "Order Confirmed", icon: CheckCircle2, date: "Oct 24, 10:30 AM" },
  { id: "Preparing", label: "Preparing Order", icon: Box, date: "Oct 24, 02:15 PM" },
  { id: "Packed", label: "Packed", icon: Package, date: "Oct 25, 09:00 AM" },
  { id: "Shipped", label: "Shipped", icon: Truck, date: "Oct 25, 04:45 PM" },
  { id: "Delivered", label: "Delivered", icon: MapPin }
];

function TrackingContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("id") || "";
  
  const [searchInput, setSearchInput] = useState(initialOrderId);
  const [order, setOrder] = useState<OrderTrackingDetails | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [rawOrder, setRawOrder] = useState<any>(null);

  // Automatically fetch if we have an initial order ID
  useEffect(() => {
    if (initialOrderId) {
      fetchOrder(initialOrderId);
    }
  }, [initialOrderId]);

  const fetchOrder = async (idToFetch: string) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/tracking?id=${encodeURIComponent(idToFetch)}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch order");
      }

      const o = data.order;
      setTimelineEvents(data.timeline || []);
      setRawOrder(o);

      // Map DB order to OrderTrackingDetails
      setOrder({
        id: o.order_number || o.id,
        trackingId: o.id, // For display, we might just use the DB ID if no separate tracking ID
        status: o.status as TrackingStatus,
        date: new Date(o.created_at).toLocaleDateString(),
        estDelivery: new Date(new Date(o.created_at).getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        address: `${o.shipping_address_line1 || ''}, ${o.shipping_city || ''}, ${o.shipping_state || ''} ${o.shipping_postal_code || ''}`,
        paymentStatus: o.payment_status as any,
        items: (o.order_items || []).map((item: any) => ({
          name: item.product_name,
          weight: "Box", // Default or extract from product
          qty: item.quantity,
          img: item.image_url || "/images/placeholder-sweet.jpg"
        }))
      });
    } catch (err: any) {
      setErrorMsg(err.message);
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    fetchOrder(searchInput.trim());
  };

  const getStatusIndex = (status: TrackingStatus) => {
    return STATUS_STEPS.findIndex(s => s.id === status);
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <Header />

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl font-bold text-brand-charcoal mb-3">Track Your Order</h1>
          <p className="text-sm text-muted-foreground">Enter your Order ID or Tracking Number below.</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-10 max-w-lg mx-auto relative">
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="e.g. ORD-2026-9824"
            className="w-full bg-white border border-[#EAE0D3] rounded-2xl py-4 pl-6 pr-16 text-sm text-brand-charcoal focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 shadow-sm transition-all"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-charcoal hover:bg-black text-white p-2.5 rounded-xl transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        </form>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-brand-charcoal">
            <div className="w-10 h-10 border-4 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold animate-pulse">Fetching Order Details...</p>
          </div>
        )}

        {errorMsg && !isLoading && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-center text-sm font-bold max-w-lg mx-auto">
            {errorMsg}
          </div>
        )}

        {!isLoading && order && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#EAE0D3] rounded-[32px] overflow-hidden shadow-lg shadow-brand-beige/20"
          >
            {/* Header */}
            <div className="bg-brand-charcoal text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              <div className="relative z-10">
                <p className="text-xs text-white/70 font-bold tracking-widest uppercase mb-1">Order Details</p>
                <h2 className="text-xl sm:text-2xl font-serif font-bold">{order.id}</h2>
              </div>
              <div className="relative z-10 bg-white/10 border border-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-right">
                <p className="text-[0.65rem] text-white/70 font-bold uppercase tracking-wider mb-0.5">Estimated Delivery</p>
                <p className="text-sm font-bold text-brand-gold">{order.estDelivery}</p>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {/* Timeline */}
              <div className="mb-12 relative">
                <div className="absolute left-[21px] top-4 bottom-4 w-1 bg-[#EAE0D3] rounded-full z-0 sm:left-auto sm:top-[21px] sm:right-10 sm:left-10 sm:w-auto sm:h-1" />
                
                <div className="flex flex-col sm:flex-row justify-between gap-6 sm:gap-4 relative z-10">
                  {(() => {
                    const isCancelled = order.status === 'Cancelled' || order.status === 'Cancellation Requested' || rawOrder?.status === 'Cancelled' || rawOrder?.status === 'Cancellation Requested';
                    const steps = !isCancelled ? STATUS_STEPS.map((step, idx) => {
                      const currentIdx = getStatusIndex(order.status);
                      const isCompleted = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      const timelineEvent = timelineEvents.find(e => 
                        e.status.toLowerCase() === step.id.toLowerCase() || 
                        (step.id === 'Preparing' && e.status === 'Processing')
                      );
                      const displayDate = timelineEvent 
                        ? new Date(timelineEvent.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : null;

                      return {
                        id: step.id,
                        label: step.label,
                        icon: step.icon,
                        isCompleted,
                        isCurrent,
                        displayDate,
                        isRed: false
                      };
                    }) : [
                      {
                        id: "Placed",
                        label: "Order Placed",
                        icon: CheckCircle2,
                        isCompleted: true,
                        isCurrent: false,
                        isRed: false,
                        displayDate: timelineEvents.find(e => e.status.toLowerCase() === 'pending' || e.status.toLowerCase() === 'pending payment')?.created_at
                          ? new Date(timelineEvents.find(e => e.status.toLowerCase() === 'pending' || e.status.toLowerCase() === 'pending payment').created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : order.date
                      },
                      {
                        id: "Payment",
                        label: "Payment Received",
                        icon: CreditCard,
                        isCompleted: order.paymentStatus === 'Paid',
                        isCurrent: false,
                        isRed: false,
                        displayDate: timelineEvents.find(e => e.status.toLowerCase() === 'paid' || e.status.toLowerCase() === 'payment received')?.created_at
                          ? new Date(timelineEvents.find(e => e.status.toLowerCase() === 'paid' || e.status.toLowerCase() === 'payment received').created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : null
                      },
                      {
                        id: "Cancelled",
                        label: rawOrder?.cancelled_by === 'Customer' ? 'Order Cancelled by Customer' : 'Order Cancelled',
                        icon: XCircle,
                        isCompleted: true,
                        isCurrent: true,
                        isRed: true,
                        displayDate: rawOrder?.cancelled_at 
                          ? new Date(rawOrder.cancelled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : null
                      }
                    ];

                    return steps.map((step, idx) => {
                      const isCompleted = step.isCompleted;
                      const isCurrent = step.isCurrent;
                      
                      return (
                        <div key={step.id} className="flex sm:flex-col items-center sm:items-center gap-4 sm:gap-3 flex-1 relative">
                          {/* Connecting Line active state */}
                          {idx > 0 && isCompleted && (
                            <motion.div 
                              initial={{ height: 0, width: 0 }}
                              animate={{ height: "100%", width: "100%" }}
                              transition={{ duration: 0.5, delay: idx * 0.2 }}
                              className={`absolute right-auto left-[21px] bottom-[calc(50%+22px)] top-auto w-1 z-0 sm:left-auto sm:right-[50%] sm:bottom-auto sm:top-[21px] sm:w-[calc(100%-44px)] sm:h-1 origin-left ${
                                step.isRed ? 'bg-red-500' : 'bg-brand-orange'
                              }`}
                              style={{ transformOrigin: 'top left' }}
                            />
                          )}
                          
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 relative z-10 ${
                            step.isRed
                              ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-500/30"
                              : isCompleted 
                                ? "bg-brand-orange border-brand-orange text-white shadow-md shadow-brand-orange/30" 
                                : "bg-white border-[#EAE0D3] text-[#EAE0D3]"
                          }`}>
                            <step.icon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                          </div>
                          
                          <div className="flex flex-col sm:items-center sm:text-center mt-1 sm:mt-0">
                            <span className={`text-sm font-bold ${
                              step.isRed ? 'text-red-500' : isCurrent ? 'text-brand-orange' : isCompleted ? 'text-brand-charcoal' : 'text-muted-foreground'
                            }`}>
                              {step.label}
                            </span>
                            {step.displayDate && (
                              <span className="text-[0.65rem] text-muted-foreground mt-0.5">{step.displayDate}</span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Cancellation section */}
              {order && (() => {
                const isCancelled = order.status === 'Cancelled' || (rawOrder?.status === 'Cancellation Requested');
                const cancellableStatuses = ['Confirmed', 'Paid', 'Pending Payment', 'Processing'];
                const canCancel = cancellableStatuses.includes(order.status) || cancellableStatuses.includes(rawOrder?.status || '');
                const nonCancellable = ['Preparing', 'Packed', 'Ready', 'Ready For Pickup', 'Out for Delivery', 'Shipped'].includes(order.status) || ['Preparing', 'Packed', 'Ready', 'Ready For Pickup', 'Out for Delivery', 'Shipped'].includes(rawOrder?.status || '');

                if (isCancelled) {
                  return (
                    <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <h4 className="text-sm font-bold text-red-700">Order Cancelled</h4>
                      </div>
                      {rawOrder?.cancellation_reason && (
                        <p className="text-xs text-red-600 ml-8">Reason: {rawOrder.cancellation_reason}</p>
                      )}
                      {rawOrder?.cancelled_at && (
                        <p className="text-xs text-red-500 ml-8 mt-1">Cancelled on: {new Date(rawOrder.cancelled_at).toLocaleString('en-IN')}</p>
                      )}
                    </div>
                  );
                }
                if (canCancel) {
                  return (
                    <div className="mb-8 flex justify-center">
                      <button
                        onClick={() => setCancellingOrderId(rawOrder?.id || order.trackingId)}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 shadow-md"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel Order
                      </button>
                    </div>
                  );
                }
                if (nonCancellable && order.status !== 'Delivered') {
                  return (
                    <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">This order has already entered preparation and can no longer be cancelled online.</p>
                    </div>
                  );
                }
                return null;
              })()}

              <hr className="border-[#EAE0D3] mb-8" />

              {/* Grid Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Shipping & Payment */}
                <div className="flex flex-col gap-6">
                  <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#EAE0D3]">
                    <div className="flex items-center gap-2 mb-3">
                      <Truck className="w-4 h-4 text-brand-orange" />
                      <h4 className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">Tracking Info</h4>
                    </div>
                    <p className="text-sm font-bold text-brand-charcoal">{order.trackingId}</p>
                    <p className="text-xs text-muted-foreground mt-1">Carrier: Delhivery Express</p>
                  </div>

                  <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#EAE0D3]">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-brand-orange" />
                      <h4 className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">Delivery Address</h4>
                    </div>
                    <p className="text-sm text-brand-charcoal leading-relaxed">{order.address}</p>
                  </div>

                  <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#EAE0D3]">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="w-4 h-4 text-brand-orange" />
                      <h4 className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">Payment Status</h4>
                    </div>
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {order.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Right: Items */}
                <div className="bg-white border border-[#EAE0D3] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col h-full">
                  <h4 className="text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-4">Items in this shipment</h4>
                  
                  <div className="flex flex-col gap-4 flex-grow">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 py-2 border-b border-[#EAE0D3] last:border-0 last:pb-0">
                        <img src={item.img} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-brand-cream" />
                        <div className="flex-grow">
                          <p className="text-sm font-bold text-brand-charcoal">{item.name}</p>
                          <p className="text-xs text-brand-gold font-bold uppercase mt-1">{item.weight}</p>
                        </div>
                        <div className="text-sm font-bold text-brand-charcoal bg-[#FAF6EE] px-3 py-1.5 rounded-lg border border-[#EAE0D3]">
                          x{item.qty}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="w-full mt-6 bg-brand-cream hover:bg-[#EAE0D3] text-brand-charcoal border border-[#EAE0D3] hover:border-brand-orange transition-colors rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-2">
                    View Invoice <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </main>

      {/* Cancel Order Dialog */}
      {cancellingOrderId && (
        <CancelOrderDialog
          orderId={cancellingOrderId}
          isOpen={!!cancellingOrderId}
          onClose={() => setCancellingOrderId(null)}
          onSuccess={(newStatus) => {
            setCancellingOrderId(null);
            // Refetch the order to get updated data
            if (searchInput) fetchOrder(searchInput);
          }}
        />
      )}

      <Footer />
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center"><div className="w-10 h-10 border-4 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" /></div>}>
      <TrackingContent />
    </Suspense>
  );
}
