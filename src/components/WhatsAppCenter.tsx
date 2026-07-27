"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { MessageCircle, Send, BarChart2, Users, RefreshCw } from "lucide-react";

export default function WhatsAppCenter() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ sent: 0, delivered: 0, failed: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('whatsapp_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) {
      setLogs(data);
      // Calculate simple stats
      let sent = 0, delivered = 0, failed = 0;
      data.forEach(l => {
        if (l.status === 'sent' || l.status === 'received') sent++;
        if (l.status === 'delivered') delivered++;
        if (l.status === 'failed') failed++;
      });
      setStats({ sent, delivered, failed });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center border-b border-brand-beige pb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-500" />
          <h3 className="font-serif text-lg font-bold text-brand-charcoal">
            WhatsApp Center
          </h3>
        </div>
        <button 
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:underline"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-brand-cream/35 border border-brand-beige rounded-xl p-4 flex flex-col gap-1">
          <span className="text-[0.68rem] font-bold text-muted-foreground uppercase tracking-wider">Messages Sent</span>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-500" />
            <span className="text-2xl font-black text-brand-charcoal">{stats.sent}</span>
          </div>
        </div>
        <div className="bg-brand-cream/35 border border-brand-beige rounded-xl p-4 flex flex-col gap-1">
          <span className="text-[0.68rem] font-bold text-muted-foreground uppercase tracking-wider">Delivered</span>
          <div className="flex items-center gap-2">
            <CheckDouble className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-black text-brand-charcoal">{stats.delivered}</span>
          </div>
        </div>
        <div className="bg-brand-cream/35 border border-brand-beige rounded-xl p-4 flex flex-col gap-1">
          <span className="text-[0.68rem] font-bold text-muted-foreground uppercase tracking-wider">Failed</span>
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-red-500" />
            <span className="text-2xl font-black text-brand-charcoal">{stats.failed}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-brand-beige overflow-hidden">
        <div className="p-4 border-b border-brand-beige bg-brand-cream/35 flex justify-between items-center">
          <h4 className="font-bold text-sm text-brand-charcoal">Recent Communications</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-beige bg-gray-50/50">
                <th className="py-3 px-4 text-[0.68rem] font-bold text-brand-charcoal uppercase tracking-wider">Time</th>
                <th className="py-3 px-4 text-[0.68rem] font-bold text-brand-charcoal uppercase tracking-wider">Phone</th>
                <th className="py-3 px-4 text-[0.68rem] font-bold text-brand-charcoal uppercase tracking-wider">Direction</th>
                <th className="py-3 px-4 text-[0.68rem] font-bold text-brand-charcoal uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-[0.68rem] font-bold text-brand-charcoal uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-brand-beige/50 hover:bg-brand-cream/20 transition-colors">
                  <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs font-semibold">{log.phone}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${log.direction === 'inbound' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {log.direction}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold">{log.message_type}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${
                      log.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                      log.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                    No logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CheckDouble(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 7 17l-5-5" />
      <path d="m22 10-7.5 7.5L13 16" />
    </svg>
  )
}
