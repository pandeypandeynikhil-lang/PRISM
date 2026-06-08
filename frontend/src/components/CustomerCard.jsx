import { useNavigate } from 'react-router-dom'
import { TrendingUp, IndianRupee, Clock, Zap } from 'lucide-react'

const RISK_COLOR = { low: 'var(--risk-low)', medium: 'var(--risk-medium)', high: 'var(--risk-high)', critical: 'var(--risk-critical)' }
const SEG_COLOR  = { retail: '#60a5fa', premium: '#d4a853', wealth: '#c084fc', sme: '#34d399' }

function fmtInr(n) {
  if (!n) return '₹0'
  if (n >= 1e7) return `₹${(n/1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `₹${(n/1e5).toFixed(1)}L`
  if (n >= 1e3) return `₹${(n/1e3).toFixed(0)}K`
  return `₹${n.toFixed(0)}`
}

export default function CustomerCard({ customer }) {
  const navigate = useNavigate()
  const risk = customer.risk_tier || 'low'
  const prob = Math.round((customer.churn_probability || 0) * 100)

  return (
    <div
      className="card"
      onClick={() => navigate(`/customers/${customer.customer_id}`)}
      style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-elevated)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      {/* Risk indicator bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${RISK_COLOR[risk]} ${prob}%, var(--bg-elevated) ${prob}%)`,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: `${RISK_COLOR[risk]}20`,
              border: `2px solid ${RISK_COLOR[risk]}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem',
              color: RISK_COLOR[risk],
            }}>
              {customer.name?.charAt(0) || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>
                {customer.name}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {customer.customer_id}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span className={`risk-badge ${risk}`}>{risk}</span>
          <span style={{
            fontSize: '0.68rem',
            background: `${SEG_COLOR[customer.segment]}18`,
            color: SEG_COLOR[customer.segment],
            padding: '2px 7px', borderRadius: 100,
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            {customer.segment}
          </span>
        </div>
      </div>

      {/* Churn probability bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Churn Risk</span>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: RISK_COLOR[risk], fontFamily: 'var(--font-mono)' }}>{prob}%</span>
        </div>
        <div style={{ height: 5, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${prob}%`,
            background: RISK_COLOR[risk],
            borderRadius: 3,
            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: `0 0 6px ${RISK_COLOR[risk]}60`,
          }} />
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { icon: IndianRupee, label: 'Balance', value: fmtInr(customer.account_balance) },
          { icon: TrendingUp,  label: 'LTV',     value: fmtInr(customer.ltv_score) },
          { icon: Zap,         label: 'Engage',  value: `${(customer.engagement_score || 0).toFixed(0)}/100` },
          { icon: Clock,       label: 'Tenure',  value: `${customer.tenure_months}m` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} style={{
            background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <Icon size={13} color="var(--text-muted)" />
            <div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
