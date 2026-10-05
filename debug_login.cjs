const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('requestfailed', request => {
        console.log('Request failed: ' + request.url() + ' ' + request.failure().errorText);
    });
    
    page.on('response', response => {
        if (!response.ok() && response.url().includes('login')) {
            console.log('Bad response: ' + response.url() + ' ' + response.status());
        }
    });

    await page.goto('https://codesrijan-web.onrender.com', { waitUntil: 'networkidle2' });
    
    // Type email
    await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="EMAIL"]', { timeout: 10000 });
    const inputs = await page.$$('input');
    await inputs[0].type('admin@codesrijan.com');
    await inputs[1].type('CodeSrijan99!');
    
    const button = await page.$('button[type="submit"], button:has-text("INITIALIZE SESSION")');
    if (button) {
        await button.click();
    } else {
        await page.keyboard.press('Enter');
    }
    
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
})();
