---
name: livrable-qa
description: Produit ou met à jour les livrables QA d'un projet ShipItRight, en pages HTML à partir des gabarits. La stratégie de test (niveaux, outillage, environnements, données, critères d'entrée et de sortie, matrice de couverture Gherkin vers tests, anomalies, non-régression) en P3, puis la campagne de test de chaque sprint (passages et commits recettés, résultats par scénario, anomalies BUG-xxx, non-régression, non fonctionnel, relevé des tests, verdict QA). À utiliser par le QA en phase P3 et à l'étape QA de chaque sprint, avant la pré-recette.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Livrable : stratégie et campagnes de test

Le QA prouve que chaque critère Gherkin des stories est tenu par un test qui passe. La stratégie fixe
les règles une fois pour le projet ; chaque sprint produit une campagne qui les applique et donne un
verdict avant la recette.

| Livrable | Phase | Fichier (depuis la racine du projet) | Gabarit |
|---|---|---|---|
| Stratégie de test | P3 | `docs/40-qa/strategie.html` | [`template-strategie.html`](template-strategie.html) |
| Campagne de test | chaque sprint, étape QA | `docs/40-qa/campagne-sprint-N.html` | [`template-campagne.html`](template-campagne.html) |

- **Auteur** : QA. Contributeurs : Dev backend et Dev frontend (tests unitaires, testabilité).
- **Gate** : la stratégie passe à **G2**, avec la conception. Une campagne passe à **G3** : le PO ne
  prépare la recette que sur une campagne au verdict favorable, avec ou sans réserves.
- Le QA écrit les tests e2e et les anomalies. Il ne corrige pas le code.

## Entrées à lire

- `docs/20-specs/stories/US-xxx-<slug>.html` : critères d'acceptation en Gherkin, la base de toute la couverture.
- `docs/20-ux/spec-ux-ui.html` : écrans et états (nominal, vide, chargement, erreur).
- `.team/socle.md` puis le socle de stack (`socle.md`, dans `.team/socles/stacks/<nom>/`, ou dans la
  source qu'il désigne) : outils de test unitaire,
  commandes de build, de test et de démarrage. Ne pas les écrire de mémoire.
- `docs/30-conception/macro.html` : exigences non fonctionnelles, environnements.
- La conception détaillée (`docs/30-conception/detaillee/index.html`) : pages transverses tests
  (stratégie de test technique), erreurs (catalogue des codes d'erreur), sécurité (matrice des droits),
  écrans (vue par écran : endpoints appelés et erreurs affichées) ; pages des endpoints du lot.
- Les notes techniques des stories : tableau scénario, élément, écran, qui dit quel endpoint ou
  traitement sert chaque scénario Gherkin.
- Le contrat d'API (`docs/30-conception/api/openapi.yaml`, vue `detaillee/swagger.html`) : une valeur
  d'enum inconnue doit être tolérée par le front (`CF-59`), à couvrir quand la stratégie le prévoit.
- Pour une campagne : `docs/40-qa/strategie.html`, le plan du sprint (`docs/sprints/sprint-N.html`),
  les tickets du sprint dans `.team/board/`, les campagnes précédentes pour la non-régression.

## Outils utilisables

- **Playwright** pour les e2e, quel que soit le socle : un e2e par scénario prévu en e2e par la
  matrice, nommé avec l'id du scénario. Configuration avec `retries: 0` : un test qui passe au deuxième
  essai automatique cache une instabilité. Un projet `setup` ouvre une session par compte et par
  exécution (`storageState`) ; un test qui provoque une limitation de tentatives tourne seul, en fin de
  suite, dans son propre projet, et le second passage de la suite (« rejoué deux fois ») se lance sans
  ce projet. Sélection d'un scénario : `-g "US-xxx/Sn "`, avec l'espace, pour que
  `S1` ne prenne pas `S10` à `S19`. Les outils de test unitaire et leurs commandes sont ceux du socle
  de stack ; une commande que le socle ne fournit pas s'écrit en hypothèse.
- **Tickets e2e** : un ticket `T-xxx` de type `e2e` par lot de stories, prévu par le scrum-master au
  sprint planning dans la liste des tickets, créé par le PO et confié à une instance QA (`qa-n`).
  Circuit normal d'un ticket : sa branche et son worktree, section Revue, Relecteur frais (3 tours au
  plus), merge dans `sprint/N` par le PO, scope de commit le ticket (`test(t-031): cover US-006/S4`)
  (`${CLAUDE_PLUGIN_ROOT}/team/conventions/git.md`). La campagne tourne ensuite sur
  l'environnement de recette, au commit de `sprint/N` qui contient les tickets e2e mergés : le QA y
  démarre l'application à ce commit, noté dans la campagne, et la relance après chaque merge d'une
  correction ; une commande que le socle ne fournit pas s'écrit en hypothèse.
- **Test d'anomalie** : à l'ouverture, le QA crée la branche `bug-xxx-<slug>` depuis `sprint/N` dans
  son worktree, y commite le test `BUG-xxx` rouge, puis supprime son worktree ; le dev rouvre la même
  branche, sans la recréer, et corrige ; revue et merge comme un ticket (`${CLAUDE_PLUGIN_ROOT}/team/conventions/git.md`).
- **Un Chromium headless à toi** (Playwright du projet) : explorer l'app, lire la console et le réseau,
  capturer une preuve d'anomalie. Le Chrome DevTools MCP reste au PO (règle Ressources partagées de
  `shipitright:regles-team`).
