import { useEffect, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  Apple,
  Check,
  ChevronDown,
  Clock3,
  Coffee,
  CreditCard,
  Egg,
  MapPin,
  Minus,
  Milk,
  PackageCheck,
  Plus,
  QrCode,
  Wheat,
  type LucideIcon,
} from 'lucide-react'
import './PublicLanding.css'

type DemoItem = { name: string; icon: LucideIcon }
type PickupDay = { id: string; date: Date; label: string }
type DemoStage = 'items' | 'time' | 'pay' | 'confirmation' | 'pickup' | 'done'

const demoItems: DemoItem[] = [
  { name: 'Rohlíky', icon: Wheat },
  { name: 'Chléb', icon: Wheat },
  { name: 'Mléko', icon: Milk },
  { name: 'Máslo', icon: PackageCheck },
  { name: 'Vejce', icon: Egg },
  { name: 'Šunka', icon: PackageCheck },
  { name: 'Eidam', icon: PackageCheck },
  { name: 'Banány', icon: Apple },
  { name: 'Jablka', icon: Apple },
  { name: 'Rajčata', icon: Apple },
  { name: 'Minerálka', icon: Coffee },
  { name: 'Káva', icon: Coffee },
]

const categories = [
  ['Pečivo', 'Rohlíky, chléb'],
  ['Mléčné výrobky', 'Mléko, máslo'],
  ['Uzeniny a sýry', 'Šunka, eidam'],
  ['Ovoce a zelenina', 'Jablka, rajčata'],
  ['Nápoje', 'Voda, limonády'],
  ['Trvanlivé potraviny', 'Těstoviny, rýže'],
  ['Základní drogerie', 'Věci pro každý den'],
]

const faqs = [
  ['Je stanovená minimální objednávka?', '[DOPLNIT]'],
  ['Jak se bude platit?', 'Nákup zaplatíš online při objednání. Způsoby platby ještě upřesníme.'],
  ['Jak bude zajištěné chlazené zboží?', '[DOPLNIT]'],
  ['Co když nestihnu vybraný čas?', '[DOPLNIT]'],
  ['Co když s nákupem nebude něco v pořádku?', '[DOPLNIT]'],
  ['Proč máte v neděli zavřeno?', '[DOPLNIT]'],
]

function getPickupDays(): PickupDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const saturdayOffset = (6 - today.getDay() + 7) % 7
  const candidates = [
    { offset: 0, label: 'Dnes' },
    { offset: 1, label: 'Zítra' },
    { offset: saturdayOffset, label: 'Nejbližší sobota' },
  ]
  const seen = new Set<string>()

  return candidates.flatMap(({ offset, label }) => {
    const date = new Date(today)
    date.setDate(date.getDate() + offset)
    const key = date.toISOString().slice(0, 10)
    if (date.getDay() === 0 || seen.has(key) || makePickupTimes(date).length === 0) return []
    seen.add(key)
    return [{ id: key, date, label }]
  })
}

function makePickupTimes(date: Date) {
  const startHour = date.getDay() === 6 ? 9 : 14
  const endHour = date.getDay() === 6 ? 12 : 20
  const times: string[] = []
  for (let minutes = startHour * 60; minutes <= endHour * 60; minutes += 30) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, '0')
    const minute = String(minutes % 60).padStart(2, '0')
    times.push(`${hour}:${minute}`)
  }
  if (date.toDateString() === new Date().toDateString()) {
    const now = new Date()
    return times.filter((time) => {
      const [hour, minute] = time.split(':').map(Number)
      return hour * 60 + minute > now.getHours() * 60 + now.getMinutes()
    })
  }
  return times
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long' }).format(date)
}

function Brand() {
  return (
    <a className="public-brand" href="#nahoru" aria-label="MYNUTA, nahoru">
      <img src="/mynuta-logo.svg" alt="MYNUTA Potraviny" />
      <span className="public-brand-tagline">Rychle, levně – do Mynuty</span>
    </a>
  )
}

