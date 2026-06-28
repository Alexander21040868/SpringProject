import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import { ConfirmDialog, Icon, Loader, Modal } from '../components/ui'
import { useCategories, useCategoryMutations } from '../api/queries'
import { useCurrentFamily } from '../family/FamilyContext'
import { money } from '../lib/format'
import { CATEGORY_PALETTE } from '../lib/colors'
import type { Category, OperationType } from '../types'

const ICONS = ['shopping-cart', 'car', 'device-gamepad-2', 'heartbeat', 'school', 'coffee', 'home', 'plane', 'briefcase', 'building-store', 'chart-line', 'tools', 'gift', 'paw', 'shirt', 'bolt']
const COLORS = CATEGORY_PALETTE

export default function CategoriesPage() {
  const { family, isLoading } = useCurrentFamily()
  const { data: categories } = useCategories(family?.id)
  const mut = useCategoryMutations(family?.id ?? '')
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Category | null>(null)

  if (isLoading || !family) return <Loader />
  const expense = categories?.filter((c) => c.type === 'EXPENSE') ?? []
  const income = categories?.filter((c) => c.type === 'INCOME') ?? []

  return (
    <>
      <PageHeader title="Категории" subtitle={family.name}
        actions={<button className="btn btn-primary" onClick={() => setCreating(true)}><Icon name="plus" size={16} /> Категория</button>} />

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Section title="Расходы" icon="circle-minus" iconColor="var(--danger)" count={expense.length} items={expense} onEdit={setEditing} />
        <Section title="Доходы" icon="circle-plus" iconColor="var(--success)" count={income.length} items={income} onEdit={setEditing} />
      </div>

      {(creating || editing) && (
        <CategoryModal familyId={family.id} existing={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSave={(data) => {
            if (editing) mut.update.mutate({ id: editing.id, data })
            else mut.create.mutate({ familyId: family.id, ...data })
            setCreating(false); setEditing(null)
          }}
          onDelete={editing ? () => { setDeleting(editing); setEditing(null) } : undefined} />
      )}

      {deleting && (
        <ConfirmDialog title="Удалить категорию?"
          message={`Категория «${deleting.name}» будет удалена. Удалить можно только пустую категорию — если по ней есть операции, удаление будет отклонено.`}
          onConfirm={() => mut.remove.mutate(deleting.id)} onClose={() => setDeleting(null)} />
      )}
    </>
  )
}

function Section({ title, icon, iconColor, count, items, onEdit }: {
  title: string; icon: string; iconColor: string; count: number; items: Category[]; onEdit: (c: Category) => void
}) {
  return (
    <div>
      <div className="row" style={{ gap: 7, fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
        <Icon name={icon} size={16} color={iconColor} /> {title}
        <span className="hint" style={{ fontSize: 12, fontWeight: 400 }}>· {count}</span>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        {items.map((c) => (
          <button key={c.id} className="card" style={{ textAlign: 'left', cursor: 'pointer', border: '0.5px solid var(--border)' }} onClick={() => onEdit(c)}>
            <div className="spread" style={{ marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: c.color + '24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={c.icon} size={19} color={c.color} />
              </div>
              <Icon name="dots" size={15} color="var(--text-tertiary)" />
            </div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
            <div className="spread" style={{ marginTop: 6 }}>
              <span className="hint" style={{ fontSize: 12 }}>{c.operationsCount ?? 0} оп.</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{money(c.total ?? 0)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function CategoryModal({ familyId, existing, onClose, onSave, onDelete }: {
  familyId: string; existing?: Category
  onClose: () => void
  onSave: (data: { name: string; type: OperationType; icon: string; color: string }) => void
  onDelete?: () => void
}) {
  void familyId
  const [name, setName] = useState(existing?.name ?? '')
  const [type, setType] = useState<OperationType>(existing?.type ?? 'EXPENSE')
  const [icon, setIcon] = useState(existing?.icon ?? ICONS[0])
  const [color, setColor] = useState(existing?.color ?? COLORS[0])

  return (
    <Modal title={existing ? 'Изменить категорию' : 'Новая категория'} onClose={onClose}
      footer={
        <div className="row" style={{ gap: 10 }}>
          {onDelete && <button className="btn" style={{ color: 'var(--danger)' }} onClick={onDelete}><Icon name="trash" size={15} /></button>}
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={!name} onClick={() => onSave({ name, type, icon, color })}>Сохранить</button>
        </div>
      }>
      <div style={{ display: 'flex', gap: 6, background: 'var(--bg-secondary)', padding: 3, borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
        {(['EXPENSE', 'INCOME'] as OperationType[]).map((t) => (
          <button key={t} onClick={() => setType(t)} style={{
            flex: 1, padding: 8, border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)', fontSize: 13,
            background: type === t ? 'var(--bg-primary)' : 'transparent',
            color: type === t ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: type === t ? 500 : 400,
          }}>{t === 'EXPENSE' ? 'Расход' : 'Доход'}</button>
        ))}
      </div>

      <label style={lab}>Название</label>
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Продукты" style={{ marginBottom: 16 }} autoFocus />

      <label style={lab}>Иконка</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
        {ICONS.map((ic) => (
          <button key={ic} onClick={() => setIcon(ic)} aria-label={ic} style={{
            width: 38, height: 38, borderRadius: 'var(--radius-md)', cursor: 'pointer',
            background: icon === ic ? color + '24' : 'var(--bg-secondary)',
            border: `0.5px solid ${icon === ic ? color : 'transparent'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon name={ic} size={18} color={icon === ic ? color : 'var(--text-secondary)'} /></button>
        ))}
      </div>

      <label style={lab}>Цвет</label>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {COLORS.map((cl) => (
          <button key={cl} onClick={() => setColor(cl)} aria-label={cl} style={{
            width: 28, height: 28, borderRadius: '50%', background: cl, cursor: 'pointer',
            border: color === cl ? '2px solid var(--text-primary)' : '2px solid transparent',
          }} />
        ))}
      </div>
    </Modal>
  )
}

const lab: React.CSSProperties = { fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }
