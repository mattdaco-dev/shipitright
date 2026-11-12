#!/usr/bin/env node
// Builds the register of the architecture decisions (ADR) of a project from its ADR pages, and fills the
// header of each page. The pages stay the source of truth: one HTML page per decision, its metadata in
// <meta> tags (skill livrable-adr, template skills/livrable-adr/template-adr.html of the plugin).
//
// Usage: node team/scripts/adr-pages.mjs [<project dir> | docs | docs/adr] [--check]   (default: the current directory)
//   --check   writes nothing; exit code 1 on an error or if a generated part would change
//             (check-livrable.mjs runs it on a docs folder that holds ADR pages)
//
// Reads
//   adr/NNNN-<slug>.html     <meta name="id"> (ADR-NNNN), "titre", "statut" (propose | accepte | remplace |
//                            abandonne), "date" (AAAA-MM-JJ), "remplace" (ADR-xxxx it replaces), "repond_a"
//                            (Q-xxx), "ecart_socle" (oui | non)
//   questions.html, 20-specs, 20-ux, 00-cadrage, 30-conception
//                            anchors and pages of the ids cited, to report an id left as bare text
//   index.html (portal)      project name
// Writes
//   adr/index.html           the register: one row per ADR (title, status, date, replaces, replaced by,
//                            deviation from the socle), counts by status in the header
//   adr/NNNN-<slug>.html     between <!-- gen:adr-meta --> and <!-- /gen --> in the header: status, date,
//                            replaces, replaced by (computed from the "remplace" of the other ADR), answers,
//                            deviation; a callout when the decision is replaced or a replacement is proposed
// Errors (exit 1): file name or id, unknown status, invalid date, unknown ADR replaced, status "remplace"
// without an accepted ADR that replaces it, accepted ADR whose replaced ADR is not "remplace", h1 that
// differs from the title, mandatory section missing, no rejected option, consequences without positive or
// negative, missing gen:adr-meta block. Warnings: section without its "i", id cited as bare text while its
// target exists, Q-xxx absent from questions.html, ADR still in Markdown, no "Suites".
// Idempotent: a second run changes nothing.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const arg = args.find((a) => !a.startsWith('--')) ?? '.';
if ( !existsSync(arg) || !statSync(arg).isDirectory()) {
  console.error('Usage: adr-pages.mjs [<project dir> | docs | docs/adr] [--check]'); process.exit(2);
}
// A project dir (it holds docs/) stands for its docs/
const ADR = basename(resolve(arg)) === 'adr' ? resolve(arg)
  : existsSync(join(arg, 'docs', 'adr')) ? join(resolve(arg), 'docs', 'adr') : join(resolve(arg), 'adr');
const DOCS = resolve(ADR, '..');
if (!existsSync(ADR)) { console.log('adr-pages : pas de dossier adr/, rien à faire'); process.exit(0); }

let errors = 0, warnings = 0;
const err = (m) => { errors++; console.error(`ERROR ${m}`); };
const warn = (m) => { warnings++; console.error(`warn ${m}`); };
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const read = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : '');
const strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

const STATUS = {
  propose: { label: 'proposé', tag: 'warn' },
  accepte: { label: 'accepté', tag: 'ok' },
  remplace: { label: 'remplacé', tag: '' },
  abandonne: { label: 'abandonné', tag: '' },
};
const statusTag = (s) => `<span class="tag${STATUS[s].tag ? ' ' + STATUS[s].tag : ''}">${STATUS[s].label}</span>`;
const frDate = (d) => d.split('-').reverse().join('.');
const SECTIONS = ['Écart au socle', 'Contexte', 'Décision', 'Raison', 'Conséquences'];

