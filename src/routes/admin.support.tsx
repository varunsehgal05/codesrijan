import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/support')({
  component: AdminSupportComponent,
})

function AdminSupportComponent() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-stark-black text-pure-white p-8 brutal-border brutal-shadow">
        <div className="flex items-center gap-4 mb-6 border-b-2 border-electric-blue pb-4">
            <span className="material-symbols-outlined text-4xl text-electric-blue">construction</span>
            <h2 className="font-headline-md text-headline-md italic tracking-tighter uppercase whitespace-nowrap">
                support <span className="text-electric-blue">MATRIX</span>
            </h2>
        </div>
        <p className="font-body-md text-gray-300">
          [SYSTEM COMMAND]: The Admin SUPPORT control module is currently being scaffolded under the Phase 4 Mega-Spec architecture. Pending structural Database integration.
        </p>
      </div>
    </div>
  )
}
