const Formatter = require('../utils/formatter');

module.exports = {
  render: (printer, payload, is58mm, resolve, reject) => {
    const { timeStr } = Formatter.getFormattedDateTime(payload.date);
    const shopName = payload.shopName || 'MEHTA SWEET MART';

    printer
      .align('ct')
      .size(1, 1)
      .style('b')
      .text(Formatter.drawCentered(shopName, is58mm))
      .text(Formatter.drawBlankLine())
      .size(2, 2)
      .text(Formatter.drawCentered('KITCHEN COPY', is58mm))
      .size(1, 1)
      .style('normal')
      .text(Formatter.drawBlankLine())
      .align('lt')
      .text(Formatter.drawKeyValue('Order ID', payload.orderNumber || payload.orderId?.slice(0, 8), is58mm))
      .text(Formatter.drawKeyValue('Time', timeStr, is58mm))
      .text(Formatter.drawDivider(is58mm))
      .style('b')
      .size(2, 2); // Make items large for the kitchen

    (payload.items || []).forEach(item => {
      // For double size, the line is effectively halved
      const effectiveWidth = is58mm ? 16 : 24;
      const qty = `${item.qty}x`;
      const name = item.name;
      // Simple layout: "2x Item Name"
      const str = `${qty} ${name}`;
      if (str.length > effectiveWidth) {
        printer.text(str.substring(0, effectiveWidth - 2) + "..");
      } else {
        printer.text(str);
      }
    });

    printer
      .size(1, 1)
      .style('normal')
      .text(Formatter.drawDivider(is58mm));

    if (payload.specialInstructions) {
      printer
        .style('b')
        .text('INSTRUCTIONS:')
        .style('normal');
      
      const wrapped = Formatter.drawWrappedText(payload.specialInstructions, is58mm);
      wrapped.forEach(line => printer.text(line));
      printer.text(Formatter.drawDivider(is58mm));
    }

    printer
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
