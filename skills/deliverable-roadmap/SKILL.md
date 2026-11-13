---
name: deliverable-roadmap
description: Produces or updates the "Roadmap" deliverable of a ShipItRight project (releases and acceptance dates, phases × releases × epics grid, macro estimate per delivery mode, team composition, schedule computed by simulation with a comparison of the modes, dependencies and risks, changelog, calibration), as an HTML page from the template. Used in phase P2 when the PO sets the first roadmap from the story map, then at each sprint end after acceptance.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Deliverable: roadmap

The roadmap says **when** we plan to deliver what, with which team, and what can make the dates
slip. It takes the releases of the story map, places them in a grid by phase and by release,
estimates the work and computes a schedule by simulation: scheduling under capacity constraints,
then Monte Carlo for a probable date and a prudent date. It is the document the PO shows the human to
talk about lead times and team.

- **Author**: PO. **Contributors**: Scrum Master (calibration, actual progress), Architect (macro
  estimate, technical dependencies, risks).
- **Phase**: first version in P2, goes through gate **G1**. Updated at each sprint end, after the
  G3 acceptance.
- **File**: `docs/roadmap.html`, at the root of `docs/`. Assets are therefore in `_assets/`
  (`doc.css`, `doc.js`, `plan.js`), the dashboard page in `index.html` (no `../`).
- **Template**: [`template.html`](template.html), to copy then fill. Copying means reading
  `${CLAUDE_PLUGIN_ROOT}/skills/deliverable-roadmap/template.html` with Read, then writing it in
  place in the project with Write.
- **Filled example**: `${CLAUDE_PLUGIN_ROOT}/team/examples/formats/docs/roadmap.html`.

## Inputs

- `docs/20-specs/story-map.html`: releases, goals, stories per release.
- `docs/20-specs/epics/` and `docs/20-specs/stories/`: epics (grid rows), stories, dependencies, and
  the size of each story (tags `size`, XS to XL, and `front`, front-end share in %).
- `docs/00-framing/framing.html`: milestones, calendar constraints, wished go-live if any.
- The Architect and the SM for the macro estimate (work outside stories; the size and front share
  of a story are set in the story, not in the roadmap), external teams for their delivery dates.
- At each update: `docs/sprints/sprint-N.html` (plan, review),
  `docs/50-acceptance/report-sprint-N.html`, the journal `.team/journal.md`, the estimated and
  actual time of the sprint given by the SM.

The PO delegates the update to the Scrum Master if they prefer to keep their context: the SM
prepares, the PO reviews and validates.

## Content

| Section | Level | What is expected |
|---|---|---|
| Releases | required | for each release: goal (taken from the story map), probable and prudent G3 acceptance date (`data-plan`), epics, number of stories, status |
| Roadmap | required | grid: one column per phase P0 to P3, then one per release (Later for stories without a release); Deliverables row, then one row per epic; gates between columns (`data-gate`, see Grid) |
| Macro estimate | required | disclaimer on the source of the estimates, definitions, one table per batch (design, then each release) with its total, then the project total |
| Team composition | required | host `.capa-team`: plan.js renders the team and the effect of one full-time more or less, mode by mode |
| Delivery schedule | required | disclaimer, assumptions, legend, JSON configuration of the schedule, assumption on the gates |
| Dependencies and risks | required | internal and external dependencies, risks on the schedule with impact and countermeasure. None: say so |
| Changelog | recommended | at each update: what moved, why, who decided it |
| Calibration | optional | host `.capa-calib`: plan.js lists the measured sprints and the factor that corrects the estimates |

No Now / Next / Later section: the grid and the schedule replace it. No sprints in the grid nor in
the estimate: the schedule computes the dates, the split into sprints is done at sprint planning.

## The three delivery modes

The whole roadmap reasons on three modes, in this tab order; "AI-assisted human" is the default
mode, the one of the dates quoted in the text.

- **Human**: developers without assistance, tests included.
- **AI-assisted human**: the same with a coding assistant; an AI-automated QA campaign precedes each
  acceptance.
- **Autonomous AI**: the agent team, in working hours; the human keeps the gates, the business
  validation and the acceptance.

In every mode, the business validation of each story and the acceptance belong to the PO and the
acceptance helpers (BA, business people, testers). UX is a cross-cutting team that never blocks: it
appears in the team, out of the calculation.

## Macro estimate

