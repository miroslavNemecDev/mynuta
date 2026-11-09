import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Clock,
  ChevronDown,
  MapPin,
  ShoppingBasket,
} from 'lucide-react'
import './PublicLanding.css'

import bagTrh from './assets/bags/mynuta-taska-papirova/svg/taska-papirova-trh.svg'

function publicAsset(filename: string) {
  return `${import.meta.env.BASE_URL}${filename}`
}

// Česká typografie: nezlomitelná mezera za jednopísmenými předložkami a spojkami i v „leden 2027“,
// nezlomitelný spojovník v „e-mail“ a „e-shop“.
function t(text: string) {
  return text
    .replace(/(?<=^|[\s(„])([kKsSvVzZoOuUaAiI]) /g, '$1\u00a0')
    .replace(/leden 2027/gi, (match) => match.replace(' ', '\u00a0'))
    .replace(/\b(e)-(mail|shop)/gi, '$1\u2011$2')
}

// Stejn\u00e9 za\u0161krtnut\u00ed jako na \u0161t\u00edtku v obr\u00e1zku ta\u0161ky
function TagCheck() {
  return (
    <svg viewBox="33.5 5.5 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M37 12.2l2.2 2.2l4-4.6" />
    </svg>
  )
}

const contactEmail = 'info@mynuta.cz'
const contactLink = <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
// Správce osobních údajů pro text o zpracování e-mailů
const controllerName = 'Miroslav Němec'

function Brand() {
  return (
    <a className="public-brand" href="#nahoru" aria-label="Mynuta, nahoru">
      <img src={publicAsset('mynuta-logo.svg')} alt="MYNUTA" />
      <span className="public-brand-tagline">rychle – do mynuty</span>
    </a>
  )
}

const orderPlaceNames = [
  'z práce', 'z tramvaje', 'ze školky', 'ze školy', 'z tréninku',
  'z procházky', 'z autobusu', 'z trolejbusu', 'z nádraží', 'z fitka',
  'z kroužku', 'z hřiště', 'od doktora', 'z výletu', 'z návštěvy',
  'z bazénu', 'od babičky', 'z parku', 'od kadeřníka', 'z kina',
]
const isSchoolPlace = (place: string) => place.startsWith('ze škol')

// Náhodné pořadí míst. Škola a školka nikdy po sobě, ani při návratu na začátek seznamu.
function shuffledOrderPlaces() {
  const places = [...orderPlaceNames]
  do {
    for (let i = places.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [places[i], places[j]] = [places[j], places[i]]
    }
  } while (places.some((place, i) => isSchoolPlace(place) && isSchoolPlace(places[(i + 1) % places.length])))
  return places.map(t)
}

const steps = [
  { title: 'Objednáš.', text: 'Vybereš si z přibližně 500 druhů zboží a zvolíš čas vyzvednutí.' },
  { title: 'Připravím ti to.', text: 'Na tvůj čas bude nákup zabalený a se jménem na tašce.' },
  { title: 'Zkontroluješ.', text: 'U pultu si ho projdeš. Co nesedí, hned opravím.' },
  { title: 'Odcházíš do minuty.', text: 'Zaplatíš předem online, nebo na místě hotově či kartou.' },
]

const promises = [
  { word: 'Hledání', title: 'Co objednáš, to tam je.', text: 'Nic nehledáš, celý nákup ti dám do tašky já. Kdyby něco došlo, napíšu ti hned, ne až u pultu.' },
  { word: 'Nervy', title: 'Žádné uličky ani vozíky.', text: 'Žádná tlačenice. Jen pult a tašky s tvým jménem.' },
  { word: 'Fronty', title: 'U pultu jsi minutu.', text: 'Tašky čekají připravené. Zkontroluješ je a jdeš.' },
]

const facts = [
  { Icon: ShoppingBasket, title: 'Přibližně 500', text: 'druhů zboží' },
  { Icon: Clock, title: 'Výdej do minuty', text: 'nákup čeká zabalený' },
  { Icon: CalendarDays, title: 'Po–Pá 8–20, So 9–12', text: 'V neděli zavřeno' },
  { Icon: MapPin, title: 'Plzeň-Slovany', text: 'adresu pošlu registrovaným' },
]

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Zdroj registrace z parametru ?z= v adrese, např. ?z=letak
function readSourceParam() {
  const value = new URLSearchParams(window.location.search).get('z')?.trim().toLowerCase()
  return value && /^[a-z0-9_-]{1,40}$/.test(value) ? value : null
}

function PublicLanding() {
  const [orderPlaces] = useState(shuffledOrderPlaces)
  const [orderPlace, setOrderPlace] = useState(0)

  // Rotace začíná až po úvodní animaci, aby první místo bylo vidět celou dobu
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let interval: number | undefined
    const tick = () => setOrderPlace((place) => (place + 1) % orderPlaceNames.length)
    const start = window.setTimeout(() => {
      tick()
      interval = window.setInterval(tick, 2400)
    }, 4000)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(interval)
    }
  }, [])
  const [interestEmail, setInterestEmail] = useState('')
  const [interestState, setInterestState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [interestMessage, setInterestMessage] = useState('')
  const [cameFromHero, setCameFromHero] = useState(false)
  const submitLock = useRef(false)
  const [urlSource] = useState(readSourceParam)
  const source = urlSource ?? (cameFromHero ? 'hero' : 'web')

  const handleInterestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitLock.current || interestState === 'success') return

    const email = interestEmail.trim()
    if (!email) {
      setInterestState('error')
      setInterestMessage('Zadej prosím e-mail.')
      return
    }
    if (!emailPattern.test(email)) {
      setInterestState('error')
      setInterestMessage('Tenhle e-mail vypadá neúplně. Zkontroluj ho prosím.')
      return
    }

    submitLock.current = true
    setInterestState('submitting')
    setInterestMessage('')

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, zdroj: source }),
        signal: controller.signal,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.error || 'Registrace se nepovedla odeslat. Zkus to prosím znovu.')
      }

      setInterestState('success')
      setInterestMessage('Díky! Zapsal jsem tě. Odkaz ti pošlu hned, jak bude e-shop připravený.')
      setInterestEmail('')
    } catch (error) {
      setInterestState('error')
      setInterestMessage(
        error instanceof Error && !(error instanceof TypeError) && error.name !== 'AbortError'
          ? error.message
          : 'Nepodařilo se spojit se serverem. Zkontroluj připojení a zkus to prosím znovu.',
      )
    } finally {
      window.clearTimeout(timeout)
      submitLock.current = false
    }
  }

  return (
    <div className="public-site" id="nahoru">
      <header className="public-header">
        <div className="public-header-inner">
          <Brand />
        </div>
      </header>

      <main>
        <section className="public-hero wrap" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="hero-eyebrow"><span /> VÝDEJNA POTRAVIN · PLZEŇ-SLOVANY</span>
            <h1 id="hero-title">
              <span className="sr-only">Bez hledání, nervů a front.</span>
              <span className="hero-title-line hero-title-struck" aria-hidden="true">
                <s style={{ '--i': 0 } as CSSProperties}>Hledání</s>
                <s style={{ '--i': 1 } as CSSProperties}>Nervy</s>
                <s style={{ '--i': 2 } as CSSProperties}>Fronty</s>
              </span>
              <span className="hero-title-line">Mynuta je <span className="hero-title-accent">jistota</span>.</span>
            </h1>
            <p className="hero-subline">
              <span>Objednáš online,</span>
              <span>vyzvedneš cestou <span className="hero-title-location" key={orderPlace}>{orderPlaces[orderPlace]}</span>.</span>
            </p>
            <a className="hero-cta" href="#zajemci" onClick={() => setCameFromHero(true)}>Chci odkaz jako první <ArrowDown size={18} aria-hidden="true" /></a>
          </div>
          <div className="hero-visual">
            <img className="hero-bag-art" src={bagTrh} alt="Papírová taška Mynuta s nákupem" />
          </div>
        </section>

        <section className="how-section wrap" id="jak-to-funguje" aria-labelledby="how-title">
          <div className="how-copy">
            <span className="section-label">JAK TO FUNGUJE</span>
            <h2 id="how-title">Čtyři kroky. Poslední trvá minutu.</h2>
            <ol className="how-steps">
              {steps.map((step, index) => (
                <li key={step.title}><span aria-hidden="true">{index + 1}</span><div><strong>{t(step.title)}</strong><p>{t(step.text)}</p></div></li>
              ))}
            </ol>
            <p className="how-note">{t('Ovoce a zelenina na kusy nebo v balení. Cenu znáš předem, nic se nedoplácí.')}</p>
          </div>
          <div className="how-visual">
            <div className="order-tag" role="img" aria-label="Štítek objednávky: Nováková, výdej dnes v 17:00, 24 položek, připraveno">
              <span className="order-tag-hole" aria-hidden="true" />
              <span className="order-tag-check" aria-hidden="true"><TagCheck /></span>
              <strong aria-hidden="true">Nováková</strong>
              <span className="order-tag-row" aria-hidden="true">Výdej dnes <b>17:00</b></span>
              <span className="order-tag-row" aria-hidden="true">24 položek</span>
              <span className="order-tag-ready" aria-hidden="true"><TagCheck /> Připraveno</span>
            </div>
          </div>
        </section>

        <section className="promises wrap" aria-label="Tři jistoty">
          {promises.map((promise) => (
            <article className="promise-card" key={promise.word}>
              <s>{promise.word}</s>
              <h3>{t(promise.title)}</h3>
              <p>{t(promise.text)}</p>
            </article>
          ))}
        </section>

        <section className="facts-strip" id="kde-a-kdy" aria-label="Základní informace">
          <ul className="wrap">
            {facts.map(({ Icon, title, text }) => (
              <li key={title}><Icon size={26} strokeWidth={1.8} aria-hidden="true" /><p><strong>{t(title)}</strong><span>{t(text)}</span></p></li>
            ))}
          </ul>
        </section>

        <section className="why-section wrap" aria-labelledby="why-title">
          <span className="section-label" id="why-title">PROČ TO DĚLÁM</span>
          <figure>
            <blockquote>
              {t('Taky tě nebaví trávit půl večera v obchodě? Mě taky. Tak dělám obchod, do kterého bych chtěl chodit sám.')}
            </blockquote>
            <figcaption>Miroslav</figcaption>
          </figure>
        </section>

        <section className="interest-section wrap" id="zajemci">
          <div className="interest-copy"><span className="section-label">REGISTRACE</span><h2>{t('Do obchodu se dostaneš jako první.')}</h2><p>{t('Ceny ukážu, až budou na sto procent jisté, těsně před otevřením. Registrovaní dostanou odkaz do e-shopu dřív než ostatní. Otevření plánuju na leden 2027.')}</p></div>
          <form className="interest-demo" onSubmit={handleInterestSubmit} noValidate>
            <span className="demo-badge"><span /> Odkaz ti pošlu před otevřením</span>
            <label htmlFor="interest-email">{t('Tvůj e-mail')}</label>
            <input type="hidden" name="zdroj" value={source} />
            <input
              id="interest-email"
              name="email"
              type="email"
              autoComplete="email"
              value={interestEmail}
              onChange={(event) => {
                setInterestEmail(event.target.value)
                if (interestState !== 'submitting') {
                  setInterestState('idle')
                  setInterestMessage('')
                }
              }}
              placeholder="ty@email.cz"
              aria-invalid={interestState === 'error'}
              aria-describedby={interestMessage ? 'interest-feedback interest-note' : 'interest-note'}
            />
            <div className="interest-actions">
              <button type="submit" className="button-primary" disabled={interestState === 'submitting'} aria-busy={interestState === 'submitting'}>{interestState === 'submitting' ? 'Odesílám…' : 'Chci odkaz jako první'} <ArrowRight size={18} aria-hidden="true" /></button>
            </div>
            <small id="interest-feedback" role={interestState === 'error' ? 'alert' : 'status'} className={`interest-message ${interestState}`}>{t(interestMessage)}</small>
            <small id="interest-note">{t('E-mail použiju jen k odkazu na e-shop a novinkám Mynuty. Souhlas můžeš kdykoli odvolat.')}</small>
            <details className="privacy-disclosure">
              <summary>{t('Jak naložím s tvým e-mailem?')}<ChevronDown size={18} aria-hidden="true" /></summary>
              <dl>
                <div><dt>{t('Kdo e-maily spravuje')}</dt><dd>{controllerName}, {contactLink}.</dd></div>
                <div><dt>K čemu je použiju</dt><dd>{t('Pošlu ti odkaz do e-shopu před otevřením a občas zprávu o novinkách Mynuty. Nikomu je nepředám.')}</dd></div>
                <div><dt>Jak dlouho je nechám</dt><dd>{t('Dokud se neodhlásíš. Pokud Mynuta neotevře, seznam smažu.')}</dd></div>
                <div><dt>Jak se odhlásit</dt><dd>{t('Napiš na')} {contactLink} {t('a e-mail smažu. Máš také právo na přístup k údajům, jejich opravu i výmaz a můžeš podat stížnost u Úřadu pro ochranu osobních údajů.')}</dd></div>
              </dl>
            </details>
          </form>
        </section>
      </main>

      <footer className="public-footer"><div className="wrap"><Brand /><span className="footer-info"><span>{t('Plzeň-Slovany')}</span><span className="footer-sep" aria-hidden="true">{' · '}</span><span>{t('Plánované otevření: leden 2027')}</span><span className="footer-sep" aria-hidden="true">{' · '}</span>{contactLink}</span><a href="#nahoru">Zpátky nahoru ↑</a></div></footer>
    </div>
  )
}

export default PublicLanding