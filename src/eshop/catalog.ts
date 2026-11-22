// Ukázkový katalog e-shopu. Názvy, ceny a zásoby jsou vymyšlené, jen aby šlo proklikat celý nákup.
// Každý řádek zboží: název | balení | cena v Kč | volitelně sleva (-20) a zásoba (s3)
import { hashString, slugify } from './text.ts'

export type PackBase = 'g' | 'ml' | 'ks'
export type Pack = { amount: number; base: PackBase }

export type Product = {
  id: string
  name: string
  unit: string
  pack: Pack
  price: number
  discount: number
  stock: number
  categoryId: string
  subId: string
}

export type Subcategory = { id: string; name: string; categoryId: string; productIds: string[] }
export type Category = { id: string; name: string; icon: string; tone: string; subs: Subcategory[] }

type SubSpec = { id: string; name: string; items: string }
type CategorySpec = { id: string; name: string; icon: string; tone: string; subs: SubSpec[] }

const CATEGORY_SPECS: CategorySpec[] = [
  {
    id: 'ovoce', name: 'Ovoce', icon: 'ovoce', tone: '#f6ead3', subs: [
      { id: 'jablka-a-hrusky', name: 'Jablka a hrušky', items: `
        Jablka Gala | 1 kg | 45 | -20
        Jablka Golden Delicious | 1 kg | 42
        Jablka Jonagold z Česka | 1 kg | 39
        Jablka Granny Smith | 1 kg | 52
        Jablka Šampion z Česka | 2 kg | 69
        Jablka bio | 1 kg | 69
        Jablko Red Delicious | 1 ks | 9
        Hrušky Conference | 1 kg | 59
        Hruška Williams | 1 ks | 12` },
      { id: 'banany-a-exotika', name: 'Banány a exotika', items: `
        Banány | 5 ks | 29
        Banány bio | 5 ks | 45
        Mango | 1 ks | 39 | s2
        Ananas | 1 ks | 59
        Avokádo | 1 ks | 25
        Avokádo zralé | 2 ks | 59 | -25
        Kiwi | 6 ks | 39
        Granátové jablko | 1 ks | 35
        Kokos | 1 ks | 45
        Papája | 1 ks | 69 | s0` },
      { id: 'citrusy', name: 'Citrusy', items: `
        Pomeranče | 1 kg | 39
        Pomeranče na šťávu | 2 kg | 59
        Mandarinky | 1 kg | 49 | -20
        Klementinky | 1 kg | 55
        Citrony | 3 ks | 25
        Limetky | 3 ks | 29
        Grapefruit růžový | 1 ks | 19
        Pomelo | 1 ks | 59` },
      { id: 'bobuloviny-a-hrozny', name: 'Bobuloviny a hrozny', items: `
        Borůvky | 125 g | 59
        Maliny | 125 g | 65
        Jahody | 250 g | 69 | s3
        Ostružiny | 125 g | 59
        Rybíz červený | 125 g | 49
        Hroznové víno bílé | 500 g | 59 | -30
        Hroznové víno červené | 500 g | 65
        Fíky | 4 ks | 59 | s3` },
    ],
  },
  {
    id: 'zelenina', name: 'Zelenina', icon: 'zelenina', tone: '#e4ecd8', subs: [
      { id: 'rajcata-papriky-okurky', name: 'Rajčata, papriky, okurky', items: `
        Rajčata keříková | 500 g | 49
        Rajčata cherry | 250 g | 39 | -20
        Rajčata na stonku | 1 kg | 79
        Paprika červená | 1 ks | 19
        Paprika žlutá | 1 ks | 19
        Paprika mix | 3 ks | 55
        Okurka salátová | 1 ks | 22
        Okurky nakládačky | 500 g | 39
        Cuketa | 1 ks | 25
        Lilek | 1 ks | 35` },
      { id: 'brambory-cibule-korenova', name: 'Brambory, cibule, kořenová', items: `
        Brambory konzumní | 2 kg | 49
        Brambory salátové | 1 kg | 35
        Brambory bio | 1,5 kg | 59
        Cibule žlutá | 1 kg | 25
        Cibule červená | 500 g | 25
        Česnek | 1 ks | 12
        Mrkev | 1 kg | 25
        Petržel kořen | 250 g | 29
        Celer bulva | 1 ks | 35
        Červená řepa | 500 g | 25
        Batáty | 500 g | 45
        Zázvor | 100 g | 15` },
      { id: 'salaty-a-listova', name: 'Saláty a listová', items: `
        Ledový salát | 1 ks | 29
        Salát římský | 2 ks | 39
        Polníček | 100 g | 39
        Baby špenát | 125 g | 35
        Rukola | 100 g | 35
        Salátový mix | 150 g | 45
        Čínské zelí | 1 ks | 35
        Zelí bílé | 1 ks | 29
        Pórek | 1 ks | 25
        Brokolice | 1 ks | 39 | -20
        Květák | 1 ks | 49` },
      { id: 'bylinky-a-houby', name: 'Bylinky a houby', items: `
        Pažitka | 1 svazek | 19
        Petrželka kadeřavá | 1 svazek | 19
        Bazalka v květináči | 1 ks | 45 | s0
        Koriandr | 1 svazek | 25
        Kopr | 1 svazek | 19
        Máta | 1 svazek | 25
        Jarní cibulka | 1 svazek | 19
        Ředkvičky | 1 svazek | 19
        Žampiony bílé | 250 g | 35
        Žampiony hnědé | 250 g | 39 | -25
        Hlíva ústřičná | 200 g | 49` },
    ],
  },
  {
    id: 'pecivo', name: 'Pečivo', icon: 'pecivo', tone: '#f3e4cc', subs: [
      { id: 'chleby', name: 'Chleby', items: `
        Kváskový chléb | 600 g | 68
        Chléb Šumava | 1 kg | 45
        Žitný chléb | 500 g | 49
        Špaldový chléb | 500 g | 72
        Celozrnný chléb | 500 g | 59
        Slunečnicový chléb | 500 g | 55
        Chléb krájený | 500 g | 39
        Bezlepkový chléb | 350 g | 89` },
      { id: 'rohliky-a-housky', name: 'Rohlíky a housky', items: `
        Rohlík | 1 ks | 4
        Rohlíky | 10 ks | 39
        Celozrnný rohlík | 1 ks | 6
        Grahamový rohlík | 1 ks | 6
        Sýrový rohlík | 1 ks | 12
        Houska | 1 ks | 5
        Houska sezamová | 1 ks | 8
        Kaiserka | 1 ks | 7
        Dalamánek | 1 ks | 9` },
      { id: 'bagety-a-toustovy-chleb', name: 'Bagety a toustový chléb', items: `
        Bageta | 1 ks | 25
        Bageta celozrnná | 1 ks | 29
        Ciabatta | 1 ks | 29
        Česneková bageta | 1 ks | 35
        Toustový chléb | 500 g | 35
        Toustový chléb celozrnný | 500 g | 42
        Tortilly pšeničné | 6 ks | 45
        Pita chléb | 4 ks | 39` },
      { id: 'sladke-pecivo', name: 'Sladké pečivo', items: `
        Máslový croissant | 1 ks | 22 | -30
        Loupák | 1 ks | 9
        Koláč tvarohový | 1 ks | 19
        Koláč povidlový | 1 ks | 19
        Šnek s rozinkami | 1 ks | 25
        Muffin čokoládový | 1 ks | 29
        Buchty s povidly | 4 ks | 59
        Makový závin | 1 ks | 49
        Vánočka | 400 g | 79 | s4` },
    ],
  },
  {
    id: 'mlecne', name: 'Mléčné a vejce', icon: 'mleko', tone: '#ebeee6', subs: [
      { id: 'mleko-a-smetana', name: 'Mléko a smetana', items: `
        Mléko polotučné | 1 l | 24
        Mléko plnotučné | 1 l | 27
        Mléko čerstvé farmářské | 1 l | 35
        Mléko bez laktózy | 1 l | 32
        Ovesný nápoj | 1 l | 45
        Smetana ke šlehání 31 % | 200 ml | 32
        Smetana na vaření 12 % | 200 ml | 25
        Zakysaná smetana | 200 g | 25
        Kefír | 500 ml | 29
        Podmáslí | 500 ml | 22` },
      { id: 'jogurty-a-dezerty', name: 'Jogurty a dezerty', items: `
        Bílý jogurt | 150 g | 15
        Bílý jogurt farmářský | 400 g | 45
        Bílý jogurt řecký | 500 g | 59
        Jogurt jahodový | 150 g | 18 | -20
        Jogurt vanilkový | 150 g | 18
        Skyr | 140 g | 29
        Jogurtové mléko | 500 ml | 35
        Tvarohový dezert | 140 g | 25
        Pudink čokoládový | 125 g | 19` },
      { id: 'syry', name: 'Sýry', items: `
        Eidam 30 % plátky | 100 g | 29
        Gouda plátky | 100 g | 32
        Ementál | 200 g | 69
        Mozzarella | 125 g | 29
        Parmazán | 100 g | 79
        Hermelín | 120 g | 45 | -20
        Niva | 100 g | 39
        Cottage | 180 g | 35
        Lučina | 120 g | 35
        Balkánský sýr | 250 g | 59
        Olomoucké tvarůžky | 125 g | 45` },
      { id: 'maslo-tvaroh-vejce', name: 'Máslo, tvaroh a vejce', items: `
        Máslo | 250 g | 59
        Máslo farmářské | 250 g | 75
        Pomazánkové máslo | 150 g | 32
        Ghí přepuštěné máslo | 250 g | 99
        Tvaroh měkký | 250 g | 32
        Tvaroh tučný | 250 g | 35
        Vejce M | 10 ks | 55
        Vejce L z volného chovu | 10 ks | 79
        Vejce bio | 6 ks | 69` },
    ],
  },
  {
    id: 'maso', name: 'Maso a uzeniny', icon: 'maso', tone: '#f2e0d9', subs: [
      { id: 'drubezi', name: 'Drůbeží', items: `
        Kuřecí prsa | 500 g | 129
        Kuřecí stehna | 1 kg | 119 | -25
        Kuřecí čtvrtky | 1 kg | 99
        Kuřecí křídla | 500 g | 69
        Kuřecí mleté maso | 500 g | 99
        Celé kuře | 1,4 kg | 159
        Krůtí prsa | 500 g | 159
        Kachní stehna | 2 ks | 229 | s2` },
      { id: 'hovezi-a-veprove', name: 'Hovězí a vepřové', items: `
        Hovězí kližka | 500 g | 149
        Hovězí plec | 500 g | 159
        Hovězí mleté | 500 g | 139
        Hovězí roštěná | 400 g | 249
        Vepřová krkovice | 500 g | 109 | -20
        Vepřová plec | 500 g | 99
        Vepřová kýta | 500 g | 105
        Vepřová panenka | 500 g | 159
        Mleté maso mix | 500 g | 109` },
      { id: 'sunka-a-salamy', name: 'Šunka a salámy', items: `
        Šunka výběrová | 100 g | 39 | -15
        Šunka dušená | 100 g | 29
        Krůtí šunka | 100 g | 35
        Salám Vysočina | 100 g | 35
        Salám Poličan | 100 g | 45
        Prosciutto | 70 g | 69
        Chorizo | 100 g | 49
        Paštika | 120 g | 35` },
      { id: 'parky-klobasy-slanina', name: 'Párky, klobásy, slanina', items: `
        Párky jemné | 300 g | 59
        Vídeňské párky | 250 g | 55
        Klobása farmářská | 300 g | 79
        Špekáčky | 400 g | 69
        Slanina anglická | 100 g | 35
        Uzená slanina | 200 g | 59
        Debrecínská pečeně | 100 g | 35
        Tlačenka | 200 g | 39` },
    ],
  },
  {
    id: 'trvanlive', name: 'Trvanlivé', icon: 'trvanlive', tone: '#eee6d8', subs: [
      { id: 'testoviny-ryze-lusteniny', name: 'Těstoviny, rýže, luštěniny', items: `
        Špagety | 500 g | 32 | -25
        Penne | 500 g | 32
        Fusilli | 500 g | 32
        Celozrnné špagety | 500 g | 39
        Vaječné těstoviny | 500 g | 45
        Rýže jasmínová | 1 kg | 59
        Rýže basmati | 500 g | 49
        Rýže na rizoto | 1 kg | 69
        Kuskus | 500 g | 39
        Čočka červená | 500 g | 39
        Cizrna | 500 g | 39
        Fazole bílé | 500 g | 35` },
      { id: 'konzervy-a-omacky', name: 'Konzervy a omáčky', items: `
        Passata | 700 g | 39
        Rajčata krájená | 400 g | 25
        Rajčatový protlak | 140 g | 19
        Tuňák ve vlastní šťávě | 160 g | 49
        Kukuřice | 340 g | 29
        Fazole v rajčatové omáčce | 400 g | 29
        Kokosové mléko | 400 ml | 45
        Pesto bazalkové | 190 g | 69
        Kečup | 500 g | 45
        Hořčice plnotučná | 200 g | 19
        Majonéza | 250 ml | 39` },
      { id: 'mouka-a-peceni', name: 'Mouka a pečení', items: `
        Mouka hladká | 1 kg | 22
        Mouka polohrubá | 1 kg | 22
        Mouka hrubá | 1 kg | 24
        Cukr krystal | 1 kg | 25
        Cukr moučka | 500 g | 25
        Droždí | 42 g | 9
        Prášek do pečiva | 12 g | 6
        Vanilkový cukr | 20 g | 6
        Kakao | 100 g | 45
        Strouhanka | 500 g | 25` },
      { id: 'koreni-oleje-ocet', name: 'Koření, oleje, ocet', items: `
        Sůl jemná | 1 kg | 12
        Pepř černý mletý | 30 g | 29
        Paprika sladká mletá | 100 g | 35
        Kmín celý | 50 g | 19
        Majoránka | 10 g | 25
        Bazalka sušená | 10 g | 29
        Oregano | 10 g | 25
        Bobkový list | 5 g | 15
        Olej slunečnicový | 1 l | 49
        Olivový olej extra panenský | 500 ml | 169 | -20
        Sádlo vepřové | 250 g | 35
        Ocet kvasný | 1 l | 15` },
      { id: 'snidane', name: 'Snídaně', items: `
        Ovesné vločky jemné | 500 g | 29
        Müsli s ovocem | 500 g | 69
        Granola | 400 g | 89
        Corn flakes | 375 g | 59
        Med květový | 500 g | 149
        Jahodový džem | 340 g | 59
        Meruňkový džem | 340 g | 59
        Arašídové máslo | 350 g | 79
        Lískooříšková pomazánka | 400 g | 89` },
      { id: 'sladke-a-slane', name: 'Sladké a slané', items: `
        Hořká čokoláda 70 % | 100 g | 49 | -25
        Mléčná čokoláda | 100 g | 39
        Sušenky máslové | 150 g | 35
        Piškoty | 240 g | 39
        Chipsy solené | 150 g | 45
        Tyčinky slané | 200 g | 25
        Popcorn do mikrovlnky | 300 g | 49
        Mandle | 200 g | 79
        Kešu | 150 g | 79
        Sušené švestky | 200 g | 59` },
    ],
  },
  {
    id: 'napoje', name: 'Nápoje', icon: 'napoje', tone: '#e0ebe7', subs: [
      { id: 'vody-a-mineralky', name: 'Vody a minerálky', items: `
        Voda neperlivá | 1,5 l | 15
        Voda jemně perlivá | 1,5 l | 15
        Minerálka perlivá | 1,5 l | 19
        Minerálka jemně perlivá | 1,5 l | 19
        Voda s citronem | 1,5 l | 22
        Voda neperlivá balení | 6× 1,5 l | 79
        Sodovka | 1 l | 15
        Kojenecká voda | 1,5 l | 25` },
      { id: 'dzusy-a-limonady', name: 'Džusy a limonády', items: `
        Pomerančový džus 100 % | 1 l | 49
        Jablečný mošt | 1 l | 45
        Multivitamín | 1 l | 39
        Limonáda citron | 500 ml | 29
        Kola | 1,5 l | 39
        Tonik | 1 l | 29
        Ledový čaj broskev | 1,5 l | 35
        Kombucha | 330 ml | 49
        Bezový sirup | 500 ml | 89
        Malinový sirup | 700 ml | 79` },
      { id: 'kava-a-caj', name: 'Káva a čaj', items: `
        Káva zrnková | 500 g | 249 | -20
        Káva mletá | 250 g | 119
        Instantní káva | 100 g | 129
        Kapsle espresso | 10 ks | 99
        Čaj černý | 20 ks | 39
        Čaj zelený | 20 ks | 45
        Čaj ovocný | 20 ks | 39
        Čaj heřmánkový | 20 ks | 35
        Kakao instantní | 400 g | 79` },
      { id: 'pivo-a-vino', name: 'Pivo a víno', items: `
        Pivo světlé výčepní | 0,5 l | 22
        Pivo ležák | 0,5 l | 29
        Pivo ležák balení | 6× 0,5 l | 159 | -15
        Pivo nealkoholické | 0,5 l | 25
        Cider jablečný | 0,5 l | 39
        Víno bílé suché | 0,75 l | 149
        Víno červené suché | 0,75 l | 159
        Víno růžové | 0,75 l | 139
        Prosecco | 0,75 l | 219` },
    ],
  },
  {
    id: 'mrazene', name: 'Mražené', icon: 'mrazene', tone: '#e3ecf1', subs: [
      { id: 'mrazena-zelenina-a-ovoce', name: 'Zelenina a ovoce', items: `
        Hrášek | 450 g | 39
        Zeleninová směs | 450 g | 45
        Listový špenát | 450 g | 45
        Brokolice růžičky | 450 g | 49
        Fazolové lusky | 450 g | 45
        Lesní ovoce | 300 g | 69
        Mražené borůvky | 300 g | 79
        Mražené jahody | 400 g | 69` },
      { id: 'hotova-jidla-a-pizza', name: 'Hotová jídla a pizza', items: `
        Pizza Margherita | 350 g | 69
        Pizza šunková | 380 g | 79 | -30
        Lasagne bolognese | 400 g | 89
        Pelmeně | 500 g | 79
        Kuřecí nugety | 400 g | 89
        Hranolky | 750 g | 49
        Bramborové krokety | 500 g | 45
        Rybí prsty | 300 g | 69` },
      { id: 'ryby', name: 'Ryby', items: `
        Filé z tresky | 400 g | 129
        Losos porce | 250 g | 179 | s3
        Pangasius filé | 500 g | 99
        Krevety loupané | 200 g | 149
        Treska v těstíčku | 300 g | 89` },
      { id: 'zmrzliny', name: 'Zmrzliny', items: `
        Zmrzlina vanilková | 1 l | 99 | -20
        Zmrzlina čokoládová | 1 l | 99
        Zmrzlina pistáciová | 500 ml | 119
        Sorbet malinový | 500 ml | 89
        Nanuk smetanový | 1 ks | 25` },
    ],
  },
]

