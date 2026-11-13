---
name: deliverable-detailed-design
description: Produces or updates the detailed technical design of the whole application, organized by object (one page per endpoint EP-xx and per schema, generated from the API contract; one page per entity EN-xx and per process PROC-xx, written by hand; cross-cutting pages code organization, errors, screens, security, tests and compliance contract; summary, open points view and Swagger UI view), the multi-file API contract openapi.yaml, from the templates. Use in phase P3 by the Architect once the macro design is in place, then at each sprint planning to freeze the provisional operations of the batch, or when the API contract must evolve.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Bash(cp -R ${CLAUDE_PLUGIN_ROOT}/skills/deliverable-detailed-design/template-api/ *)"
  - "Bash(npx @redocly/cli@2.58.2 *)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Deliverable: detailed technical design, API contract, compliance

The detailed design says **what** to develop and **how**, for the whole application, object by
object, precisely enough for a dev, human or AI, to start cold on a ticket without asking again. One
enters it through the macro design: each identifier of its diagram opens its page.

- **Author**: Architect. Contributors: Backend dev, Frontend dev (feasibility).
- **Phase**: P3 for **the whole application**, all releases. What P3 cannot settle stays a
  **provisional operation**, frozen at the sprint planning that takes it. Goes through gate **G2**
  (human, reviewed by the engineering and architecture teams).
- **Reference example**, format validated by the human:
  `${CLAUDE_PLUGIN_ROOT}/team/examples/formats/docs/30-design/` (21 endpoints, 6 entities,
  6 processes). Draw on it for the level of detail; the templates remain the starting point.

## Rules of the detailed design

The rules of the human. They take precedence over the rest of the skill; the table of sections
applies them.

1. It lets the devs, human and AI, know **what** to develop and **how**.
2. It is clear, precise and simple.
3. Each information section and each layout has a **precise purpose that overlaps no other
   section**, a **defined formalism (ideally deterministic)** and a **justification of that
   formalism**.
4. Each formalism relies **as much as possible on standard artefacts** (OpenAPI, JSON Schema, UML or
   Mermaid sequence and state diagrams, SQL DDL, RFC 9457 problem+json, C4, RACI or CRUD matrix…)
   and justifies why this formalism.
5. The human dev is **not flooded with parasitic information**: as little noise as possible.
6. **No redundancy** of information.
7. **Two modes of representation** are allowed if justified (for example a readable view and a raw
   standard view).
8. The reader **easily visualizes the structure** of the design (the site map generated in the
   summary).
9. The **API schemas** are clearly defined and one easily identifies **where they sit**: which
   sender, which receiver, which endpoint, which direction, which layer.
10. The **open points** are easy to find, with their **level of impact on the design**, and are
    **sorted by impact, highest first**.
11. No notion of **epic** or **user story** in the detailed design.
12. The **release** may appear, as an indication only.
13. Each section (panel) has a small **(i)** that explains what it is for, what it presents and why.
14. **Every reference is a link** (EP, PROC, EN, SCR, BR, INV, schemas, error codes, Q, ADR…).

What they imply, and what the generator checks when it can:

