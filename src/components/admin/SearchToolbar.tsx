"use client";

import React from "react";
import { Search, X, RotateCcw } from "lucide-react";

interface SearchToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusChange: (status: any) => void;
  paymentFilter?: string;
  onPaymentChange?: (payment: string) => void;
  sourceFilter?: string;
  onSourceChange?: (source: string) => void;
  ordersCount: number;
  onResetFilters: () => void;
}

const STATUSES = ["All", "Processing", "Packed", "Shipped", "Delivered", "Cancelled"];

export function SearchToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  paymentFilter = "All",
  onPaymentChange,
  sourceFilter = "All",
  onSourceChange,
  ordersCount,
  onResetFilters,
}: SearchToolbarProps) {
  return (
    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col gap-2.5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Global Search Bar */}
        <div className="relative flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus-within:border-amber-600 focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Order ID, Customer, Phone, Address..."
            className="w-full text-xs bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="text-gray-400 hover:text-gray-700 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters & Reset */}
        <div className="flex items-center gap-2 shrink-0">
          {onPaymentChange && (
            <select
              value={paymentFilter}
              onChange={(e) => onPaymentChange(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:bg-gray-100"
            >
              <option value="All">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="COD">COD</option>
            </select>
          )}

          {onSourceChange && (
            <select
              value={sourceFilter}
              onChange={(e) => onSourceChange(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:bg-gray-100"
            >
              <option value="All">All Sources</option>
              <option value="website">Website</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          )}

          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-colors"
            title="Reset Filters"
          >
            <RotateCcw className="w-3 h-3 text-amber-700" />
            Reset
          </button>
        </div>
      </div>

      {/* Horizontal Status Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5 border-t border-gray-100">
        {STATUSES.map((status) => {
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-amber-700 text-white font-bold shadow-2xs"
                  : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-100"
              }`}
            >
              {status}
            </button>
          );
        })}
      </div>
    </div>
  );
}
