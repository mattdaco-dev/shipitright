---
name: livrable-pilotage
description: Génère et tient à jour la page de pilotage d'un projet ShipItRight (docs/index.html, qui remplace le portail : phase, release et prochain gate, overview des livrables et des sprints, gates, hotspots, indicateurs, derniers événements) et sa page backlog (docs/20-specs/backlog.html : synthèse par release, stories par epic avec statut dérivé, taille, part front, précisions, écarts entre sources) et l'inventaire des analyses (docs/10-analyse/index.html : une ligne par chantier : auteur, avancement, statut, phase ou release préparée (Pour), recommandation, ce qui reste ouvert, livrables impactés), par le script pilotage-pages.mjs, depuis les fichiers du projet. À utiliser par le PO à chaque synchro de vague, à chaque gate et à chaque merge, ou quand le contrôle des livrables signale une page de pilotage à régénérer.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Livrable : page de pilotage, backlog et analyses de chantier

Trois pages **générées**, jamais éditées à la main : elles relisent ce que la team a déjà écrit
ailleurs et le montrent à l'humain en un coup d'œil.

- **Page de pilotage** (`docs/index.html`) : où en est le projet, ce que seul l'humain peut
  trancher, les chiffres d'avancement et de qualité, les derniers événements du journal. Elle
  remplace le portail du projet : les livrables y renvoient par « ← Pilotage du projet ».
- **Backlog** (`docs/20-specs/backlog.html`) : chaque story à sa place dans le parcours, rangée par
  epic, avec sa release, sa taille, sa part front et ce qui précise son statut ; et les **écarts
  entre sources**, que le PO remet d'accord avant le planning suivant.
- **Analyses de chantier** (`docs/10-analyse/index.html`) : une ligne par chantier d'analyse, avec
  la question posée, qui l'a traité, son avancement, son statut, la phase ou la release qu'il
  prépare, sa recommandation, ce qu'il laisse ouvert et les livrables qu'il touche.

- **Producteur** : le PO, par le script ; personne ne les rédige.
- **Quand** : à chaque synchro de vague, à chaque gate (une fois la décision consignée au journal et
  le statut du livrable mis à jour), à chaque merge dans `sprint/N`. `check-livrable.mjs` signale
  une page qui n'est plus à jour.
- **Gabarits** : [`template-pilotage.html`](template-pilotage.html),
  [`template-backlog.html`](template-backlog.html),
  [`template-analyses.html`](template-analyses.html) ; `init-projet.sh` part du premier, puis lance
  le script, qui écrit le backlog et l'inventaire des analyses à l'état vide.
- **Formats figés** (exemples remplis à la main) : `${CLAUDE_PLUGIN_ROOT}/team/exemples/formats/docs/index.html`,
  `${CLAUDE_PLUGIN_ROOT}/team/exemples/formats/docs/20-specs/backlog.html` et
  `${CLAUDE_PLUGIN_ROOT}/team/exemples/formats/docs/10-analyse/index.html`.

```sh
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/pilotage-pages.mjs .            # écrit docs/index.html, docs/20-specs/backlog.html et docs/10-analyse/index.html
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/pilotage-pages.mjs . --check    # contrôle sans écrire
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-livrable.mjs .            # lance aussi pilotage-pages --check
```

`--now "AAAA-MM-JJ HH:MM"` fixe l'heure de génération (tests). En `--check`, l'heure est celle déjà
écrite dans la page (« Mis à jour le ») : une page ne dérive que si ses sources changent.

## Principes

- **Rien d'inventé.** Ce qui ne se calcule pas se réduit au titre de sa source : une ligne de
  hotspot nomme l'élément (titre du ticket, de la question, de l'ADR) et ce que ses fichiers en
  disent (hypothèse, élément lié, objets touchés), jamais une phrase « pourquoi ça compte » écrite
  pour l'occasion.
- **Pas de date prévue ni de retard**, nulle part : les dates sont dans le calendrier de la roadmap.
  Le seul futur affiché est la fin du sprint en cours, lue dans sa page.
