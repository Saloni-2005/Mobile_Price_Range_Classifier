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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-line)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="accent-label text-xs font-semibold tracking-wider uppercase">Module 03</span>
            <span className="phase-chip text-[0.65rem]">TreeSHAP Local Attribution</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold mt-1 text-[var(--color-ink)]">
            TreeSHAP Studio
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-0.5">
            Local feature attributions decomposing individual predictions into positive and negative spec contributions.
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
            className="field px-3 py-1.5 text-xs w-36"
          />
          <button type="submit" className="cta-primary text-xs py-1.5 px-3 cursor-pointer">
            Lookup
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ShapWaterfall predictionId={predictionId} />
        </div>

        {/* Explainer Guide */}
        <div className="lg:col-span-4 space-y-4">
          <div className="panel p-5 rounded-2xl border border-[var(--color-line)] space-y-3">
            <h3 className="font-display text-base font-bold text-[var(--color-ink)]">
              Understanding TreeSHAP
            </h3>
            <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
              TreeSHAP (Tree Shapley Additive exPlanations) is a game-theoretic approach that calculates the marginal contribution of each feature to a prediction.
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-lg bg-[var(--color-field-bg)] border border-[var(--color-line)]">
                <span className="font-bold text-[var(--color-accent)]">Base Value (Expected Output):</span>
                <p className="text-[var(--color-ink-soft)] mt-0.5">The average model prediction across all training handsets.</p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--color-field-bg)] border border-[var(--color-line)]">
                <span className="font-bold text-emerald-600">Positive Attributions (+):</span>
                <p className="text-[var(--color-ink-soft)] mt-0.5">Specs that push the prediction into a higher tier (e.g. 4000 MB RAM).</p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--color-field-bg)] border border-[var(--color-line)]">
                <span className="font-bold text-amber-600">Negative Attributions (-):</span>
                <p className="text-[var(--color-ink-soft)] mt-0.5">Specs that drag the prediction down into a lower tier.</p>
              </div>
            </div>
          </div>

          <div className="panel p-5 rounded-2xl border border-[var(--color-line)] space-y-2">
            <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">
              Mathematical Additivity
            </h3>
            <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
              Per PRD Chapter 14.1, TreeSHAP satisfies the additivity property:
            </p>
            <div className="font-mono text-[0.7rem] p-2 rounded bg-[var(--color-field-bg)] border border-[var(--color-line)]">
              sum(attributions) + base_value = raw_output
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
