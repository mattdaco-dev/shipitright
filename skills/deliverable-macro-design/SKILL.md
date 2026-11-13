---
name: deliverable-macro-design
description: Produces or updates the macro technical design of a ShipItRight project (diagram of the chain screen, feature, endpoint, process, entity, deployable applications, stack, persistence, external systems, asynchronous flows, non-functional requirements, security, ADR, risks), as an HTML page from the template. Use in phase P3 by the Architect, after G1, or when the macro design must be reworked after a review or a change of scope.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Deliverable: macro technical design

The macro design says **what must be built and where**: which applications, which endpoints, which
entities, which dependencies. It follows the formalism of the screen-endpoint-entity chain: a chain
read from left to right, badges that turn the diagram into a backlog. The detailed design of the whole
application starts from it (one page per endpoint, process, entity), then the split into tickets at
sprint planning.

- **Author**: Architect. Feasibility review by the Backend dev and the Frontend dev.
- **Phase**: P3. Goes through gate **G2** (human, after the check of the Scrum Master; reviewed by the
  engineering and architecture teams).
- **File**: `docs/30-design/macro.html`.
- **Template**: [`template.html`](template.html), to copy then fill. Copying means reading
  `${CLAUDE_PLUGIN_ROOT}/skills/deliverable-macro-design/template.html` with Read, then writing it to
  its place in the project with Write.

## Inputs to read

- `docs/00-framing/framing.html`: constraints, scope.
- `docs/20-specs/`: functional design, epics, stories `US-xxx`, rules `BR-xx`.
- `docs/20-ux/ux-ui-spec.html`: inventory of the screens `SCR-xx` and their interactions.
- `.team/foundation.md`: foundations chosen by the project. Then the stack foundation
  (`foundation.md`, `compliance.md`, in `.team/foundations/stacks/<name>/`, or in the source it points
  to): layers, versions, code organization, tooling, commands. `${CLAUDE_PLUGIN_ROOT}/PROCESS.md`,
  section 8: what stays constant whatever the foundation.
- `docs/adr/index.html` (ADR register) if it already exists.

## The diagram: screen-endpoint-entity chain

The chain reads from left to right:

```
Screen → Feature → Endpoint → Process → Entity
```

Screens and features live in an **Application** container (`.container.app`), endpoints, processes
and entities in a **Domain** container (`.container.dom`). Each arrow that crosses the boundary is a
contract between front and back. Neighbouring domains and external systems are placed on the right.

Markup (see the template, which holds a complete example):

- `.diagram > .chain` holds the containers; each container has a `.c-title` and `.cols`; each `.col`
  has a `.col-title` and `.node` elements.
- Node types: `screen`, `feature`, `endpoint`, `process` (process not exposed), `entity`, `external`,
  `topic`, `attention` (unsettled question).
- **The whole project, a single diagram**: the diagram covers every release of the story map (MVP,
  releases R2, R3…), not only the next one. Each block carries `data-release="MVP|R2|…"`: the first
  release that needs it. A block of an earlier release that a release modifies also carries
  `data-adapted="R2 R3"`. A new element of a later release is a separate block; an adapted block stays
  a single block (principle 4).
- **Scope filter**: `<div class="release-filter" data-releases="MVP R2 R3"></div>` right after the
  framing band. doc.js renders it as a sticky bar. "Whole project" shows everything, with the release
  label of each block. A release shows its blocks as TODO and, in context, the blocks of earlier
  releases it calls (DONE) or adapts (TO UPDATE). Table rows that carry `data-release` only show for
  their release. `?release=R2` in the URL opens the page on a release.
- Badges: `data-badge="todo"` on each block to create (new project: all of them). The filter sets
  TODO, TO UPDATE and DONE itself according to the release chosen; do not write `update` or `done` by
  hand in the diagram. Without a badge, the element exists and fits (external system, existing
  outside the project).
- Counters: `<div class="kpi" data-count="screen|feature|endpoint|process|entity">`; doc.js counts the
  blocks displayed and writes the breakdown (by release, or to create / to adapt / already done).
- **Id of an identified block = its identifier**: `id="SCR-01"`, `id="EP-08"`, `id="PROC-02"`,
  `id="EN-05"`, in capitals, like the text of the block. The detailed design and its links hook onto
  it. Blocks without an identifier (feature, topic, external, shared component) keep a free id in
  lower case (`f-book`, `ext-01`).
- Processes: identifier `PROC-xx`, taken over in the detailed design. A process is born when the logic
  serves two callers or more, when it is a calculation or a domain algorithm worth testing on its own,
  when it is a cascading effect (an action that triggers others on other objects), or when nothing
  calls it (scheduled task, message). Otherwise, the logic stays in the endpoint and has no block.
- Points of attention: `attention` block that carries the full question. When a `Q-xxx` exists, the
  block is a link: `<a class="node attention" href="../questions.html#Q-xxx"><b>Q-xxx</b> question</a>`.
