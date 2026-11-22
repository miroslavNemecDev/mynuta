import { createContext, useContext } from 'react'
import type { BagLine, BagState, RecipeEntry } from './bag.ts'
import type { PastOrder } from './recommend.ts'
import type { Route } from './route.ts'

export type AddOptions = { amount?: number; suggest?: boolean }

export type Shop = {
  route: Route
  bag: BagState
  lines: BagLine[]
  total: number
  saved: number
  history: PastOrder[]
  usual: string[]
  qty: (id: string) => number
  add: (id: string, options?: AddOptions) => void
  decrement: (id: string) => void
  addMany: (items: Record<string, number>) => void
  saveRecipe: (entry: RecipeEntry) => void
  removeRecipe: (id: string) => void
  repeatLast: () => void
  placeOrder: (order: Omit<PastOrder, 'id' | 'createdAt'>) => string
  go: (path: string[], options?: { replace?: boolean }) => void
  back: (fallback: string[]) => void
  openSheet: (sheet: string) => void
  openProduct: (id: string) => void
  closeOverlay: () => void
  openSearch: () => void
  setQuery: (query: string) => void
  recentSearches: string[]
  rememberSearch: (query: string) => void
  toast: (message: string) => void
}

export const ShopContext = createContext<Shop | null>(null)

export function useShop(): Shop {
  const shop = useContext(ShopContext)
  if (!shop) throw new Error('useShop je potřeba použít uvnitř ShopContext')
  return shop
}
