/**
 * WhatIfSliders — spec adjustment playground (PRD Ch. 7.2).
 * Debounced calls to POST /whatif to show how spec changes shift predicted tier and margin.
 * Sliders are disabled until the /whatif endpoint is live.
 */
const SLIDERS = [
  { name: 'ram', label: 'RAM', min: 256, max: 4000, value: 3200, unit: 'MB' },
  {
    name: 'battery_power',
    label: 'Battery',
    min: 500,
    max: 2000,
    value: 1500,
    unit: 'mAh',
  },
  {
    name: 'int_memory',
    label: 'Storage',
    min: 2,
    max: 64,
    value: 32,
    unit: 'GB',
  },
  { name: 'pc', label: 'Primary cam', min: 0, max: 20, value: 12, unit: 'MP' },
]

export default function WhatIfSliders() {
  return (
    <section className="panel h-full rounded-2xl p-5 md:p-6">
      <div>
        <p className="accent-label text-[0.7rem] font-medium tracking-[0.14em] uppercase">
          Module 04
        </p>
        <h2 className="font-display mt-1 text-xl font-bold">What-if playground</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Drag specs to see how tier and margin shift in real time.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {SLIDERS.map((s) => (
          <label key={s.name} className="block">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm font-medium">{s.label}</span>
              <span className="accent-label font-mono text-xs">
                {s.value} {s.unit}
              </span>
            </div>
            <input
              className="slider-track"
              type="range"
              min={s.min}
              max={s.max}
              defaultValue={s.value}
              disabled
              aria-disabled="true"
            />
          </label>
        ))}
      </div>
    </section>
  )
}
