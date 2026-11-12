---
name: livrable-prototype
description: Produit ou met à jour le prototype cliquable d'un projet ShipItRight (HTML, CSS et JS vanilla, statique, sans build, données fictives, barre proto-bar, un écran par EC-xx de la spec UX), à partir du kit de départ. À utiliser en phase P2 par l'UX/UI Designer, ou par le Dev frontend en renfort, pour créer le prototype, ajouter un écran ou un état, ou corriger le proto après un retour de G1.
allowed-tools:
  - "Bash(cp -R ${CLAUDE_PLUGIN_ROOT}/skills/livrable-prototype/starter/ *)"
  - "Bash(cp ${CLAUDE_PLUGIN_ROOT}/skills/proto-bar/proto-bar.js *)"
  - "Bash(mkdir prototype/ds)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Livrable : prototype

Le prototype est la **version cliquable de la spec UX/UI**. Le PO le présente à l'humain au gate G1 :
c'est souvent la première fois que le métier voit le produit. Il doit donc couvrir les parcours
principaux avec des données crédibles, et rester assez simple pour être corrigé en quelques minutes
après un retour.

- **Auteur** : UX/UI Designer. **Contributeur** : Dev frontend.
- **Phase** : P2, en même temps que la spec UX/UI. Passe le gate **G1**, validé par l'humain.
- **Dossier** : `prototype/`.
- **Kit de départ** : [`starter/`](starter/) (`index.html`, `styles.css`, `data.js`, `app.js`,
  `README.md`), à copier puis adapter.

Pas de `template.html` ici : `check-livrable.mjs` ne s'applique pas au prototype. La vérification se
fait par la checklist de la section « Livrer ».

## Exemple

`${CLAUDE_PLUGIN_ROOT}/team/exemples/formats/prototype/` : le prototype du pilote « Réservation de salles », 7 écrans,
4 dialogues, grille de planning, connexion simulée, responsive. Il suit ce skill et sert de référence.

## Entrées à lire

1. `.team/socle.md`, puis le socle de design system : section « Prototype » (fichiers à copier dans
   `ds/`, composants utilisables tels quels), composants, ton, formats.
2. `docs/20-ux/spec-ux-ui.html` : design system appliqué, wireflow, inventaire des écrans `EC-xx`,
   états, dialogues, messages `MSG-xx` et `MSG-Uxx`, formats propres au produit.
3. `docs/20-specs/story-map.html` : parcours de la release MVP, à couvrir en priorité.
4. `docs/20-specs/conception-fonctionnelle.html` : rôles et droits (profils de la barre), règles
   `RG-xx` qui changent l'affichage, messages au mot près.
5. Le skill `shipitright:proto-bar` (`${CLAUDE_PLUGIN_ROOT}/skills/proto-bar/SKILL.md`) : branchement de la barre et
   contrat des trois états.

## Démarrer

```sh
cp -R ${CLAUDE_PLUGIN_ROOT}/skills/livrable-prototype/starter/ prototype/
cp ${CLAUDE_PLUGIN_ROOT}/skills/proto-bar/proto-bar.js prototype/
mkdir prototype/ds
```

Une commande par appel Bash. Puis copier dans `ds/` les fichiers que la section « Prototype » du
socle de design system désigne : Read de chaque fichier, puis Write dans `prototype/ds/`.

Copier `proto-bar.js` tel quel, ne jamais le modifier ni surcharger ses classes `.pb-*`. Puis
remplacer `NOM_PROJET` et le préfixe `nomprojet.` partout, et remplacer les écrans d'exemple (`EC-01` à `EC-03`) par ceux de la spec.

**Langue** : lire la langue du projet dans `.team/projet.json` (`langue`, `fr` sans ce fichier) et la
reporter dans `PROTO.lang` (`app.js`, passée à `ProtoBar.mount`) et dans `<html lang="…">`
(`index.html`). Tout le texte visible du proto est rédigé dans cette langue ; les textes d'exemple du
kit sont en français et se remplacent. Pour une langue autre que `fr` et `en`, passer aussi
`labels` à la barre (skill `shipitright:proto-bar`). Les formats (`fmtDate`, `fmtMoney`) suivent le
design system et la langue.

