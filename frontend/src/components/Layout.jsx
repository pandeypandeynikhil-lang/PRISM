import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, BarChart3, Zap, Activity, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',   sub: 'Overview & KPIs'     },
  { to: '/customers', icon: Users,           label: 'Customers',    sub: 'Risk & Profiles'     },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics',    sub: 'Segments & Trends'   },
  { to: '/predict',   icon: Zap,             label: 'Predict',      sub: 'Run Churn Model'     },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-void)' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 72 : 240,
        minWidth: collapsed ? 72 : 240,
        background: 'var(--bg-deep)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #d4a853, #8b5e1a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(212,168,83,0.4)',
            }}>
              <Activity size={18} color="#0a0800" strokeWidth={2.5} />
            </div>
            {!collapsed && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: '#f0f1f5', letterSpacing: '0.02em' }}>PRISM</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Retention AI</div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          {NAV.map(({ to, icon: Icon, label, sub }) => {
            const active = location.pathname.startsWith(to)
            return (
              <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: collapsed ? '11px 0' : '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: active ? 'var(--accent-gold-dim)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(212,168,83,0.2)' : 'transparent'}`,
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                }}>
                  <Icon
                    size={18}
                    color={active ? 'var(--accent-gold)' : 'var(--text-muted)'}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  {!collapsed && (
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400, color: active ? 'var(--accent-gold)' : 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>{label}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>
                    </div>
                  )}
                </div>
              </NavLink>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button
            onClick={() => setCollapsed(p => !p)}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: collapsed ? 'center' : 'space-between', padding: '8px 12px' }}
          >
            {!collapsed && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Collapse</span>}
            <ChevronRight size={14} color="var(--text-muted)" style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.25s' }} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  )
}
