import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  MapPin,
  Minus,
  Plus,
} from 'lucide-react'
import './PublicLanding.css'
import { playBagIntro, type BagIntro } from './heroBagIntro'

import pripravenaTaskaIcon from './assets/icons/svg-svetle/pripravena-taska.svg'
import qrIcon from './assets/icons/svg-svetle/qr.svg'
import kartaIcon from './assets/icons/svg-svetle/karta.svg'
import hodinyIcon from './assets/icons/svg-svetle/hodiny.svg'
import pecivoIcon from './assets/icons/svg-svetle/pecivo.svg'
import mlekoIcon from './assets/icons/svg-svetle/mleko.svg'
import vejceIcon from './assets/icons/svg-svetle/vejce.svg'
import ovoceIcon from './assets/icons/svg-svetle/ovoce.svg'
import zeleninaIcon from './assets/icons/svg-svetle/zelenina.svg'
import masoIcon from './assets/icons/svg-svetle/maso.svg'
import napojeIcon from './assets/icons/svg-svetle/napoje.svg'
import mobilIcon from './assets/icons/svg-svetle/mobil.svg'
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

const categories = [
  ['Pečivo', 'Rohlíky, chléb, sladké pečivo'],
  ['Mléčné výrobky a vejce', 'Mléko, jogurty, máslo, vejce'],
  ['Maso, uzeniny a sýry', 'Balené maso, šunka, eidam'],
  ['Ovoce a zelenina', 'Jablka, banány, rajčata'],
  ['Nápoje', 'Voda, limonády, džusy'],
  ['Trvanlivé potraviny', 'Těstoviny, rýže, konzervy, káva'],
  ['Základní drogerie', 'Toaletní papír, mýdlo, zubní pasta'],
]

const comparisonRows = [
  ['Kolik času tě nákup stojí', 'Regály a fronta u pokladny', 'Čekání doma na kurýra', 'Minuta u výdeje'],
  ['Musíš být doma?', 'Ne', 'Ano, v domluveném čase', 'Ne, vyzvedneš cestou'],
  ['Fronta u pokladny', 'Hlavně ve špičce', 'Žádná', 'Žádná, taška už čeká'],
]

const dayMoments = [
  ['14:00–16:00', 'Po ranní směně', 'Objednáš ještě v šatně a cestou z tramvaje si tašku vezmeš.'],
  ['16:00–20:00', 'Cestou z práce', 'Objednáš před odchodem z práce. Doma už jen vybalíš.'],
  ['9:00–12:00', 'V sobotu s dětmi', 'Žádná fronta a žádný regál se sladkostmi u pokladny.'],
  ['30 min před zavřením', 'Na poslední chvíli', 'Chybí ti něco na večeři? Skladové věci připravíme ještě dnes.'],
]

const timelineSteps = [
  { date: 'ŘÍJEN–LISTOPAD 2026', title: 'Sbíráme zájemce a jednáme o prostoru', text: 'Výdejna vznikne, když o ni bude na Slovanech zájem. Každý zápis se počítá.', status: 'Právě teď', current: true },
  { date: 'PROSINEC 2026', title: 'Stavíme výdejnu', text: 'Podpis nájmu, lednice a regály. Ze zapsaných pozveme první hosty na zkušební výdej.', status: '', current: false },
  { date: 'LEDEN 2027', title: 'Otevíráme', text: 'Přesné datum pošleme nejdřív zapsaným.', status: 'Plán', current: false },
]

const interestBenefits = [
  'Datum otevření se dozvíš jako první.',
  'Ze zapsaných pozveme první hosty na zkušební výdej.',
  'Přesnou adresu pošleme hned po podpisu smlouvy.',
]

const commonCzechSurnames = [
  'Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý',
  'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec',
  'Marek', 'Pospíšil', 'Pokorný', 'Hájek', 'Jelínek',
  'Král', 'Růžička', 'Beneš', 'Fiala', 'Sedláček',
]

type FlowOption = { title: string; hint: string }

