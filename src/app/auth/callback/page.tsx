"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Exchange code/session (handled by supabase client automatically on fetch session)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session) {
          // If no session immediately, listen for state changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (newSession) {
              subscription.unsubscribe();
              await syncUserProfile(newSession);
            } else {
              // Timeout or error if no session after 5 seconds
              const timer = setTimeout(() => {
                subscription.unsubscribe();
                setErrorMsg("No active session found. Please try logging in again.");
              }, 5000);
              return () => clearTimeout(timer);
            }
          });
          return;
        }

        await syncUserProfile(session);
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setErrorMsg(err.message || "Authentication failed. Please try again.");
      }
    };

    const syncUserProfile = async (session: any) => {
      const user = session.user;
      const email = user.email;
      const name = user.user_metadata?.full_name || user.user_metadata?.name || "Google User";

      if (!email) {
        throw new Error("Email address not returned by auth provider.");
      }

      // 1. Look up user by email in 'customers' table
      const { data: customer, error: selectError } = await supabase
        .from("customers")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      let userPhone = "";
      let userName = name;

      if (selectError) {
        console.error("Error looking up customer profile:", selectError);
      }

      if (!customer) {
        // 2. Insert new profile if not found
        const { data: newCustomer, error: insertError } = await supabase
          .from("customers")
          .insert([
            {
              email: email,
              name: name,
              phone: null, // Phone is optional initially
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
      if (userPhone) {
        localStorage.setItem("mehta_user_phone", userPhone);
      } else {
        localStorage.removeItem("mehta_user_phone"); // Prompt to enter phone number
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
