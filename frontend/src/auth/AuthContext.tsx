import { createContext, useContext, useState, type ReactNode } from 'react'
import { api } from '../api'
import { tokens } from '../api/tokens'
import type { User } from '../types'

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

  async function login(email: string, password: string) {
    const res = await api.login({ email, password })
    tokens.save(res.accessToken, res.refreshToken, res.user)
    setUser(res.user)
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.register({ name, email, password })
    tokens.save(res.accessToken, res.refreshToken, res.user)
    setUser(res.user)
  }

  function updateUser(next: User) {
    if (tokens.access && tokens.refresh) tokens.save(tokens.access, tokens.refresh, next)
    setUser(next)
  }

  function logout() {
    tokens.clear()
    setUser(null)
  }

  return <Ctx.Provider value={{ user, login, register, updateUser, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
