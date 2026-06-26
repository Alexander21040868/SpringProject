import { createContext, useContext, useState, type ReactNode } from 'react'
import { useFamilies } from '../api/queries'
import type { Family } from '../types'

const KEY = 'fp_family'

interface Ctx { familyId: string | null; setFamilyId: (id: string) => void }
const FamilyCtx = createContext<Ctx>(null!)

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [familyId, setId] = useState<string | null>(() => localStorage.getItem(KEY))
  const setFamilyId = (id: string) => { localStorage.setItem(KEY, id); setId(id) }
  return <FamilyCtx.Provider value={{ familyId, setFamilyId }}>{children}</FamilyCtx.Provider>
}

export function useCurrentFamily(): { family?: Family; isLoading: boolean } {
  const { familyId } = useContext(FamilyCtx)
  const { data, isLoading } = useFamilies()
  const family = data?.find((f) => f.id === familyId) ?? data?.[0]
  return { family, isLoading }
}

export const useFamilySwitch = () => useContext(FamilyCtx)
