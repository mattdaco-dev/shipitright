# ShipItRight

ShipItRight (Product Builder) est un plugin Claude Code : une équipe d'agents, menée par un
Product Owner, qui construit un produit du besoin à la recette. Cadrage, analyse, specs
fonctionnelles, UX et prototype, conception technique, sprints, recette : chaque phase produit ses
livrables HTML et passe un gate validé par l'humain.

Une fois le plugin activé, la session principale est le Product Owner (agent `po`, déclaré dans
`settings.json`) : c'est à lui qu'on parle. Il lance les autres rôles (business analyst, UX/UI
designer, architecte, devs, QA, scrum master, relecteur) comme sous-agents.

## Prérequis

- **Node.js** (les scripts des livrables tournent sous Node ; leur dépendance `yaml` s'installe avec
  le plugin) et **git** (chaque projet est son propre dépôt).
- Facultatifs : le serveur MCP **Notion** (board miroir pour suivre le projet ; sans lui, le board
  local `.team/board/` suffit et l'étape est sautée) et le serveur MCP **Chrome DevTools** (le PO
  montre les pages et le prototype dans le navigateur ; sans lui, il donne le chemin à ouvrir).
- Aucune stack ni aucun design system n'est fourni : au cadrage, le PO vous demande les vôtres
  (dossier, dépôt git, serveur MCP, skill, URL de documentation), ou décide avec vous qu'ils seront
  créés dans le projet.

## Installation, en portée projet

Le PO est l'agent principal du plugin : **partout où le plugin est actif, il remplace le prompt par
défaut de Claude Code**. On l'installe donc dans le dossier du projet à construire, en portée projet,
jamais en portée utilisateur (il prendrait la main dans toutes vos sessions).

Depuis le dossier du projet, dans une session Claude Code :

```
/plugin marketplace add mattdaco-dev/shipitright
/plugin install shipitright@shipitright --scope project
```

ou en ligne de commande :

```sh
claude plugin marketplace add mattdaco-dev/shipitright
claude plugin install shipitright@shipitright --scope project
```

L'installation en portée projet écrit l'activation dans `.claude/settings.json` du projet, que l'on
peut aussi poser à la main :

```json
{
  "enabledPlugins": { "shipitright@shipitright": true }
}
```

Ouvrir ensuite Claude Code dans ce dossier : le PO y crée le squelette (`.team/`, `docs/`, dépôt git
sur la branche `conception`) au démarrage d'un nouveau besoin, puis mène le cadrage. Le dossier ne
doit contenir ni `.team/` ni `docs/` : un `docs/` existant fait refuser la création, le déplacer ou
choisir un autre dossier. Un `README.md` existant est conservé et complété d'une section
`ShipItRight`.

## Permissions

Les skills du plugin portent les permissions de leurs scripts et de leurs copies de gabarits. Pour
que la team les invoque sans vous solliciter à chaque fois, autorisez-les dans `.claude/settings.json`
du projet :

```json
{
  "enabledPlugins": { "shipitright@shipitright": true },
  "permissions": {
    "allow": ["Skill(shipitright:*)"]
  }
}
```

Les agents lancent une commande par appel Bash, sans chaînage ni redirection, pour que chaque commande
passe ces permissions. Le reste (écritures dans le projet, commandes git, installation d'outils)
suit vos réglages habituels ; le PO demande avant toute opération difficile à défaire.

## Développement en place

Pour travailler sur le plugin sans l'installer :

```sh
git clone https://github.com/mattdaco-dev/shipitright.git
cd shipitright && npm install          # dépendance yaml des scripts, une fois
cd <dossier du projet> && claude --plugin-dir <chemin du clone shipitright>
```

Vérifier le plugin et la marketplace : `claude plugin validate .` depuis la racine du clone.

## Contenu

- `agents/` : le PO (session principale) et les sous-agents de la team.
- `skills/` : règles communes (`regles-team`), création de projet, board Notion, barre de prototype
  (`proto-bar`), et un skill par livrable (gabarits HTML compris).
- `team/` : scripts des livrables, assets (`doc.css`, `doc.js`), conventions (dont le format des
  socles de stack et de design system, déclarés par chaque projet), glossaire, catalogue des
  livrables, exemples de formats.
- `PROCESS.md` : phases, gates, rôles et cérémonies.

Maintenir le framework : `.claude/CLAUDE.md` (chargé quand on ouvre ce dépôt dans Claude Code).

Licence : MIT.
