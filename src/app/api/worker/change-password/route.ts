import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifySession } from '@/lib/auth-utils';
import { verifyPassword, hashPassword, checkPasswordHistory, updatePasswordHistory } from '@/lib/password-utils';
import { validatePasswordPolicy } from '@/lib/password-policy';
import { logPasswordAuditEvent } from '@/lib/password-reset-token';
import { getSharedStaffStore, updateStaffInStore } from '@/lib/staff-store';
import { logRejectedSubmission } from '@/lib/security-validation';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const workerToken = cookieStore.get('mehta_worker_token')?.value;
    const authPayload = workerToken ? await verifySession(workerToken) : null;

    if (!authPayload || !authPayload.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Worker access required' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.oldPassword || !body.newPassword) {
      logRejectedSubmission('/api/worker/change-password', 'Invalid JSON body');
      return NextResponse.json({ success: false, error: 'Current password and new password are required' }, { status: 400 });
    }

    const { oldPassword, newPassword } = body;
    const workerId = authPayload.id;

    // 🔒 1. Enforce Password Policy (12-128 chars, dictionary & breach checks)
    const policyResult = await validatePasswordPolicy(newPassword);
    if (!policyResult.valid) {
      return NextResponse.json({ success: false, error: policyResult.reason }, { status: 400 });
    }

    // 🔒 2. Fetch staff record & password history
    let currentHash = '';
    let passwordHistory: string[] = [];

    const { data: staff } = await supabaseServer
      .from('staff_accounts')
      .select('id, password_hash, password_history, username')
      .eq('id', workerId)
      .maybeSingle();

    if (staff) {
      currentHash = staff.password_hash;
      passwordHistory = staff.password_history || [];
    } else {
      const store = getSharedStaffStore();
      const matched = store.find((s) => s.id === workerId || s.username === authPayload.username);
      if (matched) {
        currentHash = matched.password_hash;
        passwordHistory = (matched as any).password_history || [];
      }
    }

    // Verify current password
    if (!currentHash || !verifyPassword(oldPassword, currentHash)) {
      logRejectedSubmission('/api/worker/change-password', 'Incorrect current password', { workerId });
      return NextResponse.json({ success: false, error: 'Incorrect current password' }, { status: 400 });
    }

    // 🔒 3. Prevent Password Reuse (Last 5 Passwords)
    const fullHistory = [currentHash, ...passwordHistory];
    if (checkPasswordHistory(newPassword, fullHistory)) {
      return NextResponse.json({
        success: false,
        error: 'You cannot reuse any of your last 5 passwords. Please choose a new password.'
      }, { status: 400 });
    }

    // 🔒 4. Hash new password & update history
    const newPasswordHash = hashPassword(newPassword);
    const updatedHistory = updatePasswordHistory(passwordHistory, currentHash);
    const passwordUpdatedAt = new Date().toISOString();

    updateStaffInStore(workerId, {
      password_hash: newPasswordHash,
      ...( { password_history: updatedHistory, password_updated_at: passwordUpdatedAt } as any )
    });

    await supabaseServer
      .from('staff_accounts')
      .update({
        password_hash: newPasswordHash,
        password_history: updatedHistory,
        password_updated_at: passwordUpdatedAt,
        updated_at: passwordUpdatedAt
      })
      .eq('id', workerId);

    logPasswordAuditEvent('password_changed', authPayload.username || workerId);

    // 🔒 5. Session Security: Invalidate current token and force re-login
    const response = NextResponse.json({
      success: true,
      message: 'Password updated successfully. Please log in again with your new password.'
    });

    response.cookies.delete('mehta_worker_token');

    return response;

  } catch (error: any) {
    console.error('Worker change password error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
