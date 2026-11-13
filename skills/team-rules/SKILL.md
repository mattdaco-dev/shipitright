---
name: team-rules
description: Rules shared by every member of the ShipItRight team (landmarks, plugin files, cold start, write scope, questions to the PO, report, style, git). Preloaded by every sub-agent of the team, invoked by the PO at session start.
user-invocable: false
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# ShipItRight team rules

These rules apply to **every** member of the team. Sub-agents get them preloaded; the PO, main agent
of the plugin (`${CLAUDE_PLUGIN_ROOT}/agents/po.md`, declared in `settings.json`), invokes this skill
at session start. Each role has its file in `${CLAUDE_PLUGIN_ROOT}/agents/<role>.md` and runs as the
sub-agent `shipitright:<role>`.

## Landmarks

- Process, phases, gates, ceremonies: `${CLAUDE_PLUGIN_ROOT}/PROCESS.md`.
- Deliverables catalogue and requirement levels: `${CLAUDE_PLUGIN_ROOT}/team/deliverables.md`.
- Identifiers, abbreviations and team vocabulary: `${CLAUDE_PLUGIN_ROOT}/team/glossary.md`.
- Exchange formats (brief, report, ticket, forum, questions): `${CLAUDE_PLUGIN_ROOT}/team/conventions/`.
- In those documents, `team/…`, `skills/…` and `<plugin root>` mean the plugin root
  (`${CLAUDE_PLUGIN_ROOT}`); `.team/…` and `docs/…` start from the project root.
- Project: the current folder, its own git repository, with its `.team/` and its `docs/`.
- Stack and design system: the plugin ships none, they belong to the user. The project's ones are
  declared in `.team/foundation.md`, which points to a user source (folder, git repository, MCP,
  skill, URL) or to a foundation created in the project (`.team/foundations/`); format:
  `${CLAUDE_PLUGIN_ROOT}/team/conventions/foundation.md`. Read the "By role" part of the foundation
  that concerns you before acting, and load the skills it names for your role.

## Plugin files and scripts

The plugin is a read-only copy: nobody ever writes in it. Reading one of its files or running one of
its scripts (`node ${CLAUDE_PLUGIN_ROOT}/team/scripts/<script>.mjs .`, from the project root) needs a
permission, granted by the skill of the deliverable at hand when it is **invoked with the Skill
tool** (`shipitright:<skill>`). A skill only preloaded in your agent file gives you its content, not
its permissions: before running a script or reading a plugin file, invoke the deliverable skill (or
`shipitright:team-rules`).

**One command per Bash call**: no chaining (`;`, `&&`, `|`), no redirection (`>`, `>>`), no
`echo $?`. A compound command does not pass the permissions and stays blocked. To search, use Glob
and Grep if available, otherwise `find` or `grep` as a single command.

## If you are an agent launched by the PO

1. **You start cold.** You do not see the conversation with the human. Your brief says who you are
   (role and instance, e.g. `dev-backend-2`), on which project, what to produce. Everything else is
   in the files the brief points to.
2. **Read before acting**: your brief, then the ticket or deliverable at hand, then the forum topics
   and the questions that mention you (the brief lists them).
3. **Write only within your scope**: the files of your deliverable or ticket, the `Report` and
   `Retro` sections of your ticket, posts appended to the forum. You never change a ticket's status
   or assignment: the PO does.
4. **You never talk to the human.** A business question goes to `.team/questions/`, addressed to
   `@po`. If it does not block, state a visible assumption (`HYPOTHESIS`) and go on. In your
   deliverable, the question shows as its `qmark` badge (no bare `[?]`), then you regenerate the
   questions page: `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/questions-page.mjs .`.
5. **You end with a report** in the format of `${CLAUDE_PLUGIN_ROOT}/team/conventions/report.md`. It
   is the only thing the PO will read: exact paths, decisions, open points, what the next one must
   know.
6. **If the work overflows** (the ticket does not fit, the design is contradictory, a contract is
   missing), stop cleanly and say so in the report rather than force it.

## Shared rules

- **Language**: everything written in the project (deliverables, reports, forum, questions, board)
  is in the project language, read from `.team/project.json` (`en` if the file is missing). The
  plugin templates give the structure: their text is written in the project language, headings and
  labels included, `<html lang>` too; attributes (`id`, `class`, `data-*`), `<meta name>` and their
  coded values are never translated, scripts read them. Code, identifiers, file names and commit
  messages in English. Convention: `${CLAUDE_PLUGIN_ROOT}/team/conventions/language.md`.
- **Style**: no em or en dash, no emojis, no empty phrases. Direct, concrete, short sentences.
- **Vocabulary**: whatever the project language, terms in common use in a product or tech team are
  not translated: roadmap, backlog, release, sprint, story, epic, spike, wireflow, design system,
  token, endpoint, Now / Next / Later. Do not replace them with a translation ("grille temporelle"
  for roadmap).
- **Data**: always fictional. No real person, customer or amount.
- **Stable identifiers**: an identified item (rule, screen, endpoint, story, persona…) keeps its
  identifier forever, and deliverables cite each other by these identifiers. Prefixes and the items
  they name: `${CLAUDE_PLUGIN_ROOT}/team/glossary.md`.
- **References as links**: in a deliverable, a cited identifier or deliverable is a link to where it
  is defined, and every identified item carries an anchor equal to its identifier. Target table:
  `${CLAUDE_PLUGIN_ROOT}/team/glossary.md`.
- **Git**: never commit on `main`, **never `git push`**. Conventional Commits, scope = ticket:
  `feat(t-012): add invoice creation endpoint`. Details:
  `${CLAUDE_PLUGIN_ROOT}/team/conventions/git.md`.
- **Installing tools** on the machine (JDK, sbt, Docker…): only if the brief plans it, the human
  having given the PO their approval.
- **Outside the project**: an agent changes nothing outside the project root, nor the plugin. A
  foundation created for the project goes to `.team/foundations/`. A plugin change is written as a
  proposal (proposed plugin change, `Sn-Em`, in the retro of the sprint page), applied by the human
  in the ShipItRight repository.
- **Shared resources**: your scratchpad is a subfolder per instance (`<scratchpad>/<role-n>/`). To
  check in a browser, run your own headless Chromium (Playwright); the Chrome DevTools MCP page is
  shared between agents and belongs to the PO.
