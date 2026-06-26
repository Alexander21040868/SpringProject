import { useState } from 'react'
import { Icon, Modal, Select } from '../components/ui'
import { useCategories, useMembers, useOperationMutations } from '../api/queries'
import type { Operation, OperationType } from '../types'

export default function AddOperationModal({ familyId, existing, onClose }: {
  familyId: string; existing?: Operation; onClose: () => void
}) {
  const [type, setType] = useState<OperationType>(existing?.type ?? 'EXPENSE')
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '')
  const [categoryId, setCategoryId] = useState(existing?.category.id ?? '')
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10))
  const [memberId, setMemberId] = useState(existing?.member.userId ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')

  const { data: categories } = useCategories(familyId, type)
  const { data: members } = useMembers(familyId)
  const { create, update } = useOperationMutations()

  const num = Number(amount.replace(/\s/g, '').replace(',', '.'))
  const amountValid = num > 0
  const valid = amountValid && !!categoryId

  async function save() {
    if (!valid) return
    const payload = { familyId, type, amount: num, date, description, categoryId, memberId: memberId || undefined }
    if (existing) await update.mutateAsync({ id: existing.id, data: payload })
    else await create.mutateAsync(payload)
    onClose()
  }

  const saving = create.isPending || update.isPending

  return (
    <Modal title={existing ? 'Изменить операцию' : 'Новая операция'} onClose={onClose}
      footer={
        <div className="row" style={{ gap: 10 }}>
          <button className="btn" style={{ flex: 1 }} onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={save} disabled={!valid || saving}>
            {saving ? <span className="spinner" style={{ width: 15, height: 15 }} /> : 'Сохранить операцию'}
          </button>
        </div>
      }>
      <div style={{ display: 'flex', gap: 6, background: 'var(--bg-secondary)', padding: 3, borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
        {(['INCOME', 'EXPENSE'] as OperationType[]).map((t) => {
          const on = type === t
          const isExp = t === 'EXPENSE'
          return (
            <button key={t} onClick={() => { setType(t); setCategoryId('') }}
              style={{
                flex: 1, padding: 8, border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)',
                fontSize: 13, fontWeight: on ? 500 : 400,
                background: on ? (isExp ? 'var(--danger-bg)' : 'var(--success-bg)') : 'transparent',
                color: on ? (isExp ? 'var(--danger)' : 'var(--success)') : 'var(--text-secondary)',
              }}>
              {t === 'INCOME' ? 'Доход' : 'Расход'}
            </button>
          )
        })}
      </div>

      <label style={lab}>Сумма</label>
      <div style={{ position: 'relative', marginBottom: 5 }}>
        <span style={{ position: 'absolute', left: 13, top: 10, fontSize: 18, color: 'var(--text-tertiary)' }}>₽</span>
        <input className="input" style={{ paddingLeft: 30, fontSize: 18, height: 44 }} inputMode="decimal"
          value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" autoFocus />
      </div>
      <div style={{ fontSize: 12, marginBottom: 14, color: amountValid ? 'var(--success)' : 'var(--text-tertiary)' }}>
        <Icon name={amountValid ? 'check' : 'info-circle'} size={13} /> сумма должна быть больше нуля
      </div>

      <label style={lab}>Категория</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
        {categories?.map((c) => {
          const on = categoryId === c.id
          return (
            <button key={c.id} onClick={() => setCategoryId(c.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 11px',
                borderRadius: 99, cursor: 'pointer', background: 'var(--bg-primary)',
                border: `0.5px solid ${on ? c.color : 'var(--border-strong)'}`,
                color: on ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: on ? 500 : 400,
              }}>
              <Icon name={c.icon} size={15} color={c.color} /> {c.name}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={lab}>Дата</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label style={lab}>Участник</label>
          <Select value={memberId} onChange={setMemberId} ariaLabel="Участник" style={{ display: 'block', width: '100%' }}
            options={[{ value: '', label: '— я —' }, ...(members ?? []).map((m) => ({ value: m.userId, label: m.name }))]} />
        </div>
      </div>

      <label style={lab}>Описание</label>
      <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Например: продукты на неделю" />
    </Modal>
  )
}

const lab: React.CSSProperties = { fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }
