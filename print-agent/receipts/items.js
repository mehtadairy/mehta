const Formatter = require('../utils/formatter');

module.exports = {
  render: (printer, payload, is58mm) => {
    printer
      .text(Formatter.drawDivider(is58mm))
      .align('lt')
      .style('b')
      .text(Formatter.drawTableHeader(is58mm))
      .text(Formatter.drawDivider(is58mm));

    (payload.items || []).forEach(item => {
      const qty = Number(item.qty || item.quantity) || 1;
      const unitPrice = Number(item.price) || 0;
      const lineTotal = (item.line_total !== undefined && item.line_total !== null)
        ? Number(item.line_total)
        : (unitPrice * qty);
      printer.text(Formatter.drawTableRow(item.name, qty, lineTotal, is58mm, item.weight));
    });

    printer.text(Formatter.drawDivider(is58mm));
  }
};
