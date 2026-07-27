const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'Mehta Dairy Print Agent',
  description: 'Background ESC/POS Thermal Printing Service for Mehta Dairy',
  script: path.join(__dirname, 'index.js'),
  env: [{
    name: "NODE_ENV",
    value: "production" 
  }]
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function() {
  console.log("Service Installed Successfully!");
  svc.start();
  console.log("Service Started!");
});

console.log("Installing service...");
svc.install();
