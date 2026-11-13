/* ShipItRight deliverables: shared behaviour. Copied into each project's docs/_assets/.
   - builds the table of contents from .section > h2 / h3
   - flags placeholder sections (.todo) and shows a completeness banner
   - draws links between .node elements inside a .diagram (data-links="id1 id2")
   - lays out the big picture timeline (.bp-frise): lanes, time slots, flow arrows
   - lays out functional journeys (.pf): nodes on a grid, routed arrows
   - links the cards of a chain diagram to the detailed design pages (window.DOC_XREF, xrefs())
   - shows on hover what an EP, EN or PROC link points to (objTips(), from detailed/xref.js)
   - sorts a table[data-sortable] on a click on a column head
   - lazy-loads Mermaid when a .mermaid block is present
   Fixed labels come from i18n.js (team/conventions/language.md), see SirI18n below. */

/* Labels of the page, in the project language: window.SIR_I18N = { lang, labels } with keys "<namespace>.<key>",
   generated as i18n.js next to this file by team/scripts/i18n-assets.mjs. When the page does not load it, it is
   loaded here, from the folder of this script, once (plan.js uses the same loader through Doc). Nothing starts
   before the labels are there and the DOM is ready: SirI18n.ready(fn) queues the init functions, in order.
   Without i18n.js, the labels below are used (English, the default language of a project).
   FALLBACK is written by team/scripts/i18n-fallback.mjs (plan.js carries the plan namespace). */
(function () {
  'use strict';
  if (window.SirI18n) return;
  const FALLBACK = {
    "common.gate.G0": "Framing approval",
    "common.gate.G1": "Functional design approval",
    "common.gate.G2": "Technical design approval",
    "common.gate.G3": "Sprint acceptance",
    "common.decision.validated": "approved",
    "common.decision.changes-requested": "changes requested",
    "common.decision.accepted": "accepted",
    "common.decision.accepted-with-reservations": "accepted with reservations",
    "common.decision.rejected": "rejected",
    "doc.close": "Close",
    "doc.info.aria": "Explanation: {title}",
    "doc.completeness.missing": {"one":"{n} mandatory section to complete: {list}","other":"{n} mandatory sections to complete: {list}"},
    "doc.completeness.rest": {"one":"Mandatory sections complete. {n} recommended or optional item is left to complete.","other":"Mandatory sections complete. {n} recommended or optional items are left to complete."},
    "doc.completeness.done": "Deliverable complete.",
    "doc.level.mandatory": "Mandatory",
    "doc.level.recommended": "Recommended",
    "doc.level.optional": "Optional",
    "doc.todo": "To complete: ",
    "doc.chain.aria": "Chain of {name}",
    "doc.mode.aria": "Arrow style",
    "doc.mode.curve": "Curves",
    "doc.mode.ortho": "Right angles",
    "doc.release.label": "Scope",
    "doc.release.all": "Whole project",
    "doc.release.hint": "A release shows its cards and, as context, the cards already done (DONE) or to adapt (TO UPDATE).",
    "doc.release.todo": "{n} to create",
    "doc.release.update": "{n} to adapt",
    "doc.release.done": "{n} already done",
    "doc.release.none": "none",
    "doc.schemas.aria": "Schemas of {id}: {list}",
    "doc.schemas.sends": "sends {name}",
    "doc.schemas.receives": "receives {name}",
    "doc.schemas.tip": "Schemas: {list}",
    "doc.schemas.head": "Schemas of {id}",
    "doc.schemas.in": "Sent (request body)",
    "doc.schemas.out": "Received (response)",
    "doc.shot.missing": "screenshot to take",
    "doc.gate.tip": "{gate} · {decision}",
    "doc.gate.tipDate": "{gate} · {decision} on {date}",
    "doc.filter.aria": "Filter by type",
    "doc.filter.all": "All",
    "doc.filter.shown": "{n} shown out of {total}",
    "doc.more.button": "Show {n} more",
    "doc.more.all": "Everything is shown",
    "doc.more.announce": "{n} more shown",
    "doc.facets.aria": "Filter by {label}",
    "doc.facets.empty": "No result for this filter.",
    "doc.unit.days": "{n} d",
    "doc.unit.halfDay": "½ d",
    "doc.unit.hours": "{n} h",
    "doc.est.settings": "Set the estimation scale",
    "doc.est.title": "Estimation scale",
    "doc.est.human": "Human (d)",
    "doc.est.validation": "Business validation (d)",
    "doc.est.assist": "AI-assisted, as a % of human time",
    "doc.est.agent": "Autonomous AI, agent hours per human day",
    "doc.est.reset": "Reset",
    "doc.gantt.weekOf": "Week of",
    "doc.gantt.today": "Today",
    "doc.gantt.late": "wished go-live exceeded by {d}",
    "doc.gantt.range": "{from} to {to}",
    "doc.gantt.span": "{label}: {from} to {to}",
    "doc.gantt.at": "{label}: {date}",
    "doc.gantt.gate": "Gate {name}",
    "gherkin.given": ["Given"],
    "gherkin.when": ["When"],
    "gherkin.then": ["Then"],
    "gherkin.and": ["And"],
    "gherkin.but": ["But"],
    "gherkin.scenario": ["Scenario","Example"],
  };
  const self = document.currentScript;
  let dom = document.readyState !== 'loading', loaded = !!window.SIR_I18N, file = loaded;
  const queue = [];
  const fail = window.reportError || ((e) => setTimeout(() => { throw e; }));
  // each function runs on its own: one that throws does not stop the next ones
  const flush = () => {
    if (!dom || !loaded) return;
    while (queue.length) { try { queue.shift()(); } catch (e) { fail(e); } }
  };
  if (!loaded) {
    const s = document.createElement('script');
    s.src = new URL('i18n.js', (self && self.src) || location.href).href;
    s.onload = () => { file = !!window.SIR_I18N; loaded = true; flush(); };
    s.onerror = () => { loaded = true; console.warn('[doc.js] i18n.js not found, default labels used:', s.src); flush(); };
    document.head.appendChild(s);
  }
  if (!dom) document.addEventListener('DOMContentLoaded', () => { dom = true; flush(); });

  const conf = () => (file && window.SIR_I18N) || { lang: 'en', labels: {} };
  const lang = () => conf().lang || 'en';
  // French typography (no-break spaces) applies to French pages only
  const fr = () => lang().split('-')[0] === 'fr';
  const warned = new Set();
  // raw label (string, plural object or array of keyword forms); the embedded labels when there is no i18n.js
  const raw = (key) => {
    const v = (conf().labels || {})[key];
    if (v != null) return v;
    if (!file) return FALLBACK[key];
    return undefined;
  };
  const has = (key) => raw(key) != null;
  let nf = null, pr = null;
  const num = (n, opts) => (opts ? new Intl.NumberFormat(lang(), opts) : (nf = nf || new Intl.NumberFormat(lang(), { maximumFractionDigits: 2 }))).format(n);
  // t('doc.more.button', { n: 5 }): {name} parameters, numbers formatted in the project language; a plural label
  // is an object of CLDR forms chosen on params.n. A key missing everywhere shows as is (and is warned once).
  const t = (key, params = {}) => {
    let v = raw(key);
    if (v == null) {
      if (!warned.has(key)) { warned.add(key); console.warn('[doc.js] missing label', key); }
      return key;
    }
    if (Array.isArray(v)) v = v[0];
    else if (typeof v === 'object') {
      pr = pr || new Intl.PluralRules(lang());
      v = v[pr.select(Number(params.n ?? 0))] ?? v.other ?? Object.values(v)[0];
    }
    return String(v).replace(/\{(\w+)\}/g, (m, k) => (params[k] == null ? m : typeof params[k] === 'number' ? num(params[k]) : String(params[k])));
  };
  // dates in the project language: a day (ms or ISO) in short form. The pattern common.date.short (dd.mm.yyyy in
  // fr) gives the short form when the labels have one, else Intl.DateTimeFormat (10/2/2026 in en). date(d, 'dm')
  // is the short form without the year (02.10), other options go to Intl (month and year of the Gantt scale).
  const dateFmt = new Map();
  const SHORT = { day: '2-digit', month: '2-digit', year: 'numeric' };
  const p2 = (n) => String(n).padStart(2, '0');
  const date = (d, opts = SHORT) => {
    if (typeof d === 'string') {
      const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!m) return d;
      d = new Date(+m[1], +m[2] - 1, +m[3]);
    }
    const pattern = raw('common.date.short');
    if ((opts === SHORT || opts === 'dm') && typeof pattern === 'string' && pattern.includes('yyyy')) {
      const p = opts === 'dm' ? pattern.replace(/[^dmy]?yyyy[^dmy]?/, '') : pattern;
      return p.replace('yyyy', d.getFullYear()).replace('dd', p2(d.getDate())).replace('mm', p2(d.getMonth() + 1));
    }
    if (opts === 'dm') opts = { day: '2-digit', month: '2-digit' };
    const k = JSON.stringify(opts);
    if (!dateFmt.has(k)) dateFmt.set(k, new Intl.DateTimeFormat(lang(), opts));
    return dateFmt.get(k).format(d);
  };
  const addFallback = (dict) => Object.keys(dict).forEach((k) => { if (!(k in FALLBACK)) FALLBACK[k] = dict[k]; });
  window.SirI18n = { ready: (fn) => { queue.push(fn); flush(); }, t, raw, has, lang, fr, num, date, addFallback };
})();

(function () {
  'use strict';

  const I = window.SirI18n, { t } = I;
  const cap = (s) => (s ? s.charAt(0).toLocaleUpperCase(I.lang()) + s.slice(1) : s);
  // A decision code (validated, changes-requested…) in the project language; an unknown value shows as written
  const decision = (v) => (I.has('common.decision.' + v) ? t('common.decision.' + v) : v);
  // A day written ISO (2026-10-02), in the project language
  const day = (s) => (s ? I.date(s) : '');
  const esc =(s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  // A card hidden by the release filter (or any other display: none) takes no part in a diagram
  const shown = (el) => !el.closest('.out-of-release');
  const slug = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  // Text of a heading without the controls added inside it (the "i" button of infos())
  const headText = (h) => {
    const c = h.cloneNode(true);
    $$('.info-btn', c).forEach((b) => b.remove());
    return c.textContent.trim();
  };

  function buildToc() {
    const nav = $('.doc-toc nav');
    if (!nav) return;
    const heads = $$('.doc-main .section > h2, .doc-main .section > h3');
    heads.forEach((h) => {
      if (!h.id) h.id = slug(h.textContent);
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      a.className = h.tagName === 'H3' ? 'lvl-3' : 'lvl-2';
      nav.appendChild(a);
    });
    const links = $$('a', nav);
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '0px 0px -75% 0px' });
    heads.forEach((h) => obs.observe(h));
  }

  // A section's explanation kept out of the way: <div class="info-body" hidden> right after its h2 becomes a
  // small "i" button next to the title, which opens the explanation in a modal.
  function infos() {
    $$('.section > .info-body').forEach((body) => {
      const h = body.parentElement.querySelector(':scope > h2');
      if (!h) return;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'info-btn'; btn.textContent = 'i';
      btn.setAttribute('aria-label', t('doc.info.aria', { title: headText(h) }));
      h.appendChild(btn);
      const dlg = document.createElement('dialog');
      dlg.className = 'info-dialog';
      dlg.innerHTML = `<div class="info-head"><b></b><button type="button" class="info-close" aria-label="${esc(t('doc.close'))}">×</button></div>`;
      $('b', dlg).textContent = headText(h);
      const content = body.cloneNode(true); content.hidden = false; dlg.appendChild(content);
      document.body.appendChild(dlg);
      btn.addEventListener('click', () => dlg.showModal());
      $('.info-close', dlg).addEventListener('click', () => dlg.close());
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
      $$('a[href^="#"]', dlg).forEach((a) => a.addEventListener('click', () => dlg.close()));
    });
  }

  // Instant tooltips: any element with data-tip, even added later (plan.js). A fixed bubble on the body, so a
  // scrolling table does not clip it.
  function tips() {
    const tip = document.createElement('div');
    tip.className = 'tip'; tip.id = 'doc-tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
    document.body.appendChild(tip);
    let owner = null;
    const release = () => { if (owner) owner.removeAttribute('aria-describedby'); owner = null; };
    const show = (e) => {
      const t = e.target.closest && e.target.closest('[data-tip]');
      if (!t) return;
      tip.textContent = t.dataset.tip; tip.hidden = false;
      // the focused or hovered element is described by the bubble for assistive technologies
      release(); owner = t; t.setAttribute('aria-describedby', tip.id);
      const r = t.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
      const left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8));
      const top = r.top - h - 8 >= 8 ? r.top - h - 8 : r.bottom + 8;
      tip.style.left = left + 'px'; tip.style.top = top + 'px';
    };
    const hide = (e) => { if (e.target.closest && e.target.closest('[data-tip]')) { tip.hidden = true; release(); } };
    document.addEventListener('mouseover', show); document.addEventListener('focusin', show);
    document.addEventListener('mouseout', hide); document.addEventListener('focusout', hide);
    addEventListener('scroll', () => { tip.hidden = true; }, true);
  }

  function completeness() {
    const sections = $$('.section[data-level]');
    sections.forEach((s) => s.classList.toggle('has-todo', !!$('.todo', s)));
    const missing = sections.filter((s) => s.dataset.level === 'required' && $('.todo', s));
    const host = $('.doc-main');
    if (!host || !sections.length) return;
    const banner = document.createElement('div');
    if (missing.length) {
      banner.className = 'completeness ko';
      // one label for the sentence, the links take the place of {list}
      const [before, after = ''] = t('doc.completeness.missing', { n: missing.length, list: '\u0000' }).split('\u0000');
      banner.append(before);
      missing.forEach((s, i) => {
        const h = $('h2', s), a = document.createElement('a');
        a.href = '#' + (h?.id || ''); a.textContent = h ? headText(h) : '?';
        if (i) banner.append(', ');
        banner.append(a);
      });
      banner.append(after);
    } else {
      const todos = $$('.todo').length;
      banner.className = 'completeness ok';
      banner.textContent = todos ? t('doc.completeness.rest', { n: todos }) : t('doc.completeness.done');
    }
    const header = $('.doc-header', host);
    header ? header.after(banner) : host.prepend(banner);
  }

  // Links between nodes: <div class="node" id="f-search" data-links="ep-search ep-list|label_text">
  // Links are routed orthogonally around every card (.node, badge included) and every column or
  // container title: a link never passes over or under a card. Routing is an A* search on a fine grid
  // where cards are obstacles and turns cost extra. Links that share their source or their target share
  // their trunk and fork or merge (the format reads reuse from converging arrows); unrelated links are
  // pushed at least two lanes apart so they never look like a double line.
  const SVGNS = 'http://www.w3.org/2000/svg';
  const G = 6;          // grid step (px)
  const MARGIN = 7;     // free space kept around each card (px)
  const TURN = 8;       // cost of a turn, in grid steps
  const CROSS = 14;     // cost of running on a cell taken by an unrelated link
  const NEAR = 6;       // cost of running right next to another link (double-line effect)
