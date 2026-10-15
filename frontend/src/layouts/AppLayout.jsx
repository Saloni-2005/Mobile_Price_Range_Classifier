import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { checkHealth } from '../api/client'

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Overview',
    badge: 'KPIs',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    path: '/predict',
    label: 'Classifier Studio',
    badge: 'Module 01',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    path: '/features',
    label: 'Feature Importance',
    badge: 'Module 02',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    path: '/explain',
    label: 'TreeSHAP Studio',
    badge: 'Module 03',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    path: '/what-if',
    label: 'What-If Sandbox',
    badge: 'Preview',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
  {
    path: '/model-card',
    label: 'Model Governance',
    badge: 'Docs',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [apiOnline, setApiOnline] = useState(null)
  const location = useLocation()

  useEffect(() => {
    checkHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false))
  }, [])

  // Auto-close on small screens when clicking a link
  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-paper)] text-[var(--color-ink)] selection:bg-[var(--color-accent)] selection:text-[var(--color-cta-fg)] transition-colors">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Collapsible Left Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col justify-between border-[var(--color-line)] bg-[var(--color-panel-solid)] backdrop-blur-xl transition-all duration-300 ease-in-out ${
          sidebarOpen
            ? 'w-72 border-r translate-x-0'
            : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden'
        }`}
      >
        <div className="w-72">
          {/* Brand & Close Toggle Header */}
          <div className="p-4 border-b border-[var(--color-line)] flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-3 no-underline text-[var(--color-ink)]">
              <span className="logo-mark flex h-9 w-9 items-center justify-center rounded-xl font-display text-base font-extrabold shadow-sm">
                TL
              </span>
              <div>
                <span className="font-display text-base font-bold tracking-tight block">
                  TierLab
                </span>
                <span className="text-[0.62rem] tracking-wider uppercase text-[var(--color-ink-soft)] font-medium">
                  Pricing Intelligence
                </span>
              </div>
            </NavLink>

            {/* Sidebar Close Button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              title="Close sidebar"
              className="p-1.5 rounded-lg border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-chip-bg)] transition-colors cursor-pointer"
              aria-label="Collapse sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Active Model Status Badge */}
          <div className="p-3 mx-3 my-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-field-bg)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent)]" />
              </span>
              <span className="text-xs font-semibold">Production Model</span>
            </div>
            <span className="phase-chip text-[0.6rem]">Active</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all no-underline ${
                    isActive
                      ? 'bg-[var(--color-accent)] text-[var(--color-cta-fg)] shadow-sm font-semibold'
                      : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-chip-bg)]'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <span
                  className={`text-[0.6rem] px-1.5 py-0.5 rounded-md ${
                    location.pathname === item.path
                      ? 'bg-black/20 text-white'
                      : 'bg-[var(--color-line)] opacity-60 text-[var(--color-ink)]'
                  }`}
                >
                  {item.badge}
                </span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Area: API Health + Theme Toggle */}
        <div className="w-72 p-4 border-t border-[var(--color-line)] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-ink-soft)] text-[0.7rem]">Backend Status:</span>
            <span className="flex items-center gap-1.5 font-medium text-[0.7rem]">
              <span
                className={`h-2 w-2 rounded-full ${
                  apiOnline === true
                    ? 'bg-emerald-500'
                    : apiOnline === false
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
              {apiOnline === true ? 'Online (8000)' : apiOnline === false ? 'Offline' : 'Connecting...'}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-line)]">
            <span className="text-[0.7rem] text-[var(--color-ink-soft)]">Theme:</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Top Control Bar (Always visible or shows toggle when sidebar is closed) */}
        <header className="border-b border-[var(--color-line)] bg-[var(--color-panel-solid)]/80 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-30 transition-all">
          <div className="flex items-center gap-3">
            {/* Toggle Button to open sidebar */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-field-bg)] text-[var(--color-ink)] hover:border-[var(--color-accent)] transition-all cursor-pointer shadow-xs text-xs font-medium"
              aria-label="Toggle navigation sidebar"
            >
              <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline">
                {sidebarOpen ? 'Collapse' : 'Menu'}
              </span>
            </button>

            {/* When sidebar is collapsed, show quick brand logo */}
            {!sidebarOpen && (
              <NavLink to="/" className="flex items-center gap-2 text-[var(--color-ink)] no-underline animate-rise">
                <span className="logo-mark flex h-7 w-7 items-center justify-center rounded-lg font-display text-xs font-extrabold shadow-sm">
                  TL
                </span>
                <span className="font-display font-bold text-sm tracking-tight hidden sm:inline">
                  TierLab
                </span>
              </NavLink>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-[var(--color-line)] text-[0.65rem] bg-[var(--color-field-bg)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              <span className="font-medium text-[var(--color-ink-soft)]">Production Pipeline</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-5 md:p-8 max-w-7xl w-full mx-auto animate-rise">
          <Outlet />
        </main>

        <footer className="border-t border-[var(--color-line)] px-6 py-4 text-center text-xs text-[var(--color-ink-soft)]">
          Mobile Price-Range Classifier · Assisted Pricing Optimization Engine · Polaris School of Technology
        </footer>
      </div>
    </div>
  )
}
