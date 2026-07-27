"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Edit, Trash2, Check, X, UploadCloud, Loader2, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import imageCompression from "browser-image-compression";

export default function AdminBanners({ banners, setBanners }: { banners: any[], setBanners: any }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [link, setLink] = useState("");
  const [status, setStatus] = useState("active");
  const [imageUrl, setImageUrl] = useState("");
  const [isGraphicOnly, setIsGraphicOnly] = useState(true);
  const [badge, setBadge] = useState("");
  const [headline, setHeadline] = useState("");
  const [boldline, setBoldline] = useState("");
  const [sub, setSub] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const resetForm = () => {
    setLink("");
    setStatus("active");
    setImageUrl("");
    setIsGraphicOnly(true);
    setBadge("");
    setHeadline("");
    setBoldline("");
    setSub("");
    setCtaLabel("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: "image/webp" as any
      };
      const compressedFile = await imageCompression(file, options);

      const fileExt = "webp";
      const fileName = `banner-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { data, error } = await supabase.storage
        .from('products') // Storing in same bucket for simplicity
        .upload(filePath, compressedFile, { cacheControl: '3600', upsert: false, contentType: 'image/webp' });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(filePath);
      setImageUrl(publicUrlData.publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setUploadError("Image is required for banners.");
      return;
    }

    const newBanner = {
      link: link || null,
      active: status === "active",
      image_url: imageUrl,
      is_graphic_only: isGraphicOnly,
      badge: isGraphicOnly ? null : (badge || null),
      headline: isGraphicOnly ? null : (headline || null),
      boldline: isGraphicOnly ? null : (boldline || null),
      sub: isGraphicOnly ? null : (sub || null),
      cta_label: isGraphicOnly ? null : (ctaLabel || null)
    };

    if (editingId) {
      const { error } = await supabase.from('banners').update(newBanner).eq('id', editingId);
      if (!error) {
        setBanners(banners.map(b => b.id === editingId ? { ...b, ...newBanner } : b));
        resetForm();
      } else {
        alert("Error updating banner: " + error.message);
      }
    } else {
      const { data, error } = await supabase.from('banners').insert([newBanner]).select();
      if (!error && data) {
        setBanners([...banners, data[0]]);
        resetForm();
      } else {
        alert("Error creating banner: " + error?.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this banner?")) {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (!error) {
        setBanners(banners.filter(b => b.id !== id));
      } else {
        alert("Error deleting banner: " + error.message);
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between border-b border-brand-beige pb-4 mb-6">
        <h3 className="font-serif text-lg font-bold text-brand-charcoal">
          Homepage Banner Management
        </h3>
        <button 
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-brand-orange text-white px-4 py-2 text-xs font-bold rounded-lg shadow-sm hover:bg-brand-orange/90 flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 border border-brand-beige bg-brand-cream/10 rounded-xl p-6">
          <h4 className="font-bold text-brand-charcoal text-sm mb-4">
            {editingId ? "Edit Banner" : "New Banner"}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">Banner Image (File Upload or Paste Link)</label>
              <div className="flex flex-col gap-3">
                {imageUrl ? (
                  <div className="relative w-full h-40 rounded-lg border border-brand-beige overflow-hidden bg-brand-cream/10">
                    <img src={imageUrl} alt="Banner Preview" className="w-full h-full object-contain p-2 bg-brand-cream/40" />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow hover:bg-red-700 transition-colors z-10"
                      title="Remove Image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Option A: Upload File */}
                    <label className="cursor-pointer border border-dashed border-brand-beige bg-white rounded-lg px-4 py-6 text-xs text-center hover:bg-brand-cream/50 transition-colors flex flex-col items-center justify-center gap-1.5 min-h-[96px]">
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      {isUploading ? (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</div>
                      ) : (
                        <>
                          <UploadCloud className="w-6 h-6 text-[#D46D2D]" />
                          <span className="font-semibold text-brand-charcoal">Upload Image File</span>
                          <span className="text-[0.65rem] text-muted-foreground">Select webp, png, or jpg</span>
                        </>
                      )}
                    </label>

                    {/* Option B: Direct Image URL */}
                    <div className="border border-dashed border-brand-beige bg-white rounded-lg p-4 text-xs flex flex-col justify-center gap-2 min-h-[96px]">
                      <span className="font-semibold text-brand-charcoal">Or Paste Image URL Link</span>
                      <input
                        type="text"
                        placeholder="https://example.com/banner.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full border border-brand-beige rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
              {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">Banner Type</label>
              <select 
                value={isGraphicOnly ? "graphic" : "interactive"} 
                onChange={e => setIsGraphicOnly(e.target.value === "graphic")} 
                className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white"
              >
                <option value="graphic">Full-Width Graphic Banner (Image only)</option>
                <option value="interactive">Text + Product Image Layout (Interactive)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">Banner Redirect Link (Action Link URL)</label>
              <input 
                type="text" 
                value={link} 
                onChange={e => setLink(e.target.value)} 
                className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs" 
                placeholder="e.g. /shop or /product/kesar-penda" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {!isGraphicOnly && (
              <>
                <div className="md:col-span-2 border-t border-[#EAE0D3] my-2 pt-4">
                  <h5 className="text-xs font-bold text-[#D46D2D] uppercase tracking-wider mb-2">Text Overlay Fields</h5>
                  <p className="text-[11px] text-muted-foreground mb-4">Provide copy to overlay on the left side of the slide (similar to default banners).</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Badge (Upper Tag)</label>
                  <input 
                    type="text" 
                    value={badge} 
                    onChange={e => setBadge(e.target.value)} 
                    className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs" 
                    placeholder="e.g. Since 1972 · Palitana Heritage" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Headline (Italic Title)</label>
                  <input 
                    type="text" 
                    value={headline} 
                    onChange={e => setHeadline(e.target.value)} 
                    className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs" 
                    placeholder="e.g. Handcrafted" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Boldline (Main Title)</label>
                  <input 
                    type="text" 
                    value={boldline} 
                    onChange={e => setBoldline(e.target.value)} 
                    className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs" 
                    placeholder="e.g. Dryfruit Kachori" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Description (Sub)</label>
                  <input 
                    type="text" 
                    value={sub} 
                    onChange={e => setSub(e.target.value)} 
                    className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs" 
                    placeholder="e.g. Slow-fried in 100% pure cow ghee..." 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Button Text (CTA Label)</label>
                  <input 
                    type="text" 
                    value={ctaLabel} 
                    onChange={e => setCtaLabel(e.target.value)} 
                    className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs" 
                    placeholder="e.g. Shop Kachori" 
                  />
                </div>
              </>
            )}
          </div>
          <div className="mt-6 flex justify-between gap-3">
            <div>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    handleDelete(editingId);
                    resetForm();
                  }}
                  className="px-4 py-2 text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg bg-white flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete/Remove Banner
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-brand-charcoal border border-brand-beige rounded-lg bg-white">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-brand-charcoal hover:bg-black rounded-lg">Save Banner</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {banners.map((banner) => (
          <div key={banner.id} className="border border-brand-beige bg-white rounded-xl overflow-hidden shadow-xs relative group flex flex-col">
            <div className="h-44 w-full bg-gray-100 relative">
              {banner.image_url ? (
                <img 
                  src={banner.image_url} 
                  alt="Banner" 
                  className={`w-full h-full ${banner.is_graphic_only === false ? 'object-contain p-2 bg-brand-cream/20' : 'object-cover'}`} 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-8 h-8 opacity-20" /></div>
              )}
              <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                <button 
                  onClick={() => {
                    setEditingId(banner.id);
                    setLink(banner.link || "");
                    setStatus(banner.active ? "active" : "inactive");
                    setImageUrl(banner.image_url || "");
                    setIsGraphicOnly(banner.is_graphic_only !== false);
                    setBadge(banner.badge || "");
                    setHeadline(banner.headline || "");
                    setBoldline(banner.boldline || "");
                    setSub(banner.sub || "");
                    setCtaLabel(banner.cta_label || "");
                    setShowForm(true);
                  }}
                  className="p-1.5 bg-white/95 text-brand-charcoal border border-[#EAE0D3] rounded shadow hover:bg-gray-50 transition-colors"
                  title="Edit Banner"
                >
                  <Edit className="w-3.5 h-3.5 text-[#D46D2D]" />
                </button>
                <button 
                  onClick={() => handleDelete(banner.id)}
                  className="p-1.5 bg-white/95 text-red-600 border border-[#EAE0D3] rounded shadow hover:bg-gray-50 transition-colors"
                  title="Delete Banner"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider ${!banner.active ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700'}`}>
                  {banner.active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  {banner.is_graphic_only === false ? 'Interactive Layout' : 'Graphic Only'}
                </span>
              </div>
              
              {banner.is_graphic_only === false && (
                <div className="mb-3 text-xs flex flex-col gap-1 text-[#2A1E17]">
                  {banner.boldline && (
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase">Title: </span>
                      <span className="font-bold">{banner.headline} {banner.boldline}</span>
                    </div>
                  )}
                  {banner.sub && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1 italic">"{banner.sub}"</p>
                  )}
                </div>
              )}
              
              <div className="mt-auto pt-3 border-t border-brand-beige">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-brand-charcoal font-semibold">Redirects to:</span> 
                  {banner.link ? (
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-muted-foreground break-all">
                      {banner.link}
                    </span>
                  ) : <span className="text-muted-foreground italic">None (Defaults to Shop)</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <div className="col-span-1 md:col-span-2 py-10 text-center border border-dashed border-brand-beige rounded-xl text-muted-foreground text-sm">
            No banners found. Add a banner to display on the homepage.
          </div>
        )}
      </div>
    </div>
  );
}
