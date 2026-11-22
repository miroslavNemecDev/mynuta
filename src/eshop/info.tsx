// Patička a informační stránky (podmínky, reklamace, osobní údaje, kontakt).
// Texty jsou NÁVRH se zákonnými náležitostmi e-shopu s potravinami. Před spuštěním je nechat zkontrolovat.
import { BUSINESS, MISSING } from './business.ts'
import { infoById, type InfoPage } from './infoPages.ts'
import { BrandIcon } from './icons.tsx'
import { useShop } from './ShopContext.ts'
import { TopBar } from './components.tsx'
import { nb } from './text.ts'

/** Obsah stránky. Hranaté závorky a „doplním“ zvýrazní, ať je vidět, co ještě chybí. */
export function InfoContent({ page }: { page: InfoPage }) {
  const mark = (text: string) => text.split(/(\[[^\]]+\]|doplním před spuštěním)/).map((part, index) =>
    part.startsWith('[') || part === MISSING ? <mark key={index} className="es-todo">{part}</mark> : <span key={index}>{nb(part)}</span>)
  return (
    <div className="es-info">
      <p className="es-info-draft">{nb('Návrh textu pro prototyp. Před spuštěním doplnit údaje a nechat zkontrolovat.')}</p>
      <p className="es-intro">{nb(page.summary)}</p>
      {page.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{mark(paragraph)}</p>)}
        </section>
      ))}
    </div>
  )
}

export function InfoPageView({ page }: { page: InfoPage }) {
  return (
    <>
      <TopBar title={page.title} />
      <main className="es-main"><InfoContent page={page} /></main>
    </>
  )
}

export function Footer() {
  const shop = useShop()
  const link = (id: string) => {
    const page = infoById.get(id)
    return page ? <button type="button" className="es-footer-link" onClick={() => shop.go(['info', id])}>{page.title}</button> : null
  }
  return (
    <footer className="es-footer">
      <div className="es-footer-grid">
        <div className="es-footer-brand">
          <img src={`${import.meta.env.BASE_URL}mynuta-logo.svg`} alt="MYNUTA" width={110} height={36} />
          <p>{nb('Objednáš online, vyzvedneš cestou. Bez hledání, nervů a front.')}</p>
        </div>
        <div>
          <h3>Výdejna</h3>
          <p>{BUSINESS.pickupAddress ?? <mark className="es-todo">adresa: {MISSING}</mark>}<br />{BUSINESS.area}</p>
          <dl className="es-footer-hours">
            {BUSINESS.hours.map(([days, time]) => <div key={days}><dt>{days}</dt><dd>{time}</dd></div>)}
          </dl>
        </div>
        <div>
          <h3>Kontakt</h3>
          <p>
            <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a><br />
            {BUSINESS.phone ? <a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`}>{BUSINESS.phone}</a> : <mark className="es-todo">telefon: {MISSING}</mark>}
          </p>
          <p className="es-footer-pay"><BrandIcon name="karta" size={18} /> {nb('Platba online kartou nebo na místě hotově či kartou')}</p>
        </div>
        <nav aria-label="Informace">
          <h3>Nákup</h3>
          {link('obchodni-podminky')}
          {link('reklamace')}
          {link('osobni-udaje')}
          {link('kontakt')}
        </nav>
      </div>
      <p className="es-footer-legal">
        {BUSINESS.brand} · {BUSINESS.operator} · IČO {BUSINESS.ico ?? <mark className="es-todo">{MISSING}</mark>}
        <br />{nb('Prototyp e-shopu. Ceny, zásoby a recepty jsou ukázkové, objednávka se nikam neodešle.')}
      </p>
    </footer>
  )
}
