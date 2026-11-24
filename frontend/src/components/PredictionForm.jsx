import { useState } from 'react'
import { predictTier } from '../api/client'

const DEFAULT_SPECS = {
  // 5 RFECV Selected Driver Features
  ram: 2560,
  battery_power: 1500,
  px_width: 1250,
  px_height: 980,
  mobile_wt: 140,
  // Other Hardware & Platform Features
  int_memory: 32,
  clock_speed: 2.0,
  n_cores: 4,
  pc: 10,
  fc: 5,
  sc_h: 12,
  sc_w: 8,
  talk_time: 12,
  m_dep: 0.5,
  // Connectivity & Capabilities (0 / 1)
  four_g: 1,
  three_g: 1,
  wifi: 1,
  blue: 1,
  dual_sim: 1,
  touch_screen: 1,
}

const DEVICE_PRESETS = [
  {
    label: 'Entry Budget',
    tierHint: 'Tier 0',
    specs: { ram: 640, battery_power: 850, px_width: 720, px_height: 480, mobile_wt: 175, int_memory: 8 },
  },
  {
    label: 'Mainstream Mid',
    tierHint: 'Tier 1',
    specs: { ram: 1650, battery_power: 1250, px_width: 1080, px_height: 720, mobile_wt: 150, int_memory: 16 },
  },
  {
    label: 'Upper Mid',
    tierHint: 'Tier 2',
    specs: { ram: 2560, battery_power: 1500, px_width: 1250, px_height: 980, mobile_wt: 140, int_memory: 32 },
  },
  {
    label: 'Flagship',
    tierHint: 'Tier 3',
    specs: { ram: 3750, battery_power: 1920, px_width: 1920, px_height: 1440, mobile_wt: 128, int_memory: 64 },
  },
]

