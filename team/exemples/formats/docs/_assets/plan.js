/* Capacity planner for the roadmap of the ShipItRight framework.
 * Loaded after doc.js; reads the story estimates computed by doc.js (Doc.EST) and a JSON configuration:
 *
 *   <div class="capa"><script type="application/json">{ ...config... }</script></div>
 *
 * Text of the page: <span data-plan="mvp:p50|p85"> shows that date of the release, default mode, current settings.
 *
 * Config:
 *   start                   ISO date, the wished start; the remaining work never starts before today
 *   today                   optional ISO date, only to freeze a snapshot (an example); the real date otherwise
 *   holidays                ISO dates that are not worked
 *   modes                   [{ id: "ia"|"assiste"|"humain", label, note, default }]
 *   profiles                [{ id, label, skills: [..], count (full-time equivalents, 1.5 allowed), avail (%), from (ISO), modes: [..], unit: "h", hoursPerDay,
 *                              maxPerItem, team: "dev" (shares the productivity loss), external, fixed (count not editable, e.g. the PO),
 *                              calc: false (shown, not scheduled, e.g. the UX), hint, note }]
 *   rules                   { loss (% per teammate), maxPerStory, optimistic (%), pessimistic (%), runs,
 *                              calibration: { factor, sprints: [{ sprint, estimated, actual }] } } ; the measured sprints are
 *                              listed in .capa-calib when the page has one
 *   releases                [{ id: "mvp", label, gate: "<item id>", due (ISO, wished go-live) }]
 *   items                   tasks out of stories and gates:
 *                              { id, label, group, after: [ids | "rel:<id>"], kind,
 *                                d: { mode: days }            fixed duration, no resource
 *                                work: { mode: [[skill, amount], ...] }   effort on a skill (hours for "agent")
 *                                start/end (ISO, done)        already done
 *                                gate: true                   milestone
 *                                team, deliver (ISO), duration delivered by another team on that date (its capacity is theirs);
 *                                                             duration (working days) only draws the bar }
 *                              a ticket has story: "US-xxx" and replaces that story's realisation once it exists (after P3);
 *                              the story keeps its id and its business validation, after all its tickets
 *   storyDeps               { "US-006": ["US-005"], ... } ; every story also waits for storyAfter
 *   storyAfter              [ids] ; stories start after these (socle, G2)
 *   storyGroup              { rel: "group label" } for the Gantt ; groups: [labels] fixes the order of the groups
 *
 * Stories come from the estimate table (doc.js): size, front share, release; their effort per mode is
 *   humain  : front h x front %, back the rest (person-days), then the business validation
 *   assiste : the same x the assisted ratio, then the business validation
 *   ia      : agent hours, then the business validation
 * The business validation is the human share of the size (data-hpart), on the "validation" skill (the PO, the helpers).
 * Fixed durations (d) are drawn in the error range too; external deliveries are commitments, never drawn.
 * Work rows of the estimate table with data-items="<item ids>" are filled from this configuration.
 *
 * Engine: list scheduling with resources, by half day. At each step, the ready items (dependencies done), in
 * priority order (release, then table order), take the free units that have the skill, at most maxPerItem
 * people per story; specialists first, full stacks keep for the bottleneck. Units of team "dev" lose
 * rules.loss % of productivity per teammate. A Monte Carlo run draws, in a triangle (optimistic, 1, pessimistic),
 * one factor shared by the whole run and one per item, and takes their mean: half the estimation error goes
 * the same way for every story. Times the calibration factor; gives P50 / P85 per release.
 */
