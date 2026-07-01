import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nonce = searchParams.get('nonce');

    if (!nonce) {
      return NextResponse.json({ success: false, error: 'Nonce is required' }, { status: 400 });
    }

    // 1. Check the tracking table
    const { data: requestRecord, error: dbError } = await supabase
      .from('truecaller_auth_requests')
      .select('*')
      .eq('request_nonce', nonce)
      .single();

    if (dbError) {
      if (dbError.code === '42P01') {
        console.error("Truecaller Table Missing! Please run the SQL script.", dbError);
        return NextResponse.json({ success: false, error: 'Truecaller tracking table missing in database.' }, { status: 500 });
      }
      if (dbError.code !== 'PGRST116') {
        console.error("Database error in Truecaller polling:", dbError);
      }
    }

    if (!requestRecord) {
      // It might just not have arrived yet (polling)
      return NextResponse.json({ success: true, status: 'pending' });
    }

    if (requestRecord.status === 'successful') {
      const payload = requestRecord.payload;
      if (!payload || !payload.phoneNumbers || payload.phoneNumbers.length === 0) {
        return NextResponse.json({ success: false, error: 'Invalid Truecaller payload' }, { status: 400 });
      }

      // Extract Truecaller data
      const phoneRaw = payload.phoneNumbers[0];
      // Clean phone number (Truecaller sends E164 format, e.g., +919999999999)
      const phone = phoneRaw.replace(/\D/g, '').slice(-10); // Keep last 10 digits to match existing system
      const firstName = payload.name?.first || '';
      const lastName = payload.name?.last || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const avatarUrl = payload.avatarUrl || null;
      const email = payload.email || null; // Truecaller sometimes provides email

      // 2. Sync Customer (similar to sync-customer logic)
      let { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single();

      if (!customer) {
        // Create new customer
        const { data: newCustomer, error: insertError } = await supabase
          .from('customers')
          .insert([{ 
            phone, 
            name: fullName,
            email: email,
            phone_verified: true, 
            auth_provider: 'truecaller',
            profile_image: avatarUrl
          }])
          .select()
          .single();

        if (insertError) {
          console.error("Supabase insert error for truecaller user:", insertError);
          return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
        }
        customer = newCustomer;
      } else {
        // Update existing customer
        const updates: any = { phone_verified: true, auth_provider: 'truecaller' };
        if (!customer.name && fullName) updates.name = fullName;
        if (!customer.email && email) updates.email = email;
        if (!customer.profile_image && avatarUrl) updates.profile_image = avatarUrl;
        
        await supabase.from('customers').update(updates).eq('id', customer.id);
        Object.assign(customer, updates);
      }

      // 3. Clean up the tracking record (optional, but good practice to prevent replay)
      await supabase.from('truecaller_auth_requests').delete().eq('request_nonce', nonce);

      // Return success to the frontend polling loop!
      return NextResponse.json({ 
        success: true, 
        status: 'successful',
        customer: {
          id: customer.id,
          phone: customer.phone,
          name: customer.name,
          email: customer.email,
          profile_image: customer.profile_image
        }
      });
    }

    return NextResponse.json({ success: true, status: requestRecord.status });

  } catch (error: any) {
    console.error('Error in Truecaller Status:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
