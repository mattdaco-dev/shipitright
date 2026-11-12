---
name: livrable-sprint
description: Produit ou met à jour la page d'un sprint de la team ShipItRight (objectif, stories engagées, capacité, tickets et vagues de parallélisation, avancement, review, rétro avec ses problèmes, actions et évolutions proposées pour le plugin, métriques), en page HTML à partir du gabarit. À utiliser par le Scrum Master au sprint planning, pendant le sprint pour l'avancement, puis après la recette pour la review et la rétro.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Livrable : page de sprint

Une page par sprint, enrichie en trois temps : **planning** (ce qu'on s'engage à livrer et dans quel
ordre), **avancement** (où en sont les tickets), **review et rétro** (ce qui a été livré, ce qu'on
change). Elle donne au PO et à l'humain la vue d'ensemble du sprint sans ouvrir le board.

- **Auteur** : Scrum Master. Contributeurs : Architecte (découpage), PO (choix des stories), tous les
  agents via les sections Rétro de leurs tickets.
- **Phase** : chaque sprint. Complète au gate **G3** (review et rétro remplies après la recette).
- **Fichier** : `docs/sprints/sprint-N.html`.
- **Gabarit** : [`template.html`](template.html), à copier puis remplir. Copier, c'est lire
  `${CLAUDE_PLUGIN_ROOT}/skills/livrable-sprint/template.html` avec Read, puis l'écrire à sa place dans le
  projet avec Write.

Les tickets de `.team/board/` restent la source de vérité des statuts et des briefs. La page les
résume et les relie ; elle ne les remplace pas.

## Entrées à lire

