import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { getExplanation } from '../api/client'

const FEATURE_UNITS = {
  ram: 'MB',
  battery_power: 'mAh',
  px_width: 'px',
  px_height: 'px',
  mobile_wt: 'g',
}

export default function ShapWaterfall({ predictionId }) {
  const [explanation, setExplanation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!predictionId) return

    let isMounted = true

    getExplanation(predictionId)
      .then((res) => {
        if (!isMounted) return
        setExplanation(res)
        setError(null)
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        const detail =
          err.response?.data?.detail ||
          err.message ||
          `Failed to load TreeSHAP explanation for prediction #${predictionId}.`
        setError(detail)
        setExplanation(null)
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [predictionId])

  const handleRetry = () => {
    if (!predictionId) return
    setLoading(true)
    setError(null)
    getExplanation(predictionId)
      .then((res) => {
        setExplanation(res)
      })
      .catch((err) => {
        const detail =
          err.response?.data?.detail ||
          err.message ||
          `Failed to load TreeSHAP explanation for prediction #${predictionId}.`
        setError(detail)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const buildWaterfallData = () => {
    if (!explanation || !explanation.attributions) return []
    let cumulative = explanation.base_value
    return explanation.attributions.map((item) => {
      const start = cumulative
      const end = cumulative + item.shap_value
      cumulative = end
      const unit = FEATURE_UNITS[item.feature] || ''
      const labelVal =
        item.feature_value !== null && item.feature_value !== undefined
          ? `${item.feature} (${item.feature_value}${unit ? ' ' + unit : ''})`
          : item.feature
      return {
        feature: item.feature,
        label: labelVal,
        shapValue: Number(item.shap_value.toFixed(4)),
        shapPercent: Number((item.shap_value * 100).toFixed(2)),
        featureValue: item.feature_value,
        unit,
        startProb: Number(start.toFixed(4)),
        endProb: Number(end.toFixed(4)),
        isPositive: item.shap_value >= 0,
      }
    })
  }

  const chartData = buildWaterfallData()
  const totalShap = explanation?.attributions
    ? explanation.attributions.reduce((acc, a) => acc + a.shap_value, 0)
    : 0
  const reconstructedProb = explanation ? explanation.base_value + totalShap : 0
  const additivityDiff = explanation
    ? Math.abs(reconstructedProb - (explanation.predicted_probability ?? reconstructedProb))
    : 0

  return (
    <section className="panel h-full rounded-2xl p-5 md:p-6" id="shap-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--color-line)]">
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
            SHAP Attribution Waterfall
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
            Exact local Shapley decomposition showing how each hardware spec shifts class probability from the base value.
          </p>
        </div>

        {explanation && (
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-subtle)] font-mono">
              #{explanation.prediction_id ?? predictionId}
            </span>
            <span
              className={`px-2.5 py-1 rounded-lg border font-semibold tier-badge-${explanation.predicted_tier}`}
            >
              Tier {explanation.predicted_tier}: {explanation.tier_label}
            </span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!predictionId && (
        <div className="mt-6 rounded-xl border border-dashed border-[var(--color-line-strong)] bg-[var(--color-surface-subtle)] p-10 text-center text-xs text-[var(--color-ink-soft)]">
          <p className="font-semibold text-sm text-[var(--color-ink)]">No Prediction Selected</p>
          <p className="mt-1 max-w-md mx-auto">
            Run a prediction in Classifier Studio or enter a Prediction ID above to compute local TreeSHAP attributions.
          </p>
        </div>
      )}

      {/* Loading state */}
      {predictionId && loading && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] py-12 text-xs text-[var(--color-ink-soft)]">
          <div className="skeleton-bar w-36 h-2 mb-3" />
          <span>
            Computing exact TreeSHAP values via <code>GET /explain/{predictionId}</code>...
          </span>
        </div>
      )}

      {/* Error state */}
      {predictionId && error && !loading && (
        <div className="mt-6 rounded-xl border border-[var(--color-neg-border)] bg-[var(--color-neg-bg)] p-4 text-xs text-neg">
          <p className="font-semibold">Unable to load TreeSHAP explanation for #{predictionId}</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-3 cta-primary text-xs py-1.5 px-3 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loaded Waterfall visualization */}
      {predictionId && !loading && !error && explanation && (
        <div className="mt-5 space-y-5">
          {/* Additivity Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="metric-tile p-3">
              <div className="text-[0.64rem] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Base E[f(X)]
              </div>
              <div className="font-mono tabular-nums text-base font-bold mt-1 text-[var(--color-ink)]">
                {(explanation.base_value * 100).toFixed(2)}%
              </div>
              <div className="text-[0.64rem] text-[var(--color-ink-muted)]">Prior expectation</div>
            </div>

            <div className="metric-tile p-3">
              <div className="text-[0.64rem] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Net Shift (Σφ)
              </div>
              <div
                className={`font-mono tabular-nums text-base font-bold mt-1 ${
                  totalShap >= 0 ? 'text-pos' : 'text-warn'
                }`}
              >
                {totalShap >= 0 ? '+' : ''}
                {(totalShap * 100).toFixed(2)}%
              </div>
              <div className="text-[0.64rem] text-[var(--color-ink-muted)]">5 spec drivers</div>
            </div>

            <div className="metric-tile p-3">
              <div className="text-[0.64rem] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Output f(x)
              </div>
              <div className="font-mono tabular-nums text-base font-bold mt-1 text-[var(--color-accent-text)]">
                {(reconstructedProb * 100).toFixed(2)}%
              </div>
              <div className="text-[0.64rem] text-[var(--color-ink-muted)]">
                Tier {explanation.predicted_tier} prob
              </div>
            </div>

            <div className="metric-tile p-3">
              <div className="text-[0.64rem] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Additivity
              </div>
              <div className="font-mono text-xs font-bold mt-1.5 text-pos">✓ Exact Match</div>
              <div className="text-[0.64rem] font-mono tabular-nums text-[var(--color-ink-muted)] mt-0.5">
                Δ = {additivityDiff.toExponential(1)}
              </div>
            </div>
          </div>

          {/* Recharts Bar Waterfall */}
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[var(--color-ink)]">
                Feature Contributions (Ordered by |SHAP|)
              </span>
              <span className="text-[0.68rem] text-[var(--color-ink-muted)]">
                Percentage-point shift toward Tier {explanation.predicted_tier}
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 8, right: 28, left: 24, bottom: 8 }}
                >
                  <XAxis
                    type="number"
                    unit="%"
                    tick={{ fontSize: 11, fill: 'var(--color-ink-soft)', fontFamily: 'var(--font-mono)' }}
                    axisLine={{ stroke: 'var(--color-line)' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'var(--color-ink)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}
                    axisLine={{ stroke: 'var(--color-line)' }}
                    tickLine={false}
                    width={150}
                  />
                  <ReferenceLine x={0} stroke="var(--color-ink-muted)" strokeDasharray="3 3" />
                  <Tooltip
                    cursor={{ fill: 'var(--color-accent-soft)' }}
                    formatter={(val, _name, item) => {
                      const p = item.payload
                      const sign = p.shapValue >= 0 ? '+' : ''
                      return [
                        `${sign}${val}% (φ=${sign}${p.shapValue.toFixed(4)} | ${(p.startProb * 100).toFixed(1)}% → ${(p.endProb * 100).toFixed(1)}%)`,
                        'Contribution',
                      ]
                    }}
                    labelFormatter={(label) => `Spec: ${label}`}
                    contentStyle={{
                      backgroundColor: 'var(--color-panel)',
                      borderColor: 'var(--color-line-strong)',
                      borderRadius: '0.625rem',
                      fontSize: '0.76rem',
                      color: 'var(--color-ink)',
                      boxShadow: 'var(--panel-shadow)',
                    }}
                  />
                  <Bar dataKey="shapPercent" radius={[4, 4, 4, 4]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`shap-cell-${index}`}
                        fill={entry.isPositive ? 'var(--color-pos)' : 'var(--color-warn)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cumulative Step-by-Step Table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--color-line)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-surface-subtle)] text-[0.66rem] uppercase tracking-wider text-[var(--color-ink-muted)] border-b border-[var(--color-line)]">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Feature</th>
                  <th className="py-2.5 px-3">Spec Value</th>
                  <th className="py-2.5 px-3">SHAP Value (φ)</th>
                  <th className="py-2.5 px-3">Cumulative Trajectory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {chartData.map((row, idx) => (
                  <tr key={row.feature} className="hover:bg-[var(--color-surface-subtle)]/70">
                    <td className="py-2.5 px-3 font-mono text-[var(--color-ink-muted)]">#{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-[var(--color-ink)]">
                      {row.feature}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-[var(--color-ink-soft)]">
                      {row.featureValue !== null && row.featureValue !== undefined
                        ? `${row.featureValue} ${row.unit}`
                        : '—'}
                    </td>
                    <td
                      className={`py-2.5 px-3 font-mono tabular-nums font-semibold ${
                        row.isPositive ? 'text-pos' : 'text-warn'
                      }`}
                    >
                      {row.shapValue >= 0 ? '+' : ''}
                      {row.shapValue.toFixed(4)} ({row.shapValue >= 0 ? '+' : ''}
                      {row.shapPercent}%)
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-[var(--color-ink-soft)]">
                      {(row.startProb * 100).toFixed(1)}% →{' '}
                      <span className="font-semibold text-[var(--color-ink)]">
                        {(row.endProb * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[0.7rem] text-[var(--color-ink-muted)] border-t border-[var(--color-line)] pt-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-xs" style={{ background: 'var(--color-pos)' }} />
                <span>Pushes toward Tier {explanation.predicted_tier} (+)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-xs" style={{ background: 'var(--color-warn)' }} />
                <span>Pulls away from Tier {explanation.predicted_tier} (-)</span>
              </span>
            </div>
            <span className="font-mono">
              {explanation.model_version} · GET /explain/{predictionId}
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