Le kit fournit déjà :

- le chargement de `ds/tokens.css` et `ds/proto-alias.css`, des styles sans valeur en dur, responsive ;
- l'état central `S`, une fonction de rendu par écran, inscrite dans le registre `SCREENS` ;
- le routage par hash avec un id et des paramètres nommés : `#EC-03/D-1001?from=EC-01`, lus par
  `params()`, écrits par `go(screen, id, { from: 'EC-01' })`, pour préremplir un écran ;
- la **garde de droits** : un écran déclaré `right: 'edit'` dans `SCREENS`, ouvert par l'URL sans ce
  droit, renvoie à l'accueil avec son message (`denied: 'MSG-Uxx'`) en bandeau ;
- le **motif de dialogue** : registre `DIALOGS` indexé par l'ancre de la spec (`EC-02-supprimer`),
  ouverture depuis un bouton (`data-action="open-dialog"`), bouton par défaut non destructif
  (`data-autofocus`), Échap et clic extérieur ferment, focus piégé, retour du focus au bouton ;
- les messages `MESSAGES` par identifiant et les libellés `LABELS` (titres de dialogue, textes à partie
  variable), remplis par `msg('MSG-04', { n, total })` et `label(...)` ;
- les trois états de la barre, un état vide, un profil sans droit d'édition, un bandeau à usage unique,
  un toast, la persistance `localStorage` préfixée ;
- un tableau qui devient une carte par ligne sous 768 px (`table.stack`, `td data-label`).

Une **connexion simulée** n'est pas dans le kit : si la spec a un écran de connexion, la garde de
`render()` s'étend à la session (sans session, toute page mène à l'écran de connexion puis revient à la
page demandée). L'exemple `${CLAUDE_PLUGIN_ROOT}/team/exemples/formats/prototype/` le montre.

## Contenu

