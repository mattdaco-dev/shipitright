# ShipItRight: framework maintenance

This repository is the ShipItRight Claude Code plugin (Product Builder): a team of agents, led by a
Product Owner, that builds a product from the need to acceptance. Here, we **maintain the
framework**; we do not build a product in it. The PO is not active in this repository: it is only
active where the plugin is enabled. The plugin is installed and enabled with project scope
(`--scope project`, or `enabledPlugins` in the project's `.claude/settings.json`), never with user
scope: its main agent replaces Claude Code's default prompt in every session where it is active.

This file is in `.claude/` so that it is read when the repository is opened, without the plugin
validator taking it for a plugin `CLAUDE.md` (a plugin loads none).

## Where things live

- `.claude-plugin/plugin.json`: name, **version**, license. `.claude-plugin/marketplace.json`: the
  `shipitright` marketplace, which lists the plugin at the repository root (`"source": "./"`).
- `settings.json`: `{"agent": "po"}`, the PO becomes the session's main agent.
- `agents/`: `po.md` (main agent, its prompt replaces Claude Code's and imports nothing) and one file
  per sub-agent, launched as `shipitright:<role>`.
- `skills/`: `team-rules` (shared rules, preloaded by the sub-agents, invoked by the PO),
  `project-init`, `notion-board`, `proto-bar` (prototype bar, the plugin is its source), one
  `deliverable-<type>` per deliverable with its templates.
- `team/scripts/`: Node scripts of the deliverables and `init-project.sh`. They find the framework
  files from their own location, never from the current folder; their argument is the project folder
  (`.` by default).
- `team/`: `deliverables.md`, `glossary.md`, `conventions/`, `assets/` (copied into each project),
  `i18n/` (labels per language), `examples/formats/` (frozen formats, including a fictional example
  design system in `foundations/`). The plugin ships no foundation: stack and design system belong
  to the user and live in the project (`.team/foundations/`).
- `PROCESS.md`: phases, gates, roles, ceremonies. Read on demand by the PO and the agents.
- `package.json` and `package-lock.json`: `yaml` dependency at an exact version, installed by Claude
  Code in the plugin cache at install time (checked on 10.11.2026 with Claude Code 2.1.321:
  `node_modules/yaml` present in the cache after `claude plugin install`). The lockfile points to
  `https://registry.npmjs.org`.

## Writing rules for agent files and skills

- In an agent file or a `SKILL.md`, a plugin file is written `${CLAUDE_PLUGIN_ROOT}/…` (substituted
  at load time). In documents read with Read (`PROCESS.md`, `team/…`), the variable is not
  substituted: write `team/…`, path from the plugin root, and `node <plugin root>/team/scripts/…` for
  a script; the convention is at the top of `team/glossary.md` and `PROCESS.md`.
- The project is the current folder: `.team/…`, `docs/…`, with no project folder prefix.
- A script runs as `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/<script>.mjs .`. The skill that runs it
  declares `allowed-tools` (`Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)`,
  `Read(/${CLAUDE_PLUGIN_ROOT}/**)`, the leading `/` is required for Read). These permissions only
  apply if the skill is invoked with the Skill tool, not if it is only preloaded through `skills:`.
- Agents and skills cited as identifiers: `shipitright:<name>`. `skills:` in a sub-agent's front
  matter: prefixed names. On the main agent, `skills:` is not preloaded.
- Fields ignored in a plugin agent: `permissionMode`, `hooks`, `mcpServers`, `initialPrompt`.
  `omitClaudeMd: true` is recognized (Claude Code 2.1.271 and later): the sub-agent starts without
  the user's and the project's `CLAUDE.md`; it is ignored on the main agent.
- A foundation goes into the project (`.team/foundations/`): the plugin ships none.
- A template copy: `allowed-tools` `Bash(cp ${CLAUDE_PLUGIN_ROOT}/skills/<x>/… *)` in the skill, or
  "Read the template then Write". One Bash command per call, without chaining or redirection: a
  compound command does not pass the permissions.

## Developing in place

```sh
npm install                                   # once, yaml dependency of the scripts
mkdir -p /tmp/trial && cd /tmp/trial           # a test project, outside the repository
claude --plugin-dir <path to this repository> # the PO starts, offers project-init
```

A test project is created outside the repository, never inside it.

## Check before committing

```sh
claude plugin validate .                                              # plugin and marketplace
node team/scripts/check-deliverable.mjs team/examples/formats/docs    # examples with no KO
node team/scripts/i18n-fallback.mjs --check                           # embedded fr labels up to date, fr and en same keys
```

After a change in `team/assets/`, copy the assets again into `team/examples/formats/docs/_assets/`
and rerun `node team/scripts/i18n-assets.mjs team/examples/formats`.

After a script change, also run it on a dummy project created by
`team/scripts/init-project.sh <slug> "<Name>" <folder>`, outside the repository.

## Versioning

The plugin pins its version in `.claude-plugin/plugin.json`: users keep the cached version as long as
it does not change. Every published change increments `version` (semver: fix, compatible addition,
breaking change).

## Style

- Everything in English (agent files, skills, `PROCESS.md`, `team/`, `README.md`, the descriptions
  of `plugin.json` and `marketplace.json`, code, identifiers, file names, commit messages in
  Conventional Commits), except the French label files `team/i18n/fr/` and the French example
  project `team/examples/formats/`.
- No em or en dash, no emojis, no empty phrases. Direct, concrete, short sentences.
- Terms in common use are kept as is (roadmap, backlog, release, sprint, story, epic, spike,
  wireflow, design system, token, endpoint).
- Data always fictional.
- Never commit on `main`, never `git push`.
