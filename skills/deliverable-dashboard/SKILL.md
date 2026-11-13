---
name: deliverable-dashboard
description: Generates and keeps up to date the dashboard page of a ShipItRight project (docs/index.html, which replaces the portal: phase, release and next gate, overview of deliverables and sprints, gates, hotspots, indicators, latest events), its backlog page (docs/20-specs/backlog.html: summary per release, stories per epic with derived status, size, front share, details, gaps between sources) and the analyses inventory (docs/10-analysis/index.html: one row per workstream: author, progress, status, phase or release prepared (Target), recommendation, what remains open, impacted deliverables), with the dashboard-pages.mjs script, from the project files. Used by the PO at each wave sync, each gate and each merge, or when the deliverable check flags a dashboard page to regenerate.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Deliverable: dashboard, backlog and workstream analyses

Three **generated** pages, never edited by hand: they reread what the team already wrote elsewhere
and show it to the human at a glance.

- **Dashboard page** (`docs/index.html`): where the project stands, what only the human can decide,
  progress and quality figures, the latest journal events. It replaces the project portal:
  deliverables point back to it with "← Project dashboard".
- **Backlog** (`docs/20-specs/backlog.html`): each story in its place in the journey, grouped by
  epic, with its release, its size, its front share and what details its status; and the **gaps
  between sources**, which the PO reconciles before the next planning.
- **Workstream analyses** (`docs/10-analysis/index.html`): one row per analysis workstream, with the
  question asked, who handled it, its progress, its status, the phase or release it prepares, its
  recommendation, what it leaves open and the deliverables it touches.

- **Producer**: the PO, through the script; nobody writes them.
- **When**: at each wave sync, at each gate (once the decision is logged in the journal and the
  deliverable status updated), at each merge into `sprint/N`. `check-deliverable.mjs` flags a page
  that is out of date.
- **Templates**: [`template-dashboard.html`](template-dashboard.html),
  [`template-backlog.html`](template-backlog.html),
  [`template-analyses.html`](template-analyses.html); `init-project.sh` starts from the first, then
  runs the script, which writes the backlog and the analyses inventory in their empty state.
- **Frozen formats** (examples filled by hand): `${CLAUDE_PLUGIN_ROOT}/team/examples/formats/docs/index.html`,
  `${CLAUDE_PLUGIN_ROOT}/team/examples/formats/docs/20-specs/backlog.html` and
  `${CLAUDE_PLUGIN_ROOT}/team/examples/formats/docs/10-analysis/index.html`.

```sh
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/dashboard-pages.mjs .            # writes docs/index.html, docs/20-specs/backlog.html and docs/10-analysis/index.html
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/dashboard-pages.mjs . --check    # checks without writing
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-deliverable.mjs .          # also runs dashboard-pages --check
```

`--now "YYYY-MM-DD HH:MM"` sets the generation time (tests). With `--check`, the time is the one
already written in the page (`<time datetime>` of the "Updated on" line): a page only drifts if its
sources change. Each generation also writes `docs/_assets/i18n.js`, the labels of `doc.js` and
`plan.js` in the project language.

## Language

The pages are in the project language (`.team/project.json`,
`${CLAUDE_PLUGIN_ROOT}/team/conventions/language.md`): `<html lang>`, fixed text of the templates
(tokens `{{dashboard.tpl.…}}`) and computed text come from
`${CLAUDE_PLUGIN_ROOT}/team/i18n/<language>/dashboard.json` and `common.json`, overridden by
`.team/labels.json`; dates through `Intl` (pattern `common.date.short` when the language gives one).
A key missing everywhere shows as is and the script warns. The script never reads a visible label:
metas, `data-section`, `data-col`, `data-value` and journal codes (Sources table).

## Principles

- **Nothing invented.** What cannot be computed is reduced to the title of its source: a hotspot row
  names the item (title of the ticket, question, ADR) and what its files say about it (assumption,
  linked item, objects touched), never a "why it matters" sentence written for the occasion.
- **No planned date nor delay**, anywhere: dates are in the roadmap schedule. The only future shown
  is the end of the current sprint, read from its page.
- **No journal line** is added for these pages: they read the events already logged.
- **One source per datum.** When two files contradict each other on a story, the page keeps the
  source named below and flags the other in the gaps; it corrects nothing.
- Everything computed sits between `<!-- gen:<name> -->` and `<!-- /gen:<name> -->`; the rest (the
  (i), the legends) comes from the template. A page is regenerated whole from the template.

