"use client";

import React from 'react';
import { motion } from 'framer-motion';

export function OrdersSkeleton({ count = 6 }: { count?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-6 w-full animate-pulse"
    >
      {/* Header & Search Bar Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-brand-beige/60 pb-3 gap-3">
        <div className="h-7 w-44 bg-brand-cream/60 rounded-md" />

        {/* Search Bar Skeleton */}
        <div className="w-full sm:w-64 h-9 bg-brand-cream/60 rounded-xl border border-brand-beige/40" />
      </div>

      {/* Status Tabs Skeleton */}
      <div className="flex flex-wrap gap-2 border border-brand-beige/40 bg-brand-cream/15 p-1.5 rounded-xl w-max max-w-full">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className="h-7 w-24 sm:w-28 bg-brand-cream/80 rounded-lg" />
        ))}
      </div>

      {/* 6 Skeleton Order Cards / Table Rows */}
      <div className="flex flex-col gap-3 w-full">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-beige/50 shadow-2xs flex flex-col gap-3"
          >
            {/* Top row: Order Number, Date, Status Pill */}
            <div className="flex items-center justify-between border-b border-brand-beige/30 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-5 w-28 bg-brand-cream/80 rounded-md" />
                <div className="h-4 w-20 bg-brand-cream/60 rounded-md hidden sm:block" />
              </div>
              <div className="h-6 w-24 bg-brand-cream/80 rounded-full" />
            </div>

            {/* Middle row: Customer Info & Items summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="h-4 w-32 bg-brand-cream/70 rounded-md" />
                <div className="h-3.5 w-24 bg-brand-cream/50 rounded-md" />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <div className="h-4 w-full max-w-md bg-brand-cream/60 rounded-md" />
                <div className="h-3.5 w-3/4 bg-brand-cream/40 rounded-md" />
              </div>
            </div>

            {/* Bottom row: Total Amount & Action buttons */}
            <div className="flex items-center justify-between border-t border-brand-beige/30 pt-3">
              <div className="h-5 w-24 bg-brand-cream/80 rounded-md" />
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-brand-cream/70 rounded-lg" />
                <div className="h-8 w-24 bg-brand-cream/70 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
