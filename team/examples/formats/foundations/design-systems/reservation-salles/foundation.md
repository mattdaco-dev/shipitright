---
type: design-system
name: reservation-salles
version: v0.1 (05.10.2026)
status: example
---

# Socle : design system minimal de Réservation de salles

Design system minimal posé par l'UX en P2, faute de design system imposé au projet. Il ne couvre que
ce dont le MVP a besoin ; un design system d'entreprise le remplacerait sans toucher à la spec UX/UI,
qui ne fait que le citer.

## Sources

| Source | Type | Accès | Contenu |
|---|---|---|---|
| Ce dossier | dossier | `foundations/design-systems/reservation-salles/` | tokens, composants, règles ci-dessous |

## Ce que le socle fournit

| Élément | Valeur | Où le lire |
|---|---|---|
| Tokens | couleurs, typographie, espacements, rayons | `tokens.css` |
| Composants | bandeau de navigation, bouton, champ, liste déroulante, sélecteur de date, tableau, dialogue, bandeau de message, squelette | `components.md` |
| Responsive | points de rupture 768 et 1280 px ; une colonne sous 768 px | `components.md`, section Grille |
| Accessibilité | WCAG 2.1 AA ; focus visible ; contrastes 4,5:1 (texte) et 3:1 (composants) | ce fichier |
| Ton | vouvoiement, phrases courtes, la cause puis l'issue dans un message d'erreur | ce fichier |
| Formats de données | date JJ.MM.AAAA, heure HH:MM (24 h), nombres avec espace insécable pour les milliers | ce fichier |

## Prototype

Fichiers à copier dans `prototype/ds/` :

| Fichier du proto | Source |
|---|---|
| `ds/tokens.css` | `tokens.css` de ce socle |
| `ds/proto-alias.css` | `proto-alias.css` de ce socle (noms du kit vers tokens du DS) |

Composants : pas d'implémentation ; le prototype utilise les remplaçants du kit.

## Par rôle

| Rôle | Ce qu'il lit | Ce qu'il en tire |
|---|---|---|
| UX/UI Designer | tout | spec UX/UI : cite les composants, ne décrit que les écarts |
| BA | ton, formats | libellés des `MSG-xx` |
| Dev frontend | `tokens.css`, `components.md` | importe `tokens.css`, implémente les composants une fois |
| QA, Relecteur | accessibilité, formats | recette et revue |

## Écarts

Un composant propre au produit (la grille d'occupation) est décrit dans la spec UX/UI, puis ajouté ici
s'il sert à plus d'un écran.
