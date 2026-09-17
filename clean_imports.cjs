const fs = require('fs');
const dir = 'c:/Users/Varun/Downloads/interactive-showcase-main/interactive-showcase-main/src/routes';
fs.readdirSync(dir).filter(f => f.endsWith('.tsx')).forEach(file => {
    const p = dir + '/' + file;
    let c = fs.readFileSync(p, 'utf8');
    const replaced = c.replace(/import \{ Navbar \} from .+\n?/g, '').replace(/<Navbar \/>\n?/g, '');
    if (replaced !== c) {
        fs.writeFileSync(p, replaced, 'utf8');
        console.log('Cleaned imports in ' + file);
    }
});
