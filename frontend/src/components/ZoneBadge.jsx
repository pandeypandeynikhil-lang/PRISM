// Zone colors and metadata for 5-zone seismic system
export const ZONE_META = {
  1: { label: 'Very Low',  color: '#22d3a0', bg: 'rgba(34,211,160,0.1)',  border: 'rgba(34,211,160,0.25)',  action: 'Passive Communication' },
  2: { label: 'Low',       color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)',  action: 'Loyalty Programs' },
  3: { label: 'Moderate',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  action: 'Re-engagement Campaigns' },
  4: { label: 'High',      color: '#f26c6c', bg: 'rgba(242,108,108,0.1)', border: 'rgba(242,108,108,0.25)', action: 'Targeted Outreach' },
  5: { label: 'Critical',  color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.3)',  action: 'RM Intervention' },
}

export function ZoneBadge({ zone, showAction = false, size = 'sm' }) {
  const z    = ZONE_META[zone] || ZONE_META[1]
  const pad  = size === 'lg' ? '5px 14px' : '3px 10px'
  const fz   = size === 'lg' ? '0.78rem' : '0.68rem'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: pad, borderRadius: 100,
      background: z.bg, border: `1px solid ${z.border}`,
      color: z.color, fontSize: fz,
      fontFamily: 'var(--font-mono)', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.07em',
      animation: zone === 5 ? 'pulse-gold 2s infinite' : undefined,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: z.color, display: 'inline-block', boxShadow: `0 0 4px ${z.color}` }} />
      Z{zone} · {z.label}
      {showAction && <span style={{ opacity: 0.7, fontSize: '0.6rem' }}> — {z.action}</span>}
    </span>
  )
}

export function ZoneBar({ zone, probability }) {
  const z = ZONE_META[zone] || ZONE_META[1]
  const pct = Math.round((probability || 0) * 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <ZoneBadge zone={zone} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: z.color }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: z.color, borderRadius: 3, boxShadow: `0 0 8px ${z.color}60`, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
    </div>
  )
}

export function CpiGauge({ cpi, os, is: isScore }) {
  const pct = Math.round((cpi || 0) * 100)
  const color = pct >= 70 ? '#c084fc' : pct >= 50 ? '#f26c6c' : pct >= 35 ? '#f59e0b' : '#22d3a0'
  return (
    <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
        CPI = α·CRS + β·OS + γ·IS
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, color, lineHeight: 1 }}>
          {(cpi || 0).toFixed(3)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 8, background: 'var(--bg-void)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, #22d3a0, ${color})`, borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>Customer Priority Index</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Opportunity Score (OS)', value: os, color: '#d4a853', note: 'Business value' },
          { label: 'Inclusion Score (IS)',    value: isScore, color: '#60a5fa', note: 'Fairness factor' },
        ].map(({ label, value, color: c, note }) => (
          <div key={label} style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>{note}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: c }}>{(value || 0).toFixed(1)}<span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>/100</span></div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
