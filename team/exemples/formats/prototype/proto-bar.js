/*!
 * proto-bar 1.1.0
 * Prototype control bar, identical across every HTML prototype.
 * Source of truth: skills/proto-bar/proto-bar.js in the ShipItRight plugin. Copy it, never edit the copy.
 *
 * Usage:
 *   ProtoBar.mount({
 *     title: 'Dashboard Sam, vision cible',
 *     version: 'v1', date: '2026-09-29',
 *     storagePrefix: 'samdash.',            // localStorage keys cleared by "Réinitialiser"
 *     onState: (state) => {},               // 'ok' | 'loading' | 'error'
 *     onReset: () => location.reload(),     // default
 *     controls: [
 *       { type: 'seg', id: 'layout', label: 'Layout', value: 'new',
 *         options: [['old', 'Ancien'], ['new', 'Nouveau']], onChange: (v) => {} },
 *       { type: 'select', id: 'profile', label: 'Profil', value: 'agent',
 *         groups: [{ label: 'Intermédiaires', options: [['agent', 'Agent']] }], onChange: (v) => {} },
 *       { type: 'button', id: 'tour', label: 'Rejouer la démo', onClick: () => {} },
 *     ],
 *   });
 *   ProtoBar.set('layout', 'old');   // sync a control from the app
 *   ProtoBar.state                   // current state
 */
(function () {
  'use strict';

  var CSS = [
    ':root{--proto-bar-h:56px}',
    '.pb{position:sticky;top:0;z-index:2147483000;box-sizing:border-box;height:var(--proto-bar-h);display:flex;align-items:center;gap:16px;padding:0 20px;background:#16181d;color:#f1f2f4;border-bottom:3px solid #f5ce22;font:13px/1.3 "Inter",system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;white-space:nowrap}',
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

  var STATES = [['ok', 'Nominal'], ['loading', 'Chargement'], ['error', 'Erreur']];
  var controls = {};
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

  function formatDate(d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
    return m ? m[3] + '.' + m[2] + '.' + m[1] : d; // FDS date format JJ.MM.AAAA
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

  function set(id, value) {
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
    Object.keys(controls).forEach(function (k) { delete controls[k]; });
    if (!document.getElementById('proto-bar-css')) {
      document.head.appendChild(el('style', { id: 'proto-bar-css', text: CSS }));
    }
    var meta = ['données fictives', opts.version, formatDate(opts.date)].filter(Boolean).join(' · ');
    var toggle = el('button', { type: 'button', class: 'pb-btn pb-toggle', 'aria-expanded': 'false', 'aria-controls': 'pb-menu', text: 'Réglages' });
    var box = el('div', { class: 'pb-controls' });
    var menu = el('div', { class: 'pb-menu', id: 'pb-menu' });

    (opts.controls || []).forEach(function (def) {
      var node = def.type === 'seg' ? seg(def) : def.type === 'select' ? select(def) : button(def);
      box.appendChild(node);
    });
    if ((opts.controls || []).length) box.appendChild(el('span', { class: 'pb-sep', 'aria-hidden': 'true' }));
    box.appendChild(seg({ id: '__state', label: 'États', options: STATES, value: 'ok', onChange: function (v) { api.state = v; if (opts.onState) opts.onState(v); } }));
    var resetBtn = el('button', { type: 'button', class: 'pb-btn', text: 'Réinitialiser le proto' });
    resetBtn.addEventListener('click', function () { reset(opts); });
    box.appendChild(resetBtn);

    var tag = el('span', { class: 'pb-tag', text: 'Prototype' });
    var title = el('span', { class: 'pb-title', text: opts.title || document.title });
    var metaNode = el('span', { class: 'pb-meta', text: meta });
    var bar = el('div', { class: 'pb', role: 'region', 'aria-label': 'Commandes du prototype' }, [
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
    document.addEventListener('click', function (e) { if (!bar.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && bar.classList.contains('pb-open')) { setOpen(false); toggle.focus(); }
    });

    // The bar never wraps: controls that do not fit move, from the end, into the Réglages menu
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

    var old = document.querySelector('.pb');
    if (old) old.remove();
    document.body.insertBefore(bar, document.body.firstChild);
    Object.keys(controls).forEach(function (id) { update(id, controls[id].def.value); });
    layout();
    if (window.ResizeObserver) new ResizeObserver(layout).observe(bar);
    else window.addEventListener('resize', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    return api;
  }

  window.ProtoBar = api;
})();
