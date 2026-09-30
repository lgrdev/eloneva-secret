---
id: S01
titre: Création d'un secret
depend_de: [S00]
---

# Création d'un secret

## Contexte et objectif
Permettre à un expéditeur, sans compte, de créer un secret (message confidentiel, mot de passe ou lien) avec une durée de vie choisie, et d'obtenir un lien à usage unique à transmettre au destinataire.

Maquette : `docs/design/eloneva_secret_cr_er_un_secret/`.

## Utilisateurs et rôles
- Expéditeur (visiteur anonyme) : choisit le type, saisit le contenu, règle l'expiration et les options, crée le secret.

## Règles métier
- **RG-1** — Trois types de secret : Message confidentiel, Mot de passe, Lien secret / URL. Le type se choisit par des onglets. sic'est une url, elle doit etre valide (format).
- **RG-2** — Le type Mot de passe propose un assistant de génération de mot de passe. paramètres de l'assistant de génération (longueur, jeux de caractères, réglables)
- **RG-3** — La saisie se fait dans un éditeur monospace avec un compteur de caractères. limite à 1500 caractères. si le secret est plus long, le message d'erreur doit être clair et précis (vous êtes limités à 1500 caracteres)
- **RG-4** — Durées de vie proposées : 1 heure, 4 heures, 24 heures, 7 jours, 14 jours. 24 heures est marqué « recommandé » et est la valeur par défaut.
- **RG-5** — Une fois la durée de vie écoulée, le secret est supprimé définitivement.
- **RG-6** — L'écran met en avant les garanties architecturales : Valkey en mémoire sans persistance disque, proxy Traefik TLS 1.3, zéro trace, zéro compte.
- **RG-7** — À la création, l'expéditeur est redirigé vers l'écran du lien généré (S02).



Le commutateur de chiffrement client (AES-GCM 256) et le mot de passe de déchiffrement optionnel sont traités dans S04. Le webhook de notification est hors périmètre.

## Parcours
1. L'expéditeur ouvre la page d'accueil (écran « Créer un secret »).
2. Il sélectionne le type : Message, Mot de passe ou Lien.
3. Il saisit le contenu (ou génère un mot de passe).
4. Il sélectionne la durée de vie.
5. Il valide : le secret est enregistré et l'écran du lien généré s'affiche (S02).

## Données manipulées
| Donnée | Obligatoire | Format / contrainte | Donnée personnelle ? | Conservation |
|---|---|---|---|---|
| Type | Oui | Message, Mot de passe, Lien | Non | Durée de vie choisie |
| Contenu du secret | Oui | Texte ; 1500 longueur max | Potentiellement (contenu libre) | Jusqu'à lecture ou expiration |
| Durée de vie | Oui | 1 h, 4 h, 24 h, 7 j, 14 j | Non | — |
| Identifiant du secret | Oui (généré) | format en tpphs://url_site/s/<slug> ([a-z0-9]) | Non | Durée de vie choisie |

## Erreurs et cas limites
- Contenu vide → > message affiché "Sans doute une erreur, le secret ne peut pas être vide."
- Contenu au-delà de la longueur maximale → > message affiché "Le secret est trop long, vous êtes limité à 1500 caractères." et en attente modification de l'utilisateur
- Échec d'enregistrement (serveur ou Valkey indisponible) : Message affiché : "Une erreur est survenue, le secret n'a pas pu être créé. Veuillez réessayer." et  L'expéditeur peut réessayer la création du secret.

## Droits d'accès
| Action | Rôles autorisés |
|---|---|
| Créer un secret | Tout visiteur, sans compte |

## Critères d'acceptation métier
- Étant donné l'écran de création, quand l'expéditeur choisit un onglet, alors le type Message, Mot de passe ou Lien est sélectionné.
- Étant donné l'onglet Mot de passe, quand l'expéditeur utilise l'assistant, alors un mot de passe est généré dans la zone de saisie.
- Étant donné une saisie, quand l'expéditeur tape du texte, alors le compteur de caractères se met à jour.
- Étant donné le sélecteur de durée, alors seules les valeurs 1 h, 4 h, 24 h, 7 j et 14 j sont proposées, 24 h étant marquée « recommandé ».
- Étant donné l'écran de création, alors l'option d'autodestruction à la 1ʳᵉ lecture est activée par défaut.
- Étant donné un secret créé avec une durée de 1 h, quand 1 h s'est écoulée, alors le secret n'est plus lisible.
- Étant donné un contenu valide, quand l'expéditeur valide, alors l'écran du lien généré s'affiche.

## Non-fonctionnel
- Le contenu du secret ne doit jamais être écrit sur disque (Valkey sans persistance).

## Hors périmètre
- Chiffrement côté client et mot de passe de déchiffrement (S04).
- Webhook de notification.
- Écran du lien généré et partage (S02).

## Dépendances
- S00 : stockage Valkey avec durée de vie, mise en page commune.

## Traçabilité
- « Liens Autodestructeurs » (l. 23-24), « Expiration Temporelle » (l. 26-27), « Formats Multiples » (l. 32-33).
- « envoi d'un secret », étapes 1 et 2 (l. 38-40).
- Écran 1, « Création de Secret » (l. 49-54), sauf chiffrement client et mot de passe de déchiffrement.
