/* Sestav si tašku – mynuta.cz
   Zboží přiletí do papírové tašky, taška se plní a když se další kus nevejde, přibude další taška.
   Použití:  const bb = mountBagBuilder(document.querySelector('#sestav'), { customerName: 'Nováková' });
   Bez knihoven, jen moderní prohlížeč (CSS container queries, Web Animations API). */
import { PRODUCTS, TEMPLATES } from './produkty.js';
import { BAG_BACK, BAG_FRONT } from './taska.js';

const NS = 'http://www.w3.org/2000/svg';
const VIEWBOX = { x: 110, y: 68, w: 340, h: 372 };       // výřez scény s taškou (souřadnice ilustrace 480 × 480)
const CLIP = 'M0 0H480V212L338 208V420H158V218H0Z';       // co z nákupu smí být vidět (nad okrajem tašky)
// místa, kam se zboží v tašce skládá: zadní řada pro vysoké věci, přední pro kulaté
const SLOTS = [
  { x: 192, y: 210, r: -8, back: true }, { x: 304, y: 214, r: 12, back: true },
  { x: 248, y: 208, r: 3, back: true },  { x: 222, y: 209, r: -4, back: true },
  { x: 206, y: 216, r: 0, back: false }, { x: 292, y: 216, r: 0, back: false },
  { x: 252, y: 220, r: 0, back: false }, { x: 182, y: 220, r: 0, back: false },
];
const BACK_ORDER = [0, 1, 2, 3];
const FRONT_ORDER = [4, 5, 6, 7];

const ICON_ADD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 6.5v11M6.5 12h11"/></svg>';
const ICON_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" aria-hidden="true"><path d="M12 6.5v11M6.5 12h11" stroke="var(--sst-accent)" stroke-width="2.4"/></svg>';
const ICON_MINUS = '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" aria-hidden="true"><path d="M6.5 12h11" stroke="currentColor" stroke-width="2.4"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5.5v13l10-6.5z"/></svg>';

const plural = (n, one, few, many) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many);
const kgFmt = (v) => v.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const czk = (v) => v.toLocaleString('cs-CZ') + ' Kč';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let instances = 0;

/* šablony ilustrací se do stránky vloží jednou, karty i tašky na ně odkazují přes <use href="#tpl-…"> */
function ensureTemplates() {
  if (document.getElementById('sst-templates')) return;
  const holder = document.createElementNS(NS, 'svg');
  holder.id = 'sst-templates';
  holder.setAttribute('width', '0');
  holder.setAttribute('height', '0');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.position = 'absolute';
  holder.innerHTML = `<defs>${TEMPLATES}</defs>`;
  document.body.appendChild(holder);
}

