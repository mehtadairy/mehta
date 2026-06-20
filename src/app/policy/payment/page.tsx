"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Landmark, Check, AlertCircle, Phone, MapPin, Loader2, Sparkles } from "lucide-react";

export default function OnlinePaymentPolicy() {
  // Quick Pay States
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPurpose, setPaymentPurpose] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Payment Success Receipt State
  const [paymentReceipt, setPaymentReceipt] = useState<any | null>(null);

  // Amount Presets
  const PRESETS = [500, 1000, 2500, 5000];

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleQuickPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError("Please enter a valid payment amount (minimum ₹1).");
      return;
    }

    if (!payerName.trim() || !payerPhone.trim()) {
      setPaymentError("Name and Phone Number are required.");
      return;
    }

    setIsProcessing(true);

    try {
      const orderNumber = `QP-${Date.now()}`;

      // 1. Create Razorpay order on backend
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, orderNumber })
      });
      const orderData = await res.json();

      if (!orderData || !orderData.id) {
        throw new Error(orderData.error || "Failed to initiate online transaction.");
      }

      // 2. Load SDK
      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded) {
        throw new Error("Razorpay payment portal failed to load. Check your internet connection.");
      }

      // 3. Open Gateway
      const options = {
        key: orderData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_your_key_id",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Mehta Sweet Mart",
        description: paymentPurpose || "Quick Direct Payment",
        order_id: orderData.id,
        handler: function (response: any) {
          setPaymentReceipt({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            amount: amt,
            name: payerName,
            phone: payerPhone,
            email: payerEmail || "N/A",
            purpose: paymentPurpose || "Direct Deposit",
            date: new Date().toLocaleString()
          });

          // Clear inputs
          setPayerName("");
          setPayerPhone("");
          setPayerEmail("");
          setPaymentAmount("");
          setPaymentPurpose("");
          setIsProcessing(false);
        },
        prefill: {
          name: payerName,
          contact: payerPhone,
          email: payerEmail
        },
        theme: {
          color: "#D46D2D" // brand-orange
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            console.log("Quick Payment overlay closed.");
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setPaymentError(response.error.description || "Quick payment failed.");
        setIsProcessing(false);
      });
      rzp.open();

    } catch (err: any) {
      console.error(err);
      setPaymentError(err.message || "Failed to process payment check.");
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Header />
      <WhatsAppFloat />

      <main className="bg-brand-cream/35 min-h-screen py-24 mt-20 sm:mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Column: Payment Details & Bank Details */}
            <div className="lg:col-span-7 flex flex-col gap-6">

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-brand-beige relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-orange to-brand-gold"></div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-brand-orange/5 text-brand-orange flex items-center justify-center">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="font-serif text-2xl font-bold text-brand-charcoal">Online Payment Policy</h1>
                    <p className="text-[0.65rem] text-muted-foreground">Secure Checkout & Digital Settlement Details</p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground leading-relaxed flex flex-col gap-4">
                  <p>
                    Mehta Sweet Mart offers full integration with secure networks to process payments. All transactions are encrypted end-to-end to protect cardholder details.
                  </p>

                  <h3 className="font-serif text-sm font-bold text-brand-charcoal mt-2 uppercase tracking-wide">Supported Payment Methods</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-[0.65rem] font-bold">
                    <div className="p-3 bg-brand-cream/20 border border-brand-beige/50 rounded-xl">UPI (GPay / PhonePe)</div>
                    <div className="p-3 bg-brand-cream/20 border border-brand-beige/50 rounded-xl">Credit & Debit Cards</div>
                    <div className="p-3 bg-brand-cream/20 border border-brand-beige/50 rounded-xl">Net Banking (All Banks)</div>
                    <div className="p-3 bg-brand-cream/20 border border-brand-beige/50 rounded-xl">Mobile Wallets</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-brand-beige relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-orange to-brand-gold"></div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-brand-orange/5 text-brand-orange flex items-center justify-center">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-brand-charcoal">Direct Bank Transfer</h2>
                    <p className="text-[0.65rem] text-muted-foreground">For offline catering, party orders and direct bank deposits</p>
                  </div>
                </div>

                <div className="border border-brand-beige/60 rounded-2xl overflow-hidden text-xs">
                  <div className="grid grid-cols-3 border-b border-brand-beige bg-brand-cream/10 p-3">
                    <span className="font-bold text-brand-charcoal">Bank Name</span>
                    <span className="col-span-2 text-muted-foreground font-semibold">State Bank of India</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-brand-beige p-3">
                    <span className="font-bold text-brand-charcoal">Account Name</span>
                    <span className="col-span-2 text-muted-foreground font-semibold">Mehta Sweet Mart</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-brand-beige bg-brand-cream/10 p-3">
                    <span className="font-bold text-brand-charcoal">Account Number</span>
                    <span className="col-span-2 font-mono text-brand-orange font-bold">39820194829</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-brand-beige p-3">
                    <span className="font-bold text-brand-charcoal">IFSC Code</span>
                    <span className="col-span-2 font-mono text-brand-orange font-bold">SBIN0000001</span>
                  </div>
                  <div className="grid grid-cols-3 p-3 bg-brand-cream/10">
                    <span className="font-bold text-brand-charcoal">Branch</span>
                    <span className="col-span-2 text-muted-foreground font-semibold"> Palitana, Gujarat 364270 </span>
                  </div>
                </div>
              </motion.div>

              {/* Outlet Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-brand-beige relative overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                  <span className="font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-brand-orange" /> Main Helpline Support
                  </span>
                  <span>Contact Mehta Sweet Mart Support at:</span>
                  <a href="tel:+919913252232" className="text-brand-orange font-black hover:underline text-sm">+91 99132 52232</a>
                </div>

                <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                  <span className="font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-brand-orange" /> Main Outlet Address
                  </span>
                  <span>Bhidbhanjan Road, Taleti Road, Navagadh,<br />Palitana, Gujarat 364270</span>
                  <a href="https://share.google/5x2FPvCFeEAeFtI3N" target="_blank" rel="noreferrer" className="text-brand-orange font-black hover:underline">View on Google Maps</a>
                </div>
              </motion.div>

            </div>

            {/* Right Column: Razorpay Quick Payment Form */}
            <div className="lg:col-span-5 flex flex-col gap-6">

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-brand-beige relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-orange to-brand-gold"></div>

                <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-5 w-5 text-brand-gold fill-brand-gold/15" /> Quick Payment Gateway
                </h3>
                <p className="text-[0.65rem] text-muted-foreground mb-6 leading-relaxed">
                  Catering advance deposit or custom gift-box billing? Complete your payment securely below.
                </p>

                <form onSubmit={handleQuickPay} className="flex flex-col gap-4">

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.65rem] font-bold text-brand-charcoal uppercase tracking-wide">Payer Name *</label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      className="border border-brand-beige rounded-xl px-3 py-2 text-xs bg-brand-cream/10 focus:outline-none focus:border-brand-orange"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.65rem] font-bold text-brand-charcoal uppercase tracking-wide">Mobile Number *</label>
                      <input
                        type="tel"
                        placeholder="98765 43210"
                        value={payerPhone}
                        onChange={(e) => setPayerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="border border-brand-beige rounded-xl px-3 py-2 text-xs bg-brand-cream/10 focus:outline-none focus:border-brand-orange"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.65rem] font-bold text-brand-charcoal uppercase tracking-wide">Email Address</label>
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={payerEmail}
                        onChange={(e) => setPayerEmail(e.target.value)}
                        className="border border-brand-beige rounded-xl px-3 py-2 text-xs bg-brand-cream/10 focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.65rem] font-bold text-brand-charcoal uppercase tracking-wide">Payment Purpose / Reference</label>
                    <input
                      type="text"
                      placeholder="E.g. catering advance, bill ref"
                      value={paymentPurpose}
                      onChange={(e) => setPaymentPurpose(e.target.value)}
                      className="border border-brand-beige rounded-xl px-3 py-2 text-xs bg-brand-cream/10 focus:outline-none focus:border-brand-orange"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[0.65rem] font-bold text-brand-charcoal uppercase tracking-wide">Amount (INR) *</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 font-bold text-brand-orange text-xs">₹</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="0.00"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full border border-brand-beige rounded-xl pl-8 pr-4 py-2.5 text-xs bg-brand-cream/10 focus:outline-none focus:border-brand-orange font-bold text-brand-orange"
                        required
                      />
                    </div>

                    {/* Presets */}
                    <div className="flex gap-2 mt-2">
                      {PRESETS.map((amt) => (
                        <button
                          type="button"
                          key={amt}
                          onClick={() => setPaymentAmount(amt.toString())}
                          className="flex-1 py-1 rounded-lg border border-brand-beige hover:border-brand-orange text-[0.62rem] font-bold hover:bg-brand-orange/5 transition-all"
                        >
                          + ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 text-red-900 text-[0.68rem] items-center">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white py-3 text-xs font-bold transition-all shadow-md mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin" /> Preparing Payment...
                      </>
                    ) : (
                      <>Secure Payment via Razorpay</>
                    )}
                  </button>

                </form>
              </motion.div>

              {/* Receipt Output Panel (Framer Motion) */}
              <AnimatePresence>
                {paymentReceipt && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#fdfaf2] border-2 border-emerald-200 rounded-3xl p-6 shadow-md relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Check className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-brand-charcoal">Transaction Success!</h4>
                        <p className="text-[0.6rem] text-muted-foreground">Thank you for your payment.</p>
                      </div>
                      <button
                        onClick={() => setPaymentReceipt(null)}
                        className="ml-auto text-xs text-muted-foreground hover:text-brand-charcoal font-bold"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="border-t border-brand-beige/50 pt-4 flex flex-col gap-2 text-[0.65rem] text-brand-charcoal/90">
                      <div className="flex justify-between font-mono">
                        <span className="font-bold text-muted-foreground">PAYMENT ID</span>
                        <span className="font-bold text-brand-orange select-all">{paymentReceipt.paymentId}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="font-bold text-muted-foreground">ORDER ID</span>
                        <span className="text-muted-foreground select-all">{paymentReceipt.orderId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-muted-foreground">PAYMENT SOURCE</span>
                        <span className="font-bold text-brand-charcoal">{paymentReceipt.name} ({paymentReceipt.phone})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-muted-foreground">PURPOSE</span>
                        <span className="font-bold italic">{paymentReceipt.purpose}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-muted-foreground">DATE & TIME</span>
                        <span className="text-muted-foreground">{paymentReceipt.date}</span>
                      </div>

                      <div className="border-t border-brand-beige/50 mt-2 pt-3 flex justify-between items-baseline">
                        <span className="text-xs font-bold text-brand-charcoal">Amount Deposited</span>
                        <span className="font-serif text-lg font-black text-brand-orange">₹{paymentReceipt.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
