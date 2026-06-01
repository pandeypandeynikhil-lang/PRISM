export default function StatCard({ label, value, sub, icon: Icon, accent, trend, loading }) {
  if (loading) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <div className="skeleton" style={{ width: 120, height: 14, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: 80, height: 32, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 140, height: 12 }} />
      </div>
    )
  }
  return (
    <div className="card" style={{
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
      borderLeft: accent ? `3px solid ${accent}` : undefined,
    }}>
      {/* Background glow */}
      {accent && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, ${accent}40, transparent)`,
        }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: accent ? `${accent}18` : 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${accent ? `${accent}25` : 'var(--border)'}`,
          }}>
            <Icon size={15} color={accent || 'var(--text-muted)'} />
          </div>
        )}
      </div>

      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 8 }}>
        {value}
      </div>

      {sub && (
        <div style={{ fontSize: '0.78rem', color: trend > 0 ? 'var(--risk-low)' : trend < 0 ? 'var(--risk-high)' : 'var(--text-secondary)' }}>
          {trend !== undefined && (trend > 0 ? '↑ ' : trend < 0 ? '↓ ' : '→ ')}
          {sub}
        </div>
      )}
    </div>
  )
}
