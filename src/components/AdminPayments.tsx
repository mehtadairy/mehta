"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { IndianRupee, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    successfulPayments: 0,
    failedPayments: 0
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setPayments(data);
      // Calculate basic stats
      let rev = 0;
      let success = 0;
      let fail = 0;
      data.forEach(p => {
        if (p.status === 'paid') {
          rev += Number(p.amount);
          success++;
        } else if (p.status === 'failed') {
          fail++;
        }
      });
      setStats({ totalRevenue: rev, successfulPayments: success, failedPayments: fail });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-brand-beige pb-3">
        <h3 className="font-serif text-lg font-bold text-brand-charcoal flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-brand-orange" />
          Payments & Analytics
        </h3>
        <button onClick={fetchPayments} className="text-xs text-brand-orange hover:underline font-semibold flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-brand-beige p-5 rounded-2xl shadow-sm flex flex-col justify-center items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Verified Revenue</span>
          <span className="font-serif text-3xl font-black text-brand-charcoal mt-2">₹{stats.totalRevenue.toLocaleString()}</span>
        </div>
        <div className="bg-green-50 border border-green-100 p-5 rounded-2xl shadow-sm flex flex-col justify-center items-center text-green-800">
          <span className="text-xs font-bold uppercase tracking-wider">Successful Payments</span>
          <span className="font-serif text-3xl font-black mt-2 flex items-center gap-2">
            <CheckCircle className="w-6 h-6" /> {stats.successfulPayments}
          </span>
        </div>
        <div className="bg-red-50 border border-red-100 p-5 rounded-2xl shadow-sm flex flex-col justify-center items-center text-red-800">
          <span className="text-xs font-bold uppercase tracking-wider">Failed / Abandoned</span>
          <span className="font-serif text-3xl font-black mt-2 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" /> {stats.failedPayments}
          </span>
        </div>
      </div>

      <div className="bg-white border border-brand-beige rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-beige bg-brand-cream/50">
          <h4 className="font-serif text-sm font-bold text-brand-charcoal">Recent Transactions</h4>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No payments recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-cream text-brand-charcoal text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">RZP Order ID</th>
                  <th className="px-6 py-3 font-semibold">Our Order ID</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige text-xs">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-cream/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-muted-foreground">
                      {p.razorpay_order_id || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-charcoal">
                      {p.order_id || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold">
                      ₹{p.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.status === 'paid' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Paid</span>
                      ) : p.status === 'failed' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
