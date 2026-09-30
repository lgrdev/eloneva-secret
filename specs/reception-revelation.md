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
- **RG-1** — À l'ouverture de l'URL `/s/<identifiant>`, le serveur indique seulement si le secret existe, sans renvoyer le contenu et sans le consommer. S'il existe, l'écran « Déverrouiller le secret » s'affiche, sans le contenu. S'il n'existe pas (déjà lu, expiré, inexistant ou identifiant mal formé), l'écran affiche « Le secret a déjà été lu ou a expiré. Il n'est plus disponible. » sans bouton « Révéler ».
- **RG-2** — L'ouverture de l'URL seule ne consomme pas le secret : seul le clic sur le bouton le révèle.
- **RG-3** — L'écran de déverrouillage affiche le bouton central « Révéler le secret maintenant » et, à côté, le texte « Le secret sera supprimé définitivement après lecture. »
- **RG-4** — Au clic, le navigateur envoie une requête `POST` ; le serveur renvoie le contenu, le type et l'heure de destruction, et supprime le secret de Valkey dans la même opération (lecture et suppression atomiques). Aucune requête `GET` ne renvoie le contenu.
- **RG-5** — Les pages `/s/<identifiant>` sont servies avec `Cache-Control: no-store`, `X-Robots-Tag: noindex` et `Referrer-Policy: no-referrer`.
- **RG-6** — L'écran « Secret révélé & détruit » affiche :
  - un badge rouge « Secret supprimé de la mémoire du serveur » ;
  - le contenu dans un bloc de code, avec un bouton de copie rapide ; un secret de type Lien est affiché en texte, non cliquable ;
  - l'avertissement « Ce contenu sera perdu définitivement si vous rafraîchissez ou fermez la page. » ;
  - un reçu d'audit : heure de destruction fournie par le serveur, affichée dans le fuseau du navigateur au format `30/09/2026 à 14:32:05`. La mention du chiffrement zéro-connaissance est traitée dans S04.
