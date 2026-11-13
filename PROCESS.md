# ShipItRight process

ShipItRight (Product Builder): a team of Claude Code agents that builds a product, from the need to acceptance.

How the team turns an expression of need into accepted software. This document is the shared
reference: the PO applies it, the agents refer to it, the Scrum Master proposes changes to it after
each retro.

**Paths.** ShipItRight is a Claude Code plugin. In this document and in the other framework
documents (`team/…`), a path such as `team/conventions/git.md`, `skills/…` or `agents/…` starts from
the plugin root, written `<plugin root>` (the agent file or skill that points here gives its real
path); a path such as `.team/…`, `docs/…` or `prototype/…` starts from the project root, the folder
where Claude Code is opened. A skill is invoked with its prefixed name, `shipitright:<name>`.

## 1. Principles

1. **The human only talks to the PO.** The PO is the only point of contact between the business and
   the team. No other agent addresses the human.
2. **Rigor lives in the gates, not in the sequence.** The deliverables of a phase can move forward
   together (specs and prototype, for example), but nothing unresolved passes a gate. The files on
   disk are the gates: a missing or incomplete deliverable blocks.
3. **The PO routes, it does not read the code.** It dispatches the agents, reads the board statuses,
   the reports, the forum headers and the `git log`. Its context stays available to the human.
4. **An agent starts cold.** It does not see the conversation. Everything it needs is in its brief
   and in the files the brief points to.
5. **Each one writes in its own file or appends.** One file per ticket, one file per forum topic,
   posts appended only. Two agents in parallel cannot overwrite each other.
6. **Rigor follows the stakes, not the clock.** The more costly an error is to undo (security, data
   migration, shared contract), the stricter the review and the smaller the tickets.
7. **A structural inconsistency is never settled autonomously.** It goes up to the human through the
   PO.

## 2. Roles

| Role | File | Main responsibility | Instances |
|---|---|---|---|
| **PO** | `agents/po.md` (main agent, through `settings.json`) | need, priorities, business rules, orchestration, gates | 1 |
| **Scrum Master** | `agents/scrum-master.md` | sprint plan, DoR/DoD, pre-G2 checklist, retro (problems, actions, proposed plugin changes) | 1 |
| **Business Analyst** | `agents/business-analyst.md` | analysis, big picture, story map, functional design, epics and stories | 1 to N |
| **UX/UI Designer** | `agents/ux-designer.md` | flows, screens, UX/UI spec, prototype | 1 |
| **Architect** | `agents/architect.md` | macro and detailed design, API contract, compliance, ADR | 1 |
| **Dev backend** | `agents/dev-backend.md` | backend tickets, in the stack of the foundation | 1 to N |
| **Dev frontend** | `agents/dev-frontend.md` | frontend tickets, in the stack and design system of the foundation | 1 to N |
| **QA** | `agents/qa.md` | test strategy, e2e, campaigns, defects | 1 to N |
| **Reviewer** | `agents/reviewer.md` | independent reviews, consistency and integration passes | 1 per review |

Each file describes the role, the skills, the expectations, the deliverables, the usable skills and
MCP, the limits and the multiplicity. Multiple roles multiply with the production and testing load:
as many instances as independent and ready work items, **5 simultaneous agents at most** across all
roles.

The PO is the plugin's main agent: when the plugin is enabled, its file replaces Claude Code's
default prompt, and it launches the other roles as sub-agents (`shipitright:<role>`). Sub-agents
preload the skill `shipitright:team-rules` and the skills of their deliverables. Each keeps a
persistent memory per role in the project (`.claude/agent-memory/shipitright-<role>/`), where it
records what it learned about this project. This memory has project scope: it is committed with the
project, like its deliverables.

## 3. Tree

