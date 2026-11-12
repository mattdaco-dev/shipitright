/* Prototype Réservation de salles: state, routing and rendering.
   One screen = one render function named after its EC-xx id, returning an HTML string.
   Dialogs belong to their screen and carry the anchor of the UX spec (EC-02-motif, EC-04-conflits...).
   Data lives in data.js, the proto bar in proto-bar.js (copied from the proto-bar skill, never edited). */

/* ---------- config ---------- */
const PROTO = {
  title: 'Réservation de salles, prototype',
  app: 'Réservation de salles',
  version: 'v1',
  date: '2026-10-05',
  prefix: 'resasalles.', // every localStorage key starts with it, so "Réinitialiser le proto" clears them all
};

/* ---------- utils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fill = (tpl, vars = {}) => tpl.replace(/<([^<>]+)>/g, (m, k) => (k in vars ? vars[k] : m));
const msg = (id, vars) => fill(MESSAGES[id], vars);
const label = (id, vars) => fill(LABELS[id], vars);
const pad = (n) => String(n).padStart(2, '0');

// Times: 'HH:MM' <-> minutes since midnight. Format of the DS: HH:MM, 24 h.
const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const OPEN = toMin(RULES.open);
const CLOSE = toMin(RULES.close);
const STEP = RULES.step;
const QUARTERS = Array.from({ length: (CLOSE - OPEN) / STEP }, (_, i) => OPEN + i * STEP); // 08:00 ... 18:45
const NOW_MIN = toMin(NOW.time);
const NEXT_QUARTER = Math.floor(NOW_MIN / STEP) * STEP + STEP; // RG-03: first bookable start today
const slot = (a, b) => `${a} à ${b}`; // "Créneau" format of the UX spec

// Dates: ISO 'AAAA-MM-JJ' inside, JJ.MM.AAAA on screen (DS format).
const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const toDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const toIso = (dt) => dt.toISOString().slice(0, 10);
const addDays = (iso, n) => { const t = toDate(iso); t.setUTCDate(t.getUTCDate() + n); return toIso(t); };
const addMonths = (iso, n) => { const t = toDate(iso); t.setUTCMonth(t.getUTCMonth() + n); return toIso(t); };
const dow = (iso) => toDate(iso).getUTCDay();
const isWeekend = (iso) => dow(iso) === 0 || dow(iso) === 6;
const fmtDate = (iso) => { const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}`; }; // JJ.MM.AAAA
const fmtDay = (iso) => `${DAY_NAMES[dow(iso)]} ${fmtDate(iso)}`; // "mardi 06.10.2026"
function parseDate(txt) { // JJ.MM.AAAA typed by the user -> ISO, or null
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(txt || '').trim());
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  return toIso(toDate(iso)) === iso ? iso : null;
}
const TODAY = NOW.day;
const nextWorkday = (iso) => { let d = iso; while (isWeekend(d)) d = addDays(d, 1); return d; };

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(PROTO.prefix + k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(PROTO.prefix + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
};

/* ---------- state ---------- */
const prefs = store.get('prefs') || {};
const S = {
  profile: PROFILES[prefs.profile] ? prefs.profile : 'employe',
  dataset: prefs.dataset || 'full', // 'full' | 'empty': shows the empty states
  server: 'ok', // 'ok' | 'rules': the server refuses the slot (EC-04, MSG-03)
  state: 'ok', // 'ok' | 'loading' | 'error', driven by the proto bar
  session: !!store.get('session'),
  returnTo: null, // page asked before login (EC-01)
  rooms: store.get('rooms') || ROOMS.map((x) => ({ ...x, equipment: [...x.equipment] })),
  bookings: store.get('bookings') || RESERVATIONS.map((x) => ({ ...x })),
  route: { screen: 'EC-01', param: null },
  banner: null, // { screen, tone: 'ok' | 'error', text, retry }
  dialog: null, // { type: 'EC-02-motif' | 'EC-04-conflits' | 'EC-05-annuler' | 'EC-06-desactiver', ... }
  popover: null, // EC-02 tooltip on a reservation: { id, top, left }
  dp: null, // open date picker: { field, month: 'AAAA-MM' }
  form: null, formKey: null, // EC-04
  search: null, // EC-03 criteria and results
  room: null, roomKey: null, // EC-07
  login: { email: '', error: false, showPwd: false },
  pending: false, // fake round trip while saving
  flash: null, // ids of the reservations just created (EC-05)
  gridFocus: { r: 0, q: 0 },
};
const savePrefs = () => store.set('prefs', { profile: S.profile, dataset: S.dataset });
const saveData = () => { store.set('rooms', S.rooms); store.set('bookings', S.bookings); };
const can = (action) => PROFILES[S.profile].can.includes(action);
const me = () => PROFILES[S.profile].user;
const userName = (id) => USERS[id].name;

/* ---------- business rules, simplified for the demo ---------- */
const rooms = () => (S.dataset === 'empty' ? [] : S.rooms);
const activeRooms = () => rooms().filter((r) => r.active); // RG-08
const roomById = (id) => S.rooms.find((r) => r.id === id);
const bookings = () => (S.dataset === 'empty' ? [] : S.bookings);
const activeBookings = () => bookings().filter((b) => b.status === 'active');
const hasStarted = (b) => b.day < TODAY || (b.day === TODAY && toMin(b.start) <= NOW_MIN); // RG-03
const isOver = (b) => b.day < TODAY || (b.day === TODAY && toMin(b.end) <= NOW_MIN);
const isPastSlot = (day, m) => day < TODAY || (day === TODAY && m < NOW_MIN); // RG-03
// RG-01: two reservations overlap when one starts before the other ends; 10:00-10:00 is not an overlap.
const conflictFor = (room, day, start, end, ignore = []) => activeBookings().find((b) => b.room === room && b.day === day
  && !ignore.includes(b.id) && toMin(b.start) < end && start < toMin(b.end));
// RG-02, RG-03: starts offered for a day, ends offered for a start.
const startOptions = (day) => QUARTERS.filter((m) => day !== TODAY || m >= NEXT_QUARTER);
const endOptions = (start) => QUARTERS.map((m) => m + STEP).filter((m) => m > start && m <= Math.min(start + RULES.maxMinutes, CLOSE));
const bookableDay = (iso) => !!iso && iso >= TODAY && !isWeekend(iso) && startOptions(iso).length > 0;
const firstBookableDay = () => { let d = TODAY; while (!bookableDay(d)) d = addDays(d, 1); return d; };
// CALC-01: occurrences of a series, from the first date, every working day or every 7 days,
// while the date is <= the last date asked and <= first + 3 months (RG-04). Bank holidays are not excluded.
function occurrences(first, freq, until) {
  const limit = addMonths(first, RULES.seriesMonths);
  const out = [];
  for (let d = first; d <= until && d <= limit; d = addDays(d, freq === 'weekly' ? 7 : 1)) {
    if (!isWeekend(d)) out.push(d);
  }
  return out;
}
let seq = Date.now() % 100000;
const newId = (p) => `${p}-${(seq += 1)}`;

