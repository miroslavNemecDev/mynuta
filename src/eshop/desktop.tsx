// Sloupce pro počítač (od 1024 px): vlevo kategorie, vpravo taška. Na mobilu je CSS schová.
import { useState } from 'react'
import { categories, type Category } from './catalog.ts'
import { BrandIcon } from './icons.tsx'
import { BagContents } from './overlays.tsx'
import { pickupDays, pickupLabel } from './slots.ts'
import { useShop } from './ShopContext.ts'
import { formatPrice, itemCount, nb } from './text.ts'

export function DesktopNav({ category, subId, page }: { category?: Category; subId?: string; page: string }) {
  const shop = useShop()
  const [nextDay] = useState(() => pickupDays(new Date(), 1)[0])

  return (
    <aside className="es-side" aria-label="Kategorie">
      <nav className="es-side-nav">
        <button type="button" className="es-side-link" aria-current={page === '' ? 'page' : undefined} onClick={() => shop.go([])}>
          <span className="es-side-icon"><BrandIcon name="taska" size={20} /></span>Nákup
        </button>
        {categories.map((candidate) => {
          const open = candidate.id === category?.id
          return (
            <div key={candidate.id} className="es-side-group">
              <button
                type="button"
                className="es-side-link"
                aria-current={open && !subId ? 'page' : undefined}
                aria-expanded={open}
                onClick={() => shop.go(['k', candidate.id])}
              >
                <span className="es-side-icon" style={{ background: candidate.tone }}><BrandIcon name={candidate.icon} size={20} /></span>
                {candidate.name}
              </button>
              {open && (
                <div className="es-side-subs">
                  {candidate.subs.map((sub) => (
                    <button
                      type="button"
                      key={sub.id}
                      className="es-side-sub"
                      aria-current={sub.id === subId ? 'page' : undefined}
                      onClick={() => shop.go(['k', candidate.id, sub.id], { replace: Boolean(subId) })}
                    >
                      {sub.name}<small>{sub.productIds.length}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        <button type="button" className="es-side-link" aria-current={page === 'recepty' || page === 'recept' ? 'page' : undefined} onClick={() => shop.go(['recepty'])}>
          <span className="es-side-icon es-side-icon-soft"><BrandIcon name="recepty" size={20} /></span>Recepty
        </button>
      </nav>
      {nextDay && (
        <p className="es-side-info">
          <BrandIcon name="hodiny" size={18} />
          <span>{nb('Nejbližší výdej')} <strong>{pickupLabel(nextDay, nextDay.slots[0])}</strong><br />{nb('Plzeň-Slovany · Po–Pá 8–20, So 9–12')}</span>
        </p>
      )}
    </aside>
  )
}

export function DesktopBag({ checkout }: { checkout: boolean }) {
  const shop = useShop()
  const count = shop.lines.length
  return (
    <aside className="es-bagcol" aria-label="Tvoje taška">
      <div className="es-bagcol-head">
        <h2>Tvoje taška</h2>
        {count > 0 && <span>{itemCount(count)}</span>}
      </div>
      <div className="es-bagcol-body"><BagContents /></div>
      {count > 0 && !checkout && (
        <div className="es-bagcol-foot">
          <button type="button" className="es-cta" onClick={() => shop.go(['objednavka'])}>K objednávce · {formatPrice(shop.total)}</button>
        </div>
      )}
    </aside>
  )
}
