const net = require('net');
const fs = require('fs');
const path = require('path');

const IP = '192.168.1.101';
const COMMON_PORTS = [9100, 5000, 5001, 10001, 8000, 8080, 80, 60312];

console.log(`\n🔍 Scanning Posiflex Printer at ${IP} for the correct RAW port...`);
console.log(`(This will only take a few seconds)\n`);

let found = false;
let pending = COMMON_PORTS.length;

COMMON_PORTS.forEach(port => {
  const socket = new net.Socket();
  socket.setTimeout(2000);

  socket.on('connect', () => {
    if (!found) {
      found = true;
      console.log(`✅ SUCCESS! Found open printer port: ${port}`);
      
      // Update the .env file automatically
      const envPath = path.join(__dirname, '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(/PRINTER_BILLING=.*/, `PRINTER_BILLING=${IP}:${port}`);
        fs.writeFileSync(envPath, envContent);
        console.log(`\n🎉 Automatically updated .env to: PRINTER_BILLING=${IP}:${port}`);
        console.log(`\n👉 You can now restart the Print Agent (Ctrl+C then npm start) and it will perfectly match the preview!`);
      }
    }
    socket.destroy();
    checkDone();
  });

  socket.on('timeout', () => {
    socket.destroy();
    checkDone();
  });

  socket.on('error', () => {
    socket.destroy();
    checkDone();
  });

  socket.connect(port, IP);
});

function checkDone() {
  pending--;
  if (pending === 0 && !found) {
    console.log(`❌ Could not find a standard print port on ${IP}.`);
    console.log(`Please check if the IP is correct by doing a Printer Self-Test.`);
  }
}
