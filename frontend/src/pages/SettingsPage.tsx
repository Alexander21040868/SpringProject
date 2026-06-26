import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Avatar, Icon, Loader, Select } from '../components/ui'
import { notify } from '../components/toast'
import { useMe, useUpdateMe } from '../api/queries'
import { useAuth } from '../auth/AuthContext'
import type { Currency } from '../types'

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'RUB', label: '₽ Российский рубль' },
  { value: 'USD', label: '$ Доллар США' },
  { value: 'EUR', label: '€ Евро' },
  { value: 'KZT', label: '₸ Казахстанский тенге' },
  { value: 'GEL', label: '₾ Грузинский лари' },
]

export default function SettingsPage() {
  const { data: me, isLoading } = useMe()
  const { updateUser, logout } = useAuth()
  const update = useUpdateMe()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<Currency>('RUB')

  useEffect(() => {
    if (me) { setName(me.name); setCurrency(me.defaultCurrency) }
  }, [me])

  if (isLoading || !me) return <Loader />
  const dirty = name.trim() !== me.name || currency !== me.defaultCurrency

  async function save() {
    const updated = await update.mutateAsync({ name: name.trim(), defaultCurrency: currency })
    updateUser(updated)
    notify('Профиль сохранён', 'success')
  }

  return (
    <>
      <PageHeader title="Настройки" subtitle="Профиль и предпочтения" />

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 520 }}>
        <div className="card">
          <div className="row" style={{ gap: 12, marginBottom: 18 }}>
            <Avatar name={name || me.name} color="#185FA5" size={48} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{me.name}</div>
              <div className="hint" style={{ fontSize: 12 }}>{me.email}</div>
            </div>
          </div>

          <label style={lab}>Имя</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} style={{ marginBottom: 16 }} />

          <label style={lab}>Email</label>
          <input className="input" value={me.email} disabled style={{ marginBottom: 16, opacity: 0.7 }} />

          <label style={lab}>Валюта по умолчанию</label>
          <Select value={currency} onChange={(v) => setCurrency(v as Currency)} options={CURRENCIES}
            ariaLabel="Валюта по умолчанию" style={{ display: 'block', width: '100%', marginBottom: 18 }} />

          <button className="btn btn-primary" disabled={!dirty || !name.trim() || update.isPending} onClick={save}>
            {update.isPending ? <span className="spinner" style={{ width: 15, height: 15 }} /> : <><Icon name="device-floppy" size={16} /> Сохранить</>}
          </button>
        </div>

        <div className="card">
          <div className="spread">
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Выйти из аккаунта</div>
              {}
            </div>
            <button className="btn" style={{ color: 'var(--danger)' }} onClick={() => { logout(); navigate('/login') }}>
              <Icon name="logout" size={16} /> Выйти
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const lab: React.CSSProperties = { fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }
