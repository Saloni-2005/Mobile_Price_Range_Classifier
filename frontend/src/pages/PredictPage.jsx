import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PredictionForm from '../components/PredictionForm'

export default function PredictPage() {
  const [latestPrediction, setLatestPrediction] = useState(null)
  const navigate = useNavigate()

  const handlePredictionSuccess = (res) => {
    setLatestPrediction(res)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--color-line)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="accent-label text-xs font-semibold tracking-wider uppercase">Module 01</span>
            <span className="phase-chip text-[0.65rem]">Live Inference</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold mt-1 text-[var(--color-ink)]">
            Classifier Studio
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-0.5">
            Test candidate smartphone hardware configurations against the production RFECV model.
          </p>
        </div>

        {latestPrediction && (
          <button
            type="button"
            onClick={() => navigate(`/explain/${latestPrediction.prediction_id}`)}
            className="cta-primary text-xs py-2 px-3.5 self-start sm:self-auto cursor-pointer animate-rise"
          >
            Explain #{latestPrediction.prediction_id} in TreeSHAP →
          </button>
        )}
      </div>

      {/* Main Form Container */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PredictionForm onPredictionSuccess={handlePredictionSuccess} />
        </div>

        {/* Sidebar Info & Helper */}
        <div className="lg:col-span-4 space-y-4">
          <div className="panel p-5 rounded-2xl border border-[var(--color-line)] space-y-3">
            <h3 className="font-display text-base font-bold text-[var(--color-ink)]">
              Pricing Tier Schema
            </h3>
            <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
              Predictions are categorized into 4 calibrated price bands based on hardware features:
            </p>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-field-bg)] border border-[var(--color-line)]">
                <span className="font-semibold text-sky-600">Tier 0: Low</span>
                <span className="text-[var(--color-ink-soft)]">Sub-$150 entry level</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-field-bg)] border border-[var(--color-line)]">
                <span className="font-semibold text-emerald-600">Tier 1: Mid</span>
                <span className="text-[var(--color-ink-soft)]">$150–$300 mainstream</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-field-bg)] border border-[var(--color-line)]">
                <span className="font-semibold text-amber-600">Tier 2: Mid-High</span>
                <span className="text-[var(--color-ink-soft)]">$300–$500 upper mid</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-field-bg)] border border-[var(--color-line)]">
                <span className="font-semibold text-purple-600">Tier 3: High</span>
                <span className="text-[var(--color-ink-soft)]">$500+ flagship grade</span>
              </li>
            </ul>
          </div>

          <div className="panel p-5 rounded-2xl border border-[var(--color-line)] space-y-2">
            <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">
              Model Telemetry
            </h3>
            <div className="text-xs space-y-1 text-[var(--color-ink-soft)]">
              <div>Status: <span className="font-semibold text-emerald-600">Active</span></div>
              <div>Algorithm: <span className="font-medium text-[var(--color-ink)]">Random Forest (100 trees)</span></div>
              <div>Selection: <span className="font-medium text-[var(--color-ink)]">5-Fold Stratified RFECV</span></div>
              <div>Logging: <span className="font-medium text-[var(--color-ink)]">SQLite <code>predictions</code> table</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
