"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Save, FileText, Send, Loader2, X, Search } from "lucide-react";
import { showToast } from "./Toast";
import { supabase } from "@/lib/supabaseClient";

interface InvoiceItem {
  id: string;
  isCustom: boolean;
  product_name: string;
  weight: string;
  quantity: number;
  price: number;
  image_url?: string;
  availablePrices?: Record<string, number>;
}

interface ManualInvoiceFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualInvoiceForm({ onClose, onSuccess }: ManualInvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Customer State
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gst: ""
  });

  // Items State
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", isCustom: true, product_name: "", weight: "500g", quantity: 1, price: 0 }
  ]);

  // UI State
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Charges State
  const [charges, setCharges] = useState({
    delivery_charge: 0,
    discount: 0
  });

  // Payment State
  const [payment, setPayment] = useState({
    method: "Cash",
    status: "Paid"
  });

  // Derived Totals
  const [totals, setTotals] = useState({ subtotal: 0, total: 0 });

  // Available Products for Auto-fetch
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*');
      if (data) setAvailableProducts(data);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const sub = items.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 1)), 0);
    const tot = sub + Number(charges.delivery_charge) - Number(charges.discount);
    setTotals({ subtotal: sub, total: tot > 0 ? tot : 0 });
  }, [items, charges]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), isCustom: true, product_name: "", weight: "500g", quantity: 1, price: 0 }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const selectProduct = (id: string, product: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const weights = Object.keys(product.prices);
      const defaultWeight = weights[0];
      return {
        ...item,
        isCustom: false,
        product_name: product.name,
        image_url: product.image_url,
        availablePrices: product.prices,
        weight: defaultWeight,
        price: product.prices[defaultWeight]
      };
    }));
    setActiveDropdownId(null);
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      
      const updatedItem = { ...item, [field]: value };
      
      if (field === 'product_name') {
        // Switching back to custom mode if they type manually
        updatedItem.isCustom = true;
        updatedItem.image_url = undefined;
        updatedItem.availablePrices = undefined;
      }

      if (field === 'weight') {
        // If it's a catalog item, auto-update price based on weight selection
        if (!item.isCustom && item.availablePrices && item.availablePrices[String(value)]) {
          updatedItem.price = item.availablePrices[String(value)];
        }
      }
      
      return updatedItem;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || items.some(i => !i.product_name || i.price <= 0)) {
      showToast("Please add valid items to the invoice.", "error");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        customer_name: customer.name || "Walk-in Customer",
        customer_phone: customer.phone,
        customer_email: customer.email,
        customer_address: customer.address || "Store Pickup",
        gst_number: customer.gst,
        items,
        subtotal: totals.subtotal,
        delivery_charge: Number(charges.delivery_charge),
        discount: Number(charges.discount),
        total: totals.total,
        payment_method: payment.method,
        payment_status: payment.status,
        send_email: sendEmail
      };

      const res = await fetch("/api/invoices/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate invoice");
      
      showToast(`Invoice ${data.invoice.invoice_number} Generated Successfully!`, "success");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#F8F6F3] w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-white border-b border-brand-beige rounded-t-2xl">
          <h2 className="text-xl font-serif font-bold text-brand-charcoal flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-orange" />
            Create Manual Invoice
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8" onClick={() => setActiveDropdownId(null)}>
          <form id="manual-invoice-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Customer Details */}
            <section className="bg-white p-5 rounded-xl border border-brand-beige shadow-sm">
              <h3 className="text-sm font-bold text-brand-charcoal mb-4 uppercase tracking-wider">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Customer Name</label>
                  <input required type="text" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="w-full text-sm border-brand-beige rounded-lg focus:ring-brand-orange focus:border-brand-orange px-3 py-2 border" placeholder="Enter name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile Number</label>
                  <input type="tel" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="w-full text-sm border-brand-beige rounded-lg focus:ring-brand-orange focus:border-brand-orange px-3 py-2 border" placeholder="+91" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                  <input type="email" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} className="w-full text-sm border-brand-beige rounded-lg focus:ring-brand-orange focus:border-brand-orange px-3 py-2 border" placeholder="customer@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">GST Number (Optional)</label>
                  <input type="text" value={customer.gst} onChange={e => setCustomer({...customer, gst: e.target.value})} className="w-full text-sm border-brand-beige rounded-lg focus:ring-brand-orange focus:border-brand-orange px-3 py-2 border" placeholder="24AAAA..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Delivery Address</label>
                  <input type="text" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="w-full text-sm border-brand-beige rounded-lg focus:ring-brand-orange focus:border-brand-orange px-3 py-2 border" placeholder="Full address or 'Store Pickup'" />
                </div>
              </div>
            </section>

            {/* Products Table */}
            <section className="bg-white p-5 rounded-xl border border-brand-beige shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">Line Items</h3>
                <button type="button" onClick={handleAddItem} className="text-xs font-bold bg-brand-cream text-brand-orange px-3 py-1.5 rounded-lg border border-brand-orange/20 hover:bg-brand-orange hover:text-white transition-colors flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>
              
              <div className="overflow-x-auto pb-32">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-brand-beige text-xs text-gray-500 uppercase">
                      <th className="pb-2 font-semibold w-[40%]">Product Description</th>
                      <th className="pb-2 font-semibold w-28">Weight/Unit</th>
                      <th className="pb-2 font-semibold w-20 text-center">Qty</th>
                      <th className="pb-2 font-semibold w-28 text-right">Price (₹)</th>
                      <th className="pb-2 font-semibold w-28 text-right">Total (₹)</th>
                      <th className="pb-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 last:border-0 relative">
                        <td className="py-3 pr-2 relative">
                          <div className="relative">
                            {item.image_url ? (
                              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md overflow-hidden shadow-xs border border-gray-100">
                                <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center text-gray-300">
                                <Search className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <input 
                              required 
                              type="text" 
                              value={item.product_name} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownId(item.id);
                              }}
                              onChange={e => {
                                handleItemChange(item.id, "product_name", e.target.value);
                                setActiveDropdownId(item.id);
                              }} 
                              className={`w-full text-sm border-brand-beige rounded-lg focus:ring-brand-orange focus:border-brand-orange py-2 border shadow-xs ${item.image_url || activeDropdownId === item.id ? 'pl-10 pr-2' : 'pl-10 pr-2'}`} 
                              placeholder="Search catalog or type custom..." 
                            />
                            
                            {/* Product Search Dropdown */}
                            {activeDropdownId === item.id && (
                              <div className="absolute top-full left-0 mt-2 w-full sm:w-[350px] bg-white rounded-xl shadow-2xl border border-brand-beige z-[100] max-h-64 overflow-y-auto" onClick={e => e.stopPropagation()}>
                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between sticky top-0">
                                  <span className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-wider">Catalog Matches</span>
                                  <button type="button" onClick={() => setActiveDropdownId(null)} className="text-gray-400 hover:text-gray-700">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                {availableProducts
                                  .filter(p => p.name.toLowerCase().includes(item.product_name.toLowerCase()))
                                  .map(p => (
                                  <div 
                                    key={p.id} 
                                    onClick={() => selectProduct(item.id, p)}
                                    className="flex items-center gap-3 p-3 hover:bg-brand-cream cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                                  >
                                    <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover shadow-xs border border-gray-100" />
                                    <div className="flex flex-col flex-1">
                                      <span className="text-sm font-bold text-brand-charcoal">{p.name}</span>
                                      <span className="text-[0.65rem] text-brand-orange font-semibold">{Object.keys(p.prices).join(', ')}</span>
                                    </div>
                                    <Plus className="w-4 h-4 text-gray-300" />
                                  </div>
                                ))}
                                {availableProducts.filter(p => p.name.toLowerCase().includes(item.product_name.toLowerCase())).length === 0 && (
                                  <div className="p-4 text-center text-sm text-gray-400">
                                    No products found. Press Enter to use as custom product.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-2">
                          {item.isCustom ? (
                            <input type="text" value={item.weight} onChange={e => handleItemChange(item.id, "weight", e.target.value)} className="w-full text-sm border-brand-beige rounded-lg focus:ring-brand-orange focus:border-brand-orange px-2 py-2 border shadow-xs" placeholder="e.g. 500g" />
                          ) : (
                            <select value={item.weight} onChange={e => handleItemChange(item.id, "weight", e.target.value)} className="w-full text-sm border-brand-beige rounded-lg focus:ring-brand-orange focus:border-brand-orange px-2 py-2 border shadow-xs bg-brand-cream/30 font-semibold text-brand-charcoal cursor-pointer">
                              {Object.keys(item.availablePrices || {}).map(w => (
                                <option key={w} value={w}>{w}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="py-3 pr-2">
                          <input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(item.id, "quantity", parseInt(e.target.value)||1)} className="w-full text-sm text-center border-brand-beige rounded-lg focus:ring-brand-orange focus:border-brand-orange px-2 py-2 border shadow-xs" />
                        </td>
                        <td className="py-3 pr-2">
                          <input type="number" min="0" step="0.01" value={Number.isNaN(item.price) ? "" : item.price} onChange={e => handleItemChange(item.id, "price", parseFloat(e.target.value)||0)} className={`w-full text-sm text-right rounded-lg focus:ring-brand-orange focus:border-brand-orange px-2 py-2 border shadow-xs ${!item.isCustom ? 'bg-gray-50 border-gray-200 text-gray-500' : 'border-brand-beige'}`} disabled={!item.isCustom} />
                        </td>
                        <td className="py-3 pr-2 text-right text-sm font-bold text-brand-charcoal bg-gray-50/50 rounded-lg px-2 border border-transparent">
                          ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </td>
                        <td className="py-3 text-right">
                          <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" disabled={items.length === 1}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Bottom Row: Payment & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Payment Info */}
              <section className="bg-white p-5 rounded-xl border border-brand-beige shadow-sm h-fit">
                <h3 className="text-sm font-bold text-brand-charcoal mb-4 uppercase tracking-wider">Payment Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
                    <select value={payment.method} onChange={e => setPayment({...payment, method: e.target.value})} className="w-full text-sm border-brand-beige rounded-lg focus:ring-brand-orange focus:border-brand-orange px-3 py-2 border shadow-xs">
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Credit/Debit Card</option>
                      <option>Bank Transfer</option>
                      <option>Credit (Unpaid)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                    <select value={payment.status} onChange={e => setPayment({...payment, status: e.target.value})} className="w-full text-sm border-brand-beige rounded-lg focus:ring-brand-orange focus:border-brand-orange px-3 py-2 border shadow-xs">
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Partial">Partial</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Send Email to Customer?</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-orange"></div>
                    </label>
                  </div>
                </div>
              </section>

              {/* Summary */}
              <section className="bg-[#FDFBF7] p-6 rounded-xl border border-brand-beige shadow-sm">
                <h3 className="text-sm font-bold text-brand-charcoal mb-4 uppercase tracking-wider">Invoice Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span className="font-semibold">Subtotal</span>
                    <span className="font-bold">₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span className="font-semibold">Delivery Charge (₹)</span>
                    <input type="number" min="0" value={charges.delivery_charge} onChange={e => setCharges({...charges, delivery_charge: parseFloat(e.target.value)||0})} className="w-24 text-right text-xs border-brand-beige rounded-lg px-2 py-1.5 border focus:border-brand-orange focus:ring-brand-orange shadow-xs" />
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span className="font-semibold text-brand-orange">Discount (₹)</span>
                    <input type="number" min="0" value={charges.discount} onChange={e => setCharges({...charges, discount: parseFloat(e.target.value)||0})} className="w-24 text-right text-xs border-brand-beige rounded-lg px-2 py-1.5 border focus:border-brand-orange focus:ring-brand-orange shadow-xs text-brand-orange" />
                  </div>
                  <div className="pt-4 mt-4 border-t border-brand-beige flex justify-between items-center">
                    <span className="text-lg font-bold text-brand-charcoal">Grand Total</span>
                    <span className="text-2xl font-black text-brand-orange tracking-tight">₹{totals.total.toFixed(2)}</span>
                  </div>
                  <p className="text-[0.65rem] text-right text-gray-400 mt-2">Inclusive of 18% GST (Calculated automatically on PDF)</p>
                </div>
              </section>
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-white border-t border-brand-beige rounded-b-2xl flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            Cancel
          </button>
          <button 
            type="submit" 
            form="manual-invoice-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-brand-charcoal hover:bg-black rounded-xl shadow-lg transition-all disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Generate Invoice
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
