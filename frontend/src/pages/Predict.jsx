import { useState } from 'react'
import { Zap, CheckCircle, AlertTriangle, TrendingDown } from 'lucide-react'
import { predictChurn } from '../services/api.js'
import { ZoneBadge, CpiGauge, ZONE_META } from '../components/ZoneBadge.jsx'

const DEFAULTS = {
  customer_id: 'MANUAL_001',
  credit_score: 650,
  account_balance: 50000,
  estimated_salary: 500000,
  avg_transaction_value: 3000,
  num_products: 2,
  has_credit_card: true,
  is_active_member: true,
  num_transactions_last_90d: 10,
  days_since_last_transaction: 15,
  total_annual_txn_value: 150000,
  digital_login_frequency: 8,
  tenure_months: 24,
  days_since_last_contact: 30,
  complaints_last_year: 0,
  nps_score: 7.0,
  age: 35,
}

const GROUPS = [
  {
    id: 'identity', label: 'Identity', color: '#60a5fa',
    fields: [
      { key: 'customer_id', label: 'Customer ID', type: 'text' },
      { key: 'age',         label: 'Age',          type: 'number' },
    ]
  },
  {
    id: 'financial', label: 'Financial', color: 'var(--accent-gold)',
    fields: [
      { key: 'credit_score',         label: 'Credit Score',        type: 'number' },
      { key: 'account_balance',      label: 'Account Balance (₹)', type: 'number' },
      { key: 'estimated_salary',     label: 'Annual Salary (₹)',   type: 'number' },
      { key: 'avg_transaction_value',label: 'Avg Txn Value (₹)',   type: 'number' },
    ]
  },
  {
    id: 'products', label: 'Products', color: '#34d399',
    fields: [
      { key: 'num_products',    label: 'No. of Products', type: 'number' },
      { key: 'has_credit_card', label: 'Has Credit Card', type: 'bool' },
      { key: 'is_active_member',label: 'Active Member',   type: 'bool' },
    ]
  },
  {
    id: 'rfm', label: 'RFM Signals', color: '#a78bfa',
    fields: [
      { key: 'num_transactions_last_90d',   label: 'Transactions (90d)',      type: 'number' },
      { key: 'days_since_last_transaction', label: 'Days Since Last Txn',     type: 'number' },
      { key: 'total_annual_txn_value',      label: 'Total Annual Txn (₹)',    type: 'number' },
    ]
  },
  {
    id: 'engagement', label: 'Engagement', color: '#f59e0b',
    fields: [
      { key: 'digital_login_frequency', label: 'Logins/month',       type: 'number' },
      { key: 'tenure_months',           label: 'Tenure (months)',     type: 'number' },
      { key: 'days_since_last_contact', label: 'Days Since Contact',  type: 'number' },
    ]
  },
  {
    id: 'satisfaction', label: 'Satisfaction', color: 'var(--risk-high)',
    fields: [
      { key: 'complaints_last_year', label: 'Complaints (1yr)',   type: 'number' },
      { key: 'nps_score',            label: 'NPS Score (0–10)',   type: 'number', step: '0.1' },
    ]
  },
]

