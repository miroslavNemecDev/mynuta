// Řazení a filtry v kategoriích. Vlastnosti (bez lepku, bio…) se zatím poznají z názvu,
// ve skutečném katalogu budou jako pole u produktu.
import { priceOf, productById, type Product } from './catalog.ts'
import { popularIds } from './recommend.ts'

export type SortMode = 'az' | 'oblibene' | 'cena' | 'jednotkova'

export const SORT_OPTIONS: { id: SortMode; label: string; short: string }[] = [
  { id: 'az', label: 'Abecedně A–Z', short: 'A–Z' },
  { id: 'oblibene', label: 'Nejoblíbenější', short: 'Oblíbené' },
  { id: 'cena', label: 'Od nejlevnějšího', short: 'Nejlevnější' },
  { id: 'jednotkova', label: 'Podle ceny za kg nebo litr', short: 'Cena za kg' },
]

export function isSortMode(value: unknown): boolean {
  return SORT_OPTIONS.some((option) => option.id === value)
}

export type Tag = { id: string; label: string; test: (product: Product) => boolean }

export const TAGS: Tag[] = [
  { id: 'bez-lepku', label: 'Bez lepku', test: (product) => /bez lepku|bezlepkov/i.test(product.name) },
  { id: 'bez-laktozy', label: 'Bez laktózy', test: (product) => /bez laktózy/i.test(product.name) },
  { id: 'bio', label: 'Bio', test: (product) => /(^|\s)bio(\s|$)/i.test(product.name) },
  { id: 'celozrnne', label: 'Celozrnné', test: (product) => /celozrnn|grahamov|špaldov/i.test(product.name) },
  { id: 'bez-cukru', label: 'Bez cukru', test: (product) => /bez cukru/i.test(product.name) },
  { id: 'z-ceska', label: 'Z Česka', test: (product) => /z Česka|z Moravy|z Pošumaví|z jižních Čech|z Domažlic|z Klatov|z místní farmy|od sousedů|z farmy|farmářsk|z pekárny|ze Slunečné/i.test(product.name) },
  { id: 'v-akci', label: 'V akci', test: (product) => product.discount > 0 },
]

export function matchesTags(product: Product, tags: string[]): boolean {
  return tags.every((id) => TAGS.find((tag) => tag.id === id)?.test(product) ?? true)
}

/** Cena za kg, litr nebo kus. U zboží po jednom kuse vrací null, tam je cena za kus přímo cena. */
export function unitPrice(product: Product): { value: number; per: string } | null {
  const { amount, base } = product.pack
  const price = priceOf(product)
  if (base === 'g') return { value: price / amount * 1000, per: 'kg' }
  if (base === 'ml') return { value: price / amount * 1000, per: 'l' }
  return amount > 1 ? { value: price / amount, per: 'ks' } : null
}

const unitFormat = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 })

export function unitPriceLabel(product: Product): string | null {
  const unit = unitPrice(product)
  if (!unit) return null
  const value = unit.value >= 100 ? Math.round(unit.value) : unit.value
  return `${unitFormat.format(value)} Kč/${unit.per}`
}

const collator = new Intl.Collator('cs')
const popularity = new Map(popularIds.map((id, index) => [id, index]))

export function sortIds(ids: string[], mode: SortMode): string[] {
  const items = ids.flatMap((id, index) => {
    const product = productById.get(id)
    return product ? [{ id, index, product }] : []
  })
  const compare: Record<SortMode, (first: typeof items[number], second: typeof items[number]) => number> = {
    az: (first, second) => collator.compare(first.product.name, second.product.name),
    oblibene: (first, second) => (popularity.get(first.id) ?? Infinity) - (popularity.get(second.id) ?? Infinity) || first.index - second.index,
    cena: (first, second) => priceOf(first.product) - priceOf(second.product),
    jednotkova: (first, second) => (unitPrice(first.product)?.value ?? priceOf(first.product)) - (unitPrice(second.product)?.value ?? priceOf(second.product)),
  }
  return items.sort(compare[mode]).map((item) => item.id)
}
