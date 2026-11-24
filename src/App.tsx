import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
  ChevronLeft,
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
const TEST_CATALOG_SIZE = 500
const testCatalogMode = new URLSearchParams(window.location.search).get('test-katalog') === String(TEST_CATALOG_SIZE)

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
  sellByWeight?: boolean
}
type CartLines = Record<string, number>
type SavedCart = { id: string; name: string; items: CartLines }
type PickupSlot = { value: string; label: string; dateLabel: string }
type PaymentMethod = 'cash' | 'card'
type Order = {
  id: string
  customer: string
  email: string
  items: CartLines
  actualItems?: CartLines
  weighedItems?: Record<string, boolean>
  unitPrices?: Record<string, number>
  total: number
  finalTotal?: number
  pickup: string
  status: 'Nová' | 'Připravuji' | 'Připraveno' | 'Vydáno'
  createdAt: string
  paid: boolean
  paymentMethod?: PaymentMethod
}
type DiscountSettings = { beforeDays: number; beforePercent: number; todayPercent: number }
type SharedPayload = { type: 'cart' | 'order'; items: CartLines; pickup?: string; orderId?: string; customer?: string }

const SWIPE_HINT_KEY = 'mynuta-swipe-hint-seen'

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

const subcategoryRules: Record<Exclude<Category, 'Vše'>, { name: string; match: string[] }[]> = {
  Chlazené: [
    { name: 'Mléko a jogurty', match: ['Čerstvé mléko', 'Kefír', 'Bílý jogurt', 'Zakysaná smetana'] },
    { name: 'Sýry a tvaroh', match: ['Sýr gouda', 'Mozzarella', 'Cottage sýr', 'Měkký tvaroh'] },
    { name: 'Máslo a vejce', match: ['Farmářské máslo', 'Vejce'] },
  ],
  Maso: [
    { name: 'Drůbeží', match: ['Kuřecí', 'Krůtí'] },
    { name: 'Hovězí', match: ['Hovězí', 'Mleté hovězí'] },
    { name: 'Vepřové', match: ['Vepřová'] },
    { name: 'Uzeniny', match: ['Farmářská klobása', 'Uzená slanina'] },
  ],
  Mražené: [
    { name: 'Zelenina a ovoce', match: ['Mražený hrášek', 'Lesní ovoce', 'Listový špenát', 'Zeleninová směs', 'Mražené borůvky'] },
    { name: 'Ryby a hotová jídla', match: ['Filety z tresky', 'Pizza', 'Hranolky', 'Bramborové knedlíky'] },
    { name: 'Zmrzlina', match: ['Vanilková zmrzlina'] },
  ],
  Nápoje: [
    { name: 'Vody a limonády', match: ['Domácí limonáda', 'Minerální voda', 'Ledový čaj', 'Bezový sirup'] },
    { name: 'Džusy a mošty', match: ['Jablečný mošt', 'Pomerančový džus', 'Kombucha'] },
    { name: 'Káva, čaj a kakao', match: ['Cold brew káva', 'Zelený čaj', 'Kakaový nápoj'] },
  ],
  Ovoce: [
    { name: 'Jablka a hrušky', match: ['Jablka', 'Hrušky'] },
    { name: 'Banány a exotika', match: ['Banány', 'Mango', 'Ananas'] },
    { name: 'Bobuloviny', match: ['Lesní borůvky', 'Maliny', 'Jahody'] },
    { name: 'Hrozny a citrusy', match: ['Hroznové víno', 'Pomeranče'] },
  ],
  Zelenina: [
    { name: 'Rajčata a papriky', match: ['Rajčata', 'Červená paprika', 'Salátová okurka', 'Cuketa'] },
    { name: 'Kořenová', match: ['Mrkev', 'Brambory', 'Červená cibule', 'Česnek', 'Ředkvičky'] },
    { name: 'Listová', match: ['Baby špenát'] },
  ],
  Pečivo: [
    { name: 'Chleby', match: ['Kváskový chléb', 'Žitný bochník', 'Špaldový chléb'] },
    { name: 'Housky a bagety', match: ['Celozrnná houska', 'Dalamánek', 'Bageta', 'Česneková bageta'] },
    { name: 'Sladké pečivo', match: ['Máslový croissant', 'Loupák', 'Makový závin'] },
  ],
  Trvanlivé: [
    { name: 'Snídaně a sladké', match: ['Květový med', 'Jemné ovesné vločky', 'Jahodový džem'] },
    { name: 'Těstoviny a luštěniny', match: ['Těstoviny penne', 'Červená čočka', 'Rýže basmati'] },
    { name: 'Káva, oleje a ořechy', match: ['Mletá káva', 'Olivový olej', 'Mandle natural', 'Rajčatová passata'] },
  ],
}

function subcategoryOf(product: Product) {
  return subcategoryRules[product.category].find((rule) => rule.match.some((prefix) => product.name.startsWith(prefix)))?.name ?? 'Ostatní'
}

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
  { id: 'rajcata', name: 'Rajčata (na váhu)', maker: 'Lokální pěstitel', category: 'Zelenina', price: 89, unit: 'kg', image: 'photo-1546094096-0df4bcaaa337', expiry: dateAfter(4), stock: 20, fresh: true, sellByWeight: true },
  { id: 'boruvky', name: 'Lesní borůvky', maker: 'Ovocnářství Novák', category: 'Ovoce', price: 69, unit: '125 g', image: 'photo-1498557850523-fd3d118b962e', expiry: dateAfter(0), stock: 5, note: 'Dnes poslední den' },
  { id: 'chleb', name: 'Kváskový chléb', maker: 'Pekárna U Tří zrn', category: 'Pečivo', price: 68, unit: '600 g', image: 'photo-1509440159596-0249088772ff', expiry: dateAfter(1), stock: 4, fresh: true },
  { id: 'maslo', name: 'Farmářské máslo', maker: 'Mlékárna Lány', category: 'Chlazené', price: 58, unit: '250 g', image: 'photo-1589985270826-4b7bb135bc9d', expiry: dateAfter(6), stock: 8 },
  { id: 'hrozny', name: 'Hroznové víno', maker: 'Zahrady Morava', category: 'Ovoce', price: 55, unit: '500 g', image: 'photo-1537640538966-79f369143f8f', expiry: dateAfter(5), stock: 6 },
  { id: 'kur', name: 'Kuřecí prsa', maker: 'Česká farma', category: 'Maso', price: 145, unit: '400 g', image: 'photo-1604503468506-a8da13d82791', expiry: dateAfter(3), stock: 5 },
  { id: 'hrasek', name: 'Mražený hrášek', maker: 'Zelená zahrada', category: 'Mražené', price: 39, unit: '450 g', image: 'photo-1587735243615-c03f25aaff15', expiry: dateAfter(200), stock: 14 },
  { id: 'oves', name: 'Jemné ovesné vločky', maker: 'Dobré ráno', category: 'Trvanlivé', price: 32, unit: '500 g', image: 'photo-1517673132405-a56a62b18caf', expiry: dateAfter(210), stock: 22 },
]

type TestCatalogSpec = {
  category: Exclude<Category, 'Vše'>
  count: number
  names: string[]
  variants: string[]
  makers: string[]
  units: string[]
  basePrice: number
}

