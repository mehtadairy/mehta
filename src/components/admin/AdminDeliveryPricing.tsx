"use client";

import React, { useState, useEffect } from "react";
import { Package, CheckCircle2, AlertCircle, MapPin, Save, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDeliveryPricing() {
  const [gujaratRate, setGujaratRate] = useState<number>(40);
  const [outsideGujaratRate, setOutsideGujaratRate] = useState<number>(70);
  const [southIndiaRate, setSouthIndiaRate] = useState<number>(80);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('shipping_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (data) {
          if (data.gujarat_rate_per_kg !== undefined && data.gujarat_rate_per_kg !== null) {
            setGujaratRate(Number(data.gujarat_rate_per_kg));
          } else if (data.gujarat_rate_per_500g) {
            setGujaratRate(Number(data.gujarat_rate_per_500g) * 2);
          }

          if (data.outside_gujarat_rate_per_kg !== undefined && data.outside_gujarat_rate_per_kg !== null) {
            setOutsideGujaratRate(Number(data.outside_gujarat_rate_per_kg));
          } else if (data.outside_gujarat_rate_per_500g) {
            setOutsideGujaratRate(Number(data.outside_gujarat_rate_per_500g) * 2);
          }

          if (data.south_india_rate_per_kg !== undefined && data.south_india_rate_per_kg !== null) {
            setSouthIndiaRate(Number(data.south_india_rate_per_kg));
          } else if (data.south_india_rate_per_500g) {
            setSouthIndiaRate(Number(data.south_india_rate_per_500g) * 2);
          }
        }
      } catch (err) {
        console.warn("Failed loading delivery pricing settings:", err);
      } finally {
        setIsLoading(false);
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
        gujarat_rate_per_kg: Number(gujaratRate),
        outside_gujarat_rate_per_kg: Number(outsideGujaratRate),
        south_india_rate_per_kg: Number(southIndiaRate),
        // Maintain per 500g column backwards compatibility
        gujarat_rate_per_500g: Math.round(Number(gujaratRate) / 2),
        outside_gujarat_rate_per_500g: Math.round(Number(outsideGujaratRate) / 2),
        south_india_rate_per_500g: Math.round(Number(southIndiaRate) / 2),
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

      setSaveStatus({
        type: 'success',
        message: 'Delivery pricing configuration saved successfully! All checkout calculations updated immediately.'
      });
    } catch (err: any) {
      setSaveStatus({
        type: 'error',
        message: `Failed to save delivery pricing: ${err.message || 'Error updating settings'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#EAE0D3] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-orange/10 rounded-xl text-brand-orange">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-brand-charcoal">Delivery Pricing</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure delivery charges based on weight and destination.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground bg-white border border-[#EAE0D3] rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-orange" />
          Loading Delivery Pricing Settings...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* GUJARAT */}
            <div className="bg-white border border-[#EAE0D3] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-brand-orange/50 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#EAE0D3] pb-3">
                  <span className="text-xs font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" /> GUJARAT
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    State Rate
                  </span>
                </div>
                <p className="text-[0.72rem] text-muted-foreground">
                  Applies to all Gujarat pincodes and addresses.
                </p>

                <div className="pt-2">
                  <label className="text-[0.7rem] font-bold text-brand-charcoal uppercase tracking-wider block mb-1">
                    Price Per KG (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-brand-charcoal">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={gujaratRate}
                      onChange={(e) => setGujaratRate(Number(e.target.value))}
                      className="w-full bg-[#FAF6EE] border border-[#EAE0D3] rounded-xl py-2.5 pl-8 pr-3 text-sm font-bold text-brand-charcoal focus:outline-none focus:border-brand-orange focus:bg-white"
                      placeholder="40"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EAE0D3]/60 text-[0.68rem] text-muted-foreground">
                Charged per started KG slab (e.g. 0.18kg = 1kg = ₹{gujaratRate}, 1.25kg = 2kg = ₹{gujaratRate * 2}).
              </div>
            </div>

            {/* OUTSIDE GUJARAT */}
            <div className="bg-white border border-[#EAE0D3] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-brand-orange/50 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#EAE0D3] pb-3">
                  <span className="text-xs font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600" /> OUTSIDE GUJARAT
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Rest of India
                  </span>
                </div>
                <p className="text-[0.72rem] text-muted-foreground">
                  Applies to all other Indian states except Gujarat and South India.
                </p>

                <div className="pt-2">
                  <label className="text-[0.7rem] font-bold text-brand-charcoal uppercase tracking-wider block mb-1">
                    Price Per KG (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-brand-charcoal">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={outsideGujaratRate}
                      onChange={(e) => setOutsideGujaratRate(Number(e.target.value))}
                      className="w-full bg-[#FAF6EE] border border-[#EAE0D3] rounded-xl py-2.5 pl-8 pr-3 text-sm font-bold text-brand-charcoal focus:outline-none focus:border-brand-orange focus:bg-white"
                      placeholder="70"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EAE0D3]/60 text-[0.68rem] text-muted-foreground">
                Charged per started KG slab (e.g. 0.75kg = 1kg = ₹{outsideGujaratRate}, 1.2kg = 2kg = ₹{outsideGujaratRate * 2}).
              </div>
            </div>

            {/* SOUTH INDIA */}
            <div className="bg-white border border-[#EAE0D3] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-brand-orange/50 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#EAE0D3] pb-3">
                  <span className="text-xs font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-purple-600" /> SOUTH INDIA
                  </span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    South Zone
                  </span>
                </div>

                <div className="text-[0.7rem] text-muted-foreground">
                  <span className="font-semibold text-brand-charcoal">South states:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana", "Puducherry"].map((st) => (
                      <span key={st} className="bg-[#FAF6EE] border border-[#EAE0D3] text-brand-charcoal text-[0.62rem] px-2 py-0.5 rounded font-medium">
                        {st}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <label className="text-[0.7rem] font-bold text-brand-charcoal uppercase tracking-wider block mb-1">
                    Price Per KG (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-brand-charcoal">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={southIndiaRate}
                      onChange={(e) => setSouthIndiaRate(Number(e.target.value))}
                      className="w-full bg-[#FAF6EE] border border-[#EAE0D3] rounded-xl py-2.5 pl-8 pr-3 text-sm font-bold text-brand-charcoal focus:outline-none focus:border-brand-orange focus:bg-white"
                      placeholder="80"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EAE0D3]/60 text-[0.68rem] text-muted-foreground">
                Charged per started KG slab (e.g. 2.5kg = 3kg = ₹{southIndiaRate * 3}).
              </div>
            </div>
          </div>

          {/* Status Message */}
          {saveStatus.message && (
            <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
              saveStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {saveStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <span>{saveStatus.message}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-brand-orange hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Rates...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Delivery Rates
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