## Sources

| Datum | Source | Fallback |
|---|---|---|
| Project name, vision (banner) | `h1` and `lede` of the framing | name: `toc-project` of the existing page, then folder name; vision: nothing |
| Board link | `.team/notion.md`, line "Base" (URL of the database) | no button |
| Gates G0, G1, G2 crossed, date | last `G0`, `G1`, `G2` line of the journal, code `validated` and name of the person who decided (`YYYY-MM-DD HH:MM · G1 · validated · <name> · text`; `changes-requested`: not crossed) | `data-gate="Gn\|validated\|YYYY-MM-DD\|<name>"` of the roadmap grid (section `data-section="roadmap"`) |
| Stories, titles, releases, release order | story map (`.sm-release`, `.sm-story`) | releases: G3 headers of the roadmap grid; otherwise a single release "Release" |
| Epic of a story | section `data-section="epic-mapping"` of the story map: `data-value` of the stories cell (`US-002..US-006 US-010`); without `data-value`, the ids of the text | meta `epic` of the story, then roadmap lane |
| Status, size, front share, validation | story `meta` tags: `status`, `size`, `front`, `validated_by`, `validated_on` (`YYYY-MM-DD`), `type` | size and front: `data-size`, `data-front` of the roadmap macro estimate |
| Weight of the front share | `data-h` of the roadmap macro estimate | XS 1, S 2, M 4, L 5, XL 8 |
| Sprint: dates, status, batch | page `sprints/sprint-N.html`: metas `start-date`, `end-date` (ISO) and `status` (`planned`, `in-progress`, `closed`), section `data-section="committed-stories"` (and the `RES-xx` it cites) | |
| Campaign: verdict, scenarios | metas `verdict` and `status` of `40-qa/campaign-sprint-N.html`; section `data-section="scenario-results"`, `data-value` of the runs (`green`, `red`, `blocked`; last run green) | |
| Acceptance report: status, verdict, date, accepted stories, reservations | metas `verdict`, `status` (`prepared`, `signed`, `refused`) and `acceptance_date` (ISO) of `50-acceptance/report-sprint-N.html`; sections `data-section="results"` (`data-value` of the column `data-col="result"`) and `data-section="reserves"`; severity of a reservation: `severity` of its ticket in the board | |
| Tickets and bugs | front matter of `.team/board/T-*.md` and `BUG-*.md`: `status`, `sprint`, `review_rounds`, `severity`, `instance`, `title` | |
| Questions | `.team/questions/Q-*.md`: `status`, `linked_to`, `blocking`, Question and Assumption sections | |
| State and date of a phase deliverable | metas `status` (`draft`, `in-review`, `validated`…) and `date` (ISO) | |
| Version of the roadmap, of the contract | meta `version` of the roadmap; `info.version` of `openapi.yaml` | |
| High-impact open points | rows `impact high` of `30-design/detailed/open-points.html` | |
| ADR with a foundation deviation | `meta status="proposed"` and `foundation_deviation="yes"` of the `adr/` pages | |
| Proposed plugin changes | part `h3 id="proposed-changes"` of the Retro of the sprint pages, rows `Sn-Em` whose cell in column `data-col="decision"` carries `data-value="to-submit"`; file: column `data-col="file"` | |
| Events | `.team/journal.md`; the decision of a gate (code) shows with its label | |
| Workstream analyses | pages of `docs/10-analysis/` with `meta type="analysis"`: meta `author` (`ai` or a name), `status` (`draft`, `in-review`, `validated`), `progress` (`in-progress`, `done`, `partial`), `target` (`P1`, `P2`, `P3` or a release: the column it prepares); `h1`, `lede`; callout `decision` of the Recommendation section; `Q-xxx` of the Questions and assumptions section; callouts `hypothesis`; first column of the Impacts on other deliverables section; meta `date` (ISO); sections by `data-section`: `recommendation`, `questions`, `impacts` | `target` missing: P1 (warning) |

## Calculation rules: dashboard page

**Banner.** Current phase: the current sprint if there is one (the last sprint without a signed
acceptance report nor status `closed`), with its step (Development as long as a ticket is not
`done` and there is no campaign, Testing during the campaign, Delivery afterwards), the working day
out of the sprint's total working days; otherwise the phase P0 to P3 deduced from the crossed gates,
or "Sprint N to plan" after G2. Current release: the one of the current sprint's stories, otherwise
the first release not accepted once G2 is crossed, otherwise "none". Next gate: in a sprint, the G3
at the sprint end date ("In N days", day of the week), the batch stories and the reservations taken
over, "closes" or "does not close" the release when the batch exhausts its remaining stories, then
the list before the gate: tickets (done or in progress), campaign (upcoming, in progress, verdict),
PO pre-acceptance (in progress from a favorable verdict without a report, done when the report
exists), acceptance report (to prepare, to sign, signed); the first item not done is the current
step. Outside a sprint, the gate of the phase and the state of its deliverables.

