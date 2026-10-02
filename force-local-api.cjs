const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('c:/Users/Varun/Downloads/interactive-showcase-main/interactive-showcase-main/src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content.replace(/import\.meta\.env\['VITE_API_URL'\]\s*\|\|\s*'[^']+'/g, "'http://localhost:5001/api'");
    newContent = newContent.replace(/import\.meta\.env\.VITE_API_URL/g, "'http://localhost:5001/api'");
    
    if(content !== newContent) {
        fs.writeFileSync(file, newContent);
        console.log('Updated ' + file);
    }
});
