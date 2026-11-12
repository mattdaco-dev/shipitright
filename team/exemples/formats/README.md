# Exemples de formats

Les exemples remplis qui ont servi à figer, avec l'humain, le format de chaque livrable. Contenu tiré
du projet pilote « Réservation de salles », rédigé par le PO pour juger le rendu : ce ne sont pas les
livrables du projet, qui restent à produire par la team.

Ouvrir `docs/index.html` dans un navigateur : c'est la page de pilotage, comme dans un projet, et elle mène
aux autres exemples (les epics par le backlog, l'analyse de chantier par l'inventaire des analyses). Un agent qui produit un livrable peut s'en inspirer pour le
rendu et le niveau de détail ; le gabarit du skill reste le point de départ.

Les commandes citées ici se lancent depuis la racine du dépôt ShipItRight. Le dossier `socles/` de
l'exemple garde l'ancienne place des socles, à côté de `docs/` ; dans un projet, un socle créé pour lui
va dans `.team/socles/` (`team/conventions/socle.md`).

| Livrable | Exemple |
|---|---|
| Cadrage | `docs/00-cadrage/cadrage.html` (validé G0) |
| Big picture | `docs/10-analyse/big-picture.html` |
| Analyse de chantier | `docs/10-analyse/modification-reservation.html` (brouillon, chantier terminé, auteur « IA », pour P1) : balises meta `type`, `auteur`, `statut`, `chantier`, `pour` alignées sur l'en-tête ; livrables de la table Impacts en liens, repris par l'inventaire |
| Analyses de chantier (inventaire) | `docs/10-analyse/index.html`, page à générer par `team/scripts/pilotage-pages.mjs` depuis les pages d'analyse, remplie à la main pour juger le format : synthèse en chapeau (chantiers comptés par cible et par avancement, questions ouvertes, lien vers la big picture), une ligne par chantier (Chantier et sa question, Auteur « IA » ou nom de la personne, Avancement, Statut, Pour, Recommandation, Reste ouvert, Livrables impactés), filtres Auteur (IA ou personne), Avancement, Statut et Pour, tri par colonne. Le chantier « Cycle de vie d'une salle » est mené par une personne fictive, Camille Martin, qui porte aussi `Q-003` et `Q-004`. Trois chantiers sur quatre sont fictifs, leurs pages ne sont pas produites (avertissements voulus) ; carte « Analyses de chantier » dans chaque colonne de l'Overview de la page de pilotage qui a au moins un chantier, selon la meta `pour` |
| Story map | `docs/20-specs/story-map.html` |
| Conception fonctionnelle | `docs/20-specs/conception-fonctionnelle.html` |
| Epic | `docs/20-specs/epics/EPIC-02-recherche-et-reservation.html` |
| Story | `docs/20-specs/stories/US-006-reserver-une-serie.html` (captures `US-006_*.jpg` prises sur `prototype/` à 1440 × 900) |
| Roadmap | `docs/roadmap.html` (calendrier calculé par `_assets/plan.js`) |
| Conception technique macro | `docs/30-conception/macro.html` (identifiants et icônes de schéma liés à la détaillée par `detaillee/xref.js`) |
| Conception technique détaillée | `docs/30-conception/detaillee/index.html`, format figé (gabarits et règles : skill `livrable-conception-detaillee`). Sommaire en plan du site, endpoints et matrice CRUD ; contrat d'API `api/openapi.yaml` (racine, `paths/*.yaml`, `components/**/*.yaml`, `x-module` sur chaque opération, lint `npx @redocly/cli@2.58.2 lint openapi.yaml` dans `api/`) ; contrat de conformité en page transverse `detaillee/transverse/conformite.html` ; pages des endpoints, des schémas (`detaillee/schemas/`), vue Swagger UI (`detaillee/swagger.html`) et `detaillee/xref.js` générés par `node team/scripts/detaillee-pages.mjs team/exemples/formats/docs/30-conception`, qui remplit aussi les blocs calculés des pages écrites à la main et les notes techniques de la story (`--check` : vérification, lancée par `check-livrable.mjs` sur `docs/`) |
| Stratégie de test | `docs/40-qa/strategie.html` (en revue) : renvoie à la page transverse `detaillee/transverse/tests.html` pour l'outillage et les cas imposés des devs, sans les recopier ; matrice de couverture complète sur `US-006`, lignes de forme pour `US-001`, `US-005`, `US-008`, `US-017` (stories pas encore rédigées) |
| Campagne de test | `docs/40-qa/campagne-sprint-2.html` (en revue) : sprint fictif `US-005`, `US-006`, `US-008` ; applique la stratégie sans la recopier ; montre une majeure corrigée et rejouée après redéploiement (`BUG-001`), une mineure ouverte admise (`BUG-002`), donc un verdict favorable avec réserves (méta `verdict` `favorable-avec-reserves`) ; tickets, anomalies et stories non rédigées en cibles pas encore produites |
| Sprint | `docs/sprints/sprint-2.html` (en revue) : même sprint fictif que la campagne, clos ; plan taillé dans la conception détaillée (`TR-02` partagé en un ticket, fronts sur mock sans dépendance vers le back, deux tickets `e2e`), avancement avec les anomalies, review par la DoD du sprint sans recopier campagne ni PV, fichiers partagés par vague avec leur décision, rétro en un panel (problèmes `S2-P1`… sourcés, actions `S2-A1`… avec nature et critère de fait, une évolution proposée pour le plugin `S2-E1` sur `PROCESS.md` en texte avant / après), review, métriques et risques qui renvoient aux identifiants, suivi des actions `S1-A1`… du sprint 1, métriques et calibrage de la roadmap ; tickets, journal, forum et sprint 1 en cibles pas encore produites |
| PV de recette | `docs/50-recette/pv-sprint-2.html` (en revue) : même sprint fictif, signé le 12.11.2026, accepté avec réserves (méta `verdict` `accepte-avec-reserves`) au commit recetté `9b07d3e` ; chemin de recette par parcours, données des jeux `US-xxx/Dn` décalées à des dates futures ; la mineure ouverte `BUG-002` devient la réserve `RES-01` (pas de ligne dans les anomalies acceptées, réservées aux majeures) ; un besoin nouveau va au backlog, pas en réserve |
| Page de pilotage | `docs/index.html`, comme dans un projet, où elle est générée et remplace le portail ; remplie à la main pour figer le format, générée dans un projet par `team/scripts/pilotage-pages.mjs` (skill `livrable-pilotage`). Instant du jour 2 du sprint 3, après le G3 du sprint 2 accepté avec réserves : bandeau en tuiles (phase, release, prochain gate et sa checklist, board Notion), Overview (grille de la roadmap réduite à sa ligne Livrables, livrables symboliques Développement, Recettage, Livraison par release, tableau des gates), Hotspot avec une ligne de chacun des sept types et son filtre, indicateurs, derniers événements du journal |
| Backlog | `docs/20-specs/backlog.html`, même génération : synthèse par release, stories groupées par epic avec release, taille et part front lues dans la story, statut, filtres release et statut, écarts entre sources |
| Questions | `docs/questions.html`, généré depuis `.team/questions/` (`node team/scripts/questions-page.mjs team/exemples/formats`) |

Le générateur sort 0 erreur et 4 avertissements voulus sur l'exemple : `EC-08` et `EC-09` sont cités par le contrat d'API mais pas encore spécifiés dans la spec UX/UI (écrans des releases R2 et R3) ; `Reservation` et `ReservationDemande` sont échangés par des opérations figées et par la provisoire `EP-19`, ce qui montre la règle des schémas partagés.

Les assets (`docs/_assets/`) sont une copie de `team/assets/` : la recopier si elle évolue.
