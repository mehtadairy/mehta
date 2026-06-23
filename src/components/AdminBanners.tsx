"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Edit, Trash2, Check, X, UploadCloud, Loader2, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import imageCompression from "browser-image-compression";

export default function AdminBanners({ banners, setBanners }: { banners: any[], setBanners: any }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const [status, setStatus] = useState("active");
  const [sortOrder, setSortOrder] = useState("0");
  const [imageUrl, setImageUrl] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setButtonText("");
    setButtonLink("");
    setStatus("active");
    setSortOrder("0");
    setImageUrl("");
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
      title,
      subtitle,
      button_text: buttonText,
      button_link: buttonLink,
      status,
      sort_order: parseInt(sortOrder) || 0,
      image_url: imageUrl
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
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">Banner Image (Required)</label>
              <div className="flex flex-col gap-2">
                {imageUrl && (
                  <div className="relative w-full h-32 rounded-lg border border-brand-beige overflow-hidden">
                    <img src={imageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="cursor-pointer border border-dashed border-brand-beige bg-white rounded-lg px-4 py-3 text-xs text-center hover:bg-brand-cream/50 transition-colors">
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  {isUploading ? (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-brand-charcoal font-semibold"><UploadCloud className="w-4 h-4" /> {imageUrl ? "Change Image" : "Upload Banner Image"}</div>
                  )}
                </label>
              </div>
              {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">Subtitle</label>
              <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">CTA Button Text</label>
              <input type="text" value={buttonText} onChange={e => setButtonText(e.target.value)} className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs" placeholder="e.g. Shop Now" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">CTA Button Link</label>
              <input type="text" value={buttonLink} onChange={e => setButtonLink(e.target.value)} className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs" placeholder="e.g. /shop" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">Sort Order</label>
              <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-brand-charcoal border border-brand-beige rounded-lg bg-white">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-brand-charcoal hover:bg-black rounded-lg">Save Banner</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {banners.map((banner) => (
          <div key={banner.id} className="border border-brand-beige bg-white rounded-xl overflow-hidden shadow-xs relative group flex flex-col">
            <div className="h-32 w-full bg-gray-100 relative">
              {banner.image_url ? (
                <img src={banner.image_url} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-8 h-8 opacity-20" /></div>
              )}
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setEditingId(banner.id);
                    setTitle(banner.title || "");
                    setSubtitle(banner.subtitle || "");
                    setButtonText(banner.button_text || "");
                    setButtonLink(banner.button_link || "");
                    setStatus(banner.status || "active");
                    setSortOrder(String(banner.sort_order || 0));
                    setImageUrl(banner.image_url || "");
                    setShowForm(true);
                  }}
                  className="p-1.5 bg-white text-[#0a4d8c] rounded shadow hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => handleDelete(banner.id)}
                  className="p-1.5 bg-white text-red-600 rounded shadow hover:bg-gray-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider ${banner.status === 'inactive' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700'}`}>
                  {banner.status || 'Active'}
                </span>
                <span className="text-[0.65rem] text-muted-foreground font-semibold">Sort: {banner.sort_order || 0}</span>
              </div>
              <h5 className="font-bold text-brand-charcoal text-sm">{banner.title || "No Title"}</h5>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3 line-clamp-2">{banner.subtitle || "No Subtitle"}</p>
              
              <div className="mt-auto pt-3 border-t border-brand-beige">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-brand-charcoal font-semibold">CTA:</span> 
                  {banner.button_text ? (
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-muted-foreground">
                      {banner.button_text} → {banner.button_link || '#'}
                    </span>
                  ) : <span className="text-muted-foreground italic">None</span>}
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
