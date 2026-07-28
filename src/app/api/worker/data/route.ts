import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

import { verifySession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // 🔒 Double-Check Worker Authorization
    const cookieStore = await cookies();
    const workerToken = cookieStore.get('mehta_worker_token')?.value || cookieStore.get('mehta_admin_token')?.value;
    const authPayload = workerToken ? await verifySession(workerToken) : null;
    if (!authPayload || (!authPayload.employeeId && authPayload.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized: Worker access required' }, { status: 401 });
    }
    // 1. Fetch Orders
    const { data: userOrders, error: ordersError } = await supabaseServer
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // 2. Fetch Invoices
    const { data: invoicesData, error: invoicesError } = await supabaseServer
      .from('invoices')
      .select('*, orders(*)')
      .order('created_at', { ascending: false });

    // 3. Fetch Customers
    const { data: customersData, error: customersError } = await supabaseServer
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        orders: userOrders || [],
        customers: customersData || [],
        payments: [], // Payments not typically needed unless specifically requested
        invoices: invoicesData || [],
        notifications: []
      }
    });

  } catch (error: any) {
    console.error("Error fetching secure worker data:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
