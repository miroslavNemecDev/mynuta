import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Apple,
  ArrowRight,
  BadgeCheck,
  Beef,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Coffee,
  CreditCard,
  Flame,
  Grid2X2,
  Leaf,
  MapPin,
  Menu,
  Minus,
  Package,
  PackageCheck,
  Percent,
  Plus,
  Search,
  Settings2,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Snowflake,
  Sparkles,
  Tag,
  Truck,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import './Mynuta.css'

type Category = 'Vše' | 'Chlazené' | 'Maso' | 'Mražené' | 'Nápoje' | 'Ovoce' | 'Zelenina' | 'Pečivo' | 'Trvanlivé'
type Product = {
  id: string
  name: string
  maker: string
  category: Exclude<Category, 'Vše'>
  price: number
  unit: string
  image: string
  expiry: string
  stock: number
  note?: string
  fresh?: boolean
}
type CartLines = Record<string, number>
type SavedCart = { id: string; name: string; items: CartLines }
type PickupSlot = { value: string; label: string; dateLabel: string; mode: 'box' | 'staff' }
type Order = {
  id: string
  customer: string
  email: string
  items: CartLines
  total: number
  pickup: string
  mode: 'box' | 'staff'
  status: 'Nová' | 'Připravuji' | 'Připraveno' | 'Vydáno'
  createdAt: string
  paid: boolean
}
type DiscountSettings = { beforeDays: number; beforePercent: number; todayPercent: number }
type SharedPayload = { type: 'cart' | 'order'; items: CartLines; pickup?: string; orderId?: string; customer?: string }

const categoryOptions: { name: Category; icon: LucideIcon; tone: string }[] = [
  { name: 'Vše', icon: Grid2X2, tone: 'tone-green' },
  { name: 'Chlazené', icon: Snowflake, tone: 'tone-blue' },
  { name: 'Maso', icon: Beef, tone: 'tone-red' },
  { name: 'Mražené', icon: Snowflake, tone: 'tone-cyan' },
  { name: 'Nápoje', icon: Coffee, tone: 'tone-indigo' },
  { name: 'Ovoce', icon: Apple, tone: 'tone-lime' },
  { name: 'Zelenina', icon: Leaf, tone: 'tone-leaf' },
  { name: 'Pečivo', icon: Package, tone: 'tone-orange' },
  { name: 'Trvanlivé', icon: Package, tone: 'tone-brown' },
]

const dateAfter = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const initialProducts: Product[] = [
  { id: 'med', name: 'Květový med', maker: 'Medárna Čejkovice', category: 'Trvanlivé', price: 129, unit: '250 g', image: 'photo-1587049352851-8d4e89133924', expiry: dateAfter(280), stock: 18, fresh: true },
  { id: 'limonada', name: 'Domácí limonáda', maker: 'LemonAid', category: 'Nápoje', price: 49, unit: '330 ml', image: 'photo-1544145945-f90425340c7e', expiry: dateAfter(80), stock: 12 },
  { id: 'jogurt', name: 'Bílý jogurt z farmy', maker: 'Farma Struhy', category: 'Chlazené', price: 34, unit: '150 g', image: 'photo-1571212515416-fef01fc43637', expiry: dateAfter(2), stock: 7, note: 'Spotřebujte do 2 dnů' },
  { id: 'vejce', name: 'Vejce z volného chovu', maker: 'Statek u lesa', category: 'Chlazené', price: 76, unit: '10 ks', image: 'photo-1506976785307-8732e854ad03', expiry: dateAfter(13), stock: 9 },
  { id: 'rajcata', name: 'Cherry rajčata', maker: 'Lokální pěstitel', category: 'Zelenina', price: 48, unit: '250 g', image: 'photo-1546094096-0df4bcaaa337', expiry: dateAfter(4), stock: 11, fresh: true },
  { id: 'boruvky', name: 'Lesní borůvky', maker: 'Ovocnářství Novák', category: 'Ovoce', price: 69, unit: '125 g', image: 'photo-1498557850523-fd3d118b962e', expiry: dateAfter(0), stock: 5, note: 'Dnes poslední den' },
  { id: 'chleb', name: 'Kváskový chléb', maker: 'Pekárna U Tří zrn', category: 'Pečivo', price: 68, unit: '600 g', image: 'photo-1509440159596-0249088772ff', expiry: dateAfter(1), stock: 4, fresh: true },
  { id: 'maslo', name: 'Farmářské máslo', maker: 'Mlékárna Lány', category: 'Chlazené', price: 58, unit: '250 g', image: 'photo-1589985270826-4b7bb135bc9d', expiry: dateAfter(6), stock: 8 },
  { id: 'hrozny', name: 'Hroznové víno', maker: 'Zahrady Morava', category: 'Ovoce', price: 55, unit: '500 g', image: 'photo-1537640538966-79f369143f8f', expiry: dateAfter(5), stock: 6 },
  { id: 'kur', name: 'Kuřecí prsa', maker: 'Česká farma', category: 'Maso', price: 145, unit: '400 g', image: 'photo-1604503468506-a8da13d82791', expiry: dateAfter(3), stock: 5 },
  { id: 'hrasek', name: 'Mražený hrášek', maker: 'Zelená zahrada', category: 'Mražené', price: 39, unit: '450 g', image: 'photo-1587735243615-c03f25aaff15', expiry: dateAfter(200), stock: 14 },
  { id: 'oves', name: 'Jemné ovesné vločky', maker: 'Dobré ráno', category: 'Trvanlivé', price: 32, unit: '500 g', image: 'photo-1517673132405-a56a62b18caf', expiry: dateAfter(210), stock: 22 },
]

const demoOrder: Order = {
  id: 'MN-260928', customer: 'Jana Novotná', email: 'jana@example.cz', items: { jogurt: 2, chleb: 1, boruvky: 1 },
  total: 129.5, pickup: `${dateAfter(2)}T09:00`, mode: 'box', status: 'Nová', createdAt: 'Dnes, 8:42', paid: true,
}
const todayLabel = new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) as T : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  return [value, setValue] as const
}