- **Aucune ligne de journal** n'est ajoutée pour ces pages : elles lisent les événements déjà
  consignés.
- **Une source par donnée.** Quand deux fichiers se contredisent sur une story, la page retient la
  source désignée ci-dessous et signale l'autre dans les écarts ; elle ne corrige rien.
- Tout ce qui est calculé est entre `<!-- gen:<nom> -->` et `<!-- /gen:<nom> -->` ; le reste (les
  (i), les légendes) vient du gabarit. Une page se régénère entière depuis le gabarit.

## Sources

| Donnée | Source | Repli |
|---|---|---|
| Nom du projet, vision (bandeau) | `h1` et `lede` du cadrage | nom : `toc-project` de la page existante, puis nom du dossier ; vision : rien |
| Lien du board | `.team/notion.md`, ligne « Base » | pas de bouton |
| Gates G0, G1, G2 franchis, date | dernière ligne `G0`, `G1`, `G2` du journal, verdict « validé » | `data-gate="Gn\|validé\|date"` de la grille de la roadmap |
| Stories, titres, releases, ordre des releases | story map (`.sm-release`, `.sm-story`) | releases : en-têtes G3 de la grille de la roadmap ; sinon une seule release « Release » |
| Epic d'une story | « Correspondance avec les epics » de la story map (plages `US-a à US-b` comprises) | méta `epic` de la story, puis couloir de la roadmap |
| Statut, taille, part front, validation | balises `meta` de la story : `statut`, `taille`, `front`, `valide_par`, `valide_le`, `type` | taille et front : `data-size`, `data-front` de l'estimation macro |
| Poids de la part front | `data-h` de l'estimation macro de la roadmap | XS 1, S 2, M 4, L 5, XL 8 |
| Sprint : dates, statut, lot | page `sprints/sprint-N.html` : « Dates du … au … », Statut, tableau « Stories engagées » (et les `RES-xx` cités dans cette section) | |
| Campagne : verdict, scénarios | méta `verdict` de `40-qa/campagne-sprint-N.html` ; « Résultats par scénario » (dernier passage vert) | verdict : `<b>Verdict : …</b>` |
| PV : statut, verdict, date, stories acceptées, réserves | méta `verdict` et Statut de `50-recette/pv-sprint-N.html` ; « Date de recette » ; tableaux « Résultats » et « Réserves » | verdict : `<b>Verdict : …</b>` |
| Tickets et anomalies | front matter de `.team/board/T-*.md` et `BUG-*.md` : `statut`, `sprint`, `tours_revue`, `severite`, `instance`, `titre` | |
| Questions | `.team/questions/Q-*.md` : `statut`, `lie_a`, `bloquant`, sections Question et Hypothèse | `questions.html` |
| État d'un livrable de phase | méta `statut`, sinon le tag après « Statut » dans son en-tête | |
| Version de la roadmap, du contrat | « Version » de la roadmap ; `info.version` de `openapi.yaml` | |
| Points ouverts d'impact fort | lignes `impact fort` de `30-conception/detaillee/points-ouverts.html` | |
| ADR avec écart au socle | `meta statut="propose"` et `ecart_socle="oui"` des pages `adr/` | |
| Évolutions du process | partie « Évolutions proposées pour le plugin » de la Rétro des pages de sprint (`h3` `id="evolutions-proposees"`), lignes `Sn-Em` dont la décision n'est ni acceptée ni refusée | une page de sprint au format antérieur, sans `Sn-Em` : tableau « Évolutions proposées » |
| Événements | `.team/journal.md` | |
| Analyses de chantier | pages de `docs/10-analyse/` à `meta type="analyse"` : méta `auteur` (`ia` ou un nom), `statut` (`brouillon`, `en-revue`, `valide`), `chantier` (`en-cours`, `termine`, `restitue-partiel`), `pour` (`P1`, `P2`, `P3` ou une release : la colonne qu'il prépare) ; `h1`, `lede`, « Date » de l'en-tête ; callout `decision` de la section Recommandation ; `Q-xxx` de la section Questions et hypothèses ; callouts `hypothese` ; première colonne de la section Impacts sur les autres livrables | statut et chantier : tag après « Statut » et « Chantier » dans l'en-tête ; auteur : champ « Auteur » (avertissement) ; `pour` absente : P1 (avertissement) |

## Règles de calcul : page de pilotage

**Bandeau.** Phase en cours : le sprint en cours s'il y en a un (le dernier sprint sans PV signé ni
statut `clos`), avec son étape (Développement tant qu'un ticket n'est pas `fait` et qu'il n'y a pas
de campagne, Recettage pendant la campagne, Livraison ensuite), le jour ouvré sur le total ouvré du
sprint ; sinon la phase P0 à P3 déduite des gates franchis, ou « Sprint N à planifier » après G2.
Release en cours : celle des stories du sprint en cours, sinon la première release non recettée une
fois G2 franchi, sinon « aucune ». Prochain gate : en sprint, le G3 à la date de fin du sprint («
Dans N jours », jour de la semaine), les stories du lot et les réserves reprises, « clôt » ou « ne
clôt pas » la release quand le lot épuise ses stories restantes, puis la liste avant le gate :
tickets (faits ou en cours), campagne (à venir, en cours, verdict), pré-recette PO (en cours dès un
verdict favorable sans PV, faite quand le PV existe), PV (à préparer, à signer, signé) ; le premier
point non fait est l'étape courante. Hors sprint, le gate de la phase et l'état de ses livrables.

