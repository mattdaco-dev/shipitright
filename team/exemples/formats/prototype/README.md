# Prototype Réservation de salles

Prototype cliquable statique de Réservation de salles, release MVP. Il illustre la spec UX/UI
(`docs/20-ux/spec-ux-ui.html`) et la conception fonctionnelle
(`docs/20-specs/conception-fonctionnelle.html`). Les données sont fictives.

Version v1 du 05.10.2026.

## Lancer

Aucune dépendance ni build. Depuis ce dossier :

```sh
python3 -m http.server 8765
```

puis ouvrir http://localhost:8765. Ouvrir `index.html` directement dans le navigateur fonctionne
aussi. Seule ressource externe : la police Inter, chargée depuis Google Fonts.

La démo tourne toujours le **lundi 05.10.2026 à 10:20** (`NOW` dans `data.js`) : les cases passées du
jour sont grisées, la première heure de début proposée est 10:30.

Comptes fictifs : `lea.martin@example.com` (employé) et `paul.schmit@example.com` (gestionnaire), tout
mot de passe non vide. Une autre adresse, ou un mot de passe vide, donne l'erreur d'identifiants.

## Design system

Le prototype reprend le design system du projet : `ds/` contient les fichiers que le socle déclare pour
le prototype, copiés tels quels. `styles.css` ne contient aucune couleur, police ni espacement en dur,
seulement la mise en page et les variables de `ds/proto-alias.css`.

- Socle : `reservation-salles` v0.1 du 05.10.2026 (`socles/design-systems/reservation-salles/`).
- Fichiers copiés dans `ds/` : `tokens.css`, `proto-alias.css`.
- Composants du DS utilisés tels quels : aucun, le socle ne livre pas d'implémentation. Remplaçants du
  kit, nommés comme dans le DS : bandeau de navigation, bouton (principal, secondaire, destructif),
  champ, liste déroulante, sélecteur de date (jours désactivables, saisie JJ.MM.AAAA), tableau,
  dialogue, bandeau de message, squelette.
- Compléments de la spec : grille d'occupation (EC-02), sa liste de créneaux libres sous 768 px,
  badge « Série » (EC-05).

## Ce qu'il montre

La barre noire du haut pilote la démo. Elle ne fait pas partie du produit : c'est le composant
partagé `proto-bar.js` (skill `proto-bar`, v1.1.0), copié tel quel, jamais modifié ici.

- **Profil** : Employé (Léa Martin) ou Gestionnaire (Paul Schmit). Le gestionnaire a en plus l'entrée
  « Parc de salles » (EC-06, EC-07) et « Annuler avec un motif » dans l'infobulle d'une réservation
  (EC-02). Passer en Employé sur EC-06 ou EC-07 renvoie sur EC-02 avec MSG-U10.
- **Données** : avec ou sans données, pour voir les états vides (EC-02, EC-03, EC-05, EC-06).
- **Serveur** : « Refuse » fait refuser l'envoi de EC-04 par le serveur (état hors règles, MSG-03),
  le cas qu'aucun sélecteur ne laisse produire.
- **États** : nominal, chargement (squelettes ; formulaires inactifs avec indicateur dans le bouton),
  erreur (message qui nomme la cause et `Réessayer`).
- **Réinitialiser le proto** : efface les modifications enregistrées, la session et les réglages.

## Parcours à dérouler en G1

1. **PF-01** Connexion en Léa, clic sur une case libre de la grille, « Réserver » : bandeau MSG-02 sur
   EC-05. Pour le conflit (MSG-01) : dans EC-04, choisir Alzette à 14:30, réservée par Tom Hoffmann.
2. **PF-02, exemple de CALC-01** : EC-04 sur Moselle, mardi 06.10.2026 de 10:00 à 11:00, « Chaque
   semaine » jusqu'au 29.12.2026 : 13 occurrences, le 20.10 est pris, le dialogue propose de créer les
   12 libres.
3. **PF-03** : EC-05, « Annuler » sur la série du mercredi (Sûre) : choix occurrence ou série. La
   réservation de 10:00 du jour (Alzette) est commencée : pas de bouton « Annuler » (RG-03).
4. **PF-04** : profil Gestionnaire. Infobulle d'une réservation, « Annuler avec un motif » ; EC-06,
   « Désactiver » une salle (annonce du nombre de réservations futures annulées, MSG-06) ; EC-07, nom
   déjà pris (« Our »). Léa voit le motif sur EC-05 (MSG-05).

## Écrans et états couverts

