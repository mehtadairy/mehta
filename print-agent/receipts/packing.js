const Formatter = require('../utils/formatter');

module.exports = {
  render: (printer, payload, is58mm, resolve, reject) => {
    const { timeStr, dateStr } = Formatter.getFormattedDateTime(payload.date);

      printer
      .align('ct')
      .size(2, 2)
      .style('b')
      .text(Formatter.drawCentered('PACKING COPY', is58mm))
      .size(1, 1)
      .style('b') // Enforce bold for the rest of the receipt to make it dark
      .text(Formatter.drawBlankLine());
      
      const custName = payload.shippingName || payload.customerName || 'Guest';
      const custPhone = payload.shippingPhone || payload.customerPhone || 'N/A';
      
      printer
        .align('lt')
        .style('b')
        .text(`ORDER ID: ${payload.orderNumber || String(payload.orderId || '').substring(0, 8) || 'N/A'}`)
        .text(`Order Date: ${dateStr}`)
        .text(`Order Time: ${timeStr}`)
        .text(`Name: ${custName}`)
        .text(`Mobile: ${custPhone}`)
        .text(Formatter.drawDivider(is58mm));

      const addressLines = Formatter.drawAddress(payload.shippingAddress, is58mm);
      addressLines.forEach(line => printer.text(line));

      printer
        .text(Formatter.drawDivider(is58mm))
        .text(Formatter.drawPackingRow("ITEM", "QTY", is58mm))
        .text(Formatter.drawDivider(is58mm));

      (payload.items || []).forEach(item => {
        printer.text(Formatter.drawPackingRow(item.name, item.qty, is58mm, item.weight));
      });

    printer
      .text(Formatter.drawDivider(is58mm))
      .align('ct')
      .text('Double check all items before dispatch.')
      .cut()
      .close((closeErr) => {
        if (closeErr) {
          if (reject) reject(closeErr);
        } else {
          if (resolve) resolve();
        }
      });
  }
};