function daysUntil(date: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(`${date}T00:00:00`)
  return Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
}

function buildPickupSlots(): PickupSlot[] {
  const earliest = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const slots: PickupSlot[] = []
  const times = [9, 12, 15]
  for (let day = 0; day < 14 && slots.length < 12; day += 1) {
    const date = new Date()
    date.setDate(date.getDate() + day)
    for (const hour of times) {
      const candidate = new Date(date)
      candidate.setHours(hour, 0, 0, 0)
      if (candidate < earliest) continue
      const weekend = candidate.getDay() === 0 || candidate.getDay() === 6
      const dateLabel = new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' }).format(candidate)
      slots.push({
        value: `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, '0')}-${String(candidate.getDate()).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00`,
        label: `${dateLabel}, ${String(hour).padStart(2, '0')}:00`,
        dateLabel,
        mode: weekend ? 'staff' : 'box',
      })
    }
  }
  return slots
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount)
}

function formatPickup(value: string) {
  const date = new Date(value)
  return `${new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)} v ${String(date.getHours()).padStart(2, '0')}:00`
}

function encodeShare(payload: SharedPayload) {
  return encodeURIComponent(JSON.stringify(payload))
}

function readShare(): SharedPayload | null {
  try {
    const token = new URLSearchParams(window.location.search).get('sdileni')
    return token ? JSON.parse(token) as SharedPayload : null
  } catch {
    return null
  }
}

