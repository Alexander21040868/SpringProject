import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Avatar, Icon, IconButton, RoleBadge } from './ui'
import CreateFamilyModal from './CreateFamilyModal'
import { useAuth } from '../auth/AuthContext'
import { useFamilies } from '../api/queries'
import { useCurrentFamily, useFamilySwitch } from '../family/FamilyContext'

const NAV = [
  { to: '/', icon: 'home', label: 'Главная', end: true },
  { to: '/operations', icon: 'arrows-exchange', label: 'Операции' },
  { to: '/reports', icon: 'chart-histogram', label: 'Отчёты' },
  { to: '/family', icon: 'users', label: 'Семья' },
  { to: '/categories', icon: 'category', label: 'Категории' },
  { to: '/limits', icon: 'target', label: 'Лимиты' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { data: families, isLoading: familiesLoading } = useFamilies()
  const { family } = useCurrentFamily()
  const { setFamilyId } = useFamilySwitch()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [famOpen, setFamOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const noFamilies = !familiesLoading && (families?.length ?? 0) === 0

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {mobileOpen && <div className="app-backdrop" onClick={() => setMobileOpen(false)} />}

      <aside className={`app-sidebar${mobileOpen ? ' open' : ''}`} style={{
        background: 'var(--bg-primary)', borderRight: '0.5px solid var(--border)',
        padding: '16px 12px', display: 'flex', flexDirection: 'column',
      }}>
        <div className="row" style={{ gap: 9, padding: '4px 8px 18px' }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--text-primary)', color: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chart-pie" size={18} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 500 }}>Финпульс</span>
        </div>

        {family && (
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <button onClick={() => setFamOpen((v) => !v)} aria-label="Сменить семью"
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <Icon name="users-group" size={16} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 500, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{family.name}</span>
              <Icon name="chevron-down" size={14} />
            </button>
            {famOpen && (
              <div style={{ position: 'absolute', top: 44, left: 0, right: 0, background: 'var(--bg-primary)', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: 4, zIndex: 20 }}>
                {families?.map((f) => (
                  <button key={f.id} onClick={() => { setFamilyId(f.id); setFamOpen(false) }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', border: 'none', background: f.id === family.id ? 'var(--bg-secondary)' : 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 12.5, textAlign: 'left' }}>
                    <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                    {f.id === family.id && <Icon name="check" size={14} />}
                  </button>
                ))}
                <button onClick={() => { setFamOpen(false); setMobileOpen(false); setCreateOpen(true) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', border: 'none', borderTop: '0.5px solid var(--border)', marginTop: 2, background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 12.5, textAlign: 'left' }}>
                  <Icon name="plus" size={14} /> Создать семью
                </button>
                <button onClick={() => { setFamOpen(false); setMobileOpen(false); navigate('/family') }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12.5, textAlign: 'left' }}>
                  <Icon name="settings" size={14} /> Управление семьёй
                </button>
              </div>
            )}
          </div>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px',
                borderRadius: 'var(--radius-md)', fontSize: 13.5,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-secondary)' : 'transparent',
                fontWeight: isActive ? 500 : 400,
              })}>
              <Icon name={n.icon} size={18} /> {n.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
          <div className="row" style={{ gap: 9, padding: '6px 6px', position: 'relative' }}>
            <Avatar name={user?.name ?? '?'} color="#185FA5" size={30} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div className="hint" style={{ fontSize: 12 }}>{family ? <RoleBadge role={family.myRole} /> : '—'}</div>
            </div>
            <IconButton icon="dots" label="Меню" onClick={() => setOpen((v) => !v)} />
            {open && (
              <div style={{ position: 'absolute', bottom: 44, right: 6, background: 'var(--bg-primary)', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: 4, minWidth: 160, zIndex: 10 }}>
                <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }} onClick={() => { setOpen(false); setMobileOpen(false); navigate('/settings') }}>
                  <Icon name="settings" size={15} /> Настройки
                </button>
                <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }} onClick={() => { logout(); navigate('/login') }}>
                  <Icon name="logout" size={15} /> Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header className="app-topbar">
          <IconButton icon="menu-2" label="Открыть меню" onClick={() => setMobileOpen(true)} />
          <div className="row" style={{ gap: 8, flex: 1, minWidth: 0 }}>
            <Icon name="chart-pie" size={18} />
            <span style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{family?.name ?? 'Финпульс'}</span>
          </div>
        </header>

        <main style={{ flex: 1, minWidth: 0, maxWidth: 1180, width: '100%', margin: '0 auto', padding: '0 0 40px' }}>
          {noFamilies ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 14, padding: '80px 24px', minHeight: '60vh' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <Icon name="users-group" size={28} />
              </div>
              <div>
                <h2 style={{ fontSize: 18 }}>У вас пока нет семьи</h2>
                <p className="hint" style={{ fontSize: 13, marginTop: 6, maxWidth: 320 }}>Создайте семью, чтобы вести общий бюджет, или дождитесь приглашения от близких.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Icon name="plus" size={16} /> Создать семью</button>
            </div>
          ) : (
            <Outlet context={{ family }} />
          )}
        </main>
      </div>

      {createOpen && <CreateFamilyModal onClose={() => setCreateOpen(false)} />}
    </div>
  )
}
