import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { signSession } from '@/lib/auth-utils';
import { verifyPassword } from '@/lib/password-utils';
import { getSharedStaffStore, updateStaffInStore } from '@/lib/staff-store';
import { usernameSchema, passwordSchema, logRejectedSubmission } from '@/lib/security-validation';
import { z } from 'zod';

const workerLoginSchema = z.object({
  username: usernameSchema.optional().or(z.literal('')),
  employeeId: usernameSchema.optional().or(z.literal('')),
  password: passwordSchema
}).refine((data) => (data.username && data.username.length >= 3) || (data.employeeId && data.employeeId.length >= 3), {
  message: 'Username or Employee ID is required'
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      logRejectedSubmission('/api/worker/login', 'Invalid JSON body');
      return NextResponse.json({ error: 'Invalid Username or Password' }, { status: 400 });
    }

    const validation = workerLoginSchema.safeParse(body);
    if (!validation.success) {
      logRejectedSubmission('/api/worker/login', 'Input validation failed', validation.error.format());
      return NextResponse.json({ error: 'Invalid Username or Password' }, { status: 401 });
    }

    const { username, employeeId, password } = validation.data;
    const loginUser = (username || employeeId || '').trim().toLowerCase();

    let workerPayload: any = null;

    // 2. Query Supabase DB staff_accounts
    if (!workerPayload) {
      try {
        const { data: staff } = await supabaseServer
          .from('staff_accounts')
          .select('*')
          .eq('username', loginUser)
          .eq('status', 'Active')
          .maybeSingle();

        if (staff && verifyPassword(password, staff.password_hash)) {
          workerPayload = {
            id: staff.id,
            username: staff.username,
            employeeId: staff.username,
            name: staff.full_name,
            role: staff.role,
            branch: staff.branch,
            phone: staff.phone,
            status: staff.status,
            permissions: staff.permissions || []
          };

          // Update last_login timestamp
          await supabaseServer
            .from('staff_accounts')
            .update({ last_login: new Date().toISOString() })
            .eq('id', staff.id);
        }
      } catch (e) {
        console.warn("DB login lookup exception, falling back to shared memory store");
      }
    }

    // 3. Query shared memory staff store (for accounts created in Admin Panel when DB table is pending)
    if (!workerPayload) {
      const store = getSharedStaffStore();
      const matchedStaff = store.find(
        (s) => s.username.toLowerCase() === loginUser && s.status === 'Active'
      );

      if (matchedStaff && verifyPassword(password, matchedStaff.password_hash)) {
        workerPayload = {
          id: matchedStaff.id,
          username: matchedStaff.username,
          employeeId: matchedStaff.username,
          name: matchedStaff.full_name,
          role: matchedStaff.role,
          branch: matchedStaff.branch,
          phone: matchedStaff.phone,
          status: matchedStaff.status,
          permissions: matchedStaff.permissions || []
        };

        updateStaffInStore(matchedStaff.id, { last_login: new Date().toISOString() });
      }
    }

    // 4. Query legacy workers table
    if (!workerPayload) {
      try {
        const { data: legacyWorker } = await supabaseServer
          .from('workers')
          .select('*')
          .eq('employee_id', loginUser)
          .eq('password', password)
          .eq('status', 'active')
          .maybeSingle();

        if (legacyWorker) {
          workerPayload = {
            id: legacyWorker.id,
            username: legacyWorker.employee_id,
            employeeId: legacyWorker.employee_id,
            name: legacyWorker.name,
            role: legacyWorker.role,
            branch: legacyWorker.branch,
            phone: legacyWorker.phone_number,
            status: legacyWorker.status,
            permissions: ['dashboard', 'orders']
          };
        }
      } catch (e) {
        console.warn("Legacy worker table lookup error");
      }
    }

    if (!workerPayload) {
      return NextResponse.json({ error: 'Invalid Username or Password' }, { status: 401 });
    }

    const token = await signSession(workerPayload);
    
    const response = NextResponse.json({
      success: true,
      worker: workerPayload
    });

    response.cookies.set('mehta_worker_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 1 day
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Worker login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
