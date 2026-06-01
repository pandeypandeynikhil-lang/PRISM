import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, AlertTriangle, TrendingDown, IndianRupee, Zap, Shield, RefreshCw, Database } from 'lucide-react'
import StatCard from '../components/StatCard'
import RiskChart from '../components/RiskChart'
import { getSummary, getTopAtRisk, seedCustomers } from '../services/api'

function fmtInr(n) {
  if (!n) return '₹0'
  if (n >= 1e7) return `₹${(n/1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `₹${(n/1e5).toFixed(1)}L`
  if (n >= 1e3) return `₹${(n/1e3).toFixed(0)}K`
  return `₹${Math.round(n)}`
}

const RISK_COLOR = { low: 'var(--risk-low)', medium: 'var(--risk-medium)', high: 'var(--risk-high)', critical: 'var(--risk-critical)' }

export default function Dashboard() {
  const [summary, setSummary]     = useState(null)
  const [topRisk, setTopRisk]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [seeding, setSeeding]     = useState(false)
  const navigate = useNavigate()

  async function load() {
    setLoading(true)
    try {
      const [s, t] = await Promise.all([getSummary(), getTopAtRisk(8)])
      setSummary(s); setTopRisk(t)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function handleSeed() {
    setSeeding(true)
    try { await seedCustomers(60); await load() }
    finally { setSeeding(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
            ◆ PRISM INTELLIGENCE DASHBOARD
          </div>
          <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            Retention Command<br />
            <span style={{ color: 'var(--accent-gold)' }}>Center</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 10, fontSize: '0.9rem', maxWidth: 500 }}>
            Real-time AI-powered churn prediction and proactive retention intelligence for your banking portfolio.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button className="btn btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            Refresh
          </button>
          <button className="btn btn-gold" onClick={handleSeed} disabled={seeding}>
            <Database size={14} />
            {seeding ? 'Seeding...' : 'Seed Demo Data'}
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard loading={loading} label="Total Customers"    value={summary?.total_customers?.toLocaleString() ?? '—'} sub="in portfolio" icon={Users}         accent="#60a5fa" />
        <StatCard loading={loading} label="Avg Churn Risk"     value={summary ? `${(summary.avg_churn_probability * 100).toFixed(1)}%` : '—'} sub="portfolio average" icon={TrendingDown} accent="var(--risk-high)" />
        <StatCard loading={loading} label="Revenue at Risk"    value={summary ? fmtInr(summary.revenue_at_risk) : '—'} sub="annual exposure" icon={IndianRupee}  accent="var(--risk-critical)" />
        <StatCard loading={loading} label="Retention Rate"     value={summary ? `${summary.retention_rate_estimate}%` : '—'} sub="est. current" icon={Shield}     accent="var(--risk-low)" />
        <StatCard loading={loading} label="Active Strategies"  value={summary?.pending_strategies?.toLocaleString() ?? '—'} sub="awaiting action" icon={Zap}    accent="var(--accent-gold)" />
        <StatCard loading={loading} label="Critical Alerts"    value={summary?.risk_distribution?.critical?.toLocaleString() ?? '—'} sub="immediate action" icon={AlertTriangle} accent="var(--risk-critical)" />
      </div>

      {/* Charts + Top Risk */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 32 }}>
        {/* Donut chart */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
            Risk Distribution
          </div>
          {loading ? (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <RiskChart data={summary?.risk_distribution} />
          )}
        </div>

        {/* Top at-risk */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>
              Top At-Risk Customers
            </div>
            <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: '0.75rem' }} onClick={() => navigate('/customers?risk_tier=critical')}>
              View All →
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />)}
            </div>
          ) : topRisk.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No customers found. Seed demo data to get started.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topRisk.map((c, i) => {
                const prob = Math.round((c.churn_probability || 0) * 100)
                const risk = c.risk_tier || 'low'
                return (
                  <div
                    key={c.customer_id}
                    onClick={() => navigate(`/customers/${c.customer_id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      background: 'var(--bg-elevated)', borderRadius: 10, cursor: 'pointer',
                      border: '1px solid var(--border)', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}
                  >
                    <div style={{ width: 24, fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>#{i+1}</div>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: `${RISK_COLOR[risk]}20`, border: `2px solid ${RISK_COLOR[risk]}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8rem', color: RISK_COLOR[risk],
                    }}>
                      {c.name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.segment} · LTV {fmtInr(c.ltv_score)}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', color: RISK_COLOR[risk] }}>{prob}%</div>
                      <span className={`risk-badge ${risk}`}>{risk}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* System status */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)' }}>System Status</div>
        {[
          { label: 'ML Engine',      status: 'LIVE' },
          { label: 'RAG Engine',     status: 'LIVE' },
          { label: 'Gemini AI',      status: 'LIVE' },
          { label: 'Database',       status: 'LIVE' },
        ].map(({ label, status }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--risk-low)', boxShadow: '0 0 6px var(--risk-low)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{label}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--risk-low)', fontFamily: 'var(--font-mono)' }}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
