import type { ReactNode } from 'react'

export default function PageHeader({ title, subtitle, actions }: {
  title: string; subtitle?: string; actions?: ReactNode
}) {
  return (
    <div className="spread" style={{ flexWrap: 'wrap', padding: '20px 24px 14px' }}>
      <div>
        <h1 style={{ fontSize: 20 }}>{title}</h1>
        {subtitle && <div className="hint" style={{ fontSize: 12.5, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {actions && <div className="row" style={{ gap: 8 }}>{actions}</div>}
    </div>
  )
}
