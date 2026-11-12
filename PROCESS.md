# Process de ShipItRight

ShipItRight (Product Builder) : une équipe d'agents Claude Code qui construit un produit, du besoin à la recette.

Comment la team transforme une expression de besoin en logiciel recetté. Ce document est la référence
commune : le PO l'applique, les agents s'y réfèrent, le Scrum Master en propose les évolutions après
chaque rétro.

**Chemins.** ShipItRight est un plugin Claude Code. Dans ce document et dans les autres documents du
framework (`team/…`), un chemin comme `team/conventions/git.md`, `skills/…` ou `agents/…` part de la
racine du plugin, notée `<racine du plugin>` (la fiche d'agent ou le skill qui renvoie ici en donne le
chemin réel) ; un chemin comme `.team/…`, `docs/…` ou `prototype/…` part de la racine du projet, le
dossier où l'on ouvre Claude Code. Un skill s'invoque avec son nom préfixé, `shipitright:<nom>`.

## 1. Principes

1. **L'humain ne parle qu'au PO.** Le PO est le seul point de contact entre le métier et la team.
   Aucun autre agent ne s'adresse à l'humain.
2. **La rigueur est dans les gates, pas dans la séquence.** Les livrables d'une phase peuvent avancer
   ensemble (specs et proto, par exemple), mais rien de non résolu ne franchit un gate. Les fichiers
   sur disque sont les gates : un livrable absent ou incomplet bloque.
3. **Le PO aiguille, il ne lit pas le code.** Il dispatche les agents, lit les statuts du board, les
   rapports, les en-têtes du forum et le `git log`. Son contexte reste disponible pour l'humain.
4. **Un agent démarre à froid.** Il ne voit pas la conversation. Tout ce dont il a besoin est dans son
   brief et dans les fichiers que le brief désigne.
5. **On écrit dans son propre fichier ou en ajout.** Un fichier par ticket, un fichier par sujet de
   forum, des posts en ajout seulement. Deux agents en parallèle ne peuvent pas s'écraser.
6. **La rigueur suit l'enjeu, pas l'horloge.** Plus une erreur est coûteuse à défaire (sécurité,
   migration de données, contrat partagé), plus la revue est stricte et les tickets petits.
7. **Une incohérence structurelle n'est jamais tranchée en autonomie.** Elle remonte à l'humain via le PO.

## 2. Rôles

| Rôle | Fiche | Responsabilité principale | Instances |
|---|---|---|---|
| **PO** | `agents/po.md` (agent principal, via `settings.json`) | besoin, priorités, règles métier, orchestration, gates | 1 |
| **Scrum Master** | `agents/scrum-master.md` | plan de sprint, DoR/DoD, checklist préalable à G2, rétro (problèmes, actions, évolutions proposées pour le plugin) | 1 |
| **Business Analyst** | `agents/business-analyst.md` | analyse, big picture, story map, conception fonctionnelle, epics et US | 1 à N |
| **UX/UI Designer** | `agents/ux-designer.md` | parcours, écrans, spec UX/UI, prototype | 1 |
| **Architecte** | `agents/architecte.md` | conception macro et détaillée, contrat d'API, conformité, ADR | 1 |
| **Dev backend** | `agents/dev-backend.md` | tickets backend, dans la stack du socle | 1 à N |
| **Dev frontend** | `agents/dev-frontend.md` | tickets frontend, dans la stack et le design system du socle | 1 à N |
| **QA** | `agents/qa.md` | stratégie de test, e2e, campagnes, anomalies | 1 à N |
| **Relecteur** | `agents/relecteur.md` | revues indépendantes, passes de cohérence et d'intégration | 1 par revue |

Chaque fiche décrit le rôle, les compétences, les attentes, les livrables, les skills et MCP utilisables,
les limites et la multiplicité. Les rôles multiples se démultiplient selon la charge de production et
de recette : autant d'instances que de travaux indépendants et prêts, **5 agents simultanés au maximum**
toutes catégories confondues.

