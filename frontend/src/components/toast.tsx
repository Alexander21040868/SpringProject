import { useEffect, useState } from 'react'
import { Icon } from './ui'

type ToastType = 'error' | 'success' | 'info'
interface ToastItem { id: number; message: string; type: ToastType }

const listeners = new Set<(t: ToastItem) => void>()
let seq = 0

/** Глобально показать тост из любого места (в т.ч. вне React — из обработчиков ошибок react-query). */
export function notify(message: string, type: ToastType = 'info') {
  listeners.forEach((l) => l({ id: ++seq, message, type }))
}

const STYLE: Record<ToastType, { bg: string; fg: string; icon: string }> = {
  error: { bg: 'var(--danger-bg)', fg: 'var(--danger)', icon: 'alert-circle' },
  success: { bg: 'var(--success-bg)', fg: 'var(--success)', icon: 'circle-check' },
  info: { bg: 'var(--info-bg)', fg: 'var(--info)', icon: 'info-circle' },
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([])
  useEffect(() => {
    const l = (t: ToastItem) => {
      setItems((cur) => [...cur, t])
      setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== t.id)), 4000)
    }
    listeners.add(l)
    return () => { listeners.delete(l) }
  }, [])

  return (
    <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1000, alignItems: 'center', pointerEvents: 'none' }}>
      {items.map((t) => {
        const s = STYLE[t.type]
        return (
          <div key={t.id} role="status" style={{
            display: 'flex', alignItems: 'center', gap: 9, background: s.bg, color: s.fg,
            border: `0.5px solid ${s.fg}`, borderRadius: 'var(--radius-md)', padding: '10px 14px',
            fontSize: 13, fontWeight: 500, boxShadow: '0 6px 20px rgba(0,0,0,0.25)', maxWidth: 440,
          }}>
            <Icon name={s.icon} size={17} /> {t.message}
          </div>
        )
      })}
    </div>
  )
}
