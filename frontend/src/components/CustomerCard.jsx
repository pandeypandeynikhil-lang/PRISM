import { useNavigate } from 'react-router-dom'
import { TrendingUp, IndianRupee, Clock, Zap } from 'lucide-react'
import { ZoneBadge, ZONE_META } from './ZoneBadge.jsx'

function fmtInr(n) {
  if (!n) return '₹0'
  if (n >= 1e7) return `₹${(n/1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `₹${(n/1e5).toFixed(1)}L`
  if (n >= 1e3) return `₹${(n/1e3).toFixed(0)}K`
  return `₹${Math.round(n)}`
}

const SEG_COLOR = { retail: '#60a5fa', premium: '#d4a853', wealth: '#c084fc', sme: '#34d399' }

export default function CustomerCard({ customer }) {
  const navigate = useNavigate()
  const zone  = customer.zone_number || 1
  const z     = ZONE_META[zone] || ZONE_META[1]
  const prob  = Math.round((customer.churn_probability || 0) * 100)
  const cpi   = (customer.cpi_score || 0).toFixed(3)

  return (
    <div
      className="card"
      onClick={() => navigate(`/customers/${customer.customer_id}`)}
      style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-elevated)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      {/* Zone color top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${z.color} ${prob}%, var(--bg-elevated) ${prob}%)` }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: `${z.color}20`, border: `2px solid ${z.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: z.color }}>
            {customer.name?.charAt(0) || '?'}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'var(--font-display)' }}>{customer.name}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{customer.customer_id}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <ZoneBadge zone={zone} />
          <span style={{ fontSize: '0.65rem', color: SEG_COLOR[customer.segment] || 'var(--text-muted)', background: `${SEG_COLOR[customer.segment] || '#6b7280'}18`, padding: '2px 7px', borderRadius: 100, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
            {customer.segment}
          </span>
        </div>
      </div>

      {/* CRS bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Churn Risk Score</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: z.color, fontFamily: 'var(--font-mono)' }}>{prob}%</span>
        </div>
        <div style={{ height: 5, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${prob}%`, background: z.color, borderRadius: 3, boxShadow: `0 0 6px ${z.color}60` }} />
        </div>
      </div>

      {/* CPI highlight */}
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CPI = α·CRS + β·OS + γ·IS</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem', color: z.color }}>{cpi}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>OS / IS</div>
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            <span style={{ color: '#d4a853' }}>{(customer.opportunity_score || 0).toFixed(0)}</span>
            {' / '}
            <span style={{ color: '#60a5fa' }}>{(customer.inclusion_score || 0).toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
        {[
          { icon: IndianRupee, label: 'Balance', value: fmtInr(customer.account_balance) },
          { icon: TrendingUp,  label: 'LTV',     value: fmtInr(customer.ltv_score) },
          { icon: Zap,         label: 'Engage',  value: `${(customer.engagement_score || 0).toFixed(0)}/100` },
          { icon: Clock,       label: 'Tenure',  value: `${customer.tenure_months}m` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 7, padding: '7px 9px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon size={12} color="var(--text-muted)" />
            <div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
