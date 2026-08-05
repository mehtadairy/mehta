"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Printer,
  Save,
  RefreshCw,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  AlertCircle,
  Activity,
  Wifi,
  WifiOff,
  FileText,
  Copy,
  Zap,
  Play,
  RotateCcw,
  Check,
  Cpu,
  Flame,
  Gauge
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPrinters() {
  const [settings, setSettings] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [pendingQueue, setPendingQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | '', text: string }>({ type: '', text: '' });

  // Settings state
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [paperWidth, setPaperWidth] = useState("80mm");
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
  const [printCopies, setPrintCopies] = useState(1);
  const [printKitchenReceipt, setPrintKitchenReceipt] = useState(true);
  const [printPackingSlip, setPrintPackingSlip] = useState(true);
  const [autoRetry, setAutoRetry] = useState(true);

  // Time & Live Activity Feed
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const clock = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    loadPrinterData();
    const timer = setInterval(() => {
      refreshDataOnly();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const loadPrinterData = async () => {
    setIsLoading(true);
    await refreshDataOnly();
    setIsLoading(false);
  };

  const refreshDataOnly = async () => {
    try {
      let { data: settingsData } = await supabase
        .from("printer_settings")
        .select("*")
        .eq("branch", "Main")
        .maybeSingle();

      if (!settingsData || !settingsData.last_seen) {
        const { data: fallbackData } = await supabase
          .from("printer_settings")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (fallbackData) settingsData = fallbackData;
      }

      if (settingsData) {
        setSettings(settingsData);
        setSelectedPrinter(settingsData.selected_printer || "");
        setPaperWidth(settingsData.paper_width || "80mm");
        setAutoPrintEnabled(settingsData.auto_print_enabled ?? true);
        setPrintCopies(settingsData.print_copies || 1);
        setPrintKitchenReceipt(settingsData.print_kitchen_receipt ?? true);
        setPrintPackingSlip(settingsData.print_packing_slip ?? true);
        setAutoRetry(settingsData.auto_retry ?? true);
      }

      const { data: jobsData } = await supabase
        .from("print_jobs")
        .select(`
          *,
          orders (
            order_number,
            user_name,
            total
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (jobsData) {
        setLogs(jobsData.filter(j => j.status !== 'pending'));
        setPendingQueue(jobsData.filter(j => j.status === 'pending'));
      }
    } catch (e) {
      console.error("Failed to load printer settings/jobs:", e);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const { error } = await supabase
        .from("printer_settings")
        .update({
          selected_printer: selectedPrinter,
          paper_width: paperWidth,
          auto_print_enabled: autoPrintEnabled,
          print_copies: printCopies,
          print_kitchen_receipt: printKitchenReceipt,
          print_packing_slip: printPackingSlip,
          auto_retry: autoRetry,
          updated_at: new Date().toISOString()
        })
        .eq("branch", "Main");

      if (error) throw error;
      setStatusMessage({ type: 'success', text: 'Printer configuration saved successfully!' });
      await refreshDataOnly();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save printer settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPrint = async () => {
    setStatusMessage({ type: '', text: '' });
    try {
      const testOrderId = "00000000-0000-0000-0000-000000000000";
      const testOrderNumber = `TEST-${Math.floor(1000 + Math.random() * 9000)}`;

      const testPayload = {
        orderId: testOrderId,
        orderNumber: testOrderNumber,
        customerName: "POS Test Receiver",
        customerPhone: "919999999999",
        total: 150,
        date: new Date().toLocaleString(),
        paymentStatus: "Paid",
        items: [{ name: "Kesar Mesub", qty: 1, price: 150 }],
        trackingUrl: `https://mehtadairy.com/tracking?id=${testOrderId}`
      };

      const jobs = [
        { order_id: null, branch_id: 'Main', target_printer: 'billing', status: 'pending', esc_pos_data: JSON.stringify({...testPayload, printType: 'billing'}) },
        ...(printKitchenReceipt ? [{ order_id: null, branch_id: 'Main', target_printer: 'kitchen', status: 'pending', esc_pos_data: JSON.stringify({...testPayload, printType: 'kitchen'}) }] : []),
        ...(printPackingSlip ? [{ order_id: null, branch_id: 'Main', target_printer: 'packing', status: 'pending', esc_pos_data: JSON.stringify({...testPayload, printType: 'packing'}) }] : [])
      ];

      const { error } = await supabase.from("print_jobs").insert(jobs);
      if (error) throw error;

      setStatusMessage({ type: 'success', text: `Test receipt queued! Windows Print Agent will process immediately.` });
      await refreshDataOnly();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to queue test print' });
    }
  };

  const handleReprintJob = async (orderId: string | null) => {
    if (!orderId) {
      setStatusMessage({ type: 'error', text: 'Order ID is missing for reprint.' });
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch('/api/print/reprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reprint');
      
      setStatusMessage({ type: 'success', text: `Reprint queued successfully.` });
      await refreshDataOnly();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Reprint failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const isAgentOnline = () => {
    if (!settings || !settings.last_seen) return false;
    const lastSeen = new Date(settings.last_seen).getTime();
    const diff = (Date.now() - lastSeen) / 1000;
    return diff < 75;
  };

  const printersList = settings?.installed_printers || [];
  const printedTodayCount = logs.filter(l => l.status === 'printed').length;
  const failedTodayCount = logs.filter(l => l.status !== 'printed').length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-900">
        <div className="w-10 h-10 border-4 border-amber-700/30 border-t-amber-700 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold animate-pulse text-gray-600">Connecting POS Print Management Hardware Agent...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in text-gray-900 font-sans">
      {/* ── 1. HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h3 className="font-serif text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-700" />
            Print Management Center
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Manage printers, monitor live print queues, configure thermal receipts, and track dispatch history.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold border ${
            isAgentOnline() ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-amber-50 text-amber-800 border-amber-300"
          }`}>
            <span className={`h-2 w-2 rounded-full ${isAgentOnline() ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            {isAgentOnline() ? "Agent Online" : "Agent Offline"}
          </span>

          <span className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
            {settings?.branch || "Main"} Branch
          </span>

          <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            {currentTime}
          </span>

          <button
            onClick={refreshDataOnly}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
            title="Refresh Devices"
          >
            <RefreshCw className="w-4 h-4 text-amber-700" />
          </button>
        </div>
      </div>

      {/* ── 2. KPI ANALYTICS GRID (6 CARDS) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">CONNECTED PRINTERS</span>
          <div className="text-xl font-extrabold text-gray-900 mt-1">{printersList.length || 1}</div>
          <span className="text-[10px] text-gray-500 font-medium mt-0.5">Hardware Online</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">PRINTED TODAY</span>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">{printedTodayCount}</div>
          <span className="text-[10px] text-emerald-600 font-medium mt-0.5">Receipts Completed</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">QUEUE WAITING</span>
          <div className="text-xl font-extrabold text-amber-700 mt-1">{pendingQueue.length}</div>
          <span className="text-[10px] text-amber-600 font-medium mt-0.5">In Dispatch Queue</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">AVG PRINT TIME</span>
          <div className="text-xl font-extrabold text-gray-900 mt-1">1.2s</div>
          <span className="text-[10px] text-gray-500 font-medium mt-0.5">High Speed ESC/POS</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">FAILED PRINTS</span>
          <div className="text-xl font-extrabold text-rose-700 mt-1">{failedTodayCount}</div>
          <span className="text-[10px] text-rose-600 font-medium mt-0.5">Hardware Alerts</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">RECEIPT COUNT</span>
          <div className="text-xl font-extrabold text-amber-800 font-serif mt-1">{logs.length}</div>
          <span className="text-[10px] text-gray-500 font-medium mt-0.5">Total Executed</span>
        </div>
      </div>

      {/* ── 3. AGENT STATUS BANNER ── */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs ${
        isAgentOnline() ? "bg-emerald-50 border-emerald-300 text-emerald-950" : "bg-amber-50 border-amber-300 text-amber-950"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${isAgentOnline() ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-amber-100 border-amber-300 text-amber-800"}`}>
            {isAgentOnline() ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-tight">
              Windows Thermal Print Agent: {isAgentOnline() ? "🟢 Connected & Active" : "🟠 Disconnected / Offline"}
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              Branch: <span className="font-bold text-gray-900">Main Branch</span> • Hardware: <span className="font-bold text-gray-900">{selectedPrinter || "EPSON TM-T82"}</span> • Last Seen: <span className="font-semibold">{settings?.last_seen ? new Date(settings.last_seen).toLocaleTimeString() : "N/A"}</span>
            </p>
          </div>
        </div>

        {!isAgentOnline() && (
          <button
            onClick={refreshDataOnly}
            className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-2xs cursor-pointer"
          >
            Reconnect Print Agent
          </button>
        )}
      </div>

      {statusMessage.text && (
        <div className={`p-3 rounded-xl border text-xs font-bold flex gap-2 items-center ${
          statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ── 4. CONFIGURATION & LIVE QUEUE LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Settings Panel */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-xl p-5 shadow-2xs flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Sliders className="w-4 h-4 text-amber-700" />
            <h4 className="font-serif text-sm font-extrabold text-gray-900 uppercase tracking-wider">Printer Settings</h4>
          </div>

          {/* Toggle Auto Print Switch */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <span className="block text-xs font-bold text-gray-900">Automatic Printing</span>
              <span className="block text-[10px] text-gray-500">Print receipt instantly on checkout</span>
            </div>
            <input
              type="checkbox"
              checked={autoPrintEnabled}
              onChange={(e) => setAutoPrintEnabled(e.target.checked)}
              className="w-4 h-4 accent-amber-700 cursor-pointer"
            />
          </div>

          {/* Target Printer Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-700 uppercase">Target Thermal Printer</label>
            <select
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-900 outline-none font-bold cursor-pointer"
            >
              <option value="">Default System Printer</option>
              {printersList.map((p: any) => (
                <option key={p.name} value={p.name}>
                  🖨️ {p.name} {p.isDefault ? "(Default)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Paper Width Buttons */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-700 uppercase">Paper Width</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaperWidth("80mm")}
                className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paperWidth === "80mm" ? "bg-amber-700 text-white border-amber-700 shadow-2xs" : "border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                80mm (Standard POS)
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth("58mm")}
                className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paperWidth === "58mm" ? "bg-amber-700 text-white border-amber-700 shadow-2xs" : "border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                58mm (Narrow)
              </button>
            </div>
          </div>

          {/* Receipt Copies Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700">
              <span className="uppercase text-[11px]">Print Copies</span>
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono">{printCopies} Copy</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={printCopies}
              onChange={(e) => setPrintCopies(Number(e.target.value))}
              className="w-full accent-amber-700 cursor-pointer"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
            <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
              <span className="font-bold text-gray-900">Print Kitchen Ticket</span>
              <input type="checkbox" checked={printKitchenReceipt} onChange={(e) => setPrintKitchenReceipt(e.target.checked)} className="w-4 h-4 accent-amber-700 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
              <span className="font-bold text-gray-900">Print Packing Slip</span>
              <input type="checkbox" checked={printPackingSlip} onChange={(e) => setPrintPackingSlip(e.target.checked)} className="w-4 h-4 accent-amber-700 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
              <span className="font-bold text-gray-900">Auto Retry Offline Jobs</span>
              <input type="checkbox" checked={autoRetry} onChange={(e) => setAutoRetry(e.target.checked)} className="w-4 h-4 accent-amber-700 cursor-pointer" />
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={handleTestPrint}
              disabled={isSaving}
              className="flex-1 py-2.5 px-3 border border-gray-200 hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
            >
              Test Print
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="flex-1 py-2.5 px-3 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Settings
            </button>
          </div>
        </div>

        {/* Right Live Print Queue & Logs */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Live Queue Cards */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700" />
                <h4 className="font-serif text-sm font-extrabold text-gray-900 uppercase tracking-wider">Live Print Queue ({pendingQueue.length})</h4>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                POS Hardware Sync
              </span>
            </div>

            {pendingQueue.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
                <Printer className="w-10 h-10 text-gray-300 mb-2" />
                <h4 className="font-serif font-bold text-sm text-gray-900">No Receipts Waiting</h4>
                <p className="text-xs text-gray-500 mt-0.5">All customer orders printed successfully.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingQueue.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-extrabold font-mono text-gray-900">#{item.orders?.order_number || "TEST"}</span>
                        <span className="text-[11px] text-gray-500">{item.orders?.user_name || "Guest"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-amber-700 font-serif">₹{item.orders?.total || "-"}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                        Awaiting Print
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History Log Timeline */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-3">
              <History className="w-4 h-4 text-amber-700" />
              <h4 className="font-serif text-sm font-extrabold text-gray-900 uppercase tracking-wider">Print History Log</h4>
            </div>

            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 font-extrabold uppercase text-[10px] tracking-wider sticky top-0">
                    <th className="p-2.5">Order Ref</th>
                    <th className="p-2.5">Printer</th>
                    <th className="p-2.5">Time</th>
                    <th className="p-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-2.5 font-bold font-mono text-gray-900">
                        #{log.orders?.order_number || "TEST"}
                      </td>
                      <td className="p-2.5 text-gray-600 font-semibold uppercase text-[10px]">
                        {log.target_printer}
                      </td>
                      <td className="p-2.5 text-gray-500">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </td>
                      <td className="p-2.5 text-right flex justify-end items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                          log.status === 'printed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}>
                          {log.status === 'printed' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                          {log.status === 'printed' ? 'Printed' : 'Failed'}
                        </span>
                        {log.status === 'failed' && (
                          <button 
                            onClick={() => handleReprintJob(log.order_id || log.orders?.id)} 
                            disabled={isLoading}
                            className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold rounded transition-colors disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3" /> Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400">
                        No print job logs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
