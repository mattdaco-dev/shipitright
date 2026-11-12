#!/usr/bin/env node
// Builds docs/questions.html from the question files of a project (.team/questions/Q-xxx-<slug>.md).
// The files stay the source of truth (one file per question, so agents never overwrite each other);
// the page is what deliverables link to: questions.html#Q-005.
// Usage: node team/scripts/questions-page.mjs [<project dir>]   (default: the current directory)
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const root = process.argv[2] ?? '.';
if ( !existsSync(join(root, '.team/questions'))) {
  console.error('Usage: questions-page.mjs [<project dir>]'); process.exit(2);
}
const docs = join(root, 'docs');
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Project name, from the steering page docs/index.html (toc-project), else from an old portal title "Portail : Name"
const portal = existsSync(join(docs, 'index.html')) ? readFileSync(join(docs, 'index.html'), 'utf8') : '';
const project = ((portal.match(/<div class="toc-project">([^<]+)<\/div>/) || portal.match(/<h1>[\s\S]*?<\/span>\s*:\s*([^<]+)<\/h1>/) || [])[1] || basename(root)).trim();

// Minimal front matter: "key: value  # comment", lists as [a, b]
const parse = (src) => {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta = {};
  if (!m) return { meta, body: src };
  m[1].split('\n').forEach((line) => {
    const kv = line.match(/^(\w+):\s*(.*?)\s*(#.*)?$/);
    if (!kv) return;
    const v = kv[2];
    meta[kv[1]] = v.startsWith('[') ? v.replace(/[[\]]/g, '').split(',').map((x) => x.trim()).filter(Boolean) : v;
  });
  return { meta, body: m[2] };
};

// Body: "## Title" sections, or a single block when the file has none
const sections = (body) => {
  const out = [];
  let cur = { title: 'Question', lines: [] };
  body.split('\n').forEach((l) => {
    const h = l.match(/^##\s+(.*)$/);
    if (h) { if (cur.lines.join('').trim()) out.push(cur); cur = { title: h[1].trim(), lines: [] }; } else cur.lines.push(l);
  });
  if (cur.lines.join('').trim()) out.push(cur);
  return out;
};
const inline = (t) => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
const md = (lines) => lines.join('\n').trim().split(/\n\s*\n/).map((p) => {
  const items = p.split('\n').filter((l) => /^\s*[-*]\s+/.test(l));
  if (items.length && items.length === p.split('\n').length) return '<ul>' + items.map((l) => '<li>' + inline(l.replace(/^\s*[-*]\s+/, '')) + '</li>').join('') + '</ul>';
  return '<p>' + inline(p.replace(/\n/g, ' ')) + '</p>';
}).join('');

// Where an identifier is defined, seen from docs/
const firstFile = (dir, id) => {
  const d = join(docs, dir);
  if (!existsSync(d)) return null;
  const f = readdirSync(d).find((x) => x.startsWith(id + '-') || x === id + '.html');
  return f ? `${dir}/${f}` : null;
};
const has = (file, id) => existsSync(join(docs, file)) && readFileSync(join(docs, file), 'utf8').includes(`id="${id}"`);
const target = (id) => {
  if (/^(RG|PF|MSG|CALC)-/.test(id)) {
    if (has('20-specs/conception-fonctionnelle.html', id)) return `20-specs/conception-fonctionnelle.html#${id}`;
    if (has('00-cadrage/cadrage.html', id)) return `00-cadrage/cadrage.html#${id}`;
  }
  if (/^US-/.test(id)) return firstFile('20-specs/stories', id);
  if (/^EPIC-/.test(id)) return firstFile('20-specs/epics', id);
  if (/^EC-/.test(id) && existsSync(join(docs, '20-ux/spec-ux-ui.html'))) return `20-ux/spec-ux-ui.html#${id}`;
  return null;
};
const ref = (id) => { const t = target(id); return t ? `<a href="${t}">${esc(id)}</a>` : esc(id); };

const qs = readdirSync(join(root, '.team/questions')).filter((f) => /^Q-\d+.*\.md$/.test(f)).sort().map((f) => {
  const { meta, body } = parse(readFileSync(join(root, '.team/questions', f), 'utf8'));
  return { file: f, id: meta.id || f.match(/^(Q-\d+)/)[1], meta, parts: sections(body) };
});

const STATUS = { ouverte: ['Ouvertes', 'warn'], remontee: ["Remontées à l'humain", 'danger'], repondue: ['Répondues', 'ok'] };
const card = (q) => {
  const s = q.meta.statut || 'ouverte';
  const tags = [`<span class="tag ${(STATUS[s] || STATUS.ouverte)[1]}">${esc(s)}</span>`];
  if (q.meta.bloquant === 'oui') tags.push('<span class="tag danger">bloquante</span>');
  const meta = [];
  if (q.meta.de) meta.push(`<span><b>De</b> ${esc(q.meta.de)}</span>`);
  if (q.meta.pour) meta.push(`<span><b>Pour</b> ${esc(q.meta.pour)}</span>`);
  if ((q.meta.lie_a || []).length) meta.push(`<span><b>Lié à</b> ${q.meta.lie_a.map(ref).join(', ')}</span>`);
  meta.push(`<span><b>Fichier</b> <code>.team/questions/${esc(q.file)}</code></span>`);
  const parts = q.parts.map((p) => `<div class="q-part${/réponse/i.test(p.title) ? ' answer' : ''}"><h4>${esc(p.title)}</h4>${md(p.lines)}</div>`).join('');
  return `<article class="q-card" id="${esc(q.id)}"><header><span class="q-id">${esc(q.id)}</span>${tags.join('')}</header>
  <div class="meta">${meta.join('')}</div>${parts}</article>`;
};

const groups = Object.keys(STATUS).map((s) => [s, qs.filter((q) => (q.meta.statut || 'ouverte') === s)]).filter(([, l]) => l.length);
const count = (s) => qs.filter((q) => (q.meta.statut || 'ouverte') === s).length;
const today = new Date().toLocaleDateString('fr-FR').replace(/\//g, '.');

const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Questions · ${esc(project)}</title>
  <link rel="icon" href="data:,">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="_assets/doc.css">
</head>
<body>
<!-- Generated by team/scripts/questions-page.mjs from .team/questions/. Do not edit: edit the question file, then regenerate. -->
<div class="doc">
  <aside class="doc-toc">
    <div class="toc-project">${esc(project)}</div>
    <div class="toc-type">Questions</div>
    <nav></nav>
    <div class="toc-back"><a href="index.html">← Pilotage du projet</a></div>
  </aside>
  <main class="doc-main">
    <header class="doc-header">
      <div class="kicker">Suivi</div>
      <h1><span class="doc-kind">Questions</span> : ${esc(project)}</h1>
      <p class="lede">Les questions métier posées au PO par la team, et leur réponse. Chaque question vit dans son fichier de <code>.team/questions/</code> ; cette page les rassemble.</p>
      <div class="meta">
        <span><b>Ouvertes</b> ${count('ouverte')}</span>
        <span><b>Remontées</b> ${count('remontee')}</span>
        <span><b>Répondues</b> ${count('repondue')}</span>
        <span><b>Bloquantes ouvertes</b> ${qs.filter((q) => q.meta.bloquant === 'oui' && q.meta.statut !== 'repondue').length}</span>
        <span><b>Générée le</b> ${today}</span>
      </div>
    </header>
${groups.length ? groups.map(([s, l]) => `    <section class="section">
      <h2>${STATUS[s][0]}</h2>
      ${l.map(card).join('\n      ')}
    </section>`).join('\n') : '    <section class="section"><h2>Aucune question</h2><p>Aucune question posée pour l\'instant.</p></section>'}
  </main>
</div>
<script src="_assets/doc.js"></script>
</body>
</html>
`;
writeFileSync(join(docs, 'questions.html'), html);
console.log(`docs/questions.html : ${qs.length} question(s)`);
