# Glossaire du framework

Source unique des identifiants, des sigles et du vocabulaire de la team. Les autres fichiers
(`regles-team`, `team/livrables.md`, skills, conventions) y renvoient et ne recopient pas ces listes.
Un nouveau préfixe, un nouveau sigle ou un terme à sens précis s'ajoute ici d'abord.

Ce glossaire décrit le framework. Le glossaire métier d'un projet (termes du domaine) vit dans son
cadrage, section Glossaire.

**Chemins et noms.** Dans les documents du framework lus avec Read (`PROCESS.md`, `team/…`), un
chemin `team/…`, `skills/…` ou `agents/…` part de la racine du plugin, notée `<racine du plugin>` :
une fiche d'agent ou un skill en donne le chemin réel (la variable de racine du plugin n'est
substituée que dans les fiches et les skills, pas dans un document lu avec Read). Un script se lance donc
`node <racine du plugin>/team/scripts/<script>.mjs .`, depuis la racine du projet. Un chemin
`.team/…`, `docs/…` ou `prototype/…` part de la racine du projet. Un skill ou un agent du plugin
s'invoque par son nom préfixé, `shipitright:<nom>` ; dans les colonnes Source de ce glossaire,
`livrable-<type>` désigne le skill `shipitright:livrable-<type>`.

## 1. Identifiants

Un identifiant est stable : il ne change pas quand le livrable évolue, il n'est jamais réattribué. Un
livrable cite les autres par ces identifiants, et chaque citation est un lien vers l'endroit où
l'élément est défini. Cet élément porte une ancre égale à son identifiant (`<tr id="RG-04">`,
`<div class="card" id="PER-01">`), sauf quand il a sa propre page.

Les cibles sont écrites depuis un dossier de premier niveau de `docs/` (`docs/10-analyse/`,
`docs/20-specs/`…). Depuis un sous-dossier (`docs/20-specs/stories/`), ajouter un `../` par niveau de sous-dossier. Une
référence vers un livrable qui n'existe pas encore est un lien vers sa cible prévue ; `check-livrable.mjs`
la signale en avertissement (cible pas encore produite).

