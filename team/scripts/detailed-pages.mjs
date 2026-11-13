#!/usr/bin/env node
// Generates the detailed technical design pages from the API contract, the single source of truth.
//
// Usage: node team/scripts/detailed-pages.mjs [<project dir> | docs | docs/30-design] [--stories <dir>] [--check]
//   (default: the current directory; a project dir or a docs/ stands for its 30-design/)
//   <docs/30-design>      folder that holds api/openapi.yaml, macro.html and detailed/
//   --stories <dir>       stories whose <!-- gen:story-tech --> block is filled (default: docs/20-specs/stories)
//   --check               writes nothing; exit code 1 on an error or if a generated file would change
//                         (check-deliverable.mjs runs it on a docs folder that holds the contract)
// Dependency: the "yaml" package (package.json at the plugin root, installed with the plugin; for a
// development checkout, run `npm install` at the plugin root once).
// Lint of the contract, from the project root (Redocly resolves the external $ref too):
//   npx @redocly/cli@2.58.2 lint docs/30-design/api/openapi.yaml
//
// Reads
//   api/openapi.yaml                    root of the contract: info (version, x-changelog), tags, paths and
//                                       the name of each component; the content is in paths/*.yaml and
//                                       components/**/*.yaml, joined by external $ref, resolved here. The
//                                       team's x- extensions and the requirement levels are listed at the
//                                       top of the root file
//   detailed/entities/EN-xx.html        hand-written entity pages: <meta name="name">, "release", "module",
//                                       "tables", "rules"; the transitions table (table.transitions) of the
//                                       state machine
//   detailed/processes/PROC-xx.html     hand-written process pages: <meta name="name">, "release", "module",
//                                       "entities" ("EN-05:CU EN-03:R", CRUD letters), "processes" (PROC-xx it
//                                       calls), "errors" (error codes it returns), "rules"
//   detailed/cross-cutting/code-organization.html
//                                       the backend modules (table.modules: module, content); every module
//                                       declared by x-module of an operation or meta module of a page is one
//                                       of them
//   detailed/cross-cutting/screens.html the per-screen structure (table.screen-details: screen, address and
//                                       parameters, what comes from another screen, accessible roles and
//                                       names), one row per screen of the macro, <tr id="structure-SCR-xx">
//   detailed/cross-cutting/compliance.html
//                                       the compliance contract: one row per invariant, <tr id="INV-xx">; an
//                                       INV-xx cited anywhere links to its row
//   any hand-written page               its open points: table.open-points in section#open-points, one
//                                       row per point (impact, subject, hypothesis, question)
//   macro.html                          screens and features that call each endpoint; consistency check
//   20-specs, 20-ux, questions.html     anchors of BR, FL, CALC, MSG, SCR, Q, to link and check the ids cited
//   ../adr/NNNN-<slug>.html             ADR pages (skill deliverable-adr), for links; a Markdown ADR
//                                       (NNNN-<slug>.md, former format) is linked while no page exists
// Writes (overwritten; files no longer produced are removed)
//   detailed/endpoints/EP-xx.html       one page per operation
//   detailed/schemas/<Schema>.html      one page per exchanged schema (an endpoint sends or receives it
//                                       directly)
//   detailed/schemas/index.html         exchanged schemas in cards by domain, shared types (one anchored
//                                       row each: #Day), version and changelog of the API contract
//   detailed/swagger.html               Swagger UI view, the bundled spec embedded so that it opens from
//                                       file:// (no fetch, no $ref left); deep links #/<tag>/<operationId>
//   detailed/open-points.html           the single view of the open points of the whole detailed design
//                                       (x-open of the operations, tables of the hand-written pages), by
//                                       impact, highest first
//   detailed/xref.js                    index read by doc.js: links from the macro cards to their pages,
//                                       schema icon on the endpoints
// Fills, between <!-- gen:NAME --> and <!-- /gen --> in hand-written pages, the computed lists:
//   entity-usage, state-diagram (EN page), process-usage (PROC page), summary-endpoints, crud-matrix,
//   api-version, open-summary, sitemap (summary: one card per page, no section anchors), rights-matrix,
//   error-catalog, screen-map, screens, code-modules (objects by backend module, from x-module and meta
//   module), story-tech (a story: endpoints, processes, entities and schemas from its <meta name="endpoints">).
// Rules of the format (skill deliverable-detailed-design): every section has its "i" (info-body), every
// id cited is a link, an open point is written once with its impact, no epic or story.
// Vocabulary: the API contract is the whole openapi.yaml; an operation of it is frozen or provisional
// (x-contract); a schema is exchanged (an endpoint sends or receives it directly, it has its page) or a
// shared type (used inside schemas, one row of the list). The domain of a schema is its file
// components/schemas/<domain>.yaml, labelled by the first line of that file: # domain: <label>. The error
// code schema is the one that carries x-error-catalog.
// Labels of the generated pages: team/i18n/<lang>/detailed.json, in the language of the project.
// Reports on stderr: errors (exit 1), warnings, and info lines (finer accesses than the macro). Errors:
// broken references, missing requirement of an operation (examples of a frozen one included), macro arrow
// absent from the detailed design, version without changelog entry, access declared via a process (x-entities
// via) outside the access that process declares. Warnings: macro and YAML that disagree, unknown or unused error codes,
// error code without its entity, ids cited and not found in their deliverable, schema shared by a frozen
// and a provisional operation, bare ids in hand-written pages, meta not read, section without its "i",
// hypothesis outside the open points, open points not sorted by impact, rule of an entity absent from its
// physical model, epic or story cited, caller of a process that does not declare the access it obtains.
// Idempotent: a second run changes nothing.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, unlinkSync, statSync } from 'node:fs';
import { join, dirname, relative, resolve, basename } from 'node:path';
import { projectLang, loadLabels, makeT, formatDate } from './lib/i18n.mjs';

let YAML;
try { YAML = await import('yaml'); } catch (e) {
  // Claude Code installs the plugin dependencies in its cache at install time; the installed plugin
  // is read-only, so the fix is a reinstall (or `npm install` in a development clone).
  console.error('Dependency "yaml" not found: the ShipItRight plugin is not installed properly. Reinstall it '
    + '(`claude plugin install shipitright@shipitright --scope project`); in a development clone '
    + '(`claude --plugin-dir`), run `npm install` at the root of the clone.');
  process.exit(2);
}

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const storiesArg = args.indexOf('--stories') >= 0 ? args[args.indexOf('--stories') + 1] : null;
const DIR = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--stories') ?? '.';
const CONC = existsSync(join(DIR, 'docs', '30-design')) ? resolve(DIR, 'docs', '30-design')
  : existsSync(join(DIR, '30-design')) ? resolve(DIR, '30-design') : resolve(DIR);
const DOCS = dirname(CONC);
const DET = join(CONC, 'detailed');
const API = join(CONC, 'api', 'openapi.yaml');
const STORIES = storiesArg ? resolve(storiesArg) : join(DOCS, '20-specs', 'stories');
const MARK = '<!-- Generated by team/scripts/detailed-pages.mjs from api/openapi.yaml: do not edit, run the script. -->';
const errors = [], warnings = [], infos = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m), info = (m) => infos.push(m);
if (!existsSync(API)) { console.error(`api/openapi.yaml not found in ${DIR}`); process.exit(2); }
// Project root: the first folder above 30-design that holds .team/, else the parent of docs/. Its
// language gives the labels of the generated pages (team/conventions/language.md).
const ROOT = (() => {
  for (let d = CONC; dirname(d) !== d; d = dirname(d)) if (existsSync(join(d, '.team'))) return d;
  return dirname(DOCS);
})();
const LANG = projectLang(ROOT);
const t = makeT(LANG, loadLabels(ROOT, ['detailed'], LANG));

// ---------- Contract: root file and external $ref ----------
// Every external $ref is resolved. A target named in the root under components becomes the usual
// internal reference (#/components/schemas/Room); any other target is inlined.
const KINDS = ['schemas', 'parameters', 'responses'];
const relApi = (f) => relative(dirname(API), f).split('\\').join('/');
const fileCache = new Map();
const loadFile = (f) => {
  if (!fileCache.has(f)) {
    let v = {};
    if (!existsSync(f)) err(`file not found: api/${relApi(f)}`);
    else try { v = YAML.parse(readFileSync(f, 'utf8')) || {}; } catch (e) { err(`api/${relApi(f)}: invalid YAML (${e.message.split('\n')[0]})`); }
    fileCache.set(f, v);
  }
  return fileCache.get(f);
};
const unescPtr = (p) => decodeURIComponent(p).replace(/~1/g, '/').replace(/~0/g, '~');
const atPointer = (obj, frag) => frag.replace(/^\//, '').split('/').filter((x) => x !== '').reduce((o, p) => (o == null ? undefined : o[unescPtr(p)]), obj);
const target = (base, ref) => {
  const i = ref.indexOf('#');
  const file = i < 0 ? ref : ref.slice(0, i), frag = i < 0 ? '' : ref.slice(i + 1);
  const abs = file ? resolve(dirname(base), file) : base;
  return { file: abs, frag, key: abs + '#' + frag };
};
const raw = loadFile(API);
const registry = new Map(); // file#pointer -> #/components/<kind>/<name>
const componentSource = {};
KINDS.forEach((kind) => Object.entries((raw.components || {})[kind] || {}).forEach(([name, v]) => {
  if (v && typeof v.$ref === 'string' && !v.$ref.startsWith('#')) {
    const t = target(API, v.$ref);
    registry.set(t.key, `#/components/${kind}/${name}`);
    componentSource[`${kind}/${name}`] = t.file;
  }
}));
const bundle = (node, base, stack) => {
  if (Array.isArray(node)) return node.map((x) => bundle(x, base, stack));
  if (!node || typeof node !== 'object') return node;
  if (typeof node.$ref === 'string') {
    const { $ref, ...sib } = node;
    const rest = bundle(sib, base, stack);
    const t = target(base, $ref);
    if (t.file === API) return { $ref: '#' + t.frag, ...rest };
    if (registry.has(t.key)) return { $ref: registry.get(t.key), ...rest };
    if (stack.includes(t.key)) { err(`circular reference: ${$ref} in api/${relApi(base)}`); return rest; }
    const v = atPointer(loadFile(t.file), t.frag);
    if (v === undefined) { err(`reference not found: ${$ref} in api/${relApi(base)}`); return rest; }
    return { ...bundle(v, t.file, [...stack, t.key]), ...rest };
  }
  return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, bundle(v, base, stack)]));
};
const spec = { ...raw, paths: {}, components: { ...(raw.components || {}) } };
const pathSource = {};
Object.entries(raw.paths || {}).forEach(([p, v]) => {
  pathSource[p] = v && typeof v.$ref === 'string' && !v.$ref.startsWith('#') ? target(API, v.$ref).file : API;
  spec.paths[p] = bundle(v, API, []);
});
KINDS.forEach((kind) => {
  spec.components[kind] = {};
  Object.entries((raw.components || {})[kind] || {}).forEach(([name, v]) => {
    if (v && typeof v.$ref === 'string' && !v.$ref.startsWith('#')) {
      const t = target(API, v.$ref);
      const content = atPointer(loadFile(t.file), t.frag);
      if (content === undefined) { err(`components/${kind}/${name}: reference not found ${v.$ref}`); spec.components[kind][name] = {}; return; }
      spec.components[kind][name] = bundle(content, t.file, [t.key]);
    } else spec.components[kind][name] = bundle(v, API, []);
  });
});
// Files of the contract folder that the root never reaches, and components not named in the root
{
  const apiDir = dirname(API), all = [];
  const walkApi = (d) => readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = join(d, e.name);
    if (e.isDirectory()) walkApi(p); else if (/\.ya?ml$/.test(e.name) && !e.name.startsWith('.')) all.push(p);
  });
  walkApi(apiDir);
  all.filter((f) => !fileCache.has(f)).forEach((f) => warn(`api/${relApi(f)} is reached by no $ref of openapi.yaml`));
  [...fileCache.keys()].filter((f) => f !== API && /[\\/]components[\\/]/.test(f)).forEach((f) => Object.keys(fileCache.get(f) || {}).forEach((k) => {
    if (!registry.has(f + '#/' + k)) warn(`api/${relApi(f)}: ${k} is not named under components in openapi.yaml (it is copied at every use)`);
  }));
}
const schemas = spec.components.schemas || {};
const VERBS = ['get', 'post', 'put', 'patch', 'delete'];
// An operation of the API contract is frozen (the front starts on a mock) or provisional (waits for an answer)
const STATUSES = ['frozen', 'provisional'];
const REL_ORDER = ['MVP', 'R2', 'R3', 'R4', 'R5'];
const relRank = (r) => (REL_ORDER.indexOf(r) < 0 ? 99 : REL_ORDER.indexOf(r));
const num = (id) => parseInt(String(id).replace(/\D+/g, ''), 10) || 0;
const byId = (a, b) => num(a) - num(b);
const uniq = (list) => [...new Set(list)];
const words = (s) => String(s || '').split(/\s+/).filter(Boolean);
// Access of an endpoint or a process to an entity: letters of a CRUD matrix (create, read, update, delete)
const CRUD = ['C', 'R', 'U', 'D'];
const CRUD_NAMES = Object.fromEntries(CRUD.map((l) => [l, t(`detailed.crud.${l}`)]));
const validCrud = (a) => /^[CRUD]+$/.test(String(a || ''));
const unionCrud = (...list) => CRUD.filter((l) => list.some((a) => String(a || '').includes(l))).join('');
const isWrite = (a) => /[CUD]/.test(String(a || ''));
// Impact of an open point on the design (skill deliverable-detailed-design): what a different answer
// would change. high: data model or frozen operation; medium: provisional operation, process, schema not
// frozen, screen; low: label, message, edge case
const IMPACTS = ['high', 'medium', 'low'];
const impactRank = (i) => (IMPACTS.indexOf(i) < 0 ? 9 : IMPACTS.indexOf(i));

