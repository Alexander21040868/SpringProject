import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import PeriodSwitcher from '../components/PeriodSwitcher'
import { Avatar, Icon, Loader, StatCard } from '../components/ui'
import AddOperationModal from './AddOperationModal'
import InvitationsBanner from '../components/InvitationsBanner'
import { useByCategory, useByMember, useCashflow, useOperations, useSummary } from '../api/queries'
import { useCurrentFamily } from '../family/FamilyContext'
import { customPeriod, periodRange, type PeriodKey } from '../lib/period'
import { money, shortDate } from '../lib/format'

export default function DashboardPage() {
  const { family, isLoading } = useCurrentFamily()
  const [periodKey, setPeriodKey] = useState<PeriodKey>('month')
  const [custom, setCustom] = useState(() => { const m = periodRange('month'); return { from: m.from, to: m.to } })
  const [adding, setAdding] = useState(false)
  const navigate = useNavigate()
  const period = useMemo(
    () => (periodKey === 'custom' ? customPeriod(custom.from, custom.to) : periodRange(periodKey)),
    [periodKey, custom],
  )

  if (isLoading || !family) return <Loader />
  const p = { familyId: family.id, from: period.from, to: period.to }

  return (
    <>
      <PageHeader title="Главная" subtitle={`${family.name} · ${period.label}`}
        actions={
          <>
            <PeriodSwitcher value={periodKey} onChange={setPeriodKey}
              customFrom={custom.from} customTo={custom.to} onCustomChange={(from, to) => setCustom({ from, to })} />
            <button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> Операция</button>
          </>
        } />

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <InvitationsBanner />
        <SummaryCards {...p} />

        <div className="dash-row" style={{ ['--cols' as string]: '1.35fr 1fr' } as React.CSSProperties}>
          <CashflowCard familyId={family.id} />
          <CategoriesCard {...p} />
        </div>

        <div className="dash-row" style={{ ['--cols' as string]: '1fr 1.25fr' } as React.CSSProperties}>
          <MembersCard {...p} />
          <RecentCard familyId={family.id} />
        </div>
      </div>

      {adding && <AddOperationModal familyId={family.id} onClose={() => setAdding(false)} />}
    </>
  )
}

function SummaryCards({ familyId, from, to }: { familyId: string; from: string; to: string }) {
  const { data } = useSummary({ familyId, from, to })
  if (!data) return <div className="kpi-grid" style={{ height: 86 }} />
  return (
    <div className="kpi-grid">
      <StatCard dark label="Баланс семьи" value={money(data.balance)}
        sub={data.incomeChangePct != null ? <><Icon name="trend-up" size={12} /> +{data.incomeChangePct}%</> : undefined} />
      <StatCard label="Доходы" value={money(data.income)} valueColor="var(--success)" sub="за период" />
      <StatCard label="Расходы" value={money(data.expense)} valueColor="var(--danger)" sub="за период" />
      <StatCard label="Накопления" value={money(data.savings)} sub={`${Math.round(data.savingsRate * 100)}% дохода`} />
    </div>
  )
}