const SHARE = 0.5;
const ALONG = 400;
const JUNCTION_DOTS = false; // dots where links of a same card fork (off: shared trunks read without them)    // cost of running on an unrelated link's lane    // cost of a step on a related link's lane: links merge as early and fork as late as they can
  const ARRIVE = 30;    // run before an arrowhead (px): 20 px stay straight once the corner is rounded
  const DEPART = 12;    // straight run after leaving a card (px)
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // right, down, left, up
  const SIDE_DIR = { r: 0, b: 1, l: 2, t: 3 };

  // Readable name of a node for the fallback legend: without its ref chips, its parts separated
  // ("SCR-04 Booking", not "SCR-04BookingMSG-03")
  function nodeName(el) {
    const c = el.cloneNode(true);
    $$('.refs, .sf-row, .sf-next', c).forEach((r) => r.remove());
    $$('small, b, .ec, li', c).forEach((e) => e.append(' '));
    return c.textContent.replace(/\s+/g, ' ').trim();
  }

  function drawLinks(diagram) {
    $$('svg.links', diagram).forEach((s) => s.remove());
    // a layout that writes its links in the cards instead (--links: none, the screen map on a phone)
    if (getComputedStyle(diagram).getPropertyValue('--links').trim() === 'none') {
      const leg = diagram.nextElementSibling;
      if (leg && leg.classList.contains('diagram-legend')) leg.remove();
      return;
    }
    const W = diagram.scrollWidth, H = diagram.scrollHeight;
    const box = diagram.getBoundingClientRect();
    const ox = box.left - diagram.scrollLeft, oy = box.top - diagram.scrollTop;
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - ox, y: r.top - oy, r: r.right - ox, b: r.bottom - oy, w: r.width, h: r.height };
    };

    // 1. Links and their sides
    const links = [];
    $$('[data-links]', diagram).filter(shown).forEach((from) => {
      // "id1 id2|label with spaces": a word that is not an element id continues the previous label
      const items = [];
      from.dataset.links.split(/\s+/).filter(Boolean).forEach((w) => {
        const [id, ...rest] = w.split('|');
        if (document.getElementById(id) || !items.length) items.push(rest.length ? id + '|' + rest.join('|') : id);
        else items[items.length - 1] += (items[items.length - 1].includes('|') ? ' ' : '|') + w;
      });
      items.forEach((raw) => {
        // id|label|card near the source|card near the target (cards are optional, for data models)
        const [id, label, cardA, cardB] = raw.split('|');
        const to = document.getElementById(id);
        if (!to) { console.warn('[doc.js] unknown link target', id); return; }
        if (!shown(to)) return;
        const a = rect(from), b = rect(to);
        const sameColumn = a.r > b.x && b.r > a.x;
        let sa, sb;
        if (sameColumn) { const down = b.y >= a.b; sa = down ? 'b' : 't'; sb = down ? 't' : 'b'; }
        else { const right = b.x >= a.r; sa = right ? 'r' : 'l'; sb = right ? 'l' : 'r'; }
        links.push({ from, to, label, cardA, cardB, a, b, sa, sb, topic: from.classList.contains('topic'), plain: !!from.closest('.mcd') });
      });
    });
    if (!links.length) return;

    // 2. Ports: one port per card side, centred and snapped to the grid, so that links leaving or
    //    entering the same side share their trunk
    const snap = (v) => Math.round(v / G) * G;
    const port = (r, side) => side === 'r' ? { x: r.r, y: snap(r.y + r.h / 2) } : side === 'l' ? { x: r.x, y: snap(r.y + r.h / 2) }
      : side === 'b' ? { x: snap(r.x + r.w / 2), y: r.b } : { x: snap(r.x + r.w / 2), y: r.y };
    const ids = new Map();
    const idOf = (el) => { if (!ids.has(el)) ids.set(el, ids.size + 1); return ids.get(el); };
    links.forEach((l) => { l.start = port(l.a, l.sa); l.end = port(l.b, l.sb); l.src = idOf(l.from); l.tgt = idOf(l.to); });
    // Data model relations never share a trunk: each one gets its own source and target identity
    // (so no merge, no junction dot) and links on the same side of a card get distinct ports.
    const plain = links.filter((l) => l.plain);
    plain.forEach((l, i) => { l.src = 100000 + 2 * i; l.tgt = 100001 + 2 * i; });
    const sides = new Map();
    plain.forEach((l) => [[l.from, l.sa, 'start'], [l.to, l.sb, 'end']].forEach(([el, side, k]) => {
      const key = el.id + side;
      if (!sides.has(key)) sides.set(key, []);
      sides.get(key).push({ l, side, k });
    }));
    sides.forEach((list) => {
      if (list.length < 2) return;
      const step = 3 * G;
      list.forEach(({ l, side, k }, i) => {
        const off = (i - (list.length - 1) / 2) * step;
        if (side === 'l' || side === 'r') l[k] = { x: l[k].x, y: snap(l[k].y + off) };
        else l[k] = { x: snap(l[k].x + off), y: l[k].y };
      });
    });
    // Nearly level links: a link that is alone on one of its two sides moves its port there to the
    // height of the other end, when the card is tall enough for it, so it runs straight instead of
    // making a small step
    const onSide = new Map();
    links.forEach((l) => [idOf(l.from) + l.sa, idOf(l.to) + l.sb].forEach((k) => onSide.set(k, (onSide.get(k) || 0) + 1)));
    links.filter((l) => !l.plain && (l.sa === 'l' || l.sa === 'r')).forEach((l) => {
      if (l.start.y === l.end.y) return;
      const inside = (r, y) => y >= r.y + 6 && y <= r.b - 6;
      if (onSide.get(idOf(l.to) + l.sb) === 1 && inside(l.b, l.start.y)) l.end = { x: l.end.x, y: l.start.y };
      else if (onSide.get(idOf(l.from) + l.sa) === 1 && inside(l.a, l.end.y)) l.start = { x: l.start.x, y: l.end.y };
    });

    // 3. Grid with obstacles
    const cols = Math.ceil(W / G) + 1, rows = Math.ceil(H / G) + 1, N = cols * rows;
    const blocked = new Uint8Array(N);
    // Owner of each used cell (source and target ids), and of the cells right next to a link
    const useSrc = new Int32Array(N), useTgt = new Int32Array(N), useDir = new Uint8Array(N), nearSrc = new Int32Array(N), nearTgt = new Int32Array(N);
    const obstacles = $$('.node, .c-title, .col-title, .sticky, .bp-phase-title, .bp-lane-label, .pf-node, .mcd-entity', diagram).map((el) => {
      const r = rect(el);
      if (el.dataset.badge) { r.y -= 9; r.r += 9; } // TODO / TO UPDATE badge drawn outside the card
      return r;
    });
    obstacles.forEach((o) => {
      const x0 = Math.max(0, Math.ceil((o.x - MARGIN) / G)), x1 = Math.min(cols - 1, Math.floor((o.r + MARGIN) / G));
      const y0 = Math.max(0, Math.ceil((o.y - MARGIN) / G)), y1 = Math.min(rows - 1, Math.floor((o.b + MARGIN) / G));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) blocked[y * cols + x] = 1;
    });
    const hitsCard = (x0, y0, x1, y1) => obstacles.some((o) => x0 < o.r && x1 > o.x && y0 < o.b && y1 > o.y);

    // First free grid point at least `dist` px away from a card side, walking away from it
    const exitCell = (pt, side, dist) => {
      const [dx, dy] = DIRS[SIDE_DIR[side]];
      let cx = Math.round(pt.x / G), cy = Math.round(pt.y / G);
      if (dx) cx = dx > 0 ? Math.ceil((pt.x + dist) / G) : Math.floor((pt.x - dist) / G);
      if (dy) cy = dy > 0 ? Math.ceil((pt.y + dist) / G) : Math.floor((pt.y - dist) / G);
      for (let k = 0; k < 40; k++) {
        if (cx >= 0 && cy >= 0 && cx < cols && cy < rows && !blocked[cy * cols + cx]) return { cx, cy };
        cx += dx; cy += dy;
      }
      return null;
    };

    // Arrival stubs: the straight run before each arrowhead is reserved for links to that card
    const reserved = new Int32Array(N);
    links.forEach((l) => {
      l.c0 = exitCell(l.start, l.sa, DEPART);
      l.c1 = exitCell(l.end, l.sb, ARRIVE);
      if (!l.c1) return;
      const [dx, dy] = DIRS[SIDE_DIR[l.sb]];
      const px = Math.round(l.end.x / G), py = Math.round(l.end.y / G);
      for (let cx = l.c1.cx, cy = l.c1.cy, k = 0; k < 40 && (dx ? cx !== px : cy !== py); k++, cx -= dx, cy -= dy) {
        const c = cy * cols + cx;
        if (c >= 0 && c < N && !blocked[c]) reserved[c] = l.tgt;
      }
    });

    // 4. A* on (cell, direction) states
    // A state also counts the turns taken so far, so that a link can be held to MAX_TURNS turns
    const MAX_TURNS = 2;
    const S = N * 4 * (MAX_TURNS + 1);
    const gCost = new Float32Array(S), parent = new Int32Array(S);
    let K = 1; // turn levels of the current search: MAX_TURNS + 1 when turns are limited, 1 when they are not
    function route(start, goal, dirStart, dirGoal, src, tgt, limit) {
      K = limit ? MAX_TURNS + 1 : 1;
      gCost.fill(Infinity); parent.fill(-1);
      const heap = [];
      const push = (f, s) => {
        heap.push([f, s]); let i = heap.length - 1;
        while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
      };
      const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) {
          heap[0] = last; let i = 0;
          for (;;) {
            const l = 2 * i + 1, r = l + 1; let m = i;
            if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
            if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
            if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m;
          }
        }
        return top;
      };
      const h = (cx, cy) => (Math.abs(cx - goal.cx) + Math.abs(cy - goal.cy)) * SHARE;
      const s0 = ((start.cy * cols + start.cx) * 4 + dirStart) * K;
      gCost[s0] = 0; push(h(start.cx, start.cy), s0);
      const goalCell = goal.cy * cols + goal.cx;
      while (heap.length) {
        const [f, s] = pop();
        const t = s % K, cd = (s - t) / K, cell = cd >> 2, dir = cd & 3, g = gCost[s];
        if (f - h(cell % cols, (cell / cols) | 0) > g + 1e-6) continue; // stale entry
        if (cell === goalCell) return s;
        const cx = cell % cols, cy = (cell / cols) | 0;
        for (let nd = 0; nd < 4; nd++) {
          if (nd === ((dir + 2) & 3)) continue; // no U-turn
          const nx = cx + DIRS[nd][0], ny = cy + DIRS[nd][1];
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const nc = ny * cols + nx;
          if (blocked[nc]) continue;
          if (reserved[nc] && reserved[nc] !== tgt && nc !== goalCell) continue; // another card's approach
          let cost = 1 + (nd !== dir ? TURN : 0);
          const related = (a, b) => a === src || b === tgt;
          // Two links either share the exact same lane (related links: cheaper, they merge or fork) or
          // stay two lanes apart: running alongside any other link costs extra, related or not
          // The discount holds only along the lane (1 horizontal, 2 vertical): crossing it is a plain step
          // An unrelated lane may be crossed, never followed: running on it would read as a junction
          const along = useDir[nc] & (nd & 1 ? 2 : 1);
          if (useSrc[nc]) cost += related(useSrc[nc], useTgt[nc]) ? (along ? SHARE - 1 : 0) : (along ? ALONG : CROSS);
          else if (nearSrc[nc]) cost += NEAR;
          if (nc === goalCell && nd !== dirGoal) cost += TURN;
          const nt = K > 1 ? t + (nd !== dir ? 1 : 0) + (nc === goalCell && nd !== dirGoal ? 1 : 0) : 0;
          if (nt >= K && K > 1) continue;
          const ns = (nc * 4 + nd) * K + nt, ng = g + cost;
          if (ng < gCost[ns]) { gCost[ns] = ng; parent[ns] = s; push(ng + h(nx, ny), ns); }
        }
      }
      return -1;
    }

    // 5. Route, shortest links first so direct links stay straight
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.classList.add('links');
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.innerHTML = '<defs>' +
      '<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#5b6475"/></marker>' +
      '<marker id="arr-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#1f5fd1"/></marker>' +
      '<marker id="arr-topic" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#b8860b"/></marker>' +
      '</defs>';
    const labels = [];
    links.sort((p, q) => (Math.abs(p.start.x - p.end.x) + Math.abs(p.start.y - p.end.y)) -
                         (Math.abs(q.start.x - q.end.x) + Math.abs(q.start.y - q.end.y)));
    links.forEach((l) => {
      const c0 = l.c0, c1 = l.c1;
      let pts = null;
      if (c0 && c1) {
        // At most MAX_TURNS turns when such a route exists, any route otherwise
        let s = route(c0, c1, SIDE_DIR[l.sa], (SIDE_DIR[l.sb] + 2) & 3, l.src, l.tgt, true);
        if (s < 0) s = route(c0, c1, SIDE_DIR[l.sa], (SIDE_DIR[l.sb] + 2) & 3, l.src, l.tgt, false);
        if (s >= 0) {
          const cells = [];
          for (let k = s; k >= 0; k = parent[k]) cells.push(Math.floor(k / K) >> 2);
          cells.reverse();
          l.routeCells = cells;
          cells.forEach((c, k) => {
            if (!useSrc[c]) { useSrc[c] = l.src; useTgt[c] = l.tgt; }
            const o = cells[k + 1] !== undefined ? cells[k + 1] : cells[k - 1];
            if (o !== undefined) useDir[c] |= Math.abs(o - c) === 1 ? 1 : 2;
            const cx = c % cols;
            [c - 1, c + 1, c - cols, c + cols].forEach((n) => {
              if (n < 0 || n >= N || (Math.abs((n % cols) - cx) > 1)) return;
              if (!nearSrc[n]) { nearSrc[n] = l.src; nearTgt[n] = l.tgt; }
            });
          });
          pts = cells.map((c) => ({ x: (c % cols) * G, y: ((c / cols) | 0) * G }));
          // Ports are on the grid line of the stub: the first and last runs are straight by construction
          if (l.sa === 'l' || l.sa === 'r') pts[0].y = l.start.y; else pts[0].x = l.start.x;
          const z = pts[pts.length - 1];
          if (l.sb === 'l' || l.sb === 'r') z.y = l.end.y; else z.x = l.end.x;
          pts = [{ ...l.start }, ...pts, { ...l.end }];
        }
      }
      if (!pts) { console.warn('[doc.js] no route for link', l.from.id, '→', l.to.id); pts = [l.start, l.end]; }
      l.cells = pts.length > 2 ? l.routeCells : [];
      // Drop collinear points
      const simple = pts.filter((p, i) => {
        if (i === 0 || i === pts.length - 1) return true;
        const a = pts[i - 1], b = pts[i + 1];
        return !((a.x === p.x && p.x === b.x) || (a.y === p.y && p.y === b.y));
      });
      const path = document.createElementNS(SVGNS, 'path');
      path.setAttribute('d', roundedPath(simple, 8));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', l.topic ? '#b8860b' : '#5b6475');
      path.setAttribute('stroke-width', '1.4');
      path.setAttribute('stroke-linejoin', 'round');
      if (l.topic) path.setAttribute('stroke-dasharray', '5 4');
      if (!l.plain) path.setAttribute('marker-end', l.topic ? 'url(#arr-topic)' : 'url(#arr)');
      // Cardinalities: just off each end, beside the line, on the side away from the next bend
      const card = (text, p0, p1) => {
        if (!text) return;
        const len = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1, ux = (p1.x - p0.x) / len, uy = (p1.y - p0.y) / len;
        const t = document.createElementNS(SVGNS, 'text');
        t.setAttribute('x', p0.x + ux * 16 + (uy ? 6 : 0)); t.setAttribute('y', p0.y + uy * 16 + (ux ? -6 : 4));
        t.setAttribute('text-anchor', ux < 0 ? 'end' : 'start');
        t.setAttribute('font-size', '11'); t.setAttribute('font-weight', '700'); t.setAttribute('fill', '#23324d');
        t.textContent = text;
        svg.appendChild(t);
      };
      card(l.cardA, simple[0], simple[1]);
      card(l.cardB, simple[simple.length - 1], simple[simple.length - 2]);
      path.classList.add('link');
      svg.appendChild(path);
      l.path = path;
      l.pts = simple;
    });

    // Collectors: links that reach the same side of a card in a Z (out, across, in) take the same
    // vertical, the one closest to that card, so they meet once in a single trunk instead of running
    // side by side. Same for links that leave the same side of a card: they share the vertical
    // closest to it and fork there. A vertical is moved only where it stays free of cards and of
    // unrelated links.
    const cellAt = (x, y) => Math.round(y / G) * cols + Math.round(x / G);
    // Who runs where, from the current polylines (rebuilt after each move, so that a moved link
    // frees its old lanes): cell -> [{ l, dir }], dir 1 horizontal, 2 vertical, 3 corner
    let owners = new Map();
    const walkPts = (pts, fn) => {
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], n = Math.round(Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) / G);
        for (let k = 0; k <= n; k++) fn(cellAt(a.x + (b.x - a.x) * k / (n || 1), a.y + (b.y - a.y) * k / (n || 1)), a.x === b.x ? 2 : 1);
      }
    };
    const buildOwners = () => {
      owners = new Map();
      links.forEach((l) => l.pts && walkPts(l.pts, (c, dir) => {
        if (!owners.has(c)) owners.set(c, []);
        const list = owners.get(c), e = list.find((x) => x.l === l);
        if (e) e.dir |= dir; else list.push({ l, dir });
      }));
    };
    // Cells already on the link's own polyline are kept as they are: only the new cells are checked
    const ownCells = (l) => { const set = new Set(); walkPts(l.pts, (c) => set.add(c)); return set; };
    const freeRun = (x0, y0, x1, y1, l, own) => {
      let ok = true;
      const dir = x0 === x1 ? 2 : 1;
      walkPts([{ x: x0, y: y0 }, { x: x1, y: y1 }], (c) => {
        if (!ok || own.has(c)) return;
        if (blocked[c]) { ok = false; return; }
        // An unrelated link may be crossed, not followed, and its corners are not touched
        (owners.get(c) || []).forEach((e) => {
          if (e.l !== l && e.l.src !== l.src && e.l.tgt !== l.tgt && (e.dir & dir)) ok = false;
        });
      });
      return ok;
    };
    const zLinks = links.filter((l) => !l.plain && l.pts && l.pts.length === 4 && l.sa === 'r' && l.sb === 'l' &&
      l.pts[1].x === l.pts[2].x && l.pts[0].y === l.pts[1].y && l.pts[2].y === l.pts[3].y);
    const moved = new Set();
    // A link can take the vertical X when X leaves room for its departure and its arrowhead, and
    // its three runs (out, across, in) stay clear of cards and unrelated links
    const ok = (l, X) => {
      if (X < l.start.x + DEPART || X > l.end.x - ARRIVE) return false;
      const own = ownCells(l);
      return freeRun(snap(l.start.x + DEPART), l.start.y, X, l.start.y, l, own) && freeRun(X, l.start.y, X, l.end.y, l, own) &&
        freeRun(X, l.end.y, snap(l.end.x - ARRIVE), l.end.y, l, own);
    };
    const take = (l, X) => {
      if (l.pts[1].x === X) return;
      l.pts[1] = { x: X, y: l.pts[1].y }; l.pts[2] = { x: X, y: l.pts[2].y };
      moved.add(l);
    };
    // Groups of links that share a target side (toTarget) or a source side: the vertical that most
    // of them can take, the closest to the shared card on a tie, then again with the links left
    const unify = (key, toTarget) => {
      const groups = new Map();
      zLinks.forEach((l) => { if (moved.has(l)) return; const k = key(l); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(l); });
      groups.forEach((g) => {
        let rest = g.slice();
        while (rest.length >= 2) {
          buildOwners();
          const lo = snap(Math.min(...rest.map((l) => l.start.x)) + DEPART), hi = snap(Math.max(...rest.map((l) => l.end.x)) - ARRIVE);
          let X = null, best = [];
          for (let x = toTarget ? hi : lo; toTarget ? x >= lo : x <= hi; x += toTarget ? -G : G) {
            const takers = rest.filter((l) => l.pts[1].x === x || ok(l, x));
            if (takers.length > best.length) { best = takers; X = x; }
          }
          if (best.length < 2) break;
          best.forEach((l) => take(l, X));
          rest = rest.filter((l) => !best.includes(l));
        }
      });
    };
    // A link that leaves on the row where other links arrive at a card further right would run along
    // their arrival: it turns as early as it can instead, so that the row stays free for the collector
    zLinks.forEach((l) => {
      const blocksRow = links.some((m) => m !== l && m.tgt !== l.tgt && m.end.y === l.start.y && m.end.x > l.pts[1].x);
      if (!blocksRow) return;
      buildOwners();
      for (let x = snap(l.start.x + DEPART); x < l.pts[1].x; x += G) if (ok(l, x)) { take(l, x); break; }
    });
    moved.clear();
    unify((l) => l.tgt + ':' + l.end.y, true);
    unify((l) => l.src + ':' + l.start.y, false);
    zLinks.forEach((l) => l.path.setAttribute('d', roundedPath(l.pts, 8)));

    // Junction dots where links from the same card fork off their shared trunk. At each cell, every link
    // has the set of sides it uses (towards its previous and next cells). Two links make a junction
    // there when they share a side and differ on another: a T, a merge or a fork. Two links that
    // merely cross share no side, two links that run or turn together use the same sides: no dot.
    const cellSides = new Map(); // cell -> [{ i, mask }]
    links.forEach((l, i) => {
      const cs = l.cells || [];
      cs.forEach((c, k) => {
        let mask = 0;
        [cs[k - 1], cs[k + 1]].forEach((o) => {
          if (o === undefined) return;
          mask |= o === c + 1 ? 1 : o === c - 1 ? 4 : o > c ? 2 : 8;
        });
        if (!cellSides.has(c)) cellSides.set(c, []);
        cellSides.get(c).push({ i, mask });
      });
    });
    const dots = new Map(); // cell -> link indices meeting there
    cellSides.forEach((list, c) => {
      for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
        const p = list[a], q = list[b];
        if (!(p.mask & q.mask) || p.mask === q.mask) continue;
        if (links[p.i].src !== links[q.i].src) continue; // forks only: merges into a target get no dot
        if (!dots.has(c)) dots.set(c, new Set());
        dots.get(c).add(p.i).add(q.i);
      }
    });
    if (JUNCTION_DOTS) dots.forEach((meet, c) => {
      const dot = document.createElementNS(SVGNS, 'circle');
      dot.setAttribute('cx', (c % cols) * G); dot.setAttribute('cy', ((c / cols) | 0) * G);
      dot.setAttribute('r', '3'); dot.setAttribute('fill', '#5b6475');
      dot.classList.add('dot');
      dot.links = [...meet];
      svg.appendChild(dot);
    });

    // 6. Labels: a pill sitting on its own link, where no card, badge, title, other link or other
    //    label passes. When no such place exists, a numbered pill goes on the link and the text goes
    //    to a legend under the diagram. A label never floats near a line it does not belong to.
    diagram.prepend(svg);
    const segsOf = (l) => l.pts.slice(0, -1).map((a, i) => ({ a, b: l.pts[i + 1] }));
    const segHitsBox = (sg, bx) => {
      const x0 = Math.min(sg.a.x, sg.b.x), x1 = Math.max(sg.a.x, sg.b.x), y0 = Math.min(sg.a.y, sg.b.y), y1 = Math.max(sg.a.y, sg.b.y);
      return x0 <= bx.x1 && x1 >= bx.x0 && y0 <= bx.y1 && y1 >= bx.y0;
    };
    const placed = [];
    const legend = [];
    const free = (l, bx) => !hitsCard(bx.x0, bx.y0, bx.x1, bx.y1) &&
      !placed.some((p) => bx.x0 < p.x1 + 4 && bx.x1 > p.x0 - 4 && bx.y0 < p.y1 + 4 && bx.y1 > p.y0 - 4) &&
      !links.some((o) => o !== l && segsOf(o).some((sg) => segHitsBox(sg, bx))) &&
      ![...dots].some((c) => { const x = (c % cols) * G, y = ((c / cols) | 0) * G; return x > bx.x0 - 4 && x < bx.x1 + 4 && y > bx.y0 - 4 && y < bx.y1 + 4; });
    // Candidate centres along the link, away from its start and from its arrowhead
    const findSpot = (l, w, h) => {
      const segs = segsOf(l), last = segs.length - 1;
      const order = segs.map((sg, i) => ({ sg, i, len: Math.hypot(sg.b.x - sg.a.x, sg.b.y - sg.a.y) })).sort((p, q) => q.len - p.len);
      for (const { sg, i, len } of order) {
        const horiz = sg.a.y === sg.b.y, need = (horiz ? w : h) + 8;
        const skipA = i === 0 ? 10 : 6, skipB = i === last ? 16 : 6;
        if (len < need + skipA + skipB) continue;
        for (const t of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) {
          const d = Math.min(len - skipB - need / 2, Math.max(skipA + need / 2, len * t));
          const cx = sg.a.x + (sg.b.x - sg.a.x) * (d / len), cy = sg.a.y + (sg.b.y - sg.a.y) * (d / len);
          const bx = { x0: cx - w / 2, x1: cx + w / 2, y0: cy - h / 2, y1: cy + h / 2 };
          if (free(l, bx)) return { cx, cy, bx };
        }
      }
      return null;
    };
    const pill = (cx, cy, w, h, text, color, l) => {
      const r = document.createElementNS(SVGNS, 'rect');
      r.setAttribute('x', cx - w / 2); r.setAttribute('y', cy - h / 2);
      r.setAttribute('width', w); r.setAttribute('height', h); r.setAttribute('rx', h / 2);
      r.setAttribute('fill', '#fff'); r.setAttribute('stroke', color); r.setAttribute('stroke-width', '1');
      const t = document.createElementNS(SVGNS, 'text');
      t.setAttribute('x', cx); t.setAttribute('y', cy + 4);
      t.setAttribute('text-anchor', 'middle'); t.setAttribute('font-size', '11'); t.setAttribute('fill', '#3a4150');
      t.textContent = text;
      r.classList.add('lbl'); t.classList.add('lbl');
      l.pills = (l.pills || []).concat(r, t);
      svg.appendChild(r); svg.appendChild(t);
    };
    links.filter((l) => l.label).forEach((l) => {
      const text = l.label.replace(/_/g, ' ');
      const color = l.topic ? '#b8860b' : '#5b6475';
      const probe = document.createElementNS(SVGNS, 'text');
      probe.setAttribute('font-size', '11'); probe.textContent = text; svg.appendChild(probe);
      const w = Math.ceil(probe.getComputedTextLength()) + 14, h = 18;
      probe.remove();
      let spot = findSpot(l, w, h);
      if (spot) { placed.push(spot.bx); pill(spot.cx, spot.cy, w, h, text, color, l); return; }
      const n = String(legend.length + 1);
      spot = findSpot(l, 18, 18);
      if (!spot) { const sg = segsOf(l)[0]; spot = { cx: (sg.a.x + sg.b.x) / 2, cy: (sg.a.y + sg.b.y) / 2 }; spot.bx = { x0: spot.cx - 9, x1: spot.cx + 9, y0: spot.cy - 9, y1: spot.cy + 9 }; }
      placed.push(spot.bx); pill(spot.cx, spot.cy, 18, 18, n, color, l);
      legend.push({ n, text, from: nodeName(l.from), to: nodeName(l.to) });
    });
    diagram.nextElementSibling && diagram.nextElementSibling.classList.contains('diagram-legend') && diagram.nextElementSibling.remove();
    if (legend.length) {
      const lg = document.createElement('div');
      lg.className = 'diagram-legend';
      lg.innerHTML = legend.map((e) => `<span><b>${e.n}</b> ${e.text} <i>(${e.from} → ${e.to})</i></span>`).join('');
      diagram.after(lg);
    }
    if (diagram.dataset.mode === 'curve') curveLinks(links);
    diagram.linksDrawn = links;
    diagram.dotsDrawn = $$('svg.links circle.dot', diagram);
    highlight(diagram);

  }

  // Reading aid for dense diagrams: hovering a card (or tapping it, which pins it) highlights the whole
  // chain it belongs to, its callers upstream and what it calls downstream, and fades the rest.
  function highlight(diagram) {
    const show = (node) => {
      const links = diagram.linksDrawn || [];
      const on = new Set(), nodes = new Set([node]);
      const walk = (start, fwd) => {
        const todo = [start], seen = new Set([start]);
        while (todo.length) {
          const n = todo.pop();
          links.forEach((l, i) => {
            const [a, b] = fwd ? [l.from, l.to] : [l.to, l.from];
            if (a !== n) return;
            on.add(i); nodes.add(b);
            if (!seen.has(b)) { seen.add(b); todo.push(b); }
          });
        }
      };
      walk(node, true); walk(node, false);
      diagram.classList.add('hl');
      $$('.node', diagram).forEach((n) => n.classList.toggle('on', nodes.has(n)));
      links.forEach((l, i) => [l.path, ...(l.pills || [])].forEach((e) => e && e.classList.toggle('on', on.has(i))));
      (diagram.dotsDrawn || []).forEach((d) => d.classList.toggle('on', d.links.filter((i) => on.has(i)).length > 1));
      return { nodes, on };
    };
    const clear = () => {
      diagram.classList.remove('hl');
      $$('.on', diagram).forEach((e) => e.classList.remove('on'));
    };
    if (diagram.pinned && diagram.contains(diagram.pinned)) show(diagram.pinned);
    if (diagram.hlBound) return;
    diagram.hlBound = true;
    // The chain stays lit while the pointer is on its card, and goes off as soon as it leaves it
    let current = null;
    diagram.addEventListener('mouseover', (e) => {
      if (diagram.pinned) return;
      const n = e.target.closest('.node');
      if (n === current) return;
      current = n;
      if (n) show(n); else clear();
    });
    diagram.addEventListener('mouseleave', () => { current = null; if (!diagram.pinned) clear(); });
    diagram.addEventListener('click', (e) => {
      if (e.target.closest('a') || diagram.classList.contains('focus') || !diagram.querySelector('.chain')) return;
      const n = e.target.closest('.node');
      if (!n) return;
      diagram.pinned = n;
      const chain = show(n);
      focusChain(diagram, n, chain, () => { diagram.pinned = null; current = null; clear(); });
    });
  }

  // Reorders the cards of each column to avoid crossings (barycentre heuristic): a card moves to the
  // mean rank of the cards it is linked to in the columns already sorted, sweeping left to right and
  // back. Used by the focus view, where the order of the author does not matter any more.
  function untangle(view) {
    const cols = $$('.chain .col', view).map((col) => ({ col, items: $$(':scope > .node', col) }));
    const colOf = new Map(), neigh = new Map();
    cols.forEach((c, k) => c.items.forEach((n) => { colOf.set(n, k); neigh.set(n, []); }));
    cols.forEach((c) => c.items.forEach((n) => (n.dataset.links || '').split(/\s+/).forEach((w) => {
      const to = document.getElementById(w.split('|')[0]);
      if (!to || !neigh.has(to)) return;
      neigh.get(n).push(to); neigh.get(to).push(n);
    })));
    const rank = (n) => cols[colOf.get(n)].items.indexOf(n) / Math.max(1, cols[colOf.get(n)].items.length - 1);
    const sortCol = (k, side) => {
      const c = cols[k];
      const bary = new Map(c.items.map((n) => {
        const ref = neigh.get(n).filter((m) => side < 0 ? colOf.get(m) < k : colOf.get(m) > k);
        return [n, ref.length ? ref.reduce((s, m) => s + rank(m), 0) / ref.length : rank(n)];
      }));
      c.items.sort((p, q) => bary.get(p) - bary.get(q));
    };
    for (let pass = 0; pass < 4; pass++) {
      for (let k = 1; k < cols.length; k++) sortCol(k, -1);
      for (let k = cols.length - 2; k >= 0; k--) sortCol(k, 1);
    }
    cols.forEach((c) => c.items.forEach((n) => c.col.appendChild(n)));
  }

  // Focus overlay, shared by the focus view of a chain (focusChain) and the page lists of the sitemap
  // (sitemapFamilies): a panel centred on the screen over a dimmed page, closed by Escape, the close
  // button or a click that keep(e) does not keep (by default: outside the panel). Keyboard: the close
  // button takes the focus, Tab stays in the panel, the focus goes back to the trigger on close.
  // Timing of the focus view, opening and closing alike: short, fast start (ease-out)
  const FOCUS_MS = 250, FOCUS_EASE = 'cubic-bezier(0, 0, .2, 1)';
  // onCloseStart: runs when closing starts, to play the opening backwards during FOCUS_MS
  function focusOverlay(content, { onClose, onCloseStart, keep = (e) => e.target.closest('.focus-panel'), cls = '', label = '' } = {}) {
    const trigger = document.activeElement;
    const overlay = document.createElement('div');
    overlay.className = 'focus-overlay' + (cls ? ' ' + cls : '');
    overlay.innerHTML = '<div class="focus-panel" role="dialog" aria-modal="true"><button type="button" class="focus-close" aria-label="' + esc(t('doc.close')) + '">×</button></div>';
    const panel = overlay.firstChild;
    if (label) panel.setAttribute('aria-label', label);
    if (typeof content === 'string') panel.insertAdjacentHTML('beforeend', content); else panel.appendChild(content);
    document.body.appendChild(overlay);
    let closing = false;
    const close = () => {
      if (closing) return;
      closing = true;
      document.removeEventListener('keydown', onKey);
      overlay.classList.remove('open');
      if (onCloseStart) onCloseStart();
      setTimeout(() => {
        overlay.remove();
        if (trigger && trigger !== document.body && trigger.focus) trigger.focus({ preventScroll: true });
        if (onClose) onClose();
      }, FOCUS_MS);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      const f = $$('a[href], button:not([disabled])', panel);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('click', (e) => { if (e.target.closest('.focus-close') || !keep(e)) close(); });
    $('.focus-close', panel).focus({ preventScroll: true });
    return { overlay, panel, close };
  }

  // Focus view: a click on a card opens its chain alone in a panel centred on the screen. The cards
  // fly from their place in the diagram to their place in the panel, then the links are drawn.
  // Escape, a click outside the cards or the close button brings the diagram back.
  function focusChain(diagram, start, { nodes, on }, onClose) {
    const links = diagram.linksDrawn || [];
    const idOf = new Map();
    let k = 0;
    nodes.forEach((n) => idOf.set(n, 'focus-' + (n.id || 'n' + k++)));
    const clones = [];
    const copy = (el) => {
      if (el.classList.contains('node')) {
        if (!nodes.has(el)) return null;
        const c = el.cloneNode(true);
        c.id = idOf.get(el);
        c.classList.remove('on');
        c.style.marginTop = '';
        const out = links.filter((l, i) => on.has(i) && l.from === el)
          .map((l) => idOf.get(l.to) + (l.label ? '|' + l.label.replace(/\s+/g, '_') : ''));
        if (out.length) c.dataset.links = out.join(' '); else delete c.dataset.links;
        if (el === start) c.classList.add('start');
        clones.push([el, c]);
        return c;
      }
      if (el.classList.contains('c-title') || el.classList.contains('col-title')) return el.cloneNode(true);
      const shell = el.cloneNode(false);
      let kept = false;
      [...el.children].forEach((child) => {
        const c = copy(child);
        if (!c) return;
        shell.appendChild(c);
        if (!c.classList.contains('c-title') && !c.classList.contains('col-title')) kept = true;
      });
      return kept ? shell : null;
    };
    const chain = copy(diagram.querySelector('.chain'));
    if (!chain) return;
    const modes = document.querySelector('.diagram-modes');
    // a click on a card or on the mode switch keeps the view open, any other click closes it
    // closing: the cards fly back to their place in the diagram
    const back = () => {
      view.classList.remove('drawn');
      panel.classList.add('flying');
      clones.forEach(([orig, c]) => {
        const a = orig.getBoundingClientRect(), b = c.getBoundingClientRect();
        c.style.transition = `transform ${FOCUS_MS}ms ${FOCUS_EASE}`;
        c.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px)`;
      });
    };
    const { overlay, panel } = focusOverlay((modes ? modes.outerHTML : '') + '<div class="diagram focus"></div>',
      { onClose, onCloseStart: () => back(), keep: (e) => e.target.closest('.node') || e.target.closest('.diagram-modes'), label: t('doc.chain.aria', { name: (start.textContent || '').trim() }) });
    const view = overlay.querySelector('.diagram');
    view.appendChild(chain);
    if (diagram.dataset.mode) view.dataset.mode = diagram.dataset.mode;
    untangle(view);
    layoutChain(view);
    // FLIP: start each clone where its original card is, then let it move to its place
    clones.forEach(([orig, c]) => {
      const a = orig.getBoundingClientRect(), b = c.getBoundingClientRect();
      c.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px)`;
    });
    panel.classList.add('flying');
    overlay.getBoundingClientRect();
    overlay.classList.add('open');
    clones.forEach(([, c]) => { c.style.transition = `transform ${FOCUS_MS}ms ${FOCUS_EASE}`; c.style.transform = ''; });
    setTimeout(() => { if (!overlay.classList.contains('open')) return; clones.forEach(([, c]) => { c.style.transition = ''; }); panel.classList.remove('flying'); drawLinks(view); view.classList.add('drawn'); }, FOCUS_MS + 20);
    overlay.addEventListener('click', (e) => {
      // The mode switch of the panel redraws the panel only: the diagram behind keeps its mode
      const m = e.target.closest('.diagram-modes button');
      if (!m) return;
      view.dataset.mode = m.dataset.mode;
      $$('.diagram-modes button', overlay).forEach((x) => x.setAttribute('aria-pressed', String(x === m)));
      drawLinks(view);
    });
  }

  // Sitemap of the detailed design: the title of a family of pages (.st-stack) opens, in the focus overlay,
  // the list of its pages that the generator carries hidden in the card (.st-pages). The panel grows from
  // the card, with the timing of the focus view of a chain.
  function sitemapFamilies() {
    $$('.sitemap-tree .st-node.st-stack').forEach((node) => {
      const a = $('a.st-title', node), pages = $('.st-pages', node);
      if (!a || !pages) return;
      a.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
        e.preventDefault();
        const branch = getComputedStyle(node).getPropertyValue('--st-c');
        // The panel keeps its final size and layout: it is moved onto the card and clipped to the card's size,
        // then moves to its place while the clip opens. Its content (title first) is visible and undistorted
        // from the first frame. Closing plays it backwards.
        const onCard = () => {
          panel.style.transition = 'none';
          const keep = [panel.style.transform, panel.style.clipPath];
          panel.style.transform = ''; panel.style.clipPath = '';
          const f = node.getBoundingClientRect(), t = panel.getBoundingClientRect();
          panel.style.transform = keep[0]; panel.style.clipPath = keep[1];
          return { transform: `translate(${f.left - t.left}px, ${f.top - t.top}px)`,
            clip: `inset(0 ${Math.max(0, t.width - f.width)}px ${Math.max(0, t.height - f.height)}px 0 round 10px)` };
        };
        const go = (st) => {
          panel.getBoundingClientRect();
          panel.style.transition = `transform ${FOCUS_MS}ms ${FOCUS_EASE}, clip-path ${FOCUS_MS}ms ${FOCUS_EASE}`;
          panel.style.transform = st.transform; panel.style.clipPath = st.clip;
        };
        const { overlay, panel } = focusOverlay(`<h2 class="st-pages-title">${pages.dataset.title}</h2>${pages.innerHTML}`,
          { cls: 'st-zoom', label: pages.dataset.title, onCloseStart: () => go(onCard()) });
        panel.style.setProperty('--st-c', branch);
        const start = onCard();
        panel.style.transform = start.transform; panel.style.clipPath = start.clip;
        overlay.getBoundingClientRect();
        overlay.classList.add('open');
        go({ transform: 'translate(0, 0)', clip: 'inset(0 0 0 0 round 12px)' });
      });
    });
  }

  // Orthogonal polyline with rounded corners
  function roundedPath(pts, radius) {
    if (pts.length < 3) return pts.map((p, i) => (i ? 'L' : 'M') + p.x + ',' + p.y).join(' ');
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[i - 1], p = pts[i], b = pts[i + 1];
      const r = Math.min(radius, Math.hypot(p.x - a.x, p.y - a.y) / 2, Math.hypot(b.x - p.x, b.y - p.y) / 2);
      const ux = Math.sign(p.x - a.x), uy = Math.sign(p.y - a.y), vx = Math.sign(b.x - p.x), vy = Math.sign(b.y - p.y);
      d += ` L${p.x - ux * r},${p.y - uy * r} Q${p.x},${p.y} ${p.x + vx * r},${p.y + vy * r}`;
    }
    const z = pts[pts.length - 1];
    return d + ` L${z.x},${z.y}`;
  }

  // Vertical placement of the cards of a chain (.chain .col): each card moves towards the mean height
  // of the cards it is linked to, in its column order and with the column gap kept between cards.
  // A card linked to a single card ends up level with it, so the link is a straight line. Cards that
  // would overlap are placed as a block centred on their wishes (pool adjacent violators).
  function layoutChain(diagram) {
    const cols = $$('.chain .col', diagram);
    if (!cols.length) return;
    const nodes = $$('.chain .col > .node', diagram).filter(shown);
    nodes.forEach((n) => { n.style.marginTop = ''; });
    const index = new Map(nodes.map((n, i) => [n, i]));
    const neigh = nodes.map(() => []);
    nodes.forEach((n, i) => (n.dataset.links || '').split(/\s+/).forEach((w) => {
      const to = document.getElementById(w.split('|')[0]);
      const j = to && index.get(to);
      if (j == null || j === i) return;
      neigh[i].push(j); neigh[j].push(i);
    }));
    const h = nodes.map((n) => n.getBoundingClientRect().height);
    const y = nodes.map((n) => n.getBoundingClientRect().top);
    const columns = cols.map((col) => {
      const items = $$(':scope > .node', col).filter(shown).map((n) => index.get(n));
      const title = col.querySelector(':scope > .col-title');
      const gap = parseFloat(getComputedStyle(col).rowGap) || 0;
      const base = (title ? title.getBoundingClientRect().bottom : col.getBoundingClientRect().top) + gap;
      return { items, gap, base };
    });
    const colOf = [];
    columns.forEach((c, k) => c.items.forEach((i) => { colOf[i] = k; }));
    const centre = (i) => y[i] + h[i] / 2;
    for (let pass = 0; pass < 12; pass++) {
      columns.forEach(({ items, gap, base }) => {
        // Wished top of each card, then blocks of touching cards centred on the mean of their wishes
        const blocks = [];
        items.forEach((i) => {
          // The chain reads from left to right: a card follows its callers (cards of the columns on its
          // left) when it has some, so a card called once sits level with its caller
          const left = neigh[i].filter((j) => colOf[j] < colOf[i]);
          const ref = left.length ? left : neigh[i];
          const wish = ref.length ? ref.reduce((s, j) => s + centre(j), 0) / ref.length - h[i] / 2 : y[i];
          let b = { items: [i], height: h[i], sum: wish, n: 1 };
          b.top = b.sum / b.n;
          while (blocks.length) {
            const prev = blocks[blocks.length - 1];
            if (prev.top + prev.height + gap <= b.top) break;
            blocks.pop();
            // Each card's wish expressed as a wish for the block top
            const offset = prev.height + gap;
            b = { items: prev.items.concat(b.items), height: offset + b.height, sum: prev.sum + b.sum - b.n * offset, n: prev.n + b.n };
            b.top = b.sum / b.n;
          }
          blocks.push(b);
        });
        // The first block never goes above the column start
        let floor = base;
        blocks.forEach((b) => {
          let t = Math.max(b.top, floor);
          b.items.forEach((i) => { y[i] = t; t += h[i] + gap; });
          floor = t;
        });
      });
    }
    // A card level with a card further right that it is not linked to would send its links along
    // that card's arrival row: it moves one routing lane down (or up), so the two rows stay apart
    const linked = (i, j) => neigh[i].includes(j);
    columns.forEach(({ items, gap }, k) => items.forEach((i, r) => {
      const j = nodes.findIndex((_, m) => colOf[m] > k + 1 && !linked(i, m) && Math.abs(centre(i) - centre(m)) < 2 * G);
      if (j < 0) return;
      // Move this card, or else the other one, by the distance that puts two lanes between them
      const room = (n, dist) => {
        const col = columns[colOf[n]], at = col.items.indexOf(n), next = col.items[at + Math.sign(dist)];
        if (next === undefined) return true;
        return dist > 0 ? y[next] - (y[n] + h[n]) - col.gap >= dist : y[n] - (y[next] + h[next]) - col.gap >= -dist;
      };
      const d = centre(i) >= centre(j) ? 2 * G - (centre(i) - centre(j)) : -(2 * G - (centre(j) - centre(i)));
      if (room(i, d)) y[i] += d;
      else if (room(j, -d)) y[j] -= d;
    }));
    // Write the result as top margins. Each card centre goes on the routing grid (the one drawLinks
    // snaps ports to), so that level cards share their port line and the link is straight.
    const box = diagram.getBoundingClientRect();
    const oy = box.top - diagram.scrollTop;
    columns.forEach(({ items, gap, base }) => {
      let prev = base - gap;
      items.forEach((i) => {
        const onGrid = (v) => oy + Math.round((v + h[i] / 2 - oy) / G) * G - h[i] / 2;
        let t = onGrid(y[i]);
        // A card pushed by the one above stays at the minimum gap: snapping it as well would make
        // the drift add up down a packed column
        if (t < prev + gap) t = prev + gap;
        nodes[i].style.marginTop = Math.max(0, t - prev - gap) + 'px';
        prev = t + h[i];
      });
    });
  }

  // Drawing modes of a chain diagram, chosen above it and remembered by the browser: right angles
  // (routed around the cards) or curves (Bézier, from port to port, over the cards if need be).
  const MODES = [['curve', 'doc.mode.curve'], ['ortho', 'doc.mode.ortho']];
  function modeSwitch(list, redraw) {
    let saved = null;
    try { saved = localStorage.getItem('doc-diagram-mode'); } catch (e) { /* storage unavailable */ }
    list.forEach((d) => {
      d.dataset.mode = MODES.some(([m]) => m === saved) ? saved : 'curve';
      const bar = document.createElement('div');
      bar.className = 'diagram-modes';
      bar.setAttribute('role', 'group');
      bar.setAttribute('aria-label', t('doc.mode.aria'));
      bar.innerHTML = MODES.map(([m, key]) => `<button type="button" data-mode="${m}">${esc(t(key))}</button>`).join('');
      d.before(bar);
    });
    const sync = () => $$('.diagram-modes button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === list[0].dataset.mode)));
    document.addEventListener('click', (e) => {
      const b = e.target.closest('.diagram-modes button');
      if (!b) return;
      list.forEach((d) => { d.dataset.mode = b.dataset.mode; });
      try { localStorage.setItem('doc-diagram-mode', b.dataset.mode); } catch (err) { /* storage unavailable */ }
      sync();
      redraw();
    });
    sync();
  }

  // Curve mode: each link becomes a cubic Bézier between its two ports, leaving and entering along
  // the side it uses; its label pill moves to the middle of the curve
  function curveLinks(links) {
    const tangent = { r: [1, 0], l: [-1, 0], b: [0, 1], t: [0, -1] };
    links.forEach((l) => {
      if (!l.path || l.plain) return;
      const a = l.start, b = l.end, [ax, ay] = tangent[l.sa], [bx, by] = tangent[l.sb];
      const k = Math.max(40, (ax || bx ? Math.abs(b.x - a.x) : Math.abs(b.y - a.y)) / 2);
      const c1 = { x: a.x + ax * k, y: a.y + ay * k }, c2 = { x: b.x + bx * k, y: b.y + by * k };
      l.path.setAttribute('d', `M${a.x},${a.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${b.x},${b.y}`);
      const mid = { x: (a.x + 3 * c1.x + 3 * c2.x + b.x) / 8, y: (a.y + 3 * c1.y + 3 * c2.y + b.y) / 8 };
      (l.pills || []).forEach((e) => {
        if (e.tagName === 'rect') {
          const w = +e.getAttribute('width'), h = +e.getAttribute('height');
          e.setAttribute('x', mid.x - w / 2); e.setAttribute('y', mid.y - h / 2);
        } else { e.setAttribute('x', mid.x); e.setAttribute('y', mid.y + 4); }
      });
    });
  }

  // Release filter: <div class="release-filter" data-releases="MVP R2 R3"></div> under the first panel.
  // Every element of the page that carries data-release (cards, table rows, list items) belongs to
  // that release; a card of an earlier release that a later one changes carries data-adapted="R2 R3".
  // - "Whole project": everything, each card with its release tag and its own badge.
  // - A release: its own cards (badge TODO), plus, as context, the cards of earlier releases that
  //   they are linked to or that the release adapts: TO UPDATE when the release adapts them, DONE
  //   otherwise. Rows and other elements show for their own release only.
  // The choice can come from the URL (?release=R2), and is kept there on a web server.
  function releaseFilter(redraw) {
    const bar = document.querySelector('.release-filter');
    if (!bar) return;
    const rel = (bar.dataset.releases || '').split(/\s+/).filter(Boolean);
    const options = [['all', t('doc.release.all')], ...rel.map((r) => [r, r])];
    bar.innerHTML = `<span class="rf-label">${esc(t('doc.release.label'))}</span>` +
      options.map(([v, label]) => `<button type="button" data-release="${v}">${esc(label)}</button>`).join('') +
      `<span class="rf-hint">${esc(t('doc.release.hint'))}</span>`;
    const cards = $$('.chain .node');
    cards.forEach((n) => { if (n.dataset.badge && !n.dataset.badgeOwn) n.dataset.badgeOwn = n.dataset.badge; });
    // Links in both directions, by card
    const near = new Map(cards.map((n) => [n, new Set()]));
    cards.forEach((n) => (n.dataset.links || '').split(/\s+/).forEach((w) => {
      const to = document.getElementById(w.split('|')[0]);
      if (to && near.has(to)) { near.get(n).add(to); near.get(to).add(n); }
    }));
    const apply = (v) => {
      document.body.dataset.release = v;
      $$('button', bar).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.release === v)));
      if (v === 'all') {
        $$('.out-of-release').forEach((el) => el.classList.remove('out-of-release'));
        cards.forEach((n) => { if (n.dataset.badgeOwn) n.dataset.badge = n.dataset.badgeOwn; else delete n.dataset.badge; });
        return;
      }
      const adapts = (n) => (n.dataset.adapted || '').split(/\s+/).includes(v);
      const own = new Set(cards.filter((n) => n.dataset.release === v));
      const context = new Set(cards.filter((n) => !own.has(n) && rel.indexOf(n.dataset.release) < rel.indexOf(v) && adapts(n)));
      own.forEach((n) => near.get(n).forEach((m) => {
        if (!own.has(m) && rel.indexOf(m.dataset.release) < rel.indexOf(v) && !m.classList.contains('attention')) context.add(m);
      }));
      cards.forEach((n) => {
        const show = own.has(n) || context.has(n);
        n.classList.toggle('out-of-release', !show);
        if (n.classList.contains('external')) return; // a system outside the organisation is never built here
        if (own.has(n)) n.dataset.badge = 'todo';
        else if (context.has(n)) n.dataset.badge = adapts(n) ? 'update' : 'done';
      });
      $$('[data-release]').forEach((el) => {
        if (el.closest('.release-filter') || el.classList.contains('node')) return;
        el.classList.toggle('out-of-release', el.dataset.release !== v);
      });
    };
    // Counters: <div class="kpi" data-count="endpoint"> counts the cards of that type shown in the
    // chain, with their split by release (whole project) or by badge (a release)
    const count = (v) => $$('.kpi[data-count]').forEach((k) => {
      const list = cards.filter((n) => n.classList.contains(k.dataset.count) && !n.classList.contains('out-of-release'));
      const by = (key) => { const m = new Map(); list.forEach((n) => m.set(key(n), (m.get(key(n)) || 0) + 1)); return m; };
      let sub;
      if (v === 'all') sub = [...by((n) => n.dataset.release || '').entries()].sort((a, b) => rel.indexOf(a[0]) - rel.indexOf(b[0])).map(([r, c]) => `${r} ${c}`).join(', ');
      else {
        const m = by((n) => n.dataset.badge);
        sub = ['todo', 'update', 'done'].filter((b) => m.get(b)).map((b) => t('doc.release.' + b, { n: m.get(b) })).join(', ') || t('doc.release.none');
      }
      k.querySelector('.value').textContent = list.length;
      k.querySelector('.sub').textContent = sub;
    });
    const fromUrl = new URLSearchParams(location.search).get('release');
    const start = options.some(([v]) => v === fromUrl) ? fromUrl : 'all';
    apply(start); count(start);
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      apply(b.dataset.release); count(b.dataset.release);
      if (location.protocol !== 'file:') try { const u = new URL(location.href); u.searchParams.set('release', b.dataset.release); history.replaceState(null, '', u); } catch (err) { /* no history */ }
      redraw();
    });
  }

  // Links from the cards of a chain diagram to the detailed design. The page loads detailed/xref.js,
  // generated by team/scripts/detailed-pages.mjs from openapi.yaml, which declares window.DOC_XREF:
  // { base, items: { 'EP-08': { href, title } }, schemas: { 'EP-08': [{ name, dir: in|out, status, href }] } }.
  // The id written in a card becomes a link to its page (an id without a page stays text). An endpoint
  // that exchanges schemas gets a "{ }" chip: one schema opens its page, several open a small menu,
  // "↑ Sent" (request body) then "↓ Received" (success response). The error schema is never listed. The id
  // shows its title on hover (data-tip, see objTips()).
  function xrefs() {
    const x = window.DOC_XREF;
    if (!x || !x.items) return;
    $$('.chain .node[id]').forEach((n) => {
      const it = x.items[n.id];
      if (!it || $('a.xref', n)) return;
      const walk = document.createTreeWalker(n, NodeFilter.SHOW_TEXT);
      for (let t; (t = walk.nextNode());) {
        const i = t.data.indexOf(n.id);
        if (i < 0) continue;
        const idText = t.splitText(i);
        idText.splitText(n.id.length);
        const a = document.createElement('a');
        a.className = 'xref'; a.href = x.base + it.href; a.dataset.tip = it.title; a.textContent = n.id;
        idText.replaceWith(a);
        break;
      }
      const cs = (x.schemas || {})[n.id];
      if (!cs || !cs.length) return;
      const chip = document.createElement('a');
      chip.className = 'schema-link';
      chip.href = x.base + cs[0].href;
      chip.textContent = '{ }';
      const names = cs.map((c) => t(c.dir === 'in' ? 'doc.schemas.sends' : 'doc.schemas.receives', { name: c.name })).join(', ');
      chip.setAttribute('aria-label', t('doc.schemas.aria', { id: n.id, list: names }));
      chip.dataset.tip = t('doc.schemas.tip', { list: cs.map((c) => (c.dir === 'in' ? '↑ ' : '↓ ') + c.name).join(', ') });
      if (cs.length > 1) chip.dataset.schemas = n.id;
      n.append(' ', chip);
    });
    let menu = null;
    const close = () => { if (menu) { menu.remove(); menu = null; } };
    document.addEventListener('click', (e) => {
      const chip = e.target.closest('a.schema-link[data-schemas]');
      if (!chip) { if (menu && !menu.contains(e.target)) close(); return; }
      e.preventDefault();
      e.stopPropagation();
      if (menu && menu.dataset.for === chip.dataset.schemas) { close(); return; }
      close();
      const cs = x.schemas[chip.dataset.schemas];
      menu = document.createElement('div');
      menu.className = 'xref-menu';
      menu.dataset.for = chip.dataset.schemas;
      menu.setAttribute('role', 'menu');
      const group = (dir, title) => {
        const list = cs.filter((c) => c.dir === dir);
        return list.length ? `<div class="xm-group">${title}</div>` + list.map((c) =>
          `<a role="menuitem" href="${x.base + c.href}"><code>${c.name}</code>${c.status ? ` <small>${c.status}</small>` : ''}</a>`).join('') : '';
      };
      menu.innerHTML = `<div class="xm-head">${esc(t('doc.schemas.head', { id: chip.dataset.schemas }))}</div>` +
        group('in', `<span class="sc-dir" aria-hidden="true">↑</span> ${esc(t('doc.schemas.in'))}`) +
        group('out', `<span class="sc-dir" aria-hidden="true">↓</span> ${esc(t('doc.schemas.out'))}`);
      document.body.appendChild(menu);
      const r = chip.getBoundingClientRect();
      menu.style.left = Math.max(8, Math.min(r.left, innerWidth - menu.offsetWidth - 8)) + 'px';
      menu.style.top = (r.bottom + 6 + menu.offsetHeight > innerHeight ? r.top - menu.offsetHeight - 6 : r.bottom + 6) + 'px';
      $('a', menu).focus();
    }, true);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    addEventListener('scroll', close, true);
    addEventListener('resize', close);
  }

  // A link whose text is an EP, EN or PROC id and which points to its page of the detailed design shows on
  // hover (and on focus) what it is: verb, path and role of an endpoint, name of an entity or a process.
  // Titles come from detailed/xref.js, loaded from the folder of the first such link when the page does
  // not load it itself (pages of the detailed design, stories, macro). A link with its own data-tip keeps it.
  function objTips() {
    const RE = /(?:^|\/)(?:endpoints|entities|processes)\/((?:EP|EN|PROC)-\d+)\.html$|^((?:EP|EN|PROC)-\d+)\.html$/;
    const links = $$('a[href]').map((a) => {
      const m = (a.getAttribute('href') || '').split('#')[0].match(RE);
      const id = m && (m[1] || m[2]);
      return id && a.textContent.trim() === id && !a.dataset.tip ? { a, id } : null;
    }).filter(Boolean);
    if (!links.length) return;
    const apply = () => {
      const items = (window.DOC_XREF || {}).items || {};
      links.forEach(({ a, id }) => {
        const it = items[id];
        if (!it || !it.title || a.dataset.tip) return;
        a.dataset.tip = it.title;
        a.removeAttribute('title');
      });
    };
    if (window.DOC_XREF) { apply(); return; }
    // base of the detailed design: the resolved href of the first link, without "<folder>/<id>.html"
    const first = links[0].a.href.split('#')[0];
    const base = first.replace(/[^/]*$/, '').replace(/(endpoints|entities|processes)\/$/, '');
    const s = document.createElement('script');
    s.src = base + 'xref.js';
    s.onload = apply;
    s.onerror = () => console.warn('[doc.js] xref.js not found for the link tips:', s.src);
    document.head.appendChild(s);
  }

  // Sortable table (opt-in): <table data-sortable>. A click on a column head (a button inside the th, so the
  // keyboard reaches it) sorts on that column, a second click reverses; aria-sort says the current order.
  // Value of a cell: its data-sort-value, else its text. Ids and numbers sort naturally (EP-2 before EP-10).
  // A head with data-sort-order="MVP|R2|R3" ranks the values that start with these, in this order. Empty
  // values stay last. A head with data-sort="none" is not sortable.
  function sortables() {
    const coll = new Intl.Collator(I.lang(), { numeric: true, sensitivity: 'base' });
    $$('table[data-sortable]').forEach((table) => {
      const head = table.tHead && table.tHead.rows[0];
      const body = table.tBodies[0];
      if (!head || !body) return;
      // the original order breaks ties, so a sort is stable and a reversed sort stays readable
      Array.from(body.rows).forEach((r, i) => { r.dataset.sortIndex = i; });
      const ths = Array.from(head.cells);
      ths.forEach((th, col) => {
        if (th.dataset.sort === 'none') return;
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'sort-btn';
        while (th.firstChild) btn.appendChild(th.firstChild);
        btn.insertAdjacentHTML('beforeend', '<span class="sort-ind" aria-hidden="true"></span>');
        th.appendChild(btn);
        th.classList.add('sortable');
        btn.addEventListener('click', () => {
          const dir = th.getAttribute('aria-sort') === 'ascending' ? -1 : 1;
          ths.forEach((h) => h.removeAttribute('aria-sort'));
          th.setAttribute('aria-sort', dir > 0 ? 'ascending' : 'descending');
          const order = th.dataset.sortOrder ? th.dataset.sortOrder.split('|') : null;
          const key = (r) => {
            const c = r.cells[col];
            const v = c ? (c.dataset.sortValue ?? c.textContent).trim() : '';
            if (!order || !v) return { v, rank: 0 };
            const i = order.findIndex((o) => v === o || v.startsWith(o + ' '));
            return { v, rank: i < 0 ? order.length : i };
          };
          const rows = Array.from(body.rows).map((r) => ({ r, k: key(r) }));
          rows.sort((a, b) => {
            if (!a.k.v !== !b.k.v) return a.k.v ? -1 : 1;
            const d = (a.k.rank - b.k.rank) || coll.compare(a.k.v, b.k.v);
            return d ? d * dir : a.r.dataset.sortIndex - b.r.dataset.sortIndex;
          });
          rows.forEach(({ r }) => body.appendChild(r));
        });
      });
    });
  }

  function diagrams() {
    const all = $$('.diagram');
    if (!all.length) return;
    xrefs();
    // Long endpoint paths wrap after a slash, not in the middle of a word.
    $$('.diagram .node.endpoint').forEach(n => {
      const walk = document.createTreeWalker(n, NodeFilter.SHOW_TEXT);
      for (let t; (t = walk.nextNode());) t.data = t.data.replace(/\/(?!\u200b)/g, '/\u200b');
    });
    const redraw = () => all.forEach((d) => { layoutChain(d); drawLinks(d); });
    modeSwitch(all.filter((d) => d.querySelector('.chain')), redraw);
    releaseFilter(redraw);
    redraw();
    window.addEventListener('resize', () => { clearTimeout(diagrams.t); diagrams.t = setTimeout(redraw, 120); });
    document.fonts && document.fonts.ready.then(redraw);
  }

  // Big picture timeline:
  // <div class="bp-frise" data-lanes="Flow A ; Flow B ; Out of scope">
  //   <div class="bp-phase" data-phase="1. Name">
  //     <div class="bp-col" data-lane="Flow A" data-t="1">stickies stacked top to bottom</div>
  // data-t is the time slot inside the phase (columns align across lanes). The lanes named in
  // data-lanes-out="Out of scope" are drawn greyed.
  // Flow arrows: inside a phase, each event is linked to the next event of its lane, except in
  // out-of-scope lanes. data-flow="end" on a .bp-col stops the chain after it. Between phases the frise wraps, so a
  // lane that goes on gets a continuation mark instead of a long arrow: "→ 3" on its last event, "2 →"
  // on its first event in the next phase. Cross-lane links are explicit: data-links="<id>" on the event
  // sticky, as in the diagrams.
  function frise() {
    $$('.bp-frise').forEach((f, fi) => {
      const lanes = (f.dataset.lanes || '').split(';').map((l) => l.trim()).filter(Boolean);
      const outs = f.hasAttribute('data-lanes-out') ? f.dataset.lanesOut.split(';').map((l) => l.trim()).filter(Boolean) : null;
      const isOut = (l) => !!outs && outs.includes(l);
      f.classList.add('diagram');
      const chains = new Map(lanes.map((l) => [l, []]));
      const phaseNo = (p) => ((p.dataset.phase || '').match(/^\s*(\d+)/) || [])[1];
      $$('.bp-phase', f).forEach((p, pi) => {
        const cols = $$('.bp-col', p);
        const slots = Math.max(1, ...cols.map((c) => +c.dataset.t || 1));
        p.style.gridTemplateColumns = `22px repeat(${slots}, max-content)`;
        if (!p.querySelector('.bp-phase-title')) {
          const h = document.createElement('div');
          h.className = 'bp-phase-title'; h.textContent = p.dataset.phase || '';
          p.prepend(h);
        }
        const used = lanes.filter((l) => cols.some((c) => c.dataset.lane === l));
        used.forEach((l, i) => {
          const lab = document.createElement('div');
          lab.className = 'bp-lane-label' + (isOut(l) ? ' out' : '');
          lab.textContent = l; lab.style.gridRow = i + 2;
          p.appendChild(lab);
        });
        cols.forEach((c) => {
          const i = used.indexOf(c.dataset.lane);
          if (i < 0) { c.style.outline = '2px solid var(--danger)'; c.title = 'unknown lane: ' + c.dataset.lane; return; }
          c.style.gridRow = i + 2; c.style.gridColumn = (+c.dataset.t || 1) + 1;
          if (isOut(c.dataset.lane)) c.classList.add('out');
        });
        cols.slice().sort((a, b) => (+a.dataset.t || 1) - (+b.dataset.t || 1)).forEach((c) => {
          const ev = c.querySelector('.sticky.event');
          if (ev && chains.has(c.dataset.lane) && !isOut(c.dataset.lane)) chains.get(c.dataset.lane).push({ ev, end: c.dataset.flow === 'end', phase: pi, no: phaseNo(p) || pi + 1 });
        });
      });
      let n = 0;
      const idOf = (el) => el.id || (el.id = `bp${fi}-e${++n}`);
      const mark = (ev, side, text) => {
        const m = document.createElement('span');
        m.className = 'bp-cont ' + side; m.textContent = text;
        ev.appendChild(m);
      };
      chains.forEach((chain) => chain.forEach((cur, k) => {
        const next = chain[k + 1];
        if (!next || cur.end) return;
        if (next.phase === cur.phase) cur.ev.dataset.links = ((cur.ev.dataset.links || '') + ' ' + idOf(next.ev)).trim();
        else { mark(cur.ev, 'out', '→ ' + next.no); mark(next.ev, 'in', cur.no + ' →'); }
      }));
    });
  }

  // Grid diagrams placed by data-c (column) and data-r (row), arrows drawn by the diagram router:
  // functional journeys <div class="pf"><div class="pf-node user" id="fl1-a" data-c="2" data-r="1" data-links="fl1-b">
  // and the conceptual data model <div class="mcd"><div class="mcd-entity" id="o-room" data-c="1" data-r="1" data-links="o-booking|hosts 1..n">
  function journeys() {
    $$('.pf, .mcd').forEach((d) => {
      d.classList.add('diagram');
      $$('.pf-node, .mcd-entity', d).forEach((n) => { n.style.gridColumn = +n.dataset.c || 1; n.style.gridRow = +n.dataset.r || 1; });
    });
  }

  // French typography: a no-break space before ? ! ; : and inside « », so the sign never starts a line.
  // Text nodes only, outside code, pre (Mermaid sources) and scripts. French pages only.
  function typography() {
    const main = $('.doc-main'), NB = '\u00a0';
    if (!main) return;
    // An identifier link (BR-01, SCR-05, Q-003) never breaks on its hyphen
    $$('a', main).forEach((a) => { if (/^[A-Z]+-\d+$/.test(a.textContent.trim())) a.classList.add('ref-id'); });
    if (!window.SirI18n.fr()) return;
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => n.parentElement.closest('code, pre, script, style, .mermaid') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => {
      const s = n.nodeValue.replace(/ ([?!;:»])/g, NB + '$1').replace(/« /g, '«' + NB);
      if (s !== n.nodeValue) n.nodeValue = s;
    });
  }

  // Gherkin: <pre class="gherkin"> in plain text becomes one card per scenario, anchored #S1, #S2…
  // The card header shows the full scenario identifier, US-006/S4, prefixed by <meta name="id">
  // (plain "S4" when the page has none); the anchor stays #S4. Keywords are highlighted.
  // Keywords come from the gherkin labels of the project language (every form of each keyword is accepted).
  function gherkin() {
    const pres = $$('pre.gherkin');
    if (!pres.length) return;
    const idMeta = document.querySelector('meta[name="id"]');
    const prefix = idMeta && idMeta.content.trim() ? idMeta.content.trim() + '/' : '';
    const forms = (k) => [].concat(window.SirI18n.raw('gherkin.' + k) || []).map((w) => String(w).trim()).filter(Boolean);
    const reEsc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // a keyword that ends with a letter of a spaced script stops at a space or an apostrophe ("Lorsque",
    // not "Lorsquelle"); one that ends with an apostrophe ("Lorsqu'") or is in a script without spaces does not
    const word = (w) => reEsc(w) + (/[\p{Script=Latin}\p{Script=Cyrillic}\p{Script=Greek}\d]$/u.test(w) ? "(?=[\\s'’]|$)" : '');
    const alt = (list) => list.sort((a, b) => b.length - a.length).map(word).join('|');
    const steps = ['given', 'when', 'then', 'and', 'but'].flatMap(forms);
    const joins = new Set(['and', 'but'].flatMap(forms));
    const KW = steps.length ? new RegExp(`^(${alt(steps)})`, 'u') : null;
    const scn = forms('scenario');
    const SCN = new RegExp(`^(?:${scn.length ? scn.sort((a, b) => b.length - a.length).map(reEsc).join('|') : 'Scenario'})\\s+(\\d+)\\s*:\\s*(.*)$`, 'u');
    pres.forEach((pre) => {
      const box = document.createElement('div');
      box.className = 'gherkin';
      let card = null;
      pre.textContent.split('\n').forEach((raw) => {
        const line = raw.trim();
        if (!line) return;
        const m = line.match(SCN);
        if (m) {
          card = document.createElement('div');
          card.className = 'scn'; card.id = 'S' + m[1];
          const h = document.createElement('h4');
          const n = document.createElement('span'); n.className = 'n'; n.textContent = prefix + 'S' + m[1];
          h.appendChild(n);
          h.appendChild(document.createTextNode(m[2]));
          card.appendChild(h); box.appendChild(card);
          return;
        }
        if (!card) return;
        const p = document.createElement('p');
        const k = KW && line.match(KW);
        if (k) {
          const kw = document.createElement('span'); kw.className = 'kw'; kw.textContent = k[1];
          p.appendChild(kw); p.appendChild(document.createTextNode(line.slice(k[1].length)));
          if (joins.has(k[1])) p.className = 'and';
        } else p.textContent = line;
        card.appendChild(p);
      });
      pre.replaceWith(box);
    });
  }

  // Definition of Ready: count of checked items next to the section title
  function checklists() {
    $$('ul.checklist').forEach((ul) => {
      const all = $$('li', ul).length, done = $$('li.done', ul).length;
      const h = ul.closest('.section') && $('h2', ul.closest('.section'));
      if (!h || !all) return;
      const c = document.createElement('span');
      c.className = 'dor-count tag ' + (done === all ? 'ok' : 'warn'); c.textContent = done + ' / ' + all;
      h.appendChild(c);
    });
  }

  // Prototype screenshots not taken yet (story shots, screen thumbnails): a hatched placeholder instead of a broken image
  function shots() {
    $$('.shot img, .screen-card .thumb img').forEach((img) => {
      const miss = () => { const d = document.createElement('div'); d.className = 'missing'; d.textContent = t('doc.shot.missing'); img.replaceWith(d); };
      if (img.complete && !img.naturalWidth) miss(); else img.addEventListener('error', miss);
    });
  }

  // Hotspots panel: count of open hotspots next to the title (rows of its table)
  function hotspots() {
    $$('.section.hotspots').forEach((sec) => {
      const n = $$('tbody tr', sec).length, h = $('h2', sec);
      if (!h || !n) return;
      const c = document.createElement('span');
      c.className = 'hs-count'; c.textContent = n;
      h.appendChild(c);
    });
  }


  // Roadmap gates: data-gate on a .rm-head draws a vertical band on the right edge of that column, over the
  // whole grid, with the gate name on top. Syntax: data-gate="<gate>[|<verdict>[|<date>]]" [data-gate-name="..."]
  //   data-gate="G1"                        gate not crossed yet: violet band
  //   data-gate="G1|validated"              gate crossed: green band; the decision is said by the tooltip, not under the band
  //   data-gate="G0|validated|2026-10-02"   crossed, with the date of the decision (tooltip)
  //   data-gate-name="..."                  optional: the gate in plain words, else the label common.gate.<gate>
  // The decision is a code (common.decision.<code>, team/conventions/language.md). Hovering the badge or the band
  // (a few pixels around it), or focusing the badge, shows at once a tooltip: "Framing validation · Validated on
  // 10/2/2026". Every gate is decided by the
  // human: the decider is not written.
  // When the last column has a gate, the grid gets one more 30 px track (.has-end) and the cells of the last
  // column span it (.rm-end): the band of that gate runs at the start of that track, so its badge stays
  // centred on it, inside the grid frame.
  const RM_END = 30; // keep in line with .rm-grid > .rm-end in doc.css
  function gates() {
    $$('.rm-grid').forEach((g) => {
      const host = g.parentElement && g.parentElement.matches('.roadmap') ? g.parentElement : g;
      const heads = $$(':scope > .rm-head', g);
      const last = heads[heads.length - 1];
      if (last && last.hasAttribute('data-gate')) {
        const cells = Array.from(g.children).filter((c) => !c.matches('.rm-gate'));
        cells.forEach((c, i) => { if (i % heads.length === heads.length - 1) c.classList.add('rm-end'); });
        // one more track after the last column: the default template has it under .has-end, an inline one gets it here
        g.classList.add('has-end');
        if (g.style.gridTemplateColumns) g.style.gridTemplateColumns += ` ${RM_END}px`;
        if (g.style.minWidth) g.style.minWidth = `calc(${g.style.minWidth} + ${RM_END}px)`;
      }
      const draw = () => {
        $$(':scope > .rm-gate', host).forEach((x) => x.remove());
        const box = host.getBoundingClientRect();
        $$('.rm-head[data-gate]', g).forEach((h) => {
          const [name, verdict, date] = h.dataset.gate.split('|').map((x) => x.trim());
          const gate = h.dataset.gateName || (I.has('common.gate.' + name) ? t('common.gate.' + name) : name);
          const tip = !verdict ? gate : t(date ? 'doc.gate.tipDate' : 'doc.gate.tip', { gate, decision: cap(decision(verdict)), date: day(date) });
          const d = document.createElement('div');
          d.className = 'rm-gate' + (verdict ? ' done' : '');
          const end = h.classList.contains('rm-end') ? RM_END : 0;
          d.style.left = (h.getBoundingClientRect().right - end - box.left + host.scrollLeft) + 'px';
          if (host !== g) { d.style.top = g.offsetTop + 'px'; d.style.height = g.offsetHeight + 'px'; d.style.bottom = 'auto'; }
          d.innerHTML = '<i class="rm-gate-hit"></i><b tabindex="0"></b>';
          d.querySelector('b').textContent = name;
          // the hover zone (band and badge) and the focusable badge carry the tooltip (tips(), instant)
          d.querySelector('b').dataset.tip = tip; d.querySelector('.rm-gate-hit').dataset.tip = tip;
          host.appendChild(d);
        });
      };
      draw();
      window.addEventListener('resize', draw);
      document.fonts && document.fonts.ready.then(draw);
    });
  }

  // Filter by type: <ul data-filter> whose items carry data-type="<key>" [data-type-label="<label>"] (and class
  // t-<key> for the colour). A row of toggle buttons (aria-pressed) is built before the list: "All", then one per
  // type present with its count. Several types add up; none selected shows everything. The number of shown items
  // is announced ("3 shown out of 12"). Without JS, no buttons, all items visible. The choice is not kept between
  // visits, so that a new type is never hidden by an old choice. The value of data-filter is not read.
  function filterLists() {
    $$('[data-filter]').forEach((list) => {
      const items = Array.from(list.children).filter((li) => li.dataset.type);
      if (!items.length) return;
      const types = [];
      items.forEach((li) => { if (!types.some((x) => x.key === li.dataset.type)) types.push({ key: li.dataset.type, label: li.dataset.typeLabel || li.dataset.type }); });
      const on = new Set();
      const bar = document.createElement('div');
      bar.className = 'flt-bar'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', t('doc.filter.aria'));
      const live = document.createElement('span'); live.className = 'sr-only'; live.setAttribute('role', 'status');
      const chip = (key, label, n) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'flt-chip' + (key ? ' t-' + key : ' flt-all'); b.dataset.key = key;
        b.innerHTML = '<span></span> <b></b>'; b.firstChild.textContent = label; b.lastChild.textContent = n;
        if (list.id) b.setAttribute('aria-controls', list.id);
        bar.appendChild(b);
        return b;
      };
      const all = chip('', t('doc.filter.all'), items.length);
      const chips = types.map((x) => chip(x.key, x.label, items.filter((li) => li.dataset.type === x.key).length));
      const apply = (announce) => {
        items.forEach((li) => { li.hidden = on.size > 0 && !on.has(li.dataset.type); });
        all.setAttribute('aria-pressed', String(on.size === 0));
        chips.forEach((c) => c.setAttribute('aria-pressed', String(on.has(c.dataset.key))));
        const n = items.filter((li) => !li.hidden).length;
        if (announce) live.textContent = t('doc.filter.shown', { n, total: items.length });
      };
      bar.addEventListener('click', (e) => {
        const b = e.target.closest('.flt-chip');
        if (!b) return;
        if (!b.dataset.key) on.clear();
        else if (on.has(b.dataset.key)) on.delete(b.dataset.key);
        else on.add(b.dataset.key);
        apply(true);
      });
      list.before(bar, live);
      apply(false);
    });
  }

  // "Show more" list: <ol data-more="5"> shows its first 5 items and hides the others; a button after the list
  // reveals 5 more at each click, moves the focus to the first revealed item and announces it; when all are
  // shown, the button is disabled and says so. Without JS every item stays visible.
  function moreLists() {
    $$('[data-more]').forEach((list, n) => {
      const step = parseInt(list.dataset.more, 10) || 5;
      const items = Array.from(list.children);
      if (items.length <= step) return;
      items.forEach((li, i) => { if (i >= step) li.hidden = true; });
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'more-btn';
      if (!list.id) list.id = 'more-list-' + (n + 1);
      btn.setAttribute('aria-controls', list.id);
      const live = document.createElement('span');
      live.className = 'sr-only'; live.setAttribute('role', 'status');
      const label = () => {
        const left = items.filter((li) => li.hidden).length;
        if (!left) { btn.disabled = true; btn.textContent = t('doc.more.all'); return; }
        btn.textContent = t('doc.more.button', { n: Math.min(step, left) });
      };
      btn.addEventListener('click', () => {
        const next = items.filter((li) => li.hidden).slice(0, step);
        next.forEach((li) => { li.hidden = false; });
        if (next[0]) { next[0].tabIndex = -1; next[0].focus(); }
        live.textContent = t('doc.more.announce', { n: next.length });
        label();
      });
      label();
      list.after(btn, live);
    });
  }

  // Opt-in: a .rm-head[data-current] marks the column in progress; a grid wider than its .roadmap frame (mobile)
  // opens on that column instead of the first one. Without the attribute, nothing changes.
  function currentColumns() {
    $$('.roadmap').forEach((r) => {
      const h = $('.rm-head[data-current]', r);
      if (!h) return;
      const go = () => {
        if (r.scrollWidth <= r.clientWidth) return;
        // the first column keeps the lane titles in view; otherwise a sliver of the previous column says there is more on the left
        r.scrollLeft = h.previousElementSibling === $('.rm-head', r) ? 0 : h.offsetLeft - 24;
      };
      go();
      document.fonts && document.fonts.ready.then(go);
    });
  }

  // Estimates: in a table.heat, every td.heat is colored from cold (lowest of its column) to hot
  // (highest). The value is the first number of the cell ("2,5 j" -> 2.5); the unit stays in the text.
  function heat() {
    // the tables of one estimate box share their colour range, column by column
    const groups = new Map();
    $$('table.heat').forEach((t) => { const k = t.closest('.est') || t; groups.set(k, [...(groups.get(k) || []), t]); });
    groups.forEach((tables) => {
      const cols = new Map();
      tables.flatMap((t) => $$('tbody tr', t)).forEach((tr) => {
        if (tr.classList.contains('total')) return;
        Array.from(tr.children).forEach((td, i) => {
          if (!td.classList.contains('heat')) return;
          const m = td.textContent.replace(',', '.').match(/[\d.]+/);
          if (!m) return;
          if (!cols.has(i)) cols.set(i, []);
          cols.get(i).push([td, parseFloat(m[0])]);
        });
      });
      cols.forEach((cells) => {
        const vs = cells.map((c) => c[1]), lo = Math.min(...vs), hi = Math.max(...vs);
        cells.forEach(([td, v]) => {
          const r = hi === lo ? 0.5 : (v - lo) / (hi - lo);
          const hue = 210 - r * 205; // 210 blue (cold) to 5 red (hot)
          td.style.background = `hsl(${hue} 85% ${93 - r * 8}%)`;
          td.style.color = `hsl(${hue} 70% 28%)`;
        });
      });
    });
  }


  // Estimate scale: values computed from the size of each story, with a settings panel (gear, top right of
  // the section). <div class="est" data-h="XS:1 S:2 M:4 L:5 XL:8" data-assist="50" data-agent="0.5"
  //   data-hpart="XS:0.25 S:0.25 M:0.5 L:0.75 XL:1" [data-source="..."]> wraps a table.heat:
  //   <tr data-size="M" data-front="60" data-rel="mvp"> empty cells td.e-front td.e-h td.e-a td.e-ag td.e-hu
  //   (data-front: share of the story's work on the front end, in %, 50 if absent)
  //   <tr class="work" data-rel="mvp" data-fixed="12 6 4 2"> work out of stories, fixed values; with
  //   data-items="<planner item ids>", plan.js computes them from its configuration (one source of truth)
  //   <tr class="total" data-rel="mvp" [data-only="stories"]> sums of the release
  // Realisation by mode: human = days for the size; assisted = human x data-assist %; autonomous AI = agent
  // hours, human x data-agent. Validation and acceptance (all modes) = data-hpart for the size.
  // Anywhere in the page, [data-est="mvp:h|a|ag|hu"] shows a total ("*:h" for all).
  // The box can hold one table per lot (design, each release): one scale, one colour range for all.
  // The capacity planner (plan.js) reads the computed rows from Doc.EST. The viewer's settings stay in their browser.
  const EST = { boxes: [] };
  // a value with its unit: num(1.5, 'd') is "1.5 d" in en, "1,5 j" in fr (unit 'd' days, 'h' hours)
  const num = (v, unit) => t(unit === 'h' ? 'doc.unit.hours' : 'doc.unit.days', { n: Math.round(v * 100) / 100 });
  const pairs = (s) => Object.fromEntries((s || '').split(/\s+/).filter(Boolean).map((p) => { const [k, v] = p.split(':'); return [k, parseFloat(v)]; }));
  EST.rows = (pred) => EST.boxes.flatMap((b) => b.rows.filter(pred));
  EST.sum = (rows, k) => rows.reduce((t, r) => t + r.v[k], 0);
  // recompute every box, e.g. after plan.js wrote the values of the work rows (data-fixed)
  EST.refresh = () => EST.boxes.forEach((b) => b.compute());
  EST.fill = (root = document) => $$('[data-est]', root).forEach((el) => {
    const [rel, k] = el.dataset.est.split(':');
    const v = EST.sum(EST.rows((r) => rel === '*' || r.rel === rel), k);
    el.textContent = num(v, k === 'ag' ? 'h' : 'd');
  });

  // Discreet settings button, top right of a section, opening a panel. Returns the panel (hidden at first).
  function gearPanel(sec, label) {
    sec.classList.add('has-gear');
    const gear = document.createElement('button');
    gear.type = 'button'; gear.className = 'gear'; gear.setAttribute('aria-label', label); gear.title = label;
    gear.setAttribute('aria-expanded', 'false');
    gear.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.6 7.6 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.6 7.6 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)"/></svg>';
    const panel = document.createElement('div'); panel.className = 'gear-panel'; panel.hidden = true;
    const show = (on) => { panel.hidden = !on; gear.setAttribute('aria-expanded', String(on)); };
    gear.addEventListener('click', () => show(panel.hidden));
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !panel.hidden) { show(false); gear.focus(); } });
    sec.prepend(panel); sec.prepend(gear);
    return panel;
  }

  function estimates() {
    $$('.est').forEach((box, n) => {
      const key = 'est:' + location.pathname + ':' + n;
      const defaults = { h: pairs(box.dataset.h), hpart: pairs(box.dataset.hpart), assist: parseFloat(box.dataset.assist),
        agent: parseFloat(box.dataset.agent) };
      const clone = (o) => JSON.parse(JSON.stringify(o));
      let p = clone(defaults);
      try { const s = JSON.parse(localStorage.getItem(key)); if (s) p = { ...p, ...s, h: { ...p.h, ...s.h }, hpart: { ...p.hpart, ...s.hpart } }; } catch (e) { /* storage unavailable */ }
      const me = { p, rows: [], compute: () => {} };
      EST.boxes.push(me);
      const trs = $$('tbody tr', box);
      const compute = () => {
        me.p = p;
        me.rows = trs.filter((tr) => !tr.classList.contains('total')).map((tr) => {
          let v;
          if (tr.classList.contains('work')) { const [h, a, ag, hu] = (tr.dataset.fixed || '0 0 0 0').split(/\s+/).map((x) => parseFloat(x) || 0); v = { h, a, ag, hu }; }
          else { const h = p.h[tr.dataset.size] || 0; v = { h, a: h * p.assist / 100, ag: h * p.agent, hu: p.hpart[tr.dataset.size] || 0 }; }
          const front = tr.dataset.front !== undefined ? parseFloat(tr.dataset.front) : 50;
          const fc = $('.e-front', tr); if (fc) fc.textContent = I.num(front / 100, { style: 'percent', maximumFractionDigits: 1 });
          return { tr, v, front, rel: tr.dataset.rel, work: tr.classList.contains('work') };
        });
        const put = (tr, v, bold) => ['h', 'a', 'ag', 'hu'].forEach((k) => {
          const td = $('.e-' + k, tr); if (!td) return;
          const t = v[k] ? num(v[k], k === 'ag' ? 'h' : 'd') : '·';
          td.innerHTML = bold ? `<b>${t}</b>` : t;
        });
        me.rows.forEach((r) => put(r.tr, r.v));
        trs.filter((tr) => tr.classList.contains('total')).forEach((tr) => {
          const rows = me.rows.filter((r) => r.rel === tr.dataset.rel && (tr.dataset.only !== 'stories' || !r.work));
          put(tr, { h: EST.sum(rows, 'h'), a: EST.sum(rows, 'a'), ag: EST.sum(rows, 'ag'), hu: EST.sum(rows, 'hu') }, true);
        });
        heat();
        EST.fill();
        document.dispatchEvent(new Event('estimate-change'));
      };
      me.compute = compute;

      // settings panel
      const panel = gearPanel(box.closest('.section') || box, t('doc.est.settings'));
      const sizes = Object.keys(defaults.h);
      const inp = (val, step, on) => { const i = document.createElement('input'); i.type = 'number'; i.min = '0'; i.step = step; i.value = val; i.addEventListener('input', () => { const v = parseFloat(i.value); if (!isNaN(v)) { on(v); save(); compute(); } }); return i; };
      const save = () => { try { localStorage.setItem(key, JSON.stringify(p)); } catch (e) { /* storage unavailable */ } };
      const build = () => {
        panel.innerHTML = `<p class="gear-title">${esc(t('doc.est.title'))}</p><table class="gear-grid"><thead><tr><th></th>${sizes.map((s) => `<th><span class="size ${s.toLowerCase()}">${s}</span></th>`).join('')}</tr></thead><tbody><tr class="g-h"><th>${esc(t('doc.est.human'))}</th></tr><tr class="g-hp"><th>${esc(t('doc.est.validation'))}</th></tr></tbody></table><div class="gear-rows"></div>`;
        sizes.forEach((s) => {
          const c1 = document.createElement('td'); c1.appendChild(inp(p.h[s], '0.5', (v) => { p.h[s] = v; })); $('.g-h', panel).appendChild(c1);
          const c2 = document.createElement('td'); c2.appendChild(inp(p.hpart[s], '0.25', (v) => { p.hpart[s] = v; })); $('.g-hp', panel).appendChild(c2);
        });
        const rows = $('.gear-rows', panel);
        [['doc.est.assist', 'assist', '5'], ['doc.est.agent', 'agent', '0.1']]
          .forEach(([label, k, step]) => { const l = document.createElement('label'); l.innerHTML = `<span>${esc(t(label))}</span>`; l.appendChild(inp(p[k], step, (v) => { p[k] = v; })); rows.appendChild(l); });
        const foot = document.createElement('div'); foot.className = 'gear-foot';
        foot.innerHTML = `<small>${box.dataset.source || ''}</small>`;
        const reset = document.createElement('button'); reset.type = 'button'; reset.textContent = t('doc.est.reset');
        reset.addEventListener('click', () => { p = clone(defaults); save(); build(); compute(); });
        foot.appendChild(reset); panel.appendChild(foot);
      };
      build();
      compute();
    });
  }

  // Tabs: <div class="tabs"><div class="tab" data-tab="Label" [data-default]>...</div>...</div>
  // Buttons are built from data-tab; the panel shown first is data-default, else the first one.
  function tabs() {
    $$('.tabs').forEach((box) => {
      const panes = $$(':scope > .tab', box);
      const bar = document.createElement('div');
      bar.className = 'tab-bar'; bar.setAttribute('role', 'tablist');
      const show = (i) => panes.forEach((p, j) => {
        p.hidden = i !== j; bar.children[j].setAttribute('aria-selected', String(i === j));
        if (i === j) p.dispatchEvent(new Event('tab-shown'));
      });
      panes.forEach((p, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = p.dataset.tab;
        b.addEventListener('click', () => show(i));
        bar.appendChild(b);
      });
      box.prepend(bar);
      const d = panes.findIndex((p) => p.hasAttribute('data-default'));
      show(d < 0 ? 0 : d);
    });
  }

  // ---------- Gantt charts ----------
  // Static chart, fixed dates:
  // <div class="gantt" [data-start="2026-10-01" data-end="2026-10-17"] data-today="2026-10-05">
  //   <div class="g-group" data-label="Design" [data-open]>
  //     <div class="g-task" data-start="2026-10-05" data-end="2026-10-07T12:00" data-kind="phase|sprint|qa|done|risk|human" data-note="2 j">Label</div>
  //     <div class="g-gate" data-at="2026-10-08" [data-who="validated"] [data-state="done"]>G1</div>
  //   </div>
  // </div>
  // Colours follow the status: done (data-kind="done" or data-state="done") green, to do blue, late orange
  // (ends after its data-due, or before today without being done); data-kind="human" adds hatching. Each
  // group row and its detail alternate with a light tint.
  // data-end is exclusive (2026-10-07T12:00 = the bar stops at noon on the 7th). Each group row draws a
  // summary bar and folds its detail (closed unless data-open). Weekends are shaded; below 22 px per day
  // the scale shows weeks (date of the Monday) instead of day numbers.

  const D = 864e5;
  const tms = (iso) => new Date(iso.length === 10 ? iso + 'T00:00' : iso).getTime();
  const day0 = (ms) => { const d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
  const nextDay = (ms) => { const d = new Date(day0(ms)); d.setDate(d.getDate() + 1); return d.getTime(); };
  const isWe = (ms) => [0, 6].includes(new Date(ms).getDay());
  const skipWe = (ms) => { while (isWe(ms)) ms = nextDay(ms); return ms; };
  const p2 = (n) => String(n).padStart(2, '0');
  // dates in the project language: day (02.10.2026 in fr), day and month (02.10), month and year (oct. 2026)
  const dmy = (ms) => I.date(new Date(ms));
  const dm = (ms) => I.date(new Date(ms), 'dm');
  const monthYear = (d) => I.date(d, { month: 'short', year: 'numeric' });
  const iso = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
  const lastDay = (ms) => dmy(ms - 1); // an exclusive end at midnight belongs to the day before
  const days = (n) => (n === 0.5 ? t('doc.unit.halfDay') : t('doc.unit.days', { n }));
  const addWork = (ms, d) => {
    ms = skipWe(ms);
    while (d > 1e-9) {
      const a = day0(ms), m = nextDay(ms), left = (m - ms) / (m - a);
      if (d <= left + 1e-9) return ms + d * (m - a);
      d -= left; ms = skipWe(m);
    }
    return ms;
  };
  const workBetween = (a, b) => { // working days from a to b, to the half day
    let n = 0;
    for (let d = day0(a); d < b; d = nextDay(d)) if (!isWe(d)) n += (Math.min(nextDay(d), b) - Math.max(d, a)) / (nextDay(d) - d);
    return Math.round(n * 2) / 2;
  };
  const perMode = (s, mode, sep) => {
    if (s == null) return undefined;
    let all;
    for (const part of s.split(sep)) {
      const m = part.trim().match(/^([\w-]+):\s*(.*)$/);
      if (!m) all = part.trim();
      else if (m[1] === mode) return m[2];
    }
    return all;
  };

  // model: { start, end, today, groups: [{ label, open, items: [{ gate, a, b, kind, label, note, crit, state }] }] }
  function drawGantt(g, model, open, onToggle) {
    g.innerHTML = '';
    const t0 = day0(model.start), nDays = Math.round((day0(model.end) - t0) / D);
    const wrap = document.createElement('div'); wrap.className = 'g-wrap';
    g.appendChild(wrap);
    const labelW = 230, avail = Math.max(g.clientWidth - labelW - 2, 200);
    const px = Math.max((avail - 190) / nDays, 9), weekly = px < 22, W = nDays * px + 190; // right margin for the last notes
    const x = (ms) => { const a = day0(ms); return (Math.round((a - t0) / D) + (ms - a) / (nextDay(ms) - a)) * px; };
    let months = '', ticks = '', shade = '';
    for (let i = 0; i < nDays; i++) {
      const d = new Date(new Date(t0).getFullYear(), new Date(t0).getMonth(), new Date(t0).getDate() + i), dow = d.getDay();
      if (i === 0 || d.getDate() === 1) months += `<span style="left:${i * px}px">${monthYear(d)}</span>`;
      if (!weekly) ticks += `<span class="${dow === 0 || dow === 6 ? 'we' : ''}" style="left:${i * px}px;width:${px}px">${d.getDate()}</span>`;
      else if (dow === 1) ticks += `<span style="left:${i * px}px;width:${7 * px}px">${dm(d.getTime())}</span>`;
      if (dow === 0 || dow === 6) shade += `<i style="left:${i * px}px;width:${px}px"></i>`;
    }
    const head = document.createElement('div'); head.className = 'g-row g-head';
    head.innerHTML = `<div class="g-label">${weekly ? esc(t('doc.gantt.weekOf')) : ''}</div><div class="g-track" style="width:${W}px"><div class="g-months">${months}</div><div class="g-ticks">${ticks}</div>${model.today ? `<b class="g-now" style="left:${x(model.today) + 1}px" title="${dmy(model.today)}">${esc(t('doc.gantt.today'))}</b>` : ''}</div>`;
    wrap.appendChild(head);
    const body = document.createElement('div'); body.className = 'g-body'; body.style.width = (labelW + W) + 'px';
    body.innerHTML = `<div class="g-shade" style="left:${labelW}px">${shade}</div>`;
    if (model.today) body.innerHTML += `<div class="g-today" style="left:${labelW + x(model.today)}px"></div>`;
    wrap.appendChild(body);
    const row = (cls, label, track) => {
      const r = document.createElement('div'); r.className = 'g-row ' + cls;
      r.innerHTML = `<div class="g-label">${label}</div><div class="g-track" style="width:${W}px">${track}</div>`;
      body.appendChild(r);
      return r;
    };
    const status = (it) => (it.kind === 'done' || it.state === 'done' ? 'done'
      : (it.due && it.b > it.due) || (model.today && it.b <= model.today) ? 'late' : 'todo');
    const late = (it) => (it.due && it.b > it.due ? ' · ' + t('doc.gantt.late', { d: days(workBetween(it.due, it.b)) }) : '');
    const seg = (it) => it.segs.map((g) => `<div class="g-bar g-seg s-${status(g)}${g.kind === 'human' ? ' human' : ''}" style="left:${x(g.a)}px;width:${Math.max(x(g.b) - x(g.a), 3)}px" ${g.tip ? `data-tip="${g.tip.replace(/"/g, '&quot;')}" tabindex="0"` : `title="${esc(t('doc.gantt.span', { label: g.label, from: dmy(g.a), to: lastDay(g.b) }))}"`}>${x(g.b) - x(g.a) > 44 ? `<span>${g.label}</span>` : ''}</div>`).join('');
    const bar = (it) => it.segs ? seg(it) : `<div class="g-bar s-${status(it)}${it.kind === 'human' ? ' human' : ''}${it.crit ? ' crit' : ''}" style="left:${x(it.a)}px;width:${Math.max(x(it.b) - x(it.a), 4)}px" title="${esc(t('doc.gantt.span', { label: it.label.replace(/<[^>]+>/g, ''), from: dmy(it.a), to: lastDay(it.b) }))}"></div><span class="g-text" style="left:${x(it.b) + 6}px">${it.note || ''}${late(it)}</span>`;
    const gate = (it, text) => `<div class="g-gate s-${status(it)}${it.crit ? ' crit' : ''}" style="left:${x(it.a)}px" title="${esc(t('doc.gantt.at', { label: it.label, date: lastDay(it.a + 1) }))}"><i></i>${text ? `<span>${it.label}${it.who ? ' · ' + decision(it.who) : ''}${late(it)}</span>` : ''}</div>`;
    model.groups.forEach((grp, gi) => {
      if (!grp.items.length) return;
      const tone = ' g-c' + (gi % 2), sts = grp.items.map(status);
      const gst = sts.every((v) => v === 'done') ? 'done' : sts.includes('late') ? 'late' : 'todo';
      const a = Math.min(...grp.items.map((i) => i.a)), b = Math.max(...grp.items.map((i) => i.b));
      const isOpen = open.has(grp.label);
      const gates = isOpen ? '' : grp.items.filter((i) => i.gate).map((i) => gate(i, false)).join('');
      const r = row('g-grp' + tone + (isOpen ? ' open' : ''), `<button type="button" class="g-fold" aria-expanded="${isOpen}">${grp.label}</button>`,
        `<div class="g-sum s-${gst}" style="left:${x(a)}px;width:${Math.max(x(b) - x(a), 4)}px"></div>${gates}<span class="g-text" style="left:${x(b) + 16}px">${isOpen ? '' : t('doc.gantt.range', { from: dmy(a), to: lastDay(b) })}</span>`);
      $('.g-fold', r).addEventListener('click', () => { isOpen ? open.delete(grp.label) : open.add(grp.label); onToggle(); });
      if (isOpen) grp.items.forEach((it) => row((it.gate ? 'g-gate-row' : '') + tone, it.gate ? t('doc.gantt.gate', { name: it.label }) : it.label, it.gate ? gate(it, true) : bar(it)));
    });
  }

  const watch = (el, draw) => {
    window.addEventListener('resize', () => { clearTimeout(el._t); el._t = setTimeout(draw, 120); });
    el.closest('.tab') && el.closest('.tab').addEventListener('tab-shown', draw);
  };

  function gantts() {
    $$('.gantt:not(.plan .gantt)').forEach((g) => {
      const src = Array.from(g.children);
      const groups = src.map((grp) => ({
        label: grp.dataset.label, open: grp.hasAttribute('data-open'),
        items: Array.from(grp.children).map((e) => {
          const isGate = e.classList.contains('g-gate');
          return { gate: isGate, a: tms(isGate ? e.dataset.at : e.dataset.start), b: tms(isGate ? e.dataset.at : e.dataset.end),
            kind: e.dataset.kind, state: e.dataset.state, who: e.dataset.who, note: e.dataset.note, label: e.innerHTML,
            due: e.dataset.due && nextDay(tms(e.dataset.due)) };
        }),
      }));
      const all = groups.flatMap((x) => x.items);
      const model = {
        groups, today: g.dataset.today && tms(g.dataset.today),
        start: g.dataset.start ? tms(g.dataset.start) : Math.min(...all.map((i) => i.a)),
        end: g.dataset.end ? tms(g.dataset.end) : nextDay(Math.max(...all.map((i) => i.b)) + 4 * D),
      };
      const open = new Set(groups.filter((x) => x.open).map((x) => x.label));
      const draw = () => drawGantt(g, model, open, draw);
      draw(); watch(g, draw);
    });
  }

  function mermaid() {
    if (!$('.mermaid')) return;
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
    s.onload = () => { window.mermaid.initialize({ startOnLoad: false, theme: 'neutral', fontFamily: 'Inter, sans-serif' }); window.mermaid.run(); };
    document.head.appendChild(s);
  }

  // ?levels in the URL shows the mandatory / recommended / optional chip on every section
  if (/[?&]levels\b/.test(location.search)) document.body.classList.add('show-levels');

  // shared with plan.js (capacity planner), with the labels (t, i18n) and their formats (dmy, dm, days, num)
  window.Doc = { $, $$, EST, drawGantt, gearPanel, watch, heat, pairs, num, tms, dmy, dm, day0, nextDay, lastDay, isWe, days, workBetween, t, i18n: I, esc, decision };

  // Labels shown by doc.css (::before, ::after): custom properties, English by default in the stylesheet
  function cssLabels() {
    const st = document.documentElement.style;
    [['--doc-l-mandatory', 'doc.level.mandatory'], ['--doc-l-recommended', 'doc.level.recommended'],
      ['--doc-l-optional', 'doc.level.optional'], ['--doc-l-todo', 'doc.todo']]
      .forEach(([p, k]) => st.setProperty(p, JSON.stringify(t(k))));
  }

  I.ready(() => {
    cssLabels();
    gherkin();
    typography();
    buildToc();
    infos();
    tips();
    checklists();
    shots();
    completeness();
    frise();
    journeys();
    hotspots();
    diagrams();
    sitemapFamilies();
    objTips();
    sortables();
    heat();
    estimates();
    gates();
    currentColumns();
    moreLists();
    filterLists();
    tabs();
    gantts();
    mermaid();
  });
})();

