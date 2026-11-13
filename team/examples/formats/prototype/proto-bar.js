/*!
 * proto-bar 2.0.0
 * Prototype control bar, identical across every HTML prototype.
 * Source of truth: skills/proto-bar/proto-bar.js in the ShipItRight plugin. Copy it, never edit the copy.
 *
 * Usage:
 *   ProtoBar.mount({
 *     title: 'Room booking, target design',
 *     version: 'v1', date: '2026-09-29',
 *     lang: 'en',                           // BCP 47 code of the project language, 'en' by default
 *     labels: { mock: 'Testdaten' },        // fixed labels, given or overridden (required for a language
 *                                           // other than fr and en, which are built in)
 *     dateFormat: 'dd.mm.yyyy',             // 'dd/mm/yyyy' | 'dd.mm.yyyy' | 'yyyy-mm-dd'; default from Intl for lang
 *     storagePrefix: 'roombooking.',        // localStorage keys cleared by the reset button
 *     onState: (state) => {},               // 'ok' | 'loading' | 'error'
 *     onReset: () => location.reload(),     // default
 *     controls: [
 *       { type: 'seg', id: 'layout', label: 'Layout', value: 'new',
 *         options: [['old', 'Old'], ['new', 'New']], onChange: (v) => {} },
 *       { type: 'select', id: 'profile', label: 'Profile', value: 'member',
 *         groups: [{ label: 'Internal', options: [['member', 'Employee']] }], onChange: (v) => {} },
 *       { type: 'button', id: 'tour', label: 'Replay the demo', onClick: () => {} },
 *     ],
 *   });
 *   ProtoBar.set('layout', 'old');   // sync a control from the app (never calls onChange)
 *   ProtoBar.set('__state', 'error') // sync the state selector (never calls onState)
 *   ProtoBar.state                   // current state
 *
 * mount() can be called before <body> exists: it then waits for DOMContentLoaded, and set() calls
 * made in the meantime are queued and replayed once the bar is mounted.
 * Calling mount() again replaces the bar and its listeners, and resets the state to 'ok' without
 * calling onState. Control values chosen in the bar are kept in the opts (def.value is updated).
 * Labels: opts.labels, then the built-in labels of lang (or of its base language, fr for fr-LU), then en.
 * A language without built-in labels and without a complete opts.labels falls back to en for the missing
 * labels, with a console warning. Label keys: tag, mock, settings, states, ok, loading, error, reset, region.
 * An invalid lang or an unknown dateFormat is ignored with a console warning, the default is used.
 */
