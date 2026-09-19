import fs from 'fs';
const routes = ['teams', 'problems', 'submissions', 'judges', 'mentors', 'announcements', 'leaderboard', 'certificates', 'recruitment', 'support', 'sponsors', 'gallery', 'analytics', 'logs', 'settings'];

routes.forEach(route => {
  const componentName = 'Admin' + route.charAt(0).toUpperCase() + route.slice(1);
  const content = `import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/${route}')({
  component: ${componentName}Component,
})

function ${componentName}Component() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-stark-black text-pure-white p-8 brutal-border brutal-shadow">
        <div className="flex items-center gap-4 mb-6 border-b-2 border-electric-blue pb-4">
            <span className="material-symbols-outlined text-4xl text-electric-blue">construction</span>
            <h2 className="font-headline-md text-headline-md italic tracking-tighter uppercase whitespace-nowrap">
                ${route} <span className="text-electric-blue">MATRIX</span>
            </h2>
        </div>
        <p className="font-body-md text-gray-300">
          [SYSTEM COMMAND]: The Admin ${route.toUpperCase()} control module is currently being scaffolded under the Phase 4 Mega-Spec architecture. Pending structural Database integration.
        </p>
      </div>
    </div>
  )
}
`;
  fs.writeFileSync(`src/routes/admin.${route}.tsx`, content);
});
console.log('Routes scaffolded successfully!');
