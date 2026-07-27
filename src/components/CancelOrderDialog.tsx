"use client";

import React, { useState } from "react";
import { AlertCircle, X, Loader2 } from "lucide-react";

interface CancelOrderDialogProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newStatus: string) => void;
}

const REASONS = [
  "Ordered by mistake",
  "Want to change products",
  "Wrong delivery address",
  "Found another option",
  "Delivery taking too long",
  "Other"
];

export default function CancelOrderDialog({ orderId, isOpen, onClose, onSuccess }: CancelOrderDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError("Please select a reason for cancellation.");
      return;
    }
    const finalReason = selectedReason === "Other" ? otherReason.trim() : selectedReason;
    if (selectedReason === "Other" && !finalReason) {
      setError("Please provide a reason.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, reason: finalReason })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to cancel order.");
      } else {
        onSuccess(data.status);
      }
    } catch (e) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#FCF9F2] dark:bg-[#2A1E17] border border-[#EAE0D3] dark:border-[#3E2E23] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-[#EAE0D3] dark:border-[#3E2E23]">
          <h3 className="text-lg font-serif font-bold text-[#2A1E17] dark:text-[#FCF9F2] flex items-center gap-2">
            <AlertCircle className="text-red-500 w-5 h-5" />
            Cancel Order
          </h3>
          <button onClick={onClose} className="text-[#7E6B5A] hover:text-[#2A1E17] dark:text-[#A8927E] dark:hover:text-[#FCF9F2] focus:outline-none transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-4 rounded-xl text-xs border border-red-100 dark:border-red-900/20">
            <strong>Warning:</strong> Once cancelled, this action cannot be undone.
          </div>

          <div>
            <label className="block text-sm font-bold text-[#2A1E17] dark:text-[#FCF9F2] mb-3 uppercase tracking-wider text-[0.7rem]">
              Reason for cancellation
            </label>
            <div className="space-y-1">
              {REASONS.map(reason => (
                <label key={reason} className="flex items-center gap-3 cursor-pointer group p-2.5 rounded-xl hover:bg-[#FAF6EE] dark:hover:bg-[#3E2E23] border border-transparent hover:border-[#EAE0D3] dark:hover:border-[#4E3A2D] transition-all">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="radio" 
                      name="cancel_reason" 
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="peer appearance-none w-5 h-5 border-2 border-[#EAE0D3] dark:border-[#4E3A2D] rounded-full checked:border-[#D46D2D] focus:outline-none transition-all"
                    />
                    <div className="absolute w-2.5 h-2.5 bg-[#D46D2D] rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                  </div>
                  <span className="text-xs font-semibold text-[#7E6B5A] group-hover:text-[#2A1E17] dark:text-[#A8927E] dark:group-hover:text-[#FCF9F2] transition-colors">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === "Other" && (
            <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
              <textarea
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Please specify your reason..."
                className="w-full border border-[#EAE0D3] dark:border-[#3E2E23] bg-white dark:bg-[#1E1510] rounded-xl p-3 text-xs text-[#2A1E17] dark:text-[#FCF9F2] focus:ring-2 focus:ring-[#D46D2D] focus:border-[#D46D2D] outline-none resize-none transition-all placeholder:text-[#7E6B5A]/50"
                rows={3}
              />
            </div>
          )}

          {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}
        </div>

        <div className="p-6 bg-[#FAF6EE] dark:bg-[#201611] border-t border-[#EAE0D3] dark:border-[#3E2E23] flex gap-3 justify-end">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-bold text-[#7E6B5A] hover:text-[#2A1E17] dark:text-[#A8927E] dark:hover:text-[#FCF9F2] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all active:scale-95"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#D46D2D] hover:bg-[#BF5E23] rounded-xl transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Confirm Cancellation
          </button>
        </div>
      </div>
    </div>
  );
}
