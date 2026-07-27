import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  try {
    // Check orders
    const { data: orders, error: ordersError } = await supabaseServer
      .from('orders')
      .select('*')
      .limit(5);

    // Check print_jobs
    const { data: printJobs, error: jobsError } = await supabaseServer
      .from('print_jobs')
      .select('*')
      .limit(5);

    // Check printer_settings
    const { data: printerSettings, error: settingsError } = await supabaseServer
      .from('printer_settings')
      .select('*');

    return NextResponse.json({
      success: true,
      orders: {
        data: orders,
        error: ordersError ? ordersError.message : null
      },
      printJobs: {
        data: printJobs,
        error: jobsError ? jobsError.message : null
      },
      printerSettings: {
        data: printerSettings,
        error: settingsError ? settingsError.message : null
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