function App() {
  const [products, setProducts] = useStoredState<Product[]>('mynuta-products-v1', initialProducts)
  const [cart, setCart] = useStoredState<CartLines>('mynuta-cart-v1', {})
  const [savedCarts, setSavedCarts] = useStoredState<SavedCart[]>('mynuta-saved-carts-v1', [])
  const [orders, setOrders] = useStoredState<Order[]>('mynuta-orders-v1', [demoOrder])
  const [discounts, setDiscounts] = useStoredState<DiscountSettings>('mynuta-discounts-v1', { beforeDays: 2, beforePercent: 20, todayPercent: 70 })
  const [mode, setMode] = useState<'shop' | 'staff'>('shop')
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false)
  const [staffTab, setStaffTab] = useState<'overview' | 'orders' | 'stock' | 'rules'>('overview')
  const [category, setCategory] = useState<Category>('Vše')
  const [search, setSearch] = useState('')
  const [dealOnly, setDealOnly] = useState(false)
  const [cartTab, setCartTab] = useState<'aktivni' | 'ulozene'>('aktivni')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [modal, setModal] = useState<'checkout' | 'success' | 'share' | null>(() => readShare() ? 'share' : null)
  const [shared, setShared] = useState<SharedPayload | null>(() => readShare())
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [savedName, setSavedName] = useState('')
  const [showSaveField, setShowSaveField] = useState(false)
  const [notice, setNotice] = useState('')
  const [lastOrder, setLastOrder] = useState<Order | null>(null)
  const slots = useMemo(() => buildPickupSlots(), [])
  const activeSlot = slots.find((slot) => slot.value === selectedSlot) ?? slots[0]

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const getDiscount = (product: Product) => {
    const remaining = daysUntil(product.expiry)
    if (remaining < 0) return 100
    if (remaining === 0) return discounts.todayPercent
    if (remaining <= discounts.beforeDays) return discounts.beforePercent
    return 0
  }
  const priceFor = (product: Product) => Math.round(product.price * (1 - getDiscount(product) / 100) * 100) / 100
  const visibleProducts = products.filter((product) => {
    const valid = daysUntil(product.expiry) >= 0 && product.stock > 0
    const matchesCategory = category === 'Vše' || product.category === category
    const matchesSearch = `${product.name} ${product.maker} ${product.category}`.toLocaleLowerCase('cs').includes(search.toLocaleLowerCase('cs'))
    return valid && matchesCategory && matchesSearch && (!dealOnly || getDiscount(product) > 0)
  })
  const cartEntries = Object.entries(cart).filter(([, quantity]) => quantity > 0)
  const cartCount = cartEntries.reduce((sum, [, quantity]) => sum + quantity, 0)
  const subtotal = cartEntries.reduce((sum, [id, quantity]) => {
    const product = products.find((item) => item.id === id)
    return sum + (product ? priceFor(product) * quantity : 0)
  }, 0)
  const totalBeforeDiscount = cartEntries.reduce((sum, [id, quantity]) => {
    const product = products.find((item) => item.id === id)
    return sum + (product ? product.price * quantity : 0)
  }, 0)
  const savedAmount = totalBeforeDiscount - subtotal

  const addToCart = (id: string, quantity = 1) => {
    const product = products.find((item) => item.id === id)
    if (!product || product.stock <= (cart[id] ?? 0)) {
      setNotice('Víc kusů už není skladem')
      return
    }
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + quantity }))
  }
  const removeFromCart = (id: string) => {
    setCart((current) => {
      const next = { ...current, [id]: (current[id] ?? 0) - 1 }
      if (next[id] <= 0) delete next[id]
      return next
    })
  }

  const makeShareLink = async (payload: SharedPayload, message: string) => {
    const url = new URL(window.location.href)
    url.search = `?sdileni=${encodeShare(payload)}`
    try {
      await navigator.clipboard.writeText(url.toString())
      setNotice(message)
    } catch {
      window.prompt('Zkopírujte odkaz ke sdílení:', url.toString())
    }
  }

  const shareCart = () => {
    if (!cartCount) return setNotice('Košík je zatím prázdný')
    void makeShareLink({ type: 'cart', items: cart, pickup: activeSlot?.value }, 'Odkaz na nákupní seznam je zkopírovaný')
  }

  const saveCurrentCart = () => {
    if (!savedName.trim() || !cartCount) return
    setSavedCarts((current) => [...current, { id: crypto.randomUUID(), name: savedName.trim(), items: cart }])
    setSavedName('')
    setShowSaveField(false)
    setNotice('Seznam byl uložen')
  }

  const loadSavedCart = (saved: SavedCart) => {
    setCart(saved.items)
    setCartTab('aktivni')
    setNotice(`Načten seznam „${saved.name}“`)
  }

  const placeOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!cartCount || !activeSlot) return
    const order: Order = {
      id: `MN-${crypto.randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase()}`,
      customer: customerName.trim() || 'Host',
      email: customerEmail.trim(),
      items: cart,
      total: subtotal,
      pickup: activeSlot.value,
      mode: activeSlot.mode,
      status: 'Nová',
      createdAt: 'Právě teď',
      paid: true,
    }
    setOrders((current) => [order, ...current])
    setProducts((current) => current.map((product) => ({ ...product, stock: Math.max(0, product.stock - (cart[product.id] ?? 0)) })))
    setLastOrder(order)
    setCart({})
    setModal('success')
  }

  const changeOrderStatus = (orderId: string) => {
    const nextStatus: Record<Order['status'], Order['status']> = { Nová: 'Připravuji', Připravuji: 'Připraveno', Připraveno: 'Vydáno', Vydáno: 'Vydáno' }
    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status: nextStatus[order.status] } : order))
  }

  const updateProduct = (id: string, field: 'expiry' | 'stock', value: string) => {
    setProducts((current) => current.map((product) => product.id === id ? { ...product, [field]: field === 'stock' ? Math.max(0, Number(value)) : value } : product))
  }

  const importSharedList = () => {
    if (!shared) return
    if (shared.type === 'cart') {
      setCart((current) => {
        const merged = { ...current }
        for (const [id, quantity] of Object.entries(shared.items)) merged[id] = (merged[id] ?? 0) + quantity
        return merged
      })
      if (shared.pickup && slots.some((slot) => slot.value === shared.pickup)) setSelectedSlot(shared.pickup)
      setCartTab('aktivni')
      setNotice('Sdílený seznam je přidaný do košíku')
    } else {
      setNotice(`Objednávka ${shared.orderId ?? ''} je zaplacená, připravená k vyzvednutí`)
    }
    setShared(null)
    setModal(null)
    const url = new URL(window.location.href)
    url.search = ''
    window.history.replaceState({}, '', url)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand-lockup" type="button" onClick={() => { setMode('shop'); setCategory('Vše') }} aria-label="MYNUTA, přejít na nákup">
          <span className="brand-word"><span>m</span><span className="brand-clock" aria-hidden="true"><span className="clock-arm clock-left" /><span className="clock-arm clock-right" /><span className="clock-arm clock-stem" /></span><span>nuta</span></span>
          <span className="brand-tagline">Rychle, levně – do Mynuty</span>
        </button>
        <label className="global-search">
          <Search size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Hledat v ukázkovém sortimentu" aria-label="Hledat produkty" />
          <kbd>⌘ K</kbd>
        </label>
        <div className="top-actions">
          <button className="icon-button notification-button" title="Upozornění" aria-label="Upozornění"><Bell size={19} /><span className="notification-dot" /></button>
          <span className="header-divider" />
          <button className="mode-switch" type="button" onClick={() => setMode(mode === 'shop' ? 'staff' : 'shop')}>
            <span className={`mode-icon ${mode === 'staff' ? 'staff-icon' : ''}`}>{mode === 'shop' ? <UserRound size={17} /> : <PackageCheck size={17} />}</span>
            <span>{mode === 'shop' ? 'Zákazník' : 'Obsluha'}</span>
            <ChevronDown size={15} />
          </button>
          <button className="avatar-button" aria-label="Profil"><span>M</span></button>
        </div>
      </header>

      {mode === 'shop' ? (
        <div className="shop-layout">
          <aside className="category-rail" aria-label="Kategorie produktů">
            <div className="rail-heading"><span>NAKUPOVAT</span><button className="subtle-icon" aria-label="Nastavit kategorie"><Settings2 size={15} /></button></div>
            <button className={`category-link ${category === 'Vše' ? 'is-selected' : ''}`} onClick={() => setCategory('Vše')}><Grid2X2 size={17} /><span>Všechny produkty</span><span className="category-count">{products.length}</span></button>
            <div className="rail-separator" />
            {categoryOptions.slice(1).map(({ name, icon: Icon, tone }) => (
              <button key={name} className={`category-link ${category === name ? 'is-selected' : ''}`} onClick={() => setCategory(name)}>
                <span className={`category-icon ${tone}`}><Icon size={15} /></span><span>{name}</span>
                <span className="category-count">{products.filter((product) => product.category === name && daysUntil(product.expiry) >= 0).length}</span>
              </button>
            ))}
            <div className="rail-promo"><span className="promo-leaf"><Leaf size={18} /></span><strong>Méně plýtvání</strong><p>Čerstvé věci za lepší cenu.</p><button onClick={() => setDealOnly(true)}>Ukázat slevy <ArrowRight size={13} /></button></div>
            <div className="branch-mini"><MapPin size={15} /><span><strong>MYNUTA · hlavní</strong><small>Výdejní místo · otevřeno</small></span></div>
          </aside>

          {mobileCategoriesOpen && <div className="mobile-category-menu" aria-label="Kategorie produktů">{categoryOptions.map(({ name, icon: Icon, tone }) => <button key={name} className={category === name ? 'mobile-category-active' : ''} onClick={() => { setCategory(name); setMobileCategoriesOpen(false) }}><span className={`category-icon ${tone}`}><Icon size={14} /></span>{name}</button>)}</div>}
          <main className="shop-main">
            <section className="pickup-strip">
              <div className="pickup-icon"><Clock3 size={19} /></div>
              <div className="pickup-copy"><span>Vyzvednutí bez čekání</span><strong>Taška bude připravená nejdříve za 24 hodin</strong></div>
              <div className="pickup-slot-wrap"><CalendarDays size={16} /><select value={activeSlot?.value ?? ''} onChange={(event) => setSelectedSlot(event.target.value)} aria-label="Čas vyzvednutí">
                {slots.map((slot) => <option key={slot.value} value={slot.value}>{slot.label} · {slot.mode === 'box' ? 'chlazený box' : 'osobně'}</option>)}
              </select><ChevronDown size={15} /></div>
              <div className="pickup-method"><span className="live-dot" />{activeSlot?.mode === 'box' ? 'Chlazený box' : 'Předání obsluhou'}</div>
            </section>

            <div className="shop-heading-row">
              <div><div className="eyebrow"><span className="eyebrow-dot" /> JEDEN NÁKUP. O CHVÍLI MÍŇ.</div><h1>Dobré věci,<br className="mobile-break" /> <em>bez zbytečného čekání.</em></h1><p className="heading-description">Vyber si, co máš rád. My to připravíme, ty jen vyzvedneš.</p></div>
              <div className="heading-stamp"><span>VYŘÍDÍŠ</span><strong>za<br />minutu</strong><Clock3 size={17} /></div>
            </div>

            <div className="catalog-toolbar">
              <div className="catalog-title"><div><h2>{category === 'Vše' ? 'Všechny produkty' : category}</h2><span>{visibleProducts.length} ukázkových produktů</span></div></div>
              <div className="catalog-filters"><button className={`filter-chip ${dealOnly ? 'filter-active' : ''}`} onClick={() => setDealOnly(!dealOnly)}><Flame size={15} /> Jen v akci <span className="deal-counter">3</span></button><button className="sort-button" onClick={() => setNotice('Řazení podle doporučení')}><span>Nejrelevantnější</span><ChevronDown size={15} /></button></div>
            </div>

            {dealOnly && <div className="deal-notice"><Tag size={15} /> Právě zachraňujeme čerstvé zásoby. Sleva se počítá automaticky podle data spotřeby.<button onClick={() => setDealOnly(false)} aria-label="Zrušit filtr"><X size={15} /></button></div>}
            {visibleProducts.length ? <div className="product-grid">
              {visibleProducts.map((product, index) => {
                const discount = getDiscount(product)
                const quantity = cart[product.id] ?? 0
                return <article className="product-card" key={product.id} style={{ animationDelay: `${Math.min(index, 7) * 45}ms` }}>
                  <div className="product-image-wrap">
                    <img src={`https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=720&q=82`} alt={product.name} loading={index > 3 ? 'lazy' : 'eager'} />
                    <span className="product-category-label">{product.category}</span>
                    {discount > 0 && <span className="discount-badge"><Percent size={12} /> −{discount} %</span>}
                    {product.fresh && <span className="local-badge"><Leaf size={12} /> Lokální</span>}
                    <button className="favorite-button" aria-label={`Uložit ${product.name}`} onClick={() => setNotice(`${product.name} přidáno do oblíbených`)}><Sparkles size={16} /></button>
                  </div>
                  <div className="product-details">
                    <div className="product-maker">{product.maker}</div><h3>{product.name}</h3>
                    <div className="product-bottom"><div className="price-group"><strong>{formatPrice(priceFor(product))}</strong>{discount > 0 && <del>{formatPrice(product.price)}</del>}<small>{product.unit}</small></div>
                      {quantity ? <div className="quantity-control"><button aria-label="Odebrat kus" onClick={() => removeFromCart(product.id)}><Minus size={14} /></button><span>{quantity}</span><button aria-label={`Přidat další ${product.name}`} onClick={() => addToCart(product.id)}><Plus size={14} /></button></div> : <button className="add-button" aria-label={`Přidat ${product.name} do košíku`} onClick={() => addToCart(product.id)}><Plus size={16} /><span>Přidat</span></button>}
                    </div>
                    {product.note && <div className={`expiry-note ${discount ? 'expiry-discount' : ''}`}><Clock3 size={12} />{product.note}</div>}
                  </div>
                </article>
              })}
            </div> : <div className="empty-products"><Search size={27} /><strong>Nic jsme nenašli</strong><span>Zkus upravit hledání nebo vybrat jinou kategorii.</span><button onClick={() => { setSearch(''); setCategory('Vše'); setDealOnly(false) }}>Zobrazit vše</button></div>}
            <footer className="shop-footer"><span>MYNUTA · hlavní výdejní místo</span><span>Rychle, levně – do Mynuty <span className="footer-clock">◷</span></span></footer>
          </main>

          <aside className="cart-panel">
            <div className="cart-panel-top"><div><span className="panel-overline">TVŮJ NÁKUP</span><h2>Košík <span>{cartCount}</span></h2></div><button className="subtle-icon" aria-label="Další možnosti" onClick={shareCart}><Share2 size={17} /></button></div>
            <div className="cart-tabs"><button className={cartTab === 'aktivni' ? 'tab-active' : ''} onClick={() => setCartTab('aktivni')}>Aktuální <span>{cartCount}</span></button><button className={cartTab === 'ulozene' ? 'tab-active' : ''} onClick={() => setCartTab('ulozene')}>Uložené <span>{savedCarts.length}</span></button></div>
            {cartTab === 'aktivni' ? <>
              {cartEntries.length ? <div className="cart-items">
                {cartEntries.map(([id, quantity]) => {
                  const product = products.find((item) => item.id === id)
                  if (!product) return null
                  return <div className="cart-item" key={id}><img src={`https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=140&q=75`} alt="" /><div className="cart-item-text"><strong>{product.name}</strong><span>{formatPrice(priceFor(product))} · {product.unit}</span></div><div className="cart-quantity"><button onClick={() => removeFromCart(id)} aria-label="Odebrat kus"><Minus size={12} /></button><span>{quantity}</span><button onClick={() => addToCart(id)} aria-label="Přidat kus"><Plus size={12} /></button></div></div>
                })}
                <button className="share-list-button" onClick={shareCart}><UsersRound size={16} /><span>Sdílet nákupní seznam</span><Share2 size={14} /></button>
                {showSaveField ? <form className="save-cart-form" onSubmit={(event) => { event.preventDefault(); saveCurrentCart() }}><input autoFocus value={savedName} onChange={(event) => setSavedName(event.target.value)} placeholder="Např. Snídaně" aria-label="Název seznamu" /><button type="submit" aria-label="Uložit seznam"><Check size={16} /></button><button type="button" onClick={() => setShowSaveField(false)} aria-label="Zrušit"><X size={15} /></button></form> : <button className="save-list-button" onClick={() => setShowSaveField(true)}><Plus size={15} /> Uložit jako seznam</button>}
              </div> : <div className="empty-cart"><span className="empty-cart-art"><ShoppingBag size={34} /></span><strong>Košík je zatím prázdný</strong><p>Začni něčím dobrým. Přidávání je rychlejší než fronta.</p><span className="empty-cart-hint"><Sparkles size={14} /> Každý kousek vybíráš ty</span></div>}
              <div className="cart-summary"><div className="cart-pickup-line"><div className="summary-icon"><Truck size={16} /></div><div><strong>Vyzvednutí</strong><span>{activeSlot ? `${activeSlot.dateLabel}, ${activeSlot.value.slice(-5)}` : 'Vyber čas'}</span></div><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Upravit čas"><ChevronRight size={16} /></button></div>
                <div className="summary-line"><span>Mezisoučet</span><span>{formatPrice(totalBeforeDiscount)}</span></div>{savedAmount > 0 && <div className="summary-line saved-line"><span><Leaf size={13} /> Ušetříš díky slevám</span><strong>−{formatPrice(savedAmount)}</strong></div>}
                <div className="summary-total"><span>Celkem k úhradě</span><strong>{formatPrice(subtotal)}</strong></div><button className="checkout-button" disabled={!cartCount} onClick={() => setModal('checkout')}><span>Pokračovat k platbě</span><ArrowRight size={18} /></button><div className="secure-note"><BadgeCheck size={14} /> Platba předem · bezpečně · bez registrace</div>
              </div>
            </> : <div className="saved-cart-list">{savedCarts.length ? savedCarts.map((saved) => <div className="saved-cart-card" key={saved.id}><div className="saved-cart-icon"><ShoppingBag size={17} /></div><div><strong>{saved.name}</strong><span>{Object.values(saved.items).reduce((sum, quantity) => sum + quantity, 0)} položek</span></div><button onClick={() => loadSavedCart(saved)} aria-label={`Načíst seznam ${saved.name}`}><ArrowRight size={16} /></button></div>) : <div className="saved-empty"><ShoppingBag size={25} /><strong>Zatím tu nic není</strong><span>Ulož si oblíbený nákup pro příště.</span></div>}</div>}
            <div className="cart-bottom-note"><LockKeyholeIcon /> Tvé údaje zůstávají jen tvoje.</div>
          </aside>
        </div>
      ) : (
        <div className="staff-layout">
          <aside className="staff-sidebar"><div className="staff-location"><span className="location-symbol"><MapPin size={17} /></span><span><strong>MYNUTA · hlavní</strong><small>Jedna pobočka · demo</small></span><ChevronDown size={15} /></div><div className="staff-nav-label">PROVOZ</div>
            {([{ id: 'overview', label: 'Přehled', icon: Grid2X2 }, { id: 'orders', label: 'Objednávky', icon: ClipboardList }, { id: 'stock', label: 'Zásoby a čerstvost', icon: Package }, { id: 'rules', label: 'Pravidla slev', icon: Percent }] as const).map(({ id, label, icon: Icon }) => <button key={id} className={`staff-nav-item ${staffTab === id ? 'staff-nav-active' : ''}`} onClick={() => setStaffTab(id)}><Icon size={18} /><span>{label}</span>{id === 'orders' && orders.filter((order) => order.status === 'Nová').length > 0 && <span className="nav-count">{orders.filter((order) => order.status === 'Nová').length}</span>}</button>)}
            <div className="staff-sidebar-bottom"><div className="sidebar-status"><span className="live-dot" /><span><strong>Sklad synchronizován</strong><small>právě teď · tento prohlížeč</small></span></div><button className="sidebar-help"><CircleHelp size={17} /> Nápověda k obsluze</button></div>
          </aside>
          <main className="staff-main">
            <div className="staff-page-top"><div className="breadcrumbs"><span>MYNUTA</span><ChevronRight size={14} /><span>Provoz</span><ChevronRight size={14} /><strong>{staffTab === 'overview' ? 'Přehled' : staffTab === 'orders' ? 'Objednávky' : staffTab === 'stock' ? 'Zásoby a čerstvost' : 'Pravidla slev'}</strong></div><div className="staff-date"><CalendarDays size={15} />{todayLabel}</div></div>
            {staffTab === 'overview' && <>
              <div className="staff-title-row"><div><span className="eyebrow">PONDĚLÍ · PÁTEK BOX / VÍKEND OSOBNĚ</span><h1>Dobré ráno, Miroslave.</h1><p>Tady je přehled toho, co dnes potřebuje pozornost.</p></div><button className="outline-button" onClick={() => setStaffTab('stock')}><Package size={16} /> Zkontrolovat zásoby</button></div>
              <div className="stat-grid"><div className="stat-card stat-orders"><span className="stat-icon"><ClipboardList size={19} /></span><span className="stat-label">Nové objednávky</span><strong>{orders.filter((order) => order.status === 'Nová' || order.status === 'Připravuji').length}</strong><span className="stat-foot">čekají na přípravu</span></div><div className="stat-card stat-ready"><span className="stat-icon"><PackageCheck size={19} /></span><span className="stat-label">Připraveno k výdeji</span><strong>{orders.filter((order) => order.status === 'Připraveno').length}</strong><span className="stat-foot">box nebo osobní předání</span></div><div className="stat-card stat-fresh"><span className="stat-icon"><Leaf size={19} /></span><span className="stat-label">Zboží ve slevě</span><strong>{products.filter((product) => getDiscount(product) > 0 && product.stock > 0).length}</strong><span className="stat-foot">kvůli blížící se spotřebě</span></div><div className="stat-card stat-alert"><span className="stat-icon"><AlertTriangle size={19} /></span><span className="stat-label">Vyžaduje pozornost</span><strong>{products.filter((product) => daysUntil(product.expiry) <= 2 && product.stock > 0).length}</strong><span className="stat-foot">zásoby do 2 dnů</span></div></div>
              <div className="overview-grid"><section className="staff-section order-section"><div className="section-title-row"><div><span className="section-kicker">PŘIPRAVIT JAKO DALŠÍ</span><h2>Objednávky</h2></div><button className="text-button" onClick={() => setStaffTab('orders')}>Všechny objednávky <ArrowRight size={15} /></button></div><div className="order-list">{orders.slice(0, 3).map((order) => <OrderRow key={order.id} order={order} products={products} onAdvance={changeOrderStatus} />)}</div></section>
                <section className="staff-section fresh-section"><div className="section-title-row"><div><span className="section-kicker">NEPLÝTVÁME</span><h2>Čerstvost pod kontrolou</h2></div><span className="fresh-mark"><Leaf size={15} /></span></div><div className="fresh-summary"><div className="fresh-circle"><span>{products.filter((product) => daysUntil(product.expiry) <= 2 && product.stock > 0).length}</span><small>položky</small></div><p>Slevy se nastavují automaticky podle toho, kolik času zbývá do konce spotřeby.</p></div><div className="discount-preview"><div><span className="preview-dot preview-yellow" /><span>Do spotřeby zbývají {discounts.beforeDays} dny</span><strong>−{discounts.beforePercent} %</strong></div><div><span className="preview-dot preview-red" /><span>Poslední den spotřeby</span><strong>−{discounts.todayPercent} %</strong></div></div><button className="fresh-edit" onClick={() => setStaffTab('rules')}>Upravit pravidla slev <ArrowRight size={15} /></button></section></div>
              <section className="staff-section stock-preview"><div className="section-title-row"><div><span className="section-kicker">SLEDOVÁNÍ ZÁSOB</span><h2>Brzy končí spotřeba</h2></div><button className="text-button" onClick={() => setStaffTab('stock')}>Otevřít sklad <ArrowRight size={15} /></button></div><StockTable products={products.filter((product) => product.stock > 0).sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry)).slice(0, 4)} onUpdate={updateProduct} getDiscount={getDiscount} /></section>
            </>}
            {staffTab === 'orders' && <><div className="staff-title-row"><div><span className="eyebrow">PŘÍPRAVA A PŘEDÁNÍ</span><h1>Objednávky</h1><p>Každý nákup je zaplacený předem a připravený na určený čas.</p></div><span className="orders-live"><span className="live-dot" /> Aktuální přehled</span></div><div className="orders-filter-bar"><div className="filter-tabs"><span className="filter-tab-current">Všechny <b>{orders.length}</b></span><span>Nové <b>{orders.filter((order) => order.status === 'Nová').length}</b></span><span>Připravené <b>{orders.filter((order) => order.status === 'Připraveno').length}</b></span></div><button className="outline-button small-outline" onClick={() => setNotice('Objednávky jsou aktuální')}><Bell size={15} /> Upozornění zapnuta</button></div><section className="staff-section full-orders"><div className="order-list">{orders.map((order) => <OrderRow key={order.id} order={order} products={products} onAdvance={changeOrderStatus} expanded />)}</div></section></>}
            {staffTab === 'stock' && <><div className="staff-title-row"><div><span className="eyebrow">ŠARŽE A DATA SPOTŘEBY</span><h1>Zásoby a čerstvost</h1><p>Uprav data spotřeby a dostupné množství. Prošlé zboží se zákazníkům nenabízí.</p></div><button className="outline-button" onClick={() => setNotice('Nové naskladnění je v tomto prototypu ukázkové')}><Plus size={16} /> Přidat naskladnění</button></div><div className="stock-callout"><div><span className="callout-icon"><Leaf size={17} /></span><span><strong>Automatické slevy běží</strong><small>Cena se mění podle nastavených pravidel a data spotřeby.</small></span></div><button onClick={() => setStaffTab('rules')}>Nastavit pravidla <ArrowRight size={14} /></button></div><section className="staff-section inventory-section"><div className="section-title-row"><div><span className="section-kicker">AKTUÁLNÍ POLOŽKY</span><h2>{products.length} produktů ve skladu</h2></div><div className="inventory-legend"><span><i className="legend-green" /> V pořádku</span><span><i className="legend-yellow" /> Brzy expiruje</span></div></div><StockTable products={products} onUpdate={updateProduct} getDiscount={getDiscount} /></section></>}
            {staffTab === 'rules' && <><div className="staff-title-row"><div><span className="eyebrow">MÉNĚ ODPADU, LEPŠÍ CENA</span><h1>Pravidla slev</h1><p>Nastav, kdy se sleva zapne. Změny platí pro zboží s blížící se spotřebou.</p></div><span className="rules-live"><span className="live-dot" /> Pravidla aktivní</span></div><div className="rules-layout"><section className="staff-section rules-card"><div className="rules-card-heading"><span className="rules-icon yellow-rule"><Clock3 size={19} /></span><div><span className="section-kicker">KROK 1</span><h2>Před koncem spotřeby</h2><p>Zlevnit produkty, kterým zbývá jen pár dní.</p></div></div><div className="setting-fields"><label><span>Sleva začne</span><div className="number-input"><input type="number" min="1" max="30" value={discounts.beforeDays} onChange={(event) => setDiscounts((current) => ({ ...current, beforeDays: Number(event.target.value) }))} /><span>dny před spotřebou</span></div></label><label><span>Výše slevy</span><div className="number-input"><input type="number" min="0" max="90" value={discounts.beforePercent} onChange={(event) => setDiscounts((current) => ({ ...current, beforePercent: Number(event.target.value) }))} /><span>%</span></div></label></div><div className="rule-example"><span className="example-icon"><Tag size={16} /></span><span>Jogurt s cenou 34 Kč bude stát</span><strong>{formatPrice(34 * (1 - discounts.beforePercent / 100))}</strong></div></section>
                  <section className="staff-section rules-card"><div className="rules-card-heading"><span className="rules-icon red-rule"><Flame size={19} /></span><div><span className="section-kicker">KROK 2</span><h2>Poslední den spotřeby</h2><p>Poslední šance pro čerstvé zboží. Po půlnoci se skryje.</p></div></div><div className="setting-fields single-field"><label><span>Výše slevy v poslední den</span><div className="number-input"><input type="number" min="0" max="90" value={discounts.todayPercent} onChange={(event) => setDiscounts((current) => ({ ...current, todayPercent: Number(event.target.value) }))} /><span>%</span></div></label></div><div className="rule-example"><span className="example-icon example-red"><AlertTriangle size={16} /></span><span>Jogurt s cenou 34 Kč bude stát</span><strong>{formatPrice(34 * (1 - discounts.todayPercent / 100))}</strong></div></section></div><div className="rules-bottom-note"><CheckCircle2 size={17} /><span><strong>Bezpečnostní kontrola</strong> Produkty po datu spotřeby se automaticky skryjí a nejdou vložit do košíku.</span></div><div className="rules-actions"><button className="text-button" onClick={() => setDiscounts({ beforeDays: 2, beforePercent: 20, todayPercent: 70 })}>Vrátit výchozí hodnoty</button><span><Check size={15} /> Změny se ukládají automaticky</span></div></>}
          </main>
        </div>
      )}

      {mode === 'shop' && <nav className="mobile-nav" aria-label="Hlavní navigace"><button className="mobile-nav-active" onClick={() => { setCategory('Vše'); setMobileCategoriesOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><Grid2X2 size={19} /><span>Objevovat</span></button><button className={mobileCategoriesOpen ? 'mobile-nav-active' : ''} onClick={() => setMobileCategoriesOpen((open) => !open)} aria-expanded={mobileCategoriesOpen}><Leaf size={19} /><span>Kategorie</span></button><button onClick={() => document.querySelector('.cart-panel')?.scrollIntoView({ behavior: 'smooth' })}><ShoppingCart size={19} /><span>Košík{cartCount > 0 ? ` · ${cartCount}` : ''}</span></button><button onClick={() => setMode('staff')}><Menu size={19} /><span>Obsluha</span></button></nav>}
      {notice && <div className="toast"><CheckCircle2 size={17} />{notice}</div>}

      {modal === 'checkout' && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null) }}><form className="dialog checkout-dialog" onSubmit={placeOrder}><div className="dialog-top"><span className="dialog-icon"><CreditCard size={20} /></span><button type="button" className="dialog-close" onClick={() => setModal(null)} aria-label="Zavřít"><X size={19} /></button></div><span className="section-kicker">POSLEDNÍ KROK</span><h2>Dokončit objednávku</h2><p className="dialog-intro">Zaplatíš předem. My nákup připravíme a pošleme ti potvrzení.</p><label className="form-field"><span>Jméno <small>nepovinné</small></span><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Jak ti máme říkat?" /></label><label className="form-field"><span>E-mail pro potvrzení</span><input required type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="ty@email.cz" /></label><div className="checkout-pickup"><div className="checkout-pickup-icon">{activeSlot?.mode === 'box' ? <Snowflake size={18} /> : <UserRound size={18} />}</div><div><span>Vyzvednutí {activeSlot?.mode === 'box' ? 'v chlazeném boxu' : 'osobně u obsluhy'}</span><strong>{activeSlot ? formatPickup(activeSlot.value) : 'Nejbližší dostupný termín'}</strong></div><CheckCircle2 size={17} /></div><div className="payment-line"><span><CreditCard size={17} /> Platba kartou předem</span><strong>{formatPrice(subtotal)}</strong></div><div className="demo-payment-note"><Sparkles size={14} /> Demo platba – nic se nestrhne.</div><button className="checkout-button dialog-submit" type="submit"><span>Simulovat bezpečnou platbu</span><ArrowRight size={18} /></button><div className="secure-note"><BadgeCheck size={14} /> Bez registrace · údaje zůstávají soukromé</div></form></div>}

      {modal === 'success' && lastOrder && <div className="modal-backdrop"><div className="dialog success-dialog"><div className="success-mark"><Check size={27} /></div><span className="section-kicker">OBJEDNÁVKA ZAPLACENA</span><h2>Hotovo. Teď už jen vyzvednout.</h2><p className="dialog-intro">Potvrzení {lastOrder.id} je připravené. Ukázkový e-mail: {lastOrder.email}</p><div className="success-pickup"><div className="success-pickup-icon"><PackageCheck size={22} /></div><div><span>{lastOrder.mode === 'box' ? 'Chlazený box' : 'Předání obsluhou'}</span><strong>{formatPickup(lastOrder.pickup)}</strong><small>MYNUTA · hlavní výdejní místo</small></div></div><button className="share-order-button" onClick={() => void makeShareLink({ type: 'order', items: lastOrder.items, pickup: lastOrder.pickup, orderId: lastOrder.id, customer: lastOrder.customer }, 'Odkaz k vyzvednutí je zkopírovaný')}><Share2 size={17} /> Sdílet vyzvednutí s někým blízkým</button><button className="checkout-button" onClick={() => { setModal(null); setMode('staff'); setStaffTab('orders') }}>Zobrazit v obsluze <ArrowRight size={17} /></button><div className="demo-payment-note"><CheckCircle2 size={14} /> Ukázková objednávka · bez skutečné platby</div></div></div>}

      {modal === 'share' && shared && <div className="modal-backdrop"><div className="dialog share-dialog"><div className="dialog-top"><span className="dialog-icon share-dialog-icon"><UsersRound size={21} /></span><button type="button" className="dialog-close" onClick={() => { setModal(null); setShared(null) }} aria-label="Zavřít"><X size={19} /></button></div><span className="section-kicker">NÁKUP VE DVOU</span><h2>{shared.type === 'cart' ? 'Někdo ti poslal seznam.' : 'Vyzvednutí je připravené.'}</h2><p className="dialog-intro">{shared.type === 'cart' ? 'Přidej ho do svého košíku a můžeš doplnit další věci, nebo objednávku rovnou zaplatit.' : `Objednávka ${shared.orderId ?? ''} je zaplacená. Sdílený odkaz předává informace k vyzvednutí.`}</p><div className="shared-items">{Object.entries(shared.items).map(([id, quantity]) => { const product = products.find((item) => item.id === id); return product ? <div key={id}><span>{quantity}×</span><strong>{product.name}</strong><b>{formatPrice(priceFor(product) * quantity)}</b></div> : null })}</div>{shared.type === 'cart' && <div className="shared-total"><span>Orientační součet</span><strong>{formatPrice(Object.entries(shared.items).reduce((sum, [id, quantity]) => { const product = products.find((item) => item.id === id); return sum + (product ? priceFor(product) * quantity : 0) }, 0))}</strong></div>}<button className="checkout-button" onClick={importSharedList}><span>{shared.type === 'cart' ? 'Přidat do mého košíku' : 'Rozumím, zobrazit nákup'}</span><ArrowRight size={18} /></button><div className="secure-note"><UsersRound size={14} /> Sdílený seznam můžeš před objednáním upravit</div></div></div>}
    </div>
  )
}

