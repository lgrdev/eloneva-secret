---
id: S03
titre: Réception et révélation d'un secret
depend_de: [S01]
---

# Réception et révélation d'un secret

## Contexte et objectif
Permettre au destinataire d'ouvrir le lien reçu et de révéler le secret par une action volontaire, puis de le détruire définitivement du serveur. Le contenu n'apparaît pas à l'ouverture de l'URL, pour éviter une lecture accidentelle par un robot ou par l'aperçu automatique d'une application de messagerie.

Maquettes : `docs/design/eloneva_secret_d_verrouiller_le_secret/`, `docs/design/eloneva_secret_secret_r_v_l_d_truit/`.

## Utilisateurs et rôles
- Destinataire (visiteur anonyme possédant le lien) : révèle le secret.

## Règles métier
- **RG-1** — L'ouverture de l'URL `/s/<identifiant>` affiche un écran « Déverrouiller le secret » sans le contenu du secret.
- **RG-2** — L'ouverture de l'URL seule ne consomme pas le secret : seul le clic sur le bouton le révèle.
- **RG-3** — Bouton central « Révéler le secret maintenant », avec une confirmation explicite que le clic purgera le secret du serveur. mettre un texte avertissant à côté du bouton : le secret sera supprimé après lecture.
- **RG-4** — Au clic, le contenu est affiché et le secret est supprimé de Valkey.
- **RG-5** — L'écran « Secret révélé & détruit » affiche :
  - un badge rouge confirmant la suppression de la clé de la mémoire Valkey ;
  - le contenu dans un bloc de code, avec un bouton de copie rapide ; un secret de type Lien est affiché en texte, non cliquable ;
  - un avertissement : le contenu est perdu définitivement si la page est rafraîchie ou fermée ;
  - un reçu d'audit : heure exacte de destruction. La mention du chiffrement zéro-connaissance est traitée dans S04.

Le champ facultatif de mot de passe de déchiffrement est traité dans S04.

## Parcours
1. Le destinataire ouvre le lien reçu.
2. L'écran « Déverrouiller le secret » s'affiche, sans le contenu.
3. Il clique sur « Révéler le secret maintenant ».
4. L'écran « Secret révélé & détruit » affiche le contenu ; le secret est supprimé du serveur.
5. Il copie le contenu s'il le souhaite.

## Données manipulées
| Donnée | Obligatoire | Format / contrainte | Donnée personnelle ? | Conservation |
|---|---|---|---|---|
| Identifiant du secret | Oui | Issu de l'URL | Non | — |
| Contenu du secret | Oui | Texte | Potentiellement | Supprimé à la révélation |

## Erreurs et cas limites
- Secret déjà lu, expiré → > toaster "Le secret a déjà été lu ou a expiré. Il n'est plus disponible."
- Identifiant inexistant ou mal formé → > toaster "Le secret a déjà été lu ou a expiré. Il n'est plus disponible."
- Deux destinataires cliquent en même temps → un seul obtient le contenu (lecture unique).
- Rafraîchissement de l'écran « révélé » → le contenu n'est plus disponible.

## Droits d'accès
| Action | Rôles autorisés |
|---|---|
| Ouvrir l'écran de déverrouillage | Toute personne possédant le lien |
| Révéler le secret | Toute personne possédant le lien (+ mot de passe si défini, S04) |

## Critères d'acceptation métier
- Étant donné un secret valide, quand le destinataire ouvre l'URL, alors le contenu n'est pas présent dans la page ni dans la réponse du serveur.
- Étant donné un secret valide, quand l'URL est ouverte plusieurs fois sans clic, alors le secret reste lisible.
- Étant donné l'écran de déverrouillage, alors le bouton « Révéler le secret maintenant » et la mention de la purge sont affichés.
- Étant donné un secret valide, quand le destinataire clique sur « Révéler », alors le contenu s'affiche et le secret est supprimé du serveur.
- Étant donné un secret déjà révélé, quand l'URL est rouverte, alors le contenu n'est plus accessible.
- Étant donné un secret de type Lien révélé, alors le lien est affiché en texte et n'est pas cliquable.
- Étant donné une révélation de secret, alors ni l'application, ni Traefik, ni Valkey n'ont écrit de journal (S00 RG-8).
- Étant donné l'écran révélé, alors le badge de destruction, le bouton de copie, l'avertissement de perte et l'heure de destruction sont affichés.
- Étant donné deux demandes de révélation simultanées, alors une seule reçoit le contenu.

## Non-fonctionnel
- Lecture et suppression atomiques côté serveur (aucune double lecture possible).

## Hors périmètre
- Mot de passe de déchiffrement et déchiffrement côté client (S04).
- Notification de l’expéditeur à la lecture.

## Dépendances
- S01 : secret créé, identifiant.

## Traçabilité
- « Liens Autodestructeurs » (destruction après consultation).
- « reception » (l. 43-45).
- Écran 3, « Réception & Déverrouillage » (l. 70-72).
- Écran 4, « Secret Révélé & Détruit » (l. 75-78).
