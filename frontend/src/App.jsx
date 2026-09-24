import PredictionForm from './components/PredictionForm'
import FeatureImportanceChart from './components/FeatureImportanceChart'
import ShapWaterfall from './components/ShapWaterfall'
import WhatIfSliders from './components/WhatIfSliders'
import MarginImpactPanel from './components/MarginImpactPanel'
import ThemeToggle from './components/ThemeToggle'

function DeviceMark() {
  return (
    <div className="device-float relative mx-auto h-64 w-40 md:h-80 md:w-48">
      <div className="device-shell absolute inset-0 rounded-[2rem]" />
      <div className="device-notch absolute inset-x-6 top-4 h-2 rounded-full" />
      <div className="device-screen absolute inset-x-5 top-10 bottom-8 overflow-hidden rounded-2xl p-3">
        <p className="accent-label font-display text-[0.65rem] font-semibold tracking-[0.18em] uppercase">
          Predicted tier
        </p>
        <p className="font-display mt-2 text-4xl font-extrabold text-[var(--color-ink)]">
          Mid-High
        </p>
        <div className="mt-4 space-y-2">
          {[
            { label: 'Low', w: '18%' },
            { label: 'Mid', w: '28%' },
            { label: 'Mid-High', w: '72%' },
            { label: 'High', w: '22%' },
          ].map((row, i) => (
            <div key={row.label}>
              <div className="mb-1 flex justify-between text-[0.6rem] text-[var(--color-ink-soft)]">
                <span>{row.label}</span>
              </div>
              <div className="bar-track h-1.5 rounded-full">
                <div
                  className="skeleton-bar h-1.5"
                  style={{ width: row.w, animationDelay: `${0.15 * i}s` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="live-dot glow-orb absolute -right-3 top-16 h-10 w-10 rounded-full" />
      <div className="device-tag absolute -left-6 bottom-16 rounded-md px-2 py-1 text-[0.65rem] font-medium backdrop-blur">
        RAM · +800 MB
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="app-shell">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <span className="logo-mark flex h-9 w-9 items-center justify-center rounded-lg font-display text-sm font-bold">
            TL
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            TierLab
          </span>
        </div>
        <div className="nav-actions">
          <ThemeToggle />
        </div>
      </nav>

      <header className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-4 md:grid-cols-[1.15fr_0.85fr] md:gap-14 md:px-8 md:pb-24 md:pt-8">
        <div>
          <p className="animate-rise font-display text-5xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-6xl md:text-7xl">
            TierLab
          </p>
          <h1 className="animate-rise-delay-1 mt-4 max-w-xl font-display text-2xl font-semibold leading-snug text-[var(--color-ink)] sm:text-3xl">
            Spec-driven price-tier decisions, without the spreadsheet guesswork.
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-lg text-base leading-relaxed text-[var(--color-ink-soft)]">
            An assisted pricing console for mobile PMs — predict the tier, see
            what moves it, and stress-test trade-offs before launch.
          </p>
          <div className="animate-rise-delay-3 mt-8 flex flex-wrap gap-3">
            <a className="cta-primary" href="#workspace">
              Open analyst workspace
              <span aria-hidden>→</span>
            </a>
            <a className="cta-ghost" href="#workspace">
              Explore modules
            </a>
          </div>
        </div>

        <div className="animate-rise-delay-2 relative flex justify-center">
          <DeviceMark />
        </div>
      </header>

      <main id="workspace" className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="accent-label text-xs font-medium tracking-[0.16em] uppercase">
              Analyst workspace
            </p>
            <h2 className="font-display mt-1 text-2xl font-bold tracking-tight md:text-3xl">
              Five modules. One pricing engine.
            </h2>
          </div>
          <p className="max-w-sm text-sm text-[var(--color-ink-soft)]">
            Predict price tier, understand why, and simulate spec trade-offs
            — all from a single dashboard.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <PredictionForm />
          </div>
          <div className="lg:col-span-5">
            <FeatureImportanceChart />
          </div>
          <div className="lg:col-span-6">
            <ShapWaterfall />
          </div>
          <div className="lg:col-span-6">
            <WhatIfSliders />
          </div>
          <div className="lg:col-span-12">
            <MarginImpactPanel />
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--color-line)] px-5 py-6 text-center text-xs text-[var(--color-ink-soft)] md:px-8">
        Mobile Price-Range Classifier · Assisted Pricing Optimization Engine ·
        Polaris School of Technology
      </footer>
    </div>
  )
}

export default App
