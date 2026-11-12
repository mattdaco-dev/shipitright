---
name: livrable-cadrage
description: Produit ou met à jour le livrable "Cadrage et vision" d'un projet ShipItRight (vision, problème, objectifs, personas, périmètre, contraintes, questions ouvertes), en page HTML à partir du gabarit. À utiliser en phase P0, quand le PO mène l'entretien de cadrage avec l'humain, ou quand le cadrage doit être corrigé après un retour.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Livrable : cadrage et vision

Le cadrage fixe **pourquoi** on construit, **pour qui**, et **jusqu'où**. C'est l'entrée de toutes les
autres phases : un BA, un UX ou l'architecte doit pouvoir démarrer à froid en le lisant.

- **Auteur** : PO, avec l'humain (seule phase entièrement interactive).
- **Phase** : P0. Passe le gate **G0**, validé par l'humain.
- **Fichier** : `docs/00-cadrage/cadrage.html`.
- **Gabarit** : [`template.html`](template.html), à copier puis remplir. Copier, c'est lire
  `${CLAUDE_PLUGIN_ROOT}/skills/livrable-cadrage/template.html` avec Read, puis l'écrire à sa place dans le
  projet avec Write.

## Mener l'entretien

Le PO n'écrit pas le cadrage seul à partir de l'expression du besoin : il interroge l'humain, une
question à la fois, en proposant sa réponse pressentie quand il en a une. Chaque question passe
par l'outil de questions structurées (`AskUserQuestion`), réponse pressentie en première option. Une question
à réponse libre (nom, URL, liste) se pose directement dans le message. Méthode : chaque réponse ouvre
la branche suivante de l'arbre de décision, et on continue jusqu'à une compréhension partagée, sans
laisser de branche non résolue ; un point qui ne se tranche pas devient une question ouverte. Ordre conseillé : problème, utilisateurs, objectifs, périmètre, contraintes (dont la stack et le
design system), règles métier connues. Ce qui reste flou après l'entretien devient une **question ouverte** avec un
propriétaire, jamais une invention.

## Contenu

| Section | Niveau | Ce qu'on y attend |
|---|---|---|
| Vision | obligatoire | énoncé de vision en une ou deux phrases, et pitch structuré (pour, qui, le produit est, qui, contrairement à, notre produit) |
| Problème et contexte | obligatoire | situation actuelle, irritants, coût de l'inaction |
| Objectifs et indicateurs | obligatoire | 3 à 5 objectifs, chacun mesurable avec une cible |
| Utilisateurs cibles | obligatoire | un persona par profil d'usage : objectifs, frustrations, fréquence, aisance. Identifiant `PER-xx` en ancre de la carte et en tête du titre, initiale du rôle dans l'avatar |
| Périmètre | obligatoire | dedans, dehors (avec la raison), plus tard |
| Contraintes | obligatoire | réglementaires, techniques (dont les socles de stack et de design system retenus, ou à créer), calendrier, avec leur source |
| Questions ouvertes | obligatoire | id `Q-xxx`, propriétaire, ce qu'elles bloquent. Liste vide : l'écrire |
| Règles métier connues | recommandé | règles déjà exprimées, numérotées `RG-xx` |
| Hypothèses et risques | recommandé | impact et parade |
| Glossaire | recommandé | termes métier et définition partagée |
| Parties prenantes | recommandé | rôles, intérêt, implication (décide, consulté, informé) |
| Existant et alternatives | facultatif | outils actuels, solutions du marché |
| Jalons envisagés | facultatif | grandes étapes connues |

## Règles de qualité

- **Des rôles, jamais des personnes** : « le gestionnaire sinistres », pas un prénom.
- **Un objectif sans indicateur n'est pas un objectif.** « Améliorer l'expérience » ne passe pas ;
  « réduire le temps de déclaration de 15 à 5 minutes » passe.
- **Le hors périmètre porte sa raison.** Sans elle, la question reviendra à chaque sprint.
- **Aucune règle métier inventée.** Ce que l'humain n'a pas dit va en question ouverte.
- **Les termes du glossaire sont repris au mot près** dans tous les livrables suivants.

## Livrer

1. Copier le gabarit, remplacer `NOM_PROJET`, remplir chaque section, supprimer les sections
   facultatives sans objet.
2. Déclarer les socles dans `.team/socle.md` (format : `${CLAUDE_PLUGIN_ROOT}/team/conventions/socle.md`).
   Le plugin n'en embarque aucun : demander à l'humain sa stack et son design system (dossier, dépôt
   git, MCP, skill, URL) et en écrire le manifeste dans `.team/socles/<type>/<nom>/socle.md`. S'il
   n'en a pas : l'écrire, avec son auteur (architecte en P3 pour la stack, UX en P2 pour le design
   system), qui le créera dans `.team/socles/`.
3. Vérifier : `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-livrable.mjs docs/00-cadrage`.
4. Ouvrir la page et la présenter à l'humain pour G0. Statut `validé` une fois accepté, avec la date.
5. Reporter les questions ouvertes dans `.team/questions/` et régénérer la page de pilotage
   (`node ${CLAUDE_PLUGIN_ROOT}/team/scripts/pilotage-pages.mjs .`, skill `shipitright:livrable-pilotage`).
