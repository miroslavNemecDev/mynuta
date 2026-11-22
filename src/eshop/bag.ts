// Taška: ručně přidané zboží a recepty. Recepty se přepočítávají na celá balení ze společné potřeby,
// takže dva recepty s vejci přidají jedno plato, ne dvě.
import { priceOf, productById, recipeById, type Recipe, type RecipeLine } from './catalog.ts'

export type RecipeEntry = { id: string; servings: number; excluded: string[]; swaps: Record<string, string> }
export type BagState = { manual: Record<string, number>; recipes: RecipeEntry[] }
export type BagLine = { id: string; qty: number; manual: number; recipeQty: number; fromRecipes: string[] }
export type ResolvedLine = {
  key: string
  productId: string
  need: number
  packages: number
  included: boolean
  staple: boolean
  label: string
  autoSwapped: boolean
  available: boolean
  options: string[]
}

export const emptyBag: BagState = { manual: {}, recipes: [] }

export function isBagState(value: unknown): value is BagState {
  if (!value || typeof value !== 'object') return false
  const bag = value as Partial<BagState>
  return typeof bag.manual === 'object' && bag.manual !== null && Array.isArray(bag.recipes)
}

export function defaultEntry(recipe: Recipe): RecipeEntry {
  return { id: recipe.id, servings: recipe.servings, excluded: recipe.lines.filter((line) => line.staple).map((line) => line.key), swaps: {} }
}

function inStock(id: string): boolean {
  return (productById.get(id)?.stock ?? 0) > 0
}

/** Vybraný produkt pro řádek receptu. Když hlavní došel, vezme první dostupnou náhradu. */
function chooseProduct(line: RecipeLine, entry: RecipeEntry): { productId: string; autoSwapped: boolean } {
  const swap = entry.swaps[line.key]
  if (swap && productById.has(swap)) return { productId: swap, autoSwapped: false }
  if (inStock(line.product)) return { productId: line.product, autoSwapped: false }
  const alternative = line.alternatives.find(inStock)
  return alternative ? { productId: alternative, autoSwapped: true } : { productId: line.product, autoSwapped: false }
}

/** „800 g“ pro 4 porce bude pro 6 porcí „1200 g“. Text bez čísla („podle chuti“) nechá být. */
function scaleLabel(label: string, factor: number): string {
  if (factor === 1) return label
  const match = label.match(/^(\d+(?:[.,]\d+)?)(.*)$/)
  if (!match) return label
  const value = Number(match[1].replace(',', '.')) * factor
  const rounded = value >= 100 ? Math.round(value / 10) * 10 : value >= 10 ? Math.round(value) : Math.round(value * 2) / 2
  return `${String(rounded).replace('.', ',')}${match[2]}`
}

export function resolveRecipe(recipe: Recipe, entry: RecipeEntry): ResolvedLine[] {
  const factor = entry.servings / recipe.servings
  return recipe.lines.map((line) => {
    const { productId, autoSwapped } = chooseProduct(line, entry)
    const product = productById.get(productId)
    const need = line.need * factor
    return {
      key: line.key,
      productId,
      need,
      packages: product ? Math.max(1, Math.ceil(need / product.pack.amount - 1e-9)) : 1,
      included: !entry.excluded.includes(line.key),
      staple: line.staple,
      label: scaleLabel(line.label, factor),
      autoSwapped,
      available: inStock(productId),
      options: [line.product, ...line.alternatives],
    }
  })
}

export function recipeTotal(lines: ResolvedLine[]): number {
  return lines.reduce((sum, line) => {
    const product = productById.get(line.productId)
    return line.included && line.available && product ? sum + priceOf(product) * line.packages : sum
  }, 0)
}

export function bagLines(bag: BagState): BagLine[] {
  const needs = new Map<string, { need: number; recipes: string[] }>()
  for (const entry of bag.recipes) {
    const recipe = recipeById.get(entry.id)
    if (!recipe) continue
    for (const line of resolveRecipe(recipe, entry)) {
      if (!line.included || !line.available) continue
      const current = needs.get(line.productId) ?? { need: 0, recipes: [] }
      current.need += line.need
      if (!current.recipes.includes(recipe.id)) current.recipes.push(recipe.id)
      needs.set(line.productId, current)
    }
  }
  const lines: BagLine[] = []
  for (const id of new Set([...Object.keys(bag.manual), ...needs.keys()])) {
    const product = productById.get(id)
    if (!product) continue
    const manual = Math.max(0, bag.manual[id] ?? 0)
    const fromRecipe = needs.get(id)
    const recipeQty = fromRecipe ? Math.max(1, Math.ceil(fromRecipe.need / product.pack.amount - 1e-9)) : 0
    if (manual + recipeQty > 0) lines.push({ id, qty: manual + recipeQty, manual, recipeQty, fromRecipes: fromRecipe?.recipes ?? [] })
  }
  return lines
}

export function bagTotals(lines: BagLine[]): { total: number; saved: number; count: number } {
  let total = 0
  let full = 0
  for (const line of lines) {
    const product = productById.get(line.id)
    if (!product) continue
    total += priceOf(product) * line.qty
    full += product.price * line.qty
  }
  return { total, saved: full - total, count: lines.length }
}
