import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Minus, Plus, X } from 'lucide-react'
import { categoryById, minutesLabel, priceOf, productById, type Product, type Recipe } from './catalog.ts'
import { defaultEntry, recipeTotal, resolveRecipe } from './bag.ts'
import { BrandIcon } from './icons.tsx'
import { useShop } from './ShopContext.ts'
import { unitPriceLabel } from './sorting.ts'
import { formatPrice, itemCount, nb, plural } from './text.ts'

export function PriceTag({ product, className = '' }: { product: Product; className?: string }) {
  return (
    <span className={`es-price ${className}`}>
      <strong>{formatPrice(priceOf(product))}</strong>
      {product.discount > 0 && <s aria-label={`původně ${formatPrice(product.price)}`}>{formatPrice(product.price)}</s>}
    </span>
  )
}

export function Thumb({ product, size = 34, className = '' }: { product: Product; size?: number; className?: string }) {
  const category = categoryById.get(product.categoryId)
  const icon = product.name.startsWith('Vejce') ? 'vejce' : category?.icon ?? 'trvanlive'
  return (
    <span className={`es-thumb ${className}`} style={{ background: category?.tone }}>
      <BrandIcon name={icon} size={size} />
    </span>
  )
}

export function Stepper({ id, variant = 'card', suggest = false }: { id: string; variant?: 'card' | 'row' | 'large'; suggest?: boolean }) {
  const shop = useShop()
  const product = productById.get(id)
  const qty = shop.qty(id)
  if (!product) return null
  return (
    <span className={`es-stepper es-stepper-${variant}`}>
      <button type="button" onClick={() => shop.decrement(id)} aria-label={`Odebrat ${product.name}`}><Minus size={variant === 'large' ? 20 : 16} strokeWidth={2.4} /></button>
      <span aria-live="polite">{qty}</span>
      <button type="button" onClick={() => shop.add(id, { suggest })} aria-label={`Přidat další ${product.name}`} disabled={qty >= product.stock}><Plus size={variant === 'large' ? 20 : 16} strokeWidth={2.4} /></button>
    </span>
  )
}

export function ProductCard({ id, suggest = true }: { id: string; suggest?: boolean }) {
  const shop = useShop()
  const product = productById.get(id)
  if (!product) return null
  const qty = shop.qty(id)
  const soldOut = product.stock <= 0
  return (
    <article className={`es-card${soldOut ? ' is-soldout' : ''}${qty ? ' is-in-bag' : ''}`}>
      <button type="button" className="es-card-open" onClick={() => shop.openProduct(id)} aria-label={`${product.name}, ${product.unit}, ${formatPrice(priceOf(product))}, detail`} />
      <div className="es-card-media">
        <Thumb product={product} />
        {product.discount > 0 && <span className="es-badge">−{product.discount}&nbsp;%</span>}
        <div className={`es-card-action${qty ? ' has-stepper' : ''}`}>
          {soldOut
            ? <span className="es-soldout">Vyprodáno</span>
            : qty
              ? <Stepper id={id} suggest={suggest} />
              : <button type="button" className="es-add" onClick={() => shop.add(id, { suggest })} aria-label={`Přidat do tašky: ${product.name}`}><Plus size={20} strokeWidth={2.6} /></button>}
        </div>
      </div>
      <div className="es-card-body">
        <h3>{nb(product.name)}</h3>
        <span className="es-unit">
          {nb(product.unit)}
          {product.stock > 0 && product.stock <= 3 ? <em> · poslední {product.stock}</em> : unitPriceLabel(product) && ` · ${unitPriceLabel(product)}`}
        </span>
        <PriceTag product={product} />
      </div>
    </article>
  )
}

export function Shelf({ title, count, action, wide = false, children }: {
  title: string
  count?: number
  action?: { label: string; onClick: () => void }
  wide?: boolean
  children: ReactNode
}) {
  const railRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  // Šipky jsou jen pro myš a jsou vidět pořád. Kraje se zjišťují hned po vykreslení, při změně šířky a při scrollu,
  // takže u řady, která se celá vejde, se šipka vůbec neukáže.
  const updateEdges = () => {
    const rail = railRef.current
    if (rail) setEdges({ start: rail.scrollLeft <= 4, end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4 })
  }
  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const measure = () => setEdges({ start: rail.scrollLeft <= 4, end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4 })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(rail)
    return () => observer.disconnect()
  }, [children])
  const page = (direction: 1 | -1) => {
    const rail = railRef.current
    rail?.scrollBy({ left: direction * rail.clientWidth * 0.85, behavior: 'smooth' })
  }
  return (
    <section className="es-shelf" aria-label={title}>
      <div className="es-shelf-head">
        <h2>{title}{count !== undefined && <small>{count}</small>}</h2>
        {action && <button type="button" className="es-link" onClick={action.onClick}>{action.label}<ChevronRight size={16} strokeWidth={2.4} /></button>}
      </div>
      <div className="es-rail-wrap">
        {!edges.start && <button type="button" className="es-rail-arrow is-prev" onClick={() => page(-1)} aria-label="Posunout doleva" tabIndex={-1}><ChevronLeft size={22} strokeWidth={2.4} /></button>}
        <div ref={railRef} className={`es-rail${wide ? ' es-rail-wide' : ''}`} onScroll={updateEdges}>{children}</div>
        {!edges.end && <button type="button" className="es-rail-arrow is-next" onClick={() => page(1)} aria-label="Posunout doprava" tabIndex={-1}><ChevronRight size={22} strokeWidth={2.4} /></button>}
      </div>
    </section>
  )
}

export function ProductGrid({ ids }: { ids: string[] }) {
  return <div className="es-grid">{ids.map((id) => <ProductCard key={id} id={id} />)}</div>
}

