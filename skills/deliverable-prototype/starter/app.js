/* Prototype PROJECT_NAME: state, routing and rendering.
   One screen = one render function named after its SCR-xx id, returning an HTML string.
   One dialog = one entry of DIALOGS, named after its anchor in the UX spec (SCR-02-delete).
   Data lives in data.js, the proto bar in proto-bar.js (copied from the proto-bar skill, never edited). */

/* ---------- config ---------- */
const PROTO = {
  title: 'PROJECT_NAME, prototype',
  version: 'v1',
  date: '2026-10-01',
  lang: 'en', // project language (.team/project.json, "language"): the proto bar labels, and <html lang> in index.html
  prefix: 'projectname.', // every localStorage key starts with it, so "Reset prototype" clears them all
  home: 'SCR-01', // screen shown for an unknown hash, and after a rights redirect
};

/* ---------- utils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Messages and labels keep the <variable> parts of the spec: msg('MSG-04', { n: 1, total: 13 })
const fill = (tpl, vars = {}) => tpl.replace(/<([^<>]+)>/g, (m, k) => (k in vars ? esc(vars[k]) : m));
const msg = (id, vars) => fill(MESSAGES[id], vars);
const label = (id, vars) => fill(LABELS[id], vars);
// Example formats only: the real date, number and currency formats come from the project's
// design system foundation. Adjust these helpers to match it.
const fmtDate = (iso) => { const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}`; }; // DD.MM.YYYY
const fmtMoney = (v) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(v); // €1,250.50

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(PROTO.prefix + k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(PROTO.prefix + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
};

/* ---------- state ---------- */
const prefs = store.get('prefs') || {};
const S = {
  profile: PROFILES[prefs.profile] ? prefs.profile : Object.keys(PROFILES)[0],
  dataset: prefs.dataset || 'full', // 'full' | 'empty': shows the empty state
  state: 'ok', // 'ok' | 'loading' | 'error', driven by the proto bar
  items: store.get('items') || ITEMS.map((x) => ({ ...x })),
  route: { screen: PROTO.home, param: null },
  dialog: null, // { type: 'SCR-02-delete', opener: '<css selector>', ...data }
  banner: null, // { text, tone }: shown once on the next screen (rights redirect, confirmation)
  toast: null,
};
const savePrefs = () => store.set('prefs', { profile: S.profile, dataset: S.dataset });
const can = (action) => PROFILES[S.profile].can.includes(action);
const visibleItems = () => (S.dataset === 'empty' ? [] : S.items);
const findItem = (id) => visibleItems().find((x) => x.id === id);

/* ---------- routing ----------
   #SCR-01                      a screen
   #SCR-02/D-1001               a screen and one id
   #SCR-03/D-1001?from=SCR-01    an id and named parameters, to prefill a screen: params().from */
