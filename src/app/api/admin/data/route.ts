import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

import { verifySession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

// Lean field definitions — never fetch more columns than needed
const ORDER_FIELDS = 'id, order_number, user_name, user_phone, user_email, total, status, payment_status, shipment_status, created_at, shipping_address, items';
const ORDER_ITEMS_FIELDS = 'id, product_id, product_name, quantity, price, weight';
const INVOICE_FIELDS = 'id, invoice_number, order_id, pdf_url, created_at';
const CUSTOMER_FIELDS = 'id, name, phone, email, created_at, profile_image';
const PAYMENT_FIELDS = 'id, razorpay_order_id, order_id, amount, status, created_at';
const NOTIFICATION_FIELDS = 'id, order_id, customer_phone, template_name, status, error_message, created_at';
const RECOVERY_FIELDS = 'id, payment_id, amount, status, failure_reason, created_at, payload';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(request: Request) {
  try {
    // 🔒 Double-Check Admin Authorization
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('mehta_admin_token')?.value;
    const authPayload = adminToken ? await verifySession(adminToken) : null;
    if (!authPayload || authPayload.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));
    const offset = (page - 1) * limit;

    // Run all 6 queries in parallel — each with explicit columns + pagination
    const [
      ordersResult,
      customersResult,
      paymentsResult,
      invoicesResult,
      notificationsResult,
      recoveryResult,
    ] = await Promise.all([
      // 1. Orders with nested order_items and invoices (lean columns)
      supabaseServer
        .from('orders')
        .select(`${ORDER_FIELDS}, order_items(${ORDER_ITEMS_FIELDS}), invoices(${INVOICE_FIELDS})`, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),

      // 2. Customers — lean fields only
      supabaseServer
        .from('customers')
        .select(CUSTOMER_FIELDS, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),

      // 3. Payments — lean fields only
      supabaseServer
        .from('payments')
        .select(PAYMENT_FIELDS, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),

      // 4. Invoices — lean fields only
      supabaseServer
        .from('invoices')
        .select(INVOICE_FIELDS, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),

      // 5. Notifications — lean fields + hard limit 100
      supabaseServer
        .from('notification_logs')
        .select(NOTIFICATION_FIELDS)
        .order('created_at', { ascending: false })
        .limit(100)
        .catch(err => ({ data: [], error: err })),

      // 6. Payment Recoveries — lean fields + hard limit 200
      supabaseServer
        .from('payment_recovery')
        .select(RECOVERY_FIELDS)
        .order('created_at', { ascending: false })
        .limit(200)
        .catch(err => ({ data: [], error: err })),
    ]);

    if (ordersResult.error) throw ordersResult.error;

    return NextResponse.json({
      success: true,
      pagination: {
        page,
        limit,
        total_orders: ordersResult.count ?? 0,
        total_customers: customersResult.count ?? 0,
        total_payments: paymentsResult.count ?? 0,
        total_invoices: invoicesResult.count ?? 0,
      },
      data: {
        orders: ordersResult.data || [],
        customers: customersResult.data || [],
        payments: paymentsResult.data || [],
        invoices: invoicesResult.data || [],
        notifications: notificationsResult.data || [],
        paymentRecoveries: recoveryResult.data || [],
      }
    });

  } catch (error: any) {
    console.error("Error fetching secure admin data:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
