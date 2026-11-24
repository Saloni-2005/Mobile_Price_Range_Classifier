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
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--color-line)]">
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
            RFECV Gini Importance Ranking
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
            Normalized mean decrease in impurity across the production Random Forest ensemble.
          </p>
        </div>
        <span className="phase-chip text-[0.64rem]">
          {modelVersion || 'Active Model'}
        </span>
      </div>

      {/* Filter and stats banner */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--color-line)]">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--color-ink-soft)]">Retained by RFECV:</span>
          <span className="font-mono font-bold text-[var(--color-accent-text)] tabular-nums">
            {nSelected} / {data.length}
          </span>
        </div>

        {/* Segmented toggle */}
        <div className="inline-flex rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface-subtle)] p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setShowOnlySelected(true)}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              showOnlySelected
                ? 'bg-[var(--color-panel)] text-[var(--color-ink)] shadow-xs'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            Top 5 Selected
          </button>
          <button
            type="button"
            onClick={() => setShowOnlySelected(false)}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              !showOnlySelected
                ? 'bg-[var(--color-panel)] text-[var(--color-ink)] shadow-xs'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            All 20 Specs
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mt-8 flex flex-col items-center justify-center py-12 text-xs text-[var(--color-ink-soft)]">
          <div className="skeleton-bar w-36 h-2 mb-3" />
          <span>Loading live feature importance from <code>/feature-importance</code>...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="mt-6 rounded-xl border border-[var(--color-neg-border)] bg-[var(--color-neg-bg)] p-4 text-xs text-neg">
          <p className="font-semibold">Unable to fetch importance scores</p>
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

      {/* Chart display */}
      {!loading && !error && chartData.length > 0 && (
        <div className="mt-5">
          <div className={showOnlySelected ? 'h-64 w-full' : 'h-[28rem] w-full'}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 24, left: 20, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 'dataMax + 5']}
                  unit="%"
                  tick={{ fontSize: 11, fill: 'var(--color-ink-soft)', fontFamily: 'var(--font-mono)' }}
                  axisLine={{ stroke: 'var(--color-line)' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: 'var(--color-ink)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}
                  axisLine={{ stroke: 'var(--color-line)' }}
                  tickLine={false}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: 'var(--color-accent-soft)' }}
                  formatter={(val, _name, item) => [
                    `${val}% (Gini: ${item.payload.rawImportance.toFixed(4)})`,
                    'Weight',
                  ]}
                  labelFormatter={(name) => `Feature: ${name}`}
                  contentStyle={{
                    backgroundColor: 'var(--color-panel)',
                    borderColor: 'var(--color-line-strong)',
                    borderRadius: '0.625rem',
                    fontSize: '0.78rem',
                    color: 'var(--color-ink)',
                    boxShadow: 'var(--panel-shadow)',
                  }}
                />
                <Bar dataKey="importancePercent" radius={[0, 5, 5, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.selected
                          ? 'var(--color-accent)'
                          : 'color-mix(in srgb, var(--color-ink) 18%, transparent)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[0.7rem] text-[var(--color-ink-muted)] border-t border-[var(--color-line)] pt-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-xs bg-[var(--color-accent)]" />
                <span>RFECV Selected (Rank 1)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-xs bg-[var(--color-line-strong)]" />
                <span>Eliminated</span>
              </span>
            </div>
            <span className="font-mono">GET /feature-importance</span>
          </div>
        </div>
      )}
    </section>
  )
}
