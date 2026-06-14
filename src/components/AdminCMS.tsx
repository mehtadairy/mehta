"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Edit, Trash2, Check, X, FileText } from "lucide-react";

export default function AdminCMS() {
  const [pages, setPages] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    const { data } = await supabase.from('cms_pages').select('*').order('created_at', { ascending: false });
    if (data) setPages(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const pageData = {
      title,
      slug,
      content,
      is_active: isActive
    };

    if (editingId) {
      const { error } = await supabase.from('cms_pages').update(pageData).eq('id', editingId);
      if (!error) {
        setPages(pages.map(p => p.id === editingId ? { ...p, ...pageData } : p));
        resetForm();
      } else {
        alert("Failed to update page");
      }
    } else {
      const { data, error } = await supabase.from('cms_pages').insert([pageData]).select().single();
      if (!error && data) {
        setPages([data, ...pages]);
        resetForm();
      } else {
        alert("Failed to add page");
      }
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this page?")) {
      const { error } = await supabase.from('cms_pages').delete().eq('id', id);
      if (!error) {
        setPages(pages.filter(p => p.id !== id));
      } else {
        alert("Failed to delete page");
      }
    }
  };

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setContent("");
    setIsActive(true);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (p: any) => {
    setTitle(p.title);
    setSlug(p.slug);
    setContent(p.content);
    setIsActive(p.is_active);
    setEditingId(p.id);
    setShowForm(true);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center border-b border-brand-beige pb-3">
        <h3 className="font-serif text-lg font-bold text-brand-charcoal">
          CMS Pages
        </h3>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:underline"
          >
            <Plus className="h-4 w-4" /> Add Page
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-brand-cream/35 border border-brand-beige rounded-xl p-5 flex flex-col gap-4 animate-fade-in-up">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-serif text-sm font-bold text-brand-charcoal">
              {editingId ? "Edit Page" : "Add New Page"}
            </h4>
            <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-brand-charcoal">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border border-brand-beige rounded-lg px-3 py-2 text-xs focus:outline-none"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Slug (e.g. privacy-policy)</label>
              <input 
                type="text" 
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="border border-brand-beige rounded-lg px-3 py-2 text-xs focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Content (HTML allowed)</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="border border-brand-beige rounded-lg px-3 py-2 text-xs focus:outline-none h-48 font-mono"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-brand-orange"
              id="isActive"
            />
            <label htmlFor="isActive" className="text-xs font-semibold text-brand-charcoal cursor-pointer">
              Active (Visible to public)
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-2 rounded-lg bg-brand-orange hover:bg-brand-orange-hover py-2.5 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
          >
            {isLoading && <span className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full" />}
            {editingId ? "Update Page" : "Save Page"}
          </button>
        </form>
      )}

      {!showForm && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-brand-beige">
                <th className="py-3 px-4 text-[0.68rem] font-bold text-brand-charcoal uppercase tracking-wider">Page</th>
                <th className="py-3 px-4 text-[0.68rem] font-bold text-brand-charcoal uppercase tracking-wider">Slug</th>
                <th className="py-3 px-4 text-[0.68rem] font-bold text-brand-charcoal uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-[0.68rem] font-bold text-brand-charcoal uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id} className="border-b border-brand-beige/50 hover:bg-brand-cream/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-brand-beige/30 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-brand-orange" />
                      </div>
                      <span className="text-xs font-bold text-brand-charcoal">{p.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-muted-foreground">/{p.slug}</td>
                  <td className="py-3 px-4">
                    {p.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700">
                        <Check className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] font-bold text-gray-600">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(p)}
                        className="p-1.5 text-muted-foreground hover:text-brand-orange transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-muted-foreground">
                    No CMS pages found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
