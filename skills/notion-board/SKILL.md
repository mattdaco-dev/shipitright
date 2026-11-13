---
name: notion-board
description: Creates and maintains the Notion board of a ShipItRight project, an optional mirror of the local board (.team/board, epics, stories, bugs), only if the Notion MCP is available. Used by the PO at project creation (database and views), then at each wave sync, gate or sprint end to carry over creations and status changes.
---

# Project Notion board

The local board (`.team/board/`, `docs/20-specs/epics/`, `docs/20-specs/stories/`) is the agents'
**source of truth**. The Notion board is its **mirror for the human**: they follow progress there
without opening the repository. Only one agent writes in Notion: **the PO**. Other roles do not
touch it.

**Optional**: this skill assumes the Notion MCP. Without it, the project has no Notion board, no
`.team/notion.md`, and the sync steps are skipped; the local board is enough.

## 1. Creation, at project start

**Always ask the human where to create the board**: the URL of an existing parent Notion page, or
agreement to create a private project page. Never pick a page yourself nor explore their Notion
workspace to find one.

Then, once the destination is given:

1. If needed, create the project page (`notion-create-pages`, title = project name, short
   description taken from the framing).
2. Create the database (`notion-create-database`, parent = project page, title `Board <project>`)
   with this schema:

```sql
CREATE TABLE (
  "Title" TITLE,
  "Ref" RICH_TEXT COMMENT 'Local identifier: EPIC-01, US-004, T-012, BUG-003',
  "Type" SELECT('Epic':purple, 'Story':blue, 'Ticket':gray, 'Bug':red, 'Spike':yellow),
  "Status" SELECT('Backlog':gray, 'Ready':blue, 'In progress':yellow, 'In review':orange, 'In test':pink, 'Done':green, 'Blocked':red),
  "Role" SELECT('business-analyst':blue, 'ux-designer':pink, 'architect':purple, 'dev-backend':brown, 'dev-frontend':orange, 'qa':green, 'scrum-master':gray, 'po':default),
  "Instance" RICH_TEXT,
  "Sprint" SELECT('Design':gray, 'Sprint 1':blue, 'Sprint 2':green, 'Sprint 3':orange),
  "Epic" RICH_TEXT,
  "Stories" RICH_TEXT,
  "Priority" SELECT('Must':red, 'Should':orange, 'Could':blue, 'Won''t':gray),
  "Release" SELECT('MVP':red, 'R2':orange, 'R3':gray),
  "Size" SELECT('XS':blue, 'S':green, 'M':yellow, 'L':orange, 'XL':red),
  "Depends on" RICH_TEXT,
  "File" RICH_TEXT COMMENT 'Path of the local file, source of truth',
  "Updated" LAST_EDITED_TIME
)
```

3. Create the views (`notion-create-view`):
   - `Kanban`: type `board`, `GROUP BY "Status"`, filter `Type` not equal to `Epic`;
   - `Current sprint`: type `board`, `GROUP BY "Status"`, filter on the current sprint (update at
     each sprint);
   - `Backlog`: type `table`, sorted by `Release` then `Priority`;
   - `Epics`: type `table`, filter `Type = Epic`.
4. Record in `.team/notion.md`: URL of the project page, URL of the database, `collection://`
   identifier of the data source, creation date. Later sessions find the board there.

Add a `Sprint` option when a new sprint starts (`notion-update-data-source`).

## 2. Page content

Before writing page content, read the Notion Markdown specification
(`notion://docs/enhanced-markdown-spec` via `notion-fetch`), once per session.

| Type | Content of the Notion page |
|---|---|
| Epic | Context, intent, scope, exit conditions (copied from `EPIC-xx-<slug>.html`) |
| Story | Context, need, functional rules, acceptance criteria, points to settle (copied from `US-xxx-<slug>.html`) |
| Ticket | Brief summed up in a few lines, then at closing the report summary and the review verdict |
| Bug | Severity, scenario concerned, expected, actual |

Always end the page with the path of the local file. After creation, copy the Notion URL into the
`<meta name="notion_url">` tag of the local page.

## 3. Synchronization

The PO syncs **in batches**, never on each micro-change:

- after epics and stories are created (end of P2);
- after sprint planning (tickets created);
- at each wave sync (statuses, new bugs);
- at each gate and at sprint end (final statuses, links to the acceptance report and the sprint
  page).

Procedure: list the local files changed since the last sync (`git log` / dates), create the missing
pages in a single `notion-create-pages` call (up to 100 pages), update the properties of existing
pages (`notion-update-page`, command `update_properties`). Record the sync date in
`.team/notion.md`.

When Notion and local differ, **local wins**. If the human changed something in Notion (comment,
status, priority), the PO treats it as feedback from the human: they acknowledge it, carry it over
locally, then resync.

## 4. Safeguards

- No exploring the human's Notion workspace outside the project page.
- No page deletion without the human's explicit agreement: an abandoned ticket goes to status `Done`
  with "abandoned" in the title, or stays in `Backlog`.
- No real data in Notion, as everywhere else.
