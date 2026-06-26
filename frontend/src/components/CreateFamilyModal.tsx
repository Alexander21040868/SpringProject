import { useState } from 'react'
import { Modal, Select } from './ui'
import { notify } from './toast'
import { useCreateFamily } from '../api/queries'
import { useFamilySwitch } from '../family/FamilyContext'
import type { Currency } from '../types'

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'RUB', label: '₽ Рубль' },
  { value: 'USD', label: '$ Доллар' },
  { value: 'EUR', label: '€ Евро' },
  { value: 'KZT', label: '₸ Тенге' },
  { value: 'GEL', label: '₾ Лари' },
]

export default function CreateFamilyModal({ onClose }: { onClose: () => void }) {
  const create = useCreateFamily()
  const { setFamilyId } = useFamilySwitch()
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<Currency>('RUB')

  async function submit() {
    const fam = await create.mutateAsync({ name: name.trim(), currency })
    setFamilyId(fam.id)
    notify(`Семья «${fam.name}» создана`, 'success')
    onClose()
  }

  return (
    <Modal title="Новая семья" onClose={onClose}
      footer={<button className="btn btn-primary" style={{ width: '100%' }} disabled={!name.trim() || create.isPending} onClick={submit}>
        {create.isPending ? <span className="spinner" style={{ width: 15, height: 15 }} /> : 'Создать семью'}
      </button>}>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 0, marginBottom: 16, lineHeight: 1.6 }}>
        Вы станете администратором новой семьи и сможете пригласить участников.
      </p>
      <label style={lab}>Название</label>
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={100}
        placeholder="Например: Семья Ивановых" autoFocus style={{ marginBottom: 16 }} />
      <label style={lab}>Валюта</label>
      <Select value={currency} onChange={(v) => setCurrency(v as Currency)} options={CURRENCIES}
        ariaLabel="Валюта" style={{ display: 'block', width: '100%' }} />
    </Modal>
  )
}

const lab: React.CSSProperties = { fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }
