import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";

export const Route = createFileRoute("/sponsors")({
  component: SponsorsPage,
  head: () => ({
    meta: [
      { title: "Sponsors & Industry Partners | CodeSrijan" },
      { name: "description", content: "Explore the incredible organizations, industry partners, and community sponsors powering CodeSrijan hackathons." }
    ],
  }),
});

interface SponsorItem {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  website?: string;
  tier: string;
  isPublished?: boolean;
}

function SponsorLogo({ logo, name, className, textSize }: { logo?: string; name: string; className?: string; textSize?: string }) {
  const [error, setError] = useState(false);
  if (!logo || error) {
    return <span className={`font-bold ${textSize || 'text-2xl'} text-stark-black font-mono`}>{name.charAt(0)}</span>;
  }
  return (
    <img
      src={logo}
      alt={name}
      onError={() => setError(true)}
      className={className || "w-full h-full object-contain"}
      loading="lazy"
    />
  );
}

function SponsorsPage() {
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');

  useEffect(() => {
    axios.get(`${API_URL}/sponsors`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setSponsors(res.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [API_URL]);

  // Group sponsors by tiers
  const tieredSponsors = useMemo(() => {
    const published = sponsors.filter(s => s.isPublished !== false);
    return {
      title: published.filter(s => s.tier?.toLowerCase() === 'title'),
      platinum: published.filter(s => s.tier?.toLowerCase() === 'platinum'),
      gold: published.filter(s => s.tier?.toLowerCase() === 'gold'),
      other: published.filter(s => !['title', 'platinum', 'gold'].includes(s.tier?.toLowerCase()))
    };
  }, [sponsors]);

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      <main className="flex-grow max-w-[1240px] mx-auto px-4 md:px-8 py-10 w-full space-y-12">
        
        {/* Navigation & Header */}
        <div>
          <button 
            onClick={() => window.history.back()} 
            className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue border-2 border-stark-black px-4 py-2 bg-surface-bright shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all w-fit cursor-pointer text-xs uppercase mb-8"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            GO BACK
          </button>

          <div className="bg-pure-white p-8 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="max-w-2xl">
              <span className="bg-[#FFD700] text-stark-black text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider border border-stark-black inline-block mb-2">
                INDUSTRY ECOSYSTEM
              </span>
              <h1 className="font-display-lg text-4xl md:text-5xl uppercase text-stark-black tracking-tight leading-none">
                Platform Partners &amp; Backers
              </h1>
              <p className="font-body-md text-zinc-600 mt-2 text-sm leading-relaxed">
                Meet the visionary technology leaders, venture foundations, and developer tooling organizations empowering student engineers across the CodeSrijan network.
              </p>
            </div>

            <button
              onClick={() => setIsContactModalOpen(true)}
              className="bg-electric-blue text-pure-white px-6 py-3.5 font-label-bold uppercase border-2 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all cursor-pointer text-xs whitespace-nowrap"
            >
              + BECOME A PARTNER
            </button>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="p-20 text-center font-mono text-xs uppercase text-zinc-400">
            [SYS] QUERYING SPONSOR DATA MATRICES...
          </div>
        ) : sponsors.length === 0 ? (
          <div className="text-center bg-pure-white border-2 border-stark-black p-16 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <span className="material-symbols-outlined text-5xl text-electric-blue">handshake</span>
            <h2 className="font-headline-md text-2xl text-ink-black uppercase">PARTNERSHIP ENROLLMENT OPEN</h2>
            <p className="font-mono text-zinc-500 max-w-md mx-auto text-xs uppercase">
              We are currently onboarding industry sponsors and developer partners for upcoming hackathons.
            </p>
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="bg-stark-black text-pure-white px-6 py-3 font-label-bold uppercase border-2 border-stark-black text-xs cursor-pointer hover:bg-electric-blue transition-colors"
            >
              PARTNER WITH US ↗
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Title Tier Spotlight */}
            {tieredSponsors.title.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FFD700]">stars</span>
                  <h2 className="font-display-lg text-2xl uppercase tracking-wider text-stark-black">TITLE SPONSORS</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tieredSponsors.title.map(sp => (
                    <div key={sp.id} className="bg-pure-white border-4 border-stark-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center gap-6 group hover:-translate-y-1 transition-transform">
                      <div className="w-28 h-28 bg-surface-bright border-2 border-stark-black p-2 flex items-center justify-center shrink-0">
                        <SponsorLogo logo={sp.logo} name={sp.name} textSize="text-3xl" />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <span className="bg-[#FFD700] text-stark-black text-[9px] font-mono font-bold px-2 py-0.5 border border-stark-black uppercase inline-block mb-1">
                          PREMIER PARTNER
                        </span>
                        <h3 className="font-headline-md text-2xl text-stark-black uppercase">{sp.name}</h3>
                        {sp.description && <p className="font-mono text-xs text-zinc-600 mt-1 leading-relaxed">{sp.description}</p>}
                        {sp.website && (
                          <a href={sp.website} target="_blank" rel="noreferrer" className="inline-block mt-3 text-xs font-mono font-bold text-electric-blue hover:underline uppercase">
                            EXPLORE MISSION ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Platinum Tier */}
            {tieredSponsors.platinum.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display-lg text-xl uppercase tracking-wider text-stark-black border-b-2 border-stark-black pb-2">
                  PLATINUM TIER PARTNERS
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tieredSponsors.platinum.map(sp => (
                    <div key={sp.id} className="bg-pure-white border-2 border-stark-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:-translate-y-1 transition-transform">
                      <div>
                        <div className="w-20 h-20 bg-surface-bright border-2 border-stark-black p-2 mb-4 flex items-center justify-center mx-auto">
                          <SponsorLogo logo={sp.logo} name={sp.name} textSize="text-2xl" />
                        </div>
                        <h3 className="font-headline-md text-lg text-stark-black uppercase text-center">{sp.name}</h3>
                        {sp.description && <p className="font-mono text-xs text-zinc-500 mt-1 text-center line-clamp-3">{sp.description}</p>}
                      </div>
                      {sp.website && (
                        <a href={sp.website} target="_blank" rel="noreferrer" className="mt-4 text-center font-mono text-xs font-bold text-electric-blue hover:underline uppercase block">
                          VISIT PLATFORM ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gold & Community Tier */}
            {(tieredSponsors.gold.length > 0 || tieredSponsors.other.length > 0) && (
              <div className="space-y-4">
                <h2 className="font-display-lg text-xl uppercase tracking-wider text-stark-black border-b-2 border-stark-black pb-2">
                  GOLD &amp; ECOSYSTEM COMMUNITY
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {[...tieredSponsors.gold, ...tieredSponsors.other].map(sp => (
                    <div key={sp.id} className="bg-pure-white border-2 border-stark-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center justify-between hover:bg-zinc-50 transition-colors">
                      <div className="w-14 h-14 bg-surface-bright border border-stark-black p-1 flex items-center justify-center mb-2">
                        <SponsorLogo logo={sp.logo} name={sp.name} textSize="text-lg" />
                      </div>
                      <h4 className="font-label-bold text-xs uppercase text-stark-black truncate w-full">{sp.name}</h4>
                      {sp.website && (
                        <a href={sp.website} target="_blank" rel="noreferrer" className="font-mono text-[10px] text-zinc-500 hover:text-electric-blue mt-1">
                          LINK ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Become a Partner Modal with Backdrop Click-Outside */}
      {isContactModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsContactModalOpen(false); }}
          className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b-2 border-stark-black pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-electric-blue text-2xl">handshake</span>
                <h3 className="font-headline-md text-lg uppercase text-stark-black">PARTNER WITH CODESRIJAN</h3>
              </div>
              <button onClick={() => setIsContactModalOpen(false)} className="text-zinc-500 hover:text-black transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <p className="font-code-snippet text-xs text-stark-black leading-relaxed">
              Sponsoring CodeSrijan connects your brand directly with 2,000+ elite student engineers, product designers, and competitive hackers.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-surface-container border border-stark-black">
                <strong className="block text-stark-black uppercase">Direct Sponsorship Dispatch:</strong>
                <a href="mailto:codesrijan@gmail.com" className="text-electric-blue hover:underline font-bold mt-0.5 block">
                  codesrijan@gmail.com
                </a>
              </div>

              <div className="p-3 bg-surface-container border border-stark-black">
                <strong className="block text-stark-black uppercase">Partnership Deck &amp; Tiers:</strong>
                <span className="text-zinc-600 block mt-0.5">Title, Platinum, Gold, Track Bounty &amp; API credits options available.</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="px-5 py-2.5 border-2 border-stark-black font-label-bold uppercase bg-surface-bright hover:bg-zinc-200 text-xs cursor-pointer"
              >
                CLOSE
              </button>
              <a
                href="mailto:codesrijan@gmail.com?subject=CodeSrijan%20Partnership%20Inquiry"
                className="px-5 py-2.5 border-2 border-stark-black font-label-bold uppercase bg-electric-blue text-white hover:bg-stark-black text-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>OPEN EMAIL CLIENT ↗</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