- `agent-skills:test-engineer` et `agent-skills:test-driven-development`, s'ils sont installés : concevoir les cas,
  vérifier la qualité des tests unitaires des devs.
- `performance-audit`, `security-audit`, `gdpr-audit`, s'ils sont installés : quand la stratégie prévoit
  ces contrôles ou que le projet traite des données personnelles.

## Contenu de la stratégie

| Section | Niveau | Ce qu'on y attend |
|---|---|---|
| Périmètre et objectifs | obligatoire | ce que la stratégie couvre, ce qu'elle ne couvre pas, risques produit qui orientent l'effort |
| Niveaux de test et pyramide | obligatoire | unitaire domaine, intégration du dépôt, route, composant, e2e (un par scénario prévu en e2e), noms repris tels quels dans la matrice : qui écrit, ce que chaque niveau prouve, ordre de grandeur en nombre de tests et d'où il vient, relevé en fin de sprint ; outils et cas imposés des devs en renvoi vers la page transverse tests |
| Outillage | obligatoire | outils du QA, commande, emplacement des tests ; Playwright pour l'e2e, `retries: 0`, projets `setup` et limitation ; versionnement par tickets `e2e` ; une ligne de renvoi vers l'outillage des devs, commandes reprises du socle de stack |
| Environnements | obligatoire | les environnements de la conception macro, cités par lien, sans en ajouter : ce que le QA fait dans chacun, comment l'app est lancée pour l'e2e ; la campagne tourne sur l'environnement de recette, où le QA démarre l'application au commit noté dans la campagne et la relance après chaque merge d'une correction ; chaque mesure de performance dans l'environnement que sa cible nomme ; commande absente du socle en hypothèse |
| Données de test | obligatoire | jeu de base (lien vers sa description) ; données propres à chaque test par un seed de test indépendant des stories livrées, nom unique par exécution ; jeux des stories ; dates ; sessions (`storageState`) et test de limitation à part ; remise à zéro avant la campagne, puis par le QA après son dernier passage, avant la pré-recette ; comptes fictifs par rôle, un compte absent du jeu fictif en hypothèse ; mots de passe par variables d'environnement, jamais dans le dépôt (`CF-50`), règle de la macro citée par lien |
| Critères d'entrée et de sortie de campagne | obligatoire | conditions pour démarrer, dont les tickets e2e mergés et l'application démarrée par le QA ; conditions du verdict (favorable sans réserves, avec réserves, défavorable), dont : chaque scénario a un test au vert, l'e2e qui porte son identifiant ou, si la matrice le marque sans e2e, le test du niveau complémentaire, sauf ceux qu'une anomalie ouverte admise au verdict rend rouges (mineure, ou majeure acceptée par écrit par le PO), cités dans la campagne ; même règle pour la non-régression ; second passage de la suite sans le projet limitation |
| Matrice de couverture | obligatoire | règle de nommage ; une ligne par scénario Gherkin : moyen e2e quand ce n'est pas l'interface (seules les exceptions s'écrivent, dont « sans e2e » avec sa raison), niveau complémentaire, nommé par un niveau de la pyramide. Complète à G2 ; mise à jour au sprint planning pour une story ajoutée ou modifiée après G2. Pas de statut : l'avancement est dans la campagne |
| Gestion des anomalies | obligatoire | sévérités définies, format `BUG-xxx`, test `BUG-xxx` pour toute anomalie (qui porte aussi `US-xxx/Sn` si elle touche un scénario), commité rouge sur la branche `bug-xxx-<slug>` créée par le QA, circuit de traitement |
| Non-régression | obligatoire | un critère de sortie en dépend ; ce qui est rejoué à chaque sprint, critère d'ajout à la suite, test instable, nouvelle version du contrat d'API |
| Tests non fonctionnels | obligatoire | un critère de sortie en dépend ; intégrité, performance, disponibilité, sécurité, accessibilité, RGPD : contrôle avec son outil, son nombre de mesures et son environnement, seuil cité tel que la macro l'écrit, fréquence ; un seuil propre au QA est marqué comme tel, avec sa raison |
| Risques de test | facultatif | ce qui est difficile à tester, la parade, qui agit ; une demande à l'architecte par un post de forum qui lui est adressé ; il l'inscrit en point ouvert de la page cible, que la stratégie cite par lien |

## Contenu d'une campagne

| Section | Niveau | Ce qu'on y attend |
|---|---|---|
| Périmètre | obligatoire | stories du sprint ; tickets `e2e` mergés d'où viennent les tests (lien, instance QA, lot) ; environnement de recette cité par lien ; dates ; état des critères d'entrée de la stratégie, sans les recopier, constaté à la ligne de démarrage des passages (le commit est là, pas ici) |
| Passages | obligatoire | journal daté sur l'environnement de recette, une ligne par événement avec le commit de `sprint/N` : démarrage par le QA, 1er passage (projet `limitation` compris), 2e passage (sans lui), ouverture d'anomalie, redéploiement après le merge d'une correction, rejeu, 1er et 2e passages au commit recetté (le dernier commit de `sprint/N` joué, rejeux compris : une correction mergée en fin de campagne s'y rejoue deux fois), remise à zéro en dernière ligne |
| Résultats par scénario | obligatoire | un tableau par story, une ligne par scénario `US-xxx/Sn` en lien : test (« e2e », ou « sans e2e » et le niveau complémentaire que nomme la matrice), résultat aux deux passages du commit recetté (vert, rouge, bloqué, non joué), anomalie ou cause ; un bloqué ou un non joué, même avec sa cause, fait manquer le critère de sortie : verdict défavorable |
| Anomalies | obligatoire | une ligne par `BUG-xxx` en lien vers le board : scénario touché, sévérité, branche de correction, test `BUG-xxx` rouge (commit sur sa branche) puis vert (commit de `sprint/N`), ou non corrigée : son test reste sur sa branche et ne tourne pas au commit recetté ; statut du board (`fait` pour une corrigée), effet au verdict (corrigée, admise, bloque) ; une mineure admise reste en `backlog` et devient une réserve `RES-xx` du PV ; « aucune » s'écrit |
| Non-régression | obligatoire | un critère de sortie en dépend ; par story des sprints précédents : nombre de tests e2e, résultat aux deux passages, régression ou instabilité ; tests non fonctionnels des sprints précédents (nombre, deux passages) ; tests d'anomalies fermées ; version du contrat d'API et ce qu'elle fait rejouer ; ces nombres plus les e2e ajoutés au sprint font le total e2e du relevé ; premier sprint : « sans objet, aucun sprint précédent » |
| Tests non fonctionnels | obligatoire | un critère de sortie en dépend ; contrôles dus ce sprint selon leur fréquence dans la stratégie : environnement de la mesure, nombre de mesures, valeur mesurée et seuil en chiffres, statut ; preuve d'une vérification manuelle (redémarrage, lecteur d'écran…) versionnée dans `docs/40-qa/preuves/sprint-N/` et liée depuis sa ligne ; une ligne nomme les contrôles pas dus |
| Relevé des tests | obligatoire | une ligne par niveau de la pyramide, nommé au mot près : runner nommé, en lien vers l'outillage de la stratégie, nombre de tests qu'il rapporte au commit recetté, ajoutés au sprint ; un test `BUG-xxx` resté sur sa branche n'est pas compté ; les ordres de grandeur restent dans la stratégie |
| Verdict QA | obligatoire | compteurs au commit recetté (scénarios au vert, rouges admis, bloqués ou non joués, anomalies ouvertes par sévérité) ; chaque critère de sortie de la stratégie, tenu ou non tenu (deux états, un rouge admis se cite dans la preuve), avec le lien de sa preuve ; verdict ; anomalies admises et scénarios qu'elles rendent rouges ; acceptations écrites du PO, datées ; recommandation pour la recette ; même verdict dans la balise `<meta name="verdict">` (`favorable`, `favorable-avec-reserves`, `defavorable`) |

