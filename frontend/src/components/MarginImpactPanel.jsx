const TIER_NAMES = ['Low', 'Mid', 'Mid-High', 'High']
const TIER_BADGES = [
  'bg-sky-500/15 text-sky-600 border-sky-500/30',
  'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  'bg-amber-500/15 text-amber-600 border-amber-500/30',
  'bg-purple-500/15 text-purple-600 border-purple-500/30',
]

/**
 * MarginImpactPanel — shows live POST /whatif result: new tier, probability shift,
 * and illustrative margin delta (PRD Ch. 7.2 / Ch. 5.3 / Ch. 15.3).
 */
export default function MarginImpactPanel({
  whatIfResult,
  baselinePrediction,
  loading = false,
  error = null,
}) {
  const baseTier =
    whatIfResult?.baseline_tier ?? baselinePrediction?.predicted_tier ?? 1
  const newTier =
    whatIfResult?.predicted_tier ?? baselinePrediction?.predicted_tier ?? 1
  const tierStepDelta = newTier - baseTier

  const baseLabel =
    whatIfResult?.baseline_label ??
    baselinePrediction?.tier_label ??
    TIER_NAMES[baseTier]
  const newLabel =
    whatIfResult?.tier_label ??
    baselinePrediction?.tier_label ??
    TIER_NAMES[newTier]

  const probabilities =
    whatIfResult?.probabilities ??
    baselinePrediction?.probabilities ?? [0.25, 0.25, 0.25, 0.25]
  const baseProbabilities =
    whatIfResult?.baseline_probabilities ??
    baselinePrediction?.probabilities ?? [0.25, 0.25, 0.25, 0.25]
  const probShifts =
    whatIfResult?.probability_shifts ?? [0.0, 0.0, 0.0, 0.0]

  const activeTierProb = probabilities[newTier] ?? 0
  const activeTierShift = probShifts[newTier] ?? 0

  const marginDelta = whatIfResult?.margin_estimate_delta ?? 0.0
  const marginEstimate = whatIfResult?.margin_estimate ?? null
  const marginPctDelta = whatIfResult?.margin_pct_delta ?? 0.0
  const baseBom = whatIfResult?.baseline_bom_usd ?? null
  const adjustedBom = whatIfResult?.adjusted_bom_usd ?? null
  const bomDelta = whatIfResult?.bom_cost_delta_usd ?? 0.0
  const baseMidpoint = whatIfResult?.baseline_tier_midpoint_usd ?? null
  const newMidpoint = whatIfResult?.resulting_tier_midpoint_usd ?? null

  const formatSigned = (val, decimals = 2, prefix = '') => {
    const num = Number(val || 0)
    const sign = num > 0 ? '+' : num < 0 ? '-' : '±'
    return `${sign}${prefix}${Math.abs(num).toFixed(decimals)}`
  }

  return (
    <section className="panel h-full rounded-2xl p-5 md:p-6 flex flex-col justify-between" id="margin-impact-panel">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="accent-label text-[0.7rem] font-semibold tracking-[0.14em] uppercase">
                Module 05
              </p>
              <span className="phase-chip text-[0.65rem]">
                {loading ? 'Recomputing...' : whatIfResult ? `Sim #${whatIfResult.simulation_id}` : 'Baseline State'}
              </span>
            </div>
            <h2 className="font-display mt-1 text-xl font-bold">
              Margin &amp; Tier Impact
            </h2>
            <p className="mt-1 max-w-xl text-sm text-[var(--color-ink-soft)]">
              Live response from <code className="font-mono text-xs">POST /whatif</code>: resulting price tier, class probability shifts, and illustrative margin delta.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-600">
            <strong>Simulation error:</strong> {error}
          </div>
        )}

        {/* Top 3 Primary Metric Tiles */}
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="metric-tile">
            <p className="text-[0.7rem] tracking-wide text-[var(--color-ink-soft)] uppercase">
              Resulting Tier
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="font-display text-3xl font-extrabold">{newLabel}</p>
              <span
                className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold border ${
                  TIER_BADGES[newTier] || TIER_BADGES[1]
                }`}
              >
                Tier {newTier}
              </span>
            </div>
            <p className="accent-label mt-1.5 text-xs">
              was {baseLabel} (Tier {baseTier}) ·{' '}
              {tierStepDelta === 0
                ? 'No tier step change'
                : `${tierStepDelta > 0 ? `+${tierStepDelta}` : tierStepDelta} tier step`}
            </p>
          </div>

          <div className="metric-tile">
            <p className="text-[0.7rem] tracking-wide text-[var(--color-ink-soft)] uppercase">
              P(class={newTier} · {newLabel})
            </p>
            <p className="font-display mt-2 text-3xl font-extrabold">
              {(activeTierProb * 100).toFixed(1)}%
            </p>
            <p className="accent-label mt-1.5 text-xs">
              Δ {formatSigned(activeTierShift * 100, 1)}% pts vs baseline
            </p>
          </div>

          <div className="metric-tile">
            <div className="flex items-center justify-between">
              <p className="text-[0.7rem] tracking-wide text-[var(--color-ink-soft)] uppercase">
                Illustrative Margin Δ
              </p>
              <span className="text-[0.62rem] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600">
                Illustrative
              </span>
            </div>
            <p
              className={`font-display mt-2 text-3xl font-extrabold ${
                marginDelta > 0
                  ? 'text-emerald-600'
                  : marginDelta < 0
                  ? 'text-rose-600'
                  : ''
              }`}
            >
              {formatSigned(marginDelta, 2, '$')}
            </p>
            <p className="mt-1.5 text-xs" style={{ color: 'var(--color-warn)' }}>
              {formatSigned(marginPctDelta, 2)}% pts · Non-vendor cost proxy
            </p>
          </div>
        </div>

        {/* Per-class Probability Shift Breakdown */}
        <div className="mt-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-field-bg)]/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
              Class Probability Distribution &amp; Shifts
            </h3>
            <span className="text-[0.68rem] text-[var(--color-ink-soft)]">
              Baseline → Simulated (Δ)
            </span>
          </div>

          <div className="space-y-3">
            {TIER_NAMES.map((tName, idx) => {
              const baseP = (baseProbabilities[idx] ?? 0) * 100
              const newP = (probabilities[idx] ?? 0) * 100
              const shiftP = (probShifts[idx] ?? 0) * 100
              const isPredicted = idx === newTier

              return (
                <div key={tName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${isPredicted ? 'font-bold text-[var(--color-ink)]' : 'text-[var(--color-ink-soft)]'}`}>
                      Tier {idx}: {tName} {isPredicted && '★'}
                    </span>
                    <span className="font-mono text-[0.72rem]">
                      <span className="text-[var(--color-ink-soft)]">{baseP.toFixed(1)}%</span>
                      {' → '}
                      <strong className="text-[var(--color-ink)]">{newP.toFixed(1)}%</strong>{' '}
                      <span
                        className={
                          shiftP > 0.05
                            ? 'text-emerald-600 font-semibold'
                            : shiftP < -0.05
                            ? 'text-rose-600 font-semibold'
                            : 'text-[var(--color-ink-soft)]'
                        }
                      >
                        ({formatSigned(shiftP, 1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--color-line)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isPredicted ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-ink-soft)]/50'
                      }`}
                      style={{ width: `${Math.max(2, Math.min(100, newP))}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Illustrative BOM Cost & Tier Midpoint Breakdown */}
        {whatIfResult && (
          <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-field-bg)]/40 p-4 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-[var(--color-ink)]">
              <span>Illustrative Economic Breakdown (Synthetic Linear Proxy)</span>
              <span className="text-[0.65rem] uppercase tracking-wider text-amber-600">
                Linear Proxy
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-line)]">
                <div className="text-[0.65rem] text-[var(--color-ink-soft)]">Tier Midpoint</div>
                <div className="font-mono font-bold mt-0.5">
                  ${baseMidpoint?.toFixed(0)} → ${newMidpoint?.toFixed(0)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-line)]">
                <div className="text-[0.65rem] text-[var(--color-ink-soft)]">Est. BOM Proxy</div>
                <div className="font-mono font-bold mt-0.5">
                  ${baseBom?.toFixed(2)} → ${adjustedBom?.toFixed(2)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-line)]">
                <div className="text-[0.65rem] text-[var(--color-ink-soft)]">BOM Cost Δ</div>
                <div className="font-mono font-bold mt-0.5">
                  {formatSigned(bomDelta, 2, '$')}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-line)]">
                <div className="text-[0.65rem] text-[var(--color-ink-soft)]">Est. Gross Margin</div>
                <div className="font-mono font-bold mt-0.5">
                  ${marginEstimate?.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Server-flagged Extrapolation Warning (PRD Ch. 15.3) */}
        {whatIfResult?.is_extrapolated && (
          <div
            role="status"
            className="mt-4 rounded-xl border border-amber-500/60 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300"
          >
            <strong>Backend Extrapolation Flag Active:</strong> Adjusted feature(s){' '}
            <code className="font-mono font-bold">
              {whatIfResult.extrapolated_features.join(', ')}
            </code>{' '}
            exceed the Kaggle training domain. Random Forest probability estimates plateau outside observed split thresholds.
          </div>
        )}
      </div>

      {/* Mandatory Always-Visible Caveat Banner (PRD Ch. 5.3 / 13) */}
      <div
        data-testid="illustrative-cost-caveat"
        className="caveat mt-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs leading-relaxed"
      >
        <strong className="uppercase tracking-wider text-[0.68rem] block mb-0.5">
          ⚠️ Illustrative Cost Model Caveat
        </strong>
        {whatIfResult?.caveat ||
          'Illustrative cost model — not real vendor BOM data. Margin figures combine predicted tier price midpoints ($125 / $225 / $400 / $650) with a transparent linear hardware cost approximation for directional trade-off exploration only.'}
      </div>
    </section>
  )
}
