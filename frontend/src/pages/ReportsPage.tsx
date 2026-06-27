import { useMemo, useState } from 'react'
import {
  CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import PageHeader from '../components/PageHeader'
import { Icon, Loader } from '../components/ui'
import PeriodSwitcher from '../components/PeriodSwitcher'
import { api } from '../api'
import { comingSoon } from '../components/toast'
import { useByCategory, useByMember, useCashflow, useMembers, useSummary } from '../api/queries'
import { useCurrentFamily } from '../family/FamilyContext'
import { customPeriod, periodRange, type PeriodKey } from '../lib/period'
import { money, moneyShort } from '../lib/format'
import type { Granularity } from '../types'

export default function ReportsPage() {
  const { family, isLoading } = useCurrentFamily()
  const { data: members } = useMembers(family?.id)
  const [periodKey, setPeriodKey] = useState<PeriodKey>('quarter')
  const [custom, setCustom] = useState(() => { const m = periodRange('month'); return { from: m.from, to: m.to } })
  const [selected, setSelected] = useState<string[]>([])
  const [exporting, setExporting] = useState<string | null>(null)
  const period = useMemo(
    () => (periodKey === 'custom' ? customPeriod(custom.from, custom.to) : periodRange(periodKey)),
    [periodKey, custom],
  )

  if (isLoading || !family) return <Loader />
  const params = { familyId: family.id, from: period.from, to: period.to, memberIds: selected.length ? selected : undefined }

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const exp = async (format: 'xlsx' | 'pdf' | 'csv') => {
    if (format === 'pdf') { comingSoon('PDF-отчёты'); return }
    setExporting(format)
    try { await api.exportReport(params, format) } finally { setExporting(null) }
  }

  return (
    <>
      <PageHeader title="Отчёты и аналитика"
        subtitle={`${period.label}${selected.length ? ` · ${selected.length} участн.` : ' · вся семья'}`}
        actions={
          <>
            <button className="btn btn-sm" disabled={!!exporting} onClick={() => exp('pdf')}>
              {exporting === 'pdf' ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Icon name="file-type-pdf" size={15} />} PDF
            </button>
            <button className="btn btn-sm" disabled={!!exporting} onClick={() => exp('xlsx')}>
              {exporting === 'xlsx' ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Icon name="file-spreadsheet" size={15} />} Excel
            </button>
          </>
        } />

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <span className="hint" style={{ fontSize: 12 }}>Период:</span>
          <PeriodSwitcher value={periodKey} onChange={setPeriodKey}
            customFrom={custom.from} customTo={custom.to} onCustomChange={(from, to) => setCustom({ from, to })} />
          <span style={{ width: 1, height: 18, background: 'var(--border-strong)', margin: '0 4px' }} />
          <span className="hint" style={{ fontSize: 12 }}>Кто:</span>
          {members?.map((m) => (
            <button key={m.userId} className={`chip${selected.includes(m.userId) ? ' on' : ''}`} onClick={() => toggle(m.userId)}>{m.name}</button>
          ))}
        </div>

        <SummaryRow params={params} />

        <div className="dash-row" style={{ ['--cols' as string]: '1fr 1.3fr' } as React.CSSProperties}>
          <DonutCard params={params} />
          <TrendCard params={params} />
        </div>

        <div className="dash-row" style={{ ['--cols' as string]: '1fr 1fr' } as React.CSSProperties}>
          <MemberBars params={params} />
          <SourcesCard params={params} />
        </div>
      </div>
    </>
  )
}

type P = { familyId: string; from: string; to: string; memberIds?: string[] }

function SummaryRow({ params }: { params: P }) {
  const { data } = useSummary(params)
  if (!data) return null
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
      <Mini label="Доходы за период" value={money(data.income)} color="var(--success)" />
      <Mini label="Расходы за период" value={money(data.expense)} color="var(--danger)" />
      <Mini label="Норма сбережений" value={`${Math.round(data.savingsRate * 100)}%`} />
    </div>
  )
}

