import { useEffect, useRef, useState } from 'react'

/**
 * RFE-selected numeric features with observed training bounds (PRD Ch. 12 / 15.3)
 * and extended slider bounds to allow testing extrapolation behavior.
 */
const RFE_SLIDER_CONFIG = [
  {
    name: 'ram',
    label: 'System RAM',
    unit: 'MB',
    trainMin: 256,
    trainMax: 3998,
    sliderMin: 128,
    sliderMax: 5120,
    step: 32,
    defaultValue: 2048,
    costRate: '$0.012 / MB',
  },
  {
    name: 'battery_power',
    label: 'Battery Capacity',
    unit: 'mAh',
    trainMin: 500,
    trainMax: 2000,
    sliderMin: 350,
    sliderMax: 2600,
    step: 25,
    defaultValue: 1500,
    costRate: '$0.015 / mAh',
  },
  {
    name: 'px_width',
    label: 'Display Pixel Width',
    unit: 'px',
    trainMin: 500,
    trainMax: 1998,
    sliderMin: 360,
    sliderMax: 2400,
    step: 20,
    defaultValue: 1249,
    costRate: '$0.008 / px',
  },
  {
    name: 'px_height',
    label: 'Display Pixel Height',
    unit: 'px',
    trainMin: 0,
    trainMax: 1960,
    sliderMin: 0,
    sliderMax: 2400,
    step: 20,
    defaultValue: 980,
    costRate: '$0.008 / px',
  },
  {
    name: 'mobile_wt',
    label: 'Handset Weight',
    unit: 'g',
    trainMin: 80,
    trainMax: 200,
    sliderMin: 60,
    sliderMax: 250,
    step: 2,
    defaultValue: 140,
    costRate: '$0.080 / g',
  },
]

/**
 * WhatIfSliders — Interactive RFE-selected specification playground (PRD Ch. 5.2, 7.2, 15.3).
 * Debounces slider adjustments (~300ms) and flags extrapolated values outside training bounds.
 */