- **RG-7** — Sur l'écran révélé, le navigateur demande une confirmation avant de quitter ou de recharger la page.
- **RG-8** — Panne serveur ou Valkey indisponible avant la révélation (à l'ouverture ou au clic) : par exception à S00 RG-7, le destinataire n'est pas redirigé vers l'écran de création. Le message « Service temporairement indisponible. Veuillez réessayer plus tard. » s'affiche sur l'écran de déverrouillage, et le bouton « Révéler » reste disponible.
- **RG-9** — Si la connexion est coupée après la suppression, le secret est perdu sans avoir été affiché. Ce risque est accepté : l'expéditeur doit créer un nouveau secret.

Le champ de mot de passe de déchiffrement, l'indication « protégé » et la vérification avant suppression sont traités dans S04.

## Parcours
1. Le destinataire ouvre le lien reçu.
2. Le serveur confirme que le secret existe ; l'écran « Déverrouiller le secret » s'affiche, sans le contenu.
3. Il clique sur « Révéler le secret maintenant ».
4. L'écran « Secret révélé & détruit » affiche le contenu ; le secret est supprimé du serveur.
5. Il copie le contenu s'il le souhaite.
- Variante : le secret n'existe plus → message, sans bouton (RG-1).
- Variante : panne avant la révélation → message sur l'écran de déverrouillage, bouton disponible (RG-8).

## Données manipulées
| Donnée | Obligatoire | Format / contrainte | Donnée personnelle ? | Conservation |
|---|---|---|---|---|
| Identifiant du secret | Oui | Issu de l'URL, 32 caractères `[a-z0-9]` | Non | — |
| Type du secret | Oui | Message, Mot de passe, Lien (S01) | Non | Renvoyé avec le contenu |
| Contenu du secret | Oui | Texte (opaque pour le serveur) | Potentiellement | Supprimé à la révélation |
| Heure de destruction | Oui | Fournie par le serveur à la révélation | Non | Affichée seulement |

## Erreurs et cas limites
- Secret déjà lu, expiré, inexistant ou identifiant mal formé → RG-1 (message sans bouton).
- Secret disparu entre l'ouverture et le clic (expiré, lu par quelqu'un d'autre) → même message, sans bouton.
- Deux destinataires cliquent en même temps → un seul obtient le contenu (lecture unique).
- Panne avant la révélation → RG-8.
- Coupure après la suppression → RG-9.
- Rafraîchissement ou fermeture de l'écran révélé → confirmation du navigateur (RG-7) ; si confirmé, le contenu n'est plus disponible.
- Copie refusée par le navigateur → message « Impossible de copier dans le presse-papier. Veuillez copier manuellement. »

## Droits d'accès
| Action | Rôles autorisés |
|---|---|
| Ouvrir l'écran de déverrouillage | Toute personne possédant le lien |
| Révéler le secret | Toute personne possédant le lien (+ mot de passe si défini, S04) |

## Critères d'acceptation métier
- Étant donné un secret valide, quand le destinataire ouvre l'URL, alors le contenu n'est pas présent dans la page ni dans aucune réponse `GET` du serveur.
- Étant donné un secret valide, quand l'URL est ouverte plusieurs fois sans clic, alors le secret reste lisible.
- Étant donné un secret inexistant, déjà lu ou expiré, quand le destinataire ouvre l'URL, alors le message « Le secret a déjà été lu ou a expiré. Il n'est plus disponible. » s'affiche sans bouton « Révéler ».
- Étant donné l'écran de déverrouillage, alors le bouton « Révéler le secret maintenant » et le texte « Le secret sera supprimé définitivement après lecture. » sont affichés.
- Étant donné un secret valide, quand le destinataire clique sur « Révéler », alors une requête `POST` renvoie le contenu, le contenu s'affiche et le secret est supprimé du serveur.
- Étant donné un secret déjà révélé, quand l'URL est rouverte, alors le message de secret indisponible s'affiche.
- Étant donné un secret de type Lien révélé, alors le lien est affiché en texte et n'est pas cliquable.
- Étant donné l'écran révélé, alors le badge « Secret supprimé de la mémoire du serveur », le bouton de copie, l'avertissement de perte et l'heure de destruction au format `30/09/2026 à 14:32:05` sont affichés.
- Étant donné l'écran révélé, quand le destinataire tente de recharger ou de quitter la page, alors le navigateur demande une confirmation.
- Étant donné Valkey indisponible, quand le destinataire ouvre l'URL ou clique sur « Révéler », alors le message « Service temporairement indisponible. Veuillez réessayer plus tard. » s'affiche sur l'écran de déverrouillage, sans redirection, et le bouton reste disponible.
- Étant donné une page `/s/<identifiant>`, alors la réponse porte `Cache-Control: no-store`, `X-Robots-Tag: noindex` et `Referrer-Policy: no-referrer`.
- Étant donné deux demandes de révélation simultanées, alors une seule reçoit le contenu.
- Étant donné une révélation de secret, alors ni l'application, ni Traefik, ni Valkey n'ont écrit de journal (S00 RG-8).

## Non-fonctionnel
- Lecture et suppression atomiques côté serveur (aucune double lecture possible).

## Hors périmètre
- Mot de passe de déchiffrement, indication « protégé », vérification avant suppression et déchiffrement côté client (S04).
- Notification de l'expéditeur à la lecture.

## Dépendances
- S01 : secret créé, identifiant, type, stockage.
- S00 : règle de panne commune (S00 RG-7), à laquelle RG-8 fait exception ; zéro trace (S00 RG-8).

## Traçabilité
- Cahier des charges, « Fonctionnalités » : « Liens Autodestructeurs » (destruction après consultation).
- « Fonctionnement » : « reception ».
- « Liste des écrans » : écran 3 « Réception & Déverrouillage » et écran 4 « Secret Révélé & Détruit ».
