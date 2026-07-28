"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { BUSINESS } from "@/lib/businessConfig";
import {
    saveProducts,
    getOrders,
    saveOrders,
    getCoupons,
    saveCoupons,
    Product,
    Order,
    Coupon
} from "@/lib/types";
import { fetchProducts, fetchIngredients, addIngredient, updateProductIngredients, supabase } from "@/lib/supabaseClient";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";
import AdminCategories from "@/components/AdminCategories";
import AdminBanners from "@/components/AdminBanners";
import AdminNotifications from "@/components/AdminNotifications";
import AdminPayments from "@/components/AdminPayments";
import AdminRecovery from "@/components/AdminRecovery";
import AdminAnalytics from "@/components/AdminAnalytics";
import AdminBackups from "@/components/AdminBackups";
import AdminIngredients from "@/components/AdminIngredients";
import AdminDeliveryZones from "@/components/AdminDeliveryZones";
import AdminInvoices from "@/components/AdminInvoices";
import AdminBlogs from "@/components/AdminBlogs";
import AdminWhatsAppCenter from "@/components/AdminWhatsAppCenter";
import AdminShipping from "@/components/admin/AdminShipping";
import WhatsAppCenter from "@/components/WhatsAppCenter";
import AdminPrinters from "@/components/AdminPrinters";
import { OrdersSkeleton } from "@/components/admin/OrdersSkeleton";
import { OrderCard } from "@/components/admin/OrderCard";
import { WAOrderCard } from "@/components/admin/WAOrderCard";
import { SearchToolbar } from "@/components/admin/SearchToolbar";
import { AnalyticsCards } from "@/components/admin/AnalyticsCards";
import { AdminCustomers } from "@/components/admin/AdminCustomers";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminStaff } from "@/components/admin/AdminStaff";
import {
    LayoutDashboard,
    Dessert,
    ShoppingBag,
    Users,
    Tag,
    MapPin,
    Plus,
    Trash2,
    Edit,
    TrendingUp,
    IndianRupee,
    Check,
    X,
    UploadCloud,
    Loader2,
    Phone,
    FileText,
    Bell,
    Database,
    Search,
    PenTool,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    Printer,
    GripVertical,
    ShieldCheck
} from "lucide-react";

