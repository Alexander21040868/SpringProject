import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { Icon, LIMIT_COLOR, LIMIT_LABEL, Loader, Modal, Ring } from '../components/ui'
import { useCategories, useLimits, useSetLimits } from '../api/queries'
import { useCurrentFamily } from '../family/FamilyContext'
import { money } from '../lib/format'
import type { LimitStatus } from '../types'

export default function LimitsPage() {
  const { family, isLoading } = useCurrentFamily()
  const { data: limits } = useLimits(family?.id)
  const [editing, setEditing] = useState(false)

  if (isLoading || !family) return <Loader />
  const list = limits ?? []
  const isOwner = family.myRole === 'OWNER'

  const totalLimit = list.reduce((s, l) => s + l.limit, 0)
  const totalSpent = list.reduce((s, l) => s + l.spent, 0)
  const totalPct = totalLimit ? (totalSpent / totalLimit) * 100 : 0
  const left = totalLimit - totalSpent
  const daysLeft = daysToMonthEnd()
  const overall: LimitStatus['status'] = totalPct > 100 ? 'EXCEEDED' : totalPct >= 85 ? 'WARNING' : 'OK'

  return (
    <>
      <PageHeader title="Лимиты бюджета" subtitle={`${family.name} · обновляется по операциям`}
        actions={isOwner && <button className="btn" onClick={() => setEditing(true)}><Icon name="adjustments" size={16} /> Настроить</button>} />

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="row" style={{ gap: 18, background: 'var(--text-primary)', color: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
          <Ring percent={totalPct} color={LIMIT_COLOR[overall]} size={74} stroke={8}>
            <span style={{ fontSize: 16, fontWeight: 500 }}>{Math.round(totalPct)}%</span>
          </Ring>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, opacity: 0.7 }}>Общий лимит на месяц</div>
            <div style={{ fontSize: 24, fontWeight: 500, margin: '4px 0' }}>
              {money(totalSpent)} <span style={{ fontSize: 14, opacity: 0.6 }}>/ {money(totalLimit)}</span>
            </div>
            <span className="row" style={{ display: 'inline-flex', gap: 5, fontSize: 12, background: 'var(--bg-primary)', color: left < 0 ? 'var(--danger)' : 'var(--warning)', padding: '3px 10px', borderRadius: 99 }}>
              <Icon name={left < 0 ? 'alert-triangle' : 'clock'} size={13} />
              {left < 0 ? `превышено на ${money(-left)}` : `осталось ${money(left)}`} · {daysLeft} дн.
            </span>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
          {list.map((l) => (
            <div key={l.categoryId} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 14 }}>
              <Ring percent={l.percent} color={LIMIT_COLOR[l.status]} size={64}>
                <Icon name={l.icon} size={20} color={l.color} />
              </Ring>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{l.name}</div>
                <div className="hint" style={{ fontSize: 12, marginTop: 2 }}>{money(l.spent)} / {money(l.limit)}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: LIMIT_COLOR[l.status] }}>
                {Math.round(l.percent)}% · {LIMIT_LABEL[l.status]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {editing && family && <EditLimitsModal familyId={family.id} limits={list} onClose={() => setEditing(false)} />}
    </>
  )
}

function EditLimitsModal({ familyId, limits, onClose }: { familyId: string; limits: LimitStatus[]; onClose: () => void }) {
  const setLimits = useSetLimits(familyId)
  const { data: categories } = useCategories(familyId, 'EXPENSE')
  const cats = categories ?? []
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    setValues(Object.fromEntries(limits.filter((l) => l.limit > 0).map((l) => [l.categoryId, String(l.limit)])))
  }, [limits])

  async function save() {
    const payload = cats
      .map((c) => ({ categoryId: c.id, amount: Number((values[c.id] ?? '0').replace(/\s/g, '')) || 0 }))
      .filter((x) => x.amount > 0)
    await setLimits.mutateAsync(payload)
    onClose()
  }

  return (
    <Modal title="Лимиты по категориям" onClose={onClose}
      footer={<button className="btn btn-primary" style={{ width: '100%' }} onClick={save} disabled={setLimits.isPending || cats.length === 0}>
        {setLimits.isPending ? <span className="spinner" style={{ width: 15, height: 15 }} /> : 'Сохранить лимиты'}
      </button>}>
      {cats.length === 0 && (
        <p className="hint" style={{ fontSize: 13, textAlign: 'center', padding: '8px 0' }}>
          Сначала создайте категории расходов на странице «Категории».
        </p>
      )}
      {cats.map((c) => (
        <div key={c.id} className="row" style={{ gap: 11, marginBottom: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: (c.color ?? '#888') + '24', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={c.icon} size={17} color={c.color} />
          </div>
          <span style={{ flex: 1, fontSize: 13 }}>{c.name}</span>
          <input className="input" style={{ width: 120, height: 34 }} inputMode="numeric" placeholder="0"
            value={values[c.id] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [c.id]: e.target.value }))} />
        </div>
      ))}
    </Modal>
  )
}

function daysToMonthEnd(): number {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return end.getDate() - now.getDate()
}