// ---------- ADR pages ----------
const files = readdirSync(ADR).sort();
files.filter((f) => /^\d{4}-.*\.md$/.test(f)).forEach((f) => warn(`adr/${f} : ADR en Markdown, à convertir en page HTML (skill livrable-adr)`));
if (files.includes('README.md')) warn('adr/README.md : index en Markdown, remplacé par le registre adr/index.html généré');
const pages = files.filter((f) => f.endsWith('.html') && f !== 'index.html');
if (!pages.length) { console.log('adr-pages : aucune page ADR en HTML, registre non généré'); process.exit(errors ? 1 : 0); }

const metaOf = (html, name) => ((html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`)) || [])[1] ?? null);
const list = (v) => (v || '').split(/[\s,]+/).filter(Boolean);
const adrs = pages.map((file) => {
  const html = read(join(ADR, file));
  const m = file.match(/^(\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*\.html$/);
  if (!m) err(`adr/${file} : nom attendu NNNN-<slug-en-kebab>.html`);
  const a = {
    file, html, num: m ? m[1] : file.slice(0, 4),
    id: metaOf(html, 'id'), titre: metaOf(html, 'titre'), statut: metaOf(html, 'statut'), date: metaOf(html, 'date'),
    remplace: list(metaOf(html, 'remplace')), repond: list(metaOf(html, 'repond_a')), ecart: metaOf(html, 'ecart_socle'),
  };
  const where = `adr/${file}`;
  if (a.id !== `ADR-${a.num}`) err(`${where} : meta id « ${a.id ?? ''} », attendu ADR-${a.num}`);
  if (!a.titre) err(`${where} : meta titre absente`);
  if (!STATUS[a.statut]) { err(`${where} : meta statut « ${a.statut ?? ''} », attendu ${Object.keys(STATUS).join(' | ')}`); a.statut = 'propose'; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.date || '') || isNaN(Date.parse(a.date))) { err(`${where} : meta date « ${a.date ?? ''} », attendu AAAA-MM-JJ`); a.date = a.date || ''; }
  if (!['oui', 'non'].includes(a.ecart)) err(`${where} : meta ecart_socle « ${a.ecart ?? ''} », attendu oui | non`);
  a.repond.forEach((q) => { if (!/^Q-\d{3}$/.test(q)) err(`${where} : repond_a « ${q} », attendu Q-xxx`); });
  // h1: "ADR-NNNN : titre"
  const h1 = strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '');
  if (a.titre && h1 !== `${a.id} : ${a.titre}`) err(`${where} : titre du h1 « ${h1} » différent de meta titre « ${a.titre} »`);
  if (!/<!-- gen:adr-meta -->[\s\S]*?<!-- \/gen -->/.test(html)) err(`${where} : bloc <!-- gen:adr-meta --><!-- /gen --> absent de l'en-tête`);
  // Sections of the format, each with its "i"
  const sections = [...html.matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/g)].map(([, body]) => ({
    title: strip((body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || ''), body,
  }));
  SECTIONS.forEach((t) => { if (!sections.some((s) => s.title === t)) err(`${where} : section « ${t} » absente`); });
  sections.filter((s) => !/<h2[^>]*>[\s\S]*?<\/h2>\s*<div class="info-body" hidden>/.test(s.body)).forEach((s) => warn(`${where} : section « ${s.title} » sans (i)`));
  const raison = sections.find((s) => s.title === 'Raison');
  if (raison && !/<table class="options">[\s\S]*?<tbody>\s*<tr/.test(raison.body)) err(`${where} : « Raison » sans tableau des options écartées (table.options)`);
  const csq = sections.find((s) => s.title === 'Conséquences');
  if (csq) {
    const terms = [...csq.body.replace(/<div class="info-body"[\s\S]*?<\/div>/, '').matchAll(/<dt>([\s\S]*?)<\/dt>/g)].map(([, t]) => strip(t));
    ['Positif', 'Négatif'].forEach((t) => { if (!terms.includes(t)) err(`${where} : « Conséquences » sans « ${t} »`); });
    if (!terms.includes('Suites')) warn(`${where} : « Conséquences » sans « Suites »`);
  }
  return a;
});
const byId = new Map();
adrs.forEach((a) => { if (byId.has(a.id)) err(`adr/${a.file} : ${a.id} déjà pris par adr/${byId.get(a.id).file}`); else byId.set(a.id, a); });