- **Written once, shown where it serves** (rules 6 and 7). A piece of information has a single
  source: the YAML, a `meta` tag, a table of a hand-written page. A computed view may show it
  elsewhere when it serves another entry point (the CRUD matrix of the summary and the "Who acts on
  it" column of an entity), never copied by hand. Two sections with the same purpose do not exist.
  Two modes of a same source: readable table and raw form (schema pages and Swagger UI, transitions
  table and state diagram, Mermaid sequence and list of its identifiers as links).
- **(i) required** (rule 13): `<div class="info-body" hidden>` right after each `h2`, holding a
  `<dl class="defs">` (like the roadmap). Fixed terms, in this order: **Purpose**, **Content**, **Why
  this formalism** (required, taken from the table of sections), then if needed **Reading** (legend,
  badges, reading conventions) and **Source** (where the section is computed from); the summary adds
  **Coding an endpoint** and **Coding a screen**. A `dd` fits in one or two short sentences; an
  enumeration of more than three items or a sequence of steps becomes a `<ul>` or `<ol>` list.
  Nothing in it repeats the section itself. Section without (i): warning.
- **No hypothesis or question outside the open points** (rule 10): no `hypothesis` or `question`
  callout, no "HYPOTHESIS" in the text of a page or of the YAML outside `x-open`.
- **References** (rule 14): a cited identifier is a link (`${CLAUDE_PLUGIN_ROOT}/team/glossary.md`),
  including an error code or a schema in `<code>`, an `INV-xx` (link to its row in the page
  `cross-cutting/compliance.html`, or to the section of the foundation if it is taken by reference).
  A Mermaid diagram carries no link: the generator lists its identifiers as links below it. A target
  outside the project repository (framework file, external source of a foundation) is not linked: it
  is cited in `<code>`. A foundation of the project is linked
  (`.team/foundations/stacks/<name>/compliance.md`, relative path from the page).
- **No epic nor story** (rule 11): neither in the YAML nor in the pages; the coverage of the scenarios
  of a story goes into its technical notes (`story-tech` block).
- **Indicative release** (rule 12): a label on an object, a column or an announced addition, never a
  section organized by release (no more "Evolutions" section nor `x-adapted`).

## Table of sections

The reference of the format. Generated: filled by
`${CLAUDE_PLUGIN_ROOT}/team/scripts/detailed-pages.mjs`, not edited. Written: by hand, in the page or
the YAML.

| Page | Section | Single purpose | Formalism | Standard | Justification | Generated or written |
|---|---|---|---|---|---|---|
| Summary | Header | place the version and the sources, count the open points | metadata line, counter per impact | | one line, read once | written, contract version and counter generated (`api-version`, `open-summary`) |
| Summary | Site map | see the structure and go to a page | tree of pages, one block per page with its title as a link, without the sections (each page lists them in its table of contents) | site map | deterministic, computed from the actual pages; little noise | generated (`sitemap`); the (i) gives the reading order |
| Summary | Endpoints | find an operation by path, permissions or status | sortable table id, verb and path, summary, permissions, status (no release: indicative, it is on the page of the endpoint) | list of OpenAPI operations | one row per operation, sorting without searching | generated (`summary-endpoints`) |
| Summary | CRUD matrix | who creates, reads, updates, deletes what; index of entities and processes | matrix endpoints and processes × entities, letters C R U D; for an endpoint, the access it declares, direct or obtained through a process (`via`) | CRUD matrix | the standard data × processes cross-reference | generated (`crud-matrix`) |
| Open points | Open points | everything that remains to settle, highest impact first | sortable table impact, object, subject, hypothesis, question | | same attributes for each point, they compare | generated from `x-open` and the tables of the pages |
| Endpoint | Header | identify the operation | verb and path, status, permissions, module, screens, release, `operationId` | OpenAPI | what places the operation fits on two lines | generated (module from `x-module`) |
| Endpoint | Request | what the front sends | table of parameters, body schema (↑), example | OpenAPI Parameter, Request Body | readable rendering; the raw form is in the YAML and Swagger UI | generated |
| Endpoint | Responses | what the front receives | table status, body, code, case; common errors on one row; examples | OpenAPI Responses, RFC 9457 | one code per row; what is common is not repeated | generated |
| Endpoint | Behaviour | the facts the code respects | definition list: what it does, checks, processes, rules, idempotence, data in CRUD | RFC 9110 (idempotence), CRUD | one fact per term, no prose | generated (`description`, `x-data-control`, `x-processes`, `x-rules`, `x-idempotence`) |
| Endpoint | Sequence | the order of the calls and the transaction | sequence diagram, identifiers as links below | UML sequence (Mermaid) | shows the chaining the list does not show | written (`x-sequence`), rendering generated |
| Endpoint | Announced additions | how the frozen operation grows | table release, addition, where | | only evolution allowed for what is frozen (INV-58) | generated (`x-release`, `x-enum-releases`) |
| Endpoint | Open points | what remains to settle on the operation | table impact, subject, hypothesis, question | | same attributes, taken over in the single view | written (`x-open`), rendering generated |
| Schema | Header | identify the schema | layer, entity projection, status, first release | | places the schema | generated (`x-entity`) |
| Schema | Placement | where the schema travels | table direction, sender → receiver, endpoint, HTTP message, status | OpenAPI (request, response and status) | same columns for each use: placement without ambiguity | generated (screens from the macro) |
| Schema | Fields | the shape of the schema | table field, type, required, constraints, description | JSON Schema | readable view; the raw form is in the YAML and Swagger UI | generated |
| Schema | Example | a valid instance | JSON | JSON | enough to write a mock without inventing | generated (example of the YAML) |
| Schema | Announced additions | how the schema grows | table release, addition, where | | INV-58 | generated |
| Schema list | Exchanged schemas | index of the schemas by domain, with their placement | cards by domain, direction, endpoints and HTTP status | | one domain = one file `components/schemas/<domain>.yaml` | generated |
| Schema list | Shared types | the types without a page | table type, format, used in, description | JSON Schema | they never travel alone | generated |
| Schema list | Changelog | the versions of the API contract | table version, date, typed changes | SemVer | one entry per version, the most recent first | written (`info.x-changelog`), rendering generated |
| Swagger UI | API contract | the raw and tooled contract | Swagger UI, embedded spec | OpenAPI 3.1 | second reading mode of the endpoint and schema pages | generated |
| Entity | Physical model | the physical schema, ready for the migration | commented DDL (rule per constraint), then rules outside the database | SQL DDL of the dialect of the store (JSON Schema for a document database) | what the migration contains, without translation | written |
| Entity | State machine | the lifecycle | table from, to, event, guard, action, and diagram drawn from the table | UML states (Mermaid), notation event [guard] / action | linked table and readable diagram from a single source | written (`table.transitions`), diagram generated (`state-diagram`) |
| Entity | Who acts on it | who creates, reads, updates, deletes the entity | column of the CRUD matrix, schemas that expose it | CRUD | same source as the matrix of the summary, another entry point | generated (`entity-usage`) |
| Entity, process, cross-cutting | Open points | what remains to settle on the object | `open-points` table impact, subject, hypothesis, question | | same attributes, taken over in the single view | written |
| Process | Called by and entities | place the process | definition list: callers, called, data in CRUD, rules, errors | CRUD | computed, always right | generated (`process-usage`) |
| Process | Signature and transaction | the contract of the process in the code | typed signature in the language of the foundation, Transaction line | signature (IDL of the language) | the shortest form, copied into the domain | written |
| Process | Algorithm (Proposed algorithm for a provisional operation) | what the process does, in order | numbered list, one step per check or action, with rule and rejection | numbered pseudo-code | order matters, no prose | written |
| Process | Edge cases | what the tests cover | table situation, expected result | decision table | one row = one test | written |
| Code organization | Backend | where each endpoint, process and entity lives | modules table (`table.modules`: module, content), then objects by module (endpoints, processes, entities), wiring, transaction rule | C4 component level (as a table) | the foundation applied to the product; the module is declared by each object, the list of objects by module is computed, no file path in a ticket | modules table written; objects by module generated (`code-modules`, from `x-module` and `meta module`) |
| Code organization | Frontend | where each screen lives | table route, screen, components, state; API access services | C4 component level (as a table) | the endpoints per screen are in the screens view, not here | written |
| Code organization | Persistence | common conventions and order of the migrations | definition list, table of the migrations | | written once for all the tables | written |
| Errors | Principles | how an error travels from the API to the screen | short list, each principle with its invariant | RFC 9457 | the detail is in the catalogue | written |
| Errors | Code catalogue | everything about a code | table code, status, case, screen, entity, endpoints | RFC 9457 problem type registry | computed, does not diverge from the contract | generated (`error-catalog`) |
| Screens | Screen map | see all the screens, their transitions, and go to their definition | wireflow: one card per screen (preview, name, link to the UX/UI spec and to its "By screen" row), arrows labelled with the action, groups by journey | wireflow (screen map) | same engine as the wireflow of the UX/UI spec; screens, previews and transitions drawn from the spec, without copying | generated (`screen-map`) |
| Screens | By screen | entry point of the frontend dev | table screen, endpoints, codes to translate, messages, link to its "Address, landing and structure" row | | computed from the macro and the contract | generated (`screens`) |
| Screens | Address, landing and structure | know before the dev how one lands on the screen and what the e2e tests target | `table.screen-details`: screen, address and parameters, what comes from another screen (message and mechanism), accessible roles and names of the elements the e2e tests target; one row per screen of the macro, `<tr id="structure-SCR-xx">` | | written by the Architect, reviewed by UX and QA; accessible names taken as is from the UX/UI spec | written, checked by the `screens` block |
| Security | Session and access control | how a request is authenticated and authorized | short list with invariants | | the principles of the macro applied | written |
| Security | Rights matrix | who can call what | matrix endpoints × roles, checks on the data | RBAC access matrix | standard of role-based access control | generated (`rights-matrix`) |
| Security | Data and protections | what protects the data | list per subject with its invariant or its entity | | for the security review | written |
| Tests | Tooling | what the devs test with | definition list per level | | the tooling of the foundation applied | written |
| Tests | Required cases | what each test must cover | table target, level, cases; edge cases of the processes cited | | review checklist (INV-56, INV-57) | written |
| Compliance | Framework, stack foundation, design system, project | what the code respects, checked in review | table id, invariant, check; one row per invariant, `<tr id="INV-xx">`; a foundation taken by reference as a definition list | | one checkable invariant per row, one anchor per identifier; the foundation is not copied | written |
| Compliance | Accepted deviations | the only deviations allowed | table invariant, deviation, ADR, scope | ADR | a deviation not listed is blocking | written |
| `openapi.yaml` | root, `paths/`, `components/` | the API contract, single source of truth | multi-file OpenAPI 3.1, `x-` extensions | OpenAPI 3.1, JSON Schema, RFC 9457 | read by the tools and by the generator | written |

**Reading order** to code an endpoint: its page (request, responses, behaviour, sequence), its
processes (signature, algorithm, edge cases), its entities (DDL), the code organization (where to put
it), the compliance contract (invariants), the required tests. For a screen: the by-screen view
(`cross-cutting/screens.html#by-screen`) and its "Address, landing and structure" row, the pages of
its endpoints, the error handling. This order is recalled in the (i) of the site map.

## Open points

**Impact scale**, according to what a different answer would change (classified by the heaviest
object it can touch):

| Impact | What the answer can change |
|---|---|
| **high** | the data model (entity, table, constraint) or a frozen operation of the API contract (breaking change, ADR), or what structures the whole code |
| **medium** | a provisional operation, a process, a schema not yet frozen, the behaviour of a screen |
| **low** | a label, a message, a default value, a display edge case |

- **Written once**, where the answer lands: in `x-open` of an operation (YAML) when it bears on it;
  otherwise in the `Open points` section (`id="open-points"`) of the page of the entity, of the
  process or of the cross-cutting page, as `table.open-points`. A process of a provisional operation
  has none: its points are in `x-open` of the operation.
- **Form**: `impact` (high, medium, low), `subject` (what remains to settle and what a different
  answer would change), `hypothesis` (what the code follows meanwhile), `question` (`Q-xxx` if it is
  asked to the PO, otherwise empty: "not asked"). Sorted by decreasing impact in each page. In a
  written page, the impact is a code:
  `<td data-value="medium"><span class="impact medium">…</span></td>`, the visible label in the
  project language; without a point, `<p data-value="none">…</p>` or no section.
- **Single view**: `detailed/open-points.html`, generated, sorted by impact then by object, with a
  link to the place concerned and to the question; counter per impact in the header of the summary.

## Vocabulary

The terms follow `${CLAUDE_PLUGIN_ROOT}/team/glossary.md` (identifiers, link targets, vocabulary):

- **API contract**: the whole `openapi.yaml`, root and linked files. It prevails: in case of a gap
  with a page, the YAML is right.
- **frozen operation** (`x-contract: frozen`): nothing is removed or changed in it, only announced
  backward compatible additions are allowed; the front starts on a mock without waiting for the back.
- **provisional operation** (`x-contract: provisional`): it waits for a business answer; described at
  the reduced level, it changes freely until the planning that freezes it.
- **schema**: shape of data exchanged by an endpoint. **Exchanged schema**: sent (↑, request body) or
  received (↓, response; red ↓, error response) directly by an endpoint, it has its page. **Shared
  type**: used only inside other schemas, a row of the schema list (`schemas/index.html#<Type>`),
  without a page. **Layer** of an exchanged schema: the HTTP boundary, between the API access service
  of the front and the API route that validates it.
- **CRUD access**: `C` create, `R` read, `U` update, `D` delete, of an endpoint or a process on an
  entity (`x-entities`, `meta entities`). A read done for a check (checking an overlap, an existence,
  a permission) counts as `R`. A process declares everything it can do; the endpoint that calls it
  declares what it actually obtains from it (`via`, see the design rules).
- We no longer write "contract" for a schema, nor "hard" or "soft" for an operation.

## Inputs to read

- `.team/foundation.md` of the project, then the stack foundation (`foundation.md` and
  `compliance.md`, in `.team/foundations/stacks/<name>/`, or in the source it points to): code
  organization, API conventions, invariants, tooling and test commands. The design system foundation
  for the front invariants.
- `docs/30-design/macro.html`: chain, ids `SCR-xx`, `EP-xx`, `PROC-xx`, `EN-xx`, persistence,
  deviations from the foundation, points of attention.
- `docs/20-specs/functional-design.html`: rules `BR-xx`, calculations `CALC-xx`, lifecycles, messages
  `MSG-xx`. `docs/20-specs/stories/`: Gherkin criteria (for the technical notes of the stories, not
  for the detailed design).
- `docs/20-ux/ux-ui-spec.html`: screens, states, messages `MSG-Uxx`.
- `docs/adr/index.html` (ADR register, skill `shipitright:deliverable-adr`), `.team/questions/`, and
  the existing detailed design when updating it.

## Tree and templates

```
docs/30-design/
  macro.html                       loads detailed/xref.js (skill deliverable-macro-design)
  api/                             API contract, by hand   ← template-api/ (the whole folder)
    openapi.yaml                   root: info (version, x-changelog), tags, paths, name of each component
    paths/<path>.yaml              one file per path: /rooms/{id} → paths/rooms-id.yaml
    components/schemas/<domain>.yaml   schemas of a domain; 1st line: # domain: <label>
    components/parameters.yaml, components/responses.yaml
    .redocly.lint-ignore.yaml      targeted ignores of the lint
  detailed/
    index.html                     summary, by hand with gen: blocks   ← template-index.html
    entities/EN-xx.html            by hand with gen: blocks            ← template-entity.html
    processes/PROC-xx.html         by hand with gen: block             ← template-process.html
    cross-cutting/code-organization.html, errors.html, screens.html, security.html, tests.html,
                  compliance.html  by hand, with gen: blocks for code-organization, errors,
                                   screens and security       ← template-cross-cutting-<name>.html
                                   compliance.html: the compliance contract, single source of the
                                   INV-xx of the project (no more compliance.md)
    endpoints/EP-xx.html           GENERATED, one page per operation
    schemas/<Schema>.html          GENERATED, one page per exchanged schema
    schemas/index.html             GENERATED: schemas by domain, shared types, changelog of the API contract
    open-points.html               GENERATED: single view of the open points, by impact
    swagger.html                   GENERATED: Swagger UI view, embedded spec (opens from file://)
    xref.js                        GENERATED: index read by doc.js (links of the macro, { } icon, tooltips)
```

A generated page carries at its top `Generated by team/scripts/detailed-pages.mjs`: never edit it,
change the source and regenerate. In a hand-written page, what is between `<!-- gen:NAME -->` and
`<!-- /gen -->` is rewritten at each run. Available blocks:

| Block | Page | What it computes |
|---|---|---|
| `api-version` | summary, Sources line | link to `openapi.yaml`, version and date |
| `open-summary` | summary, header | number of open points per impact, link to the single view |
| `sitemap` | summary, Site map | tree of pages: one block per page (or per model for the EP, schema, EN, PROC families, linked to an example page), title as a link to the page, without its sections; a family block (several pages of the same model) is drawn as stacked cards (class `st-stack`): its title opens, in the focus view of doc.js (the same as the one of the macro), the generated list of its pages, each as a link; closed by Esc, outside click or button, full screen on mobile; `gen` on a generated page |
| `summary-endpoints` | summary | sortable table of the operations: path, summary, permissions, status |
| `crud-matrix` | summary | CRUD matrix endpoints and processes × entities, processes called; access of an endpoint through a process: the one of its `x-entities` row with `via` |
| `entity-usage` | entity page | CRUD column of the entity, schemas that expose it |
| `state-diagram` | entity page | Mermaid state diagram drawn from `table.transitions` of the page |
| `process-usage` | process page | callers, processes called, data in CRUD, rules, errors |
| `code-modules` | `cross-cutting/code-organization.html` | objects by backend module: endpoints (`x-module`), processes and entities (`meta module`), in the order of `table.modules`; anchor `module-<module>`, target of the Module link of each object page |
| `error-catalog` | `cross-cutting/errors.html` | code catalogue: status, case, screen, entity, endpoints |
| `screen-map` | `cross-cutting/screens.html` | screen map, drawn by the `.pf` engine of doc.js: one card per screen of the macro, preview and name drawn from the inventory of the UX/UI spec (`a.screen-card` and its `img`), groups, places and arrows drawn from its wireflow (`h3` then `div.pf`, `data-c`, `data-r`, `data-links` and their labels); a dialog counts for its screen, results (`pf-node end`) and returns along an arrow already drawn are omitted, a screen of two journeys is drawn once; screens without a journey in a last group, without an arrow; one column on a narrow screen |
| `screens` | `cross-cutting/screens.html` | per screen of the macro: endpoints, codes to translate, messages, and link to its row of `table.screen-details` (address and parameters, what comes from another screen with its message and its mechanism, accessible roles and names of the elements the e2e tests target), written by hand; a screen without a row is flagged |
| `rights-matrix` | `cross-cutting/security.html` | roles × endpoints (one column per role of `x-roles`), checks on the data |
| `story-tech` | technical notes of a story | endpoints, processes, entities, schemas of its `meta endpoints` |

Removed from the format (error if they remain): `summary-entities`, `summary-processes` (replaced by
`crud-matrix`), `summary-schemas` (the schema list is `schemas/index.html`), `open-points` (single
view and `open-summary`).

The hand-written pages carry their `meta` tags, read by the generator:

- **entity**: `id`, `name`, `release`, `module`, `tables`, `rules` (each rule cited in the physical
  model).
- **process**: `id`, `name`, `release`, `module`, `entities` (`EN-05:CRU EN-03:R`), `processes`
  (PROC-xx called), `errors` (values of `ErrorCode` it returns), `rules`.

The name of the file is the id (`EN-05.html`). A `meta` tag that nobody reads is flagged. `module`
(required) is the backend code module where the object lives, a row of `table.modules` of the code
organization, like `x-module` of an operation.

## Expected content

**Fixed lede**: the text under the `h1` of the summary (`p.lede`) is common to every detailed
technical design. It states the purpose of the detailed design and points to the macro technical
design, whose lede answers it, and to the API contract. It is copied as is from the template and is
not customized: no counters, no object names. The generator writes nothing in it.

### API contract (`api/`)

The `template-api/` template is a skeleton that passes the generator and the lint; its example takes
over the one of the macro template (`EP-01`, `EP-02`, `EN-01`, `EN-02`, resources) and is replaced
entirely. It deliberately triggers a warning (`Resource` exchanged by a frozen operation and a
provisional one) that shows the rule of shared schemas.

- OpenAPI 3.1, multi-file (constant whatever the foundation, `${CLAUDE_PLUGIN_ROOT}/PROCESS.md`
  section 8). A component exists only if it is named in the root under `components`; elsewhere it is
  cited by a `$ref` relative to its file.
- **Default conventions: plain JSON and `application/problem+json`** (RFC 9457, schema `Problem` with
  a business `code`, value of `ErrorCode`). A foundation that chooses other conventions (JSON:API for
  example) adapts the skeleton; the deviation from the foundation goes through an ADR. The codes
  `VALIDATION`, `UNAUTHENTICATED` and `INTERNAL_ERROR` are expected by the generator (common codes, on
  one row in the endpoint pages).
- **`x-` extensions** and **requirement levels**: the list that prevails is the header of
  `template-api/openapi.yaml`, copied into the project. Do not copy it anywhere else.
- **Version and changelog**: `info.version` as `major.minor.patch`, one entry per version at the top
  of `info.x-changelog` (`date` quoted, each line starts with its kind: `added`, `announced`,
  `frozen`, `fix`, `breaking`). Minor for a frozen addition or an operation that goes from
  provisional to frozen; patch without effect on what is frozen; major only with an accepted ADR,
  cited in the entry. The generator rejects a version without an entry.
- An error: reuse the common responses of `components/responses.yaml`; each error response carries
  its `x-codes`, and each code has its `x-error-catalog` entry (`status`, `case`, `screen` with the
  `SCR-xx` and `MSG-xx`, `entity` if the code puts an entity in question).

### Requirement levels per page

| Page | Section | Level | What we expect |
|---|---|---|---|
| Frozen operation | `paths/<path>.yaml` | required | `x-endpoint-id`, `x-release`, `x-contract`, `x-roles`, `x-module`, `x-entities` or `x-processes`; if it writes (C, U or D): `x-idempotence` and `x-sequence`; for a read: `x-sequence` recommended; example of the request body and of each 2xx response that has a body (`example` of the content, or `examples` of the exchanged schema; generator error otherwise); `x-codes` on each error; `x-entities` with `via` for each entity a called process touches |
| Provisional operation | `paths/<path>.yaml` | required, reduced level | `summary`, `x-roles`, `x-module`, `x-entities` or `x-processes`, `x-open`; sequence and examples optional |
| Summary | Site map, Endpoints, CRUD matrix | required | `gen:` blocks only; the (i) of the site map carries the reading order and the link to the ADR of the API conventions |
| Entity | Physical model | required | `data-section="physical-model"`; commented DDL; rules outside the database |
| Entity | State machine | recommended | `table.transitions` and `state-diagram` block; without a lifecycle: one sentence |
| Entity | Who acts on it | required | `entity-usage` block |
| Process | Called by and entities | required | `process-usage` block |
| Process | Signature and transaction, Algorithm | required | typed signature; steps with rule and rejection |
| Process of a provisional operation | Proposed algorithm | required, reduced level | only section with "Called by and entities"; its open points are in `x-open` of the operation |
| Process | Edge cases | recommended | one case per row with the expected result |
| Entity, process, cross-cutting | Open points | recommended | `table.open-points` (impact in `data-value`), or `<p data-value="none">`, or no section |
| Code organization | Backend, Frontend, Persistence | required | those of the foundation applied to the product; `table.modules` with each declared module and `code-modules` block; `#transactions` with the two rules of the template |
| Compliance | Framework, stack foundation, design system, project, deviations | required | see below |
| Errors | Principles, Code catalogue | required | principles of the template completed; `error-catalog` block |
| Screens | Screen map, By screen, Address, landing and structure | required | `screen-map` and `screens` blocks; `table.screen-details` with one row per screen of the macro |
| Security | Session, Rights matrix, Data and protections | required | mechanism applied; `rights-matrix` block; personal data and protections |
| Tests | Tooling, Required cases | required | tooling of the foundation cited; one row per target, edge cases of the processes cited |

### Compliance contract (`cross-cutting/compliance.html`)

A cross-cutting page of the detailed design, in the site map like the others; it is the single
source of the invariants of the project (no more `compliance.md` in the project; the foundations
keep theirs). One section per origin, each with its (i): framework, stack foundation, design system,
project, accepted deviations. Each invariant is a row `<tr id="INV-xx">` whose first cell is a link to
itself: every page links `compliance.html#INV-xx`.

The template prefills the framework invariants (`INV-50` to `INV-59`, among them **INV-58**: nothing
changes in a frozen operation, version and changelog; and **INV-59**: tolerant reading by the front).
Those of the stack foundation (`INV-01` to `INV-49`) and of the design system (`INV-70` to `INV-79`)
are **taken by reference**, never copied: the project lists only those that do not apply, as a
deviation with an ADR. An invariant taken by reference has no row: a page that cites it links to the
section (`#stack-foundation`, `#design-system`), which the generator does on its own. The Architect
adds the invariants of the project (`INV-60` to `INV-69`), each **checkable** by reading the code; the
identifiers cited in an invariant are links.

**Foundation `to be completed`** (no `compliance.md` in the foundation, or a part of the stack
without an invariant): the subsection "Provisional invariants of the foundation" sets the missing
invariants with the ids they will have in the foundation, each with its row. They are carried into
the `compliance.md` of the foundation when the brief provides for it, in
`.team/foundations/stacks/<name>/`; when the reference of the foundation is a source of the human
that the team does not write, they are reported in the report so that the human carries them over.
The human validates them at G2. The corresponding open point (high impact) is in the page of the
code organization; the compliance page points to it and carries no hypothesis.

**Design system without `compliance.md`** (the design system foundation does not have one yet): the
"Design system" section cites the declared foundation (name, version, date) and states that it has
no `compliance.md`; it then sets itself the invariants `INV-70` to `INV-79`, with the UX, each with
its row `<tr id="INV-xx">` and its check in the front code (tokens, components of the catalogue,
accessibility), as the template and the example do. They are carried into the `compliance.md` of the
design system foundation if the brief of the UX provides for it (otherwise, reported in the report),
and the human validates them at G2.

## Design rules

- **Ids taken from the macro, never renumbered.** A new endpoint, process or entity takes the next
  free id and first enters the macro diagram.
- **Every arrow of the macro exists in the detailed design** (`EP → EN`, `EP → PROC`, `PROC → EN`,
  `PROC → PROC`): otherwise a generator error. A finer access of the detailed design, absent from the
  macro, is mere information. An `x-entities` row with `via` is not an `EP → EN` arrow: the macro
  goes through the process.
- **Access obtained through a process, declared by the caller.** A process declares in
  `meta entities` everything it can do, check reads included (`EN-05:CRU` for a process that rereads
  the bookings to reject an overlap, then creates or modifies); each endpoint that calls it declares
  the access it actually obtains from it, check read included, one row per entity the process
  touches: `x-entities: [{id: EN-05, access: CR, via: PROC-02}, {id: EN-03, access: R, via: PROC-02}]`
  for the creation, `access: RU` for the modification. The CRUD matrix, the "Who acts on it" column
  of the entities, the data of the behaviour and the technical notes of the stories use this access,
  with the process it goes through. The generator raises an error if `via` is not in `x-processes` or
  if the declared access goes beyond the one of the process (processes it calls included), and a
  warning if the caller declares nothing for an entity the process touches (the whole access of the
  process is then kept). A process that calls another takes over the whole access of the callee.
- **The endpoint opens and closes the transaction**, a process never does: it runs in the one of its
  caller and returns a result or a rejection. The sequences show it.
- **When a process `PROC-xx` exists**: the logic serves two callers or more (endpoints or processes),
  or it is a domain calculation or algorithm worth testing on its own, or it is a cascading effect (an
  action that triggers others on other objects), or nothing calls it (scheduled task, message).
  Otherwise, the logic stays in the endpoint, in its use case.
- **An entity is detailed once**, in its page. The other pages cite it by its link; a schema that is
  its actual projection carries `x-entity`.
- **Frozen operation**: only announced backward compatible additions (`x-release` on a parameter or a
  property, `x-enum-releases` for an enum value). A schema exchanged by a frozen operation and a
  provisional one only extends; if something else is needed, the provisional one takes its own
  schema. **Provisional operation**: reduced level, its open points in `x-open`.
- **Sprint planning**: the Architect freezes the provisional operations of the batch (full level,
  `x-contract: frozen`), raises the minor version and adds the changelog entry, then regenerates.
- **Direction of the schemas** seen from the front: ↑ sent (request body), ↓ received, red ↓ received
  as an error. Computed by the generator, never written by hand.
- **Links and tooltips**: do not write a `title` on an EP, EN, PROC link: doc.js computes the tooltip
  from `xref.js`. In the YAML, a one-word schema name is written between backticks to be linked; the
  name of the macro design, of the functional design and of the UX/UI spec, as the `detailed`
  dictionary writes it in the project language ("macro design", "functional design", "UX/UI spec" in
  English), is linked.
- **Sortable tables**: `<table data-sortable>` (doc.js); `data-sort-value` on a cell,
  `data-sort-order="MVP|R2|R3"` on a header for a logical order.
- **Schema files**: one per functional domain, first line `# domain: <label>` (the label, in the
  project language, names the card of the domain).
- **DDL**: checked in the engine of the store before handing it in (for example `sqlite3 :memory:`),
  `<`, `>` and `&` escaped in the page.
- **YAML pitfalls**: an unquoted text that contains ": " becomes an object (the generator flags it);
  dates of the changelog quoted; an `allOf` of a schema with `additionalProperties: false` rejects the
  added fields: write the schema flat.
- **No file path in a ticket brief**: the pages describe modules and components, the dev finds the
  files.
- **No invented business rule**: a doubt becomes an open point, with a question to the PO (`Q-xxx`,
  `qmark` badge) if it blocks.

## Commands

```sh
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/detailed-pages.mjs docs/30-design            # generates
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/detailed-pages.mjs docs/30-design --check    # checks without writing
#   --stories <dir>: stories whose story-tech block is filled (default docs/20-specs/stories)
npx @redocly/cli@2.58.2 lint docs/30-design/api/openapi.yaml   # from the root of the project
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-deliverable.mjs docs          # also runs --check
```

The generator writes on stderr the errors (exit code 1: broken reference, missing requirement, macro
arrow absent, version without an entry, malformed open point, access outside CRUD, `via` access
beyond the one of the process, missing example of a frozen operation, removed block, module absent
from `table.modules`, `INV-xx` cited without a row in the compliance page, link to a former
`compliance.md`), the warnings (section without (i), hypothesis outside the open points, points
badly sorted, reference without a link, epic or story cited, rule of an entity absent from its model,
caller of a process that does not declare the access obtained, `x-adapted`, `compliance.md` left next
to the page…) and the information lines. It is idempotent: a second run changes nothing.

## Delivering

1. Copy `template-api/` to `docs/30-design/api/` (with `.redocly.lint-ignore.yaml`), in one command:
   `cp -R ${CLAUDE_PLUGIN_ROOT}/skills/deliverable-detailed-design/template-api/ docs/30-design/api/`.
   Then write one operation per endpoint of the macro, frozen or provisional. Replace the URL of the
   server with the one of the foundation.
2. Copy (Read of the template in `${CLAUDE_PLUGIN_ROOT}/skills/deliverable-detailed-design/`, then
   Write to its place) `template-index.html` (to `detailed/index.html`), one `template-entity.html` per
   `EN-xx`, one `template-process.html` per `PROC-xx`, and the six
   `template-cross-cutting-<name>.html` (`compliance` included) to `detailed/cross-cutting/<name>.html`.
   Replace `PROJECT_NAME`, fill `meta id` (equal to the file name) and `meta module` of each entity and
   process page, and `x-module` of each operation, each module having its row in `table.modules` of
   the code organization; fill, leave the `gen:` blocks empty, keep the (i) of each section.
3. Complete the macro: `<script src="detailed/xref.js">` before doc.js, ids of the blocks equal to
   their identifier (skill `shipitright:deliverable-macro-design`).
4. Fill the technical notes of each story: `meta endpoints`, constraints, scenario table, element that
   serves it, screen (skill `shipitright:deliverable-epics-stories`).
5. Generate, then `--check`, Redocly lint and `check-deliverable` on `docs/`: 0 error, 0 KO. Reread
   the warnings and handle them or justify them in the report.
6. Open in Chrome the summary, an endpoint page (sequence, link of the module), an entity page (state
   diagram), the code organization (objects by module), the compliance contract, the open points view,
   the macro (links and `{ }` icon) and `swagger.html`: Swagger UI displays, and the "view in Swagger
   UI" link of an endpoint opens its operation.
7. Report: open points of high impact, provisional operations and what holds them, deviations from
   the foundation (ADR `proposed`), provisional invariants of the foundation, remaining warnings.
