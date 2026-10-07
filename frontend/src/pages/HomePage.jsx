import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="grid items-center gap-8 md:grid-cols-12">
        <div className="md:col-span-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-chip-border)] bg-[var(--color-chip-bg)] text-xs font-semibold text-[var(--color-accent-text)]">
            <span>Enterprise Pricing Engine</span>
            <span>·</span>
            <span>Stratified RFECV Active</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--color-ink)] leading-tight">
            Spec-driven price-tier decisions, without spreadsheet guesswork.
          </h1>

          <p className="max-w-2xl text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed">
            TierLab is an assisted pricing optimization engine for mobile hardware product managers.
            Classify price tiers, audit feature drivers, explain individual predictions with TreeSHAP, and simulate spec trade-offs.
          </p>

          <div className="flex flex-wrap gap-3 pt-3">
            <Link to="/predict" className="cta-primary no-underline">
              Launch Classifier Studio →
            </Link>
            <Link to="/features" className="cta-ghost no-underline">
              Inspect Feature Importance
            </Link>
            <Link to="/model-card" className="cta-ghost no-underline">
              Model Card & Governance
            </Link>
          </div>
        </div>

        {/* Floating KPI card */}
        <div className="md:col-span-4">
          <div className="panel p-6 rounded-2xl space-y-4 border border-[var(--color-line)] shadow-lg">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-[var(--color-ink-soft)]">
                Active Benchmark
              </span>
              <span className="phase-chip text-[0.65rem]">Production</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--color-ink-soft)]">Hold-Out Accuracy</span>
                  <span className="font-mono font-bold text-[var(--color-accent)]">94.00%</span>
                </div>
                <div className="bar-track h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--color-accent)] rounded-full" style={{ width: '94%' }} />
                </div>
                <span className="text-[0.65rem] text-[var(--color-ink-soft)]">Target: ≥90.0% (Exceeded)</span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--color-ink-soft)]">Hold-Out Macro F1</span>
                  <span className="font-mono font-bold text-[var(--color-accent)]">0.9399</span>
                </div>
                <div className="bar-track h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--color-accent)] rounded-full" style={{ width: '94%' }} />
                </div>
                <span className="text-[0.65rem] text-[var(--color-ink-soft)]">Target: ≥0.8800 (Exceeded)</span>
              </div>

              <div className="pt-2 border-t border-[var(--color-line)] flex justify-between text-xs">
                <span className="text-[var(--color-ink-soft)]">Feature Reduction</span>
                <span className="font-semibold text-[var(--color-ink)]">5 of 20 (75% less)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Navigation Cards */}
      <section className="space-y-4">
        <div>
          <p className="accent-label text-xs font-semibold tracking-wider uppercase">Platform Modules</p>
          <h2 className="font-display text-2xl font-bold mt-1">Explore Pricing Engine Tools</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/predict"
            className="panel p-6 rounded-2xl block no-underline text-[var(--color-ink)] hover:border-[var(--color-accent)] transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--color-accent)]">Module 01</span>
              <span className="text-xs text-[var(--color-ink-soft)] group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <h3 className="font-display text-lg font-bold group-hover:text-[var(--color-accent)] transition-colors">
              Classifier Studio
            </h3>
            <p className="mt-2 text-xs text-[var(--color-ink-soft)] leading-relaxed">
              Enter candidate hardware specifications, execute live inference via <code>POST /predict</code>, and inspect class confidence distributions.
            </p>
          </Link>

          <Link
            to="/features"
            className="panel p-6 rounded-2xl block no-underline text-[var(--color-ink)] hover:border-[var(--color-accent)] transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--color-accent)]">Module 02</span>
              <span className="text-xs text-[var(--color-ink-soft)] group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <h3 className="font-display text-lg font-bold group-hover:text-[var(--color-accent)] transition-colors">
              Feature Importance
            </h3>
            <p className="mt-2 text-xs text-[var(--color-ink-soft)] leading-relaxed">
              View RFECV ranking and Random Forest impurity reduction scores across all 20 specs. Filter top 5 selected vs eliminated features.
            </p>
          </Link>

          <Link
            to="/explain"
            className="panel p-6 rounded-2xl block no-underline text-[var(--color-ink)] hover:border-[var(--color-accent)] transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--color-accent)]">Module 03</span>
              <span className="text-xs text-[var(--color-ink-soft)] group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <h3 className="font-display text-lg font-bold group-hover:text-[var(--color-accent)] transition-colors">
              TreeSHAP Studio
            </h3>
            <p className="mt-2 text-xs text-[var(--color-ink-soft)] leading-relaxed">
              Audit local feature attributions for any logged prediction ID. Discover exactly which hardware specs drove the model’s tier decision.
            </p>
          </Link>

          <Link
            to="/what-if"
            className="panel p-6 rounded-2xl block no-underline text-[var(--color-ink)] hover:border-[var(--color-accent)] transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--color-ink-soft)]">Module 04 & 05</span>
              <span className="phase-chip text-[0.6rem]">Simulation</span>
            </div>
            <h3 className="font-display text-lg font-bold">
              What-If & Margin Sandbox
            </h3>
            <p className="mt-2 text-xs text-[var(--color-ink-soft)] leading-relaxed">
              Interactive sliders and simulated margin impact calculators to stress-test BOM cost versus retail price tier before committing tooling.
            </p>
          </Link>

          <Link
            to="/model-card"
            className="panel p-6 rounded-2xl block no-underline text-[var(--color-ink)] hover:border-[var(--color-accent)] transition-all group sm:col-span-2 lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--color-accent)]">Governance</span>
              <span className="text-xs text-[var(--color-ink-soft)] group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <h3 className="font-display text-lg font-bold group-hover:text-[var(--color-accent)] transition-colors">
              Model Card & Technical Validation
            </h3>
            <p className="mt-2 text-xs text-[var(--color-ink-soft)] leading-relaxed">
              Complete documentation per PRD Chapter 13: 5-fold Stratified CV splits, confusion matrix on 400 hold-out test units, and RFECV elimination log.
            </p>
          </Link>
        </div>
      </section>
    </div>
  )
}
