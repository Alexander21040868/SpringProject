import type { Api, CategoryInput, LimitInput } from './contract'
import { tokens } from './tokens'
import type {
  Category, CashflowPoint, CategorySlice, Family, Invitation, LimitStatus, Member,
  MemberSlice, MyInvitation, Operation, OperationFilter, OperationType, ReportParams, Role, SummaryReport, User,
} from '../types'

const wait = <T>(data: T, ms = 280): Promise<T> => new Promise((r) => setTimeout(() => r(data), ms))
const uid = () => Math.random().toString(36).slice(2, 10)
const iso = (d: Date) => d.toISOString().slice(0, 10)
const SHORT_MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

type Granularity = 'DAY' | 'WEEK' | 'MONTH'
const weekStart = (date: string) => {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // понедельник недели
  return iso(d)
}
const bucketKey = (date: string, g: Granularity) =>
  g === 'MONTH' ? date.slice(0, 7) : g === 'WEEK' ? weekStart(date) : date
const bucketLabel = (key: string, g: Granularity) => {
  if (g === 'MONTH') return SHORT_MONTHS[Number(key.slice(5)) - 1]
  const d = new Date(key + 'T00:00:00')
  return `${d.getDate()}.${d.getMonth() + 1}` // день недели/дня — дата начала
}

// ---- сущности ----
const user: User = {
  id: 'u-alex', email: 'alex@family.ru', name: 'Александр', defaultCurrency: 'RUB',
  createdAt: '2025-01-12T10:00:00Z',
}

const family: Family = {
  id: 'fam-1', name: 'Семья Первановых', currency: 'RUB',
  balance: 842300, membersCount: 4, myRole: 'OWNER', createdAt: '2025-01-12T10:00:00Z',
}
let families: Family[] = [family]

// приглашения, адресованные текущему пользователю (со стороны получателя)
let myInvitations: MyInvitation[] = [
  { id: 'minv1', familyId: 'fam-2', familyName: 'Бюджет на дачу', role: 'MEMBER', invitedBy: 'Ольга', createdAt: '2026-06-05T10:00:00Z' },
]
const invitedFamilies: Record<string, Family> = {
  'fam-2': { id: 'fam-2', name: 'Бюджет на дачу', currency: 'RUB', balance: 156000, membersCount: 3, myRole: 'MEMBER', createdAt: '2026-02-01T10:00:00Z' },
}

let members: Member[] = [
  { id: 'm1', userId: 'u-alex', name: 'Александр', email: 'alex@family.ru', role: 'OWNER', color: '#185FA5', joinedAt: '2025-01-12T10:00:00Z' },
  { id: 'm2', userId: 'u-maria', name: 'Мария', email: 'maria@family.ru', role: 'MEMBER', color: '#993556', joinedAt: '2025-01-13T10:00:00Z' },
  { id: 'm3', userId: 'u-lev', name: 'Лев', email: 'lev@family.ru', role: 'MEMBER', color: '#0F6E56', joinedAt: '2025-02-01T10:00:00Z' },
  { id: 'm4', userId: 'u-anna', name: 'Анна', email: 'anna@family.ru', role: 'VIEWER', color: '#854F0B', joinedAt: '2025-03-10T10:00:00Z' },
]

let invitations: Invitation[] = [
  { id: 'inv1', email: 'babushka@family.ru', role: 'VIEWER', status: 'PENDING', createdAt: '2026-06-01T10:00:00Z' },
]

let categories: Category[] = [
  { id: 'c-prod', familyId: 'fam-1', name: 'Продукты', type: 'EXPENSE', icon: 'shopping-cart', color: '#1D9E75' },
  { id: 'c-trans', familyId: 'fam-1', name: 'Транспорт', type: 'EXPENSE', icon: 'car', color: '#378ADD' },
  { id: 'c-fun', familyId: 'fam-1', name: 'Развлечения', type: 'EXPENSE', icon: 'device-gamepad-2', color: '#D4537E' },
  { id: 'c-health', familyId: 'fam-1', name: 'Здоровье', type: 'EXPENSE', icon: 'heartbeat', color: '#BA7517' },
  { id: 'c-edu', familyId: 'fam-1', name: 'Образование', type: 'EXPENSE', icon: 'school', color: '#7F77DD' },
  { id: 'c-cafe', familyId: 'fam-1', name: 'Кафе', type: 'EXPENSE', icon: 'coffee', color: '#D85A30' },
  { id: 'c-salary', familyId: 'fam-1', name: 'Зарплата', type: 'INCOME', icon: 'briefcase', color: '#1D9E75' },
  { id: 'c-biz', familyId: 'fam-1', name: 'Бизнес', type: 'INCOME', icon: 'building-store', color: '#378ADD' },
  { id: 'c-invest', familyId: 'fam-1', name: 'Инвестиции', type: 'INCOME', icon: 'chart-line', color: '#7F77DD' },
  { id: 'c-side', familyId: 'fam-1', name: 'Подработка', type: 'INCOME', icon: 'tools', color: '#BA7517' },
]