function parsePack(unit: string): Pack {
  const match = unit.replace(',', '.').match(/^(\d+(?:\.\d+)?)\s*(kg|g|l|ml|ks|svazek)$/)
  if (!match) return { amount: 1, base: 'ks' }
  const amount = Number(match[1])
  switch (match[2]) {
    case 'kg': return { amount: amount * 1000, base: 'g' }
    case 'g': return { amount, base: 'g' }
    case 'l': return { amount: amount * 1000, base: 'ml' }
    case 'ml': return { amount, base: 'ml' }
    default: return { amount, base: 'ks' }
  }
}

// Vygenerované položky navíc, aby katalog měl reálnou velikost. Varianty ke stávajícímu zboží,
// vždy se stejným semínkem, takže vychází pokaždé stejně. Nastav 0 pro jen ručně psaný katalog.
const EXTRA_PRODUCTS = 500

// [označení, násobek balení, násobek ceny]. Text stojí za názvem, takže nemusí souhlasit rodem.
type Variant = readonly [string, number, number]
const COMMON_VARIANTS: Variant[] = [['bio', 1, 1.35], ['z Česka', 1, 1.05], ['rodinné balení', 2, 1.8], ['malé balení', 0.5, 0.6], ['výběr Mynuta', 1, 1.15]]
const CATEGORY_VARIANTS: Record<string, Variant[]> = {
  ovoce: [['z Moravy', 1, 1], ['od sousedů', 1, 1.1], ['sezónní nabídka', 1, 0.95]],
  zelenina: [['z místní farmy', 1, 1.1], ['z jižních Čech', 1, 1], ['od sousedů', 1, 1.1]],
  pecivo: [['z pekárny Na Růžku', 1, 1.05], ['z pekárny U Tří zrn', 1, 1.15], ['bez lepku', 1, 1.6], ['ze Slunečné', 1, 1]],
  mlecne: [['bez laktózy', 1, 1.25], ['z farmy Struhy', 1, 1.2], ['z Domažlic', 1, 1.05]],
  maso: [['z Pošumaví', 1, 1.15], ['na gril', 1, 1.05], ['od řezníka U Mostu', 1, 1.2]],
  trvanlive: [['z Itálie', 1, 1.3], ['bez cukru', 1, 1.1], ['bez lepku', 1, 1.5], ['ze spíže od sousedů', 1, 1.15]],
  napoje: [['bez cukru', 1, 1], ['z Moravy', 1, 1.05], ['ve skle', 1, 1.2]],
  mrazene: [['z Klatov', 1, 1], ['rychlá příprava', 1, 1.05], ['z Itálie', 1, 1.25]],
}