## Règles de qualité

- **Un scénario Gherkin, un test au vert, un id.** Le test est l'e2e qui porte l'id du scénario ; si
  la matrice marque le scénario « sans e2e », avec sa raison, c'est le test du niveau complémentaire
  qu'elle nomme, par un niveau de la pyramide (unitaire domaine, intégration du dépôt, route,
  composant). Au verdict, chaque test de scénario est au vert, sauf ceux qu'une anomalie ouverte admise
  au verdict rend rouges (mineure, ou majeure acceptée par écrit par le PO), cités dans la campagne ;
  même règle pour la non-régression. `US-004/S2`, notation du glossaire pour le scénario 2 de la
  story (ancre `#S2`), dans la matrice, dans le nom du test Playwright et dans la campagne. Sans cet id
  commun, la couverture ne se vérifie pas.
- **La matrice est complète à G2** : tous les scénarios des stories validées à G1. Une story ajoutée
  ou modifiée après G2 met la matrice à jour au sprint planning qui la prend.
- **Un résultat sans preuve ne compte pas.** Vert : le test existe et tourne vert. Rouge : une
  anomalie est ouverte. Bloqué ou non joué : la cause est écrite, mais le scénario n'a pas de test au
  vert, le critère de sortie est manqué et le verdict défavorable. Une vérification manuelle a sa
  preuve versionnée dans `docs/40-qa/preuves/sprint-N/`, liée depuis la campagne ; le rapport HTML de
  Playwright reste hors git.
