const fs = require('fs');
const path = require('path');

console.log('=== Env File Diagnostic ===');
const files = ['.env', '.env.local', '.env.production', '.env.development'];
files.forEach(f => {
  const p = path.join(__dirname, '..', f);
  console.log(`File ${f} exists:`, fs.existsSync(p));
});

console.log('\n=== Env Keys Presence ===');
const keys = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET'
];
keys.forEach(k => {
  console.log(`Key ${k} present:`, !!process.env[k]);
});
