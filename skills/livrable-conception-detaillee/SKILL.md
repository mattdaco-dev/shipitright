---
name: livrable-conception-detaillee
description: Produit ou met à jour la conception technique détaillée de toute l'application, organisée par objet (une page par endpoint EP-xx et par schéma, générées depuis le contrat d'API ; une page par entité EN-xx et par traitement TR-xx, écrites à la main ; pages transverses organisation du code, erreurs, écrans, sécurité, tests et contrat de conformité ; sommaire, vue des points ouverts et vue Swagger UI), le contrat d'API openapi.yaml multi-fichiers, à partir des gabarits. À utiliser en phase P3 par l'Architecte une fois la conception macro posée, puis à chaque sprint planning pour figer les opérations provisoires du lot, ou quand le contrat d'API doit évoluer.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Bash(cp -R ${CLAUDE_PLUGIN_ROOT}/skills/livrable-conception-detaillee/template-api/ *)"
  - "Bash(npx @redocly/cli@2.58.2 *)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Livrable : conception technique détaillée, contrat d'API, conformité

La conception détaillée dit **quoi** développer et **comment**, pour toute l'application, objet par
objet, assez précisément pour qu'un dev, humain ou IA, démarre à froid sur un ticket sans reposer de
question. On y entre par la conception macro : chaque identifiant de son schéma ouvre sa page.

- **Auteur** : Architecte. Contributeurs : Dev backend, Dev frontend (faisabilité).
- **Phase** : P3 pour **toute l'application**, toutes releases. Ce que la P3 ne peut pas trancher
  reste en **opération provisoire**, figée au sprint planning qui la prend. Passe le gate **G2**
  (humain, relu par les équipes technique et d'architecture).
- **Exemple de référence**, format validé par l'humain : `${CLAUDE_PLUGIN_ROOT}/team/exemples/formats/docs/30-conception/`
  (21 endpoints, 6 entités, 6 traitements). S'en inspirer pour le niveau de détail ; les gabarits
  restent le point de départ.

## Règles de la conception détaillée

Les règles de l'humain. Elles priment sur le reste du skill ; le tableau des sections les applique.

1. Elle permet aux devs, humains et IA, de savoir **quoi** développer et **comment**.
2. Elle est claire, précise et simple.
3. Chaque section d'information et chaque mise en forme a un **objectif précis qui ne chevauche aucune
   autre section**, un **formalisme défini (idéalement déterministe)** et une **justification de ce
   formalisme**.
4. Chaque formalisme s'appuie **au maximum sur des artefacts standards** (OpenAPI, JSON Schema,
   diagramme de séquence et d'état UML ou Mermaid, DDL SQL, RFC 9457 problem+json, C4, matrice RACI
   ou CRUD…) et justifie pourquoi ce formalisme.
5. Le dev humain n'est **pas submergé d'information parasite** : le moins de bruit possible.
6. **Pas de redondance** d'information.
7. **Deux modes de représentation** sont permis si c'est justifié (par exemple vue lisible et vue
   standard brute).
8. Le lecteur **visualise facilement la structure** de la conception (le plan du site généré du
   sommaire).
9. Les **schémas d'API** sont clairement définis et on identifie facilement **où ils se placent** :
   quel émetteur, quel récepteur, quel endpoint, quel sens, quelle couche.
10. Les **points ouverts** se retrouvent facilement, avec leur **niveau d'impact sur la conception**,
    et sont **rangés par impact, du plus fort au plus faible**.
11. Pas de notion d'**epic** ni de **user story** dans la conception détaillée.
12. La **release** peut figurer, à titre indicatif seulement.
13. Chaque section (panel) a un petit **(i)** qui explique à quoi elle sert, ce qu'elle présente et
    pourquoi.
