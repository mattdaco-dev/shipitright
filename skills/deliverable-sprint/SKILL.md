---
name: deliverable-sprint
description: Produces or updates the page of a sprint of the ShipItRight team (goal, committed stories, capacity, tickets and parallelization waves, progress, review, retro with its problems, actions and proposed plugin changes, metrics), as an HTML page from the template. Used by the Scrum Master at sprint planning, during the sprint for progress, then after acceptance for the review and the retro.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Deliverable: sprint page

One page per sprint, filled in three steps: **planning** (what we commit to deliver and in which
order), **progress** (where the tickets stand), **review and retro** (what was delivered, what we
change). It gives the PO and the human the overview of the sprint without opening the board.

- **Author**: Scrum Master. Contributors: Architect (split), PO (choice of stories), every agent
  through the Retro sections of their tickets.
- **Phase**: every sprint. Complete at gate **G3** (review and retro filled after acceptance).
- **File**: `docs/sprints/sprint-N.html`.
- **Template**: [`template.html`](template.html), to copy then fill. Copying means reading
  `${CLAUDE_PLUGIN_ROOT}/skills/deliverable-sprint/template.html` with Read, then writing it in place
  in the project with Write.

The tickets of `.team/board/` stay the source of truth for statuses and briefs. The page sums them
up and links them; it does not replace them.

## Inputs to read

| Step | Inputs |
|---|---|
| Planning | stories chosen by the PO (`docs/20-specs/stories/`) and their technical notes (endpoints, processes, entities, scenario, element, screen table), detailed design (`docs/30-design/detailed/index.html`: pages of endpoints, processes, entities, screen view `cross-cutting/screens.html`), version and changelog of the API contract after the Architect's pass, `docs/roadmap.html`, page of the previous sprint (retro actions) |
| Progress | front matter of the tickets `.team/board/T-*.md` and `BUG-*.md` (status, dependencies), `.team/journal.md`, open topics of `.team/forum/` |
| Review and retro | Report, Review and Retro sections of the sprint's tickets and bugs, `.team/journal.md` (integration pass, blockers, agent hours), topics of `.team/forum/`, `docs/40-qa/campaign-sprint-N.html` (verdict, results by scenario, accepted commit), `docs/50-acceptance/report-sprint-N.html` (human's verdict, reservations `RES-xx`), story estimates in `docs/roadmap.html` |

## Content