The plugin, installed from the marketplace (read-only copy in Claude Code's cache) or loaded in
development with `claude --plugin-dir`:

```
shipitright/                 <plugin root>
  .claude-plugin/            plugin.json (name, version), marketplace.json
  settings.json              {"agent": "po"}: the PO is the main agent
  package.json               scripts dependency (yaml), installed with the plugin
  PROCESS.md                 this document
  agents/                    po.md (main agent) and one file per sub-agent role
  skills/                    team-rules, project-init, notion-board, proto-bar, deliverable-<type> (template + requirements)
  team/
    deliverables.md          deliverables catalogue
    glossary.md              identifiers and link targets, abbreviations, team vocabulary
    conventions/             brief, report, ticket, forum, git, foundation, language
    assets/                  doc.css, doc.js: library of the HTML deliverables
    i18n/                    labels of the generated pages and assets, per language
    scripts/                 init-project.sh, check-deliverable.mjs, questions-page.mjs, detailed-pages.mjs,
                             adr-pages.mjs, dashboard-pages.mjs (argument: the project, `.` by default)
    examples/formats/        frozen formats of the deliverables, filled by hand
```

The plugin ships no foundation: the stack and the design system belong to the user or to the
project (section 8).

The project is the folder where Claude Code is opened, and its own git repository:

```
<project>/
  .team/
    board/                   one file per ticket or defect
    forum/                   one file per topic
    questions/               business questions to the PO
    project.json             project language ({ "language": "<BCP 47 code>" }), team/conventions/language.md
    labels.json              labels of the generated pages, for a language the plugin does not provide
    journal.md               one line per event, kept by the PO
    foundation.md            chosen foundations (stack, design system) and project overrides
    foundations/             foundations created for the project: stacks/<name>/, design-systems/<name>/
    notion.md                links of the Notion board, if it exists
  .claude/agent-memory/      persistent memory of each role (shipitright-<role>/), committed
  docs/
    index.html               dashboard page, generated by dashboard-pages.mjs (replaces the portal)
    _assets/                 copy of team/assets, plus i18n.js (labels in the project language)
    00-framing/  10-analysis/  20-specs/  20-ux/  30-design/  40-qa/  50-acceptance/  sprints/  adr/
    30-design/
      macro.html             macro technical design
      api/                   API contract: openapi.yaml (root), paths/, components/
      detailed/              detailed technical design per object: index.html (contents), endpoints/, schemas/
                             (generated), entities/, processes/ (by hand), cross-cutting/ (including
                             compliance.html, compliance contract), open-points.html, swagger.html
    10-analysis/
      index.html             inventory of the workstream analyses, generated by dashboard-pages.mjs
    20-specs/
      backlog.html           backlog page, generated by dashboard-pages.mjs
    roadmap.html
  prototype/                 vanilla HTML/CSS/JS, proto-bar, fictional data
  backend/  frontend/        depending on the stack foundation
```

Scripts run from the project root:
`node <plugin root>/team/scripts/<script>.mjs .` (see **Paths** at the top of this document).

## 4. Project life cycle

```
P0 Framing ─G0─▶ P1 Analysis ─▶ P2 Specs, UX, prototype ─G1─▶ P3 Technical design ─G2─▶ Sprints
Sprint N: Planning ▶ Dev in waves ▶ Reviews ▶ QA ▶ Integration ▶ Pre-acceptance ─G3─▶ Review, retro
```

Human gates: **G0** (framing), **G1** (validation), **G2** (technical design), **G3** (acceptance).
The detail of each deliverable (required, recommended, optional content) is in its skill; the
overview in `team/deliverables.md`.

### P0 Framing, with the human

- **Participants**: PO + human. Interactive mode: questions one by one, each with the expected
  answer (skill `shipitright:deliverable-framing`).
- **Deliverable**: framing and vision (`docs/00-framing/framing.html`), declared foundations
  (`.team/foundation.md`).
- **Before**: creation of the project (`shipitright:project-init`), then of the Notion board
  (`shipitright:notion-board`) if the Notion MCP is available; without it, this step is skipped.
- **Foundations**: the PO asks the human for their stack and design system (a source of theirs:
  folder, git repository, MCP, skill, URL), or decides with them that they will be created in the
  project (stack by the Architect in P3, design system by the UX in P2).
- **G0, validated by the human**: vision and scope accepted, stack and design system foundations
  declared (or to create, with their author), open questions listed with an owner.

### P1 Analysis and exploration, autonomous

- **Participants**: BA (1 to N, one per workstream), UX for the exploration of uses, Architect
  consulted on feasibility.
- **Deliverables**: big picture, one analysis per workstream, first version of the story map. The
  analysis inventory (`docs/10-analysis/index.html`) is generated from the analysis pages. Each
  analysis carries its target, the phase or release it prepares (meta `target`: `P1` in P1; after
  G1, the phase or release aimed at).
- **Mode**: the PO splits into independent workstreams and launches one BA per workstream in
  parallel. A non-blocking question does not stop a workstream: visible `HYPOTHESIS`, and on we go.
- **Progress and status**: an analysis carries the progress of its workstream (`in progress` as long
  as the timebox is not used up and a pass remains to be done, `done`, `partial`) and, separately,
  the status of its page (`draft`, `in review`, `validated`). Its author is "AI" when a team agent
  handled it, otherwise the name of the person who did it; the BA instance stays traced in the
  journal.
- **Workstream opened after G1**: the PO can open an analysis workstream after G1 to prepare a later
  phase or release. The stories that come out of it follow the rule of stories written after G1
  (P2).

### P2 Functional specs, UX/UI and prototype, autonomous

- **Participants**: BA (story map, functional design, epics and stories), UX (UX/UI spec, prototype,
  design system foundation if it must be created), PO (roadmap), in tandem.
- **Deliverables**: story map, functional design, epics and stories, UX/UI spec, prototype, roadmap.
- **Story size**: each story carries its size (XS to XL) and its front share; the roadmap and the
  backlog page read them. An XL story does not move to `ready`: those of the releases presented at
  G1 are split before G1.
- **Consistency pass**: a fresh Reviewer cross-checks stories, rules, screens and prototype before
  G1.
- **G1, validated by the human**: the PO presents the prototype and a summary. Feedback becomes P2
  corrections, then the gate is presented again.
- **After G1**: epics and stories carried over to the Notion board, if it exists.
- **Story written after G1**, whether or not it comes from an analysis workstream opened after G1:
  the PO validates it (`PO ruling`, status `validated`), then shows it to the human at the next G3.
  It goes up to them earlier, without waiting for that gate, if it changes the scope or carries a
  strong business rule.

### P3 Technical design, autonomous

- **Participants**: Architect (author), devs (feasibility review), QA (test strategy).
- **Deliverables**: macro technical design; detailed technical design of **the whole application**,
  organized per object (`docs/30-design/detailed/`); API contract (`api/openapi.yaml` and its linked
  files); compliance contract (`detailed/cross-cutting/compliance.html`); ADR (HTML pages
  `docs/adr/NNNN-<slug>.html`, register `docs/adr/index.html` generated by
  `team/scripts/adr-pages.mjs`); test strategy. The endpoint and schema pages are generated from the
  API contract by `team/scripts/detailed-pages.mjs`, the entity and process pages are written by hand
  with their computed blocks. The Architect completes the technical notes of the stories: generated
  block and scenario, element, screen table.
- **Frozen or provisional operations**: an operation of the API contract is frozen (nothing is
  removed or changed in it, only announced backward-compatible additions are allowed; the front can
  start on a mock) or provisional (it waits for a business answer, its detail is reduced). A
  provisional operation is frozen at the sprint planning that takes it.
- **Consistency pass**: each story covered by at least one endpoint and one screen (technical notes
  of the stories), a data model that carries all the rules, macro and API contract in agreement,
  each story scenario present in the coverage matrix of the test strategy.
- **Check before G2**: the Scrum Master checks the checklist, including the test strategy present,
  `check-deliverable.mjs` with no KO on `docs/` (it runs `detailed-pages.mjs --check`,
  `adr-pages.mjs --check` and `dashboard-pages.mjs --check`: generated pages, ADR register and
  dashboard page up to date, references resolved) and the Redocly lint of the API contract with no
  error. The Architect checks the machine's tooling and lists what must be installed.
- **G2, validated by the human**: the technical design is reviewed by the human technical team and
  architecture team. The PO presents the design pages and a summary to the human; the human has these
  teams review them before validating. **Any deviation from the stack foundation or the architecture
  standard goes up to them** (`proposed` ADR with a foundation deviation, listed in the register
  `docs/adr/index.html`), with the high-impact open points of the detailed design
  (`detailed/open-points.html`), the tooling to install, for approval, and the foundation created for
  the project if there is one, validated at this gate. Feedback becomes P3 corrections, then the gate
  is presented again.

### Sprint N, autonomous

1. **Planning**: the PO chooses the batch of stories, all validated (at G1, or by the PO for a story
   written after G1, shown to the human at the next G3, see P2) and none of size XL; the Architect
   freezes the provisional operations they touch, then updates the version (`info.version`) and the
   changelog (`info.x-changelog`) of the API contract as soon as it freezes or adds an operation. The
   SM and the Architect split the batch into tickets from the pages of the detailed design
   (endpoints, processes, entities, per-screen view), set dependencies and waves, check the DoR. The
   SM also plans, in the list of tickets to create, one `e2e` ticket per batch of stories, entrusted
   to a QA instance (`team/conventions/ticket.md`); the PO creates its file, as for any ticket. The
   coverage matrix of the test strategy, complete at G2, is updated by the QA for any story added or
   modified after G2. Sprint page, tickets in the board, Notion sync if it exists.
2. **Dev in waves**: tickets whose dependencies are closed, 3 in parallel as a target, 5 at most,
   each in its worktree. A frontend ticket that consumes a frozen operation does not depend on the
   backend ticket that produces it: it starts at the same time, on a mock. The QA's `e2e` tickets go
   out in these waves: tests written and tuned in Local. An `e2e` ticket has no dependency: it goes
   out in a dev wave and is tuned as merges land, so it can close after the following waves; the
   Wave column of the sprint page says where it goes out.
3. **Independent review** of each returned ticket by a fresh Reviewer. Blocking → back to the author,
   3 correction rounds at most, then escalation to the human. No blocking → merge into `sprint/N`. If
   the author fixes majors before the merge, the fix is reviewed by a fresh Reviewer on those findings
   only, unless it only adds tests; the PO records this choice in the journal. A ticket that touches
   the API contract is reviewed with `detailed-pages.mjs --check` and the Redocly lint, and against
   `INV-58` (nothing changes in a frozen operation).
4. **QA**, in two stages: (1) the `e2e` tickets are written, reviewed and merged like the other
   tickets (steps 2 and 3); (2) the campaign runs on the "Demo and acceptance" environment, which the
   QA starts at the `sprint/N` commit that contains the merged `e2e` tickets, noted in the campaign,
   and restarts after each fix merge. The last commit run is the accepted commit; the double run
   required by the exit criterion is done at this commit, so a fix merged at the end of the campaign
   is run twice. The evidence of manual checks (restart, screen reader…) is versioned in
   `docs/40-qa/evidence/sprint-N/` and linked from the campaign; the Playwright HTML report stays out
   of git. Test data: a unique name per run, a test seed that goes through no story endpoint.
   Defects `BUG-xxx` handled within the sprint: the QA commits the defect's test, red, on its fix
   branch created from `sprint/N` (`team/conventions/git.md`), the dev fixes on the same branch,
   review and merge as for a ticket. Verdict: favorable without reservations if no defect is open;
   favorable with reservations if only minor ones are open, or a major one accepted in writing by the
   PO in the campaign; unfavorable if a blocking one is open or a major one not accepted. After its
   last run, fix replays included, the QA resets "Demo and acceptance" before pre-acceptance; the PO
   makes sure of it.
5. **Integration**: a fresh Reviewer goes over the whole merged set.
6. **Pre-acceptance** (PO): campaign verdict favorable, with or without reservations; each sprint
   story has its criteria green, except a scenario turned red by a defect admitted in the verdict
   (minor, or major accepted in writing by the PO), cited in the campaign; acceptance path ready.
7. **G3 Acceptance, with the human**: acceptance report, at the accepted commit. Reservations become
   tickets; a minor defect left open in the verdict is carried over as a reservation `RES-xx`. A
   reservation is lifted when the item linked to it (the defect `BUG-xxx` or the ticket `T-xxx`
   created for it) moves to status `done`.
8. **Review and retro** (SM): sprint page completed; its Retro section chains problems `Sn-Pm`,
   actions `Sn-Am` and proposed plugin changes `Sn-Em`, which the PO submits to the human. Roadmap
   updated. An accepted change is not applied in the installed plugin (read-only copy, overwritten at
   each update): it goes as a proposal to the ShipItRight repository, where it is applied and ships
   in a new version.

## 5. Board, forum, exchanges

- **Local board** (`.team/board/`): source of truth. Format and rules: `team/conventions/ticket.md`.
  Only the PO changes a status or an assignment.
- **Notion board**, optional (Notion MCP): mirror for the human, kept by the PO alone, synced in
  batches (skill `shipitright:notion-board`).
- **Dashboard page, backlog and analysis inventory** (`docs/index.html`,
  `docs/20-specs/backlog.html`, `docs/10-analysis/index.html`): the human's view of the project
  (Overview, Hotspot, indicators, latest events), of the stories and of the analysis workstreams; the
  inventory opens from the "Workstream analyses" card that the dashboard page shows in each Overview
  column that has at least one workstream (target read from the meta `target`). Generated by
  `team/scripts/dashboard-pages.mjs` from the journal, the board, the questions and the deliverables'
  meta; the PO regenerates them at each wave sync, at each gate and at each merge into `sprint/N`. No
  journal line of their own, neither planned date nor delay. Skill `shipitright:deliverable-dashboard`.
- **Forum and questions**: `team/conventions/forum.md`.
- **Brief and report**: `team/conventions/brief.md` and `report.md`.
- **Git**: `team/conventions/git.md`.

## 6. Ceremonies

No daily: an agent dev cycle lasts a few minutes, a sync in the middle would have nothing to sync.

| Ceremony | When | Who | Output |
|---|---|---|---|
| Phase launch | entry of each phase | PO | agent briefs |
| Handoff | exit of each agent | the agent | report, forum posts |
| Wave sync | after each parallel wave | PO | statuses, answers to questions, dashboard page regenerated, next wave |
| Sprint planning | sprint start | SM, Architect | batch operations frozen, API contract version, sprint page, tickets |
| Gate | end of P0, P2 and P3, end of sprint (G3) | PO + human | decision recorded in the journal, dashboard page regenerated |
| Acceptance | end of sprint | PO + human | acceptance report |
| Review and retro | after acceptance | SM | sprint page completed: actions `Sn-Am`, proposed plugin changes `Sn-Em` |

## 7. Definition of Ready and Definition of Done

**DoR of a story** (story checkbox, skill `shipitright:deliverable-epics-stories`)
- its size (`size`, XS to XL) and its front share (`front`) are filled in;
- it is not size XL: an XL story does not move to `ready`, it is split first. An XL of a release
  presented at G1 is therefore split before G1; an XL written later, before entering a sprint.

**DoR of a ticket**
- the linked stories are validated (at G1, or by the PO for a story written after G1), so none is
  size XL;
- the brief describes the behavior, the signatures and the criteria, without code paths; it cites
  the scenarios `US-xxx/Sn` it serves and the story's example data sets that illustrate them;
- `consumes` and `produces` are filled in;
- the dependencies are closed;
- the API contract operations it produces or consumes are frozen;
- for an `e2e` ticket, the coverage matrix of the test strategy is up to date;
- it fits in a fresh context (otherwise, split it).

**DoD of a ticket**
- green build, green unit tests;
- self-review against the role's checklist done;
- independent review with no blocking finding;
- compliance contract respected (`detailed/cross-cutting/compliance.html`);
- report filled in;
- commit on the ticket branch, merged into `sprint/N`.

**DoD of a document deliverable**
- `check-deliverable.mjs` with no KO;
- recommended items present or justified in one line;
- consistency pass with no blocking finding before its gate.

**DoD of a sprint**
- campaign verdict favorable, with or without reservations;
- all Gherkin criteria of the sprint stories covered by a green test, at the level set by the
  coverage matrix of the test strategy (a scenario "without e2e" is covered by a test of the
  complementary level); a scenario may stay red if it is turned red by a defect admitted in the
  verdict (minor, or major accepted in writing by the PO), cited in the campaign;
- integration pass with no blocking finding;
- acceptance report signed by the human.

## 8. Foundations: stack and design system

The plugin ships neither stack nor design system: they belong to the user. Each project declares its
own at framing in `.team/foundation.md`, as **foundations**: either a user source (local folder, git
repository, MCP, skill, URL), or a foundation created in the project
(`.team/foundations/stacks/<name>/`, `.team/foundations/design-systems/<name>/`). Format, sources and
rules: `team/conventions/foundation.md`.

- **Deliverables cite the foundation, they do not copy it**: the macro design points to the stack,
  the UX/UI spec to the design system; only the product's deviations and additions appear in them.
- **No foundation provided by the human**: the Architect creates the stack foundation in P3 in
  `.team/foundations/stacks/<name>/` (validated at G2), the UX creates a minimal design system in P2
  in `.team/foundations/design-systems/<name>/` (validated at G1). These foundations are versioned
  with the project.
- **Constant whatever the foundation**: API contract in OpenAPI 3, split into several files
  (`api/openapi.yaml` root, `paths/`, `components/`) linked by `$ref`, domain unit tests, e2e in
  Playwright driven by the QA, prototype in vanilla HTML/CSS/JS with `proto-bar` and fictional data,
  using the design system tokens.
- **Any deviation from the stack foundation** goes through an ADR with status proposed
  (`meta status proposed`) and goes up to the human. A deviation from the design system is justified
  in the UX/UI spec.

**Tooling**: the team installs what the foundation requires (runtime, build tool, Docker…) at first
need, after the human's approval requested by the PO.

## 9. What goes up to the human

The PO interrupts autonomy and addresses the human for:

- gates G0, G1, G2, G3;
- a business question it cannot settle (grouped, not one by one);
- a deviation from the stack foundation or the architecture standard;
- a structural inconsistency between tickets or between deliverables;
- a review → correction loop that does not converge within 3 correction rounds;
- installing a tool on the machine;
- the Notion page where to create the board of a new project;
- any irreversible operation outside the project repository.

The rest of the time, the team moves on its own and the PO keeps the human informed with a short
update at the end of each phase.
