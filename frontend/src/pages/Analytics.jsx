import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { getSegments, getSummary } from '../services/api'
import RiskChart from '../components/RiskChart'

const SEG_COLORS = { retail: '#60a5fa', premium: '#d4a853', wealth: '#c084fc', sme: '#34d399' }

const CustomBar = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
      <div style={{ color: 'var(--text-secondary)' }}>{payload[0].payload.segment}</div>
      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Churn: {(payload[0].value * 100).toFixed(1)}%</div>
      <div style={{ color: 'var(--text-muted)' }}>Count: {payload[0].payload.count}</div>
    </div>
  )
}

export default function Analytics() {
  const [segments, setSegments] = useState([])
  const [summary, setSummary]   = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getSegments(), getSummary()])
      .then(([s, m]) => { setSegments(s); setSummary(m) })
      .finally(() => setLoading(false))
  }, [])

  const radarData = segments.map(s => ({
    subject: s.segment?.toUpperCase(),
    churnRisk: Math.round(s.avg_churn * 100),
    fullMark: 100,
  }))

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
          ◆ PORTFOLIO ANALYTICS
        </div>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)' }}>
          Churn <span style={{ color: 'var(--accent-gold)' }}>Intelligence</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '0.88rem' }}>Segment analysis and portfolio risk breakdown</p>
      </div>

      {/* Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Portfolio Retention', value: summary ? `${summary.retention_rate_estimate}%` : '—', color: 'var(--risk-low)' },
          { label: 'Avg Churn Risk',      value: summary ? `${(summary.avg_churn_probability*100).toFixed(1)}%` : '—', color: 'var(--risk-high)' },
          { label: 'Avg Engagement',      value: summary ? `${summary.avg_engagement_score}/100` : '—', color: '#60a5fa' },
          { label: 'Total LTV',           value: summary ? (summary.total_portfolio_ltv >= 1e7 ? `₹${(summary.total_portfolio_ltv/1e7).toFixed(1)}Cr` : `₹${(summary.total_portfolio_ltv/1e5).toFixed(0)}L`) : '—', color: 'var(--accent-gold)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: 20, borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Bar chart */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>Avg Churn Risk by Segment</div>
          {loading ? (
            <div className="skeleton" style={{ height: 240 }} />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={segments} barCategoryGap="35%">
                <XAxis dataKey="segment" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${(v*100).toFixed(0)}%`} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomBar />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="avg_churn" radius={[6,6,0,0]}>
                  {segments.map(s => <Cell key={s.segment} fill={SEG_COLORS[s.segment] || '#6b7280'} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Risk donut */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>Overall Risk Distribution</div>
          {loading ? (
            <div className="skeleton" style={{ height: 240 }} />
          ) : (
            <RiskChart data={summary?.risk_distribution} />
          )}
        </div>
      </div>

      {/* Radar + Segment table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20 }}>
        {/* Radar */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>Segment Risk Radar</div>
          {loading ? <div className="skeleton" style={{ height: 240 }} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar name="Churn Risk" dataKey="churnRisk" stroke="var(--accent-gold)" fill="var(--accent-gold)" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>Segment Breakdown</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Segment', 'Customers', 'Avg Churn', 'Priority'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(4)].map((_, i) => (
                <tr key={i}><td colSpan={4}><div className="skeleton" style={{ height: 36, margin: '4px 0', borderRadius: 6 }} /></td></tr>
              )) : segments.map(s => {
                const churnPct = (s.avg_churn * 100).toFixed(1)
                const priority = s.avg_churn >= 0.5 ? { label: 'URGENT', color: 'var(--risk-critical)' } : s.avg_churn >= 0.3 ? { label: 'HIGH', color: 'var(--risk-high)' } : { label: 'NORMAL', color: 'var(--risk-low)' }
                return (
                  <tr key={s.segment} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: SEG_COLORS[s.segment] }} />
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{s.segment}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.count}</td>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 5, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden', maxWidth: 80 }}>
                          <div style={{ height: '100%', width: `${churnPct}%`, background: SEG_COLORS[s.segment], borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: SEG_COLORS[s.segment], fontWeight: 600 }}>{churnPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: priority.color, background: `${priority.color}15`, padding: '3px 8px', borderRadius: 100, border: `1px solid ${priority.color}30` }}>
                        {priority.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
