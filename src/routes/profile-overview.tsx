import { useAppStore } from "../lib/store";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/profile-overview")({
  component: Page8,
  head: () => ({
    meta: [
      { title: "Profile Overview | CodeSrijan" },
      { name: "description", content: "CodeSrijan profile overview — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:title", content: "Profile Overview | CodeSrijan" },
      { property: "og:description", content: "CodeSrijan profile overview — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/profile-overview" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/profile-overview" }],
  }),
});

function Page8() {
  const { currentUser, isLoaded, registrations, teams } = useAppStore();
  if (!isLoaded) return <p className="p-8">Loading profile...</p>;
  if (!currentUser) return <main className="p-8"><h1>Sign in to view your profile</h1><Link to="/login">Sign in</Link></main>;
  const team = teams.find(item => item.id === currentUser.teamId);
  return <main className="max-w-5xl mx-auto px-4 py-12 space-y-8">
    <section className="border-2 border-ink-black p-6 bg-white neo-shadow space-y-4">
      <h1 className="font-headline-lg text-3xl break-words">{currentUser.name}</h1>
      {currentUser.handle && <p>@{currentUser.handle}</p>}
      <p>{currentUser.bio || 'No bio added yet.'}</p>
      <p>{currentUser.college || 'College not provided'}</p>
      <Link to="/profile" className="inline-block border-2 border-black p-3 font-bold">View and edit profile</Link>
    </section>
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="border-2 border-black p-6"><h2 className="font-bold">Hackathon registrations</h2><p>{registrations.length}</p></div>
      <div className="border-2 border-black p-6"><h2 className="font-bold">Current squad</h2><p>{team?.name || 'No squad joined'}</p></div>
    </section>
    <section className="border-2 border-black p-6 space-y-4">
      <h2 className="font-bold text-xl">Current stack</h2>
      {currentUser.techStack?.length ? <ul className="flex flex-wrap gap-3">{currentUser.techStack.map(tech => <li key={tech} className="border-2 border-black px-3 py-1">{tech}</li>)}</ul> : <p>No technology stack added yet.</p>}
    </section>
  </main>;
}
