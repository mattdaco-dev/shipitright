#!/usr/bin/env node
// Maintenance of the plugin, not of a project: rewrites the French labels embedded in team/assets/doc.js
// (namespaces common, doc, gherkin) and team/assets/plan.js (plan) from team/i18n/fr/*.json. They are used
// by the pages of a project older than 0.4.0, which has no docs/_assets/i18n.js (team/conventions/langue.md).
// It also checks that team/i18n/fr and team/i18n/en hold the same keys.
// Usage: node team/scripts/i18n-fallback.mjs [--check]   --check: exit code 1 if a copy has drifted, no write.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const fr = (ns) => JSON.parse(readFileSync(join(root, 'team', 'i18n', 'fr', `${ns}.json`), 'utf8'));
const entries = (namespaces) => namespaces.flatMap((ns) => Object.entries(fr(ns)).map(([k, v]) => `    ${JSON.stringify(`${ns}.${k}`)}: ${JSON.stringify(v)}`)).join(',\n') + ',';
const TARGETS = [
  { file: 'team/assets/doc.js', open: '  const FALLBACK = {\n', close: '\n  };', namespaces: ['common', 'doc', 'gherkin'] },
  { file: 'team/assets/plan.js', open: '  I.addFallback({\n', close: '\n  });', namespaces: ['plan'] },
];
const check = process.argv.includes('--check');
let drift = false;
for (const { file, open, close, namespaces } of TARGETS) {
  const path = join(root, file), src = readFileSync(path, 'utf8');
  const a = src.indexOf(open), b = a < 0 ? -1 : src.indexOf(close, a + open.length);
  if (a < 0 || b < 0) { console.error(`i18n-fallback: block not found in ${file}`); process.exit(2); }
  const out = src.slice(0, a + open.length) + entries(namespaces) + src.slice(b);
  if (out === src) { console.log(`up to date: ${file}`); continue; }
  drift = true;
  if (check) console.error(`i18n-fallback: ${file} differs from team/i18n/fr, run node team/scripts/i18n-fallback.mjs`);
  else { writeFileSync(path, out); console.log(`written: ${file}`); }
}
// fr and en must hold the same keys: en is the fallback of every other language
let keysOk = true;
for (const f of readdirSync(join(root, 'team', 'i18n', 'fr'))) {
  const ns = f.replace(/\.json$/, '');
  const read = (l) => { try { return Object.keys(JSON.parse(readFileSync(join(root, 'team', 'i18n', l, f), 'utf8'))); } catch { return null; } };
  const a = read('fr'), b = read('en');
  if (!b) { console.error(`i18n-fallback: team/i18n/en/${f} missing`); keysOk = false; continue; }
  const OPTIONAL = ['common.date.short']; // en has none: Intl decides
  const onlyFr = a.filter((k) => !b.includes(k) && !OPTIONAL.includes(`${ns}.${k}`)), onlyEn = b.filter((k) => !a.includes(k));
  if (onlyFr.length) { console.error(`i18n-fallback: ${ns}, keys missing in en: ${onlyFr.join(', ')}`); keysOk = false; }
  if (onlyEn.length) { console.error(`i18n-fallback: ${ns}, keys missing in fr: ${onlyEn.join(', ')}`); keysOk = false; }
}
process.exit((check && drift) || !keysOk ? 1 : 0);
