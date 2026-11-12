#!/usr/bin/env node
// Builds the steering page of a project (docs/index.html, which replaces the portal), its backlog page
// (docs/20-specs/backlog.html) and the inventory of its analyses (docs/10-analyse/index.html) from the project
// files, following the rules written in the (i) of the three formats (team/exemples/formats/docs/index.html,
// 20-specs/backlog.html and 10-analyse/index.html, skill livrable-pilotage).
// Sources: story map (stories, releases, epics), story pages (meta statut, taille, front, valide_par,
// valide_le, epic, release, type), roadmap (estimation macro, lanes, gates, version), sprint pages (dates,
// committed stories and reserves), analysis pages (meta type, auteur, statut, chantier, pour; lede, Date, sections
// Recommandation, Impacts sur les autres livrables, Questions et hypothèses), campaigns and PV (meta verdict, statut), cadrage (name and vision),
// deliverable headers (Statut), contract version (openapi.yaml), points ouverts, ADR pages, and from .team/:
// journal.md, board/ (front matter of T-xxx and BUG-xxx), questions/, notion.md. What cannot be computed
// (why a hotspot matters) is reduced to the title of its source: nothing is invented.
// The pages are rendered from the templates of skills/livrable-pilotage/ (plugin root); every computed part sits
// between <!-- gen:<name> --> and <!-- /gen:<name> -->.
// Usage: node team/scripts/pilotage-pages.mjs [<project dir> | docs] [--check] [--now "AAAA-MM-JJ HH:MM"]
//   The project dir defaults to the current directory.
//   --check  writes nothing; exit 1 on an error in the sources or when a page would change. The time of
//            the check is the update time written in the existing page, so a page only drifts when its
//            sources change.
//   --now    fixes the time of the generation (tests, reproducible output).
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname, basename, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const nowArg = (() => { const i = args.indexOf('--now'); return i >= 0 ? args[i + 1] : null; })();
const target = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--now') ?? '.';
if (!target || !existsSync(target) || !statSync(target).isDirectory()) {
  console.error('Usage: pilotage-pages.mjs [<project dir> | docs] [--check] [--now "AAAA-MM-JJ HH:MM"]'); process.exit(2);
}
const ROOT = existsSync(join(target, 'docs')) ? resolve(target) : resolve(target, '..');
const DOCS = existsSync(join(target, 'docs')) ? join(ROOT, 'docs') : resolve(target);
const TEAM = join(ROOT, '.team');
const SKILL = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'skills', 'livrable-pilotage');
const OUT_PIL = join(DOCS, 'index.html');
const OUT_BL = join(DOCS, '20-specs', 'backlog.html');
const OUT_AN = join(DOCS, '10-analyse', 'index.html');

let errors = 0, warnings = 0;
const err = (m) => { errors++; console.error(`ERROR ${m}`); };
const warn = (m) => { warnings++; console.error(`warn ${m}`); };