| Section | Step | Level | What is expected |
|---|---|---|---|
| Sprint goal | planning | required | one sentence that says what the human will be able to do at the end of the sprint |
| Committed stories | planning | required | `US-xxx`, epic, number of scenarios, story dependencies and their state, DoR checked; state of the coverage matrix |
| Capacity | planning | required | instances per role (the QA's named, one per `e2e` ticket), biggest wave against the target (3) and the maximum (5) |
| Tickets and waves | planning | required | API contract version at planning, operations of the batch and their state, operations frozen at this planning; table of the `T-xxx`, `e2e` tickets included (role, stories, produces and consumes, depends on, contract `frozen` or empty, starting wave); dated waves and critical path; shared files of each wave with their decision, or "none" |
| Progress | sprint | required | counters per status; one row per ticket then per `BUG-xxx` bug of the sprint: instance, status, review rounds, merge date, blocking finding or blocker |
| Review | after G3 | required | delivered per story with its acceptance result, not delivered with its reason and follow-up, sprint DoD criterion by criterion with its proof, goal reached |
| Retro | after G3 | required | a single panel in four parts: Keep, sourced; Problems `Sn-Pm` (finding, weight, sources); Actions `Sn-Am` (what changes, problem cited, nature, owner, done criterion, due); Proposed plugin changes `Sn-Em` (plugin file, before, after, linked action, human's decision) |
| Metrics | after G3 | required | tickets planned and closed, average and maximum review rounds, bugs by severity and follow-up, blocked tickets and duration; estimated and actual time of the delivered stories, in agent hours, carried over into the roadmap calibration |
| Risks and blockers | sprint | recommended | blockers and risks, forum topics, pending questions to the PO, with their state; a resolved blocker keeps its row |
| Follow-up of previous actions | planning | recommended | actions `Sn-Am` of the previous retro, as links to `sprint-<n-1>.html#S<n-1>-A<m>`: done, in progress, abandoned, with the proof drawn from the sprint |

During the sprint, the review, retro and metrics sections keep their `.todo` placeholders: the page
is KO at check until the sprint is closed, as expected.

## Quality rules

- **The split starts from the detailed design.** It covers the whole application and holds no
  tickets: at planning, the SM and the Architect cut the tickets from the pages of the endpoints,
  processes and entities touched by the batch stories, and from the screen view for the front. A
  process (`PROC-xx`) shared by two endpoints of the batch is produced by a single ticket, on which
  the others depend.
- **No ticket on a provisional operation.** At planning, the Architect freezes the provisional
  operations of the batch stories, before the split; a story with an operation still provisional
  leaves the sprint.
- **A wave only holds tickets whose dependencies are closed.** A frontend ticket that consumes a
  frozen operation does not depend on the backend ticket that produces it: it starts in the same
  wave, on a mock. Three tickets in parallel as a target, five at most. An `e2e` ticket has no
  dependency: it starts in a dev wave and is tuned as merges come in, so it may close after the
  following waves; the Wave column says where it starts.
- **Each wave declares its shared files.** A file that several tickets of the same wave would change
  by hand (routes, module registry, label catalogue, exchange types) is listed in the Shared files
  table with its decision: generated by a script before the wave, split (one file per ticket, loaded
  by convention), or a single carrying ticket, cited in the brief of the others. A wave without a
  shared file carries "none". The SM fills it at planning with the Architect, reading the code
  organization.
- **What is not delivered has its reason**: blocked by what, split too big, review not converging.
  No "lack of time". A reservation `RES-xx` of the acceptance report is part of it, with its reason
  and follow-up.
- **The review copies neither the campaign nor the acceptance report.** It cites their verdict and
  points to them: the sprint DoD (`${CLAUDE_PLUGIN_ROOT}/PROCESS.md`, section 7) is checked
  criterion by criterion, met or not met, with the link that proves it. The acceptance path run by
  the human stands in for a demo: no demo section.
- **The retro starts from facts.** Each point cites a ticket, a forum post or a journal event. A
  problem seen in several Retro sections goes first.
- **One chain, one source per topic.** The retro fits in a single panel: Keep, Problems, Actions,
  Proposed plugin changes. The finding, the weight and the sources are only written in the problem
  `Sn-Pm`. No separate actions section, no "to try" list: a trial is an action of nature "one-sprint
  trial".
- **Identifiers.** `Sn-Pm` (problem), `Sn-Am` (action), `Sn-Em` (plugin change), prefixed with the
  sprint number of the page (`S2-P1` on `sprint-2.html`), numbered from 1, unique in the project.
  Each is the `id` of its row, hence the link target `sprints/sprint-2.html#S2-P1`. No bare `Sn` for
  a sprint, and no confusion with a scenario `US-xxx/Sn`.
- **Every action cites at least one `Sn-Pm` and carries a nature**: `trial` (one-sprint trial, judged
  at the next retro: kept, made lasting or abandoned) or `lasting` (lasting change), in the
  `data-value` of the Nature cell. **Each `Sn-Pm` has at least one action.**
- **An action has an owner and a done criterion.** "Split better" does not pass; "the Architect caps
  a ticket at two endpoints, checked at planning" passes.
- **Every plugin change cites an `Sn-Am` and targets a plugin file**, as a path from the plugin root
  (`PROCESS.md`, `agents/…`, `skills/…`, `team/…`). A change specific to the project (foundation,
  code organization, repository conventions, files under `docs/`, `.team/`, `src/`) is an action,
  not a plugin change. The plugin change does not restate the reason: it is in the problem of its
  action.
- **Review, metrics and risks point to the identifiers.** A topic handled by the retro is not
  explained again there: a link to `#Sn-Pm` or `#Sn-Am` is enough.
- **An accepted debt has its follow-up in the backlog.** Each debt or limit accepted in the Risks and
  blockers section points to a story or a `backlog` ticket before the next planning; one that has
  none yet gives an action, to the PO (with the BA for a functional limit).
- **The SM proposes, they do not modify.** A proposed plugin change (`PROCESS.md`, agent file,
  convention, skill) is written as a proposal (text before, text after); the PO submits it to the
  human with the acceptance, and the Decision column keeps the answer (`data-value="to-submit"` until
  then). Meanwhile, the linked action covers it. Once accepted, it is applied in the ShipItRight
  framework repository, never in the installed plugin.
- **Metrics are counted in the board**, not from memory: tickets' front matter, and the journal for
  durations. Both times are in agent hours. The estimate of a story comes from the roadmap estimate;
  the actual is the sum of the agent hours of its tickets, from the launch of each agent to its
  report, reviews and fixes included, read from the journal (`dispatch` and `report` lines), minus
  external interruptions (from the `incident` line to the `resume` line). The SM carries both over
  into `rules.calibration.sprints` of the roadmap, or gives them to the PO who updates it.
- **Each section has its (i)**: `<div class="info-body" hidden>` right after the `h2`, with a
  `<dl class="defs">`: Purpose, Content, Why this format, then if needed Read (same rule as the
  campaign, the detailed design and the macro design). No visible explanatory paragraph under a
  heading.

## Deliver

1. **Planning**: copy the template to `sprint-N.html`, replace `PROJECT_NAME` and `N`, fill the
   planning sections, status `planned`. Tickets are created in `.team/board/` in parallel.
2. **Progress**: status `in-progress` from the first wave; update the section after each wave sync.
3. **After G3**: fill review, retro (problems, actions, proposed plugin changes), metrics. Status
   `closed`.
4. Check: `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-deliverable.mjs docs/sprints/sprint-N.html`.
   On a sprint page, the script checks the retro chain: existing `#Sn-…` anchors, action linked to an
   `Sn-Pm` and of a known nature, plugin change linked to an `Sn-Am` (errors); problem without an
   action, prefix different from the page number, plugin change that targets a project file
   (warnings).
5. Give the PO the proposed plugin changes (`Sn-Em`), at the top of the report.
