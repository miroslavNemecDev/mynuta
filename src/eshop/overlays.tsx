import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { Check, ChevronLeft, ChevronRight, Minus, Plus, X } from 'lucide-react'
import { categoryById, inStockFirst, priceOf, productById, recipeById, recipesUsing, subById, type Category } from './catalog.ts'
import { PriceTag, ProductCard, RecipeArt, RecipeCard, Shelf, Sheet, Stepper, Thumb } from './components.tsx'
import { BrandIcon } from './icons.tsx'
import { popularSearches, suggestFor } from './recommend.ts'
import { resolveListPart, searchProducts, searchRecipes, splitList } from './search.ts'
import { useShop } from './ShopContext.ts'
import { unitPriceLabel } from './sorting.ts'
import { formatPrice, itemCount, nb } from './text.ts'

export function BagButton({ compact = false }: { compact?: boolean }) {
  const shop = useShop()
  const count = shop.lines.length
  return (
    <button
      type="button"
      className={`es-bagpill${compact ? ' is-compact' : ''}`}
      onClick={() => shop.openSheet('taska')}
      aria-label={count ? `Taška: ${itemCount(count)}, ${formatPrice(shop.total)}` : 'Taška, zatím prázdná'}
    >
      <BrandIcon name="taska" size={22} />
      {count > 0 && <span className="es-bag-count">{count}</span>}
      {!compact && <span className="es-bag-total">{count ? formatPrice(shop.total) : 'Taška'}</span>}
    </button>
  )
}

/** Spodní lišta v dosahu palce: hledání, taška a nad nimi podkategorie. Zpět řeší telefon sám. */
export function BottomBar({ category, subId }: { category?: Category; subId?: string }) {
  const shop = useShop()
  const chipsRef = useRef<HTMLDivElement>(null)

  // Vybraná podkategorie má být vidět, i když je v řádku až vpravo.
  useEffect(() => {
    const row = chipsRef.current
    const active = row?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (row && active) row.scrollLeft = active.offsetLeft - (row.clientWidth - active.offsetWidth) / 2
  }, [subId])

  return (
    <nav className={`es-bottombar${category ? ' has-chips' : ''}`} aria-label="Navigace, hledání a taška">
      {category && (
        <div className="es-bottom-chips" ref={chipsRef} role="group" aria-label={`Podkategorie: ${category.name}`}>
          {category.subs.map((candidate) => (
            <button
              type="button"
              key={candidate.id}
              className="es-chip"
              aria-pressed={candidate.id === subId}
              onClick={() => shop.go(['k', category.id, candidate.id], { replace: Boolean(subId) })}
            >
              {candidate.name}<small>{candidate.productIds.length}</small>
            </button>
          ))}
        </div>
      )}
      <div className="es-bottom-row">
        <button type="button" className="es-searchpill" onClick={shop.openSearch}>
          <BrandIcon name="hledat" size={20} />
          <span>Hledat zboží…</span>
        </button>
        <BagButton />
      </div>
    </nav>
  )
}

export function SearchOverlay({ inputRef }: { inputRef: RefObject<HTMLInputElement | null> }) {
  const shop = useShop()
  const active = shop.route.q !== null
  const query = shop.route.q ?? ''
  const list = splitList(query)
  const focusable = active ? 0 : -1

  return (
    <div className={`es-search${active ? ' is-active' : ''}`} aria-hidden={!active} role="dialog" aria-modal={active} aria-label="Hledání">
      <div className="es-search-bar">
        <button type="button" className="es-back" onClick={shop.closeOverlay} aria-label="Zavřít hledání" tabIndex={focusable}><ChevronLeft size={26} strokeWidth={2.2} /></button>
        <label className="es-search-field">
          <BrandIcon name="hledat" size={20} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => shop.setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur()
                shop.rememberSearch(query)
              } else if (event.key === 'Escape') {
                shop.closeOverlay()
              }
            }}
            placeholder="Co hledáš? Třeba mléko, rohlíky"
            aria-label="Hledat zboží"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            tabIndex={focusable}
          />
          {query && (
            <button type="button" className="es-clear" onClick={() => { shop.setQuery(''); inputRef.current?.focus() }} aria-label="Smazat hledání" tabIndex={focusable}>
              <X size={18} strokeWidth={2.4} />
            </button>
          )}
        </label>
      </div>
      <div className="es-search-body">
        {active && (query.trim() === '' ? <SearchStart /> : list ? <ListResults parts={list} query={query} /> : <SearchResults query={query} />)}
      </div>
    </div>
  )
}

