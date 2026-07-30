"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface CustomerProfile {
  id: string;
  name: string | null;
  full_name?: string | null; // Support fallback mappings
  email: string | null;
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
      console.log("[AUTH-DEBUG] CustomerAuthContext - fetchProfile start");
      setIsLoading(true);
      const res = await fetch('/api/auth/me');
      console.log("[AUTH-DEBUG] CustomerAuthContext - fetchProfile /api/auth/me status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("[AUTH-DEBUG] CustomerAuthContext - fetchProfile /api/auth/me payload:", data);
        if (data.authenticated && data.user) {
          // Map backend fields to frontend profile fields cleanly, supporting both standard database column names
          const mappedProfile: CustomerProfile = {
            id: data.user.id,
            name: data.user.name || data.user.full_name || null,
            full_name: data.user.name || data.user.full_name || null,
            email: data.user.email || null,
            phone: data.user.phone || null,
            profile_image: data.user.profile_image || data.user.avatar_url || null,
            avatar_url: data.user.profile_image || data.user.avatar_url || null,
          };
          console.log("[AUTH-DEBUG] CustomerAuthContext - Mapping profile details and setting loggedIn true");
          setProfile(mappedProfile);
          setIsLoggedIn(true);
          
          // Legacy sync
          localStorage.setItem("mehta_logged_in", "true");
          localStorage.setItem("mehta_user_id", mappedProfile.id);
          if (mappedProfile.phone) localStorage.setItem("mehta_user_phone", mappedProfile.phone);
          if (mappedProfile.name) localStorage.setItem("mehta_user_name", mappedProfile.name);
          if (mappedProfile.email) localStorage.setItem("mehta_user_email", mappedProfile.email);
          
          return mappedProfile;
        }
      }
      
      // If not authenticated via custom JWT, try standard Supabase user (Google Auth)
      console.log("[AUTH-DEBUG] CustomerAuthContext - JWT not authenticated, checking Supabase getUser...");
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch profile using customer table
        let { data: customer } = await supabase
          .from('customers')
          .select('id, name, full_name, email, phone, profile_image, avatar_url, auth_user_id')
          .or(`id.eq.${user.id},auth_user_id.eq.${user.id}`)
          .maybeSingle();

        // Auto-heal/sync if profile is not found by ID, but they have an email matching a legacy profile
        if (!customer && user.email) {
          const { data: legacyCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();
            
          if (legacyCustomer) {
            console.log("[AUTH-DEBUG] Linking legacy customer record by email:", user.email);
            const { data: updatedCustomer } = await supabase
              .from('customers')
              .update({ auth_user_id: user.id, auth_provider: 'google' })
              .eq('id', legacyCustomer.id)
              .select('id, name, full_name, email, phone, profile_image, avatar_url, auth_user_id')
              .single();
            if (updatedCustomer) {
              customer = updatedCustomer;
            }
          }
        }

        const resolvedName = customer?.name || customer?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || null;
        const resolvedEmail = customer?.email || user.email || null;
        const resolvedPhone = customer?.phone || null;
        const resolvedAvatar = customer?.profile_image || customer?.avatar_url || user.user_metadata?.avatar_url || null;

        const mappedProfile: CustomerProfile = {
          id: customer?.id || user.id,
          name: resolvedName,
          full_name: resolvedName,
          email: resolvedEmail,
          phone: resolvedPhone,
          profile_image: resolvedAvatar,
          avatar_url: resolvedAvatar,
        };

        setProfile(mappedProfile);
        setIsLoggedIn(true);

        // Legacy sync
        localStorage.setItem("mehta_logged_in", "true");
        localStorage.setItem("mehta_user_id", mappedProfile.id);
        if (mappedProfile.phone) localStorage.setItem("mehta_user_phone", mappedProfile.phone);
        if (mappedProfile.name) localStorage.setItem("mehta_user_name", mappedProfile.name);
        if (mappedProfile.email) localStorage.setItem("mehta_user_email", mappedProfile.email);

        return mappedProfile;
      }

      // No session found
      setProfile(null);
      setIsLoggedIn(false);
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
      await supabase.auth.signOut().catch(err => console.error(err));

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