function CashflowCard({ familyId }: { familyId: string }) {
  const range = useMemo(() => periodRange('year'), [])
  const { data } = useCashflow({ familyId, from: periodRange('month', new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1)).from, to: range.to })
  const points = data ?? []
  const max = Math.max(1, ...points.flatMap((p) => [p.income, p.expense]))
  return (
    <div className="card">
      <div className="spread" style={{ marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Денежный поток</span>
        <span className="hint" style={{ fontSize: 12 }}>6 месяцев</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
        {points.map((pt) => (
          <div key={pt.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: '100%' }}>
              <div style={{ width: 9, height: `${(pt.income / max) * 100}%`, minHeight: pt.income > 0 ? 3 : 0, background: 'var(--chart-income)', borderRadius: '3px 3px 0 0' }} title={`Доход: ${money(pt.income)}`} />
              <div style={{ width: 9, height: `${(pt.expense / max) * 100}%`, minHeight: pt.expense > 0 ? 3 : 0, background: 'var(--chart-expense)', borderRadius: '3px 3px 0 0' }} title={`Расход: ${money(pt.expense)}`} />
            </div>
            <span className="hint" style={{ fontSize: 12 }}>{pt.label}</span>
          </div>
        ))}
      </div>
      <div className="row" style={{ gap: 14, marginTop: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
        <Legend color="var(--chart-income)" label="Доходы" /><Legend color="var(--chart-expense)" label="Расходы" />
      </div>
    </div>
  )
}

function CategoriesCard({ familyId, from, to }: { familyId: string; from: string; to: string }) {
  const { data } = useByCategory({ familyId, from, to, type: 'EXPENSE' })
  const top = (data ?? []).slice(0, 5)
  return (
    <div className="card">
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Структура расходов</div>
      {top.map((c) => (
        <div key={c.categoryId} style={{ marginBottom: 11 }}>
          <div className="spread" style={{ fontSize: 12, marginBottom: 5 }}>
            <span className="row" style={{ gap: 6 }}><Icon name={c.icon} size={15} color={c.color} />{c.name}</span>
            <span className="muted">{Math.round(c.percent)}%</span>
          </div>
          <Bar percent={c.percent} color={c.color} />
        </div>
      ))}
      {!top.length && <div className="hint" style={{ fontSize: 12 }}>Нет расходов за период</div>}
    </div>
  )
}

function MembersCard({ familyId, from, to }: { familyId: string; from: string; to: string }) {
  const inc = useByMember({ familyId, from, to, type: 'INCOME' }).data ?? []
  const exp = useByMember({ familyId, from, to, type: 'EXPENSE' }).data ?? []
  const map = new Map<string, { userId: string; name: string; color: string; net: number }>()
  inc.forEach((m) => map.set(m.userId, { userId: m.userId, name: m.name, color: m.color, net: m.amount }))
  exp.forEach((m) => {
    const e = map.get(m.userId) ?? { userId: m.userId, name: m.name, color: m.color, net: 0 }
    e.net -= m.amount
    map.set(m.userId, e)
  })
  const data = [...map.values()].sort((a, b) => b.net - a.net)
  return (
    <div className="card">
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Участники</div>
      {data.map((m) => (
        <div key={m.userId} className="row" style={{ gap: 9, padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>
          <Avatar name={m.name} color={m.color} size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>{m.name}</div>
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: m.net >= 0 ? 'var(--success)' : 'var(--text-primary)' }}>
            {money(m.net, 'RUB', true)}
          </span>
        </div>
      ))}
    </div>
  )
}

function RecentCard({ familyId }: { familyId: string }) {
  const { data } = useOperations({ familyId, size: 5, page: 0 })
  const ops = data?.content ?? []
  return (
    <div className="card">
      <div className="spread" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Последние операции</span>
      </div>
      {ops.map((o) => (
        <div key={o.id} className="row" style={{ gap: 10, padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={o.category.icon} size={15} color={o.type === 'INCOME' ? 'var(--success)' : 'var(--text-secondary)'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.description || o.category.name}</div>
            <div className="hint" style={{ fontSize: 12 }}>{o.member.name} · {o.category.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: o.type === 'INCOME' ? 'var(--success)' : 'var(--text-primary)' }}>
              {money(o.type === 'INCOME' ? o.amount : -o.amount, o.currency, true)}
            </div>
            <div className="hint" style={{ fontSize: 12 }}>{shortDate(o.date)}</div>
          </div>
        </div>
      ))}
      {!ops.length && <div className="hint" style={{ fontSize: 12, padding: '8px 0' }}>Пока нет операций — добавьте первую</div>}
    </div>
  )
}

function Bar({ percent, color }: { percent: number; color: string }) {
  return (
    <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, percent)}%`, background: color, borderRadius: 99 }} />
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="row" style={{ gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: color }} />{label}</span>
}
