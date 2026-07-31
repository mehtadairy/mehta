// Fallback to simple HMAC validation using Web Crypto API if jose is not available.
// Since we cannot run npm install to get jose due to environment restrictions, we'll build a custom JWT-like signed cookie utility using native Web Crypto.

const SECRET_KEY = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET env variable is required in production!'); })() : 'mehta-dairy-super-secret-key-change-in-prod');

// Helper to get CryptoKey
async function getCryptoKey() {
  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(SECRET_KEY.padEnd(32, '0').slice(0, 32));
  return await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// Convert ArrayBuffer to Hex String
function bufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex String to ArrayBuffer
function hexToBuffer(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

export async function signSession(payload: any): Promise<string> {
  const encoder = new TextEncoder();
  const dataString = JSON.stringify({ ...payload, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 }); // 30 days expiry
  const dataBuffer = encoder.encode(dataString);
  
  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, dataBuffer);
  
  const dataHex = bufferToHex(dataBuffer);
  const signatureHex = bufferToHex(signatureBuffer);
  
  return `${dataHex}.${signatureHex}`;
}

export async function verifySession(token: string): Promise<any | null> {
  try {
    if (!token || !token.includes('.')) return null;
    
    const [dataHex, signatureHex] = token.split('.');
    
    const key = await getCryptoKey();
    const dataBuffer = hexToBuffer(dataHex);
    const signatureBuffer = hexToBuffer(signatureHex);
    
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBuffer, dataBuffer);
    
    if (!isValid) return null;
    
    const decoder = new TextDecoder();
    const dataString = decoder.decode(dataBuffer);
    const payload = JSON.parse(dataString);
    
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    
    return payload;
  } catch (error) {
    console.error("Session verification failed:", error);
    return null;
  }
}

export function getCustomerJWTSecret(): Uint8Array {
  const secretStr = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretStr) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY env variable is required in production!');
    }
    return new TextEncoder().encode('fallback_secret_do_not_use_in_prod');
  }
  return new TextEncoder().encode(secretStr);
}

export function getCustomerCookieOptions(host: string | null) {
  const domainHost = host || "";
  const isLocalhost = domainHost.includes('localhost') || domainHost.includes('127.0.0.1') || domainHost.includes('192.168.');
  
  const options: any = {
    httpOnly: true,
    secure: !isLocalhost,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  };
  
  if (!isLocalhost && domainHost.includes('mehtadairy.com')) {
    options.domain = '.mehtadairy.com';
  }
  
  return options;
}

export async function verifyCustomerSession(token: string): Promise<any | null> {
  try {
    const { jwtVerify } = await import('jose');
    const JWT_SECRET = getCustomerJWTSecret();
    console.log("[AUTH-DEBUG] verifyCustomerSession - Verifying token with secret...");
    const { payload } = await jwtVerify(token, JWT_SECRET);
    console.log("[AUTH-DEBUG] verifyCustomerSession - Verification success. Payload:", payload);
    return payload;
  } catch (error: any) {
    console.error("[AUTH-DEBUG] verifyCustomerSession - JWT verification failed:", error.message || error);
    return null;
  }
}

export async function getVerifiedCustomerSession(request?: Request): Promise<any | null> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('mehta_customer_token')?.value;

    if (token) {
      const payload = await verifyCustomerSession(token);
      if (payload?.id) return payload;
    }

    if (request) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const authToken = authHeader.replace('Bearer ', '');
        const payload = await verifyCustomerSession(authToken);
        if (payload?.id) return payload;

        const { supabaseServer: supabase } = await import('@/lib/supabaseServer');
        const { data } = await supabase.auth.getUser(authToken);
        if (data?.user) {
          const { data: customer } = await supabase
            .from('customers')
            .select('id, name, phone, email')
            .or(`id.eq.${data.user.id},auth_user_id.eq.${data.user.id}`)
            .maybeSingle();
          
          if (customer) {
            return { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email };
          }
          return { id: data.user.id, email: data.user.email };
        }
      }
    }

    const { supabaseServer: supabase } = await import('@/lib/supabaseServer');
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      const { data: customer } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .or(`id.eq.${data.user.id},auth_user_id.eq.${data.user.id}`)
        .maybeSingle();
      
      if (customer) {
        return { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email };
      }
      return { id: data.user.id, email: data.user.email };
    }

    return null;
  } catch (error) {
    console.error("Error in getVerifiedCustomerSession:", error);
    return null;
  }
}
