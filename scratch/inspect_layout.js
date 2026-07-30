const http = require('http');
const fs = require('fs');
const path = require('path');

function fetchHtml() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:3000/shop', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  console.log("Fetching local shop page HTML and saving to scratch/local_shop.html...");
  try {
    const html = await fetchHtml();
    fs.writeFileSync(path.join(__dirname, 'local_shop.html'), html);
    console.log("Saved. Searching for product-card-image references in saved HTML...");
    const regex = /<img[^>]*class="[^"]*product-card-image[^"]*"[^>]*>/g;
    const matches = html.match(regex);
    if (matches) {
      console.log("Found matches count:", matches.length);
      console.log("First match:", matches[0]);
    } else {
      console.log("No product-card-image tags found in SSR HTML!");
    }
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

run();