Le PO est l'agent principal du plugin : quand le plugin est activé, sa fiche remplace le prompt par
défaut de Claude Code, et il lance les autres rôles comme sous-agents (`shipitright:<rôle>`). Les
sous-agents préchargent le skill `shipitright:regles-team` et les skills de leurs livrables. Chacun
garde une mémoire persistante par rôle dans le projet (`.claude/agent-memory/shipitright-<rôle>/`), où
il consigne ce qu'il a appris sur ce projet. Cette mémoire a la portée du projet : elle se commite
avec lui, comme ses livrables.

## 3. Arborescence

Le plugin, installé depuis la marketplace (copie en lecture dans le cache de Claude Code) ou chargé en
développement avec `claude --plugin-dir` :

```
shipitright/                 <racine du plugin>
  .claude-plugin/            plugin.json (nom, version), marketplace.json
  settings.json              {"agent": "po"} : le PO est l'agent principal
  package.json               dépendance des scripts (yaml), installée avec le plugin
  PROCESS.md                 ce document
  agents/                    po.md (agent principal) et une fiche par rôle de sous-agent
  skills/                    regles-team, projet-init, notion-board, proto-bar, livrable-<type> (gabarit + exigences)
  team/
    livrables.md             catalogue des livrables
    glossaire.md             identifiants et cibles de liens, sigles, vocabulaire de la team
    conventions/             brief, rapport, ticket, forum, git, socle
    assets/                  doc.css, doc.js : bibliothèque des livrables HTML
    scripts/                 init-projet.sh, check-livrable.mjs, questions-page.mjs, detaillee-pages.mjs,
                             adr-pages.mjs, pilotage-pages.mjs (argument : le projet, `.` par défaut)
    exemples/formats/        formats figés des livrables, remplis à la main
```

Le plugin n'embarque aucun socle : la stack et le design system appartiennent à l'utilisateur ou au
projet (section 8).

Le projet est le dossier où l'on ouvre Claude Code, et son propre dépôt git :

```
<projet>/
  .team/
    board/                   un fichier par ticket ou anomalie
    forum/                   un fichier par sujet
    questions/               questions métier au PO
    projet.json              langue du projet ({ "langue": "<code BCP 47>" }), team/conventions/langue.md
    libelles.json            libellés des pages générées, pour une langue que le plugin ne fournit pas
    journal.md               une ligne par événement, tenu par le PO
    socle.md                 socles retenus (stack, design system) et surcharges du projet
    socles/                  socles créés pour le projet : stacks/<nom>/, design-systems/<nom>/
    notion.md                liens du board Notion, s'il existe
  .claude/agent-memory/      mémoire persistante de chaque rôle (shipitright-<rôle>/), commitée
  docs/
    index.html               page de pilotage, générée par pilotage-pages.mjs (remplace le portail)
    _assets/                 copie de team/assets, plus i18n.js (libellés dans la langue du projet)
    00-cadrage/  10-analyse/  20-specs/  20-ux/  30-conception/  40-qa/  50-recette/  sprints/  adr/
    30-conception/
      macro.html             conception technique macro
      api/                   contrat d'API : openapi.yaml (racine), paths/, components/
      detaillee/             conception technique détaillée par objet : index.html (sommaire), endpoints/, schemas/
                             (générées), entites/, traitements/ (à la main), transverse/ (dont
                             conformite.html, contrat de conformité), points-ouverts.html, swagger.html
    10-analyse/
      index.html             inventaire des analyses de chantier, généré par pilotage-pages.mjs
    20-specs/
      backlog.html           page backlog, générée par pilotage-pages.mjs
    roadmap.html
  prototype/                 HTML/CSS/JS vanilla, proto-bar, données fictives
  backend/  frontend/        selon le socle de stack
```

