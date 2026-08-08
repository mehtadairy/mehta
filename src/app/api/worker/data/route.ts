import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

import { verifySession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(request: Request) {
  try {
    // 🔒 1. Strict Worker Authentication (Dedicated Worker Session Token)
    const cookieStore = await cookies();
    const workerToken = cookieStore.get('mehta_worker_token')?.value;
    const authPayload = workerToken ? await verifySession(workerToken) : null;
    
    if (!authPayload || !authPayload.employeeId) {
      return NextResponse.json({ error: 'Unauthorized: Valid worker session required' }, { status: 401 });
    }

    // 2. Configurable Pagination Query Parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));
    const offset = (page - 1) * limit;

    // 3. Fetch Orders with range limit
    const { data: userOrders, error: ordersError, count: totalOrders } = await supabaseServer
      .from('orders')
      .select('id, order_number, created_at, status, total, payment_status, user_name, user_phone, user_email, shipping_address, printed, print_status, order_items(product_id, product_name, weight, quantity, price, image)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (ordersError) throw ordersError;

    // 4. Fetch Invoices with range limit
    let invoicesData = [];
    try {
      const { data, error } = await supabaseServer
        .from('invoices')
        .select('id, order_id, invoice_number, pdf_url, total_amount, created_at')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (!error && data) invoicesData = data;
    } catch (e) {}

    // 5. Fetch Customers with range limit
    let customersData = [];
    try {
      const { data, error } = await supabaseServer
        .from('customers')
        .select('id, full_name, phone, email, created_at, total_orders')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (!error && data) customersData = data;
    } catch (e) {}

    return NextResponse.json({
      success: true,
      pagination: {
        page,
        limit,
        total_orders: totalOrders ?? 0,
      },
      data: {
        orders: userOrders || [],
        customers: customersData || [],
        payments: [], 
        invoices: invoicesData || [],
        notifications: []
      }
    });

  } catch (error: any) {
    console.error("Error fetching secure worker data:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
