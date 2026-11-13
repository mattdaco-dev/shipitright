---
name: deliverable-qa
description: Produces or updates the QA deliverables of a ShipItRight project, as HTML pages from the templates. The test strategy (levels, tooling, environments, data, entry and exit criteria, Gherkin to tests coverage matrix, bugs, non-regression) in P3, then the test campaign of each sprint (runs and accepted commits, results by scenario, BUG-xxx bugs, non-regression, non-functional, test count, QA verdict). Used by the QA in phase P3 and at the QA step of each sprint, before pre-acceptance.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Deliverable: test strategy and campaigns

The QA proves that each Gherkin criterion of the stories is met by a passing test. The strategy sets
the rules once for the project; each sprint produces a campaign that applies them and gives a
verdict before acceptance.

| Deliverable | Phase | File (from the project root) | Template |
|---|---|---|---|
| Test strategy | P3 | `docs/40-qa/strategy.html` | [`template-strategy.html`](template-strategy.html) |
| Test campaign | each sprint, QA step | `docs/40-qa/campaign-sprint-N.html` | [`template-campaign.html`](template-campaign.html) |

- **Author**: QA. Contributors: Dev backend and Dev frontend (unit tests, testability).
- **Gate**: the strategy goes through **G2**, with the design. A campaign goes through **G3**: the PO
  only prepares acceptance on a campaign with a favorable verdict, with or without reservations.
- The QA writes the e2e tests and the bugs. They do not fix the code.

## Inputs to read

- `docs/20-specs/stories/US-xxx-<slug>.html`: acceptance criteria in Gherkin, the basis of all
  coverage.
- `docs/20-ux/ux-ui-spec.html`: screens and states (nominal, empty, loading, error).
- `.team/foundation.md` then the stack foundation (`foundation.md`, in
  `.team/foundations/stacks/<name>/`, or in the source it points to): unit test tools, build, test
  and start commands. Do not write them from memory.
- `docs/30-design/macro.html`: non-functional requirements, environments.
- The detailed design (`docs/30-design/detailed/index.html`): cross-cutting pages tests (technical
  test strategy), errors (error code catalogue), security (rights matrix), screens (screen view:
  endpoints called and errors shown); pages of the batch endpoints.
- The technical notes of the stories: scenario, element, screen table, which says which endpoint or
  process serves each Gherkin scenario.
- The API contract (`docs/30-design/api/openapi.yaml`, view `detailed/swagger.html`): an unknown enum
  value must be tolerated by the front (`INV-59`), to cover when the strategy plans it.
- For a campaign: `docs/40-qa/strategy.html`, the sprint plan (`docs/sprints/sprint-N.html`), the
  sprint tickets in `.team/board/`, the previous campaigns for non-regression.

## Usable tools

- **Playwright** for e2e, whatever the foundation: one e2e per scenario planned in e2e by the
  matrix, named with the scenario id. Configuration with `retries: 0`: a test that passes on the
  second automatic try hides an instability. A `setup` project opens one session per account and per
  run (`storageState`); a test that triggers an attempt limitation runs alone, at the end of the
  suite, in its own project, and the second run of the suite ("replayed twice") runs without that
  project. Selecting a scenario: `-g "US-xxx/Sn "`, with the space, so that `S1` does not take `S10`
  to `S19`. Unit test tools and their commands are those of the stack foundation; a command the
  foundation does not provide is written as an assumption.
- **e2e tickets**: one `T-xxx` ticket of type `e2e` per batch of stories, planned by the
  scrum-master at sprint planning in the list of tickets, created by the PO and given to a QA
  instance (`qa-n`). Normal ticket circuit: its branch and worktree, Review section, fresh Reviewer
  (3 rounds at most), merge into `sprint/N` by the PO, commit scope the ticket
  (`test(t-031): cover US-006/S4`) (`${CLAUDE_PLUGIN_ROOT}/team/conventions/git.md`). The campaign
  then runs on the acceptance environment, at the commit of `sprint/N` that contains the merged e2e
  tickets: the QA starts the application there at that commit, noted in the campaign, and restarts it
  after each merge of a fix; a command the foundation does not provide is written as an assumption.
