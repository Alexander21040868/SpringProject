import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { Avatar, ConfirmDialog, Icon, IconButton, Loader } from '../components/ui'
import AddOperationModal from './AddOperationModal'
import { useCategories, useMembers, useOperationMutations, useOperations } from '../api/queries'
import { useCurrentFamily } from '../family/FamilyContext'
import { humanDay, money } from '../lib/format'
import type { Operation, OperationType } from '../types'

export default function OperationsPage() {
  const { family, isLoading } = useCurrentFamily()
  const [type, setType] = useState<OperationType | undefined>(undefined)
  const [categoryId, setCategoryId] = useState('')
  const [memberId, setMemberId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Operation | null>(null)
  const [deleting, setDeleting] = useState<Operation | null>(null)

  const { data: categories } = useCategories(family?.id)
  const { data: members } = useMembers(family?.id)
  const { remove } = useOperationMutations()

  const filter = useMemo(() => ({
    familyId: family?.id ?? '', type, categoryId: categoryId || undefined,
    memberId: memberId || undefined, search: search || undefined, page, size: 12,
  }), [family?.id, type, categoryId, memberId, search, page])

  const { data, isLoading: opsLoading } = useOperations(filter)

  if (isLoading || !family) return <Loader />

  const grouped = groupByDay(data?.content ?? [])

  return (
    <>
      <PageHeader title="Операции" subtitle={`${family.name} · ${data?.totalElements ?? 0} записей`}
        actions={<button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> Добавить</button>} />

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 12, top: 11, fontSize: 16, color: 'var(--text-tertiary)' }} aria-hidden="true" />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Поиск по описанию…"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} />
        </div>

        <div className="row" style={{ gap: 7, flexWrap: 'wrap' }}>
          <Chip on={type === undefined} onClick={() => { setType(undefined); setPage(0) }}>Все</Chip>
          <Chip on={type === 'INCOME'} onClick={() => { setType('INCOME'); setPage(0) }}><Icon name="circle-plus" size={14} /> Доходы</Chip>
          <Chip on={type === 'EXPENSE'} onClick={() => { setType('EXPENSE'); setPage(0) }}><Icon name="circle-minus" size={14} /> Расходы</Chip>
          <span style={{ width: 1, height: 18, background: 'var(--border-strong)', margin: '0 3px' }} />
          <select className="input" style={{ width: 'auto', height: 32, fontSize: 12 }} value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(0) }}>
            <option value="">Все категории</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input" style={{ width: 'auto', height: 32, fontSize: 12 }} value={memberId} onChange={(e) => { setMemberId(e.target.value); setPage(0) }}>
            <option value="">Все участники</option>
            {members?.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
          </select>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <Mini label="Найдено" value={`${data?.totalElements ?? 0}`} />
          <Mini label="Доход" value={money(data?.totalIncome ?? 0, 'RUB', true)} color="var(--success)" />
          <Mini label="Расход" value={money(-(data?.totalExpense ?? 0), 'RUB', true)} color="var(--danger)" />
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {opsLoading ? <Loader /> : grouped.length === 0 ? (
            <div className="hint" style={{ padding: 30, textAlign: 'center', fontSize: 13 }}>Ничего не найдено</div>
          ) : grouped.map(([day, ops]) => (
            <div key={day}>
              <div className="hint" style={{ fontSize: 12, padding: '9px 16px 5px', background: 'var(--bg-secondary)' }}>{day}</div>
              {ops.map((o) => (
                <div key={o.id} className="op-row" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 16px', borderBottom: '0.5px solid var(--border)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={o.category.icon} size={17} color={o.type === 'INCOME' ? 'var(--success)' : o.category.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{o.description || o.category.name}</div>
                    <div className="hint" style={{ fontSize: 12 }}>{o.member.name} · {o.category.name}</div>
                  </div>
                  <Avatar name={o.member.name} color={o.member.color} size={22} />
                  <span style={{ fontSize: 13, fontWeight: 500, minWidth: 92, textAlign: 'right', color: o.type === 'INCOME' ? 'var(--success)' : 'var(--text-primary)' }}>
                    {money(o.type === 'INCOME' ? o.amount : -o.amount, o.currency, true)}
                  </span>
                  <div className="row" style={{ gap: 2 }}>
                    <IconButton icon="pencil" label="Изменить" onClick={() => setEditing(o)} />
                    <IconButton icon="trash" label="Удалить" danger onClick={() => setDeleting(o)} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {(data?.totalPages ?? 1) > 1 && (
          <div className="row" style={{ justifyContent: 'center', gap: 6 }}>
            <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Назад"><Icon name="chevron-left" size={15} /></button>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{page + 1} / {data?.totalPages}</span>
            <button className="btn btn-sm" disabled={page + 1 >= (data?.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)} aria-label="Вперёд"><Icon name="chevron-right" size={15} /></button>
          </div>
        )}
      </div>

      {adding && <AddOperationModal familyId={family.id} onClose={() => setAdding(false)} />}
      {editing && <AddOperationModal familyId={family.id} existing={editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog title="Удалить операцию?"
          message={`«${deleting.description || deleting.category.name}» на сумму ${money(deleting.amount)} будет удалена безвозвратно.`}
          onConfirm={() => remove.mutate(deleting.id)} onClose={() => setDeleting(null)} />
      )}
    </>
  )
}

function groupByDay(ops: Operation[]): [string, Operation[]][] {
  const map = new Map<string, Operation[]>()
  ops.forEach((o) => {
    const key = o.date
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(o)
  })
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([d, list]) => [humanDay(d), list])
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className={`chip${on ? ' on' : ''}`} onClick={onClick}>{children}</button>
}

function Mini({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '10px 13px' }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ fontSize: 16, fontWeight: 500, color }}>{value}</div>
    </div>
  )
}
