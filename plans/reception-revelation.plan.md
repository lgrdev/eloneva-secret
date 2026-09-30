---
spec: specs/reception-revelation.md
spec_sha: 62ecd559b333984dae8a2eecf34c952b7907012c
epic_title: "Réception et révélation d'un secret"
epic_priority: P1
status: Backlog
epic_issue: 24
---

# Epic : Réception et révélation d'un secret

## Contexte
Permettre au destinataire d'ouvrir `/s/<identifiant>`, de voir si le secret existe sans le consommer, puis de le révéler par un clic : le serveur renvoie le contenu et le supprime de Valkey dans la même opération. Pages non mises en cache et non indexées ; révélation uniquement par `POST`. En cas de panne avant la révélation, le message reste sur l'écran de déverrouillage (exception à S00 RG-7).
S'appuie sur S01/T01 (clé `secret:<identifiant>`, `server/data/secrets.ts`, `shared/schemas/secret.ts`) et sur le socle S00 (client API, gestion des pannes, mise en page).
Hors périmètre : mot de passe, indication « protégé », vérification d'empreinte et déchiffrement (S04), notification de l'expéditeur.

## Questions ouvertes
- (aucune)

## Tickets

### T01 — Créer l'API d'état et de révélation
- priorité: P0
- dépend de: S01/T01
- issue: 25

#### Objectif
Exposer l'état d'un secret (existe ou non) sans le consommer, et sa révélation atomique par `POST` ; servir les pages `/s/<identifiant>` avec les en-têtes de protection.

#### Critères d'acceptation
- [ ] CA1 — `GET /api/secrets/<identifiant>/etat` répond « existe » pour un secret valide, sans renvoyer le contenu ni le consommer `auto`
- [ ] CA2 — Pour un secret inexistant, lu, expiré ou un identifiant mal formé, l'état répond 404 « indisponible » `auto`
- [ ] CA3 — `POST /api/secrets/<identifiant>/revelation` renvoie le contenu, le type et l'heure de destruction, et le secret n'existe plus ensuite `auto`
- [ ] CA4 — Deux révélations simultanées : une seule reçoit le contenu, l'autre reçoit 404 `auto`
- [ ] CA5 — Aucune réponse à une requête `GET` ne contient le contenu du secret `auto`
- [ ] CA6 — Les réponses des pages `/s/<identifiant>` et de ces API portent `Cache-Control: no-store`, `X-Robots-Tag: noindex` et `Referrer-Policy: no-referrer` `auto`
- [ ] CA7 — Valkey indisponible : ces API répondent 500 avec le message générique de S00 RG-7 `auto`
- [ ] CA8 — Une révélation n'écrit rien sur la sortie standard ni sur la sortie d'erreur de l'application `auto`

#### Plan par couche
- **db** : dans `server/data/secrets.ts`, `existeSecret(identifiant)` (`EXISTS`) et `lireEtSupprimerSecret(identifiant)` (`GETDEL`, atomique)
- **server** : schémas Zod dans `shared/schemas/secret.ts` (`identifiantSchema` : 32 caractères `[a-z0-9]` ; `etatSecretSchema` ; `revelationSecretSchema` : `type`, `contenu`, `detruitLe` ISO 8601) ; routes Fastify dans `server/api/revelation.ts` : `GET /api/secrets/:identifiant/etat` et `POST /api/secrets/:identifiant/revelation` (identifiant mal formé → 404 sans appel à Valkey ; `detruitLe` = heure du serveur) ; en-têtes `no-store`, `noindex`, `no-referrer` sur `/s/*` et ces routes (hook Fastify dans `server/utils/entetesProtection.ts`)
- **front** : —
- **test** : Vitest `tests/unit/server/revelation.test.ts` sur une instance Valkey de test (CA1 à CA5, CA7 ; CA4 par deux requêtes parallèles) ; CA6 sur les en-têtes ; CA8 avec un espion sur `stdout`/`stderr`

#### Hors périmètre
- Vérification d'empreinte et indication « protégé » (S04).

### T02 — Afficher l'écran de déverrouillage
- priorité: P1
- dépend de: T01
- issue: 26

#### Objectif
Créer l'écran `/s/<identifiant>` : vérifier l'existence à l'ouverture, afficher le bouton et son avertissement, ou le message d'indisponibilité ; afficher le message de panne sans redirection.