export default function WhatIfSliders({
  baselineSpecs,
  baselinePredictionId,
  onSimulate,
  simulating = false,
}) {
  const [values, setValues] = useState(() => {
    const initial = {}
    RFE_SLIDER_CONFIG.forEach((cfg) => {
      initial[cfg.name] = baselineSpecs?.[cfg.name] ?? cfg.defaultValue
    })
    return initial
  })

  const debounceRef = useRef(null)

  const triggerDebouncedSimulate = (nextValues) => {
    if (!onSimulate || !baselinePredictionId) return
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      onSimulate(nextValues)
    }, 300)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleSliderChange = (name, rawVal) => {
    const numericVal = Number(rawVal)
    const nextValues = { ...values, [name]: numericVal }
    setValues(nextValues)
    triggerDebouncedSimulate(nextValues)
  }

  const handleReset = () => {
    const resetValues = {}
    RFE_SLIDER_CONFIG.forEach((cfg) => {
      resetValues[cfg.name] =
        baselineSpecs?.[cfg.name] !== undefined
          ? Number(baselineSpecs[cfg.name])
          : cfg.defaultValue
    })
    setValues(resetValues)
    if (onSimulate && baselinePredictionId) {
      onSimulate(resetValues)
    }
  }

  const applyPreset = (presetOverrides) => {
    const nextValues = { ...values, ...presetOverrides }
    setValues(nextValues)
    if (onSimulate && baselinePredictionId) {
      onSimulate(nextValues)
    }
  }

  const extrapolatedList = RFE_SLIDER_CONFIG.filter((cfg) => {
    const val = values[cfg.name]
    return val < cfg.trainMin || val > cfg.trainMax
  })

  return (
    <section className="panel h-full rounded-2xl p-5 md:p-6" id="whatif-sliders-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="accent-label text-[0.7rem] font-semibold tracking-[0.14em] uppercase">
              Module 04
            </p>
            <span className="phase-chip text-[0.65rem]">5 RFECV Drivers</span>
          </div>
          <h2 className="font-display mt-1 text-xl font-bold">
            What-If Specification Sliders
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Adjust the 5 RFECV-selected hardware drivers (debounced 300ms) to simulate price-tier and BOM margin shifts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={!baselinePredictionId || simulating}
          className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-accent)] transition-all cursor-pointer disabled:opacity-50"
        >
          Reset to Baseline
        </button>
      </div>

      {/* Quick trade-off scenario presets */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-[var(--color-line)] pb-3">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
          Quick Scenarios:
        </span>
        <button
          type="button"
          onClick={() => applyPreset({ ram: 3600, battery_power: 1850 })}
          disabled={!baselinePredictionId}
          className="text-xs px-2.5 py-1 rounded-md border border-[var(--color-line)] bg-[var(--color-field-bg)] hover:border-[var(--color-accent)] cursor-pointer transition-all"
        >
          Flagship RAM + Battery
        </button>
        <button
          type="button"
          onClick={() => applyPreset({ ram: 1024, px_width: 800, px_height: 480 })}
          disabled={!baselinePredictionId}
          className="text-xs px-2.5 py-1 rounded-md border border-[var(--color-line)] bg-[var(--color-field-bg)] hover:border-[var(--color-accent)] cursor-pointer transition-all"
        >
          Budget Downscale
        </button>
        <button
          type="button"
          onClick={() => applyPreset({ ram: 4800, battery_power: 2400 })}
          disabled={!baselinePredictionId}
          className="text-xs px-2.5 py-1 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-600 hover:border-amber-500 cursor-pointer transition-all"
        >
          Test Extrapolation (4800 MB)
        </button>
      </div>

      {/* Extrapolation warning banner (PRD Chapter 15.3) */}
      {extrapolatedList.length > 0 && (
        <div
          role="alert"
          data-testid="extrapolation-warning"
          className="mt-4 rounded-xl border border-amber-500/60 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300"
        >
          <div className="flex items-center gap-2 font-bold">
            <span>⚠️ Extrapolated Specification Warning</span>
          </div>
          <p className="mt-1 leading-relaxed">
            {extrapolatedList.map((c) => c.label).join(', ')}{' '}
            {extrapolatedList.length === 1 ? 'is' : 'are'} outside the training dataset&apos;s observed range.
            Random Forest trees cannot extrapolate linear trends beyond their leaf split thresholds — treat resulting probabilities with caution.
          </p>
        </div>
      )}

      {/* Sliders list */}
      <div className="mt-5 space-y-5">
        {RFE_SLIDER_CONFIG.map((cfg) => {
          const currentVal = values[cfg.name] ?? cfg.defaultValue
          const baseVal =
            baselineSpecs?.[cfg.name] !== undefined
              ? Number(baselineSpecs[cfg.name])
              : cfg.defaultValue
          const delta = currentVal - baseVal
          const isExtrapolated =
            currentVal < cfg.trainMin || currentVal > cfg.trainMax

          return (
            <div
              key={cfg.name}
              className={`rounded-xl border p-3.5 transition-all ${
                isExtrapolated
                  ? 'border-amber-500/70 bg-amber-500/5'
                  : delta !== 0
                  ? 'border-[var(--color-accent)]/50 bg-[var(--color-field-bg)]'
                  : 'border-[var(--color-line)] bg-[var(--color-field-bg)]/60'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`slider-${cfg.name}`}
                    className="text-sm font-semibold text-[var(--color-ink)]"
                  >
                    {cfg.label}
                  </label>
                  <code className="text-[0.68rem] text-[var(--color-ink-soft)]">
                    ({cfg.name})
                  </code>
                  {isExtrapolated && (
                    <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase bg-amber-500 text-white">
                      Extrapolated
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="font-bold text-[var(--color-ink)]">
                    {currentVal} {cfg.unit}
                  </span>
                  {delta !== 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[0.68rem] font-semibold ${
                        delta > 0
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-amber-500/15 text-amber-600'
                      }`}
                    >
                      {delta > 0 ? `+${delta}` : delta} {cfg.unit}
                    </span>
                  )}
                </div>
              </div>

              <input
                id={`slider-${cfg.name}`}
                className="slider-track w-full cursor-pointer"
                type="range"
                min={cfg.sliderMin}
                max={cfg.sliderMax}
                step={cfg.step}
                value={currentVal}
                disabled={!baselinePredictionId}
                onChange={(e) => handleSliderChange(cfg.name, e.target.value)}
              />

              <div className="mt-1.5 flex flex-wrap items-center justify-between text-[0.68rem] text-[var(--color-ink-soft)]">
                <span>
                  Training range:{' '}
                  <strong className="text-[var(--color-ink)]">
                    {cfg.trainMin}–{cfg.trainMax} {cfg.unit}
                  </strong>
                </span>
                <span>
                  Baseline: <span className="font-mono">{baseVal} {cfg.unit}</span> • Illustrative BOM rate: {cfg.costRate}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
