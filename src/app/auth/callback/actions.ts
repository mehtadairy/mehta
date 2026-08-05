"use server";

import { supabaseServer as supabase } from "@/lib/supabaseServer";
import { cookies, headers } from "next/headers";
import { SignJWT } from "jose";
import { getCustomerJWTSecret, getCustomerCookieOptions } from "@/lib/auth-utils";

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
      console.error("Error looking up customer profile by auth_user_id:", selectError);
    }

    // 2. Legacy fallback: if not found by auth_user_id, check if they exist by email
    if (!customer && email) {
      const { data: legacyCustomer } = await supabase
        .from("customers")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      
      // If legacy customer found, update auth_user_id & auth_provider to link account
      if (legacyCustomer) {
        const { data: updatedCustomer, error: updateError } = await supabase
          .from("customers")
          .update({ 
            auth_user_id: userId, 
            auth_provider: 'google',
            name: legacyCustomer.name || name
          })
          .eq("id", legacyCustomer.id)
          .select()
          .single();
          
        if (updateError) {
          console.error("Error linking legacy account by email:", updateError);
        } else if (updatedCustomer) {
          customer = updatedCustomer;
        }
      }
    }

    // 3. Auto-create customer record if not found in database at all
    if (!customer) {
      const { data: newCustomer, error: insertError } = await supabase
        .from("customers")
        .insert([
          {
            auth_user_id: userId,
            email: email,
            name: name || "Google User",
            phone: null,
            auth_provider: 'google',
            role: 'customer'
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error("Error auto-creating customer profile:", insertError);
        return { success: false, error: insertError.message };
      }
      customer = newCustomer;
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

export async function setCustomerSessionCookie(customer: any) {
  try {
    if (!customer || !customer.id) return { success: false, error: "Invalid customer payload" };
    const secret = getCustomerJWTSecret();
    const token = await new SignJWT({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      role: customer.role || 'customer'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    const headerStore = await headers();
    const cookieStore = await cookies();
    const cookieOptions = getCustomerCookieOptions(headerStore.get('host'));
    cookieStore.set('mehta_customer_token', token, cookieOptions);
    return { success: true };
  } catch (err: any) {
    console.error("Failed to set customer session cookie:", err);
    return { success: false, error: err.message };
  }
}