| Préfixe | Désigne | Défini dans | Cible de lien depuis `docs/<dossier>/` | Exemple | À ne pas confondre |
|---|---|---|---|---|---|
| `ADR-xxxx` | décision d'architecture | registre des ADR `docs/adr/index.html` (skill `shipitright:livrable-adr`) | `../adr/NNNN-<slug>.html` ; registre : `../adr/index.html#ADR-xxxx` | `ADR-0002` |  |
| `BUG-xxx` | anomalie | board, ouverte par le QA | `../../.team/board/BUG-xxx-<slug>.md` | `BUG-003` | `T-xxx` (ticket) |
| `CALC-xx` | calcul | conception fonctionnelle | `../20-specs/conception-fonctionnelle.html#CALC-xx` | `CALC-02` | `CF-xx` |
| `CF-xx` | invariant de conformité (`CF-01` à `CF-49` stack, `CF-50` à `CF-59` framework, `CF-60` à `CF-69` projet, `CF-70` à `CF-79` design system) | `conformite.md` du socle ; pour le projet, contrat de conformité de la conception détaillée, qui reprend ceux des socles par référence | `../30-conception/detaillee/transverse/conformite.html#CF-xx` ; invariant de socle repris par référence : `…/conformite.html#socle-de-stack` ou `#design-system` | `CF-12` | `CALC-xx` |
| `EC-xx` | écran du produit | spec UX/UI | `../20-ux/spec-ux-ui.html#EC-xx` ; vue technique par écran : `../30-conception/detaillee/transverse/ecrans.html#EC-xx` | `EC-03` | `EN-xx`, `EP-xx` |
| `EN-xx` | entité | conception technique macro, puis détaillée | `../30-conception/detaillee/entites/EN-xx.html` ; tant que la page n'existe pas : `../30-conception/macro.html#EN-xx` | `EN-02` | `EP-xx`, `EC-xx` |
| `EP-xx` | endpoint | conception technique macro, puis détaillée | `../30-conception/detaillee/endpoints/EP-xx.html` ; tant que la page n'existe pas : `../30-conception/macro.html#EP-xx` | `EP-07` | `EPIC-xx`, `EN-xx` |
| `EPIC-xx` | epic | epics et user stories | `../20-specs/epics/EPIC-xx-<slug>.html` | `EPIC-02` | `EP-xx` |
| `MSG-xx` | message fonctionnel | conception fonctionnelle | `../20-specs/conception-fonctionnelle.html#MSG-xx` | `MSG-05` | `MSG-Uxx` |
| `MSG-Uxx` | message d'interface | spec UX/UI | `../20-ux/spec-ux-ui.html#MSG-Uxx` | `MSG-U06` | `MSG-xx` |
| `PER-xx` | persona | cadrage | `../00-cadrage/cadrage.html#PER-xx` | `PER-01` | `PF-xx` |
| `PF-xx` | parcours fonctionnel | conception fonctionnelle | `../20-specs/conception-fonctionnelle.html#PF-xx` | `PF-02` | `PER-xx` |
| `Q-xxx` | question métier au PO | `.team/questions/Q-xxx-<slug>.md` | `../questions.html#Q-xxx` (page générée par `questions-page.mjs`) | `Q-001` |  |
| `RES-xx` | réserve de recette | PV de recette | `../50-recette/pv-sprint-N.html#RES-xx` | `RES-01` | release `Rn`, `US-xxx/Rn`, `RG-xx` |
| `RG-xx` | règle de gestion | conception fonctionnelle ; avant elle, cadrage | `../20-specs/conception-fonctionnelle.html#RG-xx` ; avant : `../00-cadrage/cadrage.html#RG-xx` | `RG-04` | `US-xxx/Rn`, `RES-xx` |
| `S<n>-A<m>` | action m de la rétro du sprint n, de nature « essai d'un sprint » ou « changement durable » ; cite au moins un `S<n>-P<m>` | page du sprint n, section Rétro, partie Actions | `../sprints/sprint-N.html#S<n>-A<m>` | `S2-A1` (sur `sprints/sprint-2.html#S2-A1`) | `S<n>-P<m>`, `S<n>-E<m>`, `US-xxx/Sn`, sprint N |
| `S<n>-E<m>` | évolution m proposée pour le plugin par la rétro du sprint n : un fichier du plugin, texte avant et après, l'action `S<n>-A<m>` qui la couvre, la décision de l'humain | page du sprint n, section Rétro, partie Évolutions proposées pour le plugin | `../sprints/sprint-N.html#S<n>-E<m>` | `S2-E1` | `S<n>-A<m>` (un changement propre au projet est une action), `EP-xx`, sprint N |
| `S<n>-P<m>` | problème m de la rétro du sprint n : constat, poids, sources, écrits là seulement | page du sprint n, section Rétro, partie Problèmes | `../sprints/sprint-N.html#S<n>-P<m>` | `S2-P1` (sur `sprints/sprint-2.html#S2-P1`) | `S<n>-A<m>`, `US-xxx/Sn`, sprint N, `PER-xx`, `PF-xx` |
| `T-xxx` | ticket | board | `../../.team/board/T-xxx-<slug>.md` | `T-012` | `TR-xx`, `BUG-xxx` |
| `TR-xx` | traitement | conception technique macro, puis détaillée | `../30-conception/detaillee/traitements/TR-xx.html` ; tant que la page n'existe pas : `../30-conception/macro.html#TR-xx` | `TR-01` | `T-xxx` |
| `US-xxx` | story ou spike | epics et user stories | `../20-specs/stories/US-xxx-<slug>.html` | `US-006` |  |
| `US-xxx/Sn` | scénario n d'une story | la story, critères d'acceptation | `../20-specs/stories/US-xxx-<slug>.html#Sn` | `US-006/S4` | sprint N, `S<n>-P<m>`, `S<n>-A<m>`, `S<n>-E<m>` |
| `US-xxx/Rn` | règle fonctionnelle n d'une story ; dans sa story, `Rn` seul | la story, règles fonctionnelles | `../20-specs/stories/US-xxx-<slug>.html#Rn` | `US-006/R2` | `RG-xx`, release `Rn`, `RES-xx` |
| `US-xxx/Dn` | jeu de données d'exemple n d'une story ; dans sa story, `Dn` seul | la story, données d'exemple | `../20-specs/stories/US-xxx-<slug>.html#Dn` | `US-006/D2` |  |

Pour `EP-xx`, `EN-xx` et `TR-xx`, tant que la page détaillée n'existe pas, le lien se replie sur
`../30-conception/macro.html#<ID>`.

L'ancre `#Sn` d'un scénario est créée par `doc.js` au chargement de la story. Dans un texte (ticket,
nom de test, campagne, `BUG-xxx`), on écrit `US-006/S4`.