const testCatalogSpecs: TestCatalogSpec[] = [
  { category: 'Chlazené', count: 70, names: ['Bílý jogurt', 'Farmářské máslo', 'Měkký tvaroh', 'Sýr gouda', 'Vejce z volného chovu', 'Čerstvé mléko', 'Kefír', 'Mozzarella', 'Cottage sýr', 'Zakysaná smetana'], variants: ['farmářský', 'bio', 'plnotučný', 'bez laktózy', 'z českého mléka', 'jemný', 'tradiční', 'rodinné balení'], makers: ['Farma Struhy', 'Mlékárna Lány', 'Statek u lesa', 'Mléko z Domažlic'], units: ['150 g', '250 g', '400 g', '500 g', '1 l', '6 ks'], basePrice: 55 },
  { category: 'Maso', count: 55, names: ['Kuřecí prsa', 'Hovězí na guláš', 'Vepřová kýta', 'Krůtí řízky', 'Mleté hovězí', 'Vepřová panenka', 'Hovězí roštěná', 'Kuřecí stehna', 'Farmářská klobása', 'Uzená slanina'], variants: ['čerstvé', 'na gril', 'z českého chovu', 'bez kosti', 'farmářské', 'výběrové', 'marinované', 'rodinné balení'], makers: ['Česká farma', 'Řeznictví U Mostu', 'Statek u lesa', 'Maso z Pošumaví'], units: ['300 g', '400 g', '500 g', '750 g', '1 kg'], basePrice: 190 },
  { category: 'Mražené', count: 45, names: ['Mražený hrášek', 'Lesní ovoce', 'Listový špenát', 'Hranolky', 'Zeleninová směs', 'Mražené borůvky', 'Filety z tresky', 'Pizza Margherita', 'Bramborové knedlíky', 'Vanilková zmrzlina'], variants: ['rychlá příprava', 'z českých surovin', 'rodinné balení', 'výběrové', 'bez přidané soli', 'sezónní', 'jemně kořeněné', 'farmářské'], makers: ['Zelená zahrada', 'Mrazírny Klatovy', 'Dobrá úroda', 'Mražené z lesa'], units: ['300 g', '450 g', '500 g', '750 g', '1 kg'], basePrice: 65 },
  { category: 'Nápoje', count: 60, names: ['Domácí limonáda', 'Jablečný mošt', 'Minerální voda', 'Pomerančový džus', 'Kombucha', 'Ledový čaj', 'Bezový sirup', 'Cold brew káva', 'Zelený čaj', 'Kakaový nápoj'], variants: ['bez přidaného cukru', 'z českého ovoce', 'bio', 'osvěžující', 'ručně vyráběný', 'rodinné balení', 'neperlivý', 'výběrový'], makers: ['LemonAid', 'Moštárna Radouš', 'Pramen Chodová Planá', 'Čaje z lesa'], units: ['330 ml', '500 ml', '750 ml', '1 l', '1,5 l'], basePrice: 42 },
  { category: 'Ovoce', count: 75, names: ['Jablka Gala', 'Hrušky Conference', 'Banány', 'Mango', 'Ananas Sweet', 'Lesní borůvky', 'Maliny', 'Jahody', 'Hroznové víno', 'Pomeranče'], variants: ['bio', 'z českého sadu', 'sladké', 'sezónní', 'výběrové', 'zralé', 'prémiové', 'šťavnaté'], makers: ['Ovocnářství Novák', 'Zahrady Morava', 'Sad u Plzně', 'Ovoce od sousedů'], units: ['250 g', '500 g', '1 ks', '1 kg', '125 g'], basePrice: 72 },
  { category: 'Zelenina', count: 70, names: ['Rajčata', 'Salátová okurka', 'Mrkev', 'Červená paprika', 'Cuketa', 'Brambory', 'Červená cibule', 'Česnek', 'Baby špenát', 'Ředkvičky'], variants: ['bio', 'z místní farmy', 'čerstvá', 'sezónní', 'výběrová', 'křupavá', 'česká', 'do polévky'], makers: ['Lokální pěstitel', 'Zelenina z Plzně', 'Zahrady Morava', 'Farma U Potoka'], units: ['250 g', '500 g', '1 ks', '1 kg', '125 g'], basePrice: 58 },
  { category: 'Pečivo', count: 50, names: ['Kváskový chléb', 'Žitný bochník', 'Máslový croissant', 'Celozrnná houska', 'Bageta', 'Loupák', 'Špaldový chléb', 'Dalamánek', 'Makový závin', 'Česneková bageta'], variants: ['kváskové', 'celozrnné', 'čerstvě pečené', 'špaldové', 'farmářské', 'bez lepku', 'tradiční', 'rodinné balení'], makers: ['Pekárna U Tří zrn', 'Pekařství Slunečná', 'Pekárna Na Růžku', 'Upečeno v Plzni'], units: ['1 ks', '2 ks', '400 g', '500 g', '600 g'], basePrice: 64 },
  { category: 'Trvanlivé', count: 75, names: ['Květový med', 'Jemné ovesné vločky', 'Těstoviny penne', 'Červená čočka', 'Mletá káva', 'Olivový olej', 'Rajčatová passata', 'Mandle natural', 'Rýže basmati', 'Jahodový džem'], variants: ['bio', 'celozrnné', 'z českých surovin', 'bez přidaného cukru', 'výběrové', 'rodinné balení', 'tradiční', 'farmářské'], makers: ['Medárna Čejkovice', 'Dobré ráno', 'Spíž od sousedů', 'Poctivá výživa'], units: ['250 g', '500 g', '1 kg', '1 l', '6 ks'], basePrice: 80 },
]

function createTestCatalog(): Product[] {
  let nextSku = initialProducts.length + 1
  const generatedProducts = testCatalogSpecs.flatMap((spec) => {
    const existingProducts = initialProducts.filter((product) => product.category === spec.category)
    const productsToGenerate = spec.count - existingProducts.length
    const imageTemplates = existingProducts
    if (productsToGenerate < 0 || productsToGenerate > spec.names.length * spec.variants.length || !imageTemplates.length) {
      throw new Error(`Invalid 500-SKU test catalog setup for ${spec.category}`)
    }

    return Array.from({ length: productsToGenerate }, (_, offset) => {
      const productIndex = existingProducts.length + offset
      const daysUntilExpiry = productIndex % 18 === 0 ? 0 : productIndex % 18 <= 2 ? 1 : 5 + (productIndex * 13) % 300
      const sellByWeight = (spec.category === 'Ovoce' || spec.category === 'Zelenina' || spec.category === 'Maso') && productIndex % 3 === 0
      const isFreshCategory = spec.category === 'Ovoce' || spec.category === 'Zelenina' || spec.category === 'Pečivo'

      const product: Product = {
        id: `test-sku-${String(nextSku).padStart(4, '0')}`,
        name: `${spec.names[productIndex % spec.names.length]} ${spec.variants[Math.floor(productIndex / spec.names.length)]}`,
        maker: spec.makers[productIndex % spec.makers.length],
        category: spec.category,
        price: Math.max(12, Math.round(spec.basePrice * (0.72 + ((productIndex * 17) % 70) / 100))),
        unit: sellByWeight ? 'kg' : spec.units[productIndex % spec.units.length],
        image: imageTemplates[productIndex % imageTemplates.length].image,
        expiry: dateAfter(daysUntilExpiry),
        stock: sellByWeight ? 12 + (productIndex % 29) : 2 + ((productIndex * 11) % 42),
        fresh: (isFreshCategory && productIndex % 3 === 0) || productIndex % 19 === 0,
        sellByWeight,
        note: daysUntilExpiry === 0 ? 'Dnes poslední den' : daysUntilExpiry <= 1 ? 'Spotřebujte do 2 dnů' : undefined,
      }
      nextSku += 1
      return product
    })
  })

  const catalog = [...initialProducts, ...generatedProducts]
  if (catalog.length !== TEST_CATALOG_SIZE || new Set(catalog.map((product) => product.id)).size !== TEST_CATALOG_SIZE) {
    throw new Error(`Test catalog must contain exactly ${TEST_CATALOG_SIZE} unique SKU`)
  }
  return catalog
}

const demoOrder: Order = {
  id: 'MN-260928', customer: 'Jana Novotná', email: 'jana@example.cz', items: { jogurt: 2, chleb: 1, boruvky: 1 },
  total: 129.5, pickup: `${dateAfter(2)}T09:00`, status: 'Nová', createdAt: 'Dnes, 8:42', paid: false,
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

function buildPickupSlots(now: number): PickupSlot[] {
  const earliest = new Date(now + 60 * 60 * 1000)
  const slots: PickupSlot[] = []
  const times = [9, 12, 15, 18]
  for (let day = 0; day < 14 && slots.length < 16; day += 1) {
    const date = new Date(now)
    date.setDate(date.getDate() + day)
    for (const hour of times) {
      const candidate = new Date(date)
      candidate.setHours(hour, 0, 0, 0)
      if (candidate < earliest) continue
      const dateLabel = new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' }).format(candidate)
      slots.push({
        value: `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, '0')}-${String(candidate.getDate()).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00`,
        label: `${dateLabel}, ${String(hour).padStart(2, '0')}:00`,
        dateLabel,
      })
    }
  }
  return slots
}

function formatPickupDeadline(expiry: string) {
  if (expiry === dateAfter(0)) return 'dnes'
  if (expiry === dateAfter(1)) return 'zítra'
  return new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric' }).format(new Date(`${expiry}T00:00:00`))
}

function formatPickupOption(slot: PickupSlot) {
  const date = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric' }).format(new Date(slot.value))
  return `${date}, ${slot.value.slice(-5)}`
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount)
}

function formatQuantity(quantity: number, product: Product) {
  const formatted = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 }).format(quantity)
  return product.sellByWeight ? `${formatted} kg` : String(quantity)
}

function formatItemCount(count: number) {
  const lastTwoDigits = count % 100
  const noun = count === 1 ? 'položka' : count % 10 >= 2 && count % 10 <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14) ? 'položky' : 'položek'
  return `${count} ${noun}`
}

function quantityStep(product: Product) {
  return product.sellByWeight ? 0.25 : 1
}

function roundQuantity(quantity: number) {
  return Math.round(quantity * 100) / 100
}