| Temps | Entrées |
|---|---|
| Planning | stories choisies par le PO (`docs/20-specs/stories/`) et leurs notes techniques (endpoints, traitements, entités, tableau scénario, élément, écran), conception détaillée (`docs/30-conception/detaillee/index.html` : pages des endpoints, traitements, entités, vue par écran `transverse/ecrans.html`), version et journal des changements du contrat d'API après le passage de l'architecte, `docs/roadmap.html`, page du sprint précédent (actions de rétro) |
| Avancement | front matter des tickets `.team/board/T-*.md` et `BUG-*.md` (statut, dépendances), `.team/journal.md`, sujets ouverts de `.team/forum/` |
| Review et rétro | sections Rapport, Revue et Rétro des tickets et des anomalies du sprint, `.team/journal.md` (passe d'intégration, blocages, heures d'agents), sujets de `.team/forum/`, `docs/40-qa/campagne-sprint-N.html` (verdict, résultats par scénario, commit recetté), `docs/50-recette/pv-sprint-N.html` (verdict de l'humain, réserves `RES-xx`), estimation des stories dans `docs/roadmap.html` |

## Contenu

| Section | Temps | Niveau | Ce qu'on y attend |
|---|---|---|---|
| Objectif du sprint | planning | obligatoire | une phrase qui dit ce que l'humain pourra faire à la fin du sprint |
| Stories engagées | planning | obligatoire | `US-xxx`, epic, nombre de scénarios, dépendances de story et leur état, DoR vérifiée ; état de la matrice de couverture |
| Capacité | planning | obligatoire | instances par rôle (celles du QA nommées, une par ticket `e2e`), plus grosse vague face à la cible (3) et au maximum (5) |
| Tickets et vagues | planning | obligatoire | version du contrat d'API au planning, opérations du lot et leur état, opérations figées à ce planning ; table des `T-xxx`, tickets `e2e` compris (rôle, stories, produit et consomme, dépend de, contrat `fige` ou vide, vague de départ) ; vagues datées et chemin critique ; fichiers partagés de chaque vague avec leur décision, ou « aucun » |
| Avancement | sprint | obligatoire | compteurs par statut ; une ligne par ticket puis par anomalie `BUG-xxx` du sprint : instance, statut, tours de revue, date de merge, constat bloquant ou blocage |
| Review | après G3 | obligatoire | livré par story avec son résultat de recette, pas livré avec sa raison et sa suite, DoD du sprint critère par critère avec sa preuve, objectif atteint |
| Rétro | après G3 | obligatoire | un seul panel en quatre parties : À garder, sourcé ; Problèmes `Sn-Pm` (constat, poids, sources) ; Actions `Sn-Am` (ce qui change, problème cité, nature, propriétaire, critère de fait, échéance) ; Évolutions proposées pour le plugin `Sn-Em` (fichier du plugin, avant, après, action liée, décision de l'humain) |
| Métriques | après G3 | obligatoire | tickets prévus et fermés, tours de revue moyens et maximum, anomalies par sévérité et suite, tickets bloqués et durée ; temps estimé et réel des stories livrées, en heures d'agents, reportés dans le calibrage de la roadmap |
| Risques et blocages | sprint | recommandé | blocages et risques, sujets de forum, questions au PO en attente, avec leur état ; un blocage résolu garde sa ligne |
| Suivi des actions précédentes | planning | recommandé | actions `Sn-Am` de la rétro précédente, en lien vers `sprint-<n-1>.html#S<n-1>-A<m>` : faites, en cours, abandonnées, avec la preuve tirée du sprint |

Pendant le sprint, les sections review, rétro et métriques gardent leurs emplacements `.todo` : la
page est KO au contrôle tant que le sprint n'est pas clos, c'est attendu.

## Règles de qualité

- **Le découpage part de la conception détaillée.** Elle couvre toute l'application et ne contient
  pas de tickets : au planning, le SM et l'architecte taillent les tickets dans les pages des
  endpoints, traitements et entités touchés par les stories du lot, et dans la vue par écran pour le
  front. Un traitement (`TR-xx`) partagé par deux endpoints du lot est produit par un seul ticket,
  dont les autres dépendent.
- **Pas de ticket sur une opération provisoire.** L'architecte fige au planning les opérations
  provisoires des stories du lot, avant le découpage ; une story dont une opération reste provisoire
  sort du sprint.
- **Une vague ne contient que des tickets dont les dépendances sont fermées.** Un ticket frontend
  qui consomme une opération figée ne dépend pas du ticket backend qui la produit : il part dans la
  même vague, sur un mock. Trois tickets en parallèle en cible, cinq au maximum. Un ticket `e2e` n'a
  pas de dépendance : il part dans une vague de dev et se met au point au fil des merges, il peut donc
  fermer après les vagues suivantes ; la colonne Vague dit où il part.
- **Chaque vague déclare ses fichiers partagés.** Un fichier que plusieurs tickets de la même vague
  modifieraient à la main (routes, registre de modules, catalogue de libellés, types d'échange) est
  listé dans la table Fichiers partagés avec sa décision : généré par script avant la vague, découpé
  (un fichier par ticket, chargé par convention), ou un seul ticket porteur, que le brief des autres
  cite. Une vague sans fichier partagé porte « aucun ». Le SM la remplit au planning avec
  l'architecte, en lisant l'organisation du code.
- **Le non-livré a sa raison** : bloqué par quoi, découpage trop gros, revue non convergente. Pas de
  « manque de temps ». Une réserve `RES-xx` du PV en fait partie, avec sa raison et sa suite.
- **La review ne recopie ni la campagne ni le PV.** Elle cite leur verdict et renvoie à eux : la DoD du
  sprint (`${CLAUDE_PLUGIN_ROOT}/PROCESS.md`, section 7) se vérifie critère par critère, tenu ou non tenu, avec le lien qui
  le prouve. Le chemin de recette déroulé par l'humain tient lieu de démo : pas de section démo.
- **La rétro part des faits.** Chaque point cite un ticket, un post forum ou un événement du journal.
  Un problème vu dans plusieurs sections Rétro passe en tête.
- **Une chaîne, une seule source par sujet.** La rétro tient dans un seul panel : À garder, Problèmes,
  Actions, Évolutions proposées pour le plugin. Le constat, le poids et les sources ne s'écrivent que
  dans le problème `Sn-Pm`. Ni section d'actions à part, ni liste « à essayer » : un essai est une
  action de nature « essai d'un sprint ».
- **Identifiants.** `Sn-Pm` (problème), `Sn-Am` (action), `Sn-Em` (évolution), préfixés du numéro du
  sprint de la page (`S2-P1` sur `sprint-2.html`), numérotés à partir de 1, uniques au projet. Chacun
  est l'`id` de sa ligne, donc la cible de lien `sprints/sprint-2.html#S2-P1`. Pas de `Sn` seul pour
  un sprint, et pas de confusion avec un scénario `US-xxx/Sn`.
- **Toute action cite au moins un `Sn-Pm` et porte une nature** : `essai d'un sprint` (jugé à la rétro
  suivante : gardé, rendu durable ou abandonné) ou `changement durable`. **Chaque `Sn-Pm` a au moins
  une action.**
- **Une action a un propriétaire et un critère de fait.** « Mieux découper » ne passe pas ; « l'Architecte
  plafonne un ticket à deux endpoints, vérifié au planning » passe.
- **Toute évolution cite une `Sn-Am` et vise un fichier du plugin**, en chemin depuis la racine du
  plugin (`PROCESS.md`, `agents/…`, `skills/…`, `team/…`). Un changement propre au projet (socle,
  organisation du code, conventions du dépôt, fichiers sous `docs/`, `.team/`, `src/`) est une action,
  pas une évolution. L'évolution ne redit pas la raison : elle est dans le problème de son action.
- **Review, métriques et risques renvoient aux identifiants.** Un sujet traité par la rétro ne s'y
  réexplique pas : un lien vers `#Sn-Pm` ou `#Sn-Am` suffit.
- **Une dette acceptée a sa suite au backlog.** Chaque dette ou limite acceptée de la section
  Risques et blocages renvoie à une story ou à un ticket `backlog` avant la planification suivante ;
  celle qui n'en a pas encore donne une action, au PO (avec le BA pour une limite fonctionnelle).
- **Le SM propose, il ne modifie pas.** Une évolution proposée pour le plugin (`PROCESS.md`, fiche
  d'agent, convention, skill) est écrite comme proposition (texte avant, texte après) ; le PO la
  soumet à l'humain avec la recette, et la colonne Décision garde sa réponse. En attendant, l'action
  liée la couvre. Acceptée, elle s'applique dans le dépôt du framework ShipItRight, jamais dans le
  plugin installé.
- **Les métriques se comptent dans le board**, pas de mémoire : front matter des tickets, et le
  journal pour les durées. Les deux temps sont en heures d'agents. L'estimé d'une story vient de
  l'estimation de la roadmap ; le réel est la somme des heures d'agents de ses tickets, du lancement de
  chaque agent à son rapport, revues et corrections comprises, relevées au journal (lignes `dispatch`
  et `rapport`), moins les interruptions externes (de la ligne `incident` à la ligne `reprise`). Le SM reporte les deux dans `rules.calibration.sprints` de la roadmap, ou les donne au
  PO qui la met à jour.
- **Chaque section a son (i)** : `<div class="info-body" hidden>` juste après le `h2`, avec une
  `<dl class="defs">` : À quoi sert, Contenu, Pourquoi ce formalisme, puis au besoin Lire (même règle
  que la campagne, la conception détaillée et la macro). Pas de paragraphe d'explication visible sous un
  titre.

## Livrer

1. **Planning** : copier le gabarit en `sprint-N.html`, remplacer `NOM_PROJET` et `N`, remplir les
   sections du planning, statut `planifié`. Les tickets sont créés dans `.team/board/` en parallèle.
2. **Avancement** : statut `en cours` dès la première vague ; mettre à jour la section après chaque
   synchro de vague.
3. **Après G3** : remplir review, rétro (problèmes, actions, évolutions proposées pour le plugin),
   métriques. Statut `clos`.
4. Vérifier : `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-livrable.mjs docs/sprints/sprint-N.html`.
   Sur une page de sprint, le script contrôle la chaîne de la rétro : ancres `#Sn-…` existantes, action
   liée à un `Sn-Pm` et de nature connue, évolution liée à une `Sn-Am` (erreurs) ; problème sans
   action, préfixe différent du numéro de la page, évolution qui vise un fichier du projet
   (avertissements).
5. Rendre au PO les évolutions proposées pour le plugin (`Sn-Em`), en tête du rapport.
