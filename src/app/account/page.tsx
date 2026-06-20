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
import WhatsAppOrderBtn from "@/components/WhatsAppOrderBtn";
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
  AlertCircle,
  Bell,
  Shield,
  Star,
  Award,
  TrendingUp,
  Clock,
  ArrowRight,
  ChevronRight,
  LayoutDashboard,
  Crown,
  Gift,
  Settings
} from "lucide-react";

const AnimatedCounter = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) {
      setCount(0);
      return;
    }
    const increment = Math.ceil(end / 40);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return <>{count}</>;
};

function AccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "dashboard";

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // OTP Login State
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isOtpInputFocused, setIsOtpInputFocused] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setOtpError("");
    try {
      const redirectUrl = searchParams.get("redirect") || "/account";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectUrl)}`,
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
  
  // New State variables for the redesign
  const [loyaltyPoints, setLoyaltyPoints] = useState(1250);
  const [loyaltyTier, setLoyaltyTier] = useState("Gold");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Profile Update State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [profileAvatar, setProfileAvatar] = useState<string>("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAvatar = localStorage.getItem("mehta_avatar_url");
      if (savedAvatar) {
        setProfileAvatar(savedAvatar);
      }
    }
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileAvatar(base64String);
        localStorage.setItem("mehta_avatar_url", base64String);
        window.dispatchEvent(new Event("avatarUpdated"));
      };
      reader.readAsDataURL(file);
    }
  };

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
        
        const redirectUrl = searchParams.get("redirect");
        if (redirectUrl) {
          router.push(redirectUrl);
        }
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

      {/* ── NOT LOGGED IN — SPLIT SCREEN AUTH ─────────────────────── */}
      {!isLoggedIn ? (
        <section className="min-h-[calc(100vh-80px)] flex items-stretch bg-[#FAF6EE] mt-20 sm:mt-24">
          <div className="flex flex-col lg:flex-row w-full max-w-7xl mx-auto shadow-2xl rounded-none lg:rounded-3xl overflow-hidden border border-[#EAE0D3] my-0 lg:my-8">

            {/* ── LEFT BRAND PANEL ──────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-10 overflow-hidden bg-[#2A1E17]"
            >
              {/* Background image */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{ backgroundImage: "url('/store_inside_counter.jpeg')" }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#2A1E17]/60 via-[#2A1E17]/40 to-[#2A1E17]/90" />

              {/* Top: Logo + badge */}
              <div className="relative z-10 flex flex-col gap-3">
                <span className="inline-flex items-center gap-2 bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] text-[0.65rem] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full w-fit">
                  ✦ Since 1972 Legacy
                </span>
                <h2 className="font-serif text-3xl font-bold text-white leading-tight mt-2">
                  Mehta Dairy
                </h2>
                <p className="text-xs text-white/70 leading-relaxed max-w-xs">
                  Serving authentic sweets, namkeens, and premium gift hampers from the heart of Palitana.
                </p>
              </div>

              {/* Trust indicators */}
              <div className="relative z-10 flex flex-col gap-3">
                {[
                  { icon: "✓", text: "50+ Years of Trust" },
                  { icon: "✓", text: "100% Authentic Ingredients" },
                  { icon: "✓", text: "Fresh Daily Production" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-3"
                  >
                    <span className="h-5 w-5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] text-[0.6rem] font-black flex-shrink-0">
                      {item.icon}
                    </span>
                    <span className="text-xs text-white/80 font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Customer testimonial */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4"
              >
                <p className="text-xs text-white/90 italic leading-relaxed">
                  "The kaju katli is absolutely divine. My family has been ordering from Mehta Dairy for over 20 years!"
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="h-7 w-7 rounded-full bg-[#D4AF37]/30 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] text-xs font-black">
                    P
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-bold text-white">Priya Shah</p>
                    <p className="text-[0.6rem] text-white/50">Loyal Customer, Ahmedabad</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-[#D4AF37] text-[0.6rem]">★</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* ── RIGHT AUTH CARD ──────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="flex-1 flex flex-col justify-center bg-white px-6 py-12 sm:px-10 lg:px-16"
            >
              <div className="max-w-sm mx-auto w-full">

                {/* Header */}
                <div className="mb-8">
                  <h1 className="font-serif text-3xl font-bold text-[#2A1E17]">
                    {isOtpSent ? "Enter Your OTP" : "Welcome Back"}
                  </h1>
                  <p className="text-xs text-[#7E6B5A] mt-1.5">
                    {isOtpSent
                      ? `We sent a 6-digit OTP to +91 ${otpPhone}`
                      : "Sign in to access orders, wishlist & saved addresses"}
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  {!isOtpSent ? (
                    <>
                      {/* Google Button — Primary */}
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 border-2 border-[#EAE0D3] hover:border-[#D46D2D]/40 bg-white hover:bg-[#FAF6EE] rounded-2xl py-4 text-sm font-bold text-[#2A1E17] shadow-sm transition-all cursor-pointer disabled:opacity-60 min-h-[56px]"
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                            className="h-5 w-5 rounded-full border-2 border-[#D46D2D] border-t-transparent"
                          />
                        ) : (
                          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                        )}
                        {isLoading ? "Connecting to Google…" : "Continue with Google"}
                      </motion.button>

                      {/* Divider */}
                      <div className="relative flex items-center">
                        <div className="flex-grow h-px bg-[#EAE0D3]" />
                        <span className="flex-shrink mx-4 text-[0.62rem] font-bold text-[#7E6B5A] uppercase tracking-widest">
                          Or sign in with mobile
                        </span>
                        <div className="flex-grow h-px bg-[#EAE0D3]" />
                      </div>

                      {/* Phone input — floating label */}
                      <div className="relative">
                        <div className={`flex items-center rounded-2xl border-2 bg-[#FAF6EE]/50 px-4 py-3.5 transition-all ${
                          focusedField === "phone"
                            ? "border-[#D46D2D] bg-white ring-4 ring-[#D46D2D]/10"
                            : "border-[#EAE0D3] hover:border-[#D46D2D]/40"
                        }`}>
                          <span className="text-sm font-bold text-[#2A1E17] mr-2">+91</span>
                          <div className="w-px h-5 bg-[#EAE0D3] mr-3" />
                          <Phone className="h-4 w-4 text-[#7E6B5A] mr-2 flex-shrink-0" />
                          <input
                            type="tel"
                            placeholder="98765 43210"
                            value={otpPhone}
                            onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            onFocus={() => setFocusedField("phone")}
                            onBlur={() => setFocusedField(null)}
                            className="flex-1 bg-transparent outline-none text-sm text-[#2A1E17] font-medium placeholder-[#7E6B5A]/50"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {otpError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 font-medium -mt-1"
                        >
                          {otpError}
                        </motion.p>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(212,109,45,0.3)" }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isLoading || otpPhone.length < 10}
                        className="w-full flex items-center justify-center gap-2 bg-[#D46D2D] hover:bg-[#BF5E23] disabled:bg-[#D46D2D]/40 text-white font-bold text-sm rounded-2xl py-4 shadow-lg transition-all cursor-pointer min-h-[52px]"
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                            className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                          />
                        ) : null}
                        {isLoading ? "Sending OTP…" : "Send OTP via SMS"}
                      </motion.button>
                    </>
                  ) : (
                    /* ── OTP INPUT PANEL ── */
                    <>
                      <button
                        type="button"
                        onClick={() => { setIsOtpSent(false); setOtpError(""); setOtpCode(""); }}
                        className="text-[0.68rem] text-[#D46D2D] font-bold hover:underline text-left -mt-2 cursor-pointer"
                      >
                        ← Change number
                      </button>

                      {/* 6-box OTP grid */}
                      <div className="relative w-full flex justify-between gap-2.5 items-center py-2">
                        <input
                          type="tel"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          onFocus={() => setIsOtpInputFocused(true)}
                          onBlur={() => setIsOtpInputFocused(false)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-text z-20"
                          required
                          disabled={isLoading}
                          autoFocus
                        />
                        {Array.from({ length: 6 }).map((_, idx) => {
                          const char = otpCode[idx] || "";
                          const isActive = isOtpInputFocused && idx === otpCode.length;
                          const isFilled = char !== "";
                          return (
                            <div
                              key={idx}
                              className={`relative flex-1 h-14 rounded-2xl border-2 flex items-center justify-center text-base font-bold transition-all duration-200 ${
                                isActive
                                  ? "border-[#D46D2D] bg-[#D46D2D]/5 shadow-[0_0_0_4px_rgba(212,109,45,0.15)] scale-105"
                                  : isFilled
                                  ? "border-[#2A1E17] bg-white text-[#2A1E17]"
                                  : "border-[#EAE0D3] bg-[#FAF6EE]"
                              }`}
                            >
                              <AnimatePresence mode="popLayout">
                                {char && (
                                  <motion.span
                                    initial={{ scale: 0.5, y: 5, opacity: 0 }}
                                    animate={{ scale: 1, y: 0, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="font-mono text-lg font-black text-[#2A1E17]"
                                  >
                                    {char}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                              {isActive && (
                                <motion.div
                                  animate={{ opacity: [1, 0, 1] }}
                                  transition={{ duration: 0.9, repeat: Infinity }}
                                  className="absolute h-6 w-0.5 bg-[#D46D2D] rounded-full"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {otpError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 font-medium"
                        >
                          {otpError}
                        </motion.p>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(212,109,45,0.3)" }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isLoading || otpCode.length < 6}
                        className="w-full flex items-center justify-center gap-2 bg-[#D46D2D] hover:bg-[#BF5E23] disabled:bg-[#D46D2D]/40 text-white font-bold text-sm rounded-2xl py-4 shadow-lg transition-all cursor-pointer min-h-[52px]"
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                            className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                          />
                        ) : null}
                        {isLoading ? "Verifying…" : "Verify & Login"}
                      </motion.button>

                      <p className="text-[0.62rem] text-[#7E6B5A] text-center">
                        Use <span className="font-bold text-[#D46D2D]">123456</span> in simulation mode.
                      </p>
                    </>
                  )}

                  {/* Footer trust note */}
                  <p className="text-[0.62rem] text-[#7E6B5A] text-center leading-relaxed mt-1">
                    By signing in, you agree to our{" "}
                    <Link href="/policy/terms" className="text-[#D46D2D] hover:underline font-semibold">Terms</Link>{" "}
                    &amp;{" "}
                    <Link href="/policy/privacy" className="text-[#D46D2D] hover:underline font-semibold">Privacy Policy</Link>.
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </section>
      ) : (
        /* --- LOGGED IN CUSTOMER DASHBOARD --- */
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Account Sidebar & Horizontal Mobile Navigation */}
              <aside className="hidden lg:flex col-span-12 lg:col-span-3 flex-col gap-2 bg-white border border-brand-beige/50 p-4 lg:p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-orange to-brand-gold"></div>
                
                <div className="hidden lg:flex items-center gap-4 border-b border-brand-beige/50 pb-5 mb-4 mt-2">
                  <div className="h-12 w-12 rounded-full overflow-hidden border border-brand-beige shadow-inner flex-shrink-0 relative bg-brand-cream flex items-center justify-center text-brand-charcoal text-lg font-black">
                    {profileAvatar ? (
                      <img src={profileAvatar} alt="Sidebar Profile Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profile?.name ? profile.name[0].toUpperCase() : "U"
                    )}
                    {isLoggedIn && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-serif text-sm font-bold text-brand-charcoal line-clamp-1">{profile?.name || "Guest User"}</h3>
                    <span className="text-[0.65rem] text-muted-foreground/80 font-medium truncate">{profile?.email || "No email set"}</span>
                  </div>
                </div>

                <nav className="flex flex-row lg:flex-col gap-2 lg:gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { id: 'settings', label: 'Settings', icon: Settings },
                    { id: 'orders', label: 'Orders', icon: ShoppingBag, count: orders.length },
                    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
                    { id: 'wishlist', label: 'Wishlist', icon: Heart, count: wishlistItems.length },
                    { id: 'notifications', label: 'Notifications', icon: Bell },
                    { id: 'security', label: 'Security', icon: Shield },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`relative text-left text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 overflow-hidden group flex-shrink-0 lg:flex-shrink-1 lg:w-full ${
                          isActive 
                            ? "text-brand-orange shadow-sm border border-brand-orange/20 bg-brand-orange/5" 
                            : "text-brand-charcoal hover:bg-brand-cream/50 border border-transparent"
                        }`}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="activeTabIndicator" 
                            className="absolute left-0 right-0 bottom-0 h-1 lg:h-auto lg:top-0 lg:bottom-0 lg:left-0 lg:w-1 bg-brand-orange" 
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <Icon className={`h-4 w-4 ${isActive ? "text-brand-orange" : "text-muted-foreground group-hover:text-brand-charcoal transition-colors"}`} /> 
                        <span className="flex-grow">{item.label}</span>
                        {item.count !== undefined && item.count > 0 && (
                          <span className={`px-1.5 py-0.5 rounded-md text-[0.6rem] font-black ${isActive ? "bg-brand-orange text-white" : "bg-brand-beige/50 text-brand-charcoal"}`}>
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  
                  {/* Mobile Logout Button (Inline) */}
                  <button 
                    onClick={handleLogout}
                    className="flex lg:hidden flex-shrink-0 text-left text-xs font-semibold px-4 py-3 rounded-xl items-center gap-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border border-transparent hover:border-red-100"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </nav>

                <div className="hidden lg:block h-px bg-brand-beige/50 my-4"></div>

                <button 
                  onClick={handleLogout}
                  className="hidden lg:flex w-full text-left text-xs font-semibold px-4 py-3 rounded-xl items-center gap-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border border-transparent hover:border-red-100"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </aside>

              {/* Main Content Pane */}
              <main className="col-span-12 lg:col-span-9 bg-white lg:border lg:border-brand-beige lg:rounded-2xl lg:p-8 lg:shadow-xs min-h-[400px] pb-24 lg:pb-8">
                
                {/* Universal Mobile Back Button for Sub-Views */}
                {activeTab !== "dashboard" && (
                  <button 
                    onClick={() => setActiveTab("dashboard")} 
                    className="flex lg:hidden items-center gap-1.5 text-xs font-bold text-brand-orange hover:text-brand-orange-hover mb-6 px-1"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to Account
                  </button>
                )}
                
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

                {/* --- TAB 0: DASHBOARD --- */}
                {activeTab === "dashboard" && (
                  <>
                    {/* DESKTOP VIEW */}
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="hidden lg:flex flex-col gap-8"
                    >
                    <div className="bg-gradient-to-r from-brand-cream/60 to-transparent p-6 rounded-2xl border border-brand-beige/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="font-serif text-3xl font-bold text-brand-charcoal mb-2">
                          Welcome back, {profile?.name ? profile.name.split(" ")[0] : "Guest"} 👋
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Here's an overview of your account and recent activities.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { title: "Total Orders", value: orders.length, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                        { title: "Wishlist Items", value: wishlistItems.length, icon: Heart, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-100" },
                        { title: "Saved Addresses", value: profile?.saved_addresses?.length || 0, icon: MapPin, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
                      ].map((stat, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          key={idx} 
                          className={`p-5 rounded-2xl border ${stat.border} bg-white shadow-sm flex flex-col gap-3 relative overflow-hidden group`}
                        >
                          <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.bg} opacity-50 group-hover:scale-150 transition-transform duration-500`}></div>
                          <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center relative z-10`}>
                            <stat.icon className="h-5 w-5" />
                          </div>
                          <div className="relative z-10">
                            <h4 className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider mb-1">{stat.title}</h4>
                            <span className="font-serif text-2xl font-bold text-brand-charcoal">
                              <AnimatedCounter value={stat.value} />
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Recent Activity Mini-Card */}
                      <div className="border border-brand-beige/50 rounded-2xl p-6 bg-white shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="font-serif text-lg font-bold text-brand-charcoal">Recent Activity</h3>
                          <button onClick={() => setActiveTab("orders")} className="text-xs text-brand-orange hover:text-brand-orange-hover font-bold flex items-center gap-1">
                            View All <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                        {orders.length > 0 ? (
                          <div className="flex flex-col gap-4">
                            {orders.slice(0, 3).map(o => (
                              <div key={o.id} className="flex items-center gap-4 border-b border-brand-beige/30 pb-4 last:border-0 last:pb-0">
                                <div className="h-10 w-10 rounded-lg bg-brand-cream/50 flex items-center justify-center text-brand-orange flex-shrink-0">
                                  <ShoppingBag className="h-5 w-5" />
                                  {o.status === "Delivered" && <Check className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 text-white rounded-full p-[1px]" />}
                                </div>
                                <div className="flex-grow">
                                  <h4 className="text-xs font-bold text-brand-charcoal">Order #{o.orderNumber}</h4>
                                  <span className="text-[0.65rem] text-muted-foreground">{o.date} • {o.items.length} items</span>
                                </div>
                                <div className="text-right">
                                  <span className="block text-xs font-bold text-brand-charcoal">₹{o.total}</span>
                                  <span className="text-[0.6rem] font-bold text-brand-orange uppercase">{o.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Clock className="h-8 w-8 text-brand-beige mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">No recent activity.</p>
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="border border-brand-beige/50 rounded-2xl p-6 bg-white shadow-sm">
                        <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-6">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setActiveTab("profile")} className="p-4 rounded-xl border border-brand-beige/50 hover:border-brand-orange/30 hover:bg-brand-orange/5 transition-all flex flex-col items-center justify-center gap-2 text-center group">
                            <User className="h-6 w-6 text-muted-foreground group-hover:text-brand-orange transition-colors" />
                            <span className="text-xs font-bold text-brand-charcoal">Edit Profile</span>
                          </button>
                          <button onClick={() => setActiveTab("addresses")} className="p-4 rounded-xl border border-brand-beige/50 hover:border-brand-orange/30 hover:bg-brand-orange/5 transition-all flex flex-col items-center justify-center gap-2 text-center group">
                            <MapPin className="h-6 w-6 text-muted-foreground group-hover:text-brand-orange transition-colors" />
                            <span className="text-xs font-bold text-brand-charcoal">Add Address</span>
                          </button>
                          <Link href="/shop" className="p-4 rounded-xl border border-brand-beige/50 hover:border-brand-orange/30 hover:bg-brand-orange/5 transition-all flex flex-col items-center justify-center gap-2 text-center group">
                            <Gift className="h-6 w-6 text-muted-foreground group-hover:text-brand-orange transition-colors" />
                            <span className="text-xs font-bold text-brand-charcoal">Shop Sweets</span>
                          </Link>
                          <button onClick={() => setActiveTab("security")} className="p-4 rounded-xl border border-brand-beige/50 hover:border-brand-orange/30 hover:bg-brand-orange/5 transition-all flex flex-col items-center justify-center gap-2 text-center group">
                            <Shield className="h-6 w-6 text-muted-foreground group-hover:text-brand-orange transition-colors" />
                            <span className="text-xs font-bold text-brand-charcoal">Security</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* MOBILE VIEW - NEW ACCOUNT DESIGN */}
                  <div className="flex lg:hidden flex-col gap-6 w-full max-w-md mx-auto animate-fade-in-up pb-8">
                    {/* Profile Header Card */}
                    <div className="bg-[#FAF6EE] rounded-[20px] p-5 flex flex-col justify-center shadow-sm relative overflow-hidden min-h-[90px]">
                      <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Crown className="w-24 h-24" />
                      </div>
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-white shadow-md relative bg-brand-cream flex items-center justify-center text-brand-charcoal text-xl font-black shrink-0">
                          {profileAvatar ? (
                            <img src={profileAvatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                          ) : (
                            profile?.name ? profile.name[0].toUpperCase() : "U"
                          )}
                        </div>
                        <div>
                          {profile?.name ? (
                            <>
                              <h3 className="font-serif text-lg font-bold text-[#4A2F1F] leading-tight">{profile.name}</h3>
                              <span className="text-[0.65rem] text-[#D97706] font-bold block truncate max-w-[200px] mb-1">{profile.email || profile.phone}</span>
                              <span className="text-[0.6rem] text-muted-foreground/80 font-bold uppercase tracking-wider block">Member Since {new Date().getFullYear()}</span>
                            </>
                          ) : (
                            <>
                              <h3 className="font-serif text-lg font-bold text-[#4A2F1F] leading-tight">Guest User</h3>
                              <span className="text-[0.65rem] text-[#D97706] font-bold block mb-1">Welcome to Mehta Dairy</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setActiveTab("orders")} className="bg-white border border-[#EAE0D3] rounded-[20px] p-4 flex flex-col items-center justify-center gap-2 shadow-sm min-h-[56px] active:scale-95 transition-transform group">
                        <ShoppingBag className="w-6 h-6 text-[#D97706] group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-[#4A2F1F]">My Orders</span>
                      </button>
                      <button onClick={() => setActiveTab("addresses")} className="bg-white border border-[#EAE0D3] rounded-[20px] p-4 flex flex-col items-center justify-center gap-2 shadow-sm min-h-[56px] active:scale-95 transition-transform group">
                        <MapPin className="w-6 h-6 text-[#D97706] group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-[#4A2F1F]">Addresses</span>
                      </button>
                      <button onClick={() => setActiveTab("wishlist")} className="bg-white border border-[#EAE0D3] rounded-[20px] p-4 flex flex-col items-center justify-center gap-2 shadow-sm min-h-[56px] active:scale-95 transition-transform group">
                        <Heart className="w-6 h-6 text-[#D97706] group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-[#4A2F1F]">Wishlist</span>
                      </button>
                      <Link href="/contact" className="bg-white border border-[#EAE0D3] rounded-[20px] p-4 flex flex-col items-center justify-center gap-2 shadow-sm min-h-[56px] active:scale-95 transition-transform group">
                        <Phone className="w-6 h-6 text-[#D97706] group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-[#4A2F1F]">Support</span>
                      </Link>
                    </div>

                    {/* Account Section List */}
                    <div className="bg-white border border-[#EAE0D3] rounded-[20px] overflow-hidden shadow-sm flex flex-col mt-2">
                      <button onClick={() => setActiveTab("settings")} className="flex items-center gap-3 p-4 border-b border-[#EAE0D3]/60 active:bg-[#FAF6EE] transition-colors text-left">
                        <div className="w-8 h-8 rounded-full bg-[#FAF6EE] flex items-center justify-center text-[#4A2F1F]"><Settings className="w-4 h-4" /></div>
                        <span className="text-sm font-bold text-[#4A2F1F] flex-grow">Account Settings</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                      </button>
                      <button onClick={() => {
                          if (window.confirm("Are you sure you want to log out?")) {
                            handleLogout();
                          }
                        }} className="flex items-center gap-3 p-4 active:bg-red-50 transition-colors text-left text-red-600">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600"><LogOut className="w-4 h-4" /></div>
                        <span className="text-sm font-bold flex-grow">Logout</span>
                        <ChevronRight className="w-4 h-4 text-red-300" />
                      </button>
                    </div>

                    {/* Recent Orders Snippet */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-4 px-1">
                        <h3 className="font-serif text-lg font-bold text-[#4A2F1F]">Recent Orders</h3>
                        <button onClick={() => setActiveTab("orders")} className="text-xs text-[#D97706] font-bold">View All</button>
                      </div>
                      {orders.length > 0 ? (
                        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-none pl-1 pr-4">
                          {orders.slice(0, 3).map(o => (
                            <div key={o.id} onClick={() => setActiveTab("orders")} className="bg-white border border-[#EAE0D3] rounded-2xl p-4 flex-shrink-0 w-64 shadow-sm active:scale-95 transition-transform cursor-pointer">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-[#4A2F1F]">Order #{o.orderNumber}</span>
                                <span className={`text-[0.65rem] font-bold uppercase px-2 py-0.5 rounded-full ${o.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                  {o.status}
                                </span>
                              </div>
                              <span className="text-[0.65rem] text-muted-foreground block mb-2">{o.date} • {o.items.length} items</span>
                              <span className="text-sm font-bold text-[#D97706]">₹{o.total}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-white border border-[#EAE0D3] rounded-2xl">
                          <p className="text-xs text-muted-foreground">No recent orders found.</p>
                        </div>
                      )}
                    </div>

                  </div>
                </>
                )}

                {/* --- TAB 1: SETTINGS DETAILS --- */}
                {activeTab === "settings" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-8"
                  >
                    {/* Premium Profile Card with Editable Avatar */}
                    <div className="bg-gradient-to-r from-brand-cream/60 to-transparent p-6 rounded-2xl border border-brand-beige/50 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
                      <div className="relative group flex-shrink-0">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md relative bg-brand-cream flex items-center justify-center text-3xl font-black text-brand-charcoal">
                          {profileAvatar ? (
                            <img src={profileAvatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                          ) : (
                            profile?.name ? profile.name[0].toUpperCase() : "U"
                          )}
                        </div>
                        <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[0.65rem] font-black cursor-pointer transition-opacity duration-300 select-none">
                          Change Photo
                        </label>
                        <input 
                          type="file" 
                          id="avatar-upload" 
                          accept="image/*" 
                          onChange={handleAvatarChange} 
                          className="hidden" 
                        />
                      </div>
                      <div className="text-center sm:text-left">
                        <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
                          <h3 className="font-serif text-xl font-bold text-brand-charcoal">{profile?.name || "Guest User"}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{profile?.email || "No email address set"}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-serif text-2xl font-bold text-brand-charcoal mb-2">
                        Personal Information
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Update your personal details and how we can reach you.
                      </p>
                    </div>
                    
                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6 max-w-xl bg-white border border-brand-beige/50 rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
                      {/* Decorative accent */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-orange to-brand-gold"></div>

                      {/* Full Name Input Container */}
                      <div className="relative pt-2">
                        <input 
                          type="text" 
                          id="editName"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder=" "
                          className="peer w-full border border-brand-beige/80 rounded-xl pl-10 pr-4 pt-6 pb-2 text-sm focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all bg-brand-cream/10 text-brand-charcoal"
                          required
                        />
                        <User className="absolute left-3.5 top-[25px] h-4 w-4 text-muted-foreground/75 peer-focus:text-brand-orange transition-colors" />
                        <label 
                          htmlFor="editName"
                          className="absolute left-10 top-1.5 text-[0.62rem] font-bold text-brand-charcoal uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-5.5 peer-placeholder-shown:text-muted-foreground/75 peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:text-brand-orange cursor-text"
                        >
                          Full Name
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Email Address Input Container */}
                        <div className="relative pt-2">
                          <input 
                            type="email" 
                            id="editEmail"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder=" "
                            className="peer w-full border border-brand-beige/80 rounded-xl pl-10 pr-4 pt-6 pb-2 text-sm focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all bg-brand-cream/10 text-brand-charcoal"
                          />
                          <Mail className="absolute left-3.5 top-[25px] h-4 w-4 text-muted-foreground/75 peer-focus:text-brand-orange transition-colors" />
                          <label 
                            htmlFor="editEmail"
                            className="absolute left-10 top-1.5 text-[0.62rem] font-bold text-brand-charcoal uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-5.5 peer-placeholder-shown:text-muted-foreground/75 peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:text-brand-orange cursor-text"
                          >
                            Email Address
                          </label>
                        </div>

                        {/* Phone Number Input Container */}
                        <div className="relative pt-2">
                          <input 
                            type="tel" 
                            id="editPhone"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder=" "
                            className="peer w-full border border-brand-beige/80 rounded-xl pl-10 pr-4 pt-6 pb-2 text-sm focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all bg-brand-cream/10 text-brand-charcoal"
                            required
                          />
                          <Phone className="absolute left-3.5 top-[25px] h-4 w-4 text-muted-foreground/75 peer-focus:text-brand-orange transition-colors" />
                          <label 
                            htmlFor="editPhone"
                            className="absolute left-10 top-1.5 text-[0.62rem] font-bold text-brand-charcoal uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-5.5 peer-placeholder-shown:text-muted-foreground/75 peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:text-brand-orange cursor-text"
                          >
                            Phone Number
                          </label>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-brand-beige/50 pt-6">
                        <div className="min-h-[24px]">
                          {profileSuccess && (
                            <motion.span 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-100"
                            >
                              <Check className="h-3.5 w-3.5" /> Saved successfully
                            </motion.span>
                          )}
                        </div>
                        <button 
                          type="submit"
                          className="rounded-xl bg-brand-orange hover:bg-brand-orange-hover px-6 py-3 text-xs font-bold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* --- TAB 2: ORDER HISTORY --- */}
                {activeTab === "orders" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-6"
                  >
                    <h3 className="font-serif text-lg font-bold text-brand-charcoal border-b border-brand-beige pb-3">
                      Order History
                    </h3>

                    {orders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white border border-[#EAE0D3] rounded-3xl shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-orange/5 rounded-full blur-3xl" />
                        
                        <div className="w-20 h-20 bg-[#FAF6EE] rounded-full flex items-center justify-center mb-5 shadow-inner border border-[#EAE0D3]">
                          <ShoppingBag className="h-8 w-8 text-brand-orange" />
                        </div>
                        <h4 className="font-serif text-xl font-bold text-brand-charcoal">No Orders Yet</h4>
                        <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-xs">
                          You haven't placed any orders yet. Discover our premium sweets and make your first order!
                        </p>
                        <Link href="/shop" className="inline-flex items-center justify-center rounded-xl bg-brand-charcoal px-6 py-3 text-sm font-bold text-white hover:bg-black hover:scale-105 active:scale-95 transition-all shadow-md">
                          Explore Sweets
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6">
                        {orders.map((order) => {
                          const isExpanded = expandedOrderId === order.id;
                          return (
                            <div key={order.id} className="border border-brand-beige rounded-xl overflow-hidden shadow-xs bg-white">
                              {/* Order Card Header (Mobile Optimized) */}
                              <div className="bg-white p-5 border-b border-[#EAE0D3] flex flex-col gap-3 relative">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-serif text-base font-bold text-[#4A2F1F] leading-tight max-w-[200px] truncate">
                                      {order.items.length > 0 ? order.items[0].productName : "Mehta Dairy Order"}
                                      {order.items.length > 1 ? ` +${order.items.length - 1} items` : ""}
                                    </h4>
                                    <span className="text-[0.65rem] text-muted-foreground font-bold">Order #{order.orderNumber}</span>
                                  </div>
                                  <span className={`text-[0.6rem] font-bold uppercase px-2.5 py-1 rounded-md tracking-wide ${
                                    order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                    order.status === 'Processing' ? 'bg-orange-100 text-orange-700' :
                                    order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                    order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    Status: {order.status}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-lg font-black text-[#D97706]">₹{order.total}</span>
                                  <button 
                                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                    className="bg-white border border-[#EAE0D3] text-[#4A2F1F] hover:bg-[#FAF6EE] text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm active:scale-95"
                                  >
                                    {isExpanded ? "Hide Details" : "View Details"}
                                  </button>
                                </div>
                              </div>

                              {/* Order Details Body */}
                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-4 flex flex-col sm:flex-row gap-6 justify-between items-start border-t border-brand-beige/50">
                                      <div className="flex-grow flex flex-col gap-3">
                                        <div className="mb-4 bg-white p-3 rounded-xl border border-brand-beige">
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="text-[0.65rem] font-bold text-brand-charcoal uppercase tracking-wider">Order Timeline</span>
                                            <span className="inline-flex max-w-fit items-center gap-1 rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-[0.65rem] font-bold text-brand-orange uppercase tracking-wider">
                                              {order.status}
                                            </span>
                                          </div>
                                          <div className="relative w-full h-1 bg-gray-100 rounded-full mt-3 mb-1">
                                            <motion.div 
                                              initial={{ width: "0%" }}
                                              animate={{ 
                                                width: order.status === 'Cancelled' ? '100%' :
                                                       order.status === 'Delivered' ? '100%' : 
                                                       order.status === 'Shipped' ? '66%' : 
                                                       order.status === 'Processing' ? '33%' : '5%'
                                              }}
                                              transition={{ duration: 0.8, ease: "easeOut" }}
                                              className="absolute top-0 left-0 h-1 rounded-full"
                                              style={{ 
                                                backgroundColor: order.status === 'Cancelled' ? '#ef4444' : '#10b981'
                                              }}
                                            ></motion.div>
                                          </div>
                                          <div className="flex justify-between text-[0.6rem] text-muted-foreground font-semibold px-1 mt-2">
                                            <span className={['Pending', 'Paid', 'Shipped', 'Delivered'].includes(order.status) ? 'text-emerald-700 font-bold' : ''}>Placed</span>
                                            <span className={['Paid', 'Shipped', 'Delivered'].includes(order.status) ? 'text-emerald-700 font-bold' : ''}>Confirmed</span>
                                            <span className={['Shipped', 'Delivered'].includes(order.status) ? 'text-emerald-700 font-bold' : ''}>Shipped</span>
                                            <span className={order.status === 'Delivered' ? 'text-emerald-700 font-bold' : order.status === 'Cancelled' ? 'text-red-600 font-bold' : ''}>
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
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20 lg:pb-0">
                        {profile?.saved_addresses?.map((addr: any) => (
                          <div key={addr.id} className="rounded-2xl border border-[#EAE0D3] p-5 flex flex-col gap-3 bg-white shadow-sm relative">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#D97706]" />
                                <span className="text-xs font-bold text-[#4A2F1F] uppercase tracking-wider">{addr.isDefault ? 'Home' : 'Other'}</span>
                              </div>
                              {addr.isDefault && (
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <h4 className="font-serif text-base font-bold text-[#4A2F1F]">{addr.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                {addr.street}{addr.landmark ? `, ${addr.landmark}` : ''}<br />
                                {addr.city}, {addr.state} {addr.pincode}
                              </p>
                              <span className="text-sm font-bold text-[#D97706] mt-2 block">
                                {addr.phone}
                              </span>
                            </div>
                            <div className="flex gap-3 border-t border-[#EAE0D3] pt-3 mt-1">
                              <button 
                                onClick={() => handleDeleteAddress(addr.id) /* Note: Edit functionality can be added later */}
                                className="text-xs font-bold text-[#4A2F1F] hover:text-[#D97706] transition-colors"
                              >
                                Edit
                              </button>
                              <span className="text-[#EAE0D3]">|</span>
                              <button 
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Floating Add Address Button (Mobile) */}
                    {!showAddressForm && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="fixed bottom-[4.5rem] left-0 right-0 p-4 flex justify-center pointer-events-none lg:hidden z-30"
                      >
                        <button 
                          onClick={handleOpenAddressForm}
                          className="pointer-events-auto flex items-center justify-center gap-2 bg-[#4A2F1F] text-white rounded-full px-6 py-3.5 shadow-lg active:scale-95 transition-transform"
                        >
                          <Plus className="w-5 h-5" />
                          <span className="text-sm font-bold tracking-wide">Add Address</span>
                        </button>
                      </motion.div>
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
                      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white border border-[#EAE0D3] rounded-3xl shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-48 h-48 bg-brand-gold/5 rounded-full blur-3xl" />
                        
                        <div className="w-20 h-20 bg-[#FAF6EE] rounded-full flex items-center justify-center mb-5 shadow-inner border border-[#EAE0D3]">
                          <Heart className="h-8 w-8 text-brand-orange" />
                        </div>
                        <h4 className="font-serif text-xl font-bold text-brand-charcoal">Wishlist is Empty</h4>
                        <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-xs">
                          Save your favorite sweets here to order them later.
                        </p>
                        <Link href="/shop" className="inline-flex items-center justify-center rounded-xl bg-brand-charcoal px-6 py-3 text-sm font-bold text-white hover:bg-black hover:scale-105 active:scale-95 transition-all shadow-md">
                          Discover Best Sellers
                        </Link>
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

                {/* --- TAB 5: NOTIFICATIONS --- */}
                {activeTab === "notifications" && (
                  <div className="flex flex-col gap-6 animate-fade-in">
                    <h3 className="font-serif text-lg font-bold text-brand-charcoal border-b border-brand-beige pb-3">
                      Notifications
                    </h3>
                    <div className="flex flex-col gap-4">
                      {orders.length > 0 ? (
                        <div className="border border-brand-beige rounded-2xl p-5 bg-white shadow-sm flex gap-4 items-start hover:border-brand-orange/30 transition-colors cursor-pointer group">
                          <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-brand-charcoal">Order #{orders[0].orderNumber} Update</h4>
                            <p className="text-[0.65rem] text-muted-foreground mt-1">Your order is currently <strong>{orders[0].status}</strong>. Thank you for shopping with Mehta Dairy!</p>
                            <span className="text-[0.55rem] text-muted-foreground/60 mt-2 block font-bold tracking-wider uppercase">Just Now</span>
                          </div>
                        </div>
                      ) : null}
                      <div className="border border-brand-beige rounded-2xl p-5 bg-brand-cream/20 shadow-sm flex gap-4 items-start hover:border-brand-orange/30 transition-colors cursor-pointer group">
                        <div className="h-10 w-10 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Star className="h-5 w-5 fill-brand-orange/20" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-brand-charcoal">Welcome to Mehta Dairy Premium</h4>
                          <p className="text-[0.65rem] text-muted-foreground mt-1">Explore our latest collection of luxury Indian sweets, carefully crafted since 1972.</p>
                          <span className="text-[0.55rem] text-muted-foreground/60 mt-2 block font-bold tracking-wider uppercase">2 Days Ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- TAB 6: SECURITY --- */}
                {activeTab === "security" && (
                  <div className="flex flex-col gap-8 animate-fade-in">
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-brand-charcoal mb-2">
                        Account Security
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Manage your connected accounts and active sessions.
                      </p>
                    </div>

                    <div className="bg-white border border-brand-beige/50 rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                      <h4 className="text-sm font-bold text-brand-charcoal mb-4 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-600" /> Authentication Methods
                      </h4>
                      
                      <div className="border border-brand-beige rounded-xl p-4 flex justify-between items-center bg-brand-cream/10">
                        <div className="flex items-center gap-4">
                          <img src="https://www.google.com/favicon.ico" alt="Google" className="h-8 w-8" />
                          <div>
                            <span className="block text-xs font-bold text-brand-charcoal">Google Account Connected</span>
                            <span className="text-[0.65rem] text-muted-foreground">{profile?.email || "Signed in via Google"}</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[0.6rem] font-bold text-emerald-600 uppercase">
                          <Check className="h-3 w-3" /> Verified
                        </span>
                      </div>
                    </div>
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