function DonutCard({ params }: { params: P }) {
  const { data } = useByCategory({ ...params, type: 'EXPENSE' })
  const slices = data ?? []
  const total = slices.reduce((s, x) => s + x.amount, 0)
  return (
    <div className="card">
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Расходы по категориям</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
        {slices.map((s) => (
          <span key={s.categoryId} className="row" style={{ gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color }} />{s.name} {Math.round(s.percent)}%
          </span>
        ))}
      </div>
      <div style={{ height: 180, position: 'relative' }} role="img" aria-label={`Расходы по категориям, всего ${money(total)}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="amount" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none">
              {slices.map((s) => <Cell key={s.categoryId} fill={s.color} />)}
            </Pie>
            <Tooltip formatter={(v: number) => money(v)} contentStyle={tooltipStyle} wrapperStyle={{ zIndex: 100 }}
              itemStyle={{ color: 'var(--text-primary)' }} labelStyle={{ color: 'var(--text-secondary)' }} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <span className="hint" style={{ fontSize: 12 }}>всего</span>
          <span style={{ fontSize: 16, fontWeight: 500 }}>{moneyShort(total)}</span>
        </div>
      </div>
    </div>
  )
}

function spanGranularity(from: string, to: string): Granularity {
  const days = (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000
  return days <= 45 ? 'DAY' : days <= 120 ? 'WEEK' : 'MONTH'
}
const GRAN_LABEL: Record<Granularity, string> = { DAY: 'по дням', WEEK: 'по неделям', MONTH: 'по месяцам' }

function TrendCard({ params }: { params: P }) {
  const granularity = spanGranularity(params.from, params.to)
  const { data } = useCashflow({ ...params, granularity })
  const points = data ?? []
  return (
    <div className="card">
      <div className="spread" style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Динамика доходов и расходов</span>
        <span className="hint" style={{ fontSize: 12 }}>{GRAN_LABEL[granularity]}</span>
      </div>
      <div className="row" style={{ gap: 14, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
        <span className="row" style={{ gap: 5 }}><span style={{ width: 14, height: 3, background: '#1D9E75' }} />Доходы</span>
        <span className="row" style={{ gap: 5 }}><span style={{ width: 14, height: 0, borderTop: '3px dashed #E24B4A' }} />Расходы</span>
      </div>
      <div style={{ height: 180 }} role="img" aria-label={`Динамика доходов и расходов ${GRAN_LABEL[granularity]}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => moneyShort(v)} />
            <Tooltip formatter={(v: number) => money(v)} contentStyle={tooltipStyle} wrapperStyle={{ zIndex: 100 }}
              itemStyle={{ color: 'var(--text-primary)' }} labelStyle={{ color: 'var(--text-secondary)' }} />
            <Line type="monotone" dataKey="income" stroke="#1D9E75" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="expense" stroke="#E24B4A" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function MemberBars({ params }: { params: P }) {
  const { data } = useByMember({ ...params, type: 'EXPENSE' })
  const rows = data ?? []
  const max = Math.max(1, ...rows.map((r) => r.amount))
  return (
    <div className="card">
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Расходы по участникам</div>
      {rows.map((m) => (
        <div key={m.userId} style={{ marginBottom: 11 }}>
          <div className="spread" style={{ fontSize: 12, marginBottom: 5 }}>
            <span>{m.name}</span><span className="muted">{money(m.amount)}</span>
          </div>
          <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(m.amount / max) * 100}%`, background: m.color, borderRadius: 99 }} />
          </div>
        </div>
      ))}
      {!rows.length && <div className="hint" style={{ fontSize: 12 }}>Нет данных</div>}
    </div>
  )
}

function SourcesCard({ params }: { params: P }) {
  const { data } = useByCategory({ ...params, type: 'INCOME' })
  const rows = data ?? []
  return (
    <div className="card">
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Источники доходов</div>
      {rows.map((s) => (
        <div key={s.categoryId} className="row" style={{ gap: 10, padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={s.icon} size={16} color={s.color} />
          </div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 12.5, fontWeight: 500 }}>{s.name}</div></div>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{Math.round(s.percent)}%</span>
        </div>
      ))}
      {!rows.length && <div className="hint" style={{ fontSize: 12 }}>Нет данных</div>}
    </div>
  )
}

function Mini({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500, marginTop: 4, color }}>{value}</div>
    </div>
  )
}

const tooltipStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)', border: '0.5px solid var(--border-strong)',
  borderRadius: 8, fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
  padding: '8px 12px', boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
}
