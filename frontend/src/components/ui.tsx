import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Role, LimitState } from '../types'
import { initials } from '../lib/format'

export function Icon({ name, size = 18, color }: { name: string; size?: number; color?: string }) {
  return <i className={`ti ti-${name}`} style={{ fontSize: size, color }} aria-hidden="true" />
}

export type SelectOption = { value: string; label: string; icon?: string; color?: string }

export function Select({ value, onChange, options, placeholder = 'Выбрать', disabled, size = 'md', style, ariaLabel }: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  style?: CSSProperties
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)
  const h = size === 'sm' ? 32 : 38
  const fz = size === 'sm' ? 12 : 14

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <button type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: h, padding: '0 10px 0 12px',
          fontSize: fz, background: 'var(--bg-primary)', color: 'var(--text-primary)',
          border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
          cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1, whiteSpace: 'nowrap',
        }}>
        {selected?.icon && <Icon name={selected.icon} size={fz + 3} color={selected.color} />}
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', color: selected ? undefined : 'var(--text-tertiary)' }}>
          {selected ? selected.label : placeholder}
        </span>
        <Icon name="chevron-down" size={15} color="var(--text-tertiary)" />
      </button>
      {open && (
        <div role="listbox" style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: '100%', width: 'max-content', maxWidth: 320, zIndex: 60,
          background: 'var(--bg-primary)', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 28px rgba(0,0,0,0.22)', padding: 4, maxHeight: 280, overflowY: 'auto',
        }}>
          {options.map((o) => {
            const active = o.value === value
            return (
              <button key={o.value} type="button" role="option" aria-selected={active}
                onClick={() => { onChange(o.value); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 10px',
                  fontSize: fz, textAlign: 'left', border: 'none', borderRadius: 'var(--radius-sm)',
                  background: active ? 'var(--bg-secondary)' : 'transparent', color: 'var(--text-primary)', cursor: 'pointer',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                {o.icon && <Icon name={o.icon} size={fz + 3} color={o.color} />}
                <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{o.label}</span>
                {active && <Icon name="check" size={15} color="var(--info)" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Avatar({ name, color, size = 32 }: { name: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 500, flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  )
}

const ROLE_LABEL: Record<Role, string> = { OWNER: 'админ', MEMBER: 'участник', VIEWER: 'просмотр' }
const ROLE_STYLE: Record<Role, { bg: string; fg: string }> = {
  OWNER: { bg: 'var(--info-bg)', fg: 'var(--info)' },
  MEMBER: { bg: 'var(--success-bg)', fg: 'var(--success)' },
  VIEWER: { bg: 'var(--bg-secondary)', fg: 'var(--text-secondary)' },
}

export function RoleBadge({ role }: { role: Role }) {
  const s = ROLE_STYLE[role]
  return <span className="badge" style={{ background: s.bg, color: s.fg }}>{ROLE_LABEL[role]}</span>
}

export function Ring({ percent, color, size = 64, stroke = 7, children }: {
  percent: number; color: string; size?: number; stroke?: number; children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.min(percent, 100) / 100)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`заполнено ${Math.round(percent)}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}

export const LIMIT_COLOR: Record<LimitState, string> = {
  OK: '#1D9E75', WARNING: '#EF9F27', EXCEEDED: '#E24B4A',
}
export const LIMIT_LABEL: Record<LimitState, string> = {
  OK: 'в норме', WARNING: 'близко', EXCEEDED: 'превышено',
}

export function StatCard({ label, value, sub, valueColor, dark }: {
  label: string; value: string; sub?: ReactNode; valueColor?: string; dark?: boolean
}) {
  return (
    <div style={{
      background: dark ? 'var(--text-primary)' : 'var(--bg-secondary)',
      color: dark ? 'var(--bg-primary)' : undefined,
      borderRadius: 'var(--radius-md)', padding: '13px 15px',
    }}>
      <div style={{ fontSize: 12, opacity: dark ? 0.7 : 1, color: dark ? undefined : 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontSize: 21, fontWeight: 500, marginTop: 4, color: valueColor }}>{value}</div>
      {sub && <div style={{ fontSize: 12, marginTop: 3, opacity: dark ? 0.7 : 1, color: dark ? undefined : 'var(--text-tertiary)' }}>{sub}</div>}
    </div>
  )
}

export function Loader({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>
      <span className="spinner" /> {label}
    </div>
  )
}

export function Modal({ title, onClose, children, footer }: {
  title: string; onClose: () => void; children: ReactNode; footer?: ReactNode
}) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 440, background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)', padding: '22px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div className="spread" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 17 }}>{title}</h2>
          <button className="btn btn-sm" onClick={onClose} aria-label="Закрыть"><Icon name="x" size={16} /></button>
        </div>
        {children}
        {footer && <div style={{ marginTop: 20 }}>{footer}</div>}
      </div>
    </div>
  )
}

export function IconButton({ icon, label, onClick, danger, size = 16 }: {
  icon: string; label: string; onClick: () => void; danger?: boolean; size?: number
}) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      style={{
        width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', background: 'transparent', borderRadius: 'var(--radius-md)', cursor: 'pointer',
        color: danger ? 'var(--danger)' : 'var(--text-secondary)', flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
      <Icon name={icon} size={size} />
    </button>
  )
}

export function ConfirmDialog({ title, message, confirmLabel = 'Удалить', onConfirm, onClose }: {
  title: string; message: string; confirmLabel?: string; onConfirm: () => void; onClose: () => void
}) {
  return (
    <Modal title={title} onClose={onClose}
      footer={
        <div className="row" style={{ gap: 10 }}>
          <button className="btn" style={{ flex: 1 }} onClick={onClose}>Отмена</button>
          <button className="btn" style={{ flex: 1, background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)' }}
            onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</button>
        </div>
      }>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{message}</p>
    </Modal>
  )
}
