# Board ticket

One file per ticket in `.team/board/`, named `T-012-<slug>.md` (or `BUG-003-<slug>.md`).
The local board is the agents' **source of truth**. The Notion board, if any, is its mirror for the
human, kept by the PO (skill `shipitright:notion-board`).

A ticket is a **vertical slice**: it fits in a fresh context, can be demonstrated on its own and is
worth a full dev + review cycle. A story that touches back and front usually gives two tickets linked
by an operation of the API contract: the back produces it, the front consumes it. Tickets are cut at
sprint planning (SM and Architect) from the pages of the detailed design (`docs/30-design/detailed/`):
endpoints, processes, entities, per-screen view.

The `contract` field says whether the ticket touches the API contract:

- **`frozen`**: the ticket produces or consumes operations of the API contract, all frozen (nothing
  will be removed or changed). Back and front start in parallel, the front works against a mock drawn
  from the API contract; the front ticket does not depend on the back ticket.
- **field left empty**: the ticket touches no operation of the API contract.

A provisional operation does not give a ticket: the Architect freezes it at sprint planning, otherwise
the story that touches it leaves the sprint.

```markdown
---
id: T-012
title: Create an invoice
role: dev-backend
instance: dev-backend-1
status: ready          # backlog | ready | in-progress | in-review | in-test | done | blocked
sprint: 1
stories: [US-004]
depends_on: []
consumes: []
produces: ["EP-03 POST /factures", "EN-02 Facture"]
contract: frozen       # frozen, or empty if the ticket touches no operation of the API contract
branch: t-012-creer-facture
review_rounds: 0       # reviews by a fresh Reviewer, closing reviews included; +1 for each line "report · T-xxx ← reviewer-n" of the journal
notion_url:
---

## Brief
Expected behavior, types and signatures, acceptance criteria taken from the stories, out of scope.
`US-xxx/Sn` scenarios served and the story's example data sets that illustrate them (`US-xxx/Dn`, as
links). No code file paths.

## Report
Filled in by the author (format report.md).

## Review
Filled in by the Reviewer: verdict (ok | blocking), numbered findings.

## Retro
One or two lines.
```

**Who writes what**: the PO creates the ticket (from the SM's and Architect's slicing), fills in the
front matter and changes the status. The author fills in `Report` and `Retro`. The Reviewer fills in
`Review`. Nobody else modifies the brief.

**Bug**: `BUG-xxx`, same format, plus `severity: blocking | major | minor`, `found_by`, `scenario` (in
the `US-xxx/Sn` format, e.g. `US-006/S4`), reproduction steps, expected, actual.
At opening, the QA creates the fix branch `bug-xxx-<slug>` from `sprint/N` in `.worktrees/bug-xxx`,
commits the bug's test there, red, then removes that worktree; the dev reopens the existing branch in
their worktree and fixes it; review and merge like a ticket (`team/conventions/git.md`). A minor bug
left open at the verdict stays in `backlog` status; at acceptance, the PO carries it over as a
reservation `RES-xx` of the acceptance report.

**e2e ticket**: `T-xxx`, same format, plus `type: e2e` and `role: qa`. The SM plans one per batch of
stories at sprint planning, in the list of tickets to create, and the PO creates its file; it is given
to a QA instance (`qa-1`, `qa-2`…); several QA instances give several `e2e` tickets, each with its
worktree. `stories`: the batch; `consumes`: the stories and their scenarios (`US-006/S4`); `produces`:
the batch's e2e tests; `contract` and `depends_on` empty. It follows the normal circuit: branch,
worktree, Review section, fresh Reviewer, 3 rounds at most, merge by the PO.
Own DoR: the batch's stories have passed G1, the operations they consume are frozen, the coverage
matrix of the test strategy is up to date for the batch, and its brief cites the batch's `US-xxx/Sn`
scenarios with the example data sets that illustrate them.
