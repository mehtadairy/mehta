"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { motion, AnimatePresence } from "framer-motion";
import ProductRecommendations from "@/components/ProductRecommendations";
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

import { Address, Coupon, Product } from "@/lib/types";
import { supabase, fetchProducts } from "@/lib/supabaseClient";
import { MapPin, Phone, CreditCard, ChevronRight, Check, Plus, Minus, ShoppingBasket, AlertCircle, ShieldCheck, Loader2, Trash2, Truck } from "lucide-react";
import { useLocation } from "@/lib/context/LocationContext";

export default function Checkout() {
  const router = useRouter();
  
  // Checkout States
  const [cart, setCart] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<'Home' | 'Pickup'>('Home');
  const [selectedPickupStore, setSelectedPickupStore] = useState<'navagadh' | 'taleti'>('navagadh');

  const { nearestBranch } = useLocation();

  useEffect(() => {
    if (nearestBranch === BUSINESS.branches.taleti.name) {
      setSelectedPickupStore("taleti");
    } else {
      setSelectedPickupStore("navagadh");
    }
  }, [nearestBranch]);

  // Address creation form
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newFlat, setNewFlat] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newLandmark, setNewLandmark] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState("");
  const [deliveryZones, setDeliveryZones] = useState<any[]>([]);
  const [customCities, setCustomCities] = useState<string[]>([]);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState<{ type: 'success' | 'warning' | 'error' | '', message: string }>({ type: '', message: '' });

  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newLat, setNewLat] = useState<number | null>(null);
  const [newLng, setNewLng] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("loading");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setNewLat(latitude);
        setNewLng(longitude);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.address) {
            setNewCity(data.address.city || data.address.state_district || "");
            setNewState(data.address.state || "");
            setNewPincode(data.address.postcode || "");
            setNewArea(data.display_name || data.address.suburb || data.address.neighbourhood || data.address.road || "");
            setNewFlat(data.address.house_number || data.address.building || data.address.residential || "Current Location");
            setLocationStatus("success");
          } else {
            setLocationStatus("success");
          }
        } catch (e) {
          setLocationStatus("error");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        setLocationStatus("error");
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

  // Payment integration simulator
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOption, setPaymentOption] = useState<'Razorpay_UPI' | 'COD'>('Razorpay_UPI');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [finalOrderNumber, setFinalOrderNumber] = useState("");
  const [finalOrderId, setFinalOrderId] = useState("");
  const [invoiceRecord, setInvoiceRecord] = useState<any>(null);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  // Load state
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check login state (no redirect, allow guest)
    const isLoggedIn = localStorage.getItem("mehta_logged_in") === "true";
    // Cart load
    const storedCart = localStorage.getItem("mehta_cart");
    if (storedCart) {
      const parsed = JSON.parse(storedCart);
      setCart(parsed);
      if (parsed.length === 0) {
        // stay on page
      }
    } else {
      // stay on page
    }

    // Addresses load
    const loadAddrs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      let customerId: string | null = null;

      if (user) {
        // Securely fetch customer ID using auth_user_id
        const { data: customer } = await supabase
          .from('customers')
          .select('id, phone')
          .eq('auth_user_id', user.id)
          .single();
        
        if (customer) {
          if (!customer.phone) {
            router.push("/complete-profile?redirect=/checkout");
            return;
          }
          customerId = customer.id;
        }
      } else {
        // Fallback for OTP users
        const phone = localStorage.getItem("mehta_user_phone");
        if (phone && phone !== 'null') {
          try {
            const res = await fetch(`/api/user/profile?phone=${phone}`);
            const data = await res.json();
            if (data.success && data.profile) {
              customerId = data.profile.id;
            }
          } catch (err) {
            console.error("Failed to fetch OTP customer for addresses", err);
          }
        }
      }

      if (!customerId) return;

      const { data: userAddrs } = await supabase.from('addresses').select('*').eq('customer_id', customerId);
      if (userAddrs && userAddrs.length > 0) {
        const mapped = userAddrs.map(a => ({
          id: a.id,
          name: a.full_name,
          phone: a.mobile,
          street: a.address,
          landmark: a.landmark,
          city: a.city,
          state: a.state,
          pincode: a.pincode,
          isDefault: a.is_default
        }));
        setAddresses(mapped);
        
        const defaultAddr = mapped.find(a => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else {
          setSelectedAddressId(mapped[0].id);
        }
      }
    };
    loadAddrs();

  }, [router]);

  useEffect(() => {
    const fetchRecs = async () => {
      const allProds = await fetchProducts();
      setRecommendations(allProds.slice(0, 4));
    };
    fetchRecs();
  }, []);

  const handleRemoveFromCart = (productId: string, weight: string) => {
    const updated = cart.filter(item => !(item.productId === productId && item.weight === weight));
    setCart(updated);
    localStorage.setItem("mehta_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleUpdateQuantity = (productId: string, weight: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updated = cart.map(item => {
      if (item.productId === productId && item.weight === weight) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    setCart(updated);
    localStorage.setItem("mehta_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleAddRecToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const weight = Object.keys(product.prices)[0];
    const price = product.prices[weight];
    const currentCart = JSON.parse(localStorage.getItem("mehta_cart") || "[]");
    const idx = currentCart.findIndex((i: any) => i.productId === product.id && i.weight === weight);
    if (idx > -1) currentCart[idx].quantity += 1;
    else currentCart.push({ productId: product.id, productName: product.name, image: product.images[0], weight, price, quantity: 1 });
    localStorage.setItem("mehta_cart", JSON.stringify(currentCart));
    window.dispatchEvent(new Event("cartUpdated"));
    setCart(currentCart);
  };

  // Load invoice after order is placed successfully
  useEffect(() => {
    if (!finalOrderId) return;
    const fetchInvoice = async () => {
      // Retry loop to accommodate background generation delay
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data } = await supabase
          .from("invoices")
          .select("*")
          .eq("order_id", finalOrderId)
          .maybeSingle();

        if (data) {
          setInvoiceRecord(data);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    };
    fetchInvoice();
  }, [finalOrderId]);

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const discountAmount = 0;

  // Dynamic Delivery Calculation
  useEffect(() => {
    const fetchDeliveryZone = async () => {
      if (deliveryMethod === 'Pickup') {
        setDeliveryCharge(0);
        setDeliveryDays("");
        setPincodeError("");
        return;
      }
      
      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      if (!selectedAddress) return;

      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*');

      if (error || !data || data.length === 0) {
        setDeliveryCharge(100); // Default fallback
        setDeliveryDays("3-5 Days");
        setPincodeError("Standard delivery charge applies for this address pincode.");
        return;
      }

      // Check client-side if user pincode is matching in any zone
      const userPincode = selectedAddress.pincode.trim();
      const matchedZone = data.find((zone: any) => {
        const pincodesStr = zone.pincodes || zone.pincode || "";
        const pincodesArr = pincodesStr.split(",").map((p: string) => p.trim());
        return pincodesArr.includes(userPincode);
      });

      if (!matchedZone) {
        setDeliveryCharge(0);
        setDeliveryDays("");
        setPincodeError(`We do not currently deliver to this pincode (${userPincode}) for Home Delivery. Please choose Self Outlet Pickup or contact support.`);
      } else {
        setPincodeError("");
        setDeliveryDays(matchedZone.estimated_days || "1-3 Days");
        if (matchedZone.free_delivery_above && cartSubtotal >= Number(matchedZone.free_delivery_above)) {
          setDeliveryCharge(0);
        } else {
          setDeliveryCharge(Number(matchedZone.delivery_charge) || 0);
        }
      }
    };

    fetchDeliveryZone();
  }, [selectedAddressId, deliveryMethod, cartSubtotal, addresses]);

  const totalPayable = Math.max(0, cartSubtotal - discountAmount + deliveryCharge);

  const handleOpenNewAddressForm = () => {
    setNewName(localStorage.getItem("mehta_user_name") || "");
    setNewPhone(localStorage.getItem("mehta_user_phone") || "");
    setNewFlat("");
    setNewArea("");
    setNewLandmark("");
    setNewCity("");
    setNewState("");
    setNewPincode("");
    setNewLat(null);
    setNewLng(null);
    setLocationStatus("idle");
    setPincodeStatus({ type: '', message: '' });
    setEditingAddressId(null);
    setShowNewAddressForm(true);
  };

  const handleEditAddress = (addr: Address) => {
    setNewName(addr.name);
    setNewPhone(addr.phone);
    const splitStreet = addr.street.split(', ');
    setNewFlat(splitStreet[0] || "");
    setNewArea(splitStreet.slice(1).join(', ') || "");
    setNewLandmark(addr.landmark || "");
    setNewCity(addr.city);
    setNewState(addr.state);
    setNewPincode(addr.pincode);
    setEditingAddressId(addr.id);
    setShowNewAddressForm(true);
    setPincodeStatus({ type: '', message: '' });
  };

  // Address Submit
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone || !newFlat || !newArea || !newCity || !newState || !newPincode) return;

    const isLoggedIn = localStorage.getItem("mehta_logged_in") === "true";
    let customerId = localStorage.getItem("mehta_user_id");

    let newAddr: Address;

    if (isLoggedIn && customerId) {
      if (editingAddressId && !editingAddressId.startsWith('guest-')) {
        // Update existing address
        const { error } = await supabase.from('addresses').update({
          full_name: newName,
          mobile: newPhone,
          address: `${newFlat}, ${newArea}`,
          landmark: newLandmark || null,
          city: newCity,
          state: newState,
          pincode: newPincode,
        }).eq('id', editingAddressId);

        if (error) {
          alert("Failed to update address: " + error.message);
          return;
        }

        newAddr = {
          id: editingAddressId,
          name: newName,
          phone: newPhone,
          street: `${newFlat}, ${newArea}`,
          landmark: newLandmark || "",
          city: newCity,
          state: newState,
          pincode: newPincode,
          isDefault: addresses.find(a => a.id === editingAddressId)?.isDefault || false
        };
      } else {
        // Insert new address
        const { data, error } = await supabase.from('addresses').insert([{
          customer_id: customerId,
          full_name: newName,
          mobile: newPhone,
          address: `${newFlat}, ${newArea}`,
          landmark: newLandmark || null,
          city: newCity,
          state: newState,
          pincode: newPincode,
          is_default: addresses.length === 0
        }]).select().single();

        if (error) {
          alert("Failed to save address to profile: " + error.message);
          return;
        }

        newAddr = {
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
      }
    } else {
      // Guest Checkout: Just create/update local address object
      newAddr = {
        id: editingAddressId || `guest-addr-${Date.now()}`,
        name: newName,
        phone: newPhone,
        street: `${newFlat}, ${newArea}`,
        landmark: newLandmark || "",
        city: newCity,
        state: newState,
        pincode: newPincode,
        isDefault: true
      };
    }

    let updated = [];
    if (editingAddressId) {
      updated = addresses.map(a => a.id === editingAddressId ? newAddr : a);
    } else {
      updated = [...addresses, newAddr];
    }
    
    setAddresses(updated);
    setSelectedAddressId(newAddr.id);

    // Reset Address form
    setNewName("");
    setNewPhone("");
    setNewFlat("");
    setNewArea("");
    setNewLandmark("");
    setNewCity("");
    setNewState("");
    setNewPincode("");
    setPincodeStatus({ type: '', message: '' });
    setEditingAddressId(null);
    setShowNewAddressForm(false);
  };

  // Payment process handler
  const handleProceedToPayment = () => {
    if (!selectedAddressId && deliveryMethod === 'Home') {
      alert("Please select a shipping address.");
      return;
    }
    
    const selectedAddrObj = addresses.find(a => a.id === selectedAddressId);
    let userPhone = localStorage.getItem("mehta_user_phone");
    
    if (!userPhone || userPhone === 'null' || userPhone === 'undefined' || userPhone.trim() === '') {
      if (selectedAddrObj && selectedAddrObj.phone) {
        userPhone = selectedAddrObj.phone;
      } else {
        alert("Please enter a valid phone number in your shipping address.");
        return;
      }
    }
    
    setShowPaymentModal(true);
  };

  const executePayment = async () => {
    setIsPaying(true);
    
    try {
      const orderAddress = deliveryMethod === 'Home' 
        ? addresses.find(a => a.id === selectedAddressId) as Address
        : { 
            id: 'pickup', 
            name: 'Self Pickup', 
            phone: 'N/A', 
            street: selectedPickupStore === 'navagadh' ? BUSINESS.branches.navagadh.name : BUSINESS.branches.taleti.name, 
            city: BUSINESS.address.city, 
            state: BUSINESS.address.state, 
            pincode: BUSINESS.address.pincode, 
            isDefault: false,
            pickup_store: selectedPickupStore
          };

      const userName = localStorage.getItem("mehta_user_name") || orderAddress.name || "Customer";
      const userPhone = localStorage.getItem("mehta_user_phone") || orderAddress.phone || "";
      const userEmail = localStorage.getItem("mehta_user_email") || "";
      const orderId = typeof window !== "undefined" && window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

      // SECURELY RESOLVE CUSTOMER ID
      let finalCustomerId = null;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         const { data: cust } = await supabase.from('customers').select('id').eq('auth_user_id', user.id).single();
         if (cust) finalCustomerId = cust.id;
      } else if (userPhone) {
         try {
           const res = await fetch(`/api/user/profile?phone=${userPhone}`);
           const data = await res.json();
           if (data.success && data.profile) finalCustomerId = data.profile.id;
         } catch(e) {}
      }

      const orderPayload: any = {
        id: orderId,
        order_number: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        user_name: userName,
        user_phone: userPhone,
        user_email: userEmail,
        subtotal: cartSubtotal,
        discount: discountAmount,
        coupon_code: null,
        delivery_charge: deliveryCharge,
        total: totalPayable,
        shipping_address: orderAddress,
        payment_method: paymentOption === 'COD' ? 'COD' : 'Razorpay',
        payment_status: 'Pending',
        status: 'Pending'
      };
      if (finalCustomerId) orderPayload.customer_id = finalCustomerId;

      const orderItems = cart.map(item => ({
        order_id: orderId,
        product_id: item.productId,
        product_name: item.productName,
        image: item.image,
        weight: item.weight,
        price: item.price,
        quantity: item.quantity
      }));

      if (paymentOption === 'COD') {
        // 1. Submit COD Order directly on Backend
        const codRes = await fetch('/api/payment/cod', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderPayload, orderItems })
        });
        const codData = await codRes.json();
        
        if (codData.success) {
          await handleOrderSubmission('COD', 'Pending', codData.paymentId, undefined, orderPayload);
          setIsPaying(false);
          setPaymentSuccess(true);
        } else {
          alert(codData.error || "Failed to process COD order. Please try again.");
          setIsPaying(false);
        }
        return;
      }

      // 2. online payment: Create Razorpay Order ID on Backend
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalPayable, orderNumber: orderPayload.order_number })
      });
      const orderData = await orderRes.json();
      
      if (!orderData || !orderData.id) {
        alert(orderData.error || "Server error generating payment token. Please try again.");
        setIsPaying(false);
        return;
      }

      // 3. Load Razorpay Checkout SDK dynamically
      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        setIsPaying(false);
        return;
      }

      // 4. Initialize Razorpay Checkout
      const options = {
        key: orderData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Mehta Sweet Mart",
        description: "Premium Sweets Transaction",
        order_id: orderData.id,
        handler: async function (response: any) {
          setIsPaying(true);
          try {
            // 5. Verify Payment on Backend and create Order only after signature passes
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderPayload,
                orderItems
              })
            });
            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              await handleOrderSubmission('Razorpay', 'Paid', response.razorpay_payment_id, response.razorpay_order_id, orderPayload);
              setPaymentSuccess(true);
            } else {
              alert(verifyData.error || "Payment verification failed!");
            }
          } catch (err) {
            console.error("Verification error:", err);
            alert("Error verifying payment transaction.");
          } finally {
            setIsPaying(false);
          }
        },
        prefill: {
          name: userName,
          contact: userPhone,
          email: userEmail
        },
        theme: {
          color: "#D46D2D" // brand-orange
        },
        modal: {
          ondismiss: function() {
            setIsPaying(false);
            console.log("Payment window closed by customer.");
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(response.error.description || "Payment failed");
        setIsPaying(false);
      });
      rzp.open();
      
    } catch (error) {
      console.error("Checkout transaction error:", error);
      alert("Something went wrong with checkout.");
      setIsPaying(false);
    }
  };

  const handleOrderSubmission = async (method: string, paymentStatus: string, paymentId?: string, rzpOrderId?: string, orderPayload?: any) => {
    const finalOrder = {
      ...orderPayload,
      payment_method: method,
      payment_status: paymentStatus,
      payment_id: paymentId,
      status: 'Processing'
    };
    
    // Trigger Notifications in background
    try {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: finalOrder,
          customerEmail: localStorage.getItem("mehta_user_email") || "user@example.com",
          customerPhone: orderPayload.user_phone
        })
      });
    } catch (e) {
      console.error("Failed to trigger notifications", e);
    }

    setFinalOrderNumber(finalOrder.order_number);
    setReceiptNumber(paymentId || "COD-ORDER");
    setFinalOrderId(finalOrder.id);

    localStorage.removeItem("mehta_cart");
    localStorage.removeItem("mehta_applied_coupon");
    window.dispatchEvent(new Event("cartUpdated"));
  };
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
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

      {/* --- PREMIUM STEPS PROGRESS BAR --- */}
      <div className="bg-white border-b border-brand-beige py-8 shadow-xs relative z-10">
        <div className="mx-auto max-w-2xl px-6">
          <div className="relative flex justify-between">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-brand-cream -translate-y-1/2 rounded-full" />
            
            {/* Active Progress Line */}
            <motion.div 
              className="absolute top-1/2 left-0 h-1 bg-brand-orange -translate-y-1/2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ 
                width: deliveryMethod === 'Home' 
                  ? (selectedAddressId ? "100%" : "50%") 
                  : "100%" 
              }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />

            {[
              { id: 1, label: "Delivery", icon: <Truck className="w-5 h-5 sm:w-6 sm:h-6" />, done: true, active: false },
              { 
                id: 2, 
                label: "Address", 
                icon: <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />, 
                done: deliveryMethod === 'Pickup' || !!selectedAddressId, 
                active: deliveryMethod === 'Home' && !selectedAddressId 
              },
              { 
                id: 3, 
                label: "Payment", 
                icon: <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />, 
                done: paymentSuccess, 
                active: (deliveryMethod === 'Pickup' || !!selectedAddressId) && !paymentSuccess 
              }
            ].map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center group">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full border-[3px] transition-all duration-300 shadow-sm ${
                    step.done 
                      ? "bg-brand-orange border-brand-orange text-white"
                      : step.active
                        ? "bg-white border-brand-orange text-brand-orange shadow-md"
                        : "bg-white border-brand-beige text-muted-foreground"
                  }`}
                >
                  {step.done ? <Check className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={3} /> : step.icon}
                </motion.div>
                <span className={`mt-3 text-[0.65rem] sm:text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                  step.done || step.active ? "text-brand-charcoal" : "text-muted-foreground"
                }`}>
                  {step.label}
                </span>
                
                {/* Subtle pulse for active step */}
                {step.active && (
                  <span className="absolute top-0 w-12 h-12 sm:w-14 sm:h-14 bg-brand-orange rounded-full opacity-20 animate-ping" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

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
                    <span className="text-[0.62rem] text-muted-foreground">Pick up from Palitana outlet</span>
                  </button>
                </div>
              </div>

              {/* Store Pickup Selector */}
              {deliveryMethod === 'Pickup' && (
                <div className="bg-white border border-brand-beige rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-brand-beige pb-3">
                    <h3 className="font-serif text-base font-bold text-brand-charcoal">
                      2. Select Branch
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    {/* Navagadh Branch */}
                    <div 
                      onClick={() => setSelectedPickupStore('navagadh')}
                      className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all ${
                        selectedPickupStore === 'navagadh' 
                          ? 'border-brand-orange bg-brand-orange/5 shadow-md' 
                          : 'border-brand-beige hover:border-brand-orange/50 bg-white'
                      }`}
                    >
                      {selectedPickupStore === 'navagadh' && (
                        <div className="absolute top-4 right-4 text-brand-orange font-bold text-xs flex items-center gap-1">
                          <Check className="w-4 h-4" strokeWidth={3} /> Selected
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-block bg-brand-gold/10 text-brand-gold text-[0.6rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                          ⭐ Most Popular
                        </span>
                        <span className="inline-block bg-brand-charcoal text-white text-[0.6rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Since 1972 Flagship Store
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-brand-charcoal text-sm sm:text-base mt-2">
                        {BUSINESS.branches.navagadh.name}
                        {nearestBranch === BUSINESS.branches.navagadh.name && <span className="ml-2 text-[0.6rem] bg-[#D46D2D] text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Closest to you</span>}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 mb-4 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {BUSINESS.branches.navagadh.address}
                      </p>
                      
                      {selectedPickupStore === 'navagadh' && (
                        <div className="mt-4 pt-4 border-t border-brand-orange/20 flex flex-col gap-2">
                          <h5 className="text-[0.65rem] font-bold text-brand-charcoal uppercase tracking-wider mb-1">Pickup Details</h5>
                          <div className="flex items-center gap-2 text-xs text-brand-charcoal font-medium">
                            <span className="w-5 h-5 flex items-center justify-center bg-white rounded-md shadow-sm border border-brand-orange/20">📍</span>
                            {BUSINESS.branches.navagadh.name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-brand-charcoal font-medium">
                            <span className="w-5 h-5 flex items-center justify-center bg-white rounded-md shadow-sm border border-brand-orange/20">🕒</span>
                            Ready in 30–60 Minutes
                          </div>
                          <div className="flex items-center gap-2 text-xs text-brand-charcoal font-medium">
                            <span className="w-5 h-5 flex items-center justify-center bg-white rounded-md shadow-sm border border-brand-orange/20">📞</span>
                            {BUSINESS.branches.navagadh.phone}
                          </div>
                          
                          <a 
                            href={BUSINESS.branches.navagadh.googleMapsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3 w-full bg-white border border-brand-beige text-brand-charcoal text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-brand-cream hover:border-brand-orange transition-colors"
                          >
                            📍 Get Directions
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Taleti Branch */}
                    <div 
                      onClick={() => setSelectedPickupStore('taleti')}
                      className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all ${
                        selectedPickupStore === 'taleti' 
                          ? 'border-brand-orange bg-brand-orange/5 shadow-md' 
                          : 'border-brand-beige hover:border-brand-orange/50 bg-white'
                      }`}
                    >
                      {selectedPickupStore === 'taleti' && (
                        <div className="absolute top-4 right-4 text-brand-orange font-bold text-xs flex items-center gap-1">
                          <Check className="w-4 h-4" strokeWidth={3} /> Selected
                        </div>
                      )}
                      <h4 className="font-serif font-bold text-brand-charcoal text-sm sm:text-base mt-2">
                        {BUSINESS.branches.taleti.name}
                        {nearestBranch === BUSINESS.branches.taleti.name && <span className="ml-2 text-[0.6rem] bg-[#D46D2D] text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Closest to you</span>}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 mb-4 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {BUSINESS.branches.taleti.address}
                      </p>
                      
                      {selectedPickupStore === 'taleti' && (
                        <div className="mt-4 pt-4 border-t border-brand-orange/20 flex flex-col gap-2">
                          <h5 className="text-[0.65rem] font-bold text-brand-charcoal uppercase tracking-wider mb-1">Pickup Details</h5>
                          <div className="flex items-center gap-2 text-xs text-brand-charcoal font-medium">
                            <span className="w-5 h-5 flex items-center justify-center bg-white rounded-md shadow-sm border border-brand-orange/20">📍</span>
                            {BUSINESS.branches.taleti.name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-brand-charcoal font-medium">
                            <span className="w-5 h-5 flex items-center justify-center bg-white rounded-md shadow-sm border border-brand-orange/20">🕒</span>
                            Ready in 30–60 Minutes
                          </div>
                          <div className="flex items-center gap-2 text-xs text-brand-charcoal font-medium">
                            <span className="w-5 h-5 flex items-center justify-center bg-white rounded-md shadow-sm border border-brand-orange/20">📞</span>
                            {BUSINESS.branches.taleti.phone}
                          </div>
                          
                          <a 
                            href={BUSINESS.branches.taleti.googleMapsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3 w-full bg-white border border-brand-beige text-brand-charcoal text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-brand-cream hover:border-brand-orange transition-colors"
                          >
                            📍 Get Directions
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Address Selector */}
              {deliveryMethod === 'Home' && (
                <div className="bg-white border border-brand-beige rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-brand-beige pb-3">
                    <h3 className="font-serif text-base font-bold text-brand-charcoal">
                      2. Shipping Address
                    </h3>
                    
                    {!showNewAddressForm && (
                      <button 
                        onClick={handleOpenNewAddressForm}
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
                      
                      {(!newFlat && !newArea) && (
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
                              <AlertCircle className="w-4 h-4" /> Unable to detect location. Please enter manually.
                            </div>
                          )}
                          {locationStatus === "success" && newLat && newLng && (
                            <div className="mt-3 w-full h-24 bg-brand-cream/30 rounded-xl border border-brand-beige overflow-hidden relative flex items-center justify-center">
                              <MapPin className="w-6 h-6 text-brand-orange absolute z-10 animate-bounce" />
                              <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(#D46D2D 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                              <span className="absolute bottom-2 right-2 text-[0.6rem] font-bold text-brand-orange/60 bg-white/80 px-2 py-0.5 rounded-md">Map Preview</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Recipient Name *</label>
                          <input 
                            type="text" 
                            placeholder="Aarya Mehta"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-3 min-h-[44px] text-xs bg-white focus:outline-none focus:border-brand-orange"
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
                            className="border border-brand-beige rounded-lg px-3 py-3 min-h-[44px] text-xs bg-white focus:outline-none focus:border-brand-orange"
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
                            value={newFlat}
                            onChange={(e) => setNewFlat(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-3 min-h-[44px] text-xs bg-white focus:outline-none focus:border-brand-orange"
                            required
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Area, Street, Sector, Village *</label>
                          <input 
                            type="text" 
                            placeholder="Area, Street, Sector, Village"
                            value={newArea}
                            onChange={(e) => setNewArea(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-3 min-h-[44px] text-xs bg-white focus:outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 col-span-full">
                        <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Landmark (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="E.g. near apollo hospital"
                          value={newLandmark}
                          onChange={(e) => setNewLandmark(e.target.value)}
                          className="border border-brand-beige rounded-lg px-3 py-3 min-h-[44px] text-xs bg-white focus:outline-none focus:border-brand-orange"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 col-span-full">
                        <div className="flex flex-col gap-1.5 relative">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Pincode *</label>
                          <input 
                            type="text" 
                            placeholder="380015"
                            value={newPincode}
                            onChange={async (e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setNewPincode(val);
                              
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
                                    setNewCity(fetchedCity);
                                  }
                                  if (fetchedState) {
                                    setNewState(fetchedState);
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
                                    const freeThreshold = matchedZone.free_delivery_above ? Number(matchedZone.free_delivery_above) : null;
                                    const isFree = freeThreshold && cartSubtotal >= freeThreshold;
                                    const finalCharge = isFree ? 0 : charge;

                                    setPincodeStatus({
                                      type: 'success',
                                      message: `Serviceable Area! Shipping: ₹${finalCharge}${isFree ? ' (Free Shipping Threshold Met)' : ''} | Delivery: ${matchedZone.estimated_days || '1-2 Days'}`
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
                                  setNewCity("");
                                  setNewState("");
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
                            value={newCity}
                            onChange={(e) => setNewCity(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-3 min-h-[44px] text-xs bg-white focus:outline-none focus:border-brand-orange"
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
                            value={newState}
                            onChange={(e) => setNewState(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-3 min-h-[44px] text-xs bg-white focus:outline-none focus:border-brand-orange"
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
                          onClick={() => setShowNewAddressForm(false)}
                          className="px-4 py-3 min-h-[44px] border border-brand-beige hover:border-brand-gold rounded-lg text-xs font-bold text-brand-charcoal transition-colors hover:bg-white"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="px-5 py-3 min-h-[44px] bg-brand-orange hover:bg-brand-orange-hover rounded-lg text-xs font-bold text-white transition-colors"
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
                        <motion.div 
                          key={addr.id}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedAddressId(addr.id)}
                          animate={selectedAddressId === addr.id ? { 
                            boxShadow: "0 0 0 3px rgba(212, 109, 45, 0.25)",
                            borderColor: "#D46D2D"
                          } : {
                            boxShadow: "none",
                            borderColor: "#E8DCC4"
                          }}
                          className={`rounded-xl border-2 p-4 flex gap-3 cursor-pointer transition-all bg-white`}
                        >
                          <div className={`mt-1 h-4 w-4 rounded-full border flex items-center justify-center ${selectedAddressId === addr.id ? "border-brand-orange text-brand-orange" : "border-brand-beige"}`}>
                            {selectedAddressId === addr.id && <div className="h-2 w-2 rounded-full bg-brand-orange"></div>}
                          </div>
                          <div>
                            <h4 className="font-serif text-xs font-bold text-brand-charcoal flex items-center gap-1.5">
                              {addr.name}
                              <span className="text-[0.55rem] font-bold uppercase tracking-wider bg-brand-cream border border-brand-beige px-1.5 py-0.5 rounded-full text-brand-orange ml-1">
                                {addr.type || 'Home'}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[0.55rem] font-bold uppercase tracking-wider bg-brand-beige px-1.5 py-0.5 rounded text-brand-gold">Default</span>
                              )}
                            </h4>
                            <p className="text-[0.7rem] text-muted-foreground mt-2 leading-relaxed">
                              {addr.street},<br />
                              {addr.landmark ? `Landmark: ${addr.landmark}, ` : ''}
                              {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[0.7rem] text-brand-charcoal font-semibold flex items-center gap-1">
                                <Phone className="h-3 w-3 text-brand-gold" /> {addr.phone}
                              </span>
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }}
                                className="text-[0.65rem] font-bold text-brand-orange hover:underline px-2 py-1"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </motion.div>
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
                
                {cart.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-xs">
                    Your cart is empty.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3.5 max-h-[220px] overflow-y-auto pr-1">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex gap-3 justify-between items-center text-xs">
                        <div className="flex gap-2.5 items-center">
                          <img src={item.image} alt={item.productName} className="h-10 w-10 rounded-lg object-cover bg-brand-cream border border-brand-beige flex-shrink-0" />
                          <div>
                            <h4 className="font-serif font-bold text-brand-charcoal line-clamp-1">{item.productName}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[0.65rem] text-muted-foreground font-medium">{item.weight}</span>
                              <div className="flex items-center gap-1.5 bg-[#FAF6EE] border border-[#EAE0D3] rounded px-1.5 py-0.5">
                                <button 
                                  onClick={(e) => { e.preventDefault(); handleUpdateQuantity(item.productId, item.weight, item.quantity - 1); }}
                                  className="text-brand-charcoal hover:text-brand-orange disabled:opacity-30 disabled:cursor-not-allowed"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                                <span className="text-[0.65rem] font-bold text-brand-charcoal w-3 text-center">{item.quantity}</span>
                                <button 
                                  onClick={(e) => { e.preventDefault(); handleUpdateQuantity(item.productId, item.weight, item.quantity + 1); }}
                                  className="text-brand-charcoal hover:text-brand-orange"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-sans tabular-nums font-bold text-brand-charcoal">₹{item.price * item.quantity}</span>
                          <button onClick={() => handleRemoveFromCart(item.productId, item.weight)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-full transition-colors" aria-label="Remove item">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div className="bg-white border border-brand-beige rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                <h3 className="font-serif text-sm font-bold text-brand-charcoal border-b border-brand-beige pb-3">
                  You Might Also Like
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {recommendations.map(rec => (
                    <div key={rec.id} className="border border-brand-beige rounded-xl p-2.5 flex flex-col items-center text-center hover:border-brand-orange transition-colors">
                      <img src={rec.images?.[0] || "/placeholder.png"} className="w-16 h-16 object-contain rounded mb-2" alt={rec.name} />
                      <span className="text-[0.65rem] font-bold text-brand-charcoal line-clamp-1 leading-tight mb-0.5">{rec.name}</span>
                      <span className="text-[0.6rem] text-brand-orange font-bold mb-2">₹{Object.values(rec.prices)[0] as number}</span>
                      <button onClick={(e) => handleAddRecToCart(rec, e)} className="text-[0.55rem] font-bold uppercase tracking-wider text-white bg-brand-orange py-1.5 px-3 rounded-full hover:bg-brand-orange-hover w-full transition-colors">
                        Add
                      </button>
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
                  <span className="font-sans tabular-nums text-lg text-brand-orange font-bold">₹{totalPayable}</span>
                </div>

                {pincodeError && (
                  <div className="bg-red-50 text-red-600 text-[0.65rem] font-medium p-3 rounded-xl mt-2 mb-2 border border-red-100 flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{pincodeError}</p>
                  </div>
                )}

                {deliveryDays && !pincodeError && (
                  <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl mt-2 mb-2 border border-emerald-100 flex items-center gap-3">
                    <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Check className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-600/80">Estimated Delivery</span>
                      <span className="text-sm font-bold">{deliveryDays.includes('min') ? deliveryDays : `Arriving by ${deliveryDays}`}</span>
                    </div>
                  </div>
                )}

                <div className="bg-[#FAF6EE] border border-[#EAE0D3] rounded-xl p-3 flex items-center justify-center gap-2 mb-2 mt-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-[#4A2F1F]">100% Secure Payment</span>
                  <div className="flex gap-1.5 ml-2">
                    <span className="text-[0.6rem] font-bold bg-white px-1.5 py-0.5 rounded border border-[#EAE0D3]">UPI</span>
                    <span className="text-[0.6rem] font-bold bg-white px-1.5 py-0.5 rounded border border-[#EAE0D3]">CARDS</span>
                  </div>
                </div>

                <button 
                  onClick={handleProceedToPayment}
                  disabled={!!pincodeError && deliveryMethod === 'Home'}
                  className="w-full hidden lg:inline-flex items-center justify-center rounded-xl bg-brand-orange py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-orange-hover disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer"
                >
                  Proceed to Payment <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* --- STICKY MOBILE BOTTOM BAR --- */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#EAE0D3] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] lg:hidden z-30 pointer-events-auto flex items-center justify-between">
        <div className="flex flex-col">
           <span className="text-[0.65rem] text-muted-foreground font-bold uppercase tracking-wider">Total to pay</span>
           <span className="font-sans tabular-nums text-xl font-black text-[#D46D2D]">₹{totalPayable}</span>
        </div>
        <button 
          onClick={handleProceedToPayment}
          disabled={!!pincodeError && deliveryMethod === 'Home'}
          className="flex-1 ml-6 rounded-xl bg-brand-orange py-3.5 text-sm font-bold text-white shadow-lg transition-transform active:scale-95 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          Pay Now <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* --- RAZORPAY GATEWAY SIMULATOR MODAL --- */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Animated Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isPaying && !paymentSuccess) setShowPaymentModal(false);
              }}
              className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-sm"
            />

            {/* Animated Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full border border-brand-gold overflow-hidden z-10"
            >
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
                      <span className="font-sans tabular-nums text-lg font-bold">₹{totalPayable}</span>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 flex flex-col gap-6">
                    {isPaying ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center gap-5">
                        <div className="relative flex items-center justify-center">
                          <div className="h-14 w-14 rounded-full border-4 border-brand-orange/10 border-t-brand-orange border-r-brand-orange animate-spin"></div>
                        </div>
                        <div className="flex flex-col gap-1.5 animate-pulse">
                          <h4 className="font-serif text-sm font-bold text-brand-charcoal">Processing Your Order</h4>
                          <p className="text-[0.68rem] text-muted-foreground max-w-xs leading-relaxed">
                            Connecting with Razorpay secure servers. Please do not close or refresh this page.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="text-[0.7rem] font-bold text-brand-charcoal uppercase block mb-3">Choose Payment Method</span>
                          <div className="flex flex-col gap-3">
                            {/* Option 1: Pay Online via Razorpay */}
                            <motion.label 
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className={`flex items-start gap-3.5 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                paymentOption === 'Razorpay_UPI' 
                                  ? "border-brand-orange bg-brand-orange/5 shadow-[0_0_12px_rgba(212,109,45,0.15)]" 
                                  : "border-brand-beige hover:border-brand-gold bg-white"
                              }`}
                            >
                              <input 
                                type="radio" 
                                name="payment-method"
                                checked={paymentOption === 'Razorpay_UPI'}
                                onChange={() => setPaymentOption('Razorpay_UPI')}
                                className="accent-brand-orange mt-0.5"
                              />
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold text-brand-charcoal flex items-center gap-1.5">
                                  Pay Online (UPI / Cards / Netbanking)
                                  <span className="text-[0.55rem] font-bold text-brand-orange uppercase tracking-wider bg-brand-orange/10 px-1.5 py-0.5 rounded">Secure</span>
                                </span>
                                <span className="text-[0.68rem] text-muted-foreground leading-relaxed">
                                  Pay instantly using GooglePay, PhonePe, Paytm, Cards, or Netbanking via secure Razorpay checkout overlay.
                                </span>
                              </div>
                            </motion.label>

                            {/* Option 2: Cash on Delivery */}
                            <motion.label 
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className={`flex items-start gap-3.5 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                paymentOption === 'COD' 
                                  ? "border-brand-orange bg-brand-orange/5 shadow-[0_0_12px_rgba(212,109,45,0.15)]" 
                                  : "border-brand-beige hover:border-brand-gold bg-white"
                              }`}
                            >
                              <input 
                                type="radio" 
                                name="payment-method"
                                checked={paymentOption === 'COD'}
                                onChange={() => setPaymentOption('COD')}
                                className="accent-brand-orange mt-0.5"
                              />
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold text-brand-charcoal">
                                  Cash on Delivery (COD)
                                </span>
                                <span className="text-[0.68rem] text-muted-foreground leading-relaxed">
                                  Pay with cash directly to the delivery rider when your sweet box arrives at your doorstep.
                                </span>
                              </div>
                            </motion.label>
                          </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex gap-3 border-t border-brand-beige pt-4 mt-2">
                          <button 
                            onClick={() => setShowPaymentModal(false)}
                            className="flex-1 py-2.5 border border-brand-beige hover:border-brand-gold rounded-lg text-xs font-bold text-brand-charcoal transition-colors hover:bg-brand-cream cursor-pointer"
                          >
                            Cancel Checkout
                          </button>
                          <button 
                            onClick={executePayment}
                            className="flex-1 py-2.5 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
                          >
                            Pay Securely ₹{totalPayable}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                /* Animated Payment Successful Receipt */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 flex flex-col items-center justify-center text-center gap-6"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center border-2 border-emerald-500 relative"
                  >
                    <svg className="h-9 w-9 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <motion.path 
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.6, ease: "easeInOut", delay: 0.15 }}
                        d="M20 6L9 17l-5-5"
                      />
                    </svg>
                  </motion.div>
                  <div>
                    <span className="text-[0.62rem] text-emerald-600 font-bold uppercase tracking-widest block mb-1">Payment Success</span>
                    <h3 className="font-serif text-xl font-bold text-brand-charcoal">Order Successfully Placed!</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1.5 leading-relaxed">
                      Thank you! Your transaction has been recorded. We have sent the confirmation invoice details to your email.
                    </p>
                  </div>

                  <div className="bg-brand-cream border border-brand-beige rounded-xl p-4 w-full text-left flex flex-col gap-2.5 text-xs text-brand-charcoal shadow-inner">
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
                      <span className="font-bold">{paymentOption === 'COD' ? 'Cash on Delivery' : 'Razorpay Secure'}</span>
                    </div>
                  </div>

                  {/* Customer Invoice Download/Email Buttons */}
                  {invoiceRecord ? (
                    <div className="flex gap-2.5 w-full mt-1.5">
                      <a 
                        href={`/api/invoices/download?invoiceId=${invoiceRecord.id}`}
                        className="flex-1 py-2.5 border border-brand-beige hover:border-brand-gold bg-white text-brand-charcoal text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs hover:bg-brand-cream"
                      >
                        Download Invoice
                      </a>
                      <button 
                        onClick={async () => {
                          setIsEmailSending(true);
                          try {
                            const res = await fetch("/api/invoices/send", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ invoiceId: invoiceRecord.id })
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
                            setIsEmailSending(false);
                          }
                        }}
                        disabled={isEmailSending}
                        className="flex-1 py-2.5 bg-brand-charcoal hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {isEmailSending ? "Sending..." : "Email Invoice"}
                      </button>
                    </div>
                  ) : (
                    <div className="text-[0.68rem] text-muted-foreground animate-pulse mt-1 w-full text-center">
                      Preparing digital invoice receipt...
                    </div>
                  )}

                  <button 
                    onClick={closeReceiptModal}
                    className="w-full py-3 bg-brand-orange hover:bg-brand-orange-hover text-white font-bold rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                  >
                    Go to Order History
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </>
  );
}
