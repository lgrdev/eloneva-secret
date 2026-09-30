---
spec: specs/chiffrement-client.md
spec_sha: 62ecd559b333984dae8a2eecf34c952b7907012c
epic_title: "Chiffrement client et mot de passe de déchiffrement"
epic_priority: P1
status: Backlog
epic_issue: 29
---

# Epic : Chiffrement client et mot de passe de déchiffrement

## Contexte
Chiffrer le secret dans le navigateur (AES-GCM 256, actif par défaut), placer la clé dans le fragment `#` de l'URL, et permettre un mot de passe facultatif qui entre dans le calcul de la clé sans jamais quitter le navigateur. Le serveur ne voit que du contenu chiffré et une empreinte de vérification : il ne renvoie et ne supprime le secret que si l'empreinte correspond, avec 5 essais au maximum.
Comme décidé (S04 RG-11), cette epic fait évoluer les parcours déjà livrés : API de création (S01/T01), écran de création et envoi (S01/T05), diffusion du lien (S02/T01, T03, T04), API et écrans de révélation (S03/T01, T02, T03).
Hors périmètre : types de secret et durées (S01), récupération d'un mot de passe oublié.

## Questions ouvertes
- [x] Secret sans mot de passe dont la clé du lien est altérée (empreinte refusée) : cet échec compte-t-il dans les 5 essais ? Proposition : oui, même compteur pour tous les échecs d'empreinte. — impact : T03, T06 — réponse : oui, même compteur pour tous les échecs d'empreinte. (métier, 2026-09-30)
- [x] Secret protégé par mot de passe : le serveur ne peut pas distinguer un mauvais mot de passe d'une clé altérée. Afficher toujours « Mot de passe incorrect. Il vous reste N essais. » dans ce cas ? — impact : T06 — réponse : oui, même message pour tous les échecs d'empreinte. (métier, 2026-09-30)
- [x] Texte exact de la mention zéro-connaissance du reçu d'audit (S04 RG-4) ? Proposition : « Chiffrement zéro-connaissance : le serveur n'a jamais eu accès au contenu en clair. » — impact : T06 — réponse : « Chiffrement zéro-connaissance : le serveur n'a jamais eu accès au contenu en clair. » (métier, 2026-09-30)

## Tickets

### T01 — Créer le service de chiffrement du navigateur
- priorité: P0
- dépend de: —
- issue: 30

#### Objectif
Fournir, côté navigateur, la génération de la clé, la dérivation de la clé finale (avec ou sans mot de passe), le chiffrement et le déchiffrement AES-GCM 256, et le calcul de l'empreinte de vérification.