**Overview.** Colonnes P0 à P3, puis une par release dans l'ordre de la story map, une seule «
Release » tant qu'aucune n'est nommée. Gates en `data-gate="Gn|verdict|date"` avec `data-gate-name`.
G3 d'une release franchi quand toutes ses stories sont acceptées dans un PV signé, à la date du
dernier de ces PV. `data-current` sur la colonne en cours (phase, ou release du sprint en cours).
Une carte « Analyses de chantier » dans chaque colonne, phase ou release, qu'au moins un chantier
prépare (méta `pour`), toujours en dernier dans sa colonne (P1 : après la story map ; P2, P3 : après
le dernier livrable ; release : après Livraison) ; toutes mènent au haut de `10-analyse/index.html`.
En `small`, le compte de la colonne : « N chantiers, M en cours » (« aucun en cours » à zéro).
`done` quand le gate de la colonne est franchi (G1 pour P1 et P2, G2 pour P3, G3 pour une release)
et qu'aucun de ses chantiers n'est en cours ; sinon `doing` tant qu'un chantier est en cours ou une
analyse en `brouillon`, `made` ensuite. Une colonne sans chantier n'a pas de carte ; sans aucune
analyse, la page existe à l'état vide. Carte d'un livrable : `done` si le gate de sa phase est
franchi, sinon `doing` (brouillon) ou `made` (en revue ou au-delà), sans lien ni classe tant que le
fichier n'existe pas. Dans une release : Développement, Recettage, Livraison, une pastille par
sprint commencé qui touche la release, en lien vers sa page, sa campagne ou son PV (pastille sans
lien tant qu'ils n'existent pas). Aucune colonne de date prévue.

**Gates.** Une ligne par gate : G0, G1, G2 (date, Validé, trace), G3 de chaque sprint commencé
(PV signé ou refusé : date, verdict, réserves ; sinon « Fin du sprint le … », À venir), puis le G3
de la release en cours (« Quand les N stories sont acceptées dans un PV signé (K à ce jour) ») et
celui des releases recettées.

**Hotspot.** Sept types, dans cet ordre de criticité, puis de l'attente la plus ancienne à la plus
récente :

