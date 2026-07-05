import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, RefreshCw, SlidersHorizontal } from 'lucide-react'
import CustomerCard from '../components/CustomerCard.jsx'
import { ZoneBadge, ZONE_META } from '../components/ZoneBadge.jsx'
import { getCustomers } from '../services/api.js'

const SEGS = ['', 'wealth', 'premium', 'sme', 'retail']

export default function Customers() {
  const [searchParams]            = useSearchParams()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [zone, setZone]           = useState(searchParams.get('zone') ? parseInt(searchParams.get('zone')) : null)
  const [seg, setSeg]             = useState('')
  const [page, setPage]           = useState(0)
  const PER_PAGE = 24

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { skip: page * PER_PAGE, limit: PER_PAGE }
      if (zone)   params.zone    = zone
      if (seg)    params.segment = seg
      if (search) params.search  = search
      setCustomers(await getCustomers(params))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [zone, seg, search, page])

  useEffect(() => { load() }, [load])

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--accent-gold)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>◆ CUSTOMER INTELLIGENCE</div>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)' }}>
          Customer <span style={{ color: 'var(--accent-gold)' }}>Risk Profiles</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '0.88rem' }}>{customers.length} customers · sorted by CPI score (highest priority first)</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search name or ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} style={{ paddingLeft: 32 }} />
        </div>

        {/* Zone filter */}
        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={() => { setZone(null); setPage(0) }} style={{
            padding: '5px 12px', borderRadius: 100, fontSize: '0.72rem', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', border: `1px solid ${zone === null ? 'var(--accent-gold)' : 'var(--border)'}`,
            background: zone === null ? 'var(--accent-gold-dim)' : 'transparent',
            color: zone === null ? 'var(--accent-gold)' : 'var(--text-muted)', transition: 'all 0.15s',
          }}>All</button>
          {[1,2,3,4,5].map(z => {
            const meta = ZONE_META[z]
            return (
              <button key={z} onClick={() => { setZone(zone === z ? null : z); setPage(0) }} style={{
                padding: '5px 12px', borderRadius: 100, fontSize: '0.72rem', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', transition: 'all 0.15s',
                border: `1px solid ${zone === z ? meta.border : 'var(--border)'}`,
                background: zone === z ? meta.bg : 'transparent',
                color: zone === z ? meta.color : 'var(--text-muted)',
              }}>Z{z}</button>
            )
          })}
        </div>

        <select className="input" value={seg} onChange={e => { setSeg(e.target.value); setPage(0) }} style={{ width: 'auto', minWidth: 130 }}>
          {SEGS.map(s => <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Segments'}</option>)}
        </select>

        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
          {[...Array(12)].map((_, i) => <div key={i} className="skeleton" style={{ height: 250, borderRadius: 16 }} />)}
        </div>
      ) : customers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <SlidersHorizontal size={40} style={{ marginBottom: 16, opacity: 0.3 }} />
          <div style={{ fontSize: '1rem', marginBottom: 8 }}>No customers found</div>
          <div style={{ fontSize: '0.8rem' }}>Adjust filters or seed demo data from the Dashboard</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
          {customers.map(c => <CustomerCard key={c.customer_id} customer={c} />)}
        </div>
      )}

      {customers.length === PER_PAGE && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 28 }}>
          <button className="btn btn-ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ padding: '8px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Page {page + 1}</span>
          <button className="btn btn-ghost" onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  )
}
