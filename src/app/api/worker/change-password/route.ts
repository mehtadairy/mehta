import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifySession } from '@/lib/auth-utils';
import { verifyPassword, hashPassword } from '@/lib/password-utils';
import { getSharedStaffStore, updateStaffInStore } from '@/lib/staff-store';
import { passwordSchema, logRejectedSubmission } from '@/lib/security-validation';
import { cookies } from 'next/headers';
import { z } from 'zod';

const changePasswordSchema = z.object({
  oldPassword: passwordSchema,
  newPassword: passwordSchema
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const workerToken = cookieStore.get('mehta_worker_token')?.value;
    const authPayload = workerToken ? await verifySession(workerToken) : null;

    if (!authPayload || !authPayload.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Worker access required' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      logRejectedSubmission('/api/worker/change-password', 'Invalid JSON body');
      return NextResponse.json({ success: false, error: 'Invalid request payload' }, { status: 400 });
    }

    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      logRejectedSubmission('/api/worker/change-password', 'Input validation failed', validation.error.format());
      return NextResponse.json({ success: false, error: 'Invalid password format. Password must be 6-128 characters.' }, { status: 400 });
    }

    const { oldPassword, newPassword } = validation.data;
    const workerId = authPayload.id;

    // 1. Fetch current staff record from DB or shared store
    let currentHash = '';
    const { data: staff } = await supabaseServer
      .from('staff_accounts')
      .select('id, password_hash, username')
      .eq('id', workerId)
      .maybeSingle();

    if (staff) {
      currentHash = staff.password_hash;
    } else {
      const store = getSharedStaffStore();
      const matched = store.find((s) => s.id === workerId || s.username === authPayload.username);
      if (matched) currentHash = matched.password_hash;
    }

    // Fallback: Check legacy workers table
    if (!currentHash) {
      const { data: legacy } = await supabaseServer
        .from('workers')
        .select('id, password, password_hash')
        .eq('id', workerId)
        .maybeSingle();

      if (legacy) currentHash = legacy.password_hash || legacy.password;
    }

    if (!currentHash || !verifyPassword(oldPassword, currentHash)) {
      logRejectedSubmission('/api/worker/change-password', 'Incorrect current password', { workerId });
      return NextResponse.json({ success: false, error: 'Incorrect current password' }, { status: 400 });
    }

    // 2. Hash new password using Bcrypt Cost 12
    const newPasswordHash = hashPassword(newPassword);

    // 3. Update staff_accounts and shared memory store
    updateStaffInStore(workerId, { password_hash: newPasswordHash });

    await supabaseServer
      .from('staff_accounts')
      .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() })
      .eq('id', workerId);

    // Update legacy workers table if present
    try {
      await supabaseServer
        .from('workers')
        .update({ password_hash: newPasswordHash })
        .eq('id', workerId);
    } catch (e) {
      // Ignore if legacy table doesn't exist
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error: any) {
    console.error('Worker change password error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
