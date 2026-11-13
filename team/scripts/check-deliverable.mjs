#!/usr/bin/env node
// Checks HTML deliverables: every <section data-level="required"> must be free of .todo placeholders,
// and relative links must resolve: a missing anchor in an existing deliverable is an error, a link to a
// file not produced yet is a warning. The configuration of the roadmap calendar (plan.js) must be valid.
// An identifier of the visible text (outside code, scripts and attributes) whose prefix is not declared
// in part 1 of team/glossary.md is a warning. So is a short identifier of the wrong shape: Rn or Dn alone
// outside a story page, Sn alone anywhere (see badSigils).
// A folder that holds the API contract (docs/, or docs/30-design, with 30-design/api/openapi.yaml)
// also runs `detailed-pages.mjs <30-design> --check`: the detailed design pages and the technical
// notes of the stories must be up to date with the contract, without error.
// A folder that holds ADR pages (docs/, or docs/adr, with adr/NNNN-<slug>.html) also runs
// `adr-pages.mjs <docs> --check`: requirements of the skill deliverable-adr, header of each ADR and register
// adr/index.html up to date, without error.
// A project (its root dir, or its docs/, next to a .team/journal.md) also runs `dashboard-pages.mjs <project> --check`:
// steering page docs/index.html, backlog docs/20-specs/backlog.html and analyses docs/10-analysis/index.html up to date,
// sources without error.
// A sprint page (docs/sprints/sprint-N.html) also has its retro chain checked (skill deliverable-sprint): errors when an
// action Sn-Am has no link to a problem Sn-Pm or a nature other than data-value="trial" or "lasting",
// or when an evolution Sn-Em has no link to an action Sn-Am (a missing #Sn-… anchor is a broken link, as any other);
// warnings when a problem is cited by no action, when the prefix Sn differs from the number of the page, when the
// File column of an evolution starts with a project path. A sprint page without any Sn-… row is of the older retro
// format: a warning, and a link #Sn-… into such a page is a warning, not an error.
// Usage: node check-deliverable.mjs [<file.html|dir> ...]   (default: the current directory)   Exit code 1 if a required section is incomplete,
// an anchor is missing, or the generated pages of the detailed design or of the ADR have drifted.
import { readFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { projectLang } from './lib/i18n.mjs';

const files = [];
const walk = (p) => {
  const st = statSync(p);
  if (st.isDirectory()) {
    for (const f of readdirSync(p)) if (!f.startsWith('_') && !f.startsWith('.')) walk(join(p, f));
  } else if (p.endsWith('.html')) files.push(p);
};
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ['.'];
targets.forEach(walk);
if (!files.length) { console.error('Usage: check-deliverable.mjs <file.html|dir> [...]'); process.exit(2); }

const LEVELS = ['required', 'recommended', 'optional'];
// Project of a deliverable: the nearest parent folder holding .team/ (team/conventions/language.md)
const rootCache = new Map();
const projectRootOf = (file) => {
  const start = dirname(resolve(file));
  if (rootCache.has(start)) return rootCache.get(start);
  let d = start, root = null;
  for (;;) {
    if (existsSync(join(d, '.team'))) { root = d; break; }
    const up = dirname(d);
    if (up === d) break;
    d = up;
  }
  rootCache.set(start, root);
  return root;
};
// Gherkin scenario keywords of every language the plugin ships, plus the project's own (.team/labels.json)
const I18N_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'i18n');
const builtinScenario = existsSync(I18N_DIR) ? readdirSync(I18N_DIR).flatMap((l) => {
  const f = join(I18N_DIR, l, 'gherkin.json');
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')).scenario || [] : [];
}) : [];
const scenarioCache = new Map();
const scenarioRe = (file) => {
  const root = projectRootOf(file);
  if (!scenarioCache.has(root)) {
    let words = [...builtinScenario];
    const own = root && join(root, '.team', 'labels.json');
    if (own && existsSync(own)) { try { words = words.concat((JSON.parse(readFileSync(own, 'utf8')).gherkin || {}).scenario || []); } catch { /* reported by dashboard-pages */ } }
    const esc = [...new Set(words)].map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    scenarioCache.set(root, new RegExp(`^\\s*(?:${esc || 'Scenario'})\\s+(\\d+)\\s*:`, 'gmu'));
  }
  return scenarioCache.get(root);
};
// Anchors of a deliverable: explicit ids, plus the ids doc.js gives section titles (same slug)
const slug = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const anchorCache = new Map();
const anchorsOf = (f) => {
  if (!anchorCache.has(f)) {
    const t = readFileSync(f, 'utf8'), set = new Set();
    for (const [, id] of t.matchAll(/\bid="([^"]+)"/g)) set.add(id);
    for (const [, h] of t.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/g)) set.add(slug(h.replace(/<[^>]+>/g, '').trim()));
    for (const [, n] of t.matchAll(scenarioRe(f))) set.add('S' + n); // Gherkin cards, ids given by doc.js
    anchorCache.set(f, set);
  }
  return anchorCache.get(f);
};
// Identifier prefixes declared in the glossary: backticked `PREFIX-...` tokens of its part "Identifiers"
const glossary = join(dirname(fileURLToPath(import.meta.url)), '..', 'glossary.md');
const declared = (() => {
  if (!existsSync(glossary)) return null;
  const part = readFileSync(glossary, 'utf8').split(/^## /m).find((s) => /^[\d. ]*Identifiers/.test(s)) || '';
  return new Set([...part.matchAll(/`([A-Z]{1,5})-[0-9A-Za-z]/g)].map((m) => m[1]));
})();
if (!declared) console.log(`(glossary not found: ${relative(process.cwd(), glossary)}, prefixes not checked)`);
const visibleText = (html) => html.replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<(script|style|pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
const undeclaredIds = (html) => (declared ? [...new Set([...visibleText(html).matchAll(/\b([A-Z]{2,5})-[0-9]+\b/g)]
  .filter((m) => !declared.has(m[1])).map((m) => m[0]))] : []);
// Shape of the short identifiers (team/glossary.md, part 1, "Release and sprint in a text"): outside
// its story, a rule Rn or a data set Dn is written US-xxx/Rn, US-xxx/Dn, and a release "release R2";
// everywhere, Sn alone is a sprint written S2 instead of "sprint 2", or an unqualified scenario.
// Not checked: code, attributes, quotations (blockquote, q, cite, « … », “…”), release labels (.tag,
// .sm-release, elements carrying data-release or data-rel, an element whose whole text is the sigil),
// in a story page, a link to one of its own scenarios, and any element marked data-abbr or
// class="abbr", the readable exception for a page that must show a sigil alone. A sigil continuing a
// qualified list is accepted: "US-006/S1 to S7", "releases R2 and R3". The connectors of such a list are
// read in English and in French (and, or, to; et, ou, à), the languages of the plugin's own examples.
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const dropElements = (html, drop) => {
  let out = '', depth = 0, closing = null, last = 0;
  for (const m of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
    const [tag, slash, name, attrs] = m, n = name.toLowerCase();
    if (closing) {
      if (n !== closing || VOID.has(n) || attrs.endsWith('/')) continue;
      depth += slash ? -1 : 1;
      if (!depth) { closing = null; last = m.index + tag.length; out += ' '; }
    } else if (!slash && !VOID.has(n) && drop(n, attrs)) {
      out += html.slice(last, m.index); closing = n; depth = 1;
    }
  }
  return closing ? out : out + html.slice(last);
};
const SIGIL = '[RDS](?:\\d+|n|N)';
const labelElement = (n, attrs) => ['blockquote', 'q', 'cite'].includes(n)
  || /\bdata-(abbr|release|rel)\b/.test(attrs)
  || /\bclass="[^"]*\b(tag|sm-release|abbr)\b[^"]*"/.test(attrs);
const sigilText = (html) => visibleText(dropElements(html.replace(/<!--[\s\S]*?-->/g, ' '), labelElement)
  .replace(new RegExp(`<(?!a\\b)([a-zA-Z][\\w-]*)\\b[^>]*>\\s*${SIGIL}\\s*</\\1>`, 'g'), ' '))
  .replace(/«[^«»]{0,200}»|“[^“”]{0,200}”/g, ' ').replace(/\s+/g, ' ');
const isStory = (file) => /[\\/]20-specs[\\/]stories[\\/]US-[^\\/]*\.html$/.test(file);
const badSigils = (html, file) => {
  // in its story, a link to one of its own scenarios (<a href="#S4">S4</a>) is the scenario itself
  const own = isStory(file) ? html.replace(/<a\b[^>]*\bhref="#(S\d+)"[^>]*>\s*\1\s*<\/a>/g, ' ') : html;
  const text = sigilText(own), found = { R: [], D: [], S: [] }, seen = new Set();
  const re = new RegExp(`(?<![\\p{L}\\p{N}_/#-])(${SIGIL})(?![\\p{L}\\p{N}_/-])`, 'gu');
  const sep = '\\s*(?:,|and|or|to|et|ou|à)\\s*';
  for (const m of text.matchAll(re)) {
    const kind = m[1][0], before = text.slice(Math.max(0, m.index - 120), m.index);
    if (kind !== 'S' && isStory(file)) continue;
    // qualified by US-xxx/ in a list it continues: "US-006/S1 to S7", "US-005/S1, S2"
    if (new RegExp(`US-\\d+/${kind}(?:\\d+|n|N)(?:${sep}${kind}(?:\\d+|n|N))*${sep}$`, 'u').test(before)) continue;
    // a release: "release R2", "releases R2 and R3", "release MVP or R2"
    if (kind === 'R' && /\breleases?\s+(?:(?:MVP|R\d+|Rn)\s*(?:,|and|or|to|et|ou|à)\s*)*$/iu.test(before)) continue;
    const after = text.slice(m.index + m[1].length, m.index + m[1].length + 20);
    const ctx = `${before.slice(-30).replace(/^\S*\s/, '')}${m[1]}${after.replace(/\s\S*$/, '')}`;
    if (seen.has(ctx)) continue;
    seen.add(ctx);
    found[kind].push(`"${ctx.trim()}"`);
  }
  return found;
};
const SIGIL_HINT = {
  R: 'Rn alone, write US-xxx/Rn (rule of a story) or "release Rn"',
  D: 'Dn alone, write US-xxx/Dn (data set of a story)',
  S: 'Sn alone, write "sprint N" or US-xxx/Sn (scenario of a story)',
};
// Retro chain of a sprint page: rows <tr id="Sn-Pm|Sn-Am|Sn-Em"> of its tables, columns found by their header
const RETRO_ID = /^S(\d+)-([PAE])(\d+)$/;
const NATURES = ['trial', 'lasting'];
const PROJECT_PATH = /^(\.\/|\/)?(docs|\.team|src|backend|frontend)\//;
const cellText = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/[\u2019]/g, "'").replace(/\s+/g, ' ').trim();
const sprintPage = (file) => (file.match(/[\\/]sprints[\\/]sprint-(\d+)\.html$/) || [])[1];
const retroIds = (html) => [...html.matchAll(/<tr\b[^>]*\bid="(S\d+-[PAE]\d+)"/g)].map((m) => m[1]);
function checkSprint(html, n) {
  const errs = [], warns = [];
  const items = [];
  for (const [, table] of html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)) {
    // A column is found by its data-col code, else by its default position
    const heads = [...((table.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/) || [])[1] || '').matchAll(/<th\b([^>]*)>/g)]
      .map((m) => ({ code: (m[1].match(/\bdata-col="([^"]+)"/) || [])[1] }));
    for (const [, attrs, body] of table.matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/g)) {
      const id = (attrs.match(/\bid="([^"]+)"/) || [])[1];
      const m = id && id.match(RETRO_ID);
      if (!m) continue;
      const cells = [...body.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/g)].map((c) => ({ attrs: c[1], html: c[2] }));
      const col = (code, dflt) => {
        const i = heads.findIndex((h) => h.code === code);
        return cells[i >= 0 ? i : dflt] || { attrs: '', html: '' };
      };
      items.push({ id, sprint: m[1], kind: m[2], body, col });
    }
  }
  if (!items.length) {
    if (/data-section="retro"/.test(html)) warns.push('older retro format: no row Sn-Pm, Sn-Am or Sn-Em (skill deliverable-sprint)');
    return { errs, warns };
  }
  const cites = (body, kind) => [...body.matchAll(/<a\b[^>]*\bhref="[^"#]*#(S\d+-[PAE]\d+)"/g)].map((x) => x[1]).filter((x) => x.match(RETRO_ID)[2] === kind);
  const cited = new Set();
  items.forEach((it) => {
    if (it.sprint !== n) warns.push(`${it.id}: prefix S${it.sprint} on the page of sprint ${n}`);
    if (it.kind === 'A') {
      const ps = cites(it.body, 'P');
      ps.forEach((p) => cited.add(p));
      if (!ps.length) errs.push(`${it.id}: no link to a problem Sn-Pm`);
      const cell = it.col('nature', 3);
      const nature = (cell.attrs.match(/\bdata-value="([^"]*)"/) || [])[1] ?? '';
      if (!NATURES.includes(nature)) errs.push(`${it.id}: nature data-value="${nature}", expected "trial" (one-sprint trial) or "lasting" (lasting change)`);
    } else if (it.kind === 'E') {
      if (!cites(it.body, 'A').length) errs.push(`${it.id}: no link to an action Sn-Am`);
      const f = cellText(it.col('file', 1).html);
      if (PROJECT_PATH.test(f)) warns.push(`${it.id}: the file "${f.split(/[\s,]/)[0]}" is a path of the project; an evolution targets a file of the plugin, a change of the project is an action`);
    }
  });
  items.filter((it) => it.kind === 'P' && !cited.has(it.id)).forEach((it) => warns.push(`${it.id}: cited by no action`));
  return { errs, warns };
}
const hasTodo = (html) => /class="[^"]*\btodo\b[^"]*"/.test(html);
let failed = false;

// Capacity planner of the roadmap (plan.js): the JSON configuration of each .capa must parse, and every
// reference must resolve: dependencies, releases, tickets, the estimate rows it fills, the skills it needs.
function checkPlan(html) {
  const errs = [];
  const configs = [...html.matchAll(/<div class="capa">\s*<script type="application\/json">([\s\S]*?)<\/script>/g)];
  if (!configs.length) return errs;
  // stories of the estimate table: rows with data-size, first link = story id
  const stories = new Set([...html.matchAll(/<tr\b[^>]*data-size="[^"]+"[^>]*>\s*<td><a [^>]*>([^<]+)<\/a>/g)].map((m) => m[1].trim()));
  const storyRel = new Map([...html.matchAll(/<tr\b[^>]*data-size="[^"]+"[^>]*data-rel="([^"]+)"[^>]*>\s*<td><a [^>]*>([^<]+)<\/a>/g)].map((m) => [m[2].trim(), m[1]]));
  configs.forEach(([, json], n) => {
    const tag = configs.length > 1 ? `#${n + 1} ` : '';
    let cfg;
    try { cfg = JSON.parse(json); } catch (e) { errs.push(`${tag}invalid JSON: ${e.message}`); return; }
    const items = cfg.items || [], profiles = cfg.profiles || [], releases = cfg.releases || [], modes = (cfg.modes || []).map((m) => m.id);
    const ids = new Set(items.map((i) => i.id));
    items.forEach((i, k) => { if (items.findIndex((x) => x.id === i.id) !== k) errs.push(`${tag}duplicate item: ${i.id}`); });
    const rels = new Set(releases.map((r) => r.id));
    const known = (a) => (a.startsWith('rel:') ? rels.has(a.slice(4)) : ids.has(a) || stories.has(a));
    items.forEach((i) => (i.after || []).forEach((a) => { if (!known(a)) errs.push(`${tag}${i.id} waits for ${a}, unknown`); }));
    (cfg.storyAfter || []).forEach((a) => { if (!known(a)) errs.push(`${tag}storyAfter: ${a} unknown`); });
    Object.entries(cfg.storyDeps || {}).forEach(([k, v]) => {
      if (!stories.has(k)) errs.push(`${tag}storyDeps: ${k} absent from the estimate`);
      v.forEach((a) => { if (!known(a)) errs.push(`${tag}storyDeps: ${k} waits for ${a}, unknown`); });
    });
    releases.forEach((r) => { if (!ids.has(r.gate)) errs.push(`${tag}release ${r.id}: gate ${r.gate} unknown`); });
    items.filter((i) => i.story).forEach((i) => { if (!stories.has(i.story)) errs.push(`${tag}ticket ${i.id}: story ${i.story} absent from the estimate`); });
    items.filter((i) => i.deliver && isNaN(Date.parse(i.deliver))).forEach((i) => errs.push(`${tag}${i.id}: invalid delivery date`));
    // skills: every skill a mode needs is carried by a profile of that mode
    const has = (mode, skill) => profiles.some((p) => p.calc !== false && (!p.modes || p.modes.includes(mode)) && (p.skills || []).includes(skill));
    modes.forEach((mode) => {
      const need = new Set(mode === 'ai' ? ['agent', 'validation'] : stories.size ? ['front', 'back', 'validation'] : []);
      items.forEach((i) => ((i.work && (i.work[mode] || i.work.all)) || []).forEach(([sk]) => need.add(sk)));
      need.forEach((sk) => { if (!has(mode, sk)) errs.push(`${tag}mode ${mode}: no profile for "${sk}"`); });
    });
    // stories of a release that the planner cannot place
    storyRel.forEach((rel, id) => { if (!rels.has(rel)) errs.push(`${tag}${id}: release ${rel} absent from the calendar`); });
    if (n === 0) {
      for (const [, list] of html.matchAll(/data-items="([^"]+)"/g)) list.split(/\s+/).forEach((id) => { if (!ids.has(id)) errs.push(`estimate: data-items ${id} unknown`); });
      for (const [, ref] of html.matchAll(/data-plan="([^"]+)"/g)) if (!rels.has(ref.split(':')[0])) errs.push(`data-plan ${ref}: unknown release`);
    }
  });
  return errs;
}

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const re = /<section\b([^>]*)>([\s\S]*?)<\/section>/g;
  const counts = Object.fromEntries(LEVELS.map((l) => [l, { total: 0, todo: [] }]));
  let m;
  while ((m = re.exec(html))) {
    const level = (m[1].match(/data-level="([^"]+)"/) || [])[1];
    if (!LEVELS.includes(level)) continue;
    const title = ((m[2].match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || '(untitled)').replace(/<[^>]+>/g, '').trim();
    counts[level].total++;
    if (hasTodo(m[2])) counts[level].todo.push(title);
  }
  // Links: <a href="relative/path#anchor">, skipping external, mailto and template placeholders
  const broken = [], pending = [], oldRetro = [];
  for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
    if (/^([a-z]+:|\/\/)/i.test(href) || href.includes('xxx') || href === '#') continue;
    const [path, anchor] = href.split('#');
    const target = path ? resolve(dirname(file), decodeURI(path)) : resolve(file);
    if (!existsSync(target)) { pending.push(href); continue; }
    // In the prototype, #SCR-xx is a hash route of the single-page app, not an HTML anchor: check that
    // the screen is registered in its app.js instead.
    if (anchor && /[\\/]prototype[\\/]index\.html$/.test(target)) {
      const app = join(dirname(target), 'app.js');
      const screen = anchor.split(/[/?]/)[0];
      if (existsSync(app) && !readFileSync(app, 'utf8').includes(`'${screen}'`)) broken.push(href);
      continue;
    }
    // In the Swagger UI view of openapi.yaml, #/tag/operationId is a deep link of Swagger UI: check that
    // the operationId is in the spec embedded in the page.
    if (anchor && anchor.startsWith('/')) {
      const opId = decodeURIComponent(anchor.split('/').pop());
      if (!readFileSync(target, 'utf8').includes(`"operationId":"${opId}"`)) broken.push(href);
      continue;
    }
    if (anchor && target.endsWith('.html') && !anchorsOf(target).has(anchor)) {
      // #Sn-Am into a sprint page of the older retro format, which has no such rows: a warning
      if (RETRO_ID.test(anchor) && sprintPage(target) && !retroIds(readFileSync(target, 'utf8')).length) oldRetro.push(href);
      else broken.push(href);
    }
  }
  // Language: a deliverable of a project carries the project language on <html lang> (en without .team/project.json)
  const root = projectRootOf(file);
  const langWarn = [];
  if (root) {
    const want = projectLang(root), got = (html.match(/<html\b[^>]*\blang="([^"]*)"/i) || [])[1];
    if (got !== want) langWarn.push(`<html lang="${got ?? ''}">, project language ${want} (.team/project.json)`);
  }
  const plan = checkPlan(html);
  const sprintN = sprintPage(file);
  const retro = sprintN ? checkSprint(html, sprintN) : { errs: [], warns: [] };
  const unknown = undeclaredIds(html);
  const sigils = badSigils(html, file);
  const mand = counts.required;
  const ok = mand.todo.length === 0 && broken.length === 0 && plan.length === 0 && retro.errs.length === 0;
  if (!ok) failed = true;
  const total = LEVELS.reduce((n, l) => n + counts[l].total, 0);
  console.log(`${ok ? 'OK ' : 'KO '} ${relative(process.cwd(), file)}  (${total} sections)`);
  for (const l of LEVELS) {
    const c = counts[l];
    if (!c.total) continue;
    const done = c.total - c.todo.length;
    console.log(`     ${l.padEnd(12)} ${done}/${c.total}${c.todo.length ? '  to complete: ' + c.todo.join(' | ') : ''}`);
  }
  if (broken.length) console.log(`     links KO     missing anchor: ${[...new Set(broken)].join(' | ')}`);
  if (plan.length) console.log(`     calendar     ${plan.join(' | ')}`);
  if (retro.errs.length) console.log(`     retro KO     ${retro.errs.join(' | ')}`);
  if (retro.warns.length) console.log(`     retro        ${retro.warns.join(' | ')}`);
  if (oldRetro.length) console.log(`     links        sprint page of the older retro format, missing anchor: ${[...new Set(oldRetro)].join(' | ')}`);
  if (langWarn.length) console.log(`     language     ${langWarn.join(' | ')}`);
  if (unknown.length) console.log(`     glossary     prefix not declared in team/glossary.md: ${unknown.join(' | ')}`);
  for (const [k, list] of Object.entries(sigils)) if (list.length) console.log(`     sigil ${k}n      ${SIGIL_HINT[k]}: ${list.join(' | ')}`);
  if (pending.length) console.log(`     links        target not produced yet: ${[...new Set(pending)].join(' | ')}`);
}
// Detailed design generated from the contract: run its generator in check mode
const designs = new Set();
targets.forEach((a) => {
  const p = resolve(a);
  if (!existsSync(p) || !statSync(p).isDirectory()) return;
  if (existsSync(join(p, 'api', 'openapi.yaml'))) designs.add(p);
  else if (existsSync(join(p, '30-design', 'api', 'openapi.yaml'))) designs.add(join(p, '30-design'));
});
const generator = join(dirname(fileURLToPath(import.meta.url)), 'detailed-pages.mjs');
designs.forEach((dir) => {
  const r = spawnSync(process.execPath, [generator, dir, '--check'], { encoding: 'utf8' });
  const lines = `${r.stdout || ''}${r.stderr || ''}`.split('\n').filter(Boolean);
  const ok = r.status === 0;
  if (!ok) failed = true;
  console.log(`${ok ? 'OK ' : 'KO '} ${relative(process.cwd(), dir)}  (detailed-pages --check)`);
  const pick = (re) => lines.filter((l) => re.test(l));
  const summary = lines.find((l) => /^API contract v/.test(l)) || '';
  console.log(`     ${summary}`);
  pick(/^ERROR /).forEach((l) => console.log(`     ${l}`));
  pick(/^would /).forEach((l) => console.log(`     ${l}: run node ${generator} ${relative(process.cwd(), dir)}`));
  if (r.status === 2) console.log(`     ${lines.join(' | ')}`);
  const nWarn = pick(/^warn /).length;
  if (nWarn) console.log(`     ${nWarn} warning(s): see node ${generator} ${relative(process.cwd(), dir)} --check`);
});
// ADR register generated from the ADR pages: run its generator in check mode
const adrDirs = new Set();
targets.forEach((a) => {
  const p = resolve(a);
  if (!existsSync(p) || !statSync(p).isDirectory()) return;
  const dir = p.endsWith(`${sep}adr`) ? p : join(p, 'adr');
  if (existsSync(dir) && readdirSync(dir).some((f) => /^\d{4}-.*\.(html|md)$/.test(f))) adrDirs.add(dir);
});
const adrGenerator = join(dirname(fileURLToPath(import.meta.url)), 'adr-pages.mjs');
adrDirs.forEach((dir) => {
  const r = spawnSync(process.execPath, [adrGenerator, dir, '--check'], { encoding: 'utf8' });
  const lines = `${r.stdout || ''}${r.stderr || ''}`.split('\n').filter(Boolean);
  const ok = r.status === 0;
  if (!ok) failed = true;
  console.log(`${ok ? 'OK ' : 'KO '} ${relative(process.cwd(), dir)}  (adr-pages --check)`);
  lines.filter((l) => /^adr-pages: /.test(l)).forEach((l) => console.log(`     ${l}`));
  lines.filter((l) => /^ERROR /.test(l)).forEach((l) => console.log(`     ${l}`));
  lines.filter((l) => /^would /.test(l)).forEach((l) => console.log(`     ${l}: run node ${adrGenerator} ${relative(process.cwd(), dir)}`));
  lines.filter((l) => /^warn /.test(l)).forEach((l) => console.log(`     ${l}`));
  if (r.status === 2) console.log(`     ${lines.join(' | ')}`);
});
// Steering page, backlog and analyses generated from the project files: run their generator in check mode, on a project
// (its root dir, or its docs/, next to a .team/journal.md). The format examples have no journal: not run there.
const projects = new Set();
targets.forEach((a) => {
  const p = resolve(a);
  if (!existsSync(p) || !statSync(p).isDirectory()) return;
  if (existsSync(join(p, 'docs')) && existsSync(join(p, '.team', 'journal.md'))) projects.add(p);
  else if (existsSync(join(p, '..', '.team', 'journal.md')) && existsSync(join(p, '20-specs'))) projects.add(resolve(p, '..'));
});
const dashGenerator = join(dirname(fileURLToPath(import.meta.url)), 'dashboard-pages.mjs');
const i18nGenerator = join(dirname(fileURLToPath(import.meta.url)), 'i18n-assets.mjs');
projects.forEach((dir) => {
  const r = spawnSync(process.execPath, [i18nGenerator, dir, '--check'], { encoding: 'utf8' });
  if (r.status !== 0) console.log(`     warn docs/_assets/i18n.js missing or out of date: run node ${i18nGenerator} ${relative(process.cwd(), dir) || '.'}`);
});
projects.forEach((dir) => {
  const r = spawnSync(process.execPath, [dashGenerator, dir, '--check'], { encoding: 'utf8' });
  const lines = `${r.stdout || ''}${r.stderr || ''}`.split('\n').filter(Boolean);
  const ok = r.status === 0;
  if (!ok) failed = true;
  console.log(`${ok ? 'OK ' : 'KO '} ${relative(process.cwd(), dir)}  (dashboard-pages --check)`);
  lines.filter((l) => /^dashboard-pages: /.test(l)).forEach((l) => console.log(`     ${l}`));
  lines.filter((l) => /^ERROR /.test(l)).forEach((l) => console.log(`     ${l}`));
  lines.filter((l) => /^would /.test(l)).forEach((l) => console.log(`     ${l}: run node ${dashGenerator} ${relative(process.cwd(), dir)}`));
  lines.filter((l) => /^warn /.test(l)).forEach((l) => console.log(`     ${l}`));
  if (r.status === 2) console.log(`     ${lines.join(' | ')}`);
});
process.exit(failed ? 1 : 0);
