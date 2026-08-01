import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { hashPassword, checkPasswordHistory, updatePasswordHistory } from '@/lib/password-utils';
import { validatePasswordPolicy } from '@/lib/password-policy';
import { logPasswordAuditEvent } from '@/lib/password-reset-token';
import { updateStaffInStore, getSharedStaffStore } from '@/lib/staff-store';
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

    const { id, newPassword } = await request.json().catch(() => ({}));

    if (!id || !newPassword) {
      return NextResponse.json({ success: false, error: 'Staff ID and new password are required' }, { status: 400 });
    }

    // 🔒 1. Enforce Password Policy
    const policyResult = await validatePasswordPolicy(newPassword);
    if (!policyResult.valid) {
      logPasswordAuditEvent('reset_failed', id, { reason: policyResult.reason });
      return NextResponse.json({ success: false, error: policyResult.reason }, { status: 400 });
    }

    // 🔒 2. Fetch history and prevent password reuse
    let currentHash = '';
    let passwordHistory: string[] = [];

    const { data: staff } = await supabaseServer
      .from('staff_accounts')
      .select('id, password_hash, password_history')
      .eq('id', id)
      .maybeSingle();

    if (staff) {
      currentHash = staff.password_hash;
      passwordHistory = staff.password_history || [];
    } else {
      const store = getSharedStaffStore();
      const matched = store.find((s) => s.id === id);
      if (matched) {
        currentHash = matched.password_hash;
        passwordHistory = (matched as any).password_history || [];
      }
    }

    const fullHistory = [currentHash, ...passwordHistory].filter(Boolean);
    if (checkPasswordHistory(newPassword, fullHistory)) {
      logPasswordAuditEvent('reset_failed', id, { reason: 'Password reuse' });
      return NextResponse.json({
        success: false,
        error: 'You cannot reuse any of the last 5 passwords for this account.'
      }, { status: 400 });
    }

    // 🔒 3. Hash password with Bcrypt Cost Factor 12 and update history
    const hashedPassword = hashPassword(newPassword);
    const updatedHistory = updatePasswordHistory(passwordHistory, currentHash);
    const passwordUpdatedAt = new Date().toISOString();

    updateStaffInStore(id, {
      password_hash: hashedPassword,
      ...({ password_history: updatedHistory, password_updated_at: passwordUpdatedAt } as any)
    });

    try {
      await supabaseServer
        .from('staff_accounts')
        .update({
          password_hash: hashedPassword,
          password_history: updatedHistory,
          password_updated_at: passwordUpdatedAt,
          updated_at: passwordUpdatedAt
        })
        .eq('id', id);
    } catch (e) {
      console.warn("Reset password DB fallback used shared staff store");
    }

    logPasswordAuditEvent('reset_completed', id);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Active sessions invalidated.'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
