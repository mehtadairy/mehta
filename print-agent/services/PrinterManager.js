const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const escpos = require('escpos');
escpos.Network = require('escpos-network');
const Logger = require('./Logger');
const config = require('../utils/config');

const psScriptPath = path.join(__dirname, '..', 'print_gdi.ps1');

const PrinterManager = {
  printJob: (targetPrinter, binaryBuffer, payload = {}) => {
    return new Promise((resolve, reject) => {
      try {
        const printerConfig = config.printerMap[targetPrinter];
        const copies = payload.isReprint ? 1 : config.PRINT_COPIES;

        if (!printerConfig) {
          return reject(new Error(`Printer config for '${targetPrinter}' is empty`));
        }

        if (printerConfig.includes(':')) {
          // Network Pipeline
          Logger.info(`[Printer] Transmitting to Network Printer: ${printerConfig} (Copies: ${copies})`);
          
          let copyCount = 0;
          const printOneCopy = () => {
            const [host, portStr] = printerConfig.split(':');
            const port = parseInt(portStr, 10);
            
            const device = new escpos.Network(host, port);
            const printer = new escpos.Printer(device);
            
            device.open((error) => {
              if (error) {
                Logger.error(`[NetworkPrint Error] Connection failed on copy ${copyCount + 1}:`, error.message);
                return reject(error);
              }
              printer.raw(binaryBuffer, (err) => {
                if (err) {
                  Logger.error(`[NetworkPrint Error] Transmission failed on copy ${copyCount + 1}:`, err.message);
                  return reject(err);
                }
                printer.close();
                
                copyCount++;
                if (copyCount < copies) {
                  setTimeout(printOneCopy, 1000);
                } else {
                  Logger.info(`[NetworkPrint] Spool successful for all ${copies} copies.`);
                  resolve();
                }
              });
            });
          };
          printOneCopy();
          
        } else {
          // Windows Spooler Pipeline - GDI Monospace Printing with QR Code
          Logger.info(`[Printer] Transmitting GDI Print Job to Windows Printer: ${printerConfig} (Copies: ${copies})`);
          
          const gdiPs1 = path.join(__dirname, '..', 'print_gdi.ps1');
          const txtPreviewPath = path.join(__dirname, '..', 'previews', `preview_${targetPrinter}.txt`);
          
          if (!fs.existsSync(txtPreviewPath)) {
            return reject(new Error(`Preview text file not found for GDI printing: ${txtPreviewPath}`));
          }
          // QR Data has been disabled as per user request
          const qrData = '';
          const cmd = `powershell -ExecutionPolicy Bypass -File "${gdiPs1}" -printerName "${printerConfig}" -filePath "${txtPreviewPath}" -qrData "${qrData}"`;
          
          let copyCount = 0;
          const printOneCopy = () => {
            exec(cmd, (err, stdout, stderr) => {
              if (err) {
                Logger.error(`[LocalPrint Error] Print failed on copy ${copyCount + 1}:`, stderr || err.message);
                return reject(err);
              } else {
                copyCount++;
                if (copyCount < copies) {
                  printOneCopy();
                } else {
                  Logger.info(`[LocalPrint] GDI spool successful for all ${copies} copies.`);
                  setTimeout(resolve, 2000); // 2-second delay to prevent printer buffer overflow
                }
              }
            });
          };
          printOneCopy();
        }
      } catch (err) {
        Logger.error('[PrinterManager] Critical error during printing:', err);
        reject(err);
      }
    });
  }
};

module.exports = PrinterManager;