- Shared layout component (navigation bar): `screen` block without a `SCR-xx` id, allowed.
- Arrows: `data-links="id1 id2|label_with_underscores"` on the start node, pointing to the end node.
  doc.js draws the arrow; an unknown id is reported in the browser console. The label is optional,
  the `_` become spaces.
- Automatic placement: doc.js aligns the height of each block on the blocks that call it (failing
  that, those it calls), keeps the order of the column and the minimum gap, and spreads apart two
  unlinked blocks that would be at the same level. The author only sets the order within each column.
- Two drawing modes, chosen by the reader above the diagram (remembered by the browser): **Curves**
  (default, Bézier from port to port) and **Right angles** (routed around the blocks, badges and titles
  included, two bends at most). In right angles, the arrows of a same block share their trunk, those
  going to the same block merge into a single collector, an arrow never follows the lane of an
  unrelated arrow, and there is no junction dot. Never draw an arrow by hand nor add style to the
  `.node` elements.
- Reading: hovering a block lights up its chain (upstream and downstream); clicking opens the chain
  alone in a centred, untangled view, with its own mode selector. Nothing to write for that.
- Labels: placed as a chip on their own arrow, at a spot where nothing else passes. Without a clear
  spot (shared trunk, lane too narrow), the arrow carries a number and the text goes to the legend
  under the diagram. Keep labels short (two to four words).
- Readability: order the blocks of each column by epic, from top to bottom, group those that share a
  target, put at the bottom of a column those that go to external systems. Do not reduce the gaps
  between zones, columns and blocks: they are the lanes of the arrows.
- The direction of the arrows follows the calls: screen to feature, feature to endpoint, endpoint to
  process or entity, process to entity, process to the process it calls (`PROC → PROC` allowed).
  **A topic points to the process that consumes it**, never the reverse.

### Link with the detailed design

- The page loads `detailed/xref.js` right before doc.js (already in the template). This file is
  generated by `${CLAUDE_PLUGIN_ROOT}/team/scripts/detailed-pages.mjs` (skill
  `shipitright:deliverable-detailed-design`); as long as it does not exist, the macro displays without
  links, without a disturbing error.
- **Links and the `{ }` icon come from the engine**: doc.js turns the id written in a block into a
  link to its detailed page and puts on each endpoint the `{ }` icon of its schemas (↑ sent,
  ↓ received). Never write a link or an icon by hand in a block.
- **Every arrow of the macro to an `EN` or a `PROC` exists in the detailed design** (`x-entities`,
  `x-processes` of an operation, `meta entities` and `processes` of a process): otherwise the
  generator exits with an error. The detailed design may specify finer accesses, reported as
  information: carry them into the macro if they matter for reading.
- In the other deliverables, a link to `EP-xx`, `EN-xx` or `PROC-xx` targets its page of the detailed
  design (`30-design/detailed/endpoints/EP-xx.html`…), with a fallback to `macro.html#EP-xx` as long
  as the page does not exist (`${CLAUDE_PLUGIN_ROOT}/team/glossary.md`).

### Principles of the model (rules, copied into the legend)

1. Screens present features. A feature can serve several screens.
2. A feature relies on one or several endpoints or external services.
3. Endpoints and processes act on one or several entities.
4. **An entity and an endpoint appear only once.** Two features that share an endpoint: two arrows
   converge. That is what shows the reuse.
5. Endpoint (exposed, callable) and process (calculation, batch, sending, consumption) occupy two
   distinct columns.
6. A call to another domain starts from an endpoint or a process, never from a feature.
7. **A topic (message bus) never reaches an entity.** It pushes to a process, which writes into the
   entity. The topic lives in the container of the domain that publishes it.
8. **The HTTP verb is in the endpoint block**, never on the arrow: `GET POST /resources`. Arrows stay
   bare, except to say what the blocks do not say (what is fetched from an external system, what a
   flow carries).
9. An `external` block is a system, not a piece of data. A system called for three reasons stays a
   single block; the arrow says what is fetched there.
10. **External system = external to the organization.** A tool of another internal team is a
    neighbouring domain (`.container.dom` under its name, with only the endpoints consumed). No
    external block on the diagram: write it in the legend, it is a result.
11. **Readable labels, in the project language**: "Equipment request", not `EquipmentRequest`.
    Endpoint paths stay literal.

## Content

**Fixed lede**: the text under the `h1` (`p.lede`) is common to every macro technical design. It
states the goal of the macro and points to the detailed technical design, whose lede answers it. It is
copied as is from the template and is not customized: no counters, no object names, no stack. The
summary of the project goes in "Project at a glance".

