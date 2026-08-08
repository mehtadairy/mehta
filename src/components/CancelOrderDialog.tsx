"use client";

import React, { useState } from "react";
import { AlertCircle, X, Loader2 } from "lucide-react";

interface CancelOrderDialogProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newStatus: string) => void;
  total?: number;
  paymentMethod?: string;
  paymentStatus?: string;
}

const REASONS = [
  "Ordered by mistake",
  "Want to change products",
  "Wrong delivery address",
  "Found another option",
  "Delivery taking too long",
  "Other"
];

export default function CancelOrderDialog({ orderId, isOpen, onClose, onSuccess, total, paymentMethod, paymentStatus }: CancelOrderDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isOnlinePaid = (paymentMethod === "Online" || paymentMethod === "Razorpay") && paymentStatus?.toLowerCase() === "paid";

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
          <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-4 rounded-xl text-[13px] border border-red-100 dark:border-red-900/20 flex flex-col gap-2">
            <p><strong>Warning:</strong> Are you sure you want to cancel this order? This action cannot be undone.</p>
            {total !== undefined && (
              <div className="mt-2 border-t border-red-200/50 pt-2 font-medium">
                <div className="flex justify-between">
                  <span>Order Total:</span>
                  <span>₹{total}</span>
                </div>
                {isOnlinePaid && (
                  <div className="flex justify-between font-bold text-red-800">
                    <span>Refund Amount:</span>
                    <span>₹{total}</span>
                  </div>
                )}
              </div>
            )}
            {isOnlinePaid && (
              <p className="text-[11px] mt-1 opacity-90">
                Refund will be initiated to your original payment method automatically.
              </p>
            )}
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

            {selectedReason === "Other" && (
              <div className="mt-3 animate-in slide-in-from-top-2">
                <textarea
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder="Please specify your reason..."
                  className="w-full bg-white dark:bg-[#2A1E17] border border-[#EAE0D3] dark:border-[#4E3A2D] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#D46D2D]/30 focus:border-[#D46D2D] outline-none resize-none transition-all placeholder:text-[#A8927E]"
                  rows={3}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-xs font-medium bg-red-50 p-2 rounded-lg border border-red-100">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 bg-[#FAF6EE] dark:bg-[#2A1E17] border-t border-[#EAE0D3] dark:border-[#3E2E23] flex flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 bg-white dark:bg-[#3E2E23] hover:bg-gray-50 dark:hover:bg-[#4E3A2D] text-[#2A1E17] dark:text-[#FCF9F2] border border-[#EAE0D3] dark:border-[#4E3A2D] py-2.5 rounded-xl font-bold text-xs transition-colors disabled:opacity-50"
          >
            Keep Order
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
}
