import type { PeriodKey } from '../lib/period'

const BASE: { key: PeriodKey; label: string }[] = [
  { key: 'month', label: 'Месяц' },
  { key: 'quarter', label: 'Квартал' },
  { key: 'year', label: 'Год' },
]

interface Props {
  value: PeriodKey
  onChange: (k: PeriodKey) => void
  /** Если переданы — добавляется вкладка «Период» с выбором двух дат. */
  customFrom?: string
  customTo?: string
  onCustomChange?: (from: string, to: string) => void
}

export default function PeriodSwitcher({ value, onChange, customFrom = '', customTo = '', onCustomChange }: Props) {
  const items = onCustomChange ? [...BASE, { key: 'custom' as PeriodKey, label: 'Период' }] : BASE
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <div role="tablist" aria-label="Период отчёта" style={{ display: 'inline-flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 2 }}>
        {items.map((it) => {
          const on = value === it.key
          return (
            <button key={it.key} role="tab" aria-selected={on} onClick={() => onChange(it.key)}
              style={{
                border: 'none', cursor: 'pointer', fontSize: 12, padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                background: on ? 'var(--bg-primary)' : 'transparent',
                color: on ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: on ? 500 : 400,
              }}>
              {it.label}
            </button>
          )
        })}
      </div>

      {value === 'custom' && onCustomChange && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="date" className="input" aria-label="Дата начала" value={customFrom} max={customTo || undefined}
            onChange={(e) => onCustomChange(e.target.value, customTo)} style={{ width: 'auto', height: 32, fontSize: 12 }} />
          <span className="hint" style={{ fontSize: 12 }}>—</span>
          <input type="date" className="input" aria-label="Дата конца" value={customTo} min={customFrom || undefined}
            onChange={(e) => onCustomChange(customFrom, e.target.value)} style={{ width: 'auto', height: 32, fontSize: 12 }} />
        </div>
      )}
    </div>
  )
}
