const escpos = require('escpos');

class MemoryDevice {
  constructor() {
    this.buffer = Buffer.alloc(0);
  }
  
  write(data, callback) {
    this.buffer = Buffer.concat([this.buffer, data]);
    if (callback) callback();
    return this;
  }
  
  open(callback) {
    if (callback) callback();
  }
  
  close(callback) {
    if (callback) callback();
  }
}

class EscPosBuilder {
  constructor() {
    this.device = new MemoryDevice();
    this.printer = new escpos.Printer(this.device);
  }

  // Expose the escpos Printer interface directly so existing receipt modules work unchanged
  get instance() {
    return this.printer;
  }

  // Retrieve the final accumulated binary buffer
  build() {
    return this.device.buffer;
  }
}

module.exports = EscPosBuilder;