export function mountBagBuilder(root, options = {}) {
  const o = {
    products: PRODUCTS,                       // [{id, name, unit, price, vol, kg, kind, cat, box?, tpl?}]
    capacity: { vol: 15, kg: 7 },             // jedna papírová taška (P – ověřit na skutečných taškách)
    maxVisible: 7,                            // kolik kusů je v jedné tašce vidět, starší zapadnou dolů
    customerName: 'Nováková',
    pickupTime: '17:00',
    initialOrder: ['bageta', 'mleko', 'salat', 'jablka', 'syr', 'rohliky'],
    demoOrder: ['chleb', 'mleko', 'bageta', 'celer', 'jablka', 'pomerance', 'salat', 'mrkev', 'dzus', 'rajcata', 'porek', 'syr'],
    showIntro: true,
    showDemoButton: true,
    note: 'Ukázkový nákup. Objemy a váhy jsou odhad podle druhu zboží, ceny jsou jen pro představu. Jedna papírová taška pojme asi 15 litrů a 7 kg.',
    onChange: null,                           // (state) => {} – volá se po každé změně
    ...options,
  };
  ensureTemplates();
  const inst = ++instances;
  const TPL_BOX = Object.fromEntries(PRODUCTS.map((p) => [p.id, p.box]));
  o.products = o.products.map((p) => ({ ...p, box: p.box || TPL_BOX[p.tpl || p.id] }));
  const P = Object.fromEntries(o.products.map((p) => [p.id, p]));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let units = [];                 // [{uid, pid}] v pořadí přidání
  let uidSeq = 0;
  let demoToken = 0;
  const slotOf = new Map();       // uid -> {bag, slot}
  const bagEls = [];
  const flying = new Set();       // kusy, které právě letí do tašky

  root.classList.add('sst');
  root.innerHTML = `
    <div class="sst-inner">
      ${o.showIntro ? `<header class="sst-intro">
        <div class="sst-eyebrow">mynuta.cz</div>
        <h2 class="sst-title">Sestav si tašku</h2>
        <p class="sst-lead">Klikni na zboží a sleduj, jak se papírová taška plní. Když se další kus nevejde, přibude druhá taška. Na lístečku pak uvidíš, kolik tašek si vyzvedneš.</p>
      </header>` : ''}
      <div class="sst-layout">
        <section class="sst-shelf" aria-label="Zboží"></section>
        <aside class="sst-basket" aria-label="Tvoje taška">
          <div class="sst-stage"></div>
          <div class="sst-summary" aria-live="polite">
            <div class="sst-count"></div>
            <div class="sst-facts"></div>
          </div>
          <div class="sst-meter">
            <div class="sst-meter-label"><span class="sst-meter-text"></span><span class="sst-meter-pct"></span></div>
            <div class="sst-bar"><span></span></div>
          </div>
          <div class="sst-actions">
            ${o.showDemoButton ? `<button class="sst-btn sst-btn-main" type="button" data-act="demo">${ICON_PLAY}Přehrát ukázku</button>` : ''}
            <button class="sst-btn sst-btn-ghost" type="button" data-act="clear">Vysypat tašku</button>
          </div>
          ${o.note ? `<p class="sst-note">${esc(o.note)}</p>` : ''}
        </aside>
      </div>
    </div>`;
  const $ = (sel) => root.querySelector(sel);
  const stage = $('.sst-stage');

  /* ---------- balení: tašky se plní v pořadí, jak zboží přibývá ---------- */
  function pack() {
    const bags = [];
    let cur = null;
    for (const u of units) {
      const p = P[u.pid];
      if (!cur || (cur.uids.length && (cur.vol + p.vol > o.capacity.vol || cur.kg + p.kg > o.capacity.kg))) {
        cur = { uids: [], vol: 0, kg: 0 };
        bags.push(cur);
      }
      cur.uids.push(u.uid);
      cur.vol += p.vol;
      cur.kg += p.kg;
    }
    for (const b of bags) b.fill = Math.min(1, Math.max(b.vol / o.capacity.vol, b.kg / o.capacity.kg));
    return bags;
  }
  const pidOf = (uid) => units.find((u) => u.uid === uid)?.pid;
  const tplOf = (pid) => P[pid].tpl || pid;   // produkt si může půjčit ilustraci jiného (tpl: 'mleko')

  function assignSlots(bags) {
    bags.forEach((b, bi) => {
      const visible = b.uids.slice(-o.maxVisible);
      for (const [uid, s] of slotOf) if (s.bag === bi && !visible.includes(uid)) slotOf.delete(uid);
      for (const uid of visible) {
        const s = slotOf.get(uid);
        if (s && s.bag !== bi) slotOf.delete(uid);
      }
      const used = new Set(visible.filter((u) => slotOf.has(u)).map((u) => slotOf.get(u).slot));
      for (const uid of visible) {
        if (slotOf.has(uid)) continue;
        const pref = P[pidOf(uid)].kind === 'tall' ? BACK_ORDER.concat(FRONT_ORDER) : FRONT_ORDER.concat(BACK_ORDER);
        const slot = pref.find((i) => !used.has(i));
        used.add(slot);
        slotOf.set(uid, { bag: bi, slot });
      }
    });
  }

  function placement(uid, fill) {
    const p = P[pidOf(uid)];
    const s = SLOTS[slotOf.get(uid).slot];
    let x = s.x;
    if (p.kind !== 'tall') {                      // široké věci držet uvnitř tašky
      const lo = 164 - p.box[0];
      const hi = 332 - (p.box[0] + p.box[2]);
      x = Math.max(lo, Math.min(hi, x));
    }
    const sink = (1 - fill) * 20;                 // čím prázdnější taška, tím hlouběji zboží leží
    return { x, y: s.y + sink, r: p.kind === 'tall' ? s.r : 0, back: s.back };
  }
  const tf = (x, y, r) => `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r}deg)`;

  /* ---------- taška ---------- */
  function createBag(i) {
    const el = document.createElement('div');
    el.className = 'sst-bag';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Papírová taška ${i + 1}`);
    const card = 'M-52 7Q-52 0 -45 0H45Q52 0 52 7V61Q52 68 45 68H-45Q-52 68 -52 61Z';
    svg.innerHTML =
      `<circle cx="255" cy="195" r="135" style="fill: var(--sst-halo)"/>` +
      `<g class="sst-body">${BAG_BACK}` +
      `<clipPath id="sst-clip-${inst}-${i}"><path d="${CLIP}"/></clipPath>` +
      `<g clip-path="url(#sst-clip-${inst}-${i})"><g class="sst-layer-back"></g><g class="sst-layer-front"></g></g>` +
      BAG_FRONT +
      `<path d="M278 232C302 262 334 262 348 312" stroke="#14532D" stroke-width="1.5" fill="none" stroke-linecap="round"/>` +
      `<g transform="translate(348 318) rotate(-7) translate(0 -10)">` +
      `<path d="${card}" fill="#14532D" opacity="0.14" transform="translate(2.5 3.5)"/>` +
      `<path d="${card}" fill="#FFFFFF" stroke="#E3E8E0" stroke-width="1.2"/>` +
      `<circle cx="0" cy="10" r="4.6" fill="none" stroke="#E3E8E0" stroke-width="2"/><circle cx="0" cy="10" r="2.6" fill="#F6F7F4"/>` +
      `<circle cx="40" cy="12" r="6.5" fill="#2E9B4A"/><path d="M37 12.2l2.2 2.2l4-4.6" stroke="#FFFFFF" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<text class="sst-tagtext" x="0" y="35" text-anchor="middle" font-size="14" font-weight="800" fill="#1E2B24">${esc(o.customerName)}</text>` +
      `<text class="sst-tagtext sst-tagbag" x="-3" y="55.5" text-anchor="end" font-size="9" font-weight="700" fill="#5B6660">taška 1/1</text>` +
      `<rect x="1" y="44" width="38" height="15" rx="7.5" fill="#FF9E1B"/>` +
      `<text class="sst-tagtext" x="20" y="55.3" text-anchor="middle" font-size="10.5" font-weight="800" fill="#FFFFFF">${esc(o.pickupTime)}</text>` +
      `</g></g>`;
    el.appendChild(svg);
    stage.appendChild(el);
    return {
      el, svg,
      body: svg.querySelector('.sst-body'),
      back: svg.querySelector('.sst-layer-back'),
      front: svg.querySelector('.sst-layer-front'),
      tag: svg.querySelector('.sst-tagbag'),
      nodes: new Map(),
    };
  }

  function makeItem(uid) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'sst-item');
    g.innerHTML = `<use href="#tpl-${tplOf(pidOf(uid))}"/>`;
    return g;
  }

  function evict(g, up) {
    g.style.transition = 'transform .35s ease-in, opacity .3s ease';
    const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(g.style.transform);
    if (m) g.style.transform = tf(+m[1], +m[2] + (up ? -70 : 60), 0);
    g.style.opacity = '0';
    setTimeout(() => g.remove(), reduced ? 0 : 360);
  }

  /* srovná stránku se stavem nákupu; `incoming` dokreslí až animace dopadu */
  function sync(incoming = null, popNew = true) {
    const packed = pack();
    const bags = packed.length ? packed : [{ uids: [], vol: 0, kg: 0, fill: 0 }];
    assignSlots(bags);
    while (bagEls.length < bags.length) {
      const b = createBag(bagEls.length);
      bagEls.push(b);
      if (popNew && !reduced) {
        b.body.animate([{ transform: 'translateY(40px) scale(.7)', opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: 460, easing: 'cubic-bezier(.34,1.4,.6,1)' });
      }
    }
    while (bagEls.length > bags.length) {
      const b = bagEls.pop();
      b.el.style.transition = 'opacity .25s';
      b.el.style.opacity = '0';
      setTimeout(() => b.el.remove(), 260);
    }
    bags.forEach((bag, bi) => {
      const b = bagEls[bi];
      const visible = bag.uids.slice(-o.maxVisible);
      for (const [uid, g] of b.nodes) {
        if (!visible.includes(uid)) {
          evict(g, !units.some((u) => u.uid === uid));
          b.nodes.delete(uid);
        }
      }
      for (const uid of visible) {
        if (uid === incoming || flying.has(uid)) continue;
        const pl = placement(uid, bag.fill);
        let g = b.nodes.get(uid);
        if (!g) {
          g = makeItem(uid);
          g.style.transition = 'none';
          g.style.opacity = '0';
          g.style.transform = tf(pl.x, pl.y + 24, pl.r);
          (pl.back ? b.back : b.front).appendChild(g);
          b.nodes.set(uid, g);
          requestAnimationFrame(() => requestAnimationFrame(() => {
            g.style.transition = '';
            g.style.opacity = '1';
            g.style.transform = tf(pl.x, pl.y, pl.r);
          }));
        } else {
          const layer = pl.back ? b.back : b.front;
          if (g.parentNode !== layer) layer.appendChild(g);
          g.style.transform = tf(pl.x, pl.y, pl.r);
        }
      }
      b.tag.textContent = `taška ${bi + 1}/${bags.length}`;
    });
    updateSummary(packed);
    updateCards();
    if (typeof o.onChange === 'function') o.onChange(getState());
  }

  /* ---------- souhrn a karty ---------- */
  function getState() {
    const bags = pack();
    return {
      items: o.products.map((p) => ({ id: p.id, qty: units.filter((u) => u.pid === p.id).length })).filter((i) => i.qty > 0),
      count: units.length,
      bags: bags.length,
      kg: units.reduce((s, u) => s + P[u.pid].kg, 0),
      litres: units.reduce((s, u) => s + P[u.pid].vol, 0),
      price: units.reduce((s, u) => s + P[u.pid].price, 0),
      lastBagFill: bags.length ? bags[bags.length - 1].fill : 0,
    };
  }

  function updateSummary(bags) {
    const s = getState();
    const n = Math.max(1, bags.length);
    $('.sst-count').innerHTML = `${n}<small>${plural(n, 'taška', 'tašky', 'tašek')}</small>`;
    $('.sst-facts').textContent = s.count
      ? `${s.count} ${plural(s.count, 'kus', 'kusy', 'kusů')} · cca ${kgFmt(s.kg)} kg · ${czk(s.price)}`
      : 'Taška je prázdná';
    const pct = Math.round(s.lastBagFill * 100);
    $('.sst-meter-text').textContent = bags.length > 1 ? `Taška ${bags.length} je zaplněná` : 'Taška je zaplněná';
    $('.sst-meter-pct').textContent = `${pct} %`;
    $('.sst-bar > span').style.width = pct + '%';
  }

  function buildShelf() {
    const shelf = $('.sst-shelf');
    const cats = [...new Set(o.products.map((p) => p.cat))];
    for (const cat of cats) {
      const sec = document.createElement('div');
      sec.innerHTML = `<h3 class="sst-cat-title">${esc(cat)}</h3><div class="sst-grid"></div>`;
      const grid = sec.querySelector('.sst-grid');
      for (const p of o.products.filter((q) => q.cat === cat)) {
        const card = document.createElement('article');
        card.className = 'sst-card';
        card.dataset.id = p.id;
        card.innerHTML =
          `<div class="sst-pic"><svg viewBox="${p.box.join(' ')}" role="img" aria-label="${esc(p.name)}"><use href="#tpl-${tplOf(p.id)}"/></svg></div>` +
          `<div><h4 class="sst-name">${esc(p.name)}</h4><p class="sst-unit">${esc(p.unit)}</p></div>` +
          `<div class="sst-ctl"><span class="sst-price">${czk(p.price)}</span>` +
          `<button class="sst-btn sst-add" type="button" data-act="add">${ICON_ADD}Přidat</button>` +
          `<span class="sst-stepper" hidden>` +
          `<button class="sst-step" type="button" data-act="minus" aria-label="Odebrat ${esc(p.name)}">${ICON_MINUS}</button>` +
          `<span class="sst-qty">0</span>` +
          `<button class="sst-step" type="button" data-act="plus" aria-label="Přidat ${esc(p.name)}">${ICON_PLUS}</button>` +
          `</span></div>`;
        grid.appendChild(card);
      }
      shelf.appendChild(sec);
    }
  }

  function updateCards() {
    for (const card of root.querySelectorAll('.sst-card')) {
      const q = units.filter((u) => u.pid === card.dataset.id).length;
      card.querySelector('.sst-add').hidden = q > 0;
      card.querySelector('.sst-stepper').hidden = q === 0;
      card.querySelector('.sst-qty').textContent = q;
    }
  }

  /* ---------- animace ---------- */
  function thump(b) {
    if (reduced) return;
    b.body.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.025,.965)', offset: 0.35 }, { transform: 'scale(1,1)' }],
      { duration: 340, easing: 'ease-out' });
  }

  function fly(pid, fromRect, b, pl) {
    const p = P[pid];
    const ctm = b.svg.getScreenCTM();
    if (!ctm) return Promise.resolve();
    const pt = new DOMPoint(pl.x, pl.y - 70).matrixTransform(ctm);
    const sScene = ctm.a;
    let r0 = fromRect;
    if (!r0 || r0.bottom < 0 || r0.top > window.innerHeight) {   // karta mimo obrazovku: spadne shora
      const w0 = p.box[2] * sScene * 1.4;
      r0 = { left: pt.x - w0 / 2, top: Math.max(0, pt.y - 220), width: w0, height: (w0 * p.box[3]) / p.box[2] };
    }
    const sThumb = Math.min(r0.width / p.box[2], r0.height / p.box[3]);
    const w = p.box[2] * sThumb;
    const h = p.box[3] * sThumb;
    const left = r0.left + (r0.width - w) / 2;
    const top = r0.top + (r0.height - h) / 2;
    const ax = -p.box[0] * sThumb;
    const ay = -p.box[1] * sThumb;
    const fl = document.createElementNS(NS, 'svg');
    fl.setAttribute('class', 'sst-flyer');
    fl.setAttribute('viewBox', p.box.join(' '));
    fl.setAttribute('width', w);
    fl.setAttribute('height', h);
    fl.style.left = left + 'px';
    fl.style.top = top + 'px';
    fl.style.transformOrigin = `${ax}px ${ay}px`;
    fl.innerHTML = `<use href="#tpl-${tplOf(pid)}"/>`;
    document.body.appendChild(fl);
    const dx = pt.x - (left + ax);
    const dy = pt.y - (top + ay);
    const k = sScene / sThumb;
    const lift = Math.min(dy, 0) - 90;
    const anim = fl.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)' },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 + lift * 0.6}px) scale(${((1 + k) / 2) * 1.08}) rotate(${pl.r / 2 - 10}deg)`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(${k}) rotate(${pl.r}deg)` },
    ], { duration: 640, easing: 'cubic-bezier(.45,.05,.3,1)' });
    return anim.finished.then(() => fl.remove(), () => fl.remove());
  }

  function locate(uid) {
    const bags = pack();
    const bi = bags.findIndex((b) => b.uids.includes(uid));
    if (bi < 0 || !slotOf.has(uid) || !bags[bi].uids.slice(-o.maxVisible).includes(uid)) return null;
    return { bag: bags[bi], b: bagEls[bi] };
  }

  async function add(pid) {
    if (!P[pid]) return;
    const uid = ++uidSeq;
    units.push({ uid, pid });
    const pic = root.querySelector(`.sst-card[data-id="${pid}"] .sst-pic`);
    const fromRect = pic ? pic.getBoundingClientRect() : null;
    flying.add(uid);
    sync(uid);
    const loc = locate(uid);
    if (!loc) { flying.delete(uid); return; }
    if (!reduced) await fly(pid, fromRect, loc.b, placement(uid, loc.bag.fill));
    flying.delete(uid);
    const now = locate(uid);
    if (!now) return;
    const old = now.b.nodes.get(uid);
    if (old) old.remove();
    const pl = placement(uid, now.bag.fill);
    const g = makeItem(uid);
    g.style.transition = 'none';
    g.style.transform = tf(pl.x, pl.y - 70, pl.r);
    (pl.back ? now.b.back : now.b.front).appendChild(g);
    now.b.nodes.set(uid, g);
    if (reduced) { g.style.transform = tf(pl.x, pl.y, pl.r); return; }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      g.style.transition = 'transform .42s cubic-bezier(.3,1.5,.55,1)';
      g.style.transform = tf(pl.x, pl.y, pl.r);
      setTimeout(() => { g.style.transition = ''; thump(now.b); }, 230);
    }));
  }

  function remove(pid) {
    for (let i = units.length - 1; i >= 0; i--) {
      if (units[i].pid === pid) { units.splice(i, 1); break; }
    }
    sync();
  }

  function clear() {
    demoToken++;
    units = [];
    sync();
  }

  async function playDemo() {
    const my = ++demoToken;
    units = [];
    sync();
    await wait(reduced ? 0 : 450);
    for (const pid of o.demoOrder) {
      if (my !== demoToken) return;
      add(pid);
      await wait(reduced ? 0 : 560);
    }
  }

  /* ---------- ovládání ---------- */
  function onClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn || !root.contains(btn)) return;
    const act = btn.dataset.act;
    const pid = btn.closest('.sst-card')?.dataset.id;
    if (act === 'add' || act === 'plus') add(pid);
    else if (act === 'minus') remove(pid);
    else if (act === 'clear') clear();
    else if (act === 'demo') playDemo();
  }
  root.addEventListener('click', onClick);

  buildShelf();
  for (const pid of o.initialOrder) if (P[pid]) units.push({ uid: ++uidSeq, pid });
  sync(null, false);

  return {
    add, remove, clear, playDemo, getState,
    destroy() {
      demoToken++;
      root.removeEventListener('click', onClick);
      root.innerHTML = '';
      root.classList.remove('sst');
    },
  };
}
