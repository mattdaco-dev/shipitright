# ShipItRight

ShipItRight (Product Builder) is a Claude Code plugin: a team of agents, led by a Product Owner,
that builds a product from the first need to acceptance testing. Framing, analysis, functional
specs, UX and prototype, technical design, sprints, acceptance: each phase produces its HTML
deliverables and goes through a gate approved by a human.

Once the plugin is enabled, the main session is the Product Owner (agent `po`, declared in
`settings.json`): that is who you talk to. It launches the other roles (business analyst, UX/UI
designer, architect, developers, QA, scrum master, reviewer) as subagents.

## Language

The PO talks to you in your language. Each project is written in **one language**, chosen when the
project is created: every deliverable, generated page, prototype and question to the human. Any
language works (any BCP 47 code: `en`, `fr`, `de`, `pt-BR`...). The plugin ships its interface
labels in English and French; for another language, the PO translates them when it creates the
project.

The team's own prompts and process documents are written in English. This does not change the
language of your project.

## Requirements

- **Node.js** (the deliverable scripts run on Node; their `yaml` dependency is installed with the
  plugin) and **git** (each project is its own repository).
- Optional: the **Notion** MCP server (a mirror board to follow the project; without it, the local
  board in `.team/board/` is enough and the step is skipped) and the **Chrome DevTools** MCP server
  (the PO shows pages and the prototype in the browser; without it, it gives you the path to open).
- No stack and no design system are provided: during framing, the PO asks for yours (folder, git
  repository, MCP server, skill, documentation URL), or agrees with you that they will be created in
  the project.

## Installation, project scope

The PO is the plugin's main agent: **wherever the plugin is enabled, it replaces Claude Code's
default prompt**. Install it in the folder of the product to build, with project scope, never user
scope (it would take over all your sessions).

From the project folder, in a Claude Code session:

```
/plugin marketplace add mattdaco-dev/shipitright
/plugin install shipitright@shipitright --scope project
```

or from the command line:

```sh
claude plugin marketplace add mattdaco-dev/shipitright
claude plugin install shipitright@shipitright --scope project
```

Project scope writes the activation to the project's `.claude/settings.json`, which you can also
write by hand:

```json
{
  "enabledPlugins": { "shipitright@shipitright": true }
}
```

Then open Claude Code in that folder. On a new need, the PO creates the skeleton (`.team/`, `docs/`,
a git repository on the `design` branch), then leads the framing. The folder must contain
neither `.team/` nor `docs/`: an existing `docs/` makes the creation fail, so move it or pick another
folder. An existing `README.md` is kept and gets a `ShipItRight` section.

## Permissions

The plugin's skills carry the permissions for their scripts and template copies. To let the team use
them without asking you every time, allow them in the project's `.claude/settings.json`:

```json
{
  "enabledPlugins": { "shipitright@shipitright": true },
  "permissions": {
    "allow": ["Skill(shipitright:*)"]
  }
}
```

Agents run one command per Bash call, without chaining or redirection, so that each command matches
these permissions. Everything else (writes in the project, git commands, tool installs) follows your
usual settings; the PO asks before any operation that is hard to undo.

## Developing in place

To work on the plugin without installing it:

```sh
git clone https://github.com/mattdaco-dev/shipitright.git
cd shipitright && npm install          # yaml dependency of the scripts, once
cd <project folder> && claude --plugin-dir <path to the shipitright clone>
```

Check the plugin and the marketplace: `claude plugin validate .` from the root of the clone.

## Contents

- `agents/`: the PO (main session) and the team's subagents.
- `skills/`: shared rules (`team-rules`), project creation, Notion board, prototype bar
  (`proto-bar`), and one skill per deliverable (HTML templates included).
- `team/`: deliverable scripts, assets (`doc.css`, `doc.js`), interface labels (`i18n/`),
  conventions (including the format of stack and design system foundations, declared by each
  project), glossary, deliverable catalog, format examples.
- `PROCESS.md`: phases, gates, roles and ceremonies.

Maintaining the framework: `.claude/CLAUDE.md` (loaded when you open this repository in Claude
Code).

License: MIT.
