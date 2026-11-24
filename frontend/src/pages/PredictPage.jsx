import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PredictionForm from '../components/PredictionForm'

const TIER_SCHEMA = [
  { tier: 0, label: 'Tier 0 · Low', range: 'Sub-$150 entry level' },
  { tier: 1, label: 'Tier 1 · Mid', range: '$150–$300 mainstream' },
  { tier: 2, label: 'Tier 2 · Mid-High', range: '$300–$500 upper mid' },
  { tier: 3, label: 'Tier 3 · High', range: '$500+ flagship grade' },
]

export default function PredictPage() {
  const [latestPrediction, setLatestPrediction] = useState(null)
  const navigate = useNavigate()

  const handlePredictionSuccess = (res) => {
    setLatestPrediction(res)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[var(--color-line)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="accent-label text-[0.7rem] font-semibold tracking-wider uppercase">
              Inference Workspace
            </span>
            <span className="phase-chip text-[0.62rem]">Live Model</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold mt-1 text-[var(--color-ink)]">
            Classifier Studio
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Classify candidate smartphone configurations against the production RFECV Random Forest model.
          </p>
        </div>

        {latestPrediction && (
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto animate-rise">
            <button
              type="button"
              onClick={() => navigate(`/explain/${latestPrediction.prediction_id}`)}
              className="cta-primary text-xs py-2 px-3.5 cursor-pointer"
            >
              Explain #{latestPrediction.prediction_id} in TreeSHAP →
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(`/what-if?predictionId=${latestPrediction.prediction_id}`)
              }
              className="cta-ghost text-xs py-2 px-3.5 cursor-pointer"
            >
              Simulate #{latestPrediction.prediction_id} in What-If →
            </button>
          </div>
        )}
      </div>

      {/* Main Form Container */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PredictionForm onPredictionSuccess={handlePredictionSuccess} />
        </div>

        {/* Sidebar Info & Helper */}
        <div className="lg:col-span-4 space-y-5">
          <div className="panel p-5 rounded-2xl space-y-3.5">
            <h3 className="font-display text-base font-bold text-[var(--color-ink)]">
              Pricing Tier Schema
            </h3>
            <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
              Devices are mapped into 4 balanced market price bands based on their hardware specification profile:
            </p>
            <ul className="space-y-2 text-xs">
              {TIER_SCHEMA.map((item) => {
                const isPredicted = latestPrediction?.predicted_tier === item.tier
                return (
                  <li
                    key={item.tier}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                      isPredicted
                        ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-soft)]'
                        : 'border-[var(--color-line)] bg-[var(--color-surface-subtle)]'
                    }`}
                  >
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold border text-[0.7rem] tier-badge-${item.tier}`}
                    >
                      {item.label}
                    </span>
                    <span className="text-[var(--color-ink-soft)]">{item.range}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="panel p-5 rounded-2xl space-y-3">
            <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">
              Model Telemetry
            </h3>
            <div className="text-xs divide-y divide-[var(--color-line)]">
              <div className="flex justify-between py-2">
                <span className="text-[var(--color-ink-soft)]">Status</span>
                <span className="font-semibold text-pos">● Active</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[var(--color-ink-soft)]">Algorithm</span>
                <span className="font-medium text-[var(--color-ink)]">Random Forest (100 trees)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[var(--color-ink-soft)]">Selection</span>
                <span className="font-medium text-[var(--color-ink)]">5-Fold Stratified RFECV</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[var(--color-ink-soft)]">Persistence</span>
                <span className="font-mono text-[0.7rem] text-[var(--color-ink)]">predictions table</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
