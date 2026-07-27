const Formatter = require('../utils/formatter');
const footer = require('./footer');

module.exports = {
  render: (printer, payload, is58mm, resolve, reject) => {
    // QR code removed as per user request
    footer.render(printer, payload, is58mm, resolve, reject);
  }
};
