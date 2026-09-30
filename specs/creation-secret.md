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
- **RG-1** — Trois types de secret : Message confidentiel, Mot de passe, Lien secret / URL. Le type se choisit par des onglets. Le contenu saisi est conservé quand l'expéditeur change d'onglet.
- **RG-2** — Pour le type Lien, seules les URL absolues commençant par `https://` sont acceptées. Sinon, le message « Le lien doit commencer par https://. » s'affiche et la création est impossible.
- **RG-3** — Le type Mot de passe propose un assistant de génération :
  - longueur réglable de 8 à 128 caractères, 20 par défaut ;
  - jeux de caractères : minuscules, majuscules, chiffres, symboles, tous cochés par défaut ; au moins un jeu doit rester coché ;
  - le mot de passe contient au moins un caractère de chaque jeu coché ;
  - il est généré dans le navigateur, avec un générateur aléatoire cryptographiquement sûr ;
  - il est placé dans l'éditeur, en clair (non masqué), pour que l'expéditeur puisse le vérifier.
- **RG-4** — La saisie se fait dans un éditeur monospace avec un compteur de caractères. La limite est de 1500 caractères (un caractère = un caractère Unicode affiché, retours à la ligne compris). La saisie au-delà reste possible (par exemple par collage) : tant que le texte dépasse 1500 caractères, le message « Le secret est trop long, vous êtes limité à 1500 caractères. » s'affiche et le bouton de création est désactivé.
- **RG-5** — Un contenu vide, ou composé uniquement d'espaces et de retours à la ligne, est refusé à la validation avec le message « Sans doute une erreur, le secret ne peut pas être vide. »
- **RG-6** — Durées de vie proposées : 1 heure, 4 heures, 24 heures, 7 jours, 14 jours. 24 heures est marquée « recommandé » et sélectionnée par défaut.
- **RG-7** — Une fois la durée de vie écoulée, le secret est supprimé définitivement.
- **RG-8** — L'écran affiche les garanties architecturales : Valkey en mémoire sans persistance disque, proxy Traefik TLS 1.3, zéro trace, zéro compte.
- **RG-9** — Les contrôles de contenu (vide, longueur, format d'URL) se font dans le navigateur. Le serveur stocke le contenu comme une donnée opaque (il peut être chiffré, voir S04) avec son type et sa date d'expiration ; il vérifie seulement la présence du contenu, le type, la durée de vie, et refuse tout contenu de plus de 10 Ko.
- **RG-10** — L'identifiant du secret est généré par le serveur avec un générateur aléatoire cryptographiquement sûr : 32 caractères `[a-z0-9]`. En cas de collision avec un secret existant, un nouvel identifiant est tiré.
- **RG-11** — La date d'expiration est calculée par le serveur à la création (heure de création + durée de vie). Le serveur renvoie l'identifiant et la date d'expiration à l'expéditeur.
- **RG-12** — Le bouton de création est désactivé pendant l'envoi, pour éviter qu'un double clic crée deux secrets.
- **RG-13** — Une fois le secret créé, l'expéditeur est dirigé vers l'écran du lien généré (S02).

Le commutateur de chiffrement client (AES-GCM 256) et le mot de passe de déchiffrement optionnel sont traités dans S04. Le webhook de notification est hors périmètre.

## Parcours
1. L'expéditeur ouvre la page d'accueil (écran « Créer un secret »).
2. Il sélectionne le type : Message, Mot de passe ou Lien.
3. Il saisit le contenu (ou génère un mot de passe).
4. Il sélectionne la durée de vie (24 h par défaut).
5. Il valide : le secret est enregistré et l'écran du lien généré s'affiche (S02).
- Variante : il change d'onglet en cours de saisie → le contenu est conservé.

## Données manipulées
| Donnée | Obligatoire | Format / contrainte | Donnée personnelle ? | Conservation |
|---|---|---|---|---|
| Type | Oui | Message, Mot de passe, Lien | Non | Durée de vie choisie |
| Contenu du secret | Oui | Texte de 1500 caractères max (contrôlé dans le navigateur) ; stocké comme donnée opaque, 10 Ko max | Potentiellement (contenu libre) | Jusqu'à lecture ou expiration |
| Durée de vie | Oui | 1 h, 4 h, 24 h (défaut), 7 j, 14 j | Non | — |
| Date d'expiration | Oui (calculée par le serveur) | Heure de création + durée de vie | Non | Durée de vie choisie |
| Identifiant du secret | Oui (généré par le serveur) | 32 caractères `[a-z0-9]`, aléatoire sûr ; utilisé dans l'URL `https://secret.eloneva.com/s/<identifiant>` | Non | Durée de vie choisie |

## Erreurs et cas limites
- Contenu vide ou fait d'espaces → RG-5.
- Contenu de plus de 1500 caractères → RG-4 (message, bouton désactivé, en attente de modification par l'expéditeur).
- Type Lien ne commençant pas par `https://` → RG-2.
- Contenu reçu par le serveur de plus de 10 Ko → refusé.
- Échec d'enregistrement (serveur ou Valkey indisponible, mémoire Valkey pleine) → règle commune S00 RG-7 (erreur 500, message générique, redirection vers l'écran de création). La saisie de l'expéditeur (type, contenu, durée) est conservée après la redirection.
- Double clic sur le bouton de création → un seul secret créé (RG-12).

## Droits d'accès
| Action | Rôles autorisés |
|---|---|
| Créer un secret | Tout visiteur, sans compte |

## Critères d'acceptation métier
- Étant donné l'écran de création, quand l'expéditeur choisit un onglet, alors le type Message, Mot de passe ou Lien est sélectionné.
- Étant donné un contenu saisi, quand l'expéditeur change d'onglet, alors le contenu est conservé.
- Étant donné l'onglet Lien, quand l'expéditeur saisit une URL qui ne commence pas par `https://`, alors le message « Le lien doit commencer par https://. » s'affiche et la création est impossible.
- Étant donné l'onglet Mot de passe, quand l'expéditeur utilise l'assistant avec les réglages par défaut, alors un mot de passe visible de 20 caractères, contenant au moins une minuscule, une majuscule, un chiffre et un symbole, est placé dans l'éditeur.
- Étant donné l'assistant, alors la longueur est réglable de 8 à 128 et il est impossible de décocher tous les jeux de caractères.
- Étant donné une saisie, quand l'expéditeur tape du texte, alors le compteur de caractères se met à jour.
- Étant donné un contenu de 1501 caractères, alors le message « Le secret est trop long, vous êtes limité à 1500 caractères. » s'affiche et le bouton de création est désactivé.
- Étant donné un contenu composé uniquement d'espaces, quand l'expéditeur valide, alors le message « Sans doute une erreur, le secret ne peut pas être vide. » s'affiche et aucun secret n'est créé.
- Étant donné le sélecteur de durée, alors seules les valeurs 1 h, 4 h, 24 h, 7 j et 14 j sont proposées, et 24 h est sélectionnée par défaut et marquée « recommandé ».
- Étant donné l'écran de création, alors les garanties architecturales sont affichées.
- Étant donné un secret créé, alors la réponse du serveur contient un identifiant de 32 caractères `[a-z0-9]` et la date d'expiration.
- Étant donné un contenu de plus de 10 Ko envoyé au serveur, alors la création est refusée.
- Étant donné un double clic sur le bouton de création, alors un seul secret est créé.
- Étant donné un secret créé avec une durée de 1 h, quand 1 h s'est écoulée, alors le secret n'est plus lisible.
- Étant donné Valkey indisponible ou sa mémoire pleine, quand l'expéditeur crée un secret, alors la règle S00 RG-7 s'applique et sa saisie est conservée sur l'écran de création.
- Étant donné une création de secret, alors ni l'application, ni Traefik, ni Valkey n'ont écrit de journal (S00 RG-8).
- Étant donné un contenu valide, quand l'expéditeur valide, alors l'écran du lien généré s'affiche.

## Non-fonctionnel
- Le contenu du secret ne doit jamais être écrit sur disque (Valkey sans persistance).

## Hors périmètre
- Chiffrement côté client et mot de passe de déchiffrement (S04).
- Webhook de notification.
- Écran du lien généré et partage (S02).
- Affichage du lien révélé : non cliquable (S03).

## Dépendances
- S00 : stockage Valkey avec durée de vie, règle de panne commune (S00 RG-7), zéro trace (S00 RG-8), mise en page commune.

## Traçabilité
- Cahier des charges, « Fonctionnalités » : « Expiration Temporelle », « Formats Multiples ».
- « Fonctionnement » : « envoi d'un secret », étapes 1 et 2.
- « Liste des écrans » : écran 1 « Création de Secret », sauf chiffrement client et mot de passe de déchiffrement (S04).
