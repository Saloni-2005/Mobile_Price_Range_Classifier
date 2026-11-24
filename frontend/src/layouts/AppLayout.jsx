import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { checkHealth, ensureAuthToken } from '../api/client'

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Overview',
    shortLabel: 'Home',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    path: '/predict',
    label: 'Classifier Studio',
    shortLabel: 'Predict',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    path: '/features',
    label: 'Feature Importance',
    shortLabel: 'Features',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    path: '/explain',
    label: 'TreeSHAP Studio',
    shortLabel: 'SHAP',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    path: '/what-if',
    label: 'What-If Sandbox',
    shortLabel: 'What-If',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
  {
    path: '/model-card',
    label: 'Model Governance',
    shortLabel: 'Model Card',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
]

function getPageTitle(pathname) {
  if (pathname === '/') return 'Overview'
  if (pathname.startsWith('/predict')) return 'Classifier Studio'
  if (pathname.startsWith('/features')) return 'Feature Importance'
  if (pathname.startsWith('/explain')) return 'TreeSHAP Studio'
  if (pathname.startsWith('/what-if') || pathname.startsWith('/whatif')) return 'What-If Sandbox'
  if (pathname.startsWith('/model-card')) return 'Model Governance'
  if (pathname.startsWith('/login')) return 'Analyst Authentication'
  return 'TierLab'
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [apiOnline, setApiOnline] = useState(null)
  const location = useLocation()

  useEffect(() => {
    checkHealth()
      .then(() => {
        setApiOnline(true)
        return ensureAuthToken()
      })
      .catch(() => setApiOnline(false))
  }, [])

  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className="app-shell flex text-[var(--color-ink)] selection:bg-[var(--color-accent)] selection:text-[var(--color-cta-fg)]">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Collapsible Left Sidebar (Icon Rail when collapsed on desktop) */}
      <aside
        className={`fixed md:sticky md:top-0 md:h-screen inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-[var(--color-line)] bg-[var(--color-panel-solid)] transition-all duration-200 ease-out shrink-0 ${
          mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${sidebarOpen ? 'md:w-64' : 'md:w-[4.25rem]'}`}
      >
        <div className="flex flex-col overflow-hidden">
          {/* Brand Header */}
          <div
            className={`h-14 border-b border-[var(--color-line)] flex items-center ${
              sidebarOpen ? 'justify-between px-4' : 'justify-center px-2'
            }`}
          >
            <NavLink
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 no-underline text-[var(--color-ink)] min-w-0"
              title="TierLab Overview"
            >
              <span className="logo-mark flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-display text-sm font-extrabold shadow-xs">
                TL
              </span>
              {sidebarOpen && (
                <div className="truncate">
                  <span className="font-display text-sm font-bold tracking-tight block leading-none">
                    TierLab
                  </span>
                  <span className="text-[0.6rem] tracking-wider uppercase text-[var(--color-ink-muted)] font-medium block mt-1">
                    Pricing Desk
                  </span>
                </div>
              )}
            </NavLink>

            {sidebarOpen && (
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false)
                  setMobileMenuOpen(false)
                }}
                title="Collapse to icon rail"
                className="hidden md:flex p-1.5 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)] transition-colors cursor-pointer"
                aria-label="Collapse sidebar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>

          {/* Model Badge (expanded only) */}
          {sidebarOpen && (
            <div className="mx-3 mt-3 px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[0.72rem] font-semibold text-[var(--color-ink)] truncate">
                  RFECV v1.1.0
                </span>
              </div>
              <span className="font-mono text-[0.62rem] font-semibold text-pos">
                94.0%
              </span>
            </div>
          )}

          {/* Navigation Links */}
          <nav className={`p-2.5 space-y-1 ${sidebarOpen ? 'mt-1' : 'mt-2'}`}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileMenuOpen(false)}
                title={!sidebarOpen ? item.label : undefined}
                className={({ isActive }) =>
                  `relative flex items-center rounded-lg text-xs font-medium transition-all no-underline ${
                    sidebarOpen ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
                  } ${
                    isActive
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent-text)] font-semibold'
                      : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[var(--color-accent)]"
                        aria-hidden
                      />
                    )}
                    <span className="shrink-0">{item.icon}</span>
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Area: API Health */}
        <div className={`border-t border-[var(--color-line)] ${sidebarOpen ? 'p-3.5' : 'p-2.5 flex justify-center'}`}>
          <div
            className={`flex items-center text-[0.7rem] ${
              sidebarOpen ? 'justify-between px-1' : 'justify-center py-1'
            }`}
            title={
              apiOnline === true
                ? 'Backend API Online (Port 8000)'
                : apiOnline === false
                ? 'Backend API Offline'
                : 'Connecting to API...'
            }
          >
            {sidebarOpen && (
              <span className="text-[var(--color-ink-muted)]">API Status</span>
            )}
            <span className="flex items-center gap-1.5 font-mono font-medium">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  apiOnline === true
                    ? 'bg-emerald-500'
                    : apiOnline === false
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
              {sidebarOpen && (
                <span className="text-[var(--color-ink-soft)]">
                  {apiOnline === true ? 'Online' : apiOnline === false ? 'Offline' : 'Checking'}
                </span>
              )}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Control Bar */}
        <header className="h-14 border-b border-[var(--color-line)] bg-[var(--color-panel-solid)]/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile drawer toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-subtle)] text-[var(--color-ink)] cursor-pointer"
              aria-label="Open navigation menu"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Desktop rail expand button */}
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                title="Expand sidebar"
                className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-subtle)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-line-strong)] transition-colors cursor-pointer text-xs font-medium"
                aria-label="Expand sidebar"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs min-w-0">
              <span className="text-[var(--color-ink-muted)] hidden sm:inline">TierLab</span>
              <span className="text-[var(--color-ink-muted)] hidden sm:inline">/</span>
              <span className="font-semibold text-[var(--color-ink)] truncate">
                {pageTitle}
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-[var(--color-line)] text-[0.68rem] bg-[var(--color-surface-subtle)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-[var(--color-ink-soft)]">
                Tuned RFECV · 5 Drivers
              </span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 px-5 py-6 md:px-8 md:py-8 max-w-7xl w-full mx-auto animate-rise">
          <Outlet />
        </main>

        <footer className="border-t border-[var(--color-line)] px-6 py-4 text-center text-[0.72rem] text-[var(--color-ink-muted)]">
          TierLab · Assisted Pricing Optimization Engine · Polaris School of Technology
        </footer>
      </div>
    </div>
  )
}
