import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { hashPassword } from '@/lib/password-utils';
import { updateStaffInStore } from '@/lib/staff-store';
import { verifySession } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('mehta_admin_token')?.value;
    const authPayload = adminToken ? await verifySession(adminToken) : null;
    if (!authPayload || authPayload.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const { id, newPassword } = await request.json();

    if (!id || !newPassword) {
      return NextResponse.json({ success: false, error: 'Staff ID and new password are required' }, { status: 400 });
    }

    const hashedPassword = hashPassword(newPassword);

    // Update shared memory store
    updateStaffInStore(id, { password_hash: hashedPassword });

    try {
      await supabaseServer
        .from('staff_accounts')
        .update({ password_hash: hashedPassword, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (e) {
      console.warn("Reset password DB fallback used shared staff store");
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
