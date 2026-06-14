"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ProductCard from "@/components/ProductCard";
import { 
  getProfile, 
  saveProfile, 
  getOrders, 
  getCoupons,
  Product, 
  Order 
} from "@/lib/types";
import { fetchProducts, supabase } from "@/lib/supabaseClient";
import { 
  User, 
  ShoppingBag, 
  MapPin, 
  Heart, 
  Lock, 
  Mail, 
  Phone, 
  Plus, 
  Trash2, 
  LogOut, 
  Check, 
  AlertCircle 
} from "lucide-react";

function AccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "profile";

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // OTP Login State
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Account State
  const [activeTab, setActiveTab] = useState(initialTab);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  
  // Profile Update State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Address creation form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPincode, setAddrPincode] = useState("");

  // Load and sync data
  useEffect(() => {
    const loadData = async () => {
      if (typeof window === 'undefined') return;
      
      const loggedInStatus = localStorage.getItem("mehta_logged_in") === "true";
      const phone = localStorage.getItem("mehta_user_phone");
      setIsLoggedIn(loggedInStatus);

      if (loggedInStatus && phone) {
        // Fetch Profile from API
        fetch(`/api/user/profile?phone=${phone}`)
          .then(res => res.json())
          .then(async data => {
            if (data.success && data.profile) {
              const { data: addrs } = await supabase.from('addresses').select('*').eq('customer_id', data.profile.id);
              const mappedAddrs = addrs?.map(a => ({
                 id: a.id,
                 name: a.full_name,
                 phone: a.mobile,
                 street: a.address,
                 city: a.city,
                 state: a.state,
                 pincode: a.pincode,
                 isDefault: a.is_default
              })) || [];
              
              setProfile({ ...data.profile, saved_addresses: mappedAddrs });
              setEditName(data.profile.name);
              setEditPhone(data.profile.phone);
              setEditEmail(data.profile.email || "");
            }
          })
          .catch(err => console.error("Error fetching profile:", err));

        // Load Orders
        const { data: userOrders, error: ordersError } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('user_phone', phone)
          .order('created_at', { ascending: false });

        if (!ordersError && userOrders) {
           const formattedOrders = userOrders.map((o: any) => ({
             id: o.id,
             orderNumber: o.order_number,
             date: new Date(o.created_at).toLocaleDateString(),
             status: o.status,
             total: o.total,
             items: o.order_items ? o.order_items.map((i: any) => ({
                productId: i.product_id,
                productName: i.product_name,
                weight: i.weight,
                quantity: i.quantity,
                price: i.price,
                image: i.image
             })) : []
           }));
           setOrders(formattedOrders as any);
        } else {
           setOrders(getOrders());
        }

        // Load Wishlist products
        const storedWishlist = JSON.parse(localStorage.getItem("mehta_wishlist") || "[]");
        const allProducts = await fetchProducts();
        const w = storedWishlist.map((id: string) => allProducts.find(prod => prod.id === id)).filter(Boolean);
        setWishlistItems(w);
      }
      setIsLoading(false);
    };
    loadData();
  }, [activeTab]);

  // Sync tab from search query
  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "profile");
  }, [searchParams]);

  const handleLogout = () => {
    localStorage.removeItem("mehta_logged_in");
    localStorage.removeItem("mehta_user_phone");
    setIsLoggedIn(false);
    window.dispatchEvent(new Event("authUpdated"));
    router.push("/");
  };

  // OTP Login Functions
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpPhone) return;
    setIsLoading(true);
    setOtpError("");
    
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone })
      });
      const data = await res.json();
      
      if (data.success) {
        setIsOtpSent(true);
      } else {
        setOtpError(data.message || "Failed to send OTP.");
      }
    } catch (err) {
      setOtpError("An error occurred while sending OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpPhone || !otpCode) return;
    setIsLoading(true);
    setOtpError("");
    
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone, otp: otpCode })
      });
      const data = await res.json();
      
      if (data.success) {
        // Data contains profile from Supabase API
        localStorage.setItem("mehta_logged_in", "true");
        localStorage.setItem("mehta_user_phone", otpPhone);
        setProfile(data.profile);
        setIsLoggedIn(true);
        setOtpError("");
        window.dispatchEvent(new Event("authUpdated"));
      } else {
        setOtpError(data.message || "Invalid OTP.");
      }
    } catch (err) {
      setOtpError("An error occurred while verifying OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // Update Profile Info
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editPhone) return;
    
    const phone = localStorage.getItem("mehta_user_phone");
    if (!phone) return;

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: editName, email: editEmail })
      });
      const data = await res.json();
      
      if (data.success && data.profile) {
        setProfile(data.profile);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
        window.dispatchEvent(new Event("authUpdated"));
      }
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  // Add Address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrName || !addrPhone || !addrStreet || !addrCity || !addrState || !addrPincode || !profile) return;
    
    try {
      const { data, error } = await supabase.from('addresses').insert([{
        customer_id: profile.id,
        full_name: addrName,
        mobile: addrPhone,
        address: addrStreet,
        city: addrCity,
        state: addrState,
        pincode: addrPincode,
        is_default: !profile.saved_addresses || profile.saved_addresses.length === 0
      }]).select().single();

      if (error) throw error;

      const mappedAddr = {
        id: data.id,
        name: data.full_name,
        phone: data.mobile,
        street: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        isDefault: data.is_default
      };

      setProfile({
        ...profile,
        saved_addresses: [...(profile.saved_addresses || []), mappedAddr]
      });

      setShowAddressForm(false);
      setAddrName("");
      setAddrPhone("");
      setAddrStreet("");
      setAddrCity("");
      setAddrState("");
      setAddrPincode("");
    } catch (err) {
      console.error("Failed to add address", err);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id: string) => {
    try {
      const { error } = await supabase.from('addresses').delete().eq('id', id);
      if (error) throw error;
      
      setProfile({
        ...profile,
        saved_addresses: profile.saved_addresses.filter((a: any) => a.id !== id)
      });
    } catch (err) {
      console.error("Failed to delete address", err);
    }
  };

  // Remove from Wishlist
  const handleRemoveFromWishlist = async (id: string) => {
    const updated = wishlistItems.filter(item => item.id !== id);
    setWishlistItems(updated);
    const updatedIds = updated.map(i => i.id);
    localStorage.setItem("mehta_wishlist", JSON.stringify(updatedIds));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  return (
    <>
      <Header />
      <WhatsAppFloat />

      {/* --- NOT LOGGED IN AUTH SIMULATOR PANEL --- */}
      {!isLoggedIn ? (
        <section className="py-24 bg-brand-cream/35 flex items-center justify-center min-h-[500px]">
          <div className="bg-white border border-brand-beige rounded-2xl shadow-xl max-w-md w-full p-8 overflow-hidden">
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="font-serif text-2xl font-bold text-brand-charcoal">Login to your account</h2>
                  <p className="text-xs text-muted-foreground mt-1">Access order history, tracking status and saved addresses.</p>
                </div>
                
                {!isOtpSent ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Phone Number</label>
                      <div className="relative flex items-center border border-brand-beige rounded-lg bg-brand-cream/35 px-3 py-2 focus-within:border-brand-orange focus-within:bg-white transition-all">
                        <Phone className="h-4.5 w-4.5 text-muted-foreground mr-2" />
                        <span className="text-xs text-brand-charcoal font-bold mr-1">+91</span>
                        <input 
                          type="tel" 
                          placeholder="98765 43210"
                          value={otpPhone}
                          onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="w-full text-xs outline-none bg-transparent"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      {otpError && <p className="text-[0.65rem] text-red-500 mt-1">{otpError}</p>}
                    </div>

                    <button 
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading || otpPhone.length < 10}
                      className="rounded-lg bg-brand-orange hover:bg-brand-orange-hover disabled:bg-brand-orange/50 py-2.8 text-xs font-bold text-white shadow-md transition-colors mt-2 flex justify-center items-center gap-2"
                    >
                      {isLoading ? "Sending..." : "Send OTP via SMS"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Enter OTP</label>
                      <p className="text-[0.65rem] text-muted-foreground mb-1">
                        Sent to +91 {otpPhone}. <button type="button" onClick={() => { setIsOtpSent(false); setOtpError(""); }} className="text-brand-orange underline">Change number</button>
                      </p>
                      <div className="relative flex items-center border border-brand-beige rounded-lg bg-brand-cream/35 px-3 py-2 focus-within:border-brand-orange focus-within:bg-white transition-all">
                        <Lock className="h-4.5 w-4.5 text-muted-foreground mr-2" />
                        <input 
                          type="text" 
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full text-xs outline-none bg-transparent tracking-widest font-bold"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      {otpError && <p className="text-[0.65rem] text-red-500 mt-1">{otpError}</p>}
                      <p className="text-[0.6rem] text-muted-foreground">Use 123456 if in simulation mode.</p>
                    </div>

                    <button 
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isLoading || otpCode.length < 6}
                      className="rounded-lg bg-brand-orange hover:bg-brand-orange-hover disabled:bg-brand-orange/50 py-2.8 text-xs font-bold text-white shadow-md transition-colors mt-2 flex justify-center items-center gap-2"
                    >
                      {isLoading ? "Verifying..." : "Verify & Login"}
                    </button>
                  </>
                )}
              </div>
          </div>
        </section>
      ) : (
        /* --- LOGGED IN CUSTOMER DASHBOARD --- */
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Account Sidebar Navigation */}
              <aside className="lg:col-span-3 flex flex-col gap-2 bg-white border border-brand-beige p-5 rounded-2xl shadow-xs">
                <div className="flex items-center gap-3 border-b border-brand-beige pb-4 mb-3">
                  <div className="h-10 w-10 bg-brand-orange/10 rounded-full flex items-center justify-center text-brand-orange text-lg font-bold">
                    {profile?.name ? profile.name[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-brand-charcoal line-clamp-1">{profile?.name}</h3>
                    <span className="text-[0.65rem] text-muted-foreground">{profile?.email}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveTab("profile")}
                  className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "profile" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
                >
                  <User className="h-4 w-4" /> Edit Profile Details
                </button>
                <button 
                  onClick={() => setActiveTab("orders")}
                  className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "orders" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
                >
                  <ShoppingBag className="h-4 w-4" /> Order History ({orders.length})
                </button>
                <button 
                  onClick={() => setActiveTab("addresses")}
                  className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "addresses" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
                >
                  <MapPin className="h-4 w-4" /> Saved Address Book
                </button>
                <button 
                  onClick={() => setActiveTab("wishlist")}
                  className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${activeTab === "wishlist" ? "bg-brand-orange/10 text-brand-orange" : "text-brand-charcoal hover:bg-brand-cream"}`}
                >
                  <Heart className="h-4 w-4" /> Gifting Wishlist ({wishlistItems.length})
                </button>

                <div className="h-px bg-brand-beige my-2"></div>

                <button 
                  onClick={handleLogout}
                  className="w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Logout Account
                </button>
              </aside>

              {/* Main Content Pane */}
              <main className="lg:col-span-9 bg-white border border-brand-beige rounded-2xl p-6 sm:p-8 shadow-xs min-h-[400px]">
                
                {/* --- TAB 1: PROFILE DETAILS --- */}
                {activeTab === "profile" && (
                  <div className="flex flex-col gap-6 animate-fade-in">
                    <h3 className="font-serif text-lg font-bold text-brand-charcoal border-b border-brand-beige pb-3">
                      Edit Profile Details
                    </h3>
                    
                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 max-w-md">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Full Name</label>
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="border border-brand-beige rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Email Address (Optional)</label>
                        <input 
                          type="email" 
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="border border-brand-beige rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                          placeholder="Add your email"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Phone Number</label>
                        <input 
                          type="tel" 
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="border border-brand-beige rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                          required
                        />
                      </div>

                      <button 
                        type="submit"
                        className="rounded-lg bg-brand-orange hover:bg-brand-orange-hover py-2.5 text-xs font-bold text-white transition-colors mt-2 max-w-xs shadow-sm"
                      >
                        Save Profile Changes
                      </button>
                      {profileSuccess && (
                        <span className="text-[0.7rem] text-emerald-600 font-semibold flex items-center gap-1 mt-1 animate-pulse">
                          <Check className="h-4 w-4" /> Profile details saved successfully.
                        </span>
                      )}
                    </form>
                  </div>
                )}

                {/* --- TAB 2: ORDER HISTORY --- */}
                {activeTab === "orders" && (
                  <div className="flex flex-col gap-6 animate-fade-in">
                    <h3 className="font-serif text-lg font-bold text-brand-charcoal border-b border-brand-beige pb-3">
                      Order History
                    </h3>

                    {orders.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingBag className="h-12 w-12 text-brand-beige mb-3 mx-auto" />
                        <p className="text-xs text-muted-foreground">You haven't placed any orders yet.</p>
                        <Link href="/shop" className="mt-4 inline-flex rounded-lg bg-brand-orange px-5 py-2 text-xs font-bold text-white hover:bg-brand-orange-hover transition-all">Shop Sweets</Link>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6">
                        {orders.map((order) => (
                          <div key={order.id} className="border border-brand-beige rounded-xl overflow-hidden shadow-xs">
                            {/* Order mini banner */}
                            <div className="bg-brand-cream/40 p-4 border-b border-brand-beige flex flex-wrap gap-4 justify-between items-center text-xs text-brand-charcoal font-semibold">
                              <div className="flex gap-4">
                                <div>
                                  <span className="text-[0.62rem] text-muted-foreground block font-bold">ORDER PLACED</span>
                                  <span>{order.date}</span>
                                </div>
                                <div>
                                  <span className="text-[0.62rem] text-muted-foreground block font-bold">TOTAL VALUE</span>
                                  <span>₹{order.total}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[0.62rem] text-muted-foreground block font-bold">ORDER ID</span>
                                <span>{order.orderNumber}</span>
                              </div>
                            </div>

                            {/* Order Details Body */}
                            <div className="p-4 flex flex-col sm:flex-row gap-6 justify-between items-start">
                              <div className="flex-grow flex flex-col gap-3">
                                <div className="mb-4 bg-white p-3 rounded-xl border border-brand-beige">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-[0.65rem] font-bold text-brand-charcoal uppercase tracking-wider">Order Timeline</span>
                                    <span className="inline-flex max-w-fit items-center gap-1 rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-[0.65rem] font-bold text-brand-orange uppercase tracking-wider">
                                      {order.status}
                                    </span>
                                  </div>
                                  <div className="relative w-full h-1 bg-gray-100 rounded-full mt-3 mb-1">
                                    <div 
                                      className="absolute top-0 left-0 h-1 bg-emerald-500 rounded-full transition-all duration-1000"
                                      style={{ 
                                        width: order.status === 'Cancelled' ? '100%' :
                                               order.status === 'Delivered' ? '100%' : 
                                               order.status === 'Shipped' ? '66%' : 
                                               order.status === 'Processing' ? '33%' : '5%',
                                        backgroundColor: order.status === 'Cancelled' ? '#ef4444' : '#10b981'
                                      }}
                                    ></div>
                                  </div>
                                  <div className="flex justify-between text-[0.6rem] text-muted-foreground font-semibold px-1 mt-2">
                                    <span className={['Pending', 'Paid', 'Shipped', 'Delivered'].includes(order.status) ? 'text-emerald-700' : ''}>Placed</span>
                                    <span className={['Paid', 'Shipped', 'Delivered'].includes(order.status) ? 'text-emerald-700' : ''}>Confirmed</span>
                                    <span className={['Shipped', 'Delivered'].includes(order.status) ? 'text-emerald-700' : ''}>Shipped</span>
                                    <span className={order.status === 'Delivered' ? 'text-emerald-700' : order.status === 'Cancelled' ? 'text-red-600' : ''}>
                                      {order.status === 'Cancelled' ? 'Cancelled' : 'Delivered'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col gap-2.5 mt-1">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex gap-3 items-center text-xs">
                                      <img src={item.image} alt={item.productName} className="h-10 w-10 object-cover rounded-md bg-brand-cream border border-brand-beige" />
                                      <div>
                                        <h4 className="font-serif font-bold text-brand-charcoal leading-none mb-1">{item.productName}</h4>
                                        <span className="text-[0.65rem] text-muted-foreground">{item.weight} x {item.quantity}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="border-t sm:border-t-0 border-brand-beige pt-3 sm:pt-0 w-full sm:w-auto text-xs text-brand-charcoal">
                                <h4 className="font-serif font-bold text-[0.68rem] text-muted-foreground uppercase mb-1">Shipping Details</h4>
                                <p className="leading-relaxed">
                                  {order.shippingAddress.name}<br />
                                  {order.shippingAddress.street}, {order.shippingAddress.city}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* --- TAB 3: SAVED ADDRESSES --- */}
                {activeTab === "addresses" && (
                  <div className="flex flex-col gap-6 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-brand-beige pb-3">
                      <h3 className="font-serif text-lg font-bold text-brand-charcoal">
                        Address Book
                      </h3>
                      {!showAddressForm && (
                        <button 
                          onClick={() => setShowAddressForm(true)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:underline animate-pulse"
                        >
                          <Plus className="h-4 w-4" /> Add Address
                        </button>
                      )}
                    </div>

                    {showAddressForm && (
                      <form onSubmit={handleAddAddress} className="bg-brand-cream/35 border border-brand-beige rounded-xl p-5 flex flex-col gap-4 max-w-lg animate-fade-in-up">
                        <h4 className="font-serif text-xs font-bold text-brand-charcoal">Create Address</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Recipient Name *</label>
                            <input 
                              type="text" 
                              placeholder="Aarya Mehta"
                              value={addrName}
                              onChange={(e) => setAddrName(e.target.value)}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Phone Number *</label>
                            <input 
                              type="tel" 
                              placeholder="98765 43210"
                              value={addrPhone}
                              onChange={(e) => setAddrPhone(e.target.value)}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Street address *</label>
                          <input 
                            type="text" 
                            placeholder="Flat/House No, Building, Street"
                            value={addrStreet}
                            onChange={(e) => setAddrStreet(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">City *</label>
                            <input 
                              type="text" 
                              placeholder="Ahmedabad"
                              value={addrCity}
                              onChange={(e) => setAddrCity(e.target.value)}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">State *</label>
                            <input 
                              type="text" 
                              placeholder="Gujarat"
                              value={addrState}
                              onChange={(e) => setAddrState(e.target.value)}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Pincode *</label>
                            <input 
                              type="text" 
                              placeholder="380015"
                              value={addrPincode}
                              onChange={(e) => setAddrPincode(e.target.value)}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-2 border-t border-brand-beige pt-4">
                          <button 
                            type="button" 
                            onClick={() => setShowAddressForm(false)}
                            className="px-4 py-2 border border-brand-beige rounded-lg text-xs font-bold text-brand-charcoal"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="px-5 py-2 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg text-xs font-bold"
                          >
                            Add Address
                          </button>
                        </div>
                      </form>
                    )}

                    {!profile?.saved_addresses || profile.saved_addresses.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">No saved addresses found. Please add a billing/shipping address.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {profile?.saved_addresses?.map((addr: any) => (
                          <div key={addr.id} className="rounded-xl border border-brand-beige p-4 flex justify-between items-start bg-brand-cream/10">
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
                              <span className="text-[0.7rem] text-brand-charcoal font-semibold mt-2 block">
                                📞 {addr.phone}
                              </span>
                            </div>
                            
                            <button 
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              aria-label="Delete Address"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* --- TAB 4: WISHLIST --- */}
                {activeTab === "wishlist" && (
                  <div className="flex flex-col gap-6 animate-fade-in">
                    <h3 className="font-serif text-lg font-bold text-brand-charcoal border-b border-brand-beige pb-3">
                      My Wishlist
                    </h3>

                    {wishlistItems.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="h-12 w-12 text-brand-beige mb-3 mx-auto" />
                        <p className="text-xs text-muted-foreground">Your wishlist is currently empty.</p>
                        <Link href="/shop" className="mt-4 inline-flex rounded-lg bg-brand-orange px-5 py-2 text-xs font-bold text-white hover:bg-brand-orange-hover transition-all">Start Adding Items</Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {wishlistItems.map((item) => (
                          <div key={item.id} className="relative">
                            <ProductCard product={item} />
                            <button 
                              onClick={() => handleRemoveFromWishlist(item.id)}
                              className="absolute top-2 right-12 z-20 h-8 w-8 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors"
                              title="Remove from Wishlist"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </main>

            </div>
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}

export default function Account() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-brand-cream">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-orange"></div>
      </div>
    }>
      <AccountContent />
    </Suspense>
  );
}
