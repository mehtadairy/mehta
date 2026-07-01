import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  try {
    // 1. Fetch Orders
    const { data: userOrders, error: ordersError } = await supabaseServer
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // 2. Fetch Customers
    const { data: customerList, error: custError } = await supabaseServer
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (custError) throw custError;

    // 3. Fetch Payments
    const { data: paymentData, error: payErr } = await supabaseServer
      .from('payments')
      .select('*, orders(*)')
      .order('created_at', { ascending: false });

    // 4. Fetch Invoices
    const { data: invoiceData, error: invErr } = await supabaseServer
      .from('invoices')
      .select('*, orders(*)')
      .order('created_at', { ascending: false });

    // 5. Fetch Notifications
    const { data: notifyData, error: notErr } = await supabaseServer
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        orders: userOrders || [],
        customers: customerList || [],
        payments: paymentData || [],
        invoices: invoiceData || [],
        notifications: notifyData || []
      }
    });

  } catch (error: any) {
    console.error("Error fetching secure worker data:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
