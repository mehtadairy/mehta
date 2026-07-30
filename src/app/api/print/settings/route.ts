import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  try {
    const { headers } = request;
    const apiKey = process.env.PRINT_AGENT_API_KEY;
    const clientKey = headers.get('x-print-agent-key') || headers.get('X-Print-Agent-Key');

    if (!apiKey || clientKey !== apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: settings, error } = await supabaseServer
      .from('printer_settings')
      .select('*')
      .eq('branch', 'Main')
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      settings: settings || {
        selected_printer: '',
        paper_width: '80mm',
        auto_print_enabled: true,
        print_copies: 1,
        print_kitchen_receipt: true,
        print_packing_slip: true,
        auto_retry: true
      }
    });

  } catch (error: any) {
    console.error('[PrintSettingsAPI] GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { headers } = request;
    const apiKey = process.env.PRINT_AGENT_API_KEY;
    const clientKey = headers.get('x-print-agent-key') || headers.get('X-Print-Agent-Key');

    if (!apiKey || clientKey !== apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { printers, status } = await request.json();

    const { data: existing } = await supabaseServer
      .from('printer_settings')
      .select('id')
      .eq('branch', 'Main')
      .maybeSingle();

    let resultError = null;

    if (existing) {
      const { error } = await supabaseServer
        .from('printer_settings')
        .update({
          installed_printers: printers || [],
          status: status || 'online',
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('branch', 'Main');
      resultError = error;
    } else {
      const { error } = await supabaseServer
        .from('printer_settings')
        .insert([{
          branch: 'Main',
          installed_printers: printers || [],
          status: status || 'online',
          last_seen: new Date().toISOString()
        }]);
      resultError = error;
    }

    if (resultError) throw resultError;

    return NextResponse.json({ success: true, message: 'Printer settings updated successfully' });

  } catch (error: any) {
    console.error('[PrintSettingsAPI] POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
