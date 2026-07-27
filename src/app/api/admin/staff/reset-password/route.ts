import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { hashPassword } from '@/lib/password-utils';
import { updateStaffInStore } from '@/lib/staff-store';

export async function POST(request: Request) {
  try {
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
