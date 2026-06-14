"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Bell, CheckCircle, XCircle, Mail, MessageCircle, Clock } from "lucide-react";

export default function AdminNotifications() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('notification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) setLogs(data);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-brand-beige pb-3">
        <h3 className="font-serif text-lg font-bold text-brand-charcoal flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-orange" />
          Notifications Dashboard
        </h3>
        <button onClick={fetchLogs} className="text-xs text-brand-orange hover:underline font-semibold">
          Refresh Logs
        </button>
      </div>

      <div className="bg-white border border-brand-beige rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-beige bg-brand-cream/50">
          <h4 className="font-serif text-sm font-bold text-brand-charcoal">Recent Deliveries (Last 50)</h4>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No notifications sent yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-cream text-brand-charcoal text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold">Event</th>
                  <th className="px-6 py-3 font-semibold">Recipient</th>
                  <th className="px-6 py-3 font-semibold">Order ID</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-cream/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.type === 'email' ? (
                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                          <Mail className="w-4 h-4" /> Email
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <MessageCircle className="w-4 h-4" /> WhatsApp
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-charcoal">
                      {log.event_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {log.customer_email || log.customer_phone || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {log.order_id || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" /> Sent
                        </span>
                      ) : log.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" title={log.error_message}>
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
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
