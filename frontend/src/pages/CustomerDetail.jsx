import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Send, Bot, IndianRupee, CreditCard, Smartphone, Star, RefreshCw } from 'lucide-react'
import { getCustomer, getStrategies, generateStrategy, ragChat } from '../services/api.js'
import StrategyPanel from '../components/StrategyPanel.jsx'
import { ZoneBadge, ZoneBar, CpiGauge, ZONE_META } from '../components/ZoneBadge.jsx'

function fmtInr(n) {
  if (!n) return '₹0'
  if (n >= 1e7) return `₹${(n/1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `₹${(n/1e5).toFixed(1)}L`
  if (n >= 1e3) return `₹${(n/1e3).toFixed(0)}K`
  return `₹${Math.round(n)}`
}

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer]     = useState(null)
  const [strategies, setStrategies] = useState([])
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading]       = useState(true)
  const [messages, setMessages]     = useState([])
  const [chatInput, setChatInput]   = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  async function load() {
    setLoading(true)
    try {
      const [c, s] = await Promise.all([getCustomer(id), getStrategies(id)])
      setCustomer(c); setStrategies(s)
    } catch { navigate('/customers') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleGenerate() {
    setGenerating(true)
    try { await generateStrategy(id); setStrategies(await getStrategies(id)) }
    finally { setGenerating(false) }
  }

  async function handleChat(e) {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    const q = chatInput.trim(); setChatInput('')
    setMessages(m => [...m, { role: 'user', text: q }])
    setChatLoading(true)
    try {
      const { answer } = await ragChat(q, id)
      setMessages(m => [...m, { role: 'ai', text: answer }])
    } catch { setMessages(m => [...m, { role: 'ai', text: 'Unable to get a response. Please try again.' }]) }
    finally { setChatLoading(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )
  if (!customer) return null

  const zone  = customer.zone_number || 1
  const z     = ZONE_META[zone] || ZONE_META[1]
  const prob  = customer.churn_probability || 0

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1400, margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={() => navigate('/customers')} style={{ marginBottom: 22, padding: '6px 14px' }}>
        <ArrowLeft size={13} /> Customers
      </button>

      {/* Hero card */}
      <div className="card" style={{ padding: 28, marginBottom: 22, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${z.color}, transparent)` }} />
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ width: 68, height: 68, borderRadius: 18, flexShrink: 0, background: `${z.color}20`, border: `2px solid ${z.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: z.color }}>
            {customer.name?.charAt(0)}
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{customer.name}</h2>
              <ZoneBadge zone={zone} size="lg" showAction />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 14 }}>
              {customer.customer_id} · {customer.segment?.toUpperCase()} · Age {customer.age} · {customer.geography}
            </div>
            <ZoneBar zone={zone} probability={prob} />
          </div>

          {/* CPI Gauge */}
          <div style={{ minWidth: 260, flexShrink: 0 }}>
            <CpiGauge
              cpi={customer.cpi_score}
              os={customer.opportunity_score}
              is={customer.inclusion_score}
            />
          </div>
        </div>
      </div>

      {/* 2-col: profile + chat */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Profile */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>Customer Profile</div>

          {/* Key metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 16 }}>
            {[
              { icon: IndianRupee, label: 'Balance',    value: fmtInr(customer.account_balance) },
              { icon: Star,        label: 'LTV',         value: fmtInr(customer.ltv_score) },
              { icon: CreditCard,  label: 'Products',    value: customer.num_products },
              { icon: Smartphone,  label: 'Engagement',  value: `${(customer.engagement_score||0).toFixed(0)}/100` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={13} color="var(--text-muted)" />
                <div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Signal rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Credit Score',        customer.credit_score,             customer.credit_score >= 750 ? 'var(--risk-low)' : customer.credit_score >= 620 ? 'var(--risk-medium)' : 'var(--risk-high)'],
              ['Annual Salary',       fmtInr(customer.estimated_salary), 'var(--text-primary)'],
              ['Tenure',              `${customer.tenure_months} months`, 'var(--text-primary)'],
              ['NPS Score',           `${(customer.nps_score||0).toFixed(1)}/10`, customer.nps_score >= 7 ? 'var(--risk-low)' : customer.nps_score >= 5 ? 'var(--risk-medium)' : 'var(--risk-high)'],
              ['Complaints (1yr)',    customer.complaints_last_year,     customer.complaints_last_year === 0 ? 'var(--risk-low)' : customer.complaints_last_year <= 1 ? 'var(--risk-medium)' : 'var(--risk-high)'],
              ['Txns (90d)',          customer.num_transactions_last_90d, 'var(--text-primary)'],
              ['Digital Logins/mo',  customer.digital_login_frequency,  customer.digital_login_frequency >= 10 ? 'var(--risk-low)' : customer.digital_login_frequency >= 4 ? 'var(--risk-medium)' : 'var(--risk-high)'],
              ['Days Since Contact',  customer.days_since_last_contact,  customer.days_since_last_contact < 30 ? 'var(--risk-low)' : customer.days_since_last_contact < 90 ? 'var(--risk-medium)' : 'var(--risk-high)'],
              ['Days Since Txn',      customer.days_since_last_transaction, 'var(--text-primary)'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 11px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color, fontFamily: 'var(--font-mono)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RAG Chat */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-gold-dim)', border: '1px solid rgba(212,168,83,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={15} color="var(--accent-gold)" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>PRISM AI Assistant</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>RAG · Gemini 2.0 Flash + Groq fallback</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', minHeight: 200, maxHeight: 300, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            {messages.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '24px 10px', lineHeight: 1.7 }}>
                Ask about this customer's churn risk, best retention offer, CPI breakdown, or which zone action to take.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'ai' && <Bot size={15} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: 4 }} />}
                <div style={{ maxWidth: '82%', padding: '9px 13px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: m.role === 'user' ? 'var(--accent-gold-dim)' : 'var(--bg-elevated)', border: `1px solid ${m.role === 'user' ? 'rgba(212,168,83,0.2)' : 'var(--border)'}`, fontSize: '0.82rem', color: m.role === 'user' ? 'var(--accent-gold)' : 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Bot size={15} color="var(--accent-gold)" />
                <div style={{ padding: '8px 14px', background: 'var(--bg-elevated)', borderRadius: 14, border: '1px solid var(--border)', display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-gold)', animation: `pulse-gold 1.2s infinite ${i*0.2}s` }} />)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChat} style={{ display: 'flex', gap: 8 }}>
            <input className="input" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="What offer should I use for Zone 4?" disabled={chatLoading} />
            <button className="btn btn-gold" type="submit" disabled={!chatInput.trim() || chatLoading} style={{ flexShrink: 0, padding: '9px 14px' }}>
              <Send size={13} />
            </button>
          </form>
        </div>
      </div>

      {/* Strategies */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>AI Retention Strategies</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {strategies.length} strateg{strategies.length !== 1 ? 'ies' : 'y'} generated
            </div>
          </div>
          <button className="btn btn-gold" onClick={handleGenerate} disabled={generating}>
            <Sparkles size={13} style={generating ? { animation: 'spin 1s linear infinite' } : {}} />
            {generating ? 'Generating...' : 'Generate AI Strategy'}
          </button>
        </div>
        <StrategyPanel strategies={strategies} onRefresh={() => getStrategies(id).then(setStrategies)} />
      </div>
    </div>
  )
}
