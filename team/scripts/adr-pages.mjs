#!/usr/bin/env node
// Builds the register of the architecture decisions (ADR) of a project from its ADR pages, and fills the
// header of each page. The pages stay the source of truth: one HTML page per decision, its metadata in
// <meta> tags (skill deliverable-adr, template skills/deliverable-adr/template-adr.html of the plugin).
//
// Usage: node team/scripts/adr-pages.mjs [<project dir> | docs | docs/adr] [--check]   (default: the current directory)
//   --check   writes nothing; exit code 1 on an error or if a generated part would change
//             (check-deliverable.mjs runs it on a docs folder that holds ADR pages)
//
// Reads
//   adr/NNNN-<slug>.html     <meta name="id"> (ADR-NNNN), "title", "status" (proposed | accepted | superseded |
//                            abandoned), "date" (YYYY-MM-DD), "supersedes" (ADR-xxxx it replaces), "answers"
//                            (Q-xxx), "foundation_deviation" (yes | no)
//   questions.html, 20-specs, 20-ux, 00-framing, 30-design
//                            anchors and pages of the ids cited, to report an id left as bare text
//   index.html (portal)      project name
// Writes
//   adr/index.html           the register: one row per ADR (title, status, date, supersedes, superseded by,
//                            deviation from the foundation), counts by status in the header
//   adr/NNNN-<slug>.html     between <!-- gen:adr-meta --> and <!-- /gen --> in the header: status, date,
//                            supersedes, superseded by (computed from the "supersedes" of the other ADR), answers,
//                            deviation; a callout when the decision is superseded or a replacement is proposed
// Errors (exit 1): file name or id, unknown status, invalid date, unknown ADR superseded, status "superseded"
// without an accepted ADR that supersedes it, accepted ADR whose superseded ADR is not "superseded", h1 that
// differs from the title, required section missing, no rejected option, consequences without positive or
// negative, missing gen:adr-meta block. Warnings: section without its "i", id cited as bare text while its
// target exists, Q-xxx absent from questions.html, ADR still in Markdown, no "next" term.
// Sections are found by data-section, the terms of the consequences by dt data-value; labels from
// team/i18n/<lang>/adr.json.
// Idempotent: a second run changes nothing.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { projectLang, loadLabels, makeT, formatDate } from './lib/i18n.mjs';

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const arg = args.find((a) => !a.startsWith('--')) ?? '.';
if (!existsSync(arg) || !statSync(arg).isDirectory()) {
  console.error('Usage: adr-pages.mjs [<project dir> | docs | docs/adr] [--check]'); process.exit(2);
}
// A project dir (it holds docs/) stands for its docs/
const ADR = basename(resolve(arg)) === 'adr' ? resolve(arg)
  : existsSync(join(arg, 'docs', 'adr')) ? join(resolve(arg), 'docs', 'adr') : join(resolve(arg), 'adr');
const DOCS = resolve(ADR, '..');
if (!existsSync(ADR)) { console.log('adr-pages: no adr/ folder, nothing to do'); process.exit(0); }
// Project root: the folder that holds .team/, else the parent of docs/. Labels in its language
// (team/conventions/language.md).
const ROOT = existsSync(join(DOCS, '..', '.team')) || basename(DOCS) === 'docs' ? resolve(DOCS, '..') : DOCS;
const LANG = projectLang(ROOT);
const t = makeT(LANG, loadLabels(ROOT, ['adr'], LANG));

let errors = 0, warnings = 0;
const err = (m) => { errors++; console.error(`ERROR ${m}`); };
const warn = (m) => { warnings++; console.error(`warn ${m}`); };
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const read = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : '');
const strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

// Status codes, in register order, and the class of their tag
const STATUS = { proposed: 'warn', accepted: 'ok', superseded: '', abandoned: '' };
const statusTag = (s) => `<span class="tag${STATUS[s] ? ' ' + STATUS[s] : ''}">${t(`adr.status.${s}`)}</span>`;
const showDate = (d) => formatDate(d, LANG);
// Sections of the format: <section data-section="<code>">; code -> name used in the messages
const SECTIONS = { 'foundation-deviation': 'Foundation deviation', context: 'Context', decision: 'Decision', rationale: 'Rationale', consequences: 'Consequences' };
// Terms of the consequences: <dt data-value="<code>">
const TERMS = { positive: 'Positive', negative: 'Negative', next: 'Next' };
const codeOf = (attrHtml) => (attrHtml.match(/\bdata-(?:section|value)="([^"]*)"/) || [])[1] || null;