#### Critères d'acceptation
- [ ] CA1 — Un contenu chiffré puis déchiffré avec la même clé (et le même mot de passe) redonne exactement le texte d'origine `auto`
- [ ] CA2 — Le déchiffrement échoue avec une clé ou un mot de passe différents `auto`
- [ ] CA3 — La clé générée fait 256 bits et est encodée pour le fragment d'URL (base64url, sans `#`, `/` ni `+`) `auto`
- [ ] CA4 — L'empreinte est différente de la clé de chiffrement et ne permet pas de déchiffrer le contenu `auto`
- [ ] CA5 — Deux chiffrements du même texte produisent des contenus chiffrés différents (vecteur d'initialisation aléatoire) `auto`
- [ ] CA6 — Sans API de chiffrement du navigateur, le service le signale explicitement (aucun repli en clair) `auto`

#### Plan par couche
- **db** : —
- **server** : format du contenu chiffré partagé dans `shared/schemas/contenuChiffre.ts` (version, vecteur d'initialisation, sel, données, en base64url)
- **front** : `src/services/chiffrement.ts` (Web Crypto) : `genererCle()` (256 bits aléatoires) ; `deriverCleFinale(cleFragment, motDePasse?, sel)` (PBKDF2-SHA-256 sur le mot de passe, combiné à la clé du fragment par HKDF) ; `deriverCleChiffrement` et `deriverEmpreinte` par HKDF avec deux libellés distincts ; `chiffrer` / `dechiffrer` AES-GCM 256 avec vecteur d'initialisation de 96 bits aléatoire ; `chiffrementDisponible()`
- **test** : Vitest `tests/unit/front/chiffrement.test.ts` (CA1 à CA6, Web Crypto de Node ; CA6 en masquant `crypto.subtle`)

#### Hors périmètre
- Écrans et appels API (T04, T05, T06).

### T02 — Accepter l'empreinte à la création
- priorité: P0
- dépend de: S01/T01
- issue: 31

#### Objectif
Faire évoluer `POST /api/secrets` pour accepter un secret chiffré avec son empreinte et son indicateur « protégé », et stocker l'empreinte et un compteur d'échecs à 0.

#### Critères d'acceptation
- [ ] CA1 — Un secret chiffré est stocké avec son empreinte, l'indicateur « protégé » et un compteur d'échecs à 0, avec la même durée de vie que le secret `auto`
- [ ] CA2 — Un secret déclaré chiffré sans empreinte est refusé (400) `auto`
- [ ] CA3 — Un secret non chiffré reste accepté sans empreinte, comme avant `auto`
- [ ] CA4 — La requête ne contient jamais la clé ni le mot de passe (le schéma n'a pas de champ pour eux et rejette les champs inconnus) `auto`

#### Plan par couche
- **db** : `server/data/secrets.ts` : valeur stockée étendue à `{ type, contenu, expireLe, chiffre, protege, empreinte, echecs }`
- **server** : `creationSecretSchema` étendu dans `shared/schemas/secret.ts` (`chiffre`, `protege`, `empreinte` obligatoire si `chiffre`, schéma strict) ; route `POST /api/secrets` dans `server/api/secrets.ts`
- **front** : —
- **test** : Vitest `tests/unit/server/secrets-chiffre.test.ts` sur une instance Valkey de test (CA1 à CA4)

#### Hors périmètre
- Vérification de l'empreinte à la révélation (T03).

### T03 — Vérifier l'empreinte avant la révélation
- priorité: P0
- dépend de: T02, S03/T01
- issue: 32

#### Objectif
Indiquer à l'ouverture si le secret est protégé, et faire évoluer la révélation : ne renvoyer et supprimer le secret que si l'empreinte correspond, compter les échecs et détruire le secret au 5ᵉ.

#### Critères d'acceptation
- [ ] CA1 — L'état d'un secret indique s'il est chiffré et protégé par mot de passe, sans renvoyer le contenu ni l'empreinte `auto`
- [ ] CA2 — Empreinte correcte : le contenu chiffré est renvoyé et le secret est supprimé dans la même opération `auto`
- [ ] CA3 — Empreinte incorrecte (mauvais mot de passe ou clé altérée, secret protégé ou non) : le secret n'est pas consommé, le même compteur augmente et la réponse indique le nombre d'essais restants `auto`
- [ ] CA4 — Au 5ᵉ échec, le secret est détruit `auto`
- [ ] CA5 — Vérification, incrément et suppression sont atomiques : deux essais simultanés ne dépassent pas la limite et une seule bonne réponse reçoit le contenu `auto`
- [ ] CA6 — La comparaison d'empreinte est faite à temps constant `auto`
- [ ] CA7 — Un secret non chiffré se révèle comme avant, sans empreinte `auto`

#### Plan par couche
- **db** : `server/data/secrets.ts` : `verifierEtReveler(identifiant, empreinte)` exécutée par un script Lua Valkey (lecture, comparaison, incrément ou `DEL`, en une seule opération) ; renvoie « révélé », « refusé (essais restants) » ou « détruit »
- **server** : `etatSecretSchema` étendu (`chiffre`, `protege`) et `revelationSecretSchema` (`empreinte` facultative) dans `shared/schemas/secret.ts` ; routes `GET /api/secrets/:identifiant/etat` et `POST /api/secrets/:identifiant/revelation` dans `server/api/revelation.ts` (403 avec `essaisRestants` en cas de refus, 404 si détruit) ; comparaison à temps constant (`crypto.timingSafeEqual`) avant l'appel du script, ou dans le script sur des empreintes de longueur fixe
- **front** : —
- **test** : Vitest `tests/unit/server/revelation-empreinte.test.ts` sur une instance Valkey de test (CA1 à CA7 ; CA5 par requêtes parallèles)

#### Hors périmètre
- Messages affichés au destinataire (T06).

### T04 — Chiffrer le secret à la création
- priorité: P1
- dépend de: T01, T02, S01/T05
- issue: 33

#### Objectif
Ajouter à l'écran de création le commutateur (activé par défaut) et le champ de mot de passe, chiffrer avant l'envoi, et transmettre l'URL avec la clé à l'écran du lien généré.

#### Critères d'acceptation
- [ ] CA1 — Le commutateur de chiffrement AES-GCM 256 est affiché et activé par défaut `auto`
- [ ] CA2 — Un champ de mot de passe facultatif accepte 8 à 128 caractères ; hors de ces bornes, la création est impossible `auto`
- [ ] CA3 — Saisir un mot de passe active le chiffrement et verrouille le commutateur ; vider le champ le déverrouille `auto`
- [ ] CA4 — Chiffrement activé : la requête envoyée au serveur ne contient ni le texte en clair, ni la clé, ni le mot de passe `auto`
- [ ] CA5 — Chiffrement activé : l'écran du lien généré reçoit l'URL `https://secret.eloneva.com/s/<identifiant>#<clé>` `auto`
- [ ] CA6 — Navigateur sans API de chiffrement : la création est bloquée avec « Votre navigateur ne permet pas de chiffrer ce secret. » et rien n'est envoyé `auto`
- [ ] CA7 — Chiffrement désactivé (sans mot de passe) : la création fonctionne comme avant `auto`

#### Plan par couche
- **db** : —
- **server** : —
- **front** : composants `src/components/creation/CommutateurChiffrement.tsx` et `ChampMotDePasse.tsx` dans `src/pages/CreationSecret.tsx` ; état étendu dans `src/hooks/useFormulaireSecret.ts` ; `src/hooks/useCreationSecret.ts` : chiffrement via `src/services/chiffrement.ts` avant `creerSecret`, envoi de l'empreinte, ajout de `#<clé>` et de l'indicateur « protégé » dans l'état de navigation vers `/lien-genere`
- **test** : Playwright `tests/e2e/creation-chiffree.spec.ts` (CA1 à CA7 ; CA4 en interceptant la requête ; CA6 en masquant `crypto.subtle`)

#### Hors périmètre
- Affichage du lien chiffré (T05).

### T05 — Diffuser le lien chiffré
- priorité: P1
- dépend de: T04, S02/T03, S02/T04
- issue: 34

#### Objectif
Utiliser l'URL avec `#<clé>` partout où le lien est diffusé, afficher le badge « Chiffré AES-256 » selon le chiffrement, et le rappel de transmission du mot de passe.

#### Critères d'acceptation
- [ ] CA1 — L'URL copiée, celle du message prêt à envoyer et celle encodée dans le QR Code contiennent le fragment `#<clé>` `auto`
- [ ] CA2 — Le badge « Chiffré AES-256 » est affiché dans la modale QR Code pour un secret chiffré, masqué sinon `auto`
- [ ] CA3 — Pour un secret protégé, l'écran affiche « Transmettez le mot de passe par un autre moyen que le lien (appel, SMS séparé…). » ; sinon ce rappel est absent `auto`
- [ ] CA4 — Le QR Code d'une URL avec clé reste lisible par un téléphone `manuel`

#### Plan par couche
- **db** : —
- **server** : —
- **front** : `src/hooks/useLienGenere.ts` (lecture de l'URL complète et de l'indicateur « protégé ») ; `src/components/lien/UrlSecret.tsx`, `PartageMessage.tsx`, `ModaleQrCode.tsx` (badge conditionnel) ; nouveau composant `src/components/lien/RappelMotDePasse.tsx`
- **test** : Playwright `tests/e2e/lien-chiffre.spec.ts` (CA1 à CA3 ; CA1 en décodant le QR Code)

#### Hors périmètre
- Déverrouillage par le destinataire (T06).

### T06 — Déverrouiller et déchiffrer le secret
- priorité: P1
- dépend de: T01, T03, S03/T03
- issue: 35

#### Objectif
À l'ouverture, lire la clé puis la retirer de l'URL, afficher le champ de mot de passe si le secret est protégé, envoyer l'empreinte, afficher les erreurs, déchiffrer le contenu et la mention zéro-connaissance.

#### Critères d'acceptation
- [ ] CA1 — À l'ouverture, le fragment `#` est retiré de l'URL affichée sans recharger la page `auto`
- [ ] CA2 — Secret protégé : le champ de mot de passe est affiché et obligatoire ; secret non protégé : aucun champ `auto`
- [ ] CA3 — Bon mot de passe : le contenu s'affiche en clair après déchiffrement dans le navigateur `auto`
- [ ] CA4 — Mauvais mot de passe : le contenu n'est pas affiché, le secret n'est pas consommé et « Mot de passe incorrect. Il vous reste N essais. » s'affiche (« Il vous reste 1 essai. » au 4ᵉ échec) `auto`
- [ ] CA5 — Au 5ᵉ échec, le secret est détruit et le message d'indisponibilité s'affiche `auto`
- [ ] CA6 — Clé absente du lien : « Ce lien est incomplet ou altéré. » s'affiche sans aucune requête de révélation ; secret non protégé dont la clé est altérée : le même message s'affiche, l'échec compte dans les 5 essais et le secret n'est pas consommé avant le 5ᵉ `auto`
- [ ] CA10 — Secret protégé : tout échec d'empreinte (mauvais mot de passe ou clé altérée) affiche « Mot de passe incorrect. Il vous reste N essais. » `auto`
- [ ] CA7 — Navigateur sans API de chiffrement : « Votre navigateur ne permet pas de chiffrer ce secret. » s'affiche et le secret n'est pas consommé `auto`
- [ ] CA8 — Secret chiffré : le reçu d'audit affiche « Chiffrement zéro-connaissance : le serveur n'a jamais eu accès au contenu en clair. » ; secret non chiffré : la mention est absente `auto`
- [ ] CA9 — Le serveur ne reçoit jamais la clé ni le mot de passe pendant le déverrouillage `auto`

#### Plan par couche
- **db** : —
- **server** : —
- **front** : `src/hooks/useDeverrouillage.ts` : lecture de `location.hash` puis `history.replaceState` sans le fragment, état « protégé » depuis `lireEtatSecret`, calcul de l'empreinte et appel de `revelerSecret` avec l'empreinte, gestion des réponses 403 (essais restants) et 404, déchiffrement via `src/services/chiffrement.ts` ; composant `src/components/revelation/ChampMotDePasseDestinataire.tsx` dans `src/pages/DeverrouillerSecret.tsx` ; mention dans `src/components/revelation/SecretRevele.tsx` ; accord singulier dans une fonction pure `messageEssaisRestants(n)` de `src/services/messagesChiffrement.ts`
- **test** : Vitest `tests/unit/front/messagesChiffrement.test.ts` ; Playwright `tests/e2e/deverrouillage-chiffre.spec.ts` (CA1 à CA10 ; CA6 avec un fragment tronqué et sans fragment ; CA9 en interceptant les requêtes)

#### Hors périmètre
- Récupération d'un mot de passe oublié.
