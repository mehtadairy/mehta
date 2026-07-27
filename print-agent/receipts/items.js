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
      printer.text(Formatter.drawTableRow(item.name, item.qty, item.price, is58mm, item.weight));
    });

    printer.text(Formatter.drawDivider(is58mm));
  }
};
