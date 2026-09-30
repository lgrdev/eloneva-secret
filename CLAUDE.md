# <Nom du projet>

Eloneva Secret est un service gratuit et sécurisé pour créer des liens auto-destructeurs. 
Ce site vous permet de partager des mots de passe, des messages confidentiels via des liens à usage unique qui expirent automatiquement après visualisation ou après une période définie. Contrairement aux e-mails ou aux applications de messagerie où les informations sensibles restent pour toujours, Eloneva Secret garantit que vos secrets sont définitivement supprimés après utilisation. Aucune inscription requise


## Stack

* Front : React, TypeScript, Tailwind CSS
* Back : Node.js, API REST
* Données : Valkey, accès via le client officiel / bibliothèque Redis-compatible
* Validation : Zod, schémas partagés dans `shared/schemas/**`
* Tests : Vitest (`tests/unit/**`), Playwright (`tests/e2e/**`)
* Proxy : Traefik ou Nginx, TLS 1.3, HTTP/2, HTTP/3
* Déploiement : Docker
* Mail : utilisation de Resend

### Commandes

* dev : `pnpm dev`
* build : `pnpm build`
* lint : `pnpm lint`
* typecheck : `pnpm typecheck`
* test : `pnpm test --run`
* chemins de tests : `tests/unit/**`, `tests/e2e/**`

### Couches

* data : `server/data/**`, accès à Valkey
* server : `server/api/**`, `server/utils/**`, `shared/schemas/**`
* front : `src/**`
* test : `tests/**`

### Conventions

* TypeScript strict
* Composants React fonctionnels
* Hooks React pour la logique d'état et les effets
* Tailwind CSS pour le style ; éviter les fichiers CSS spécifiques aux composants sauf nécessité
* Validation des entrées avec Zod
* Ne jamais accéder directement à Valkey depuis le navigateur
* Les accès aux données passent par la couche `server/data/**`
* Les slugs sont en kebab-case français
* Les noms de composants React sont en PascalCase
* Les fonctions et variables sont en camelCase
* Pas de logique métier dans les composants React