Les scripts se lancent depuis la racine du projet :
`node <racine du plugin>/team/scripts/<script>.mjs .` (voir **Chemins** en tête de ce document).

## 4. Cycle de vie d'un projet

```
P0 Cadrage ─G0─▶ P1 Analyse ─▶ P2 Specs, UX, proto ─G1─▶ P3 Conception technique ─G2─▶ Sprints
Sprint N : Planning ▶ Dev par vagues ▶ Revues ▶ QA ▶ Intégration ▶ Pré-recette ─G3─▶ Review, rétro
```

Gates humains : **G0** (cadrage), **G1** (validation), **G2** (conception technique), **G3** (recette).
Le détail de chaque livrable (contenu obligatoire, recommandé, facultatif) est dans son skill ; la
vue d'ensemble dans `team/livrables.md`.

### P0 Cadrage, avec l'humain

- **Participants** : PO + humain. Mode interactif : questions une à une, chacune avec la réponse
  pressentie (skill `shipitright:livrable-cadrage`).
- **Livrable** : cadrage et vision (`docs/00-cadrage/cadrage.html`), socles déclarés (`.team/socle.md`).
- **Avant** : création du projet (`shipitright:projet-init`), puis du board Notion
  (`shipitright:notion-board`) si le MCP Notion est disponible ; sans lui, cette étape est sautée.
- **Socles** : le PO demande à l'humain sa stack et son design system (une source à lui : dossier,
  dépôt git, MCP, skill, URL), ou décide avec lui qu'ils seront créés dans le projet (stack par
  l'architecte en P3, design system par l'UX en P2).
- **G0, validé par l'humain** : vision et périmètre acceptés, socles de stack et de design system
  déclarés (ou à créer, avec leur auteur), questions ouvertes listées avec un propriétaire.

### P1 Analyse et exploration, en autonomie

- **Participants** : BA (1 à N, un par chantier), UX pour l'exploration des usages, Architecte consulté
  sur la faisabilité.
- **Livrables** : big picture, une analyse par chantier, première version de la story map.
  L'inventaire des analyses (`docs/10-analyse/index.html`) est généré depuis les pages d'analyse.
  Chaque analyse porte sa cible, la phase ou la release qu'elle prépare (meta `pour` : `P1` en P1 ;
  après G1, la phase ou la release visée).
- **Mode** : le PO découpe en chantiers indépendants et lance un BA par chantier en parallèle. Une
  question non bloquante n'arrête pas un chantier : `HYPOTHÈSE` visible, et on continue.
- **Avancement et statut** : une analyse porte l'avancement de son chantier (`en cours` tant que la
  timebox n'est pas épuisée et qu'une passe reste à faire, `terminé`, `restitué partiel`) et, à part, le
  statut de sa page (`brouillon`, `en revue`, `validé`). Son auteur est « IA » quand un agent de la team
  l'a traitée, sinon le nom de la personne qui l'a faite ; l'instance du BA reste tracée par le journal.
- **Chantier ouvert après G1** : le PO peut ouvrir un chantier d'analyse après G1 pour préparer une
  phase ou une release suivante. Les stories qui en sortent suivent la règle des stories rédigées
  après G1 (P2).

### P2 Specs fonctionnelles, UX/UI et prototype, en autonomie