Une règle fonctionnelle (`Rn`, `<tr id="Rn">`) et un jeu de données d'exemple (`Dn`, `<tr id="Dn">`)
d'une story s'écrivent sans préfixe dans leur story. Hors de leur story, on écrit `US-006/R2` et
`US-006/D2`, en lien vers `…/US-006-<slug>.html#R2` ou `#D2`, comme les scénarios.

**Release et sprint dans un texte.** Une release garde son sigle (`R2`, `R3`, `Rn`, voir les sigles),
mais une phrase écrit toujours « release R2 », jamais `R2` seul ; les étiquettes et attributs
(`data-release="R2"`, `<span class="tag">R2</span>`) gardent le sigle seul. Un sprint s'écrit toujours
« sprint N » (« sprint 2 »), jamais `S2` ni `SN` : `Sn` est réservé au scénario d'une story.
Les identifiants de la rétro, `S2-P1`, `S2-A1`, `S2-E1`, portent le numéro du sprint en préfixe et ne
s'écrivent jamais sans leur suffixe ; ils ne remplacent pas « sprint 2 » dans une phrase. Préfixés du
numéro de la page de sprint qui les définit, ils sont uniques au projet et ancrent leur ligne
(`<tr id="S2-P1">`) ; ailleurs, `S1-A2` est un lien vers `sprint-1.html#S1-A2`.
`check-livrable.mjs` le contrôle, en avertissement : il signale un `Rn`, `Dn` ou `Sn` isolé, sauf une
release précédée de « release » ou « releases », la suite d'une liste qualifiée (« `US-006/S1` à
`S7` »), une étiquette (classe `tag` ou `sm-release`, attribut `data-release` ou `data-rel`, élément
dont le texte entier est le sigle), une citation, et un lien `#Sn` dans sa propre story. Une étiquette
courte qui n'entre dans aucun de ces cas (la légende « Story R2 » de la story map) porte
`class="sigle"` ou `data-sigle` : c'est l'exception explicite.

**Références sans préfixe**, pour la conception détaillée et le contrat d'API :

| Référence | Désigne | Cible de lien depuis `docs/<dossier>/` |
|---|---|---|
| `<Schema>` | schéma échangé par un endpoint | `../30-conception/detaillee/schemas/<Schema>.html` |
| `<Type>` | type partagé entre schémas | `../30-conception/detaillee/schemas/index.html#<Type>` |
| `v<version>` | version du contrat d'API | `../30-conception/detaillee/schemas/index.html#v<version>` |
| `<CODE>` | code d'erreur de l'API | `../30-conception/detaillee/transverse/erreurs.html#<CODE>` |

**Ce qui n'est pas un identifiant.** Ces noms ont la forme d'un identifiant mais désignent un standard
technique. `check-livrable.mjs` les accepte sans les compter comme préfixes : `SHA-256`, `UTF-8`,
`ISO-8601`.

`check-livrable.mjs` lit cette partie : dans le texte d'un livrable, hors code et attributs, un
identifiant fait de deux à cinq majuscules, d'un tiret et de chiffres, dont le préfixe n'y figure pas,
donne un avertissement. Un préfixe se déclare entre accents graves dans la première colonne.

## 2. Sigles