/* ---------- routing: #EC-02/day=2026-10-06, #EC-07/r-alzette ---------- */
function parseHash() {
  const raw = location.hash.replace(/^#/, '');
  const i = raw.indexOf('/');
  const screen = i < 0 ? raw : raw.slice(0, i);
  const param = i < 0 ? null : decodeURIComponent(raw.slice(i + 1));
  return { screen: SCREENS[screen] ? screen : (S.session ? 'EC-02' : 'EC-01'), param: param || null };
}
const qs = (o) => Object.entries(o).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${k}=${v}`).join('&');
const params = (p) => Object.fromEntries((p || '').split('&').filter(Boolean).map((kv) => kv.split('=')));
const go = (screen, param) => { location.hash = param ? `${screen}/${param}` : screen; };

/* ---------- shared fragments ---------- */
const ICON_CAL = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="2" y="3" width="12" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="currentColor" stroke-width="1.4"/></svg>';
const ICON_EYE = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M1 8s2.6-5 7-5 7 5 7 5-2.6 5-7 5-7-5-7-5z" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="2.2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
const spinner = '<span class="spin" aria-hidden="true"></span>';

function pageHead(title, actions = '') {
  return `<div class="page-head"><h1 tabindex="-1">${esc(title)}</h1>${actions ? `<div class="head-actions">${actions}</div>` : ''}</div>`;
}

function skeleton(rows = 3, kind = 'row') {
  return `<div class="skeleton" aria-busy="true" aria-label="Chargement">
    ${Array.from({ length: rows }, () => `<div class="sk sk-${kind}"></div>`).join('')}
  </div>`;
}

function errorBlock(message) {
  return `<div class="state-error" role="alert">
    <p>${esc(message)}</p>
    <button class="btn" type="button" data-action="retry">Réessayer</button>
  </div>`;
}

const emptyBlock = (message, extra = '') => `<div class="state-empty"><p>${esc(message)}</p>${extra}</div>`;

// Message banner of the DS: success or error, live, closable, "Réessayer" when the action can be replayed.
function banner(screen) {
  const b = S.banner;
  if (!b || b.screen !== screen) return '';
  return `<div class="banner banner-${b.tone}" role="${b.tone === 'error' ? 'alert' : 'status'}">
    <p>${esc(b.text)}</p>
    ${b.retry ? '<button class="btn btn-sm" type="button" data-action="retry">Réessayer</button>' : ''}
    <button class="banner-close" type="button" data-action="banner-close" aria-label="Fermer le message">×</button>
  </div>`;
}

const capacity = (n) => label('capacity', { n });
const equipmentList = (ids) => (ids.length ? ids.map((e) => EQUIPMENT[e]).join(', ') : 'aucun');

function select(id, name, options, value, attrs = '') {
  return `<select id="${id}" name="${name}" ${attrs}>${options.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(value) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
}
const timeOptions = (list) => list.map((m) => [fromMin(m), fromMin(m)]);

// Date picker of the DS: JJ.MM.AAAA typed, or picked in a month grid whose disabled days follow the rules.
// `field` is the key of DATE_FIELDS below; `invalid` marks the field (aria-invalid).
function datePicker(field, id, labelText, value, invalid) {
  const open = S.dp && S.dp.field === field;
  return `<div class="field">
    <label for="${id}">${esc(labelText)}</label>
    <div class="dp">
      <input id="${id}" name="${field}" value="${esc(value)}" placeholder="JJ.MM.AAAA" inputmode="numeric" autocomplete="off"
        data-date="${field}" aria-invalid="${invalid ? 'true' : 'false'}">
      <button class="btn btn-icon" type="button" data-action="dp-toggle" data-field="${field}" aria-expanded="${open}"
        aria-label="Choisir dans le calendrier">${ICON_CAL}</button>
      ${open ? calendar(field) : ''}
    </div>
  </div>`;
}

// Fields using the date picker: how to read, write and constrain each one.
const DATE_FIELDS = {
  'grid-day': { get: () => gridDay(), set: (iso) => go('EC-02', qs({ ...params(S.route.param), day: iso })), allowed: () => true },
  'search-day': { get: () => parseDate(S.search.day), set: (iso) => { S.search.day = fmtDate(iso); }, allowed: bookableDay },
  'form-day': { get: () => parseDate(S.form.day), set: (iso) => { S.form.day = fmtDate(iso); fixFormTimes(); }, allowed: bookableDay },
  'form-until': {
    get: () => parseDate(S.form.until) || parseDate(S.form.day),
    set: (iso) => { S.form.until = fmtDate(iso); },
    allowed: (iso) => { const d = parseDate(S.form.day); return !!d && iso >= d && iso <= addMonths(d, RULES.seriesMonths) && !isWeekend(iso); },
  },
};

function calendar(field) {
  const month = S.dp.month;
  const first = `${month}-01`;
  const lead = (dow(first) + 6) % 7; // weeks start on Monday
  const days = [];
  for (let d = first; d.slice(0, 7) === month; d = addDays(d, 1)) days.push(d);
  const cfg = DATE_FIELDS[field];
  const selected = cfg.get();
  const [y, m] = month.split('-').map(Number);
  const cells = Array.from({ length: lead }, () => '<span></span>').concat(days.map((d) => {
    const ok = cfg.allowed(d);
    return `<button type="button" class="cal-day${d === selected ? ' is-selected' : ''}${d === TODAY ? ' is-today' : ''}"
      data-action="dp-pick" data-field="${field}" data-day="${d}" ${ok ? '' : 'disabled'}
      aria-label="${esc(fmtDay(d))}"${d === selected ? ' aria-current="date"' : ''}>${Number(d.slice(8))}</button>`;
  }));
  return `<div class="cal" role="dialog" aria-label="Calendrier">
    <div class="cal-head">
      <button type="button" class="btn btn-icon" data-action="dp-month" data-step="-1" aria-label="Mois précédent">‹</button>
      <strong>${MONTH_NAMES[m - 1]} ${y}</strong>
      <button type="button" class="btn btn-icon" data-action="dp-month" data-step="1" aria-label="Mois suivant">›</button>
    </div>
    <div class="cal-grid">${['lu', 'ma', 'me', 'je', 've', 'sa', 'di'].map((d) => `<span class="cal-dow" aria-hidden="true">${d}</span>`).join('')}${cells.join('')}</div>
  </div>`;
}

/* ---------- app chrome: navigation banner of the DS ---------- */
function renderHeader() {
  const h = $('#app-header');
  h.hidden = S.route.screen === 'EC-01';
  if (h.hidden) { h.innerHTML = ''; return; }
  const cur = S.route.screen;
  const link = (screen, text, extra = []) => {
    const active = cur === screen || extra.includes(cur);
    return `<a href="#${screen}"${active ? ' aria-current="page"' : ''}>${esc(text)}</a>`;
  };
  h.innerHTML = `<a class="brand" href="#EC-02">${esc(PROTO.app)}</a>
    <nav class="app-nav" aria-label="Navigation principale">
      ${link('EC-02', 'Occupation', ['EC-03', 'EC-04'])}
      ${link('EC-05', 'Mes réservations')}
      ${can('manage-rooms') ? link('EC-06', 'Parc de salles', ['EC-07']) : ''}
    </nav>
    <div class="user"><span class="user-name">${esc(userName(me()))}</span>
      <button class="btn btn-ghost" type="button" data-action="logout">Se déconnecter</button></div>`;
}

/* ---------- screens ---------- */

// EC-01: Connexion (US-001)
function renderEC01() {
  const busy = S.state === 'loading' || S.pending;
  const error = S.state === 'error' || S.login.error;
  return `<section class="login">
    <h1 tabindex="-1">${esc(PROTO.app)}</h1>
    ${error ? `<div class="banner banner-error" role="alert"><p>${esc(MESSAGES['MSG-U01'])}</p></div>` : ''}
    <form class="form" data-form="EC-01" novalidate>
      <fieldset ${busy ? 'disabled' : ''}>
        <div class="field">
          <label for="login-email">Email</label>
          <input id="login-email" name="email" type="email" autocomplete="username" value="${esc(S.login.email)}">
        </div>
        <div class="field">
          <label for="login-pwd">Mot de passe</label>
          <div class="input-with-btn">
            <input id="login-pwd" name="password" type="${S.login.showPwd ? 'text' : 'password'}" autocomplete="current-password">
            <button class="btn btn-icon" type="button" data-action="toggle-pwd" aria-pressed="${S.login.showPwd}"
              aria-label="Afficher le mot de passe">${ICON_EYE}</button>
          </div>
        </div>
        <div class="actions"><button class="btn primary" type="submit"${busy ? ' aria-busy="true"' : ''}>${busy ? spinner : ''}Se connecter</button></div>
      </fieldset>
    </form>
    <p class="demo-note">Démo : lea.martin@example.com (employé) ou paul.schmit@example.com (gestionnaire), tout mot de passe non vide.</p>
  </section>`;
}

// EC-02: Occupation du jour (US-002, US-003, US-017)
const gridDay = () => params(S.route.param).day || TODAY;
function renderEC02() {
  const p = params(S.route.param);
  const day = gridDay();
  const filter = p.room || '';
  const list = activeRooms().filter((r) => !filter || r.id === filter);
  const roomOpts = [['', 'Toutes les salles']].concat(activeRooms().map((r) => [r.id, r.name]));
  const toolbar = `<div class="toolbar">
    <div class="day-nav" role="group" aria-label="Jour affiché">
      <button class="btn btn-icon" type="button" data-go="EC-02/${qs({ ...p, day: addDays(day, -1) })}" aria-label="Jour précédent">‹</button>
      <div class="dp day-pick">
        <button class="btn day-label" type="button" data-action="dp-toggle" data-field="grid-day" aria-expanded="${!!(S.dp && S.dp.field === 'grid-day')}"
          aria-label="Choisir le jour, ${esc(fmtDay(day))}">${ICON_CAL}<span>${esc(fmtDay(day))}</span></button>
        ${S.dp && S.dp.field === 'grid-day' ? calendar('grid-day') : ''}
      </div>
      <button class="btn btn-icon" type="button" data-go="EC-02/${qs({ ...p, day: addDays(day, 1) })}" aria-label="Jour suivant">›</button>
      <button class="btn" type="button" data-go="EC-02/${qs({ ...p, day: null })}"${day === TODAY ? ' aria-current="date"' : ''}>Aujourd'hui</button>
    </div>
    <div class="field field-inline">
      <label for="grid-room">Salle</label>
      ${select('grid-room', 'room', roomOpts, filter, 'data-action="grid-filter"')}
    </div>
  </div>`;
  const head = pageHead('Occupation', `<button class="btn primary" type="button" data-go="EC-03/${qs({ day })}">Chercher une salle</button>`);
  let body;
  if (S.state === 'loading') body = skeleton(1, 'grid');
  else if (S.state === 'error') body = errorBlock(MESSAGES['MSG-U03']);
  else if (!activeRooms().length) {
    body = emptyBlock(MESSAGES['MSG-U02'], can('manage-rooms') ? '<p><a href="#EC-07">Déclarer une salle</a></p>' : '');
  } else body = occupancyGrid(list, day) + freeSlotsList(list, day);
  return head + banner('EC-02') + toolbar + `<section class="panel panel-flush" aria-label="Grille d'occupation">${body}</section>`;
}

// Occupancy grid, complement of the DS described in the UX spec: one row per active room, one column per quarter.
function occupancyGrid(list, day) {
  const weekend = isWeekend(day); // RG-02
  const { r: fr, q: fq } = S.gridFocus;
  let tabDone = false;
  const tab = (r, q0, span) => {
    if (!tabDone && r === Math.min(fr, list.length - 1) && fq >= q0 && fq < q0 + span) { tabDone = true; return 0; }
    return -1;
  };
  const hours = QUARTERS.filter((m) => m % 60 === 0);
  const headRow = `<div class="occ-row occ-head" role="row">
    <div class="occ-room" role="columnheader">Salle</div>
    ${hours.map((m) => `<div class="occ-hour" role="columnheader" style="grid-column: span 4">${fromMin(m)}</div>`).join('')}
  </div>`;
  const rows = list.map((room, r) => {
    const dayBookings = activeBookings().filter((b) => b.room === room.id && b.day === day);
    const cells = [];
    for (let q = 0; q < QUARTERS.length;) {
      const m = QUARTERS[q];
      const b = dayBookings.find((x) => toMin(x.start) === m || (toMin(x.start) < m && toMin(x.end) > m));
      if (b) {
        const q0 = (toMin(b.start) - OPEN) / STEP;
        const span = (toMin(b.end) - toMin(b.start)) / STEP;
        const own = b.user === me();
        cells.push(`<button type="button" role="gridcell" class="cell booking ${own ? 'own' : 'other'}${isOver(b) ? ' is-past' : ''}${S.popover && S.popover.id === b.id ? ' is-open' : ''}"
          style="grid-column: ${q0 + 2} / span ${span}" data-cell data-r="${r}" data-q="${q0}" data-span="${span}" data-booking="${b.id}"
          tabindex="${tab(r, q0, span)}" aria-label="${esc(`${room.name}, ${b.start}, réservée par ${userName(b.user)}`)}" aria-haspopup="dialog">
          <span class="bk-who">${esc(userName(b.user))}</span><span class="bk-when">${esc(slot(b.start, b.end))}</span></button>`);
        q = q0 + span;
      } else {
        const disabled = weekend || isPastSlot(day, m);
        const cls = `cell free${m % 60 === 0 ? ' h' : ''}${disabled ? ' is-off' : ''}`;
        const aria = esc(`${room.name}, ${fromMin(m)}, libre`);
        cells.push(disabled
          ? `<div role="gridcell" class="${cls}" style="grid-column: ${q + 2}" data-cell data-r="${r}" data-q="${q}" data-span="1" tabindex="${tab(r, q, 1)}" aria-label="${aria}" aria-disabled="true"></div>`
          : `<button type="button" role="gridcell" class="${cls}" style="grid-column: ${q + 2}" data-cell data-free data-r="${r}" data-q="${q}" data-span="1" tabindex="${tab(r, q, 1)}" aria-label="${aria}"
              data-go="EC-04/${qs({ room: room.id, day, start: fromMin(m), from: 'EC-02' })}"></button>`);
        q += 1;
      }
    }
    return `<div class="occ-row" role="row">
      <div class="occ-room" role="rowheader"><strong>${esc(room.name)}</strong><span>${esc(capacity(room.capacity))}</span></div>
      ${cells.join('')}
    </div>`;
  }).join('');
  return `${weekend ? `<p class="weekend-note">${esc(LABELS.weekend)}</p>` : ''}
    <div class="occ-scroll">
      <div class="occ" role="grid" aria-label="${esc(`Occupation du ${fmtDay(day)}`)}" aria-rowcount="${list.length + 1}">${headRow}${rows}</div>
    </div>
    <ul class="occ-legend" aria-label="Légende">
      <li><span class="swatch own"></span>Mes réservations</li>
      <li><span class="swatch other"></span>Réservations des autres</li>
      <li><span class="swatch off"></span>Passé ou fermé</li>
    </ul>`;
}

// Below 768 px the grid becomes a list of the free slots per room (UX spec, "Compléments et écarts").
function freeSlotsList(list, day) {
  if (isWeekend(day)) return `<div class="occ-list"></div>`;
  const items = list.map((room) => {
    const busy = activeBookings().filter((b) => b.room === room.id && b.day === day);
    const ranges = [];
    QUARTERS.forEach((m) => {
      const free = !isPastSlot(day, m) && !busy.some((b) => toMin(b.start) <= m && toMin(b.end) > m);
      const last = ranges[ranges.length - 1];
      if (!free) return;
      if (last && last.end === m) last.end = m + STEP; else ranges.push({ start: m, end: m + STEP });
    });
    return `<li><div class="occ-room"><strong>${esc(room.name)}</strong><span>${esc(capacity(room.capacity))}</span></div>
      <div class="chips">${ranges.map((x) => `<button type="button" class="chip" data-go="EC-04/${qs({ room: room.id, day, start: fromMin(x.start), from: 'EC-02' })}">${esc(slot(fromMin(x.start), fromMin(x.end)))}</button>`).join('')}</div></li>`;
  }).join('');
  return `<ul class="occ-list" aria-label="Créneaux libres">${items}</ul>`;
}

// EC-02 tooltip on a reservation, with "Annuler avec un motif" for the manager (RG-07, RG-11).
function renderPopover() {
  const p = S.popover;
  const b = p && S.bookings.find((x) => x.id === p.id);
  if (!b) return '';
  const room = roomById(b.room);
  const action = can('cancel-any') && !hasStarted(b)
    ? `<button class="btn btn-danger btn-sm" type="button" data-action="open-motif" data-id="${b.id}">Annuler avec un motif</button>` : '';
  return `<div class="popover" role="dialog" aria-label="Réservation" style="top:${p.top}px;left:${p.left}px">
    <p class="pop-who">${esc(userName(b.user))}</p>
    <p>${esc(room.name)}</p>
    <p>${esc(fmtDay(b.day))}, ${esc(slot(b.start, b.end))}</p>
    <div class="pop-actions">${action}<button class="btn btn-sm" type="button" data-action="popover-close">Fermer</button></div>
  </div>`;
}

// EC-03: Recherche de salle (US-004)
function initSearch(p) {
  const day = bookableDay(p.day) ? p.day : firstBookableDay();
  const start = startOptions(day)[0];
  S.search = { day: fmtDate(day), start: fromMin(start), end: fromMin(Math.min(start + 60, CLOSE)), people: 4, equipment: [], results: null };
  S.search.results = searchRooms();
}
// RG-09: active rooms, free on the whole slot, big enough, with every equipment asked; by capacity.
function searchRooms() {
  const s = S.search;
  const day = parseDate(s.day);
  if (!bookableDay(day)) return [];
  const a = toMin(s.start);
  const b = toMin(s.end);
  return activeRooms()
    .filter((r) => r.capacity >= Number(s.people || 0) && s.equipment.every((e) => r.equipment.includes(e)) && !conflictFor(r.id, day, a, b))
    .sort((x, y) => x.capacity - y.capacity);
}
function renderEC03() {
  if (!S.search) initSearch(params(S.route.param));
  const s = S.search;
  const day = parseDate(s.day);
  const starts = bookableDay(day) ? startOptions(day) : QUARTERS;
  const criteria = `<form class="panel criteria" data-form="EC-03" novalidate>
    <div class="criteria-grid">
      ${datePicker('search-day', 's-day', 'Jour', s.day, !bookableDay(day))}
      <div class="field"><label for="s-start">Début</label>${select('s-start', 'start', timeOptions(starts), s.start, 'data-search')}</div>
      <div class="field"><label for="s-end">Fin</label>${select('s-end', 'end', timeOptions(endOptions(toMin(s.start))), s.end, 'data-search')}</div>
      <div class="field"><label for="s-people">Participants</label><input id="s-people" name="people" type="number" min="1" max="200" value="${esc(s.people)}" data-search></div>
    </div>
    <fieldset class="checks"><legend>Équipements</legend>
      ${Object.entries(EQUIPMENT).map(([k, v]) => `<label><input type="checkbox" name="equipment" value="${k}"${s.equipment.includes(k) ? ' checked' : ''} data-search> ${esc(v)}</label>`).join('')}
    </fieldset>
    <div class="actions"><button class="btn primary" type="submit">Chercher</button></div>
  </form>`;
  let body;
  if (S.state === 'loading') body = skeleton(3);
  else if (S.state === 'error') body = errorBlock(MESSAGES['MSG-U05']);
  else if (!s.results.length) body = emptyBlock(MESSAGES['MSG-U04']);
  else {
    body = `<table class="table">
      <thead><tr><th>Salle</th><th>Capacité</th><th>Équipements</th><th><span class="sr-only">Action</span></th></tr></thead>
      <tbody>${s.results.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(capacity(r.capacity))}</td><td>${esc(equipmentList(r.equipment))}</td>
        <td class="cell-action"><button class="btn btn-sm" type="button" data-go="EC-04/${qs({ room: r.id, day: parseDate(s.day), start: s.start, end: s.end, from: 'EC-03' })}">Réserver</button></td></tr>`).join('')}</tbody>
    </table>`;
  }
  return pageHead('Chercher une salle') + criteria + `<section class="panel" aria-label="Salles trouvées" aria-live="polite">${body}</section>`;
}

// EC-04: Réservation (US-005, US-006)
function initForm(p) {
  const room = activeRooms().find((r) => r.id === p.room) ? p.room : (activeRooms()[0] || {}).id;
  const day = bookableDay(p.day) ? p.day : firstBookableDay();
  const starts = startOptions(day);
  const start = p.start && starts.includes(toMin(p.start)) ? toMin(p.start) : starts[0];
  const ends = endOptions(start);
  const end = p.end && ends.includes(toMin(p.end)) ? toMin(p.end) : Math.min(start + 60, ends[ends.length - 1]); // +1 h by default
  S.form = { room, day: fmtDate(day), start: fromMin(start), end: fromMin(end), repeat: 'none', until: '', from: p.from || 'EC-02' };
}
// Keep "Début" and "Fin" inside what the selectors offer when the day or the start changes (RG-02, RG-03).
function fixFormTimes() {
  const f = S.form;
  const day = parseDate(f.day);
  if (!bookableDay(day)) return;
  const starts = startOptions(day);
  if (!starts.includes(toMin(f.start))) f.start = fromMin(starts[0]);
  const ends = endOptions(toMin(f.start));
  if (!ends.includes(toMin(f.end))) f.end = fromMin(Math.min(toMin(f.start) + 60, ends[ends.length - 1]));
}
function formCheck() {
  const f = S.form;
  const day = parseDate(f.day);
  const dayOk = bookableDay(day);
  const start = toMin(f.start);
  const end = toMin(f.end);
  const timesOk = dayOk && startOptions(day).includes(start) && endOptions(start).includes(end);
  const until = parseDate(f.until);
  const series = f.repeat !== 'none';
  const untilOk = !series || (dayOk && !!until && until >= day && until <= addMonths(day, RULES.seriesMonths)); // RG-04
  const occ = series && dayOk && untilOk ? occurrences(day, f.repeat, until) : null;
  return { day, dayOk, start, end, timesOk, until, untilOk, series, occ, ok: !!f.room && dayOk && timesOk && untilOk };
}
function renderEC04() {
  if (S.formKey !== S.route.param || !S.form) { initForm(params(S.route.param)); S.formKey = S.route.param; }
  const f = S.form;
  const c = formCheck();
  const busy = S.state === 'loading' || S.pending;
  const starts = c.dayOk ? startOptions(c.day) : QUARTERS;
  const errorBanner = S.state === 'error'
    ? `<div class="banner banner-error" role="alert"><p>${esc(MESSAGES['MSG-U06'])}</p><button class="btn btn-sm" type="button" data-action="retry">Réessayer</button></div>`
    : banner('EC-04');
  const roomOpts = activeRooms().map((r) => [r.id, `${r.name} (${capacity(r.capacity)})`]);
  return pageHead('Réservation') + errorBanner + `<form class="panel form" data-form="EC-04" novalidate>
    <fieldset ${busy ? 'disabled' : ''}>
      <div class="field"><label for="f-room">Salle</label>${select('f-room', 'room', roomOpts, f.room, 'data-form-field')}</div>
      ${datePicker('form-day', 'f-day', 'Jour', f.day, !c.dayOk)}
      <div class="row-2">
        <div class="field"><label for="f-start">Début</label>${select('f-start', 'start', timeOptions(starts), f.start, 'data-form-field')}</div>
        <div class="field"><label for="f-end">Fin</label>${select('f-end', 'end', timeOptions(endOptions(toMin(f.start))), f.end, 'data-form-field')}</div>
      </div>
      <div class="field"><label for="f-repeat">Répéter</label>${select('f-repeat', 'repeat', [['none', 'Non'], ['daily', 'Chaque jour ouvré'], ['weekly', 'Chaque semaine']], f.repeat, 'data-form-field')}</div>
      ${c.series ? `${datePicker('form-until', 'f-until', 'Jusqu\'au', f.until, !!f.until && !c.untilOk)}
        ${c.occ ? `<p class="recap" id="f-recap" aria-live="polite">${esc(label('occurrences', { n: c.occ.length }))}</p>` : ''}` : ''}
      <div class="actions">
        <button class="btn" type="button" data-action="form-back">Retour</button>
        <button class="btn primary" type="submit" ${c.ok && !busy ? '' : 'disabled'}${busy ? ' aria-busy="true"' : ''}>${busy ? spinner : ''}Réserver</button>
      </div>
    </fieldset>
  </form>`;
}

// EC-05: Mes réservations (US-007, US-008, US-009)
function myItems() {
  const since = addDays(TODAY, -RULES.cancelledVisibleDays);
  return bookings().filter((b) => b.user === me() && (
    (b.status === 'active' && !isOver(b))
    || (b.status === 'annulee' && b.reason && b.cancelledOn >= since) // cancelled by the manager or by deactivation, 7 days
  )).sort((a, b) => (a.day + a.start).localeCompare(b.day + b.start));
}
function renderEC05() {
  const head = pageHead('Mes réservations');
  if (S.state === 'loading') return head + `<section class="panel">${skeleton(3)}</section>`;
  if (S.state === 'error') return head + `<section class="panel">${errorBlock(MESSAGES['MSG-U08'])}</section>`;
  const items = myItems();
  if (!items.length) return head + banner('EC-05') + `<section class="panel">${emptyBlock(MESSAGES['MSG-U07'], '<p><a href="#EC-02">Voir l\'occupation</a></p>')}</section>`;
  const days = [...new Set(items.map((b) => b.day))];
  return head + banner('EC-05') + days.map((day) => `<section class="panel day-group" aria-labelledby="d-${day}">
    <h2 id="d-${day}">${esc(fmtDay(day))}</h2>
    <ul class="booking-list">${items.filter((b) => b.day === day).map((b) => {
      const cancelled = b.status === 'annulee';
      const room = roomById(b.room);
      return `<li class="booking-item${cancelled ? ' is-cancelled' : ''}${S.flash && S.flash.includes(b.id) ? ' flash' : ''}">
        <span class="bi-when">${esc(slot(b.start, b.end))}</span>
        <span class="bi-room">${esc(room.name)}${b.series ? ` <span class="tag tag-series">${esc(LABELS.badgeSeries)}</span>` : ''}</span>
        ${cancelled ? `<span class="bi-note">${esc(msg('MSG-05', { motif: b.reason }))}</span>` : ''}
        <span class="bi-action">${!cancelled && !hasStarted(b) ? `<button class="btn btn-sm" type="button" data-action="open-cancel" data-id="${b.id}">Annuler</button>` : ''}</span>
      </li>`;
    }).join('')}</ul>
  </section>`).join('');
}

// EC-06: Parc de salles (US-014, US-015, US-016)
function renderEC06() {
  const head = pageHead('Parc de salles', '<button class="btn primary" type="button" data-go="EC-07">Nouvelle salle</button>');
  if (S.state === 'loading') return head + `<section class="panel">${skeleton(5)}</section>`;
  if (S.state === 'error') return head + `<section class="panel">${errorBlock(MESSAGES['MSG-U09'])}</section>`;
  const list = [...rooms()].sort((a, b) => Number(b.active) - Number(a.active)); // désactivées last
  if (!list.length) return head + banner('EC-06') + `<section class="panel">${emptyBlock(MESSAGES['MSG-U02'], '<p><button class="btn" type="button" data-go="EC-07">Nouvelle salle</button></p>')}</section>`;
  return head + banner('EC-06') + `<section class="panel panel-scroll"><table class="table">
    <thead><tr><th>Nom</th><th>Capacité</th><th>Équipements</th><th>Statut</th><th><span class="sr-only">Actions</span></th></tr></thead>
    <tbody>${list.map((r) => `<tr${r.active ? '' : ' class="is-muted"'}>
      <td>${esc(r.name)}</td><td>${esc(capacity(r.capacity))}</td><td>${esc(equipmentList(r.equipment))}</td>
      <td>${r.active ? '<span class="tag tag-ok">Active</span>' : '<span class="tag tag-muted">Désactivée</span>'}</td>
      <td class="cell-action">
        <button class="btn btn-sm" type="button" data-go="EC-07/${r.id}">Modifier</button>
        ${r.active ? `<button class="btn btn-sm btn-danger-ghost" type="button" data-action="open-disable" data-id="${r.id}">Désactiver</button>` : ''}
      </td></tr>`).join('')}</tbody>
  </table></section>`;
}

// EC-07: Fiche salle (US-014, US-015)
function renderEC07(id) {
  const existing = id ? roomById(id) : null;
  if (S.roomKey !== (id || 'new') || !S.room) {
    S.room = existing ? { name: existing.name, capacity: existing.capacity, equipment: [...existing.equipment], errors: {} }
      : { name: '', capacity: '', equipment: [], errors: {} };
    S.roomKey = id || 'new';
  }
  const head = pageHead('Fiche salle');
  if (S.state === 'loading' && existing) return head + `<section class="panel">${skeleton(4, 'field')}</section>`;
  const busy = S.state === 'loading' || S.pending;
  const r = S.room;
  const errorBanner = S.state === 'error'
    ? `<div class="banner banner-error" role="alert"><p>${esc(MESSAGES['MSG-U11'])}</p><button class="btn btn-sm" type="button" data-action="retry">Réessayer</button></div>` : '';
  return head + errorBanner + `<form class="panel form" data-form="EC-07" data-id="${esc(id || '')}" novalidate>
    <fieldset ${busy ? 'disabled' : ''}>
      <div class="field">
        <label for="r-name">Nom</label>
        <input id="r-name" name="name" maxlength="60" value="${esc(r.name)}" aria-invalid="${r.errors.name ? 'true' : 'false'}" aria-describedby="r-name-err">
        <p class="field-error" id="r-name-err"${r.errors.name === 'taken' ? '' : ' hidden'}>${esc(MESSAGES['MSG-07'])}</p>
      </div>
      <div class="field">
        <label for="r-cap">Capacité</label>
        <input id="r-cap" name="capacity" type="number" min="1" max="200" value="${esc(r.capacity)}" aria-invalid="${r.errors.capacity ? 'true' : 'false'}">
      </div>
      <fieldset class="checks"><legend>Équipements</legend>
        ${Object.entries(EQUIPMENT).map(([k, v]) => `<label><input type="checkbox" name="equipment" value="${k}"${r.equipment.includes(k) ? ' checked' : ''}> ${esc(v)}</label>`).join('')}
      </fieldset>
      <div class="actions">
        <button class="btn" type="button" data-go="EC-06">Retour</button>
        <button class="btn primary" type="submit"${busy ? ' aria-busy="true"' : ''}>${busy ? spinner : ''}Enregistrer</button>
      </div>
    </fieldset>
  </form>`;
}

/* ---------- dialogs (DS "Dialogue": title, text, two buttons, Échap closes, focus trapped) ---------- */
function dialogShell(id, title, body, actions) {
  return `<div class="overlay" data-action="overlay">
    <div class="dialog" role="dialog" aria-modal="true" id="${id}" aria-labelledby="${id}-title" aria-describedby="${id}-desc">
      <h2 id="${id}-title">${esc(title)}</h2>
      <div id="${id}-desc">${body}</div>
      <div class="dialog-actions">${actions}</div>
    </div>
  </div>`;
}
const recap = (b) => `<dl class="fields">
  <dt>Salle</dt><dd>${esc(roomById(b.room).name)}</dd>
  <dt>Jour</dt><dd>${esc(fmtDay(b.day))}</dd>
  <dt>Horaire</dt><dd>${esc(slot(b.start, b.end))}</dd>
  ${b.user !== me() ? `<dt>Titulaire</dt><dd>${esc(userName(b.user))}</dd>` : ''}
</dl>`;
const futureOfSeries = (b) => activeBookings().filter((x) => x.series && x.series === b.series && !hasStarted(x));

const DIALOGS = {
  // EC-02-motif: the manager cancels a reservation with a mandatory reason (RG-07)
  'EC-02-motif': (d) => {
    const b = S.bookings.find((x) => x.id === d.id);
    return dialogShell('EC-02-motif', 'Annuler avec un motif', `${recap(b)}
      <div class="field"><label for="motif">Motif</label>
        <textarea id="motif" name="motif" maxlength="200" rows="3" data-motif>${esc(d.motif || '')}</textarea></div>`,
    `<button class="btn" type="button" data-action="dialog-close" data-autofocus>Fermer</button>
     <button class="btn btn-danger" type="button" data-action="confirm-motif" ${d.motif && d.motif.trim() ? '' : 'disabled'}>Annuler la réservation</button>`);
  },
  // EC-04-conflits: occurrences of the series already taken (RG-05, MSG-04)
  'EC-04-conflits': (d) => dialogShell('EC-04-conflits', 'Conflits de la série',
    `<p>${esc(msg('MSG-04', { n: d.conflicts.length, total: d.all.length }))}</p>
     <ul class="date-list">${d.conflicts.map((x) => `<li>${esc(fmtDate(x))}</li>`).join('')}</ul>`,
    `<button class="btn primary" type="button" data-action="confirm-series" data-autofocus ${d.all.length - d.conflicts.length ? '' : 'disabled'}>${esc(label('createFree', { n: d.all.length - d.conflicts.length }))}</button>
     <button class="btn" type="button" data-action="dialog-close">Revenir au formulaire</button>`),
  // EC-05-annuler: the holder cancels one occurrence or the rest of the series (RG-03, RG-06)
  'EC-05-annuler': (d) => {
    const b = S.bookings.find((x) => x.id === d.id);
    const rest = b.series ? futureOfSeries(b).length : 0;
    const choice = b.series ? `<fieldset class="checks checks-col"><legend>Annuler</legend>
      <label><input id="scope-one" type="radio" name="scope" value="one"${d.scope !== 'series' ? ' checked' : ''} data-scope> Cette occurrence</label>
      <label><input id="scope-series" type="radio" name="scope" value="series"${d.scope === 'series' ? ' checked' : ''} data-scope> ${esc(LABELS.seriesAll)} (${esc(label('occurrences', { n: rest }))})</label>
    </fieldset>` : '';
    return dialogShell('EC-05-annuler', 'Annuler la réservation', recap(b) + choice,
      `<button class="btn btn-danger" type="button" data-action="confirm-cancel">Confirmer l'annulation</button>
       <button class="btn" type="button" data-action="dialog-close" data-autofocus>Garder</button>`);
  },
  // EC-06-desactiver: deactivating a room cancels its future reservations (RG-08)
  'EC-06-desactiver': (d) => {
    const room = roomById(d.id);
    const n = futureOfRoom(room.id).length;
    return dialogShell('EC-06-desactiver', 'Désactiver la salle', `<dl class="fields"><dt>Salle</dt><dd>${esc(room.name)}</dd></dl><p>${esc(msg('MSG-08', { n }))}</p>`,
      `<button class="btn btn-danger" type="button" data-action="confirm-disable">Désactiver la salle</button>
       <button class="btn" type="button" data-action="dialog-close" data-autofocus>Garder la salle</button>`);
  },
};
const futureOfRoom = (roomId) => S.bookings.filter((b) => b.room === roomId && b.status === 'active' && !hasStarted(b)); // RG-08 keeps the one in progress

function openDialog(d) { S.dialog = d; S.popover = null; S.dp = null; render(); }
function closeDialog() { const opener = S.dialog && S.dialog.openerSel; S.dialog = null; render(); if (opener) { const el = $(opener); if (el) el.focus(); } }

/* ---------- screen registry: the EC-xx ids of the UX spec ---------- */
const SCREENS = {
  'EC-01': { title: 'Connexion', render: renderEC01 },
  'EC-02': { title: 'Occupation du jour', render: renderEC02 },
  'EC-03': { title: 'Recherche de salle', render: renderEC03 },
  'EC-04': { title: 'Réservation', render: renderEC04 },
  'EC-05': { title: 'Mes réservations', render: renderEC05 },
  'EC-06': { title: 'Parc de salles', render: renderEC06, role: 'manage-rooms' },
  'EC-07': { title: 'Fiche salle', render: renderEC07, role: 'manage-rooms' },
};

/* ---------- render ---------- */
let lastScreen = null;
function render() {
  const route = parseHash();
  // No session: every page leads to EC-01, then back to the page asked (EC-01, "Accès").
  if (!S.session && route.screen !== 'EC-01') { S.returnTo = location.hash; location.replace('#EC-01'); return; }
  // Insufficient rights: EC-06 and EC-07 by URL send the employee back to EC-02 with MSG-U10.
  const needs = SCREENS[route.screen].role;
  if (needs && !can(needs)) {
    S.banner = { screen: 'EC-02', tone: 'error', text: MESSAGES['MSG-U10'] };
    location.replace('#EC-02');
    return;
  }
  const changed = route.screen !== lastScreen;
  S.route = route;
  const active = document.activeElement;
  const focusId = active && active.id && !changed ? active.id : null;
  const screen = SCREENS[route.screen];
  const view = $('#view');
  view.dataset.screen = route.screen;
  renderHeader();
  view.innerHTML = screen.render(route.param);
  $('#dialog').innerHTML = (S.dialog ? DIALOGS[S.dialog.type](S.dialog) : '') + renderPopover();
  document.title = `${screen.title} · ${PROTO.app}`;
  if (S.dialog) {
    const dlg = $('#dialog .dialog');
    const keep = focusId && document.getElementById(focusId);
    if (keep && dlg.contains(keep)) keep.focus(); else { const af = $('[data-autofocus]', dlg); if (af) af.focus(); }
  } else if (focusId && document.getElementById(focusId)) {
    document.getElementById(focusId).focus();
  } else if (changed) {
    if (route.screen === 'EC-01' && S.state === 'ok') { const e = $('#login-email'); if (e) e.focus(); } else { const h = $('#view h1'); if (h) h.focus({ preventScroll: true }); }
  }
  lastScreen = route.screen;
}

/* ---------- actions ---------- */
function fakeSave(done) { // short round trip so that the "saving" state is seen
  S.pending = true; render();
  setTimeout(() => { S.pending = false; done(); }, 450);
}

function createBookings(days) {
  const f = S.form;
  const series = days.length > 1 || f.repeat !== 'none' ? newId('s') : null;
  const created = days.map((day) => ({ id: newId('b'), room: f.room, user: me(), day, start: f.start, end: f.end, status: 'active', series }));
  S.bookings.push(...created);
  saveData();
  const first = created[0];
  S.banner = { screen: 'EC-05', tone: 'ok', text: msg('MSG-02', { salle: roomById(first.room).name, date: fmtDate(first.day), 'début': first.start, fin: first.end }) };
  S.flash = created.map((b) => b.id);
  setTimeout(() => { S.flash = null; }, 1200);
  S.form = null; S.formKey = null; S.search = null;
  go('EC-05');
}

function submitBooking() {
  const c = formCheck();
  if (!c.ok) return;
  const f = S.form;
  fakeSave(() => {
    if (S.server === 'rules') { S.banner = { screen: 'EC-04', tone: 'error', text: MESSAGES['MSG-03'] }; render(); return; } // RG-02
    if (!c.series) {
      const hit = conflictFor(f.room, c.day, c.start, c.end); // RG-01, the server stays judge
      if (hit) { S.banner = { screen: 'EC-04', tone: 'error', text: msg('MSG-01', { nom: roomById(f.room).name, 'début': hit.start, fin: hit.end }) }; render(); return; }
      createBookings([c.day]);
      return;
    }
    const conflicts = c.occ.filter((d) => conflictFor(f.room, d, c.start, c.end)); // RG-05
    if (conflicts.length) { openDialog({ type: 'EC-04-conflits', all: c.occ, conflicts, openerSel: '#view button[type=submit]' }); return; }
    createBookings(c.occ);
  });
}

/* ---------- events (delegated, so render can replace the DOM freely) ---------- */
document.addEventListener('click', (e) => {
  const t = e.target;
  // close the date picker and the tooltip when clicking elsewhere
  if (S.dp && !t.closest('.dp')) { S.dp = null; render(); }
  if (S.popover && !t.closest('.popover') && !t.closest('[data-booking]')) { S.popover = null; render(); }

  const nav = t.closest('[data-go]');
  if (nav) { const v = nav.dataset.go; const i = v.indexOf('/'); go(i < 0 ? v : v.slice(0, i), i < 0 ? null : v.slice(i + 1)); return; }

  const bk = t.closest('[data-booking]');
  if (bk) {
    const rect = bk.getBoundingClientRect();
    S.popover = S.popover && S.popover.id === bk.dataset.booking ? null : {
      id: bk.dataset.booking,
      top: Math.round(rect.bottom + 6),
      left: Math.round(Math.max(8, Math.min(rect.left, window.innerWidth - 280))),
      opener: `[data-booking="${bk.dataset.booking}"]`,
    };
    S.gridFocus = { r: Number(bk.dataset.r), q: Number(bk.dataset.q) };
    render();
    const btn = $('.popover button');
    if (btn) btn.focus({ preventScroll: true });
    return;
  }

  const a = t.closest('[data-action]');
  if (!a) return;
  const act = a.dataset.action;
  if (act === 'overlay' && t === a) { closeDialog(); return; }
  if (act === 'retry') { S.state = 'ok'; S.banner = null; ProtoBar.set('__state', 'ok'); render(); return; }
  if (act === 'banner-close') { S.banner = null; render(); return; }
  if (act === 'logout') { S.session = false; store.set('session', false); S.returnTo = null; S.login = { email: '', error: false, showPwd: false }; go('EC-01'); return; }
  if (act === 'toggle-pwd') {
    const pwd = $('#login-pwd').value; S.login.showPwd = !S.login.showPwd; render(); $('#login-pwd').value = pwd; $('#login-pwd').focus(); return;
  }
  if (act === 'dp-toggle') {
    const field = a.dataset.field;
    if (S.dp && S.dp.field === field) S.dp = null;
    else { const cur = DATE_FIELDS[field].get() || TODAY; S.dp = { field, month: cur.slice(0, 7) }; }
    render();
    const sel = $('.cal .is-selected:not([disabled])') || $('.cal-day:not([disabled])');
    if (sel) sel.focus();
    return;
  }
  if (act === 'dp-month') {
    const [y, m] = S.dp.month.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1 + Number(a.dataset.step), 1));
    S.dp.month = toIso(d).slice(0, 7); render(); return;
  }
  if (act === 'dp-pick') {
    const field = a.dataset.field; S.dp = null; DATE_FIELDS[field].set(a.dataset.day); render();
    const input = $(`[data-date="${field}"]`); if (input) input.focus();
    return;
  }
  if (act === 'popover-close') { const sel = S.popover.opener; S.popover = null; render(); const el = $(sel); if (el) el.focus(); return; }
  if (act === 'open-motif') { openDialog({ type: 'EC-02-motif', id: a.dataset.id, motif: '', openerSel: `[data-booking="${a.dataset.id}"]` }); return; }
  if (act === 'confirm-motif') { // RG-07: the slot becomes free, the holder sees the reason on EC-05 (MSG-05)
    const b = S.bookings.find((x) => x.id === S.dialog.id);
    Object.assign(b, { status: 'annulee', reason: S.dialog.motif.trim(), cancelledOn: TODAY });
    saveData(); S.dialog = null; render(); return;
  }
  if (act === 'confirm-series') {
    const d = S.dialog; S.dialog = null;
    createBookings(d.all.filter((x) => !d.conflicts.includes(x)));
    return;
  }
  if (act === 'open-cancel') { openDialog({ type: 'EC-05-annuler', id: a.dataset.id, scope: 'one', openerSel: `[data-id="${a.dataset.id}"]` }); return; }
  if (act === 'confirm-cancel') { // RG-06: one occurrence or every future occurrence of the series
    const b = S.bookings.find((x) => x.id === S.dialog.id);
    const targets = S.dialog.scope === 'series' ? futureOfSeries(b) : [b];
    targets.forEach((x) => { x.status = 'annulee'; x.reason = null; x.cancelledOn = TODAY; });
    saveData(); S.dialog = null; render(); const h = $('#view h1'); if (h) h.focus(); return;
  }
  if (act === 'open-disable') { openDialog({ type: 'EC-06-desactiver', id: a.dataset.id, openerSel: `[data-action="open-disable"][data-id="${a.dataset.id}"]` }); return; }
  if (act === 'confirm-disable') { // RG-08
    const room = roomById(S.dialog.id);
    const cancelled = futureOfRoom(room.id);
    cancelled.forEach((b) => Object.assign(b, { status: 'annulee', reason: LABELS.defaultMotifDisable, cancelledOn: TODAY }));
    room.active = false;
    saveData();
    S.banner = { screen: 'EC-06', tone: 'ok', text: msg('MSG-06', { nom: room.name, n: cancelled.length }) };
    S.dialog = null; render(); const h = $('#view h1'); if (h) h.focus(); return;
  }
  if (act === 'dialog-close') { closeDialog(); return; }
  if (act === 'form-back') {
    const f = S.form; const day = parseDate(f.day);
    S.form = null; S.formKey = null;
    go(f.from === 'EC-03' ? 'EC-03' : 'EC-02', f.from === 'EC-03' ? null : qs({ day: day && day !== TODAY ? day : null }));
  }
});

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.matches('[data-action="grid-filter"]')) { go('EC-02', qs({ ...params(S.route.param), room: t.value || null })); return; }
  if (t.matches('[data-date]')) { // typed JJ.MM.AAAA
    const field = t.dataset.date;
    if (field === 'search-day') S.search.day = t.value.trim();
    if (field === 'form-day') { S.form.day = t.value.trim(); fixFormTimes(); }
    if (field === 'form-until') S.form.until = t.value.trim();
    render(); return;
  }
  if (t.matches('[data-form-field]')) {
    S.form[t.name] = t.value;
    if (t.name === 'start') fixFormTimes();
    if (t.name === 'repeat' && t.value === 'none') S.form.until = '';
    S.banner = null;
    render(); return;
  }
  if (t.matches('[data-search]')) {
    const s = S.search;
    if (t.name === 'equipment') s.equipment = [...t.form.querySelectorAll('[name="equipment"]:checked')].map((x) => x.value);
    else s[t.name] = t.value;
    if (t.name === 'start') { const ends = endOptions(toMin(s.start)); if (!ends.includes(toMin(s.end))) s.end = fromMin(Math.min(toMin(s.start) + 60, ends[ends.length - 1])); }
    render(); return;
  }
  if (t.matches('[data-scope]')) { S.dialog.scope = t.value; render(); }
});

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.matches('[data-motif]')) { // "Annuler la réservation" stays disabled while the reason is empty
    S.dialog.motif = t.value;
    $('[data-action="confirm-motif"]').disabled = !t.value.trim();
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target;
  e.preventDefault();
  if (form.dataset.form === 'EC-01') {
    const email = form.elements.namedItem('email').value.trim();
    const pwd = form.elements.namedItem('password').value;
    const id = Object.keys(USERS).find((k) => USERS[k].email === email.toLowerCase());
    const profile = id && Object.keys(PROFILES).find((p) => PROFILES[p].user === id);
    S.login.email = email;
    fakeSave(() => {
      if (!profile || !pwd) { S.login.error = true; render(); $('#login-pwd').focus(); return; } // password emptied, email kept
      S.login = { email: '', error: false, showPwd: false };
      S.session = true; store.set('session', true);
      S.profile = profile; savePrefs(); ProtoBar.set('profile', profile);
      const back = S.returnTo; S.returnTo = null;
      location.hash = back && back !== '#EC-01' ? back : '#EC-02';
    });
  }
  if (form.dataset.form === 'EC-03') { S.search.results = searchRooms(); render(); }
  if (form.dataset.form === 'EC-04') {
    if (S.state === 'error') return;
    submitBooking();
  }
  if (form.dataset.form === 'EC-07') {
    const r = S.room;
    r.name = form.elements.namedItem('name').value.trim();
    r.capacity = form.elements.namedItem('capacity').value;
    r.equipment = [...form.querySelectorAll('[name="equipment"]:checked')].map((x) => x.value);
    const id = form.dataset.id;
    const cap = Number(r.capacity);
    r.errors = {
      name: !r.name ? 'empty' : (S.rooms.some((x) => x.active && x.id !== id && x.name.toLowerCase() === r.name.toLowerCase()) ? 'taken' : null), // RG-10
      capacity: !(Number.isInteger(cap) && cap >= 1 && cap <= 200) ? 'range' : null,
    };
    if (r.errors.name || r.errors.capacity) { render(); $(r.errors.name ? '#r-name' : '#r-cap').focus(); return; }
    if (S.state === 'error') return;
    fakeSave(() => {
      if (id) Object.assign(roomById(id), { name: r.name, capacity: cap, equipment: r.equipment });
      else S.rooms.push({ id: newId('r'), name: r.name, capacity: cap, equipment: r.equipment, active: true });
      if (S.dataset === 'empty') { S.dataset = 'full'; savePrefs(); ProtoBar.set('dataset', 'full'); }
      saveData(); S.room = null; S.roomKey = null;
      go('EC-06');
    });
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (S.dialog) { e.preventDefault(); closeDialog(); return; }
    if (S.dp) { const f = S.dp.field; S.dp = null; render(); const b = $(`[data-action="dp-toggle"][data-field="${f}"]`); if (b) b.focus(); return; }
    if (S.popover) { const sel = S.popover.opener; S.popover = null; render(); const el = $(sel); if (el) el.focus(); return; }
  }
  // focus trap inside the dialog
  if (e.key === 'Tab' && S.dialog) {
    const f = [...document.querySelectorAll('#dialog .dialog :is(button, input, textarea, select):not([disabled])')];
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    return;
  }
  // EC-02 grid: arrows move one cell, Enter opens it (UX spec, "Accessibilité")
  const cell = e.target.closest && e.target.closest('[data-cell]');
  if (!cell) return;
  const moves = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
  if (!moves[e.key]) return;
  e.preventDefault();
  const r = Number(cell.dataset.r);
  const q0 = Number(cell.dataset.q);
  const span = Number(cell.dataset.span);
  const [dr, dq] = moves[e.key];
  const keepQ = S.gridFocus.r === r && S.gridFocus.q >= q0 && S.gridFocus.q < q0 + span ? S.gridFocus.q : q0;
  const targetR = r + dr;
  const targetQ = dq > 0 ? q0 + span : dq < 0 ? q0 - 1 : keepQ;
  const target = [...document.querySelectorAll(`.occ [data-cell][data-r="${targetR}"]`)]
    .find((x) => targetQ >= Number(x.dataset.q) && targetQ < Number(x.dataset.q) + Number(x.dataset.span));
  if (!target) return;
  cell.tabIndex = -1; target.tabIndex = 0; target.focus();
  S.gridFocus = { r: targetR, q: dr ? keepQ : targetQ };
});

// Hover micro-interaction of EC-02: the free cell and the default end (+1 h) light up.
document.addEventListener('mouseover', (e) => {
  const c = e.target.closest && e.target.closest('[data-free]');
  document.querySelectorAll('.occ .is-hover').forEach((x) => x.classList.remove('is-hover'));
  if (!c) return;
  const r = c.dataset.r;
  const q = Number(c.dataset.q);
  for (let i = q; i < q + 4; i += 1) {
    const x = document.querySelector(`.occ [data-free][data-r="${r}"][data-q="${i}"]`);
    if (!x) break;
    x.classList.add('is-hover');
  }
});
window.addEventListener('scroll', () => { if (S.popover) { S.popover = null; render(); } }, { passive: true });

window.addEventListener('hashchange', () => {
  const next = parseHash().screen;
  if (S.banner && S.banner.screen !== next) S.banner = null;
  if (next !== 'EC-03') S.search = next === 'EC-04' ? S.search : null;
  if (next !== 'EC-07') { S.room = null; S.roomKey = null; }
  S.popover = null; S.dp = null; S.dialog = null;
  render();
});

/* ---------- proto bar ---------- */
ProtoBar.mount({
  title: PROTO.title,
  version: PROTO.version,
  date: PROTO.date,
  storagePrefix: PROTO.prefix,
  onState: (v) => { S.state = v; if (v === 'ok' && S.banner && S.banner.retry) S.banner = null; render(); },
  controls: [
    { type: 'seg', id: 'profile', label: 'Profil', value: S.profile,
      options: Object.entries(PROFILES).map(([k, p]) => [k, p.label]),
      onChange: (v) => { S.profile = v; savePrefs(); S.popover = null; S.dialog = null; render(); } },
    { type: 'seg', id: 'dataset', label: 'Données', value: S.dataset,
      options: [['full', 'Avec'], ['empty', 'Aucune']],
      onChange: (v) => { S.dataset = v; savePrefs(); S.search = null; render(); } },
    { type: 'seg', id: 'server', label: 'Serveur', value: S.server,
      options: [['ok', 'Accepte'], ['rules', 'Refuse']],
      onChange: (v) => { S.server = v; render(); } },
  ],
});

render();
