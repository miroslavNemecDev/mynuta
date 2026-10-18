import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowRight,
  Check,
  Clock,
  ChevronDown,
  MapPin,
  Minus,
  Plus,
  ShoppingBasket,
} from 'lucide-react'
import './PublicLanding.css'
import { playBagIntro, type BagIntro } from './heroBagIntro'

import kartaIcon from './assets/icons/svg-svetle/karta.svg'
import qrIcon from './assets/icons/svg-svetle/qr.svg'
import mobilIcon from './assets/icons/svg-svetle/mobil.svg'
import pecivoIcon from './assets/icons/svg-svetle/pecivo.svg'
import mlekoIcon from './assets/icons/svg-svetle/mleko.svg'
import vejceIcon from './assets/icons/svg-svetle/vejce.svg'
import ovoceIcon from './assets/icons/svg-svetle/ovoce.svg'
import zeleninaIcon from './assets/icons/svg-svetle/zelenina.svg'
import masoIcon from './assets/icons/svg-svetle/maso.svg'
import napojeIcon from './assets/icons/svg-svetle/napoje.svg'
import bagPekarna from './assets/bags/mynuta-taska-papirova/svg/taska-papirova-pekarna.svg'
import bagSnidane from './assets/bags/mynuta-taska-papirova/svg/taska-papirova-snidane.svg'
import bagTrh from './assets/bags/mynuta-taska-papirova/svg/taska-papirova-trh.svg'

type DemoItem = { name: string; icon: string }
type PickupDay = { id: string; date: Date; label: string }
type DemoStage = 'items' | 'time' | 'pay' | 'confirmation' | 'pickup' | 'done'
type Faq = { id?: string; question: string; answer: ReactNode }

const bagLoaders = import.meta.glob<string>('./assets/bags/mynuta-taska-papirova/svg/taska-papirova-*.svg', { query: '?raw', import: 'default' })
const bagLoaderKeys = Object.keys(bagLoaders).sort()

function publicAsset(filename: string) {
  return `${import.meta.env.BASE_URL}${filename}`
}

const demoItems: DemoItem[] = [
  { name: 'Rohlíky', icon: pecivoIcon },
  { name: 'Chléb', icon: pecivoIcon },
  { name: 'Mléko', icon: mlekoIcon },
  { name: 'Máslo', icon: mlekoIcon },
  { name: 'Vejce', icon: vejceIcon },
  { name: 'Šunka', icon: masoIcon },
  { name: 'Eidam', icon: masoIcon },
  { name: 'Banány', icon: ovoceIcon },
  { name: 'Jablka', icon: ovoceIcon },
  { name: 'Rajčata', icon: zeleninaIcon },
  { name: 'Minerálka', icon: napojeIcon },
  { name: 'Káva', icon: napojeIcon },
]

const commonCzechSurnames = [
  'Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý',
  'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec',
  'Marek', 'Pospíšil', 'Pokorný', 'Hájek', 'Jelínek',
  'Král', 'Růžička', 'Beneš', 'Fiala', 'Sedláček',
]

const ticketTimeOptions = Array.from({ length: 13 }, (_, index) => `${String(index + 8).padStart(2, '0')}:00`)

function pickRandomTime(current: string) {
  const candidates = ticketTimeOptions.filter((time) => time !== current)
  return candidates[Math.floor(Math.random() * candidates.length)]
}

const contactEmail = 'info@mynuta.cz'
const contactLink = <a href={`mailto:${contactEmail}`}>{contactEmail}</a>

