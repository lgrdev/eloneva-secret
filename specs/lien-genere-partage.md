---
id: S02
titre: Lien généré et partage
depend_de: [S01]
---

# Lien généré et partage

## Contexte et objectif
Après la création d'un secret, montrer à l'expéditeur le lien unique à transmettre, lui donner des moyens de le diffuser (copie, QR Code, message prêt à envoyer) et le prévenir des risques.

Maquette : `docs/design/eloneva_secret_lien_g_n_r/`.

## Utilisateurs et rôles
- Expéditeur (visiteur anonyme, juste après la création) : copie et diffuse le lien.

## Règles métier
- **RG-1** — L'écran est affiché sur la route `/lien-genere`. Il reçoit l'identifiant et la date d'expiration par l'état de navigation, à la création (S01) : ils ne figurent ni dans l'URL de l'écran ni dans le stockage du navigateur.
- **RG-2** — L'URL du secret a la forme `https://secret.eloneva.com/s/<identifiant>`, où l'identifiant fait 32 caractères `[a-z0-9]` (S01 RG-10).
- **RG-3** — Si l'écran est rechargé ou ouvert sans données (accès direct), l'expéditeur est redirigé vers l'écran de création : le lien ne peut plus être réaffiché. L'écran affiche le rappel « Copiez le lien maintenant : il ne sera plus affiché. »
- **RG-4** — Un bouton copie l'URL dans le presse-papier en un clic.
- **RG-5** — Un encadré d'avertissement affiche : « Ne révélez pas le secret vous-même : le premier clic sur « Révéler » le détruit définitivement. »
- **RG-6** — Un compte à rebours affiche le temps restant avant la purge automatique, calculé à partir de la date d'expiration renvoyée par le serveur (S01 RG-11). Format : `J j HH:MM:SS` au-delà de 24 h, `HH:MM:SS` en dessous. À zéro, il affiche « Ce secret a expiré. », et le lien et les boutons de partage sont masqués.
- **RG-7** — Message prêt à envoyer : texte « Je t'ai envoyé un secret via Eloneva Secret. Il ne peut être lu qu'une fois : <URL> ». Un bouton « Partager » ouvre le partage natif du téléphone (SMS, WhatsApp…) quand il est disponible ; sinon, un bouton « Copier le message » copie le texte.
- **RG-8** — Modale « Partager via QR Code » :
  - en-tête avec icône dédiée, titre « Partager via QR Code », explication pour le scan mobile, bouton de fermeture ✕ ;
  - QR Code vectoriel contrasté de l'URL du secret, avec l'insigne de sécurité (cadenas) au centre ;
  - rappel de l'URL condensée ; le badge « Chiffré AES-256 » est traité dans S04 ;
  - alerte ambrée : « Le premier clic sur « Révéler » détruira le secret. » ;
  - boutons : Télécharger le QR Code (PNG, fichier `secret-eloneva.png`), Copier l'image dans le presse-papier, Fermer ;
  - le bouton « Copier l'image » est masqué si le navigateur ne permet pas de copier une image.
- **RG-9** — Le QR Code est généré dans le navigateur, sans appel à un service externe.

## Parcours
1. Après validation de la création (S01), l'écran « Lien généré » s'affiche sur `/lien-genere`.
2. L'expéditeur copie le lien, ouvre la modale QR Code ou utilise le message prêt à envoyer.
3. Le compte à rebours indique le temps restant.
- Variante : rechargement ou accès direct → redirection vers l'écran de création (RG-3).
- Variante : le compte à rebours arrive à zéro → « Ce secret a expiré. », lien masqué (RG-6).

## Données manipulées
| Donnée | Obligatoire | Format / contrainte | Donnée personnelle ? | Conservation |
|---|---|---|---|---|
| URL du secret | Oui | `https://secret.eloneva.com/s/<identifiant>` | Non | Uniquement en mémoire, le temps de l'affichage |
| Date d'expiration | Oui | Renvoyée par le serveur à la création (S01 RG-11) | Non | Uniquement en mémoire, le temps de l'affichage |

