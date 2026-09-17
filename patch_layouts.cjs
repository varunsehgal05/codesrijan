const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/Varun/Downloads/interactive-showcase-main/interactive-showcase-main/src/routes';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const registerRegex = /<button[^>]*>\s*Register Now\s*<\/button>/i;
const minHRegex = /<div className=\"min-h-screen bg-background text-on-background\">/;
const mainRegex = /<main className=\"/g;
const navIcons = /<span className=\"material-symbols-outlined text-3xl\" data-icon=\"menu\">menu<\/span>/g;
const backButtonHTML = `<button onClick={() => window.history.back()} className="text-ink-black dark:text-surface-bright font-button-text px-4 py-3 brutal-border flex items-center gap-2 hover:bg-surface-variant transition-colors mr-4"><span className="material-symbols-outlined text-[18px]">arrow_back</span>Go Back</button>`;

for (const file of files) {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    let changed = false;

    // 1. Fix Layout Footer
    if (content.includes('min-h-screen bg-background text-on-background') && !content.includes('flex flex-col')) {
        content = content.replace(minHRegex, '<div className="min-h-screen bg-background text-on-background flex flex-col">');
        changed = true;
    }

    if (mainRegex.test(content) && !content.includes('<main className=\"flex-grow')) {
        content = content.replace(mainRegex, '<main className=\"flex-grow ');
        changed = true;
    }

    // 2. Fix Register Button Link
    if (registerRegex.test(content)) {
        content = content.replace(registerRegex, '<a href="/payment" className="bg-electric-blue text-white font-button-text text-button-text px-6 py-3 brutal-border brutal-shadow brutal-hover brutal-active transition-all duration-200 inline-block">Register Now</a>');
        changed = true;
    }

    // 3. Add Back Button next to the mobile menu or inside the hidden md:block area
    const regBtnAnchor = /<a href="\/payment"[^>]*>Register Now<\/a>/;
    if (regBtnAnchor.test(content) && !content.includes('Go Back')) {
        content = content.replace(regBtnAnchor, backButtonHTML + '<a href="/payment" className="bg-electric-blue text-white font-button-text text-button-text px-6 py-3 brutal-border brutal-shadow brutal-hover brutal-active transition-all duration-200 inline-block">Register Now</a>');
        content = content.replace(/<div className="hidden md:block">\s*(<button onClick.*?Go Back<\/button>)/, '<div className="hidden md:flex items-center">$1');
        changed = true;
    } else if (!content.includes('Go Back') && navIcons.test(content) && !file.includes('index.tsx') && !file.includes('admin') && !file.includes('payment') && !file.includes('host-event') && !file.includes('support')) {
        content = content.replace(navIcons, backButtonHTML.replace('mr-4', 'hidden md:flex mr-4') + '<span className="material-symbols-outlined text-3xl" data-icon="menu">menu</span>');
        changed = true;
    }

    // Specific pages that don't have Register Now but might need 'Go Back'
    if (!content.includes('Go Back') && (file === 'payment.tsx' || file === 'host-event.tsx' || file === 'support.tsx' || file === 'admin-login.tsx')) {
        const dashBack = /<Link to="\/".*?>Back to Dashboard<\/Link>/;
        if (!dashBack.test(content)) {
            content = content.replace(/<div className="font-display-lg text-headline-md font-extrabold text-ink-black dark:text-surface-bright">CodeSrijan<\/div>/, '<div className="flex items-center gap-4"><button onClick={() => window.history.back()} className="bg-surface p-2 brutal-border text-ink-black hover:bg-surface-variant flex items-center justify-center"><span className="material-symbols-outlined">arrow_back</span></button><div className="font-display-lg text-headline-md font-extrabold text-ink-black dark:text-surface-bright">CodeSrijan</div></div>');
            changed = true;
        } else {
            content = content.replace(dashBack, '<button onClick={() => window.history.back()} className="bg-ink-black text-white px-4 py-2 hover:bg-electric-blue transition-colors font-label-bold flex items-center gap-2"><span className="material-symbols-outlined text-sm">arrow_back</span> Go Back</button>');
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(path.join(dir, file), content, 'utf8');
        console.log('Fixed:', file);
    }
}
