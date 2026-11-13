---
name: deliverable-functional-design
description: Produces or updates the "Functional design" deliverable of a ShipItRight project (functional flows, business rules BR-xx, conceptual model of the business data, lifecycles, roles and permissions, messages, calculations), as an HTML page from the template. Use in phase P2 by the Business Analyst, when the business rules must be set or corrected after feedback from G1 or from the consistency pass.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Deliverable: functional design

The functional design says **how the product behaves**, independently of screens and technology:
which flows, which rules, which business objects, who is allowed to do what. It is the reference of
the `BR-xx` rules that the stories, the UX spec and QA cite.

- **Author**: Business Analyst. **Contributor**: PO (decides on the business rules).
- **Phase**: P2, in tandem with the UX spec and the prototype. Goes through gate **G1**, validated by
  the human.
- **File**: `docs/20-specs/functional-design.html`.
- **Template**: [`template.html`](template.html), to copy then fill. Copying means reading
  `${CLAUDE_PLUGIN_ROOT}/skills/deliverable-functional-design/template.html` with Read, then writing it
  to its place in the project with Write.

## Inputs to read

1. `docs/00-framing/framing.html`: scope, personas, known business rules, glossary.
2. `docs/10-analysis/`: big picture, workstream analyses, `options.md` (chosen solution).
3. `docs/20-specs/story-map.html`: activities, stories and releases. The MVP scope comes from it.
4. `docs/20-ux/ux-ui-spec.html` if it already exists: identifiers `SCR-xx` of the screens.
5. `.team/questions/`: answers of the PO to the questions already asked.

## Content

| Section | Level | What we expect |
|---|---|---|
| Scope and references | required | reminder of the scope covered (release, epics), links to framing, analysis and story map |
| Functional flows | required | one flow `FL-xx` per activity of the story map, as a `.pf` diagram: trigger, actions, processing, diamond decisions, outcomes, rejections; rules and messages as chips |
| Business rules | required | rules numbered `BR-xx` (anchor `id`): declarative statement, scope, source, linked stories and screens. These two columns carry the traceability |
| Conceptual business data model | required | `.mcd` diagram: one object per card (name in bold, attributes `name [business type]`), named relations with the cardinality at both ends, then one sheet per object |
| Business object lifecycles | required | `.pf lifecycle` diagram per object that has a status (states, transitions and their event), then the actor and condition table |
| Roles and permissions | required | role × action matrix, with the scope restrictions ("their own files", "their branch") |
| Questions and hypotheses | required | `Q-xxx` asked to the PO, current hypotheses. Empty list: write it |
| Notifications and messages | recommended | messages, e-mails, notifications: trigger, recipient, wording word for word |
| Business calculations and algorithms | recommended | formula, inputs, rounding, fictitious worked example |
| Business non-functional requirements | recommended | lead times, volumes, availability, retention, expressed by the business and measurable |
| Additional glossary | optional | terms that appeared after the framing |

## Diagrams

Every diagram of the deliverable follows the same formalism as the big picture: cards coloured by type,
arrows routed by `doc.js`, references as clickable chips. No Mermaid. Each element is placed on a grid
by `data-c` (column) and `data-r` (row), links by `data-links`.

- **Flows** (`.pf`): `start`, `user` (with the actor in `<small>`), `system`, `decision`, `end`,
  `error`, `stop`. A decision is a question of 2 to 4 words ("Room already taken?"). Its main branch
  goes right, the alternative right below. 6 columns at most.
- **Conceptual model** (`.mcd`): `data-links="target|verb|card. source side|card. target side"`, with
  `0:1`, `1:1`, `0:n`, `1:n`. Relations never merge. Lay out the objects so that each relation is a
  straight line, one relation per side of an object if possible.
- **Lifecycles** (`.pf lifecycle`): `dot` for the initial state, `state` for a state, `state final`
  for a terminal state. Several transitions between the same two states: a single arrow ("cancelled
  (3 cases)"), the detail in the table.

Check in a browser: a label that does not fit on its arrow moves to a numbered legend under the
diagram. It is the sign that the cards must be spread out or the label shortened.

## Quality rules

- **One rule, one declarative sentence.** "A terminated contract can no longer be modified", not "the
  system must check that…". A rule can be tested without reading the rest of the page.
- **`BR-xx` identifiers are stable.** They are never renumbered; an abandoned rule stays in the table,
  struck through, with the reason. The rules of the framing keep their number.
- **Each rule has a source**: framing, answer `Q-xxx`, analysis, regulation. Without a source, it is a
  hypothesis: block `callout hypothesis`.
- **No invented business rule.** What is missing becomes a question `Q-xxx` in `.team/questions/`,
  addressed to the PO, and a badge `<a class="qmark" href="../questions.html#Q-xxx">Q-xxx</a>` at the
  place concerned.
- **Business, not physical.** The conceptual model talks about objects the user knows (contract,
  claim, policyholder). No technical keys, tables or SQL types: that is the work of the Architect in
  P3.
- **Messages are written word for word**, with the variable parts between angle brackets:
  "Contract <number> has been terminated". The UX spec and the Gherkin criteria take them over as is.
- **Glossary terms are used word for word.**
- **Roles, never people**, and fictitious example data.

## Delivering

1. Copy the template, replace `PROJECT_NAME`, fill each section. Recommended sections that do not apply
   keep a line of justification; optional ones that do not apply are deleted.
2. Check the traceability: each `BR-xx` has at least one story in its Stories column, each story of
   the MVP release that carries a rule cites it.
3. Check: `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-deliverable.mjs docs/20-specs`.
4. Copy the open questions into `.team/questions/`, set the status to `in-review` and tell the PO
   that the deliverable is ready for the consistency pass.
