"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Database, RefreshCw, AlertCircle, CheckCircle, RotateCcw } from "lucide-react";

export default function AdminRecovery({ initialData = [] }: { initialData?: any[] }) {
  const [recoveries, setRecoveries] = useState<any[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecoveries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_recovery')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (data) setRecoveries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    // Calling the cron endpoint manually, but for a specific ID we would need an endpoint.
    // Instead, we can just trigger the worker for all pending.
    try {
      alert("Triggering recovery worker...");
      const res = await fetch('/api/cron/payment-recovery');
      const data = await res.json();
      alert(`Processed: ${data.processed}`);
      fetchRecoveries();
    } catch(e) {
      alert("Failed to trigger worker");
    }
  };

  const handleManualRefund = async (id: string) => {
    if (!confirm("Are you sure you want to mark this as refunded? Make sure you actually refunded it in Razorpay dashboard!")) return;
    try {
      await supabase.from('payment_recovery').update({ status: 'refunded' }).eq('id', id);
      fetchRecoveries();
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-red-500" />
            Payment Recovery System
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Manage successful payments where order creation failed.
          </p>
        </div>
        <button
          onClick={fetchRecoveries}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recoveries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No failed payments found. All systems are healthy!
                  </td>
                </tr>
              ) : (
                recoveries.map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-gray-750/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {new Date(rec.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                      {rec.payment_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      ₹{rec.amount / 100}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rec.status === 'recovered' ? 'bg-green-100 text-green-800' :
                        rec.status === 'refunded' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {rec.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-red-500 max-w-xs truncate">
                      {rec.failure_reason}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {rec.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleRetry(rec.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                          >
                            Retry Worker
                          </button>
                          <button 
                            onClick={() => handleManualRefund(rec.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                          >
                            Mark Refunded
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
