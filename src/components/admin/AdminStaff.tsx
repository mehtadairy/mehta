"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserCheck,
  UserX,
  ShoppingBag,
  PackageCheck,
  Truck,
  Printer,
  ShieldCheck,
  Plus,
  Download,
  RefreshCw,
  Search,
  Edit2,
  Key,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Lock,
  Smartphone,
  Globe,
  AlertTriangle,
  ChevronRight,
  X,
  Building2,
  Phone,
  Mail,
  ShieldAlert,
  Sliders,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function generateStrongPassword(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let pass = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      pass += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return pass;
}

export interface StaffAccount {
  id: string;
  full_name: string;
  username: string;
  phone: string;
  email: string;
  role: string;
  branch: string;
  status: "Active" | "Inactive";
  last_login?: string;
  permissions: string[];
  avatar_url?: string;
  created_at?: string;
}

const ALL_PERMISSIONS = [
  { id: "dashboard", label: "Dashboard", category: "Core" },
  { id: "inventory", label: "Inventory Management", category: "Core" },
  { id: "orders", label: "Order Tracking", category: "Orders" },
  { id: "whatsapp_orders", label: "WhatsApp Orders", category: "Orders" },
  { id: "customers", label: "Customer Directory", category: "CRM" },
  { id: "categories", label: "Category Management", category: "Catalog" },
  { id: "banners", label: "Homepage Banners", category: "Content" },
  { id: "invoices", label: "Invoice Management", category: "Finance" },
  { id: "payments", label: "Payment Analytics", category: "Finance" },
  { id: "print_agent", label: "Print Agent Settings", category: "System" },
  { id: "reports", label: "Reports & Analytics", category: "Finance" },
  { id: "export_csv", label: "Export CSV Data", category: "System" },
  { id: "settings", label: "System Settings", category: "System" },
  { id: "delete_orders", label: "Delete Orders", category: "Orders" },
  { id: "edit_products", label: "Edit Products", category: "Catalog" },
  { id: "create_products", label: "Create Products", category: "Catalog" },
  { id: "update_order_status", label: "Update Order Status", category: "Orders" },
  { id: "print_receipts", label: "Print Receipts", category: "System" },
  { id: "send_whatsapp", label: "Send WhatsApp Messages", category: "System" },
  { id: "generate_invoice", label: "Generate Invoice", category: "Finance" },
];

const PRESETS: { [key: string]: string[] } = {
  Administrator: ALL_PERMISSIONS.map(p => p.id),
  Cashier: ["orders", "invoices", "customers", "payments", "print_receipts", "generate_invoice"],
  Packing: ["orders", "update_order_status", "print_agent", "print_receipts"],
  Delivery: ["orders", "update_order_status", "zones"],
  Manager: ["dashboard", "inventory", "orders", "whatsapp_orders", "customers", "invoices", "reports", "generate_invoice", "print_agent"]
};