function parseHash() {
  const raw = decodeURIComponent(location.hash.replace(/^#/, ''));
  const [path, query = ''] = raw.split('?');
  const [screen, param] = path.split('/');
  return { screen: SCREENS[screen] ? screen : PROTO.home, param: param || null, query };
}
const qs = (o) => Object.entries(o).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
const params = () => Object.fromEntries(S.route.query.split('&').filter(Boolean).map((kv) => kv.split('=').map(decodeURIComponent)));
const go = (screen, param, query) => { location.hash = screen + (param ? `/${param}` : '') + (query ? `?${qs(query)}` : ''); };

/* ---------- shared fragments ---------- */
const statusTag = (s) => `<span class="tag tag-${STATUSES[s].tone}">${esc(STATUSES[s].label)}</span>`;

function pageHead(title, back) {
  return `<div class="page-head">
    ${back ? `<a class="back" href="#${back}">← Back</a>` : ''}
    <h1 tabindex="-1">${esc(title)}</h1>
  </div>`;
}

function skeleton(rows = 4) {
  return `<div class="skeleton" aria-busy="true" aria-label="Loading">
    <div class="sk sk-title"></div>
    ${Array.from({ length: rows }, () => '<div class="sk sk-row"></div>').join('')}
  </div>`;
}

function errorBlock(message) {
  return `<div class="state-error" role="alert">
    <p>${esc(message)}</p>
    <button class="btn" data-action="retry">Retry</button>
  </div>`;
}

const emptyBlock = (message) => `<div class="state-empty"><p>${esc(message)}</p></div>`;

function bannerBlock() {
  if (!S.banner) return '';
  const b = S.banner; S.banner = null; // shown once
  return `<div class="banner banner-${b.tone}" role="${b.tone === 'error' ? 'alert' : 'status'}">${esc(b.text)}</div>`;
}

/* ---------- screens ---------- */

// SCR-01: list. Below 768 px the table turns into cards (class "stack", td data-label).
function renderSCR01() {
  const items = visibleItems();
  let body;
  if (S.state === 'loading') body = skeleton(5);
  else if (S.state === 'error') body = errorBlock(msg('MSG-U02'));
  else if (!items.length) body = emptyBlock(msg('MSG-U01'));
  else {
    body = `<div class="scroll-x"><table class="table stack">
      <thead><tr><th>Reference</th><th>Title</th><th>Status</th><th class="num">Amount</th><th>Date</th></tr></thead>
      <tbody>${items.map((x) => `<tr class="row-link" data-go="SCR-02/${esc(x.id)}" tabindex="0">
        <td data-label="Reference">${esc(x.id)}</td><td data-label="Title">${esc(x.title)}</td>
        <td data-label="Status">${statusTag(x.status)}</td>
        <td data-label="Amount" class="num">${fmtMoney(x.amount)}</td><td data-label="Date">${fmtDate(x.date)}</td></tr>`).join('')}</tbody>
    </table></div>`;
  }
  return pageHead('Files') + `<section class="panel">${body}</section>`;
}

// SCR-02: detail, with the dialog SCR-02-delete
function renderSCR02(id) {
  if (S.state === 'loading') return pageHead('File', 'SCR-01') + `<section class="panel">${skeleton(3)}</section>`;
  if (S.state === 'error') return pageHead('File', 'SCR-01') + `<section class="panel">${errorBlock(msg('MSG-U02'))}</section>`;
  const x = findItem(id);
  if (!x) return pageHead('File', 'SCR-01') + `<section class="panel">${emptyBlock(msg('MSG-U04'))}</section>`;
  const actions = can('edit')
    ? `<button class="btn" id="btn-delete" data-action="open-dialog" data-dialog="SCR-02-delete" data-id="${esc(x.id)}">Delete</button>
       <button class="btn primary" data-go="SCR-03/${esc(x.id)}">Edit</button>`
    : `<p class="note">${esc(msg('MSG-U03'))}</p>`; // insufficient permissions state
  return pageHead(x.title, 'SCR-01') + `<section class="panel">
    <dl class="fields">
      <dt>Reference</dt><dd>${esc(x.id)}</dd>
      <dt>Manager</dt><dd>${esc(x.owner)}</dd>
      <dt>Status</dt><dd>${statusTag(x.status)}</dd>
      <dt>Amount</dt><dd>${fmtMoney(x.amount)}</dd>
      <dt>Date</dt><dd>${fmtDate(x.date)}</dd>
    </dl>
    <div class="actions">${actions}</div>
  </section>`;
}

// SCR-03: form. Reserved to the "edit" right: opened by URL without it, the guard sends back home.
function renderSCR03(id) {
  const x = findItem(id);
  const back = params().from || (x ? `SCR-02/${x.id}` : 'SCR-01');
  if (S.state === 'loading') return pageHead('Edit the file', back) + `<section class="panel">${skeleton(3)}</section>`;
  if (S.state === 'error' || !x) return pageHead('Edit the file', back) + `<section class="panel">${errorBlock(x ? msg('MSG-U02') : msg('MSG-U04'))}</section>`;
  return pageHead('Edit the file', back) + `<section class="panel">
    <form class="form" data-form="SCR-03" data-id="${esc(x.id)}" novalidate>
      <label for="f-title">Title</label>
      <input id="f-title" name="title" value="${esc(x.title)}" aria-describedby="f-title-err">
      <p class="field-error" id="f-title-err" hidden>${esc(msg('MSG-U05'))}</p>
      <label for="f-status">Status</label>
      <select id="f-status" name="status">${Object.entries(STATUSES).map(([k, v]) => `<option value="${k}"${k === x.status ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select>
      <div class="actions">
        <a class="btn" href="#${back}">Cancel</a>
        <button class="btn primary" type="submit">Save</button>
      </div>
    </form>
  </section>`;
}

// Screen registry: the SCR-xx ids of the UX spec, one entry per screen.
// `right`: the screen needs it; opened by URL without it, the guard redirects home with a banner.
const SCREENS = {
  'SCR-01': { title: 'Files', render: renderSCR01 },
  'SCR-02': { title: 'File', render: renderSCR02 },
  'SCR-03': { title: 'Edit the file', render: renderSCR03, right: 'edit', denied: 'MSG-U03' },
};

/* ---------- dialogs ----------
   DS "Dialog": title, text, buttons; the default button is the one that destroys nothing
   (data-autofocus); Esc or a click outside closes it; focus is trapped inside and goes back to
   the button that opened it. A dialog belongs to its screen and returns to it when closed. */
function dialogShell(id, title, body, actions) {
  return `<div class="overlay" data-action="overlay">
    <div class="dialog" role="dialog" aria-modal="true" id="${id}" aria-labelledby="${id}-title" aria-describedby="${id}-desc">
      <h2 id="${id}-title">${esc(title)}</h2>
      <div id="${id}-desc">${body}</div>
      <div class="dialog-actions">${actions}</div>
    </div>
  </div>`;
}

const DIALOGS = {
  // SCR-02-delete: delete a record
  'SCR-02-delete': (d) => {
    const x = findItem(d.id);
    return dialogShell('dlg-delete', label('delete-title'),
      `<p>${label('delete-text', { title: x.title })}</p>`,
      `<button class="btn danger" data-action="confirm-delete" data-id="${esc(x.id)}">Delete</button>
       <button class="btn" data-action="close-dialog" data-autofocus>Keep the file</button>`);
  },
};

function openDialog(type, opener, data = {}) { S.dialog = { type, opener, ...data }; render(); }
function closeDialog() {
  const opener = S.dialog && S.dialog.opener;
  S.dialog = null; render();
  const el = opener && $(opener); if (el) el.focus();
}

/* ---------- render ---------- */
let lastScreen = null;
function render() {
  const route = parseHash();
  // Rights guard: a screen opened by URL without its right goes home, with the screen's message.
  const def = SCREENS[route.screen];
  if (def.right && !can(def.right)) {
    S.banner = { tone: 'error', text: msg(def.denied) };
    location.replace(`#${PROTO.home}`);
    return;
  }
  const changed = route.screen !== lastScreen;
  S.route = route;
  const view = $('#view');
  view.dataset.screen = route.screen;
  view.innerHTML = bannerBlock() + def.render(route.param);
  $('#dialog').innerHTML = S.dialog ? DIALOGS[S.dialog.type](S.dialog) : '';
  document.title = `${def.title} · ${PROTO.title}`;
  $('#toast').innerHTML = S.toast ? `<div class="toast">${esc(S.toast)}</div>` : '';
  if (S.dialog) { const af = $('#dialog [data-autofocus]'); if (af) af.focus(); }
  else if (changed) { const h = $('#view h1'); if (h) h.focus({ preventScroll: true }); }
  lastScreen = route.screen;
}

function toast(text) {
  S.toast = text;
  render();
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { S.toast = null; render(); }, 2500);
}

/* ---------- events (delegated, so render can replace the DOM freely) ---------- */
document.addEventListener('click', (e) => {
  const nav = e.target.closest('[data-go]');
  if (nav) { const [screen, param] = nav.dataset.go.split('/'); go(screen, param); return; }
  const a = e.target.closest('[data-action]');
  if (!a) return;
  const act = a.dataset.action;
  if (act === 'overlay' && e.target !== a) return; // a click inside the dialog is not a click outside
  if (act === 'retry') { S.state = 'ok'; ProtoBar.set('__state', 'ok'); render(); }
  if (act === 'open-dialog') openDialog(a.dataset.dialog, a.id ? `#${a.id}` : null, { id: a.dataset.id });
  if (act === 'close-dialog' || act === 'overlay') closeDialog();
  if (act === 'confirm-delete') {
    S.items = S.items.filter((x) => x.id !== a.dataset.id);
    store.set('items', S.items);
    S.dialog = null;
    go('SCR-01');
    toast(msg('MSG-02'));
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && S.dialog) { e.preventDefault(); closeDialog(); return; }
  // focus trap inside the dialog
  if (e.key === 'Tab' && S.dialog) {
    const f = [...document.querySelectorAll('#dialog .dialog :is(a[href], button, input, textarea, select):not([disabled])')];
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    return;
  }
  const row = e.target.closest && e.target.closest('.row-link');
  if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); row.click(); }
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form="SCR-03"]');
  if (!form) return;
  e.preventDefault();
  const field = (name) => form.elements.namedItem(name); // not form.title: it is the form's own attribute
  const title = field('title').value.trim();
  $('#f-title-err', form).hidden = !!title;
  field('title').setAttribute('aria-invalid', title ? 'false' : 'true');
  if (!title) { field('title').focus(); return; }
  const item = S.items.find((x) => x.id === form.dataset.id);
  Object.assign(item, { title, status: field('status').value });
  store.set('items', S.items);
  go('SCR-02', item.id);
  toast(msg('MSG-01'));
});

window.addEventListener('hashchange', () => { S.dialog = null; render(); });

/* ---------- proto bar ---------- */
ProtoBar.mount({
  title: PROTO.title,
  version: PROTO.version,
  date: PROTO.date,
  lang: PROTO.lang,
  storagePrefix: PROTO.prefix,
  onState: (v) => { S.state = v; render(); },
  controls: [
    { type: 'select', id: 'profile', label: 'Profile', value: S.profile,
      options: Object.entries(PROFILES).map(([k, p]) => [k, p.label]),
      onChange: (v) => { S.profile = v; savePrefs(); render(); } },
    { type: 'seg', id: 'dataset', label: 'Data', value: S.dataset,
      options: [['full', 'With'], ['empty', 'None']],
      onChange: (v) => { S.dataset = v; savePrefs(); render(); } },
  ],
});

render();
