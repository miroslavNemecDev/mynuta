// Doporučení: „K tomu lidé berou“ ze společných nákupů ostatních a „Tvoje obvyklé“ z vlastní historie.
// Objednávky ostatních jsou v prototypu vygenerované z typických nákupů. Po spuštění je nahradí skutečné.
import { idOf, productById } from './catalog.ts'
import { seededRandom } from './text.ts'

export type PastOrder = {
  id: string
  createdAt: string
  items: Record<string, number>
  total?: number
  pickup?: string
  name?: string
  payment?: 'online' | 'na-miste'
}

export function isHistory(value: unknown): boolean {
  return Array.isArray(value) && value.every((order) => order && typeof order === 'object' && typeof (order as PastOrder).items === 'object')
}

const BASKETS: { weight: number; items: string[] }[] = [
  { weight: 9, items: ['Rohlíky', 'Máslo', 'Šunka výběrová', 'Eidam 30 % plátky', 'Mléko polotučné', 'Bílý jogurt', 'Jahodový džem', 'Banány'] },
  { weight: 7, items: ['Kváskový chléb', 'Máslo', 'Pomazánkové máslo', 'Vejce M', 'Šunka dušená', 'Rajčata cherry'] },
  { weight: 4, items: ['Hovězí kližka', 'Cibule žlutá', 'Paprika sladká mletá', 'Chléb Šumava', 'Pivo ležák', 'Kmín celý', 'Česnek'] },
  { weight: 6, items: ['Špagety', 'Passata', 'Parmazán', 'Česnek', 'Olivový olej extra panenský', 'Bazalka sušená', 'Víno červené suché'] },
  { weight: 4, items: ['Vepřová krkovice', 'Klobása farmářská', 'Špekáčky', 'Hořčice plnotučná', 'Kečup', 'Pivo ležák balení', 'Chléb Šumava', 'Okurka salátová'] },
  { weight: 5, items: ['Bílý jogurt řecký', 'Granola', 'Borůvky', 'Banány', 'Ovesné vločky jemné', 'Med květový', 'Ovesný nápoj', 'Avokádo'] },
  { weight: 6, items: ['Toustový chléb', 'Šunka dušená', 'Gouda plátky', 'Jablka Gala', 'Mandarinky', 'Jogurt jahodový', 'Rohlík', 'Voda neperlivá'] },
  { weight: 3, items: ['Mouka polohrubá', 'Cukr krystal', 'Máslo', 'Vejce M', 'Prášek do pečiva', 'Vanilkový cukr', 'Mléko polotučné', 'Kakao'] },
  { weight: 5, items: ['Kuřecí prsa', 'Rýže jasmínová', 'Brokolice', 'Smetana na vaření 12 %', 'Cibule žlutá', 'Česnek'] },
  { weight: 4, items: ['Ledový salát', 'Rajčata cherry', 'Okurka salátová', 'Paprika červená', 'Balkánský sýr', 'Olivový olej extra panenský', 'Bageta'] },
  { weight: 4, items: ['Chipsy solené', 'Pivo ležák', 'Tyčinky slané', 'Pizza Margherita', 'Kola'] },
  { weight: 3, items: ['Hranolky', 'Rybí prsty', 'Hrášek', 'Zmrzlina vanilková', 'Pizza šunková'] },
  { weight: 3, items: ['Káva zrnková', 'Mléko plnotučné', 'Máslový croissant', 'Hořká čokoláda 70 %'] },
  { weight: 3, items: ['Vejce L z volného chovu', 'Pažitka', 'Máslo', 'Kváskový chléb', 'Rajčata cherry', 'Slanina anglická'] },
  { weight: 3, items: ['Brambory konzumní', 'Vejce M', 'Mouka hladká', 'Česnek', 'Majoránka', 'Olej slunečnicový', 'Zakysaná smetana'] },
  { weight: 7, items: ['Mléko polotučné', 'Rohlíky', 'Banány', 'Jablka Golden Delicious', 'Vejce M', 'Máslo', 'Kuřecí stehna', 'Brambory konzumní', 'Toustový chléb', 'Jogurt vanilkový'] },
]

const EVERYDAY = ['Rohlík', 'Mléko polotučné', 'Banány', 'Máslo', 'Rohlíky', 'Vejce M', 'Voda neperlivá', 'Jablka Gala', 'Chléb Šumava', 'Bílý jogurt']

// Ručně zadané páry pro začátek, kdy ještě nejsou skutečné objednávky. Mají menší váhu než data.
const MANUAL_PAIRS: [string, string][] = [
  ['Kváskový chléb', 'Máslo farmářské'],
  ['Špagety', 'Pesto bazalkové'],
  ['Mléko polotučné', 'Ovesné vločky jemné'],
  ['Hovězí kližka', 'Chléb Šumava'],
  ['Káva zrnková', 'Smetana ke šlehání 31 %'],
]

type CoPurchase = { count: Map<string, number>; pair: Map<string, Map<string, number>> }

function addPair(stats: CoPurchase, first: string, second: string, amount: number) {
  const row = stats.pair.get(first) ?? new Map<string, number>()
  row.set(second, (row.get(second) ?? 0) + amount)
  stats.pair.set(first, row)
}