**Overview.** Columns P0 to P3, then one per release in story map order, a single "Release" as long
as none is named. Gates as `data-gate="Gn|decision|date"` (codes: `validated` for G0 to G2,
`accepted` for a G3; ISO date) with `data-gate-name` in the project language. A release's G3 is
crossed when all its stories are accepted in a signed acceptance report, at the date of the last of
those reports. `data-current` on the current column (phase, or release of the current sprint). A
"Workstream analyses" card in each column, phase or release, that at least one workstream prepares
(meta `target`), always last in its column (P1: after the story map; P2, P3: after the last
deliverable; release: after Delivery); all lead to the top of `10-analysis/index.html`. In `small`,
the column count: "N workstreams, M in progress" ("none in progress" at zero). `done` when the gate
of the column is crossed (G1 for P1 and P2, G2 for P3, G3 for a release) and none of its workstreams
is in progress; otherwise `doing` as long as a workstream is in progress or an analysis is `draft`,
`made` afterwards. A column without a workstream has no card; with no analysis at all, the page
exists in its empty state. Card of a deliverable: `done` if the gate of its phase is crossed,
otherwise `doing` (draft) or `made` (in review or beyond), with no link nor class as long as the file
does not exist. In a release: Development, Testing, Delivery, one pill per started sprint that
touches the release, as a link to its page, its campaign or its acceptance report (pill without a
link as long as they do not exist). No planned date column.

**Gates.** One row per gate: G0, G1, G2 (date, Approved, trace), G3 of each started sprint (signed or
refused report: date, verdict, reservations; otherwise "Sprint ends on …", Upcoming), then the G3 of
the current release ("When the N stories are accepted in a signed report (K so far)") and that of the
accepted releases.

**Hotspot.** Seven types, in this order of criticality, then from the oldest wait to the most
recent:

| Type | Row present when | "Since" |
|---|---|---|
| Stuck review loop | ticket with `review_rounds` 4 or more, not `done`: `review_rounds` counts every review (`team/conventions/ticket.md`), hence three fix rounds without convergence | last mention of the ticket in the journal |
| Gate to present | acceptance report of the current sprint neither signed nor refused; or, for G0 to G2, all its deliverables "in review" | date of the report, or most recent date of the deliverables |
| Raised question | question with status `raised` | last mention in the journal |
| ADR with a foundation deviation | ADR `proposed` with `foundation_deviation` at `yes` | meta `date` |
| Open point | at least one high-impact point; one row, with the objects touched | G2, otherwise date of the page |
| Open reservation | reservation of a signed report whose linked item (`BUG-xxx` or `T-xxx`) is not `done`; severity of the bug | date of the report |
| Plugin change | row `Sn-Em` of the proposed plugin changes with no decision taken; the row cites `Sn-Em`, as a link to its sprint page, and the file targeted | sprint end |

Under the list, the empty types and the question count; without a hotspot, the "No hotspot" box.

**Indicators.** Stories delivered over all releases, then over the current release (delivered, in
the current sprint, upcoming); `T-xxx` tickets of the current sprint by status (`backlog` counted as
Ready); `BUG-xxx` bugs not `done`, one box per severity, one row per bug.

**Latest events.** The last 50 lines of the journal, most recent at the top, without `dispatch` nor
`report` (the `incident` and `resume` lines of an external interruption stay); the type as a tag,
identifiers as links, the code between backticks as `<code>`. The page shows five, the button five
more (`data-more`).

## Calculation rules: backlog

**Status of a story**, a single scale: To write (no page), Written (`draft`), Ready (`ready`),
Validated (`validated`), In sprint N (committed in the current sprint according to its page),
Delivered (accepted in a signed acceptance report, with or without reservation). The report and the
sprint page win over the meta. Abandoned (`abandoned`): at the end of the epic, struck through, out
of the counts. **Spikes** (`meta type="spike"`) do not appear.

