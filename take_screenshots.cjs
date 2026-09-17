const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const pages = [
    { name: '01_Home', url: '/' },
    { name: '02_Problems', url: '/problems' },
    { name: '03_Recruitment', url: '/recruitment' },
    { name: '04_Leaderboard', url: '/leaderboard' },
    { name: '05_Login', url: '/login' },
    { name: '06_Register', url: '/register' },
    { name: '07_Payment', url: '/payment' },
    { name: '08_Workspace_Dashboard', url: '/workspace' },
    { name: '09_Workspace_Team', url: '/team' },
    { name: '10_Support_Tickets', url: '/support' },
    { name: '11_Gallery', url: '/gallery' },
    { name: '12_Host_Event', url: '/host-event' },
    { name: '13_Admin_Login', url: '/admin-login' },
    { name: '14_Admin_Dashboard', url: '/admin' }
];

(async () => {
    try {
        const dir = path.join(__dirname, 'platform-screenshots');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        console.log("Launching headless browser...");
        const browser = await puppeteer.launch({ headless: 'new' });
        const targetPage = await browser.newPage();
        await targetPage.setViewport({ width: 1440, height: 900 });

        for (const p of pages) {
            console.log(`Navigating to ${p.name} ...`);
            try {
                await targetPage.goto(`http://localhost:8081${p.url}`, { waitUntil: 'networkidle0', timeout: 10000 });
                // Extra short delay to allow specific CSS animations to settle (neo-brutalist snap)
                await new Promise(resolve => setTimeout(resolve, 800));

                const savePath = path.join(dir, `${p.name}.png`);
                await targetPage.screenshot({ path: savePath, fullPage: true });
                console.log(`Saved: ${savePath}`);
            } catch (e) {
                console.error(`Failed to capture ${p.name}: ${e.message}`);
            }
        }

        await browser.close();
        console.log("SUCCESS: All screenshots saved to /platform-screenshots directory!");
    } catch (e) {
        console.error("Fatal Script Error: " + e.message);
        process.exit(1);
    }
})();
