// Hledání: okamžité, bez diakritiky, toleruje české koncovky a pár hovorových slov.
// Zboží má vždycky přednost, recepty se hledají zvlášť a zobrazují se až pod ním.
import { categoryById, productById, products, recipes, subById, type Product, type Recipe } from './catalog.ts'
import { popularIds } from './recommend.ts'
import { normalize } from './text.ts'

const STOP_WORDS = new Set(['a', 'i', 's', 'se', 'na', 'do', 'z', 'ze', 'k', 'ke', 'v', 've', 'pro', 'bez', 'o', 'u', 'po'])

// Hovorové a nepravidelné tvary. Pravidelné koncovky (rohlíky, jablko) řeší porovnání začátků slov.
const SYNONYMS: Record<string, string[]> = {
  chleba: ['chleb'], chlebik: ['chleb'], chlebicek: ['chleb'],
  mliko: ['mleko'], mlicko: ['mleko'], mleka: ['mleko'],
  vajicka: ['vejce'], vajicko: ['vejce'], vajec: ['vejce'], vajic: ['vejce'], vajca: ['vejce'],
  rohlicek: ['rohlik'], rohlicky: ['rohlik'],
  mrkvicka: ['mrkev'], mrkve: ['mrkev'],
  cibulka: ['cibule'], rajce: ['rajcata'], rajcat: ['rajcata'],
  kafe: ['kava'], kaficko: ['kava'], kavu: ['kava'],
  cola: ['kola'], coca: ['kola'],
  pivko: ['pivo'], piva: ['pivo'], vina: ['vino'],
  limca: ['limonada'], zmrzka: ['zmrzlina'],
  spageti: ['spagety'], spagetove: ['spagety'],
  kure: ['kureci'], kurete: ['kureci'], kuretem: ['kureci'],
  vepro: ['veprova'], veprove: ['veprova'],
  sunku: ['sunka'], salamu: ['salam'], syrem: ['syr'],
}

type IndexEntry = { id: string; name: string[]; extra: string[]; popularity: number }

const popularityRank = new Map(popularIds.map((id, index) => [id, 1 - index / popularIds.length]))

const productIndex: IndexEntry[] = products.map((product) => ({
  id: product.id,
  name: normalize(product.name).split(' '),
  extra: normalize(`${categoryById.get(product.categoryId)?.name ?? ''} ${subById.get(product.subId)?.name ?? ''}`).split(' ').filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  popularity: popularityRank.get(product.id) ?? 0,
}))

function tokenScore(query: string, token: string): number {
  if (token === query) return 3
  if (query.length >= 2 && token.startsWith(query)) return 2
  if (token.length >= 4 && query.startsWith(token)) return 1.5
  const shorter = Math.min(query.length, token.length)
  if (shorter >= 5) {
    let common = 0
    while (common < shorter && query[common] === token[common]) common += 1
    if (common >= 4 && common >= shorter - 2) return 1
  }
  return 0
}

export function queryTokens(query: string): string[] {
  return normalize(query).split(' ').filter((token) => token && !STOP_WORDS.has(token) && !/^\d+$/.test(token))
}

function bestScore(variants: string[], tokens: string[], weight: number): number {
  let best = 0
  for (const variant of variants) for (const token of tokens) best = Math.max(best, tokenScore(variant, token) * weight)
  return best
}

function scoreEntry(entry: IndexEntry, tokens: string[], useGroups: boolean): number {
  let total = 0
  tokens.forEach((token, position) => {
    if (total < 0) return
    const variants = [token, ...(SYNONYMS[token] ?? [])]
    const inName = bestScore(variants, entry.name, 1)
    const best = useGroups ? Math.max(inName, bestScore(variants, entry.extra, 0.6)) : inName
    if (best === 0) {
      total = -1
      return
    }
    total += best
    if (position === 0 && bestScore(variants, entry.name.slice(0, 1), 1) >= 2) total += 0.5
  })
  return total < 0 ? 0 : total + entry.popularity * 0.3
}

function soldOutLast(ids: string[]): string[] {
  return [...ids].sort((first, second) => Number((productById.get(first)?.stock ?? 0) <= 0) - Number((productById.get(second)?.stock ?? 0) <= 0))
}

/**
 * Zboží podle hledaného textu. Nejdřív se hledá jen v názvech a slabé shody (salám u „salát“) se zahodí.
 * Názvy kategorií pomůžou, jen když názvy skoro nic nenajdou: „sýr“ ukáže všechny sýry,
 * ale „vejce“ neukáže celé „Mléčné a vejce“.
 */
