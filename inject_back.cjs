const fs = require('fs');
const path = require('path');
const dir = './src/routes';

const targetPages = [
    'problems.tsx', 'recruitment.tsx', 'leaderboard.tsx',
    'team.tsx', 'support.tsx', 'gallery.tsx',
    'host-event.tsx', 'profile.tsx', 'profile-overview.tsx',
    'payment.tsx', 'login.tsx', 'register.tsx', 'admin-login.tsx'
];

const injectBackButton = (content, fileName) => {
    const backBtnStr = `
        {/* Global Go Back Navigation */}
        <div className="w-full mb-6">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
            GO BACK
          </button>
        </div>
    `;

    // Auth and core layout pages usually have <div className="p-8 md:p-10 flex flex-col"> or <main className="..."> 
    // We just gently slot the back button above the first h1 or top div content container we find safely.

    // Safety check: if it already has "GO BACK" or window.history.back
    if (content.includes('GO BACK') && content.includes('window.history.back()')) {
        return content;
    }

    if (content.includes('<main className=')) {
        // Find the first <main> tag and drop the button right inside it
        return content.replace(/(<main[^>]*>)/, `$1\n${backBtnStr}`);
    } else if (content.includes('<div className="p-8 md:p-10 flex flex-col">')) {
        // Special case for auth containers like login.tsx, register.tsx
        return content.replace(/(<div className="p-8 md:p-10 flex flex-col">)/, `$1\n${backBtnStr}`);
    }

    return content;
};

const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
files.forEach(file => {
    if (targetPages.includes(file)) {
        const fullPath = path.join(dir, file);
        const originalContent = fs.readFileSync(fullPath, 'utf8');
        const updatedContent = injectBackButton(originalContent, file);
        if (updatedContent !== originalContent) {
            fs.writeFileSync(fullPath, updatedContent, 'utf8');
            console.log(`Injected Go Back UX component into ${file}`);
        }
    }
});
