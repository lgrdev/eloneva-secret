---
id: S00
titre: Socle
depend_de: []
---

# Socle

## Contexte et objectif
Installer le socle de base du projet, avec les dépendances et la configuration initiale, pour que les fonctionnalités d'Eloneva Secret (création, partage, réception de secrets) puissent être développées sur une base commune.

Eloneva Secret est un service gratuit, sans inscription, de liens auto-destructeurs. URL de production : `https://secret.eloneva.com`.

## Utilisateurs et rôles
- Aucun compte, aucune inscription. Tous les visiteurs sont anonymes.
- Expéditeur : crée un secret (voir S01).
- Destinataire : consulte un secret (voir S03).

## Règles métier
- **RG-1** — Aucune inscription ni aucun compte utilisateur (« zéro compte »).
- **RG-2** — Les secrets sont stockés dans Valkey, avec une durée de vie propre à chaque enregistrement : à expiration, l'enregistrement est supprimé définitivement.
- **RG-3** — Valkey fonctionne en mémoire, sans persistance disque.
- **RG-4** — Les échanges passent par des connexions chiffrées : Traefik en frontal, TLS 1.3.
- **RG-5** — Le navigateur n'accède jamais directement à Valkey : tout passe par l'API REST du serveur.
- **RG-6** — L’interface suit le système de design « Kinetic Sentinel » (`docs/design/kinetic_sentinel/DESIGN.md`) et le logo (`docs/design/eloneva_secret_logo/`). En cas d'écart avec les maquettes, la spécification prime.
- **RG-7** — Panne serveur ou Valkey indisponible, sur tous les écrans : le serveur répond une erreur HTTP 500, le message « Service temporairement indisponible. Veuillez réessayer plus tard. » s'affiche et l'utilisateur est redirigé vers l'écran de création d'un secret (S01).
- **RG-8** — Zéro trace : aucune journalisation des requêtes (ni adresse IP, ni identifiant, ni contenu), ni par l'application ni par Traefik.


## Parcours
1. Un visiteur ouvre `https://secret.eloneva.com` et arrive sur l'écran de création d'un secret (S01).
- Mise en page commune (en-tête avec logo, pied de page) partagée par tous les écrans.

## Données manipulées
Aucune donnée métier propre au socle. Le socle fournit l'accès à Valkey (couche `server/data/**`) avec expiration par enregistrement.

## Erreurs et cas limites
- Valkey indisponible ou erreur serveur → RG-7.
- Limite de débit dépassée → message affiché, et code HTTP (429) 

## Droits d'accès
| Action | Rôles autorisés |
|---|---|
| Accéder au site | Tout visiteur, sans compte |

## Critères d'acceptation métier
- Étant donné Valkey indisponible, quand un utilisateur fait une action sur n'importe quel écran, alors le serveur répond 500, le message « Service temporairement indisponible. Veuillez réessayer plus tard. » s'affiche et l'utilisateur est redirigé vers l'écran de création.
- Étant donné une adresse IP qui a créé 60 secrets dans l'heure, quand elle en crée un 61ᵉ, alors la création est refusée.
- Étant donné une création puis une révélation de secret, alors ni l'application ni Traefik n'ont écrit de journal contenant l'adresse IP, l'identifiant ou le contenu du secret.
- Étant donné un projet vierge, quand on lance `pnpm dev`, alors l'application démarre et affiche la mise en page commune.
- Étant donné un enregistrement écrit dans Valkey avec une durée de vie, quand cette durée est écoulée, alors l'enregistrement n'est plus lisible.
- Les commandes `pnpm lint`, `pnpm typecheck`, `pnpm test --run` et `pnpm build` s'exécutent sans erreur.
- L'application se construit et se lance via Docker.

## Non-fonctionnel
- TLS 1.3, HTTP/2, HTTP/3 au niveau du proxy.
- Déploiement Docker.
- Interface en français uniquement.
- Responsive : utilisable sur mobile.

## Hors périmètre
- Toute fonctionnalité métier (création, partage, réception de secrets) : specs S01 à S04.
- pied de page et mentions légales 
- Accessibilité : aucun niveau n'est défini, ni pour le socle ni pour les fonctionnalités métier.

## Dépendances
- Services tiers : Valkey, Traefik.

## Traçabilité
- Présentation du service (l. 1-6), « Stack » (l. 8-12), « socle » (l. 14-16), note sur les maquettes (l. 21).
- « Sécurisé par Conception » (l. 29-30).
- Écran 1, « Garanties architecturales » (l. 54) : Valkey sans persistance disque, TLS 1.3, zéro compte.