- **Participants** : BA (story map, conception fonctionnelle, epics et US), UX (spec UX/UI, prototype,
  socle de design system s'il faut le créer), PO (roadmap), en tandem.
- **Livrables** : story map, conception fonctionnelle, epics et US, spec UX/UI, prototype, roadmap.
- **Taille des stories** : chaque story porte sa taille (XS à XL) et sa part front ; la roadmap et la
  page backlog les lisent. Une story XL ne passe pas `prete` : celles des releases présentées au G1 se
  découpent avant G1.
- **Passe de cohérence** : un Relecteur frais croise stories, règles, écrans et proto avant G1.
- **G1, validé par l'humain** : le PO présente le prototype et une synthèse. Les retours deviennent des
  corrections P2, puis le gate est représenté.
- **Après G1** : epics et stories reportées dans le board Notion, s'il existe.
- **Story rédigée après G1**, issue ou non d'un chantier d'analyse ouvert après G1 : le PO la valide
  (`Arbitrage PO`, statut `validee`), puis la montre à l'humain au G3 suivant. Elle lui remonte avant,
  sans attendre ce gate, si elle change le périmètre ou porte une règle métier forte.

### P3 Conception technique, en autonomie

- **Participants** : Architecte (auteur), devs (relecture de faisabilité), QA (stratégie de test).
- **Livrables** : conception technique macro ; conception technique détaillée de **toute
  l'application**, organisée par objet (`docs/30-conception/detaillee/`) ; contrat d'API
  (`api/openapi.yaml` et ses fichiers liés) ;
  contrat de conformité (`detaillee/transverse/conformite.html`) ; ADR (pages HTML
  `docs/adr/NNNN-<slug>.html`, registre `docs/adr/index.html` généré par `team/scripts/adr-pages.mjs`) ;
  stratégie de test. Les pages des endpoints et des schémas sont générées
  depuis le contrat d'API par `team/scripts/detaillee-pages.mjs`, celles des entités et des
  traitements sont écrites à la main avec leurs blocs calculés. L'architecte complète les notes
  techniques des stories : bloc généré et tableau scénario, élément, écran.
- **Opérations figées ou provisoires** : une opération du contrat d'API est figée (rien n'en est
  retiré ni changé, seuls des ajouts rétrocompatibles annoncés sont permis ; le front peut partir sur
  un mock) ou provisoire (elle attend une réponse métier, son détail est réduit). Une opération
  provisoire est figée au sprint planning qui la prend.
- **Passe de cohérence** : chaque story couverte par au moins un endpoint et un écran (notes
  techniques des stories), modèle de données qui porte toutes les règles, macro et contrat d'API
  d'accord, chaque scénario des stories présent dans la matrice de couverture de la stratégie de test.
- **Vérification avant G2** : le Scrum Master vérifie la checklist, dont la stratégie de test présente,
  `check-livrable.mjs` sans KO sur
  `docs/` (il lance `detaillee-pages.mjs --check`, `adr-pages.mjs --check` et `pilotage-pages.mjs --check` :
  pages générées, registre des ADR et page de pilotage à jour, références résolues) et
  le lint Redocly du contrat d'API sans erreur. L'architecte vérifie l'outillage de la machine et
  liste ce qu'il faut installer.
- **G2, validé par l'humain** : la conception technique est revue par l'équipe technique et l'équipe
  d'architecture humaines. Le PO présente à l'humain les pages de la conception et une synthèse ;
  l'humain les fait relire par ces équipes avant de valider. **Toute déviation au socle de stack ou
  au standard d'architecture lui remonte** (ADR `propose` avec écart au socle, listés dans le
  registre `docs/adr/index.html`), avec les points ouverts d'impact fort de la conception détaillée
  (`detaillee/points-ouverts.html`), l'outillage à installer, pour accord, et le socle créé pour le
  projet s'il y en a un, validé à ce gate. Les retours deviennent des corrections P3, puis le gate
  est représenté.

### Sprint N, en autonomie

1. **Planning** : le PO choisit le lot de stories, toutes validées (au G1, ou par le PO pour une story
   rédigée après G1, montrée à l'humain au G3 suivant, voir P2) et aucune de taille XL ; l'architecte fige les opérations provisoires
   qu'elles touchent, puis met à jour la version (`info.version`) et le journal des changements
   (`info.x-changelog`) du contrat d'API dès qu'il fige ou ajoute une opération. Le SM et
   l'architecte découpent le lot en tickets à partir des pages de la conception détaillée (endpoints,
   traitements, entités, vue par écran), posent dépendances et vagues, vérifient la DoR. Le SM prévoit
   aussi, dans la liste des tickets à créer, un ticket `e2e` par lot de stories, confié à une instance
   QA (`team/conventions/ticket.md`) ; le PO en crée le fichier, comme pour tout ticket.
   La matrice de couverture de la stratégie de test, complète à G2, est mise à jour par le QA pour
   toute story ajoutée ou modifiée après G2. Page de sprint, tickets dans le board, synchro Notion s'il existe.
