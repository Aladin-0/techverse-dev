import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

    console.log("Navigating to localhost:5173...");
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log("Navigation timeout"));
    
    // Wait for a few seconds to let any 3D loading errors appear
    await new Promise(r => setTimeout(r, 5000));
    
    await browser.close();
})();
