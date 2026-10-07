/**
 * ShapWaterfall — renders TreeSHAP attribution waterfall for a single prediction
 * (PRD Ch. 7.2). Connects to GET /explain/{prediction_id}.
 */
export default function ShapWaterfall({ predictionId }) {
  return (
    <section className="panel h-full rounded-2xl p-5 md:p-6" id="shap-panel">
      <div>
        <div className="flex items-center gap-2">
          <p className="accent-label text-[0.7rem] font-semibold tracking-[0.14em] uppercase">
            Module 03
          </p>
          <span className="phase-chip text-[0.65rem]">TreeSHAP Local</span>
        </div>
        <h2 className="font-display mt-1 text-xl font-bold">SHAP Waterfall</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Local TreeSHAP explanation for a single prediction — why this tier was selected.
        </p>
      </div>

      <div className="mt-6">
        {predictionId ? (
          <div className="rounded-xl border border-[var(--color-line)] p-4 bg-[var(--color-field-bg)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-ink)]">
                Target Prediction: <span className="font-mono text-[var(--color-accent)]">#{predictionId}</span>
              </span>
              <span className="text-[0.7rem] text-[var(--color-ink-soft)]">Awaiting Service Activation</span>
            </div>
            <div className="mt-4 flex flex-col items-center justify-center py-6 text-center text-xs text-[var(--color-ink-soft)]">
              <div className="skeleton-bar w-32 h-1.5 mb-2" />
              <p>Prediction #{predictionId} logged to database.</p>
              <p className="mt-1">
                Local feature attributions will stream from <code>GET /explain/{predictionId}</code> once the TreeSHAP service is wired.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--color-line)] p-6 text-center text-xs text-[var(--color-ink-soft)]">
            <p className="font-medium text-[var(--color-ink)]">No Prediction Selected</p>
            <p className="mt-1">
              Submit a device specification in Module 01 to view local SHAP attributions for that prediction.
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-[0.7rem] text-[var(--color-ink-soft)]">
        Live TreeSHAP attributions powered by <code>shap.TreeExplainer</code> (PRD Chapter 11/14).
      </p>
    </section>
  )
}
