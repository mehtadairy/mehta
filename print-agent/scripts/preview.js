const fs = require('fs');
const path = require('path');
const ReceiptBuilder = require('../services/ReceiptBuilder');

// Load sample order data
const sampleOrderPath = path.join(__dirname, '..', 'sample_order.json');
let payload;
try {
  payload = JSON.parse(fs.readFileSync(sampleOrderPath, 'utf-8'));
} catch (e) {
  console.error("Failed to read sample_order.json", e);
  process.exit(1);
}

// Ensure printType is passed as argument, default to billing
const printType = process.argv[2] || 'billing';
payload.printType = printType;

console.log(`[Preview] Generating ${printType.toUpperCase()} receipt preview...`);

const config = require('../utils/config');

// We must make sure paperWidth is injected into the payload since it's used dynamically now
payload.paperWidth = config.PAPER_WIDTH || '58mm';

ReceiptBuilder.buildCustomerReceipt(payload)
  .then(() => {
    console.log(`[Preview] Success! Opening browser...`);
  })
  .catch(err => {
    console.error(`[Preview] Error:`, err);
  });
