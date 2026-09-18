import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gallery")({
  component: Page3,
  head: () => ({
    meta: [
      { title: "Gallery | CodeSrijan" },
      { name: "description", content: "CodeSrijan gallery — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:title", content: "Gallery | CodeSrijan" },
      { property: "og:description", content: "CodeSrijan gallery — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/gallery" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
});

function Page3() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*TopNavBar*/}
<main className="max-w-[1200px] mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-32">

        {/* Global Go Back Navigation */}
        <div className="w-full mb-6">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
            GO BACK
          </button>
        </div>
    
        {/*Hero Section*/}
        <section className="text-center space-y-8">
          <h1 className="font-display-lg text-display-lg text-ink-black uppercase">Event Highlights</h1>
          <p className="font-body-lg text-body-lg max-w-2xl mx-auto text-text-muted">Relive the energy, the late nights, and the incredible projects built during CodeSrijan.</p>
        </section>
        {/*Demo Reel*/}
        <section className="space-y-8">
          <div className="flex items-center gap-4 border-b-2 border-ink-black pb-4">
            <span className="material-symbols-outlined text-4xl text-electric-blue" data-icon="play_circle">play_circle</span>
            <h2 className="font-headline-lg text-headline-lg text-ink-black">Demo Reel</h2>
          </div>
          <div className="relative w-full aspect-video bg-ink-black neo-border neo-shadow-lg group cursor-pointer overflow-hidden">
            <img className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" data-alt="A high-octane cinematic still of a bustling hackathon environment, featuring intense, focused developers working on laptops in a dimly lit, neon-accented tech space. The scene captures the energy of collaboration, with blurred motion emphasizing speed and innovation. Stark contrasts between deep blacks, bright whites, and electric blue neon lights define the neo-brutalist hacker aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_er5EGPK4IFTAHfaMWajJ-Q_0qHWirFzFo5Djv1TwlbdXIue493vLJIFhncD4KmvDpzFxweC12SnoYIR4iDigdT5EogJVEknnn2veH5SoBfNvMl9maNAMD4n8XduiZfJ3YZ5gPEbOaOKKqJahYJob8VDnpRrp3ZNtgSKKxQn5IfRg-hC3E2o1k3iqLtrWuWdDGGXjoBhp_XqiD6skSB001xOhvuAeJgfSL9VXjLWgnHyxC42SSY-z" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-electric-blue text-white p-4 rounded-full neo-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-5xl" data-icon="play_arrow">play_arrow</span>
              </div>
            </div>
          </div>
        </section>
        {/*Hero Grid (Masonry)*/}
        <section className="space-y-8">
          <div className="flex items-center gap-4 border-b-2 border-ink-black pb-4">
            <span className="material-symbols-outlined text-4xl text-electric-blue" data-icon="photo_library">photo_library</span>
            <h2 className="font-headline-lg text-headline-lg text-ink-black">Gallery</h2>
          </div>
          <div className="masonry-grid">
            {/*Image 1*/}
            <div className="masonry-item bg-white neo-border neo-shadow-sm p-4 relative group">
              <img className="w-full h-auto object-cover border-2 border-ink-black mb-2" data-alt="Close up shot of a coder's hands typing furiously on a mechanical keyboard with bright electric blue backlighting, reflecting off dark matte keycaps in a high contrast, dramatic lighting environment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGIKO2N8r6EdY9IUYjtxHwFiqE5deLtLzAqB0H-85CL3lo6TjFKMNNKORwtwel2ckRNXlz_dAdiouy7VJhQ47G4ASgfequl66O-QzpCrqftjByyrrSr2hMEv6Xm1jafxLg107ZasgwQb-LzoiHmACMY7lMFw1QA1DHYotVnoKxZwPtwANTNn1nLkvh3Vm_KPw7zydVPS5P-4km2UXRNT_CR93KNKPgQF3ckoaXTFme95dVTeI_5xFt" />
              <p className="font-label-caps text-label-caps text-ink-black uppercase">Midnight Coding</p>
            </div>
            {/*Image 2*/}
            <div className="masonry-item bg-white neo-border neo-shadow-sm p-4 relative group">
              <img className="w-full h-auto object-cover border-2 border-ink-black mb-2" data-alt="Wide angle shot of a large tech venue during a hackathon opening ceremony. Bright spotlights shine down on a stage, cutting through a dark room. The audience is illuminated by the glow of hundreds of laptop screens. Electric blue accents and stark architectural lines dominate." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhR5Vscf7tBGPyljDOPVdQ63PV3f_4MeUAYrT_z2rrpIcZvBti4AHT3LpkP9RmqnrTdfpBx-uwga9oEmCksmQu0zOECsc0I4729S4yHBgT3Wr0jzpiC2P583a9JFn9HS9o9ks_Ec4l6dB1tHZJ_bFDAnpDPAemMcfbfNZK5KIM-LPKuL5Et-sEbp2gRtfx1FCsqc25--Nd9Y5QRbedYIw_uEBIZyKHKUM5Pm01pRbn6C4Re9h8xhsO" />
              <p className="font-label-caps text-label-caps text-ink-black uppercase">Opening Ceremony</p>
            </div>
            {/*Image 3*/}
            <div className="masonry-item bg-electric-blue neo-border neo-shadow-sm p-4 relative group">
              <div className="aspect-square flex items-center justify-center border-2 border-ink-black mb-2 bg-ink-black text-white p-6 text-center">
                <h3 className="font-headline-md text-headline-md">"The energy here is unmatched."</h3>
              </div>
              <p className="font-label-caps text-label-caps text-white uppercase">Participant Quote</p>
            </div>
            {/*Image 4*/}
            <div className="masonry-item bg-white neo-border neo-shadow-sm p-4 relative group">
              <img className="w-full h-auto object-cover border-2 border-ink-black mb-2" data-alt="A small group of developers huddled tightly around a single monitor, pointing at code in deep discussion. The lighting is focused and high-contrast, emphasizing their intense concentration and collaboration. The room background is dark, stark, and modern." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7yw_w_hE4q2G1K3ZVqHiiWKBGQIrPP6_j5yHuDtUZDjnLthLB3SVq-_9n9UFQZzTZT5kJw8tjYZQ508c-Axb8Fig4OR8lHI_BdFC3pSv03_qEY-Pmf_yURxQhVzx02UxWxEBl6O__V39NpcupYfqg3UMUDfcM_LotSdtbZ4h03U6zI7ZkjqAcNFFXBAUCfvRGUYGzfp56NG8ETwNP74EgRMVmnyGiYLCaO0X6kBCwSAf__Xbtocro" />
              <p className="font-label-caps text-label-caps text-ink-black uppercase">Team Workshop</p>
            </div>
          </div>
        </section>

        {/*Public Projects Display*/}
        <section className="space-y-8">
          <div className="flex items-center gap-4 border-b-2 border-ink-black pb-4">
            <span className="material-symbols-outlined text-4xl text-electric-blue">rocket_launch</span>
            <h2 className="font-headline-lg text-headline-lg text-ink-black">Public Project Submissions</h2>
            <span className="ml-auto font-label-caps bg-ink-black text-white px-3 py-1">CodeSrijan '24</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Project 1 */}
            <div className="bg-surface neo-border neo-shadow p-6 flex flex-col gap-4 group cursor-pointer hover:-translate-y-2 transition-transform">
              <div className="aspect-video bg-ink-black flex items-center justify-center p-4 w-full">
                <span className="material-symbols-outlined text-[64px] text-electric-blue">public</span>
              </div>
              <div>
                <h3 className="font-headline-md text-ink-black uppercase mb-1">NeoNet</h3>
                <p className="font-body-sm text-text-muted">A fully decentralized peer-to-peer voting mechanism.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="font-label-caps text-[10px] bg-electric-blue text-white px-2 py-0.5 border border-ink-black">1st Runner Up</span>
                <span className="font-label-caps text-[10px] bg-white text-ink-black px-2 py-0.5 border border-ink-black">Web3</span>
              </div>
            </div>

            {/* Project 2 */}
            <div className="bg-surface neo-border neo-shadow p-6 flex flex-col gap-4 group cursor-pointer hover:-translate-y-2 transition-transform">
              <div className="aspect-video bg-[#FFE100] flex items-center justify-center p-4 border-2 border-ink-black w-full">
                <span className="material-symbols-outlined text-[64px] text-ink-black">psychology</span>
              </div>
              <div>
                <h3 className="font-headline-md text-ink-black uppercase mb-1">BrainWave AI</h3>
                <p className="font-body-sm text-text-muted">Predictive models for hardware failure utilizing local LLMs.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="font-label-caps text-[10px] bg-[#FFA500] text-ink-black px-2 py-0.5 border border-ink-black">Winner: Best AI</span>
                <span className="font-label-caps text-[10px] bg-white text-ink-black px-2 py-0.5 border border-ink-black">Machine Learning</span>
              </div>
            </div>

            {/* Project 3 */}
            <div className="bg-surface neo-border neo-shadow p-6 flex flex-col gap-4 group cursor-pointer hover:-translate-y-2 transition-transform">
              <div className="aspect-video bg-electric-blue flex items-center justify-center p-4 border-2 border-ink-black w-full">
                <span className="material-symbols-outlined text-[64px] text-white">satellite_alt</span>
              </div>
              <div>
                <h3 className="font-headline-md text-ink-black uppercase mb-1">AstroSync</h3>
                <p className="font-body-sm text-text-muted">Low-orbit satellite data visualization tool built in Rust.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="font-label-caps text-[10px] bg-white text-ink-black px-2 py-0.5 border border-ink-black">Hardware Interfacing</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/*Footer*/}
</div>
  );
}