| Sigle | Sens | Détail |
|---|---|---|
| ADR | Architecture Decision Record, décision d'architecture consignée | `livrable-adr`, `docs/adr/` |
| API | interface exposée par le backend, décrite par le contrat d'API | `livrable-conception-detaillee` |
| BA | Business Analyst | `agents/business-analyst.md` |
| CF | invariant de conformité (voir `CF-xx`) | `team/conventions/socle.md` |
| DoD | Definition of Done : ce qui fait qu'un ticket, un livrable ou un sprint est fini | `PROCESS.md` section 7 |
| DoR | Definition of Ready : ce qui fait qu'un ticket peut partir en dev | `PROCESS.md` section 7 |
| DS | design system | `team/conventions/socle.md` |
| e2e | test de bout en bout, piloté par le QA | `livrable-qa` |
| G0 | gate humain de fin de cadrage | `PROCESS.md` section 4 |
| G1 | gate humain de validation des specs, de l'UX et du prototype | `PROCESS.md` section 4 |
| G2 | gate humain de fin de conception technique, préparé par la vérification du SM ; l'humain fait relire la conception par les équipes technique et d'architecture | `PROCESS.md` section 4 |
| G3 | gate humain de recette d'un sprint ; le G3 d'une release est franchi quand toutes ses stories sont acceptées dans un PV signé, avec ou sans réserve | `PROCESS.md` section 4 |
| Gherkin | syntaxe Étant donné, Quand, Alors des critères d'acceptation | `livrable-epic-us` |
| MCP | serveur d'outils branché sur un agent (Notion, context7, Chrome DevTools…) | fiches d'agents |
| MoSCoW | priorité d'une tâche : Must, Should, Could, Won't | `livrable-story-map` |
| MVP | première release, le produit minimal utile | `livrable-story-map` |
| P0 | phase de cadrage, avec l'humain | `PROCESS.md` section 4 |
| P1 | phase d'analyse et d'exploration | `PROCESS.md` section 4 |
| P2 | phase des specs fonctionnelles, de l'UX/UI et du prototype | `PROCESS.md` section 4 |
| P3 | phase de conception technique | `PROCESS.md` section 4 |
| PO | Product Owner, agent principal du plugin, seul contact de l'humain | `agents/po.md` |
| PV | procès-verbal de recette | `livrable-pv-recette` |
| QA | assurance qualité : stratégie de test, e2e, campagnes | `agents/qa.md` |
| R2, R3, Rn | releases suivant le MVP, dans l'ordre de la story map ; dans un texte, « release R2 » (section 1) | `livrable-story-map` |
| SM | Scrum Master | `agents/scrum-master.md` |
| UX/UI | expérience et interface utilisateur ; le rôle UX/UI Designer | `agents/ux-designer.md` |

## 3. Vocabulaire

