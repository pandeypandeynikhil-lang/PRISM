import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, BarChart3, Zap, Activity, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',  sub: 'Overview & KPIs'    },
  { to: '/customers', icon: Users,           label: 'Customers',   sub: 'CPI Risk Profiles'  },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics',   sub: 'Zones & Segments'   },
  { to: '/predict',   icon: Zap,             label: 'Predict',     sub: 'Run Churn Model'    },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-void)' }}>
      <aside style={{ width: collapsed ? 72 : 240, minWidth: collapsed ? 72 : 240, background: 'var(--bg-deep)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)', zIndex: 50 }}>
        {/* Logo */}
        <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, #d4a853, #8b5e1a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(212,168,83,0.4)' }}>
              <Activity size={17} color="#0a0800" strokeWidth={2.5} />
            </div>
            {!collapsed && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: '#f0f1f5', letterSpacing: '0.02em' }}>PRISM</div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>v2 · CPI Engine</div>
              </div>
            )}
          </div>
        </div>

        {/* CPI formula pill */}
        {!collapsed && (
          <div style={{ margin: '12px 14px 0', padding: '7px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>Priority Formula</div>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              CPI = <span style={{ color: 'var(--accent-gold)' }}>α</span>·CRS + <span style={{ color: '#d4a853' }}>β</span>·OS + <span style={{ color: '#60a5fa' }}>γ</span>·IS
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          {NAV.map(({ to, icon: Icon, label, sub }) => {
            const active = location.pathname.startsWith(to)
            return (
              <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: collapsed ? '11px 0' : '10px 12px', borderRadius: 'var(--radius-md)', justifyContent: collapsed ? 'center' : 'flex-start', background: active ? 'var(--accent-gold-dim)' : 'transparent', border: `1px solid ${active ? 'rgba(212,168,83,0.2)' : 'transparent'}`, transition: 'all 0.15s', cursor: 'pointer' }}>
                  <Icon size={17} color={active ? 'var(--accent-gold)' : 'var(--text-muted)'} strokeWidth={active ? 2.2 : 1.8} />
                  {!collapsed && (
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: active ? 600 : 400, color: active ? 'var(--accent-gold)' : 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>{label}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>
                    </div>
                  )}
                </div>
              </NavLink>
            )
          })}
        </nav>

        {/* Collapse */}
        <div style={{ padding: '14px 10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button onClick={() => setCollapsed(p => !p)} className="btn btn-ghost" style={{ width: '100%', justifyContent: collapsed ? 'center' : 'space-between', padding: '7px 12px' }}>
            {!collapsed && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Collapse</span>}
            <ChevronRight size={13} color="var(--text-muted)" style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.25s' }} />
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  )
}
