---
id: S02
titre: Lien généré et partage
depend_de: [S01]
---

# Lien généré et partage

## Contexte et objectif
Après la création d'un secret, montrer à l'expéditeur le lien unique à transmettre, lui donner des moyens de le diffuser (copie, QR Code, message prêt à envoyer), le prévenir des risques.

Maquette : `docs/design/eloneva_secret_lien_g_n_r/`.

## Utilisateurs et rôles
- Expéditeur (visiteur anonyme, juste après la création) : copie et diffuse le lien.

## Règles métier
- **RG-1** — L'URL du secret a la forme `https://secret.eloneva.com/s/<slug>`. le slug est au format [a-z0-9] et est généré par le serveur.
- **RG-2** — Un bouton copie l'URL dans le presse-papier en un clic.
- **RG-3** — Options de diffusion : QR Code, message prêt à envoyer. le message prêt à envoyer est un texte pré-rempli avec l'URL du secret, que l'expéditeur peut copier ou partager via les options natives du téléphone (SMS, WhatsApp, etc.).
- **RG-4** — Un encadré d'avertissement prévient l'expéditeur de ne pas tester le lien lui-même : l'ouvrir détruirait le secret.
- **RG-5** — Un compte à rebours affiche le temps restant avant la purge automatique du secret.
- **RG-6** — Modale « Partager via QR Code » :
  - en-tête avec icône dédiée, titre « Partager via QR Code », explication pour le scan mobile, bouton de fermeture ✕ ;
  - QR Code vectoriel contrasté, avec l'insigne de sécurité (cadenas) au centre ;
  - rappel de l'URL condensée (ex. `https://secret.eloneva.com/s/<slug>`) et badge « Chiffré AES-256 »
  - alerte ambrée : le premier scan ou affichage consommera la lecture unique du secret ;
  - boutons : Télécharger le QR Code, Copier l'image dans le presse-papier, Fermer.

## Parcours
1. Après validation de la création (S01), l'écran « Lien généré » s'affiche.
2. L'expéditeur copie le lien, ou ouvre la modale QR Code, ou utilise le message prêt à envoyer.
3. Le compte à rebours indique le temps restant.

## Données manipulées
| Donnée | Obligatoire | Format / contrainte | Donnée personnelle ? | Conservation |
|---|---|---|---|---|
| URL du secret | Oui | `https://secret.eloneva.com/s/<identifiant>` | Non | — |
| Date d'expiration | Oui | Issue de la durée de vie (S01) | Non | Durée de vie |

## Erreurs et cas limites
- Copie dans le presse-papier refusée par le navigateur → > message affiché "Impossible de copier le lien dans le presse-papier. Veuillez le copier manuellement."
- Compte à rebours arrivé à zéro sur l'écran → > il ne voit rien, le secret est détruit, l'URL ne permet plus de le lire.

## Droits d'accès
| Action | Rôles autorisés |
|---|---|
| Voir le lien généré | Expéditeur qui vient de créer le secret |

## Critères d'acceptation métier
- Étant donné un secret créé, alors l'écran affiche une URL de la forme `https://secret.eloneva.com/s/<identifiant>`.
- Étant donné l'écran du lien, quand l'expéditeur clique sur Copier, alors l'URL est dans le presse-papier.
- Étant donné l'écran du lien, alors l'avertissement « ne pas tester le lien soi-même » est affiché.
- Étant donné un secret de durée 1 h, alors le compte à rebours affiche le temps restant avant purge.
- Étant donné l'écran du lien, quand l'expéditeur clique sur Killswitch, alors le secret est détruit et l'URL ne permet plus de le lire.
- Étant donné la modale QR Code, alors elle affiche le QR Code de l'URL, l'URL condensée, l'alerte de lecture unique et les boutons Télécharger, Copier l'image et Fermer.
- Étant donné la modale QR Code, quand l'expéditeur clique sur Télécharger, alors le QR Code est téléchargé.

## Non-fonctionnel
- QR Code vectoriel, lisible par un téléphone.

## Hors périmètre
- Création du secret (S01), lecture par le destinataire (S03).
- Envoi du lien par e-mail.

## Dépendances
- S01 : secret créé, identifiant, durée de vie.

## Traçabilité
- « envoi d'un secret », étape 3 (l. 41).
- Écran 2, « Lien Généré » (l. 56-60) et « Caractéristiques de la modale » (l. 62-67).
- « Stack »
