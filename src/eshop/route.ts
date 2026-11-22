// Adresa každé obrazovky je v hashi (#/k/pecivo/chleby), takže funguje tlačítko i gesto zpět
// a odkaz jde poslat. Hledání (?q=) a spodní panely (?s=) jsou vrstvy nad stránkou: zpět je zavře.
import { useMemo, useSyncExternalStore } from 'react'

export type Route = { path: string[]; q: string | null; s: string | null }
type HistoryFlags = { inApp?: boolean; overlay?: boolean }

const listeners = new Set<() => void>()
let lastNavigation: 'push' | 'replace' | 'pop' = 'pop'

function notify() {
  for (const listener of listeners) listener()
}

window.addEventListener('popstate', () => {
  lastNavigation = 'pop'
  notify()
})
window.addEventListener('hashchange', () => {
  lastNavigation = 'pop'
  notify()
})

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function parseHash(hash: string): Route {
  const [pathPart, queryPart = ''] = hash.replace(/^#/, '').split('?')
  const params = new URLSearchParams(queryPart)
  return {
    path: pathPart.split('/').filter(Boolean).map((segment) => decodeURIComponent(segment)),
    q: params.has('q') ? params.get('q') ?? '' : null,
    s: params.get('s'),
  }
}

export function buildHash(route: Route): string {
  const params = new URLSearchParams()
  if (route.q !== null) params.set('q', route.q)
  if (route.s) params.set('s', route.s)
  const query = params.toString()
  return `#/${route.path.map((segment) => encodeURIComponent(segment)).join('/')}${query ? `?${query}` : ''}`
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return useMemo(() => parseHash(hash), [hash])
}

export function lastNavigationType() {
  return lastNavigation
}

function currentFlags(): HistoryFlags {
  const state: unknown = window.history.state
  return state && typeof state === 'object' ? state as HistoryFlags : {}
}

/** Nová položka v historii, nebo přepsání aktuální (psaní do hledání, přepínání podkategorií). */
export function navigate(route: Route, options: { replace?: boolean; overlay?: boolean } = {}) {
  const hash = buildHash(route)
  if (options.replace) {
    window.history.replaceState(currentFlags(), '', hash)
    lastNavigation = 'replace'
  } else {
    window.history.pushState({ inApp: true, overlay: options.overlay ?? false } satisfies HistoryFlags, '', hash)
    lastNavigation = 'push'
  }
  notify()
}

/** Zpět v historii, pokud jsme sem přišli z e-shopu. Jinak (otevřený odkaz) na nadřazenou stránku. */
export function goBack(fallback: Route) {
  if (currentFlags().inApp) window.history.back()
  else navigate(fallback, { replace: true })
}

/** Zavře hledání nebo spodní panel. */
export function closeOverlay(route: Route) {
  if (currentFlags().overlay) window.history.back()
  else navigate({ ...route, q: null, s: null }, { replace: true })
}