14. **Toute référence est un lien** (EP, TR, EN, EC, RG, CF, schémas, codes d'erreur, Q, ADR…).

Ce qu'elles impliquent, et que le générateur contrôle quand il le peut :

- **Écrit une fois, montré où il sert** (règles 6 et 7). Une information a une seule source : le
  YAML, une balise `meta`, une table d'une page écrite à la main. Une vue calculée peut la montrer
  ailleurs quand elle sert un autre point d'entrée (la matrice CRUD du sommaire et la colonne « Qui
  agit dessus » d'une entité), jamais recopiée à la main. Deux sections d'un même objectif n'existent
  pas. Deux modes d'une même source : tableau lisible et forme brute (pages de schéma et Swagger UI,
  table des transitions et diagramme d'états, séquence Mermaid et liste de ses identifiants en liens).
- **(i) obligatoire** (règle 13) : `<div class="info-body" hidden>` juste après chaque `h2`, qui contient
  une `<dl class="defs">` (comme la roadmap). Termes fixes, dans cet ordre : **À quoi sert**, **Contenu**,
  **Pourquoi ce formalisme** (obligatoires, repris du tableau des sections), puis au besoin **Lire**
  (légende, badges, conventions de lecture) et **Source** (d'où la section est calculée) ; le sommaire
  ajoute **Coder un endpoint** et **Coder un écran**. Un `dd` tient en une ou deux phrases courtes ; une
  énumération de plus de trois éléments ou une suite d'étapes devient une liste `<ul>` ou `<ol>`. Rien
  n'y répète la section elle-même. Section sans (i) : avertissement.
- **Aucune hypothèse ni question hors des points ouverts** (règle 10) : pas de callout `hypothese`
  ou `question`, pas de « HYPOTHÈSE » dans le texte d'une page ou du YAML hors de `x-open`.
- **Références** (règle 14) : un identifiant cité est un lien (`${CLAUDE_PLUGIN_ROOT}/team/glossaire.md`), y compris un
  code d'erreur ou un schéma en `<code>`, un `CF-xx` (lien vers sa ligne dans la page
  `transverse/conformite.html`, ou vers la section du socle s'il est repris par référence). Un
  diagramme Mermaid ne porte pas de lien : le générateur liste ses identifiants en liens dessous.
  Une cible hors du dépôt du projet (fichier du framework, source externe d'un socle) ne se lie pas :
  elle se cite en `<code>`. Un socle du projet se lie
  (`.team/socles/stacks/<nom>/conformite.md`, chemin relatif depuis la page).
- **Pas d'epic ni de story** (règle 11) : ni dans le YAML ni dans les pages ; la couverture des
  scénarios d'une story va dans ses notes techniques (bloc `story-tech`).
- **Release indicative** (règle 12) : une étiquette sur un objet, une colonne ou un ajout annoncé,
  jamais une section organisée par release (plus de section « Évolutions » ni d'`x-adapted`).

## Tableau des sections

La référence du format. Généré : rempli par `${CLAUDE_PLUGIN_ROOT}/team/scripts/detaillee-pages.mjs`, ne s'édite pas.
Écrit : à la main, dans la page ou le YAML.

| Page | Section | Objectif unique | Formalisme | Standard | Justification | Généré ou écrit |
|---|---|---|---|---|---|---|
| Sommaire | En-tête | situer la version et les sources, compter les points ouverts | ligne de métadonnées, compteur par impact | | une ligne, lue une fois | écrit, version du contrat et compteur générés (`api-version`, `open-summary`) |
| Sommaire | Plan du site | voir la structure et aller à une page | arbre de pages, un bloc par page avec son titre en lien, sans les sections (chaque page les liste dans sa table des matières) | plan de site | déterministe, calculé depuis les pages réelles ; peu de bruit | généré (`sitemap`) ; le (i) dit l'ordre de lecture |
| Sommaire | Endpoints | trouver une opération par chemin, droits ou statut | tableau triable id, verbe et chemin, résumé, droits, statut (sans release : indicative, elle est sur la page de l'endpoint) | liste des opérations OpenAPI | une ligne par opération, tri sans recherche | généré (`summary-endpoints`) |
| Sommaire | Matrice CRUD | qui crée, lit, met à jour, supprime quoi ; index des entités et traitements | matrice endpoints et traitements × entités, lettres C R U D ; pour un endpoint, l'accès qu'il déclare, direct ou obtenu par un traitement (`via`) | matrice CRUD | le croisement standard données × traitements | généré (`crud-matrix`) |
| Points ouverts | Points ouverts | tout ce qui reste à trancher, du plus fort impact au plus faible | tableau triable impact, objet, sujet, hypothèse, question | | mêmes attributs pour chaque point, se comparent | généré depuis `x-open` et les tables des pages |
| Endpoint | En-tête | identifier l'opération | verbe et chemin, statut, droits, module, écrans, release, `operationId` | OpenAPI | ce qui situe l'opération tient sur deux lignes | généré (module depuis `x-module`) |
| Endpoint | Requête | ce que le front envoie | tableau des paramètres, schéma du corps (↑), exemple | OpenAPI Parameter, Request Body | rendu lisible ; le brut est dans le YAML et Swagger UI | généré |
| Endpoint | Réponses | ce que le front reçoit | tableau statut, corps, code, cas ; erreurs communes sur une ligne ; exemples | OpenAPI Responses, RFC 9457 | un code par ligne ; le commun n'est pas répété | généré |
| Endpoint | Comportement | les faits que le code respecte | liste de définitions : ce qu'il fait, contrôles, traitements, règles, idempotence, données en CRUD | RFC 9110 (idempotence), CRUD | un fait par terme, sans prose | généré (`description`, `x-data-control`, `x-processes`, `x-rules`, `x-idempotence`) |
| Endpoint | Séquence | l'ordre des appels et la transaction | diagramme de séquence, identifiants en liens dessous | UML séquence (Mermaid) | montre l'enchaînement que la liste ne montre pas | écrit (`x-sequence`), rendu généré |
| Endpoint | Ajouts annoncés | comment l'opération figée grandit | tableau release, ajout, où | | seule évolution permise du figé (CF-58) | généré (`x-release`, `x-enum-releases`) |
| Endpoint | Points ouverts | ce qui reste à trancher sur l'opération | tableau impact, sujet, hypothèse, question | | mêmes attributs, repris dans la vue unique | écrit (`x-open`), rendu généré |
| Schéma | En-tête | identifier le schéma | couche, projection d'entité, statut, première release | | situe le schéma | généré (`x-entity`) |
| Schéma | Placement | où le schéma circule | tableau sens, émetteur → récepteur, endpoint, message HTTP, statut | OpenAPI (requête, réponse et statut) | mêmes colonnes pour chaque usage : placement sans ambiguïté | généré (écrans depuis la macro) |
| Schéma | Champs | la forme du schéma | tableau champ, type, obligatoire, contraintes, description | JSON Schema | vue lisible ; le brut est dans le YAML et Swagger UI | généré |
| Schéma | Exemple | une instance valide | JSON | JSON | de quoi écrire un mock sans inventer | généré (exemple du YAML) |
| Schéma | Ajouts annoncés | comment le schéma grandit | tableau release, ajout, où | | CF-58 | généré |
| Liste des schémas | Schémas échangés | index des schémas par domaine, avec leur placement | cards par domaine, sens, endpoints et statut HTTP | | un domaine = un fichier `components/schemas/<domaine>.yaml` | généré |
| Liste des schémas | Types partagés | les types sans page | tableau type, format, utilisé dans, description | JSON Schema | ils ne circulent jamais seuls | généré |
| Liste des schémas | Journal des changements | les versions du contrat d'API | tableau version, date, changements typés | SemVer | une entrée par version, la plus récente d'abord | écrit (`info.x-changelog`), rendu généré |
| Swagger UI | Contrat d'API | le contrat brut et outillé | Swagger UI, spec embarquée | OpenAPI 3.1 | second mode de lecture des pages endpoint et schéma | généré |
| Entité | Modèle physique | le schéma physique, prêt pour la migration | DDL commenté (règle par contrainte), puis règles hors de la base | DDL SQL du dialecte du store (JSON Schema pour une base documentaire) | ce que la migration contient, sans traduction | écrit |
| Entité | Machine à états | le cycle de vie | table de, vers, événement, garde, action, et diagramme tiré de la table | UML états (Mermaid), notation événement [garde] / action | table liée et diagramme lisible d'une seule source | écrit (`table.transitions`), diagramme généré (`state-diagram`) |
| Entité | Qui agit dessus | qui crée, lit, met à jour, supprime l'entité | colonne de la matrice CRUD, schémas qui l'exposent | CRUD | même source que la matrice du sommaire, autre point d'entrée | généré (`entity-usage`) |
| Entité, traitement, transverse | Points ouverts | ce qui reste à trancher sur l'objet | tableau `open-points` impact, sujet, hypothèse, question | | mêmes attributs, repris dans la vue unique | écrit |
| Traitement | Appelé par et entités | situer le traitement | liste de définitions : appelants, appelés, données en CRUD, règles, erreurs | CRUD | calculé, toujours juste | généré (`process-usage`) |
| Traitement | Signature et transaction | le contrat du traitement dans le code | signature typée dans le langage du socle, ligne Transaction | signature (IDL du langage) | la forme la plus courte, recopiée dans le domaine | écrit |
| Traitement | Algorithme (Algorithme proposé pour une opération provisoire) | ce que fait le traitement, dans l'ordre | liste numérotée, une étape par contrôle ou action, avec règle et refus | pseudo-code numéroté | l'ordre compte, sans prose | écrit |
| Traitement | Cas limites | ce que les tests couvrent | tableau situation, résultat attendu | table de décision | une ligne = un test | écrit |
| Organisation du code | Backend | où vit chaque endpoint, traitement et entité | table des modules (`table.modules` : module, contenu), puis objets par module (endpoints, traitements, entités), câblage, règle des transactions | C4 niveau composants (en tableau) | le socle appliqué au produit ; le module est déclaré par chaque objet, la liste des objets par module est calculée, sans chemin de fichier dans un ticket | table des modules écrite ; objets par module générés (`code-modules`, depuis `x-module` et `meta module`) |
| Organisation du code | Frontend | où vit chaque écran | tableau route, écran, composants, état ; services d'accès API | C4 niveau composants (en tableau) | les endpoints par écran sont dans la vue écrans, pas ici | écrit |
| Organisation du code | Persistance | conventions communes et ordre des migrations | liste de définitions, tableau des migrations | | écrit une fois pour toutes les tables | écrit |
| Erreurs | Principes | comment une erreur circule de l'API à l'écran | liste courte, chaque principe avec son invariant | RFC 9457 | le détail est dans le catalogue | écrit |
| Erreurs | Catalogue des codes | tout savoir d'un code | tableau code, statut, cas, écran, entité, endpoints | registre de types de problème RFC 9457 | calculé, ne diverge pas du contrat | généré (`error-catalog`) |
| Écrans | Plan des écrans | voir tous les écrans, leurs enchaînements, et aller à leur définition | wireflow : une card par écran (aperçu, nom, lien vers la spec UX/UI et vers sa ligne « Par écran »), flèches libellées par l'action, groupes par parcours | wireflow (plan d'écrans) | même moteur que le wireflow de la spec UX/UI ; écrans, aperçus et enchaînements tirés de la spec, sans recopie | généré (`screen-map`) |
| Écrans | Par écran | point d'entrée du dev frontend | tableau écran, endpoints, codes à traduire, messages, lien vers sa ligne « Adresse, arrivée et structure » | | calculé depuis la macro et le contrat | généré (`screens`) |
| Écrans | Adresse, arrivée et structure | savoir avant le dev comment on arrive sur l'écran et ce que visent les e2e | `table.screen-details` : écran, adresse et paramètres, ce qui arrive d'un autre écran (message et mécanisme), rôles et noms accessibles des éléments que visent les e2e ; une ligne par écran de la macro, `<tr id="structure-EC-xx">` | | écrit par l'architecte, relu par l'UX et le QA ; noms accessibles repris tels quels de la spec UX/UI | écrit, vérifié par le bloc `screens` |
| Sécurité | Session et contrôle d'accès | comment une requête est authentifiée et autorisée | liste courte avec invariants | | les principes de la macro appliqués | écrit |
| Sécurité | Matrice des droits | qui peut appeler quoi | matrice endpoints × rôles, contrôles sur les données | matrice d'accès RBAC | standard du contrôle d'accès par rôle | généré (`rights-matrix`) |
| Sécurité | Données et protections | ce qui protège les données | liste par sujet avec son invariant ou son entité | | pour la revue de sécurité | écrit |
| Tests | Outillage | avec quoi les devs testent | liste de définitions par niveau | | l'outillage du socle appliqué | écrit |
| Tests | Cas imposés | ce que chaque test doit couvrir | tableau cible, niveau, cas ; cas limites des traitements cités | | check-list de revue (CF-56, CF-57) | écrit |
| Conformité | Framework, socle de stack, design system, projet | ce que le code respecte, vérifié en revue | tableau id, invariant, vérification ; une ligne par invariant, `<tr id="CF-xx">` ; un socle repris par référence en liste de définitions | | un invariant vérifiable par ligne, une ancre par identifiant ; le socle n'est pas recopié | écrit |
| Conformité | Écarts acceptés | les seuls écarts permis | tableau invariant, écart, ADR, portée | ADR | un écart non listé est bloquant | écrit |
| `openapi.yaml` | racine, `paths/`, `components/` | le contrat d'API, source de vérité | OpenAPI 3.1 multi-fichiers, extensions `x-` | OpenAPI 3.1, JSON Schema, RFC 9457 | lu par les outils et par le générateur | écrit |

**Ordre de lecture** pour coder un endpoint : sa page (requête, réponses, comportement, séquence),
ses traitements (signature, algorithme, cas limites), ses entités (DDL), l'organisation du code (où le
ranger), le contrat de conformité (invariants), les tests imposés. Pour un écran : la vue par écran
(`transverse/ecrans.html#par-ecran`) et sa ligne « Adresse, arrivée et structure », les pages
de ses endpoints, la gestion des erreurs. Cet ordre est rappelé dans le (i) du plan du site.

## Points ouverts

**Échelle d'impact**, selon ce qu'une autre réponse changerait (on classe par l'objet le plus lourd
qu'elle peut toucher) :

| Impact | Ce que la réponse peut changer |
|---|---|
| **fort** | le modèle de données (entité, table, contrainte) ou une opération figée du contrat d'API (rupture, ADR), ou ce qui structure tout le code |
| **moyen** | une opération provisoire, un traitement, un schéma pas encore figé, le comportement d'un écran |
| **faible** | un libellé, un message, une valeur par défaut, un cas limite d'affichage |

- **Écrit une fois**, là où la réponse atterrit : dans `x-open` d'une opération (YAML) quand il porte
  sur elle ; sinon dans la section `Points ouverts` (`id="points-ouverts"`) de la page de l'entité,
  du traitement ou de la page transverse, en `table.open-points`. Un traitement d'une opération
  provisoire n'en a pas : ses points sont dans `x-open` de l'opération.
- **Forme** : `impact` (fort, moyen, faible), `sujet` (ce qui reste à trancher et ce qu'une autre
  réponse changerait), `hypothese` (ce que le code suit en attendant), `question` (`Q-xxx` si elle
  est posée au PO, sinon vide : « non posée »). Rangés par impact décroissant dans chaque page.
- **Vue unique** : `detaillee/points-ouverts.html`, générée, rangée par impact puis par objet, avec
  lien vers l'endroit concerné et vers la question ; compteur par impact dans l'en-tête du sommaire.

## Vocabulaire

Les termes suivent `${CLAUDE_PLUGIN_ROOT}/team/glossaire.md` (identifiants, cibles de lien, vocabulaire) :

- **contrat d'API** : tout `openapi.yaml`, racine et fichiers liés. Il fait foi : en cas d'écart avec
  une page, le YAML a raison.
- **opération figée** (`x-contract: fige`) : rien n'en est retiré ni changé, seuls des ajouts
  rétrocompatibles annoncés sont permis ; le front part sur un mock sans attendre le back.
- **opération provisoire** (`x-contract: provisoire`) : elle attend une réponse métier ; décrite au
  niveau réduit, elle change librement jusqu'au planning qui la fige.
- **schéma** : forme de données échangée par un endpoint. **Schéma échangé** : envoyé (↑, corps de
  requête) ou reçu (↓, réponse ; ↓ rouge, réponse d'erreur) directement par un endpoint, il a sa page.
  **Type partagé** : utilisé seulement à l'intérieur d'autres schémas, une ligne de la liste des
  schémas (`schemas/index.html#<Type>`), sans page. **Couche** d'un schéma échangé : la frontière
  HTTP, entre le service d'accès API du front et la route de l'API qui le valide.
- **accès CRUD** : `C` création, `R` lecture, `U` mise à jour, `D` suppression, d'un endpoint ou
  d'un traitement sur une entité (`x-entities`, `meta entites`). Une lecture faite pour un contrôle
  (vérifier un chevauchement, une existence, un droit) compte comme `R`. Un traitement déclare tout
  ce qu'il peut faire ; l'endpoint qui l'appelle déclare ce qu'il en obtient réellement (`via`, voir
  les règles de conception).
- On n'écrit plus « contrat » pour un schéma, ni « dur » ou « mou » pour une opération.

## Entrées à lire

- `.team/socle.md` du projet, puis le socle de stack (`socle.md` et `conformite.md`, dans
  `.team/socles/stacks/<nom>/`, ou dans la source qu'il désigne) : organisation du code, conventions d'API, invariants, outillage et commandes de
  test. Le socle de design system pour les invariants front.
- `docs/30-conception/macro.html` : chaîne, ids `EC-xx`, `EP-xx`, `TR-xx`, `EN-xx`, persistance,
  écarts au socle, points d'attention.
- `docs/20-specs/conception-fonctionnelle.html` : règles `RG-xx`, calculs `CALC-xx`, cycles de vie,
  messages `MSG-xx`. `docs/20-specs/stories/` : critères Gherkin (pour les notes techniques des
  stories, pas pour la détaillée).
- `docs/20-ux/spec-ux-ui.html` : écrans, états, messages `MSG-Uxx`.
- `docs/adr/index.html` (registre des ADR, skill `shipitright:livrable-adr`), `.team/questions/`, et la
  conception détaillée existante quand on la met à jour.

## Arborescence et gabarits

```
docs/30-conception/
  macro.html                       charge detaillee/xref.js (skill livrable-conception-macro)
  api/                             contrat d'API, à la main   ← template-api/ (tout le dossier)
    openapi.yaml                   racine : info (version, x-changelog), tags, chemins, nom de chaque composant
    paths/<chemin>.yaml            un fichier par chemin : /salles/{id} → paths/salles-id.yaml
    components/schemas/<domaine>.yaml   schémas d'un domaine ; 1re ligne : # Domaine « Libellé » ...
    components/parameters.yaml, components/responses.yaml
    .redocly.lint-ignore.yaml      ignores ciblés du lint
  detaillee/
    index.html                     sommaire, à la main avec blocs gen:   ← template-index.html
    entites/EN-xx.html             à la main avec blocs gen:             ← template-entite.html
    traitements/TR-xx.html         à la main avec bloc gen:              ← template-traitement.html
    transverse/organisation-du-code.html, erreurs.html, ecrans.html, securite.html, tests.html,
               conformite.html     à la main, avec blocs gen: pour organisation-du-code, erreurs,
                                   ecrans et securite         ← template-transverse-<nom>.html
                                   conformite.html : le contrat de conformité, seule source des CF-xx
                                   du projet (plus de conformite.md)
    endpoints/EP-xx.html           GÉNÉRÉ, une page par opération
    schemas/<Schema>.html          GÉNÉRÉ, une page par schéma échangé
    schemas/index.html             GÉNÉRÉ : schémas par domaine, types partagés, journal du contrat d'API
    points-ouverts.html            GÉNÉRÉ : vue unique des points ouverts, par impact
    swagger.html                   GÉNÉRÉ : vue Swagger UI, spec embarquée (s'ouvre en file://)
    xref.js                        GÉNÉRÉ : index lu par doc.js (liens de la macro, icône { }, infobulles)
```

Une page générée porte en tête `Generated by team/scripts/detaillee-pages.mjs` : ne jamais l'éditer,
on modifie la source et on régénère. Dans une page écrite à la main, ce qui est entre
`<!-- gen:NOM -->` et `<!-- /gen -->` est réécrit à chaque passage. Blocs disponibles :

| Bloc | Page | Ce qu'il calcule |
|---|---|---|
| `api-version` | sommaire, ligne Sources | lien vers `openapi.yaml`, version et date |
| `open-summary` | sommaire, en-tête | nombre de points ouverts par impact, lien vers la vue unique |
| `sitemap` | sommaire, Plan du site | arbre des pages : un bloc par page (ou par modèle pour les familles EP, schémas, EN, TR, lié à une page exemple), titre en lien vers la page, sans ses sections ; un bloc de famille (plusieurs pages du même modèle) est dessiné en cards empilées (classe `st-stack`) : son titre ouvre, dans la vue de focus de doc.js (la même que celle de la macro), la liste générée de ses pages, chacune en lien ; fermeture par Échap, clic dehors ou bouton, plein écran sur mobile ; `gen` sur une page générée |
| `summary-endpoints` | sommaire | tableau triable des opérations : chemin, résumé, droits, statut |
| `crud-matrix` | sommaire | matrice CRUD endpoints et traitements × entités, traitements appelés ; accès d'un endpoint par un traitement : celui de sa ligne `x-entities` avec `via` |
| `entity-usage` | page entité | colonne CRUD de l'entité, schémas qui l'exposent |
| `state-diagram` | page entité | diagramme d'états Mermaid tiré de `table.transitions` de la page |
| `process-usage` | page traitement | appelants, traitements appelés, données en CRUD, règles, erreurs |
| `code-modules` | `transverse/organisation-du-code.html` | objets par module backend : endpoints (`x-module`), traitements et entités (`meta module`), dans l'ordre de `table.modules` ; ancre `module-<module>`, cible du lien Module de chaque page d'objet |
| `error-catalog` | `transverse/erreurs.html` | catalogue des codes : statut, cas, écran, entité, endpoints |
| `screen-map` | `transverse/ecrans.html` | plan des écrans, dessiné par le moteur `.pf` de doc.js : une card par écran de la macro, aperçu et nom tirés de l'inventaire de la spec UX/UI (`a.screen-card` et son `img`), groupes, places et flèches tirés de son wireflow (`h3` puis `div.pf`, `data-c`, `data-r`, `data-links` et leurs libellés) ; une boîte de dialogue compte pour son écran, les résultats (`pf-node end`) et les retours le long d'une flèche déjà tracée sont omis, un écran de deux parcours est dessiné une fois ; écrans sans parcours en dernier groupe, sans flèche ; une colonne sur un écran étroit |
| `screens` | `transverse/ecrans.html` | par écran de la macro : endpoints, codes à traduire, messages, et lien vers sa ligne de `table.screen-details` (adresse et paramètres, ce qui arrive d'un autre écran avec son message et son mécanisme, rôles et noms accessibles des éléments que visent les e2e), écrite à la main ; un écran sans ligne est signalé |
| `rights-matrix` | `transverse/securite.html` | rôles × endpoints (une colonne par rôle de `x-roles`), contrôles sur les données |
| `story-tech` | notes techniques d'une story | endpoints, traitements, entités, schémas de sa `meta endpoints` |

Retirés du format (erreur s'ils restent) : `summary-entities`, `summary-processes` (remplacés par
`crud-matrix`), `summary-schemas` (la liste des schémas est `schemas/index.html`), `open-points`
(vue unique et `open-summary`).

Les pages écrites à la main portent leurs balises `meta`, lues par le générateur :

- **entité** : `id`, `nom`, `release`, `module`, `tables`, `regles` (chaque règle citée dans le modèle
  physique).
- **traitement** : `id`, `nom`, `release`, `module`, `entites` (`EN-05:CRU EN-03:R`), `traitements` (TR-xx
  appelés), `erreurs` (valeurs de `CodeErreur` qu'il renvoie), `regles`.

Le nom du fichier est l'id (`EN-05.html`). Une balise `meta` que personne ne lit est signalée.
`module` (obligatoire) est le module du code backend où vit l'objet, une ligne de `table.modules` de
l'organisation du code, comme `x-module` d'une opération.

## Contenu attendu

**Chapeau fixe** : le texte sous le `h1` du sommaire (`p.lede`) est commun à toutes les conceptions
techniques détaillées. Il dit l'objectif de la détaillée et renvoie à la conception technique macro,
dont le chapeau lui répond, et au contrat d'API. Il se recopie tel quel du gabarit et ne se
personnalise pas : ni compteurs, ni noms d'objets. Le générateur n'y écrit rien.

### Contrat d'API (`api/`)

Le gabarit `template-api/` est un squelette qui passe le générateur et le lint ; son exemple reprend
celui du gabarit de la macro (`EP-01`, `EP-02`, `EN-01`, `EN-02`, ressources) et se remplace en
entier. Il déclenche volontairement un avertissement (`Ressource` échangé par une opération figée et
une provisoire) qui montre la règle des schémas partagés.

- OpenAPI 3.1, multi-fichiers (constant quel que soit le socle, `${CLAUDE_PLUGIN_ROOT}/PROCESS.md` section 8). Un composant
  n'existe que s'il est nommé dans la racine sous `components` ; ailleurs on le cite par un `$ref`
  relatif à son fichier.
- **Conventions par défaut : JSON simple et `application/problem+json`** (RFC 9457, schéma
  `Probleme` avec un `code` métier, valeur de `CodeErreur`). Un socle qui retient d'autres
  conventions (JSON:API par exemple) adapte le squelette ; l'écart au socle passe par un ADR.
  Les codes `VALIDATION`, `NON_AUTHENTIFIE` et `ERREUR_INTERNE` sont attendus par le générateur
  (codes communs, sur une ligne dans les pages d'endpoint).
- **Extensions `x-`** et **niveaux d'exigence** : la liste qui fait foi est l'en-tête de
  `template-api/openapi.yaml`, recopié dans le projet. Ne pas la recopier ailleurs.
- **Version et journal** : `info.version` en `majeure.mineure.correctif`, une entrée par version en
  tête de `info.x-changelog` (`date` entre guillemets, chaque ligne commence par son genre : `ajout`,
  `annonce`, `figé`, `correction`, `rupture`). Mineure pour un ajout figé ou une opération qui passe
  de provisoire à figée ; correctif sans effet sur le figé ; majeure seulement avec un ADR accepté,
  cité dans l'entrée. Le générateur refuse une version sans entrée.
- Une erreur : réutiliser les réponses communes de `components/responses.yaml` ; chaque réponse
  d'erreur porte ses `x-codes`, et chaque code a son entrée `x-error-catalog` (`status`, `case`,
  `screen` avec les `EC-xx` et `MSG-xx`, `entity` si le code met une entité en cause).

### Niveaux d'exigence par page

| Page | Section | Niveau | Ce qu'on y attend |
|---|---|---|---|
| Opération figée | `paths/<chemin>.yaml` | obligatoire | `x-endpoint-id`, `x-release`, `x-contract`, `x-roles`, `x-module`, `x-entities` ou `x-processes` ; si elle écrit (C, U ou D) : `x-idempotence` et `x-sequence` ; en lecture : `x-sequence` recommandé ; exemple du corps de requête et de chaque réponse 2xx qui a un corps (`example` du contenu, ou `examples` du schéma échangé ; erreur du générateur sinon) ; `x-codes` sur chaque erreur ; `x-entities` avec `via` pour chaque entité que touche un traitement appelé |
| Opération provisoire | `paths/<chemin>.yaml` | obligatoire, niveau réduit | `summary`, `x-roles`, `x-module`, `x-entities` ou `x-processes`, `x-open` ; séquence et exemples facultatifs |
| Sommaire | Plan du site, Endpoints, Matrice CRUD | obligatoire | blocs `gen:` seulement ; le (i) du plan du site porte l'ordre de lecture et le lien vers l'ADR des conventions d'API |
| Entité | Modèle physique | obligatoire | DDL commenté ; règles hors de la base |
| Entité | Machine à états | recommandé | `table.transitions` et bloc `state-diagram` ; sans cycle de vie : une phrase |
| Entité | Qui agit dessus | obligatoire | bloc `entity-usage` |
| Traitement | Appelé par et entités | obligatoire | bloc `process-usage` |
| Traitement | Signature et transaction, Algorithme | obligatoire | signature typée ; étapes avec règle et refus |
| Traitement d'une opération provisoire | Algorithme proposé | obligatoire, niveau réduit | seule section avec « Appelé par et entités » ; ses points ouverts sont dans `x-open` de l'opération |
| Traitement | Cas limites | recommandé | un cas par ligne avec le résultat attendu |
| Entité, traitement, transverse | Points ouverts | recommandé | `table.open-points`, ou « Aucun point ouvert. », ou pas de section |
| Organisation du code | Backend, Frontend, Persistance | obligatoire | celles du socle appliquées au produit ; `table.modules` avec chaque module déclaré et bloc `code-modules` ; `#transactions` avec les deux règles du gabarit |
| Conformité | Framework, socle de stack, design system, projet, écarts | obligatoire | voir ci-dessous |
| Erreurs | Principes, Catalogue des codes | obligatoire | principes du gabarit complétés ; bloc `error-catalog` |
| Écrans | Plan des écrans, Par écran, Adresse, arrivée et structure | obligatoire | blocs `screen-map` et `screens` ; `table.screen-details` avec une ligne par écran de la macro |
| Sécurité | Session, Matrice des droits, Données et protections | obligatoire | mécanisme appliqué ; bloc `rights-matrix` ; données personnelles et protections |
| Tests | Outillage, Cas imposés | obligatoire | outillage du socle cité ; une ligne par cible, cas limites des traitements cités |

### Contrat de conformité (`transverse/conformite.html`)

Une page transverse de la conception détaillée, dans le plan du site comme les autres ; c'est la seule
source des invariants du projet (plus de `conformite.md` dans le projet ; les socles gardent le leur).
Une section par origine, chacune avec son (i) : framework, socle de stack, design system, projet,
écarts acceptés. Chaque invariant est une ligne `<tr id="CF-xx">` dont la première cellule est un lien
vers elle-même : toute page lie `conformite.html#CF-xx`.

Le gabarit pré-remplit les invariants du framework (`CF-50` à `CF-59`, dont **CF-58** : rien ne
change dans une opération figée, version et journal ; et **CF-59** : lecture tolérante par le front).
Ceux du socle de stack (`CF-01` à `CF-49`) et du design system (`CF-70` à `CF-79`) sont **repris par
référence**, jamais recopiés : le projet ne liste que ceux qui ne s'appliquent pas, en écart avec
ADR. Un invariant repris par référence n'a pas de ligne : une page qui le cite lie la section
(`#socle-de-stack`, `#design-system`), ce que le générateur fait seul. L'Architecte ajoute les
invariants du projet (`CF-60` à `CF-69`), chacun **vérifiable** en lisant le code ; les identifiants
cités dans un invariant sont des liens.

**Socle `à compléter`** (pas de `conformite.md` de socle, ou une partie de la stack sans invariant) :
la sous-section « Invariants provisoires du socle » pose les invariants manquants avec les ids qu'ils
auront dans le socle, chacun avec sa ligne. Ils sont reportés dans le `conformite.md` du socle
quand le brief le prévoit, dans `.team/socles/stacks/<nom>/` ; quand la référence du socle est une
source de l'humain que la team n'écrit pas, ils sont signalés dans le rapport pour qu'il les y
reporte. L'humain les valide à G2. Le point ouvert
correspondant (impact fort) est dans la page de l'organisation du code ; la page de conformité y
renvoie et ne porte pas d'hypothèse.

**Design system sans `conformite.md`** (le socle de design system n'en a pas encore) : la section
« Design system » cite le socle déclaré (nom, version, date) et précise qu'il n'a pas de
`conformite.md` ; elle pose alors elle-même les invariants `CF-70` à `CF-79`, avec l'UX, chacun avec
sa ligne `<tr id="CF-xx">` et sa vérification dans le code front (tokens, composants du catalogue,
accessibilité), comme le font le gabarit et l'exemple. Ils sont reportés dans le `conformite.md` du
socle de design system si le brief de l'UX le prévoit (sinon, signalés dans le rapport), et
l'humain les valide à G2.

## Règles de conception

- **Ids repris de la macro, jamais renumérotés.** Un nouvel endpoint, traitement ou entité prend le
  prochain id libre et entre d'abord dans le schéma macro.
- **Toute flèche de la macro existe dans la détaillée** (`EP → EN`, `EP → TR`, `TR → EN`,
  `TR → TR`) : sinon erreur du générateur. Un accès plus fin de la détaillée, absent de la macro, est
  une simple information. Une ligne `x-entities` avec `via` n'est pas une flèche `EP → EN` : la
  macro passe par le traitement.
- **Accès obtenu par un traitement, déclaré par l'appelant.** Un traitement déclare dans
  `meta entites` tout ce qu'il peut faire, lectures de contrôle comprises (`EN-05:CRU` pour un
  traitement qui relit les réservations pour refuser un chevauchement, puis crée ou modifie) ; chaque
  endpoint qui l'appelle déclare l'accès qu'il en obtient réellement, lecture de contrôle comprise,
  une ligne par entité que touche le traitement :
  `x-entities: [{id: EN-05, access: CR, via: TR-02}, {id: EN-03, access: R, via: TR-02}]` pour la
  création, `access: RU` pour la modification. La matrice CRUD, la colonne « Qui agit dessus »
  des entités, les données du comportement et les notes techniques des stories utilisent cet accès,
  avec le traitement par lequel il passe. Le générateur lève une erreur si `via` n'est pas dans
  `x-processes` ou si l'accès déclaré sort de celui du traitement (traitements qu'il appelle compris),
  et un avertissement si l'appelant ne déclare rien pour une entité que touche le traitement (l'accès
  entier du traitement est alors retenu). Un traitement qui en appelle un autre reprend l'accès
  entier de l'appelé.
- **L'endpoint ouvre et ferme la transaction**, un traitement jamais : il s'exécute dans celle de son
  appelant et rend un résultat ou un refus. Les séquences le montrent.
- **Quand un traitement `TR-xx` existe** : la logique sert à deux appelants ou plus (endpoints ou
  traitements), ou c'est un calcul ou un algorithme du domaine qui mérite d'être testé seul, ou c'est
  un effet en cascade (une action qui en entraîne d'autres sur d'autres objets), ou rien ne l'appelle
  (tâche planifiée, message). Sinon, la logique reste dans l'endpoint, dans son cas d'usage.
- **Une entité est détaillée une fois**, dans sa page. Les autres pages la citent par son lien ; un
  schéma qui en est la projection réelle porte `x-entity`.
- **Opération figée** : seuls les ajouts rétrocompatibles annoncés (`x-release` sur un paramètre ou
  une propriété, `x-enum-releases` pour une valeur d'enum). Un schéma échangé par une opération figée
  et une provisoire ne fait que s'étendre ; s'il faut autre chose, la provisoire prend son propre
  schéma. **Opération provisoire** : niveau réduit, ses points ouverts dans `x-open`.
- **Sprint planning** : l'architecte fige les opérations provisoires du lot (niveau complet,
  `x-contract: fige`), monte la version mineure et ajoute l'entrée du journal, puis régénère.
- **Sens des schémas** vu du front : ↑ envoyé (corps de requête), ↓ reçu, ↓ rouge reçu en erreur.
  Calculé par le générateur, jamais écrit à la main.
- **Liens et infobulles** : ne pas écrire de `title` sur un lien EP, EN, TR : doc.js calcule
  l'infobulle depuis `xref.js`. Dans le YAML, un nom de schéma d'un seul mot s'écrit entre accents
  graves pour être lié ; « conception macro », « conception fonctionnelle », « spec UX/UI » sont liés.
- **Tableaux triables** : `<table data-sortable>` (doc.js) ; `data-sort-value` sur une cellule,
  `data-sort-order="MVP|R2|R3"` sur un en-tête pour un ordre logique.
- **Fichiers de schémas** : un par domaine fonctionnel, première ligne
  `# Domaine « Libellé » : ...` (le libellé nomme la card du domaine).
- **DDL** : vérifié dans le moteur du store avant de le rendre (par exemple `sqlite3 :memory:`),
  `<`, `>` et `&` échappés dans la page.
- **Pièges YAML** : un texte non quoté qui contient « : » devient un objet (le générateur le
  signale) ; dates du journal entre guillemets ; un `allOf` d'un schéma en
  `additionalProperties: false` refuse les champs ajoutés : écrire le schéma à plat.
- **Pas de chemin de fichier dans un brief de ticket** : les pages décrivent des modules et des
  composants, le dev trouve les fichiers.
- **Aucune règle métier inventée** : un doute devient un point ouvert, avec une question au PO
  (`Q-xxx`, badge `qmark`) si elle bloque.

## Commandes

```sh
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/detaillee-pages.mjs docs/30-conception            # génère
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/detaillee-pages.mjs docs/30-conception --check    # vérifie sans écrire
#   --stories <dir> : stories dont le bloc story-tech est rempli (défaut docs/20-specs/stories)
npx @redocly/cli@2.58.2 lint docs/30-conception/api/openapi.yaml   # depuis la racine du projet
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-livrable.mjs docs             # lance aussi --check
```

Le générateur écrit sur stderr les erreurs (code de sortie 1 : référence cassée, exigence manquante,
flèche macro absente, version sans entrée, point ouvert mal formé, accès hors CRUD, accès `via`
hors de celui du traitement, exemple manquant d'une opération figée, bloc retiré,
module absent de `table.modules`, `CF-xx` cité sans ligne dans la conformité, lien vers un ancien
`conformite.md`), les avertissements (section sans (i), hypothèse hors des points ouverts, points mal
rangés, référence sans lien, epic ou story citée, règle d'une entité absente de son modèle,
appelant d'un traitement qui ne déclare pas l'accès obtenu,
`x-adapted`, `conformite.md` resté à côté de la page…) et les
informations. Il est idempotent : un second passage ne change rien.

## Livrer

1. Copier `template-api/` en `docs/30-conception/api/` (avec `.redocly.lint-ignore.yaml`), en une
   commande : `cp -R ${CLAUDE_PLUGIN_ROOT}/skills/livrable-conception-detaillee/template-api/ docs/30-conception/api/`. Puis
   écrire une opération par endpoint de la macro, figée ou provisoire. Remplacer l'URL du serveur par
   celle du socle.
2. Copier (Read du gabarit dans `${CLAUDE_PLUGIN_ROOT}/skills/livrable-conception-detaillee/`, puis
   Write à sa place) `template-index.html` (en `detaillee/index.html`), un `template-entite.html` par `EN-xx`,
   un `template-traitement.html` par `TR-xx`, et les six `template-transverse-<nom>.html` (dont
   `conformite`) en `detaillee/transverse/<nom>.html`. Remplacer `NOM_PROJET`, renseigner `meta id`
   (égal au nom du fichier) et `meta module` de chaque page entité et traitement, et `x-module` de
   chaque opération, chaque module ayant sa ligne dans `table.modules` de l'organisation du code ;
   remplir, laisser les blocs `gen:` vides, garder le (i) de chaque section.
3. Compléter la macro : `<script src="detaillee/xref.js">` avant doc.js, ids des blocs égaux à leur
   identifiant (skill `shipitright:livrable-conception-macro`).
4. Remplir les notes techniques de chaque story : `meta endpoints`, contraintes, tableau scénario,
   élément qui le sert, écran (skill `shipitright:livrable-epic-us`).
5. Générer, puis `--check`, lint Redocly et `check-livrable` sur `docs/` : 0 erreur, 0 KO.
   Relire les avertissements et les traiter ou les justifier dans le rapport.
6. Ouvrir dans Chrome le sommaire, une page d'endpoint (séquence, lien du module), une page d'entité
   (diagramme d'états), l'organisation du code (objets par module), le contrat de conformité, la vue
   des points ouverts, la macro (liens et icône `{ }`) et `swagger.html` : Swagger UI
   s'affiche, et le lien « voir dans Swagger UI » d'un endpoint ouvre son opération.
7. Rapport : points ouverts d'impact fort, opérations provisoires et ce qui les retient, écarts au
   socle (ADR « proposé »), invariants provisoires du socle, avertissements restants.