#### Critères d'acceptation
- [ ] CA1 — Secret valide : l'écran « Déverrouiller le secret » affiche le bouton « Révéler le secret maintenant » et le texte « Le secret sera supprimé définitivement après lecture. », sans le contenu `auto`
- [ ] CA2 — Ouvrir l'URL plusieurs fois sans cliquer laisse le secret lisible `auto`
- [ ] CA3 — Secret indisponible : « Le secret a déjà été lu ou a expiré. Il n'est plus disponible. » s'affiche, sans bouton `auto`
- [ ] CA4 — Valkey indisponible à l'ouverture : « Service temporairement indisponible. Veuillez réessayer plus tard. » s'affiche sur l'écran, sans redirection vers la création `auto`
- [ ] CA5 — L'écran respecte la maquette `docs/design/eloneva_secret_d_verrouiller_le_secret/` `manuel`

#### Plan par couche
- **db** : —
- **server** : —
- **front** : page `src/pages/DeverrouillerSecret.tsx` sur la route `/s/:identifiant`, dans `MiseEnPage` (S00) ; fonctions `lireEtatSecret` et `revelerSecret` dans `src/services/api.ts`, avec une option qui désactive la redirection automatique du socle sur 500 (exception S03 RG-8) ; hook `src/hooks/useDeverrouillage.ts` (états : chargement, disponible, indisponible, panne)
- **test** : Playwright `tests/e2e/deverrouillage.spec.ts` (CA1 à CA4 ; CA4 avec l'API simulée en 500)

#### Hors périmètre
- Révélation et écran révélé (T03). Champ de mot de passe (S04).

### T03 — Révéler le secret et afficher l'écran de destruction
- priorité: P1
- dépend de: T02
- issue: 27

#### Objectif
Au clic, révéler le secret par `POST` et afficher l'écran « Secret révélé & détruit » ; gérer le secret disparu entre-temps et la panne au clic.

#### Critères d'acceptation
- [ ] CA1 — Au clic, une requête `POST` révèle le secret : le contenu s'affiche dans un bloc de code et le secret est supprimé du serveur `auto`
- [ ] CA2 — L'écran affiche le badge « Secret supprimé de la mémoire du serveur », le bouton de copie, l'avertissement « Ce contenu sera perdu définitivement si vous rafraîchissez ou fermez la page. » et l'heure de destruction au format `30/09/2026 à 14:32:05` dans le fuseau du navigateur `auto`
- [ ] CA3 — Un secret de type Lien est affiché en texte, non cliquable `auto`
- [ ] CA4 — Le bouton de copie place le contenu dans le presse-papier ; en cas de refus, « Impossible de copier dans le presse-papier. Veuillez copier manuellement. » s'affiche `auto`
- [ ] CA5 — Quitter ou recharger l'écran révélé déclenche une confirmation du navigateur `auto`
- [ ] CA6 — Secret disparu entre l'ouverture et le clic : le message d'indisponibilité s'affiche, sans bouton `auto`
- [ ] CA7 — Valkey indisponible au clic : le message de panne s'affiche sur l'écran de déverrouillage, bouton toujours disponible `auto`
- [ ] CA8 — Rouvrir l'URL après la révélation affiche le message d'indisponibilité `auto`
- [ ] CA9 — Après une révélation de bout en bout, ni l'application, ni Traefik, ni Valkey n'ont écrit de journal (S00 RG-8) `manuel`
- [ ] CA10 — L'écran révélé respecte la maquette `docs/design/eloneva_secret_secret_r_v_l_d_truit/` `manuel`

#### Plan par couche
- **db** : —
- **server** : —
- **front** : composant `src/components/revelation/SecretRevele.tsx` (badge, bloc de code, copie via `src/services/pressePapier.ts`, avertissement, reçu) ; fonction pure `formaterHeureDestruction(iso)` dans `src/services/formatDate.ts` ; confirmation `beforeunload` dans le hook `src/hooks/useConfirmationSortie.ts` ; gestion des réponses 404 et 500 dans `useDeverrouillage`
- **test** : Vitest `tests/unit/front/formatDate.test.ts` ; Playwright `tests/e2e/revelation.spec.ts` (CA1 à CA8 ; CA6 en supprimant le secret entre l'ouverture et le clic, CA7 avec l'API simulée en 500) ; CA9 avec la procédure manuelle de S00/T05

#### Hors périmètre
- Déchiffrement et mention zéro-connaissance (S04).
