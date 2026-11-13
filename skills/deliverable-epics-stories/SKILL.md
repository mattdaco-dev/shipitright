---
name: deliverable-epics-stories
description: Writes or updates the epics, user stories and spikes of a ShipItRight project, as HTML pages with metadata in meta tags (need, functional rules, Gherkin acceptance criteria, prototype screens, example data, technical notes, DoR checklist), from the templates. Used in phase P2 by the Business Analyst, by the QA for the criteria, by the Architect for the technical notes in P3, or when a story must be corrected after feedback from G1 or a review.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Deliverable: epics and user stories

Stories are the team's unit of work: the Scrum Master and the Architect split them into tickets, the
devs implement them, the QA tests their criteria, the PO carries them into the Notion board. Epics
and stories are **HTML pages**, rendered like the other deliverables: the human reads them from the
story map, agents filter them by their `<meta>` tags.

- **Author**: Business Analyst. **Contributors**: PO (priority, PO rulings), QA (acceptance
  criteria), Architect ("Technical notes" section and `endpoints` tag, in P3).
- **Phase**: P2. They go through gate **G1**, validated by the human. Technical notes are completed
  in P3, before sprint planning. A story written after G1 (releases R2, R3…) is validated by the PO,
  then shown to the human at the next G3 (see "Status and validation").
- **Files**:
  - `docs/20-specs/epics/EPIC-xx-<slug>.html`
  - `docs/20-specs/stories/US-xxx-<slug>.html` (stories and spikes)
  - prototype screenshots next to the story: `stories/US-xxx_<what-it-shows>.jpg`
- **Templates**: [`template-epic.html`](template-epic.html), [`template-us.html`](template-us.html),
  [`template-spike.html`](template-spike.html). Copying means reading the template in
  `${CLAUDE_PLUGIN_ROOT}/skills/deliverable-epics-stories/` with Read, then writing it in place with
  Write.

`check-deliverable.mjs` applies as for the other deliverables (required sections, link anchors). A
story is ready when its **Definition of Ready** checklist, at the end of the page, is fully ticked:
the counter next to the heading then shows `9 / 9` in green.

## Metadata and filtering

What an agent filters is in the `<meta>` tags of the page header, a value or a space-separated list:
`id`, `type`, `epic`, `status`, `priority`, `release`, `actor`, `screens`, `rules`, `endpoints`,
`depends_on`, `size`, `front`, `validated_by`, `validated_on`, `notion_url`. Examples:

```sh
grep -l 'name="epic" content="EPIC-02"' docs/20-specs/stories/*.html          # stories of an epic
grep -l 'name="screens" content="[^"]*SCR-04' docs/20-specs/stories/*.html    # stories that touch SCR-04
grep -L 'name="status" content="ready"' docs/20-specs/stories/*.html          # stories not ready yet
```

The visible banner (status, priority, release…) shows the same values: both are updated together.

**Size and front share: the story is the only source.** The roadmap (macro estimate) and the backlog
page read the `size` and `front` tags of the story. A revised size is corrected in the story, never
in the roadmap nor the backlog.

- `size`: `XS`, `S`, `M`, `L` or `XL`, the relative complexity of the story (scale below, "Size"
  section).
- `front`: an integer from 0 to 100, the share of the story's work on the front end, in %. The back
  end is the rest: `front` 40 means 40% front and 60% back. A purely back story is 0, purely front
  100. The banner shows it as "Front / back 40 / 60".

## Status and validation

The `status` tag takes one of these values, in journey order:

| `status` | Meaning | Shown on the backlog page |
|---|---|---|
| `draft` | page written, Definition of Ready incomplete | Written |
| `ready` | Definition of Ready fully ticked | Ready |
| `validated` | validated by the human at G1, or by the PO after G1 (see below) | Validated |
| `in-sprint` | committed in a sprint | In sprint N |
| `done` | accepted in a signed acceptance report | Delivered |
| `abandoned` | removed from the backlog; the identifier is not reused | struck through, out of the counts |