const orderMoments: FlowOption[] = [
  { title: 'Týdenní nákup z gauče', hint: 'Sestavíš ho v klidu doma.' },
  { title: 'Doobjednej o pauze v práci', hint: 'Pár klepnutí a máš hotovo.' },
  { title: 'Sestav ho na počítači', hint: 'Velká obrazovka, žádný spěch.' },
  { title: 'Partner už je na cestě', hint: 'Objednáš předem. Nemusí řešit mobil za jízdy ani čekat v obchodě.' },
]

const paymentMoments: FlowOption[] = [
  { title: 'Zaplať online', hint: 'Předem, na místě už nic neřešíš.' },
  { title: 'Zaplať na místě', hint: 'Po jednoduché registraci.' },
]

const ticketTimeOptions = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

function pickRandomTime(current: string) {
  const candidates = ticketTimeOptions.filter((time) => time !== current)
  return candidates[Math.floor(Math.random() * candidates.length)]
}

const minuteEvents = [
  {
    title: 'Ukážeš QR kód nebo řekneš kód',
    description: 'Ověříme tvoji objednávku u výdejny.',
    icon: qrIcon,
  },
  {
    title: 'Vezmeš si připravenou tašku',
    description: 'Nákup už na tebe čeká. A můžeš jít.',
    icon: pripravenaTaskaIcon,
  },
]

const contactEmail = 'info@mynuta.cz'
const contactLink = <a href={`mailto:${contactEmail}`}>{contactEmail}</a>

