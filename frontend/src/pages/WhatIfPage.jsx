import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getExplanation, predictTier, runWhatIf } from '../api/client'
import WhatIfSliders from '../components/WhatIfSliders'
import MarginImpactPanel from '../components/MarginImpactPanel'

/**
 * Default baseline device configuration (Mid-tier balanced smartphone)
 * used to initialize a real baseline prediction row when the user opens
 * the What-If Sandbox directly.
 */
const DEFAULT_BASELINE_SPECS = {
  battery_power: 1450,
  blue: 1,
  clock_speed: 1.8,
  dual_sim: 1,
  fc: 8,
  four_g: 1,
  int_memory: 32,
  m_dep: 0.5,
  mobile_wt: 145,
  n_cores: 6,
  pc: 13,
  px_height: 850,
  px_width: 1280,
  ram: 2100,
  sc_h: 14,
  sc_w: 7,
  talk_time: 12,
  three_g: 1,
  touch_screen: 1,
  wifi: 1,
}

export default function WhatIfPage() {
  const [searchParams] = useSearchParams()
  const queryPredId = searchParams.get('predictionId')

  const [baselinePrediction, setBaselinePrediction] = useState(null)
  const [baselineSpecs, setBaselineSpecs] = useState(DEFAULT_BASELINE_SPECS)
  const [whatIfResult, setWhatIfResult] = useState(null)
  const [simulating, setSimulating] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState(null)

  const handleSimulate = useCallback(
    async (adjustments, explicitPredId) => {
      const targetPredId = explicitPredId ?? baselinePrediction?.prediction_id
      if (!targetPredId) return

      setSimulating(true)
      setError(null)
      try {
        const res = await runWhatIf(targetPredId, adjustments)
        setWhatIfResult(res)
        return res
      } catch (err) {
        const detail =
          err?.response?.data?.detail ||
          err?.message ||
          'Failed to run what-if simulation'
        setError(typeof detail === 'string' ? detail : JSON.stringify(detail))
        return null
      } finally {
        setSimulating(false)
      }
    },
    [baselinePrediction?.prediction_id]
  )

  useEffect(() => {
    let cancelled = false

    async function initSandbox() {
      setInitializing(true)
      setError(null)
      try {
        if (queryPredId && !Number.isNaN(Number(queryPredId))) {
          const predIdNum = Number(queryPredId)
          // Fetch the prediction's actual feature values via /explain/{id}
          const explanation = await getExplanation(predIdNum)
          if (cancelled) return
          const rfeSpecs = {}
          if (explanation?.attributions) {
            explanation.attributions.forEach((attr) => {
              if (attr.feature_value !== null && attr.feature_value !== undefined) {
                rfeSpecs[attr.feature] = attr.feature_value
              }
            })
          }
          const seedAdjustment =
            Object.keys(rfeSpecs).length > 0
              ? rfeSpecs
              : { ram: DEFAULT_BASELINE_SPECS.ram }

          const initialSim = await runWhatIf(predIdNum, seedAdjustment)
          if (cancelled) return
          if (initialSim?.adjusted_specs) {
            setBaselineSpecs(initialSim.adjusted_specs)
          }
          setBaselinePrediction({
            prediction_id: predIdNum,
            predicted_tier: initialSim.baseline_tier,
            tier_label: initialSim.baseline_label,
            probabilities: initialSim.baseline_probabilities,
            model_version: initialSim.model_version,
          })
          setWhatIfResult(initialSim)
        } else {
          // Create a fresh baseline prediction so POST /whatif has a valid baseline_prediction_id
          const created = await predictTier(DEFAULT_BASELINE_SPECS)
          if (cancelled) return
          setBaselinePrediction(created)
          setBaselineSpecs(DEFAULT_BASELINE_SPECS)

          const initialSim = await runWhatIf(created.prediction_id, {
            ram: DEFAULT_BASELINE_SPECS.ram,
            battery_power: DEFAULT_BASELINE_SPECS.battery_power,
            px_width: DEFAULT_BASELINE_SPECS.px_width,
            px_height: DEFAULT_BASELINE_SPECS.px_height,
            mobile_wt: DEFAULT_BASELINE_SPECS.mobile_wt,
          })
          if (!cancelled) {
            setWhatIfResult(initialSim)
          }
        }
      } catch (err) {
        if (!cancelled) {
          const detail =
            err?.response?.data?.detail ||
            err?.message ||
            'Could not initialize baseline prediction for What-If sandbox'
          setError(typeof detail === 'string' ? detail : JSON.stringify(detail))
        }
      } finally {
        if (!cancelled) {
          setInitializing(false)
        }
      }
    }

    initSandbox()
    return () => {
      cancelled = true
    }
  }, [queryPredId])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--color-line)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="accent-label text-xs font-semibold tracking-wider uppercase">
              Module 04 &amp; 05
            </span>
            <span className="phase-chip text-[0.65rem]">
              {initializing
                ? 'Seeding Baseline...'
                : baselinePrediction
                ? `Baseline Prediction #${baselinePrediction.prediction_id}`
                : 'Interactive Simulation'}
            </span>
          </div>
          <h1 className="font-display text-3xl font-extrabold mt-1 text-[var(--color-ink)]">
            What-If &amp; Margin Sandbox
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-0.5">
            Simulate real-time hardware specification modifications to observe price-tier transitions and illustrative bill-of-materials (BOM) margin impact.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <WhatIfSliders
            key={baselinePrediction?.prediction_id ?? 'default'}
            baselineSpecs={baselineSpecs}
            baselinePredictionId={baselinePrediction?.prediction_id}
            onSimulate={handleSimulate}
            simulating={simulating || initializing}
          />
        </div>
        <div className="lg:col-span-6">
          <MarginImpactPanel
            whatIfResult={whatIfResult}
            baselinePrediction={baselinePrediction}
            loading={simulating || initializing}
            error={error}
          />
        </div>
      </div>
    </div>
  )
}