/** „500 g“ × 2 = „1 kg“. Balení, které nejde přepočítat („1 svazek“, „6× 0,5 l“), vrátí null. */
function scaleUnit(unit: string, factor: number): string | null {
  if (factor === 1) return unit
  const match = unit.replace(',', '.').match(/^(\d+(?:\.\d+)?)\s*(kg|g|l|ml|ks)$/)
  if (!match) return null
  let amount = Number(match[1]) * factor
  let suffix = match[2]
  if (suffix === 'kg' && amount < 1) { amount *= 1000; suffix = 'g' }
  if (suffix === 'l' && amount < 1 && amount * 1000 >= 100) { amount *= 1000; suffix = 'ml' }
  if (suffix === 'g' && amount >= 1000) { amount /= 1000; suffix = 'kg' }
  if (suffix === 'ml' && amount >= 1000) { amount /= 1000; suffix = 'l' }
  if (suffix === 'ks' && amount < 1) return null
  const rounded = Math.round(amount * 100) / 100
  return `${String(rounded).replace('.', ',')} ${suffix}`
}

function addGeneratedProducts(products: Product[], categories: Category[]) {
  const taken = new Set(products.map((product) => product.id))
  const byId = new Map(products.map((product) => [product.id, product]))
  const subs = categories.flatMap((category) => category.subs.map((sub) => ({ sub, bases: sub.productIds.map((id) => byId.get(id)).filter((product): product is Product => Boolean(product)) })))
  let added = 0
  for (let round = 0; added < EXTRA_PRODUCTS && round < 60; round += 1) {
    for (const { sub, bases } of subs) {
      if (added >= EXTRA_PRODUCTS) break
      const variants = [...COMMON_VARIANTS, ...(CATEGORY_VARIANTS[sub.categoryId] ?? [])]
      const offset = hashString(sub.id)
      const base = bases[(round + offset) % bases.length]
      const [label, packFactor, priceFactor] = variants[(Math.floor(round / bases.length) + offset + round) % variants.length]
      const unit = scaleUnit(base.unit, packFactor)
      const name = `${base.name} ${label}`
      const id = slugify(name)
      if (!unit || taken.has(id) || slugify(base.name).includes(slugify(label))) continue
      taken.add(id)
      const seed = hashString(id)
      products.push({
        id,
        name,
        unit,
        pack: parsePack(unit),
        price: Math.max(5, Math.round(base.price * priceFactor * (0.92 + (seed % 17) / 100))),
        discount: seed % 29 === 0 ? 20 : 0,
        stock: seed % 23 === 0 ? 0 : 3 + (seed % 38),
        categoryId: base.categoryId,
        subId: sub.id,
      })
      sub.productIds.push(id)
      added += 1
    }
  }
}

