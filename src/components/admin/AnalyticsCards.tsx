"use client";

import React from "react";
import { 
  ShoppingBag, 
  IndianRupee, 
  Clock, 
  PackageCheck, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";

interface AnalyticsCardsProps {
  orders: any[];
}

export function AnalyticsCards({ orders }: AnalyticsCardsProps) {
  const todayStr = new Date().toDateString();

  const todayOrders = orders.filter(
    (o) => new Date(o.createdAtRaw || o.created_at || Date.now()).toDateString() === todayStr
  );

  const todayRevenue = todayOrders
    .filter((o) => o.paymentStatus === "Paid")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const pendingCount = orders.filter((o) => o.status === "Pending" || o.status === "Processing").length;
  const packedCount = orders.filter((o) => o.status === "Packed").length;
  const shippedCount = orders.filter((o) => o.status === "Shipped").length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;
  const cancelledCount = orders.filter((o) => o.status === "Cancelled").length;

  const totalValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgOrderValue = orders.length > 0 ? Math.round(totalValue / orders.length) : 0;

  const cards = [
    {
      title: "TODAY'S ORDERS",
      value: todayOrders.length,
      subtitle: `${todayOrders.filter((o) => o.paymentStatus === "Paid").length} Paid Today`,
      icon: ShoppingBag,
      color: "text-amber-700 bg-amber-50 border-amber-200",
      valueColor: "text-gray-900"
    },
    {
      title: "TODAY'S REVENUE",
      value: `₹${todayRevenue.toLocaleString('en-IN')}`,
      subtitle: "Gross Sales Today",
      icon: IndianRupee,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      valueColor: "text-emerald-700"
    },
    {
      title: "PENDING / PROCESSING",
      value: pendingCount,
      subtitle: "Requires Action",
      icon: Clock,
      color: "text-orange-700 bg-orange-50 border-orange-200",
      valueColor: "text-orange-600"
    },
    {
      title: "PACKED & READY",
      value: packedCount,
      subtitle: "Ready for Dispatch",
      icon: PackageCheck,
      color: "text-purple-700 bg-purple-50 border-purple-200",
      valueColor: "text-purple-700"
    },
    {
      title: "IN TRANSIT",
      value: shippedCount,
      subtitle: "Out for Delivery",
      icon: Truck,
      color: "text-blue-700 bg-blue-50 border-blue-200",
      valueColor: "text-blue-700"
    },
    {
      title: "DELIVERED",
      value: deliveredCount,
      subtitle: "Successfully Fulfilled",
      icon: CheckCircle2,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      valueColor: "text-gray-900"
    },
    {
      title: "CANCELLED",
      value: cancelledCount,
      subtitle: "Refunded / Voided",
      icon: XCircle,
      color: "text-rose-700 bg-rose-50 border-rose-200",
      valueColor: "text-rose-600"
    },
    {
      title: "AVG ORDER VALUE",
      value: `₹${avgOrderValue.toLocaleString('en-IN')}`,
      subtitle: `${orders.length} Total Orders`,
      icon: TrendingUp,
      color: "text-amber-800 bg-amber-50 border-amber-200",
      valueColor: "text-amber-900"
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: idx * 0.02 }}
            className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs hover:shadow-sm transition-all duration-150 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-extrabold tracking-wider text-gray-500 uppercase truncate">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg border shrink-0 ${card.color}`}>
                <IconComponent className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-2">
              <div className={`text-xl font-bold tracking-tight ${card.valueColor}`}>
                {card.value}
              </div>
              <span className="text-[10px] font-medium text-gray-400 block truncate mt-0.5">
                {card.subtitle}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