| Type | Ligne présente quand | « Depuis » |
|---|---|---|
| Boucle de revue bloquée | ticket à `tours_revue` 4 ou plus, pas `fait` : `tours_revue` compte toutes les revues (`team/conventions/ticket.md`), donc trois tours de correction sans convergence | dernière mention du ticket au journal |
| Gate à présenter | PV du sprint en cours ni signé ni refusé ; ou, pour G0 à G2, tous ses livrables « en revue » | date du PV, ou date la plus récente des livrables |
| Question remontée | question au statut `remontee` | dernière mention au journal |
| ADR avec écart au socle | ADR `propose` avec `ecart_socle` à `oui` | méta `date` |
| Point ouvert | au moins un point d'impact fort ; une ligne, avec les objets touchés | G2, sinon date de la page |
| Réserve ouverte | réserve d'un PV signé dont l'élément lié (`BUG-xxx` ou `T-xxx`) n'est pas `fait` ; gravité de l'anomalie | date du PV |
| Évolution du process | ligne `Sn-Em` des évolutions proposées pour le plugin sans décision prise ; la ligne cite `Sn-Em`, en lien vers sa page de sprint, et le fichier visé | fin du sprint |

Sous la liste, les types vides et le compte des questions ; sans hotspot, l'encadré « Aucun
hotspot ».

**Indicateurs.** Stories livrées sur toutes les releases, puis sur la release en cours (livrées,
dans le sprint en cours, à venir) ; tickets `T-xxx` du sprint en cours par statut (`backlog` compté
en Prêt) ; anomalies `BUG-xxx` pas `fait`, une case par gravité, une ligne par anomalie.

