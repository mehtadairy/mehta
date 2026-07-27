"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { MapPin, Plus, Trash2, Edit, RefreshCw, X, Loader2, Info } from "lucide-react";
import { motion } from "framer-motion";

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
      <div className="border border-brand-beige/50 rounded-2xl bg-[#fbfbfb]/50 p-2">
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
          <motion.div 
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.05 } }
            }}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4"
          >
            {zones.map((zone) => {
              const pincodes = zone.pincodes || zone.pincode || "";
              const pincodeArray = pincodes.split(",").map((p: string) => p.trim()).filter(Boolean);
              
              return (
                <motion.div
                  key={zone.id}
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 150, damping: 20 } }
                  }}
                  whileHover={{ y: -5 }}
                  className="bg-white/80 backdrop-blur-md border border-brand-beige rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-brand-orange/40 transition-all duration-300 relative overflow-hidden group cursor-default"
                >
                  {/* Subtle map mesh graphic backdrop simulator */}
                  <div className="absolute inset-0 bg-radial-gradient from-brand-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange flex items-center justify-center flex-shrink-0 group-hover:bg-brand-orange/20 group-hover:scale-105 transition-all duration-300">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="font-serif text-sm font-bold text-brand-charcoal truncate max-w-[140px]">
                          {zone.name || "Unnamed Zone"}
                        </h4>
                        <span className="text-[0.62rem] text-muted-foreground font-semibold uppercase tracking-wider">
                          ⏱️ ETA: {zone.estimated_days || "1-2 Days"}
                        </span>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(zone)}
                        className="h-7 w-7 rounded-lg border border-brand-beige bg-white hover:border-brand-gold flex items-center justify-center text-brand-charcoal hover:bg-brand-cream transition-colors cursor-pointer"
                        title="Edit zone"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(zone.id)}
                        className="h-7 w-7 rounded-lg border border-red-200 bg-white hover:border-red-500 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete zone"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Serviced Pincodes Grid Box */}
                  <div>
                    <span className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 font-sans">Served Regions:</span>
                    <div className="flex flex-wrap gap-1 max-h-[72px] overflow-y-auto pr-1 bg-brand-cream/10 border border-brand-beige/50 rounded-xl p-2.5">
                      {pincodeArray.map((pin: string, i: number) => (
                        <span key={i} className="bg-brand-cream text-brand-charcoal border border-brand-beige rounded px-2 py-0.5 text-[0.62rem] font-bold">
                          {pin}
                        </span>
                      ))}
                      {pincodeArray.length === 0 && (
                        <span className="text-[0.62rem] text-muted-foreground italic">No pincodes listed</span>
                      )}
                    </div>
                  </div>

                  {/* Card Pricing Footer */}
                  <div className="flex items-center justify-between border-t border-brand-beige/50 pt-3.5 mt-auto text-xs font-sans">
                    <div className="flex flex-col">
                      <span className="text-[0.6rem] text-muted-foreground uppercase leading-none mb-0.5">Shipping Fee</span>
                      <span className="font-bold text-brand-charcoal">
                        {zone.delivery_charge === 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-bold uppercase text-[0.62rem]">Free</span>
                        ) : (
                          `₹${zone.delivery_charge}`
                        )}
                      </span>
                    </div>

                    {zone.free_delivery_above && (
                      <div className="flex flex-col text-right">
                        <span className="text-[0.6rem] text-muted-foreground uppercase leading-none mb-0.5">Free Shipping Above</span>
                        <span className="font-bold text-brand-orange">₹{zone.free_delivery_above}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