function buildCatalog() {
  const products: Product[] = []
  const categories: Category[] = CATEGORY_SPECS.map((spec) => ({
    id: spec.id,
    name: spec.name,
    icon: spec.icon,
    tone: spec.tone,
    subs: spec.subs.map((sub) => {
      const productIds = sub.items.trim().split('\n').map((line) => {
        const [name, unit, price, flags = ''] = line.split('|').map((part) => part.trim())
        const id = slugify(name)
        const discount = Number(flags.match(/-(\d+)/)?.[1] ?? 0)
        const stockFlag = flags.match(/s(\d+)/)?.[1]
        products.push({
          id,
          name,
          unit,
          pack: parsePack(unit),
          price: Number(price),
          discount,
          stock: stockFlag !== undefined ? Number(stockFlag) : 8 + (hashString(id) % 33),
          categoryId: spec.id,
          subId: sub.id,
        })
        return id
      })
      return { id: sub.id, name: sub.name, categoryId: spec.id, productIds }
    }),
  }))
  addGeneratedProducts(products, categories)
  return { products, categories }
}

const catalog = buildCatalog()

export const products: Product[] = catalog.products
export const categories: Category[] = catalog.categories
export const productById = new Map(products.map((product) => [product.id, product]))
export const categoryById = new Map(categories.map((category) => [category.id, category]))
export const subById = new Map(categories.flatMap((category) => category.subs.map((sub) => [sub.id, sub] as const)))
const productByName = new Map(products.map((product) => [product.name, product]))

