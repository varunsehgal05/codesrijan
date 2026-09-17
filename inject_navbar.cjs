const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/Varun/Downloads/interactive-showcase-main/interactive-showcase-main/src/routes';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
files.forEach(file => {
    // Skip explicitly unauthenticated layouts to avoid duplicate / restricted views
    if (file === 'login.tsx' || file === 'register.tsx' || file === 'admin-login.tsx' || file.includes('auth.otp') || file === '__root.tsx') return;

    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');

    // Replace ` <nav ... > ... </nav>` block with `<Navbar />`
    const navRegexAlt = /<nav.*?<\/nav>/s;

    if (navRegexAlt.test(content) && !content.includes('<Navbar />')) {
        content = content.replace(navRegexAlt, '<Navbar />');

        // Inject import dynamically if not present
        if (!content.includes('import { Navbar }')) {
            const lines = content.split('\n');
            // Find last react/tanstack import to stick it under
            let lastImportIndex = 0;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('import ')) {
                    lastImportIndex = i;
                }
            }
            lines.splice(lastImportIndex + 1, 0, 'import { Navbar } from "../components/Navbar";');
            content = lines.join('\n');
        }

        fs.writeFileSync(p, content, 'utf8');
        console.log('Injected <Navbar /> into ' + file);
    } else if (content.includes('<Navbar />')) {
        console.log('Navbar already present in ' + file);
    }
});
console.log('All navigation blocks abstracted to Component mode!');