- **Bug test**: when opening it, the QA creates the branch `bug-xxx-<slug>` from `sprint/N` in their
  worktree, commits the red `BUG-xxx` test there, then removes their worktree; the dev reopens the
  same branch, without recreating it, and fixes; review and merge like a ticket
  (`${CLAUDE_PLUGIN_ROOT}/team/conventions/git.md`).
- **Your own headless Chromium** (the project's Playwright): explore the app, read the console and
  the network, capture a bug proof. The Chrome DevTools MCP stays with the PO (Shared resources rule
  of `shipitright:team-rules`).
- `agent-skills:test-engineer` and `agent-skills:test-driven-development`, if installed: design the
  cases, check the quality of the devs' unit tests.
- `performance-audit`, `security-audit`, `gdpr-audit`, if installed: when the strategy plans these
  checks or the project handles personal data.

## Content of the strategy

| Section | Level | What is expected |
|---|---|---|
| Scope and goals | required | what the strategy covers, what it does not, product risks that steer the effort |
| Test levels and pyramid | required | domain unit, repository integration, route, component, e2e (one per scenario planned in e2e), names reused as is in the matrix: who writes, what each level proves, order of magnitude in number of tests and where it comes from, count at sprint end; devs' tools and required cases as a pointer to the cross-cutting tests page |
| Tooling | required | QA tools, command, location of the tests; Playwright for e2e, `retries: 0`, `setup` and limitation projects; versioning through `e2e` tickets; one pointer row to the devs' tooling, commands taken from the stack foundation |
| Environments | required | the environments of the macro design, cited by link, without adding any: what the QA does in each, how the app is started for e2e; the campaign runs on the acceptance environment, where the QA starts the application at the commit noted in the campaign and restarts it after each merge of a fix; each performance measurement in the environment its target names; command missing from the foundation as an assumption |
| Test data | required | base data set (link to its description); each test's own data through a test seed independent of the delivered stories, unique name per run; story data sets; dates; sessions (`storageState`) and separate limitation test; reset before the campaign, then by the QA after their last run, before pre-acceptance; fictional accounts per role, an account missing from the fictional data set as an assumption; passwords through environment variables, never in the repository (`INV-50`), macro design rule cited by link |
| Campaign entry and exit criteria | required | conditions to start, including the merged e2e tickets and the application started by the QA; conditions of the verdict (favorable without reservations, with reservations, unfavorable), including: each scenario has a green test, the e2e that carries its identifier or, if the matrix marks it without e2e, the test of the complementary level, except those an open bug admitted at the verdict turns red (minor, or major accepted in writing by the PO), cited in the campaign; same rule for non-regression; second run of the suite without the limitation project |
| Coverage matrix | required | naming rule; one row per Gherkin scenario: e2e means when it is not the interface (only exceptions are written, including "without e2e" with its reason), complementary level, named by a pyramid level. Complete at G2; updated at sprint planning for a story added or changed after G2. No status: progress is in the campaign |
| Bug management | required | severities defined, `BUG-xxx` format, `BUG-xxx` test for every bug (which also carries `US-xxx/Sn` if it affects a scenario), committed red on the branch `bug-xxx-<slug>` created by the QA, handling circuit |
| Non-regression | required | an exit criterion depends on it; what is replayed each sprint, criterion to join the suite, flaky test, new API contract version |
| Non-functional tests | required | an exit criterion depends on it; integrity, performance, availability, security, accessibility, GDPR: check with its tool, its number of measurements and its environment, threshold quoted as the macro design writes it, frequency; a threshold of the QA's own is marked as such, with its reason |
| Test risks | optional | what is hard to test, the countermeasure, who acts; a request to the Architect through a forum post addressed to them; they record it as an open point of the target page, which the strategy cites by link |

## Content of a campaign

| Section | Level | What is expected |
|---|---|---|
| Scope | required | stories of the sprint; merged `e2e` tickets the tests come from (link, QA instance, batch); acceptance environment cited by link; dates; state of the strategy entry criteria, without copying them, observed at the start line of the runs (the commit is there, not here) |
| Runs | required | dated log on the acceptance environment, one row per event with the commit of `sprint/N`: start by the QA, 1st run (`limitation` project included), 2nd run (without it), bug opened, redeployment after the merge of a fix, replay, 1st and 2nd runs at the accepted commit (the last commit of `sprint/N` played, replays included: a fix merged at the end of the campaign is replayed twice there), reset as the last row |
| Results by scenario | required | one table per story, one row per scenario `US-xxx/Sn` as a link: test ("e2e", or "without e2e" and the complementary level the matrix names), result in the two runs of the accepted commit (green, red, blocked, not run), bug or cause; a blocked or not run scenario, even with its cause, misses the exit criterion: unfavorable verdict |
| Bugs | required | one row per `BUG-xxx` as a link to the board: scenario affected, severity, fix branch, `BUG-xxx` test red (commit on its branch) then green (commit of `sprint/N`), or not fixed: its test stays on its branch and does not run at the accepted commit; board status (`done` for a fixed one), effect on the verdict (fixed, admitted, blocks); an admitted minor stays in `backlog` and becomes a reservation `RES-xx` of the acceptance report; "none" is written |
| Non-regression | required | an exit criterion depends on it; per story of the previous sprints: number of e2e tests, result in the two runs, regression or instability; non-functional tests of the previous sprints (number, two runs); tests of closed bugs; API contract version and what it makes replay; these numbers plus the e2e added in the sprint make the e2e total of the count; first sprint: "not applicable, no previous sprint" |
| Non-functional tests | required | an exit criterion depends on it; checks due this sprint according to their frequency in the strategy: environment of the measurement, number of measurements, measured value and threshold in figures, status; proof of a manual check (restart, screen reader…) versioned in `docs/40-qa/evidence/sprint-N/` and linked from its row; one row names the checks not due |
| Test count | required | one row per pyramid level, named word for word: named runner, as a link to the strategy tooling, number of tests it reports at the accepted commit, added in the sprint; a `BUG-xxx` test left on its branch is not counted; orders of magnitude stay in the strategy |
| QA verdict | required | counters at the accepted commit (green scenarios, admitted reds, blocked or not run, open bugs by severity); each exit criterion of the strategy, met or not met (two states, an admitted red is cited in the proof), with the link to its proof; verdict; admitted bugs and the scenarios they turn red; the PO's written acceptances, dated; recommendation for the acceptance; same verdict in the `<meta name="verdict">` tag (`favorable`, `favorable-with-reservations`, `unfavorable`) |

## Quality rules

- **One Gherkin scenario, one green test, one id.** The test is the e2e that carries the scenario
  id; if the matrix marks the scenario "without e2e", with its reason, it is the test of the
  complementary level it names, by a pyramid level (domain unit, repository integration, route,
  component). At the verdict, each scenario test is green, except those an open bug admitted at the
  verdict turns red (minor, or major accepted in writing by the PO), cited in the campaign; same rule
  for non-regression. `US-004/S2`, the glossary notation for scenario 2 of the story (anchor `#S2`),
  in the matrix, in the Playwright test name and in the campaign. Without this shared id, coverage
  cannot be checked.
- **The matrix is complete at G2**: all scenarios of the stories validated at G1. A story added or
  changed after G2 updates the matrix at the sprint planning that takes it.
- **A result without proof does not count.** Green: the test exists and runs green. Red: a bug is
  open. Blocked or not run: the cause is written, but the scenario has no green test, the exit
  criterion is missed and the verdict unfavorable. A manual check has its proof versioned in
  `docs/40-qa/evidence/sprint-N/`, linked from the campaign; the Playwright HTML report stays out of
  git.
- **Each result has its commit.** The QA notes the commit of `sprint/N` when "Demo and acceptance"
  starts, then at each redeployment after the merge of a fix. The verdict rests on the two runs of the
  accepted commit, the last commit of `sprint/N` played, replays included, noted in the runs and
  taken over by the acceptance report; a fix merged at the end of the campaign is therefore replayed
  twice there. A red fixed during the campaign stays visible in the runs and the bugs.
- **The campaign does not copy the strategy.** Entry and exit criteria, matrix, severities,
  thresholds, orders of magnitude of the pyramid: cited by link; the campaign only writes their state,
  what was measured and the number counted. Steps, expected and actual of a bug: in its board file.
- **A bug is reproducible**: steps, expected result, actual result, environment, proof (screenshot,
  console, network). Its severity follows the strategy grid, not mood.
- **The verdict follows from the exit criteria**, it is not negotiated. Favorable without
  reservations: all criteria met, no open bug. Favorable with reservations: only minors are open, or
  a major accepted in writing by the PO, acceptance noted in the campaign. Unfavorable: an open
  blocking bug, without exception, or an open major not accepted. Only a major can be accepted. The
  same wording applies in the exit criterion, its "Read" and the severity table.
- **The strategy does not copy, it cites.** Tooling and required cases of the devs' tests are in
  `detailed/cross-cutting/tests.html` (Architect): the strategy points to it, and what the QA asks of
  the Architect (a case to add, an adjustable clock) goes through a forum post addressed to the
  Architect, who records it as an open point of the target page; the strategy cites that open point
  by link. The QA does not write in the Architect's pages. Environments and non-functional targets
  are in the macro design: the strategy cites them by link and says how it checks them, as well as
  the password rule of the fictional data set. The content of the fictional data set is in the code
  organization. What serves each scenario (endpoint, screen) is in the technical notes of the story.
- **The matrix says what is planned, the campaign what happened.** The matrix: the e2e means when it
  is not the interface, the complementary level, "without e2e" and its reason. The progress of a
  test and its run result (passed, failed, blocked): in the campaign only.
- **A test depends neither on another test nor on another story.** It prepares its data through the
  test seed, under a unique name per run. The QA resets the acceptance environment to the fictional
  data set alone after their last run, fix replays included, before pre-acceptance.
- **Each section has its (i)**: `<div class="info-body" hidden>` right after the `h2`, with a
  `<dl class="defs">`: Purpose, Content, Why this format, then if needed Read and Source (same rule
  as the detailed design and the macro design). No visible explanatory paragraph under a heading.
- **Relative dates.** An e2e test holds no hard-coded date: it would slip into the past.
- **Fictional data only.**

## Deliver

1. Copy the template needed, replace `PROJECT_NAME` and `N`, fill.
2. For a campaign: start "Demo and acceptance" at the commit that contains the merged `e2e` tickets,
   note it, play the suite twice, open the bugs in `.team/board/` (`BUG-xxx`, one per file, red test
   on its branch), restart and replay after each fix merge, then reset the environment and write it
   as the last row of the runs. Proofs of manual checks go to `docs/40-qa/evidence/sprint-N/`, linked
   from the campaign. Page status: "in progress", then "done" at the verdict, carried as a code in
   `<meta name="status">` (`in-progress`, `done`); the header date also goes into
   `<meta name="date">`, in ISO (`YYYY-MM-DD`). In "Results by scenario"
   (`data-section="scenario-results"`), each run cell carries its code in `data-value`: `green`,
   `red`, `blocked`. The strategy likewise carries `<meta name="status">` (`draft`, `in-review`,
   `validated`) and `<meta name="date">`. These codes are never translated
   (`team/conventions/language.md`).
   At the verdict, also fill the `<meta name="verdict">` tag of the header: `favorable` (without
   reservations), `favorable-with-reservations` or `unfavorable`; empty while the campaign is in
   progress. The dashboard page reads it (Overview, gates table): it says the same as the verdict
   callout.
3. Check: `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-deliverable.mjs docs/40-qa`.
4. Give the PO the verdict and the list of open bugs, at the top of the report.