// ---------- Replacement: "remplace" is written once, in the new ADR; "remplacé par" is computed ----------
adrs.forEach((a) => { a.par = []; a.parPropose = []; });
adrs.forEach((a) => a.remplace.forEach((id) => {
  const old = byId.get(id);
  if (!old || id === a.id) { err(`adr/${a.file} : remplace ${id}, ADR inconnu`); return; }
  // A replacer that is itself replaced later (chain A -> B -> C) still replaces its predecessor.
  if (a.statut === 'accepte' || a.statut === 'remplace') {
    old.par.push(a);
    if (a.statut === 'accepte' && old.statut !== 'remplace') err(`adr/${old.file} : remplacé par ${a.id} (accepté), son statut doit passer à remplace`);
  } else if (a.statut === 'propose') old.parPropose.push(a);
}));
adrs.filter((a) => a.statut === 'remplace' && !a.par.length).forEach((a) => err(`adr/${a.file} : statut remplace sans ADR accepté (ou remplacé depuis) qui le remplace (meta remplace)`));

// ---------- Links ----------
const anchorCache = new Map();
const anchors = (f) => {
  if (!anchorCache.has(f)) anchorCache.set(f, new Set([...read(f).matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])));
  return anchorCache.get(f);
};
const P = {
  questions: join(DOCS, 'questions.html'),
  fonc: join(DOCS, '20-specs', 'conception-fonctionnelle.html'),
  cadrage: join(DOCS, '00-cadrage', 'cadrage.html'),
  ux: join(DOCS, '20-ux', 'spec-ux-ui.html'),
  macro: join(DOCS, '30-conception', 'macro.html'),
  det: join(DOCS, '30-conception', 'detaillee'),
};
const fileIn = (dir, id) => (existsSync(dir) ? readdirSync(dir).find((f) => f === `${id}.html` || f.startsWith(`${id}-`)) : null);
// Is there a place where this id is defined? (team/glossaire.md, part 1)
const hasTarget = (id) => {
  if (/^ADR-/.test(id)) return byId.has(id);
  if (/^Q-/.test(id)) return anchors(P.questions).has(id);
  if (/^(RG|PF|CALC|MSG)-\d/.test(id)) return anchors(P.fonc).has(id) || anchors(P.cadrage).has(id);
  if (/^(EC|MSG-U)/.test(id)) return anchors(P.ux).has(id);
  if (/^PER-/.test(id)) return anchors(P.cadrage).has(id);
  if (/^EP-/.test(id)) return !!fileIn(join(P.det, 'endpoints'), id) || anchors(P.macro).has(id);
  if (/^EN-/.test(id)) return !!fileIn(join(P.det, 'entites'), id) || anchors(P.macro).has(id);
  if (/^TR-/.test(id)) return !!fileIn(join(P.det, 'traitements'), id) || anchors(P.macro).has(id);
  if (/^CF-/.test(id)) {
    // A project invariant has its row; a stack or design system one taken by reference targets its section.
    const f = join(P.det, 'transverse', 'conformite.html');
    if (!existsSync(f)) return false;
    const n = Number(id.slice(3));
    return anchors(f).has(id) || (n < 50 && anchors(f).has('socle-de-stack')) || (n >= 70 && n < 80 && anchors(f).has('design-system'));
  }
  if (/^US-/.test(id)) return !!fileIn(join(DOCS, '20-specs', 'stories'), id);
  if (/^EPIC-/.test(id)) return !!fileIn(join(DOCS, '20-specs', 'epics'), id);
  return false;
};
const ID_RE = /\b(?:ADR-\d{4}|Q-\d{3}|MSG-U\d+|(?:RG|PF|CALC|MSG|EC|EP|EN|TR|CF|PER|US|EPIC)-\d+)\b/g;
adrs.forEach((a) => {
  const body = (a.html.match(/<body>([\s\S]*)<\/body>/) || [])[1] || '';
  const visible = body.replace(/<!-- gen:adr-meta -->[\s\S]*?<!-- \/gen -->/, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<div class="info-body"[\s\S]*?<\/div>/g, ' ').replace(/<h1[\s\S]*?<\/h1>/, ' ')
    .replace(/<a\b[\s\S]*?<\/a>/g, ' ').replace(/<(script|style|code|pre)\b[\s\S]*?<\/\1>/g, ' ');
  const bare = [...new Set(strip(visible).match(ID_RE) || [])].filter((id) => id !== a.id && hasTarget(id));
  if (bare.length) warn(`adr/${a.file} : identifiants cités sans lien : ${bare.join(', ')}`);
  a.repond.filter((q) => !anchors(P.questions).has(q)).forEach((q) => warn(`adr/${a.file} : ${q} absente de questions.html, citée sans lien`));
});
const adrLink = (b) => `<a href="${b.file}">${b.id}</a>`;
const qLink = (q) => (anchors(P.questions).has(q) ? `<a class="qmark" href="../questions.html#${q}">${q}</a>` : q);
const ecartTag = (e) => (e === 'oui' ? '<span class="tag danger">oui</span>' : '<span class="tag ok">non</span>');
const links = (l, none) => (l.length ? l.map(adrLink).join(', ') : `<span class="none">${none}</span>`);

