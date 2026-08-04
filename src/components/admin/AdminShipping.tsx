"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Package,
  Search,
  RefreshCw,
  FileText,
  Download,
  Printer,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MapPin,
  Filter,
  Eye
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import * as XLSX from "xlsx";

type ShippingTab =
  | "ALL"
  | "WAITING"
  | "PACKED"
  | "PICKED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "DELAYED";

interface ShippingOrder {
  id: string;
  order_number: string;
  user_name: string;
  user_phone: string;
  user_email: string;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  shipment_status: string;
  shipping_provider_order_id?: number | string;
  shipment_id?: number | string;
  awb_number?: string;
  courier_name?: string;
  tracking_url?: string;
  shipping_label_url?: string;
  manifest_url?: string;
  delivery_eta?: string;
  created_at: string;
  shipping_address?: any;
}

function AdminShippingRulesCard() {
  const [gujaratRate, setGujaratRate] = useState<number>(20);
  const [outsideGujaratRate, setOutsideGujaratRate] = useState<number>(35);
  const [southIndiaRate, setSouthIndiaRate] = useState<number>(40);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase.from('shipping_settings').select('*').limit(1).maybeSingle();
        if (data) {
          if (data.gujarat_rate_per_500g !== undefined) setGujaratRate(Number(data.gujarat_rate_per_500g));
          if (data.outside_gujarat_rate_per_500g !== undefined) setOutsideGujaratRate(Number(data.outside_gujarat_rate_per_500g));
          if (data.south_india_rate_per_500g !== undefined) setSouthIndiaRate(Number(data.south_india_rate_per_500g));
        }
      } catch (err) {
        console.warn("Failed loading shipping settings:", err);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus({ type: '', message: '' });

    try {
      const payload = {
        gujarat_rate_per_500g: Number(gujaratRate),
        outside_gujarat_rate_per_500g: Number(outsideGujaratRate),
        south_india_rate_per_500g: Number(southIndiaRate),
        updated_at: new Date().toISOString()
      };

      const { data: existing } = await supabase.from('shipping_settings').select('id').limit(1).maybeSingle();

      let err;
      if (existing?.id) {
        const res = await supabase.from('shipping_settings').update(payload).eq('id', existing.id);
        err = res.error;
      } else {
        const res = await supabase.from('shipping_settings').insert([payload]);
        err = res.error;
      }

      if (err) throw err;

      setSaveStatus({ type: 'success', message: 'Shipping settings saved! All website checkout calculations updated immediately.' });
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: `Failed to save: ${err.message || 'Error updating settings'}` });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-[#EAE0D3] rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE0D3] pb-4">
        <div>
          <h2 className="font-serif font-bold text-lg text-brand-charcoal flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-orange" /> Admin Shipping Rules Configuration
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure price per started 500g slab (₹) for regions. Calculated automatically from total cart weight.
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 self-start sm:self-auto">
          Active Engine: Started 500g Slabs
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Gujarat */}
          <div className="bg-[#FAF6EE]/60 border border-[#EAE0D3] p-4 rounded-xl flex flex-col gap-1.5">
            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase tracking-wider flex items-center justify-between">
              <span>Gujarat Rate</span>
              <span className="text-[9px] text-brand-orange bg-white px-2 py-0.5 rounded border border-[#EAE0D3]">Per 500g Slab</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-brand-charcoal">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={gujaratRate}
                onChange={(e) => setGujaratRate(Number(e.target.value))}
                className="w-full bg-white border border-[#EAE0D3] rounded-lg py-2 pl-7 pr-3 text-xs font-bold text-brand-charcoal focus:outline-none focus:border-brand-orange"
                required
              />
            </div>
            <span className="text-[0.62rem] text-muted-foreground">e.g. 180g=₹{gujaratRate}, 500g=₹{gujaratRate}, 501g=₹{gujaratRate * 2}</span>
          </div>

          {/* Outside Gujarat */}
          <div className="bg-[#FAF6EE]/60 border border-[#EAE0D3] p-4 rounded-xl flex flex-col gap-1.5">
            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase tracking-wider flex items-center justify-between">
              <span>Outside Gujarat Rate</span>
              <span className="text-[9px] text-brand-orange bg-white px-2 py-0.5 rounded border border-[#EAE0D3]">Per 500g Slab</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-brand-charcoal">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={outsideGujaratRate}
                onChange={(e) => setOutsideGujaratRate(Number(e.target.value))}
                className="w-full bg-white border border-[#EAE0D3] rounded-lg py-2 pl-7 pr-3 text-xs font-bold text-brand-charcoal focus:outline-none focus:border-brand-orange"
                required
              />
            </div>
            <span className="text-[0.62rem] text-muted-foreground">e.g. 180g=₹{outsideGujaratRate}, 500g=₹{outsideGujaratRate}, 501g=₹{outsideGujaratRate * 2}</span>
          </div>

          {/* South India */}
          <div className="bg-[#FAF6EE]/60 border border-[#EAE0D3] p-4 rounded-xl flex flex-col gap-1.5">
            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase tracking-wider flex items-center justify-between">
              <span>South India Rate</span>
              <span className="text-[9px] text-brand-orange bg-white px-2 py-0.5 rounded border border-[#EAE0D3]">Per 500g Slab</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-brand-charcoal">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={southIndiaRate}
                onChange={(e) => setSouthIndiaRate(Number(e.target.value))}
                className="w-full bg-white border border-[#EAE0D3] rounded-lg py-2 pl-7 pr-3 text-xs font-bold text-brand-charcoal focus:outline-none focus:border-brand-orange"
                required
              />
            </div>
            <span className="text-[0.62rem] text-muted-foreground">KA, KL, TN, AP, TS, PY</span>
          </div>
        </div>

        {saveStatus.message && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            saveStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {saveStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
            <span>{saveStatus.message}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-brand-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Saving Settings..." : "Save Shipping Rates"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminShipping() {
  const [activeTab, setActiveTab] = useState<ShippingTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<ShippingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<ShippingOrder | null>(null);

  const fetchShippingOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error("Error fetching shipping orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingOrders();
  }, []);

  const handleRetryShipment = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch("/api/shipping/create-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Shipment created successfully! AWB: ${data.awbNumber || "Generated"}`);
        fetchShippingOrders();
      } else {
        alert(`Failed to create shipment: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`Error creating shipment: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelShipment = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this shipment?")) return;
    setActionLoadingId(orderId);
    try {
      const res = await fetch("/api/shipping/cancel-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason: "Cancelled by Admin" })
      });
      const data = await res.json();
      if (data.success) {
        alert("Shipment cancelled successfully.");
        fetchShippingOrders();
      } else {
        alert(`Cancellation error: ${data.error || "Failed"}`);
      }
    } catch (err: any) {
      alert(`Error cancelling shipment: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (o.order_number || "").toLowerCase().includes(query) ||
      (o.awb_number || "").toLowerCase().includes(query) ||
      (o.user_name || "").toLowerCase().includes(query) ||
      (o.user_phone || "").toLowerCase().includes(query);

    if (!matchesSearch) return false;

    const status = (o.shipment_status || o.status || "").toLowerCase();

    switch (activeTab) {
      case "WAITING":
        return !o.awb_number || status.includes("pending") || status.includes("confirmed") || status.includes("waiting");
      case "PACKED":
        return status.includes("packed") || status.includes("preparing");
      case "PICKED":
        return status.includes("picked") || status.includes("pickup");
      case "IN_TRANSIT":
        return status.includes("transit") || status.includes("out for delivery") || status.includes("shipped");
      case "DELIVERED":
        return status.includes("delivered");
      case "CANCELLED":
        return status.includes("cancel");
      case "RETURNED":
        return status.includes("return") || status.includes("rto");
      case "DELAYED":
        return status.includes("failed") || status.includes("delay") || status.includes("ndr");
      default:
        return true;
    }
  });

  const exportToCSV = () => {
    const exportData = filteredOrders.map((o) => ({
      "Order Number": o.order_number,
      Customer: o.user_name,
      Phone: o.user_phone,
      AWB: o.awb_number || "N/A",
      Courier: o.courier_name || "N/A",
      "Shipment Status": o.shipment_status || o.status,
      "ETA": o.delivery_eta || "N/A",
      "Total Amount": o.total,
      Date: new Date(o.created_at).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shipping");
    XLSX.writeFile(workbook, `Shipping_Orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-[#EAE0D3] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-brand-orange" />
            <h1 className="text-2xl font-serif font-bold text-brand-charcoal">Automated Logistics</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Real-time shipment creation, AWB generation, manifest printing & live tracking.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchShippingOrders}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-brand-charcoal text-xs font-bold rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* --- ADMIN SHIPPING RULES CONFIGURATION CARD --- */}
      <AdminShippingRulesCard />

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "ALL", label: "All Orders" },
          { id: "WAITING", label: "Waiting Shipment" },
          { id: "PACKED", label: "Packed" },
          { id: "PICKED", label: "Picked Up" },
          { id: "IN_TRANSIT", label: "In Transit" },
          { id: "DELIVERED", label: "Delivered" },
          { id: "CANCELLED", label: "Cancelled" },
          { id: "RETURNED", label: "Returned" },
          { id: "DELAYED", label: "Delayed/NDR" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ShippingTab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-brand-charcoal text-white shadow-sm"
                : "bg-white text-muted-foreground border border-[#EAE0D3] hover:border-brand-orange"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Toolbar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Order #, AWB #, Customer Name, Phone..."
          className="w-full bg-white border border-[#EAE0D3] rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-brand-orange"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#EAE0D3] rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-orange" />
            Loading Shipping Orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No shipping orders found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6EE] border-b border-[#EAE0D3] text-brand-charcoal font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Courier & AWB</th>
                  <th className="p-4">ETA</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE0D3]">
                {filteredOrders.map((order) => {
                  const isPending = !order.awb_number;
                  const isActioning = actionLoadingId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-[#FAF6EE]/50 transition-colors">
                      <td className="p-4 font-bold text-brand-charcoal">
                        {order.order_number || order.id.slice(0, 8)}
                        <div className="text-[0.65rem] font-normal text-muted-foreground mt-0.5">
                          ₹{order.total} • {order.payment_method}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-brand-charcoal">{order.user_name || "Customer"}</div>
                        <div className="text-[0.65rem] text-muted-foreground">{order.user_phone}</div>
                      </td>

                      <td className="p-4">
                        {order.awb_number ? (
                          <div>
                            <div className="font-bold text-brand-orange">{order.awb_number}</div>
                            <div className="text-[0.65rem] text-muted-foreground">{order.courier_name || "Delhivery"}</div>
                          </div>
                        ) : (
                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[0.65rem] font-bold">Unassigned</span>
                        )}
                      </td>

                      <td className="p-4 text-muted-foreground font-medium">
                        {order.delivery_eta || "1-3 Days"}
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.65rem] font-bold uppercase ${
                          (order.shipment_status || order.status || '').toLowerCase().includes('delivered')
                            ? 'bg-emerald-100 text-emerald-800'
                            : (order.shipment_status || order.status || '').toLowerCase().includes('cancel')
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.shipment_status || order.status || 'Processing'}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending ? (
                            <button
                              disabled={isActioning}
                              onClick={() => handleRetryShipment(order.id)}
                              className="bg-brand-orange hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-bold text-[0.65rem] transition-colors"
                            >
                              {isActioning ? "Creating..." : "Create Shipment"}
                            </button>
                          ) : (
                            <>
                              <a
                                href={`/api/shipping/label?orderId=${order.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-brand-charcoal rounded-lg transition-colors"
                                title="View Shipping Label"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={`/api/shipping/manifest?orderId=${order.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-brand-charcoal rounded-lg transition-colors"
                                title="Download Manifest"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={() => setTrackingModalOrder(order)}
                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Track Shipment"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={isActioning}
                                onClick={() => handleCancelShipment(order.id)}
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Cancel Shipment"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tracking Modal */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-[#EAE0D3] space-y-4">
            <div className="flex justify-between items-center border-b border-[#EAE0D3] pb-3">
              <h3 className="font-serif font-bold text-lg text-brand-charcoal">
                Shipment Track - {trackingModalOrder.order_number}
              </h3>
              <button onClick={() => setTrackingModalOrder(null)} className="text-gray-400 hover:text-black font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#FAF6EE] p-3 rounded-xl">
                <span className="text-muted-foreground">AWB Number: </span>
                <strong className="text-brand-orange">{trackingModalOrder.awb_number || "N/A"}</strong>
              </div>
              <div className="bg-[#FAF6EE] p-3 rounded-xl">
                <span className="text-muted-foreground">Courier Partner: </span>
                <strong className="text-brand-charcoal">{trackingModalOrder.courier_name || "Delhivery"}</strong>
              </div>
              <div className="bg-[#FAF6EE] p-3 rounded-xl">
                <span className="text-muted-foreground">Estimated Delivery: </span>
                <strong className="text-emerald-700">{trackingModalOrder.delivery_eta || "2-4 Days"}</strong>
              </div>
              <div className="bg-[#FAF6EE] p-3 rounded-xl">
                <span className="text-muted-foreground">Current Status: </span>
                <strong className="text-blue-700 uppercase">{trackingModalOrder.shipment_status || trackingModalOrder.status}</strong>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <a
                href={trackingModalOrder.tracking_url || `https://tracking.com/${trackingModalOrder.awb_number}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-center flex items-center justify-center gap-2 text-xs"
              >
                Open Live Tracking Link <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