function FlowIcon({ kind }: { kind: 'bag' | 'pay' | 'clock' }) {
  if (kind === 'bag') return <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 14h22l-2 20H11L9 14Z" /><path d="M15 15v-3a5 5 0 0 1 10 0v3M15 22h10" /></svg>
  if (kind === 'pay') return <svg viewBox="0 0 40 40" aria-hidden="true"><rect x="7" y="10" width="26" height="20" rx="3" /><path d="M7 17h26M12 24h7" /></svg>
  return <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="13" /><path d="M20 12v9l6 3" /></svg>
}

function PublicLanding() {
  const [stage, setStage] = useState<DemoStage>('items')
  const [quantities, setQuantities] = useState<number[]>(demoItems.map(() => 0))
  const [dayId, setDayId] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [orderCode, setOrderCode] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [interestDemo, setInterestDemo] = useState(false)

  const pickupDays = getPickupDays()
  const activeDay = pickupDays.find((day) => day.id === dayId) ?? pickupDays[0]
  const pickupTimes = activeDay ? makePickupTimes(activeDay.date) : []
  const activeTime = pickupTimes.includes(pickupTime) ? pickupTime : pickupTimes[0] ?? ''
  const itemCount = quantities.reduce((sum, quantity) => sum + quantity, 0)
  const code = orderCode || '----'
  const timerSeconds = Math.min(60, Math.floor((elapsed / 8000) * 60))
  const timerLabel = `${Math.floor(timerSeconds / 60)}:${String(timerSeconds % 60).padStart(2, '0')}`

  useEffect(() => {
    if (stage !== 'pickup' || startedAt === null) return
    const timer = window.setInterval(() => {
      const nextElapsed = Date.now() - startedAt
      setElapsed(nextElapsed)
      if (nextElapsed >= 8000) {
        window.clearInterval(timer)
        setElapsed(8000)
        setStage('done')
      }
    }, 100)
    return () => window.clearInterval(timer)
  }, [stage, startedAt])

  const adjustQuantity = (index: number, change: number) => {
    setQuantities((current) => current.map((quantity, itemIndex) => (
      itemIndex === index ? Math.max(0, quantity + change) : quantity
    )))
  }

  const beginAgain = () => {
    setStage('items')
    setQuantities(demoItems.map(() => 0))
    setPickupTime('')
    setOrderCode('')
    setStartedAt(null)
    setElapsed(0)
  }

  const startPickup = () => {
    setElapsed(0)
    setStartedAt(Date.now())
    setStage('pickup')
  }

  return (
    <div className="public-site" id="nahoru">
      <header className="public-header">
        <div className="public-header-inner">
          <Brand />
          <nav className="public-nav" aria-label="Hlavní navigace">
            <a href="#jak-to-funguje">Jak to funguje</a>
            <a href="#kde-a-kdy">Kde a kdy</a>
            <a className="public-nav-cta" href="#zajemci">Chci vědět o otevření <ArrowRight size={15} /></a>
          </nav>
        </div>
      </header>

      <main>
        <section className="public-hero wrap" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="hero-eyebrow"><span /> NOVÁ VÝDEJNA V PLZNI-SLOVANECH</span>
            <h1 id="hero-title">Nákup objednáš cestou, vyzvedneš za minutu.</h1>
            <p>Malá výdejna potravin na Slovanech pro lidi, kteří nemají čas stát ve frontě. Žádné regály ani fronta u pokladny. Otevření plánujeme na leden 2027.</p>
            <div className="hero-actions">
              <a className="button-primary" href="#demo">Vyzkoušej si, jak to funguje <ArrowRight size={17} /></a>
              <a className="button-quiet" href="#zajemci">Chci vědět o otevření <ArrowDown size={16} /></a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-mark">
              <div className="hero-bag-art" aria-hidden="true"><span className="bag-sun" /><div className="bag-shape"><img className="bag-logo" src="/mynuta-symbol.svg" alt="" /></div></div>
              <span className="visual-note">Tvůj nákup čeká. Ty ne.</span>
            </div>
          </div>
          <div className="hero-flow" aria-label="Vyber v mobilu, zaplať online, vyzvedni za minutu">
            <div className="flow-step"><span className="flow-icon"><FlowIcon kind="bag" /></span><span><small>01</small><strong>Vyber v mobilu</strong></span></div>
            <span className="flow-arrow" aria-hidden="true" />
            <div className="flow-step"><span className="flow-icon"><FlowIcon kind="pay" /></span><span><small>02</small><strong>Zaplať online</strong></span></div>
            <span className="flow-arrow" aria-hidden="true" />
            <div className="flow-step"><span className="flow-icon"><FlowIcon kind="clock" /></span><span><small>03</small><strong>Vyzvedni za minutu</strong></span></div>
          </div>
        </section>

        <section className="minute-section" id="jak-to-funguje">
          <div className="wrap minute-inner">
            <div className="section-heading"><span className="section-label">ŽÁDNÉ POSTÁVÁNÍ</span><h2>Tvoje minuta na místě</h2><p>Tašku připravíme předem. Na místě si ji jen vyzvedneš.</p></div>
            <div className="minute-track">
              <div className="minute-time-labels"><strong>0:00</strong><strong>1:00</strong></div>
              <div className="minute-line" aria-hidden="true"><span /></div>
              <ol className="minute-events"><li>Přijdeš ke dveřím</li><li>Řekneš kód nebo ukážeš QR</li><li>Dostaneš připravenou tašku</li><li>Odcházíš</li></ol>
            </div>
            <p className="minute-note"><Clock3 size={15} /> Minuta je cíl, podle kterého celou výdejnu stavíme.</p>
          </div>
        </section>

        <section className="demo-section wrap" id="demo">
          <div className="section-heading demo-heading"><span className="section-label">MŮŽEŠ SI TO PROJÍT</span><h2>Vyzkoušej si to</h2><p>Je to jen ukázka. Objednávku ani platbu neposíláme.</p></div>
          <div className="demo-layout">
            <div className="demo-explainer"><span className="demo-number">01—05</span><h3>Od výběru<br />k připravené tašce.</h3><p>Proklikej si cestu, která tě čeká. Všechno se děje tady na stránce.</p><button className="demo-reset" onClick={beginAgain}><span>↻</span> Začít znovu</button></div>
            <div className="demo-phone" aria-label="Ukázka objednávky na mobilu">
              <div className="phone-speaker" aria-hidden="true" />
              <div className="phone-screen">
                <div className="demo-topline"><img className="demo-mini-brand" src="/mynuta-logo.svg" alt="MYNUTA Potraviny" /><span className="demo-location"><MapPin size={12} /> Slovany</span></div>
                <div className="demo-badge"><span /> Ukázka – zatím nelze objednat</div>
                <div className="demo-progress" aria-label="Průběh ukázky">
                  {['items', 'time', 'pay', 'confirmation', 'pickup'].map((step, index) => <span key={step} className={stage === 'done' || ['items', 'time', 'pay', 'confirmation', 'pickup'].indexOf(stage) >= index ? 'progress-active' : ''} />)}
                </div>

                {stage === 'items' && <div className="demo-content">
                  <div className="demo-step-title"><span>KROK 1 Z 5</span><h3>Co si dáš do tašky?</h3><p>Vyber si pár věcí na ukázku.</p></div>
                  <div className="demo-items">{demoItems.map(({ name, icon: Icon }, index) => <div className="demo-item" key={name}><span className="demo-item-icon"><Icon size={17} /></span><span>{name}</span><div className="demo-quantity"><button aria-label={`Odebrat ${name}`} onClick={() => adjustQuantity(index, -1)} disabled={quantities[index] === 0}><Minus size={13} /></button><b>{quantities[index]}</b><button aria-label={`Přidat ${name}`} onClick={() => adjustQuantity(index, 1)}><Plus size={13} /></button></div></div>)}</div>
                  <div className="demo-bottom"><span>V košíku <strong>{itemCount} {itemCount === 1 ? 'kus' : itemCount > 1 && itemCount < 5 ? 'kusy' : 'kusů'}</strong></span><button className="demo-next" onClick={() => setStage('time')} disabled={itemCount === 0}>Vybrat čas <ArrowRight size={16} /></button></div>
                </div>}

                {stage === 'time' && <div className="demo-content">
                  <div className="demo-step-title"><span>KROK 2 Z 5</span><h3>Kdy se zastavíš?</h3><p>Vyber den a půlhodinové okno.</p></div>
                  <div className="day-options">{pickupDays.map((day) => <button type="button" key={day.id} className={activeDay?.id === day.id ? 'day-selected' : ''} onClick={() => setDayId(day.id)}><span>{day.label}</span><strong>{formatDate(day.date)}</strong></button>)}</div>
                  {activeDay && <div className="time-picker"><label htmlFor="pickup-time">Čas vyzvednutí</label><div className="select-wrap"><select id="pickup-time" value={activeTime} onChange={(event) => setPickupTime(event.target.value)}>{pickupTimes.map((time) => <option key={time} value={time}>{time}</option>)}</select><ChevronDown size={16} /></div><small>{activeDay.date.getDay() === 6 ? 'Sobota · 9:00–12:00' : 'Pondělí–pátek · 14:00–20:00'}</small></div>}
                  <div className="demo-bottom"><button className="demo-back" onClick={() => setStage('items')}>Zpět</button><button className="demo-next" onClick={() => setStage('pay')} disabled={!activeTime}>Pokračovat <ArrowRight size={16} /></button></div>
                </div>}

                {stage === 'pay' && <div className="demo-content demo-centered">
                  <div className="demo-step-title"><span>KROK 3 Z 5</span><h3>Všechno připravené.</h3><p>Tohle je jen ukázka. Nic se neodesílá a žádné peníze se nestrhnou.</p></div>
                  <div className="payment-preview"><span className="payment-icon"><CreditCard size={20} /></span><span><strong>Platba online</strong><small>Bez zadávání údajů v ukázce</small></span><Check size={17} /></div>
                  <div className="demo-summary-line"><span>Položek v tašce</span><strong>{itemCount}</strong></div>
                  <div className="demo-summary-line"><span>Vyzvednutí</span><strong>{activeDay ? `${activeDay.label}, ${activeTime}` : activeTime}</strong></div>
                  <div className="demo-bottom"><button className="demo-back" onClick={() => setStage('time')}>Zpět</button><button className="demo-next" onClick={() => { setOrderCode(String(Math.floor(1000 + Math.random() * 9000))); setStage('confirmation') }}>Zaplatit (ukázka) <ArrowRight size={16} /></button></div>
                </div>}

                {stage === 'confirmation' && <div className="demo-content demo-centered">
                  <div className="demo-step-title"><span>KROK 4 Z 5</span><h3>Taška je připravená.</h3><p>Ukázková objednávka je hotová.</p></div>
                  <div className="code-ticket"><span>TVŮJ UKÁZKOVÝ KÓD</span><strong>{code}</strong><QrCode size={23} /></div>
                  <div className="demo-summary-line"><span>V tašce</span><strong>{demoItems.filter((_, index) => quantities[index] > 0).map((item) => `${item.name} × ${quantities[demoItems.indexOf(item)]}`).join(', ')}</strong></div>
                  <div className="demo-summary-line"><span>Vyzvednutí</span><strong>{activeDay ? `${activeDay.label}, ${activeTime}` : activeTime}</strong></div>
                  <p className="pickup-instruction">U výdeje řekni kód. Tašku máš připravenou, do minuty jsi venku.</p>
                  <button className="demo-next demo-wide" onClick={startPickup}>Jsem u výdeje <ArrowRight size={16} /></button>
                </div>}

                {stage === 'pickup' && <div className="demo-content demo-centered pickup-running">
                  <div className="demo-step-title"><span>KROK 5 Z 5</span><h3>Vyzvednutí</h3><p>Takto proběhne tvoje minuta na místě.</p></div>
                  <div className="countdown-face" style={{ '--timer-progress': `${Math.min(100, (elapsed / 8000) * 100)}%` } as React.CSSProperties}><span>{timerLabel}</span><small>NA MÍSTĚ</small></div>
                  <ol className="pickup-checklist"><li className={elapsed >= 0 ? 'check-active' : ''}><span><Check size={13} /></span>Taška je připravená předem</li><li className={elapsed >= 2600 ? 'check-active' : ''}><span><Check size={13} /></span>Kontrola kódu <b>{code}</b></li><li className={elapsed >= 5200 ? 'check-active' : ''}><span><Check size={13} /></span>Předání tašky</li></ol>
                </div>}

                {stage === 'done' && <div className="demo-content demo-centered demo-finished">
                  <span className="done-check"><Check size={25} /></span><div className="demo-step-title"><span>HOTOVO</span><h3>Hotovo, tolik času ti nákup zabral na místě.</h3><p>V ukázce to bylo {timerLabel}. Skutečným cílem je vejít se do minuty.</p></div>
                  <a className="demo-next demo-wide demo-cta-link" href="#zajemci">Chci to zkusit naostro <ArrowRight size={16} /></a>
                  <button className="demo-back" onClick={beginAgain}>Začít znovu</button>
                </div>}
              </div>
              <span className="phone-home" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="difference-section">
          <div className="wrap">
            <div className="section-heading"><span className="section-label">JINÝ ZPŮSOB NÁKUPU</span><h2>Čím se MYNUTA liší</h2></div>
            <div className="comparison" role="table" aria-label="Srovnání způsobů nákupu">
              <div className="comparison-row comparison-head" role="row"><div role="columnheader"> </div><div role="columnheader">Běžný obchod</div><div role="columnheader">Rozvoz domů</div><div role="columnheader" className="mynuta-column">MYNUTA</div></div>
              {[
                ['Kde ztrácíš čas', 'Mezi regály a u pokladny', 'Čekáním doma', 'Jen cestou k nám'],
                ['Musíš na nákup čekat doma?', 'Ne', 'Ano', 'Ne, vyzvedneš cestou'],
                ['Fronta', 'Může se stát', 'U pokladny ne', 'Bez fronty u pokladny'],
                ['Kdy se to hodí', 'Když máš čas nakoupit', 'Když jsi doma', 'Po směně, cestou z práce, s dětmi'],
              ].map(([label, store, delivery, mynuta]) => <div className="comparison-row" role="row" key={label}><div className="comparison-label" role="rowheader">{label}</div><div data-label="Běžný obchod" role="cell">{store}</div><div data-label="Rozvoz domů" role="cell">{delivery}</div><div data-label="MYNUTA" role="cell" className="mynuta-column">{mynuta}</div></div>)}
            </div>
          </div>
        </section>

        <section className="people-section wrap">
          <div className="section-heading"><span className="section-label">PRO KOHO TO JE</span><h2>Pro tvůj běžný den</h2></div>
          <div className="people-grid">{[
            ['Po ranní směně', 'Cestou domů vyzvedneš, co ti chybí.'],
            ['Cestou z práce', 'Nákup už na tebe čeká.'],
            ['S dětmi', 'Méně postávání, rychle zpátky venku.'],
            ['Bez front', 'Když chceš nakoupit a pokračovat dál.'],
          ].map(([title, text], index) => <article className="people-item" key={title}><span className="people-index">0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section className="goods-section">
          <div className="wrap goods-inner"><div className="section-heading"><span className="section-label">NA KAŽDÝ TÝDEN</span><h2>Co u nás koupíš</h2><p>Nejsme supermarket. Budeme mít hlavně to, co lidé kupují každý týden.</p></div><div className="goods-list">{categories.map(([name, examples], index) => <div className="goods-row" key={name}><span>0{index + 1}</span><strong>{name}</strong><small>{examples}</small></div>)}</div></div>
        </section>

        <section className="place-section wrap" id="kde-a-kdy">
          <div className="place-copy"><span className="section-label">BLÍZKO DOMOVA</span><h2>Kde a kdy</h2><p className="place-name"><MapPin size={21} /> Plzeň-Slovany</p><p>Přesnou adresu zveřejníme po podpisu smlouvy.</p><div className="opening-hours"><div><strong>Po–Pá</strong><span>14:00–20:00</span></div><div><strong>Sobota</strong><span>9:00–12:00</span></div><div><strong>Neděle</strong><span>Zavřeno</span></div></div></div>
          <div className="place-art" aria-hidden="true"><div className="place-map"><span className="map-road map-road-one" /><span className="map-road map-road-two" /><span className="map-park" /><span className="map-pin"><MapPin size={23} /></span><span className="map-label">SLOVANY</span></div><span className="place-art-note">Malá výdejna.<br />Velká úspora času.</span></div>
        </section>

        <section className="timeline-section">
          <div className="wrap"><div className="section-heading"><span className="section-label">KDE PROJEKT JE</span><h2>Nejdřív prostor, pak výdejna.</h2></div>
            <div className="project-timeline"><article><span className="timeline-dot timeline-current" /><span className="timeline-date">ŘÍJEN–LISTOPAD 2026</span><h3>Zjišťujeme zájem a hledáme prostor</h3><small>Právě teď</small></article><article><span className="timeline-dot" /><span className="timeline-date">PROSINEC 2026</span><h3>Příprava prostoru</h3></article><article><span className="timeline-dot" /><span className="timeline-date">LEDEN 2027</span><h3>Otevření</h3><small>Plán</small></article></div>
          </div>
        </section>

        <section className="interest-section wrap" id="zajemci">
          <div className="interest-copy"><span className="section-label">POMOZ NÁM ZAČÍT</span><h2>Chceš vědět, až otevřeme?</h2><p>Zjišťujeme, jestli by se ti taková výdejna hodila. Zatím tu ukazujeme, jak bude přihlášení vypadat.</p></div>
          <div className="interest-demo"><span className="demo-badge"><span /> Ukázka – zatím se nikam neposílá</span><label htmlFor="interest-email">Tvůj e-mail</label><input id="interest-email" type="email" placeholder="ty@email.cz" disabled={!interestDemo} aria-describedby="interest-note" /><button className="button-primary" onClick={() => setInterestDemo(true)}>{interestDemo ? 'Formulář je jen ukázka' : 'Ukázat přihlášení'} <ArrowRight size={16} /></button><small id="interest-note">Tahle ukázka nic neodesílá ani neukládá. Kontaktní formulář doplníme před otevřením.</small></div>
        </section>

        <section className="faq-section wrap">
          <div className="section-heading"><span className="section-label">NA CO SE MOŽNÁ PTÁŠ</span><h2>Časté otázky</h2></div>
          <div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={18} /></summary><p>{answer}</p></details>)}</div>
        </section>
      </main>

      <footer className="public-footer"><div className="wrap"><Brand /><span>Plzeň-Slovany · Otevření plánujeme na leden 2027</span><a href="#nahoru">Zpátky nahoru ↑</a></div></footer>
    </div>
  )
}

export default PublicLanding