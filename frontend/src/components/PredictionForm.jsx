/**
 * PredictionForm — input panel for entering a candidate device spec (PRD Ch. 7.2).
 * Connects to POST /predict. Currently displays a preview form.
 */
const FIELDS = [
  { key: 'battery_power', label: 'Battery (mAh)', value: '1500' },
  { key: 'ram', label: 'RAM (MB)', value: '3200' },
  { key: 'int_memory', label: 'Storage (GB)', value: '32' },
  { key: 'px_height', label: 'Px height', value: '800' },
  { key: 'px_width', label: 'Px width', value: '1200' },
  { key: 'mobile_wt', label: 'Weight (g)', value: '150' },
]

export default function PredictionForm() {
  return (
    <section className="panel h-full rounded-2xl p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="accent-label text-[0.7rem] font-medium tracking-[0.14em] uppercase">
            Module 01
          </p>
          <h2 className="font-display mt-1 text-xl font-bold">Predict tier</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Enter a candidate handset spec to get its predicted price tier.
          </p>
        </div>
      </div>

      <form
        className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"
        onSubmit={(e) => e.preventDefault()}
      >
        {FIELDS.map((field) => (
          <label key={field.key} className="block text-left">
            <span className="mb-1 block text-[0.7rem] font-medium text-[var(--color-ink-soft)]">
              {field.label}
            </span>
            <input
              className="field"
              name={field.key}
              defaultValue={field.value}
              disabled
              aria-disabled="true"
            />
          </label>
        ))}
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled
          className="rounded-lg bg-[var(--color-ink)] px-4 py-2.5 text-sm font-medium text-[var(--color-cta-fg)] opacity-55"
        >
          Run prediction
        </button>
        <span className="text-xs text-[var(--color-ink-soft)]">
          Live inference coming soon via /predict.
        </span>
      </div>
    </section>
  )
}
