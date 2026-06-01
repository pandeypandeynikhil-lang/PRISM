import { useState } from 'react'
import { Mail, MessageSquare, Phone, Smartphone, Building2, CheckCircle, XCircle, Clock, Sparkles, IndianRupee, TrendingUp, Target } from 'lucide-react'
import { updateStrategy } from '../services/api'

const CHANNEL_ICON = { email: Mail, sms: MessageSquare, phone: Phone, in_app: Smartphone, branch: Building2 }
const STATUS_COLOR = { pending: 'var(--risk-medium)', sent: '#60a5fa', accepted: 'var(--risk-low)', rejected: 'var(--risk-high)', expired: 'var(--text-muted)' }

function fmtInr(n) {
  if (!n) return '₹0'
  if (n >= 1e7) return `₹${(n/1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `₹${(n/1e5).toFixed(1)}L`
  if (n >= 1e3) return `₹${(n/1e3).toFixed(0)}K`
  return `₹${Math.round(n)}`
}

export default function StrategyPanel({ strategies = [], onRefresh }) {
  const [expanded, setExpanded] = useState(null)
  const [updating, setUpdating] = useState(null)

  async function handleStatus(id, status) {
    setUpdating(id)
    try { await updateStrategy(id, status); onRefresh?.() }
    finally { setUpdating(null) }
  }

  if (!strategies.length) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
      <Sparkles size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
      <div style={{ fontSize: '0.85rem' }}>No strategies generated yet</div>
      <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Click "Generate AI Strategy" to create one</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {strategies.map((s, i) => {
        const ChannelIcon = CHANNEL_ICON[s.channel] || Mail
        const isOpen = expanded === i
        return (
          <div key={s.id || i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div
              onClick={() => setExpanded(isOpen ? null : i)}
              style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'var(--accent-gold-dim)', border: '1px solid rgba(212,168,83,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ChannelIcon size={16} color="var(--accent-gold)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                  {s.title}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                    {s.channel} · P{s.priority}
                  </span>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: STATUS_COLOR[s.status] }}>
                    ● {s.status}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--risk-low)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {fmtInr(s.estimated_revenue_saved)}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>revenue saved</div>
                </div>
                <div style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s', fontSize: '0.8rem' }}>▾</div>
              </div>
            </div>

            {/* Expanded */}
            {isOpen && (
              <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)', paddingTop: 16, animation: 'fadeIn 0.2s ease' }}>
                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    { icon: Target,      label: 'Retention Lift', value: `${Math.round((s.estimated_retention_probability || 0) * 100)}%` },
                    { icon: IndianRupee, label: 'Revenue Saved',  value: fmtInr(s.estimated_revenue_saved) },
                    { icon: TrendingUp,  label: 'ROI Score',      value: (s.roi_score || 0).toFixed(1) },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                      <Icon size={14} color="var(--accent-gold)" style={{ marginBottom: 4 }} />
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{value}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Strategy</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.description}</p>
                </div>

                {/* Message */}
                {s.personalized_message && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Personalized Message</div>
                    <div style={{
                      background: 'var(--bg-elevated)', borderRadius: 10, padding: '14px 16px',
                      border: '1px solid var(--border)', borderLeft: '3px solid var(--accent-gold)',
                      fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic',
                    }}>
                      {s.personalized_message}
                    </div>
                  </div>
                )}

                {/* Offer details */}
                {s.offer_details?.offer_value && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Offer', value: s.offer_details.offer_value },
                      { label: 'Valid', value: `${s.offer_details.validity_days}d` },
                      { label: 'Type', value: s.offer_details.offer_type },
                    ].map(({ label, value }) => (
                      <span key={label} style={{
                        background: 'var(--accent-gold-dim)', border: '1px solid rgba(212,168,83,0.2)',
                        color: 'var(--accent-gold)', borderRadius: 100, padding: '3px 10px',
                        fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
                      }}>
                        {label}: {value}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {s.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-gold"
                      disabled={updating === s.id}
                      onClick={() => handleStatus(s.id, 'sent')}
                      style={{ flex: 1 }}
                    >
                      <CheckCircle size={14} /> Mark as Sent
                    </button>
                    <button
                      className="btn btn-danger"
                      disabled={updating === s.id}
                      onClick={() => handleStatus(s.id, 'rejected')}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
                {s.status === 'sent' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => handleStatus(s.id, 'accepted')}>
                      <CheckCircle size={14} /> Customer Retained
                    </button>
                    <button className="btn btn-danger" onClick={() => handleStatus(s.id, 'rejected')}>
                      <XCircle size={14} /> Churned
                    </button>
                  </div>
                )}
                {['accepted', 'rejected'].includes(s.status) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                    {s.status === 'accepted'
                      ? <CheckCircle size={14} color="var(--risk-low)" />
                      : <XCircle size={14} color="var(--risk-high)" />
                    }
                    <span style={{ fontSize: '0.8rem', color: s.status === 'accepted' ? 'var(--risk-low)' : 'var(--risk-high)' }}>
                      {s.status === 'accepted' ? 'Customer successfully retained' : 'Customer churned — logged for analysis'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
