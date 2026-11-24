const CONFUSION_MATRIX = [
  { actual: 'Tier 0 (Low)', values: [99, 1, 0, 0] },
  { actual: 'Tier 1 (Mid)', values: [5, 89, 6, 0] },
  { actual: 'Tier 2 (Mid-High)', values: [0, 4, 93, 3] },
  { actual: 'Tier 3 (High)', values: [0, 0, 5, 95] },
]

export default function ModelCardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-[var(--color-line)] pb-5">
        <div className="flex items-center gap-2">
          <span className="accent-label text-[0.7rem] font-semibold tracking-wider uppercase">
            Governance
          </span>
          <span className="phase-chip text-[0.62rem]">Model Audit</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold mt-1 text-[var(--color-ink)]">
          Model Card &amp; Technical Validation
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">
          Production audit trail, cross-validation vs. hold-out benchmarks, and confusion matrix error breakdown.
        </p>
      </div>

      {/* Benchmark Summary Table */}
      <section className="panel p-5 md:p-6 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
            Performance vs. Committed Targets
          </h2>
          <span className="text-xs font-mono text-[var(--color-ink-muted)]">
            Hold-out split: n = 400 (seed = 42)
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[var(--color-line)]">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[var(--color-surface-subtle)] border-b border-[var(--color-line)] text-[var(--color-ink-muted)] uppercase text-[0.65rem] tracking-wider">
                <th className="py-2.5 px-4">Model Pipeline</th>
                <th className="py-2.5 px-4">Features</th>
                <th className="py-2.5 px-4">5-Fold CV Accuracy</th>
                <th className="py-2.5 px-4">Hold-Out Accuracy</th>
                <th className="py-2.5 px-4">Hold-Out Macro F1</th>
                <th className="py-2.5 px-4">Target Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              <tr>
                <td className="py-3 px-4 font-medium text-[var(--color-ink)]">Baseline RF Model</td>
                <td className="py-3 px-4 text-[var(--color-ink-soft)]">20 (All)</td>
                <td className="py-3 px-4 font-mono tabular-nums text-[var(--color-ink-soft)]">90.25% ± 1.21%</td>
                <td className="py-3 px-4 font-mono tabular-nums text-[var(--color-ink-soft)]">87.50%</td>
                <td className="py-3 px-4 font-mono tabular-nums text-[var(--color-ink-soft)]">0.8744</td>
                <td className="py-3 px-4 text-[var(--color-ink-muted)]">Baseline Reference</td>
              </tr>
              <tr className="bg-[var(--color-accent-soft)] font-semibold">
                <td className="py-3 px-4 text-[var(--color-accent-text)]">
                  Tuned RFECV + RF Pipeline
                </td>
                <td className="py-3 px-4 text-[var(--color-accent-text)]">5 (Selected)</td>
                <td className="py-3 px-4 font-mono tabular-nums text-[var(--color-ink)]">
                  92.56% ± 0.72%
                </td>
                <td className="py-3 px-4 font-mono tabular-nums text-pos font-bold">94.00%</td>
                <td className="py-3 px-4 font-mono tabular-nums text-pos font-bold">0.9399</td>
                <td className="py-3 px-4 text-pos font-bold">✓ Exceeds Targets (+4.0%)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Model Specs & Visual Confusion Matrix Heatmap */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="panel p-5 md:p-6 rounded-2xl space-y-3 lg:col-span-5">
          <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
            Production Metadata
          </h2>
          <div className="text-xs divide-y divide-[var(--color-line)]">
            <div className="flex justify-between py-2.5 gap-3">
              <span className="text-[var(--color-ink-soft)]">Architecture</span>
              <span className="font-medium text-[var(--color-ink)] text-right">
                RandomForestClassifier + RFECV
              </span>
            </div>
            <div className="flex justify-between py-2.5 gap-3">
              <span className="text-[var(--color-ink-soft)]">Model Version</span>
              <span className="font-mono text-[var(--color-accent-text)] font-semibold">
                v1.1.0-tuned-rfecv
              </span>
            </div>
            <div className="flex justify-between py-2.5 gap-3">
              <span className="text-[var(--color-ink-soft)]">Deployment Status</span>
              <span className="font-semibold text-pos">● Production Active</span>
            </div>
            <div className="flex justify-between py-2.5 gap-3">
              <span className="text-[var(--color-ink-soft)]">Artifact Path</span>
              <span className="font-mono text-[var(--color-ink)] text-right">
                artifacts/tuned_rfecv_rf.joblib
              </span>
            </div>
            <div className="flex justify-between py-2.5 gap-3">
              <span className="text-[var(--color-ink-soft)]">Multiclass ROC-AUC</span>
              <span className="font-mono tabular-nums font-bold text-pos">0.9936</span>
            </div>
            <div className="flex justify-between py-2.5 gap-3">
              <span className="text-[var(--color-ink-soft)]">Random Seed</span>
              <span className="font-mono text-[var(--color-ink)]">42</span>
            </div>
          </div>
        </section>

        {/* Visual 4x4 Heatmap */}
        <section className="panel p-5 md:p-6 rounded-2xl space-y-4 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
                Hold-Out Confusion Matrix
              </h2>
              <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                376 / 400 exact matches (94.0%). All 24 misses are single-tier boundary shifts; 0 severe errors.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[0.68rem] text-[var(--color-ink-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs border border-[var(--color-pos-border)] bg-[var(--color-pos-bg)]" />
                Exact
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs border border-[var(--color-warn-border)] bg-[var(--color-warn-bg)]" />
                ±1 Tier
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[420px]">
              {/* Column Headers */}
              <div className="grid grid-cols-5 gap-2 mb-2 text-[0.66rem] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] text-center">
                <div className="text-left pl-1">Actual ↓ / Pred →</div>
                <div>Pred T0</div>
                <div>Pred T1</div>
                <div>Pred T2</div>
                <div>Pred T3</div>
              </div>

              {/* Heatmap Rows */}
              <div className="space-y-2">
                {CONFUSION_MATRIX.map((row, rIdx) => (
                  <div key={row.actual} className="grid grid-cols-5 gap-2 items-center">
                    <div className="text-xs font-medium text-[var(--color-ink-soft)] pl-1 truncate">
                      {row.actual}
                    </div>
                    {row.values.map((val, cIdx) => {
                      const isDiag = rIdx === cIdx
                      const isMiss = !isDiag && val > 0
                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          className={`h-11 rounded-lg border flex flex-col items-center justify-center font-mono tabular-nums transition-colors ${
                            isDiag
                              ? 'border-[var(--color-pos-border)] bg-[var(--color-pos-bg)] text-pos font-bold text-sm'
                              : isMiss
                              ? 'border-[var(--color-warn-border)] bg-[var(--color-warn-bg)] text-warn font-semibold text-xs'
                              : 'border-[var(--color-line)] bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)]/60 text-xs'
                          }`}
                        >
                          <span>{val}</span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