// ---------- Header of each ADR page ----------
const header = (a) => {
  const out = [`<div class="meta">
        <span><b>Statut</b> ${statusTag(a.statut)}</span>
        <span><b>Date</b> ${esc(frDate(a.date))}</span>
        <span><b>Remplace</b> ${links(a.remplace.map((id) => byId.get(id)).filter(Boolean), 'aucun')}</span>
        <span><b>Remplacé par</b> ${links(a.par, 'aucun')}</span>
        <span><b>Répond à</b> ${a.repond.length ? a.repond.map(qLink).join(', ') : '<span class="none">aucune question</span>'}</span>
        <span><b>Écart au socle</b> ${ecartTag(a.ecart)}</span>
      </div>`];
  if (a.par.length) out.push(`<div class="callout warn"><b>Remplacé</b>Cette décision ne s'applique plus : voir ${a.par.map(adrLink).join(', ')}.</div>`);
  if (a.parPropose.length) out.push(`<div class="callout warn"><b>Remplacement proposé</b>${a.parPropose.map(adrLink).join(', ')} propose de remplacer cette décision ; elle s'applique jusqu'à son acceptation.</div>`);
  if (a.statut === 'abandonne') out.push('<div class="callout warn"><b>Abandonné</b>Cette proposition n\'a pas été retenue : elle ne s\'applique pas.</div>');
  return `<!-- gen:adr-meta -->\n      ${out.join('\n      ')}\n      <!-- /gen -->`;
};