function SearchStart() {
  const shop = useShop()
  const usual = inStockFirst(shop.usual).slice(0, 8)
  return (
    <>
      {shop.recentSearches.length > 0 && (
        <section className="es-search-section">
          <h2 className="es-subtitle">Naposledy hledáno</h2>
          <div className="es-chip-cloud">{shop.recentSearches.map((term) => <button type="button" key={term} className="es-chip" onClick={() => shop.setQuery(term)}>{term}</button>)}</div>
        </section>
      )}
      <section className="es-search-section">
        <h2 className="es-subtitle">Často hledané</h2>
        <div className="es-chip-cloud">{popularSearches.map((term) => <button type="button" key={term} className="es-chip" onClick={() => shop.setQuery(term)}>{term}</button>)}</div>
      </section>
      {usual.length > 0 && (
        <Shelf title="Tvoje obvyklé">{usual.map((id) => <ProductCard key={id} id={id} suggest={false} />)}</Shelf>
      )}
      <p className="es-tip">{nb('Tip: napiš celý seznam oddělený čárkami, třeba „mléko, 6 rohlíků, 10 vajec“. Najdu všechno najednou.')}</p>
    </>
  )
}

function SearchResults({ query }: { query: string }) {
  const ids = useMemo(() => searchProducts(query), [query])
  const found = useMemo(() => searchRecipes(query), [query])
  const shown = ids.slice(0, 60)
  return (
    <>
      <div className="es-results-head"><h2 className="es-subtitle">Zboží</h2><span>{ids.length}</span></div>
      {ids.length
        ? <div className="es-grid">{shown.map((id) => <ProductCard key={id} id={id} suggest={false} />)}</div>
        : <p className="es-empty">{nb(found.length
          ? `Zboží „${query.trim()}“ nemám, ale níž je recept.`
          : `Na „${query.trim()}“ jsem žádné zboží nenašel. Zkus jiné slovo nebo kategorii.`)}</p>}
      {ids.length > shown.length && <p className="es-hint">{`A dalších ${ids.length - shown.length}. Zkus hledání zpřesnit.`}</p>}
      {found.length > 0 && (
        <section className="es-search-section es-search-recipes">
          <div className="es-results-head"><h2 className="es-subtitle">Recepty</h2><span>{found.length}</span></div>
          <div className="es-recipe-grid">{found.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}</div>
        </section>
      )}
    </>
  )
}

type ListOverride = { productId?: string; packages?: number; removed?: boolean }