2. **Dev par vagues** : tickets dont les dépendances sont fermées, 3 en parallèle en cible, 5 au
   maximum, chacun dans son worktree. Un ticket frontend qui consomme une opération figée ne dépend
   pas du ticket backend qui la produit : il part en même temps, sur un mock. Les tickets `e2e` du QA
   partent dans ces vagues : tests écrits et mis au point en Local. Un ticket `e2e` n'a pas de
   dépendance : il part dans une vague de dev et se met au point au fil des merges, il peut donc fermer
   après les vagues suivantes ; la colonne Vague de la page de sprint dit où il part.
3. **Revue indépendante** de chaque ticket rendu par un Relecteur frais. Bloquant → retour à l'auteur,
   3 tours de correction au maximum, puis remontée à l'humain. Sans bloquant → merge dans `sprint/N`. Si l'auteur
   corrige des majeurs avant le merge, la correction est relue par un Relecteur frais sur ces seuls
   constats, sauf si elle n'ajoute que des tests ; le PO trace ce choix au journal. Un ticket qui
   touche au contrat d'API est revu avec `detaillee-pages.mjs --check` et le lint Redocly, et contre
   `CF-58` (rien ne change dans une opération figée).
4. **QA**, en deux temps : (1) les tickets `e2e` sont écrits, revus et mergés comme les autres
   tickets (étapes 2 et 3) ; (2) la campagne se joue sur l'environnement « Démo et recette », que le
   QA démarre au commit de `sprint/N` qui contient les tickets `e2e` mergés, noté dans la campagne, et
   relance après chaque merge de correction. Le dernier commit joué est le commit recetté ; le double
   passage exigé par le critère de sortie se fait à ce commit, une correction mergée en fin de
   campagne est donc rejouée deux fois. Les preuves des vérifications manuelles (redémarrage, lecteur
   d'écran…) sont versionnées dans `docs/40-qa/preuves/sprint-N/` et liées depuis la campagne ; le
   rapport HTML de Playwright reste hors git. Données de test : un nom unique par
   exécution, un seed de test qui ne passe par aucun endpoint de story. Anomalies `BUG-xxx` traitées
   dans le sprint : le QA commite le test de l'anomalie, rouge, sur sa branche de correction créée
   depuis `sprint/N` (`team/conventions/git.md`), le dev corrige sur la même branche, revue et merge comme un ticket. Verdict : favorable sans réserves si
   aucune anomalie n'est ouverte ; favorable avec réserves si seules des mineures sont ouvertes, ou
   une majeure acceptée par écrit par le PO dans la campagne ; défavorable si une bloquante est
   ouverte ou une majeure non acceptée. Après son dernier passage, rejeux des corrections compris, le
   QA remet « Démo et recette » à zéro avant la pré-recette ; le PO s'en assure.
5. **Intégration** : un Relecteur frais passe sur l'ensemble mergé.
6. **Pré-recette** (PO) : verdict de campagne favorable, avec ou sans réserves ; chaque story du
   sprint a ses critères au vert, sauf un scénario rendu rouge par une anomalie admise au verdict
   (mineure, ou majeure acceptée par écrit par le PO), citée dans la campagne ; chemin de recette prêt.
7. **G3 Recette, avec l'humain** : PV de recette, au commit recetté. Les réserves deviennent des
   tickets ; une anomalie mineure laissée ouverte au verdict y est reportée en réserve `RES-xx`. Une
   réserve est levée quand l'élément qui lui est lié (l'anomalie `BUG-xxx` ou le ticket `T-xxx` créé
   pour elle) passe au statut `fait`.
