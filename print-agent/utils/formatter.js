const Formatter = {
  // Return to the original 48 column format for 80mm
  getLineLength: (is58mm) => is58mm ? 32 : 48,

  // Dividers
  drawDivider: (is58mm) => '-'.repeat(Formatter.getLineLength(is58mm)),
  drawDoubleDivider: (is58mm) => '='.repeat(Formatter.getLineLength(is58mm)),
  drawFancyDivider: (is58mm) => Formatter.drawCentered('--- * ---', is58mm),
  drawBlankLine: () => '',

  // drawCentered simply returns text for hardware centering
  drawCentered: (text, is58mm, scale = 1) => {
    return (text || '').toString();
  },

  drawWrappedText: (text, is58mm) => {
    if (!text) return [];
    const width = Formatter.getLineLength(is58mm);
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + word).length > width) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    });
    if (currentLine) lines.push(currentLine.trim());
    return lines;
  },

  // Format two pairs on one line: "Key1: Val1       Key2: Val2"
  drawSideBySide: (str1, str2, is58mm) => {
    const width = Formatter.getLineLength(is58mm);
    if (str1.length + str2.length >= width) {
      return str1 + '\n' + str2;
    }
    const spaces = width - str1.length - str2.length;
    return str1 + ' '.repeat(spaces) + str2;
  },

  drawKeyValue: (key, value, is58mm) => {
    const width = Formatter.getLineLength(is58mm);
    const valStr = (value || '').toString();
    if (key.length + valStr.length > width) {
      return key + "\n" + valStr;
    }
    const spaceCount = width - key.length - valStr.length;
    if (spaceCount <= 0) return key + " " + valStr;
    return key + " ".repeat(spaceCount) + valStr;
  },

  drawAlignedKeyVal: (key, value, keyWidth) => {
    const valStr = (value || '').toString();
    return key.padEnd(keyWidth).substring(0, keyWidth) + ' : ' + valStr;
  },

  formatCurrency: (amount) => {
    return `Rs. ${Number(amount).toFixed(2)}`;
  },

  drawAddress: (address, is58mm) => {
    if (!address) return ['Address: N/A'];

    const width = Formatter.getLineLength(is58mm) - 2;
    const words = address.replace(/\s+/g, ' ').trim().split(' ');
    const lines = ['Address:'];

    let current = '';

    for (const word of words) {
      if ((current + ' ' + word).trim().length > width) {
        lines.push(current.trim());
        current = word;
      } else {
        current += ' ' + word;
      }
    }

    if (current.trim()) {
      lines.push(current.trim());
    }

    return lines;
  },

  drawTableHeader: (is58mm) => {
    const col1Width = is58mm ? 14 : 24;
    const col2Width = 8;
    const col3Width = is58mm ? 10 : 16;
    
    const qtyHeader = 'QTY'; 
    let leftP = Math.floor((col2Width - qtyHeader.length) / 2);
    let rightP = col2Width - qtyHeader.length - leftP;
    const qtyCentered = ' '.repeat(Math.max(0, leftP)) + qtyHeader.substring(0, col2Width) + ' '.repeat(Math.max(0, rightP));

    return "ITEM".padEnd(col1Width).substring(0, col1Width) + qtyCentered + "AMT".padStart(col3Width).substring(0, col3Width);
  },

  drawTableRow: (name, qty, amt, is58mm, weight = null) => {
    const col1Width = is58mm ? 14 : 24;
    const col2Width = 8;
    const col3Width = is58mm ? 10 : 16;

    let qtyStr = String(qty);
    if (weight) {
      if (Number(qty) > 1) {
        qtyStr = `${weight}x${qty}`;
      } else {
        qtyStr = `${weight}`;
      }
    }
    qtyStr = qtyStr.substring(0, col2Width);
    
    let amtStr;
    if (isNaN(Number(amt)) || amt === "[ ]") {
      amtStr = String(amt).substring(0, col3Width);
    } else {
      amtStr = Number(amt).toFixed(2).substring(0, col3Width);
    }
    
    let nameStr = name.toString();
    if (nameStr.length > col1Width) {
      nameStr = nameStr.substring(0, col1Width - 2) + "..";
    }
    
    let leftP = Math.floor((col2Width - qtyStr.length) / 2);
    let rightP = col2Width - qtyStr.length - leftP;
    const qtyCentered = ' '.repeat(Math.max(0, leftP)) + qtyStr + ' '.repeat(Math.max(0, rightP));
    
    return nameStr.padEnd(col1Width) + qtyCentered + amtStr.padStart(col3Width);
  },

  drawPackingRow: (name, qty, is58mm, weight = null) => {
    const width = Formatter.getLineLength(is58mm);
    
    let qtyStr = String(qty);
    if (weight) {
      if (Number(qty) > 1) {
        qtyStr = `${weight}x${qty}`;
      } else {
        qtyStr = `${weight}`;
      }
    }
    
    let nameStr = name.toString();
    // Leave 1 space between name and qty
    const maxNameWidth = width - qtyStr.length - 1; 
    
    if (nameStr.length > maxNameWidth) {
      nameStr = nameStr.substring(0, maxNameWidth - 2) + "..";
    }
    
    const spaces = width - nameStr.length - qtyStr.length;
    return nameStr + ' '.repeat(Math.max(0, spaces)) + qtyStr;
  },



  getFormattedDateTime: (dateString) => {
    let dateStr = "";
    let timeStr = "";
    try {
      const orderDate = dateString ? new Date(dateString) : null;
      if (orderDate && !isNaN(orderDate.getTime())) {
        dateStr = orderDate.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'});
        timeStr = orderDate.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
      } else {
        throw new Error("Invalid date");
      }
    } catch(e) {
      const now = new Date();
      dateStr = now.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'});
      timeStr = now.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
    }
    return { dateStr, timeStr };
  }
};

module.exports = Formatter;
