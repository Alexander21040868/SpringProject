export type PeriodKey = 'month' | 'quarter' | 'year' | 'custom'

export interface Period { from: string; to: string; label: string }

const iso = (d: Date) => d.toISOString().slice(0, 10)
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

export function customPeriod(from: string, to: string): Period {
  let f = from, t = to
  if (f && t && f > t) [f, t] = [t, f]
  return { from: f, to: t, label: rangeLabel(f, t) }
}

function rangeLabel(from: string, to: string): string {
  if (!from || !to) return 'Выберите даты'
  const d1 = new Date(from + 'T00:00:00'), d2 = new Date(to + 'T00:00:00')
  const part = (d: Date) => `${d.getDate()} ${SHORT[d.getMonth()]}`
  return `${part(d1)} — ${part(d2)} ${d2.getFullYear()}`
}

export function periodRange(key: PeriodKey, ref = new Date()): Period {
  const y = ref.getFullYear()
  const m = ref.getMonth()
  if (key === 'month') {
    const from = new Date(y, m, 1)
    const to = new Date(y, m + 1, 0)
    return { from: iso(from), to: iso(to), label: `${MONTHS[m]} ${y}` }
  }
  if (key === 'quarter') {
    const qStart = Math.floor(m / 3) * 3
    const from = new Date(y, qStart, 1)
    const to = new Date(y, qStart + 3, 0)
    return { from: iso(from), to: iso(to), label: `Q${qStart / 3 + 1} ${y}` }
  }
  const from = new Date(y, 0, 1)
  const to = new Date(y, 11, 31)
  return { from: iso(from), to: iso(to), label: `${y} год` }
}

export function last6Months(ref = new Date()): Period {
  const from = new Date(ref.getFullYear(), ref.getMonth() - 5, 1)
  return { from: iso(from), to: iso(ref), label: '6 месяцев' }
}
