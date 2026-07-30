const fs = require('fs');
const https = require('https');
const path = require('path');
const sharp = require('sharp');

const url = 'https://kankezqwlbigcbxrcoof.supabase.co/storage/v1/render/image/public/products/1783003116605-8g13mbp.webp?width=300&height=300&resize=contain&quality=75&format=webp';
const dest = path.join(__dirname, '../scratch/temp_sata.webp');

const file = fs.createWriteStream(dest);
https.get(url, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    sharp(dest)
      .metadata()
      .then(metadata => {
        console.log("SATA IMAGE METADATA:");
        console.log("Width:", metadata.width);
        console.log("Height:", metadata.height);
        console.log("Aspect Ratio:", metadata.width / metadata.height);
      });
  });
});