| Élément | Niveau | Ce qu'on y attend |
|---|---|---|
| Design system dans `ds/` | obligatoire | les fichiers que la section « Prototype » du socle désigne (`tokens.css`, `proto-alias.css`, composants s'il y en a), copiés tels quels ; aucune valeur de couleur, police ou espacement dans `styles.css` |
| Barre `proto-bar` | obligatoire | copiée depuis le skill `shipitright:proto-bar`, montée au démarrage avec titre, version, date, langue du projet et préfixe |
| Parcours principaux | obligatoire | tous les parcours de la release MVP de la story map, navigables de bout en bout |
| Un écran par `EC-xx` | obligatoire | chaque écran de l'inventaire de la spec UX, avec son id dans le code et dans l'URL ; les dialogues de la spec s'ouvrent depuis leur écran, avec les mêmes actions que le wireflow |
| Trois états | obligatoire | nominal, chargement (squelettes à la place du contenu), erreur (cause nommée et `Réessayer`) sur chaque écran qui affiche des données |
| Responsive | obligatoire | chaque écran et chaque dialogue utilisable de 390 à 1280 px et plus, sans défilement horizontal de la page ; points de rupture du DS ; un composant large (tableau, planning) défile dans son propre cadre `.scroll-x` ; comportements propres au produit décrits dans la spec UX (Compléments et écarts) |
| Données fictives | obligatoire | toutes dans `data.js`, crédibles, aucune donnée réelle |
| `README.md` | obligatoire | lancer, ce que montre la barre, tableau écrans et états couverts avec leurs stories, limites connues |
| Profils et rôles | recommandé | un réglage `Profil` dans la barre, un profil par rôle de la matrice de droits |
| États vides | recommandé | réglage `Données` (avec / aucune) ou équivalent, message au mot près de la spec |
| Variantes | recommandé | réglage `Variante` quand la spec hésite entre deux solutions à faire trancher en G1 |
| Droits insuffisants | recommandé | ce que voit un profil qui n'a pas le droit (masqué, désactivé, message) |
| Visite guidée | facultatif | parcours commenté pour la démo G1, bouton dans la barre |

## Règles pour qu'il reste rapide à modifier

- **Données séparées du rendu.** Profils, objets, statuts et messages vivent dans `data.js`. Un
  libellé ou un chiffre se change à un seul endroit.
- **Chaque écran est une fonction de rendu** `renderEC01()`, inscrite dans le registre `SCREENS` sous
  sa clé `'EC-01'`. Ajouter un écran : une fonction, une ligne dans `SCREENS`, une ligne au README.
  Chaque dialogue est une entrée de `DIALOGS` sous l'ancre que la spec lui donne.
- **Les identifiants `EC-xx` sont dans le code** (registre, commentaire de la fonction, hash) :
  `grep EC-04` trouve tout ce qui concerne l'écran.
- **Pas de framework, pas de build, pas de dépendance** hors la police Inter de Google Fonts. Tous
  les chemins sont relatifs : le dossier s'ouvre tel quel ou se publie sur GitHub Pages.
- **Événements délégués sur `document`** (`data-go`, `data-action`) : le rendu remplace le HTML sans
  rebrancher d'écouteurs.
- **Toutes les clés `localStorage` portent le préfixe** passé à `ProtoBar.mount`, sinon
  « Réinitialiser le proto » ne remet pas la démo à zéro.
- **Le design system vient du socle, jamais du proto.** `ds/` se copie tel quel ; `styles.css` ne
  contient que la mise en page et utilise les variables de `ds/proto-alias.css`. Un composant que le DS
  fournit s'utilise tel quel ; les classes du kit (`.btn`, `.table`, `.tag`) ne sont que des remplaçants.
- **Les libellés sont ceux de la spec, au mot près.** Les messages vivent dans `MESSAGES`, sous leur
  identifiant (`'MSG-01'`, `'MSG-U03'`). Un texte qui manque se demande à l'UX ou au BA, il ne
  s'invente pas dans le proto.
- **Les formats sont ceux du DS** : adapter `fmtDate` et les autres helpers aux formats du socle.
- **Responsive toujours.** Le proto se conçoit pour toutes les largeurs dès le premier écran, pas en
  rattrapage : grilles fluides, la navigation passe à la ligne sous 1024 px, une colonne sous 768 px.
- **Rien de la barre dans le produit** : les éléments `sticky` utilisent `top: var(--proto-bar-h)`,
  les overlays démarrent sous la barre (`inset: var(--proto-bar-h) 0 0 0`).

## Livrer

1. Ouvrir `prototype/index.html` (ou `python3 -m http.server` dans le dossier) et dérouler chaque
   parcours MVP de bout en bout.
2. Checklist :
   - la barre s'affiche, chaque réglage propre agit sur l'écran ;
   - chaque `EC-xx` de la spec est atteignable et rend ses trois états ;
   - « Réinitialiser le proto » ramène à l'état initial ;
   - aucune erreur dans la console, `node --check` passe sur chaque `.js` ;
   - responsive : à 390, 768, 1024 et 1280 px, chaque écran et chaque dialogue s'affiche sans
     défilement horizontal de la page (`document.documentElement.scrollWidth` égal à la largeur) ;
   - aucune valeur en dur dans `styles.css` : `grep -E '#[0-9a-fA-F]{3,6}\b|[0-9]+px' styles.css` ne
     trouve que des dimensions de mise en page ;
   - le README liste les écrans et états couverts, et les écarts avec la spec.
3. Incrémenter `version` et `date` dans `app.js` (constante `PROTO`) à chaque livraison.
4. Capturer chaque écran à l'état nominal pour les vignettes de la spec UX
   (`docs/20-ux/captures/EC-xx-nominal.png`, 1280 × 800 au ratio 16:10 des vignettes, recadrée sous
   la barre), mettre à jour la section « Lien vers le
   prototype » de la spec, et signaler au PO que le proto est prêt pour G1.
