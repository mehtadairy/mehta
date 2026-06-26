"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { BUSINESS } from "@/lib/businessConfig";


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
  Settings,
  X,
  Loader2,
  ShoppingCart
} from "lucide-react";
import { useLocation } from "@/lib/context/LocationContext";

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
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // OTP Login State
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isOtpInputFocused, setIsOtpInputFocused] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    // Moved to Login Page
  };

  // Account State
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleOrderAgain = (items: any[]) => {
    const currentCart = JSON.parse(localStorage.getItem("mehta_cart") || "[]");

    items.forEach(item => {
      const existingIdx = currentCart.findIndex((i: any) => i.productId === item.productId && i.weight === item.weight);
      if (existingIdx > -1) {
        currentCart[existingIdx].quantity += item.quantity;
      } else {
        currentCart.push({
          productId: item.productId,
          productName: item.productName,
          image: item.image || '/sweets/default.jpg',
          weight: item.weight,
          price: item.price,
          quantity: item.quantity
        });
      }
    });

    localStorage.setItem("mehta_cart", JSON.stringify(currentCart));
    window.dispatchEvent(new Event("cartUpdated"));
    router.push("/cart");
  };
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

  // Push Notification State
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);

  const { nearestBranch, distanceKm } = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAvatar = localStorage.getItem("mehta_avatar_url");
      if (savedAvatar) {
        setProfileAvatar(savedAvatar);
      }
    }
  }, []);

  // Sync activeTab with URL search params (Fixes back navigation glitch)
  useEffect(() => {
    const tab = searchParams.get("tab") || "dashboard";
    setActiveTab(tab);
  }, [searchParams]);

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
  const [addrNickname, setAddrNickname] = useState("Home");
  const [isDefaultAddr, setIsDefaultAddr] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState<any[]>([]);
  const [customCities, setCustomCities] = useState<string[]>([]);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState<{ type: 'success' | 'warning' | 'error' | '', message: string }>({ type: '', message: '' });
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [addrLat, setAddrLat] = useState<number | null>(null);
  const [addrLng, setAddrLng] = useState<number | null>(null);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      window.dispatchEvent(new CustomEvent("showToast", { detail: { message: "Geolocation not supported by your browser", type: "error" } }));
      return;
    }
    setLocationStatus("loading");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setAddrLat(latitude);
        setAddrLng(longitude);
        try {
          // Attempt to reverse geocode using Nominatim (free) as a fallback for Google Maps API
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.address) {
            setAddrCity(data.address.city || data.address.state_district || "");
            setAddrState(data.address.state || "");
            setAddrPincode(data.address.postcode || "");
            setAddrArea(data.display_name || data.address.suburb || data.address.neighbourhood || data.address.road || "");
            setAddrFlat(data.address.house_number || data.address.building || data.address.residential || "Current Location");
            setLocationStatus("success");
            window.dispatchEvent(new CustomEvent("showToast", { detail: { message: "Location detected successfully!", type: "success" } }));
          } else {
            setLocationStatus("success");
          }
        } catch (e) {
          setLocationStatus("error");
          window.dispatchEvent(new CustomEvent("showToast", { detail: { message: "Failed to reverse geocode location", type: "error" } }));
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        setLocationStatus("error");
        window.dispatchEvent(new CustomEvent("showToast", { detail: { message: "Location permission denied", type: "error" } }));
      }
    );
  };

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

      // Verify active Supabase session
      const { data: { user } } = await supabase.auth.getUser();
      let customerId: string | null = null;
      let customerProfile: any = null;

      if (user) {
        // GOOGLE AUTH USER
        setIsLoggedIn(true);
        localStorage.setItem("mehta_logged_in", "true");

        // Fetch securely via auth_user_id
        const { data: customer } = await supabase
          .from('customers')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();

        if (customer) {
          customerProfile = customer;
          customerId = customer.id;
          localStorage.setItem("mehta_user_name", customer.name || user.user_metadata?.full_name || "");
          if (customer.email) localStorage.setItem("mehta_user_email", customer.email);
          if (customer.phone) localStorage.setItem("mehta_user_phone", customer.phone);
        }
      } else if (loggedInStatus && phone && phone !== 'null') {
        // OTP USER FALLBACK
        try {
          const res = await fetch(`/api/user/profile?phone=${phone}`);
          const data = await res.json();
          if (data.success && data.profile) {
            customerProfile = data.profile;
            customerId = data.profile.id;
          }
        } catch (err) {
          console.error("Error fetching OTP profile:", err);
        }
      } else {
        // NO SESSION
        setIsAuthChecking(false);
        router.push("/login?redirect=/account");
        return;
      }

      if (customerProfile && customerId) {
        if (!customerProfile.phone) {
          setIsAuthChecking(false);
          router.push("/complete-profile?redirect=/account");
          return;
        }
        // Load Addresses
        const { data: addrs } = await supabase.from('addresses').select('*').eq('customer_id', customerId);
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

        setProfile({ ...customerProfile, saved_addresses: mappedAddrs });
        setEditName(customerProfile.name || localStorage.getItem("mehta_user_name") || "");
        setEditPhone(customerProfile.phone || phone || "");
        setEditEmail(customerProfile.email || email || "");

        // Load Orders securely by customer_id if available, fallback to phone if OTP
        let orderQuery = supabase.from('orders').select('*, order_items(*), invoices(*)');
        // If we know the customer ID, use it. Otherwise, fallback to phone (OTP).
        if (customerId) {
           orderQuery = orderQuery.eq('customer_id', customerId);
        } else {
           orderQuery = orderQuery.eq('user_phone', customerProfile.phone);
        }
        
        const { data: userOrders, error: ordersError } = await orderQuery.order('created_at', { ascending: false });

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
          setOrders([]);
        }

        // Load Wishlist products
        const storedWishlist = JSON.parse(localStorage.getItem("mehta_wishlist") || "[]");
        const allProducts = await fetchProducts();
        const w = storedWishlist.map((id: string) => allProducts.find(prod => prod.id === id)).filter(Boolean);
        setWishlistItems(w);
      }
      
      setIsLoading(false);
      setIsAuthChecking(false);
    };
    loadData();
  }, [activeTab]);

  // Sync tab from search query
  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "dashboard");
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

  // OTP Login Functions moved to /login/page.tsx

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
    setAddrLat(null);
    setAddrLng(null);
    setLocationStatus("idle");
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
        is_default: isDefaultAddr || (!profile.saved_addresses || profile.saved_addresses.length === 0)
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
        isDefault: data.is_default,
        nickname: addrNickname
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
      setAddrLat(null);
      setAddrLng(null);
      setLocationStatus("idle");
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

  const handleTogglePush = async () => {
    setIsPushLoading(true);
    try {
      if (!isPushEnabled) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };

            const reg = await navigator.serviceWorker.register('/sw.js');
            let sub = await reg.pushManager.getSubscription();
            if (!sub) {
              const res = await fetch('/api/vapidPublicKey');
              const { publicKey } = await res.json();
              if (publicKey) {
                const convertedVapidKey = urlBase64ToUint8Array(publicKey);
                sub = await reg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: convertedVapidKey
                });
              }
            }

            if (sub && profile?.phone) {
              await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: sub, location: loc, phone: profile.phone })
              });
              setIsPushEnabled(true);
              window.dispatchEvent(new CustomEvent("showToast", { detail: { message: "Live notifications enabled!", type: "success" } }));
            }
          }, (err) => {
            console.error("Location error:", err);
            window.dispatchEvent(new CustomEvent("showToast", { detail: { message: "Location required for real-time tracking alerts.", type: "error" } }));
          });
        }
      } else {
        setIsPushEnabled(false);
        // We don't unsubscribe from the browser, just stop sending from the server.
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPushLoading(false);
    }
  };

  // Utility function for vapid keys
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return (
    <>
      <Header />
      <WhatsAppFloat />

      {/* ── NOT LOGGED IN ─────────────────────── */}
      {isAuthChecking ? (
        <section className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#FAF6EE] mt-20 sm:mt-24">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 border-4 border-[#D97706] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-[#4A2F1F]">Checking account session...</p>
          </div>
        </section>
      ) : !isLoggedIn ? (
        <section className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#FAF6EE] mt-20 sm:mt-24">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 border-4 border-[#D97706] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-[#4A2F1F]">Redirecting to Login...</p>
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
                        className={`relative text-left text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 overflow-hidden group flex-shrink-0 lg:flex-shrink-1 lg:w-full ${isActive
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
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col gap-5 lg:hidden"
                    >
                      {/* Profile Summary Card */}
                      <div className="relative bg-[#FAF6EE] rounded-2xl p-6 border border-[#EAE0D3] overflow-hidden flex items-center gap-4 shadow-sm">
                        <Crown className="absolute -right-4 -bottom-4 w-32 h-32 text-[#EAE0D3] opacity-50" strokeWidth={1} />
                        <div className="h-14 w-14 rounded-full bg-white border border-[#EAE0D3] shadow-sm flex items-center justify-center text-xl font-black text-[#2A1E17] flex-shrink-0 z-10">
                          {profile?.name ? profile.name[0].toUpperCase() : "A"}
                        </div>
                        <div className="z-10 flex-grow">
                          <h2 className="font-serif text-lg font-bold text-[#4A2F1F] leading-tight">
                            {profile?.name || "Customer"}
                          </h2>
                          <p className="text-[0.65rem] font-bold text-[#D46D2D] mb-1">
                            {profile?.email || profile?.phone || "No email provided"}
                          </p>
                          <p className="text-[0.6rem] font-bold text-[#2A1E17] uppercase tracking-widest">
                            MEMBER SINCE {new Date().getFullYear()}
                          </p>
                        </div>
                      </div>

                      {/* 2x2 Grid Actions */}
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setActiveTab("orders")} className="bg-white border border-[#EAE0D3] rounded-2xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:border-[#D46D2D] transition-colors">
                          <ShoppingBag className="w-6 h-6 text-[#D46D2D]" strokeWidth={1.5} />
                          <span className="font-serif text-[0.8rem] font-bold text-[#4A2F1F]">My Orders</span>
                        </button>
                        <button onClick={() => setActiveTab("addresses")} className="bg-white border border-[#EAE0D3] rounded-2xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:border-[#D46D2D] transition-colors">
                          <MapPin className="w-6 h-6 text-[#D46D2D]" strokeWidth={1.5} />
                          <span className="font-serif text-[0.8rem] font-bold text-[#4A2F1F]">Addresses</span>
                        </button>
                        <button onClick={() => setActiveTab("wishlist")} className="bg-white border border-[#EAE0D3] rounded-2xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:border-[#D46D2D] transition-colors">
                          <Heart className="w-6 h-6 text-[#D46D2D]" strokeWidth={1.5} />
                          <span className="font-serif text-[0.8rem] font-bold text-[#4A2F1F]">Wishlist</span>
                        </button>
                        <Link href="/contact" className="bg-white border border-[#EAE0D3] rounded-2xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:border-[#D46D2D] transition-colors">
                          <Phone className="w-6 h-6 text-[#D46D2D]" strokeWidth={1.5} />
                          <span className="font-serif text-[0.8rem] font-bold text-[#4A2F1F]">Support</span>
                        </Link>
                      </div>

                      {/* List Actions */}
                      <div className="bg-white border border-[#EAE0D3] rounded-2xl overflow-hidden shadow-sm flex flex-col">
                        <button onClick={() => setActiveTab("settings")} className="flex items-center justify-between p-4 border-b border-[#EAE0D3] hover:bg-[#FAF6EE] transition-colors">
                          <div className="flex items-center gap-3">
                            <Settings className="w-5 h-5 text-[#7E6B5A]" strokeWidth={1.5} />
                            <span className="font-serif text-[0.85rem] font-bold text-[#4A2F1F]">Account Settings</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#7E6B5A]" />
                        </button>
                        <button onClick={handleLogout} className="flex items-center justify-between p-4 hover:bg-[#FAF6EE] transition-colors">
                          <div className="flex items-center gap-3">
                            <LogOut className="w-5 h-5 text-red-500" strokeWidth={1.5} />
                            <span className="font-serif text-[0.85rem] font-bold text-red-600">Logout</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-red-400" />
                        </button>
                      </div>

                      {/* Recent Orders Section */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-serif text-xl font-bold text-[#4A2F1F]">Recent Orders</h3>
                          <button onClick={() => setActiveTab("orders")} className="text-[0.7rem] font-bold text-[#D46D2D] uppercase tracking-wider">
                            View All
                          </button>
                        </div>
                        {orders.length > 0 ? (
                          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none">
                            {orders.slice(0, 5).map(o => (
                              <div key={o.id} className="min-w-[240px] snap-start bg-white border border-[#EAE0D3] rounded-2xl p-4 shadow-sm flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                  <span className="font-serif text-[0.8rem] font-bold text-[#2A1E17]">
                                    Order #{o.orderNumber || o.id.slice(0, 6)}
                                  </span>
                                  <span className={`text-[0.55rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${o.status === 'Processing' ? 'bg-[#D46D2D]/10 text-[#D46D2D]' : o.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {o.status}
                                  </span>
                                </div>
                                <div className="text-[0.65rem] text-[#7E6B5A] mb-1">
                                  {o.date} • {o.items?.length || 0} items
                                </div>
                                <div className="font-bold text-[#D46D2D] mt-auto">
                                  ₹{o.total}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-white border border-[#EAE0D3] rounded-2xl">
                            <ShoppingBag className="w-8 h-8 text-[#EAE0D3] mx-auto mb-2" />
                            <p className="text-xs text-[#7E6B5A]">No recent orders found.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Desktop View */}
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
                                  </div>
                                  <div className="flex-grow">
                                    <h4 className="text-xs font-bold text-brand-charcoal">Order #{o.orderNumber || o.id.slice(0, 6)}</h4>
                                    <span className="text-[0.65rem] text-muted-foreground">{o.date} • {o.items?.length || 0} items</span>
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

                        <div className="border border-brand-beige/50 rounded-2xl p-6 bg-white shadow-sm">
                          <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-6">Quick Actions</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setActiveTab("settings")} className="p-4 rounded-xl border border-brand-beige/50 hover:border-brand-orange/30 hover:bg-brand-orange/5 transition-all flex flex-col items-center justify-center gap-2 text-center group">
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
                            readOnly={!!profile?.email}
                            placeholder=" "
                            className={`peer w-full border border-brand-beige/80 rounded-xl pl-10 pr-4 pt-6 pb-2 text-sm focus:outline-none transition-all ${
                              profile?.email 
                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                                : 'focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 bg-brand-cream/10 text-brand-charcoal'
                            }`}
                          />
                          <Mail className="absolute left-3.5 top-[25px] h-4 w-4 text-muted-foreground/75 peer-focus:text-brand-orange transition-colors" />
                          <label
                            htmlFor="editEmail"
                            className="absolute left-10 top-1.5 text-[0.62rem] font-bold text-brand-charcoal uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-5.5 peer-placeholder-shown:text-muted-foreground/75 peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:text-brand-orange cursor-text"
                          >
                            Email Address {profile?.email && "(Verified)"}
                          </label>
                        </div>

                        {/* Phone Number Input Container */}
                        <div className="relative pt-2">
                          <input
                            type="tel"
                            id="editPhone"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            readOnly={!!profile?.phone}
                            placeholder=" "
                            className={`peer w-full border border-brand-beige/80 rounded-xl pl-10 pr-4 pt-6 pb-2 text-sm focus:outline-none transition-all ${
                              profile?.phone 
                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                                : 'focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 bg-brand-cream/10 text-brand-charcoal'
                            }`}
                            required
                          />
                          <Phone className="absolute left-3.5 top-[25px] h-4 w-4 text-muted-foreground/75 peer-focus:text-brand-orange transition-colors" />
                          <label
                            htmlFor="editPhone"
                            className="absolute left-10 top-1.5 text-[0.62rem] font-bold text-brand-charcoal uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-5.5 peer-placeholder-shown:text-muted-foreground/75 peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:text-brand-orange cursor-text"
                          >
                            Phone Number {profile?.phone && "(Verified)"}
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

                    {/* Notification Preferences */}
                    <div className="mt-8 mb-6">
                      <h3 className="font-serif text-2xl font-bold text-brand-charcoal mb-2">
                        Notification Preferences
                      </h3>
                      <p className="text-xs text-muted-foreground mb-6">
                        Control how you want to receive updates about your orders and account.
                      </p>

                      <div className="flex flex-col gap-4 max-w-xl bg-white border border-brand-beige/50 rounded-2xl p-6 shadow-sm">
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-brand-orange group-hover:scale-110 transition-transform">
                              <Mail className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="block text-sm font-bold text-brand-charcoal">Email Updates</span>
                              <span className="block text-[0.65rem] text-muted-foreground">Receive order confirmations and receipts via email</span>
                            </div>
                          </div>
                          <input type="checkbox" className="w-5 h-5 accent-brand-orange cursor-pointer" defaultChecked />
                        </label>

                        <div className="h-px w-full bg-brand-beige/30 my-1"></div>

                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-brand-orange group-hover:scale-110 transition-transform">
                              <Phone className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="block text-sm font-bold text-brand-charcoal">SMS Updates</span>
                              <span className="block text-[0.65rem] text-muted-foreground">Receive text messages for delivery tracking</span>
                            </div>
                          </div>
                          <input type="checkbox" className="w-5 h-5 accent-brand-orange cursor-pointer" defaultChecked />
                        </label>

                        <div className="h-px w-full bg-brand-beige/30 my-1"></div>

                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] group-hover:scale-110 transition-transform">
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            </div>
                            <div>
                              <span className="block text-sm font-bold text-brand-charcoal">WhatsApp Updates</span>
                              <span className="block text-[0.65rem] text-muted-foreground">Get order status directly on WhatsApp</span>
                            </div>
                          </div>
                          <input type="checkbox" className="w-5 h-5 accent-[#25D366] cursor-pointer" defaultChecked />
                        </label>

                        <div className="h-px w-full bg-brand-beige/30 my-1"></div>

                        <div className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                              <Bell className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="block text-sm font-bold text-brand-charcoal">Live Web Notifications</span>
                              <span className="block text-[0.65rem] text-muted-foreground">Receive instant alerts for tracking & delivery (Requires Location)</span>
                            </div>
                          </div>
                          <button
                            onClick={handleTogglePush}
                            disabled={isPushLoading}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPushEnabled ? 'bg-blue-600' : 'bg-gray-200'} ${isPushLoading ? 'opacity-50' : ''}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      </div>
                    </div>

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
                                      {order.items.length > 0 ? order.items[0].productName : `${BUSINESS.shortName} Order`}
                                      {order.items.length > 1 ? ` +${order.items.length - 1} items` : ""}
                                    </h4>
                                    <span className="text-[0.65rem] text-muted-foreground font-bold">Order #{order.orderNumber}</span>
                                  </div>
                                  <span className={`text-[0.6rem] font-bold uppercase px-2.5 py-1 rounded-md tracking-wide ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
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
                                        <div className="mb-4 bg-white p-4 rounded-2xl border border-brand-beige shadow-sm relative overflow-hidden">
                                          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cream/50 rounded-full blur-2xl pointer-events-none"></div>
                                          <div className="flex justify-between items-center mb-4 relative z-10">
                                            <span className="text-[0.7rem] font-bold text-brand-charcoal uppercase tracking-widest">Tracking Status</span>
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${order.status === 'Cancelled' ? 'bg-red-50 text-red-600' :
                                                order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-orange/10 text-brand-orange'
                                              }`}>
                                              {order.status === 'Delivered' && <Check className="w-3 h-3" />}
                                              {order.status}
                                            </span>
                                          </div>

                                          <div className="flex flex-col relative pl-2 mt-2">
                                            {(() => {
                                              const isPickup = (order.shippingAddress as any)?.id === 'pickup';
                                              const deliveryStep = isPickup ? 'Ready For Pickup' : 'Out For Delivery';
                                              const isCancelled = order.status === 'Cancelled';
                                              const steps = isCancelled
                                                ? ['Placed', 'Cancelled']
                                                : ['Placed', 'Confirmed', 'Preparing', deliveryStep, 'Delivered'];

                                              const activeIndex = isCancelled ? 1 :
                                                order.status?.toLowerCase() === 'delivered' ? 4 :
                                                  (order.status === 'Ready For Pickup' || order.status === 'Out For Delivery' || order.status === 'Shipped') ? 3 :
                                                    order.status === 'Preparing' ? 2 :
                                                      order.status === 'Confirmed' ? 1 : 0;

                                              return steps.map((step, idx) => {
                                                const isCompleted = idx < activeIndex;
                                                const isActive = idx === activeIndex;
                                                const isLast = idx === steps.length - 1;
                                                const isFail = isCancelled && isActive;

                                                return (
                                                  <div key={step} className="flex items-start gap-4 relative pb-6 last:pb-1">
                                                    {/* Vertical Line */}
                                                    {!isLast && (
                                                      <div className="absolute left-[7px] top-5 bottom-0 w-0.5 bg-brand-cream overflow-hidden">
                                                        {(isCompleted || (isActive && !isFail)) && (
                                                          <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: "100%" }}
                                                            transition={{ duration: 0.5, delay: idx * 0.2 }}
                                                            className={`w-full h-full ${isFail ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                          />
                                                        )}
                                                      </div>
                                                    )}

                                                    {/* Dot */}
                                                    <div className="relative z-10 flex-shrink-0 mt-0.5">
                                                      <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: idx * 0.15 }}
                                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white ${isCompleted ? 'border-emerald-500' :
                                                            isFail ? 'border-red-500' :
                                                              isActive ? 'border-brand-orange ring-4 ring-brand-orange/20' : 'border-brand-beige'
                                                          }`}
                                                      >
                                                        {isCompleted && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                                                        {isFail && <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                                                        {(isActive && !isFail) && <div className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-pulse" />}
                                                      </motion.div>
                                                    </div>

                                                    {/* Text */}
                                                    <div className="flex flex-col -mt-0.5">
                                                      <span className={`text-xs font-bold ${isCompleted ? 'text-emerald-700' :
                                                          isFail ? 'text-red-600' :
                                                            isActive ? 'text-brand-orange' : 'text-muted-foreground'
                                                        }`}>
                                                        {step}
                                                      </span>
                                                      {isActive && !isFail && !isLast && (
                                                        <span className="text-[0.6rem] text-muted-foreground mt-0.5">In progress...</span>
                                                      )}
                                                      {isFail && (
                                                        <span className="text-[0.6rem] text-red-500 mt-0.5">Order was cancelled</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                );
                                              });
                                            })()}
                                          </div>
                                        </div>

                                        <div className="flex flex-col gap-2.5 mt-1">
                                          {order.items?.map((item, idx) => (
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
                                          {typeof order.shippingAddress === 'string' ? (
                                            order.shippingAddress
                                          ) : order.shippingAddress?.id === 'pickup' ? (
                                            <>
                                              <span className="font-bold text-brand-orange">{(order.shippingAddress as any)?.pickup_store === 'taleti' ? BUSINESS.branches.taleti.name : BUSINESS.branches.navagadh.name}</span><br />
                                              {(order.shippingAddress as any)?.pickup_store === 'taleti' ? BUSINESS.branches.taleti.address : BUSINESS.branches.navagadh.address}
                                            </>
                                          ) : (
                                            <>
                                              {order.shippingAddress?.name || "Customer"}<br />
                                              {order.shippingAddress?.street || ""}{order.shippingAddress?.city ? `, ${order.shippingAddress.city}` : ""}
                                            </>
                                          )}
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

                                      <div className="border-t sm:border-t-0 border-brand-beige pt-3 sm:pt-0 w-full sm:w-auto text-xs text-brand-charcoal flex flex-col justify-end">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOrderAgain(order.items || []);
                                          }}
                                          className="py-2.5 px-6 bg-brand-orange hover:bg-brand-orange-hover text-white text-[0.75rem] font-bold rounded-lg transition-colors cursor-pointer text-center uppercase tracking-wider flex items-center justify-center gap-2 mt-auto shadow-sm"
                                        >
                                          <ShoppingCart className="w-4 h-4" />
                                          Order Again
                                        </button>
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
                      <h3 className="font-serif text-lg font-bold text-brand-charcoal flex flex-col sm:flex-row sm:items-center gap-2">
                        Address Book
                        {nearestBranch && (
                          <span className="text-[0.6rem] bg-[#D46D2D] text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-sans inline-flex items-center gap-1 w-fit mt-1 sm:mt-0">
                            <MapPin className="w-3 h-3" /> Closest Store: {nearestBranch}
                          </span>
                        )}
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
                      <form onSubmit={handleAddAddress} className="bg-white border border-brand-beige rounded-2xl p-6 shadow-lg flex flex-col gap-5 max-w-lg animate-fade-in-up">
                        <div className="flex justify-between items-center border-b border-brand-beige/50 pb-3">
                          <h4 className="font-serif text-lg font-bold text-brand-charcoal">Add New Address</h4>
                          <button type="button" onClick={() => setShowAddressForm(false)} className="text-muted-foreground hover:text-brand-charcoal">
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Use Current Location Button */}
                        {(!addrFlat && !addrArea) && (
                          <div className="w-full mb-2">
                            <button
                              type="button"
                              onClick={handleUseCurrentLocation}
                              disabled={isLocating}
                              className="w-full flex items-center justify-center gap-3 bg-white text-brand-charcoal border-2 border-brand-beige min-h-[48px] rounded-xl font-bold text-sm hover:border-brand-orange hover:text-brand-orange transition-colors active:scale-95 disabled:opacity-50 shadow-sm"
                            >
                              {isLocating ? <Loader2 className="w-5 h-5 animate-spin text-brand-orange" /> : <MapPin className="w-5 h-5 text-brand-orange" />}
                              {isLocating ? "Fetching your location..." : "Use Current Location"}
                            </button>
                            {locationStatus === "success" && (
                              <div className="flex items-center gap-2 mt-2 text-emerald-600 text-xs font-bold bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                <Check className="w-4 h-4" /> Location detected successfully ✓
                              </div>
                            )}
                            {locationStatus === "error" && (
                              <div className="flex items-center gap-2 mt-2 text-red-600 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">
                                <AlertCircle className="w-4 h-4" /> Unable to detect location. Please enter address manually.
                              </div>
                            )}
                            {locationStatus === "success" && addrLat && addrLng && (
                              <div className="mt-3 w-full h-24 bg-brand-cream/30 rounded-xl border border-brand-beige overflow-hidden relative flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-brand-orange absolute z-10 animate-bounce" />
                                <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(#D46D2D 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                                <span className="absolute bottom-2 right-2 text-[0.6rem] font-bold text-brand-orange/60 bg-white/80 px-2 py-0.5 rounded-md">Map Preview</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
                          <div className="flex flex-col gap-1.5 relative">
                            <input
                              type="text"
                              id="addrName"
                              placeholder=" "
                              value={addrName}
                              onChange={(e) => setAddrName(e.target.value)}
                              className="peer w-full border border-brand-beige/80 rounded-xl px-4 pt-6 pb-2 text-sm focus:outline-none focus:border-brand-orange bg-brand-cream/10"
                              required
                            />
                            <label htmlFor="addrName" className="absolute left-4 top-1.5 text-[0.62rem] font-bold text-brand-charcoal uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-placeholder-shown:text-muted-foreground peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:text-brand-orange">
                              Recipient Name *
                            </label>
                          </div>
                          <div className="flex flex-col gap-1.5 relative">
                            <input
                              type="tel"
                              id="addrPhone"
                              placeholder=" "
                              value={addrPhone}
                              onChange={(e) => setAddrPhone(e.target.value)}
                              className="peer w-full border border-brand-beige/80 rounded-xl px-4 pt-6 pb-2 text-sm focus:outline-none focus:border-brand-orange bg-brand-cream/10"
                              required
                            />
                            <label htmlFor="addrPhone" className="absolute left-4 top-1.5 text-[0.62rem] font-bold text-brand-charcoal uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-placeholder-shown:text-muted-foreground peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:text-brand-orange">
                              Phone Number *
                            </label>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 relative">
                          <input
                            type="text"
                            id="addrFlat"
                            placeholder=" "
                            value={addrFlat}
                            onChange={(e) => setAddrFlat(e.target.value)}
                            className="peer w-full border border-brand-beige/80 rounded-xl px-4 pt-6 pb-2 text-sm focus:outline-none focus:border-brand-orange bg-brand-cream/10"
                            required
                          />
                          <label htmlFor="addrFlat" className="absolute left-4 top-1.5 text-[0.62rem] font-bold text-brand-charcoal uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-placeholder-shown:text-muted-foreground peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:text-brand-orange">
                            House / Flat No *
                          </label>
                        </div>

                        <div className="flex flex-col gap-1.5 relative">
                          {/* Google Places mock for area */}
                          <input
                            type="text"
                            id="addrArea"
                            placeholder=" "
                            value={addrArea}
                            onChange={(e) => setAddrArea(e.target.value)}
                            className="peer w-full border border-brand-beige/80 rounded-xl px-4 pt-6 pb-2 text-sm focus:outline-none focus:border-brand-orange bg-brand-cream/10"
                            required
                          />
                          <label htmlFor="addrArea" className="absolute left-4 top-1.5 text-[0.62rem] font-bold text-brand-charcoal uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-placeholder-shown:text-muted-foreground peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:text-brand-orange">
                            Street / Area (Autocomplete) *
                          </label>
                        </div>

                        <div className="flex flex-col gap-1.5 relative">
                          <input
                            type="text"
                            id="addrLandmark"
                            placeholder=" "
                            value={addrLandmark}
                            onChange={(e) => setAddrLandmark(e.target.value)}
                            className="peer w-full border border-brand-beige/80 rounded-xl px-4 pt-6 pb-2 text-sm focus:outline-none focus:border-brand-orange bg-brand-cream/10"
                          />
                          <label htmlFor="addrLandmark" className="absolute left-4 top-1.5 text-[0.62rem] font-bold text-brand-charcoal uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-placeholder-shown:text-muted-foreground peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:text-brand-orange">
                            Landmark (Optional)
                          </label>
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
                              <>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand-orange border-t-transparent"></div>
                                  <span className="text-[0.62rem] text-muted-foreground">Autofetching city & state...</span>
                                </div>
                                <Loader2 className="h-4 w-4 absolute right-3 top-4 animate-spin text-brand-orange" />
                              </>
                            )}
                          </div>

                          <div className="flex flex-col gap-1.5 relative">
                            <select
                              value={addrCity}
                              onChange={(e) => setAddrCity(e.target.value)}
                              className="peer w-full border border-brand-beige/80 rounded-xl px-4 pt-6 pb-2 text-sm focus:outline-none focus:border-brand-orange bg-brand-cream/10 appearance-none"
                              required
                            >
                              <option value="">Select City</option>
                              {Array.from(new Set([...DEFAULT_CITIES, ...customCities])).map(city => (
                                <option key={city} value={city}>{city}</option>
                              ))}
                            </select>
                            <label className="absolute left-4 top-1.5 text-[0.62rem] font-bold text-brand-charcoal uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-placeholder-shown:text-muted-foreground peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:text-brand-orange">
                              City *
                            </label>
                          </div>

                          <div className="flex flex-col gap-1.5 relative">
                            <select
                              value={addrState}
                              onChange={(e) => setAddrState(e.target.value)}
                              className="peer w-full border border-brand-beige/80 rounded-xl px-4 pt-6 pb-2 text-sm focus:outline-none focus:border-brand-orange bg-brand-cream/10 appearance-none"
                              required
                            >
                              <option value="">Select State</option>
                              {INDIAN_STATES.map(state => (
                                <option key={state} value={state}>{state}</option>
                              ))}
                            </select>
                            <label className="absolute left-4 top-1.5 text-[0.62rem] font-bold text-brand-charcoal uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-placeholder-shown:text-muted-foreground peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:text-brand-orange">
                              State *
                            </label>
                          </div>
                        </div>

                        {pincodeStatus.message && (
                          <div className={`p-3 rounded-lg text-xs font-bold ${pincodeStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              pincodeStatus.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-red-50 text-red-600 border border-red-200'
                            }`}>
                            {pincodeStatus.type === 'success' && <Check className="inline h-3.5 w-3.5 mr-1" />}
                            {pincodeStatus.type === 'warning' && <AlertCircle className="inline h-3.5 w-3.5 mr-1" />}
                            {pincodeStatus.message}
                          </div>
                        )}

                        {/* Nickname & Default Option */}
                        <div className="flex flex-col gap-3 mt-2 border-t border-brand-beige/50 pt-4">
                          <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">Save Address As</label>
                          <div className="flex gap-3">
                            {['Home', 'Work', 'Other'].map(type => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setAddrNickname(type)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${addrNickname === type ? 'bg-brand-orange/10 border-brand-orange text-brand-orange' : 'bg-white border-brand-beige text-brand-charcoal hover:border-brand-orange/50'}`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>

                          <label className="flex items-center gap-2 mt-2 cursor-pointer w-fit">
                            <input
                              type="checkbox"
                              checked={isDefaultAddr}
                              onChange={(e) => setIsDefaultAddr(e.target.checked)}
                              className="w-4 h-4 rounded text-brand-orange accent-brand-orange border-brand-beige focus:ring-brand-orange"
                            />
                            <span className="text-xs text-brand-charcoal font-bold">Make this my default address</span>
                          </label>
                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                          <button
                            type="button"
                            onClick={() => setShowAddressForm(false)}
                            className="px-5 py-2.5 rounded-xl border border-brand-beige text-brand-charcoal text-xs font-bold hover:bg-brand-cream transition-colors active:scale-95"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-brand-orange text-white text-xs font-bold shadow-md hover:bg-brand-orange-hover hover:shadow-lg transition-all active:scale-95"
                          >
                            Save Address
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
                                <span className="text-xs font-bold text-[#4A2F1F] uppercase tracking-wider">{addr.nickname || (addr.isDefault ? 'Home' : 'Other')}</span>
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
                            <p className="text-[0.65rem] text-muted-foreground mt-1">Your order is currently <strong>{orders[0].status}</strong>. Thank you for shopping with {BUSINESS.shortName}!</p>
                            <span className="text-[0.55rem] text-muted-foreground/60 mt-2 block font-bold tracking-wider uppercase">Just Now</span>
                          </div>
                        </div>
                      ) : null}
                      <div className="border border-brand-beige rounded-2xl p-5 bg-brand-cream/20 shadow-sm flex gap-4 items-start hover:border-brand-orange/30 transition-colors cursor-pointer group">
                        <div className="h-10 w-10 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Star className="h-5 w-5 fill-brand-orange/20" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-brand-charcoal">Welcome to {BUSINESS.shortName} Premium</h4>
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

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6EE]">
        <div className="h-10 w-10 border-4 border-[#D97706] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AccountContent />
    </Suspense>
  );
}

