import { useEffect, useState, useCallback } from 'react'
import { Search, Filter, RefreshCw, SlidersHorizontal } from 'lucide-react'
import CustomerCard from '../components/CustomerCard'
import { getCustomers } from '../services/api'

const TIERS = ['', 'critical', 'high', 'medium', 'low']
const SEGS  = ['', 'wealth', 'premium', 'sme', 'retail']

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [tier, setTier]           = useState('')
  const [seg, setSeg]             = useState('')
  const [page, setPage]           = useState(0)
  const PER_PAGE = 24

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { skip: page * PER_PAGE, limit: PER_PAGE }
      if (tier)   params.risk_tier = tier
      if (seg)    params.segment   = seg
      if (search) params.search    = search
      const data = await getCustomers(params)
      setCustomers(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [tier, seg, search, page])

  useEffect(() => { load() }, [load])

  const tierColors = { critical: 'var(--risk-critical)', high: 'var(--risk-high)', medium: 'var(--risk-medium)', low: 'var(--risk-low)' }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
          ◆ CUSTOMER INTELLIGENCE
        </div>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)' }}>
          Customer <span style={{ color: 'var(--accent-gold)' }}>Risk Profiles</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '0.88rem' }}>
          {customers.length} customers loaded · sorted by churn risk
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            placeholder="Search by name or ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            style={{ paddingLeft: 36 }}
          />
        </div>

        {/* Risk tier filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {TIERS.map(t => (
            <button
              key={t || 'all'}
              onClick={() => { setTier(t); setPage(0) }}
              style={{
                padding: '6px 14px', borderRadius: 100, fontSize: '0.75rem', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em',
                border: `1px solid ${tier === t ? (tierColors[t] || 'var(--accent-gold)') : 'var(--border)'}`,
                background: tier === t ? (t ? `${tierColors[t]}18` : 'var(--accent-gold-dim)') : 'transparent',
                color: tier === t ? (tierColors[t] || 'var(--accent-gold)') : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {t || 'All'}
            </button>
          ))}
        </div>

        {/* Segment filter */}
        <select
          className="input"
          value={seg}
          onChange={e => { setSeg(e.target.value); setPage(0) }}
          style={{ width: 'auto', minWidth: 130 }}
        >
          {SEGS.map(s => <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Segments'}</option>)}
        </select>

        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 220, borderRadius: 16 }} />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <SlidersHorizontal size={40} style={{ marginBottom: 16, opacity: 0.3 }} />
          <div style={{ fontSize: '1rem', marginBottom: 8 }}>No customers found</div>
          <div style={{ fontSize: '0.8rem' }}>Try adjusting filters or seed demo data from the Dashboard</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {customers.map(c => <CustomerCard key={c.customer_id} customer={c} />)}
        </div>
      )}

      {/* Pagination */}
      {customers.length === PER_PAGE && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 28 }}>
          <button className="btn btn-ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ padding: '8px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Page {page + 1}</span>
          <button className="btn btn-ghost" onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  )
}
