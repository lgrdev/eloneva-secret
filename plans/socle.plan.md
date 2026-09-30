---
spec: specs/socle.md
spec_sha: e896cc91598803b0474f0580fd2a2ddb4f7aeb28
epic_title: "Socle"
epic_priority: P0
status: Backlog
epic_issue: 5
---

# Epic : Socle

## Contexte
Mettre en place la base commune d'Eloneva Secret : projet TypeScript strict (front React + Tailwind, API REST Node.js, schémas Zod partagés), accès à Valkey avec durée de vie par enregistrement, gestion commune des pannes, mise en page commune au design « Kinetic Sentinel », et déploiement Docker derrière Traefik (TLS 1.3, HTTP/2, HTTP/3). Règles transverses : zéro compte, zéro trace (aucune journalisation), Valkey en mémoire sans persistance, qui refuse les écritures quand sa mémoire est pleine.
Décisions techniques : API Fastify, front Vite, un seul conteneur applicatif qui sert l'API et le front construit ; pilote de journaux Docker `none` pour tous les services ; Valkey `maxmemory` 10 Mo en test, 100 Mo en production ; endpoint technique `GET /api/sante` ; TLS Let's Encrypt en production, auto-signé en local.
Les critères de bout en bout de la spec (« création puis révélation sans journal », « mémoire pleine → la création échoue ») sont vérifiés dans S01 et S03 ; ici on vérifie la configuration et la couche données.
Hors périmètre : toute fonctionnalité métier (création, partage, réception : S01 à S04), pied de page et mentions légales, limite de débit, accessibilité.

