import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Analytics ──────────────────────────────────
export const getSummary       = ()            => api.get('/analytics/summary').then(r => r.data)
export const getSegments      = ()            => api.get('/analytics/segments').then(r => r.data)
export const getTopAtRisk     = (limit = 10)  => api.get(`/analytics/top-at-risk?limit=${limit}`).then(r => r.data)

// ── Customers ──────────────────────────────────
export const getCustomers     = (params = {}) => api.get('/customers', { params }).then(r => r.data)
export const getCustomer      = (id)          => api.get(`/customers/${id}`).then(r => r.data)
export const seedCustomers    = (count = 50)  => api.post(`/customers/seed?count=${count}`).then(r => r.data)

// ── Predict ────────────────────────────────────
export const predictChurn     = (data)        => api.post('/predict', data).then(r => r.data)

// ── Retention ──────────────────────────────────
export const getStrategies    = (cid)         => api.get(`/retention/strategies/${cid}`).then(r => r.data)
export const generateStrategy = (cid)         => api.post(`/retention/generate/${cid}`).then(r => r.data)
export const updateStrategy   = (id, status)  => api.patch(`/retention/strategies/${id}/status`, { status }).then(r => r.data)

// ── RAG Chat ───────────────────────────────────
export const ragChat          = (question, customer_id) => api.post('/rag/chat', { question, customer_id }).then(r => r.data)
export const ragSearch        = (query)       => api.post('/rag/search', { query }).then(r => r.data)

export default api
