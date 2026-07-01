import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { employeeId, password } = await request.json();
    
    if (!employeeId || !password) {
      return NextResponse.json({ error: 'Employee ID and password are required' }, { status: 400 });
    }

    // Direct local override credentials check for immediate worker profile testing
    if (employeeId === 'babli' && password === 'babli@1972') {
      return NextResponse.json({
        success: true,
        worker: {
          id: 'worker-babli-bypass',
          employeeId: 'babli',
          name: 'Babli',
          role: 'Store Manager',
          branch: 'Main Branch',
          phone: '9876543212',
          status: 'active'
        }
      });
    }

    // Query employee record matching active status
    const { data: worker, error } = await supabase
      .from('workers')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('password', password)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !worker) {
      return NextResponse.json({ error: 'Invalid Employee ID or Password' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      worker: {
        id: worker.id,
        employeeId: worker.employee_id,
        name: worker.name,
        role: worker.role,
        branch: worker.branch,
        phone: worker.phone_number,
        status: worker.status
      }
    });
  } catch (error) {
    console.error('Worker login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
