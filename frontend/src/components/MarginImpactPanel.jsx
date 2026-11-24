const TIER_NAMES = ['Low', 'Mid', 'Mid-High', 'High']

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
    <section
      className="panel h-full rounded-2xl p-5 md:p-6 flex flex-col justify-between"
      id="margin-impact-panel"
    >
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--color-line)]">
          <div>
            <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
              Margin &amp; Tier Impact
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
              Live response from <code className="font-mono">POST /whatif</code> showing tier shifts and illustrative BOM economics.
            </p>
          </div>
          <span className="phase-chip text-[0.64rem]">
            {loading
              ? 'Recomputing...'
              : whatIfResult
              ? `Sim #${whatIfResult.simulation_id}`
              : 'Baseline'}
          </span>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[var(--color-neg-border)] bg-[var(--color-neg-bg)] p-3 text-xs text-neg">
            <strong>Simulation error:</strong> {error}
          </div>
        )}

        {/* Top 3 Primary Metric Tiles */}
        <div className="mt-5 grid gap-3.5 sm:grid-cols-3">
          <div className="metric-tile">
            <p className="text-[0.66rem] font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase">
              Resulting Tier
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <p className="font-display text-2xl font-extrabold text-[var(--color-ink)]">
                {newLabel}
              </p>
              <span
                className={`px-2 py-0.5 rounded-md text-[0.64rem] font-bold border tier-badge-${newTier}`}
              >
                T{newTier}
              </span>
            </div>
            <p className="mt-1.5 text-[0.7rem] text-[var(--color-ink-soft)]">
              was {baseLabel} ·{' '}
              <span className={tierStepDelta > 0 ? 'text-pos font-semibold' : tierStepDelta < 0 ? 'text-warn font-semibold' : ''}>
                {tierStepDelta === 0
                  ? 'No shift'
                  : `${tierStepDelta > 0 ? `+${tierStepDelta}` : tierStepDelta} tier`}
              </span>
            </p>
          </div>

          <div className="metric-tile">
            <p className="text-[0.66rem] font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase">
              P(Tier {newTier})
            </p>
            <p className="font-mono tabular-nums mt-2 text-2xl font-bold text-[var(--color-ink)]">
              {(activeTierProb * 100).toFixed(1)}%
            </p>
            <p
              className={`mt-1.5 text-[0.7rem] font-mono tabular-nums font-medium ${
                activeTierShift > 0.005
                  ? 'text-pos'
                  : activeTierShift < -0.005
                  ? 'text-neg'
                  : 'text-[var(--color-ink-soft)]'
              }`}
            >
              Δ {formatSigned(activeTierShift * 100, 1)}% pts
            </p>
          </div>

          <div className="metric-tile">
            <div className="flex items-center justify-between gap-1">
              <p className="text-[0.66rem] font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase">
                Margin Δ
              </p>
              <span className="text-[0.58rem] font-semibold uppercase px-1.5 py-0.5 rounded bg-[var(--color-warn-bg)] text-warn">
                Proxy
              </span>
            </div>
            <p
              className={`font-mono tabular-nums mt-2 text-2xl font-bold ${
                marginDelta > 0
                  ? 'text-pos'
                  : marginDelta < 0
                  ? 'text-neg'
                  : 'text-[var(--color-ink)]'
              }`}
            >
              {formatSigned(marginDelta, 2, '$')}
            </p>
            <p className="mt-1.5 text-[0.7rem] font-mono tabular-nums text-[var(--color-ink-soft)]">
              {formatSigned(marginPctDelta, 2)}% pts
            </p>
          </div>
        </div>

        {/* Per-class Probability Shift Breakdown */}
        <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[0.7rem] font-bold uppercase tracking-wider text-[var(--color-ink)]">
              Class Probability Shifts
            </h3>
            <span className="text-[0.66rem] text-[var(--color-ink-muted)]">
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
                    <span
                      className={
                        isPredicted
                          ? 'font-semibold text-[var(--color-ink)]'
                          : 'text-[var(--color-ink-soft)]'
                      }
                    >
                      Tier {idx}: {tName} {isPredicted && '★'}
                    </span>
                    <span className="font-mono tabular-nums text-[0.72rem]">
                      <span className="text-[var(--color-ink-muted)]">{baseP.toFixed(1)}%</span>
                      {' → '}
                      <strong className="text-[var(--color-ink)]">{newP.toFixed(1)}%</strong>{' '}
                      <span
                        className={
                          shiftP > 0.05
                            ? 'text-pos font-semibold'
                            : shiftP < -0.05
                            ? 'text-neg font-semibold'
                            : 'text-[var(--color-ink-muted)]'
                        }
                      >
                        ({formatSigned(shiftP, 1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bar-track overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(1.5, Math.min(100, newP))}%`,
                        backgroundColor: isPredicted
                          ? 'var(--color-accent)'
                          : 'color-mix(in srgb, var(--color-ink) 22%, transparent)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Illustrative BOM Cost & Tier Midpoint Breakdown */}
        {whatIfResult && (
          <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] p-4 text-xs space-y-2.5">
            <div className="flex items-center justify-between font-semibold text-[var(--color-ink)]">
              <span>Illustrative Economic Breakdown</span>
              <span className="text-[0.62rem] uppercase tracking-wider font-mono text-warn">
                Linear Proxy
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg bg-[var(--color-panel)] border border-[var(--color-line)]">
                <div className="text-[0.64rem] text-[var(--color-ink-muted)]">Tier Midpoint</div>
                <div className="font-mono tabular-nums font-bold mt-0.5 text-[var(--color-ink)]">
                  ${baseMidpoint?.toFixed(0)} → ${newMidpoint?.toFixed(0)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--color-panel)] border border-[var(--color-line)]">
                <div className="text-[0.64rem] text-[var(--color-ink-muted)]">Est. BOM Proxy</div>
                <div className="font-mono tabular-nums font-bold mt-0.5 text-[var(--color-ink)]">
                  ${baseBom?.toFixed(0)} → ${adjustedBom?.toFixed(0)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--color-panel)] border border-[var(--color-line)]">
                <div className="text-[0.64rem] text-[var(--color-ink-muted)]">BOM Cost Δ</div>
                <div
                  className={`font-mono tabular-nums font-bold mt-0.5 ${
                    bomDelta > 0 ? 'text-neg' : bomDelta < 0 ? 'text-pos' : 'text-[var(--color-ink)]'
                  }`}
                >
                  {formatSigned(bomDelta, 2, '$')}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--color-panel)] border border-[var(--color-line)]">
                <div className="text-[0.64rem] text-[var(--color-ink-muted)]">Gross Margin</div>
                <div className="font-mono tabular-nums font-bold mt-0.5 text-[var(--color-ink)]">
                  ${marginEstimate?.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Server-flagged Extrapolation Warning */}
        {whatIfResult?.is_extrapolated && (
          <div
            role="status"
            className="mt-4 rounded-xl border border-[var(--color-warn-border)] bg-[var(--color-warn-bg)] p-3 text-xs text-warn"
          >
            <strong>Backend OOD Flag Active:</strong> Adjusted feature(s){' '}
            <code className="font-mono font-bold">
              {whatIfResult.extrapolated_features.join(', ')}
            </code>{' '}
            exceed the training domain. Probabilities plateau outside observed leaf thresholds.
          </div>
        )}
      </div>

      {/* Mandatory Always-Visible Caveat Banner */}
      <div
        data-testid="illustrative-cost-caveat"
        className="caveat mt-5 leading-relaxed"
      >
        <strong className="uppercase tracking-wider text-[0.66rem] block mb-0.5">
          Illustrative Cost Model Caveat
        </strong>
        {whatIfResult?.caveat ||
          'Illustrative cost model — not real vendor BOM data. Margin figures combine predicted tier price midpoints ($125 / $225 / $400 / $650) with a transparent linear hardware cost approximation for directional trade-off exploration only.'}
      </div>
    </section>
  )
}