Who validates:

- **Story written before G1**: validated by the human at gate G1. `validated_by` is the name of
  the person who decided (decider, `team/glossary.md`), `validated_on` the date of G1.
- **Story written after G1** (releases R2, R3…): validated by the PO, as a PO ruling, then shown to
  the human at the next G3. `validated_by` is `po`, `validated_on` the date of the validation. If the
  story changes the scope or carries a strong business rule, the PO first raises it to the human:
  `validated_by` is then the name of the person who decided.

The `validated_by` (name of the person, or `po`) and `validated_on` (`YYYY-MM-DD`, ISO date) tags stay empty
until the story is validated. They are filled when `status` moves to `validated`, with the
"Validated" line of the banner, and do not change afterwards: a story in a sprint or done keeps who
validated it and when.

## Inputs to read

1. `docs/20-specs/story-map.html`: activities, stories and releases. One story map card = one
   story, with the same `US-xxx` identifier.
2. `docs/20-specs/functional-design.html`: rules `BR-xx`, flows, roles and rights, messages word for
   word.
3. `docs/20-ux/ux-ui-spec.html` and `prototype/`: screens `SCR-xx`, states, labels.
4. `docs/00-framing/framing.html`: personas, glossary.
5. `.team/questions/`: answers already given by the PO.

## Content of a user story

The `<meta>` tags carry what agents filter; the body carries what they read.

| Section | Level | What is expected |
|---|---|---|
| Header | required | `<meta>` tags (see above), visible banner, and **Sources** line: the FL-xx, BR-xx, MSG-xx, SCR-xx the story derives from, as links |
| Context | required | where we are in the product, what exists, why it is not enough. 2 to 4 lines |
| Need | required | "As <a single actor>, I want <capability>, so that <purpose delivered by this story>" |
| Scope | required | in the story, outside the story (downstream dependencies, excluded flows) |
| Functional rules | required | table of declarative invariants `R1`, `R2`… (anchors); a shared business rule cites its `BR-xx` as a link. In its story, a rule is written `R2`; outside its story, `US-xxx/R2` (`US-006/R2`), as a link to `…/US-xxx-<slug>.html#R2` |
| Acceptance criteria | required | numbered and named Gherkin scenarios, as plain text in `<pre class="gherkin">`; each scenario becomes a card anchored `#S1`, `#S2`…, cited `US-xxx/S1`, `US-xxx/S2`… |
| Screens and prototype | required | screen `SCR-xx`, state, link to the prototype, and one screenshot per state (`US-xxx_<slug>.jpg`). Story without a screen: say so |
| Points to settle | required | one line per question, with its `Q-xxx` badge, the assumption kept and whether it blocks. None: say so |
| Definition of Ready | required | checklist at the end of the file |
| Example data | recommended | fictional data sets for the QA and the devs, separate from the criteria, numbered `D1`, `D2`… (anchor `id="Dn"` on the row); outside the story, a set is written `US-xxx/D1`, as a link to `…/US-xxx-<slug>.html#D1` |
| Technical notes | required in P3 | filled by the Architect: generated block `gen:story-tech` (from `meta endpoints`), then constraints and the scenario, element that serves it, screen table |
| Cross-cutting requirements | recommended | table category (State, Accessibility, Labels, Performance, Security), requirement, check (scenario as a link, keyboard test, visual acceptance…) |

The Gherkin keywords are those of the project language (`team/i18n/<language>/gherkin.json`):
`Scenario`, `Given`, `When`, `Then`, `And`, `But` in English.

## Content of an epic

