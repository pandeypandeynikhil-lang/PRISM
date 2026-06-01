import { useState } from 'react'
import { Zap, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'
import { predictChurn } from '../services/api'

const RISK_COLOR = { low: 'var(--risk-low)', medium: 'var(--risk-medium)', high: 'var(--risk-high)', critical: 'var(--risk-critical)' }
const RISK_ICON  = { low: CheckCircle, medium: AlertTriangle, high: TrendingDown, critical: AlertTriangle }

const DEFAULTS = {
  customer_id: 'MANUAL_001', credit_score: 650, account_balance: 50000,
  num_products: 2, has_credit_card: true, is_active_member: true,
  estimated_salary: 600000, tenure_months: 24, age: 35,
  num_transactions_last_90d: 12, avg_transaction_value: 5000,
  digital_login_frequency: 8, complaints_last_year: 1, nps_score: 6.0,
  days_since_last_contact: 45,
}

const FIELDS = [
  { key: 'customer_id',             label: 'Customer ID',           type: 'text',   group: 'identity' },
  { key: 'age',                     label: 'Age',                   type: 'number', group: 'identity' },
  { key: 'credit_score',            label: 'Credit Score',          type: 'number', group: 'financial' },
  { key: 'account_balance',         label: 'Account Balance (₹)',   type: 'number', group: 'financial' },
  { key: 'estimated_salary',        label: 'Annual Salary (₹)',     type: 'number', group: 'financial' },
  { key: 'num_products',            label: 'No. of Products',       type: 'number', group: 'products' },
  { key: 'has_credit_card',         label: 'Has Credit Card',       type: 'bool',   group: 'products' },
  { key: 'is_active_member',        label: 'Active Member',         type: 'bool',   group: 'products' },
  { key: 'tenure_months',           label: 'Tenure (months)',       type: 'number', group: 'engagement' },
  { key: 'num_transactions_last_90d',label: 'Transactions (90d)',   type: 'number', group: 'engagement' },
  { key: 'avg_transaction_value',   label: 'Avg Txn Value (₹)',     type: 'number', group: 'engagement' },
  { key: 'digital_login_frequency', label: 'Logins/month',          type: 'number', group: 'engagement' },
  { key: 'complaints_last_year',    label: 'Complaints (1yr)',      type: 'number', group: 'satisfaction' },
  { key: 'nps_score',               label: 'NPS Score (0–10)',      type: 'number', step: '0.1', group: 'satisfaction' },
  { key: 'days_since_last_contact', label: 'Days Since Contact',    type: 'number', group: 'satisfaction' },
]

const GROUPS = [
  { id: 'identity',     label: 'Identity',     color: '#60a5fa' },
  { id: 'financial',    label: 'Financial',    color: 'var(--accent-gold)' },
  { id: 'products',     label: 'Products',     color: '#34d399' },
  { id: 'engagement',   label: 'Engagement',   color: '#a78bfa' },
  { id: 'satisfaction', label: 'Satisfaction', color: 'var(--risk-high)' },
]

export default function Predict() {
  const [form, setForm]       = useState(DEFAULTS)
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  function setValue(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await predictChurn(form)
      setResult(res)
    } catch (e) {
      setError(e.response?.data?.detail || 'Prediction failed. Ensure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const risk = result?.risk_tier || 'low'
  const RiskIcon = RISK_ICON[risk] || CheckCircle

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
          ◆ CHURN PREDICTION ENGINE
        </div>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)' }}>
          Manual <span style={{ color: 'var(--accent-gold)' }}>Prediction</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '0.88rem' }}>
          Enter customer data to run the Gradient Boosted ML model instantly
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {GROUPS.map(group => {
              const groupFields = FIELDS.filter(f => f.group === group.id)
              return (
                <div key={group.id} className="card" style={{ padding: 20, borderLeft: `3px solid ${group.color}` }}>
                  <div style={{ fontSize: '0.68rem', color: group.color, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
                    {group.label}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {groupFields.map(({ key, label, type, step }) => (
                      <div key={key}>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 5 }}>{label}</label>
                        {type === 'bool' ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            {[true, false].map(v => (
                              <button
                                key={String(v)} type="button"
                                onClick={() => setValue(key, v)}
                                style={{
                                  flex: 1, padding: '7px 0', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem',
                                  border: `1px solid ${form[key] === v ? group.color : 'var(--border)'}`,
                                  background: form[key] === v ? `${group.color}18` : 'var(--bg-elevated)',
                                  color: form[key] === v ? group.color : 'var(--text-muted)',
                                  transition: 'all 0.15s',
                                }}
                              >
                                {v ? 'Yes' : 'No'}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <input
                            className="input"
                            type={type}
                            step={step || (type === 'number' ? '1' : undefined)}
                            value={form[key]}
                            onChange={e => setValue(key, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            <button className="btn btn-gold" type="submit" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '1rem', justifyContent: 'center' }}>
              <Zap size={16} style={loading ? { animation: 'spin 0.8s linear infinite' } : {}} />
              {loading ? 'Running Model...' : 'Run Churn Prediction'}
            </button>

            {error && (
              <div style={{ padding: 14, background: 'var(--risk-high-bg)', border: '1px solid rgba(242,108,108,0.3)', borderRadius: 10, color: 'var(--risk-high)', fontSize: '0.83rem' }}>
                ⚠ {error}
              </div>
            )}
          </div>
        </form>

        {/* Result */}
        <div style={{ position: 'sticky', top: 24 }}>
          {!result ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Zap size={40} style={{ marginBottom: 16, opacity: 0.2 }} />
              <div style={{ fontSize: '0.9rem', marginBottom: 8 }}>Awaiting Prediction</div>
              <div style={{ fontSize: '0.75rem' }}>Fill the form and run the model to see results</div>
            </div>
          ) : (
            <div className="card" style={{ padding: 28, position: 'relative', overflow: 'hidden', borderLeft: `3px solid ${RISK_COLOR[risk]}` }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${RISK_COLOR[risk]}, transparent)` }} />

              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${RISK_COLOR[risk]}15`, border: `2px solid ${RISK_COLOR[risk]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <RiskIcon size={32} color={RISK_COLOR[risk]} />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 800, color: RISK_COLOR[risk], lineHeight: 1 }}>
                  {Math.round(result.churn_probability * 100)}%
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Churn Probability</div>
                <span className={`risk-badge ${risk}`} style={{ marginTop: 10 }}>{risk} risk</span>
              </div>

              {/* Confidence */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Model Confidence</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{Math.round((result.confidence_score || 0) * 100)}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${(result.confidence_score || 0) * 100}%`, background: RISK_COLOR[risk], borderRadius: 3 }} />
                </div>
              </div>

              {/* Top factors */}
              {result.top_risk_factors?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>Top Risk Factors</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.top_risk_factors.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {f.factor?.replace(/_/g, ' ')}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, marginLeft: 8 }}>
                              {(f.importance * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div style={{ height: 5, background: 'var(--bg-elevated)', borderRadius: 3 }}>
                            <div style={{ height: '100%', width: `${f.importance * 600}%`, maxWidth: '100%', background: RISK_COLOR[risk], borderRadius: 3, opacity: 0.7 - i * 0.1 }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation */}
              {result.explanation && (
                <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)', borderLeft: `3px solid ${RISK_COLOR[risk]}` }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>AI Explanation</div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
