import axios from 'axios'

// Prefer relative path so Vite proxy handles dev and prod proxies easily, fallback to localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const TOKEN_STORAGE_KEY = 'analyst_jwt_token'
const LOGGED_OUT_KEY = 'analyst_explicit_logout'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach stored JWT token to outgoing requests when present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function notifyAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('tierlab-auth-change'))
  }
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function decodeJwtPayload(token) {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

export function getAuthStatus() {
  const token = getStoredToken()
  if (!token) {
    return { isAuthenticated: false, username: null, role: null, exp: null, token: null }
  }
  const payload = decodeJwtPayload(token)
  if (!payload) {
    return { isAuthenticated: false, username: null, role: null, exp: null, token: null }
  }
  if (payload.exp && Date.now() / 1000 >= payload.exp) {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    return { isAuthenticated: false, username: null, role: null, exp: null, token: null }
  }
  return {
    isAuthenticated: true,
    username: payload.sub || 'analyst',
    role: payload.role || 'analyst',
    exp: payload.exp || null,
    token,
  }
}

export function logoutAnalyst() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.setItem(LOGGED_OUT_KEY, 'true')
  notifyAuthChange()
}

export async function loginAnalyst(username = 'analyst', password = 'pricing2026') {
  const response = await apiClient.post('/auth/login', { username, password })
  if (response.data?.access_token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, response.data.access_token)
    localStorage.removeItem(LOGGED_OUT_KEY)
    notifyAuthChange()
  }
  return response.data
}

export async function ensureAuthToken() {
  let token = getStoredToken()
  const explicitlyLoggedOut = localStorage.getItem(LOGGED_OUT_KEY) === 'true'
  if (!token && !explicitlyLoggedOut) {
    const data = await loginAnalyst()
    token = data.access_token
  }
  return token
}

export async function predictTier(specs) {
  await ensureAuthToken()
  try {
    const response = await apiClient.post('/predict', specs)
    return response.data
  } catch (err) {
    if (err.response?.status === 401 && localStorage.getItem(LOGGED_OUT_KEY) !== 'true') {
      await loginAnalyst()
      const retry = await apiClient.post('/predict', specs)
      return retry.data
    }
    throw err
  }
}

export async function getFeatureImportance() {
  const response = await apiClient.get('/feature-importance')
  return response.data
}

export async function getExplanation(predictionId) {
  await ensureAuthToken()
  try {
    const response = await apiClient.get(`/explain/${predictionId}`)
    return response.data
  } catch (err) {
    if (err.response?.status === 401 && localStorage.getItem(LOGGED_OUT_KEY) !== 'true') {
      await loginAnalyst()
      const retry = await apiClient.get(`/explain/${predictionId}`)
      return retry.data
    }
    throw err
  }
}

export async function runWhatIf(baselinePredictionId, adjustments) {
  await ensureAuthToken()
  const payload = {
    baseline_prediction_id: Number(baselinePredictionId),
    adjustments,
  }
  try {
    const response = await apiClient.post('/whatif', payload)
    return response.data
  } catch (err) {
    if (err.response?.status === 401 && localStorage.getItem(LOGGED_OUT_KEY) !== 'true') {
      await loginAnalyst()
      const retry = await apiClient.post('/whatif', payload)
      return retry.data
    }
    throw err
  }
}

export async function checkHealth() {
  const response = await apiClient.get('/health')
  return response.data
}
