---
id: S04
titre: Chiffrement client et mot de passe de déchiffrement
depend_de: [S01, S02, S03]
---

# Chiffrement client et mot de passe de déchiffrement

## Contexte et objectif
Renforcer la confidentialité : l'expéditeur peut chiffrer le secret dans son navigateur (AES-GCM 256 bits) et définir un mot de passe de déchiffrement facultatif, que le destinataire devra saisir pour révéler le secret.

## Utilisateurs et rôles
- Expéditeur : active ou non le chiffrement client, définit ou non un mot de passe.
- Destinataire : saisit le mot de passe si l'expéditeur en a défini un.

## Règles métier
- **RG-1** — L'écran de création propose un commutateur de chiffrement client (AES-GCM 256 bits), activé par défaut.
- **RG-2** — L'écran de création propose un mot de passe de déchiffrement optionnel (8 à 128 caractères). Le mot de passe est utilisé dans le navigateur pour calculer la clé de déchiffrement ; il n'est jamais envoyé au serveur ni stocké. Saisir un mot de passe active le chiffrement client et verrouille le commutateur tant qu'un mot de passe est saisi.
- **RG-3** — À l'ouverture de l'écran de déverrouillage (S03), le serveur indique si le secret est protégé par un mot de passe, sans renvoyer le contenu. Le champ de mot de passe ne s'affiche que dans ce cas, et il est alors obligatoire.
- **RG-4** — Le reçu d'audit de l'écran révélé (S03) mentionne le chiffrement zéro-connaissance, uniquement si le secret a été chiffré côté client.
- **RG-5** — La clé de chiffrement est placée dans le fragment `#` de l'URL : `https://secret.eloneva.com/s/<identifiant>#<clé>`. Le fragment n'est jamais transmis au serveur ; le serveur ne stocke que le contenu chiffré.
- **RG-6** — L'URL complète, avec le fragment, est utilisée partout où le lien est diffusé (copie, QR Code, message prêt à envoyer — S02).
- **RG-7** — Le badge « Chiffré AES-256 » de la modale QR Code (S02) est affiché si le chiffrement client est activé, masqué sinon.
- **RG-8** — Vérification avant suppression : à la création, le navigateur calcule une empreinte de vérification à partir de la clé finale (clé du fragment et, le cas échéant, mot de passe) et l'envoie avec le contenu chiffré. À la révélation, le navigateur envoie l'empreinte recalculée ; le serveur ne renvoie et ne supprime le secret que si elle correspond. Après 5 échecs, le secret est détruit.
- **RG-9** — Quand un mot de passe est défini, l'écran du lien généré (S02) rappelle à l'expéditeur de transmettre le mot de passe par un autre canal que le lien.

## Parcours
1. Création (S01) : l'expéditeur active le chiffrement client et, s'il le souhaite, saisit un mot de passe de déchiffrement.
2. Il transmet le lien, qui contient la clé dans son fragment `#` (S02), et, s'il en a défini un, le mot de passe par un autre canal.
3. Réception (S03) : le destinataire saisit le mot de passe si demandé, puis clique sur « Révéler ».
4. Le contenu est déchiffré et affiché.

## Données manipulées
| Donnée | Obligatoire | Format / contrainte | Donnée personnelle ? | Conservation |
|---|---|---|---|---|
| Chiffrement client activé | Oui | Booléen | Non | Durée de vie |
| Contenu chiffré | Si chiffrement activé | AES-GCM 256 bits | Potentiellement | Jusqu'à lecture ou expiration |
| Mot de passe de déchiffrement | Non | 8 à 128 caractères | Non | Jamais transmis au serveur, jamais stocké |
| Empreinte de vérification | Si chiffrement activé | Calculée dans le navigateur à partir de la clé finale | Non | Durée de vie du secret |
| Nombre d'échecs de vérification | Si chiffrement activé | 0 à 5 | Non | Durée de vie du secret |

## Erreurs et cas limites
- Mot de passe erroné → le serveur refuse l'empreinte (RG-8), le secret n'est pas consommé ; message « Mot de passe incorrect. Il vous reste N essais. » ; au 5ᵉ échec, le secret est détruit.
- Clé absente ou altérée dans le lien → message : « Ce lien est incomplet ou altéré. » (le secret n'est pas consommé)
- Navigateur sans API de chiffrement → message : « Votre navigateur ne permet pas de chiffrer ce secret. » (création bloquée, pas d'envoi en clair par repli ; à la réception, même message, secret non consommé)

## Droits d'accès
| Action | Rôles autorisés |
|---|---|
| Révéler un secret protégé | Personne possédant le lien et le mot de passe |

## Critères d'acceptation métier
- Étant donné l'écran de création, alors un commutateur de chiffrement client AES-GCM 256 bits et un champ de mot de passe optionnel sont proposés.
- Étant donné l'écran de création, alors le chiffrement client est activé par défaut.
- Étant donné un secret créé avec chiffrement client, alors le serveur ne stocke jamais le contenu en clair et l'URL générée contient la clé dans son fragment `#`.
- Étant donné un secret chiffré, alors le badge « Chiffré AES-256 » est affiché dans la modale QR Code et le reçu d'audit mentionne le chiffrement zéro-connaissance.
- Étant donné un secret non chiffré, alors le badge « Chiffré AES-256 » et la mention zéro-connaissance sont masqués.
- Étant donné un secret protégé par mot de passe, quand le destinataire saisit le bon mot de passe et clique sur « Révéler », alors le contenu s'affiche en clair.
- Étant donné un secret protégé par mot de passe, quand le destinataire saisit un mauvais mot de passe, alors le contenu n'est pas affiché, le secret n'est pas consommé et le message « Mot de passe incorrect. Il vous reste N essais. » s'affiche.
- Étant donné 5 échecs de vérification, alors le secret est détruit.
- Étant donné un lien dont la clé est absente ou altérée, alors le message « Ce lien est incomplet ou altéré. » s'affiche et le secret n'est pas consommé.
- Étant donné un mot de passe saisi à la création, alors le chiffrement client est activé et le commutateur est verrouillé.
- Étant donné un secret sans mot de passe, alors l'écran de déverrouillage n'affiche pas de champ de mot de passe.
- Étant donné un navigateur sans API de chiffrement, alors la création est bloquée avec le message « Votre navigateur ne permet pas de chiffrer ce secret. » et rien n'est envoyé.
- Étant donné un secret chiffré, alors le serveur ne reçoit jamais la clé ni le mot de passe.

## Non-fonctionnel
- Chiffrement réalisé dans le navigateur (AES-GCM 256 bits).

## Hors périmètre
- Types de secret, durée de vie (S01).

## Dépendances
- S01 : écran et données de création.
- S02 : URL diffusée (copie, QR Code, message), badge de la modale QR Code.
- S03 : écran de déverrouillage et révélation.

## Traçabilité
- Écran 1 : « commutateur de chiffrement client (AES-GCM 256-bit) » (l. 51), « mot de passe de déchiffrement optionnel » (l. 53).
- Écran 3 : « Champ facultatif de mot de passe » (l. 73).
- Écran 4 : « chiffrement zéro-connaissance » (l. 78).
