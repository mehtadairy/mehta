const Formatter = require('../utils/formatter');

module.exports = {
  render: (printer, payload, is58mm) => {
    printer
      .align('lt')
      .style('b');

    if (payload.shippingName && payload.shippingName !== payload.customerName) {
      printer.text(Formatter.drawKeyValue('Ship To', payload.shippingName, is58mm));
    }
    
    if (payload.shippingPhone && payload.shippingPhone !== payload.customerPhone) {
      printer.text(Formatter.drawKeyValue('Alt Phone', payload.shippingPhone, is58mm));
    }

    const addressLines = Formatter.drawAddress(payload.shippingAddress, is58mm);
    addressLines.forEach(line => printer.text(line));
  }
};
