"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabaseClient';

interface CustomerProfile {
  id: string;
  name: string | null;
  full_name?: string | null; // Support fallback mappings
  email: string | null;
  email_verified?: boolean;
  phone: string | null;
  profile_image?: string | null;
  avatar_url?: string | null; // Support fallback mappings
  role?: string | null;
  created_at?: string;
  updated_at?: string;
  saved_addresses?: any[];
}

interface CustomerAuthContextType {
  profile: CustomerProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<CustomerProfile | null>;
  updateProfile: (name: string, email: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const fetchProfile = useCallback(async (): Promise<CustomerProfile | null> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/me');
      
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          const mappedProfile: CustomerProfile = {
            id: data.user.id,
            name: data.user.name || data.user.full_name || null,
            full_name: data.user.name || data.user.full_name || null,
            email: data.user.email || null,
            email_verified: data.user.email_verified || false,
            phone: data.user.phone || null,
            profile_image: data.user.profile_image || data.user.avatar_url || null,
            avatar_url: data.user.profile_image || data.user.avatar_url || null,
          };
          
          setProfile(mappedProfile);
          setIsLoggedIn(true);
          
          // Legacy sync logic for components that still rely on it
          localStorage.setItem("mehta_logged_in", "true");
          localStorage.setItem("mehta_user_id", mappedProfile.id);
          if (mappedProfile.phone) localStorage.setItem("mehta_user_phone", mappedProfile.phone);
          if (mappedProfile.name) localStorage.setItem("mehta_user_name", mappedProfile.name);
          if (mappedProfile.email) localStorage.setItem("mehta_user_email", mappedProfile.email);
          
          return mappedProfile;
        }
      }

      // If /api/auth/me returns 401 or not ok, decisively log out locally
      setProfile(null);
      setIsLoggedIn(false);
      localStorage.removeItem("mehta_logged_in");
      return null;
    } catch (err) {
      console.error("Failed to fetch profile details:", err);
      setProfile(null);
      setIsLoggedIn(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    const handleAuthUpdated = () => {
      fetchProfile();
    };
    window.addEventListener("authUpdated", handleAuthUpdated);
    window.addEventListener("storage", handleAuthUpdated);
    
    return () => {
      window.removeEventListener("authUpdated", handleAuthUpdated);
      window.removeEventListener("storage", handleAuthUpdated);
    };
  }, [fetchProfile]);

  const refreshProfile = async () => {
    return await fetchProfile();
  };

  const updateProfile = async (name: string, email: string, phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const bodyPayload = {
        name,
        newPhone: phone,
        newEmail: email,
      };

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (data.success && data.profile) {
        await refreshProfile();
        return { success: true };
      } else {
        return { success: false, error: data.message || "Failed to update profile." };
      }
    } catch (err: any) {
      console.error("Error updating profile in Context:", err);
      return { success: false, error: err.message || "An unexpected error occurred." };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // 1. Sign out of custom cookies session
      await fetch('/api/auth/logout', { method: 'POST' }).catch(err => console.error(err));
      
      // 2. Sign out of Supabase
      const browserSupabase = createBrowserSupabaseClient();
      await browserSupabase.auth.signOut().catch(err => console.error(err));

      // 3. Clear storage
      localStorage.removeItem("mehta_logged_in");
      localStorage.removeItem("mehta_user_id");
      localStorage.removeItem("mehta_user_phone");
      localStorage.removeItem("mehta_user_name");
      localStorage.removeItem("mehta_user_email");
      localStorage.removeItem("mehta_avatar_url");
      localStorage.removeItem("mehta_pending_phone_verification");

      setProfile(null);
      setIsLoggedIn(false);
      
      window.dispatchEvent(new Event("authUpdated"));
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomerAuthContext.Provider value={{ profile, isLoggedIn, isLoading, refreshProfile, updateProfile, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
