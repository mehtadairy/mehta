"use client";

import React, { useState, useEffect } from "react";
import { fetchIngredients, addIngredient, deleteIngredient, supabase } from "@/lib/supabaseClient";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";

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
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-brand-beige pb-4 mb-6 gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-brand-charcoal">
            Ingredients Management
          </h3>
          <p className="text-xs text-muted-foreground">Manage reusable ingredients with names and icons across products.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-brand-orange text-white px-4 py-2 text-xs font-bold rounded-lg shadow-sm hover:bg-brand-orange/90 flex items-center gap-1.5 transition-colors whitespace-nowrap self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Add Ingredient
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 border border-brand-beige bg-brand-cream/10 rounded-xl p-6">
          <h4 className="font-bold text-brand-charcoal text-sm mb-4">
            {editingId ? "Edit Ingredient" : "New Ingredient"}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">Ingredient Name *</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. Cardamom"
                className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">Icon / Emoji *</label>
              <select 
                value={icon} 
                onChange={e => setIcon(e.target.value)} 
                className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white cursor-pointer"
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
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-brand-charcoal border border-brand-beige rounded-lg bg-white">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-brand-charcoal hover:bg-black rounded-lg">Save Ingredient</button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search ingredients..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full border border-brand-beige rounded-lg pl-9 pr-4 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-brand-beige bg-brand-cream/30">
              <th className="py-3 px-4 font-bold text-brand-charcoal w-16">Icon</th>
              <th className="py-3 px-4 font-bold text-brand-charcoal">Name</th>
              <th className="py-3 px-4 font-bold text-brand-charcoal text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.map((ing) => (
              <tr key={ing.id} className="border-b border-brand-beige/50 hover:bg-brand-cream/10 transition-colors">
                <td className="py-3 px-4 text-lg">{ing.icon}</td>
                <td className="py-3 px-4 font-semibold text-brand-charcoal">{ing.name}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => {
                        setEditingId(ing.id);
                        setName(ing.name);
                        setIcon(ing.icon || "🥛");
                        setShowForm(true);
                      }}
                      className="p-1.5 text-[#0a4d8c] bg-[#0a4d8c]/10 rounded hover:bg-[#0a4d8c]/20 transition-colors" title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(ing.id)}
                      className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors" title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredIngredients.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-muted-foreground text-xs">
                  No ingredients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
