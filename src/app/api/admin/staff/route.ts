import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { hashPassword } from '@/lib/password-utils';
import { getSharedStaffStore, addStaffToStore, updateStaffInStore, deleteStaffFromStore, StaffAccount } from '@/lib/staff-store';

export async function GET() {
  try {
    const { data: dbStaff, error } = await supabaseServer
      .from('staff_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && dbStaff && dbStaff.length > 0) {
      return NextResponse.json({ success: true, data: dbStaff });
    }

    return NextResponse.json({ success: true, data: getSharedStaffStore() });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: getSharedStaffStore() });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, username, password, phone, email, role, branch, permissions, status, avatar_url } = body;

    if (!full_name || !username || !password || !role) {
      return NextResponse.json({ success: false, error: 'Full name, username, password and role are required' }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);
    const newStaffObj: StaffAccount = {
      id: 'staff-' + Date.now(),
      full_name,
      username: username.trim().toLowerCase(),
      password_hash: hashedPassword,
      phone: phone || '',
      email: email || '',
      role: role || 'Cashier',
      branch: branch || 'Main Branch',
      permissions: Array.isArray(permissions) ? permissions : [],
      status: status || 'Active',
      avatar_url: avatar_url || '',
      created_at: new Date().toISOString()
    };

    // Always add to shared store so worker login works instantly even if Supabase DB is offline or table pending
    addStaffToStore(newStaffObj);

    // Try DB Insert
    try {
      const { data, error } = await supabaseServer
        .from('staff_accounts')
        .insert([{
          full_name,
          username: username.trim().toLowerCase(),
          password_hash: hashedPassword,
          phone,
          email,
          role,
          branch,
          permissions: Array.isArray(permissions) ? permissions : [],
          status: status || 'Active',
          avatar_url: avatar_url || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, data });
      }
    } catch (e) {
      console.warn("DB insert fallback used shared staff store");
    }

    return NextResponse.json({ success: true, data: newStaffObj });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, full_name, username, phone, email, role, branch, permissions, status, password, avatar_url, last_login } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Staff ID is required' }, { status: 400 });
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };
    if (full_name !== undefined) updatePayload.full_name = full_name;
    if (username !== undefined) updatePayload.username = username.trim().toLowerCase();
    if (phone !== undefined) updatePayload.phone = phone;
    if (email !== undefined) updatePayload.email = email;
    if (role !== undefined) updatePayload.role = role;
    if (branch !== undefined) updatePayload.branch = branch;
    if (permissions !== undefined) updatePayload.permissions = permissions;
    if (status !== undefined) updatePayload.status = status;
    if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url;
    if (last_login !== undefined) updatePayload.last_login = last_login;
    if (password) {
      updatePayload.password_hash = hashPassword(password);
    }

    // Update shared store
    updateStaffInStore(id, updatePayload);

    // Try DB Update
    try {
      const { data, error } = await supabaseServer
        .from('staff_accounts')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, data });
      }
    } catch (e) {
      console.warn("DB update fallback used shared staff store");
    }

    const updated = getSharedStaffStore().find(s => s.id === id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Staff ID is required' }, { status: 400 });
    }

    deleteStaffFromStore(id);

    try {
      await supabaseServer.from('staff_accounts').delete().eq('id', id);
    } catch (e) {
      console.warn("DB delete fallback used shared staff store");
    }

    return NextResponse.json({ success: true, message: 'Staff deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