export function AdminStaff() {
  const [staffList, setStaffList] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [securityStaff, setSecurityStaff] = useState<StaffAccount | null>(null);
  const [resetPassStaff, setResetPassStaff] = useState<StaffAccount | null>(null);
  const [resetPassInput, setResetPassInput] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    phone: "",
    email: "",
    role: "Cashier",
    branch: "Main Branch",
    status: "Active" as "Active" | "Inactive",
    password: "",
    confirmPassword: "",
    avatar_url: "",
    permissions: [] as string[]
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setStaffList(json.data);
      }
    } catch (e) {
      console.error("Failed to load staff list:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Filtered staff calculation
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        s.full_name.toLowerCase().includes(query) ||
        s.username.toLowerCase().includes(query) ||
        s.phone.includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.branch.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "All" ||
        (roleFilter === "Admin" && s.role.includes("Admin")) ||
        (roleFilter === "Cashier" && s.role.includes("Cashier")) ||
        (roleFilter === "Packing" && s.role.includes("Packing")) ||
        (roleFilter === "Delivery" && s.role.includes("Delivery")) ||
        (roleFilter === "Print Operator" && s.role.includes("Print")) ||
        (roleFilter === "Manager" && s.role.includes("Manager")) ||
        (roleFilter === "Inactive" && s.status === "Inactive");

      return matchesSearch && matchesRole;
    });
  }, [staffList, searchQuery, roleFilter]);

  // KPI Calculations
  const kpis = useMemo(() => {
    return {
      total: staffList.length,
      active: staffList.filter(s => s.status === "Active").length,
      inactive: staffList.filter(s => s.status === "Inactive").length,
      cashiers: staffList.filter(s => s.role.toLowerCase().includes("cashier")).length,
      packing: staffList.filter(s => s.role.toLowerCase().includes("packing")).length,
      delivery: staffList.filter(s => s.role.toLowerCase().includes("delivery")).length,
      printers: staffList.filter(s => s.role.toLowerCase().includes("print")).length,
      admins: staffList.filter(s => s.role.toLowerCase().includes("admin")).length,
    };
  }, [staffList]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      full_name: "",
      username: "",
      phone: "",
      email: "",
      role: "Cashier",
      branch: "Main Branch",
      status: "Active",
      password: "",
      confirmPassword: "",
      avatar_url: "",
      permissions: [...PRESETS["Cashier"]]
    });
    setFormError("");
    setShowAddModal(true);
  };

  const handleOpenEdit = (staff: StaffAccount) => {
    setEditingStaff(staff);
    setFormData({
      full_name: staff.full_name,
      username: staff.username,
      phone: staff.phone || "",
      email: staff.email || "",
      role: staff.role,
      branch: staff.branch,
      status: staff.status,
      password: "",
      confirmPassword: "",
      avatar_url: staff.avatar_url || "",
      permissions: staff.permissions || []
    });
    setFormError("");
    setShowAddModal(true);
  };

  const handleGeneratePassword = () => {
    const pass = generateStrongPassword(12);
    setFormData(prev => ({ ...prev, password: pass, confirmPassword: pass }));
    setShowPassword(true);
  };

  const handleTogglePermission = (permId: string) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(permId);
      if (exists) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== permId) };
      } else {
        return { ...prev, permissions: [...prev.permissions, permId] };
      }
    });
  };

  const handleApplyPreset = (presetName: string) => {
    const perms = PRESETS[presetName] || [];
    setFormData(prev => ({ ...prev, role: presetName === "Administrator" ? "Administrator" : `${presetName} Staff`, permissions: perms }));
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.full_name.trim()) return setFormError("Full Name is required");
    if (!formData.username.trim()) return setFormError("Username is required");
    if (!editingStaff && !formData.password) return setFormError("Password is required for new staff");
    if (formData.password && formData.password !== formData.confirmPassword) {
      return setFormError("Passwords do not match");
    }

    try {
      const endpoint = "/api/admin/staff";
      const method = editingStaff ? "PUT" : "POST";
      const payload = editingStaff
        ? { id: editingStaff.id, ...formData }
        : { ...formData };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        setShowAddModal(false);
        fetchStaff();
      } else {
        setFormError(json.error || "Failed to save staff account");
      }
    } catch (err: any) {
      setFormError("Server error. Please try again.");
    }
  };

  const handleToggleStatus = async (staff: StaffAccount) => {
    const newStatus = staff.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: staff.id, status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, status: newStatus } : s));
      }
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    try {
      const res = await fetch(`/api/admin/staff?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setStaffList(prev => prev.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete staff", e);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassStaff || !resetPassInput) return;
    try {
      const res = await fetch("/api/admin/staff/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resetPassStaff.id, newPassword: resetPassInput })
      });
      const json = await res.json();
      if (json.success) {
        alert(`Password for ${resetPassStaff.full_name} has been reset successfully!`);
        setResetPassStaff(null);
        setResetPassInput("");
      }
    } catch (e) {
      alert("Failed to reset password.");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Full Name", "Username", "Role", "Branch", "Phone", "Email", "Status", "Last Login"];
    const rows = staffList.map(s => [
      `"${s.full_name}"`,
      `"${s.username}"`,
      `"${s.role}"`,
      `"${s.branch}"`,
      `"${s.phone}"`,
      `"${s.email}"`,
      `"${s.status}"`,
      `"${s.last_login || 'Never'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Mehta_Staff_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-gray-900 font-sans p-2 sm:p-4">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#EAE0D3] shadow-xs">
        <div>
          <h2 className="font-serif text-xl font-extrabold text-[#2A1E17] flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#D46D2D]" />
            👥 Staff & Access Management
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Manage staff accounts, roles, branch access and granular system credentials.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchStaff}
            className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-700" />
            Export Staff
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-extrabold text-white bg-[#D46D2D] hover:bg-[#b85b20] rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* TOP DASHBOARD CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Total Staff", val: kpis.total, icon: Users, color: "bg-amber-50 text-amber-700 border-amber-200" },
          { label: "Active Staff", val: kpis.active, icon: UserCheck, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          { label: "Inactive", val: kpis.inactive, icon: UserX, color: "bg-rose-50 text-rose-700 border-rose-200" },
          { label: "Cashiers", val: kpis.cashiers, icon: ShoppingBag, color: "bg-blue-50 text-blue-700 border-blue-200" },
          { label: "Packing Staff", val: kpis.packing, icon: PackageCheck, color: "bg-purple-50 text-purple-700 border-purple-200" },
          { label: "Delivery Mgrs", val: kpis.delivery, icon: Truck, color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
          { label: "Print Ops", val: kpis.printers, icon: Printer, color: "bg-orange-50 text-orange-700 border-orange-200" },
          { label: "Admins", val: kpis.admins, icon: ShieldCheck, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="bg-white border border-[#EAE0D3] rounded-xl p-3 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 truncate">
                  {card.label}
                </span>
                <div className={`p-1.5 rounded-lg border shrink-0 ${card.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 text-xl font-black text-[#2A1E17]">
                {card.val}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white p-4 rounded-xl border border-[#EAE0D3] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, username, phone, branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#D46D2D]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {["All", "Admin", "Cashier", "Packing", "Delivery", "Print Operator", "Manager", "Inactive"].map((f) => (
            <button
              key={f}
              onClick={() => setRoleFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === f
                  ? "bg-[#D46D2D] text-white border-[#D46D2D] shadow-2xs"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* STAFF TABLE */}
      <div className="bg-white border border-[#EAE0D3] rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FCF9F2] border-b border-[#EAE0D3] text-[#7E6B5A] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Role & Branch</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Permissions</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE0D3]/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                    Loading staff directory...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                    No staff accounts match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const isAllAccess = (staff.permissions || []).includes("ALL") || staff.role.includes("Administrator");
                  const permCount = isAllAccess ? "All Access" : `${(staff.permissions || []).length} Granted`;

                  return (
                    <tr key={staff.id} className="hover:bg-[#FCF9F2]/40 transition-colors">
                      {/* Avatar & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#D46D2D]/10 text-[#D46D2D] border border-[#D46D2D]/20 font-bold flex items-center justify-center text-sm shrink-0">
                            {staff.avatar_url ? (
                              <img src={staff.avatar_url} alt={staff.full_name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              staff.full_name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-extrabold text-[#2A1E17] text-sm">{staff.full_name}</span>
                            <span className="text-[11px] text-gray-500 font-medium">@{staff.username}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role & Branch */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-gray-800 flex items-center gap-1">
                            {staff.role.includes("Admin") && <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 inline" />}
                            {staff.role}
                          </span>
                          <span className="text-[10px] text-gray-500 font-semibold bg-gray-100 px-1.5 py-0.5 rounded w-fit">
                            {staff.branch || "Main Branch"}
                          </span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-semibold text-gray-700">
                        {staff.phone || "—"}
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 text-gray-600 font-medium">
                        {staff.last_login ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {new Date(staff.last_login).toLocaleDateString()} {new Date(staff.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Never</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          staff.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${staff.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {staff.status}
                        </span>
                      </td>

                      {/* Permissions */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isAllAccess
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {permCount}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(staff)}
                            title="Edit Staff Member"
                            className="p-1.5 text-gray-600 hover:text-[#D46D2D] hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setResetPassStaff(staff); setResetPassInput(""); }}
                            title="Reset Password"
                            className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSecurityStaff(staff)}
                            title="Security & Login Activity"
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(staff)}
                            title={staff.status === "Active" ? "Disable Account" : "Enable Account"}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              staff.status === "Active"
                                ? "text-gray-600 hover:text-rose-600 hover:bg-rose-50"
                                : "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {staff.status === "Active" ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(staff.id)}
                            title="Delete Account"
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT STAFF MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-[#EAE0D3] shadow-2xl w-full max-w-3xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="bg-[#FCF9F2] p-4 sm:p-5 border-b border-[#EAE0D3] flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-extrabold text-[#2A1E17] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#D46D2D]" />
                    {editingStaff ? "Edit Staff Account" : "Create New Staff Account"}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">Assign role, branch details and system permissions.</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200/50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveStaff} className="p-5 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    {formError}
                  </div>
                )}

                {/* Section 1: Personal Details */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-extrabold text-[#2A1E17] uppercase tracking-wider border-b border-gray-100 pb-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#D46D2D]" /> Personal Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aryan Rathod"
                        value={formData.full_name}
                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#D46D2D]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 9316688014"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#D46D2D]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. staff@mehtadairy.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#D46D2D]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Profile Photo URL</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={formData.avatar_url}
                        onChange={e => setFormData({ ...formData, avatar_url: e.target.value })}
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#D46D2D]"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Role & Branch */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-extrabold text-[#2A1E17] uppercase tracking-wider border-b border-gray-100 pb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#D46D2D]" /> Role & Branch Assignment
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Role *</label>
                      <select
                        value={formData.role}
                        onChange={e => {
                          const r = e.target.value;
                          setFormData({ ...formData, role: r });
                          if (r.includes("Admin")) handleApplyPreset("Administrator");
                          else if (r.includes("Cashier")) handleApplyPreset("Cashier");
                          else if (r.includes("Packing")) handleApplyPreset("Packing");
                          else if (r.includes("Delivery")) handleApplyPreset("Delivery");
                          else if (r.includes("Manager")) handleApplyPreset("Manager");
                        }}
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#D46D2D] bg-white font-bold"
                      >
                        <option value="Administrator">Administrator</option>
                        <option value="Store Manager">Store Manager</option>
                        <option value="Cashier">Cashier</option>
                        <option value="Packing Staff">Packing Staff</option>
                        <option value="Delivery Manager">Delivery Manager</option>
                        <option value="Print Operator">Print Operator</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Branch Location</label>
                      <select
                        value={formData.branch}
                        onChange={e => setFormData({ ...formData, branch: e.target.value })}
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#D46D2D] bg-white font-bold"
                      >
                        <option value="Main Branch">Main Branch</option>
                        <option value="Taleti Branch">Taleti Branch</option>
                        <option value="Navagadh Branch">Navagadh Branch</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Account Status</label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#D46D2D] bg-white font-bold"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Credentials */}
                <div className="flex flex-col gap-3 bg-amber-50/40 p-4 rounded-xl border border-amber-200/60">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-[#2A1E17] uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#D46D2D]" /> Login Credentials
                    </h4>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="px-2.5 py-1 text-[11px] font-extrabold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-700" /> Generate Strong Password
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Username *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. aryan"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#D46D2D] bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Password {editingStaff ? "(Leave blank to keep same)" : "*"}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required={!editingStaff}
                          placeholder="Password..."
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                          className="w-full p-2.5 pr-8 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#D46D2D] bg-white font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Password</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm..."
                        value={formData.confirmPassword}
                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#D46D2D] bg-white font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Permissions */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                    <h4 className="text-xs font-extrabold text-[#2A1E17] uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#D46D2D]" /> Granular System Permissions ({formData.permissions.length})
                    </h4>
                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-gray-400">Quick Presets:</span>
                      {Object.keys(PRESETS).map(pName => (
                        <button
                          key={pName}
                          type="button"
                          onClick={() => handleApplyPreset(pName)}
                          className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 hover:bg-[#D46D2D] hover:text-white text-gray-700 rounded transition-all cursor-pointer"
                        >
                          {pName}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1 border border-gray-100 rounded-xl">
                    {ALL_PERMISSIONS.map((perm) => {
                      const checked = formData.permissions.includes(perm.id) || formData.permissions.includes("ALL");
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            checked
                              ? "bg-amber-50/60 border-amber-300 text-amber-900 font-bold"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleTogglePermission(perm.id)}
                              className="accent-[#D46D2D] rounded w-3.5 h-3.5"
                            />
                            <span>{perm.label}</span>
                          </div>
                          <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">
                            {perm.category}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-extrabold text-white bg-[#D46D2D] hover:bg-[#b85b20] rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {editingStaff ? "Save Changes" : "Create Staff Member"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECURITY & LOGIN ACTIVITY MODAL */}
      <AnimatePresence>
        {securityStaff && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-[#EAE0D3] shadow-2xl w-full max-w-2xl overflow-hidden my-8"
            >
              <div className="bg-[#FCF9F2] p-5 border-b border-[#EAE0D3] flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-extrabold text-[#2A1E17] flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-blue-600" />
                    Login Activity & Security Profile
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Detailed audit log for {securityStaff.full_name} (@{securityStaff.username})
                  </p>
                </div>
                <button
                  onClick={() => setSecurityStaff(null)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200/50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-5 max-h-[75vh] overflow-y-auto text-xs">
                {/* Security Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Last Login</span>
                    <p className="font-extrabold text-gray-900 mt-1">
                      {securityStaff.last_login ? new Date(securityStaff.last_login).toLocaleTimeString() : 'Never'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Account Status</span>
                    <p className="font-extrabold text-emerald-600 mt-1">{securityStaff.status}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Current Device</span>
                    <p className="font-extrabold text-gray-900 mt-1">Chrome / Windows</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Two Factor Status</span>
                    <p className="font-extrabold text-blue-600 mt-1">Ready</p>
                  </div>
                </div>

                {/* Login History Log */}
                <div className="flex flex-col gap-2">
                  <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Recent Terminal Login History</h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                        <tr>
                          <th className="py-2 px-3">Timestamp</th>
                          <th className="py-2 px-3">Device / Browser</th>
                          <th className="py-2 px-3">IP Address</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {[
                          { time: "Today 10:25 AM", device: "Chrome 122 (Windows 11)", ip: "192.168.1.104", status: "Success" },
                          { time: "Yesterday 04:12 PM", device: "Safari (iPhone 15)", ip: "192.168.1.108", status: "Success" },
                          { time: "25 Jul 09:30 AM", device: "Chrome 122 (Windows 11)", ip: "192.168.1.104", status: "Success" },
                        ].map((log, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-semibold text-gray-700">{log.time}</td>
                            <td className="py-2 px-3 text-gray-600">{log.device}</td>
                            <td className="py-2 px-3 font-mono text-gray-500">{log.ip}</td>
                            <td className="py-2 px-3 font-bold text-emerald-600">{log.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Security Actions */}
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                  <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Security Actions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        alert(`Force logout token issued for ${securityStaff.full_name}. Active sessions invalidated.`);
                      }}
                      className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 font-bold hover:bg-amber-100 flex items-center justify-between cursor-pointer"
                    >
                      <span>Force Active Session Logout</span>
                      <Lock className="w-4 h-4 text-amber-600" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(securityStaff)}
                      className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 font-bold hover:bg-rose-100 flex items-center justify-between cursor-pointer"
                    >
                      <span>{securityStaff.status === "Active" ? "Disable Staff Account" : "Enable Staff Account"}</span>
                      <XCircle className="w-4 h-4 text-rose-600" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK RESET PASSWORD MODAL */}
      <AnimatePresence>
        {resetPassStaff && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-[#EAE0D3] shadow-2xl w-full max-w-md p-6"
            >
              <h3 className="font-serif text-base font-extrabold text-[#2A1E17] flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                Reset Password for {resetPassStaff.full_name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Enter a new password or generate a secure one.</p>

              <form onSubmit={handleResetPasswordSubmit} className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
                  <input
                    type="text"
                    required
                    placeholder="New password..."
                    value={resetPassInput}
                    onChange={e => setResetPassInput(e.target.value)}
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#D46D2D] font-bold"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setResetPassInput(generateStrongPassword(12))}
                  className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer w-fit"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Generate Random Strong Password
                </button>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetPassStaff(null)}
                    className="px-3.5 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-extrabold text-white bg-[#D46D2D] rounded-xl hover:bg-[#b85b20] cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
