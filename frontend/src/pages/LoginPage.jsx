import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  decodeJwtPayload,
  getAuthStatus,
  loginAnalyst,
  logoutAnalyst,
} from '../api/client'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('analyst')
  const [password, setPassword] = useState('pricing2026')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [authState, setAuthState] = useState(() => getAuthStatus())

  useEffect(() => {
    const syncAuth = () => setAuthState(getAuthStatus())
    window.addEventListener('tierlab-auth-change', syncAuth)
    return () => window.removeEventListener('tierlab-auth-change', syncAuth)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const data = await loginAnalyst(username.trim(), password)
      setAuthState(getAuthStatus())
      setSuccessMsg(
        `Authenticated as '${data.username}' (${data.role}) — HS256 Bearer JWT issued.`
      )
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        'Authentication failed (401 Unauthorized).'
      setError(detail)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    logoutAnalyst()
    setAuthState(getAuthStatus())
    setSuccessMsg(null)
    setError(null)
  }

  const handleFillDemo = () => {
    setUsername('analyst')
    setPassword('pricing2026')
    setError(null)
  }

  const decodedPayload = authState.token
    ? decodeJwtPayload(authState.token)
    : null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-[var(--color-line)] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="accent-label text-xs font-semibold tracking-wider uppercase">
              Security · PRD Ch. 10.4
            </span>
            <span className="phase-chip text-[0.65rem]">
              {authState.isAuthenticated ? 'JWT Active' : 'Unauthenticated'}
            </span>
          </div>
          <h1 className="font-display text-3xl font-extrabold mt-1 text-[var(--color-ink)]">
            Scoped Analyst Authentication
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-0.5">
            Sign in with the seeded pricing-analyst persona to obtain an HS256 Bearer JWT for protected inference, TreeSHAP, and What-If endpoints.
          </p>
        </div>

        {authState.isAuthenticated && (
          <button
            type="button"
            onClick={() => navigate('/predict')}
            className="cta-primary text-xs py-2.5 px-4 cursor-pointer self-start sm:self-auto"
          >
            Continue to Classifier Studio →
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Login Form Card */}
        <div className="lg:col-span-6">
          <section className="panel rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-[var(--color-ink)]">
                  Analyst Sign-In (<code>POST /auth/login</code>)
                </h2>
                <p className="text-xs text-[var(--color-ink-soft)] mt-1">
                  Verifies PBKDF2-HMAC-SHA256 password hash against the seeded <code>users</code> table and returns a signed RFC 7519 HS256 JWT.
                </p>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[0.68rem] px-2.5 py-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-field-bg)] hover:border-[var(--color-accent)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] cursor-pointer shrink-0"
              >
                Fill Seeded Credentials
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-600 dark:text-rose-300"
              >
                <strong>401 Unauthorized:</strong> {error}
              </div>
            )}

            {successMsg && (
              <div
                role="status"
                className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-300"
              >
                <strong>✓ Success:</strong> {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="auth-username"
                  className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1.5"
                >
                  Analyst Username
                </label>
                <input
                  id="auth-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="field-input w-full rounded-xl px-3.5 py-2.5 text-sm font-mono"
                  placeholder="analyst"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[0.68rem] text-[var(--color-accent)] hover:underline cursor-pointer"
                  >
                    {showPassword ? 'Hide' : 'Show'} password
                  </button>
                </div>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="field-input w-full rounded-xl px-3.5 py-2.5 text-sm font-mono"
                  placeholder="••••••••••"
                />
              </div>

              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-field-bg)] p-3 text-xs text-[var(--color-ink-soft)] flex items-center justify-between">
                <span>Seeded Demo Persona (PRD Ch. 10.4):</span>
                <code className="font-mono font-bold text-[var(--color-ink)]">
                  analyst / pricing2026
                </code>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="cta-primary text-xs py-2.5 px-5 cursor-pointer disabled:opacity-50"
                >
                  {loading
                    ? 'Authenticating...'
                    : authState.isAuthenticated
                    ? 'Re-Issue JWT Token'
                    : 'Sign In & Issue JWT'}
                </button>

                {authState.isAuthenticated && (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-xs py-2.5 px-4 rounded-xl border border-rose-500/40 text-rose-600 hover:bg-rose-500/10 font-semibold transition-all cursor-pointer"
                  >
                    Sign Out (Revoke Local JWT)
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>

        {/* Active Session & Endpoint Protection Matrix */}
        <div className="lg:col-span-6 space-y-5">
          <section className="panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
                Current JWT Session Telemetry
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  authState.isAuthenticated
                    ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                }`}
              >
                {authState.isAuthenticated ? '● Authenticated' : '○ Signed Out'}
              </span>
            </div>

            {authState.isAuthenticated && decodedPayload ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-[var(--color-field-bg)] border border-[var(--color-line)]">
                    <div className="text-[0.65rem] uppercase text-[var(--color-ink-soft)]">
                      Subject (sub)
                    </div>
                    <div className="font-mono font-bold mt-0.5 text-[var(--color-ink)]">
                      {decodedPayload.sub}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--color-field-bg)] border border-[var(--color-line)]">
                    <div className="text-[0.65rem] uppercase text-[var(--color-ink-soft)]">
                      Role Claim
                    </div>
                    <div className="font-mono font-bold mt-0.5 text-emerald-600">
                      {decodedPayload.role}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--color-field-bg)] border border-[var(--color-line)]">
                    <div className="text-[0.65rem] uppercase text-[var(--color-ink-soft)]">
                      Expires (UTC)
                    </div>
                    <div className="font-mono font-bold mt-0.5 text-[var(--color-ink)]">
                      {decodedPayload.exp
                        ? new Date(decodedPayload.exp * 1000).toLocaleTimeString()
                        : '60m'}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[0.68rem] uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                    Active Bearer Token (HS256)
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--color-field-bg)] border border-[var(--color-line)] font-mono text-[0.68rem] break-all text-[var(--color-ink-soft)]">
                    Bearer {authState.token}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--color-line)] p-4 text-xs text-[var(--color-ink-soft)]">
                No active Bearer JWT in <code>localStorage</code>. Protected API calls (<code>/predict</code>, <code>/explain</code>, <code>/whatif</code>) will be rejected with <code>401 Unauthorized</code> until you sign in.
              </div>
            )}
          </section>

          <section className="panel rounded-2xl p-6 space-y-3">
            <h3 className="font-display text-base font-bold text-[var(--color-ink)]">
              Endpoint Access Control Matrix (PRD Ch. 10.4)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--color-line)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-field-bg)] text-[0.68rem] uppercase text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
                  <tr>
                    <th className="py-2 px-3">Endpoint</th>
                    <th className="py-2 px-3">Auth Policy</th>
                    <th className="py-2 px-3">Unauth Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line)] font-mono text-[0.72rem]">
                  <tr>
                    <td className="py-2 px-3 font-semibold">POST /predict</td>
                    <td className="py-2 px-3 text-emerald-600">Bearer JWT Required</td>
                    <td className="py-2 px-3 text-rose-600">401 Unauthorized</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">GET /explain/&#123;id&#125;</td>
                    <td className="py-2 px-3 text-emerald-600">Bearer JWT Required</td>
                    <td className="py-2 px-3 text-rose-600">401 Unauthorized</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">POST /whatif</td>
                    <td className="py-2 px-3 text-emerald-600">Bearer JWT Required</td>
                    <td className="py-2 px-3 text-rose-600">401 Unauthorized</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">GET /feature-importance</td>
                    <td className="py-2 px-3 text-sky-600">Public</td>
                    <td className="py-2 px-3 text-[var(--color-ink-soft)]">200 OK</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">GET /health</td>
                    <td className="py-2 px-3 text-sky-600">Public</td>
                    <td className="py-2 px-3 text-[var(--color-ink-soft)]">200 OK</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
