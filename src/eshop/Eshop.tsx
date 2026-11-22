// Prototyp e-shopu Mynuty. Otevře se na ?prototyp=eshop, design vychází z landing page, telefon je první.
import './eshop.css'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { categoryById, productById, recipeById } from './catalog.ts'
import { bagLines, bagTotals, emptyBag, isBagState, resolveRecipe, type BagState, type RecipeEntry } from './bag.ts'
import { BagSheet, BottomBar, ProductSheet, SearchOverlay, SuggestionStrip, Toast } from './overlays.tsx'
import { CategoryPage, CheckoutPage, DonePage, HomePage, NotFoundPage, RecipePage, RecipesPage } from './pages.tsx'
import { Sheet, SiteHeader } from './components.tsx'
import { Footer, InfoContent, InfoPageView } from './info.tsx'
import { INFO_PAGES, infoById } from './infoPages.ts'
import { DesktopBag, DesktopNav } from './desktop.tsx'
import { isHistory, seedHistory, suggestFor, usualIds, type PastOrder } from './recommend.ts'
import { closeOverlay, goBack, lastNavigationType, navigate, useRoute } from './route.ts'
import { searchProducts, splitList } from './search.ts'
import { ShopContext, type AddOptions, type Shop } from './ShopContext.ts'
import { useStoredState } from './storage.ts'
import { itemCount } from './text.ts'

const STORAGE = 'mynuta-eshop-v1'
const PAGES_WITH_OWN_BAR = new Set(['recept', 'objednavka', 'hotovo'])

type Suggestion = { sourceId: string; ids: string[]; scrollY: number; pathKey: string }