if (import.meta.env.DEV && productById.size !== products.length) {
  console.error('E-shop: dva produkty mají stejné id')
}

/** Najde produkt podle přesného názvu z katalogu. Překlep v ukázkových datech ohlásí v konzoli. */
export function idOf(name: string): string | null {
  const product = productByName.get(name)
  if (!product && import.meta.env.DEV) console.error(`E-shop: v katalogu chybí „${name}“`)
  return product?.id ?? null
}

export function priceOf(product: Product): number {
  return Math.round(product.price * (1 - product.discount / 100))
}

export const discounted: Product[] = products.filter((product) => product.discount > 0 && product.stock > 0)

/** Zboží skladem napřed, vyprodané na konec. Jinak zachová pořadí. */
export function inStockFirst(ids: string[]): string[] {
  return [...ids].sort((first, second) => Number((productById.get(first)?.stock ?? 0) <= 0) - Number((productById.get(second)?.stock ?? 0) <= 0))
}

// Recepty. Množství jsou pro základní počet porcí a v jednotkách balení (g, ml nebo kusy).
// staple = běžně doma (sůl, olej, koření), proto je v receptu předem odškrtnuté.
export type RecipeLine = { key: string; product: string; need: number; label: string; staple: boolean; alternatives: string[] }
export type Recipe = { id: string; name: string; minutes: number; servings: number; lines: RecipeLine[]; steps: string[] }