8. **Review et rétro** (SM) : page de sprint complétée ; sa section Rétro enchaîne problèmes `Sn-Pm`,
   actions `Sn-Am` et évolutions proposées pour le plugin `Sn-Em`, que le PO soumet à l'humain.
   Roadmap mise à jour. Une évolution acceptée ne s'applique pas dans le plugin
   installé (copie en lecture, écrasée à chaque mise à jour) : elle part en proposition au dépôt
   ShipItRight, où elle s'applique et sort dans une nouvelle version.

## 5. Board, forum, échanges

- **Board local** (`.team/board/`) : source de vérité. Format et règles : `team/conventions/ticket.md`.
  Seul le PO change un statut ou une affectation.
- **Board Notion**, facultatif (MCP Notion) : miroir pour l'humain, tenu par le PO seul, synchronisé
  par lots (skill `shipitright:notion-board`).
- **Page de pilotage, backlog et inventaire des analyses** (`docs/index.html`,
  `docs/20-specs/backlog.html`, `docs/10-analyse/index.html`) : vue de l'humain sur le projet
  (Overview, Hotspot, indicateurs, derniers événements), sur les stories et sur les chantiers
  d'analyse ; l'inventaire s'ouvre depuis la carte « Analyses de chantier » que la page de pilotage
  montre dans chaque colonne de l'Overview qui a au moins un chantier (cible lue dans la meta `pour`).
  Générées par `team/scripts/pilotage-pages.mjs` depuis le journal, le board, les questions et les
  méta des livrables ; le PO les régénère à chaque synchro de vague, à chaque gate et à chaque merge
  dans `sprint/N`. Aucune ligne de journal propre, ni date prévue ni retard. Skill `shipitright:livrable-pilotage`.
- **Forum et questions** : `team/conventions/forum.md`.
- **Brief et rapport** : `team/conventions/brief.md` et `rapport.md`.
- **Git** : `team/conventions/git.md`.

## 6. Cérémonies

Pas de daily : un cycle de dev d'agents dure quelques minutes, une synchro au milieu n'aurait rien à
synchroniser.

| Cérémonie | Quand | Qui | Sortie |
|---|---|---|---|
| Lancement de phase | entrée de chaque phase | PO | briefs des agents |
| Passation | sortie de chaque agent | l'agent | rapport, posts forum |
| Synchro de vague | après chaque vague parallèle | PO | statuts, réponses aux questions, page de pilotage régénérée, vague suivante |
| Sprint planning | début de sprint | SM, Architecte | opérations du lot figées, version du contrat d'API, page de sprint, tickets |
| Gate | fin de P0, P2 et P3, fin de sprint (G3) | PO + humain | décision consignée au journal, page de pilotage régénérée |
| Recette | fin de sprint | PO + humain | PV de recette |
| Review et rétro | après la recette | SM | page de sprint complétée : actions `Sn-Am`, évolutions proposées pour le plugin `Sn-Em` |

## 7. Definition of Ready et Definition of Done

**DoR d'une story** (case à cocher de la story, skill `shipitright:livrable-epic-us`)
- sa taille (`taille`, XS à XL) et sa part front (`front`) sont renseignées ;
- elle n'est pas de taille XL : une story XL ne passe pas `prete`, elle se découpe avant. Une XL d'une
  release présentée au G1 se découpe donc avant G1 ; une XL rédigée plus tard, avant d'entrer en sprint.

**DoR d'un ticket**
- les stories liées sont validées (au G1, ou par le PO pour une story rédigée après G1), donc aucune
  n'est de taille XL ;
- le brief décrit le comportement, les signatures et les critères, sans chemins de code ; il cite les
  scénarios `US-xxx/Sn` qu'il sert et les jeux de données d'exemple de la story qui les illustrent ;
