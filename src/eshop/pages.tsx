import { useState } from 'react'
import { ArrowUpDown, Check, Minus, Plus } from 'lucide-react'
import {
  categories,
  discounted,
  inStockFirst,
  minutesLabel,
  priceOf,
  productById,
  recipes,
  type Category,
  type Recipe,
} from './catalog.ts'
import { defaultEntry, recipeTotal, resolveRecipe, type RecipeEntry } from './bag.ts'
import { ProductCard, ProductGrid, RecipeArt, RecipeCard, Shelf, Sheet, Thumb, TopBar } from './components.tsx'
import { BrandIcon } from './icons.tsx'
import { BagButton } from './overlays.tsx'
import { pickupDays, pickupLabel, windowLabel, windowPart } from './slots.ts'
import { SORT_OPTIONS, TAGS, isSortMode, matchesTags, sortIds, type SortMode } from './sorting.ts'
import { useShop } from './ShopContext.ts'
import { useStoredState } from './storage.ts'
import { formatPrice, itemCount, nb, plural } from './text.ts'

export function HomePage() {
  const shop = useShop()
  const [nextDay] = useState(() => pickupDays(new Date(), 1)[0])
  const usual = inStockFirst(shop.usual)

  return (
    <>
      <main className="es-main">
        {nextDay && (
          <p className="es-next">
            <BrandIcon name="hodiny" size={18} />
            <span>Nejbližší výdej <strong>{pickupLabel(nextDay, nextDay.slots[0])}</strong> · Plzeň-Slovany</span>
          </p>
        )}

        {usual.length > 0 && (
          <Shelf title="Tvoje obvyklé" action={{ label: 'Zopakovat nákup', onClick: shop.repeatLast }}>
            {usual.map((id) => <ProductCard key={id} id={id} />)}
          </Shelf>
        )}

        <nav className="es-tiles" aria-label="Kategorie">
          {categories.map((category) => (
            <button type="button" key={category.id} className="es-tile" onClick={() => shop.go(['k', category.id])}>
              <span className="es-tile-icon" style={{ background: category.tone }}><BrandIcon name={category.icon} size={28} /></span>
              <span>{nb(category.name)}</span>
            </button>
          ))}
          <button type="button" className="es-tile es-tile-recipes" onClick={() => shop.go(['recepty'])}>
            <span className="es-tile-icon"><BrandIcon name="recepty" size={28} /></span>
            <span>Recepty</span>
          </button>
        </nav>

        <Shelf title="Právě v akci" count={discounted.length}>
          {discounted.map((product) => <ProductCard key={product.id} id={product.id} />)}
        </Shelf>

        <Shelf title="Co dnes uvařit" wide action={{ label: 'Všechny recepty', onClick: () => shop.go(['recepty']) }}>
          {recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
        </Shelf>

      </main>
    </>
  )
}

export function CategoryPage({ category, subId }: { category: Category; subId?: string }) {
  const shop = useShop()
  const sub = subId ? category.subs.find((candidate) => candidate.id === subId) : undefined
  // Řazení si prohlížeč pamatuje, filtry platí v rámci kategorie (i při přepínání podkategorií).
  const [sort, setSort] = useStoredState<SortMode>('mynuta-eshop-v1-razeni', () => 'az', isSortMode)
  const [tags, setTags] = useState<string[]>([])
  const scope = sub ? sub.productIds : category.subs.flatMap((candidate) => candidate.productIds)
  const arrange = (ids: string[]) => inStockFirst(sortIds(ids.filter((id) => {
    const product = productById.get(id)
    return product ? matchesTags(product, tags) : false
  }), sort))
  const tagChips = TAGS
    .map((tag) => ({ tag, count: scope.filter((id) => { const product = productById.get(id); return product ? tag.test(product) : false }).length }))
    .filter(({ tag, count }) => tags.includes(tag.id) || (count > 0 && count < scope.length))
  const toggleTag = (id: string) => setTags((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const deals = arrange(discounted.filter((product) => product.categoryId === category.id).map((product) => product.id))
  const shelves = category.subs.map((candidate) => ({ sub: candidate, ids: arrange(candidate.productIds) })).filter(({ ids }) => ids.length > 0)
  const gridIds = sub ? arrange(sub.productIds) : []
  const nothing = sub ? gridIds.length === 0 : shelves.length === 0
  const sortLabel = SORT_OPTIONS.find((option) => option.id === sort)?.short

  return (
    <>
      {/* Podkategorie jsou ve spodní liště v dosahu palce (BottomBar). */}
      <TopBar title={sub ? sub.name : category.name} kicker={sub ? category.name : undefined} />
      <main className="es-main">
        <div className="es-tools" role="group" aria-label="Řazení a filtry">
          <button type="button" className="es-chip es-sort" onClick={() => shop.openSheet('razeni')} aria-label={`Řazení: ${sortLabel}`}>
            <ArrowUpDown size={16} strokeWidth={2.4} />{sortLabel}
          </button>
          {tagChips.map(({ tag, count }) => (
            <button type="button" key={tag.id} className="es-chip" aria-pressed={tags.includes(tag.id)} onClick={() => toggleTag(tag.id)}>
              {tag.label}<small>{count}</small>
            </button>
          ))}
        </div>

        {nothing ? (
          <div className="es-empty-filter">
            <p>{nb('Takové zboží tu teď nemám.')}</p>
            <button type="button" className="es-cta es-cta-quiet" onClick={() => setTags([])}>Zrušit filtry</button>
          </div>
        ) : sub ? (
          <div className="es-section"><ProductGrid ids={gridIds} /></div>
        ) : (
          <>
            {deals.length > 1 && !tags.includes('v-akci') && (
              <Shelf title="V akci" count={deals.length}>
                {deals.map((id) => <ProductCard key={id} id={id} />)}
              </Shelf>
            )}
            {shelves.map(({ sub: candidate, ids }) => (
              <Shelf
                key={candidate.id}
                title={candidate.name}
                count={ids.length}
                action={{ label: 'Zobrazit vše', onClick: () => shop.go(['k', category.id, candidate.id]) }}
              >
                {ids.map((id) => <ProductCard key={id} id={id} />)}
              </Shelf>
            ))}
          </>
        )}
      </main>

      {shop.route.s === 'razeni' && (
        <Sheet title="Řadit" onClose={shop.closeOverlay}>
          <ul className="es-options">
            {SORT_OPTIONS.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className={`es-option${option.id === sort ? ' is-selected' : ''}`}
                  aria-pressed={option.id === sort}
                  onClick={() => { setSort(option.id); shop.closeOverlay() }}
                >
                  <span><strong>{option.label}</strong></span>
                  {option.id === sort && <Check size={20} strokeWidth={2.6} />}
                </button>
              </li>
            ))}
          </ul>
        </Sheet>
      )}
    </>
  )
}

export function RecipesPage() {
  return (
    <>
      <TopBar title="Recepty" />
      <main className="es-main">
        <p className="es-intro">{nb('Vyber recept, uprav porce a odškrtni, co máš doma. Suroviny pak pošleš do tašky jedním ťuknutím.')}</p>
        <div className="es-recipe-grid">{recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}</div>
      </main>
    </>
  )
}

function sameEntry(first: RecipeEntry, second: RecipeEntry): boolean {
  const swaps = (entry: RecipeEntry) => JSON.stringify(Object.entries(entry.swaps).sort())
  return first.servings === second.servings
    && JSON.stringify([...first.excluded].sort()) === JSON.stringify([...second.excluded].sort())
    && swaps(first) === swaps(second)
}

export function RecipePage({ recipe }: { recipe: Recipe }) {
  const shop = useShop()
  const inBag = shop.bag.recipes.find((entry) => entry.id === recipe.id)
  const [entry, setEntry] = useState<RecipeEntry>(() => inBag ?? defaultEntry(recipe))
  const lines = resolveRecipe(recipe, entry)
  const chosen = lines.filter((line) => line.included && line.available)
  const total = recipeTotal(lines)
  const changed = !inBag || !sameEntry(inBag, entry)
  const swapKey = shop.route.s?.startsWith('vymenit:') ? shop.route.s.slice('vymenit:'.length) : null
  const swapLine = lines.find((line) => line.key === swapKey)

  const toggle = (key: string) => setEntry((current) => ({
    ...current,
    excluded: current.excluded.includes(key) ? current.excluded.filter((item) => item !== key) : [...current.excluded, key],
  }))
  const setServings = (servings: number) => setEntry((current) => ({ ...current, servings: Math.min(12, Math.max(1, servings)) }))
  const choose = (key: string, productId: string) => {
    setEntry((current) => {
      const swaps = { ...current.swaps }
      if (productId === key) delete swaps[key]
      else swaps[key] = productId
      return { ...current, swaps, excluded: current.excluded.filter((item) => item !== key) }
    })
    shop.closeOverlay()
  }
  const save = () => {
    shop.saveRecipe(entry)
    shop.toast(inBag ? 'Změny v receptu jsou v tašce' : `${recipe.name}: suroviny jsou v tašce`)
  }

  return (
    <>
      <TopBar title={recipe.name} kicker="Recept" />
      <main className="es-main es-main-recipe">
        <RecipeArt recipe={recipe} large />
        <p className="es-recipe-meta">{minutesLabel(recipe.minutes)} · {itemCount(chosen.length)} do tašky</p>

        <div className="es-servings">
          <span>Porce</span>
          <span className="es-stepper es-stepper-row">
            <button type="button" onClick={() => setServings(entry.servings - 1)} disabled={entry.servings <= 1} aria-label="Méně porcí"><Minus size={16} strokeWidth={2.4} /></button>
            <span aria-live="polite">{entry.servings}</span>
            <button type="button" onClick={() => setServings(entry.servings + 1)} disabled={entry.servings >= 12} aria-label="Více porcí"><Plus size={16} strokeWidth={2.4} /></button>
          </span>
        </div>

        <h2 className="es-subtitle">Suroviny</h2>
        <ul className="es-ingredients">
          {lines.map((line) => {
            const product = productById.get(line.productId)
            const primary = productById.get(line.key)
            if (!product) return null
            const note = !line.available
              ? 'Teď nemám skladem'
              : line.included
                ? `na recept ${line.label} · balení ${product.unit}`
                : line.staple ? 'mám doma' : 'vynecháno'
            return (
              <li key={line.key} className={`es-ingredient${line.included && line.available ? '' : ' is-off'}`}>
                <button type="button" role="checkbox" aria-checked={line.included && line.available} className="es-ingredient-toggle" onClick={() => toggle(line.key)} disabled={!line.available}>
                  <span className="es-check">{line.included && line.available && <Check size={16} strokeWidth={3} />}</span>
                  <Thumb product={product} size={22} className="es-thumb-small" />
                  <span className="es-ingredient-text">
                    <strong>{line.packages > 1 && line.included ? `${line.packages}× ` : ''}{nb(product.name)}</strong>
                    <small>{nb(note)}</small>
                    {line.autoSwapped && primary && <small className="es-swap-note">{nb(`Došlo: ${primary.name}. Dávám náhradu.`)}</small>}
                  </span>
                </button>
                <span className="es-ingredient-side">
                  {line.included && line.available && <strong>{formatPrice(priceOf(product) * line.packages)}</strong>}
                  {line.options.length > 1 && <button type="button" className="es-link es-link-small" onClick={() => shop.openSheet(`vymenit:${line.key}`)}>Vyměnit</button>}
                </span>
              </li>
            )
          })}
        </ul>

        <details className="es-steps">
          <summary>Postup · {recipe.steps.length}&nbsp;{plural(recipe.steps.length, 'krok', 'kroky', 'kroků')}</summary>
          <ol>{recipe.steps.map((step) => <li key={step}>{nb(step)}</li>)}</ol>
        </details>

        {inBag && (
          <button type="button" className="es-text-button" onClick={() => { shop.removeRecipe(recipe.id); setEntry(defaultEntry(recipe)) }}>
            Odebrat recept z tašky
          </button>
        )}
      </main>

      <div className="es-actionbar">
        {inBag && !changed
          ? <button type="button" className="es-cta es-cta-quiet" onClick={() => shop.openSheet('taska')}><Check size={18} strokeWidth={2.6} /> V tašce · otevřít</button>
          : (
            <button type="button" className="es-cta" disabled={!chosen.length} onClick={save}>
              {inBag ? 'Uložit změny' : 'Do tašky'} · {itemCount(chosen.length)} · {formatPrice(total)}
            </button>
          )}
        <BagButton compact />
      </div>

      {swapLine && (
        <Sheet title="Vyměnit surovinu" onClose={shop.closeOverlay}>
          <p className="es-sheet-intro">{nb(`Na recept potřebuješ ${swapLine.label}. Vyber, co ti dám do tašky:`)}</p>
          <ul className="es-options">
            {swapLine.options.map((id) => {
              const option = productById.get(id)
              if (!option) return null
              const soldOut = option.stock <= 0
              const selected = id === swapLine.productId
              return (
                <li key={id}>
                  <button type="button" className={`es-option${selected ? ' is-selected' : ''}`} disabled={soldOut} onClick={() => choose(swapLine.key, id)} aria-pressed={selected}>
                    <Thumb product={option} size={22} className="es-thumb-small" />
                    <span><strong>{nb(option.name)}</strong><small>{soldOut ? 'Teď nemám skladem' : `${option.unit} · ${formatPrice(priceOf(option))}`}</small></span>
                    {selected && <Check size={20} strokeWidth={2.6} />}
                  </button>
                </li>
              )
            })}
          </ul>
        </Sheet>
      )}
    </>
  )
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function CheckoutPage() {
  const shop = useShop()
  const [days] = useState(() => pickupDays(new Date()))
  const [dayKey, setDayKey] = useState(days[0]?.key ?? '')
  const day = days.find((candidate) => candidate.key === dayKey) ?? days[0]
  const [windowStart, setWindowStart] = useState<number | null>(days[0]?.windows[0]?.start ?? null)
  const [name, setName] = useStoredState('mynuta-eshop-v1-jmeno', () => '')
  const [email, setEmail] = useStoredState('mynuta-eshop-v1-email', () => '')
  const [payment, setPayment] = useState<'online' | 'na-miste'>('online')
  const overStock = shop.lines.filter((line) => line.qty > (productById.get(line.id)?.stock ?? 0))
  const activeWindow = day?.windows.find((window) => window.start === windowStart) ?? day?.windows[0] ?? null
  const missing = [
    !name.trim() && 'jméno na štítek',
    !EMAIL_PATTERN.test(email.trim()) && 'e-mail',
  ].filter(Boolean)
  const ready = Boolean(day) && activeWindow !== null && missing.length === 0 && overStock.length === 0

  const submit = () => {
    if (!ready || !day || !activeWindow) return
    const id = shop.placeOrder({
      items: Object.fromEntries(shop.lines.map((line) => [line.id, line.qty])),
      total: shop.total,
      pickup: `${day.when} ${windowLabel(activeWindow)}`,
      name: name.trim(),
      payment,
    })
    shop.go(['hotovo', id], { replace: true })
  }

  return (
    <>
      <TopBar title="Objednávka" />
      <main className="es-main es-checkout">
        <section className="es-form-section">
          <h2 className="es-subtitle">Kdy si to vyzvedneš</h2>
          <div className="es-pickup">
            {day && activeWindow && (
              <p className="es-pickup-summary" aria-live="polite">Vyzvedneš <strong>{day.when}</strong>, přibližně <strong>{windowLabel(activeWindow)}</strong></p>
            )}
            <span className="es-pickup-label">1. Den</span>
            <div className="es-pickup-grid" role="radiogroup" aria-label="Den výdeje">
              {days.map((candidate) => (
                <button type="button" role="radio" key={candidate.key} className="es-pickup-day" aria-checked={candidate.key === day?.key} onClick={() => { setDayKey(candidate.key); setWindowStart(candidate.windows[0]?.start ?? null) }}>
                  <strong>{candidate.title}</strong><small>{candidate.date}</small>
                </button>
              ))}
            </div>
            <span className="es-pickup-label">2. Přibližně kdy přijdeš</span>
            {day && (
              <div className="es-pickup-grid" role="radiogroup" aria-label="Přibližný čas příchodu">
                {day.windows.map((window) => (
                  <button type="button" role="radio" key={window.start} className="es-pickup-day" aria-checked={window.start === activeWindow?.start} onClick={() => setWindowStart(window.start)}>
                    <strong>{windowLabel(window)}</strong><small>{windowPart(window)}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="es-hint">{nb('Den platí, čas je orientační: od jeho začátku budu mít nákup připravený. Přijít můžeš i později, kdykoli do zavírací doby.')}</p>
        </section>

        <section className="es-form-section">
          <h2 className="es-subtitle">Komu to připravím</h2>
          <label className="es-field">
            <span>Jméno na štítek</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nováková" autoComplete="family-name" enterKeyHint="next" />
          </label>
          <label className="es-field">
            <span>E-mail pro potvrzení</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" inputMode="email" placeholder="ty@email.cz" autoComplete="email" enterKeyHint="done" />
          </label>
        </section>

        <section className="es-form-section">
          <h2 className="es-subtitle">Platba</h2>
          <div className="es-pay" role="radiogroup" aria-label="Platba">
            <button type="button" role="radio" aria-checked={payment === 'online'} className="es-pay-option" onClick={() => setPayment('online')}>
              <BrandIcon name="karta" size={22} />
              <span><strong>Online předem</strong><small>kartou, u pultu jen převezmeš</small></span>
            </button>
            <button type="button" role="radio" aria-checked={payment === 'na-miste'} className="es-pay-option" onClick={() => setPayment('na-miste')}>
              <BrandIcon name="vydejna" size={22} />
              <span><strong>Při vyzvednutí</strong><small>hotově nebo kartou</small></span>
            </button>
          </div>
        </section>

        <section className="es-summary" aria-label="Souhrn">
          <div><span>{itemCount(shop.lines.length)}</span><span>{formatPrice(shop.total + shop.saved)}</span></div>
          {shop.saved > 0 && <div className="es-summary-saved"><span>Akce</span><span>−{formatPrice(shop.saved)}</span></div>}
          <div className="es-summary-total"><span>Celkem</span><strong>{formatPrice(shop.total)}</strong></div>
          {overStock.map((line) => {
            const product = productById.get(line.id)
            return product ? <p key={line.id} className="es-warning">{nb(`${product.name}: mám jen ${product.stock} ks. Uprav množství v tašce.`)}</p> : null
          })}
        </section>
        <p className="es-terms">
          Objednávkou potvrzuješ, že znáš{' '}
          <button type="button" className="es-inline-link" onClick={() => shop.openSheet('info:obchodni-podminky')}>obchodní podmínky</button>
          {' '}a{' '}
          <button type="button" className="es-inline-link" onClick={() => shop.openSheet('info:osobni-udaje')}>zásady ochrany osobních údajů</button>.
        </p>
      </main>

      <div className="es-actionbar es-actionbar-stack">
        {missing.length > 0 && <p className="es-hint">{`Ještě doplň ${missing.join(' a ')}.`}</p>}
        <button type="button" className="es-cta" disabled={!ready} onClick={submit}>
          {payment === 'online' ? 'Objednat a zaplatit' : 'Objednat'} · {formatPrice(shop.total)}
        </button>
      </div>
    </>
  )
}

export function DonePage({ orderId }: { orderId: string }) {
  const shop = useShop()
  const order = shop.history.find((candidate) => candidate.id === orderId)
  if (!order) return <NotFoundPage />
  const count = Object.keys(order.items).length
  const pickup = order.pickup ?? ''
  const when = pickup.slice(0, pickup.lastIndexOf(' '))
  const time = pickup.slice(pickup.lastIndexOf(' ') + 1)

  return (
    <main className="es-main es-done">
      <div className="es-order-tag" role="img" aria-label={`Štítek objednávky: ${order.name}, výdej ${order.pickup}, ${itemCount(count)}`}>
        <span className="es-order-tag-hole" />
        <span className="es-order-tag-check"><Check size={14} strokeWidth={3} /></span>
        <strong>{order.name}</strong>
        <span className="es-order-tag-row">Výdej {when} <b>{time}</b></span>
        <span className="es-order-tag-row">{itemCount(count)}</span>
        <span className="es-order-tag-state"><Check size={14} strokeWidth={3} /> Přijato</span>
      </div>

      <h1>Hotovo, objednávku mám.</h1>
      <p className="es-intro">{nb(`Výdej ${order.pickup} ve výdejně na Slovanech. Nákup bude zabalený a se jménem na tašce.`)}</p>

      <ol className="es-next-steps">
        <li><strong>Přijdeš.</strong>{nb(' V čas výdeje, cestou odkudkoli.')}</li>
        <li><strong>Zkontroluješ.</strong>{nb(' U pultu si nákup projdeš. Co nesedí, hned opravím.')}</li>
        <li><strong>Odcházíš.</strong>{order.payment === 'online' ? nb(' Zaplaceno předem online.') : nb(' Zaplatíš na místě hotově nebo kartou.')}</li>
      </ol>
      <p className="es-hint">{nb('V prototypu se nic neplatí ani neodesílá. Objednávka se jen uložila do historie, takže ji uvidíš v „Tvoje obvyklé“.')}</p>

      <button type="button" className="es-cta" onClick={() => shop.go([], { replace: true })}>Zpět na nákup</button>
    </main>
  )
}

export function NotFoundPage() {
  const shop = useShop()
  return (
    <main className="es-main es-done">
      <h1>Tuhle stránku nemám.</h1>
      <p className="es-intro">Odkaz je asi starý. Zkus to z úvodu.</p>
      <button type="button" className="es-cta" onClick={() => shop.go([], { replace: true })}>Na úvod e-shopu</button>
    </main>
  )
}
