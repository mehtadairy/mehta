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

// Listen for the "install" event
svc.on('install', function() {
  console.log("\n✅ Service Installed Successfully from:");
  console.log("   " + __dirname);
  console.log("\nStarting service...");
  svc.start();
  console.log("🚀 Service Started!\n");
});

// Listen for the "alreadyinstalled" event
svc.on('alreadyinstalled', function() {
  console.log('\n⚠️ Service is already installed in the registry.');
  console.log('Uninstalling the old service so we can update the path...');
  svc.uninstall();
});

// Listen for the "uninstall" event
svc.on('uninstall', function() {
  console.log('\n🗑️ Old service uninstalled completely.');
  console.log('Re-installing with the new code from:');
  console.log("   " + __dirname + "...");
  
  // Wait a short moment to ensure Windows fully releases the service handle before reinstalling
  setTimeout(() => {
    svc.install();
  }, 3000);
});

console.log("\n=============================================");
console.log(" Mehta Dairy Print Agent - Service Installer");
console.log("=============================================\n");

// We check if it exists right away
if (svc.exists) {
  console.log("🔍 Existing Windows Service found.");
  console.log("   Initiating clean reinstall...");
  svc.uninstall();
} else {
  console.log("🔍 No existing service found.");
  console.log("   Installing new service...");
  svc.install();
}
