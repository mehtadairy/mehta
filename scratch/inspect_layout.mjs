import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to /shop...");
    await page.goto('http://localhost:3000/shop', { waitUntil: 'domcontentloaded' });
    
    console.log("Page title:", await page.title());
    
    // Wait for the main product grid
    await page.waitForSelector('a[href*="/product/"]', { timeout: 15000 });
    
    // Ensure images have time to render
    await page.waitForTimeout(2000);
    
    const cardData = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const img = document.querySelector('.product-card-image') || imgs.find(i => i.src && i.src.includes('http'));
      if (!img) return null;
      
      const getStyles = (el) => {
        const s = window.getComputedStyle(el);
        return {
          display: s.display,
          position: s.position,
          width: s.width,
          height: s.height,
          overflow: s.overflow,
          flex: s.flex,
          flexDirection: s.flexDirection,
          alignItems: s.alignItems,
          justifyContent: s.justifyContent,
          aspectRatio: s.aspectRatio,
          boxSizing: s.boxSizing
        };
      };
      
      const data = {
        html: img.outerHTML,
        computedStyles: getStyles(img),
        computedWidth: window.getComputedStyle(img).width,
        computedHeight: window.getComputedStyle(img).height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        parentWidth: window.getComputedStyle(img.parentElement).width,
        parentHeight: window.getComputedStyle(img.parentElement).height,
        chain: []
      };
      
      let current = img.parentElement;
      while (current && !current.tagName.toLowerCase().includes('article')) {
        data.chain.push({
          tag: current.tagName,
          className: current.className,
          styles: getStyles(current)
        });
        current = current.parentElement;
      }
      if (current) {
        data.chain.push({
          tag: current.tagName,
          className: current.className,
          styles: getStyles(current)
        });
      }
      return data;
    });

    console.log("Navigating to product detail page...");
    const productUrl = await page.evaluate(() => {
      const link = document.querySelector('a[href*="/product/"]');
      return link ? link.href : null;
    });
    
    if (productUrl) {
      console.log("Found product URL:", productUrl);
      await page.goto(productUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.cursor-zoom-in img', { timeout: 15000 });
      await page.waitForTimeout(2000);
      
      const detailData = await page.evaluate(() => {
        const container = document.querySelector('.cursor-zoom-in');
        const img = container ? container.querySelector('img') : null;
        if (!img) return null;
        
        const getStyles = (el) => {
          const s = window.getComputedStyle(el);
          return {
            display: s.display,
            position: s.position,
            width: s.width,
            height: s.height,
            overflow: s.overflow,
            flex: s.flex,
            flexDirection: s.flexDirection,
            alignItems: s.alignItems,
            justifyContent: s.justifyContent,
            aspectRatio: s.aspectRatio,
            boxSizing: s.boxSizing
          };
        };
        
        const data = {
          html: img.outerHTML,
          computedStyles: getStyles(img),
          computedWidth: window.getComputedStyle(img).width,
          computedHeight: window.getComputedStyle(img).height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          parentWidth: window.getComputedStyle(img.parentElement).width,
          parentHeight: window.getComputedStyle(img.parentElement).height,
          chain: []
        };
        
        let current = img.parentElement;
        let levels = 0;
        while (current && levels < 6) {
          data.chain.push({
            tag: current.tagName,
            className: current.className,
            styles: getStyles(current)
          });
          current = current.parentElement;
          levels++;
        }
        
        return data;
      });
      
      console.log("=== PRODUCT CARD DATA ===");
      console.log(JSON.stringify(cardData, null, 2));
      console.log("=== PRODUCT DETAIL DATA ===");
      console.log(JSON.stringify(detailData, null, 2));
    } else {
      console.log("Could not find product link to click.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