// ---------- Version and changelog of the contract ----------
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const CHANGE_KINDS = ['added', 'announced', 'frozen', 'fix', 'breaking'];
const version = String((spec.info || {}).version || '');
const changelog = ((spec.info || {})['x-changelog']) || [];
if (!SEMVER.test(version)) err(`info.version "${version}" is not of the form major.minor.patch`);
if (!changelog.length) err('info.x-changelog missing: every version of the API contract has its entry');
else if (String(changelog[0].version) !== version) err(`info.version ${version} without an entry at the top of info.x-changelog (first entry: ${changelog[0].version})`);
const semver = (v) => (String(v).match(SEMVER) || []).slice(1).map(Number);
changelog.forEach((e, i) => {
  if (!SEMVER.test(String(e.version))) err(`x-changelog[${i}]: invalid version "${e.version}"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(e.date || ''))) err(`x-changelog ${e.version}: YYYY-MM-DD date expected (quoted)`);
  if (!Array.isArray(e.changes) || !e.changes.length) err(`x-changelog ${e.version}: empty changes`);
  (e.changes || []).forEach((c, k) => {
    if (typeof c !== 'string') { err(`x-changelog ${e.version} changes[${k}] is not a text (quote the line)`); e.changes[k] = JSON.stringify(c); return; }
    const kind = (c.match(/^([^:]+?)\s*:/) || [])[1];
    if (!CHANGE_KINDS.includes(kind)) warn(`x-changelog ${e.version}: "${c.slice(0, 40)}…" does not start with a kind (${CHANGE_KINDS.join(', ')})`);
  });
  const older = changelog[i + 1];
  if (older && SEMVER.test(String(e.version)) && SEMVER.test(String(older.version))) {
    const [a1, b1, c1] = semver(e.version), [a0, b0, c0] = semver(older.version);
    if (a1 * 1e6 + b1 * 1e3 + c1 <= a0 * 1e6 + b0 * 1e3 + c0) err(`x-changelog: ${e.version} must come after ${older.version}, most recent first`);
    // A major version breaks a frozen operation: only with an accepted ADR, cited in the entry
    if (a1 > a0 && !(e.changes || []).some((c) => /\bADR-\d{4}\b/.test(c))) err(`x-changelog ${e.version}: major version without an ADR cited`);
  }
});

// ---------- References ----------
const refName = (ref) => (ref || '').split('/').pop();
const deref = (o) => {
  if (!o || !o.$ref) return o;
  const cur = atPointer(spec, o.$ref.replace(/^#/, ''));
  if (!cur) err(`reference not found: ${o.$ref}`);
  return cur || {};
};
// Schemas that a schema object points to directly (itself or the items of an array)
const directRefs = (s) => {
  if (!s) return [];
  if (s.$ref) return [refName(s.$ref)];
  if (s.type === 'array' && s.items) return directRefs(s.items);
  return [];
};
// Every schema name referenced anywhere inside a schema (properties, items, allOf…)
const allRefs = (s, out = new Set()) => {
  if (!s || typeof s !== 'object') return out;
  if (Array.isArray(s)) { s.forEach((x) => allRefs(x, out)); return out; }
  for (const [k, v] of Object.entries(s)) {
    if (k === '$ref' && typeof v === 'string' && v.includes('/schemas/')) out.add(refName(v));
    else if (typeof v === 'object') allRefs(v, out);
  }
  return out;
};

// ---------- Operations ----------
const ops = [];
for (const [path, item] of Object.entries(spec.paths || {})) {
  for (const verb of VERBS) {
    const op = item[verb];
    if (!op) continue;
    const id = op['x-endpoint-id'];
    if (!id) { err(`${verb.toUpperCase()} ${path}: x-endpoint-id missing`); continue; }
    if (ops.some((o) => o.id === id)) err(`${id}: duplicate x-endpoint-id`);
    const params = [...(item.parameters || []), ...(op.parameters || [])].map((p) => (p.$ref ? { ...deref(p), $from: refName(p.$ref) } : p));
    const responses = Object.entries(op.responses || {}).map(([status, r]) => {
      const res = r.$ref ? deref(r) : r;
      const content = res.content || {};
      const media = Object.keys(content)[0];
      const schema = media ? content[media].schema : null;
      return { status, res, media, schema, example: media ? content[media].example : undefined, codes: res['x-codes'] || [], refName: r.$ref ? refName(r.$ref) : null };
    });
    const bodyMedia = op.requestBody && Object.keys(op.requestBody.content || {})[0];
    const body = bodyMedia ? op.requestBody.content[bodyMedia] : null;
    ['x-release', 'x-contract', 'x-roles', 'x-module'].forEach((k) => { if (!op[k]) err(`${id}: ${k} missing`); });
    if (op['x-contract'] && !STATUSES.includes(op['x-contract'])) err(`${id}: unknown x-contract "${op['x-contract']}" (${STATUSES.join(' or ')})`);
    // A plain YAML scalar with ": " inside becomes a mapping: quote it
    ['x-data-control'].forEach((k) => (op[k] || []).forEach((v, i) => { if (typeof v !== 'string') { err(`${id}: ${k}[${i}] is not a text (quote the ": "?)`); op[k][i] = JSON.stringify(v); } }));
    // Open points: { impact, subject, hypothesis?, question? }, written once, here for an operation
    const open = (op['x-open'] || []).map((v, i) => {
      if (!v || typeof v !== 'object' || Array.isArray(v)) { err(`${id}: x-open[${i}] must be an object { impact, subject, hypothesis, question }`); return null; }
      if (!IMPACTS.includes(v.impact)) err(`${id}: x-open[${i}] unknown impact "${v.impact}" (${IMPACTS.join(', ')})`);
      ['subject', 'hypothesis'].forEach((k) => { if (v[k] != null && typeof v[k] !== 'string') { err(`${id}: x-open[${i}].${k} is not a text (quote the ": "?)`); v[k] = JSON.stringify(v[k]); } });
      if (!v.subject) err(`${id}: x-open[${i}] without subject`);
      if (v.question && !/^Q-\d{3}$/.test(v.question)) err(`${id}: x-open[${i}] question "${v.question}": Q-xxx expected`);
      Object.keys(v).filter((k) => !['impact', 'subject', 'hypothesis', 'question'].includes(k)).forEach((k) => warn(`${id}: x-open[${i}].${k} read by nothing`));
      return v;
    }).filter(Boolean);
    if (open.some((v, i) => i && impactRank(v.impact) < impactRank(open[i - 1].impact))) warn(`${id}: x-open to sort by impact, highest first`);
    if (op['x-adapted']) warn(`${id}: x-adapted no longer exists. An addition of a later release is announced on the element (x-release, x-enum-releases); what is not decided goes to x-open`);
    (op['x-entities'] || []).forEach((e, i) => {
      if (!e || !/^EN-\d+$/.test(e.id || '')) { err(`${id}: x-entities[${i}] without an EN-xx id`); return; }
      if (!validCrud(e.access)) err(`${id}: x-entities ${e.id} access "${e.access}": CRUD letters expected (C, R, U, D)`);
      if (e.via != null && !(op['x-processes'] || []).includes(e.via)) err(`${id}: x-entities ${e.id} via "${e.via}": process absent from x-processes`);
      Object.keys(e).filter((k) => !['id', 'access', 'via'].includes(k)).forEach((k) => warn(`${id}: x-entities ${e.id}.${k} read by nothing`));
    });
    ops.push({
      id, verb, path, op, params, responses, source: pathSource[path],
      body: body && body.schema ? { schema: body.schema, example: body.example, required: !!op.requestBody.required } : null,
      release: op['x-release'] || '', contract: op['x-contract'] || '', open,
      module: String(op['x-module'] || ''), roles: op['x-roles'] || [], processes: op['x-processes'] || [], entities: (op['x-entities'] || []).filter((e) => e && e.id).map((e) => ({ id: e.id, access: String(e.access || ''), via: e.via ? String(e.via) : '' })),
      rules: op['x-rules'] || [], name: `${verb.toUpperCase()} /api${path}`, short: `${verb.toUpperCase()} ${path}`,
    });
  }
}
ops.sort((a, b) => byId(a.id, b.id));
const opById = new Map(ops.map((o) => [o.id, o]));
// A hypothesis is an open point of its operation (x-open), not a remark in a text of the contract
if (/\bhypothes[ie]s\b/i.test(JSON.stringify({ paths: spec.paths, components: spec.components }, (k, v) => (k === 'x-open' ? undefined : v)))) warn('openapi.yaml: a hypothesis is written outside x-open; it goes to the open points of its operation');
// No epic nor story in the detailed design: the coverage of a story is in its technical notes
const STORY_RE = /\b(?:US-\d{3}|EPIC-\d+|epics?|stor(?:y|ies))\b/i;
if (STORY_RE.test(JSON.stringify(spec))) warn(`openapi.yaml cites an epic or a story ("${JSON.stringify(spec).match(STORY_RE)[0]}"): the detailed design does not mention them, the coverage of a story goes to its technical notes`);

// ---------- Hand-written pages: entities, processes ----------
const metaOf = (html) => {
  const m = {};
  for (const [, k, v] of html.matchAll(/<meta\s+name="([^"]+)"\s+content="([^"]*)"\s*\/?>/g)) m[k] = v;
  return m;
};
const HTML_META = ['viewport', 'description'];
const readPages = (sub, prefix, known) => {
  const dir = join(DET, sub), map = new Map();
  if (!existsSync(dir)) return map;
  for (const f of readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith('.html')).sort()) {
    const meta = metaOf(readFileSync(join(dir, f), 'utf8'));
    const id = meta.id || f.replace(/\.html$/, '');
    if (/xx$/i.test(id)) err(`${sub}/${f}: meta "id" still "${id}" (template), write the identifier equal to the file name: ${f.replace(/\.html$/, '')}`);
    else if (f !== id + '.html') err(`${sub}/${f}: the file must be named ${id}.html`);
    Object.keys(meta).filter((k) => !known.includes(k) && !HTML_META.includes(k)).forEach((k) => warn(`${sub}/${f}: meta "${k}" read by nothing, to remove`));
    if (!meta.module) err(`${sub}/${f}: meta "module" missing (backend code module where the object lives, listed in the code organisation)`);
    map.set(id, { id, file: join(dir, f), name: meta.name || id, release: meta.release || '', module: meta.module || '', meta, rules: words(meta.rules) });
  }
  return map;
};
const entities = readPages('entities', 'EN-', ['id', 'name', 'release', 'module', 'tables', 'rules']);
const processes = readPages('processes', 'PROC-', ['id', 'name', 'release', 'module', 'entities', 'processes', 'errors', 'rules']);
processes.forEach((p) => {
  p.entities = words(p.meta.entities).map((w) => {
    const [id, access] = w.split(':');
    if (!validCrud(access)) err(`${p.id}: meta entities "${w}": EN-xx:CRUD expected (letters C, R, U, D, for example EN-05:CU)`);
    return { id, access: access || '' };
  });
  p.calls = words(p.meta.processes);
  p.errors = words(p.meta.errors);
});
processes.forEach((p) => {
  p.entities.forEach((e) => { if (!entities.has(e.id)) err(`${p.id}: entity ${e.id} without a page entities/${e.id}.html`); });
  p.calls.forEach((t) => { if (!processes.has(t)) err(`${p.id}: process ${t} without a page processes/${t}.html`); });
});
ops.forEach((o) => {
  o.processes.forEach((t) => { if (!processes.has(t)) err(`${o.id}: process ${t} without a page processes/${t}.html`); });
  o.entities.forEach((e) => { if (!entities.has(e.id)) err(`${o.id}: entity ${e.id} without a page entities/${e.id}.html`); });
  o.entities.forEach((e, i) => { if (o.entities.findIndex((x) => x.id === e.id && x.via === e.via) !== i) err(`${o.id}: x-entities ${e.id}${e.via ? ' via ' + e.via : ''} declared twice`); });
});
// Entities a process reaches, itself or through the processes it calls; by = chain of processes
const procAccess = (t, seen = new Set()) => {
  const p = processes.get(t);
  if (!p || seen.has(t)) return [];
  seen.add(t);
  return [...p.entities.map((e) => ({ ...e, by: [t] })), ...p.calls.flatMap((c) => procAccess(c, seen).map((e) => ({ ...e, by: [t, ...e.by] })))];
};
const procCalls = (t, seen = new Set()) => {
  const p = processes.get(t);
  if (!p || seen.has(t)) return [];
  seen.add(t);
  return [t, ...p.calls.flatMap((c) => procCalls(c, seen))];
};
// Access an endpoint obtains through a process: the caller declares it (x-entities with via), as a process
// may create for one caller and update for another. Each chain of the process that reaches the entity keeps
// the letters the caller declared; an entity the caller does not declare keeps the whole access of the
// process (warned in --check)
const keep = (a, letters) => [...a].filter((l) => letters.includes(l)).join('');
const viaAccess = (o, t) => {
  const reach = procAccess(t);
  return uniq(reach.map((e) => e.id)).flatMap((en) => {
    const decl = o.entities.filter((e) => e.via === t && e.id === en);
    const chains = reach.filter((e) => e.id === en);
    if (!decl.length) return chains;
    const letters = unionCrud(...decl.map((d) => d.access));
    return chains.map((e) => ({ ...e, access: keep(e.access, letters) })).filter((e) => e.access);
  });
};
const entityAccess = (o) => [...o.entities.filter((e) => !e.via).map((e) => ({ id: e.id, access: e.access, by: [] })), ...o.processes.flatMap((t) => viaAccess(o, t))];
// What a caller declares through a process is included in what the process declares (error), and every
// entity a called process touches is declared by the caller (warning)
ops.forEach((o) => {
  o.entities.filter((e) => e.via && processes.has(e.via)).forEach((e) => {
    const reached = unionCrud(...procAccess(e.via).filter((x) => x.id === e.id).map((x) => x.access));
    const extra = [...e.access].filter((l) => !reached.includes(l));
    if (!reached) err(`${o.id}: x-entities ${e.id} via ${e.via}: ${e.via} does not touch ${e.id} (meta entities)`);
    else if (extra.length) err(`${o.id}: x-entities ${e.id} access ${e.access} via ${e.via}: ${extra.join('')} outside the access ${e.via} declares (${reached})`);
  });
  o.processes.filter((t) => processes.has(t)).forEach((t) => uniq(procAccess(t).map((e) => e.id)).forEach((en) => {
    if (!o.entities.some((e) => e.via === t && e.id === en)) warn(`${o.id} calls ${t}, which touches ${en}, without declaring the access it obtains (x-entities {id: ${en}, access: ..., via: ${t}}): the whole access of the process is kept`);
  }));
});
const writes = (o) => entityAccess(o).some((e) => isWrite(e.access));
// Effective access of an endpoint or a process to each entity: union of its accesses, direct or through the
// processes it calls; chains: every way it reaches the entity ([] directly, [PROC-xx, ...] through processes)
const crudOf = (accesses) => {
  const m = new Map();
  accesses.forEach((e) => {
    const cur = m.get(e.id);
    if (!cur) { m.set(e.id, { ...e, access: unionCrud(e.access), chains: [e.by], parts: [{ by: e.by, access: unionCrud(e.access) }] }); return; }
    cur.access = unionCrud(cur.access, e.access);
    if (!cur.chains.some((c) => c.join() === e.by.join())) cur.chains.push(e.by);
    const part = cur.parts.find((p) => p.by.join() === e.by.join());
    if (part) part.access = unionCrud(part.access, e.access); else cur.parts.push({ by: e.by, access: unionCrud(e.access) });
    if (e.by.length < cur.by.length) cur.by = e.by;
  });
  return m;
};
const callersOfProcess = (t) => ({ ops: ops.filter((o) => o.processes.includes(t)), procs: [...processes.values()].filter((p) => p.calls.includes(t)) });

// ---------- Requirement levels ----------
// Frozen: the front codes against it, everything is required. Provisional: reduced level, what is open.
const has = (o, k) => o.op[k] != null && o.op[k] !== '' && !(Array.isArray(o.op[k]) && !o.op[k].length);
ops.forEach((o) => {
  const objects = o.processes.length || o.entities.length;
  if (o.contract === 'frozen') {
    if (!objects) err(`${o.id} frozen: x-entities or x-processes missing`);
    if (writes(o)) ['x-idempotence', 'x-sequence'].forEach((k) => { if (!has(o, k)) err(`${o.id} frozen and writing: ${k} missing`); });
    else if (!has(o, 'x-sequence')) warn(`${o.id} frozen and reading: x-sequence recommended`);
    // Examples: the front writes its mock from them, without inventing. The example of the content, or
    // that of the schema it sends or receives (examples of the schema, shown on its page)
    const exampled = (ex, schema) => ex !== undefined || (directRefs(schema).length > 0 && directRefs(schema).every((n) => schemas[n] && (schemas[n].examples || schemas[n].example !== undefined)));
    if (o.body && !exampled(o.body.example, o.body.schema)) err(`${o.id} frozen: example of the request body missing (example of the content, or examples of the schema)`);
    o.responses.filter((r) => /^2/.test(r.status) && r.media && !exampled(r.example, r.schema)).forEach((r) => err(`${o.id} frozen: example of the response ${r.status} missing (example of the content, or examples of the schema)`));
  } else if (o.contract === 'provisional') {
    if (!o.op.summary) err(`${o.id} provisional: summary missing`);
    if (!objects) err(`${o.id} provisional: x-entities or x-processes missing`);
    if (!has(o, 'x-open')) err(`${o.id} provisional: x-open missing (what is still to decide)`);
  }
});

// ---------- Macro: callers of each endpoint, consistency ----------
const macroFile = join(CONC, 'macro.html');
const macro = new Map();
let project = 'Project';
if (existsSync(macroFile)) {
  const html = readFileSync(macroFile, 'utf8');
  project = ((html.match(/<div class="toc-project">([^<]+)<\/div>/) || [])[1] || project).trim();
  for (const m of html.matchAll(/<(div|a)\s+class="node ([a-z]+)[^"]*"[^>]*?\bid="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const [, , type, id, attrs, inner] = m;
    const links = ((attrs.match(/data-links="([^"]*)"/) || [])[1] || '').split(/\s+/).filter(Boolean).map((w) => w.split('|')[0]);
    const rel = (attrs.match(/data-release="([^"]*)"/) || [])[1] || '';
    macro.set(id, { id, type, links, release: rel, text: inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() });
  }
  const inMacro = (type) => [...macro.values()].filter((n) => n.type === type).map((n) => n.id);
  inMacro('endpoint').forEach((id) => { if (!opById.has(id)) warn(`${id} is in the macro but not in openapi.yaml`); });
  ops.forEach((o) => { if (!macro.has(o.id)) warn(`${o.id} is in openapi.yaml but not in the macro`); });
  inMacro('entity').forEach((id) => { if (!entities.has(id)) warn(`${id} is in the macro without a page entities/${id}.html`); });
  inMacro('process').forEach((id) => { if (!processes.has(id)) warn(`${id} is in the macro without a page processes/${id}.html`); });
  // Every arrow of the macro is in the detailed design (error); finer accesses of the detailed design are info
  const compare = (id, macroLinks, detail) => {
    macroLinks.filter((l) => /^(EN|PROC)-/.test(l) && !detail.includes(l)).forEach((l) => err(`macro: arrow ${id} → ${l} absent from the detailed design`));
    detail.filter((l) => !macroLinks.includes(l)).forEach((l) => info(`${id} → ${l} stated by the detailed design, absent from the macro diagram`));
  };
  ops.forEach((o) => { if (macro.has(o.id)) compare(o.id, macro.get(o.id).links, [...o.processes, ...o.entities.filter((e) => !e.via).map((e) => e.id)]); });
  processes.forEach((p) => { if (macro.has(p.id)) compare(p.id, macro.get(p.id).links, [...p.calls, ...p.entities.map((e) => e.id)]); });
} else warn('macro.html absent: no callers and no consistency check');
const callers = (epId) => {
  const feats = [...macro.values()].filter((n) => n.type === 'feature' && n.links.includes(epId));
  return feats.map((f) => ({ feature: f, screens: [...macro.values()].filter((n) => n.type === 'screen' && n.links.includes(f.id)) }));
};

// ---------- Schemas: who sends or receives what ----------
const errorSchema = (() => {
  const s = new Set();
  ops.forEach((o) => o.responses.forEach((r) => { if (r.media === 'application/problem+json') directRefs(r.schema).forEach((n) => s.add(n)); }));
  return s;
})();
const errorSchemaName = [...errorSchema][0] || 'Problem';
const usage = new Map(Object.keys(schemas).map((n) => [n, []]));
const use = (name, u) => { if (usage.has(name)) usage.get(name).push(u); else err(`unknown schema: ${name}`); };
ops.forEach((o) => {
  if (o.body) directRefs(o.body.schema).forEach((n) => use(n, { op: o, dir: 'in', where: 'request body' }));
  o.responses.forEach((r) => directRefs(r.schema).forEach((n) => use(n, { op: o, dir: errorSchema.has(n) ? 'err' : 'out', where: r.status, codes: r.codes })));
});
// Schemas a schema contains (refs inside), and the reverse
const contains = new Map(Object.entries(schemas).map(([n, s]) => [n, [...allRefs(s)].filter((r) => r !== n)]));
const containedIn = new Map(Object.keys(schemas).map((n) => [n, [...contains.entries()].filter(([, v]) => v.includes(n)).map(([k]) => k)]));
// An exchanged schema is sent or received by an endpoint, directly, and has its page; any other schema is
// a shared type (a row of the schemas list, no page of its own)
const isExchanged = (n) => (usage.get(n) || []).length > 0;
// Endpoints that carry a schema through another one: transitive, except through the error schema, where
// only the codes declared by x-for-codes on the carrying property count
const carriedBy = (name) => {
  const out = [], seen = new Set([name]);
  const walk = (n, path) => (containedIn.get(n) || []).forEach((c) => {
    if (seen.has(c)) return;
    seen.add(c);
    if (errorSchema.has(c)) {
      const props = Object.entries(schemas[c].properties || {}).filter(([, p]) => allRefs(p).has(n));
      const codes = props.flatMap(([, p]) => p['x-for-codes'] || []);
      ops.forEach((o) => o.responses.forEach((r) => {
        const hit = r.codes.filter((k) => codes.includes(k));
        if (hit.length && directRefs(r.schema).includes(c)) out.push({ op: o, via: [...path, c], where: `${r.status} ${hit.join(', ')}`, dir: 'err' });
      }));
      return;
    }
    (usage.get(c) || []).forEach((u) => out.push({ ...u, via: [...path, c] }));
    walk(c, [...path, c]);
  });
  walk(name, []);
  return out;
};
// Schemas of an endpoint for the macro icon: request body and success responses, error schema excluded
const opSchemas = (o) => {
  const list = [];
  if (o.body) directRefs(o.body.schema).forEach((n) => list.push({ name: n, dir: 'in' }));
  o.responses.filter((r) => /^2/.test(r.status)).forEach((r) => directRefs(r.schema).forEach((n) => { if (!list.some((c) => c.name === n && c.dir === 'out')) list.push({ name: n, dir: 'out', status: r.status }); }));
  return list;
};
// A schema exchanged by a frozen and a provisional operation: changing it for the provisional one changes
// the frozen one, so it only grows, backward compatible
const shared = new Map();
Object.keys(schemas).filter((n) => !errorSchema.has(n)).forEach((n) => {
  const u = usage.get(n) || [];
  const f = uniq(u.filter((x) => x.op.contract === 'frozen').map((x) => x.op.id)).sort(byId);
  const p = uniq(u.filter((x) => x.op.contract === 'provisional').map((x) => x.op.id)).sort(byId);
  if (f.length && p.length) {
    shared.set(n, { frozen: f, provisional: p });
    warn(`${n} is exchanged by frozen operations (${f.join(', ')}) and provisional ones (${p.join(', ')}): the provisional ones can only extend it, in a backward compatible way`);
  }
});

// ---------- Domains of the schemas: components/schemas/<domain>.yaml ----------
// The label is read from the first line of the file (# domain: Bookings), written in the project
// language. The domains come in the order of their first schema in the root file
const baseName = (f) => f.replace(/^.*[\\/]/, '').replace(/\.ya?ml$/, '');
const domainOf = (n) => (componentSource[`schemas/${n}`] ? baseName(componentSource[`schemas/${n}`]) : 'openapi');
const domains = uniq(Object.keys(schemas).map(domainOf));
const domainLabels = new Map(domains.map((d) => {
  const f = Object.values(componentSource).find((x) => /[\\/]schemas[\\/]/.test(x) && baseName(x) === d);
  const first = f && existsSync(f) ? readFileSync(f, 'utf8').split('\n')[0] : '';
  const m = first.match(/^#\s*domain:\s*(.*?)\s*$/);
  if (f && !(m && m[1])) warn(`api/${relApi(f)}: first line "# domain: <label>" expected, label taken from the file name`);
  return [d, m && m[1] ? m[1] : d.charAt(0).toUpperCase() + d.slice(1)];
}));

// ---------- Error codes ----------
// The error code schema is the one that carries x-error-catalog (ErrorCode in the template)
const CODE_SCHEMA = Object.keys(schemas).find((n) => schemas[n] && schemas[n]['x-error-catalog']) || 'ErrorCode';
const codeSchema = schemas[CODE_SCHEMA] || {};
const codeEnum = codeSchema.enum || [];
const catalog = codeSchema['x-error-catalog'] || {};
const codeUse = new Map(codeEnum.map((c) => [c, []]));
ops.forEach((o) => o.responses.forEach((r) => r.codes.forEach((c) => {
  if (!codeUse.has(c)) { err(`${o.id} ${r.status}: code ${c} absent from ${CODE_SCHEMA}`); return; }
  if (catalog[c] && String(catalog[c].status) !== String(r.status)) warn(`${o.id}: ${c} returned with ${r.status}, the catalog says ${catalog[c].status}`);
  if (!codeUse.get(c).includes(o)) codeUse.get(c).push(o);
})));
codeEnum.forEach((c) => { if (!catalog[c]) warn(`${CODE_SCHEMA} ${c} without an entry in x-error-catalog`); if (!codeUse.get(c).length) warn(`${CODE_SCHEMA} ${c} is returned by no operation`); });
ops.forEach((o) => o.responses.filter((r) => /^[45]/.test(r.status) && !r.codes.length).forEach((r) => warn(`${o.id} ${r.status}: error response without x-codes`)));
// A code that puts an entity in question (catalog "entity") is returned only by who declares that entity
ops.forEach((o) => {
  const declared = new Set(entityAccess(o).map((e) => e.id));
  uniq(o.responses.flatMap((r) => r.codes)).forEach((c) => {
    const en = (catalog[c] || {}).entity;
    if (en && !declared.has(en)) warn(`${o.id} returns ${c} without declaring ${en} (x-entities, or entity of a called process)`);
  });
});
processes.forEach((p) => {
  const declared = new Set(procAccess(p.id).map((e) => e.id));
  p.errors.forEach((c) => {
    if (!codeUse.has(c)) { err(`${p.id}: code ${c} (meta errors) absent from ${CODE_SCHEMA}`); return; }
    const en = (catalog[c] || {}).entity;
    if (en && !declared.has(en)) warn(`${p.id} returns ${c} without declaring ${en} (meta entities)`);
  });
});
const fieldsFor = (c) => Object.entries((schemas[errorSchemaName] || {}).properties || {}).filter(([, p]) => (p['x-for-codes'] || []).includes(c)).map(([n]) => n);
// Codes common to every operation and screen, expected by the generator
const GENERIC_CODES = ['VALIDATION', 'UNAUTHENTICATED', 'INTERNAL_ERROR'];

// ---------- Announced additions: parameters, properties, enum values of a later release ----------
const enumAnnounced = (s, where) => Object.entries((s && s['x-enum-releases']) || {}).map(([v, r]) => {
  if (!(s.enum || []).includes(v)) err(`${where}: x-enum-releases announces ${v}, absent from enum`);
  return { release: r, what: t('detailed.announced.value', { v: `<code>${v}</code>` }), where };
});
// Announced in a schema: its enum values, its properties with x-release, the enum values of the types
// its properties use (one level)
const announcedIn = (name, s = schemas[name], where = name) => {
  const out = [...enumAnnounced(s, where)];
  Object.entries((s && s.properties) || {}).forEach(([n, p]) => {
    if (p['x-release']) out.push({ release: p['x-release'], what: t('detailed.announced.property', { name: `<code>${n}</code>` }), where });
    const ty = p.$ref ? refName(p.$ref) : p.items && p.items.$ref ? refName(p.items.$ref) : null;
    if (ty && schemas[ty]) enumAnnounced(schemas[ty], `${where}.${n}`).forEach((a) => out.push({ ...a, what: t('detailed.announced.of-type', { what: a.what, type: ty }) }));
    else if (!p.$ref) enumAnnounced(p, `${where}.${n}`).forEach((a) => out.push(a));
  });
  return out;
};
const announcedOfOp = (o) => {
  const out = [];
  o.params.forEach((p) => {
    if (p['x-release']) out.push({ release: p['x-release'], what: t('detailed.announced.parameter', { name: `<code>${p.name}</code>` }), where: p.in });
    const ty = p.schema && p.schema.$ref ? refName(p.schema.$ref) : null;
    enumAnnounced(ty ? schemas[ty] : p.schema, t('detailed.announced.where.parameter', { name: p.name })).forEach((a) => out.push(a));
  });
  opSchemas(o).forEach((c) => announcedIn(c.name).forEach((a) => out.push({ ...a, where: t(c.dir === 'in' ? 'detailed.announced.where.request' : 'detailed.announced.where.response', { where: a.where }) })));
  const codeRel = codeSchema['x-enum-releases'] || {};
  uniq(o.responses.flatMap((r) => r.codes)).filter((c) => codeRel[c]).forEach((c) => out.push({ release: codeRel[c], what: t('detailed.announced.code', { code: `<code>${c}</code>` }), where: t('detailed.announced.where.error') }));
  out.forEach((a) => { if (relRank(a.release) === 99) err(`${o.id}: unknown release ${a.release} (${a.what})`); });
  return out.filter((a) => relRank(a.release) > relRank(o.release));
};

// ---------- Rendering helpers ----------
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// ADR pages (NNNN-<slug>.html, skill deliverable-adr) first, then the former Markdown files
const adrFiles = existsSync(join(DOCS, 'adr')) ? readdirSync(join(DOCS, 'adr')).filter((f) => /^\d{4}-.*\.(html|md)$/.test(f))
  .sort((a, b) => (a.endsWith('.html') ? 0 : 1) - (b.endsWith('.html') ? 0 : 1) || a.localeCompare(b)) : [];
const P = {
  fonc: join(DOCS, '20-specs', 'functional-design.html'),
  ux: join(DOCS, '20-ux', 'ux-ui-spec.html'),
  questions: join(DOCS, 'questions.html'),
  compliance: join(DET, 'cross-cutting', 'compliance.html'),
  macro: macroFile,
  openapi: API,
  summary: join(DET, 'index.html'),
  swagger: join(DET, 'swagger.html'),
  open: join(DET, 'open-points.html'),
  schemas: join(DET, 'schemas', 'index.html'),
  errors: join(DET, 'cross-cutting', 'errors.html'),
  code: join(DET, 'cross-cutting', 'code-organization.html'),
  portal: join(DOCS, 'index.html'),
  assets: join(DOCS, '_assets'),
};
// Ids defined by another deliverable link to their anchor only when it exists there: an id not defined
// yet stays text (rule of team/deliverables.md), and a bare id in a hand-written page is reported only then
const anchorCache = new Map();
const anchorsIn = (f) => {
  if (!anchorCache.has(f)) anchorCache.set(f, new Set(existsSync(f) ? [...readFileSync(f, 'utf8').matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]) : []));
  return anchorCache.get(f);
};
const anchorLink = (from, file, id, cls) => (anchorsIn(file).has(id) ? `<a${cls ? ` class="${cls}"` : ''} href="${href(from, file, id)}">${id}</a>` : id);
const epFile = (id) => join(DET, 'endpoints', id + '.html');
const ctFile = (n) => join(DET, 'schemas', n + '.html');
const objFile = (id) => (/^EP-/.test(id) ? (opById.has(id) ? epFile(id) : null)
  : /^EN-/.test(id) ? (entities.get(id) || {}).file : /^PROC-/.test(id) ? (processes.get(id) || {}).file : null);
// Link from the page being written (from) to a target file, with an anchor
const href = (from, file, anchor) => relative(dirname(from), file).split('\\').join('/') + (anchor ? '#' + anchor : '');
const label = (id) => {
  if (opById.has(id)) return opById.get(id).short;
  return (entities.get(id) || processes.get(id) || {}).name || (macro.get(id) || {}).text || '';
};
const idLink = (from, id, withName = false) => {
  const f = objFile(id);
  const name = withName && label(id) ? ' ' + esc(label(id)) : '';
  if (f) return `<a href="${href(from, f)}">${id}</a>${name}`;
  if (macro.has(id)) return `<a href="${href(from, P.macro, id)}">${id}</a>${name}`;
  return id + name;
};
const byChain = (from, by) => (by.length ? t('detailed.by.chain', { chain: by.map((x) => idLink(from, x)).join(' → ') }) : t('detailed.by.direct'));
const byChains = (from, chains, drop = 0) => uniq(chains.map((c) => byChain(from, c.slice(drop)))).join(' ; ');
// The ways an endpoint or a process reaches an entity, each with its letters when they are not all the same
const byParts = (from, x, drop = 0) => (new Set(x.parts.map((p) => p.access)).size > 1
  ? x.parts.map((p) => `${p.access} ${byChain(from, p.by.slice(drop))}`).join(' ; ')
  : byChains(from, x.chains, drop));
// An exchanged schema has its page; a shared type is a row of the schemas list
const ctHref = (from, n) => (isExchanged(n) ? href(from, ctFile(n)) : href(from, P.schemas, n));
const ctLink = (from, n) => (schemas[n] ? `<a href="${ctHref(from, n)}"><code>${n}</code></a>` : `<code>${esc(n)}</code>`);
const codeLink = (from, c) => `<a href="${href(from, P.errors, c)}"><code>${c}</code></a>`;
// An invariant links to its row in the compliance contract (<tr id="INV-58">). An invariant of a foundation
// taken by reference (INV-01 to INV-49 stack, INV-70 to INV-79 design system) has no row there: it links to
// the section that names the foundation. A framework or project invariant absent from the page is reported.
const invMissing = new Set();
const invSection = (id) => (num(id) < 50 ? 'stack-foundation' : num(id) >= 70 ? 'design-system' : null);
const invLink = (from, id) => {
  let anchor = id;
  if (existsSync(P.compliance) && !anchorsIn(P.compliance).has(id)) {
    if (invSection(id)) anchor = invSection(id); else invMissing.add(id);
  }
  return `<a href="${href(from, P.compliance, anchor)}">${id}</a>`;
};
// Text of a cell, rows of a hand-written table (cells as HTML), slug of a title (anchor)
const cellText = (c) => c.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const tableRows = (tableHtml) => [...((tableHtml.match(/<tbody>([\s\S]*?)<\/tbody>/) || [])[1] || '').matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map(([, tr]) => [...tr.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(([, td]) => td));
const slugOf = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
// ---------- Backend modules: table.modules of the code organisation page ----------
// Every operation (x-module), entity and process (meta module) says in which backend module it lives; the
// modules and what they hold are written once, in the code organisation page; the objects of each module
// are computed (block code-modules), and each object page links to its module
const moduleList = (() => {
  if (!existsSync(P.code)) return null;
  const t = (readFileSync(P.code, 'utf8').match(/<table class="modules">[\s\S]*?<\/table>/) || [])[0];
  if (!t) return null;
  return tableRows(t).map((cells) => cellText(cells[0] || '')).filter(Boolean);
})();
if (!moduleList) warn('cross-cutting/code-organization.html: no table class="modules" (module, content); the declared modules are not checked');
[...ops.map((o) => [o.id, o.module]), ...[...entities.values(), ...processes.values()].map((x) => [x.id, x.module])].forEach(([id, m]) => {
  if (m && moduleList && !moduleList.includes(m)) err(`${id}: module ${m} absent from the modules table of the code organisation`);
});
const moduleAnchor = (m) => 'module-' + slugOf(m);
const moduleLink = (from, m) => (m ? `<a href="${href(from, P.code, moduleAnchor(m))}"><code>${esc(m)}</code></a>` : `<span class="none">${t('detailed.module.undeclared')}</span>`);
// Plain text of the YAML to HTML: ids become links, `x` becomes code (a link when x is a schema)
const ID_RE = /\b(?:(?:BR|FL|CALC)-\d+|MSG-U\d+|MSG-\d+|SCR-\d+(?:-[a-z]+)?|Q-\d{3}|ADR-\d{4}|INV-\d+|EP-\d+|EN-\d+|PROC-\d+|[A-Z][a-z]+(?:[A-Z][a-z]+)+)\b/g;
const linkId = (from, id) => {
  if (/^(BR|FL|CALC)-|^MSG-\d/.test(id)) return anchorLink(from, P.fonc, id);
  if (/^(MSG-U|SCR-)/.test(id)) return anchorLink(from, P.ux, id);
  if (/^Q-/.test(id)) return anchorLink(from, P.questions, id, 'qmark');
  if (/^ADR-/.test(id)) { const f = adrFiles.find((x) => x.startsWith(id.slice(4))); return f ? `<a href="${href(from, join(DOCS, 'adr', f))}">${id}</a>` : id; }
  if (/^INV-/.test(id)) return invLink(from, id);
  if (/^(EP|EN|PROC)-/.test(id)) return idLink(from, id);
  if (schemas[id]) return ctLink(from, id);
  if (catalog[id]) return codeLink(from, id);
  return id;
};
const linkIds = (from, text) => text.replace(ID_RE, (id) => linkId(from, id));
const DELIVERABLES = { [t('detailed.term.macro')]: P.macro, [t('detailed.term.functional')]: P.fonc, [t('detailed.term.ux')]: P.ux };
const DELIVERABLE_RE = new RegExp(`(?<![\\p{L}\\p{N}_])(${Object.keys(DELIVERABLES).map((x) => esc(x).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')).join('|')})(?![\\p{L}\\p{N}_])`, 'gu');
const inline = (from, text) => String(text ?? '').split(/(`[^`]+`)/).map((part) => {
  if (/^`[^`]+`$/.test(part)) {
    const c = part.slice(1, -1);
    if (schemas[c]) return ctLink(from, c);
    if (catalog[c]) return codeLink(from, c);
    return `<code>${esc(c)}</code>`;
  }
  // error codes in capitals are links too
  return linkIds(from, esc(part)).replace(/\b[A-Z][A-Z_]{3,}[A-Z]\b/g, (c) => (catalog[c] ? codeLink(from, c) : c))
    // a deliverable cited by its name, in the project language, is a link too (points of attention of the
    // macro, by default)
    .replace(DELIVERABLE_RE, (m) => {
      const f = DELIVERABLES[m];
      return existsSync(f) ? `<a href="${href(from, f, f === P.macro && anchorsIn(f).has('points-of-attention') ? 'points-of-attention' : '')}">${m}</a>` : m;
    });
}).join('');
// Ids cited in a diagram (Mermaid draws no link): the same ids as links, under the diagram
const diagramRefs = (from, text) => {
  const src = String(text || '');
  const ids = uniq([
    ...(src.match(ID_RE) || []).filter((id) => !/^[A-Z][a-z]/.test(id) || schemas[id]),
    ...(src.match(/\b[A-Z][a-z]+\b/g) || []).filter((w) => schemas[w]),
    ...(src.match(/\b[A-Z][A-Z_]{3,}[A-Z]\b/g) || []).filter((c) => catalog[c]),
  ]).filter((id) => !/^(EP|EN|PROC)-/.test(id) || objFile(id) || macro.has(id));
  const order = (id) => ['SCR', 'EP', 'PROC', 'EN', 'BR', 'FL', 'CALC', 'MSG', 'ADR', 'INV', 'Q'].findIndex((p) => id.startsWith(p + '-'));
  ids.sort((a, b) => ((order(a) + 1 || 99) - (order(b) + 1 || 99)) || a.localeCompare(b, 'en', { numeric: true }));
  return ids.length ? `      <p class="diagram-refs"><b>${t('detailed.diagram.ids')}</b> ${ids.map((id) => linkId(from, id)).join(', ')}</p>` : '';
};
// Swagger UI deep link of an operation: #/<first tag, else default>/<operationId>, spaces as _
const swaggerAnchor = (o) => '/' + [(o.op.tags || [])[0] || 'default', o.op.operationId].map((x) => encodeURIComponent(String(x).replace(/\s/g, '_'))).join('/');
const relTag = (r) => (r ? `<span class="tag accent">${esc(r)}</span>` : '');
const contractTag = (c) => (c === 'frozen' ? `<span class="tag ok">${t('detailed.contract.frozen')}</span>` : c === 'provisional' ? `<span class="tag warn">${t('detailed.contract.provisional')}</span>` : '');
const verbTag = (v) => `<span class="verb ${v}">${v.toUpperCase()}</span>`;
// Words of a story's technical notes: read or write
const accessLabel = (a) => t(isWrite(a) ? 'detailed.access.write' : 'detailed.access.read');
// CRUD letters, their meaning on hover
const crudTag = (a, by = '') => (a ? `<span class="crud" data-tip="${esc(a.split('').map((l) => CRUD_NAMES[l]).join(', ') + (by ? ', ' + by : ''))}">${a}</span>` : '');
const pre = (obj) => `<pre><code>${esc(JSON.stringify(obj, null, 2))}</code></pre>`;
// Roles of the project: those of the x-roles of the operations, public first, then in order of appearance
const ROLES = uniq(['public', ...ops.flatMap((o) => o.roles)]).filter((r) => r !== 'public' || ops.some((o) => o.roles.includes('public')));
const roleLabel = (r) => (r === 'public' ? t('detailed.role.public-long') : `<code>${esc(r)}</code>`);
const fmtDate = (d) => formatDate(String(d || ''), LANG);
// The kind of a change is a code (added, announced, frozen, fix, breaking), shown by its label
const changeLine = (from, c) => {
  const m = c.match(/^([^:]+?)\s*:\s*/);
  return m && CHANGE_KINDS.includes(m[1]) ? `<span class="tag${m[1] === 'breaking' ? ' warn' : ''}">${esc(t(`detailed.change.${m[1]}`))}</span> ${inline(from, c.slice(m[0].length))}` : inline(from, c);
};
// Screens of the macro that call an endpoint (screen, feature, endpoint chain)
const screensOf = (epId) => uniq(callers(epId).flatMap(({ screens }) => screens)).sort((a, b) => byId(a.id, b.id));
const screenLinks = (from, epId, fallback = t('detailed.none.m')) => screensOf(epId).map((s) => (/^SCR-\d+$/.test(s.id) ? anchorLink(from, P.ux, s.id) : esc(s.text))).join(', ') || fallback;

// ---------- Open points ----------
// One row per point: impact, subject, hypothesis kept meanwhile, question asked to the PO. Written once,
// where the answer lands (x-open of an operation, table.open-points of a hand-written page); shown in its
// page and in the single view open-points.html, highest impact first.
const impactLabel = (i) => (IMPACTS.includes(i) ? t(`detailed.impact.${i}`) : i);
const IMPACT_TIPS = Object.fromEntries(IMPACTS.map((i) => [i, t('detailed.impact.tip', { label: impactLabel(i), desc: t(`detailed.impact.desc.${i}`) })]));
const impactTag = (i) => `<span class="impact ${esc(i)}" data-tip="${esc(IMPACT_TIPS[i] || '')}">${esc(impactLabel(i))}</span>`;
const noQuestion = `<span class="none">${t('detailed.open.not-asked')}</span>`;
const openCols = ['impact', 'subject', 'hypothesis', 'question'];
const openHead = openCols.map((c) => ({ label: t(`detailed.open.col.${c}`), col: c }));
const openTable = (rows, withObject = false) => table(withObject ? [{ ...openHead[0], order: IMPACTS }, { label: t('detailed.open.col.object'), col: 'object' }, ...openHead.slice(1)] : openHead,
  rows.map((r) => (withObject
    ? [{ html: impactTag(r.impact), sort: r.impact }, { html: r.object, sort: r.sortKey }, r.subject, r.hypothesis || `<span class="none">${t('detailed.none.f')}</span>`, r.question || noQuestion]
    : [impactTag(r.impact), r.subject, r.hypothesis || `<span class="none">${t('detailed.none.f')}</span>`, r.question || noQuestion])),
  { sortable: withObject, cls: 'open-points' });
// The impact scale, read in every "Open points" (i)
const IMPACT_SCALE = `<ul>${IMPACTS.map((i) => `<li>${impactTag(i)} ${esc(t(`detailed.impact.desc.${i}`))}</li>`).join('')}</ul>`;
// Terms of an (i), in this order: Purpose, Content, Why this format, How to read, Source
const I = { purpose: t('detailed.info.purpose'), content: t('detailed.info.content'), why: t('detailed.info.why'), read: t('detailed.info.read'), source: t('detailed.info.source') };
const OPEN_INFO = (from) => [
  [I.purpose, t('detailed.open.info.purpose')],
  [I.content, t('detailed.open.info.content')],
  [I.why, t('detailed.open.info.why')],
  [I.read, IMPACT_SCALE],
  [I.source, t('detailed.open.info.source', { link: href(from, P.open) })],
];
const openPoints = []; // { impact, subject, hypothesis, question (HTML, relative to the view), object, sortKey, file }
const opOpenRows = (from, o) => o.open.map((v) => ({ impact: v.impact, subject: inline(from, v.subject), hypothesis: v.hypothesis ? inline(from, v.hypothesis) : '', question: v.question ? linkId(from, v.question) : '' }));

// ---------- Cards of the schemas list ----------
// A link to an object page: the id stays short in a dense list, doc.js shows what it is on hover (verb,
// path and role of an endpoint, name of an entity or a process, from xref.js)
const titledLink = (from, id) => idLink(from, id);
// Direction seen from the front: up, sent to the API in the request body; down, received in the response
// (red for an error response)
const DIRS = { in: ['↑', t('detailed.dir.in')], out: ['↓', t('detailed.dir.out')], err: ['↓', t('detailed.dir.err')] };
const dirSign = (d) => `<span class="sc-dir${d === 'err' ? ' err' : ''}" role="img" aria-label="${esc(DIRS[d][1])}" data-tip="${esc(DIRS[d][1])}">${DIRS[d][0]}</span>`;
const sharedTag = `<span class="tag warn">${t('detailed.shared.tag')}</span>`;
// One row per exchanged schema: name, entity, description, then for each direction the endpoints and, for
// a response, its HTTP status (EP-08 201): where the schema sits between front and API
const schemaRow = (file, n) => {
  const u = usage.get(n) || [];
  const groups = ['in', 'out', 'err'].map((d) => {
    const byOp = new Map();
    u.filter((x) => x.dir === d).forEach((x) => { if (!byOp.has(x.op.id)) byOp.set(x.op.id, []); if (d !== 'in' && !byOp.get(x.op.id).includes(x.where)) byOp.get(x.op.id).push(x.where); });
    return { d, list: [...byOp.entries()].sort((a, b) => byId(a[0], b[0])) };
  }).filter((g) => g.list.length);
  const rel = firstRelease(u);
  const tags = [relRank(rel) > 0 ? relTag(rel) : '', shared.has(n) ? sharedTag : ''].filter(Boolean).join(' ');
  const more = [schemas[n]['x-entity'] ? t('detailed.schema.projection-of', { entity: idLink(file, schemas[n]['x-entity'], true) }) : '', inline(file, schemas[n].description || '')].filter(Boolean);
  const eps = groups.map((g) => `${dirSign(g.d)} ${g.list.length === ops.length && ops.length > 1 ? `<span class="sc-all">${t('detailed.schema.all-ops', { n: ops.length })}</span>`
    : g.list.map(([id, st]) => `${titledLink(file, id)}${st.length ? ` <span class="sc-status">${st.join(', ')}</span>` : ''}`).join(', ')}`).join('<br>');
  return `<li><div class="sc-name">${ctLink(file, n)}${tags ? ' ' + tags : ''}${more.map((x) => `<span class="sc-desc">${x}</span>`).join('')}</div><div class="sc-eps">${eps}</div></li>`;
};
const schemaCards = (file) => {
  const list = Object.keys(schemas).filter(isExchanged);
  const cards = domains.map((d) => ({ d, names: list.filter((n) => domainOf(n) === d) })).filter((x) => x.names.length).map(({ d, names }) => `        <article class="obj-card">
          <header><span class="obj-title">${esc(domainLabels.get(d))}</span><span class="obj-count">${t('detailed.schema.count', { n: names.length })}</span></header>
          <ul class="schema-rows detail">
${names.map((n) => '            ' + schemaRow(file, n)).join('\n')}
          </ul>
        </article>`);
  const later = REL_ORDER[1];
  return `      <div class="obj-cards wide">
${cards.join('\n')}
      </div>
      <p class="obj-legend">${['in', 'out', 'err'].map((d) => `<span>${dirSign(d)} ${DIRS[d][1]}</span>`).join('')}<span><span class="sc-status">201</span> ${t('detailed.legend.status')}</span><span>${relTag(later)} ${t('detailed.legend.release', { first: REL_ORDER[0] })}</span>${shared.size ? `<span>${sharedTag} ${t('detailed.legend.shared')}</span>` : ''}</p>`;
};

// A page in the team's format
const page = ({ file, title, tocType, kicker, kind, h1, lede, meta = [], body, wide = false, head = '', scripts = '', source = API }) => {
  const a = (f, anchor) => href(file, f, anchor);
  return `<!doctype html>
${MARK}
<html lang="${esc(LANG)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} · ${esc(project)}</title>
  <link rel="icon" href="data:,">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${a(join(P.assets, 'doc.css'))}">
${head}</head>
<body>
<div class="doc">
  <aside class="doc-toc">
    <div class="toc-project">${esc(project)}</div>
    <div class="toc-type">${esc(tocType)}</div>
    <nav></nav>
    <div class="toc-back"><a href="${a(P.summary)}">${t('detailed.back.summary')}</a><br><a href="${a(P.macro)}">${t('detailed.back.macro')}</a><br><a href="${a(P.portal)}">${t('detailed.back.portal')}</a></div>
  </aside>

  <main class="doc-main${wide ? ' wide' : ''}">
    <header class="doc-header">
      <div class="kicker">${kicker}</div>
      <h1>${t('detailed.heading', { kind: `<span class="doc-kind">${kind}</span>`, title: h1 })}</h1>
${lede ? `      <p class="lede">${lede}</p>\n` : ''}      <div class="meta">
${meta.map((m) => `        <span>${m}</span>`).join('\n')}
        <span><b>${t('detailed.meta.source')}</b> ${source ? t('detailed.meta.source.contract', { file: `<a href="${a(source)}">${source === API ? 'openapi.yaml' : esc(relApi(source))}</a>`, version: esc(version) }) : t('detailed.meta.source.hand', { file: `<a href="${a(API)}">openapi.yaml</a>` })}</span>
      </div>
    </header>
${body}
  </main>
</div>
<script src="${a(join(P.assets, 'doc.js'))}"></script>
${scripts}</body>
</html>
`;
};
// A section of a generated page, always with its "i": a list of [term, definition] pairs, in this order:
// À quoi sert, Contenu, Pourquoi ce formalisme (mandatory), then Lire, Source when needed (skill, (i) format)
const infoBody = (pairs) => `      <div class="info-body" hidden>
        <dl class="defs">
${pairs.filter(Boolean).map(([t, d]) => `          <dt>${t}</dt><dd>${d}</dd>`).join('\n')}
        </dl>
      </div>
`;
const section = (title, inner, id, info) => `
    <section class="section"${id ? ` id="${id}"` : ''}>
      <h2>${title}</h2>
${info ? infoBody(info) : ''}${inner}
    </section>`;
// A head is a label or { label, order } (order: values ranked in this order when sorting); a cell is HTML
// or { html, sort } (sort: the value doc.js sorts on). sortable: doc.js sorts on a click on a column head.
const table = (head, rows, { sortable = false, cls = '' } = {}) => rows.length ? `      <table${cls ? ` class="${cls}"` : ''}${sortable ? ' data-sortable' : ''}>
        <thead><tr>${head.map((h) => (typeof h === 'string' ? `<th>${h}</th>` : `<th${h.order ? ` data-sort-order="${esc(h.order.join('|'))}"` : ''}>${h.label}</th>`)).join('')}</tr></thead>
        <tbody>
${rows.map((r) => `          <tr${r.id ? ` id="${r.id}"` : ''}>${(r.cells || r).map((c) => (c && typeof c === 'object' ? `<td data-sort-value="${esc(c.sort)}">${c.html}</td>` : `<td>${c}</td>`)).join('')}</tr>`).join('\n')}
        </tbody>
      </table>` : `      <p>${t('detailed.table.empty')}</p>`;
// what: 'operation' or 'schema', the object the additions are described in
const announcedSection = (from, list, what) => (list.length ? section(t('detailed.announced.title'), table([t('detailed.announced.col.release'), t('detailed.announced.col.addition'), t('detailed.announced.col.where')], list.sort((a, b) => relRank(a.release) - relRank(b.release)).map((x) => [relTag(x.release), x.what, inline(from, x.where)])), 'announced-additions', [
  [I.purpose, t(`detailed.announced.info.purpose.${what}`)],
  [I.content, t('detailed.announced.info.content')],
  [I.why, t('detailed.announced.info.why', { inv: invLink(from, 'INV-58') })],
  [I.read, t('detailed.announced.info.read', { code: codeLink(from, 'VALIDATION') })],
  [I.source, t('detailed.announced.info.source')],
]) : '');

// ---------- Schema to rows ----------
const typeLabel = (from, s) => {
  if (!s) return '';
  if (s.$ref) return ctLink(from, refName(s.$ref));
  const types = Array.isArray(s.type) ? s.type : s.type ? [s.type] : [];
  const nullable = types.includes('null');
  const base = types.filter((t) => t !== 'null');
  let ty;
  if (base[0] === 'array') ty = t('detailed.type.array', { items: s.items ? typeLabel(from, s.items) : t('detailed.type.values') });
  else if (base[0] === 'object' || (!base.length && s.properties)) ty = t('detailed.type.object');
  else ty = base.length ? `<code>${base.join(' | ')}</code>` : t('detailed.type.value');
  return nullable ? t('detailed.type.nullable', { type: ty, null: '<code>null</code>' }) : ty;
};
const constraints = (s) => {
  if (!s || s.$ref) return '';
  const c = [];
  const later = (s['x-enum-releases']) || {};
  if (s.format) c.push(t('detailed.constraint.format', { v: `<code>${esc(s.format)}</code>` }));
  if (s.enum) c.push(s.enum.map((v) => `<code>${esc(v)}</code>${later[v] ? ' ' + relTag(later[v]) : ''}`).join(', '));
  if (s.pattern) c.push(t('detailed.constraint.pattern', { v: `<code>${esc(s.pattern)}</code>` }));
  if (s.minimum != null || s.maximum != null) c.push(s.minimum != null && s.maximum != null ? t('detailed.constraint.range', { min: s.minimum, max: s.maximum }) : s.minimum != null ? t('detailed.constraint.min', { min: s.minimum }) : t('detailed.constraint.max', { max: s.maximum }));
  if (s.minLength != null || s.maxLength != null) c.push(s.minLength != null && s.maxLength != null ? t('detailed.constraint.length-range', { min: s.minLength, max: s.maxLength, n: s.maxLength }) : s.maxLength != null ? t('detailed.constraint.max-length', { n: s.maxLength }) : t('detailed.constraint.min-length', { n: s.minLength }));
  if (s.minItems != null) c.push(t('detailed.constraint.min-items', { n: s.minItems }));
  if (s.uniqueItems) c.push(t('detailed.constraint.unique'));
  if (s.default != null) c.push(t('detailed.constraint.default', { v: `<code>${esc(s.default)}</code>` }));
  if (s.additionalProperties === false) c.push(t('detailed.constraint.closed'));
  return c.join(' ; ');
};
const fieldRows = (from, s, prefix = '', rows = []) => {
  const req = new Set(s.required || []);
  for (const [name, p] of Object.entries(s.properties || {})) {
    const full = prefix + name;
    const forCodes = p['x-for-codes'] ? ' ' + t('detailed.field.for-codes', { codes: p['x-for-codes'].map((c) => codeLink(from, c)).join(', ') }) : '';
    rows.push([`<code>${esc(full)}</code>${p['x-release'] ? ' ' + relTag(p['x-release']) : ''}`, typeLabel(from, p), req.has(name) ? t('detailed.yes') : t('detailed.no'), constraints(p), inline(from, p.description || '') + forCodes]);
    const types = Array.isArray(p.type) ? p.type : [p.type];
    if (!p.$ref && p.properties && types.includes('object')) fieldRows(from, p, full + '.', rows);
    if (p.type === 'array' && p.items && !p.items.$ref && p.items.properties) fieldRows(from, p.items, full + '[].', rows);
  }
  return rows;
};

// ---------- Endpoint pages ----------
// Reading order of an operation, the one of OpenAPI: what the front sends, what it gets back, what the API
// does in between (facts, then the sequence), how the operation will grow, what is still open
const out = new Map(); // file -> content
ops.forEach((o) => {
  const file = epFile(o.id);
  const L = (t) => inline(file, t);
  const meta = [
    `<b>${t('detailed.ep.meta.status')}</b> ${contractTag(o.contract)}`,
    `<b>${t('detailed.ep.meta.rights')}</b> ${o.roles.map(roleLabel).join(', ')}`,
    `<b>${t('detailed.ep.meta.module')}</b> ${moduleLink(file, o.module)}`,
    `<b>${t('detailed.ep.meta.screens')}</b> ${screenLinks(file, o.id)}`,
    `<b>${t('detailed.ep.meta.release')}</b> ${relTag(o.release)}`,
    `<b>operationId</b> <code>${esc(o.op.operationId || '')}</code>${o.op.operationId ? ` <a href="${href(file, P.swagger, swaggerAnchor(o))}">${t('detailed.ep.meta.swagger')}</a>` : ''}`,
  ];
  let body = '';
  if (o.contract === 'provisional') body += `\n      <div class="callout warn"><b>${t('detailed.ep.provisional.title')}</b>${t('detailed.ep.provisional.text')}</div>`;
  // Request: parameters and body
  let req = '';
  if (o.params.length) req += `      <h3>${t('detailed.ep.params')}</h3>\n${table(['name', 'in', 'type', 'required', 'constraints', 'description'].map((c) => t(`detailed.ep.params.col.${c}`)), o.params.map((p) => [
    `<code>${esc(p.name)}</code>${p['x-release'] ? ' ' + relTag(p['x-release']) : ''}`, esc(p.in), typeLabel(file, p.schema), p.required ? t('detailed.yes') : t('detailed.no'),
    constraints(p.schema && p.schema.$ref ? deref(p.schema) : p.schema), L(p.description || ''),
  ]))}\n`;
  if (o.body) {
    const n = directRefs(o.body.schema);
    req += `      <h3>${t('detailed.ep.body')}</h3>
      <dl class="defs">
        <dt>${t('detailed.ep.body.schema')}</dt><dd>${dirSign('in')} ${n.length ? n.map((x) => ctLink(file, x)).join(', ') : typeLabel(file, o.body.schema)}, ${o.body.required ? t('detailed.ep.body.required') : t('detailed.ep.body.optional')}</dd>
      </dl>
${o.body.example ? `      ${pre(o.body.example)}\n` : ''}`;
  }
  body += section(t('detailed.ep.request'), req || `      <p>${t('detailed.ep.request.none')}</p>`, 'request', [
    [I.purpose, t('detailed.ep.request.info.purpose')],
    [I.content, t('detailed.ep.request.info.content')],
    [I.why, t('detailed.ep.request.info.why', { swagger: href(file, P.swagger) })],
  ]);
  // Responses: success and errors in one table, the common errors on one line
  const rows = [];
  const common = [];
  o.responses.forEach((r) => {
    const isErr = /^[45]/.test(r.status);
    if (!isErr) { rows.push([`<code>${r.status}</code>`, r.schema ? `${dirSign('out')} ${typeLabel(file, r.schema)}` : t('detailed.ep.no-body'), '', L(r.res.description || '')]); return; }
    if (!r.codes.length) { rows.push([`<code>${r.status}</code>`, r.schema ? `${dirSign('err')} ${typeLabel(file, r.schema)}` : t('detailed.ep.no-body'), '', L(r.res.description || '')]); return; }
    r.codes.forEach((c) => {
      if (GENERIC_CODES.includes(c)) { common.push(`<code>${r.status}</code> ${codeLink(file, c)}`); return; }
      const fields = fieldsFor(c);
      rows.push([`<code>${r.status}</code>`, `${dirSign('err')} ${ctLink(file, errorSchemaName)}${fields.length ? ' + ' + fields.map((f) => `<code>${f}</code>`).join(', ') : ''}`, codeLink(file, c),
        L(r.codes.length > 1 ? (catalog[c] || {}).case || r.res.description : r.res.description || (catalog[c] || {}).case || '')]);
    });
  });
  const okEx = o.responses.filter((r) => !/^[45]/.test(r.status) && r.example);
  const koEx = o.responses.filter((r) => /^[45]/.test(r.status) && r.example && !r.codes.every((c) => GENERIC_CODES.includes(c)));
  body += section(t('detailed.ep.responses'), `${table(['status', 'body', 'code', 'case'].map((c) => t(`detailed.ep.responses.col.${c}`)), rows)}
${common.length ? `      <p class="common-errors"><b>${t('detailed.ep.common-errors')}</b> ${common.join(', ')}</p>\n` : ''}${[...okEx.map((r) => `      <h3>${t('detailed.ep.example', { status: r.status })}</h3>\n      ${pre(r.example)}`), ...koEx.map((r) => `      <h3>${t('detailed.ep.example', { status: `${r.status} ${esc(r.example.code || '')}` })}</h3>\n      ${pre(r.example)}`)].join('\n')}`, 'responses', [
    [I.purpose, t('detailed.ep.responses.info.purpose')],
    [I.content, t('detailed.ep.responses.info.content', { code: ctLink(file, CODE_SCHEMA) })],
    [I.why, t('detailed.ep.responses.info.why')],
    [I.read, t('detailed.ep.responses.info.read', { schema: ctLink(file, errorSchemaName), errors: href(file, P.errors) })],
  ]);
  // Behaviour: the facts a dev codes against
  const dc = o.op['x-data-control'] || [];
  const data = [...crudOf(entityAccess(o)).values()].sort((a, b) => byId(a.id, b.id));
  body += section(t('detailed.ep.behaviour'), `      <dl class="defs">
        <dt>${t('detailed.ep.behaviour.does')}</dt><dd>${L(o.op.description || o.op.summary || '')}</dd>
        <dt>${t('detailed.ep.behaviour.controls')}</dt><dd>${dc.length ? `<ul>${dc.map((d) => `<li>${L(d)}</li>`).join('')}</ul>` : t('detailed.ep.behaviour.controls.none')}</dd>
        <dt>${t('detailed.ep.behaviour.processes')}</dt><dd>${o.processes.length ? o.processes.map((x) => idLink(file, x, true)).join('<br>') : t('detailed.ep.behaviour.processes.none')}</dd>
        <dt>${t('detailed.ep.behaviour.rules')}</dt><dd>${o.rules.length ? o.rules.map((r) => L(r)).join(', ') : t('detailed.ep.behaviour.rules.none')}</dd>
        <dt>${t('detailed.ep.behaviour.idempotence')}</dt><dd>${o.op['x-idempotence'] ? L(o.op['x-idempotence']) : writes(o) ? '' : t('detailed.ep.behaviour.idempotence.read')}</dd>
        <dt>${t('detailed.ep.behaviour.data')}</dt><dd>${data.map((e) => `${idLink(file, e.id, true)} ${crudTag(e.access)} ${byParts(file, e)}`).join('<br>') || t('detailed.none.f')}</dd>
      </dl>`, 'behaviour', [
    [I.purpose, t('detailed.ep.behaviour.info.purpose')],
    [I.content, t('detailed.ep.behaviour.info.content')],
    [I.why, t('detailed.ep.behaviour.info.why')],
    [I.read, t('detailed.ep.behaviour.info.read', { inv: invLink(file, 'INV-56') })],
    [I.source, t('detailed.ep.behaviour.info.source')],
  ]);
  // Sequence
  if (o.op['x-sequence']) body += section(t('detailed.ep.sequence'), `<pre class="mermaid">\n${o.op['x-sequence'].trimEnd().replace(/&/g, '&amp;').replace(/</g, '&lt;')}\n</pre>\n${diagramRefs(file, o.op['x-sequence'])}`, 'sequence', [
    [I.purpose, t('detailed.ep.sequence.info.purpose')],
    [I.content, t('detailed.ep.sequence.info.content')],
    [I.why, t('detailed.ep.sequence.info.why')],
    [I.read, t('detailed.ep.sequence.info.read')],
    [I.source, t('detailed.ep.sequence.info.source')],
  ]);
  // Additions announced for a later release
  body += announcedSection(file, announcedOfOp(o), 'operation');
  // Open points
  if (o.open.length) {
    const rowsOpen = opOpenRows(file, o);
    body += section(t('detailed.open.title'), openTable(rowsOpen), 'open-points', OPEN_INFO(file));
    o.open.forEach((v) => openPoints.push({ impact: v.impact, subject: inline(P.open, v.subject), hypothesis: v.hypothesis ? inline(P.open, v.hypothesis) : '', question: v.question ? linkId(P.open, v.question) : '',
      object: `<a href="${href(P.open, file, 'open-points')}">${o.id}</a> <code>${esc(o.short)}</code> ${contractTag(o.contract)}`, sortKey: `2 ${String(num(o.id)).padStart(3, '0')}` }));
  }
  out.set(file, page({
    file, title: `${o.id} ${o.short}`, tocType: t('detailed.ep.toc-type', { id: o.id }), kicker: `${t('detailed.kicker')} · <a href="${href(file, P.summary, 'endpoints')}">${t('detailed.kicker.endpoints')}</a>`,
    kind: o.id, h1: `${verbTag(o.verb)} <code>/api${esc(o.path)}</code>`, lede: esc(o.op.summary || ''), meta, body, source: o.source,
  }));
});

// ---------- Schema pages (shared types have none: a row of the schemas list) ----------
const firstRelease = (list) => list.map((u) => u.op.release).sort((a, b) => relRank(a) - relRank(b))[0] || '';
const sharedCallout = (from, n) => {
  const s = shared.get(n);
  return s ? `\n      <div class="callout warn"><b>${t('detailed.schema.shared.title')}</b>${t('detailed.schema.shared.text', { frozen: s.frozen.map((id) => idLink(from, id)).join(', '), provisional: s.provisional.map((id) => idLink(from, id)).join(', '), inv: invLink(from, 'INV-58') })}</div>` : '';
};
const LAYER = t('detailed.schema.layer');
Object.entries(schemas).filter(([name]) => isExchanged(name)).forEach(([name, s]) => {
  const file = ctFile(name);
  const L = (t) => inline(file, t);
  const direct = usage.get(name) || [];
  const carried = carriedBy(name);
  const all = [...direct, ...carried];
  const meta = [`<b>${t('detailed.schema.meta.layer')}</b> ${LAYER}`];
  if (s['x-entity']) meta.push(`<b>${t('detailed.schema.meta.projection')}</b> ${idLink(file, s['x-entity'], true)}`);
  if (direct.every((u) => u.op.contract === 'provisional')) meta.push(`<b>${t('detailed.schema.meta.status')}</b> ${contractTag('provisional')}`);
  else if (direct.every((u) => u.op.contract === 'frozen')) meta.push(`<b>${t('detailed.schema.meta.status')}</b> ${contractTag('frozen')}`);
  else meta.push(`<b>${t('detailed.schema.meta.status')}</b> ${t('detailed.schema.meta.both', { frozen: contractTag('frozen'), provisional: contractTag('provisional') })}`);
  if (all.length) meta.push(`<b>${t('detailed.schema.meta.first-release')}</b> ${relTag(firstRelease(all))}`);
  let body = sharedCallout(file, name);
  // Placement: one row per endpoint, direction and carrier; the statuses of the responses in one cell
  const place = new Map();
  all.forEach((u) => {
    const via = u.via && u.via.length ? u.via : [];
    const key = `${u.op.id}|${u.dir}|${via.join('>')}`;
    if (!place.has(key)) place.set(key, { u, via, where: [] });
    const p = place.get(key);
    if (u.dir !== 'in' && !p.where.includes(u.where)) p.where.push(u.where);
  });
  const placeRows = [...place.values()].sort((a, b) => byId(a.u.op.id, b.u.op.id) || ['in', 'out', 'err'].indexOf(a.u.dir) - ['in', 'out', 'err'].indexOf(b.u.dir)).map(({ u, via, where }) => {
    const front = screenLinks(file, u.op.id, 'front');
    const flow = u.dir === 'in' ? `${front} → API` : `API → ${front}`;
    const statuses = where.map((w) => `<code>${esc(w.split(' ')[0])}</code>${w.includes(' ') ? ' ' + w.split(' ').slice(1).join(' ').split(', ').map((c) => (catalog[c] ? codeLink(file, c) : esc(c))).join(', ') : ''}`).join(', ');
    const msg = (u.dir === 'in' ? t('detailed.placement.msg.request') : t(u.dir === 'err' ? 'detailed.placement.msg.error' : 'detailed.placement.msg.response', { statuses }))
      + (via.length ? t('detailed.placement.msg.inside', { chain: via.map((v) => ctLink(file, v)).join(t('detailed.placement.msg.inside-sep')) }) : '');
    return [dirSign(u.dir), flow, `${idLink(file, u.op.id)} <code>${esc(u.op.short)}</code>`, msg, contractTag(u.op.contract)];
  });
  body += section(t('detailed.placement'), table(['dir', 'flow', 'endpoint', 'message', 'status'].map((c) => t(`detailed.placement.col.${c}`)), placeRows), 'placement', [
    [I.purpose, t('detailed.placement.info.purpose')],
    [I.content, t('detailed.placement.info.content')],
    [I.why, t('detailed.placement.info.why')],
    [I.read, t('detailed.placement.info.read')],
    [I.source, t('detailed.placement.info.source', { macro: href(file, P.macro) })],
  ]);
  if (s.properties) body += section(t('detailed.fields'), table(['field', 'type', 'required', 'constraints', 'description'].map((c) => t(`detailed.fields.col.${c}`)), fieldRows(file, s)) + (s.additionalProperties === false ? `\n      <p>${t('detailed.fields.closed')}</p>` : ''), 'fields', [
    [I.purpose, t('detailed.fields.info.purpose')],
    [I.content, t('detailed.fields.info.content')],
    [I.why, t('detailed.fields.info.why', { swagger: href(file, P.swagger) })],
  ]);
  else body += section(t('detailed.format'), `      <dl class="defs">
        <dt>${t('detailed.format.type')}</dt><dd>${typeLabel(file, s)}</dd>
        ${constraints(s) ? `<dt>${t('detailed.format.constraints')}</dt><dd>${constraints(s)}</dd>` : ''}
      </dl>`, 'format', [
    [I.purpose, t('detailed.format.info.purpose')],
    [I.content, t('detailed.format.info.content')],
    [I.why, t('detailed.format.info.why')],
    [I.source, '<code>openapi.yaml</code>.'],
  ]);
  // Example: the schema's own, else the first request or response example of an endpoint that sends it whole
  const ex = (s.examples && s.examples[0])
    ?? direct.map((u) => (u.dir === 'in' ? u.op.body.example : u.op.responses.find((r) => r.status === u.where && r.schema && r.schema.$ref)?.example)).find((e) => e !== undefined);
  if (ex !== undefined && s.properties) body += section(t('detailed.example'), '      ' + pre(ex), 'example', [
    [I.purpose, t('detailed.example.info.purpose')],
    [I.content, t('detailed.example.info.content')],
    [I.why, t('detailed.example.info.why')],
    [I.source, t('detailed.example.info.source')],
  ]);
  body += announcedSection(file, announcedIn(name), 'schema');
  out.set(file, page({
    file, title: t('detailed.schema.title', { name }), tocType: t('detailed.schema.title', { name }),
    kicker: `${t('detailed.kicker')} · <a href="${href(file, P.schemas)}">${t('detailed.kicker.schemas')}</a>`, kind: t('detailed.schema.kind'),
    h1: `<code>${esc(name)}</code>`, lede: L(s.description || ''), meta, body, source: componentSource[`schemas/${name}`] || API,
  }));
});

// ---------- Schemas list: exchanged schemas by domain, shared types, changelog ----------
const typeFormat = (from, n) => {
  const s = schemas[n];
  if (n === CODE_SCHEMA && s['x-error-catalog']) return t('detailed.types.error-codes', { n: s.enum.length, catalog: href(from, P.errors) });
  if (s.properties) {
    const req = new Set(s.required || []);
    return t('detailed.types.object', { fields: Object.entries(s.properties).map(([f, p]) => `<code>${esc(f)}</code> ${typeLabel(from, p)}${constraints(p) && !p.$ref ? ` (${constraints(p)})` : ''}${req.has(f) ? '' : t('detailed.types.optional')}`).join(t('detailed.types.sep')) });
  }
  return [typeLabel(from, s), constraints(s)].filter(Boolean).join(', ');
};
{
  const file = P.schemas;
  const names = Object.keys(schemas).sort((a, b) => a.localeCompare(b));
  const exchangedCount = names.filter(isExchanged).length;
  const typeRows = names.filter((n) => !isExchanged(n)).map((n) => ({ id: n, cells: [`<code>${n}</code>`, typeFormat(file, n),
    (containedIn.get(n) || []).map((p) => ctLink(file, p)).join(', '), inline(file, schemas[n].description || ''),
    announcedIn(n).map((a) => `${a.what} ${relTag(a.release)}`).join('<br>')] }));
  const logRows = changelog.map((e) => ({ id: 'v' + e.version, cells: [`<b>${esc(e.version)}</b>`, fmtDate(e.date), `<ul>${(e.changes || []).map((c) => `<li>${changeLine(file, String(c))}</li>`).join('')}</ul>`] }));
  const body = section(t('detailed.schemas.exchanged'), schemaCards(file), 'schemas', [
    [I.purpose, t('detailed.schemas.exchanged.info.purpose')],
    [I.content, t('detailed.schemas.exchanged.info.content')],
    [I.why, t('detailed.schemas.exchanged.info.why')],
    [I.read, t('detailed.schemas.exchanged.info.read')],
    [I.source, '<code>openapi.yaml</code>.'],
  ])
    + section(t('detailed.types'), table(['type', 'format', 'used-in', 'description', 'announced'].map((c) => t(`detailed.types.col.${c}`)), typeRows), 'types', [
      [I.purpose, t('detailed.types.info.purpose')],
      [I.content, t('detailed.types.info.content')],
      [I.why, t('detailed.types.info.why')],
      [I.read, t('detailed.types.info.read', { inv: invLink(file, 'INV-59') })],
    ])
    + section(t('detailed.changelog'), table(['version', 'date', 'changes'].map((c) => t(`detailed.changelog.col.${c}`)), logRows), 'changelog', [
      [I.purpose, t('detailed.changelog.info.purpose')],
      [I.content, t('detailed.changelog.info.content')],
      [I.why, t('detailed.changelog.info.why', { inv: invLink(file, 'INV-58') })],
      [I.source, t('detailed.changelog.info.source')],
    ]);
  out.set(file, page({
    file, title: t('detailed.schemas.title'), tocType: t('detailed.schemas.title'), kicker: `${t('detailed.kicker')} · <a href="${href(file, P.summary)}">${t('detailed.kicker.summary')}</a>`,
    kind: t('detailed.schemas.title'), h1: t('detailed.schemas.h1'), meta: [t('detailed.schemas.meta', { version: esc(version), date: fmtDate((changelog[0] || {}).date) })],
    lede: t('detailed.schemas.lede', { exchanged: t('detailed.schemas.lede.exchanged', { n: exchangedCount }), types: t('detailed.schemas.lede.types', { n: typeRows.length }), swagger: href(file, P.swagger) }), body, wide: true,
  }));
}

// ---------- Swagger UI view ----------
// The spec is embedded as JSON: Swagger UI never fetches it, so the page works from file://. Try it out is
// off, the page reads the contract. doc.css styles bare elements (code, pre, th): reset inside #swagger-ui.
{
  const file = P.swagger;
  const SW = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.29.1/';
  // Swagger UI 5 cannot resolve a $ref from file:// (its resolver evaluates the page URI and fails): the
  // embedded copy is the bundled spec with every reference inlined, a schema keeping its name as title,
  // and no x- extension
  const inlineRefs = (node, stack = []) => {
    if (Array.isArray(node)) return node.map((x) => inlineRefs(x, stack));
    if (!node || typeof node !== 'object') return node;
    if (typeof node.$ref === 'string' && node.$ref.startsWith('#/')) {
      if (stack.includes(node.$ref)) { warn(`swagger.html: circular reference ${node.$ref} left as is`); return node; }
      const { $ref, ...siblings } = node;
      const tgt = inlineRefs(deref(node), [...stack, $ref]);
      return { ...($ref.includes('/schemas/') && !tgt.title ? { title: refName($ref) } : {}), ...tgt, ...inlineRefs(siblings, stack) };
    }
    // the team's x- extensions are not shown by Swagger UI: left out, the page stays light
    return Object.fromEntries(Object.entries(node).filter(([k]) => !k.startsWith('x-')).map(([k, v]) => [k, inlineRefs(v, stack)]));
  };
  const embedded = inlineRefs(spec);
  // responses and parameters are now inside each operation; schemas stay for the Schemas section
  if (embedded.components) embedded.components = { schemas: embedded.components.schemas, securitySchemes: embedded.components.securitySchemes };
  const json = JSON.stringify(embedded).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const head = `  <link rel="stylesheet" href="${SW}swagger-ui.min.css" integrity="sha512-QIJpSy6rqOKoEjIR+Pp7r5lTkNPJPJCRejWzG4jb12bCT1EeL/vcjZtk4NNKeEuVRXY+d34d/t9y1CHzZbgeJQ==" crossorigin="anonymous" referrerpolicy="no-referrer">
  <style>
    html { scroll-behavior: auto; }
    #swagger-ui code, #swagger-ui pre { font-size: inherit; }
    #swagger-ui code { background: none; padding: 0; border-radius: 0; }
    #swagger-ui th { text-transform: none; letter-spacing: normal; background: none; font-size: inherit; }
    #swagger-ui th, #swagger-ui td { border-bottom: 0; }
    #swagger-ui .information-container { display: none; }
    #swagger-ui .wrapper { padding: 0; max-width: none; }
  </style>
`;
  const scripts = `<script src="${SW}swagger-ui-bundle.min.js" integrity="sha512-yfAKqi7F3JSDZA7V/XTql3caj2o8A81yg2EWIBykt2BJjLjNYnsd4CVAKvrFp/nYl9HQX7R06Z6e5KBn5aoj6g==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script>
  window.OPENAPI_SPEC = ${json};
  // After doc.js (DOMContentLoaded) so that its passes leave the Swagger UI tree alone
  window.addEventListener('load', function () {
    if (!window.SwaggerUIBundle) { document.getElementById('swagger-ui').textContent = ${JSON.stringify(t('detailed.swagger.failed')).replace(/</g, '\\u003c')}; return; }
    window.ui = window.SwaggerUIBundle({
      spec: window.OPENAPI_SPEC, dom_id: '#swagger-ui', deepLinking: true, layout: 'BaseLayout',
      presets: [window.SwaggerUIBundle.presets.apis], supportedSubmitMethods: [], defaultModelsExpandDepth: 0,
      displayOperationId: true, docExpansion: 'list',
      // Swagger UI opens the deep-linked operation but scrolls before the layout settles: scroll again
      onComplete: function () {
        var m = location.hash.match(/^#[/]([^/]+)[/]([^/]+)$/);
        if (!m) return;
        // Swagger UI's own animated scroll ends on a stale offset: realign until the layout settles,
        // unless the reader has started to scroll
        var stop = false, cancel = function () { stop = true; };
        ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (e) { window.addEventListener(e, cancel, { once: true }); });
        [300, 800, 1500, 2500].forEach(function (t) {
          setTimeout(function () {
            var el = document.getElementById('operations-' + decodeURIComponent(m[1]) + '-' + decodeURIComponent(m[2]));
            if (el && !stop) el.scrollIntoView({ block: 'start' });
          }, t);
        });
      },
    });
  });
</script>
`;
  const body = section(t('detailed.swagger.section'), '      <div id="swagger-ui"></div>', 'swagger', [
    [I.purpose, t('detailed.swagger.info.purpose')],
    [I.content, t('detailed.swagger.info.content')],
    [I.why, t('detailed.swagger.info.why')],
    [I.read, t('detailed.swagger.info.read', { endpoints: href(file, P.summary, 'endpoints') })],
    [I.source, t('detailed.swagger.info.source', { openapi: href(file, P.openapi) })],
  ]);
  out.set(file, page({
    file, title: t('detailed.swagger.title'), tocType: t('detailed.swagger.section'), kicker: `${t('detailed.kicker')} · <a href="${href(file, P.summary)}">${t('detailed.kicker.summary')}</a>`,
    kind: 'Swagger UI', h1: `<code>openapi.yaml</code>`, lede: t('detailed.swagger.lede', { title: esc(spec.info.title), version: esc(version), ops: t('detailed.swagger.lede.ops', { n: ops.length }) }),
    meta: [`<a href="${href(file, P.schemas)}">${t('detailed.swagger.schemas-link')}</a>`], body, wide: true, head, scripts,
  }));
}

// ---------- xref.js for the macro ----------
{
  const items = {}, exchanged = {};
  ops.forEach((o) => {
    items[o.id] = { href: 'endpoints/' + o.id + '.html', title: t('detailed.xref.endpoint', { short: o.short, summary: o.op.summary || '' }) };
    const c = opSchemas(o);
    if (c.length) exchanged[o.id] = c.map((x) => ({ name: x.name, dir: x.dir, status: x.status || '', href: 'schemas/' + x.name + '.html' }));
  });
  entities.forEach((e) => { items[e.id] = { href: 'entities/' + e.id + '.html', title: e.name }; });
  processes.forEach((p) => { items[p.id] = { href: 'processes/' + p.id + '.html', title: p.name }; });
  out.set(join(DET, 'xref.js'), `// Generated by team/scripts/detailed-pages.mjs from api/openapi.yaml: do not edit, run the script.
// Read by doc.js: the cards of the macro link to these pages, endpoints show their schemas (xrefs()), and
// every link to an EP, EN or PROC page shows its title on hover (objTips(), which loads this file itself).
(function () {
  var s = document.currentScript;
  window.DOC_XREF = {
    base: s ? s.src.replace(/[^/]*$/, '') : '',
    items: ${JSON.stringify(items, null, 2).replace(/\n/g, '\n    ')},
    schemas: ${JSON.stringify(exchanged, null, 2).replace(/\n/g, '\n    ')}
  };
})();
`);
}

// ---------- Generated blocks in hand-written pages ----------
const rulesLinks = (file, list) => list.map((r) => inline(file, r)).join(', ');
const screenNodes = () => [...macro.values()].filter((n) => n.type === 'screen' && /^SCR-\d+$/.test(n.id)).sort((a, b) => byId(a.id, b.id));
// Address and parameters, what comes from another screen, accessible roles and names: written by hand in
// table.screen-details of the screens page, one row per screen (first cell: its SCR-xx)
const screenDetails = (html) => {
  const t = (html.match(/<table class="screen-details">[\s\S]*?<\/table>/) || [])[0];
  if (!t) return null;
  return new Map(tableRows(t).map((cells) => [(cellText(cells[0] || '').match(/\bSCR-\d+\b/) || [])[0], cells]).filter(([id]) => id));
};
// Messages of an "On screen" text of the catalog (screen) that concern a screen: a message follows the
// screens named just before it ("SCR-04, SCR-03, MSG-03"); a text that names no screen concerns them all
const msgsOfScreenText = (text, ec) => {
  const res = [];
  let current = null, lastWasEc = false;
  (String(text || '').match(/\bSCR-\d+\b|\bMSG-U?\d+\b/g) || []).forEach((t) => {
    if (/^SCR-/.test(t)) { current = lastWasEc && current ? [...current, t] : [t]; lastWasEc = true; return; }
    lastWasEc = false;
    if (!current || current.includes(ec)) res.push(t);
  });
  return res;
};
const screenEndpoints = (s) => uniq(s.links.flatMap((f) => ((macro.get(f) || {}).links || [])).filter((id) => opById.has(id))).sort(byId);
// State machine of an entity: the Mermaid stateDiagram drawn from the transitions table of the page
// (table.transitions: from, to, event, guard, action), so that the table is written once. A state without
// an outgoing transition is final.
const stateDiagram = (file, html) => {
  const tbl = (html.match(/<table class="transitions">[\s\S]*?<\/table>/) || [])[0];
  if (!tbl) { err(`${relative(DOCS, file)}: block state-diagram without a table class="transitions" in the page`); return `      <p>${t('detailed.state.none')}</p>`; }
  const rows = tableRows(tbl).map((cells) => cells.map(cellText));
  const sid = (s) => (!s || s === '[*]' ? '[*]' : s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, ''));
  const states = uniq(rows.flatMap(([a, b]) => [a, b]).filter((s) => s && s !== '[*]'));
  const outgoing = new Set(rows.map(([a]) => a));
  const lines = ['stateDiagram-v2', ...states.map((s) => `  state "${s.replace(/"/g, '')}" as ${sid(s)}`),
    ...rows.map(([a, b, ev]) => `  ${sid(a)} --> ${sid(b)}${ev ? ': ' + ev.replace(/[:;#]/g, ' ').replace(/\s+/g, ' ').trim() : ''}`),
    ...states.filter((s) => !outgoing.has(s)).map((s) => `  ${sid(s)} --> [*]`)];
  rows.forEach((cells, i) => { if (cells.length < 4) err(`${relative(DOCS, file)}: transitions, row ${i + 1}: columns From, To, Event, Guard, Action expected`); });
  return `<pre class="mermaid">\n${lines.join('\n')}\n</pre>`;
};
// ---------- Sitemap of the summary: one card per page (or page model), its title linked to the page ----------
// Read from the pages themselves (generated ones from `out`). No section anchors: the plan shows the
// structure of the pages, each page shows its own sections in its table of contents. A card is flagged
// "gen" when the whole page is generated.
const ST_GEN_PAGE = t('detailed.sitemap.gen-page');
const ST_CROSS = ['code-organization', 'errors', 'screens', 'security', 'tests', 'compliance'];
const pageHtml = (f) => out.get(f) ?? (existsSync(f) ? readFileSync(f, 'utf8') : '');
const pageTitle = (f) => ((pageHtml(f).match(/<title>([^<·]*)/) || [])[1] || '').trim();
const sitemap = (from) => {
  const genBadge = `<span class="st-badge" role="img" aria-label="${esc(ST_GEN_PAGE)}" data-tip="${esc(ST_GEN_PAGE)}">gen</span>`;
  const link = (file) => (file === from ? '#' : href(from, file));
  const ind = (n) => ' '.repeat(n);
  // node of the tree at indentation n, with its children (list of li strings at n + 4)
  const sub = (items, n) => (items.length ? `\n${ind(n + 2)}<ul class="st-sub">\n${items.join('\n')}\n${ind(n + 2)}</ul>\n${ind(n)}` : '');
  // A family of pages (several instances of one model) is drawn as a stack of cards; its title opens, in the
  // focus view of doc.js (sitemapFamilies()), the list of its pages, carried hidden in the card. Without
  // script, the title opens the first page.
  const card = ({ title, file, gen = false, entry = false, self = false, tip = '', pages = [] }, n, children = []) => {
    const count = pages.length;
    const head = self ? `<span class="st-title" aria-current="page">${esc(title)}</span>`
      : `<a class="st-title" href="${link(file)}"${count > 1 ? ` aria-haspopup="dialog" data-tip="${esc(t('detailed.sitemap.open-list', { n: count }))}"` : tip ? ` data-tip="${esc(tip)}"` : ''}>${esc(title)}</a>`;
    const list = count > 1 ? `\n${ind(n + 4)}<div class="st-pages" hidden data-title="${esc(title)}"><ul>${pages.map((p) => `<li><a href="${link(p.file)}">${p.html}</a></li>`).join('')}</ul></div>` : '';
    return `${ind(n)}<li class="st-item${children.length ? '' : ' st-leaf'}"><div class="st-node${entry ? ' st-entry' : ''}${gen ? ' gen' : ''}${count > 1 ? ' st-stack' : ''}">
${ind(n + 4)}<div class="st-head">${head}${gen ? genBadge : ''}</div>${list}
${ind(n + 2)}</div>${sub(children, n)}</li>`;
  };
  // pages: { file, html } in the order of the family, the label of each page in the list
  const family = (title, pages, gen) => (pages.length ? { title, file: pages[0].file, gen, pages,
    tip: t('detailed.sitemap.model-page', { title: pageTitle(pages[0].file) || relative(DET, pages[0].file) }) } : null);
  const objPage = (id, file, name) => ({ file, html: `<b>${id}</b> ${esc(name)}` });
  const page1 = (title, file, gen) => (existsSync(file) || out.has(file) ? { title, file, gen } : null);
  const schemaPages = [...out.keys()].filter((f) => dirname(f) === join(DET, 'schemas') && f !== P.schemas).sort();
  const ccDir = join(DET, 'cross-cutting');
  const ccFiles = existsSync(ccDir) ? readdirSync(ccDir).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, ''))
    .sort((a, b) => ((ST_CROSS.indexOf(a) + 1 || 99) - (ST_CROSS.indexOf(b) + 1 || 99)) || a.localeCompare(b)).map((n) => join(ccDir, n + '.html')) : [];
  const groups = [
    ['st-b1', t('detailed.sitemap.group.endpoints'), [family(t('detailed.sitemap.endpoint-page'), ops.map((o) => ({ file: epFile(o.id), html: `<b>${o.id}</b> <code>${esc(o.short)}</code> ${esc(o.op.summary || '')}` })), true), page1(t('detailed.sitemap.swagger'), P.swagger, true)]],
    ['st-b2', t('detailed.sitemap.group.schemas'), [page1(t('detailed.sitemap.schema-list'), P.schemas, true), family(t('detailed.sitemap.schema-page'), schemaPages.map((f) => ({ file: f, html: `<code>${esc(basename(f, '.html'))}</code>` })), true)]],
    ['st-b3', t('detailed.sitemap.group.entities'), [family(t('detailed.sitemap.entity-page'), [...entities.values()].sort((a, b) => byId(a.id, b.id)).map((e) => objPage(e.id, e.file, e.name)), false)]],
    ['st-b4', t('detailed.sitemap.group.processes'), [family(t('detailed.sitemap.process-page'), [...processes.values()].sort((a, b) => byId(a.id, b.id)).map((p) => objPage(p.id, p.file, p.name)), false)]],
    ['st-b5', t('detailed.sitemap.group.cross-cutting'), ccFiles.map((f) => page1(pageTitle(f) || basename(f), f, false))],
    ['st-b7', t('detailed.sitemap.group.open'), [page1(t('detailed.open.title'), P.open, true)]],
    ['st-b6', 'API', [{ title: 'openapi.yaml', file: P.openapi }]],
  ].map(([cls, name, items]) => [cls, name, items.filter(Boolean)]).filter(([, , items]) => items.length);
  const groupItems = groups.map(([cls, name, items]) => `${ind(18)}<li class="st-item ${cls}${items.length === 1 ? ' st-single' : ''}"><span class="st-group">${esc(name)}</span>${sub(items.map((it) => card(it, 22)), 18)}</li>`);
  const summary = card({ title: t('detailed.kicker.summary'), file: from, self: true }, 14, groupItems);
  const root = card({ title: t('detailed.sitemap.macro'), file: P.macro, entry: true }, 10, [summary]);
  return `      <nav class="sitemap-tree-wrap" aria-label="${esc(t('detailed.sitemap.aria'))}">
        <ul class="sitemap-tree">
${root}
        </ul>
        <p class="st-legend"><span><i class="st-entry"></i>${t('detailed.sitemap.legend.entry')}</span><span><i class="st-grp"></i>${t('detailed.sitemap.legend.group')}</span><span><i></i>${t('detailed.sitemap.legend.page')}</span><span><i class="st-stack"></i>${t('detailed.sitemap.legend.family')}</span><span>${genBadge.replace('class="st-badge"', 'class="st-badge on-light"')}<span>${t('detailed.sitemap.legend.gen')}</span></span></p>
      </nav>`;
};
const crudCells = (map) => [...entities.values()].sort((a, b) => byId(a.id, b.id)).map((e) => {
  const x = map.get(e.id);
  if (!x) return '';
  const way = (by) => (by.length ? t('detailed.by.chain', { chain: by.join(' → ') }) : t('detailed.by.direct'));
  const names = (a) => a.split('').map((l) => CRUD_NAMES[l]).join(', ');
  // Same letters on every way: the letters then the ways; otherwise each way with its own letters
  const tip = new Set(x.parts.map((p) => p.access)).size > 1 ? x.parts.map((p) => `${names(p.access)} ${way(p.by)}`).join(' ; ')
    : names(x.access) + (x.parts.some((p) => p.by.length) ? ', ' + uniq(x.parts.map((p) => way(p.by))).join(' ; ') : '');
  return `<span class="crud" data-tip="${esc(tip)}">${x.access}</span>`;
});
const removedBlock = (name, by) => (file) => { err(`${relative(DOCS, file)}: block ${name} removed from the format (${by})`); return ''; };
const blocks = {
  sitemap: (file) => sitemap(file),
  'entity-usage': (file, meta) => {
    const id = meta.id;
    const rows = [];
    ops.forEach((o) => { const x = crudOf(entityAccess(o)).get(id); if (x) rows.push([idLink(file, o.id), `<code>${esc(o.short)}</code>`, crudTag(x.access), byParts(file, x), relTag(o.release)]); });
    processes.forEach((p) => { const x = crudOf(procAccess(p.id)).get(id); if (x) rows.push([idLink(file, p.id), esc(p.name), crudTag(x.access), byParts(file, x, 1), relTag(p.release)]); });
    const cts = Object.entries(schemas).filter(([, s]) => s['x-entity'] === id).map(([n]) => ctLink(file, n));
    return `${table(['id', 'object', 'crud', 'how', 'release'].map((c) => t(`detailed.entity-usage.col.${c}`)), rows)}
      <p>${t('detailed.entity-usage.footer', { schemas: cts.join(', ') || t('detailed.none.m'), module: moduleLink(file, (entities.get(id) || {}).module) })}</p>`;
  },
  'state-diagram': (file, meta, html) => stateDiagram(file, html),
  'process-usage': (file, meta) => {
    const p = processes.get(meta.id);
    if (!p) return `      <p>${t('detailed.process-usage.unknown')}</p>`;
    const by = callersOfProcess(p.id);
    const data = [...crudOf(procAccess(p.id)).values()].sort((a, b) => byId(a.id, b.id));
    return `      <dl class="defs">
        <dt>${t('detailed.process-usage.module')}</dt><dd>${moduleLink(file, p.module)}</dd>
        <dt>${t('detailed.process-usage.called-by')}</dt><dd>${[...by.ops.map((o) => `${idLink(file, o.id)} <code>${esc(o.short)}</code> ${relTag(o.release)}`), ...by.procs.map((x) => `${idLink(file, x.id, true)} ${relTag(x.release)}`)].join('<br>') || t('detailed.process-usage.called-by.none')}</dd>
${p.calls.length ? `        <dt>${t('detailed.process-usage.calls')}</dt><dd>${p.calls.map((x) => idLink(file, x, true)).join('<br>')}</dd>\n` : ''}        <dt>${t('detailed.process-usage.data')}</dt><dd>${data.map((e) => `${idLink(file, e.id, true)} ${crudTag(e.access)}${e.chains.some((c) => c.length > 1) ? ' ' + byParts(file, e, 1) : ''}`).join('<br>')}</dd>
        <dt>${t('detailed.process-usage.rules')}</dt><dd>${p.rules.length ? rulesLinks(file, p.rules) : t('detailed.none.f')}</dd>
        <dt>${t('detailed.process-usage.errors')}</dt><dd>${p.errors.length ? p.errors.map((c) => codeLink(file, c)).join(', ') : t('detailed.none.f')}</dd>
      </dl>`;
  },
  // Sortable: the path then the verb, statuses in their logical order. No release: it is indicative, on the
  // endpoint page
  'summary-endpoints': (file) => table([t('detailed.summary.col.id'), t('detailed.summary.col.path'), t('detailed.summary.col.summary'), t('detailed.summary.col.rights'), { label: t('detailed.summary.col.status'), order: STATUSES }], ops.map((o) => ({ cells: [
    idLink(file, o.id), { html: `${verbTag(o.verb)} <code>${esc(o.path)}</code>`, sort: `${o.path} ${VERBS.indexOf(o.verb)}` }, esc(o.op.summary || ''), o.roles.map((r) => (r === 'public' ? t('detailed.role.public') : esc(r))).join(', '),
    { html: contractTag(o.contract), sort: o.contract || '' },
  ] })), { sortable: true }),
  // Objects by backend module: one row per module that holds an endpoint, a process or an entity, in the
  // order of table.modules; anchor module-<slug>, the target of the Module link of every object page
  'code-modules': (file) => {
    const all = [...ops.map((o) => ({ id: o.id, m: o.module, k: 'ep' })), ...[...processes.values()].map((p) => ({ id: p.id, m: p.module, k: 'tr' })), ...[...entities.values()].map((e) => ({ id: e.id, m: e.module, k: 'en' }))].filter((x) => x.m);
    const mods = uniq([...(moduleList || []), ...all.map((x) => x.m)]).filter((m) => all.some((x) => x.m === m));
    const cell = (m, k) => all.filter((x) => x.m === m && x.k === k).map((x) => x.id).sort(byId).map((id) => idLink(file, id)).join(', ') || `<span class="none">${t(k === 'en' ? 'detailed.none.f' : 'detailed.none.m')}</span>`;
    return table(['module', 'endpoints', 'processes', 'entities'].map((c) => t(`detailed.modules.col.${c}`)), mods.map((m) => ({ id: moduleAnchor(m), cells: [`<code>${esc(m)}</code>`, cell(m, 'ep'), cell(m, 'tr'), cell(m, 'en')] })));
  },
  // CRUD matrix: endpoints then processes in rows, entities in columns, effective access (direct or through
  // the processes called), and the processes each row calls
  'crud-matrix': (file) => {
    const ens = [...entities.values()].sort((a, b) => byId(a.id, b.id));
    const head = [t('detailed.crud-matrix.col.object'), ...ens.map((e) => `${idLink(file, e.id)}<small>${esc(e.name)}</small>`), t('detailed.crud-matrix.col.calls')];
    const rows = [
      ...ops.map((o) => [`${idLink(file, o.id)} <code>${esc(o.short)}</code>`, ...crudCells(crudOf(entityAccess(o))), o.processes.map((t) => idLink(file, t)).join(', ')]),
      ...[...processes.values()].sort((a, b) => byId(a.id, b.id)).map((p) => [`${idLink(file, p.id)} ${esc(p.name)}`, ...crudCells(crudOf(procAccess(p.id).map((e) => ({ ...e, by: e.by.slice(1) })))), p.calls.map((t) => idLink(file, t)).join(', ')]),
    ];
    return table(head, rows, { cls: 'crud-matrix' });
  },
  'api-version': (file) => t('detailed.api-version', { file: `<a href="${href(file, P.openapi)}">openapi.yaml</a>`, version: esc(version), date: fmtDate((changelog[0] || {}).date) }),
  'open-summary': (file) => {
    const n = (i) => openPoints.filter((x) => x.impact === i).length;
    return t('detailed.open-summary', { points: `<a href="${href(file, P.open)}">${t('detailed.open-summary.points', { n: openPoints.length })}</a>`, detail: IMPACTS.map((i) => `${n(i)} ${impactTag(i)}`).join(', ') });
  },
  'summary-entities': removedBlock('summary-entities', 'replaced by crud-matrix'),
  'summary-processes': removedBlock('summary-processes', 'replaced by crud-matrix'),
  'summary-schemas': removedBlock('summary-schemas', 'the schema list is schemas/index.html'),
  'open-points': removedBlock('open-points', 'single view open-points.html, counter open-summary'),
  'rights-matrix': (file) => {
    const yes = `<span class="tag ok">${t('detailed.yes')}</span>`, no = `<span class="tag">${t('detailed.no')}</span>`;
    return table([t('detailed.rights.col.endpoint'), t('detailed.rights.col.path'), ...ROLES.map((r) => (r === 'public' ? t('detailed.role.public') : `<code>${esc(r)}</code>`)), t('detailed.rights.col.control')], ops.map((o) => [
      idLink(file, o.id), `<code>${esc(o.short)}</code>`,
      ...ROLES.map((r) => (o.roles.includes(r) || (o.roles.includes('public') && r !== 'public') ? yes : no)),
      (o.op['x-data-control'] || []).map((d) => inline(file, d)).join('<br>'),
    ]));
  },
  'error-catalog': (file) => table(['code', 'status', 'case', 'screen', 'entity', 'returned-by'].map((c) => t(`detailed.errors.col.${c}`)), codeEnum.map((c) => ({ id: c, cells: [
    `<code>${c}</code>${(codeSchema['x-enum-releases'] || {})[c] ? ' ' + relTag(codeSchema['x-enum-releases'][c]) : ''}`, `<code>${esc((catalog[c] || {}).status || '')}</code>`, inline(file, (catalog[c] || {}).case || ''), inline(file, (catalog[c] || {}).screen || ''),
    (catalog[c] || {}).entity ? idLink(file, catalog[c].entity) : '',
    (codeUse.get(c) || []).sort((a, b) => byId(a.id, b.id)).map((o) => idLink(file, o.id)).join(', '),
  ] }))),
  // Map of the screens, drawn as a wireflow by the .pf engine of doc.js (the one of the UX/UI spec): one
  // card per screen of the macro, with the preview and the name the UX/UI spec gives it (inventory:
  // a.screen-card and its img). Groups, places and links come from the wireflow of the spec (h3 then
  // div.pf, its pf-node data-c, data-r, data-links): a dialog stands for its screen (a link out of it
  // leaves from its screen, a link into it is dropped), a result (pf-node end) is dropped, and so is a
  // link back along a link already drawn. A screen shown by two journeys is drawn once, in the first; a
  // screen that no journey shows goes, without links, to a last group.
  // On a narrow page the cards stand in one column and the arrows give way to the links written in each
  // card (.sf-next, hidden on a wide page).
  'screen-map': (file) => {
    const ux = existsSync(P.ux) ? readFileSync(P.ux, 'utf8') : '';
    if (!ux) warn('cross-cutting/screens.html: UX/UI spec absent, screen map without previews or links');
    const inv = new Map([...ux.matchAll(/<a class="screen-card" href="#(SCR-\d+)">([\s\S]*?)<\/a>/g)].map(([, id, inner]) => [id, {
      img: (inner.match(/<img src="([^"]+)"/) || [])[1] || '', name: cellText((inner.match(/<b>([\s\S]*?)<\/b>/) || [])[1] || '').replace(/^SCR-\d+\s*·\s*/, ''),
    }]));
    const macroScreens = screenNodes();
    const journeys = [...ux.matchAll(/<h3[^>]*>((?:(?!<h3)[\s\S])*?)<\/h3>\s*<div class="pf">([\s\S]*?)\n\s*<\/div>\n/g)].map(([, h, body]) => {
      const nodes = [...body.matchAll(/<div class="pf-node ([^"]*)" id="([^"]+)"([^>]*)>\s*(?:<a class="ec" href="#(SCR-\d+)[^"]*">)?/g)].map(([, cls, id, attrs, ec]) => ({
        id, ec, kind: /\bend\b/.test(cls) ? 'end' : /\bdialog\b/.test(cls) ? 'dialog' : 'screen',
        c: +((attrs.match(/data-c="(\d+)"/) || [])[1] || 1), r: +((attrs.match(/data-r="(\d+)"/) || [])[1] || 1),
        links: (attrs.match(/data-links="([^"]*)"/) || [])[1] || '',
      }));
      return { label: cellText(h).split(/\s*:/)[0], nodes };
    });
    // links of a wireflow node: "id|label words id2|label", a word that is not a node id continues the label
    const parseLinks = (raw, ids) => {
      const items = [];
      raw.split(/\s+/).filter(Boolean).forEach((w) => {
        const [id, ...rest] = w.split('|');
        if (ids.has(id) || !items.length) items.push({ to: id, label: rest.join('|') });
        else items[items.length - 1].label += ' ' + w;
      });
      return items;
    };
    const placed = new Map(); // SCR -> { group, c, r }
    const edges = [];
    const groups = journeys.map((j, gi) => {
      const byId = new Map(j.nodes.map((n) => [n.id, n]));
      const ids = new Set(byId.keys());
      j.nodes.filter((n) => n.kind === 'screen' && n.ec && !placed.has(n.ec)).forEach((n) => placed.set(n.ec, { g: gi, c: n.c, r: n.r }));
      j.nodes.forEach((n) => parseLinks(n.links, ids).forEach(({ to, label }) => {
        const tn = byId.get(to);
        if (!tn || tn.kind !== 'screen' || !n.ec || !tn.ec || tn.ec === n.ec) return;
        edges.push({ from: n.ec, to: tn.ec, label: label.trim() });
      }));
      return { label: j.label, ecs: [] };
    });
    // one link per pair; a link back along a kept link (return to the previous screen) is left out
    const kept = new Map();
    edges.forEach((e) => {
      const k = e.from + '>' + e.to;
      if (kept.has(e.to + '>' + e.from)) return;
      if (kept.has(k)) { if (e.label && !kept.get(k).label.split(', ').includes(e.label)) kept.get(k).label += ', ' + e.label; return; }
      kept.set(k, { ...e });
    });
    placed.forEach((p, ec) => groups[p.g].ecs.push(ec));
    const rest = macroScreens.map((n) => n.id).filter((id) => !placed.has(id));
    if (rest.length) groups.push({ label: t(groups.length ? 'detailed.screen-map.off-journey' : 'detailed.screen-map.screens'), ecs: rest, loose: true });
    // grid: a label row per group, then the rows of its journey, compacted
    const cols = Math.max(1, ...[...placed.values()].map((p) => p.c), rest.length);
    let row = 1;
    const cells = [];
    groups.filter((g) => g.ecs.length).forEach((g) => {
      cells.push(`        <div class="sf-group" style="grid-row: ${row}; grid-column: 1 / span ${cols}"><span class="st-group">${esc(g.label)}</span></div>`);
      row++;
      const rows = g.loose ? [1] : uniq(g.ecs.map((ec) => placed.get(ec).r)).sort((x, y) => x - y);
      const order = g.loose ? g.ecs.map((ec, i) => ({ ec, c: i + 1, r: row }))
        : g.ecs.map((ec) => ({ ec, c: placed.get(ec).c, r: row + rows.indexOf(placed.get(ec).r) })).sort((x, y) => x.r - y.r || x.c - y.c);
      order.forEach(({ ec, c, r }) => {
        const m = macroScreens.find((n) => n.id === ec), u = inv.get(ec);
        const name = (u && u.name) || (m ? m.text.replace(ec, '').trim() : '');
        const rel = m && relRank(m.release) > 0 ? ' ' + relTag(m.release) : '';
        const out = g.loose ? [] : [...kept.values()].filter((e) => e.from === ec && placed.has(e.to));
        const links = out.map((e) => `sf-${e.to}${e.label ? '|' + esc(e.label) : ''}`).join(' ');
        const thumb = u && u.img ? `<img src="${href(file, resolve(dirname(P.ux), u.img))}" alt="" loading="lazy">` : `<span class="missing">${t('detailed.screen-map.no-preview')}</span>`;
        const head = anchorsIn(P.ux).has(ec) ? `<a class="ec" href="${href(file, P.ux, ec)}">${ec}</a>` : `<span class="ec">${ec}</span>`;
        cells.push(`        <div class="pf-node screen" id="sf-${ec}" data-c="${c}" data-r="${r}"${links ? ` data-links="${links}"` : ''}>${head}<span class="sf-thumb">${thumb}</span><span class="sf-name">${esc(name)}${rel}</span>${out.map((e) => `<span class="sf-next">→ <a href="#sf-${e.to}">${e.to}</a>${e.label ? ' ' + esc(e.label) : ''}</span>`).join('')}<a class="sf-row" href="#${ec}">${t('detailed.screen-map.row-link')}</a></div>`);
      });
      row += rows.length;
    });
    return `      <div class="pf screen-flow">
${cells.join('\n')}
      </div>`;
  },
  // Per screen of the macro: endpoints it calls, error codes the front translates there, messages, and a
  // link to its row of table.screen-details (address, arrival, accessible structure), checked here
  'screens': (file, meta, html) => {
    const rel = relative(DOCS, file);
    const details = screenDetails(html);
    const known = new Set(screenNodes().map((s) => s.id));
    if (!details) warn(`${rel}: no table class="screen-details" (address and parameters, what comes from another screen, accessible roles and names)`);
    else [...details.keys()].filter((id) => !known.has(id)).forEach((id) => err(`${rel}: ${id} has a row in the address and structure table, but is not a screen of the macro`));
    const rows = screenNodes().map((s) => {
      const eps = screenEndpoints(s);
      const codes = uniq(eps.flatMap((id) => opById.get(id).responses.flatMap((r) => r.codes))).filter((c) => !GENERIC_CODES.includes(c)).sort((a, b) => codeEnum.indexOf(a) - codeEnum.indexOf(b));
      // messages: those of the catalog for these codes, and those the front shows in the sequences of these
      // endpoints when the front participant is this screen
      const msgs = new Set();
      codes.forEach((c) => msgsOfScreenText((catalog[c] || {}).screen, s.id).forEach((m) => msgs.add(m)));
      eps.forEach((id) => {
        const seq = String(opById.get(id).op['x-sequence'] || '');
        const front = (seq.match(/participant F as ([^\n]*)/) || [])[1] || '';
        if (!new RegExp(`\\b${s.id}\\b`).test(front)) return;
        seq.split('\n').filter((l) => /F-->>/.test(l)).forEach((l) => (l.match(/\bMSG-U?\d+\b/g) || []).forEach((m) => msgs.add(m)));
      });
      const msgList = [...msgs].sort((a, b) => (a.includes('U') - b.includes('U')) || byId(a, b));
      const codeRel = codeSchema['x-enum-releases'] || {};
      const later = (r) => (r && relRank(r) > relRank(s.release) ? ' ' + relTag(r) : '');
      let structure = '';
      if (details && !details.has(s.id)) warn(`${rel}: ${s.id} without a row in the address and structure table (table.screen-details)`);
      else if (details && !anchorsIn(file).has(`structure-${s.id}`)) err(`${rel}: the row of ${s.id} in the address and structure table has no id="structure-${s.id}"`);
      else if (details) structure = `<br><a href="#structure-${s.id}">${t('detailed.screens.structure-link')}</a>`;
      return { id: s.id, cells: [`${anchorLink(file, P.ux, s.id)} ${esc(s.text.replace(s.id, '').trim())} ${relTag(s.release)}${structure}`,
        eps.map((id) => idLink(file, id) + later(opById.get(id).release)).join(', ') || t('detailed.none.m'),
        codes.map((c) => codeLink(file, c) + later(codeRel[c])).join(', ') || t('detailed.none.m'),
        msgList.map((m) => inline(file, m)).join(', ') || t('detailed.none.m')] };
    });
    return `      <p>${t('detailed.screens.common', { codes: GENERIC_CODES.map((c) => codeLink(file, c)).join(', ') })}</p>
${table(['screen', 'endpoints', 'codes', 'messages'].map((c) => t(`detailed.screens.col.${c}`)), rows)}`;
  },
  // Technical notes of a story: what its endpoints bring, from <meta name="endpoints">
  'story-tech': (file, meta) => {
    const list = words(meta.endpoints).filter((id) => opById.has(id)).map((id) => opById.get(id));
    const trs = uniq(list.flatMap((o) => o.processes.flatMap((t) => procCalls(t))));
    const ens = new Map();
    list.flatMap((o) => entityAccess(o)).forEach((e) => { if (!ens.has(e.id) || isWrite(e.access)) ens.set(e.id, e.access); });
    const cts = uniq(list.flatMap((o) => opSchemas(o).map((c) => c.name)));
    return `      <dl class="defs">
        <dt>${t('detailed.story.endpoints')}</dt><dd>${list.map((o) => `${idLink(file, o.id)} <code>${esc(o.short)}</code> ${esc(o.op.summary || '')} ${contractTag(o.contract)}`).join('<br>') || t('detailed.none.m')}</dd>
        <dt>${t('detailed.story.processes')}</dt><dd>${trs.map((x) => idLink(file, x, true)).join('<br>') || t('detailed.none.m')}</dd>
        <dt>${t('detailed.story.entities')}</dt><dd>${[...ens.entries()].sort((a, b) => byId(a[0], b[0])).map(([id, a]) => `${idLink(file, id, true)} (${accessLabel(a)})`).join('<br>') || t('detailed.none.f')}</dd>
        <dt>${t('detailed.story.schemas')}</dt><dd>${cts.map((n) => ctLink(file, n)).join(', ') || t('detailed.none.m')}</dd>
      </dl>`;
  },
};
const handFiles = [];
const walk = (d) => existsSync(d) && readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const p = join(d, e.name);
  if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) handFiles.push(p);
});
walk(DET);
const hand = handFiles.filter((f) => !out.has(f) && f !== P.open && !readFileSync(f, 'utf8').includes(MARK));
const stories = existsSync(STORIES) && statSync(STORIES).isDirectory() ? readdirSync(STORIES).filter((f) => /^US-\d+.*\.html$/.test(f)).map((f) => join(STORIES, f)) : [];

