import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

import { verifySession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';



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
        .select('id, order_number, created_at, status, total, subtotal, delivery_charge, discount, payment_status, payment_method, payment_id, paid_at, payment_completed_at, invoice_url, user_name, user_phone, user_email, shipping_address, source, cancellation_reason, cancelled_by, cancelled_at, printed, print_status, order_items(product_id, product_name, weight, quantity, price, image), invoices(id, invoice_number, pdf_url, created_at)', { count: 'exact' })
        .neq('status', 'Draft')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),

      // 2. Customers — lean fields only
      supabaseServer
        .from('customers')
        .select('id, full_name, phone, email, created_at, total_orders, is_blocked, addresses', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),

      // 3. Payments — lean fields only
      supabaseServer
        .from('payments')
        .select('id, order_id, amount, status, payment_method, razorpay_payment_id, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
        .then(r => r, err => ({ data: [], count: 0, error: err })),

      // 4. Invoices — lean fields only
      supabaseServer
        .from('invoices')
        .select('id, order_id, invoice_number, pdf_url, total_amount, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),

      // 5. Notifications — lean fields + limit 50
      supabaseServer
        .from('notification_logs')
        .select('id, recipient, type, status, template_name, error_message, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
        .then(r => r, err => ({ data: [], error: err })),

      // 6. Payment Recoveries — lean fields + limit 50
      supabaseServer
        .from('payment_recovery')
        .select('id, razorpay_order_id, customer_phone, status, retry_count, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
        .then(r => r, err => ({ data: [], error: err })),
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
    console.error("Error fetching secure admin data:", error?.message || error);
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}
