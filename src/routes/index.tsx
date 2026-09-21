import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";

export const Route = createFileRoute("/")({
  component: Page14,
  head: () => ({
    meta: [
      { title: "Home | CodeSrijan" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function Page14() {
  const [stats, setStats] = useState({
    hackersCount: 4000,
    projectsCount: 630,
    registrationsCount: 11500,
    collegesCount: 600,
    activeHackathon: null as any
  });

  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState("Loading...");
  const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

  useEffect(() => {
    // 1. Fetch Global Numbers
    axios.get(`${API_URL}/public/stats`)
      .then(res => {
        if (res.data) setStats(prev => ({ ...prev, ...res.data }));
      }).catch(err => console.log('Telemetry fetch failed.'));

    // 2. Fetch Active CodeSrijan Event
    axios.get(`${API_URL}/hackathons/active`)
      .then(res => {
        if (res.data) setStats(prev => ({ ...prev, activeHackathon: res.data }));
        setLoading(false);
      })
      .catch(err => {
        console.error("Public API failed to return live event.");
        setLoading(false);
      });
  }, [API_URL]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (stats.activeHackathon && stats.activeHackathon.registrationEnd) {
      timer = setInterval(() => {
        const end = new Date(stats.activeHackathon.registrationEnd).getTime();
        const now = new Date().getTime();
        const dis = end - now;

        if (dis < 0) {
          setTimeLeft("ACCESS CONCLUDED");
        } else {
          const d = Math.floor(dis / (1000 * 60 * 60 * 24));
          const h = Math.floor((dis % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const m = Math.floor((dis % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((dis % (1000 * 60)) / 1000);
          setTimeLeft(`${d}d ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }
      }, 1000);
    } else {
      setTimeLeft("--:--:--");
    }
    return () => clearInterval(timer);
  }, [stats.activeHackathon]);

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*TopNavBar Refactored to Root*/}
      {/*Hero Section*/}
      <section className="relative min-h-[819px] flex items-center justify-center pt-section-gap pb-section-gap overflow-hidden bg-surface-container-lowest">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
        <div className="max-w-[1200px] mx-auto px-gutter relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-block bg-deep-navy text-pure-white px-4 py-1 font-label-bold text-label-bold w-max brutal-border transform -rotate-2">
              <span className="material-symbols-outlined align-middle mr-2 text-sm">code</span>The Ultimate Developer Hackathon
            </div>
            <h1 className="font-display-lg text-display-lg text-stark-black uppercase leading-none">
              Build.<br />
              <span className="text-electric-blue">Break.</span><br />
              Innovate.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
              Join CodeSrijan for 48 hours of intense coding, networking, and building the future. Ready to make your mark?
            </p>
            <div className="flex gap-4 mt-4">
              <Link to="/register" className="bg-electric-blue text-pure-white font-label-bold text-label-bold px-8 py-4 brutal-border brutal-shadow brutal-shadow-hover transition-all duration-200 text-lg flex items-center gap-2 block hover:-translate-y-1">
                Start Building <span className="material-symbols-outlined font-bold">arrow_forward</span>
              </Link>
              <Link to="/about" className="bg-surface-container text-stark-black font-label-bold text-label-bold px-8 py-4 brutal-border brutal-shadow brutal-shadow-hover transition-all duration-200 text-lg block hover:-translate-y-1">
                View Schedule
              </Link>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-primary-fixed-dim transform rotate-6 brutal-border"></div>
            <div className="relative bg-pure-white p-card-padding brutal-border brutal-shadow-lg transform -rotate-3 z-10 h-full flex flex-col justify-between min-h-[400px]">
              <div className="flex justify-between items-start border-b-2 border-stark-black pb-4 mb-4">
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface-variant">
                    {stats.activeHackathon ? 'Registration Ends' : 'Next Event In'}
                  </p>
                  <h3 className="font-headline-lg text-headline-lg text-deep-navy">
                    {loading ? "SEARCHING..." : timeLeft}
                  </h3>
                </div>
                <span className="material-symbols-outlined text-4xl text-electric-blue">timer</span>
              </div>
              <div className="flex-grow flex items-center justify-center">
                <img className="w-full h-auto max-h-[250px] object-contain" data-alt="A stylized, flat-design illustration of a diverse group of young developers working intensely around a cluttered table with laptops. The illustration uses bold black outlines and a vibrant palette of deep navy, electric blue, and crisp white to match a modern, high-energy hackathon aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAThiZ96bZmCOUnYVfaHFYmG-a3Q5QOog8xaZK_2znm1IrHVlMO_f2YYhyS5a6pk3aGFIxSG2OmmL16G9WCGfnWJA899_CMjVgBT5dpHd_OY3sqkVlaVo_6Q6KEB9ElyI-m6pO92rmtDlpdkaT2CS9vxzJdGnCGVURSL6Xhgw_NWXA65CM9FUIxCcORGwLDHu7I03rhwOQK_rEaysg4jSZ-86pgLK6_63PDtXWvA4FCCge5Uw34MKA6" />
              </div>
              <div className="mt-4 pt-4 border-t-2 border-stark-black flex justify-between items-center">
                <span className="font-label-bold text-label-bold bg-secondary-fixed text-on-secondary-fixed px-3 py-1 rounded-full">
                  {stats.activeHackathon ? `#${stats.activeHackathon.slug}` : '#CodeSrijanOffensive'}
                </span>
                <span className="font-label-bold text-label-bold text-stark-black">{stats.activeHackathon?.venue || 'Online & Offline'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/*Ticker*/}
      <div className="ticker-wrap font-headline-lg text-headline-lg uppercase italic tracking-wider">
        <div className="ticker">
          BIGGEST HACKATHON • STUDENT RUN • BIGGEST HACKATHON • STUDENT RUN • BIGGEST HACKATHON • STUDENT RUN • BIGGEST HACKATHON • STUDENT RUN • BIGGEST HACKATHON • STUDENT RUN •
        </div>
      </div>
      {/*Stats Section*/}
      <section className="py-section-gap bg-surface-container px-gutter">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-headline-xl text-headline-xl text-center text-stark-black mb-12 uppercase">The Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/*Stat 1*/}
            <div className="bg-pure-white p-6 brutal-border brutal-shadow text-center hover:-translate-y-2 transition-transform duration-300">
              <span className="material-symbols-outlined text-4xl text-electric-blue mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              <h3 className="font-display-lg text-display-lg text-stark-black leading-none mb-2">{loading ? "..." : `${stats.hackersCount}+`}</h3>
              <p className="font-label-bold text-label-bold text-on-surface-variant uppercase">Hackers</p>
            </div>
            {/*Stat 2*/}
            <div className="bg-pure-white p-6 brutal-border brutal-shadow text-center hover:-translate-y-2 transition-transform duration-300">
              <span className="material-symbols-outlined text-4xl text-electric-blue mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
              <h3 className="font-display-lg text-display-lg text-stark-black leading-none mb-2">{loading ? "..." : `${stats.projectsCount}+`}</h3>
              <p className="font-label-bold text-label-bold text-on-surface-variant uppercase">Projects</p>
            </div>
            {/*Stat 3*/}
            <div className="bg-pure-white p-6 brutal-border brutal-shadow text-center hover:-translate-y-2 transition-transform duration-300">
              <span className="material-symbols-outlined text-4xl text-electric-blue mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
              <h3 className="font-display-lg text-display-lg text-stark-black leading-none mb-2">{loading ? "..." : `${stats.registrationsCount}`}</h3>
              <p className="font-label-bold text-label-bold text-on-surface-variant uppercase">Registrations</p>
            </div>
            {/*Stat 4*/}
            <div className="bg-pure-white p-6 brutal-border brutal-shadow text-center hover:-translate-y-2 transition-transform duration-300">
              <span className="material-symbols-outlined text-4xl text-electric-blue mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              <h3 className="font-display-lg text-display-lg text-stark-black leading-none mb-2">{loading ? "..." : `${stats.collegesCount}+`}</h3>
              <p className="font-label-bold text-label-bold text-on-surface-variant uppercase">Colleges</p>
            </div>
          </div>
        </div>
      </section>
      {/*Footer*/}
    </div>
  );
}
