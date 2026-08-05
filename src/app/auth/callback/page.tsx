"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import { syncGoogleUserOnServer, createGoogleUserOnServer, setCustomerSessionCookie } from "./actions";

export default function AuthCallback() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");
  const supabase = createBrowserSupabaseClient();

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

      // Use Server Action to bypass RLS when claiming legacy accounts
      const { success, customer: syncedCustomer, error: syncError } = await syncGoogleUserOnServer(user.id, email, name);

      let customer = syncedCustomer;
      let userPhone = "";
      let userName = name;

      if (!success && syncError) {
        console.error("Error looking up customer profile via Server Action:", syncError);
      }

      const params = new URLSearchParams(window.location.search);
      const intent = params.get("intent") || "login";

      if (!customer) {
        if (intent === 'login') {
          await supabase.auth.signOut();
          const picture = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
          const redirectUrl = params.get("redirect");
          const signupParams = new URLSearchParams();
          if (name) signupParams.set("name", name);
          if (email) signupParams.set("email", email);
          if (picture) signupParams.set("picture", picture);
          if (redirectUrl) signupParams.set("redirect", redirectUrl);
          signupParams.set("reason", "google_not_found");

          router.push(`/signup?${signupParams.toString()}`);
          return;
        }

        // Insert new profile if not found (Signup intent) via Server Action
        const { success: createSuccess, customer: newCustomer, error: createError } = await createGoogleUserOnServer(user.id, email, name);

        if (!createSuccess || createError) {
          console.error("Error creating customer profile via Server Action:", createError);
          // Fallback to locally saving name from Google metadata
        } else if (newCustomer) {
          customer = newCustomer;
          userName = newCustomer.name || name;
          localStorage.setItem("mehta_user_id", newCustomer.id);
        }
      } else {
        userName = customer.name || name;
        userPhone = customer.phone || "";
        localStorage.setItem("mehta_user_id", customer.id);
      }

      // Issue HTTP session cookie for middleware route protection
      if (customer) {
        await setCustomerSessionCookie(customer);
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
      const redirectUrl = params.get("redirect");
      
      if (needsPhoneVerification) {
        router.push(`/complete-profile${redirectUrl ? `?redirect=${redirectUrl}` : ''}`);
      } else if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/");
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