(() => {
  const D = window.Doc;
  if (!D) return;
  const { $, $$, EST, drawGantt, watch, dmy, lastDay, nextDay, day0, isWe, days, tms } = D;
  const STEP = 0.5;
  const MAXSTEPS = 4000;

  // ---------- working calendar ----------
  function calendar(startIso, holidays) {
    const hol = new Set(holidays || []);
    const list = [];
    let ms = day0(tms(startIso));
    const iso = (m) => { const d = new Date(m); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const grow = (n) => { while (list.length < n) { if (!isWe(ms) && !hol.has(iso(ms))) list.push(ms); ms = nextDay(ms); } };
    grow(400);
    const dayMs = (i) => { grow(i + 2); return list[i]; };
    return {
      // working time (days since start) -> ms ; an end at an integer W is the midnight after the last worked day
      ms: (w, end) => {
        if (w < 0) return dayMs(0) + w * 864e5;
        const i = Math.floor(w + 1e-9), f = w - i;
        if (end && f < 1e-9 && i > 0) return nextDay(dayMs(i - 1));
        const a = dayMs(i);
        return a + f * (nextDay(a) - a);
      },
      // ms -> working time (a date before start gives 0)
      w: (m) => {
        let i = 0;
        while (dayMs(i) + 1 < day0(m)) i++;
        return i;
      },
      week: (w) => { const m = dayMs(Math.floor(w)); const d = new Date(m); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return day0(d.getTime()); },
    };
  }

  // ---------- model ----------
  function buildItems(cfg, mode, set) {
    const rows = EST.rows((r) => !r.work && r.tr.dataset.size);
    const assist = (EST.boxes[0] && EST.boxes[0].p.assist) || 50;
    const relOrder = cfg.releases.map((r) => r.id);
    const tickets = cfg.items.filter((i) => i.story);
    const items = [];
    cfg.items.filter((i) => !i.story).forEach((i) => {
      const w = i.work && (i.work[mode] || i.work.all), d = i.d && (i.d[mode] ?? i.d.all);
      const type = i.start || i.at ? 'done' : i.gate ? 'gate' : i.deliver ? 'deliver' : w ? 'work' : 'fixed';
      // nothing to do in this mode (e.g. the automated QA campaign without AI): zero length, not drawn
      items.push({ ...i, type, hidden: type === 'fixed' && !!(i.work || i.d) && !d });
    });
    rows.forEach((r, n) => {
      const id = $('a', r.tr) ? $('a', r.tr).textContent.trim() : 'story-' + n;
      const label = r.tr.cells[0].textContent.trim();
      const href = $('a', r.tr) && $('a', r.tr).getAttribute('href');
      const own = tickets.filter((t) => t.story === id);
      const base = { rel: r.rel, group: (cfg.storyGroup || {})[r.rel] || r.rel, prio: relOrder.indexOf(r.rel) * 1000 + n,
        after: [...(cfg.storyAfter || []), ...((cfg.storyDeps || {})[id] || [])], kind: 'sprint', href };
      if (own.length) {
        own.forEach((t, k) => items.push({ ...base, ...t, type: 'work', prio: base.prio + k / 100, after: [...base.after, ...(t.after || [])] }));
        // the story keeps its id and its business validation, after all its tickets: what waits for it still does
        items.push({ ...base, id, label: `${label} : validation métier`, type: 'work', story: id, kind: 'human', prio: base.prio + 0.5,
          after: [...base.after, ...own.map((t) => t.id)], phases: [[['validation', r.v.hu]]] });
        return;
      }
      const f = r.front / 100;
      let work;
      if (mode === 'ia') work = [[['agent', r.v.ag]], [['validation', r.v.hu]]];
      else {
        const h = mode === 'assiste' ? r.v.h * assist / 100 : r.v.h;
        work = [[['front', h * f], ['back', h * (1 - f)]].filter((x) => x[1] > 0), [['validation', r.v.hu]]];
      }
      items.push({ ...base, id, label, type: 'story', phases: work });
    });
    // tasks with work: one phase
    items.forEach((it) => { if (it.type === 'work' && !it.phases) it.phases = [(it.work && (it.work[mode] || it.work.all)) || []]; });
    // expand rel:<id> dependencies
    items.forEach((it) => {
      it.after = (it.after || []).flatMap((a) => (a.startsWith('rel:') ? items.filter((x) => x.rel === a.slice(4) && (x.type === 'story' || x.story)).map((x) => x.id) : [a]));
      if (it.prio === undefined) it.prio = -1;
    });
    return items;
  }

  function units(cfg, mode, set) {
    const out = [];
    const prof = cfg.profiles.filter((p) => p.calc !== false && (!p.modes || p.modes.includes(mode)));
    const count = (p) => Math.max(0, p.fixed ? p.count : set.count[p.id] ?? p.count);
    const devCount = prof.filter((p) => p.team === 'dev').reduce((t, p) => t + count(p), 0);
    const loss = Math.pow(1 - Math.min(set.loss, 90) / 100, Math.max(devCount - 1, 0));
    prof.forEach((p) => {
      const n = count(p), from = set.from[p.id] || p.from || '';
      const per = (p.unit === 'h' ? p.hoursPerDay || 8 : 1) * ((p.avail ?? 100) / 100) * (p.team === 'dev' ? loss : 1);
      for (let k = 0; k < Math.ceil(n); k++) {
        const frac = Math.min(1, n - k);
        out.push({ id: `${p.id}-${k + 1}`, prof: p, label: `${p.label} ${k + 1}`, skills: p.skills, cap: per * frac * STEP, from, max: p.maxPerItem });
      }
    });
    return out;
  }

  // ---------- engine ----------
  // returns { res: Map id -> {a, b, why, segs}, use: per unit per step, end, missing: Set(skill) }
  function run(cfg, mode, set, rnd) {
    const cal = set.cal;
    const items = buildItems(cfg, mode, set);
    const us = units(cfg, mode, set);
    const byId = new Map(items.map((i) => [i.id, i]));
    const fromW = (iso) => (iso ? cal.w(tms(iso)) : 0);
    // the remaining work starts at the wished start, never before today
    const startW = Math.max(0, fromW(set.start), fromW(set.today));
    const res = new Map();
    const missing = new Set();
    // estimation error: half shared by the whole run (estimates tend to be wrong the same way), half per item
    const draw = () => tri(rnd, set.opt / 100, 1, set.pess / 100);
    const common = rnd ? draw() : 1;
    const mult = (it) => (rnd ? (common + draw()) / 2 : 1) * (it.type === 'story' || it.story ? set.calib : 1);
    // state of resource items
    const st = new Map();
    items.forEach((it) => {
      if (it.type === 'done') { res.set(it.id, { a: tms(it.start || it.at), b: tms(it.end || it.at), done: true, why: null }); return; }
      if (it.type === 'story' || it.type === 'work') {
        const m = mult(it);
        const phases = (it.phases || []).map((ph) => ph.map(([skill, amt]) => ({ skill, rem: amt * m, total: amt * m, units: new Set() })).filter((d) => d.rem > 1e-9)).filter((ph) => ph.length);
        phases.forEach((ph) => ph.forEach((d) => { if (!us.some((u) => u.skills.includes(d.skill))) missing.add(d.skill); }));
        st.set(it.id, { phases, ph: 0, a: null, b: null, why: null, pw: [], pend: [], segs: new Map() });
      }
    });
    const ended = (id) => { const r = res.get(id); return r && r.b !== null ? r : null; };
    const depEnd = (it) => {
      let m = -Infinity, who = null;
      for (const d of it.after) {
        if (!byId.has(d)) continue;
        const r = ended(d);
        if (!r) return null;
        const w = r.done ? 0 : r.bw;
        if (w > m) { m = w; who = d; }
      }
      return { w: m, who };
    };
    const resolveFixed = () => {
      let changed = true;
      while (changed) {
        changed = false;
        for (const it of items) {
          if (res.has(it.id) || (it.type !== 'fixed' && it.type !== 'gate' && it.type !== 'deliver')) continue;
          const de = depEnd(it);
          if (!de) continue;
          let a = Math.max(de.w, startW), why = de.w >= startW && de.who ? ['dep', de.who] : ['start'];
          if (it.type === 'deliver') {
            // delivered at the end of the given day, not before what it waits for
            // the bar shows the task's own duration (working days), ending on the delivery
            const dw = cal.w(tms((set.deliver || {})[it.id] || it.deliver)) + 1, bw = Math.max(a, dw);
            res.set(it.id, { aw: Math.max(0, bw - ((set.dur || {})[it.id] ?? it.duration ?? 0)), bw, why: dw > a ? ['ext', it.id] : why });
          } else if (it.type === 'fixed') {
            // a duration is an estimate too: drawn in the error range like the work
            const dur = (it.d ? (it.d[mode] ?? it.d.all ?? 0) : 0) * (rnd ? mult(it) : 1);
            res.set(it.id, { aw: a, bw: a + dur, why, dur });
          } else res.set(it.id, { aw: a, bw: a, why });
          changed = true;
        }
      }
    };
    resolveFixed();
    const order = items.filter((i) => st.has(i.id)).sort((x, y) => x.prio - y.prio);
    const use = us.map(() => []);
    let t = 0, steps = 0, idle = 0;
    const lastFrom = Math.max(0, ...us.map((u) => fromW(u.from)));
    const lastOn = us.map(() => null);
    while (steps++ < MAXSTEPS) {
      const free = us.map((u) => (fromW(u.from) <= t + 1e-9 ? u.cap : 0));
      for (const it of order) {
        const s = st.get(it.id);
        if (s.b !== null) continue;
        const de = depEnd(it);
        if (!de || de.w > t + 1e-9 || t < startW - 1e-9) continue;
        const ph = s.phases[s.ph];
        if (!ph) { s.b = s.a ?? Math.max(t, de.w); continue; }
        let worked = false, endAt = t;
        // people on this phase of the item, all skills together: at most maxPer, and maxPerItem per profile.
        // Only demands still open count, and each open demand nobody works on yet keeps a seat.
        const live = ph.filter((d) => d.rem > 1e-9);
        const onItem = new Set(live.flatMap((d) => [...d.units]));
        const room = (k, d) => {
          if (onItem.has(k)) return true;
          const waiting = Math.min(set.maxPer - 1, live.filter((x) => x !== d && x.units.size === 0).length);
          return onItem.size + waiting < set.maxPer && !(us[k].max && [...onItem].filter((j) => us[j].prof === us[k].prof).length >= us[k].max);
        };
        for (const d of ph) {
          if (d.rem <= 1e-9) continue;
          // units already on it first, then specialists (fewest skills), then the others
          const cands = us.map((u, k) => k).filter((k) => us[k].skills.includes(d.skill) && free[k] > 1e-9)
            .sort((x, y) => (d.units.has(y) - d.units.has(x)) || (us[x].skills.length - us[y].skills.length) || (us[y].cap - us[x].cap));
          for (const k of cands) {
            if (d.rem <= 1e-9) break;
            if (!room(k, d)) continue;
            const take = Math.min(free[k], d.rem);
            if (!s.pw[s.ph]) {
              if (s.a === null) s.a = t;
              const prev = lastOn[k];
              const team = us[k].from && Math.abs(fromW(us[k].from) - t) < STEP + 1e-9 && fromW(us[k].from) > startW;
              s.pw[s.ph] = { at: t, why: s.ph === 0 && de.who && de.w > t - STEP - 1e-9 ? ['dep', de.who] : team ? ['team', us[k].prof.id] : prev && prev !== it.id && t > startW ? ['res', prev, us[k].prof.id] : ['start'] };
            }
            free[k] -= take; d.rem -= take; d.units.add(k); onItem.add(k); worked = true;
            use[k].push([t, take / us[k].cap * STEP, it.id]);
            endAt = Math.max(endAt, t + (us[k].cap - free[k]) / us[k].cap * STEP);
            const seg = s.segs.get(k) || []; seg.push([t, t + STEP]); s.segs.set(k, seg);
            lastOn[k] = it.id;
          }
        }
        if (worked && ph.every((d) => d.rem <= 1e-9)) {
          s.pend[s.ph] = endAt;
          s.ph++;
          if (s.ph >= s.phases.length) {
            s.b = endAt;
            // what held the end: the last phase that started later than the previous one ended
            let k = s.pw.length - 1;
            while (k > 0 && s.pw[k] && !(s.pw[k].at > s.pend[k - 1] + STEP - 1e-9 && s.pw[k].why[0] === 'res')) k--;
            s.why = (s.pw[k] || s.pw[0] || { why: ['start'] }).why;
          }
        }
      }
      const progressed = free.some((f, k) => f < (fromW(us[k].from) <= t + 1e-9 ? us[k].cap : 0) - 1e-12);
      const known = res.size;
      // items whose phases are done
      order.forEach((it) => {
        const s = st.get(it.id);
        if (s.b !== null && !res.has(it.id)) res.set(it.id, { aw: s.a ?? s.b, bw: s.b, why: s.why || ['start'], segs: s.segs });
      });
      resolveFixed();
      if (order.every((it) => st.get(it.id).b !== null) && items.every((i) => res.has(i.id))) break;
      // stuck: nothing can run any more (missing skill)
      // waiting for a date still to come (a delivery, a fixed task) is not being stuck
      const waiting = [...res.values()].some((r) => r.bw !== undefined && r.bw > t + 1e-9);
      idle = progressed || waiting || res.size > known ? 0 : idle + 1;
      if (idle > 40 && t > lastFrom && t > startW) break;
      t += STEP;
    }
    // what never ended (missing skill): put it at the end, flagged
    items.forEach((it) => { if (!res.has(it.id)) res.set(it.id, { aw: t, bw: t, why: ['stuck'], stuck: true }); });
    // convert to ms
    res.forEach((r) => { if (!r.done) { r.a = cal.ms(r.aw); r.b = cal.ms(r.bw, true); } });
    return { items, byId, res, us, use, t, missing };
  }

  function tri(rnd, lo, mode, hi) {
    const u = rnd();
    const c = (mode - lo) / (hi - lo);
    return u < c ? lo + Math.sqrt(u * (hi - lo) * (mode - lo)) : hi - Math.sqrt((1 - u) * (hi - lo) * (hi - mode));
  }
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  // critical chain: back from an item through what set each start (dependency or resource)
  function chain(out, id) {
    const crit = new Set();
    let cur = id, limit = null, res = new Map();
    for (let n = 0; cur && n < 500; n++) {
      crit.add(cur);
      const r = out.res.get(cur);
      if (!r || !r.why) { limit = ['start']; break; }
      if (r.why[0] === 'dep' || r.why[0] === 'res') { if (r.why[0] === 'res') res.set(r.why[2], (res.get(r.why[2]) || 0) + 1); cur = r.why[1]; }
      else { limit = r.why; break; }
    }
    const bottleneck = [...res.entries()].sort((a, b) => b[1] - a[1])[0];
    return { crit, limit, bottleneck: bottleneck && bottleneck[0] };
  }

  // ---------- page ----------
  function init(box, n) {
    const src = $('script[type="application/json"]', box);
    if (!src) return;
    const cfg = JSON.parse(src.textContent);
    const key = 'capa:' + location.pathname + ':' + n;
    const modes = cfg.modes;
    const R = cfg.rules || {};
    const defaults = () => ({
      start: cfg.start, mode: (modes.find((m) => m.default) || modes[0]).id,
      count: {}, avail: {}, from: {}, deliver: {}, dur: {}, due: Object.fromEntries(cfg.releases.map((r) => [r.id, r.due || ''])),
      loss: R.loss ?? 10, maxPer: R.maxPerStory ?? 2, opt: R.optimistic ?? 70, pess: R.pessimistic ?? 160, runs: R.runs ?? 300,
      calib: null, open: [],
    });
    let set = defaults();
    try { const s = JSON.parse(localStorage.getItem(key)); if (s) set = { ...set, ...s }; } catch (e) { /* storage unavailable */ }
    const save = () => { try { const { cal, ...keep } = set; localStorage.setItem(key, JSON.stringify({ ...keep, open: [...open] })); } catch (e) { /* storage unavailable */ } };
    const open = new Set(set.open || []);
    const calibFactor = () => {
      if (set.calib) return set.calib;
      const sp = (R.calibration && R.calibration.sprints) || [];
      const est = sp.reduce((t, s) => t + s.estimated, 0), act = sp.reduce((t, s) => t + s.actual, 0);
      return est > 0 ? act / est : (R.calibration && R.calibration.factor) || 1;
    };
    // today is the real date, unless the configuration freezes a snapshot
    const now = new Date();
    const today = cfg.today || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const cur = () => ({ ...set, today, cal: calendar(cfg.start, cfg.holidays), calib: calibFactor() });
    const cnt = (p, c = set.count) => (p.fixed ? p.count : c[p.id] ?? p.count);
    // the work rows of the estimate (data-items="<item ids>") take their values from this configuration, so the
    // work out of stories is written once: realisation by mode (days, agent hours in IA), then the work common
    // to all modes (gates, recette)
    const workRows = $$('.est tr.work[data-items]');
    if (workRows.length) {
      const total = (list) => (list || []).reduce((t, [, a]) => t + a, 0);
      workRows.forEach((tr) => {
        const its = tr.dataset.items.split(/\s+/).map((id) => cfg.items.find((i) => i.id === id)).filter(Boolean);
        const sum = (f) => its.reduce((t, it) => t + f(it), 0);
        const own = (it, mode, agent) => {
          const w = ((it.work && it.work[mode]) || []).filter(([k]) => (k === 'agent') === agent);
          return total(w) + (agent ? 0 : (it.d && it.d[mode]) || 0);
        };
        const common = sum((it) => total(it.work && it.work.all) + ((it.d && it.d.all) || 0));
        tr.dataset.fixed = [sum((it) => own(it, 'humain', false)), sum((it) => own(it, 'assiste', false)), sum((it) => own(it, 'ia', true)), common].join(' ');
      });
      EST.refresh();
    }
    const profiles = (mode) => cfg.profiles.filter((p) => !p.modes || p.modes.includes(mode));
    const relEnd = (out, r) => out.res.get(r.gate).b;
    const dueMs = (r) => (set.due[r.id] ? nextDay(tms(set.due[r.id])) : null);
    // probable and prudent dates, and the chance of meeting the wished MEP when one is set
    const stats = (r, smp) => {
      const due = dueMs(r);
      return [percentile(smp, 0.5), percentile(smp, 0.85), due ? smp.filter((v) => v <= due).length / smp.length : null];
    };

    // ---------- layout ----------
    // modes, then the summary, then every setting in plain sight, then the detail
    const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
    const tabs = el('div', 'tab-bar cap-modes'); tabs.setAttribute('role', 'tablist');
    const sum = el('p', 'note p-sum');
    const crew = el('div', 'cap-config cap-crew'), conf = el('div', 'cap-config');
    const settings = el('div', 'cap-settings');
    // the team goes to its own section when the page has one (.capa-team), with its own mode tabs
    const host = $$('.capa-team')[n], bars = [tabs];
    if (host) { crew.classList.add('flat'); host.replaceChildren(crew); settings.append(conf); } else settings.append(crew, conf);
    // the human team is shared by the modes without autonomous agents; agents are set with the other settings
    const humanModes = modes.filter((m) => m.id !== 'ia');
    // the effect of one more or one less full-time is shown for every mode (the helpers count in IA too)
    const effName = { humain: 'Sans assistance IA', assiste: 'Avec assistance IA', ia: 'IA en autonomie' };
    const effTag = { humain: 'sans IA', assiste: 'avec IA', ia: 'en IA autonome' };
    const humanTeam = () => cfg.profiles.filter((p) => !p.external && !p.fixed && humanModes.some((m) => !p.modes || p.modes.includes(m.id)));
    const agentTeam = () => cfg.profiles.filter((p) => !p.external && !p.fixed && !humanTeam().includes(p));
    const legend = box.parentElement.querySelector(':scope > .legend');
    const g = el('div', 'gantt');
    const load = el('div', 'table-wrap'), ppl = el('div', 'gantt'), cmp = el('div', 'table-wrap');
    box.replaceChildren(tabs, sum, settings,
      el('h3', '', 'Planning'), ...(legend ? [legend] : []), g,
      el('h3', '', 'Charge des équipes'), el('p', 'hint', 'Part de la capacité de chaque profil occupée, par semaine. Un profil à 100 % sur la durée est le goulot ; un profil vide attend du travail.'), load,
      el('h3', '', 'Planning par personne'), ppl,
      el('h3', '', 'Comparaison des modes'), cmp);
    // rename a person in the per-person Gantt: click the name, type, Enter (empty gives back the default name)
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const rename = (span) => {
      const id = span.dataset.unit, input = el('input', 'g-rename-input');
      input.value = (set.names || {})[id] || span.textContent; input.setAttribute('aria-label', 'Nom');
      span.replaceWith(input); input.focus(); input.select();
      let done = false;
      const finish = (keep) => {
        if (done) return; done = true;
        if (keep) { set.names = { ...(set.names || {}) }; const v = input.value.trim(); if (v) set.names[id] = v; else delete set.names[id]; save(); }
        render();
      };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); });
      input.addEventListener('blur', () => finish(true));
    };
    ppl.addEventListener('click', (e) => { const sp = e.target.closest('.g-rename'); if (sp) rename(sp); });
    ppl.addEventListener('keydown', (e) => { const sp = e.target.closest('.g-rename'); if (sp && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); rename(sp); } });
    bars.forEach((t) => modes.forEach((m) => {
      const b = el('button', '', m.label); b.type = 'button'; b.setAttribute('role', 'tab');
      b.addEventListener('click', () => { set.mode = m.id; save(); buildConfig(); render(); });
      t.appendChild(b);
    }));

    // ---------- settings, all visible ----------
    const ref = {
      start: () => cfg.start, loss: () => R.loss ?? 10, maxPer: () => R.maxPerStory ?? 2, opt: () => R.optimistic ?? 70,
      pess: () => R.pessimistic ?? 160, runs: () => R.runs ?? 300, calib: () => null,
    };
    const prof = (id) => cfg.profiles.find((p) => p.id === id);
    const value = (k) => {
      const [a, b] = k.split(':');
      if (a === 'count') return set.count[b] ?? prof(b).count;
      if (a === 'avail') return set.avail[b] ?? prof(b).avail ?? 100;
      if (a === 'from') return set.from[b] ?? prof(b).from ?? '';
      if (a === 'due') return set.due[b] ?? '';
      if (a === 'deliver') return (set.deliver || {})[b] || (cfg.items.find((i) => i.id === b) || {}).deliver || '';
      if (a === 'dur') return (set.dur || {})[b] ?? (cfg.items.find((i) => i.id === b) || {}).duration ?? 0;
      return set[a];
    };
    const reference = (k) => {
      const [a, b] = k.split(':');
      if (a === 'count') return prof(b).count;
      if (a === 'avail') return prof(b).avail ?? 100;
      if (a === 'from') return prof(b).from ?? '';
      if (a === 'due') return (cfg.releases.find((r) => r.id === b) || {}).due || '';
      if (a === 'deliver') return (cfg.items.find((i) => i.id === b) || {}).deliver || '';
      return ref[a]();
    };
    const assign = (k, v) => {
      const [a, b] = k.split(':');
      if (a === 'count') set.count[b] = v; else if (a === 'avail') set.avail[b] = v; else if (a === 'from') set.from[b] = v;
      else if (a === 'due') set.due[b] = v; else if (a === 'deliver') set.deliver = { ...(set.deliver || {}), [b]: v };
      else if (a === 'dur') set.dur = { ...(set.dur || {}), [b]: v }; else set[a] = v;
      save(); render();
    };
    const numberInput = (k, { step = 1, min = 0, max, suffix } = {}) => {
      const wrap = el('span', 'cap-num');
      const i = el('input'); i.type = 'number'; i.step = String(step); i.min = String(min); if (max !== undefined) i.max = String(max);
      i.value = value(k) ?? ''; i.dataset.key = k;
      i.addEventListener('input', () => { const v = parseFloat(i.value); if (!isNaN(v) && v >= min && (max === undefined || v <= max)) assign(k, v); });
      wrap.appendChild(i);
      if (suffix) wrap.appendChild(el('span', 'cap-suffix', suffix));
      return wrap;
    };
    const stepper = (k, step) => {
      const wrap = el('span', 'cap-stepper');
      const minus = el('button', '', '−'), plus = el('button', '', '+');
      minus.type = plus.type = 'button';
      minus.setAttribute('aria-label', 'Moins'); plus.setAttribute('aria-label', 'Plus');
      const i = el('input'); i.type = 'number'; i.min = '0'; i.step = String(step); i.value = value(k); i.dataset.key = k;
      const put = (v) => { v = Math.max(0, Math.round(v / step) * step); i.value = v; assign(k, v); };
      minus.addEventListener('click', () => put(parseFloat(i.value || 0) - step));
      plus.addEventListener('click', () => put(parseFloat(i.value || 0) + step));
      i.addEventListener('input', () => { const v = parseFloat(i.value); if (!isNaN(v) && v >= 0) assign(k, v); });
      wrap.append(minus, i, plus);
      return wrap;
    };
    const dateInput = (k, placeholder) => {
      const i = el('input'); i.type = 'date'; i.value = value(k) || ''; i.dataset.key = k; if (placeholder) i.title = placeholder;
      i.addEventListener('change', () => assign(k, i.value || (k === 'start' ? cfg.start : k.startsWith('deliver:') ? reference(k) : '')));
      return i;
    };
    const field = (k, label, input, hint) => {
      const f = el('label', 'cap-field'); f.dataset.key = k;
      f.append(el('span', 'cap-label', label), input);
      if (hint) f.appendChild(el('small', 'cap-hint', hint));
      return f;
    };
    const group = (title, hint, cls) => {
      const s = el('section', 'cap-group' + (cls ? ' ' + cls : ''));
      s.append(el('h4', '', title));
      if (hint) s.appendChild(el('p', 'cap-ghint', hint));
      return s;
    };
    const skillNames = { front: 'front', back: 'back', qa: 'campagne de test', agent: 'développement, tests, campagne QA', validation: 'validation métier', gate: 'gates', recette: 'recette', uxreview: 'review UX/UI', ident: 'SSO', exploit: 'exploitation' };

    const buildConfig = () => {
      const mode = set.mode, m = modes.find((x) => x.id === mode);
      // human team, with the effect of one more or one less full-time in each mode
      crew.innerHTML = '';
      if (!host) crew.appendChild(el('div', 'cap-head', '<div class="cap-title"><b>Composition de l\'équipe</b><span>En équivalents temps plein : 1,5 = une personne à plein temps et une à mi-temps. Les colonnes de droite donnent l\'effet d\'un temps plein de plus ou de moins sur la date de la dernière release, dans chaque mode.</span></div>'));
      const table = el('table', 'cap-tteam', `<thead><tr><th rowspan="2">Profil</th><th rowspan="2">Temps plein</th>${modes.map((x) => `<th colspan="2" class="cap-relh">${effName[x.id] || x.label}</th>`).join('')}</tr><tr>${modes.map(() => '<th class="num cap-relc">Un de plus</th><th class="num">Un de moins</th>').join('')}</tr></thead><tbody></tbody>`);
      const tb = table.tBodies[0];
      const name = (p) => `<span class="cap-pname">${p.label}</span>${p.hint ? `<small class="cap-phint">${p.hint}</small>` : ''}<span class="cap-skills">${p.skills.map((k) => `<span class="cap-skill">${skillNames[k] || k}</span>`).join('')}</span>`;
      // dev team, then the helpers, then the roles one per project
      const section = (list, row) => {
        list.forEach((p) => { const tr = el('tr'); tr.dataset.prof = p.id; tr.appendChild(el('th', '', name(p))); row(p, tr); tb.appendChild(tr); });
      };
      const editable = (p, tr) => {
        const c = el('td'); c.dataset.key = 'count:' + p.id; c.appendChild(stepper('count:' + p.id, 0.5)); tr.appendChild(c);
        modes.forEach((x) => ['num cap-eff cap-relc', 'num cap-eff'].forEach((cls) => { tr.appendChild(el('td', cls, '…')).dataset.mode = x.id; }));
      };
      section(humanTeam().filter((p) => p.team === 'dev'), editable);
      section(humanTeam().filter((p) => p.team !== 'dev'), editable);
      section(cfg.profiles.filter((p) => p.fixed && !p.external), (p, tr) => {
        tr.classList.add('cap-fixed');
        tr.appendChild(el('td', 'cap-fixedn', `${p.count}<small>fixe</small>`));
        tr.appendChild(el('td', 'cap-note cap-relc', p.note || '')).colSpan = modes.length * 2;
      });
      const tw = el('div', host ? 'table-wrap' : 'cap-group table-wrap'); tw.appendChild(table);
      crew.append(tw, el('div', 'cap-warn'));

      // the other settings, foldable
      conf.innerHTML = '';
      const head = el('div', 'cap-head');
      const closed = set.confClosed === true;
      const toggle = el('button', 'cap-toggle', `<b>Paramètres</b><span class="cap-sub">Dates, autres équipes et règles de calcul. Chaque changement recalcule le planning tout de suite.</span>`);
      toggle.type = 'button'; toggle.setAttribute('aria-expanded', String(!closed));
      toggle.addEventListener('click', () => { set.confClosed = !closed; save(); buildConfig(); render(); });
      head.append(toggle);
      conf.appendChild(head);
      conf.classList.toggle('closed', closed);
      const body = el('div', 'cap-body'); body.hidden = closed; conf.appendChild(body);

      const grid = el('div', 'cap-grid');
      const dates = group('Dates', 'Le travail restant commence au démarrage souhaité, jamais avant aujourd\'hui. Une MEP souhaitée vient du cadrage ou de l\'humain ; vide, pas d\'échéance.');
      const df = el('div', 'cap-fields'); dates.appendChild(df);
      df.appendChild(field('start', 'Démarrage souhaité', dateInput('start')));
      cfg.releases.forEach((r) => df.appendChild(field('due:' + r.id, `MEP souhaitée ${r.label}`, dateInput('due:' + r.id), 'vide : aucune échéance')));
      const col = el('div', 'cap-col'); col.appendChild(dates); grid.appendChild(col);
      const ext = cfg.items.filter((i) => i.deliver);
      if (ext.length) {
        const eg = group('Autres équipes', 'Les livraisons attendues d\'équipes hors projet, à la date qu\'elles s\'engagent à tenir. Le planning attend chaque livraison avant de lancer ce qui en dépend. La durée de leur tâche ne sert qu\'à dessiner leur barre.');
        ext.forEach((i) => {
          const row = el('div', 'cap-ext');
          row.appendChild(el('div', 'cap-ext-name', `<b>${i.team || ''}</b><span>${i.label}</span>`));
          row.appendChild(field('deliver:' + i.id, 'Livre le', dateInput('deliver:' + i.id)));
          row.appendChild(field('dur:' + i.id, 'Durée', numberInput('dur:' + i.id, { step: 1, min: 0, max: 60, suffix: 'j' })));
          eg.appendChild(row);
        });
        col.appendChild(eg);
      }
      if (agentTeam().length) {
        const ag = group('Team d\'agents', 'Pour le mode IA en autonomie : combien d\'agents travaillent en parallèle. Le PO et l\'aide à la recette viennent de la section Composition de l\'équipe.');
        agentTeam().forEach((p) => {
          const f = field('count:' + p.id, p.label, stepper('count:' + p.id, 1), `${p.hoursPerDay || 8} h de travail par jour chacun`);
          ag.appendChild(f);
        });
        col.appendChild(ag);
      }
      const rules = group('Règles de calcul', 'Comment le planning traduit l\'équipe et les estimations en dates. Les mêmes pour les trois modes.');
      const rule = (k, label, input, explain) => {
        const f = field(k, label, input);
        f.appendChild(el('small', 'cap-hint', explain));
        f.appendChild(el('small', 'cap-example')).dataset.ex = k;
        rules.appendChild(f);
      };
      rule('loss', 'Temps perdu en coordination, par collègue', numberInput('loss', { step: 1, min: 0, max: 50, suffix: '%' }),
        'Chaque développeur perd ce pourcentage de son temps pour chaque collègue (échanges, synchronisation). Au-delà d\'une certaine taille, ajouter quelqu\'un ralentit l\'équipe.');
      rule('maxPer', 'Personnes au plus sur une même story', numberInput('maxPer', { step: 1, min: 1, max: 6 }),
        'Une story ne se partage pas entre plus de personnes que ça : au-delà, elle ne finit pas plus vite.');
      const range = el('div', 'cap-range');
      range.append(field('opt', 'Au mieux', numberInput('opt', { step: 5, min: 10, max: 100, suffix: '%' })), field('pess', 'Au pire', numberInput('pess', { step: 5, min: 100, max: 400, suffix: '%' })));
      const rf = el('div', 'cap-field cap-rangef');
      rf.append(el('span', 'cap-label', 'Marge d\'erreur des estimations'), range,
        el('small', 'cap-hint', 'Une estimation n\'est jamais exacte : une story peut prendre moins (au mieux) ou plus (au pire) que prévu, en % de son estimation. Dans chaque simulation, la moitié de l\'écart est commune à toutes les stories : les estimations se trompent souvent dans le même sens.'));
      rf.appendChild(el('small', 'cap-example')).dataset.ex = 'range';
      rules.appendChild(rf);
      rule('runs', 'Nombre de simulations', numberInput('runs', { step: 100, min: 50, max: 3000 }),
        'Le planning est rejoué autant de fois, avec à chaque fois des durées tirées au hasard dans la marge d\'erreur. On en déduit la date probable et la date prudente. Plus il y en a, plus elles sont stables et plus le calcul est long.');
      const sp = (R.calibration && R.calibration.sprints) || [];
      const ci = numberInput('calib', { step: 0.05, min: 0.1, max: 5 });
      $('input', ci).value = set.calib || calibFactor(); $('input', ci).placeholder = String(calibFactor());
      rule('calib', 'Correction tirée des sprints réels', ci,
        (sp.length ? `Mesurée sur ${sp.length} sprint${sp.length > 1 ? 's' : ''} : temps réel divisé par temps estimé. ` : 'Aucun sprint mesuré pour l\'instant : 1, pas de correction. ') + 'Elle multiplie toutes les estimations des stories. Les sprints mesurés sont dans la section Calibrage.');
      grid.appendChild(rules);
      body.appendChild(grid);
    };
    // folded settings: their main values in the title
    const foldSummary = () => {
      if (set.confClosed) {
        const dues = cfg.releases.filter((r) => set.due[r.id]).map((r) => `MEP ${r.label} ${dmy(tms(set.due[r.id]))}`);
        $('.cap-sub', conf).textContent = [`Démarrage ${dmy(tms(set.start))}`, ...dues].join(' · ');
      }
    };

    // ---------- outputs ----------
    let mcToken = 0;
    const mcCache = new Map();
    const percentile = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
    const monteCarlo = (mode, done) => {
      const token = ++mcToken, s = cur(), N = Math.round(set.runs), samples = cfg.releases.map(() => []);
      let k = 0;
      const chunk = () => {
        if (token !== mcToken) return;
        const until = Math.min(N, k + 25);
        for (; k < until; k++) {
          const out = run(cfg, mode, s, rng(k * 7919 + 17));
          cfg.releases.forEach((r, i) => samples[i].push(relEnd(out, r)));
        }
        done(k < N ? null : samples, k, N);
        if (k < N) setTimeout(chunk, 0);
      };
      chunk();
    };

    const render = () => {
      const mode = set.mode, s = cur(), m = modes.find((x) => x.id === mode);
      bars.forEach((t) => modes.forEach((x, i) => t.children[i].setAttribute('aria-selected', String(x.id === mode))));
      const out = run(cfg, mode, s, null);
      const last = cfg.releases[cfg.releases.length - 1];
      const ch = chain(out, last.gate);
      // summary
      const limit = !ch.limit ? '' : ch.limit[0] === 'team'
        ? ` La date est tenue par la disponibilité de <b>${(cfg.profiles.find((p) => p.id === ch.limit[1]) || {}).label}</b>.`
        : ch.limit[0] === 'start' ? (today > set.start ? ' La date est tenue par la date du jour : le travail restant ne commence pas avant aujourd\'hui.' : ' La date est tenue par le démarrage souhaité.')
        : ch.limit[0] === 'ext' ? (() => { const i = cfg.items.find((x) => x.id === ch.limit[1]) || {}; return ` La date est tenue par une livraison externe : <b>${i.label}</b>${i.team ? ` (${i.team})` : ''}.`; })() : '';
      const neck = ch.bottleneck ? ` Goulot sur le chemin critique : <b>${(cfg.profiles.find((p) => p.id === ch.bottleneck) || {}).label}</b>.` : '';
      const miss = out.missing.size ? ` <span class="p-late">Compétence absente : ${[...out.missing].map((k) => skillNames[k] || k).join(', ')} ; le travail qui la demande reste bloqué.</span>` : '';
      sum.innerHTML = `${m.note || ''}${limit}${neck}${miss}`;
      // Monte Carlo for the displayed mode, then the others in the background, for the comparison table
      mcCache.clear();
      monteCarlo(mode, (samples) => {
        if (!samples) return;
        cfg.releases.forEach((r, i) => mcCache.set(mode + ':' + r.id, stats(r, samples[i])));
        renderCmp();
        const others = modes.map((x) => x.id).filter((id) => id !== mode && !cfg.releases.every((r) => mcCache.has(id + ':' + r.id)));
        const next = () => {
          const id = others.shift();
          if (!id) return;
          monteCarlo(id, (smp) => {
            if (!smp) return;
            cfg.releases.forEach((r, i) => mcCache.set(id + ':' + r.id, stats(r, smp[i])));
            renderCmp(); next();
          });
        };
        next();
      });
      // Gantt by item
      const groups = (cfg.groups || []).map((label) => ({ label, items: [] }));
      const groupOf = (label) => { let x = groups.find((y) => y.label === label); if (!x) { x = { label, items: [] }; groups.push(x); } return x; };
      const dueOf = (id) => { const r = cfg.releases.find((x) => x.gate === id); return r && set.due[r.id] ? nextDay(tms(set.due[r.id])) : undefined; };
      out.items.forEach((it) => {
        if (it.hidden) return;
        const r = out.res.get(it.id);
        if (!r) return;
        const isGate = it.type === 'gate' || !!it.gate;
        if (!isGate && !(r.b > r.a) && !r.done) return;
        const segsTxt = r.segs ? [...r.segs.keys()].map((k) => out.us[k].prof.label).filter((v, i, a) => a.indexOf(v) === i).join(', ') : '';
        const effort = it.phases ? it.phases.flat().reduce((t, [sk, a]) => t + a, 0) : 0;
        const note = r.done ? 'fait' : r.stuck ? 'bloqué : compétence absente' : it.type === 'deliver' ? `livré par ${it.team || 'l\'équipe'}${value('dur:' + it.id) ? ` · ${days(value('dur:' + it.id))}` : ''}` : it.type === 'fixed' ? days(r.dur) : isGate ? '' : `${segsTxt}`;
        groupOf(it.group || 'Autres').items.push({ gate: isGate, a: r.a, b: r.b, kind: r.done ? 'done' : it.kind, who: it.who, label: it.href ? `<a href="${it.href}">${it.label}</a>` : it.label,
          note, crit: ch.crit.has(it.id) && !r.done, due: dueOf(it.id), state: r.done ? 'done' : '' });
      });
      const all = groups.flatMap((x) => x.items);
      const span = { start: Math.min(...all.map((i) => i.a)), end: nextDay(Math.max(...all.map((i) => i.b))) };
      drawGantt(g, { groups, today: tms(today), ...span }, open, () => { save(); render(); });
      // Gantt by person
      const pgroups = [];
      out.us.forEach((u, k) => {
        let grp = pgroups.find((x) => x.label === u.prof.label);
        if (!grp) { grp = { label: u.prof.label, items: [] }; pgroups.push(grp); }
        const segs = [];
        out.use[k].forEach(([t0, frac, id]) => {
          const lastSeg = segs[segs.length - 1];
          if (lastSeg && lastSeg.id === id && Math.abs(lastSeg.tw - t0) < 1e-9) { lastSeg.tw = t0 + STEP; return; }
          segs.push({ id, sw: t0, tw: t0 + STEP });
        });
        const segObjs = segs.map((x) => {
          const it = out.byId.get(x.id) || {}, a = s.cal.ms(x.sw), b = s.cal.ms(x.tw, true);
          const name = String(it.label || x.id).replace(/<[^>]+>/g, '').trim();
          const title = name.startsWith(x.id) ? name : `${x.id} ${name}`;
          return { a, b, label: x.id.replace(/^(US-\d+).*/, '$1'), kind: it.kind, tip: `${title} · ${dmy(a)} au ${lastDay(b)}` };
        });
        if (!segObjs.length) segObjs.push({ a: span.start, b: span.start, label: '' });
        // people of the project can be named (kept in the browser); external teams and agents keep their label
        const named = !u.prof.external && u.prof.unit !== 'h';
        const label = named ? `<span class="g-rename" data-unit="${u.id}" tabindex="0" role="button" title="Renommer">${esc((set.names || {})[u.id] || u.label)}</span>` : u.label;
        grp.items.push({ a: Math.min(...segObjs.map((x) => x.a)), b: Math.max(...segObjs.map((x) => x.b)), label, segs: segObjs, note: '' });
      });
      const popen = new Set(pgroups.map((x) => x.label).filter((l) => !closedPeople.has(l)));
      drawGantt(ppl, { groups: pgroups, today: tms(today), ...span }, popen, () => {
        pgroups.forEach((x) => { if (popen.has(x.label)) closedPeople.delete(x.label); else closedPeople.add(x.label); });
        render();
      });
      // load per profile per week
      const weeks = [];
      for (let w = 0; w <= out.t; w += 1) { const wk = s.cal.week(w); if (!weeks.includes(wk)) weeks.push(wk); }
      const profs = [...new Set(out.us.map((u) => u.prof))];
      const cell = (p, wk) => {
        let cap = 0, used = 0;
        out.us.forEach((u, k) => {
          if (u.prof !== p) return;
          for (let t0 = 0; t0 <= out.t; t0 += STEP) if (s.cal.week(t0) === wk && s.cal.ms(t0) >= (u.from ? tms(u.from) : 0)) cap += 1;
          out.use[k].forEach(([t0, frac]) => { if (s.cal.week(t0) === wk) used += frac / STEP; });
        });
        return cap ? used / cap : null;
      };
      load.innerHTML = `<table class="cap-load"><thead><tr><th>Profil</th>${weeks.map((w) => `<th class="num">${dmy(w).slice(0, 5)}</th>`).join('')}</tr></thead><tbody>${profs.map((p) => `<tr><td>${p.label} <small>× ${String(cnt(p)).replace('.', ',')}</small></td>${weeks.map((w) => {
        const v = cell(p, w);
        if (v === null) return '<td class="num muted">·</td>';
        const r = Math.min(1, v), hue = 210 - r * 205;
        return `<td class="num" style="background:hsl(${hue} 80% ${95 - r * 12}%);color:hsl(${hue} 70% 28%)">${Math.round(v * 100)} %</td>`;
      }).join('')}</tr>`).join('')}</tbody></table>`;
      // sensitivity of the human team, on each mode without agents
      const fmtDelta = (ms, ref) => {
        if (ref === Infinity) return ms === Infinity ? '<span class="muted">reste bloqué</span>' : '<span class="cap-gain">débloque</span>';
        if (ms === Infinity) return '<span class="cap-loss">bloque la livraison</span>'; const dd = D.workBetween(Math.min(ms, ref), Math.max(ms, ref)); return dd === 0 ? '<span class="muted">aucun effet</span>' : `<span class="${ms < ref ? 'cap-gain' : 'cap-loss'}">${ms < ref ? '−' : '+'}${days(dd)}</span>`; };
      // the table says it all; the only warnings: a profile whose last full-time slows the delivery (one less would
      // be faster) or brings nothing (one less, same date)
      const slow = new Map(), idle = new Map();
      modes.forEach((hm) => {
        const base = hm.id === mode ? out : run(cfg, hm.id, s, null), ref = base.res.get(last.gate).stuck ? Infinity : relEnd(base, last), tag = effTag[hm.id] || hm.label;
        const shift = (p, d) => { const t2 = { ...s, count: { ...s.count, [p.id]: Math.max(0, (s.count[p.id] ?? p.count) + d) } }; const o = run(cfg, hm.id, t2, null); return o.res.get(last.gate).stuck ? Infinity : relEnd(o, last); };
        humanTeam().forEach((p) => {
          const cells = $$(`tr[data-prof="${p.id}"] td[data-mode="${hm.id}"]`, crew);
          if (p.modes && !p.modes.includes(hm.id)) { cells.forEach((c) => { c.innerHTML = '<span class="muted">·</span>'; }); return; }
          const c = set.count[p.id] ?? p.count, plus = shift(p, 1), minus = c > 0 ? shift(p, -1) : null;
          const gain = ref !== Infinity && minus !== null && minus < ref ? D.workBetween(minus, ref) : 0;
          if (gain > 0) slow.set(p, [...(slow.get(p) || []), `${days(gain)} ${tag}`]);
          else if (ref !== Infinity && minus !== null && minus <= ref) idle.set(p, [...(idle.get(p) || []), tag]);
          if (cells.length) { cells[0].innerHTML = fmtDelta(plus, ref); cells[1].innerHTML = minus === null ? '<span class="muted">·</span>' : fmtDelta(minus, ref); }
        });
      });
      const warns = [...slow.entries()].map(([p, parts]) => `<b>${p.label}</b> : un temps plein de moins avancerait la dernière release (${parts.join(', ')}).${p.team === 'dev' ? ' Le temps perdu en coordination dépasse ce qu\'il apporte.' : ''}`)
        .concat([...idle.entries()].filter(([p]) => !slow.has(p)).map(([p, tags]) => `<b>${p.label}</b> : le dernier temps plein ne fait rien gagner (${tags.join(', ')}) ; un temps plein de moins donne la même date.`));
      $('.cap-warn', crew).innerHTML = warns.length ? `<b>Profils en trop</b><ul>${warns.map((w) => `<li>${w}</li>`).join('')}</ul>` : '';
      const devs = profiles(mode).filter((p) => p.team === 'dev').reduce((t, p) => t + cnt(p), 0);
      const ex = (k, html) => { const e = $(`[data-ex="${k}"]`, conf); if (e) e.innerHTML = html; };
      ex('loss', devs > 1 ? `Avec ${String(devs).replace('.', ',')} développeurs (temps plein) dans ce mode, chacun travaille à ${Math.round(Math.pow(1 - set.loss / 100, devs - 1) * 100)} % de son temps.` : mode === 'ia' ? 'Ne s\'applique pas aux agents.' : 'Avec un seul développeur, rien n\'est perdu.');
      ex('range', `Exemple : une story estimée à 10 j prend entre ${String(set.opt / 10).replace('.', ',')} j et ${String(set.pess / 10).replace('.', ',')} j.`);
      ex('calib', 'Exemple : 1,2 veut dire que les stories ont pris 20 % de plus que prévu.');
      foldSummary();
      renderCmp();
    };
    const closedPeople = new Set();
    const renderCmp = () => {
      const s = cur(), last = cfg.releases[cfg.releases.length - 1];
      const outs = new Map(modes.map((m) => [m.id, run(cfg, m.id, s, null)]));
      // time to the last release (probable date), in working days; the default mode is the reference
      const lastP50 = (id) => { const mc = mcCache.get(id + ':' + last.id); return mc && !outs.get(id).res.get(last.gate).stuck ? Math.round(D.workBetween(tms(s.start), mc[0])) : null; };
      const refMode = modes.find((x) => x.default) || modes[0], ref = lastP50(refMode.id);
      cmp.innerHTML = `<table class="cap-cmp"><thead><tr><th rowspan="2">Mode</th>${cfg.releases.map((r) => `<th colspan="2" class="cap-relh">${r.label}</th>`).join('')}<th rowspan="2">Équipe</th></tr><tr>${cfg.releases.map(() => '<th>probable</th><th>prudente</th>').join('')}</tr></thead><tbody>${modes.map((m) => {
        const out = outs.get(m.id);
        const team = profiles(m.id).filter((p) => !p.external && p.calc !== false && cnt(p, s.count) > 0).map((p) => `${String(cnt(p, s.count)).replace('.', ',')} ${p.label}`).join(', ');
        const mine = lastP50(m.id);
        const dur = mine === null ? '' : m.id === refMode.id ? `${days(mine)} de réalisation (référence)`
          : ref === null ? '' : mine === ref ? `même durée que ${refMode.label}` : `${mine > ref ? '+' : '−'}${days(Math.abs(mine - ref))} par rapport à ${refMode.label}`;
        return `<tr class="${m.default ? 'recommended' : ''}"><td>${m.label}${dur ? `<small class="cap-dur">${dur}</small>` : ''}</td>${cfg.releases.map((r) => {
          const mc = mcCache.get(m.id + ':' + r.id);
          if (out.res.get(r.gate).stuck) return '<td class="cap-relc"><span class="cap-loss">bloqué</span></td><td></td>';
          if (!mc) return `<td class="cap-relc muted">calcul…</td><td class="muted">calcul…</td>`;
          const pct = Math.round(mc[2] * 100);
          // green: the prudent date holds (85 % and more) ; orange: likely but not safe ; red: more likely missed
          const level = pct >= 85 ? 'ok' : pct >= 50 ? 'mid' : 'bad';
          const tip = `Chances de tenir la MEP souhaitée : sur ${set.runs} simulations, ${pct} % livrent la release ${r.label} au plus tard le ${lastDay(dueMs(r))}.`;
          const mep = mc[2] === null ? '' : `<span class="cap-mep ${level}" data-tip="${tip}" tabindex="0">MEP ${lastDay(dueMs(r))} : <b>${pct} %</b></span>`;
          return `<td class="cap-relc">${lastDay(mc[0])}</td><td>${lastDay(mc[1])}${mep}</td>`;
        }).join('')}<td>${team}</td></tr>`;
      }).join('')}</tbody></table>`;
      // dates quoted in the text of the page: <span data-plan="mvp:p50|p85">, default mode with the current settings
      $$('[data-plan]').forEach((e) => {
        const [rid, q] = e.dataset.plan.split(':'), r = cfg.releases.find((x) => x.id === rid);
        if (!r) return;
        const mc = mcCache.get(refMode.id + ':' + r.id);
        e.textContent = outs.get(refMode.id).res.get(r.gate).stuck ? 'bloqué' : !mc ? '…' : lastDay(mc[q === 'p85' ? 1 : 0]);
      });
    };
    // measured sprints (rules.calibration.sprints), shown where the page has a host (.capa-calib)
    const calHost = $$('.capa-calib')[n];
    if (calHost) {
      const sp = (R.calibration && R.calibration.sprints) || [];
      const f = (v) => String(Math.round(v * 100) / 100).replace('.', ',');
      calHost.innerHTML = sp.length
        ? `<div class="table-wrap"><table><thead><tr><th>Sprint</th><th class="num">Estimé</th><th class="num">Réel</th><th class="num">Réel / estimé</th></tr></thead><tbody>${sp.map((x) => `<tr><td>${x.sprint}</td><td class="num">${f(x.estimated)} h</td><td class="num">${f(x.actual)} h</td><td class="num">${f(x.actual / x.estimated)}</td></tr>`).join('')}</tbody><tfoot><tr><td><b>Facteur mesuré</b></td><td></td><td></td><td class="num"><b>${f(sp.reduce((t, x) => t + x.actual, 0) / sp.reduce((t, x) => t + x.estimated, 0))}</b></td></tr></tfoot></table></div>`
        : '<p class="note">Aucun sprint mesuré pour l\'instant : facteur 1, les estimations ne sont pas corrigées.</p>';
    }
    buildConfig(); render();
    watch(box, render);
    document.addEventListener('estimate-change', render);
  }

  document.addEventListener('DOMContentLoaded', () => $$('.capa').forEach(init));
})();
