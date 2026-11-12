---
name: livrable-spec-ux-ui
description: Produit ou met à jour le livrable "Spécifications UX/UI" d'un projet ShipItRight (principes UX, design system appliqué, parcours en wireflow, inventaire des écrans EC-xx avec leurs états, détail des écrans et messages d'interface MSG-Uxx, formats propres au produit, accessibilité), en page HTML à partir du gabarit. À utiliser en phase P2 par l'UX/UI Designer, en tandem avec le prototype, ou quand un écran doit être ajouté ou corrigé après un retour de G1.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Livrable : spécifications UX/UI

La spec UX/UI décrit **chaque écran** du produit : ce qu'il montre, ce qu'on peut y faire, comment il
se comporte dans tous ses états. Le Dev frontend code à partir d'elle, le QA y prend les libellés
exacts, le prototype en est la version cliquable.

- **Auteur** : UX/UI Designer. **Contributeur** : BA (règles et messages).
- **Phase** : P2, en même temps que le prototype. Passe le gate **G1**, validé par l'humain.
- **Fichier** : `docs/20-ux/spec-ux-ui.html`.
- **Gabarit** : [`template.html`](template.html), à copier puis remplir. Copier, c'est lire
  `${CLAUDE_PLUGIN_ROOT}/skills/livrable-spec-ux-ui/template.html` avec Read, puis l'écrire à sa place dans le
  projet avec Write.

## Entrées à lire

1. `.team/socle.md`, puis le socle de design system qu'il déclare (`.team/socles/design-systems/<nom>/`,
   et la source qu'il désigne) :
   partie « Par rôle », composants, ton, formats, accessibilité. Pas de design system déclaré : en
   créer un minimal avant la spec (voir plus bas).
2. `docs/00-cadrage/cadrage.html` : personas, contraintes (accessibilité, charte, terminaux).
3. `docs/20-specs/story-map.html` : parcours et stories de la release MVP.
4. `docs/20-specs/conception-fonctionnelle.html` : parcours fonctionnels, règles `RG-xx`, rôles et
   droits, messages au mot près.
5. `docs/20-specs/stories/` : les critères d'acceptation qui touchent l'écran.
6. `prototype/` s'il existe : la spec et le proto doivent rester alignés.

## Contenu

| Section | Niveau | Ce qu'on y attend |
|---|---|---|
| Principes UX | obligatoire | 3 à 6 principes propres au produit, chacun avec sa conséquence concrète sur les écrans |
| Design system appliqué | obligatoire | le socle cité (nom, version, statut), les composants du DS utilisés et leurs écrans, les compléments et écarts propres au produit. Jamais de tokens, de grille ni de composant recopiés |
| Parcours utilisateurs | obligatoire | wireflow natif (`.pf` avec nœuds `screen` et `screen dialog`), un schéma par persona, les actions en libellé de flèche, les PF-xx couverts en titre |
| Inventaire des écrans | obligatoire | une carte cliquable par écran `EC-xx` : vignette (capture du prototype, hachurée sinon), rôles, stories, états couverts ; tableau de couverture story → écrans |
| Détail des écrans | obligatoire | pour chaque écran : objectif, accès, contenu, actions, règles d'affichage, états (nominal, vide, chargement, erreur, droits insuffisants), messages ; dialogues sous leur écran |
| Formats de données | obligatoire | les formats du DS s'appliquent ; seulement les données propres au produit, affichage et saisie |
| Accessibilité | obligatoire | le niveau du DS, et ce que le produit ajoute (composants propres, annonces) |
| Lien vers le prototype | obligatoire | chemin du proto, version, écrans et états couverts |
| Micro-interactions | facultatif | transitions, retours visuels, temps de réponse perçus, quand le DS ne les fixe pas |

## Design system

La spec **cite** le design system, elle ne le recopie pas. Les tokens, la grille responsive, le
catalogue de composants, le ton et les formats vivent dans le socle déclaré dans `.team/socle.md`.

Projet sans design system : l'UX en crée un minimal en P2, avant la spec, dans le projet,
`.team/socles/design-systems/<nom>/`, versionné avec lui (format : `${CLAUDE_PLUGIN_ROOT}/team/conventions/socle.md`) :

- `socle.md` : manifeste, avec accessibilité, ton et formats en quelques lignes ;
- `tokens.css` : les variables CSS, reprises par le prototype et le front ;
- `composants.md` : les composants dont le MVP a besoin, leurs variantes, la grille.

Il ne couvre que le besoin du MVP et se valide à G1 avec la spec. Exemple :
`${CLAUDE_PLUGIN_ROOT}/team/exemples/formats/socles/design-systems/reservation-salles/`.

## Messages

- **Messages fonctionnels** (`MSG-xx`) : définis par le BA dans la conception fonctionnelle, repris au
  mot près et liés. Un message fonctionnel nouveau est ajouté par le BA, pas inventé ici.
- **Messages d'interface** (`MSG-Uxx`) : états vide, erreur technique, refus d'accès. Définis dans la
  spec, numérotés, ancrés (`<td id="MSG-U03">`), écrits selon le ton du DS.

## Skills utilisables

- `shipitright:proto-bar` : la barre du prototype et le contrat des trois états.
- Les skills et MCP que le socle de design system cite pour l'UX (partie « Par rôle »).
- `agent-skills:frontend-ui-engineering`, s'il est installé : qualité d'une interface de production.
- MCP Figma, facultatif : seulement si une maquette Figma existe et que son URL est donnée dans le
  brief. Ne jamais parcourir un fichier Figma de sa propre initiative.

## Règles de qualité

- **Un écran, un identifiant `EC-xx` stable**, le même dans la spec, le prototype (id de l'écran dans
  le code) et les stories (champ `ecrans`).
- **Chaque écran a une story, chaque story front a un écran.** Un écran sans story est du périmètre
  en trop ; une story sans écran est un trou.
- **Les cinq états sont décrits** pour chaque écran qui affiche des données : nominal, vide,
  chargement, erreur, droits insuffisants. Un état sans objet le dit (« pas d'état vide : la liste
  contient toujours l'utilisateur courant »).
- **Les messages s'écrivent au mot près** : `MSG-xx` repris de la conception fonctionnelle, `MSG-Uxx`
  définis ici (voir Messages).
- **Un composant se nomme comme dans le DS.** Ce que le DS n'a pas est un complément, déclaré dans
  « Design system appliqué ».
- **Une boîte de dialogue appartient à son écran** : pas d'`EC-xx` propre, une ancre `EC-xx-<nom>`.
- **Une règle d'affichage cite sa règle de gestion** (`RG-xx`) quand elle en découle.
- **Les vignettes viennent du prototype** (capture de l'écran, données fictives, recadrée sous la barre du
  proto), rangées dans `docs/20-ux/captures/EC-xx-<etat>.png`. Sans capture, garder l'emplacement.
- **Le comportement en positif** : « le bouton est désactivé tant que… », jamais « le bouton ne doit
  pas être utilisable ».

## Livrer

1. Copier le gabarit, remplacer `NOM_PROJET`, remplir chaque section. Dupliquer le bloc d'écran
   (`<h3>` et son contenu) pour chaque `EC-xx`.
2. Croiser avec le prototype : mêmes écrans, mêmes états, mêmes libellés.
3. Vérifier : `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-livrable.mjs docs/20-ux`.
4. Mettre le statut à `en revue` et signaler au PO que la spec est prête pour la passe de cohérence.
