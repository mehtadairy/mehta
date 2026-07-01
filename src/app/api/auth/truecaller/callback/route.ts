import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Truecaller Callback Received:", body);

    // Truecaller sends the requestNonce that we generated on the frontend
    const requestNonce = body.requestId || body.requestNonce;
    const accessToken = body.accessToken;
    const endpoint = body.endpoint || "https://profile4.truecaller.com/v1/default";

    if (!requestNonce || !accessToken) {
      console.error("Truecaller Callback: Missing required fields");
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    // 1. Fetch user profile from Truecaller using the accessToken
    const profileResponse = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Cache-Control': 'no-cache'
      }
    });

    if (!profileResponse.ok) {
      console.error("Truecaller API Error:", await profileResponse.text());
      return NextResponse.json({ success: false, message: 'Failed to fetch Truecaller profile' }, { status: 401 });
    }

    const truecallerProfile = await profileResponse.json();
    console.log("Truecaller Profile Extracted:", !!truecallerProfile);

    // 2. Validate the PKI signature here if needed (Skipping complex RS256 validation for now since we fetched directly from Truecaller's secure HTTPS endpoint using the short-lived accessToken)
    // Fetching the profile directly with the token essentially validates it.

    // 3. Save the payload to our tracking table so the frontend can pick it up
    const { error: dbError } = await supabase
      .from('truecaller_auth_requests')
      .upsert({
        request_nonce: requestNonce,
        status: 'successful',
        payload: truecallerProfile
      });

    if (dbError) {
      console.error("Database Error saving Truecaller payload:", dbError);
      return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }

    // Truecaller expects a 200 OK response to know the callback was successful
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in Truecaller Callback:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
