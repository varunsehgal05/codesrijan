const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/Varun/Downloads/interactive-showcase-main/interactive-showcase-main/src/routes';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    let changed = false;

    const target = '<div className="min-h-screen bg-background text-on-background">';
    if (content.includes(target)) {
        content = content.replace(new RegExp(target, 'g'), '<div className="min-h-screen bg-background text-on-background flex flex-col">');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(path.join(dir, file), content, 'utf8');
        console.log('Fixed flex col:', file);
    }
}