const faqs: Faq[] = [
  { question: 'Za jak dlouho bude nákup připravený?', answer: 'Co máme skladem, nachystáme do 30 minut, často i dřív. Jakmile je taška připravená, pošleme ti e-mail. Časy pro dnešní výdej uvidíš mezi aktuálně dostupnými termíny. Věci, které skladem nemáme, objednáme a připravené jsou nejdřív další otevírací den.' },
  { question: 'Je stanovená minimální objednávka?', answer: 'Zatím ne. Podmínky objednávek i ceník zveřejníme před otevřením.' },
  { question: 'Jak se bude platit?', answer: 'Nákup zaplatíš online při objednání, na místě už nic neplatíš. Způsoby platby upřesníme před otevřením.' },
  { question: 'Co když nestihnu vybraný čas?', answer: 'Nevadí. Nákup na tebe počká do konce otevírací doby a chlazené věci zatím zůstanou v lednici. Když nestihneš ani to, napiš nám a domluvíme se na dalším dni.' },
  { question: 'Jak bude zajištěné chlazené zboží?', answer: 'Chlazené a mražené věci čekají až do výdeje v lednici a mrazáku. Teplotu v nich hlídají čidla.' },
  { question: 'Co když s nákupem nebude něco v pořádku?', answer: <>Tašku si můžeš zkontrolovat hned u výdeje. Když na něco přijdeš až doma, napiš na {contactLink}. Chybějící věci ti vrátíme na kartu, vadné vyměníme, nebo vrátíme peníze.</> },
  { question: 'Kde přesně budete?', answer: 'Na Slovanech, hned u tramvajové zastávky. Přesnou adresu zveřejníme po podpisu smlouvy a zapsaní ji dostanou e-mailem jako první.' },
  { question: 'Proč máte v neděli zavřeno?', answer: 'Neděle podle nás nemá patřit nákupům. Od pondělí do pátku jsme tu od 14 do 20, v sobotu od 9 do 12.' },
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

function FlowIcon({ kind }: { kind: 'phone' | 'pay' | 'clock' }) {
  const iconMap = {
    phone: mobilIcon,
    pay: kartaIcon,
    clock: hodinyIcon,
  }
  return <img src={iconMap[kind]} alt="" aria-hidden="true" className="flow-custom-icon" />
}

function FlowChoice({ number, kind, options, autoRotateMs }: {
  number: string
  kind: 'phone' | 'pay' | 'clock'
  options: FlowOption[]
  autoRotateMs?: number
}) {
  const [index, setIndex] = useState(0)
  const [touched, setTouched] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!autoRotateMs || touched || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % options.length), autoRotateMs)
    return () => window.clearInterval(timer)
  }, [autoRotateMs, touched, paused, options.length])

  const current = options[index]

  return (
    <button
      type="button"
      className="flow-step flow-choice"
      aria-label={`${number}. ${current.title}. ${current.hint} Klepnutím změníš variantu.`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onClick={() => {
        setTouched(true)
        setIndex((value) => (value + 1) % options.length)
      }}
    >
      <span className="flow-icon">
        <FlowIcon kind={kind} />
      </span>
      <span className="flow-text">
        <small>{number}</small>
        <strong key={`title-${index}`} className="flow-swap">{current.title}</strong>
        <span key={`hint-${index}`} className="flow-hint flow-swap">{current.hint}</span>
        <span className="flow-footer">
          <span className="flow-dots" aria-hidden="true">{options.map((option, optionIndex) => <i key={option.title} className={optionIndex === index ? 'active' : ''} />)}</span>
          <span className="flow-change" aria-hidden="true">Změnit</span>
        </span>
      </span>
    </button>
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
            <h1 id="hero-title">Nákup objednáš cestou, vyzvedneš za minutu.</h1>
            <p>Malá výdejna potravin na Slovanech pro lidi, kteří nemají čas stát ve frontě. Žádné regály ani fronta u pokladny. Otevření plánujeme na leden 2027.</p>
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
          <div className="hero-flow" aria-label="Sestav nákup, zaplať a vyzvedni za minutu">
            <FlowChoice number="01 · VÝBĚR" kind="phone" options={orderMoments} autoRotateMs={4200} />
            <span className="flow-arrow" aria-hidden="true"><ArrowRight size={18} /></span>
            <FlowChoice number="02 · PLATBA" kind="pay" options={paymentMoments} />
            <span className="flow-arrow" aria-hidden="true"><ArrowRight size={18} /></span>
            <div className="flow-step flow-step-final"><span className="flow-icon"><FlowIcon kind="clock" /></span><span className="flow-text"><small>03 · HOTOVO</small><strong>Vyzvedni za minutu</strong><span className="flow-hint">Taška už čeká.</span></span></div>
          </div>
        </section>

        <section className="minute-section" id="jak-to-funguje">
          <div className="wrap minute-inner">
            <div className="section-heading"><span className="section-label">ŽÁDNÉ POSTÁVÁNÍ</span><h2>Tvoje minuta na místě</h2><p>Tašku připravíme předem. Na místě si ji jen vyzvedneš.</p></div>
            <div className="minute-track">
              <ol className="minute-events" aria-label="Kroky vyzvednutí">
                {minuteEvents.map(({ title, description, icon: Icon }, index) => (
                  <li className="minute-card" key={title}>
                    <span className="minute-card-icon"><img src={Icon} alt="" aria-hidden="true" className="minute-custom-icon" /></span>
                    <div className="minute-card-content">
                      <span className="minute-card-number">0{index + 1} / VYZVEDNUTÍ</span>
                      <h3 className="minute-card-title">{title}</h3>
                      <p className="minute-card-description">{description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="demo-section wrap" id="demo">
          <div className="section-heading demo-heading"><span className="section-label">MŮŽEŠ SI TO PROJÍT</span><h2>Vyzkoušej si to</h2><p>Je to jen ukázka. Objednávku ani platbu neposíláme.</p></div>
          <div className="demo-layout">
            <div className="demo-explainer"><span className="demo-number">01—05</span><h3>Od výběru<br />k připravené tašce.</h3><p>Proklikej si cestu, která tě čeká. Všechno se děje tady na stránce.</p><button className="demo-reset" onClick={beginAgain}><span>↻</span> Začít znovu</button></div>
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
                  {activeDay && <div className="time-picker"><label htmlFor="pickup-time">Čas vyzvednutí</label><div className="select-wrap"><select id="pickup-time" value={activeTime} onChange={(event) => setPickupTime(event.target.value)}>{pickupTimes.map((time) => <option key={time} value={time}>{time}</option>)}</select><ChevronDown size={16} /></div><small>{activeDay.date.getDay() === 6 ? 'Sobota · 9:00–12:00' : 'Pondělí–pátek · 14:00–20:00'}</small></div>}
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
        </section>

        <section className="difference-section">
          <div className="wrap">
            <div className="section-heading"><span className="section-label">JINÝ ZPŮSOB NÁKUPU</span><h2>Čím se MYNUTA liší</h2></div>
            <div className="comparison" role="table" aria-label="Srovnání způsobů nákupu">
              <div className="comparison-row comparison-head" role="row"><div role="columnheader"> </div><div role="columnheader">Běžný obchod</div><div role="columnheader">Rozvoz domů</div><div role="columnheader" className="mynuta-column">MYNUTA</div></div>
              {comparisonRows.map(([label, store, delivery, mynuta]) => <div className="comparison-row" role="row" key={label}><div className="comparison-label" role="rowheader">{label}</div><div data-label="Běžný obchod" role="cell">{store}</div><div data-label="Rozvoz domů" role="cell">{delivery}</div><div data-label="MYNUTA" role="cell" className="mynuta-column">{mynuta}</div></div>)}
            </div>
          </div>
        </section>

        <section className="people-section wrap">
          <div className="section-heading"><span className="section-label">PRO KOHO TO JE</span><h2>Pro tvůj běžný den</h2><p>Otevřeno máme ve všední dny odpoledne a v sobotu dopoledne. Nákup si vezmeš, kdy jdeš kolem.</p></div>
          <div className="people-grid">{dayMoments.map(([time, title, text]) => <article className="people-item" key={title}><span className="people-index">{time}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section className="goods-section">
          <div className="wrap goods-inner"><div className="section-heading"><span className="section-label">NA KAŽDÝ DEN</span><h2>Co u nás koupíš</h2><p>Nejsme supermarket. Budeme mít zhruba 500 věcí, které lidé kupují nejčastěji. Co je skladem, připravíme ještě týž den, ostatní objednáme na další den.</p></div><div className="goods-list">{categories.map(([name, examples], index) => <div className="goods-row" key={name}><span>0{index + 1}</span><strong>{name}</strong><small>{examples}</small></div>)}<div className="goods-row goods-row-order"><span>+</span><strong>Na objednávku</strong><small>Dražší a méně obvyklé zboží, připravené další den</small></div></div></div>
        </section>

        <section className="place-section wrap" id="kde-a-kdy">
          <div className="place-copy"><span className="section-label">BLÍZKO DOMOVA</span><h2>Kde a kdy</h2><p className="place-name"><MapPin size={21} /> Plzeň-Slovany</p><p>Hned u tramvajové zastávky. Přesnou adresu zveřejníme po podpisu smlouvy.</p><div className="opening-hours"><div><strong>Po–Pá</strong><span>14:00–20:00</span></div><div><strong>Sobota</strong><span>9:00–12:00</span></div><div><strong>Neděle</strong><span>Zavřeno</span></div></div><p className="place-note">Co máme skladem, připravíme do 30 minut a dáme ti vědět e-mailem. Termíny dnešního výdeje uvidíš při objednání.</p></div>
          <div className="place-art" aria-hidden="true"><div className="place-map"><span className="map-road map-road-one" /><span className="map-road map-road-two" /><span className="map-park" /><span className="map-pin"><MapPin size={23} /></span><span className="map-label">SLOVANY</span></div><span className="place-art-note">Malá výdejna.<br />Velká úspora času.</span></div>
        </section>

        <section className="timeline-section">
          <div className="wrap"><div className="section-heading"><span className="section-label">KDE PROJEKT JE</span><h2>Nejdřív zájem, pak výdejna.</h2></div>
            <div className="project-timeline">{timelineSteps.map(({ date, title, text, status, current }) => <article key={date}><span className={`timeline-dot${current ? ' timeline-current' : ''}`} /><span className="timeline-date">{date}</span><h3>{title}</h3><p className="timeline-text">{text}</p>{status && <small>{status}</small>}</article>)}</div>
          </div>
        </section>

        <section className="interest-section wrap" id="zajemci">
          <div className="interest-copy"><span className="section-label">POMOZ NÁM ZAČÍT</span><h2>Chceš MYNUTU na Slovanech?</h2><p>Výdejnu otevřeme, když o ni bude dost zájmu. Zápis nic nestojí a k ničemu tě nezavazuje.</p><ul className="interest-benefits">{interestBenefits.map((benefit) => <li key={benefit}><span><Check size={13} /></span>{benefit}</li>)}</ul></div>
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