"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let isSubscribed = true;

    const handleAuthCallback = async () => {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isSubscribed) return;

          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            if (session) {
              isSubscribed = false;
              subscription.unsubscribe();
              
              // ALWAYS fetch the secure, authenticated user directly from the server.
              const { data: { user }, error: userError } = await supabase.auth.getUser();
              
              if (userError) {
                setErrorMsg(userError.message || "Failed to verify user session.");
                return;
              }
              if (!user) {
                setErrorMsg("No user found for this session.");
                return;
              }
              
              await syncUserProfile(user);
            } else if (event === 'INITIAL_SESSION') {
              // Wait a bit in case the hash is still parsing
              setTimeout(() => {
                if (isSubscribed) {
                  setErrorMsg("No active session found. Please try logging in again.");
                  subscription.unsubscribe();
                }
              }, 4000);
            }
          }
        });
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setErrorMsg(err.message || "Authentication failed. Please try again.");
      }
    };

    const syncUserProfile = async (user: any) => {
      const email = user.email;
      const name = user.user_metadata?.full_name || user.user_metadata?.name || "Google User";

      if (!email) {
        throw new Error("Email address not returned by auth provider.");
      }

      // 1. Look up user by auth_user_id in 'customers' table
      let { data: customer, error: selectError } = await supabase
        .from("customers")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      // Legacy fallback: if not found by auth_user_id, check if they exist by email
      if (!customer && email) {
         const { data: legacyCustomer } = await supabase
           .from("customers")
           .select("*")
           .eq("email", email)
           .maybeSingle();
         
         if (legacyCustomer && !legacyCustomer.auth_user_id) {
           // Claim this legacy account
           const { data: updatedCustomer } = await supabase
             .from("customers")
             .update({ auth_user_id: user.id })
             .eq("id", legacyCustomer.id)
             .select()
             .single();
           if (updatedCustomer) {
             customer = updatedCustomer;
           }
         }
      }

      let userPhone = "";
      let userName = name;

      if (selectError && selectError.code !== 'PGRST116') {
        console.error("Error looking up customer profile:", selectError);
      }

      if (!customer) {
        // 2. Insert new profile if not found
        const { data: newCustomer, error: insertError } = await supabase
          .from("customers")
          .insert([
            {
              auth_user_id: user.id,
              email: email,
              name: name,
              phone: null, // Phone is optional initially
              auth_provider: 'google'
            }
          ])
          .select()
          .single();

        if (insertError) {
          console.error("Error creating customer profile:", insertError);
          // Fallback to locally saving name from Google metadata
        } else if (newCustomer) {
          userName = newCustomer.name || name;
          localStorage.setItem("mehta_user_id", newCustomer.id);
        }
      } else {
        userName = customer.name || name;
        userPhone = customer.phone || "";
        localStorage.setItem("mehta_user_id", customer.id);
      }

      // 3. Save session indicators in localStorage
      localStorage.setItem("mehta_logged_in", "true");
      localStorage.setItem("mehta_user_name", userName);
      localStorage.setItem("mehta_user_email", email);
      
      const needsPhoneVerification = !userPhone || customer?.phone_verified === false;
      
      if (!needsPhoneVerification) {
        localStorage.setItem("mehta_user_phone", userPhone);
      } else {
        localStorage.removeItem("mehta_user_phone"); // Prompt to enter phone number
        localStorage.setItem("mehta_pending_phone_verification", "true");
      }

      // 4. Trigger state update events across pages
      window.dispatchEvent(new Event("authUpdated"));

      // 5. Redirect to destination or account dashboard
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get("redirect");
      
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/account");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col justify-center items-center p-6 text-center">
      <div className="max-w-md w-full bg-white border border-brand-beige rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center gap-6">
        {errorMsg ? (
          <>
            <div className="h-16 w-16 bg-red-50 text-red-500 border-2 border-red-500 rounded-full flex items-center justify-center text-3xl font-bold">
              ×
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-charcoal">Authentication Error</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{errorMsg}</p>
            </div>
            <button
              onClick={() => router.push("/account")}
              className="w-full py-3 bg-brand-orange hover:bg-brand-orange-hover text-white font-bold rounded-xl text-xs transition-colors shadow-md"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <Loader2 className="h-10 w-10 text-brand-orange animate-spin" />
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-charcoal">Logging you in</h3>
              <p className="text-xs text-muted-foreground mt-1.5">
                Securing your session and loading your profile...
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