## Erreurs et cas limites
- Copie dans le presse-papier refusée par le navigateur → message « Impossible de copier le lien dans le presse-papier. Veuillez le copier manuellement. »
- Écran rechargé ou ouvert directement → RG-3.
- Compte à rebours arrivé à zéro → RG-6 ; le secret est détruit, l'URL ne permet plus de le lire.
- Partage natif indisponible → bouton « Copier le message » (RG-7).
- Copie d'image non prise en charge → bouton masqué (RG-8).

## Droits d'accès
| Action | Rôles autorisés |
|---|---|
| Voir le lien généré | Expéditeur qui vient de créer le secret (données reçues par l'état de navigation) |

## Critères d'acceptation métier
- Étant donné un secret créé, alors l'écran `/lien-genere` affiche une URL de la forme `https://secret.eloneva.com/s/<identifiant>`.
- Étant donné l'écran du lien, quand l'expéditeur clique sur Copier, alors l'URL est dans le presse-papier.
- Étant donné un navigateur qui refuse l'accès au presse-papier, quand l'expéditeur clique sur Copier, alors le message « Impossible de copier le lien dans le presse-papier. Veuillez le copier manuellement. » s'affiche.
- Étant donné l'écran du lien, alors l'avertissement « Ne révélez pas le secret vous-même : le premier clic sur « Révéler » le détruit définitivement. » et le rappel « Copiez le lien maintenant : il ne sera plus affiché. » sont affichés.
- Étant donné l'écran du lien rechargé ou ouvert directement, alors l'expéditeur est redirigé vers l'écran de création.
- Étant donné un secret de durée 7 j, alors le compte à rebours affiche le format `J j HH:MM:SS` ; étant donné un secret de durée 1 h, alors il affiche `HH:MM:SS`.
- Étant donné un compte à rebours arrivé à zéro, alors « Ce secret a expiré. » s'affiche et le lien et les boutons de partage sont masqués.
- Étant donné le partage natif disponible, quand l'expéditeur clique sur Partager, alors le partage s'ouvre avec le texte « Je t'ai envoyé un secret via Eloneva Secret. Il ne peut être lu qu'une fois : <URL> ».
- Étant donné le partage natif indisponible, quand l'expéditeur clique sur « Copier le message », alors ce texte est dans le presse-papier.
- Étant donné la modale QR Code, alors elle affiche le QR Code de l'URL, l'URL condensée, l'alerte « Le premier clic sur « Révéler » détruira le secret. » et les boutons Télécharger, Copier l'image et Fermer.
- Étant donné la modale QR Code, quand l'expéditeur clique sur Télécharger, alors le fichier `secret-eloneva.png` est téléchargé.
- Étant donné un navigateur qui ne permet pas de copier une image, alors le bouton « Copier l'image » est masqué.
- Étant donné la modale QR Code, quand l'expéditeur clique sur Fermer ou ✕, alors la modale se ferme.
- Étant donné l'ouverture de la modale QR Code, alors aucune requête n'est envoyée à un service externe.

## Non-fonctionnel
- QR Code vectoriel, lisible par un téléphone.

## Hors périmètre
- Création du secret (S01), lecture par le destinataire (S03).
- Envoi du lien par e-mail.
- Destruction manuelle par l'expéditeur (Killswitch).
- Clé de chiffrement dans l'URL et badge « Chiffré AES-256 » (S04).

## Dépendances
- S01 : identifiant, date d'expiration, route `/lien-genere` et état de navigation (plan S01, T05).

## Traçabilité
- Cahier des charges, « Fonctionnement » : « envoi d'un secret », étape 3.
- « Liste des écrans » : écran 2 « Lien Généré » et « Caractéristiques de la modale ».
