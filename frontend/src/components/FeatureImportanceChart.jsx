/**
 * FeatureImportanceChart — visualises RFECV-selected features ranked by
 * Random Forest importance (PRD Ch. 7.2). Connects to GET /feature-importance.
 * Displays a preview silhouette until the endpoint is live.
 */
const MOCK_RANKS = [
  { name: 'ram', importance: 0.34 },
  { name: 'battery_power', importance: 0.21 },
  { name: 'px_width', importance: 0.12 },
  { name: 'px_height', importance: 0.1 },
  { name: 'mobile_wt', importance: 0.08 },
]

export default function FeatureImportanceChart() {
  return (
    <section className="panel h-full rounded-2xl p-5 md:p-6">
      <div>
        <p className="accent-label text-[0.7rem] font-medium tracking-[0.14em] uppercase">
          Module 02
        </p>
        <h2 className="font-display mt-1 text-xl font-bold">
          Global importance
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          RFE-selected features ranked by Random Forest importance score.
        </p>
      </div>

      <ul className="mt-6 space-y-3">
        {MOCK_RANKS.map((row, i) => (
          <li key={row.name}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium">
                <span className="accent-label mr-2 text-xs">#{i + 1}</span>
                {row.name}
              </span>
              <span className="font-mono text-xs text-[var(--color-ink-soft)]">
                {(row.importance * 100).toFixed(0)}%
              </span>
            </div>
            <div className="bar-track h-2 rounded-full">
              <div
                className="skeleton-bar h-2 rounded-full"
                style={{
                  width: `${row.importance * 100}%`,
                  animationDelay: `${0.08 * i}s`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[0.7rem] text-[var(--color-ink-soft)]">
        Preview ranks — replaced by live data from /feature-importance.
      </p>
    </section>
  )
}