**Derniers événements.** Les 50 dernières lignes du journal, la plus récente en haut, sans
`dispatch` ni `rapport` (les lignes `incident` et `reprise` d'une interruption externe y restent) ; le type en étiquette, les identifiants en liens, le code entre accents
graves en `<code>`. La page en montre cinq, le bouton cinq de plus (`data-more`).

## Règles de calcul : backlog

**Statut d'une story**, une seule échelle : À rédiger (pas de page), Rédigée (`brouillon`), Prête
(`prete`), Validée (`validee`), En sprint N (engagée dans le sprint en cours d'après sa page),
Livrée (acceptée dans un PV signé, avec ou sans réserve). Le PV et la page de sprint priment sur la
méta. Abandonnée (`abandonnee`) : en fin d'epic, barrée, hors des comptes. Les **spikes**
(`meta type="spike"`) n'apparaissent pas.

**Précisions** (colonne sans titre) : PV et réserves `RES-xx` de la story pour une livrée ; sprint
pour une story en sprint ; pour une validée, « au G1 du … » (`valide_par` `humain`), « par l'humain
le … » (remontée après G1), « par le PO le …, montrée au G3 du sprint N » (`po`) ; les questions non
répondues liées à la story (`lie_a`, ou lien `qmark` dans sa page) ; un « ! » par écart.

**Synthèse.** Une carte pour toutes les releases, puis une par release : livrées sur le total, jauge
par statut, tailles, part front moyenne pondérée par la taille (poids `data-h` de la roadmap).

**Écarts entre sources** : taille ou part front de la story différente de l'estimation macro de la
roadmap ; release de la roadmap ou de la story différente de la story map ; story absente de la
correspondance avec les epics, ou epic différent dans la story ou la roadmap ; statut de la page
contredit par un PV signé ou par la page de sprint (`faite` sans PV, `en-sprint` hors sprint en
cours) ; story de la roadmap absente de la story map. Ancre stable `ecart-<US-xxx>-<champ>`.

## Règles de calcul : analyses de chantier

**Pages inventoriées** : toute page de `docs/10-analyse/` dont `meta type` vaut `analyse`, donc ni
`big-picture.html` ni l'index. Une autre page de ce dossier sans `meta type` est signalée en
avertissement et reste hors de l'inventaire.

**Colonnes.** Chantier : titre (`h1`), lien vers la page, et la question (`lede`). Auteur : « IA »
pour `auteur="ia"`, sinon le nom, puis la date de l'en-tête. Avancement : `en cours` (`tag info`),
`restitué partiel` (`tag danger`), `terminé` (`tag ok`). Statut : `brouillon` (`tag warn`),
`en revue` (`tag info`), `validé` (`tag ok`). Pour : la colonne de l'Overview que le chantier
prépare, avec son libellé d'en-tête (`P1`, `P2`, `P3`, `MVP`, `R2`…) ; colonne placée après Statut,
pour garder ensemble les trois valeurs courtes d'état et de cible avant les colonnes de texte.
Recommandation : le contenu du callout `decision`, sans son titre, liens conservés ; vide ou
`todo` : « Pas encore de recommandation : une passe reste à faire. » pour un chantier en cours,
« Pas de recommandation. » sinon. Reste ouvert : les `Q-xxx` de la section Questions et hypothèses
dont le statut n'est pas `repondue` (une question inconnue compte ouverte), en `qmark` vers
`questions.html`, puis le nombre de callouts `hypothese` ; rien : « Rien ». Livrables impactés : la
première colonne de la section Impacts, un par ligne, lien repris tel quel, ou nom connu d'un
livrable de phase mis en lien ; section absente ou vide : « Pas encore identifiés ». Les lignes et
callouts encore en `todo` du gabarit ne comptent pas, un chapeau en `todo` laisse la question vide.
Une release citée dans le texte (chapeau, colonne Pour) s'écrit `<span data-release>R2</span>`, pour
que `check-livrable` ne la lise pas comme une règle de story.

**Tri** : en cours, puis restitué partiel, puis terminé ; à égalité, date la plus récente d'abord,
puis titre. **Filtres et tris**, par les mécanismes de `doc.js` du backlog : puces `data-facets`
dans l'ordre des colonnes (Auteur IA ou personne, Avancement, Statut, Pour : P1 à P3 puis les
releases ; une valeur absente reste grisée ; unité masculine `data-facet-genre="m"`, d'où « Aucun
chantier pour ce filtre ») et tableau `data-sortable` : Chantier par titre et Auteur par date
(`data-sort-value`), Avancement, Statut et Pour par leur échelle (`data-sort-order`), Reste ouvert
par nombre de questions puis d'hypothèses (`data-sort-value` « 002-001 »), sur grand écran seulement
(en-têtes masqués sur mobile, comme le backlog) ; clé `aria` de la facette Pour (« Filtrer par
cible, phase ou release ») pour le lecteur d'écran ; Recommandation et Livrables impactés en
`data-sort="none"`. Un seul tableau, quelle que soit la cible. **Chapeau** : nombre de chantiers,
compte par cible (dans l'ordre des colonnes, « pour la release R3 » pour une release, P1 « ouverts
depuis la big picture »), compte par avancement (terminés, restitués partiels, en cours), questions
ouvertes distinctes et nombre de chantiers qui les portent. **État vide** : « Aucun chantier
d'analyse : la big picture n'est pas encore découpée en chantiers ».

## Contrôles

Le script sort en erreur (code 1) sur : méta `statut`, `taille`, `front`, `valide_par` ou
`valide_le` invalide dans une story ; méta `statut` ou `chantier` d'une analyse hors de ses
valeurs ; méta `pour` qui n'est ni `P1`, `P2`, `P3` ni une release de la story map ou de la roadmap
(la carte n'aurait pas de colonne : on corrige la méta ou la release plutôt que de perdre le
chantier) ; `verdict` de campagne ou de PV hors de ses valeurs ; `statut` de ticket inconnu ;
gabarit sans bloc `gen` ; page à régénérer (`--check`). Il avertit sur : story map absente, sprint
sans dates, story `validee` sans `valide_par`, analyse sans méta `statut`, `chantier`, `auteur` ou
`pour`, page de `docs/10-analyse/` sans `meta type`, tag Statut ou Chantier ou champ Pour de
l'en-tête qui contredit la méta, méta `auteur` qui ressemble à une instance d'agent
(`dev-frontend-1` : écrire `ia`). En erreur, il n'écrit rien. Il est idempotent.