| Section | Level | What is expected |
|---|---|---|
| Header | required | `<meta>` tags `id`, `status`, `priority`, `release`, `notion_url`, visible banner, Sources line |
| Context | required | the problem or the opportunity, at the scale of the batch. 3 to 5 lines |
| Intent | required | what the product will be able to do at the end of the epic, from the user's point of view |
| Scope | required | in the epic, outside the epic |
| Exit conditions | required | checklist: how we know the epic is finished (closing conditions, not criteria) |
| Points to settle | required | open rulings at the scale of the batch, or "none" |

**An epic has no technical notes**: the detailed design is organized by object, and what serves a
story is in the technical notes of the story.

**An epic does not list its stories**: the list diverges at the first split. Stories carry
`<meta name="epic" content="EPIC-xx">`, and the story map shows them.

A **spike** (investigation) lives in `stories/` with an identifier `US-xxx` and
`<meta name="type" content="spike">`. It is judged on its answer: question, why now, timebox,
expected deliverable, stop criteria.

## Writing rules

**Before writing**
- **No invented business rule.** What is missing becomes a question `Q-xxx` in `.team/questions/`,
  addressed to the PO, listed in "Points to settle" and flagged where it applies by its badge
  `<a class="qmark" href="../../questions.html#Q-xxx">Q-xxx</a>`. Then regenerate the questions page
  (`node ${CLAUDE_PLUGIN_ROOT}/team/scripts/questions-page.mjs .`). A story that owns up to three
  open questions is better than one that hides three.
- **The actor is a role, never a person**, context included. In the scenarios, "the user" is enough
  when the role is unique.
- Title: an infinitive sentence or a noun phrase, never "As a".

**The five mistakes to fix at every writing**
1. **Functional content hidden outside the rules and criteria** (example data, technical notes,
   prototype). Every expected behavior goes up as a rule or a scenario.
2. **Several actors, only one declared.** A single actor in the need; the others are covered by an
   explicit rule and a dedicated scenario.
3. **Several flows, only one covered.** Creation and modification are two flows. If the rule holds
   for both, write it; otherwise say which one is excluded.
4. **A "so that" the story does not deliver.** If the purpose depends on another system, it goes to
   Context or to Scope outside the story. The "so that" is checked at the story's acceptance.
5. **A behavior described in the negative.** "The field must not be filled" does not say whether it
   is hidden, disabled or optional. Rephrase in the positive, or ask the question (`Q-xxx` badge).

**Acceptance criteria**
- **Rule or scenario?** An invariant that holds everywhere is a rule. What is observable in a given
  flow is a scenario. Putting an invariant in Gherkin multiplies the scenarios.
- A scenario carries **a name and a single behavior**, numbered in sequence: `Scenario 1: <what it
  demonstrates>`. An inserted scenario renumbers the rest. The number is used in review, in tests
  and at acceptance. It gives the scenario identifier, `US-007/S4`, which a ticket, a test or a
  campaign writes as text, as a link to its anchor `US-007-<slug>.html#S4`.
- In the `<pre class="gherkin">`, write `&lt;` and `&gt;` for the angle brackets of variable parts.
- Complete structure: `Given` / `When` / `Then`. Never a cascade of `Then` without context.
- Visible labels (message, button) are in quotes, word for word, taken from the functional design.
  Variable part between angle brackets: "Case <reference> has been closed".
- Cover: the nominal case, the blocked case, each actor that behaves differently, each flow, the edge
  case where the display condition stops being true, and the screen's error state.
- **No test data in a criterion**: no name, amount, date nor reference. Describe the condition in
  generic terms ("a closed case", "a date after today"). Concrete values go to "Example data".

**Example data**
- Fictional, consistent with `prototype/data.js` when the prototype shows them.
- Each set says which scenario it illustrates ("Scenario 2"). Data adds no behavior: if a set reveals
  a rule, it goes up into the rules.

**Technical notes (Architect)**
- The `<meta name="endpoints">` tag lists the `EP-xx` that serve the story: **required** from P3, it
  feeds the section.