/* Filters with several facets (backlog page), appended to the shared behaviour without touching it.
   <div data-facets='[{"key":"release","label":"Release","options":[["mvp","MVP"],…]},…]'>
   (each facet may carry "aria", the label of its row for a screen reader, else "Filter by <label>" in the project
   language; and "prefix": a chip gets the class t-<prefix>-<value>, which gives its colour --t)
   holds items [data-facet-item data-f-<key>="<value>"] and, optionally, groups [data-facet-group] around them.
   One row of toggle chips (aria-pressed) per facet, in the order of its options, each with its count; an option
   absent from the items stays visible, disabled, to show the whole scale. Inside a facet the chips add up, the
   facets combine; "All" clears its facet. A group with no item shown is hidden. The number of shown items is
   announced ("3 shown out of 12"), "No result for this filter" when none is. Without JS, no chips, everything visible. The choice is not kept between visits, as filterLists(). */
(function () {
  'use strict';
  const { t } = window.SirI18n;
  function facets() {
    document.querySelectorAll('[data-facets]').forEach((box) => {
      let defs;
      try { defs = JSON.parse(box.dataset.facets); } catch (e) { return; }
      const items = Array.from(box.querySelectorAll('[data-facet-item]'));
      if (!items.length || !Array.isArray(defs)) return;
      const groups = Array.from(box.querySelectorAll('[data-facet-group]'));
      const on = {};
      const wrap = document.createElement('div');
      wrap.className = 'flt-facets';
      const live = document.createElement('span'); live.className = 'sr-only'; live.setAttribute('role', 'status');
      const empty = document.createElement('p'); empty.className = 'flt-empty'; empty.hidden = true;
      empty.textContent = t('doc.facets.empty');
      const rows = defs.map((d) => {
        on[d.key] = new Set();
        const bar = document.createElement('div');
        bar.className = 'flt-bar'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', d.aria || t('doc.facets.aria', { label: d.label }));
        const lab = document.createElement('span'); lab.className = 'flt-label'; lab.textContent = d.label; lab.setAttribute('aria-hidden', 'true');
        bar.appendChild(lab);
        const chip = (key, label, n) => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'flt-chip' + (key ? ' t-' + (d.prefix || d.key) + '-' + key : ' flt-all');
          b.dataset.key = key;
          b.innerHTML = '<span></span> <b></b>'; b.firstChild.textContent = label; b.lastChild.textContent = n;
          if (key && !n) b.disabled = true;
          bar.appendChild(b);
          return b;
        };
        const all = chip('', t('doc.filter.all'), items.length);
        const chips = (d.options || []).map(([v, l]) => chip(v, l, items.filter((it) => it.getAttribute('data-f-' + d.key) === v).length));
        bar.addEventListener('click', (e) => {
          const b = e.target.closest('.flt-chip');
          if (!b || b.disabled) return;
          if (!b.dataset.key) on[d.key].clear();
          else if (on[d.key].has(b.dataset.key)) on[d.key].delete(b.dataset.key);
          else on[d.key].add(b.dataset.key);
          apply(true);
        });
        wrap.appendChild(bar);
        return { d, all, chips };
      });
      const apply = (announce) => {
        items.forEach((it) => { it.hidden = !defs.every((d) => !on[d.key].size || on[d.key].has(it.getAttribute('data-f-' + d.key))); });
        groups.forEach((g) => { g.hidden = !g.querySelector('[data-facet-item]:not([hidden])'); });
        rows.forEach(({ d, all, chips }) => {
          all.setAttribute('aria-pressed', String(!on[d.key].size));
          chips.forEach((c) => { if (!c.disabled) c.setAttribute('aria-pressed', String(on[d.key].has(c.dataset.key))); });
        });
        const n = items.filter((it) => !it.hidden).length;
        empty.hidden = n > 0;
        if (announce) live.textContent = t('doc.filter.shown', { n, total: items.length });
      };
      box.before(wrap, live);
      box.after(empty);
      apply(false);
    });
  }
  window.SirI18n.ready(facets);
})();
