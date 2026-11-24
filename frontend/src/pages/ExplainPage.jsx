import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ShapWaterfall from '../components/ShapWaterfall'

export default function ExplainPage() {
  const { predictionId } = useParams()
  const navigate = useNavigate()
  const [inputId, setInputId] = useState(predictionId || '')

  const handleLookup = (e) => {
    e.preventDefault()
    if (inputId.trim()) {
      navigate(`/explain/${inputId.trim()}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[var(--color-line)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="accent-label text-[0.7rem] font-semibold tracking-wider uppercase">
              Local Explainability
            </span>
            <span className="phase-chip text-[0.62rem]">TreeSHAP</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold mt-1 text-[var(--color-ink)]">
            TreeSHAP Studio
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Decompose any logged prediction into exact positive and negative hardware spec contributions.
          </p>
        </div>

        {/* Prediction ID Picker */}
        <form onSubmit={handleLookup} className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            placeholder="Prediction ID..."
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            className="field font-mono tabular-nums text-xs w-36 py-2"
          />
          <button type="submit" className="cta-primary text-xs py-2 px-3.5 cursor-pointer">
            Lookup
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ShapWaterfall predictionId={predictionId} />
        </div>

        {/* Explainer Guide */}
        <div className="lg:col-span-4 space-y-5">
          <div className="panel p-5 rounded-2xl space-y-3.5">
            <h3 className="font-display text-base font-bold text-[var(--color-ink)]">
              Understanding TreeSHAP
            </h3>
            <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
              TreeSHAP computes exact game-theoretic Shapley values across every tree in the Random Forest ensemble.
            </p>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-line)]">
                <span className="font-semibold text-[var(--color-accent-text)]">
                  Base Value E[f(X)]
                </span>
                <p className="text-[var(--color-ink-soft)] mt-0.5 leading-relaxed">
                  The prior class expectation across all training handsets before inspecting this device.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-line)]">
                <span className="font-semibold text-pos">Positive Attributions (+)</span>
                <p className="text-[var(--color-ink-soft)] mt-0.5 leading-relaxed">
                  Specs pushing probability toward the predicted tier (e.g., high RAM or battery capacity).
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-line)]">
                <span className="font-semibold text-warn">Negative Attributions (−)</span>
                <p className="text-[var(--color-ink-soft)] mt-0.5 leading-relaxed">
                  Specs pulling probability away from the predicted tier.
                </p>
              </div>
            </div>
          </div>

          <div className="panel p-5 rounded-2xl space-y-2.5">
            <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">
              Exact Additivity Guarantee
            </h3>
            <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
              Every API response verifies the local accuracy identity within tolerance:
            </p>
            <div className="font-mono text-[0.7rem] p-2.5 rounded-lg bg-[var(--color-surface-subtle)] border border-[var(--color-line)] text-[var(--color-ink)]">
              base_value + Σ(φᵢ) = P(class = c | x)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
