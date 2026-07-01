// Fallback to simple HMAC validation using Web Crypto API if jose is not available.
// Since we cannot run npm install to get jose due to environment restrictions, we'll build a custom JWT-like signed cookie utility using native Web Crypto.

const SECRET_KEY = process.env.JWT_SECRET || 'mehta-dairy-super-secret-key-change-in-prod';

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
  const dataString = JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 }); // 24 hours expiry
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
