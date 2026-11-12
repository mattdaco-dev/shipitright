# Brief d'agent

Le brief est le seul message qu'un agent reçoit. Il est rédigé par le PO au moment du dispatch.

## Règles

- **Autonome** : l'agent ne voit pas la conversation. Tout ce qui n'est pas dans le brief ou dans un
  fichier qu'il désigne n'existe pas pour lui.
- **Comportemental, sans chemins vers le code** : on décrit le résultat attendu (types, signatures,
  critères, hors périmètre), pas les fichiers à toucher. Les chemins de code vieillissent et trompent un
  agent frais. Les chemins vers les **livrables et le ticket** sont, eux, indispensables.
- **Court** : un brief qui recopie des pages de spec est un brief raté. Il pointe vers la spec.
- **Scénarios et jeux cités** : un brief de ticket cite les scénarios `US-xxx/Sn` qu'il sert et les
  jeux de données d'exemple de la story qui les illustrent (`US-xxx/Dn`), en lien, sans les recopier. Un
  brief qui ne les cite pas ne passe pas la DoR (`PROCESS.md`, section 7).
- **État vérifié, livrables cités** : un état de l'environnement (dépendances installées, branche à
  jour, fichier généré) n'entre dans le brief que vérifié par une commande au dispatch. Un
  comportement défini par un livrable se cite par son identifiant et la version du livrable
  (`EC-xx`, `MSG-xx`, spec v0.6), sans le paraphraser.

## Gabarit

```markdown
Tu es <rôle>, instance <rôle-n>, dans la team ShipItRight. Projet : <nom>, à la racine du
dossier courant.

## Mission
<une phrase : ce que tu dois produire>

## À lire
- Ticket : .team/board/T-012-<slug>.md   (ou le livrable à produire)
- Entrées : <livrables utiles, par chemin>
- Forum : <sujets ouverts qui te mentionnent, par chemin>   (ou "aucun")
- Questions répondues récemment : <Q-xxx>                  (ou "aucune")

## Attendu
<résultat observable, critères de fin, ce qui est hors périmètre>
- Scénarios servis : <US-xxx/Sn, …>                         (ticket de code ou e2e)
- Jeux de données d'exemple : <US-xxx/Dn qui illustrent ces scénarios>   (ou « aucun dans la story »)

## Cadre
- Skill : invoque avec l'outil Skill le skill de ton livrable (shipitright:<skill>) avant de lire un
  fichier du plugin ou d'en lancer un script ; préchargé, il ne donne pas ses permissions.
- Branche / worktree : <si ticket de code>
- Scratchpad : <scratchpad>/<rôle-n>/ ; navigateur : un Chromium headless à toi, pas le Chrome
  DevTools MCP
- Budget de revue : <nombre de tours d'auto-revue>
- Autorisations particulières : <installation d'outil accordée, etc.>   (ou "aucune")

## Fin
Rapport au format team/conventions/rapport.md.
