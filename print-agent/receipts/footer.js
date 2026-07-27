const Formatter = require('../utils/formatter');

module.exports = {
  render: (printer, payload, is58mm, resolve, reject) => {
    const timeStr = payload.date ? new Date(payload.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';

    printer
      .align('ct')
      .style('b')
      .text('Thank You!')
      .text('')
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
