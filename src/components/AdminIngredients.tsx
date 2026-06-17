"use client";

import React, { useState, useEffect } from "react";
import { fetchIngredients, addIngredient, deleteIngredient, supabase } from "@/lib/supabaseClient";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminIngredients() {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🥛");

  useEffect(() => {
    loadIngredientsData();
  }, []);

  const loadIngredientsData = async () => {
    const data = await fetchIngredients();
    setIngredients(data);
  };

  const resetForm = () => {
    setName("");
    setIcon("🥛");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const trimmedName = name.trim();

    if (editingId) {
      // Update
      const { error } = await supabase
        .from("ingredients")
        .update({ name: trimmedName, icon })
        .eq("id", editingId);

      if (!error) {
        setIngredients(ingredients.map(ing => ing.id === editingId ? { ...ing, name: trimmedName, icon } : ing));
        resetForm();
      } else {
        alert("Error updating ingredient: " + error.message);
      }
    } else {
      // Insert
      const result = await addIngredient(trimmedName, icon);
      if (result) {
        setIngredients([...ingredients, result].sort((a, b) => a.name.localeCompare(b.name)));
        resetForm();
      } else {
        alert("Error creating ingredient. It might already exist.");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this ingredient? It will be removed from all associated products.")) {
      const success = await deleteIngredient(id);
      if (success) {
        setIngredients(ingredients.filter(ing => ing.id !== id));
      } else {
        alert("Failed to delete ingredient.");
      }
    }
  };

  const filteredIngredients = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-brand-beige pb-4 gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-brand-charcoal">
            Ingredients Management
          </h3>
          <p className="text-xs text-muted-foreground">Manage reusable ingredients with names and icons across products.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-brand-orange text-white px-4 py-2 text-xs font-bold rounded-lg shadow-sm hover:bg-brand-orange/90 flex items-center gap-1.5 transition-colors whitespace-nowrap self-stretch sm:self-auto justify-center cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Ingredient
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            onSubmit={handleSubmit} 
            className="border border-brand-beige bg-brand-cream/10 rounded-2xl p-6 overflow-hidden shadow-xs flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-brand-beige/50 pb-2">
              <h4 className="font-bold text-brand-charcoal text-sm">
                {editingId ? "Edit Ingredient" : "New Ingredient"}
              </h4>
              <button 
                type="button"
                onClick={resetForm}
                className="p-1 hover:bg-brand-cream rounded-full cursor-pointer text-brand-charcoal/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Ingredient Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Cardamom"
                  className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange" 
                  required 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Icon / Emoji *</label>
                <select 
                  value={icon} 
                  onChange={e => setIcon(e.target.value)} 
                  className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white cursor-pointer focus:outline-none focus:border-brand-orange"
                >
                  <option value="🥛">🥛 Milk / Dairy (🥛)</option>
                  <option value="🌾">🌾 Wheat / Besan (🌾)</option>
                  <option value="🌱">🌱 Cardamom / Herbs (🌱)</option>
                  <option value="🍂">🍂 Kesar / Saffron (🍂)</option>
                  <option value="🥜">🥜 Cashew / Pistachio / Almond (🥜)</option>
                  <option value="🥥">🥥 Coconut (🥥)</option>
                  <option value="🍌">🍌 Banana / Fruits (🍌)</option>
                  <option value="✨">✨ Silver Leaf / Varakh (✨)</option>
                  <option value="🧂">🧂 Salt (🧂)</option>
                  <option value="🍯">🍯 Honey (🍯)</option>
                  <option value="💧">💧 Rose Water (💧)</option>
                  <option value="🍬">🍬 Sugar / Sweets (🍬)</option>
                  <option value="🛢️">🛢️ Edible Oil / Ghee (🛢️)</option>
                </select>
              </div>
            </div>
            <div className="mt-2 flex justify-end gap-3 border-t border-brand-beige/50 pt-4">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-xs font-bold text-brand-charcoal hover:bg-brand-cream border border-brand-beige rounded-lg bg-white cursor-pointer transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-lg cursor-pointer transition-colors shadow-xs">Save Ingredient</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search ingredients..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full border border-brand-beige rounded-lg pl-9 pr-4 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
        />
      </div>

      {/* Modern Badge Layout with Drag & Stagger & spring-physics */}
      <div className="border border-brand-beige/50 rounded-2xl bg-[#fbfbfb]/50 p-6">
        <motion.div 
          layout 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredIngredients.map((ing) => (
              <motion.div
                layout
                key={ing.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.15}
                className="bg-white/80 backdrop-blur-md border border-brand-beige rounded-2xl p-4 flex flex-col items-center justify-between gap-3 text-center shadow-xs hover:shadow-md hover:border-brand-orange/40 transition-all duration-300 relative overflow-hidden group cursor-grab active:cursor-grabbing min-h-[120px]"
              >
                {/* Drag Mesh Graphic Simulator */}
                <div className="absolute inset-0 bg-radial-gradient from-brand-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Card action badges absolute */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => {
                      setEditingId(ing.id);
                      setName(ing.name);
                      setIcon(ing.icon || "🥛");
                      setShowForm(true);
                    }}
                    className="p-1 text-[#0a4d8c] bg-[#0a4d8c]/10 rounded hover:bg-[#0a4d8c]/20 transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(ing.id)}
                    className="p-1 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Emoji Icon Container */}
                <div className="w-12 h-12 rounded-full bg-brand-cream border border-brand-beige flex items-center justify-center text-2xl select-none group-hover:scale-110 transition-transform duration-300 shadow-2xs">
                  {ing.icon}
                </div>

                {/* Name */}
                <div className="font-semibold text-brand-charcoal text-[0.75rem] select-none uppercase tracking-wider">
                  {ing.name}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredIngredients.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-xs flex flex-col items-center justify-center gap-2">
            <span>No ingredients found.</span>
          </div>
        )}
      </div>
    </div>
  );
}
