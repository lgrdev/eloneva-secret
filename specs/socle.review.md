---
spec: specs/socle.md
spec_sha: 099dbb7cf3fcca99ad8a8bca4b222903b46d8612
verdict: à compléter
date: 2026-09-30
---

# Revue de spec : Socle

## Synthèse
La spec est courte et claire sur les principes : zéro compte, Valkey en mémoire, zéro trace, règle de panne commune, limite de débit. Elle est planifiable dans les grandes lignes, mais plusieurs règles transverses ne sont pas encore testables telles quelles : la réponse quand la limite de débit est dépassée, le périmètre exact du « zéro trace », le comportement quand la mémoire Valkey est pleine. Il manque aussi des protections transverses attendues pour un service de secrets (en-têtes de sécurité, pas de mise en cache, adresse IP fiable derrière Traefik) et les mentions légales, obligatoires pour un site public en France. Deux questions sont déjà ouvertes dans la spec.

## Constats

### R1 — MAJEUR — Limite de débit dépassée : réponse non définie
- [x] résolu
- section: RG-9, Erreurs et cas limites
- constat: la spec dit seulement « la création est refusée ». Le code HTTP, le message affiché et la possibilité d'indiquer quand réessayer ne sont pas fixés (question ouverte dans la spec). Le critère d'acceptation ne peut vérifier que le refus, pas ce que voit l'expéditeur.
- proposition: « Au-delà de 60 créations dans l'heure, le serveur répond 429 et l'écran affiche : « Vous avez atteint la limite de 60 secrets par heure. Réessayez plus tard. » L'expéditeur reste sur l'écran de création, sa saisie est conservée. »

### R2 — MAJEUR — Adresse IP du client derrière Traefik
- [x] résolu
- section: RG-9
- constat: derrière Traefik, l'application voit l'adresse de Traefik, pas celle du client. Si elle lit l'en-tête `X-Forwarded-For` sans restriction, n'importe qui peut le falsifier et contourner la limite. S'ajoute la question ouverte : faut-il garder l'IP en clair ou une empreinte dans le compteur ?
- proposition: « L'adresse IP du client est prise dans l'en-tête posé par Traefik, uniquement quand la requête vient de Traefik. Le compteur utilise une empreinte (hachage avec sel) de l'adresse, jamais l'adresse en clair. »

### R3 — MAJEUR — Limite de débit testée dans S00, alors que la création est dans S01
- [x] résolu
- section: RG-9, Critères d'acceptation
- constat: le critère « une adresse IP qui a créé 60 secrets… » exige l'endpoint de création, qui est livré par S01. Tel quel, le critère ne peut pas être prouvé à la fin de S00.
- proposition: S00 fournit le mécanisme de limitation, réutilisable et testé seul. Le critère « 61ᵉ création refusée » passe dans S01, qui renvoie à S00 RG-9.

### R4 — MAJEUR — « Zéro trace » : périmètre à préciser
- [x] résolu
- section: RG-8, Critères d'acceptation
- constat: « aucune journalisation des requêtes » ne dit pas si les journaux d'erreur de l'application sont autorisés (plantage, Valkey injoignable). Sans aucun journal, une panne ne peut pas être diagnostiquée. Sans règle précise, un message d'erreur pourrait contenir un identifiant ou une adresse IP. Le critère « aucun journal écrit » est vérifiable pour les journaux d'accès de Traefik (désactivés), mais pas pour tout le reste.
- proposition: « Les journaux d'accès de Traefik et de l'application sont désactivés. Les journaux d'erreur techniques sont autorisés, sans adresse IP, sans identifiant de secret, sans contenu, sans en-têtes de requête. » Critère : une erreur provoquée écrit un journal qui ne contient aucune de ces données.

### R5 — MAJEUR — Protections transverses absentes
- [x] résolu
- section: Règles métier, Non-fonctionnel
- constat: pour un service de secrets avec chiffrement dans le navigateur (S04), une injection de script suffirait à voler la clé présente dans le `#` de l'URL. Rien n'impose :
  - une politique de sécurité du contenu (CSP) ;
  - HSTS ;
  - `Referrer-Policy: no-referrer`, pour ne pas transmettre l'identifiant à des tiers ;
  - `Cache-Control: no-store` sur les réponses qui contiennent un secret ;
  - l'absence de ressources tierces (polices, CDN, statistiques), cohérente avec « zéro trace ».
