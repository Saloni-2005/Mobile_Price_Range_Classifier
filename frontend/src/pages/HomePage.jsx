import { Link } from 'react-router-dom'

const WORKSPACE_MODULES = [
  {
    to: '/predict',
    tag: 'Inference',
    title: 'Classifier Studio',
    description:
      'Enter candidate hardware specs, run live inference via POST /predict, and inspect calibrated 4-tier probability distributions.',
  },
  {
    to: '/what-if',
    tag: 'Simulation',
    title: 'What-If & Margin Sandbox',
    description:
      'Stress-test RAM, battery, display, and weight sliders in real time to observe tier shifts and illustrative BOM margin deltas.',
  },
  {
    to: '/explain',
    tag: 'Explainability',
    title: 'TreeSHAP Studio',
    description:
      'Decompose any logged prediction ID into exact positive and negative Shapley contributions with verified additivity.',
  },
  {
    to: '/features',
    tag: 'Global Audit',
    title: 'Feature Importance',
    description:
      'Compare impurity-reduction weights across all 20 specs and inspect the 5 RFECV-retained hardware drivers.',
  },
  {
    to: '/model-card',
    tag: 'Governance',
    title: 'Model Card & Benchmarks',
    description:
      'Review 5-fold Stratified CV metrics, the 400-unit hold-out confusion matrix, and production artifact metadata.',
    wide: true,
  },
]

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="grid items-center gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-chip-border)] bg-[var(--color-chip-bg)] text-xs font-semibold text-[var(--color-accent-text)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            <span>Assisted Pricing Intelligence</span>
            <span className="opacity-40">·</span>
            <span className="font-mono text-[0.7rem]">v1.1.0-tuned-rfecv</span>
          </div>

          <h1 className="font-display text-4xl sm:text-[2.85rem] font-extrabold tracking-tight text-[var(--color-ink)] leading-[1.1]">
            Spec-driven price-tier decisions, without spreadsheet guesswork.
          </h1>

          <p className="max-w-xl text-sm sm:text-base text-[var(--color-ink-soft)] leading-relaxed">
            Evaluate candidate smartphone configurations, audit global RFECV hardware drivers, explain individual predictions with TreeSHAP, and simulate BOM margin trade-offs before committing tooling.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link to="/predict" className="cta-primary">
              Launch Classifier Studio →
            </Link>
            <Link to="/what-if" className="cta-ghost">
              Open What-If Sandbox
            </Link>
            <Link to="/model-card" className="cta-ghost">
              Model Card
            </Link>
          </div>
        </div>

        {/* Benchmark Telemetry Card */}
        <div className="lg:col-span-5">
          <div className="panel p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3.5">
              <div>
                <span className="text-[0.68rem] uppercase tracking-wider font-semibold text-[var(--color-ink-muted)] block">
                  Production Benchmark
                </span>
                <span className="font-display text-sm font-bold text-[var(--color-ink)]">
                  Hold-Out Evaluation (n = 400)
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[0.68rem] font-semibold border border-[var(--color-pos-border)] bg-[var(--color-pos-bg)] text-pos">
                Targets Exceeded
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--color-ink-soft)] font-medium">Hold-Out Accuracy</span>
                  <span className="font-mono font-bold text-pos tabular-nums">94.00%</span>
                </div>
                <div className="bar-track h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--color-accent)] rounded-full" style={{ width: '94%' }} />
                </div>
                <div className="flex justify-between text-[0.66rem] text-[var(--color-ink-muted)] mt-1">
                  <span>Target ≥ 90.0%</span>
                  <span className="font-mono tabular-nums">+4.0% headroom</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--color-ink-soft)] font-medium">Hold-Out Macro F1</span>
                  <span className="font-mono font-bold text-pos tabular-nums">0.9399</span>
                </div>
                <div className="bar-track h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--color-accent)] rounded-full" style={{ width: '94%' }} />
                </div>
                <div className="flex justify-between text-[0.66rem] text-[var(--color-ink-muted)] mt-1">
                  <span>Target ≥ 0.8800</span>
                  <span className="font-mono tabular-nums">ROC-AUC 0.9936</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--color-line)]">
                <div className="rounded-lg bg-[var(--color-surface-subtle)] border border-[var(--color-line)] p-2.5">
                  <span className="text-[0.65rem] uppercase tracking-wider text-[var(--color-ink-muted)] block">
                    Feature Reduction
                  </span>
                  <span className="font-mono text-sm font-bold text-[var(--color-ink)] tabular-nums mt-0.5 block">
                    5 / 20 <span className="text-[0.7rem] font-normal text-[var(--color-ink-soft)]">(-75%)</span>
                  </span>
                </div>
                <div className="rounded-lg bg-[var(--color-surface-subtle)] border border-[var(--color-line)] p-2.5">
                  <span className="text-[0.65rem] uppercase tracking-wider text-[var(--color-ink-muted)] block">
                    Severe Errors
                  </span>
                  <span className="font-mono text-sm font-bold text-pos tabular-nums mt-0.5 block">
                    0 <span className="text-[0.7rem] font-normal text-[var(--color-ink-soft)]">(2+ tier)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Balanced 3x2 Workspace Grid */}
      <section className="space-y-4">
        <div className="flex items-end justify-between border-b border-[var(--color-line)] pb-3">
          <div>
            <p className="accent-label text-[0.7rem] font-semibold tracking-wider uppercase">
              Workspace Modules
            </p>
            <h2 className="font-display text-2xl font-bold mt-0.5 text-[var(--color-ink)]">
              Pricing &amp; Explainability Suite
            </h2>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WORKSPACE_MODULES.map((mod) => (
            <Link
              key={mod.to}
              to={mod.to}
              className={`panel-interactive p-5 rounded-2xl flex flex-col justify-between no-underline text-[var(--color-ink)] group ${
                mod.wide ? 'sm:col-span-2 lg:col-span-2' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="phase-chip text-[0.62rem]">{mod.tag}</span>
                  <span className="text-xs text-[var(--color-ink-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all">
                    →
                  </span>
                </div>
                <h3 className="font-display text-base font-bold group-hover:text-[var(--color-accent-text)] transition-colors">
                  {mod.title}
                </h3>
                <p className="mt-1.5 text-xs text-[var(--color-ink-soft)] leading-relaxed">
                  {mod.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