| Écran | Accès | États couverts | Stories |
|---|---|---|---|
| EC-01 Connexion | `#EC-01` | nominal, chargement, erreur d'identifiants (MSG-U01), retour à la page demandée | US-001 |
| EC-02 Occupation du jour | `#EC-02/day=AAAA-MM-JJ&room=<id>` | nominal, filtre sur une salle, week-end, jour passé, vide (MSG-U02), chargement, erreur (MSG-U03), droits (pas d'annulation pour l'employé) ; dialogue `EC-02-motif` | US-002, US-003, US-017 |
| EC-03 Recherche de salle | `#EC-03/day=AAAA-MM-JJ` | nominal, aucun résultat (MSG-U04), chargement, erreur (MSG-U05) | US-004 |
| EC-04 Réservation | `#EC-04/room=<id>&day=…&start=HH:MM` | nominal, série avec récapitulatif, conflit (MSG-01), hors règles (MSG-03), « Jusqu'au » à plus de 3 mois, enregistrement, erreur (MSG-U06) ; dialogue `EC-04-conflits` (MSG-04) | US-005, US-006 |
| EC-05 Mes réservations | `#EC-05` | nominal, confirmation (MSG-02), série, annulée avec motif (MSG-05), commencée sans « Annuler », vide (MSG-U07), chargement, erreur (MSG-U08) ; dialogue `EC-05-annuler` | US-007, US-008, US-009 |
| EC-06 Parc de salles | `#EC-06` | nominal, salle désactivée (MSG-06), vide (MSG-U02), chargement, erreur (MSG-U09), droits insuffisants (MSG-U10) ; dialogue `EC-06-desactiver` | US-014, US-015, US-016 |
| EC-07 Fiche salle | `#EC-07` (nouvelle), `#EC-07/<id>` | nominal vide ou prérempli, nom déjà pris (RG-10), chargement, erreur (MSG-U11), droits insuffisants (MSG-U10) | US-014, US-015 |

Règles visibles : RG-01 (conflit à l'envoi, 10:00 et 10:00 ne se chevauchent pas), RG-02 et RG-03
(listes au quart d'heure de 08:00 à 19:00, 4 heures au plus, calendrier sans passé ni week-end, cases
passées grisées), RG-04 et CALC-01 (série quotidienne ou hebdomadaire, 3 mois au plus), RG-05
(dialogue des conflits), RG-06 (occurrence ou série), RG-07 (motif obligatoire), RG-08 (salle
désactivée hors grille, réservations futures annulées, celle en cours gardée), RG-09 (recherche),
RG-10 (nom unique parmi les actives), RG-11 (seuls le titulaire et le gestionnaire annulent).

Clavier dans la grille : les flèches déplacent d'une case, « Entrée » ouvre la case ou l'infobulle,
« Échap » ferme infobulle, calendrier et dialogue.

Les modifications sont gardées dans le `localStorage` du navigateur, sous le préfixe `resasalles.`.

## Écarts avec la spec

- Deux textes de la spec n'ont pas d'identifiant : l'annonce du dialogue de désactivation et « Une
  salle active porte déjà ce nom. ». Ils sont dans `MESSAGES` sous l'ancre de la spec
  (`EC-06-desactiver`, `EC-07-nom`).
- Sans texte dans la spec, ces champs sont seulement signalés invalides (bordure, `aria-invalid`) :
  jour saisi au clavier hors règles (EC-04, EC-03), « Jusqu'au » au-delà de 3 mois, nom vide et
  capacité hors de 1 à 200 (EC-07).
- Ajouts de démo, hors produit : la note des comptes fictifs sous le formulaire de EC-01, la légende
  sous la grille d'occupation.
- Le titre de EC-07 est « Fiche salle » en création comme en modification, faute de titre dans la spec.
- Une salle sans équipement affiche « aucun ».

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page et chrome de l'application |
| `proto-bar.js` | Barre du prototype, copie du composant partagé |
| `ds/` | Fichiers du design system, copiés depuis le socle |
| `styles.css` | Mise en page, à partir des variables de `ds/proto-alias.css` |
| `data.js` | Horloge simulée, règles, profils, salles, réservations, messages (`MSG-xx`, `MSG-Uxx`) |
| `app.js` | État, routage par hash, une fonction de rendu par écran, dialogues, règles simplifiées |

## Limites connues

- Pas de serveur : le conflit est contrôlé dans le navigateur, sans concurrence (Q-001).
- Les jours fériés ne sont pas exclus des séries (hypothèse de CALC-01, Q-005).
- Pas de modification d'une réservation (US-011, release R2) ni de réactivation d'une salle (Q-004).
- La date et l'heure sont figées : rien ne « passe » pendant la démo.
- L'état chargement et l'état erreur de la barre s'appliquent à tout l'écran courant ; sur EC-02, le
  sélecteur de jour reste actif, comme le dit la spec.