function OrderRow({ order, products, onAdvance, expanded = false }: { order: Order; products: Product[]; onAdvance: (id: string) => void; expanded?: boolean }) {
  const itemCount = Object.values(order.items).reduce((sum, quantity) => sum + quantity, 0)
  const itemsSummary = Object.entries(order.items).map(([id, quantity]) => `${quantity}× ${products.find((product) => product.id === id)?.name ?? 'Produkt'}`).join(', ')
  const nextAction: Partial<Record<Order['status'], string>> = { Nová: 'Začít přípravu', Připravuji: 'Označit připraveno', Připraveno: 'Potvrdit výdej' }
  return <article className={`order-row ${expanded ? 'order-row-expanded' : ''}`}><span className={`order-symbol order-${order.status.toLocaleLowerCase('cs')}`}>{order.status === 'Připraveno' ? <PackageCheck size={18} /> : order.status === 'Nová' ? <ShoppingBag size={18} /> : <Clock3 size={18} />}</span><div className="order-primary"><div className="order-person-line"><strong>{order.customer}</strong><span>{order.id}</span><span className={`order-status status-${order.status.toLocaleLowerCase('cs')}`}>{order.status}</span></div><span className="order-items-summary">{itemsSummary}</span>{expanded && <span className="order-email">{order.email || 'Host bez e-mailu'} · {order.paid ? 'Zaplaceno online' : 'Nezaplaceno'}</span>}</div><div className="order-meta"><span><Clock3 size={14} />{order.createdAt}</span><span>{order.mode === 'box' ? <Snowflake size={14} /> : <UserRound size={14} />}{formatPickup(order.pickup)}</span><small>{itemCount} položek</small></div><div className="order-end"><strong>{formatPrice(order.total)}</strong>{nextAction[order.status] ? <button onClick={() => onAdvance(order.id)}>{nextAction[order.status]} <ArrowRight size={14} /></button> : <span className="completed-label"><Check size={14} /> Vyřízeno</span>}</div></article>
}

