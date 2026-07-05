import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ZONE_META } from './ZoneBadge.jsx'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  const z = ZONE_META[name] || {}
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
      <span style={{ color: z.color }}>Zone {name} — {z.label}: </span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

export default function RiskChart({ data }) {
  // data is zone_distribution: { zone_1: N, zone_2: N, ... }
  const chartData = Object.entries(data || {}).map(([key, value]) => ({
    name: parseInt(key.replace('zone_', '')),
    value,
  })).filter(d => d.value > 0)

  const total = chartData.reduce((s, d) => s + d.value, 0)

  return (
    <div style={{ width: '100%' }}>
      <div style={{ height: 220, position: 'relative' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {chartData.map(entry => (
                <Cell key={entry.name} fill={ZONE_META[entry.name]?.color || '#6b7280'} opacity={0.9} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{total}</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>customers</div>
        </div>
      </div>

      {/* Zone legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {chartData.map(({ name, value }) => {
          const z = ZONE_META[name]
          const pct = total > 0 ? Math.round(value / total * 100) : 0
          return (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: z?.color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', flex: 1 }}>
                Z{name} — {z?.label}
              </span>
              <div style={{ height: 4, width: 60, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: z?.color, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: '0.72rem', color: z?.color, fontFamily: 'var(--font-mono)', fontWeight: 600, minWidth: 28, textAlign: 'right' }}>{value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
