import axios, { AxiosError } from 'axios'
import type { Api, CategoryInput, LimitInput } from './contract'
import { tokens } from './tokens'
import type { ApiError, OperationFilter, ReportParams } from '../types'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const http = axios.create({ baseURL })

http.interceptors.request.use((config) => {
  const t = tokens.access
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

http.interceptors.response.use(
  (r) => r,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401 && !location.pathname.startsWith('/login')) {
      tokens.clear()
      location.href = '/login'
    }
    // Нормализуем ошибку к единому формату из контракта.
    const data = error.response?.data
    const normalized: ApiError = data && (data as ApiError).code
      ? (data as ApiError)
      : { status: error.response?.status ?? 0, code: 'NETWORK_ERROR', message: error.message }
    return Promise.reject(normalized)
  },
)

function reportQuery(p: ReportParams) {
  const q = new URLSearchParams()
  q.set('familyId', p.familyId)
  q.set('from', p.from)
  q.set('to', p.to)
  if (p.type) q.set('type', p.type)
  if (p.granularity) q.set('granularity', p.granularity)
  p.memberIds?.forEach((id) => q.append('memberIds', id))
  return q
}

export const httpApi: Api = {
  async register(data) { return (await http.post('/auth/register', data)).data },
  async login(data) { return (await http.post('/auth/login', data)).data },

  async getMe() { return (await http.get('/users/me')).data },
  async updateMe(data) { return (await http.patch('/users/me', data)).data },

  async listFamilies() { return (await http.get('/families')).data },
  async createFamily(data) { return (await http.post('/families', data)).data },
  async getFamily(id) { return (await http.get(`/families/${id}`)).data },

  async listMembers(familyId) { return (await http.get(`/families/${familyId}/members`)).data },
  async updateMemberRole(familyId, memberId, role) {
    return (await http.patch(`/families/${familyId}/members/${memberId}`, { role })).data
  },
  async removeMember(familyId, memberId) { await http.delete(`/families/${familyId}/members/${memberId}`) },
  async listInvitations(familyId) { return (await http.get(`/families/${familyId}/invitations`)).data },
  async createInvitation(familyId, email, role) {
    return (await http.post(`/families/${familyId}/invitations`, { email, role })).data
  },
  async cancelInvitation(familyId, invitationId) {
    await http.delete(`/families/${familyId}/invitations/${invitationId}`)
  },

  async listMyInvitations() { return (await http.get('/invitations')).data },
  async acceptInvitation(id) { return (await http.post(`/invitations/${id}/accept`)).data },
  async declineInvitation(id) { await http.post(`/invitations/${id}/decline`) },

  async listCategories(familyId, type) {
    return (await http.get('/categories', { params: { familyId, type } })).data
  },
  async createCategory(data: CategoryInput) { return (await http.post('/categories', data)).data },
  async updateCategory(id, data) { return (await http.patch(`/categories/${id}`, data)).data },
  async deleteCategory(id) { await http.delete(`/categories/${id}`) },

  async listOperations(filter: OperationFilter) {
    return (await http.get('/operations', { params: filter })).data
  },
  async createOperation(input) { return (await http.post('/operations', input)).data },
  async updateOperation(id, input) { return (await http.patch(`/operations/${id}`, input)).data },
  async deleteOperation(id) { await http.delete(`/operations/${id}`) },

  async reportSummary(p) { return (await http.get('/reports/summary', { params: reportQuery(p) })).data },
  async reportByCategory(p) { return (await http.get('/reports/by-category', { params: reportQuery(p) })).data },
  async reportByMember(p) { return (await http.get('/reports/by-member', { params: reportQuery(p) })).data },
  async reportCashflow(p) { return (await http.get('/reports/cashflow', { params: reportQuery(p) })).data },
  async exportReport(p, format) {
    const q = reportQuery(p)
    q.set('format', format)
    const res = await http.get(`/reports/export?${q.toString()}`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report.${format}`
    a.click()
    URL.revokeObjectURL(url)
  },

  async getLimits(familyId, month) { return (await http.get('/limits', { params: { familyId, month } })).data },
  async setLimits(familyId, items: LimitInput[]) {
    return (await http.put('/limits', items, { params: { familyId } })).data
  },
}
