"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showForgotDialog, setShowForgotDialog] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim() || !password) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      // 1. First attempt login via worker/staff API
      const res = await fetch("/api/worker/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const worker = data.worker;
        // Save session locally
        localStorage.setItem("mehta_worker_auth", "true");
        localStorage.setItem("mehta_worker_user", JSON.stringify(worker));

        // Permission & Role Based Redirection
        const role = (worker.role || "").toLowerCase();
        const perms = worker.permissions || [];

        if (role.includes("admin") || perms.includes("ALL")) {
          localStorage.setItem("mehta_admin_auth", "true");
          router.push("/admin");
        } else {
          router.push("/worker");
        }
        return;
      }

      // 2. Fallback to main Admin login API if worker login fails
      const adminRes = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username.trim(), password })
      });

      const adminData = await adminRes.json();

      if (adminRes.ok && adminData.user) {
        localStorage.setItem("mehta_admin_auth", "true");
        router.push("/admin");
        return;
      }

      setErrorMsg(data.error || adminData.error || "Invalid username or password");
    } catch (err: any) {
      setErrorMsg("Network or server connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCF9F2] text-gray-900 font-sans flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Pattern */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#D46D2D]/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#D46D2D]/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white border border-[#EAE0D3] rounded-3xl p-6 sm:p-8 shadow-xl relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#D46D2D]/10 border border-[#D46D2D]/20 flex items-center justify-center text-[#D46D2D] shadow-2xs">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D46D2D] bg-[#D46D2D]/10 px-2.5 py-0.5 rounded-full">
            Mehta Dairy Enterprise Portal
          </span>
          <h1 className="font-serif text-2xl font-black text-[#2A1E17]">
            Staff & Worker Login
          </h1>
          <p className="text-xs text-gray-500 max-w-xs font-medium">
            Sign in with your assigned staff credentials to access your terminal workspace.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-extrabold text-[#2A1E17] mb-1.5">
              Username / Staff ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoFocus
                placeholder="Enter username (e.g. aryan, babli)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#D46D2D] font-bold bg-gray-50/50 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold text-[#2A1E17]">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotDialog(true)}
                className="text-[11px] font-bold text-[#D46D2D] hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter account password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#D46D2D] font-bold bg-gray-50/50 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between text-xs font-bold text-gray-600 my-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-[#D46D2D] rounded w-4 h-4"
              />
              <span>Remember me on this terminal</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 text-xs font-extrabold text-white bg-[#D46D2D] hover:bg-[#b85b20] rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center text-[11px] text-gray-400 font-medium">
          Protected by Enterprise Role-Based Access Control System.
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      {showForgotDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#EAE0D3] shadow-2xl text-center flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-extrabold text-base text-[#2A1E17]">Reset Credentials</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Please contact your system Administrator or Store Manager to reset your password via the <strong>Staff & Access Management</strong> module.
            </p>
            <button
              onClick={() => setShowForgotDialog(false)}
              className="mt-2 px-4 py-2 bg-[#D46D2D] text-white text-xs font-bold rounded-xl w-full cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
