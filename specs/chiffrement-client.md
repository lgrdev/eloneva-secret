---
id: S04
titre: Chiffrement client et mot de passe de déchiffrement
depend_de: [S01, S03]
---

# Chiffrement client et mot de passe de déchiffrement

## Contexte et objectif
Renforcer la confidentialité : l'expéditeur peut chiffrer le secret dans son navigateur (AES-GCM 256 bits) et définir un mot de passe de déchiffrement facultatif, que le destinataire devra saisir pour révéler le secret.

## Utilisateurs et rôles
- Expéditeur : active ou non le chiffrement client, définit ou non un mot de passe.
- Destinataire : saisit le mot de passe si l'expéditeur en a défini un.

## Règles métier
- **RG-1** — L'écran de création propose un commutateur de chiffrement client (AES-GCM 256 bits).
- **RG-2** — L'écran de création propose un mot de passe de déchiffrement optionnel.
- **RG-3** — L'écran de déverrouillage (S03) affiche un champ facultatif de mot de passe, pour saisir la clé supplémentaire si l'expéditeur en a défini une.
- **RG-4** — Le reçu d'audit de l'écran révélé mentionne le chiffrement zéro-connaissance.

> ❓ Question : RG-1 — le commutateur est-il activé par défaut ?
> ❓ Question : RG-1 — où se trouve la clé de chiffrement (par ex. dans le fragment `#` de l'URL, jamais transmis au serveur) ? Le cahier des charges ne le précise pas.
> ❓ Question : RG-2 — le mot de passe dépend-il du chiffrement client (clé dérivée du mot de passe) ou est-il vérifié par le serveur ?
> ❓ Question : RG-3 — le champ de mot de passe s'affiche-t-il toujours (« facultatif ») ou seulement si le secret en exige un ?
> ❓ Question : mot de passe erroné — nombre d'essais autorisés ? Le secret est-il détruit après échecs ? Un mauvais mot de passe consomme-t-il la lecture unique ?

## Parcours
1. Création (S01) : l'expéditeur active le chiffrement client et, s'il le souhaite, saisit un mot de passe de déchiffrement.
2. Il transmet le lien, et le mot de passe par un autre canal (❓ à confirmer).
3. Réception (S03) : le destinataire saisit le mot de passe si demandé, puis clique sur « Révéler ».
4. Le contenu est déchiffré et affiché.

## Données manipulées
| Donnée | Obligatoire | Format / contrainte | Donnée personnelle ? | Conservation |
|---|---|---|---|---|
| Chiffrement client activé | Oui | Booléen | Non | Durée de vie |
| Contenu chiffré | Si chiffrement activé | AES-GCM 256 bits | Potentiellement | Jusqu'à lecture ou expiration |
| Mot de passe de déchiffrement | Non | ❓ contraintes | Non | ❓ stocké sous quelle forme, ou jamais stocké |

## Erreurs et cas limites
- Mot de passe erroné → > ❓ Question : message et comportement ?
- Clé absente ou altérée dans le lien → > ❓ Question : message attendu ?
- Navigateur sans API de chiffrement → > ❓ Question : comportement attendu ?

## Droits d'accès
| Action | Rôles autorisés |
|---|---|
| Révéler un secret protégé | Personne possédant le lien et le mot de passe |

## Critères d'acceptation métier
- Étant donné l'écran de création, alors un commutateur de chiffrement client AES-GCM 256 bits et un champ de mot de passe optionnel sont proposés.
- Étant donné un secret créé avec chiffrement client, alors le serveur ne stocke jamais le contenu en clair.
- Étant donné un secret protégé par mot de passe, quand le destinataire saisit le bon mot de passe et clique sur « Révéler », alors le contenu s'affiche en clair.
- Étant donné un secret protégé par mot de passe, quand le destinataire saisit un mauvais mot de passe, alors le contenu n'est pas affiché.

## Non-fonctionnel
- Chiffrement réalisé dans le navigateur (AES-GCM 256 bits).

## Hors périmètre
- Types de secret, durée de vie, autodestruction (S01).

## Dépendances
- S01 : écran et données de création.
- S03 : écran de déverrouillage et révélation.

## Traçabilité
- Écran 1 : « commutateur de chiffrement client (AES-GCM 256-bit) » (l. 51), « mot de passe de déchiffrement optionnel » (l. 53).
- Écran 3 : « Champ facultatif de mot de passe » (l. 73).
- Écran 4 : « chiffrement zéro-connaissance » (l. 78).
