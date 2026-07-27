const Formatter = require('../utils/formatter');

module.exports = {
  render: (printer, payload, is58mm) => {
    const orderDate = payload.date
      ? new Date(payload.date)
      : new Date();

    const dateStr = orderDate.toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: '2-digit'});
    const timeStr = orderDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const orderStr = `Order ID: ${payload.orderNumber || 'N/A'}`;
    const datePart = `Date: ${dateStr} ${timeStr}`;
    const custStr = `Customer: ${payload.customerName || 'Guest'}`;
    const phStr = `Ph: ${payload.customerPhone || 'N/A'}`;

    printer
      .text(Formatter.drawDivider(is58mm))
      .align('lt')
      .style('b')
      .text(Formatter.drawKeyValue(orderStr, datePart, is58mm))
      .text(Formatter.drawKeyValue(custStr, phStr, is58mm));
  }
};