export default function AdminPanel() {
    const [isAdminAuth, setIsAdminAuth] = useState(false);
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "orders" | "whatsapp_orders" | "invoices" | "customers" | "staff" | "categories" | "banners" | "notifications" | "payments" | "recovery" | "backups" | "ingredients" | "zones" | "blogs" | "whatsapp" | "printers">("dashboard");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const ADMIN_MENU_ITEMS = [
        { id: "dashboard", label: "Overview", fullLabel: "Administrative Overview", icon: LayoutDashboard },
        { id: "products", label: "Inventory", fullLabel: "Sweet Inventory", icon: Dessert, badgeKey: "products" },
        { id: "orders", label: "Orders", fullLabel: "Orders Tracking", icon: ShoppingBag, badgeKey: "orders" },
        { id: "shipping", label: "Shipping", fullLabel: "🚚 Shiprocket Logistics", icon: Truck },
        { id: "whatsapp_orders", label: "WhatsApp Orders", fullLabel: "🟢 WhatsApp Orders", icon: ShoppingBag, badgeKey: "whatsapp_orders" },
        { id: "invoices", label: "Invoices", fullLabel: "Invoice Management", icon: FileText },
        { id: "blogs", label: "Blogs CMS", fullLabel: "Blog Articles CMS", icon: PenTool },
        { id: "customers", label: "Customers", fullLabel: "Customers Directory", icon: Users },
        { id: "staff", label: "Staff & Access", fullLabel: "👥 Staff & Access Management", icon: ShieldCheck },
        { id: "categories", label: "Categories", fullLabel: "Category Management", icon: Dessert },
        { id: "zones", label: "Zones", fullLabel: "Delivery Zones", icon: MapPin },
        { id: "banners", label: "Banners", fullLabel: "Homepage Banners", icon: UploadCloud },
        { id: "backups", label: "Backups", fullLabel: "Database Backups", icon: Database },
        { id: "printers", label: "Thermal Printers", fullLabel: "Automatic Printing Settings", icon: Printer },
    ];
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
    const [isFilteringOrders, setIsFilteringOrders] = useState<boolean>(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [banners, setBanners] = useState<any[]>([]);
    const [dbCustomers, setDbCustomers] = useState<any[]>([]);
    const [paymentRecoveries, setPaymentRecoveries] = useState<any[]>([]);
    
    // Order sections state
    const [orderStatusFilter, setOrderStatusFilter] = useState<"All" | "Processing" | "Shipped" | "Delivered" | "Cancelled">("All");
    const [orderSearchQuery, setOrderSearchQuery] = useState("");
    const [customerSearchQuery, setCustomerSearchQuery] = useState("");

    // WhatsApp Orders states
    const [waStatusFilter, setWaStatusFilter] = useState<"All" | "Pending" | "Paid" | "Failed" | "Cancelled" | "Delivered" | "Processing">("All");
    const [waDateFilter, setWaDateFilter] = useState<"All" | "Today" | "This Week">("All");
    const [waSearchQuery, setWaSearchQuery] = useState("");
    const [waSelectedOrder, setWaSelectedOrder] = useState<any>(null);

    // Product CRUD states
    const [showProductForm, setShowProductForm] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [prodIngredients, setProdIngredients] = useState<string[]>([]); // stores selected ingredient UUIDs
    const [prodSubTab, setProdSubTab] = useState<string>("all");
    const [prodSearchQuery, setProdSearchQuery] = useState("");
    const [debouncedProdSearch, setDebouncedProdSearch] = useState("");
    const [selectedProductIndex, setSelectedProductIndex] = useState<number>(-1);
    const [draggedProductId, setDraggedProductId] = useState<string | null>(null);
    const [isUpdatingPositions, setIsUpdatingPositions] = useState(false);
    const productModalBodyRef = useRef<HTMLDivElement>(null);

    // Auto-scroll modal body to top when modal opens
    useEffect(() => {
        if (showProductForm) {
            if (productModalBodyRef.current) {
                productModalBodyRef.current.scrollTop = 0;
            }
        }
    }, [showProductForm, editingProduct]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedProdSearch(prodSearchQuery);
            setSelectedProductIndex(-1);
        }, 250);
        return () => clearTimeout(timer);
    }, [prodSearchQuery]);

    const filteredProducts = useMemo(() => {
        const query = debouncedProdSearch.trim().toLowerCase();
        const sorted = [...products].sort((a, b) => (a.position || 0) - (b.position || 0));

        return sorted.filter((p) => {
            const matchesSubTab = prodSubTab === "all" || p.category === prodSubTab;
            if (!query) return matchesSubTab;

            const nameMatch = (p.name || "").toLowerCase().includes(query);
            const descMatch = (p.description || "").toLowerCase().includes(query);
            const catMatch = (p.category || "").toLowerCase().includes(query);
            const badgeMatch = (p.badges || []).some(b => b.toLowerCase().includes(query));

            return matchesSubTab && (nameMatch || descMatch || catMatch || badgeMatch);
        });
    }, [products, debouncedProdSearch, prodSubTab]);

    // Product Form states
    const [prodName, setProdName] = useState("");
    const [prodDesc, setProdDesc] = useState("");
    const [prodCat, setProdCat] = useState("milk-sweets");
    const [prodPrice250, setProdPrice250] = useState("");
    const [prodPrice500, setProdPrice500] = useState("");
    const [prodPrice1kg, setProdPrice1kg] = useState("");
    const [prodStock, setProdStock] = useState("100");
    const [prodPopular, setProdPopular] = useState(false);
    const [prodFestive, setProdFestive] = useState(false);
    const [prodPosition, setProdPosition] = useState("0");
    const [prodImage, setProdImage] = useState("https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80");
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [uploadError, setUploadError] = useState("");

    // Variants & Pricing state
    interface VariantPricing {
        weight: string;
        originalPrice: number | string;
        offPercent: number | string;
        finalPrice: number | string;
    }
    const [variants, setVariants] = useState<VariantPricing[]>([
        { weight: "100g", originalPrice: 0, offPercent: 0, finalPrice: 0 },
        { weight: "200g", originalPrice: 0, offPercent: 0, finalPrice: 0 },
        { weight: "500g", originalPrice: 0, offPercent: 0, finalPrice: 0 },
        { weight: "1kg", originalPrice: 0, offPercent: 0, finalPrice: 0 }
    ]);

    // Ingredients and Food states
    const [allIngredients, setAllIngredients] = useState<any[]>([]);
    const [ingSearchQuery, setIngSearchQuery] = useState("");
    const [prodShelfLife, setProdShelfLife] = useState("12");
    const [prodStorageInstructions, setProdStorageInstructions] = useState("Store in a cool and dry place.");
    const [prodAllergens, setProdAllergens] = useState<string[]>([]);
    const [prodDietaryTags, setProdDietaryTags] = useState<string[]>([]);
    const [prodHighlights, setProdHighlights] = useState<string[]>([]);
    const [newHighlight, setNewHighlight] = useState("");
    const [prodBadges, setProdBadges] = useState<string[]>([]);
    const [newBadge, setNewBadge] = useState("");
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);

    const handleGenerateAiDescription = async () => {
        if (!prodName) {
            alert("Please enter a product name first.");
            return;
        }

        setIsGeneratingAi(true);
        try {
            const selectedIngNames = allIngredients
                .filter(ing => prodIngredients.includes(ing.id))
                .map(ing => ing.name);

            const weights = [];
            if (prodPrice250) weights.push("250g");
            if (prodPrice500) weights.push("500g");
            if (prodPrice1kg) weights.push("1kg");

            const res = await fetch("/api/admin/generate-description", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: prodName,
                    category: prodCat,
                    ingredients: selectedIngNames,
                    weight: weights.join(", "),
                    shelfLife: prodShelfLife,
                    storageInstructions: prodStorageInstructions
                })
            });
            const data = await res.json();
            if (data.success && data.data) {
                const info = data.data;
                // Autofill description (append Why Choose Mehta Dairy)
                const combinedDesc = `${info.description}\n\nWhy Choose Mehta Dairy:\n${info.whyChoose}`;
                setProdDesc(combinedDesc);

                // Autofill highlights (key features)
                if (info.keyFeatures && info.keyFeatures.length > 0) {
                    setProdHighlights(info.keyFeatures);
                }

                // Autofill shelf life & storage
                if (info.shelfLife) setProdShelfLife(info.shelfLife.toString());
                if (info.storageInstructions) setProdStorageInstructions(info.storageInstructions);
            } else {
                alert(data.error || "Failed to generate AI description.");
            }
        } catch (e) {
            console.error(e);
            alert("Error generating AI description.");
        } finally {
            setIsGeneratingAi(false);
        }
    };

    const [newOrderAlert, setNewOrderAlert] = useState<any>(null);
    const [cancellationAlert, setCancellationAlert] = useState<any>(null);

    const loadData = async () => {
        setOrdersLoading(true);
        try {
            const allProducts = await fetchProducts();
            setProducts(allProducts);
            
            const dbIngredients = await fetchIngredients();
            setAllIngredients(dbIngredients);
            
            const { data: cats } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
            if (cats) setCategories(cats);

            const { data: bans } = await supabase.from('banners').select('*').order('created_at', { ascending: true });
            if (bans) setBanners(bans);

            // Fetch protected data via secure API route
            const res = await fetch("/api/admin/data");
            if (res.ok) {
              const { data } = await res.json();
              if (data.orders) {
                  const formattedOrders = data.orders.map((o: any) => ({
                      id: o.id,
                      orderNumber: o.order_number,
                      date: new Date(o.created_at).toLocaleDateString(),
                      createdAtRaw: o.created_at,
                      status: o.status,
                      total: o.total,
                      paymentStatus: o.payment_status,
                      paymentMethod: o.payment_method,
                      paymentId: o.payment_id,
                      paidAt: o.paid_at,
                      paymentCompletedAt: o.payment_completed_at,
                      invoiceUrl: o.invoice_url,
                      userName: o.user_name,
                      userPhone: o.user_phone,
                      userEmail: o.user_email,
                      shippingAddress: o.shipping_address,
                      invoice: o.invoices && o.invoices.length > 0 ? o.invoices[0] : null,
                      source: o.source || (o.shipping_address && typeof o.shipping_address === 'object' && o.shipping_address.source ? o.shipping_address.source : 'website'),
                      cancellationReason: o.cancellation_reason,
                      cancelledBy: o.cancelled_by,
                      cancelledAt: o.cancelled_at,
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
              }
              if (data.customers) {
                  setDbCustomers(data.customers);
              }
              if (data.paymentRecoveries) {
                  setPaymentRecoveries(data.paymentRecoveries);
              }
            } else {
              if (res.status === 401) {
                localStorage.removeItem("mehta_admin_auth");
                setIsAdminAuth(false);
              } else {
                setOrders(getOrders()); // fallback to local mock if error
              }
            }
        } catch (err) {
            console.error("Error loading admin data:", err);
        } finally {
            setOrdersLoading(false);
        }
    };

    // Load Admin Data
    useEffect(() => {
        if (!isAdminAuth) {
            const stored = localStorage.getItem("mehta_admin_auth");
            if (stored === "true") setIsAdminAuth(true);
            return;
        }

        if (isAdminAuth) loadData();
    }, [activeTab, isAdminAuth]);

    const playDingDongSound = () => {
        // 1. Web Audio API synthesized dual-tone bell chime (guaranteed fallback even offline)
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                const ctx = new AudioCtx();
                const playNote = (freq: number, startTime: number, duration: number) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(freq, startTime);
                    gain.gain.setValueAtTime(0.4, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(startTime);
                    osc.stop(startTime + duration);
                };
                const now = ctx.currentTime;
                playNote(880, now, 0.4);       // A5 note
                playNote(1174.66, now + 0.25, 0.6); // D6 note (high chime)
            }
        } catch (e) {
            console.log("Web audio chime error:", e);
        }

        // 2. Play external audio sound
        try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav");
            audio.play().catch(err => console.log("Autoplay blocked:", err));
            setTimeout(() => {
                const audio2 = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav");
                audio2.play().catch(err => console.log("Autoplay blocked:", err));
            }, 600);
        } catch (e) {
            console.error("Audio error:", e);
        }
    };

    // Auto-refresh Orders Tracking & WhatsApp Orders every 10 seconds with Sound & Screen Notification
    useEffect(() => {
        if (!isAdminAuth) return;

        const pollOrders = async () => {
            try {
                const res = await fetch("/api/admin/data");
                if (res.ok) {
                    const { data } = await res.json();
                    if (data.orders) {
                        const fetchedOrders = data.orders.map((o: any) => ({
                            id: o.id,
                            orderNumber: o.order_number,
                            date: new Date(o.created_at).toLocaleDateString(),
                            createdAtRaw: o.created_at,
                            status: o.status,
                            total: o.total,
                            paymentStatus: o.payment_status,
                            paymentMethod: o.payment_method,
                            paymentId: o.payment_id,
                            paidAt: o.paid_at,
                            paymentCompletedAt: o.payment_completed_at,
                            invoiceUrl: o.invoice_url,
                            userName: o.user_name,
                            userPhone: o.user_phone,
                            userEmail: o.user_email,
                            shippingAddress: o.shipping_address,
                            invoice: o.invoices && o.invoices.length > 0 ? o.invoices[0] : null,
                            source: o.source || (o.shipping_address && typeof o.shipping_address === 'object' && o.shipping_address.source ? o.shipping_address.source : 'website'),
                            cancellationReason: o.cancellation_reason,
                            cancelledBy: o.cancelled_by,
                            cancelledAt: o.cancelled_at,
                            items: o.order_items ? o.order_items.map((i: any) => ({
                                productId: i.product_id,
                                productName: i.product_name,
                                weight: i.weight,
                                quantity: i.quantity,
                                price: i.price,
                                image: i.image
                            })) : []
                        }));

                        setOrders(prevOrders => {
                            if (prevOrders && prevOrders.length > 0) {
                                const existingIds = new Set(prevOrders.map(o => o.id));
                                const newlyArrived = fetchedOrders.filter((o: any) => !existingIds.has(o.id));

                                if (newlyArrived.length > 0) {
                                    const newest = newlyArrived[0];
                                    playDingDongSound();
                                    setNewOrderAlert({
                                        id: newest.id,
                                        order_number: newest.orderNumber,
                                        total: newest.total,
                                        source: newest.source,
                                        userName: newest.userName,
                                        userPhone: newest.userPhone
                                    });
                                }
                            }
                            return fetchedOrders as any;
                        });
                    }

                    if (data.customers) setDbCustomers(data.customers);
                    if (data.paymentRecoveries) setPaymentRecoveries(data.paymentRecoveries);
                }
            } catch (e) {
                console.error("Auto-refresh orders error:", e);
            }
        };

        // Poll every 10 seconds (10,000 ms)
        const interval = setInterval(pollOrders, 10000);

        // Supabase Realtime Listener (instant websocket backup)
        const channel = supabase
            .channel("admin-live-orders")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "orders" },
                (payload) => {
                    console.log("Admin detected new order realtime:", payload.new);
                    playDingDongSound();
                    setNewOrderAlert(payload.new);
                    loadData();
                }
            )
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "notifications" },
                async (payload) => {
                    if (payload.new && payload.new.type === 'admin') {
                        const { data: order } = await supabase
                            .from('orders')
                            .select('*, order_cancellations(*)')
                            .eq('id', payload.new.order_id)
                            .single();
                            
                        if (order) {
                            const cancelRec = order.order_cancellations?.[0] || order.order_cancellations || null;
                            setCancellationAlert({
                                id: order.id,
                                orderNumber: order.order_number,
                                userName: order.user_name || 'Guest',
                                userPhone: order.user_phone || 'N/A',
                                total: order.total,
                                paymentMethod: order.payment_method || 'Online',
                                paymentStatus: order.payment_status,
                                status: order.status,
                                reason: cancelRec?.reason || order.cancellation_reason || 'No reason provided',
                                cancellationId: cancelRec?.id || null
                            });
                            playDingDongSound();
                            loadData();
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [isAdminAuth]);

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError("");
        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: loginEmail, password: loginPassword })
            });
            if (res.ok) {
                setIsAdminAuth(true);
                localStorage.setItem("mehta_admin_auth", "true");
            } else {
                const data = await res.json();
                setLoginError(data.error || "Login failed");
            }
        } catch (e) {
            setLoginError("Network error");
        }
    };

    // Calculations for Stats Card
    const totalRevenue = orders
        .filter(o => o.paymentStatus === "Paid")
        .reduce((sum, o) => sum + o.total, 0);

    const totalCustomers = Array.from(new Set(orders.map(o => o.userName))).length || 1;

    // --- PRODUCT CRUD ACTIONS ---
    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prodName || !prodDesc) return;

        // Parse prices & build metadata array
        const parsedPrices: { [weight: string]: number } = {};
        const cleanedVariants = variants.filter(v => v.weight.trim() !== "");
        
        cleanedVariants.forEach(v => {
            parsedPrices[v.weight.trim()] = Number(v.finalPrice) || 0;
        });

        if (Object.keys(parsedPrices).length === 0) {
            // Default fallback pricing
            parsedPrices["500g"] = 400;
        }

        // Clean metadata to serialize
        const metaSerialized = "PRICES_META:" + JSON.stringify(cleanedVariants);
        const finalBadges = [
            ...prodBadges.filter(b => !b.startsWith("PRICES_META:")),
            metaSerialized
        ];

        if (editingProduct) {
            // EDIT MODE
            const { error } = await supabase.from('products').update({
                name: prodName,
                description: prodDesc,
                category_slug: prodCat,
                prices: parsedPrices,
                stock: Number(prodStock),
                popular: prodPopular,
                festival_special: prodFestive,
                position: Number(prodPosition) || 0,
                images: [prodImage],
                shelf_life: Number(prodShelfLife) || 12,
                storage_instructions: prodStorageInstructions,
                allergens: prodAllergens,
                dietary_tags: prodDietaryTags,
                highlights: prodHighlights,
                badges: finalBadges
            }).eq('id', editingProduct.id);

            if (error) {
                if (error.message?.includes('position') || error.details?.includes('position')) {
                    console.warn("Retrying without position column...");
                    const { position, ...cleanPayload } = {
                        name: prodName,
                        description: prodDesc,
                        category_slug: prodCat,
                        prices: parsedPrices,
                        stock: Number(prodStock),
                        popular: prodPopular,
                        festival_special: prodFestive,
                        images: [prodImage],
                        shelf_life: Number(prodShelfLife) || 12,
                        storage_instructions: prodStorageInstructions,
                        allergens: prodAllergens,
                        dietary_tags: prodDietaryTags,
                        highlights: prodHighlights,
                        badges: finalBadges
                    };
                    const { error: retryError } = await supabase.from('products').update(cleanPayload).eq('id', editingProduct.id);
                    if (retryError) {
                        console.error("Failed to update product on retry:", retryError);
                        alert("Failed to update product: " + retryError.message);
                        return;
                    }
                } else {
                    console.error("Failed to update product:", error);
                    alert("Failed to update product: " + error.message);
                    return; // Early return to keep the form open and retain input data
                }
            }

            await updateProductIngredients(editingProduct.id, prodIngredients);
            const updatedIngredientNames = allIngredients
                .filter(ing => prodIngredients.includes(ing.id))
                .map(ing => ing.name);

            setProducts(products.map(p => p.id === editingProduct.id ? {
                ...p,
                name: prodName,
                description: prodDesc,
                category: prodCat,
                prices: parsedPrices,
                stock: Number(prodStock),
                popular: prodPopular,
                festivalSpecial: prodFestive,
                position: Number(prodPosition) || 0,
                images: [prodImage],
                ingredients: updatedIngredientNames,
                ingredientIds: prodIngredients,
                shelfLife: Number(prodShelfLife) || 12,
                storageInstructions: prodStorageInstructions,
                dietaryTags: prodDietaryTags,
                highlights: prodHighlights,
                badges: finalBadges
            } : p));
            setEditingProduct(null);
        } else {
            // ADD MODE
            const { data, error } = await supabase.from('products').insert([{
                name: prodName,
                description: prodDesc,
                category_slug: prodCat,
                prices: parsedPrices,
                stock: Number(prodStock),
                popular: prodPopular,
                festival_special: prodFestive,
                position: Number(prodPosition) || 0,
                images: [prodImage],
                rating: 5.0,
                reviews_count: 0,
                shelf_life: Number(prodShelfLife) || 12,
                storage_instructions: prodStorageInstructions,
                allergens: prodAllergens,
                dietary_tags: prodDietaryTags,
                highlights: prodHighlights,
                badges: finalBadges
            }]).select();

            if (error || !data || data.length === 0) {
                if (error && (error.message?.includes('position') || error.details?.includes('position'))) {
                    console.warn("Retrying without position column...");
                    const { position, ...cleanPayload } = {
                        name: prodName,
                        description: prodDesc,
                        category_slug: prodCat,
                        prices: parsedPrices,
                        stock: Number(prodStock),
                        popular: prodPopular,
                        festival_special: prodFestive,
                        images: [prodImage],
                        rating: 5.0,
                        reviews_count: 0,
                        shelf_life: Number(prodShelfLife) || 12,
                        storage_instructions: prodStorageInstructions,
                        allergens: prodAllergens,
                        dietary_tags: prodDietaryTags,
                        highlights: prodHighlights,
                        badges: finalBadges
                    };
                    const { data: retryData, error: retryError } = await supabase.from('products').insert([cleanPayload]).select();
                    if (retryError || !retryData || retryData.length === 0) {
                        console.error("Failed to insert product on retry:", retryError);
                        alert("Failed to insert product: " + (retryError ? retryError.message : "No data returned"));
                        return;
                    }
                } else {
                    console.error("Failed to insert product:", error);
                    alert("Failed to insert product: " + (error ? error.message : "No data returned"));
                    return; // Early return to keep the form open and retain input data
                }
            }

            const newP = data[0];
            await updateProductIngredients(newP.id, prodIngredients);
            const updatedIngredientNames = allIngredients
                .filter(ing => prodIngredients.includes(ing.id))
                .map(ing => ing.name);

            const newProd: Product = {
                id: newP.id,
                name: newP.name,
                description: newP.description,
                category: newP.category_slug,
                prices: newP.prices,
                popular: newP.popular,
                festivalSpecial: newP.festival_special,
                position: newP.position || 0,
                rating: newP.rating || 5.0,
                reviewsCount: newP.reviews_count || 0,
                stock: newP.stock,
                images: newP.images,
                ingredients: updatedIngredientNames,
                ingredientIds: prodIngredients,
                shelfLife: newP.shelf_life,
                storageInstructions: newP.storage_instructions,
                allergens: newP.allergens || [],
                dietaryTags: newP.dietary_tags || [],
                highlights: newP.highlights || [],
                badges: finalBadges
            };
            setProducts([newProd, ...products]);
        }

        // Reset fields
        setProdName("");
        setProdDesc("");
        setVariants([
            { weight: "100g", originalPrice: 0, offPercent: 0, finalPrice: 0 },
            { weight: "200g", originalPrice: 0, offPercent: 0, finalPrice: 0 },
            { weight: "500g", originalPrice: 0, offPercent: 0, finalPrice: 0 },
            { weight: "1kg", originalPrice: 0, offPercent: 0, finalPrice: 0 }
        ]);
        setProdStock("100");
        setProdPopular(false);
        setProdFestive(false);
        setProdIngredients([]);
        setProdShelfLife("12");
        setProdStorageInstructions("Store in a cool and dry place.");
        setProdAllergens([]);
        setProdDietaryTags([]);
        setProdHighlights([]);
        setNewHighlight("");
        setProdBadges([]);
        setNewBadge("");
        setShowProductForm(false);
    };

    const normalizeProduct = (p: any): Product => {
        if (!p || typeof p !== "object") {
            return {
                id: "",
                name: "",
                description: "",
                category: categories[0]?.slug || "milk-sweets",
                images: ["https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600"],
                prices: { "500g": 250 },
                popular: false,
                festivalSpecial: false,
                rating: 5,
                reviewsCount: 0,
                stock: 100,
                ingredients: [],
                ingredientIds: [],
                shelfLife: 12,
                storageInstructions: "Store in a cool and dry place.",
                allergens: [],
                dietaryTags: [],
                highlights: [],
                position: 0,
                badges: []
            };
        }

        const rawImages = Array.isArray(p.images) && p.images.length > 0
            ? p.images.filter((img: any) => typeof img === "string" && img.trim() !== "")
            : ["https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600"];

        if (rawImages.length === 0) {
            rawImages.push("https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600");
        }

        return {
            id: String(p.id || ""),
            name: String(p.name || ""),
            description: String(p.description || ""),
            category: String(p.category || categories[0]?.slug || "milk-sweets"),
            images: rawImages,
            prices: (p.prices && typeof p.prices === "object") ? p.prices : {},
            popular: Boolean(p.popular),
            festivalSpecial: Boolean(p.festivalSpecial),
            rating: Number(p.rating) || 5,
            reviewsCount: Number(p.reviewsCount) || 0,
            stock: Number(p.stock ?? 100),
            ingredients: Array.isArray(p.ingredients) ? p.ingredients : [],
            ingredientIds: Array.isArray(p.ingredientIds) ? p.ingredientIds : [],
            shelfLife: Number(p.shelfLife ?? 12),
            storageInstructions: String(p.storageInstructions || "Store in a cool and dry place."),
            allergens: Array.isArray(p.allergens) ? p.allergens : [],
            dietaryTags: Array.isArray(p.dietaryTags) ? p.dietaryTags : [],
            highlights: Array.isArray(p.highlights) ? p.highlights : [],
            position: Number(p.position ?? 0),
            badges: Array.isArray(p.badges) ? p.badges : []
        };
    };

    const handleEditProductById = (productOrId: Product | string | null) => {
        if (!productOrId) {
            setSelectedProductId(null);
            setEditingProduct(null);
            setProdName("");
            setProdCat(categories[0]?.slug || "milk-sweets");
            setProdDesc("");
            setProdStock("100");
            setProdPosition("0");
            setProdPopular(false);
            setProdFestive(false);
            setProdImage("https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600");
            setVariants([
                { weight: "500g", originalPrice: 250, offPercent: 0, finalPrice: 250 },
                { weight: "1kg", originalPrice: 500, offPercent: 0, finalPrice: 500 }
            ]);
            setProdAllergens([]);
            setProdShelfLife("12");
            setProdStorageInstructions("Store in a cool and dry place.");
            setProdBadges([]);
            setShowProductForm(true);
            return;
        }

        const targetId = typeof productOrId === "string" ? productOrId : productOrId?.id;
        const targetIdStr = String(targetId || "");
        setSelectedProductId(targetIdStr);

        // ALWAYS find product by UUID in master products list to prevent stale references
        const rawProduct = products.find(p => String(p.id) === targetIdStr) || (typeof productOrId === "object" ? productOrId : null);

        if (!rawProduct) {
            console.error("Product not found by ID:", targetIdStr);
            return;
        }

        const product = normalizeProduct(rawProduct);

        console.log("[DEBUG] Loaded & Normalized product:", product.id, product.name, product);

        setEditingProduct(product);
        setProdName(product.name);
        setProdDesc(product.description);
        setProdCat(product.category);
        setProdStock(String(product.stock));
        setProdPopular(product.popular);
        setProdFestive(product.festivalSpecial);
        setProdPosition(String(product.position));
        setProdImage(product.images[0]);
        setProdIngredients(product.ingredientIds);
        setProdShelfLife(String(product.shelfLife));
        setProdStorageInstructions(product.storageInstructions);
        setProdAllergens(product.allergens);
        setProdDietaryTags(product.dietaryTags);
        setProdHighlights(product.highlights);

        const metaBadge = product.badges.find(b => typeof b === "string" && b.startsWith("PRICES_META:"));
        if (metaBadge) {
            try {
                const parsed = JSON.parse(metaBadge.replace("PRICES_META:", ""));
                setVariants(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
                const fallback = Object.keys(product.prices).map(w => ({
                    weight: w,
                    originalPrice: product.prices[w] || 0,
                    offPercent: 0,
                    finalPrice: product.prices[w] || 0
                }));
                setVariants(fallback);
            }
        } else if (Object.keys(product.prices).length > 0) {
            const fallback = Object.keys(product.prices).map(w => ({
                weight: w,
                originalPrice: product.prices[w] || 0,
                offPercent: 0,
                finalPrice: product.prices[w] || 0
            }));
            setVariants(fallback);
        } else {
            setVariants([{ weight: "500g", originalPrice: 250, offPercent: 0, finalPrice: 250 }]);
        }

        setProdBadges(product.badges.filter(b => typeof b === "string" && !b.startsWith("PRICES_META:")));
        setShowProductForm(true);
    };

    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
        setDraggedProductId(id);
        e.dataTransfer.effectAllowed = "move";
        setTimeout(() => {
            const row = document.getElementById(`prod-row-${id}`);
            if (row) row.style.opacity = "0.5";
        }, 0);
    };

    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent<HTMLTableRowElement>, targetId: string) => {
        e.preventDefault();
        if (!draggedProductId || draggedProductId === targetId) return;

        const row = document.getElementById(`prod-row-${draggedProductId}`);
        if (row) row.style.opacity = "1";

        setIsUpdatingPositions(true);

        const currentProducts = [...products].sort((a, b) => (a.position || 0) - (b.position || 0));
        
        const filteredProducts = currentProducts.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(prodSearchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(prodSearchQuery.toLowerCase());
            const matchesSubTab = prodSubTab === "all" || p.category === prodSubTab;
            return matchesSearch && matchesSubTab;
        });

        const filterDraggedIdx = filteredProducts.findIndex(p => p.id === draggedProductId);
        const filterTargetIdx = filteredProducts.findIndex(p => p.id === targetId);

        if (filterDraggedIdx === -1 || filterTargetIdx === -1) {
            setIsUpdatingPositions(false);
            return;
        }

        const insertBeforeTarget = filterTargetIdx < filterDraggedIdx;
        const globalDraggedIdx = currentProducts.findIndex(p => p.id === draggedProductId);

        if (globalDraggedIdx === -1) {
            setIsUpdatingPositions(false);
            return;
        }

        const [draggedItem] = currentProducts.splice(globalDraggedIdx, 1);
        let globalTargetIdx = currentProducts.findIndex(p => p.id === targetId);
        
        if (!insertBeforeTarget) {
            globalTargetIdx++;
        }

        currentProducts.splice(globalTargetIdx, 0, draggedItem);

        const updatedProducts = currentProducts.map((p, index) => ({
            ...p,
            position: index
        }));

        setProducts(updatedProducts);
        setDraggedProductId(null);

        try {
            const items = updatedProducts.map(p => ({ id: p.id, position: p.position }));
            const res = await fetch('/api/admin/products/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                if (data.error?.includes('position') || data.details?.includes('position')) {
                    alert("Drag & drop reordering requires the 'position' column. Please run the Supabase SQL schema script provided in the walkthrough!");
                } else {
                    console.error("Failed to sync positions", data.error);
                    alert("Failed to sync positions: " + data.error);
                }
            }
        } catch (error: any) {
            console.error("Failed to sync positions", error);
            alert("Failed to sync positions: " + error.message);
            console.error("Failed to sync positions", error);
        } finally {
            setIsUpdatingPositions(false);
        }
    };

    const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
        if (draggedProductId) {
            const row = document.getElementById(`prod-row-${draggedProductId}`);
            if (row) row.style.opacity = "1";
            setDraggedProductId(null);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (confirm("Are you sure you want to delete this product?")) {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (!error) {
                setProducts(products.filter(p => p.id !== id));
            } else {
                console.error("Failed to delete product:", error);
            }
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setUploadError("Image must be smaller than 5MB");
            return;
        }

        // Validate type
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
            setUploadError("Please select a valid image file (JPG, PNG, WEBP)");
            return;
        }

        setUploadError("");
        setIsUploadingImage(true);

        try {
            // 1. Compress image
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
                fileType: "image/webp"
            };

            const compressedFile = await imageCompression(file, options);

            // 2. Generate unique filename
            const fileExt = "webp";
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = `${fileName}`;

            // 3. Upload via Secure API Route (Bypass RLS)
            const formData = new FormData();
            formData.append('file', compressedFile);
            formData.append('bucket', 'products');
            formData.append('filePath', filePath);

            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await res.json();
            setProdImage(data.url);
        } catch (err: any) {
            console.error("Upload error:", err);
            setUploadError(err.message || "Failed to upload image.");
        } finally {
            setIsUploadingImage(false);
        }
    };

    // --- ORDER MANAGEMENT ACTIONS ---
    const handleUpdateOrderStatus = async (orderId: string, newStatus: any) => {
        const payStatus = newStatus === 'Delivered' ? 'Paid' : orders.find(o => o.id === orderId)?.paymentStatus;

        if (newStatus === 'Delivered') {
            const order = orders.find(o => o.id === orderId);
            if (order?.userPhone) {
                try {
                    await fetch('/api/notifications/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            phone: order.userPhone,
                            title: 'Order Delivered! 🎉',
                            body: `Your order #${order.orderNumber} has been delivered. Enjoy!`,
                            url: '/account'
                        })
                    });
                } catch (e) {
                    console.error("Failed to push notification", e);
                }
            }
        }

        try {
            const res = await fetch('/api/admin/update-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    newStatus,
                    paymentStatus: payStatus
                })
            });
            const data = await res.json();
            
            if (data.success) {
                const updated = orders.map(o => {
                    if (o.id === orderId) {
                        return { ...o, status: newStatus, paymentStatus: payStatus as string };
                    }
                    return o;
                });
                setOrders(updated as any);
            } else {
                console.error("Failed to update order:", data.error);
                alert("Failed to update order: " + data.error);
            }
        } catch (e) {
            console.error("Error updating order via API:", e);
        }
    };

    const handleResendNotification = async (orderId: string, notificationType: string) => {
        try {
            const res = await fetch('/api/admin/resend-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    notificationType
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Successfully resent ${notificationType} WhatsApp notification.`);
            } else {
                alert(`Failed to resend notification: ${data.error}`);
            }
        } catch (e) {
            console.error("Error resending notification:", e);
            alert("Error resending notification.");
        }
    };
    const handleReprintOrder = async (orderId: string) => {
        try {
            const res = await fetch('/api/print/reprint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed to trigger reprint');

            alert(`Order marked for reprint! It will print shortly.`);
        } catch (e: any) {
            console.error("Error setting reprint status:", e);
            alert("Error setting reprint status: " + e.message);
        }
    };

    const handleSendAdminPush = async (phone: string, name: string) => {
        const msg = window.prompt(`Enter push notification message for ${name}:`);
        if (!msg) return;
        try {
            const res = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone,
                    title: 'Message from Mehta Dairy',
                    body: msg,
                    url: '/'
                })
            });
            const data = await res.json();
            if (data.success) alert("Notification sent!");
            else alert("Failed or User has no active push subscription.");
        } catch (e) {
            alert("Error sending notification.");
        }
    };

    if (!isAdminAuth) {
        return (
            <div className="min-h-screen bg-brand-cream flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-serif font-bold text-brand-charcoal">
                            Admin Portal
                        </h2>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleAdminLogin}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="email-address" className="sr-only">Email address</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    required
                                    className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-brand-beige placeholder-gray-500 text-brand-charcoal focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm mb-4"
                                    placeholder="Admin Email address"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                />
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-brand-beige placeholder-gray-500 text-brand-charcoal focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm"
                                    placeholder="Password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-brand-orange hover:bg-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange transition-colors shadow-lg"
                            >
                                Sign in
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Realtime Full-screen Order Alert overlay */}
            {newOrderAlert && (
                <div className="fixed inset-0 bg-[#2A1E17]/95 backdrop-blur-md flex items-center justify-center z-9999 animate-fade-in p-4 text-white">
                  <div className="bg-[#3D2C21] border-2 border-[#D46D2D] rounded-3xl p-8 md:p-12 max-w-lg w-full text-center relative shadow-[0_0_50px_rgba(212,109,45,0.3)] animate-scale-up flex flex-col items-center gap-6">
                    
                    {/* Animated bouncing bell */}
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-[#D46D2D]/20 animate-ping" />
                      <div className="w-20 h-20 rounded-full bg-[#D46D2D] flex items-center justify-center shadow-lg relative">
                        <Bell className="w-10 h-10 text-white animate-bounce" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-[#D46D2D] uppercase tracking-[0.2em] animate-pulse">🔔 DING DONG!</span>
                      <h2 className="font-serif text-3xl md:text-4xl font-extrabold tracking-tight">New Order Received</h2>
                    </div>

                    {/* Order Number Box */}
                    <div className="bg-black/30 border border-white/10 rounded-2xl py-4 px-6 w-full flex flex-col gap-1">
                      <span className="text-[0.68rem] font-bold text-white/50 uppercase tracking-widest">Order ID</span>
                      <span className="text-2xl font-mono font-black text-[#D46D2D]">
                        {newOrderAlert.order_number || `MD-${newOrderAlert.id?.substring(0, 6).toUpperCase()}`}
                      </span>
                    </div>

                    {/* Order Amount Box */}
                    <div className="flex justify-between items-center w-full px-6 py-2 border-t border-b border-white/10">
                      <span className="text-xs font-bold text-white/70 uppercase">Total Amount</span>
                      <span className="text-3xl font-black text-[#D46D2D]">₹{newOrderAlert.total}</span>
                    </div>

                    {/* Print Status */}
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-4 py-2 rounded-full animate-pulse mt-2">
                      <Printer className="w-4 h-4 animate-pulse" />
                      <span>Print started...</span>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      onClick={() => setNewOrderAlert(null)}
                      className="mt-4 w-full bg-[#D46D2D] hover:bg-[#BF5E23] text-white py-3.5 px-6 rounded-xl font-bold uppercase tracking-wider transition-all hover:scale-102 active:scale-98 shadow-md"
                    >
                      Acknowledge & Dismiss
                    </button>
                  </div>
                </div>
            )}

            {cancellationAlert && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-9999 animate-fade-in p-4">
                  <div className="bg-white border border-[#EAE0D3] rounded-3xl p-6 sm:p-8 max-w-md w-full text-brand-charcoal relative shadow-2xl flex flex-col gap-5">
                    
                    <div className="flex items-center justify-between border-b border-brand-beige pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        <h4 className="font-serif text-sm font-bold text-brand-charcoal">
                          Customer Cancelled Order {cancellationAlert.orderNumber}
                        </h4>
                      </div>
                      <button onClick={() => setCancellationAlert(null)} className="p-1 hover:bg-brand-cream rounded-full">
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 text-xs bg-brand-cream/10 border border-brand-beige/50 rounded-xl p-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-bold">Customer Name:</span>
                        <span className="font-bold">{cancellationAlert.userName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-bold">Phone:</span>
                        <span className="font-bold">{cancellationAlert.userPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-bold">Amount:</span>
                        <span className="font-bold text-brand-orange">₹{cancellationAlert.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-bold">Payment Method:</span>
                        <span className="font-bold">{cancellationAlert.paymentMethod} ({cancellationAlert.paymentStatus})</span>
                      </div>
                      <div className="flex flex-col gap-1 border-t border-brand-beige/30 pt-2.5 mt-1">
                        <span className="text-muted-foreground font-bold">Reason:</span>
                        <p className="font-semibold italic text-red-600 bg-red-50 p-2 rounded border border-red-100">{cancellationAlert.reason}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full mt-2">
                      <button
                        onClick={() => {
                          setOrderSearchQuery(cancellationAlert.orderNumber);
                          setActiveTab("orders");
                          setCancellationAlert(null);
                        }}
                        className="w-full bg-brand-charcoal hover:bg-black text-white py-2.5 rounded-lg text-xs font-bold transition-all text-center uppercase tracking-wider cursor-pointer"
                      >
                        View Order Details
                      </button>
                      
                      {(cancellationAlert.status === 'Cancellation Requested' || cancellationAlert.paymentStatus === 'Refund Pending') && cancellationAlert.cancellationId && (
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (!confirm(`Approve refund of ₹${cancellationAlert.total} for ${cancellationAlert.orderNumber}?`)) return;
                              try {
                                const res = await fetch('/api/admin/refund', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ cancellationId: cancellationAlert.cancellationId, action: 'approve' })
                                });
                                const data = await res.json();
                                if (data.success) {
                                    alert('✅ Refund approved and initiated!');
                                    setCancellationAlert(null);
                                    loadData();
                                } else {
                                    alert(`Failed: ${data.error}`);
                                }
                              } catch(e) { alert('Error processing refund'); }
                            }}
                            className="flex-grow bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors uppercase tracking-wider cursor-pointer"
                          >
                            Approve Refund
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(`Reject refund for ${cancellationAlert.orderNumber}?`)) return;
                              try {
                                const res = await fetch('/api/admin/refund', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ cancellationId: cancellationAlert.cancellationId, action: 'reject' })
                                });
                                const data = await res.json();
                                if (data.success) {
                                    alert('Refund rejected.');
                                    setCancellationAlert(null);
                                    loadData();
                                } else {
                                    alert(`Failed: ${data.error}`);
                                }
                              } catch(e) { alert('Error processing rejection'); }
                            }}
                            className="flex-grow bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors uppercase tracking-wider cursor-pointer"
                          >
                            Reject Refund
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            )}

            {/* ── ADMIN PANEL TOPBAR ───────────────────────────────────── */}
            <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-2xs">
                <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-auto flex items-center justify-center">
                            <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-[11px] text-gray-900 font-extrabold tracking-tight">Mehta Dairy Admin</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            {products.length} products · {orders.length} orders
                        </span>
                        <a href="/" target="_blank" className="hidden sm:flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors border border-amber-200 bg-amber-50 px-3 py-1.5 rounded-lg mr-2">
                            Live Store ↗
                        </a>
                        <button
                            onClick={() => { localStorage.removeItem("mehta_admin_auth"); setIsAdminAuth(false); }}
                            className="text-xs font-bold text-gray-500 hover:text-rose-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* --- ADMIN SHELL WORKSPACE --- */}
            <section className="py-5 bg-[#F8F7F5] min-h-[calc(100vh-56px)]">
                <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-6 items-start w-full relative">

                        {/* Mobile Header Horizontal Scrolling Menu */}
                        <div className="lg:hidden w-full overflow-x-auto flex gap-2 pb-3 mb-4 scrollbar-none scroll-smooth">
                            {ADMIN_MENU_ITEMS.map((item) => {
                                const IconComponent = item.icon;
                                const isActive = activeTab === item.id;
                                let badgeVal = 0;
                                if (item.badgeKey === "products") badgeVal = products.length;
                                if (item.badgeKey === "orders") badgeVal = orders.filter(o => (o as any).source !== 'whatsapp').length;
                                if (item.badgeKey === "whatsapp_orders") badgeVal = orders.filter(o => (o as any).source === 'whatsapp').length;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id as any)}
                                        className={`px-4 py-2 text-xs font-bold rounded-full flex items-center gap-1.5 transition-all whitespace-nowrap relative ${isActive
                                                ? "bg-brand-orange text-white shadow-sm"
                                                : "bg-white text-brand-charcoal border border-brand-beige hover:border-brand-gold"
                                            }`}
                                    >
                                        <IconComponent className="h-3.5 w-3.5" />
                                        <span>{item.label}</span>
                                        {badgeVal > 0 && (
                                            <span className={`text-[0.62rem] px-1.5 py-0.2 rounded-full font-bold ${isActive ? "bg-white text-brand-orange" : "bg-brand-orange/15 text-brand-orange"
                                                }`}>
                                                {badgeVal}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => {
                                    localStorage.removeItem("mehta_admin_auth");
                                    setIsAdminAuth(false);
                                }}
                                className="px-4 py-2 text-xs font-bold rounded-full flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-100 whitespace-nowrap"
                            >
                                Logout
                            </button>
                        </div>

                        {/* Desktop Collapsible Floating Glassmorphic Sidebar */}
                        <motion.aside
                            layout
                            animate={{ width: isSidebarCollapsed ? "80px" : "280px" }}
                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                            className="hidden lg:flex flex-col gap-1.5 bg-white border border-[#EAE0D3] p-4 rounded-2xl shadow-sm flex-shrink-0 relative sticky top-20"
                        >
                            {/* Collapse toggle header button */}
                            <div className="flex items-center justify-between border-b border-brand-beige/50 pb-2 mb-2">
                                {!isSidebarCollapsed && (
                                    <span className="text-[0.62rem] font-bold text-muted-foreground uppercase tracking-widest pl-2">SaaS Dashboard</span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                    className={`p-1.5 hover:bg-brand-cream rounded-lg transition-colors border border-brand-beige text-brand-charcoal cursor-pointer ${isSidebarCollapsed ? "mx-auto" : "ml-auto"}`}
                                    title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                                >
                                    {isSidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                                </button>
                            </div>

                            {/* Menu items */}
                            <div className="flex flex-col gap-1">
                                {ADMIN_MENU_ITEMS.map((item) => {
                                    const IconComponent = item.icon;
                                    const isActive = activeTab === item.id;
                                    let badgeVal = 0;
                                    if (item.badgeKey === "products") badgeVal = products.length;
                                    if (item.badgeKey === "orders") badgeVal = orders.filter(o => (o as any).source !== 'whatsapp').length;
                                    if (item.badgeKey === "whatsapp_orders") badgeVal = orders.filter(o => (o as any).source === 'whatsapp').length;

                                    return (
                                        <div key={item.id} className="relative group flex items-center">
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab(item.id as any)}
                                                className={`w-full text-left text-xs font-bold px-3 py-2 rounded-lg flex items-center transition-colors relative z-10 ${isActive
                                                        ? "text-amber-800 font-extrabold"
                                                        : "text-gray-700 hover:bg-gray-100"
                                                    } ${isSidebarCollapsed ? "justify-center" : "gap-2.5"}`}
                                            >
                                                {isActive && (
                                                    <motion.span
                                                        layoutId="activeAdminTabHighlight"
                                                        className="absolute inset-0 bg-amber-50 rounded-lg -z-10 border-l-3 border-amber-700"
                                                        transition={{ type: "spring", stiffness: 220, damping: 26 }}
                                                    />
                                                )}
                                                <IconComponent className="h-4.5 w-4.5 flex-shrink-0" />
                                                {!isSidebarCollapsed && (
                                                    <span className="truncate">{item.fullLabel}</span>
                                                )}
                                                {!isSidebarCollapsed && badgeVal > 0 && (
                                                    <span className="ml-auto text-[0.62rem] bg-brand-orange/15 text-brand-orange px-2 py-0.5 rounded-full font-bold">
                                                        {badgeVal}
                                                    </span>
                                                )}
                                            </button>

                                            {/* Tooltip on collapse */}
                                            {isSidebarCollapsed && (
                                                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-brand-charcoal text-white text-[0.62rem] font-bold rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 uppercase tracking-wider">
                                                    {item.label}
                                                    {badgeVal > 0 && ` (${badgeVal})`}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Logout Button */}
                            <div className="mt-auto border-t border-brand-beige/50 pt-2.5">
                                <div className="relative group flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            localStorage.removeItem("mehta_admin_auth");
                                            setIsAdminAuth(false);
                                        }}
                                        className={`w-full text-left text-xs font-bold px-3 py-2.5 rounded-xl flex items-center text-red-500 hover:bg-red-50 transition-colors ${isSidebarCollapsed ? "justify-center" : "gap-3"}`}
                                    >
                                        <X className="h-4.5 w-4.5 flex-shrink-0" />
                                        {!isSidebarCollapsed && <span>Logout Panel</span>}
                                    </button>

                                    {/* Tooltip on collapse */}
                                    {isSidebarCollapsed && (
                                        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-red-600 text-white text-[0.62rem] font-bold rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 uppercase tracking-wider">
                                            Logout Panel
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.aside>

                        {/* Main Tabs Container */}
                        <main
                            className="flex-grow flex-1 w-full bg-white/80 backdrop-blur-md border border-brand-beige rounded-2xl p-6 sm:p-8 shadow-md min-h-[450px]"
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                >

                                    {/* ==================== TAB 1: DASHBOARD ANALYTICS ==================== */}
                                    {activeTab === "dashboard" && (
                                        <AdminAnalytics />
                                    )}

                                    {/* ==================== TAB 2: PRODUCTS CRUD ==================== */}
                                    {activeTab === "products" && (
                                        <AdminProducts
                                            products={products}
                                            categories={categories}
                                            onAddProduct={handleAddProduct}
                                            onDeleteProduct={handleDeleteProduct}
                                            onEditProduct={(pOrId) => handleEditProductById(pOrId)}
                                            editingProduct={editingProduct}
                                            showProductForm={showProductForm}
                                            setShowProductForm={setShowProductForm}
                                            prodName={prodName}
                                            setProdName={setProdName}
                                            prodCat={prodCat}
                                            setProdCat={setProdCat}
                                            prodDesc={prodDesc}
                                            setProdDesc={setProdDesc}
                                            prodStock={prodStock}
                                            setProdStock={setProdStock}
                                            prodPosition={prodPosition}
                                            setProdPosition={setProdPosition}
                                            prodPopular={prodPopular}
                                            setProdPopular={setProdPopular}
                                            prodFestive={prodFestive}
                                            setProdFestive={setProdFestive}
                                            prodImage={prodImage}
                                            setProdImage={setProdImage}
                                            variants={variants}
                                            setVariants={setVariants}
                                            prodAllergens={prodAllergens}
                                            setProdAllergens={setProdAllergens}
                                            prodShelfLife={prodShelfLife}
                                            setProdShelfLife={setProdShelfLife}
                                            prodStorageInstructions={prodStorageInstructions}
                                            setProdStorageInstructions={setProdStorageInstructions}
                                            prodBadges={prodBadges}
                                            setProdBadges={setProdBadges}
                                            isUploadingImage={isUploadingImage}
                                            uploadError={uploadError}
                                            handleImageUpload={handleImageUpload}
                                            handleGenerateAiDescription={handleGenerateAiDescription}
                                            isGeneratingAi={isGeneratingAi}
                                            prodSearchQuery={prodSearchQuery}
                                            setProdSearchQuery={setProdSearchQuery}
                                            prodSubTab={prodSubTab}
                                            setProdSubTab={setProdSubTab}
                                        />
                                    )}

                                    {/* ==================== TAB 3: ORDERS ==================== */}
                                    {activeTab === "orders" && (
                                        <div className="flex flex-col gap-6 animate-fade-in">
                                            {/* KPI Analytics Grid */}
                                            <AnalyticsCards orders={orders.filter(o => (o as any).source !== 'whatsapp')} />

                                            {/* Search Toolbar */}
                                            <SearchToolbar
                                                searchQuery={orderSearchQuery}
                                                onSearchChange={setOrderSearchQuery}
                                                statusFilter={orderStatusFilter}
                                                onStatusChange={setOrderStatusFilter}
                                                ordersCount={orders.filter(o => (o as any).source !== 'whatsapp').length}
                                                onResetFilters={() => {
                                                    setOrderSearchQuery("");
                                                    setOrderStatusFilter("All");
                                                }}
                                            />

                                            {/* Orders List / Loading Skeleton */}
                                            {ordersLoading ? (
                                                <OrdersSkeleton count={6} />
                                            ) : orders.filter(o => (o as any).source !== 'whatsapp').length === 0 ? (
                                                <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#241A14] border border-[#EAE0D3] dark:border-white/10 rounded-2xl text-center">
                                                    <ShoppingBag className="w-12 h-12 text-[#D97706]/40 mb-3" />
                                                    <h4 className="font-serif font-bold text-base text-[#3B2416] dark:text-cream">No Orders Found</h4>
                                                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">No orders have been recorded in the database matching your criteria.</p>
                                                    <button
                                                        onClick={() => {
                                                            setOrderSearchQuery("");
                                                            setOrderStatusFilter("All");
                                                        }}
                                                        className="mt-4 px-4 py-2 bg-[#3B2416] text-white text-xs font-bold rounded-xl hover:bg-black transition-colors"
                                                    >
                                                        Reset Filters
                                                    </button>
                                                </div>
                                            ) : (
                                                (() => {
                                                    const filteredOrders = orders.filter((o) => {
                                                        const sourceStr = String(o.source || '').toLowerCase();
                                                        const matchesSource = sourceStr !== 'whatsapp';
                                                        const matchesStatus = orderStatusFilter === "All" ||
                                                            (orderStatusFilter === "Processing" && (o.status === "Processing" || o.status === "Pending" || o.status === "Confirmed" || o.status === "Paid")) ||
                                                            o.status === orderStatusFilter;
                                                        const query = orderSearchQuery.toLowerCase();
                                                        const orderNumStr = String(o.orderNumber || o.id || '').toLowerCase();
                                                        const matchesSearch =
                                                            orderNumStr.includes(query) ||
                                                            (o.userName && o.userName.toLowerCase().includes(query)) ||
                                                            (o.userPhone && o.userPhone.includes(query)) ||
                                                            (o.userEmail && o.userEmail.toLowerCase().includes(query));
                                                        return matchesSource && matchesStatus && matchesSearch;
                                                    });

                                                    if (filteredOrders.length === 0) {
                                                        return (
                                                            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#241A14] border border-[#EAE0D3] dark:border-white/10 rounded-2xl text-center">
                                                                <Search className="w-10 h-10 text-muted-foreground/40 mb-3" />
                                                                <h4 className="font-serif font-bold text-sm text-[#3B2416] dark:text-cream">No Matching Orders</h4>
                                                                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search terms or status filters.</p>
                                                                <button
                                                                    onClick={() => {
                                                                        setOrderSearchQuery("");
                                                                        setOrderStatusFilter("All");
                                                                    }}
                                                                    className="mt-4 px-4 py-2 bg-[#D97706] text-white text-xs font-bold rounded-xl hover:bg-[#b46003] transition-colors"
                                                                >
                                                                    Clear Search & Filters
                                                                </button>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="flex flex-col gap-3">
                                                            {filteredOrders.map((o) => (
                                                                <OrderCard
                                                                    key={o.id}
                                                                    order={o}
                                                                    onUpdateStatus={handleUpdateOrderStatus}
                                                                    onResendNotification={handleResendNotification}
                                                                    onReprint={handleReprintOrder}
                                                                />
                                                            ))}
                                                        </div>
                                                    );
                                                })()
                                            )}
                                        </div>
                                    )}

                                    {/* ==================== TAB 3.1: WHATSAPP ORDERS ==================== */}
                                    {activeTab === "whatsapp_orders" && (
                                        <div className="flex flex-col gap-5 animate-fade-in text-gray-900 font-sans">
                                            {/* Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                                                <div>
                                                    <h3 className="font-serif text-lg font-extrabold text-gray-900 flex items-center gap-2">
                                                        <MessageCircle className="w-5 h-5 text-emerald-600" />
                                                        WhatsApp Orders Management
                                                    </h3>
                                                    <p className="text-xs text-gray-500 font-medium">
                                                        Monitor, manage and process orders received through WhatsApp in real-time.
                                                    </p>
                                                </div>
                                                <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg px-2.5 py-1 font-bold">
                                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    WhatsApp Live Portal
                                                </span>
                                            </div>

                                            {/* Analytics KPIs */}
                                            <AnalyticsCards orders={orders.filter(o => (o as any).source === 'whatsapp')} />

                                            {/* Search & Filters */}
                                            <SearchToolbar
                                                searchQuery={waSearchQuery}
                                                onSearchChange={setWaSearchQuery}
                                                statusFilter={waStatusFilter}
                                                onStatusChange={setWaStatusFilter}
                                                ordersCount={orders.filter(o => (o as any).source === 'whatsapp').length}
                                                onResetFilters={() => {
                                                    setWaSearchQuery("");
                                                    setWaStatusFilter("All");
                                                    setWaDateFilter("All");
                                                }}
                                            />

                                            {/* WhatsApp Orders List */}
                                            {ordersLoading ? (
                                                <OrdersSkeleton count={6} />
                                            ) : orders.filter(o => (o as any).source === 'whatsapp').length === 0 ? (
                                                <div className="p-12 bg-white rounded-xl border border-gray-200 text-center flex flex-col items-center justify-center">
                                                    <MessageCircle className="w-12 h-12 text-emerald-300 mb-3" />
                                                    <h4 className="font-serif font-bold text-base text-gray-900">No WhatsApp Orders Recorded</h4>
                                                    <p className="text-xs text-gray-500 mt-1 max-w-sm">No incoming WhatsApp orders have been registered in the database.</p>
                                                </div>
                                            ) : (
                                                (() => {
                                                    const filtered = orders.filter((o) => {
                                                        if (String(o.source || '').toLowerCase() !== 'whatsapp') return false;

                                                        const matchesStatus = (() => {
                                                            if (waStatusFilter === "All") return true;
                                                            if (waStatusFilter === "Pending") return o.paymentStatus === "Pending" && o.status !== "Cancelled";
                                                            if (waStatusFilter === "Paid") return o.paymentStatus === "Paid";
                                                            if (waStatusFilter === "Failed") return o.paymentStatus === "Failed";
                                                            if (waStatusFilter === "Cancelled") return o.status === "Cancelled";
                                                            if (waStatusFilter === "Delivered") return o.status === "Delivered";
                                                            if (waStatusFilter === "Processing") return o.status === "Processing";
                                                            return true;
                                                        })();

                                                        const matchesDate = (() => {
                                                            if (waDateFilter === "All") return true;
                                                            const orderDate = o.createdAtRaw ? new Date(o.createdAtRaw) : new Date();
                                                            if (waDateFilter === "Today") {
                                                                return orderDate.toDateString() === new Date().toDateString();
                                                            }
                                                            if (waDateFilter === "This Week") {
                                                                const oneWeekAgo = new Date();
                                                                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                                                                return orderDate >= oneWeekAgo;
                                                            }
                                                            return true;
                                                        })();

                                                        const query = waSearchQuery.toLowerCase();
                                                        const matchesSearch =
                                                            (o.orderNumber && o.orderNumber.toLowerCase().includes(query)) ||
                                                            (o.userName && o.userName.toLowerCase().includes(query)) ||
                                                            (o.userPhone && o.userPhone.includes(query)) ||
                                                            (o.id && o.id.toLowerCase().includes(query));

                                                        return matchesStatus && matchesDate && matchesSearch;
                                                    });

                                                    if (filtered.length === 0) {
                                                        return (
                                                            <div className="p-12 bg-white rounded-xl border border-gray-200 text-center flex flex-col items-center justify-center">
                                                                <Search className="w-10 h-10 text-gray-300 mb-3" />
                                                                <h4 className="font-serif font-bold text-sm text-gray-900">No Matching WhatsApp Orders</h4>
                                                                <p className="text-xs text-gray-500 mt-1">Try adjusting your search terms or status filters.</p>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="flex flex-col gap-2.5">
                                                            {filtered.map((o) => (
                                                                <WAOrderCard
                                                                    key={o.id}
                                                                    order={o}
                                                                    onUpdateStatus={handleUpdateOrderStatus}
                                                                    onResendNotification={handleResendNotification}
                                                                    onReprint={handleReprintOrder}
                                                                    onViewDetails={(ord) => setWaSelectedOrder(ord)}
                                                                />
                                                            ))}
                                                        </div>
                                                    );
                                                })()
                                            )}
                                        </div>
                                    )}

                                    {/* ==================== TAB 3.2: WHATSAPP ==================== */}
                                    {activeTab === "whatsapp" && (
                                        <div className="h-full flex flex-col pb-8">
                                            <AdminWhatsAppCenter />
                                        </div>
                                    )}

                                    {/* ==================== TAB: SHIPROCKET LOGISTICS ==================== */}
                                    {activeTab === "shipping" && (
                                        <AdminShipping />
                                    )}

                                    {/* ==================== TAB 3.5: INVOICES ==================== */}
                                    {activeTab === "invoices" && (
                                        <AdminInvoices />
                                    )}

                                    {/* ==================== TAB 3.6: BLOGS ==================== */}
                                    {activeTab === "blogs" && (
                                        <AdminBlogs />
                                    )}

                                    {/* ==================== TAB 3.7: THERMAL PRINTERS ==================== */}
                                    {activeTab === "printers" && (
                                        <AdminPrinters />
                                    )}

                                    {/* ==================== TAB 5: CUSTOMERS ==================== */}
                                    {activeTab === "customers" && (
                                        <AdminCustomers
                                            dbCustomers={dbCustomers}
                                            orders={orders}
                                            customerSearchQuery={customerSearchQuery}
                                            setCustomerSearchQuery={setCustomerSearchQuery}
                                            handleSendAdminPush={handleSendAdminPush}
                                        />
                                    )}

                                    {/* ==================== TAB 5.5: STAFF & ACCESS MANAGEMENT ==================== */}
                                    {activeTab === "staff" && (
                                        <AdminStaff />
                                    )}

                                    {/* ==================== TAB 6: CATEGORIES ==================== */}
                                    {activeTab === "categories" && (
                                        <AdminCategories categories={categories} setCategories={setCategories} />
                                    )}

                                    {/* ==================== TAB 7: BANNERS ==================== */}
                                    {activeTab === "banners" && (
                                        <AdminBanners banners={banners} setBanners={setBanners} />
                                    )}



                                    {/* ==================== TAB 8.5: DELIVERY ZONES ==================== */}
                                    {activeTab === "zones" && (
                                        <AdminDeliveryZones />
                                    )}

                                    {/* ==================== TAB 9: NOTIFICATIONS ==================== */}
                                    {activeTab === "notifications" && <AdminNotifications />}

                                    {/* ==================== TAB 10: PAYMENTS ==================== */}
                                    {activeTab === "payments" && <AdminPayments />}

                                    {/* ==================== TAB RECOVERY ==================== */}
                                    {activeTab === "recovery" && <AdminRecovery initialData={paymentRecoveries} />}

                                    {/* ==================== TAB 11: BACKUPS ==================== */}
                                    {activeTab === "backups" && <AdminBackups />}

                                    {/* ==================== TAB 12: WHATSAPP CENTER ==================== */}
                                    {activeTab === "whatsapp" && <WhatsAppCenter />}

                                </motion.div>
                            </AnimatePresence>
                        </main>
                    </div>
                </div>
            </section>

            {/* ── MODAL: WHATSAPP ORDER DETAILS VIEW ── */}
            <AnimatePresence>
                {waSelectedOrder && (
                    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setWaSelectedOrder(null)}></div>
                        
                        <motion.div 
                            initial={{ scale: 0.95, y: 15, opacity: 0 }} 
                            animate={{ scale: 1, y: 0, opacity: 1 }} 
                            exit={{ scale: 0.95, y: 15, opacity: 0 }} 
                            className="relative z-10 w-full max-w-2xl bg-white border border-brand-beige rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-2xl max-h-[85vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between border-b border-brand-beige pb-3">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-serif text-sm font-bold text-brand-charcoal">
                                        WhatsApp Order Details
                                    </h4>
                                    <span className="inline-flex items-center gap-1 text-[0.62rem] bg-emerald-50 text-emerald-800 border border-emerald-200 rounded px-1.5 py-0.2 font-semibold">
                                        🟢 WhatsApp Order
                                    </span>
                                </div>
                                <button onClick={() => setWaSelectedOrder(null)} className="p-1 hover:bg-brand-cream rounded-full"><X className="h-4.5 w-4.5" /></button>
                            </div>

                            {/* Customer section */}
                            <div className="flex flex-col gap-2.5">
                                <h5 className="text-[0.68rem] font-bold text-brand-gold uppercase tracking-wider">Customer Profile</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-brand-cream/10 border border-brand-beige/50 rounded-xl p-4 text-xs font-semibold text-brand-charcoal">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-muted-foreground text-[0.65rem] uppercase">Full Name</span>
                                        <span>{waSelectedOrder.userName || "Guest"}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-muted-foreground text-[0.65rem] uppercase">Mobile Number</span>
                                        <span>{waSelectedOrder.userPhone}</span>
                                    </div>
                                    <div className="sm:col-span-2 flex flex-col gap-1 border-t border-brand-beige/30 pt-2.5">
                                        <span className="text-muted-foreground text-[0.65rem] uppercase">Shipping Address</span>
                                        <span>
                                            {waSelectedOrder.shippingAddress && typeof waSelectedOrder.shippingAddress === 'object' ? (
                                                <>
                                                    {waSelectedOrder.shippingAddress.street || waSelectedOrder.shippingAddress.address || 'N/A'}<br />
                                                    Pincode: {waSelectedOrder.shippingAddress.pincode || 'N/A'}
                                                </>
                                            ) : (
                                                waSelectedOrder.shippingAddress || "N/A"
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Order section */}
                            <div className="flex flex-col gap-2.5 border-t border-brand-beige pt-4">
                                <h5 className="text-[0.68rem] font-bold text-brand-gold uppercase tracking-wider">Order Items</h5>
                                <div className="flex flex-col gap-2 bg-brand-cream/10 border border-brand-beige/50 rounded-xl p-4">
                                    {waSelectedOrder.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-brand-beige/20 last:border-none">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-brand-charcoal">{item.productName}</span>
                                                <span className="text-[0.65rem] text-muted-foreground">Size/Weight: {item.weight} • Price: ₹{item.price}</span>
                                            </div>
                                            <span className="font-bold text-brand-charcoal">₹{item.price} x {item.quantity} = ₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center border-t border-brand-beige/55 pt-3 mt-1 font-serif text-sm font-bold text-brand-charcoal">
                                        <span>Total Payable</span>
                                        <span className="text-brand-orange text-base">₹{waSelectedOrder.total}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Metadata section */}
                            <div className="flex flex-col gap-2.5 border-t border-brand-beige pt-4 text-xs font-semibold text-brand-charcoal">
                                <h5 className="text-[0.68rem] font-bold text-brand-gold uppercase tracking-wider">Order Metadata</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-brand-cream/10 border border-brand-beige/50 rounded-xl p-4">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground text-[0.65rem]">Order Number:</span>
                                        <span>{waSelectedOrder.orderNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground text-[0.65rem]">Razorpay Order ID:</span>
                                        <span className="font-mono text-[0.65rem]">{waSelectedOrder.paymentId || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground text-[0.65rem]">Payment Method:</span>
                                        <span>{waSelectedOrder.paymentMethod || 'Online'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground text-[0.65rem]">Payment Status:</span>
                                        <span className={`font-bold ${waSelectedOrder.paymentStatus === 'Paid' ? 'text-green-600' : 'text-amber-600'}`}>
                                            {waSelectedOrder.paymentStatus}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground text-[0.65rem]">Order Status:</span>
                                        <span className="font-bold text-brand-orange">{waSelectedOrder.status}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground text-[0.65rem]">Created At:</span>
                                        <span>{waSelectedOrder.date} {waSelectedOrder.createdAtRaw ? new Date(waSelectedOrder.createdAtRaw).toLocaleTimeString() : ''}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Invoice & Actions section */}
                            <div className="flex flex-col gap-2.5 border-t border-brand-beige pt-4 text-xs font-semibold">
                                <h5 className="text-[0.68rem] font-bold text-brand-gold uppercase tracking-wider">Invoice & Quick Copy Actions</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-brand-cream/10 border border-brand-beige/50 rounded-xl p-4">
                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2">
                                        <h6 className="text-[0.6rem] uppercase text-muted-foreground font-bold">Invoice Actions</h6>
                                        {waSelectedOrder.invoice ? (
                                            <div className="flex flex-wrap gap-2">
                                                <a 
                                                    href={waSelectedOrder.invoice.pdf_url || `/api/invoices/download?invoiceId=${waSelectedOrder.id}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 text-center font-bold text-[0.65rem] transition-colors"
                                                >
                                                    Preview PDF
                                                </a>
                                                <a 
                                                    href={`/api/invoices/download?invoiceId=${waSelectedOrder.id}`}
                                                    className="px-3 py-1.5 bg-brand-cream hover:bg-brand-beige/40 text-brand-charcoal rounded-lg border border-brand-beige text-center font-bold text-[0.65rem] transition-colors"
                                                >
                                                    Download Invoice
                                                </a>
                                                <button 
                                                    onClick={async () => {
                                                        try {
                                                            const res = await fetch("/api/invoices/send", {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({ invoiceId: waSelectedOrder.invoice.id })
                                                            });
                                                            const resData = await res.json();
                                                            if (resData.success) alert("Invoice sent successfully to customer email.");
                                                            else alert("Email send failed: " + (resData.error || "Unknown error"));
                                                        } catch (e) {
                                                            alert("Failed to send email.");
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-brand-charcoal hover:bg-black text-white rounded-lg text-center font-bold text-[0.65rem] transition-colors"
                                                >
                                                    Resend Email
                                                </button>
                                                <button 
                                                    onClick={async () => {
                                                        try {
                                                            const res = await fetch("/api/invoices/resend-whatsapp", {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({ orderId: waSelectedOrder.id })
                                                            });
                                                            const resData = await res.json();
                                                            if (resData.success) alert("Invoice resent successfully via WhatsApp.");
                                                            else alert("WhatsApp send failed: " + (resData.error || "Unknown error"));
                                                        } catch (e) {
                                                            alert("Failed to resend WhatsApp invoice.");
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg border border-green-200 text-center font-bold text-[0.65rem] transition-colors"
                                                >
                                                    Resend WhatsApp
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-[0.65rem] text-muted-foreground animate-pulse font-medium">Invoice generation is pending for this order.</span>
                                        )}
                                    </div>
                                    
                                    {/* Copy details */}
                                    <div className="flex flex-col gap-2 border-t sm:border-t-0 sm:border-l border-brand-beige/50 pt-2 sm:pt-0 sm:pl-3">
                                        <h6 className="text-[0.6rem] uppercase text-muted-foreground font-bold">Metadata Copy Shortcuts</h6>
                                        <div className="flex flex-col gap-1.5">
                                            <button 
                                                onClick={() => {
                                                    const url = waSelectedOrder.invoice?.pdf_url || `${window.location.origin}/api/invoices/download?invoiceId=${waSelectedOrder.id}`;
                                                    navigator.clipboard.writeText(url);
                                                    alert("Invoice PDF Link copied to clipboard!");
                                                }}
                                                className="text-left text-brand-charcoal hover:text-brand-orange text-[0.65rem] font-bold flex items-center gap-1 bg-brand-cream/40 p-1.5 rounded border border-brand-beige/50"
                                            >
                                                📋 Copy Invoice PDF Link
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(waSelectedOrder.paymentId || "N/A");
                                                    alert("Payment ID copied to clipboard!");
                                                }}
                                                className="text-left text-brand-charcoal hover:text-brand-orange text-[0.65rem] font-bold flex items-center gap-1 bg-brand-cream/40 p-1.5 rounded border border-brand-beige/50"
                                            >
                                                📋 Copy Payment ID
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(waSelectedOrder.paymentId || "N/A");
                                                    alert("Razorpay Order ID copied!");
                                                }}
                                                className="text-left text-brand-charcoal hover:text-brand-orange text-[0.65rem] font-bold flex items-center gap-1 bg-brand-cream/40 p-1.5 rounded border border-brand-beige/50"
                                            >
                                                📋 Copy Razorpay Order ID
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(waSelectedOrder.userPhone || "");
                                                    alert("Customer Phone Number copied!");
                                                }}
                                                className="text-left text-brand-charcoal hover:text-brand-orange text-[0.65rem] font-bold flex items-center gap-1 bg-brand-cream/40 p-1.5 rounded border border-[#EAE0D3]/50"
                                            >
                                                📋 Copy Customer Number ({waSelectedOrder.userPhone})
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions section */}
                            <div className="flex flex-wrap gap-2 justify-end border-t border-brand-beige pt-4">
                                {waSelectedOrder.status !== 'Cancelled' && waSelectedOrder.status !== 'Delivered' && (
                                    <>
                                        <button 
                                            onClick={async () => {
                                                await handleUpdateOrderStatus(waSelectedOrder.id, 'Processing');
                                                setWaSelectedOrder({ ...waSelectedOrder, status: 'Processing' });
                                            }}
                                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors border border-blue-200"
                                        >
                                            Mark Processing
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                await handleUpdateOrderStatus(waSelectedOrder.id, 'Preparing');
                                                setWaSelectedOrder({ ...waSelectedOrder, status: 'Preparing' });
                                            }}
                                            className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors border border-purple-200"
                                        >
                                            Mark Packed
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                await handleUpdateOrderStatus(waSelectedOrder.id, 'Shipped');
                                                setWaSelectedOrder({ ...waSelectedOrder, status: 'Shipped' });
                                            }}
                                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors border border-indigo-200"
                                        >
                                            Mark Shipped
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                await handleUpdateOrderStatus(waSelectedOrder.id, 'Delivered');
                                                setWaSelectedOrder({ ...waSelectedOrder, status: 'Delivered', paymentStatus: 'Paid' });
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-xs font-bold rounded-lg transition-colors"
                                        >
                                            Mark Delivered
                                        </button>
                                    </>
                                )}
                                
                                {waSelectedOrder.status !== 'Cancelled' && (
                                    <button 
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to cancel this WhatsApp order?")) {
                                                await handleUpdateOrderStatus(waSelectedOrder.id, 'Cancelled');
                                                setWaSelectedOrder({ ...waSelectedOrder, status: 'Cancelled' });
                                            }
                                        }}
                                        className="bg-red-50 text-red-600 hover:bg-red-100 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors border border-red-200"
                                    >
                                        Cancel Order
                                    </button>
                                )}
                                
                                <button 
                                    onClick={() => setWaSelectedOrder(null)}
                                    className="px-4 py-2 border border-brand-beige rounded-lg text-xs font-bold text-brand-charcoal hover:bg-brand-cream transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Footer />
        </>
    );
}

function HighlightText({ text, query }: { text: string; query: string }) {
    if (!query || !query.trim()) return <span>{text}</span>;
    const cleanQuery = query.trim();
    const parts = text.split(new RegExp(`(${cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === cleanQuery.toLowerCase() ? (
                    <mark key={i} className="bg-amber-200 text-brand-charcoal font-extrabold px-0.5 rounded-xs">
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
}