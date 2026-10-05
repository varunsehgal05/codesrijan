const axios = require('axios');

async function check() {
    try {
        const { data: html } = await axios.get('https://codesrijan-web.onrender.com/login');
        const scriptRegex = /<script[^>]+src="([^">]+)"/g;
        let match;
        const scripts = [];
        while ((match = scriptRegex.exec(html)) !== null) {
            scripts.push(match[1]);
        }
        console.log('Scripts:', scripts);
        
        for (const src of scripts) {
            const url = src.startsWith('http') ? src : `https://codesrijan-web.onrender.com${src.startsWith('/') ? '' : '/'}${src}`;
            console.log('Fetching', url);
            const { data: js } = await axios.get(url);
            if (js.includes('codesrijan-api')) {
                console.log('Found API URL in', src);
                const index = js.indexOf('codesrijan-api');
                console.log(js.substring(Math.max(0, index - 50), Math.min(js.length, index + 50)));
            }
        }
    } catch (e) {
        console.error(e.message);
    }
}
check();
