import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/team")({
  component: Page6,
  head: () => ({
    meta: [
      { title: "Team Hub | CodeSrijan" },
      { name: "description", content: "CodeSrijan team hub — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:title", content: "Team Hub | CodeSrijan" },
      { property: "og:description", content: "CodeSrijan team hub — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/team" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/team" }],
  }),
});

function Page6() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*TopNavBar*/}
      <nav className="bg-surface dark:bg-ink-black w-full sticky top-0 z-50 border-b-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex justify-between items-center px-margin-desktop py-4 max-w-[1200px] mx-auto hidden md:flex">
      <div className="font-display-lg text-headline-md font-extrabold text-ink-black dark:text-surface-bright">CodeSrijan</div>
      <div className="flex gap-gutter">
      <a className="font-button-text text-button-text text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" href="/problems" >Problems</a>
      <a className="font-button-text text-button-text text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" href="/recruitment" >Recruitment</a>
      <a className="font-button-text text-button-text text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" href="/leaderboard" >Leaderboard</a>
      </div>
      <button className="bg-electric-blue text-on-primary font-button-text text-button-text px-6 py-2 neo-brutal-button">Register Now</button>
      </div>
      </nav>
      <main className="flex-grow max-w-[1200px] mx-auto w-full px-margin-desktop py-12 flex flex-col gap-12">
      {/*Team Header*/}
      <header className="bg-surface p-8 neo-brutal-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
      <h1 className="font-display-lg text-display-lg text-ink-black mb-2">Null Pointers</h1>
      <p className="font-body-lg text-body-lg text-text-muted">Mission: To build the most resilient, over-engineered to-do list the world has ever seen.</p>
      </div>
      <div className="flex flex-col gap-2 text-right">
      <span className="font-label-caps text-label-caps text-electric-blue">Active Challenge</span>
      <a className="font-headline-md text-headline-md text-ink-black hover:text-electric-blue underline decoration-2 underline-offset-4" href="/" >Global Hackathon '24</a>
      </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
      {/*Left Column: Roster & Chat*/}
      <div className="flex flex-col gap-gutter lg:col-span-1">
      {/*Role Management*/}
      <section className="bg-surface p-6 neo-brutal-card">
      <h2 className="font-headline-lg text-headline-lg text-ink-black mb-6">Roster</h2>
      <div className="flex flex-col gap-4">
      {/*Member 1*/}
      <div className="flex items-center gap-4 p-4 border-2 border-ink-black bg-surface-bright shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <img className="w-12 h-12 rounded-full border-2 border-ink-black object-cover" data-alt="A detailed portrait of a young tech professional with a neutral expression. The image is brightly lit, showcasing a modern, high-contrast aesthetic with sharp lines. The subject is wearing a casual dark tech-company t-shirt. The background is a stark, clean white to match a light-mode neo-brutalist UI style. Bright energetic mood." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6_FSmlshrG8_YTFxDpRQeh0xF7kHwg4a5JrsuV_wEvcnJmgjKK458ups042879EbMj7CNMnm7k2DJB-aqIOYgmlm85rE_xQLFKffahulUGNwYP88nuJ0BXWIakIL-NrKKbJNJRBTHF2yWAjpPwdbF0nNVZ2IDcVWsZ2gJvcNXDvwHzMF8Zhmn9qfb1CRCDQx6Oi-Ewgu4ZyvbRA72HRy9FV_ITDgyd7QQubzC93KBMP35fkDMpC6S"/>
      <div className="flex-grow">
      <div className="font-headline-md text-body-lg font-bold">Alex Chen</div>
      <div className="font-label-caps text-label-caps text-text-muted">Lead Developer</div>
      </div>
      <div className="w-3 h-3 rounded-full bg-electric-blue border border-ink-black" title="Online"></div>
      </div>
      {/*Member 2*/}
      <div className="flex items-center gap-4 p-4 border-2 border-ink-black bg-surface-bright shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <img className="w-12 h-12 rounded-full border-2 border-ink-black object-cover" data-alt="A portrait of a creative UI/UX designer looking focused. The lighting is crisp and even, highlighting a bold, contemporary look. The subject has stylish glasses and modern attire. The background is pure white, aligning with a high-contrast, energetic neo-brutalist design system. Vibrant and clear." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcEOqqyswAJ3zbfhx1ygdhaByVEPazANTq-Yr5OYd76eWQJogys-Ih3qk2aoFQQcjzJnD7RSqfKdErLpGHBum3-Ecf3DoRQ2eBtGcKFWwRbifyXiUny08r6lC4h-E8d04EM08xrDhNJt845efR9Z0Gbu-QJ9lxt13h9bOVxDbXJg7y4f1c-ktaWvnqAk5qdx1P8Pqrwx66EiuzPE8sNlMiwHk7ePsieoQKnBMLLf7gH0LJxKpMW_nr"/>
      <div className="flex-grow">
      <div className="font-headline-md text-body-lg font-bold">Sam Taylor</div>
      <div className="font-label-caps text-label-caps text-text-muted">UI/UX</div>
      </div>
      <div className="w-3 h-3 rounded-full bg-surface-variant border border-ink-black" title="Offline"></div>
      </div>
      </div>
      </section>
      {/*Team Chat*/}
      <section className="bg-ink-black p-6 neo-brutal-card text-surface-bright flex flex-col h-[400px]">
      <h2 className="font-headline-lg text-headline-lg mb-4 text-electric-blue">Terminal Chat</h2>
      <div className="flex-grow overflow-y-auto font-label-caps text-label-caps flex flex-col gap-2 mb-4 pr-2">
      <div className="text-surface-variant"><span className="text-electric-blue">sys&gt;</span> Team Null Pointers initialized.</div>
      <div><span className="text-electric-blue">alex_c&gt;</span> API endpoints are live. Check the docs.</div>
      <div><span className="text-outline-variant">sam_t&gt;</span> Awesome, hooking up the frontend now.</div>
      </div>
      <div className="flex gap-2">
      <span className="font-label-caps text-label-caps text-electric-blue mt-2">&gt;</span>
      <input className="w-full bg-transparent border-none text-surface-bright font-label-caps focus:ring-0 p-0 py-2 border-b-2 border-surface-variant focus:border-electric-blue transition-colors" placeholder="Enter command or message..." type="text"/>
      </div>
      </section>
      </div>
      {/*Right Column: Kanban*/}
      <div className="lg:col-span-2">
      <section className="bg-surface p-6 neo-brutal-card h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
      <h2 className="font-headline-lg text-headline-lg text-ink-black">Task Board</h2>
      <button className="bg-electric-blue text-on-primary font-button-text text-button-text px-4 py-2 neo-brutal-button flex items-center gap-2">
      <span className="material-symbols-outlined">add</span> New Task
                              </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">
      {/*Column: Backlog*/}
      <div className="flex flex-col gap-4">
      <div className="font-headline-md text-headline-md border-b-4 border-ink-black pb-2">Backlog</div>
      <div className="bg-surface-bright p-4 neo-brutal-card cursor-pointer">
      <div className="flex justify-between items-start mb-2">
      <span className="font-label-caps text-[10px] bg-surface-variant border border-ink-black px-1">LOW</span>
      </div>
      <h3 className="font-headline-md text-body-lg font-bold mb-2">Design Logo</h3>
      <div className="flex justify-between items-center mt-4">
      <div className="font-label-caps text-[12px] text-text-muted">Unassigned</div>
      </div>
      </div>
      </div>
      {/*Column: In Progress*/}
      <div className="flex flex-col gap-4">
      <div className="font-headline-md text-headline-md border-b-4 border-electric-blue pb-2 text-electric-blue">In Progress</div>
      <div className="bg-surface-bright p-4 neo-brutal-card cursor-pointer border-electric-blue shadow-[4px_4px_0px_0px_var(--tw-colors-electric-blue)]">
      <div className="flex justify-between items-start mb-2">
      <span className="font-label-caps text-[10px] bg-electric-blue text-on-primary border border-ink-black px-1">HIGH</span>
      </div>
      <h3 className="font-headline-md text-body-lg font-bold mb-2">Build Auth Flow</h3>
      <div className="flex justify-between items-center mt-4">
      <div className="font-label-caps text-[12px] font-bold">Alex Chen</div>
      </div>
      </div>
      </div>
      {/*Column: Testing*/}
      <div className="flex flex-col gap-4">
      <div className="font-headline-md text-headline-md border-b-4 border-ink-black pb-2">Testing</div>
      <div className="bg-surface-bright p-4 neo-brutal-card cursor-pointer">
      <div className="flex justify-between items-start mb-2">
      <span className="font-label-caps text-[10px] bg-surface-dim border border-ink-black px-1">MED</span>
      </div>
      <h3 className="font-headline-md text-body-lg font-bold mb-2">UI Component Library</h3>
      <div className="flex justify-between items-center mt-4">
      <div className="font-label-caps text-[12px] font-bold">Sam Taylor</div>
      </div>
      </div>
      </div>
      </div>
      </section>
      </div>
      </div>
      </main>
      {/*Footer*/}
      <footer className="bg-ink-black dark:bg-surface-container-lowest w-full mt-16 border-t-4 border-electric-blue">
      <div className="flex flex-col md:flex-row justify-between items-start px-margin-desktop py-12 gap-8 max-w-[1200px] mx-auto">
      <div>
      <div className="font-display-lg text-headline-md text-surface-bright mb-4">CodeSrijan</div>
      <div className="font-body-md text-body-md text-surface-variant">© 2024 CodeSrijan. Built for the community.</div>
      </div>
      <div className="flex flex-wrap gap-6 font-body-md text-body-md text-surface-variant">
      <a className="hover:text-electric-blue transition-colors transition-all duration-300" href="/" >Sponsors</a>
      <a className="hover:text-electric-blue transition-colors transition-all duration-300" href="/" >Community</a>
      <a className="hover:text-electric-blue transition-colors transition-all duration-300" href="/" >Discord</a>
      <a className="hover:text-electric-blue transition-colors transition-all duration-300" href="/" >GitHub</a>
      <a className="hover:text-electric-blue transition-colors transition-all duration-300" href="/" >Privacy Policy</a>
      <a className="hover:text-electric-blue transition-colors transition-all duration-300" href="/" >Code of Conduct</a>
      </div>
      </div>
      </footer>
    </div>
  );
}
