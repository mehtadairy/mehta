const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class PreviewWrapper {
  constructor(realPrinter, type, is58mm) {
    this.printer = realPrinter;
    this.type = type;
    this.is58mm = is58mm;
    
    this.lines = [];
    this.htmlLines = [];
    this.currentAlign = 'lt';
    this.currentSize = [1, 1];
    this.currentStyle = 'normal';
    this.width = is58mm ? 32 : 48;
  }

  align(alignment) {
    this.currentAlign = alignment;
    if (this.printer && typeof this.printer.align === 'function') this.printer.align(alignment);
    return this;
  }

  hardware(hw) {
    if (this.printer && typeof this.printer.hardware === 'function') this.printer.hardware(hw);
    return this;
  }

  size(w, h) {
    this.currentSize = [w, h];
    if (this.printer) this.printer.size(w, h);
    return this;
  }

  style(type) {
    this.currentStyle = type;
    if (this.printer) this.printer.style(type);
    return this;
  }

  font(type) {
    if (this.printer && typeof this.printer.font === 'function') this.printer.font(type);
    return this;
  }

  text(str) {
    // Process string into lines safely (some strings have newlines)
    const textLines = str.split('\n');
    
    textLines.forEach(line => {
      let paddedLine = line;
      let charWidth = this.currentSize[0] || 1;
      let virtualLen = paddedLine.length * charWidth;

      if (virtualLen < this.width) {
        if (this.currentAlign === 'ct') {
          // Calculate how many virtual columns we need to pad on the left
          let leftVirtualCols = Math.floor((this.width - virtualLen) / 2);
          // Convert virtual columns into physical space characters based on charWidth
          let spacesNeeded = Math.floor(leftVirtualCols / charWidth);
          paddedLine = ' '.repeat(spacesNeeded) + paddedLine;
        } else if (this.currentAlign === 'rt') {
          let leftVirtualCols = this.width - virtualLen;
          let spacesNeeded = Math.floor(leftVirtualCols / charWidth);
          paddedLine = ' '.repeat(spacesNeeded) + paddedLine;
        }
      }

      this.lines.push(paddedLine);
      
      // Compute HTML representation
      let htmlStr = paddedLine;
      // Convert spaces to &nbsp; for precise monospace rendering in HTML
      htmlStr = htmlStr.replace(/ /g, '&nbsp;');
      
      let cssStyles = [];
      // STRICTLY LEFT ALIGN HTML (We did the centering manually with spaces!)
      cssStyles.push('text-align: left;');
      if (this.currentStyle === 'b' || this.currentStyle === 'B') cssStyles.push('font-weight: bold;');
      if (this.currentSize[0] > 1 || this.currentSize[1] > 1) {
        // Use font-size to scale so it properly pushes down the next line in the DOM
        cssStyles.push('font-size: 2em; line-height: 1;');
      }
      
      this.htmlLines.push(`<div style="width: 100%;"><div style="${cssStyles.join(' ')}">${htmlStr}</div></div>`);
    });

    if (this.printer) this.printer.text(str);
    return this;
  }

  qrimage(data, options, callback) {
    this.lines.push(`[ QR CODE GRAPHIC ]`);
    
    // A nice mock SVG to simulate the printed QR
    const qrSvg = `<svg width="80" height="80" viewBox="0 0 100 100" style="margin: 10px auto; display: block;">
      <rect width="100" height="100" fill="#fff" stroke="#000" stroke-width="2"/>
      <rect x="10" y="10" width="20" height="20" fill="#000"/>
      <rect x="70" y="10" width="20" height="20" fill="#000"/>
      <rect x="10" y="70" width="20" height="20" fill="#000"/>
      <rect x="40" y="40" width="20" height="20" fill="#000"/>
      <rect x="40" y="10" width="10" height="10" fill="#000"/>
      <rect x="70" y="70" width="10" height="10" fill="#000"/>
    </svg>`;
    
    this.htmlLines.push(`<div style="text-align: center;">${qrSvg}</div>`);
    if (this.printer && typeof this.printer.qrimage === 'function') this.printer.qrimage(data, options, callback);
    else if (callback) callback(null);
    return this;
  }

  qrcode(data) {
    this.lines.push(`[ NATIVE HW QR CODE: ${data} ]`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
    this.htmlLines.push(`<div style="text-align: center; margin: 15px 0;"><img src="${qrUrl}" width="120" height="120" alt="QR Code" /></div>`);
    if (this.printer && typeof this.printer.qrcode === 'function') this.printer.qrcode(data);
    return this;
  }

  cut() {
    if (this.printer) this.printer.cut();
    return this;
  }

  close(callback) {
    this._generatePreviewFiles();
    if (this.printer) this.printer.close(callback);
    else if (callback) callback(null);
    return this;
  }

  _generatePreviewFiles() {
    const previewDir = path.join(__dirname, '..', 'previews');
    if (!fs.existsSync(previewDir)) {
      fs.mkdirSync(previewDir, { recursive: true });
    }

    const txtPath = path.join(previewDir, `preview_${this.type}.txt`);
    const htmlPath = path.join(previewDir, `preview_${this.type}.html`);

    const txtContent = this.lines.join('\n');
    
    // Calculate precise width in px based on char count
    const pixelWidth = this.is58mm ? '320px' : '450px';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt Preview - ${this.type.toUpperCase()}</title>
  <style>
    body {
      background: #e5e5e5;
      display: flex;
      justify-content: center;
      padding: 40px;
      font-family: sans-serif;
    }
    .receipt {
      background: #fff;
      color: #000;
      width: ${pixelWidth};
      padding: 20px 18px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 14px;
      line-height: 1.2;
      white-space: pre-wrap;
      overflow: hidden;
    }
    .header { text-align: center; margin-bottom: 20px; font-weight: bold; color: #64748b; font-family: sans-serif; }
  </style>
</head>
<body>
  <div>
    <div class="header">PREVIEW MODE: ${this.is58mm ? '58mm' : '80mm'} | ${this.type.toUpperCase()}</div>
    <div class="receipt">
      ${this.htmlLines.join('\n')}
    </div>
  </div>
</body>
</html>`;

    fs.writeFileSync(txtPath, txtContent);
    fs.writeFileSync(htmlPath, htmlContent);

    console.log(`[Preview] Generated preview_${this.type}.txt and preview_${this.type}.html`);

    // Auto-open in browser only if we are actively running preview script (no real printer)
    if (!this.printer) {
      let openCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
      exec(`${openCmd} "${htmlPath}"`);
    }
  }
}

module.exports = PreviewWrapper;
