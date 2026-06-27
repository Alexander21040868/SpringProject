import { createContext, useContext, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { tokens } from '../api/tokens'
import type { User } from '../types'

// Выбранная семья хранится в localStorage и привязана к конкретному аккаунту.
const FAMILY_KEY = 'fp_family'

interface AuthCtx {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  updateUser: (user: User) => void
  logout: () => void
}

const Ctx = createContext<AuthCtx>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(tokens.user)
  const qc = useQueryClient()

  // Сбрасываем всё, что привязано к личности пользователя: кэш данных и выбранную семью,
  // чтобы при смене аккаунта данные одного не «протекали» в другой.
  function resetSession() {
    localStorage.removeItem(FAMILY_KEY)
    qc.clear()
  }

  async function login(email: string, password: string) {
    const res = await api.login({ email, password })
    tokens.save(res.accessToken, res.refreshToken, res.user)
    resetSession()
    setUser(res.user)
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.register({ name, email, password })
    tokens.save(res.accessToken, res.refreshToken, res.user)
    resetSession()
    setUser(res.user)
  }

  function updateUser(next: User) {
    if (tokens.access && tokens.refresh) tokens.save(tokens.access, tokens.refresh, next)
    setUser(next)
  }

  function logout() {
    tokens.clear()
    resetSession()
    setUser(null)
  }

  return <Ctx.Provider value={{ user, login, register, updateUser, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