| Terme | Définition | Détail |
|---|---|---|
| accès CRUD | lettres `C` création, `R` lecture, `U` mise à jour, `D` suppression d'un endpoint ou d'un traitement sur une entité (`x-entities access: CU`, `meta entites EN-05:CRU` ; une lecture de contrôle compte comme `R`, aussi pour l'appelant) | `livrable-conception-detaillee` |
| ADR abandonné | proposition d'ADR non retenue (`meta statut abandonne`) ; son numéro n'est pas réutilisé | `livrable-adr` |
| ADR accepté | décision en vigueur (`meta statut accepte`) ; elle ne se réécrit plus, un nouvel ADR la remplace | `livrable-adr` |
| ADR proposé | décision rédigée, pas encore appliquée (`meta statut propose`) ; statut obligatoire d'un écart au socle (`meta ecart_socle oui`), que le PO remonte à l'humain | `livrable-adr` |
| ADR remplacé | décision acceptée qu'une décision acceptée plus récente remplace (`meta statut remplace`) | `livrable-adr` |
| anomalie | écart entre le comportement et un critère d'acceptation, tracé en `BUG-xxx` | `team/conventions/ticket.md` |
| arbitrage PO | règle de bon sens tranchée par le PO sans l'humain, marquée `Arbitrage PO` dans le livrable et montrée au gate suivant | `agents/po.md` |
| auteur d'une analyse | « IA » (meta `auteur` à `ia`) quand un agent de la team a traité le chantier, sinon le nom de la personne qui l'a fait ; l'instance du BA reste tracée par le journal (lignes `dispatch` et `rapport`) | `livrable-analyse` |
| avancement d'un chantier | où en est le chantier d'une analyse, champ Chantier de l'en-tête et meta `chantier` : `en-cours` (la timebox n'est pas épuisée, une passe reste à faire), `termine`, `restitue-partiel` (timebox épuisée sans réponse complète). Distinct du statut de la page (`brouillon`, `en-revue`, `valide`) : l'avancement dit si le BA a fini, le statut si la page a passé sa revue et son gate | `livrable-analyse` |
| backbone | rangée des activités et tâches utilisateur en tête de la story map | `livrable-story-map` |
| backlog | ensemble des stories du projet, rangées par epic ; sa vue est la page backlog | `livrable-pilotage` |
| big picture | frise façon event storming des événements du domaine, par phase et par flux | `livrable-big-picture` |
| bloc calculé | liste insérée par `detaillee-pages.mjs` entre `<!-- gen:NOM -->` et `<!-- /gen -->` dans une page écrite à la main ; on ne l'édite pas, on relance le script | `livrable-conception-detaillee` |
| board | dossier `.team/board/`, un fichier par ticket ou anomalie, source de vérité des statuts | `team/conventions/ticket.md` |
| brief | consigne autonome qui lance un agent | `team/conventions/brief.md` |
| campagne | exécution des tests d'un sprint par le QA sur « Démo et recette », du commit de `sprint/N` qui contient les tickets `e2e` mergés jusqu'au commit recetté, avec anomalies et verdict | `livrable-qa` |
| chantier | question que le cadrage laisse ouverte, confiée à un BA en P1, ou après G1 par le PO pour préparer une phase ou une release suivante, et rendue en analyse | `livrable-analyse` |
| cible d'une analyse | phase ou release que prépare un chantier, champ Pour de l'en-tête et meta `pour` : `P1` en P1 ; après G1, la phase ou la release visée (`P2`, `P3`, `R2`…). L'inventaire en fait sa colonne Pour ; la page de pilotage montre une carte « Analyses de chantier » dans chaque colonne de l'Overview qui a au moins un chantier | `livrable-analyse` |
| commit recetté | dernier commit de `sprint/N` joué par la campagne, rejeux des corrections compris, noté dans la section Passages de la campagne ; le PV de recette le reprend | `livrable-qa` |
| contrat de conformité | page transverse `transverse/conformite.html` de la conception détaillée : invariants `CF-xx` du framework et du projet, une ligne ancrée par invariant ; ceux des socles repris par référence ; écarts acceptés avec leur ADR | `livrable-conception-detaillee` |
| contrat d'API | tout le `openapi.yaml` du projet, racine et fichiers liés | `livrable-conception-detaillee` |
| couche | frontière où circule un schéma échangé : la frontière HTTP, entre le service d'accès API du front et la route de l'API qui le valide | `livrable-conception-detaillee` |
| critère d'acceptation | scénario Gherkin observable d'une story, numéroté `Sn` | `livrable-epic-us` |
| endpoint | opération HTTP exposée par le backend (`EP-xx`) | `livrable-conception-macro` |
| entité | objet persistant du domaine (`EN-xx`) | `livrable-conception-macro` |
| epic | regroupement de stories qui sert un même objectif (`EPIC-xx`) | `livrable-epic-us` |
| fichier partagé | fichier que plusieurs tickets d'une même vague modifieraient à la main (routes, registre, catalogue, types d'échange) ; la page de sprint le liste par vague avec sa décision : généré par script, découpé, ou un seul ticket porteur | `livrable-sprint` |
| forum | sujets d'échange entre agents dans `.team/forum/`, posts en ajout seulement | `team/conventions/forum.md` |
| gabarit | fichier `template-*` d'un skill de livrable (page HTML, squelette d'API), point de départ obligatoire | `team/livrables.md` |
| gate | point de contrôle entre deux phases, validé par l'humain (G0 à G3) ; rien de non résolu ne le franchit | `PROCESS.md` section 4 |
| hotspot | question, conflit ou risque posé sur la big picture | `livrable-big-picture` |
| Hotspot | section de la page de pilotage : ce qui attend une décision de l'humain, en sept types rangés par criticité décroissante : boucle de revue bloquée, gate à présenter, question remontée, ADR avec écart au socle, point ouvert d'impact fort, réserve ouverte, évolution du process (une évolution `S<n>-E<m>` proposée pour le plugin, sans décision) ; filtrable par type. À ne pas confondre avec le hotspot de la big picture | `livrable-pilotage` |
| HYPOTHÈSE | réponse supposée à une question non bloquante, rendue visible (bloc `callout hypothese`) pour avancer ; dans la conception détaillée, c'est la colonne hypothèse d'un point ouvert, jamais un callout | `team/livrables.md` |
| impact | poids d'un point ouvert sur la conception : fort (modèle de données, opération figée, structure du code), moyen (opération provisoire, traitement, un schéma pas encore figé, écran), faible (libellé, message, valeur par défaut) | `livrable-conception-detaillee` |
| instance | exemplaire d'un rôle lancé pour un travail (`dev-backend-2`) | `PROCESS.md` section 2 |
| inventaire des analyses | page `docs/10-analyse/index.html` générée par `pilotage-pages.mjs` depuis les pages d'analyse (big picture exceptée) : une ligne par chantier, colonnes Chantier (titre et question), Auteur, Avancement, Statut, Pour, Recommandation, Reste ouvert (questions et hypothèses), Livrables impactés ; filtres Auteur (IA ou personne), Avancement, Statut et Pour, tri par colonne ; ouverte depuis la carte « Analyses de chantier » de chaque colonne de l'Overview qui a au moins un chantier ; cible de lien depuis `docs/<dossier>/` : `../10-analyse/index.html` | `livrable-pilotage` |
| journal | `.team/journal.md`, une ligne par événement du projet, tenu par le PO, l'heure lue sur l'horloge au moment d'écrire ; lignes `dispatch` et `rapport` pour chaque agent, `incident` et `reprise` pour une interruption externe (limite d'usage, panne), dont la durée sort des heures d'agents | `PROCESS.md` section 3, `agents/po.md` |
| journal des changements | `info.x-changelog` du contrat d'API, une entrée par version, tenu par l'architecte à chaque sprint planning qui fige ou ajoute | `livrable-conception-detaillee` |
| livrable | document produit par la team, à partir de son skill et de son gabarit | `team/livrables.md` |
| livrable symbolique | carte de l'Overview qui ne désigne pas un fichier mais une étape d'une release : Développement (mène au sprint en cours), Recettage (à la dernière campagne), Livraison (au dernier PV), avec une pastille par sprint commencé | `livrable-pilotage` |
| matrice CRUD | tableau généré du sommaire de la conception détaillée : endpoints et traitements × entités, accès CRUD de chacun | `livrable-conception-detaillee` |
| matrice de couverture | table de la stratégie de test qui relie chaque scénario `US-xxx/Sn` à son test prévu, e2e ou du niveau complémentaire ; complète à G2 | `livrable-qa` |
| mock | faux backend typé, tiré du contrat d'API, contre lequel le front développe une opération figée tant que le ticket back n'est pas livré | `agents/dev-frontend.md` |
| module de code | module du backend où vit un objet, déclaré par l'objet (`x-module` d'une opération, `meta module` d'une entité ou d'un traitement), une ligne de la table des modules | `livrable-conception-detaillee` |
| niveau complémentaire | niveau de test sous l'e2e qui couvre un scénario sans e2e, parmi ceux de la pyramide de la stratégie de test : unitaire domaine, intégration du dépôt, route, composant | `livrable-qa` |
| niveau d'exigence | obligatoire, recommandé ou facultatif, porté par chaque section d'un livrable | `team/livrables.md` |
| notes techniques | section d'une story écrite par l'architecte en P3 : bloc calculé des endpoints, traitements, entités et schémas, et tableau scénario, élément, écran | `livrable-epic-us` |
| opération figée | opération du contrat d'API dont rien n'est retiré ni changé ; seuls des ajouts rétrocompatibles annoncés sont permis | `livrable-conception-detaillee` |
| opération provisoire | opération du contrat d'API qui attend une réponse métier, décrite à un niveau de détail réduit | `livrable-conception-detaillee` |
| opportunité | piste d'amélioration relevée sur la big picture | `livrable-big-picture` |
| Overview | section de tête de la page de pilotage : la grille de la roadmap réduite à sa ligne Livrables (colonnes P0 à P3 puis une par release, livrables symboliques dans les colonnes de release, gates en barres, carte « Analyses de chantier » en dernier dans chaque colonne qui a au moins un chantier, selon la meta `pour`), puis le tableau des gates | `livrable-pilotage` |
| page backlog | page `docs/20-specs/backlog.html` générée par `pilotage-pages.mjs` : synthèse par release, stories groupées par epic avec release, taille, part front, statut, filtres release et statut, écarts entre sources | `livrable-pilotage` |
| page de pilotage | page `docs/index.html` d'un projet, générée par `pilotage-pages.mjs`, qui remplace le portail : bandeau (phase, release, prochain gate, board Notion), Overview, Hotspot, indicateurs, derniers événements ; régénérée par le PO à chaque synchro de vague, gate et merge dans `sprint/N`, avec la page backlog et l'inventaire des analyses, sans ligne de journal propre | `livrable-pilotage` |
| page générée | page de la conception détaillée produite par `detaillee-pages.mjs` (endpoints, schémas échangés, liste des schémas, vue des points ouverts, Swagger UI), marquée en tête ; on ne l'édite pas, on relance le script | `livrable-conception-detaillee` |
| part front | part du travail d'une story côté front, de 0 à 100 % (balise `front` de la story) ; le back en est le complément | `livrable-epic-us` |
| passe de cohérence | relecture croisée des livrables par un Relecteur frais avant G1 et G2 | `PROCESS.md` section 4 |
| passe d'intégration | relecture de l'ensemble mergé du sprint par un Relecteur frais | `PROCESS.md` section 4 |
| persona | profil d'usage du produit, un rôle et jamais une personne (`PER-xx`) | `livrable-cadrage` |
| pivot | événement irréversible qui clôt une phase de la big picture | `livrable-big-picture` |
| placement | section d'une page de schéma : où il circule (sens, émetteur et récepteur, endpoint, message HTTP, statut) | `livrable-conception-detaillee` |
| point ouvert | ce qui reste à trancher dans la conception détaillée, écrit sur l'objet concerné en impact, sujet, hypothèse, question ; rangé par impact décroissant et repris dans la vue générée `detaillee/points-ouverts.html` | `livrable-conception-detaillee` |
| pré-recette | vérification par le PO que le verdict de campagne est favorable, avec ou sans réserves, et que chaque story du sprint a ses critères au vert (sauf scénario rendu rouge par une anomalie admise au verdict), chemin de recette prêt | `livrable-pv-recette` |
| proto-bar | barre de commande identique de tout prototype (états, réinitialisation, réglages) | skill `shipitright:proto-bar` |
| prototype | maquette cliquable en HTML, CSS et JS vanilla, données fictives | `livrable-prototype` |
| question métier | question adressée au PO dans `.team/questions/` (`Q-xxx`), signalée par un badge `qmark` | `team/conventions/forum.md` |
| rapport | compte rendu final d'un agent, seule lecture du PO | `team/conventions/rapport.md` |
| registre des ADR | page `docs/adr/index.html` générée par `adr-pages.mjs` depuis les balises `<meta>` des ADR : une ligne ancrée par ADR, statut, écart au socle, remplacements | `livrable-adr` |
| recette | validation d'un sprint par l'humain au gate G3, consignée dans le PV | `livrable-pv-recette` |
| release | lot livrable de stories (MVP, R2, R3) tracé sur la story map | `livrable-story-map` |
| réserve | défaut accepté à la recette, à corriger dans un ticket suivant (`RES-xx`) | `livrable-pv-recette` |
| réserve levée | réserve dont l'élément lié, l'anomalie `BUG-xxx` ou le ticket `T-xxx` créé pour elle, est passé au statut `fait` au board ; elle sort du Hotspot, le PV signé ne se réécrit pas | `livrable-pv-recette` |
| rétro | section de la page de sprint, un seul panel en quatre parties : À garder, Problèmes `S<n>-P<m>`, Actions `S<n>-A<m>` (nature « essai d'un sprint » ou « changement durable »), Évolutions proposées pour le plugin `S<n>-E<m>` ; consolidée par le SM depuis les sections Rétro des tickets. Pas de section d'actions à part ni de liste « à essayer » : un essai est une action | `livrable-sprint` |
| revue indépendante | revue adverse d'un ticket rendu par un Relecteur frais, trois tours de correction au plus ; une correction de majeurs faite avant le merge est relue sur ces seuls constats, sauf si elle n'ajoute que des tests. `tours_revue` du ticket compte toutes ses revues, revues de fermeture comprises | `PROCESS.md` section 4, `team/conventions/ticket.md` |
| roadmap | releases, dates de recette et calendrier calculé du projet | `livrable-roadmap` |
| sans e2e | marque d'un scénario que la matrice de couverture ne teste pas en e2e, avec sa raison et le test du niveau complémentaire | `livrable-qa` |
| schéma | forme de données échangée par un endpoint, décrite dans le contrat d'API | `livrable-conception-detaillee` |
| schéma échangé | schéma envoyé (corps de requête) ou reçu (réponse, réponse d'erreur) directement par un endpoint ; il a sa page générée | `livrable-conception-detaillee` |
| seed de test | jeu de données posé avant les e2e sans passer par aucun endpoint de story | `livrable-qa` |
| socle | référence de stack ou de design system d'un projet, source de l'utilisateur ou créée dans le projet, déclarée dans `.team/socle.md` et décrite dans `.team/socles/<type>/<nom>/` ; le plugin n'en embarque aucun | `team/conventions/socle.md` |
| spike | story d'investigation, identifiant `US-xxx`, qui produit une réponse et non une fonctionnalité ; il garde son `timebox`, sans `taille` ni `front`, et n'apparaît pas dans la page backlog | `livrable-epic-us` |
| sprint planning | cérémonie de début de sprint : le PO choisit les stories, l'architecte fige leurs opérations provisoires, le SM et l'architecte découpent en tickets à partir de la conception détaillée | `PROCESS.md` section 4 |
| story | besoin d'un acteur, exprimé avec règles et critères Gherkin (`US-xxx`) | `livrable-epic-us` |
| story map | backlog organisé par activité et par release | `livrable-story-map` |
| story validée | story au statut `validee` : `valide_par` vaut `humain` si elle a été validée au G1. Rédigée après G1, elle vaut `po` (validée par le PO, `Arbitrage PO`, montrée à l'humain au G3 suivant), ou `humain` si elle lui est remontée avant ce G3 parce qu'elle change le périmètre ou porte une règle métier forte | `PROCESS.md` section 4 |
| synchro de vague | point du PO après une vague : statuts, réponses, vague suivante | `PROCESS.md` section 6 |
| taille d'une story | complexité relative d'une story, XS, S, M, L ou XL (balise `taille`), indépendante du mode de réalisation ; la roadmap et la page backlog la lisent. Une story XL ne passe pas `prete` : elle se découpe avant G1, ou avant d'entrer en sprint si elle est rédigée après | `livrable-epic-us` |
| table des modules | `table.modules` de `transverse/organisation-du-code.html`, écrite à la main, un module backend par ligne ; les objets de chaque module sont calculés (ancre `module-<module>`) | `livrable-conception-detaillee` |
| ticket | tranche verticale de travail confiée à une instance (`T-xxx`) | `team/conventions/ticket.md` |
| ticket e2e | ticket `T-xxx` de type `e2e` créé au sprint planning par lot de stories, confié à une instance QA, qui produit les tests e2e du lot | `team/conventions/ticket.md` |
| traitement | logique du domaine non exposée (`TR-xx`), isolée quand elle sert à deux appelants ou plus, quand c'est un calcul ou un algorithme du domaine qui mérite d'être testé seul, ou quand c'est un effet en cascade ; sinon elle reste dans l'endpoint | `livrable-conception-macro` |
| tranche verticale | ticket qui tient dans un contexte frais, se démontre seul et vaut un cycle dev et revue | `team/conventions/ticket.md` |
| type partagé | type de données utilisé seulement à l'intérieur d'autres schémas, sans page propre ; ligne ancrée de la liste des schémas | `livrable-conception-detaillee` |
| vague | lot de tickets lancés en parallèle, trois en cible, cinq au plus | `PROCESS.md` section 4 |
| verdict | balise `<meta name="verdict">` de la campagne (`favorable`, `favorable-avec-reserves`, `defavorable`) et du PV de recette (`accepte`, `accepte-avec-reserves`, `refuse`), vide tant qu'il n'est pas rendu ; la page de pilotage la lit | `livrable-qa`, `livrable-pv-recette` |
| vue par écran | page transverse `transverse/ecrans.html` de la conception détaillée : pour chaque écran, endpoints appelés, codes d'erreur à traduire, messages ; point d'entrée du front | `livrable-conception-detaillee` |
| wireflow | parcours utilisateur dessiné en enchaînement d'écrans et d'actions | `livrable-spec-ux-ui` |
| worktree | copie de travail git propre à un ticket, où l'instance développe | `team/conventions/git.md` |

## 4. Statuts d'une story

La page backlog affiche le statut d'une story sur une seule échelle, dans l'ordre du parcours. Il se
lit dans la balise `<meta name="statut">` de la story, sauf « À rédiger » (pas encore de page) et le
numéro du sprint (lu dans la page de sprint).

| Statut affiché | Valeur de la méta `statut` | Sens |
|---|---|---|
| À rédiger | (pas de page) | la story est dans la story map, sa page n'existe pas encore |
| Rédigée | `brouillon` | sa page existe, sa Definition of Ready n'est pas encore cochée |
| Prête | `prete` | sa Definition of Ready est cochée (une story XL ne l'est jamais) |
| Validée | `validee` | validée par l'humain au G1 (`valide_par` `humain`) ; rédigée après G1, validée par le PO (`valide_par` `po`) et montrée au G3 suivant, ou remontée avant à l'humain (`valide_par` `humain`) |
| En sprint N | `en-sprint` | engagée dans le sprint N, d'après sa page de sprint |
| Livrée | `faite` | acceptée dans un PV signé, avec ou sans réserve ; le PV fait foi |
| Abandonnée | `abandonnee` | barrée en fin de son epic, hors des comptes |