- `consomme` et `produit` sont renseignés ;
- les dépendances sont fermées ;
- les opérations du contrat d'API qu'il produit ou consomme sont figées ;
- pour un ticket `e2e`, la matrice de couverture de la stratégie de test est à jour ;
- il tient dans un contexte frais (sinon, le découper).

**DoD d'un ticket**
- build vert, tests unitaires verts ;
- auto-revue sur la checklist du rôle faite ;
- revue indépendante sans bloquant ;
- respect du contrat de conformité (`detaillee/transverse/conformite.html`) ;
- rapport rempli ;
- commit sur la branche du ticket, mergé dans `sprint/N`.

**DoD d'un livrable documentaire**
- `check-livrable.mjs` sans KO ;
- recommandés présents ou justifiés en une ligne ;
- passe de cohérence sans bloquant avant son gate.

**DoD d'un sprint**
- verdict de campagne favorable, avec ou sans réserves ;
- tous les critères Gherkin des stories du sprint couverts par un test au vert, au niveau indiqué par
  la matrice de couverture de la stratégie de test (un scénario « sans e2e » est couvert par un test du
  niveau complémentaire) ; un scénario peut rester rouge s'il est rendu rouge par une anomalie admise
  au verdict (mineure, ou majeure acceptée par écrit par le PO), citée dans la campagne ;
- passe d'intégration sans bloquant ;
- PV de recette signé par l'humain.

## 8. Socles : stack et design system

Le plugin n'embarque ni stack ni design system : ils sont propres à l'utilisateur. Chaque projet
déclare les siens au cadrage dans `.team/socle.md`, sous forme de **socles** : soit une source de
l'utilisateur (dossier local, dépôt git, MCP, skill, URL), soit un socle créé dans le projet
(`.team/socles/stacks/<nom>/`, `.team/socles/design-systems/<nom>/`). Format, sources et règles :
`team/conventions/socle.md`.

- **Les livrables citent le socle, ils ne le recopient pas** : la conception macro renvoie à la stack,
  la spec UX/UI au design system ; seuls les écarts et les compléments du produit y figurent.
- **Pas de socle fourni par l'humain** : l'architecte crée le socle de stack en P3 dans
  `.team/socles/stacks/<nom>/` (validé à G2), l'UX crée un design system minimal en P2 dans
  `.team/socles/design-systems/<nom>/` (validé à G1). Ces socles sont versionnés avec le projet.
- **Constant quel que soit le socle** : contrat d'API en OpenAPI 3, réparti en plusieurs fichiers
  (`api/openapi.yaml` racine, `paths/`, `components/`) reliés par `$ref`, tests unitaires du domaine,
  e2e en Playwright pilotés par le QA, prototype en HTML/CSS/JS vanilla avec `proto-bar` et données fictives, aux
  tokens du design system.
- **Toute déviation au socle de stack** passe par un ADR au statut proposé (`meta statut propose`) et remonte à l'humain.
  Un écart au design system se justifie dans la spec UX/UI.

**Outillage** : la team installe ce que le socle demande (runtime, outil de build, Docker…) au premier
besoin, après accord de l'humain demandé par le PO.

## 9. Ce qui remonte à l'humain

Le PO interrompt l'autonomie et s'adresse à l'humain pour :

- les gates G0, G1, G2, G3 ;
- une question métier qu'il ne peut pas trancher (groupées, pas une par une) ;
- une déviation au socle de stack ou au standard d'architecture ;
- une incohérence structurelle entre tickets ou entre livrables ;
- une boucle revue → correction qui ne converge pas en 3 tours de correction ;
- l'installation d'un outil sur la machine ;
- la page Notion où créer le board d'un nouveau projet ;
- toute opération irréversible hors du dépôt du projet.

Le reste du temps, la team avance seule et le PO tient l'humain informé par un point court à chaque
fin de phase.