A single `.est` block (scale set with the gear wheel, in the reader's browser), with an
`h4.est-title` and a `table.heat` per batch, then a `table.est-sum` for the project total.

- **Columns**: Story or work, Size, Front, then the group "Delivery by mode" (Human in d, AI-assisted
  in d, Autonomous AI in agent hours), then "Validation, acceptance" (d, every mode).
- **Story**: `<tr data-size="M" data-front="60" data-rel="mvp">`, empty cells `e-front`, `e-h`,
  `e-a`, `e-ag`, `e-hu`. The first link of the row is the story identifier, which the schedule
  reuses. `data-size` and `data-front` copy the `size` and `front` tags of the story page, the only
  source: the roadmap has no size of its own, and a story that changes size changes first in its
  page. An XL story is split before entering a sprint; a spike has no size, it keeps its `timebox`.
- **Work outside stories** (design, foundation, QA campaign and acceptance):
  `<tr class="work" data-rel="mvp" data-items="qa-mvp acceptance-mvp">`, empty cells. The values come
  from the schedule items: they are written only once, in the configuration. Design rows carry
  `data-rel="design"`.
- **Totals**: `<tr class="total" data-rel="mvp">`, and `data-only="stories"` for a stories subtotal;
  `<span data-est="mvp:h">` elsewhere in the page, `*:h` for the whole project.
- **Source**: the opening callout says where the estimates come from. In P2, it is the macro
  estimate of the Architect and the SM. When the team has estimated the stories in the project tool,
  its estimates replace them and the callout says so.

## Grid

Gates sit on the header of the column they close: `<div class="rm-head" data-gate="G1"
data-gate-name="Functional design approval">`. As long as the gate is not crossed, `data-gate` holds
only its name (`G1`); crossed, it holds the decision code, its ISO date and the name of the person
who decided: `data-gate="G1|validated|2026-10-12|Claire Martin"` (`accepted` for a G3). These codes are never translated;
`data-gate-name` gives the gate in plain words, in the project language, for the tooltip. The
section carries `data-section="roadmap"`, and the page header the metas `status` (`draft`,
`in-review`, `validated`), `date` (ISO) and `version`, aligned with its fields: the dashboard page
reads them, never the visible text. Every gate is human: the grid carries no decision maker. A
release column carries the G3 that closes it, crossed when all its stories are accepted in a signed
acceptance report, with or without reservations.

## Delivery schedule

The calculation is in `_assets/plan.js`; the page only carries its configuration, in
`<div class="capa"><script type="application/json">…</script></div>`. The full schema is at the top
of `plan.js`. The essentials:

- `start`: wished start. The remaining work never starts before today. `today` is set only to
  freeze a snapshot (an example).
- `holidays`: days not worked.
- `modes`: `human`, `assisted` (`"default": true`), `ai`, each with its `note`.
- `profiles`: profiles in full-time equivalents. Devs (`front`, `back`, `full`, `team: "dev"`,
  limited to the `human` and `assisted` modes), the acceptance helpers (`acceptance`, `validation`),
  agents (`unit: "h"`, mode `ai`), the PO (`fixed`, the only one holding the gates) and the UX
  (`fixed`, `calc: false`).
- `rules`: coordination loss, people at most per story, error margin, simulations,
  `calibration.sprints`: one `{ "sprint": N, "estimated": …, "actual": … }` per measured sprint, in
  agent hours. `estimated`: the estimate of the delivered stories; `actual`: the agent hours of their
  tickets, from the launch of each agent to its report, reviews and fixes included, read from the
  journal (`.team/journal.md`).
- `releases`: each with the G3 gate that closes it, and `due` only if the framing or the human gives
  a wished go-live.
- `items`: P0 done (`start`/`end`), design phases (`d` per mode in days, `work` in agent hours for
  `ai`), gate reviews on `gate`, gates (`gate: true`), external deliveries (`team`, `deliver` = date
  they commit to, `duration` to draw the bar), foundation, QA campaign (`d` in assisted, agents in
  AI), acceptance (`work.all` on `acceptance`).
- `storyDeps`, `storyAfter`, `storyGroup`, `groups`: dependencies and groupings of the schedule.
- After P3, a ticket `{ "id": "T-020", "story": "US-006", "work": {…} }` replaces the delivery of its
  story; the story keeps its business validation, after all its tickets.

The reader's trials (team, dates, rules) stay in their browser; the page configuration is the
reference.

## Quality rules

- **The roadmap follows the story map.** A release has the same name, the same goal, the same
  stories. If a release's content changes, both change.
- **Size comes from the story.** `data-size` and `data-front` of a story row take the `size` and
  `front` tags of its page; a gap is fixed in the roadmap, which follows the story. The backlog page
  reads the same tags.
- **One source per datum.** Dates quoted in the text go through `data-plan`, work outside stories
  through `data-items`, measured sprints through `rules.calibration.sprints`. Never a date or an
  effort copied by hand.
- **The schedule is an aid, not a commitment.** The disclaimer stays at the top of the section, and
  every guessed value is in the assumptions.
- **A wished go-live comes from the framing or the human.** Without it, `due` stays empty.
- **The past is true, the future is a forecast.** Accepted deliverables and stories move to `done`
  according to the acceptance report. What slipped shows at its new place, and the changelog says
  why.
- **A risk has a countermeasure**, or a question `Q-xxx` that will look for it.
- **The changelog is not rewritten**: an update adds a row at the top.

## Deliver

1. First version: copy the template to `docs/roadmap.html`, replace `PROJECT_NAME`, fill each
   section and the schedule configuration, delete the examples.
2. Sprint end: move what is accepted to `done`, add the measured sprint to
   `rules.calibration.sprints` (agent hours, figures from the sprint page), after P3 replace the
   stories by their tickets, adjust the dates of external teams, add a row to the changelog, bump
   the version and the date.
3. Check: `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-deliverable.mjs docs/roadmap.html`. It also
   checks the schedule configuration (JSON, references, skills without a profile).
4. Open the page: the schedule summary, the "Extra profiles" block and the comparison of the modes
   must flag nothing unexpected.
5. Report: file path, version, probable and prudent release dates, what moved since the previous
   version, open risks.