export default function Eshop() {
  const route = useRoute()
  const [bag, setBag] = useStoredState<BagState>(`${STORAGE}-taska`, () => emptyBag, isBagState)
  const [history, setHistory] = useStoredState<PastOrder[]>(`${STORAGE}-historie`, () => seedHistory(Date.now()), isHistory)
  const [recentSearches, setRecentSearches] = useStoredState<string[]>(`${STORAGE}-hledani`, () => [], Array.isArray)
  const [toastState, setToastState] = useState<{ text: string; id: number } | null>(null)
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const lines = useMemo(() => bagLines(bag), [bag])
  const { total, saved } = useMemo(() => bagTotals(lines), [lines])
  const qtyById = useMemo(() => new Map(lines.map((line) => [line.id, line.qty])), [lines])
  const usual = useMemo(() => usualIds(history), [history])
  const overlayOpen = route.q !== null || route.s !== null
  const [first, second, third] = route.path
  const pathKey = route.path.join('/')
  const showBottomBar = !PAGES_WITH_OWN_BAR.has(first ?? '')

  const toast = useCallback((text: string) => setToastState({ text, id: Date.now() }), [])

  const add = useCallback((id: string, options: AddOptions = {}) => {
    const product = productById.get(id)
    if (!product) return
    const current = qtyById.get(id) ?? 0
    const amount = options.amount ?? 1
    if (current + amount > product.stock) {
      toast(product.stock > 0 ? `Víc kusů teď nemám, skladem je ${product.stock}` : 'Tohle teď nemám skladem')
      return
    }
    setBag((state) => ({ ...state, manual: { ...state.manual, [id]: (state.manual[id] ?? 0) + amount } }))
    if (options.suggest && current === 0 && route.q === null && route.s === null) {
      const ids = suggestFor(id, new Set([...qtyById.keys(), id]))
      setSuggestion(ids.length ? { sourceId: id, ids, scrollY: window.scrollY, pathKey: route.path.join('/') } : null)
    }
  }, [qtyById, route.q, route.s, route.path, setBag, toast])

  const decrement = useCallback((id: string) => {
    setBag((state) => {
      const manual = state.manual[id] ?? 0
      if (manual > 0) {
        const next = { ...state.manual }
        if (manual <= 1) delete next[id]
        else next[id] = manual - 1
        return { ...state, manual: next }
      }
      // Zboží jen z receptu: vynechat ho ve všech receptech v tašce.
      return {
        ...state,
        recipes: state.recipes.map((entry) => {
          const recipe = recipeById.get(entry.id)
          if (!recipe) return entry
          const keys = resolveRecipe(recipe, entry).filter((line) => line.productId === id).map((line) => line.key)
          return keys.length ? { ...entry, excluded: [...new Set([...entry.excluded, ...keys])] } : entry
        }),
      }
    })
  }, [setBag])

  const addMany = useCallback((items: Record<string, number>) => {
    setBag((state) => {
      const manual = { ...state.manual }
      for (const [id, amount] of Object.entries(items)) {
        const product = productById.get(id)
        if (!product) continue
        const room = product.stock - (qtyById.get(id) ?? 0)
        if (room > 0) manual[id] = (manual[id] ?? 0) + Math.min(amount, room)
      }
      return { ...state, manual }
    })
  }, [qtyById, setBag])

  const saveRecipe = useCallback((entry: RecipeEntry) => {
    setBag((state) => ({
      ...state,
      recipes: state.recipes.some((item) => item.id === entry.id)
        ? state.recipes.map((item) => item.id === entry.id ? entry : item)
        : [...state.recipes, entry],
    }))
  }, [setBag])

  const removeRecipe = useCallback((id: string) => {
    setBag((state) => ({ ...state, recipes: state.recipes.filter((entry) => entry.id !== id) }))
  }, [setBag])

  const repeatLast = useCallback(() => {
    const last = history[history.length - 1]
    if (!last) return
    const missing = Object.fromEntries(Object.entries(last.items).filter(([id]) => !qtyById.has(id) && (productById.get(id)?.stock ?? 0) > 0))
    const count = Object.keys(missing).length
    if (!count) {
      toast('Všechno z minulého nákupu už v tašce máš')
      return
    }
    addMany(missing)
    toast(`Z minulého nákupu jsem přidal ${itemCount(count)}`)
  }, [addMany, history, qtyById, toast])

  const placeOrder = useCallback((order: Omit<PastOrder, 'id' | 'createdAt'>) => {
    const id = `MN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    setHistory((current) => [...current, { ...order, id, createdAt: new Date().toISOString() }])
    setBag(emptyBag)
    setSuggestion(null)
    return id
  }, [setBag, setHistory])

  const rememberSearch = useCallback((query: string) => {
    const term = query.trim()
    if (term.length < 2) return
    setRecentSearches((current) => [term, ...current.filter((item) => item !== term)].slice(0, 6))
  }, [setRecentSearches])

  const openSearch = useCallback(() => {
    // Zaměřit pole hned při ťuknutí, jinak iOS neotevře klávesnici.
    const input = searchInputRef.current
    if (input) {
      input.closest('.es-search')?.removeAttribute('aria-hidden')
      input.focus({ preventScroll: true })
    }
    setSuggestion(null)
    if (route.q === null) navigate({ ...route, q: '', s: null }, { overlay: true })
  }, [route])

  const openSheet = useCallback((sheet: string) => {
    setSuggestion(null)
    navigate({ ...route, s: sheet }, { overlay: true })
  }, [route])

  const shop = useMemo<Shop>(() => ({
    route,
    bag,
    lines,
    total,
    saved,
    history,
    usual,
    qty: (id) => qtyById.get(id) ?? 0,
    add,
    decrement,
    addMany,
    saveRecipe,
    removeRecipe,
    repeatLast,
    placeOrder,
    go: (path, options) => navigate({ path, q: null, s: null }, { replace: options?.replace }),
    back: (fallback) => goBack({ path: fallback, q: null, s: null }),
    openSheet,
    openProduct: (id) => openSheet(`p:${id}`),
    closeOverlay: () => closeOverlay(route),
    openSearch,
    setQuery: (query) => navigate({ ...route, q: query }, { replace: true }),
    recentSearches,
    rememberSearch,
    toast,
  }), [route, bag, lines, total, saved, history, usual, qtyById, add, decrement, addMany, saveRecipe, removeRecipe, repeatLast, placeOrder, openSheet, openSearch, recentSearches, rememberSearch, toast])

  // Stránka v barvách landing page, vlastní obnovení scrollu.
  useEffect(() => {
    const html = document.documentElement
    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const previous = { title: document.title, background: html.style.background, theme: theme?.content }
    document.title = 'Mynuta · e-shop (prototyp)'
    html.style.background = '#f7f5ed'
    if (theme) theme.content = '#f7f5ed'
    window.history.scrollRestoration = 'manual'
    return () => {
      document.title = previous.title
      html.style.background = previous.background
      if (theme && previous.theme) theme.content = previous.theme
    }
  }, [])

  // Pod otevřeným hledáním a panelem se stránka nescrolluje.
  useEffect(() => {
    document.documentElement.classList.toggle('es-locked', overlayOpen)
  }, [overlayOpen])

  // Zpět vrátí stránku na místo, kde byla. Nová stránka začíná nahoře.
  const scrollMemory = useRef(new Map<string, number>())
  const pathKeyRef = useRef(pathKey)
  const overlayRef = useRef(overlayOpen)
  useEffect(() => {
    overlayRef.current = overlayOpen
  }, [overlayOpen])
  useEffect(() => {
    const remember = () => {
      if (!overlayRef.current) scrollMemory.current.set(pathKeyRef.current, window.scrollY)
    }
    window.addEventListener('scroll', remember, { passive: true })
    return () => window.removeEventListener('scroll', remember)
  }, [])
  useLayoutEffect(() => {
    pathKeyRef.current = pathKey
    window.scrollTo(0, lastNavigationType() === 'pop' ? scrollMemory.current.get(pathKey) ?? 0 : 0)
  }, [pathKey])

  // Proužek s návrhy zmizí, když se pokračuje ve scrollování.
  useEffect(() => {
    if (!suggestion) return
    const hide = () => {
      if (Math.abs(window.scrollY - suggestion.scrollY) > 160) setSuggestion(null)
    }
    window.addEventListener('scroll', hide, { passive: true })
    return () => window.removeEventListener('scroll', hide)
  }, [suggestion])

  useEffect(() => {
    if (!toastState) return
    const timer = window.setTimeout(() => setToastState(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toastState])

  // Po zavření hledání schovat klávesnici a zapamatovat si hledaný text, pokud něco našel.
  const lastQuery = useRef<string | null>(null)
  useEffect(() => {
    if (route.q === null) {
      searchInputRef.current?.blur()
      const previous = lastQuery.current?.trim()
      if (previous && !splitList(previous) && searchProducts(previous).length) rememberSearch(previous)
    }
    lastQuery.current = route.q
  }, [route.q, rememberSearch])

  const category = first === 'k' && second ? categoryById.get(second) : undefined
  const recipe = first === 'recept' && second ? recipeById.get(second) : undefined
  let content: ReactNode
  if (!first) content = <HomePage />
  else if (category) content = <CategoryPage key={category.id} category={category} subId={third} />
  else if (first === 'recepty') content = <RecipesPage />
  else if (recipe) content = <RecipePage key={recipe.id} recipe={recipe} />
  else if (first === 'objednavka') {
    content = lines.length ? <CheckoutPage /> : (
      <main className="es-main es-done">
        <h1>Taška je prázdná.</h1>
        <p className="es-intro">Objednávka už je odeslaná, nebo v tašce ještě nic není.</p>
        <button type="button" className="es-cta" onClick={() => navigate({ path: [], q: null, s: null }, { replace: true })}>Na úvod e-shopu</button>
      </main>
    )
  } else if (first === 'hotovo' && second) content = <DonePage orderId={second} />
  else if (first === 'info' && second && infoById.has(second)) content = <InfoPageView key={second} page={infoById.get(second) ?? INFO_PAGES[0]} />
  else content = <NotFoundPage />

  const productSheet = route.s?.startsWith('p:') ? route.s.slice(2) : null
  // Podmínky otevřené z objednávky jako panel, aby se neztratil rozpracovaný formulář.
  const infoSheet = route.s?.startsWith('info:') ? infoById.get(route.s.slice(5)) : undefined
  // Šipka zpět na počítači: kam vede, když stránka nebyla otevřená z e-shopu.
  const backTarget = !first ? null : category && third ? ['k', category.id] : first === 'recept' ? ['recepty'] : []

  return (
    <ShopContext.Provider value={shop}>
      <div className={`es${showBottomBar ? ' has-bottombar' : ''}${category ? ' has-chipbar' : ''}`}>
        <SiteHeader onBack={backTarget ? () => goBack({ path: backTarget, q: null, s: null }) : undefined} />
        <div className="es-layout">
          <DesktopNav category={category} subId={third} page={first ?? ''} />
          <div className="es-page">{content}</div>
          {first !== 'hotovo' && <DesktopBag checkout={first === 'objednavka'} />}
        </div>
        {first !== 'objednavka' && <Footer />}
        {showBottomBar && <BottomBar category={category} subId={third} />}
        {showBottomBar && suggestion && suggestion.pathKey === pathKey && !overlayOpen && (
          <SuggestionStrip key={suggestion.sourceId} sourceId={suggestion.sourceId} ids={suggestion.ids} onClose={() => setSuggestion(null)} />
        )}
        <SearchOverlay inputRef={searchInputRef} />
        {route.s === 'taska' && <BagSheet />}
        {productSheet && <ProductSheet key={productSheet} id={productSheet} />}
        {infoSheet && <Sheet title={infoSheet.title} onClose={shop.closeOverlay}><InfoContent page={infoSheet} /></Sheet>}
        {toastState && <Toast key={toastState.id} message={toastState.text} />}
      </div>
    </ShopContext.Provider>
  )
}
