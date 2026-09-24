/**
 * ShapWaterfall — renders TreeSHAP attribution waterfall for a single prediction
 * (PRD Ch. 7.2). Connects to GET /explain/{prediction_id}.
 * Displays illustrative bars until the endpoint is live.
 */
const STEPS = [
  { feature: 'base', value: 0.25, width: '25%', tone: 'neutral' },
  { feature: 'ram', value: 0.31, width: '31%', tone: 'up' },
  { feature: 'battery_power', value: 0.14, width: '14%', tone: 'up' },
  { feature: 'mobile_wt', value: -0.08, width: '8%', tone: 'down' },
]

export default function ShapWaterfall() {
  return (
    <section className="panel h-full rounded-2xl p-5 md:p-6">
      <div>
        <p className="accent-label text-[0.7rem] font-medium tracking-[0.14em] uppercase">
          Module 03
        </p>
        <h2 className="font-display mt-1 text-xl font-bold">SHAP waterfall</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Local TreeSHAP explanation for a single prediction — why this tier.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {STEPS.map((step, i) => (
          <div key={step.feature} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-xs font-medium text-[var(--color-ink-soft)]">
              {step.feature}
            </span>
            <div className="bar-track relative h-8 flex-1 rounded-md">
              <div
                className="absolute top-1/2 h-5 -translate-y-1/2 rounded-sm"
                style={{
                  left: step.tone === 'down' ? '42%' : '28%',
                  width: step.width,
                  background:
                    step.tone === 'down'
                      ? 'color-mix(in srgb, var(--color-warn) 70%, transparent)'
                      : step.tone === 'neutral'
                        ? 'color-mix(in srgb, var(--color-ink) 28%, transparent)'
                        : 'color-mix(in srgb, var(--color-accent) 70%, transparent)',
                  animationDelay: `${0.1 * i}s`,
                }}
              />
            </div>
            <span className="w-12 text-right font-mono text-xs">
              {step.value > 0 ? '+' : ''}
              {step.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[0.7rem] text-[var(--color-ink-soft)]">
        Illustrative bars — replaced by live data from /explain when TreeSHAP is wired.
      </p>
    </section>
  )
}
