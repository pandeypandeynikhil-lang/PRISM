import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { getSegments, getSummary, getZones } from '../services/api.js'
import RiskChart from '../components/RiskChart.jsx'
import { ZONE_META } from '../components/ZoneBadge.jsx'

const SEG_COLORS = { retail: '#60a5fa', premium: '#d4a853', wealth: '#c084fc', sme: '#34d399' }

function fmtInr(n) {
  if (!n) return '₹0'
  if (n >= 1e7) return `₹${(n/1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `₹${(n/1e5).toFixed(1)}L`
  return `₹${Math.round(n)}`
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 3 }}>{d.segment || d.subject}</div>
      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Churn: {(payload[0].value * 100).toFixed(1)}%</div>
      {d.count && <div style={{ color: 'var(--text-muted)' }}>Count: {d.count}</div>}
      {d.avg_cpi !== undefined && <div style={{ color: 'var(--accent-gold)' }}>Avg CPI: {d.avg_cpi.toFixed(3)}</div>}
    </div>
  )
}

export default function Analytics() {
  const [segments, setSegments] = useState([])
  const [zones, setZones]       = useState([])
  const [summary, setSummary]   = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getSegments(), getSummary(), getZones()])
      .then(([s, m, z]) => { setSegments(s); setSummary(m); setZones(z) })
      .finally(() => setLoading(false))
  }, [])

  const radarData = segments.map(s => ({
    subject: s.segment?.toUpperCase(),
    churnRisk: Math.round((s.avg_churn || 0) * 100),
    fullMark: 100,
  }))

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--accent-gold)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>◆ PORTFOLIO ANALYTICS</div>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)' }}>
          Churn <span style={{ color: 'var(--accent-gold)' }}>Intelligence</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '0.88rem' }}>Seismic zone analysis · CPI breakdown · Segment intelligence</p>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 26 }}>
        {[
          { label: 'Portfolio Retention', value: summary ? `${summary.retention_rate_estimate}%` : '—',              color: 'var(--risk-low)' },
          { label: 'Avg CPI Score',       value: summary ? summary.avg_cpi_score.toFixed(3) : '—',                    color: 'var(--accent-gold)' },
          { label: 'Avg Churn Risk',      value: summary ? `${(summary.avg_churn_probability*100).toFixed(1)}%` : '—', color: 'var(--risk-high)' },
          { label: 'Avg Opportunity',     value: summary ? `${summary.avg_opportunity_score?.toFixed(1)}/100` : '—',  color: '#d4a853' },
          { label: 'Avg Inclusion',       value: summary ? `${summary.avg_inclusion_score?.toFixed(1)}/100` : '—',    color: '#60a5fa' },
          { label: 'Total LTV',           value: summary ? fmtInr(summary.total_portfolio_ltv) : '—',                 color: '#c084fc' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: '18px 20px', borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Zone breakdown table */}
      <div className="card" style={{ padding: 24, marginBottom: 22 }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
          Seismic Risk Zone Breakdown — Adaptive Strategy Mapping
        </div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Zone', 'Risk Level', 'Customers', 'Avg CRS', 'Avg CPI', 'Objective', 'Recommended Action'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { zone: 5, obj: 'Immediate Retention',  action: 'RM Intervention + Personalized Offers' },
                { zone: 4, obj: 'Prevent Churn',         action: 'Targeted Outreach + Service Improvement' },
                { zone: 3, obj: 'Re-engagement',         action: 'Campaigns + Product Suggestions' },
                { zone: 2, obj: 'Strengthen Engagement', action: 'Loyalty Programs' },
                { zone: 1, obj: 'Maintain Satisfaction', action: 'Passive Communication' },
              ].map(({ zone, obj, action }) => {
                const meta   = ZONE_META[zone]
                const zdata  = zones.find(z => z.zone === zone) || {}
                return (
                  <tr key={zone} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, boxShadow: `0 0 5px ${meta.color}` }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem', color: meta.color }}>Zone {zone}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 12px' }}>
                      <span style={{ fontSize: '0.72rem', background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, padding: '2px 9px', borderRadius: 100, fontFamily: 'var(--font-mono)' }}>{meta.label}</span>
                    </td>
                    <td style={{ padding: '11px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700 }}>{zdata.count ?? '—'}</td>
                    <td style={{ padding: '11px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: meta.color }}>{zdata.avg_churn ? `${(zdata.avg_churn*100).toFixed(1)}%` : '—'}</td>
                    <td style={{ padding: '11px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-gold)' }}>{zdata.avg_cpi?.toFixed(3) ?? '—'}</td>
                    <td style={{ padding: '11px 12px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{obj}</td>
                    <td style={{ padding: '11px 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{action}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 22 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 18 }}>Avg Churn Risk by Segment</div>
          {loading ? <div className="skeleton" style={{ height: 220 }} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={segments} barCategoryGap="35%">
                <XAxis dataKey="segment" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${(v*100).toFixed(0)}%`} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="avg_churn" radius={[6,6,0,0]}>
                  {segments.map(s => <Cell key={s.segment} fill={SEG_COLORS[s.segment] || '#6b7280'} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 18 }}>Zone Distribution</div>
          {loading ? <div className="skeleton" style={{ height: 220 }} /> : (
            <RiskChart data={summary?.zone_distribution} />
          )}
        </div>
      </div>

      {/* Segment table + Radar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>Segment Intelligence</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Segment', 'Customers', 'Avg Churn', 'Avg CPI', 'Avg OS', 'Priority'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '7px 10px', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(4)].map((_, i) => (
                <tr key={i}><td colSpan={6}><div className="skeleton" style={{ height: 34, margin: '4px 0', borderRadius: 6 }} /></td></tr>
              )) : segments.map(s => {
                const churnPct = ((s.avg_churn || 0) * 100).toFixed(1)
                const priority = s.avg_churn >= 0.5 ? { label: 'URGENT', color: 'var(--risk-critical)' } : s.avg_churn >= 0.3 ? { label: 'HIGH', color: 'var(--risk-high)' } : { label: 'NORMAL', color: 'var(--risk-low)' }
                const sc = SEG_COLORS[s.segment] || '#6b7280'
                return (
                  <tr key={s.segment} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc }} />
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{s.segment}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{s.count}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 50, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${churnPct}%`, background: sc, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: sc, fontWeight: 600 }}>{churnPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-gold)' }}>{(s.avg_cpi||0).toFixed(3)}</td>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#d4a853' }}>{(s.avg_os||0).toFixed(1)}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: priority.color, background: `${priority.color}15`, padding: '2px 8px', borderRadius: 100, border: `1px solid ${priority.color}30` }}>{priority.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 18 }}>Segment Risk Radar</div>
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
      </div>
    </div>
  )
}