// ---------- Open points of the hand-written pages ----------
// section#open-points > table.open-points, one row per point: impact (high, medium, low), subject,
// hypothesis kept meanwhile, question (Q-xxx link, or empty). The impact is a code: data-value of its cell,
// else the class of its span.impact. No point: a <p data-value="none"> in the section, or no section. The cells are copied into the single view, their
// relative links rebased.
const rebase = (html, from, to) => html.replace(/\bhref="([^"]*)"/g, (m, h) => {
  if (/^(https?:|mailto:|\/)/.test(h)) return m;
  const [path, anchor] = h.split('#');
  const target = path ? resolve(dirname(from), path) : from;
  return `href="${href(to, target, anchor)}"`;
});
const pageKind = (f) => (dirname(f) === join(DET, 'entities') ? 1 : dirname(f) === join(DET, 'processes') ? 3 : dirname(f) === join(DET, 'cross-cutting') ? 4 : 0);
hand.forEach((file) => {
  const html = readFileSync(file, 'utf8');
  const meta = metaOf(html);
  const rel = relative(DOCS, file);
  const sec = (html.match(/<section\b[^>]*\bid="open-points"[^>]*>[\s\S]*?<\/section>/) || [])[0];
  if (!sec) {
    if (/<section\b[^>]*\bdata-section="open-points"/.test(html)) err(`${rel}: open points section without id="open-points"`);
    return;
  }
  const tbl = (sec.match(/<table class="open-points">[\s\S]*?<\/table>/) || [])[0];
  if (!tbl) { if (!/\bdata-value="none"/.test(sec)) err(`${rel}: open points without a table class="open-points" (or <p data-value="none">)`); return; }
  const rows = tableRows(tbl);
  const rowsRaw = [...((tbl.match(/<tbody>([\s\S]*?)<\/tbody>/) || [])[1] || '').matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map(([, tr]) => tr);
  // impact code of a row: data-value of the first cell, else class of span.impact
  const impactOf = (i) => {
    const td = (rowsRaw[i].match(/<td\b[^>]*>[\s\S]*?<\/td>/) || [''])[0];
    return (td.match(/^<td\b[^>]*\bdata-value="([^"]*)"/) || [])[1] || (td.match(/class="impact ([a-z]+)"/) || [])[1] || '';
  };
  const id = meta.id || '';
  const name = (entities.get(id) || processes.get(id) || {}).name || pageTitle(file);
  rows.forEach((cells, i) => {
    const impact = impactOf(i);
    if (!IMPACTS.includes(impact)) err(`${rel}: open point ${i + 1}, unknown impact "${impact}" (${IMPACTS.join(', ')} in data-value or class="impact …")`);
    if (cells.length !== 4) err(`${rel}: open point ${i + 1}: four columns expected (impact, subject, hypothesis, question)`);
    // a question not asked yet: empty, or a span.none in the language of the project
    const q = cellText((cells[3] || '').replace(/<span class="none">[\s\S]*?<\/span>/g, ''));
    if (q && !/^Q-\d{3}$/.test(q)) warn(`${rel}: open point ${i + 1}, question "${q}": Q-xxx as a link, or empty`);
    if (i && impactRank(impact) < impactRank(impactOf(i - 1))) warn(`${rel}: open points to sort by impact, highest first`);
    const R = (c) => rebase((c || '').trim(), file, P.open);
    const rl = (entities.get(id) || processes.get(id) || {}).release;
    openPoints.push({ impact, subject: R(cells[1]), hypothesis: cellText(cells[2] || '') ? R(cells[2]) : '', question: /^Q-\d{3}$/.test(q) ? R(cells[3]) : '',
      object: `<a href="${href(P.open, file, 'open-points')}">${esc(id || name)}</a>${id ? ' ' + esc(name) : ''}${rl ? ' ' + relTag(rl) : ''}`, sortKey: `${pageKind(file)} ${String(num(id)).padStart(3, '0')} ${basename(file)}` });
  });
});

// ---------- Single view of the open points ----------
{
  const file = P.open;
  const list = openPoints.slice().sort((a, b) => impactRank(a.impact) - impactRank(b.impact) || a.sortKey.localeCompare(b.sortKey));
  const count = IMPACTS.map((i) => `${list.filter((x) => x.impact === i).length} ${impactTag(i)}`).join(', ');
  const body = section(t('detailed.open.title'), list.length ? openTable(list, true) : `      <p data-value="none">${t('detailed.open.none')}</p>`, 'points', [
    [I.purpose, t('detailed.open.view.info.purpose')],
    [I.content, t('detailed.open.view.info.content')],
    [I.why, t('detailed.open.view.info.why')],
    [I.read, `${IMPACT_SCALE}${t('detailed.open.view.info.read', { notAsked: t('detailed.open.not-asked') })}`],
    [I.source, t('detailed.open.view.info.source')],
  ]);
  out.set(file, page({
    file, title: t('detailed.open.title'), tocType: t('detailed.open.title'), kicker: `${t('detailed.kicker')} · <a href="${href(file, P.summary)}">${t('detailed.kicker.summary')}</a>`,
    kind: t('detailed.open.title'), h1: t('detailed.open.view.h1'), meta: [t('detailed.open.view.total', { n: list.length, detail: count })],
    lede: t('detailed.open.view.lede'), body, wide: true,
    source: null,
  }));
}

const fill = (file, html, meta) => html.replace(/(<!-- gen:([\w-]+) -->)[\s\S]*?(\s*<!-- \/gen -->)/g, (m, open, name, close) => {
  if (!blocks[name]) { err(`${relative(DOCS, file)}: unknown generated block ${name}`); return m; }
  return `${open}\n${blocks[name](file, meta, html)}${close}`;
});
// Links of a hand-written page to a schema page that is not produced (a shared type is a row of the list)
const schemaLinks = (file, html) => [...html.matchAll(/href="([^"#]*schemas\/([A-Za-z0-9]+)\.html)/g)].forEach(([, h, n]) => {
  if (n === 'index' || !resolve(dirname(file), h).startsWith(join(DET, 'schemas'))) return;
  if (!schemas[n]) err(`${relative(DOCS, file)}: link to schemas/${n}.html, unknown schema`);
  else if (!isExchanged(n)) err(`${relative(DOCS, file)}: ${n} is a shared type, without a page: link schemas/index.html#${n}`);
});
hand.forEach((file) => {
  const html = readFileSync(file, 'utf8');
  const meta = metaOf(html);
  const rel = relative(DOCS, file);
  const next = fill(file, html, meta);
  if (next !== html) out.set(file, next);
  schemaLinks(file, next);
  // what the author wrote: the page without its head and without the generated blocks (the generator
  // answers for those)
  const main = next.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<!-- gen:[\w-]+ -->[\s\S]*?<!-- \/gen -->/g, '').replace(/<!--[\s\S]*?-->/g, '');
  // Every section has its "i": objective, content and reason of the section (rule 13)
  [...main.matchAll(/<section\b[^>]*>\s*<h2>([\s\S]*?)<\/h2>\s*(<div class="info-body")?/g)].filter((m) => !m[2]).forEach((m) => warn(`${rel}: section "${cellText(m[1])}" without its "i" (div.info-body right after the h2)`));
  // An hypothesis or a question lives in the open points, nowhere else (rule 10)
  const outside = main.replace(/<section\b[^>]*\bid="open-points"[^>]*>[\s\S]*?<\/section>/, '').replace(/<div class="info-body"[\s\S]*?<\/div>/g, '');
  if (/class="callout (hypothesis|question)"/.test(outside)) warn(`${rel}: hypothesis or question outside the open points section`);
  // Bare ids: an id outside a link, a code block or a diagram; an error code or a schema in <code> not linked
  const noLinks = main.replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<a\b[\s\S]*?<\/a>/g, '').replace(/<h1>[\s\S]*?<\/h1>/g, '');
  const text = noLinks.replace(/<code>[\s\S]*?<\/code>/g, '').replace(/<[^>]+>/g, ' ');
  const bare = uniq([...text.matchAll(/\b(?:EP|EN|PROC|BR|FL|CALC|SCR|MSG|MSG-U|INV|ADR|Q)-\d+\b/g)].map((m) => m[0]))
    .filter((id) => id !== meta.id).filter((id) => (/^(EP|EN|PROC|INV|ADR)-/.test(id) ? true : /^Q-/.test(id) ? anchorsIn(P.questions).has(id) : /^(SCR|MSG-U)/.test(id) ? anchorsIn(P.ux).has(id) : anchorsIn(P.fonc).has(id)));
  const codes = uniq([...noLinks.matchAll(/<code>([A-Za-z_]+)<\/code>/g)].map((m) => m[1]).filter((c) => catalog[c] || (schemas[c] && c !== 'Creneau')));
  if (bare.length || codes.length) warn(`${rel}: references without a link: ${[...bare, ...codes].join(', ')}`);
  // The compliance contract is a page of the detailed design: every INV-xx linked exists there
  [...next.matchAll(/href="([^"#]*compliance\.html)#(INV-\d+)"/g)].forEach(([, h, id]) => { if (resolve(dirname(file), h) === P.compliance && !anchorsIn(P.compliance).has(id)) invMissing.add(id); });
  // No epic, no story in the detailed design (rule 11)
  const story = cellText(main).match(STORY_RE);
  if (story) warn(`${rel}: cites an epic or a story ("${story[0]}"): the detailed design does not mention them`);
  // Every rule of an entity is carried by its physical model, in the base or out of it
  if (entities.has(meta.id)) {
    // the physical model section: data-section="physical-model"
    const model = (main.match(/<section\b[^>]*\bdata-section="physical-model"[^>]*>[\s\S]*?<\/section>/) || [''])[0];
    entities.get(meta.id).rules.filter((r) => !new RegExp(`\\b${r}\\b`).test(model)).forEach((r) => warn(`${rel}: ${r} (meta rules) does not appear in the physical model (DDL or rules outside the database)`));
  }
});
stories.forEach((file) => {
  const html = readFileSync(file, 'utf8');
  const meta = metaOf(html);
  if (!html.includes('<!-- gen:story-tech -->')) { if (words(meta.endpoints).length) warn(`${relative(DOCS, file)}: no block <!-- gen:story-tech --> in the technical notes`); return; }
  const next = fill(file, html, meta);
  if (next !== html) out.set(file, next);
  schemaLinks(file, next);
});

// ---------- Ids cited and not found in their deliverable ----------
{
  const cited = new Map(); // id -> Set of who cites it
  const ID_ANY = /\b(?:(?:BR|FL|CALC|EP|EN|PROC)-\d+|SCR-\d+(?:-[a-z]+)?|MSG-U?\d+|Q-\d{3})\b/g;
  const cite = (who, text) => (String(text).match(ID_ANY) || []).forEach((id) => { if (!cited.has(id)) cited.set(id, new Set()); cited.get(id).add(who); });
  ops.forEach((o) => cite(o.id, JSON.stringify(o.op)));
  Object.entries(schemas).forEach(([n, s]) => cite(n, JSON.stringify(s)));
  cite('x-changelog', JSON.stringify(changelog));
  [...entities.values(), ...processes.values()].forEach((x) => cite(x.id, Object.entries(x.meta).filter(([k]) => !['id', 'name'].includes(k)).map(([, v]) => v).join(' ')));
  stories.forEach((f) => { const m = metaOf(readFileSync(f, 'utf8')); cite(m.id || relative(DOCS, f), [m.screens, m.rules, m.endpoints].join(' ')); });
  const where = (id) => {
    if (/^(BR|FL|CALC)-|^MSG-\d/.test(id)) return existsSync(P.fonc) ? [anchorsIn(P.fonc).has(id), 'functional design'] : [true];
    if (/^(SCR|MSG-U)/.test(id)) return existsSync(P.ux) ? [anchorsIn(P.ux).has(id), 'UX/UI spec'] : [true];
    if (/^Q-/.test(id)) return existsSync(P.questions) ? [anchorsIn(P.questions).has(id), 'questions'] : [true];
    if (/^EP-/.test(id)) return [opById.has(id), 'openapi.yaml'];
    if (/^EN-/.test(id)) return [entities.has(id), 'pages entities/'];
    return [processes.has(id), 'pages processes/'];
  };
  [...cited.entries()].sort((a, b) => a[0].localeCompare(b[0], 'en', { numeric: true })).forEach(([id, who]) => {
    const [ok, src] = where(id);
    if (!ok) warn(`${id} not found in ${src}, cited by ${[...who].join(', ')}`);
  });
  Object.entries(catalog).forEach(([c, v]) => { if (v.entity && !entities.has(v.entity)) err(`x-error-catalog ${c}: entity ${v.entity} without a page`); });
}

// ---------- Compliance contract ----------
if (!existsSync(P.compliance)) warn('cross-cutting/compliance.html absent: the INV-xx cited have no target');
[...invMissing].sort((a, b) => num(a) - num(b)).forEach((id) => err(invSection(id)
  ? `${id} linked to cross-cutting/compliance.html#${id}, absent from the page: invariant of the foundation taken by reference, link compliance.html#${invSection(id)}, or add its row (provisional invariant)`
  : `${id} cited but absent from cross-cutting/compliance.html (<tr id="${id}">)`));

// ---------- Write, remove stale generated files ----------
let changed = 0;
const write = (file, content) => {
  const before = existsSync(file) ? readFileSync(file, 'utf8') : null;
  if (before === content) return;
  changed++;
  if (CHECK) { console.log(`would change ${relative(process.cwd(), file)}`); return; }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  console.log(`${before === null ? 'created' : 'updated'} ${relative(process.cwd(), file)}`);
};
out.forEach((content, file) => write(file, content));
['endpoints', 'schemas'].forEach((sub) => {
  const d = join(DET, sub);
  if (!existsSync(d)) return;
  readdirSync(d).filter((f) => f.endsWith('.html')).map((f) => join(d, f)).forEach((f) => {
    if (out.has(f) || !readFileSync(f, 'utf8').includes(MARK)) return;
    changed++;
    if (CHECK) console.log(`would remove ${relative(process.cwd(), f)}`);
    else { unlinkSync(f); console.log(`removed ${relative(process.cwd(), f)}`); }
  });
});

infos.forEach((m) => console.error('info  ' + m));
warnings.forEach((w) => console.error('warn  ' + w));
errors.forEach((e) => console.error('ERROR ' + e));
console.log(`API contract v${version}: ${ops.length} endpoints, ${Object.keys(schemas).length} schemas, ${entities.size} entities, ${processes.size} processes, ${hand.length} hand-written pages, ${stories.length} stories; ${errors.length} error(s), ${warnings.length} warning(s); ${changed} file(s) ${CHECK ? 'to regenerate' : 'written or removed'}.`);
if (t.missing.size) console.error(`missing labels: ${[...t.missing].join(', ')}`);
process.exit(errors.length || (CHECK && changed) ? 1 : 0);
