#!/usr/bin/env node
// Builds docs/questions.html from the question files of a project (.team/questions/Q-xxx-<slug>.md).
// The files stay the source of truth (one file per question, so agents never overwrite each other);
// the page is what deliverables link to: questions.html#Q-005.
// Usage: node team/scripts/questions-page.mjs [<project dir>]   (default: the current directory)
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { projectLang, loadLabels, makeT, formatDate } from './lib/i18n.mjs';

const root = process.argv[2] ?? '.';
if (!existsSync(join(root, '.team/questions'))) {
  console.error('Usage: questions-page.mjs [<project dir>]'); process.exit(2);
}
const docs = join(root, 'docs');
// Labels in the project language (team/conventions/language.md)
const lang = projectLang(root);
const t = makeT(lang, loadLabels(root, ['questions'], lang));
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Project name, from the steering page docs/index.html (toc-project), else the name of the project folder
const portal = existsSync(join(docs, 'index.html')) ? readFileSync(join(docs, 'index.html'), 'utf8') : '';
const project = ((portal.match(/<div class="toc-project">([^<]+)<\/div>/) || [])[1] || basename(root)).trim();

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
  let cur = { title: t('questions.part.question'), lines: [] };
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
  if (/^(BR|FL|MSG|CALC)-/.test(id)) {
    if (has('20-specs/functional-design.html', id)) return `20-specs/functional-design.html#${id}`;
    if (has('00-framing/framing.html', id)) return `00-framing/framing.html#${id}`;
  }
  if (/^US-/.test(id)) return firstFile('20-specs/stories', id);
  if (/^EPIC-/.test(id)) return firstFile('20-specs/epics', id);
  if (/^SCR-/.test(id) && existsSync(join(docs, '20-ux/ux-ui-spec.html'))) return `20-ux/ux-ui-spec.html#${id}`;
  return null;
};
const ref = (id) => { const t = target(id); return t ? `<a href="${t}">${esc(id)}</a>` : esc(id); };

const qs = readdirSync(join(root, '.team/questions')).filter((f) => /^Q-\d+.*\.md$/.test(f)).sort().map((f) => {
  const { meta, body } = parse(readFileSync(join(root, '.team/questions', f), 'utf8'));
  return { file: f, id: meta.id || f.match(/^(Q-\d+)/)[1], meta, parts: sections(body) };
});

// Status code (front matter status) -> tag class; it is also the code of its section. Group heading and tag
// label come from the dictionary
const STATUS = { open: 'warn', raised: 'danger', answered: 'ok' };
const statusOf = (q) => q.meta.status || 'open';
// The answer part: its heading is written in the project language, so the answer is the last part of an
// answered question (forum.md order)
const isAnswer = (q, i) => statusOf(q) === 'answered' && i > 0 && i === q.parts.length - 1;
const card = (q) => {
  const s = statusOf(q);
  const tags = [`<span class="tag ${STATUS[s] || STATUS.open}">${esc(STATUS[s] ? t(`questions.status.${s}`) : s)}</span>`];
  if (q.meta.blocking === 'yes') tags.push(`<span class="tag danger">${t('questions.blocking')}</span>`);
  const meta = [];
  if (q.meta.from) meta.push(`<span><b>${t('questions.field.from')}</b> ${esc(q.meta.from)}</span>`);
  if (q.meta.target) meta.push(`<span><b>${t('questions.field.for')}</b> ${esc(q.meta.target)}</span>`);
  if ((q.meta.linked_to || []).length) meta.push(`<span><b>${t('questions.field.linked')}</b> ${q.meta.linked_to.map(ref).join(', ')}</span>`);
  meta.push(`<span><b>${t('questions.field.file')}</b> <code>.team/questions/${esc(q.file)}</code></span>`);
  const parts = q.parts.map((p, i) => `<div class="q-part${isAnswer(q, i) ? ' answer' : ''}"><h4>${esc(p.title)}</h4>${md(p.lines)}</div>`).join('');
  return `<article class="q-card" id="${esc(q.id)}"><header><span class="q-id">${esc(q.id)}</span>${tags.join('')}</header>
  <div class="meta">${meta.join('')}</div>${parts}</article>`;
};

const groups = Object.keys(STATUS).map((s) => [s, qs.filter((q) => statusOf(q) === s)]).filter(([, l]) => l.length);
const count = (s) => qs.filter((q) => statusOf(q) === s).length;
const todayIso = new Date().toISOString().slice(0, 10);

const html = `<!doctype html>
<html lang="${esc(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${t('questions.title')} · ${esc(project)}</title>
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
    <div class="toc-type">${t('questions.toc-type')}</div>
    <nav></nav>
    <div class="toc-back"><a href="index.html">${t('questions.back.portal')}</a></div>
  </aside>
  <main class="doc-main">
    <header class="doc-header">
      <div class="kicker">${t('questions.kicker')}</div>
      <h1>${t('questions.heading', { kind: `<span class="doc-kind">${t('questions.kind')}</span>`, title: esc(project) })}</h1>
      <p class="lede">${t('questions.lede')}</p>
      <div class="meta">
        <span><b>${t('questions.meta.open')}</b> ${count('open')}</span>
        <span><b>${t('questions.meta.raised')}</b> ${count('raised')}</span>
        <span><b>${t('questions.meta.answered')}</b> ${count('answered')}</span>
        <span><b>${t('questions.meta.blocking-open')}</b> ${qs.filter((q) => q.meta.blocking === 'yes' && statusOf(q) !== 'answered').length}</span>
        <span><b>${t('questions.meta.generated')}</b> <time datetime="${todayIso}">${formatDate(todayIso, lang)}</time></span>
      </div>
    </header>
${groups.length ? groups.map(([s, l]) => `    <section class="section" data-section="${s}">
      <h2>${t(`questions.group.${s}`)}</h2>
      ${l.map(card).join('\n      ')}
    </section>`).join('\n') : `    <section class="section"><h2>${t('questions.none.title')}</h2><p>${t('questions.none.text')}</p></section>`}
  </main>
</div>
<script src="_assets/doc.js"></script>
</body>
</html>
`;
writeFileSync(join(docs, 'questions.html'), html);
console.log(`docs/questions.html: ${qs.length} question(s)`);
if (t.missing.size) console.error(`missing labels: ${[...t.missing].join(', ')}`);
