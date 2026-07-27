const Formatter = require('../utils/formatter');

module.exports = {
  render: (printer, payload, is58mm) => {
    const shopName = payload.shopName || 'MEHTA SWEET MART';
    const shopSubtitle = payload.shopSubtitle || 'Fresh Sweets & Snacks';

    printer
      .align('ct')
      .font('a')
      .style('b')
      .size(1, 1)
      .text(shopName)
      .size(1, 1)
      .text(shopSubtitle)
      .text('TAX INVOICE')
      .text(Formatter.drawDivider(is58mm));

    printer.align('lt');
    
    // Address and contact info should just be printed left aligned
    const lines = [];
    if (payload.shopPhone) lines.push(`Tel: ${payload.shopPhone}`);
    if (payload.shopEmail) lines.push(`Email: ${payload.shopEmail}`);
    if (payload.shopGST) lines.push(`GST No: ${payload.shopGST}`);
    if (payload.shopFSSAI) lines.push(`FSSAI: ${payload.shopFSSAI}`);
    lines.forEach(line => {
      printer.text(line);
      printer.text('');
    });
  }
};
