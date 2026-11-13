---
name: deliverable-acceptance-report
description: Produces or updates the acceptance report of a sprint of the ShipItRight team (accepted scope, acceptance path, results, reservations, accepted bugs, verdict and decision, left in the backlog), as an HTML page from the template. Used by the PO at pre-acceptance to prepare the acceptance path, then during and after the G3 acceptance with the human to record the results and the decision.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Deliverable: acceptance report

The acceptance report records what the human checked and what they decided. It is the trace of gate
**G3**: without a signed report, the sprint is not done and `sprint/N` is not merged into `main`.

- **Author**: PO. With the human (who decides) and the QA (who provides the campaign and the bugs).
- **Phase**: end of sprint. Prepared at pre-acceptance, completed during the **G3** acceptance.
- **File**: `docs/50-acceptance/report-sprint-N.html`.
- **Template**: [`template.html`](template.html), to copy then fill. Copying means reading
  `${CLAUDE_PLUGIN_ROOT}/skills/deliverable-acceptance-report/template.html` with Read, then writing
  it in place in the project with Write.

## Inputs to read

- `docs/sprints/sprint-N.html`: goal and committed stories.
- `docs/40-qa/campaign-sprint-N.html`: QA verdict, results by scenario, open bugs, and the accepted
  commit (Runs section), taken as is into the scope.
- `docs/20-specs/stories/US-xxx-<slug>.html` of the sprint stories: Gherkin criteria and example data
  sets `Dn`, the basis of the acceptance path.
- The recommendation of the QA verdict (order of play) and the reset of "Demo and acceptance" (last
  row of the campaign runs).

## Two steps

1. **Pre-acceptance (PO alone)**: scope, acceptance path with expected results, open bugs to
   present. The page goes into acceptance with its results, reservations and verdict sections still
   to complete.
2. **Acceptance (PO and human)**: the human runs the path, the PO notes the actual result of each
   step, the reservations and the decision, as they go.

## Content

| Section | Level | What is expected |
|---|---|---|
| Accepted scope | required | stories, version (branch and accepted commit, taken from the campaign, as a link to `campaign-sprint-N.html#runs`), environment and its reset, date, participants, starting QA verdict as a link |
| Acceptance path | required | 15 minutes at most: one table per journey, steps numbered end to end, targeting the decisions taken by delegation (AI rulings), the accepted limits and one complete journey; the other scenarios point to the campaign. Per step: scenario `US-xxx/Sn` as a link, action and data to enter, expected result, actual result, status (`ok`, `reservation` with its `RES-xx`, `ko`); an end-of-journey line names the scenarios without a step and where the campaign proves them |
| Results | required | per story: steps, accepted, accepted with reservations, rejected, human's comment word for word |
| Reservations | required | `RES-xx` (row anchor), gap observed, story and step, ticket (existing `BUG-xxx` or `T-xxx` created), due. None: say so |
| Accepted open bugs | required | majors only: `BUG-xxx`, title, written acceptance by the PO in the campaign, human's reason, due. None: say so, naming the minors carried over as reservations |
| Verdict and decision | required | accepted, accepted with reservations, rejected; the human's wording in quotes; decision (merge into `main` at the accepted commit, or what is missing), decision maker, date, journal line; same verdict in the `<meta name="verdict">` tag (`accepted`, `accepted-with-reservations`, `rejected`) |
| Left in the backlog | recommended | stories not delivered, reservations and new needs expressed during acceptance |

Each section carries its (i) `info-body` block (Purpose, Content, Why this format, Read), like the
other deliverables; the template provides them, they are not touched.

Page status: `prepared` at pre-acceptance, `signed` with the date after G3 (or `refused`), carried as
a code in `<meta name="status">`: `prepared`, `signed`, `refused`. The acceptance date also goes into
`<meta name="acceptance_date">`, in ISO (`YYYY-MM-DD`). The human's verdict is carried into the
`<meta name="verdict">` tag of the header: `accepted`, `accepted-with-reservations` or `rejected`;
empty until acceptance has taken place. In the Results table, the result cell carries its code in
`data-value` (`accepted`, `accepted-with-reservations`, `rejected`), under the column
`data-col="result"`; the Results and Reservations sections carry `data-section="results"` and
`data-section="reserves"`. The dashboard page reads these codes, never the visible text
(`team/conventions/language.md`): it says the same as the verdict callout.

**Lifted reservation**: a reservation `RES-xx` is lifted when the item linked to it, the bug
`BUG-xxx` or the ticket `T-xxx` created for it, moves to status `done` in the board. The signed report
is not rewritten; the dashboard page removes the reservation from its Hotspot based on the board.

## Quality rules

- **The acceptance path takes 15 minutes at most.** The human plays it in full: it targets what only
  they can judge, the decisions taken by delegation (AI rulings), the accepted limits
  (upcoming reservations, open bugs, sprint debts) and one complete journey end to end. The other
  scenarios have no step: the end-of-journey line points them to the campaign results.
- **The acceptance path reads without the team.** Each step says what to do on screen and what one
  must see, with the words of the screen (messages `MSG-xx` word for word) and fictional data ready
  to enter. One path per journey, not one per technical scenario.
- **Data comes from the `Dn` sets of the stories**, shifted to dates after the acceptance without
  changing the day of the week (a "Friday" set stays a Friday). Steps chain: a booking created at
  one step serves as a conflict at the next.
- **A scenario the screen cannot trigger has no step** (technical error, past state): the
  end-of-journey line names it and points to the campaign results.
- **The order follows the recommendation of the QA verdict**: the human first judges on screen what
  will become a reservation. The scenario recommended by the QA verdict goes first in its journey,
  right after the steps that prepare its data.
- **The verdict is the human's**, not the PO's nor the QA's. The PO records it word for word.
- **A reservation becomes a ticket** in `.team/board/` before the report is closed, and the report
  cites its id.
- **A minor bug left open at the verdict becomes a reservation `RES-xx`.** Its ticket is the existing
  `BUG-xxx`, left at status `backlog`. The reservation is lifted when that `BUG-xxx` moves to `done`.
- **An open major bug is accepted only by the human**, with a due date. Only it has a row in
  "Accepted open bugs": a bug is recorded only once.
- **The report does not copy the campaign**: it cites its verdict, its accepted commit and its
  results by scenario as links.
- **A new need is not a reservation.** It goes to the backlog as a story candidate, it does not block
  the verdict.
- **Rejected**: the report says what is missing to accept. The sprint stays open, `sprint/N` is not
  merged.

## Deliver

1. Pre-acceptance: copy the template, replace `PROJECT_NAME` and `N`, fill the scope and the path
   (expected results), list the open bugs.
2. Acceptance: complete results, reservations, accepted bugs, verdict and decision with the human.
3. Create the tickets of the reservations, note the ids in the report, update `.team/journal.md`.
4. Check: `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-deliverable.mjs docs/50-acceptance`.
5. Status `signed` with the date, metas `status`, `acceptance_date` and `verdict`, `G3` line in the
   journal (`YYYY-MM-DD HH:MM · G3 · <verdict code> · text`), dashboard page regenerated. Tell the
   Scrum Master for the review and the retro.