export default function PredictionForm({ onPredictionSuccess }) {
  const [form, setForm] = useState(DEFAULT_SPECS)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleChange = (key, value, isFloat = false) => {
    setForm((prev) => ({
      ...prev,
      [key]: isFloat ? parseFloat(value) || 0 : parseInt(value, 10) || 0,
    }))
  }

  const handleToggle = (key) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key] === 1 ? 0 : 1,
    }))
  }

  const applyPreset = (presetSpecs) => {
    setForm((prev) => ({ ...prev, ...presetSpecs }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        battery_power: Number(form.battery_power),
        blue: Number(form.blue),
        clock_speed: Number(form.clock_speed),
        dual_sim: Number(form.dual_sim),
        fc: Number(form.fc),
        four_g: Number(form.four_g),
        int_memory: Number(form.int_memory),
        m_dep: Number(form.m_dep),
        mobile_wt: Number(form.mobile_wt),
        n_cores: Number(form.n_cores),
        pc: Number(form.pc),
        px_height: Number(form.px_height),
        px_width: Number(form.px_width),
        ram: Number(form.ram),
        sc_h: Number(form.sc_h),
        sc_w: Number(form.sc_w),
        talk_time: Number(form.talk_time),
        three_g: Number(form.three_g),
        touch_screen: Number(form.touch_screen),
        wifi: Number(form.wifi),
      }

      const res = await predictTier(payload)
      setResult(res)
      if (onPredictionSuccess) {
        onPredictionSuccess(res, payload)
      }
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map((d) => `${d.loc?.join('.')}: ${d.msg}`).join(', '))
      } else if (typeof detail === 'string') {
        setError(detail)
      } else {
        setError(err.message || 'Failed to request prediction from backend.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel h-full rounded-2xl p-5 md:p-6" id="prediction-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--color-line)]">
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
            Hardware Specification Input
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
            Configure the 5 primary RFECV drivers or expand all 20 specifications for inference.
          </p>
        </div>
        <span className="phase-chip text-[0.64rem]">POST /predict</span>
      </div>

      {/* Quick Hardware Presets */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] mr-1">
          Presets:
        </span>
        {DEVICE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset.specs)}
            className="text-xs px-2.5 py-1 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface-subtle)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-accent-border)] hover:bg-[var(--color-accent-soft)] transition-colors cursor-pointer"
          >
            {preset.label}{' '}
            <span className="font-mono text-[0.65rem] opacity-65">({preset.tierHint})</span>
          </button>
        ))}
      </div>

      <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
        {/* Core RFE Driver Features */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[0.7rem] font-semibold tracking-wider uppercase text-[var(--color-accent-text)]">
              Primary RFECV Drivers (100% Split Weight)
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
            <label className="block text-left">
              <span className="mb-1 flex items-center justify-between text-[0.72rem] font-medium text-[var(--color-ink-soft)]">
                <span>RAM (MB)</span>
                <span className="font-mono text-[0.62rem] text-[var(--color-accent-text)] font-semibold">RFE</span>
              </span>
              <input
                type="number"
                min="256"
                max="3998"
                className="field font-mono tabular-nums text-sm"
                value={form.ram}
                onChange={(e) => handleChange('ram', e.target.value)}
                required
              />
            </label>

            <label className="block text-left">
              <span className="mb-1 flex items-center justify-between text-[0.72rem] font-medium text-[var(--color-ink-soft)]">
                <span>Battery (mAh)</span>
                <span className="font-mono text-[0.62rem] text-[var(--color-accent-text)] font-semibold">RFE</span>
              </span>
              <input
                type="number"
                min="500"
                max="2000"
                className="field font-mono tabular-nums text-sm"
                value={form.battery_power}
                onChange={(e) => handleChange('battery_power', e.target.value)}
                required
              />
            </label>

            <label className="block text-left">
              <span className="mb-1 flex items-center justify-between text-[0.72rem] font-medium text-[var(--color-ink-soft)]">
                <span>Px Width (px)</span>
                <span className="font-mono text-[0.62rem] text-[var(--color-accent-text)] font-semibold">RFE</span>
              </span>
              <input
                type="number"
                min="500"
                max="1998"
                className="field font-mono tabular-nums text-sm"
                value={form.px_width}
                onChange={(e) => handleChange('px_width', e.target.value)}
                required
              />
            </label>

            <label className="block text-left">
              <span className="mb-1 flex items-center justify-between text-[0.72rem] font-medium text-[var(--color-ink-soft)]">
                <span>Px Height (px)</span>
                <span className="font-mono text-[0.62rem] text-[var(--color-accent-text)] font-semibold">RFE</span>
              </span>
              <input
                type="number"
                min="0"
                max="1960"
                className="field font-mono tabular-nums text-sm"
                value={form.px_height}
                onChange={(e) => handleChange('px_height', e.target.value)}
                required
              />
            </label>

            <label className="block text-left">
              <span className="mb-1 flex items-center justify-between text-[0.72rem] font-medium text-[var(--color-ink-soft)]">
                <span>Weight (g)</span>
                <span className="font-mono text-[0.62rem] text-[var(--color-accent-text)] font-semibold">RFE</span>
              </span>
              <input
                type="number"
                min="80"
                max="200"
                className="field font-mono tabular-nums text-sm"
                value={form.mobile_wt}
                onChange={(e) => handleChange('mobile_wt', e.target.value)}
                required
              />
            </label>

            <label className="block text-left">
              <span className="mb-1 block text-[0.72rem] font-medium text-[var(--color-ink-soft)]">
                Storage (GB)
              </span>
              <input
                type="number"
                min="2"
                max="64"
                className="field font-mono tabular-nums text-sm"
                value={form.int_memory}
                onChange={(e) => handleChange('int_memory', e.target.value)}
                required
              />
            </label>
          </div>
        </div>

        {/* Toggle secondary specs */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent-text)] hover:underline cursor-pointer"
          >
            <span>{showAdvanced ? '▾ Hide Secondary Specs (14)' : '▸ Show All 20 Device Specs'}</span>
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-4 rounded-xl border border-[var(--color-line)] p-4 bg-[var(--color-surface-subtle)]">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="block text-left">
                <span className="mb-1 block text-[0.68rem] text-[var(--color-ink-soft)]">Clock (GHz)</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="3.0"
                  className="field font-mono tabular-nums text-xs py-1.5"
                  value={form.clock_speed}
                  onChange={(e) => handleChange('clock_speed', e.target.value, true)}
                />
              </label>

              <label className="block text-left">
                <span className="mb-1 block text-[0.68rem] text-[var(--color-ink-soft)]">Cores</span>
                <input
                  type="number"
                  min="1"
                  max="8"
                  className="field font-mono tabular-nums text-xs py-1.5"
                  value={form.n_cores}
                  onChange={(e) => handleChange('n_cores', e.target.value)}
                />
              </label>

              <label className="block text-left">
                <span className="mb-1 block text-[0.68rem] text-[var(--color-ink-soft)]">Rear Cam (MP)</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  className="field font-mono tabular-nums text-xs py-1.5"
                  value={form.pc}
                  onChange={(e) => handleChange('pc', e.target.value)}
                />
              </label>

              <label className="block text-left">
                <span className="mb-1 block text-[0.68rem] text-[var(--color-ink-soft)]">Front Cam (MP)</span>
                <input
                  type="number"
                  min="0"
                  max="19"
                  className="field font-mono tabular-nums text-xs py-1.5"
                  value={form.fc}
                  onChange={(e) => handleChange('fc', e.target.value)}
                />
              </label>

              <label className="block text-left">
                <span className="mb-1 block text-[0.68rem] text-[var(--color-ink-soft)]">Screen H (cm)</span>
                <input
                  type="number"
                  min="5"
                  max="19"
                  className="field font-mono tabular-nums text-xs py-1.5"
                  value={form.sc_h}
                  onChange={(e) => handleChange('sc_h', e.target.value)}
                />
              </label>

              <label className="block text-left">
                <span className="mb-1 block text-[0.68rem] text-[var(--color-ink-soft)]">Screen W (cm)</span>
                <input
                  type="number"
                  min="0"
                  max="18"
                  className="field font-mono tabular-nums text-xs py-1.5"
                  value={form.sc_w}
                  onChange={(e) => handleChange('sc_w', e.target.value)}
                />
              </label>

              <label className="block text-left">
                <span className="mb-1 block text-[0.68rem] text-[var(--color-ink-soft)]">Talk Time (h)</span>
                <input
                  type="number"
                  min="2"
                  max="20"
                  className="field font-mono tabular-nums text-xs py-1.5"
                  value={form.talk_time}
                  onChange={(e) => handleChange('talk_time', e.target.value)}
                />
              </label>

              <label className="block text-left">
                <span className="mb-1 block text-[0.68rem] text-[var(--color-ink-soft)]">Depth (cm)</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1.0"
                  className="field font-mono tabular-nums text-xs py-1.5"
                  value={form.m_dep}
                  onChange={(e) => handleChange('m_dep', e.target.value, true)}
                />
              </label>
            </div>

            {/* Feature Flags */}
            <div className="pt-3 border-t border-[var(--color-line)]">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] block mb-2">
                Connectivity &amp; Hardware Flags
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'four_g', label: '4G LTE' },
                  { key: 'three_g', label: '3G' },
                  { key: 'wifi', label: 'WiFi' },
                  { key: 'blue', label: 'Bluetooth' },
                  { key: 'dual_sim', label: 'Dual SIM' },
                  { key: 'touch_screen', label: 'Touch Screen' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleToggle(item.key)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                      form[item.key] === 1
                        ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] text-[var(--color-accent-text)] font-semibold'
                        : 'border-[var(--color-line)] bg-[var(--color-panel)] text-[var(--color-ink-muted)]'
                    }`}
                  >
                    {item.label}: {form[item.key] === 1 ? 'On' : 'Off'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-xl border border-[var(--color-neg-border)] bg-[var(--color-neg-bg)] p-3 text-xs text-neg">
            <strong>Validation / API Error:</strong> {error}
          </div>
        )}

        {/* Submit button */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="cta-primary cursor-pointer disabled:opacity-50"
            id="run-prediction-btn"
          >
            {loading ? 'Running inference...' : 'Run Price-Tier Prediction'}
          </button>
          <span className="text-xs text-[var(--color-ink-muted)]">
            Persists result for TreeSHAP &amp; What-If analysis
          </span>
        </div>
      </form>

      {/* Live Result View */}
      {result && (
        <div className="mt-6 rounded-xl border border-[var(--color-line-strong)] p-4 sm:p-5 bg-[var(--color-surface-subtle)] animate-rise">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] pb-3.5">
            <div>
              <p className="text-[0.66rem] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">
                Predicted Price Tier
              </p>
              <h3 className="text-2xl font-extrabold font-display flex items-center gap-2.5 mt-1">
                <span
                  className={`px-3 py-0.5 rounded-lg text-lg border tier-badge-${result.predicted_tier}`}
                >
                  {result.tier_label} Tier
                </span>
                <span className="text-xs font-mono font-medium text-[var(--color-ink-soft)]">
                  Class {result.predicted_tier}
                </span>
              </h3>
            </div>
            <div className="text-right text-xs text-[var(--color-ink-soft)] space-y-0.5">
              <div>
                Prediction{' '}
                <span className="font-mono font-semibold text-[var(--color-ink)]">
                  #{result.prediction_id}
                </span>
              </div>
              <div className="font-semibold text-pos">✓ Logged &amp; Verified</div>
            </div>
          </div>

          {/* Probability Distribution */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-[var(--color-ink)] mb-2.5">
              Class Probability Distribution
            </p>
            <div className="space-y-2.5">
              {['Low (0)', 'Mid (1)', 'Mid-High (2)', 'High (3)'].map((label, idx) => {
                const prob = result.probabilities[idx] || 0
                const percent = (prob * 100).toFixed(1)
                const isWinner = result.predicted_tier === idx
                return (
                  <div key={label} className="text-xs">
                    <div className="flex justify-between mb-1">
                      <span
                        className={
                          isWinner
                            ? 'font-semibold text-[var(--color-ink)]'
                            : 'text-[var(--color-ink-soft)]'
                        }
                      >
                        {label} {isWinner && '★'}
                      </span>
                      <span
                        className={`font-mono tabular-nums ${
                          isWinner
                            ? 'font-bold text-[var(--color-accent-text)]'
                            : 'text-[var(--color-ink-soft)]'
                        }`}
                      >
                        {percent}%
                      </span>
                    </div>
                    <div className="bar-track h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: isWinner
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
        </div>
      )}
    </section>
  )
}