export default function Predict() {
  const [form, setForm]       = useState(DEFAULTS)
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  function setValue(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(null)
    try { setResult(await predictChurn(form)) }
    catch (e) { setError(e.response?.data?.detail || 'Prediction failed. Is the backend running?') }
    finally { setLoading(false) }
  }

  const zone    = result?.zone?.zone_number || 1
  const z       = ZONE_META[zone] || ZONE_META[1]
  const prob    = result ? Math.round(result.churn_probability * 100) : 0
  const RiskIcon = zone >= 5 ? AlertTriangle : zone >= 3 ? TrendingDown : CheckCircle

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--accent-gold)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>◆ CHURN PREDICTION ENGINE</div>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)' }}>
          Manual <span style={{ color: 'var(--accent-gold)' }}>Prediction</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '0.88rem' }}>
          Random Forest model · 5-Zone seismic classification · CPI = α·CRS + β·OS + γ·IS
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {GROUPS.map(group => (
              <div key={group.id} className="card" style={{ padding: 20, borderLeft: `3px solid ${group.color}` }}>
                <div style={{ fontSize: '0.65rem', color: group.color, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>{group.label}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {group.fields.map(({ key, label, type, step }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</label>
                      {type === 'bool' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[true, false].map(v => (
                            <button key={String(v)} type="button" onClick={() => setValue(key, v)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', border: `1px solid ${form[key] === v ? group.color : 'var(--border)'}`, background: form[key] === v ? `${group.color}18` : 'var(--bg-elevated)', color: form[key] === v ? group.color : 'var(--text-muted)', transition: 'all 0.15s' }}>
                              {v ? 'Yes' : 'No'}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <input className="input" type={type} step={step || (type === 'number' ? '1' : undefined)} value={form[key]} onChange={e => setValue(key, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button className="btn btn-gold" type="submit" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '1rem', justifyContent: 'center' }}>
              <Zap size={15} style={loading ? { animation: 'spin 0.8s linear infinite' } : {}} />
              {loading ? 'Running Model...' : 'Run Churn Prediction'}
            </button>
            {error && <div style={{ padding: 12, background: 'var(--risk-high-bg)', border: '1px solid rgba(242,108,108,0.3)', borderRadius: 10, color: 'var(--risk-high)', fontSize: '0.82rem' }}>⚠ {error}</div>}
          </div>
        </form>

        {/* Result */}
        <div style={{ position: 'sticky', top: 24 }}>
          {!result ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Zap size={40} style={{ marginBottom: 16, opacity: 0.15 }} />
              <div style={{ fontSize: '0.9rem', marginBottom: 6 }}>Awaiting Prediction</div>
              <div style={{ fontSize: '0.75rem' }}>Fill the form and click Run to see results</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Main result card */}
              <div className="card" style={{ padding: 28, position: 'relative', overflow: 'hidden', borderLeft: `3px solid ${z.color}` }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${z.color}, transparent)` }} />
                <div style={{ textAlign: 'center', marginBottom: 22 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${z.color}15`, border: `2px solid ${z.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <RiskIcon size={28} color={z.color} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 800, color: z.color, lineHeight: 1 }}>{prob}%</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, marginBottom: 10 }}>Churn Risk Score (CRS)</div>
                  <ZoneBadge zone={zone} size="lg" showAction />
                </div>

                {/* Confidence */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Model Confidence</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{Math.round((result.confidence_score||0)*100)}%</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--bg-elevated)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${(result.confidence_score||0)*100}%`, background: z.color, borderRadius: 3 }} />
                  </div>
                </div>

                {/* Top risk factors */}
                {result.top_risk_factors?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
                      Top Risk Factors ({result.top_risk_factors[0]?.method === 'shap' ? 'SHAP Values' : 'RF Importance'})
                    </div>
                    {result.top_risk_factors.map((f, i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>{f.factor?.replace(/_/g, ' ')}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{(f.importance*100).toFixed(1)}%</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${Math.min(f.importance*500, 100)}%`, background: z.color, borderRadius: 2, opacity: 0.8 - i*0.1 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Explanation */}
                {result.explanation && (
                  <div style={{ padding: 13, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)', borderLeft: `3px solid ${z.color}` }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>AI Explanation</div>
                    <p style={{ fontSize: '0.81rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.explanation}</p>
                  </div>
                )}
              </div>

              {/* CPI Gauge */}
              <CpiGauge cpi={result.cpi_score} os={result.opportunity_score} is={result.inclusion_score} />

              {/* Zone action card */}
              <div className="card" style={{ padding: 18, background: z.bg, border: `1px solid ${z.border}` }}>
                <div style={{ fontSize: '0.62rem', color: z.color, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Recommended Action</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: z.color, fontFamily: 'var(--font-display)' }}>{z.action}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  {zone === 5 && 'Immediate RM call required within 24 hours. Approve premium offers.'}
                  {zone === 4 && 'Contact within 48 hours. Targeted outreach + service improvement.'}
                  {zone === 3 && 'Automated campaign within 5 days. Product cross-sell opportunity.'}
                  {zone === 2 && 'Enrol in loyalty program. Low-touch digital engagement.'}
                  {zone === 1 && 'Standard monthly communication. Maintain satisfaction level.'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
