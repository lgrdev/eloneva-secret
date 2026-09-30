---
spec: specs/creation-secret.md
spec_sha: 88f0790300694a027abd657fc700276593f8e5c8
epic_title: "Création d'un secret"
epic_priority: P1
status: Backlog
epic_issue: 12
---

# Epic : Création d'un secret

## Contexte
Permettre à un expéditeur anonyme de créer un secret (message, mot de passe ou lien) avec une durée de vie de 1 h à 14 j, et d'obtenir l'identifiant et la date d'expiration qui serviront au lien généré (S02). Le contenu est contrôlé dans le navigateur (vide, 1500 caractères, `https://`) et stocké par le serveur comme une donnée opaque (10 Ko max), prête pour le chiffrement client de S04.
S'appuie sur le socle S00 : couche Valkey (`server/data/valkey.ts`), gestion commune des pannes (`server/utils/erreurs.ts`, `src/services/api.ts`), mise en page commune.
Hors périmètre : chiffrement client et mot de passe de déchiffrement (S04), écran du lien généré (S02), révélation (S03), webhook.

## Questions ouvertes
- [x] Assistant de mot de passe : quel jeu de « symboles » exact ? Proposition : `!@#$%^&*()-_=+[]{};:,.?/` (sans espace ni guillemets, pour éviter les confusions au copier-coller). — impact : T04 - reponse : `!@#$%()-_=+[]{};:,.?/` (sans espace ni guillemets, pour éviter les confusions au copier-coller)
- [x] « Un caractère = un caractère Unicode affiché » (S01 RG-4) : le compteur compte-t-il les graphèmes (un emoji composé = 1 caractère, via `Intl.Segmenter`) ? — impact : T03 - reponse : oui, le compteur compte les graphèmes (un emoji composé = 1 caractère, via `Intl.Segmenter`)
- [x] Après une création réussie, vers quelle route l'expéditeur est-il dirigé, et comment l'écran de S02 reçoit-il l'identifiant et la date d'expiration ? Proposition : route `/lien-genere`, données passées dans l'état de navigation (pas dans l'URL, pas dans le stockage du navigateur). — impact : T05 - reponse : route `/lien-genere`, données passées dans l'état de navigation (pas dans l'URL, pas dans le stockage du navigateur)
- [x] Saisie conservée après la redirection de S00 RG-7 : conservation en mémoire uniquement (état de l'application, perdue si l'onglet est rechargé), sans jamais écrire le secret dans `localStorage` ou `sessionStorage` ? — impact : T05 - reponse : oui, conservation en mémoire uniquement

## Tickets

### T01 — Créer l'API de création de secret
- priorité: P0
- dépend de: S00/T02, S00/T03
- issue: 13

#### Objectif
Exposer `POST /api/secrets` : valider la demande, générer un identifiant sûr, stocker le contenu opaque dans Valkey avec sa durée de vie, et renvoyer l'identifiant et la date d'expiration.