## Questions ouvertes
- [x] Quel framework serveur pour l'API REST (Express, Fastify, Hono…) et quel outil de build pour le front (Vite ?) ? Le serveur Node sert-il aussi le front construit (un seul conteneur applicatif) ou y a-t-il deux conteneurs ? — impact : T01, T05 — réponse : Fastify + Vite, un seul conteneur applicatif (métier, 2026-09-30)
- [x] Zéro trace (RG-8) et Docker : les sorties standard des conteneurs sont capturées par Docker, ce qui constitue un journal. Faut-il configurer le pilote de journaux Docker à `none` pour l'application, Valkey et Traefik ? — impact : T03, T05 — réponse : oui, pilote `none`, aucun journal (métier, 2026-09-30)
- [x] RG-7 doit être vérifiable dès S00, alors qu'aucun endpoint métier n'existe encore. Un endpoint technique (par exemple ``GET /api/sante`, qui interroge Valkey) est-il autorisé pour porter ce comportement et ses tests ? — impact : T03 — réponse : `GET /api/sante`, qui interroge Valkey (métier, 2026-09-30)
- [x] Quelle mémoire maximale allouer à Valkey (`maxmemory`) ? — impact : T02, T05 — réponse : 10 Mo pour les tests unitaires, 100 Mo pour la production (métier, 2026-09-30)
- [x] Les critères « création puis révélation sans journal » et « mémoire pleine → la création échoue » supposent les endpoints de S01 et S03. En S00, on vérifie la configuration et la couche données ; faut-il reporter les critères de bout en bout dans S01 et S03 ? — impact : T02, T03, T05 — réponse : Oui, les critères de bout en bout seront vérifiés dans S01 et S03, mais T02 et T03 se concentrent sur la configuration et la couche données. (métier, 2026-09-30)
- [x] Certificats TLS : Let's Encrypt via Traefik en production ? En local, certificat auto-signé ? — impact : T05 — réponse : Let's Encrypt via Traefik en production et auto-signé en local, avec un certificat racine auto-signé pour le développement et les tests e2e. (métier, 2026-09-30)

## Tickets

### T01 — Initialiser le projet et l'outillage
- priorité: P0
- dépend de: —
- issue: 6

#### Objectif
Créer la structure du projet (front, serveur, schémas partagés, tests) avec TypeScript strict et les commandes `pnpm dev`, `build`, `lint`, `typecheck`, `test`.

#### Critères d'acceptation
- [ ] CA1 — `pnpm lint`, `pnpm typecheck`, `pnpm test --run` et `pnpm build` s'exécutent sans erreur sur le projet initial `manuel`
- [ ] CA2 — `pnpm dev` démarre le front et l'API ; la page d'accueil répond 200 `auto`
- [ ] CA3 — La configuration TypeScript est en mode strict dans tous les paquets `auto`

#### Plan par couche
- **db** : —
- **server** : serveur Fastify ; point d'entrée de l'API REST dans `server/api/index.ts`, qui sert aussi le front construit en production, utilitaires dans `server/utils/`, dossier `shared/schemas/` pour les schémas Zod partagés ; `tsconfig` strict
- **front** : application React + Tailwind construite avec Vite dans `src/` (point d'entrée `src/main.tsx`, composant racine `src/App.tsx`), route `/` provisoire
- **test** : configuration Vitest (`tests/unit/**`, rapport JUnit `reports/junit.xml`) et Playwright (`tests/e2e/**`, rapport JUnit `reports/e2e.xml`) conformes au workflow CI ; test e2e du démarrage (CA2) ; test unitaire vérifiant `strict: true` (CA3)

#### Hors périmètre
- Accès à Valkey (T02), mise en page (T04), Docker (T05).

### T02 — Accéder à Valkey avec durée de vie par enregistrement
- priorité: P0
- dépend de: T01
- issue: 7

#### Objectif
Fournir la couche d'accès à Valkey (`server/data/**`) : écriture avec durée de vie, lecture, suppression, et erreur explicite quand Valkey refuse une écriture (mémoire pleine) ou est injoignable.

#### Critères d'acceptation
- [ ] CA1 — Un enregistrement écrit avec une durée de vie n'est plus lisible une fois cette durée écoulée `auto`
- [ ] CA2 — Quand la mémoire de Valkey est pleine, une écriture est refusée avec une erreur typée, et les enregistrements existants restent lisibles `auto`
- [ ] CA3 — Quand Valkey est injoignable, la couche données lève une erreur typée « service indisponible » `auto`
- [ ] CA4 — La configuration Valkey désactive toute persistance disque (RDB et AOF) et utilise la politique `noeviction` `auto`

#### Plan par couche
- **db** : client Valkey (bibliothèque compatible Redis) dans `server/data/valkey.ts` ; fonctions `ecrireAvecDuree`, `lire`, `supprimer` ; erreurs typées `MemoirePleineError`, `ServiceIndisponibleError` ; fichier `valkey.conf` : `save ""`, `appendonly no`, `maxmemory-policy noeviction`, `maxmemory` 100 Mo (production), aucun fichier de journal
- **server** : —
- **front** : —
- **test** : tests Vitest d'intégration sur une instance Valkey de test (`tests/unit/data/valkey.test.ts`) : expiration (CA1), mémoire pleine avec `maxmemory` 10 Mo (CA2), Valkey arrêté (CA3), lecture de la configuration (CA4)

#### Hors périmètre
- Modèle de données d'un secret (S01).

### T03 — Gérer les pannes de façon commune (RG-7)
- priorité: P0
- dépend de: T01, T02
- issue: 8

#### Objectif
En cas de panne serveur ou de Valkey indisponible, l'API répond 500 avec un message générique, le front affiche « Service temporairement indisponible. Veuillez réessayer plus tard. » et redirige vers l'écran de création, sans rien journaliser.

#### Critères d'acceptation
- [ ] CA1 — Valkey arrêté : `GET /api/sante` répond 500 avec le message « Service temporairement indisponible. Veuillez réessayer plus tard. » `auto`
- [ ] CA2 — Sur une réponse 500, le front affiche ce message et redirige vers l'écran de création (`/`) `auto`
- [ ] CA3 — Une panne provoquée n'écrit rien sur la sortie standard ni sur la sortie d'erreur de l'application `auto`
- [ ] CA4 — L'application ne contient aucun journal d'accès ni aucun appel de journalisation `auto`

#### Plan par couche
- **db** : —
- **server** : gestionnaire d'erreurs global dans `server/utils/erreurs.ts` qui convertit toute erreur (dont `ServiceIndisponibleError`, `MemoirePleineError`) en 500 avec le message générique, sans journaliser ; schéma de réponse d'erreur dans `shared/schemas/erreur.ts` ; endpoint technique `GET /api/sante` dans `server/api/sante.ts`, qui interroge Valkey et répond 200 quand il est joignable
- **front** : client API commun dans `src/services/api.ts` qui intercepte les 500 ; hook `src/hooks/useErreurService.ts` qui affiche le message et redirige vers `/`
- **test** : Vitest `tests/unit/server/erreurs.test.ts` (CA1, CA3 : espion sur `stdout`/`stderr`), contrôle statique sans `console.*` ni logger (CA4) ; Playwright `tests/e2e/panne.spec.ts` (CA2)

#### Hors périmètre
- Messages d'erreur métier propres à chaque écran (S01 à S04).

### T04 — Mettre en place la mise en page commune et le design Kinetic Sentinel
- priorité: P1
- dépend de: T01
- issue: 9

#### Objectif
Appliquer le système de design « Kinetic Sentinel » (couleurs, typographie) à Tailwind et créer la mise en page commune avec l'en-tête et le logo, en français, responsive.

#### Critères d'acceptation
- [ ] CA1 — Chaque écran affiche l'en-tête commun avec le logo Eloneva Secret `auto`
- [ ] CA2 — Le document est déclaré en français (`lang="fr"`) `auto`
- [ ] CA3 — À 375 px de large, la page n'a pas de défilement horizontal `auto`
- [ ] CA4 — Les couleurs et la typographie correspondent à `docs/design/kinetic_sentinel/DESIGN.md` `manuel`
- [ ] CA5 — La page ne charge aucune ressource d'un autre domaine (polices et images servies localement) `auto`

#### Plan par couche
- **db** : —
- **server** : —
- **front** : jetons de design dans `tailwind.config.ts` (depuis `DESIGN.md`) ; composants `src/components/MiseEnPage.tsx` et `src/components/EnTete.tsx` ; logo depuis `docs/design/eloneva_secret_logo/` copié dans les ressources du front ; polices servies localement
- **test** : Playwright `tests/e2e/mise-en-page.spec.ts` (CA1, CA2, CA3 en viewport mobile, CA5 en surveillant les requêtes réseau)

#### Hors périmètre
- Pied de page et mentions légales. Contenu des écrans métier (S01 à S04).

### T05 — Conteneuriser l'application derrière Traefik
- priorité: P1
- dépend de: T02, T03
- issue: 10

#### Objectif
Construire et lancer l'application, Valkey et Traefik avec Docker ; Traefik termine TLS 1.3 avec HTTP/2 et HTTP/3 ; aucun service ne journalise.

#### Critères d'acceptation
- [ ] CA1 — `docker compose up` lance l'application (un seul conteneur), Valkey et Traefik ; le site répond en HTTPS, avec un certificat auto-signé en local `manuel`
- [ ] CA2 — Une connexion en TLS 1.2 est refusée ; TLS 1.3, HTTP/2 et HTTP/3 sont acceptés `manuel`
- [ ] CA3 — Les journaux d'accès de Traefik sont désactivés et le pilote de journaux Docker est `none` pour l'application, Valkey et Traefik : `docker logs` ne renvoie rien `manuel`
- [ ] CA4 — Après redémarrage du conteneur Valkey, aucun enregistrement n'est conservé `manuel`

#### Plan par couche
- **db** : service Valkey dans `docker-compose.yml` avec `valkey.conf` (T02), sans volume de données
- **server** : `Dockerfile` multi-étapes (build Vite du front et du serveur Fastify, un seul conteneur) ; `docker-compose.yml` (application, Valkey, Traefik) avec `logging: driver: none` pour chaque service ; configuration Traefik : TLS 1.3 minimum, HTTP/3, `accessLog` désactivé ; certificats Let's Encrypt en production, certificat racine auto-signé en local pour le développement et les tests e2e ; routage vers `secret.eloneva.com`
- **front** : —
- **test** : procédure de vérification manuelle documentée dans `docs/` (CA1 à CA4)

#### Hors périmètre
- Hébergement et nom de domaine de production.
