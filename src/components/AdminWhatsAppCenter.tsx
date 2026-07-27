"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash, Play, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminWhatsAppCenter() {
  const [activeSubTab, setActiveSubTab] = useState<"templates" | "logs" | "campaigns">("templates");
  const [templates, setTemplates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const fetchData = async () => {
    setLoading(true);
    if (activeSubTab === "templates") {
      const { data } = await supabase.from("whatsapp_templates").select("*").order("event_name", { ascending: true });
      setTemplates(data || []);
    } else if (activeSubTab === "logs") {
      const { data } = await supabase.from("notification_logs").select("*").order("created_at", { ascending: false }).limit(100);
      setLogs(data || []);
    }
    setLoading(false);
  };

  const handleRetry = async (log: any) => {
    try {
      await fetch('/api/cron/retry-whatsapp', { headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}` } });
      alert("Retry task triggered in background");
      fetchData();
    } catch (e) {
      alert("Failed to trigger retry.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-cream/30 rounded-xl overflow-hidden border border-brand-beige">
      {/* WhatsApp Center Header */}
      <div className="bg-white border-b border-brand-beige px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-brand-charcoal uppercase tracking-wider">WhatsApp Center</h2>
          <p className="text-xs text-muted-foreground font-semibold mt-1">Manage templates, logs, and marketing campaigns</p>
        </div>
        <div className="flex bg-brand-cream border border-brand-beige rounded-lg p-1">
          <button
            onClick={() => setActiveSubTab("templates")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${activeSubTab === "templates" ? "bg-white text-brand-orange shadow-sm border border-brand-beige" : "text-brand-charcoal/60 hover:text-brand-charcoal"}`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveSubTab("logs")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${activeSubTab === "logs" ? "bg-white text-brand-orange shadow-sm border border-brand-beige" : "text-brand-charcoal/60 hover:text-brand-charcoal"}`}
          >
            Logs & Queue
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-sm font-bold text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <>
            {activeSubTab === "templates" && (
              <div className="bg-white rounded-xl border border-brand-beige overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-brand-cream/50 text-brand-charcoal uppercase font-black border-b border-brand-beige">
                      <th className="py-2.5 px-4">Event Name</th>
                      <th className="py-2.5 px-4">AiSensy Template Name</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4 text-center">Active</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map(t => (
                      <tr key={t.id} className="border-b border-brand-beige/50">
                        <td className="py-3 px-4 font-bold text-brand-charcoal">{t.event_name}</td>
                        <td className="py-3 px-4 font-semibold text-brand-orange">{t.aisensy_name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{t.description}</td>
                        <td className="py-3 px-4 text-center">
                          {t.is_active ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> : <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto" />}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button className="h-8 w-8 rounded-lg border border-brand-beige hover:border-brand-gold inline-flex items-center justify-center text-brand-charcoal hover:bg-brand-cream transition-colors">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {templates.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground font-semibold">No templates found. Please run the SQL schema script.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeSubTab === "logs" && (
              <div className="bg-white rounded-xl border border-brand-beige overflow-hidden">
                <div className="p-4 border-b border-brand-beige flex justify-between items-center bg-brand-cream/20">
                  <h3 className="font-bold text-sm uppercase">Recent Notifications</h3>
                  <button onClick={() => handleRetry(null)} className="px-3 py-1.5 bg-brand-orange text-white text-xs font-bold rounded hover:bg-brand-orange/90 transition-colors inline-flex items-center gap-1.5">
                    <Play className="h-3 w-3" /> Retry Failed
                  </button>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-brand-cream/50 text-brand-charcoal uppercase font-black border-b border-brand-beige">
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Phone</th>
                      <th className="py-2.5 px-4">Event</th>
                      <th className="py-2.5 px-4">Template</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="border-b border-brand-beige/50">
                        <td className="py-3 px-4">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="py-3 px-4 font-semibold">{log.phone}</td>
                        <td className="py-3 px-4">{log.event_name}</td>
                        <td className="py-3 px-4 text-brand-orange">{log.template_name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase ${
                            log.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            log.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                            log.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-red-500 font-semibold truncate max-w-[150px]" title={log.error_message}>
                          {log.error_message || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