- **Chaque résultat a son commit.** Le QA note le commit de `sprint/N` au démarrage de « Démo et
  recette », puis à chaque redéploiement après le merge d'une correction. Le verdict se fonde sur les
  deux passages du commit recetté, le dernier commit de `sprint/N` joué, rejeux compris, noté dans
  les passages et repris par le PV de recette ; une correction mergée en fin de campagne s'y rejoue
  donc deux fois. Un rouge corrigé en cours de campagne reste visible dans les passages et les
  anomalies.
- **La campagne ne recopie pas la stratégie.** Critères d'entrée et de sortie, matrice, sévérités,
  seuils, ordres de grandeur de la pyramide : cités par lien ; la campagne n'écrit que leur état, ce
  qui a été mesuré et le nombre relevé. Étapes, attendu et obtenu d'une anomalie : dans son fichier du
  board.
- **Une anomalie se reproduit** : étapes, résultat attendu, résultat obtenu, environnement, preuve
  (capture, console, réseau). Sa sévérité suit la grille de la stratégie, pas l'humeur.
- **Le verdict découle des critères de sortie**, il ne se négocie pas. Favorable sans réserves : tous les
  critères tenus, aucune anomalie ouverte. Favorable avec réserves : seules des mineures sont ouvertes, ou une majeure acceptée
  par écrit par le PO, acceptation notée dans la campagne. Défavorable : une bloquante ouverte, sans
  exception, ou une majeure ouverte non acceptée. Seule une majeure peut être acceptée. La même
  formulation vaut dans le critère de sortie, son « Lire » et le tableau des sévérités.
