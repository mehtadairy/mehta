"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { MapPin, Plus, Trash2, Edit, RefreshCw, X, Loader2, Info } from "lucide-react";

export default function AdminDeliveryZones() {
  const [zones, setZones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<any | null>(null);

  // Form States
  const [zoneName, setZoneName] = useState("");
  const [pincodeList, setPincodeList] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [freeThreshold, setFreeThreshold] = useState("");
  const [deliveryEta, setDeliveryEta] = useState("1-2 Days");

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setZones(data || []);
    } catch (e) {
      console.error("Failed to fetch delivery zones:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (zone: any) => {
    setEditingZone(zone);
    setZoneName(zone.name || "");
    setPincodesFromField(zone.pincodes || zone.pincode || "");
    setDeliveryCharge(zone.delivery_charge?.toString() || "0");
    setFreeThreshold(zone.free_delivery_above?.toString() || "");
    setDeliveryEta(zone.estimated_days || "1-2 Days");
    setShowForm(true);
  };

  // Helper to ensure formatting
  const setPincodesFromField = (raw: string) => {
    setPincodeList(raw);
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm("Are you sure you want to delete this delivery zone?")) return;

    try {
      const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
      if (error) throw error;
      setZones(zones.filter((z) => z.id !== id));
    } catch (e) {
      console.error("Failed to delete zone:", e);
      alert("Error deleting zone");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName || !pincodeList) return;

    setIsSaving(true);
    try {
      // Format the pincodes: split by comma, trim, filter empty items
      const formattedPincodes = pincodeList
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .join(",");

      const payload = {
        name: zoneName,
        pincodes: formattedPincodes,
        pincode: formattedPincodes.split(",")[0] || "", // Backward compatibility fallback
        delivery_charge: Number(deliveryCharge) || 0,
        free_delivery_above: freeThreshold ? Number(freeThreshold) : null,
        estimated_days: deliveryEta,
      };

      if (editingZone) {
        // Update
        const { data, error } = await supabase
          .from("delivery_zones")
          .update(payload)
          .eq("id", editingZone.id)
          .select()
          .single();

        if (error) throw error;
        setZones(zones.map((z) => (z.id === editingZone.id ? data : z)));
      } else {
        // Create
        const { data, error } = await supabase
          .from("delivery_zones")
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        setZones([data, ...zones]);
      }

      // Reset Form
      setZoneName("");
      setPincodeList("");
      setDeliveryCharge("");
      setFreeThreshold("");
      setDeliveryEta("1-2 Days");
      setEditingZone(null);
      setShowForm(false);
    } catch (err: any) {
      console.error("Failed to save delivery zone:", err);
      alert(err.message || "Failed to save delivery zone.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-brand-beige pb-3">
        <h3 className="font-serif text-lg font-bold text-brand-charcoal flex items-center gap-2">
          <MapPin className="w-5 h-5 text-brand-orange" />
          Delivery Charge Zones
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchZones}
            className="text-xs text-brand-orange hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          {!showForm && (
            <button
              onClick={() => {
                setEditingZone(null);
                setZoneName("");
                setPincodeList("");
                setDeliveryCharge("0");
                setFreeThreshold("");
                setDeliveryEta("1-2 Days");
                setShowForm(true);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg px-3.5 py-1.8 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Delivery Zone
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-brand-cream/35 border border-brand-beige rounded-2xl p-5 flex flex-col gap-4 animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-brand-beige pb-2">
            <h4 className="font-serif text-sm font-bold text-brand-charcoal">
              {editingZone ? `Edit Zone: ${editingZone.name}` : "Create Delivery Zone"}
            </h4>
            <button
              onClick={() => setShowForm(false)}
              className="p-1 hover:bg-brand-cream rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">
                  Zone Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ahmedabad Central, Outer Gujarat"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">
                  Estimated Delivery ETA *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Same Day, 1-2 Days, 3-5 Days"
                  value={deliveryEta}
                  onChange={(e) => setDeliveryEta(e.target.value)}
                  className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase flex items-center gap-1">
                Serviced Pincodes *
                <span className="text-[0.6rem] text-muted-foreground font-normal normal-case">
                  (Enter comma-separated pincodes)
                </span>
              </label>
              <textarea
                placeholder="e.g. 380015, 380009, 380013, 380054"
                value={pincodeList}
                onChange={(e) => setPincodeList(e.target.value)}
                className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange min-h-[80px]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-brand-beige pt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">
                  Delivery Charge (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">
                  Free Delivery Threshold (₹)
                  <span className="text-[0.6rem] text-muted-foreground font-normal normal-case ml-1">
                    (Optional)
                  </span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1000 (Free delivery above this order amount)"
                  value={freeThreshold}
                  onChange={(e) => setFreeThreshold(e.target.value)}
                  className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-2 border-t border-brand-beige pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-brand-beige rounded-lg text-xs font-bold text-brand-charcoal hover:bg-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingZone ? "Save Changes" : "Create Zone"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-brand-beige rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
            Loading delivery zones...
          </div>
        ) : zones.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <Info className="w-8 h-8 text-brand-beige" />
            No delivery zones configured yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-brand-cream text-brand-charcoal text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">Zone Details</th>
                  <th className="px-6 py-3 font-semibold">Serviced Pincodes</th>
                  <th className="px-6 py-3 font-semibold">Delivery Fee</th>
                  <th className="px-6 py-3 font-semibold">Free Delivery Above</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige text-xs">
                {zones.map((zone) => {
                  const pincodes = zone.pincodes || zone.pincode || "";
                  const pincodeArray = pincodes.split(",").map((p: string) => p.trim()).filter(Boolean);
                  
                  return (
                    <tr key={zone.id} className="hover:bg-brand-cream/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-brand-charcoal">{zone.name || "Unnamed Zone"}</span>
                          <span className="text-[0.65rem] text-muted-foreground mt-0.5">ETA: {zone.estimated_days || "1-2 Days"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex flex-wrap gap-1 max-h-[64px] overflow-y-auto pr-1">
                          {pincodeArray.map((pin: string, i: number) => (
                            <span key={i} className="bg-brand-cream text-brand-charcoal border border-brand-beige rounded-md px-1.5 py-0.5 text-[0.6rem] font-semibold">
                              {pin}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-brand-charcoal">
                        {zone.delivery_charge === 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold uppercase text-[0.62rem]">Free</span>
                        ) : (
                          `₹${zone.delivery_charge}`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-brand-charcoal">
                        {zone.free_delivery_above ? `₹${zone.free_delivery_above}` : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEditClick(zone)}
                            className="h-8 w-8 rounded-lg border border-brand-beige hover:border-brand-gold flex items-center justify-center text-brand-charcoal hover:bg-brand-cream transition-colors cursor-pointer"
                            title="Edit details"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(zone.id)}
                            className="h-8 w-8 rounded-lg border border-red-200 hover:border-red-500 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete zone"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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
    </div>
  );
}
