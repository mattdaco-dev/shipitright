---
name: deliverable-story-map
description: Produces or updates the "Story map" deliverable of a ShipItRight project (persona and goal of the journey, backbone of activities, user tasks, US-xxx stories under each task, MVP, R2 and R3 release lines with their goal), as an HTML page from the template. Used at the end of P1 and in P2, when the BA organizes the backlog from the big picture and the analyses, or when the release split changes.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Deliverable: story map

The story map puts the backlog **in user journey order** and splits it into releases. Reading left
to right, you follow what the user does; top to bottom, you go from essential to nice to have. The
first release line says what the MVP is.

- **Author**: BA. **Contributors**: PO (priorities, release content), UX (journey, tasks).
- **Phase**: built at the end of P1, refined in P2. Goes through gate **G1**.
- **File**: `docs/20-specs/story-map.html`.
- **Template**: [`template.html`](template.html), to copy then fill. Copying means reading
  `${CLAUDE_PLUGIN_ROOT}/skills/deliverable-story-map/template.html` with Read, then writing it in
  place in the project with Write.

## Inputs

- `docs/00-framing/framing.html`: personas, goals, scope (in, out, later).
- `docs/10-analysis/big-picture.html`: phases give the activities, events triggered by an actor give
  the tasks.
- `docs/10-analysis/*.html`: workstream recommendations, edge cases that become stories.
- `docs/20-specs/stories/`: stories already written, to reuse their ids.

## Build the map

1. **Personas and goals.** A story map follows a journey, carried by a framing persona. Two personas
   with different journeys: two journeys in the Map section, each with its `h3` title and its grid.
   A rule separates them automatically.
2. **Backbone.** Activities (5 to 8) are the main steps of the journey, in order. Under each
   activity, the user tasks, phrased with a verb ("Choose a plan").
3. **Stories.** Under each task, the stories that deliver it, from simplest to richest. Each story
   has an id `US-xxx` and a short title.
4. **MoSCoW priorities.** Each activity and each task carries a Must, Should, Could or Won't badge
   (Notion board colors). An activity takes the highest priority of its tasks.
5. **Releases.** Draw the MVP line: the smallest set that crosses the **whole** backbone and reaches
   the journey goal. Then releases R2 and R3. Each release has a goal, not just a list.
   Consistency with MoSCoW: a **Must** task has at least one story in the MVP; a **Won't** task has
   none (the only exception to crossing the backbone).
6. **Outside the MVP.** Any story below the MVP line that looks essential carries its reason.

The PO validates the MVP line. The BA proposes it, they do not decide it.

## Grid structure

The grid is in **rows**: each grid column is a task, and each release takes a row of cells, one per
task. All cells of a row have the same height, so release lines stay aligned from one column to the
next, even if one task has three stories in the MVP and its neighbor none.

```html
<div class="sm-grid sm-rows" style="--tasks: 4">
  <div class="sm-activity" style="grid-column: span 2">Activity A</div>  <!-- covers its 2 tasks -->
  <div class="sm-activity" style="grid-column: span 2">Activity B</div>
  <div class="sm-task">Task 1</div> ... <div class="sm-task">Task 4</div>
  <div class="sm-release">MVP: goal</div>                               <!-- full width -->
  <div class="sm-cell"><div class="sm-story">...</div></div>             <!-- one cell per task -->
  <div class="sm-cell sm-empty"></div>                                    <!-- task without a story -->
  ...
</div>
```

- `--tasks` = number of tasks. The sum of the activities' `span` must equal it.
- Each release row holds exactly `--tasks` cells, in task order, empty cells included
  (`sm-cell sm-empty`). A forgotten cell shifts everything after it.
- Stories of release R2: class `sm-story r2`; of release R3: `sm-story r3`.
- **A story card is a link to its file**: `<a class="sm-story" href="stories/US-001-<slug>.html">`.
  The whole card is clickable, the human reaches the story directly once it is written.
- MoSCoW badge: `<span class="moscow must">Must</span>` at the start of the activity or task
  (`should`, `could`, `wont`). It floats at the top right of the card. A Won't task also takes the
  class `wont`.

## Content

| Section | Level | What is expected |
|---|---|---|
| Journey personas and goals | required | one framing persona (`PER-xx`) per journey, as a link, with goal, start and end |
| Map | required | one journey per persona; backbone of activities and tasks with their MoSCoW badge, clickable `US-xxx` stories under each task, release lines, legend |
| Release goals | required | for the MVP and releases R2 and R3: goal, framing indicator targeted, number of stories |
| Stories outside the MVP | recommended | stories one could think essential, left outside the MVP, with the reason |
| Epic mapping | recommended | each activity or cluster of tasks tied to its `EPIC-xx`; the stories cell carries their ids in `data-value`, ranges as `US-a..US-b` separated by spaces (`data-value="US-002..US-006 US-010"`), read by the dashboard page whatever the language of the text |
| Questions and assumptions | recommended | `Q-xxx` and assumptions tied to the split. Empty list: say so |

## Quality rules

- **The MVP crosses the whole backbone.** A release that only covers the first two activities does
  not reach the journey goal: it is not an MVP.
- **MoSCoW and releases agree**: no Must task without a story in the MVP, no MVP story under a Won't
  task.
- **The `US-xxx` ids of the map match the pages** `docs/20-specs/stories/US-xxx-<slug>.html`. A
  story on the map without a file is to be written; a file with no place on the map is an oversight
  or a story to remove.
- **An id is never reused**, even for an abandoned story.
- **Tasks are user actions**, not screens nor technical components.
- **Glossary terms are used word for word.**

## What follows from it

- **Epics and user stories** (`deliverable-epics-stories`): an activity or a cluster of tasks gives
  an epic `EPIC-xx`; each story of the map becomes a page `US-xxx-<slug>.html` with the same id and
  the same title.
- **Roadmap** (`deliverable-roadmap`): releases become the roadmap milestones, epics its rows. If a
  release changes content, the roadmap is updated.
- **Sprint planning**: the PO picks the sprint stories by going down the map release by release.

## Deliver

1. Copy the template, replace `PROJECT_NAME`, fill each section, delete the examples and the optional
   sections that do not apply. Keep the `status` (`draft`, `in-review`, `validated`) and `date` (ISO,
   `YYYY-MM-DD`) metas aligned with the Status and Date fields of the header: the dashboard page
   reads these codes, never the visible text
   (`${CLAUDE_PLUGIN_ROOT}/team/conventions/language.md`).
2. Check that the map ids match `docs/20-specs/stories/`.
3. Check: `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-deliverable.mjs docs/20-specs/story-map.html`.
4. Report: file path, number of activities, tasks and stories, MVP content in one line, stories
   without a file, questions created.
