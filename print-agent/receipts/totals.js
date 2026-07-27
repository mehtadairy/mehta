const Formatter = require('../utils/formatter');

module.exports = {
  render: (printer, payload, is58mm) => {
    const subtotal = payload.subtotal || 0;
    const deliveryVal = payload.deliveryCharge || 0;
    const discountVal = payload.discount || 0;

    printer.text(Formatter.drawKeyValue('Subtotal', Formatter.formatCurrency(subtotal), is58mm));
    
    if (deliveryVal === 0) {
      printer.text(Formatter.drawKeyValue('Delivery', 'FREE', is58mm));
    } else {
      printer.text(Formatter.drawKeyValue('Delivery', Formatter.formatCurrency(deliveryVal), is58mm));
    }

    if (discountVal > 0) {
      printer.text(Formatter.drawKeyValue('Discount', Formatter.formatCurrency(discountVal), is58mm));
    }

    printer.text(Formatter.drawKeyValue('Payment', (payload.paymentStatus || 'Pending'), is58mm));

    printer
      .text(Formatter.drawDivider(is58mm))
      .style('b')
      .size(1, 1)
      .text(Formatter.drawKeyValue('TOTAL', Formatter.formatCurrency(payload.total || 0), is58mm))
      .style('b')
      .text(Formatter.drawDivider(is58mm));
  }
};
