const fs = require('fs');
const dir = './src/routes';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
    const p = dir + '/' + file;
    let c = fs.readFileSync(p, 'utf8');

    // Replace the injected <Link to="/login" ... block with an <a> tag
    // Since we injected EXACTLY this: 
    // <Link to="/login" className="bg-stark-black text-white px-3 py-2 border-2 border-stark-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-electric-blue hover:-translate-y-1 transition-all flex items-center gap-2">
    //   <span className="material-symbols-outlined text-[18px]">logout</span> Logout
    // </Link>

    let replaced = c.replace(/<Link to="\/login" className="bg-stark-black/g, '<a href="/login" className="bg-stark-black');

    // Now replace the closing </Link> ONLY where it follows "Logout" in this exact structure
    let finalReplaced = replaced.replace(/logout<\/span> Logout\s*<\/Link>/g, 'logout</span> Logout\n            </a>');

    if (finalReplaced !== c) {
        fs.writeFileSync(p, finalReplaced, 'utf8');
        console.log('Fixed Link crash in ' + file);
    }
});
