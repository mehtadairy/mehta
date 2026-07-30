const http = require('http');

function checkPort(port, host) {
  return new Promise((resolve) => {
    const req = http.request({
      host: host,
      port: port,
      method: 'GET',
      path: '/api/admin/data',
      timeout: 1000
    }, (res) => {
      resolve({ port, host, active: true, status: res.statusCode });
    });
    
    req.on('error', () => {
      resolve({ port, host, active: false });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ port, host, active: false, timeout: true });
    });
    
    req.end();
  });
}

async function scan() {
  const hosts = ['localhost', '::1', '127.0.0.1'];
  console.log("Scanning ports 3000 to 3010 for API...");
  for (let p = 3000; p <= 3010; p++) {
    for (const h of hosts) {
      const res = await checkPort(p, h);
      if (res.active) {
        console.log(`Port ${p} on ${h} is ACTIVE! Status: ${res.status}`);
      }
    }
  }
  console.log("Scan complete.");
}

scan();
