// Text, čísla a data pro e-shop. Všechno česky a bez závislostí.

const COMBINING_MARKS = /[̀-ͯ]/g

/** Malá písmena bez diakritiky, jen písmena a číslice oddělené mezerou. */
export function normalize(value: string): string {
  return value
    .toLocaleLowerCase('cs')
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function slugify(value: string): string {
  return normalize(value).replace(/ /g, '-')
}

/** Česká typografie: nezlomitelná mezera za jednopísmennými předložkami a mezi číslem a jednotkou. */
export function nb(text: string): string {
  return text
    .replace(/(?<=^|[\s(„])([kKsSvVzZoOuUaAiI]) /g, '$1 ')
    .replace(/(\d) (kg|g|l|ml|ks|%)(?![a-zA-Z])/g, '$1 $2')
    .replace(/\b(e)-(mail|shop)/gi, '$1\u2011$2')
}

const priceFormat = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 })

export function formatPrice(amount: number): string {
  return priceFormat.format(Math.round(amount))
}

export function plural(count: number, one: string, few: string, many: string): string {
  if (count === 1) return one
  return count >= 2 && count <= 4 ? few : many
}

export function itemCount(count: number): string {
  return `${count} ${plural(count, 'položka', 'položky', 'položek')}`
}

/** FNV-1a, stabilní číslo z textu (pro ukázkové zásoby a barvy). */
export function hashString(value: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Jednoduchý generátor náhodných čísel se semínkem, aby ukázková data vycházela pokaždé stejně. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

const weekdayShort = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** „Dnes“, „Zítra“, jinak „Po 23. 11.“ */
export function dayLabel(date: Date, now: Date): string {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Dnes'
  if (diff === 1) return 'Zítra'
  return `${weekdayShort[target.getDay()]} ${target.getDate()}. ${target.getMonth() + 1}.`
}

export function timeLabel(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`
}
