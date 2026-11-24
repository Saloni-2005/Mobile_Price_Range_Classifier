import FeatureImportanceChart from '../components/FeatureImportanceChart'

const SELECTED_DRIVERS = [
  { name: 'RAM', desc: 'Governs multi-tasking headroom and primary tier discrimination.' },
  { name: 'Battery Power', desc: 'Major discriminator between budget and premium tiers.' },
  { name: 'Pixel Width', desc: 'Horizontal display resolution driver.' },
  { name: 'Pixel Height', desc: 'Vertical display resolution and panel density driver.' },
  { name: 'Mobile Weight', desc: 'Chassis build material and battery density indicator.' },
]

export default function FeaturesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-[var(--color-line)] pb-5">
        <div className="flex items-center gap-2">
          <span className="accent-label text-[0.7rem] font-semibold tracking-wider uppercase">
            Global Explainability
          </span>
          <span className="phase-chip text-[0.62rem]">RFECV Audit</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold mt-1 text-[var(--color-ink)]">
          Global Feature Importance
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">
          Recursive Feature Elimination with Cross-Validation (RFECV) isolated the 5 core hardware drivers governing handset pricing.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <FeatureImportanceChart />
        </div>

        {/* Feature selection notes */}
        <div className="lg:col-span-4 space-y-5">
          <div className="panel p-5 rounded-2xl space-y-3.5">
            <h3 className="font-display text-base font-bold text-[var(--color-ink)]">
              Retained Hardware Drivers (5)
            </h3>
            <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
              These 5 features carry 100% of active split weight in the production ensemble:
            </p>
            <ol className="space-y-2 text-xs">
              {SELECTED_DRIVERS.map((driver, idx) => (
                <li
                  key={driver.name}
                  className="p-2.5 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-line)] flex items-start gap-2.5"
                >
                  <span className="font-mono text-[0.68rem] font-bold text-[var(--color-accent-text)] mt-0.5">
                    0{idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-[var(--color-ink)]">{driver.name}</span>
                    <span className="text-[var(--color-ink-soft)]"> — {driver.desc}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="panel p-5 rounded-2xl space-y-2">
            <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">
              Eliminated Attributes (15)
            </h3>
            <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
              Attributes like <code className="font-mono">wifi</code>, <code className="font-mono">blue</code>, <code className="font-mono">talk_time</code>, and <code className="font-mono">four_g</code> were pruned by RFECV because they exhibit near-universal saturation across all four tiers and add split variance without accuracy gain.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
