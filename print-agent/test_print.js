const { printerMap } = require('./utils/config');
const PrinterManager = require('./services/PrinterManager');
const EscPosBuilder = require('./services/EscPosBuilder');

console.log("Starting minimal printer test...");

const receipt = new EscPosBuilder();
const printer = receipt.instance;

printer
  .hardware('init')
  .font('a')
  .style('normal')
  .size(1, 1)
  .align('lt')
  .lineSpace(0);

printer.align('ct').style('b').size(1,1).text('MEHTA SWEET MART');
printer.text('');
printer.align('lt').style('normal').text('Hello World');
printer.text('');
printer.text('123456789012345678901234567890123456789012345678');
printer.text('');
printer.text('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
printer.text('');

printer.cut();
printer.close();

const buffer = receipt.build();

PrinterManager.printJob('billing', buffer)
  .then(() => {
    console.log("Test print successful!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test print failed:", err);
    process.exit(1);
  });