| Section | Level | What we expect |
|---|---|---|
| Framing band | required | legend (one node of each type, the TODO, TO UPDATE, DONE badges, the containers) and principles, goals of this design, subject (covered: the whole project, excluded), project at a glance (ten lines), date and version of the source specs |
| Scope filter | required | `.release-filter` with the releases of the story map, right after the band |
| Technical chain diagram | required | `data-count` counters, then the single diagram of the whole project, ids `SCR-xx`, `EP-xx`, `PROC-xx`, `EN-xx` in the blocks, `data-release` on each block, `data-adapted` on the adapted blocks |
| Deployable applications and containers | required | each deployable unit: role, technology, port, dependencies, image or Compose service |
| Chosen stack and deviations | required | reference and version of the stack foundation, choices it leaves open, deviations only (each with an ADR `proposed`, goes up to the human); the foundation is not copied |
| Persistence per entity | required | store chosen per `EN-xx` and justification (shape of the data, transactions, volume, queries) |
| Non-functional requirements | required | performance, availability, security, observability, accessibility: figured target and means |
| Security and authentication | required | five cards: authentication, roles (role / permissions table), authorization, sensitive data, secrets; short lists |
| Architecture decisions | required | one sentence and the link to the register `docs/adr/index.html`; no list, no status, no deviation (the register carries them). An ADR is cited by its link where it justifies a choice |
| External systems and contracts | recommended | per system: what is fetched there, protocol, contract, owner, availability, degraded mode |
| Asynchronous flows | recommended | topics: producer, consumers, key, delivery guarantee, schema |
| Environments | recommended | local (according to the foundation), test, demo: what runs where, data |
| Technical risks | recommended | risk, impact, probability, mitigation; rows sorted by impact then probability, `data-release` on the risks specific to a release |
| Points of attention | recommended | unsettled questions (`Q-xxx` if asked to the PO), hypotheses |

## Quality rules

- **The framing band is never empty.** Without it, the diagram cannot be reread in three months.
- **Section explanations go in the "i" button**: `<div class="info-body" hidden>` right after the
  `h2`, with a `<dl class="defs">` in the format of the detailed design (skill
  `deliverable-detailed-design`): **Purpose**, **Content**, **Why this formalism**, then if needed
  **Reading** and **Source**; a `dd` of one or two sentences, a list beyond three items, nothing that
  repeats the section. No visible explanation paragraph under a title, no loose notes under the
  diagram: a detail on an endpoint or a process goes into the detailed design.
- **Each story of the project traces back to at least one screen and one endpoint.** Check by the
  author and the reviewer, without a table in the deliverable. Reread the diagram backwards, release
  by release with the filter: an entity without an endpoint, an endpoint without a feature, a feature
  without a screen are signals. Either a block is missing, or it is out of scope and the subject says
  so.
- **The ids of the blocks are those of the other deliverables**: `SCR-xx` of the UX spec, `EP-xx`,
  `PROC-xx` and `EN-xx` taken over as is in the detailed design and `openapi.yaml`
  (`x-endpoint-id`).
- **Each arrow points to an existing id.** After changing the diagram, open the page and check, in
  both modes and on each position of the filter, that no arrow is missing (console:
  `unknown link target` or `no route for link`). An arrow without a route is drawn as a fallback
  straight line: reorder the blocks until the message disappears. **Never split into several
  diagrams**: the uniqueness of the blocks comes first; the filter and the focus view serve reading.
- **A persistence choice is justified.** The name of a store is not enough; "document database:
  nested document read whole, no join" is enough.
- **A non-functional requirement carries a target.** "Fast" does not pass; "p95 < 300 ms on search"
  passes.
- **Any deviation from the stack foundation** has its ADR with status `proposed` (skill
  `shipitright:deliverable-adr`) and appears in the deviations. The PO raises it to the human before
  the sprint.
- **No foundation provided by the human**: the Architect creates the stack foundation in the project,
  `.team/foundations/stacks/<name>/` (`foundation.md`, `compliance.md`, format
  `${CLAUDE_PLUGIN_ROOT}/team/conventions/foundation.md`) and the macro points to it. The human
  validates the stack at G2.
- **No invented business rule.** A functional doubt becomes a point of attention or a question to the
  PO.

## Delivering

1. Copy the template, replace `PROJECT_NAME`, replace the example diagram with the real diagram, fill
   each section, justify in one line the recommended sections that do not apply.
2. Write the ADRs in `docs/adr/` (skill `shipitright:deliverable-adr`: one HTML page per decision,
   register `docs/adr/index.html` generated by `${CLAUDE_PLUGIN_ROOT}/team/scripts/adr-pages.mjs`),
   cite them by their link where they justify a choice, and make the "Architecture decisions" section
   one sentence and the link to the register.
3. Check: `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-deliverable.mjs docs/30-design/macro.html`.
   Once the detailed design is in place, check the whole folder
   (`check-deliverable.mjs docs/30-design`), which runs the generator with `--check`: an arrow of the
   macro absent from the detailed design is an error.
4. Ask the devs for the feasibility review (forum post mentioning `dev-backend` and `dev-frontend`),
   integrate the feedback, set the status to `in-review`. For a format example
   (`${CLAUDE_PLUGIN_ROOT}/team/examples/`), the review is done by the PO.
5. Report the deviations from the stack foundation, the foundation created if any, and the points of
   attention that must go up to the human.