**Details** (untitled column): acceptance report and reservations `RES-xx` of the story for a
delivered one; sprint for a story in a sprint; for a validated one, "at the G1 of …, by <name>"
(`validated_by` holds the person's name), "by <name> on …" (raised after G1), "by the PO on …,
shown at the G3 of sprint N" (`po`); the unanswered questions linked to the story (`linked_to`, or a `qmark` link in its page);
one "!" per gap.

**Summary.** One card for all releases, then one per release: delivered out of the total, gauge per
status, sizes, average front share weighted by size (weights `data-h` of the roadmap).

**Gaps between sources**: size or front share of the story different from the roadmap macro
estimate; release of the roadmap or of the story different from the story map; story missing from
the epic mapping, or a different epic in the story or the roadmap; status of the page contradicted by
a signed acceptance report or by the sprint page (`done` without a report, `in-sprint` outside the
current sprint); roadmap story missing from the story map. Stable anchor `gap-<US-xxx>-<field>`.

## Calculation rules: workstream analyses

**Pages inventoried**: every page of `docs/10-analysis/` whose `meta type` is `analysis`, hence
neither `big-picture.html` nor the index. Another page of this folder without `meta type` is flagged
as a warning and stays out of the inventory.

**Columns.** Workstream: title (`h1`), link to the page, and the question (`lede`). Author: "AI" for
`author="ai"`, otherwise the name, then the header date. Progress: `in progress` (`tag info`),
`partial` (`tag danger`), `done` (`tag ok`). Status: `draft` (`tag warn`), `in review`
(`tag info`), `validated` (`tag ok`). Target: the Overview column the workstream prepares, with its
header label (`P1`, `P2`, `P3`, `MVP`, `R2`…); column placed after Status, to keep together the
three short state and target values before the text columns. Recommendation: the content of the
`decision` callout, without its title, links kept; empty or `todo`: "No recommendation yet: one pass
is left to do." for a workstream in progress, "No recommendation." otherwise. Still open: the
`Q-xxx` of the Questions and assumptions section whose status is not `answered` (an unknown question
counts as open), as `qmark` to `questions.html`, then the number of `hypothesis` callouts; nothing:
"Nothing". Impacted deliverables: the first column of the Impacts section, one per line, link kept as
is, or the known name of a phase deliverable made into a link; section missing or empty: "Not
identified yet". Rows and callouts of the template still in `todo` do not count, a lede in `todo`
leaves the question empty. A release cited in the text (lede, Target column) is written
`<span data-release>R2</span>`, so that `check-deliverable` does not read it as a story rule.

**Sort**: in progress, then partial, then done; when equal, most recent date first, then title.
**Filters and sorts**, through the backlog mechanisms of `doc.js`: `data-facets` chips in column
order (Author AI or person, Progress, Status, Target: P1 to P3 then the releases; an absent value
stays greyed out) and a `data-sortable` table: Workstream by title and Author by date
(`data-sort-value`), Progress, Status and Target by their scale (`data-sort-order`), Still open by
number of questions then assumptions (`data-sort-value` "002-001"), on large screens only (headers
hidden on mobile, like the backlog); `aria` key of the Target facet ("Filter by target, phase or
release") for the screen reader; Recommendation and Impacted deliverables as `data-sort="none"`. A
single table, whatever the target. **Lede**: number of workstreams, count per target (in column
order, "for release R3" for a release, P1 "opened from the big picture"), count per progress (done,
partial, in progress), distinct open questions and number of workstreams that carry them. **Empty
state**: "No analysis workstream: the big picture is not split into workstreams yet".

## Checks

The script exits with an error (code 1) on: invalid meta `status`, `size`, `front`, `validated_by` or
`validated_on` in a story (`validated_by` holding a generic word such as `human` instead of a name);
gate line of the journal without the name of the person who decided; acceptance report `signed` or
`refused` without meta `decided_by`; meta `status` or `progress` of an analysis outside its values; meta
`target` that is neither `P1`, `P2`, `P3` nor a release of the story map or the roadmap (the card
would have no column: fix the meta or the release rather than lose the workstream); campaign or
acceptance report `verdict` outside its values; unknown ticket `status`; template without a `gen`
block; page to regenerate (`--check`). It warns on: story map missing, sprint without metas
`start-date` and `end-date`, story `validated` without `validated_by`, analysis without meta
`status`, `progress`, `author` or `target`, page of `docs/10-analysis/` without `meta type`, label
missing from the dictionaries, meta `author` that looks like an agent instance (`dev-frontend-1`:
write `ai`). On error, it writes nothing. It is idempotent.