function ingredientIcon(productId: string): string {
  const product = productById.get(productId)
  if (!product) return 'trvanlive'
  if (product.name.startsWith('Vejce')) return 'vejce'
  return categoryById.get(product.categoryId)?.icon ?? 'trvanlive'
}

/** Místo fotky receptu kolečko s ikonami hlavních surovin (fotky dodá obsah). */
export function RecipeArt({ recipe, large = false }: { recipe: Recipe; large?: boolean }) {
  const icons = [...new Set(recipe.lines.filter((line) => !line.staple).map((line) => ingredientIcon(line.product)))].slice(0, 3)
  return (
    <span className={`es-recipe-art${large ? ' is-large' : ''}`} aria-hidden="true">
      <span className="es-recipe-circle">
        {icons.map((name, index) => <BrandIcon key={name} name={name} size={large ? 34 : 26} className={`es-art-${index}`} />)}
      </span>
    </span>
  )
}

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const shop = useShop()
  const lines = resolveRecipe(recipe, defaultEntry(recipe))
  const count = lines.filter((line) => line.included && line.available).length
  const inBag = shop.bag.recipes.some((entry) => entry.id === recipe.id)
  return (
    <article className="es-recipe-card">
      <button type="button" className="es-card-open" onClick={() => shop.go(['recept', recipe.id])} aria-label={`Recept ${recipe.name}`} />
      <RecipeArt recipe={recipe} />
      <div className="es-recipe-card-body">
        <h3>{nb(recipe.name)}</h3>
        <span>{minutesLabel(recipe.minutes)} · {count}&nbsp;{plural(count, 'surovina', 'suroviny', 'surovin')}</span>
        <strong>{inBag ? 'V tašce' : `asi ${formatPrice(recipeTotal(lines))}`}</strong>
      </div>
    </article>
  )
}

/**
 * Hlavička jako na landing page: logo v zaobleném výřezu, přichycená nahoře na všech stránkách.
 * Logo vede na úvod. Šipka zpět je jen na počítači, telefony mají vlastní (gesto nebo tlačítko systému).
 */
/** Při scrollování dolů lišta zajede nahoru (na mobilu zůstane vidět „rychle – do mynuty“), nahoru ji vrátí. */
function useCompactOnScroll(): boolean {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (y < 80) {
        setCompact(false)
        last = y
      } else if (y > last + 8) {
        setCompact(true)
        last = y
      } else if (y < last - 8) {
        setCompact(false)
        last = y
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return compact
}

export function SiteHeader({ onBack }: { onBack?: () => void }) {
  const shop = useShop()
  const compact = useCompactOnScroll()
  const count = shop.lines.length
  return (
    <header className={`es-header${compact ? ' is-compact' : ''}`}>
      {/* Bílý tvar s výřezem je zvlášť, aby stín kopíroval výřez a plochy vedle něj mohly být neprůhledné. */}
      <span className="es-header-shape" aria-hidden="true" />
      {/* Na počítači: zpět a hledání v bílém pruhu vlevo. Na telefonu skryté (zpět řeší systém, hledání je dole). */}
      <div className="es-header-tools">
        {onBack && <button type="button" className="es-header-back" onClick={onBack} aria-label="Zpět"><ChevronLeft size={24} strokeWidth={2.2} /></button>}
        <button type="button" className="es-header-search" onClick={shop.openSearch}>
          <BrandIcon name="hledat" size={18} />
          <span>Hledat zboží…</span>
        </button>
      </div>
      <a className="es-brand" href="#/" aria-label="Mynuta, úvod e-shopu">
        <img src={`${import.meta.env.BASE_URL}mynuta-logo.svg`} alt="MYNUTA" width={126} height={40} />
        <span>rychle – do mynuty</span>
      </a>
      {/* Na počítači vpravo taška: s obsahem vede rovnou k objednávce, prázdná otevře tašku s obvyklým nákupem. */}
      <div className="es-header-right">
        <button
          type="button"
          className="es-header-bag"
          onClick={() => count ? shop.go(['objednavka']) : shop.openSheet('taska')}
          aria-label={count ? `K objednávce: ${itemCount(count)}, ${formatPrice(shop.total)}` : 'Taška, zatím prázdná'}
        >
          <BrandIcon name="taska" size={20} />
          {count > 0 && <span className="es-bag-count">{count}</span>}
          <span>{count ? `K objednávce · ${formatPrice(shop.total)}` : 'Taška'}</span>
        </button>
      </div>
    </header>
  )
}

export function TopBar({ title, kicker, children }: { title: string; kicker?: string; children?: ReactNode }) {
  return (
    <>
      <div className="es-pagehead">
        {kicker && <span>{kicker}</span>}
        <h1>{nb(title)}</h1>
        {children}
      </div>
    </>
  )
}

export function Sheet({ title, hideTitle = false, onClose, footer, children, className = '' }: {
  title: string
  hideTitle?: boolean
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
  className?: string
}) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    sheetRef.current?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="es-sheet-layer">
      <button type="button" className="es-sheet-backdrop" onClick={onClose} aria-label="Zavřít" tabIndex={-1} />
      <div className={`es-sheet ${className}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={sheetRef}>
        <div className="es-sheet-head">
          {hideTitle ? <span /> : <h2>{title}</h2>}
          <button type="button" className="es-icon-button" onClick={onClose} aria-label="Zavřít"><X size={22} strokeWidth={2.2} /></button>
        </div>
        <div className="es-sheet-body">{children}</div>
        {footer && <div className="es-sheet-foot">{footer}</div>}
      </div>
    </div>
  )
}
