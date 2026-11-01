import { useAppStore } from "../lib/store";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/challenge")({
  component: Page9,
  head: () => ({
    meta: [
      { title: "Challenge Detail | CodeSrijan" },
      { name: "description", content: "CodeSrijan challenge detail — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:title", content: "Challenge Detail | CodeSrijan" },
      { property: "og:description", content: "CodeSrijan challenge detail — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/challenge" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/challenge" }],
  }),
});

function Page9() {
  const { currentUser, teams, problems, isLoaded } = useAppStore();
  const team = teams.find(item => item.id === currentUser?.teamId);
  const problem = problems.find(item => item.id === (team?.problemId || team?.problemStatementId));
  if (!isLoaded) return <p className="p-8">Loading challenge...</p>;
  if (!problem) return <main className="max-w-4xl mx-auto px-4 py-12 space-y-6 min-h-[60vh]">
    <h1 className="font-headline-lg text-3xl">No challenge selected</h1>
    <p>Browse the published problem statements and select a challenge for your squad.</p>
    <Link to="/problems" className="inline-block border-2 border-black p-3 font-bold">Browse problem statements</Link>
  </main>;
  return <main className="max-w-4xl mx-auto px-4 py-12 space-y-6">
    <h1 className="font-headline-lg text-3xl">{problem.title}</h1>
    <p className="whitespace-pre-wrap">{problem.fullDescription || problem.description}</p>
    {problem.requirements?.length ? <section><h2 className="text-xl font-bold">Requirements</h2><ul className="list-disc pl-6">{problem.requirements.map(item => <li key={item}>{item}</li>)}</ul></section> : null}
    {problem.constraints?.length ? <section><h2 className="text-xl font-bold">Technical constraints</h2><ul className="list-disc pl-6">{problem.constraints.map(item => <li key={item}>{item}</li>)}</ul></section> : null}
    <Link to="/workspace" className="inline-block border-2 border-black p-3 font-bold">Open squad workspace</Link>
  </main>;
}
