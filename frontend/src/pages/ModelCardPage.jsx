export default function ModelCardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-[var(--color-line)] pb-4">
        <div className="flex items-center gap-2">
          <span className="accent-label text-xs font-semibold tracking-wider uppercase">Governance</span>
          <span className="phase-chip text-[0.65rem]">PRD Chapter 13</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold mt-1 text-[var(--color-ink)]">
          Model Card — Mobile Price-Range Classifier
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-0.5">
          Production audit trail, evaluation benchmarks, and architecture documentation.
        </p>
      </div>

      {/* Benchmark Summary Table */}
      <section className="panel p-6 rounded-2xl border border-[var(--color-line)] space-y-4">
        <h2 className="font-display text-xl font-bold">Performance vs Targets (PRD Ch. 3)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-[var(--color-ink-soft)] uppercase text-[0.65rem]">
                <th className="py-2.5 pr-4">Model Pipeline</th>
                <th className="py-2.5 px-4">Features</th>
                <th className="py-2.5 px-4">5-Fold CV Accuracy</th>
                <th className="py-2.5 px-4">Hold-out Accuracy</th>
                <th className="py-2.5 px-4">Hold-out Macro F1</th>
                <th className="py-2.5 pl-4">Target Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              <tr>
                <td className="py-3 pr-4 font-medium">Baseline RF Model</td>
                <td className="py-3 px-4">20 (All)</td>
                <td className="py-3 px-4 font-mono">0.8661 ± 0.030</td>
                <td className="py-3 px-4 font-mono">87.50%</td>
                <td className="py-3 px-4 font-mono">0.8745</td>
                <td className="py-3 pl-4 text-[var(--color-ink-soft)]">Baseline Reference</td>
              </tr>
              <tr className="bg-[var(--color-chip-bg)] font-semibold">
                <td className="py-3 pr-4 text-[var(--color-accent)]">Tuned RFECV + RF Pipeline</td>
                <td className="py-3 px-4 text-[var(--color-accent)]">5 (Selected)</td>
                <td className="py-3 px-4 font-mono text-[var(--color-accent)]">0.9100 ± 0.022</td>
                <td className="py-3 px-4 font-mono text-emerald-600 font-bold">94.00%</td>
                <td className="py-3 px-4 font-mono text-emerald-600 font-bold">0.9399</td>
                <td className="py-3 pl-4 text-emerald-600 font-bold">Exceeds Targets (+4.00%)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Model Specs & Data Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="panel p-6 rounded-2xl border border-[var(--color-line)] space-y-3">
          <h2 className="font-display text-lg font-bold">Production Metadata</h2>
          <div className="space-y-2 text-xs divide-y divide-[var(--color-line)]">
            <div className="flex justify-between py-1.5">
              <span className="text-[var(--color-ink-soft)]">Model Architecture:</span>
              <span className="font-medium">RandomForestClassifier + RFECV</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[var(--color-ink-soft)]">Deployment Status:</span>
              <span className="font-semibold text-emerald-600">Production Active</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[var(--color-ink-soft)]">Artifact Path:</span>
              <span className="font-mono">artifacts/tuned_rfecv_rf.joblib</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[var(--color-ink-soft)]">Hyperparameters:</span>
              <span className="font-mono">n_est=100, depth=None, leaf=1</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[var(--color-ink-soft)]">Random Seed:</span>
              <span className="font-mono">42</span>
            </div>
          </div>
        </section>

        <section className="panel p-6 rounded-2xl border border-[var(--color-line)] space-y-3">
          <h2 className="font-display text-lg font-bold">Confusion Matrix (400 Test Units)</h2>
          <div className="font-mono text-xs p-3 rounded-xl bg-[var(--color-field-bg)] border border-[var(--color-line)] overflow-x-auto leading-relaxed">
            <div>                Pred 0  Pred 1  Pred 2  Pred 3</div>
            <div className="text-emerald-600 font-semibold">Actual Tier 0:     96       4       0       0</div>
            <div className="text-emerald-600 font-semibold">Actual Tier 1:      3      92       5       0</div>
            <div className="text-emerald-600 font-semibold">Actual Tier 2:      0       7      87       6</div>
            <div className="text-emerald-600 font-semibold">Actual Tier 3:      0       0       0     101</div>
          </div>
          <p className="text-[0.7rem] text-[var(--color-ink-soft)]">
            High precision across all four tiers; tier 3 (flagship) achieved 100% recall with 0 misclassifications.
          </p>
        </section>
      </div>
    </div>
  )
}
