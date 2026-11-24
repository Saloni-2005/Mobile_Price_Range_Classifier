import { useEffect, useRef, useState } from 'react'

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

function buildTrackGradient(cfg) {
  const span = cfg.sliderMax - cfg.sliderMin
  const startPct = Math.max(0, ((cfg.trainMin - cfg.sliderMin) / span) * 100)
  const endPct = Math.min(100, ((cfg.trainMax - cfg.sliderMin) / span) * 100)
  return `linear-gradient(90deg, var(--color-warn-border) 0%, var(--color-warn-border) ${startPct.toFixed(1)}%, var(--color-accent-border) ${startPct.toFixed(1)}%, var(--color-accent-border) ${endPct.toFixed(1)}%, var(--color-warn-border) ${endPct.toFixed(1)}%, var(--color-warn-border) 100%)`
}

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
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--color-line)]">
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
            Hardware Driver Controls
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
            Adjust the 5 RFECV drivers (300ms debounce). Indigo band = in-domain training range; amber ends = extrapolation.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={!baselinePredictionId || simulating}
          className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface-subtle)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-accent-border)] transition-colors cursor-pointer disabled:opacity-50"
        >
          Reset Baseline
        </button>
      </div>

      {/* Quick trade-off scenario presets */}
      <div className="mt-4 flex flex-wrap items-center gap-2 pb-3 border-b border-[var(--color-line)]">
        <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
          Scenarios:
        </span>
        <button
          type="button"
          onClick={() => applyPreset({ ram: 3600, battery_power: 1850 })}
          disabled={!baselinePredictionId}
          className="text-xs px-2.5 py-1 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface-subtle)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-accent-border)] cursor-pointer transition-colors"
        >
          Flagship RAM + Battery
        </button>
        <button
          type="button"
          onClick={() => applyPreset({ ram: 1024, px_width: 800, px_height: 480 })}
          disabled={!baselinePredictionId}
          className="text-xs px-2.5 py-1 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface-subtle)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-accent-border)] cursor-pointer transition-colors"
        >
          Budget Downscale
        </button>
        <button
          type="button"
          onClick={() => applyPreset({ ram: 4800, battery_power: 2400 })}
          disabled={!baselinePredictionId}
          className="text-xs px-2.5 py-1 rounded-lg border border-[var(--color-warn-border)] bg-[var(--color-warn-bg)] text-warn hover:brightness-105 cursor-pointer transition-all font-medium"
        >
          Test Extrapolation (4800 MB)
        </button>
      </div>

      {/* Extrapolation warning banner */}
      {extrapolatedList.length > 0 && (
        <div
          role="alert"
          data-testid="extrapolation-warning"
          className="mt-4 rounded-xl border border-[var(--color-warn-border)] bg-[var(--color-warn-bg)] p-3.5 text-xs text-warn"
        >
          <div className="font-bold">Extrapolated Specification Warning</div>
          <p className="mt-1 leading-relaxed text-[var(--color-ink-soft)]">
            <strong className="text-[var(--color-ink)]">
              {extrapolatedList.map((c) => c.label).join(', ')}
            </strong>{' '}
            {extrapolatedList.length === 1 ? 'is' : 'are'} outside the training dataset&apos;s observed range. Random Forest leaves cannot extrapolate linear trends beyond split thresholds.
          </p>
        </div>
      )}

      {/* Sliders list */}
      <div className="mt-4 space-y-3.5">
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
              className={`rounded-xl border p-3.5 transition-colors ${
                isExtrapolated
                  ? 'border-[var(--color-warn-border)] bg-[var(--color-warn-bg)]'
                  : delta !== 0
                  ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-soft)]'
                  : 'border-[var(--color-line)] bg-[var(--color-surface-subtle)]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`slider-${cfg.name}`}
                    className="text-xs font-semibold text-[var(--color-ink)]"
                  >
                    {cfg.label}
                  </label>
                  <code className="text-[0.66rem] font-mono text-[var(--color-ink-muted)]">
                    {cfg.name}
                  </code>
                  {isExtrapolated && (
                    <span className="px-1.5 py-0.5 rounded text-[0.6rem] font-bold uppercase border border-[var(--color-warn-border)] bg-[var(--color-warn-bg)] text-warn">
                      OOD
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
                  <span className="font-bold text-[var(--color-ink)]">
                    {currentVal} {cfg.unit}
                  </span>
                  {delta !== 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[0.66rem] font-semibold ${
                        delta > 0
                          ? 'bg-[var(--color-pos-bg)] text-pos'
                          : 'bg-[var(--color-warn-bg)] text-warn'
                      }`}
                    >
                      {delta > 0 ? `+${delta}` : delta} {cfg.unit}
                    </span>
                  )}
                </div>
              </div>

              <input
                id={`slider-${cfg.name}`}
                className={`slider-track w-full ${isExtrapolated ? 'slider-track--warn' : ''}`}
                style={{ background: buildTrackGradient(cfg) }}
                type="range"
                min={cfg.sliderMin}
                max={cfg.sliderMax}
                step={cfg.step}
                value={currentVal}
                disabled={!baselinePredictionId}
                onChange={(e) => handleSliderChange(cfg.name, e.target.value)}
              />

              <div className="mt-2 flex flex-wrap items-center justify-between text-[0.66rem] text-[var(--color-ink-muted)] tabular-nums">
                <span>
                  Safe range:{' '}
                  <strong className="font-mono text-[var(--color-ink-soft)]">
                    {cfg.trainMin}–{cfg.trainMax} {cfg.unit}
                  </strong>
                </span>
                <span>
                  Base <span className="font-mono">{baseVal}</span> · Proxy {cfg.costRate}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
