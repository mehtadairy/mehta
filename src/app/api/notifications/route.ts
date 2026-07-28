import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// In-memory fallback notifications list in case database table doesn't exist yet
let fallbackNotifications: any[] = [
  {
    id: 'notif-1',
    order_id: null,
    type: 'system',
    title: 'System Online',
    message: 'Worker notification terminal initialized successfully.',
    read: false,
    created_at: new Date().toISOString()
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('worker_id');

    let query = supabaseServer
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (workerId) {
      query = query.or(`worker_id.eq.${workerId},worker_id.is.null`);
    }

    const { data: notifs, error } = await query;

    if (!error && notifs) {
      return NextResponse.json({ success: true, data: notifs });
    }

    return NextResponse.json({ success: true, data: fallbackNotifications });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: fallbackNotifications });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, type, title, message, worker_id, metadata } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'Title and message are required' }, { status: 400 });
    }

    const newNotif = {
      id: 'notif-' + Date.now(),
      order_id: order_id || null,
      type: type || 'system',
      title,
      message,
      read: false,
      created_at: new Date().toISOString(),
      worker_id: worker_id || null,
      metadata: metadata || {}
    };

    try {
      const { data, error } = await supabaseServer
        .from('notifications')
        .insert([newNotif])
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, data });
      }
    } catch (e) {
      console.warn("DB insert fallback to in-memory notifications list");
    }

    fallbackNotifications.unshift(newNotif);
    return NextResponse.json({ success: true, data: newNotif });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, readAll, worker_id } = body;

    if (readAll) {
      try {
        let query = supabaseServer.from('notifications').update({ read: true });
        if (worker_id) {
          query = query.or(`worker_id.eq.${worker_id},worker_id.is.null`);
        } else {
          query = query.is('worker_id', null);
        }
        await query;
      } catch (e) {
        console.warn("DB readAll fallback");
      }

      fallbackNotifications = fallbackNotifications.map(n => ({ ...n, read: true }));
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Notification ID is required' }, { status: 400 });
    }

    try {
      await supabaseServer.from('notifications').update({ read: true }).eq('id', id);
    } catch (e) {
      console.warn("DB update read status fallback");
    }

    fallbackNotifications = fallbackNotifications.map(n => n.id === id ? { ...n, read: true } : n);
    return NextResponse.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (clearAll) {
      try {
        await supabaseServer.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (e) {
        console.warn("DB clearAll fallback");
      }
      fallbackNotifications = [];
      return NextResponse.json({ success: true, message: 'All notifications cleared' });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Notification ID is required' }, { status: 400 });
    }

    try {
      await supabaseServer.from('notifications').delete().eq('id', id);
    } catch (e) {
      console.warn("DB delete fallback");
    }

    fallbackNotifications = fallbackNotifications.filter(n => n.id !== id);
    return NextResponse.json({ success: true, message: 'Notification deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
