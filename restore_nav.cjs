const { execSync } = require('child_process');
const fs = require('fs');

const authPages = ['workspace.tsx', 'team.tsx', 'problems.tsx', 'recruitment.tsx', 'leaderboard.tsx', 'support.tsx', 'gallery.tsx', 'profile.tsx', 'profile-overview.tsx'];
const dir = 'src/routes';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const profileMarkup = `
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-surface-bright border-2 border-stark-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-1 transition-transform group">
              <div className="w-8 h-8 border-2 border-stark-black bg-electric-blue flex items-center justify-center text-white font-label-bold group-hover:bg-deep-navy transition-colors">SE</div>
              <span className="font-label-bold uppercase text-stark-black hidden lg:block pr-2 group-hover:text-electric-blue transition-colors">Syntax Error</span>
            </div>
            <Link to="/login" className="bg-stark-black text-white px-3 py-2 border-2 border-stark-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-electric-blue hover:-translate-y-1 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">logout</span> Logout
            </Link>
          </div>
`.trim();

files.forEach(file => {
    if (file === '__root.tsx') return;
    const path = `${dir}/${file}`;
    let currentContent = fs.readFileSync(path, 'utf8');

    // Extract bottom part of the file (from <main onwards) to preserve UX changes
    let bottomPart = currentContent;
    if (currentContent.includes('<main')) {
        bottomPart = '<main' + currentContent.substring(currentContent.indexOf('<main') + 5);
    } else {
        console.log(`Skipping structural stitch on ${file} (No <main> tag found)`);
        return;
    }

    try {
        let oldContent = execSync(`git show HEAD:${path}`).toString();
        let topPart = '';

        if (oldContent.includes('<main')) {
            topPart = oldContent.substring(0, oldContent.indexOf('<main'));
        } else {
            console.log(`Skipping structural stitch on ${file} (No <main> in Git HEAD either)`);
            return;
        }

        // Apply contextual Auth navigation modifications
        if (authPages.includes(file)) {
            const authBlockRe = /<div className="flex items-center gap-4">\s*<Link[^>]+>Sign In<\/Link>[\s\S]*?Register<\/Link>\s*<\/div>/;
            if (authBlockRe.test(topPart)) {
                topPart = topPart.replace(authBlockRe, profileMarkup);
                console.log(`Upgraded Auth Navbar for ${file}`);
            }

            // Also contextualize the internal dashboard links if they are the old ones
            if (file === 'workspace.tsx' || file === 'team.tsx' || file === 'support.tsx' || file === 'profile.tsx') {
                // Update <nav> text if needed or just let it use problems/recruitment/leaderboard
            }
        }

        // Write the combined layout
        fs.writeFileSync(path, topPart + bottomPart);
        console.log(`Restored native layout for ${file}`);
    } catch (err) {
        console.log(`Error processing ${file}: ${err.message}`);
    }
});
