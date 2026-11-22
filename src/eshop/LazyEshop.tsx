import { Suspense, lazy } from 'react'

const Eshop = lazy(() => import('./Eshop.tsx'))

/** E-shop se stáhne, až když se otevře ?prototyp=eshop. */
export default function LazyEshop() {
  return <Suspense fallback={null}><Eshop /></Suspense>
}
