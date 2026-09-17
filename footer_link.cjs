const fs = require('fs');
const dir = './src/routes';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
files.forEach(file => {
    const p = dir + '/' + file;
    let c = fs.readFileSync(p, 'utf8');

    // The footers typically contain these exact strings from standard Lovable scaffolding
    let replaced = c;
    if (c.includes('>Community</a>') && c.includes('>Privacy Policy</a>')) {
        replaced = replaced.replace(/href=\"\/\" >Community<\/a>/g, 'href=\"/community\" >Community</a>');
        replaced = replaced.replace(/href=\"\/\" >Privacy Policy<\/a>/g, 'href=\"/privacy-policy\" >Privacy Policy</a>');
        replaced = replaced.replace(/href=\"\/\" >Code of Conduct<\/a>/g, 'href=\"/code-of-conduct\" >Code of Conduct</a>');
        replaced = replaced.replace(/href=\"\/\" >Sponsors<\/a>/g, 'href=\"/sponsors\" >Sponsors</a>');
    }

    if (replaced !== c) {
        fs.writeFileSync(p, replaced, 'utf8');
        console.log('Wired footer in ' + file);
    }
});
