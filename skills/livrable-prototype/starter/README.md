# Prototype NOM_PROJET

Prototype cliquable statique de NOM_PROJET. Il illustre la spec UX/UI
(`docs/20-ux/spec-ux-ui.html`) et la conception fonctionnelle
(`docs/20-specs/conception-fonctionnelle.html`). Les données sont fictives.

## Lancer

Aucune dépendance ni build. Depuis ce dossier :

```sh
python3 -m http.server 8765
```

puis ouvrir http://localhost:8765. Ouvrir `index.html` directement dans le navigateur fonctionne
aussi. Seule ressource externe : la police, chargée depuis Google Fonts si le design system l'y prend.

## Design system

Le prototype reprend le design system du projet (`.team/socle.md`) : `ds/` contient les fichiers que
le socle déclare pour le prototype, copiés tels quels. `styles.css` ne contient aucune valeur, seulement
la mise en page et des alias vers les tokens du DS.

- Socle : <nom et version du DS>
- Fichiers copiés dans `ds/` : <liste>
- Composants du DS utilisés tels quels : <liste> ; remplaçants du kit : <liste>

## Ce qu'il montre

La barre noire du haut pilote la démo. Elle ne fait pas partie du produit : c'est le composant
partagé `proto-bar.js` (skill `shipitright:proto-bar`), copié tel quel, jamais modifié ici.

- **Profil** : <liste des profils et de ce qui change pour chacun>.
- **Données** : avec ou sans données, pour voir les états vides.
- **États** : nominal, chargement (squelettes), erreur (message et `Réessayer`).
- **Réinitialiser le proto** : efface les modifications enregistrées et revient à l'état initial.

## Écrans et états couverts

| Écran | Accès | États couverts | Stories |
|---|---|---|---|
| EC-01 Liste | `#EC-01` | nominal, vide, chargement, erreur | US-xxx |
| EC-02 Détail | `#EC-02/<id>` | nominal, introuvable, droits insuffisants, chargement, erreur ; dialogue EC-02-supprimer | US-xxx |
| EC-03 Formulaire | `#EC-03/<id>?from=<écran>` | nominal, champ obligatoire vide, droits insuffisants (redirection et bandeau), chargement, erreur | US-xxx |

Les modifications sont gardées dans le `localStorage` du navigateur, sous le préfixe `nomprojet.`.

## Largeurs vérifiées

390, 768, 1024 et 1280 px : aucun défilement horizontal de la page. <comportements propres au produit>

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page et chrome de l'application |
| `proto-bar.js` | Barre du prototype, copie du composant partagé |
| `ds/` | Fichiers du design system, copiés depuis le socle |
| `styles.css` | Mise en page et alias vers les tokens du DS |
| `data.js` | Profils, statuts, données fictives, messages par identifiant (`MSG-xx`, `MSG-Uxx`), libellés `LABELS` |
| `app.js` | État, routage par hash, garde de droits, une fonction de rendu par écran, dialogues |

## Limites connues

- <ce que le prototype ne montre pas, ou simule sans calcul métier>
