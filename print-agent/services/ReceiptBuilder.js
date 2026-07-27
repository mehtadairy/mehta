const header = require('../receipts/header');
const customer = require('../receipts/customer');
const address = require('../receipts/address');
const items = require('../receipts/items');
const totals = require('../receipts/totals');
const qr = require('../receipts/qr');
const footer = require('../receipts/footer');
const kitchen = require('../receipts/kitchen');
const packing = require('../receipts/packing');
const PreviewWrapper = require('../utils/PreviewWrapper');
const EscPosBuilder = require('./EscPosBuilder');

const ReceiptBuilder = {
  buildCustomerReceipt: (payload) => {
    return new Promise((resolve, reject) => {
      try {
        const type = payload.printType || 'billing';
        const receipt = new EscPosBuilder();
        const printer = receipt.instance;
        
        // Dynamically set based on the payload (which comes from printer_settings in the DB)
        const is58mm = payload.paperWidth === '58mm'; 

        // Extract weights embedded in item names (e.g., "Kaju Katli (500g)" -> name: "Kaju Katli", weight: "500g")
        if (payload.items && Array.isArray(payload.items)) {
          payload.items = payload.items.map(item => {
            let name = item.name || '';
            let weight = item.weight;
            if (!weight) {
              const match = name.match(/\s*\(([\d.]+\s*(?:g|kg|ml|l|pcs|pc))\)/i);
              if (match) {
                weight = match[1];
                name = name.replace(match[0], '').trim();
              }
            }
            return { ...item, name, weight };
          });
        }

        // ---------------------------------------------------------
        // Core Hardware Initialization (Ensures clean state per job)
        // ---------------------------------------------------------
        printer
          .hardware('init')
          .font('a')
          .align('lt')
          .style('b') // Set default to bold instead of normal
          .size(1, 1)
          .lineSpace(0);

        // Force Double-Strike mode (ESC G 1) for extra dark printing
        if (printer.buffer && typeof printer.buffer.write === 'function') {
          printer.buffer.write(Buffer.from([0x1b, 0x47, 0x01]));
        }

        const wrappedPrinter = new PreviewWrapper(printer, type, is58mm);
        
        // Custom resolve intercepts when the final receipt module (footer) is done,
        // and returns the accumulated binary buffer to PrinterManager.
        const customResolve = () => {
          resolve(receipt.build());
        };

        if (type === 'kitchen') {
          kitchen.render(wrappedPrinter, payload, is58mm, customResolve, reject);
        } else if (type === 'packing') {
          packing.render(wrappedPrinter, payload, is58mm, customResolve, reject);
        } else {
          // Billing Pipeline
          header.render(wrappedPrinter, payload, is58mm);
          customer.render(wrappedPrinter, payload, is58mm);
          address.render(wrappedPrinter, payload, is58mm);
          items.render(wrappedPrinter, payload, is58mm);
          totals.render(wrappedPrinter, payload, is58mm);
          qr.render(wrappedPrinter, payload, is58mm, customResolve, reject);
        }
      } catch (err) {
        reject(err);
      }
    });
  }
};

module.exports = ReceiptBuilder;
