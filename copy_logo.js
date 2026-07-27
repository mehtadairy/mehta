const fs = require('fs');
const src = 'C:\\Users\\aarya\\.gemini\\antigravity-ide\\brain\\03fc724b-9112-4177-8ad4-97eea7ba00d2\\.tempmediaStorage\\media_03fc724b-9112-4177-8ad4-97eea7ba00d2_1781688173053.png';
const dest = 'p:\\mehta1\\public\\logo_mehta_gold.png';
fs.copyFileSync(src, dest);
console.log('Logo copied successfully!');