function buildCoPurchase(): CoPurchase {
  const random = seededRandom(2027)
  const stats: CoPurchase = { count: new Map(), pair: new Map() }
  const baskets = BASKETS.map((basket) => ({ weight: basket.weight, ids: basket.items.flatMap((name) => idOf(name) ?? []) }))
  const everyday = EVERYDAY.flatMap((name) => idOf(name) ?? [])
  const totalWeight = baskets.reduce((sum, basket) => sum + basket.weight, 0)

  for (let order = 0; order < 700; order += 1) {
    let pick = random() * totalWeight
    const basket = baskets.find((candidate) => (pick -= candidate.weight) < 0) ?? baskets[0]
    const items = new Set(basket.ids.filter(() => random() < 0.7))
    for (const id of everyday) if (random() < 0.12) items.add(id)
    const list = [...items]
    for (const id of list) stats.count.set(id, (stats.count.get(id) ?? 0) + 1)
    for (const first of list) for (const second of list) if (first !== second) addPair(stats, first, second, 1)
  }

  for (const [firstName, secondName] of MANUAL_PAIRS) {
    const first = idOf(firstName)
    const second = idOf(secondName)
    if (!first || !second) continue
    addPair(stats, first, second, 8)
    addPair(stats, second, first, 8)
    for (const id of [first, second]) stats.count.set(id, Math.max(stats.count.get(id) ?? 0, 8))
  }
  return stats
}

const coPurchase = buildCoPurchase()

/**
 * Položky, které lidé kupují spolu s produktem. Skóre je kosinová podobnost, takže všudypřítomné
 * zboží (rohlíky) nepřebije všechno ostatní. Náhrady ze stejné podkategorie vynechává.
 */
export function suggestFor(productId: string, exclude: Set<string>, limit = 3): string[] {
  const product = productById.get(productId)
  const row = coPurchase.pair.get(productId)
  if (!product || !row) return []
  const own = coPurchase.count.get(productId) ?? 1
  return [...row.entries()]
    .map(([id, together]) => ({ id, score: together / Math.sqrt(own * (coPurchase.count.get(id) ?? 1)) }))
    .filter(({ id }) => {
      const candidate = productById.get(id)
      return candidate && candidate.stock > 0 && candidate.subId !== product.subId && !exclude.has(id)
    })
    .sort((first, second) => second.score - first.score)
    .slice(0, limit)
    .map(({ id }) => id)
}

/** Nejprodávanější zboží (z objednávek ostatních). */
export const popularIds: string[] = [...coPurchase.count.entries()]
  .sort((first, second) => second[1] - first[1])
  .map(([id]) => id)
  .filter((id) => (productById.get(id)?.stock ?? 0) > 0)

/** Hledaný výraz ze jména zboží: „mléko“ z „Mléko polotučné“, ale „bílý jogurt“ z „Bílý jogurt“. */
function searchTermOf(name: string): string {
  const words = name.toLocaleLowerCase('cs').split(' ')
  const startsWithAdjective = /[ýáéí]$/.test(words[0]) && words.length > 1
  return startsWithAdjective ? `${words[0]} ${words[1]}` : words[0]
}

/** „Často hledané“: výrazy z nejprodávanějšího zboží, bez opakování. */
export const popularSearches: string[] = [...new Set(popularIds.map((id) => searchTermOf(productById.get(id)?.name ?? '')))]
  .filter((term) => term.length > 2)
  .slice(0, 8)

// Ukázková historie zákazníka (pět posledních nákupů). Nové objednávky z prototypu se přidávají za ni.
const SEED_HISTORY: { days: number; items: [string, number][] }[] = [
  { days: 34, items: [['Mléko polotučné', 2], ['Rohlíky', 1], ['Banány', 1], ['Máslo', 1], ['Bílý jogurt', 4], ['Šunka výběrová', 2], ['Eidam 30 % plátky', 1], ['Kváskový chléb', 1]] },
  { days: 27, items: [['Mléko polotučné', 2], ['Rohlík', 6], ['Banány', 1], ['Vejce M', 1], ['Rajčata cherry', 1], ['Okurka salátová', 1], ['Káva mletá', 1]] },
  { days: 20, items: [['Mléko polotučné', 1], ['Kváskový chléb', 1], ['Máslo', 1], ['Bílý jogurt', 4], ['Banány', 1], ['Jablka Gala', 1], ['Pivo ležák', 4]] },
  { days: 13, items: [['Mléko polotučné', 2], ['Rohlíky', 1], ['Šunka výběrová', 2], ['Eidam 30 % plátky', 1], ['Rajčata cherry', 1], ['Kuřecí prsa', 1], ['Rýže jasmínová', 1]] },
  { days: 6, items: [['Mléko polotučné', 2], ['Rohlík', 6], ['Banány', 1], ['Bílý jogurt', 4], ['Vejce M', 1], ['Kváskový chléb', 1], ['Hořká čokoláda 70 %', 1]] },
]

export function seedHistory(now: number): PastOrder[] {
  return SEED_HISTORY.map((order, index) => ({
    id: `UKAZKA-${index + 1}`,
    createdAt: new Date(now - order.days * 86400000).toISOString(),
    items: Object.fromEntries(order.items.flatMap(([name, quantity]) => {
      const id = idOf(name)
      return id ? [[id, quantity]] : []
    })),
  }))
}

/** Zboží aspoň ze dvou z posledních pěti nákupů, od nejčastějšího. */
export function usualIds(history: PastOrder[]): string[] {
  const recent = history.slice(-5)
  const seen = new Map<string, { count: number; last: number }>()
  recent.forEach((order, index) => {
    for (const id of Object.keys(order.items)) {
      const entry = seen.get(id) ?? { count: 0, last: 0 }
      seen.set(id, { count: entry.count + 1, last: index })
    }
  })
  return [...seen.entries()]
    .filter(([id, entry]) => entry.count >= 2 && productById.has(id))
    .sort((first, second) => second[1].count - first[1].count || second[1].last - first[1].last)
    .map(([id]) => id)
}
