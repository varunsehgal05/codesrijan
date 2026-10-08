import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";

export const Route = createFileRoute("/gallery")({
  component: Page3,
  head: () => ({
    meta: [
      { title: "Gallery | CodeSrijan" },
    ],
  }),
});

function Page3() {
  const [projects, setProjects] = useState<any[]>([]);

  const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api.onrender.com/api');

  useEffect(() => {
    // Fetch media gallery (optional mock or real)
    axios.get(`${API_URL}/gallery`)
      .then(res => { setGallery(res.data); })
      .catch(err => { console.error("No media gallery"); });

    // Fetch submitted projects
    axios.get(`${API_URL}/gallery/projects`)
      .then(res => {
        setProjects(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load projects");
        setLoading(false);
      });
  }, [API_URL]);

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

          {loading ? (
            <div className="text-center font-mono opacity-50 py-20">[LOADING GALLERY METRICS...]</div>
          ) : gallery.length === 0 ? (
            <div className="text-center bg-zinc-200 border-2 border-stark-black p-12">
              <span className="material-symbols-outlined text-4xl mb-4">image_not_supported</span>
              <h2 className="font-headline-md text-ink-black uppercase">No Media Available</h2>
              <p className="font-mono text-zinc-500 mt-2">The system operators have not uploaded any visual telemetry yet.</p>
            </div>
          ) : (
            <div className="masonry-grid">
              {gallery.map((item, idx) => (
                <div key={idx} className="masonry-item bg-white neo-border neo-shadow-sm p-4 relative group">
                  {item.mediaType === 'quote' ? (
                    <div className="aspect-square flex items-center justify-center border-2 border-ink-black mb-2 bg-ink-black text-white p-6 text-center">
                      <h3 className="font-headline-md text-headline-md">"{item.description}"</h3>
                    </div>
                  ) : (
                    <img className="w-full h-auto object-cover border-2 border-ink-black mb-2" src={item.mediaUrl} alt={item.title} />
                  )}
                  <p className="font-label-caps text-label-caps text-ink-black uppercase">{item.title}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/*Public Projects Display*/}
        <section className="space-y-8">
          <div className="flex items-center gap-4 border-b-2 border-ink-black pb-4">
            <span className="material-symbols-outlined text-4xl text-electric-blue">rocket_launch</span>
            <h2 className="font-headline-lg text-headline-lg text-ink-black">Public Project Submissions</h2>
            <span className="ml-auto font-label-caps bg-ink-black text-white px-3 py-1">CodeSrijan '24</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center font-mono opacity-50 py-20">[LOADING PROJECTS...]</div>
            ) : projects.length === 0 ? (
              <div className="col-span-full text-center bg-zinc-200 border-2 border-stark-black p-12">
                <span className="material-symbols-outlined text-4xl mb-4">public_off</span>
                <h2 className="font-headline-md text-ink-black uppercase">No Projects Yet</h2>
                <p className="font-mono text-zinc-500 mt-2">Projects will appear here once teams lock in their final submissions.</p>
              </div>
            ) : (
              projects.map((proj, idx) => (
                <div key={proj.teamId} className="bg-surface neo-border neo-shadow p-6 flex flex-col gap-4 group cursor-pointer hover:-translate-y-2 transition-transform">
                  <div className={`aspect-video flex items-center justify-center p-4 w-full border-2 border-ink-black ${idx % 3 === 0 ? 'bg-electric-blue text-white' : idx % 3 === 1 ? 'bg-[#FFE100] text-ink-black' : 'bg-ink-black text-white'}`}>
                    <span className="material-symbols-outlined text-[64px]">{idx % 3 === 0 ? 'satellite_alt' : idx % 3 === 1 ? 'psychology' : 'public'}</span>
                  </div>
                  <div>
                    <h3 className="font-headline-md text-ink-black uppercase mb-1">{proj.teamName}</h3>
                    <p className="font-body-sm text-text-muted">{proj.description}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="font-label-caps text-[10px] bg-white text-ink-black px-2 py-0.5 border border-ink-black">{proj.problemTitle}</span>
                  </div>
                  <div className="mt-auto pt-4 flex gap-2 flex-wrap border-t-2 border-ink-black border-dashed">
                    {proj.githubLink && (
                      <a href={proj.githubLink} target="_blank" className="font-label-bold text-xs bg-ink-black text-white px-3 py-1 hover:bg-electric-blue transition-colors">GITHUB</a>
                    )}
                    {proj.demoLink && (
                      <a href={proj.demoLink} target="_blank" className="font-label-bold text-xs bg-ink-black text-white px-3 py-1 hover:bg-electric-blue transition-colors">LIVE DEMO</a>
                    )}
                    {proj.figmaLink && (
                      <a href={proj.figmaLink} target="_blank" className="font-label-bold text-xs bg-ink-black text-white px-3 py-1 hover:bg-electric-blue transition-colors">FIGMA</a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
      {/*Footer*/}
    </div>
  );
}
