#!/usr/bin/env node
// Writes docs/_assets/i18n.js (labels of doc.js and plan.js in the project language), see
// team/conventions/language.md. Usage: node i18n-assets.mjs [<project dir>]   (default: the current directory)
// --check: exit code 1 if the file is missing or out of date, without writing.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeClientI18n, projectLang, loadLabels, CLIENT_NAMESPACES } from './lib/i18n.mjs';

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--')) ?? '.';
if (!existsSync(join(dir, 'docs'))) { console.error(`i18n-assets: ${dir}/docs not found`); process.exit(1); }
if (args.includes('--check')) {
  const file = join(dir, 'docs', '_assets', 'i18n.js');
  const lang = projectLang(dir);
  const want = JSON.stringify({ lang, labels: loadLabels(dir, CLIENT_NAMESPACES, lang) }, null, 1);
  const ok = existsSync(file) && readFileSync(file, 'utf8').includes(want);
  if (!ok) { console.error(`i18n-assets: ${file} missing or out of date, run i18n-assets.mjs`); process.exit(1); }
} else {
  const { file, changed } = writeClientI18n(dir);
  console.log(`${changed ? 'written' : 'up to date'}: ${file}`);
}
