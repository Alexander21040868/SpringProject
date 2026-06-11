// Типы соответствуют схемам из openapi/openapi.yaml

export type Role = 'OWNER' | 'MEMBER' | 'VIEWER'
export type OperationType = 'INCOME' | 'EXPENSE'
export type Currency = 'RUB' | 'USD' | 'EUR' | 'KZT' | 'GEL'
export type LimitState = 'OK' | 'WARNING' | 'EXCEEDED'
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'

export interface User {
  id: string
  email: string
  name: string
  defaultCurrency: Currency
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface Family {
  id: string
  name: string
  currency: Currency
  balance: number
  membersCount: number
  myRole: Role
  createdAt: string
}

export interface Member {
  id: string
  userId: string
  name: string
  email: string
  role: Role
  color: string
  joinedAt: string
}

export interface Invitation {
  id: string
  email: string
  role: Role
  status: InvitationStatus
  createdAt: string
}

/** Приглашение, адресованное текущему пользователю (со стороны получателя). */
export interface MyInvitation {
  id: string
  familyId: string
  familyName: string
  role: Role
  invitedBy: string
  createdAt: string
}

export interface Category {
  id: string
  familyId: string
  name: string
  type: OperationType
  icon: string
  color: string
  operationsCount?: number
  total?: number
}

export interface Operation {
  id: string
  familyId: string
  type: OperationType
  amount: number
  currency: Currency
  date: string
  description?: string
  category: Category
  member: Member
  createdAt: string
}

export interface OperationPage {
  content: Operation[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  totalIncome: number
  totalExpense: number
}

export interface SummaryReport {
  from: string
  to: string
  income: number
  expense: number
  balance: number
  savings: number
  savingsRate: number
  incomeChangePct?: number | null
}

export interface CategorySlice {
  categoryId: string
  name: string
  icon: string
  color: string
  amount: number
  percent: number
}

export interface MemberSlice {
  userId: string
  name: string
  color: string
  amount: number
  percent: number
}

export interface CashflowPoint {
  month: string
  label: string
  income: number
  expense: number
}

export interface LimitStatus {
  categoryId: string
  name: string
  icon: string
  color: string
  limit: number
  spent: number
  percent: number
  status: LimitState
}

export interface ApiError {
  status: number
  code: string
  message: string
  path?: string
  fieldErrors?: { field: string; message: string }[]
}

// --- query params ---
export interface OperationFilter {
  familyId: string
  type?: OperationType
  categoryId?: string
  memberId?: string
  from?: string
  to?: string
  search?: string
  page?: number
  size?: number
}

export type Granularity = 'DAY' | 'WEEK' | 'MONTH'

export interface ReportParams {
  familyId: string
  from: string
  to: string
  memberIds?: string[]
  type?: OperationType
  granularity?: Granularity
}

export interface OperationInput {
  familyId: string
  type: OperationType
  amount: number
  currency?: Currency
  date: string
  description?: string
  categoryId: string
  memberId?: string
}
