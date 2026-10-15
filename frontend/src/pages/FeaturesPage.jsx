import FeatureImportanceChart from '../components/FeatureImportanceChart'

export default function FeaturesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-[var(--color-line)] pb-4">
        <div className="flex items-center gap-2">
          <span className="accent-label text-xs font-semibold tracking-wider uppercase">Module 02</span>
          <span className="phase-chip text-[0.65rem]">Global Explainability</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold mt-1 text-[var(--color-ink)]">
          Global Feature Importance
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-0.5">
          Recursive Feature Elimination with Cross-Validation (RFECV) identified the 5 essential hardware drivers governing handset pricing.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <FeatureImportanceChart />
        </div>

        {/* Feature selection table & notes */}
        <div className="lg:col-span-4 space-y-4">
          <div className="panel p-5 rounded-2xl border border-[var(--color-line)] space-y-3">
            <h3 className="font-display text-base font-bold text-[var(--color-ink)]">
              Primary Selected Drivers
            </h3>
            <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
              These 5 features govern &gt;96% of the price variance across all four tiers:
            </p>
            <ol className="space-y-2 text-xs list-decimal list-inside font-medium text-[var(--color-ink)]">
              <li className="p-2 rounded-lg bg-[var(--color-field-bg)] border border-[var(--color-line)]">
                <span className="font-bold text-[var(--color-accent)]">RAM</span> — Governs multi-tasking headroom and primary tier discrimination.
              </li>
              <li className="p-2 rounded-lg bg-[var(--color-field-bg)] border border-[var(--color-line)]">
                <span className="font-bold text-[var(--color-accent)]">Battery Power</span> — Major discriminator between budget and premium tiers.
              </li>
              <li className="p-2 rounded-lg bg-[var(--color-field-bg)] border border-[var(--color-line)]">
                <span className="font-bold text-[var(--color-accent)]">Pixel Width</span> — Display resolution driver.
              </li>
              <li className="p-2 rounded-lg bg-[var(--color-field-bg)] border border-[var(--color-line)]">
                <span className="font-bold text-[var(--color-accent)]">Pixel Height</span> — Display quality and density driver.
              </li>
              <li className="p-2 rounded-lg bg-[var(--color-field-bg)] border border-[var(--color-line)]">
                <span className="font-bold text-[var(--color-accent)]">Mobile Weight</span> — Physical chassis build and battery density factor.
              </li>
            </ol>
          </div>

          <div className="panel p-5 rounded-2xl border border-[var(--color-line)] space-y-2">
            <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">
              Eliminated Noise Attributes (15)
            </h3>
            <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
              Attributes like <code>wifi</code>, <code>bluetooth</code>, <code>talk_time</code>, and <code>four_g</code> were eliminated by RFECV because they exhibit near-universal saturation across all tiers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
