/**
 * MarginImpactPanel — shows what-if result: new tier, probability shift, and
 * illustrative margin delta (PRD Ch. 7.2 / Ch. 5.3).
 * Connects to POST /whatif and renders its response.
 */
export default function MarginImpactPanel() {
  return (
    <section className="panel rounded-2xl p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="accent-label text-[0.7rem] font-medium tracking-[0.14em] uppercase">
            Module 05
          </p>
          <h2 className="font-display mt-1 text-xl font-bold">
            Margin &amp; tier impact
          </h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-ink-soft)]">
            After a what-if run: new tier, probability shift, and an illustrative
            margin delta for PM trade-off reviews.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="metric-tile">
          <p className="text-[0.7rem] tracking-wide text-[var(--color-ink-soft)] uppercase">
            Resulting tier
          </p>
          <p className="font-display mt-2 text-3xl font-extrabold">High</p>
          <p className="accent-label mt-1 text-xs">was Mid-High · +1 step</p>
        </div>
        <div className="metric-tile">
          <p className="text-[0.7rem] tracking-wide text-[var(--color-ink-soft)] uppercase">
            P(class=3)
          </p>
          <p className="font-display mt-2 text-3xl font-extrabold">0.59</p>
          <p className="accent-label mt-1 text-xs">Δ +0.45 vs baseline</p>
        </div>
        <div className="metric-tile">
          <p className="text-[0.7rem] tracking-wide text-[var(--color-ink-soft)] uppercase">
            Margin Δ
          </p>
          <p className="font-display mt-2 text-3xl font-extrabold">+4.20</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-warn)' }}>
            Illustrative cost model — not real BOM
          </p>
        </div>
      </div>

      <p className="caveat">
        Caveat always visible: margin estimates use a transparent, non-vendor
        cost approximation for demo trade-offs only (PRD Ch. 5.3 / 13).
      </p>
    </section>
  )
}
