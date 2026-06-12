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
  getProducts,
  Product, 
  Order, 
  Address 
} from "@/lib/mockData";
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

  // Login Simulator State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authFeedback, setAuthFeedback] = useState("");

  // Account State
  const [activeTab, setActiveTab] = useState(initialTab);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  
  // Profile Update State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
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
    if (typeof window === "undefined") return;

    const loggedInStatus = localStorage.getItem("mehta_logged_in") === "true";
    setIsLoggedIn(loggedInStatus);

    if (loggedInStatus) {
      // Load Profile
      const userProfile = getProfile();
      setProfile(userProfile);
      setEditName(userProfile.name);
      setEditPhone(userProfile.phone);

      // Load Orders
      setOrders(getOrders());

      // Load Wishlist products
      const allProducts = getProducts();
      const wishlistIds = JSON.parse(localStorage.getItem("mehta_wishlist") || "[]");
      const wishlistItems = allProducts.filter(p => wishlistIds.includes(p.id));
      setWishlist(wishlistItems);
    }
  }, [activeTab]);

  // Sync tab from search query
  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "profile");
  }, [searchParams]);

  // Login / Signup triggers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;

    // Simulated login success
    localStorage.setItem("mehta_logged_in", "true");
    setIsLoggedIn(true);
    setAuthFeedback("");
    window.dispatchEvent(new Event("authUpdated"));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || !authName || !authPhone) return;

    // Create user profile in mockData
    const newProfile = {
      name: authName,
      email: authEmail,
      phone: authPhone,
      savedAddresses: []
    };
    saveProfile(newProfile);
    localStorage.setItem("mehta_logged_in", "true");
    setIsLoggedIn(true);
    setAuthFeedback("");
    window.dispatchEvent(new Event("authUpdated"));
  };

  const handleLogout = () => {
    localStorage.removeItem("mehta_logged_in");
    setIsLoggedIn(false);
    window.dispatchEvent(new Event("authUpdated"));
    router.push("/");
  };

  // Update Profile Info
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editPhone) return;

    const updated = {
      ...profile,
      name: editName,
      phone: editPhone
    };
    setProfile(updated);
    saveProfile(updated);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
    window.dispatchEvent(new Event("authUpdated"));
  };

  // Add Address
  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrName || !addrPhone || !addrStreet || !addrCity || !addrState || !addrPincode) return;

    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      name: addrName,
      phone: addrPhone,
      street: addrStreet,
      city: addrCity,
      state: addrState,
      pincode: addrPincode,
      isDefault: !profile?.savedAddresses || profile.savedAddresses.length === 0
    };

    const updatedAddresses = [...(profile?.savedAddresses || []), newAddr];
    const updatedProfile = {
      ...profile,
      savedAddresses: updatedAddresses
    };
    setProfile(updatedProfile);
    saveProfile(updatedProfile);
    setShowAddressForm(false);

    // Reset Form
    setAddrName("");
    setAddrPhone("");
    setAddrStreet("");
    setAddrCity("");
    setAddrState("");
    setAddrPincode("");
  };

  // Delete Address
  const handleDeleteAddress = (id: string) => {
    const updatedAddresses = (profile?.savedAddresses || []).filter((a: Address) => a.id !== id);
    const updatedProfile = {
      ...profile,
      savedAddresses: updatedAddresses
    };
    setProfile(updatedProfile);
    saveProfile(updatedProfile);
  };

  // Remove from Wishlist
  const handleRemoveWishlist = (productId: string) => {
    const wishlistIds = JSON.parse(localStorage.getItem("mehta_wishlist") || "[]");
    const updatedIds = wishlistIds.filter((id: string) => id !== productId);
    localStorage.setItem("mehta_wishlist", JSON.stringify(updatedIds));
    
    // Refresh Wishlist view
    const allProducts = getProducts();
    setWishlist(allProducts.filter(p => updatedIds.includes(p.id)));
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
            {!showRegister ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="flex flex-col gap-5 animate-fade-in">
                <div className="text-center mb-2">
                  <h2 className="font-serif text-2xl font-bold text-brand-charcoal">Login Account</h2>
                  <p className="text-xs text-muted-foreground mt-1">Access order history, tracking status and saved addresses.</p>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Email Address</label>
                  <div className="relative flex items-center border border-brand-beige rounded-lg bg-brand-cream/35 px-3 py-2 focus-within:border-brand-orange focus-within:bg-white transition-all">
                    <Mail className="h-4.5 w-4.5 text-muted-foreground mr-2" />
                    <input 
                      type="email" 
                      placeholder="name@example.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full text-xs outline-none bg-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Password</label>
                  <div className="relative flex items-center border border-brand-beige rounded-lg bg-brand-cream/35 px-3 py-2 focus-within:border-brand-orange focus-within:bg-white transition-all">
                    <Lock className="h-4.5 w-4.5 text-muted-foreground mr-2" />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full text-xs outline-none bg-transparent"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="rounded-lg bg-brand-orange hover:bg-brand-orange-hover py-2.8 text-xs font-bold text-white shadow-md transition-colors mt-2"
                >
                  Log In
                </button>

                <div className="text-center text-xs text-muted-foreground mt-2">
                  Don't have an account?{" "}
                  <button 
                    type="button" 
                    onClick={() => setShowRegister(true)}
                    className="text-brand-orange font-bold hover:underline"
                  >
                    Register / Sign Up
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegister} className="flex flex-col gap-4 animate-fade-in">
                <div className="text-center mb-2">
                  <h2 className="font-serif text-2xl font-bold text-brand-charcoal">Create Account</h2>
                  <p className="text-xs text-muted-foreground mt-1">Sign up to unlock special coupons and quick checkout options.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Aarya Mehta"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="border border-brand-beige rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="name@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="border border-brand-beige rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="98765 43210"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="border border-brand-beige rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Password</label>
                  <input 
                    type="password" 
                    placeholder="Create Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="border border-brand-beige rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>

                <button 
                  type="submit"
                  className="rounded-lg bg-brand-orange hover:bg-brand-orange-hover py-2.8 text-xs font-bold text-white shadow-md transition-colors mt-2"
                >
                  Create Account & Register
                </button>

                <div className="text-center text-xs text-muted-foreground mt-2">
                  Already have an account?{" "}
                  <button 
                    type="button" 
                    onClick={() => setShowRegister(false)}
                    className="text-brand-orange font-bold hover:underline"
                  >
                    Sign In / Log In
                  </button>
                </div>
              </form>
            )}
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
                  <Heart className="h-4 w-4" /> Gifting Wishlist ({wishlist.length})
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
                        <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Email Address (Read-only)</label>
                        <input 
                          type="email" 
                          value={profile?.email}
                          className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-brand-cream/35 text-muted-foreground outline-none cursor-not-allowed"
                          disabled
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
                                <span className="inline-flex max-w-fit items-center gap-1 rounded-full bg-brand-orange/10 px-2.5 py-0.8 text-[0.65rem] font-bold text-brand-orange uppercase tracking-wider">
                                  ● Status: {order.status}
                                </span>
                                
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

                    {!profile?.savedAddresses || profile.savedAddresses.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">No saved addresses found. Please add a billing/shipping address.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {profile?.savedAddresses?.map((addr: Address) => (
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

                    {wishlist.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="h-12 w-12 text-brand-beige mb-3 mx-auto" />
                        <p className="text-xs text-muted-foreground">Your wishlist is currently empty.</p>
                        <Link href="/shop" className="mt-4 inline-flex rounded-lg bg-brand-orange px-5 py-2 text-xs font-bold text-white hover:bg-brand-orange-hover transition-all">Start Adding Items</Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {wishlist.map((item) => (
                          <div key={item.id} className="relative">
                            <ProductCard product={item} />
                            <button 
                              onClick={() => handleRemoveWishlist(item.id)}
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