// ---------- ADR pages ----------
const files = readdirSync(ADR).sort();
files.filter((f) => /^\d{4}-.*\.md$/.test(f)).forEach((f) => warn(`adr/${f}: ADR in Markdown, convert it to an HTML page (skill deliverable-adr)`));
if (files.includes('README.md')) warn('adr/README.md: Markdown index, replaced by the generated register adr/index.html');
const pages = files.filter((f) => f.endsWith('.html') && f !== 'index.html');
if (!pages.length) { console.log('adr-pages: no ADR page in HTML, register not generated'); process.exit(errors ? 1 : 0); }

const metaOf = (html, name) => ((html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`)) || [])[1] ?? null);
const list = (v) => (v || '').split(/[\s,]+/).filter(Boolean);
const adrs = pages.map((file) => {
  const html = read(join(ADR, file));
  const m = file.match(/^(\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*\.html$/);
  if (!m) err(`adr/${file}: expected name NNNN-<kebab-slug>.html`);
  const a = {
    file, html, num: m ? m[1] : file.slice(0, 4),
    id: metaOf(html, 'id'), title: metaOf(html, 'title'), status: metaOf(html, 'status'), date: metaOf(html, 'date'),
    supersedes: list(metaOf(html, 'supersedes')), answers: list(metaOf(html, 'answers')), deviation: metaOf(html, 'foundation_deviation'),
  };
  const where = `adr/${file}`;
  if (a.id !== `ADR-${a.num}`) err(`${where}: meta id "${a.id ?? ''}", expected ADR-${a.num}`);
  if (!a.title) err(`${where}: meta title missing`);
  if (!(a.status in STATUS)) { err(`${where}: meta status "${a.status ?? ''}", expected ${Object.keys(STATUS).join(' | ')}`); a.status = 'proposed'; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.date || '') || isNaN(Date.parse(a.date))) { err(`${where}: meta date "${a.date ?? ''}", expected YYYY-MM-DD`); a.date = a.date || ''; }
  if (!['yes', 'no'].includes(a.deviation)) err(`${where}: meta foundation_deviation "${a.deviation ?? ''}", expected yes | no`);
  a.answers.forEach((q) => { if (!/^Q-\d{3}$/.test(q)) err(`${where}: answers "${q}", expected Q-xxx`); });
  // h1: "ADR-NNNN: title"
  const h1 = strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '');
  // the separator follows the typography of the language (" : " in French, ": " in English)
  if (a.title && h1.replace(/^(\S+)\s*:\s*/, '$1 : ') !== `${a.id} : ${a.title}`) err(`${where}: h1 title "${h1}" differs from meta title "${a.title}"`);
  if (!/<!-- gen:adr-meta -->[\s\S]*?<!-- \/gen -->/.test(html)) err(`${where}: block <!-- gen:adr-meta --><!-- /gen --> missing from the header`);
  // Sections of the format, each with its "i"
  const sections = [...html.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/g)].map(([, attrs, body]) => {
    const title = strip((body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || '');
    return { title, code: codeOf(attrs), body };
  });
  Object.entries(SECTIONS).forEach(([code, title]) => { if (!sections.some((s) => s.code === code)) err(`${where}: section "${title}" (data-section="${code}") missing`); });
  sections.filter((s) => !/<h2[^>]*>[\s\S]*?<\/h2>\s*<div class="info-body" hidden>/.test(s.body)).forEach((s) => warn(`${where}: section "${s.title}" without (i)`));
  const rationale = sections.find((s) => s.code === 'rationale');
  if (rationale && !/<table class="options">[\s\S]*?<tbody>\s*<tr/.test(rationale.body)) err(`${where}: "Rationale" without the table of rejected options (table.options)`);
  const csq = sections.find((s) => s.code === 'consequences');
  if (csq) {
    const terms = [...csq.body.replace(/<div class="info-body"[\s\S]*?<\/div>/, '').matchAll(/<dt\b([^>]*)>([\s\S]*?)<\/dt>/g)].map(([, attrs]) => codeOf(attrs));
    ['positive', 'negative'].forEach((c) => { if (!terms.includes(c)) err(`${where}: "Consequences" without "${TERMS[c]}" (dt data-value="${c}")`); });
    if (!terms.includes('next')) warn(`${where}: "Consequences" without "Next" (dt data-value="next")`);
  }
  return a;
});
const byId = new Map();
adrs.forEach((a) => { if (byId.has(a.id)) err(`adr/${a.file}: ${a.id} already taken by adr/${byId.get(a.id).file}`); else byId.set(a.id, a); });

// ---------- Replacement: "supersedes" is written once, in the new ADR; "superseded by" is computed ----------
adrs.forEach((a) => { a.by = []; a.byProposed = []; });
adrs.forEach((a) => a.supersedes.forEach((id) => {
  const old = byId.get(id);
  if (!old || id === a.id) { err(`adr/${a.file}: supersedes ${id}, unknown ADR`); return; }
  // An ADR that is itself superseded later (chain A -> B -> C) still supersedes its predecessor.
  if (a.status === 'accepted' || a.status === 'superseded') {
    old.by.push(a);
    if (a.status === 'accepted' && old.status !== 'superseded') err(`adr/${old.file}: superseded by ${a.id} (accepted), its status must become superseded`);
  } else if (a.status === 'proposed') old.byProposed.push(a);
}));
adrs.filter((a) => a.status === 'superseded' && !a.by.length).forEach((a) => err(`adr/${a.file}: status superseded without an accepted (or since superseded) ADR that supersedes it (meta supersedes)`));

// ---------- Links ----------
const anchorCache = new Map();
const anchors = (f) => {
  if (!anchorCache.has(f)) anchorCache.set(f, new Set([...read(f).matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])));
  return anchorCache.get(f);
};
const P = {
  questions: join(DOCS, 'questions.html'),
  functional: join(DOCS, '20-specs', 'functional-design.html'),
  framing: join(DOCS, '00-framing', 'framing.html'),
  ux: join(DOCS, '20-ux', 'ux-ui-spec.html'),
  macro: join(DOCS, '30-design', 'macro.html'),
  det: join(DOCS, '30-design', 'detailed'),
};
const fileIn = (dir, id) => (existsSync(dir) ? readdirSync(dir).find((f) => f === `${id}.html` || f.startsWith(`${id}-`)) : null);
// Is there a place where this id is defined? (team/glossary.md, part 1)
const hasTarget = (id) => {
  if (/^ADR-/.test(id)) return byId.has(id);
  if (/^Q-/.test(id)) return anchors(P.questions).has(id);
  if (/^(BR|FL|CALC|MSG)-\d/.test(id)) return anchors(P.functional).has(id) || anchors(P.framing).has(id);
  if (/^(SCR|MSG-U)/.test(id)) return anchors(P.ux).has(id);
  if (/^PER-/.test(id)) return anchors(P.framing).has(id);
  if (/^EP-/.test(id)) return !!fileIn(join(P.det, 'endpoints'), id) || anchors(P.macro).has(id);
  if (/^EN-/.test(id)) return !!fileIn(join(P.det, 'entities'), id) || anchors(P.macro).has(id);
  if (/^PROC-/.test(id)) return !!fileIn(join(P.det, 'processes'), id) || anchors(P.macro).has(id);
  if (/^INV-/.test(id)) {
    // A project invariant has its row; a stack or design system one taken by reference targets its section.
    const f = join(P.det, 'cross-cutting', 'compliance.html');
    if (!existsSync(f)) return false;
    const n = Number(id.slice(4));
    return anchors(f).has(id) || (n < 50 && anchors(f).has('stack-foundation')) || (n >= 70 && n < 80 && anchors(f).has('design-system'));
  }
  if (/^US-/.test(id)) return !!fileIn(join(DOCS, '20-specs', 'stories'), id);
  if (/^EPIC-/.test(id)) return !!fileIn(join(DOCS, '20-specs', 'epics'), id);
  return false;
};
const ID_RE = /\b(?:ADR-\d{4}|Q-\d{3}|MSG-U\d+|(?:BR|FL|CALC|MSG|SCR|EP|EN|PROC|INV|PER|US|EPIC)-\d+)\b/g;
adrs.forEach((a) => {
  const body = (a.html.match(/<body>([\s\S]*)<\/body>/) || [])[1] || '';
  const visible = body.replace(/<!-- gen:adr-meta -->[\s\S]*?<!-- \/gen -->/, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<div class="info-body"[\s\S]*?<\/div>/g, ' ').replace(/<h1[\s\S]*?<\/h1>/, ' ')
    .replace(/<a\b[\s\S]*?<\/a>/g, ' ').replace(/<(script|style|code|pre)\b[\s\S]*?<\/\1>/g, ' ');
  const bare = [...new Set(strip(visible).match(ID_RE) || [])].filter((id) => id !== a.id && hasTarget(id));
  if (bare.length) warn(`adr/${a.file}: ids cited without a link: ${bare.join(', ')}`);
  a.answers.filter((q) => !anchors(P.questions).has(q)).forEach((q) => warn(`adr/${a.file}: ${q} absent from questions.html, cited without a link`));
});
const adrLink = (b) => `<a href="${b.file}">${b.id}</a>`;
const qLink = (q) => (anchors(P.questions).has(q) ? `<a class="qmark" href="../questions.html#${q}">${q}</a>` : q);
const deviationTag = (e) => (e === 'yes' ? `<span class="tag danger">${t('adr.yes')}</span>` : `<span class="tag ok">${t('adr.no')}</span>`);
const links = (l, none) => (l.length ? l.map(adrLink).join(', ') : `<span class="none">${none}</span>`);

// ---------- Header of each ADR page ----------
const header = (a) => {
  const out = [`<div class="meta">
        <span><b>${t('adr.meta.status')}</b> ${statusTag(a.status)}</span>
        <span><b>${t('adr.meta.date')}</b> ${esc(showDate(a.date))}</span>
        <span><b>${t('adr.meta.replaces')}</b> ${links(a.supersedes.map((id) => byId.get(id)).filter(Boolean), t('adr.none.adr'))}</span>
        <span><b>${t('adr.meta.replaced-by')}</b> ${links(a.by, t('adr.none.adr'))}</span>
        <span><b>${t('adr.meta.answers')}</b> ${a.answers.length ? a.answers.map(qLink).join(', ') : `<span class="none">${t('adr.none.question')}</span>`}</span>
        <span><b>${t('adr.meta.deviation')}</b> ${deviationTag(a.deviation)}</span>
      </div>`];
  if (a.by.length) out.push(`<div class="callout warn"><b>${t('adr.callout.replaced.title')}</b>${t('adr.callout.replaced.text', { links: a.by.map(adrLink).join(', ') })}</div>`);
  if (a.byProposed.length) out.push(`<div class="callout warn"><b>${t('adr.callout.replacement.title')}</b>${t('adr.callout.replacement.text', { links: a.byProposed.map(adrLink).join(', ') })}</div>`);
  if (a.status === 'abandoned') out.push(`<div class="callout warn"><b>${t('adr.callout.abandoned.title')}</b>${t('adr.callout.abandoned.text')}</div>`);
  return `<!-- gen:adr-meta -->\n      ${out.join('\n      ')}\n      <!-- /gen -->`;
};

// ---------- Register ----------
const portal = read(join(DOCS, 'index.html'));
const project = ((portal.match(/<div class="toc-project">([^<]+)<\/div>/) || portal.match(/<h1>[\s\S]*?<\/span>\s*:\s*([^<]+)<\/h1>/) || [])[1] || basename(resolve(DOCS, '..'))).trim();
const sorted = [...adrs].sort((x, y) => x.num.localeCompare(y.num));
const count = (s) => adrs.filter((a) => a.status === s).length;
const last = sorted.map((a) => a.date).filter(Boolean).sort().pop() || '';
const toValidate = adrs.filter((a) => a.status === 'proposed' && a.deviation === 'yes').length;
const none = t('adr.none.adr');
const row = (a) => `          <tr id="${a.id}"><td data-sort-value="${a.num}">${adrLink(a)}</td><td>${esc(a.title)}</td><td data-sort-value="${Object.keys(STATUS).indexOf(a.status)}">${statusTag(a.status)}</td><td data-sort-value="${esc(a.date)}">${esc(showDate(a.date))}</td><td>${links(a.supersedes.map((id) => byId.get(id)).filter(Boolean), none)}</td><td>${links(a.by, none)}${a.byProposed.length ? ` <span class="tag warn">${t('adr.status.proposed')}</span> ${a.byProposed.map(adrLink).join(', ')}` : ''}</td><td>${a.answers.length ? a.answers.map(qLink).join(', ') : `<span class="none">${t('adr.none.question-short')}</span>`}</td><td data-sort-value="${a.deviation}">${deviationTag(a.deviation)}</td></tr>`;
const index = `<!doctype html>
<html lang="${esc(LANG)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${t('adr.register.title')} · ${esc(project)}</title>
  <link rel="icon" href="data:,">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../_assets/doc.css">
</head>
<body>
<!-- Generated by team/scripts/adr-pages.mjs from the <meta> tags of the ADR pages. Do not edit: edit the ADR page, then regenerate. -->
<div class="doc">
  <aside class="doc-toc">
    <div class="toc-project">${esc(project)}</div>
    <div class="toc-type">${t('adr.register.toc-type')}</div>
    <nav></nav>
    <div class="toc-back"><a href="../30-design/macro.html">${t('adr.back.macro')}</a><br><a href="../index.html">${t('adr.back.portal')}</a></div>
  </aside>
  <main class="doc-main wide">
    <header class="doc-header">
      <div class="kicker">${t('adr.register.kicker')}</div>
      <h1>${t('adr.heading', { kind: `<span class="doc-kind">${t('adr.register.kind')}</span>`, title: esc(project) })}</h1>
      <p class="lede">${t('adr.register.lede')}</p>
      <div class="meta">
${Object.keys(STATUS).map((s) => `        <span><b>${t(`adr.register.count.${s}`)}</b> ${count(s)}</span>`).join('\n')}
        <span><b>${t('adr.register.to-validate')}</b> ${toValidate}</span>
        <span><b>${t('adr.register.last')}</b> ${esc(showDate(last))}</span>
      </div>
    </header>
    <section class="section" data-section="register">
      <h2>${t('adr.register.section')}</h2>
      <div class="info-body" hidden>
        <dl class="defs">
          <dt>${t('adr.info.purpose')}</dt><dd>${t('adr.register.info.purpose')}</dd>
          <dt>${t('adr.info.content')}</dt><dd>${t('adr.register.info.content')}</dd>
          <dt>${t('adr.info.why')}</dt><dd>${t('adr.register.info.why')}</dd>
          <dt>${t('adr.info.read')}</dt><dd><ul>${Object.keys(STATUS).map((s) => `<li>${t(`adr.register.info.read.${s}`, { tag: statusTag(s) })}</li>`).join('')}</ul></dd>
          <dt>${t('adr.info.source')}</dt><dd>${t('adr.register.info.source')}</dd>
        </dl>
      </div>
      <table data-sortable>
        <thead><tr><th data-col="id">${t('adr.col.id')}</th><th data-col="title" style="width:34%">${t('adr.col.title')}</th><th data-col="status">${t('adr.col.status')}</th><th data-col="date">${t('adr.col.date')}</th><th data-col="replaces">${t('adr.col.replaces')}</th><th data-col="replaced-by">${t('adr.col.replaced-by')}</th><th data-col="answers">${t('adr.col.answers')}</th><th data-col="deviation">${t('adr.col.deviation')}</th></tr></thead>
        <tbody>
${sorted.map(row).join('\n')}
        </tbody>
      </table>
    </section>
  </main>
</div>
<script src="../_assets/doc.js"></script>
</body>
</html>
`;

// ---------- Write or check ----------
const outputs = [[join(ADR, 'index.html'), index]];
adrs.forEach((a) => outputs.push([join(ADR, a.file), a.html.replace(/<!-- gen:adr-meta -->[\s\S]*?<!-- \/gen -->/, header(a))]));
let drift = 0;
if (errors && !CHECK) console.error('errors: no page written, fix them and run again');
else outputs.forEach(([f, content]) => {
  if (read(f) === content) return;
  if (CHECK) { drift++; console.log(`would update ${f.slice(DOCS.length + 1)}`); } else writeFileSync(f, content);
});
console.log(`adr-pages: ${adrs.length} ADR (${Object.keys(STATUS).map((s) => `${count(s)} ${s}`).join(', ')}), ${errors} error(s), ${warnings} warning(s)${CHECK ? (drift ? `, ${drift} file(s) to regenerate` : ', up to date') : ''}`);
if (t.missing.size) console.error(`missing labels: ${[...t.missing].join(', ')}`);
process.exit(errors || (CHECK && drift) ? 1 : 0);