const faqs: Faq[] = [
  { question: 'Za jak dlouho bude nákup připravený?', answer: 'Skladové věci připravíme do 30 minut, ostatní nejdřív další otevírací den. O připravení ti pošleme e-mail.' },
  { question: 'Je stanovená minimální objednávka?', answer: 'Zatím ne. Podmínky objednávek i ceník zveřejníme před otevřením.' },
  { question: 'Do kdy můžu objednat a co když nestihnu vyzvednutí?', answer: 'Objednat můžeš nejpozději 30 minut před zavřením. Pokud nestihneš vybraný čas, nákup na tebe počká do konce otevírací doby a chlazené věci zůstanou v lednici. Když výdej nestihneš vůbec, ozvi se nám. Možnost zrušení objednávky a vrácení peněz posoudíme individuálně.' },
  { question: 'Jak bude zajištěné chlazené zboží?', answer: 'Chlazené a mražené věci čekají až do výdeje v lednici a mrazáku. Teplotu v nich hlídají čidla.' },
  { question: 'Co když s nákupem nebude něco v pořádku?', answer: <>Tašku si můžeš zkontrolovat hned u výdeje. Když na něco přijdeš až doma, napiš na {contactLink}. Chybějící věci ti vrátíme na kartu, vadné vyměníme, nebo vrátíme peníze.</> },
  { id: 'faq-email', question: 'Co uděláte s mým e-mailem?', answer: <>Použijeme ho jen ke zprávám o otevření a novinkám MYNUTY a nikomu ho nedáme. Odhlásit se můžeš kdykoli, stačí napsat na {contactLink}. Kdyby MYNUTA neotevřela, seznam smažeme. Správcem údajů je Miroslav Němec. Máš právo na přístup k údajům, jejich opravu i výmaz a můžeš podat stížnost u Úřadu pro ochranu osobních údajů.</> },
]

function getPickupDays(): PickupDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days: PickupDay[] = []

  for (let offset = 0; offset <= 7; offset += 1) {
    const date = new Date(today)
    date.setDate(date.getDate() + offset)
    const key = date.toISOString().slice(0, 10)
    if (date.getDay() === 0 || makePickupTimes(date).length === 0) continue

    const label = offset === 0
      ? 'Dnes'
      : offset === 1
        ? 'Zítra'
        : new Intl.DateTimeFormat('cs-CZ', { weekday: 'long' }).format(date)
    days.push({ id: key, date, label })
  }

  return days
}

