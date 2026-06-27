import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './index'
import type { CategoryInput, LimitInput } from './contract'
import type { Currency, OperationFilter, OperationInput, ReportParams, Role } from '../types'

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => api.getMe() })
export const useUpdateMe = () =>
  useMutation({ mutationFn: (data: { name?: string; defaultCurrency?: Currency }) => api.updateMe(data) })

export const useMyInvitations = () =>
  useQuery({ queryKey: ['myInvitations'], queryFn: () => api.listMyInvitations(), staleTime: 0, refetchOnMount: 'always' })

export function useInvitationActions() {
  const qc = useQueryClient()
  const done = () => {
    qc.invalidateQueries({ queryKey: ['myInvitations'] })
    qc.invalidateQueries({ queryKey: ['families'] })
  }
  return {
    accept: useMutation({ mutationFn: (id: string) => api.acceptInvitation(id), onSuccess: done }),
    decline: useMutation({ mutationFn: (id: string) => api.declineInvitation(id), onSuccess: done }),
  }
}

export const useFamilies = () => useQuery({ queryKey: ['families'], queryFn: () => api.listFamilies() })

export function useCreateFamily() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; currency?: Currency }) => api.createFamily(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['families'] }),
  })
}

export function useDeleteFamily() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (familyId: string) => api.deleteFamily(familyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['families'] }),
  })
}

export const useMembers = (familyId?: string) =>
  useQuery({ queryKey: ['members', familyId], queryFn: () => api.listMembers(familyId!), enabled: !!familyId })

// Список приглашений доступен только владельцу (бэкенд требует OWNER), поэтому гейтим запрос.
export const useInvitations = (familyId?: string, enabled = true) =>
  useQuery({ queryKey: ['invitations', familyId], queryFn: () => api.listInvitations(familyId!), enabled: !!familyId && enabled })

export function useMemberMutations(familyId: string) {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['members', familyId] })
    qc.invalidateQueries({ queryKey: ['invitations', familyId] })
  }
  return {
    changeRole: useMutation({ mutationFn: (v: { memberId: string; role: Role }) => api.updateMemberRole(familyId, v.memberId, v.role), onSuccess: invalidate }),
    removeMember: useMutation({ mutationFn: (memberId: string) => api.removeMember(familyId, memberId), onSuccess: invalidate }),
    invite: useMutation({ mutationFn: (v: { email: string; role: Role }) => api.createInvitation(familyId, v.email, v.role), onSuccess: invalidate }),
    cancelInvite: useMutation({ mutationFn: (id: string) => api.cancelInvitation(familyId, id), onSuccess: invalidate }),
  }
}

export const useCategories = (familyId?: string, type?: 'INCOME' | 'EXPENSE') =>
  useQuery({ queryKey: ['categories', familyId, type], queryFn: () => api.listCategories(familyId!, type), enabled: !!familyId })

export function useCategoryMutations(familyId: string) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories', familyId] })
  return {
    create: useMutation({ mutationFn: (d: CategoryInput) => api.createCategory(d), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (v: { id: string; data: Partial<CategoryInput> }) => api.updateCategory(v.id, v.data), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => api.deleteCategory(id), onSuccess: invalidate }),
  }
}

export const useOperations = (filter: OperationFilter) =>
  useQuery({ queryKey: ['operations', filter], queryFn: () => api.listOperations(filter), enabled: !!filter.familyId })

export function useOperationMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['operations'] })
    qc.invalidateQueries({ queryKey: ['reports'] })
    qc.invalidateQueries({ queryKey: ['limits'] })
  }
  return {
    create: useMutation({ mutationFn: (d: OperationInput) => api.createOperation(d), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (v: { id: string; data: OperationInput }) => api.updateOperation(v.id, v.data), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => api.deleteOperation(id), onSuccess: invalidate }),
  }
}

export const useSummary = (p: ReportParams) =>
  useQuery({ queryKey: ['reports', 'summary', p], queryFn: () => api.reportSummary(p), enabled: !!p.familyId })
export const useByCategory = (p: ReportParams) =>
  useQuery({ queryKey: ['reports', 'byCategory', p], queryFn: () => api.reportByCategory(p), enabled: !!p.familyId })
export const useByMember = (p: ReportParams) =>
  useQuery({ queryKey: ['reports', 'byMember', p], queryFn: () => api.reportByMember(p), enabled: !!p.familyId })
export const useCashflow = (p: ReportParams) =>
  useQuery({ queryKey: ['reports', 'cashflow', p], queryFn: () => api.reportCashflow(p), enabled: !!p.familyId })

export const useLimits = (familyId?: string, month?: string) =>
  useQuery({ queryKey: ['limits', familyId, month], queryFn: () => api.getLimits(familyId!, month), enabled: !!familyId })

export function useSetLimits(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: LimitInput[]) => api.setLimits(familyId, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['limits', familyId] }),
  })
}