- The block `<!-- gen:story-tech --><!-- /gen -->` is filled by
  `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/detailed-pages.mjs docs/30-design` (skill
  `shipitright:deliverable-detailed-design`): endpoints with their status (frozen or provisional
  operation), processes, entities and schemas, as links to the detailed design. Never edit it;
  `check-deliverable` flags a stale block.
- The Architect only writes, after the block, the **Constraints** (transaction, idempotence,
  arbitration, volume, security) and the **scenario, element that serves it, screen table**: one row
  per scenario `Sn`, with the endpoint, process or error code that serves it and the screen or
  message where it shows. It is the coverage of the story, checked at the G2 consistency pass.
- No code file paths: they age and mislead a fresh agent.

**Size**

Size measures the relative complexity of the story, not a duration: it does not depend on who
delivers (human, assisted, agent). The roadmap maps weights to it (macro estimate).

| Size | Guide |
|---|---|
| `XS` | adjustment of an existing screen or endpoint, no new rule |
| `S` | one simple screen or endpoint, one or two rules |
| `M` | one screen and one endpoint, a few rules |
| `L` | several screens or endpoints, or a delicate rule (calculation, concurrency); still fits in a sprint, in three tickets at most |
| `XL` | does not fit in a sprint, or would give more than three tickets |

**An `XL` story is split before entering a sprint, and before G1 for a release presented at G1.**
The Definition of Ready checks it: an `XL` story cannot be `ready`. The split gives new stories, with
new identifiers; the original story becomes `abandoned` or keeps the remaining part.

## From a story to tickets

At sprint planning, the Scrum Master and the Architect split each story into `T-xxx` tickets in
`.team/board/` (format in `${CLAUDE_PLUGIN_ROOT}/PROCESS.md`, section 5). The BA does not write the
tickets, but the story must allow this split without going back.

- **A story that touches back and front usually gives two tickets linked by an API contract
  operation**: the back ticket `produces` the `EP-xx`, the front ticket `consumes` them. Both carry
  `stories: [US-xxx]`.
- **Frozen operation** (`x-contract: frozen` in the API contract): back and front start in parallel,
  the front against a mock. No ticket on a **provisional operation**: the Architect freezes it at
  sprint planning, otherwise the story leaves the sprint.
- A purely front or purely back story gives a single ticket.
- The ticket brief takes the scenarios by their identifier ("covers US-007/S1 to US-007/S4", as
  links to the anchors `#S1` to `#S4`) rather than copying them: the story stays the source.
- A story that gives more than three tickets is too big: split it again.

## Prototype screenshots

One screenshot per screen and per state cited in "Screens and prototype", taken on the prototype
served locally, in Chrome at 1440 × 900, then stored next to the story: `US-006_conflicts.jpg`. The
name says what the screenshot shows. While it is missing, the page shows a hatched "screenshot to
take" placeholder and the DoR stays incomplete. The BA takes them with their own headless Chromium
(Playwright), not with the Chrome DevTools MCP reserved for the PO, when the prototype is ready;
otherwise they note it in their report and the UX produces them.

## Deliver

1. Copy the template (`template-us.html`, `template-epic.html` or `template-spike.html`) to
   `stories/US-xxx-<slug>.html` or `epics/EPIC-xx-<slug>.html`, slug in kebab-case, identifier from
   the story map. Replace `PROJECT_NAME`.
2. Fill each section and the `<meta>` tags, delete the comments and the optional sections that do
   not apply. A recommended section that does not apply keeps a line that says so.
3. Take the prototype screenshots.
4. Reread against the five mistakes, then tick the Definition of Ready (`<li class="done">`). Status
   `ready` when everything is ticked, `draft` otherwise. The BA never moves a story to `validated`:
   the PO does, and then fills `validated_by` and `validated_on` ("Status and validation" section).
5. Check: `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-deliverable.mjs docs/20-specs`.
6. Carry the questions over into `.team/questions/`, regenerate the questions page, and tell the PO
   which stories are ready. They carry them into the Notion board and fill `notion_url`.
