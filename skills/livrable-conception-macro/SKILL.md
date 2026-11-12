---
name: livrable-conception-macro
description: Produit ou met à jour la conception technique macro d'un projet ShipItRight (schéma de la chaîne écran, fonctionnalité, endpoint, traitement, entité, applications déployables, stack, persistance, systèmes externes, flux asynchrones, exigences non fonctionnelles, sécurité, ADR, risques), en page HTML à partir du gabarit. À utiliser en phase P3 par l'Architecte, après G1, ou quand la conception macro doit être reprise après une relecture ou un changement de périmètre.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Livrable : conception technique macro

La conception macro dit **ce qu'il faut construire et où** : quelles applications, quels endpoints,
quelles entités, quelles dépendances. Elle suit le formalisme de la chaîne écran-endpoint-entité :
une chaîne lue de gauche à droite, des badges qui transforment le schéma en backlog. La conception
détaillée de toute l'application en part (une page par endpoint, traitement, entité), puis le
découpage en tickets au sprint planning.

- **Auteur** : Architecte. Relecture de faisabilité par le Dev backend et le Dev frontend.
- **Phase** : P3. Passe le gate **G2** (humain, après la vérification du Scrum Master ; relu par les équipes
  technique et d'architecture).
- **Fichier** : `docs/30-conception/macro.html`.
- **Gabarit** : [`template.html`](template.html), à copier puis remplir. Copier, c'est lire
  `${CLAUDE_PLUGIN_ROOT}/skills/livrable-conception-macro/template.html` avec Read, puis l'écrire à sa place dans le
  projet avec Write.

## Entrées à lire

- `docs/00-cadrage/cadrage.html` : contraintes, périmètre.
- `docs/20-specs/` : conception fonctionnelle, epics, stories `US-xxx`, règles `RG-xx`.
- `docs/20-ux/spec-ux-ui.html` : inventaire des écrans `EC-xx` et leurs interactions.
- `.team/socle.md` : socles retenus par le projet. Puis le socle de stack (`socle.md`, `conformite.md`,
  dans `.team/socles/stacks/<nom>/`, ou dans la source qu'il désigne) : couches, versions, organisation du code,
  outillage, commandes. `${CLAUDE_PLUGIN_ROOT}/PROCESS.md`, section 8 : ce qui reste constant quel que soit le socle.
- `docs/adr/index.html` (registre des ADR) s'il existe déjà.

## Le schéma : chaîne écran-endpoint-entité

La chaîne se lit de gauche à droite :

```
Écran → Fonctionnalité → Endpoint → Traitement → Entité
```

Écrans et fonctionnalités vivent dans un conteneur **Application** (`.container.app`), endpoints,
traitements et entités dans un conteneur **Domaine** (`.container.dom`). Chaque flèche qui traverse la
frontière est un contrat entre front et back. Les domaines voisins et les systèmes externes se placent
à droite.

Balisage (voir le gabarit, qui contient un exemple complet) :

- `.diagram > .chain` contient les conteneurs ; chaque conteneur a un `.c-title` et des `.cols` ;
  chaque `.col` a un `.col-title` et des `.node`.
- Types de nœud : `screen`, `feature`, `endpoint`, `process` (traitement non exposé), `entity`,
  `external`, `topic`, `attention` (question non tranchée).
- **Tout le projet, un seul schéma** : le schéma couvre toutes les releases de la story map (MVP, releases R2,
  R3…), pas seulement la prochaine. Chaque bloc porte `data-release="MVP|R2|…"` : la première release
  qui en a besoin. Un bloc d'une release antérieure qu'une release modifie porte en plus
  `data-adapted="R2 R3"`. Un nouvel élément d'une release suivante est un bloc à part ; un bloc
  adapté reste un seul bloc (principe 4).
- **Filtre de périmètre** : `<div class="release-filter" data-releases="MVP R2 R3"></div>` juste après
  le bandeau de cadrage. doc.js le rend en barre collante. « Projet complet » montre tout, avec
  l'étiquette de release de chaque bloc. Une release montre ses blocs en TODO et, en contexte, les
  blocs des releases précédentes qu'elle appelle (DONE) ou qu'elle adapte (TO UPDATE). Les lignes de
  tableau qui portent `data-release` ne s'affichent que pour leur release. `?release=R2` dans l'URL
  ouvre la page sur une release.
- Badges : `data-badge="todo"` sur chaque bloc à créer (projet neuf : tous). Le filtre pose lui-même
  TODO, TO UPDATE et DONE selon la release choisie ; ne pas écrire `update` ni `done` à la main dans
  le schéma. Sans badge, l'élément existe et convient (système externe, existant hors projet).
- Compteurs : `<div class="kpi" data-count="screen|feature|endpoint|process|entity">` ; doc.js compte
  les blocs affichés et écrit la répartition (par release, ou à créer / à adapter / déjà faits).
- **Id d'un bloc identifié = son identifiant** : `id="EC-01"`, `id="EP-08"`, `id="TR-02"`,
  `id="EN-05"`, en majuscules, comme le texte du bloc. La conception détaillée et ses liens s'y
  accrochent. Les blocs sans identifiant (fonctionnalité, topic, externe, composant partagé) gardent
  un id libre en minuscules (`f-reserver`, `ext-01`).
- Traitements : identifiant `TR-xx`, repris dans la conception détaillée. Un traitement naît quand
  la logique sert à deux appelants ou plus, quand c'est un calcul ou un algorithme du domaine qui
  mérite d'être testé seul, quand c'est un effet en cascade (une action qui en entraîne d'autres sur
  d'autres objets), ou quand rien ne l'appelle (tâche planifiée, message). Sinon, la logique reste
  dans l'endpoint et n'a pas de bloc.
- Points d'attention : bloc `attention` qui porte la question complète. Quand une `Q-xxx` existe, le
  bloc est un lien : `<a class="node attention" href="../questions.html#Q-xxx"><b>Q-xxx</b> question</a>`.
- Composant de mise en page partagé (bandeau de navigation) : bloc `screen` sans id `EC-xx`, admis.
- Flèches : `data-links="id1 id2|libellé_avec_underscores"` sur le nœud de départ, qui pointe vers le
  nœud d'arrivée. doc.js trace la flèche ; un id inconnu est signalé dans la console du navigateur.
  Le libellé est facultatif, les `_` deviennent des espaces.
- Placement automatique : doc.js cale la hauteur de chaque bloc sur les blocs qui l'appellent (à
  défaut, ceux qu'il appelle), garde l'ordre de la colonne et l'écart minimum, et écarte deux blocs
  sans lien qui seraient au même niveau. L'auteur ne règle que l'ordre dans chaque colonne.
- Deux modes de tracé, au choix du lecteur au-dessus du schéma (mémorisé par le navigateur) :
  **Courbes** (défaut, Bézier de port à port) et **Angles droits** (routés autour des blocs, badges et
  titres compris, deux virages au plus). En angles droits, les flèches d'un même bloc partagent leur
  tronc, celles qui vont au même bloc se fondent dans un collecteur unique, une flèche ne suit jamais
  le couloir d'une flèche sans rapport, et il n'y a pas de point de jonction. Ne jamais dessiner une
  flèche à la main ni ajouter de style aux `.node`.
- Lecture : survoler un bloc allume sa chaîne (amont et aval) ; cliquer ouvre la chaîne seule dans une
  vue centrée, démêlée, avec son propre sélecteur de mode. Rien à écrire pour cela.
- Libellés : posés en pastille sur leur propre flèche, à un endroit où rien d'autre ne passe. Sans
  place nette (tronc partagé, couloir trop serré), la flèche porte un numéro et le texte part dans la
  légende sous le schéma. Garder les libellés courts (deux à quatre mots).
- Lisibilité : ranger les blocs de chaque colonne par epic, de haut en bas, regrouper ceux qui
  partagent une cible, mettre en bas d'une colonne ceux qui partent vers les systèmes externes. Ne pas
  réduire les écarts entre zones, colonnes et blocs : ce sont les couloirs des flèches.
- Le sens des flèches suit les appels : écran vers fonctionnalité, fonctionnalité vers endpoint,
  endpoint vers traitement ou entité, traitement vers entité, traitement vers le traitement qu'il
  appelle (`TR → TR` admis). **Un topic pointe vers le traitement qui le consomme**, jamais l'inverse.

### Lien avec la conception détaillée

- La page charge `detaillee/xref.js` juste avant doc.js (déjà dans le gabarit). Ce fichier est généré
  par `${CLAUDE_PLUGIN_ROOT}/team/scripts/detaillee-pages.mjs` (skill `shipitright:livrable-conception-detaillee`) ; tant qu'il
  n'existe pas, la macro s'affiche sans liens, sans erreur gênante.
- **Liens et icône `{ }` viennent du moteur** : doc.js fait de l'id écrit dans un bloc un lien vers sa
  page détaillée et pose sur chaque endpoint l'icône `{ }` de ses schémas (↑ envoyé, ↓ reçu). Ne
  jamais écrire de lien ni d'icône à la main dans un bloc.
- **Toute flèche de la macro vers un `EN` ou un `TR` existe dans la détaillée** (`x-entities`,
  `x-processes` d'une opération, `meta entites` et `traitements` d'un traitement) : sinon le
  générateur sort en erreur. La détaillée peut préciser des accès plus fins, signalés en
  information : les reporter dans la macro s'ils comptent pour la lecture.
- Dans les autres livrables, un lien vers `EP-xx`, `EN-xx` ou `TR-xx` cible sa page de la détaillée
  (`30-conception/detaillee/endpoints/EP-xx.html`…), avec repli sur `macro.html#EP-xx` tant que la
  page n'existe pas (`${CLAUDE_PLUGIN_ROOT}/team/glossaire.md`).

### Principes du modèle (règles, recopiées dans la légende)

1. Les écrans présentent des fonctionnalités. Une fonctionnalité peut servir plusieurs écrans.
2. Une fonctionnalité repose sur un ou plusieurs endpoints ou services externes.
3. Endpoints et traitements portent sur une ou plusieurs entités.
4. **Une entité et un endpoint n'apparaissent qu'une fois.** Deux fonctionnalités qui partagent un
   endpoint : deux flèches convergent. C'est ce qui montre la réutilisation.
5. Endpoint (exposé, appelable) et traitement (calcul, batch, envoi, consommation) occupent deux
   colonnes distinctes.
6. Un appel vers un autre domaine part d'un endpoint ou d'un traitement, jamais d'une fonctionnalité.
7. **Un topic (bus de messages) n'atteint jamais une entité.** Il pousse vers un traitement, qui écrit dans
   l'entité. Le topic vit dans le conteneur du domaine qui le publie.
8. **Le verbe HTTP est dans le bloc endpoint**, jamais sur la flèche : `GET POST /ressources`. Les
   flèches restent nues, sauf pour dire ce que les blocs ne disent pas (ce qu'on va chercher chez un
   externe, ce que transporte un flux).
9. Un bloc `external` est un système, pas une donnée. Un système appelé pour trois raisons reste un
   seul bloc ; la flèche dit ce qu'on y cherche.
10. **Système externe = externe à l'organisation.** Un outil d'une autre équipe interne est un
    domaine voisin (`.container.dom` à son nom, avec les seuls endpoints consommés). Aucun bloc
    externe sur le schéma : l'écrire dans la légende, c'est un résultat.
11. **Libellés en français lisible** : « Demande d'équipement », pas `DemandeEquipement`. Les chemins
    d'endpoint restent littéraux.

## Contenu

**Chapeau fixe** : le texte sous le `h1` (`p.lede`) est commun à toutes les conceptions techniques
macro. Il dit l'objectif de la macro et renvoie à la conception technique détaillée, dont le chapeau
lui répond. Il se recopie tel quel du gabarit et ne se personnalise pas : ni compteurs, ni noms
d'objets, ni stack. Le résumé du projet va dans « Projet en bref ».

| Section | Niveau | Ce qu'on y attend |
|---|---|---|
| Bandeau de cadrage | obligatoire | légende (un nœud de chaque type, les badges TODO, TO UPDATE, DONE, les conteneurs) et principes, objectifs de cette conception, sujet (couvert : tout le projet, exclu), projet en bref (dix lignes), date et version des specs sources |
| Filtre de périmètre | obligatoire | `.release-filter` avec les releases de la story map, juste après le bandeau |
| Schéma de la chaîne technique | obligatoire | compteurs `data-count`, puis le schéma unique de tout le projet, ids `EC-xx`, `EP-xx`, `TR-xx`, `EN-xx` dans les blocs, `data-release` sur chaque bloc, `data-adapted` sur les blocs adaptés |
| Applications et conteneurs déployables | obligatoire | chaque unité déployable : rôle, techno, port, dépendances, image ou service Compose |
| Stack retenue et écarts | obligatoire | référence et version du socle de stack, choix qu'il laisse ouverts, écarts seulement (chacun avec ADR « proposé », remonte à l'humain) ; le socle n'est pas recopié |
| Persistance par entité | obligatoire | store retenu par `EN-xx` et justification (forme des données, transactions, volumétrie, requêtes) |
| Exigences non fonctionnelles | obligatoire | performance, disponibilité, sécurité, observabilité, accessibilité : cible chiffrée et moyen |
| Sécurité et authentification | obligatoire | cinq cartes : authentification, rôles (tableau rôle / droits), autorisation, données sensibles, secrets ; listes courtes |
| Décisions d'architecture | obligatoire | une phrase et le lien vers le registre `docs/adr/index.html` ; ni liste, ni statut, ni écart (le registre les porte). Un ADR se cite par son lien là où il justifie un choix |
| Systèmes externes et contrats | recommandé | par système : ce qu'on y cherche, protocole, contrat, propriétaire, disponibilité, mode dégradé |
| Flux asynchrones | recommandé | topics : producteur, consommateurs, clé, garantie de livraison, schéma |
| Environnements | recommandé | local (selon le socle), test, démo : ce qui tourne où, données |
| Risques techniques | recommandé | risque, impact, probabilité, parade ; lignes triées par impact puis probabilité, `data-release` sur les risques propres à une release |
| Points d'attention | recommandé | questions non tranchées (`Q-xxx` si posées au PO), hypothèses |

## Règles de qualité

- **Le bandeau de cadrage n'est jamais vide.** Sans lui, le schéma ne se relit pas dans trois mois.
- **Les explications de section vont dans le bouton « i »** : `<div class="info-body" hidden>` juste
  après le `h2`, avec une `<dl class="defs">` au format de la conception détaillée (skill
  `livrable-conception-detaillee`) : **À quoi sert**, **Contenu**, **Pourquoi ce formalisme**, puis au
  besoin **Lire** et **Source** ; un `dd` d'une ou deux phrases, une liste au-delà de trois éléments,
  rien qui répète la section. Pas de paragraphe d'explication visible sous un titre, pas de notes en vrac sous le
  schéma : une précision sur un endpoint ou un traitement va dans la conception détaillée.
- **Chaque story du projet remonte à au moins un écran et un endpoint.** Vérification de l'auteur et du
  relecteur, sans tableau dans le livrable. Relire le schéma à l'envers, release par release avec le
  filtre :
  une entité sans endpoint, un endpoint sans fonctionnalité, une fonctionnalité sans écran sont des
  signaux. Soit il manque un bloc, soit c'est hors périmètre et le sujet le dit.
- **Les ids des blocs sont ceux des autres livrables** : `EC-xx` de la spec UX, `EP-xx`, `TR-xx` et
  `EN-xx` repris tels quels dans la conception détaillée et `openapi.yaml` (`x-endpoint-id`).
- **Chaque flèche pointe vers un id existant.** Après modification du schéma, ouvrir la page et
  vérifier, dans les deux modes et sur chaque position du filtre, qu'aucune flèche ne manque (console :
  `unknown link target` ou `no route for link`). Une flèche sans route est tracée en ligne droite de
  secours : réordonner les blocs jusqu'à ce que le message disparaisse. **Jamais de découpage en
  plusieurs schémas** : l'unicité des blocs passe avant ; le filtre et la vue de focus servent la
  lecture.
- **Une persistance se justifie.** Le nom d'un store ne suffit pas, « base documentaire : document
  imbriqué lu en entier, pas de jointure » suffit.
- **Une exigence non fonctionnelle porte une cible.** « Rapide » ne passe pas ; « p95 < 300 ms sur la
  recherche » passe.
- **Toute déviation au socle de stack** a son ADR au statut « proposé » (skill `shipitright:livrable-adr`) et figure
  dans les écarts. Le PO la remonte à l'humain avant le sprint.
- **Pas de socle fourni par l'humain** : l'Architecte crée le socle de stack dans le projet, `.team/socles/stacks/<nom>/`
  (`socle.md`, `conformite.md`, format `${CLAUDE_PLUGIN_ROOT}/team/conventions/socle.md`) et la macro y renvoie. L'humain
  valide la stack à G2.
- **Aucune règle métier inventée.** Un doute fonctionnel devient un point d'attention ou une question
  au PO.

## Livrer

1. Copier le gabarit, remplacer `NOM_PROJET`, remplacer le schéma d'exemple par le schéma réel,
   remplir chaque section, justifier en une ligne les sections recommandées sans objet.
2. Écrire les ADR dans `docs/adr/` (skill `shipitright:livrable-adr` : une page HTML par décision, registre
   `docs/adr/index.html` généré par `${CLAUDE_PLUGIN_ROOT}/team/scripts/adr-pages.mjs`), les citer par leur lien là où ils
   justifient un choix, et faire de la section « Décisions d'architecture » une phrase et le lien
   vers le registre.
3. Vérifier : `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-livrable.mjs docs/30-conception/macro.html`.
   Une fois la conception détaillée posée, vérifier le dossier entier
   (`check-livrable.mjs docs/30-conception`), qui lance le générateur en `--check` :
   une flèche de la macro absente de la détaillée est une erreur.
4. Demander la relecture de faisabilité des devs (post forum mentionnant `dev-backend` et
   `dev-frontend`), intégrer les retours, passer le statut à `en revue`. Pour un exemple de format
   (`${CLAUDE_PLUGIN_ROOT}/team/exemples/`), la relecture est faite par le PO.
5. Signaler dans le rapport les écarts au socle de stack, le socle créé s'il y en a un, et les
   points d'attention qui doivent remonter à l'humain.
