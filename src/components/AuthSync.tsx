"use client";

import { useEffect } from "react";

export default function AuthSync() {
  useEffect(() => {
    async function syncAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        
        if (res.ok && data.authenticated && data.user) {
          localStorage.setItem("mehta_logged_in", "true");
          localStorage.setItem("mehta_user_id", data.user.id);
          if (data.user.phone) localStorage.setItem("mehta_user_phone", data.user.phone);
          if (data.user.name) localStorage.setItem("mehta_user_name", data.user.name);
          if (data.user.email) localStorage.setItem("mehta_user_email", data.user.email);
        } else {
          localStorage.removeItem("mehta_logged_in");
          localStorage.removeItem("mehta_user_id");
          localStorage.removeItem("mehta_user_phone");
          localStorage.removeItem("mehta_user_name");
          localStorage.removeItem("mehta_user_email");
        }
        
        // Dispatch an event so other components (like Header) can re-render if they rely on localStorage
        window.dispatchEvent(new Event("storage"));
      } catch (error) {
        console.error("Auth sync failed:", error);
      }
    }
    
    syncAuth();
    
    // Also re-sync periodically if needed, but on-mount is usually enough for SPAs.
  }, []);

  return null;
}
