import type { Currency } from '../types'

const SYMBOL: Record<Currency, string> = { RUB: '₽', USD: '$', EUR: '€', KZT: '₸', GEL: '₾' }

export function currencySymbol(c: Currency = 'RUB') {
  return SYMBOL[c] ?? '₽'
}

/** 128400 -> "128 400 ₽" (со знаком при signed=true) */
export function money(value: number, currency: Currency = 'RUB', signed = false): string {
  const abs = Math.abs(Math.round(value))
  const num = abs.toLocaleString('ru-RU')
  const sym = currencySymbol(currency)
  if (signed) {
    const sign = value > 0 ? '+' : value < 0 ? '−' : ''
    return `${sign}${num} ${sym}`
  }
  return `${num} ${sym}`
}

/** Компактно: 128400 -> "128k", 1180000 -> "1.2M" */
export function moneyShort(value: number, currency: Currency = 'RUB'): string {
  const sym = currencySymbol(currency)
  const abs = Math.abs(value)
  let s: string
  if (abs >= 1_000_000) s = (abs / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1) + 'M'
  else if (abs >= 1000) s = Math.round(abs / 1000) + 'k'
  else s = String(Math.round(abs))
  return `${sym} ${s}`
}

export function percent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`
}

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']

/** "2026-06-05" -> "5 июня · четверг" / "Сегодня" / "Вчера" */
export function humanDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000)
  if (diff === 0) return `Сегодня · ${d.getDate()} ${MONTHS[d.getMonth()]}`
  if (diff === 1) return `Вчера · ${d.getDate()} ${MONTHS[d.getMonth()]}`
  return `${d.getDate()} ${MONTHS[d.getMonth()]} · ${WEEKDAYS[d.getDay()]}`
}

/** "2026-06-05" -> "05.06.2026" */
export function shortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('ru-RU')
}

export function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase()
}