export function searchProducts(query: string): string[] {
  const tokens = queryTokens(query)
  if (!tokens.length) return []
  const byName = productIndex
    .map((entry) => ({ id: entry.id, score: scoreEntry(entry, tokens, false) }))
    .filter((entry) => entry.score > 0)
  const top = Math.max(0, ...byName.map((entry) => entry.score))
  const strong = byName
    .filter((entry) => entry.score >= top * 0.5)
    .sort((first, second) => second.score - first.score)
    .map((entry) => entry.id)
  const found = new Set(strong)
  // „sýr“ → podkategorie Sýry, „maso“ → kategorie Maso a uzeniny: celá skupina se přidá pod přesné shody.
  // Rozhoduje první slovo názvu skupiny, takže „vejce“ nepřitáhne celé „Máslo, tvaroh a vejce“.
  if (tokens.length === 1) {
    const variants = [tokens[0], ...(SYNONYMS[tokens[0]] ?? [])]
    const headMatches = (name: string) => bestScore(variants, normalize(name).split(' ').slice(0, 1), 1) >= 2
    const groupIds = products
      .filter((product) => !found.has(product.id) && (headMatches(subById.get(product.subId)?.name ?? '') || headMatches(categoryById.get(product.categoryId)?.name ?? '')))
      .map((product) => product.id)
    if (groupIds.length) return soldOutLast([...strong, ...groupIds])
  }
  if (strong.length >= 3) return soldOutLast(strong)
  const byGroup = productIndex
    .filter((entry) => !found.has(entry.id))
    .map((entry) => ({
      id: entry.id,
      score: scoreEntry(entry, tokens, true),
      inName: tokens.some((token) => bestScore([token, ...(SYNONYMS[token] ?? [])], entry.name, 1) > 0),
    }))
    .filter((entry) => entry.score > 0)
  // U víceslovného hledání („hovězí maso“) musí aspoň jedno slovo sedět na název, jinak by přišlo i vepřové.
  const anyInName = tokens.length > 1 && byGroup.some((entry) => entry.inName)
  const groupIds = byGroup
    .filter((entry) => !anyInName || entry.inName)
    .sort((first, second) => second.score - first.score)
    .map((entry) => entry.id)
  return soldOutLast([...strong, ...groupIds])
}

const recipeIndex = recipes.map((recipe) => ({
  recipe,
  name: normalize(recipe.name).split(' '),
  ingredients: recipe.lines.flatMap((line) => normalize(productById.get(line.product)?.name ?? '').split(' ')),
}))

/** Recepty podle názvu nebo suroviny. Slovo „recept“ najde všechny. */
export function searchRecipes(query: string): Recipe[] {
  const tokens = queryTokens(query)
  if (!tokens.length) return []
  return recipeIndex
    .map(({ recipe, name, ingredients }) => {
      let total = 0
      for (const token of tokens) {
        const variants = [token, ...(SYNONYMS[token] ?? [])]
        const best = /^recept/.test(token) ? 1 : Math.max(bestScore(variants, name, 1), bestScore(variants, ingredients, 0.7))
        if (best === 0) return { recipe, score: 0 }
        total += best
      }
      return { recipe, score: total }
    })
    .filter((entry) => entry.score > 0)
    .sort((first, second) => second.score - first.score)
    .map((entry) => entry.recipe)
}

// Nákupní seznam v hledání: „mléko, rohlíky 6, 10 vajec“
export type ListLine = { text: string; packages: number; productId: string | null; alternatives: string[] }

export function splitList(query: string): string[] | null {
  const parts = query.split(/[,;\n]+/).map((part) => part.trim()).filter(Boolean)
  return parts.length >= 2 ? parts : null
}

const AMOUNT_BEFORE = /^(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|ks|x|×)?\s+(.+)$/i
const AMOUNT_AFTER = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|ks|x|×)?$/i

function packagesFor(product: Product, amount: number, unit: string | undefined): number {
  const lower = unit?.toLowerCase()
  if (lower === 'x' || lower === '×') return Math.max(1, Math.round(amount))
  if (lower === 'kg' || lower === 'g' || lower === 'l' || lower === 'ml') {
    const base = lower === 'kg' || lower === 'l' ? amount * 1000 : amount
    const baseUnit = lower === 'kg' || lower === 'g' ? 'g' : 'ml'
    return product.pack.base === baseUnit ? Math.max(1, Math.ceil(base / product.pack.amount - 1e-9)) : 1
  }
  if (product.pack.base === 'ks' && product.pack.amount > 1) return Math.max(1, Math.ceil(amount / product.pack.amount - 1e-9))
  return Math.max(1, Math.round(amount))
}

/** Jedna položka seznamu: nejlepší shoda, přednostně zboží, které zákazník obvykle kupuje. */
export function resolveListPart(text: string, usual: Set<string>): ListLine {
  const before = text.match(AMOUNT_BEFORE)
  const after = before ? null : text.match(AMOUNT_AFTER)
  const amount = Number((before?.[1] ?? after?.[2] ?? '1').replace(',', '.'))
  const unit = before?.[2] ?? after?.[3]
  const term = before?.[3] ?? after?.[1] ?? text
  const results = searchProducts(term).filter((id) => (productById.get(id)?.stock ?? 0) > 0)
  const preferred = results.slice(0, 6).find((id) => usual.has(id)) ?? results[0] ?? null
  const product = preferred ? productById.get(preferred) : undefined
  return {
    text,
    packages: product ? packagesFor(product, amount, unit) : 1,
    productId: preferred,
    alternatives: results.filter((id) => id !== preferred).slice(0, 3),
  }
}