const findCat = (id: string) => categories.find((c) => c.id === id)!
const findMemberByUser = (userId: string) => members.find((m) => m.userId === userId)!

const limitAmounts: Record<string, number> = {
  'c-prod': 100000, 'c-trans': 70000, 'c-fun': 45000, 'c-health': 50000, 'c-edu': 40000, 'c-cafe': 30000,
}

// ---- генерация операций за последние 6 месяцев ----
let seed = 42
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
const pick = <T>(arr: T[]) => arr[Math.floor(rnd() * arr.length)]
const between = (a: number, b: number) => Math.round(a + rnd() * (b - a))

const expenseSamples: { cat: string; desc: string[]; min: number; max: number }[] = [
  { cat: 'c-prod', desc: ['Пятёрочка', 'Лента', 'ВкусВилл', 'Магнит'], min: 800, max: 4200 },
  { cat: 'c-trans', desc: ['Яндекс Такси', 'Метро', 'Заправка', 'Каршеринг'], min: 200, max: 2800 },
  { cat: 'c-fun', desc: ['Кинотеатр КАРО', 'Боулинг', 'Концерт', 'Подписка'], min: 400, max: 3500 },
  { cat: 'c-health', desc: ['Аптека «Здоровье»', 'Стоматология', 'Анализы'], min: 600, max: 6000 },
  { cat: 'c-edu', desc: ['Онлайн-курс', 'Учебники', 'Репетитор'], min: 1500, max: 9000 },
  { cat: 'c-cafe', desc: ['Кофейня', 'Бизнес-ланч', 'Доставка еды'], min: 250, max: 2200 },
]