function makePickupTimes(date: Date) {
  const startHour = date.getDay() === 6 ? 9 : 8
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

function formatPickupSummary(day: PickupDay, time: string) {
  const date = new Intl.DateTimeFormat('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(day.date)
  return `${date} v ${time}`
}

function Brand() {
  return (
    <a className="public-brand" href="#nahoru" aria-label="MYNUTA, nahoru">
      <img src={publicAsset('mynuta-logo.svg')} alt="MYNUTA" />
      <span className="public-brand-tagline">rychle – do mynuty</span>
    </a>
  )
}

function PublicLanding() {
  const [stage, setStage] = useState<DemoStage>('items')
  const [quantities, setQuantities] = useState<number[]>(demoItems.map(() => 0))
  const [pickupChoice, setPickupChoice] = useState<'first' | 'second' | 'custom'>('first')
  const [customDayId, setCustomDayId] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [orderCode, setOrderCode] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [interestEmail, setInterestEmail] = useState('')
  const [interestState, setInterestState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [interestMessage, setInterestMessage] = useState('')
  const [activeBagIndex] = useState<number>(() => Math.floor(Math.random() * 3))
  const [ticketName, setTicketName] = useState<string | null>(null)
  const [demoTicketName, setDemoTicketName] = useState('')
  const [surnameIndex, setSurnameIndex] = useState(0)
  const [ticketPickupTime, setTicketPickupTime] = useState(() => pickRandomTime(''))
  const [ticketTimeMenuOpen, setTicketTimeMenuOpen] = useState(false)
  const timeListDrag = useRef({ active: false, moved: false, startY: 0, startScroll: 0 })
  const ticketTimeTouched = useRef(false)
  const bagMountRef = useRef<HTMLDivElement>(null)
  const [bagFailed, setBagFailed] = useState(false)
  const [bagTapDelay, setBagTapDelay] = useState<number | null>(null)
  const [introDone, setIntroDone] = useState(false)
  const [ticketTimeShown, setTicketTimeShown] = useState(false)

  const bagVariants = [bagPekarna, bagSnidane, bagTrh]

  const pickupDays = getPickupDays()
  const quickPickupDays = pickupDays.slice(0, 2)
  const customPickupDays = pickupDays.slice(quickPickupDays.length)
  const activeDay = pickupChoice === 'custom'
    ? customPickupDays.find((day) => day.id === customDayId) ?? customPickupDays[0]
    : pickupChoice === 'second'
      ? quickPickupDays[1] ?? quickPickupDays[0]
      : quickPickupDays[0]
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

  useEffect(() => {
    const mount = bagMountRef.current
    if (!mount) return
    let cancelled = false
    let intro: BagIntro | undefined
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    bagLoaders[bagLoaderKeys[activeBagIndex]]()
      .then((markup) => {
        if (cancelled) return
        mount.innerHTML = markup
        if (reduceMotion) {
          setIntroDone(true)
          return
        }
        intro = playBagIntro(
          mount,
          () => { if (!cancelled) setIntroDone(true) },
          () => {
            if (cancelled) return
            setSurnameIndex((current) => (current + 1) % commonCzechSurnames.length)
            if (!ticketTimeTouched.current) setTicketPickupTime(pickRandomTime)
          },
        )
        setBagTapDelay(intro.tapDelayMs)
      })
      .catch(() => {
        if (cancelled) return
        setBagFailed(true)
        setIntroDone(true)
      })

    return () => {
      cancelled = true
      intro?.stop()
      mount.innerHTML = ''
    }
  }, [activeBagIndex])

  useEffect(() => {
    if (ticketName !== null || !introDone) return

    const surname = commonCzechSurnames[surnameIndex]
    let timer: number
    let characterCount = 0

    const typeNextCharacter = () => {
      characterCount += 1
      setDemoTicketName(surname.slice(0, characterCount))

      if (characterCount < surname.length) {
        timer = window.setTimeout(typeNextCharacter, 115)
      }
    }

    timer = window.setTimeout(() => {
      setDemoTicketName('')
      if (surnameIndex > 0 && !ticketTimeTouched.current) setTicketPickupTime(pickRandomTime)
      setTicketTimeShown(true)
      typeNextCharacter()
    }, surnameIndex === 0 ? 250 : 0)
    return () => window.clearTimeout(timer)
  }, [surnameIndex, ticketName, introDone])

  const adjustQuantity = (index: number, change: number) => {
    setQuantities((current) => current.map((quantity, itemIndex) => (
      itemIndex === index ? Math.max(0, quantity + change) : quantity
    )))
  }

  const beginAgain = () => {
    setStage('items')
    setQuantities(demoItems.map(() => 0))
    setPickupChoice('first')
    setCustomDayId('')
    setPickupTime('')
    setOrderCode('')
    setStartedAt(null)
    setElapsed(0)
  }

  const handleInterestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const email = interestEmail.trim()
    if (!email) {
      setInterestState('error')
      setInterestMessage('Zadej prosím e-mail.')
      return
    }

    setInterestState('submitting')
    setInterestMessage('')

    try {
      console.log('Submitting contact form', { email })

      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json().catch(() => ({}))
      console.log('Subscribe response', { status: response.status, body: data })

      if (!response.ok) {
        throw new Error(data?.error || 'Přihlášení se nepovedlo odeslat.')
      }

      setInterestState('success')
      setInterestMessage('Děkujeme! Přihlášení jsme přijali. Brzy se ozveme.')
      setInterestEmail('')
    } catch (error) {
      setInterestState('error')
      setInterestMessage(error instanceof Error ? error.message : 'Něco se nepovedlo. Zkus to prosím znovu.')
    }
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
        </div>
      </header>

      <main>
        <section className="public-hero wrap" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="hero-eyebrow"><span /> NOVÁ VÝDEJNA V PLZNI-SLOVANECH</span>
            <h1 id="hero-title">Objednej v klidu. Vyzvedni za minutu.</h1>
            <p>Otevření plánujeme na leden 2027.</p>
          </div>
          <div className="hero-visual">
            <div className="hero-mark">
              <div
                className={`hero-bag-art${bagTapDelay !== null ? ' is-playing' : ''}`}
                style={bagTapDelay !== null ? ({ '--bag-tap-delay': `${bagTapDelay}ms` } as React.CSSProperties) : undefined}
              >
                {bagFailed
                  ? <img className="bag-asset" src={bagVariants[activeBagIndex]} alt="" aria-hidden="true" />
                  : <div className="bag-asset" ref={bagMountRef} aria-hidden="true" />}
                <div className="bag-phone-layer">
                  <button
                    type="button"
                    className="bag-phone"
                    aria-label="Vyzkoušet ukázkovou objednávku"
                    title="Vyzkoušet objednávku"
                    onClick={() => {
                      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                      const demo = document.querySelector<HTMLDetailsElement>('#demo .demo-disclosure')
                      if (demo) demo.open = true
                      document.getElementById('demo')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
                    }}
                  >
                    <svg className="bag-phone-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 3.2V19l4.1-3.8 2.8 6.2 2.6-1.2-2.7-6 5.7-.2z" /></svg>
                    <span className="bag-phone-notch" aria-hidden="true" />
                    <span className="bag-phone-screen" aria-hidden="true">
                      <span className="bag-phone-top"><i /><i /></span>
                      <span className="bag-phone-row"><i /><i /></span>
                      <span className="bag-phone-row"><i /><i /></span>
                      <span className="bag-phone-row"><i /><i /></span>
                      <b />
                    </span>
                  </button>
                </div>
                <div className="ticket-name-layer">
                  <input
                    id="ticket-name"
                    className={`ticket-name-input${introDone ? ' is-ready' : ''}`}
                    type="text"
                    aria-label="Příjmení na lístku"
                    title="Jméno na lístku"
                    value={ticketName ?? demoTicketName}
                    maxLength={18}
                    placeholder="_"
                    autoComplete="off"
                    spellCheck={false}
                    onFocus={(event) => {
                      if (ticketName === null) {
                        setTicketName(demoTicketName)
                        event.currentTarget.select()
                      }
                    }}
                    onChange={(event) => setTicketName(event.target.value)}
                    onBlur={(event) => {
                      if (!event.currentTarget.value.trim()) setTicketName(null)
                    }}
                  />
                </div>
                <div
                  className="ticket-time-control"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setTicketTimeMenuOpen(false)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') setTicketTimeMenuOpen(false)
                  }}
                >
                  <button
                    type="button"
                    className="ticket-time-button"
                    aria-label="Změnit čas na lístku"
                    aria-expanded={ticketTimeMenuOpen}
                    aria-controls="ticket-time-menu"
                    onClick={() => {
                      ticketTimeTouched.current = true
                      setTicketTimeShown(true)
                      setTicketTimeMenuOpen((open) => !open)
                    }}
                  >
                    {(ticketTimeShown || ticketName !== null) && <span key={ticketPickupTime} className="ticket-time-value">{ticketPickupTime}</span>}
                  </button>
                  {ticketTimeMenuOpen && <div className="ticket-time-menu" id="ticket-time-menu">
                    <div
                      className="ticket-time-options"
                      role="group"
                      aria-label="Nabízené časy"
                      onPointerDown={(event) => {
                        if (event.pointerType === 'touch') return
                        timeListDrag.current = { active: true, moved: false, startY: event.clientY, startScroll: event.currentTarget.scrollTop }
                      }}
                      onPointerMove={(event) => {
                        const drag = timeListDrag.current
                        if (!drag.active) return
                        const distance = event.clientY - drag.startY
                        if (!drag.moved && Math.abs(distance) > 4) {
                          drag.moved = true
                          event.currentTarget.setPointerCapture(event.pointerId)
                        }
                        if (drag.moved) event.currentTarget.scrollTop = drag.startScroll - distance
                      }}
                      onPointerUp={(event) => {
                        timeListDrag.current.active = false
                        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
                      }}
                      onPointerCancel={() => { timeListDrag.current.active = false }}
                      onClickCapture={(event) => {
                        if (!timeListDrag.current.moved) return
                        timeListDrag.current.moved = false
                        event.preventDefault()
                        event.stopPropagation()
                      }}
                    >
                      {ticketTimeOptions.map((time) => <button
                        type="button"
                        key={time}
                        aria-pressed={ticketPickupTime === time}
                        className={ticketPickupTime === time ? 'ticket-time-option selected' : 'ticket-time-option'}
                        onClick={() => {
                          setTicketPickupTime(time)
                          setTicketTimeMenuOpen(false)
                        }}
                      >{time}</button>)}
                    </div>
                    <label className="ticket-time-custom"><span>Jiný:</span><input
                      type="time"
                      aria-label="Vlastní čas na lístku"
                      value={ticketPickupTime}
                      onChange={(event) => setTicketPickupTime(event.target.value)}
                    /></label>
                  </div>}
                </div>
              </div>
            </div>
          </div>
          <div className="hero-flow" role="list" aria-label="Tři kroky nákupu">
            <div className="flow-step" role="listitem"><span className="flow-icon"><img src={mobilIcon} alt="" aria-hidden="true" className="flow-custom-icon" /></span><strong>Objednej</strong></div>
            <ArrowRight className="flow-arrow" size={18} aria-hidden="true" />
            <div className="flow-step" role="listitem"><span className="flow-icon"><img src={kartaIcon} alt="" aria-hidden="true" className="flow-custom-icon" /></span><strong>Zaplať</strong></div>
            <ArrowRight className="flow-arrow" size={18} aria-hidden="true" />
            <div className="flow-step" role="listitem"><span className="flow-icon"><img src={qrIcon} alt="" aria-hidden="true" className="flow-custom-icon" /></span><strong>Vyzvedni</strong></div>
          </div>
        </section>

        <section className="demo-section wrap" id="demo">
          <details className="demo-disclosure">
            <summary className="demo-disclosure-summary"><span className="demo-summary-copy"><span className="section-label">INTERAKTIVNÍ UKÁZKA</span><strong>Prohlédnout objednávku krok za krokem</strong><small>Nic se neobjedná ani neplatí.</small></span><ChevronDown size={19} aria-hidden="true" /></summary>
            <div className="demo-layout">
            <div className="demo-explainer"><span className="demo-number">5 KROKŮ</span><h3>Od výběru k vyzvednutí.</h3><p>Proklikáš si nákup, jak bude fungovat v praxi.</p><button className="demo-reset" onClick={beginAgain}><span>↻</span> Začít znovu</button></div>
            <div className="demo-phone" aria-label="Ukázka objednávky na mobilu">
              <div className="phone-speaker" aria-hidden="true" />
              <div className="phone-screen">
                <div className="demo-topline"><img className="demo-mini-brand" src={publicAsset('mynuta-logo.svg')} alt="MYNUTA Potraviny" /><span className="demo-location"><MapPin size={12} /> Slovany</span></div>
                <div className="demo-badge"><span /> Ukázka – zatím nelze objednat</div>
                <div className="demo-progress" aria-label="Průběh ukázky">
                  {['items', 'time', 'pay', 'confirmation', 'pickup'].map((step, index) => <span key={step} className={stage === 'done' || ['items', 'time', 'pay', 'confirmation', 'pickup'].indexOf(stage) >= index ? 'progress-active' : ''} />)}
                </div>

                {stage === 'items' && <div className="demo-content">
                  <div className="demo-step-title"><span>KROK 1 Z 5</span><h3>Co si dáš do tašky?</h3><p>Vyber si pár věcí na ukázku.</p></div>
                  <div className="demo-items">{demoItems.map(({ name, icon }, index) => <div className="demo-item" key={name}><span className="demo-item-icon"><img src={icon} alt="" aria-hidden="true" className="demo-item-custom-icon" /></span><span>{name}</span><div className="demo-quantity"><button aria-label={`Odebrat ${name}`} onClick={() => adjustQuantity(index, -1)} disabled={quantities[index] === 0}><Minus size={13} /></button><b>{quantities[index]}</b><button aria-label={`Přidat ${name}`} onClick={() => adjustQuantity(index, 1)}><Plus size={13} /></button></div></div>)}</div>
                  <div className="demo-bottom"><span>V košíku <strong>{itemCount} {itemCount === 1 ? 'kus' : itemCount > 1 && itemCount < 5 ? 'kusy' : 'kusů'}</strong></span><button className="demo-next" onClick={() => setStage('time')} disabled={itemCount === 0}>Vybrat čas <ArrowRight size={16} /></button></div>
                </div>}

                {stage === 'time' && <div className="demo-content">
                  <div className="demo-step-title"><span>KROK 2 Z 5</span><h3>Kdy se zastavíš?</h3><p>Vyber nejbližší termín nebo den až týden dopředu.</p></div>
                  <div className="day-options" aria-label="Rychlý výběr dne">
                    {quickPickupDays.map((day, index) => {
                      const choice = index === 0 ? 'first' : 'second'
                      return <button type="button" key={day.id} className={pickupChoice === choice ? 'day-selected' : ''} aria-pressed={pickupChoice === choice} onClick={() => setPickupChoice(choice)}><span>{day.label}</span><strong>{formatDate(day.date)}</strong></button>
                    })}
                    <button type="button" className={pickupChoice === 'custom' ? 'day-selected' : ''} aria-pressed={pickupChoice === 'custom'} onClick={() => setPickupChoice('custom')}><span>Jiný den</span><strong>Až týden</strong></button>
                  </div>
                  {pickupChoice === 'custom' && <div className="custom-day-picker"><label htmlFor="custom-pickup-day">Den vyzvednutí</label><div className="select-wrap"><select id="custom-pickup-day" value={activeDay?.id ?? ''} onChange={(event) => setCustomDayId(event.target.value)}>{customPickupDays.map((day) => <option key={day.id} value={day.id}>{day.label}, {formatDate(day.date)}</option>)}</select><ChevronDown size={16} /></div></div>}
                  {activeDay && <div className="time-picker"><label htmlFor="pickup-time">Čas vyzvednutí</label><div className="select-wrap"><select id="pickup-time" value={activeTime} onChange={(event) => setPickupTime(event.target.value)}>{pickupTimes.map((time) => <option key={time} value={time}>{time}</option>)}</select><ChevronDown size={16} /></div><small>{activeDay.date.getDay() === 6 ? 'Sobota · 9:00–12:00' : 'Pondělí–pátek · 8:00–20:00'}</small></div>}
                  <div className="demo-bottom"><button className="demo-back" onClick={() => setStage('items')}>Zpět</button><button className="demo-next" onClick={() => setStage('pay')} disabled={!activeTime}>Pokračovat <ArrowRight size={16} /></button></div>
                </div>}

                {stage === 'pay' && <div className="demo-content demo-centered">
                  <div className="demo-step-title"><span>KROK 3 Z 5</span><h3>Všechno připravené.</h3><p>Tohle je jen ukázka. Nic se neodesílá a žádné peníze se nestrhnou.</p></div>
                  <div className="payment-preview"><span className="payment-icon"><img src={kartaIcon} alt="" aria-hidden="true" className="payment-custom-icon" /></span><span><strong>Platba online</strong><small>Bez zadávání údajů v ukázce</small></span><Check size={17} /></div>
                  <div className="demo-summary-line"><span>Položek v tašce</span><strong>{itemCount}</strong></div>
                  <div className="demo-summary-line"><span>Vyzvednutí</span><strong>{activeDay ? formatPickupSummary(activeDay, activeTime) : activeTime}</strong></div>
                  <div className="demo-bottom"><button className="demo-back" onClick={() => setStage('time')}>Zpět</button><button className="demo-next" onClick={() => { setOrderCode(String(Math.floor(1000 + Math.random() * 9000))); setStage('confirmation') }}>Zaplatit (ukázka) <ArrowRight size={16} /></button></div>
                </div>}

                {stage === 'confirmation' && <div className="demo-content demo-centered">
                  <div className="demo-step-title"><span>KROK 4 Z 5</span><h3>Taška je připravená.</h3><p>Ukázková objednávka je hotová.</p></div>
                  <div className="code-ticket"><span>TVŮJ UKÁZKOVÝ KÓD</span><strong>{code}</strong><img src={qrIcon} alt="" aria-hidden="true" className="code-ticket-icon" /></div>
                  <div className="demo-summary-line"><span>V tašce</span><strong>{demoItems.filter((_, index) => quantities[index] > 0).map((item) => `${item.name} × ${quantities[demoItems.indexOf(item)]}`).join(', ')}</strong></div>
                  <div className="demo-summary-line"><span>Vyzvednutí</span><strong>{activeDay ? formatPickupSummary(activeDay, activeTime) : activeTime}</strong></div>
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
          </details>
        </section>

        <section className="goods-section" id="kde-a-kdy">
          <div className="wrap goods-facts">
            <h2 className="goods-facts-label section-label">NABÍDKA A VÝDEJ</h2>
            <div className="goods-fact"><ShoppingBasket size={26} strokeWidth={1.8} aria-hidden="true" /><p><strong>~500</strong><span>věcí na každý den</span></p></div>
            <div className="goods-fact"><Clock size={26} strokeWidth={1.8} aria-hidden="true" /><p><strong>Do 30 minut</strong><span>připravíme zboží skladem</span></p></div>
          </div>
        </section>

        <section className="interest-section wrap" id="zajemci">
          <div className="interest-copy"><span className="section-label">AKTUÁLNĚ SBÍRÁME ZÁJEMCE</span><h2>Pomoz nám otevřít MYNUTU.</h2><p>Jednáme o prostoru na Slovanech a plánujeme otevřít v lednu 2027. Zapiš se a dostaneš datum i adresu jako první.</p></div>
          <form className="interest-demo" onSubmit={handleInterestSubmit}>
            <span className="demo-badge"><span /> Zápis zájemců</span>
            <label htmlFor="interest-email">Tvůj e-mail</label>
            <input id="interest-email" type="email" value={interestEmail} onChange={(event) => setInterestEmail(event.target.value)} placeholder="ty@email.cz" aria-describedby="interest-note" required />
            <div className="interest-actions">
              <button type="submit" className="button-primary" disabled={interestState === 'submitting'}>{interestState === 'submitting' ? 'Odesílám…' : 'Chci vědět o otevření'} <ArrowRight size={16} /></button>
            </div>
            {interestMessage && <small className={`interest-message ${interestState}`}>{interestMessage}</small>}
            <small id="interest-note">Zápisem souhlasíš se zasíláním zpráv o otevření a novinkách MYNUTY. Souhlas můžeš kdykoli odvolat. Podrobnosti najdeš níže v častých otázkách.</small>
          </form>
        </section>

        <section className="faq-section wrap">
          <div className="section-heading"><span className="section-label">NA CO SE MOŽNÁ PTÁŠ</span><h2>Časté otázky</h2></div>
          <div className="faq-list">{faqs.map(({ id, question, answer }) => <details key={question} id={id}><summary>{question}<ChevronDown size={18} /></summary><p>{answer}</p></details>)}</div>
        </section>
      </main>

      <footer className="public-footer"><div className="wrap"><Brand /><span>Plzeň-Slovany · Otevření plánujeme na leden 2027 · {contactLink}</span><a href="#nahoru">Zpátky nahoru ↑</a></div></footer>
    </div>
  )
}

export default PublicLanding