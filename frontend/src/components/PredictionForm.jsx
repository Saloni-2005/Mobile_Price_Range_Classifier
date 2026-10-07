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

const TIER_COLORS = {
  0: { bg: 'rgba(56, 189, 248, 0.15)', text: '#0284c7', border: 'rgba(56, 189, 248, 0.4)' },
  1: { bg: 'rgba(52, 211, 153, 0.15)', text: '#059669', border: 'rgba(52, 211, 153, 0.4)' },
  2: { bg: 'rgba(251, 191, 36, 0.15)', text: '#d97706', border: 'rgba(251, 191, 36, 0.4)' },
  3: { bg: 'rgba(168, 85, 247, 0.15)', text: '#9333ea', border: 'rgba(168, 85, 247, 0.4)' },
}

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Ensure all 20 fields are properly typed numbers
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="accent-label text-[0.7rem] font-semibold tracking-[0.14em] uppercase">
              Module 01
            </span>
            <span className="phase-chip text-[0.65rem]">Active Model Live</span>
          </div>
          <h2 className="font-display mt-1 text-xl font-bold">Predict Price Tier</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Configure candidate specifications to classify mobile handset price tier.
          </p>
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        {/* Core RFE Driver Features */}
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wider uppercase text-[var(--color-accent-text)]">
            Primary RFE Drivers
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <label className="block text-left">
              <span className="mb-1 block text-[0.7rem] font-medium text-[var(--color-ink-soft)]">
                RAM (MB) <span className="text-[var(--color-accent)] font-semibold">*Rank 1</span>
              </span>
              <input
                type="number"
                min="256"
                max="3998"
                className="field px-3 py-1.5 text-sm"
                value={form.ram}
                onChange={(e) => handleChange('ram', e.target.value)}
                required
              />
            </label>

            <label className="block text-left">
              <span className="mb-1 block text-[0.7rem] font-medium text-[var(--color-ink-soft)]">
                Battery (mAh) <span className="text-[var(--color-accent)] font-semibold">*Rank 1</span>
              </span>
              <input
                type="number"
                min="500"
                max="2000"
                className="field px-3 py-1.5 text-sm"
                value={form.battery_power}
                onChange={(e) => handleChange('battery_power', e.target.value)}
                required
              />
            </label>

            <label className="block text-left">
              <span className="mb-1 block text-[0.7rem] font-medium text-[var(--color-ink-soft)]">
                Px Width (px) <span className="text-[var(--color-accent)] font-semibold">*Rank 1</span>
              </span>
              <input
                type="number"
                min="500"
                max="1998"
                className="field px-3 py-1.5 text-sm"
                value={form.px_width}
                onChange={(e) => handleChange('px_width', e.target.value)}
                required
              />
            </label>

            <label className="block text-left">
              <span className="mb-1 block text-[0.7rem] font-medium text-[var(--color-ink-soft)]">
                Px Height (px) <span className="text-[var(--color-accent)] font-semibold">*Rank 1</span>
              </span>
              <input
                type="number"
                min="0"
                max="1960"
                className="field px-3 py-1.5 text-sm"
                value={form.px_height}
                onChange={(e) => handleChange('px_height', e.target.value)}
                required
              />
            </label>

            <label className="block text-left">
              <span className="mb-1 block text-[0.7rem] font-medium text-[var(--color-ink-soft)]">
                Weight (g) <span className="text-[var(--color-accent)] font-semibold">*Rank 1</span>
              </span>
              <input
                type="number"
                min="80"
                max="200"
                className="field px-3 py-1.5 text-sm"
                value={form.mobile_wt}
                onChange={(e) => handleChange('mobile_wt', e.target.value)}
                required
              />
            </label>

            <label className="block text-left">
              <span className="mb-1 block text-[0.7rem] font-medium text-[var(--color-ink-soft)]">
                Storage (GB)
              </span>
              <input
                type="number"
                min="2"
                max="64"
                className="field px-3 py-1.5 text-sm"
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
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] hover:underline"
          >
            {showAdvanced ? '▼ Hide Additional Specs' : '▶ Show All 20 Device Specs'}
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-3 rounded-xl border border-[var(--color-line)] p-3.5 bg-[var(--color-field-bg)]">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="block text-left">
                <span className="mb-1 block text-[0.65rem] text-[var(--color-ink-soft)]">Clock (GHz)</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="3.0"
                  className="field px-2.5 py-1 text-xs"
                  value={form.clock_speed}
                  onChange={(e) => handleChange('clock_speed', e.target.value, true)}
                />
              </label>

              <label className="block text-left">
                <span className="mb-1 block text-[0.65rem] text-[var(--color-ink-soft)]">Cores</span>
                <input
                  type="number"
                  min="1"
                  max="8"
                  className="field px-2.5 py-1 text-xs"
                  value={form.n_cores}
                  onChange={(e) => handleChange('n_cores', e.target.value)}
                />
              </label>

              <label className="block text-left">
                <span className="mb-1 block text-[0.65rem] text-[var(--color-ink-soft)]">Rear Cam (MP)</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  className="field px-2.5 py-1 text-xs"
                  value={form.pc}
                  onChange={(e) => handleChange('pc', e.target.value)}
                />
              </label>

              <label className="block text-left">
                <span className="mb-1 block text-[0.65rem] text-[var(--color-ink-soft)]">Front Cam (MP)</span>
                <input
                  type="number"
                  min="0"
                  max="19"
                  className="field px-2.5 py-1 text-xs"
                  value={form.fc}
                  onChange={(e) => handleChange('fc', e.target.value)}
                />
              </label>

              <label className="block text-left">
                <span className="mb-1 block text-[0.65rem] text-[var(--color-ink-soft)]">Screen H (cm)</span>
                <input
                  type="number"
                  min="5"
                  max="19"
                  className="field px-2.5 py-1 text-xs"
                  value={form.sc_h}
                  onChange={(e) => handleChange('sc_h', e.target.value)}
                />
              </label>

              <label className="block text-left">
                <span className="mb-1 block text-[0.65rem] text-[var(--color-ink-soft)]">Screen W (cm)</span>
                <input
                  type="number"
                  min="0"
                  max="18"
                  className="field px-2.5 py-1 text-xs"
                  value={form.sc_w}
                  onChange={(e) => handleChange('sc_w', e.target.value)}
                />
              </label>

              <label className="block text-left">
                <span className="mb-1 block text-[0.65rem] text-[var(--color-ink-soft)]">Talk Time (h)</span>
                <input
                  type="number"
                  min="2"
                  max="20"
                  className="field px-2.5 py-1 text-xs"
                  value={form.talk_time}
                  onChange={(e) => handleChange('talk_time', e.target.value)}
                />
              </label>

              <label className="block text-left">
                <span className="mb-1 block text-[0.65rem] text-[var(--color-ink-soft)]">Depth (cm)</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1.0"
                  className="field px-2.5 py-1 text-xs"
                  value={form.m_dep}
                  onChange={(e) => handleChange('m_dep', e.target.value, true)}
                />
              </label>
            </div>

            {/* Feature Flags */}
            <div className="pt-2 border-t border-[var(--color-line)]">
              <span className="text-[0.65rem] font-medium text-[var(--color-ink-soft)] block mb-2">
                Features & Connectivity
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
                    className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                      form[item.key] === 1
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-cta-fg)] font-semibold'
                        : 'border-[var(--color-line)] opacity-60 text-[var(--color-ink)]'
                    }`}
                  >
                    {item.label}: {form[item.key] === 1 ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-[var(--color-warn)] bg-[var(--color-caveat-bg)] p-3 text-xs text-[var(--color-caveat-text)]">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Submit button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="cta-primary cursor-pointer disabled:opacity-50"
            id="run-prediction-btn"
          >
            {loading ? 'Running inference...' : 'Run Prediction'}
          </button>
          <span className="text-xs text-[var(--color-ink-soft)]">
            Live inference via <code>POST /predict</code>
          </span>
        </div>
      </form>

      {/* Live Result View */}
      {result && (
        <div className="mt-6 rounded-xl border border-[var(--color-line)] p-4 bg-[var(--color-panel-solid)] animate-rise">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
            <div>
              <p className="text-[0.65rem] uppercase tracking-wider text-[var(--color-ink-soft)] font-semibold">
                Inference Result
              </p>
              <h3 className="text-2xl font-black font-display flex items-center gap-2 mt-0.5">
                <span
                  className="px-2.5 py-0.5 rounded-lg text-lg border"
                  style={{
                    backgroundColor: TIER_COLORS[result.predicted_tier]?.bg,
                    color: TIER_COLORS[result.predicted_tier]?.text,
                    borderColor: TIER_COLORS[result.predicted_tier]?.border,
                  }}
                >
                  {result.tier_label} Tier
                </span>
                <span className="text-sm font-normal text-[var(--color-ink-soft)]">
                  (Class {result.predicted_tier})
                </span>
              </h3>
            </div>
            <div className="text-right text-[0.7rem] text-[var(--color-ink-soft)]">
              <div>Prediction ID: <span className="font-mono font-semibold text-[var(--color-ink)]">#{result.prediction_id}</span></div>
              <div>Status: <span className="font-semibold text-emerald-600">Verified</span></div>
            </div>
          </div>

          {/* Probability Distribution */}
          <div className="mt-3.5">
            <p className="text-xs font-semibold text-[var(--color-ink)] mb-2">
              Class Probability Distribution
            </p>
            <div className="space-y-2">
              {['Low (0)', 'Mid (1)', 'Mid-High (2)', 'High (3)'].map((label, idx) => {
                const prob = result.probabilities[idx] || 0
                const percent = (prob * 100).toFixed(1)
                const isWinner = result.predicted_tier === idx
                return (
                  <div key={label} className="text-xs">
                    <div className="flex justify-between mb-1">
                      <span className={isWinner ? 'font-bold text-[var(--color-accent)]' : 'text-[var(--color-ink-soft)]'}>
                        {label} {isWinner && '★'}
                      </span>
                      <span className="font-mono font-medium">{percent}%</span>
                    </div>
                    <div className="bar-track h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: isWinner ? 'var(--color-accent)' : 'color-mix(in srgb, var(--color-ink) 25%, transparent)',
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
