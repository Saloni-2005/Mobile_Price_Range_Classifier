import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { getFeatureImportance } from '../api/client'

export default function FeatureImportanceChart() {
  const [data, setData] = useState([])
  const [modelVersion, setModelVersion] = useState('')
  const [nSelected, setNSelected] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showOnlySelected, setShowOnlySelected] = useState(true)

  useEffect(() => {
    let isMounted = true

    getFeatureImportance()
      .then((res) => {
        if (!isMounted) return
        setData(res.features || [])
        setModelVersion(res.model_version || '')
        setNSelected(res.n_selected || 0)
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err.message || 'Failed to load feature importance.')
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    getFeatureImportance()
      .then((res) => {
        setData(res.features || [])
        setModelVersion(res.model_version || '')
        setNSelected(res.n_selected || 0)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load feature importance.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const displayData = showOnlySelected
    ? data.filter((item) => item.selected)
    : data

  const chartData = displayData.map((item) => ({
    name: item.feature,
    importancePercent: Number((item.importance * 100).toFixed(2)),
    rawImportance: item.importance,
    rank: item.rank,
    selected: item.selected,
  }))

  return (
    <section className="panel h-full rounded-2xl p-5 md:p-6" id="importance-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="accent-label text-[0.7rem] font-semibold tracking-[0.14em] uppercase">
              Module 02
            </span>
            <span className="phase-chip text-[0.65rem]">Active Model</span>
          </div>
          <h2 className="font-display mt-1 text-xl font-bold">
            Global Feature Importance
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Mean decrease in impurity from Random Forest with RFECV selection.
          </p>
        </div>
      </div>

      {/* Filter and stats banner */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-line)] pb-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-[var(--color-ink)]">
            Selected: <span className="text-[var(--color-accent)]">{nSelected}</span> / {data.length}
          </span>
          <span className="text-[var(--color-ink-soft)]">features</span>
        </div>
        <button
          type="button"
          onClick={() => setShowOnlySelected(!showOnlySelected)}
          className="text-xs px-2.5 py-1 rounded-md border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-accent)] transition-all cursor-pointer"
        >
          {showOnlySelected ? 'Show All 20 Features' : 'Show Only Selected (Top 5)'}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mt-8 flex flex-col items-center justify-center py-12 text-sm text-[var(--color-ink-soft)]">
          <div className="skeleton-bar w-36 h-2 mb-3" />
          <span>Loading live feature importance from <code>/feature-importance</code>...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="mt-6 rounded-lg border border-[var(--color-warn)] bg-[var(--color-caveat-bg)] p-4 text-xs text-[var(--color-caveat-text)]">
          <p className="font-semibold">Unable to fetch importance scores</p>
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

      {/* Chart display */}
      {!loading && !error && chartData.length > 0 && (
        <div className="mt-6">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 25, left: 25, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 'dataMax + 5']}
                  unit="%"
                  tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }}
                  axisLine={{ stroke: 'var(--color-line)' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: 'var(--color-ink)', fontWeight: 500 }}
                  axisLine={{ stroke: 'var(--color-line)' }}
                  width={90}
                />
                <Tooltip
                  formatter={(val, _name, item) => [
                    `${val}% (Impurity reduction: ${item.payload.rawImportance.toFixed(4)})`,
                    'Importance',
                  ]}
                  labelFormatter={(name) => `Feature: ${name}`}
                  contentStyle={{
                    backgroundColor: 'var(--color-panel-solid)',
                    borderColor: 'var(--color-line)',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    color: 'var(--color-ink)',
                  }}
                />
                <Bar dataKey="importancePercent" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.selected
                          ? 'var(--color-accent)'
                          : 'color-mix(in srgb, var(--color-ink) 20%, transparent)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[0.7rem] text-[var(--color-ink-soft)] border-t border-[var(--color-line)] pt-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--color-accent)]" />
                <span>RFECV Selected (Rank 1)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--color-line)] opacity-70" />
                <span>Eliminated</span>
              </span>
            </div>
            <span>Live data from <code>GET /feature-importance</code></span>
          </div>
        </div>
      )}
    </section>
  )
}
