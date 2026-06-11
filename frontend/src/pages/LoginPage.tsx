import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Icon } from '../components/ui'
import { USE_MOCK } from '../api'
import type { ApiError } from '../types'

export default function LoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState(USE_MOCK ? 'alex@family.ru' : '')
  const [password, setPassword] = useState(USE_MOCK ? '12345678' : '')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(name, email, password)
      navigate('/')
    } catch (err) {
      setError((err as ApiError).message || 'Не удалось войти')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', maxWidth: 720,
        background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      }}>
        <div style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)', padding: '34px 30px', display: 'flex', flexDirection: 'column' }}>
          <div className="row" style={{ gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chart-pie" size={19} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 500 }}>Финпульс</span>
          </div>
          <div style={{ marginTop: 32 }}>
            <div style={{ fontSize: 21, fontWeight: 500, lineHeight: 1.4 }}>Финансы семьи под контролем</div>
            <div style={{ fontSize: 13.5, opacity: 0.75, marginTop: 10, lineHeight: 1.6 }}>Доходы, расходы и отчёты для всей семьи в одном месте.</div>
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 13, paddingTop: 28 }}>
            {[['users', 'Совместный бюджет'], ['chart-histogram', 'Отчёты за любой период'], ['shield-lock', 'Доступ по ролям']].map(([i, t]) => (
              <div key={t} className="row" style={{ gap: 10, fontSize: 12.5, opacity: 0.9 }}><Icon name={i} size={17} /> {t}</div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} style={{ padding: '34px 30px' }}>
          <div style={{ fontSize: 18, fontWeight: 500 }}>{mode === 'login' ? 'Вход' : 'Регистрация'}</div>
          <div className="hint" style={{ fontSize: 12.5, marginTop: 3, marginBottom: 20 }}>
            {mode === 'login' ? 'Рады видеть снова' : 'Создайте аккаунт за минуту'}
          </div>

          {mode === 'register' && (
            <Field label="Имя" icon="user">
              <input className="input" style={{ paddingLeft: 36 }} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Александр" />
            </Field>
          )}

          <Field label="Email" icon="mail">
            <input className="input" style={{ paddingLeft: 36 }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>

          <Field label="Пароль" icon="lock">
            <input className="input" style={{ paddingLeft: 36, paddingRight: 36 }} type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label="Показать пароль"
              style={{ position: 'absolute', right: 10, top: 30, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
              <Icon name={show ? 'eye-off' : 'eye'} size={16} />
            </button>
          </Field>

          {error && <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: 11, marginTop: 4 }}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 18 }}>
            {mode === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
            <span style={{ color: 'var(--info)', cursor: 'pointer', fontWeight: 500 }}
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
              {mode === 'login' ? 'Создать' : 'Войти'}
            </span>
          </div>
          {USE_MOCK && <div className="hint" style={{ fontSize: 12, textAlign: 'center', marginTop: 14 }}>Демо-режим: вход с любыми данными</div>}
        </form>
      </div>
    </div>
  )
}

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <i className={`ti ti-${icon}`} style={{ position: 'absolute', left: 11, top: 11, fontSize: 16, color: 'var(--text-tertiary)' }} aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}
