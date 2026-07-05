import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, TrendingDown, IndianRupee, Zap, Shield, RefreshCw, Database, Target } from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import RiskChart from '../components/RiskChart.jsx'
import { ZoneBadge, ZONE_META } from '../components/ZoneBadge.jsx'
import { getSummary, getTopAtRisk, seedCustomers } from '../services/api.js'

function fmtInr(n) {
  if (!n) return '₹0'
  if (n >= 1e7) return `₹${(n/1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `₹${(n/1e5).toFixed(1)}L`
  if (n >= 1e3) return `₹${(n/1e3).toFixed(0)}K`
  return `₹${Math.round(n)}`
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [topRisk, setTopRisk] = useState([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
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
          <div style={{ fontSize: '0.68rem', color: 'var(--accent-gold)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
            ◆ PRISM v2 — PREDICTIVE RETENTION INTELLIGENCE
          </div>
          <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            Retention Command<br /><span style={{ color: 'var(--accent-gold)' }}>Center</span>
          </h1>
          <div style={{ marginTop: 10, padding: '6px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, display: 'inline-block' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              CPI = <span style={{ color: 'var(--accent-gold)' }}>α·CRS</span> + <span style={{ color: '#d4a853' }}>β·OS</span> + <span style={{ color: '#60a5fa' }}>γ·IS</span>
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button className="btn btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
          </button>
          <button className="btn btn-gold" onClick={handleSeed} disabled={seeding}>
            <Database size={14} /> {seeding ? 'Seeding...' : 'Seed Demo Data'}
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard loading={loading} label="Total Customers"   value={summary?.total_customers?.toLocaleString() ?? '—'} sub="in portfolio"      icon={Users}         accent="#60a5fa" />
        <StatCard loading={loading} label="Avg CPI Score"     value={summary ? summary.avg_cpi_score.toFixed(3) : '—'}  sub="priority index"    icon={Target}        accent="var(--accent-gold)" />
        <StatCard loading={loading} label="Avg Churn Risk"    value={summary ? `${(summary.avg_churn_probability*100).toFixed(1)}%` : '—'} sub="portfolio avg" icon={TrendingDown} accent="var(--risk-high)" />
        <StatCard loading={loading} label="Revenue at Risk"   value={summary ? fmtInr(summary.revenue_at_risk) : '—'}   sub="annual exposure"   icon={IndianRupee}   accent="var(--risk-critical)" />
        <StatCard loading={loading} label="Retention Rate"    value={summary ? `${summary.retention_rate_estimate}%` : '—'} sub="est. current" icon={Shield}        accent="var(--risk-low)" />
        <StatCard loading={loading} label="Pending Actions"   value={summary?.pending_strategies?.toLocaleString() ?? '—'} sub="strategies"   icon={Zap}           accent="var(--risk-critical)" />
      </div>

      {/* Zone summary pills */}
      {summary && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          {[1,2,3,4,5].map(z => {
            const count = summary.zone_distribution?.[`zone_${z}`] || 0
            const meta  = ZONE_META[z]
            return (
              <div key={z} onClick={() => navigate(`/customers?zone=${z}`)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                background: meta.bg, border: `1px solid ${meta.border}`,
                borderRadius: 100, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color }} />
                <span style={{ fontSize: '0.72rem', color: meta.color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  Z{z} {meta.label}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{count}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Charts + Top Risk */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 28 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>Seismic Zone Distribution</div>
          {loading ? (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : <RiskChart data={summary?.zone_distribution} />}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>Top Priority Customers (by CPI)</div>
            <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '0.73rem' }} onClick={() => navigate('/customers')}>View All →</button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 54, borderRadius: 8 }} />)}
            </div>
          ) : topRisk.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No customers yet. Click "Seed Demo Data" to begin.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {topRisk.map((c, i) => {
                const z = ZONE_META[c.zone_number] || ZONE_META[1]
                return (
                  <div key={c.customer_id} onClick={() => navigate(`/customers/${c.customer_id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--bg-elevated)', borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = z.border; e.currentTarget.style.background = 'var(--bg-hover)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}
                  >
                    <div style={{ width: 22, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>#{i+1}</div>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: `${z.color}20`, border: `2px solid ${z.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem', color: z.color }}>
                      {c.name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.segment} · LTV {fmtInr(c.ltv_score)}</div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: z.color }}>CPI {(c.cpi_score||0).toFixed(3)}</div>
                      <ZoneBadge zone={c.zone_number} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* System status */}
      <div className="card" style={{ padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)' }}>System</div>
        {[['Random Forest ML','LIVE'],['ChromaDB RAG','LIVE'],['Gemini + Groq','LIVE'],['PostgreSQL','LIVE'],['SHAP XAI','LIVE']].map(([label, status]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--risk-low)', boxShadow: '0 0 5px var(--risk-low)' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{label}</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--risk-low)', fontFamily: 'var(--font-mono)' }}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
