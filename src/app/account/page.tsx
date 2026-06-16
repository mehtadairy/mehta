"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

const DEFAULT_CITIES = [
  "Ahmedabad",
  "Rajkot",
  "Surat",
  "Vadodara",
  "Gandhinagar",
  "Bhavnagar",
  "Jamnagar",
  "Junagadh",
  "Anand",
  "Nadiad",
  "Morbi"
];
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
  const [isOtpInputFocused, setIsOtpInputFocused] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setOtpError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setOtpError(err.message || "Failed to initialize Google login.");
      setIsLoading(false);
    }
  };

  // Account State
  const [activeTab, setActiveTab] = useState(initialTab);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [emailSendingInvoiceId, setEmailSendingInvoiceId] = useState<string | null>(null);
  
  // Profile Update State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Address creation form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrFlat, setAddrFlat] = useState("");
  const [addrArea, setAddrArea] = useState("");
  const [addrLandmark, setAddrLandmark] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPincode, setAddrPincode] = useState("");
  const [deliveryZones, setDeliveryZones] = useState<any[]>([]);
  const [customCities, setCustomCities] = useState<string[]>([]);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState<{ type: 'success' | 'warning' | 'error' | '', message: string }>({ type: '', message: '' });

  useEffect(() => {
    const fetchZones = async () => {
      const { data } = await supabase.from('delivery_zones').select('*');
      if (data) {
        const formattedZones: any[] = [];
        data.forEach((zone: any) => {
          const pincodesStr = zone.pincodes || zone.pincode || "";
          const pincodesArr = pincodesStr.split(",").map((p: string) => p.trim()).filter(Boolean);
          pincodesArr.forEach((pin: string) => {
            formattedZones.push({
              id: `${zone.id}-${pin}`,
              name: zone.name || zone.city || "Zone",
              city: zone.city || "",
              state: "Gujarat",
              pincode: pin
            });
          });
        });
        setDeliveryZones(formattedZones);
      }
    };
    fetchZones();
  }, []);

  // Load and sync data
  useEffect(() => {
    const loadData = async () => {
      if (typeof window === 'undefined') return;
      
      const loggedInStatus = localStorage.getItem("mehta_logged_in") === "true";
      const phone = localStorage.getItem("mehta_user_phone");
      const email = localStorage.getItem("mehta_user_email");
      setIsLoggedIn(loggedInStatus);

      // Verify active Supabase OAuth session on mount to handle session persistence
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && !loggedInStatus) {
        // Recover session if found
        const user = session.user;
        const userEmail = user.email || "";
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || "Google User";
        
        const { data: customer } = await supabase.from('customers').select('*').eq('email', userEmail).maybeSingle();
        
        localStorage.setItem("mehta_logged_in", "true");
        localStorage.setItem("mehta_user_name", customer?.name || userName);
        if (userEmail) localStorage.setItem("mehta_user_email", userEmail);
        if (customer?.phone) {
          localStorage.setItem("mehta_user_phone", customer.phone);
        }
        setIsLoggedIn(true);
        window.dispatchEvent(new Event("authUpdated"));
      }

      if (loggedInStatus && (phone || email)) {
        // Fetch Profile from API (by phone first, fallback to email)
        const queryParam = phone && phone !== 'null' ? `phone=${phone}` : `email=${email}`;
        fetch(`/api/user/profile?${queryParam}`)
          .then(res => res.json())
          .then(async data => {
            if (data.success && data.profile) {
              const { data: addrs } = await supabase.from('addresses').select('*').eq('customer_id', data.profile.id);
              const mappedAddrs = addrs?.map(a => ({
                 id: a.id,
                 name: a.full_name,
                 phone: a.mobile,
                 street: a.address,
                 landmark: a.landmark,
                 city: a.city,
                 state: a.state,
                 pincode: a.pincode,
                 isDefault: a.is_default
              })) || [];
              
              setProfile({ ...data.profile, saved_addresses: mappedAddrs });
              setEditName(data.profile.name || localStorage.getItem("mehta_user_name") || "");
              setEditPhone(data.profile.phone || phone || "");
              setEditEmail(data.profile.email || email || "");

              if (data.profile.phone && data.profile.phone !== phone) {
                localStorage.setItem("mehta_user_phone", data.profile.phone);
              }
            }
          })
          .catch(err => console.error("Error fetching profile:", err));

        // Load Orders if phone is available
        if (phone && phone !== 'null') {
          const { data: userOrders, error: ordersError } = await supabase
            .from('orders')
            .select('*, order_items(*), invoices(*)')
            .eq('user_phone', phone)
            .order('created_at', { ascending: false });

          if (!ordersError && userOrders) {
             const formattedOrders = userOrders.map((o: any) => ({
               id: o.id,
               orderNumber: o.order_number,
               date: new Date(o.created_at).toLocaleDateString(),
               status: o.status,
               total: o.total,
               subtotal: o.subtotal,
               discount: o.discount,
               couponCode: o.coupon_code,
               deliveryCharge: o.delivery_charge,
               shippingAddress: o.shipping_address,
               paymentMethod: o.payment_method,
               paymentStatus: o.payment_status,
               paymentId: o.payment_id,
               userName: o.user_name,
               userPhone: o.user_phone,
               userEmail: o.user_email,
               invoice: o.invoices && o.invoices.length > 0 ? o.invoices[0] : null,
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
        } else {
          setOrders([]);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("mehta_logged_in");
    localStorage.removeItem("mehta_user_phone");
    localStorage.removeItem("mehta_user_email");
    localStorage.removeItem("mehta_user_name");
    localStorage.removeItem("mehta_user_id");
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
        localStorage.setItem("mehta_logged_in", "true");
        localStorage.setItem("mehta_user_phone", otpPhone);
        if (data.profile?.id) localStorage.setItem("mehta_user_id", data.profile.id);
        if (data.profile?.name) localStorage.setItem("mehta_user_name", data.profile.name);
        if (data.profile?.email) localStorage.setItem("mehta_user_email", data.profile.email);
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
    const email = localStorage.getItem("mehta_user_email");

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phone || null, 
          email: email || null, 
          name: editName, 
          newPhone: editPhone,
          newEmail: editEmail
        })
      });
      const data = await res.json();
      
      if (data.success && data.profile) {
        setProfile(data.profile);
        localStorage.setItem("mehta_user_name", data.profile.name || "");
        if (data.profile.phone) {
          localStorage.setItem("mehta_user_phone", data.profile.phone);
        }
        if (data.profile.email) {
          localStorage.setItem("mehta_user_email", data.profile.email);
        }
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
        window.dispatchEvent(new Event("authUpdated"));
      }
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  const handleOpenAddressForm = () => {
    setAddrName(profile?.name || localStorage.getItem("mehta_user_name") || "");
    setAddrPhone(profile?.phone || localStorage.getItem("mehta_user_phone") || "");
    setAddrFlat("");
    setAddrArea("");
    setAddrLandmark("");
    setAddrCity("");
    setAddrState("");
    setAddrPincode("");
    setShowAddressForm(true);
  };

  // Add Address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrName || !addrPhone || !addrFlat || !addrArea || !addrCity || !addrState || !addrPincode || !profile) return;
    
    try {
      const fullAddress = `${addrFlat}, ${addrArea}`;
      const { data, error } = await supabase.from('addresses').insert([{
        customer_id: profile.id,
        full_name: addrName,
        mobile: addrPhone,
        address: fullAddress,
        landmark: addrLandmark || null,
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
        landmark: data.landmark,
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
      setAddrFlat("");
      setAddrArea("");
      setAddrLandmark("");
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
                      className="rounded-lg bg-brand-orange hover:bg-brand-orange-hover disabled:bg-brand-orange/50 py-2.8 text-xs font-bold text-white shadow-md transition-colors mt-2 flex justify-center items-center gap-2 cursor-pointer"
                    >
                      {isLoading ? "Sending..." : "Send OTP via SMS"}
                    </button>

                    <div className="relative flex py-1.5 items-center">
                      <div className="flex-grow border-t border-brand-beige"></div>
                      <span className="flex-shrink mx-3 text-[0.62rem] font-bold text-muted-foreground uppercase">Or continue with</span>
                      <div className="flex-grow border-t border-brand-beige"></div>
                    </div>

                    <button 
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full rounded-lg border border-brand-beige hover:border-brand-gold bg-white py-2.8 text-xs font-bold text-brand-charcoal shadow-sm transition-all hover:bg-brand-cream flex justify-center items-center gap-2 cursor-pointer"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      {isLoading ? "Connecting..." : "Continue with Google"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Enter OTP</label>
                      <p className="text-[0.65rem] text-muted-foreground mb-1">
                        Sent to +91 {otpPhone}. <button type="button" onClick={() => { setIsOtpSent(false); setOtpError(""); }} className="text-brand-orange underline">Change number</button>
                      </p>
                      <div className="relative w-full py-2 flex justify-between gap-2.5 items-center">
                        {/* Hidden input overlay for full interactive touch/focus coverage */}
                        <input 
                          type="tel" 
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          onFocus={() => setIsOtpInputFocused(true)}
                          onBlur={() => setIsOtpInputFocused(false)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-text z-20"
                          required
                          disabled={isLoading}
                          autoFocus
                        />
                        
                        {/* Interactive Grid of 6 Boxes */}
                        {Array.from({ length: 6 }).map((_, idx) => {
                          const char = otpCode[idx] || "";
                          const isActive = isOtpInputFocused && idx === otpCode.length;
                          const isFilled = char !== "";

                          return (
                            <div
                              key={idx}
                              className={`relative flex-1 h-12 rounded-xl border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                isActive
                                  ? "border-brand-orange bg-brand-orange/5 shadow-[0_0_8px_rgba(212,109,45,0.25)] scale-105"
                                  : isFilled
                                  ? "border-brand-charcoal bg-brand-cream/10 text-brand-charcoal"
                                  : "border-brand-beige bg-white text-muted-foreground"
                              }`}
                            >
                              <AnimatePresence mode="popLayout">
                                {char && (
                                  <motion.span
                                    initial={{ scale: 0.5, y: 5, opacity: 0 }}
                                    animate={{ scale: 1, y: 0, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="font-mono text-base font-black text-brand-charcoal"
                                  >
                                    {char}
                                  </motion.span>
                                )}
                              </AnimatePresence>

                              {/* Blinking Cursor */}
                              {isActive && (
                                <motion.div
                                  animate={{ opacity: [1, 0, 1] }}
                                  transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                                  className="absolute h-5 w-[2px] bg-brand-orange rounded-full"
                                />
                              )}
                            </div>
                          );
                        })}
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
                
                {/* Missing Phone Number Alert */}
                {isLoggedIn && profile && !profile.phone && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-950 mb-6 items-start animate-pulse">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-serif text-xs font-bold">Phone Number Required for Checkout</h4>
                      <p className="text-[0.7rem] text-amber-800 mt-1 leading-relaxed">
                        Please save a valid phone number in the form below. We need this to verify your orders, coordinate delivery details, and send invoice receipts.
                      </p>
                    </div>
                  </div>
                )}

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
                                  {order.shippingAddress?.name || "Customer"}<br />
                                  {order.shippingAddress?.street || ""}{order.shippingAddress?.city ? `, ${order.shippingAddress.city}` : ""}
                                </p>
                              </div>

                              {/* Customer Digital Invoice Actions section */}
                              <div className="border-t sm:border-t-0 border-brand-beige pt-3 sm:pt-0 w-full sm:w-auto text-xs text-brand-charcoal flex flex-col gap-2">
                                <h4 className="font-serif font-bold text-[0.68rem] text-muted-foreground uppercase mb-1">Digital Invoice</h4>
                                {order.invoice ? (
                                  <div className="flex flex-col gap-1.5 min-w-[150px]">
                                    <span className="text-[0.62rem] font-bold text-brand-gold bg-brand-cream/60 px-1.5 py-0.5 rounded border border-brand-beige text-center">
                                      {order.invoice.invoice_number}
                                    </span>
                                    <a 
                                      href={`/api/invoices/download?invoiceId=${order.invoice.id}`}
                                      className="py-1.5 border border-brand-beige hover:border-brand-gold bg-white text-brand-charcoal text-center text-[0.7rem] font-bold rounded-lg transition-colors hover:bg-brand-cream"
                                    >
                                      Download Invoice
                                    </a>
                                    <button 
                                      onClick={async () => {
                                        setEmailSendingInvoiceId(order.invoice.id);
                                        try {
                                          const res = await fetch("/api/invoices/send", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ invoiceId: order.invoice.id })
                                          });
                                          const data = await res.json();
                                          if (data.success) {
                                            window.dispatchEvent(
                                              new CustomEvent("showToast", {
                                                detail: { message: "Invoice sent successfully to your email.", type: "success" }
                                              })
                                            );
                                          } else {
                                            throw new Error(data.error || "Failed to send email");
                                          }
                                        } catch (err: any) {
                                          window.dispatchEvent(
                                            new CustomEvent("showToast", {
                                              detail: { message: err.message || "Failed to send email", type: "error" }
                                            })
                                          );
                                        } finally {
                                          setEmailSendingInvoiceId(null);
                                        }
                                      }}
                                      disabled={emailSendingInvoiceId === order.invoice.id}
                                      className="py-1.5 bg-brand-charcoal hover:bg-black text-white text-[0.7rem] font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-center"
                                    >
                                      {emailSendingInvoiceId === order.invoice.id ? "Sending..." : "Email Invoice"}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[0.68rem] text-muted-foreground animate-pulse leading-normal">
                                    Preparing invoice...
                                  </span>
                                )}
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
                          onClick={handleOpenAddressForm}
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-full">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Flat, House no., Building, Company, Apartment *</label>
                            <input 
                              type="text" 
                              placeholder="Flat/House No, Building, Company"
                              value={addrFlat}
                              onChange={(e) => setAddrFlat(e.target.value)}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Area, Street, Sector, Village *</label>
                            <input 
                              type="text" 
                              placeholder="Area, Street, Sector, Village"
                              value={addrArea}
                              onChange={(e) => setAddrArea(e.target.value)}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 col-span-full">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Landmark (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="E.g. near apollo hospital"
                            value={addrLandmark}
                            onChange={(e) => setAddrLandmark(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 col-span-full">
                          <div className="flex flex-col gap-1.5 relative">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Pincode *</label>
                            <input 
                              type="text" 
                              placeholder="380015"
                              value={addrPincode}
                              onChange={async (e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setAddrPincode(val);
                                
                                if (val.length < 6) {
                                  setPincodeStatus({ type: '', message: '' });
                                  return;
                               .0000;
                                }

                                setIsPincodeLoading(true);
                                setPincodeStatus({ type: '', message: '' });

                                try {
                                  const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
                                  const data = await res.json();

                                  if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
                                    const office = data[0].PostOffice[0];
                                    const fetchedCity = (office.Block && office.Block.toLowerCase() !== "na") ? office.Block : (office.District || office.Division || office.Name);
                                    const fetchedState = office.State;
                                    
                                    if (fetchedCity) {
                                      setCustomCities(prev => Array.from(new Set([...prev, fetchedCity])));
                                      setAddrCity(fetchedCity);
                                    }
                                    if (fetchedState) {
                                      setAddrState(fetchedState);
                                    }

                                    const { data: zones } = await supabase.from('delivery_zones').select('*');
                                    const activeZones = zones || deliveryZones;

                                    const matchedZone = activeZones.find((zone: any) => {
                                      const pincodesStr = zone.pincodes || zone.pincode || "";
                                      const pincodesArr = pincodesStr.split(",").map((p: string) => p.trim());
                                      return pincodesArr.includes(val);
                                    });

                                    if (matchedZone) {
                                      const charge = Number(matchedZone.delivery_charge) || 0;
                                      setPincodeStatus({
                                        type: 'success',
                                        message: `Serviceable Area! Shipping: ₹${charge} | Delivery: ${matchedZone.estimated_days || '1-2 Days'}`
                                      });
                                    } else {
                                      setPincodeStatus({
                                        type: 'warning',
                                        message: "This area is outside our home delivery region. Only Self Pickup will be available."
                                      });
                                    }
                                  } else {
                                    setPincodeStatus({
                                      type: 'error',
                                      message: "Invalid PIN code. Please enter a valid 6-digit Indian PIN code."
                                    });
                                    setAddrCity("");
                                    setAddrState("");
                                  }
                                } catch (err) {
                                  console.error("Error fetching pincode info:", err);
                                  setPincodeStatus({
                                    type: 'error',
                                    message: "Error fetching location details. Select City & State manually."
                                  });
                                } finally {
                                  setIsPincodeLoading(false);
                                }
                              }}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                              required
                            />
                            {isPincodeLoading && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand-orange border-t-transparent"></div>
                                <span className="text-[0.62rem] text-muted-foreground">Autofetching city & state...</span>
                              </div>
                            )}
                            {pincodeStatus.message && (
                              <p className={`text-[0.62rem] font-bold mt-1.5 ${
                                pincodeStatus.type === 'success' ? 'text-emerald-600' :
                                pincodeStatus.type === 'warning' ? 'text-amber-600' : 'text-red-500'
                              }`}>
                                {pincodeStatus.message}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">City *</label>
                            <select
                              value={addrCity}
                              onChange={(e) => setAddrCity(e.target.value)}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                              required
                            >
                              <option value="">Select City</option>
                              {Array.from(new Set([...deliveryZones.map(z => z.city), ...DEFAULT_CITIES, ...customCities])).filter(Boolean).sort().map((city) => (
                                <option key={city} value={city}>{city}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">State *</label>
                            <select
                              value={addrState}
                              onChange={(e) => setAddrState(e.target.value)}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                              required
                            >
                              <option value="">Select State</option>
                              {INDIAN_STATES.map((state) => (
                                <option key={state} value={state}>{state}</option>
                              ))}
                            </select>
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
                                {addr.landmark ? `Landmark: ${addr.landmark}, ` : ''}
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