type RecipeLineSpec = { name: string; need: number; label: string; staple?: boolean; alternatives?: string[] }
type RecipeSpec = { id: string; name: string; minutes: number; servings: number; lines: RecipeLineSpec[]; steps: string[] }

const RECIPE_SPECS: RecipeSpec[] = [
  {
    id: 'hovezi-gulas', name: 'Hovězí guláš', minutes: 120, servings: 4,
    lines: [
      { name: 'Hovězí kližka', need: 800, label: '800 g', alternatives: ['Hovězí plec'] },
      { name: 'Cibule žlutá', need: 600, label: '3 velké cibule' },
      { name: 'Paprika sladká mletá', need: 15, label: '2 lžíce' },
      { name: 'Rajčatový protlak', need: 70, label: '2 lžíce' },
      { name: 'Česnek', need: 0.3, label: '3 stroužky' },
      { name: 'Chléb Šumava', need: 500, label: 'k podávání', alternatives: ['Kváskový chléb'] },
      { name: 'Kmín celý', need: 3, label: '1 lžička', staple: true },
      { name: 'Majoránka', need: 2, label: '1 lžíce', staple: true },
      { name: 'Sádlo vepřové', need: 40, label: '2 lžíce', staple: true, alternatives: ['Olej slunečnicový'] },
      { name: 'Sůl jemná', need: 10, label: 'podle chuti', staple: true },
    ],
    steps: [
      'Cibuli nakrájej nadrobno a na sádle ji pomalu osmahni dozlatova, asi 15 minut.',
      'Přidej maso nakrájené na kostky a ze všech stran ho opeč.',
      'Stáhni z plotny, vmíchej papriku, protlak a kmín a podlij vodou.',
      'Duš pod pokličkou asi hodinu a půl, dokud maso nezměkne. Průběžně podlévej.',
      'Nakonec přidej prolisovaný česnek a majoránku, osol a ještě 5 minut provař.',
    ],
  },
  {
    id: 'spagety-s-rajcatovou-omackou', name: 'Špagety s rajčatovou omáčkou', minutes: 25, servings: 4,
    lines: [
      { name: 'Špagety', need: 400, label: '400 g', alternatives: ['Celozrnné špagety'] },
      { name: 'Passata', need: 700, label: '1 lahev' },
      { name: 'Česnek', need: 0.2, label: '2 stroužky' },
      { name: 'Parmazán', need: 60, label: '60 g' },
      { name: 'Bazalka v květináči', need: 1, label: 'hrst lístků', alternatives: ['Bazalka sušená'] },
      { name: 'Olivový olej extra panenský', need: 30, label: '3 lžíce', staple: true, alternatives: ['Olej slunečnicový'] },
      { name: 'Sůl jemná', need: 15, label: 'do vody', staple: true },
    ],
    steps: [
      'Špagety uvař v osolené vodě podle návodu na obalu.',
      'Na oleji krátce osmahni nasekaný česnek, přilij passatu a 10 minut provař.',
      'Omáčku osol, smíchej se scezenými špagetami a přidej bazalku.',
      'Podávej se strouhaným parmazánem.',
    ],
  },
  {
    id: 'bramboraky', name: 'Bramboráky', minutes: 45, servings: 4,
    lines: [
      { name: 'Brambory konzumní', need: 1000, label: '1 kg', alternatives: ['Brambory bio'] },
      { name: 'Vejce M', need: 2, label: '2 vejce', alternatives: ['Vejce L z volného chovu'] },
      { name: 'Česnek', need: 0.4, label: '4 stroužky' },
      { name: 'Mouka hladká', need: 150, label: '150 g', staple: true },
      { name: 'Majoránka', need: 3, label: '2 lžíce', staple: true },
      { name: 'Olej slunečnicový', need: 150, label: 'na smažení', staple: true, alternatives: ['Sádlo vepřové'] },
      { name: 'Pepř černý mletý', need: 1, label: 'špetka', staple: true },
      { name: 'Sůl jemná', need: 8, label: 'podle chuti', staple: true },
    ],
    steps: [
      'Brambory oloupej, najemno nastrouhej a vymačkej z nich vodu.',
      'Přidej vejce, prolisovaný česnek, majoránku, sůl, pepř a tolik mouky, aby vzniklo hustší těsto.',
      'Na rozpáleném oleji smaž tenké placky z obou stran dozlatova.',
      'Nech je okapat na papírové utěrce a podávej hned.',
    ],
  },
  {
    id: 'michana-vejce-s-pazitkou', name: 'Míchaná vejce s pažitkou', minutes: 10, servings: 2,
    lines: [
      { name: 'Vejce M', need: 4, label: '4 vejce', alternatives: ['Vejce L z volného chovu', 'Vejce bio'] },
      { name: 'Máslo', need: 20, label: 'kousek', alternatives: ['Máslo farmářské'] },
      { name: 'Pažitka', need: 1, label: '1 svazek' },
      { name: 'Kváskový chléb', need: 200, label: '2 krajíce', alternatives: ['Chléb Šumava'] },
      { name: 'Rajčata cherry', need: 125, label: 'hrst' },
      { name: 'Sůl jemná', need: 2, label: 'špetka', staple: true },
      { name: 'Pepř černý mletý', need: 1, label: 'špetka', staple: true },
    ],
    steps: [
      'Vejce rozšlehej se špetkou soli.',
      'Na másle je na mírném ohni pomalu míchej, dokud se nesrazí do krémova.',
      'Posyp nasekanou pažitkou a podávej s opečeným chlebem a rajčaty.',
    ],
  },
]

export const recipes: Recipe[] = RECIPE_SPECS.map((spec) => ({
  id: spec.id,
  name: spec.name,
  minutes: spec.minutes,
  servings: spec.servings,
  steps: spec.steps,
  lines: spec.lines.flatMap((line) => {
    const product = idOf(line.name)
    if (!product) return []
    return [{
      key: product,
      product,
      need: line.need,
      label: line.label,
      staple: line.staple ?? false,
      alternatives: (line.alternatives ?? []).flatMap((name) => idOf(name) ?? []),
    }]
  }),
}))

export const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]))

/** Recepty, ve kterých se produkt používá (pro detail produktu). */
export function recipesUsing(productId: string): Recipe[] {
  return recipes.filter((recipe) => recipe.lines.some((line) => line.product === productId || line.alternatives.includes(productId)))
}

export function minutesLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}
