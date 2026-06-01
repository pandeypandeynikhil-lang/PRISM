import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Send, Bot, User, IndianRupee, CreditCard, Smartphone, Star, AlertCircle, RefreshCw } from 'lucide-react'
import { getCustomer, getStrategies, generateStrategy, ragChat } from '../services/api'
import StrategyPanel from '../components/StrategyPanel'

function fmtInr(n) {
  if (!n) return '₹0'
  if (n >= 1e7) return `₹${(n/1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `₹${(n/1e5).toFixed(1)}L`
  if (n >= 1e3) return `₹${(n/1e3).toFixed(0)}K`
  return `₹${Math.round(n)}`
}

const RISK_COLOR = { low: 'var(--risk-low)', medium: 'var(--risk-medium)', high: 'var(--risk-high)', critical: 'var(--risk-critical)' }

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer]         = useState(null)
  const [strategies, setStrategies]     = useState([])
  const [generating, setGenerating]     = useState(false)
  const [loading, setLoading]           = useState(true)
  const [messages, setMessages]         = useState([])
  const [chatInput, setChatInput]       = useState('')
  const [chatLoading, setChatLoading]   = useState(false)
  const chatEndRef = useRef(null)

  async function load() {
    setLoading(true)
    try {
      const [c, s] = await Promise.all([getCustomer(id), getStrategies(id)])
      setCustomer(c); setStrategies(s)
    } catch (e) { navigate('/customers') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleGenerate() {
    setGenerating(true)
    try {
      await generateStrategy(id)
      const s = await getStrategies(id)
      setStrategies(s)
    } finally { setGenerating(false) }
  }

  async function handleChat(e) {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    const question = chatInput.trim()
    setChatInput('')
    setMessages(m => [...m, { role: 'user', text: question }])
    setChatLoading(true)
    try {
      const { answer } = await ragChat(question, id)
      setMessages(m => [...m, { role: 'ai', text: answer }])
    } catch {
      setMessages(m => [...m, { role: 'ai', text: 'Unable to get a response. Please try again.' }])
    } finally { setChatLoading(false) }
  }

  if (loading) return (
    <div style={{ padding: '60px 36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )
  if (!customer) return null

  const risk = customer.risk_tier || 'low'
  const prob = Math.round((customer.churn_probability || 0) * 100)

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Back */}
      <button className="btn btn-ghost" onClick={() => navigate('/customers')} style={{ marginBottom: 24, padding: '6px 14px' }}>
        <ArrowLeft size={14} /> Customers
      </button>

      {/* Hero */}
      <div className="card" style={{ padding: 28, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${RISK_COLOR[risk]}, transparent)` }} />
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: 18, flexShrink: 0,
            background: `${RISK_COLOR[risk]}20`, border: `2px solid ${RISK_COLOR[risk]}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: RISK_COLOR[risk],
          }}>
            {customer.name?.charAt(0)}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{customer.name}</h2>
              <span className={`risk-badge ${risk}`}>{risk} risk</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              {customer.customer_id} · {customer.segment?.toUpperCase()} · {customer.age}y · {customer.geography}
            </div>

            {/* Churn bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Churn Probability</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: RISK_COLOR[risk], fontFamily: 'var(--font-mono)' }}>{prob}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden', maxWidth: 400 }}>
                <div style={{ height: '100%', width: `${prob}%`, background: RISK_COLOR[risk], borderRadius: 4, boxShadow: `0 0 10px ${RISK_COLOR[risk]}60` }} />
              </div>
            </div>
          </div>

          {/* Key metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexShrink: 0 }}>
            {[
              { label: 'Balance',    value: fmtInr(customer.account_balance),  icon: IndianRupee },
              { label: 'LTV',        value: fmtInr(customer.ltv_score),         icon: Star },
              { label: 'Products',   value: customer.num_products,              icon: CreditCard },
              { label: 'Engagement', value: `${(customer.engagement_score||0).toFixed(0)}/100`, icon: Smartphone },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 14px', minWidth: 110 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Icon size={12} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main 2-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Profile details */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>Customer Profile</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Credit Score',       customer.credit_score,                         customer.credit_score >= 750 ? 'var(--risk-low)' : customer.credit_score >= 650 ? 'var(--risk-medium)' : 'var(--risk-high)'],
              ['Annual Salary',      fmtInr(customer.estimated_salary),             'var(--text-primary)'],
              ['Tenure',             `${customer.tenure_months} months`,            'var(--text-primary)'],
              ['NPS Score',          `${customer.nps_score?.toFixed(1) ?? 'N/A'}/10`, customer.nps_score >= 7 ? 'var(--risk-low)' : customer.nps_score >= 5 ? 'var(--risk-medium)' : 'var(--risk-high)'],
              ['Complaints (1yr)',   customer.complaints_last_year,                 customer.complaints_last_year === 0 ? 'var(--risk-low)' : customer.complaints_last_year <= 1 ? 'var(--risk-medium)' : 'var(--risk-high)'],
              ['Txns (90d)',         customer.num_transactions_last_90d,            'var(--text-primary)'],
              ['Login Freq/mo',      customer.digital_login_frequency,              'var(--text-primary)'],
              ['Days Since Contact', customer.days_since_last_contact,              customer.days_since_last_contact < 30 ? 'var(--risk-low)' : customer.days_since_last_contact < 90 ? 'var(--risk-medium)' : 'var(--risk-high)'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color, fontFamily: 'var(--font-mono)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RAG Chatbot */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212,168,83,0.2)' }}>
              <Bot size={14} color="var(--accent-gold)" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>PRISM AI Assistant</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>RAG-powered · Gemini 1.5 Flash</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 14, minHeight: 200, maxHeight: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '20px 0' }}>
                Ask me anything about this customer's churn risk, best retention approach, or which offer to use.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'ai' && <Bot size={16} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: 4 }} />}
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user' ? 'var(--accent-gold-dim)' : 'var(--bg-elevated)',
                  border: `1px solid ${m.role === 'user' ? 'rgba(212,168,83,0.2)' : 'var(--border)'}`,
                  fontSize: '0.83rem', color: m.role === 'user' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Bot size={16} color="var(--accent-gold)" />
                <div style={{ padding: '8px 14px', background: 'var(--bg-elevated)', borderRadius: 14, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-gold)', opacity: 0.6, animation: `pulse-gold 1.2s infinite ${i*0.2}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChat} style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="What retention offer should I use?"
              disabled={chatLoading}
            />
            <button className="btn btn-gold" type="submit" disabled={!chatInput.trim() || chatLoading} style={{ flexShrink: 0, padding: '9px 16px' }}>
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Strategies */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>AI Retention Strategies</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {strategies.length} strateg{strategies.length !== 1 ? 'ies' : 'y'} generated
            </div>
          </div>
          <button className="btn btn-gold" onClick={handleGenerate} disabled={generating}>
            <Sparkles size={14} style={generating ? { animation: 'spin 1s linear infinite' } : {}} />
            {generating ? 'Generating...' : 'Generate AI Strategy'}
          </button>
        </div>
        <StrategyPanel strategies={strategies} onRefresh={() => getStrategies(id).then(setStrategies)} />
      </div>
    </div>
  )
}
