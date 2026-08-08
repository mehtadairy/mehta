"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { BUSINESS } from "@/lib/businessConfig";
import { useCustomerAuth } from "@/lib/context/CustomerAuthContext";
import CancelOrderDialog from "@/components/CancelOrderDialog";
import { img } from "@/lib/image-utils";


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
  ArrowLeft,
  ChevronRight,
  LayoutDashboard,
  Crown,
  Gift,
  Settings,
  X,
  Loader2,
  ShoppingCart,
  Share2,
  Copy,
  Calendar,
  DollarSign,
  Filter,
  ArrowUpDown,
  Sliders,
  CreditCard,
  Truck,
  Package,
  FileText
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
  const { profile: contextProfile, isLoggedIn, isLoading: isAuthChecking, logout, refreshProfile, updateProfile } = useCustomerAuth();

  // OTP Login State
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isOtpInputFocused, setIsOtpInputFocused] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Email OTP State
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [isEmailOtpSending, setIsEmailOtpSending] = useState(false);

  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [isPhoneOtpSending, setIsPhoneOtpSending] = useState(false);
  const [reqId, setReqId] = useState("");

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [orderSortOrder, setOrderSortOrder] = useState("newest");

  // Profile Update State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [profileAvatar, setProfileAvatar] = useState<string>("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setProfileAvatar(base64String);
        localStorage.setItem("mehta_avatar_url", base64String);
        window.dispatchEvent(new Event("avatarUpdated"));

        if (profile?.id) {
          try {
            await supabase
              .from('customers')
              .update({ profile_image: base64String, avatar_url: base64String })
              .eq('id', profile.id);
            await refreshProfile();
          } catch (err) {
            console.error("Failed to update avatar in database:", err);
          }
        }
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
      const { data } = await supabase.from('delivery_zones').select('id, name, city, pincode, pincodes, delivery_charge, free_above');
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

  // Redirection when not logged in with defensive guard against infinite loops
  useEffect(() => {
    if (!isAuthChecking && !isLoggedIn) {
      // Defensive redirect guard: only redirect if we haven't recently bounced
      const recentBounces = parseInt(sessionStorage.getItem('mehta_auth_bounces') || '0', 10);
      const lastBounceTime = parseInt(sessionStorage.getItem('mehta_auth_bounce_time') || '0', 10);
      
      const now = Date.now();
      if (recentBounces > 2 && (now - lastBounceTime) < 5000) {
        console.error("Infinite redirect loop detected. Halting redirect to /login.");
        return; // Halt the loop
      }

      sessionStorage.setItem('mehta_auth_bounces', (recentBounces + 1).toString());
      sessionStorage.setItem('mehta_auth_bounce_time', now.toString());
      
      router.replace("/login?redirect=/account");
    } else if (isLoggedIn) {
      // Clear bounce tracking on successful auth
      sessionStorage.removeItem('mehta_auth_bounces');
      sessionStorage.removeItem('mehta_auth_bounce_time');
    }
  }, [isLoggedIn, isAuthChecking, router]);

  // Sync profile from context and fetch addresses/orders in parallel
  useEffect(() => {
    if (!contextProfile) {
      setProfile(null);
      return;
    }

    const loadExtraData = async () => {
      try {
        const customerId = contextProfile.id;
        const rawPhone = contextProfile.phone || (typeof window !== 'undefined' ? localStorage.getItem("mehta_user_phone") || "" : "");
        const rawEmail = contextProfile.email || (typeof window !== 'undefined' ? localStorage.getItem("mehta_user_email") || "" : "");
        
        const clean10DigitPhone = rawPhone.replace(/\D/g, '').slice(-10);
        const phoneWithPlus91 = clean10DigitPhone ? `+91${clean10DigitPhone}` : '';
        const email = rawEmail.trim().toLowerCase();

        // 1. Gather all linked profile IDs, phones, and emails to resolve account splits
        const matchingCustomerIds = [customerId];
        const matchingPhones = [];
        const matchingEmails = [];

        if (email) matchingEmails.push(email);
        if (clean10DigitPhone) matchingPhones.push(clean10DigitPhone);

        try {
          const searchFilters = [];
          if (email) searchFilters.push(`email.eq.${email}`);
          if (clean10DigitPhone) searchFilters.push(`phone.eq.${clean10DigitPhone}`);
          if (customerId) searchFilters.push(`id.eq.${customerId}`);

          if (searchFilters.length > 0) {
            const { data: matchedCustomers } = await supabase
              .from('customers')
              .select('id, phone, email')
              .or(searchFilters.join(','));

            if (matchedCustomers) {
              matchedCustomers.forEach(c => {
                if (c.id && !matchingCustomerIds.includes(c.id)) {
                  matchingCustomerIds.push(c.id);
                }
                if (c.phone) {
                  const pClean = c.phone.replace(/\D/g, '').slice(-10);
                  if (pClean && !matchingPhones.includes(pClean)) {
                    matchingPhones.push(pClean);
                  }
                }
                if (c.email) {
                  const eClean = c.email.trim().toLowerCase();
                  if (eClean && !matchingEmails.includes(eClean)) {
                    matchingEmails.push(eClean);
                  }
                }
              });
            }
          }
        } catch (e) {
          console.warn("Failed to gather legacy linked profiles:", e);
        }

        // 2. Build robust Postgres OR query for matching customer orders
        const conditions: string[] = [];
        matchingCustomerIds.forEach(id => {
          conditions.push(`customer_id.eq.${id}`);
        });
        matchingPhones.forEach(phone => {
          conditions.push(`user_phone.ilike.%${phone}%`);
          conditions.push(`user_phone.eq.+91${phone}`);
          conditions.push(`user_phone.eq.91${phone}`);
        });
        matchingEmails.forEach(e => {
          conditions.push(`user_email.ilike.${e}`);
        });

        let orderQuery = supabase.from('orders').select('*, order_items(*), invoices(*)').neq('status', 'Draft');
        if (conditions.length > 0) {
          orderQuery = orderQuery.or(conditions.join(','));
        }

        // Fetch addresses, orders, and products concurrently
        const [addrsRes, ordersRes, allProducts] = await Promise.all([
          supabase.from('addresses').select('id, full_name, mobile, address, landmark, city, pincode, state, is_default').eq('customer_id', customerId),
          orderQuery.order('created_at', { ascending: false }),
          fetchProducts()
        ]);

        // 1. Process Addresses
        const mappedAddrs = addrsRes.data?.map(a => ({
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

        // 2. Process Orders
        if (!ordersRes.error && ordersRes.data) {
          const formattedOrders = ordersRes.data.map((o: any) => ({
            id: o.id,
            orderNumber: o.order_number,
            date: new Date(o.created_at).toLocaleDateString(),
            createdAtRaw: o.created_at,
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
            paidAt: o.paid_at,
            paymentCompletedAt: o.payment_completed_at,
            invoiceUrl: o.invoice_url,
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

        // 3. Process Wishlist products
        const storedWishlist = JSON.parse(localStorage.getItem("mehta_wishlist") || "[]");
        if (allProducts) {
          const w = storedWishlist.map((id: string) => allProducts.find(prod => prod.id === id)).filter(Boolean);
          setWishlistItems(w);
        }

        setProfile({ ...contextProfile, saved_addresses: mappedAddrs });
      } catch (err) {
        console.error("Error loading extra profile data:", err);
        setProfile(contextProfile);
      }
    };

    loadExtraData();
  }, [contextProfile]);

  // Sync inputs from profile Context
  useEffect(() => {
    if (contextProfile) {
      setEditName(contextProfile.name || "");
      setEditPhone(contextProfile.phone || "");
      setEditEmail(contextProfile.email || "");
    }
  }, [contextProfile]);

  // Sync tab from search query
  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "dashboard");
  }, [searchParams]);

  const handleLogout = async () => {
    await logout();
  };

  // OTP Login Functions moved to /login/page.tsx

  const updateProfileToDB = async (finalName: string, finalEmail: string, finalPhone: string, newAuthUserId?: string) => {
    try {
      setIsLoading(true);
      const res = await updateProfile(finalName, finalEmail, finalPhone);
      if (res.success) {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        setProfileError(res.error || "Failed to update profile.");
        setTimeout(() => setProfileError(""), 3000);
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      setProfileError("An error occurred. Please try again.");
      setTimeout(() => setProfileError(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName) return;

    // Phone number changes are disabled

    if (editEmail && editEmail !== profile?.email) {
      // Need to verify email first
      setIsEmailOtpSending(true);
      try {
        const res = await fetch('/api/auth/email/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: editEmail })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to send OTP');
        setShowEmailOtpModal(true);
      } catch (err: any) {
        console.error("Failed to send OTP", err);
        alert(err.message || "Failed to send OTP to this email.");
      } finally {
        setIsEmailOtpSending(false);
      }
      return;
    }

    await updateProfileToDB(editName, editEmail, editPhone);
  };

  const handleVerifyEmailOtp = async () => {
    setIsEmailOtpSending(true);
    try {
      const res = await fetch('/api/auth/email/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: editEmail, otp: emailOtp })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Invalid OTP');

      // Successfully verified email!
      if (data.customer && profile) {
         await updateProfileToDB(editName, editEmail, editPhone, data.customer.id);
      }

      setShowEmailOtpModal(false);
    } catch (err: any) {
      alert(err.message || "Invalid OTP.");
    } finally {
      setIsEmailOtpSending(false);
    }
  };

  const handleOpenAddressForm = () => {
    if (profile?.saved_addresses && profile.saved_addresses.length >= 2) {
      window.dispatchEvent(new CustomEvent("showToast", {
        detail: {
          message: "Maximum 2 saved addresses allowed. Please delete an existing address to add a new one.",
          type: "warning"
        }
      }));
      return;
    }
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

    if (profile.saved_addresses && profile.saved_addresses.length >= 2) {
      window.dispatchEvent(new CustomEvent("showToast", {
        detail: {
          message: "Maximum 2 saved addresses allowed. Please delete an existing address to add a new one.",
          type: "warning"
        }
      }));
      return;
    }

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
        <section className="py-8 sm:py-16 bg-[#FCF9F2] min-h-[calc(100vh-80px)] mt-20 sm:mt-24 pb-28 md:pb-16 font-sans">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            
            {/* ── PROFILE HEADER CONTAINER ── */}
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 gap-6 mb-10">
                {/* Profile Header */}
                <div className="bg-gradient-to-br from-[#FFF] via-[#FAF6EE] to-[#FFF] border border-[#EAE0D3] rounded-[2rem] p-6 sm:p-8 shadow-[0_12px_30px_-10px_rgba(42,30,23,0.08)] relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#D4AF37 1.5px, transparent 1.5px)', backgroundSize: '15px 15px' }}></div>
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#D4AF37]/5 to-[#D46D2D]/5 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
                    <div className="relative group flex-shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white shadow-md relative bg-brand-cream flex items-center justify-center text-3xl font-black text-brand-charcoal ring-2 ring-[#D4AF37]/35">
                        {profile?.profile_image || profile?.avatar_url || profileAvatar ? (
                          <img src={profile?.profile_image || profile?.avatar_url || profileAvatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                        ) : (
                          profile?.name ? profile.name[0].toUpperCase() : "U"
                        )}
                      </div>
                      <label htmlFor="avatar-upload-hdr" className="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity duration-300 select-none">
                        Edit Photo
                      </label>
                      <input
                        type="file"
                        id="avatar-upload-hdr"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>

                    <div className="text-center sm:text-left flex-grow mt-2">
                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <h2 className="font-serif text-2xl font-bold text-[#2A1E17] tracking-tight">
                          {profile?.name || "Guest Sweet Lover"}
                        </h2>
                      </div>
                      <p className="text-xs text-[#7E6B5A] mt-1.5 font-medium">
                        {profile?.email || "No email address set"}
                      </p>
                      <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest mt-2">
                        Member Since {new Date().getFullYear()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6 sm:mt-0 justify-center sm:justify-end relative z-10">
                    <button
                      onClick={() => setActiveTab("settings")}
                      className="inline-flex items-center gap-2 bg-[#2A1E17] hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        window.dispatchEvent(new CustomEvent("showToast", { detail: { message: "Account profile link copied!", type: "success" } }));
                      }}
                      className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-[#2A1E17] border border-[#EAE0D3] text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <Share2 className="h-3.5 w-3.5" /> Share Profile
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── CENTRAL LAYOUT CONTENT ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Account Sidebar Navigation (Desktop only) */}
              <aside className="hidden lg:flex col-span-3 flex-col gap-2 bg-white border border-[#EAE0D3] p-5 rounded-[2rem] shadow-[0_8px_30px_rgba(42,30,23,0.03)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D46D2D] to-[#D4AF37]"></div>
                
                <nav className="flex flex-col gap-1">
                  {[
                    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
                    { id: 'orders', label: 'Order History', icon: ShoppingBag, count: orders.length },
                    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
                    { id: 'wishlist', label: 'My Wishlist', icon: Heart, count: wishlistItems.length },
                    { id: 'notifications', label: 'Inbox Messages', icon: Bell },
                    { id: 'settings', label: 'Profile Settings', icon: Sliders },
                    { id: 'security', label: 'Security Guard', icon: Shield },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`text-left text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 cursor-pointer ${
                          isActive
                            ? "bg-[#FDF2EC] text-[#D46D2D] border-l-4 border-[#D46D2D]"
                            : "text-[#7E6B5A] hover:bg-gray-50 hover:text-[#2A1E17]"
                        }`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.2} />
                        <span className="flex-grow">{item.label}</span>
                        {item.count !== undefined && item.count > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isActive ? "bg-[#D46D2D] text-white" : "bg-gray-100 text-gray-500"}`}>
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>

                <div className="h-px bg-[#EAE0D3] my-3"></div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-3 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" /> Log out of Account
                </button>
              </aside>

              {/* Main Content Pane */}
              <main className="col-span-12 lg:col-span-9 bg-white border border-[#EAE0D3] rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgba(42,30,23,0.03)] min-h-[500px]">

                {/* Universal Mobile Back Button */}
                {activeTab !== "dashboard" && (
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="inline-flex lg:hidden items-center gap-2 text-xs font-extrabold text-[#D46D2D] bg-[#FDF2EC] border border-[#FDF2EC] px-4 py-2.5 rounded-full mb-6 active:scale-95 transition-transform"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#D46D2D]" />
                    <span>Back to Dashboard</span>
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
                  <div className="flex flex-col gap-8 animate-fade-in">
                    
                    {/* Quick Actions Action Tiles (inspired by Apple Grid) */}
                    <div>
                      <h3 className="font-serif text-lg font-bold text-[#2A1E17] mb-4">Quick Links</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[
                          { id: "orders", title: "My Orders", subtitle: "Track purchases", icon: "📦" },
                          { id: "wishlist", title: "Wishlist", subtitle: "Saved sweets", icon: "❤️" },
                          { id: "addresses", title: "Addresses", subtitle: "Delivery spots", icon: "📍" },
                          { id: "settings", title: "Edit Details", subtitle: "Change account", icon: "⚙️" },
                          { id: "notifications", title: "Inbox Messages", subtitle: "Latest updates", icon: "🔔" }
                        ].map((tile) => {
                          return (
                            <button
                              key={tile.id}
                              onClick={() => {
                                setActiveTab(tile.id);
                              }}
                              className="bg-white border border-[#EAE0D3] rounded-2xl p-4 flex flex-col items-center sm:items-start text-center sm:text-left gap-2 shadow-2xs hover:border-[#D46D2D] hover:-translate-y-1 transition-all duration-300 cursor-pointer group w-full"
                            >
                              <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{tile.icon}</span>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-serif text-xs font-bold text-[#2A1E17]">{tile.title}</span>
                                <span className="text-[9px] text-[#7E6B5A] font-medium leading-tight">{tile.subtitle}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recent Orders List (Vertical Cards) */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-serif text-lg font-bold text-[#2A1E17]">Recent Activity</h3>
                        <button onClick={() => setActiveTab("orders")} className="text-xs text-[#D46D2D] hover:underline font-bold">
                          View All
                        </button>
                      </div>

                      {orders.length === 0 ? (
                        <div className="text-center py-10 bg-white border border-[#EAE0D3] rounded-2xl flex flex-col items-center">
                          <ShoppingBag className="w-8 h-8 text-[#EAE0D3] mb-2" />
                          <p className="text-xs text-[#7E6B5A] font-bold">No recent purchases found.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {orders.slice(0, 3).map((o) => (
                            <div
                              key={o.id}
                              onClick={() => {
                                setExpandedOrderId(expandedOrderId === o.id ? null : o.id);
                                setActiveTab("orders");
                              }}
                              className="bg-white border border-[#EAE0D3] rounded-2xl p-4 shadow-3xs flex items-center justify-between gap-4 hover:border-[#D46D2D] transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-[#FAF6EE] border border-[#EAE0D3]/50 rounded-xl flex items-center justify-center text-brand-orange text-lg">
                                  📦
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-serif text-xs font-bold text-[#2A1E17]">Order #{o.orderNumber || o.id.slice(0, 6)}</span>
                                  <span className="text-[10px] text-gray-400 font-medium">{o.date} · {o.items?.length || 1} items</span>
                                </div>
                              </div>
                              <div className="flex flex-col text-right gap-0.5">
                                <span className="text-xs font-black text-[#2A1E17]">₹{o.total}</span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  o.status === "Delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-150" :
                                  o.status === "Cancelled" ? "bg-rose-50 text-rose-700 border border-rose-150" : "bg-amber-50 text-amber-700 border border-amber-150"
                                }`}>
                                  {o.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
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
                          {profile?.profile_image || profile?.avatar_url || profileAvatar ? (
                            <img src={profile?.profile_image || profile?.avatar_url || profileAvatar} alt="Profile Avatar" className="w-full h-full object-cover" />
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
                        <p className="text-xs text-muted-foreground mt-1">
                          {profile?.email || "No email address set"}
                          <span className="mx-2 text-brand-beige/50">•</span>
                          {profile?.phone || "No phone number set"}
                        </p>
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
                          className="peer w-full border border-brand-beige/80 rounded-xl pl-10 pr-4 pt-6 pb-2 text-sm focus:outline-none transition-all focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 bg-brand-cream/10 text-brand-charcoal"
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
                            className="peer w-full border border-brand-beige/80 rounded-xl pl-10 pr-4 pt-6 pb-2 text-sm focus:outline-none transition-all focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 bg-brand-cream/10 text-brand-charcoal"
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
                            disabled={!!profile?.phone}
                            placeholder=" "
                            className="peer w-full border border-brand-beige/80 rounded-xl pl-10 pr-4 pt-6 pb-2 text-sm focus:outline-none transition-all focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 bg-brand-cream/10 text-brand-charcoal disabled:bg-brand-cream/5 disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                          <Phone className="absolute left-3.5 top-[25px] h-4 w-4 text-muted-foreground/75 peer-focus:text-brand-orange transition-colors" />
                          <label
                            htmlFor="editPhone"
                            className="absolute left-10 top-1.5 text-[0.62rem] font-bold text-brand-charcoal uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-5.5 peer-placeholder-shown:text-muted-foreground/75 peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:text-brand-orange cursor-text"
                          >
                            Phone Number {profile?.phone && profile.phone.trim() !== '' && profile.phone !== 'null' && "(Verified)"}
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
                    className="flex flex-col gap-6 animate-fade-in"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#EAE0D3] pb-4">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-[#2A1E17]">Order History</h3>
                        <p className="text-xs text-[#7E6B5A] font-medium mt-0.5">Manage and track your purchases.</p>
                      </div>
                      
                      {/* Search and Filters toolbar */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-grow sm:flex-initial">
                          <input
                            type="text"
                            placeholder="Search orders..."
                            value={orderSearchQuery}
                            onChange={(e) => setOrderSearchQuery(e.target.value)}
                            className="border border-[#EAE0D3] rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#D46D2D] bg-[#FCF9F2]/20 w-full sm:w-44 pl-8"
                          />
                          <Sliders className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                        </div>

                        <select
                          value={orderStatusFilter}
                          onChange={(e) => setOrderStatusFilter(e.target.value)}
                          className="border border-[#EAE0D3] rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#D46D2D] bg-[#FCF9F2]/20 text-[#2A1E17] font-bold cursor-pointer"
                        >
                          <option value="All">All Statuses</option>
                          <option value="Processing">Processing</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>

                        <select
                          value={orderSortOrder}
                          onChange={(e) => setOrderSortOrder(e.target.value)}
                          className="border border-[#EAE0D3] rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#D46D2D] bg-[#FCF9F2]/20 text-[#2A1E17] font-bold cursor-pointer"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="price-desc">Price: High to Low</option>
                          <option value="price-asc">Price: Low to High</option>
                        </select>
                      </div>
                    </div>

                    {/* Filtered & Sorted orders list */}
                    {(() => {
                      const filtered = orders.filter((o) => {
                        const matchesSearch = o.orderNumber?.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                          o.items.some(item => item.productName.toLowerCase().includes(orderSearchQuery.toLowerCase()));
                        
                        const matchesStatus = orderStatusFilter === "All" || o.status === orderStatusFilter || 
                          (orderStatusFilter === "Processing" && ["Pending Payment", "Paid", "Confirmed", "Preparing", "Shipped", "Out For Delivery"].includes(o.status));
                        
                        return matchesSearch && matchesStatus;
                      }).sort((a, b) => {
                        if (orderSortOrder === "newest") return new Date(b.createdAtRaw || b.paidAt || b.date).getTime() - new Date(a.createdAtRaw || a.paidAt || a.date).getTime();
                        if (orderSortOrder === "oldest") return new Date(a.createdAtRaw || a.paidAt || a.date).getTime() - new Date(b.createdAtRaw || b.paidAt || b.date).getTime();
                        if (orderSortOrder === "price-desc") return b.total - a.total;
                        if (orderSortOrder === "price-asc") return a.total - b.total;
                        return 0;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-20 bg-white border border-[#EAE0D3] rounded-3xl flex flex-col items-center">
                            <ShoppingBag className="w-12 h-12 text-[#EAE0D3] mb-3" />
                            <h4 className="font-serif text-base font-bold text-[#2A1E17]">No Matching Orders</h4>
                            <p className="text-xs text-[#7E6B5A] mt-1 max-w-xs">Try adjusting your filters or search keywords.</p>
                            <button
                              onClick={() => { setOrderSearchQuery(""); setOrderStatusFilter("All"); }}
                              className="mt-4 border border-[#EAE0D3] bg-[#FCF9F2]/20 hover:bg-[#FAF6EE] text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                            >
                              Reset Filters
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col gap-6">
                          {filtered.map((order) => {
                            const isExpanded = expandedOrderId === order.id;
                            // Group identical products with same variant/weight and price
                            const groupedItems = order.items?.reduce((acc: any[], item: any) => {
                              const existing = acc.find(i => i.productId === item.productId && i.weight === item.weight && i.price === item.price);
                              if (existing) {
                                existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
                              } else {
                                acc.push({ ...item, quantity: item.quantity || 1 });
                              }
                              return acc;
                            }, []) || [];

                            const totalQuantity = groupedItems.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);

                            return (
                              <div key={order.id} className="border border-[#EAE0D3]/80 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white flex flex-col mb-4">
                                
                                {/* 1. Order Header (Compact) */}
                                <div className="bg-[#FAF6EE]/50 px-4 py-3 border-b border-[#EAE0D3]/50 flex justify-between items-center gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-[#FDF2EC] flex flex-shrink-0 items-center justify-center text-[#D46D2D] border border-[#F3DFD1]">
                                      <Package className="h-4 w-4" strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-serif font-bold text-[#2A1E17] text-sm tracking-wide leading-tight">ORDER #{order.orderNumber || order.id.slice(0, 8)}</span>
                                      <span className="text-[10px] text-gray-500 font-medium mt-0.5">Placed {order.date}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                                      order.status === "Delivered" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                      order.status === "Cancelled" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}>
                                      {order.status}
                                    </span>
                                    {order.status === "Cancelled" && order.paymentStatus && order.paymentStatus.toLowerCase().includes("refund") && (
                                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                                        order.paymentStatus === "Refund Completed" ? "bg-emerald-50 text-emerald-800 border-emerald-300" :
                                        order.paymentStatus === "Refund Reversed" ? "bg-purple-50 text-purple-800 border-purple-300" :
                                        order.paymentStatus === "Refund Failed" ? "bg-red-50 text-red-800 border-red-300" :
                                        "bg-amber-50 text-amber-800 border-amber-300 animate-pulse"
                                      }`}>
                                        {order.paymentStatus}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="px-4 py-3 flex flex-col gap-3.5">
                                  {/* 2. Items Section (Compact) */}
                                  <div className="flex flex-col">
                                    <div className="flex justify-between items-center mb-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-[#EAE0D3]/30 pb-1.5">
                                      <span>Items in this order</span>
                                      <span>{totalQuantity} {totalQuantity === 1 ? 'Item' : 'Items'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      {groupedItems.map((item: any, itemIdx: number) => (
                                        <div key={itemIdx} className="flex justify-between items-center py-0.5">
                                          <span className="font-semibold text-[#2A1E17] text-[13px]">{item.productName || "Sweet Box"}</span>
                                          <span className="text-[11px] font-bold text-[#7E6B5A]">
                                            {item.weight || "Standard"} × {item.quantity}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* 3. Compact Status */}
                                  <div className="flex items-center gap-2 text-xs font-semibold text-[#2A1E17] bg-[#FCF9F2]/60 px-3 py-2 rounded-lg border border-[#EAE0D3]/40">
                                    <div className={`h-1.5 w-1.5 rounded-full ${order.status === 'Cancelled' ? 'bg-rose-500' : order.status === 'Delivered' ? 'bg-emerald-500' : 'bg-[#D46D2D]'}`}></div>
                                    {order.status === 'Cancelled' ? 'Cancelled' : 
                                     order.status === 'Delivered' ? 'Delivered successfully' : 
                                     `${order.status} · Expected delivery 2–3 Days`}
                                  </div>

                                  {/* 4. Summary Row (Compact) */}
                                  <div className="flex justify-between items-center pt-2.5 border-t border-[#EAE0D3]/40">
                                    <div className="flex flex-col">
                                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Placed</span>
                                      <span className="text-xs font-semibold text-[#2A1E17]">{order.date}</span>
                                    </div>
                                    <div className="flex flex-col text-center">
                                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Units</span>
                                      <span className="text-xs font-semibold text-[#2A1E17]">{totalQuantity}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Grand Total</span>
                                      <span className="text-[13px] font-black text-[#D46D2D]">₹{order.total}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* 5. Action Buttons (Compact) */}
                                <div className="px-4 py-3 bg-[#FAF6EE]/40 border-t border-[#EAE0D3]/50 flex flex-wrap gap-2 items-center justify-between">
                                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                    <button
                                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                      className="flex-1 sm:flex-none text-center bg-white hover:bg-gray-50 text-[#2A1E17] border border-[#EAE0D3] px-3.5 py-2 rounded-lg text-[11px] font-bold transition-all shadow-3xs"
                                    >
                                      {isExpanded ? "Hide Details" : "View Details"}
                                    </button>
                                    
                                    {order.invoice ? (
                                      <a
                                        href={`/api/invoices/download?invoiceId=${order.invoice.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 sm:flex-none text-center bg-white hover:bg-gray-50 text-amber-700 border border-[#EAE0D3] px-3.5 py-2 rounded-lg text-[11px] font-bold transition-all shadow-3xs flex items-center justify-center gap-1.5"
                                      >
                                        <FileText className="w-3.5 h-3.5" /> Invoice
                                      </a>
                                    ) : null}
                                  </div>

                                  <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    {['Pending Payment', 'Paid', 'Confirmed', 'Processing'].includes(order.status) && (
                                      <button
                                        onClick={() => setCancellingOrderId(order.id)}
                                        className="flex-1 sm:flex-none bg-transparent hover:bg-rose-50 text-rose-600 border border-rose-200 px-3.5 py-2 rounded-lg text-[11px] font-bold transition-all"
                                      >
                                        Cancel Order
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleOrderAgain(order.items)}
                                      className="flex-1 sm:flex-none bg-[#D46D2D] hover:bg-[#BF5E23] text-white px-4 py-2 rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                                    >
                                      <ShoppingBag className="w-3.5 h-3.5" /> Buy Again
                                    </button>
                                  </div>
                                </div>

                                {/* Tracking Timeline & Specifications Details (Amazon style) */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden bg-[#FAF6EE]/30 border-t border-[#EAE0D3]/60"
                                    >
                                      {/* Amazon Redesigned Progress line */}
                                      <div className="p-5 border-b border-[#EAE0D3]/50">
                                        <h5 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-4">Delivery progress timeline</h5>
                                        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-2 pl-4 md:pl-0">
                                          {/* Connecting Line */}
                                          <div className="absolute left-1.5 md:left-0 top-0 bottom-0 md:top-[15px] md:bottom-auto w-[2px] md:w-full h-full md:h-[2px] bg-gray-200 -z-10"></div>
                                          
                                          {/* Status steps mapping */}
                                          {(() => {
                                            const isCancelled = order.status === 'Cancelled';
                                            const steps = isCancelled 
                                              ? ['Placed', 'Cancelled']
                                              : ['Placed', 'Confirmed', 'Preparing', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered'];
                                            
                                            // Get matching status index
                                            const activeStep = order.status === 'Delivered' ? 6 :
                                              order.status === 'Out For Delivery' ? 5 :
                                              order.status === 'Shipped' ? 4 :
                                              order.status === 'Preparing' ? 2 :
                                              order.status === 'Confirmed' ? 1 : 0;

                                            return steps.map((step, idx) => {
                                              const isCompleted = idx <= activeStep;
                                              const isCurrent = idx === activeStep;

                                              return (
                                                <div key={step} className="flex md:flex-col items-center gap-3 md:gap-1.5 relative z-10">
                                                  <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center ring-4 ring-white ${
                                                    isCurrent ? "bg-[#D46D2D] animate-pulse" : isCompleted ? "bg-[#D4AF37]" : "bg-gray-200"
                                                  }`}>
                                                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                                                  </div>
                                                  <span className={`text-[10px] font-bold ${isCurrent ? "text-[#D46D2D]" : isCompleted ? "text-[#2A1E17]" : "text-gray-400"}`}>
                                                    {step}
                                                  </span>
                                                </div>
                                              );
                                            });
                                          })()}
                                        </div>
                                      </div>

                                      {/* Extended specifications layout grid */}
                                      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-700">
                                        {/* Left: Customer Info */}
                                        <div className="flex flex-col gap-3">
                                          <h5 className="font-serif font-bold text-xs text-[#2A1E17] border-b border-[#EAE0D3]/50 pb-1.5">Shipping Details</h5>
                                          <div className="flex flex-col gap-1">
                                            <span className="font-bold text-[#2A1E17]">{order.userName || profile?.name}</span>
                                            <span className="font-medium text-[#7E6B5A]">{order.userPhone || profile?.phone}</span>
                                            <span className="font-medium text-[#7E6B5A] leading-relaxed mt-1 text-[11px]">
                                               {typeof order.shippingAddress === 'string' ? (
                                                 order.shippingAddress
                                               ) : order.shippingAddress && typeof order.shippingAddress === 'object' ? (
                                                 <>
                                                   {order.shippingAddress.name && <strong className="block text-brand-charcoal mb-0.5">{order.shippingAddress.name} ({order.shippingAddress.phone})</strong>}
                                                   {order.shippingAddress.flat || order.shippingAddress.street || ''} {order.shippingAddress.area || ''}
                                                   <br />
                                                   {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                                                 </>
                                               ) : (
                                                 "No shipping address set"
                                               )}
                                             </span>
                                          </div>
                                        </div>

                                        {/* Right: Payment details */}
                                        <div className="flex flex-col gap-3">
                                          <h5 className="font-serif font-bold text-xs text-[#2A1E17] border-b border-[#EAE0D3]/50 pb-1.5">Billing Summary</h5>
                                          <div className="flex flex-col gap-2 font-semibold">
                                            <div className="flex justify-between">
                                              <span className="text-gray-400 font-medium">Payment Method</span>
                                              <span className="text-[#2A1E17]">{order.paymentMethod || "COD"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-400 font-medium">Payment Status</span>
                                              <span className="text-amber-700">{order.paymentStatus || "Unpaid"}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-[#EAE0D3]/30 pt-2">
                                              <span className="text-gray-400 font-medium">Subtotal</span>
                                              <span className="text-[#2A1E17]">₹{order.subtotal || order.total}</span>
                                            </div>
                                            {order.discount > 0 && (
                                              <div className="flex justify-between text-emerald-600">
                                                <span className="font-medium">Discount Code ({order.couponCode})</span>
                                                <span>-₹{order.discount}</span>
                                              </div>
                                            )}
                                            <div className="flex justify-between">
                                              <span className="text-gray-400 font-medium">Shipping Charge</span>
                                              <span className="text-[#2A1E17]">₹{order.deliveryCharge || 0}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-[#EAE0D3]/60 pt-2 text-brand-orange text-sm font-black">
                                              <span>Grand Total</span>
                                              <span>₹{order.total}</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Bottom span: Courier details (if available) */}
                                        <div className="col-span-1 md:col-span-2 border-t border-[#EAE0D3]/50 pt-4 mt-2">
                                          <h5 className="font-serif font-bold text-xs text-[#2A1E17] mb-2">Track Courier Shipment</h5>
                                          {order.status === 'Shipped' || order.status === 'Out For Delivery' ? (
                                            <div className="bg-white border border-[#EAE0D3] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                              <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-[#FDF2EC] rounded-xl flex items-center justify-center text-[#D46D2D] font-bold text-xs">
                                                  🚚
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="font-bold text-[#2A1E17]">Delhivery Logistics</span>
                                                  <span className="text-[10px] text-gray-400 mt-0.5">Tracking Number: <strong>DEL10984392</strong></span>
                                                </div>
                                              </div>
                                              <div className="flex gap-2">
                                                <button
                                                  onClick={() => {
                                                    navigator.clipboard.writeText("DEL10984392");
                                                    window.dispatchEvent(new CustomEvent("showToast", { detail: { message: "Tracking number copied!", type: "success" } }));
                                                  }}
                                                  className="bg-white hover:bg-gray-50 border border-[#EAE0D3] text-[#2A1E17] px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-3xs"
                                                >
                                                  <Copy className="w-3.5 h-3.5" /> Copy Code
                                                </button>
                                                <a
                                                  href="https://www.delhivery.com"
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="bg-[#D46D2D] hover:bg-[#BF5E23] text-white px-4 py-1.5 rounded-lg font-bold shadow-sm"
                                                >
                                                  Track Package ↗
                                                </a>
                                              </div>
                                            </div>
                                          ) : (
                                            <p className="text-[10px] text-gray-400 font-medium italic">
                                              Tracking and courier link will be available once your sweets package has been dispatched from our store.
                                            </p>
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
                      );
                    })()}
                  </motion.div>
                )}

                {/* Cancel Order Dialog */}
                {cancellingOrderId && (
                  <CancelOrderDialog
                    orderId={cancellingOrderId}
                    isOpen={!!cancellingOrderId}
                    total={orders.find(o => o.id === cancellingOrderId)?.total}
                    paymentMethod={orders.find(o => o.id === cancellingOrderId)?.paymentMethod}
                    paymentStatus={orders.find(o => o.id === cancellingOrderId)?.paymentStatus}
                    onClose={() => setCancellingOrderId(null)}
                    onSuccess={(newStatus) => {
                      setOrders(prev => prev.map(o => o.id === cancellingOrderId ? { ...o, status: newStatus } as any : o));
                      setCancellingOrderId(null);
                      window.dispatchEvent(new CustomEvent("showToast", { detail: { message: newStatus === 'Cancellation Requested' ? "Cancellation requested. Refund is being processed." : "Order cancelled successfully.", type: "success" } }));
                    }}
                  />
                )}

                {/* --- TAB 3: SAVED ADDRESSES --- */}
                {activeTab === "addresses" && (
                  <div className="flex flex-col gap-6 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-brand-beige pb-3">
                      <h3 className="font-serif text-lg font-bold text-brand-charcoal flex flex-col sm:flex-row sm:items-center gap-2">
                        Address Book
                        <span className="text-xs font-sans font-bold bg-[#FAF6EE] text-[#D46D2D] border border-[#EAE0D3] px-2.5 py-0.5 rounded-full">
                          {profile?.saved_addresses?.length || 0}/2 Addresses Saved
                        </span>
                        {nearestBranch && (
                          <span className="text-[0.6rem] bg-[#D46D2D] text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-sans inline-flex items-center gap-1 w-fit mt-1 sm:mt-0">
                            <MapPin className="w-3 h-3" /> Closest Store: {nearestBranch}
                          </span>
                        )}
                      </h3>
                      {!showAddressForm && (
                        (profile?.saved_addresses?.length || 0) < 2 ? (
                          <button
                            onClick={handleOpenAddressForm}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:underline animate-pulse cursor-pointer"
                          >
                            <Plus className="h-4 w-4" /> Add Address
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
                            Max 2 addresses reached. Delete one to add a new address.
                          </span>
                        )
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

                                    const { data: zones } = await supabase.from('delivery_zones').select('id, name, city, pincode, pincodes, delivery_charge, free_above');
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
                                        message: "This area is outside our home delivery region."
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

      {/* Phone OTP Modal */}
      {showPhoneOtpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-brand-cream border border-brand-beige rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative"
          >
            <button
              onClick={() => setShowPhoneOtpModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-brand-charcoal transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone className="h-6 w-6 text-brand-orange" />
              </div>
              <h3 className="font-serif text-xl font-bold text-brand-charcoal">Verify Mobile Number</h3>
              <p className="text-xs text-muted-foreground mt-2">
                Enter the OTP sent to <span className="font-semibold text-brand-charcoal">+91 {editPhone}</span>
              </p>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                maxLength={6}
                value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="0 0 0 0"
                className="w-full text-center tracking-[1em] font-bold text-xl border-brand-beige bg-white rounded-xl py-3 focus:ring-brand-orange focus:border-brand-orange transition-all text-brand-charcoal"
              />
              <button
                onClick={handleVerifyPhoneOtp}
                disabled={phoneOtp.length < 4 || isPhoneOtpSending}
                className="w-full rounded-xl bg-brand-orange hover:bg-brand-orange-hover px-4 py-3 text-sm font-bold text-white transition-all disabled:opacity-50 shadow-md"
              >
                {isPhoneOtpSending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                  </span>
                ) : (
                  "Verify & Save"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Email OTP Verification Modal */}
      {showEmailOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 relative">
              <button 
                onClick={() => setShowEmailOtpModal(false)}
                className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-brand-orange/10 rounded-full flex items-center justify-center">
                  <Mail className="h-6 w-6 text-brand-orange" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold font-serif text-center text-brand-charcoal mb-2">
                Verify Your Email
              </h3>
              <p className="text-center text-sm text-gray-600 mb-6">
                We've sent a 6-digit code to <br/>
                <span className="font-semibold text-brand-charcoal">{editEmail}</span>
              </p>
              
              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full text-center tracking-widest text-lg font-bold border-2 border-brand-beige rounded-xl py-3 px-4 focus:outline-none focus:border-brand-orange"
                  />
                </div>
                
                <button 
                  onClick={handleVerifyEmailOtp}
                  disabled={emailOtp.length !== 6 || isEmailOtpSending}
                  className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {isEmailOtpSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Verify Email"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
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

