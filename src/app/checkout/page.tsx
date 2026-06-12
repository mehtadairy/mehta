"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { 
  getAddresses, 
  saveAddresses, 
  addOrder, 
  getProfile,
  Address,
  Coupon
} from "@/lib/mockData";
import { MapPin, Phone, CreditCard, ChevronRight, Check, Plus, ShoppingBasket } from "lucide-react";

export default function Checkout() {
  const router = useRouter();
  
  // Checkout States
  const [cart, setCart] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<'Home' | 'Pickup'>('Home');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Address creation form
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");

  // Payment integration simulator
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOption, setPaymentOption] = useState<'Razorpay_UPI' | 'Razorpay_Card' | 'COD'>('Razorpay_UPI');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [finalOrderNumber, setFinalOrderNumber] = useState("");

  // Credit Card inputs
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");

  // Load state
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Cart load
    const storedCart = localStorage.getItem("mehta_cart");
    if (storedCart) {
      const parsed = JSON.parse(storedCart);
      setCart(parsed);
      if (parsed.length === 0) {
        router.push("/cart");
      }
    } else {
      router.push("/cart");
    }

    // Addresses load
    const userAddresses = getAddresses();
    setAddresses(userAddresses);
    const defaultAddr = userAddresses.find(a => a.isDefault);
    if (defaultAddr) {
      setSelectedAddressId(defaultAddr.id);
    } else if (userAddresses.length > 0) {
      setSelectedAddressId(userAddresses[0].id);
    }

    // Coupon load
    const storedCoupon = localStorage.getItem("mehta_applied_coupon");
    if (storedCoupon) setAppliedCoupon(JSON.parse(storedCoupon));
  }, [router]);

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const discountAmount = appliedCoupon 
    ? (appliedCoupon.discountType === 'percentage' 
        ? Math.floor((cartSubtotal * appliedCoupon.value) / 100) 
        : appliedCoupon.value)
    : 0;

  const deliveryCharge = deliveryMethod === 'Home' 
    ? (cartSubtotal >= 750 ? 0 : 60) 
    : 0;

  const totalPayable = Math.max(0, cartSubtotal - discountAmount + deliveryCharge);

  // Address Submit
  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone || !newStreet || !newCity || !newState || !newPincode) return;

    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      name: newName,
      phone: newPhone,
      street: newStreet,
      city: newCity,
      state: newState,
      pincode: newPincode,
      isDefault: addresses.length === 0
    };

    const updated = [...addresses, newAddr];
    setAddresses(updated);
    saveAddresses(updated);
    setSelectedAddressId(newAddr.id);

    // Reset Address form
    setNewName("");
    setNewPhone("");
    setNewStreet("");
    setNewCity("");
    setNewState("");
    setNewPincode("");
    setShowNewAddressForm(false);
  };

  // Payment process simulation
  const handleProceedToPayment = () => {
    if (!selectedAddressId && deliveryMethod === 'Home') {
      alert("Please select a shipping address.");
      return;
    }
    setShowPaymentModal(true);
  };

  const executePayment = () => {
    setIsPaying(true);
    
    // Simulate payment transaction delays
    setTimeout(() => {
      setIsPaying(false);
      setPaymentSuccess(true);
      
      const orderAddress = deliveryMethod === 'Home' 
        ? addresses.find(a => a.id === selectedAddressId) as Address
        : { id: 'pickup', name: 'Self Pickup', phone: 'N/A', street: 'Mehta Sweet Mart Main Branch', city: 'Ahmedabad', state: 'Gujarat', pincode: '380009', isDefault: false };

      const profile = getProfile();

      // Submit Order to Mock Database
      const orderItemModel = cart.map(item => ({
        productId: item.productId,
        productName: item.productName,
        image: item.image,
        weight: item.weight,
        price: item.price,
        quantity: item.quantity
      }));

      const newOrder = addOrder({
        items: orderItemModel,
        subtotal: cartSubtotal,
        discount: discountAmount,
        couponCode: appliedCoupon?.code,
        deliveryCharge: deliveryCharge,
        total: totalPayable,
        shippingAddress: orderAddress,
        paymentMethod: paymentOption === 'COD' ? 'COD' : 'Razorpay',
        paymentStatus: paymentOption === 'COD' ? 'Pending' : 'Paid',
        paymentId: paymentOption === 'COD' ? undefined : `pay_${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'Processing',
        userName: profile.name,
        userPhone: profile.phone
      });

      setFinalOrderNumber(newOrder.orderNumber);
      setReceiptNumber(newOrder.paymentId || "COD-ORDER");

      // Clear Shopping Cart & Coupons
      localStorage.removeItem("mehta_cart");
      localStorage.removeItem("mehta_applied_coupon");
      window.dispatchEvent(new Event("cartUpdated"));

    }, 2500);
  };

  const closeReceiptModal = () => {
    setShowPaymentModal(false);
    setPaymentSuccess(false);
    router.push("/account?tab=orders");
  };

  return (
    <>
      <Header />
      <WhatsAppFloat />

      {/* --- PAGE HEADER --- */}
      <section className="bg-brand-cream border-b border-brand-beige py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-bold text-brand-charcoal text-center font-bold">
            Checkout Delivery Details
          </h2>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Select shipping address, choose delivery options, and secure with Razorpay checkout gateways.
          </p>
        </div>
      </section>

      {/* --- CHECKOUT CONTAINER --- */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column Shipping details */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Delivery method selector */}
              <div className="bg-white border border-brand-beige rounded-2xl p-6 shadow-xs">
                <h3 className="font-serif text-base font-bold text-brand-charcoal border-b border-brand-beige pb-3 mb-4">
                  1. Delivery Option
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDeliveryMethod('Home')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      deliveryMethod === 'Home'
                        ? "border-brand-orange bg-brand-orange/5 text-brand-orange"
                        : "border-brand-beige hover:border-brand-gold text-brand-charcoal"
                    }`}
                  >
                    <span className="font-serif text-xs font-bold mb-1">Standard Home Delivery</span>
                    <span className="text-[0.62rem] text-muted-foreground">Shipped directly to address</span>
                  </button>

                  <button
                    onClick={() => setDeliveryMethod('Pickup')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      deliveryMethod === 'Pickup'
                        ? "border-brand-orange bg-brand-orange/5 text-brand-orange"
                        : "border-brand-beige hover:border-brand-gold text-brand-charcoal"
                    }`}
                  >
                    <span className="font-serif text-xs font-bold mb-1">Self Outlet Pickup</span>
                    <span className="text-[0.62rem] text-muted-foreground">Pick up from Stadium Road outlet</span>
                  </button>
                </div>
              </div>

              {/* Shipping Address Selector */}
              {deliveryMethod === 'Home' && (
                <div className="bg-white border border-brand-beige rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-brand-beige pb-3">
                    <h3 className="font-serif text-base font-bold text-brand-charcoal">
                      2. Shipping Address
                    </h3>
                    
                    {!showNewAddressForm && (
                      <button 
                        onClick={() => setShowNewAddressForm(true)}
                        className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-brand-orange hover:underline"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add New Address
                      </button>
                    )}
                  </div>

                  {/* Add New Address Form */}
                  {showNewAddressForm && (
                    <form onSubmit={handleAddAddress} className="bg-brand-cream/35 border border-brand-beige rounded-xl p-5 flex flex-col gap-4 animate-fade-in-up">
                      <h4 className="font-serif text-xs font-bold text-brand-charcoal">New Address Details</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Recipient Name *</label>
                          <input 
                            type="text" 
                            placeholder="Aarya Mehta"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Phone Number *</label>
                          <input 
                            type="tel" 
                            placeholder="98765 43210"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Street Address *</label>
                        <input 
                          type="text" 
                          placeholder="Flat/House No, Apartment/Building, Area"
                          value={newStreet}
                          onChange={(e) => setNewStreet(e.target.value)}
                          className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">City *</label>
                          <input 
                            type="text" 
                            placeholder="Ahmedabad"
                            value={newCity}
                            onChange={(e) => setNewCity(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">State *</label>
                          <input 
                            type="text" 
                            placeholder="Gujarat"
                            value={newState}
                            onChange={(e) => setNewState(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Pincode *</label>
                          <input 
                            type="text" 
                            placeholder="380015"
                            value={newPincode}
                            onChange={(e) => setNewPincode(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-2 border-t border-brand-beige pt-4">
                        <button 
                          type="button" 
                          onClick={() => setShowNewAddressForm(false)}
                          className="px-4 py-2 border border-brand-beige hover:border-brand-gold rounded-lg text-xs font-bold text-brand-charcoal transition-colors hover:bg-white"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="px-5 py-2 bg-brand-orange hover:bg-brand-orange-hover rounded-lg text-xs font-bold text-white transition-colors"
                        >
                          Save Address
                        </button>
                      </div>
                    </form>
                  )}

                  {/* List of saved addresses */}
                  {addresses.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No saved addresses found. Please add a shipping address.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div 
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`rounded-xl border-2 p-4 flex gap-3 cursor-pointer transition-all ${
                            selectedAddressId === addr.id
                              ? "border-brand-orange bg-brand-orange/5"
                              : "border-brand-beige hover:border-brand-gold bg-white"
                          }`}
                        >
                          <div className={`mt-1 h-4 w-4 rounded-full border flex items-center justify-center ${selectedAddressId === addr.id ? "border-brand-orange text-brand-orange" : "border-brand-beige"}`}>
                            {selectedAddressId === addr.id && <div className="h-2 w-2 rounded-full bg-brand-orange"></div>}
                          </div>
                          <div>
                            <h4 className="font-serif text-xs font-bold text-brand-charcoal flex items-center gap-1.5">
                              {addr.name}
                              {addr.isDefault && (
                                <span className="text-[0.55rem] font-bold uppercase tracking-wider bg-brand-beige px-1.5 py-0.5 rounded text-brand-gold">Default</span>
                              )}
                            </h4>
                            <p className="text-[0.7rem] text-muted-foreground mt-2 leading-relaxed">
                              {addr.street},<br />
                              {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                            <span className="text-[0.7rem] text-brand-charcoal font-semibold mt-2 block flex items-center gap-1">
                              <Phone className="h-3 w-3 text-brand-gold" /> {addr.phone}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Basket Items list & Checkout Totals */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Items Summary checklist */}
              <div className="bg-white border border-brand-beige rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                <h3 className="font-serif text-sm font-bold text-brand-charcoal border-b border-brand-beige pb-3 mb-2 flex items-center gap-1.5">
                  <ShoppingBasket className="h-4.5 w-4.5 text-brand-orange" /> Basket Items ({cart.length})
                </h3>
                
                <div className="flex flex-col gap-3.5 max-h-[220px] overflow-y-auto pr-1">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex gap-3 justify-between items-center text-xs">
                      <div className="flex gap-2.5 items-center">
                        <img src={item.image} alt={item.productName} className="h-10 w-10 rounded-lg object-cover bg-brand-cream border border-brand-beige flex-shrink-0" />
                        <div>
                          <h4 className="font-serif font-bold text-brand-charcoal line-clamp-1">{item.productName}</h4>
                          <span className="text-[0.65rem] text-muted-foreground">{item.weight} x {item.quantity}</span>
                        </div>
                      </div>
                      <span className="font-serif font-bold text-brand-charcoal">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Receipt / Invoice Totals box */}
              <div className="bg-white border border-brand-beige rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                <h3 className="font-serif text-sm font-bold text-brand-charcoal border-b border-brand-beige pb-3">
                  Bill Summary
                </h3>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Cart Subtotal</span>
                  <span className="font-bold text-brand-charcoal">₹{cartSubtotal}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700">
                    <span>Coupon Discount ({appliedCoupon?.code})</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Delivery Charge</span>
                  {deliveryCharge === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase text-[0.65rem] bg-emerald-50 px-2 py-0.5 rounded-md">Free</span>
                  ) : (
                    <span className="font-bold text-brand-charcoal">₹{deliveryCharge}</span>
                  )}
                </div>

                <div className="h-px bg-brand-beige"></div>

                <div className="flex justify-between text-sm font-bold text-brand-charcoal mb-2">
                  <span>Grand Total</span>
                  <span className="font-serif text-lg text-brand-orange">₹{totalPayable}</span>
                </div>

                <button 
                  onClick={handleProceedToPayment}
                  className="w-full inline-flex items-center justify-center rounded-xl bg-brand-orange py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-orange-hover"
                >
                  Proceed to Payment <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* --- RAZORPAY GATEWAY SIMULATOR MODAL --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-brand-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-brand-gold overflow-hidden animate-fade-in-up">
            
            {/* Modal Header */}
            {!paymentSuccess ? (
              <>
                <div className="bg-[#122A5E] text-white p-5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[0.62rem] text-indigo-200 uppercase tracking-widest font-bold">Razorpay Secure Checkout</span>
                    <h3 className="font-serif text-base font-bold">Mehta Sweet Mart Payment</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[0.65rem] block text-indigo-200">PAYABLE AMOUNT</span>
                    <span className="font-serif text-lg font-bold">₹{totalPayable}</span>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 flex flex-col gap-6">
                  {isPaying ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-orange border-r-2"></div>
                      <h4 className="font-serif text-sm font-bold text-brand-charcoal">Processing Payment Securely</h4>
                      <p className="text-[0.68rem] text-muted-foreground max-w-xs">Connecting with Razorpay servers and merchant bankers. Please do not close this modal window.</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-[0.7rem] font-bold text-brand-charcoal uppercase block mb-3">Choose Payment Method</span>
                        <div className="flex flex-col gap-2.5">
                          <label className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all ${paymentOption === 'Razorpay_UPI' ? "border-brand-orange bg-brand-orange/5" : "border-brand-beige"}`}>
                            <div className="flex items-center gap-3">
                              <input 
                                type="radio" 
                                name="payment-method"
                                checked={paymentOption === 'Razorpay_UPI'}
                                onChange={() => setPaymentOption('Razorpay_UPI')}
                                className="accent-brand-orange"
                              />
                              <span className="text-xs font-semibold text-brand-charcoal">BHIM UPI / GooglePay / PhonePe</span>
                            </div>
                            <span className="text-[0.65rem] text-muted-foreground font-bold bg-brand-beige px-1.5 py-0.5 rounded">UPI</span>
                          </label>

                          <label className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all ${paymentOption === 'Razorpay_Card' ? "border-brand-orange bg-brand-orange/5" : "border-brand-beige"}`}>
                            <div className="flex items-center gap-3">
                              <input 
                                type="radio" 
                                name="payment-method"
                                checked={paymentOption === 'Razorpay_Card'}
                                onChange={() => setPaymentOption('Razorpay_Card')}
                                className="accent-brand-orange"
                              />
                              <span className="text-xs font-semibold text-brand-charcoal">Credit / Debit Card</span>
                            </div>
                            <CreditCard className="h-4.5 w-4.5 text-muted-foreground" />
                          </label>

                          <label className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all ${paymentOption === 'COD' ? "border-brand-orange bg-brand-orange/5" : "border-brand-beige"}`}>
                            <div className="flex items-center gap-3">
                              <input 
                                type="radio" 
                                name="payment-method"
                                checked={paymentOption === 'COD'}
                                onChange={() => setPaymentOption('COD')}
                                className="accent-brand-orange"
                              />
                              <span className="text-xs font-semibold text-brand-charcoal">Cash on Delivery (COD)</span>
                            </div>
                            <span className="text-[0.65rem] text-muted-foreground font-bold bg-brand-beige px-1.5 py-0.5 rounded">Cash</span>
                          </label>
                        </div>
                      </div>

                      {/* Dynamic Option details */}
                      {paymentOption === 'Razorpay_Card' && (
                        <div className="flex flex-col gap-3.5 p-4 bg-brand-cream/40 border border-brand-beige rounded-xl animate-fade-in-up">
                          <div className="flex flex-col gap-1">
                            <label className="text-[0.62rem] font-bold uppercase text-brand-charcoal">Card Number</label>
                            <input 
                              type="text" 
                              placeholder="4111 2222 3333 4444"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                              maxLength={19}
                              className="border border-brand-beige rounded-lg px-3 py-1.8 text-xs focus:outline-none focus:border-brand-orange bg-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                              <label className="text-[0.62rem] font-bold uppercase text-brand-charcoal">Expiry (MM/YY)</label>
                              <input 
                                type="text" 
                                placeholder="12/28"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                maxLength={5}
                                className="border border-brand-beige rounded-lg px-3 py-1.8 text-xs focus:outline-none focus:border-brand-orange bg-white"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[0.62rem] font-bold uppercase text-brand-charcoal">CVV</label>
                              <input 
                                type="password" 
                                placeholder="123"
                                value={cardCVV}
                                onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, ''))}
                                maxLength={3}
                                className="border border-brand-beige rounded-lg px-3 py-1.8 text-xs focus:outline-none focus:border-brand-orange bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentOption === 'Razorpay_UPI' && (
                        <div className="p-4 bg-brand-cream/40 border border-brand-beige rounded-xl text-center text-xs animate-fade-in-up">
                          <p className="text-muted-foreground mb-2">Simply enter your VPA / UPI ID below to receive check notifications.</p>
                          <input 
                            type="text" 
                            placeholder="mehta@upi"
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs text-center w-full focus:outline-none focus:border-brand-orange bg-white uppercase font-bold"
                          />
                        </div>
                      )}

                      {/* Modal Actions */}
                      <div className="flex gap-3 border-t border-brand-beige pt-4 mt-2">
                        <button 
                          onClick={() => setShowPaymentModal(false)}
                          className="flex-1 py-2.5 border border-brand-beige hover:border-brand-gold rounded-lg text-xs font-bold text-brand-charcoal transition-colors hover:bg-brand-cream"
                        >
                          Cancel Checkout
                        </button>
                        <button 
                          onClick={executePayment}
                          className="flex-1 py-2.5 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                        >
                          Pay Securely ₹{totalPayable}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              /* Payment Successful Receipt */
              <div className="p-8 flex flex-col items-center justify-center text-center gap-6 animate-fade-in">
                <div className="h-16 w-16 bg-emerald-50 text-emerald-500 border-2 border-emerald-500 rounded-full flex items-center justify-center text-3xl font-bold">
                  ✓
                </div>
                <div>
                  <span className="text-[0.62rem] text-emerald-600 font-bold uppercase tracking-widest block mb-1">Payment Success</span>
                  <h3 className="font-serif text-xl font-bold text-brand-charcoal">Order Successfully Placed!</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mt-1.5">
                    Thank you! Your transaction has been recorded. We have sent the confirmation invoice details to your email.
                  </p>
                </div>

                <div className="bg-brand-cream border border-brand-beige rounded-xl p-4 w-full text-left flex flex-col gap-2.5 text-xs text-brand-charcoal">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Number:</span>
                    <span className="font-bold">{finalOrderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <span className="font-bold text-[0.65rem]">{receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Paid:</span>
                    <span className="font-serif font-bold text-brand-orange">₹{totalPayable}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Mode:</span>
                    <span className="font-bold">{paymentOption === 'COD' ? 'Cash on Delivery' : 'Razorpay gateway'}</span>
                  </div>
                </div>

                <button 
                  onClick={closeReceiptModal}
                  className="w-full py-3 bg-brand-orange hover:bg-brand-orange-hover text-white font-bold rounded-xl text-xs transition-colors shadow-md"
                >
                  Go to Order History
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
