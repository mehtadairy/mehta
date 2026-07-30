const fs = require('fs');
const https = require('https');
const path = require('path');
// We can use a simple package or read image headers directly
// WebP files have header bytes that contain width and height, or we can just download it and print size.
// Better: we can import sharp!
const sharp = require('sharp');

const url = 'https://kankezqwlbigcbxrcoof.supabase.co/storage/v1/object/public/products/1783255583406-h8xw67n.webp';
const dest = path.join(__dirname, '../scratch/temp_image.webp');

const file = fs.createWriteStream(dest);
console.log("Downloading image...");
https.get(url, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log("Download complete. Analyzing with sharp...");
    sharp(dest)
      .metadata()
      .then(metadata => {
        console.log("IMAGE METADATA:");
        console.log("Width:", metadata.width);
        console.log("Height:", metadata.height);
        console.log("Aspect Ratio:", metadata.width / metadata.height);
      })
      .catch(err => {
        console.error("Error reading metadata:", err);
      });
  });
}).on('error', (err) => {
  console.error("Download failed:", err);
});
