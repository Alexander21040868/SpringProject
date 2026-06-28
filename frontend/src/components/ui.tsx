import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Role } from '../types'
import { initials } from '../lib/format'

// Re-exported so existing imports from '../components/ui' keep working.
export { LIMIT_COLOR, LIMIT_LABEL } from '../lib/colors'

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
  const [activeIdx, setActiveIdx] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)
  const h = size === 'sm' ? 32 : 38
  const fz = size === 'sm' ? 12 : 14

  useEffect(() => {
    if (!open) return
    setActiveIdx(Math.max(0, options.findIndex((o) => o.value === value)))
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => { document.removeEventListener('mousedown', onDoc) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the active option scrolled into view while navigating with the keyboard.
  useEffect(() => {
    if (!open) return
    listRef.current?.children[activeIdx]?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIdx])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Escape') { setOpen(false); return }
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true) }
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(options.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Home') { e.preventDefault(); setActiveIdx(0) }
    else if (e.key === 'End') { e.preventDefault(); setActiveIdx(options.length - 1) }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const opt = options[activeIdx]
      if (opt) { onChange(opt.value); setOpen(false) }
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <button type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)} onKeyDown={onKeyDown}
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
        <div ref={listRef} role="listbox" aria-activedescendant={`opt-${activeIdx}`} style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: '100%', width: 'max-content', maxWidth: 320, zIndex: 60,
          background: 'var(--bg-primary)', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)', padding: 4, maxHeight: 280, overflowY: 'auto',
        }}>
          {options.map((o, i) => {
            const selectedOpt = o.value === value
            const highlighted = i === activeIdx
            return (
              <button key={o.value} id={`opt-${i}`} type="button" role="option" aria-selected={selectedOpt}
                onClick={() => { onChange(o.value); setOpen(false) }}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 10px',
                  fontSize: fz, textAlign: 'left', border: 'none', borderRadius: 'var(--radius-sm)',
                  background: highlighted ? 'var(--bg-secondary)' : 'transparent', color: 'var(--text-primary)', cursor: 'pointer',
                }}>
                {o.icon && <Icon name={o.icon} size={fz + 3} color={o.color} />}
                <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{o.label}</span>
                {selectedOpt && <Icon name="check" size={15} color="var(--info)" />}
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

export function StatCard({ label, value, sub, valueColor, dark }: {
  label: string; value: string; sub?: ReactNode; valueColor?: string; dark?: boolean
}) {
  return (
    <div style={{
      background: dark ? 'var(--text-primary)' : 'var(--bg-secondary)',
      color: dark ? 'var(--bg-primary)' : undefined,
      borderRadius: 'var(--radius-md)', padding: '13px 15px',
    }}>
      <div style={{ fontSize: 'var(--text-sm)', opacity: dark ? 0.7 : 1, color: dark ? undefined : 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 500, marginTop: 4, color: valueColor }}>{value}</div>
      {sub && <div style={{ fontSize: 'var(--text-sm)', marginTop: 3, opacity: dark ? 0.7 : 1, color: dark ? undefined : 'var(--text-tertiary)' }}>{sub}</div>}
    </div>
  )
}

export function Loader({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 'var(--text-base)' }}>
      <span className="spinner" /> {label}
    </div>
  )
}

export function Modal({ title, onClose, children, footer }: {
  title: string; onClose: () => void; children: ReactNode; footer?: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    // Focus the first focusable control so keyboard users land inside the dialog.
    const focusables = () => panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    focusables()?.[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab') return
      const els = focusables()
      if (!els || els.length === 0) return
      const first = els[0]
      const last = els[els.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); previouslyFocused?.focus?.() }
  }, [onClose])

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)',
    }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 440, background: 'var(--bg-primary)', boxShadow: 'var(--shadow-md)',
        borderRadius: 'var(--radius-lg)', padding: '22px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div className="spread" style={{ marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)' }}>{title}</h2>
          <button className="btn btn-sm" onClick={onClose} aria-label="Закрыть"><Icon name="x" size={16} /></button>
        </div>
        {children}
        {footer && <div style={{ marginTop: 'var(--space-5)' }}>{footer}</div>}
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
          <button className="btn btn-danger" style={{ flex: 1 }}
            onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</button>
        </div>
      }>
      <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{message}</p>
    </Modal>
  )
}
