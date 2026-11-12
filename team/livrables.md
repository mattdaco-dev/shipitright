# Catalogue des livrables

Chaque livrable a un skill du plugin (`skills/livrable-<type>/`, nommé `shipitright:livrable-<type>`)
qui porte son gabarit, la liste de
ce qui est obligatoire, recommandé ou facultatif, et ses règles de qualité. Ce tableau donne la vue
d'ensemble : qui produit quoi, quand, où. Les chemins `team/…` et `skills/…` partent de la racine du
plugin, notée `<racine du plugin>` (la fiche d'agent ou le skill qui renvoie ici en donne le chemin
réel, voir `team/glossaire.md`) ; les chemins `docs/…` et `.team/…` partent de la racine du projet.

Les livrables documentaires, epics et stories compris, sont des **pages HTML statiques** qui s'appuient
sur `docs/_assets/doc.css` et `docs/_assets/doc.js` ; la roadmap charge en plus `docs/_assets/plan.js`, qui
calcule son calendrier. Restent en Markdown ou YAML les fichiers de travail
internes à la team (tickets, forum, questions) et le contrat d'API. Les ADR sont des pages HTML,
une par décision ; leur registre `docs/adr/index.html` est généré par `team/scripts/adr-pages.mjs`. Les questions ont en plus une
page de lecture, `docs/questions.html`, générée par `team/scripts/questions-page.mjs`. La page de
pilotage (`docs/index.html`), la page backlog (`docs/20-specs/backlog.html`) et l'inventaire des
analyses (`docs/10-analyse/index.html`) sont générés par
`team/scripts/pilotage-pages.mjs` depuis les fichiers du projet ; `check-livrable.mjs` lance son
`--check`. Le contrat d'API
a les siennes : les pages des endpoints et des schémas de la conception détaillée, la vue des points
ouverts et la vue Swagger UI, générées par `team/scripts/detaillee-pages.mjs` (sa dépendance `yaml` s'installe avec le plugin).

| Livrable | Skill | Phase | Auteur | Contributeurs | Fichier (depuis la racine du projet) | Gate |
|---|---|---|---|---|---|---|
| Cadrage et vision | `shipitright:livrable-cadrage` | P0 | PO | humain | `docs/00-cadrage/cadrage.html` | G0 |
| Socles du projet | `team/conventions/socle.md` | P0 | PO | humain | `.team/socle.md` ; manifeste d'une source de l'humain dans `.team/socles/<type>/<nom>/` | G0 |
| Big picture | `shipitright:livrable-big-picture` | P1 | BA | PO, UX, Architecte | `docs/10-analyse/big-picture.html` | G1 |
| Analyse d'un chantier | `shipitright:livrable-analyse` | P1 ; après G1, chantier ouvert par le PO pour une phase ou une release suivante | BA (un par chantier), affiché « IA », ou la personne qui l'a fait | Architecte (faisabilité) | `docs/10-analyse/<chantier>.html` ; meta `type`, `auteur`, `statut`, `chantier`, `pour` (cible : phase ou release préparée) | G1 ; après G1, stories issues validées par le PO et montrées au G3 suivant |
| Story map | `shipitright:livrable-story-map` | P1 → P2 | BA | PO, UX | `docs/20-specs/story-map.html` | G1 |
| Roadmap | `shipitright:livrable-roadmap` | P2, mise à jour à chaque sprint | PO | SM, Architecte | `docs/roadmap.html` | G1 |
| Conception fonctionnelle | `shipitright:livrable-conception-fonctionnelle` | P2 | BA | PO | `docs/20-specs/conception-fonctionnelle.html` | G1 |
| Spécifications UX/UI | `shipitright:livrable-spec-ux-ui` | P2 | UX | BA | `docs/20-ux/spec-ux-ui.html` | G1 |
| Prototype | `shipitright:livrable-prototype` | P2 | UX | Dev frontend | `prototype/` | G1 |
| Socle de design system (s'il faut le créer) | `team/conventions/socle.md` | P2 | UX | Dev frontend | `.team/socles/design-systems/<nom>/` | G1 |
| Epics et user stories | `shipitright:livrable-epic-us` | P2 | BA | PO, QA (critères), Architecte (notes techniques) | `docs/20-specs/epics/EPIC-xx-<slug>.html`, `docs/20-specs/stories/US-xxx-<slug>.html` | G1 |
| Conception technique macro | `shipitright:livrable-conception-macro` | P3 | Architecte | Devs (relecture) | `docs/30-conception/macro.html` | G2 |
| Conception technique détaillée | `shipitright:livrable-conception-detaillee` | P3 pour toute l'application, tenue à jour à chaque sprint planning | Architecte | Devs | `docs/30-conception/detaillee/index.html` (sommaire : plan du site, endpoints, matrice CRUD ; pages par endpoint et par schéma générées par `team/scripts/detaillee-pages.mjs`, par entité et par traitement à la main ; six pages transverses dans `detaillee/transverse/` ; vue des points ouverts et vue Swagger UI générées) | G2 |
| Contrat de conformité | `shipitright:livrable-conception-detaillee` | P3 | Architecte | Devs | `docs/30-conception/detaillee/transverse/conformite.html` (invariants `CF-xx`, ceux des socles repris par référence) | G2 |
| Socle de stack (s'il faut le créer) | `team/conventions/socle.md` | P3 | Architecte | Devs | `.team/socles/stacks/<nom>/` | G2 |
| Contrat d'API | `shipitright:livrable-conception-detaillee` | P3, version et journal des changements à chaque sprint planning qui fige ou ajoute | Architecte | Devs | `docs/30-conception/api/openapi.yaml` (racine), `api/paths/`, `api/components/` ; `x-module` sur chaque opération | G2 |
| Décisions d'architecture | `shipitright:livrable-adr` | P3 et au fil de l'eau | Architecte | tous | `docs/adr/NNNN-<slug>.html`, une page par décision ; registre `docs/adr/index.html` généré par `team/scripts/adr-pages.mjs` | G2 |
| Stratégie de test | `shipitright:livrable-qa` | P3 | QA | Devs | `docs/40-qa/strategie.html` | G2 |
| Campagne de test | `shipitright:livrable-qa` | chaque sprint | QA | Devs | `docs/40-qa/campagne-sprint-N.html` ; preuves des vérifications manuelles dans `docs/40-qa/preuves/sprint-N/` | G3 |
| Sprint (plan, review, rétro) | `shipitright:livrable-sprint` | chaque sprint | SM | tous | `docs/sprints/sprint-N.html` | G3 |
| PV de recette | `shipitright:livrable-pv-recette` | fin de sprint | PO | humain, QA | `docs/50-recette/pv-sprint-N.html` | G3 |
| Page de pilotage | `shipitright:livrable-pilotage` | générée dès la création, régénérée à chaque synchro de vague, gate et merge dans `sprint/N` | PO (lance le script) | | `docs/index.html`, générée par `team/scripts/pilotage-pages.mjs` (remplace le portail) | |
| Backlog | `shipitright:livrable-pilotage` | généré avec la page de pilotage | PO (lance le script) | | `docs/20-specs/backlog.html`, généré par `team/scripts/pilotage-pages.mjs` ; epics et stories (taille, part front, statut, release), spikes exclus | |
| Analyses de chantier (inventaire) | `shipitright:livrable-pilotage` | généré avec la page de pilotage | PO (lance le script) | | `docs/10-analyse/index.html`, généré par `team/scripts/pilotage-pages.mjs` depuis les pages d'analyse (big picture exceptée) : chantier et sa question, auteur, avancement, statut, cible (Pour), recommandation, ce qui reste ouvert, livrables impactés, avec filtres (Auteur IA ou personne, Avancement, Statut, Pour) et tri par colonne ; ouvert depuis la carte « Analyses de chantier » que la page de pilotage montre dans chaque colonne de l'Overview qui a au moins un chantier | |

Identifiants, sigles et vocabulaire de la team : `team/glossaire.md`.

Des **exemples remplis**, validés avec l'humain, montrent le rendu attendu de chaque format :
`team/exemples/formats/docs/index.html` (la page de pilotage de l'exemple, qui mène aux autres).

## Niveaux d'exigence

Dans chaque gabarit, chaque section porte un niveau :

- **obligatoire** : le livrable ne passe pas son gate sans elle. `check-livrable.mjs` bloque si elle
  contient encore un emplacement `.todo`.
- **recommandé** : attendu dans le cas général. L'omettre se justifie en une ligne dans la section
  (« sans objet : aucun système externe »), on ne la supprime pas en silence.
- **facultatif** : utile quand le projet le justifie. Se supprime sans justification.

## Vérifier un livrable

```sh
node <racine du plugin>/team/scripts/check-livrable.mjs docs     # depuis la racine du projet
```

Sur un dossier `docs/` qui contient le contrat d'API, le script lance aussi
`detaillee-pages.mjs --check` : une page générée pas à jour ou une référence cassée donne un KO. Il
lance aussi `adr-pages.mjs --check` et `pilotage-pages.mjs --check` : un registre des ADR ou une page de
pilotage, backlog ou inventaire des analyses qui n'est plus à jour donne un KO. Le
contrat d'API se vérifie en plus avec le lint Redocly, depuis la racine du projet :
`npx @redocly/cli@2.58.2 lint docs/30-conception/api/openapi.yaml` (critère : aucune erreur). Lancé de là, il ne lit pas
`.redocly.lint-ignore.yaml` : les avertissements que ce fichier ignore réapparaissent, sans compter.

Dans le navigateur, une bannière en haut de chaque page liste les sections obligatoires encore à
compléter. Ajouter `?levels` à l'URL affiche le niveau de chaque section.

## Règles communes à tous les livrables

- **Partir du gabarit**, jamais d'une page blanche : `<racine du plugin>/skills/livrable-<type>/template.html`,
  lu avec Read puis écrit avec Write à sa place dans le projet (le skill du livrable donne le chemin).
- **Ne pas toucher à `doc.css` ni `doc.js`** depuis un livrable. Un composant manque : on l'ajoute dans
  `team/assets/` du dépôt ShipItRight, puis on recopie dans les projets.
- **En-tête renseigné** : projet, version, date, auteur (rôle ; pour une analyse, « IA » ou le nom de
  la personne), statut (`brouillon`, `en revue`, `validé`), sources. Certains formats ont leurs propres
  statuts, détaillés dans leur skill : analyse (avancement du chantier `en cours`, `terminé`,
  `restitué partiel`, en plus du statut de la page), campagne
  (`en cours`, `terminée`), sprint (`planifié`, `en cours`, `clos`), PV de recette (`préparé`, `signé`, `refusé`).
  La campagne et le PV portent en plus leur verdict en balise `<meta name="verdict">` (glossaire),
  que lit la page de pilotage.
- **Une hypothèse se voit** : bloc `callout hypothese` ; dans la conception détaillée, colonne
  hypothèse d'un point ouvert. Une question ouverte aussi : badge
  `<a class="qmark" href="../questions.html#Q-xxx">Q-xxx</a>` à l'endroit concerné, jamais un `[?]`
  nu. Toute question ouverte a donc son fichier dans `.team/questions/` ; celui qui la crée ou y répond
  régénère la page : `node <racine du plugin>/team/scripts/questions-page.mjs .`.
- **Pas de donnée réelle** : personnes, clients, montants sont fictifs.
- **Les identifiants sont stables et toute référence est un lien.** Un livrable cite les autres par
  leurs identifiants ; chaque citation pointe vers l'endroit où l'élément est défini, et cet élément
  porte une ancre égale à son identifiant. Une référence vers un livrable qui n'existe pas encore est
  un lien vers sa cible prévue. Préfixes, livrable qui définit chaque identifiant et table des cibles
  de liens : `team/glossaire.md`. `check-livrable.mjs` signale les liens cassés (ancre absente d'un livrable
  existant : KO ; fichier pas encore produit : avertissement) et les préfixes absents du glossaire
  (avertissement).
- **Le livrable est relu avant son gate** par un Relecteur frais, qui vérifie la complétude et la
  cohérence avec les autres livrables.
