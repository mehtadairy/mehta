import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const authHeader = (request.headers.get('authorization') || '').trim();
    const apiKey = (process.env.PRINT_AGENT_API_KEY || '').replace(/['"]/g, '').trim();
    const cleanClientKey = authHeader.replace(/^Bearer\s+/i, '').replace(/['"]/g, '').trim();

    if (!apiKey || cleanClientKey !== apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { branch_id } = await request.json();

    if (!branch_id) {
      return NextResponse.json({ error: 'Missing branch_id' }, { status: 400 });
    }

    // Normalize branch_id (e.g. "Main Shop" -> "Main") to ensure single-branch synchronization
    const targetBranch = branch_id.toLowerCase().includes('main') ? 'Main' : branch_id;

    // Upsert the printer settings to update last_seen and status
    const { error } = await supabase
      .from('printer_settings')
      .upsert({
        branch: targetBranch,
        status: 'online',
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'branch' });

    if (error) {
      console.error("[Heartbeat Error]", error);
      return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Heartbeat Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