(function () {
  'use strict';

  var CSS = [
    ':root{--proto-bar-h:56px}',
    '.pb{position:sticky;top:0;z-index:2147483647;box-sizing:border-box;height:var(--proto-bar-h);display:flex;align-items:center;gap:16px;padding:0 20px;background:#16181d;color:#f1f2f4;border-bottom:3px solid #f5ce22;font:13px/1.3 "Inter",system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;white-space:nowrap}',
    '.pb *{box-sizing:border-box;font:inherit;margin:0}',
    '.pb-brand{display:flex;align-items:baseline;gap:10px;min-width:0;flex:1 1 auto;overflow:hidden}',
    '.pb-tag{flex:none;background:#f5ce22;color:#16181d;font-weight:700;font-size:11px;letter-spacing:.6px;text-transform:uppercase;padding:3px 8px;border-radius:3px;align-self:center}',
    '.pb-title{font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis}',
    '.pb-meta{flex:none;color:#9aa0ab}',
    '.pb-controls{display:flex;align-items:center;gap:18px;flex:none}',
    '.pb-controls .pb-sep:last-child{display:none}',
    '.pb-field{display:flex;align-items:center;gap:8px}',
    '.pb-label{color:#9aa0ab;font-size:12px}',
    '.pb-seg{display:inline-flex;background:#2a2d35;border-radius:6px;padding:2px}',
    '.pb-seg button{background:none;border:0;color:#c9cdd4;padding:5px 11px;border-radius:4px;font-size:12px;font-weight:500;cursor:pointer}',
    '.pb-seg button:hover{color:#fff}',
    '.pb-seg button[aria-checked="true"]{background:#f5ce22;color:#16181d;font-weight:600}',
    '.pb-select{background:#2a2d35;color:#f1f2f4;border:1px solid #3a3e48;border-radius:6px;padding:5px 8px;font-size:12px;cursor:pointer}',
    '.pb-btn{background:none;border:1px solid #3a3e48;color:#c9cdd4;border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;white-space:nowrap}',
    '.pb-btn:hover{border-color:#f5ce22;color:#f5ce22}',
    '.pb-sep{width:1px;align-self:stretch;background:#3a3e48;margin:14px 0}',
    '.pb-toggle{display:none;flex:none}',
    '.pb-toggle::after{content:"";display:inline-block;margin-left:6px;border:4px solid transparent;border-top-color:currentColor;border-bottom:0;vertical-align:middle}',
    '.pb-toggle[aria-expanded="true"]{border-color:#f5ce22;color:#f5ce22}',
    '.pb.pb-has-menu .pb-toggle{display:inline-block}',
    '.pb-menu{display:none;position:absolute;top:100%;right:12px;margin-top:3px;min-width:280px;max-width:calc(100vw - 24px);max-height:calc(100vh - var(--proto-bar-h) - 12px);overflow:auto;flex-direction:column;align-items:stretch;gap:12px;padding:14px;background:#16181d;border:1px solid #3a3e48;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.35);white-space:normal}',
    '.pb.pb-open .pb-menu{display:flex}',
    '.pb-menu .pb-field{justify-content:space-between;gap:16px}',
    '.pb-menu .pb-sep{display:none}',
    '.pb :focus-visible{outline:2px solid #f5ce22;outline-offset:2px}',
    '@media (max-width:900px){.pb{padding:0 12px}.pb-meta{display:none}}',
  ].join('');

  var I18N = {
    fr: {
      tag: 'Prototype', mock: 'données fictives', settings: 'Réglages', states: 'États',
      ok: 'Nominal', loading: 'Chargement', error: 'Erreur', reset: 'Réinitialiser le proto',
      region: 'Commandes du prototype',
    },
    en: {
      tag: 'Prototype', mock: 'mock data', settings: 'Settings', states: 'States',
      ok: 'Nominal', loading: 'Loading', error: 'Error', reset: 'Reset prototype',
      region: 'Prototype controls',
    },
  };
  var DATE_FORMATS = ['dd/mm/yyyy', 'dd.mm.yyyy', 'yyyy-mm-dd'];
  var controls = {};
  var teardown = null;
  var waitingOpts = null; // opts of a mount() waiting for DOMContentLoaded
  var queue = null;       // set() calls made while mount() waits, replayed after mounting
  var api = { state: 'ok', mount: mount, set: set };

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  // An explicit format, else the short date of the language from Intl (05/10/2026 in fr, 10/5/2026 in en)
  function formatDate(d, format, lang) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
    if (!m) return d;
    if (format === 'dd.mm.yyyy') return m[3] + '.' + m[2] + '.' + m[1];
    if (format === 'yyyy-mm-dd') return d;
    if (format === 'dd/mm/yyyy') return m[3] + '/' + m[2] + '/' + m[1];
    try {
      return new Intl.DateTimeFormat(lang, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])));
    } catch (e) { return m[3] + '/' + m[2] + '/' + m[1]; }
  }

  // Fixed labels for opts.lang: opts.labels first, then the built-in labels of the language or of its base
  // language, then en, with a warning when a language has neither built-in labels nor complete opts.labels
  function labelsFor(opts) {
    var lang = opts.lang || 'en';
    try { lang = Intl.getCanonicalLocales(lang)[0]; } catch (e) { warn('invalid lang "' + opts.lang + '", ignored (en used)'); lang = 'en'; }
    var own = I18N[lang] || I18N[lang.split('-')[0]];
    var given = opts.labels || {};
    var t = { lang: lang };
    var missing = [];
    Object.keys(I18N.en).forEach(function (k) {
      t[k] = given[k] != null ? given[k] : own ? own[k] : I18N.en[k];
      if (!own && given[k] == null) missing.push(k);
    });
    if (missing.length) warn('no built-in labels for lang "' + lang + '", en used for: ' + missing.join(', ') + ' (give them in opts.labels)');
    return t;
  }

  function seg(def) {
    var labelId = 'pb-l-' + def.id;
    var group = el('div', { class: 'pb-seg', role: 'radiogroup', 'aria-labelledby': labelId });
    def.options.forEach(function (o) {
      var b = el('button', { type: 'button', role: 'radio', 'data-value': o[0], text: o[1] });
      b.addEventListener('click', function () {
        update(def.id, o[0]);
        if (def.onChange) def.onChange(o[0]);
      });
      group.appendChild(b);
    });
    controls[def.id] = { def: def, node: group };
    return el('div', { class: 'pb-field' }, [el('span', { class: 'pb-label', id: labelId, text: def.label }), group]);
  }

  function select(def) {
    var s = el('select', { class: 'pb-select', name: 'pb-' + def.id, 'aria-label': def.label });
    var add = function (parent, opts) {
      opts.forEach(function (o) { parent.appendChild(el('option', { value: o[0], text: o[1] })); });
    };
    if (def.groups) def.groups.forEach(function (g) { var og = el('optgroup', { label: g.label }); add(og, g.options); s.appendChild(og); });
    else add(s, def.options || []);
    s.addEventListener('change', function () { if (def.onChange) def.onChange(s.value); });
    controls[def.id] = { def: def, node: s };
    return el('label', { class: 'pb-field' }, [el('span', { class: 'pb-label', text: def.label }), s]);
  }

  function button(def) {
    var b = el('button', { type: 'button', class: 'pb-btn', text: def.label });
    b.addEventListener('click', function () { if (def.onClick) def.onClick(); });
    return b;
  }

  function update(id, value) {
    var c = controls[id];
    if (!c) return;
    c.def.value = value;
    if (c.def.type === 'select') c.node.value = value;
    else Array.prototype.forEach.call(c.node.children, function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-value') === value)); });
  }

  function warn(msg) {
    if (window.console) console.warn('proto-bar: ' + msg);
  }

  function set(id, value) {
    if (queue) { queue.push([id, value]); return; }
    update(id, value);
    if (id === '__state') api.state = value;
  }

  function reset(opts) {
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (opts.storagePrefix && k.indexOf(opts.storagePrefix) === 0) localStorage.removeItem(k);
      });
    } catch (e) { /* storage unavailable */ }
    (opts.onReset || function () { location.reload(); })();
  }

  function mount(opts) {
    opts = opts || {};
    if (!document.body) {
      if (!waitingOpts) {
        document.addEventListener('DOMContentLoaded', function () {
          var o = waitingOpts;
          if (o) mount(o);
        }, { once: true });
      }
      waitingOpts = opts; // the last call wins
      if (!queue) queue = [];
      return api;
    }
    waitingOpts = null;
    var replay = queue;
    queue = null;
    if (teardown) teardown();
    Object.keys(controls).forEach(function (k) { delete controls[k]; });
    api.state = 'ok';
    var t = labelsFor(opts);
    var dateFormat = opts.dateFormat;
    if (dateFormat && DATE_FORMATS.indexOf(dateFormat) < 0) {
      warn('unknown dateFormat "' + dateFormat + '", ignored (date format of "' + t.lang + '" used)');
      dateFormat = null;
    }
    var states = [['ok', t.ok], ['loading', t.loading], ['error', t.error]];
    if (!opts.storagePrefix) warn('no storagePrefix, the reset button clears no localStorage key');
    if (!document.getElementById('proto-bar-css')) {
      document.head.appendChild(el('style', { id: 'proto-bar-css', text: CSS }));
    }
    var meta = [t.mock, opts.version, formatDate(opts.date, dateFormat, t.lang)].filter(Boolean).join(' · ');
    var toggle = el('button', { type: 'button', class: 'pb-btn pb-toggle', 'aria-expanded': 'false', 'aria-controls': 'pb-menu', text: t.settings });
    var box = el('div', { class: 'pb-controls' });
    var menu = el('div', { class: 'pb-menu', id: 'pb-menu' });

    (opts.controls || []).forEach(function (def) {
      var node = def.type === 'seg' ? seg(def) : def.type === 'select' ? select(def) : button(def);
      box.appendChild(node);
    });
    if ((opts.controls || []).length) box.appendChild(el('span', { class: 'pb-sep', 'aria-hidden': 'true' }));
    box.appendChild(seg({ id: '__state', label: t.states, options: states, value: 'ok', onChange: function (v) { api.state = v; if (opts.onState) opts.onState(v); } }));
    var resetBtn = el('button', { type: 'button', class: 'pb-btn', text: t.reset });
    resetBtn.addEventListener('click', function () { reset(opts); });
    box.appendChild(resetBtn);

    var tag = el('span', { class: 'pb-tag', text: t.tag });
    var title = el('span', { class: 'pb-title', text: opts.title || document.title });
    var metaNode = el('span', { class: 'pb-meta', text: meta });
    var bar = el('div', { class: 'pb', 'data-proto-bar': '', role: 'region', 'aria-label': t.region }, [
      el('div', { class: 'pb-brand' }, [tag, title, metaNode]),
      box,
      toggle,
      menu,
    ]);

    var setOpen = function (open) {
      bar.classList.toggle('pb-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', function () { setOpen(!bar.classList.contains('pb-open')); });
    var onDocClick = function (e) { if (!bar.contains(e.target)) setOpen(false); };
    var onKeydown = function (e) {
      if (e.key === 'Escape' && bar.classList.contains('pb-open')) { setOpen(false); toggle.focus(); }
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeydown);

    // The bar never wraps: controls that do not fit move, from the end, into the settings menu
    var layout = function () {
      var focused = document.activeElement;
      while (menu.firstChild) box.appendChild(menu.firstChild);
      bar.classList.remove('pb-has-menu');
      var cs = getComputedStyle(bar);
      var gap = parseFloat(cs.columnGap) || 0;
      var inner = bar.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var brandMin = tag.offsetWidth + 10 + Math.min(title.scrollWidth, 120) + (metaNode.offsetWidth ? 10 + metaNode.offsetWidth : 0);
      var fits = function () {
        var extra = menu.firstChild ? gap + toggle.offsetWidth : 0;
        var used = box.firstChild ? gap + box.offsetWidth : 0;
        return brandMin + used + extra <= inner;
      };
      while (box.firstChild && !fits()) {
        bar.classList.add('pb-has-menu');
        menu.insertBefore(box.lastChild, menu.firstChild);
      }
      if (!menu.firstChild) setOpen(false);
      if (focused && bar.contains(focused) && document.activeElement !== focused) focused.focus();
    };

    // Only a previous proto-bar (e.g. from a second copy of this script), never a page element using .pb
    var old = document.querySelector('[data-proto-bar]');
    if (old) old.remove();
    document.body.insertBefore(bar, document.body.firstChild);
    Object.keys(controls).forEach(function (id) { update(id, controls[id].def.value); });
    layout();
    var observer = null;
    if (window.ResizeObserver) { observer = new ResizeObserver(layout); observer.observe(bar); }
    else window.addEventListener('resize', layout);
    var alive = true;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (alive) layout(); });
    teardown = function () {
      alive = false;
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeydown);
      if (observer) observer.disconnect();
      else window.removeEventListener('resize', layout);
      bar.remove();
      teardown = null;
    };
    if (replay) replay.forEach(function (call) { set(call[0], call[1]); });
    return api;
  }

  window.ProtoBar = api;
})();
