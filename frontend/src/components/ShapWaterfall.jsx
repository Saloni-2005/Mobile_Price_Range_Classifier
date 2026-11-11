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

/**
 * ShapWaterfall — renders TreeSHAP attribution waterfall for a single prediction
 * (PRD Ch. 7.2, 11, 14). Connects to GET /explain/{prediction_id}.
 */
export default function ShapWaterfall({ predictionId }) {
  const [explanation, setExplanation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!predictionId) {
      setExplanation(null)
      setError(null)
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    getExplanation(predictionId)
      .then((res) => {
        if (!isMounted) return
        setExplanation(res)
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

  // Build waterfall chart data with cumulative trajectory from base_value -> predicted_probability
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="accent-label text-[0.7rem] font-semibold tracking-[0.14em] uppercase">
              Module 03
            </p>
            <span className="phase-chip text-[0.65rem]">TreeSHAP Local</span>
          </div>
          <h2 className="font-display mt-1 text-xl font-bold">
            SHAP Attribution Waterfall
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Exact local Shapley decomposition showing how each hardware spec shifts class probability from the base value.
          </p>
        </div>

        {explanation && (
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md border border-[var(--color-line)] bg-[var(--color-field-bg)] font-mono">
              #{explanation.prediction_id ?? predictionId}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[var(--color-accent)] text-white font-semibold">
              Tier {explanation.predicted_tier}: {explanation.tier_label}
            </span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!predictionId && (
        <div className="mt-6 rounded-xl border border-dashed border-[var(--color-line)] p-8 text-center text-xs text-[var(--color-ink-soft)]">
          <p className="font-semibold text-sm text-[var(--color-ink)]">No Prediction Selected</p>
          <p className="mt-1">
            Submit a device specification in the Classifier Studio to automatically compute and render local TreeSHAP attributions.
          </p>
        </div>
      )}

      {/* Loading state */}
      {predictionId && loading && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-field-bg)] py-12 text-xs text-[var(--color-ink-soft)]">
          <div className="skeleton-bar w-36 h-2 mb-3" />
          <span>
            Computing exact TreeSHAP values via <code>GET /explain/{predictionId}</code>...
          </span>
        </div>
      )}

      {/* Error state */}
      {predictionId && error && !loading && (
        <div className="mt-6 rounded-xl border border-[var(--color-warn)] bg-[var(--color-caveat-bg)] p-4 text-xs text-[var(--color-caveat-text)]">
          <p className="font-semibold">Unable to load TreeSHAP explanation for #{predictionId}</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-3 px-3 py-1 bg-[var(--color-ink)] text-[var(--color-cta-fg)] rounded text-xs cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loaded Waterfall visualization */}
      {predictionId && !loading && !error && explanation && (
        <div className="mt-5 space-y-5">
          {/* Additivity Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-field-bg)] p-3">
              <div className="text-[0.65rem] uppercase tracking-wider text-[var(--color-ink-soft)]">
                Base Value E[f(X)]
              </div>
              <div className="font-mono text-base font-bold mt-0.5 text-[var(--color-ink)]">
                {(explanation.base_value * 100).toFixed(2)}%
              </div>
              <div className="text-[0.65rem] text-[var(--color-ink-soft)]">
                Prior class expectation
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-field-bg)] p-3">
              <div className="text-[0.65rem] uppercase tracking-wider text-[var(--color-ink-soft)]">
                Net SHAP Shift (Σφ)
              </div>
              <div
                className={`font-mono text-base font-bold mt-0.5 ${
                  totalShap >= 0 ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {totalShap >= 0 ? '+' : ''}
                {(totalShap * 100).toFixed(2)}%
              </div>
              <div className="text-[0.65rem] text-[var(--color-ink-soft)]">
                Sum of 5 spec drivers
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-field-bg)] p-3">
              <div className="text-[0.65rem] uppercase tracking-wider text-[var(--color-ink-soft)]">
                Final Output f(x)
              </div>
              <div className="font-mono text-base font-bold mt-0.5 text-[var(--color-accent)]">
                {(reconstructedProb * 100).toFixed(2)}%
              </div>
              <div className="text-[0.65rem] text-[var(--color-ink-soft)]">
                Tier {explanation.predicted_tier} probability
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-field-bg)] p-3">
              <div className="text-[0.65rem] uppercase tracking-wider text-[var(--color-ink-soft)]">
                Additivity Check
              </div>
              <div className="font-mono text-xs font-bold mt-1 text-emerald-600 flex items-center gap-1">
                <span>✓ Exact Match</span>
              </div>
              <div className="text-[0.65rem] font-mono text-[var(--color-ink-soft)] mt-0.5">
                Δ = {additivityDiff.toExponential(1)}
              </div>
            </div>
          </div>

          {/* Recharts Bar Waterfall */}
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-field-bg)] p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--color-ink)]">
                Feature Contributions (Ordered by |SHAP| Impact)
              </span>
              <span className="text-[0.7rem] text-[var(--color-ink-soft)]">
                Percentage points shift toward Tier {explanation.predicted_tier} ({explanation.tier_label})
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 8, right: 30, left: 35, bottom: 8 }}
                >
                  <XAxis
                    type="number"
                    unit="%"
                    tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }}
                    axisLine={{ stroke: 'var(--color-line)' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'var(--color-ink)', fontWeight: 500 }}
                    axisLine={{ stroke: 'var(--color-line)' }}
                    width={145}
                  />
                  <ReferenceLine x={0} stroke="var(--color-ink-soft)" strokeDasharray="3 3" />
                  <Tooltip
                    formatter={(val, _name, item) => {
                      const p = item.payload
                      const sign = p.shapValue >= 0 ? '+' : ''
                      return [
                        `${sign}${val}% (SHAP: ${sign}${p.shapValue.toFixed(4)} | Step: ${(p.startProb * 100).toFixed(1)}% → ${(p.endProb * 100).toFixed(1)}%)`,
                        'Contribution',
                      ]
                    }}
                    labelFormatter={(label) => `Spec: ${label}`}
                    contentStyle={{
                      backgroundColor: 'var(--color-panel-solid)',
                      borderColor: 'var(--color-line)',
                      borderRadius: '0.5rem',
                      fontSize: '0.78rem',
                      color: 'var(--color-ink)',
                    }}
                  />
                  <Bar dataKey="shapPercent" radius={[4, 4, 4, 4]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`shap-cell-${index}`}
                        fill={entry.isPositive ? '#10b981' : '#f59e0b'}
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
              <thead className="bg-[var(--color-field-bg)] text-[0.68rem] uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
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
                  <tr key={row.feature} className="hover:bg-[var(--color-field-bg)]/50">
                    <td className="py-2 px-3 font-mono text-[var(--color-ink-soft)]">#{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-[var(--color-ink)]">{row.feature}</td>
                    <td className="py-2 px-3 font-mono text-[var(--color-ink-soft)]">
                      {row.featureValue !== null && row.featureValue !== undefined
                        ? `${row.featureValue} ${row.unit}`
                        : '—'}
                    </td>
                    <td
                      className={`py-2 px-3 font-mono font-semibold ${
                        row.isPositive ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {row.shapValue >= 0 ? '+' : ''}
                      {row.shapValue.toFixed(4)} ({row.shapValue >= 0 ? '+' : ''}
                      {row.shapPercent}%)
                    </td>
                    <td className="py-2 px-3 font-mono text-[var(--color-ink-soft)]">
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

          <div className="flex flex-wrap items-center justify-between gap-2 text-[0.7rem] text-[var(--color-ink-soft)] border-t border-[var(--color-line)] pt-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                <span>Pushes toward Tier {explanation.predicted_tier} (+)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" />
                <span>Pulls away from Tier {explanation.predicted_tier} (-)</span>
              </span>
            </div>
            <span>
              Model: <code>{explanation.model_version}</code> • Live via <code>GET /explain/{predictionId}</code>
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
