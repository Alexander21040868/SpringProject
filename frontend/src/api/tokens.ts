import type { User } from '../types'

const ACCESS = 'fp_access'
const REFRESH = 'fp_refresh'
const USER = 'fp_user'

export const tokens = {
  get access() { return localStorage.getItem(ACCESS) },
  get refresh() { return localStorage.getItem(REFRESH) },
  get user(): User | null {
    const raw = localStorage.getItem(USER)
    return raw ? (JSON.parse(raw) as User) : null
  },
  save(access: string, refresh: string, user: User) {
    localStorage.setItem(ACCESS, access)
    localStorage.setItem(REFRESH, refresh)
    localStorage.setItem(USER, JSON.stringify(user))
  },
  clear() {
    localStorage.removeItem(ACCESS)
    localStorage.removeItem(REFRESH)
    localStorage.removeItem(USER)
  },
}