#### Critères d'acceptation
- [ ] CA1 — Une création valide renvoie 201 avec un identifiant de 32 caractères `[a-z0-9]` et une date d'expiration égale à l'heure de création + la durée choisie `auto`
- [ ] CA2 — L'enregistrement Valkey a une durée de vie égale à la durée choisie (1 h, 4 h, 24 h, 7 j, 14 j) `auto`
- [ ] CA3 — Un type ou une durée hors liste, ou un contenu absent, est refusé (400) et rien n'est stocké `auto`
- [ ] CA4 — Un contenu de plus de 10 Ko est refusé (413) et rien n'est stocké `auto`
- [ ] CA5 — Le contenu est stocké tel quel, sans contrôle de format (un lien `http://` envoyé directement à l'API est accepté : le contrôle `https://` est fait dans le navigateur) `auto`
- [ ] CA6 — En cas de collision d'identifiant, un nouvel identifiant est tiré et le secret existant n'est pas écrasé `auto`
- [ ] CA7 — Valkey indisponible ou mémoire pleine : l'API répond 500 avec le message générique de S00 RG-7 `auto`
- [ ] CA8 — Une création n'écrit rien sur la sortie standard ni sur la sortie d'erreur de l'application `auto`

#### Plan par couche
- **db** : `server/data/secrets.ts` : `enregistrerSecret(identifiant, secret, dureeSecondes)` qui écrit la clé `secret:<identifiant>` avec `SET … NX EX` (via le client de `server/data/valkey.ts`) et renvoie `false` en cas de collision ; valeur stockée : `{ type, contenu, expireLe }`
- **server** : schémas Zod partagés dans `shared/schemas/secret.ts` (`creationSecretSchema` : `type` ∈ `message | mot-de-passe | lien`, `duree` ∈ `1h | 4h | 24h | 7j | 14j`, `contenu` chaîne non vide ≤ 10 Ko ; `reponseCreationSchema` : `identifiant`, `expireLe` ISO 8601) ; `server/utils/identifiant.ts` : `genererIdentifiant()` (32 caractères `[a-z0-9]`, `crypto.randomBytes` avec rejet des valeurs biaisées) ; route Fastify `POST /api/secrets` dans `server/api/secrets.ts` (limite de corps 10 Ko → 413, nouveau tirage sur collision, erreurs transmises au gestionnaire commun `server/utils/erreurs.ts`)
- **front** : —
- **test** : Vitest `tests/unit/server/secrets.test.ts` sur une instance Valkey de test : CA1 à CA7 (collision simulée en forçant le générateur, mémoire pleine avec `maxmemory` 10 Mo), CA8 avec un espion sur `stdout`/`stderr` ; `tests/unit/server/identifiant.test.ts` pour le format

#### Hors périmètre
- Chiffrement du contenu (S04). Lecture et suppression du secret (S03).

### T02 — Construire l'écran de création
- priorité: P1
- dépend de: S00/T04
- issue: 14

#### Objectif
Afficher l'écran « Créer un secret » : onglets de type, éditeur monospace avec compteur, sélecteur de durée et garanties architecturales.

#### Critères d'acceptation
- [ ] CA1 — Les onglets Message, Mot de passe et Lien sélectionnent le type correspondant `auto`
- [ ] CA2 — Le contenu saisi est conservé quand l'expéditeur change d'onglet `auto`
- [ ] CA3 — Le compteur de caractères se met à jour pendant la saisie `auto`
- [ ] CA4 — Le sélecteur propose seulement 1 h, 4 h, 24 h, 7 j et 14 j ; 24 h est sélectionnée par défaut et marquée « recommandé » `auto`
- [ ] CA5 — Les garanties architecturales (Valkey en mémoire sans persistance, Traefik TLS 1.3, zéro trace, zéro compte) sont affichées `auto`
- [ ] CA6 — L'écran respecte la maquette `docs/design/eloneva_secret_cr_er_un_secret/` et le design Kinetic Sentinel `manuel`

#### Plan par couche
- **db** : —
- **server** : —
- **front** : page `src/pages/CreationSecret.tsx` sur la route `/`, dans `MiseEnPage` (S00) ; composants `src/components/creation/OngletsType.tsx`, `EditeurSecret.tsx` (monospace + compteur), `SelecteurDuree.tsx`, `GarantiesArchitecturales.tsx` ; état du formulaire (type, contenu, durée) dans le hook `src/hooks/useFormulaireSecret.ts`
- **test** : Playwright `tests/e2e/creation-ecran.spec.ts` (CA1 à CA5)

#### Hors périmètre
- Contrôles de saisie (T03), générateur de mot de passe (T04), envoi (T05).

### T03 — Contrôler la saisie dans le navigateur
- priorité: P1
- dépend de: T02
- issue: 15

#### Objectif
Appliquer les contrôles de S01 RG-2, RG-4 et RG-5 avant l'envoi : lien en `https://`, limite de 1500 caractères, contenu vide.

#### Critères d'acceptation
- [ ] CA1 — Au-delà de 1500 caractères, le message « Le secret est trop long, vous êtes limité à 1500 caractères. » s'affiche et le bouton de création est désactivé ; il se réactive sous la limite `auto`
- [ ] CA2 — Un contenu vide ou fait uniquement d'espaces et de retours à la ligne affiche à la validation « Sans doute une erreur, le secret ne peut pas être vide. » et n'est pas envoyé `auto`
- [ ] CA3 — Dans l'onglet Lien, une valeur qui n'est pas une URL absolue en `https://` affiche « Le lien doit commencer par https://. » et n'est pas envoyée `auto`
- [ ] CA4 — Le comptage suit la règle retenue pour les caractères Unicode (voir questions) `auto`

#### Plan par couche
- **db** : —
- **server** : —
- **front** : fonctions pures dans `src/services/validationSecret.ts` (`compterCaracteres`, `estVide`, `estLienHttps` via `new URL`, messages en constantes) ; branchement dans `useFormulaireSecret` (erreurs, état du bouton)
- **test** : Vitest `tests/unit/front/validationSecret.test.ts` (CA1 à CA4 sur les fonctions) ; Playwright `tests/e2e/creation-validation.spec.ts` (messages et bouton)

#### Hors périmètre
- Contrôles côté serveur (T01).

### T04 — Générer un mot de passe
- priorité: P2
- dépend de: T02
- issue: 16

#### Objectif
Ajouter l'assistant de génération de l'onglet Mot de passe (S01 RG-3).

#### Critères d'acceptation
- [ ] CA1 — Avec les réglages par défaut, le mot de passe généré fait 20 caractères et contient au moins une minuscule, une majuscule, un chiffre et un symbole `auto`
- [ ] CA2 — La longueur est réglable de 8 à 128 ; le mot de passe généré a la longueur choisie `auto`
- [ ] CA3 — Il est impossible de décocher les quatre jeux ; chaque jeu coché est représenté au moins une fois `auto`
- [ ] CA4 — Le mot de passe est placé en clair dans l'éditeur `auto`
- [ ] CA5 — La génération utilise `crypto.getRandomValues` (aucun appel à `Math.random`) `auto`

#### Plan par couche
- **db** : —
- **server** : —
- **front** : `src/services/generateurMotDePasse.ts` (fonction pure, tirage sans biais, au moins un caractère par jeu, mélange final) ; composant `src/components/creation/AssistantMotDePasse.tsx` (longueur, 4 cases à cocher) affiché dans l'onglet Mot de passe
- **test** : Vitest `tests/unit/front/generateurMotDePasse.test.ts` (CA1 à CA3, CA5 par contrôle du code) ; Playwright `tests/e2e/creation-mot-de-passe.spec.ts` (CA4)

#### Hors périmètre
- Mesure de robustesse d'un mot de passe saisi à la main.

### T05 — Envoyer le secret et gérer le résultat
- priorité: P1
- dépend de: T01, T03
- issue: 17

#### Objectif
Envoyer la demande à `POST /api/secrets`, empêcher le double envoi, diriger l'expéditeur vers l'écran du lien généré, et conserver sa saisie en cas d'échec.

#### Critères d'acceptation
- [ ] CA1 — Une création réussie dirige l'expéditeur vers l'écran du lien généré, avec l'identifiant et la date d'expiration `auto`
- [ ] CA2 — Le bouton est désactivé pendant l'envoi ; un double clic n'envoie qu'une seule requête `auto`
- [ ] CA3 — Valkey indisponible : la règle S00 RG-7 s'applique (message, redirection vers `/`) et le type, le contenu et la durée saisis sont conservés `auto`
- [ ] CA4 — Mémoire Valkey pleine : la création échoue selon S00 RG-7 et la saisie est conservée `auto`
- [ ] CA5 — Après une création de bout en bout, ni l'application, ni Traefik, ni Valkey n'ont écrit de journal (S00 RG-8) `manuel`

#### Plan par couche
- **db** : —
- **server** : —
- **front** : fonction `creerSecret` dans le client commun `src/services/api.ts` (S00), validée par `reponseCreationSchema` ; hook `src/hooks/useCreationSecret.ts` (état d'envoi, navigation vers l'écran de S02, conservation de la saisie en cas d'échec selon la réponse aux questions)
- **test** : Playwright `tests/e2e/creation-envoi.spec.ts` (CA1, CA2 en comptant les requêtes, CA3 avec l'API simulée en 500, CA4 avec Valkey à 10 Mo) ; CA5 vérifié avec la procédure manuelle de S00/T05 (`docker logs` vide)

#### Hors périmètre
- Contenu de l'écran du lien généré (S02). Chiffrement avant envoi (S04).