// ---------- Register ----------
const portal = read(join(DOCS, 'index.html'));
const project = ((portal.match(/<div class="toc-project">([^<]+)<\/div>/) || portal.match(/<h1>[\s\S]*?<\/span>\s*:\s*([^<]+)<\/h1>/) || [])[1] || basename(resolve(DOCS, '..'))).trim();
const sorted = [...adrs].sort((x, y) => x.num.localeCompare(y.num));
const count = (s) => adrs.filter((a) => a.statut === s).length;
const last = sorted.map((a) => a.date).filter(Boolean).sort().pop() || '';
const toValidate = adrs.filter((a) => a.statut === 'propose' && a.ecart === 'oui').length;
const row = (a) => `          <tr id="${a.id}"><td data-sort-value="${a.num}">${adrLink(a)}</td><td>${esc(a.titre)}</td><td data-sort-value="${Object.keys(STATUS).indexOf(a.statut)}">${statusTag(a.statut)}</td><td data-sort-value="${esc(a.date)}">${esc(frDate(a.date))}</td><td>${links(a.remplace.map((id) => byId.get(id)).filter(Boolean), 'aucun')}</td><td>${links(a.par, 'aucun')}${a.parPropose.length ? ` <span class="tag warn">proposé</span> ${a.parPropose.map(adrLink).join(', ')}` : ''}</td><td>${a.repond.length ? a.repond.map(qLink).join(', ') : '<span class="none">aucune</span>'}</td><td data-sort-value="${a.ecart}">${ecartTag(a.ecart)}</td></tr>`;
const index = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Décisions d'architecture · ${esc(project)}</title>
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
    <div class="toc-type">Décisions d'architecture</div>
    <nav></nav>
    <div class="toc-back"><a href="../30-conception/macro.html">← Conception technique macro</a><br><a href="../index.html">← Pilotage du projet</a></div>
  </aside>
  <main class="doc-main wide">
    <header class="doc-header">
      <div class="kicker">Architecte · Décisions d'architecture</div>
      <h1><span class="doc-kind">Registre des ADR</span> : ${esc(project)}</h1>
      <p class="lede">Les décisions d'architecture du projet, une page par décision. Une décision acceptée ne se réécrit pas : une nouvelle décision la remplace.</p>
      <div class="meta">
        <span><b>Proposés</b> ${count('propose')}</span>
        <span><b>Acceptés</b> ${count('accepte')}</span>
        <span><b>Remplacés</b> ${count('remplace')}</span>
        <span><b>Abandonnés</b> ${count('abandonne')}</span>
        <span><b>Écarts au socle à valider</b> ${toValidate}</span>
        <span><b>Dernière décision</b> ${esc(frDate(last))}</span>
      </div>
    </header>
    <section class="section">
      <h2>Registre</h2>
      <div class="info-body" hidden>
        <dl class="defs">
          <dt>À quoi sert</dt><dd>Retrouver chaque décision d'architecture et savoir si elle s'applique.</dd>
          <dt>Contenu</dt><dd>Une ligne par ADR : titre, statut, date, ce qu'il remplace et ce qui le remplace, question à laquelle il répond, écart au socle de stack.</dd>
          <dt>Pourquoi ce formalisme</dt><dd>Le registre d'ADR, tableau triable ; calculé depuis les pages, il ne diverge jamais d'elles.</dd>
          <dt>Lire</dt><dd><ul><li>${statusTag('propose')} en attente : un écart au socle remonte à l'humain par le PO.</li><li>${statusTag('accepte')} s'applique.</li><li>${statusTag('remplace')} ne s'applique plus, voir la colonne « Remplacé par ».</li><li>${statusTag('abandonne')} proposition non retenue.</li></ul></dd>
          <dt>Source</dt><dd>Les balises <code>meta</code> des pages <code>adr/NNNN-&lt;slug&gt;.html</code>, lues par <code>team/scripts/adr-pages.mjs</code> ; « Remplacé par » se calcule depuis la balise <code>remplace</code> de la décision qui remplace.</dd>
        </dl>
      </div>
      <table data-sortable>
        <thead><tr><th>Id</th><th style="width:34%">Titre</th><th>Statut</th><th>Date</th><th>Remplace</th><th>Remplacé par</th><th>Répond à</th><th>Écart au socle</th></tr></thead>
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
if (errors && !CHECK) console.error('erreurs : aucune page écrite, corriger puis relancer');
else outputs.forEach(([f, content]) => {
  if (read(f) === content) return;
  if (CHECK) { drift++; console.log(`would update ${f.slice(DOCS.length + 1)}`); } else writeFileSync(f, content);
});
console.log(`adr-pages : ${adrs.length} ADR (${Object.keys(STATUS).map((s) => `${count(s)} ${STATUS[s].label}`).join(', ')}), ${errors} erreur(s), ${warnings} avertissement(s)${CHECK ? (drift ? `, ${drift} fichier(s) à régénérer` : ', à jour') : ''}`);
process.exit(errors || (CHECK && drift) ? 1 : 0);