- proposition: ajouter une règle RG-10 qui liste ces en-têtes et interdit les ressources tierces. Critère : chaque réponse porte ces en-têtes, et la page ne charge aucune ressource d'un autre domaine.

### R6 — MAJEUR — Mémoire Valkey pleine
- [x] résolu
- section: RG-2, RG-3
- constat: Valkey fonctionne en mémoire, sans disque. Quand la mémoire est pleine, soit il supprime des clés existantes (des secrets disparaîtraient sans prévenir avant leur expiration), soit il refuse les écritures. La spec ne choisit pas.
- proposition: « Valkey refuse les nouvelles écritures quand sa mémoire est pleine (aucune suppression de secret avant expiration). La création échoue alors selon RG-7. » Fixer la mémoire allouée.

### R7 — MAJEUR — Mentions légales et contenu du pied de page
- [x] résolu
- section: Parcours (mise en page commune)
- constat: le pied de page est cité sans contenu. Un site public édité en France doit publier des mentions légales (éditeur, hébergeur). Il faut aussi une information sur le traitement des données : même sans journal, l'adresse IP est traitée en mémoire pour la limite de débit. Le cahier des charges n'en parle pas.
- proposition: décider du contenu du pied de page et des pages à créer (mentions légales, confidentialité). Si elles sont retenues, les ajouter au socle ; sinon, les inscrire explicitement en hors périmètre.

### R8 — MINEUR — Docker et Valkey sans persistance : critères flous
- [x] résolu
- section: Critères d'acceptation, RG-3
- constat:
  - « L'application se construit et se lance via Docker » ne dit pas quels services sont lancés.
  - RG-3 (pas de persistance disque) n'a aucun critère d'acceptation.
- proposition:
  - « `docker compose up` lance l'application, Valkey et Traefik ; le site répond en HTTPS. »
  - « Après redémarrage de Valkey, aucun secret n'est conservé. »

### R9 — MINEUR — Accessibilité non définie
- [ ] résolu
- section: Non-fonctionnel
- constat: la langue et le mobile sont fixés, mais aucun niveau d'accessibilité n'est défini.
- proposition: « Niveau visé : RGAA / WCAG 2.1 AA » ou « hors périmètre pour la première version ».

### R10 — MINEUR — Traçabilité et mise en forme
- [ ] résolu
- section: Traçabilité, Non-fonctionnel
- constat: les numéros de lignes du cahier des charges sont décalés (voir G7 de la revue croisée). La section Non-fonctionnel contient une ligne vide qui coupe la liste.
- proposition: citer les titres de sections du cahier des charges, et regrouper la liste.

## Questions pour le métier
- [ ] Limite de débit dépassée : code 429, avec le message « Vous avez atteint la limite de 60 secrets par heure. Réessayez plus tard. » et la saisie conservée ? — impact : R1
- [ ] Compteur de la limite de débit : empreinte de l'adresse IP (recommandé) ou adresse en clair ? — impact : R2
- [ ] Journaux d'erreur techniques autorisés, sans adresse IP, identifiant ni contenu ? Ou aucun journal du tout ? — impact : R4
- [ ] Mémoire Valkey pleine : refuser les nouvelles créations (recommandé) ou supprimer les secrets les plus anciens ? — impact : R6
- [ ] Pied de page : mentions légales et page de confidentialité dans le socle, ou hors périmètre ? — impact : R7
- [ ] Accessibilité : niveau RGAA / WCAG 2.1 AA, ou hors périmètre pour la première version ? — impact : R9

## Couverture
| Axe | Statut | Commentaire |
|---|---|---|
| Testabilité | ⚠️ | Limite de débit (R1, R3), zéro trace (R4), Docker et persistance (R8) |
| Complétude fonctionnelle | ⚠️ | Contenu du pied de page (R7) |
| Erreurs et cas limites | ⚠️ | Panne couverte (RG-7) ; mémoire pleine (R6) et limite dépassée (R1) non définies |
| Droits d'accès | ✅ | Tous visiteurs anonymes, sans compte |
| Données personnelles (RGPD) | ⚠️ | Aucun journal, mais IP traitée en mémoire (R2) et aucune information publiée (R7) |
| Sécurité | ⚠️ | IP falsifiable (R2), en-têtes de sécurité et cache (R5) |
| Non-fonctionnel | ⚠️ | Français et responsive fixés ; accessibilité absente (R9) |
| Cohérence | ✅ | Aligné avec la revue croisée ; la règle de panne est reprise par S01 |
| Dépendances | ✅ | Valkey, Traefik ; aucune spec amont |
