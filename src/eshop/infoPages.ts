// Texty informačních stránek. NÁVRH se zákonnými náležitostmi e-shopu s potravinami, před spuštěním zkontrolovat.
import { BUSINESS, orMissing } from './business.ts'

export type Section = { heading: string; paragraphs: string[] }
export type InfoPage = { id: string; title: string; summary: string; sections: Section[] }

const seller = () => `${BUSINESS.operator}, IČO ${orMissing(BUSINESS.ico)}, sídlo ${orMissing(BUSINESS.seat)}, e-mail ${BUSINESS.email}, telefon ${orMissing(BUSINESS.phone)}`

export const INFO_PAGES: InfoPage[] = [
  {
    id: 'obchodni-podminky',
    title: 'Obchodní podmínky',
    summary: 'Objednáš online, nákup ti připravím a vyzvedneš ho ve výdejně v čase, který si vybereš. Zaplatíš předem online, nebo na místě hotově či kartou.',
    sections: [
      { heading: 'Prodávající', paragraphs: [`Prodávajícím je ${seller()}. Výdejna: ${orMissing(BUSINESS.pickupAddress)}, ${BUSINESS.area}.`] },
      { heading: 'Objednávka a uzavření smlouvy', paragraphs: [
        'Objednávku odešleš tlačítkem Objednat. Hned potom ti přijde e-mail se shrnutím. Kupní smlouva je uzavřená ve chvíli, kdy ti objednávku potvrdím.',
        'Kdyby něco z objednávky došlo, dám ti vědět e-mailem hned, ne až u pultu. Chybějící zboží neúčtuji, případně nabídnu náhradu.',
      ] },
      { heading: 'Ceny a platba', paragraphs: [
        'Ceny na webu jsou konečné. U baleného zboží uvádím i cenu za kilogram, litr nebo kus. Zboží prodávám po kusech nebo v balení, nic se nedovažuje a nedoplácí.',
        'Zaplatit můžeš předem online kartou, nebo při vyzvednutí hotově či kartou.',
      ] },
      { heading: 'Vyzvednutí', paragraphs: [
        `Nákup vyzvedneš osobně ve výdejně v čase, který si při objednávce vybereš. Otevírací doba: ${BUSINESS.hours.map(([days, time]) => `${days} ${time}`).join(', ')}.`,
        'U pultu si nákup zkontroluješ. Co nesedí, hned opravím.',
        'Nevyzvednutá objednávka: [rozhodnout, jak dlouho objednávku podržím a co se stane s rychle se kazícím zbožím a s platbou předem].',
        'Alkoholické nápoje vydám jen osobám starším 18 let, u pultu se můžu zeptat na doklad.',
      ] },
      { heading: 'Odstoupení od smlouvy', paragraphs: [
        'Smlouvu uzavřenou přes internet můžeš zrušit do 14 dnů od převzetí bez udání důvodu. Stačí napsat na e-mail. Peníze vrátím do 14 dnů stejným způsobem, jakým proběhla platba.',
        'Toto právo podle § 1837 občanského zákoníku neplatí pro zboží, které se rychle kazí nebo má krátkou dobu použitelnosti (pečivo, ovoce, zelenina, maso, chlazené výrobky), a pro zboží v uzavřeném obalu, které bylo z hygienických důvodů otevřeno.',
      ] },
      { heading: 'Spory a dozor', paragraphs: [
        'Spor můžeš řešit i mimosoudně přes Českou obchodní inspekci (adr.coi.cz). Dozor nad prodejem vykonává Česká obchodní inspekce, nad potravinami Státní zemědělská a potravinářská inspekce.',
        'Tyto podmínky platí od [datum spuštění].',
      ] },
    ],
  },
  {
    id: 'reklamace',
    title: 'Reklamace a vrácení',
    summary: 'Nejjednodušší je zkontrolovat nákup u pultu, tam ti všechno hned opravím. Na pozdější vadu se ozvi co nejdřív e-mailem nebo telefonem.',
    sections: [
      { heading: 'Kontrola při převzetí', paragraphs: ['U pultu si nákup projdeš. Poškozené, chybějící nebo jiné zboží vyměním nebo neúčtuji na místě.'] },
      { heading: 'Vada zjištěná později', paragraphs: [
        `Napiš na ${BUSINESS.email} nebo zavolej na ${orMissing(BUSINESS.phone)}. Pošli číslo objednávky, popis a pokud můžeš, fotku.`,
        'U potravin je potřeba vadu uplatnit bez zbytečného odkladu, nejpozději do data spotřeby nebo minimální trvanlivosti.',
        'Reklamaci vyřídím co nejdřív, nejpozději do 30 dnů. Podle povahy vady vrátím peníze, vyměním zboží nebo poskytnu slevu.',
      ] },
      { heading: 'Odstoupení do 14 dnů', paragraphs: ['Trvanlivé zboží v neporušeném obalu můžeš vrátit do 14 dnů od převzetí bez udání důvodu. Neplatí to pro zboží, které se rychle kazí. Podrobnosti jsou v obchodních podmínkách.'] },
    ],
  },
  {
    id: 'osobni-udaje',
    title: 'Ochrana osobních údajů',
    summary: 'Sbírám jen to, co potřebuji k vyřízení nákupu. Údaje nikomu neprodávám.',
    sections: [
      { heading: 'Kdo údaje spravuje', paragraphs: [`Správcem je ${seller()}.`] },
      { heading: 'Jaké údaje a proč', paragraphs: [
        'Jméno na štítek a e-mail: abych mohl vyřídit objednávku a poslat potvrzení (plnění smlouvy).',
        'Historii nákupů: kvůli účetnictví a abych ti mohl nabídnout „Tvoje obvyklé“ a zopakování nákupu (oprávněný zájem). Proti tomu můžeš kdykoli vznést námitku.',
        'E-mail pro novinky: jen s tvým souhlasem, odhlásit se můžeš jedním odkazem v každém e-mailu.',
      ] },
      { heading: 'Jak dlouho', paragraphs: ['Údaje k objednávkám a dokladům uchovávám po dobu, kterou ukládají zákony (daňové a účetní doklady až 10 let). Ostatní údaje smažu, když už nejsou potřeba nebo když o to požádáš.'] },
      { heading: 'Kdo další k údajům má přístup', paragraphs: ['Jen služby, bez kterých e-shop nefunguje: [doplnit hosting, e-mailovou službu a platební bránu].'] },
      { heading: 'Tvoje práva', paragraphs: [`Máš právo na přístup k údajům, jejich opravu, výmaz, omezení zpracování, přenositelnost a námitku. Stačí napsat na ${BUSINESS.email}. Stížnost můžeš podat u Úřadu pro ochranu osobních údajů (uoou.gov.cz).`] },
      { heading: 'Cookies', paragraphs: ['E-shop používá jen úložiště prohlížeče nutné pro fungování (obsah tašky, poslední hledání). Analytické ani reklamní cookies nepoužívám, proto se na souhlas neptám.'] },
    ],
  },
  {
    id: 'kontakt',
    title: 'Kontakt',
    summary: 'Napiš nebo zavolej, ozvu se co nejdřív.',
    sections: [
      { heading: 'Výdejna', paragraphs: [`${orMissing(BUSINESS.pickupAddress)}, ${BUSINESS.area}`, ...BUSINESS.hours.map(([days, time]) => `${days}: ${time}`)] },
      { heading: 'Napiš nebo zavolej', paragraphs: [`E-mail: ${BUSINESS.email}`, `Telefon: ${orMissing(BUSINESS.phone)}`] },
      { heading: 'Provozovatel', paragraphs: [`${BUSINESS.operator}, IČO ${orMissing(BUSINESS.ico)}, sídlo ${orMissing(BUSINESS.seat)}`] },
    ],
  },
]

export const infoById = new Map(INFO_PAGES.map((page) => [page.id, page]))