function calculateOrderTotal(order: Order, products: Product[]) {
  if (!order.unitPrices && !order.actualItems) return order.total
  const total = Object.entries(order.items).reduce((sum, [id, requestedQuantity]) => {
    const product = products.find((item) => item.id === id)
    if (!product) return sum
    const quantity = order.actualItems?.[id] ?? requestedQuantity
    const unitPrice = order.unitPrices?.[id] ?? product.price
    return sum + quantity * unitPrice
  }, 0)
  return Math.round(total * 100) / 100
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
  const storageKey = (name: string) => testCatalogMode ? `mynuta-test-500-${name}-v1` : `mynuta-${name}-v1`
  const productSeed = useMemo(() => testCatalogMode ? createTestCatalog() : initialProducts, [])
  const [products, setProducts] = useStoredState<Product[]>(storageKey('products'), productSeed)
  const [cart, setCart] = useStoredState<CartLines>(storageKey('cart'), {})
  const [savedCarts, setSavedCarts] = useStoredState<SavedCart[]>(storageKey('saved-carts'), [])
  const [orders, setOrders] = useStoredState<Order[]>(storageKey('orders'), [demoOrder])
  const [discounts, setDiscounts] = useStoredState<DiscountSettings>(storageKey('discounts'), { beforeDays: 2, beforePercent: 20, todayPercent: 70 })
  const [mode, setMode] = useState<'shop' | 'staff'>('shop')
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [categorySheetOpen, setCategorySheetOpen] = useState(false)
  const [staffTab, setStaffTab] = useState<'overview' | 'orders' | 'stock' | 'rules'>('overview')
  const [category, setCategory] = useState<Category>('Vše')
  const [subSelection, setSubSelection] = useState<{ category: Category; name: string } | null>(null)
  const activeSub = subSelection?.category === category ? subSelection.name : null
  const [search, setSearch] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchVisible = mobileSearchOpen || search.trim() !== ''
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
  const [swipeAnimation, setSwipeAnimation] = useState<{ direction: 'next' | 'prev'; id: number } | null>(null)
  const shopMainRef = useRef<HTMLElement>(null)
  const categoryMenuRef = useRef<HTMLElement>(null)
  const [lastOrder, setLastOrder] = useState<Order | null>(null)
  const migratedLegacyTomatoes = useRef(false)
  const [now, setNow] = useState(() => Date.now())
  const slots = useMemo(() => buildPickupSlots(now), [now])
  const firstPickupDate = slots[0]?.value.slice(0, 10) ?? dateAfter(0)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (migratedLegacyTomatoes.current) return
    const legacyTomatoes = products.some((product) => product.id === 'rajcata' && !product.sellByWeight)
    if (!legacyTomatoes) return
    migratedLegacyTomatoes.current = true
    setProducts((current) => current.map((product) => product.id === 'rajcata' && !product.sellByWeight
      ? { ...product, name: 'Rajčata (na váhu)', price: 89, unit: 'kg', sellByWeight: true }
      : product))
    setCart((current) => current.rajcata ? { ...current, rajcata: roundQuantity(current.rajcata * 0.25) } : current)
    setSavedCarts((current) => current.map((saved) => saved.items.rajcata
      ? { ...saved, items: { ...saved.items, rajcata: roundQuantity(saved.items.rajcata * 0.25) } }
      : saved))
  }, [products, setCart, setProducts, setSavedCarts])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const swipeContext = useRef({ enabled: false, category })
  useEffect(() => {
    swipeContext.current = { enabled: mode === 'shop' && !categorySheetOpen && !mobileCartOpen && modal === null && search.trim() === '', category }
  })

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 760px)')
    let start: { x: number; y: number; time: number } | null = null
    const isBlocked = (target: EventTarget | null) => {
      for (let element = target as HTMLElement | null; element && element !== document.body; element = element.parentElement) {
        if (element.matches('input, textarea, select, .topbar, .mobile-nav, .mobile-category-shell, .cart-panel, .category-sheet, .modal-backdrop')) return true
        if (element.scrollWidth > element.clientWidth + 2 && /auto|scroll/.test(getComputedStyle(element).overflowX)) return true
      }
      return false
    }
    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      start = event.touches.length === 1 && mobile.matches && swipeContext.current.enabled && !isBlocked(event.target)
        ? { x: touch.clientX, y: touch.clientY, time: Date.now() }
        : null
    }
    const onEnd = (event: TouchEvent) => {
      if (!start) return
      const touch = event.changedTouches[0]
      const dx = touch.clientX - start.x
      const dy = touch.clientY - start.y
      const elapsed = Date.now() - start.time
      start = null
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.7 || elapsed > 800) return
      const index = categoryOptions.findIndex((option) => option.name === swipeContext.current.category)
      const target = categoryOptions[index + (dx < 0 ? 1 : -1)]
      if (!target) return
      window.localStorage.setItem(SWIPE_HINT_KEY, '1')
      setCategory(target.name)
      setSubSelection(null)
      setSwipeAnimation({ direction: dx < 0 ? 'next' : 'prev', id: Date.now() })
      window.scrollTo({ top: 0 })
    }
    const cancel = () => { start = null }
    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchend', onEnd, { passive: true })
    document.addEventListener('touchcancel', cancel, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', cancel)
    }
  }, [])

  useEffect(() => {
    const main = shopMainRef.current
    if (!swipeAnimation || !main) return
    main.classList.remove('swipe-from-right', 'swipe-from-left')
    void main.offsetWidth
    main.classList.add(swipeAnimation.direction === 'next' ? 'swipe-from-right' : 'swipe-from-left')
  }, [swipeAnimation])

  useEffect(() => {
    const menu = categoryMenuRef.current
    const active = menu?.querySelector<HTMLElement>('.mobile-category-active')
    if (!menu || !active) return
    const offset = active.getBoundingClientRect().left - menu.getBoundingClientRect().left - (menu.clientWidth - active.offsetWidth) / 2
    menu.scrollTo({ left: menu.scrollLeft + offset, behavior: 'smooth' })
  }, [category])

  useEffect(() => {
    if (mode !== 'shop' || !window.matchMedia('(max-width: 760px) and (pointer: coarse)').matches) return
    const timer = window.setTimeout(() => {
      if (window.localStorage.getItem(SWIPE_HINT_KEY)) return
      window.localStorage.setItem(SWIPE_HINT_KEY, '1')
      setNotice('Přejetím prstem do strany změníš kategorii')
    }, 2500)
    return () => window.clearTimeout(timer)
  }, [mode])

  const getDiscount = (product: Product) => {
    const remaining = daysUntil(product.expiry)
    if (remaining < 0) return 100
    if (remaining === 0) return discounts.todayPercent
    if (remaining <= discounts.beforeDays) return discounts.beforePercent
    return 0
  }
  const priceFor = (product: Product) => Math.round(product.price * (1 - getDiscount(product) / 100) * 100) / 100
  const searchTerm = search.trim().toLocaleLowerCase('cs')
  const matchesSearch = (product: Product) => !searchTerm || `${product.name} ${product.maker} ${product.category}`.toLocaleLowerCase('cs').includes(searchTerm)
  const availableProducts = products.filter((product) => product.expiry >= firstPickupDate && product.stock > 0)
  const orderableCount = products.filter((product) => product.expiry >= firstPickupDate).length
  const discountedProducts = availableProducts
    .filter((product) => getDiscount(product) > 0)
    .sort((first, second) => getDiscount(second) - getDiscount(first) || daysUntil(first.expiry) - daysUntil(second.expiry))
  const dealCount = discountedProducts.filter((product) => (category === 'Vše' || product.category === category) && matchesSearch(product)).length
  const browseMode = category === 'Vše' && !searchTerm && !dealOnly
  const featuredProducts = browseMode ? discountedProducts.slice(0, 16) : []
  const categoryShelves = browseMode ? categoryOptions.slice(1).map(({ name }) => ({ name, items: availableProducts.filter((product) => product.category === name) })).filter((shelf) => shelf.items.length > 0) : []
  const visibleProducts = availableProducts.filter((product) => {
    const matchesCategory = category === 'Vše' || product.category === category
    return matchesCategory && (!activeSub || subcategoryOf(product) === activeSub) && matchesSearch(product) && (!dealOnly || getDiscount(product) > 0)
  })
  const subcategoryTabs = category === 'Vše' ? [] : subcategoryRules[category]
    .map(({ name }) => ({ name, count: availableProducts.filter((product) => product.category === category && subcategoryOf(product) === name).length }))
    .filter((tab) => tab.count > 0)
  const categoryDeals = discountedProducts.filter((product) => product.category === category)
  const subcategoryRows = category !== 'Vše' && !activeSub && !searchTerm && !dealOnly && subcategoryTabs.length > 1
    ? subcategoryTabs.map(({ name }) => ({ name, items: visibleProducts.filter((product) => subcategoryOf(product) === name) }))
    : null
  const cartEntries = Object.entries(cart).filter(([, quantity]) => quantity > 0)
  const cartCount = cartEntries.length
  const earliestExpiring = cartEntries.reduce<Product | null>((earliest, [id]) => {
    const product = products.find((item) => item.id === id)
    return product && (!earliest || product.expiry < earliest.expiry) ? product : earliest
  }, null)
  const validSlots = earliestExpiring ? slots.filter((slot) => slot.value.slice(0, 10) <= earliestExpiring.expiry) : slots
  const activeSlot = validSlots.find((slot) => slot.value === selectedSlot) ?? validSlots[0]
  const pickupLimited = earliestExpiring !== null && validSlots.length < slots.length
  const subtotal = cartEntries.reduce((sum, [id, quantity]) => {
    const product = products.find((item) => item.id === id)
    return sum + (product ? priceFor(product) * quantity : 0)
  }, 0)
  const totalBeforeDiscount = cartEntries.reduce((sum, [id, quantity]) => {
    const product = products.find((item) => item.id === id)
    return sum + (product ? product.price * quantity : 0)
  }, 0)
  const savedAmount = totalBeforeDiscount - subtotal

  const addToCart = (id: string, quantity?: number) => {
    const product = products.find((item) => item.id === id)
    if (!product) return
    if (product.expiry < firstPickupDate) {
      setNotice(`${product.name} už nestihneš vyzvednout`)
      return
    }
    const nextQuantity = roundQuantity((cart[id] ?? 0) + (quantity ?? quantityStep(product)))
    if (product.stock + 0.000001 < nextQuantity) {
      setNotice('Požadované množství už není skladem')
      return
    }
    if (!cart[id] && (!earliestExpiring || product.expiry < earliestExpiring.expiry) && slots.some((slot) => slot.value.slice(0, 10) > product.expiry)) {
      setNotice(`${product.name}: vyzvednutí nejpozději ${formatPickupDeadline(product.expiry)}`)
    }
    setCart((current) => ({ ...current, [id]: nextQuantity }))
  }
  const removeFromCart = (id: string) => {
    setCart((current) => {
      const product = products.find((item) => item.id === id)
      const next = { ...current, [id]: roundQuantity((current[id] ?? 0) - (product ? quantityStep(product) : 1)) }
      if (next[id] <= 0.000001) delete next[id]
      return next
    })
  }

  const makeShareLink = async (payload: SharedPayload, message: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('sdileni', encodeShare(payload))
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
    if (!cartCount) return
    if (!activeSlot) {
      setNotice(`${earliestExpiring?.name ?? 'Zboží v košíku'} už nestihneš vyzvednout, odeber ho z košíku`)
      return
    }
    const unavailable = cartEntries.some(([id, quantity]) => {
      const product = products.find((item) => item.id === id)
      return !product || quantity > product.stock + 0.000001
    })
    if (unavailable) {
      setNotice('Některá položka už není v požadovaném množství skladem')
      return
    }
    const order: Order = {
      id: `MN-${crypto.randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase()}`,
      customer: customerName.trim() || 'Host',
      email: customerEmail.trim(),
      items: { ...cart },
      actualItems: { ...cart },
      unitPrices: Object.fromEntries(cartEntries.flatMap(([id]) => {
        const product = products.find((item) => item.id === id)
        return product ? [[id, priceFor(product)]] : []
      })),
      total: subtotal,
      pickup: activeSlot.value,
      status: 'Nová',
      createdAt: 'Právě teď',
      paid: false,
    }
    setOrders((current) => [order, ...current])
    setProducts((current) => current.map((product) => ({ ...product, stock: Math.max(0, roundQuantity(product.stock - (cart[product.id] ?? 0))) })))
    setLastOrder(order)
    setCart({})
    setMobileCartOpen(false)
    setModal('success')
  }

  const updateOrderActualWeight = (orderId: string, productId: string, quantity: number) => {
    const order = orders.find((item) => item.id === orderId)
    const product = products.find((item) => item.id === productId)
    if (!order || !product?.sellByWeight) return
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setNotice('Skutečná hmotnost musí být větší než 0 kg')
      return
    }
    const nextQuantity = roundQuantity(quantity)
    const currentQuantity = order.actualItems?.[productId] ?? order.items[productId] ?? 0
    if (nextQuantity > product.stock + currentQuantity + 0.000001) {
      setNotice('Skutečná hmotnost přesahuje volnou zásobu')
      return
    }
    setProducts((current) => current.map((item) => item.id === productId
      ? { ...item, stock: Math.max(0, roundQuantity(item.stock + currentQuantity - nextQuantity)) }
      : item))
    setOrders((current) => current.map((item) => item.id === orderId
      ? {
          ...item,
          actualItems: { ...item.actualItems, [productId]: nextQuantity },
          weighedItems: { ...item.weighedItems, [productId]: true },
          finalTotal: undefined,
        }
      : item))
  }

  const changeOrderStatus = (orderId: string, paymentMethod?: PaymentMethod) => {
    const order = orders.find((item) => item.id === orderId)
    if (!order) return
    const nextStatus: Record<Order['status'], Order['status']> = { Nová: 'Připravuji', Připravuji: 'Připraveno', Připraveno: 'Vydáno', Vydáno: 'Vydáno' }
    const status = nextStatus[order.status]
    if (order.status === 'Připravuji') {
      const needsWeighing = Object.keys(order.items).some((id) => products.some((product) => product.id === id && product.sellByWeight) && !order.weighedItems?.[id])
      if (needsWeighing) {
        setNotice('Před dokončením přípravy zadej skutečnou hmotnost váženého zboží')
        return
      }
    }
    if (status === 'Vydáno' && !paymentMethod) {
      setNotice('Před potvrzením výdeje vyber hotovost nebo kartu')
      return
    }
    const finalTotal = status === 'Vydáno' ? calculateOrderTotal(order, products) : order.finalTotal
    setOrders((current) => current.map((order) => {
      if (order.id !== orderId) return order
      return {
        ...order,
        status,
        paid: status === 'Vydáno' ? true : order.paid,
        paymentMethod: status === 'Vydáno' ? paymentMethod : order.paymentMethod,
        finalTotal,
      }
    }))
  }

  const updateProduct = (id: string, field: 'expiry' | 'stock', value: string) => {
    setProducts((current) => current.map((product) => {
      if (product.id !== id) return product
      if (field === 'expiry') return { ...product, expiry: value }
      const stock = Number(value)
      return Number.isFinite(stock) ? { ...product, stock: Math.max(0, roundQuantity(stock)) } : product
    }))
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
      setNotice(`Objednávka ${shared.orderId ?? ''} je rezervovaná, čeká na osobní převzetí`)
    }
    setShared(null)
    setModal(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('sdileni')
    window.history.replaceState({}, '', url)
  }

  const renderProductCard = (product: Product, index: number) => {
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
        <div className="product-bottom"><div className="price-group"><strong>{formatPrice(priceFor(product))}</strong>{discount > 0 && <del>{formatPrice(product.price)}</del>}<small>{product.sellByWeight ? 'za kg' : product.unit}</small></div>
          {quantity ? <div className={`quantity-control ${product.sellByWeight ? 'quantity-control-weighted' : ''}`}><button aria-label={product.sellByWeight ? `Odebrat ${formatQuantity(quantityStep(product), product)}` : 'Odebrat kus'} onClick={() => removeFromCart(product.id)}><Minus size={14} /></button><span>{formatQuantity(quantity, product)}</span><button aria-label={`Přidat další ${product.name}`} onClick={() => addToCart(product.id)}><Plus size={14} /></button></div> : <button className="add-button" aria-label={`Přidat ${product.name} do košíku`} onClick={() => addToCart(product.id)}><Plus size={16} /><span>{product.sellByWeight ? '+ 0,25 kg' : 'Přidat'}</span></button>}
        </div>
        {product.note && <div className={`expiry-note ${discount ? 'expiry-discount' : ''}`}><Clock3 size={12} />{product.note}</div>}
      </div>
    </article>
  }

  return (
    <div className={`app-shell ${mode === 'shop' ? 'shop-mode' : 'staff-mode'} ${searchVisible ? 'search-open' : ''}`}>
      <header className="topbar">
        <button className="brand-lockup" type="button" onClick={() => { setMode('shop'); setCategory('Vše') }} aria-label="MYNUTA, přejít na nákup">
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}mynuta-logo.svg`} alt="" />
          <span className="brand-tagline">rychle – do mynuty</span>
        </button>
        <label className="global-search">
          <Search size={17} />
          <input ref={searchInputRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={testCatalogMode ? 'Hledat mezi 500 testovacími SKU' : 'Hledat v ukázkovém sortimentu'} aria-label="Hledat produkty" />
          <kbd>⌘ K</kbd>
        </label>
        <div className="top-actions">
          <button className="icon-button notification-button" title="Upozornění" aria-label="Upozornění"><Bell size={19} /><span className="notification-dot" /></button>
          <span className="header-divider" />
          <button className="mode-switch" type="button" onClick={() => { setMobileCartOpen(false); setMode(mode === 'shop' ? 'staff' : 'shop') }}>
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
            <button className={`category-link ${category === 'Vše' ? 'is-selected' : ''}`} onClick={() => setCategory('Vše')}><Grid2X2 size={17} /><span>Všechny produkty</span><span className="category-count">{orderableCount}</span></button>
            <div className="rail-separator" />
            {categoryOptions.slice(1).map(({ name, icon: Icon, tone }) => (
              <div className="category-group" key={name}>
                <button className={`category-link ${category === name ? 'is-selected' : ''}`} onClick={() => { setCategory(name); setSubSelection(null) }}>
                  <span className={`category-icon ${tone}`}><Icon size={15} /></span><span>{name}</span>
                  <span className="category-count">{products.filter((product) => product.category === name && product.expiry >= firstPickupDate).length}</span>
                </button>
                {category === name && subcategoryTabs.map((tab) => (
                  <button key={tab.name} className={`subcategory-link ${activeSub === tab.name ? 'is-selected' : ''}`} onClick={() => setSubSelection({ category: name, name: tab.name })}>
                    <span>{tab.name}</span><span className="category-count">{tab.count}</span>
                  </button>
                ))}
              </div>
            ))}
            <div className="rail-promo"><span className="promo-leaf"><Leaf size={18} /></span><strong>Méně plýtvání</strong><p>Čerstvé věci za lepší cenu.</p><button onClick={() => setDealOnly(true)}>Ukázat slevy <ArrowRight size={13} /></button></div>
            <div className="branch-mini"><MapPin size={15} /><span><strong>MYNUTA · hlavní</strong><small>Výdejní místo · otevřeno</small></span></div>
          </aside>

          <div className="mobile-category-shell">
            <nav className="mobile-category-menu" aria-label="Kategorie produktů" ref={categoryMenuRef}>
              {categoryOptions.map(({ name, icon: Icon, tone }) => {
                const count = name === 'Vše' ? orderableCount : products.filter((product) => product.category === name && product.expiry >= firstPickupDate).length
                return <button key={name} className={category === name ? 'mobile-category-active' : ''} aria-pressed={category === name} onClick={() => {
                  setCategory(name)
                }}>
                  <span className={`category-icon ${tone}`}><Icon size={20} /></span><span>{name}</span><small>{count}</small>
                </button>
              })}
            </nav>
            <span className="mobile-category-scroll-cue" aria-hidden="true"><ChevronRight size={16} /></span>
          </div>
          <main className="shop-main" ref={shopMainRef}>
            {browseMode ? <>
              {featuredProducts.length > 0 && <ProductShelf label="Akční produkty" kicker={testCatalogMode ? 'TEST 500 SKU' : 'AKTUÁLNÍ SLEVY'} title="Právě v akci" titleId="deal-rail-title" actionLabel="Všechny akce" onAction={() => setDealOnly(true)}>{featuredProducts.map(renderProductCard)}</ProductShelf>}
              {categoryShelves.map(({ name, items }) => <ProductShelf key={name} label={name} title={name} count={items.length} actionLabel="Zobrazit vše" onAction={() => setCategory(name)}>{items.slice(0, 16).map(renderProductCard)}</ProductShelf>)}
            </> : <>
              {subcategoryTabs.length > 1 && !subcategoryRows && <nav className="subcategory-bar" aria-label={`Podkategorie ${category}`}>
                <button className={!activeSub ? 'subcategory-active' : ''} aria-pressed={!activeSub} onClick={() => setSubSelection(null)}>Vše <small>{subcategoryTabs.reduce((sum, tab) => sum + tab.count, 0)}</small></button>
                {subcategoryTabs.map((tab) => <button key={tab.name} className={activeSub === tab.name ? 'subcategory-active' : ''} aria-pressed={activeSub === tab.name} onClick={() => setSubSelection({ category, name: tab.name })}>{tab.name} <small>{tab.count}</small></button>)}
              </nav>}
              <div className="catalog-toolbar">
                <div className="catalog-title"><div><h1>{category === 'Vše' ? 'Výsledky' : activeSub ? `${category} · ${activeSub}` : category}</h1><span>{testCatalogMode ? `${visibleProducts.length} z ${products.length} SKU · fiktivní sortiment` : `${visibleProducts.length} ukázkových produktů`}</span></div></div>
                <div className="catalog-filters"><button className={`filter-chip ${dealOnly ? 'filter-active' : ''}`} onClick={() => setDealOnly(!dealOnly)}><Flame size={15} /> Jen v akci <span className="deal-counter">{dealCount}</span></button><button className="sort-button" onClick={() => setNotice('Řazení podle doporučení')}><span>Nejrelevantnější</span><ChevronDown size={15} /></button></div>
              </div>

              {dealOnly && <div className="deal-notice"><Tag size={15} /> Právě zachraňujeme čerstvé zásoby. Sleva se počítá automaticky podle data spotřeby.<button onClick={() => setDealOnly(false)} aria-label="Zrušit filtr"><X size={15} /></button></div>}
              {subcategoryRows && categoryDeals.length > 0 && <ProductShelf className="shelf-deals" label={`Akce v kategorii ${category}`} kicker="SLEVY A BRZY EXPIRUJE" title={`Akce v kategorii ${category}`} titleId="category-deals-title" count={categoryDeals.length} actionLabel="Zobrazit vše" onAction={() => setDealOnly(true)}>{categoryDeals.slice(0, 16).map(renderProductCard)}</ProductShelf>}
              {subcategoryRows ? subcategoryRows.map(({ name, items }) => <ProductShelf key={name} label={name} title={name} count={items.length} actionLabel="Zobrazit vše" onAction={() => setSubSelection({ category, name })}>{items.slice(0, 16).map(renderProductCard)}</ProductShelf>) : visibleProducts.length ? <div className="product-grid">
                {visibleProducts.map(renderProductCard)}
              </div> : <div className="empty-products"><Search size={27} /><strong>Nic jsme nenašli</strong><span>Zkus upravit hledání nebo vybrat jinou kategorii.</span><button onClick={() => { setSearch(''); setCategory('Vše'); setDealOnly(false) }}>Zobrazit vše</button></div>}
            </>}
            <footer className="shop-footer"><span>MYNUTA · hlavní výdejní místo</span><span>Rychle – do Mynuty <span className="footer-clock">◷</span></span></footer>
          </main>

          {mobileCartOpen && <button className="mobile-cart-backdrop" onClick={() => setMobileCartOpen(false)} aria-label="Zavřít panel nákupního košíku" />}
          <aside className={`cart-panel ${mobileCartOpen ? 'mobile-cart-open' : ''}`}>
            <div className="cart-panel-top"><div><span className="panel-overline">TVŮJ NÁKUP</span><h2>Košík <span>{cartCount}</span></h2></div><div className="cart-panel-actions"><button className="subtle-icon" aria-label="Sdílet nákupní seznam" onClick={shareCart}><Share2 size={17} /></button><button className="subtle-icon mobile-cart-close" aria-label="Zavřít košík" onClick={() => setMobileCartOpen(false)}><X size={19} /></button></div></div>
            <div className="cart-tabs"><button className={cartTab === 'aktivni' ? 'tab-active' : ''} onClick={() => setCartTab('aktivni')}>Aktuální <span>{cartCount}</span></button><button className={cartTab === 'ulozene' ? 'tab-active' : ''} onClick={() => setCartTab('ulozene')}>Uložené <span>{savedCarts.length}</span></button></div>
            {cartTab === 'aktivni' ? <>
              {cartEntries.length ? <div className="cart-items">
                {cartEntries.map(([id, quantity]) => {
                  const product = products.find((item) => item.id === id)
                  if (!product) return null
                  return <div className="cart-item" key={id}><img src={`https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=140&q=75`} alt="" /><div className="cart-item-text"><strong>{product.name}</strong><span>{product.sellByWeight ? `${formatPrice(priceFor(product))} / kg` : `${formatPrice(priceFor(product))} · ${product.unit}`}</span></div><div className={`cart-quantity ${product.sellByWeight ? 'cart-quantity-weighted' : ''}`}><button onClick={() => removeFromCart(id)} aria-label={product.sellByWeight ? `Odebrat ${formatQuantity(quantityStep(product), product)}` : 'Odebrat kus'}><Minus size={12} /></button><span>{formatQuantity(quantity, product)}</span><button onClick={() => addToCart(id)} aria-label={`Přidat další ${product.name}`}><Plus size={12} /></button></div></div>
                })}
                <button className="share-list-button" onClick={shareCart}><UsersRound size={16} /><span>Sdílet nákupní seznam</span><Share2 size={14} /></button>
                {showSaveField ? <form className="save-cart-form" onSubmit={(event) => { event.preventDefault(); saveCurrentCart() }}><input autoFocus value={savedName} onChange={(event) => setSavedName(event.target.value)} placeholder="Např. Snídaně" aria-label="Název seznamu" /><button type="submit" aria-label="Uložit seznam"><Check size={16} /></button><button type="button" onClick={() => setShowSaveField(false)} aria-label="Zrušit"><X size={15} /></button></form> : <button className="save-list-button" onClick={() => setShowSaveField(true)}><Plus size={15} /> Uložit jako seznam</button>}
              </div> : <div className="empty-cart"><span className="empty-cart-art"><ShoppingBag size={34} /></span><strong>Košík je zatím prázdný</strong><p>Začni něčím dobrým. Přidávání je rychlejší než fronta.</p><span className="empty-cart-hint"><Sparkles size={14} /> Každý kousek vybíráš ty</span></div>}
              <div className="cart-summary"><div className="cart-pickup-line"><div className="summary-icon"><Truck size={16} /></div><strong>Čas vyzvednutí</strong><label className="cart-pickup-select"><select value={activeSlot?.value ?? ''} onChange={(event) => setSelectedSlot(event.target.value)} aria-label="Čas vyzvednutí">
                {validSlots.map((slot) => <option key={slot.value} value={slot.value}>{formatPickupOption(slot)}</option>)}
              </select><ChevronDown size={14} /></label></div>
                {pickupLimited && earliestExpiring && <div className="pickup-limit-note"><Clock3 size={13} /><span>{activeSlot ? `${earliestExpiring.name} lze vyzvednout nejpozději ${formatPickupDeadline(earliestExpiring.expiry)}.` : `${earliestExpiring.name} už nestihneš vyzvednout. Odeber ho z košíku.`}</span></div>}
                <div className="summary-line"><span>Mezisoučet</span><span>{formatPrice(totalBeforeDiscount)}</span></div>{savedAmount > 0 && <div className="summary-line saved-line"><span><Leaf size={13} /> Ušetříš díky slevám</span><strong>−{formatPrice(savedAmount)}</strong></div>}
                <div className="summary-total"><span>Celkem při převzetí</span><strong>{formatPrice(subtotal)}</strong></div><button className="checkout-button" disabled={!cartCount || !activeSlot} onClick={() => { setMobileCartOpen(false); setModal('checkout') }}><span>Pokračovat k rezervaci</span><ArrowRight size={18} /></button><div className="secure-note"><BadgeCheck size={14} /> Zaplatíš jednou při převzetí</div>
              </div>
            </> : <div className="saved-cart-list">{savedCarts.length ? savedCarts.map((saved) => <div className="saved-cart-card" key={saved.id}><div className="saved-cart-icon"><ShoppingBag size={17} /></div><div><strong>{saved.name}</strong><span>{formatItemCount(Object.keys(saved.items).length)}</span></div><button onClick={() => loadSavedCart(saved)} aria-label={`Načíst seznam ${saved.name}`}><ArrowRight size={16} /></button></div>) : <div className="saved-empty"><ShoppingBag size={25} /><strong>Zatím tu nic není</strong><span>Ulož si oblíbený nákup pro příště.</span></div>}</div>}
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
              <div className="staff-title-row"><div><span className="eyebrow">OSOBNÍ VYZVEDNUTÍ · PLATBA NA MÍSTĚ</span><h1>Dobré ráno, Miroslave.</h1><p>Tady je přehled toho, co dnes potřebuje pozornost.</p></div><button className="outline-button" onClick={() => setStaffTab('stock')}><Package size={16} /> Zkontrolovat zásoby</button></div>
              <div className="stat-grid">
                <div className="stat-card stat-orders"><span className="stat-icon"><ClipboardList size={19} /></span><span className="stat-label">Nové objednávky</span><strong>{orders.filter((order) => order.status === 'Nová' || order.status === 'Připravuji').length}</strong><span className="stat-foot">čekají na přípravu</span></div>
                <div className="stat-card stat-ready"><span className="stat-icon"><PackageCheck size={19} /></span><span className="stat-label">Připraveno k výdeji</span><strong>{orders.filter((order) => order.status === 'Připraveno').length}</strong><span className="stat-foot">čeká na osobní předání</span></div>
                <div className="stat-card stat-fresh"><span className="stat-icon"><Leaf size={19} /></span><span className="stat-label">Zboží ve slevě</span><strong>{products.filter((product) => getDiscount(product) > 0 && product.stock > 0).length}</strong><span className="stat-foot">kvůli blížící se spotřebě</span></div>
                <div className="stat-card stat-alert"><span className="stat-icon"><AlertTriangle size={19} /></span><span className="stat-label">Vyžaduje pozornost</span><strong>{products.filter((product) => daysUntil(product.expiry) <= 2 && product.stock > 0).length}</strong><span className="stat-foot">zásoby do 2 dnů</span></div>
              </div>
              <div className="overview-grid"><section className="staff-section order-section"><div className="section-title-row"><div><span className="section-kicker">PŘIPRAVIT JAKO DALŠÍ</span><h2>Objednávky</h2></div><button className="text-button" onClick={() => setStaffTab('orders')}>Všechny objednávky <ArrowRight size={15} /></button></div>              <div className="order-list">{orders.slice(0, 3).map((order) => <OrderRow key={order.id} order={order} products={products} onAdvance={changeOrderStatus} onUpdateActualWeight={updateOrderActualWeight} />)}</div></section>
                <section className="staff-section fresh-section"><div className="section-title-row"><div><span className="section-kicker">NEPLÝTVÁME</span><h2>Čerstvost pod kontrolou</h2></div><span className="fresh-mark"><Leaf size={15} /></span></div><div className="fresh-summary"><div className="fresh-circle"><span>{products.filter((product) => daysUntil(product.expiry) <= 2 && product.stock > 0).length}</span><small>položky</small></div><p>Slevy se nastavují automaticky podle toho, kolik času zbývá do konce spotřeby.</p></div><div className="discount-preview"><div><span className="preview-dot preview-yellow" /><span>Do spotřeby zbývají {discounts.beforeDays} dny</span><strong>−{discounts.beforePercent} %</strong></div><div><span className="preview-dot preview-red" /><span>Poslední den spotřeby</span><strong>−{discounts.todayPercent} %</strong></div></div><button className="fresh-edit" onClick={() => setStaffTab('rules')}>Upravit pravidla slev <ArrowRight size={15} /></button></section></div>
              <section className="staff-section stock-preview"><div className="section-title-row"><div><span className="section-kicker">SLEDOVÁNÍ ZÁSOB</span><h2>Brzy končí spotřeba</h2></div><button className="text-button" onClick={() => setStaffTab('stock')}>Otevřít sklad <ArrowRight size={15} /></button></div><StockTable products={products.filter((product) => product.stock > 0).sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry)).slice(0, 4)} onUpdate={updateProduct} getDiscount={getDiscount} /></section>
            </>}
            {staffTab === 'orders' && <><div className="staff-title-row"><div><span className="eyebrow">PŘÍPRAVA A PŘEDÁNÍ</span><h1>Objednávky</h1><p>Objednávky připravíme a zaplatí se jednou při převzetí.</p></div><span className="orders-live"><span className="live-dot" /> Aktuální přehled</span></div><div className="orders-filter-bar"><div className="filter-tabs"><span className="filter-tab-current">Všechny <b>{orders.length}</b></span><span>Nové <b>{orders.filter((order) => order.status === 'Nová').length}</b></span><span>Připravené <b>{orders.filter((order) => order.status === 'Připraveno').length}</b></span></div><button className="outline-button small-outline" onClick={() => setNotice('Objednávky jsou aktuální')}><Bell size={15} /> Upozornění zapnuta</button></div><section className="staff-section full-orders"><div className="order-list">{orders.map((order) => <OrderRow key={order.id} order={order} products={products} onAdvance={changeOrderStatus} onUpdateActualWeight={updateOrderActualWeight} expanded />)}</div></section></>}
            {staffTab === 'stock' && <><div className="staff-title-row"><div><span className="eyebrow">ŠARŽE A DATA SPOTŘEBY</span><h1>Zásoby a čerstvost</h1><p>Uprav data spotřeby a dostupné množství. Prošlé zboží se zákazníkům nenabízí.</p></div><button className="outline-button" onClick={() => setNotice('Nové naskladnění je v tomto prototypu ukázkové')}><Plus size={16} /> Přidat naskladnění</button></div><div className="stock-callout"><div><span className="callout-icon"><Leaf size={17} /></span><span><strong>Automatické slevy běží</strong><small>Cena se mění podle nastavených pravidel a data spotřeby.</small></span></div><button onClick={() => setStaffTab('rules')}>Nastavit pravidla <ArrowRight size={14} /></button></div><section className="staff-section inventory-section"><div className="section-title-row"><div><span className="section-kicker">AKTUÁLNÍ POLOŽKY</span><h2>{products.length} produktů ve skladu</h2></div><div className="inventory-legend"><span><i className="legend-green" /> V pořádku</span><span><i className="legend-yellow" /> Brzy expiruje</span></div></div><StockTable products={products} onUpdate={updateProduct} getDiscount={getDiscount} /></section></>}
            {staffTab === 'rules' && <><div className="staff-title-row"><div><span className="eyebrow">MÉNĚ ODPADU, LEPŠÍ CENA</span><h1>Pravidla slev</h1><p>Nastav, kdy se sleva zapne. Změny platí pro zboží s blížící se spotřebou.</p></div><span className="rules-live"><span className="live-dot" /> Pravidla aktivní</span></div><div className="rules-layout"><section className="staff-section rules-card"><div className="rules-card-heading"><span className="rules-icon yellow-rule"><Clock3 size={19} /></span><div><span className="section-kicker">KROK 1</span><h2>Před koncem spotřeby</h2><p>Zlevnit produkty, kterým zbývá jen pár dní.</p></div></div><div className="setting-fields"><label><span>Sleva začne</span><div className="number-input"><input type="number" min="1" max="30" value={discounts.beforeDays} onChange={(event) => setDiscounts((current) => ({ ...current, beforeDays: Number(event.target.value) }))} /><span>dny před spotřebou</span></div></label><label><span>Výše slevy</span><div className="number-input"><input type="number" min="0" max="90" value={discounts.beforePercent} onChange={(event) => setDiscounts((current) => ({ ...current, beforePercent: Number(event.target.value) }))} /><span>%</span></div></label></div><div className="rule-example"><span className="example-icon"><Tag size={16} /></span><span>Jogurt s cenou 34 Kč bude stát</span><strong>{formatPrice(34 * (1 - discounts.beforePercent / 100))}</strong></div></section>
                  <section className="staff-section rules-card"><div className="rules-card-heading"><span className="rules-icon red-rule"><Flame size={19} /></span><div><span className="section-kicker">KROK 2</span><h2>Poslední den spotřeby</h2><p>Poslední šance pro čerstvé zboží. Po půlnoci se skryje.</p></div></div><div className="setting-fields single-field"><label><span>Výše slevy v poslední den</span><div className="number-input"><input type="number" min="0" max="90" value={discounts.todayPercent} onChange={(event) => setDiscounts((current) => ({ ...current, todayPercent: Number(event.target.value) }))} /><span>%</span></div></label></div><div className="rule-example"><span className="example-icon example-red"><AlertTriangle size={16} /></span><span>Jogurt s cenou 34 Kč bude stát</span><strong>{formatPrice(34 * (1 - discounts.todayPercent / 100))}</strong></div></section></div><div className="rules-bottom-note"><CheckCircle2 size={17} /><span><strong>Bezpečnostní kontrola</strong> Produkty po datu spotřeby se automaticky skryjí a nejdou vložit do košíku.</span></div><div className="rules-actions"><button className="text-button" onClick={() => setDiscounts({ beforeDays: 2, beforePercent: 20, todayPercent: 70 })}>Vrátit výchozí hodnoty</button><span><Check size={15} /> Změny se ukládají automaticky</span></div></>}
          </main>
        </div>
      )}

      {mode === 'shop' && categorySheetOpen && <>
        <button className="category-sheet-backdrop" onClick={() => setCategorySheetOpen(false)} aria-label="Zavřít kategorie" />
        <section className="category-sheet" role="dialog" aria-modal="true" aria-label="Všechny kategorie">
          <div className="category-sheet-head"><h2>Kategorie</h2><button className="subtle-icon" aria-label="Zavřít kategorie" onClick={() => setCategorySheetOpen(false)}><X size={19} /></button></div>
          <div className="category-sheet-grid">
            {categoryOptions.map(({ name, icon: Icon, tone }) => {
              const count = name === 'Vše' ? orderableCount : products.filter((product) => product.category === name && product.expiry >= firstPickupDate).length
              return <button key={name} className={category === name ? 'is-selected' : ''} aria-pressed={category === name} onClick={() => {
                setCategory(name)
                setCategorySheetOpen(false)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}>
                <span className={`category-icon ${tone}`}><Icon size={22} /></span><strong>{name === 'Vše' ? 'Všechny produkty' : name}</strong><small>{count} {count === 1 ? 'produkt' : count >= 2 && count <= 4 ? 'produkty' : 'produktů'}</small>
              </button>
            })}
          </div>
        </section>
      </>}

      {mode === 'shop' && <nav className="mobile-nav" aria-label="Hlavní navigace">
        <button className={!categorySheetOpen ? 'mobile-nav-active' : ''} onClick={() => { setCategorySheetOpen(false); setCategory('Vše'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><Grid2X2 size={19} /><span>Nabídka</span></button>
        <button className={categorySheetOpen ? 'mobile-nav-active' : ''} aria-expanded={categorySheetOpen} onClick={() => setCategorySheetOpen((open) => !open)}><Leaf size={19} /><span>Kategorie</span></button>
        <button className={searchVisible ? 'mobile-nav-active' : ''} aria-expanded={searchVisible} onClick={() => {
          setCategorySheetOpen(false)
          if (searchVisible) { setSearch(''); setMobileSearchOpen(false) } else { setMobileSearchOpen(true); window.setTimeout(() => searchInputRef.current?.focus(), 0) }
        }}>{searchVisible ? <X size={19} /> : <Search size={19} />}<span>{searchVisible ? 'Zavřít' : 'Hledat'}</span></button>
        <button onClick={() => { setCategorySheetOpen(false); setMobileCartOpen(true) }}><ShoppingCart size={19} /><span>Košík{cartCount > 0 ? ` · ${cartCount}` : ''}</span></button>
        <button onClick={() => { setCategorySheetOpen(false); setMobileCartOpen(false); setMode('staff') }}><Menu size={19} /><span>Obsluha</span></button>
      </nav>}
      {notice && <div className="toast"><CheckCircle2 size={17} />{notice}</div>}

      {modal === 'checkout' && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null) }}>
        <form className="dialog checkout-dialog" onSubmit={placeOrder}>
          <div className="dialog-top"><span className="dialog-icon"><CreditCard size={20} /></span><button type="button" className="dialog-close" onClick={() => setModal(null)} aria-label="Zavřít"><X size={19} /></button></div>
          <span className="section-kicker">POSLEDNÍ KROK</span><h2>Rezervovat objednávku</h2>
          <p className="dialog-intro">Objednávku teď jen rezervuješ. Zaplatíš jednou při převzetí; vážené zboží vyúčtujeme podle skutečné hmotnosti.</p>
          <label className="form-field"><span>Jméno <small>nepovinné</small></span><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Jak ti máme říkat?" /></label>
          <label className="form-field"><span>E-mail pro potvrzení</span><input required type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="ty@email.cz" /></label>
          <div className="checkout-pickup"><div className="checkout-pickup-icon"><UserRound size={18} /></div><div><span>Osobní vyzvednutí u obsluhy</span><strong>{activeSlot ? formatPickup(activeSlot.value) : 'Nejbližší dostupný termín'}</strong></div><CheckCircle2 size={17} /></div>
          <div className="payment-line"><span><CreditCard size={17} /> Platba při převzetí</span><strong>{formatPrice(subtotal)}</strong></div>
          <div className="demo-payment-note"><Sparkles size={14} /> Objednávka je rezervace, ne platba.</div>
          <button className="checkout-button dialog-submit" type="submit"><span>Potvrdit rezervaci</span><ArrowRight size={18} /></button>
          <div className="secure-note"><BadgeCheck size={14} /> Bez registrace · údaje zůstávají soukromé</div>
        </form>
      </div>}

      {modal === 'success' && lastOrder && <div className="modal-backdrop"><div className="dialog success-dialog">
        <div className="success-mark"><Check size={27} /></div><span className="section-kicker">OBJEDNÁVKA REZERVOVÁNA</span><h2>Hotovo. Teď už jen vyzvednout.</h2>
        <p className="dialog-intro">Potvrzení {lastOrder.id} je připravené. Zaplatíš jednou při převzetí. Ukázkový e-mail: {lastOrder.email}</p>
        <div className="success-pickup"><div className="success-pickup-icon"><PackageCheck size={22} /></div><div><span>Předání obsluhou</span><strong>{formatPickup(lastOrder.pickup)}</strong><small>MYNUTA · hlavní výdejní místo</small></div></div>
        <button className="share-order-button" onClick={() => void makeShareLink({ type: 'order', items: lastOrder.items, pickup: lastOrder.pickup, orderId: lastOrder.id, customer: lastOrder.customer }, 'Odkaz k vyzvednutí je zkopírovaný')}><Share2 size={17} /> Sdílet vyzvednutí s někým blízkým</button>
        <button className="checkout-button" onClick={() => { setModal(null); setMode('staff'); setStaffTab('orders') }}>Zobrazit v obsluze <ArrowRight size={17} /></button>
        <div className="demo-payment-note"><CheckCircle2 size={14} /> Ukázková rezervace · bez skutečné platby</div>
      </div></div>}

      {modal === 'share' && shared && <div className="modal-backdrop"><div className="dialog share-dialog">
        <div className="dialog-top"><span className="dialog-icon share-dialog-icon"><UsersRound size={21} /></span><button type="button" className="dialog-close" onClick={() => { setModal(null); setShared(null) }} aria-label="Zavřít"><X size={19} /></button></div>
        <span className="section-kicker">NÁKUP VE DVOU</span><h2>{shared.type === 'cart' ? 'Někdo ti poslal seznam.' : 'Vyzvednutí je připravené.'}</h2>
        <p className="dialog-intro">{shared.type === 'cart' ? 'Přidej seznam do košíku, doplň zboží a vytvoř rezervaci. Zaplatíš při převzetí.' : `Objednávka ${shared.orderId ?? ''} je rezervovaná. Zaplatí se při osobním převzetí.`}</p>
        <div className="shared-items">{Object.entries(shared.items).map(([id, quantity]) => {
          const product = products.find((item) => item.id === id)
          return product ? <div key={id}><span>{formatQuantity(quantity, product)}</span><strong>{product.name}</strong><b>{formatPrice(priceFor(product) * quantity)}</b></div> : null
        })}</div>
        {shared.type === 'cart' && <div className="shared-total"><span>Orientační součet</span><strong>{formatPrice(Object.entries(shared.items).reduce((sum, [id, quantity]) => {
          const product = products.find((item) => item.id === id)
          return sum + (product ? priceFor(product) * quantity : 0)
        }, 0))}</strong></div>}
        <button className="checkout-button" onClick={importSharedList}><span>{shared.type === 'cart' ? 'Přidat do mého košíku' : 'Rozumím, zobrazit nákup'}</span><ArrowRight size={18} /></button>
        <div className="secure-note"><UsersRound size={14} /> Sdílený seznam můžeš před objednáním upravit</div>
      </div></div>}
    </div>
  )
}

function ProductShelf({ label, kicker, title, titleId, count, actionLabel, onAction, className = '', children }: {
  label: string; kicker?: string; title: string; titleId?: string; count?: number; actionLabel: string; onAction: () => void; className?: string; children: ReactNode[]
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 })
  const [edges, setEdges] = useState({ prev: false, next: false, first: 1, last: children.length, scrollable: false })
  const total = children.length

  const update = useCallback(() => {
    const list = listRef.current
    if (!list) return
    const items = Array.from(list.children) as HTMLElement[]
    const right = list.scrollLeft + list.clientWidth
    const visible = items.reduce<number[]>((acc, item, index) => {
      const middle = item.offsetLeft + item.offsetWidth / 2
      if (middle > list.scrollLeft && middle <= right) acc.push(index + 1)
      return acc
    }, [])
    setEdges({
      prev: list.scrollLeft > 4,
      next: list.scrollLeft + list.clientWidth < list.scrollWidth - 4,
      first: visible[0] ?? 1,
      last: visible[visible.length - 1] ?? total,
      scrollable: list.scrollWidth > list.clientWidth + 4,
    })
  }, [total])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  const scrollByPage = (direction: -1 | 1) => {
    const list = listRef.current
    if (list) list.scrollBy({ left: direction * list.clientWidth * 0.85, behavior: 'smooth' })
  }

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !listRef.current) return
    drag.current = { active: true, moved: false, startX: event.clientX, startScroll: listRef.current.scrollLeft }
  }
  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current
    const list = listRef.current
    if (!state.active || !list) return
    const delta = event.clientX - state.startX
    if (!state.moved && Math.abs(delta) > 5) {
      state.moved = true
      list.setPointerCapture(event.pointerId)
      list.classList.add('is-dragging')
    }
    if (state.moved) list.scrollLeft = state.startScroll - delta
  }
  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const list = listRef.current
    if (!drag.current.active || !list) return
    drag.current.active = false
    if (drag.current.moved) {
      list.releasePointerCapture(event.pointerId)
      list.classList.remove('is-dragging')
    }
  }
  const suppressClickAfterDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    if (drag.current.moved) {
      event.preventDefault()
      event.stopPropagation()
      drag.current.moved = false
    }
  }

  return <section className={`shelf ${className}`} aria-labelledby={titleId} aria-label={titleId ? undefined : label}>
    <div className="shelf-heading">
      {kicker ? <div><span className="section-kicker">{kicker}</span><h2 id={titleId}>{title}{count !== undefined && <small>{count}</small>}</h2></div> : <h2 id={titleId}>{title}{count !== undefined && <small>{count}</small>}</h2>}
      <div className="shelf-heading-side">
        {edges.scrollable && <span className="rail-counter" aria-hidden="true">{edges.first}–{edges.last} z {total}</span>}
        <button onClick={onAction}>{actionLabel} <ArrowRight size={14} /></button>
      </div>
    </div>
    <div className="product-rail">
      {edges.prev && <button className="rail-arrow rail-arrow-prev" type="button" aria-label="Posunout doleva" onClick={() => scrollByPage(-1)}><span><ChevronLeft size={22} /></span></button>}
      <div className="product-rail-list" role="region" aria-label={`${label}, posuň do strany`} tabIndex={0} ref={listRef} onScroll={update} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onClickCapture={suppressClickAfterDrag} onDragStart={(event) => event.preventDefault()}>{children}</div>
      {edges.next && <button className="rail-arrow rail-arrow-next" type="button" aria-label="Posunout doprava" onClick={() => scrollByPage(1)}><span><ChevronRight size={22} /></span></button>}
    </div>
  </section>
}

function OrderRow({ order, products, onAdvance, onUpdateActualWeight, expanded = false }: {
  order: Order
  products: Product[]
  onAdvance: (id: string, paymentMethod?: PaymentMethod) => void
  onUpdateActualWeight: (orderId: string, productId: string, quantity: number) => void
  expanded?: boolean
}) {
  const itemCount = Object.keys(order.items).length
  const itemsSummary = Object.entries(order.items).map(([id, quantity]) => {
    const product = products.find((item) => item.id === id)
    return product?.sellByWeight
      ? `${formatQuantity(quantity, product)} ${product.name}`
      : `${quantity}× ${product?.name ?? 'Produkt'}`
  }).join(', ')
  const weightedItems = Object.entries(order.items).flatMap(([id]) => {
    const product = products.find((item) => item.id === id)
    return product?.sellByWeight ? [[id, product] as const] : []
  })
  const nextAction: Partial<Record<Order['status'], string>> = { Nová: 'Začít přípravu', Připravuji: 'Označit připraveno' }
  const total = order.finalTotal ?? calculateOrderTotal(order, products)
  const paymentLabel = order.paymentMethod === 'card' ? 'kartou' : 'hotově'
  return <article className={`order-row ${expanded ? 'order-row-expanded' : ''}`}>
    <span className={`order-symbol order-${order.status.toLocaleLowerCase('cs')}`}>{order.status === 'Připraveno' ? <PackageCheck size={18} /> : order.status === 'Nová' ? <ShoppingBag size={18} /> : <Clock3 size={18} />}</span>
    <div className="order-primary">
      <div className="order-person-line"><strong>{order.customer}</strong><span>{order.id}</span><span className={`order-status status-${order.status.toLocaleLowerCase('cs')}`}>{order.status}</span></div>
      <span className="order-items-summary">{itemsSummary}</span>
      {order.status === 'Připravuji' && weightedItems.map(([id, product]) => {
        const quantity = order.actualItems?.[id] ?? order.items[id] ?? 0
        return <label className="order-weight-editor" key={id}>
          <span>{product.name}: objednáno {formatQuantity(order.items[id], product)}</span>
          <span>Skutečnost</span>
          <input key={`${order.id}-${id}-${quantity}`} type="number" min="0.01" step="0.01" defaultValue={quantity} aria-label={`Skutečná hmotnost ${product.name} v kg`} onBlur={(event) => onUpdateActualWeight(order.id, id, Number(event.currentTarget.value))} />
          <span>kg</span>
          {order.weighedItems?.[id] && <small>Zváženo</small>}
        </label>
      })}
      {expanded && <span className="order-email">{order.email || 'Host bez e-mailu'} · {order.paid ? `Zaplaceno při převzetí ${paymentLabel}` : 'Čeká na platbu při převzetí'}</span>}
    </div>
    <div className="order-meta"><span><Clock3 size={14} />{order.createdAt}</span><span><UserRound size={14} />{formatPickup(order.pickup)}</span><small>{formatItemCount(itemCount)}</small></div>
    <div className="order-end">
      <strong>{formatPrice(total)}</strong>
      {order.status === 'Připraveno'
        ? <span className="order-payment-actions"><button onClick={() => onAdvance(order.id, 'cash')}>Hotově</button><button onClick={() => onAdvance(order.id, 'card')}>Kartou</button></span>
        : nextAction[order.status]
          ? <button onClick={() => onAdvance(order.id)}>{nextAction[order.status]} <ArrowRight size={14} /></button>
          : <span className="completed-label"><Check size={14} /> Vyřízeno</span>}
    </div>
  </article>
}

function StockTable({ products, onUpdate, getDiscount }: { products: Product[]; onUpdate: (id: string, field: 'expiry' | 'stock', value: string) => void; getDiscount: (product: Product) => number }) {
  return <div className="stock-table-wrap"><table className="stock-table"><thead><tr><th>Produkt</th><th>Datum spotřeby</th><th>Zbývá</th><th>Sklad</th><th>Cena / sleva</th></tr></thead><tbody>{products.map((product) => {
    const remaining = daysUntil(product.expiry)
    const discount = getDiscount(product)
    const step = quantityStep(product)
    return <tr key={product.id}>
      <td><span className="stock-product"><img src={`https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=100&q=70`} alt="" /><span><strong>{product.name}</strong><small>{product.maker}</small></span></span></td>
      <td><input className="date-input" type="date" value={product.expiry} onChange={(event) => onUpdate(product.id, 'expiry', event.target.value)} /></td>
      <td><span className={`expiry-status ${remaining <= 2 ? 'expiry-soon' : ''}`}>{remaining === 0 ? 'Dnes' : remaining < 0 ? 'Prošlé' : `${remaining} dní`}</span></td>
      <td><div className="stock-stepper">
        <button aria-label={`Odebrat skladovou zásobu${product.sellByWeight ? ' v kg' : ''}`} onClick={() => onUpdate(product.id, 'stock', String(roundQuantity(product.stock - step)))}><Minus size={12} /></button>
        <span>{product.sellByWeight ? formatQuantity(product.stock, product) : product.stock}</span>
        <button aria-label={`Přidat skladovou zásobu${product.sellByWeight ? ' v kg' : ''}`} onClick={() => onUpdate(product.id, 'stock', String(roundQuantity(product.stock + step)))}><Plus size={12} /></button>
      </div></td>
      <td><span className="stock-price">{formatPrice(product.price * (1 - discount / 100))}{product.sellByWeight ? ' / kg' : ''}</span>{discount > 0 && <span className="stock-discount">−{discount} %</span>}</td>
    </tr>
  })}</tbody></table></div>
}

function LockKeyholeIcon() {
  return <span className="tiny-lock"><Check size={11} /></span>
}

export default App