// ---------- helpers ----------
const read = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : '');
const D = (p) => join(DOCS, p);
const has = (p) => existsSync(D(p));
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = (h) => String(h ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&#39;|&rsquo;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const norm = (t) => String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const key = (t) => norm(t).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const metaOf = (html, name) => ((html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`)) || [])[1] ?? null);
const headerOf = (html) => (html.match(/<header class="doc-header">([\s\S]*?)<\/header>/) || [])[1] || '';
const field = (html, label) => {
  const m = headerOf(html).match(new RegExp(`<b>${label}</b>\\s*([\\s\\S]*?)</span>\\s*(?:<span>|</div>)`));
  return m ? m[1] : null;
};
// Status of a deliverable: meta statut, else the tag after <b>Statut</b> in its header
const statusOf = (html) => {
  if (!html) return null;
  const m = metaOf(html, 'statut');
  if (m) return norm(m);
  const t = (headerOf(html).match(/<b>Statut<\/b>\s*<span class="tag[^"]*">([^<]*)<\/span>/) || [])[1];
  return t ? norm(t) : null;
};
const sectionOf = (html, title) => {
  for (const [, body] of html.matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/g)) {
    const h = strip((body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1]);
    if (norm(h) === norm(title)) return body.replace(/<div class="info-body"[\s\S]*?<\/dl>\s*<\/div>/, '');
  }
  return '';
};
const rows = (html) => [...String(html).matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/g)].map(([, attrs, body]) => ({
  attrs, body, cells: [...body.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => c[1]),
}));
const anchorCache = new Map();
const anchors = (p) => {
  if (!anchorCache.has(p)) anchorCache.set(p, new Set([...read(D(p)).matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])));
  return anchorCache.get(p);
};
const filesIn = (p, re) => (existsSync(D(p)) ? readdirSync(D(p)).filter((f) => re.test(f)).sort() : []);
const num = (id) => Number(String(id).replace(/\D+/g, ''));
const byId = (a, b) => num(a.id) - num(b.id);
const plural = (n, one, many) => (n > 1 ? many : one);
const WORDS = ['zéro', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];
const word = (n) => WORDS[n] || String(n);
const pct = (n, t) => `${t ? +(n * 100 / t).toFixed(1) : 0}%`;
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// ---------- dates ----------
// A day is "AAAA-MM-JJ"; arithmetic in UTC so that no time zone moves a date.
const fromFr = (t) => { const m = String(t || '').match(/(\d{2})\.(\d{2})\.(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : null; };
const fr = (iso) => (iso ? iso.split('-').reverse().join('.') : '');
const frShort = (iso) => fr(iso).slice(0, 5);
const dayUTC = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
const daysBetween = (a, b) => Math.round((dayUTC(b) - dayUTC(a)) / 86400000);
const workdays = (a, b) => { let n = 0; for (let t = dayUTC(a); t <= dayUTC(b); t += 86400000) { const d = new Date(t).getUTCDay(); if (d && d < 6) n++; } return n; };
const WEEKDAY = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const weekday = (iso) => WEEKDAY[new Date(dayUTC(iso)).getUTCDay()];
const pad = (n) => String(n).padStart(2, '0');

// Time of the generation: --now, else (--check) the stamp of the existing page, else the clock
const stamp = (() => {
  const parse = (s) => { const m = String(s || '').match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/); return m ? { day: m[1], time: m[2] } : null; };
  if (nowArg) { const p = parse(nowArg); if (!p) { console.error('--now attendu au format "AAAA-MM-JJ HH:MM"'); process.exit(2); } return p; }
  if (CHECK) {
    const m = read(OUT_PIL).match(/Mis à jour le (\d{2}\.\d{2}\.\d{4}) à (\d{2}:\d{2})/);
    if (m) return { day: fromFr(m[1]), time: m[2] };
  }
  const d = new Date();
  return { day: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
})();
const TODAY = stamp.day;

// ---------- .team: journal, board, questions, notion ----------
const parseFront = (src) => {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta = {};
  if (!m) return { meta, body: src };
  m[1].split('\n').forEach((line) => {
    const kv = line.match(/^(\w+):\s*(.*?)\s*(#.*)?$/);
    if (!kv) return;
    const v = kv[2].replace(/^["']|["']$/g, '');
    meta[kv[1]] = v.startsWith('[') ? v.replace(/[[\]]/g, '').split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean) : v;
  });
  return { meta, body: m[2] };
};
const journal = read(join(TEAM, 'journal.md')).split('\n').map((l) => l.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) · ([^·]+?) · (.*)$/))
  .filter(Boolean).map(([, day, time, type, text]) => ({ day, time, type: type.trim(), text: text.trim() }));
const mentionDay = (id) => {
  const re = new RegExp(`\\b${id.replace(/[-/]/g, '\\$&')}\\b`);
  const l = [...journal].reverse().find((e) => re.test(e.text) && !/^(dispatch|rapport)$/i.test(e.type));
  return l ? l.day : null;
};
const board = [];
if (existsSync(join(TEAM, 'board'))) {
  readdirSync(join(TEAM, 'board')).filter((f) => /^(T|BUG)-\d+.*\.md$/.test(f)).sort().forEach((f) => {
    const { meta } = parseFront(read(join(TEAM, 'board', f)));
    const id = meta.id || f.match(/^((?:T|BUG)-\d+)/)[1];
    board.push({ id, file: f, bug: id.startsWith('BUG-'), titre: meta.titre || '', statut: meta.statut || 'backlog',
      sprint: meta.sprint ? Number(meta.sprint) : null, tours: Number(meta.tours_revue || 0), instance: meta.instance || meta.role || '',
      severite: meta.severite || '', stories: meta.stories || [] });
  });
}
const TICKET_ST = ['backlog', 'pret', 'en-cours', 'en-revue', 'en-test', 'fait', 'bloque'];
board.forEach((t) => { if (!TICKET_ST.includes(t.statut)) err(`.team/board/${t.file} : statut « ${t.statut} », attendu ${TICKET_ST.join(' | ')}`); });
const ticket = (id) => board.find((t) => t.id === id);
const boardHref = (id) => { const t = ticket(id); return t ? `../.team/board/${t.file}` : null; };

// Questions: .team/questions/ (source of truth), else the generated page questions.html
const questions = (() => {
  const dir = join(TEAM, 'questions');
  if (existsSync(dir)) {
    return readdirSync(dir).filter((f) => /^Q-\d+.*\.md$/.test(f)).sort().map((f) => {
      const { meta, body } = parseFront(read(join(dir, f)));
      const part = (t) => ((body.split(/^##\s+/m).find((s) => norm(s.split('\n')[0]).startsWith(norm(t))) || '').split('\n').slice(1).join(' ').trim());
      return { id: meta.id || f.match(/^(Q-\d+)/)[1], statut: meta.statut || 'ouverte', bloquant: meta.bloquant === 'oui',
        lie: [].concat(meta.lie_a || []), text: part('Question'), hyp: part('Hypothèse') };
    });
  }
  const html = read(D('questions.html'));
  return [...html.matchAll(/<article class="q-card" id="(Q-\d+)">([\s\S]*?)<\/article>/g)].map(([, id, body]) => {
    const lie = (body.match(/<b>Lié à<\/b>([\s\S]*?)<\/span><span>/) || [])[1] || '';
    const part = (t) => strip((body.match(new RegExp(`<h4>${t}[^<]*</h4>([\\s\\S]*?)</div>`)) || [])[1] || '');
    return { id, statut: norm((body.match(/<span class="tag[^"]*">([^<]+)<\/span>/) || [])[1] || 'ouverte'),
      bloquant: /bloquante/.test(body), lie: strip(lie).match(/\b[A-Z]{1,5}-\d+\b/g) || [], text: part('Question'), hyp: part('Hypothèse') };
  });
})();

const notionUrl = (() => {
  const t = read(join(TEAM, 'notion.md'));
  const base = t.match(/Base\s*:\s*(https?:\/\/\S+)/i) || t.match(/(https?:\/\/\S*notion\S*)/i);
  return base ? base[1].replace(/[).,;]+$/, '') : null;
})();

// ---------- story map ----------
const smHtml = read(D('20-specs/story-map.html'));
if (!smHtml) warn('20-specs/story-map.html absente : backlog vide');
const releases = [];
const smStories = [];
{
  let cur = null;
  const re = /<div class="sm-release[^"]*">([\s\S]*?)<\/div>|<a class="sm-story([^"]*)" href="([^"]+)">\s*<span class="id">([^<]+)<\/span>([\s\S]*?)<\/a>/g;
  for (const m of smHtml.matchAll(re)) {
    if (m[1] !== undefined) {
      const label = strip(m[1]).split(':')[0].trim();
      const k = key(label);
      cur = releases.find((r) => r.key === k) || (releases.push({ key: k, label }), releases[releases.length - 1]);
    } else {
      const id = m[4].trim();
      if (smStories.some((s) => s.id === id)) continue;
      smStories.push({ id, href: posix.join('20-specs', m[3]), title: strip(m[5]), rel: cur ? cur.key : null, spikeClass: /spike/.test(m[2]) });
    }
  }
}
// Correspondence story to epic (story map), "US-002 à US-006, US-010"
const epics = new Map();
const smEpic = new Map();
rows(sectionOf(smHtml, 'Correspondance avec les epics')).forEach(({ cells }) => {
  if (cells.length < 3) return;
  const link = cells[1].match(/<a href="([^"]+)">\s*(EPIC-\d+)\s*<\/a>\s*([\s\S]*)/);
  if (!link) return;
  epics.set(link[2], { id: link[2], href: posix.join('20-specs', link[1]), title: strip(link[3]) });
  strip(cells[2]).split(/[,;]|\bet\b/).forEach((tok) => {
    const r = tok.match(/US-(\d+)\s*à\s*US-(\d+)/);
    if (r) smStories.filter((s) => num(s.id) >= +r[1] && num(s.id) <= +r[2]).forEach((s) => smEpic.set(s.id, link[2]));
    else (tok.match(/US-\d+/g) || []).forEach((id) => smEpic.set(id, link[2]));
  });
});

// ---------- roadmap ----------
const rmHtml = read(D('roadmap.html'));
const rmVersion = strip(field(rmHtml, 'Version') || '');
const est = new Map();
for (const m of rmHtml.matchAll(/<tr\b([^>]*\bdata-size="[^"]+"[^>]*)>\s*<td><a [^>]*>(US-\d+)<\/a>/g)) {
  const a = (n) => (m[1].match(new RegExp(`data-${n}="([^"]*)"`)) || [])[1];
  est.set(m[2], { taille: a('size'), front: a('front') != null ? Number(a('front')) : null, rel: a('rel') });
}
const WEIGHT = { XS: 1, S: 2, M: 4, L: 5, XL: 8 };
const scale = (rmHtml.match(/data-h="([^"]+)"/) || [])[1];
if (scale) scale.split(/\s+/).forEach((p) => { const [k, v] = p.split(':'); if (k in WEIGHT && !isNaN(+v)) WEIGHT[k] = +v; });
const rmEpic = new Map();
{
  const grid = sectionOf(rmHtml, 'Roadmap');
  grid.split('<div class="rm-lane">').slice(1).forEach((lane) => {
    const e = (lane.match(/^[\s\S]*?(EPIC-\d+)/) || [])[1];
    if (!e) return;
    const body = lane.split('</div>').slice(1).join('</div>');
    (body.match(/US-\d+/g) || []).forEach((id) => { if (!rmEpic.has(id)) rmEpic.set(id, e); });
    if (!epics.has(e)) {
      const l = lane.match(/<a href="([^"]+)">\s*EPIC-\d+\s*<\/a>\s*([^<]*)/);
      if (l) epics.set(e, { id: e, href: l[1], title: l[2].trim() });
    }
  });
}
const rmGates = new Map();
for (const m of sectionOf(rmHtml, 'Roadmap').matchAll(/data-gate="(G[0-2])\|([^"|]+)(?:\|([^"]+))?"/g)) {
  if (/^\s*valid/i.test(m[2])) rmGates.set(m[1], { date: fromFr(m[3]) });
}
// Releases named by the roadmap when the story map does not name them
if (!releases.length) {
  for (const m of sectionOf(rmHtml, 'Roadmap').matchAll(/<div class="rm-head"[^>]*data-gate="G3"[^>]*>([^<]+)<\/div>/g)) {
    releases.push({ key: key(m[1]), label: m[1].trim() });
  }
}
const UNNAMED = !releases.length;
if (UNNAMED) releases.push({ key: 'release', label: 'Release', unnamed: true });
releases.forEach((r, i) => {
  r.order = i;
  r.isMvp = r.key === 'mvp';
  r.tagClass = r.unnamed ? 'tag' : i === 0 ? 'tag accent' : i === 1 ? 'tag warn' : 'tag';
  r.long = r.unnamed ? 'Release' : r.isMvp ? 'MVP' : `Release ${r.label}`; // card titles, facet options
  r.of = r.unnamed ? 'de la release' : r.isMvp ? 'du MVP' : `de la release ${r.label}`;
  r.the = r.unnamed ? 'la release' : r.isMvp ? 'le MVP' : `la release ${r.label}`;
});
const relOf = (k) => releases.find((r) => r.key === k) || releases[0];

// ---------- story pages ----------
const STORY_ST = ['brouillon', 'prete', 'validee', 'en-sprint', 'faite', 'abandonnee'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const pages = new Map();
filesIn('20-specs/stories', /^US-\d+.*\.html$/).forEach((f) => {
  const html = read(D(`20-specs/stories/${f}`));
  const id = metaOf(html, 'id') || f.match(/^(US-\d+)/)[1];
  const p = { id, file: `20-specs/stories/${f}`, type: metaOf(html, 'type') || 'story', statut: metaOf(html, 'statut'),
    taille: metaOf(html, 'taille') || null, front: metaOf(html, 'front'), epic: metaOf(html, 'epic') || null, release: metaOf(html, 'release'),
    valide_par: metaOf(html, 'valide_par') || '', valide_le: metaOf(html, 'valide_le') || '',
    questions: [...html.matchAll(/class="qmark"[^>]*>(Q-\d+)</g)].map((m) => m[1]),
    title: strip((html.match(/<h1[^>]*>[\s\S]*?<\/span>\s*:\s*([\s\S]*?)<\/h1>/) || [])[1] || '') };
  const where = p.file;
  if (!STORY_ST.includes(p.statut)) err(`${where} : meta statut « ${p.statut ?? ''} », attendu ${STORY_ST.join(' | ')}`);
  if (p.type !== 'spike') {
    if (p.taille && !SIZES.includes(p.taille)) err(`${where} : meta taille « ${p.taille} », attendu ${SIZES.join(' | ')}`);
    if (p.front != null && p.front !== '' && !/^(100|\d{1,2})$/.test(p.front)) err(`${where} : meta front « ${p.front} », attendu un entier de 0 à 100`);
  }
  if (p.valide_par && !['humain', 'po'].includes(p.valide_par)) err(`${where} : meta valide_par « ${p.valide_par} », attendu humain | po`);
  if (p.valide_le && !/^\d{2}\.\d{2}\.\d{4}$/.test(p.valide_le)) err(`${where} : meta valide_le « ${p.valide_le} », attendu JJ.MM.AAAA`);
  if (p.statut === 'validee' && !p.valide_par) warn(`${where} : statut validee sans meta valide_par`);
  if (['brouillon', 'prete'].includes(p.statut) && (p.valide_par || p.valide_le)) warn(`${where} : statut ${p.statut} avec valide_par ou valide_le renseigné ; une story validée porte le statut validee ou au-delà`);
  p.front = p.front === '' || p.front == null ? null : Number(p.front);
  pages.set(id, p);
});

// ---------- sprints, campaigns, PV ----------
const VERDICT_C = ['favorable', 'favorable-avec-reserves', 'defavorable'];
const VERDICT_P = ['accepte', 'accepte-avec-reserves', 'refuse'];
const verdictOf = (html, where, allowed) => {
  const m = metaOf(html, 'verdict');
  if (m != null && m !== '') {
    if (!allowed.includes(m)) err(`${where} : meta verdict « ${m} », attendu ${allowed.join(' | ')}`);
    return allowed.includes(m) ? m : null;
  }
  const t = (html.match(/<b>Verdict\s*:\s*([^<]+)<\/b>/) || [])[1];
  const k = t ? key(t) : null;
  return allowed.includes(k) ? k : null;
};
const VERDICT_LABEL = { favorable: 'favorable', 'favorable-avec-reserves': 'favorable avec réserves', defavorable: 'défavorable',
  accepte: 'accepté', 'accepte-avec-reserves': 'accepté avec réserves', refuse: 'refusé' };
const sprints = filesIn('sprints', /^sprint-\d+\.html$/).map((f) => {
  const html = read(D(`sprints/${f}`));
  const n = Number(f.match(/\d+/)[0]);
  const dates = strip(field(html, 'Dates') || '').match(/(\d{2}\.\d{2}\.\d{4})\D+(\d{2}\.\d{2}\.\d{4})/);
  const engaged = sectionOf(html, 'Stories engagées');
  const stories = [];
  rows(engaged).forEach(({ cells }) => { const id = (strip(cells[0] || '').match(/^US-\d+/) || [])[0]; if (id && !stories.includes(id)) stories.push(id); });
  const reserves = [...new Set(engaged.match(/RES-\d+/g) || [])];
  const s = { n, file: `sprints/${f}`, statut: statusOf(html), start: dates ? fromFr(dates[1]) : null, end: dates ? fromFr(dates[2]) : null, stories, reserves };
  if (!dates) warn(`${s.file} : dates du sprint absentes de l'en-tête (« Dates du JJ.MM.AAAA au JJ.MM.AAAA »)`);
  const cf = `40-qa/campagne-sprint-${n}.html`;
  if (has(cf)) {
    const c = read(D(cf));
    let green = 0, total = 0;
    rows(sectionOf(c, 'Résultats par scénario')).forEach(({ body }) => {
      if (!/US-\d+\/S\d+/.test(strip(body))) return;
      total++;
      const tags = [...body.matchAll(/<span class="tag[^"]*">(vert|rouge)<\/span>/g)].map((m) => m[1]);
      if (tags[tags.length - 1] === 'vert') green++;
    });
    s.camp = { file: cf, statut: statusOf(c), verdict: verdictOf(c, cf, VERDICT_C), green, total };
  }
  const pf = `50-recette/pv-sprint-${n}.html`;
  if (has(pf)) {
    const p = read(D(pf));
    const st = statusOf(p) || '';
    const accepted = [];
    rows(sectionOf(p, 'Résultats')).forEach(({ cells }) => {
      const id = (strip(cells[0] || '').match(/^US-\d+/) || [])[0];
      const res = norm(strip(cells[2] || ''));
      if (id && /^accept/.test(res)) accepted.push(id);
    });
    const reserves = rows(sectionOf(p, 'Réserves')).filter((r) => /id="RES-\d+"/.test(r.attrs)).map(({ attrs, body }) => ({
      id: attrs.match(/id="(RES-\d+)"/)[1], story: (body.match(/US-\d+/) || [])[0] || null,
      item: (strip(body).match(/\b(?:BUG|T)-\d+\b/) || [])[0] || null, sev: (norm(strip(body)).match(/\b(bloquante|majeure|mineure)\b/) || [])[1] || null,
    }));
    const dt = fromFr(strip(field(p, 'Date de recette') || '')) || fromFr((headerOf(p).match(/<b>Statut<\/b>[\s\S]*?<\/span>\s*([\d.]+)/) || [])[1]);
    s.pv = { file: pf, statut: st, signed: /^sign/.test(st), refused: /^refus/.test(st), verdict: verdictOf(p, pf, VERDICT_P), date: dt, accepted, reserves };
  }
  s.done = !!(s.pv && s.pv.signed) || /^clos/.test(s.statut || '');
  return s;
}).sort((a, b) => a.n - b.n);
const current = [...sprints].reverse().find((s) => !s.done) || null;
const lastPV = [...sprints].reverse().find((s) => s.pv && s.pv.signed) || null;
// Delivered: accepted in a signed PV (the PV is the source of truth)
const delivered = new Map();
sprints.forEach((s) => { if (s.pv && s.pv.signed && s.pv.verdict !== 'refuse') s.pv.accepted.forEach((id) => { if (!delivered.has(id)) delivered.set(id, s); }); });
const reserves = sprints.flatMap((s) => (s.pv && s.pv.signed ? s.pv.reserves.map((r) => ({ ...r, sprint: s })) : []));
const resHref = (id) => { const r = reserves.find((x) => x.id === id) || sprints.flatMap((s) => (s.pv ? s.pv.reserves.map((x) => ({ ...x, sprint: s })) : [])).find((x) => x.id === id); return r ? `${r.sprint.pv.file}#${id}` : null; };
// A reserve is lifted when the anomaly or the ticket linked to it is "fait"
reserves.forEach((r) => { const t = r.item && ticket(r.item); r.open = !(t && t.statut === 'fait'); r.ticket = t || null; });

// ---------- gates G0 to G2 ----------
const GATES = {
  G0: { name: 'Validation du cadrage', object: 'Cadrage', trace: [['00-cadrage/cadrage.html', 'Cadrage']] },
  G1: { name: 'Validation de la conception fonctionnelle', object: 'Specs, UX, prototype',
    trace: [['20-ux/spec-ux-ui.html', 'Spec UX/UI'], ['../prototype/index.html', 'prototype']],
    ready: [['20-specs/story-map.html', 'Story map'], ['20-specs/conception-fonctionnelle.html', 'Conception fonctionnelle'], ['20-ux/spec-ux-ui.html', 'Spec UX/UI'], ['roadmap.html', 'Roadmap']] },
  G2: { name: 'Validation de la conception technique', object: 'Conception technique', trace: [['30-conception/detaillee/index.html', 'Conception détaillée']],
    ready: [['30-conception/macro.html', 'Conception macro'], ['30-conception/detaillee/index.html', 'Conception détaillée'], ['40-qa/strategie.html', 'Stratégie de test']] },
};
GATES.G0.ready = GATES.G0.trace;
const gate = {};
['G0', 'G1', 'G2'].forEach((g) => {
  const lines = journal.filter((e) => e.type.toUpperCase() === g);
  const last = lines[lines.length - 1];
  if (last) gate[g] = { crossed: /^\s*(?:\S+\s+)?valid/i.test(last.text) && !/\bnon\s+valid|à\s+valider|\brefus/i.test(last.text), date: last.day, source: 'journal' };
  else if (rmGates.has(g)) gate[g] = { crossed: true, date: rmGates.get(g).date, source: 'roadmap' };
  else gate[g] = { crossed: false };
});
const crossed = (g) => !!(gate[g] && gate[g].crossed);

// ---------- stories: the backlog ----------
const pageHref = (p) => (p ? p.file : null);
const stories = [];
const gaps = [];
const gapId = (id, kind) => `ecart-${id}-${kind}`;
smStories.forEach((s) => {
  const p = pages.get(s.id) || null;
  if ((p && p.type === 'spike') || (!p && s.spikeClass)) return; // spikes stay out of the backlog
  const e = est.get(s.id) || {};
  const st = { id: s.id, title: s.title || (p && p.title) || '', href: p ? p.file : s.href, page: p, rel: s.rel || releases[0].key, notes: [], gaps: [] };
  const gap = (kind, label, html) => { const g = { id: gapId(s.id, kind), story: st, kind, label, html }; gaps.push(g); st.gaps.push(g); };
  // size and front: the story page, else the roadmap estimate
  st.taille = (p && p.taille) || e.taille || null;
  st.front = p && p.front != null ? p.front : (e.front != null ? e.front : null);
  const rmLink = '<a href="roadmap.html#estimation-macro">estimation macro</a>';
  if (p && p.taille && e.taille && p.taille !== e.taille) gap('taille', `la roadmap dit ${e.taille}`, `<b>Taille</b> : ${p.taille} dans la page de la story, ${e.taille} dans l'${rmLink}. Le tableau retient ${p.taille}.`);
  if (p && p.front != null && e.front != null && p.front !== e.front) gap('front', `la roadmap dit ${e.front} % front`, `<b>Part front</b> : ${p.front} % dans la page de la story, ${e.front} % dans l'${rmLink}. Le tableau retient ${p.front} %.`);
  // release: the story map
  const relLabel = (k) => (releases.find((r) => r.key === k) || { label: k }).label;
  if (e.rel && !UNNAMED && key(e.rel) !== st.rel) gap('release-roadmap', `la roadmap dit ${relLabel(key(e.rel))}`, `<b>Release</b> : ${relLabel(st.rel)} dans la story map, ${relLabel(key(e.rel))} dans l'${rmLink}. Le tableau retient ${relLabel(st.rel)}.`);
  if (p && p.release && !UNNAMED && key(p.release) !== st.rel) gap('release', `la page de la story dit ${p.release}`, `<b>Release</b> : ${relLabel(st.rel)} dans la story map, ${esc(p.release)} dans la page de la story. Le tableau retient ${relLabel(st.rel)}.`);
  // epic: the correspondence of the story map, else the story page, else the roadmap
  const smE = smEpic.get(s.id), pE = p && p.epic, rE = rmEpic.get(s.id);
  st.epic = smE || pE || rE || null;
  const eLink = (id) => (epics.has(id) ? `<a href="${epics.get(id).href}">${id}</a>` : id);
  const corr = '<a href="20-specs/story-map.html#correspondance-avec-les-epics">correspondance avec les epics</a>';
  if (!smE && epics.size && (pE || rE)) gap('epic', 'epic absent de la correspondance de la story map', `<b>Epic</b> : absente de la ${corr} de la story map, rangée sous ${eLink(st.epic)} ${pE ? 'dans la page de la story' : 'dans la roadmap'}. Le tableau retient ${eLink(st.epic)}.`);
  else if (smE && pE && smE !== pE) gap('epic', `la page de la story dit ${pE}`, `<b>Epic</b> : ${eLink(smE)} dans la ${corr} de la story map, ${eLink(pE)} dans la page de la story. Le tableau retient ${eLink(smE)}.`);
  else if (smE && rE && smE !== rE) gap('epic-roadmap', `la roadmap dit ${rE}`, `<b>Epic</b> : ${eLink(smE)} dans la ${corr} de la story map, ${eLink(rE)} dans la roadmap. Le tableau retient ${eLink(smE)}.`);
  // status: one scale, the PV and the sprint page win over the meta of the story
  const pv = delivered.get(s.id);
  const inSprint = current && current.stories.includes(s.id) ? current : null;
  const meta = p ? p.statut : null;
  const metaCode = `<code>${esc(meta)}</code> dans la page de la story`;
  if (p && meta === 'abandonnee') st.status = 'abandonnee';
  else if (pv) {
    st.status = 'livree'; st.sprint = pv;
    if (p && meta !== 'faite') gap('statut', `la page de la story dit ${meta}`, `<b>Statut</b> : ${metaCode}, acceptée au <a href="${pv.pv.file}">PV du sprint ${pv.n}</a>. Le tableau retient Livrée.`);
  } else if (inSprint) {
    st.status = 'sprint'; st.sprint = inSprint;
    if (p && meta !== 'en-sprint') gap('statut', `la page de la story dit ${meta}`, `<b>Statut</b> : ${metaCode}, engagée dans le <a href="${inSprint.file}#stories-engagees">sprint ${inSprint.n}</a>. Le tableau retient En sprint ${inSprint.n}.`);
  } else if (!p) st.status = 'arediger';
  else if (meta === 'faite' || meta === 'en-sprint') {
    st.status = 'validee';
    gap('statut', `la page de la story dit ${meta}`, `<b>Statut</b> : ${metaCode}, ${meta === 'faite' ? 'acceptée dans aucun PV signé' : 'engagée dans aucun sprint en cours'}. Le tableau retient Validée.`);
  } else st.status = { brouillon: 'redigee', prete: 'prete', validee: 'validee' }[meta] || 'redigee';
  stories.push(st);
});
// Stories of the roadmap absent from the story map: a gap, no row
[...est.keys()].filter((id) => !smStories.some((s) => s.id === id) && !(pages.get(id) && pages.get(id).type === 'spike')).forEach((id) => {
  gaps.push({ id: gapId(id, 'story-map'), story: { id, href: pages.has(id) ? pages.get(id).file : null }, kind: 'story-map',
    html: `<b>Story map</b> : absente de la story map, présente dans l'<a href="roadmap.html#estimation-macro">estimation macro</a> de la roadmap. Le tableau ne la montre pas.` });
});
const counted = stories.filter((s) => s.status !== 'abandonnee');
const epicIds = [...new Set(counted.map((s) => s.epic).filter(Boolean))];
const ST = {
  livree: ['Livrée', 'Livrées'], sprint: ['En sprint', 'En sprint'], validee: ['Validée', 'Validées'], prete: ['Prête', 'Prêtes'],
  redigee: ['Rédigée', 'Rédigées'], arediger: ['À rédiger', 'À rédiger'], abandonnee: ['Abandonnée', 'Abandonnées'],
};
const ST_ORDER = ['livree', 'sprint', 'validee', 'prete', 'redigee', 'arediger'];
const stLabel = (k, n, sp) => (k === 'sprint' ? `En sprint ${sp ? sp.n : ''}`.trim() : ST[k][n > 1 ? 1 : 0]);
const inRel = (k) => counted.filter((s) => s.rel === k);
const isDelivered = (s) => s.status === 'livree';
releases.forEach((r) => {
  const list = inRel(r.key);
  r.total = list.length;
  r.delivered = list.filter(isDelivered).length;
  r.crossed = r.total > 0 && r.delivered === r.total;
  r.date = r.crossed ? list.map((s) => s.sprint.pv.date).sort().pop() : null;
  r.sprints = sprints.filter((sp) => sp.stories.some((id) => list.some((s) => s.id === id)));
});
// Release in progress: the release of the sprint in progress, else the first release not crossed once G2 is
const curRelease = (current && releases.find((r) => current.stories.some((id) => counted.some((s) => s.id === id && s.rel === r.key))))
  || (crossed('G2') || sprints.length ? releases.find((r) => !r.crossed) : null) || null;

// ---------- links inside a text (journal, questions) ----------
const storyHref = (id) => (pages.get(id) ? pages.get(id).file : (smStories.find((s) => s.id === id) || {}).href || null);
const targetOf = (id) => {
  let m;
  if ((m = id.match(/^(US-\d+)\/([SDR]\d+)$/))) { const h = storyHref(m[1]); return h ? `${h}#${m[2]}` : null; }
  if (/^US-/.test(id)) return storyHref(id);
  if (/^EPIC-/.test(id)) return epics.has(id) ? epics.get(id).href : null;
  if (/^Q-/.test(id)) return anchors('questions.html').has(id) ? `questions.html#${id}` : null;
  if ((m = id.match(/^(EP|EN|TR)-/))) {
    const dir = { EP: 'endpoints', EN: 'entites', TR: 'traitements' }[m[1]];
    if (has(`30-conception/detaillee/${dir}/${id}.html`)) return `30-conception/detaillee/${dir}/${id}.html`;
    return anchors('30-conception/macro.html').has(id) ? `30-conception/macro.html#${id}` : null;
  }
  if (/^(RG|PF|CALC|MSG)-\d/.test(id)) {
    if (anchors('20-specs/conception-fonctionnelle.html').has(id)) return `20-specs/conception-fonctionnelle.html#${id}`;
    return anchors('00-cadrage/cadrage.html').has(id) ? `00-cadrage/cadrage.html#${id}` : null;
  }
  if (/^(EC|MSG-U)/.test(id)) return anchors('20-ux/spec-ux-ui.html').has(id) ? `20-ux/spec-ux-ui.html#${id}` : null;
  if (/^CF-/.test(id)) return anchors('30-conception/detaillee/transverse/conformite.html').has(id) ? `30-conception/detaillee/transverse/conformite.html#${id}` : null;
  if (/^(T|BUG)-/.test(id)) return boardHref(id);
  if (/^RES-/.test(id)) return resHref(id);
  if (/^ADR-/.test(id)) { const f = filesIn('adr', new RegExp(`^${id.slice(4)}-.*\\.html$`))[0]; return f ? `adr/${f}` : null; }
  return null;
};
const ID_RE = /\b(US-\d+\/[SDR]\d+|ADR-\d{4}|MSG-U\d+|(?:US|EPIC|Q|EP|EN|TR|RG|PF|CALC|MSG|EC|CF|T|BUG|RES)-\d+)\b/g;
const linkify = (text) => String(text).split('`').map((part, i) => {
  if (i % 2) return `<code>${esc(part)}</code>`;
  return esc(part).replace(ID_RE, (id) => {
    const t = targetOf(id);
    if (!t) return id;
    return /^Q-/.test(id) ? `<a class="qmark" href="${t}">${id}</a>` : `<a href="${t}">${id}</a>`;
  });
}).join('');
// Rewrites the docs-relative links of a fragment for a page in docs/<dir>
const rebase = (html, dir) => (!dir ? html : html.replace(/\b(href)="(?![a-z]+:|#|\/)([^"]*)"/g, (m, attr, h) => {
  const [p, a] = h.split('#');
  return `${attr}="${p ? posix.relative(dir, p) : ''}${a ? `#${a}` : ''}"`;
}));
const link = (href, text, extra = '') => (href ? `<a href="${href}"${extra}>${text}</a>` : text);

// ---------- analyses of the chantiers (docs/10-analyse/, meta type="analyse") ----------
const AN_PHASES = ['P1', 'P2', 'P3'];
// Label of a column of the overview: phase id, or the head of the release column
const colLabel = (c) => (AN_PHASES.includes(c) ? c : (releases.find((r) => r.key === c) || { label: c }).label);
// The same label in a text: a release in <span data-release> (a bare R2 would read as a rule of a story)
const colText = (c) => (AN_PHASES.includes(c) ? c : `<span data-release>${esc(colLabel(c))}</span>`);
const colOrder = (c) => (AN_PHASES.includes(c) ? AN_PHASES.indexOf(c) : 10 + (releases.find((r) => r.key === c) || { order: 99 }).order);
const AN_STATUT = { brouillon: ['brouillon', 'tag warn'], 'en-revue': ['en revue', 'tag info'], valide: ['validé', 'tag ok'] };
const AN_CHANTIER = { 'en-cours': ['en cours', 'tag info'], 'restitue-partiel': ['restitué partiel', 'tag danger'], termine: ['terminé', 'tag ok'] };
// Deliverables named without a link in the first column of "Impacts sur les autres livrables"
const DELIVERABLE_FILES = {
  cadrage: '00-cadrage/cadrage.html', 'cadrage et vision': '00-cadrage/cadrage.html', 'big picture': '10-analyse/big-picture.html',
  'story map': '20-specs/story-map.html', 'conception fonctionnelle': '20-specs/conception-fonctionnelle.html',
  backlog: '20-specs/backlog.html', 'epics et user stories': '20-specs/backlog.html', 'spec ux/ui': '20-ux/spec-ux-ui.html',
  prototype: '../prototype/index.html', roadmap: 'roadmap.html', 'conception macro': '30-conception/macro.html',
  'conception technique macro': '30-conception/macro.html', 'conception detaillee': '30-conception/detaillee/index.html',
  'conception technique detaillee': '30-conception/detaillee/index.html', "contrat d'api": '30-conception/api/openapi.yaml',
  conformite: '30-conception/detaillee/transverse/conformite.html', 'strategie de test': '40-qa/strategie.html',
};
// Links of a fragment of docs/10-analyse/<f> made relative to docs/ (rebase() writes them back for the output page)
const toDocs = (html, f) => String(html).replace(/\bhref="(?![a-z]+:|\/)([^"]*)"/g, (m, h) => {
  if (h.startsWith('#')) return `href="10-analyse/${f}${h}"`;
  const [p, a] = h.split('#');
  return `href="${posix.normalize(posix.join('10-analyse', p))}${a ? `#${a}` : ''}"`;
});
const analyses = [];
filesIn('10-analyse', /\.html$/).filter((f) => !['index.html', 'big-picture.html'].includes(f)).forEach((f) => {
  const html = read(D(`10-analyse/${f}`));
  const where = `10-analyse/${f}`;
  const type = metaOf(html, 'type');
  if (type !== 'analyse') { if (!type) warn(`${where} : pas de meta type="analyse", page hors de l'inventaire des analyses`); return; }
  const headTag = (label) => { const m = (field(html, label) || '').match(/<span class="tag[^"]*">([^<]*)<\/span>/); return m ? key(m[1]) : null; };
  const pick = (name, allowed, label) => {
    const m = metaOf(html, name);
    if (m != null && m !== '') { if (!(m in allowed)) err(`${where} : meta ${name} « ${m} », attendu ${Object.keys(allowed).join(' | ')}`); return m in allowed ? m : null; }
    const t = headTag(label);
    warn(`${where} : meta ${name} absente${t && t in allowed ? `, lu dans l'en-tête (${t})` : ''}`);
    return t && t in allowed ? t : null;
  };
  // Target: the phase or the release the chantier prepares (a column of the overview)
  const pourMeta = metaOf(html, 'pour');
  let pour = 'P1';
  if (pourMeta == null || pourMeta === '') warn(`${where} : meta pour absente, chantier rangé en P1`);
  else if (AN_PHASES.includes(pourMeta.toUpperCase())) pour = pourMeta.toUpperCase();
  else {
    const r = releases.find((x) => x.key === key(pourMeta));
    if (r) pour = r.key;
    else { err(`${where} : meta pour « ${pourMeta} », attendu ${[...AN_PHASES, ...releases.map((x) => x.label)].join(' | ')} (phase ou release de la story map ou de la roadmap)`); pour = null; }
  }
  const statut = pick('statut', AN_STATUT, 'Statut');
  const chantier = pick('chantier', AN_CHANTIER, 'Chantier');
  // The header must say what the meta says: a single tag (or text, for Pour) that differs is a warning
  const oneTag = (label) => { const t = [...(field(html, label) || '').matchAll(/<span class="tag[^"]*">([^<]*)<\/span>/g)]; return t.length === 1 ? key(t[0][1]) : null; };
  [['statut', statut, 'Statut'], ['chantier', chantier, 'Chantier']].forEach(([n, v, label]) => {
    const h = oneTag(label);
    if (metaOf(html, n) && v && h && h !== v) warn(`${where} : en-tête ${label} « ${h} », meta ${n} « ${v} »`);
  });
  const pourHead = strip(field(html, 'Pour') || '');
  if (pourMeta && pour && pourHead && key(pourHead) !== key(pour)) warn(`${where} : en-tête Pour « ${pourHead} », meta pour « ${pourMeta} »`);
  const auteurMeta = metaOf(html, 'auteur');
  if (auteurMeta == null || auteurMeta === '') warn(`${where} : meta auteur absente, lu dans l'en-tête`);
  else if (/^[a-z-]+-\d+$/.test(auteurMeta)) warn(`${where} : meta auteur « ${auteurMeta} » ressemble à une instance d'agent, écrire « ia »`);
  const auteur = auteurMeta ? (norm(auteurMeta) === 'ia' ? 'IA' : auteurMeta) : strip(field(html, 'Auteur') || '');
  const title = strip((html.match(/<h1[^>]*>[\s\S]*?<\/span>\s*:\s*([\s\S]*?)<\/h1>/) || [])[1] || f);
  const ledeHtml = (headerOf(html).match(/<p class="lede">([\s\S]*?)<\/p>/) || [])[1] || '';
  const lede = /class="todo"/.test(ledeHtml) ? '' : ledeHtml;
  const reco = ((sectionOf(html, 'Recommandation').match(/<div class="callout decision">([\s\S]*?)<\/div>/) || [])[1] || '')
    .replace(/^\s*<b>[\s\S]*?<\/b>/, '').replace(/\s+/g, ' ').trim();
  const qSec = sectionOf(html, 'Questions et hypothèses');
  const qIds = [...new Set(rows(qSec).filter(({ body }) => !/class="todo"/.test(body)).flatMap(({ body }) => strip(body).match(/\bQ-\d+\b/g) || []))]
    .filter((id) => { const q = questions.find((x) => x.id === id); return !q || q.statut !== 'repondue'; }).sort((a, b) => num(a) - num(b));
  const hyps = [...html.matchAll(/<div class="callout hypothese">([\s\S]*?)<\/div>/g)].filter((m) => !/class="todo"/.test(m[1])).length;
  const impSec = sectionOf(html, 'Impacts sur les autres livrables');
  const impacts = rows(impSec).filter(({ body }) => !/<th\b/.test(body) && body.includes('<td') && !/class="todo"/.test(body)).map(({ cells }) => {
    const a = (cells[0] || '').match(/<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
    if (a) return { href: toDocs(`href="${a[1]}"`, f).slice(6, -1), label: strip(a[2]) };
    const label = strip(cells[0]);
    return label ? { href: DELIVERABLE_FILES[norm(label)] || null, label } : null;
  }).filter(Boolean);
  analyses.push({ file: where, title, question: strip(lede), auteur, date: fromFr(strip(field(html, 'Date') || '')), statut, chantier, pour,
    reco: reco && !/class="todo"/.test(reco) ? toDocs(reco, f) : '', qIds, hyps, impacts: impSec ? impacts : null });
});
const AN_ORDER = ['en-cours', 'restitue-partiel', 'termine'];
const anRank = (a) => (AN_ORDER.includes(a.chantier) ? AN_ORDER.indexOf(a.chantier) : -1);
analyses.sort((a, b) => anRank(a) - anRank(b) || (b.date || '').localeCompare(a.date || '') || a.title.localeCompare(b.title, 'fr'));

// ---------- deliverables of the phases ----------
const deliverable = (file, label, opts = {}) => {
  const exists = opts.exists != null ? opts.exists : (file.startsWith('../') ? existsSync(join(DOCS, file)) : has(file));
  const st = opts.status !== undefined ? opts.status : (exists && file.endsWith('.html') ? statusOf(read(join(DOCS, file))) : null);
  let cls = '';
  if (exists) cls = opts.gate && crossed(opts.gate) ? 'done' : (!st || /^brouillon|^en cours/.test(st) ? 'doing' : 'made');
  return { file, label, exists, cls, small: opts.small || '' };
};
const apiVersion = (read(D('30-conception/api/openapi.yaml')).match(/^info:[\s\S]*?^\s+version:\s*['"]?([^'"\s]+)/m) || [])[1];
// Card "Analyses de chantier" of a column (phase or release) prepared by at least one chantier; done once the gate
// of the column is crossed and no chantier of the column is still running
const anCard = (col, closed) => {
  const list = analyses.filter((a) => a.pour === col);
  if (!list.length) return null;
  const run = list.filter((a) => a.chantier === 'en-cours').length;
  const cls = closed && !run ? 'done' : list.some((a) => a.statut === 'brouillon' || a.chantier === 'en-cours') ? 'doing' : 'made';
  return { file: '10-analyse/index.html', label: 'Analyses de chantier', exists: true, cls,
    small: `${list.length} ${plural(list.length, 'chantier', 'chantiers')}, ${run ? `${run} en cours` : 'aucun en cours'}` };
};
const storyPages = [...pages.values()].filter((p) => p.type !== 'spike');
const PHASES = [
  { id: 'P0', label: 'P0 Cadrage', gate: 'G0', items: [deliverable('00-cadrage/cadrage.html', 'Cadrage et vision', { gate: 'G0' })] },
  { id: 'P1', label: 'P1 Analyse', gate: null, items: [deliverable('10-analyse/big-picture.html', 'Big picture', { gate: 'G1' }),
    deliverable('20-specs/story-map.html', 'Story map', { gate: 'G1' }), anCard('P1', crossed('G1'))] },
  { id: 'P2', label: 'P2 Specs, UX', gate: 'G1', items: [
    deliverable('20-specs/conception-fonctionnelle.html', 'Conception fonctionnelle', { gate: 'G1' }),
    deliverable('20-specs/backlog.html', 'Epics et user stories', { gate: 'G1', exists: storyPages.length > 0,
      status: storyPages.length && storyPages.every((p) => p.statut !== 'brouillon') ? 'pret' : 'brouillon',
      small: counted.length ? `${epicIds.length || epics.size} ${plural(epicIds.length || epics.size, 'epic', 'epics')}, ${counted.length} ${plural(counted.length, 'story', 'stories')}` : '' }),
    deliverable('20-ux/spec-ux-ui.html', 'Spec UX/UI', { gate: 'G1' }),
    deliverable('../prototype/index.html', 'Prototype', { gate: 'G1', status: 'pret' }),
    deliverable('roadmap.html', 'Roadmap', { gate: 'G1', small: rmVersion }),
    anCard('P2', crossed('G1')),
  ] },
  { id: 'P3', label: 'P3 Conception', gate: 'G2', items: [
    deliverable('30-conception/macro.html', 'Conception technique macro', { gate: 'G2' }),
    deliverable('30-conception/detaillee/index.html', 'Conception technique détaillée', { gate: 'G2' }),
    deliverable('30-conception/api/openapi.yaml', "Contrat d'API", { gate: 'G2', status: 'pret', small: apiVersion ? `v${apiVersion}` : '' }),
    deliverable('30-conception/detaillee/transverse/conformite.html', 'Conformité', { gate: 'G2' }),
    deliverable('40-qa/strategie.html', 'Stratégie de test', { gate: 'G2' }),
    anCard('P3', crossed('G2')),
  ] },
];

// ---------- where the project stands ----------
const phase = (() => {
  if (current) return { kind: 'sprint' };
  if (crossed('G2')) return { kind: 'between', id: null, since: lastPV ? lastPV.pv.date : gate.G2.date };
  if (crossed('G1')) return { kind: 'phase', id: 'P3', since: gate.G1.date };
  if (crossed('G0')) return { kind: 'phase', id: ['20-specs/conception-fonctionnelle.html', '20-ux/spec-ux-ui.html', 'roadmap.html'].some(has) ? 'P2' : 'P1', since: gate.G0.date };
  return { kind: 'phase', id: 'P0', since: null };
})();
const ticketsOf = (s) => board.filter((t) => !t.bug && t.sprint === s.n);
const bugsOf = (s) => board.filter((t) => t.bug && t.sprint === s.n);
const projectName = (() => {
  const c = read(D('00-cadrage/cadrage.html'));
  const h = strip((c.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/^Cadrage(?: et vision)?\s*:\s*/i, '');
  if (h) return h;
  const t = (read(OUT_PIL).match(/<div class="toc-project">([^<]+)<\/div>/) || [])[1] || (smHtml.match(/<div class="toc-project">([^<]+)<\/div>/) || [])[1];
  return t ? strip(t) : basename(ROOT);
})();
const vision = (() => {
  const l = (read(D('00-cadrage/cadrage.html')).match(/<p class="lede">([\s\S]*?)<\/p>/) || [])[1];
  return l && !/class="todo"/.test(l) ? l.trim() : '';
})();

// ---------- steering page: header ----------
const sprintStep = (s) => {
  const tk = ticketsOf(s);
  const ticketsDone = tk.length > 0 && tk.every((t) => t.statut === 'fait');
  const c = s.camp, p = s.pv;
  const favorable = c && c.verdict && c.verdict !== 'defavorable';
  const items = [
    ticketsDone || c ? { done: true, label: 'Tickets faits' } : { label: 'Tickets en cours' },
    c && c.verdict ? { done: true, label: `Campagne QA ${VERDICT_LABEL[c.verdict]}` } : { label: c ? 'Campagne QA en cours' : 'Campagne QA à venir' },
    p ? { done: true, label: 'Pré-recette PO faite' } : { label: favorable ? 'Pré-recette PO en cours' : 'Pré-recette PO à venir' },
    p && p.signed ? { done: true, label: 'PV signé' } : { label: p ? 'PV à signer' : 'PV à préparer' },
  ];
  const cur = items.findIndex((i) => !i.done);
  if (cur >= 0) items[cur].current = true;
  const step = cur <= 0 ? 'Développement' : cur === 1 ? 'Recettage' : 'Livraison';
  return { items, step };
};
const checklist = (items) => `<ul class="pil-check" aria-label="Avant le gate">
            ${items.map((i) => `<li${i.done ? ' class="done"' : i.current ? ' class="current" aria-current="step"' : ''}>${i.label}</li>`).join('')}
          </ul>`;
const genBandeau = () => {
  const out = [];
  if (notionUrl) out.push(`<a class="pil-btn pil-board" href="${esc(notionUrl)}" target="_blank" rel="noopener" aria-label="Ouvrir le board Notion (nouvel onglet)">Ouvrir le board Notion<svg class="ext" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M7 1.5h3.5V5M10.5 1.5 5.5 6.5M9 7.5v2.5a.5.5 0 0 1-.5.5h-6.5a.5.5 0 0 1-.5-.5V3.5a.5.5 0 0 1 .5-.5h2.5"/></svg></a>`);
  if (vision) out.push(`<p class="lede">${vision}</p>`);
  // tile 1: phase
  let t1, t3;
  if (phase.kind === 'sprint') {
    const s = current, { step, items } = sprintStep(s);
    let prog = '', sub = '';
    if (s.start && s.end) {
      const total = workdays(s.start, s.end);
      const day = TODAY < s.start ? 0 : Math.min(total, workdays(s.start, TODAY));
      prog = `\n          <div class="pil-progress" role="progressbar" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${Math.max(day, 1)}" aria-label="Sprint ${s.n} : jour ${day} sur ${total}"><i style="width:${pct(day, total)}"></i></div>`;
      sub = TODAY < s.start ? `Commence le ${fr(s.start)}` : `Jour ${day} sur ${total} · commencé le ${fr(s.start)}`;
    }
    t1 = `<div class="pil-tile-main"><a href="${s.file}">Sprint ${s.n}</a> <span>${step}</span></div>${prog}${sub ? `\n          <div class="pil-tile-sub">${sub}</div>` : ''}`;
    // tile 3: G3 of the sprint
    let when = '';
    if (s.end) {
      const d = daysBetween(TODAY, s.end);
      when = `${d > 0 ? ` <span>Dans ${d} ${plural(d, 'jour', 'jours')}</span>` : d === 0 ? " <span>Aujourd'hui</span>" : ''} <small><b>${weekday(s.end)} ${fr(s.end)}</b>, fin du sprint</small>`;
    }
    const sts = s.stories.filter((id) => counted.some((x) => x.id === id));
    const rels = [...new Set(sts.map((id) => counted.find((x) => x.id === id).rel))].map(relOf);
    const relPart = rels.length === 1 && !rels[0].unnamed ? ` ${rels[0].of}` : '';
    const parts = [];
    if (sts.length) parts.push(`<a href="${s.file}#stories-engagees" data-tip="${sts.join(', ')}">${sts.length} ${plural(sts.length, 'story', 'stories')}${relPart}</a>`);
    s.reserves.forEach((r) => parts.push(link(resHref(r), r)));
    let closes = '';
    if (rels.length === 1) {
      const r = rels[0];
      const left = inRel(r.key).filter((x) => !isDelivered(x) && !sts.includes(x.id)).length;
      closes = ` · ${left ? 'ne clôt pas' : 'clôt'} ${r.the}`;
    }
    t3 = `<div class="pil-tile-main"><span class="pil-gate">G3</span>${when}</div>
          <div class="pil-tile-sub">${parts.length ? `Recette de ${parts.join(' et de ')}` : 'Recette du sprint'}${closes}</div>
          ${checklist(items)}`;
  } else if (phase.kind === 'between') {
    const next = sprints.length ? sprints[sprints.length - 1].n + 1 : 1;
    t1 = `<div class="pil-tile-main"><span>Sprint ${next} à planifier</span></div>${phase.since ? `\n          <div class="pil-tile-sub">Depuis le ${fr(phase.since)}</div>` : ''}`;
    const r = curRelease;
    t3 = r ? `<div class="pil-tile-main"><span class="pil-gate">G3</span> <span>Recette ${r.of}</span></div>
          <div class="pil-tile-sub">Quand ses ${r.total} stories sont acceptées dans un PV signé (${r.delivered} à ce jour)</div>` : '<div class="pil-tile-main"><span>Aucun gate en vue</span></div>';
  } else {
    const ph = PHASES.find((p) => p.id === phase.id);
    t1 = `<div class="pil-tile-main"><span>${ph.label}</span></div>${phase.since ? `\n          <div class="pil-tile-sub">Depuis le ${fr(phase.since)}</div>` : ''}`;
    const g = phase.id === 'P0' ? 'G0' : phase.id === 'P3' ? 'G2' : 'G1';
    const items = GATES[g].ready.map(([f, l]) => {
      const st = has(f) ? statusOf(read(D(f))) : null;
      return { done: !!st && !/^brouillon/.test(st), label: `${l}${!has(f) ? ' à produire' : !st || /^brouillon/.test(st) ? ' en cours' : ' prêt'}` };
    });
    const cur = items.findIndex((i) => !i.done);
    if (cur >= 0) items[cur].current = true;
    t3 = `<div class="pil-tile-main"><span class="pil-gate">${g}</span> <span>${GATES[g].name}</span></div>
          ${checklist(items)}`;
  }
  const t2 = curRelease ? `<span class="pil-release">${esc(curRelease.unnamed ? 'Release' : curRelease.label)}</span>` : '<span>aucune</span>';
  out.push(`<div class="pil-head">
        <div class="pil-tile">
          <div class="pil-tile-label">Phase en cours</div>
          ${t1}
        </div>
        <div class="pil-tile">
          <div class="pil-tile-label">Release en cours</div>
          <div class="pil-tile-main">${t2}</div>
        </div>
        <div class="pil-tile">
          <div class="pil-tile-label">Prochain gate</div>
          ${t3}
        </div>
      </div>`);
  out.push(`<p class="pil-updated">Mis à jour le ${fr(TODAY)} à ${stamp.time}</p>`);
  return out.join('\n      ');
};

// ---------- steering page: overview grid ----------
const genOverview = () => {
  const curCol = phase.kind === 'phase' ? phase.id : curRelease ? curRelease.key : null;
  const heads = ['<div class="rm-head"></div>'];
  PHASES.forEach((p) => {
    const g = p.gate ? (crossed(p.gate) ? ` data-gate="${p.gate}|validé${gate[p.gate].date ? `|${fr(gate[p.gate].date)}` : ''}" data-gate-name="${GATES[p.gate].name}"` : ` data-gate="${p.gate}" data-gate-name="${GATES[p.gate].name}"`) : '';
    heads.push(`<div class="rm-head"${g}${curCol === p.id ? ' data-current' : ''}>${p.label}</div>`);
  });
  releases.forEach((r) => {
    const g = r.crossed ? `G3|accepté|${fr(r.date)}` : 'G3';
    heads.push(`<div class="rm-head" data-gate="${g}" data-gate-name="Validation de la recette ${r.of}"${curCol === r.key ? ' data-current' : ''}>${esc(r.label)}</div>`);
  });
  const card = (d) => `<div class="rm-item${d.cls ? ` ${d.cls}` : ''}">${d.exists ? `<a href="${d.file}">${d.label}</a>` : d.label}${d.small ? ` <small>${esc(d.small)}</small>` : ''}</div>`;
  const cells = PHASES.map((p) => `<div>${p.items.filter(Boolean).map(card).join('')}</div>`);
  releases.forEach((r) => {
    const list = inRel(r.key);
    const sps = r.sprints;
    const an = anCard(r.key, r.crossed);
    const anHtml = an ? card(an) : '';
    if (!sps.length) {
      cells.push(`<div><div class="rm-item${r.crossed ? ' done' : ''}">Développement${r.total ? ` <small>${r.delivered}/${r.total} stories</small>` : ''}</div><div class="rm-item">Recettage</div><div class="rm-item">Livraison</div>${anHtml}</div>`);
      return;
    }
    const state = r.crossed ? ' done' : ' doing';
    const run = current && sps.includes(current) ? current : null;
    const lastS = sps[sps.length - 1];
    const tk = (s) => { const t = ticketsOf(s); return t.length ? `${t.filter((x) => x.statut === 'fait').length}/${t.length} tickets` : ''; };
    const devTip = (s) => {
      const what = [`${s.stories.length} ${plural(s.stories.length, 'story', 'stories')}`, ...s.reserves].join(' et ');
      const extra = [tk(s), bugsOf(s).map((b) => b.id).join(', ')].filter(Boolean).join(' et ');
      return `Sprint ${s.n}, ${s.done ? 'fait' : 'en cours'} : ${what}${extra ? `, ${extra}` : ''}`;
    };
    const dev = `<div class="rm-item${state}"><a href="${(run || lastS).file}">Développement</a> <small>${r.delivered}/${r.total} stories${run ? ` ; sprint ${run.n} en cours${tk(run) ? `, ${tk(run)}` : ''}` : ''}</small>
    <div class="rm-sprints">${sps.map((s) => `<a class="${s.done ? 'done' : 'doing'}" href="${s.file}" data-tip="${esc(devTip(s))}">${s.n}</a>`).join('')}</div></div>`;
    const lastC = [...sps].reverse().find((s) => s.camp);
    const campTip = (s) => `Sprint ${s.n} : campagne ${s.camp.verdict ? VERDICT_LABEL[s.camp.verdict] : 'en cours'}${s.camp.total && s.camp.green !== s.camp.total ? `, ${s.camp.green}/${s.camp.total} scénarios` : ''}`;
    const qa = `<div class="rm-item${state}">${lastC ? `<a href="${lastC.camp.file}">Recettage</a> <small>Campagne du sprint ${lastC.n} : ${lastC.camp.verdict ? VERDICT_LABEL[lastC.camp.verdict] : 'en cours'}</small>` : 'Recettage'}
    <div class="rm-sprints">${sps.map((s) => (s.camp ? `<a class="${s.camp.verdict ? 'done' : 'doing'}" href="${s.camp.file}" data-tip="${esc(campTip(s))}">${s.n}</a>` : `<span tabindex="0" data-tip="Sprint ${s.n} : campagne à venir">${s.n}</span>`)).join('')}</div></div>`;
    const lastP = [...sps].reverse().find((s) => s.pv && s.pv.signed);
    const pvRes = (s) => s.pv.reserves.map((x) => `<a href="${s.pv.file}#${x.id}">${x.id}</a>`).join(', ');
    const pvTip = (s) => `Sprint ${s.n} : G3 ${s.pv.signed ? `${VERDICT_LABEL[s.pv.verdict] || 'signé'}${s.pv.date ? ` le ${fr(s.pv.date)}` : ''}` : 'en préparation'}`;
    const liv = `<div class="rm-item${state}">${lastP ? `<a href="${lastP.pv.file}">Livraison</a> <small>G3 du sprint ${lastP.n} : ${VERDICT_LABEL[lastP.pv.verdict] || 'signé'}${lastP.pv.reserves.length ? `, ${pvRes(lastP)}` : ''}</small>` : 'Livraison'}
    <div class="rm-sprints">${sps.map((s) => (s.pv ? `<a class="${s.pv.signed ? 'done' : 'doing'}" href="${s.pv.file}" data-tip="${esc(pvTip(s))}">${s.n}</a>` : `<span tabindex="0" data-tip="Sprint ${s.n} : G3 à venir">${s.n}</span>`)).join('')}</div></div>`;
    cells.push(`<div>\n  ${dev}\n  ${qa}\n  ${liv}${anHtml ? `\n  ${anHtml}` : ''}\n</div>`);
  });
  const nRel = releases.length;
  const wide = curRelease && phase.kind !== 'phase' ? curRelease.order : -1;
  const relCols = releases.map((r, i) => (i === wide ? 'minmax(180px, 1.4fr)' : 'minmax(116px, .8fr)'));
  const cols = [];
  relCols.forEach((c) => { const last = cols[cols.length - 1]; if (last && last.c === c) last.n++; else cols.push({ c, n: 1 }); });
  const template = `92px repeat(4, minmax(116px, 1fr)) ${cols.map(({ c, n }) => (n > 1 ? `repeat(${n}, ${c})` : c)).join(' ')}`;
  const minW = 92 + 4 * 116 + releases.reduce((s, r, i) => s + (i === wide ? 180 : 116), 0);
  return `<div class="roadmap">
        <div class="rm-grid" style="--cols: ${4 + nRel}; grid-template-columns: ${template}; min-width: ${minW}px">
${heads.join('\n')}

<div class="rm-lane">Livrables</div>
${cells.join('\n')}
        </div>
      </div>`;
};

// ---------- steering page: gates table ----------
const verdictTag = (v) => {
  const cls = { validé: 'ok', accepte: 'ok', 'accepte-avec-reserves': 'warn', refuse: 'danger' }[v];
  const label = v === 'validé' ? 'Validé' : cap(VERDICT_LABEL[v] || v);
  return `<span class="tag${cls ? ` ${cls}` : ''}">${label}</span>`;
};
const genGates = () => {
  const rowsOut = [];
  const trace = (g) => GATES[g].trace.map(([f, l], i) => link((f.startsWith('../') ? existsSync(join(DOCS, f)) : has(f)) ? f : null, i ? l.toLowerCase() : l)).join(', ');
  ['G0', 'G1', 'G2'].forEach((g) => {
    const x = gate[g];
    if (x.crossed) rowsOut.push(`<tr><td>${g}</td><td>${GATES[g].object}</td><td>${fr(x.date)}</td><td>${verdictTag('validé')}</td><td>Aucune</td><td>${trace(g)}</td></tr>`);
    else rowsOut.push(`<tr><td>${g}</td><td>${GATES[g].object}</td><td></td><td><span class="tag">À venir</span></td><td></td><td></td></tr>`);
  });
  sprints.forEach((s) => {
    if (s.pv && (s.pv.signed || s.pv.refused)) {
      const res = s.pv.reserves.length ? s.pv.reserves.map((x) => `<a href="${s.pv.file}#${x.id}">${x.id}</a>`).join(', ') : 'Aucune';
      rowsOut.push(`<tr><td>G3</td><td>Recette du sprint ${s.n}</td><td>${fr(s.pv.date)}</td><td>${verdictTag(s.pv.verdict || (s.pv.refused ? 'refuse' : 'accepte'))}</td><td>${res}</td><td><a href="${s.pv.file}">PV du sprint ${s.n}</a></td></tr>`);
    } else rowsOut.push(`<tr><td>G3</td><td>Recette du sprint ${s.n}</td><td>${s.end ? `Fin du sprint le ${fr(s.end)}` : ''}</td><td><span class="tag">À venir</span></td><td></td><td>${s.pv ? `<a href="${s.pv.file}">PV du sprint ${s.n}</a>` : ''}</td></tr>`);
  });
  releases.filter((r) => r.crossed || r === curRelease).forEach((r) => {
    if (r.crossed) {
      const last = inRel(r.key).map((s) => s.sprint).sort((a, b) => a.n - b.n).pop();
      rowsOut.push(`<tr><td>G3</td><td>Recette ${r.of}</td><td>${fr(r.date)}</td><td>${verdictTag('accepte')}</td><td></td><td><a href="${last.pv.file}">PV du sprint ${last.n}</a></td></tr>`);
    } else rowsOut.push(`<tr><td>G3</td><td>Recette ${r.of}</td><td>Quand les ${r.total} stories sont acceptées dans un PV signé (${r.delivered} à ce jour)</td><td><span class="tag">À venir</span></td><td></td><td></td></tr>`);
  });
  return `<table>
        <thead><tr><th>Gate</th><th>Objet</th><th>Tenu le</th><th>Verdict</th><th>Réserves</th><th>Trace</th></tr></thead>
        <tbody>
          ${rowsOut.join('\n          ')}
        </tbody>
      </table>`;
};

// ---------- steering page: hotspots ----------
const TYPES = [
  ['loop', 'Boucle de revue bloquée', 'boucle de revue bloquée', 'aucune boucle de revue bloquée'],
  ['gate', 'Gate à présenter', 'gate à présenter', 'aucun gate à présenter'],
  ['question', 'Question remontée', 'question remontée', 'aucune question remontée'],
  ['adr', 'ADR avec écart au socle', 'ADR avec écart au socle', 'aucun ADR avec écart au socle'],
  ['open', 'Point ouvert', "point ouvert d'impact fort", "aucun point ouvert d'impact fort"],
  ['reserve', 'Réserve ouverte', 'réserve ouverte', 'aucune réserve ouverte'],
  ['process', 'Évolution du process', 'évolution du process', 'aucune évolution du process proposée'],
];
const SEV = { bloquante: ['blocking', 'Bloquante'], majeure: ['major', 'Majeure'], mineure: ['minor', 'Mineure'] };
const genHotspots = () => {
  const items = [];
  const add = (type, what, why, sinceLabel, since) => items.push({ type, what, why, sinceLabel, since });
  // 1. review loops: tours_revue counts every review (team/conventions/ticket.md), so four reviews or more
  // on a ticket not done is three correction rounds without convergence
  board.filter((t) => t.tours >= 4 && t.statut !== 'fait').forEach((t) => {
    add('loop', `<a href="${boardHref(t.id)}">${t.id}</a> ${esc(t.titre)}, ${t.tours} revues, ${t.tours - 1} tours de correction sans convergence`, t.instance ? `${esc(t.instance)}, statut <code>${t.statut}</code>` : '', 'Bloquée le', mentionDay(t.id));
  });
  // 2. gates to present
  if (current && current.pv && !current.pv.signed && !current.pv.refused) {
    add('gate', `<span class="pil-gate-mini">G3</span> Validation de la recette du sprint ${current.n}`, `<a href="${current.pv.file}">PV du sprint ${current.n}</a> à signer${current.camp && current.camp.verdict ? ` ; verdict QA ${VERDICT_LABEL[current.camp.verdict]}` : ''}.`, 'Prêt le', current.pv.date || (current.camp && mentionDay(`sprint ${current.n}`)) || null);
  }
  ['G0', 'G1', 'G2'].filter((g) => !crossed(g) && (g === 'G0' || crossed(g === 'G1' ? 'G0' : 'G1'))).forEach((g) => {
    const docs = GATES[g].ready;
    const sts = docs.map(([f]) => (has(f) ? statusOf(read(D(f))) : null));
    if (sts.every((s) => s && /^en revue/.test(s))) {
      const dates = docs.map(([f]) => fromFr(strip(field(read(D(f)), 'Date') || ''))).filter(Boolean).sort();
      add('gate', `<span class="pil-gate-mini">${g}</span> ${GATES[g].name}`, docs.map(([f, l]) => `<a href="${f}">${l}</a>`).join(', ') + ' en revue.', 'Prêt le', dates.pop() || null);
    }
  });
  // 3. questions raised to the human
  questions.filter((q) => q.statut === 'remontee').forEach((q) => {
    const why = [q.lie.length ? `Liée à ${linkify(q.lie.join(', '))}.` : '', q.hyp ? `Hypothèse : ${linkify(q.hyp)}` : '', q.bloquant ? 'Bloquante.' : ''].filter(Boolean).join(' ');
    add('question', `${targetOf(q.id) ? `<a class="qmark" href="${targetOf(q.id)}">${q.id}</a>` : q.id} ${linkify(q.text)}`, why, 'Remontée le', mentionDay(q.id));
  });
  // 4. ADR proposed with a gap to the stack baseline
  filesIn('adr', /^\d{4}-.*\.html$/).forEach((f) => {
    const h = read(D(`adr/${f}`));
    if (metaOf(h, 'statut') !== 'propose' || metaOf(h, 'ecart_socle') !== 'oui') return;
    const rep = (metaOf(h, 'repond_a') || '').split(/[\s,]+/).filter(Boolean);
    add('adr', `<a href="adr/${f}">${esc(metaOf(h, 'id'))}</a> ${esc(metaOf(h, 'titre'))}`, rep.length ? `Répond à ${linkify(rep.join(', '))}.` : '', 'Proposé le', metaOf(h, 'date'));
  });
  // 5. open points of strong impact in the detailed design
  const po = read(D('30-conception/detaillee/points-ouverts.html'));
  const strong = rows(po).filter(({ cells }) => /class="impact fort"/.test(cells[0] || ''));
  if (strong.length) {
    const objs = [];
    strong.forEach(({ cells }) => {
      const m = (cells[1] || '').match(/<a href="([^"]+)">([^<]+)<\/a>/);
      if (m && !objs.some((o) => o.t === m[2])) objs.push({ h: posix.join('30-conception/detaillee', m[1].split('#')[0]), t: m[2] });
    });
    const dt = crossed('G2') ? gate.G2.date : fromFr(strip(field(po, 'Date') || '')) || fromFr(strip(field(read(D('30-conception/detaillee/index.html')), 'Date') || ''));
    add('open', `<a href="30-conception/detaillee/points-ouverts.html">${strong.length} ${plural(strong.length, "point d'impact fort", "points d'impact fort")}</a> de la conception détaillée`,
      objs.map((o) => `<a href="${o.h}">${esc(o.t)}</a>`).join(', '), crossed('G2') ? 'Depuis G2,' : 'Depuis le', dt);
  }
  // 6. open reserves
  reserves.filter((r) => r.open).forEach((r) => {
    const sev = r.ticket && r.ticket.severite ? norm(r.ticket.severite) : r.sev;
    const tip = [r.id, 'Ouverte', r.item ? `${r.item}${r.ticket && r.ticket.sprint ? `, sprint ${r.ticket.sprint}` : ''}` : ''].filter(Boolean).join(' · ');
    const crit = SEV[sev] ? ` · <span class="pil-crit ${SEV[sev][0]}">${SEV[sev][1]}</span>` : '';
    const why = r.item ? `Levée quand ${link(boardHref(r.item), r.item)} passe à <code>fait</code>${r.ticket && r.ticket.sprint ? `, sprint ${r.ticket.sprint}` : ''}.` : '';
    add('reserve', `<a class="pil-res open" href="${r.sprint.pv.file}#${r.id}" data-tip="${esc(tip)}">${r.id}</a>${crit} · <a href="${r.sprint.pv.file}">Sprint ${r.sprint.n}</a>`, why, 'Ouverte le', r.sprint.pv.date);
  });
  // 7. plugin evolutions proposed by a retro and not decided: rows Sn-Em of the part "Évolutions proposées
  // pour le plugin" (h3 id="evolutions-proposees"); an older sprint page has a table "Évolutions proposées"
  // whose first column is the file
  sprints.forEach((s) => {
    const h = read(D(s.file));
    const part = (h.split(/<h3\b[^>]*>\s*Évolutions proposées(?:\s+pour le plugin)?\s*<\/h3>/)[1] || '').split('</table>')[0];
    rows(part).forEach(({ attrs, body, cells }) => {
      if (cells.length < 2 || /<th\b/.test(body)) return;
      const dec = strip(cells[cells.length - 1]);
      if (/^(accept|refus|rejet|valide|appliqu|abandon)/.test(norm(dec))) return;
      const id = (attrs.match(/\bid="(S\d+-E\d+)"/) || [])[1];
      const file = esc(strip(cells[id ? 1 : 0]).replace(/\s+([,.)])/g, '$1'));
      const what = id ? `<a href="${s.file}#${id}">${id}</a> ${file}` : file;
      add('process', what, `Proposée par la <a href="${s.file}#evolutions-proposees">rétro du sprint ${s.n}</a>${dec ? `, ${esc(dec)}` : ''}.`, 'Soumise le', s.end);
    });
  });
  const order = TYPES.map((t) => t[0]);
  items.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type) || (a.since || '9999').localeCompare(b.since || '9999'));
  const scale = `<p class="pil-scale" aria-hidden="true"><span>Plus critique</span>${order.map((t) => `<i class="t-${t}"></i>`).join('')}<span>moins critique</span></p>`;
  const lines = items.map((i) => {
    const t = TYPES.find((x) => x[0] === i.type);
    const since = i.since ? `<span class="since">${i.sinceLabel} ${frShort(i.since)}</span>` : '<span class="since"></span>';
    return `<li class="t-${i.type}" data-type="${i.type}" data-type-label="${t[1]}"><span class="tag pil-type t-${i.type}">${t[1]}</span><span class="what">${i.what}${i.why ? `<span class="why">${i.why}</span>` : ''}</span>${since}</li>`;
  });
  const empty = TYPES.filter((t) => !items.some((i) => i.type === t[0]));
  const qUp = questions.filter((q) => q.statut === 'remontee').length, qOpen = questions.filter((q) => q.statut === 'ouverte').length;
  const qLine = has('questions.html') ? `<a href="questions.html">Toutes les questions</a> : ${qUp} ${plural(qUp, 'remontée', 'remontées')} à l'humain, ${qOpen} ${plural(qOpen, 'ouverte', 'ouvertes')} chez le PO.` : '';
  const out = [];
  if (items.length) {
    out.push(scale, `<ul class="pil-wait" id="hotspots" data-filter="types de hotspot" data-filter-unit="ligne">\n        ${lines.join('\n        ')}\n      </ul>`);
    out.push(`<p class="pil-none">${empty.length ? `Aucun hotspot dans : ${empty.map((t) => t[2]).join(', ')}. ` : ''}${qLine}</p>`);
  } else {
    let next = '';
    if (current && current.end) next = ` Prochain rendez-vous : G3 du sprint ${current.n}, fin du sprint le ${fr(current.end)}.`;
    out.push(`<div class="callout decision">
        <b>Aucun hotspot</b>
        Rien à trancher : ${TYPES.map((t) => t[3]).join(', ')}.${next}
      </div>`);
    if (qLine) out.push(`<p class="pil-none">${qLine}</p>`);
  }
  return out.join('\n      ');
};

// ---------- steering page: indicators ----------
const bar = (cls, aria, segs, total) => `<div class="${cls}" role="group" aria-label="${aria}">${segs.filter((s) => s.n).map((s) => `<i class="${s.c}" style="width:${pct(s.n, total)}" role="img" tabindex="0" aria-label="${s.l} : ${s.n}" data-tip="${s.l} : ${s.n}"></i>`).join('')}</div>`;
const genIndicators = () => {
  const storyCard = (label, of, list) => {
    const done = list.filter(isDelivered).length;
    const sp = current ? list.filter((s) => s.status === 'sprint').length : 0;
    const segs = [{ c: 'pil-c-done', l: 'Livrées', n: done }];
    if (current) segs.push({ c: 'pil-c-doing', l: `Sprint ${current.n}`, n: sp });
    segs.push({ c: 'pil-c-ready', l: 'À venir', n: list.length - done - sp });
    return `<div class="kpi">
          <div class="label">Stories livrées, ${label}</div>
          <div class="value">${done} <small>/ ${list.length}</small></div>
          ${bar('pil-bar', `Stories ${of}`, segs, list.length)}
          <div class="pil-legend">${segs.map((s) => `<span><i class="${s.c}"></i>${s.l}</span>`).join('')}</div>
        </div>`;
  };
  const cards = [storyCard('toutes releases', 'de toutes les releases', counted)];
  const r = curRelease || releases[0];
  cards.push(storyCard(r.unnamed ? 'release' : r.isMvp ? 'MVP' : `release ${r.label}`, r.of, inRel(r.key)));
  // tickets of the current sprint
  const TK = [['fait', 'pil-c-done', 'Fait'], ['en-test', 'pil-c-test', 'En test'], ['en-revue', 'pil-c-review', 'En revue'], ['en-cours', 'pil-c-doing', 'En cours'], ['pret', 'pil-c-ready', 'Prêt'], ['bloque', 'pil-c-blocked', 'Bloqué']];
  const s = current || [...sprints].pop();
  if (s) {
    const tk = ticketsOf(s);
    const segs = TK.map(([k, c, l]) => ({ c, l, n: tk.filter((t) => t.statut === k || (k === 'pret' && t.statut === 'backlog')).length }));
    const zero = segs.filter((x) => !x.n).map((x) => `${x.l.toLowerCase()} 0`).join(', ');
    const lab = `Tickets du sprint ${current ? 'actuel' : 'dernier'} (Sprint ${s.n})`;
    cards.push(`<div class="kpi">
          <div class="label">${lab}</div>
          <div class="value">${segs[0].n} <small>/ ${tk.length} faits</small></div>
          ${tk.length ? bar('pil-bar', `${lab} par statut${zero ? ` ; ${zero}` : ''}`, segs, tk.length) : '<div class="pil-bar" aria-hidden="true"></div>'}
          <div class="pil-legend">${TK.map(([, c, l]) => `<span><i class="${c}"></i>${l}</span>`).join('')}</div>
        </div>`);
  } else {
    cards.push(`<div class="kpi">
          <div class="label">Tickets du sprint actuel</div>
          <div class="value">0 <small>aucun sprint commencé</small></div>
        </div>`);
  }
  // open anomalies
  const bugs = board.filter((t) => t.bug && t.statut !== 'fait');
  const BST = { backlog: 'Au backlog', pret: 'Prête', 'en-cours': 'En correction', 'en-revue': 'En revue', 'en-test': 'En test', bloque: 'Bloquée' };
  const sevs = Object.entries(SEV).map(([k, [c, l]]) => { const n = bugs.filter((b) => norm(b.severite) === k).length; return `<div class="${n ? c : 'zero'}"><b>${n}</b><span>${l}</span></div>`; });
  const sevLabel = (b) => (SEV[norm(b.severite)] || [null, b.severite || 'Sans gravité'])[1];
  cards.push(`<div class="kpi">
          <div class="label">Anomalies ouvertes</div>
          <div class="pil-sev">
            ${sevs.join('\n            ')}
          </div>
          ${bugs.length ? `<ul class="pil-bugs">
            ${bugs.sort((a, b) => num(a.id) - num(b.id)).map((b) => `<li><a href="${boardHref(b.id)}">${b.id}</a> · ${sevLabel(b)} · ${BST[b.statut] || b.statut}${b.sprint ? `, sprint ${b.sprint}` : ''}</li>`).join('\n            ')}
          </ul>` : '<p class="pil-none">Aucune anomalie ouverte.</p>'}
        </div>`);
  return `<div class="pil-kpis">
        ${cards.join('\n        ')}
      </div>`;
};

// ---------- steering page: events ----------
const genEvents = () => {
  const list = journal.filter((e) => !/^(dispatch|rapport)$/i.test(e.type)).slice(-50).reverse();
  if (!list.length) return '<p class="pil-none">Aucun événement : le journal est vide.</p>';
  return `<ol class="pil-events" data-more="5" data-more-label="événements">
        ${list.map((e) => `<li><time datetime="${e.day}T${e.time}">${fr(e.day)} ${e.time}</time><span><span class="tag">${esc(cap(e.type))}</span></span><span>${linkify(e.text)}</span></li>`).join('\n        ')}
      </ol>`;
};

// ---------- backlog page ----------
const SZ = (t) => (t ? `<span class="size ${t.toLowerCase()}">${t}</span>` : '<span class="none">?</span>');
const fb = (f) => (f == null ? '<span class="none">?</span>' : `<span class="bl-fb" aria-hidden="true"><i class="bl-f" style="width:${f}%"></i><i class="bl-b" style="width:${100 - f}%"></i></span>${f} / ${100 - f}`);
const frontOf = (list) => {
  const w = list.filter((s) => s.front != null && s.taille && WEIGHT[s.taille]);
  const sum = w.reduce((n, s) => n + WEIGHT[s.taille], 0);
  return sum ? Math.round(w.reduce((n, s) => n + s.front * WEIGHT[s.taille], 0) / sum) : null;
};
const genEntete = () => {
  const total = counted.length;
  const nE = epicIds.length;
  const parts = [`${total} ${plural(total, 'story', 'stories')} dans ${nE} ${plural(nE, 'epic', 'epics')}${UNNAMED ? '' : `, sur ${word(releases.length)} ${plural(releases.length, 'release', 'releases')}`}.`];
  const done = counted.filter(isDelivered).length;
  const sp = counted.filter((s) => s.status === 'sprint').length;
  const s2 = [`${done} ${plural(done, 'est livrée', 'sont livrées')}`];
  if (current) s2.push(`${sp} ${plural(sp, 'est', 'sont')} dans le sprint ${current.n} en cours`);
  const rel = releases.filter((r) => !r.crossed).map((r) => {
    const rest = inRel(r.key).filter((s) => !['livree', 'sprint'].includes(s.status));
    if (!rest.length) return null;
    if (inRel(r.key).every((s) => s.status === 'arediger')) return `${r.the} n'est pas encore rédigé${r.isMvp || r.unnamed ? '' : 'e'}`;
    const c = ['validee', 'prete', 'redigee', 'arediger'].map((k) => [k, rest.filter((s) => s.status === k).length]).filter(([, n]) => n);
    const lab = { validee: ['validée', 'validées'], prete: ['prête', 'prêtes'], redigee: ['à finir de rédiger', 'à finir de rédiger'], arediger: ['à rédiger', 'à rédiger'] };
    const items = c.map(([k, n], i) => `${n} ${i ? '' : `${plural(n, 'story', 'stories')} `}${lab[k][n > 1 ? 1 : 0]}`);
    return `${r.the} attend encore ${items.length > 1 ? `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}` : items[0]}`;
  }).filter(Boolean);
  const lede = total ? `${parts[0]} ${cap(s2.join(', '))}${rel.length ? ` ; ${rel.join(', ')}` : ''}.` : "Aucune story : la story map n'en liste pas encore.";
  const meta = [`<span><b>Mise à jour</b> ${fr(TODAY)} à ${stamp.time}</span>`];
  if (current && current.start && current.end) {
    const tot = workdays(current.start, current.end), day = TODAY < current.start ? 0 : Math.min(tot, workdays(current.start, TODAY));
    meta.push(`<span><b>Sprint en cours</b> <a href="${current.file}">sprint ${current.n}</a>, jour ${day} sur ${tot}</span>`);
  } else if (current) meta.push(`<span><b>Sprint en cours</b> <a href="${current.file}">sprint ${current.n}</a></span>`);
  const src = [smHtml ? '<a href="20-specs/story-map.html">story map</a>' : 'story map', 'pages des stories (taille, front, statut)'];
  if (sprints.length) src.push(`<a href="${sprints[sprints.length - 1].file}">pages de sprint</a>`);
  if (lastPV) src.push(`<a href="${lastPV.pv.file}">PV signés</a>`);
  meta.push(`<span><b>Sources</b> ${src.join(', ')}</span>`);
  return `<p class="lede">${lede}</p>
      <div class="meta">
        ${meta.join('\n        ')}
      </div>`;
};
const genSynthese = () => {
  const card = (label, aria, list) => {
    const segs = ST_ORDER.map((k) => ({ k, n: list.filter((s) => s.status === k).length })).filter((x) => x.n)
      .map((x) => ({ c: `t-st-${x.k}`, l: stLabel(x.k, x.n, current), n: x.n }));
    const sizes = SIZES.map((t) => [t, list.filter((s) => s.taille === t).length]).filter(([, n]) => n);
    const f = frontOf(list);
    return `<div class="kpi">
          <div class="label">${label}</div>
          <div class="value">${list.filter(isDelivered).length} <small>/ ${list.length} ${plural(list.length, 'livrée', 'livrées')}</small></div>
          ${list.length ? bar('bl-bar', `Stories ${aria} par statut`, segs, list.length) : ''}
          <div class="bl-legend">${segs.map((s) => `<span><i class="${s.c}"></i>${s.l} : ${s.n}</span>`).join('')}</div>
          <div class="bl-sub">Tailles : ${sizes.map(([t, n]) => `<span class="bl-n">${n} ${SZ(t)}</span>`).join(' ')}${f != null ? `<span class="bl-fbv">Front / back <span class="bl-fb" aria-hidden="true"><i class="bl-f" style="width:${f}%"></i><i class="bl-b" style="width:${100 - f}%"></i></span>${f} / ${100 - f}</span>` : ''}</div>
        </div>`;
  };
  if (!counted.length) return '<p class="none">Aucune story à compter.</p>';
  const cards = [card(UNNAMED ? 'Toutes les stories' : 'Toutes releases', 'de toutes les releases', counted)];
  if (!UNNAMED) releases.forEach((r) => cards.push(card(r.long, r.of, inRel(r.key))));
  return `<div class="bl-kpis">
        ${cards.join('\n        ')}
      </div>`;
};
const genBacklog = () => {
  const facets = [
    { key: 'release', prefix: 'rel', label: 'Release', options: releases.map((r) => [r.key, r.long]) },
    { key: 'statut', prefix: 'st', label: 'Statut', options: ST_ORDER.slice().reverse().map((k) => [k, ST[k][0] === 'Livrée' ? 'Livrée' : k === 'sprint' ? 'En sprint' : ST[k][0]]) },
  ];
  const g1 = gate.G1 && gate.G1.crossed ? gate.G1.date : null;
  const nextG3 = (iso) => { const s = sprints.find((x) => x.end && x.end >= iso); return s ? `montrée au G3 du sprint ${s.n}` : 'à montrer au prochain G3'; };
  const more = (s) => {
    const out = [];
    if (s.status === 'livree') {
      const res = s.sprint.pv.reserves.filter((r) => r.story === s.id).map((r) => `<a href="${s.sprint.pv.file}#${r.id}">${r.id}</a>`);
      out.push(`<a href="${s.sprint.pv.file}">PV du sprint ${s.sprint.n}</a>${res.length ? `, ${plural(res.length, 'réserve', 'réserves')} ${res.join(', ')}` : ''}`);
    } else if (s.status === 'sprint') out.push(`<a href="${s.sprint.file}#stories-engagees">Sprint ${s.sprint.n}</a>`);
    else if (s.status === 'validee' && s.page) {
      const p = s.page, le = fromFr(p.valide_le);
      if (p.valide_par === 'po') out.push(`par le PO${le ? ` le ${fr(le)}` : ''}, ${le ? nextG3(le) : 'à montrer au prochain G3'}`);
      else if (p.valide_par === 'humain') out.push(le && g1 && le !== g1 ? `par l'humain le ${fr(le)}` : `au G1 du ${fr(le || g1) || ''}`.trim());
    }
    const qs = [...new Set([...questions.filter((q) => q.statut !== 'repondue' && q.lie.includes(s.id)).map((q) => q.id), ...(s.page ? s.page.questions : [])])]
      .filter((q) => { const x = questions.find((y) => y.id === q); return !x || x.statut !== 'repondue'; }).sort();
    qs.forEach((q) => { const t = targetOf(q); out.push(t ? `<a class="qmark" href="${t}">${q}</a>` : q); });
    s.gaps.forEach((g) => out.push(`<a class="bl-gap" href="#${g.id}" data-tip="Écart : ${esc(g.label)}" aria-label="Écart : ${esc(g.label)}">!</a>`));
    return out.join(' ');
  };
  const row = (s) => {
    const r = relOf(s.rel);
    const name = `${link(s.href, s.id)} ${esc(s.title)}`;
    const st = s.status === 'abandonnee' ? '<span class="tag bl-st">Abandonnée</span>' : `<span class="tag bl-st t-st-${s.status}">${stLabel(s.status, 1, s.sprint)}</span>`;
    return `<tr data-facet-item data-f-release="${r.key}" data-f-statut="${s.status}"><td class="bl-name">${s.status === 'abandonnee' ? `<s>${name}</s>` : name}</td>
              <td data-label="Release"><span class="${r.tagClass}">${esc(r.unnamed ? 'Release' : r.label)}</span></td>
              <td data-label="Taille">${SZ(s.taille)}</td>
              <td data-label="Front / back">${fb(s.front)}</td>
              <td data-label="Statut">${st}</td>
              <td class="bl-more">${more(s)}</td></tr>`;
  };
  const groups = [...new Set(stories.map((s) => s.epic || ''))].sort((a, b) => (!a) - (!b) || num(a) - num(b)).map((e) => {
    const list = stories.filter((s) => (s.epic || '') === e)
      .sort((a, b) => (a.status === 'abandonnee') - (b.status === 'abandonnee') || relOf(a.rel).order - relOf(b.rel).order || num(a.id) - num(b.id));
    const ep = epics.get(e);
    const head = e ? `${link(ep ? ep.href : null, e)}${ep && ep.title ? ` ${esc(ep.title)}` : ''}` : 'Sans epic';
    return `<tbody data-facet-group>
            <tr class="bl-epic"><th scope="rowgroup" colspan="6">${head}</th></tr>
            ${list.map(row).join('\n            ')}
          </tbody>`;
  });
  if (!stories.length) return '<p class="none">Aucune story : la story map n\'en liste pas encore.</p>';
  return `<div class="bl" data-facet-unit="story" data-facet-units="stories" data-facets='${JSON.stringify(facets).replace(/'/g, '&#39;')}'>
        <table class="bl-table">
          <caption class="sr-only">Backlog : stories groupées par epic, avec release, taille, part front et back, statut et précisions</caption>
          <colgroup><col><col class="c-rel"><col class="c-size"><col class="c-front"><col class="c-st"><col class="c-more"></colgroup>
          <thead><tr><th scope="col">Story</th><th scope="col">Release</th><th scope="col">Taille</th><th scope="col">Front <i class="bl-sw bl-f" aria-hidden="true"></i> / back <i class="bl-sw bl-b" aria-hidden="true"></i></th><th scope="col">Statut</th><th scope="col"><span class="sr-only">Précisions</span></th></tr></thead>

          ${groups.join('\n\n          ')}
        </table>
      </div>`;
};
const genEcarts = () => {
  if (!gaps.length) return '<p>Aucun écart entre la story map, la roadmap, les stories et les PV.</p>';
  const order = ['taille', 'front', 'epic', 'epic-roadmap', 'release', 'release-roadmap', 'story-map', 'statut'];
  const list = [...gaps].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || num(a.story.id) - num(b.story.id));
  return `<ul class="bl-gaps">
        ${list.map((g) => `<li id="${g.id}">${link(g.story.href, g.story.id)} · ${g.html}</li>`).join('\n        ')}
      </ul>`;
};

// ---------- analyses page ----------
const genAnEntete = () => {
  const n = analyses.length;
  const bp = has('10-analyse/big-picture.html') ? '<a href="10-analyse/big-picture.html">big picture</a>' : 'big picture';
  let lede;
  if (!n) lede = "Aucun chantier d'analyse pour l'instant.";
  else {
    const counts = [['termine', 'est terminé', 'sont terminés'], ['restitue-partiel', 'est restitué partiel', 'sont restitués partiels'], ['en-cours', 'est en cours', 'sont en cours']]
      .map(([k, one, many]) => { const c = analyses.filter((a) => a.chantier === k).length; return c ? `${c} ${plural(c, one, many)}` : null; }).filter(Boolean);
    const qs = [...new Set(analyses.flatMap((a) => a.qIds))];
    const carriers = analyses.filter((a) => a.qIds.length).length;
    const groups = [...new Set(analyses.map((a) => a.pour).filter(Boolean))].sort((a, b) => colOrder(a) - colOrder(b)).map((c) => {
      const k = analyses.filter((a) => a.pour === c).length;
      return `${k} pour ${AN_PHASES.includes(c) ? '' : 'la release '}${colText(c)}${c === 'P1' ? `, ${plural(k, 'ouvert', 'ouverts')} depuis la ${bp}` : ''}`;
    });
    const gPart = groups.length > 1 ? `${groups.slice(0, -1).join(', ')}${/big picture/.test(groups[groups.length - 2]) ? ',' : ''} et ${groups[groups.length - 1]}` : groups[0] || '';
    const qPart = qs.length ? `${qs.length} ${plural(qs.length, 'question reste ouverte, portée', 'questions restent ouvertes, portées')} par ${carriers} ${plural(carriers, 'chantier', 'chantiers')}.` : 'Aucune question ne reste ouverte.';
    lede = `${n} ${plural(n, "chantier d'analyse", "chantiers d'analyse")}${gPart ? ` : ${gPart}` : ''}.${counts.length ? ` ${counts.join(', ')}.` : ''} ${qPart}`;
  }
  const src = [`pages d'analyse de <code>docs/10-analyse/</code>`];
  if (has('questions.html')) src.push('<a href="questions.html">questions</a>');
  return `<p class="lede">${lede}</p>
      <div class="meta">
        <span><b>Mise à jour</b> ${fr(TODAY)} à ${stamp.time}</span>
        <span><b>Sources</b> ${src.join(', ')}</span>
      </div>`;
};
const genChantiers = () => {
  if (!analyses.length) return '<p class="an-none">Aucun chantier d\'analyse : la big picture n\'est pas encore découpée en chantiers.</p>';
  const tag = (map, k) => (map[k] ? `<span class="${map[k][1]}">${map[k][0]}</span>` : '<span class="tag">?</span>');
  const pad3 = (n) => String(n).padStart(3, '0');
  const row = (a) => {
    const reco = a.reco || `<span class="an-none">${a.chantier === 'en-cours' ? 'Pas encore de recommandation : une passe reste à faire.' : 'Pas de recommandation.'}</span>`;
    const open = [];
    if (a.qIds.length) open.push(`<span class="an-list">${a.qIds.map((q) => `<a class="qmark" href="questions.html#${q}">${q}</a>`).join(' ')}</span>`);
    if (a.hyps) open.push(`<small>${a.hyps} ${plural(a.hyps, 'hypothèse', 'hypothèses')}</small>`);
    const imp = a.impacts && a.impacts.length
      ? `<span class="an-list">${a.impacts.map((i) => link(i.href, esc(i.label))).join(' ')}</span>` : '<span class="an-none">Pas encore identifiés</span>';
    const f = [['pour', a.pour ? a.pour.toLowerCase() : ''], ['avancement', a.chantier || ''], ['statut', a.statut || ''], ['auteur', a.auteur === 'IA' ? 'ia' : 'personne']];
    return `<tr data-facet-item ${f.map(([k, v]) => `data-f-${k}="${esc(v)}"`).join(' ')}><td class="an-name" data-sort-value="${esc(a.title)}"><a href="${a.file}">${esc(a.title)}</a>${a.question ? `<span class="an-q">${esc(a.question)}</span>` : ''}</td>
              <td data-label="Auteur" data-sort-value="${a.date || ''}">${esc(a.auteur)}${a.date ? `<small>${fr(a.date)}</small>` : ''}</td>
              <td data-label="Avancement">${tag(AN_CHANTIER, a.chantier)}</td>
              <td data-label="Statut">${tag(AN_STATUT, a.statut)}</td>
              <td data-label="Pour">${a.pour ? colText(a.pour) : '?'}</td>
              <td data-label="Recommandation" class="an-full">${reco}</td>
              <td data-label="Reste ouvert" data-sort-value="${pad3(a.qIds.length)}-${pad3(a.hyps)}">${open.length ? open.join('') : 'Rien'}</td>
              <td data-label="Livrables impactés">${imp}</td></tr>`;
  };
  const cols = [...AN_PHASES, ...releases.map((r) => r.key)];
  const facets = [
    { key: 'auteur', label: 'Auteur', options: [['ia', 'IA'], ['personne', 'Personne']] },
    { key: 'avancement', label: 'Avancement', options: AN_ORDER.map((k) => [k, cap(AN_CHANTIER[k][0])]) },
    { key: 'statut', label: 'Statut', options: Object.keys(AN_STATUT).map((k) => [k, cap(AN_STATUT[k][0])]) },
    { key: 'pour', label: 'Pour', aria: 'Filtrer par cible, phase ou release', options: cols.map((c) => [c.toLowerCase(), colLabel(c)]) },
  ];
  const order = (list) => esc(list.join('|'));
  return `<div class="bl" data-facet-unit="chantier" data-facet-units="chantiers" data-facet-genre="m" data-facets='${JSON.stringify(facets).replace(/'/g, '&#39;')}'>
        <table class="bl-table an-table" data-sortable>
          <caption class="sr-only">Chantiers d'analyse : question, auteur, avancement, statut, phase ou release préparée, recommandation, ce qui reste ouvert, livrables impactés</caption>
          <colgroup><col><col class="c-who"><col class="c-prog"><col class="c-stat"><col class="c-pour"><col><col class="c-open"><col class="c-impact"></colgroup>
          <thead><tr><th scope="col">Chantier</th><th scope="col">Auteur</th><th scope="col" data-sort-order="${order(AN_ORDER.map((k) => AN_CHANTIER[k][0]))}">Avancement</th><th scope="col" data-sort-order="${order(Object.values(AN_STATUT).map((v) => v[0]))}">Statut</th><th scope="col" data-sort-order="${order(cols.map(colLabel))}">Pour</th><th scope="col" data-sort="none">Recommandation</th><th scope="col">Reste ouvert</th><th scope="col" data-sort="none">Livrables impactés</th></tr></thead>
          <tbody>
            ${analyses.map(row).join('\n            ')}
          </tbody>
        </table>
      </div>`;
};

// ---------- render ----------
const fill = (tpl, blocks, dir) => {
  let out = tpl.replace(/NOM_PROJET/g, esc(projectName));
  for (const [name, html] of Object.entries(blocks)) {
    const re = new RegExp(`<!-- gen:${name} -->[\\s\\S]*?<!-- /gen:${name} -->`);
    if (!re.test(out)) { err(`gabarit sans bloc gen:${name}`); continue; }
    out = out.replace(re, () => `<!-- gen:${name} -->\n      ${rebase(html, dir)}\n      <!-- /gen:${name} -->`);
  }
  return out;
};
const tplPil = read(join(SKILL, 'template-pilotage.html'));
const tplBl = read(join(SKILL, 'template-backlog.html'));
const tplAn = read(join(SKILL, 'template-analyses.html'));
if (!tplPil || !tplBl || !tplAn) { console.error(`gabarits introuvables dans ${SKILL}`); process.exit(2); }
const outputs = [
  [OUT_PIL, fill(tplPil, { bandeau: genBandeau(), overview: genOverview(), gates: genGates(), attente: genHotspots(), indicateurs: genIndicators(), evenements: genEvents() }, '')],
  [OUT_BL, fill(tplBl, { entete: genEntete(), synthese: genSynthese(), backlog: genBacklog(), ecarts: genEcarts() }, '20-specs')],
  [OUT_AN, fill(tplAn, { entete: genAnEntete(), chantiers: genChantiers() }, '10-analyse')],
];
let drift = 0;
if (errors && !CHECK) console.error('erreurs : aucune page écrite, corriger puis relancer');
else outputs.forEach(([f, content]) => {
  if (read(f) === content) return;
  if (CHECK) { drift++; console.log(`would update ${f.slice(DOCS.length + 1)}`); } else { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, content); }
});
const nd = counted.filter(isDelivered).length;
console.log(`pilotage-pages : ${counted.length} stories (${nd} livrées), ${analyses.length} analyse(s), ${releases.length} release(s), ${sprints.length} sprint(s), ${gaps.length} écart(s), ${errors} erreur(s), ${warnings} avertissement(s)${CHECK ? (drift ? `, ${drift} page(s) à régénérer` : ', à jour') : ''}`);
process.exit(errors || (CHECK && drift) ? 1 : 0);
