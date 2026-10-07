import WhatIfSliders from '../components/WhatIfSliders'
import MarginImpactPanel from '../components/MarginImpactPanel'

export default function WhatIfPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-[var(--color-line)] pb-4">
        <div className="flex items-center gap-2">
          <span className="accent-label text-xs font-semibold tracking-wider uppercase">Module 04 & 05</span>
          <span className="phase-chip text-[0.65rem]">Simulation Preview</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold mt-1 text-[var(--color-ink)]">
          What-If & Margin Sandbox
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-0.5">
          Simulate real-time spec modifications to observe threshold transitions and bill-of-materials (BOM) margin impact.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <WhatIfSliders />
        </div>
        <div className="lg:col-span-6">
          <MarginImpactPanel />
        </div>
      </div>
    </div>
  )
}
