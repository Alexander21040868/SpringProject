import type {
  AuthResponse, Category, CashflowPoint, CategorySlice, Family, Invitation, MyInvitation,
  LimitStatus, Member, MemberSlice, Operation, OperationFilter, OperationInput,
  OperationPage, OperationType, ReportParams, Role, SummaryReport, User, Currency,
} from '../types'

export interface CategoryInput {
  familyId: string
  name: string
  type: OperationType
  icon: string
  color: string
}

export interface LimitInput {
  categoryId: string
  amount: number
}

/** Единый контракт API — реализуется и реальным HTTP-клиентом, и моком. */
export interface Api {
  // auth
  register(data: { email: string; password: string; name: string }): Promise<AuthResponse>
  login(data: { email: string; password: string }): Promise<AuthResponse>

  // users
  getMe(): Promise<User>
  updateMe(data: { name?: string; defaultCurrency?: Currency }): Promise<User>

  // families
  listFamilies(): Promise<Family[]>
  createFamily(data: { name: string; currency?: Currency }): Promise<Family>
  getFamily(familyId: string): Promise<Family>

  // members
  listMembers(familyId: string): Promise<Member[]>
  updateMemberRole(familyId: string, memberId: string, role: Role): Promise<Member>
  removeMember(familyId: string, memberId: string): Promise<void>
  listInvitations(familyId: string): Promise<Invitation[]>
  createInvitation(familyId: string, email: string, role: Role): Promise<Invitation>
  cancelInvitation(familyId: string, invitationId: string): Promise<void>

  // приглашения текущего пользователя (со стороны получателя)
  listMyInvitations(): Promise<MyInvitation[]>
  acceptInvitation(invitationId: string): Promise<Family>
  declineInvitation(invitationId: string): Promise<void>

  // categories
  listCategories(familyId: string, type?: OperationType): Promise<Category[]>
  createCategory(data: CategoryInput): Promise<Category>
  updateCategory(id: string, data: Partial<CategoryInput>): Promise<Category>
  deleteCategory(id: string): Promise<void>

  // operations
  listOperations(filter: OperationFilter): Promise<OperationPage>
  createOperation(input: OperationInput): Promise<Operation>
  updateOperation(id: string, input: OperationInput): Promise<Operation>
  deleteOperation(id: string): Promise<void>

  // reports
  reportSummary(params: ReportParams): Promise<SummaryReport>
  reportByCategory(params: ReportParams): Promise<CategorySlice[]>
  reportByMember(params: ReportParams): Promise<MemberSlice[]>
  reportCashflow(params: ReportParams): Promise<CashflowPoint[]>
  exportReport(params: ReportParams, format: 'xlsx' | 'pdf' | 'csv'): Promise<void>

  // limits
  getLimits(familyId: string, month?: string): Promise<LimitStatus[]>
  setLimits(familyId: string, items: LimitInput[]): Promise<LimitStatus[]>
}
