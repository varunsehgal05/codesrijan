const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/Varun/Downloads/interactive-showcase-main/interactive-showcase-main/src/routes';

const newNav = `      <nav className="bg-surface dark:bg-ink-black w-full border-b-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sticky top-0 z-50">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-desktop py-4 max-w-[1200px] mx-auto gap-4">
          <div className="flex items-center gap-4">
            <a className="font-headline-md text-headline-md font-black text-ink-black dark:text-surface uppercase tracking-tight" href="/">
              CodeSrijan
            </a>
            <span className="bg-electric-blue text-white font-label-caps px-2 py-0.5 neo-border hidden sm:block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">WORKSPACE</span>
          </div>
          <div className="hidden md:flex gap-8 items-center bg-surface-container-low px-8 py-2 neo-border neo-shadow-sm border-x-2 border-ink-black">
            <a className="text-ink-black dark:text-surface font-label-bold uppercase hover:text-electric-blue transition-colors hover:-translate-y-0.5 active:translate-y-0" href="/problems" >Problems</a>
            <a className="text-ink-black dark:text-surface font-label-bold uppercase hover:text-electric-blue transition-colors hover:-translate-y-0.5 active:translate-y-0" href="/recruitment" >Recruitment</a>
            <a className="text-ink-black dark:text-surface font-label-bold uppercase hover:text-electric-blue transition-colors hover:-translate-y-0.5 active:translate-y-0" href="/leaderboard" >Leaderboard</a>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-3 bg-surface-bright brutal-border px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-0.5 transition-transform">
              <div className="w-8 h-8 border-2 border-ink-black bg-electric-blue flex items-center justify-center text-white font-label-bold">SE</div>
              <span className="font-label-bold uppercase text-ink-black hidden lg:block pr-2">Syntax Error</span>
            </div>
            <button onClick={() => window.location.href = '/login'} className="bg-ink-black text-white px-3 py-2 border-2 border-ink-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-surface-variant hover:text-ink-black hover:-translate-y-0.5 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">logout</span> Logout
            </button>
          </div>
        </div>
      </nav>`;

const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
files.forEach(file => {
    if (file === 'login.tsx' || file === 'register.tsx' || file === 'admin-login.tsx' || file.includes('auth.otp')) return;
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');

    // Replace anything between `<nav` and `</nav>`
    const navRegexAlt = /<nav.*?<\/nav>/s;

    if (file !== 'workspace.tsx' && navRegexAlt.test(content)) {
        content = content.replace(navRegexAlt, newNav);
        fs.writeFileSync(p, content, 'utf8');
        console.log('Replaced in ' + file);
    }
});
console.log('Navbars replaced across application');
