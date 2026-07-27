const net = require('net');

const IP = '192.168.1.101';
const PORTS_TO_CHECK = [9100, 5000, 5001, 8000, 8080, 10001, 60312, 631];

console.log(`Deep scanning Posiflex printer at ${IP} for RAW printing ports...`);

PORTS_TO_CHECK.forEach(port => {
  const socket = new net.Socket();
  socket.setTimeout(3000);
  
  socket.on('connect', () => {
    console.log(`[SUCCESS] Port ${port} is OPEN!`);
    socket.destroy();
  });
  
  socket.on('timeout', () => {
    console.log(`[TIMEOUT] Port ${port}`);
    socket.destroy();
  });
  
  socket.on('error', (err) => {
    console.log(`[REFUSED] Port ${port}`);
  });
  
  socket.connect(port, IP);
});
