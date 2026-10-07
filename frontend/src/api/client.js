import axios from 'axios'

// Prefer relative path so Vite proxy handles dev and prod proxies easily, fallback to localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function predictTier(specs) {
  const response = await apiClient.post('/predict', specs)
  return response.data
}

export async function getFeatureImportance() {
  const response = await apiClient.get('/feature-importance')
  return response.data
}

export async function checkHealth() {
  const response = await apiClient.get('/health')
  return response.data
}