function buildOps(): Operation[] {
  const ops: Operation[] = []
  const now = new Date()
  for (let back = 5; back >= 0; back--) {
    const base = new Date(now.getFullYear(), now.getMonth() - back, 1)
    const Y = base.getFullYear()
    const M = base.getMonth()
    const maxDay = back === 0 ? now.getDate() : new Date(Y, M + 1, 0).getDate()

    // доходы
    ops.push(mk('INCOME', 'c-salary', 'u-alex', between(120000, 132000), new Date(Y, M, 5), 'Зарплата'))
    if (rnd() > 0.3) ops.push(mk('INCOME', 'c-biz', 'u-maria', between(20000, 40000), new Date(Y, M, 12), 'Доход от бизнеса'))
    if (rnd() > 0.5) ops.push(mk('INCOME', 'c-invest', 'u-alex', between(8000, 22000), new Date(Y, M, 18), 'Дивиденды'))
    if (rnd() > 0.6) ops.push(mk('INCOME', 'c-side', 'u-lev', between(6000, 18000), new Date(Y, M, 22), 'Фриланс'))

    // расходы
    const count = between(8, 13)
    for (let i = 0; i < count; i++) {
      const s = pick(expenseSamples)
      const member = pick(['u-maria', 'u-lev', 'u-anna', 'u-alex'])
      ops.push(mk('EXPENSE', s.cat, member, between(s.min, s.max), new Date(Y, M, between(1, maxDay)), pick(s.desc)))
    }
  }
  return ops.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

function mk(type: OperationType, catId: string, userId: string, amount: number, date: Date, description: string): Operation {
  return {
    id: uid(), familyId: 'fam-1', type, amount, currency: 'RUB', date: iso(date),
    description, category: findCat(catId), member: findMemberByUser(userId), createdAt: new Date().toISOString(),
  }
}

let operations = buildOps()

// ---- фильтры/агрегации ----
const inRange = (o: Operation, from?: string, to?: string) =>
  (!from || o.date >= from) && (!to || o.date <= to)

function filterOps(f: OperationFilter): Operation[] {
  return operations.filter((o) =>
    o.familyId === f.familyId &&
    (!f.type || o.type === f.type) &&
    (!f.categoryId || o.category.id === f.categoryId) &&
    (!f.memberId || o.member.userId === f.memberId) &&
    inRange(o, f.from, f.to) &&
    (!f.search || (o.description ?? '').toLowerCase().includes(f.search.toLowerCase())))
}

function periodOps(p: ReportParams): Operation[] {
  return operations.filter((o) =>
    o.familyId === p.familyId &&
    inRange(o, p.from, p.to) &&
    (!p.memberIds?.length || p.memberIds.includes(o.member.userId)))
}

const sum = (arr: Operation[]) => arr.reduce((s, o) => s + o.amount, 0)

// ---- реализация ----
export const mockApi: Api = {
  async register(data) {
    const u: User = { ...user, email: data.email, name: data.name }
    return wait({ accessToken: 'mock.' + uid(), refreshToken: 'mock.' + uid(), tokenType: 'Bearer', expiresIn: 3600, user: u })
  },
  async login(data) {
    const u: User = { ...user, email: data.email }
    return wait({ accessToken: 'mock.' + uid(), refreshToken: 'mock.' + uid(), tokenType: 'Bearer', expiresIn: 3600, user: u })
  },

  async getMe() { return wait(tokens.user ?? user) },
  async updateMe(data) { return wait({ ...(tokens.user ?? user), ...data }) },

  async listFamilies() { return wait(families) },
  async createFamily(data) {
    const f: Family = { ...family, id: uid(), name: data.name, currency: data.currency ?? 'RUB', membersCount: 1, myRole: 'OWNER' }
    families = [...families, f]
    return wait(f)
  },
  async getFamily(id) { return wait(families.find((f) => f.id === id) ?? family) },

  async listMembers() { return wait(members) },
  async updateMemberRole(_f, memberId, role: Role) {
    members = members.map((m) => (m.id === memberId ? { ...m, role } : m))
    return wait(members.find((m) => m.id === memberId)!)
  },
  async removeMember(_f, memberId) { members = members.filter((m) => m.id !== memberId); return wait(undefined) },
  async listInvitations() { return wait(invitations) },
  async createInvitation(_f, email, role) {
    const inv: Invitation = { id: uid(), email, role, status: 'PENDING', createdAt: new Date().toISOString() }
    invitations = [inv, ...invitations]
    return wait(inv)
  },
  async cancelInvitation(_f, id) { invitations = invitations.filter((i) => i.id !== id); return wait(undefined) },

  async listMyInvitations() { return wait(myInvitations) },
  async acceptInvitation(id) {
    const inv = myInvitations.find((i) => i.id === id)!
    myInvitations = myInvitations.filter((i) => i.id !== id)
    const fam = invitedFamilies[inv.familyId] ?? { ...family, id: inv.familyId, name: inv.familyName, myRole: inv.role }
    if (!families.some((f) => f.id === fam.id)) families = [...families, fam]
    return wait(fam)
  },
  async declineInvitation(id) { myInvitations = myInvitations.filter((i) => i.id !== id); return wait(undefined) },

  async listCategories(_f, type) { return wait(categories.filter((c) => !type || c.type === type)) },
  async createCategory(data: CategoryInput) {
    const c: Category = { id: uid(), ...data }
    categories = [...categories, c]
    return wait(c)
  },
  async updateCategory(id, data) {
    categories = categories.map((c) => (c.id === id ? { ...c, ...data } : c))
    return wait(findCat(id))
  },
  async deleteCategory(id) { categories = categories.filter((c) => c.id !== id); return wait(undefined) },

  async listOperations(filter) {
    const all = filterOps(filter)
    const size = filter.size ?? 20
    const page = filter.page ?? 0
    const content = all.slice(page * size, page * size + size)
    return wait({
      content, page, size,
      totalElements: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / size)),
      totalIncome: sum(all.filter((o) => o.type === 'INCOME')),
      totalExpense: sum(all.filter((o) => o.type === 'EXPENSE')),
    })
  },
  async createOperation(input) {
    const op = mk(input.type, input.categoryId, input.memberId ?? user.id, input.amount, new Date(input.date), input.description ?? '')
    operations = [op, ...operations].sort((a, b) => b.date.localeCompare(a.date))
    return wait(op)
  },
  async updateOperation(id, input) {
    operations = operations.map((o) => o.id === id ? {
      ...o, type: input.type, amount: input.amount, date: input.date,
      description: input.description ?? '', category: findCat(input.categoryId),
      member: findMemberByUser(input.memberId ?? o.member.userId),
    } : o)
    return wait(operations.find((o) => o.id === id)!)
  },
  async deleteOperation(id) { operations = operations.filter((o) => o.id !== id); return wait(undefined) },

  async reportSummary(p): Promise<SummaryReport> {
    const ops = periodOps(p)
    const income = sum(ops.filter((o) => o.type === 'INCOME'))
    const expense = sum(ops.filter((o) => o.type === 'EXPENSE'))
    const savings = income - expense
    return wait({
      from: p.from, to: p.to, income, expense, balance: family.balance,
      savings, savingsRate: income ? savings / income : 0, incomeChangePct: 12.4,
    })
  },
  async reportByCategory(p): Promise<CategorySlice[]> {
    const type = p.type ?? 'EXPENSE'
    const ops = periodOps(p).filter((o) => o.type === type)
    const total = sum(ops) || 1
    const map = new Map<string, number>()
    ops.forEach((o) => map.set(o.category.id, (map.get(o.category.id) ?? 0) + o.amount))
    return wait([...map.entries()]
      .map(([id, amount]) => {
        const c = findCat(id)
        return { categoryId: id, name: c.name, icon: c.icon, color: c.color, amount, percent: (amount / total) * 100 }
      })
      .sort((a, b) => b.amount - a.amount))
  },
  async reportByMember(p): Promise<MemberSlice[]> {
    const type = p.type ?? 'EXPENSE'
    const ops = periodOps(p).filter((o) => o.type === type)
    const total = sum(ops) || 1
    const map = new Map<string, number>()
    ops.forEach((o) => map.set(o.member.userId, (map.get(o.member.userId) ?? 0) + o.amount))
    return wait([...map.entries()]
      .map(([userId, amount]) => {
        const m = findMemberByUser(userId)
        return { userId, name: m.name, color: m.color, amount, percent: (amount / total) * 100 }
      })
      .sort((a, b) => b.amount - a.amount))
  },
  async reportCashflow(p): Promise<CashflowPoint[]> {
    const g = p.granularity ?? 'MONTH'
    const map = new Map<string, { income: number; expense: number }>()
    periodOps(p).forEach((o) => {
      const key = bucketKey(o.date, g)
      const e = map.get(key) ?? { income: 0, expense: 0 }
      if (o.type === 'INCOME') e.income += o.amount; else e.expense += o.amount
      map.set(key, e)
    })
    return wait([...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, v]) => ({ month: key, label: bucketLabel(key, g), income: v.income, expense: v.expense })))
  },
  async exportReport(_p, format) {
    const blob = new Blob([`Отчёт Финпульс (демо, формат ${format})`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report.${format === 'xlsx' ? 'txt' : format}`
    a.click()
    URL.revokeObjectURL(url)
    return wait(undefined)
  },

  async getLimits(_f, month): Promise<LimitStatus[]> {
    const m = month ?? iso(new Date()).slice(0, 7)
    const monthOps = operations.filter((o) => o.type === 'EXPENSE' && o.date.slice(0, 7) === m)
    return wait(categories.filter((c) => c.type === 'EXPENSE').map((c) => {
      const spent = sum(monthOps.filter((o) => o.category.id === c.id))
      const limit = limitAmounts[c.id] ?? 0
      const percent = limit ? (spent / limit) * 100 : 0
      const status: LimitStatus['status'] = percent > 100 ? 'EXCEEDED' : percent >= 85 ? 'WARNING' : 'OK'
      return { categoryId: c.id, name: c.name, icon: c.icon, color: c.color, limit, spent, percent, status }
    }))
  },
  async setLimits(familyId, items: LimitInput[]) {
    items.forEach((i) => { limitAmounts[i.categoryId] = i.amount })
    return this.getLimits(familyId)
  },
}
