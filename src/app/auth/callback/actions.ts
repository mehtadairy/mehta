"use server";

import { supabaseServer as supabase } from "@/lib/supabaseServer";

export async function syncGoogleUserOnServer(userId: string, email: string, name: string) {
  try {
    if (!userId || !email) {
      return { success: false, error: "Missing userId or email" };
    }

    // 1. Look up user by auth_user_id in 'customers' table
    let { data: customer, error: selectError } = await supabase
      .from("customers")
      .select("*")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error("Error looking up customer profile:", selectError);
      return { success: false, error: selectError.message };
    }

    // Legacy fallback: if not found by auth_user_id, check if they exist by email
    if (!customer && email) {
      const { data: legacyCustomer } = await supabase
        .from("customers")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      
      // If legacy customer found but hasn't linked a Google account yet
      if (legacyCustomer && !legacyCustomer.auth_user_id) {
        // Claim this legacy account securely using service role key (bypasses RLS)
        const { data: updatedCustomer, error: updateError } = await supabase
          .from("customers")
          .update({ 
            auth_user_id: userId, 
            auth_provider: 'google',
            // Keep existing name if it exists, otherwise use Google name
            name: legacyCustomer.name || name
          })
          .eq("id", legacyCustomer.id)
          .select()
          .single();
          
        if (updateError) {
          console.error("Error claiming legacy account:", updateError);
        } else if (updatedCustomer) {
          customer = updatedCustomer;
        }
      }
    }

    if (!customer) {
      return { success: true, customer: null }; // Not found, needs signup handling
    }

    return { success: true, customer };
    
  } catch (error: any) {
    console.error("Server Action Error (syncGoogleUser):", error);
    return { success: false, error: error.message };
  }
}

export async function createGoogleUserOnServer(userId: string, email: string, name: string) {
  try {
    const { data: newCustomer, error: insertError } = await supabase
      .from("customers")
      .insert([
        {
          auth_user_id: userId,
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
      return { success: false, error: insertError.message };
    }

    return { success: true, customer: newCustomer };
  } catch (error: any) {
    console.error("Server Action Error (createGoogleUser):", error);
    return { success: false, error: error.message };
  }
}
