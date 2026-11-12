# ShipItRight : maintenance du framework

Ce dépôt est le plugin Claude Code ShipItRight (Product Builder) : une équipe d'agents, menée par un
Product Owner, qui construit un produit du besoin à la recette. Ici, on **maintient le framework** ;
on n'y construit pas de produit. Le PO n'est pas actif dans ce dépôt : il ne l'est que là où le plugin
est activé. On installe et on active le plugin en portée projet (`--scope project`, ou
`enabledPlugins` dans `.claude/settings.json` du projet), jamais en portée utilisateur : son agent
principal remplace le prompt par défaut de Claude Code dans toute session où il est actif.

Ce fichier est dans `.claude/` pour être lu quand on ouvre le dépôt, sans que le validateur de
plugins le prenne pour un `CLAUDE.md` de plugin (un plugin n'en charge aucun).

## Où vit quoi

- `.claude-plugin/plugin.json` : nom, **version**, licence. `.claude-plugin/marketplace.json` : la
  marketplace `shipitright`, qui liste le plugin à la racine du dépôt (`"source": "./"`).
- `settings.json` : `{"agent": "po"}`, le PO devient l'agent principal de la session.
- `agents/` : `po.md` (agent principal, son prompt remplace celui de Claude Code et n'importe rien) et
  une fiche par sous-agent, lancée en `shipitright:<rôle>`.
- `skills/` : `regles-team` (règles communes, préchargé par les sous-agents, invoqué par le PO),
  `projet-init`, `notion-board`, `proto-bar` (barre des prototypes, le plugin en est la source), un
  `livrable-<type>` par livrable avec ses gabarits.
- `team/scripts/` : scripts Node des livrables et `init-projet.sh`. Ils trouvent les fichiers du
  framework par leur propre emplacement, jamais par le dossier courant ; leur argument est le dossier
  du projet (`.` par défaut).
- `team/` : `livrables.md`, `glossaire.md`, `conventions/`, `assets/` (copiés dans chaque projet),
  `exemples/formats/` (formats figés, dont un design system d'exemple fictif dans `socles/`). Le
  plugin n'embarque aucun socle : stack et design system sont propres à l'utilisateur et vivent dans
  le projet (`.team/socles/`).
- `PROCESS.md` : phases, gates, rôles, cérémonies. Lu à la demande par le PO et les agents.
- `package.json` et `package-lock.json` : dépendance `yaml` en version exacte, installée par Claude
  Code dans le cache du plugin à l'installation (vérifié le 10.11.2026 avec Claude Code 2.1.321 :
  `node_modules/yaml` présent dans le cache après `claude plugin install`). Le lockfile pointe sur
  `https://registry.npmjs.org`.

## Règles d'écriture des fiches et des skills

- Dans une fiche d'agent ou un `SKILL.md`, un fichier du plugin s'écrit `${CLAUDE_PLUGIN_ROOT}/…`
  (substitué au chargement). Dans les documents lus avec Read (`PROCESS.md`, `team/…`), la variable
  n'est pas substituée : on écrit `team/…`, chemin depuis la racine du plugin, et
  `node <racine du plugin>/team/scripts/…` pour un script ; la convention est en tête de
  `team/glossaire.md` et de `PROCESS.md`.
- Le projet est le dossier courant : `.team/…`, `docs/…`, sans préfixe de dossier de projet.
- Un script se lance `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/<script>.mjs .`. Le skill qui le lance
  déclare `allowed-tools` (`Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)`,
  `Read(/${CLAUDE_PLUGIN_ROOT}/**)`, le `/` en tête est obligatoire pour Read). Ces permissions ne
  valent que si le skill est invoqué avec l'outil Skill, pas s'il est seulement préchargé par `skills:`.
- Agents et skills cités comme identifiants : `shipitright:<nom>`. `skills:` dans le frontmatter d'un
  sous-agent : noms préfixés. Sur l'agent principal, `skills:` n'est pas préchargé.
- Champs ignorés dans un agent de plugin : `permissionMode`, `hooks`, `mcpServers`, `initialPrompt`.
  `omitClaudeMd: true` est reconnu (Claude Code 2.1.271 et plus) : le sous-agent démarre sans les
  `CLAUDE.md` de l'utilisateur et du projet, et ignoré sur l'agent principal.
- Un socle va dans le projet (`.team/socles/`) : le plugin n'en embarque pas.
- Une copie de gabarit : `allowed-tools` `Bash(cp ${CLAUDE_PLUGIN_ROOT}/skills/<x>/… *)` dans le skill,
  ou « Read du gabarit puis Write ». Une commande Bash par appel, sans chaînage ni redirection : une
  commande composée ne passe pas les permissions.

## Développer en place

```sh
npm install                                   # une fois, dépendance yaml des scripts
mkdir -p /tmp/essai && cd /tmp/essai           # un projet de test, hors du dépôt
claude --plugin-dir <chemin de ce dépôt>      # le PO démarre, propose projet-init
```

Un projet de test se crée hors du dépôt, jamais dedans.

## Vérifier avant de commiter

```sh
claude plugin validate .                                        # plugin et marketplace
node team/scripts/check-livrable.mjs team/exemples/formats/docs # exemples sans KO
node team/scripts/i18n-fallback.mjs --check                     # libellés fr embarqués à jour, fr et en mêmes clés
```

Après un changement de `team/assets/`, recopier les assets dans `team/exemples/formats/docs/_assets/`
et relancer `node team/scripts/i18n-assets.mjs team/exemples/formats`.

Après un changement de script, le lancer aussi sur un projet factice créé par
`team/scripts/init-projet.sh <slug> "<Nom>" <dossier>`, hors du dépôt.

## Versionner

Le plugin fige sa version dans `.claude-plugin/plugin.json` : les utilisateurs gardent la version en
cache tant qu'elle ne change pas. Toute évolution publiée incrémente `version` (semver : correctif,
ajout compatible, rupture).

## Style

- Français pour tout ce qui est rédigé ; code, identifiants, noms de fichiers et messages de commit
  en anglais (Conventional Commits).
- Pas de tiret cadratin ni demi-cadratin, pas d'emojis, pas de formules creuses. Direct, concret,
  phrases courtes.
- On ne francise pas les termes d'usage courant (roadmap, backlog, release, sprint, story, epic,
  spike, wireflow, design system, token, endpoint).
- Données toujours fictives.
- Jamais de commit sur `main`, jamais de `git push`.
