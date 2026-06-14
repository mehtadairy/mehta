"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Edit, Trash2, Check, X, UploadCloud, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminCategories({ categories, setCategories }: { categories: any[], setCategories: any }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [sortOrder, setSortOrder] = useState("0");
  const [imageUrl, setImageUrl] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `categories/${fileName}`;

      const { data, error } = await supabase.storage
        .from('products') // Assuming we reuse the products bucket or have a 'categories' bucket. Using products bucket for simplicity.
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

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
    if (!name || !slug) return;

    const newCat = {
      name,
      slug,
      description,
      status,
      sort_order: parseInt(sortOrder) || 0,
      image_url: imageUrl
    };

    if (editingId) {
      const { error } = await supabase.from('categories').update(newCat).eq('id', editingId);
      if (!error) {
        setCategories(categories.map(c => c.id === editingId ? { ...c, ...newCat } : c));
        resetForm();
      } else {
        alert("Error updating category: " + error.message);
      }
    } else {
      const { data, error } = await supabase.from('categories').insert([newCat]).select();
      if (!error && data) {
        setCategories([...categories, data[0]]);
        resetForm();
      } else {
        alert("Error creating category: " + error?.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (!error) {
        setCategories(categories.filter(c => c.id !== id));
      } else {
        alert("Error deleting category: " + error.message);
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between border-b border-brand-beige pb-4 mb-6">
        <h3 className="font-serif text-lg font-bold text-brand-charcoal">
          Category Management
        </h3>
        <button 
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-brand-orange text-white px-4 py-2 text-xs font-bold rounded-lg shadow-sm hover:bg-brand-orange/90 flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 border border-brand-beige bg-brand-cream/10 rounded-xl p-6">
          <h4 className="font-bold text-brand-charcoal text-sm mb-4">
            {editingId ? "Edit Category" : "New Category"}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">Name</label>
              <input type="text" value={name} onChange={e => { setName(e.target.value); if(!editingId) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')); }} className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">Slug</label>
              <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs" rows={2} />
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
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">Category Image</label>
              <div className="flex items-center gap-4">
                {imageUrl && <img src={imageUrl} alt="Category" className="w-16 h-16 object-cover rounded-lg border border-brand-beige" />}
                <label className="cursor-pointer border border-dashed border-brand-beige rounded-lg px-4 py-3 text-xs text-center hover:bg-brand-cream/50 transition-colors flex-grow">
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  {isUploading ? (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground"><UploadCloud className="w-4 h-4" /> Click to upload image</div>
                  )}
                </label>
              </div>
              {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-brand-charcoal border border-brand-beige rounded-lg bg-white">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-brand-charcoal hover:bg-black rounded-lg">Save Category</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-brand-beige bg-brand-cream/30">
              <th className="py-3 px-4 font-bold text-brand-charcoal">Image</th>
              <th className="py-3 px-4 font-bold text-brand-charcoal">Name / Slug</th>
              <th className="py-3 px-4 font-bold text-brand-charcoal">Status</th>
              <th className="py-3 px-4 font-bold text-brand-charcoal">Sort</th>
              <th className="py-3 px-4 font-bold text-brand-charcoal text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id || cat.slug} className="border-b border-brand-beige/50 hover:bg-brand-cream/10 transition-colors">
                <td className="py-3 px-4">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-10 h-10 object-cover rounded-md border border-brand-beige shadow-xs" />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-brand-cream flex items-center justify-center text-muted-foreground border border-brand-beige">N/A</div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <p className="font-bold text-brand-charcoal">{cat.name}</p>
                  <p className="text-muted-foreground mt-0.5">{cat.slug}</p>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider ${cat.status === 'inactive' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700'}`}>
                    {cat.status || 'Active'}
                  </span>
                </td>
                <td className="py-3 px-4 font-medium">{cat.sort_order || 0}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => {
                        setEditingId(cat.id);
                        setName(cat.name);
                        setSlug(cat.slug);
                        setDescription(cat.description || "");
                        setStatus(cat.status || "active");
                        setSortOrder(String(cat.sort_order || 0));
                        setImageUrl(cat.image_url || "");
                        setShowForm(true);
                      }}
                      className="p-1.5 text-[#0a4d8c] bg-[#0a4d8c]/10 rounded hover:bg-[#0a4d8c]/20 transition-colors" title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors" title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