function StockTable({ products, onUpdate, getDiscount }: { products: Product[]; onUpdate: (id: string, field: 'expiry' | 'stock', value: string) => void; getDiscount: (product: Product) => number }) {
  return <div className="stock-table-wrap"><table className="stock-table"><thead><tr><th>Produkt</th><th>Datum spotřeby</th><th>Zbývá</th><th>Sklad</th><th>Cena / sleva</th></tr></thead><tbody>{products.map((product) => { const remaining = daysUntil(product.expiry); const discount = getDiscount(product); return <tr key={product.id}><td><span className="stock-product"><img src={`https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=100&q=70`} alt="" /><span><strong>{product.name}</strong><small>{product.maker}</small></span></span></td><td><input className="date-input" type="date" value={product.expiry} onChange={(event) => onUpdate(product.id, 'expiry', event.target.value)} /></td><td><span className={`expiry-status ${remaining <= 2 ? 'expiry-soon' : ''}`}>{remaining === 0 ? 'Dnes' : remaining < 0 ? 'Prošlé' : `${remaining} dní`}</span></td><td><div className="stock-stepper"><button aria-label="Odebrat skladovou zásobu" onClick={() => onUpdate(product.id, 'stock', String(product.stock - 1))}><Minus size={12} /></button><span>{product.stock}</span><button aria-label="Přidat skladovou zásobu" onClick={() => onUpdate(product.id, 'stock', String(product.stock + 1))}><Plus size={12} /></button></div></td><td><span className="stock-price">{formatPrice(product.price * (1 - discount / 100))}</span>{discount > 0 && <span className="stock-discount">−{discount} %</span>}</td></tr> })}</tbody></table></div>
}

function LockKeyholeIcon() {
  return <span className="tiny-lock"><Check size={11} /></span>
}

export default App