function ListResults({ parts, query }: { parts: string[]; query: string }) {
  const shop = useShop()
  const usual = useMemo(() => new Set(shop.usual), [shop.usual])
  const [overrides, setOverrides] = useState<Record<string, ListOverride>>({})
  const lines = parts.map((part) => {
    const found = resolveListPart(part, usual)
    const override = overrides[part] ?? {}
    const productId = override.productId ?? found.productId
    const choices = [found.productId, ...found.alternatives].filter((id): id is string => Boolean(id) && id !== productId)
    return { ...found, productId, packages: override.packages ?? found.packages, removed: override.removed ?? false, choices }
  })
  const chosen = lines.filter((line) => line.productId && !line.removed)
  const total = chosen.reduce((sum, line) => {
    const product = line.productId ? productById.get(line.productId) : undefined
    return product ? sum + priceOf(product) * line.packages : sum
  }, 0)
  const update = (part: string, change: ListOverride) => setOverrides((current) => ({ ...current, [part]: { ...current[part], ...change } }))
  const addAll = () => {
    const items: Record<string, number> = {}
    for (const line of chosen) if (line.productId) items[line.productId] = (items[line.productId] ?? 0) + line.packages
    shop.addMany(items)
    shop.rememberSearch(query)
    shop.toast(`Seznam je v tašce: ${itemCount(Object.keys(items).length)}`)
    shop.closeOverlay()
  }

  return (
    <>
      <div className="es-results-head"><h2 className="es-subtitle">Nákupní seznam</h2><span>{parts.length}</span></div>
      <ul className="es-list">
        {lines.map((line, index) => {
          const product = line.productId ? productById.get(line.productId) : undefined
          return (
            <li key={`${index}-${line.text}`} className={`es-list-item${line.removed ? ' is-removed' : ''}`}>
              <span className="es-list-query">{`„${line.text}“`}</span>
              {product ? (
                <div className="es-list-row">
                  <Thumb product={product} size={22} className="es-thumb-small" />
                  <span className="es-list-name"><strong>{nb(product.name)}</strong><small>{nb(product.unit)} · {formatPrice(priceOf(product))}</small></span>
                  {line.removed ? (
                    <button type="button" className="es-link es-link-small" onClick={() => update(line.text, { removed: false })}>Vrátit</button>
                  ) : (
                    <>
                      <span className="es-stepper es-stepper-row">
                        <button type="button" onClick={() => line.packages <= 1 ? update(line.text, { removed: true }) : update(line.text, { packages: line.packages - 1 })} aria-label={`Méně: ${product.name}`}><Minus size={16} strokeWidth={2.4} /></button>
                        <span>{line.packages}</span>
                        <button type="button" onClick={() => update(line.text, { packages: line.packages + 1 })} disabled={line.packages >= product.stock} aria-label={`Víc: ${product.name}`}><Plus size={16} strokeWidth={2.4} /></button>
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <p className="es-empty-inline">{nb('Tohle jsem nenašel. Zkus jiné slovo.')}</p>
              )}
              {!line.removed && line.choices.length > 0 && (
                <div className="es-list-alts">
                  <span>nebo</span>
                  {line.choices.map((id) => {
                    const choice = productById.get(id)
                    return choice ? <button type="button" key={id} className="es-chip es-chip-small" onClick={() => update(line.text, { productId: id })}>{choice.name}</button> : null
                  })}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <div className="es-search-foot">
        <button type="button" className="es-cta" disabled={!chosen.length} onClick={addAll}>
          Přidat do tašky · {itemCount(chosen.length)} · {formatPrice(total)}
        </button>
      </div>
    </>
  )
}

/** Obsah tašky: recepty, položky a součet. Stejný ve spodním panelu na mobilu i v pravém sloupci na počítači. */
export function BagContents() {
  const shop = useShop()
  const recipesInBag = shop.bag.recipes.flatMap((entry) => {
    const recipe = recipeById.get(entry.id)
    return recipe ? [{ entry, recipe }] : []
  })
  if (shop.lines.length === 0) {
    return (
      <div className="es-empty-bag">
        <BrandIcon name="taska" size={44} />
        <strong>Taška je zatím prázdná.</strong>
        <p>{nb('Začni obvyklým nákupem, nebo hledej.')}</p>
        <button type="button" className="es-cta es-cta-quiet" onClick={shop.repeatLast}>Zopakovat minulý nákup</button>
      </div>
    )
  }
  return (
        <>
          {recipesInBag.length > 0 && (
            <div className="es-bag-recipes" aria-label="Recepty v tašce">
              {recipesInBag.map(({ entry, recipe }) => (
                <span key={recipe.id} className="es-recipe-chip">
                  <button type="button" onClick={() => shop.go(['recept', recipe.id])}>{recipe.name} · {entry.servings}&nbsp;porce</button>
                  <button type="button" onClick={() => shop.removeRecipe(recipe.id)} aria-label={`Odebrat recept ${recipe.name}`}><X size={16} strokeWidth={2.4} /></button>
                </span>
              ))}
            </div>
          )}
          <ul className="es-bag-list">
            {shop.lines.map((line) => {
              const product = productById.get(line.id)
              if (!product) return null
              return (
                <li key={line.id} className="es-bag-row">
                  <button type="button" className="es-bag-open" onClick={() => shop.openProduct(line.id)}>
                    <Thumb product={product} size={22} className="es-thumb-small" />
                    <span className="es-bag-text">
                      <strong>{nb(product.name)}</strong>
                      <small>{nb(product.unit)} · {formatPrice(priceOf(product))}</small>
                      {line.fromRecipes.length > 0 && (
                        <span className="es-tags">{line.fromRecipes.map((id) => <span key={id} className="es-tag">{recipeById.get(id)?.name}</span>)}</span>
                      )}
                    </span>
                  </button>
                  <span className="es-bag-side">
                    <strong>{formatPrice(priceOf(product) * line.qty)}</strong>
                    <Stepper id={line.id} variant="row" />
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="es-summary">
            {shop.saved > 0 && <div className="es-summary-saved"><span>Ušetříš na akcích</span><span>−{formatPrice(shop.saved)}</span></div>}
            <div className="es-summary-total"><span>Celkem</span><strong>{formatPrice(shop.total)}</strong></div>
          </div>
        </>
  )
}

export function BagSheet() {
  const shop = useShop()
  // Návrhy se spočítají při otevření, aby přidaná položka hned nezmizela pod prstem.
  const [missing] = useState(() => inStockFirst(shop.usual).filter((id) => shop.qty(id) === 0 && (productById.get(id)?.stock ?? 0) > 0).slice(0, 8))
  const empty = shop.lines.length === 0

  return (
    <Sheet
      title="Tvoje taška"
      onClose={shop.closeOverlay}
      footer={empty ? undefined : (
        <button type="button" className="es-cta" onClick={() => shop.go(['objednavka'])}>K objednávce · {formatPrice(shop.total)}</button>
      )}
    >
      <BagContents />
      {missing.length > 0 && (
        <Shelf title={empty ? 'Tvoje obvyklé' : 'Nechybí ti něco?'}>
          {missing.map((id) => <ProductCard key={id} id={id} suggest={false} />)}
        </Shelf>
      )}
    </Sheet>
  )
}

export function ProductSheet({ id }: { id: string }) {
  const shop = useShop()
  const [suggestions] = useState(() => suggestFor(id, new Set([...shop.lines.map((line) => line.id), id]), 6))
  const product = productById.get(id)
  if (!product) return null
  const qty = shop.qty(id)
  const soldOut = product.stock <= 0
  const usedIn = recipesUsing(id)
  const category = categoryById.get(product.categoryId)
  const sub = subById.get(product.subId)

  return (
    <Sheet
      title={product.name}
      hideTitle
      onClose={shop.closeOverlay}
      className="es-product-sheet"
      footer={soldOut
        ? <button type="button" className="es-cta" disabled>Teď nemám skladem</button>
        : qty
          ? <div className="es-product-in-bag"><span><Check size={18} strokeWidth={2.6} /> V tašce</span><Stepper id={id} variant="large" /></div>
          : <button type="button" className="es-cta" onClick={() => shop.add(id)}>Přidat do tašky · {formatPrice(priceOf(product))}</button>}
    >
      <div className="es-product-hero">
        <Thumb product={product} size={64} className="es-thumb-hero" />
        {product.discount > 0 && <span className="es-badge">−{product.discount}&nbsp;%</span>}
      </div>
      <p className="es-product-path">{category?.name} · {sub?.name}</p>
      <h2 className="es-product-name">{nb(product.name)}</h2>
      <div className="es-product-price">
        <PriceTag product={product} className="is-large" />
        <span>{nb(product.unit)}{unitPriceLabel(product) && ` · ${unitPriceLabel(product)}`}</span>
      </div>
      {product.stock > 0 && product.stock <= 3 && <p className="es-stock-note">{`Skladem poslední ${product.stock} ks`}</p>}

      {suggestions.length > 0 && (
        <Shelf title="K tomu lidé berou">{suggestions.map((suggested) => <ProductCard key={suggested} id={suggested} suggest={false} />)}</Shelf>
      )}

      <section className="es-facts">
        <h3>Povinné údaje o potravině</h3>
        <dl>
          <div><dt>Složení</dt><dd>Doplní se z katalogu dodavatele.</dd></div>
          <div><dt>Alergeny</dt><dd>Doplní se z katalogu dodavatele.</dd></div>
          <div><dt>Výrobce a původ</dt><dd>Doplní se z katalogu dodavatele.</dd></div>
          <div><dt>Skladování</dt><dd>Doplní se z katalogu dodavatele.</dd></div>
        </dl>
        {product.subId === 'pivo-a-vino' && <p className="es-hint">{nb('Alkohol vydám jen plnoletým. U pultu se můžu zeptat na doklad.')}</p>}
      </section>

      {usedIn.length > 0 && (
        <section className="es-used-in">
          <h3>Použiješ v receptu</h3>
          {usedIn.map((recipe) => (
            <button type="button" key={recipe.id} className="es-recipe-link" onClick={() => shop.go(['recept', recipe.id])}>
              <RecipeArt recipe={recipe} />
              <span>{nb(recipe.name)}</span>
              <ChevronRight size={18} strokeWidth={2.2} />
            </button>
          ))}
        </section>
      )}
    </Sheet>
  )
}

const STRIP_MS = 5000
const STRIP_TICK = 100

/**
 * Za 5 s se pruh sám zavře, aby nepřekážel u každého zboží. Odpočet stojí, dokud je nad pruhem myš
 * nebo v něm fokus, a po každém ťuknutí do pruhu (třeba přidání návrhu) začne znovu.
 */
function useAutoClose(onClose: () => void) {
  const [left, setLeft] = useState(STRIP_MS)
  const [paused, setPaused] = useState(false)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose })
  useEffect(() => {
    if (paused) return
    if (left <= 0) { closeRef.current(); return }
    const timer = window.setTimeout(() => setLeft((value) => value - STRIP_TICK), STRIP_TICK)
    return () => window.clearTimeout(timer)
  }, [left, paused])
  return { left, setPaused, restart: () => setLeft(STRIP_MS) }
}

export function SuggestionStrip({ sourceId, ids, onClose }: { sourceId: string; ids: string[]; onClose: () => void }) {
  const shop = useShop()
  const { left, setPaused, restart } = useAutoClose(onClose)
  const source = productById.get(sourceId)
  if (!source) return null
  return (
    <aside
      className="es-strip"
      aria-label="K tomu lidé berou"
      onPointerEnter={(event) => { if (event.pointerType === 'mouse') setPaused(true) }}
      onPointerLeave={(event) => { if (event.pointerType === 'mouse') setPaused(false) }}
      onPointerDown={restart}
      onFocus={() => setPaused(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false) }}
    >
      <div className="es-strip-inner">
        <div className="es-strip-head">
          {/* „V tašce: …“ sedí na jednotné i množné číslo (chléb i banány). */}
          <span><Check size={16} strokeWidth={2.8} /> <span className="es-strip-title">{nb(`V tašce: ${source.name}`)}</span></span>
          <button
            type="button"
            className="es-strip-timer"
            onClick={onClose}
            aria-label="Zavřít návrhy"
            style={{ '--es-left': left / STRIP_MS } as CSSProperties}
          >
            <span aria-hidden="true">Zavřít · {Math.max(1, Math.ceil(left / 1000))}&nbsp;s</span>
            <X size={18} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
        <p className="es-strip-label">K tomu lidé berou</p>
        <div className="es-strip-items">
          {ids.map((id) => {
            const product = productById.get(id)
            if (!product) return null
            const qty = shop.qty(id)
            return (
              <div key={id} className="es-mini">
                <button type="button" className="es-mini-open" onClick={() => shop.openProduct(id)}>
                  <strong>{nb(product.name)}</strong>
                  <span>{formatPrice(priceOf(product))}</span>
                </button>
                {qty
                  ? <Stepper id={id} variant="row" />
                  : <button type="button" className="es-add es-add-small" onClick={() => shop.add(id)} aria-label={`Přidat do tašky: ${product.name}`}><Plus size={18} strokeWidth={2.6} /></button>}
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

export function Toast({ message }: { message: string }) {
  return <div className="es-toast" role="status">{message}</div>
}