- **La stratégie ne recopie pas, elle cite.** Outillage et cas imposés des tests des devs sont dans
  `detaillee/transverse/tests.html` (architecte) : la stratégie y renvoie, et ce que le QA demande à
  l'architecte (un cas à ajouter, une horloge réglable) passe par un post de forum adressé à
  l'architecte, qui l'inscrit en point ouvert de la page cible ; la stratégie cite ce point ouvert par
  lien. Le QA n'écrit pas dans les pages de l'architecte. Les
  environnements et les cibles non fonctionnelles sont dans la conception macro : la stratégie les cite
  par lien et dit comment elle les vérifie, ainsi que la règle des mots de passe du jeu fictif. Le contenu
  du jeu fictif est dans l'organisation du code.
  Ce qui sert chaque scénario (endpoint, écran) est dans les notes techniques de la story.
- **La matrice dit ce qui est prévu, la campagne ce qui s'est passé.** La matrice : le moyen e2e
  quand ce n'est pas l'interface, le niveau complémentaire, « sans e2e » et sa raison. L'avancement d'un
  test et son résultat d'exécution (passé, échoué, bloqué) : dans la campagne seulement.
- **Un test ne dépend ni d'un autre test ni d'une autre story.** Il prépare ses données par le seed de
  test, sous un nom unique par exécution. Le QA remet l'environnement de recette au jeu fictif seul après son
  dernier passage, rejeux des corrections compris, avant la pré-recette.
- **Chaque section a son (i)** : `<div class="info-body" hidden>` juste après le `h2`, avec une
  `<dl class="defs">` : À quoi sert, Contenu, Pourquoi ce formalisme, puis au besoin Lire et Source
  (même règle que la conception détaillée et la macro). Pas de paragraphe d'explication visible sous un
  titre.
- **Dates relatives.** Un test e2e ne contient aucune date écrite en dur : elle passerait dans le passé.
- **Données fictives uniquement.**

## Livrer

1. Copier le gabarit voulu, remplacer `NOM_PROJET` et `N`, remplir.
2. Pour une campagne : démarrer « Démo et recette » au commit qui contient les tickets `e2e` mergés,
   le noter, jouer la suite deux fois, ouvrir les anomalies dans `.team/board/` (`BUG-xxx`, une par
   fichier, test rouge sur sa branche), relancer et rejouer après chaque merge de correction, puis
   remettre l'environnement à zéro et l'écrire en dernière ligne des passages. Les preuves des
   vérifications manuelles vont dans `docs/40-qa/preuves/sprint-N/`, liées depuis la campagne. Statut de la page :
   « en cours », puis « terminée » au verdict, repris en code dans `<meta name="statut">` (`en-cours`,
   `terminee`) ; la date de l'en-tête va aussi dans `<meta name="date">`, en ISO (`AAAA-MM-JJ`). Dans
   « Résultats par scénario » (`data-section="scenario-results"`), chaque cellule de passage porte son
   code en `data-value` : `vert`, `rouge`, `bloque`. La stratégie porte de même `<meta name="statut">`
   (`brouillon`, `en-revue`, `valide`) et `<meta name="date">`. Ces codes ne se traduisent jamais
   (`team/conventions/langue.md`).
   Au verdict, renseigner aussi la balise `<meta name="verdict">` de l'en-tête : `favorable` (sans
   réserves), `favorable-avec-reserves` ou `defavorable` ; vide tant que la campagne est en cours. La
   page de pilotage la lit (Overview, tableau des gates) : elle dit la même chose que le callout du
   verdict.
3. Vérifier : `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-livrable.mjs docs/40-qa`.
4. Rendre au PO le verdict et la liste des anomalies ouvertes, en tête du rapport.
